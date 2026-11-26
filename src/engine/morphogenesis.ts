import {
  HYBRID_EXPERT_KINDS,
  NeuralNetwork,
  estimateArchitectureFlops,
  isReasoningArchitecture,
  randn,
  type HybridMoeLayout,
} from './neuralNetwork';
import { createInitialPhysicsState, stepPhysics } from './physics';
import { buildSensorInputs } from './sensors';
import type {
  EnvironmentConfig,
  HybridExpertKind,
  MorphogenesisConfig,
  MorphogenesisEvent,
  MorphogenesisSnapshot,
  MorphogenesisSummary,
  NetworkArchitecture,
  SensorFeatureId,
} from './types';

export const DEFAULT_MORPHOGENESIS_CONFIG: MorphogenesisConfig = {
  initialWidthRatio: 0.5,
  growthStagnationTrigger: 10,
  saturationThreshold: 0.62,
  myelinationScale: 0.25,
  pruneThreshold: 0.06,
  pruneSparsityTrigger: 0.28,
  progressiveSensors: true,
  growReasoningSteps: true,
  metabolicStepCost: 0.015,
  flopsPenaltyWeight: 0.004,
  expertTrialWindowGens: 12,
  expertMinRoiGain: 1.2,
  allowExpertSpawning: true,
};

export type MorphogenesisProfileId =
  | 'BALANCED_SEEDLING'
  | 'AGGRESSIVE_EXPLORER'
  | 'EXTREME_PRUNING'
  | 'ADAPTIVE_MOE_ROLLBACK';

export interface MorphogenesisProfile {
  id: MorphogenesisProfileId;
  namePl: string;
  nameEn: string;
  badgePl: string;
  badgeEn: string;
  taglinePl: string;
  taglineEn: string;
  hypothesisPl: string;
  hypothesisEn: string;
  idealForPl: string;
  idealForEn: string;
  config: MorphogenesisConfig;
}

export const MORPHOGENESIS_PROFILES: Record<
  MorphogenesisProfileId,
  MorphogenesisProfile
> = {
  BALANCED_SEEDLING: {
    id: 'BALANCED_SEEDLING',
    namePl: 'Zrównoważona Sadzonka',
    nameEn: 'Balanced Seedling',
    badgePl: 'Standard Badawczy',
    badgeEn: 'Research Baseline',
    taglinePl:
      'Start z 50% szerokości, nieniszcząca inicjalizacja i selektywne przycinanie',
    taglineEn:
      'Starts at 50% width with zero-disruption growth and selective pruning',
    hypothesisPl:
      'Sieć zaczyna jako kompaktowy zawiązek (50% szerokości). Jeśli utknie na 10 pokoleń, dołącza nowe neurony z wagami zerowymi (Zero-Disruption Init), co zapobiega amnezji dotychczas wyuczonych manewrów.',
    hypothesisEn:
      'Starts as a compact seedling (50% width). After 10 stagnant generations it spawns zero-initialized neurons (Zero-Disruption Init) to prevent catastrophic forgetting.',
    idealForPl:
      'Uniwersalna baza porównawcza dla większości scenariuszy (najlepszy balans FLOPs vs sukces).',
    idealForEn:
      'Universal baseline across most scenarios (best balance of FLOPs vs solve rate).',
    config: {
      initialWidthRatio: 0.5,
      growthStagnationTrigger: 10,
      saturationThreshold: 0.62,
      myelinationScale: 0.25,
      pruneThreshold: 0.06,
      pruneSparsityTrigger: 0.28,
      progressiveSensors: true,
      growReasoningSteps: true,
      metabolicStepCost: 0.015,
      flopsPenaltyWeight: 0.004,
      expertTrialWindowGens: 12,
      expertMinRoiGain: 1.2,
      allowExpertSpawning: true,
    },
  },
  AGGRESSIVE_EXPLORER: {
    id: 'AGGRESSIVE_EXPLORER',
    namePl: 'Agresywny Odkrywca',
    nameEn: 'Aggressive Explorer',
    badgePl: 'Neurogenesis Fast-Track',
    badgeEn: 'Neurogenesis Fast-Track',
    taglinePl:
      'Wczesna neurogeneza i niska kara za FLOPs dla pokonywania trudnych barier',
    taglineEn:
      'Early neurogenesis and low FLOPs penalty to break past hard bottlenecks',
    hypothesisPl:
      'Już po 6 pokoleniach bez rekordu następuje ekspansja pojemności neuronowej. Niska kara za złożoność (0.001) pozwala modelowi swobodnie eksplorować wielowymiarowe trajektorie lotu w trudnych warunkach.',
    hypothesisEn:
      'Expands neural capacity after just 6 stagnant generations. Low FLOPs penalty (0.001) lets the network freely explore complex flight trajectories on hard tiers.',
    idealForPl:
      'Scenariusze ekstremalne (Hard, Insane, Extra Insane), gdzie mała sieć grzęźnie w lokalnych minimach.',
    idealForEn:
      'Extreme courses (Hard, Insane, Extra Insane) where compact seeds stall in local optima.',
    config: {
      initialWidthRatio: 0.75,
      growthStagnationTrigger: 6,
      saturationThreshold: 0.45,
      myelinationScale: 0.15,
      pruneThreshold: 0.03,
      pruneSparsityTrigger: 0.18,
      progressiveSensors: true,
      growReasoningSteps: true,
      metabolicStepCost: 0.008,
      flopsPenaltyWeight: 0.001,
      expertTrialWindowGens: 8,
      expertMinRoiGain: 1.1,
      allowExpertSpawning: true,
    },
  },
  EXTREME_PRUNING: {
    id: 'EXTREME_PRUNING',
    namePl: 'Ekstremalna Oszczędność',
    nameEn: 'Extreme Pruning',
    badgePl: 'Micro-Edge / TinyML',
    badgeEn: 'Micro-Edge / TinyML',
    taglinePl:
      'Radykalne przycinanie synaps, silna mielinizacja i rygorystyczna kara FLOPs',
    taglineEn:
      'Aggressive synaptic pruning, strong myelination, and strict FLOPs penalty',
    hypothesisPl:
      'Bezwzględna eliminacja synaps o wadze <0.12 i silna mielinizacja (0.50) utwardzająca kluczowe szlaki. Ewolucja zmusza sieć do kondensacji wiedzy do absolutnego minimum wymaganego do nawigacji.',
    hypothesisEn:
      'Prunes synapses below 0.12 and applies heavy myelination (0.50) to lock core pathways, forcing knowledge into the smallest viable parameter budget.',
    idealForPl:
      'Wdrażanie na mikrokontrolery (Cortex-M0, ESP32) oraz testowanie limitu minimalnej pojemności informacyjnej.',
    idealForEn:
      'Microcontroller targets (Cortex-M0, ESP32) and minimum information-capacity studies.',
    config: {
      initialWidthRatio: 0.35,
      growthStagnationTrigger: 16,
      saturationThreshold: 0.8,
      myelinationScale: 0.5,
      pruneThreshold: 0.12,
      pruneSparsityTrigger: 0.45,
      progressiveSensors: false,
      growReasoningSteps: false,
      metabolicStepCost: 0.03,
      flopsPenaltyWeight: 0.015,
      expertTrialWindowGens: 16,
      expertMinRoiGain: 1.5,
      allowExpertSpawning: false,
    },
  },
  ADAPTIVE_MOE_ROLLBACK: {
    id: 'ADAPTIVE_MOE_ROLLBACK',
    namePl: 'Dynamiczne MoE z Rollbackiem',
    nameEn: 'Adaptive MoE + Rollback',
    badgePl: 'Modularna Plastyczność',
    badgeEn: 'Modular Plasticity',
    taglinePl:
      'Spawnowanie ekspertów warunkowane progiem ROI z automatycznym wycofywaniem',
    taglineEn:
      'ROI-gated expert spawning with automatic rollback on stagnant experts',
    hypothesisPl:
      'Gdy sieć osiąga pułap możliwości, tworzy nowego wyspecjalizowanego eksperta MoE. Jeśli w oknie 8 pokoleń nowy moduł nie podniesie wskaźnika sprawności o min. 35%, następuje natychmiastowe cofnięcie struktury.',
    hypothesisEn:
      'Spawns a specialist MoE expert when fitness plateaus. If the module fails to lift fitness by at least 35% within 8 generations, the expansion rolls back automatically.',
    idealForPl:
      'Architektury mieszaniny ekspertów (Hybrid MoE) i zmienne warunki dynamiczne z wiatrem bocznym.',
    idealForEn:
      'Hybrid MoE architectures and dynamic courses with moving pipes and wind gusts.',
    config: {
      initialWidthRatio: 0.5,
      growthStagnationTrigger: 8,
      saturationThreshold: 0.55,
      myelinationScale: 0.2,
      pruneThreshold: 0.05,
      pruneSparsityTrigger: 0.25,
      progressiveSensors: true,
      growReasoningSteps: true,
      metabolicStepCost: 0.02,
      flopsPenaltyWeight: 0.005,
      expertTrialWindowGens: 8,
      expertMinRoiGain: 1.35,
      allowExpertSpawning: true,
    },
  },
};


