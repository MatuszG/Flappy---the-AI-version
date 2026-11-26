/**
 * Lightweight bottleneck profiler for ResearchPool + Research Workers + GPU Worker.
 * Tracks worker concurrency, CPU duty cycle, per-kernel GPU latency (avg/p95/max),
 * anti-freeze governor behavior, per-architecture throughput (CPU vs GPU),
 * live Auto-Tuner A/B/C probe results, 30s thermal/throughput timeline, and event-loop lag.
 */

import { computeEfficiencyMetrics } from './powerProfile';
import type {
  ComputeBackend,
  NetworkArchitecture,
  PerfReportSnapshot,
} from './types';
import type { GpuKernelKind } from './webgpuEvaluator';

export interface WorkerTrialPerfStats {
  trainCpuMs: number;
  preScreenCpuMs: number;
  localAuditCpuMs: number;
  overheadCpuMs: number;
  trialWallMs: number;
  auditWaitWallMs: number;
  preScreenCalls: number;
  preScreenRejects: number;
  parallelAuditRequests: number;
  trainingTicks: number;
  auditTicks: number;
  auditCacheHits?: number;
}

export interface ConcurrencySample {
  trainRunning: number;
  trainAwaitingIdle: number;
  trainHelpingAudit: number;
  trainIdle: number;
  auditHelperBusy: number;
  auditHelperIdle: number;
  auditQueueLen: number;
  gpuVerifyQueueLen?: number;
  parallelAuditActive: boolean;
}

export interface AutoTuneProbeMetrics {
  mode: 'CPU' | 'GPU' | 'HYBRID';
  durationSec: number;
  ticksMPerSec: number;
  gpuTicksMPerSec: number;
  cpuTicksMPerSec: number;
  trialsPerSec: number;
  avgGpuBatchMs: number;
  avgLoopLagMs: number;
  smoothScore: number;
}

export interface AutoTuneSummary {
  probes: AutoTuneProbeMetrics[];
  winner: 'CPU' | 'GPU' | 'HYBRID';
  reason: string;
}

interface KernelMetrics {
  dispatches: number;
  tasks: number;
  ticks: number;
  dispatchMs: number;
  maxMs: number;
  heavyWaves: number;
  samplesMs: number[];
}

interface ArchMetrics {
  cpuTrials: number;
  cpuG1: number;
  cpuTicks: number;
  gpuTrials: number;
  gpuG1: number;
  gpuTicks: number;
}

interface TimelineBucket {
  cpuTicks: number;
  gpuTicks: number;
  trials: number;
}

const KERNEL_NAMES: Record<GpuKernelKind, string> = {
  0: 'FAST_REGISTER (MLP D0-1)',
  1: 'COMPACT_DEEP (D2-5 ≤8w)',
  2: 'DEEP_24 (D2-5 ≤24w)',
  3: 'BIO_TINY (≤8w / ≤12n)',
  4: 'BIO_STD (≤16w / ≤24n)',
  5: 'BIO_MED (≤32w / ≤36n)',
  6: 'BIO_LARGE (≤64w / ≤64n)',
  7: 'DEEP_64 (MLP ≤64w)',
};

function createEmptyKernelMetrics(): KernelMetrics {
  return {
    dispatches: 0,
    tasks: 0,
    ticks: 0,
    dispatchMs: 0,
    maxMs: 0,
    heavyWaves: 0,
    samplesMs: [],
  };
}

function computeP95(samples: number[]): number {
  if (samples.length === 0) return 0;
  const sorted = samples.slice().sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  return sorted[idx];
}

export class SweepPerfProfiler {
  private startedAtMs = 0;
  private activeSegmentStartMs = 0;
  private accumulatedActiveMs = 0;
  private isPaused = false;
  private hardwareCores = 0;
  private trainWorkerCount = 0;
  private auditWorkerCount = 0;
  private parallelAuditActive = false;
  private parallelTailTriggered = false;
  private computeBackend: ComputeBackend = 'CPU';
  private effectiveBackend: 'CPU' | 'GPU' | 'HYBRID' = 'CPU';
  private priorityLevel = 70;
  private priorityLabel = 'Balanced';
  private autoTuneSummary: AutoTuneSummary | null = null;

  // GPU compute counters (WebGPU / WebGL2)
  private gpuLabel = '';
  private gpuIsIntegrated = false;
  private gpuError = '';
  private gpuDispatches = 0;
  private gpuTasks = 0;
  private gpuTicks = 0;
  private gpuDispatchMs = 0;
  private gpuTrialsCompleted = 0;
  private gpuG1PerfectTrials = 0;
  private gpuCpuVerifyMs = 0;
  private gpuCpuAuditTicks = 0;
  private gpuActiveTrials = 0;
  private gpuWaveBudgetLast = 0;
  private gpuMaxInFlightLast = 2;
  private gpuHeavyWaves = 0;
  private gpuBreathCount = 0;
  private gpuBreathMs = 0;
  private gpuAwaitingVerifySum = 0;
  private gpuAwaitingVerifyMax = 0;
  private gpuKernelStats: Record<GpuKernelKind, KernelMetrics> = {
    0: createEmptyKernelMetrics(),
    1: createEmptyKernelMetrics(),
    2: createEmptyKernelMetrics(),
    3: createEmptyKernelMetrics(),
    4: createEmptyKernelMetrics(),
    5: createEmptyKernelMetrics(),
    6: createEmptyKernelMetrics(),
    7: createEmptyKernelMetrics(),
  };

  // Per-architecture counters (CPU vs GPU)
  private archStats = new Map<NetworkArchitecture, ArchMetrics>();

  // Rolling 30s throughput timeline (exposes thermal/TDP throttling over long runs)
  private timelineBuckets: TimelineBucket[] = [];

  // Periodic concurrency samples
  private sampleCount = 0;
  private sumTrainRunning = 0;
  private sumTrainAwaitingIdle = 0;
  private sumTrainHelpingAudit = 0;
  private sumTrainIdle = 0;
  private sumAuditHelperBusy = 0;
  private sumAuditHelperIdle = 0;
  private sumAuditQueueLen = 0;
  private maxAuditQueueLen = 0;
  private sumGpuVerifyQueueLen = 0;
  private maxGpuVerifyQueueLen = 0;

