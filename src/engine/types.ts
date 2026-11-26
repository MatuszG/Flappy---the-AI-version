export type GameMode = 'TRAINING' | 'VS_AI' | 'RESEARCH' | 'DOCS';

export type VsAiPhase = 'READY' | 'PLAYING' | 'GAME_OVER';

export type PlaySubMode = 'SOLO' | 'VS_AI';

export type DifficultyPreset =
  | 'EASY'
  | 'MEDIUM'
  | 'HARD'
  | 'INSANE'
  | 'EXTRA_INSANE'
  | 'STANDARD'
  | 'VARIABLE_SPEED'
  | 'DYNAMIC_GAPS'
  | 'MOVING_GAPS'
  | 'MOVING_GUSTS'
  | 'HEAVY_GRAVITY'
  | 'GUST_CHAOS'
  | 'TURBULENCE_EXTREME'
  | 'CUSTOM';

export type CoreDifficultyPreset =
  | 'EASY'
  | 'MEDIUM'
  | 'HARD'
  | 'INSANE'
  | 'EXTRA_INSANE';

export interface ScenarioSolvabilityProof {
  solvable: boolean;
  dtMinFrames: number;
  minGapPx: number;
  requiredDeltaYPx: number;
  maxClimbPx: number;
  maxDivePx: number;
  climbSlackPx: number;
  diveSlackPx: number;
  transitFrames: number;
  transitPipeTravelPx: number;
  transitClearancePx: number;
  summary: string;
}

export interface OptimizerParamSupport {
  usesMutationRate: boolean;
  usesMutationStrength: boolean;
  mutationRateLabel: string;
  mutationStrengthLabel: string;
  rateDisabledReason?: string;
  strengthDisabledReason?: string;
}

export type SensorFeatureId =
  | 'BIRD_Y'
  | 'VEL_VY'
  | 'PIPE_DX'
  | 'TOP_CLEAR'
  | 'BOT_CLEAR'
  | 'PIPE_VY'
  | 'NEXT_PIPE_DY'
  | 'NEXT_TOP_CLEAR'
  | 'NEXT_BOT_CLEAR'
  | 'NEXT_PIPE_DX'
  | 'NEXT_PIPE_VY'
  | 'PIPE_TTF';

export type LearningAlgorithm =
  | 'GA'
  | 'NATURAL_ES'
  | 'ADAM_ES'
  | 'ADAPTIVE_ES'
  | 'CEM'
  | 'DE'
  | 'PSO'
  | 'CMA_HYBRID';

export type NetworkArchitecture =
  | 'MLP'
  | 'RESIDUAL_SKIP'
  | 'LTC_FLY'
  | 'NEUROCHEM_GATE'
  | 'SYNAPTIC_STP'
  | 'LOOPED_REASONER'
  | 'PONDER_ACT'
  | 'SELECTIVE_SSM'
  | 'LATENT_ROLLOUT'
  | 'HYBRID_MOE'
  | 'DROSOPHILA_CONNECTOME'
  | 'DECOUPLED_FLY_CORTEX';

export type PerceptionMode = 'GEOMETRIC_LAB' | 'COMPOUND_EYE_PIXELS';

export interface DecoupledCortexTelemetry {
  activeSlots: [number, number];
  slotWeights: [number, number];
  memoryReadout: number;
  dopamineSignal: number;
  onlineUpdates: number;
  surpriseLevel: number;
  system2Active: boolean;
}

export type HybridExpertKind = 'LTC_FLY' | 'SELECTIVE_SSM' | 'PONDER_ACT';

export type ComputeProfileKind = 'GPU_LOCKSTEP' | 'CPU_SPECIALIZED';

export type EvolutionTopologyMode = 'SINGLE_SPECIES' | 'ISLAND_SPECIATION';

export type FailureCause =
  | 'FLOOR'
  | 'CEILING'
  | 'PIPE_TOP'
  | 'PIPE_BOTTOM'
  | 'NONE';

export interface FailureAutopsy {
  totalDeaths: number;
  floorDeaths: number;
  ceilingDeaths: number;
  pipeTopDeaths: number;
  pipeBottomDeaths: number;
  avgDeathAbsVy: number;
  avgDeathGapErr: number;
  dominantFailure: FailureCause;
  generalizationGap: number;
}

