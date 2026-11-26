/**
 * Analytical Sweep Compute-Cost & ETA Estimator (Local Browser vs Google Colab GPU).
 *
 * Predicts pre-run runtime BEFORE launching a sweep, identifies exact bottleneck drivers
 * (CPU_ONLY GPU bypass flags, Frontier non-early-stop multipliers, Cartesian grid axes),
 * and offers a non-destructive Quick-Trim helper for <15 min local pilot runs.
 */

import { isCpuSpecializedTrial, isGpuBioTopologySupported } from './neuralNetwork';
import { getHardwareCores, resolveAutoWorkerCount, resolveTurboWorkerCount } from './researchPool';
import { getAllActiveAlgorithms, getAllActiveTopologies } from './smartPrune';
import { buildSweepGridPlan } from './trialGrid';
import type {
  DifficultyPreset,
  NetworkArchitecture,
  ResearchSweepConfig,
} from './types';

export interface SweepBottleneckItem {
  severity: 'critical' | 'warn' | 'info';
  title: string;
  detail: string;
  impactLabel: string;
}

export interface SweepCostEstimate {
  rawTrials: number;
  activeTrials: number;
  remainingTrials: number;
  prunedTrials: number;
  cpuOnlyTrials: number;
  gpuEligibleTrials: number;
  cpuOnlyPct: number;
  cpuOnlyReasons: string[];
  frontierSharePct: number;
  avgExpectedGens: number;
  avgPopSize: number;
  estTotalTicksB: number;
  /** Active local execution mode label (e.g., "HYBRID (19 CPU + WebGPU)" or "WebGPU Native" or "CPU Lockstep (16w)") */
  activeLocalModeLabel: string;
  /** Measured or calibrated local throughput in M ticks/s */
  localThroughputMps: number;
  /** Speedup multiplier of current local mode vs single-thread scalar CPU */
  localSpeedupVsSingleCoreX: number;
  /** Estimated local runtime in seconds with active backend */
  localEstSec: number;
  /** Estimated local runtime in seconds WITHOUT Lockstep/GPU (baseline reference) */
  localLegacyEstSec: number;
  /** Estimated Google Colab GPU wall-clock runtimes (includes ~15s setup/compile) */
  colabT4Sec: number;
  colabL4Sec: number;
  colabA100Sec: number;
  /** Speedup ratio of Colab T4 vs Local */
  t4SpeedupX: number;
  recommendColab: boolean;
  bottlenecks: SweepBottleneckItem[];
  effectiveLocalWorkers: number;
}

const FRONTIER_DIFF_MULTIPLIER: Record<DifficultyPreset, { genFrac: number; avgFramesPerBird: number; isFrontier: boolean }> = {
  EASY: { genFrac: 0.08, avgFramesPerBird: 280, isFrontier: false },
  MEDIUM: { genFrac: 0.25, avgFramesPerBird: 350, isFrontier: false },
  HARD: { genFrac: 0.62, avgFramesPerBird: 480, isFrontier: true },
  INSANE: { genFrac: 0.88, avgFramesPerBird: 520, isFrontier: true },
  EXTRA_INSANE: { genFrac: 0.96, avgFramesPerBird: 580, isFrontier: true },
  STANDARD: { genFrac: 0.14, avgFramesPerBird: 320, isFrontier: false },
  VARIABLE_SPEED: { genFrac: 0.35, avgFramesPerBird: 380, isFrontier: false },
  HEAVY_GRAVITY: { genFrac: 0.34, avgFramesPerBird: 350, isFrontier: false },
  MOVING_GUSTS: { genFrac: 0.65, avgFramesPerBird: 480, isFrontier: true },
  DYNAMIC_GAPS: { genFrac: 0.55, avgFramesPerBird: 440, isFrontier: true },
  MOVING_GAPS: { genFrac: 0.78, avgFramesPerBird: 540, isFrontier: true },
  GUST_CHAOS: { genFrac: 0.92, avgFramesPerBird: 580, isFrontier: true },
  TURBULENCE_EXTREME: { genFrac: 0.96, avgFramesPerBird: 620, isFrontier: true },
  CUSTOM: { genFrac: 0.5, avgFramesPerBird: 420, isFrontier: false },
};

