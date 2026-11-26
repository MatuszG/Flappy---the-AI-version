/**
 * Dedicated GPU Research Compute Worker (WebGPU WGSL + WebGL2 GLSL ES 3.00).
 *
 * Division of labor:
 * - GPU: Massively parallel short training rollouts (up to 64 concurrent trials,
 *   capped at 44–80 pipes/gen so no single GPU lane ever stalls a warp or trips
 *   macOS Metal / Windows TDR command-buffer watchdogs).
 * - CPU (this worker's JS thread): Exact f64 multi-seed certification via
 *   auditBrainMastery whenever a candidate crosses the audit trigger or finishes.
 */

import {
  calculateTopologyBreakdown,
  formatTopologyLabel,
  getGpuTopologyTier,
  isWebGl2BioTopologySupported,
  NeuralNetwork,
  WEIGHT_PRECISION_META,
} from './neuralNetwork';
import { classifyLearningDynamic } from './evaluator';
import { resolveCurriculumEnvironment } from './physics';
import { analyzePolicyMechanism } from './policyAnalysis';
import type { TrialSpec } from './research.worker';
import { buildTrialSignature } from './researchStorage';
import {
  formatInputSubsetKey,
  formatInputSubsetLabel,
  getInputFeatureIndices,
  hasLookaheadSensor,
  normalizeInputFeatures,
} from './sensors';
import {
  auditBrainMastery,
  evaluateBirdTrainingEpisode,
  FlappySimulation,
  resolveEnvironment,
} from './simulation';
import type {
  DifficultyPreset,
  EnvironmentConfig,
  FailureAutopsy,
  ReasoningTelemetry,
  ResearchSweepConfig,
  ResearchTrialResult,
  SensorFeatureId,
  SerializedNeuralNetwork,
  TrialStoppedReason,
  WorkerSlotProgress,
} from './types';
import {
  createBestGpuEvaluator,
  encodeTopologyAndSensors,
  TASK_STRIDE_U32,
  writeTaskDescToBuffers,
  type GpuBatchResult,
  type GpuComputeEvaluator,
  type GpuKernelKind,
  type GpuPendingBatch,
} from './webgpuEvaluator';

export interface GpuQueuedTrialItem {
  trialIndex: number;
  spec: TrialSpec;
}

export type GpuWorkerInbound =
  | {
      type: 'INIT_AND_START';
      sweepConfig: ResearchSweepConfig;
      maxConcurrentTrials: number;
      initialTrials: GpuQueuedTrialItem[];
      useAsyncVerify?: boolean;
    }
  | {
      type: 'FEED_TRIALS';
      items: GpuQueuedTrialItem[];
    }
  | {
      type: 'GPU_VERIFY_RESULT';
      reqId: number;
      seedScores: number[];
      minSeedScore: number;
      meanSeedScore: number;
      verifiedPerfect: boolean;
      ticksEvaluated: number;
      elapsedMs: number;
      failureAutopsy?: FailureAutopsy | null;
      reasoningTelemetry?: ReasoningTelemetry | null;
    }
  | { type: 'SET_GPU_LOAD'; gpuLoadPercent: number }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'SKIP_SLOWEST' }
  | { type: 'RETURN_AND_STOP' }
  | { type: 'STOP' };

export type GpuWorkerOutbound =
  | {
      type: 'GPU_READY';
      adapterLabel: string;
      supportsBioKernels: boolean;
      supportsFullFrontier: boolean;
      isIntegrated: boolean;
    }
  | {
      type: 'GPU_ERROR';
      message: string;
      returnedItems: GpuQueuedTrialItem[];
    }
  | {
      type: 'GPU_RETURNED_ITEMS';
      returnedItems: GpuQueuedTrialItem[];
    }
  | { type: 'GPU_NEED_TRIALS'; wantCount: number }
  | {
      type: 'GPU_VERIFY_REQUEST';
      reqId: number;
      brain: SerializedNeuralNetwork;
      difficulty: DifficultyPreset;
      targetPipeCap: number;
      verificationSeeds: number;
      customEnvironment?: EnvironmentConfig;
      failFast: boolean;
    }
  | {
      type: 'GPU_BATCH_STATS';
      tasks: number;
      ticks: number;
      dispatchMs: number;
      activeTrials: number;
      kernelKind: GpuKernelKind;
      waveWeightBudget: number;
      maxInFlightWaves: number;
      breathMs: number;
      awaitingVerifyCount: number;
    }
  | { type: 'GPU_SLOTS'; slots: WorkerSlotProgress[] }
  | {
      type: 'TRIAL_DONE';
      trialIndex: number;
      trial: ResearchTrialResult;
      gpuTimeMs: number;
      cpuVerifyMs: number;
      auditCacheHits: number;
    };

const workerScope = self as unknown as {
  postMessage: (msg: GpuWorkerOutbound) => void;
  onmessage: ((ev: MessageEvent<GpuWorkerInbound>) => void) | null;
};

interface FinalTrialSnapshot {
  fastStats: ReturnType<FlappySimulation['getFastStats']>;
  trainingTicks: number;
  morphSummary: ReturnType<FlappySimulation['getMorphogenesisSummary']>;
  computeStats: ReturnType<FlappySimulation['getComputeStats']>;
  serializedBestBrain: SerializedNeuralNetwork | null;
}

interface ActiveGpuTrial {
  slotId: number;
  trialIndex: number;
  spec: TrialSpec;
  cleanInputs: SensorFeatureId[];
  env: EnvironmentConfig;
  sim: FlappySimulation | null;
  finalSnapshot?: FinalTrialSnapshot;
  paramCount: number;
  topoMeta0: number;
  topoMeta1: number;
  sensorMask: number;
  sensorMask1: number;
  startedAtMs: number;
  accumulatedMs: number;
  cpuVerifyMs: number;
  gen: number;
  bestScore: number;
  bestFitness: number;
  bestProgressScore: number;
  bestProgressFitness: number;
  gensWithoutImprovement: number;
  nextAuditTrigger: number;
  lastAuditGen: number;
  midAuditCount: number;
  lastAuditTriggerScore: number;
  lastAuditBestFitness: number;
  auditTicks: number;
  scoreCurve: number[];
  bestAudit: {
    seedScores: number[];
    minSeedScore: number;
    meanSeedScore: number;
    verifiedPerfect: boolean;
    truncated?: boolean;
    failureAutopsy?: FailureAutopsy | null;
    reasoningTelemetry?: ReasoningTelemetry | null;
  } | null;
  bestAuditBrain: NeuralNetwork | null;
  lastAuditedBrain: NeuralNetwork | null;
  auditedFingerprints: Map<string, { full: boolean; verifiedPerfect: boolean }>;
  auditCacheHits: number;
  phase: 'TRAINING' | 'AUDITING';
  auditDetail?: string;
  awaitingCpuAudit: boolean;
}

interface PendingAsyncVerify {
  sessionId: number;
  trial: ActiveGpuTrial;
  kind: 'MID_TRIGGER' | 'FINAL';
  brain: NeuralNetwork;
  currBest: number;
  failFast: boolean;
  stoppedReason: TrialStoppedReason;
}

let gpu: GpuComputeEvaluator | null = null;
let status: 'IDLE' | 'RUNNING' | 'PAUSED' = 'IDLE';
let pausedAtMs = 0;
let runSessionId = 0;
let sweepConfig: ResearchSweepConfig | null = null;
let maxConcurrentTrials = 56;
let targetReadyTasks = 10240;
let waveWeightBudget = 4400;
let maxInFlightWaves = 2;
let emaDispatchMs = 28;
const kernelBudgetScale = new Float64Array(8).fill(1.0);
let lastCompositorBreathMs = 0;
let targetGpuLoadPercent = 100;
let useAsyncVerify = false;
let nextSlotId = 201;
let nextVerifyReqId = 1;

let activeTrials: ActiveGpuTrial[] = [];
let pendingFeedQueue: GpuQueuedTrialItem[] = [];
const pendingAsyncVerifies = new Map<number, PendingAsyncVerify>();
let loopRunning = false;
let lastSlotsEmitMs = 0;
let lastNeedTrialsMs = 0;

// Reusable staging buffers (grow as power-of-2; zero GC churn across mega-batches)
let stagingTaskCap = 0;
let stagingTasksBuf = new ArrayBuffer(0);
let stagingTasksU32 = new Uint32Array(0);
let stagingTasksF32 = new Float32Array(0);
let stagingWeightsCap = 0;
let stagingWeightsF32 = new Float32Array(0);

function ensureStagingCapacity(taskCount: number, weightFloatCount: number): void {
  if (taskCount > stagingTaskCap) {
    stagingTaskCap = Math.max(taskCount, stagingTaskCap * 2, 4096);
    stagingTasksBuf = new ArrayBuffer(stagingTaskCap * TASK_STRIDE_U32 * 4);
    stagingTasksU32 = new Uint32Array(stagingTasksBuf);
    stagingTasksF32 = new Float32Array(stagingTasksBuf);
  }
  if (weightFloatCount > stagingWeightsCap) {
    stagingWeightsCap = Math.max(weightFloatCount, stagingWeightsCap * 2, 131072);
    stagingWeightsF32 = new Float32Array(stagingWeightsCap);
  }
}

function allocateFreeSlotId(): number {
  const used = new Set<number>();
  for (let i = 0; i < activeTrials.length; i++) {
    used.add(activeTrials[i].slotId);
  }
  for (let id = 201; id <= 640; id++) {
    if (!used.has(id)) return id;
  }
  return nextSlotId++;
}