export interface ReasoningTelemetry {
  avgPonderSteps: number;
  calmPonderSteps: number;
  dangerPonderSteps: number;
  system2Ratio: number;
  avgRolloutAdvantage: number;
  avgSsmGate: number;
}

export type LearningDynamicKind =
  | 'G1_INSTANT'
  | 'SMOOTH_CLIMB'
  | 'PHASE_TRANSITION'
  | 'PLATEAU'
  | 'OVERFIT_COLLAPSE';

export type MorphogenesisMode = 'STATIC' | 'GROWING' | 'PAIRED_AB';

export type MorphogenesisEventKind =
  | 'GROW_WIDTH'
  | 'GROW_K'
  | 'UNLOCK_SENSOR'
  | 'PRUNE'
  | 'SPAWN_EXPERT'
  | 'COMMIT_EXPERT'
  | 'ROLLBACK_EXPERT'
  | 'ISLAND_REBALANCE';

export interface MorphogenesisConfig {
  /** Fraction of ceiling hidden neurons active at Generation 0 (default 0.5, min 2/layer) */
  initialWidthRatio: number;
  /** Generations without improvement before evaluating a structural growth/prune event (default 10) */
  growthStagnationTrigger: number;
  /** Fraction of active hidden units saturated (|h| > 0.88) to prioritize width expansion (default 0.62) */
  saturationThreshold: number;
  /** Mutation scale multiplier on mature myelinated core synapses after growth (default 0.25) */
  myelinationScale: number;
  /** Absolute weight cutoff below which active synapses are candidates for pruning (default 0.06) */
  pruneThreshold: number;
  /** Fraction of near-zero active weights required to trigger Synaptic Pruning (default 0.28) */
  pruneSparsityTrigger: number;
  /** Defer advanced sensors (PIPE_VY, NEXT_PIPE_DY) until core reflex stabilizes (default true) */
  progressiveSensors: boolean;
  /** Ramp iterative reasoning steps K from 1 -> maxK on demand (default true) */
  growReasoningSteps: boolean;
  /** Gentle per-frame training penalty per extra PONDER_ACT step > 1 to incentivize S1 vs S2 (default 0.015) */
  metabolicStepCost: number;
  /** Per-frame training penalty per excess kFLOP (in units of 100 FLOPs) above reflex MLP core (default 0.004) */
  flopsPenaltyWeight?: number;
  /** Protective trial grace window (generations) before committing or rolling back a newly spawned expert (default 12) */
  expertTrialWindowGens?: number;
  /** Minimum net fitness gain over baseline required at end of trial window to commit expert (default 1.2) */
  expertMinRoiGain?: number;
  /** Allow HYBRID_MOE to progressively attach LTC_FLY / SELECTIVE_SSM / PONDER_ACT experts (default true) */
  allowExpertSpawning?: boolean;
}

export interface MorphogenesisEvent {
  generation: number;
  kind: MorphogenesisEventKind;
  detail: string;
  saturationPct: number;
  sparsityPct: number;
  activeParamsAfter: number;
}

export interface HybridModuleTelemetry {
  activeExperts: HybridExpertKind[];
  routerWeights: Record<'MLP' | HybridExpertKind, number>;
  alphaGates: Record<HybridExpertKind, number>;
  inTrialExpert: HybridExpertKind | null;
  trialGensRemaining: number;
  avgFlopsPerFrame: number;
  rollbackCount: number;
  committedExpertsCount?: number;
}

export interface IslandSpeciesSnapshot {
  species: NetworkArchitecture;
  sharePct: number;
  popCount: number;
  aliveCount?: number;
  currentGenBestScore?: number;
  bestScore: number;
  bestFitness: number;
  avgFlopsPerFrame: number;
  efficiencyScore: number;
}

export interface IslandSpeciationSummary {
  enabled: boolean;
  rebalanceCount: number;
  winningSpecies: NetworkArchitecture;
  finalShares: IslandSpeciesSnapshot[];
  allocationTimeline: Array<{
    generation: number;
    shares: Record<string, number>;
    leaderSpecies: NetworkArchitecture;
  }>;
}