  // Main-thread real event loop lag (measures React render + GC + layout stalls)
  private timerTickCount = 0;
  private eventLoopLagTotalMs = 0;
  private eventLoopLagMaxMs = 0;
  private longLagTicks = 0; // ticks delayed >= 40ms
  private lagSamplesMs: number[] = [];
  private recentCpuDeltaTicks = 0;
  private recentGpuDeltaTicks = 0;
  private recentWindowStartMs = 0;
  private liveTicksPerSecCached = 0;

  // Worker-side CPU & event counters
  private trialsCompleted = 0;
  private g1PerfectTrials = 0;
  private totalTrainCpuMs = 0;
  private totalPreScreenCpuMs = 0;
  private totalLocalAuditCpuMs = 0;
  private totalOverheadCpuMs = 0;
  private totalTrialWallMs = 0;
  private totalAuditWaitWallMs = 0;
  private totalPreScreenCalls = 0;
  private totalPreScreenRejects = 0;
  private totalParallelAuditRequests = 0;
  private totalTrainingTicks = 0;
  private totalAuditTicks = 0;
  private totalAuditCacheHits = 0;
  private gpuAuditCacheHits = 0;

  // Parallel audit seed metrics
  private auditSeedsCompleted = 0;
  private auditSeedsCancelled = 0;
  private auditSeedsSurvived = 0;
  private totalAuditSeedCpuMs = 0;
  private totalAuditSeedWallMs = 0;
  private maxAuditSeedWallMs = 0;

  // Main-thread handler & UI flush latency
  private poolMsgCount = 0;
  private poolMsgTotalMs = 0;
  private poolMsgMaxMs = 0;
  private uiFlushCount = 0;
  private uiFlushTotalMs = 0;
  private uiFlushMaxMs = 0;
  private lastConsoleLogMs = 0;

  reset(meta: {
    hardwareCores: number;
    trainWorkerCount: number;
    auditWorkerCount: number;
    parallelAuditActive: boolean;
    computeBackend?: ComputeBackend;
    priorityLevel?: number;
    priorityLabel?: string;
  }): void {
    this.startedAtMs = performance.now();
    this.activeSegmentStartMs = this.startedAtMs;
    this.accumulatedActiveMs = 0;
    this.isPaused = false;
    this.lastConsoleLogMs = this.startedAtMs;
    this.recentWindowStartMs = this.startedAtMs;
    this.recentCpuDeltaTicks = 0;
    this.recentGpuDeltaTicks = 0;
    this.liveTicksPerSecCached = 0;
    this.hardwareCores = meta.hardwareCores;
    this.trainWorkerCount = meta.trainWorkerCount;
    this.auditWorkerCount = meta.auditWorkerCount;
    this.parallelAuditActive = meta.parallelAuditActive;
    this.parallelTailTriggered = meta.parallelAuditActive;
    this.computeBackend = meta.computeBackend ?? 'CPU';
    this.priorityLevel = meta.priorityLevel ?? 70;
    this.priorityLabel = meta.priorityLabel ?? 'Balanced';
    this.effectiveBackend =
      meta.computeBackend === 'GPU' || meta.computeBackend === 'HYBRID'
        ? meta.computeBackend
        : 'CPU';
    this.autoTuneSummary = null;

    this.gpuLabel = '';
    this.gpuIsIntegrated = false;
    this.gpuError = '';
    this.gpuDispatches = 0;
    this.gpuTasks = 0;
    this.gpuTicks = 0;
    this.gpuDispatchMs = 0;
    this.gpuTrialsCompleted = 0;
    this.gpuG1PerfectTrials = 0;
    this.gpuCpuVerifyMs = 0;
    this.gpuCpuAuditTicks = 0;
    this.gpuActiveTrials = 0;
    this.gpuWaveBudgetLast = 0;
    this.gpuMaxInFlightLast = 2;
    this.gpuHeavyWaves = 0;
    this.gpuBreathCount = 0;
    this.gpuBreathMs = 0;
    this.gpuAwaitingVerifySum = 0;
    this.gpuAwaitingVerifyMax = 0;
    this.gpuKernelStats = {
      0: createEmptyKernelMetrics(),
      1: createEmptyKernelMetrics(),
      2: createEmptyKernelMetrics(),
      3: createEmptyKernelMetrics(),
      4: createEmptyKernelMetrics(),
      5: createEmptyKernelMetrics(),
      6: createEmptyKernelMetrics(),
      7: createEmptyKernelMetrics(),
    };

    this.archStats.clear();
    this.timelineBuckets = [];

    this.sampleCount = 0;
    this.sumTrainRunning = 0;
    this.sumTrainAwaitingIdle = 0;
    this.sumTrainHelpingAudit = 0;
    this.sumTrainIdle = 0;
    this.sumAuditHelperBusy = 0;
    this.sumAuditHelperIdle = 0;
    this.sumAuditQueueLen = 0;
    this.maxAuditQueueLen = 0;
    this.sumGpuVerifyQueueLen = 0;
    this.maxGpuVerifyQueueLen = 0;

    this.timerTickCount = 0;
    this.eventLoopLagTotalMs = 0;
    this.eventLoopLagMaxMs = 0;
    this.longLagTicks = 0;
    this.lagSamplesMs = [];

    this.trialsCompleted = 0;
    this.g1PerfectTrials = 0;
    this.totalTrainCpuMs = 0;
    this.totalPreScreenCpuMs = 0;
    this.totalLocalAuditCpuMs = 0;
    this.totalOverheadCpuMs = 0;
    this.totalTrialWallMs = 0;
    this.totalAuditWaitWallMs = 0;
    this.totalPreScreenCalls = 0;
    this.totalPreScreenRejects = 0;
    this.totalParallelAuditRequests = 0;
    this.totalTrainingTicks = 0;
    this.totalAuditTicks = 0;
    this.totalAuditCacheHits = 0;
    this.gpuAuditCacheHits = 0;

    this.auditSeedsCompleted = 0;
    this.auditSeedsCancelled = 0;
    this.auditSeedsSurvived = 0;
    this.totalAuditSeedCpuMs = 0;
    this.totalAuditSeedWallMs = 0;
    this.maxAuditSeedWallMs = 0;

    this.poolMsgCount = 0;
    this.poolMsgTotalMs = 0;
    this.poolMsgMaxMs = 0;
    this.uiFlushCount = 0;
    this.uiFlushTotalMs = 0;
    this.uiFlushMaxMs = 0;
  }

