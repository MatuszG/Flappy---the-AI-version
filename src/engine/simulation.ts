import { PopulationBatchKernel } from './cpuBatchKernel';
import {
  DEFAULT_ISLAND_SPECIES,
  IslandSpeciationCoordinator,
  type IslandMemberSpec,
} from './islandSpeciation';
import { MorphogenesisController } from './morphogenesis';
import {
  estimateArchitectureFlops,
  getTrialComputeProfile,
  NeuralNetwork,
  normalizeHiddenLayers,
} from './neuralNetwork';
import {
  createOptimizer,
  type EvolutionOptimizer,
  type OptimizerContext,
  type OptimizerMember,
  type SpawnedMemberSpec,
} from './optimizers';
import {
  BIRD_RADIUS,
  BIRD_X,
  CANVAS_WIDTH,
  FLOOR_HIT_R,
  GRAVITY,
  JUMP_IMPULSE,
  MAX_PIPE_VY_NORM,
  MAX_VY,
  PIPE_HIT_R,
  PIPE_HIT_R2,
  PIPE_WIDTH,
  PLAYABLE_HEIGHT,
  resolveCurriculumEnvironment,
  resolveEnvironment,
} from './physics';
import {
  ALL_SENSOR_FEATURES,
  buildCompoundEyePixelInputs,
  getInputFeatureIndices,
  isFullSensorSet,
  normalizeInputFeatures,
  sampleCompoundEyeOmmatidia,
} from './sensors';
import type {
  ArcadeOrb,
  BirdRenderState,
  ComputeProfileKind,
  EnvironmentConfig,
  EvolutionConfig,
  EvolutionTopologyMode,
  GameMode,
  GenerationRecord,
  IslandSpeciationSummary,
  LearningMilestones,
  MorphogenesisSnapshot,
  MorphogenesisSummary,
  NetworkArchitecture,
  NetworkSnapshot,
  Pipe,
  PlayScorePopup,
  RenderSnapshot,
  SensorFeatureId,
  SerializedNeuralNetwork,
  SimulationTelemetry,
  VsAiPhase,
} from './types';

// Re-export modular physics, evaluator, batch kernel & optimizer APIs for 100% backward compatibility
export * from './physics';
export * from './evaluator';
export * from './optimizers';
export * from './cpuBatchKernel';
export * from './morphogenesis';
export * from './islandSpeciation';

interface InternalBird extends OptimizerMember {
  y: number;
  vy: number;
  alive: boolean;
  deathOpacity: number;
  hitFloorOrCeiling: boolean;
  lastPassedPipeId: number;
  isPlayer: boolean;
  wingPhase: number;
  species?: NetworkArchitecture;
  islandIndex?: number;
  excessFlopsCost?: number;
  prevAbsDy?: number;
  prevOmmatidiaLum?: Float64Array;
}

export interface SimulationCallbacks {
  onScore?: () => void;
  onOrbCollect?: (isPrism: boolean) => void;
  onCrash?: () => void;
  onGenerationAdvance?: () => void;
}

export class FlappySimulation {
  private config: EvolutionConfig;
  private optimizer: EvolutionOptimizer;
  private mode: GameMode = 'TRAINING';
  private vsAiPhase: VsAiPhase = 'READY';

  private generation = 1;
  private frameCount = 0;
  private totalTicksEvaluated = 0;
  private pipeCounter = 0;
  private groundOffset = 0;
  private lastTickSpeed = 2.85;
  private distUntilNextSpawn = 260;
  private speedPhaseA = Math.random() * Math.PI * 2;
  private speedPhaseB = Math.random() * Math.PI * 2;
  private pipes: Pipe[] = [];

  private birds: InternalBird[] = [];
  private playerBird: InternalBird | null = null;
  private aiOpponentBird: InternalBird | null = null;

  private currentGenBestScore = 0;
  private allTimeBestScore = 0;
  private allTimeBestFitness = 0;
  private allTimeBestGeneration = 0;
  private allTimeBestBrain: NeuralNetwork | null = null;
  private pendingBestBird: InternalBird | null = null;
  private vsAiOpponentBrain: NeuralNetwork | null = null;
  private history: GenerationRecord[] = [];
  private callbacks: SimulationCallbacks;
  private runAccumulatedMs = 0;
  private runSegmentStartMs = performance.now();
  private runClockPaused = false;
  private milestones: LearningMilestones = {
    reached1Gen: null,
    reached1Ms: null,
    reached10Gen: null,
    reached10Ms: null,
    reached50Gen: null,
    reached50Ms: null,
    reached100Gen: null,
    reached100Ms: null,
    elapsedMs: 0,
  };

  private readonly rawInputBuffer = new Float64Array(ALL_SENSOR_FEATURES.length);
  private inputBuffer = new Float64Array(ALL_SENSOR_FEATURES.length);
  private inputIndices: number[] = [0, 1, 2, 3, 4];
  private useFullInputs = false;
  private inputSensorMask = 0x7f;
  private isOnlyBotClear = false;
  private aliveBirds: InternalBird[] = [];
  private aliveBirdsDirty = true;
  private batchKernel: PopulationBatchKernel | null = null;
  private batchDirty = false;
  private batchKernelEnabled = true;
  private morphogenesis: MorphogenesisController | null = null;
  private islandCoordinator: IslandSpeciationCoordinator | null = null;
  private lastMeanFlopsPerFrame = 0;
  private vsAiSoloMode = false;
  private playerPoints = 0;
  private playerCurrentCombo = 0;
  private playerMaxCombo = 0;
  private playerOrbsCollected = 0;
  private orbCounter = 0;
  private popupCounter = 0;
  private arcadeOrbs: ArcadeOrb[] = [];
  private scorePopups: PlayScorePopup[] = [];
  private readonly batchFrameParams = {
    hasNextPipe: false,
    gapTop: 0,
    gapBottom: 0,
    gapCenter: 0,
    pipeEdgeX: 0,
    gapVy: 0,
    next2GapCenter: null as number | null,
    next2GapTop: 0,
    next2GapBot: 0,
    next2PipeEdgeX: null as number | null,
    next2GapVy: 0,
    tickSpeed: 2.85,
    movingPipes: false,
    pipeHorizHit: false,
    pipeEffY: 0,
    passedFirstPipe: false,
    firstPipeId: 0,
    gravity: 0,
    jumpImpulse: 0,
    useShaped: false,
    metabolicStepCost: 0,
  };
  private readonly headlessBatchOut = {
    framesStepped: 0,
    genAdvanced: false,
    auditTriggered: false,
    genTimedOut: false,
  };

  constructor(config: EvolutionConfig, callbacks: SimulationCallbacks = {}) {
    this.config = this.normalizeConfig(config);
    this.optimizer = createOptimizer(this.config.algorithm);
    this.optimizer.reset(this.config);
    this.syncInputBuffers();
    this.callbacks = callbacks;
    this.initTrainingGeneration(true);
  }

  private syncInputBuffers(): void {
    const features = normalizeInputFeatures(this.config.inputFeatures);
    this.useFullInputs = isFullSensorSet(features);
    this.inputIndices = getInputFeatureIndices(features);
    let mask = 0;
    for (let i = 0; i < this.inputIndices.length; i++) {
      mask |= 1 << this.inputIndices[i];
    }
    this.inputSensorMask = mask;
    this.isOnlyBotClear =
      this.inputIndices.length === 1 && this.inputIndices[0] === 4;
    this.inputBuffer = this.useFullInputs
      ? this.rawInputBuffer
      : new Float64Array(features.length);
  }

  private syncAliveBirds(): void {
    const alive = this.aliveBirds;
    alive.length = 0;
    const birds = this.birds;
    for (let i = 0; i < birds.length; i++) {
      if (birds[i].alive) {
        alive.push(birds[i]);
      }
    }
    this.aliveBirdsDirty = false;
  }

  private normalizeConfig(cfg: EvolutionConfig): EvolutionConfig {
    const hiddenLayers = normalizeHiddenLayers(
      cfg.hiddenLayers !== undefined ? cfg.hiddenLayers : cfg.hiddenNodes
    );
    const hiddenNodes =
      hiddenLayers.length === 1
        ? hiddenLayers[0]
        : hiddenLayers.reduce((a, b) => a + b, 0);
    const inputFeatures = normalizeInputFeatures(cfg.inputFeatures);
    return {
      ...cfg,
      hiddenLayers,
      hiddenNodes,
      inputFeatures,
      architecture: cfg.architecture ?? 'MLP',
      weightPrecision: cfg.weightPrecision ?? 'FP32',
      curriculumLearning: Boolean(cfg.curriculumLearning),
      curriculumGenerations: cfg.curriculumGenerations ?? 18,
      shapedFitness: Boolean(cfg.shapedFitness),
      reasoningSteps: cfg.reasoningSteps,
      morphogenesis: Boolean(cfg.morphogenesis),
      morphogenesisConfig: cfg.morphogenesisConfig
        ? { ...cfg.morphogenesisConfig }
        : undefined,
      evolutionTopologyMode: cfg.evolutionTopologyMode ?? 'SINGLE_SPECIES',
      islandSpecies:
        cfg.islandSpecies && cfg.islandSpecies.length >= 2
          ? [...cfg.islandSpecies]
          : [...DEFAULT_ISLAND_SPECIES],
      inspectedSpecies: cfg.inspectedSpecies ?? null,
      overdrivePct:
        cfg.overdrivePct !== undefined
          ? Math.max(100, Math.min(145, Math.round(cfg.overdrivePct)))
          : 120,
      perceptionMode: cfg.perceptionMode ?? 'GEOMETRIC_LAB',
      opticalNoiseLevel: Math.max(0, Math.min(0.35, cfg.opticalNoiseLevel ?? 0)),
      nonStationaryAnomalies: Boolean(cfg.nonStationaryAnomalies),
      onlinePlasticity:
        cfg.onlinePlasticity !== undefined
          ? Boolean(cfg.onlinePlasticity)
          : cfg.architecture === 'DECOUPLED_FLY_CORTEX',
    };
  }

  private initMorphogenesisController(): void {
    if (this.config.evolutionTopologyMode === 'ISLAND_SPECIATION') {
      this.morphogenesis = null;
      return;
    }
    if (!this.config.morphogenesis) {
      this.morphogenesis = null;
      return;
    }
    const features = normalizeInputFeatures(this.config.inputFeatures);
    const sample = new NeuralNetwork(
      features.length,
      this.config.hiddenLayers,
      1,
      undefined,
      features,
      this.config.architecture ?? 'MLP',
      this.config.weightPrecision ?? 'FP32',
      this.config.reasoningSteps
    );
    this.morphogenesis = new MorphogenesisController(
      sample,
      this.config.morphogenesisConfig
    );
  }

