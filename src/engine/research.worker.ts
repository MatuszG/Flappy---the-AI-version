import {
  calculateTopologyBreakdown,
  formatTopologyLabel,
  getTrialComputeProfile,
  NeuralNetwork,
  WEIGHT_PRECISION_META,
} from './neuralNetwork';
import type { WorkerTrialPerfStats } from './perfProfiler';
import { analyzePolicyMechanism } from './policyAnalysis';
import { buildTrialSignature } from './researchStorage';
import {
  ALL_SENSOR_FEATURES,
  getInputFeatureIndices,
  isFullSensorSet,
  formatInputSubsetKey,
  formatInputSubsetLabel,
  normalizeInputFeatures,
} from './sensors';
import {
  advanceSeedEvaluator,
  auditBrainMastery,
  classifyLearningDynamic,
  createSeedEvaluatorState,
  FlappySimulation,
  resolveEnvironment,
  type SeedEvaluatorState,
} from './simulation';
import type {
  DifficultyPreset,
  EnvironmentConfig,
  EvolutionTopologyMode,
  FailureAutopsy,
  LearningAlgorithm,
  NetworkArchitecture,
  ReasoningTelemetry,
  ResearchSweepConfig,
  ResearchTrialResult,
  SensorFeatureId,
  SerializedNeuralNetwork,
  TrialStoppedReason,
  WeightPrecision,
  WorkerSlotProgress,
} from './types';

export interface TrialSpec {
  algorithm: LearningAlgorithm;
  difficulty: DifficultyPreset;
  topology: number[];
  inputFeatures: SensorFeatureId[];
  architecture?: NetworkArchitecture;
  weightPrecision?: WeightPrecision;
  populationSize: number;
  mutationRate: number;
  mutationStrength: number;
  morphogenesisMode?: 'STATIC' | 'GROWING';
  evolutionTopologyMode?: EvolutionTopologyMode;
  islandSpecies?: NetworkArchitecture[];
  curriculumLearning?: boolean;
  shapedFitness?: boolean;
  reasoningSteps?: number;
  perceptionMode?: import('./types').PerceptionMode;
}

export interface AggregatedAuditResult {
  auditId: number;
  seedScores: number[];
  minSeedScore: number;
  meanSeedScore: number;
  verifiedPerfect: boolean;
  ticksEvaluated: number;
  elapsedMs: number;
}

export type ResearchWorkerInbound =
  | {
      type: 'RUN_TRIAL';
      workerId: number;
      trialIndex: number;
      spec: TrialSpec;
      sweepConfig: ResearchSweepConfig;
      useParallelAudit: boolean;
    }
  | {
      type: 'QUEUE_TRIALS';
      workerId: number;
      items: { trialIndex: number; spec: TrialSpec }[];
      sweepConfig: ResearchSweepConfig;
      useParallelAudit: boolean;
    }
  | {
      type: 'AUDIT_RESULT';
      result: AggregatedAuditResult;
    }
  | {
      type: 'RUN_AUDIT_SEED';
      workerId: number;
      auditId: number;
      seedIndex: number;
      seed: number;
      brain: SerializedNeuralNetwork;
      difficulty: DifficultyPreset;
      targetPipeCap: number;
      customEnvironment?: EnvironmentConfig;
    }
  | {
      type: 'CANCEL_AUDIT';
      auditId: number;
    }
  | {
      type: 'SET_PARALLEL_AUDIT';
      enabled: boolean;
    }
  | {
      type: 'RUN_GPU_VERIFY';
      reqId: number;
      brain: SerializedNeuralNetwork;
      difficulty: DifficultyPreset;
      targetPipeCap: number;
      verificationSeeds: number;
      customEnvironment?: EnvironmentConfig;
      failFast: boolean;
    }
  | {
      type: 'SET_POWER_PACING';
      chunkMs: number;
      restMs: number;
      throttled?: boolean;
    }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'SKIP_TRIAL' }
  | { type: 'STOP' };

export type ResearchWorkerOutbound =
  | { type: 'SLOT_PROGRESS'; slot: WorkerSlotProgress; deltaTicks: number }
  | {
      type: 'AUDIT_REQUEST';
      workerId: number;
      auditId: number;
      brain: SerializedNeuralNetwork;
      difficulty: DifficultyPreset;
      targetPipeCap: number;
      verificationSeeds: number;
      customEnvironment?: EnvironmentConfig;
      failFast: boolean;
    }
  | {
      type: 'AUDIT_SEED_DONE';
      workerId: number;
      auditId: number;
      seedIndex: number;
      score: number;
      ticks: number;
      survivedFull: boolean;
      elapsedMs: number;
      cpuMs: number;
    }
  | {
      type: 'AUDIT_SEED_CANCELLED';
      workerId: number;
      auditId: number;
    }
  | {
      type: 'GPU_VERIFY_DONE';
      reqId: number;
      seedScores: number[];
      minSeedScore: number;
      meanSeedScore: number;
      verifiedPerfect: boolean;
      ticksEvaluated: number;
      elapsedMs: number;
      failureAutopsy: import('./types').FailureAutopsy | null;
      reasoningTelemetry: import('./types').ReasoningTelemetry | null;
    }
  | {
      type: 'TRIAL_DONE';
      workerId: number;
      trialIndex: number;
      trial: ResearchTrialResult;
      perf: WorkerTrialPerfStats;
      unreportedTicks: number;
    };

const workerScope = self as unknown as {
  postMessage: (message: ResearchWorkerOutbound) => void;
  onmessage: ((ev: MessageEvent<ResearchWorkerInbound>) => void) | null;
};

let status: 'IDLE' | 'RUNNING' | 'PAUSED' = 'IDLE';
let workerId = 0;
let trialIndex = 0;
let activeSpec: TrialSpec | null = null;
let sweepConfig: ResearchSweepConfig | null = null;
let useParallelAudit = false;
let prefetchedQueue: { trialIndex: number; spec: TrialSpec }[] = [];