export interface MorphogenesisSnapshot {
  enabled: boolean;
  stage: number;
  maxStages: number;
  activeHiddenCounts: number[];
  ceilingHiddenCounts: number[];
  activeSensorCount: number;
  totalSensorCount: number;
  activeReasoningSteps: number;
  maxReasoningSteps: number;
  activeParams: number;
  ceilingParams: number;
  prunedSynapses: number;
  lastSaturationPct: number;
  /** Per-layer per-neuron state: 0=dormant, 1=myelinated core, 2=plastic newborn */
  nodeStates: number[][];
  /** Per-transition flat weight state: 0=dormant/pruned, 1=myelinated, 2=plastic */
  edgeStates: number[][];
  events: MorphogenesisEvent[];
  hybridTelemetry?: HybridModuleTelemetry;
}

export interface MorphogenesisSummary {
  initialActiveParams: number;
  finalActiveParams: number;
  ceilingParams: number;
  prunedSynapses: number;
  growthEventsCount: number;
  pruneEventsCount: number;
  finalReasoningSteps: number;
  finalActiveSensors: number;
  finalHiddenCounts: number[];
  eventTimeline: MorphogenesisEvent[];
  activeExperts?: HybridExpertKind[];
  rollbackCount?: number;
  committedExpertsCount?: number;
  avgFlopsPerFrame?: number;
  computeRoiScore?: number;
  expertUsageRatio?: Record<'MLP' | HybridExpertKind, number>;
}

export type WeightPrecision =
  | 'FP32'
  | 'FP16'
  | 'INT8'
  | 'INT4'
  | 'TERNARY'
  | 'BINARY';

export interface PolicyMechanismProfile {
  sensorImportance: number[];
  sensorSignedSensitivity: number[];
  dominantSensor: string;
  weightL2Norm: number;
  weightMeanAbs: number;
  sparsityRatio: number;
  flapRateCanonical: number;
  linearFormula: string | null;
}

export interface EnvironmentConfig {
  label: string;
  gap: number;
  gapVariance: number;
  pipeSpeed: number;
  speedVariability: number;
  spawnFrames: number;
  movingPipes: boolean;
  moveAmplitude: number;
  gravityScale: number;
}

export interface SerializedNeuralNetwork {
  inputNodes: number;
  inputFeatures?: SensorFeatureId[];
  hiddenNodes: number;
  hiddenLayers?: number[];
  outputNodes: number;
  architecture?: NetworkArchitecture;
  weightPrecision?: WeightPrecision;
  reasoningSteps?: number;
  bioParams?: number[];
  hybridActiveExperts?: HybridExpertKind[];
  weightsIH: number[];
  biasH: number[];
  weightsHO: number[];
  biasO: number[];
  layerWeights?: number[][];
  layerBiases?: number[][];
}

export interface NetworkSnapshot {
  inputs: number[];
  inputFeatures?: SensorFeatureId[];
  hiddenActivations: number[];
  output: number;
  shouldFlap: boolean;
  weightsIH: number[];
  weightsHO: number[];
  inputNodes: number;
  hiddenNodes: number;
  outputNodes: number;
  layers: number[];
  activations: number[][];
  layerWeights: number[][];
  architecture?: NetworkArchitecture;
  computeProfile?: ComputeProfileKind;
  flopsPerFrame?: number;
  reasoningStepInfo?: {
    ponderSteps: number;
    maxSteps: number;
    rolloutAdvantage?: number;
    ssmGateMean?: number;
  };
  morphogenesis?: MorphogenesisSnapshot;
  hybridTelemetry?: HybridModuleTelemetry;
  islandTelemetry?: IslandSpeciesSnapshot[];
  decoupledTelemetry?: DecoupledCortexTelemetry;
}

export interface Pipe {
  id: number;
  x: number;
  gapTop: number;
  gapBottom: number;
  gapCenter: number;
  baseGapTop: number;
  gapSize: number;
  phase: number;
  gapVy?: number;
  passedByPlayer: boolean;
  passedByChampion: boolean;
}

export interface BirdRenderState {
  id: number;
  x: number;
  y: number;
  vy: number;
  rotation: number;
  alive: boolean;
  opacity: number;
  score: number;
  fitness: number;
  isLeader: boolean;
  isPlayer: boolean;
  isChampion: boolean;
  wingPhase: number;
  species?: NetworkArchitecture;
  islandIndex?: number;
  isSpeciesLeader?: boolean;
}