  private getActiveWallMs(): number {
    if (this.startedAtMs === 0) return 1;
    const activeSeg = this.isPaused
      ? 0
      : Math.max(0, performance.now() - this.activeSegmentStartMs);
    return Math.max(1, this.accumulatedActiveMs + activeSeg);
  }

  pause(): void {
    if (this.isPaused || this.startedAtMs === 0) return;
    const now = performance.now();
    this.accumulatedActiveMs += Math.max(0, now - this.activeSegmentStartMs);
    const winMs = now - this.recentWindowStartMs;
    const recentTotal = this.recentCpuDeltaTicks + this.recentGpuDeltaTicks;
    if (winMs >= 250 && recentTotal > 0) {
      const instant = (recentTotal / winMs) * 1000;
      this.liveTicksPerSecCached =
        this.liveTicksPerSecCached > 0
          ? this.liveTicksPerSecCached * 0.45 + instant * 0.55
          : instant;
    }
    this.recentCpuDeltaTicks = 0;
    this.recentGpuDeltaTicks = 0;
    this.recentWindowStartMs = now;
    this.isPaused = true;
  }

  resume(): void {
    if (!this.isPaused || this.startedAtMs === 0) return;
    const now = performance.now();
    this.activeSegmentStartMs = now;
    this.recentWindowStartMs = now;
    this.recentCpuDeltaTicks = 0;
    this.recentGpuDeltaTicks = 0;
    this.lastConsoleLogMs = now;
    this.isPaused = false;
  }

  resetLiveWindow(): void {
    const now = performance.now();
    this.recentWindowStartMs = now;
    this.recentCpuDeltaTicks = 0;
    this.recentGpuDeltaTicks = 0;
    this.liveTicksPerSecCached = 0;
  }

  private getOrCreateTimelineBucket(): TimelineBucket {
    const elapsedSec = Math.max(0, this.getActiveWallMs() / 1000);
    const idx = Math.min(240, Math.floor(elapsedSec / 30));
    while (this.timelineBuckets.length <= idx) {
      this.timelineBuckets.push({ cpuTicks: 0, gpuTicks: 0, trials: 0 });
    }
    return this.timelineBuckets[idx];
  }

  private getOrCreateArchMetrics(arch: NetworkArchitecture): ArchMetrics {
    let entry = this.archStats.get(arch);
    if (!entry) {
      entry = {
        cpuTrials: 0,
        cpuG1: 0,
        cpuTicks: 0,
        gpuTrials: 0,
        gpuG1: 0,
        gpuTicks: 0,
      };
      this.archStats.set(arch, entry);
    }
    return entry;
  }

  setGpuLabel(label: string, isIntegrated = false): void {
    this.gpuLabel = label;
    this.gpuIsIntegrated = isIntegrated;
  }

  setGpuError(message: string): void {
    this.gpuError = message;
  }

  setWorkerCounts(
    trainCount: number,
    auditCount: number,
    effectiveBackend?: 'CPU' | 'GPU' | 'HYBRID'
  ): void {
    this.trainWorkerCount = trainCount;
    this.auditWorkerCount = auditCount;
    if (effectiveBackend) this.effectiveBackend = effectiveBackend;
  }

  setPowerProfile(priorityLevel: number, priorityLabel: string): void {
    this.priorityLevel = priorityLevel;
    this.priorityLabel = priorityLabel;
  }

  recordAutoTuneSummary(summary: AutoTuneSummary): void {
    this.autoTuneSummary = summary;
    this.effectiveBackend = summary.winner;
  }

  recordCpuDeltaTicks(deltaTicks: number): void {
    if (deltaTicks <= 0) return;
    this.getOrCreateTimelineBucket().cpuTicks += deltaTicks;
    this.recentCpuDeltaTicks += deltaTicks;
  }

  recordGpuBatch(
    tasks: number,
    ticks: number,
    dispatchMs: number,
    activeTrials: number,
    kernelKind: GpuKernelKind = 0,
    waveWeightBudget = 0,
    maxInFlightWaves = 2,
    breathMs = 0,
    awaitingVerifyCount = 0
  ): void {
    this.gpuDispatches += 1;
    this.gpuTasks += tasks;
    this.gpuTicks += ticks;
    this.gpuDispatchMs += dispatchMs;
    this.gpuActiveTrials = activeTrials;
    if (waveWeightBudget > 0) this.gpuWaveBudgetLast = waveWeightBudget;
    this.gpuMaxInFlightLast = maxInFlightWaves;
    const isDiscreteWebGpu =
      !this.gpuIsIntegrated && !this.gpuLabel.startsWith('WebGL2');
    const heavyThreshold = this.gpuIsIntegrated
      ? 42
      : isDiscreteWebGpu
        ? 130
        : 68;
    if (dispatchMs > heavyThreshold) this.gpuHeavyWaves += 1;
    if (breathMs > 0) {
      this.gpuBreathCount += 1;
      this.gpuBreathMs += breathMs;
    }
    this.gpuAwaitingVerifySum += awaitingVerifyCount;
    if (awaitingVerifyCount > this.gpuAwaitingVerifyMax) {
      this.gpuAwaitingVerifyMax = awaitingVerifyCount;
    }

    const km = this.gpuKernelStats[kernelKind];
    km.dispatches += 1;
    km.tasks += tasks;
    km.ticks += ticks;
    km.dispatchMs += dispatchMs;
    if (dispatchMs > km.maxMs) km.maxMs = dispatchMs;
    if (dispatchMs > heavyThreshold) km.heavyWaves += 1;
    if (km.samplesMs.length < 512) {
      km.samplesMs.push(dispatchMs);
    } else {
      km.samplesMs[km.dispatches % 512] = dispatchMs;
    }

    this.getOrCreateTimelineBucket().gpuTicks += ticks;
    this.recentGpuDeltaTicks += ticks;
  }