  private createBrain(serialized?: SerializedNeuralNetwork): NeuralNetwork {
    const features = normalizeInputFeatures(this.config.inputFeatures);
    const brain = new NeuralNetwork(
      features.length,
      this.config.hiddenLayers,
      1,
      serialized,
      features,
      this.config.architecture ?? 'MLP',
      this.config.weightPrecision ?? 'FP32',
      this.morphogenesis
        ? this.morphogenesis.activeReasoningSteps
        : this.config.reasoningSteps
    );
    if (this.morphogenesis && !serialized) {
      this.morphogenesis.enforceOnBrain(brain);
    }
    return brain;
  }

  private getOptimizerContext(): OptimizerContext {
    return {
      config: this.config,
      createBrain: () => this.createBrain(),
      allTimeBestBrain: this.allTimeBestBrain,
      plasticityScale: this.morphogenesis?.plasticityScale,
      activeParamMask: this.morphogenesis?.activeParamMask,
    };
  }

  getMorphogenesisSnapshot(): MorphogenesisSnapshot | null {
    if (this.islandCoordinator) {
      return this.islandCoordinator.getMorphogenesisSnapshot();
    }
    return this.morphogenesis ? this.morphogenesis.getSnapshot() : null;
  }

  getMorphogenesisSummary(): MorphogenesisSummary | null {
    if (this.islandCoordinator) {
      return this.islandCoordinator.getMorphogenesisSummary();
    }
    return this.morphogenesis ? this.morphogenesis.getSummary() : null;
  }

  getIslandSummary(): IslandSpeciationSummary | null {
    return this.islandCoordinator ? this.islandCoordinator.getSummary() : null;
  }

  getComputeStats(): {
    computeProfile: ComputeProfileKind;
    evolutionTopologyMode: EvolutionTopologyMode;
    meanFlopsPerFrame: number;
  } {
    const arch = this.config.architecture ?? 'MLP';
    const evoMode = this.config.evolutionTopologyMode ?? 'SINGLE_SPECIES';
    const meanFlopsPerFrame = this.islandCoordinator
      ? this.islandCoordinator.getMeanFlopsPerFrame()
      : this.lastMeanFlopsPerFrame > 0
        ? this.lastMeanFlopsPerFrame
        : this.morphogenesis
          ? this.morphogenesis.computeActiveFlops()
          : estimateArchitectureFlops(
              this.config.hiddenLayers,
              normalizeInputFeatures(this.config.inputFeatures).length,
              arch,
              this.config.reasoningSteps ?? 3
            );
    return {
      computeProfile: getTrialComputeProfile(arch, evoMode),
      evolutionTopologyMode: evoMode,
      meanFlopsPerFrame: Number(meanFlopsPerFrame.toFixed(1)),
    };
  }

  getActiveReasoningSteps(): number {
    if (this.islandCoordinator) {
      return this.islandCoordinator.getActiveReasoningSteps();
    }
    if (this.morphogenesis) return this.morphogenesis.activeReasoningSteps;
    return this.birds[0]?.brain?.reasoningSteps ?? this.config.reasoningSteps ?? 1;
  }

  getMetabolicStepCost(): number {
    if (!this.morphogenesis) return 0;
    return this.config.architecture === 'PONDER_ACT'
      ? this.morphogenesis.config.metabolicStepCost
      : 0;
  }

  getFlopsPenaltyWeight(): number {
    if (this.morphogenesis) {
      return Math.max(0, this.morphogenesis.config.flopsPenaltyWeight ?? 0);
    }
    if (
      this.config.evolutionTopologyMode === 'ISLAND_SPECIATION' ||
      this.config.architecture === 'HYBRID_MOE'
    ) {
      return Math.max(0, this.config.morphogenesisConfig?.flopsPenaltyWeight ?? 0.004);
    }
    return 0;
  }

  setBatchKernelEnabled(enabled: boolean): void {
    if (this.batchKernelEnabled === enabled) return;
    if (!enabled) this.syncBatchToBirds();
    this.batchKernelEnabled = enabled;
    if (!enabled) {
      this.batchKernel = null;
      this.batchDirty = false;
    } else if (this.birds.length >= 16) {
      this.rebuildBatchKernelFromBirds();
    }
  }

  private rebuildBatchKernelFromBirds(): void {
    if (
      !this.batchKernelEnabled ||
      this.birds.length < 16 ||
      this.getFlopsPenaltyWeight() > 0 ||
      this.config.perceptionMode === 'COMPOUND_EYE_PIXELS' ||
      Boolean(this.config.onlinePlasticity)
    ) {
      this.batchKernel = null;
      this.batchDirty = false;
      return;
    }
    const brains: NeuralNetwork[] = new Array(this.birds.length);
    for (let i = 0; i < this.birds.length; i++) {
      const br = this.birds[i].brain;
      if (!br) {
        this.batchKernel = null;
        this.batchDirty = false;
        return;
      }
      brains[i] = br;
    }
    if (!PopulationBatchKernel.canAccelerate(brains)) {
      this.batchKernel = null;
      this.batchDirty = false;
      return;
    }
    const proto = brains[0];
    const k = this.batchKernel;
    if (
      k &&
      k.count === brains.length &&
      k.arch === proto.architecture &&
      k.inCount === proto.inputNodes &&
      k.depth === proto.hiddenLayers.length &&
      k.h1 === (proto.hiddenLayers[0] ?? 0) &&
      k.h2 === (proto.hiddenLayers[1] ?? 0) &&
      k.reasoningSteps === proto.reasoningSteps
    ) {
      k.packPopulation(brains);
    } else {
      this.batchKernel = new PopulationBatchKernel(brains);
    }
    this.batchDirty = false;
  }

  private syncBatchToBirds(): void {
    const k = this.batchKernel;
    if (!k || !this.batchDirty) return;
    const birds = this.birds;
    const n = Math.min(birds.length, k.count);
    for (let i = 0; i < n; i++) {
      const b = birds[i];
      b.y = k.y[i];
      b.vy = k.vy[i];
      b.fitness = k.fitness[i];
      b.score = k.score[i];
      b.lastPassedPipeId = k.lastPassedPipeId[i];
      b.alive = k.alive[i] === 1;
      b.hitFloorOrCeiling = k.hitFloorOrCeiling[i] === 1;
      if (!b.alive) b.deathOpacity = 0;
    }
    this.aliveBirdsDirty = true;
    this.batchDirty = false;
  }

  private materializePopulation(specs: Array<SpawnedMemberSpec | IslandMemberSpec>): void {
    const nextBirds: InternalBird[] = new Array(specs.length);
    const morph = this.morphogenesis;
    const penaltyWeight = this.getFlopsPenaltyWeight();
    const baselineFlops =
      penaltyWeight > 0
        ? estimateArchitectureFlops(
            this.config.hiddenLayers,
            normalizeInputFeatures(this.config.inputFeatures).length,
            'MLP',
            1
          )
        : 0;
    let flopsSum = 0;

    for (let i = 0; i < specs.length; i++) {
      const s = specs[i];
      if (morph) {
        morph.enforceOnBrain(s.brain);
      }
      const bird = this.createBird(i + 1, s.brain, false, s.isChampion);
      if (s.esPairIndex !== undefined) bird.esPairIndex = s.esPairIndex;
      if (s.esSign !== undefined) bird.esSign = s.esSign;
      if ('species' in s && s.species !== undefined) bird.species = s.species;
      if ('islandIndex' in s && s.islandIndex !== undefined) bird.islandIndex = s.islandIndex;
      const bFlops = s.brain.estimateFlopsPerFrame();
      flopsSum += bFlops;
      bird.excessFlopsCost =
        penaltyWeight > 0
          ? Math.max(0, (bFlops - baselineFlops) / 100) * penaltyWeight
          : 0;
      nextBirds[i] = bird;
    }
    this.lastMeanFlopsPerFrame =
      specs.length > 0 ? Number((flopsSum / specs.length).toFixed(1)) : 0;
    this.birds = nextBirds;
    this.aliveBirdsDirty = true;
    this.rebuildBatchKernelFromBirds();
  }

  /**
   * Resolves the active physics environment.
   * When `curriculumLearning` is enabled during TRAINING, smoothly anneals physics
   * from a forgiving warm-up to 100% target physics. VS_AI always uses 100% target.
   */
  private getActiveEnv(): EnvironmentConfig {
    const target = resolveEnvironment(
      this.config.difficulty,
      this.config.customEnvironment,
      this.config.overdrivePct
    );
    if (this.mode === 'TRAINING' && this.config.curriculumLearning) {
      return resolveCurriculumEnvironment(
        target,
        this.generation,
        this.config.curriculumGenerations ?? 18
      );
    }
    return target;
  }

  private static layersEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  private static featuresEqual(
    a?: readonly SensorFeatureId[],
    b?: readonly SensorFeatureId[]
  ): boolean {
    const na = normalizeInputFeatures(a);
    const nb = normalizeInputFeatures(b);
    if (na.length !== nb.length) return false;
    for (let i = 0; i < na.length; i++) {
      if (na[i] !== nb[i]) return false;
    }
    return true;
  }

  updateConfig(nextRaw: EvolutionConfig, forceReset = false): void {
    const nextConfig = this.normalizeConfig(nextRaw);
    const topologyChanged = !FlappySimulation.layersEqual(
      nextConfig.hiddenLayers,
      this.config.hiddenLayers
    );
    const inputsChanged = !FlappySimulation.featuresEqual(
      nextConfig.inputFeatures,
      this.config.inputFeatures
    );
    const architectureChanged =
      (nextConfig.architecture ?? 'MLP') !== (this.config.architecture ?? 'MLP');
    const precisionChanged =
      (nextConfig.weightPrecision ?? 'FP32') !==
      (this.config.weightPrecision ?? 'FP32');
    const difficultyChanged = nextConfig.difficulty !== this.config.difficulty;
    const overdriveChanged =
      nextConfig.difficulty === 'EXTRA_INSANE' &&
      (nextConfig.overdrivePct ?? 120) !== (this.config.overdrivePct ?? 120);
    const customEnvChanged =
      nextConfig.difficulty === 'CUSTOM' &&
      JSON.stringify(nextConfig.customEnvironment) !==
        JSON.stringify(this.config.customEnvironment);
    const algorithmChanged = nextConfig.algorithm !== this.config.algorithm;
    const morphChanged =
      Boolean(nextConfig.morphogenesis) !== Boolean(this.config.morphogenesis) ||
      (Boolean(nextConfig.morphogenesis) &&
        JSON.stringify(nextConfig.morphogenesisConfig ?? {}) !==
          JSON.stringify(this.config.morphogenesisConfig ?? {}));
    const islandModeChanged =
      (nextConfig.evolutionTopologyMode ?? 'SINGLE_SPECIES') !==
        (this.config.evolutionTopologyMode ?? 'SINGLE_SPECIES') ||
      ((nextConfig.evolutionTopologyMode ?? 'SINGLE_SPECIES') === 'ISLAND_SPECIATION' &&
        JSON.stringify(nextConfig.islandSpecies ?? []) !==
          JSON.stringify(this.config.islandSpecies ?? []));

    this.config = nextConfig;
    this.syncInputBuffers();

    if (algorithmChanged) {
      this.optimizer = createOptimizer(nextConfig.algorithm);
    }

    if (
      forceReset ||
      topologyChanged ||
      algorithmChanged ||
      inputsChanged ||
      architectureChanged ||
      precisionChanged ||
      morphChanged ||
      islandModeChanged
    ) {
      this.resetEvolution();
    } else if (difficultyChanged || customEnvChanged || overdriveChanged) {
      if (this.mode === 'VS_AI') {
        this.prepareVsAiMatch();
      } else {
        this.resetWorld();
        for (let i = 0; i < this.birds.length; i++) {
          const b = this.birds[i];
          b.y = PLAYABLE_HEIGHT * 0.46;
          b.vy = 0;
          b.alive = true;
          b.deathOpacity = 1;
          b.score = 0;
          b.fitness = 0;
          b.hitFloorOrCeiling = false;
          b.lastPassedPipeId = 0;
          b.brain?.resetState();
        }
        this.rebuildBatchKernelFromBirds();
      }
    }
  }