function createActiveTrial(
  item: GpuQueuedTrialItem,
  cfg: ResearchSweepConfig
): ActiveGpuTrial {
  const cleanInputs = normalizeInputFeatures(item.spec.inputFeatures);
  const env = resolveEnvironment(item.spec.difficulty, cfg.customEnvironment);
  const totalHidden = item.spec.topology.reduce((a, b) => a + b, 0);

  const arch = item.spec.architecture ?? 'MLP';
  const prec = item.spec.weightPrecision ?? 'FP32';

  const curriculumGens =
    cfg.maxGenerations !== null
      ? Math.max(8, Math.min(24, Math.round(cfg.maxGenerations * 0.4)))
      : 18;

  const sim = new FlappySimulation({
    algorithm: item.spec.algorithm,
    populationSize: item.spec.populationSize,
    mutationRate: item.spec.mutationRate,
    mutationStrength: item.spec.mutationStrength,
    elitismCount: Math.max(2, Math.round(item.spec.populationSize * 0.07)),
    hiddenNodes:
      item.spec.topology.length === 1 ? item.spec.topology[0] : totalHidden,
    hiddenLayers: item.spec.topology,
    inputFeatures: cleanInputs,
    architecture: arch,
    weightPrecision: prec,
    difficulty: item.spec.difficulty,
    customEnvironment: cfg.customEnvironment,
    curriculumLearning: item.spec.curriculumLearning ?? Boolean(cfg.curriculumLearning),
    curriculumGenerations: curriculumGens,
    shapedFitness: item.spec.shapedFitness ?? Boolean(cfg.shapedFitness),
    reasoningSteps: item.spec.reasoningSteps ?? cfg.reasoningSteps,
    morphogenesis: item.spec.morphogenesisMode === 'GROWING',
    morphogenesisConfig: cfg.morphogenesisConfig,
    perceptionMode: item.spec.perceptionMode ?? cfg.perceptionMode,
    opticalNoiseLevel: cfg.opticalNoiseLevel,
    nonStationaryAnomalies: cfg.nonStationaryAnomalies,
    onlinePlasticity: cfg.onlinePlasticity,
  });

  const layers = [cleanInputs.length, ...item.spec.topology, 1];
  const activeIndices = getInputFeatureIndices(cleanInputs);
  const encoded = encodeTopologyAndSensors(layers, activeIndices);
  const breakdown = calculateTopologyBreakdown(
    item.spec.topology,
    cleanInputs.length,
    1,
    arch
  );

  const slotId = allocateFreeSlotId();

  return {
    slotId,
    trialIndex: item.trialIndex,
    spec: item.spec,
    cleanInputs,
    env,
    sim,
    paramCount: breakdown.parameterCount,
    topoMeta0: encoded.topoMeta0,
    topoMeta1: encoded.topoMeta1,
    sensorMask: encoded.sensorMask,
    sensorMask1: encoded.sensorMask1,
    startedAtMs: performance.now(),
    accumulatedMs: 0,
    cpuVerifyMs: 0,
    gen: 1,
    bestScore: 0,
    bestFitness: 0,
    bestProgressScore: 0,
    bestProgressFitness: 0,
    gensWithoutImprovement: 0,
    nextAuditTrigger: Math.min(cfg.targetPipeCap, 40),
    lastAuditGen: 0,
    midAuditCount: 0,
    lastAuditTriggerScore: 0,
    lastAuditBestFitness: 0,
    auditTicks: 0,
    scoreCurve: [],
    bestAudit: null,
    bestAuditBrain: null,
    lastAuditedBrain: null,
    auditedFingerprints: new Map(),
    auditCacheHits: 0,
    phase: 'TRAINING',
    awaitingCpuAudit: false,
  };
}

/**
 * Estimates relative GPU compute cost per bird for a trial (0.35 .. 1.95).
 * Accounts for early 650-frame sprints vs full 4,000-5,000-frame mature flights
 * so BIO_TINY / COMPACT_DEEP waves never surge past TDR ceilings on Gen 3+.
 */
function estimateTrialUnitWeight(t: ActiveGpuTrial): number {
  const arch = t.spec.architecture ?? 'MLP';
  const paramFactor = Math.max(0.42, Math.min(1.22, (t.paramCount + 16) / 52));
  const archFactor =
    arch === 'MLP'
      ? 1.0
      : arch === 'LOOPED_REASONER' || arch === 'PONDER_ACT' || arch === 'LATENT_ROLLOUT'
        ? 1.48
        : arch === 'SELECTIVE_SSM'
          ? 1.24
          : 1.15;
  let horizonFactor = 0.95;
  const d = t.spec.difficulty;
  if (t.gen <= 2 && t.bestScore < 10) {
    horizonFactor = 0.45;
  } else if (
    (d === 'INSANE' || d === 'TURBULENCE_EXTREME' || d === 'GUST_CHAOS') &&
    t.bestScore < 6
  ) {
    horizonFactor = 0.65;
  } else if (t.bestScore >= 28) {
    horizonFactor = 1.65;
  } else if (t.bestScore >= 12) {
    horizonFactor = 1.3;
  }
  return Math.max(0.35, Math.min(2.1, paramFactor * archFactor * horizonFactor));
}

const MAX_RAW_READY_TASKS = 24576;
const MAX_RAW_TASKS_PER_WAVE = 12288;

function getSafeMaxRawTasksForKernel(kind: GpuKernelKind, isIntegrated: boolean): number {
  if (isIntegrated) {
    switch (kind) {
      case 0:
        return 6144;
      case 1:
      case 3:
        return 2560;
      case 2:
      case 4:
        return 1536;
      default:
        return 1024;
    }
  }
  switch (kind) {
    case 0:
      return MAX_RAW_TASKS_PER_WAVE;
    case 1:
    case 3:
      return 5120;
    case 2:
    case 4:
      return 3072;
    default:
      return 2048;
  }
}

function promoteQueuedTrials(): void {
  if (!sweepConfig) return;
  let readyTraining = 0;
  let awaitingVerify = 0;
  let readyRawTasks = 0;
  let readyWeightedTasks = 0;
  for (let i = 0; i < activeTrials.length; i++) {
    const t = activeTrials[i];
    if (!t.awaitingCpuAudit) {
      readyTraining += 1;
      readyRawTasks += t.spec.populationSize;
      readyWeightedTasks += t.spec.populationSize * estimateTrialUnitWeight(t);
    } else {
      awaitingVerify += 1;
    }
  }
  // Bound both awaiting-verify trials & total in-flight sims cleanly so worker/main heaps never bloat
  const maxPendingVerifyBacklog = Math.max(
    24,
    Math.min(72, Math.round(maxConcurrentTrials * 0.55))
  );
  const hardCeiling = maxConcurrentTrials + maxPendingVerifyBacklog;
  while (
    readyTraining < maxConcurrentTrials &&
    readyWeightedTasks < targetReadyTasks &&
    readyRawTasks < MAX_RAW_READY_TASKS &&
    activeTrials.length < hardCeiling &&
    awaitingVerify < maxPendingVerifyBacklog &&
    pendingAsyncVerifies.size < maxPendingVerifyBacklog &&
    pendingFeedQueue.length > 0
  ) {
    const next = pendingFeedQueue.shift()!;
    const created = createActiveTrial(next, sweepConfig);
    activeTrials.push(created);
    readyTraining += 1;
    readyRawTasks += next.spec.populationSize;
    readyWeightedTasks += next.spec.populationSize * estimateTrialUnitWeight(created);
  }
}

function requestMoreTrialsIfNeeded(force = false): void {
  if (status !== 'RUNNING') return;
  let readyWeightedTasks = 0;
  let readyCount = 0;
  for (let i = 0; i < activeTrials.length; i++) {
    if (!activeTrials[i].awaitingCpuAudit) {
      readyWeightedTasks +=
        activeTrials[i].spec.populationSize * estimateTrialUnitWeight(activeTrials[i]);
      readyCount += 1;
    }
  }
  const avgWeightedPop =
    readyCount > 0 ? Math.max(45, Math.round(readyWeightedTasks / readyCount)) : 160;
  const desiredActive = Math.min(
    maxConcurrentTrials,
    Math.max(12, Math.ceil(targetReadyTasks / avgWeightedPop))
  );
  const desiredBuffer = Math.max(20, Math.round(desiredActive * 0.8));
  const deficit = desiredBuffer - pendingFeedQueue.length;
  if (deficit <= 0) return;

  const now = performance.now();
  if (!force && deficit < Math.max(4, Math.floor(desiredBuffer * 0.35)) && now - lastNeedTrialsMs < 200) {
    return;
  }
  lastNeedTrialsMs = now;
  workerScope.postMessage({
    type: 'GPU_NEED_TRIALS',
    wantCount: deficit,
  });
}

function emitGpuSlots(force = false): void {
  const now = performance.now();
  if (!force && now - lastSlotsEmitMs < 350) return;
  lastSlotsEmitMs = now;

  // Report up to 8 representative active GPU trials for the compact live progress grid
  const slots: WorkerSlotProgress[] = activeTrials.slice(0, 8).map((t) => ({
    workerId: t.slotId,
    trialIndex: t.trialIndex,
    algorithm: t.spec.algorithm,
    difficulty: t.spec.difficulty,
    topology: t.spec.topology,
    inputFeatures: t.spec.inputFeatures,
    architecture: t.spec.architecture ?? 'MLP',
    weightPrecision: t.spec.weightPrecision ?? 'FP32',
    populationSize: t.spec.populationSize,
    generation: t.gen,
    bestScore: t.bestScore,
    phase: t.phase,
    auditDetail: t.auditDetail,
  }));
  workerScope.postMessage({ type: 'GPU_SLOTS', slots });
}

function updateTrialStagnation(
  trial: ActiveGpuTrial,
  cfg: ResearchSweepConfig
): boolean {
  if (cfg.stagnationLimit === null) return false;
  if (
    trial.bestScore > trial.bestProgressScore ||
    trial.bestFitness > trial.bestProgressFitness * 1.03 + 2
  ) {
    trial.bestProgressScore = Math.max(
      trial.bestProgressScore,
      trial.bestScore
    );
    trial.bestProgressFitness = Math.max(
      trial.bestProgressFitness,
      trial.bestFitness
    );
    trial.gensWithoutImprovement = 0;
    return false;
  }
  trial.gensWithoutImprovement += 1;
  return trial.gen >= 15 && trial.gensWithoutImprovement >= cfg.stagnationLimit;
}

const MAX_GPU_TRAIN_CAP = 42;
const MAX_GPU_TRIGGER = 40;

function resolveGpuTrainPipeCap(
  _trial: ActiveGpuTrial,
  cfg: ResearchSweepConfig
): number {
  // 42 pipes (~3,800 frames) gives full fitness ranking and crosses the 40-pipe
  // audit trigger without wasting 2x GPU ticks simulating converged populations to 80+ pipes.
  return Math.min(cfg.targetPipeCap, MAX_GPU_TRAIN_CAP);
}

function advanceTrialTrigger(
  trial: ActiveGpuTrial,
  currBest: number,
  cfg: ResearchSweepConfig
): void {
  const maxGpuTrigger = Math.min(cfg.targetPipeCap, MAX_GPU_TRIGGER);
  if (currBest >= maxGpuTrigger) {
    trial.nextAuditTrigger = maxGpuTrigger;
  } else {
    trial.nextAuditTrigger = Math.min(
      maxGpuTrigger,
      Math.max(currBest + 20, Math.round(currBest * 1.35))
    );
  }
}