let activeSim: FlappySimulation | null = null;
let activeTrialAccumulatedMs = 0;
let activeGen = 1;
let activeFramesInGen = 0;
let activeBestScore = 0;
let activeBestFitness = 0;
let bestProgressScore = 0;
let bestProgressFitness = 0;
let gensWithoutImprovement = 0;
let activeAuditTicks = 0;
let lastReportedTrialTicks = 0;
let nextAuditTrigger = 40;
let lastAuditedBrain: NeuralNetwork | null = null;
let auditedFingerprints = new Map<
  string,
  { full: boolean; verifiedPerfect: boolean }
>();
let lastProgressPostMs = 0;

let activeBestAudit: {
  seedScores: number[];
  minSeedScore: number;
  meanSeedScore: number;
  verifiedPerfect: boolean;
  truncated?: boolean;
  failureAutopsy?: FailureAutopsy | null;
  reasoningTelemetry?: ReasoningTelemetry | null;
} | null = null;
let activeBestAuditBrain: NeuralNetwork | null = null;
let activePhase: 'IDLE' | 'TRAINING' | 'AUDITING' = 'IDLE';
let activeAuditDetail: string | undefined = undefined;
let activeScoreCurve: number[] = [];

// Lightweight per-trial bottleneck counters (reported once on TRIAL_DONE)
let perfTrainCpuMs = 0;
let perfPreScreenCpuMs = 0;
let perfLocalAuditCpuMs = 0;
let perfOverheadCpuMs = 0;
let perfTrialStartedMs = 0;
let perfAuditWaitWallMs = 0;
let perfPreScreenCalls = 0;
let perfPreScreenRejects = 0;
let perfParallelAuditRequests = 0;
let perfAuditReqStartedMs = 0;
let perfAuditCacheHits = 0;
let pausedAtMs = 0;

type PendingAuditContext =
  | {
      kind: 'MID_TRIGGER';
      auditId: number;
      brain: NeuralNetwork;
      currBest: number;
      genPipeLimit: number;
      failFast: boolean;
    }
  | {
      kind: 'GEN_TIMEOUT';
      auditId: number;
      brain: NeuralNetwork;
      failFast: boolean;
    }
  | {
      kind: 'FINAL';
      auditId: number;
      brain: NeuralNetwork;
      verifiedPerfect: boolean;
      stoppedReason: TrialStoppedReason;
    };

let localAuditSeq = 0;
let pendingAudit: PendingAuditContext | null = null;

// Cooperative chunked audit seed runner (completely decoupled from trial state so
// awaiting training workers can run audit seeds at 100% CPU and cancel instantly on fail-fast!)
interface ActiveAuditSeedTask {
  workerId: number;
  auditId: number;
  seedIndex: number;
  brain: NeuralNetwork;
  state: SeedEvaluatorState;
  rawBuf: Float64Array;
  subBuf: Float64Array;
  useFullInputs: boolean;
  activeIndices: number[];
  stages: number[];
  stageIdx: number;
  startedAtMs: number;
  cpuMs: number;
}

let activeAuditSeedTask: ActiveAuditSeedTask | null = null;
let auditChunkScheduled = false;
let auditFallbackTimerId: ReturnType<typeof setTimeout> | null = null;
const auditYieldChannel =
  typeof MessageChannel !== 'undefined' ? new MessageChannel() : null;

if (auditYieldChannel) {
  auditYieldChannel.port1.onmessage = () => {
    auditChunkScheduled = false;
    runAuditSeedChunk();
  };
}

function scheduleAuditSeedChunk(): void {
  if (auditChunkScheduled || !activeAuditSeedTask) return;
  auditChunkScheduled = true;
  if (auditYieldChannel) {
    auditYieldChannel.port2.postMessage(null);
  } else {
    auditFallbackTimerId = setTimeout(() => {
      auditChunkScheduled = false;
      auditFallbackTimerId = null;
      runAuditSeedChunk();
    }, 0);
  }
}

function cancelActiveAuditSeedTask(notifyPool: boolean): void {
  const prev = activeAuditSeedTask;
  activeAuditSeedTask = null;
  auditChunkScheduled = false;
  if (auditFallbackTimerId !== null) {
    clearTimeout(auditFallbackTimerId);
    auditFallbackTimerId = null;
  }
  if (notifyPool && prev) {
    workerScope.postMessage({
      type: 'AUDIT_SEED_CANCELLED',
      workerId: prev.workerId,
      auditId: prev.auditId,
    });
  }
}

function runAuditSeedChunk(): void {
  const task = activeAuditSeedTask;
  if (!task) return;

  const chunkStart = performance.now();
  const maxSliceMs = 30;

  while (activeAuditSeedTask === task && !task.state.done) {
    const cap =
      task.stageIdx < task.stages.length
        ? task.stages[task.stageIdx]
        : task.state.targetPipeCap;
    advanceSeedEvaluator(
      task.state,
      task.brain,
      task.rawBuf,
      task.subBuf,
      task.useFullInputs,
      task.activeIndices,
      cap
    );
    task.stageIdx += 1;

    if (task.state.done || task.stageIdx >= task.stages.length) {
      break;
    }
    if (performance.now() - chunkStart >= maxSliceMs) {
      task.cpuMs += performance.now() - chunkStart;
      scheduleAuditSeedChunk();
      return;
    }
  }

  task.cpuMs += performance.now() - chunkStart;
  if (activeAuditSeedTask !== task) return;

  if (!task.state.done) {
    scheduleAuditSeedChunk();
    return;
  }

  activeAuditSeedTask = null;
  const elapsedMs = performance.now() - task.startedAtMs;
  workerScope.postMessage({
    type: 'AUDIT_SEED_DONE',
    workerId: task.workerId,
    auditId: task.auditId,
    seedIndex: task.seedIndex,
    score: task.state.score,
    ticks: task.state.frameCount,
    survivedFull: task.state.survivedFull,
    elapsedMs,
    cpuMs: task.cpuMs,
  });

  // If our own trial resumed while we finished helping with an audit seed, kick training now
  if (status === 'RUNNING' && pendingAudit === null && activeSim) {
    scheduleNextChunk();
  }
}