  getConfig(): EvolutionConfig {
    return {
      ...this.config,
      hiddenLayers: [...this.config.hiddenLayers],
      inputFeatures: [...normalizeInputFeatures(this.config.inputFeatures)],
    };
  }

  getMode(): GameMode {
    return this.mode;
  }

  getVsAiPhase(): VsAiPhase {
    return this.vsAiPhase;
  }

  getTotalTicksEvaluated(): number {
    return this.totalTicksEvaluated;
  }

  getFastStats(): {
    generation: number;
    allTimeBestScore: number;
    currentBestScore: number;
    lastBestScore: number;
    lastBestFitness: number;
    lastAvgScore: number;
  } {
    const last =
      this.history.length > 0 ? this.history[this.history.length - 1] : null;
    return {
      generation: this.generation,
      allTimeBestScore: this.allTimeBestScore,
      currentBestScore: this.currentGenBestScore,
      lastBestScore: last ? last.bestScore : 0,
      lastBestFitness: last ? last.bestFitness : 0,
      lastAvgScore: last ? last.avgScore : 0,
    };
  }

  pauseClock(): void {
    if (this.runClockPaused) return;
    this.runAccumulatedMs += Math.max(0, performance.now() - this.runSegmentStartMs);
    this.runClockPaused = true;
  }

  resumeClock(): void {
    if (!this.runClockPaused) return;
    this.runSegmentStartMs = performance.now();
    this.runClockPaused = false;
  }

  getActiveRunElapsedMs(): number {
    const activeSeg = this.runClockPaused
      ? 0
      : Math.max(0, performance.now() - this.runSegmentStartMs);
    return Math.max(0, Math.round(this.runAccumulatedMs + activeSeg));
  }

  private resetMilestones(): void {
    this.runAccumulatedMs = 0;
    this.runSegmentStartMs = performance.now();
    this.milestones = {
      reached1Gen: null,
      reached1Ms: null,
      reached10Gen: null,
      reached10Ms: null,
      reached50Gen: null,
      reached50Ms: null,
      reached100Gen: null,
      reached100Ms: null,
      elapsedMs: 0,
    };
  }

  private updateMilestonesForScore(score: number): void {
    if (score <= 0) return;
    const elapsed = Math.max(1, this.getActiveRunElapsedMs());
    if (score >= 1 && this.milestones.reached1Gen === null) {
      this.milestones.reached1Gen = this.generation;
      this.milestones.reached1Ms = elapsed;
    }
    if (score >= 10 && this.milestones.reached10Gen === null) {
      this.milestones.reached10Gen = this.generation;
      this.milestones.reached10Ms = elapsed;
    }
    if (score >= 50 && this.milestones.reached50Gen === null) {
      this.milestones.reached50Gen = this.generation;
      this.milestones.reached50Ms = elapsed;
    }
    if (score >= 100 && this.milestones.reached100Gen === null) {
      this.milestones.reached100Gen = this.generation;
      this.milestones.reached100Ms = elapsed;
    }
  }

  resetEvolution(): void {
    this.generation = 1;
    this.totalTicksEvaluated = 0;
    this.currentGenBestScore = 0;
    this.allTimeBestScore = 0;
    this.allTimeBestFitness = 0;
    this.allTimeBestGeneration = 0;
    this.allTimeBestBrain = null;
    this.pendingBestBird = null;
    this.resetMilestones();

    this.optimizer.reset(this.config);
    this.history = [];
    this.mode = 'TRAINING';
    this.initTrainingGeneration(true);
  }

  loadBrainIntoTraining(serialized: SerializedNeuralNetwork): void {
    const imported = NeuralNetwork.deserialize(serialized);
    this.config = this.normalizeConfig({
      ...this.config,
      hiddenLayers: [...imported.hiddenLayers],
      hiddenNodes: imported.hiddenNodes,
      inputFeatures: [...imported.inputFeatures],
      architecture: imported.architecture,
      weightPrecision: imported.weightPrecision,
      reasoningSteps: imported.reasoningSteps,
    });
    this.syncInputBuffers();
    this.allTimeBestBrain = imported.clone();
    this.pendingBestBird = null;
    this.optimizer.reset(this.config);

    this.mode = 'TRAINING';
    this.generation = 1;
    this.totalTicksEvaluated = 0;
    this.allTimeBestScore = 0;
    this.allTimeBestFitness = 0;
    this.allTimeBestGeneration = 1;
    this.history = [];
    this.resetMilestones();

    this.resetWorld();
    this.materializePopulation(
      this.optimizer.initPopulation(
        this.getOptimizerContext(),
        this.config.populationSize,
        imported
      )
    );
  }

  setChampionBrain(serialized: SerializedNeuralNetwork): void {
    const imported = NeuralNetwork.deserialize(serialized);
    this.vsAiOpponentBrain = imported.clone();
    if (this.mode === 'VS_AI') {
      this.prepareVsAiMatch();
    }
  }

  getChampionBrain(): SerializedNeuralNetwork | null {
    if (this.pendingBestBird?.brain) {
      return this.pendingBestBird.brain.serialize();
    }
    if (this.allTimeBestBrain) {
      return this.allTimeBestBrain.serialize();
    }
    const activeLeader = this.getTrainingLeaderBird();
    if (activeLeader?.brain) {
      return activeLeader.brain.serialize();
    }
    return null;
  }

  getChampionNetworkInstance(): NeuralNetwork | null {
    if (this.pendingBestBird?.brain) return this.pendingBestBird.brain;
    if (this.allTimeBestBrain) return this.allTimeBestBrain;
    return this.getTrainingLeaderBird()?.brain ?? null;
  }

  getGenerationLeaderNetworkInstance(): NeuralNetwork | null {
    return this.getTrainingLeaderBird()?.brain ?? this.getChampionNetworkInstance();
  }

  getPopulationSize(): number {
    return this.birds.length;
  }

  getBirdBrain(index: number): NeuralNetwork | null {
    return this.birds[index]?.brain ?? null;
  }

  packPopulationWeights(dest: Float32Array, startOffset: number): number {
    let cursor = startOffset;
    const birds = this.birds;
    for (let i = 0; i < birds.length; i++) {
      const brain = birds[i].brain;
      if (!brain) continue;
      for (let l = 0; l < brain.qLayerWeights.length; l++) {
        const w = brain.qLayerWeights[l];
        for (let k = 0; k < w.length; k++) {
          dest[cursor++] = w[k];
        }
        const b = brain.qLayerBiases[l];
        for (let k = 0; k < b.length; k++) {
          dest[cursor++] = b[k];
        }
      }
      const qbp = brain.qBioParams;
      if (qbp.length > 0) {
        for (let k = 0; k < qbp.length; k++) {
          dest[cursor++] = qbp[k];
        }
      }
    }
    return cursor - startOffset;
  }

  applyExternalGenerationResults(
    scores: ArrayLike<number>,
    fitnesses: ArrayLike<number>,
    ticks: ArrayLike<number>,
    advanceGeneration: boolean
  ): {
    bestScore: number;
    bestFitness: number;
    bestBirdIdx: number;
    totalTicks: number;
  } {
    const birds = this.birds;
    let bestScore = 0;
    let bestFitness = -Infinity;
    let bestBirdIdx = 0;
    let totalTicks = 0;

    for (let i = 0; i < birds.length; i++) {
      const bird = birds[i];
      const sc = scores[i] ?? 0;
      const fit = fitnesses[i] ?? 0;
      const tk = ticks[i] ?? 0;
      bird.score = sc;
      bird.fitness = fit;
      bird.alive = false;
      bird.deathOpacity = 0;
      totalTicks += tk;

      if (sc > bestScore) bestScore = sc;
      if (fit > bestFitness) {
        bestFitness = fit;
        bestBirdIdx = i;
      }
      if (sc > this.currentGenBestScore) {
        this.currentGenBestScore = sc;
      }
      this.updateMilestonesForScore(sc);
      if (sc > this.allTimeBestScore) {
        this.allTimeBestScore = sc;
        this.allTimeBestGeneration = this.generation;
        this.pendingBestBird = bird;
      }
      if (fit > this.allTimeBestFitness) {
        this.allTimeBestFitness = fit;
        if (sc >= this.allTimeBestScore) {
          this.pendingBestBird = bird;
        }
      }
    }

    this.totalTicksEvaluated += totalTicks;
    if (bestFitness === -Infinity) bestFitness = 0;
    this.aliveBirdsDirty = true;

    if (advanceGeneration && this.mode === 'TRAINING') {
      this.evolveNextGeneration();
      this.callbacks.onGenerationAdvance?.();
    }

    return {
      bestScore,
      bestFitness,
      bestBirdIdx,
      totalTicks,
    };
  }

  forceAdvanceGeneration(): void {
    if (this.mode !== 'TRAINING') return;
    this.evolveNextGeneration();
    this.callbacks.onGenerationAdvance?.();
  }

  isSoloPlay(): boolean {
    return this.vsAiSoloMode;
  }

  prepareVsAiMatch(soloMode?: boolean): void {
    this.mode = 'VS_AI';
    this.vsAiPhase = 'READY';
    if (soloMode !== undefined) {
      this.vsAiSoloMode = soloMode;
    }
    this.resetWorld();

    this.playerBird = this.createBird(1, null, true, false);
    this.playerBird.y = PLAYABLE_HEIGHT * 0.48;

    if (this.vsAiSoloMode) {
      this.aiOpponentBird = null;
      return;
    }

    const championSource =
      this.vsAiOpponentBrain?.clone() ??
      this.allTimeBestBrain?.clone() ??
      this.getTrainingLeaderBird()?.brain?.clone() ??
      this.createBrain();

    this.aiOpponentBird = this.createBird(2, championSource, false, true);
    this.aiOpponentBird.y = PLAYABLE_HEIGHT * 0.48;
  }