export interface EvolutionConfig {
  algorithm: LearningAlgorithm;
  populationSize: number;
  mutationRate: number;
  mutationStrength: number;
  elitismCount: number;
  hiddenNodes: number;
  hiddenLayers: number[];
  inputFeatures?: SensorFeatureId[];
  architecture?: NetworkArchitecture;
  weightPrecision?: WeightPrecision;
  difficulty: DifficultyPreset;
  customEnvironment?: EnvironmentConfig;
  /** Unproven Overdrive percentage (100..145, default 120 for EXTRA_INSANE) pushing physics beyond deterministic solvability proofs */
  overdrivePct?: number;
  /** Optional progressive difficulty annealing during training (audit always uses 100% target physics) */
  curriculumLearning?: boolean;
  /** Number of generations over which curriculum ramps to 100% target physics (default 20) */
  curriculumGenerations?: number;
  /** Optional continuous centering & trajectory-stability fitness shaping during training */
  shapedFitness?: boolean;
  /** Optional recursive thinking steps K for LOOPED_REASONER / max steps for PONDER_ACT (default 3) */
  reasoningSteps?: number;
  /** Optional Bio-Inspired Self-Growing Morphogenesis mode during training */
  morphogenesis?: boolean;
  morphogenesisConfig?: Partial<MorphogenesisConfig>;
  /** Evolution topology mode: single homogeneous species vs competing multi-architecture islands */
  evolutionTopologyMode?: EvolutionTopologyMode;
  islandSpecies?: NetworkArchitecture[];
  /** Currently inspected species in Arena Live mode (null = auto-follow overall leader) */
  inspectedSpecies?: NetworkArchitecture | null;
  /** Realistic perception mode: clean laboratory geometry vs compound-eye optical pixel rays */
  perceptionMode?: PerceptionMode;
  /** Optical contrast / fog noise level in compound-eye pixel mode (0.0 .. 0.35, default 0.08) */
  opticalNoiseLevel?: number;
  /** In-flight non-stationary physics anomaly zones (periodic gravity/gust shifts every ~15 pipes) */
  nonStationaryAnomalies?: boolean;
  /** Enable real-time online lifetime dopamine plasticity on associative skill memory during flight */
  onlinePlasticity?: boolean;
}

export interface GenerationRecord {
  generation: number;
  bestScore: number;
  bestFitness: number;
  avgFitness: number;
  avgScore: number;
  allTimeBestScore: number;
}

export interface SavedBrain {
  id: string;
  name: string;
  bestScore: number;
  generation: number;
  createdAt: string;
  isPreset?: boolean;
  network: SerializedNeuralNetwork;
}

export type SpeedSetting = 1 | 2 | 5 | 10 | 25 | 50 | 100 | 250 | 500 | 'MAX';

export interface ArcadeOrb {
  id: number;
  x: number;
  y: number;
  baseY: number;
  radius: number;
  points: number;
  kind: 'STAR' | 'PRISM';
  phase: number;
  collected: boolean;
}

export interface PlayScorePopup {
  id: number;
  x: number;
  y: number;
  label: string;
  color: string;
  ttl: number;
}

export interface RenderSnapshot {
  birds: BirdRenderState[];
  pipes: Pipe[];
  groundOffset: number;
  nextPipe: Pipe | null;
  nextPipe2?: Pipe | null;
  mode: GameMode;
  vsAiPhase: VsAiPhase;
  difficulty: DifficultyPreset;
  environment: EnvironmentConfig;
  activeInputFeatures: SensorFeatureId[];
  tickSpeed: number;
  perceptionMode?: PerceptionMode;
  opticalNoiseLevel?: number;
  anomalyActive?: boolean;
  anomalyGravityMult?: number;
  arcadeOrbs?: ArcadeOrb[];
  scorePopups?: PlayScorePopup[];
  playerPoints?: number;
  playerCombo?: number;
  ommatidiaRays?: Array<{
    angleRad: number;
    hitDistNorm: number;
    gapPassDistNorm?: number;
    luminance: number;
    temporalDelta: number;
    hitSurface: 'SKY' | 'PIPE' | 'GAP' | 'GROUND';
  }>;
}