  recordGpuTrialDone(
    isG1Perfect: boolean,
    cpuVerifyMs: number,
    cpuAuditTicks = 0,
    architecture: NetworkArchitecture = 'MLP',
    totalTicks = 0,
    auditCacheHits = 0
  ): void {
    this.gpuTrialsCompleted += 1;
    if (isG1Perfect) this.gpuG1PerfectTrials += 1;
    this.gpuCpuVerifyMs += cpuVerifyMs;
    this.gpuCpuAuditTicks += cpuAuditTicks;
    this.gpuAuditCacheHits += auditCacheHits;
    const am = this.getOrCreateArchMetrics(architecture);
    am.gpuTrials += 1;
    if (isG1Perfect) am.gpuG1 += 1;
    am.gpuTicks += totalTicks;
    const bucket = this.getOrCreateTimelineBucket();
    bucket.trials += 1;
    if (cpuAuditTicks > 0) bucket.gpuTicks += cpuAuditTicks;
  }

  recordTimerTick(expectedMs: number, actualDeltaMs: number): void {
    if (this.isPaused) return;
    this.timerTickCount += 1;
    const lag = Math.max(0, actualDeltaMs - expectedMs);
    this.eventLoopLagTotalMs += lag;
    if (lag > this.eventLoopLagMaxMs) this.eventLoopLagMaxMs = lag;
    if (lag >= 40) this.longLagTicks += 1;
    if (this.lagSamplesMs.length < 1024) {
      this.lagSamplesMs.push(lag);
    } else {
      this.lagSamplesMs[this.timerTickCount % 1024] = lag;
    }

    const now = performance.now();
    const winMs = now - this.recentWindowStartMs;
    if (winMs >= 1500) {
      const recentTotal = this.recentCpuDeltaTicks + this.recentGpuDeltaTicks;
      const instant = (recentTotal / winMs) * 1000;
      this.liveTicksPerSecCached =
        this.liveTicksPerSecCached > 0
          ? this.liveTicksPerSecCached * 0.45 + instant * 0.55
          : instant;
      this.recentCpuDeltaTicks = 0;
      this.recentGpuDeltaTicks = 0;
      this.recentWindowStartMs = now;
    }
  }

  recordSample(s: ConcurrencySample): void {
    this.sampleCount += 1;
    this.parallelAuditActive = s.parallelAuditActive;
    if (s.parallelAuditActive) this.parallelTailTriggered = true;
    this.sumTrainRunning += s.trainRunning;
    this.sumTrainAwaitingIdle += s.trainAwaitingIdle;
    this.sumTrainHelpingAudit += s.trainHelpingAudit;
    this.sumTrainIdle += s.trainIdle;
    this.sumAuditHelperBusy += s.auditHelperBusy;
    this.sumAuditHelperIdle += s.auditHelperIdle;
    this.sumAuditQueueLen += s.auditQueueLen;
    if (s.auditQueueLen > this.maxAuditQueueLen) {
      this.maxAuditQueueLen = s.auditQueueLen;
    }
    const gvLen = s.gpuVerifyQueueLen ?? 0;
    this.sumGpuVerifyQueueLen += gvLen;
    if (gvLen > this.maxGpuVerifyQueueLen) {
      this.maxGpuVerifyQueueLen = gvLen;
    }
  }

  recordTrialDone(
    perf: WorkerTrialPerfStats,
    isG1Perfect: boolean,
    architecture: NetworkArchitecture = 'MLP'
  ): void {
    this.trialsCompleted += 1;
    if (isG1Perfect) this.g1PerfectTrials += 1;
    this.totalTrainCpuMs += perf.trainCpuMs;
    this.totalPreScreenCpuMs += perf.preScreenCpuMs;
    this.totalLocalAuditCpuMs += perf.localAuditCpuMs;
    this.totalOverheadCpuMs += perf.overheadCpuMs;
    this.totalTrialWallMs += perf.trialWallMs;
    this.totalAuditWaitWallMs += perf.auditWaitWallMs;
    this.totalPreScreenCalls += perf.preScreenCalls;
    this.totalPreScreenRejects += perf.preScreenRejects;
    this.totalParallelAuditRequests += perf.parallelAuditRequests;
    this.totalTrainingTicks += perf.trainingTicks;
    this.totalAuditTicks += perf.auditTicks;
    this.totalAuditCacheHits += perf.auditCacheHits ?? 0;

    const am = this.getOrCreateArchMetrics(architecture);
    am.cpuTrials += 1;
    if (isG1Perfect) am.cpuG1 += 1;
    am.cpuTicks += perf.trainingTicks + perf.auditTicks;
    this.getOrCreateTimelineBucket().trials += 1;
  }

  recordAuditSeedDone(cpuMs: number, wallMs: number, survived: boolean): void {
    this.auditSeedsCompleted += 1;
    if (survived) this.auditSeedsSurvived += 1;
    this.totalAuditSeedCpuMs += cpuMs;
    this.totalAuditSeedWallMs += wallMs;
    if (wallMs > this.maxAuditSeedWallMs) {
      this.maxAuditSeedWallMs = wallMs;
    }
  }

  recordAuditSeedCancelled(): void {
    this.auditSeedsCancelled += 1;
  }

  recordPoolMessageMs(ms: number): void {
    this.poolMsgCount += 1;
    this.poolMsgTotalMs += ms;
    if (ms > this.poolMsgMaxMs) this.poolMsgMaxMs = ms;
  }

  recordUiFlushMs(ms: number): void {
    this.uiFlushCount += 1;
    this.uiFlushTotalMs += ms;
    if (ms > this.uiFlushMaxMs) this.uiFlushMaxMs = ms;
  }

  hasData(): boolean {
    return (
      this.startedAtMs > 0 &&
      (this.sampleCount > 0 ||
        this.trialsCompleted > 0 ||
        this.gpuTrialsCompleted > 0 ||
        this.gpuDispatches > 0)
    );
  }

  maybeLogPeriodic(intervalMs = 5000): void {
    if (this.isPaused || !this.hasData()) return;
    const now = performance.now();
    if (now - this.lastConsoleLogMs < intervalMs) return;
    this.lastConsoleLogMs = now;
    this.logToConsole('periodic');
  }