function checkGpuTrialAuditCache(
  trial: ActiveGpuTrial,
  brain: NeuralNetwork,
  failFast: boolean
): { hit: boolean; fp: string; verifiedPerfect: boolean } {
  const fp = brain.getQuantizedFingerprint();
  const cached = trial.auditedFingerprints.get(fp);
  if (cached && (failFast || cached.full || cached.verifiedPerfect)) {
    trial.auditCacheHits += 1;
    return { hit: true, fp, verifiedPerfect: cached.verifiedPerfect };
  }
  return { hit: false, fp, verifiedPerfect: false };
}

function recordTrialAuditOutcome(
  trial: ActiveGpuTrial,
  brain: NeuralNetwork,
  failFast: boolean,
  audit: {
    seedScores: number[];
    minSeedScore: number;
    meanSeedScore: number;
    verifiedPerfect: boolean;
    ticksEvaluated: number;
    failureAutopsy?: FailureAutopsy | null;
    reasoningTelemetry?: ReasoningTelemetry | null;
  },
  precomputedFp?: string
): boolean {
  trial.auditTicks += audit.ticksEvaluated;
  trial.phase = 'TRAINING';
  trial.auditDetail = undefined;

  const isTruncated = failFast && !audit.verifiedPerfect;
  const fp = precomputedFp ?? brain.getQuantizedFingerprint();
  const prevCached = trial.auditedFingerprints.get(fp);
  trial.auditedFingerprints.set(fp, {
    full: Boolean(prevCached?.full) || !isTruncated,
    verifiedPerfect: Boolean(prevCached?.verifiedPerfect) || audit.verifiedPerfect,
  });

  if (
    !trial.bestAudit ||
    audit.verifiedPerfect ||
    (!isTruncated && trial.bestAudit.truncated && !trial.bestAudit.verifiedPerfect) ||
    audit.minSeedScore > trial.bestAudit.minSeedScore ||
    (audit.minSeedScore === trial.bestAudit.minSeedScore &&
      audit.meanSeedScore > trial.bestAudit.meanSeedScore) ||
    (!failFast &&
      audit.seedScores.length > trial.bestAudit.seedScores.length &&
      !trial.bestAudit.verifiedPerfect)
  ) {
    trial.bestAudit = {
      seedScores: audit.seedScores,
      minSeedScore: audit.minSeedScore,
      meanSeedScore: audit.meanSeedScore,
      verifiedPerfect: audit.verifiedPerfect,
      truncated: isTruncated,
      failureAutopsy: audit.failureAutopsy ?? null,
      reasoningTelemetry: audit.reasoningTelemetry ?? null,
    };
    trial.bestAuditBrain = brain.clone();
  }

  return audit.verifiedPerfect;
}

function captureFinalTrialSnapshot(
  trial: ActiveGpuTrial,
  fallbackChamp?: NeuralNetwork | null
): FinalTrialSnapshot | null {
  if (trial.finalSnapshot) return trial.finalSnapshot;
  const sim = trial.sim;
  if (!sim) return null;
  const snap: FinalTrialSnapshot = {
    fastStats: sim.getFastStats(),
    trainingTicks: sim.getTotalTicksEvaluated(),
    morphSummary: sim.getMorphogenesisSummary(),
    computeStats: sim.getComputeStats(),
    serializedBestBrain:
      trial.bestAuditBrain?.serialize() ??
      fallbackChamp?.serialize() ??
      sim.getChampionBrain(),
  };
  trial.finalSnapshot = snap;
  return snap;
}

function emitCompletedGpuTrial(
  trial: ActiveGpuTrial,
  verifiedPerfect: boolean,
  stoppedReason: TrialStoppedReason
): void {
  if (!sweepConfig) return;
  const cfg = sweepConfig;
  const spec = trial.spec;
  const snap = trial.finalSnapshot ?? captureFinalTrialSnapshot(trial);
  if (!snap) return;
  const stats = snap.fastStats;
  const inputCount = trial.cleanInputs.length;
  const arch = spec.architecture ?? 'MLP';
  const prec = spec.weightPrecision ?? 'FP32';
  const breakdown = calculateTopologyBreakdown(spec.topology, inputCount, 1, arch);
  const topoLabel = formatTopologyLabel(spec.topology, inputCount);
  const bitsPerParam = WEIGHT_PRECISION_META[prec].bitsPerParam;
  const totalBits = Math.max(1, Math.round(breakdown.parameterCount * bitsPerParam));
  const audit = trial.bestAudit;

  const bestTrainingScore = Math.max(
    trial.bestScore,
    stats.allTimeBestScore,
    stats.currentBestScore
  );
  const finalMinSeed = audit ? audit.minSeedScore : bestTrainingScore;
  const finalMeanSeed = audit ? audit.meanSeedScore : bestTrainingScore;
  const isPerfect = verifiedPerfect || Boolean(audit?.verifiedPerfect);
  const finalReason: TrialStoppedReason = isPerfect ? 'PERFECT' : stoppedReason;
  const bestFitness = Math.max(trial.bestFitness, stats.lastBestFitness);

  const curve = [...trial.scoreCurve];
  if (curve.length < trial.gen) {
    curve.push(Math.max(stats.currentBestScore, finalMinSeed));
  }

  const effectiveNow = pausedAtMs > 0 ? pausedAtMs : performance.now();
  const durationMs = Math.max(
    1,
    Math.round(Math.max(trial.accumulatedMs, effectiveNow - trial.startedAtMs))
  );
  const trainingTicks = snap.trainingTicks;
  const auditTicks = trial.auditTicks;
  const totalTicks = trainingTicks + auditTicks;
  const ticksPerSecond = Math.round((totalTicks / durationMs) * 1000);
  const birdEpisodesEvaluated = trial.gen * spec.populationSize;
  const trainingSynapticOps =
    trainingTicks * Math.max(1, breakdown.parameterCount);
  const normalizedComputeMs = Number((trainingSynapticOps / 10000).toFixed(1));

  const effectiveScore = Math.max(bestTrainingScore, finalMinSeed);
  const totalHidden = spec.topology.reduce((a, b) => a + b, 0);
  const maxWidth = spec.topology.length > 0 ? Math.max(...spec.topology) : 0;
  const genRatio =
    bestTrainingScore > 0
      ? Number(Math.min(1, finalMinSeed / bestTrainingScore).toFixed(2))
      : finalMinSeed > 0
        ? 1
        : 0;

  const serializedBestBrain =
    trial.bestAuditBrain?.serialize() ?? snap.serializedBestBrain;
  const policyProfile = analyzePolicyMechanism(serializedBestBrain);
  const learningDynamic = classifyLearningDynamic(
    curve,
    bestTrainingScore,
    finalMinSeed,
    isPerfect
  );
  const failureAutopsy = audit?.failureAutopsy
    ? {
        ...audit.failureAutopsy,
        generalizationGap: Math.max(0, Math.round(bestTrainingScore - finalMinSeed)),
      }
    : null;
  const trialCurr = spec.curriculumLearning ?? Boolean(cfg.curriculumLearning);
  const trialShape = spec.shapedFitness ?? Boolean(cfg.shapedFitness);
  const reasoningStepsOpt =
    arch === 'LOOPED_REASONER' || arch === 'PONDER_ACT'
      ? (spec.reasoningSteps ?? cfg.reasoningSteps)
      : undefined;
  const trialMorphMode: 'STATIC' | 'GROWING' =
    spec.morphogenesisMode === 'GROWING' ? 'GROWING' : 'STATIC';
  const evoMode = spec.evolutionTopologyMode ?? cfg.evolutionTopologyMode ?? 'SINGLE_SPECIES';
  const trialPerceptionMode =
    arch === 'DROSOPHILA_CONNECTOME' || arch === 'DECOUPLED_FLY_CORTEX'
      ? (spec.perceptionMode ?? cfg.perceptionMode ?? 'GEOMETRIC_LAB')
      : undefined;
  const morphSummary = snap.morphSummary;
  const computeStats = snap.computeStats;
  const meanFlops = computeStats.meanFlopsPerFrame;
  const computeEfficiencyScore =
    meanFlops > 0
      ? Number((finalMinSeed / (meanFlops / 100)).toFixed(2))
      : 0;
  const trialSignature = buildTrialSignature({
    algorithm: spec.algorithm,
    difficulty: spec.difficulty,
    topology: spec.topology,
    inputFeatures: trial.cleanInputs,
    architecture: arch,
    weightPrecision: prec,
    populationSize: spec.populationSize,
    mutationRate: spec.mutationRate,
    mutationStrength: spec.mutationStrength,
    targetPipeCap: cfg.targetPipeCap,
    verificationSeeds: cfg.verificationSeeds,
    curriculumLearning: trialCurr,
    shapedFitness: trialShape,
    reasoningSteps: reasoningStepsOpt,
    morphogenesisMode: trialMorphMode,
    evolutionTopologyMode: evoMode,
    perceptionMode: trialPerceptionMode,
  });

  const inputKey = formatInputSubsetKey(trial.cleanInputs);
  const inputSetLabel = formatInputSubsetLabel(trial.cleanInputs);
  const variantSuffix = `${arch !== 'MLP' ? `-${arch}` : ''}${prec !== 'FP32' ? `-${prec}` : ''}${trialCurr ? '-curr' : ''}${trialShape ? '-shape' : ''}${reasoningStepsOpt !== undefined && reasoningStepsOpt !== 3 ? `-k${reasoningStepsOpt}` : ''}${trialMorphMode === 'GROWING' ? '-morph' : ''}${evoMode === 'ISLAND_SPECIATION' ? '-isl' : ''}${trialPerceptionMode === 'COMPOUND_EYE_PIXELS' ? '-eye' : ''}`;

  const result: ResearchTrialResult = {
    id: `trial-${trial.trialIndex}-${spec.algorithm}-${spec.difficulty}-${inputCount}in-${inputKey}-${spec.topology.join('x') || 'lin'}${variantSuffix}-p${spec.populationSize}-m${spec.mutationRate}-s${spec.mutationStrength}`,
    trialSignature,
    algorithm: spec.algorithm,
    difficulty: spec.difficulty,
    topology: [...spec.topology],
    topologyLabel: topoLabel,
    inputFeatures: trial.cleanInputs,
    inputCount,
    inputSetLabel,
    architecture: arch,
    weightPrecision: prec,
    bitsPerParam,
    totalBits,
    pipesPerBit: Number((finalMinSeed / totalBits).toFixed(3)),
    depth: spec.topology.length,
    maxWidth,
    hiddenNodes: spec.topology.length === 1 ? spec.topology[0] : totalHidden,
    hiddenNeuronCount: breakdown.hiddenNeuronCount,
    weightCount: breakdown.weightCount,
    biasCount: breakdown.biasCount,
    parameterCount: breakdown.parameterCount,
    mutationRate: spec.mutationRate,
    mutationStrength: spec.mutationStrength,
    populationSize: spec.populationSize,
    targetPipeCap: cfg.targetPipeCap,
    verificationSeeds: cfg.verificationSeeds,
    curriculumLearning: trialCurr || undefined,
    shapedFitness: trialShape || undefined,
    reasoningSteps: reasoningStepsOpt,
    morphogenesisMode: trialMorphMode,
    morphogenesisSummary: morphSummary,
    evolutionTopologyMode: evoMode,
    perceptionMode: trialPerceptionMode,
    computeProfile: computeStats.computeProfile,
    meanFlopsPerFrame: meanFlops,
    computeEfficiencyScore,
    bestScore: effectiveScore,
    minSeedScore: finalMinSeed,
    meanSeedScore: finalMeanSeed,
    seedScores: audit?.seedScores ?? [bestTrainingScore],
    verifiedPerfect: isPerfect,
    stoppedReason: finalReason,
    bestFitness: Number(bestFitness.toFixed(1)),
    finalAvgScore: stats.lastAvgScore,
    generationsRun: trial.gen,
    solved: isPerfect,
    generationsToSolve: isPerfect ? trial.gen : null,
    timeToPerfectionMs: isPerfect ? durationMs : null,
    totalTicksEvaluated: totalTicks,
    trainingTicksEvaluated: trainingTicks,
    auditTicksEvaluated: auditTicks,
    birdEpisodesEvaluated,
    trainingSynapticOps,
    normalizedComputeMs,
    ticksPerSecond,
    knowledgeDensity: Number((finalMinSeed / breakdown.parameterCount).toFixed(2)),
    generalizationRatio: genRatio,
    durationMs,
    policyProfile,
    failureAutopsy,
    reasoningTelemetry: audit?.reasoningTelemetry ?? null,
    learningDynamic,
    bestBrain: serializedBestBrain,
    scoreCurve: curve,
  };

  workerScope.postMessage({
    type: 'TRIAL_DONE',
    trialIndex: trial.trialIndex,
    trial: result,
    gpuTimeMs: trial.accumulatedMs,
    cpuVerifyMs: trial.cpuVerifyMs,
    auditCacheHits: trial.auditCacheHits,
  });
}