export interface LearningMilestones {
  reached1Gen: number | null;
  reached1Ms: number | null;
  reached10Gen: number | null;
  reached10Ms: number | null;
  reached50Gen: number | null;
  reached50Ms: number | null;
  reached100Gen: number | null;
  reached100Ms: number | null;
  elapsedMs: number;
}

export interface SimulationTelemetry {
  mode: GameMode;
  vsAiPhase: VsAiPhase;
  algorithm: LearningAlgorithm;
  generation: number;
  aliveCount: number;
  totalPopulation: number;
  currentBestScore: number;
  allTimeBestScore: number;
  allTimeBestGeneration: number;
  playerScore: number;
  playerPoints?: number;
  playerCurrentCombo?: number;
  playerMaxCombo?: number;
  playerOrbsCollected?: number;
  aiOpponentScore: number;
  playerAlive: boolean;
  aiOpponentAlive: boolean;
  vsAiWinner: 'PLAYER' | 'AI' | 'TIE' | null;
  leaderNetwork: NetworkSnapshot | null;
  history: GenerationRecord[];
  hasChampionBrain: boolean;
  milestones?: LearningMilestones;
  speciesSnapshots?: IslandSpeciesSnapshot[];
  activeInspectedSpecies?: NetworkArchitecture | null;
}

export type ComputeBackend = 'AUTO' | 'CPU' | 'GPU' | 'HYBRID';

export interface ResearchSweepConfig {
  algorithms: LearningAlgorithm[];
  difficulties: DifficultyPreset[];
  topologies: number[][];
  topologiesByArchitecture?: Partial<Record<NetworkArchitecture, number[][]>>; // Optional per-architecture Depth x Width subset
  inputFeatureSets?: SensorFeatureId[][];
  architectures?: NetworkArchitecture[];
  weightPrecisions?: WeightPrecision[];
  maxParameters?: number | null; // Optional upper parameter budget cap (e.g. 50)
  populationSizes: number[];
  mutationRates: number[];
  mutationStrengths: number[];
  maxGenerations: number | null;
  stagnationLimit: number | null;
  targetPipeCap: number;
  verificationSeeds: number;
  workerThreads: number; // 0 = Auto (follows priority slider), -1 = Max (cores), -2 = Turbo (audit-boosted), or explicit 1..32
  performancePriority?: number; // 0 (Silent/Cool max Perf/W) .. 100 (Max Speed/Turbo); default 70
  gpuLoadPercent?: number; // 10..100% target GPU utilization (default 100% = full GPU focus with TDR guard)
  computeBackend?: ComputeBackend; // CPU (workers), GPU (WebGPU compute), HYBRID (CPU + WebGPU simultaneously)
  auditParallelism?: boolean; // Fan out multi-seed audits across parallel audit workers (default true)
  scheduleMode?: 'BALANCED' | 'LPT'; // BALANCED interleaves light & heavy trials; LPT runs heaviest first
  autosaveIntervalSec?: number; // 0 = Manual/end-only, default 60
  smartPrune?: boolean; // Skip mathematically redundant / no-op trials (default true)
  curriculumLearning?: boolean; // Optional progressive difficulty ramp during training (default false)
  curriculumOptions?: boolean[]; // Multi-select A/B options for Curriculum (e.g. [false, true]); falls back to [Boolean(curriculumLearning)]
  shapedFitness?: boolean; // Optional smooth centering/stability training fitness shaping (default false)
  shapedFitnessOptions?: boolean[]; // Multi-select A/B options for Shaped Fitness (e.g. [false, true]); falls back to [Boolean(shapedFitness)]
  reasoningSteps?: number; // Optional Test-Time Compute recursive steps K for Looped/Ponder (default 3)
  reasoningStepsList?: number[]; // Multi-select K values for Looped/Ponder (e.g. [2, 3, 4]); falls back to [reasoningSteps ?? 3]
  morphogenesisMode?: MorphogenesisMode; // STATIC | GROWING | PAIRED_AB
  morphogenesisByArchitecture?: Partial<Record<NetworkArchitecture, MorphogenesisMode>>; // Optional per-architecture morphogenesis override
  morphogenesisConfig?: Partial<MorphogenesisConfig>;
  algorithmsByArchitecture?: Partial<Record<NetworkArchitecture, LearningAlgorithm[]>>; // Optional per-architecture optimizer subset
  evolutionTopologyMode?: EvolutionTopologyMode;
  islandSpecies?: NetworkArchitecture[];
  customEnvironment?: EnvironmentConfig;
  perceptionMode?: PerceptionMode;
  perceptionModes?: PerceptionMode[]; // Multi-select perception modes for Drosophila/Fly-Cortex (e.g. ['GEOMETRIC_LAB', 'COMPOUND_EYE_PIXELS'])
  opticalNoiseLevel?: number;
  nonStationaryAnomalies?: boolean;
  onlinePlasticity?: boolean;
}

