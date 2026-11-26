import {
  calculateParameterCount,
  formatTopologyLabel,
  getTrialComputeProfile,
  isCpuSpecializedTrial,
  isGpuBioTopologySupported,
  isWebGl2BioTopologySupported,
  normalizeHiddenLayers,
} from './neuralNetwork';
import {
  SweepPerfProfiler,
  type AutoTuneProbeMetrics,
} from './perfProfiler';
import {
  resolvePowerProfile,
  type PowerProfilePlan,
} from './powerProfile';
import {
  CLASSIC_5_SENSOR_FEATURES,
  formatInputSubsetKey,
  hasLookaheadSensor,
  isClassic5SensorSet,
  normalizeInputFeatures,
} from './sensors';
import {
  analyzeSmartPrune,
  createSmartPruneContext,
  getAllActiveAlgorithms,
  getTrialPruneReason,
  resolveAlgorithmsForArchitecture,
  resolveCurriculumOptions,
  resolveMorphModesForArchitecture,
  resolvePerceptionModesForArchitecture,
  resolveReasoningStepsForArchitecture,
  resolveShapedFitnessOptions,
  resolveTopologiesForArchitecture,
  type SmartPruneContext,
} from './smartPrune';
import type {
  GpuQueuedTrialItem,
  GpuWorkerInbound,
  GpuWorkerOutbound,
} from './gpu.worker';
import type {
  AggregatedAuditResult,
  ResearchWorkerInbound,
  ResearchWorkerOutbound,
  TrialSpec,
} from './research.worker';
import type {
  ComputeBackend,
  DifficultyPreset,
  EnvironmentConfig,
  EvolutionTopologyMode,
  LearningAlgorithm,
  NetworkArchitecture,
  PerceptionMode,
  PerfReportSnapshot,
  ResearchProgress,
  ResearchSweepConfig,
  ResearchTrialResult,
  SensorFeatureId,
  SerializedNeuralNetwork,
  SmartPruneBreakdown,
  WeightPrecision,
  WorkerSlotProgress,
} from './types';

export interface ResearchPoolCallbacks {
  onProgress: (progress: ResearchProgress) => void;
  onTrialComplete: (trial: ResearchTrialResult) => void;
  onSweepComplete: (progress: ResearchProgress) => void;
}

interface QueuedTrial {
  trialIndex: number;
  spec: TrialSpec;
}

interface WorkerEntry {
  workerId: number;
  role: 'TRAIN' | 'AUDIT';
  worker: Worker;
  busy: boolean;
  busyKind: 'IDLE' | 'TRIAL' | 'AUDIT_SEED';
  inflightCount: number;
  inflightItems: QueuedTrial[];
  awaitingAudit: boolean;
  runningAuditSeed: boolean;
  activeAuditId: number | null;
  activeAuditSeed: QueuedAuditSeed | null;
  activeGpuVerify: QueuedGpuVerify | null;
  startedAtMs: number;
  slot: WorkerSlotProgress;
}

interface QueuedAuditSeed {
  poolAuditId: number;
  seedIndex: number;
  seed: number;
  brain: SerializedNeuralNetwork;
  difficulty: DifficultyPreset;
  targetPipeCap: number;
  customEnvironment?: EnvironmentConfig;
}

interface QueuedGpuVerify {
  reqId: number;
  brain: SerializedNeuralNetwork;
  difficulty: DifficultyPreset;
  targetPipeCap: number;
  verificationSeeds: number;
  customEnvironment?: EnvironmentConfig;
  failFast: boolean;
}

interface PendingAuditJob {
  poolAuditId: number;
  requesterEntry: WorkerEntry;
  workerAuditId: number;
  verificationSeeds: number;
  failFast: boolean;
  startedAtMs: number;
  completedSeeds: number;
  totalTicks: number;
  scoresBySeed: (number | null)[];
  allSurvived: boolean;
  settled: boolean;
}

type QueueBucketKind =
  | 'CPU_ONLY'
  | 'FAST_HARD'
  | 'FAST'
  | 'COMPACT_DEEP'
  | 'DEEP_WIDE'
  | 'BIO';

const FRONTIER_DIFFICULTIES = new Set<string>([
  'MOVING_GUSTS',
  'DYNAMIC_GAPS',
  'MOVING_GAPS',
  'INSANE',
  'GUST_CHAOS',
  'TURBULENCE_EXTREME',
]);

function isFrontierDifficulty(diff: string): boolean {
  return FRONTIER_DIFFICULTIES.has(diff);
}

interface PrePair {
  algorithm: LearningAlgorithm;
  difficulty: DifficultyPreset;
  adPrefix: string;
}

interface PreShape {
  architecture: NetworkArchitecture;
  topology: number[];
  inputFeatures: SensorFeatureId[];
  topoLabel: string;
  inKey: string;
  inSuffix: string;
  archSuffix: string;
  reasoningSteps: number;
  kSuffix: string;
  perceptionMode: PerceptionMode;
  eyeSuffix: string;
  allowedAlgos: Set<LearningAlgorithm>;
  allowedMorphModes: Set<'STATIC' | 'GROWING'>;
  baseCost: number;
  bucketKind: QueueBucketKind;
}

interface PreHyper {
  weightPrecision: WeightPrecision;
  populationSize: number;
  mutationRate: number;
  mutationStrength: number;
  precSuffix: string;
  hyperMid: string;
  curriculumLearning: boolean;
  shapedFitness: boolean;
  currShapeSuffix: string;
  morphogenesisMode: 'STATIC' | 'GROWING';
  morphSuffix: string;
}

interface LazyBucket {
  kind: QueueBucketKind;
  pairs: PrePair[];
  shapes: PreShape[];
  totalPlanned: number;
  prePruned: number;
  preSkipped: number;
  skippedSeen: number;
  emitted: number;
  cursor: number;
  returned: QueuedTrial[];
  returnedIdx: number;
}

function createEmptyBucket(kind: QueueBucketKind): LazyBucket {
  return {
    kind,
    pairs: [],
    shapes: [],
    totalPlanned: 0,
    prePruned: 0,
    preSkipped: 0,
    skippedSeen: 0,
    emitted: 0,
    cursor: 0,
    returned: [],
    returnedIdx: 0,
  };
}

function classifyShapeBucket(
  topology: number[],
  architecture: NetworkArchitecture = 'MLP',
  _inputFeatures?: readonly SensorFeatureId[],
  evolutionTopologyMode: EvolutionTopologyMode = 'SINGLE_SPECIES'
): QueueBucketKind {
  // Conditional Hybrid MoE & Multi-Arch Island Speciation are explicitly tagged CPU_SPECIALIZED
  // to avoid GPU warp divergence — unconditionally routed to CPU Workers / Colab OpenMP.
  if (isCpuSpecializedTrial(architecture, evolutionTopologyMode)) {
    return 'CPU_ONLY';
  }
  // WebGPU WGSL natively supports all 9 homogeneous archs & 12 sensors.
  // Legacy WebGL2 fallback dynamically bounces unsupported Frontier specs to CPU_ONLY at runtime.
  if (architecture !== 'MLP') {
    return isGpuBioTopologySupported(topology, architecture)
      ? 'BIO'
      : 'CPU_ONLY';
  }
  if (topology.length <= 1) return 'FAST';
  for (let i = 0; i < topology.length; i++) {
    if (topology[i] > 8) return 'DEEP_WIDE';
  }
  return 'COMPACT_DEEP';
}

function classifySpecQueue(spec: TrialSpec): QueueBucketKind {
  const base = classifyShapeBucket(
    spec.topology,
    spec.architecture ?? 'MLP',
    spec.inputFeatures,
    spec.evolutionTopologyMode ?? 'SINGLE_SPECIES'
  );
  if (base === 'FAST' && isFrontierDifficulty(spec.difficulty)) {
    return 'FAST_HARD';
  }
  return base;
}

/**
 * Interleaves heaviest and lightest items (zigzag) so even partial/interrupted sweeps
 * and every GPU wave blend heavy frontier trials with light/fast-solve trials,
 * preventing iGPU RPS downclocking on streaks of tiny networks or early-death trials.
 */
function orderBucketBalanced<T>(sortedDesc: T[]): T[] {
  const out: T[] = [];
  let lo = 0;
  let hi = sortedDesc.length - 1;
  while (lo <= hi) {
    out.push(sortedDesc[lo++]);
    if (lo <= hi) {
      out.push(sortedDesc[hi--]);
    }
  }
  return out;
}

export function getHardwareCores(): number {
  if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
    return Math.max(2, Math.min(32, navigator.hardwareConcurrency));
  }
  return 4;
}

export function getEffectivePhysicalCores(): number {
  const logical = getHardwareCores();
  if (logical >= 16) return Math.round(logical * 0.5);
  if (logical >= 8) return Math.round(logical * 0.5);
  return logical;
}

/**
 * Leaves sensible CPU headroom for OS desktop compositor, browser UI, and GPU driver
 * while scaling cleanly on both non-SMT (6c/6t) and SMT (6c/12t, 8c/16t) CPUs.
 */
export function resolveAutoWorkerCount(): number {
  const cores = getHardwareCores();
  if (cores >= 12) return Math.min(28, cores - 2);
  if (cores >= 6) return cores - 1;
  return Math.max(2, cores - 1);
}

/**
 * Turbo mode saturates 100% of reported logical threads (e.g. 12 on 6c/12t, 6 on 6c/6t)
 * without oversubscribing past logical core count and inducing OS context-switch thrashing.
 */
export function resolveTurboWorkerCount(): number {
  return Math.max(2, Math.min(32, getHardwareCores()));
}

export class ResearchPool {
  private callbacks: ResearchPoolCallbacks;
  private trainEntries: WorkerEntry[] = [];
  private auditEntries: WorkerEntry[] = [];
  // O(1)-memory lazy virtual buckets: handles 1M-100M+ combinations in <1MB RAM & <15ms startup!
  private pairOrder: PrePair[] = [];
  private hyperCombos: PreHyper[] = [];
  private tailSig = '';
  private skipSigSet: Set<string> | null = null;
  private skipCountsExact = true;
  private nextTrialIndex = 0;
  private activeSpecs = new Map<number, TrialSpec>();
  private buckets: Record<QueueBucketKind, LazyBucket> = {
    CPU_ONLY: createEmptyBucket('CPU_ONLY'),
    FAST_HARD: createEmptyBucket('FAST_HARD'),
    FAST: createEmptyBucket('FAST'),
    COMPACT_DEEP: createEmptyBucket('COMPACT_DEEP'),
    DEEP_WIDE: createEmptyBucket('DEEP_WIDE'),
    BIO: createEmptyBucket('BIO'),
  };
  private gpuBlockCursor = 0;
  private gpuBlockRemaining = 0;
  private gpuSupportsBio = true;
  private gpuSupportsFullFrontier = true;
  private auditQueue: QueuedAuditSeed[] = [];
  private pendingAudits = new Map<number, PendingAuditJob>();
  private nextPoolAuditId = 1;
  private totalRunQueueTarget = 0;
  private completedTrials = 0;
  private skippedPrecompleted = 0;
  private totalPlannedTrials = 0;
  private sweepConfig: ResearchSweepConfig | null = null;
  private wantAuditParallelism = false;
  private parallelAuditActive = false;
  private status: ResearchProgress['status'] = 'IDLE';
  private sweepStartMs = 0;
  private accumulatedElapsedMs = 0;
  private pausedAtMs = 0;
  private lastProgressEmitMs = 0;
  private lastUiTickMs = 0;
  private uiTickTimer: ReturnType<typeof setInterval> | null = null;
  private profiler = new SweepPerfProfiler();
  private trialRateWindowStartMs = 0;
  private trialRateWindowCount = 0;
  private liveTrialsPerSec = 0;

  // WebGPU / WebGL2 Compute Worker + Live Auto-Tuner state
  private computeBackend: ComputeBackend = 'CPU';
  private effectiveBackend: 'CPU' | 'GPU' | 'HYBRID' = 'CPU';
  private gpuWorker: Worker | null = null;
  private gpuActive = false;
  private gpuIsIntegrated = false;
  private gpuLabel = '';
  private gpuActiveTrials = 0;
  private gpuTrialIndices = new Set<number>();
  private gpuSlots: WorkerSlotProgress[] = [];
  private gpuTicksWindowStartMs = 0;
  private gpuTicksWindowCount = 0;
  private gpuTicksPerSec = 0;
  private fullSafeTrainWorkers = 1;
  private hybridMaxTrainWorkers = 1;
  private gpuVerifyQueue: QueuedGpuVerify[] = [];

  // Live 3-phase Auto-Tuner (WARMUP_CPU -> PROBE_CPU -> PROBE_GPU -> PROBE_HYBRID -> LOCKED winner)
  private autoTuneStage:
    | 'OFF'
    | 'WARMUP_CPU'
    | 'PROBE_CPU'
    | 'PROBE_GPU'
    | 'PROBE_HYBRID'
    | 'LOCKED' = 'OFF';
  private autoTuneStatus = '';
  private autoTuneStageStartMs = 0;
  private autoTuneProbes: AutoTuneProbeMetrics[] = [];
  private probeCpuTicks = 0;
  private probeGpuTicks = 0;
  private probeTrials = 0;
  private probeGpuBatchMsSum = 0;
  private probeGpuBatches = 0;
  private probeLagMsSum = 0;
  private probeLagTicks = 0;
  private cpuWorkersPausedByTuner = false;
  private cpuDrainOnlyMode = false;

  // Live Power / Thermal Profile & Smart Prune state
  private activePowerProfile: PowerProfilePlan = resolvePowerProfile(
    70,
    getHardwareCores()
  );
  private liveTrainCap = 0; // 0 = no extra cap beyond fullSafeTrainWorkers
  private smartPruneCtx: SmartPruneContext | null = null;
  private prunedRedundantCount = 0;
  private prunedBreakdown: SmartPruneBreakdown = {
    skipOnDepth0: 0,
    unusedMutationRate: 0,
    staticPipeVy: 0,
    blindNoClearance: 0,
  };

  constructor(callbacks: ResearchPoolCallbacks) {
    this.callbacks = callbacks;
  }

  recordUiFlushMs(ms: number): void {
    this.profiler.recordUiFlushMs(ms);
  }

  getPerfReport(): string | null {
    return this.profiler.hasData() ? this.profiler.buildReport().markdown : null;
  }

  getPerfReportSnapshot(): PerfReportSnapshot | null {
    return this.profiler.hasData() ? this.profiler.buildSnapshot() : null;
  }