// Adaptive power/thermal pacing controls (updated live via SET_POWER_PACING without restarting trials)
let pacingChunkMs = 115;
let pacingRestMs = 0;
let powerThrottled = false;

// Zero-delay chunk scheduler (MessageChannel when restMs===0; cooling micro-rest timer when restMs>0)
let chunkScheduled = false;
let fallbackTimerId: ReturnType<typeof setTimeout> | null = null;
const yieldChannel =
  typeof MessageChannel !== 'undefined' ? new MessageChannel() : null;

if (yieldChannel) {
  yieldChannel.port1.onmessage = () => {
    chunkScheduled = false;
    runChunk();
  };
}

function scheduleNextChunk(): void {
  if (
    chunkScheduled ||
    status !== 'RUNNING' ||
    pendingAudit !== null ||
    powerThrottled
  ) {
    return;
  }
  chunkScheduled = true;
  if (pacingRestMs > 0) {
    fallbackTimerId = setTimeout(() => {
      chunkScheduled = false;
      fallbackTimerId = null;
      runChunk();
    }, pacingRestMs);
  } else if (yieldChannel) {
    yieldChannel.port2.postMessage(null);
  } else {
    fallbackTimerId = setTimeout(() => {
      chunkScheduled = false;
      fallbackTimerId = null;
      runChunk();
    }, 0);
  }
}

function cancelScheduledChunk(): void {
  chunkScheduled = false;
  if (fallbackTimerId !== null) {
    clearTimeout(fallbackTimerId);
    fallbackTimerId = null;
  }
}

function buildSlotProgress(): WorkerSlotProgress {
  const arch = activeSpec?.architecture ?? 'MLP';
  const evoMode = activeSpec?.evolutionTopologyMode ?? 'SINGLE_SPECIES';
  return {
    workerId,
    trialIndex,
    algorithm: activeSpec?.algorithm ?? null,
    difficulty: activeSpec?.difficulty ?? null,
    topology: activeSpec?.topology ?? [],
    inputFeatures: activeSpec?.inputFeatures,
    architecture: arch,
    evolutionTopologyMode: evoMode,
    computeProfile: getTrialComputeProfile(arch, evoMode),
    weightPrecision: activeSpec?.weightPrecision ?? 'FP32',
    populationSize: activeSpec?.populationSize ?? 0,
    generation: activeGen,
    bestScore: activeBestScore,
    phase: activePhase,
    auditDetail: activeAuditDetail,
  };
}

function consumeDeltaTicks(): number {
  const cur =
    (activeSim ? activeSim.getTotalTicksEvaluated() : 0) + activeAuditTicks;
  const delta = Math.max(0, cur - lastReportedTrialTicks);
  lastReportedTrialTicks = cur;
  return delta;
}

function emitSlotProgress(force = false): void {
  const now = performance.now();
  if (!force && now - lastProgressPostMs < 350) return;
  lastProgressPostMs = now;
  workerScope.postMessage({
    type: 'SLOT_PROGRESS',
    slot: buildSlotProgress(),
    deltaTicks: consumeDeltaTicks(),
  });
}

function checkAuditCache(
  brain: NeuralNetwork,
  failFast: boolean
): { hit: boolean; fp: string; verifiedPerfect: boolean } {
  const fp = brain.getQuantizedFingerprint();
  const cached = auditedFingerprints.get(fp);
  if (cached && (failFast || cached.full || cached.verifiedPerfect)) {
    perfAuditCacheHits += 1;
    return { hit: true, fp, verifiedPerfect: cached.verifiedPerfect };
  }
  return { hit: false, fp, verifiedPerfect: false };
}

function recordAuditOutcome(
  brain: NeuralNetwork,
  failFast: boolean,
  audit: {
    seedScores: number[];
    minSeedScore: number;
    meanSeedScore: number;
    verifiedPerfect: boolean;
    ticksEvaluated: number;
    elapsedMs: number;
    failureAutopsy?: FailureAutopsy | null;
    reasoningTelemetry?: ReasoningTelemetry | null;
  },
  precomputedFp?: string
): boolean {
  activeTrialAccumulatedMs += Math.max(0, Math.min(12000, audit.elapsedMs));
  activeAuditTicks += audit.ticksEvaluated;
  activePhase = 'TRAINING';
  activeAuditDetail = undefined;

  const isTruncated = failFast && !audit.verifiedPerfect;
  const fp = precomputedFp ?? brain.getQuantizedFingerprint();
  const prevCached = auditedFingerprints.get(fp);
  auditedFingerprints.set(fp, {
    full: Boolean(prevCached?.full) || !isTruncated,
    verifiedPerfect: Boolean(prevCached?.verifiedPerfect) || audit.verifiedPerfect,
  });

  if (
    !activeBestAudit ||
    audit.verifiedPerfect ||
    (!isTruncated && activeBestAudit.truncated && !activeBestAudit.verifiedPerfect) ||
    audit.minSeedScore > activeBestAudit.minSeedScore ||
    (audit.minSeedScore === activeBestAudit.minSeedScore &&
      audit.meanSeedScore > activeBestAudit.meanSeedScore) ||
    (!failFast &&
      audit.seedScores.length > activeBestAudit.seedScores.length &&
      !activeBestAudit.verifiedPerfect)
  ) {
    activeBestAudit = {
      seedScores: audit.seedScores,
      minSeedScore: audit.minSeedScore,
      meanSeedScore: audit.meanSeedScore,
      verifiedPerfect: audit.verifiedPerfect,
      truncated: isTruncated,
      failureAutopsy: audit.failureAutopsy ?? null,
      reasoningTelemetry: audit.reasoningTelemetry ?? null,
    };
    activeBestAuditBrain = brain.clone();
  }

  return audit.verifiedPerfect;
}