export interface SmartPruneBreakdown {
  skipOnDepth0: number;
  unusedMutationRate: number;
  staticPipeVy: number;
  blindNoClearance: number;
}

export interface KnowledgeEntry {
  id: string;
  category: 'PRUNE_RULE' | 'EMPIRICAL' | 'PERFORMANCE' | 'FRONTIER';
  status: 'VERIFIED' | 'AUTO_DISCOVERED';
  title: string;
  summary: string;
  evidence: string;
  impact: string;
  source: 'BUILTIN' | 'AUTO_RUN';
  createdAt: string;
}

export interface PerfReportSnapshot {
  wallSec: number;
  backendLabel: string;
  priorityLevel: number;
  priorityLabel: string;
  hardwareCores: number;
  trainWorkers: number;
  auditWorkers: number;
  avgActiveCores: number;
  coreOccupancyPct: number;
  internalDutyPct: number;
  totalTrials: number;
  cpuTrials: number;
  gpuTrials: number;
  g1PerfectTrials: number;
  trialsPerSec: number;
  totalTicksM: number;
  ticksMPerSec: number;
  ticksPerActiveCore: number;
  estRelPower: number;
  estPerfPerWatt: number;
  thermalDriftPct: number | null;
  thermalStatus: 'INSUFFICIENT_DATA' | 'COOL_STABLE' | 'MILD_DRIFT' | 'THERMAL_THROTTLING';
  peakWindowMps: number;
  lateWindowMps: number;
  trainCpuPct: number;
  auditCpuPct: number;
  avgLoopLagMs: number;
  p95LoopLagMs: number;
  p99LoopLagMs: number;
  maxLoopLagMs: number;
  longLagTicks: number;
  timerTicks: number;
  gpuTicksMPerSec: number;
  avgGpuBatchMs: number;
}

export interface IntegrityCheckItem {
  label: string;
  passed: boolean;
  detail: string;
}

export interface IntegrityCheckSummary {
  allPassed: boolean;
  checks: IntegrityCheckItem[];
}

export interface QueuedExperiment {
  id: string;
  name: string;
  presetId?: string;
  notes?: string;
  config: ResearchSweepConfig;
  addedAt: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'STOPPED';
}

export interface ExperimentRunRecord {
  id: string;
  name: string;
  presetId?: string;
  startedAt: string;
  completedAt: string;
  status: 'COMPLETED' | 'STOPPED';
  durationSec: number;
  config: ResearchSweepConfig;
  summary: {
    totalTrials: number;
    verifiedPerfect: number;
    g1Perfect: number;
    perfectRatePct: number;
    bestMinSeedScore: number;
    bestTrialSummary: string;
    scenariosCount: number;
    architecturesCount: number;
    algorithmsCount: number;
  };
  perfMetrics: PerfReportSnapshot | null;
  perfLogMarkdown: string;
  scientificReportMarkdown: string;
  integrity?: IntegrityCheckSummary | null;
  /** ISO timestamps marking whether this run's logs/reports have already been copied/reviewed for meta-analysis */
  perfReviewedAt?: string | null;
  reportReviewedAt?: string | null;
  metaReviewedAt?: string | null;
  /** Optional user-assigned research hypothesis tag / note for cross-run ledger grouping */
  hypothesisTag?: string;
}

export type TrialStoppedReason = 'PERFECT' | 'MAX_GENS' | 'STAGNATED' | 'SKIPPED';