  finishVsAiMatchEarly(): void {
    if (this.mode === 'VS_AI' && this.vsAiPhase === 'PLAYING') {
      this.vsAiPhase = 'GAME_OVER';
    }
  }

  playerFlap(): boolean {
    if (this.mode !== 'VS_AI') return false;
    if (this.vsAiPhase === 'READY') {
      this.vsAiPhase = 'PLAYING';
    }
    if (this.vsAiPhase !== 'PLAYING') return false;
    if (this.playerBird && this.playerBird.alive) {
      const env = this.getActiveEnv();
      this.playerBird.vy = JUMP_IMPULSE * Math.sqrt(env.gravityScale);
      this.playerBird.wingPhase = 0;
      return true;
    }
    return false;
  }

  step(): void {
    if (this.mode === 'VS_AI') {
      this.stepVsAi();
    } else {
      this.stepTraining();
    }
  }

  private resetWorld(): void {
    const env = this.getActiveEnv();
    this.frameCount = 0;
    this.pipeCounter = 0;
    this.currentGenBestScore = 0;
    this.lastTickSpeed = env.pipeSpeed;
    this.pipes = [];
    this.arcadeOrbs = [];
    this.scorePopups = [];
    if (this.mode === 'VS_AI') {
      this.playerPoints = 0;
      this.playerCurrentCombo = 0;
      this.playerMaxCombo = 0;
      this.playerOrbsCollected = 0;
    }
    this.distUntilNextSpawn = env.pipeSpeed * env.spawnFrames;
    this.speedPhaseA = Math.random() * Math.PI * 2;
    this.speedPhaseB = Math.random() * Math.PI * 2;
    this.aliveBirdsDirty = true;
    this.spawnPipe(CANVAS_WIDTH + 60);
  }

  private createBird(
    id: number,
    brain: NeuralNetwork | null,
    isPlayer: boolean,
    isChampion: boolean
  ): InternalBird {
    brain?.resetState();
    return {
      id,
      y: PLAYABLE_HEIGHT * 0.46,
      vy: 0,
      alive: true,
      deathOpacity: 1,
      score: 0,
      fitness: 0,
      hitFloorOrCeiling: false,
      brain,
      lastPassedPipeId: 0,
      isPlayer,
      isChampion,
      wingPhase: Math.random() * Math.PI * 2,
    };
  }

  private initTrainingGeneration(freshRandom: boolean): void {
    this.resetWorld();
    if (this.config.evolutionTopologyMode === 'ISLAND_SPECIATION') {
      if (freshRandom || !this.islandCoordinator) {
        this.islandCoordinator = new IslandSpeciationCoordinator(this.config);
      }
      this.morphogenesis = null;
      const seedBrain =
        freshRandom || this.birds.length === 0
          ? undefined
          : this.allTimeBestBrain?.clone();
      this.materializePopulation(this.islandCoordinator.initPopulation(seedBrain));
      return;
    }

    this.islandCoordinator = null;
    if (freshRandom || (this.config.morphogenesis && !this.morphogenesis)) {
      this.initMorphogenesisController();
    }
    const popSize = this.config.populationSize;
    const seedBrain =
      freshRandom || this.birds.length === 0
        ? undefined
        : this.allTimeBestBrain?.clone() ?? this.createBrain();
    this.materializePopulation(
      this.optimizer.initPopulation(this.getOptimizerContext(), popSize, seedBrain)
    );
  }

  private spawnPipe(xPos = CANVAS_WIDTH + 20): void {
    const env = this.getActiveEnv();
    const gapSize = Math.max(
      76,
      Math.min(
        204,
        env.gap +
          (env.gapVariance > 0 ? (Math.random() * 2 - 1) * env.gapVariance : 0)
      )
    );
    const margin = env.movingPipes ? 72 : 52;
    const minTop = margin;
    const maxTop = PLAYABLE_HEIGHT - gapSize - margin;
    const baseGapTop = minTop + Math.random() * Math.max(20, maxTop - minTop);
    this.pipeCounter += 1;

    this.pipes.push({
      id: this.pipeCounter,
      x: xPos,
      baseGapTop,
      gapSize,
      gapTop: baseGapTop,
      gapBottom: baseGapTop + gapSize,
      gapCenter: baseGapTop + gapSize * 0.5,
      phase: Math.random() * Math.PI * 2,
      gapVy: 0,
      passedByPlayer: false,
      passedByChampion: false,
    });

    // Spawn collectible arcade orbs exclusively during interactive Play mode
    if (this.mode === 'VS_AI') {
      this.orbCounter += 1;
      const isPrism = this.orbCounter % 4 === 0;
      const midOffset = isPrism ? -env.pipeSpeed * env.spawnFrames * 0.42 : PIPE_WIDTH * 0.5;
      const orbX = Math.max(xPos - 90, xPos + midOffset);
      const yOffset = isPrism
        ? (Math.random() > 0.5 ? -1 : 1) * Math.min(48, gapSize * 0.28)
        : (Math.random() * 2 - 1) * Math.min(28, gapSize * 0.22);
      const baseY = Math.max(
        48,
        Math.min(PLAYABLE_HEIGHT - 48, baseGapTop + gapSize * 0.5 + yOffset)
      );
      this.arcadeOrbs.push({
        id: this.orbCounter,
        x: orbX,
        y: baseY,
        baseY,
        radius: isPrism ? 10 : 9,
        points: isPrism ? 150 : 75,
        kind: isPrism ? 'PRISM' : 'STAR',
        phase: Math.random() * Math.PI * 2,
        collected: false,
      });
    }
  }

  private getNextTwoPipes(): [Pipe | null, Pipe | null] {
    const minPipeX = BIRD_X - BIRD_RADIUS;
    const pipes = this.pipes;
    const len = pipes.length;
    for (let i = 0; i < len; i++) {
      if (pipes[i].x + PIPE_WIDTH >= minPipeX) {
        return [pipes[i], i + 1 < len ? pipes[i + 1] : null];
      }
    }
    return [len > 0 ? pipes[0] : null, len > 1 ? pipes[1] : null];
  }

  private fillInputs(
    bird: InternalBird,
    pipeX: number,
    gapTop: number,
    gapBottom: number,
    gapVy = 0,
    targetFeatures?: readonly SensorFeatureId[],
    nextPipeDy = 0,
    extra?: {
      hasNextPipe: boolean;
      hasNext2: boolean;
      next2GapTop: number;
      next2GapBot: number;
      next2EdgeX: number;
      next2GapVy: number;
      movingPipes: boolean;
      tickSpeed: number;
    }
  ): Float64Array {
    const raw = this.rawInputBuffer;
    if (this.config.perceptionMode === 'COMPOUND_EYE_PIXELS') {
      buildCompoundEyePixelInputs(
        bird.y,
        bird.vy,
        extra?.tickSpeed ?? this.lastTickSpeed,
        this.pipes,
        raw,
        bird.prevOmmatidiaLum,
        this.config.opticalNoiseLevel ?? 0,
        this.frameCount * 131 + bird.id * 97
      );
      if (targetFeatures) {
        if (isFullSensorSet(targetFeatures)) return raw;
        const indices = getInputFeatureIndices(targetFeatures);
        const out = new Float64Array(indices.length);
        for (let k = 0; k < indices.length; k++) {
          out[k] = raw[indices[k]];
        }
        return out;
      }
      if (this.useFullInputs) return raw;
      const indices = this.inputIndices;
      const sub = this.inputBuffer;
      for (let k = 0; k < indices.length; k++) {
        sub[k] = raw[indices[k]];
      }
      return sub;
    }
    const invPlayable = 1 / PLAYABLE_HEIGHT;
    const invHalfPlayable = 2 * invPlayable;

    raw[0] = bird.y * invHalfPlayable - 1;
    const vyNorm = bird.vy / MAX_VY;
    raw[1] = vyNorm < -1 ? -1 : vyNorm > 1 ? 1 : vyNorm;

    const distNorm = (pipeX - BIRD_X) / CANVAS_WIDTH;
    raw[2] = distNorm < -0.2 ? -0.2 : distNorm > 1 ? 1 : distNorm;
    raw[3] = (bird.y - gapTop) * invHalfPlayable;
    raw[4] = (gapBottom - bird.y) * invHalfPlayable;
    const pVyNorm = gapVy / MAX_PIPE_VY_NORM;
    raw[5] = pVyNorm < -1 ? -1 : pVyNorm > 1 ? 1 : pVyNorm;
    raw[6] = nextPipeDy < -1 ? -1 : nextPipeDy > 1 ? 1 : nextPipeDy;
    if (extra && extra.hasNextPipe && extra.hasNext2) {
      raw[7] = (bird.y - extra.next2GapTop) * invHalfPlayable;
      raw[8] = (extra.next2GapBot - bird.y) * invHalfPlayable;
      const n2d = (extra.next2EdgeX - BIRD_X) / CANVAS_WIDTH;
      raw[9] = n2d < -0.2 ? -0.2 : n2d > 1 ? 1 : n2d;
      const n2v = extra.movingPipes ? extra.next2GapVy / MAX_PIPE_VY_NORM : 0;
      raw[10] = n2v < -1 ? -1 : n2v > 1 ? 1 : n2v;
    } else {
      raw[7] = 0;
      raw[8] = 0;
      raw[9] = 1.0;
      raw[10] = 0;
    }
    if (extra && extra.hasNextPipe) {
      const ttf = (pipeX - BIRD_X) / (Math.max(1.2, extra.tickSpeed) * 120);
      raw[11] = ttf < 0 ? 0 : ttf > 1 ? 1 : ttf;
    } else {
      raw[11] = 1.0;
    }

    if (targetFeatures) {
      if (isFullSensorSet(targetFeatures)) return raw;
      const indices = getInputFeatureIndices(targetFeatures);
      const out = new Float64Array(indices.length);
      for (let k = 0; k < indices.length; k++) {
        out[k] = raw[indices[k]];
      }
      return out;
    }

    if (this.useFullInputs) return raw;
    const indices = this.inputIndices;
    const sub = this.inputBuffer;
    for (let k = 0; k < indices.length; k++) {
      sub[k] = raw[indices[k]];
    }
    return sub;
  }