export function resolveMorphogenesisConfig(
  partial?: Partial<MorphogenesisConfig>
): MorphogenesisConfig {
  return {
    initialWidthRatio: Math.max(
      0.25,
      Math.min(1, partial?.initialWidthRatio ?? DEFAULT_MORPHOGENESIS_CONFIG.initialWidthRatio)
    ),
    growthStagnationTrigger: Math.max(
      4,
      Math.min(
        40,
        Math.round(
          partial?.growthStagnationTrigger ??
            DEFAULT_MORPHOGENESIS_CONFIG.growthStagnationTrigger
        )
      )
    ),
    saturationThreshold: Math.max(
      0.2,
      Math.min(
        0.95,
        partial?.saturationThreshold ?? DEFAULT_MORPHOGENESIS_CONFIG.saturationThreshold
      )
    ),
    myelinationScale: Math.max(
      0.05,
      Math.min(
        1.0,
        partial?.myelinationScale ?? DEFAULT_MORPHOGENESIS_CONFIG.myelinationScale
      )
    ),
    pruneThreshold: Math.max(
      0.01,
      Math.min(
        0.25,
        partial?.pruneThreshold ?? DEFAULT_MORPHOGENESIS_CONFIG.pruneThreshold
      )
    ),
    pruneSparsityTrigger: Math.max(
      0.1,
      Math.min(
        0.7,
        partial?.pruneSparsityTrigger ??
          DEFAULT_MORPHOGENESIS_CONFIG.pruneSparsityTrigger
      )
    ),
    progressiveSensors:
      partial?.progressiveSensors ?? DEFAULT_MORPHOGENESIS_CONFIG.progressiveSensors,
    growReasoningSteps:
      partial?.growReasoningSteps ?? DEFAULT_MORPHOGENESIS_CONFIG.growReasoningSteps,
    metabolicStepCost: Math.max(
      0,
      Math.min(
        0.075,
        partial?.metabolicStepCost ?? DEFAULT_MORPHOGENESIS_CONFIG.metabolicStepCost
      )
    ),
    flopsPenaltyWeight: Math.max(
      0,
      Math.min(
        0.05,
        partial?.flopsPenaltyWeight ??
          DEFAULT_MORPHOGENESIS_CONFIG.flopsPenaltyWeight ??
          0.004
      )
    ),
    expertTrialWindowGens: Math.max(
      6,
      Math.min(
        24,
        Math.round(
          partial?.expertTrialWindowGens ??
            DEFAULT_MORPHOGENESIS_CONFIG.expertTrialWindowGens ??
            12
        )
      )
    ),
    expertMinRoiGain: Math.max(
      0.1,
      Math.min(
        15,
        partial?.expertMinRoiGain ??
          DEFAULT_MORPHOGENESIS_CONFIG.expertMinRoiGain ??
          1.2
      )
    ),
    allowExpertSpawning:
      partial?.allowExpertSpawning ??
      DEFAULT_MORPHOGENESIS_CONFIG.allowExpertSpawning ??
      true,
  };
}

interface ParamRange {
  wStart: number;
  wLen: number;
  bStart: number;
  bLen: number;
  fanIn: number;
  fanOut: number;
}

export interface MorphogenesisStepOutcome {
  changed: boolean;
  event: MorphogenesisEvent | null;
  activeReasoningSteps: number;
}

/**
 * Masked Super-Network Morphogenesis Controller:
 * Starts lean (seedling hidden width, core sensors, K=1 reasoning step) inside a fixed
 * ceiling parameter layout so CPU Lockstep, WebGPU WGSL, and Colab CUDA execute at 100%
 * full throughput with zero buffer reallocation.
 *
 * When fitness stagnates and biological diagnostics confirm capacity saturation or bloat:
 *  - PRUNE: zeroes weak synapses (|w| < pruneThreshold) to combat OVERFIT_COLLAPSE
 *  - GROW_WIDTH: unlocks dormant hidden neurons with Zero-Init outgoing weights (exact identity)
 *  - GROW_K: increments iterative reasoning steps K (1 -> maxK) for Looped / Ponder / Rollout
 *  - UNLOCK_SENSOR: activates deferred lookahead sensors (PIPE_VY, NEXT_PIPE_DY) with Zero-Init
 *
 * Mature core weights are myelinated (attenuated plasticity) while newborn circuits receive
 * full plasticity across all 8 optimizers.
 */
export class MorphogenesisController {
  readonly config: MorphogenesisConfig;
  readonly layers: number[];
  readonly hiddenCeiling: number[];
  readonly inputFeatures: SensorFeatureId[];
  readonly architecture: NetworkArchitecture;
  readonly maxReasoningSteps: number;
  readonly totalParams: number;

  private readonly transitions: ParamRange[];
  private readonly bioStart: number;
  private readonly bioLen: number;

  activeHiddenCounts: number[];
  activeSensorCount: number;
  activeReasoningSteps: number;

  /** 0 = dormant/pruned, 1 = active */
  readonly activeParamMask: Uint8Array;
  /** 1 = permanently pruned by synaptic pruning */
  readonly prunedMask: Uint8Array;
  /** Per-parameter mutation scale: 0 dormant/pruned, myelinationScale mature, 1.0..1.25 plastic */
  readonly plasticityScale: Float32Array;

  /** Per-layer node states for visualization: 0 dormant, 1 myelinated, 2 plastic */
  private nodeStates: number[][];
  private initialActiveParams = 0;
  private prunedSynapses = 0;
  private growthEventsCount = 0;
  private pruneEventsCount = 0;
  private bestFitnessSeen = -Infinity;
  private bestScoreSeen = -1;
  private stagnationCounter = 0;
  private lastEventGen = -999;
  private lastPruneGen = -999;
  private lastSaturationPct = 0;
  private stage = 0;
  private readonly maxStages: number;
  private readonly events: MorphogenesisEvent[] = [];