function runCpuExactAudit(
  trial: ActiveGpuTrial,
  brain: NeuralNetwork,
  cfg: ResearchSweepConfig,
  failFast: boolean
): boolean {
  const cache = checkGpuTrialAuditCache(trial, brain, failFast);
  if (cache.hit) {
    trial.lastAuditedBrain = brain;
    trial.lastAuditGen = trial.gen;
    return cache.verifiedPerfect;
  }
  trial.phase = 'AUDITING';
  trial.auditDetail = `f64 ${cfg.verificationSeeds}s`;
  const verifyStart = performance.now();
  const cpuAudit = auditBrainMastery(
    brain,
    trial.spec.difficulty,
    cfg.targetPipeCap,
    cfg.verificationSeeds,
    cfg.customEnvironment,
    failFast,
    trial.bestScore
  );
  const verifyElapsed = performance.now() - verifyStart;
  trial.cpuVerifyMs += verifyElapsed;
  trial.accumulatedMs += verifyElapsed;
  trial.lastAuditedBrain = brain;
  trial.lastAuditGen = trial.gen;

  return recordTrialAuditOutcome(
    trial,
    brain,
    failFast,
    {
      seedScores: cpuAudit.seedScores,
      minSeedScore: cpuAudit.minSeedScore,
      meanSeedScore: cpuAudit.meanSeedScore,
      verifiedPerfect: cpuAudit.verifiedPerfect,
      ticksEvaluated: cpuAudit.ticksEvaluated,
      failureAutopsy: cpuAudit.failureAutopsy,
      reasoningTelemetry: cpuAudit.reasoningTelemetry,
    },
    cache.fp
  );
}

function dispatchAsyncCpuAudit(
  trial: ActiveGpuTrial,
  brain: NeuralNetwork,
  cfg: ResearchSweepConfig,
  kind: 'MID_TRIGGER' | 'FINAL',
  currBest: number,
  failFast: boolean,
  stoppedReason: TrialStoppedReason
): boolean {
  const cache = checkGpuTrialAuditCache(trial, brain, failFast);
  if (cache.hit) {
    trial.lastAuditedBrain = brain;
    trial.lastAuditGen = trial.gen;
    return false;
  }
  const reqId = nextVerifyReqId++;
  trial.awaitingCpuAudit = true;
  trial.phase = 'AUDITING';
  trial.auditDetail = `f64 ${cfg.verificationSeeds}s`;
  trial.lastAuditedBrain = brain;
  trial.lastAuditGen = trial.gen;
  if (kind === 'MID_TRIGGER') {
    trial.midAuditCount += 1;
    trial.lastAuditTriggerScore = Math.max(trial.lastAuditTriggerScore, currBest);
    trial.lastAuditBestFitness = Math.max(trial.lastAuditBestFitness, trial.bestFitness);
  } else {
    // Release full population simulation heap immediately once trial reaches FINAL CPU verify
    captureFinalTrialSnapshot(trial, brain);
    trial.sim = null;
  }

  pendingAsyncVerifies.set(reqId, {
    sessionId: runSessionId,
    trial,
    kind,
    brain,
    currBest,
    failFast,
    stoppedReason,
  });

  workerScope.postMessage({
    type: 'GPU_VERIFY_REQUEST',
    reqId,
    brain: brain.serialize(),
    difficulty: trial.spec.difficulty,
    targetPipeCap: cfg.targetPipeCap,
    verificationSeeds: cfg.verificationSeeds,
    customEnvironment: cfg.customEnvironment,
    failFast,
  });
  return true;
}

function finalizeTrialWithCpuAudit(
  trial: ActiveGpuTrial,
  cfg: ResearchSweepConfig,
  stoppedReason: TrialStoppedReason
): boolean {
  // Returns true if trial was immediately emitted & should be removed; false if awaiting async FINAL audit
  const sim = trial.sim;
  const simChamp =
    sim?.getChampionNetworkInstance() ??
    sim?.getGenerationLeaderNetworkInstance() ??
    null;
  const audit = trial.bestAudit;
  const hasNewerSimChamp =
    simChamp !== null && simChamp !== trial.lastAuditedBrain;
  const needsFullAudit =
    !audit ||
    (!audit.verifiedPerfect &&
      (hasNewerSimChamp ||
        Boolean(audit.truncated) ||
        audit.seedScores.length < cfg.verificationSeeds));

  let verifiedPerfect = Boolean(audit?.verifiedPerfect);
  if (needsFullAudit) {
    // Prefer latest training champion when newer than previous audited brain
    const champ = hasNewerSimChamp
      ? simChamp
      : (trial.bestAuditBrain ?? simChamp);
    if (champ) {
      if (useAsyncVerify) {
        const dispatched = dispatchAsyncCpuAudit(
          trial,
          champ.clone(),
          cfg,
          'FINAL',
          trial.bestScore,
          false,
          stoppedReason
        );
        if (dispatched) return false;
      } else {
        verifiedPerfect = runCpuExactAudit(trial, champ.clone(), cfg, false);
      }
    }
  }

  emitCompletedGpuTrial(trial, verifiedPerfect, stoppedReason);
  return true;
}

function finishGenerationAndAdvanceOrStop(
  trial: ActiveGpuTrial,
  cfg: ResearchSweepConfig
): boolean {
  // Returns true if trial completed and should be removed from activeTrials
  if (updateTrialStagnation(trial, cfg)) {
    return finalizeTrialWithCpuAudit(trial, cfg, 'STAGNATED');
  }
  if (cfg.maxGenerations !== null && trial.gen >= cfg.maxGenerations) {
    return finalizeTrialWithCpuAudit(trial, cfg, 'MAX_GENS');
  }

  if (!trial.sim) return true;
  trial.sim.forceAdvanceGeneration();
  trial.gen = trial.sim.getFastStats().generation;
  trial.phase = 'TRAINING';
  trial.auditDetail = undefined;
  return false;
}

interface BatchSliceEntry {
  trial: ActiveGpuTrial;
  taskStart: number;
  taskCount: number;
  gpuTrainCap: number;
  genSeed: number;
  genEnv: EnvironmentConfig;
  sprintFrames: number; // > 0 when early-gen sprint cap is active
}

const EARLY_GEN_SPRINT_FRAMES = 650;
const MAX_CPU_SPRINT_SURVIVORS_PER_TRIAL = 6;

interface PreparedWave {
  slices: BatchSliceEntry[];
  totalTasks: number;
  weightCursor: number;
}

