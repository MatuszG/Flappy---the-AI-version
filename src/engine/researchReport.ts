import { SENSOR_NAMES } from './policyAnalysis';
import {
  ALL_ARCHITECTURES,
  ALL_WEIGHT_PRECISIONS,
  ARCHITECTURE_META,
  calculateParameterCount,
  calculateTopologyBreakdown,
  estimateArchitectureFlops,
  formatTopologyLabel,
  getTrialComputeProfile,
  normalizeHiddenLayers,
  WEIGHT_PRECISION_META,
} from './neuralNetwork';
import {
  CORE_DIFFICULTIES,
  normalizeDifficultyPreset,
  verifyScenarioSolvability,
} from './physics';
import {
  ALL_SENSOR_FEATURES,
  CLASSIC_5_SENSOR_FEATURES,
  formatInputSubsetKey,
  formatInputSubsetLabel,
  normalizeInputFeatures,
  SENSOR_METADATA,
} from './sensors';
import { resolveEnvironment } from './simulation';
import { getAllActiveTopologies } from './smartPrune';
import type {
  ComputeProfileKind,
  DifficultyPreset,
  FailureCause,
  LearningAlgorithm,
  LearningDynamicKind,
  NetworkArchitecture,
  ResearchSweepConfig,
  ResearchTrialResult,
  ScenarioSolvabilityProof,
  SensorFeatureId,
  WeightPrecision,
} from './types';

export const ALGORITHM_LABELS: Record<LearningAlgorithm, string> = {
  GA: 'Genetic Algorithm (GA)',
  NATURAL_ES: 'Natural ES (Antithetic)',
  ADAM_ES: 'Adam-NES (Momentum ES)',
  ADAPTIVE_ES: 'Adaptive (1+λ) ES',
  CEM: 'Cross-Entropy Method (CEM)',
  DE: 'Differential Evolution (DE)',
  PSO: 'Particle Swarm (PSO)',
  CMA_HYBRID: 'Neuro-CMA Hybrid (Custom)',
};

export const ALGORITHM_SHORT_LABELS: Record<LearningAlgorithm, string> = {
  GA: 'GA',
  NATURAL_ES: 'Natural ES',
  ADAM_ES: 'Adam-ES',
  ADAPTIVE_ES: 'Adaptive ES',
  CEM: 'CEM',
  DE: 'Diff. Evol.',
  PSO: 'PSO',
  CMA_HYBRID: 'Neuro-CMA',
};

const ARCH_DIGEST_SHORT: Record<NetworkArchitecture, string> = {
  MLP: 'MLP',
  RESIDUAL_SKIP: 'Skip',
  LTC_FLY: 'LTC',
  NEUROCHEM_GATE: 'Chem',
  SYNAPTIC_STP: 'STP',
  LOOPED_REASONER: 'Loop',
  PONDER_ACT: 'Ponder',
  SELECTIVE_SSM: 'MinGRU',
  LATENT_ROLLOUT: 'Rollout',
  HYBRID_MOE: 'Hybrid',
  DROSOPHILA_CONNECTOME: 'Drosophila',
  DECOUPLED_FLY_CORTEX: 'FlyCortex',
};

const PREC_DIGEST_SHORT: Record<WeightPrecision, string> = {
  FP32: 'FP32',
  FP16: 'FP16',
  INT8: 'INT8',
  INT4: 'INT4',
  TERNARY: '1.58b',
  BINARY: '1b',
};

function formatArchPrecTag(r: ResearchTrialResult): string {
  const arch = ARCH_DIGEST_SHORT[r.architecture ?? 'MLP'] ?? 'MLP';
  const kSuffix =
    (r.architecture === 'LOOPED_REASONER' || r.architecture === 'PONDER_ACT') &&
    r.reasoningSteps
      ? `(K${r.reasoningSteps})`
      : '';
  const prec = PREC_DIGEST_SHORT[r.weightPrecision ?? 'FP32'] ?? 'FP32';
  return `${arch}${kSuffix}/${prec}`;
}

const DYNAMIC_SCENARIOS = new Set<DifficultyPreset>([
  'INSANE',
  'VARIABLE_SPEED',
  'DYNAMIC_GAPS',
  'MOVING_GAPS',
  'MOVING_GUSTS',
  'HEAVY_GRAVITY',
  'GUST_CHAOS',
  'TURBULENCE_EXTREME',
  'CUSTOM',
]);

export function getTrialComputeMs(r: ResearchTrialResult): number {
  if (
    typeof r.normalizedComputeMs === 'number' &&
    Number.isFinite(r.normalizedComputeMs)
  ) {
    return r.normalizedComputeMs;
  }
  const ops =
    r.trainingSynapticOps ??
    (r.trainingTicksEvaluated ?? r.totalTicksEvaluated) *
      Math.max(1, r.parameterCount);
  return Number((ops / 10000).toFixed(1));
}

export function getTrialEpisodes(r: ResearchTrialResult): number {
  return r.birdEpisodesEvaluated ?? r.generationsRun * r.populationSize;
}

export function estimateLlmTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export interface DifficultyFinding {
  difficulty: DifficultyPreset;
  bestTrial: ResearchTrialResult | null;
  minimumViableTrial: ResearchTrialResult | null;
  minimumPerfectTrial: ResearchTrialResult | null;
  perfectCount: number;
  totalCount: number;
  meanMinSeedScore: number;
  totalComputeMs: number;
  computeSharePct: number;
}

export interface AlgorithmFinding {
  algorithm: LearningAlgorithm;
  trialCount: number;
  perfectCount: number;
  perfectRate: number;
  solvedRegimeTrials: number;
  solvedRegimePerfectRate: number | null;
  staticTrials: number;
  dynamicTrials: number;
  staticPerfectRate: number | null;
  dynamicPerfectRate: number | null;
  meanMinSeedScore: number;
  avgTimeToPerfectionMs: number | null;
  avgComputeMsToPerfection: number | null;
  avgEpisodesToPerfection: number | null;
  avgGenerationsToPerfection: number | null;
  avgTicksPerSecond: number;
}

export interface TopologyFinding {
  topologyLabel: string;
  topology: number[];
  depth: number;
  maxWidth: number;
  hiddenNeuronCount: number;
  weightCount: number;
  biasCount: number;
  parameterCount: number;
  trialCount: number;
  perfectCount: number;
  perfectRate: number;
  meanMinSeedScore: number;
  bestMinSeedScore: number;
  avgTimeToPerfectionMs: number | null;
  avgComputeMsToPerfection: number | null;
  avgEpisodesToPerfection: number | null;
  maxDensity: number;
}

export interface InputSetFinding {
  inputSetKey: string;
  inputSetLabel: string;
  inputCount: number;
  features: SensorFeatureId[];
  hasPipeVy: boolean;
  trialCount: number;
  perfectCount: number;
  perfectRate: number;
  solvedRegimeTrials: number;
  solvedRegimePerfectRate: number | null;
  unsolvedRegimeMaxScore: number | null;
  meanMinSeedScore: number;
  minPerfectParams: number | null;
  avgComputeMsToPerfection: number | null;
  avgEpisodesToPerfection: number | null;
}

export interface MechanisticAggregate {
  sampleCount: number;
  avgSensorImportance: number[];
  avgSparsityRatio: number;
  avgWeightL2Norm: number;
  bestLinearFormula: string | null;
}

export interface RegimeSplitFinding {
  solvedScenarios: DifficultyPreset[];
  unsolvedScenarios: DifficultyPreset[];
  solvedTrials: number;
  solvedPerfect: number;
  solvedPerfectPct: number;
  solvedComputeMs: number;
  solvedComputePct: number;
  unsolvedTrials: number;
  unsolvedComputeMs: number;
  unsolvedComputePct: number;
  totalComputeMs: number;
}

export interface GenerationDistribution {
  totalPerfect: number;
  g1: number;
  g2: number;
  g3to5: number;
  g6to15: number;
  g16Plus: number;
  g1Pct: number;
}

export interface HyperparamFinding {
  populationSize: number;
  mutationStrength: number;
  trialCount: number;
  perfectCount: number;
  perfectRate: number;
  solvedRegimePerfectRate: number | null;
  avgComputeMsToPerfection: number | null;
  avgEpisodesToPerfection: number | null;
  meanMinSeedScore: number;
}

export interface ScenarioInputCell {
  difficulty: DifficultyPreset;
  inputCount: number;
  trialCount: number;
  perfectCount: number;
  perfectRate: number;
  maxMinSeed: number;
  meanMinSeed: number;
  avgComputeMs: number;
}

export interface UnsolvedFrontierGroup {
  difficulty: DifficultyPreset;
  label: string;
  trialCount: number;
  maxMinSeed: number;
  meanMinSeed: number;
  topTrials: ResearchTrialResult[];
}

export interface ArchitectureFinding {
  architecture: NetworkArchitecture;
  label: string;
  shortLabel: string;
  trialCount: number;
  perfectCount: number;
  perfectRate: number;
  solvedRegimePerfectRate: number | null;
  meanMinSeedScore: number;
  bestMinSeedScore: number;
  avgParams: number;
  avgComputeMsToPerfection: number | null;
}

export interface PrecisionFinding {
  precision: WeightPrecision;
  label: string;
  shortLabel: string;
  bitsPerParam: number;
  trialCount: number;
  perfectCount: number;
  perfectRate: number;
  solvedRegimePerfectRate: number | null;
  meanMinSeedScore: number;
  bestMinSeedScore: number;
  avgTotalBits: number;
  avgPipesPerBit: number;
  maxPipesPerBit: number;
  avgComputeMsToPerfection: number | null;
}

export interface AutopsyAggregate {
  failedTrials: number;
  totalDeaths: number;
  causes: Record<FailureCause, number>;
  dominantFailure: FailureCause;
  avgDeathAbsVy: number;
  avgDeathGapErr: number;
  avgGeneralizationGap: number;
}

export interface ReasoningAggregate {
  sampleCount: number;
  ponderTrials: number;
  avgPonderSteps: number | null;
  calmPonderSteps: number | null;
  dangerPonderSteps: number | null;
  dangerVsCalmDelta: number | null;
  avgSystem2Ratio: number | null;
  rolloutTrials: number;
  avgRolloutAdvantage: number | null;
  ssmTrials: number;
  avgSsmGate: number | null;
}

export interface LearningDynamicsAggregate {
  totalClassified: number;
  counts: Record<LearningDynamicKind, number>;
}

export interface PairedABDiffSummary {
  labelA: string;
  labelB: string;
  matchedPairs: number;
  winsB: number;
  winsA: number;
  ties: number;
  meanDeltaScore: number;
  medianDeltaScore: number;
  perfectDeltaPct: number;
  signTestPValue: number | null;
  topPositiveLifts: { key: string; scoreA: number; scoreB: number; delta: number }[];
  topNegativeLifts: { key: string; scoreA: number; scoreB: number; delta: number }[];
}

export interface MorphogenesisComparisonStats {
  staticTrials: number;
  growingTrials: number;
  staticPerfectRate: number;
  growingPerfectRate: number;
  staticMeanMinSeed: number;
  growingMeanMinSeed: number;
  matchedPairs: number;
  winsGrowing: number;
  winsStatic: number;
  ties: number;
  meanDeltaScore: number;
  signTestPValue: number | null;
  avgInitialParams: number | null;
  avgFinalParams: number | null;
  avgParamGrowthRatio: number | null;
  avgPrunedSynapses: number | null;
  avgGrowthEvents: number | null;
  avgPruneEvents: number | null;
  avgFinalK: number | null;
  avgFinalSensors: number | null;
}

export interface SensorAttributionFinding {
  sensor: SensorFeatureId;
  label: string;
  shortLabel: string;
  group: 'KINEMATIC' | 'PIPE_1' | 'PIPE_2';
  trialsWithSensor: number;
  trialsWithoutSensor: number;
  meanScoreWith: number;
  meanScoreWithout: number;
  marginalLift: number;
  staticLift: number | null;
  movingLift: number | null;
  turbulentLift: number | null;
  avgJacobianSharePct: number;
  whyItHelps: string;
  whenItHelps: string;
}

export interface SensorDiscoverySummary {
  totalTestedSensors: number;
  topHelpfulSensor: SensorFeatureId | null;
  sensors: SensorAttributionFinding[];
  botFirstNote: string;
}

export interface ScenarioProofEntry {
  difficulty: DifficultyPreset;
  label: string;
  proof: ScenarioSolvabilityProof;
}

export interface ParetoFrontierPoint {
  trialId: string;
  label: string;
  architecture: NetworkArchitecture;
  topologyLabel: string;
  difficulty: DifficultyPreset;
  computeProfile: ComputeProfileKind;
  minSeedScore: number;
  meanFlopsPerFrame: number;
  efficiencyScore: number;
  verifiedPerfect: boolean;
}

export interface ComputeRoiSummary {
  avgFlopsPerFrame: number;
  minFlopsPerFrame: number;
  maxFlopsPerFrame: number;
  avgEfficiencyScore: number;
  hybridTrials: number;
  totalRollbacks: number;
  totalCommits: number;
  avgRoiScore: number | null;
}

export interface HardwareRoutingSummary {
  gpuLockstepTrials: number;
  cpuSpecializedTrials: number;
  gpuPerfectRate: number | null;
  cpuPerfectRate: number | null;
  gpuMeanScore: number | null;
  cpuMeanScore: number | null;
  gpuMeanFlops: number | null;
  cpuMeanFlops: number | null;
}

export interface IslandWinnerStat {
  species: NetworkArchitecture;
  label: string;
  wins: number;
  winSharePct: number;
  meanScore: number;
  meanFlops: number;
}

export interface IslandWinnerSummary {
  totalIslandTrials: number;
  rebalanceEventsTotal: number;
  winners: IslandWinnerStat[];
}

export interface ResearchFindings {
  totalTrials: number;
  totalPerfect: number;
  mostDenseTrial: ResearchTrialResult | null;
  mostBitEfficientTrial: ResearchTrialResult | null;
  fastestPerfectTrial: ResearchTrialResult | null;
  overallBestTrial: ResearchTrialResult | null;
  perDifficulty: DifficultyFinding[];
  perAlgorithm: AlgorithmFinding[];
  perTopology: TopologyFinding[];
  perInputSet: InputSetFinding[];
  perArchitecture: ArchitectureFinding[];
  perPrecision: PrecisionFinding[];
  mechanisticAggregate: MechanisticAggregate | null;
  autopsySummary: AutopsyAggregate | null;
  reasoningSummary: ReasoningAggregate | null;
  learningDynamicsSummary: LearningDynamicsAggregate | null;
  morphogenesisComparison: MorphogenesisComparisonStats | null;
  sensorDiscovery: SensorDiscoverySummary | null;
  scenarioProofs: ScenarioProofEntry[];
  paretoFrontier: ParetoFrontierPoint[];
  computeRoiSummary: ComputeRoiSummary | null;
  hardwareRoutingSummary: HardwareRoutingSummary | null;
  islandWinnerSummary: IslandWinnerSummary | null;
  regimeSplit: RegimeSplitFinding;
  generationDistribution: GenerationDistribution;
  hyperparamSummary: HyperparamFinding[];
  scenarioInputMatrix: ScenarioInputCell[];
  unsolvedFrontierTop: UnsolvedFrontierGroup[];
  coverageGaps: string[];
  nextIterationRecommendations: string[];
  abstractSummary: string;
  capacityAnalysis: string;
  depthVsWidthAnalysis: string;
  neuronVsWeightAnalysis: string;
  isoParamComparisons: string[];
  isoNeuronComparison: string | null;
  policyMechanismSummary: string;
  hyperparameterSweetSpot: string;
  worldModelImplications: string[];
}

export function getParameterCount(
  hiddenSpec: number | number[],
  inputNodes = 5
): number {
  return calculateParameterCount(hiddenSpec, inputNodes);
}

export function getTopologyLabel(
  hiddenLayers: number[],
  inputNodes = 5
): string {
  return formatTopologyLabel(hiddenLayers, inputNodes);
}

