/**
 * Curated Research Presets, Diagnostic/Load Test Scenarios, Integrity Verifier,
 * Run Configuration Formatter, and Multi-Run Meta-Analysis Dossier Builder.
 */

import {
  ARCHITECTURE_META,
  formatTopologyLabel,
  normalizeHiddenLayers,
  WEIGHT_PRECISION_META,
} from './neuralNetwork';
import { resolvePowerProfile } from './powerProfile';
import { ALGORITHM_SHORT_LABELS } from './researchReport';
import {
  ALL_SENSOR_FEATURES,
  CLASSIC_5_SENSOR_FEATURES,
  DEFAULT_MULTI_SENSOR_SUBSETS,
  formatInputSubsetLabel,
  normalizeInputFeatures,
} from './sensors';
import {
  analyzeSmartPrune,
  BUILTIN_KNOWLEDGE_ENTRIES,
  formatKnowledgeLogMarkdown,
  synthesizeKnowledgeFromRuns,
} from './smartPrune';
import { DIFFICULTY_SETTINGS, resolveEnvironment } from './simulation';
import { getPresetText } from '../i18n/catalog';
import type { AppLanguage } from '../i18n/dictionaries';
import type {
  ExperimentRunRecord,
  IntegrityCheckItem,
  IntegrityCheckSummary,
  QueuedExperiment,
  ResearchSweepConfig,
  ResearchTrialResult,
} from './types';

export type PresetId =
  | 'REALISTIC_PIXELS_DECOUPLED_LAB'
  | 'FRUIT_FLY_SPEED_LAB'
  | 'HYBRID_ISLAND_FRONTIER'
  | 'MORPHOGENESIS_FRONTIER'
  | 'SENSOR_DISCOVERY_12'
  | 'COLAB_MEGA_FRONTIER'
  | 'REASONING_TTC_LAB'
  | 'LOOKAHEAD_FRONTIER'
  | 'INSANE_BREAKER'
  | 'FULL_4_FRONTIER'
  | 'INT4_BIO_CHAMPION'
  | 'ULTRA_10K_PROOF'
  | 'APP_INTEGRITY_MATRIX'
  | 'STRESS_LIGHT_CPU_GPU'
  | 'STRESS_HEAVY_BIO'
  | 'BIO_BITS_50P'
  | 'HIDDEN_STATE_LAB'
  | 'BIO_ZOO_50P'
  | 'PIPE_VY_FRONTIER';

export interface PresetDefinition {
  id: PresetId;
  category: 'FRONTIER' | 'DIAGNOSTIC' | 'CLASSIC';
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  buildConfig: (base: ResearchSweepConfig) => ResearchSweepConfig;
}