  // Hybrid MoE module spawning, compute ROI & trial-window rollback state
  private readonly hybridLayout: HybridMoeLayout | null;
  readonly hybridExpertMask: [number, number, number] = [0, 0, 0];
  private inTrialExpertIdx: number | null = null;
  private trialStartGen = 0;
  private trialPreBestFitness = -Infinity;
  private trialPreBestScore = -1;
  private trialPreFlops = 0;
  private trialPeakFitness = -Infinity;
  private trialPeakScore = -1;
  private trialPreEliteVec: Float64Array | null = null;
  private trialPreActiveMask: Uint8Array | null = null;
  private trialPrePlasticity: Float32Array | null = null;
  private trialPreExpertMask: [number, number, number] = [0, 0, 0];
  private readonly expertCooldownUntilGen: [number, number, number] = [0, 0, 0];
  private rollbackCount = 0;
  private committedExpertsCount = 0;
  private currentGen = 0;
  private lastAvgFlops = 0;
  private lastRouterWeights: [number, number, number, number] = [1, 0, 0, 0];
  private lastAlphaGates: [number, number, number] = [0, 0, 0];

  constructor(
    sampleBrain: NeuralNetwork,
    partialConfig?: Partial<MorphogenesisConfig>
  ) {
    this.config = resolveMorphogenesisConfig(partialConfig);
    this.layers = [...sampleBrain.layers];
    this.hiddenCeiling = [...sampleBrain.hiddenLayers];
    this.inputFeatures = [...sampleBrain.inputFeatures];
    this.architecture = sampleBrain.architecture;
    this.hybridLayout =
      this.architecture === 'HYBRID_MOE' ? sampleBrain.hybridLayout : null;
    this.maxReasoningSteps =
      this.architecture === 'PONDER_ACT'
        ? Math.max(2, sampleBrain.reasoningSteps)
        : this.architecture === 'LOOPED_REASONER' ||
            this.architecture === 'HYBRID_MOE'
          ? Math.max(1, sampleBrain.reasoningSteps)
          : 1;

    this.transitions = [];
    let cursor = 0;
    for (let l = 0; l < this.layers.length - 1; l++) {
      const fanIn = this.layers[l];
      const fanOut = this.layers[l + 1];
      const wLen = fanIn * fanOut;
      const bLen = fanOut;
      this.transitions.push({
        wStart: cursor,
        wLen,
        bStart: cursor + wLen,
        bLen,
        fanIn,
        fanOut,
      });
      cursor += wLen + bLen;
    }
    this.bioStart = cursor;
    this.bioLen = sampleBrain.bioParams.length;
    this.totalParams = cursor + this.bioLen;

    this.activeParamMask = new Uint8Array(this.totalParams);
    this.prunedMask = new Uint8Array(this.totalParams);
    this.plasticityScale = new Float32Array(this.totalParams);

    // 1. Seedling hidden widths: start at ceil(width * initialWidthRatio), min 2 (or ceiling if < 2)
    this.activeHiddenCounts = this.hiddenCeiling.map((w) => {
      if (w <= 2) return w;
      return Math.max(2, Math.min(w, Math.ceil(w * this.config.initialWidthRatio)));
    });

    // 2. Progressive sensors: defer trailing advanced sensors (wave-1 timing/pipe-vel & wave-2 lookahead) when >= 4 sensors
    let deferredSensors = 0;
    if (this.config.progressiveSensors && this.inputFeatures.length >= 4) {
      for (let i = this.inputFeatures.length - 1; i >= 3; i--) {
        const feat = this.inputFeatures[i];
        if (
          feat === 'PIPE_VY' ||
          feat === 'NEXT_PIPE_DY' ||
          feat === 'NEXT_TOP_CLEAR' ||
          feat === 'NEXT_BOT_CLEAR' ||
          feat === 'NEXT_PIPE_DX' ||
          feat === 'NEXT_PIPE_VY' ||
          feat === 'PIPE_TTF'
        ) {
          deferredSensors += 1;
        } else {
          break;
        }
      }
    }
    this.activeSensorCount = Math.max(1, this.inputFeatures.length - deferredSensors);

    // 3. Temporal reasoning depth K: start at K=1 (System-1 fast reflex) for Looped/Ponder
    const canGrowK =
      this.config.growReasoningSteps &&
      (this.architecture === 'LOOPED_REASONER' || this.architecture === 'PONDER_ACT') &&
      this.maxReasoningSteps > 1;
    this.activeReasoningSteps = canGrowK ? 1 : this.maxReasoningSteps;

    // Count theoretical expansion stages for HUD progress indicator
    let stages = 0;
    for (let l = 0; l < this.hiddenCeiling.length; l++) {
      const rem = this.hiddenCeiling[l] - this.activeHiddenCounts[l];
      const step = this.hiddenCeiling[l] >= 8 ? 2 : 1;
      stages += Math.ceil(rem / step);
    }
    stages += this.inputFeatures.length - this.activeSensorCount;
    if (canGrowK) stages += this.maxReasoningSteps - 1;
    if (this.architecture === 'HYBRID_MOE' && this.config.allowExpertSpawning) {
      stages += 3;
    }
    this.maxStages = Math.max(1, stages);

    this.nodeStates = this.layers.map((len, li) => {
      const arr = new Array<number>(len).fill(0);
      const activeN = this.getActiveCountForLayer(li);
      for (let i = 0; i < activeN; i++) arr[i] = 2; // initially all active nodes are plastic
      return arr;
    });

    this.rebuildMasks(null, false);
    this.initialActiveParams = this.countActiveParams();
    this.lastAvgFlops = this.computeActiveFlops();
  }

  getActiveHybridExperts(): HybridExpertKind[] {
    if (this.architecture !== 'HYBRID_MOE') return [];
    const out: HybridExpertKind[] = [];
    for (let i = 0; i < 3; i++) {
      if (this.hybridExpertMask[i] === 1) out.push(HYBRID_EXPERT_KINDS[i]);
    }
    return out;
  }

  computeActiveFlops(): number {
    if (this.architecture === 'HYBRID_MOE') {
      return estimateArchitectureFlops(
        this.activeHiddenCounts,
        this.activeSensorCount,
        'HYBRID_MOE',
        this.activeReasoningSteps,
        this.getActiveHybridExperts()
      );
    }
    return estimateArchitectureFlops(
      this.activeHiddenCounts,
      this.activeSensorCount,
      this.architecture,
      this.activeReasoningSteps
    );
  }

  private getActiveCountForLayer(layerIdx: number): number {
    if (layerIdx === 0) return this.activeSensorCount;
    if (layerIdx === this.layers.length - 1) return this.layers[layerIdx];
    return this.activeHiddenCounts[layerIdx - 1];
  }

  countActiveParams(): number {
    let n = 0;
    for (let i = 0; i < this.totalParams; i++) {
      if (this.activeParamMask[i] === 1) n += 1;
    }
    return n;
  }

  /**
   * Rebuilds activeParamMask & plasticityScale after initialization or a growth/prune event.
   * @param prevActiveMask Mask before this event; previously active weights become myelinated.
   * @param applyMyelination If true, mature weights drop to myelinationScale while newborn weights get 1.2x.
   */
  private rebuildMasks(
    prevActiveMask: Uint8Array | null,
    applyMyelination: boolean
  ): void {
    this.activeParamMask.fill(0);

    // Base dense transitions
    for (let l = 0; l < this.transitions.length; l++) {
      const tr = this.transitions[l];
      const actIn = this.getActiveCountForLayer(l);
      const actOut = this.getActiveCountForLayer(l + 1);
      for (let o = 0; o < actOut; o++) {
        const bIdx = tr.bStart + o;
        if (this.prunedMask[bIdx] === 0) {
          this.activeParamMask[bIdx] = 1;
        }
        const rowOff = tr.wStart + o * tr.fanIn;
        for (let i = 0; i < actIn; i++) {
          const wIdx = rowOff + i;
          if (this.prunedMask[wIdx] === 0) {
            this.activeParamMask[wIdx] = 1;
          }
        }
      }
    }

    // Bio & reasoning extra parameters mapped exactly to active neurons/sensors
    if (this.bioLen > 0) {
      this.markActiveBioParams();
    }

    const myelScale = this.config.myelinationScale;
    for (let i = 0; i < this.totalParams; i++) {
      if (this.activeParamMask[i] === 0) {
        this.plasticityScale[i] = 0;
      } else if (applyMyelination && prevActiveMask && prevActiveMask[i] === 1) {
        // Mature core synapse -> myelinated (stable reflex)
        this.plasticityScale[i] = myelScale;
      } else if (applyMyelination && prevActiveMask && prevActiveMask[i] === 0) {
        // Newborn synapse -> high plasticity
        this.plasticityScale[i] = 1.25;
      } else {
        this.plasticityScale[i] = 1.0;
      }
    }
  }