export function computeResearchFindings(
  results: ResearchTrialResult[],
  config: ResearchSweepConfig
): ResearchFindings {
  const totalTrials = results.length;
  const totalPerfect = results.filter((r) => r.verifiedPerfect).length;

  let mostDenseTrial: ResearchTrialResult | null = null;
  let fastestPerfectTrial: ResearchTrialResult | null = null;
  let overallBestTrial: ResearchTrialResult | null = null;
  let totalComputeMs = 0;

  for (const r of results) {
    totalComputeMs += getTrialComputeMs(r);

    if (
      !overallBestTrial ||
      r.minSeedScore > overallBestTrial.minSeedScore ||
      (r.minSeedScore === overallBestTrial.minSeedScore &&
        r.parameterCount < overallBestTrial.parameterCount) ||
      (r.minSeedScore === overallBestTrial.minSeedScore &&
        r.parameterCount === overallBestTrial.parameterCount &&
        r.durationMs < overallBestTrial.durationMs)
    ) {
      overallBestTrial = r;
    }

    if (
      r.minSeedScore >= 10 &&
      (!mostDenseTrial || r.knowledgeDensity > mostDenseTrial.knowledgeDensity)
    ) {
      mostDenseTrial = r;
    }

    if (
      r.verifiedPerfect &&
      (!fastestPerfectTrial ||
        getTrialComputeMs(r) < getTrialComputeMs(fastestPerfectTrial))
    ) {
      fastestPerfectTrial = r;
    }
  }

  // Include both planned difficulties and any observed in loaded results
  const diffOrder: DifficultyPreset[] = [...config.difficulties];
  for (const r of results) {
    if (!diffOrder.includes(r.difficulty)) {
      diffOrder.push(r.difficulty);
    }
  }

  const perDifficulty: DifficultyFinding[] = diffOrder.map((diff) => {
    const subset = results.filter((r) => r.difficulty === diff);
    let bestTrial: ResearchTrialResult | null = null;
    let minimumViableTrial: ResearchTrialResult | null = null;
    let minimumPerfectTrial: ResearchTrialResult | null = null;
    let perfectCount = 0;
    let scoreSum = 0;
    let diffCompute = 0;

    for (const r of subset) {
      scoreSum += r.minSeedScore;
      diffCompute += getTrialComputeMs(r);
      if (r.verifiedPerfect) perfectCount += 1;

      if (
        !bestTrial ||
        r.minSeedScore > bestTrial.minSeedScore ||
        (r.minSeedScore === bestTrial.minSeedScore &&
          r.parameterCount < bestTrial.parameterCount)
      ) {
        bestTrial = r;
      }

      if (
        r.minSeedScore >= 25 &&
        (!minimumViableTrial ||
          r.parameterCount < minimumViableTrial.parameterCount ||
          (r.parameterCount === minimumViableTrial.parameterCount &&
            r.minSeedScore > minimumViableTrial.minSeedScore))
      ) {
        minimumViableTrial = r;
      }

      if (
        r.verifiedPerfect &&
        (!minimumPerfectTrial ||
          r.parameterCount < minimumPerfectTrial.parameterCount ||
          (r.parameterCount === minimumPerfectTrial.parameterCount &&
            getTrialComputeMs(r) < getTrialComputeMs(minimumPerfectTrial)))
      ) {
        minimumPerfectTrial = r;
      }
    }

    return {
      difficulty: diff,
      bestTrial,
      minimumViableTrial,
      minimumPerfectTrial,
      perfectCount,
      totalCount: subset.length,
      meanMinSeedScore:
        subset.length > 0 ? Number((scoreSum / subset.length).toFixed(1)) : 0,
      totalComputeMs: Number(diffCompute.toFixed(1)),
      computeSharePct:
        totalComputeMs > 0
          ? Number(((diffCompute / totalComputeMs) * 100).toFixed(1))
          : 0,
    };
  });

  // Solved vs Unsolved regime split
  const solvedScenarioSet = new Set<DifficultyPreset>();
  const unsolvedScenarioSet = new Set<DifficultyPreset>();
  let solvedTrials = 0;
  let solvedPerfect = 0;
  let solvedComputeMs = 0;
  let unsolvedTrials = 0;
  let unsolvedComputeMs = 0;

  for (const df of perDifficulty) {
    if (df.totalCount === 0) continue;
    if (df.perfectCount > 0) {
      solvedScenarioSet.add(df.difficulty);
      solvedTrials += df.totalCount;
      solvedPerfect += df.perfectCount;
      solvedComputeMs += df.totalComputeMs;
    } else {
      unsolvedScenarioSet.add(df.difficulty);
      unsolvedTrials += df.totalCount;
      unsolvedComputeMs += df.totalComputeMs;
    }
  }

  const regimeSplit: RegimeSplitFinding = {
    solvedScenarios: Array.from(solvedScenarioSet),
    unsolvedScenarios: Array.from(unsolvedScenarioSet),
    solvedTrials,
    solvedPerfect,
    solvedPerfectPct:
      solvedTrials > 0
        ? Number(((solvedPerfect / solvedTrials) * 100).toFixed(1))
        : 0,
    solvedComputeMs: Number(solvedComputeMs.toFixed(1)),
    solvedComputePct:
      totalComputeMs > 0
        ? Number(((solvedComputeMs / totalComputeMs) * 100).toFixed(1))
        : 0,
    unsolvedTrials,
    unsolvedComputeMs: Number(unsolvedComputeMs.toFixed(1)),
    unsolvedComputePct:
      totalComputeMs > 0
        ? Number(((unsolvedComputeMs / totalComputeMs) * 100).toFixed(1))
        : 0,
    totalComputeMs: Number(totalComputeMs.toFixed(1)),
  };

  // Generation convergence distribution across verified-perfect trials
  let g1 = 0;
  let g2 = 0;
  let g3to5 = 0;
  let g6to15 = 0;
  let g16Plus = 0;
  for (const r of results) {
    if (!r.verifiedPerfect) continue;
    const g = r.generationsToSolve ?? r.generationsRun;
    if (g <= 1) g1 += 1;
    else if (g === 2) g2 += 1;
    else if (g <= 5) g3to5 += 1;
    else if (g <= 15) g6to15 += 1;
    else g16Plus += 1;
  }
  const generationDistribution: GenerationDistribution = {
    totalPerfect,
    g1,
    g2,
    g3to5,
    g6to15,
    g16Plus,
    g1Pct: totalPerfect > 0 ? Number(((g1 / totalPerfect) * 100).toFixed(1)) : 0,
  };

  // Include both planned algorithms and any observed in results
  const algoOrder: LearningAlgorithm[] = [...config.algorithms];
  for (const r of results) {
    if (!algoOrder.includes(r.algorithm)) {
      algoOrder.push(r.algorithm);
    }
  }

  const perAlgorithm: AlgorithmFinding[] = algoOrder.map((algo) => {
    const subset = results.filter((r) => r.algorithm === algo);
    let perfectCount = 0;
    let solvedTotal = 0;
    let solvedPerf = 0;
    let scoreSum = 0;
    let timeSum = 0;
    let computeSum = 0;
    let episodesSum = 0;
    let gensSum = 0;
    let ticksPerSecSum = 0;
    let staticTotal = 0;
    let staticPerf = 0;
    let dynTotal = 0;
    let dynPerf = 0;

    for (const r of subset) {
      scoreSum += r.minSeedScore;
      ticksPerSecSum += r.ticksPerSecond;
      const isDyn = DYNAMIC_SCENARIOS.has(r.difficulty);
      if (isDyn) {
        dynTotal += 1;
        if (r.verifiedPerfect) dynPerf += 1;
      } else {
        staticTotal += 1;
        if (r.verifiedPerfect) staticPerf += 1;
      }

      if (solvedScenarioSet.has(r.difficulty)) {
        solvedTotal += 1;
        if (r.verifiedPerfect) solvedPerf += 1;
      }

      if (r.verifiedPerfect) {
        perfectCount += 1;
        timeSum += r.timeToPerfectionMs ?? r.durationMs;
        computeSum += getTrialComputeMs(r);
        episodesSum += getTrialEpisodes(r);
        gensSum += r.generationsToSolve ?? r.generationsRun;
      }
    }

    return {
      algorithm: algo,
      trialCount: subset.length,
      perfectCount,
      perfectRate:
        subset.length > 0
          ? Number(((perfectCount / subset.length) * 100).toFixed(1))
          : 0,
      solvedRegimeTrials: solvedTotal,
      solvedRegimePerfectRate:
        solvedTotal > 0
          ? Number(((solvedPerf / solvedTotal) * 100).toFixed(1))
          : null,
      staticTrials: staticTotal,
      dynamicTrials: dynTotal,
      staticPerfectRate:
        staticTotal > 0 ? Math.round((staticPerf / staticTotal) * 100) : null,
      dynamicPerfectRate:
        dynTotal > 0 ? Math.round((dynPerf / dynTotal) * 100) : null,
      meanMinSeedScore:
        subset.length > 0 ? Math.round(scoreSum / subset.length) : 0,
      avgTimeToPerfectionMs:
        perfectCount > 0 ? Math.round(timeSum / perfectCount) : null,
      avgComputeMsToPerfection:
        perfectCount > 0 ? Number((computeSum / perfectCount).toFixed(1)) : null,
      avgEpisodesToPerfection:
        perfectCount > 0 ? Math.round(episodesSum / perfectCount) : null,
      avgGenerationsToPerfection:
        perfectCount > 0 ? Number((gensSum / perfectCount).toFixed(1)) : null,
      avgTicksPerSecond:
        subset.length > 0 ? Math.round(ticksPerSecSum / subset.length) : 0,
    };
  });

  const plannedInputSets =
    config.inputFeatureSets && config.inputFeatureSets.length > 0
      ? config.inputFeatureSets.map((set) => normalizeInputFeatures(set))
      : [[...CLASSIC_5_SENSOR_FEATURES]];

  // Group per input subset (1-6 sensors)
  const inputSetMap = new Map<
    string,
    {
      features: SensorFeatureId[];
      label: string;
      subset: ResearchTrialResult[];
    }
  >();

  for (const set of plannedInputSets) {
    const key = formatInputSubsetKey(set);
    if (!inputSetMap.has(key)) {
      inputSetMap.set(key, {
        features: set,
        label: formatInputSubsetLabel(set),
        subset: [],
      });
    }
  }
  for (const r of results) {
    const feats = normalizeInputFeatures(r.inputFeatures);
    const key = formatInputSubsetKey(feats);
    const existing = inputSetMap.get(key) ?? {
      features: feats,
      label: r.inputSetLabel ?? formatInputSubsetLabel(feats),
      subset: [],
    };
    existing.subset.push(r);
    inputSetMap.set(key, existing);
  }

  const perInputSet: InputSetFinding[] = Array.from(inputSetMap.entries())
    .map(([key, entry]) => {
      let perfectCount = 0;
      let solvedTotal = 0;
      let solvedPerf = 0;
      let unsolvedMax: number | null = null;
      let scoreSum = 0;
      let computeSum = 0;
      let episodesSum = 0;
      let minPerfectParams: number | null = null;
      for (const r of entry.subset) {
        scoreSum += r.minSeedScore;
        if (solvedScenarioSet.has(r.difficulty)) {
          solvedTotal += 1;
          if (r.verifiedPerfect) solvedPerf += 1;
        } else if (unsolvedScenarioSet.has(r.difficulty)) {
          if (unsolvedMax === null || r.minSeedScore > unsolvedMax) {
            unsolvedMax = r.minSeedScore;
          }
        }
        if (r.verifiedPerfect) {
          perfectCount += 1;
          computeSum += getTrialComputeMs(r);
          episodesSum += getTrialEpisodes(r);
          if (
            minPerfectParams === null ||
            r.parameterCount < minPerfectParams
          ) {
            minPerfectParams = r.parameterCount;
          }
        }
      }
      const n = entry.subset.length;
      return {
        inputSetKey: key,
        inputSetLabel: entry.label,
        inputCount: entry.features.length,
        features: entry.features,
        hasPipeVy: entry.features.includes('PIPE_VY'),
        trialCount: n,
        perfectCount,
        perfectRate: n > 0 ? Number(((perfectCount / n) * 100).toFixed(1)) : 0,
        solvedRegimeTrials: solvedTotal,
        solvedRegimePerfectRate:
          solvedTotal > 0
            ? Number(((solvedPerf / solvedTotal) * 100).toFixed(1))
            : null,
        unsolvedRegimeMaxScore: unsolvedMax,
        meanMinSeedScore: n > 0 ? Math.round(scoreSum / n) : 0,
        minPerfectParams,
        avgComputeMsToPerfection:
          perfectCount > 0 ? Number((computeSum / perfectCount).toFixed(1)) : null,
        avgEpisodesToPerfection:
          perfectCount > 0 ? Math.round(episodesSum / perfectCount) : null,
      };
    })
    .sort((a, b) => b.inputCount - a.inputCount || b.perfectRate - a.perfectRate);

  // Build unique topology buckets across planned (inputCount x hiddenLayers) plus any observed in results
  const topoBucketMeta = new Map<
    string,
    { clean: number[]; inputNodes: number }
  >();
  const allPlannedTopos = getAllActiveTopologies(config);
  for (const set of plannedInputSets) {
    for (const rawTopo of allPlannedTopos) {
      const clean = normalizeHiddenLayers(rawTopo);
      const label = formatTopologyLabel(clean, set.length);
      if (!topoBucketMeta.has(label)) {
        topoBucketMeta.set(label, { clean, inputNodes: set.length });
      }
    }
  }
  for (const r of results) {
    if (!topoBucketMeta.has(r.topologyLabel)) {
      const clean = normalizeHiddenLayers(r.topology);
      const inputNodes = r.inputCount ?? r.inputFeatures?.length ?? 5;
      topoBucketMeta.set(r.topologyLabel, { clean, inputNodes });
    }
  }

  const perTopology: TopologyFinding[] = Array.from(topoBucketMeta.entries())
    .map(([label, meta]) => {
      const breakdown = calculateTopologyBreakdown(meta.clean, meta.inputNodes);
      const subset = results.filter((r) => r.topologyLabel === label);
      let perfectCount = 0;
      let scoreSum = 0;
      let bestScore = 0;
      let timeSum = 0;
      let computeSum = 0;
      let episodesSum = 0;
      let maxDensity = 0;

      for (const r of subset) {
        scoreSum += r.minSeedScore;
        if (r.minSeedScore > bestScore) bestScore = r.minSeedScore;
        if (r.knowledgeDensity > maxDensity) maxDensity = r.knowledgeDensity;
        if (r.verifiedPerfect) {
          perfectCount += 1;
          timeSum += r.timeToPerfectionMs ?? r.durationMs;
          computeSum += getTrialComputeMs(r);
          episodesSum += getTrialEpisodes(r);
        }
      }

      return {
        topologyLabel: label,
        topology: meta.clean,
        depth: meta.clean.length,
        maxWidth: meta.clean.length > 0 ? Math.max(...meta.clean) : 0,
        hiddenNeuronCount: breakdown.hiddenNeuronCount,
        weightCount: breakdown.weightCount,
        biasCount: breakdown.biasCount,
        parameterCount: breakdown.parameterCount,
        trialCount: subset.length,
        perfectCount,
        perfectRate:
          subset.length > 0
            ? Number(((perfectCount / subset.length) * 100).toFixed(1))
            : 0,
        meanMinSeedScore:
          subset.length > 0 ? Math.round(scoreSum / subset.length) : 0,
        bestMinSeedScore: bestScore,
        avgTimeToPerfectionMs:
          perfectCount > 0 ? Math.round(timeSum / perfectCount) : null,
        avgComputeMsToPerfection:
          perfectCount > 0 ? Number((computeSum / perfectCount).toFixed(1)) : null,
        avgEpisodesToPerfection:
          perfectCount > 0 ? Math.round(episodesSum / perfectCount) : null,
        maxDensity: Number(maxDensity.toFixed(2)),
      };
    })
    .sort((a, b) => a.parameterCount - b.parameterCount || a.depth - b.depth);

  // Hyperparameter sensitivity (Pop x Sigma)
  const hpMap = new Map<
    string,
    {
      pop: number;
      sigma: number;
      n: number;
      perfect: number;
      solvedN: number;
      solvedPerf: number;
      scoreSum: number;
      computePerfSum: number;
      episodesPerfSum: number;
    }
  >();
  for (const r of results) {
    const key = `${r.populationSize}|${r.mutationStrength.toFixed(2)}`;
    const entry = hpMap.get(key) ?? {
      pop: r.populationSize,
      sigma: r.mutationStrength,
      n: 0,
      perfect: 0,
      solvedN: 0,
      solvedPerf: 0,
      scoreSum: 0,
      computePerfSum: 0,
      episodesPerfSum: 0,
    };
    entry.n += 1;
    entry.scoreSum += r.minSeedScore;
    if (solvedScenarioSet.has(r.difficulty)) {
      entry.solvedN += 1;
      if (r.verifiedPerfect) entry.solvedPerf += 1;
    }
    if (r.verifiedPerfect) {
      entry.perfect += 1;
      entry.computePerfSum += getTrialComputeMs(r);
      entry.episodesPerfSum += getTrialEpisodes(r);
    }
    hpMap.set(key, entry);
  }
  const hyperparamSummary: HyperparamFinding[] = Array.from(hpMap.values())
    .map((e) => ({
      populationSize: e.pop,
      mutationStrength: e.sigma,
      trialCount: e.n,
      perfectCount: e.perfect,
      perfectRate: Number(((e.perfect / e.n) * 100).toFixed(1)),
      solvedRegimePerfectRate:
        e.solvedN > 0
          ? Number(((e.solvedPerf / e.solvedN) * 100).toFixed(1))
          : null,
      avgComputeMsToPerfection:
        e.perfect > 0 ? Number((e.computePerfSum / e.perfect).toFixed(1)) : null,
      avgEpisodesToPerfection:
        e.perfect > 0 ? Math.round(e.episodesPerfSum / e.perfect) : null,
      meanMinSeedScore: Math.round(e.scoreSum / e.n),
    }))
    .sort(
      (a, b) =>
        a.populationSize - b.populationSize ||
        a.mutationStrength - b.mutationStrength
    );

  // Scenario x InputCount matrix
  const siMap = new Map<
    string,
    {
      difficulty: DifficultyPreset;
      inputCount: number;
      n: number;
      perfect: number;
      maxScore: number;
      scoreSum: number;
      computeSum: number;
    }
  >();
  for (const r of results) {
    const ic = r.inputCount ?? r.inputFeatures?.length ?? 5;
    const key = `${r.difficulty}|${ic}`;
    const cell = siMap.get(key) ?? {
      difficulty: r.difficulty,
      inputCount: ic,
      n: 0,
      perfect: 0,
      maxScore: 0,
      scoreSum: 0,
      computeSum: 0,
    };
    cell.n += 1;
    if (r.verifiedPerfect) cell.perfect += 1;
    if (r.minSeedScore > cell.maxScore) cell.maxScore = r.minSeedScore;
    cell.scoreSum += r.minSeedScore;
    cell.computeSum += getTrialComputeMs(r);
    siMap.set(key, cell);
  }
  const scenarioInputMatrix: ScenarioInputCell[] = Array.from(siMap.values())
    .map((c) => ({
      difficulty: c.difficulty,
      inputCount: c.inputCount,
      trialCount: c.n,
      perfectCount: c.perfect,
      perfectRate: Number(((c.perfect / c.n) * 100).toFixed(1)),
      maxMinSeed: c.maxScore,
      meanMinSeed: Number((c.scoreSum / c.n).toFixed(1)),
      avgComputeMs: Number((c.computeSum / c.n).toFixed(1)),
    }))
    .sort((a, b) => a.inputCount - b.inputCount);

  // Top frontier trials per unsolved scenario
  const unsolvedFrontierTop: UnsolvedFrontierGroup[] = perDifficulty
    .filter((df) => df.totalCount > 0 && df.perfectCount === 0)
    .map((df) => {
      const subset = results
        .filter((r) => r.difficulty === df.difficulty)
        .sort(
          (a, b) =>
            b.minSeedScore - a.minSeedScore ||
            b.meanSeedScore - a.meanSeedScore ||
            a.parameterCount - b.parameterCount
        );
      return {
        difficulty: df.difficulty,
        label: resolveEnvironment(df.difficulty, config.customEnvironment).label,
        trialCount: df.totalCount,
        maxMinSeed: subset[0]?.minSeedScore ?? 0,
        meanMinSeed: df.meanMinSeedScore,
        topTrials: subset.slice(0, 5),
      };
    });

  // Coverage Gaps Audit (planned vs executed)
  const coverageGaps: string[] = [];
  if (totalTrials > 0) {
    const testedDiffs = new Set(results.map((r) => r.difficulty));
    const missingDiffs = config.difficulties.filter((d) => !testedDiffs.has(d));
    if (missingDiffs.length > 0) {
      coverageGaps.push(
        `Untested scenarios (${missingDiffs.length}): ${missingDiffs
          .map((d) => resolveEnvironment(d, config.customEnvironment).label)
          .join(', ')}`
      );
    }
    const testedPops = new Set(results.map((r) => r.populationSize));
    const missingPops = config.populationSizes.filter((p) => !testedPops.has(p));
    if (missingPops.length > 0) {
      coverageGaps.push(`Untested population sizes: ${missingPops.join(', ')}`);
    }
    const testedHiddenShapes = new Set(
      results.map((r) => normalizeHiddenLayers(r.topology).join('·') || 'Linear')
    );
    const missingShapes = allPlannedTopos
      .map((t) => normalizeHiddenLayers(t).join('·') || 'Linear')
      .filter((s, idx, arr) => arr.indexOf(s) === idx && !testedHiddenShapes.has(s));
    if (missingShapes.length > 0) {
      coverageGaps.push(`Untested hidden shapes: ${missingShapes.join(', ')}`);
    }
    const testedInputKeys = new Set(
      results.map((r) => formatInputSubsetKey(normalizeInputFeatures(r.inputFeatures)))
    );
    const missingInputs = plannedInputSets
      .filter((s) => !testedInputKeys.has(formatInputSubsetKey(s)))
      .map((s) => formatInputSubsetLabel(s));
    if (missingInputs.length > 0) {
      coverageGaps.push(`Untested input subsets: ${missingInputs.join(', ')}`);
    }
  }

  // Per-Architecture & Per-Precision aggregations
  const solvedScenarioSetForBio = new Set<DifficultyPreset>(
    regimeSplit.solvedScenarios
  );

  const perArchitecture: ArchitectureFinding[] = ALL_ARCHITECTURES.map(
    (arch) => {
      const sub = results.filter((r) => (r.architecture ?? 'MLP') === arch);
      const perf = sub.filter((r) => r.verifiedPerfect);
      const solvedSub = sub.filter((r) =>
        solvedScenarioSetForBio.has(r.difficulty)
      );
      const solvedPerf = solvedSub.filter((r) => r.verifiedPerfect);
      const meanMin =
        sub.length > 0
          ? Math.round(sub.reduce((s, r) => s + r.minSeedScore, 0) / sub.length)
          : 0;
      let bestMin = 0;
      for (let i = 0; i < sub.length; i++) {
        if (sub[i].minSeedScore > bestMin) bestMin = sub[i].minSeedScore;
      }
      const avgParams =
        sub.length > 0
          ? Number(
              (
                sub.reduce((s, r) => s + r.parameterCount, 0) / sub.length
              ).toFixed(1)
            )
          : 0;
      const avgCompute =
        perf.length > 0
          ? Number(
              (
                perf.reduce((s, r) => s + getTrialComputeMs(r), 0) / perf.length
              ).toFixed(1)
            )
          : null;
      return {
        architecture: arch,
        label: ARCHITECTURE_META[arch].label,
        shortLabel: ARCHITECTURE_META[arch].shortLabel,
        trialCount: sub.length,
        perfectCount: perf.length,
        perfectRate:
          sub.length > 0
            ? Number(((perf.length / sub.length) * 100).toFixed(1))
            : 0,
        solvedRegimePerfectRate:
          solvedSub.length > 0
            ? Number(((solvedPerf.length / solvedSub.length) * 100).toFixed(1))
            : null,
        meanMinSeedScore: meanMin,
        bestMinSeedScore: bestMin,
        avgParams,
        avgComputeMsToPerfection: avgCompute,
      };
    }
  );

  const perPrecision: PrecisionFinding[] = ALL_WEIGHT_PRECISIONS.map((prec) => {
    const sub = results.filter((r) => (r.weightPrecision ?? 'FP32') === prec);
    const perf = sub.filter((r) => r.verifiedPerfect);
    const solvedSub = sub.filter((r) =>
      solvedScenarioSetForBio.has(r.difficulty)
    );
    const solvedPerf = solvedSub.filter((r) => r.verifiedPerfect);
    const bitsPerParam = WEIGHT_PRECISION_META[prec].bitsPerParam;
    const meanMin =
      sub.length > 0
        ? Math.round(sub.reduce((s, r) => s + r.minSeedScore, 0) / sub.length)
        : 0;
    let bestMin = 0;
    for (let i = 0; i < sub.length; i++) {
      if (sub[i].minSeedScore > bestMin) bestMin = sub[i].minSeedScore;
    }
    const totalBitsList = sub.map(
      (r) =>
        r.totalBits ?? Math.max(1, Math.round(r.parameterCount * bitsPerParam))
    );
    const pipesPerBitList = sub.map((r, i) =>
      r.pipesPerBit !== undefined
        ? r.pipesPerBit
        : Number((r.minSeedScore / Math.max(1, totalBitsList[i])).toFixed(3))
    );
    const avgTotalBits =
      totalBitsList.length > 0
        ? Math.round(
            totalBitsList.reduce((a, b) => a + b, 0) / totalBitsList.length
          )
        : 0;
    const avgPipesPerBit =
      pipesPerBitList.length > 0
        ? Number(
            (
              pipesPerBitList.reduce((a, b) => a + b, 0) /
              pipesPerBitList.length
            ).toFixed(3)
          )
        : 0;
    let maxPipesPerBit = 0;
    for (let i = 0; i < pipesPerBitList.length; i++) {
      if (pipesPerBitList[i] > maxPipesPerBit) {
        maxPipesPerBit = pipesPerBitList[i];
      }
    }
    const avgCompute =
      perf.length > 0
        ? Number(
            (
              perf.reduce((s, r) => s + getTrialComputeMs(r), 0) / perf.length
            ).toFixed(1)
          )
        : null;
    return {
      precision: prec,
      label: WEIGHT_PRECISION_META[prec].label,
      shortLabel: WEIGHT_PRECISION_META[prec].shortLabel,
      bitsPerParam,
      trialCount: sub.length,
      perfectCount: perf.length,
      perfectRate:
        sub.length > 0
          ? Number(((perf.length / sub.length) * 100).toFixed(1))
          : 0,
      solvedRegimePerfectRate:
        solvedSub.length > 0
          ? Number(((solvedPerf.length / solvedSub.length) * 100).toFixed(1))
          : null,
      meanMinSeedScore: meanMin,
      bestMinSeedScore: bestMin,
      avgTotalBits,
      avgPipesPerBit,
      maxPipesPerBit,
      avgComputeMsToPerfection: avgCompute,
    };
  });

  const mostBitEfficientTrial =
    results.length > 0
      ? [...results]
          .filter((r) => r.minSeedScore >= 10)
          .sort((a, b) => {
            const bitA =
              a.pipesPerBit ??
              a.minSeedScore /
                Math.max(
                  1,
                  a.parameterCount *
                    WEIGHT_PRECISION_META[a.weightPrecision ?? 'FP32']
                      .bitsPerParam
                );
            const bitB =
              b.pipesPerBit ??
              b.minSeedScore /
                Math.max(
                  1,
                  b.parameterCount *
                    WEIGHT_PRECISION_META[b.weightPrecision ?? 'FP32']
                      .bitsPerParam
                );
            return bitB - bitA || b.minSeedScore - a.minSeedScore;
          })[0] ?? null
      : null;

  const proofDiffs: DifficultyPreset[] = [...CORE_DIFFICULTIES];
  for (const d of diffOrder) {
    if (!proofDiffs.includes(d)) proofDiffs.push(d);
  }
  const scenarioProofs: ScenarioProofEntry[] = proofDiffs.map((diff) => {
    const env = resolveEnvironment(diff, config.customEnvironment);
    return {
      difficulty: diff,
      label: env.label,
      proof: verifyScenarioSolvability(env),
    };
  });

  if (totalTrials === 0) {
    return {
      totalTrials: 0,
      totalPerfect: 0,
      mostDenseTrial: null,
      mostBitEfficientTrial: null,
      fastestPerfectTrial: null,
      overallBestTrial: null,
      perDifficulty,
      perAlgorithm,
      perTopology,
      perInputSet,
      perArchitecture,
      perPrecision,
      mechanisticAggregate: null,
      autopsySummary: null,
      reasoningSummary: null,
      learningDynamicsSummary: null,
      morphogenesisComparison: null,
      sensorDiscovery: null,
      scenarioProofs,
      paretoFrontier: [],
      computeRoiSummary: null,
      hardwareRoutingSummary: null,
      islandWinnerSummary: null,
      regimeSplit,
      generationDistribution,
      hyperparamSummary: [],
      scenarioInputMatrix: [],
      unsolvedFrontierTop: [],
      coverageGaps: [],
      nextIterationRecommendations: [],
      abstractSummary:
        'Configure your Mastery Limit, sensor subsets (1–12 Dual-Pipe inputs + TTF), bio-inspired & LLM-reasoning architectures, Self-Growing Morphogenesis, topologies, and verified scenarios, then run a sweep to synthesize scaling laws.',
      capacityAnalysis: '',
      depthVsWidthAnalysis: '',
      neuronVsWeightAnalysis: '',
      isoParamComparisons: [],
      isoNeuronComparison: null,
      policyMechanismSummary: '',
      hyperparameterSweetSpot: '',
      worldModelImplications: [],
    };
  }

  const perfectPct = ((totalPerfect / totalTrials) * 100).toFixed(1);
  const abstractParts: string[] = [
    `Executed ${totalTrials.toLocaleString()} controlled trials across ${
      perTopology.filter((t) => t.trialCount > 0).length
    } active topologies and ${
      perDifficulty.filter((d) => d.totalCount > 0).length
    } physics scenarios up to ${config.targetPipeCap.toLocaleString()} pipes/seed (${config.verificationSeeds} unseen seeds/audit).`,
    `${totalPerfect.toLocaleString()} of ${totalTrials.toLocaleString()} configurations (${perfectPct}%) verified zero-crash perfection (${generationDistribution.g1Pct}% solved in Generation 1).`,
  ];

  if (
    regimeSplit.solvedScenarios.length > 0 &&
    regimeSplit.unsolvedScenarios.length > 0
  ) {
    abstractParts.push(
      `Regime split: ${regimeSplit.solvedScenarios.length} solved scenarios hit ${regimeSplit.solvedPerfectPct}% perfection using only ${regimeSplit.solvedComputePct}% of compute, while ${regimeSplit.unsolvedScenarios.length} unsolved frontier scenarios consumed ${regimeSplit.unsolvedComputePct}% of compute.`
    );
  }

  if (fastestPerfectTrial) {
    const normCompute = getTrialComputeMs(fastestPerfectTrial);
    const episodes = getTrialEpisodes(fastestPerfectTrial);
    abstractParts.push(
      `Most compute-efficient perfection: ${normCompute.toFixed(1)} norm-ms (${episodes.toLocaleString()} bird-evals, G${fastestPerfectTrial.generationsRun}) by ${ALGORITHM_SHORT_LABELS[fastestPerfectTrial.algorithm]} on ${fastestPerfectTrial.topologyLabel} (${fastestPerfectTrial.parameterCount}p) in ${resolveEnvironment(fastestPerfectTrial.difficulty, config.customEnvironment).label}.`
    );
  }
  if (mostDenseTrial) {
    abstractParts.push(
      `Peak knowledge compression: ${mostDenseTrial.knowledgeDensity.toLocaleString()} pipes/param (${mostDenseTrial.minSeedScore.toLocaleString()} worst-case pipes in ${mostDenseTrial.parameterCount} weights via ${mostDenseTrial.topologyLabel}).`
    );
  }

  const notes: string[] = [];
  for (const df of perDifficulty) {
    if (df.totalCount === 0) continue;
    const label = resolveEnvironment(
      df.difficulty,
      config.customEnvironment
    ).label;
    if (df.minimumPerfectTrial) {
      notes.push(
        `${label}: ${df.perfectCount}/${df.totalCount} perfect; min ${df.minimumPerfectTrial.parameterCount}p (${df.minimumPerfectTrial.topologyLabel}, ${ALGORITHM_SHORT_LABELS[df.minimumPerfectTrial.algorithm]}, ${getTrialComputeMs(df.minimumPerfectTrial).toFixed(1)} norm-ms).`
      );
    } else if (df.bestTrial) {
      notes.push(
        `${label}: 0/${df.totalCount} perfect (max ${df.bestTrial.minSeedScore.toLocaleString()}p, mean ${df.meanMinSeedScore}p; best ${df.bestTrial.topologyLabel} via ${ALGORITHM_SHORT_LABELS[df.bestTrial.algorithm]}, ${df.computeSharePct}% compute).`
      );
    }
  }

  // Depth vs Width comparison
  const shallow = perTopology.filter((t) => t.trialCount > 0 && t.depth <= 1);
  const deep = perTopology.filter((t) => t.trialCount > 0 && t.depth >= 2);
  const avg = (arr: TopologyFinding[], fn: (t: TopologyFinding) => number) =>
    arr.length > 0 ? arr.reduce((s, x) => s + fn(x), 0) / arr.length : 0;

  let depthVsWidthAnalysis = '';
  if (shallow.length > 0 && deep.length > 0) {
    const shallowPerf = Math.round(avg(shallow, (t) => t.perfectRate));
    const deepPerf = Math.round(avg(deep, (t) => t.perfectRate));
    const shallowScore = Math.round(avg(shallow, (t) => t.meanMinSeedScore));
    const deepScore = Math.round(avg(deep, (t) => t.meanMinSeedScore));
    depthVsWidthAnalysis = `Shallow architectures (Depth 0–1) averaged ${shallowPerf}% perfection (${shallowScore.toLocaleString()} mean pipes), whereas multi-layer networks (Depth 2–3) averaged ${deepPerf}% perfection (${deepScore.toLocaleString()} mean pipes). ${
      shallowPerf >= deepPerf
        ? 'Compact shallow policies preserve high signal-to-noise credit assignment under gradient-free search.'
        : 'Added representational depth improved nonlinear adaptation across multi-factor dynamic constraints.'
    }`;
  } else if (perTopology.some((t) => t.trialCount > 0)) {
    const topTopo = [...perTopology]
      .filter((t) => t.trialCount > 0)
      .sort(
        (a, b) =>
          b.perfectRate - a.perfectRate ||
          b.meanMinSeedScore - a.meanMinSeedScore
      )[0];
    if (topTopo) {
      depthVsWidthAnalysis = `Leading topology so far: ${topTopo.topologyLabel} (${topTopo.parameterCount} params, Depth ${topTopo.depth}) with ${topTopo.perfectRate}% perfection rate and ${topTopo.meanMinSeedScore.toLocaleString()} mean min-seed pipes.`;
    }
  }

  // Neuron vs. Weight & Iso-Parameter / Iso-Neuron Analysis
  // Prefer same-inputCount pairs so sensor ablation is NOT conflated with topology depth/width!
  const parseInputCount = (label: string): number => {
    const m = /^(\d+)→/.exec(label);
    return m ? Number(m[1]) : 0;
  };
  const activeTopos = perTopology.filter((t) => t.trialCount > 0);
  const isoParamComparisons: string[] = [];
  let isoNeuronComparison: string | null = null;

  const sortedByParam = [...activeTopos].sort(
    (a, b) => a.parameterCount - b.parameterCount
  );
  const seenIsoPair = new Set<string>();
  const isoCandidates: {
    leader: TopologyFinding;
    runner: TopologyFinding;
    sameInputs: boolean;
    structuralDiff: boolean;
    gap: number;
  }[] = [];

  for (let i = 0; i < sortedByParam.length; i++) {
    const a = sortedByParam[i];
    const aIn = parseInputCount(a.topologyLabel);
    const sameInCluster = sortedByParam.filter(
      (b) =>
        Math.abs(b.parameterCount - a.parameterCount) <= 2 &&
        parseInputCount(b.topologyLabel) === aIn
    );
    const cluster =
      sameInCluster.length >= 2
        ? sameInCluster
        : sortedByParam.filter(
            (b) => Math.abs(b.parameterCount - a.parameterCount) <= 2
          );
    if (cluster.length >= 2) {
      const ranked = [...cluster].sort(
        (x, y) =>
          y.perfectRate - x.perfectRate ||
          y.meanMinSeedScore - x.meanMinSeedScore ||
          (x.avgComputeMsToPerfection ?? Infinity) -
            (y.avgComputeMsToPerfection ?? Infinity)
      );
      const leader = ranked[0];
      const runner = ranked[ranked.length - 1];
      if (leader.topologyLabel === runner.topologyLabel) continue;
      const pairKey = `${leader.topologyLabel}|${runner.topologyLabel}`;
      if (seenIsoPair.has(pairKey)) continue;
      seenIsoPair.add(pairKey);
      isoCandidates.push({
        leader,
        runner,
        sameInputs:
          parseInputCount(leader.topologyLabel) ===
          parseInputCount(runner.topologyLabel),
        structuralDiff:
          leader.hiddenNeuronCount !== runner.hiddenNeuronCount ||
          leader.depth !== runner.depth,
        gap:
          Math.abs(leader.perfectRate - runner.perfectRate) * 10 +
          Math.abs(leader.meanMinSeedScore - runner.meanMinSeedScore),
      });
    }
  }

  isoCandidates.sort(
    (a, b) =>
      Number(b.sameInputs) - Number(a.sameInputs) ||
      Number(b.structuralDiff) - Number(a.structuralDiff) ||
      b.gap - a.gap ||
      a.leader.parameterCount - b.leader.parameterCount
  );

  for (const { leader, runner, sameInputs } of isoCandidates.slice(0, 2)) {
    const compDelta =
      leader.avgComputeMsToPerfection !== null &&
      runner.avgComputeMsToPerfection !== null
        ? ` · ${leader.avgComputeMsToPerfection} vs ${runner.avgComputeMsToPerfection} norm-ms`
        : '';
    const scopeTag = sameInputs
      ? `${parseInputCount(leader.topologyLabel)}-in`
      : 'cross-sensor';
    isoParamComparisons.push(
      `Iso-Param (~${leader.parameterCount}p, ${scopeTag}): ${leader.topologyLabel} (${leader.hiddenNeuronCount}n, D${leader.depth}) beat ${runner.topologyLabel} (${runner.hiddenNeuronCount}n, D${runner.depth}) — ${leader.perfectRate}% vs ${runner.perfectRate}% perf, ${leader.meanMinSeedScore.toLocaleString()} vs ${runner.meanMinSeedScore.toLocaleString()} mean pipes${compDelta}.`
    );
  }

  const byNeuron = new Map<number, TopologyFinding[]>();
  for (const t of activeTopos) {
    if (t.hiddenNeuronCount < 4) continue;
    const list = byNeuron.get(t.hiddenNeuronCount) ?? [];
    list.push(t);
    byNeuron.set(t.hiddenNeuronCount, list);
  }
  for (const [neurons, group] of byNeuron.entries()) {
    if (group.length < 2) continue;
    const sortedG = [...group].sort((a, b) => a.weightCount - b.weightCount);
    const lean = sortedG[0];
    const dense = sortedG[sortedG.length - 1];
    if (lean.weightCount === dense.weightCount) continue;
    isoNeuronComparison = `Iso-Neuron (${neurons} hidden): lean ${lean.topologyLabel} (${lean.weightCount}w, D${lean.depth}) hit ${lean.perfectRate}% perf vs dense ${dense.topologyLabel} (${dense.weightCount}w, D${dense.depth}) at ${dense.perfectRate}%.`;
    break;
  }
  const neuronVsWeightAnalysis = [
    ...isoParamComparisons,
    ...(isoNeuronComparison ? [isoNeuronComparison] : []),
  ].join(' ');

  // Mechanistic Policy Analysis across verified-perfect (or top-scoring) networks (6-sensor safe)
  const profiledPool = results.filter(
    (r) => r.verifiedPerfect && r.policyProfile
  );
  const mechSource =
    profiledPool.length > 0
      ? profiledPool
      : [...results]
          .filter((r) => r.policyProfile)
          .sort((a, b) => b.minSeedScore - a.minSeedScore)
          .slice(0, 12);

  let mechanisticAggregate: MechanisticAggregate | null = null;
  let policyMechanismSummary = '';
  if (mechSource.length > 0) {
    const sensorCount = SENSOR_NAMES.length;
    const impSum = new Array<number>(sensorCount).fill(0);
    let sparseSum = 0;
    let normSum = 0;
    let bestLinearFormula: string | null = null;

    for (const r of mechSource) {
      const p = r.policyProfile!;
      for (let j = 0; j < sensorCount; j++) {
        impSum[j] += p.sensorImportance[j] ?? 0;
      }
      sparseSum += p.sparsityRatio;
      normSum += p.weightL2Norm;
      if (!bestLinearFormula && p.linearFormula) {
        bestLinearFormula = p.linearFormula;
      }
    }
    const n = mechSource.length;
    const avgImp = impSum.map((v) => Number((v / n).toFixed(1)));
    const avgSparse = Number((sparseSum / n).toFixed(2));
    const avgNorm = Number((normSum / n).toFixed(2));
    mechanisticAggregate = {
      sampleCount: n,
      avgSensorImportance: avgImp,
      avgSparsityRatio: avgSparse,
      avgWeightL2Norm: avgNorm,
      bestLinearFormula,
    };

    const rankedSensors = SENSOR_NAMES.map((name, idx) => ({
      name,
      pct: avgImp[idx] ?? 0,
    })).sort((a, b) => b.pct - a.pct);

    const activeRanked = rankedSensors.filter((s) => s.pct > 0);
    const tailSensor =
      activeRanked[activeRanked.length - 1] ?? rankedSensors[rankedSensors.length - 1];

    policyMechanismSummary = `Across ${n.toLocaleString()} top policies, decision sensitivity concentrates on ${rankedSensors[0].name} (${rankedSensors[0].pct}%) and ${rankedSensors[1].name} (${rankedSensors[1].pct}%), while ${tailSensor.name} contributes only ${tailSensor.pct}%. Average weight L2 norm is ${avgNorm} with ${Math.round(avgSparse * 100)}% near-zero synapses.${
      bestLinearFormula
        ? ` Sample verified linear control law: ${bestLinearFormula}.`
        : ''
    }`;
  }

  // Hyperparameter Sweet-Spot Analysis (Hardware-Independent)
  const comboMap = new Map<
    string,
    {
      algo: LearningAlgorithm;
      pop: number;
      mutStr: number;
      n: number;
      perfect: number;
      scoreSum: number;
      episodesSum: number;
      computeSum: number;
    }
  >();
  for (const r of results) {
    const key = `${r.algorithm}|${r.populationSize}|${r.mutationStrength}`;
    const entry = comboMap.get(key) ?? {
      algo: r.algorithm,
      pop: r.populationSize,
      mutStr: r.mutationStrength,
      n: 0,
      perfect: 0,
      scoreSum: 0,
      episodesSum: 0,
      computeSum: 0,
    };
    entry.n += 1;
    if (r.verifiedPerfect) entry.perfect += 1;
    entry.scoreSum += r.minSeedScore;
    entry.episodesSum += getTrialEpisodes(r);
    entry.computeSum += getTrialComputeMs(r);
    comboMap.set(key, entry);
  }
  const rankedCombos = Array.from(comboMap.values()).sort((a, b) => {
    const rateA = a.perfect / a.n;
    const rateB = b.perfect / b.n;
    if (Math.abs(rateB - rateA) > 0.01) return rateB - rateA;
    const meanA = a.scoreSum / a.n;
    const meanB = b.scoreSum / b.n;
    if (Math.abs(meanB - meanA) > 50) return meanB - meanA;
    return a.computeSum / a.n - b.computeSum / b.n;
  });

  let hyperparameterSweetSpot = '';
  if (rankedCombos.length > 0) {
    const best = rankedCombos[0];
    const ratePct = ((best.perfect / best.n) * 100).toFixed(1);
    const meanScore = Math.round(best.scoreSum / best.n);
    const avgEvals = Math.round(best.episodesSum / best.n);
    const avgNorm = (best.computeSum / best.n).toFixed(1);
    hyperparameterSweetSpot = `Best empirical configuration: ${ALGORITHM_SHORT_LABELS[best.algo]} with Pop ${best.pop} and Sigma ${best.mutStr.toFixed(2)} (${ratePct}% perfection across ${best.n} trials, mean ${meanScore.toLocaleString()} pipes, avg ${avgEvals.toLocaleString()} bird-evals / ${avgNorm} norm-ms).`;
  }

  // World Models & Complex Environment Implications + Next-Iteration Recommendations
  const worldModelImplications: string[] = [];
  const nextIterationRecommendations: string[] = [];

  const rankedAlgos = [...perAlgorithm]
    .filter((a) => a.trialCount > 0)
    .sort(
      (a, b) =>
        (b.solvedRegimePerfectRate ?? b.perfectRate) -
          (a.solvedRegimePerfectRate ?? a.perfectRate) ||
        (a.avgComputeMsToPerfection ?? Infinity) -
          (b.avgComputeMsToPerfection ?? Infinity)
    );

  if (rankedAlgos.length > 0) {
    const bestAlgo = rankedAlgos[0];
    const withDyn = perAlgorithm.filter((a) => a.dynamicTrials > 0);
    if (withDyn.length > 0) {
      const dynLeader = [...withDyn].sort(
        (a, b) =>
          (b.dynamicPerfectRate ?? -1) - (a.dynamicPerfectRate ?? -1) ||
          b.meanMinSeedScore - a.meanMinSeedScore
      )[0];
      if (bestAlgo.algorithm === dynLeader.algorithm) {
        worldModelImplications.push(
          `Optimizer Selection under Non-Stationarity: ${ALGORITHM_LABELS[bestAlgo.algorithm]} led both solved regimes (${bestAlgo.solvedRegimePerfectRate ?? bestAlgo.perfectRate}% perf, ${bestAlgo.avgComputeMsToPerfection ?? '—'} norm-ms) and dynamic scenarios (${dynLeader.dynamicPerfectRate ?? 0}% across ${dynLeader.dynamicTrials.toLocaleString()} trials).`
        );
      } else {
        worldModelImplications.push(
          `Optimizer Selection under Non-Stationarity: ${ALGORITHM_LABELS[bestAlgo.algorithm]} led solved-regime consistency (${bestAlgo.solvedRegimePerfectRate ?? bestAlgo.perfectRate}% perf, ${bestAlgo.avgComputeMsToPerfection ?? '—'} norm-ms), while ${ALGORITHM_LABELS[dynLeader.algorithm]} topped dynamic trials (${dynLeader.dynamicPerfectRate ?? 0}% across ${dynLeader.dynamicTrials.toLocaleString()} trials).`
        );
      }
    }
    const weakAlgos = rankedAlgos.filter(
      (a) =>
        a.trialCount >= 20 &&
        (a.solvedRegimePerfectRate ?? a.perfectRate) <
          (bestAlgo.solvedRegimePerfectRate ?? bestAlgo.perfectRate) - 6
    );
    if (weakAlgos.length > 0) {
      nextIterationRecommendations.push(
        `Prune underperforming optimizers (${weakAlgos
          .map((a) => ALGORITHM_SHORT_LABELS[a.algorithm])
          .join(', ')}) to reclaim sweep budget for top performers (${rankedAlgos
          .slice(0, 4)
          .map((a) => ALGORITHM_SHORT_LABELS[a.algorithm])
          .join(', ')}).`
      );
    }
  }

  const activeArches = perArchitecture.filter((a) => a.trialCount > 0);
  if (activeArches.length > 1) {
    const rankedArches = [...activeArches].sort(
      (a, b) =>
        b.perfectRate - a.perfectRate || b.meanMinSeedScore - a.meanMinSeedScore
    );
    const bestArch = rankedArches[0];
    const mlpArch = activeArches.find((a) => a.architecture === 'MLP');
    if (mlpArch && bestArch.architecture !== 'MLP') {
      worldModelImplications.push(
        `Bio-Inspired Neuron Gain: ${bestArch.label} achieved ${bestArch.perfectRate}% perfection (${bestArch.meanMinSeedScore} mean pipes, avg ${bestArch.avgParams}p) vs standard MLP at ${mlpArch.perfectRate}% (${mlpArch.meanMinSeedScore} mean pipes) — stateful temporal dynamics help infer unmeasured state.`
      );
    } else if (bestArch) {
      worldModelImplications.push(
        `Architecture Comparison: ${bestArch.label} led ${activeArches.length} tested neuron families with ${bestArch.perfectRate}% perfection (${bestArch.meanMinSeedScore} mean pipes, avg ${bestArch.avgParams}p).`
      );
    }
  }

  const activePrecs = perPrecision.filter((p) => p.trialCount > 0);
  if (activePrecs.length > 1) {
    const bestBitEff = [...activePrecs].sort(
      (a, b) => b.maxPipesPerBit - a.maxPipesPerBit
    )[0];
    const fp32 = activePrecs.find((p) => p.precision === 'FP32');
    worldModelImplications.push(
      `Bit-Precision Compression: ${bestBitEff.label} (${bestBitEff.bitsPerParam}b/param) peaked at ${bestBitEff.maxPipesPerBit} pipes/bit (${bestBitEff.perfectRate}% perf, avg ${bestBitEff.avgTotalBits} total bits)${
        fp32 && fp32.precision !== bestBitEff.precision
          ? ` vs FP32 at ${fp32.perfectRate}% perf (avg ${fp32.avgTotalBits} bits).`
          : '.'
      }`
    );
  }

  if (regimeSplit.unsolvedComputePct >= 40) {
    const testedPipeVy = perInputSet.some((s) => s.hasPipeVy && s.trialCount > 0);
    nextIterationRecommendations.push(
      `${regimeSplit.unsolvedScenarios.length} unsolved frontier scenarios consumed ${regimeSplit.unsolvedComputePct}% of total compute (${regimeSplit.unsolvedTrials.toLocaleString()} trials). ${
        testedPipeVy
          ? 'Compare Pipe Vy vs non-PVy subsets to verify whether gap-velocity observability breaks the moving-narrow ceiling.'
          : 'Run the Pipe Vy Frontier preset next: moving narrow pipes require explicit pipe vertical velocity (PVy) observability.'
      }`
    );
  }

  if (generationDistribution.g1Pct >= 35) {
    nextIterationRecommendations.push(
      `${generationDistribution.g1Pct}% of perfect runs solved in Generation 1 — enable Parallel Audit Fan-Out & Turbo Workers so multi-seed verification does not bottleneck fast-converging topologies.`
    );
  }

  if (coverageGaps.length > 0) {
    nextIterationRecommendations.push(
      `Use Balanced (Zigzag) queue scheduling to close untested coverage gaps: ${coverageGaps.join('; ')}.`
    );
  }

  if (shallow.length > 0 && deep.length > 0) {
    const shallowCompute = avg(
      shallow.filter((t) => t.avgComputeMsToPerfection !== null),
      (t) => t.avgComputeMsToPerfection ?? 0
    );
    const deepCompute = avg(
      deep.filter((t) => t.avgComputeMsToPerfection !== null),
      (t) => t.avgComputeMsToPerfection ?? 0
    );
    if (shallowCompute > 0 && deepCompute > 0) {
      worldModelImplications.push(
        `Latent Controller Bottleneck Sizing: Depth 0–1 controllers needed ${shallowCompute.toFixed(1)} norm-ms vs ${deepCompute.toFixed(1)} norm-ms for Depth 2+ networks (${(deepCompute / shallowCompute).toFixed(1)}× compute cost).`
      );
    }
  }

  const genRatios = results
    .filter((r) => r.bestScore > 0)
    .map((r) => r.generalizationRatio);
  if (genRatios.length > 0) {
    const meanGen =
      (genRatios.reduce((a, b) => a + b, 0) / genRatios.length) * 100;
    worldModelImplications.push(
      `Generalization vs. Memorization Ratio: Across ${results.length.toLocaleString()} trials, unseen-seed worst-case retention averaged ${meanGen.toFixed(0)}% of peak training score.`
    );
  }

  // Aggregate Failure Autopsy across non-perfect / failed-seed trials
  let autopsyFailedTrials = 0;
  let autopsyTotalDeaths = 0;
  let autopsyVySum = 0;
  let autopsyGapSum = 0;
  let autopsyGenGapSum = 0;
  const autopsyCauses: Record<FailureCause, number> = {
    NONE: 0,
    FLOOR: 0,
    CEILING: 0,
    PIPE_TOP: 0,
    PIPE_BOTTOM: 0,
  };
  for (const r of results) {
    const a = r.failureAutopsy;
    if (!a || a.totalDeaths <= 0) continue;
    autopsyFailedTrials += 1;
    autopsyTotalDeaths += a.totalDeaths;
    autopsyCauses.FLOOR += a.floorDeaths;
    autopsyCauses.CEILING += a.ceilingDeaths;
    autopsyCauses.PIPE_TOP += a.pipeTopDeaths;
    autopsyCauses.PIPE_BOTTOM += a.pipeBottomDeaths;
    autopsyVySum += a.avgDeathAbsVy * a.totalDeaths;
    autopsyGapSum += a.avgDeathGapErr * a.totalDeaths;
    autopsyGenGapSum += a.generalizationGap;
  }
  let dominantAutopsyCause: FailureCause = 'NONE';
  let maxCauseCount = 0;
  (['FLOOR', 'CEILING', 'PIPE_TOP', 'PIPE_BOTTOM'] as FailureCause[]).forEach((c) => {
    if (autopsyCauses[c] > maxCauseCount) {
      maxCauseCount = autopsyCauses[c];
      dominantAutopsyCause = c;
    }
  });
  const autopsySummary: AutopsyAggregate | null =
    autopsyTotalDeaths > 0
      ? {
          failedTrials: autopsyFailedTrials,
          totalDeaths: autopsyTotalDeaths,
          causes: autopsyCauses,
          dominantFailure: dominantAutopsyCause,
          avgDeathAbsVy: Number((autopsyVySum / autopsyTotalDeaths).toFixed(2)),
          avgDeathGapErr: Number((autopsyGapSum / autopsyTotalDeaths).toFixed(1)),
          avgGeneralizationGap: Number(
            (autopsyGenGapSum / Math.max(1, autopsyFailedTrials)).toFixed(1)
          ),
        }
      : null;

  // Aggregate Reasoning Telemetry (Ponder ACT System 1 vs 2, Latent Rollout, Selective SSM)
  let rSampleCount = 0;
  let ponderTrials = 0;
  let ponderAvgSum = 0;
  let ponderCalmSum = 0;
  let ponderDangerSum = 0;
  let ponderS2Sum = 0;
  let rolloutTrials = 0;
  let rolloutAdvSum = 0;
  let ssmTrials = 0;
  let ssmGateSum = 0;
  for (const r of results) {
    const rt = r.reasoningTelemetry;
    if (!rt) continue;
    rSampleCount += 1;
    if (
      r.architecture === 'PONDER_ACT' ||
      r.architecture === 'LOOPED_REASONER'
    ) {
      ponderTrials += 1;
      ponderAvgSum += rt.avgPonderSteps;
      ponderCalmSum += rt.calmPonderSteps;
      ponderDangerSum += rt.dangerPonderSteps;
      ponderS2Sum += rt.system2Ratio;
    }
    if (rt.avgRolloutAdvantage !== undefined) {
      rolloutTrials += 1;
      rolloutAdvSum += rt.avgRolloutAdvantage;
    }
    if (rt.avgSsmGate !== undefined) {
      ssmTrials += 1;
      ssmGateSum += rt.avgSsmGate;
    }
  }
  const avgCalm =
    ponderTrials > 0 ? Number((ponderCalmSum / ponderTrials).toFixed(2)) : null;
  const avgDanger =
    ponderTrials > 0 ? Number((ponderDangerSum / ponderTrials).toFixed(2)) : null;
  const reasoningSummary: ReasoningAggregate | null =
    rSampleCount > 0
      ? {
          sampleCount: rSampleCount,
          ponderTrials,
          avgPonderSteps:
            ponderTrials > 0 ? Number((ponderAvgSum / ponderTrials).toFixed(2)) : null,
          calmPonderSteps: avgCalm,
          dangerPonderSteps: avgDanger,
          dangerVsCalmDelta:
            avgCalm !== null && avgDanger !== null
              ? Number((avgDanger - avgCalm).toFixed(2))
              : null,
          avgSystem2Ratio:
            ponderTrials > 0
              ? Number(((ponderS2Sum / ponderTrials) * 100).toFixed(1))
              : null,
          rolloutTrials,
          avgRolloutAdvantage:
            rolloutTrials > 0
              ? Number((rolloutAdvSum / rolloutTrials).toFixed(3))
              : null,
          ssmTrials,
          avgSsmGate:
            ssmTrials > 0 ? Number((ssmGateSum / ssmTrials).toFixed(3)) : null,
        }
      : null;

  // Aggregate Learning Dynamics taxonomy
  const dynCounts: Record<LearningDynamicKind, number> = {
    G1_INSTANT: 0,
    SMOOTH_CLIMB: 0,
    PHASE_TRANSITION: 0,
    PLATEAU: 0,
    OVERFIT_COLLAPSE: 0,
  };
  let totalClassified = 0;
  for (const r of results) {
    if (r.learningDynamic) {
      dynCounts[r.learningDynamic] += 1;
      totalClassified += 1;
    }
  }
  const learningDynamicsSummary: LearningDynamicsAggregate | null =
    totalClassified > 0 ? { totalClassified, counts: dynCounts } : null;

  // Morphogenesis A/B Comparison (Static vs Self-Growing Masked Super-Network)
  const staticTrialsList = results.filter(
    (r) => (r.morphogenesisMode ?? 'STATIC') !== 'GROWING'
  );
  const growingTrialsList = results.filter(
    (r) => r.morphogenesisMode === 'GROWING'
  );
  let morphogenesisComparison: MorphogenesisComparisonStats | null = null;
  if (growingTrialsList.length > 0) {
    const abDiff =
      staticTrialsList.length > 0
        ? computePairedABDiff(
            staticTrialsList,
            growingTrialsList,
            'Static',
            'Morphogenesis'
          )
        : null;
    const meanScore = (arr: ResearchTrialResult[]) =>
      arr.length > 0
        ? Number(
            (arr.reduce((s, r) => s + r.minSeedScore, 0) / arr.length).toFixed(1)
          )
        : 0;
    const perfRate = (arr: ResearchTrialResult[]) =>
      arr.length > 0
        ? Number(
            (
              (arr.filter((r) => r.verifiedPerfect).length / arr.length) *
              100
            ).toFixed(1)
          )
        : 0;
    const withSummary = growingTrialsList.filter((r) => r.morphogenesisSummary);
    const msN = withSummary.length;
    const avgMs = (fn: (r: ResearchTrialResult) => number) =>
      msN > 0
        ? Number((withSummary.reduce((s, r) => s + fn(r), 0) / msN).toFixed(1))
        : null;
    const avgInitP = avgMs((r) => r.morphogenesisSummary!.initialActiveParams);
    const avgFinalP = avgMs((r) => r.morphogenesisSummary!.finalActiveParams);
    morphogenesisComparison = {
      staticTrials: staticTrialsList.length,
      growingTrials: growingTrialsList.length,
      staticPerfectRate: perfRate(staticTrialsList),
      growingPerfectRate: perfRate(growingTrialsList),
      staticMeanMinSeed: meanScore(staticTrialsList),
      growingMeanMinSeed: meanScore(growingTrialsList),
      matchedPairs: abDiff?.matchedPairs ?? 0,
      winsGrowing: abDiff?.winsB ?? 0,
      winsStatic: abDiff?.winsA ?? 0,
      ties: abDiff?.ties ?? 0,
      meanDeltaScore: abDiff?.meanDeltaScore ?? 0,
      signTestPValue: abDiff?.signTestPValue ?? null,
      avgInitialParams: avgInitP,
      avgFinalParams: avgFinalP,
      avgParamGrowthRatio:
        avgInitP !== null && avgFinalP !== null && avgInitP > 0
          ? Number((avgFinalP / avgInitP).toFixed(2))
          : null,
      avgPrunedSynapses: avgMs((r) => r.morphogenesisSummary!.prunedSynapses),
      avgGrowthEvents: avgMs((r) => r.morphogenesisSummary!.growthEventsCount),
      avgPruneEvents: avgMs((r) => r.morphogenesisSummary!.pruneEventsCount),
      avgFinalK: avgMs((r) => r.morphogenesisSummary!.finalReasoningSteps),
      avgFinalSensors: avgMs((r) => r.morphogenesisSummary!.finalActiveSensors),
    };
  }

  // 12-Sensor Discovery Meta-Analysis ("Why & When" each sensor helps)
  const SENSOR_META_GUIDE: Record<
    SensorFeatureId,
    { why: string; when: string }
  > = {
    BIRD_Y: {
      why: 'Anchors absolute altitude to detect impending floor/ceiling limits.',
      when: 'Optional when Top/Bot clearances exist; helpful for floor/ceiling safety under extreme gravity.',
    },
    VEL_VY: {
      why: 'Exposes vertical momentum so policies brake early before hitting lips.',
      when: 'Critical on Heavy Gravity, Moving Pipes, and variable speeds where position alone lags.',
    },
    PIPE_DX: {
      why: 'Measures horizontal distance to Pipe #1 trailing edge to time final clearance flaps.',
      when: 'Universally valuable across all regimes (2-in DX+Bot unlocks multi-pipe alignment).',
    },
    TOP_CLEAR: {
      why: 'Measures exact margin below Pipe #1 upper lip (y - gapTop) without hardcoding gap width.',
      when: 'Essential whenever gapVariance > 0 or movingPipes oscillate the top lip downward.',
    },
    BOT_CLEAR: {
      why: 'Primary jump threshold anchor: triggers flap whenever descending toward lower lip.',
      when: 'Core signal in every regime; Bot-first pairs already solve static Easy courses.',
    },
    PIPE_VY: {
      why: 'Instantaneous vertical velocity of moving Pipe #1 gap (disambiguates static position).',
      when: 'Vital on Hard/Insane moving-pipe scenarios; zero-variance noise on static courses.',
    },
    NEXT_PIPE_DY: {
      why: 'Lookahead center delta between Pipe #1 and Pipe #2 for early altitude pre-positioning.',
      when: 'Reduces recovery overshoot on high-speed dynamic gaps with short inter-pipe flight.',
    },
    NEXT_TOP_CLEAR: {
      why: 'Relative clearance to Pipe #2 upper lip from bird altitude (invariant to gap width).',
      when: 'Pairs with Next Bot to plan Pipe #1→#2 transitions cleanly under high speed/variance.',
    },
    NEXT_BOT_CLEAR: {
      why: 'Relative clearance to Pipe #2 bottom lip — allows single-frame Bot-first lookahead.',
      when: 'High leverage in Dual-Pipe Bot/Geo presets when Pipe #2 spawns steeply higher.',
    },
    NEXT_PIPE_DX: {
      why: 'Horizontal distance to Pipe #2 so agents weight lookahead urgency dynamically.',
      when: 'High impact when random spacing & speed gusts vary time-between-pipes.',
    },
    NEXT_PIPE_VY: {
      why: 'Vertical motion of Pipe #2 gap for multi-step trajectory planning.',
      when: 'Frontier moving+fast courses where exiting Pipe #1 requires predicting Pipe #2 intercept.',
    },
    PIPE_TTF: {
      why: 'Wind-compensated Time-To-Pipe (DX / tickSpeed) normalizes variable gust speeds into frames left.',
      when: 'Strongest stabilizer under gusty Medium/Hard/Insane winds where spatial DX deceives.',
    },
  };

  const trialHasMoving = new Map<DifficultyPreset, boolean>();
  const trialHasTurb = new Map<DifficultyPreset, boolean>();
  for (const r of results) {
    if (!trialHasMoving.has(r.difficulty)) {
      const env = resolveEnvironment(r.difficulty, config.customEnvironment);
      trialHasMoving.set(r.difficulty, env.movingPipes);
      trialHasTurb.set(r.difficulty, env.speedVariability >= 0.15);
    }
  }

  const sensorFindings: SensorAttributionFinding[] = ALL_SENSOR_FEATURES.map(
    (sensor) => {
      const meta = SENSOR_METADATA[sensor];
      const withList: ResearchTrialResult[] = [];
      const withoutList: ResearchTrialResult[] = [];
      let jacSum = 0;
      let jacCount = 0;

      for (const r of results) {
        const feats = normalizeInputFeatures(r.inputFeatures);
        if (feats.includes(sensor)) {
          withList.push(r);
          if (r.policyProfile) {
            jacSum += r.policyProfile.sensorImportance[meta.index] ?? 0;
            jacCount += 1;
          }
        } else {
          withoutList.push(r);
        }
      }

      const avgScore = (arr: ResearchTrialResult[]) =>
        arr.length > 0
          ? Number(
              (arr.reduce((s, x) => s + x.minSeedScore, 0) / arr.length).toFixed(1)
            )
          : 0;
      const meanWith = avgScore(withList);
      const meanWithout = avgScore(withoutList);
      const marginalLift =
        withList.length > 0 && withoutList.length > 0
          ? Number((meanWith - meanWithout).toFixed(1))
          : 0;

      const regimeLift = (pred: (r: ResearchTrialResult) => boolean): number | null => {
        const wSub = withList.filter(pred);
        const woSub = withoutList.filter(pred);
        if (wSub.length === 0 || woSub.length === 0) return null;
        return Number((avgScore(wSub) - avgScore(woSub)).toFixed(1));
      };

      const guide = SENSOR_META_GUIDE[sensor];
      return {
        sensor,
        label: meta.label,
        shortLabel: meta.shortLabel,
        group: meta.group,
        trialsWithSensor: withList.length,
        trialsWithoutSensor: withoutList.length,
        meanScoreWith: meanWith,
        meanScoreWithout: meanWithout,
        marginalLift,
        staticLift: regimeLift((r) => !trialHasMoving.get(r.difficulty) && !trialHasTurb.get(r.difficulty)),
        movingLift: regimeLift((r) => Boolean(trialHasMoving.get(r.difficulty))),
        turbulentLift: regimeLift((r) => Boolean(trialHasTurb.get(r.difficulty))),
        avgJacobianSharePct:
          jacCount > 0 ? Number((jacSum / jacCount).toFixed(1)) : 0,
        whyItHelps: guide.why,
        whenItHelps: guide.when,
      };
    }
  );

  const testedSensors = sensorFindings.filter((s) => s.trialsWithSensor > 0);
  const topHelpfulSensor =
    [...testedSensors]
      .filter((s) => s.trialsWithoutSensor > 0)
      .sort((a, b) => b.marginalLift - a.marginalLift || b.avgJacobianSharePct - a.avgJacobianSharePct)[0]
      ?.sensor ??
    [...testedSensors].sort((a, b) => b.avgJacobianSharePct - a.avgJacobianSharePct)[0]
      ?.sensor ??
    null;

  const botMinimal = perInputSet.filter(
    (s) =>
      s.trialCount > 0 &&
      s.features.includes('BOT_CLEAR') &&
      !s.features.includes('TOP_CLEAR')
  );
  const withTop = perInputSet.filter(
    (s) => s.trialCount > 0 && s.features.includes('TOP_CLEAR')
  );
  let botFirstNote =
    'Bot-first subsets rely on relative clearance above Pipe #1/#2 lower lips without explicit top-lip bounds.';
  if (botMinimal.length > 0 && withTop.length > 0) {
    const botBest = Math.max(...botMinimal.map((s) => s.meanMinSeedScore));
    const topBest = Math.max(...withTop.map((s) => s.meanMinSeedScore));
    botFirstNote = `Bot-only / Dual-Bot subsets (omitting Top Clear) peaked at ${botBest} mean min-seed pipes vs ${topBest} when explicit Top Clear is supplied (${topBest > botBest ? 'Top Clear reduces head-bonk collisions when gaps vary/move' : 'Bot-first matches or exceeds Top-included baselines cleanly'}).`;
  }
  const sensorDiscovery: SensorDiscoverySummary | null =
    testedSensors.length > 0
      ? {
          totalTestedSensors: testedSensors.length,
          topHelpfulSensor,
          sensors: sensorFindings,
          botFirstNote,
        }
      : null;

  // Compute-Justified Plasticity: FLOPs/Frame Pareto Frontier, Hardware Auto-Routing, Hybrid ROI & Islands
  const resolvedTrials = results.map((r) => {
    const arch = r.architecture ?? 'MLP';
    const evoMode = r.evolutionTopologyMode ?? 'SINGLE_SPECIES';
    const profile: ComputeProfileKind =
      r.computeProfile ?? getTrialComputeProfile(arch, evoMode);
    const flops =
      typeof r.meanFlopsPerFrame === 'number' && r.meanFlopsPerFrame > 0
        ? r.meanFlopsPerFrame
        : estimateArchitectureFlops(
            r.topology,
            r.inputCount ?? r.inputFeatures?.length ?? 5,
            arch,
            r.reasoningSteps ?? 3,
            r.morphogenesisSummary?.activeExperts
          );
    const eff =
      typeof r.computeEfficiencyScore === 'number' && r.computeEfficiencyScore > 0
        ? r.computeEfficiencyScore
        : flops > 0
          ? Number((r.minSeedScore / (flops / 100)).toFixed(2))
          : 0;
    return { r, arch, evoMode, profile, flops, eff };
  });

  // Pareto Frontier (Score vs FLOPs/frame): keep non-dominated points sorted by ascending FLOPs
  const sortedByFlops = [...resolvedTrials].sort(
    (a, b) => a.flops - b.flops || b.r.minSeedScore - a.r.minSeedScore
  );
  const paretoFrontier: ParetoFrontierPoint[] = [];
  let maxScoreOnFrontier = -Infinity;
  for (const item of sortedByFlops) {
    if (item.r.minSeedScore > maxScoreOnFrontier) {
      maxScoreOnFrontier = item.r.minSeedScore;
      paretoFrontier.push({
        trialId: item.r.id,
        label: `${ARCH_DIGEST_SHORT[item.arch] ?? item.arch} ${item.r.topologyLabel}`,
        architecture: item.arch,
        topologyLabel: item.r.topologyLabel,
        difficulty: item.r.difficulty,
        computeProfile: item.profile,
        minSeedScore: item.r.minSeedScore,
        meanFlopsPerFrame: Number(item.flops.toFixed(1)),
        efficiencyScore: item.eff,
        verifiedPerfect: item.r.verifiedPerfect,
      });
    }
  }

  let flopsSum = 0;
  let minFlops = Infinity;
  let maxFlops = 0;
  let effSum = 0;
  let hybridTrials = 0;
  let totalRollbacks = 0;
  let totalCommits = 0;
  let roiSum = 0;
  let roiCount = 0;

  let gpuTrials = 0;
  let gpuPerfect = 0;
  let gpuScoreSum = 0;
  let gpuFlopsSum = 0;
  let cpuTrials = 0;
  let cpuPerfect = 0;
  let cpuScoreSum = 0;
  let cpuFlopsSum = 0;

  const islandWinnerBuckets = new Map<
    NetworkArchitecture,
    { wins: number; scoreSum: number; flopsSum: number }
  >();
  let totalIslandTrials = 0;
  let rebalanceEventsTotal = 0;

  for (const item of resolvedTrials) {
    flopsSum += item.flops;
    if (item.flops < minFlops) minFlops = item.flops;
    if (item.flops > maxFlops) maxFlops = item.flops;
    effSum += item.eff;

    if (item.arch === 'HYBRID_MOE') {
      hybridTrials += 1;
      totalRollbacks += item.r.morphogenesisSummary?.rollbackCount ?? 0;
      totalCommits += item.r.morphogenesisSummary?.committedExpertsCount ?? 0;
    }
    if (typeof item.r.morphogenesisSummary?.computeRoiScore === 'number') {
      roiSum += item.r.morphogenesisSummary.computeRoiScore;
      roiCount += 1;
    }

    if (item.profile === 'CPU_SPECIALIZED') {
      cpuTrials += 1;
      if (item.r.verifiedPerfect) cpuPerfect += 1;
      cpuScoreSum += item.r.minSeedScore;
      cpuFlopsSum += item.flops;
    } else {
      gpuTrials += 1;
      if (item.r.verifiedPerfect) gpuPerfect += 1;
      gpuScoreSum += item.r.minSeedScore;
      gpuFlopsSum += item.flops;
    }

    if (item.r.islandSummary?.enabled) {
      totalIslandTrials += 1;
      rebalanceEventsTotal += item.r.islandSummary.rebalanceCount ?? 0;
      const winSp = item.r.islandSummary.winningSpecies;
      const prev = islandWinnerBuckets.get(winSp) ?? {
        wins: 0,
        scoreSum: 0,
        flopsSum: 0,
      };
      prev.wins += 1;
      prev.scoreSum += item.r.minSeedScore;
      prev.flopsSum += item.flops;
      islandWinnerBuckets.set(winSp, prev);
    }
  }

  const computeRoiSummary: ComputeRoiSummary | null =
    resolvedTrials.length > 0
      ? {
          avgFlopsPerFrame: Number((flopsSum / resolvedTrials.length).toFixed(1)),
          minFlopsPerFrame: minFlops === Infinity ? 0 : Number(minFlops.toFixed(1)),
          maxFlopsPerFrame: Number(maxFlops.toFixed(1)),
          avgEfficiencyScore: Number((effSum / resolvedTrials.length).toFixed(2)),
          hybridTrials,
          totalRollbacks,
          totalCommits,
          avgRoiScore: roiCount > 0 ? Number((roiSum / roiCount).toFixed(2)) : null,
        }
      : null;

  const hardwareRoutingSummary: HardwareRoutingSummary | null =
    resolvedTrials.length > 0
      ? {
          gpuLockstepTrials: gpuTrials,
          cpuSpecializedTrials: cpuTrials,
          gpuPerfectRate:
            gpuTrials > 0 ? Number(((gpuPerfect / gpuTrials) * 100).toFixed(1)) : null,
          cpuPerfectRate:
            cpuTrials > 0 ? Number(((cpuPerfect / cpuTrials) * 100).toFixed(1)) : null,
          gpuMeanScore:
            gpuTrials > 0 ? Number((gpuScoreSum / gpuTrials).toFixed(1)) : null,
          cpuMeanScore:
            cpuTrials > 0 ? Number((cpuScoreSum / cpuTrials).toFixed(1)) : null,
          gpuMeanFlops:
            gpuTrials > 0 ? Number((gpuFlopsSum / gpuTrials).toFixed(1)) : null,
          cpuMeanFlops:
            cpuTrials > 0 ? Number((cpuFlopsSum / cpuTrials).toFixed(1)) : null,
        }
      : null;

  const islandWinnerSummary: IslandWinnerSummary | null =
    totalIslandTrials > 0
      ? {
          totalIslandTrials,
          rebalanceEventsTotal,
          winners: Array.from(islandWinnerBuckets.entries())
            .map(([species, st]) => ({
              species,
              label: ARCHITECTURE_META[species]?.label ?? species,
              wins: st.wins,
              winSharePct: Number(((st.wins / totalIslandTrials) * 100).toFixed(1)),
              meanScore: Number((st.scoreSum / st.wins).toFixed(1)),
              meanFlops: Number((st.flopsSum / st.wins).toFixed(1)),
            }))
            .sort((a, b) => b.wins - a.wins || b.meanScore - a.meanScore),
        }
      : null;

  return {
    totalTrials,
    totalPerfect,
    mostDenseTrial,
    mostBitEfficientTrial,
    fastestPerfectTrial,
    overallBestTrial,
    perDifficulty,
    perAlgorithm,
    perTopology,
    perInputSet,
    perArchitecture,
    perPrecision,
    mechanisticAggregate,
    autopsySummary,
    reasoningSummary,
    learningDynamicsSummary,
    morphogenesisComparison,
    sensorDiscovery,
    scenarioProofs,
    paretoFrontier,
    computeRoiSummary,
    hardwareRoutingSummary,
    islandWinnerSummary,
    regimeSplit,
    generationDistribution,
    hyperparamSummary,
    scenarioInputMatrix,
    unsolvedFrontierTop,
    coverageGaps,
    nextIterationRecommendations,
    abstractSummary: abstractParts.join(' '),
    capacityAnalysis: notes.join(' '),
    depthVsWidthAnalysis,
    neuronVsWeightAnalysis,
    isoParamComparisons,
    isoNeuronComparison,
    policyMechanismSummary,
    hyperparameterSweetSpot,
    worldModelImplications,
  };
}