export const RESEARCH_PRESETS: PresetDefinition[] = [
  // --- Recommended Frontier Runs (Data-Driven) ---
  {
    id: 'REALISTIC_PIXELS_DECOUPLED_LAB',
    category: 'FRONTIER',
    title: 'Decoupled Fly-Cortex & Pixels',
    subtitle: 'Reasoning vs Knowledge · FlyHash Memory · Dopamine Plasticity',
    description:
      'Tests the LLM-inspired Decoupled Brain (Executive LTC + Giant Fiber Reflex + Surprise S1/S2 Gate separated from O(1) FlyHash APL Associative Skill Memory with online Dopamine plasticity) against Drosophila Connectome, Ponder-ACT, and MLP under Realistic Compound-Eye Pixel vision and non-stationary flight anomalies.',
    accent: 'amber',
    buildConfig: (base) => ({
      ...base,
      algorithms: ['CMA_HYBRID', 'DE', 'GA'],
      difficulties: ['MEDIUM', 'HARD', 'INSANE'],
      inputFeatureSets: [
        [
          'VEL_VY',
          'PIPE_DX',
          'TOP_CLEAR',
          'BOT_CLEAR',
          'PIPE_VY',
          'NEXT_PIPE_DX',
          'NEXT_TOP_CLEAR',
          'NEXT_BOT_CLEAR',
        ],
      ],
      architectures: [
        'DECOUPLED_FLY_CORTEX',
        'DROSOPHILA_CONNECTOME',
        'PONDER_ACT',
        'MLP',
      ],
      reasoningSteps: 3,
      shapedFitness: true,
      curriculumLearning: true,
      perceptionMode: 'COMPOUND_EYE_PIXELS',
      opticalNoiseLevel: 0.06,
      nonStationaryAnomalies: true,
      onlinePlasticity: true,
      morphogenesisMode: 'PAIRED_AB',
      evolutionTopologyMode: 'SINGLE_SPECIES',
      morphogenesisConfig: {
        initialWidthRatio: 0.5,
        growthStagnationTrigger: 8,
        saturationThreshold: 0.6,
        myelinationScale: 0.25,
        pruneThreshold: 0.06,
        pruneSparsityTrigger: 0.28,
        progressiveSensors: true,
        growReasoningSteps: true,
        metabolicStepCost: 0.015,
        flopsPenaltyWeight: 0.002,
      },
      weightPrecisions: ['FP32', 'INT4'],
      topologies: [[4], [6, 4]],
      maxParameters: 500,
      populationSizes: [100],
      mutationRates: [0.16],
      mutationStrengths: [0.32],
      maxGenerations: 120,
      stagnationLimit: 35,
      targetPipeCap: 500,
      verificationSeeds: 5,
      computeBackend: 'AUTO',
      auditParallelism: true,
      scheduleMode: 'BALANCED',
      smartPrune: true,
    }),
  },
  {
    id: 'FRUIT_FLY_SPEED_LAB',
    category: 'FRONTIER',
    title: 'Fruit Fly Speed Lab',
    subtitle: 'Drosophila Connectome vs Fly-LTC vs ResSkip vs MLP',
    description:
      'Head-to-head learning-speed benchmark pitting the Drosophila melanogaster Connectome (Optic Lobe T4/T5 LTC + Mushroom Body APL Lateral Inhibition + Octopamine Arousal + Giant Fiber Reflex Bypass) against Fly-LTC, Residual Skip, and standard MLP across Medium & Hard.',
    accent: 'amber',
    buildConfig: (base) => ({
      ...base,
      algorithms: ['GA', 'CMA_HYBRID'],
      difficulties: ['MEDIUM', 'HARD'],
      inputFeatureSets: [
        [
          'VEL_VY',
          'PIPE_DX',
          'TOP_CLEAR',
          'BOT_CLEAR',
          'PIPE_VY',
          'NEXT_PIPE_DX',
          'NEXT_TOP_CLEAR',
          'NEXT_BOT_CLEAR',
        ],
      ],
      architectures: ['DROSOPHILA_CONNECTOME', 'LTC_FLY', 'RESIDUAL_SKIP', 'MLP'],
      reasoningSteps: 3,
      shapedFitness: true,
      curriculumLearning: true,
      morphogenesisMode: 'PAIRED_AB',
      evolutionTopologyMode: 'SINGLE_SPECIES',
      morphogenesisConfig: {
        initialWidthRatio: 0.5,
        growthStagnationTrigger: 8,
        saturationThreshold: 0.6,
        myelinationScale: 0.25,
        pruneThreshold: 0.06,
        pruneSparsityTrigger: 0.28,
        progressiveSensors: true,
        growReasoningSteps: false,
        metabolicStepCost: 0.015,
        flopsPenaltyWeight: 0.002,
      },
      weightPrecisions: ['FP32'],
      topologies: [[4], [6, 4]],
      maxParameters: 450,
      populationSizes: [80],
      mutationRates: [0.16],
      mutationStrengths: [0.3],
      maxGenerations: 120,
      stagnationLimit: 35,
      targetPipeCap: 500,
      verificationSeeds: 5,
      computeBackend: 'AUTO',
      auditParallelism: true,
      scheduleMode: 'BALANCED',
      smartPrune: true,
    }),
  },
  {
    id: 'HYBRID_ISLAND_FRONTIER',
    category: 'FRONTIER',
    title: 'Hybrid MoE + Islands',
    subtitle: 'Compute ROI · FLOPs Penalty · 5-Island Race · CPU/OpenMP',
    description:
      'Macro + Micro Compute-Justified Plasticity: benchmarks lean MLP-core Hybrid MoE (progressive LTC_FLY, SELECTIVE_SSM, PONDER_ACT spawning with trial-window ROI rollback) and 5-Species Co-Evolutionary Islands, auto-routed to CPU Workers / Colab OpenMP across Easy/Medium/Hard/Insane.',
    accent: 'emerald',
    buildConfig: (base) => ({
      ...base,
      algorithms: ['GA', 'CMA_HYBRID'],
      difficulties: ['EASY', 'MEDIUM', 'HARD', 'INSANE'],
      inputFeatureSets: [
        ['PIPE_DX', 'BOT_CLEAR', 'NEXT_PIPE_DX', 'NEXT_BOT_CLEAR'],
        [...ALL_SENSOR_FEATURES],
      ],
      architectures: ['HYBRID_MOE'],
      reasoningSteps: 3,
      shapedFitness: true,
      curriculumLearning: true,
      morphogenesisMode: 'PAIRED_AB',
      evolutionTopologyMode: 'ISLAND_SPECIATION',
      morphogenesisConfig: {
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
      weightPrecisions: ['FP32', 'INT4'],
      topologies: [[4], [4, 4]],
      maxParameters: 600,
      populationSizes: [180],
      mutationRates: [0.16],
      mutationStrengths: [0.32],
      maxGenerations: 160,
      stagnationLimit: 40,
      targetPipeCap: 1000,
      verificationSeeds: 5,
      computeBackend: 'AUTO',
      auditParallelism: true,
      scheduleMode: 'BALANCED',
      smartPrune: true,
    }),
  },
  {
    id: 'MORPHOGENESIS_FRONTIER',
    category: 'FRONTIER',
    title: 'Morphogenesis A/B Frontier',
    subtitle: 'Static vs Growing · 12-Sensor Pool · 4 Tiers · 220g',
    description:
      'Controlled Paired A/B benchmark pitting Static vs Bio-Inspired Self-Growing Morphogenesis (Zero-Init width expansion, adaptive K: 1→3 with metabolic step cost, progressive sensor unlock across 12 sensors, myelination core protection & synaptic pruning) across Easy/Medium/Hard/Insane on [4], [4,4], [6,4] topologies.',
    accent: 'cyan',
    buildConfig: (base) => ({
      ...base,
      algorithms: ['GA', 'CMA_HYBRID'],
      difficulties: ['EASY', 'MEDIUM', 'HARD', 'INSANE'],
      inputFeatureSets: [
        ['PIPE_DX', 'BOT_CLEAR', 'NEXT_PIPE_DX', 'NEXT_BOT_CLEAR'],
        [...ALL_SENSOR_FEATURES],
      ],
      architectures: ['NEUROCHEM_GATE', 'SELECTIVE_SSM', 'PONDER_ACT', 'MLP'],
      reasoningSteps: 3,
      shapedFitness: true,
      curriculumLearning: true,
      morphogenesisMode: 'PAIRED_AB',
      morphogenesisConfig: {
        initialWidthRatio: 0.5,
        growthStagnationTrigger: 10,
        saturationThreshold: 0.62,
        myelinationScale: 0.25,
        pruneThreshold: 0.06,
        pruneSparsityTrigger: 0.28,
        progressiveSensors: true,
        growReasoningSteps: true,
        metabolicStepCost: 0.015,
      },
      weightPrecisions: ['INT4', 'FP32'],
      topologies: [[4], [4, 4], [6, 4]],
      maxParameters: 160,
      populationSizes: [220],
      mutationRates: [0.16],
      mutationStrengths: [0.3],
      maxGenerations: 220,
      stagnationLimit: 55,
      targetPipeCap: 1000,
      verificationSeeds: 5,
      computeBackend: 'AUTO',
      auditParallelism: true,
      scheduleMode: 'BALANCED',
      smartPrune: true,
    }),
  },
  {
    id: 'SENSOR_DISCOVERY_12',
    category: 'FRONTIER',
    title: '12-Sensor Discovery Lab',
    subtitle: 'Bot-First · Dual-Pipe · 12-Pool · Meta-Analysis',
    description:
      'Systematic sensor ablation across the 4 mathematically verified levels (Easy → Insane) comparing minimal Bot-only, Dual-Pipe Bot (P1+P2 DX·Bot), Dual Geometry (Top+Bot), 10-in Kinematic, and the full 12-sensor pool with Jacobian attribution & pruning survival analysis.',
    accent: 'cyan',
    buildConfig: (base) => ({
      ...base,
      algorithms: ['GA', 'DE', 'CMA_HYBRID'],
      difficulties: ['EASY', 'MEDIUM', 'HARD', 'INSANE'],
      inputFeatureSets: DEFAULT_MULTI_SENSOR_SUBSETS.map((s) => [...s]),
      architectures: ['MLP', 'RESIDUAL_SKIP', 'NEUROCHEM_GATE', 'SELECTIVE_SSM'],
      reasoningSteps: 3,
      shapedFitness: true,
      curriculumLearning: false,
      morphogenesisMode: 'PAIRED_AB',
      weightPrecisions: ['FP32', 'INT4'],
      topologies: [[4], [4, 4], [6, 4]],
      maxParameters: 160,
      populationSizes: [150],
      mutationRates: [0.16],
      mutationStrengths: [0.35],
      maxGenerations: 120,
      stagnationLimit: 30,
      targetPipeCap: 1000,
      verificationSeeds: 5,
      computeBackend: 'AUTO',
      auditParallelism: true,
      scheduleMode: 'BALANCED',
      smartPrune: true,
    }),
  },
  {
    id: 'COLAB_MEGA_FRONTIER',
    category: 'FRONTIER',
    title: 'Colab GPU Mega-Frontier',
    subtitle: '~4.5k Calibrated · 4 Tiers · 12-Sensor · T4/A100',
    description:
      'Empirically calibrated Frontier matrix for Google Colab CUDA: 4 verified difficulty tiers (Easy, Medium, Hard, Insane) × Top-4 optimizers (GA, DE, CMA-Hybrid, Adam-ES) × 7 winning architectures × 5 compact topologies × Dual-Bot/Dual-Vel/Full-12 sensors × FP32/INT4 × Paired Static/Growing Morphogenesis.',
    accent: 'emerald',
    buildConfig: (base) => ({
      ...base,
      algorithms: ['GA', 'DE', 'CMA_HYBRID', 'ADAM_ES'],
      difficulties: ['EASY', 'MEDIUM', 'HARD', 'INSANE'],
      inputFeatureSets: [
        ['PIPE_DX', 'BOT_CLEAR', 'NEXT_PIPE_DX', 'NEXT_BOT_CLEAR'],
        [
          'VEL_VY',
          'PIPE_DX',
          'TOP_CLEAR',
          'BOT_CLEAR',
          'PIPE_VY',
          'NEXT_TOP_CLEAR',
          'NEXT_BOT_CLEAR',
          'NEXT_PIPE_DX',
          'NEXT_PIPE_VY',
          'PIPE_TTF',
        ],
        [...ALL_SENSOR_FEATURES],
      ],
      architectures: [
        'MLP',
        'RESIDUAL_SKIP',
        'LTC_FLY',
        'NEUROCHEM_GATE',
        'SELECTIVE_SSM',
        'PONDER_ACT',
        'LOOPED_REASONER',
      ],
      reasoningSteps: 3,
      shapedFitness: true,
      curriculumLearning: false,
      morphogenesisMode: 'PAIRED_AB',
      weightPrecisions: ['FP32', 'INT4'],
      topologies: [[4], [2, 4], [4, 4], [6, 4], [8, 4]],
      maxParameters: 220,
      populationSizes: [150],
      mutationRates: [0.16],
      mutationStrengths: [0.25, 0.35],
      maxGenerations: 160,
      stagnationLimit: 32,
      targetPipeCap: 1000,
      verificationSeeds: 5,
      computeBackend: 'AUTO',
      auditParallelism: true,
      scheduleMode: 'BALANCED',
      smartPrune: true,
    }),
  },
  {
    id: 'REASONING_TTC_LAB',
    category: 'FRONTIER',
    title: 'LLM Reasoning & TTC Lab',
    subtitle: 'Looped · Ponder ACT · MinGRU · Rollout',
    description:
      'Head-to-head showdown of the 4 LLM-inspired recursive reasoning architectures (Looped Latent CoT, Adaptive Halting System 1/2, Selective SSM/MinGRU, Counterfactual Rollout) vs MLP & Skip on Medium/Hard/Insane with Shaped Fitness.',
    accent: 'violet',
    buildConfig: (base) => ({
      ...base,
      algorithms: ['GA', 'DE', 'PSO'],
      difficulties: ['MEDIUM', 'HARD', 'INSANE'],
      inputFeatureSets: [
        [
          'VEL_VY',
          'PIPE_DX',
          'TOP_CLEAR',
          'BOT_CLEAR',
          'PIPE_VY',
          'NEXT_TOP_CLEAR',
          'NEXT_BOT_CLEAR',
          'NEXT_PIPE_DX',
        ],
      ],
      architectures: [
        'MLP',
        'RESIDUAL_SKIP',
        'LOOPED_REASONER',
        'PONDER_ACT',
        'SELECTIVE_SSM',
        'LATENT_ROLLOUT',
      ],
      reasoningSteps: 3,
      shapedFitness: true,
      weightPrecisions: ['FP32'],
      topologies: [[4], [6], [4, 4]],
      maxParameters: 140,
      populationSizes: [150],
      mutationRates: [0.16],
      mutationStrengths: [0.35],
      maxGenerations: 80,
      stagnationLimit: 20,
      targetPipeCap: 500,
      verificationSeeds: 5,
      computeBackend: 'CPU',
      auditParallelism: true,
      scheduleMode: 'BALANCED',
      smartPrune: true,
    }),
  },
  {
    id: 'LOOKAHEAD_FRONTIER',
    category: 'FRONTIER',
    title: 'Dual-Pipe Lookahead',
    subtitle: 'P1 vs Dual-Bot vs Full 12 · 4 Tiers · 120g',
    description:
      'Head-to-head A/B test of Pipe #1 baseline vs Dual-Pipe Bot (P1+P2 DX·Bot) vs Full 12-Sensor Lookahead across Easy, Medium, Hard & Insane.',
    accent: 'cyan',
    buildConfig: (base) => ({
      ...base,
      algorithms: ['GA', 'DE', 'PSO'],
      difficulties: ['EASY', 'MEDIUM', 'HARD', 'INSANE'],
      inputFeatureSets: [
        ['PIPE_DX', 'BOT_CLEAR'],
        ['PIPE_DX', 'BOT_CLEAR', 'NEXT_PIPE_DX', 'NEXT_BOT_CLEAR'],
        [...ALL_SENSOR_FEATURES],
      ],
      architectures: ['MLP', 'RESIDUAL_SKIP', 'LTC_FLY', 'SYNAPTIC_STP'],
      weightPrecisions: ['FP32'],
      topologies: [[4], [8], [4, 4], [2, 4]],
      maxParameters: 160,
      populationSizes: [150],
      mutationRates: [0.16],
      mutationStrengths: [0.35],
      maxGenerations: 120,
      stagnationLimit: 25,
      targetPipeCap: 1000,
      verificationSeeds: 5,
      computeBackend: 'AUTO',
      auditParallelism: true,
      scheduleMode: 'BALANCED',
      smartPrune: true,
    }),
  },
  {
    id: 'INSANE_BREAKER',
    category: 'FRONTIER',
    title: 'Hard & Insane Breaker',
    subtitle: 'Top-4 · Dual-Pipe · 8·4/6·4 · 120g',
    description:
      'Targeted frontier sweep to crack Hard & Insane with Top-4 optimizers, Dual-Pipe & Full-12 sensors, wide D1-D2 (incl. 8·4), Skip/NeuroChem/STP, FP32+INT4.',
    accent: 'rose',
    buildConfig: (base) => ({
      ...base,
      algorithms: ['GA', 'DE', 'PSO', 'CMA_HYBRID'],
      difficulties: ['HARD', 'INSANE'],
      inputFeatureSets: [
        ['PIPE_DX', 'BOT_CLEAR', 'NEXT_PIPE_DX', 'NEXT_BOT_CLEAR'],
        [...ALL_SENSOR_FEATURES],
      ],
      architectures: ['MLP', 'RESIDUAL_SKIP', 'NEUROCHEM_GATE', 'SYNAPTIC_STP'],
      weightPrecisions: ['FP32', 'INT4'],
      topologies: [[4], [8], [4, 4], [8, 4], [6, 4]],
      maxParameters: 180,
      populationSizes: [150, 300],
      mutationRates: [0.16],
      mutationStrengths: [0.35],
      maxGenerations: 120,
      stagnationLimit: 25,
      targetPipeCap: 1000,
      verificationSeeds: 5,
      computeBackend: 'AUTO',
      auditParallelism: true,
      scheduleMode: 'BALANCED',
    }),
  },
  {
    id: 'FULL_4_FRONTIER',
    category: 'FRONTIER',
    title: 'All 4 Difficulty Tiers',
    subtitle: 'Easy · Medium · Hard · Insane · ≤140p',
    description:
      'Complete 4-tier mathematically verified difficulty map (Easy → Medium → Hard → Insane) with Top-4 optimizers and Bot-only / Dual-Bot / Full-12 sensor ablation.',
    accent: 'amber',
    buildConfig: (base) => ({
      ...base,
      algorithms: ['GA', 'DE', 'PSO', 'CMA_HYBRID'],
      difficulties: ['EASY', 'MEDIUM', 'HARD', 'INSANE'],
      inputFeatureSets: [
        ['BOT_CLEAR'],
        ['PIPE_DX', 'BOT_CLEAR', 'NEXT_PIPE_DX', 'NEXT_BOT_CLEAR'],
        [...ALL_SENSOR_FEATURES],
      ],
      architectures: ['MLP', 'RESIDUAL_SKIP', 'NEUROCHEM_GATE', 'SYNAPTIC_STP'],
      weightPrecisions: ['FP32', 'INT4'],
      topologies: [[], [4], [8], [4, 4], [8, 4]],
      maxParameters: 140,
      populationSizes: [150],
      mutationRates: [0.16],
      mutationStrengths: [0.4],
      maxGenerations: 80,
      stagnationLimit: 20,
      targetPipeCap: 1000,
      verificationSeeds: 5,
      computeBackend: 'AUTO',
      auditParallelism: true,
      scheduleMode: 'BALANCED',
    }),
  },
  {
    id: 'INT4_BIO_CHAMPION',
    category: 'FRONTIER',
    title: 'INT4 Bio Cliff',
    subtitle: 'Skip/Chem/STP · 32b→1b · 4 Tiers',
    description:
      'Tests the INT4 / 1.58b / 1b quantization cliff across winning bio-architectures & the 4 verified difficulty tiers.',
    accent: 'teal',
    buildConfig: (base) => ({
      ...base,
      algorithms: ['GA', 'DE', 'PSO'],
      difficulties: ['EASY', 'MEDIUM', 'HARD', 'INSANE'],
      inputFeatureSets: [
        ['BOT_CLEAR'],
        ['PIPE_DX', 'BOT_CLEAR', 'NEXT_PIPE_DX', 'NEXT_BOT_CLEAR'],
      ],
      architectures: ['MLP', 'RESIDUAL_SKIP', 'NEUROCHEM_GATE', 'SYNAPTIC_STP'],
      weightPrecisions: ['FP32', 'INT4', 'TERNARY', 'BINARY'],
      topologies: [[], [2], [4], [8], [2, 2], [4, 4]],
      maxParameters: 90,
      populationSizes: [150],
      mutationRates: [0.16],
      mutationStrengths: [0.4],
      maxGenerations: 50,
      stagnationLimit: 15,
      targetPipeCap: 1000,
      verificationSeeds: 5,
      computeBackend: 'AUTO',
      auditParallelism: true,
      scheduleMode: 'BALANCED',
    }),
  },
  {
    id: 'ULTRA_10K_PROOF',
    category: 'FRONTIER',
    title: '10k Endurance',
    subtitle: '10k×5s · GA/DE/PSO · Skip/Chem',
    description:
      'Lean 10,000-pipe × 5-seed endurance certification on top optimizers & architectures across the 4 difficulty tiers.',
    accent: 'sky',
    buildConfig: (base) => ({
      ...base,
      algorithms: ['GA', 'DE', 'PSO'],
      difficulties: ['EASY', 'MEDIUM', 'HARD', 'INSANE'],
      inputFeatureSets: [
        ['BOT_CLEAR'],
        ['PIPE_DX', 'BOT_CLEAR', 'NEXT_PIPE_DX', 'NEXT_BOT_CLEAR'],
      ],
      architectures: ['MLP', 'RESIDUAL_SKIP', 'NEUROCHEM_GATE'],
      weightPrecisions: ['FP32', 'INT4', 'BINARY'],
      topologies: [[], [2], [4], [4, 4]],
      maxParameters: 80,
      populationSizes: [150],
      mutationRates: [0.16],
      mutationStrengths: [0.4],
      maxGenerations: 60,
      stagnationLimit: 15,
      targetPipeCap: 10000,
      verificationSeeds: 5,
      computeBackend: 'AUTO',
      auditParallelism: true,
      scheduleMode: 'BALANCED',
    }),
  },

  // --- Diagnostics, Integrity & Hardware Load Suites ---
  {
    id: 'APP_INTEGRITY_MATRIX',
    category: 'DIAGNOSTIC',
    title: 'App Full Self-Test',
    subtitle: '4 Tiers · 5 Archs · 4 Precs · 6 Algos',
    description:
      'Fast end-to-end validation matrix verifying all 4 core physics tiers, 5 neural architectures, 4 bit precisions, 6 optimizers, 12-sensor inputs, and zero audit truncation/NaN bugs (~15-30s).',
    accent: 'emerald',
    buildConfig: (base) => ({
      ...base,
      algorithms: ['GA', 'DE', 'PSO', 'CMA_HYBRID', 'CEM', 'ADAPTIVE_ES'],
      difficulties: ['EASY', 'MEDIUM', 'HARD', 'INSANE'],
      inputFeatureSets: [
        ['BOT_CLEAR'],
        ['PIPE_DX', 'BOT_CLEAR', 'NEXT_PIPE_DX', 'NEXT_BOT_CLEAR'],
        [...ALL_SENSOR_FEATURES],
      ],
      architectures: [
        'MLP',
        'RESIDUAL_SKIP',
        'LTC_FLY',
        'NEUROCHEM_GATE',
        'SYNAPTIC_STP',
      ],
      weightPrecisions: ['FP32', 'INT4', 'TERNARY', 'BINARY'],
      topologies: [[2]],
      maxParameters: 80,
      populationSizes: [60],
      mutationRates: [0.16],
      mutationStrengths: [0.4],
      maxGenerations: 6,
      stagnationLimit: null,
      targetPipeCap: 150,
      verificationSeeds: 3,
      computeBackend: 'AUTO',
      auditParallelism: true,
      scheduleMode: 'BALANCED',
    }),
  },
  {
    id: 'STRESS_LIGHT_CPU_GPU',
    category: 'DIAGNOSTIC',
    title: 'Load: Light MLP/Audit',
    subtitle: 'High IPC & Audit Rate · 1/4-in · 1k',
    description:
      'High-frequency trial completion & audit stress test (tiny MLPs solving quickly across 1,000-pipe × 5-seed verification) to measure IPC overhead, event-loop lag, and audit speed.',
    accent: 'cyan',
    buildConfig: (base) => ({
      ...base,
      algorithms: ['GA', 'DE', 'PSO', 'CMA_HYBRID'],
      difficulties: ['EASY', 'MEDIUM', 'HARD'],
      inputFeatureSets: [
        ['BOT_CLEAR'],
        ['PIPE_DX', 'BOT_CLEAR', 'NEXT_PIPE_DX', 'NEXT_BOT_CLEAR'],
      ],
      architectures: ['MLP', 'RESIDUAL_SKIP'],
      weightPrecisions: ['FP32', 'INT4', 'BINARY'],
      topologies: [[], [2], [4]],
      maxParameters: 50,
      populationSizes: [60, 150],
      mutationRates: [0.16],
      mutationStrengths: [0.4],
      maxGenerations: 25,
      stagnationLimit: 12,
      targetPipeCap: 1000,
      verificationSeeds: 5,
      computeBackend: 'AUTO',
      auditParallelism: true,
      scheduleMode: 'BALANCED',
    }),
  },
  {
    id: 'STRESS_HEAVY_BIO',
    category: 'DIAGNOSTIC',
    title: 'Load: Heavy Bio Thermal',
    subtitle: 'Dense 8·4/6·4 Bio · Pop 300 · Heat Test',
    description:
      'Sustained high-FLOP neural load (deep stateful Bio networks + Pop 300 on Hard/Insane physics) designed to expose thermal throttling, P/E-core scaling, and Perf/Watt curves.',
    accent: 'violet',
    buildConfig: (base) => ({
      ...base,
      algorithms: ['GA', 'DE', 'PSO'],
      difficulties: ['MEDIUM', 'HARD', 'INSANE'],
      inputFeatureSets: [[...ALL_SENSOR_FEATURES]],
      architectures: ['RESIDUAL_SKIP', 'LTC_FLY', 'NEUROCHEM_GATE', 'SYNAPTIC_STP'],
      weightPrecisions: ['FP32', 'INT4'],
      topologies: [[8, 4], [6, 4]],
      maxParameters: 180,
      populationSizes: [300],
      mutationRates: [0.16],
      mutationStrengths: [0.35],
      maxGenerations: 25,
      stagnationLimit: 15,
      targetPipeCap: 500,
      verificationSeeds: 3,
      computeBackend: 'CPU',
      auditParallelism: true,
      scheduleMode: 'BALANCED',
    }),
  },

  // --- Classic Compact Labs (≤80p) ---
  {
    id: 'BIO_BITS_50P',
    category: 'CLASSIC',
    title: 'Bio + Bits (≤80p)',
    subtitle: 'Fly-LTC · NeuroChem · 4b/1.58b',
    description: 'Compact ≤80p comparison of MLP vs Fly-LTC vs NeuroChem across FP32 / INT4 / 1.58b.',
    accent: 'emerald',
    buildConfig: (base) => ({
      ...base,
      algorithms: ['GA', 'DE'],
      difficulties: ['EASY', 'MEDIUM', 'HARD', 'INSANE'],
      inputFeatureSets: DEFAULT_MULTI_SENSOR_SUBSETS.slice(0, 4).map((s) => [...s]),
      architectures: ['MLP', 'LTC_FLY', 'NEUROCHEM_GATE'],
      weightPrecisions: ['FP32', 'INT4', 'TERNARY'],
      topologies: [[], [2], [4], [2, 2]],
      maxParameters: 80,
      populationSizes: [150],
      mutationRates: [0.16],
      mutationStrengths: [0.4],
      maxGenerations: 40,
      stagnationLimit: 15,
      targetPipeCap: 500,
      verificationSeeds: 3,
      auditParallelism: true,
      scheduleMode: 'BALANCED',
    }),
  },
  {
    id: 'HIDDEN_STATE_LAB',
    category: 'CLASSIC',
    title: 'Missing-Sensor Lab',
    subtitle: '5 Bio-Neurons · Predict Vy/PVy/P2',
    description: 'Tests whether stateful Bio neurons infer missing bird Vy, Pipe Vy & lookahead geometry.',
    accent: 'violet',
    buildConfig: (base) => ({
      ...base,
      algorithms: ['GA', 'DE'],
      difficulties: ['EASY', 'MEDIUM', 'HARD', 'INSANE'],
      inputFeatureSets: [
        ['BOT_CLEAR'],
        ['PIPE_DX', 'BOT_CLEAR'],
        ['PIPE_DX', 'BOT_CLEAR', 'NEXT_PIPE_DX', 'NEXT_BOT_CLEAR'],
        ['PIPE_DX', 'TOP_CLEAR', 'BOT_CLEAR', 'PIPE_VY'],
        ['VEL_VY', 'PIPE_DX', 'TOP_CLEAR', 'BOT_CLEAR'],
      ],
      architectures: ['MLP', 'RESIDUAL_SKIP', 'LTC_FLY', 'NEUROCHEM_GATE', 'SYNAPTIC_STP'],
      weightPrecisions: ['FP32'],
      topologies: [[2], [4], [2, 2]],
      maxParameters: 60,
      populationSizes: [150],
      mutationRates: [0.16],
      mutationStrengths: [0.4],
      maxGenerations: 40,
      stagnationLimit: 15,
      targetPipeCap: 500,
      verificationSeeds: 3,
      auditParallelism: true,
      scheduleMode: 'BALANCED',
    }),
  },
  {
    id: 'BIO_ZOO_50P',
    category: 'CLASSIC',
    title: 'Bit Sweep (32b→1b)',
    subtitle: '6 Precisions · Pipes/Bit · ≤60p',
    description: 'Full 6-precision bit-compression sweep across compact sub-60p topologies.',
    accent: 'cyan',
    buildConfig: (base) => ({
      ...base,
      algorithms: ['GA', 'DE'],
      difficulties: ['EASY', 'MEDIUM', 'HARD', 'INSANE'],
      inputFeatureSets: [
        ['BOT_CLEAR'],
        ['PIPE_DX', 'BOT_CLEAR', 'NEXT_PIPE_DX', 'NEXT_BOT_CLEAR'],
        ['VEL_VY', 'PIPE_DX', 'TOP_CLEAR', 'BOT_CLEAR', 'PIPE_VY'],
      ],
      architectures: ['MLP', 'LTC_FLY'],
      weightPrecisions: ['FP32', 'FP16', 'INT8', 'INT4', 'TERNARY', 'BINARY'],
      topologies: [[], [2], [4], [3, 2], [2, 2, 2]],
      maxParameters: 60,
      populationSizes: [150],
      mutationRates: [0.16],
      mutationStrengths: [0.4],
      maxGenerations: 35,
      stagnationLimit: 12,
      targetPipeCap: 500,
      verificationSeeds: 3,
      auditParallelism: true,
      scheduleMode: 'BALANCED',
    }),
  },
  {
    id: 'PIPE_VY_FRONTIER',
    category: 'CLASSIC',
    title: 'Moving-Pipe & TTF Lab',
    subtitle: 'Medium · Hard · Insane · PVy/N2PVy/TTF',
    description: 'Directly tests Pipe #1/#2 vertical velocity & wind-compensated TTF observability.',
    accent: 'slate',
    buildConfig: (base) => ({
      ...base,
      algorithms: ['GA', 'DE', 'PSO', 'CMA_HYBRID'],
      difficulties: ['MEDIUM', 'HARD', 'INSANE'],
      inputFeatureSets: [
        ['PIPE_DX', 'BOT_CLEAR', 'NEXT_PIPE_DX', 'NEXT_BOT_CLEAR'],
        ['VEL_VY', 'PIPE_DX', 'TOP_CLEAR', 'BOT_CLEAR', 'PIPE_VY'],
        ['VEL_VY', 'PIPE_DX', 'TOP_CLEAR', 'BOT_CLEAR', 'PIPE_VY', 'PIPE_TTF'],
        [...ALL_SENSOR_FEATURES],
      ],
      architectures: ['MLP', 'LTC_FLY', 'NEUROCHEM_GATE'],
      weightPrecisions: ['FP32'],
      topologies: [[], [4], [6, 2], [4, 4]],
      maxParameters: 90,
      populationSizes: [150],
      mutationRates: [0.16],
      mutationStrengths: [0.3, 0.5],
      maxGenerations: 45,
      stagnationLimit: 15,
      targetPipeCap: 500,
      auditParallelism: true,
      scheduleMode: 'BALANCED',
    }),
  },
];

export const PRESET_TRANSLATIONS_PL: Record<
  PresetId,
  { title: string; subtitle: string; description: string }
> = {
  REALISTIC_PIXELS_DECOUPLED_LAB: {
    title: 'Fly-Cortex & Piksele Oka',
    subtitle: 'Rozumowanie vs Wiedza · FlyHash · Dopamina',
    description:
      'Testuje rozdzielony mózg Fly-Cortex (rdzeń wykonawczy LTC + Giant Fiber + bramka S1/S2 + 16-slotowa pamięć FlyHash APL z plastycznością dopaminową online) przeciwko Drosophila, Ponder-ACT i MLP w trybie 16-promieniowego oka złożonego i anomalii lotu.',
  },
  FRUIT_FLY_SPEED_LAB: {
    title: 'Test Prędkości Muszki Owocowej',
    subtitle: 'Drosophila Connectome vs Fly-LTC vs ResSkip vs MLP',
    description:
      'Bezpośrednie porównanie szybkości uczenia konektomu Drosophila (T4/T5 LTC + APL + oktopamina + Giant Fiber) z Fly-LTC, Residual Skip i MLP na poziomach Medium i Hard.',
  },
  HYBRID_ISLAND_FRONTIER: {
    title: 'Hybrid MoE + Wyspy (Islands)',
    subtitle: 'Compute ROI · Kara FLOPs · 5 Wysp · CPU/OpenMP',
    description:
      'Plastyczność uzasadniona kosztem obliczeniowym: testuje Hybrid MoE (progresywne dodawanie ekspertów LTC/SSM/ACT z rollbackiem ROI) oraz 5-gatunkowe wyspy koewolucyjne na Easy/Medium/Hard/Insane.',
  },
  MORPHOGENESIS_FRONTIER: {
    title: 'Morfogeneza A/B Frontier',
    subtitle: 'Statyczne vs Rosnące · 12 Sensorów · 4 Poziomy · 220g',
    description:
      'Kontrolowany test A/B sieci statycznych vs samorosnących (ekspansja Zero-Init, adaptacyjne K: 1→3, progresywne odblokowywanie 12 sensorów, mielinizacja i przycinanie synaps) na Easy–Insane.',
  },
  SENSOR_DISCOVERY_12: {
    title: 'Odkrywanie 12 Sensorów',
    subtitle: 'Bot-First · Dual-Pipe · Pula 12 · Meta-Analiza',
    description:
      'Systematyczna ablacja sensorów na 4 zweryfikowanych poziomach (Easy → Insane) porównująca zestawy od pojedynczego Bot po pełną pulę 12 sensorów z analizą wrażliwości i przycinania.',
  },
  COLAB_MEGA_FRONTIER: {
    title: 'Colab GPU Mega-Frontier',
    subtitle: '~4.5k Skalibrowane · 4 Poziomy · 12 Sensorów · T4/A100',
    description:
      'Skalibrowana macierz badawcza dla Google Colab CUDA: 4 poziomy (Easy–Insane) × 4 czołowe optymalizatory × 7 architektur × 5 kompaktowych topologii × FP32/INT4 × test A/B morfogenezy.',
  },
  REASONING_TTC_LAB: {
    title: 'Rozumowanie LLM & TTC Lab',
    subtitle: 'Looped · Ponder ACT · MinGRU · Rollout',
    description:
      'Pojedynek 4 architektur rekurencyjnego rozumowania (Looped Latent CoT, Ponder ACT S1/S2, Selective SSM/MinGRU, Latent Rollout) przeciwko MLP i Res-Skip na Medium/Hard/Insane.',
  },
  LOOKAHEAD_FRONTIER: {
    title: 'Wyprzedzenie Dwóch Rur (Lookahead)',
    subtitle: 'Rura #1 vs Dual-Bot vs Pełne 12 · 4 Poziomy · 120g',
    description:
      'Test A/B zestawu bazowego Rury #1 przeciwko Dual-Pipe Bot (P1+P2 DX·Bot) i pełnym 12 sensorom na Easy, Medium, Hard i Insane.',
  },
  INSANE_BREAKER: {
    title: 'Łamacz Hard & Insane',
    subtitle: 'Top-4 · Dual-Pipe · 8·4/6·4 · 120g',
    description:
      'Celowany sweep do pokonania Hard i Insane: Top-4 optymalizatory, sensory Dual-Pipe i 12-in, szersze sieci D1–D2 (w tym 8·4), Skip/NeuroChem/STP, FP32+INT4.',
  },
  FULL_4_FRONTIER: {
    title: 'Wszystkie 4 Poziomy Trudności',
    subtitle: 'Easy · Medium · Hard · Insane · ≤140p',
    description:
      'Pełna mapa 4 zweryfikowanych poziomów trudności (Easy → Insane) z Top-4 optymalizatorami i ablacją sensorów Bot / Dual-Bot / Pełne 12.',
  },
  INT4_BIO_CHAMPION: {
    title: 'Klif Kwantyzacji INT4 Bio',
    subtitle: 'Skip/Chem/STP · 32b→1b · 4 Poziomy',
    description:
      'Bada klif kwantyzacji INT4 / 1.58b / 1b dla czołowych bio-architektur na 4 zweryfikowanych poziomach trudności.',
  },
  ULTRA_10K_PROOF: {
    title: 'Certyfikacja 10k Rur',
    subtitle: '10k×5s · GA/DE/PSO · Skip/Chem',
    description:
      'Wytrzymałościowy audyt 10 000 rur × 5 ziaren na czołowych optymalizatorach i architekturach przez wszystkie 4 poziomy.',
  },
  APP_INTEGRITY_MATRIX: {
    title: 'Pełny Auto-Test Aplikacji',
    subtitle: '4 Poziomy · 5 Arch. · 4 Precyzje · 6 Algorytmów',
    description:
      'Szybka macierz walidacyjna sprawdzająca 4 poziomy fizyki, 5 architektur, 4 precyzje bitowe, 6 optymalizatorów i brak błędów NaN/audytu (~15–30s).',
  },
  STRESS_LIGHT_CPU_GPU: {
    title: 'Obciążenie: Lekkie MLP/Audyt',
    subtitle: 'Wysoki IPC & Audyt · 1/4-in · 1k',
    description:
      'Test wydajności szybkich prób i równoległego audytu f64 (1000 rur × 5 ziaren) do pomiaru narzutu IPC i opóźnień pętli zdarzeń.',
  },
  STRESS_HEAVY_BIO: {
    title: 'Obciążenie: Ciężkie Bio Termiczne',
    subtitle: 'Gęste 8·4/6·4 Bio · Pop 300 · Test Ciepła',
    description:
      'Długotrwałe wysokie obciążenie FLOPs (głębokie sieci stanowe Bio + Pop 300 na Hard/Insane) do badania throttlingu termicznego i krzywej Perf/Watt.',
  },
  BIO_BITS_50P: {
    title: 'Bio + Bity (≤80p)',
    subtitle: 'Fly-LTC · NeuroChem · 4b/1.58b',
    description:
      'Kompaktowe porównanie ≤80 parametrów: MLP vs Fly-LTC vs NeuroChem dla FP32, INT4 i 1.58b.',
  },
  HIDDEN_STATE_LAB: {
    title: 'Lab Brakujących Sensorów',
    subtitle: '5 Bio-Neuronów · Estymacja Vy/PVy/P2',
    description:
      'Sprawdza, czy stanowe bio-neurony potrafią same wydedukować brakującą prędkość ptaka Vy, ruch rury PVy i geometrię rury #2.',
  },
  BIO_ZOO_50P: {
    title: 'Sweep Bitowy (32b→1b)',
    subtitle: '6 Precyzji · Rury/Bit · ≤60p',
    description:
      'Pełny przegląd 6 poziomów kwantyzacji wag (FP32 → 1-bit) na kompaktowych topologiach ≤60 parametrów.',
  },
  PIPE_VY_FRONTIER: {
    title: 'Lab Ruchomych Rur & TTF',
    subtitle: 'Medium · Hard · Insane · PVy/N2PVy/TTF',
    description:
      'Bezpośrednio bada wpływ sensorów prędkości pionowej Rury #1/#2 oraz czasu dolotu TTF skorygowanego o wiatr.',
  },
};

export function getPresetById(id: PresetId): PresetDefinition {
  return RESEARCH_PRESETS.find((p) => p.id === id) ?? RESEARCH_PRESETS[0];
}

export function getLocalizedPreset(
  preset: PresetDefinition,
  lang: AppLanguage
) {
  const entry = getPresetText(lang, preset.id);
  if (entry) return entry;
  return {
    title: preset.title,
    subtitle: preset.subtitle,
    description: preset.description,
  };
}

/**
 * Builds a 4-stage Thermal & Performance-per-Watt calibration queue:
 * runs the exact same balanced workload at 20% (Silent), 45% (Eco), 70% (Balanced), and 100% (Max Speed)
 * so you can empirically measure your laptop's exact Perf/Watt knee, per-core speed, and thermal drift.
 */
export function buildThermalEfficiencySweepQueue(
  baseConfig: ResearchSweepConfig
): QueuedExperiment[] {
  const levels: { priority: number; label: string; note: string }[] = [
    { priority: 20, label: 'Perf/Watt [1/4]: 20% Silent/Cool', note: 'Low-V P-cores + cooling rests, iGPU off' },
    { priority: 45, label: 'Perf/Watt [2/4]: 45% Eco Sweet-Spot', note: 'Optimal Perf/Watt knee, minimal heat' },
    { priority: 70, label: 'Perf/Watt [3/4]: 70% Balanced', note: 'High throughput + generous OS headroom' },
    { priority: 100, label: 'Perf/Watt [4/4]: 100% Max Speed', note: 'Full TDP saturation test' },
  ];
  const now = Date.now();
  return levels.map((lvl, idx) => ({
    id: `q-thermal-${now}-${idx}`,
    name: lvl.label,
    presetId: 'THERMAL_SWEEP',
    notes: lvl.note,
    addedAt: new Date(now + idx).toISOString(),
    status: 'PENDING',
    config: {
      ...baseConfig,
      algorithms: ['GA', 'DE', 'PSO'],
      difficulties: ['EASY', 'MEDIUM', 'HARD', 'INSANE'],
      inputFeatureSets: [
        ['BOT_CLEAR'],
        ['PIPE_DX', 'BOT_CLEAR', 'NEXT_PIPE_DX', 'NEXT_BOT_CLEAR'],
      ],
      architectures: ['MLP', 'RESIDUAL_SKIP', 'NEUROCHEM_GATE', 'SYNAPTIC_STP'],
      weightPrecisions: ['FP32', 'INT4'],
      topologies: [[4], [8], [4, 4]],
      maxParameters: 90,
      populationSizes: [150],
      mutationRates: [0.16],
      mutationStrengths: [0.35],
      maxGenerations: 30,
      stagnationLimit: 12,
      targetPipeCap: 1000,
      verificationSeeds: 5,
      workerThreads: 0, // Follow priority slider strictly!
      performancePriority: lvl.priority,
      computeBackend: 'CPU',
      auditParallelism: true,
      scheduleMode: 'BALANCED',
      customEnvironment: baseConfig.customEnvironment ?? { ...DIFFICULTY_SETTINGS.CUSTOM },
    },
  }));
}

/**
 * Builds a 3-stage Validation + Load Suite queue:
 * 1) App Full Self-Test (all 11 scenarios, all 5 architectures, all 4 precisions)
 * 2) Load Test: Light MLP / High IPC & Audit Rate
 * 3) Load Test: Heavy Bio / Sustained Thermal Load
 */
export function buildValidationAndLoadQueue(
  baseConfig: ResearchSweepConfig
): QueuedExperiment[] {
  const ids: PresetId[] = [
    'APP_INTEGRITY_MATRIX',
    'STRESS_LIGHT_CPU_GPU',
    'STRESS_HEAVY_BIO',
  ];
  const now = Date.now();
  return ids.map((id, idx) => {
    const preset = getPresetById(id);
    return {
      id: `q-diag-${now}-${idx}`,
      name: preset.title,
      presetId: preset.id,
      notes: preset.subtitle,
      addedAt: new Date(now + idx).toISOString(),
      status: 'PENDING',
      config: preset.buildConfig({
        ...baseConfig,
        workerThreads: 0,
      }),
    };
  });
}

/** Formats a single-line human-readable summary of the exact run configuration */
export function formatConfigSummary(
  cfg: ResearchSweepConfig,
  hardwareCores = 8
): string {
  const algos = cfg.algorithms.map((a) => ALGORITHM_SHORT_LABELS[a] ?? a).join(',');
  const diffs = cfg.difficulties
    .map((d) => resolveEnvironment(d, cfg.customEnvironment).label)
    .join(',');
  const archs = (
    cfg.architectures && cfg.architectures.length > 0
      ? cfg.architectures
      : (['MLP'] as const)
  )
    .map((a) => ARCHITECTURE_META[a]?.shortLabel ?? a)
    .join(',');
  const precs = (
    cfg.weightPrecisions && cfg.weightPrecisions.length > 0
      ? cfg.weightPrecisions
      : (['FP32'] as const)
  )
    .map((p) => WEIGHT_PRECISION_META[p]?.shortLabel ?? p)
    .join(',');
  const inputs = (
    cfg.inputFeatureSets && cfg.inputFeatureSets.length > 0
      ? cfg.inputFeatureSets
      : [[...CLASSIC_5_SENSOR_FEATURES]]
  )
    .map((s) => formatInputSubsetLabel(normalizeInputFeatures(s)))
    .join(' | ');
  const topos = cfg.topologies
    .slice(0, 8)
    .map((t) => formatTopologyLabel(normalizeHiddenLayers(t), 0).replace(/^0→/, ''))
    .join(',');
  const topoExtra = cfg.topologies.length > 8 ? ` +${cfg.topologies.length - 8}` : '';
  const plan = resolvePowerProfile(cfg.performancePriority ?? 70, hardwareCores);
  const threadStr =
    cfg.workerThreads === 0
      ? `Slider(${plan.priority}%→${plan.targetCpuThreads}t)`
      : cfg.workerThreads === -1
        ? `Max(${hardwareCores}t)`
        : cfg.workerThreads === -2
          ? `Turbo`
          : `${cfg.workerThreads}t`;

  return [
    `Algos=[${algos}]`,
    `Diffs(${cfg.difficulties.length})=[${diffs}]`,
    `Archs=[${archs}]`,
    ...(cfg.reasoningSteps && cfg.reasoningSteps !== 3 ? [`K=${cfg.reasoningSteps}`] : []),
    ...(cfg.shapedFitness ? [`Shaped=ON`] : []),
    ...(cfg.morphogenesisMode && cfg.morphogenesisMode !== 'STATIC'
      ? [`Morph=${cfg.morphogenesisMode}`]
      : []),
    ...(cfg.evolutionTopologyMode === 'ISLAND_SPECIATION'
      ? [`EvoMode=ISLAND_SPECIATION`]
      : []),
    `Precs=[${precs}]`,
    `Sensors(${cfg.inputFeatureSets?.length ?? 1})=[${inputs}]`,
    `Topos(${cfg.topologies.length})=[${topos}${topoExtra}]`,
    `MaxP=${cfg.maxParameters ?? 'none'}`,
    `Pop=[${cfg.populationSizes.join(',')}]`,
    `σ=[${cfg.mutationStrengths.join(',')}]`,
    `Gens=${cfg.maxGenerations ?? '∞'} (stag=${cfg.stagnationLimit ?? 'off'})`,
    `Cap=${cfg.targetPipeCap}×${cfg.verificationSeeds}s`,
    `Backend=${cfg.computeBackend ?? 'AUTO'}`,
    `Threads=${threadStr}`,
    `SmartPrune=${cfg.smartPrune === false ? 'OFF' : 'ON'}`,
  ].join(' · ');
}

export function countPlannedTrials(cfg: ResearchSweepConfig): number {
  return analyzeSmartPrune(cfg).activeTrials;
}

/**
 * Verifies functional & numerical integrity of a completed sweep run:
 * checks scenario/architecture/precision/optimizer coverage, zero NaN/Infinity,
 * and zero falsely truncated non-perfect audits.
 */
export function runIntegrityChecks(
  results: ResearchTrialResult[],
  config: ResearchSweepConfig
): IntegrityCheckSummary {
  const checks: IntegrityCheckItem[] = [];

  // 1. Non-empty results
  checks.push({
    label: 'Non-empty trial output',
    passed: results.length > 0,
    detail: `${results.length} trials recorded`,
  });

  // 2. Numerical health (no NaN / Infinity in scores, ticks, compute)
  let badNums = 0;
  let badAuditSeeds = 0;
  let badPerfectConsistency = 0;
  const seenDiffs = new Set<string>();
  const seenArchs = new Set<string>();
  const seenPrecs = new Set<string>();
  const seenAlgos = new Set<string>();

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    seenDiffs.add(r.difficulty);
    seenArchs.add(r.architecture ?? 'MLP');
    seenPrecs.add(r.weightPrecision ?? 'FP32');
    seenAlgos.add(r.algorithm);

    if (
      !Number.isFinite(r.minSeedScore) ||
      !Number.isFinite(r.meanSeedScore) ||
      !Number.isFinite(r.bestFitness) ||
      !Number.isFinite(r.totalTicksEvaluated)
    ) {
      badNums += 1;
    }
    if (
      r.stoppedReason !== 'SKIPPED' &&
      r.seedScores.length < r.verificationSeeds
    ) {
      badAuditSeeds += 1;
    }
    if (r.verifiedPerfect && r.minSeedScore < r.targetPipeCap) {
      badPerfectConsistency += 1;
    }
  }

  checks.push({
    label: 'Numerical health (zero NaN/Inf)',
    passed: badNums === 0,
    detail: badNums === 0 ? 'All scores & ticks finite' : `${badNums} corrupted rows`,
  });

  checks.push({
    label: 'Untruncated multi-seed final audits',
    passed: badAuditSeeds === 0 && badPerfectConsistency === 0,
    detail:
      badAuditSeeds === 0 && badPerfectConsistency === 0
        ? `All ${results.length} trials audited across full ${config.verificationSeeds} seeds`
        : `${badAuditSeeds} incomplete seed arrays · ${badPerfectConsistency} perfect mismatches`,
  });

  const expectedDiffs = config.difficulties.length;
  checks.push({
    label: 'Scenario coverage',
    passed: seenDiffs.size >= expectedDiffs,
    detail: `${seenDiffs.size}/${expectedDiffs} scenarios verified`,
  });

  const expectedArchs =
    config.evolutionTopologyMode === 'ISLAND_SPECIATION'
      ? 1
      : (
          config.architectures && config.architectures.length > 0
            ? config.architectures
            : ['MLP']
        ).length;
  checks.push({
    label: 'Architecture coverage',
    passed: seenArchs.size >= expectedArchs,
    detail:
      config.evolutionTopologyMode === 'ISLAND_SPECIATION'
        ? `${seenArchs.size} unified 5-species island runner(s) verified`
        : `${seenArchs.size}/${expectedArchs} architectures verified`,
  });

  const expectedPrecs = (
    config.weightPrecisions && config.weightPrecisions.length > 0
      ? config.weightPrecisions
      : ['FP32']
  ).length;
  checks.push({
    label: 'Bit-precision coverage',
    passed: seenPrecs.size >= expectedPrecs,
    detail: `${seenPrecs.size}/${expectedPrecs} precisions verified`,
  });

  const expectedAlgos = config.algorithms.length;
  checks.push({
    label: 'Optimizer coverage',
    passed: seenAlgos.size >= expectedAlgos,
    detail: `${seenAlgos.size}/${expectedAlgos} optimizers verified`,
  });

  return {
    allPassed: checks.every((c) => c.passed),
    checks,
  };
}