  private markActiveBioParams(): void {
    const arch = this.architecture;
    const base = this.bioStart;

    if (arch === 'HYBRID_MOE' && this.hybridLayout) {
      const lay = this.hybridLayout;
      const anyExpertActive =
        (this.hybridExpertMask[0] |
          this.hybridExpertMask[1] |
          this.hybridExpertMask[2]) ===
        1;
      if (anyExpertActive) {
        for (let m = 0; m < 4; m++) {
          const bIdx = base + lay.routerBStart + m;
          if (this.prunedMask[bIdx] === 0) this.activeParamMask[bIdx] = 1;
          for (let s = 0; s < this.activeSensorCount; s++) {
            const wIdx = base + lay.routerWStart + m * this.inputFeatures.length + s;
            if (this.prunedMask[wIdx] === 0) this.activeParamMask[wIdx] = 1;
          }
        }
      }
      for (let ei = 0; ei < 3; ei++) {
        if (this.hybridExpertMask[ei] !== 1) continue;
        const ex = lay.experts[ei];
        for (let off = 0; off < ex.len; off++) {
          const idx = base + ex.start + off;
          if (idx < this.totalParams && this.prunedMask[idx] === 0) {
            this.activeParamMask[idx] = 1;
          }
        }
      }
      return;
    }

    if (arch === 'RESIDUAL_SKIP') {
      for (let i = 0; i < this.activeSensorCount && i < this.bioLen; i++) {
        if (this.prunedMask[base + i] === 0) this.activeParamMask[base + i] = 1;
      }
      return;
    }

    if (
      arch === 'DROSOPHILA_CONNECTOME' ||
      arch === 'DECOUPLED_FLY_CORTEX'
    ) {
      const totalH = this.hiddenCeiling.reduce((a, b) => a + b, 0);
      const bioNodes = Math.max(1, totalH);
      if (this.hiddenCeiling.length === 0) {
        for (let k = 0; k < Math.min(2, this.bioLen); k++) {
          if (this.prunedMask[base + k] === 0) this.activeParamMask[base + k] = 1;
        }
      } else {
        let nodeOffset = 0;
        for (let l = 0; l < this.hiddenCeiling.length; l++) {
          const cap = this.hiddenCeiling[l];
          const act = this.activeHiddenCounts[l];
          for (let j = 0; j < act; j++) {
            const pOff = base + (nodeOffset + j) * 2;
            for (let k = 0; k < 2 && pOff + k < this.totalParams; k++) {
              if (this.prunedMask[pOff + k] === 0) this.activeParamMask[pOff + k] = 1;
            }
          }
          nodeOffset += cap;
        }
        const gfBase = base + bioNodes * 2;
        for (let s = 0; s < this.activeSensorCount; s++) {
          const idx = gfBase + s;
          if (idx < this.totalParams && this.prunedMask[idx] === 0) {
            this.activeParamMask[idx] = 1;
          }
        }
      }
      const tailCount = arch === 'DECOUPLED_FLY_CORTEX' ? 20 : 4;
      const tailStart = base + this.bioLen - tailCount;
      for (let t = Math.max(base, tailStart); t < base + this.bioLen; t++) {
        if (t < this.totalParams && this.prunedMask[t] === 0) {
          this.activeParamMask[t] = 1;
        }
      }
      return;
    }

    if (
      arch === 'LTC_FLY' ||
      arch === 'NEUROCHEM_GATE' ||
      arch === 'SYNAPTIC_STP' ||
      arch === 'SELECTIVE_SSM'
    ) {
      const perNode =
        arch === 'NEUROCHEM_GATE' || arch === 'SELECTIVE_SSM' ? 3 : 2;
      if (this.hiddenCeiling.length === 0) {
        for (let k = 0; k < Math.min(perNode, this.bioLen); k++) {
          if (this.prunedMask[base + k] === 0) this.activeParamMask[base + k] = 1;
        }
        return;
      }
      let nodeOffset = 0;
      for (let l = 0; l < this.hiddenCeiling.length; l++) {
        const cap = this.hiddenCeiling[l];
        const act = this.activeHiddenCounts[l];
        for (let j = 0; j < act; j++) {
          const pOff = base + (nodeOffset + j) * perNode;
          for (let k = 0; k < perNode && pOff + k < this.totalParams; k++) {
            if (this.prunedMask[pOff + k] === 0) this.activeParamMask[pOff + k] = 1;
          }
        }
        nodeOffset += cap;
      }
      return;
    }

    // Latent-space reasoning heads (LOOPED_REASONER, PONDER_ACT, LATENT_ROLLOUT)
    const H =
      this.hiddenCeiling.length > 0
        ? this.hiddenCeiling[this.hiddenCeiling.length - 1]
        : 1;
    const actH =
      this.hiddenCeiling.length > 0
        ? this.activeHiddenCounts[this.hiddenCeiling.length - 1]
        : 1;

    // Matrix W_rec / W_dyn: H x H
    for (let j = 0; j < actH; j++) {
      for (let i = 0; i < actH; i++) {
        const idx = base + j * H + i;
        if (idx < this.totalParams && this.prunedMask[idx] === 0) {
          this.activeParamMask[idx] = 1;
        }
      }
    }
    const vec1Start = base + H * H; // b_rec or w_act
    const vec2Start = vec1Start + H; // alpha_logit or b_dyn
    const vec3Start = vec2Start + H; // w_halt or w_val
    for (let j = 0; j < actH; j++) {
      if (vec1Start + j < this.totalParams && this.prunedMask[vec1Start + j] === 0) {
        this.activeParamMask[vec1Start + j] = 1;
      }
      if (vec2Start + j < this.totalParams && this.prunedMask[vec2Start + j] === 0) {
        this.activeParamMask[vec2Start + j] = 1;
      }
      if (
        (arch === 'PONDER_ACT' || arch === 'LATENT_ROLLOUT') &&
        vec3Start + j < this.totalParams &&
        this.prunedMask[vec3Start + j] === 0
      ) {
        this.activeParamMask[vec3Start + j] = 1;
      }
    }
    if (arch === 'PONDER_ACT') {
      const bHaltIdx = vec3Start + H;
      if (bHaltIdx < this.totalParams && this.prunedMask[bHaltIdx] === 0) {
        this.activeParamMask[bHaltIdx] = 1;
      }
    }
  }

  /**
   * Pins all dormant & pruned weights to exact 0.0 and syncs brain.reasoningSteps / hybridActiveMask.
   * Ensures dormant neurons/sensors contribute exact 0.0 across CPU, WebGPU, and CUDA.
   */
  enforceOnBrain(brain: NeuralNetwork): void {
    if (
      this.architecture === 'LOOPED_REASONER' ||
      this.architecture === 'PONDER_ACT'
    ) {
      brain.reasoningSteps = this.activeReasoningSteps;
    }
    if (this.architecture === 'HYBRID_MOE') {
      brain.setHybridExpertMask(this.hybridExpertMask);
    }
    const vec = brain.toFlatVector();
    let dirty = false;
    for (let i = 0; i < this.totalParams; i++) {
      if (this.activeParamMask[i] === 0 && vec[i] !== 0) {
        vec[i] = 0;
        dirty = true;
      }
    }
    if (dirty) {
      brain.fromFlatVector(vec);
    }
  }