/**
 * Generates a compact, LLM-native research digest (~15-35 KB / ~4k-9k tokens)
 * regardless of whether the sweep contains 100 or 100,000 trials.
 * Eliminates empty 0-trial rows and replaces unbounded raw dumps with
 * structured JSON metadata + stratified representative samples.
 */
export function generateMarkdownReport(
  results: ResearchTrialResult[],
  config: ResearchSweepConfig,
  findings: ResearchFindings
): string {
  const activeAlgos = findings.perAlgorithm.filter((a) => a.trialCount > 0);
  const activeTopos = findings.perTopology.filter((t) => t.trialCount > 0);
  const activeDiffs = findings.perDifficulty.filter((d) => d.totalCount > 0);
  const activeInputs = findings.perInputSet.filter((s) => s.trialCount > 0);

  // Machine-readable compact JSON header for instant LLM ingestion
  const digestJson = {
    schema: 'flappy-neurolab-llm-digest-v2',
    generatedAt: new Date().toISOString(),
    protocol: {
      targetPipeCap: config.targetPipeCap,
      verificationSeeds: config.verificationSeeds,
      maxGenerations: config.maxGenerations,
      stagnationLimit: config.stagnationLimit,
      scheduleMode: config.scheduleMode ?? 'BALANCED',
      auditParallelism: config.auditParallelism !== false,
    },
    totals: {
      trials: findings.totalTrials,
      perfect: findings.totalPerfect,
      perfectPct:
        findings.totalTrials > 0
          ? Number(((findings.totalPerfect / findings.totalTrials) * 100).toFixed(1))
          : 0,
      g1PerfectPct: findings.generationDistribution.g1Pct,
    },
    regimeSplit: {
      solvedCount: findings.regimeSplit.solvedScenarios.length,
      solvedPerfectPct: findings.regimeSplit.solvedPerfectPct,
      solvedComputePct: findings.regimeSplit.solvedComputePct,
      unsolvedCount: findings.regimeSplit.unsolvedScenarios.length,
      unsolvedScenarios: findings.regimeSplit.unsolvedScenarios,
      unsolvedComputePct: findings.regimeSplit.unsolvedComputePct,
    },
    winners: {
      fastestComputeMs: findings.fastestPerfectTrial
        ? getTrialComputeMs(findings.fastestPerfectTrial)
        : null,
      fastestSpec: findings.fastestPerfectTrial
        ? `${ALGORITHM_SHORT_LABELS[findings.fastestPerfectTrial.algorithm]}|${findings.fastestPerfectTrial.topologyLabel}|${formatArchPrecTag(findings.fastestPerfectTrial)}|${findings.fastestPerfectTrial.difficulty}`
        : null,
      peakDensity: findings.mostDenseTrial?.knowledgeDensity ?? null,
      peakDensitySpec: findings.mostDenseTrial
        ? `${findings.mostDenseTrial.topologyLabel}|${findings.mostDenseTrial.parameterCount}p|${formatArchPrecTag(findings.mostDenseTrial)}|${findings.mostDenseTrial.difficulty}`
        : null,
      peakPipesPerBit: findings.mostBitEfficientTrial?.pipesPerBit ?? null,
      peakPipesPerBitSpec: findings.mostBitEfficientTrial
        ? `${findings.mostBitEfficientTrial.topologyLabel}|${findings.mostBitEfficientTrial.totalBits ?? findings.mostBitEfficientTrial.parameterCount * 32}b|${formatArchPrecTag(findings.mostBitEfficientTrial)}|${findings.mostBitEfficientTrial.difficulty}`
        : null,
    },
    coverageGaps: findings.coverageGaps,
  };

  const lines: string[] = [
    '# Flappy NeuroLab — LLM-Ready Research Digest',
    '',
    '<!-- LLM_DIGEST_JSON_START -->',
    '```json',
    JSON.stringify(digestJson),
    '```',
    '<!-- LLM_DIGEST_JSON_END -->',
    '',
    '## 1. Experimental Protocol & Coverage Audit',
    `- **Mastery Limit**: ${config.targetPipeCap.toLocaleString()} pipes/seed · **Verification**: ${config.verificationSeeds} unseen PRNG seeds (fail-fast lockstep${config.auditParallelism !== false ? ' + parallel audit fan-out' : ''})`,
    `- **Budgets**: Max ${config.maxGenerations === null ? '∞' : config.maxGenerations} gens · Stagnation stop ${config.stagnationLimit === null ? 'Off' : `${config.stagnationLimit}g`} · Queue: ${config.scheduleMode ?? 'BALANCED'}`,
    `- **Active Coverage**: ${findings.totalTrials.toLocaleString()} trials across ${activeAlgos.length} optimizers, ${activeDiffs.length} scenarios, ${activeInputs.length} sensor subsets, ${activeTopos.length} active topologies`,
    `- **Timing Metric**: Hardware-independent Normalized Compute (norm-ms @ 10M synaptic ops/s) + Bird-Episodes (Pop × Gen)`,
  ];

  if (findings.coverageGaps.length > 0) {
    lines.push(`- **Coverage Gaps (0 trials executed)**: ${findings.coverageGaps.join(' · ')}`);
  }

  lines.push(
    '',
    '## 2. Executive Abstract, Regime Split & Convergence Profile',
    findings.abstractSummary,
    ''
  );

  // Regime split summary table
  lines.push(
    '| Regime | Scenarios | Trials | Perfect | Perf Rate | Compute Share |',
    '| :--- | :---: | :---: | :---: | :---: | :---: |',
    `| Solved Regime | ${findings.regimeSplit.solvedScenarios.length} | ${findings.regimeSplit.solvedTrials.toLocaleString()} | ${findings.regimeSplit.solvedPerfect.toLocaleString()} | ${findings.regimeSplit.solvedPerfectPct}% | ${findings.regimeSplit.solvedComputePct}% |`,
    `| Unsolved Frontier | ${findings.regimeSplit.unsolvedScenarios.length} | ${findings.regimeSplit.unsolvedTrials.toLocaleString()} | 0 | 0.0% | ${findings.regimeSplit.unsolvedComputePct}% |`,
    ''
  );

  if (findings.generationDistribution.totalPerfect > 0) {
    const gd = findings.generationDistribution;
    const pct = (n: number) => ((n / gd.totalPerfect) * 100).toFixed(1);
    lines.push(
      `**Generation Convergence (n=${gd.totalPerfect.toLocaleString()} perfect runs):** G1: ${gd.g1.toLocaleString()} (${pct(gd.g1)}%) · G2: ${gd.g2.toLocaleString()} (${pct(gd.g2)}%) · G3–5: ${gd.g3to5.toLocaleString()} (${pct(gd.g3to5)}%) · G6–15: ${gd.g6to15.toLocaleString()} (${pct(gd.g6to15)}%) · G16+: ${gd.g16Plus.toLocaleString()} (${pct(gd.g16Plus)}%)`,
      ''
    );
  }

  if (findings.depthVsWidthAnalysis) lines.push(findings.depthVsWidthAnalysis, '');
  if (findings.neuronVsWeightAnalysis) lines.push(findings.neuronVsWeightAnalysis, '');
  if (findings.hyperparameterSweetSpot)
    lines.push(`**Hyperparameter Sweet Spot:** ${findings.hyperparameterSweetSpot}`, '');
  if (findings.policyMechanismSummary)
    lines.push(`**Mechanistic Policy Summary:** ${findings.policyMechanismSummary}`, '');

  // Section 3: Optimizers (non-zero only, with Solved-Regime Perf %!)
  lines.push(
    '## 3. Optimizer Comparison (Solved-Regime & Overall)',
    '| Method | Trials | Perfect | Overall % | Solved-Regime % | Avg Compute (ms) | Avg Evals | Avg Gens | Mean Min-Seed |',
    '| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |'
  );
  const sortedAlgos = [...activeAlgos].sort(
    (a, b) =>
      (b.solvedRegimePerfectRate ?? b.perfectRate) -
        (a.solvedRegimePerfectRate ?? a.perfectRate) ||
      (a.avgComputeMsToPerfection ?? Infinity) -
        (b.avgComputeMsToPerfection ?? Infinity)
  );
  for (const a of sortedAlgos) {
    lines.push(
      `| ${ALGORITHM_SHORT_LABELS[a.algorithm]} | ${a.trialCount.toLocaleString()} | ${a.perfectCount.toLocaleString()} | ${a.perfectRate}% | ${
        a.solvedRegimePerfectRate !== null ? `${a.solvedRegimePerfectRate}%` : '—'
      } | ${
        a.avgComputeMsToPerfection !== null ? a.avgComputeMsToPerfection : '—'
      } | ${
        a.avgEpisodesToPerfection !== null
          ? a.avgEpisodesToPerfection.toLocaleString()
          : '—'
      } | ${a.avgGenerationsToPerfection ?? '—'} | ${a.meanMinSeedScore.toLocaleString()} |`
    );
  }

  // Section 4: Active Topologies (skip 0-trial empty rows!)
  lines.push(
    '',
    `## 4. Active Network Topology Scaling (${activeTopos.length} tested topologies)`,
    '| Topology | Depth | Hidden | Params | Trials | Perfect % | Mean Min-Seed | Max Density | Avg Compute (ms) | Avg Evals |',
    '| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |'
  );
  for (const t of activeTopos) {
    lines.push(
      `| ${t.topologyLabel} | D${t.depth} | ${t.hiddenNeuronCount}n | ${t.parameterCount}p | ${t.trialCount.toLocaleString()} | ${t.perfectRate}% | ${t.meanMinSeedScore.toLocaleString()} | ${t.maxDensity} | ${
        t.avgComputeMsToPerfection !== null ? t.avgComputeMsToPerfection : '—'
      } | ${
        t.avgEpisodesToPerfection !== null
          ? t.avgEpisodesToPerfection.toLocaleString()
          : '—'
      } |`
    );
  }

  // Section 5: Scenarios + Compute Share
  lines.push(
    '',
    '## 5. Scenario Mastery Frontier & Compute Allocation',
    '| Scenario | Trials | Perfect | Rate | Compute % | Min Perfect Topology | Compute (ms) | Best / Mean Min-Seed |',
    '| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |'
  );
  for (const d of activeDiffs) {
    const label = resolveEnvironment(
      d.difficulty,
      config.customEnvironment
    ).label;
    const rate = ((d.perfectCount / d.totalCount) * 100).toFixed(1);
    const minPerf = d.minimumPerfectTrial
      ? (() => {
          const mp = d.minimumPerfectTrial;
          const isNonDefault =
            (mp.architecture ?? 'MLP') !== 'MLP' ||
            (mp.weightPrecision ?? 'FP32') !== 'FP32';
          const tag = isNonDefault ? `, ${formatArchPrecTag(mp)}` : '';
          return `${mp.topologyLabel} (${mp.parameterCount}p, ${ALGORITHM_SHORT_LABELS[mp.algorithm]}${tag})`;
        })()
      : 'Unsolved';
    const compStr = d.minimumPerfectTrial
      ? `${getTrialComputeMs(d.minimumPerfectTrial).toFixed(1)}`
      : '—';
    const bestMin = d.bestTrial ? d.bestTrial.minSeedScore.toLocaleString() : '0';
    lines.push(
      `| ${label} | ${d.totalCount.toLocaleString()} | ${d.perfectCount.toLocaleString()} | ${rate}% | ${d.computeSharePct}% | ${minPerf} | ${compStr} | ${bestMin} / ${d.meanMinSeedScore} |`
    );
  }

  // Section 5b: Sensor Input Ablation (1-12 Arguments)
  if (activeInputs.length > 0) {
    lines.push(
      '',
      '## 5b. Sensor Input Ablation (1–12 Arguments & Pipe Vy Impact)',
      '| Input Subset | Args | PVy | Trials | Overall % | Solved % | Unsolved Max | Min Perf Params | Avg Compute (ms) |',
      '| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |'
    );
    for (const s of activeInputs) {
      lines.push(
        `| ${s.inputSetLabel} | ${s.inputCount} | ${s.hasPipeVy ? 'Yes' : 'No'} | ${s.trialCount.toLocaleString()} | ${s.perfectRate}% | ${
          s.solvedRegimePerfectRate !== null ? `${s.solvedRegimePerfectRate}%` : '—'
        } | ${
          s.unsolvedRegimeMaxScore !== null ? `${s.unsolvedRegimeMaxScore}p` : '—'
        } | ${s.minPerfectParams !== null ? `${s.minPerfectParams}p` : '—'} | ${
          s.avgComputeMsToPerfection !== null ? s.avgComputeMsToPerfection : '—'
        } |`
      );
    }
  }

  // Section 5c: Compact Scenario x InputCount Matrix (shows bifurcation directly)
  const observedCounts = Array.from(
    new Set(findings.scenarioInputMatrix.map((c) => c.inputCount))
  ).sort((a, b) => a - b);
  if (observedCounts.length > 1 && activeDiffs.length > 0) {
    const cellLookup = new Map(
      findings.scenarioInputMatrix.map((c) => [`${c.difficulty}|${c.inputCount}`, c])
    );
    lines.push(
      '',
      '## 5c. Scenario × Sensor Count Matrix (Solved: Perf% / Compute · Unsolved: Max / Mean)',
      `| Scenario | ${observedCounts.map((c) => `${c}-in`).join(' | ')} |`,
      `| :--- | ${observedCounts.map(() => ':---:').join(' | ')} |`
    );
    for (const d of activeDiffs) {
      const label = resolveEnvironment(
        d.difficulty,
        config.customEnvironment
      ).label;
      const isSolved = d.perfectCount > 0;
      const cols = observedCounts.map((cnt) => {
        const cell = cellLookup.get(`${d.difficulty}|${cnt}`);
        if (!cell) return '—';
        return isSolved
          ? `${cell.perfectRate}% (${Math.round(cell.avgComputeMs)}ms)`
          : `${cell.maxMinSeed}p (μ${cell.meanMinSeed})`;
      });
      lines.push(`| ${label} | ${cols.join(' | ')} |`);
    }
  }

  // Section 5d: Hyperparameter Sensitivity
  if (findings.hyperparamSummary.length > 1) {
    lines.push(
      '',
      '## 5d. Hyperparameter Sensitivity (Pop × Sigma)',
      '| Pop | Sigma | Trials | Overall % | Solved % | Avg Compute (ms) | Avg Evals | Mean Min-Seed |',
      '| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |'
    );
    for (const hp of findings.hyperparamSummary) {
      lines.push(
        `| ${hp.populationSize} | ${hp.mutationStrength.toFixed(2)} | ${hp.trialCount.toLocaleString()} | ${hp.perfectRate}% | ${
          hp.solvedRegimePerfectRate !== null
            ? `${hp.solvedRegimePerfectRate}%`
            : '—'
        } | ${
          hp.avgComputeMsToPerfection !== null ? hp.avgComputeMsToPerfection : '—'
        } | ${
          hp.avgEpisodesToPerfection !== null
            ? hp.avgEpisodesToPerfection.toLocaleString()
            : '—'
        } | ${hp.meanMinSeedScore.toLocaleString()} |`
      );
    }
  }

  // Section 5e: Bio-Inspired Neuron Architectures
  const activeArchesMd = findings.perArchitecture.filter((a) => a.trialCount > 0);
  if (activeArchesMd.length > 1) {
    lines.push(
      '',
      '## 5e. Neuron & Bio-Architecture Comparison',
      '| Architecture | Trials | Perfect % | Solved % | Mean Min-Seed | Best Min-Seed | Avg Params | Avg Compute (ms) |',
      '| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |'
    );
    for (const a of activeArchesMd) {
      lines.push(
        `| ${a.label} | ${a.trialCount.toLocaleString()} | ${a.perfectRate}% | ${
          a.solvedRegimePerfectRate !== null ? `${a.solvedRegimePerfectRate}%` : '—'
        } | ${a.meanMinSeedScore.toLocaleString()} | ${a.bestMinSeedScore.toLocaleString()} | ${a.avgParams}p | ${
          a.avgComputeMsToPerfection ?? '—'
        } |`
      );
    }
  }

  // Section 5f: Weight Bit-Precision & Memory Compression
  const activePrecsMd = findings.perPrecision.filter((p) => p.trialCount > 0);
  if (activePrecsMd.length > 1) {
    lines.push(
      '',
      '## 5f. Weight Bit-Precision & Memory Compression',
      '| Precision | Bits/Param | Avg Bits | Trials | Perfect % | Mean Min-Seed | Peak Pipes/Bit | Avg Compute (ms) |',
      '| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |'
    );
    for (const p of activePrecsMd) {
      lines.push(
        `| ${p.label} | ${p.bitsPerParam}b | ${p.avgTotalBits} | ${p.trialCount.toLocaleString()} | ${p.perfectRate}% | ${p.meanMinSeedScore.toLocaleString()} | ${p.maxPipesPerBit} | ${
          p.avgComputeMsToPerfection ?? '—'
        } |`
      );
    }
  }

  // Section 5g: Self-Growing Morphogenesis A/B Comparison
  if (findings.morphogenesisComparison) {
    const mc = findings.morphogenesisComparison;
    lines.push(
      '',
      '## 5g. Self-Growing Morphogenesis (Masked Super-Network A/B)',
      '| Regime | Trials | Perf % | Mean Min-Seed | Init→Final Params | Avg Pruned | Avg Growth / Prune Events | Final K / Sensors |',
      '| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |',
      `| Static Fixed | ${mc.staticTrials.toLocaleString()} | ${mc.staticPerfectRate}% | ${mc.staticMeanMinSeed} | — | — | — | — |`,
      `| Morphogenesis | ${mc.growingTrials.toLocaleString()} | ${mc.growingPerfectRate}% | ${mc.growingMeanMinSeed} | ${mc.avgInitialParams ?? '—'}→${mc.avgFinalParams ?? '—'} (${mc.avgParamGrowthRatio ?? '—'}×) | ${mc.avgPrunedSynapses ?? '—'} | ${mc.avgGrowthEvents ?? '—'} / ${mc.avgPruneEvents ?? '—'} | K=${mc.avgFinalK ?? '—'} · ${mc.avgFinalSensors ?? '—'}s |`
    );
    if (mc.matchedPairs > 0) {
      lines.push(
        `- **Paired A/B Diff (${mc.matchedPairs} pairs):** Growing W/T/L = ${mc.winsGrowing}/${mc.ties}/${mc.winsStatic} · Mean Δ = ${mc.meanDeltaScore >= 0 ? '+' : ''}${mc.meanDeltaScore} pipes · Sign-test p = ${mc.signTestPValue ?? '—'}`
      );
    }
  }

  // Section 5h: Compute-Efficiency Pareto Frontier & Hardware Auto-Routing
  if (findings.computeRoiSummary || findings.hardwareRoutingSummary) {
    lines.push('', '## 5h. Compute-Efficiency Pareto Frontier & Hardware Auto-Routing');
    if (findings.hardwareRoutingSummary) {
      const hr = findings.hardwareRoutingSummary;
      lines.push(
        '| Hardware Route | Trials | Perf % | Mean Min-Seed | Mean FLOPs/f | Routing Role |',
        '| :--- | :---: | :---: | :---: | :---: | :--- |',
        `| GPU_LOCKSTEP | ${hr.gpuLockstepTrials.toLocaleString()} | ${hr.gpuPerfectRate !== null ? `${hr.gpuPerfectRate}%` : '—'} | ${hr.gpuMeanScore ?? '—'} | ${hr.gpuMeanFlops ?? '—'} | Uniform SIMT WebGPU/CUDA lockstep kernels |`,
        `| CPU_SPECIALIZED | ${hr.cpuSpecializedTrials.toLocaleString()} | ${hr.cpuPerfectRate !== null ? `${hr.cpuPerfectRate}%` : '—'} | ${hr.cpuMeanScore ?? '—'} | ${hr.cpuMeanFlops ?? '—'} | Branching Hybrid MoE & Islands on CPU Workers / Colab OpenMP |`
      );
    }
    if (findings.computeRoiSummary) {
      const cr = findings.computeRoiSummary;
      lines.push(
        `- **Compute Footprint**: Avg **${cr.avgFlopsPerFrame}** FLOPs/frame (range ${cr.minFlopsPerFrame}–${cr.maxFlopsPerFrame}) · Mean Score/100-FLOPs = **${cr.avgEfficiencyScore}**${
          cr.hybridTrials > 0
            ? ` · **Hybrid MoE Plasticity (${cr.hybridTrials} trials)**: Committed Experts = ${cr.totalCommits} · ROI Rollbacks = ${cr.totalRollbacks}${cr.avgRoiScore !== null ? ` · Mean ROI = ${cr.avgRoiScore}` : ''}`
            : ''
        }`
      );
    }
    if (findings.paretoFrontier.length > 0) {
      lines.push(
        '',
        '| Pareto Rank | Model | Scenario | Route | FLOPs/f | Min-Seed | Score/100-FLOPs |',
        '| :---: | :--- | :---: | :---: | ---: | ---: | ---: |'
      );
      findings.paretoFrontier.slice(0, 10).forEach((pt, idx) => {
        lines.push(
          `| P${idx + 1} | ${pt.label} | ${pt.difficulty} | ${pt.computeProfile === 'CPU_SPECIALIZED' ? 'CPU-Only' : 'GPU-Lockstep'} | ${pt.meanFlopsPerFrame} | ${pt.minSeedScore} | ${pt.efficiencyScore} |`
        );
      });
    }
  }

  // Section 5i: Multi-Architecture Island Speciation Winners
  if (findings.islandWinnerSummary) {
    const iw = findings.islandWinnerSummary;
    lines.push(
      '',
      `## 5i. Multi-Architecture Island Speciation Winners (${iw.totalIslandTrials} runs · ${iw.rebalanceEventsTotal} rebalances)`,
      '| Winning Species | Island Wins | Win Share | Mean Min-Seed | Mean FLOPs/f |',
      '| :--- | :---: | :---: | ---: | ---: |'
    );
    for (const w of iw.winners) {
      lines.push(
        `| ${w.label} | ${w.wins} | ${w.winSharePct}% | ${w.meanScore} | ${w.meanFlops} |`
      );
    }
  }

  // Section 6: Mechanistic Policy Attribution (up to 12 sensors)
  if (findings.mechanisticAggregate) {
    const m = findings.mechanisticAggregate;
    lines.push(
      '',
      `## 6. Mechanistic Policy Attribution (n=${m.sampleCount.toLocaleString()})`,
      '| Sensor Input | Mean Attribution (%) |',
      '| :--- | :---: |'
    );
    SENSOR_NAMES.forEach((name, idx) => {
      const pct = m.avgSensorImportance[idx] ?? 0;
      if (pct > 0 || idx < 6) {
        lines.push(`| ${name} | ${pct}% |`);
      }
    });
    if (m.bestLinearFormula) {
      lines.push('', `- **Sample Verified Linear Control Law**: \`${m.bestLinearFormula}\``);
    }
    lines.push(
      `- **Mean Weight L2 Norm**: ${m.avgWeightL2Norm} · **Near-Zero Synapses (<0.08)**: ${Math.round(m.avgSparsityRatio * 100)}%`
    );
  }

  // Section 6c: 12-Sensor Discovery Meta-Analysis ("Why & When")
  if (findings.sensorDiscovery && findings.sensorDiscovery.totalTestedSensors > 0) {
    const sd = findings.sensorDiscovery;
    const fmtLift = (v: number | null) =>
      v === null ? '—' : `${v >= 0 ? '+' : ''}${v}`;
    lines.push(
      '',
      '## 6c. 12-Sensor Discovery Meta-Analysis ("Why & When")',
      `- ${sd.botFirstNote}`,
      '',
      '| Sensor | Group | With / W/O | Mean Lift | Static | Moving | Turbulent | Cond. Jac% | Why & When It Helps |',
      '| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |'
    );
    for (const s of sd.sensors.filter((x) => x.trialsWithSensor > 0)) {
      lines.push(
        `| ${s.label} (${s.shortLabel}) | ${s.group} | ${s.trialsWithSensor}/${s.trialsWithoutSensor} | ${s.trialsWithoutSensor > 0 ? fmtLift(s.marginalLift) : '—'} | ${fmtLift(s.staticLift)} | ${fmtLift(s.movingLift)} | ${fmtLift(s.turbulentLift)} | ${s.avgJacobianSharePct}% | **Why:** ${s.whyItHelps} **When:** ${s.whenItHelps} |`
      );
    }
  }

  // Section 6d: Mathematical Scenario Solvability Proofs
  if (findings.scenarioProofs.length > 0) {
    lines.push(
      '',
      '## 6d. Mathematical Scenario Solvability Proofs (Ballistic & Geometric Reachability)',
      '| Scenario | Status | dt_min (f) | Min Gap (px) | Max ΔY Req | Climb Slack | Dive Slack | Transit Aperture |',
      '| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |'
    );
    for (const sp of findings.scenarioProofs) {
      const p = sp.proof;
      lines.push(
        `| ${sp.label} | ${p.solvable ? 'PROVEN SOLVABLE' : 'UNSOLVABLE RISK'} | ${p.dtMinFrames}f | ${p.minGapPx}px | ${p.requiredDeltaYPx}px | +${p.climbSlackPx}px | +${p.diveSlackPx}px | +${p.transitClearancePx}px (${p.transitFrames}f) |`
      );
    }
  }

  // Section 6b: Failure Autopsy, Reasoning Telemetry & Learning Dynamics
  if (
    findings.autopsySummary ||
    findings.reasoningSummary ||
    findings.learningDynamicsSummary
  ) {
    lines.push('', '## 6b. Failure Autopsy, Reasoning Telemetry & Learning Dynamics');
    if (findings.autopsySummary) {
      const a = findings.autopsySummary;
      const pct = (n: number) =>
        ((n / Math.max(1, a.totalDeaths)) * 100).toFixed(1);
      lines.push(
        `- **Crash Autopsy (${a.totalDeaths} failed seeds across ${a.failedTrials} trials)**: Dominant = **${a.dominantFailure}** · PipeTop ${pct(a.causes.PIPE_TOP)}% · PipeBot ${pct(a.causes.PIPE_BOTTOM)}% · Floor ${pct(a.causes.FLOOR)}% · Ceiling ${pct(a.causes.CEILING)}% · Avg |Vy| at death = ${a.avgDeathAbsVy} · Avg Gap Err = ${a.avgDeathGapErr}px · Avg Train-vs-Audit Gen Gap = ${a.avgGeneralizationGap} pipes`
      );
    }
    if (findings.reasoningSummary) {
      const rt = findings.reasoningSummary;
      const parts: string[] = [];
      if (rt.ponderTrials > 0) {
        parts.push(
          `Ponder/Loop (n=${rt.ponderTrials}): avg=${rt.avgPonderSteps} steps, Calm=${rt.calmPonderSteps} vs Danger=${rt.dangerPonderSteps} (Δ=${rt.dangerVsCalmDelta !== null && rt.dangerVsCalmDelta >= 0 ? '+' : ''}${rt.dangerVsCalmDelta}), System-2 ratio=${rt.avgSystem2Ratio}%`
        );
      }
      if (rt.rolloutTrials > 0) {
        parts.push(
          `Latent Rollout (n=${rt.rolloutTrials}): mean |ΔV(JUMP-WAIT)|=${rt.avgRolloutAdvantage}`
        );
      }
      if (rt.ssmTrials > 0) {
        parts.push(
          `Selective SSM/MinGRU (n=${rt.ssmTrials}): mean gate z_t=${rt.avgSsmGate}`
        );
      }
      if (parts.length > 0) {
        lines.push(`- **Reasoning Telemetry**: ${parts.join(' · ')}`);
      }
    }
    if (findings.learningDynamicsSummary) {
      const ld = findings.learningDynamicsSummary;
      lines.push(
        `- **Learning Dynamics (n=${ld.totalClassified})**: G1_INSTANT=${ld.counts.G1_INSTANT} · SMOOTH_CLIMB=${ld.counts.SMOOTH_CLIMB} · PHASE_TRANSITION=${ld.counts.PHASE_TRANSITION} · PLATEAU=${ld.counts.PLATEAU} · OVERFIT_COLLAPSE=${ld.counts.OVERFIT_COLLAPSE}`
      );
    }
  }

  // Section 7: World Models + Next-Iteration Recommendations
  if (
    findings.worldModelImplications.length > 0 ||
    findings.nextIterationRecommendations.length > 0
  ) {
    lines.push('', '## 7. Scientific Synthesis & Next-Iteration Recommendations');
    for (const item of findings.worldModelImplications) {
      lines.push(`- ${item}`);
    }
    for (const rec of findings.nextIterationRecommendations) {
      lines.push(`- **Next Iteration:** ${rec}`);
    }
  }

  // Section 8: Bounded Stratified Representative Sample (NEVER dumps 77,000 raw rows!)
  const sampleRows: { tag: string; trial: ResearchTrialResult }[] = [];
  const seenIds = new Set<string>();
  const addSample = (tag: string, t: ResearchTrialResult | null | undefined) => {
    if (!t || seenIds.has(t.id)) return;
    seenIds.add(t.id);
    sampleRows.push({ tag, trial: t });
  };

  // Top 5 fastest perfect overall & top 5 highest density
  const fastestList = [...results]
    .filter((r) => r.verifiedPerfect)
    .sort((a, b) => getTrialComputeMs(a) - getTrialComputeMs(b))
    .slice(0, 5);
  fastestList.forEach((t) => addSample('Fastest', t));

  const densestList = [...results]
    .filter((r) => r.minSeedScore >= 10)
    .sort((a, b) => b.knowledgeDensity - a.knowledgeDensity)
    .slice(0, 5);
  densestList.forEach((t) => addSample('Densest', t));

  // Top 5 per unsolved frontier scenario (high signal for breakthrough analysis)
  for (const grp of findings.unsolvedFrontierTop) {
    grp.topTrials.slice(0, 5).forEach((t) => addSample('Frontier', t));
  }

  // Top 3 per solved scenario (min-params + fastest + best alt)
  for (const df of activeDiffs) {
    if (df.perfectCount === 0) continue;
    addSample('MinParam', df.minimumPerfectTrial);
    const solvedSub = results
      .filter((r) => r.difficulty === df.difficulty && r.verifiedPerfect)
      .sort((a, b) => getTrialComputeMs(a) - getTrialComputeMs(b));
    solvedSub.slice(0, 2).forEach((t) => addSample('SolvedTop', t));
  }

  // Top 5 highest-compute stagnation anomalies (to diagnose compute sinks)
  const anomalies = [...results]
    .filter((r) => !r.verifiedPerfect)
    .sort((a, b) => getTrialComputeMs(b) - getTrialComputeMs(a))
    .slice(0, 5);
  anomalies.forEach((t) => addSample('ComputeSink', t));

  lines.push(
    '',
    `## 8. Stratified Representative Trials (${sampleRows.length} highest-signal of ${results.length.toLocaleString()} total)`,
    '> Full raw per-trial table is intentionally omitted from this LLM digest to keep token usage compact (~4k–9k tokens). Export **CSV** or **JSON** for full raw trial rows.',
    '',
    '| Tag | Method | Scenario | Inputs | Topology | Arch/Prec | Params | Pop | σ | Min / Mean | Outcome | Evals | Norm ms | Dominant |',
    '| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |'
  );

  for (const { tag, trial: r } of sampleRows) {
    const label = resolveEnvironment(
      r.difficulty,
      config.customEnvironment
    ).label;
    const inputLbl =
      r.inputSetLabel ?? formatInputSubsetLabel(normalizeInputFeatures(r.inputFeatures));
    const outcome = r.verifiedPerfect
      ? `Perf (G${r.generationsToSolve})`
      : `${r.stoppedReason} (G${r.generationsRun})`;
    const seedScoreStr =
      r.meanSeedScore !== undefined && Math.round(r.meanSeedScore) !== r.minSeedScore
        ? `${r.minSeedScore} / ${Math.round(r.meanSeedScore)}`
        : `${r.minSeedScore}`;
    lines.push(
      `| ${tag} | ${ALGORITHM_SHORT_LABELS[r.algorithm]} | ${label} | ${inputLbl} | ${r.topologyLabel} | ${formatArchPrecTag(r)} | ${r.parameterCount}p | ${r.populationSize} | ${r.mutationStrength.toFixed(2)} | ${seedScoreStr} | ${outcome} | ${getTrialEpisodes(r)} | ${getTrialComputeMs(r).toFixed(1)} | ${r.policyProfile?.dominantSensor ?? '—'} |`
    );
  }

  return lines.join('\n');
}