  private updatePipeWorld(envOverride?: EnvironmentConfig): void {
    const env = envOverride ?? this.getActiveEnv();
    this.frameCount += 1;

    const speedMult =
      env.speedVariability > 0
        ? 1 +
          env.speedVariability *
            (0.55 * Math.sin(this.frameCount * 0.031 + this.speedPhaseA) +
              0.45 * Math.cos(this.frameCount * 0.079 + this.speedPhaseB))
        : 1;
    const tickSpeed = Math.max(1.2, env.pipeSpeed * speedMult);
    this.lastTickSpeed = tickSpeed;
    this.groundOffset = (this.groundOffset + tickSpeed) % 32;

    const baseSpacing = env.pipeSpeed * env.spawnFrames;
    this.distUntilNextSpawn -= tickSpeed;
    if (this.distUntilNextSpawn <= 0) {
      this.spawnPipe();
      this.distUntilNextSpawn =
        env.speedVariability > 0 || env.gapVariance > 0
          ? baseSpacing * (0.88 + Math.random() * 0.24)
          : baseSpacing;
    }

    const pipes = this.pipes;
    for (let i = 0; i < pipes.length; i++) {
      const pipe = pipes[i];
      pipe.x -= tickSpeed;

      if (env.movingPipes) {
        const prevTop = pipe.gapTop;
        const offset =
          Math.sin(this.frameCount * 0.045 + pipe.phase) * env.moveAmplitude;
        const minTop = 42;
        const maxTop = PLAYABLE_HEIGHT - pipe.gapSize - 42;
        const nextTop = Math.max(minTop, Math.min(maxTop, pipe.baseGapTop + offset));
        pipe.gapTop = nextTop;
        pipe.gapBottom = nextTop + pipe.gapSize;
        pipe.gapCenter = nextTop + pipe.gapSize * 0.5;
        pipe.gapVy = nextTop - prevTop;
      } else {
        pipe.gapVy = 0;
      }
    }

    if (pipes.length > 0 && pipes[0].x + PIPE_WIDTH < -24) {
      pipes.shift();
    }

    if (this.mode === 'VS_AI' && this.arcadeOrbs.length > 0) {
      for (let i = this.arcadeOrbs.length - 1; i >= 0; i--) {
        const orb = this.arcadeOrbs[i];
        orb.x -= tickSpeed;
        orb.y = orb.baseY + Math.sin(this.frameCount * 0.08 + orb.phase) * 7;
        if (orb.collected || orb.x + orb.radius < -24) {
          this.arcadeOrbs.splice(i, 1);
        }
      }
    }
  }

  private checkCollision(bird: InternalBird, nextPipe: Pipe | null): boolean {
    if (bird.y - FLOOR_HIT_R <= 0 || bird.y + FLOOR_HIT_R >= PLAYABLE_HEIGHT) {
      bird.hitFloorOrCeiling = true;
      return true;
    }

    if (!nextPipe) return false;
    const pipeLeft = nextPipe.x;
    const pipeRight = pipeLeft + PIPE_WIDTH;
    let dx = 0;
    if (BIRD_X < pipeLeft) dx = pipeLeft - BIRD_X;
    else if (BIRD_X > pipeRight) dx = BIRD_X - pipeRight;

    if (dx < PIPE_HIT_R) {
      const effY = dx === 0 ? PIPE_HIT_R : Math.sqrt(PIPE_HIT_R2 - dx * dx);
      if (bird.y - effY < nextPipe.gapTop || bird.y + effY > nextPipe.gapBottom) {
        return true;
      }
    }
    return false;
  }