  enforceOnFlatVector(vec: Float64Array): void {
    const len = Math.min(vec.length, this.totalParams);
    for (let i = 0; i < len; i++) {
      if (this.activeParamMask[i] === 0) vec[i] = 0;
    }
  }

  /**
   * Function-preserving initialization for a newly unlocked neuron or sensor on all population brains:
   * - Newly unlocked hidden neuron: small random incoming weights, STRICTLY 0.0 outgoing weights.
   * - Newly unlocked sensor column: STRICTLY 0.0 outgoing weights.
   * Guarantee: forward(x) immediately after growth === forward(x) immediately before growth!
   */
  private applyZeroInitForNewParams(
    brains: NeuralNetwork[],
    prevActiveMask: Uint8Array,
    unlockedHiddenLayerIdx: number | null,
    unlockedNeuronRange: [number, number] | null
  ): void {
    // Identify indices that are incoming vs outgoing for newly unlocked hidden neurons
    const incomingIdxSet = new Set<number>();
    if (unlockedHiddenLayerIdx !== null && unlockedNeuronRange !== null) {
      const trIn = this.transitions[unlockedHiddenLayerIdx];
      const actIn = this.getActiveCountForLayer(unlockedHiddenLayerIdx);
      const [nStart, nEnd] = unlockedNeuronRange;
      for (let o = nStart; o < nEnd; o++) {
        incomingIdxSet.add(trIn.bStart + o);
        const rowOff = trIn.wStart + o * trIn.fanIn;
        for (let i = 0; i < actIn; i++) {
          incomingIdxSet.add(rowOff + i);
        }
      }
    }

    for (let b = 0; b < brains.length; b++) {
      const brain = brains[b];
      if (
        this.architecture === 'LOOPED_REASONER' ||
        this.architecture === 'PONDER_ACT'
      ) {
        brain.reasoningSteps = this.activeReasoningSteps;
      }
      const vec = brain.toFlatVector();
      for (let i = 0; i < this.totalParams; i++) {
        if (this.activeParamMask[i] === 0) {
          vec[i] = 0;
        } else if (prevActiveMask[i] === 0 && this.activeParamMask[i] === 1) {
          if (incomingIdxSet.has(i)) {
            // Small random incoming projection so the neuron senses the input immediately
            vec[i] = randn() * 0.35;
          } else {
            // Outgoing weights, newly unlocked sensor columns, and new bio couplings start at 0.0
            // -> 100% function-preserving identity at moment of growth!
            vec[i] = 0;
          }
        }
      }
      brain.fromFlatVector(vec);
    }
  }

  /**
   * Fast deterministic diagnostic probe on the current elite brain:
   * measures per-layer activation saturation (|h| > 0.88) and near-zero active synapse ratio.
   */
  diagnoseElite(
    eliteBrain: NeuralNetwork,
    env: EnvironmentConfig,
    seed: number
  ): {
    overallSaturation: number;
    layerSaturations: number[];
    activeSparsity: number;
  } {
    const probeBrain = eliteBrain.clone();
    probeBrain.resetState();
    const state = createInitialPhysicsState(env, seed);
    const maxProbeFrames = 220;
    const sensorBuf = new Float64Array(probeBrain.inputNodes);

    const layerSatHits = new Float64Array(this.hiddenCeiling.length);
    const layerSatTotal = new Float64Array(this.hiddenCeiling.length);

    let frames = 0;
    while (state.alive && frames < maxProbeFrames) {
      buildSensorInputs(state, probeBrain.inputFeatures, env, sensorBuf);
      const flap = probeBrain.predict(sensorBuf);
      for (let l = 0; l < this.hiddenCeiling.length; l++) {
        const actArr = probeBrain.getLayerActivations(l + 1);
        if (!actArr) continue;
        const actCount = this.activeHiddenCounts[l];
        for (let j = 0; j < actCount; j++) {
          if (Math.abs(actArr[j]) > 0.88) layerSatHits[l] += 1;
        }
        layerSatTotal[l] += actCount;
      }
      stepPhysics(state, flap, env);
      frames += 1;
    }

    let totalHits = 0;
    let totalChecks = 0;
    const layerSaturations: number[] = [];
    for (let l = 0; l < this.hiddenCeiling.length; l++) {
      const sat = layerSatTotal[l] > 0 ? layerSatHits[l] / layerSatTotal[l] : 0;
      layerSaturations.push(sat);
      totalHits += layerSatHits[l];
      totalChecks += layerSatTotal[l];
    }
    const overallSaturation = totalChecks > 0 ? totalHits / totalChecks : 0;

    // Measure near-zero active synapses (excluding biases & bio time constants)
    const vec = probeBrain.toFlatVector();
    let activeWeightTotal = 0;
    let nearZeroCount = 0;
    const pruneCutoff = this.config.pruneThreshold;
    for (let l = 0; l < this.transitions.length; l++) {
      const tr = this.transitions[l];
      for (let i = 0; i < tr.wLen; i++) {
        const idx = tr.wStart + i;
        if (this.activeParamMask[idx] === 1) {
          activeWeightTotal += 1;
          if (Math.abs(vec[idx]) < pruneCutoff) nearZeroCount += 1;
        }
      }
    }
    const activeSparsity =
      activeWeightTotal > 0 ? nearZeroCount / activeWeightTotal : 0;

    this.lastSaturationPct = Math.round(overallSaturation * 100);
    return { overallSaturation, layerSaturations, activeSparsity };
  }

  /**
   * Synaptic Pruning ("use it or lose it"): permanently zeroes weak active weights
   * while guaranteeing at least 1 surviving incoming & outgoing path per active neuron.
   */
  private executeSynapticPruning(
    generation: number,
    eliteBrain: NeuralNetwork,
    populationBrains: NeuralNetwork[],
    saturationPct: number,
    sparsityPct: number
  ): MorphogenesisEvent | null {
    const vec = eliteBrain.toFlatVector();
    const cutoff = this.config.pruneThreshold;
    const toPrune: number[] = [];

    for (let l = 0; l < this.transitions.length; l++) {
      const tr = this.transitions[l];
      const actIn = this.getActiveCountForLayer(l);
      const actOut = this.getActiveCountForLayer(l + 1);

      for (let o = 0; o < actOut; o++) {
        const rowOff = tr.wStart + o * tr.fanIn;
        let maxAbs = -1;
        let strongestIdx = -1;
        const weakRow: number[] = [];
        for (let i = 0; i < actIn; i++) {
          const idx = rowOff + i;
          if (this.activeParamMask[idx] !== 1) continue;
          const a = Math.abs(vec[idx]);
          if (a > maxAbs) {
            maxAbs = a;
            strongestIdx = idx;
          }
          if (a < cutoff) {
            weakRow.push(idx);
          }
        }
        // Always keep at least the strongest synapse per neuron so no active unit disconnects
        for (let k = 0; k < weakRow.length; k++) {
          if (weakRow[k] !== strongestIdx) {
            toPrune.push(weakRow[k]);
          }
        }
      }
    }

    if (toPrune.length < 2) return null;

    for (let k = 0; k < toPrune.length; k++) {
      const idx = toPrune[k];
      this.prunedMask[idx] = 1;
      this.activeParamMask[idx] = 0;
      this.plasticityScale[idx] = 0;
    }
    this.prunedSynapses += toPrune.length;
    this.pruneEventsCount += 1;
    this.lastPruneGen = generation;
    this.lastEventGen = generation;
    this.stagnationCounter = 0;

    for (let b = 0; b < populationBrains.length; b++) {
      this.enforceOnBrain(populationBrains[b]);
    }
    this.enforceOnBrain(eliteBrain);

    const ev: MorphogenesisEvent = {
      generation,
      kind: 'PRUNE',
      detail: `Pruned ${toPrune.length} weak synapses (|w|<${cutoff.toFixed(2)})`,
      saturationPct,
      sparsityPct,
      activeParamsAfter: this.countActiveParams(),
    };
    this.events.push(ev);
    return ev;
  }