export function generateCsvReport(results: ResearchTrialResult[]): string {
  const header = [
    'algorithm',
    'difficulty',
    'architecture',
    'weight_precision',
    'bits_per_param',
    'total_bits',
    'pipes_per_bit',
    'input_count',
    'input_features',
    'topology_label',
    'depth',
    'max_width',
    'hidden_neurons',
    'weight_count',
    'bias_count',
    'parameter_count',
    'population_size',
    'mutation_rate',
    'mutation_strength',
    'target_pipe_cap',
    'verification_seeds',
    'verified_perfect',
    'stopped_reason',
    'min_seed_score',
    'mean_seed_score',
    'best_training_score',
    'generalization_ratio',
    'generations_run',
    'bird_episodes_evaluated',
    'training_ticks_evaluated',
    'training_synaptic_ops',
    'normalized_compute_ms',
    'active_cpu_duration_ms',
    'dominant_sensor',
    'weight_l2_norm',
    'sparsity_ratio',
    'knowledge_density',
    'morphogenesis_mode',
    'initial_active_params',
    'final_active_params',
    'pruned_synapses',
    'growth_events',
    'prune_events',
    'final_sensors',
    'final_reasoning_steps',
    'evolution_topology_mode',
    'compute_profile',
    'mean_flops_per_frame',
    'compute_efficiency_score',
    'hybrid_rollbacks',
    'hybrid_commits',
    'island_winning_species',
  ].join(',');

  const rows = results.map((r) => {
    const feats = normalizeInputFeatures(r.inputFeatures);
    const arch = r.architecture ?? 'MLP';
    const prec = r.weightPrecision ?? 'FP32';
    const bpp = r.bitsPerParam ?? WEIGHT_PRECISION_META[prec].bitsPerParam;
    const totalBits = r.totalBits ?? Math.max(1, Math.round(r.parameterCount * bpp));
    const pipesPerBit =
      r.pipesPerBit ?? Number((r.minSeedScore / totalBits).toFixed(3));
    const ms = r.morphogenesisSummary;
    const evoMode = r.evolutionTopologyMode ?? 'SINGLE_SPECIES';
    const cProfile = r.computeProfile ?? getTrialComputeProfile(arch, evoMode);
    const meanFlops =
      r.meanFlopsPerFrame ??
      estimateArchitectureFlops(
        r.topology,
        r.inputCount ?? feats.length,
        arch,
        r.reasoningSteps ?? 3,
        ms?.activeExperts
      );
    const effScore =
      r.computeEfficiencyScore ??
      (meanFlops > 0 ? Number((r.minSeedScore / (meanFlops / 100)).toFixed(2)) : 0);
    return [
      r.algorithm,
      r.difficulty,
      arch,
      prec,
      bpp,
      totalBits,
      pipesPerBit,
      r.inputCount ?? feats.length,
      `"${formatInputSubsetKey(feats)}"`,
      `"${r.topologyLabel}"`,
      r.depth,
      r.maxWidth,
      r.hiddenNeuronCount,
      r.weightCount,
      r.biasCount,
      r.parameterCount,
      r.populationSize,
      r.mutationRate,
      r.mutationStrength,
      r.targetPipeCap,
      r.verificationSeeds,
      r.verifiedPerfect,
      r.stoppedReason,
      r.minSeedScore,
      r.meanSeedScore,
      r.bestScore,
      r.generalizationRatio,
      r.generationsRun,
      getTrialEpisodes(r),
      r.trainingTicksEvaluated ?? r.totalTicksEvaluated,
      r.trainingSynapticOps ?? '',
      getTrialComputeMs(r),
      r.durationMs,
      `"${r.policyProfile?.dominantSensor ?? ''}"`,
      r.policyProfile?.weightL2Norm ?? '',
      r.policyProfile?.sparsityRatio ?? '',
      r.knowledgeDensity,
      r.morphogenesisMode ?? 'STATIC',
      ms?.initialActiveParams ?? '',
      ms?.finalActiveParams ?? '',
      ms?.prunedSynapses ?? '',
      ms?.growthEventsCount ?? '',
      ms?.pruneEventsCount ?? '',
      ms?.finalActiveSensors ?? '',
      ms?.finalReasoningSteps ?? '',
      evoMode,
      cProfile,
      meanFlops,
      effScore,
      ms?.rollbackCount ?? '',
      ms?.committedExpertsCount ?? '',
      r.islandSummary?.winningSpecies ?? '',
    ].join(',');
  });

  return [header, ...rows].join('\n');
}