  logToConsole(tag: string): void {
    if (!this.hasData()) return;
    const report = this.buildReport();
    // eslint-disable-next-line no-console
    console.groupCollapsed(`[NeuroLab Perf/${tag}] ${report.summaryLine}`);
    // eslint-disable-next-line no-console
    console.log(report.markdown);
    // eslint-disable-next-line no-console
    console.groupEnd();
  }

  buildReport(): { summaryLine: string; markdown: string } {
    const wallMs = this.getActiveWallMs();
    const wallSec = wallMs / 1000;
    const totalWorkers = this.trainWorkerCount + this.auditWorkerCount;
    const n = Math.max(1, this.sampleCount);

    const avgTrainRun = this.sumTrainRunning / n;
    const avgTrainAwaitIdle = this.sumTrainAwaitingIdle / n;
    const avgTrainHelpAudit = this.sumTrainHelpingAudit / n;
    const avgTrainIdle = this.sumTrainIdle / n;
    const avgAuditBusy = this.sumAuditHelperBusy / n;
    const avgAuditIdle = this.sumAuditHelperIdle / n;
    const avgBusyWorkers = avgTrainRun + avgTrainHelpAudit + avgAuditBusy;
    const avgQueueLen = this.sumAuditQueueLen / n;
    const avgGpuVerifyQLen = this.sumGpuVerifyQueueLen / n;

    const totalWorkerCpuMs =
      this.totalTrainCpuMs +
      this.totalPreScreenCpuMs +
      this.totalLocalAuditCpuMs +
      this.totalOverheadCpuMs +
      this.totalAuditSeedCpuMs;
    const effectiveCoreUtilPct =
      this.hardwareCores > 0
        ? (totalWorkerCpuMs / (wallMs * this.hardwareCores)) * 100
        : 0;
    const activeWorkerRatioPct =
      (avgBusyWorkers / Math.max(1, this.hardwareCores)) * 100;

    const trialCpuExclWait =
      this.totalTrainCpuMs +
      this.totalPreScreenCpuMs +
      this.totalLocalAuditCpuMs +
      this.totalOverheadCpuMs;
    const trialWallExclWait = Math.max(
      1,
      this.totalTrialWallMs - this.totalAuditWaitWallMs
    );
    const internalDutyPct =
      this.totalTrialWallMs > 0
        ? Math.min(100, (trialCpuExclWait / trialWallExclWait) * 100)
        : 0;

    const totalTrialsAll = this.trialsCompleted + this.gpuTrialsCompleted;
    const totalG1All = this.g1PerfectTrials + this.gpuG1PerfectTrials;
    const trialsPerSec = totalTrialsAll / wallSec;
    const cpuTicksM = (this.totalTrainingTicks + this.totalAuditTicks) / 1e6;
    const gpuTicksM = this.gpuTicks / 1e6;
    const gpuAuditTicksM = this.gpuCpuAuditTicks / 1e6;
    const totalTicksM = cpuTicksM + gpuTicksM + gpuAuditTicksM;
    const ticksMPerSec = totalTicksM / wallSec;
    const gpuWallTicksMPerSec = gpuTicksM / wallSec;
    const gpuKernelTicksMPerSec =
      this.gpuDispatchMs > 0 ? gpuTicksM / (this.gpuDispatchMs / 1000) : 0;
    const avgGpuDispatchMs =
      this.gpuDispatches > 0 ? this.gpuDispatchMs / this.gpuDispatches : 0;
    const avgGpuTasks =
      this.gpuDispatches > 0 ? this.gpuTasks / this.gpuDispatches : 0;
    const avgAwaitingVerify =
      this.gpuDispatches > 0
        ? this.gpuAwaitingVerifySum / this.gpuDispatches
        : 0;

    const preRejectPct =
      this.totalPreScreenCalls > 0
        ? (this.totalPreScreenRejects / this.totalPreScreenCalls) * 100
        : 0;

    const avgPoolMsgMs =
      this.poolMsgCount > 0 ? this.poolMsgTotalMs / this.poolMsgCount : 0;
    const mainThreadIpcPct =
      ((this.poolMsgTotalMs + this.uiFlushTotalMs) / wallMs) * 100;
    const avgUiFlushMs =
      this.uiFlushCount > 0 ? this.uiFlushTotalMs / this.uiFlushCount : 0;
    const avgEventLoopLagMs =
      this.timerTickCount > 0 ? this.eventLoopLagTotalMs / this.timerTickCount : 0;

    const auditModeLabel = this.parallelAuditActive
      ? 'TAIL-PARALLEL'
      : this.parallelTailTriggered
        ? 'ADAPTIVE (tail used)'
        : 'LOCAL-LOCKSTEP';

    const backendLabel =
      this.computeBackend === 'AUTO'
        ? `AUTO->${this.effectiveBackend}`
        : this.computeBackend;

    const summaryLine =
      `wall=${wallSec.toFixed(1)}s | backend=${backendLabel} | ` +
      (this.gpuDispatches > 0
        ? `gpu=${gpuWallTicksMPerSec.toFixed(1)}M/s (${avgGpuDispatchMs.toFixed(0)}ms/b) | `
        : '') +
      `cpu=${effectiveCoreUtilPct.toFixed(0)}% of ${this.hardwareCores}c | ` +
      `trials=${totalTrialsAll} (${trialsPerSec.toFixed(1)}/s) | ticks=${ticksMPerSec.toFixed(1)}M/s | ` +
      `loopLag=${avgEventLoopLagMs.toFixed(1)}ms`;

    const lines = [
      `### NeuroLab Bottleneck Perf Trace (${wallSec.toFixed(1)}s)`,
      `- **Hardware & Pool**: backend=${backendLabel} · ${this.hardwareCores} logical cores · ${this.trainWorkerCount} train + ${this.auditWorkerCount} audit helpers (total ${totalWorkers} CPU workers, auditMode=${auditModeLabel})`,
    ];

    if (this.autoTuneSummary) {
      lines.push(
        `- **Auto-Tuner A/B/C Benchmark**: Winner = **${this.autoTuneSummary.winner}** (${this.autoTuneSummary.reason})`
      );
      for (const p of this.autoTuneSummary.probes) {
        const gpuInfo =
          p.mode === 'CPU'
            ? ''
            : `, gpuBatch=${p.avgGpuBatchMs.toFixed(1)}ms (gpu=${p.gpuTicksMPerSec.toFixed(1)}M/s)`;
        lines.push(
          `  - Probe ${p.mode} (${p.durationSec.toFixed(1)}s): **${p.ticksMPerSec.toFixed(2)}M ticks/s** (${p.trialsPerSec.toFixed(1)} trials/s${gpuInfo}, loopLag=${p.avgLoopLagMs.toFixed(1)}ms → score=${p.smoothScore.toFixed(2)})`
        );
      }
    }

    if (this.computeBackend !== 'CPU' || this.gpuDispatches > 0 || this.gpuError) {
      lines.push(
        `- **GPU Compute**: ${this.gpuLabel || 'GPU Device'}${this.gpuIsIntegrated ? ' [iGPU]' : ''} · ${this.gpuTrialsCompleted} trials (${this.gpuG1PerfectTrials} G1) · active=${this.gpuActiveTrials} concurrent`,
        `  - GPU Throughput: **${gpuTicksM.toFixed(2)}M ticks** (**${gpuWallTicksMPerSec.toFixed(2)}M ticks/s** wall · **${gpuKernelTicksMPerSec.toFixed(2)}M ticks/s** kernel)`,
        `  - GPU Dispatches: ${this.gpuDispatches} batches (avg ${avgGpuTasks.toFixed(0)} tasks, avg ${avgGpuDispatchMs.toFixed(1)}ms/batch, total GPU wait ${(this.gpuDispatchMs / 1000).toFixed(2)}s, f64 CPU verify ${(this.gpuCpuVerifyMs / 1000).toFixed(2)}s / ${gpuAuditTicksM.toFixed(2)}M ticks${this.gpuAuditCacheHits > 0 ? `, ${this.gpuAuditCacheHits} dedup skipped` : ''})`,
        `  - GPU Anti-Freeze & Verify: budget=${this.gpuWaveBudgetLast} · wavesInFlight=${this.gpuMaxInFlightLast} · heavyWaves=${this.gpuHeavyWaves} · breaths=${this.gpuBreathCount} (${this.gpuBreathMs.toFixed(0)}ms) · awaitingVerify avg ${avgAwaitingVerify.toFixed(1)} (max ${this.gpuAwaitingVerifyMax}) · verifyQueue avg ${avgGpuVerifyQLen.toFixed(1)} (max ${this.maxGpuVerifyQueueLen})`
      );
      for (const k of [0, 1, 2, 3, 4, 5, 6, 7] as GpuKernelKind[]) {
        const km = this.gpuKernelStats[k];
        if (km.dispatches === 0) continue;
        const avgKMs = km.dispatchMs / km.dispatches;
        const p95KMs = computeP95(km.samplesMs);
        const avgKTasks = km.tasks / km.dispatches;
        const kTicksPerSec = km.dispatchMs > 0 ? km.ticks / 1e6 / (km.dispatchMs / 1000) : 0;
        lines.push(
          `  - Kernel ${KERNEL_NAMES[k]}: ${km.dispatches} batches · avg ${avgKTasks.toFixed(0)} tasks · avg ${avgKMs.toFixed(1)}ms (p95 ${p95KMs.toFixed(1)}ms, max ${km.maxMs.toFixed(1)}ms) · **${kTicksPerSec.toFixed(2)}M ticks/s**`
        );
      }
      if (this.gpuError) {
        lines.push(`  - **GPU Error / Fallback**: ${this.gpuError}`);
      }
    }

    if (this.archStats.size > 0) {
      lines.push(`- **Architecture Split (CPU vs GPU)**:`);
      for (const [arch, am] of this.archStats.entries()) {
        const cpuPart =
          am.cpuTrials > 0
            ? `CPU=${am.cpuTrials} (${am.cpuG1} G1, ${(am.cpuTicks / 1e6).toFixed(1)}M ticks)`
            : 'CPU=0';
        const gpuPart =
          am.gpuTrials > 0
            ? `GPU=${am.gpuTrials} (${am.gpuG1} G1, ${(am.gpuTicks / 1e6).toFixed(1)}M ticks)`
            : 'GPU=0';
        lines.push(`  - ${arch}: ${cpuPart} · ${gpuPart}`);
      }
    }

    if (this.timelineBuckets.length >= 2) {
      const slice = this.timelineBuckets
        .slice(0, 12)
        .map((b, idx) => {
          const bucketStart = idx * 30;
          const bucketEnd = Math.min(wallSec, (idx + 1) * 30);
          const dur = Math.max(1, bucketEnd - bucketStart);
          const mps = (b.cpuTicks + b.gpuTicks) / 1e6 / dur;
          return `${bucketStart}–${Math.round(bucketEnd)}s: ${mps.toFixed(1)}M/s (${b.trials}t)`;
        })
        .join(' | ');
      lines.push(`- **Throughput Timeline (30s windows)**: ${slice}`);
    }

    lines.push(
      `- **Live Concurrency (avg over ${this.sampleCount} samples)**:`,
      `  - Active CPU threads: **${avgBusyWorkers.toFixed(2)} / ${this.hardwareCores} cores** (${activeWorkerRatioPct.toFixed(1)}% slot occupancy)`,
      `  - Train running: ${avgTrainRun.toFixed(2)} | Train helping audit: ${avgTrainHelpAudit.toFixed(2)} | Audit helpers busy: ${avgAuditBusy.toFixed(2)}`,
      `  - **Stalled awaiting audit (0% CPU)**: ${avgTrainAwaitIdle.toFixed(2)} | Train idle: ${avgTrainIdle.toFixed(2)} | Audit helper idle: ${avgAuditIdle.toFixed(2)}`,
      `  - Audit queue depth: avg ${avgQueueLen.toFixed(1)}, max ${this.maxAuditQueueLen}`,
      `- **Total Throughput**: ${totalTrialsAll} trials (${trialsPerSec.toFixed(2)}/s, ${totalG1All} G1-perfect; CPU=${this.trialsCompleted}, GPU=${this.gpuTrialsCompleted}) · ${totalTicksM.toFixed(2)}M ticks (**${ticksMPerSec.toFixed(2)}M ticks/s**)`,
      `- **CPU Worker Breakdown** (completed CPU trials/seeds; cumulative ${(totalWorkerCpuMs / 1000).toFixed(2)} core-s = **${effectiveCoreUtilPct.toFixed(1)}% of ${this.hardwareCores} cores**, internal worker duty=${internalDutyPct.toFixed(1)}%):`,
      `  - Training CPU: ${(this.totalTrainCpuMs / 1000).toFixed(2)}s`,
      `  - Local Lockstep Audit CPU: ${(this.totalLocalAuditCpuMs / 1000).toFixed(2)}s${this.totalAuditCacheHits > 0 ? ` (${this.totalAuditCacheHits.toLocaleString()} redundant elite/quantized audits skipped via dedup cache)` : ''}`,
      `  - Trial Finalize/Policy CPU: ${(this.totalOverheadCpuMs / 1000).toFixed(2)}s (total trial wall: ${(this.totalTrialWallMs / 1000).toFixed(2)}s)`,
      `  - Pre-screen (64p local) CPU: ${(this.totalPreScreenCpuMs / 1000).toFixed(2)}s (${this.totalPreScreenRejects}/${this.totalPreScreenCalls} rejected = ${preRejectPct.toFixed(1)}%)`,
      `  - Parallel Audit Seed CPU: ${(this.totalAuditSeedCpuMs / 1000).toFixed(2)}s (wall ${(this.totalAuditSeedWallMs / 1000).toFixed(2)}s, max ${this.maxAuditSeedWallMs.toFixed(1)}ms, ${this.auditSeedsCompleted} done / ${this.auditSeedsSurvived} full / ${this.auditSeedsCancelled} cancelled)`,
      `  - Trial wall wait in AUDIT_REQUEST: ${(this.totalAuditWaitWallMs / 1000).toFixed(2)}s across ${this.totalParallelAuditRequests} requests`,
      `- **Main Thread Health**: IPC ${mainThreadIpcPct.toFixed(1)}% wall · **Event-Loop Lag**: avg ${avgEventLoopLagMs.toFixed(1)}ms, max ${this.eventLoopLagMaxMs.toFixed(1)}ms (${this.longLagTicks}/${this.timerTickCount} ticks >=40ms)`,
      `  - Pool IPC handlers: ${this.poolMsgCount} msgs, total ${this.poolMsgTotalMs.toFixed(1)}ms, avg ${avgPoolMsgMs.toFixed(3)}ms, max ${this.poolMsgMaxMs.toFixed(1)}ms`,
      `  - React UI result flushes: ${this.uiFlushCount} flushes, total ${this.uiFlushTotalMs.toFixed(1)}ms, avg ${avgUiFlushMs.toFixed(1)}ms, max ${this.uiFlushMaxMs.toFixed(1)}ms`
    );

    const snapshot = this.buildSnapshot();
    lines.splice(
      2,
      0,
      `- **Power & Thermal Efficiency**: profile=${snapshot.priorityLabel} (${snapshot.priorityLevel}%) · **${snapshot.ticksPerActiveCore.toFixed(2)}M ticks/core** · estPower=${snapshot.estRelPower.toFixed(2)}x · **Perf/W=${snapshot.estPerfPerWatt.toFixed(1)} M/s/W** · thermal=${snapshot.thermalStatus}${snapshot.thermalDriftPct !== null ? ` (${snapshot.thermalDriftPct >= 0 ? '+' : ''}${snapshot.thermalDriftPct.toFixed(1)}% late vs peak)` : ''}`
    );

    return {
      summaryLine,
      markdown: lines.join('\n'),
    };
  }