export interface ResearchTrialResult {
  id: string;
  trialSignature?: string;
  algorithm: LearningAlgorithm;
  difficulty: DifficultyPreset;
  architecture?: NetworkArchitecture;
  weightPrecision?: WeightPrecision;
  bitsPerParam?: number;
  totalBits?: number;
  pipesPerBit?: number;
  inputFeatures?: SensorFeatureId[];
  inputCount?: number;
  inputSetLabel?: string;
  topology: number[];
  topologyLabel: string;
  depth: number;
  maxWidth: number;
  hiddenNodes: number;
  hiddenNeuronCount: number;
  weightCount: number;
  biasCount: number;
  parameterCount: number;
  mutationRate: number;
  mutationStrength: number;
  populationSize: number;
  targetPipeCap: number;
  verificationSeeds: number;
  curriculumLearning?: boolean;
  shapedFitness?: boolean;
  reasoningSteps?: number;
  morphogenesisMode?: 'STATIC' | 'GROWING';
  morphogenesisSummary?: MorphogenesisSummary | null;
  evolutionTopologyMode?: EvolutionTopologyMode;
  perceptionMode?: PerceptionMode;
  computeProfile?: ComputeProfileKind;
  meanFlopsPerFrame?: number;
  computeEfficiencyScore?: number;
  islandSummary?: IslandSpeciationSummary | null;
  bestScore: number;
  minSeedScore: number;
  meanSeedScore: number;
  seedScores: number[];
  verifiedPerfect: boolean;
  stoppedReason: TrialStoppedReason;
  bestFitness: number;
  finalAvgScore: number;
  generationsRun: number;
  solved: boolean;
  generationsToSolve: number | null;
  timeToPerfectionMs: number | null;
  totalTicksEvaluated: number;
  trainingTicksEvaluated?: number;
  auditTicksEvaluated?: number;
  birdEpisodesEvaluated?: number;
  trainingSynapticOps?: number;
  normalizedComputeMs?: number;
  ticksPerSecond: number;
  knowledgeDensity: number;
  generalizationRatio: number;
  durationMs: number;
  policyProfile?: PolicyMechanismProfile | null;
  failureAutopsy?: FailureAutopsy | null;
  reasoningTelemetry?: ReasoningTelemetry | null;
  learningDynamic?: LearningDynamicKind;
  bestBrain: SerializedNeuralNetwork | null;
  scoreCurve: number[];
}

export interface WorkerSlotProgress {
  workerId: number;
  trialIndex: number;
  algorithm: LearningAlgorithm | null;
  difficulty: DifficultyPreset | null;
  architecture?: NetworkArchitecture;
  evolutionTopologyMode?: EvolutionTopologyMode;
  computeProfile?: ComputeProfileKind;
  weightPrecision?: WeightPrecision;
  inputFeatures?: SensorFeatureId[];
  topology: number[];
  populationSize: number;
  generation: number;
  bestScore: number;
  phase: 'IDLE' | 'TRAINING' | 'AUDITING';
  auditDetail?: string;
}

export interface ResearchProgress {
  status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
  currentTrialIndex: number;
  completedTrials: number;
  sessionCompletedTrials?: number;
  liveTrialsPerSec?: number;
  totalTrials: number;
  workerCount: number;
  auditWorkerCount?: number;
  activeAuditSeeds?: number;
  queueRemaining?: number;
  prunedRedundantCount?: number;
  prunedBreakdown?: SmartPruneBreakdown;
  computeBackend?: ComputeBackend;
  performancePriority?: number;
  priorityLabel?: string;
  liveTicksPerSec?: number;
  liveTicksPerCore?: number;
  liveEstPerfPerWatt?: number;
  autoTuneStatus?: string;
  gpuActive?: boolean;
  gpuLabel?: string;
  gpuActiveTrials?: number;
  gpuTicksPerSec?: number;
  activeWorkers: WorkerSlotProgress[];
  activeAlgorithm: LearningAlgorithm | null;
  activeDifficulty: DifficultyPreset | null;
  activeTopology: number[];
  activeHiddenNodes: number;
  activePopulationSize: number;
  activeMutationRate: number;
  activeMutationStrength: number;
  activeGeneration: number;
  activeBestScore: number;
  activePhase: 'TRAINING' | 'AUDITING';
  elapsedMs: number;
}