export function generateJsonDataset(
  results: ResearchTrialResult[],
  config: ResearchSweepConfig,
  findings: ResearchFindings
): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      protocol: config,
      summary: findings,
      trials: results,
    },
    null,
    2
  );
}

/**
 * Generates an LLM/Python-ready JSONL stream (1 compact JSON record per trial,
 * stripped of raw weight blobs so 10,000+ trials stream & ingest rapidly).
 */
export function generateJsonlDataset(
  results: ResearchTrialResult[],
  _config: ResearchSweepConfig
): string {
  return results
    .map((r) => {
      const feats = normalizeInputFeatures(r.inputFeatures);
      const importanceBySensor: Record<string, number> = {};
      if (r.policyProfile) {
        ALL_SENSOR_FEATURES.forEach((fid, idx) => {
          const val = r.policyProfile?.sensorImportance[idx] ?? 0;
          if (val > 0) importanceBySensor[fid] = val;
        });
      }
      return JSON.stringify({
        id: r.id,
        signature: r.trialSignature ?? null,
        algorithm: r.algorithm,
        difficulty: r.difficulty,
        normalizedDifficulty: normalizeDifficultyPreset(r.difficulty),
        architecture: r.architecture ?? 'MLP',
        weightPrecision: r.weightPrecision ?? 'FP32',
        evolutionTopologyMode: r.evolutionTopologyMode ?? 'SINGLE_SPECIES',
        computeProfile:
          r.computeProfile ??
          getTrialComputeProfile(
            r.architecture ?? 'MLP',
            r.evolutionTopologyMode ?? 'SINGLE_SPECIES'
          ),
        meanFlopsPerFrame:
          r.meanFlopsPerFrame ??
          estimateArchitectureFlops(
            r.topology,
            r.inputCount ?? feats.length,
            r.architecture ?? 'MLP',
            r.reasoningSteps ?? 3,
            r.morphogenesisSummary?.activeExperts
          ),
        computeEfficiencyScore: r.computeEfficiencyScore ?? null,
        islandSummary: r.islandSummary ?? null,
        morphogenesisMode: r.morphogenesisMode ?? 'STATIC',
        morphogenesisSummary: r.morphogenesisSummary ?? null,
        inputFeatures: feats,
        inputCount: r.inputCount ?? feats.length,
        topology: r.topology,
        topologyLabel: r.topologyLabel,
        depth: r.depth,
        parameterCount: r.parameterCount,
        populationSize: r.populationSize,
        mutationRate: r.mutationRate,
        mutationStrength: r.mutationStrength,
        targetPipeCap: r.targetPipeCap,
        verificationSeeds: r.verificationSeeds,
        reasoningSteps: r.reasoningSteps ?? 1,
        verifiedPerfect: r.verifiedPerfect,
        stoppedReason: r.stoppedReason,
        bestScore: r.bestScore,
        minSeedScore: r.minSeedScore,
        meanSeedScore: r.meanSeedScore,
        generalizationRatio: r.generalizationRatio,
        generationsRun: r.generationsRun,
        birdEpisodes: getTrialEpisodes(r),
        normalizedComputeMs: getTrialComputeMs(r),
        knowledgeDensity: r.knowledgeDensity,
        pipesPerBit: r.pipesPerBit ?? null,
        learningDynamic: r.learningDynamic ?? null,
        failureAutopsy: r.failureAutopsy ?? null,
        reasoningTelemetry: r.reasoningTelemetry ?? null,
        sensorImportance: importanceBySensor,
        dominantSensor: r.policyProfile?.dominantSensor ?? null,
      });
    })
    .join('\n');
}