function runLocalAuditForBrain(brain: NeuralNetwork, failFast: boolean): boolean {
  if (!activeSpec || !sweepConfig) return false;
  if (failFast && brain === lastAuditedBrain && activeBestAudit !== null) {
    return activeBestAudit.verifiedPerfect;
  }
  const cache = checkAuditCache(brain, failFast);
  if (cache.hit) {
    lastAuditedBrain = brain;
    return cache.verifiedPerfect;
  }
  lastAuditedBrain = brain;

  activePhase = 'AUDITING';
  activeAuditDetail = `Local ${sweepConfig.verificationSeeds}s`;
  emitSlotProgress(true);

  const auditStart = performance.now();
  const audit = auditBrainMastery(
    brain,
    activeSpec.difficulty,
    sweepConfig.targetPipeCap,
    sweepConfig.verificationSeeds,
    sweepConfig.customEnvironment,
    failFast
  );
  const elapsedMs = performance.now() - auditStart;
  perfLocalAuditCpuMs += elapsedMs;

  return recordAuditOutcome(
    brain,
    failFast,
    {
      ...audit,
      elapsedMs,
    },
    cache.fp
  );
}

function dispatchParallelAudit(
  ctx: PendingAuditContext,
  failFast: boolean
): boolean {
  if (!activeSpec || !sweepConfig) return false;

  const cache = checkAuditCache(ctx.brain, failFast);
  if (cache.hit) {
    lastAuditedBrain = ctx.brain;
    return false;
  }

  // Fast local 64-pipe lockstep pre-screen across ALL unseen seeds before IPC fan-out.
  // Catches 90%+ of overfitted candidates in <1.5ms with zero serialization or main-thread traffic!
  if (failFast && sweepConfig.targetPipeCap > 120) {
    const preCap = Math.min(64, sweepConfig.targetPipeCap);
    const preStart = performance.now();
    const pre = auditBrainMastery(
      ctx.brain,
      activeSpec.difficulty,
      preCap,
      sweepConfig.verificationSeeds,
      sweepConfig.customEnvironment,
      true
    );
    const preElapsed = performance.now() - preStart;
    perfPreScreenCalls += 1;
    perfPreScreenCpuMs += preElapsed;
    if (!pre.verifiedPerfect) {
      perfPreScreenRejects += 1;
      recordAuditOutcome(
        ctx.brain,
        true,
        {
          ...pre,
          verifiedPerfect: false,
          elapsedMs: preElapsed,
        },
        cache.fp
      );
      return false;
    }
  }

  pendingAudit = ctx;
  perfParallelAuditRequests += 1;
  perfAuditReqStartedMs = performance.now();
  lastAuditedBrain = ctx.brain;
  activePhase = 'AUDITING';
  activeAuditDetail = `Fan-out ${sweepConfig.verificationSeeds}s`;
  emitSlotProgress(true);

  workerScope.postMessage({
    type: 'AUDIT_REQUEST',
    workerId,
    auditId: ctx.auditId,
    brain: ctx.brain.serialize(),
    difficulty: activeSpec.difficulty,
    targetPipeCap: sweepConfig.targetPipeCap,
    verificationSeeds: sweepConfig.verificationSeeds,
    customEnvironment: sweepConfig.customEnvironment,
    failFast,
  });
  return true;
}

function updateStagnationProgress(): boolean {
  if (!sweepConfig || sweepConfig.stagnationLimit === null) return false;
  if (
    activeBestScore > bestProgressScore ||
    activeBestFitness > bestProgressFitness * 1.03 + 2
  ) {
    bestProgressScore = Math.max(bestProgressScore, activeBestScore);
    bestProgressFitness = Math.max(bestProgressFitness, activeBestFitness);
    gensWithoutImprovement = 0;
    return false;
  }
  gensWithoutImprovement += 1;
  return activeGen >= 15 && gensWithoutImprovement >= sweepConfig.stagnationLimit;
}