  /**
   * Live mid-run Perf/Watt vs Speed adjustment:
   * Immediately updates CPU concurrency cap, worker chunk/rest thermal pacing,
   * and integrated GPU usage WITHOUT restarting or losing active trial progress!
   */
  setPerformancePriority(priority: number): void {
    const cores = getHardwareCores();
    const profile = resolvePowerProfile(priority, cores);
    this.activePowerProfile = profile;
    this.profiler.setPowerProfile(profile.priority, profile.label);

    if (this.sweepConfig) {
      this.sweepConfig = {
        ...this.sweepConfig,
        performancePriority: profile.priority,
      };
    }

    if (this.status !== 'RUNNING' && this.status !== 'PAUSED') {
      return;
    }

    // Only dynamically resize CPU concurrency if workerThreads is Auto (0);
    // explicit user core counts still receive live chunk/rest thermal pacing.
    const autoThreads = !this.sweepConfig || this.sweepConfig.workerThreads === 0;
    if (autoThreads) {
      this.fullSafeTrainWorkers = Math.max(
        1,
        Math.min(profile.targetCpuThreads, Math.max(1, this.totalRunQueueTarget))
      );
      this.liveTrainCap = profile.targetCpuThreads;

      const remaining = this.getRemainingQueueCount();
      if (
        this.status === 'RUNNING' &&
        !this.cpuWorkersPausedByTuner &&
        !this.cpuDrainOnlyMode &&
        remaining > 0 &&
        this.trainEntries.length < profile.targetCpuThreads
      ) {
        const want = Math.min(profile.targetCpuThreads, this.trainEntries.length + remaining);
        this.ensureWorkers(want, this.auditEntries.length);
      }
    } else {
      this.liveTrainCap = 0;
    }

    // Apply live chunkMs / restMs / throttle state to every CPU train worker
    const activeCap =
      this.liveTrainCap > 0 ? this.liveTrainCap : this.trainEntries.length;
    for (let i = 0; i < this.trainEntries.length; i++) {
      const entry = this.trainEntries[i];
      const shouldThrottle = autoThreads && i >= activeCap;
      this.postToEntry(entry, {
        type: 'SET_POWER_PACING',
        chunkMs: profile.workerChunkMs,
        restMs: profile.workerRestMs,
        throttled: shouldThrottle,
      });
      if (
        !shouldThrottle &&
        this.status === 'RUNNING' &&
        !this.cpuWorkersPausedByTuner &&
        !this.cpuDrainOnlyMode
      ) {
        this.topUpTrainEntry(entry);
      }
    }

    // Update profiler active worker count readout
    const effectiveActiveTrain = Math.min(this.trainEntries.length, activeCap);
    this.profiler.setWorkerCounts(
      effectiveActiveTrain,
      this.auditEntries.length,
      this.effectiveBackend
    );

    // If user slid down into Cool/Eco/Sweet-Spot where iGPU is disallowed, stop iGPU gracefully
    if (
      !profile.allowIntegratedGpu &&
      this.gpuIsIntegrated &&
      this.gpuActive &&
      this.gpuWorker
    ) {
      this.gpuActive = false;
      this.gpuActiveTrials = 0;
      this.gpuSlots = [];
      this.gpuTicksPerSec = 0;
      this.effectiveBackend = 'CPU';
      this.autoTuneStage = 'LOCKED';
      this.autoTuneStatus = `${profile.label}: CPU-only (iGPU off for Perf/W)`;
      this.postToGpu({ type: 'RETURN_AND_STOP' });
      for (let i = 0; i < Math.min(this.trainEntries.length, activeCap); i++) {
        this.topUpTrainEntry(this.trainEntries[i]);
      }
    }

    this.resetRateWindowsAfterConfigShift();
    this.callbacks.onProgress(this.buildProgress());
  }

  setGpuLoadPercent(gpuLoadPercent: number): void {
    const clamped = Math.max(10, Math.min(100, Math.round(gpuLoadPercent)));
    if (this.sweepConfig) {
      this.sweepConfig = {
        ...this.sweepConfig,
        gpuLoadPercent: clamped,
      };
    }
    if (this.gpuWorker && (this.status === 'RUNNING' || this.status === 'PAUSED')) {
      this.postToGpu({ type: 'SET_GPU_LOAD', gpuLoadPercent: clamped });
      this.resetRateWindowsAfterConfigShift();
    }
  }

  private resetRateWindowsAfterConfigShift(): void {
    const refNow =
      this.status === 'PAUSED' && this.pausedAtMs > 0
        ? this.pausedAtMs
        : performance.now();
    this.trialRateWindowStartMs = refNow;
    this.trialRateWindowCount = 0;
    this.liveTrialsPerSec = 0;
    this.gpuTicksWindowStartMs = refNow;
    this.gpuTicksWindowCount = 0;
    this.profiler.resetLiveWindow();
  }

  private updateLiveTrialRate(now: number, finalizePartial = false): void {
    if (this.trialRateWindowStartMs <= 0) {
      this.trialRateWindowStartMs = now;
      return;
    }
    const winMs = now - this.trialRateWindowStartMs;
    const minWinMs = finalizePartial ? 250 : 1500;
    if (
      winMs >= minWinMs &&
      (this.trialRateWindowCount > 0 || (!finalizePartial && winMs >= 5000))
    ) {
      const instant = (this.trialRateWindowCount / winMs) * 1000;
      this.liveTrialsPerSec =
        this.liveTrialsPerSec > 0
          ? this.liveTrialsPerSec * 0.45 + instant * 0.55
          : instant;
      this.trialRateWindowStartMs = now;
      this.trialRateWindowCount = 0;
    }
  }

  private createEmptySlot(workerId: number): WorkerSlotProgress {
    return {
      workerId,
      trialIndex: -1,
      algorithm: null,
      difficulty: null,
      topology: [],
      populationSize: 0,
      generation: 0,
      bestScore: 0,
      phase: 'IDLE',
    };
  }

  private createWorkerEntry(
    workerId: number,
    role: 'TRAIN' | 'AUDIT'
  ): WorkerEntry {
    const worker = new Worker(
      new URL('./research.worker.ts', import.meta.url),
      { type: 'module' }
    );
    const entry: WorkerEntry = {
      workerId,
      role,
      worker,
      busy: false,
      busyKind: 'IDLE',
      inflightCount: 0,
      inflightItems: [],
      awaitingAudit: false,
      runningAuditSeed: false,
      activeAuditId: null,
      activeAuditSeed: null,
      activeGpuVerify: null,
      startedAtMs: 0,
      slot: this.createEmptySlot(workerId),
    };
    worker.onmessage = (ev: MessageEvent<ResearchWorkerOutbound>) => {
      this.handleWorkerMessage(entry, ev.data);
    };
    worker.onerror = (ev: ErrorEvent) => {
      this.handleWorkerCrash(
        entry,
        ev.message || 'Unhandled CPU worker error'
      );
    };
    worker.onmessageerror = () => {
      this.handleWorkerCrash(entry, 'CPU worker message deserialization error');
    };
    return entry;
  }

  private ensureWorkers(trainCount: number, auditCount: number): void {
    while (this.trainEntries.length > trainCount) {
      const removed = this.trainEntries.pop();
      removed?.worker.terminate();
    }
    while (this.auditEntries.length > auditCount) {
      const removed = this.auditEntries.pop();
      removed?.worker.terminate();
    }

    while (this.trainEntries.length < trainCount) {
      const id = this.trainEntries.length + 1;
      this.trainEntries.push(this.createWorkerEntry(id, 'TRAIN'));
    }

    while (this.auditEntries.length < auditCount) {
      const id = 100 + this.auditEntries.length + 1;
      this.auditEntries.push(this.createWorkerEntry(id, 'AUDIT'));
    }
  }

  private ensureGpuWorker(): Worker {
    if (!this.gpuWorker) {
      const w = new Worker(new URL('./gpu.worker.ts', import.meta.url), {
        type: 'module',
      });
      w.onmessage = (ev: MessageEvent<GpuWorkerOutbound>) => {
        this.handleGpuMessage(ev.data);
      };
      w.onerror = (ev: ErrorEvent) => {
        this.handleGpuWorkerCrash(ev.message || 'Unhandled GPU worker error');
      };
      w.onmessageerror = () => {
        this.handleGpuWorkerCrash('GPU worker message deserialization error');
      };
      this.gpuWorker = w;
    }
    return this.gpuWorker;
  }

  private handleWorkerCrash(entry: WorkerEntry, reason: string): void {
    const trainIdx = this.trainEntries.indexOf(entry);
    const auditIdx = trainIdx === -1 ? this.auditEntries.indexOf(entry) : -1;
    if (trainIdx === -1 && auditIdx === -1) return;

    // eslint-disable-next-line no-console
    console.warn(
      `[NeuroLab Pool] Worker W${entry.workerId} (${entry.role}) crashed, recovering work:`,
      reason
    );

    if (trainIdx !== -1) this.trainEntries.splice(trainIdx, 1);
    else if (auditIdx !== -1) this.auditEntries.splice(auditIdx, 1);

    try {
      entry.worker.terminate();
    } catch {
      // ignore termination failures
    }

    // 1. Recover any queued/in-flight trials owned by this worker
    if (entry.inflightItems.length > 0) {
      const recovered = entry.inflightItems.splice(0, entry.inflightItems.length);
      entry.inflightCount = 0;
      this.enqueueReturnedItems(recovered);
    }

    // 2. Recover any pending GPU f64 verification assigned to this worker
    if (entry.activeGpuVerify) {
      const verifyTask = entry.activeGpuVerify;
      entry.activeGpuVerify = null;
      if (this.gpuWorker && this.gpuActive) {
        this.gpuVerifyQueue.unshift(verifyTask);
      }
    }

    // 3. Cancel any pending audit requested by this crashed worker, or re-queue a seed it was helping on
    for (const [id, job] of this.pendingAudits.entries()) {
      if (job.requesterEntry === entry) {
        job.settled = true;
        this.pendingAudits.delete(id);
        this.auditQueue = this.auditQueue.filter((t) => t.poolAuditId !== id);
        this.cancelInFlightAuditSeeds(id);
      }
    }
    if (entry.activeAuditSeed) {
      const seedTask = entry.activeAuditSeed;
      entry.activeAuditSeed = null;
      const job = this.pendingAudits.get(seedTask.poolAuditId);
      if (job && !job.settled) {
        this.auditQueue.unshift(seedTask);
      }
    }

    if (this.status !== 'RUNNING' || !this.sweepConfig) return;

    // 4. Respawn replacement worker so sweep throughput stays intact
    const replacement = this.createWorkerEntry(entry.workerId, entry.role);
    if (entry.role === 'TRAIN') {
      this.postToEntry(replacement, {
        type: 'SET_POWER_PACING',
        chunkMs: this.activePowerProfile.workerChunkMs,
        restMs: this.activePowerProfile.workerRestMs,
        throttled: false,
      });
      this.trainEntries.push(replacement);
      this.topUpTrainEntry(replacement);
    } else {
      this.auditEntries.push(replacement);
    }

    this.pumpGpuVerifyQueue();
    this.pumpAuditQueue();
    this.maybeTriggerGpuToCpuHandoff();
    this.finishSweepIfComplete();
  }

  private handleGpuWorkerCrash(reason: string): void {
    if (!this.gpuWorker && !this.gpuActive && this.gpuTrialIndices.size === 0) {
      return;
    }
    // eslint-disable-next-line no-console
    console.warn(
      '[NeuroLab GPU] Worker crashed/terminated, falling back cleanly to CPU:',
      reason
    );
    if (this.gpuWorker) {
      try {
        this.gpuWorker.terminate();
      } catch {
        // ignore termination failures
      }
      this.gpuWorker = null;
    }

    const returnedItems: GpuQueuedTrialItem[] = [];
    for (const trialIndex of this.gpuTrialIndices) {
      const spec = this.activeSpecs.get(trialIndex);
      if (spec) {
        returnedItems.push({ trialIndex, spec });
      }
    }
    this.gpuTrialIndices.clear();
    this.fallbackGpuToCpu(reason, returnedItems);
  }

  private fallbackGpuToCpu(
    message: string,
    returnedItems: GpuQueuedTrialItem[]
  ): void {
    this.gpuActive = false;
    this.gpuActiveTrials = 0;
    this.gpuTrialIndices.clear();
    this.gpuSlots = [];
    this.gpuTicksPerSec = 0;
    this.gpuVerifyQueue = [];
    this.gpuLabel = `Fallback CPU (${message.slice(0, 36)})`;
    this.effectiveBackend = 'CPU';
    this.cpuWorkersPausedByTuner = false;
    this.cpuDrainOnlyMode = false;
    if (this.autoTuneStage !== 'OFF' && this.autoTuneStage !== 'LOCKED') {
      this.autoTuneStage = 'LOCKED';
      this.autoTuneStatus = 'Auto → CPU (GPU fallback)';
    }
    this.profiler.setGpuError(message);

    if (returnedItems.length > 0) {
      this.enqueueReturnedItems(returnedItems);
    }

    if (this.status === 'RUNNING' && this.sweepConfig) {
      const remaining = this.getRemainingQueueCount();
      if (remaining > 0) {
        const targetTrain = Math.max(
          this.trainEntries.length,
          Math.min(this.fullSafeTrainWorkers, remaining)
        );
        this.ensureWorkers(targetTrain, 0);
        this.profiler.setWorkerCounts(
          this.trainEntries.length,
          this.auditEntries.length,
          'CPU'
        );
        for (const entry of this.trainEntries) {
          this.postToEntry(entry, {
            type: 'SET_POWER_PACING',
            chunkMs: this.activePowerProfile.workerChunkMs,
            restMs: this.activePowerProfile.workerRestMs,
            throttled: false,
          });
          if (entry.busy && entry.busyKind === 'TRIAL') {
            this.postToEntry(entry, { type: 'RESUME' });
          }
          this.topUpTrainEntry(entry);
        }
      }
      this.finishSweepIfComplete();
    }
    this.callbacks.onProgress(this.buildProgress());
  }

  private postToGpu(msg: GpuWorkerInbound): void {
    this.gpuWorker?.postMessage(msg);
  }

  private postToEntry(entry: WorkerEntry, msg: ResearchWorkerInbound): void {
    entry.worker.postMessage(msg);
  }

  private getBucketRemaining(b: LazyBucket): number {
    const overflow = Math.max(0, b.returned.length - b.returnedIdx);
    if (b.cursor >= b.totalPlanned) return overflow;
    const virtualCap = b.totalPlanned - b.cursor;
    const virtualEst = Math.max(
      0,
      b.totalPlanned - b.prePruned - b.preSkipped - b.emitted
    );
    return overflow + Math.min(virtualCap, virtualEst);
  }

  private getRemainingQueueCount(): number {
    return (
      this.getBucketRemaining(this.buckets.CPU_ONLY) +
      this.getBucketRemaining(this.buckets.FAST_HARD) +
      this.getBucketRemaining(this.buckets.FAST) +
      this.getBucketRemaining(this.buckets.COMPACT_DEEP) +
      this.getBucketRemaining(this.buckets.DEEP_WIDE) +
      this.getBucketRemaining(this.buckets.BIO)
    );
  }

  private isSpecEligibleForActiveGpu(spec: TrialSpec): boolean {
    const arch = spec.architecture ?? 'MLP';
    const evoMode = spec.evolutionTopologyMode ?? this.sweepConfig?.evolutionTopologyMode ?? 'SINGLE_SPECIES';
    if (isCpuSpecializedTrial(arch, evoMode)) {
      return false;
    }
    if (this.gpuSupportsFullFrontier) {
      return (
        arch === 'MLP' ||
        (this.gpuSupportsBio && isGpuBioTopologySupported(spec.topology, arch))
      );
    }
    if (this.sweepConfig?.shapedFitness || this.sweepConfig?.curriculumLearning) {
      return false;
    }
    if (hasLookaheadSensor(spec.inputFeatures)) return false;
    if (arch !== 'MLP') {
      return (
        this.gpuSupportsBio && isWebGl2BioTopologySupported(spec.topology, arch)
      );
    }
    return true;
  }

  private getRemainingGpuQueueCount(): number {
    if (
      !this.gpuSupportsFullFrontier &&
      (this.sweepConfig?.shapedFitness || this.sweepConfig?.curriculumLearning)
    ) {
      return 0;
    }
    return (
      this.getBucketRemaining(this.buckets.FAST_HARD) +
      this.getBucketRemaining(this.buckets.FAST) +
      this.getBucketRemaining(this.buckets.COMPACT_DEEP) +
      this.getBucketRemaining(this.buckets.DEEP_WIDE) +
      (this.gpuSupportsBio ? this.getBucketRemaining(this.buckets.BIO) : 0)
    );
  }