  private selectDiagnosticExpertCandidate(
    generation: number,
    env: EnvironmentConfig
  ): number {
    if (
      this.architecture !== 'HYBRID_MOE' ||
      !this.config.allowExpertSpawning ||
      this.inTrialExpertIdx !== null
    ) {
      return -1;
    }
    // Preferred diagnostic order based on environment hazards:
    // - Moving pipes / high vertical oscillation -> LTC_FLY (0) then SELECTIVE_SSM (1) then PONDER_ACT (2)
    // - Variable speed / tight gaps / gusts -> SELECTIVE_SSM (1) then PONDER_ACT (2) then LTC_FLY (0)
    const order = env.movingPipes
      ? [0, 1, 2]
      : env.speedVariability > 0.1 || env.gapVariance > 10
        ? [1, 2, 0]
        : [2, 0, 1];
    for (let k = 0; k < order.length; k++) {
      const ei = order[k];
      if (
        this.hybridExpertMask[ei] === 0 &&
        generation >= this.expertCooldownUntilGen[ei]
      ) {
        return ei;
      }
    }
    return -1;
  }

  /**
   * Called once per generation after population evaluation (before evolving next generation).
   * Evaluates trial grace windows (ROI commit/rollback), stagnation + saturation/sparsity,
   * and applies at most one function-preserving structural event with myelination protection.
   */
  stepGeneration(
    generation: number,
    bestFitness: number,
    bestScore: number,
    eliteBrain: NeuralNetwork,
    populationBrains: NeuralNetwork[],
    env: EnvironmentConfig,
    seed: number
  ): MorphogenesisStepOutcome {
    this.currentGen = generation;
    if (this.architecture === 'HYBRID_MOE' && this.hybridLayout) {
      const rw = eliteBrain.lastHybridRouterWeights;
      this.lastRouterWeights = [rw[0], rw[1], rw[2], rw[3]];
      const qbp = eliteBrain.qBioParams;
      this.lastAlphaGates = [
        this.hybridExpertMask[0] === 1
          ? Math.tanh(qbp[this.hybridLayout.experts[0].alphaIdx])
          : 0,
        this.hybridExpertMask[1] === 1
          ? Math.tanh(qbp[this.hybridLayout.experts[1].alphaIdx])
          : 0,
        this.hybridExpertMask[2] === 1
          ? Math.tanh(qbp[this.hybridLayout.experts[2].alphaIdx])
          : 0,
      ];
      this.lastAvgFlops = eliteBrain.estimateFlopsPerFrame();
    } else {
      this.lastAvgFlops = this.computeActiveFlops();
    }

    // 1. Evaluate active Trial Grace Window ROI (Commit vs Rollback)
    if (this.inTrialExpertIdx !== null) {
      this.trialPeakFitness = Math.max(this.trialPeakFitness, bestFitness);
      this.trialPeakScore = Math.max(this.trialPeakScore, bestScore);
      const windowLen = this.config.expertTrialWindowGens ?? 12;
      if (generation - this.trialStartGen >= windowLen) {
        const ei = this.inTrialExpertIdx;
        const kind = HYBRID_EXPERT_KINDS[ei];
        const currFlops = this.computeActiveFlops();
        const deltaKFlops = Math.max(0.4, (currFlops - this.trialPreFlops) / 100);
        const minGain = Math.max(
          this.config.expertMinRoiGain ?? 1.2,
          deltaKFlops * (this.config.flopsPenaltyWeight ?? 0.004) * 280
        );
        const didImproveScore = this.trialPeakScore > this.trialPreBestScore;
        const didPayOff =
          this.trialPeakFitness >= this.trialPreBestFitness + minGain;

        if (didImproveScore || didPayOff) {
          this.inTrialExpertIdx = null;
          this.trialPreEliteVec = null;
          this.committedExpertsCount += 1;
          const prevMask = this.activeParamMask.slice();
          this.rebuildMasks(prevMask, true);
          this.lastEventGen = generation;
          this.stagnationCounter = 0;
          const gain = (this.trialPeakFitness - this.trialPreBestFitness).toFixed(1);
          const ev: MorphogenesisEvent = {
            generation,
            kind: 'COMMIT_EXPERT',
            detail: `Committed ${kind} expert (ROI +${gain} fit over ${windowLen}g, +${Math.round(deltaKFlops * 100)} FLOPs)`,
            saturationPct: this.lastSaturationPct,
            sparsityPct: 0,
            activeParamsAfter: this.countActiveParams(),
          };
          this.events.push(ev);
          return {
            changed: true,
            event: ev,
            activeReasoningSteps: this.activeReasoningSteps,
          };
        }

        // ROI failed -> ROLLBACK_EXPERT cleanly to pre-spawn state
        this.hybridExpertMask[0] = this.trialPreExpertMask[0];
        this.hybridExpertMask[1] = this.trialPreExpertMask[1];
        this.hybridExpertMask[2] = this.trialPreExpertMask[2];
        if (this.trialPreActiveMask && this.trialPrePlasticity) {
          this.activeParamMask.set(this.trialPreActiveMask);
          this.plasticityScale.set(this.trialPrePlasticity);
        } else {
          this.rebuildMasks(null, false);
        }
        if (this.trialPreEliteVec) {
          eliteBrain.fromFlatVector(this.trialPreEliteVec);
          eliteBrain.setHybridExpertMask(this.hybridExpertMask);
          for (let b = 0; b < populationBrains.length; b++) {
            populationBrains[b].fromFlatVector(this.trialPreEliteVec);
            populationBrains[b].setHybridExpertMask(this.hybridExpertMask);
            if (b > 0) {
              populationBrains[b].mutate(
                0.15,
                0.22,
                this.plasticityScale,
                this.activeParamMask
              );
            }
          }
        }
        this.inTrialExpertIdx = null;
        this.trialPreEliteVec = null;
        this.rollbackCount += 1;
        this.expertCooldownUntilGen[ei] = generation + 24;
        this.lastEventGen = generation;
        this.stagnationCounter = 0;
        const deltaFit = (this.trialPeakFitness - this.trialPreBestFitness).toFixed(1);
        const ev: MorphogenesisEvent = {
          generation,
          kind: 'ROLLBACK_EXPERT',
          detail: `Rolled back ${kind} (ROI ${deltaFit} < +${minGain.toFixed(1)} req; saved ${Math.round(deltaKFlops * 100)} FLOPs/f)`,
          saturationPct: this.lastSaturationPct,
          sparsityPct: 0,
          activeParamsAfter: this.countActiveParams(),
        };
        this.events.push(ev);
        return {
          changed: true,
          event: ev,
          activeReasoningSteps: this.activeReasoningSteps,
        };
      }
      // During active trial grace window, don't stack another structural growth event
      return {
        changed: false,
        event: null,
        activeReasoningSteps: this.activeReasoningSteps,
      };
    }

    const improved =
      bestScore > this.bestScoreSeen || bestFitness > this.bestFitnessSeen + 0.5;
    if (improved) {
      this.bestScoreSeen = Math.max(this.bestScoreSeen, bestScore);
      this.bestFitnessSeen = Math.max(this.bestFitnessSeen, bestFitness);
      this.stagnationCounter = 0;
    } else {
      this.stagnationCounter += 1;
    }

    // Gradual remyelination decay: mature nodes stay myelinated, plastic newborn settles after ~12 gens
    if (generation - this.lastEventGen === 12) {
      for (let i = 0; i < this.totalParams; i++) {
        if (this.activeParamMask[i] === 1 && this.plasticityScale[i] > 1.0) {
          this.plasticityScale[i] = 1.0;
        }
      }
    }

    const cooldown = Math.max(4, Math.floor(this.config.growthStagnationTrigger * 0.6));
    if (
      this.stagnationCounter < this.config.growthStagnationTrigger ||
      generation - this.lastEventGen < cooldown
    ) {
      return {
        changed: false,
        event: null,
        activeReasoningSteps: this.activeReasoningSteps,
      };
    }

    const diag = this.diagnoseElite(eliteBrain, env, seed);
    const satPct = Math.round(diag.overallSaturation * 100);
    const spPct = Math.round(diag.activeSparsity * 100);

    // Priority 1: Synaptic Pruning if bloat/sparsity exceeds trigger and not recently pruned
    if (
      diag.activeSparsity >= this.config.pruneSparsityTrigger &&
      generation - this.lastPruneGen >= this.config.growthStagnationTrigger * 2
    ) {
      const prunedEv = this.executeSynapticPruning(
        generation,
        eliteBrain,
        populationBrains,
        satPct,
        spPct
      );
      if (prunedEv) {
        return {
          changed: true,
          event: prunedEv,
          activeReasoningSteps: this.activeReasoningSteps,
        };
      }
    }

    // Check which growth axes still have headroom
    let mostSatLayer = -1;
    let bestLayerSat = -1;
    for (let l = 0; l < this.hiddenCeiling.length; l++) {
      if (this.activeHiddenCounts[l] < this.hiddenCeiling[l]) {
        const sat = diag.layerSaturations[l] ?? diag.overallSaturation;
        if (sat > bestLayerSat) {
          bestLayerSat = sat;
          mostSatLayer = l;
        }
      }
    }
    const canGrowWidth = mostSatLayer !== -1;
    const canGrowK =
      this.config.growReasoningSteps &&
      (this.architecture === 'LOOPED_REASONER' || this.architecture === 'PONDER_ACT') &&
      this.activeReasoningSteps < this.maxReasoningSteps;
    const canUnlockSensor = this.activeSensorCount < this.inputFeatures.length;
    const expertCandidateIdx = this.selectDiagnosticExpertCandidate(generation, env);
    const canSpawnExpert = expertCandidateIdx !== -1;

    if (!canGrowWidth && !canGrowK && !canUnlockSensor && !canSpawnExpert) {
      // At full structural ceiling — allow one final cleanup prune if sparsity is high
      if (
        diag.activeSparsity >= this.config.pruneSparsityTrigger * 0.85 &&
        generation - this.lastPruneGen >= this.config.growthStagnationTrigger * 2
      ) {
        const prunedEv = this.executeSynapticPruning(
          generation,
          eliteBrain,
          populationBrains,
          satPct,
          spPct
        );
        if (prunedEv) {
          return {
            changed: true,
            event: prunedEv,
            activeReasoningSteps: this.activeReasoningSteps,
          };
        }
      }
      return {
        changed: false,
        event: null,
        activeReasoningSteps: this.activeReasoningSteps,
      };
    }

    // Diagnostic action selection:
    // - High neuron saturation -> GROW_WIDTH first
    // - Hybrid MoE under temporal hazard or exhausted reflex capacity -> SPAWN_EXPERT (Zero-Init + Trial ROI)
    // - Moderate saturation with reasoning headroom -> GROW_K (System-1 -> System-2)
    // - Deferred advanced sensor available -> UNLOCK_SENSOR
    let chosen: 'GROW_WIDTH' | 'GROW_K' | 'UNLOCK_SENSOR' | 'SPAWN_EXPERT';
    if (canGrowWidth && bestLayerSat >= this.config.saturationThreshold) {
      chosen = 'GROW_WIDTH';
    } else if (
      canSpawnExpert &&
      (env.movingPipes || this.stage >= 1 || !canGrowWidth)
    ) {
      chosen = 'SPAWN_EXPERT';
    } else if (canGrowK && (this.activeReasoningSteps === 1 || !canGrowWidth)) {
      chosen = 'GROW_K';
    } else if (canUnlockSensor && (this.stage >= 1 || !canGrowWidth)) {
      chosen = 'UNLOCK_SENSOR';
    } else if (canGrowWidth) {
      chosen = 'GROW_WIDTH';
    } else if (canSpawnExpert) {
      chosen = 'SPAWN_EXPERT';
    } else if (canGrowK) {
      chosen = 'GROW_K';
    } else {
      chosen = 'UNLOCK_SENSOR';
    }

    const prevMask = this.activeParamMask.slice();
    // Mark all previously active nodes as myelinated (1)
    for (let li = 0; li < this.nodeStates.length; li++) {
      for (let ni = 0; ni < this.nodeStates[li].length; ni++) {
        if (this.nodeStates[li][ni] > 0) this.nodeStates[li][ni] = 1;
      }
    }

    let ev: MorphogenesisEvent;
    if (chosen === 'SPAWN_EXPERT' && expertCandidateIdx >= 0) {
      // Save lossless pre-spawn rollback snapshot
      this.trialPreBestFitness = bestFitness;
      this.trialPreBestScore = bestScore;
      this.trialPreFlops = this.computeActiveFlops();
      this.trialPeakFitness = bestFitness;
      this.trialPeakScore = bestScore;
      this.trialStartGen = generation;
      this.trialPreExpertMask = [
        this.hybridExpertMask[0],
        this.hybridExpertMask[1],
        this.hybridExpertMask[2],
      ];
      this.trialPreActiveMask = this.activeParamMask.slice();
      this.trialPrePlasticity = this.plasticityScale.slice();
      this.trialPreEliteVec = eliteBrain.toFlatVector();
      this.inTrialExpertIdx = expertCandidateIdx;

      this.hybridExpertMask[expertCandidateIdx] = 1;
      this.rebuildMasks(prevMask, true);
      const allBrains = [eliteBrain, ...populationBrains];
      for (let b = 0; b < allBrains.length; b++) {
        allBrains[b].zeroInitHybridExpert(expertCandidateIdx);
        this.enforceOnBrain(allBrains[b]);
      }
      const kind = HYBRID_EXPERT_KINDS[expertCandidateIdx];
      this.growthEventsCount += 1;
      this.stage += 1;
      const winLen = this.config.expertTrialWindowGens ?? 12;
      ev = {
        generation,
        kind: 'SPAWN_EXPERT',
        detail: `Spawned ${kind} expert (Zero-Init α=0, ${winLen}g ROI trial)`,
        saturationPct: satPct,
        sparsityPct: spPct,
        activeParamsAfter: this.countActiveParams(),
      };
    } else if (chosen === 'GROW_WIDTH') {
      const cap = this.hiddenCeiling[mostSatLayer];
      const prevW = this.activeHiddenCounts[mostSatLayer];
      const delta = cap >= 8 ? Math.min(2, cap - prevW) : 1;
      const nextW = prevW + delta;
      this.activeHiddenCounts[mostSatLayer] = nextW;
      for (let ni = prevW; ni < nextW; ni++) {
        this.nodeStates[mostSatLayer + 1][ni] = 2; // plastic newborn
      }
      this.rebuildMasks(prevMask, true);
      this.applyZeroInitForNewParams(
        [eliteBrain, ...populationBrains],
        prevMask,
        mostSatLayer,
        [prevW, nextW]
      );
      this.growthEventsCount += 1;
      this.stage += 1;
      ev = {
        generation,
        kind: 'GROW_WIDTH',
        detail: `L${mostSatLayer + 1} width ${prevW}→${nextW}/${cap} (Zero-Init, sat ${satPct}%)`,
        saturationPct: satPct,
        sparsityPct: spPct,
        activeParamsAfter: this.countActiveParams(),
      };
    } else if (chosen === 'GROW_K') {
      const prevK = this.activeReasoningSteps;
      this.activeReasoningSteps = prevK + 1;
      // Myelinate base weights while giving recurrent/halting bioParams high plasticity
      this.rebuildMasks(prevMask, true);
      for (let i = this.bioStart; i < this.totalParams; i++) {
        if (this.activeParamMask[i] === 1) {
          this.plasticityScale[i] = 1.2;
        }
      }
      const allBrains = [eliteBrain, ...populationBrains];
      for (let b = 0; b < allBrains.length; b++) {
        allBrains[b].reasoningSteps = this.activeReasoningSteps;
      }
      this.growthEventsCount += 1;
      this.stage += 1;
      ev = {
        generation,
        kind: 'GROW_K',
        detail: `Reasoning depth K ${prevK}→${this.activeReasoningSteps}/${this.maxReasoningSteps}`,
        saturationPct: satPct,
        sparsityPct: spPct,
        activeParamsAfter: this.countActiveParams(),
      };
    } else {
      const prevS = this.activeSensorCount;
      const unlockedFeat = this.inputFeatures[prevS];
      this.activeSensorCount = prevS + 1;
      this.nodeStates[0][prevS] = 2; // plastic newborn sensor channel
      this.rebuildMasks(prevMask, true);
      this.applyZeroInitForNewParams(
        [eliteBrain, ...populationBrains],
        prevMask,
        null,
        null
      );
      this.growthEventsCount += 1;
      this.stage += 1;
      ev = {
        generation,
        kind: 'UNLOCK_SENSOR',
        detail: `Unlocked sensor ${unlockedFeat} (${prevS}→${this.activeSensorCount}/${this.inputFeatures.length}, Zero-Init)`,
        saturationPct: satPct,
        sparsityPct: spPct,
        activeParamsAfter: this.countActiveParams(),
      };
    }

    this.lastEventGen = generation;
    this.stagnationCounter = 0;
    this.events.push(ev);
    return {
      changed: true,
      event: ev,
      activeReasoningSteps: this.activeReasoningSteps,
    };
  }