export function buildLlmMetaPack(
  results: ResearchTrialResult[],
  config: ResearchSweepConfig,
  precomputedFindings?: ResearchFindings
): {
  metaDossierMd: string;
  aiDeltaMd: string;
  trialsJsonl: string;
  sensorMatrixJson: string;
} {
  const findings = precomputedFindings ?? computeResearchFindings(results, config);
  const metaDossierMd = generateMarkdownReport(results, config, findings);
  const aiDeltaMd = generateAiDeltaDigest(results, config, findings);
  const trialsJsonl = generateJsonlDataset(results, config);
  const sensorMatrixJson = JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      totalTrials: findings.totalTrials,
      sensorDiscovery: findings.sensorDiscovery,
      morphogenesisComparison: findings.morphogenesisComparison,
      computeRoiSummary: findings.computeRoiSummary,
      hardwareRoutingSummary: findings.hardwareRoutingSummary,
      paretoFrontier: findings.paretoFrontier,
      islandWinnerSummary: findings.islandWinnerSummary,
      scenarioProofs: findings.scenarioProofs,
      perInputSet: findings.perInputSet,
    },
    null,
    2
  );
  return { metaDossierMd, aiDeltaMd, trialsJsonl, sensorMatrixJson };
}

/** Exact two-sided binomial sign-test p-value for paired winsB vs winsA */
function computeSignTestPValue(winsB: number, winsA: number): number | null {
  const n = winsB + winsA;
  if (n <= 0) return null;
  const k = Math.min(winsB, winsA);
  // Compute P(X <= k) for Binomial(n, 0.5) using log-sum for stability
  let sum = 0;
  let logFactN = 0;
  for (let i = 2; i <= n; i++) logFactN += Math.log(i);
  const logFact = (m: number) => {
    let s = 0;
    for (let i = 2; i <= m; i++) s += Math.log(i);
    return s;
  };
  const logHalfN = -n * Math.LN2;
  for (let i = 0; i <= k; i++) {
    const logComb = logFactN - logFact(i) - logFact(n - i);
    sum += Math.exp(logComb + logHalfN);
  }
  return Number(Math.min(1, 2 * sum).toFixed(4));
}