  private enqueueReturnedItems(items: GpuQueuedTrialItem[]): void {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      this.gpuTrialIndices.delete(item.trialIndex);
      const kind = this.isSpecEligibleForActiveGpu(item.spec)
        ? classifySpecQueue(item.spec)
        : 'CPU_ONLY';
      this.buckets[kind].returned.push(item);
      this.activeSpecs.set(item.trialIndex, item.spec);
    }
  }

  /**
   * Lazily materializes the next unskipped trial from a virtual bucket in O(1) memory.
   * Uses exact integer arithmetic up to 2^53 - 1 (handles billions of combinations).
   */
  private nextFromBucket(b: LazyBucket): QueuedTrial | null {
    if (b.returnedIdx < b.returned.length) {
      const item = b.returned[b.returnedIdx++];
      if (b.returnedIdx >= b.returned.length) {
        b.returned = [];
        b.returnedIdx = 0;
      }
      return item;
    }

    const pairLen = b.pairs.length;
    const shapeLen = b.shapes.length;
    if (pairLen === 0 || shapeLen === 0 || this.hyperCombos.length === 0) {
      b.cursor = b.totalPlanned;
      return null;
    }

    const checkSkip =
      this.skipSigSet !== null &&
      this.skipSigSet.size > 0 &&
      (!this.skipCountsExact || b.skippedSeen < b.preSkipped);

    while (b.cursor < b.totalPlanned) {
      const k = b.cursor++;
      const pairIdx = k % pairLen;
      const rem = (k - pairIdx) / pairLen;
      const shapeIdx = rem % shapeLen;
      const hyperIdx = (rem - shapeIdx) / shapeLen;

      const pair = b.pairs[pairIdx];
      const shape = b.shapes[shapeIdx];
      const hyper = this.hyperCombos[hyperIdx];

      if (
        !shape.allowedAlgos.has(pair.algorithm) ||
        !shape.allowedMorphModes.has(hyper.morphogenesisMode)
      ) {
        continue;
      }

      if (
        this.smartPruneCtx &&
        this.smartPruneCtx.enabled &&
        getTrialPruneReason(this.smartPruneCtx, {
          algorithm: pair.algorithm,
          difficulty: pair.difficulty,
          architecture: shape.architecture,
          topology: shape.topology,
          inputFeatures: shape.inputFeatures,
          mutationRate: hyper.mutationRate,
        }) !== null
      ) {
        continue;
      }

      if (checkSkip && (!this.skipCountsExact || b.skippedSeen < b.preSkipped)) {
        const islSuffix =
          this.sweepConfig?.evolutionTopologyMode === 'ISLAND_SPECIATION'
            ? '|isl'
            : '';
        const flagSuffix = `${hyper.currShapeSuffix}${shape.kSuffix}${hyper.morphSuffix}${islSuffix}${shape.eyeSuffix}`;
        const sig = `${pair.adPrefix}${shape.topoLabel}|${hyper.hyperMid}${this.tailSig}${shape.inSuffix}${shape.archSuffix}${hyper.precSuffix}${flagSuffix}`;
        if (this.skipSigSet!.has(sig)) {
          b.skippedSeen += 1;
          continue;
        }
      }

      b.emitted += 1;
      const trialIndex = this.nextTrialIndex++;
      const evoMode = this.sweepConfig?.evolutionTopologyMode ?? 'SINGLE_SPECIES';
      const spec: TrialSpec = {
        algorithm: pair.algorithm,
        difficulty: pair.difficulty,
        topology: shape.topology,
        inputFeatures: shape.inputFeatures,
        architecture: shape.architecture,
        weightPrecision: hyper.weightPrecision,
        populationSize: hyper.populationSize,
        mutationRate: hyper.mutationRate,
        mutationStrength: hyper.mutationStrength,
        morphogenesisMode: hyper.morphogenesisMode,
        evolutionTopologyMode: evoMode,
        islandSpecies: this.sweepConfig?.islandSpecies,
        curriculumLearning: hyper.curriculumLearning,
        shapedFitness: hyper.shapedFitness,
        reasoningSteps: shape.reasoningSteps,
        perceptionMode: shape.perceptionMode,
      };
      this.activeSpecs.set(trialIndex, spec);
      return { trialIndex, spec };
    }

    return null;
  }

  /**
   * Kernel- & difficulty-coherent block puller:
   * - GPU prioritizes FAST_HARD (frontier/extreme MLP D0-1: short uniform warps, near-zero
   *   warp divergence & minimal CPU f64 audit overhead) -> FAST -> COMPACT_DEEP -> BIO -> DEEP_WIDE.
   * - On integrated GPUs in HYBRID mode, drains FAST_HARD & FAST completely before touching
   *   heavy COMPACT_DEEP/BIO kernels (which our monomorphic CPU engine runs faster & without driver stalls).
   * - HYBRID CPU prioritizes CPU_ONLY -> BIO -> DEEP_WIDE -> COMPACT_DEEP -> FAST -> FAST_HARD.
   */
  private pullFromQueue(
    maxCount: number,
    consumer: 'GPU' | 'CPU' = 'CPU'
  ): GpuQueuedTrialItem[] {
    const out: GpuQueuedTrialItem[] = [];
    const gpuOnlyModeCpuHelper =
      this.effectiveBackend === 'GPU' && consumer === 'CPU' && this.gpuActive;

    if (consumer === 'GPU') {
      if (
        !this.gpuSupportsFullFrontier &&
        (this.sweepConfig?.shapedFitness || this.sweepConfig?.curriculumLearning)
      ) {
        return out;
      }
      const gpuOrder: QueueBucketKind[] = [
        'FAST_HARD',
        'FAST',
        'COMPACT_DEEP',
        'BIO',
        'DEEP_WIDE',
      ];
      const preferFastFirstOnIgpuHybrid =
        this.gpuIsIntegrated && this.effectiveBackend === 'HYBRID';

      const takeNextEligibleForGpu = (k: QueueBucketKind): QueuedTrial | null => {
        if (k === 'BIO' && !this.gpuSupportsBio) return null;
        while (true) {
          const item = this.nextFromBucket(this.buckets[k]);
          if (!item) return null;
          if (this.isSpecEligibleForActiveGpu(item.spec)) {
            return item;
          }
          // Legacy WebGL2 fallback: divert unsupported Frontier/Reasoning spec to CPU_ONLY
          this.buckets.CPU_ONLY.returned.push(item);
        }
      };

      if (preferFastFirstOnIgpuHybrid) {
        while (out.length < maxCount) {
          let picked: QueuedTrial | null = null;
          for (let i = 0; i < gpuOrder.length; i++) {
            picked = takeNextEligibleForGpu(gpuOrder[i]);
            if (picked) break;
          }
          if (!picked) break;
          out.push(picked);
        }
        return out;
      }

      while (out.length < maxCount) {
        if (this.gpuBlockRemaining <= 0) {
          this.gpuBlockCursor = (this.gpuBlockCursor + 1) % gpuOrder.length;
          this.gpuBlockRemaining = 32;
        }
        const curKind = gpuOrder[this.gpuBlockCursor];
        let item = takeNextEligibleForGpu(curKind);
        if (!item) {
          // Rotate to first non-empty kernel bucket
          for (let tries = 1; tries < gpuOrder.length; tries++) {
            const nextIdx = (this.gpuBlockCursor + tries) % gpuOrder.length;
            const nextKind = gpuOrder[nextIdx];
            item = takeNextEligibleForGpu(nextKind);
            if (item) {
              this.gpuBlockCursor = nextIdx;
              this.gpuBlockRemaining = 32;
              break;
            }
          }
        }
        if (!item) break;
        out.push(item);
        this.gpuBlockRemaining -= 1;
      }
      return out;
    }

    // CPU consumer
    const cpuOrder: QueueBucketKind[] = gpuOnlyModeCpuHelper
      ? this.gpuSupportsBio
        ? ['CPU_ONLY']
        : ['CPU_ONLY', 'BIO']
      : ['CPU_ONLY', 'BIO', 'DEEP_WIDE', 'COMPACT_DEEP', 'FAST', 'FAST_HARD'];

    while (out.length < maxCount) {
      let picked: QueuedTrial | null = null;
      for (let i = 0; i < cpuOrder.length; i++) {
        picked = this.nextFromBucket(this.buckets[cpuOrder[i]]);
        if (picked) break;
      }
      if (!picked) break;
      out.push(picked);
    }
    return out;
  }

  private dispatchAuditSeedToEntry(entry: WorkerEntry): boolean {
    if (this.status !== 'RUNNING' || this.auditQueue.length === 0) return false;
    if (entry.runningAuditSeed) return false;

    const task = this.auditQueue.shift();
    if (!task) return false;

    const job = this.pendingAudits.get(task.poolAuditId);
    if (!job || job.settled) {
      return this.dispatchAuditSeedToEntry(entry);
    }

    entry.runningAuditSeed = true;
    entry.activeAuditId = task.poolAuditId;
    entry.activeAuditSeed = task;

    if (entry.role === 'TRAIN' && entry.awaitingAudit) {
      // Cooperative work-stealing: keep the paused trial metadata on slot while showing active audit work
      entry.slot.phase = 'AUDITING';
      entry.slot.auditDetail =
        job.requesterEntry === entry
          ? `Seed ${task.seedIndex + 1}/${job.verificationSeeds}`
          : `Help W${job.requesterEntry.workerId} S${task.seedIndex + 1}`;
    } else {
      entry.busy = true;
      entry.busyKind = 'AUDIT_SEED';
      entry.startedAtMs = performance.now();
      entry.slot = {
        workerId: entry.workerId,
        trialIndex: job.requesterEntry.slot.trialIndex,
        algorithm: job.requesterEntry.slot.algorithm,
        difficulty: task.difficulty,
        topology: job.requesterEntry.slot.topology,
        inputFeatures: job.requesterEntry.slot.inputFeatures,
        populationSize: job.requesterEntry.slot.populationSize,
        generation: job.requesterEntry.slot.generation,
        bestScore: job.requesterEntry.slot.bestScore,
        phase: 'AUDITING',
        auditDetail: `Seed ${task.seedIndex + 1}/${job.verificationSeeds}`,
      };
    }

    this.postToEntry(entry, {
      type: 'RUN_AUDIT_SEED',
      workerId: entry.workerId,
      auditId: task.poolAuditId,
      seedIndex: task.seedIndex,
      seed: task.seed,
      brain: task.brain,
      difficulty: task.difficulty,
      targetPipeCap: task.targetPipeCap,
      customEnvironment: task.customEnvironment,
    });
    return true;
  }

  private dispatchGpuVerifyToEntry(entry: WorkerEntry): boolean {
    const task = this.gpuVerifyQueue.shift();
    if (!task) return false;
    entry.busy = true;
    entry.busyKind = 'AUDIT_SEED';
    entry.runningAuditSeed = true;
    entry.activeGpuVerify = task;
    entry.startedAtMs = performance.now();
    entry.slot = {
      workerId: entry.workerId,
      trialIndex: -1,
      algorithm: null,
      difficulty: task.difficulty,
      topology: [],
      populationSize: 0,
      generation: 0,
      bestScore: 0,
      phase: 'AUDITING',
      auditDetail: `GPU f64 ${task.verificationSeeds}s`,
    };
    this.postToEntry(entry, {
      type: 'RUN_GPU_VERIFY',
      reqId: task.reqId,
      brain: task.brain,
      difficulty: task.difficulty,
      targetPipeCap: task.targetPipeCap,
      verificationSeeds: task.verificationSeeds,
      customEnvironment: task.customEnvironment,
      failFast: task.failFast,
    });
    return true;
  }

  private pumpGpuVerifyQueue(): void {
    if (this.status !== 'RUNNING' || this.gpuVerifyQueue.length === 0) return;

    // Dynamically recruit extra audit capacity when GPU champion verification queues back up,
    // strictly bounded by the configured worker budget so we never oversubscribe logical cores.
    const cores = getHardwareCores();
    const cfgThreads = this.sweepConfig?.workerThreads ?? 0;
    const priority = this.sweepConfig?.performancePriority ?? 70;
    const maxSafeWorkers =
      cfgThreads === -1 || cfgThreads === -2 || priority >= 95
        ? cores
        : cfgThreads > 0
          ? Math.min(32, cfgThreads)
          : Math.max(2, cores <= 8 ? cores - 1 : cores - 2);
    const totalWorkers = this.trainEntries.length + this.auditEntries.length;
    if (this.gpuVerifyQueue.length >= 6 && totalWorkers < maxSafeWorkers) {
      const wantAudit = Math.min(
        Math.max(0, maxSafeWorkers - this.trainEntries.length),
        this.auditEntries.length + Math.ceil(this.gpuVerifyQueue.length / 8)
      );
      if (wantAudit > this.auditEntries.length) {
        this.ensureWorkers(this.trainEntries.length, wantAudit);
        this.profiler.setWorkerCounts(
          this.trainEntries.length,
          this.auditEntries.length,
          this.effectiveBackend
        );
      }
    }

    // 1. Prioritize dedicated audit helper workers
    for (const entry of this.auditEntries) {
      if (this.gpuVerifyQueue.length === 0) break;
      if (!entry.busy && !entry.runningAuditSeed) {
        this.dispatchGpuVerifyToEntry(entry);
      }
    }

    // 2. Prevent GPU starvation: recruit idle CPU train workers whenever verifyQueue backs up
    if (this.gpuVerifyQueue.length > 0) {
      for (const entry of this.trainEntries) {
        if (this.gpuVerifyQueue.length === 0) break;
        if (!entry.busy && !entry.runningAuditSeed && entry.inflightCount === 0) {
          this.dispatchGpuVerifyToEntry(entry);
        }
      }
    }
  }

  private pumpAuditQueue(): void {
    if (this.status !== 'RUNNING' || this.auditQueue.length === 0) return;

    // 1. Prioritize dedicated audit helper workers
    for (const entry of this.auditEntries) {
      if (this.auditQueue.length === 0) break;
      if (!entry.busy && !entry.runningAuditSeed) {
        this.dispatchAuditSeedToEntry(entry);
      }
    }

    // 2. Recruit ALL waiting training workers (eliminates the idle-stall bottleneck -> ~100% CPU!)
    for (const entry of this.trainEntries) {
      if (this.auditQueue.length === 0) break;
      if (entry.awaitingAudit && !entry.runningAuditSeed) {
        this.dispatchAuditSeedToEntry(entry);
      }
    }

    // 3. Also recruit any idle training workers (tail of sweep or small sweeps)
    for (const entry of this.trainEntries) {
      if (this.auditQueue.length === 0) break;
      if (!entry.busy && !entry.runningAuditSeed) {
        this.dispatchAuditSeedToEntry(entry);
      }
    }
  }

  private activateTailParallelAudits(): void {
    if (!this.wantAuditParallelism || this.parallelAuditActive) return;
    this.parallelAuditActive = true;
    for (const e of this.trainEntries) {
      if (e.busy && e.busyKind === 'TRIAL') {
        this.postToEntry(e, { type: 'SET_PARALLEL_AUDIT', enabled: true });
      }
    }
  }

  /**
   * Prefetch-aware trial feeder for CPU workers:
   * Keeps up to 3 trials in-flight per worker (1 active + 2 locally buffered) during bulk sweeps
   * so workers never stall even during a 500ms-950ms main-thread React flush or GC pause.
   * Drops cleanly to 1-at-a-time in the tail so no single worker hoards the last trials.
   */
  private topUpTrainEntry(entry: WorkerEntry): void {
    if (this.status !== 'RUNNING' || !this.sweepConfig) return;

    const overHybridCap =
      this.effectiveBackend === 'HYBRID' &&
      this.hybridMaxTrainWorkers > 0 &&
      entry.workerId > this.hybridMaxTrainWorkers;
    const overPowerCap =
      this.liveTrainCap > 0 && entry.workerId > this.liveTrainCap;

    if (
      this.cpuWorkersPausedByTuner ||
      this.cpuDrainOnlyMode ||
      overHybridCap ||
      overPowerCap
    ) {
      if (entry.inflightCount === 0) {
        entry.busy = false;
        entry.busyKind = 'IDLE';
        entry.awaitingAudit = false;
        entry.slot = this.createEmptySlot(entry.workerId);
        // Once HYBRID is locked, terminate excess idle train workers so they don't waste RAM or skew concurrency
        if (overHybridCap && !overPowerCap && this.autoTuneStage === 'LOCKED') {
          const idx = this.trainEntries.indexOf(entry);
          if (idx !== -1) {
            this.trainEntries.splice(idx, 1);
            entry.worker.terminate();
          }
        }
      }
      return;
    }

    // If GPU champion verification is backed up (>= 4 waiting), recruit free train workers
    // to clear the jam instead of letting GPU stall on awaitingVerify!
    if (
      entry.inflightCount === 0 &&
      !entry.busy &&
      !entry.runningAuditSeed &&
      this.gpuVerifyQueue.length >= 4
    ) {
      if (this.dispatchGpuVerifyToEntry(entry)) {
        return;
      }
    }

    const remaining = this.getRemainingQueueCount();
    const isProbing =
      this.autoTuneStage === 'WARMUP_CPU' ||
      this.autoTuneStage === 'PROBE_CPU' ||
      this.autoTuneStage === 'PROBE_GPU' ||
      this.autoTuneStage === 'PROBE_HYBRID';
    const bulkThreshold = Math.max(12, this.trainEntries.length * 4);
    const verifyCongested = this.gpuVerifyQueue.length >= 4;
    const targetInflight =
      isProbing || verifyCongested ? 1 : remaining > bulkThreshold ? 3 : 1;
    const need = Math.max(0, targetInflight - entry.inflightCount);

    if (need > 0 && remaining > 0) {
      const items = this.pullFromQueue(need, 'CPU');
      if (items.length > 0) {
        const wasIdle = !entry.busy || entry.busyKind !== 'TRIAL';
        entry.inflightItems.push(...items);
        entry.inflightCount = entry.inflightItems.length;
        if (wasIdle) {
          const first = items[0];
          entry.busy = true;
          entry.busyKind = 'TRIAL';
          entry.awaitingAudit = false;
          entry.startedAtMs = performance.now();
          entry.slot = {
            workerId: entry.workerId,
            trialIndex: first.trialIndex,
            algorithm: first.spec.algorithm,
            difficulty: first.spec.difficulty,
            topology: first.spec.topology,
            inputFeatures: first.spec.inputFeatures,
            architecture: first.spec.architecture ?? 'MLP',
            evolutionTopologyMode: first.spec.evolutionTopologyMode ?? 'SINGLE_SPECIES',
            computeProfile: getTrialComputeProfile(
              first.spec.architecture ?? 'MLP',
              first.spec.evolutionTopologyMode ?? 'SINGLE_SPECIES'
            ),
            weightPrecision: first.spec.weightPrecision ?? 'FP32',
            populationSize: first.spec.populationSize,
            generation: 1,
            bestScore: 0,
            phase: 'TRAINING',
          };
        }
        this.postToEntry(entry, {
          type: 'QUEUE_TRIALS',
          workerId: entry.workerId,
          items,
          sweepConfig: this.sweepConfig,
          useParallelAudit: this.parallelAuditActive,
        });
        return;
      }
    }

    // Queue drained and this worker has zero remaining buffered trials -> go idle & activate tail-parallel audits!
    if (entry.inflightCount === 0 && this.getRemainingQueueCount() === 0) {
      entry.busy = false;
      entry.busyKind = 'IDLE';
      entry.awaitingAudit = false;
      entry.slot = this.createEmptySlot(entry.workerId);
      this.activateTailParallelAudits();
      if (this.auditQueue.length > 0 && !entry.runningAuditSeed) {
        this.dispatchAuditSeedToEntry(entry);
      }
    }
  }

  private cancelInFlightAuditSeeds(poolAuditId: number): void {
    for (const e of this.auditEntries) {
      if (e.runningAuditSeed && e.activeAuditId === poolAuditId) {
        this.postToEntry(e, { type: 'CANCEL_AUDIT', auditId: poolAuditId });
      }
    }
    for (const e of this.trainEntries) {
      if (e.runningAuditSeed && e.activeAuditId === poolAuditId) {
        this.postToEntry(e, { type: 'CANCEL_AUDIT', auditId: poolAuditId });
      }
    }
  }

  private settleAuditJob(job: PendingAuditJob): void {
    if (job.settled) return;
    job.settled = true;
    this.pendingAudits.delete(job.poolAuditId);

    // Purge unstarted seeds AND immediately preempt in-flight sibling seeds on fail-fast!
    if (this.auditQueue.length > 0) {
      this.auditQueue = this.auditQueue.filter(
        (t) => t.poolAuditId !== job.poolAuditId
      );
    }
    this.cancelInFlightAuditSeeds(job.poolAuditId);

    const seedScores: number[] = [];
    let minSeedScore = Infinity;
    let sum = 0;
    for (let i = 0; i < job.scoresBySeed.length; i++) {
      const sc = job.scoresBySeed[i];
      if (sc !== null) {
        seedScores.push(sc);
        sum += sc;
        if (sc < minSeedScore) minSeedScore = sc;
      }
    }

    const verifiedPerfect =
      job.allSurvived &&
      seedScores.length === job.verificationSeeds &&
      job.verificationSeeds > 0;

    const result: AggregatedAuditResult = {
      auditId: job.workerAuditId,
      seedScores,
      minSeedScore: seedScores.length > 0 ? minSeedScore : 0,
      meanSeedScore:
        seedScores.length > 0
          ? Number((sum / seedScores.length).toFixed(1))
          : 0,
      verifiedPerfect,
      ticksEvaluated: job.totalTicks,
      elapsedMs: Math.max(1, performance.now() - job.startedAtMs),
    };

    job.requesterEntry.awaitingAudit = false;

    if (this.status !== 'IDLE') {
      this.postToEntry(job.requesterEntry, {
        type: 'AUDIT_RESULT',
        result,
      });
    }
  }

  private releaseComputeWorkers(): void {
    if (this.gpuWorker) {
      try {
        this.gpuWorker.terminate();
      } catch {
        // ignore termination errors
      }
      this.gpuWorker = null;
    }
    for (const entry of this.trainEntries) {
      try {
        entry.worker.terminate();
      } catch {
        // ignore
      }
    }
    for (const entry of this.auditEntries) {
      try {
        entry.worker.terminate();
      } catch {
        // ignore
      }
    }
    this.trainEntries = [];
    this.auditEntries = [];
  }

  private finishSweepIfComplete(): boolean {
    const allDrained =
      this.getRemainingQueueCount() === 0 && this.activeSpecs.size === 0;
    if (this.completedTrials < this.totalRunQueueTarget && !allDrained) {
      return false;
    }
    if (allDrained && this.completedTrials < this.totalRunQueueTarget) {
      this.totalRunQueueTarget = this.completedTrials;
    }
    if (this.status === 'RUNNING') {
      this.accumulatedElapsedMs += performance.now() - this.sweepStartMs;
    }
    this.pausedAtMs = 0;
    this.status = 'COMPLETED';
    this.gpuActive = false;
    this.gpuActiveTrials = 0;
    this.gpuTrialIndices.clear();
    this.gpuSlots = [];
    this.stopUiTimer();
    this.profiler.pause();
    this.profiler.logToConsole('complete');
    const finalProgress = this.buildProgress();
    // Terminate compute workers + WebGPU device immediately so the browser reclaims
    // ~500-800MB RAM before React state flush, IndexedDB persistence, and Analytics run.
    this.releaseComputeWorkers();
    this.callbacks.onSweepComplete(finalProgress);
    return true;
  }

  private handleGpuMessage(msg: GpuWorkerOutbound): void {
    if (this.status === 'IDLE') return;
    const msgStart = performance.now();
    try {
      if (msg.type === 'GPU_READY') {
        this.gpuActive = true;
        this.gpuSupportsBio = Boolean(msg.supportsBioKernels);
        this.gpuSupportsFullFrontier = Boolean(msg.supportsFullFrontier);
        this.gpuIsIntegrated = Boolean(msg.isIntegrated);
        this.gpuLabel = msg.adapterLabel;
        this.gpuTicksWindowStartMs = performance.now();
        this.gpuTicksWindowCount = 0;
        this.profiler.setGpuLabel(msg.adapterLabel, this.gpuIsIntegrated);
        // Reset PROBE_GPU clock once shader compile finishes so compilation overhead never skews GPU score
        if (this.autoTuneStage === 'PROBE_GPU') {
          this.resetProbeCounters();
        }
        // If browser fell back to WebGL2 on a Shaped/Curriculum sweep, immediately return items and hand off to full CPU
        if (
          !this.gpuSupportsFullFrontier &&
          (this.sweepConfig?.shapedFitness || this.sweepConfig?.curriculumLearning)
        ) {
          this.gpuActive = false;
          this.gpuActiveTrials = 0;
          this.gpuSlots = [];
          this.gpuTicksPerSec = 0;
          this.gpuLabel = `Fallback CPU (WebGL2 bez Shaped/Curriculum)`;
          this.effectiveBackend = 'CPU';
          this.cpuWorkersPausedByTuner = false;
          this.cpuDrainOnlyMode = false;
          this.postToGpu({ type: 'RETURN_AND_STOP' });
          if (this.autoTuneStage !== 'OFF' && this.autoTuneStage !== 'LOCKED') {
            this.autoTuneStage = 'LOCKED';
            this.autoTuneStatus = 'Auto → CPU (WebGL2 bez trybu Frontier)';
          }
          const remaining = this.getRemainingQueueCount();
          if (this.status === 'RUNNING' && remaining > 0) {
            const targetTrain = Math.max(
              1,
              Math.min(this.fullSafeTrainWorkers, remaining)
            );
            this.ensureWorkers(targetTrain, 0);
            this.profiler.setWorkerCounts(targetTrain, 0, 'CPU');
            for (const entry of this.trainEntries) {
              this.topUpTrainEntry(entry);
            }
          }
        }
        this.callbacks.onProgress(this.buildProgress());
        return;
      }

      if (msg.type === 'GPU_RETURNED_ITEMS') {
        if (msg.returnedItems.length > 0) {
          this.enqueueReturnedItems(msg.returnedItems);
        }
        if (this.status === 'RUNNING') {
          if (!this.cpuWorkersPausedByTuner && !this.cpuDrainOnlyMode) {
            for (const entry of this.trainEntries) {
              this.topUpTrainEntry(entry);
            }
          }
          this.maybeTriggerGpuToCpuHandoff();
        }
        return;
      }

      if (msg.type === 'GPU_ERROR') {
        // eslint-disable-next-line no-console
        console.warn(
          '[NeuroLab GPU] Fallback to CPU workers:',
          msg.message
        );
        this.fallbackGpuToCpu(msg.message, msg.returnedItems);
        return;
      }

      if (msg.type === 'GPU_VERIFY_REQUEST') {
        if (this.status === 'RUNNING' || this.status === 'PAUSED') {
          this.gpuVerifyQueue.push({
            reqId: msg.reqId,
            brain: msg.brain,
            difficulty: msg.difficulty,
            targetPipeCap: msg.targetPipeCap,
            verificationSeeds: msg.verificationSeeds,
            customEnvironment: msg.customEnvironment,
            failFast: msg.failFast,
          });
          this.pumpGpuVerifyQueue();
        }
        return;
      }

      if (msg.type === 'GPU_NEED_TRIALS') {
        if (this.status === 'RUNNING' && this.gpuWorker && this.gpuActive) {
          const items = this.pullFromQueue(msg.wantCount, 'GPU');
          if (items.length > 0) {
            for (let i = 0; i < items.length; i++) {
              this.gpuTrialIndices.add(items[i].trialIndex);
            }
            this.postToGpu({ type: 'FEED_TRIALS', items });
          }
        }
        return;
      }

      if (msg.type === 'GPU_BATCH_STATS') {
        this.gpuActive = true;
        this.gpuActiveTrials = msg.activeTrials;
        this.gpuTicksWindowCount += msg.ticks;
        this.probeGpuTicks += msg.ticks;
        this.probeGpuBatchMsSum += msg.dispatchMs;
        this.probeGpuBatches += 1;
        const now =
          this.status === 'PAUSED' && this.pausedAtMs > 0
            ? this.pausedAtMs
            : performance.now();
        const winMs = now - this.gpuTicksWindowStartMs;
        if (winMs >= 800) {
          this.gpuTicksPerSec = Math.round(
            (this.gpuTicksWindowCount / winMs) * 1000
          );
          this.gpuTicksWindowStartMs = now;
          this.gpuTicksWindowCount = 0;
        }
        this.profiler.recordGpuBatch(
          msg.tasks,
          msg.ticks,
          msg.dispatchMs,
          msg.activeTrials,
          msg.kernelKind,
          msg.waveWeightBudget,
          msg.maxInFlightWaves,
          msg.breathMs,
          msg.awaitingVerifyCount
        );
        return;
      }

      if (msg.type === 'GPU_SLOTS') {
        this.gpuSlots = msg.slots;
        return;
      }

      if (msg.type === 'TRIAL_DONE') {
        this.gpuTrialIndices.delete(msg.trialIndex);
        this.activeSpecs.delete(msg.trialIndex);
        this.completedTrials += 1;
        this.probeTrials += 1;
        this.trialRateWindowCount += 1;
        this.updateLiveTrialRate(
          this.status === 'PAUSED' && this.pausedAtMs > 0
            ? this.pausedAtMs
            : performance.now()
        );
        this.probeGpuTicks += msg.trial.auditTicksEvaluated ?? 0;
        this.profiler.recordGpuTrialDone(
          msg.trial.verifiedPerfect && msg.trial.generationsRun === 1,
          msg.cpuVerifyMs,
          msg.trial.auditTicksEvaluated ?? 0,
          msg.trial.architecture ?? 'MLP',
          msg.trial.totalTicksEvaluated,
          msg.auditCacheHits ?? 0
        );
        this.callbacks.onTrialComplete(msg.trial);

        if (this.finishSweepIfComplete()) return;
        this.maybeTriggerGpuToCpuHandoff();

        const now = performance.now();
        if (now - this.lastProgressEmitMs >= 500) {
          this.lastProgressEmitMs = now;
          this.callbacks.onProgress(this.buildProgress());
        }
      }
    } finally {
      this.profiler.recordPoolMessageMs(performance.now() - msgStart);
    }
  }

  private handleWorkerMessage(
    entry: WorkerEntry,
    msg: ResearchWorkerOutbound
  ): void {
    if (this.status === 'IDLE') return;
    const msgStart = performance.now();
    try {
      this.processWorkerMessage(entry, msg);
    } finally {
      this.profiler.recordPoolMessageMs(performance.now() - msgStart);
    }
  }

  private processWorkerMessage(
    entry: WorkerEntry,
    msg: ResearchWorkerOutbound
  ): void {
    if (msg.type === 'SLOT_PROGRESS') {
      entry.slot = msg.slot;
      if (msg.deltaTicks > 0) {
        this.profiler.recordCpuDeltaTicks(msg.deltaTicks);
        this.probeCpuTicks += msg.deltaTicks;
      }
      return;
    }

    if (msg.type === 'GPU_VERIFY_DONE') {
      entry.runningAuditSeed = false;
      entry.activeGpuVerify = null;
      entry.busy = false;
      entry.busyKind = 'IDLE';
      entry.slot = this.createEmptySlot(entry.workerId);
      if (this.gpuWorker && this.gpuActive) {
        this.postToGpu({
          type: 'GPU_VERIFY_RESULT',
          reqId: msg.reqId,
          seedScores: msg.seedScores,
          minSeedScore: msg.minSeedScore,
          meanSeedScore: msg.meanSeedScore,
          verifiedPerfect: msg.verifiedPerfect,
          ticksEvaluated: msg.ticksEvaluated,
          elapsedMs: msg.elapsedMs,
          failureAutopsy: msg.failureAutopsy,
          reasoningTelemetry: msg.reasoningTelemetry,
        });
      }
      if (this.status === 'RUNNING') {
        this.pumpGpuVerifyQueue();
        this.pumpAuditQueue();
        if (entry.role === 'TRAIN' && !entry.busy && !entry.runningAuditSeed) {
          this.topUpTrainEntry(entry);
        }
      }
      return;
    }

    if (msg.type === 'AUDIT_REQUEST') {
      entry.awaitingAudit = true;
      const poolAuditId = this.nextPoolAuditId++;
      const job: PendingAuditJob = {
        poolAuditId,
        requesterEntry: entry,
        workerAuditId: msg.auditId,
        verificationSeeds: msg.verificationSeeds,
        failFast: msg.failFast,
        startedAtMs: performance.now(),
        completedSeeds: 0,
        totalTicks: 0,
        scoresBySeed: new Array<number | null>(msg.verificationSeeds).fill(null),
        allSurvived: true,
        settled: false,
      };
      this.pendingAudits.set(poolAuditId, job);

      for (let s = 0; s < msg.verificationSeeds; s++) {
        this.auditQueue.push({
          poolAuditId,
          seedIndex: s,
          seed: 1009 + s * 7919,
          brain: msg.brain,
          difficulty: msg.difficulty,
          targetPipeCap: msg.targetPipeCap,
          customEnvironment: msg.customEnvironment,
        });
      }

      this.pumpAuditQueue();
      return;
    }

    if (msg.type === 'AUDIT_SEED_CANCELLED') {
      this.profiler.recordAuditSeedCancelled();
      entry.runningAuditSeed = false;
      entry.activeAuditId = null;
      entry.activeAuditSeed = null;
      if (entry.role === 'AUDIT' || !entry.awaitingAudit) {
        if (entry.busyKind === 'AUDIT_SEED') {
          entry.busy = false;
          entry.busyKind = 'IDLE';
          entry.slot = this.createEmptySlot(entry.workerId);
        }
      }
      if (this.status === 'RUNNING') {
        if (entry.role === 'TRAIN' && entry.awaitingAudit) {
          this.dispatchAuditSeedToEntry(entry);
        } else if (
          entry.role === 'TRAIN' &&
          !entry.busy &&
          this.getRemainingQueueCount() > 0
        ) {
          this.topUpTrainEntry(entry);
        } else if (entry.role === 'AUDIT' || !entry.busy) {
          this.dispatchAuditSeedToEntry(entry);
        }
      }
      return;
    }

    if (msg.type === 'AUDIT_SEED_DONE') {
      this.profiler.recordAuditSeedDone(
        msg.cpuMs,
        msg.elapsedMs,
        msg.survivedFull
      );
      const wasHelpingWhileAwaiting =
        entry.role === 'TRAIN' && entry.busyKind === 'TRIAL';
      entry.runningAuditSeed = false;
      entry.activeAuditId = null;
      entry.activeAuditSeed = null;
      if (!wasHelpingWhileAwaiting) {
        entry.busy = false;
        entry.busyKind = 'IDLE';
        entry.slot = this.createEmptySlot(entry.workerId);
      }

      const job = this.pendingAudits.get(msg.auditId);
      if (job && !job.settled) {
        job.scoresBySeed[msg.seedIndex] = msg.score;
        job.completedSeeds += 1;
        job.totalTicks += msg.ticks;
        if (!msg.survivedFull) {
          job.allSurvived = false;
        }

        // Update requester slot detail so user sees live parallel seed progress
        if (job.requesterEntry.slot.phase === 'AUDITING') {
          job.requesterEntry.slot.auditDetail = `Audit ${job.completedSeeds}/${job.verificationSeeds}`;
        }

        if (
          (job.failFast && !msg.survivedFull) ||
          job.completedSeeds >= job.verificationSeeds
        ) {
          this.settleAuditJob(job);
        }
      }

      if (this.status === 'RUNNING') {
        if (entry.role === 'TRAIN' && entry.awaitingAudit) {
          // Still waiting on own audit -> immediately grab next audit seed!
          this.dispatchAuditSeedToEntry(entry);
        } else if (
          entry.role === 'TRAIN' &&
          !entry.busy &&
          this.getRemainingQueueCount() > 0
        ) {
          this.topUpTrainEntry(entry);
        } else if (entry.role === 'AUDIT' || !entry.busy) {
          this.dispatchAuditSeedToEntry(entry);
        }
      }
      return;
    }

    if (msg.type === 'TRIAL_DONE') {
      this.activeSpecs.delete(msg.trialIndex);
      this.completedTrials += 1;
      this.probeTrials += 1;
      this.trialRateWindowCount += 1;
      this.updateLiveTrialRate(
        this.status === 'PAUSED' && this.pausedAtMs > 0
          ? this.pausedAtMs
          : performance.now()
      );
      if (msg.unreportedTicks > 0) {
        this.profiler.recordCpuDeltaTicks(msg.unreportedTicks);
        this.probeCpuTicks += msg.unreportedTicks;
      }
      this.profiler.recordTrialDone(
        msg.perf,
        msg.trial.verifiedPerfect && msg.trial.generationsRun === 1,
        msg.trial.architecture ?? 'MLP'
      );
      entry.awaitingAudit = false;
      const itemIdx = entry.inflightItems.findIndex(
        (it) => it.trialIndex === msg.trialIndex
      );
      if (itemIdx !== -1) {
        entry.inflightItems.splice(itemIdx, 1);
      }
      entry.inflightCount = entry.inflightItems.length;
      const finishedSweep = this.completedTrials >= this.totalRunQueueTarget;

      // Immediately top up prefetch buffer (or transition to idle/tail-audit) BEFORE notifying React
      if (!finishedSweep && this.status === 'RUNNING') {
        if (entry.inflightCount > 0) {
          entry.startedAtMs = performance.now();
        }
        this.topUpTrainEntry(entry);
      } else {
        entry.busy = false;
        entry.busyKind = 'IDLE';
        entry.inflightCount = 0;
        entry.inflightItems = [];
        entry.slot = this.createEmptySlot(entry.workerId);
      }

      this.callbacks.onTrialComplete(msg.trial);

      if (this.finishSweepIfComplete()) return;

      // Throttle main-thread React progress emissions to avoid UI thrashing during rapid G1 bursts
      const now = performance.now();
      if (now - this.lastProgressEmitMs >= 500) {
        this.lastProgressEmitMs = now;
        this.callbacks.onProgress(this.buildProgress());
      }
    }
  }

  private resetProbeCounters(): void {
    this.autoTuneStageStartMs = performance.now();
    this.probeCpuTicks = 0;
    this.probeGpuTicks = 0;
    this.probeTrials = 0;
    this.probeGpuBatchMsSum = 0;
    this.probeGpuBatches = 0;
    this.probeLagMsSum = 0;
    this.probeLagTicks = 0;
  }

  private computeSmoothScore(
    ticksMPerSec: number,
    avgGpuBatchMs: number,
    avgLagMs: number
  ): number {
    let mult = 1.0;
    if (avgGpuBatchMs > 0) {
      if (this.gpuIsIntegrated) {
        if (avgGpuBatchMs > 68) mult *= 0.65;
        else if (avgGpuBatchMs > 46) mult *= 0.82;
      } else if (avgGpuBatchMs > 95) {
        mult *= 0.85;
      }
    }
    if (avgLagMs > 25) mult *= 0.72;
    else if (avgLagMs > 12) mult *= 0.86;
    else if (avgLagMs > 6) mult *= 0.94;
    return ticksMPerSec * mult;
  }

  private captureProbeMetrics(
    mode: 'CPU' | 'GPU' | 'HYBRID'
  ): AutoTuneProbeMetrics {
    const durationSec = Math.max(
      0.5,
      (performance.now() - this.autoTuneStageStartMs) / 1000
    );
    const cpuTicksMPerSec = this.probeCpuTicks / 1e6 / durationSec;
    const gpuTicksMPerSec = this.probeGpuTicks / 1e6 / durationSec;
    const ticksMPerSec = cpuTicksMPerSec + gpuTicksMPerSec;
    const trialsPerSec = this.probeTrials / durationSec;
    const avgGpuBatchMs =
      this.probeGpuBatches > 0
        ? this.probeGpuBatchMsSum / this.probeGpuBatches
        : 0;
    const avgLoopLagMs =
      this.probeLagTicks > 0 ? this.probeLagMsSum / this.probeLagTicks : 0;
    const smoothScore = this.computeSmoothScore(
      ticksMPerSec,
      mode === 'CPU' ? 0 : avgGpuBatchMs,
      avgLoopLagMs
    );
    return {
      mode,
      durationSec,
      ticksMPerSec,
      gpuTicksMPerSec,
      cpuTicksMPerSec,
      trialsPerSec,
      avgGpuBatchMs,
      avgLoopLagMs,
      smoothScore,
    };
  }

  private bootGpuWorker(concurrency: number, initialCount: number): boolean {
    if (!this.sweepConfig) return false;
    const initialTrials = this.pullFromQueue(initialCount, 'GPU');
    if (initialTrials.length === 0) return false;
    for (let i = 0; i < initialTrials.length; i++) {
      this.gpuTrialIndices.add(initialTrials[i].trialIndex);
    }
    this.gpuActive = true;
    this.ensureGpuWorker();
    this.postToGpu({
      type: 'INIT_AND_START',
      sweepConfig: this.sweepConfig,
      maxConcurrentTrials: concurrency,
      initialTrials,
      useAsyncVerify: this.auditEntries.length > 0,
    });
    return true;
  }

  private applyLockedWinner(
    winner: 'CPU' | 'GPU' | 'HYBRID',
    reason: string
  ): void {
    this.autoTuneStage = 'LOCKED';
    this.effectiveBackend = winner;
    this.profiler.recordAutoTuneSummary({
      probes: this.autoTuneProbes,
      winner,
      reason,
    });
    const winProbe = this.autoTuneProbes.find((p) => p.mode === winner);
    const speedStr = winProbe ? `${winProbe.ticksMPerSec.toFixed(1)}M t/s` : '';
    this.autoTuneStatus = `Auto → ${winner}${speedStr ? ` (${speedStr})` : ''} · ${reason}`;

    if (winner === 'CPU') {
      this.cpuWorkersPausedByTuner = false;
      this.cpuDrainOnlyMode = false;
      if (this.gpuWorker && this.gpuActive) {
        this.gpuActive = false;
        this.gpuActiveTrials = 0;
        this.gpuSlots = [];
        this.gpuTicksPerSec = 0;
        this.gpuVerifyQueue = [];
        this.postToGpu({ type: 'RETURN_AND_STOP' });
      }
      this.ensureWorkers(this.fullSafeTrainWorkers, 0);
      this.profiler.setWorkerCounts(
        this.trainEntries.length,
        this.auditEntries.length,
        'CPU'
      );
      for (const entry of this.trainEntries) {
        if (entry.busy && entry.busyKind === 'TRIAL') {
          this.postToEntry(entry, { type: 'RESUME' });
        }
        this.topUpTrainEntry(entry);
      }
    } else if (winner === 'GPU') {
      this.cpuWorkersPausedByTuner = false;
      this.cpuDrainOnlyMode = true;
      this.profiler.setWorkerCounts(
        0,
        this.auditEntries.length,
        'GPU'
      );
      // Let any in-flight CPU trial finish cleanly (zero wasted work), then stay idle while GPU gets 100% TDP
      for (const entry of this.trainEntries) {
        if (entry.busy && entry.busyKind === 'TRIAL') {
          this.postToEntry(entry, { type: 'RESUME' });
        }
      }
      if (!this.gpuActive) {
        const gpuRem = this.getRemainingGpuQueueCount();
        if (gpuRem > 0) {
          this.bootGpuWorker(112, Math.min(128, gpuRem));
        }
      }
    } else {
      // HYBRID winner: keep GPU + capped CPU workers running together, gracefully trim excess workers
      this.cpuWorkersPausedByTuner = false;
      this.cpuDrainOnlyMode = false;
      const cores = getHardwareCores();
      const maxAudits = Math.max(2, cores <= 6 ? cores - this.hybridMaxTrainWorkers : 4);
      for (let i = this.trainEntries.length - 1; i >= 0; i--) {
        const entry = this.trainEntries[i];
        if (entry.busy && entry.busyKind === 'TRIAL') {
          this.postToEntry(entry, { type: 'RESUME' });
        }
        if (i < this.hybridMaxTrainWorkers) {
          this.topUpTrainEntry(entry);
        } else if (entry.inflightCount === 0) {
          if (this.auditEntries.length < maxAudits) {
            this.trainEntries.splice(i, 1);
            entry.role = 'AUDIT';
            this.auditEntries.push(entry);
            this.pumpGpuVerifyQueue();
          } else {
            this.trainEntries.splice(i, 1);
            entry.worker.terminate();
          }
        }
      }
      this.profiler.setWorkerCounts(
        this.hybridMaxTrainWorkers,
        this.auditEntries.length,
        'HYBRID'
      );
    }

    this.callbacks.onProgress(this.buildProgress());
  }

  private advanceAutoTunerIfNeeded(): void {
    if (
      this.status !== 'RUNNING' ||
      this.autoTuneStage === 'OFF' ||
      this.autoTuneStage === 'LOCKED'
    ) {
      return;
    }

    const elapsedMs = performance.now() - this.autoTuneStageStartMs;

    // Stage 0 (2.0s): Warm up newly spawned CPU workers & V8 TurboFan JIT before timing PROBE_CPU
    // so PROBE_CPU is measured apples-to-apples against already-warm PROBE_HYBRID!
    if (this.autoTuneStage === 'WARMUP_CPU') {
      if (elapsedMs < 2000) return;
      this.autoTuneStage = 'PROBE_CPU';
      this.autoTuneStatus = 'Auto-Tune [1/3]: Probing CPU (warm JIT)…';
      this.resetProbeCounters();
      return;
    }

    const probeWindowMs = 4500;
    if (elapsedMs < probeWindowMs) return;

    if (this.autoTuneStage === 'PROBE_CPU') {
      const cpuMetrics = this.captureProbeMetrics('CPU');
      this.autoTuneProbes.push(cpuMetrics);

      const gpuRem = this.getRemainingGpuQueueCount();
      if (gpuRem < 16) {
        this.applyLockedWinner('CPU', 'too few GPU trials left');
        return;
      }

      // Pause CPU train workers cleanly (preserving their exact trial progress) so GPU probes at 100% SoC TDP
      this.cpuWorkersPausedByTuner = true;
      for (const entry of this.trainEntries) {
        if (entry.busy && entry.busyKind === 'TRIAL') {
          this.postToEntry(entry, { type: 'PAUSE' });
        }
      }
      this.effectiveBackend = 'GPU';
      this.autoTuneStage = 'PROBE_GPU';
      this.autoTuneStatus = `Auto-Tune [2/3]: Probing GPU… (CPU ${cpuMetrics.ticksMPerSec.toFixed(1)}M t/s)`;
      this.resetProbeCounters();
      const booted = this.bootGpuWorker(96, Math.min(112, gpuRem));
      if (!booted) {
        this.applyLockedWinner('CPU', 'no GPU queue');
      }
      return;
    }

    if (this.autoTuneStage === 'PROBE_GPU') {
      // Wait if GPU hasn't even finished 2 batches yet (e.g. slow shader compile), up to 9s max
      if (this.probeGpuBatches < 2 && elapsedMs < 9000) return;

      const gpuMetrics = this.captureProbeMetrics('GPU');
      this.autoTuneProbes.push(gpuMetrics);

      if (this.getRemainingQueueCount() < 16) {
        const cpuProbe = this.autoTuneProbes[0];
        const winner =
          gpuMetrics.smoothScore > cpuProbe.smoothScore * 1.04 ? 'GPU' : 'CPU';
        this.applyLockedWinner(winner, 'tail short-circuit');
        return;
      }

      // Transition to PROBE_HYBRID: resume capped CPU workers alongside running GPU
      this.cpuWorkersPausedByTuner = false;
      this.effectiveBackend = 'HYBRID';
      this.autoTuneStage = 'PROBE_HYBRID';
      this.autoTuneStatus = `Auto-Tune [3/3]: Probing Hybrid… (GPU ${gpuMetrics.ticksMPerSec.toFixed(1)}M t/s)`;
      this.resetProbeCounters();
      for (let i = 0; i < this.trainEntries.length; i++) {
        const entry = this.trainEntries[i];
        if (i < this.hybridMaxTrainWorkers) {
          if (entry.busy && entry.busyKind === 'TRIAL') {
            this.postToEntry(entry, { type: 'RESUME' });
          } else {
            this.topUpTrainEntry(entry);
          }
        }
      }
      return;
    }

    if (this.autoTuneStage === 'PROBE_HYBRID') {
      const hybridMetrics = this.captureProbeMetrics('HYBRID');
      this.autoTuneProbes.push(hybridMetrics);

      const cpuP = this.autoTuneProbes.find((p) => p.mode === 'CPU')!;
      const gpuP = this.autoTuneProbes.find((p) => p.mode === 'GPU')!;
      const bestSingle =
        gpuP.smoothScore > cpuP.smoothScore * 1.04 ? gpuP : cpuP;

      const igpuStutter =
        this.gpuIsIntegrated && hybridMetrics.avgGpuBatchMs > 62;
      const cpuPerCore =
        cpuP.cpuTicksMPerSec / Math.max(1, this.fullSafeTrainWorkers);
      const sacrificedCores =
        Math.max(0, this.fullSafeTrainWorkers - this.hybridMaxTrainWorkers) +
        this.auditEntries.length * 0.4;
      const igpuNegativeRoi =
        this.gpuIsIntegrated &&
        sacrificedCores > 0 &&
        hybridMetrics.gpuTicksMPerSec < cpuPerCore * sacrificedCores * 1.15;
      const hybridGain =
        bestSingle.smoothScore > 0
          ? (hybridMetrics.smoothScore - bestSingle.smoothScore) /
            bestSingle.smoothScore
          : 0;

      if (!igpuStutter && !igpuNegativeRoi && hybridGain >= 0.08) {
        this.applyLockedWinner(
          'HYBRID',
          `+${(hybridGain * 100).toFixed(0)}% over ${bestSingle.mode}`
        );
      } else if (bestSingle.mode === 'GPU') {
        this.applyLockedWinner(
          'GPU',
          igpuStutter
            ? `beats CPU & avoids ${hybridMetrics.avgGpuBatchMs.toFixed(0)}ms Hybrid iGPU stall`
            : `beats CPU (${gpuP.ticksMPerSec.toFixed(1)} vs ${cpuP.ticksMPerSec.toFixed(1)}M/s)`
        );
      } else {
        this.applyLockedWinner(
          'CPU',
          igpuStutter
            ? `smooth & avoids ${hybridMetrics.avgGpuBatchMs.toFixed(0)}ms Hybrid iGPU contention`
            : igpuNegativeRoi
              ? `iGPU +${hybridMetrics.gpuTicksMPerSec.toFixed(1)}M/s < ${sacrificedCores.toFixed(1)} freed CPU cores (~${(cpuPerCore * sacrificedCores).toFixed(1)}M/s)`
              : `fastest (${cpuP.ticksMPerSec.toFixed(1)}M/s vs GPU ${gpuP.ticksMPerSec.toFixed(1)}M/s)`
        );
      }
    }
  }

  /**
   * Sequential GPU -> CPU handoff: when GPU finishes all GPU-eligible buckets
   * while CPU_ONLY trials still remain, stop GPU and wake up full CPU at 100% TDP!
   */
  private maybeTriggerGpuToCpuHandoff(): void {
    if (this.status !== 'RUNNING' || this.effectiveBackend !== 'GPU') return;
    if (this.autoTuneStage === 'PROBE_GPU') return;
    if (
      this.getRemainingGpuQueueCount() > 0 ||
      this.gpuTrialIndices.size > 0 ||
      this.gpuActiveTrials > 0
    ) {
      return;
    }
    const cpuOnlyRem = this.getBucketRemaining(this.buckets.CPU_ONLY);
    if (cpuOnlyRem <= 0) return;

    this.effectiveBackend = 'CPU';
    this.cpuDrainOnlyMode = false;
    this.cpuWorkersPausedByTuner = false;
    if (this.gpuWorker && this.gpuActive) {
      this.gpuActive = false;
      this.gpuActiveTrials = 0;
      this.gpuSlots = [];
      this.gpuTicksPerSec = 0;
      this.postToGpu({ type: 'STOP' });
    }
    const targetCpu = Math.max(
      1,
      Math.min(this.fullSafeTrainWorkers, cpuOnlyRem)
    );
    this.ensureWorkers(targetCpu, 0);
    this.profiler.setWorkerCounts(targetCpu, 0, 'CPU');
    if (this.computeBackend === 'AUTO') {
      this.autoTuneStatus = `Auto → CPU Handoff (${cpuOnlyRem} CPU-only left)`;
    }
    for (const entry of this.trainEntries) {
      if (entry.busy && entry.busyKind === 'TRIAL') {
        this.postToEntry(entry, { type: 'RESUME' });
      }
      this.topUpTrainEntry(entry);
    }
  }

  private sampleConcurrency(): void {
    let trainRunning = 0;
    let trainAwaitingIdle = 0;
    let trainHelpingAudit = 0;
    let trainIdle = 0;
    for (const e of this.trainEntries) {
      if (e.runningAuditSeed) {
        trainHelpingAudit += 1;
      } else if (e.awaitingAudit) {
        trainAwaitingIdle += 1;
      } else if (e.busy && e.busyKind === 'TRIAL') {
        trainRunning += 1;
      } else {
        trainIdle += 1;
      }
    }

    let auditHelperBusy = 0;
    let auditHelperIdle = 0;
    for (const e of this.auditEntries) {
      if (e.runningAuditSeed || e.busy) {
        auditHelperBusy += 1;
      } else {
        auditHelperIdle += 1;
      }
    }

    this.profiler.recordSample({
      trainRunning,
      trainAwaitingIdle,
      trainHelpingAudit,
      trainIdle,
      auditHelperBusy,
      auditHelperIdle,
      auditQueueLen: this.auditQueue.length,
      gpuVerifyQueueLen: this.gpuVerifyQueue.length,
      parallelAuditActive: this.parallelAuditActive,
    });
    this.profiler.maybeLogPeriodic(30000);
  }

  private startUiTimer(): void {
    this.stopUiTimer();
    const intervalMs = 500;
    this.lastUiTickMs = performance.now();
    this.uiTickTimer = setInterval(() => {
      if (this.status === 'RUNNING') {
        const now = performance.now();
        const delta = now - this.lastUiTickMs;
        this.profiler.recordTimerTick(intervalMs, delta);
        this.updateLiveTrialRate(now);
        const lag = Math.max(0, delta - intervalMs);
        this.probeLagMsSum += lag;
        this.probeLagTicks += 1;
        this.lastUiTickMs = now;
        this.advanceAutoTunerIfNeeded();
        this.maybeTriggerGpuToCpuHandoff();
        this.sampleConcurrency();
        this.lastProgressEmitMs = now;
        this.callbacks.onProgress(this.buildProgress());
      }
    }, intervalMs);
  }

  private stopUiTimer(): void {
    if (this.uiTickTimer !== null) {
      clearInterval(this.uiTickTimer);
      this.uiTickTimer = null;
    }
  }

  buildProgress(): ResearchProgress {
    const elapsed =
      this.status === 'RUNNING'
        ? this.accumulatedElapsedMs + (performance.now() - this.sweepStartMs)
        : this.accumulatedElapsedMs;

    const cpuSlots = this.trainEntries.map((e) => ({ ...e.slot }));
    const activeWorkers =
      cpuSlots.length === 0
        ? this.gpuSlots.map((s) => ({ ...s }))
        : this.gpuActive && this.gpuSlots.length > 0
          ? [...this.gpuSlots.slice(0, 4), ...cpuSlots]
          : cpuSlots;

    const activeAuditSeeds =
      this.auditEntries.filter((e) => e.runningAuditSeed).length +
      this.trainEntries.filter((e) => e.runningAuditSeed).length;

    const leadSlot =
      activeWorkers.find((w) => w.phase !== 'IDLE') ?? activeWorkers[0] ?? null;

    const leadSpec =
      leadSlot && leadSlot.trialIndex >= 0
        ? this.activeSpecs.get(leadSlot.trialIndex)
        : undefined;

    const topo = leadSlot?.topology ?? [];
    const totalHidden = topo.reduce((a, b) => a + b, 0);

    const totalCompleted = this.skippedPrecompleted + this.completedTrials;
    const totalAll = Math.max(
      this.totalPlannedTrials,
      this.totalRunQueueTarget + this.skippedPrecompleted
    );

    const activeBusyCpu = this.trainEntries.filter(
      (e) => e.busy || e.runningAuditSeed
    ).length;
    const livePerf = this.profiler.hasData()
      ? this.profiler.getLiveTelemetry(
          Math.max(1, activeBusyCpu),
          this.gpuActive
        )
      : null;

    return {
      status: this.status,
      currentTrialIndex: Math.min(totalCompleted, totalAll),
      completedTrials: totalCompleted,
      sessionCompletedTrials: this.completedTrials,
      liveTrialsPerSec:
        this.liveTrialsPerSec > 0
          ? Number(this.liveTrialsPerSec.toFixed(2))
          : undefined,
      totalTrials: totalAll,
      queueRemaining: this.getRemainingQueueCount(),
      prunedRedundantCount: this.prunedRedundantCount,
      prunedBreakdown: this.prunedBreakdown,
      workerCount:
        this.liveTrainCap > 0
          ? Math.min(this.trainEntries.length, this.liveTrainCap)
          : this.trainEntries.length,
      auditWorkerCount: this.auditEntries.length,
      activeAuditSeeds,
      computeBackend: this.computeBackend,
      performancePriority: this.activePowerProfile.priority,
      priorityLabel: this.activePowerProfile.label,
      liveTicksPerSec: livePerf?.ticksPerSec,
      liveTicksPerCore: livePerf?.ticksPerCore,
      liveEstPerfPerWatt: livePerf?.estPerfPerWatt,
      autoTuneStatus: this.autoTuneStatus || undefined,
      gpuActive: this.gpuActive,
      gpuLabel: this.gpuLabel || undefined,
      gpuActiveTrials: this.gpuActiveTrials,
      gpuTicksPerSec: this.gpuTicksPerSec,
      activeWorkers,
      activeAlgorithm: leadSlot?.algorithm ?? null,
      activeDifficulty: leadSlot?.difficulty ?? null,
      activeTopology: topo,
      activeHiddenNodes: topo.length === 1 ? topo[0] : totalHidden,
      activePopulationSize: leadSlot?.populationSize ?? 0,
      activeMutationRate: leadSpec?.mutationRate ?? 0,
      activeMutationStrength: leadSpec?.mutationStrength ?? 0,
      activeGeneration: leadSlot?.generation ?? 0,
      activeBestScore: leadSlot?.bestScore ?? 0,
      activePhase: leadSlot?.phase === 'AUDITING' ? 'AUDITING' : 'TRAINING',
      elapsedMs: Math.round(elapsed),
    };
  }

  start(
    config: ResearchSweepConfig,
    skipInput?: ReadonlyMap<string, ResearchTrialResult> | ReadonlySet<string>
  ): void {
    this.stop(false);
    this.sweepConfig = config;
    this.computeBackend = config.computeBackend ?? 'CPU';

    // Deduplicate all config dimensions so every virtual index maps to a strictly unique trial
    const algorithms = getAllActiveAlgorithms(config);
    const difficulties = Array.from(new Set(config.difficulties));
    const evoMode: EvolutionTopologyMode = config.evolutionTopologyMode ?? 'SINGLE_SPECIES';
    const rawArchitectures: NetworkArchitecture[] = Array.from(
      new Set(
        config.architectures && config.architectures.length > 0
          ? config.architectures
          : (['MLP'] as NetworkArchitecture[])
      )
    );
    const architectures: NetworkArchitecture[] =
      evoMode === 'ISLAND_SPECIATION'
        ? [
            rawArchitectures.includes('HYBRID_MOE')
              ? 'HYBRID_MOE'
              : rawArchitectures[0],
          ]
        : rawArchitectures;
    const weightPrecisions: WeightPrecision[] = Array.from(
      new Set(
        config.weightPrecisions && config.weightPrecisions.length > 0
          ? config.weightPrecisions
          : (['FP32'] as WeightPrecision[])
      )
    );
    const populationSizes = Array.from(new Set(config.populationSizes));
    const mutationRates = Array.from(new Set(config.mutationRates));
    const mutationStrengths = Array.from(new Set(config.mutationStrengths));
    const currOpts = resolveCurriculumOptions(config);
    const shapeOpts = resolveShapedFitnessOptions(config);
    const maxParams =
      config.maxParameters !== undefined ? config.maxParameters : null;
    const scheduleMode = config.scheduleMode ?? 'BALANCED';

    const rawInputSets =
      config.inputFeatureSets && config.inputFeatureSets.length > 0
        ? config.inputFeatureSets
        : [[...CLASSIC_5_SENSOR_FEATURES]];
    const preInputs: {
      feats: SensorFeatureId[];
      inCount: number;
      inKey: string;
      inSuffix: string;
    }[] = [];
    const seenInputKeys = new Set<string>();
    for (let i = 0; i < rawInputSets.length; i++) {
      const clean = normalizeInputFeatures(rawInputSets[i]);
      const inKey = formatInputSubsetKey(clean);
      if (seenInputKeys.has(inKey)) continue;
      seenInputKeys.add(inKey);
      preInputs.push({
        feats: clean,
        inCount: clean.length,
        inKey,
        inSuffix: isClassic5SensorSet(clean) ? '' : `|in:${inKey}`,
      });
    }

    // 1. Diagonal-interleaved (algorithm, difficulty) pairs
    const pairOrder: PrePair[] = [];
    const algoCount = algorithms.length;
    const diffCount = difficulties.length;
    for (let shift = 0; shift < diffCount; shift++) {
      for (let a = 0; a < algoCount; a++) {
        const algorithm = algorithms[a];
        const difficulty = difficulties[(a + shift) % diffCount];
        pairOrder.push({
          algorithm,
          difficulty,
          adPrefix: `${algorithm}|${difficulty}|`,
        });
      }
    }

    // 2. Hyperparameter tuples (prec x pop x rate x str x curr x shape x morphUnion) sorted & zigzagged
    const morphModesUnionSet = new Set<'STATIC' | 'GROWING'>();
    for (let a = 0; a < architectures.length; a++) {
      const ms = resolveMorphModesForArchitecture(config, architectures[a]);
      for (let mi = 0; mi < ms.length; mi++) morphModesUnionSet.add(ms[mi]);
    }
    const morphModes: Array<'STATIC' | 'GROWING'> = Array.from(morphModesUnionSet);
    const rawHypers: PreHyper[] = [];
    for (let pi = 0; pi < weightPrecisions.length; pi++) {
      const weightPrecision = weightPrecisions[pi];
      const precSuffix = weightPrecision !== 'FP32' ? `|prec:${weightPrecision}` : '';
      for (let popI = 0; popI < populationSizes.length; popI++) {
        const populationSize = populationSizes[popI];
        for (let rI = 0; rI < mutationRates.length; rI++) {
          const mutationRate = mutationRates[rI];
          for (let sI = 0; sI < mutationStrengths.length; sI++) {
            const mutationStrength = mutationStrengths[sI];
            for (let ci = 0; ci < currOpts.length; ci++) {
              const curriculumLearning = currOpts[ci];
              for (let shi = 0; shi < shapeOpts.length; shi++) {
                const shapedFitness = shapeOpts[shi];
                const currShapeSuffix = `${curriculumLearning ? '|curr' : ''}${shapedFitness ? '|shape' : ''}`;
                for (let mi = 0; mi < morphModes.length; mi++) {
                  const morphogenesisMode = morphModes[mi];
                  rawHypers.push({
                    weightPrecision,
                    populationSize,
                    mutationRate,
                    mutationStrength,
                    precSuffix,
                    hyperMid: `p${populationSize}|r${mutationRate}|s${mutationStrength}`,
                    curriculumLearning,
                    shapedFitness,
                    currShapeSuffix,
                    morphogenesisMode,
                    morphSuffix: morphogenesisMode === 'GROWING' ? '|morph' : '',
                  });
                }
              }
            }
          }
        }
      }
    }
    rawHypers.sort((a, b) => b.populationSize - a.populationSize);
    this.hyperCombos =
      scheduleMode === 'BALANCED' ? orderBucketBalanced(rawHypers) : rawHypers;
    this.pairOrder = pairOrder;
    this.tailSig = `|cap${config.targetPipeCap}|sd${config.verificationSeeds}`;

    // 3. Partition valid (arch, inputSet, topology, K, perception) shapes into kernel buckets
    const rawShapesByBucket: Record<QueueBucketKind, PreShape[]> = {
      CPU_ONLY: [],
      FAST_HARD: [],
      FAST: [],
      COMPACT_DEEP: [],
      DEEP_WIDE: [],
      BIO: [],
    };
    const shapeLookup = new Map<string, PreShape>();

    const smartPruneCtx = createSmartPruneContext(config);
    this.smartPruneCtx = smartPruneCtx;
    const pruneSummary = analyzeSmartPrune(config);
    this.prunedRedundantCount = pruneSummary.prunedTotal;
    this.prunedBreakdown = pruneSummary.breakdown;

    for (let a = 0; a < architectures.length; a++) {
      const architecture = architectures[a];
      const archSuffix = architecture !== 'MLP' ? `|arch:${architecture}` : '';
      const archMult = architecture === 'MLP' ? 1.0 : 1.35;
      const allowedAlgos = new Set<LearningAlgorithm>(
        resolveAlgorithmsForArchitecture(config, architecture)
      );
      const allowedMorphModes = new Set<'STATIC' | 'GROWING'>(
        resolveMorphModesForArchitecture(config, architecture)
      );
      const kList = resolveReasoningStepsForArchitecture(config, architecture);
      const percList = resolvePerceptionModesForArchitecture(config, architecture);
      const archTopos = resolveTopologiesForArchitecture(config, architecture);
      const isKArch =
        architecture === 'LOOPED_REASONER' || architecture === 'PONDER_ACT';

      for (let ii = 0; ii < preInputs.length; ii++) {
        const inp = preInputs[ii];
        for (let t = 0; t < archTopos.length; t++) {
          const topology = archTopos[t];
          const params = calculateParameterCount(
            topology,
            inp.inCount,
            1,
            architecture
          );
          if (maxParams !== null && params > maxParams) continue;
          const topoLabel = formatTopologyLabel(topology, inp.inCount);
          const baseBucketKind: QueueBucketKind = classifyShapeBucket(
            topology,
            architecture,
            inp.feats,
            evoMode
          );
          for (let ki = 0; ki < kList.length; ki++) {
            const reasoningSteps = kList[ki];
            const kSuffix = isKArch && reasoningSteps !== 3 ? `|k${reasoningSteps}` : '';
            for (let pei = 0; pei < percList.length; pei++) {
              const perceptionMode = percList[pei];
              const eyeSuffix =
                perceptionMode === 'COMPOUND_EYE_PIXELS' ? '|eye' : '';
              const bucketKind: QueueBucketKind =
                perceptionMode === 'COMPOUND_EYE_PIXELS'
                  ? 'CPU_ONLY'
                  : baseBucketKind;
              const shape: PreShape = {
                architecture,
                topology,
                inputFeatures: inp.feats,
                topoLabel,
                inKey: inp.inKey,
                inSuffix: inp.inSuffix,
                archSuffix,
                reasoningSteps,
                kSuffix,
                perceptionMode,
                eyeSuffix,
                allowedAlgos,
                allowedMorphModes,
                baseCost: (params + 8) * archMult,
                bucketKind,
              };
              rawShapesByBucket[bucketKind].push(shape);
              shapeLookup.set(
                `${architecture}|${inp.inKey}|${topoLabel}|${reasoningSteps}|${perceptionMode}`,
                shape
              );
            }
          }
        }
      }
    }

    const hardPairs = this.pairOrder.filter((p) =>
      isFrontierDifficulty(p.difficulty)
    );
    const easyPairs = this.pairOrder.filter(
      (p) => !isFrontierDifficulty(p.difficulty)
    );

    const orderedFastShapes = (() => {
      const list = rawShapesByBucket.FAST;
      list.sort((a, b) => b.baseCost - a.baseCost);
      return scheduleMode === 'BALANCED' ? orderBucketBalanced(list) : list;
    })();

    const allBucketKinds: QueueBucketKind[] = [
      'CPU_ONLY',
      'FAST_HARD',
      'FAST',
      'COMPACT_DEEP',
      'DEEP_WIDE',
      'BIO',
    ];
    let totalRawCartesian = 0;
    let totalPrunedAll = 0;
    const hyperCount = this.hyperCombos.length;

    // Precompute hyper counts by (morphMode, isCanonicalRate) for O(shapes * pairs) exact tallying
    const countHypersFor = (
      allowedMorphs: Set<'STATIC' | 'GROWING'>,
      onlyCanonicalRate: boolean
    ): number => {
      let c = 0;
      for (let h = 0; h < hyperCount; h++) {
        const hy = this.hyperCombos[h];
        if (!allowedMorphs.has(hy.morphogenesisMode)) continue;
        if (onlyCanonicalRate && hy.mutationRate !== smartPruneCtx.canonicalMutationRate) {
          continue;
        }
        c += 1;
      }
      return c;
    };

    for (let i = 0; i < allBucketKinds.length; i++) {
      const kind = allBucketKinds[i];
      const bucket = createEmptyBucket(kind);
      if (kind === 'FAST_HARD') {
        bucket.pairs = hardPairs;
        bucket.shapes = orderedFastShapes;
      } else if (kind === 'FAST') {
        bucket.pairs = easyPairs;
        bucket.shapes = orderedFastShapes;
      } else {
        const list = rawShapesByBucket[kind];
        list.sort((a, b) => b.baseCost - a.baseCost);
        bucket.pairs = this.pairOrder;
        bucket.shapes =
          scheduleMode === 'BALANCED' ? orderBucketBalanced(list) : list;
      }
      bucket.totalPlanned = bucket.shapes.length * bucket.pairs.length * hyperCount;

      // Exact O(shapes * pairs) pre-prune & per-arch filter tally per bucket so getBucketRemaining stays 100% accurate
      if (bucket.totalPlanned > 0) {
        let bucketPruned = 0;
        for (let si = 0; si < bucket.shapes.length; si++) {
          const sh = bucket.shapes[si];
          const allowedHyperAll = countHypersFor(sh.allowedMorphModes, false);
          const disallowedHyperAll = hyperCount - allowedHyperAll;
          const allowedHyperCanon = countHypersFor(sh.allowedMorphModes, true);
          const allowedHyperNonCanon = allowedHyperAll - allowedHyperCanon;

          for (let pi = 0; pi < bucket.pairs.length; pi++) {
            const pr = bucket.pairs[pi];
            if (!sh.allowedAlgos.has(pr.algorithm)) {
              bucketPruned += hyperCount;
              continue;
            }
            bucketPruned += disallowedHyperAll;
            if (!smartPruneCtx.enabled || allowedHyperAll === 0) continue;

            const rCanon = getTrialPruneReason(smartPruneCtx, {
              algorithm: pr.algorithm,
              difficulty: pr.difficulty,
              architecture: sh.architecture,
              topology: sh.topology,
              inputFeatures: sh.inputFeatures,
              mutationRate: smartPruneCtx.canonicalMutationRate,
            });
            if (rCanon !== null) {
              bucketPruned += allowedHyperAll;
            } else if (
              allowedHyperNonCanon > 0 &&
              getTrialPruneReason(smartPruneCtx, {
                algorithm: pr.algorithm,
                difficulty: pr.difficulty,
                architecture: sh.architecture,
                topology: sh.topology,
                inputFeatures: sh.inputFeatures,
                mutationRate: smartPruneCtx.canonicalMutationRate + 1,
              }) === 'UNUSED_MUTATION_RATE'
            ) {
              bucketPruned += allowedHyperNonCanon;
            }
          }
        }
        bucket.prePruned = bucketPruned;
        totalPrunedAll += bucketPruned;
      }

      this.buckets[kind] = bucket;
      totalRawCartesian += bucket.totalPlanned;
    }

    const totalAll = Math.max(0, totalRawCartesian - totalPrunedAll);

    // 4. O(cached) exact pre-skip counting
    let skipped = 0;
    this.skipSigSet = null;
    this.skipCountsExact = true;

    if (skipInput && skipInput.size > 0 && totalAll > 0) {
      const matchedSigs = new Set<string>();
      const algoSet = new Set<string>(algorithms);
      const diffSet = new Set<string>(difficulties);
      const precSet = new Set<string>(weightPrecisions);
      const popSet = new Set<number>(populationSizes);
      const rateSet = new Set<number>(mutationRates);
      const strSet = new Set<number>(mutationStrengths);
      const currSet = new Set<boolean>(currOpts);
      const shapeSet = new Set<boolean>(shapeOpts);
      const cap = config.targetPipeCap;
      const seeds = config.verificationSeeds;
      const islSuffix = evoMode === 'ISLAND_SPECIATION' ? '|isl' : '';

      if ('get' in skipInput) {
        for (const r of skipInput.values()) {
          const rArch = r.architecture ?? 'MLP';
          const isKArch =
            rArch === 'LOOPED_REASONER' || rArch === 'PONDER_ACT';
          const rK = isKArch ? (r.reasoningSteps ?? 3) : 3;
          const rMorph: 'STATIC' | 'GROWING' =
            r.morphogenesisMode === 'GROWING' ? 'GROWING' : 'STATIC';
          const rEvoMode = r.evolutionTopologyMode ?? 'SINGLE_SPECIES';
          const rPerc: PerceptionMode =
            (rArch === 'DROSOPHILA_CONNECTOME' ||
              rArch === 'DECOUPLED_FLY_CORTEX') &&
            r.perceptionMode === 'COMPOUND_EYE_PIXELS'
              ? 'COMPOUND_EYE_PIXELS'
              : 'GEOMETRIC_LAB';
          const rCurr = Boolean(r.curriculumLearning);
          const rShape = Boolean(r.shapedFitness);
          if (
            r.targetPipeCap !== cap ||
            r.verificationSeeds !== seeds ||
            !currSet.has(rCurr) ||
            !shapeSet.has(rShape) ||
            rEvoMode !== evoMode ||
            !algoSet.has(r.algorithm) ||
            !diffSet.has(r.difficulty) ||
            !precSet.has(r.weightPrecision ?? 'FP32') ||
            !popSet.has(r.populationSize) ||
            !rateSet.has(r.mutationRate) ||
            !strSet.has(r.mutationStrength)
          ) {
            continue;
          }
          const inKey = formatInputSubsetKey(r.inputFeatures);
          const shape = shapeLookup.get(
            `${rArch}|${inKey}|${r.topologyLabel}|${rK}|${rPerc}`
          );
          if (!shape) continue;
          if (
            !shape.allowedAlgos.has(r.algorithm) ||
            !shape.allowedMorphModes.has(rMorph)
          ) {
            continue;
          }
          if (
            smartPruneCtx.enabled &&
            getTrialPruneReason(smartPruneCtx, {
              algorithm: r.algorithm,
              difficulty: r.difficulty,
              architecture: shape.architecture,
              topology: shape.topology,
              inputFeatures: shape.inputFeatures,
              mutationRate: r.mutationRate,
            }) !== null
          ) {
            continue;
          }
          const prec = r.weightPrecision ?? 'FP32';
          const precSuffix = prec !== 'FP32' ? `|prec:${prec}` : '';
          const currShapeSuffix = `${rCurr ? '|curr' : ''}${rShape ? '|shape' : ''}`;
          const morphSuffix = rMorph === 'GROWING' ? '|morph' : '';
          const canonicalSig = `${r.algorithm}|${r.difficulty}|${shape.topoLabel}|p${r.populationSize}|r${r.mutationRate}|s${r.mutationStrength}${this.tailSig}${shape.inSuffix}${shape.archSuffix}${precSuffix}${currShapeSuffix}${shape.kSuffix}${morphSuffix}${islSuffix}${shape.eyeSuffix}`;
          if (!matchedSigs.has(canonicalSig)) {
            matchedSigs.add(canonicalSig);
            const targetBucket: QueueBucketKind =
              shape.bucketKind === 'FAST' && isFrontierDifficulty(r.difficulty)
                ? 'FAST_HARD'
                : shape.bucketKind;
            this.buckets[targetBucket].preSkipped += 1;
            skipped += 1;
          }
        }
      } else {
        const capTok = `cap${cap}`;
        const sdTok = `sd${seeds}`;
        const classic5Key = formatInputSubsetKey(CLASSIC_5_SENSOR_FEATURES);
        for (const sig of skipInput) {
          const parts = sig.split('|');
          if (parts.length < 8) continue;
          const algo = parts[0] as LearningAlgorithm;
          const diff = parts[1] as DifficultyPreset;
          const topoLabel = parts[2];
          if (!algoSet.has(algo) || !diffSet.has(diff)) continue;
          if (parts[6] !== capTok || parts[7] !== sdTok) continue;
          const pop = Number(parts[3].slice(1));
          const mRate = Number(parts[4].slice(1));
          const mStr = Number(parts[5].slice(1));
          if (!popSet.has(pop) || !rateSet.has(mRate) || !strSet.has(mStr)) {
            continue;
          }
          let inKey = classic5Key;
          let arch = 'MLP';
          let prec = 'FP32';
          let hasCurr = false;
          let hasShape = false;
          let hasMorph = false;
          let hasIsl = false;
          let hasEye = false;
          let parsedK = 3;
          for (let p = 8; p < parts.length; p++) {
            const tok = parts[p];
            if (tok.startsWith('in:')) inKey = tok.slice(3);
            else if (tok.startsWith('arch:')) arch = tok.slice(5);
            else if (tok.startsWith('prec:')) prec = tok.slice(5);
            else if (tok === 'curr') hasCurr = true;
            else if (tok === 'shape') hasShape = true;
            else if (tok === 'morph') hasMorph = true;
            else if (tok === 'isl') hasIsl = true;
            else if (tok === 'eye') hasEye = true;
            else if (tok.startsWith('k') && tok.length > 1) {
              const kv = Number(tok.slice(1));
              if (Number.isFinite(kv)) parsedK = kv;
            }
          }
          if (!currSet.has(hasCurr) || !shapeSet.has(hasShape)) continue;
          if ((hasIsl ? 'ISLAND_SPECIATION' : 'SINGLE_SPECIES') !== evoMode) continue;
          if (!precSet.has(prec)) continue;
          const rPerc: PerceptionMode =
            (arch === 'DROSOPHILA_CONNECTOME' ||
              arch === 'DECOUPLED_FLY_CORTEX') &&
            hasEye
              ? 'COMPOUND_EYE_PIXELS'
              : 'GEOMETRIC_LAB';
          const shape = shapeLookup.get(
            `${arch}|${inKey}|${topoLabel}|${parsedK}|${rPerc}`
          );
          if (!shape) continue;
          const rMorph: 'STATIC' | 'GROWING' = hasMorph ? 'GROWING' : 'STATIC';
          if (
            !shape.allowedAlgos.has(algo) ||
            !shape.allowedMorphModes.has(rMorph)
          ) {
            continue;
          }
          if (
            smartPruneCtx.enabled &&
            getTrialPruneReason(smartPruneCtx, {
              algorithm: algo,
              difficulty: diff,
              architecture: shape.architecture,
              topology: shape.topology,
              inputFeatures: shape.inputFeatures,
              mutationRate: mRate,
            }) !== null
          ) {
            continue;
          }
          if (!matchedSigs.has(sig)) {
            matchedSigs.add(sig);
            const targetBucket: QueueBucketKind =
              shape.bucketKind === 'FAST' && isFrontierDifficulty(diff)
                ? 'FAST_HARD'
                : shape.bucketKind;
            this.buckets[targetBucket].preSkipped += 1;
            skipped += 1;
          }
        }
      }

      if (matchedSigs.size > 0) {
        this.skipSigSet = matchedSigs;
      }
    }

    this.nextTrialIndex = 0;
    this.activeSpecs.clear();
    this.gpuBlockCursor = 0;
    this.gpuBlockRemaining = 32;
    this.gpuSupportsBio = true;
    this.gpuSupportsFullFrontier = true;
    this.totalRunQueueTarget = Math.max(0, totalAll - skipped);
    this.auditQueue = [];
    this.gpuVerifyQueue = [];
    this.pendingAudits.clear();
    this.completedTrials = 0;
    this.skippedPrecompleted = skipped;
    this.totalPlannedTrials = totalAll;
    this.accumulatedElapsedMs = 0;
    this.pausedAtMs = 0;
    this.sweepStartMs = performance.now();
    this.trialRateWindowStartMs = this.sweepStartMs;
    this.trialRateWindowCount = 0;
    this.liveTrialsPerSec = 0;

    this.gpuActive = false;
    this.gpuIsIntegrated = false;
    this.gpuActiveTrials = 0;
    this.gpuTrialIndices.clear();
    this.gpuSlots = [];
    this.gpuTicksPerSec = 0;
    this.gpuTicksWindowStartMs = this.sweepStartMs;
    this.gpuTicksWindowCount = 0;
    this.autoTuneStage = 'OFF';
    this.autoTuneStatus = '';
    this.autoTuneProbes = [];
    this.cpuWorkersPausedByTuner = false;
    this.cpuDrainOnlyMode = false;

    const cores = getHardwareCores();
    const powerProfile = resolvePowerProfile(
      config.performancePriority ?? 70,
      cores
    );
    this.activePowerProfile = powerProfile;
    this.liveTrainCap = config.workerThreads === 0 ? powerProfile.targetCpuThreads : 0;

    if (this.totalRunQueueTarget === 0) {
      this.status = 'COMPLETED';
      this.callbacks.onSweepComplete(this.buildProgress());
      return;
    }

    const isTurbo = config.workerThreads === -2;
    const requestedTrain = isTurbo
      ? resolveTurboWorkerCount()
      : config.workerThreads === -1
        ? cores
        : config.workerThreads > 0
          ? Math.max(1, Math.min(32, config.workerThreads))
          : powerProfile.targetCpuThreads;
    const gpuEligibleCount = this.getRemainingGpuQueueCount();
    const cpuOnlyCount = this.getBucketRemaining(this.buckets.CPU_ONLY);
    const isAutoMode = this.computeBackend === 'AUTO';
    const allowAutoGpuProbe =
      isAutoMode &&
      powerProfile.allowIntegratedGpu &&
      gpuEligibleCount >= 16 &&
      this.totalRunQueueTarget >= 40;
    const canAutoProbe = allowAutoGpuProbe;

    const useGpuImmediately =
      (this.computeBackend === 'GPU' || this.computeBackend === 'HYBRID') &&
      gpuEligibleCount > 0;

    // Strict total worker budget: trainEntries + auditEntries NEVER exceeds maxTotalWorkers
    // (eliminates 126.8% CPU oversubscription / thermal throttling / event-loop lag spikes)
    const isMaxOrTurbo =
      config.workerThreads === -1 ||
      isTurbo ||
      (config.workerThreads === 0 && (config.performancePriority ?? 70) >= 95);
    const maxTotalWorkers =
      config.workerThreads > 0
        ? Math.max(1, Math.min(32, config.workerThreads))
        : isMaxOrTurbo
          ? cores
          : Math.max(2, Math.min(cores, powerProfile.targetCpuThreads));

    const maxSafeCpuOnly = maxTotalWorkers;
    const maxSafeWithGpu = isMaxOrTurbo
      ? maxTotalWorkers
      : Math.max(2, Math.min(maxTotalWorkers, cores <= 8 ? cores - 1 : cores - 2));

    const gpuVerifyHelpers =
      !useGpuImmediately && !canAutoProbe
        ? 0
        : this.computeBackend === 'GPU'
          ? maxSafeWithGpu
          : Math.max(2, Math.min(maxSafeWithGpu - 1, Math.round(maxSafeWithGpu * 0.5)));

    this.fullSafeTrainWorkers = Math.max(
      1,
      Math.min(maxSafeCpuOnly, this.totalRunQueueTarget)
    );
    this.hybridMaxTrainWorkers = Math.max(
      1,
      Math.min(
        Math.max(1, maxSafeWithGpu - gpuVerifyHelpers),
        this.totalRunQueueTarget
      )
    );

    if (canAutoProbe) {
      this.effectiveBackend = 'CPU';
      this.autoTuneStage = 'WARMUP_CPU';
      this.autoTuneStatus = 'Auto-Tune [0/3]: Warming up CPU workers…';
      this.resetProbeCounters();
    } else if (isAutoMode) {
      this.effectiveBackend = 'CPU';
      this.autoTuneStage = 'LOCKED';
      this.autoTuneStatus = !powerProfile.allowIntegratedGpu
        ? `${powerProfile.label} → CPU-only (iGPU off for Perf/W)`
        : gpuEligibleCount === 0
          ? 'Auto → CPU (CPU-only workload)'
          : 'Auto → CPU (short sweep)';
    } else {
      this.effectiveBackend = useGpuImmediately
        ? (this.computeBackend as 'GPU' | 'HYBRID')
        : 'CPU';
    }

    const targetTrainWorkers = canAutoProbe
      ? this.fullSafeTrainWorkers
      : !useGpuImmediately
        ? this.fullSafeTrainWorkers
        : this.computeBackend === 'GPU'
          ? cpuOnlyCount > 0
            ? Math.min(
                cpuOnlyCount,
                Math.max(1, Math.min(maxSafeWithGpu - 1, Math.floor(maxSafeWithGpu / 4)))
              )
            : 0
          : this.hybridMaxTrainWorkers;

    this.wantAuditParallelism = config.verificationSeeds > 1;
    const spareCoresAtStart =
      targetTrainWorkers > 0
        ? Math.max(0, requestedTrain - targetTrainWorkers)
        : 0;
    const targetAuditWorkers = canAutoProbe
      ? Math.max(2, Math.min(4, Math.floor(cores / 2)))
      : useGpuImmediately
        ? Math.max(1, maxSafeWithGpu - targetTrainWorkers)
        : this.wantAuditParallelism && spareCoresAtStart > 0
          ? Math.min(
              spareCoresAtStart,
              targetTrainWorkers * Math.max(1, config.verificationSeeds - 1)
            )
          : 0;
    this.parallelAuditActive =
      !useGpuImmediately &&
      !canAutoProbe &&
      this.wantAuditParallelism &&
      targetAuditWorkers > 0;

    this.ensureWorkers(targetTrainWorkers, targetAuditWorkers);
    this.profiler.reset({
      hardwareCores: cores,
      trainWorkerCount: targetTrainWorkers,
      auditWorkerCount: targetAuditWorkers,
      parallelAuditActive: this.parallelAuditActive,
      computeBackend: this.computeBackend,
      priorityLevel: powerProfile.priority,
      priorityLabel: powerProfile.label,
    });
    if (typeof window !== 'undefined') {
      (window as unknown as { __neuroPerfDump?: () => string }).__neuroPerfDump =
        () => {
          const rep = this.profiler.buildReport();
          // eslint-disable-next-line no-console
          console.log(rep.markdown);
          return rep.markdown;
        };
    }

    this.status = 'RUNNING';

    // Apply initial power/thermal pacing to all spawned CPU workers
    for (const entry of this.trainEntries) {
      this.postToEntry(entry, {
        type: 'SET_POWER_PACING',
        chunkMs: powerProfile.workerChunkMs,
        restMs: powerProfile.workerRestMs,
        throttled: false,
      });
    }

    // Start GPU compute worker immediately in GPU / HYBRID mode (AUTO starts GPU in Stage 2!)
    if (useGpuImmediately) {
      const gpuConcurrency =
        this.computeBackend === 'GPU'
          ? isMaxOrTurbo
            ? 224
            : 176
          : 128;
      const initialCount =
        this.computeBackend === 'GPU'
          ? Math.min(gpuConcurrency, gpuEligibleCount)
          : Math.min(
              128,
              Math.max(8, gpuEligibleCount - Math.max(0, targetTrainWorkers - cpuOnlyCount))
            );
      this.bootGpuWorker(gpuConcurrency, initialCount);
    }

    // Feed CPU workers with prefetch buffers
    for (const entry of this.trainEntries) {
      this.topUpTrainEntry(entry);
    }

    this.startUiTimer();
    this.callbacks.onProgress(this.buildProgress());
  }

  pause(): void {
    if (this.status !== 'RUNNING') return;
    const now = performance.now();
    this.accumulatedElapsedMs += now - this.sweepStartMs;
    this.pausedAtMs = now;
    this.updateLiveTrialRate(now, true);
    this.trialRateWindowStartMs = now;
    this.trialRateWindowCount = 0;
    if (this.gpuTicksWindowCount > 0) {
      const gpuWinMs = now - this.gpuTicksWindowStartMs;
      if (gpuWinMs >= 250) {
        this.gpuTicksPerSec = Math.round(
          (this.gpuTicksWindowCount / gpuWinMs) * 1000
        );
      }
      this.gpuTicksWindowStartMs = now;
      this.gpuTicksWindowCount = 0;
    }
    this.status = 'PAUSED';
    this.stopUiTimer();
    this.profiler.pause();
    this.profiler.logToConsole('pause');
    for (const entry of this.trainEntries) {
      if (entry.busy && entry.busyKind === 'TRIAL') {
        this.postToEntry(entry, { type: 'PAUSE' });
      }
    }
    if (this.gpuWorker && this.gpuActive) {
      this.postToGpu({ type: 'PAUSE' });
    }
    this.callbacks.onProgress(this.buildProgress());
  }

  resume(): void {
    if (this.status !== 'PAUSED') return;
    const now = performance.now();
    const pausedDelta = this.pausedAtMs > 0 ? Math.max(0, now - this.pausedAtMs) : 0;
    this.pausedAtMs = 0;
    this.sweepStartMs = now;
    this.lastUiTickMs = now;
    this.lastProgressEmitMs = now;
    this.gpuTicksWindowStartMs += pausedDelta;
    this.trialRateWindowStartMs += pausedDelta;
    if (this.autoTuneStageStartMs > 0) {
      this.autoTuneStageStartMs += pausedDelta;
    }
    for (const entry of this.trainEntries) {
      if (entry.startedAtMs > 0) {
        entry.startedAtMs += pausedDelta;
      }
    }
    for (const job of this.pendingAudits.values()) {
      job.startedAtMs += pausedDelta;
    }
    this.profiler.resume();
    this.status = 'RUNNING';
    for (const entry of this.trainEntries) {
      if (this.cpuWorkersPausedByTuner) continue;
      if (entry.busy && entry.busyKind === 'TRIAL') {
        this.postToEntry(entry, { type: 'RESUME' });
      } else if (!entry.busy && this.getRemainingQueueCount() > 0) {
        this.topUpTrainEntry(entry);
      }
    }
    if (this.gpuWorker && this.gpuActive) {
      this.postToGpu({ type: 'RESUME' });
    }
    this.pumpGpuVerifyQueue();
    this.pumpAuditQueue();
    this.startUiTimer();
    this.callbacks.onProgress(this.buildProgress());
  }

  skipSlowestTrial(): void {
    if (this.status !== 'RUNNING' && this.status !== 'PAUSED') return;
    let slowest: WorkerEntry | null = null;
    for (const entry of this.trainEntries) {
      if (!entry.busy || entry.busyKind !== 'TRIAL') continue;
      if (!slowest || entry.startedAtMs < slowest.startedAtMs) {
        slowest = entry;
      }
    }
    if (slowest) {
      for (const [id, job] of this.pendingAudits.entries()) {
        if (job.requesterEntry === slowest) {
          job.settled = true;
          this.pendingAudits.delete(id);
          this.auditQueue = this.auditQueue.filter((t) => t.poolAuditId !== id);
          this.cancelInFlightAuditSeeds(id);
        }
      }
      slowest.awaitingAudit = false;
      this.postToEntry(slowest, { type: 'SKIP_TRIAL' });
    } else if (this.gpuWorker && this.gpuActive) {
      this.postToGpu({ type: 'SKIP_SLOWEST' });
    }
  }

  stop(emitProgress = true): void {
    this.stopUiTimer();
    if (this.status === 'RUNNING') {
      this.accumulatedElapsedMs += performance.now() - this.sweepStartMs;
    }
    this.pausedAtMs = 0;
    this.profiler.pause();
    if (emitProgress && this.profiler.hasData()) {
      this.profiler.logToConsole('stop');
    }
    this.status = 'IDLE';
    this.auditQueue = [];
    this.gpuVerifyQueue = [];
    this.pendingAudits.clear();
    this.activeSpecs.clear();
    this.skipSigSet = null;
    this.gpuActive = false;
    this.gpuIsIntegrated = false;
    this.gpuActiveTrials = 0;
    this.gpuTrialIndices.clear();
    this.gpuSlots = [];
    this.gpuTicksPerSec = 0;
    this.autoTuneStage = 'OFF';
    this.autoTuneStatus = '';
    this.autoTuneProbes = [];
    this.cpuWorkersPausedByTuner = false;
    this.cpuDrainOnlyMode = false;

    if (emitProgress) {
      // User explicitly stopped the sweep: release GPU & CPU worker heaps immediately
      const stoppedProgress = this.buildProgress();
      this.releaseComputeWorkers();
      this.callbacks.onProgress(stoppedProgress);
    } else {
      if (this.gpuWorker) {
        this.postToGpu({ type: 'STOP' });
      }
      for (const entry of this.trainEntries) {
        entry.busy = false;
        entry.busyKind = 'IDLE';
        entry.inflightCount = 0;
        entry.inflightItems = [];
        entry.awaitingAudit = false;
        entry.runningAuditSeed = false;
        entry.activeAuditId = null;
        entry.activeAuditSeed = null;
        entry.activeGpuVerify = null;
        entry.slot = this.createEmptySlot(entry.workerId);
        this.postToEntry(entry, { type: 'STOP' });
      }
      for (const entry of this.auditEntries) {
        entry.busy = false;
        entry.busyKind = 'IDLE';
        entry.inflightCount = 0;
        entry.inflightItems = [];
        entry.awaitingAudit = false;
        entry.runningAuditSeed = false;
        entry.activeAuditId = null;
        entry.activeAuditSeed = null;
        entry.activeGpuVerify = null;
        entry.slot = this.createEmptySlot(entry.workerId);
        this.postToEntry(entry, { type: 'STOP' });
      }
    }
  }

  dispose(): void {
    this.stopUiTimer();
    this.status = 'IDLE';
    this.auditQueue = [];
    this.gpuVerifyQueue = [];
    this.pendingAudits.clear();
    this.activeSpecs.clear();
    this.gpuTrialIndices.clear();
    this.skipSigSet = null;
    this.releaseComputeWorkers();
  }
}