  private buildHybridTelemetry(): import('./types').HybridModuleTelemetry | undefined {
    if (this.architecture !== 'HYBRID_MOE') return undefined;
    const winLen = this.config.expertTrialWindowGens ?? 12;
    const trialGensRemaining =
      this.inTrialExpertIdx !== null
        ? Math.max(0, winLen - (this.currentGen - this.trialStartGen))
        : 0;
    return {
      activeExperts: this.getActiveHybridExperts(),
      routerWeights: {
        MLP: this.lastRouterWeights[0],
        LTC_FLY: this.lastRouterWeights[1],
        SELECTIVE_SSM: this.lastRouterWeights[2],
        PONDER_ACT: this.lastRouterWeights[3],
      },
      alphaGates: {
        LTC_FLY: this.lastAlphaGates[0],
        SELECTIVE_SSM: this.lastAlphaGates[1],
        PONDER_ACT: this.lastAlphaGates[2],
      },
      inTrialExpert:
        this.inTrialExpertIdx !== null
          ? HYBRID_EXPERT_KINDS[this.inTrialExpertIdx]
          : null,
      trialGensRemaining,
      avgFlopsPerFrame: this.lastAvgFlops || this.computeActiveFlops(),
      rollbackCount: this.rollbackCount,
      committedExpertsCount: this.committedExpertsCount,
    };
  }