  getLiveTelemetry(activeWorkersNow: number, gpuActiveNow: boolean): {
    ticksPerSec: number;
    ticksPerCore: number;
    estPerfPerWatt: number;
  } {
    const wallSec = Math.max(0.5, this.getActiveWallMs() / 1000);
    const totalTicks =
      this.totalTrainingTicks +
      this.totalAuditTicks +
      this.gpuTicks +
      this.gpuCpuAuditTicks;
    const fallbackRate = totalTicks / wallSec;
    const tps =
      this.liveTicksPerSecCached > 0 ? this.liveTicksPerSecCached : fallbackRate;
    const mps = tps / 1e6;
    const eff = computeEfficiencyMetrics({
      ticksMPerSec: mps,
      avgActiveCores: Math.max(0.5, activeWorkersNow),
      hardwareCores: Math.max(2, this.hardwareCores),
      internalDutyFraction: 0.95,
      gpuWaitWallFraction: gpuActiveNow ? 0.5 : 0,
      gpuIsIntegrated: this.gpuIsIntegrated,
      windowMpsList: [],
    });
    return {
      ticksPerSec: Math.round(tps),
      ticksPerCore: Number(eff.ticksPerActiveCore.toFixed(2)),
      estPerfPerWatt: Number(eff.estPerfPerWatt.toFixed(1)),
    };
  }