/**
 * Paired A/B Diff Engine: pairs trials from groupA and groupB that share identical
 * (algorithm, difficulty, topologyLabel, inputSubset, weightPrecision, pop, sigma, targetPipeCap)
 * so comparisons isolate the changed axis (e.g., Architecture B vs MLP, or Shaped vs Raw).
 */
export function computePairedABDiff(
  groupA: ResearchTrialResult[],
  groupB: ResearchTrialResult[],
  labelA = 'Baseline (A)',
  labelB = 'Treatment (B)'
): PairedABDiffSummary {
  const buildPairKey = (r: ResearchTrialResult) =>
    `${r.algorithm}|${r.difficulty}|${r.topologyLabel}|${formatInputSubsetKey(normalizeInputFeatures(r.inputFeatures))}|${r.weightPrecision ?? 'FP32'}|p${r.populationSize}|s${r.mutationStrength.toFixed(2)}|cap${r.targetPipeCap}`;

  const mapA = new Map<string, ResearchTrialResult>();
  for (const r of groupA) {
    const k = buildPairKey(r);
    const prev = mapA.get(k);
    if (!prev || r.minSeedScore > prev.minSeedScore) mapA.set(k, r);
  }

  const pairs: { key: string; scoreA: number; scoreB: number; delta: number; perfA: boolean; perfB: boolean }[] = [];
  const seen = new Set<string>();
  for (const b of groupB) {
    const k = buildPairKey(b);
    if (seen.has(k)) continue;
    const a = mapA.get(k);
    if (!a) continue;
    seen.add(k);
    pairs.push({
      key: `${ALGORITHM_SHORT_LABELS[b.algorithm]}|${b.difficulty}|${b.topologyLabel}`,
      scoreA: a.minSeedScore,
      scoreB: b.minSeedScore,
      delta: b.minSeedScore - a.minSeedScore,
      perfA: a.verifiedPerfect,
      perfB: b.verifiedPerfect,
    });
  }

  let winsB = 0;
  let winsA = 0;
  let ties = 0;
  let deltaSum = 0;
  let perfACount = 0;
  let perfBCount = 0;
  const deltas: number[] = [];

  for (const p of pairs) {
    deltaSum += p.delta;
    deltas.push(p.delta);
    if (p.perfA) perfACount += 1;
    if (p.perfB) perfBCount += 1;
    if (p.delta > 0) winsB += 1;
    else if (p.delta < 0) winsA += 1;
    else ties += 1;
  }
  deltas.sort((x, y) => x - y);
  const medianDelta =
    deltas.length === 0
      ? 0
      : deltas.length % 2 === 1
        ? deltas[(deltas.length - 1) / 2]
        : (deltas[deltas.length / 2 - 1] + deltas[deltas.length / 2]) / 2;

  const sortedPos = [...pairs]
    .filter((p) => p.delta > 0)
    .sort((x, y) => y.delta - x.delta)
    .slice(0, 4)
    .map(({ key, scoreA, scoreB, delta }) => ({ key, scoreA, scoreB, delta }));

  const sortedNeg = [...pairs]
    .filter((p) => p.delta < 0)
    .sort((x, y) => x.delta - y.delta)
    .slice(0, 4)
    .map(({ key, scoreA, scoreB, delta }) => ({ key, scoreA, scoreB, delta }));

  return {
    labelA,
    labelB,
    matchedPairs: pairs.length,
    winsB,
    winsA,
    ties,
    meanDeltaScore:
      pairs.length > 0 ? Number((deltaSum / pairs.length).toFixed(1)) : 0,
    medianDeltaScore: Number(medianDelta.toFixed(1)),
    perfectDeltaPct:
      pairs.length > 0
        ? Number((((perfBCount - perfACount) / pairs.length) * 100).toFixed(1))
        : 0,
    signTestPValue: computeSignTestPValue(winsB, winsA),
    topPositiveLifts: sortedPos,
    topNegativeLifts: sortedNeg,
  };
}