  private stepTraining(): void {
    const env = this.getActiveEnv();
    this.updatePipeWorld(env);
    const hasAnomalies = Boolean(this.config.nonStationaryAnomalies);
    const anomalyMult =
      hasAnomalies && this.pipeCounter >= 4
        ? 1 + 0.22 * Math.sin(this.pipeCounter * 0.52 + this.frameCount * 0.004)
        : 1;
    const effGravityScale = env.gravityScale * anomalyMult;
    const gravity = GRAVITY * effGravityScale;
    const jumpImpulse = JUMP_IMPULSE * Math.sqrt(effGravityScale);
    const useShaped = Boolean(this.config.shapedFitness);
    const isCompoundEye = this.config.perceptionMode === 'COMPOUND_EYE_PIXELS';
    const useOnlinePlasticity = Boolean(this.config.onlinePlasticity);

    if (this.aliveBirdsDirty) {
      this.syncAliveBirds();
    }
    const aliveBirds = this.aliveBirds;
    let aliveLen = aliveBirds.length;
    if (aliveLen === 0) {
      this.evolveNextGeneration();
      this.callbacks.onGenerationAdvance?.();
      return;
    }

    const [nextPipe, nextPipe2] = this.getNextTwoPipes();
    const gapTop = nextPipe ? nextPipe.gapTop : PLAYABLE_HEIGHT * 0.35;
    const gapBottom = nextPipe ? nextPipe.gapBottom : PLAYABLE_HEIGHT * 0.65;
    const gapCenter = nextPipe ? nextPipe.gapCenter : PLAYABLE_HEIGHT * 0.5;
    const gapHalf = Math.max(24, (gapBottom - gapTop) * 0.5);
    const invShapedScale = 1 / (gapHalf * 0.9);
    const invAlignWindow = 1 / (PLAYABLE_HEIGHT * 0.6);
    const invHalfPlayable = 2 / PLAYABLE_HEIGHT;
    const invMaxVy = 1 / MAX_VY;

    const rawBuf = this.rawInputBuffer;
    const subBuf = this.inputBuffer;
    const useFull = this.useFullInputs;
    const evalBuf = useFull ? rawBuf : subBuf;
    const indices = this.inputIndices;
    const subLen = indices.length;
    const sensorMask = this.inputSensorMask;
    const onlyBotClear = this.isOnlyBotClear;

    const hasNext2 = nextPipe !== null && nextPipe2 !== null;
    const next2GapTop = hasNext2 ? nextPipe2.gapTop : PLAYABLE_HEIGHT * 0.35;
    const next2GapBot = hasNext2 ? nextPipe2.gapBottom : PLAYABLE_HEIGHT * 0.65;
    const pipeEdgeXVal = nextPipe ? nextPipe.x + PIPE_WIDTH : CANVAS_WIDTH;

    if (useFull || (sensorMask & 4)) {
      const rawDistNorm = (pipeEdgeXVal - BIRD_X) / CANVAS_WIDTH;
      rawBuf[2] =
        rawDistNorm < -0.2 ? -0.2 : rawDistNorm > 1 ? 1 : rawDistNorm;
    }
    if (useFull || (sensorMask & 32)) {
      const rawGapVy = nextPipe?.gapVy ?? 0;
      const gapVyNormRaw = rawGapVy / MAX_PIPE_VY_NORM;
      rawBuf[5] =
        gapVyNormRaw < -1 ? -1 : gapVyNormRaw > 1 ? 1 : gapVyNormRaw;
    }
    if (useFull || (sensorMask & 64)) {
      if (hasNext2) {
        const n2Dy = (nextPipe2.gapCenter - nextPipe.gapCenter) * invHalfPlayable;
        rawBuf[6] = n2Dy < -1 ? -1 : n2Dy > 1 ? 1 : n2Dy;
      } else {
        rawBuf[6] = 0;
      }
    }
    if (useFull || (sensorMask & 512)) {
      if (hasNext2) {
        const n2Dx = (nextPipe2.x + PIPE_WIDTH - BIRD_X) / CANVAS_WIDTH;
        rawBuf[9] = n2Dx < -0.2 ? -0.2 : n2Dx > 1 ? 1 : n2Dx;
      } else {
        rawBuf[9] = 1.0;
      }
    }
    if (useFull || (sensorMask & 1024)) {
      if (hasNext2 && env.movingPipes) {
        const n2Vy = (nextPipe2.gapVy ?? 0) / MAX_PIPE_VY_NORM;
        rawBuf[10] = n2Vy < -1 ? -1 : n2Vy > 1 ? 1 : n2Vy;
      } else {
        rawBuf[10] = 0;
      }
    }
    if (useFull || (sensorMask & 2048)) {
      if (nextPipe) {
        const ttf = (pipeEdgeXVal - BIRD_X) / (Math.max(1.2, this.lastTickSpeed) * 120);
        rawBuf[11] = ttf < 0 ? 0 : ttf > 1 ? 1 : ttf;
      } else {
        rawBuf[11] = 1.0;
      }
    }

    let pipeHorizHit = false;
    let pipeEffY = 0;
    if (nextPipe !== null) {
      const pipeLeft = nextPipe.x;
      const pipeRight = pipeLeft + PIPE_WIDTH;
      let dx = 0;
      if (BIRD_X < pipeLeft) dx = pipeLeft - BIRD_X;
      else if (BIRD_X > pipeRight) dx = BIRD_X - pipeRight;
      if (dx < PIPE_HIT_R) {
        pipeHorizHit = true;
        pipeEffY = dx === 0 ? PIPE_HIT_R : Math.sqrt(PIPE_HIT_R2 - dx * dx);
      }
    }

    const pipes = this.pipes;
    const firstPipe = pipes.length > 0 ? pipes[0] : null;
    const passedFirstPipe =
      firstPipe !== null && firstPipe.x + PIPE_WIDTH < BIRD_X;
    const firstPipeId = firstPipe ? firstPipe.id : 0;

    // Fast path: Vectorized Float32 SoA Population Batch Kernel (zero JS dispatch & L1-friendly)
    if (this.batchKernel) {
      const k = this.batchKernel;
      if (k.aliveCount === 0) {
        this.syncBatchToBirds();
        this.evolveNextGeneration();
        this.callbacks.onGenerationAdvance?.();
        return;
      }
      const fp = this.batchFrameParams;
      fp.hasNextPipe = nextPipe !== null;
      fp.gapTop = gapTop;
      fp.gapBottom = gapBottom;
      fp.gapCenter = gapCenter;
      fp.pipeEdgeX = pipeEdgeXVal;
      fp.gapVy = nextPipe?.gapVy ?? 0;
      fp.next2GapCenter = hasNext2 ? nextPipe2.gapCenter : null;
      fp.next2GapTop = next2GapTop;
      fp.next2GapBot = next2GapBot;
      fp.next2PipeEdgeX = hasNext2 ? nextPipe2.x + PIPE_WIDTH : null;
      fp.next2GapVy = hasNext2 ? (nextPipe2.gapVy ?? 0) : 0;
      fp.tickSpeed = this.lastTickSpeed;
      fp.movingPipes = env.movingPipes;
      fp.pipeHorizHit = pipeHorizHit;
      fp.pipeEffY = pipeEffY;
      fp.passedFirstPipe = passedFirstPipe;
      fp.firstPipeId = firstPipeId;
      fp.gravity = gravity;
      fp.jumpImpulse = jumpImpulse;
      fp.useShaped = useShaped;
      fp.metabolicStepCost = this.getMetabolicStepCost();
      const stepRes = k.stepSharedFrame(fp);
      this.totalTicksEvaluated += stepRes.evaluatedTicks;
      this.batchDirty = true;
      if (stepRes.maxScore > this.currentGenBestScore) {
        this.currentGenBestScore = stepRes.maxScore;
      }
      if (stepRes.maxScore > 0) {
        this.updateMilestonesForScore(stepRes.maxScore);
      }
      if (stepRes.maxScore > this.allTimeBestScore && stepRes.maxScoreBirdIdx >= 0) {
        this.allTimeBestScore = stepRes.maxScore;
        this.allTimeBestGeneration = this.generation;
        this.pendingBestBird = this.birds[stepRes.maxScoreBirdIdx];
        this.callbacks.onScore?.();
      }
      if (k.aliveCount === 0) {
        this.syncBatchToBirds();
        this.evolveNextGeneration();
        this.callbacks.onGenerationAdvance?.();
      }
      return;
    }

    this.totalTicksEvaluated += aliveLen;

    let i = 0;
    while (i < aliveLen) {
      const bird = aliveBirds[i];
      const brain = bird.brain;

      if (brain) {
        if (isCompoundEye) {
          if (!bird.prevOmmatidiaLum) {
            bird.prevOmmatidiaLum = new Float64Array(16);
          }
          buildCompoundEyePixelInputs(
            bird.y,
            bird.vy,
            this.lastTickSpeed,
            this.pipes,
            rawBuf,
            bird.prevOmmatidiaLum,
            this.config.opticalNoiseLevel ?? 0,
            this.frameCount * 131 + bird.id * 97
          );
          if (!useFull) {
            for (let k = 0; k < subLen; k++) {
              subBuf[k] = rawBuf[indices[k]];
            }
          }
          if (brain.shouldFlapFast(evalBuf)) {
            bird.vy = jumpImpulse;
            bird.wingPhase = 0;
          }
        } else if (onlyBotClear) {
          subBuf[0] = (gapBottom - bird.y) * invHalfPlayable;
          if (brain.shouldFlapFast(evalBuf)) {
            bird.vy = jumpImpulse;
            bird.wingPhase = 0;
          }
        } else if (useFull) {
          rawBuf[0] = bird.y * invHalfPlayable - 1;
          const vyNorm = bird.vy * invMaxVy;
          rawBuf[1] = vyNorm < -1 ? -1 : vyNorm > 1 ? 1 : vyNorm;
          rawBuf[3] = (bird.y - gapTop) * invHalfPlayable;
          rawBuf[4] = (gapBottom - bird.y) * invHalfPlayable;
          rawBuf[7] = hasNext2 ? (bird.y - next2GapTop) * invHalfPlayable : 0;
          rawBuf[8] = hasNext2 ? (next2GapBot - bird.y) * invHalfPlayable : 0;
          if (brain.shouldFlapFast(evalBuf)) {
            bird.vy = jumpImpulse;
            bird.wingPhase = 0;
          }
        } else {
          if (sensorMask & 1) rawBuf[0] = bird.y * invHalfPlayable - 1;
          if (sensorMask & 2) {
            const vyNorm = bird.vy * invMaxVy;
            rawBuf[1] = vyNorm < -1 ? -1 : vyNorm > 1 ? 1 : vyNorm;
          }
          if (sensorMask & 8) rawBuf[3] = (bird.y - gapTop) * invHalfPlayable;
          if (sensorMask & 16) rawBuf[4] = (gapBottom - bird.y) * invHalfPlayable;
          if (sensorMask & 128) {
            rawBuf[7] = hasNext2 ? (bird.y - next2GapTop) * invHalfPlayable : 0;
          }
          if (sensorMask & 256) {
            rawBuf[8] = hasNext2 ? (next2GapBot - bird.y) * invHalfPlayable : 0;
          }
          for (let k = 0; k < subLen; k++) {
            subBuf[k] = rawBuf[indices[k]];
          }
          if (brain.shouldFlapFast(evalBuf)) {
            bird.vy = jumpImpulse;
            bird.wingPhase = 0;
          }
        }
      }

      const nextVy = bird.vy + gravity;
      bird.vy = nextVy > MAX_VY ? MAX_VY : nextVy;
      bird.y += bird.vy;
      bird.wingPhase += 0.28;

      let crashed = false;
      if (bird.y - FLOOR_HIT_R <= 0 || bird.y + FLOOR_HIT_R >= PLAYABLE_HEIGHT) {
        bird.hitFloorOrCeiling = true;
        crashed = true;
      } else if (
        pipeHorizHit &&
        (bird.y - pipeEffY < gapTop || bird.y + pipeEffY > gapBottom)
      ) {
        crashed = true;
      }

      if (crashed) {
        bird.alive = false;
        bird.deathOpacity = 0;
        if (bird.hitFloorOrCeiling && bird.score === 0) {
          bird.fitness *= 0.85;
        }
        aliveLen -= 1;
        aliveBirds[i] = aliveBirds[aliveLen];
        continue;
      }

      bird.fitness += 0.1;

      if (nextPipe) {
        const dy = bird.y - gapCenter;
        const absDy = dy < 0 ? -dy : dy;
        if (useShaped) {
          const normErr = absDy * invShapedScale;
          const centerReward = 0.42 / (1 + normErr * normErr);
          const insideCorridor =
            bird.y > gapTop + 14 && bird.y < gapBottom - 14 ? 0.12 : 0;
          const absVy = bird.vy < 0 ? -bird.vy : bird.vy;
          const jerkPenalty = 0.035 * absVy * invMaxVy;
          const bonus = centerReward + insideCorridor - jerkPenalty;
          if (bonus > 0) bird.fitness += bonus;
        } else {
          const normDist = absDy * invAlignWindow;
          const alignment = normDist < 1 ? 1 - normDist : 0;
          bird.fitness += 0.15 * alignment;
        }

        if (
          useOnlinePlasticity &&
          brain &&
          brain.architecture === 'DECOUPLED_FLY_CORTEX'
        ) {
          const prevErr = bird.prevAbsDy ?? absDy;
          const errDelta = (prevErr - absDy) / Math.max(20, gapHalf);
          const corridorBonus =
            bird.y > gapTop + 10 && bird.y < gapBottom - 10 ? 0.15 : -0.25;
          const daSignal = Math.max(-1, Math.min(1, errDelta * 3.5 + corridorBonus));
          brain.applyOnlineDopaminePlasticity(daSignal, true);
          bird.prevAbsDy = absDy;
        }
      }

      if (
        brain &&
        brain.architecture === 'PONDER_ACT' &&
        brain.lastPonderSteps > 1
      ) {
        const metaCost = this.getMetabolicStepCost();
        if (metaCost > 0) {
          bird.fitness = Math.max(
            0,
            bird.fitness - metaCost * (brain.lastPonderSteps - 1)
          );
        }
      }
      if (bird.excessFlopsCost && bird.excessFlopsCost > 0) {
        bird.fitness = Math.max(0, bird.fitness - bird.excessFlopsCost);
      }

      if (passedFirstPipe && firstPipeId > bird.lastPassedPipeId) {
        bird.lastPassedPipeId = firstPipeId;
        bird.score += 1;
        bird.fitness += 40;
        if (bird.score > this.currentGenBestScore) {
          this.currentGenBestScore = bird.score;
        }
        this.updateMilestonesForScore(bird.score);
        if (bird.score > this.allTimeBestScore) {
          this.allTimeBestScore = bird.score;
          this.allTimeBestGeneration = this.generation;
          this.pendingBestBird = bird;
          this.callbacks.onScore?.();
        }
      }

      if (bird.fitness > this.allTimeBestFitness) {
        this.allTimeBestFitness = bird.fitness;
        if (bird.score >= this.allTimeBestScore) {
          this.pendingBestBird = bird;
        }
      }
      i += 1;
    }

    aliveBirds.length = aliveLen;

    if (aliveLen === 0) {
      this.evolveNextGeneration();
      this.callbacks.onGenerationAdvance?.();
    }
  }

  /**
   * Returns true when this simulation is running on the vectorized Float32 SoA Lockstep batch kernel.
   */
  isUsingBatchKernel(): boolean {
    return this.batchKernel !== null;
  }

  /**
   * High-throughput headless Lockstep batch stepping for Research Workers.
   * Executes up to `maxSteps` training frames in a tight zero-allocation loop,
   * exiting immediately on generation advance, audit trigger hit, or gen timeout.
   */
  stepHeadlessBatch(
    maxSteps: number,
    maxFramesInGen: number,
    currentFramesInGen: number,
    nextAuditTrigger: number
  ): {
    framesStepped: number;
    genAdvanced: boolean;
    auditTriggered: boolean;
    genTimedOut: boolean;
  } {
    const startGen = this.generation;
    let stepped = 0;
    let genFrames = currentFramesInGen;
    const out = this.headlessBatchOut;
    out.genAdvanced = false;
    out.auditTriggered = false;
    out.genTimedOut = false;

    while (stepped < maxSteps) {
      this.stepTraining();
      stepped += 1;
      genFrames += 1;

      if (this.generation > startGen) {
        out.genAdvanced = true;
        break;
      }
      const currBest =
        this.allTimeBestScore > this.currentGenBestScore
          ? this.allTimeBestScore
          : this.currentGenBestScore;
      if (currBest >= nextAuditTrigger) {
        out.auditTriggered = true;
        break;
      }
      if (genFrames >= maxFramesInGen) {
        out.genTimedOut = true;
        break;
      }
    }

    out.framesStepped = stepped;
    return out;
  }