/**
 * Builds a structured LLM-ready Multi-Run Meta-Analysis Dossier from a set of saved runs.
 */
export function buildMetaAnalysisBundle(
  records: ExperimentRunRecord[],
  mode: 'BOTH' | 'PERF_ONLY' | 'REPORTS_ONLY'
): string {
  const ordered = [...records].sort((a, b) =>
    a.completedAt.localeCompare(b.completedAt)
  );
  const lines: string[] = [
    `# Flappy NeuroLab — Multi-Run Meta-Analysis Bundle (${ordered.length} runs)`,
    `- **Generated**: ${new Date().toISOString()} · **Mode**: ${mode}`,
    '',
    `## Cross-Run Comparative Matrix`,
    `| # | Run Name | Completed | Status | Priority | Backend | Dur (s) | Trials | Perf % (G1) | Best Score | M ticks/s | M/s/Core | Est Perf/W | Thermal Drift | Lag p95/Max | Integrity |`,
    `| :-: | :--- | :--- | :---: | :---: | :---: | ---: | ---: | :---: | ---: | ---: | ---: | ---: | :---: | :---: | :---: |`,
  ];

  ordered.forEach((rec, idx) => {
    const pm = rec.perfMetrics;
    const drift =
      pm && pm.thermalDriftPct !== null
        ? `${pm.thermalDriftPct >= 0 ? '+' : ''}${pm.thermalDriftPct.toFixed(1)}%`
        : pm?.thermalStatus ?? '—';
    const lag = pm
      ? `${pm.p95LoopLagMs.toFixed(1)}/${pm.maxLoopLagMs.toFixed(0)}ms`
      : '—';
    const integ = rec.integrity
      ? rec.integrity.allPassed
        ? 'PASS'
        : 'WARN'
      : '—';
    lines.push(
      `| ${idx + 1} | ${rec.name} | ${rec.completedAt.slice(0, 19).replace('T', ' ')} | ${rec.status} | ${pm ? `${pm.priorityLevel}%` : `${rec.config.performancePriority ?? 70}%`} | ${pm?.backendLabel ?? rec.config.computeBackend ?? 'AUTO'} | ${rec.durationSec.toFixed(1)} | ${rec.summary.totalTrials} | ${rec.summary.perfectRatePct.toFixed(1)}% (${rec.summary.g1Perfect}) | ${rec.summary.bestMinSeedScore} | ${pm ? pm.ticksMPerSec.toFixed(1) : '—'} | ${pm ? pm.ticksPerActiveCore.toFixed(2) : '—'} | ${pm ? pm.estPerfPerWatt.toFixed(1) : '—'} | ${drift} | ${lag} | ${integ} |`
    );
  });

  lines.push('');

  ordered.forEach((rec, idx) => {
    lines.push(
      `---`,
      `## Run ${idx + 1}/${ordered.length}: ${rec.name} (${rec.status} · ${rec.durationSec.toFixed(1)}s)`,
      `- **Run ID**: \`${rec.id}\` · **Completed**: ${rec.completedAt}${rec.hypothesisTag ? ` · **Hypothesis**: ${rec.hypothesisTag}` : ''}`,
      `- **Exact Configuration**: ${formatConfigSummary(rec.config, rec.perfMetrics?.hardwareCores ?? 8)}`
    );
    if (rec.integrity) {
      const failed = rec.integrity.checks.filter((c) => !c.passed);
      lines.push(
        `- **Integrity Audit**: ${rec.integrity.allPassed ? 'ALL PASSED' : `${failed.length} WARNING(S)`} (${rec.integrity.checks.map((c) => `${c.passed ? '✓' : '✗'} ${c.label}: ${c.detail}`).join(' · ')})`
      );
    }
    if (mode === 'BOTH' || mode === 'PERF_ONLY') {
      lines.push('', rec.perfLogMarkdown || '*(No perf trace recorded)*');
    }
    if (mode === 'BOTH' || mode === 'REPORTS_ONLY') {
      lines.push('', rec.scientificReportMarkdown || '*(No scientific digest recorded)*');
    }
    lines.push('');
  });

  const synthesized = synthesizeKnowledgeFromRuns(ordered);
  const allKnowledge = [...synthesized, ...BUILTIN_KNOWLEDGE_ENTRIES];
  lines.push('---', '', formatKnowledgeLogMarkdown(allKnowledge), '');

  return lines.join('\n');
}