  getSnapshot(): MorphogenesisSnapshot {
    const edgeStates: number[][] = this.transitions.map((tr) => {
      const arr = new Array<number>(tr.wLen);
      for (let i = 0; i < tr.wLen; i++) {
        const idx = tr.wStart + i;
        if (this.activeParamMask[idx] === 0) {
          arr[i] = 0;
        } else if (this.plasticityScale[idx] <= this.config.myelinationScale + 0.05) {
          arr[i] = 1; // myelinated
        } else {
          arr[i] = 2; // plastic
        }
      }
      return arr;
    });
    const hybridTelemetry = this.buildHybridTelemetry();

    return {
      enabled: true,
      stage: this.stage,
      maxStages: this.maxStages,
      activeHiddenCounts: [...this.activeHiddenCounts],
      ceilingHiddenCounts: [...this.hiddenCeiling],
      activeSensorCount: this.activeSensorCount,
      totalSensorCount: this.inputFeatures.length,
      activeReasoningSteps: this.activeReasoningSteps,
      maxReasoningSteps: this.maxReasoningSteps,
      activeParams: this.countActiveParams(),
      ceilingParams: this.totalParams,
      prunedSynapses: this.prunedSynapses,
      lastSaturationPct: this.lastSaturationPct,
      nodeStates: this.nodeStates.map((row) => [...row]),
      edgeStates,
      events: this.events.slice(-8),
      ...(hybridTelemetry ? { hybridTelemetry } : {}),
    };
  }

  getSummary(): MorphogenesisSummary {
    const flops = this.lastAvgFlops || this.computeActiveFlops();
    const roi =
      this.bestFitnessSeen > 0 && flops > 0
        ? Number(((this.bestFitnessSeen / flops) * 100).toFixed(2))
        : 0;
    return {
      initialActiveParams: this.initialActiveParams,
      finalActiveParams: this.countActiveParams(),
      ceilingParams: this.totalParams,
      prunedSynapses: this.prunedSynapses,
      growthEventsCount: this.growthEventsCount,
      pruneEventsCount: this.pruneEventsCount,
      finalReasoningSteps: this.activeReasoningSteps,
      finalActiveSensors: this.activeSensorCount,
      finalHiddenCounts: [...this.activeHiddenCounts],
      eventTimeline: [...this.events],
      ...(this.architecture === 'HYBRID_MOE'
        ? {
            activeExperts: this.getActiveHybridExperts(),
            rollbackCount: this.rollbackCount,
            committedExpertsCount: this.committedExpertsCount,
            avgFlopsPerFrame: flops,
            computeRoiScore: roi,
            expertUsageRatio: {
              MLP: Number(this.lastRouterWeights[0].toFixed(3)),
              LTC_FLY: Number(this.lastRouterWeights[1].toFixed(3)),
              SELECTIVE_SSM: Number(this.lastRouterWeights[2].toFixed(3)),
              PONDER_ACT: Number(this.lastRouterWeights[3].toFixed(3)),
            },
          }
        : {
            avgFlopsPerFrame: flops,
            computeRoiScore: roi,
          }),
    };
  }
}

export function formatMorphogenesisEventCompact(ev: MorphogenesisEvent): string {
  const tag =
    ev.kind === 'GROW_WIDTH'
      ? '+W'
      : ev.kind === 'GROW_K'
        ? '+K'
        : ev.kind === 'UNLOCK_SENSOR'
          ? '+S'
          : ev.kind === 'SPAWN_EXPERT'
            ? '+EXP'
            : ev.kind === 'COMMIT_EXPERT'
              ? 'OK'
              : ev.kind === 'ROLLBACK_EXPERT'
                ? 'RB'
                : ev.kind === 'ISLAND_REBALANCE'
                  ? 'ISL'
                  : 'PRUNE';
  return `G${ev.generation}:${tag}(${ev.activeParamsAfter}p)`;
}

export function isMorphogenesisReasoningGrowable(arch?: NetworkArchitecture): boolean {
  return (
    isReasoningArchitecture(arch) &&
    (arch === 'LOOPED_REASONER' || arch === 'PONDER_ACT')
  );
}