  private evolveNextGeneration(): void {
    this.syncBatchToBirds();
    const sorted = [...this.birds].sort((a, b) => b.fitness - a.fitness);
    const best = sorted[0];

    let totalFitness = 0;
    let totalScore = 0;
    for (let i = 0; i < sorted.length; i++) {
      totalFitness += sorted[i].fitness;
      totalScore += sorted[i].score;
    }
    const avgFitness = sorted.length > 0 ? totalFitness / sorted.length : 0;
    const avgScore = sorted.length > 0 ? totalScore / sorted.length : 0;

    if (best) {
      this.updateMilestonesForScore(best.score);
      if (best.fitness > this.allTimeBestFitness) {
        this.allTimeBestFitness = best.fitness;
      }
    }
    if (best && best.score >= this.allTimeBestScore && best.brain) {
      if (best.score > this.allTimeBestScore) {
        this.allTimeBestScore = best.score;
        this.allTimeBestGeneration = this.generation;
      }
      this.allTimeBestBrain = best.brain.clone();
      this.pendingBestBird = null;
    } else if (this.pendingBestBird?.brain) {
      this.allTimeBestBrain = this.pendingBestBird.brain.clone();
      this.pendingBestBird = null;
    }

    this.history.push({
      generation: this.generation,
      bestScore: best ? best.score : 0,
      bestFitness: best ? Number(best.fitness.toFixed(1)) : 0,
      avgFitness: Number(avgFitness.toFixed(1)),
      avgScore: Number(avgScore.toFixed(2)),
      allTimeBestScore: this.allTimeBestScore,
    });

    if (this.history.length > 120) {
      this.history = this.history.slice(-120);
    }

    if (this.islandCoordinator) {
      const outcome = this.islandCoordinator.stepAndEvolve(
        this.generation,
        this.birds,
        this.getActiveEnv()
      );
      this.materializePopulation(outcome.nextSpecs);
      this.generation += 1;
      this.resetWorld();
      return;
    }

    if (this.morphogenesis && best?.brain) {
      const popBrains: NeuralNetwork[] = [];
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].brain) popBrains.push(sorted[i].brain!);
      }
      const outcome = this.morphogenesis.stepGeneration(
        this.generation,
        best.fitness,
        best.score,
        best.brain,
        popBrains,
        this.getActiveEnv(),
        1009 + this.generation * 7919
      );
      if (outcome.changed) {
        const eliteVec = best.brain.toFlatVector();
        this.optimizer.onMorphogenesisEvent?.(
          eliteVec,
          this.morphogenesis.activeParamMask,
          this.morphogenesis.plasticityScale
        );
        if (this.allTimeBestBrain) {
          this.morphogenesis.enforceOnBrain(this.allTimeBestBrain);
        }
      }
    }

    const nextSpecs = this.optimizer.evolve(
      this.getOptimizerContext(),
      this.birds,
      sorted,
      this.config.populationSize
    );
    this.materializePopulation(nextSpecs);

    this.generation += 1;
    this.resetWorld();
  }

  private stepDeadBirdFall(bird: InternalBird | null, gravity: number): void {
    if (!bird || bird.alive || bird.deathOpacity <= 0) return;
    bird.vy = Math.min(MAX_VY, bird.vy + gravity);
    bird.y = Math.min(PLAYABLE_HEIGHT - BIRD_RADIUS, bird.y + bird.vy);
    bird.deathOpacity = Math.max(0, bird.deathOpacity - 0.045);
  }

  private stepVsAi(): void {
    const env = this.getActiveEnv();
    const gravity = GRAVITY * env.gravityScale;
    const jumpImpulse = JUMP_IMPULSE * Math.sqrt(env.gravityScale);

    if (this.vsAiPhase === 'READY') {
      this.frameCount += 1;
      this.groundOffset = (this.groundOffset + env.pipeSpeed * 0.45) % 32;
      const hoverY = PLAYABLE_HEIGHT * 0.48 + Math.sin(this.frameCount * 0.08) * 6;
      if (this.playerBird) {
        this.playerBird.y = hoverY;
        this.playerBird.wingPhase += 0.22;
      }
      if (this.aiOpponentBird) {
        this.aiOpponentBird.y = hoverY;
        this.aiOpponentBird.wingPhase += 0.22;
      }
      return;
    }

    if (this.vsAiPhase !== 'PLAYING') {
      this.stepDeadBirdFall(this.playerBird, gravity);
      this.stepDeadBirdFall(this.aiOpponentBird, gravity);
      return;
    }

    this.updatePipeWorld();
    const [nextPipe, nextPipe2] = this.getNextTwoPipes();

    if (this.scorePopups.length > 0) {
      for (let i = this.scorePopups.length - 1; i >= 0; i--) {
        const p = this.scorePopups[i];
        p.y -= 0.75;
        p.ttl -= 0.028;
        if (p.ttl <= 0) {
          this.scorePopups.splice(i, 1);
        }
      }
    }

    if (this.playerBird) {
      if (this.playerBird.alive) {
        this.playerBird.vy = Math.min(MAX_VY, this.playerBird.vy + gravity);
        this.playerBird.y += this.playerBird.vy;
        this.playerBird.wingPhase += 0.3;

        if (this.checkCollision(this.playerBird, nextPipe)) {
          this.playerBird.alive = false;
          this.playerBird.deathOpacity = 0.85;
          this.playerCurrentCombo = 0;
          this.callbacks.onCrash?.();
        } else {
          if (this.frameCount % 12 === 0) {
            this.playerPoints += 2;
          }

          for (const orb of this.arcadeOrbs) {
            if (orb.collected) continue;
            const dx = BIRD_X - orb.x;
            const dy = this.playerBird.y - orb.y;
            const hitR = BIRD_RADIUS + orb.radius + 7;
            if (dx * dx + dy * dy <= hitR * hitR) {
              orb.collected = true;
              this.playerOrbsCollected += 1;
              this.playerPoints += orb.points;
              this.popupCounter += 1;
              this.scorePopups.push({
                id: this.popupCounter,
                x: orb.x,
                y: orb.y - 8,
                label: `+${orb.points} ${orb.kind === 'PRISM' ? '◆' : '★'}`,
                color: orb.kind === 'PRISM' ? '#22D3EE' : '#FBBF24',
                ttl: 1,
              });
              this.callbacks.onOrbCollect?.(orb.kind === 'PRISM');
            }
          }

          for (const pipe of this.pipes) {
            if (!pipe.passedByPlayer && pipe.x + PIPE_WIDTH < BIRD_X) {
              pipe.passedByPlayer = true;
              this.playerBird.score += 1;
              const diffMult = this.getPlayDifficultyMultiplier();
              const centerDist = Math.abs(this.playerBird.y - pipe.gapCenter);
              const isPrecisionCenter = centerDist <= pipe.gapSize * 0.24;
              if (isPrecisionCenter) {
                this.playerCurrentCombo += 1;
              } else {
                this.playerCurrentCombo = 0;
              }
              if (this.playerCurrentCombo > this.playerMaxCombo) {
                this.playerMaxCombo = this.playerCurrentCombo;
              }
              const comboBonus =
                this.playerCurrentCombo > 0
                  ? Math.min(280, this.playerCurrentCombo * 35)
                  : 0;
              const pipePoints = Math.round(100 * diffMult) + comboBonus;
              this.playerPoints += pipePoints;
              this.popupCounter += 1;
              this.scorePopups.push({
                id: this.popupCounter,
                x: BIRD_X + 18,
                y: Math.max(36, this.playerBird.y - 18),
                label:
                  this.playerCurrentCombo > 1
                    ? `+${pipePoints} · ×${this.playerCurrentCombo}`
                    : `+${pipePoints}`,
                color: isPrecisionCenter ? '#FDE047' : '#34D399',
                ttl: 1,
              });
              this.callbacks.onScore?.();
            }
          }
        }
      } else {
        this.stepDeadBirdFall(this.playerBird, gravity);
      }
    }

    if (this.aiOpponentBird) {
      if (this.aiOpponentBird.alive && this.aiOpponentBird.brain) {
        const pipeEdgeX = nextPipe ? nextPipe.x + PIPE_WIDTH : CANVAS_WIDTH;
        const gapTop = nextPipe ? nextPipe.gapTop : PLAYABLE_HEIGHT * 0.35;
        const gapBottom = nextPipe ? nextPipe.gapBottom : PLAYABLE_HEIGHT * 0.65;
        const gapVy = nextPipe?.gapVy ?? 0;
        const nextPipeDy =
          nextPipe && nextPipe2
            ? ((nextPipe2.gapCenter - nextPipe.gapCenter) * 2) / PLAYABLE_HEIGHT
            : 0;
        const inputs = this.fillInputs(
          this.aiOpponentBird,
          pipeEdgeX,
          gapTop,
          gapBottom,
          gapVy,
          this.aiOpponentBird.brain.inputFeatures,
          nextPipeDy,
          {
            hasNextPipe: nextPipe !== null,
            hasNext2: nextPipe !== null && nextPipe2 !== null,
            next2GapTop: nextPipe2 ? nextPipe2.gapTop : PLAYABLE_HEIGHT * 0.35,
            next2GapBot: nextPipe2 ? nextPipe2.gapBottom : PLAYABLE_HEIGHT * 0.65,
            next2EdgeX: nextPipe2 ? nextPipe2.x + PIPE_WIDTH : CANVAS_WIDTH,
            next2GapVy: nextPipe2?.gapVy ?? 0,
            movingPipes: env.movingPipes,
            tickSpeed: this.lastTickSpeed,
          }
        );
        const decision = this.aiOpponentBird.brain.predict(inputs);
        if (decision > 0.5) {
          this.aiOpponentBird.vy = jumpImpulse;
          this.aiOpponentBird.wingPhase = 0;
        }

        this.aiOpponentBird.vy = Math.min(MAX_VY, this.aiOpponentBird.vy + gravity);
        this.aiOpponentBird.y += this.aiOpponentBird.vy;
        this.aiOpponentBird.wingPhase += 0.3;

        if (this.checkCollision(this.aiOpponentBird, nextPipe)) {
          this.aiOpponentBird.alive = false;
          this.aiOpponentBird.deathOpacity = 0.85;
        } else {
          for (const pipe of this.pipes) {
            if (!pipe.passedByChampion && pipe.x + PIPE_WIDTH < BIRD_X) {
              pipe.passedByChampion = true;
              this.aiOpponentBird.score += 1;
            }
          }
        }
      } else {
        this.stepDeadBirdFall(this.aiOpponentBird, gravity);
      }
    }

    const playerAlive = Boolean(this.playerBird?.alive);
    const aiAlive = Boolean(this.aiOpponentBird?.alive);

    if (!playerAlive && !aiAlive) {
      this.vsAiPhase = 'GAME_OVER';
    }
  }

  private getTrainingLeaderBird(targetSpecies?: NetworkArchitecture | null): InternalBird | null {
    this.syncBatchToBirds();
    let leader: InternalBird | null = null;
    const pool =
      !this.aliveBirdsDirty && this.aliveBirds.length > 0
        ? this.aliveBirds
        : this.birds;

    if (targetSpecies) {
      for (let i = 0; i < pool.length; i++) {
        const bird = pool[i];
        if (!bird.alive || bird.species !== targetSpecies) continue;
        if (!leader || bird.fitness > leader.fitness) {
          leader = bird;
        }
      }
      if (!leader) {
        for (let i = 0; i < this.birds.length; i++) {
          const bird = this.birds[i];
          if (bird.species !== targetSpecies) continue;
          if (!leader || bird.fitness > leader.fitness) {
            leader = bird;
          }
        }
      }
      if (leader) return leader;
    }

    for (let i = 0; i < pool.length; i++) {
      const bird = pool[i];
      if (!bird.alive) continue;
      if (!leader || bird.fitness > leader.fitness) {
        leader = bird;
      }
    }
    return leader ?? this.birds[0] ?? null;
  }

  private getLeaderBird(targetSpecies?: NetworkArchitecture | null): InternalBird | null {
    if (this.mode === 'VS_AI') {
      if (this.aiOpponentBird?.alive) return this.aiOpponentBird;
      return this.aiOpponentBird ?? null;
    }
    return this.getTrainingLeaderBird(targetSpecies);
  }

  getRenderSnapshot(): RenderSnapshot {
    this.syncBatchToBirds();
    const leader = this.getLeaderBird(this.config.inspectedSpecies);
    const birds: BirdRenderState[] = [];

    if (this.mode === 'VS_AI') {
      const candidates = [this.aiOpponentBird, this.playerBird];
      for (const b of candidates) {
        if (!b) continue;
        if (!b.alive && b.deathOpacity <= 0) continue;
        birds.push({
          id: b.id,
          x: BIRD_X,
          y: b.y,
          vy: b.vy,
          rotation: Math.max(-0.48, Math.min(1.15, b.vy * 0.085)),
          alive: b.alive,
          opacity: b.alive ? 1 : b.deathOpacity,
          score: b.score,
          fitness: b.fitness,
          isLeader: leader ? b.id === leader.id && !b.isPlayer : false,
          isPlayer: b.isPlayer,
          isChampion: b.isChampion,
          wingPhase: b.wingPhase,
        });
      }
    } else {
      // Determine per-species leader bird ID when running Multi-Architecture Arena
      const speciesLeaderIds = new Set<number>();
      if (this.islandCoordinator) {
        const bestBySpecies = new Map<NetworkArchitecture, InternalBird>();
        for (let i = 0; i < this.birds.length; i++) {
          const b = this.birds[i];
          if (!b.alive || !b.species) continue;
          const prev = bestBySpecies.get(b.species);
          if (!prev || b.fitness > prev.fitness) {
            bestBySpecies.set(b.species, b);
          }
        }
        for (const sb of bestBySpecies.values()) {
          speciesLeaderIds.add(sb.id);
        }
      }

      for (let i = 0; i < this.birds.length; i++) {
        const b = this.birds[i];
        if (!b.alive) continue;
        birds.push({
          id: b.id,
          x: BIRD_X,
          y: b.y,
          vy: b.vy,
          rotation: Math.max(-0.48, Math.min(1.15, b.vy * 0.085)),
          alive: true,
          opacity: 1,
          score: b.score,
          fitness: b.fitness,
          isLeader: leader ? b.id === leader.id : false,
          isPlayer: false,
          isChampion: b.isChampion,
          wingPhase: b.wingPhase,
          species: b.species,
          islandIndex: b.islandIndex,
          isSpeciesLeader: speciesLeaderIds.has(b.id),
        });
      }
    }

    const env = this.getActiveEnv();
    const activeInputFeatures = normalizeInputFeatures(
      leader?.brain?.inputFeatures ?? this.config.inputFeatures
    );

    const [snapNextPipe, snapNextPipe2] = this.getNextTwoPipes();
    const hasAnomalies = Boolean(this.config.nonStationaryAnomalies);
    const anomalyMult =
      hasAnomalies && this.pipeCounter >= 4
        ? 1 + 0.22 * Math.sin(this.pipeCounter * 0.52 + this.frameCount * 0.004)
        : 1;
    const isAnomalyActive = hasAnomalies && Math.abs(anomalyMult - 1) > 0.06;

    let ommatidiaRays: RenderSnapshot['ommatidiaRays'];
    if (this.config.perceptionMode === 'COMPOUND_EYE_PIXELS' && leader) {
      ommatidiaRays = sampleCompoundEyeOmmatidia(
        leader.y,
        this.pipes,
        leader.prevOmmatidiaLum,
        this.config.opticalNoiseLevel ?? 0,
        this.frameCount * 131
      );
    }

    return {
      birds,
      pipes: this.pipes,
      groundOffset: this.groundOffset,
      nextPipe: snapNextPipe,
      nextPipe2: snapNextPipe2,
      mode: this.mode,
      vsAiPhase: this.vsAiPhase,
      difficulty: this.config.difficulty,
      environment: env,
      activeInputFeatures,
      tickSpeed: this.lastTickSpeed,
      perceptionMode: this.config.perceptionMode ?? 'GEOMETRIC_LAB',
      opticalNoiseLevel: this.config.opticalNoiseLevel ?? 0,
      anomalyActive: isAnomalyActive,
      anomalyGravityMult: Number(anomalyMult.toFixed(2)),
      arcadeOrbs: this.mode === 'VS_AI' ? this.arcadeOrbs : undefined,
      scorePopups: this.mode === 'VS_AI' ? this.scorePopups : undefined,
      playerPoints: this.mode === 'VS_AI' ? this.playerPoints : undefined,
      playerCombo: this.mode === 'VS_AI' ? this.playerCurrentCombo : undefined,
      ommatidiaRays,
    };
  }

  private getPlayDifficultyMultiplier(): number {
    switch (this.config.difficulty) {
      case 'EASY':
        return 1.0;
      case 'MEDIUM':
        return 1.3;
      case 'HARD':
        return 1.7;
      case 'INSANE':
        return 2.2;
      case 'EXTRA_INSANE':
        return 2.5 + Math.max(0, ((this.config.overdrivePct ?? 120) - 100) / 100);
      default:
        return 1.4;
    }
  }

  getTelemetry(): SimulationTelemetry {
    this.syncBatchToBirds();
    const leader = this.getLeaderBird(this.config.inspectedSpecies);
    let aliveCount = 0;
    let currentBestScore = 0;

    for (let i = 0; i < this.birds.length; i++) {
      const b = this.birds[i];
      if (b.alive) aliveCount += 1;
      if (b.score > currentBestScore) currentBestScore = b.score;
    }

    let speciesSnapshots: SimulationTelemetry['speciesSnapshots'];
    if (this.islandCoordinator) {
      const baseSnapshots = this.islandCoordinator.getSpeciesSnapshots();
      const liveCounts = new Map<NetworkArchitecture, { alive: number; genBest: number; maxFit: number }>();
      for (let i = 0; i < this.birds.length; i++) {
        const b = this.birds[i];
        if (!b.species) continue;
        const entry = liveCounts.get(b.species) ?? { alive: 0, genBest: 0, maxFit: 0 };
        if (b.alive) entry.alive += 1;
        if (b.score > entry.genBest) entry.genBest = b.score;
        if (b.fitness > entry.maxFit) entry.maxFit = b.fitness;
        liveCounts.set(b.species, entry);
      }
      speciesSnapshots = baseSnapshots.map((sp) => {
        const live = liveCounts.get(sp.species);
        return {
          ...sp,
          aliveCount: live?.alive ?? 0,
          currentGenBestScore: live?.genBest ?? 0,
          bestScore: Math.max(sp.bestScore, live?.genBest ?? 0),
          bestFitness: Math.max(sp.bestFitness, Number((live?.maxFit ?? 0).toFixed(1))),
        };
      });
    }

    let leaderNetwork: NetworkSnapshot | null = null;
    if (leader?.brain) {
      const [nextPipe, nextPipe2] = this.getNextTwoPipes();
      const pipeEdgeX = nextPipe ? nextPipe.x + PIPE_WIDTH : CANVAS_WIDTH;
      const gapTop = nextPipe ? nextPipe.gapTop : PLAYABLE_HEIGHT * 0.35;
      const gapBottom = nextPipe ? nextPipe.gapBottom : PLAYABLE_HEIGHT * 0.65;
      const gapVy = nextPipe?.gapVy ?? 0;
      const nextPipeDy =
        nextPipe && nextPipe2
          ? ((nextPipe2.gapCenter - nextPipe.gapCenter) * 2) / PLAYABLE_HEIGHT
          : 0;
      const snapEnv = this.getActiveEnv();
      const snapInputs = this.fillInputs(
        leader,
        pipeEdgeX,
        gapTop,
        gapBottom,
        gapVy,
        leader.brain.inputFeatures,
        nextPipeDy,
        {
          hasNextPipe: nextPipe !== null,
          hasNext2: nextPipe !== null && nextPipe2 !== null,
          next2GapTop: nextPipe2 ? nextPipe2.gapTop : PLAYABLE_HEIGHT * 0.35,
          next2GapBot: nextPipe2 ? nextPipe2.gapBottom : PLAYABLE_HEIGHT * 0.65,
          next2EdgeX: nextPipe2 ? nextPipe2.x + PIPE_WIDTH : CANVAS_WIDTH,
          next2GapVy: nextPipe2?.gapVy ?? 0,
          movingPipes: snapEnv.movingPipes,
          tickSpeed: this.lastTickSpeed,
        }
      );
      leader.brain.predict(snapInputs);
      leaderNetwork = leader.brain.getSnapshot(
        this.getMorphogenesisSnapshot() ?? undefined
      );
      if (this.islandCoordinator) {
        leaderNetwork.islandTelemetry = speciesSnapshots;
        leaderNetwork.computeProfile = 'CPU_SPECIALIZED';
      }
    }

    const playerScore = this.playerBird?.score ?? 0;
    const aiOpponentScore = this.aiOpponentBird?.score ?? 0;
    let vsAiWinner: 'PLAYER' | 'AI' | 'TIE' | null = null;
    if (this.mode === 'VS_AI' && this.vsAiPhase === 'GAME_OVER') {
      if (playerScore > aiOpponentScore) vsAiWinner = 'PLAYER';
      else if (aiOpponentScore > playerScore) vsAiWinner = 'AI';
      else vsAiWinner = 'TIE';
    }

    return {
      mode: this.mode,
      vsAiPhase: this.vsAiPhase,
      algorithm: this.config.algorithm,
      generation: this.generation,
      aliveCount,
      totalPopulation: this.birds.length,
      currentBestScore,
      allTimeBestScore: this.allTimeBestScore,
      allTimeBestGeneration: this.allTimeBestGeneration,
      playerScore,
      playerPoints: this.mode === 'VS_AI' ? this.playerPoints : 0,
      playerCurrentCombo: this.mode === 'VS_AI' ? this.playerCurrentCombo : 0,
      playerMaxCombo: this.mode === 'VS_AI' ? this.playerMaxCombo : 0,
      playerOrbsCollected: this.mode === 'VS_AI' ? this.playerOrbsCollected : 0,
      aiOpponentScore,
      playerAlive: Boolean(this.playerBird?.alive),
      aiOpponentAlive: Boolean(this.aiOpponentBird?.alive),
      vsAiWinner,
      leaderNetwork,
      history: [...this.history],
      hasChampionBrain: Boolean(this.allTimeBestBrain || leader?.brain),
      milestones: {
        ...this.milestones,
        elapsedMs: this.getActiveRunElapsedMs(),
      },
      speciesSnapshots,
      activeInspectedSpecies: this.config.inspectedSpecies ?? leader?.species ?? null,
    };
  }
}