  buildSnapshot(): PerfReportSnapshot {
    const wallMs = this.getActiveWallMs();
    const wallSec = wallMs / 1000;
    const n = Math.max(1, this.sampleCount);

    const avgTrainRun = this.sumTrainRunning / n;
    const avgTrainHelpAudit = this.sumTrainHelpingAudit / n;
    const avgAuditBusy = this.sumAuditHelperBusy / n;
    const avgActiveCores = avgTrainRun + avgTrainHelpAudit + avgAuditBusy;
    const coreOccupancyPct =
      (avgActiveCores / Math.max(1, this.hardwareCores)) * 100;

    const trialCpuExclWait =
      this.totalTrainCpuMs +
      this.totalPreScreenCpuMs +
      this.totalLocalAuditCpuMs +
      this.totalOverheadCpuMs;
    const trialWallExclWait = Math.max(
      1,
      this.totalTrialWallMs - this.totalAuditWaitWallMs
    );
    const internalDutyPct =
      this.totalTrialWallMs > 0
        ? Math.min(100, (trialCpuExclWait / trialWallExclWait) * 100)
        : 0;

    const totalTrialsAll = this.trialsCompleted + this.gpuTrialsCompleted;
    const totalG1All = this.g1PerfectTrials + this.gpuG1PerfectTrials;
    const cpuTicksM = (this.totalTrainingTicks + this.totalAuditTicks) / 1e6;
    const gpuTicksM = this.gpuTicks / 1e6;
    const gpuAuditTicksM = this.gpuCpuAuditTicks / 1e6;
    const totalTicksM = cpuTicksM + gpuTicksM + gpuAuditTicksM;
    const ticksMPerSec = totalTicksM / wallSec;
    const gpuTicksMPerSec = gpuTicksM / wallSec;
    const avgGpuBatchMs =
      this.gpuDispatches > 0 ? this.gpuDispatchMs / this.gpuDispatches : 0;

    const windowMps: number[] = [];
    const avgTrialsPerBucket =
      this.timelineBuckets.reduce((sum, b) => sum + b.trials, 0) /
      Math.max(1, this.timelineBuckets.length);
    for (let idx = 0; idx < this.timelineBuckets.length; idx++) {
      const b = this.timelineBuckets[idx];
      const bStart = idx * 30;
      const bEnd = Math.min(wallSec, (idx + 1) * 30);
      const dur = bEnd - bStart;
      const isTailBucket = idx === this.timelineBuckets.length - 1;
      // Skip the last partial bucket if it has negligible trials due to sweep completion/drain
      if (
        isTailBucket &&
        this.timelineBuckets.length > 2 &&
        b.trials < Math.max(10, avgTrialsPerBucket * 0.3)
      ) {
        continue;
      }
      if (dur >= 8) {
        windowMps.push((b.cpuTicks + b.gpuTicks) / 1e6 / dur);
      }
    }

    const gpuWaitWallFraction = Math.min(1, this.gpuDispatchMs / wallMs);
    const eff = computeEfficiencyMetrics({
      ticksMPerSec,
      avgActiveCores: Math.max(0.5, avgActiveCores || this.trainWorkerCount),
      hardwareCores: Math.max(2, this.hardwareCores),
      internalDutyFraction: internalDutyPct > 0 ? internalDutyPct / 100 : 0.95,
      gpuWaitWallFraction,
      gpuIsIntegrated: this.gpuIsIntegrated,
      windowMpsList: windowMps,
    });

    const totalCpuAccounted = Math.max(
      1,
      this.totalTrainCpuMs +
        this.totalLocalAuditCpuMs +
        this.totalPreScreenCpuMs +
        this.totalAuditSeedCpuMs +
        this.totalOverheadCpuMs
    );
    const trainCpuPct = (this.totalTrainCpuMs / totalCpuAccounted) * 100;
    const auditCpuPct =
      ((this.totalLocalAuditCpuMs +
        this.totalPreScreenCpuMs +
        this.totalAuditSeedCpuMs) /
        totalCpuAccounted) *
      100;

    const sortedLags = this.lagSamplesMs.slice().sort((a, b) => a - b);
    const p95LoopLagMs =
      sortedLags.length > 0
        ? sortedLags[Math.min(sortedLags.length - 1, Math.floor(sortedLags.length * 0.95))]
        : 0;
    const p99LoopLagMs =
      sortedLags.length > 0
        ? sortedLags[Math.min(sortedLags.length - 1, Math.floor(sortedLags.length * 0.99))]
        : 0;
    const avgLoopLagMs =
      this.timerTickCount > 0 ? this.eventLoopLagTotalMs / this.timerTickCount : 0;

    const backendLabel =
      this.computeBackend === 'AUTO'
        ? `AUTO->${this.effectiveBackend}`
        : this.computeBackend;

    return {
      wallSec: Number(wallSec.toFixed(2)),
      backendLabel,
      priorityLevel: this.priorityLevel,
      priorityLabel: this.priorityLabel,
      hardwareCores: this.hardwareCores,
      trainWorkers: this.trainWorkerCount,
      auditWorkers: this.auditWorkerCount,
      avgActiveCores: Number(avgActiveCores.toFixed(2)),
      coreOccupancyPct: Number(coreOccupancyPct.toFixed(1)),
      internalDutyPct: Number(internalDutyPct.toFixed(1)),
      totalTrials: totalTrialsAll,
      cpuTrials: this.trialsCompleted,
      gpuTrials: this.gpuTrialsCompleted,
      g1PerfectTrials: totalG1All,
      trialsPerSec: Number((totalTrialsAll / wallSec).toFixed(2)),
      totalTicksM: Number(totalTicksM.toFixed(2)),
      ticksMPerSec: Number(ticksMPerSec.toFixed(2)),
      ticksPerActiveCore: Number(eff.ticksPerActiveCore.toFixed(2)),
      estRelPower: Number(eff.estRelPower.toFixed(2)),
      estPerfPerWatt: Number(eff.estPerfPerWatt.toFixed(1)),
      thermalDriftPct:
        eff.thermalDriftPct !== null
          ? Number(eff.thermalDriftPct.toFixed(1))
          : null,
      thermalStatus: eff.thermalStatus,
      peakWindowMps: Number(eff.peakWindowMps.toFixed(2)),
      lateWindowMps: Number(eff.lateWindowMps.toFixed(2)),
      trainCpuPct: Number(trainCpuPct.toFixed(1)),
      auditCpuPct: Number(auditCpuPct.toFixed(1)),
      avgLoopLagMs: Number(avgLoopLagMs.toFixed(1)),
      p95LoopLagMs: Number(p95LoopLagMs.toFixed(1)),
      p99LoopLagMs: Number(p99LoopLagMs.toFixed(1)),
      maxLoopLagMs: Number(this.eventLoopLagMaxMs.toFixed(1)),
      longLagTicks: this.longLagTicks,
      timerTicks: this.timerTickCount,
      gpuTicksMPerSec: Number(gpuTicksMPerSec.toFixed(2)),
      avgGpuBatchMs: Number(avgGpuBatchMs.toFixed(1)),
    };
  }
}