function packTrialsIntoStaging(
  groupTrials: ActiveGpuTrial[],
  cfg: ResearchSweepConfig
): PreparedWave {
  let totalTasks = 0;
  let totalWeights = 0;
  const slices: BatchSliceEntry[] = [];
  const curriculumGens =
    cfg.maxGenerations !== null
      ? Math.max(8, Math.min(24, Math.round(cfg.maxGenerations * 0.4)))
      : 18;

  for (let i = 0; i < groupTrials.length; i++) {
    const trial = groupTrials[i];
    if (!trial.sim) continue;
    const popSize = trial.sim.getPopulationSize();
    const gpuTrainCap = resolveGpuTrainPipeCap(trial, cfg);
    const genSeed = ((Math.random() * 0xffffffff) >>> 0) || 1;
    const trialCurr =
      trial.spec.curriculumLearning ?? Boolean(cfg.curriculumLearning);
    const genEnv = trialCurr
      ? resolveCurriculumEnvironment(trial.env, trial.gen, curriculumGens)
      : trial.env;
    // On early gens (gen <= 2 & bestScore < 10), ~98% of birds die in < 200 frames while
    // 1-4 lucky birds fly 4,000+ frames and stall the whole GPU warp. Sprint to 650 frames
    // on GPU, then finish only those rare survivors in exact f64 on CPU (<1ms each)!
    const useEarlySprint =
      trial.gen <= 2 && trial.bestScore < 10 && gpuTrainCap > 8;
    slices.push({
      trial,
      taskStart: totalTasks,
      taskCount: popSize,
      gpuTrainCap,
      genSeed,
      genEnv,
      sprintFrames: useEarlySprint ? EARLY_GEN_SPRINT_FRAMES : 0,
    });
    totalTasks += popSize;
    totalWeights += popSize * trial.paramCount;
  }

  ensureStagingCapacity(totalTasks, totalWeights);

  let taskCursor = 0;
  let weightCursor = 0;

  for (let s = 0; s < slices.length; s++) {
    const entry = slices[s];
    const trial = entry.trial;
    const sim = trial.sim!;
    const popBaseWeight = weightCursor;
    const written = sim.packPopulationWeights(
      stagingWeightsF32,
      weightCursor
    );
    weightCursor += written;

    const fullMaxFrames =
      (entry.gpuTrainCap + 14) * Math.round(entry.genEnv.spawnFrames * 1.25 + 14);
    const maxFramesPerGen =
      entry.sprintFrames > 0
        ? Math.min(entry.sprintFrames, fullMaxFrames)
        : fullMaxFrames;

    const activeK = sim.getActiveReasoningSteps();
    const metaCost = sim.getMetabolicStepCost();
    const trialShape = trial.spec.shapedFitness ?? Boolean(cfg.shapedFitness);
    for (let b = 0; b < entry.taskCount; b++) {
      writeTaskDescToBuffers(stagingTasksU32, stagingTasksF32, taskCursor++, {
        weightOffset: popBaseWeight + b * trial.paramCount,
        seed: entry.genSeed,
        targetPipeCap: entry.gpuTrainCap,
        maxFrames: maxFramesPerGen,
        topoMeta0: trial.topoMeta0,
        topoMeta1: trial.topoMeta1,
        sensorMask: trial.sensorMask,
        sensorMask1: trial.sensorMask1,
        env: entry.genEnv,
        computeFitness: true,
        architecture: trial.spec.architecture ?? 'MLP',
        shapedFitness: trialShape,
        reasoningSteps: activeK,
        metabolicStepCost: metaCost,
      });
    }
  }

  return { slices, totalTasks, weightCursor };
}

function processSliceResults(
  slices: BatchSliceEntry[],
  totalTasks: number,
  kernelKind: GpuKernelKind,
  batchRes: GpuBatchResult,
  cfg: ResearchSweepConfig,
  mySessionId: number,
  completedSet: Set<ActiveGpuTrial>,
  lastBreathMs = 0
): void {
  const activeCount = activeTrials.length;
  let awaitingVerifyCount = 0;
  for (let i = 0; i < activeCount; i++) {
    if (activeTrials[i].awaitingCpuAudit) awaitingVerifyCount += 1;
  }
  const perTrialDispatchShare =
    slices.length > 0 ? batchRes.dispatchMs / slices.length : batchRes.dispatchMs;

  workerScope.postMessage({
    type: 'GPU_BATCH_STATS',
    tasks: totalTasks,
    ticks: batchRes.totalTicks,
    dispatchMs: batchRes.dispatchMs,
    activeTrials: activeCount,
    kernelKind,
    waveWeightBudget,
    maxInFlightWaves,
    breathMs: lastBreathMs,
    awaitingVerifyCount,
  });

  for (let s = 0; s < slices.length; s++) {
    if (mySessionId !== runSessionId) break;
    const entry = slices[s];
    const trial = entry.trial;
    if (!activeTrials.includes(trial) || !trial.sim) continue;
    trial.accumulatedMs += perTrialDispatchShare;

    const start = entry.taskStart;
    const end = start + entry.taskCount;
    const sliceScores = batchRes.scores.subarray(start, end);
    const sliceFitnesses = batchRes.fitnesses.subarray(start, end);
    const sliceTicks = batchRes.ticks.subarray(start, end);

    // Finish rare early-gen sprint survivors in exact f64 on CPU (zero GPU tail stall!)
    if (entry.sprintFrames > 0) {
      let finishedSurvivors = 0;
      const sprintStart = performance.now();
      for (let b = 0; b < entry.taskCount; b++) {
        if (
          sliceTicks[b] >= entry.sprintFrames &&
          sliceScores[b] < entry.gpuTrainCap
        ) {
          const brain = trial.sim.getBirdBrain(b);
          if (brain) {
            const exact = evaluateBirdTrainingEpisode(
              brain,
              trial.spec.difficulty,
              entry.gpuTrainCap,
              entry.genSeed,
              cfg.customEnvironment,
              {
                shapedFitness:
                  trial.spec.shapedFitness ?? Boolean(cfg.shapedFitness),
                trainingEnvOverride: entry.genEnv,
                metabolicStepCost: trial.sim.getMetabolicStepCost(),
              }
            );
            sliceScores[b] = exact.score;
            sliceFitnesses[b] = exact.fitness;
            sliceTicks[b] = exact.ticks;
            finishedSurvivors += 1;
            if (finishedSurvivors >= MAX_CPU_SPRINT_SURVIVORS_PER_TRIAL) {
              break;
            }
          }
        }
      }
      if (finishedSurvivors > 0) {
        const sprintCpuMs = performance.now() - sprintStart;
        trial.accumulatedMs += sprintCpuMs;
      }
    }

    const genRes = trial.sim.applyExternalGenerationResults(
      sliceScores,
      sliceFitnesses,
      sliceTicks,
      false
    );

    trial.scoreCurve.push(genRes.bestScore);
    if (genRes.bestScore > trial.bestScore) {
      trial.bestScore = genRes.bestScore;
    }
    if (genRes.bestFitness > trial.bestFitness) {
      trial.bestFitness = genRes.bestFitness;
    }

    const maxGpuTrigger = Math.min(cfg.targetPipeCap, MAX_GPU_TRIGGER);
    const hitTrigger =
      genRes.bestScore >= trial.nextAuditTrigger ||
      genRes.bestScore >= entry.gpuTrainCap;

    if (hitTrigger) {
      const cand =
        trial.sim.getBirdBrain(genRes.bestBirdIdx) ??
        trial.sim.getChampionNetworkInstance();
      const alreadyAuditedSame =
        cand !== null &&
        cand === trial.lastAuditedBrain &&
        trial.bestAudit !== null;
      const verifyBacklog = pendingAsyncVerifies.size;
      const isGen1 = trial.gen === 1;
      // Avoid hammering CPU verify every 6 gens at cap=40 unless there's genuine headroom
      // and a real +25% fitness breakthrough; Gen 1 always checks cleanly (or at FINAL).
      const repeatedAtCap =
        !isGen1 &&
        trial.midAuditCount >= 1 &&
        trial.lastAuditTriggerScore >= maxGpuTrigger &&
        (verifyBacklog >= 12 ||
          trial.gen - trial.lastAuditGen < 20 ||
          genRes.bestFitness < trial.lastAuditBestFitness * 1.25);
      const deferredByBackpressure =
        useAsyncVerify &&
        !isGen1 &&
        verifyBacklog >= 32 &&
        (trial.midAuditCount > 0 || trial.gen > 2);

      if (cand && !alreadyAuditedSame && !repeatedAtCap && !deferredByBackpressure) {
        if (useAsyncVerify) {
          const dispatched = dispatchAsyncCpuAudit(
            trial,
            cand.clone(),
            cfg,
            'MID_TRIGGER',
            genRes.bestScore,
            true,
            'MAX_GENS'
          );
          if (dispatched) continue;
        } else {
          trial.midAuditCount += 1;
          trial.lastAuditTriggerScore = Math.max(
            trial.lastAuditTriggerScore,
            genRes.bestScore
          );
          trial.lastAuditBestFitness = Math.max(
            trial.lastAuditBestFitness,
            trial.bestFitness
          );
          const solved = runCpuExactAudit(trial, cand.clone(), cfg, true);
          if (solved) {
            emitCompletedGpuTrial(trial, true, 'PERFECT');
            completedSet.add(trial);
            continue;
          }
        }
      }
      advanceTrialTrigger(trial, genRes.bestScore, cfg);
    }

    const finished = finishGenerationAndAdvanceOrStop(trial, cfg);
    if (finished) completedSet.add(trial);
  }
}