/**
 * Ultra-compact AI Delta-Digest (~1.5k–3.5k tokens) engineered specifically for
 * fast LLM analysis: highlights Paired Architecture A/B Lifts vs MLP, Failure Autopsy,
 * Reasoning Telemetry (Ponder S1/S2, Rollout ΔV, SSM Gate), Learning Dynamics,
 * and Statistical Anomalies (Unexpected Wins & Overfit Collapses).
 */
export function generateAiDeltaDigest(
  results: ResearchTrialResult[],
  config: ResearchSweepConfig,
  findings: ResearchFindings
): string {
  const lines: string[] = [
    '# NeuroLab AI Delta-Digest (High-Signal Discovery Packet)',
    `- **Trials**: ${findings.totalTrials} (${findings.totalPerfect} perfect = ${findings.totalTrials > 0 ? ((findings.totalPerfect / findings.totalTrials) * 100).toFixed(1) : '0.0'}%) · **Cap**: ${config.targetPipeCap}×${config.verificationSeeds}s · **Shaped**: ${config.shapedFitness ? 'ON' : 'OFF'} · **Curriculum**: ${config.curriculumLearning ? 'ON' : 'OFF'}`,
    '',
  ];

  // 1. Paired A/B Architecture Lifts vs MLP
  const mlpTrials = results.filter((r) => (r.architecture ?? 'MLP') === 'MLP');
  const otherArches = ALL_ARCHITECTURES.filter((a) => a !== 'MLP');
  const pairedRows: PairedABDiffSummary[] = [];
  if (mlpTrials.length > 0) {
    for (const arch of otherArches) {
      const sub = results.filter((r) => r.architecture === arch);
      if (sub.length === 0) continue;
      const diff = computePairedABDiff(
        mlpTrials,
        sub,
        'MLP',
        ARCHITECTURE_META[arch].shortLabel
      );
      if (diff.matchedPairs > 0) pairedRows.push(diff);
    }
  }
  if (pairedRows.length > 0) {
    lines.push(
      '## 1. Paired Architecture Lifts vs MLP (Matched Configs)',
      '| Arch vs MLP | Pairs | W / T / L | Mean Δ Pipes | Median Δ | Δ Perf% | Sign-Test p |',
      '| :--- | :---: | :---: | :---: | :---: | :---: | :---: |'
    );
    for (const d of pairedRows) {
      const sign = d.meanDeltaScore >= 0 ? '+' : '';
      const mSign = d.medianDeltaScore >= 0 ? '+' : '';
      const pSign = d.perfectDeltaPct >= 0 ? '+' : '';
      lines.push(
        `| **${d.labelB}** | ${d.matchedPairs} | ${d.winsB}/${d.ties}/${d.winsA} | ${sign}${d.meanDeltaScore} | ${mSign}${d.medianDeltaScore} | ${pSign}${d.perfectDeltaPct}% | ${d.signTestPValue ?? '—'} |`
      );
    }
    lines.push('');
  }

  // 2. Failure Autopsy & Reasoning Telemetry
  if (findings.autopsySummary || findings.reasoningSummary) {
    lines.push('## 2. Diagnostic Autopsy & Reasoning Telemetry');
    if (findings.autopsySummary) {
      const a = findings.autopsySummary;
      const pct = (n: number) =>
        ((n / Math.max(1, a.totalDeaths)) * 100).toFixed(0);
      lines.push(
        `- **Crash Autopsy (${a.totalDeaths} deaths)**: Dominant=${a.dominantFailure} (PipeTop ${pct(a.causes.PIPE_TOP)}%, PipeBot ${pct(a.causes.PIPE_BOTTOM)}%, Floor ${pct(a.causes.FLOOR)}%, Ceil ${pct(a.causes.CEILING)}%) · |Vy|=${a.avgDeathAbsVy} · GapErr=${a.avgDeathGapErr}px · GenGap=${a.avgGeneralizationGap}p`
      );
    }
    if (findings.reasoningSummary) {
      const rt = findings.reasoningSummary;
      if (rt.ponderTrials > 0) {
        lines.push(
          `- **Ponder/Loop Reasoning (n=${rt.ponderTrials})**: Avg=${rt.avgPonderSteps} steps · Calm=${rt.calmPonderSteps} vs Danger=${rt.dangerPonderSteps} (Δ=${rt.dangerVsCalmDelta !== null && rt.dangerVsCalmDelta >= 0 ? '+' : ''}${rt.dangerVsCalmDelta}) · System-2=${rt.avgSystem2Ratio}%`
        );
      }
      if (rt.rolloutTrials > 0) {
        lines.push(
          `- **Latent Rollout (n=${rt.rolloutTrials})**: Mean |ΔV(JUMP-WAIT)|=${rt.avgRolloutAdvantage}`
        );
      }
      if (rt.ssmTrials > 0) {
        lines.push(
          `- **Selective SSM / MinGRU (n=${rt.ssmTrials})**: Mean selective gate z_t=${rt.avgSsmGate}`
        );
      }
    }
    lines.push('');
  }

  // 3. Learning Dynamics Distribution
  if (findings.learningDynamicsSummary) {
    const ld = findings.learningDynamicsSummary;
    lines.push(
      '## 3. Learning Dynamics Profile',
      `- G1 Instant: **${ld.counts.G1_INSTANT}** · Smooth Climb: **${ld.counts.SMOOTH_CLIMB}** · Phase Transition (Grokking): **${ld.counts.PHASE_TRANSITION}** · Plateau: **${ld.counts.PLATEAU}** · Overfit Collapse: **${ld.counts.OVERFIT_COLLAPSE}**`,
      ''
    );
  }

  // 4. High-Signal Anomalies (Unexpected Frontier Breakthroughs + Worst Overfit Collapses)
  const diffMeanMap = new Map(
    findings.perDifficulty.map((d) => [d.difficulty, d.meanMinSeedScore])
  );
  const surpriseWins = [...results]
    .map((r) => ({
      r,
      lift: r.minSeedScore - (diffMeanMap.get(r.difficulty) ?? 0),
    }))
    .filter((x) => x.lift > 20)
    .sort((a, b) => b.lift - a.lift)
    .slice(0, 6);

  const overfits = [...results]
    .filter(
      (r) =>
        r.learningDynamic === 'OVERFIT_COLLAPSE' ||
        (r.failureAutopsy && r.failureAutopsy.generalizationGap > 50)
    )
    .sort(
      (a, b) =>
        (b.failureAutopsy?.generalizationGap ?? b.bestScore - b.minSeedScore) -
        (a.failureAutopsy?.generalizationGap ?? a.bestScore - a.minSeedScore)
    )
    .slice(0, 5);

  if (surpriseWins.length > 0) {
    lines.push(
      '## 4. Top Outperforming Anomalies (Above Scenario Mean)',
      '| Scenario | Arch/Prec | Algo | Topo | MinSeed | Lift vs Mean | Dynamic | Autopsy |',
      '| :--- | :---: | :---: | :---: | ---: | ---: | :---: | :---: |'
    );
    for (const { r, lift } of surpriseWins) {
      lines.push(
        `| ${r.difficulty} | ${formatArchPrecTag(r)} | ${ALGORITHM_SHORT_LABELS[r.algorithm]} | ${r.topologyLabel} | ${r.minSeedScore} | +${lift.toFixed(0)} | ${r.learningDynamic ?? '—'} | ${r.failureAutopsy?.dominantFailure ?? 'OK'} |`
      );
    }
    lines.push('');
  }

  if (overfits.length > 0) {
    lines.push(
      '## 5. Severe Train-vs-Audit Overfit Collapses',
      '| Scenario | Arch/Prec | Algo | Topo | Train Best | Audit Min | Gen Gap | Dominant Crash |',
      '| :--- | :---: | :---: | :---: | ---: | ---: | ---: | :---: |'
    );
    for (const r of overfits) {
      const gap =
        r.failureAutopsy?.generalizationGap ??
        Math.max(0, r.bestScore - r.minSeedScore);
      lines.push(
        `| ${r.difficulty} | ${formatArchPrecTag(r)} | ${ALGORITHM_SHORT_LABELS[r.algorithm]} | ${r.topologyLabel} | ${r.bestScore} | ${r.minSeedScore} | ${gap} | ${r.failureAutopsy?.dominantFailure ?? '—'} |`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}