function emitCompletedTrial(
  verifiedPerfect: boolean,
  stoppedReason: TrialStoppedReason
): void {
  if (!activeSim || !activeSpec || !sweepConfig) return;
  const finalizeStart = performance.now();
  cancelScheduledChunk();
  pendingAudit = null;

  const spec = activeSpec;
  const cfg = sweepConfig;
  const stats = activeSim.getFastStats();
  const cleanInputs = normalizeInputFeatures(spec.inputFeatures);
  const inputCount = cleanInputs.length;
  const arch = spec.architecture ?? 'MLP';
  const prec = spec.weightPrecision ?? 'FP32';
  const breakdown = calculateTopologyBreakdown(spec.topology, inputCount, 1, arch);
  const topoLabel = formatTopologyLabel(spec.topology, inputCount);
  const bitsPerParam = WEIGHT_PRECISION_META[prec].bitsPerParam;
  const totalBits = Math.max(1, Math.round(breakdown.parameterCount * bitsPerParam));

  const audit = activeBestAudit;

  const bestTrainingScore = Math.max(
    activeBestScore,
    stats.allTimeBestScore,
    stats.currentBestScore
  );
  const finalMinSeed = audit ? audit.minSeedScore : bestTrainingScore;
  const finalMeanSeed = audit ? audit.meanSeedScore : bestTrainingScore;
  const isPerfect = verifiedPerfect || Boolean(audit?.verifiedPerfect);
  const finalReason: TrialStoppedReason = isPerfect ? 'PERFECT' : stoppedReason;

  const bestFitness = Math.max(activeBestFitness, stats.lastBestFitness);

  const curve = [...activeScoreCurve];
  if (curve.length < activeGen) {
    curve.push(Math.max(stats.currentBestScore, finalMinSeed));
  }

  const durationMs = Math.max(1, Math.round(activeTrialAccumulatedMs));
  const trainingTicks = activeSim.getTotalTicksEvaluated();
  const auditTicks = activeAuditTicks;
  const totalTicks = trainingTicks + auditTicks;
  const ticksPerSecond = Math.round((totalTicks / durationMs) * 1000);
  const birdEpisodesEvaluated = activeGen * spec.populationSize;
  const trainingSynapticOps =
    trainingTicks * Math.max(1, breakdown.parameterCount);
  // Hardware-independent canonical compute time (ms at fixed 10M synaptic-ops/sec reference)
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
    activeBestAuditBrain?.serialize() ?? activeSim.getChampionBrain();
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
  const evoMode: EvolutionTopologyMode =
    spec.evolutionTopologyMode ?? cfg.evolutionTopologyMode ?? 'SINGLE_SPECIES';
  const trialPerceptionMode =
    arch === 'DROSOPHILA_CONNECTOME' || arch === 'DECOUPLED_FLY_CORTEX'
      ? (spec.perceptionMode ?? cfg.perceptionMode ?? 'GEOMETRIC_LAB')
      : undefined;
  const morphSummary = activeSim.getMorphogenesisSummary();
  const islandSummary = activeSim.getIslandSummary();
  const computeStats = activeSim.getComputeStats();
  const meanFlops = computeStats.meanFlopsPerFrame;
  const computeEfficiencyScore =
    meanFlops > 0
      ? Number((finalMinSeed / (meanFlops / 100)).toFixed(2))
      : 0;
  const trialSignature = buildTrialSignature({
    algorithm: spec.algorithm,
    difficulty: spec.difficulty,
    topology: spec.topology,
    inputFeatures: cleanInputs,
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

  const inputKey = formatInputSubsetKey(cleanInputs);
  const inputSetLabel = formatInputSubsetLabel(cleanInputs);
  const variantSuffix = `${arch !== 'MLP' ? `-${arch}` : ''}${prec !== 'FP32' ? `-${prec}` : ''}${trialCurr ? '-curr' : ''}${trialShape ? '-shape' : ''}${reasoningStepsOpt !== undefined && reasoningStepsOpt !== 3 ? `-k${reasoningStepsOpt}` : ''}${trialMorphMode === 'GROWING' ? '-morph' : ''}${evoMode === 'ISLAND_SPECIATION' ? '-isl' : ''}${trialPerceptionMode === 'COMPOUND_EYE_PIXELS' ? '-eye' : ''}`;

  const result: ResearchTrialResult = {
    id: `trial-${trialIndex}-${spec.algorithm}-${spec.difficulty}-${inputCount}in-${inputKey}-${spec.topology.join('x') || 'lin'}${variantSuffix}-p${spec.populationSize}-m${spec.mutationRate}-s${spec.mutationStrength}`,
    trialSignature,
    algorithm: spec.algorithm,
    difficulty: spec.difficulty,
    topology: [...spec.topology],
    topologyLabel: topoLabel,
    inputFeatures: cleanInputs,
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
    islandSummary,
    bestScore: effectiveScore,
    minSeedScore: finalMinSeed,
    meanSeedScore: finalMeanSeed,
    seedScores: audit?.seedScores ?? [bestTrainingScore],
    verifiedPerfect: isPerfect,
    stoppedReason: finalReason,
    bestFitness: Number(bestFitness.toFixed(1)),
    finalAvgScore: stats.lastAvgScore,
    generationsRun: activeGen,
    solved: isPerfect,
    generationsToSolve: isPerfect ? activeGen : null,
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

  const finishedWorkerId = workerId;
  const finishedTrialIndex = trialIndex;
  const nowEnd = pausedAtMs > 0 ? pausedAtMs : performance.now();
  perfOverheadCpuMs += Math.max(0, nowEnd - finalizeStart);
  const trialWallMs =
    perfTrialStartedMs > 0 ? Math.max(0, nowEnd - perfTrialStartedMs) : 0;
  const trialPerf: WorkerTrialPerfStats = {
    trainCpuMs: perfTrainCpuMs,
    preScreenCpuMs: perfPreScreenCpuMs,
    localAuditCpuMs: perfLocalAuditCpuMs,
    overheadCpuMs: perfOverheadCpuMs,
    trialWallMs,
    auditWaitWallMs: perfAuditWaitWallMs,
    preScreenCalls: perfPreScreenCalls,
    preScreenRejects: perfPreScreenRejects,
    parallelAuditRequests: perfParallelAuditRequests,
    trainingTicks,
    auditTicks,
    auditCacheHits: perfAuditCacheHits,
  };

  const unreportedTicks = consumeDeltaTicks();

  const wasPaused = status === 'PAUSED';

  status = 'IDLE';
  activePhase = 'IDLE';
  activeAuditDetail = undefined;
  activeSim = null;
  activeSpec = null;
  activeBestAuditBrain = null;
  lastAuditedBrain = null;
  auditedFingerprints.clear();

  workerScope.postMessage({
    type: 'TRIAL_DONE',
    workerId: finishedWorkerId,
    trialIndex: finishedTrialIndex,
    trial: result,
    perf: trialPerf,
    unreportedTicks,
  });

  // Zero-stall prefetch handoff: immediately start next buffered trial without waiting for main thread!
  if (!wasPaused && prefetchedQueue.length > 0 && sweepConfig) {
    const nextItem = prefetchedQueue.shift()!;
    startTrialNow(
      finishedWorkerId,
      nextItem.trialIndex,
      nextItem.spec,
      sweepConfig,
      useParallelAudit
    );
  }
}

function finalizeCurrentTrial(
  verifiedPerfect: boolean,
  stoppedReason: TrialStoppedReason,
  preferChampion = false,
  allowAsyncFinalAudit = true
): void {
  if (!activeSim || !activeSpec || !sweepConfig) return;
  cancelScheduledChunk();

  const cfg = sweepConfig;
  const audit = activeBestAudit;
  const needsFullAudit =
    !audit ||
    (!audit.verifiedPerfect &&
      (Boolean(audit.truncated) || audit.seedScores.length < cfg.verificationSeeds));

  if (needsFullAudit) {
    const champ =
      activeBestAuditBrain ??
      (preferChampion
        ? activeSim.getChampionNetworkInstance()
        : activeSim.getGenerationLeaderNetworkInstance() ??
          activeSim.getChampionNetworkInstance());
    if (champ) {
      if (allowAsyncFinalAudit && useParallelAudit && cfg.verificationSeeds > 1) {
        const auditId = ++localAuditSeq;
        const dispatched = dispatchParallelAudit(
          {
            kind: 'FINAL',
            auditId,
            brain: champ.clone(),
            verifiedPerfect,
            stoppedReason,
          },
          false
        );
        if (dispatched) return;
      } else {
        runLocalAuditForBrain(champ, false);
      }
    }
  }

  emitCompletedTrial(verifiedPerfect, stoppedReason);
}

function completeGenTimeoutStep(): void {
  if (!activeSim || !sweepConfig) return;
  const maxGens = sweepConfig.maxGenerations;

  if (updateStagnationProgress()) {
    finalizeCurrentTrial(false, 'STAGNATED', false);
    return;
  }

  if (maxGens !== null && activeGen >= maxGens) {
    finalizeCurrentTrial(false, 'MAX_GENS', false);
    return;
  }

  const evolveStart = performance.now();
  activeSim.forceAdvanceGeneration();
  const evolveElapsed = performance.now() - evolveStart;
  activeTrialAccumulatedMs += evolveElapsed;
  perfTrainCpuMs += evolveElapsed;
  const postStats = activeSim.getFastStats();
  activeScoreCurve.push(postStats.lastBestScore);
  if (postStats.lastBestFitness > activeBestFitness) {
    activeBestFitness = postStats.lastBestFitness;
  }
  activeGen = postStats.generation;
  activeFramesInGen = 0;

  if (status === 'RUNNING') {
    emitSlotProgress(false);
    scheduleNextChunk();
  }
}

function advanceTriggerThreshold(currBest: number, genPipeLimit: number): void {
  if (currBest >= genPipeLimit) {
    nextAuditTrigger = currBest + 50;
  } else {
    nextAuditTrigger = Math.min(
      genPipeLimit,
      Math.max(currBest + 40, Math.round(currBest * 1.4))
    );
  }
}

function handleParallelAuditResult(res: AggregatedAuditResult): void {
  if (!pendingAudit || pendingAudit.auditId !== res.auditId) return;
  const ctx = pendingAudit;
  pendingAudit = null;
  if (perfAuditReqStartedMs > 0) {
    const endAuditMs = pausedAtMs > 0 ? pausedAtMs : performance.now();
    perfAuditWaitWallMs += Math.max(0, endAuditMs - perfAuditReqStartedMs);
    perfAuditReqStartedMs = 0;
  }

  const isFinal = ctx.kind === 'FINAL';
  const solved = recordAuditOutcome(ctx.brain, !isFinal, res);

  if (ctx.kind === 'FINAL') {
    emitCompletedTrial(ctx.verifiedPerfect || solved, ctx.stoppedReason);
    return;
  }

  if (solved) {
    emitCompletedTrial(true, 'PERFECT');
    return;
  }

  if (ctx.kind === 'MID_TRIGGER') {
    advanceTriggerThreshold(ctx.currBest, ctx.genPipeLimit);
    if (status === 'RUNNING') {
      emitSlotProgress(false);
      scheduleNextChunk();
    }
    return;
  }

  if (ctx.kind === 'GEN_TIMEOUT') {
    completeGenTimeoutStep();
  }
}

function runChunk(): void {
  if (
    status !== 'RUNNING' ||
    !activeSim ||
    !activeSpec ||
    !sweepConfig ||
    pendingAudit !== null ||
    powerThrottled
  ) {
    return;
  }

  const spec = activeSpec;
  const cfg = sweepConfig;
  const env = resolveEnvironment(spec.difficulty, cfg.customEnvironment);
  const chunkStart = performance.now();
  const maxChunkMs = pacingChunkMs;

  const genPipeLimit = Math.min(cfg.targetPipeCap, 160);
  const maxFramesPerGen =
    (genPipeLimit + 18) * Math.round(env.spawnFrames * 1.25 + 14);
  const maxGens = cfg.maxGenerations; // null => Unlimited
  const parallelEnabled = useParallelAudit && cfg.verificationSeeds > 1;

  let steps = 0;

  while (status === 'RUNNING' && activeSim) {
    const batch = activeSim.stepHeadlessBatch(
      96,
      maxFramesPerGen,
      activeFramesInGen,
      nextAuditTrigger
    );
    activeFramesInGen += batch.framesStepped;
    steps += batch.framesStepped;

    if (batch.genAdvanced || batch.auditTriggered || batch.genTimedOut) {
      const stats = activeSim.getFastStats();

      if (batch.genAdvanced && stats.generation > activeGen) {
        activeScoreCurve.push(stats.lastBestScore);
        if (stats.lastBestFitness > activeBestFitness) {
          activeBestFitness = stats.lastBestFitness;
        }

        if (updateStagnationProgress()) {
          const elapsed = Math.max(0, Math.min(350, performance.now() - chunkStart));
          activeTrialAccumulatedMs += elapsed;
          perfTrainCpuMs += elapsed;
          finalizeCurrentTrial(false, 'STAGNATED', true);
          return;
        }

        activeGen = stats.generation;
        activeFramesInGen = 0;

        if (maxGens !== null && activeGen > maxGens) {
          activeGen = maxGens;
          const elapsed = Math.max(0, Math.min(350, performance.now() - chunkStart));
          activeTrialAccumulatedMs += elapsed;
          perfTrainCpuMs += elapsed;
          finalizeCurrentTrial(false, 'MAX_GENS', true);
          return;
        }
      }

      const currBest = Math.max(stats.allTimeBestScore, stats.currentBestScore);
      if (currBest > activeBestScore) {
        activeBestScore = currBest;
      }

      if (currBest >= nextAuditTrigger) {
        const champ = activeSim.getChampionNetworkInstance();
        if (champ && !(champ === lastAuditedBrain && activeBestAudit !== null)) {
          const chunkElapsed = Math.max(0, Math.min(350, performance.now() - chunkStart));
          activeTrialAccumulatedMs += chunkElapsed;
          perfTrainCpuMs += chunkElapsed;

          if (parallelEnabled) {
            const dispatched = dispatchParallelAudit(
              {
                kind: 'MID_TRIGGER',
                auditId: ++localAuditSeq,
                brain: champ.clone(),
                currBest,
                genPipeLimit,
                failFast: true,
              },
              true
            );
            if (dispatched) return;
            advanceTriggerThreshold(currBest, genPipeLimit);
            emitSlotProgress(false);
            scheduleNextChunk();
            return;
          }

          const solved = runLocalAuditForBrain(champ, true);
          if (solved) {
            emitCompletedTrial(true, 'PERFECT');
            return;
          }
          advanceTriggerThreshold(currBest, genPipeLimit);
          emitSlotProgress(false);
          scheduleNextChunk();
          return;
        }
        advanceTriggerThreshold(currBest, genPipeLimit);
      }

      if (batch.genTimedOut || activeFramesInGen >= maxFramesPerGen) {
        const chunkElapsed = Math.max(0, Math.min(350, performance.now() - chunkStart));
        activeTrialAccumulatedMs += chunkElapsed;
        perfTrainCpuMs += chunkElapsed;

        const leaderBrain = activeSim.getGenerationLeaderNetworkInstance();
        if (leaderBrain && !(leaderBrain === lastAuditedBrain && activeBestAudit !== null)) {
          if (parallelEnabled) {
            const dispatched = dispatchParallelAudit(
              {
                kind: 'GEN_TIMEOUT',
                auditId: ++localAuditSeq,
                brain: leaderBrain.clone(),
                failFast: true,
              },
              true
            );
            if (dispatched) return;
          } else {
            const solved = runLocalAuditForBrain(leaderBrain, true);
            if (solved) {
              emitCompletedTrial(true, 'PERFECT');
              return;
            }
          }
        }

        completeGenTimeoutStep();
        return;
      }
    }

    if (performance.now() - chunkStart >= maxChunkMs) {
      break;
    }
  }

  // Accumulate active CPU time only (clamped to <=350ms per chunk to eliminate sleep spikes)
  const chunkElapsed = Math.max(0, Math.min(350, performance.now() - chunkStart));
  activeTrialAccumulatedMs += chunkElapsed;
  perfTrainCpuMs += chunkElapsed;

  if (status === 'RUNNING') {
    emitSlotProgress(false);
    scheduleNextChunk();
  }
}

function startTrialNow(
  wId: number,
  tIdx: number,
  spec: TrialSpec,
  cfg: ResearchSweepConfig,
  parallelAudit: boolean
): void {
  const initStart = performance.now();
  cancelScheduledChunk();
  pendingAudit = null;
  workerId = wId;
  trialIndex = tIdx;
  activeSpec = spec;
  sweepConfig = cfg;
  useParallelAudit = parallelAudit;

  activeTrialAccumulatedMs = 0;
  activeGen = 1;
  activeFramesInGen = 0;
  activeBestScore = 0;
  activeBestFitness = 0;
  bestProgressScore = 0;
  bestProgressFitness = 0;
  gensWithoutImprovement = 0;
  activeAuditTicks = 0;
  lastReportedTrialTicks = 0;
  activeBestAudit = null;
  activeBestAuditBrain = null;
  lastAuditedBrain = null;
  auditedFingerprints.clear();
  activePhase = 'TRAINING';
  activeAuditDetail = undefined;
  nextAuditTrigger = Math.min(cfg.targetPipeCap, 40);
  activeScoreCurve = [];
  lastProgressPostMs = 0;

  perfTrainCpuMs = 0;
  perfPreScreenCpuMs = 0;
  perfLocalAuditCpuMs = 0;
  perfOverheadCpuMs = 0;
  perfTrialStartedMs = initStart;
  perfAuditWaitWallMs = 0;
  perfPreScreenCalls = 0;
  perfPreScreenRejects = 0;
  perfParallelAuditRequests = 0;
  perfAuditReqStartedMs = 0;
  perfAuditCacheHits = 0;
  pausedAtMs = 0;

  const cleanInputs = normalizeInputFeatures(spec.inputFeatures);
  const totalHidden = spec.topology.reduce((a, b) => a + b, 0);
  const curriculumGens =
    cfg.maxGenerations !== null
      ? Math.max(8, Math.min(24, Math.round(cfg.maxGenerations * 0.4)))
      : 18;
  activeSim = new FlappySimulation({
    algorithm: spec.algorithm,
    populationSize: spec.populationSize,
    mutationRate: spec.mutationRate,
    mutationStrength: spec.mutationStrength,
    elitismCount: Math.max(2, Math.round(spec.populationSize * 0.07)),
    hiddenNodes:
      spec.topology.length === 1 ? spec.topology[0] : totalHidden,
    hiddenLayers: spec.topology,
    inputFeatures: cleanInputs,
    architecture: spec.architecture ?? 'MLP',
    weightPrecision: spec.weightPrecision ?? 'FP32',
    difficulty: spec.difficulty,
    customEnvironment: cfg.customEnvironment,
    curriculumLearning: spec.curriculumLearning ?? Boolean(cfg.curriculumLearning),
    curriculumGenerations: curriculumGens,
    shapedFitness: spec.shapedFitness ?? Boolean(cfg.shapedFitness),
    reasoningSteps: spec.reasoningSteps ?? cfg.reasoningSteps,
    morphogenesis: spec.morphogenesisMode === 'GROWING',
    morphogenesisConfig: cfg.morphogenesisConfig,
    evolutionTopologyMode: spec.evolutionTopologyMode ?? cfg.evolutionTopologyMode,
    islandSpecies: spec.islandSpecies ?? cfg.islandSpecies,
    perceptionMode: spec.perceptionMode ?? cfg.perceptionMode,
    opticalNoiseLevel: cfg.opticalNoiseLevel,
    nonStationaryAnomalies: cfg.nonStationaryAnomalies,
    onlinePlasticity: cfg.onlinePlasticity,
  });

  const initElapsed = performance.now() - initStart;
  activeTrialAccumulatedMs += initElapsed;
  perfTrainCpuMs += initElapsed;

  status = 'RUNNING';
  emitSlotProgress(true);
  scheduleNextChunk();
}

workerScope.onmessage = (ev: MessageEvent<ResearchWorkerInbound>) => {
  const msg = ev.data;
  switch (msg.type) {
    case 'RUN_AUDIT_SEED': {
      // Cooperative chunked parallel seed evaluation (runs on audit helpers AND waiting training workers!)
      cancelActiveAuditSeedTask(false);
      const brain = NeuralNetwork.deserialize(msg.brain);
      const state = createSeedEvaluatorState(
        msg.difficulty,
        msg.targetPipeCap,
        msg.seed,
        msg.customEnvironment
      );
      const rawBuf = new Float64Array(ALL_SENSOR_FEATURES.length);
      const useFullInputs =
        brain.inputNodes === ALL_SENSOR_FEATURES.length &&
        isFullSensorSet(brain.inputFeatures);
      const activeIndices = useFullInputs
        ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
        : getInputFeatureIndices(brain.inputFeatures);
      const subBuf = useFullInputs ? rawBuf : new Float64Array(brain.inputNodes);

      const stages: number[] = [];
      for (const s of [128, 384, 1024, 2500, 5000, 7500]) {
        if (s < msg.targetPipeCap) stages.push(s);
      }
      stages.push(msg.targetPipeCap);

      activeAuditSeedTask = {
        workerId: msg.workerId,
        auditId: msg.auditId,
        seedIndex: msg.seedIndex,
        brain,
        state,
        rawBuf,
        subBuf,
        useFullInputs,
        activeIndices,
        stages,
        stageIdx: 0,
        startedAtMs: performance.now(),
        cpuMs: 0,
      };
      runAuditSeedChunk();
      break;
    }
    case 'CANCEL_AUDIT': {
      if (activeAuditSeedTask && activeAuditSeedTask.auditId === msg.auditId) {
        cancelActiveAuditSeedTask(true);
      }
      break;
    }
    case 'RUN_GPU_VERIFY': {
      const t0 = performance.now();
      const brain = NeuralNetwork.deserialize(msg.brain);
      const audit = auditBrainMastery(
        brain,
        msg.difficulty,
        msg.targetPipeCap,
        msg.verificationSeeds,
        msg.customEnvironment,
        msg.failFast
      );
      const elapsedMs = performance.now() - t0;
      workerScope.postMessage({
        type: 'GPU_VERIFY_DONE',
        reqId: msg.reqId,
        seedScores: audit.seedScores,
        minSeedScore: audit.minSeedScore,
        meanSeedScore: audit.meanSeedScore,
        verifiedPerfect: audit.verifiedPerfect,
        ticksEvaluated: audit.ticksEvaluated,
        elapsedMs,
        failureAutopsy: audit.failureAutopsy ?? null,
        reasoningTelemetry: audit.reasoningTelemetry ?? null,
      });
      break;
    }
    case 'SET_PARALLEL_AUDIT': {
      useParallelAudit = msg.enabled;
      break;
    }
    case 'SET_POWER_PACING': {
      pacingChunkMs = Math.max(12, Math.min(200, Math.round(msg.chunkMs)));
      pacingRestMs = Math.max(0, Math.min(100, Math.round(msg.restMs)));
      const wasThrottled = powerThrottled;
      if (msg.throttled !== undefined) {
        powerThrottled = msg.throttled;
      }
      if (powerThrottled) {
        cancelScheduledChunk();
      } else if (wasThrottled && status === 'RUNNING' && activeSim && pendingAudit === null) {
        scheduleNextChunk();
      }
      break;
    }
    case 'AUDIT_RESULT': {
      handleParallelAuditResult(msg.result);
      break;
    }
    case 'RUN_TRIAL': {
      startTrialNow(
        msg.workerId,
        msg.trialIndex,
        msg.spec,
        msg.sweepConfig,
        msg.useParallelAudit
      );
      break;
    }
    case 'QUEUE_TRIALS': {
      workerId = msg.workerId;
      sweepConfig = msg.sweepConfig;
      useParallelAudit = msg.useParallelAudit;
      if (msg.items.length > 0) {
        prefetchedQueue.push(...msg.items);
      }
      if (status === 'IDLE' && prefetchedQueue.length > 0 && sweepConfig) {
        const nextItem = prefetchedQueue.shift()!;
        startTrialNow(
          workerId,
          nextItem.trialIndex,
          nextItem.spec,
          sweepConfig,
          useParallelAudit
        );
      }
      break;
    }
    case 'PAUSE': {
      if (status === 'RUNNING') {
        status = 'PAUSED';
        pausedAtMs = performance.now();
        cancelScheduledChunk();
        emitSlotProgress(true);
      }
      break;
    }
    case 'RESUME': {
      if (status === 'PAUSED' && activeSim) {
        const now = performance.now();
        const pausedDelta = pausedAtMs > 0 ? Math.max(0, now - pausedAtMs) : 0;
        pausedAtMs = 0;
        if (perfTrialStartedMs > 0) perfTrialStartedMs += pausedDelta;
        if (perfAuditReqStartedMs > 0) perfAuditReqStartedMs += pausedDelta;
        status = 'RUNNING';
        emitSlotProgress(true);
        if (pendingAudit === null) {
          scheduleNextChunk();
        }
      } else if (status === 'IDLE' && prefetchedQueue.length > 0 && sweepConfig) {
        pausedAtMs = 0;
        const nextItem = prefetchedQueue.shift()!;
        startTrialNow(
          workerId,
          nextItem.trialIndex,
          nextItem.spec,
          sweepConfig,
          useParallelAudit
        );
      }
      break;
    }
    case 'SKIP_TRIAL': {
      if ((status === 'RUNNING' || status === 'PAUSED') && activeSim) {
        pendingAudit = null;
        finalizeCurrentTrial(false, 'SKIPPED', true, false);
      }
      break;
    }
    case 'STOP': {
      cancelScheduledChunk();
      cancelActiveAuditSeedTask(false);
      powerThrottled = false;
      pausedAtMs = 0;
      pendingAudit = null;
      prefetchedQueue = [];
      status = 'IDLE';
      activePhase = 'IDLE';
      activeAuditDetail = undefined;
      activeSim = null;
      activeSpec = null;
      activeBestAuditBrain = null;
      lastAuditedBrain = null;
      auditedFingerprints.clear();
      break;
    }
  }
};