async function runSliceGroup(
  groupTrials: ActiveGpuTrial[],
  kernelKind: GpuKernelKind,
  cfg: ResearchSweepConfig,
  mySessionId: number,
  completedSet: Set<ActiveGpuTrial>
): Promise<void> {
  if (groupTrials.length === 0 || !gpu) return;
  const prepared = packTrialsIntoStaging(groupTrials, cfg);
  if (gpu.prepareKernelTier) {
    await gpu.prepareKernelTier(kernelKind);
  }
  let batchRes: GpuBatchResult;
  try {
    batchRes = await gpu.evaluateRawBatch(
      prepared.totalTasks,
      stagingTasksU32,
      stagingWeightsF32,
      prepared.weightCursor,
      kernelKind
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('GPU batch evaluation error, attempting device recovery:', err);
    try {
      gpu = await createBestGpuEvaluator();
      batchRes = await gpu.evaluateRawBatch(
        prepared.totalTasks,
        stagingTasksU32,
        stagingWeightsF32,
        prepared.weightCursor,
        kernelKind
      );
    } catch (recErr) {
      throw recErr;
    }
  }
  if (mySessionId !== runSessionId) return;
  processSliceResults(
    prepared.slices,
    prepared.totalTasks,
    kernelKind,
    batchRes,
    cfg,
    mySessionId,
    completedSet,
    0
  );
}

interface InFlightWave {
  slotIdx: number;
  kernelKind: GpuKernelKind;
  pending: GpuPendingBatch;
  slices: BatchSliceEntry[];
  totalTasks: number;
}

function getTrialKernelKind(t: ActiveGpuTrial): GpuKernelKind {
  const arch = t.spec.architecture ?? 'MLP';
  const tier = getGpuTopologyTier(t.spec.topology, arch);
  switch (tier) {
    case 'FAST':
      return 0;
    case 'COMPACT_DEEP':
      return 1;
    case 'DEEP_24':
      return 2;
    case 'BIO_TINY':
      return 3;
    case 'BIO_STD':
      return 4;
    case 'BIO_MED':
      return 5;
    case 'BIO_LARGE':
      return 6;
    case 'DEEP_64':
      return 7;
    default:
      return arch === 'MLP' ? 2 : 4;
  }
}

/**
 * Closed-loop GPU wave governor with:
 * 1. Live GPU Load % control (10..100%, default 100%):
 *    - At 100%: zero artificial pause, full 2-deep ping-pong pipeline, maximum EU saturation.
 *    - Below 100%: proportional duty-cycle rest between waves + scaled wave weight budget
 *      so laptops/iGPUs stay cool and desktop/video playback stays silky smooth.
 * 2. Windows TDR Watchdog:
 *    - Enforces a hard wave latency ceiling well under Windows 2000ms TDR timeout
 *      (default ~140ms on iGPU / ~380ms on dGPU, calibrated at startup).
 *    - Any wave crossing `tdrCeilingMs` immediately halves `waveWeightBudget` and yields 8ms.
 */
async function applyAntiFreezeGovernor(
  dispatchMs: number,
  waveTasks: number,
  kernelKind: GpuKernelKind
): Promise<number> {
  if (!gpu) return 0;
  const isIgpu = Boolean(gpu.isIntegrated);
  const isDiscreteWebGpu = !isIgpu && gpu.engine === 'WEBGPU';
  const loadPct = Math.max(10, Math.min(100, Math.round(targetGpuLoadPercent)));
  const loadRatio = loadPct / 100;
  const fullFocus = loadPct >= 98;

  const tdrCeilingMs = gpu.calibration?.tdrCeilingMs ?? (isIgpu ? 150 : 380);
  const baseTargetMs = isIgpu
    ? fullFocus
      ? 68
      : 28
    : isDiscreteWebGpu
      ? fullFocus
        ? 150
        : 75
      : 52;
  const targetMs = Math.max(14, Math.round(baseTargetMs * (0.45 + 0.55 * loadRatio)));
  const hardCeilingMs = Math.min(
    tdrCeilingMs,
    Math.round(targetMs * (fullFocus ? 1.6 : 1.4))
  );
  const minBudget = isIgpu ? 160 : isDiscreteWebGpu ? 2048 : 1200;
  const maxBudgetBase = isIgpu ? 10240 : isDiscreteWebGpu ? 18432 : 10240;
  const maxBudget = Math.max(minBudget, Math.round(maxBudgetBase * (0.35 + 0.65 * loadRatio)));

  emaDispatchMs = emaDispatchMs * 0.65 + dispatchMs * 0.35;

  // Per-kernel scaling prevents fast Gen-1 MLP batches from inflating mature BIO/DEEP waves past TDR
  const prevScale = kernelBudgetScale[kernelKind] ?? 1.0;
  if (dispatchMs > tdrCeilingMs) {
    kernelBudgetScale[kernelKind] = Math.max(0.22, prevScale * 0.55);
  } else if (dispatchMs > tdrCeilingMs * 0.68) {
    kernelBudgetScale[kernelKind] = Math.max(0.28, prevScale * 0.72);
  } else if (dispatchMs < targetMs * 0.72 && prevScale < 1.0) {
    kernelBudgetScale[kernelKind] = Math.min(1.0, prevScale * 1.05);
  }

  // Hard Windows TDR / Metal watchdog safeguard
  if (dispatchMs > tdrCeilingMs) {
    waveWeightBudget = Math.max(minBudget, Math.round(waveWeightBudget * 0.55));
    maxInFlightWaves = 1;
    targetReadyTasks = Math.round(waveWeightBudget * 1.5);
    lastCompositorBreathMs = performance.now();
    await new Promise((r) => setTimeout(r, 8));
    return 8;
  }

  if (dispatchMs > hardCeilingMs * 1.25) {
    waveWeightBudget = Math.max(minBudget, Math.round(waveWeightBudget * 0.7));
  } else if (dispatchMs > hardCeilingMs) {
    waveWeightBudget = Math.max(minBudget, Math.round(waveWeightBudget * 0.85));
  } else if (emaDispatchMs > targetMs * 1.15) {
    waveWeightBudget = Math.max(minBudget, Math.round(waveWeightBudget * 0.92));
  } else if (
    emaDispatchMs < targetMs * 0.8 &&
    waveTasks >= Math.round(waveWeightBudget * 0.45)
  ) {
    waveWeightBudget = Math.min(maxBudget, Math.round(waveWeightBudget * 1.12));
  }
  waveWeightBudget = Math.min(waveWeightBudget, maxBudget);

  if (fullFocus) {
    // 100% GPU focus: keep ping-pong double-buffering saturated unless approaching TDR ceiling
    maxInFlightWaves =
      dispatchMs > tdrCeilingMs * 0.58 || emaDispatchMs > targetMs * 1.18 ? 1 : 2;
  } else if (loadPct <= 60) {
    maxInFlightWaves = 1;
  } else if (isIgpu) {
    maxInFlightWaves = emaDispatchMs > 38 || dispatchMs > 52 ? 1 : 2;
  } else {
    maxInFlightWaves = dispatchMs > tdrCeilingMs * 0.58 ? 1 : 2;
  }

  targetReadyTasks = Math.round(waveWeightBudget * (maxInFlightWaves === 2 ? 2.15 : 1.55));

  let breathMs = 0;
  if (!fullFocus) {
    // Duty-cycle pacing: work / (work + rest) ≈ loadRatio
    const idealRest = dispatchMs * ((1 - loadRatio) / Math.max(0.1, loadRatio));
    breathMs = Math.max(2, Math.min(180, Math.round(idealRest)));
    lastCompositorBreathMs = performance.now();
    await new Promise((r) => setTimeout(r, breathMs));
  } else if (isIgpu && dispatchMs > tdrCeilingMs * 0.72) {
    // Subtle safety yield only if an iGPU wave gets close to the TDR ceiling
    breathMs = 4;
    lastCompositorBreathMs = performance.now();
    await new Promise((r) => setTimeout(r, breathMs));
  }
  return breathMs;
}

const NUM_KERNEL_BUCKETS = 8;

async function runPipelinedLoop(mySessionId: number): Promise<void> {
  if (!gpu || !gpu.submitRawBatch || !gpu.awaitRawBatch) return;
  const inFlightTrials = new Set<ActiveGpuTrial>();
  const waveQueue: InFlightWave[] = [];
  const bucketWaitAge = new Array<number>(NUM_KERNEL_BUCKETS).fill(0);
  let lastBreathMs = 0;

  const trySubmitWave = async (cfg: ResearchSweepConfig): Promise<boolean> => {
    if (!gpu || !gpu.submitRawBatch || waveQueue.length >= maxInFlightWaves) return false;
    const buckets: ActiveGpuTrial[][] = Array.from({ length: NUM_KERNEL_BUCKETS }, () => []);
    const bucketTasks = new Array<number>(NUM_KERNEL_BUCKETS).fill(0);

    for (let i = 0; i < activeTrials.length; i++) {
      const t = activeTrials[i];
      if (t.awaitingCpuAudit || inFlightTrials.has(t)) continue;
      const k = getTrialKernelKind(t);
      buckets[k].push(t);
      bucketTasks[k] += t.spec.populationSize;
    }

    // Pick largest ready kernel bucket to maximize GPU EU saturation (with starvation guard)
    let chosenKind: GpuKernelKind | -1 = -1;
    let bestScore = -1;
    let nonEmptyBuckets = 0;
    for (let k = 0; k < NUM_KERNEL_BUCKETS; k++) {
      if (buckets[k].length === 0) {
        bucketWaitAge[k] = 0;
        continue;
      }
      nonEmptyBuckets += 1;
      const starvedBoost = bucketWaitAge[k] >= 4 ? 100000 : 0;
      const score = bucketTasks[k] + starvedBoost;
      if (score > bestScore) {
        bestScore = score;
        chosenKind = k as GpuKernelKind;
      }
    }
    if (chosenKind === -1) return false;

    for (let k = 0; k < NUM_KERNEL_BUCKETS; k++) {
      if (k === chosenKind) bucketWaitAge[k] = 0;
      else if (buckets[k].length > 0) bucketWaitAge[k] += 1;
    }

    // Lazy JIT-compile higher register tiers (BIO_MED 32/36, BIO_LARGE 64/64, DEEP_64) on first demand
    if (gpu.prepareKernelTier) {
      await gpu.prepareKernelTier(chosenKind);
    }
    if (!gpu || !gpu.submitRawBatch || mySessionId !== runSessionId || status !== 'RUNNING') {
      return false;
    }

    const rawPool = buckets[chosenKind];
    const otherPoolsEmpty = nonEmptyBuckets === 1;
    const regPressure = gpu.calibration?.registerPressureRatio ?? 1.25;
    // Scale wave budget by register-tier weight & calibrated hardware pressure so wide 32/64n
    // bio tiers never trip TDR while keeping tiny 8/12n & MLP tiers at 100% saturation.
    let kernelBudgetDivisor = 1.0;
    if (chosenKind === 1) kernelBudgetDivisor = gpu.isIntegrated ? 1.45 : 1.05;
    else if (chosenKind === 2) kernelBudgetDivisor = gpu.isIntegrated ? 1.9 : 1.15;
    else if (chosenKind === 3) kernelBudgetDivisor = gpu.isIntegrated ? 1.35 : 1.0;
    else if (chosenKind === 4) kernelBudgetDivisor = gpu.isIntegrated ? 1.85 * Math.min(1.5, regPressure) : Math.max(1.0, regPressure * 0.9);
    else if (chosenKind === 5) kernelBudgetDivisor = (gpu.isIntegrated ? 2.6 : 1.45) * Math.min(1.75, regPressure);
    else if (chosenKind === 6) kernelBudgetDivisor = (gpu.isIntegrated ? 4.2 : 2.1) * Math.min(2.0, regPressure);
    else if (chosenKind === 7) kernelBudgetDivisor = (gpu.isIntegrated ? 3.2 : 1.65) * Math.min(1.6, regPressure);

    const kScale = kernelBudgetScale[chosenKind] ?? 1.0;
    const maxRawTasksForKind = getSafeMaxRawTasksForKernel(
      chosenKind,
      Boolean(gpu.isIntegrated)
    );
    const maxWeightPerWave = Math.max(
      gpu.isIntegrated ? 160 : gpu.engine === 'WEBGPU' ? 1280 : 1024,
      Math.round((waveWeightBudget * kScale) / kernelBudgetDivisor)
    );

    // Zigzag-mix heaviest and lightest trials in the pool for smooth cadence
    let pool = rawPool;
    if (rawPool.length >= 3) {
      const scored = rawPool.map((t) => ({
        t,
        w: t.spec.populationSize * estimateTrialUnitWeight(t),
      }));
      scored.sort((a, b) => b.w - a.w);
      const mixed: ActiveGpuTrial[] = [];
      let lo = 0;
      let hi = scored.length - 1;
      while (lo <= hi) {
        mixed.push(scored[lo++].t);
        if (lo <= hi) mixed.push(scored[hi--].t);
      }
      pool = mixed;
    }

    let chosen: ActiveGpuTrial[];
    if (waveQueue.length === 0 && otherPoolsEmpty && pool.length >= 2) {
      let totalPoolWeight = 0;
      for (let i = 0; i < pool.length; i++) {
        totalPoolWeight += pool[i].spec.populationSize * estimateTrialUnitWeight(pool[i]);
      }
      const halfWeightTarget = Math.min(maxWeightPerWave, totalPoolWeight * 0.5);
      chosen = [];
      let accWeight = 0;
      let accRawTasks = 0;
      for (let i = 0; i < pool.length - 1; i++) {
        const pop = pool[i].spec.populationSize;
        if (chosen.length > 0 && accRawTasks + pop > maxRawTasksForKind) break;
        chosen.push(pool[i]);
        accRawTasks += pop;
        accWeight += pop * estimateTrialUnitWeight(pool[i]);
        if (accWeight >= halfWeightTarget) break;
      }
    } else {
      chosen = [];
      let accWeight = 0;
      let accRawTasks = 0;
      for (let i = 0; i < pool.length; i++) {
        const pop = pool[i].spec.populationSize;
        const w = pop * estimateTrialUnitWeight(pool[i]);
        if (
          chosen.length > 0 &&
          (accWeight + w > maxWeightPerWave || accRawTasks + pop > maxRawTasksForKind)
        ) {
          break;
        }
        chosen.push(pool[i]);
        accRawTasks += pop;
        accWeight += w;
      }
    }

    if (chosen.length === 0) return false;

    const busySlot = waveQueue.length === 1 ? waveQueue[0].slotIdx : -1;
    const freeSlot = busySlot === 0 ? 1 : 0;
    const prepared = packTrialsIntoStaging(chosen, cfg);
    const pending = gpu.submitRawBatch(
      freeSlot,
      prepared.totalTasks,
      stagingTasksU32,
      stagingWeightsF32,
      prepared.weightCursor,
      chosenKind
    );

    for (let i = 0; i < chosen.length; i++) {
      inFlightTrials.add(chosen[i]);
    }
    waveQueue.push({
      slotIdx: freeSlot,
      kernelKind: chosenKind,
      pending,
      slices: prepared.slices,
      totalTasks: prepared.totalTasks,
    });
    return true;
  };

  let consecutiveRecoveries = 0;
  const MAX_CONSECUTIVE_RECOVERIES = 3;

  try {
    while (status !== 'IDLE' && mySessionId === runSessionId && gpu && sweepConfig) {
      if (status === 'PAUSED' && waveQueue.length === 0) {
        await new Promise((r) => setTimeout(r, 40));
        continue;
      }

      const cfg = sweepConfig;
      try {
        if (status === 'RUNNING') {
          promoteQueuedTrials();
          requestMoreTrialsIfNeeded(false);
          while (
            waveQueue.length < maxInFlightWaves &&
            status === 'RUNNING' &&
            mySessionId === runSessionId
          ) {
            if (!(await trySubmitWave(cfg))) break;
          }
        }

        if (waveQueue.length === 0) {
          await new Promise((r) => setTimeout(r, 4));
          continue;
        }

        const oldest = waveQueue.shift()!;
        const batchRes = await gpu.awaitRawBatch(oldest.pending);
        for (let s = 0; s < oldest.slices.length; s++) {
          inFlightTrials.delete(oldest.slices[s].trial);
        }

        if (mySessionId !== runSessionId) break;
        consecutiveRecoveries = 0;

        const completedSet = new Set<ActiveGpuTrial>();
        processSliceResults(
          oldest.slices,
          oldest.totalTasks,
          oldest.kernelKind,
          batchRes,
          cfg,
          mySessionId,
          completedSet,
          lastBreathMs
        );

        if (completedSet.size > 0) {
          activeTrials = activeTrials.filter((t) => !completedSet.has(t));
        }
        lastBreathMs = await applyAntiFreezeGovernor(
          batchRes.dispatchMs,
          oldest.totalTasks,
          oldest.kernelKind
        );
        promoteQueuedTrials();
        requestMoreTrialsIfNeeded(completedSet.size > 0);
        emitGpuSlots(false);
      } catch (waveErr) {
        if (mySessionId !== runSessionId || (status as string) === 'IDLE') break;

        for (let i = 0; i < waveQueue.length; i++) {
          gpu?.discardPendingBatch?.(waveQueue[i].pending);
        }
        waveQueue.length = 0;
        inFlightTrials.clear();

        consecutiveRecoveries += 1;
        if (consecutiveRecoveries > MAX_CONSECUTIVE_RECOVERIES) {
          throw waveErr;
        }

        // eslint-disable-next-line no-console
        console.warn(
          `[NeuroLab GPU] WebGPU wave error (attempt ${consecutiveRecoveries}/${MAX_CONSECUTIVE_RECOVERIES}), recreating device without dropping trials:`,
          waveErr
        );
        try {
          gpu?.dispose();
        } catch {
          // Ignore dispose errors on already-lost GPU device
        }
        gpu = null;
        await new Promise((r) => setTimeout(r, 450 * consecutiveRecoveries));
        if (mySessionId !== runSessionId || (status as string) === 'IDLE') break;

        gpu = await createBestGpuEvaluator();
        // Dial back wave budget after a TDR/device-loss event so the driver stays cool & stable
        waveWeightBudget = Math.max(
          gpu.isIntegrated ? 1024 : 2560,
          Math.round(waveWeightBudget * 0.65)
        );
        maxInFlightWaves = 1;
        for (let k = 0; k < kernelBudgetScale.length; k++) {
          kernelBudgetScale[k] = Math.min(kernelBudgetScale[k], 0.72);
        }
        targetReadyTasks = Math.round(waveWeightBudget * 1.55);
        if (!gpu.submitRawBatch || !gpu.awaitRawBatch) {
          // Recovered into non-pipelined fallback (e.g. WebGL2): bounce unsupported Frontier specs cleanly and continue in runMegaBatchLoop
          if (sweepConfig) {
            const globalUnsupported =
              Boolean(sweepConfig.shapedFitness) ||
              Boolean(sweepConfig.curriculumLearning);
            const keptTrials: ActiveGpuTrial[] = [];
            const rejected: GpuQueuedTrialItem[] = [];
            for (const t of activeTrials) {
              const arch = t.spec.architecture ?? 'MLP';
              const ok =
                !globalUnsupported &&
                !hasLookaheadSensor(t.spec.inputFeatures) &&
                !t.spec.inputFeatures.includes('PIPE_TTF') &&
                t.spec.inputFeatures.length <= 6 &&
                isWebGl2BioTopologySupported(t.spec.topology, arch);
              if (ok) keptTrials.push(t);
              else {
                for (const [reqId, pv] of pendingAsyncVerifies.entries()) {
                  if (pv.trial === t) pendingAsyncVerifies.delete(reqId);
                }
                rejected.push({ trialIndex: t.trialIndex, spec: t.spec });
              }
            }
            activeTrials = keptTrials;
            const keptFeed: GpuQueuedTrialItem[] = [];
            for (const item of pendingFeedQueue) {
              const arch = item.spec.architecture ?? 'MLP';
              const ok =
                !globalUnsupported &&
                !hasLookaheadSensor(item.spec.inputFeatures) &&
                !item.spec.inputFeatures.includes('PIPE_TTF') &&
                item.spec.inputFeatures.length <= 6 &&
                isWebGl2BioTopologySupported(item.spec.topology, arch);
              if (ok) keptFeed.push(item);
              else rejected.push(item);
            }
            pendingFeedQueue = keptFeed;
            if (rejected.length > 0) {
              workerScope.postMessage({
                type: 'GPU_RETURNED_ITEMS',
                returnedItems: rejected,
              });
            }
          }
          workerScope.postMessage({
            type: 'GPU_READY',
            adapterLabel: gpu.adapterLabel,
            supportsBioKernels: Boolean(gpu.supportsBioKernels),
            supportsFullFrontier: Boolean(gpu.supportsFullFrontier),
            isIntegrated: Boolean(gpu.isIntegrated),
          });
          break;
        }
      }
    }
  } finally {
    for (let i = 0; i < waveQueue.length; i++) {
      gpu?.discardPendingBatch?.(waveQueue[i].pending);
    }
    waveQueue.length = 0;
    inFlightTrials.clear();
  }
}

async function runMegaBatchLoop(mySessionId: number): Promise<void> {
  if (loopRunning) return;
  loopRunning = true;

  try {
    if (gpu?.submitRawBatch && gpu?.awaitRawBatch) {
      await runPipelinedLoop(mySessionId);
      const currentGpu = gpu as GpuComputeEvaluator | null;
      if (
        status === 'IDLE' ||
        mySessionId !== runSessionId ||
        !currentGpu ||
        (Boolean(currentGpu.submitRawBatch) && Boolean(currentGpu.awaitRawBatch))
      ) {
        return;
      }
      // Fall through cleanly if WebGPU recovered into non-pipelined WebGL2!
    }

    while (status !== 'IDLE' && mySessionId === runSessionId && gpu && sweepConfig) {
      if (status === 'PAUSED') {
        await new Promise((r) => setTimeout(r, 40));
        continue;
      }

      promoteQueuedTrials();
      requestMoreTrialsIfNeeded(false);

      const buckets: ActiveGpuTrial[][] = Array.from({ length: NUM_KERNEL_BUCKETS }, () => []);
      let hasWork = false;
      for (let i = 0; i < activeTrials.length; i++) {
        const t = activeTrials[i];
        if (t.awaitingCpuAudit) continue;
        buckets[getTrialKernelKind(t)].push(t);
        hasWork = true;
      }

      if (!hasWork) {
        await new Promise((r) => setTimeout(r, 4));
        continue;
      }

      const cfg = sweepConfig;
      const completedSet = new Set<ActiveGpuTrial>();

      for (let k = 0; k < NUM_KERNEL_BUCKETS; k++) {
        if (buckets[k].length > 0 && mySessionId === runSessionId) {
          await runSliceGroup(buckets[k], k as GpuKernelKind, cfg, mySessionId, completedSet);
        }
      }

      if (completedSet.size > 0) {
        activeTrials = activeTrials.filter((t) => !completedSet.has(t));
      }
      promoteQueuedTrials();
      requestMoreTrialsIfNeeded(completedSet.size > 0);

      emitGpuSlots(false);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const returnedItems: GpuQueuedTrialItem[] = [
      ...activeTrials.map((t) => ({ trialIndex: t.trialIndex, spec: t.spec })),
      ...pendingFeedQueue,
    ];
    activeTrials = [];
    pendingFeedQueue = [];
    pendingAsyncVerifies.clear();
    status = 'IDLE';
    workerScope.postMessage({
      type: 'GPU_ERROR',
      message,
      returnedItems,
    });
  } finally {
    loopRunning = false;
  }
}

workerScope.onmessage = (ev: MessageEvent<GpuWorkerInbound>) => {
  const msg = ev.data;
  switch (msg.type) {
    case 'INIT_AND_START': {
      runSessionId += 1;
      const mySession = runSessionId;
      sweepConfig = msg.sweepConfig;
      useAsyncVerify = Boolean(msg.useAsyncVerify);
      targetGpuLoadPercent = Math.max(
        10,
        Math.min(100, Math.round(msg.sweepConfig.gpuLoadPercent ?? 100))
      );

      targetReadyTasks = 8192;
      maxConcurrentTrials = Math.max(8, Math.min(msg.maxConcurrentTrials, 48));

      activeTrials = [];
      pendingFeedQueue = [...msg.initialTrials];
      pendingAsyncVerifies.clear();
      pausedAtMs = 0;
      status = 'RUNNING';
      lastSlotsEmitMs = 0;
      lastNeedTrialsMs = 0;

      const boot = async () => {
        try {
          if (!gpu) {
            gpu = await createBestGpuEvaluator();
          }
          if (mySession !== runSessionId) return;
          const isDiscreteWebGpu = !gpu.isIntegrated && gpu.engine === 'WEBGPU';
          const loadScale = Math.max(0.35, targetGpuLoadPercent / 100);
          const calibratedBase = gpu.calibration?.calibratedWorkgroups
            ? gpu.calibration.calibratedWorkgroups * 64
            : gpu.isIntegrated
              ? 6400
              : 12288;
          kernelBudgetScale.fill(1.0);
          waveWeightBudget = Math.round(
            (gpu.engine === 'WEBGL2'
              ? gpu.isIntegrated
                ? 3200
                : 5400
              : calibratedBase) * loadScale
          );
          maxInFlightWaves = targetGpuLoadPercent >= 95 ? 2 : gpu.isIntegrated ? 1 : 2;
          targetReadyTasks = Math.round(
            waveWeightBudget * (maxInFlightWaves === 2 ? 2.2 : 1.55)
          );
          emaDispatchMs = gpu.isIntegrated ? 28 : isDiscreteWebGpu ? 60 : 44;
          lastCompositorBreathMs = performance.now();
          maxConcurrentTrials = Math.max(
            12,
            Math.min(
              msg.maxConcurrentTrials,
              gpu.isIntegrated ? 40 : isDiscreteWebGpu ? 120 : 80
            )
          );
          const fullFrontier = Boolean(gpu.supportsFullFrontier);
          workerScope.postMessage({
            type: 'GPU_READY',
            adapterLabel: gpu.adapterLabel,
            supportsBioKernels: Boolean(gpu.supportsBioKernels),
            supportsFullFrontier: fullFrontier,
            isIntegrated: Boolean(gpu.isIntegrated),
          });

          // Safety guard: if browser fell back to legacy WebGL2 (supportsFullFrontier === false),
          // bounce any Shaped/Curriculum/7th-sensor/Reasoning/wide-Bio initial trials back to CPU!
          if (!fullFrontier && sweepConfig && pendingFeedQueue.length > 0) {
            const globalUnsupported =
              Boolean(sweepConfig.shapedFitness) ||
              Boolean(sweepConfig.curriculumLearning);
            const kept: GpuQueuedTrialItem[] = [];
            const rejected: GpuQueuedTrialItem[] = [];
            for (let i = 0; i < pendingFeedQueue.length; i++) {
              const item = pendingFeedQueue[i];
              const arch = item.spec.architecture ?? 'MLP';
              const ok =
                !globalUnsupported &&
                !hasLookaheadSensor(item.spec.inputFeatures) &&
                !item.spec.inputFeatures.includes('PIPE_TTF') &&
                item.spec.inputFeatures.length <= 6 &&
                isWebGl2BioTopologySupported(item.spec.topology, arch);
              if (ok) kept.push(item);
              else rejected.push(item);
            }
            pendingFeedQueue = kept;
            if (rejected.length > 0) {
              workerScope.postMessage({
                type: 'GPU_RETURNED_ITEMS',
                returnedItems: rejected,
              });
            }
          }

          promoteQueuedTrials();
          emitGpuSlots(true);
          requestMoreTrialsIfNeeded(true);
          void runMegaBatchLoop(mySession);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          const returnedItems = [
            ...activeTrials.map((t) => ({
              trialIndex: t.trialIndex,
              spec: t.spec,
            })),
            ...pendingFeedQueue,
          ];
          activeTrials = [];
          pendingFeedQueue = [];
          pendingAsyncVerifies.clear();
          status = 'IDLE';
          workerScope.postMessage({
            type: 'GPU_ERROR',
            message,
            returnedItems,
          });
        }
      };

      void boot();
      break;
    }

    case 'GPU_VERIFY_RESULT': {
      const pending = pendingAsyncVerifies.get(msg.reqId);
      if (!pending) break;
      pendingAsyncVerifies.delete(msg.reqId);
      if (pending.sessionId !== runSessionId || status === 'IDLE' || !sweepConfig) {
        break;
      }

      const trial = pending.trial;
      if (!activeTrials.includes(trial)) break;

      trial.cpuVerifyMs += msg.elapsedMs;
      trial.awaitingCpuAudit = false;

      const solved = recordTrialAuditOutcome(
        trial,
        pending.brain,
        pending.failFast,
        {
          seedScores: msg.seedScores,
          minSeedScore: msg.minSeedScore,
          meanSeedScore: msg.meanSeedScore,
          verifiedPerfect: msg.verifiedPerfect,
          ticksEvaluated: msg.ticksEvaluated,
          failureAutopsy: msg.failureAutopsy,
          reasoningTelemetry: msg.reasoningTelemetry,
        }
      );

      let removeTrial = false;
      if (pending.kind === 'FINAL') {
        emitCompletedGpuTrial(
          trial,
          solved || Boolean(trial.bestAudit?.verifiedPerfect),
          pending.stoppedReason
        );
        removeTrial = true;
      } else if (solved) {
        emitCompletedGpuTrial(trial, true, 'PERFECT');
        removeTrial = true;
      } else {
        advanceTrialTrigger(trial, pending.currBest, sweepConfig);
        removeTrial = finishGenerationAndAdvanceOrStop(trial, sweepConfig);
      }

      if (removeTrial) {
        activeTrials = activeTrials.filter((t) => t !== trial);
        promoteQueuedTrials();
        requestMoreTrialsIfNeeded(true);
      }
      emitGpuSlots(false);
      break;
    }

    case 'FEED_TRIALS': {
      if (status === 'IDLE') break;
      if (msg.items.length > 0) {
        pendingFeedQueue.push(...msg.items);
        promoteQueuedTrials();
      }
      break;
    }

    case 'SET_GPU_LOAD': {
      targetGpuLoadPercent = Math.max(10, Math.min(100, Math.round(msg.gpuLoadPercent)));
      if (sweepConfig) {
        sweepConfig = { ...sweepConfig, gpuLoadPercent: targetGpuLoadPercent };
      }
      if (targetGpuLoadPercent >= 98) {
        maxInFlightWaves = 2;
      } else if (targetGpuLoadPercent <= 60) {
        maxInFlightWaves = 1;
      }
      break;
    }

    case 'PAUSE': {
      if (status === 'RUNNING') {
        status = 'PAUSED';
        pausedAtMs = performance.now();
        emitGpuSlots(true);
      }
      break;
    }

    case 'RESUME': {
      if (status === 'PAUSED') {
        const now = performance.now();
        const pausedDelta = pausedAtMs > 0 ? Math.max(0, now - pausedAtMs) : 0;
        pausedAtMs = 0;
        for (let i = 0; i < activeTrials.length; i++) {
          activeTrials[i].startedAtMs += pausedDelta;
        }
        lastSlotsEmitMs += pausedDelta;
        lastNeedTrialsMs += pausedDelta;
        lastCompositorBreathMs = now;
        status = 'RUNNING';
        emitGpuSlots(true);
        requestMoreTrialsIfNeeded(true);
      }
      break;
    }

    case 'SKIP_SLOWEST': {
      if ((status === 'RUNNING' || status === 'PAUSED') && activeTrials.length > 0) {
        let slowestIdx = 0;
        for (let i = 1; i < activeTrials.length; i++) {
          if (activeTrials[i].startedAtMs < activeTrials[slowestIdx].startedAtMs) {
            slowestIdx = i;
          }
        }
        const slowest = activeTrials.splice(slowestIdx, 1)[0];
        if (slowest) {
          emitCompletedGpuTrial(slowest, false, 'SKIPPED');
          promoteQueuedTrials();
          requestMoreTrialsIfNeeded(true);
          emitGpuSlots(true);
        }
      }
      break;
    }

    case 'RETURN_AND_STOP': {
      runSessionId += 1;
      pausedAtMs = 0;
      status = 'IDLE';
      const returnedItems: GpuQueuedTrialItem[] = [
        ...activeTrials.map((t) => ({
          trialIndex: t.trialIndex,
          spec: t.spec,
        })),
        ...pendingFeedQueue,
      ];
      activeTrials = [];
      pendingFeedQueue = [];
      pendingAsyncVerifies.clear();
      workerScope.postMessage({
        type: 'GPU_RETURNED_ITEMS',
        returnedItems,
      });
      break;
    }

    case 'STOP': {
      runSessionId += 1;
      pausedAtMs = 0;
      status = 'IDLE';
      activeTrials = [];
      pendingFeedQueue = [];
      pendingAsyncVerifies.clear();
      break;
    }
  }
};