function getArchComputeWeight(arch: NetworkArchitecture, reasoningSteps: number): number {
  switch (arch) {
    case 'MLP':
      return 1.0;
    case 'RESIDUAL_SKIP':
      return 1.1;
    case 'LTC_FLY':
      return 1.35;
    case 'NEUROCHEM_GATE':
      return 1.45;
    case 'SYNAPTIC_STP':
      return 1.4;
    case 'SELECTIVE_SSM':
      return 1.5;
    case 'LOOPED_REASONER':
      return 1.2 + Math.max(1, reasoningSteps) * 0.65;
    case 'PONDER_ACT':
      return 1.25 + Math.max(2, reasoningSteps) * 0.58;
    case 'LATENT_ROLLOUT':
      return 2.6;
    case 'HYBRID_MOE':
      return 1.85;
    case 'DROSOPHILA_CONNECTOME':
      return 1.55;
    case 'DECOUPLED_FLY_CORTEX':
      return 1.75;
    default:
      return 1.2;
  }
}

export function formatDurationCompact(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '< 1s';
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))}s`;
  const mins = seconds / 60;
  if (mins < 60) {
    const m = Math.floor(mins);
    const s = Math.round(seconds - m * 60);
    return s > 0 && m < 10 ? `${m}m ${s}s` : `${Math.round(mins)}m`;
  }
  const hrs = seconds / 3600;
  if (hrs < 48) {
    const h = Math.floor(hrs);
    const m = Math.round((hrs - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const days = hrs / 24;
  return `${Math.round(hrs)}h (${days.toFixed(1)}d)`;
}

export function estimateSweepComputeCost(
  cfg: ResearchSweepConfig,
  remainingTrials?: number,
  liveTelemetry?: {
    liveTicksPerSec?: number;
    gpuActive?: boolean;
    computeBackend?: string;
  }
): SweepCostEstimate {
  const plan = buildSweepGridPlan(cfg);
  const rawTrials = plan.pruneSummary.rawPlannedTrials;
  const activeTrials = plan.pruneSummary.activeTrials;
  const effectiveTrials =
    remainingTrials !== undefined
      ? Math.max(0, Math.min(activeTrials, remainingTrials))
      : activeTrials;

  const cores = getHardwareCores();
  const effectiveLocalWorkers =
    cfg.workerThreads === 0
      ? resolveAutoWorkerCount()
      : cfg.workerThreads === -1
        ? cores
        : cfg.workerThreads === -2
          ? resolveTurboWorkerCount()
          : Math.max(1, Math.min(cores, cfg.workerThreads));

  const backend = cfg.computeBackend ?? 'AUTO';
  const browserGpuAllowed = backend !== 'CPU';
  const reasoningK = cfg.reasoningSteps ?? 3;
  const maxGens = cfg.maxGenerations ?? 220;
  const stagCap = cfg.stagnationLimit ?? maxGens;
  const effectiveGenCap = Math.min(maxGens, Math.max(25, stagCap * 1.45));

  const pops = cfg.populationSizes.length > 0 ? cfg.populationSizes : [60];
  const avgPopSize = pops.reduce((a, b) => a + b, 0) / pops.length;
  const diffs = cfg.difficulties.length > 0 ? cfg.difficulties : (['MEDIUM'] as DifficultyPreset[]);

  // Diagnose browser WebGPU bypass reasons (WebGPU WGSL natively supports all 10 homogeneous archs including DROSOPHILA_CONNECTOME archCode=9;
  // only HYBRID_MOE, DECOUPLED_FLY_CORTEX, and ISLAND_SPECIATION are CPU_SPECIALIZED).
  const evoMode = cfg.evolutionTopologyMode ?? 'SINGLE_SPECIES';
  const cpuOnlyReasons: string[] = [];
  if (!browserGpuAllowed) cpuOnlyReasons.push('Silnik ustawiony ręcznie na CPU Workers');

  const hasCpuSpecialized = plan.validShapes.some((s) =>
    isCpuSpecializedTrial(s.arch, evoMode)
  );
  if (hasCpuSpecialized) {
    cpuOnlyReasons.push(
      evoMode === 'ISLAND_SPECIATION'
        ? 'Multi-Arch Islands → CPU_SPECIALIZED (równoległe wyspy na CPU/OpenMP)'
        : 'Hybrid MoE / Decoupled Fly-Cortex → CPU_SPECIALIZED (dynamiczny router i pamięć online DA na CPU/OpenMP)'
    );
  }

  const deepBioUnsupported = plan.validShapes.some(
    (s) =>
      s.arch !== 'MLP' &&
      !isCpuSpecializedTrial(s.arch, evoMode) &&
      !isGpuBioTopologySupported(s.topo, s.arch)
  );
  if (deepBioUnsupported) {
    cpuOnlyReasons.push('Topologie Bio/Reasoning >64 neuronów, szerokość >64 lub >4 warstwy omijają WebGPU');
  }

  const globalCpuForced = !browserGpuAllowed;

  let cpuShapeCount = 0;
  let gpuShapeCount = 0;
  let avgArchCost = 0;
  for (let i = 0; i < plan.validShapes.length; i++) {
    const sh = plan.validShapes[i];
    const cpuSpec = isCpuSpecializedTrial(sh.arch, evoMode);
    const shapeGpuOk =
      !globalCpuForced &&
      !cpuSpec &&
      (sh.arch === 'MLP' || isGpuBioTopologySupported(sh.topo, sh.arch));
    if (shapeGpuOk) gpuShapeCount += 1;
    else cpuShapeCount += 1;
    const islandMult = evoMode === 'ISLAND_SPECIATION' ? 1.35 : 1.0;
    avgArchCost +=
      getArchComputeWeight(sh.arch, reasoningK) *
      islandMult *
      (1 + sh.topo.reduce((a, b) => a + b, 0) * 0.045);
  }
  const shapeDenom = Math.max(1, plan.validShapes.length);
  avgArchCost /= shapeDenom;
  const cpuShare = cpuShapeCount / shapeDenom;
  const cpuOnlyTrials = Math.round(effectiveTrials * cpuShare);
  const gpuEligibleTrials = Math.max(0, effectiveTrials - cpuOnlyTrials);
  const cpuOnlyPct = Math.round(cpuShare * 100);

  let avgGenFrac = 0;
  let avgFramesPerBird = 0;
  let frontierCount = 0;
  for (const d of diffs) {
    const meta = FRONTIER_DIFF_MULTIPLIER[d] ?? FRONTIER_DIFF_MULTIPLIER.MEDIUM;
    avgGenFrac += meta.genFrac;
    avgFramesPerBird += meta.avgFramesPerBird;
    if (meta.isFrontier) frontierCount += 1;
  }
  avgGenFrac /= diffs.length;
  avgFramesPerBird /= diffs.length;
  const frontierSharePct = Math.round((frontierCount / diffs.length) * 100);

  // Expected generations & ticks per trial
  const avgExpectedGens = Math.max(2, Math.min(maxGens, effectiveGenCap * avgGenFrac));
  const trainTicksPerTrial = avgExpectedGens * avgPopSize * avgFramesPerBird;
  const auditTicksPerTrial =
    cfg.verificationSeeds * Math.min(cfg.targetPipeCap, 1200) * 48 * (1 - avgGenFrac * 0.45 + 0.18);
  const totalTicksPerTrial = trainTicksPerTrial + auditTicksPerTrial;
  const estTotalTicksB = (effectiveTrials * totalTicksPerTrial) / 1e9;

  // Calibrated throughput from real empirical Auto-Tuner benchmark on 22-core hybrid workstation:
  // - Single scalar CPU core baseline: ~1.1M ticks/s / avgArchCost
  // - Multi-core CPU Lockstep pool (e.g. 16-19 workers): ~1.40M ticks/s per worker
  // - Browser WebGPU kernel (MLP/Bio/Drosophila WGSL): ~24M-36M ticks/s
  // - Hybrid (CPU Pool + WebGPU simultaneously): ~30.1M ticks/s combined
  const coreScale = Math.max(1, effectiveLocalWorkers * 0.82);
  const singleCoreScalarRate = 1.15e6 / avgArchCost;
  const localLegacyRateCpu = (2.1e6 * coreScale) / avgArchCost;
  const localLockstepRateCpu = (1.55e6 * effectiveLocalWorkers) / Math.pow(avgArchCost, 0.85);
  const browserGpuRate = 28e6 / Math.pow(avgArchCost, 0.78);

  const cpuTicks = cpuOnlyTrials * totalTicksPerTrial;
  const gpuTrainTicks = gpuEligibleTrials * trainTicksPerTrial;
  const gpuAuditTicks = gpuEligibleTrials * auditTicksPerTrial;

  const localLegacyEstSec =
    effectiveTrials === 0
      ? 0
      : (effectiveTrials * totalTicksPerTrial) / localLegacyRateCpu;

  // Determine effective local mode & throughput
  let computedLocalEstSec = 0;
  let activeLocalModeLabel = `CPU Lockstep (${effectiveLocalWorkers}w)`;

  if (!browserGpuAllowed || gpuEligibleTrials === 0) {
    computedLocalEstSec =
      effectiveTrials === 0 ? 0 : (effectiveTrials * totalTicksPerTrial) / localLockstepRateCpu;
    activeLocalModeLabel = `CPU Lockstep (${effectiveLocalWorkers} wątków)`;
  } else if (backend === 'GPU' && cpuOnlyTrials === 0) {
    computedLocalEstSec =
      effectiveTrials === 0
        ? 0
        : Math.max(
            gpuTrainTicks / browserGpuRate,
            gpuAuditTicks / Math.max(1e5, localLockstepRateCpu * 0.75)
          );
    activeLocalModeLabel = 'WebGPU Compute + F64 Audit';
  } else {
    // AUTO or HYBRID: CPU pool and WebGPU work in parallel
    const hybridCombinedRate = browserGpuRate * 0.72 + localLockstepRateCpu * 0.88;
    const totalAllTicks = effectiveTrials * totalTicksPerTrial;
    const gpuShareTicks = gpuTrainTicks + gpuAuditTicks;
    computedLocalEstSec =
      effectiveTrials === 0
        ? 0
        : cpuTicks / localLockstepRateCpu + gpuShareTicks / hybridCombinedRate;
    activeLocalModeLabel =
      cpuOnlyPct > 0 && cpuOnlyPct < 100
        ? `HYBRID (WebGPU ${100 - cpuOnlyPct}% + CPU ${cpuOnlyPct}%)`
        : `HYBRID (${effectiveLocalWorkers}w CPU + WebGPU)`;
  }

  // If live telemetry is actively running and reporting real throughput, blend it in!
  if (liveTelemetry?.liveTicksPerSec && liveTelemetry.liveTicksPerSec > 5e5 && effectiveTrials > 0) {
    const liveRate = liveTelemetry.liveTicksPerSec;
    computedLocalEstSec = (effectiveTrials * totalTicksPerTrial) / liveRate;
    activeLocalModeLabel = `${liveTelemetry.computeBackend ?? backend} Live (${(liveRate / 1e6).toFixed(1)}M/s)`;
  }

  const localEstSec = Math.max(0.5, computedLocalEstSec);
  const localThroughputMps =
    localEstSec > 0 && effectiveTrials > 0
      ? Number(((effectiveTrials * totalTicksPerTrial) / localEstSec / 1e6).toFixed(1))
      : Number(((localLockstepRateCpu + (browserGpuAllowed ? browserGpuRate * 0.5 : 0)) / 1e6).toFixed(1));
  const localSpeedupVsSingleCoreX = Number(
    Math.max(1, (localThroughputMps * 1e6) / singleCoreScalarRate).toFixed(1)
  );

  // Colab executes GPU_LOCKSTEP trials on CUDA (T4/L4/A100) and CPU_SPECIALIZED trials
  // natively on multi-core Xeon C++17 OpenMP (~65M ticks/s) without GPU warp divergence.
  const cudaArchPenalty = Math.pow(avgArchCost, 0.62);
  const colabSetupSec = effectiveTrials > 0 ? 18 : 0; // nvcc/g++ compile + warmup
  const colabOpenMpRate = 65e6 / avgArchCost;
  const colabCpuSpecTicks =
    cpuShare > 0 && hasCpuSpecialized
      ? effectiveTrials * cpuShare * (trainTicksPerTrial + auditTicksPerTrial * 1.1)
      : 0;
  const colabGpuLockstepTrain =
    (effectiveTrials - (hasCpuSpecialized ? effectiveTrials * cpuShare : 0)) * trainTicksPerTrial;
  const colabGpuLockstepAudit =
    (effectiveTrials - (hasCpuSpecialized ? effectiveTrials * cpuShare : 0)) * auditTicksPerTrial;

  const colabOpenMpSec = colabCpuSpecTicks > 0 ? colabCpuSpecTicks / colabOpenMpRate : 0;
  const colabT4Sec =
    effectiveTrials === 0
      ? 0
      : colabSetupSec +
        colabOpenMpSec +
        (colabGpuLockstepTrain + colabGpuLockstepAudit * 1.15) / (420e6 / cudaArchPenalty);
  const colabL4Sec =
    effectiveTrials === 0
      ? 0
      : colabSetupSec +
        colabOpenMpSec +
        (colabGpuLockstepTrain + colabGpuLockstepAudit * 1.15) / (820e6 / cudaArchPenalty);
  const colabA100Sec =
    effectiveTrials === 0
      ? 0
      : colabSetupSec +
        colabOpenMpSec +
        (colabGpuLockstepTrain + colabGpuLockstepAudit * 1.15) / (2100e6 / cudaArchPenalty);

  const t4SpeedupX =
    colabT4Sec > 0 ? Math.max(1, Number((localEstSec / colabT4Sec).toFixed(1))) : 1;

  // Build diagnostic bottleneck explanations
  const bottlenecks: SweepBottleneckItem[] = [];
  if (cpuOnlyPct >= 80 && effectiveTrials >= 10) {
    bottlenecks.push({
      severity: 'critical',
      title: `${cpuOnlyPct}% prób omija WebGPU przeglądarki (tryb CPU-only)`,
      detail: cpuOnlyReasons.slice(0, 3).join(' · '),
      impactLabel: '−10× do −25× lokalnie',
    });
  } else if (cpuOnlyPct > 0 && effectiveTrials >= 10) {
    bottlenecks.push({
      severity: 'warn',
      title: `${cpuOnlyPct}% prób trafia na ścieżkę CPU-only`,
      detail: cpuOnlyReasons.slice(0, 2).join(' · '),
      impactLabel: 'Częściowy bypass GPU',
    });
  }

  if (frontierSharePct >= 50 && maxGens >= 80) {
    bottlenecks.push({
      severity: frontierSharePct >= 75 ? 'critical' : 'warn',
      title: `Scenariusze Frontier (${frontierSharePct}% siatki) rzadko kończą przed limitem generacji`,
      detail: `Średnio ~${Math.round(avgExpectedGens)} gen/próbę × pop ${Math.round(avgPopSize)} przy limicie ${cfg.maxGenerations ?? '∞'} gen.`,
      impactLabel: `×${(avgGenFrac / 0.14).toFixed(1)} vs Standard`,
    });
  }

  if (effectiveTrials >= 250) {
    const dimSummary = [
      `${getAllActiveAlgorithms(cfg).length} alg`,
      `${diffs.length} trudn.`,
      `${plan.architectures.length} arch`,
      `${getAllActiveTopologies(cfg).length} topo`,
      `${plan.weightPrecisions.length} prec`,
      `${pops.length} pop`,
      `${cfg.mutationRates.length}×${cfg.mutationStrengths.length} mut`,
    ].join(' × ');
    bottlenecks.push({
      severity: effectiveTrials >= 1000 ? 'critical' : 'warn',
      title: `Duża siatka kartezjańska: ${effectiveTrials.toLocaleString()} aktywnych prób`,
      detail: dimSummary,
      impactLabel: `${estTotalTicksB.toFixed(1)}B ticków`,
    });
  }

  if (cfg.verificationSeeds >= 8 && cfg.targetPipeCap >= 2000) {
    bottlenecks.push({
      severity: 'info',
      title: `Głęboki audyt F64 (${cfg.verificationSeeds} seedów × ${cfg.targetPipeCap.toLocaleString()} rur)`,
      detail: 'Każdy kandydat przechodzi pełną weryfikację deterministyczną w podwójnej precyzji.',
      impactLabel: 'Wysoka pewność',
    });
  }

  return {
    rawTrials,
    activeTrials,
    remainingTrials: effectiveTrials,
    prunedTrials: plan.pruneSummary.prunedTotal,
    cpuOnlyTrials,
    gpuEligibleTrials,
    cpuOnlyPct,
    cpuOnlyReasons,
    frontierSharePct,
    avgExpectedGens,
    avgPopSize,
    estTotalTicksB,
    activeLocalModeLabel,
    localThroughputMps,
    localSpeedupVsSingleCoreX,
    localEstSec,
    localLegacyEstSec,
    colabT4Sec,
    colabL4Sec,
    colabA100Sec,
    t4SpeedupX,
    recommendColab: localEstSec >= 900 || (effectiveTrials >= 1500 && t4SpeedupX >= 4),
    bottlenecks,
    effectiveLocalWorkers,
  };
}

/**
 * Non-destructive helper that trims grid budget for a rapid <15 min local pilot run
 * while preserving the user's selected architectures and difficulties.
 */
export function buildQuickTrimConfig(cfg: ResearchSweepConfig): ResearchSweepConfig {
  const nextPops =
    cfg.populationSizes.length > 1
      ? [cfg.populationSizes[Math.floor(cfg.populationSizes.length / 2)]]
      : cfg.populationSizes;
  const nextRates =
    cfg.mutationRates.length > 1 ? [cfg.mutationRates[0]] : cfg.mutationRates;
  const nextStrs =
    cfg.mutationStrengths.length > 1
      ? [cfg.mutationStrengths[Math.floor(cfg.mutationStrengths.length / 2)]]
      : cfg.mutationStrengths;
  const nextTopos =
    cfg.topologies.length > 4 ? cfg.topologies.slice(0, 4) : cfg.topologies;
  const nextToposByArch = cfg.topologiesByArchitecture
    ? Object.fromEntries(
        Object.entries(cfg.topologiesByArchitecture).map(([k, list]) => [
          k,
          list && list.length > 4 ? list.slice(0, 4) : list,
        ])
      )
    : undefined;
  const nextAlgos =
    cfg.algorithms.length > 2 ? cfg.algorithms.slice(0, 2) : cfg.algorithms;

  return {
    ...cfg,
    algorithms: nextAlgos,
    topologies: nextTopos,
    topologiesByArchitecture: nextToposByArch,
    populationSizes: nextPops,
    mutationRates: nextRates,
    mutationStrengths: nextStrs,
    maxGenerations: Math.min(cfg.maxGenerations ?? 80, 60),
    stagnationLimit: Math.min(cfg.stagnationLimit ?? 25, 22),
    verificationSeeds: Math.min(cfg.verificationSeeds, 4),
    targetPipeCap: Math.min(cfg.targetPipeCap, 1000),
    smartPrune: true,
  };
}
