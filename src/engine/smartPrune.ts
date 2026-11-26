/**
 * Smart Prune Engine & Empirical Knowledge Registry
 *
 * Identifies mathematically redundant / physically no-op trial combinations so
 * sweeps don't waste compute on identical duplicate runs, while persisting a
 * structured Knowledge Log of verified rules and auto-synthesized run findings.
 */

import { calculateParameterCount, normalizeHiddenLayers } from './neuralNetwork';
import {
  CLASSIC_5_SENSOR_FEATURES,
  formatInputSubsetKey,
  normalizeInputFeatures,
} from './sensors';
import { resolveEnvironment } from './simulation';
import type {
  DifficultyPreset,
  ExperimentRunRecord,
  KnowledgeEntry,
  LearningAlgorithm,
  MorphogenesisMode,
  NetworkArchitecture,
  PerceptionMode,
  ResearchSweepConfig,
  SensorFeatureId,
  SmartPruneBreakdown,
} from './types';

export function resolveAlgorithmsForArchitecture(
  config: ResearchSweepConfig,
  arch: NetworkArchitecture
): LearningAlgorithm[] {
  const override = config.algorithmsByArchitecture?.[arch];
  if (override && override.length > 0) {
    return Array.from(new Set(override));
  }
  return Array.from(new Set(config.algorithms));
}

export function getAllActiveAlgorithms(
  config: ResearchSweepConfig
): LearningAlgorithm[] {
  const archs: NetworkArchitecture[] =
    config.architectures && config.architectures.length > 0
      ? Array.from(new Set(config.architectures))
      : ['MLP'];
  const seen = new Set<LearningAlgorithm>();
  const out: LearningAlgorithm[] = [];
  for (let a = 0; a < archs.length; a++) {
    const algos = resolveAlgorithmsForArchitecture(config, archs[a]);
    for (let i = 0; i < algos.length; i++) {
      if (!seen.has(algos[i])) {
        seen.add(algos[i]);
        out.push(algos[i]);
      }
    }
  }
  return out.length > 0 ? out : Array.from(new Set(config.algorithms));
}

export function resolveTopologiesForArchitecture(
  config: ResearchSweepConfig,
  arch: NetworkArchitecture
): number[][] {
  const raw = config.topologiesByArchitecture?.[arch];
  const src = raw && raw.length > 0 ? raw : config.topologies;
  const unique: number[][] = [];
  const seen = new Set<string>();
  for (let i = 0; i < src.length; i++) {
    const clean = normalizeHiddenLayers(src[i]);
    const key = clean.join('x');
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(clean);
  }
  return unique;
}

export function getAllActiveTopologies(config: ResearchSweepConfig): number[][] {
  const archs: NetworkArchitecture[] =
    config.architectures && config.architectures.length > 0
      ? Array.from(new Set(config.architectures))
      : ['MLP'];
  const seen = new Set<string>();
  const out: number[][] = [];
  for (let a = 0; a < archs.length; a++) {
    const topos = resolveTopologiesForArchitecture(config, archs[a]);
    for (let i = 0; i < topos.length; i++) {
      const key = topos[i].join('x');
      if (!seen.has(key)) {
        seen.add(key);
        out.push(topos[i]);
      }
    }
  }
  if (out.length > 0) return out;
  return resolveTopologiesForArchitecture(config, 'MLP');
}

export function resolveMorphModeEnumForArchitecture(
  config: ResearchSweepConfig,
  arch: NetworkArchitecture
): MorphogenesisMode {
  if (config.evolutionTopologyMode === 'ISLAND_SPECIATION') {
    return 'STATIC';
  }
  return (
    config.morphogenesisByArchitecture?.[arch] ??
    config.morphogenesisMode ??
    'STATIC'
  );
}

export function resolveMorphModesForArchitecture(
  config: ResearchSweepConfig,
  arch: NetworkArchitecture
): Array<'STATIC' | 'GROWING'> {
  const mode = resolveMorphModeEnumForArchitecture(config, arch);
  if (mode === 'PAIRED_AB') return ['STATIC', 'GROWING'];
  if (mode === 'GROWING') return ['GROWING'];
  return ['STATIC'];
}

export function resolveReasoningStepsForArchitecture(
  config: ResearchSweepConfig,
  arch: NetworkArchitecture
): number[] {
  if (arch !== 'LOOPED_REASONER' && arch !== 'PONDER_ACT') {
    return [3];
  }
  if (config.reasoningStepsList && config.reasoningStepsList.length > 0) {
    return Array.from(new Set(config.reasoningStepsList)).sort((a, b) => a - b);
  }
  return [config.reasoningSteps ?? 3];
}

export function resolvePerceptionModesForArchitecture(
  config: ResearchSweepConfig,
  arch: NetworkArchitecture
): PerceptionMode[] {
  if (arch !== 'DROSOPHILA_CONNECTOME' && arch !== 'DECOUPLED_FLY_CORTEX') {
    return ['GEOMETRIC_LAB'];
  }
  if (config.perceptionModes && config.perceptionModes.length > 0) {
    return Array.from(new Set(config.perceptionModes));
  }
  return [config.perceptionMode ?? 'GEOMETRIC_LAB'];
}

export function resolveCurriculumOptions(
  config: ResearchSweepConfig
): boolean[] {
  if (config.curriculumOptions && config.curriculumOptions.length > 0) {
    return Array.from(new Set(config.curriculumOptions));
  }
  return [Boolean(config.curriculumLearning)];
}

export function resolveShapedFitnessOptions(
  config: ResearchSweepConfig
): boolean[] {
  if (config.shapedFitnessOptions && config.shapedFitnessOptions.length > 0) {
    return Array.from(new Set(config.shapedFitnessOptions));
  }
  return [Boolean(config.shapedFitness)];
}

/**
 * Only GA, DE (crossover cr), and ADAPTIVE_ES actually read `mutationRate`
 * during evolution. NATURAL_ES, ADAM_ES, CEM, PSO, and CMA_HYBRID ignore it completely.
 */
export const MUTATION_RATE_ACTIVE_ALGORITHMS = new Set<LearningAlgorithm>([
  'GA',
  'DE',
  'ADAPTIVE_ES',
]);

export function algorithmUsesMutationRate(algo: LearningAlgorithm): boolean {
  return MUTATION_RATE_ACTIVE_ALGORITHMS.has(algo);
}

export function isStaticPipeDifficulty(
  difficulty: DifficultyPreset,
  customEnv?: ResearchSweepConfig['customEnvironment']
): boolean {
  const env = resolveEnvironment(difficulty, customEnv);
  return !env.movingPipes;
}

export function isBlindSensorSubset(features: readonly SensorFeatureId[]): boolean {
  return !features.includes('TOP_CLEAR') && !features.includes('BOT_CLEAR');
}

export interface SmartPruneContext {
  enabled: boolean;
  hasMlp: boolean;
  canonicalMutationRate: number;
  inputKeySet: Set<string>;
  hasNonBlindInputSet: boolean;
  staticDifficulties: Set<DifficultyPreset>;
}

export function createSmartPruneContext(
  config: ResearchSweepConfig
): SmartPruneContext {
  const enabled = config.smartPrune !== false;
  const archs =
    config.architectures && config.architectures.length > 0
      ? config.architectures
      : (['MLP'] as NetworkArchitecture[]);
  const hasMlp = archs.includes('MLP');
  const canonicalMutationRate =
    config.mutationRates.length > 0 ? config.mutationRates[0] : 0.16;

  const rawInputSets =
    config.inputFeatureSets && config.inputFeatureSets.length > 0
      ? config.inputFeatureSets
      : [[...CLASSIC_5_SENSOR_FEATURES]];
  const inputKeySet = new Set<string>();
  let hasNonBlindInputSet = false;
  for (let i = 0; i < rawInputSets.length; i++) {
    const clean = normalizeInputFeatures(rawInputSets[i]);
    inputKeySet.add(formatInputSubsetKey(clean));
    if (!isBlindSensorSubset(clean)) {
      hasNonBlindInputSet = true;
    }
  }

  const staticDifficulties = new Set<DifficultyPreset>();
  for (const diff of config.difficulties) {
    if (isStaticPipeDifficulty(diff, config.customEnvironment)) {
      staticDifficulties.add(diff);
    }
  }

  return {
    enabled,
    hasMlp,
    canonicalMutationRate,
    inputKeySet,
    hasNonBlindInputSet,
    staticDifficulties,
  };
}

export type PruneReason =
  | null
  | 'SKIP_ON_DEPTH0'
  | 'UNUSED_MUTATION_RATE'
  | 'STATIC_PIPE_VY'
  | 'BLIND_NO_CLEARANCE';

/**
 * Pure O(1) predicate determining whether a specific trial tuple is scientifically
 * redundant under the active Smart Prune context.
 */
export function getTrialPruneReason(
  ctx: SmartPruneContext,
  params: {
    algorithm: LearningAlgorithm;
    difficulty: DifficultyPreset;
    architecture: NetworkArchitecture;
    topology: readonly number[];
    inputFeatures: readonly SensorFeatureId[];
    mutationRate: number;
  }
): PruneReason {
  if (!ctx.enabled) return null;

  // Rule 1: RESIDUAL_SKIP on Depth-0 ([]) has 0 extra params — mathematically identical to MLP
  if (
    params.architecture === 'RESIDUAL_SKIP' &&
    params.topology.length === 0 &&
    ctx.hasMlp
  ) {
    return 'SKIP_ON_DEPTH0';
  }

  // Rule 2: Blind sensor subsets (no TOP_CLEAR & no BOT_CLEAR) cannot see the pipe gap
  if (ctx.hasNonBlindInputSet && isBlindSensorSubset(params.inputFeatures)) {
    return 'BLIND_NO_CLEARANCE';
  }

  // Rule 3: PIPE_VY / NEXT_PIPE_VY are identically 0.0 on static-pipe scenarios when the non-PVy subset is already in the sweep
  if (
    ctx.staticDifficulties.has(params.difficulty) &&
    (params.inputFeatures.includes('PIPE_VY') ||
      params.inputFeatures.includes('NEXT_PIPE_VY')) &&
    params.inputFeatures.length > 1
  ) {
    const withoutPvy = params.inputFeatures.filter(
      (f) => f !== 'PIPE_VY' && f !== 'NEXT_PIPE_VY'
    );
    if (withoutPvy.length > 0) {
      const withoutKey = formatInputSubsetKey(withoutPvy);
      if (ctx.inputKeySet.has(withoutKey)) {
        return 'STATIC_PIPE_VY';
      }
    }
  }

  // Rule 4: Non-rate optimizers (ES/CEM/PSO/CMA) ignore mutationRate completely
  if (
    !algorithmUsesMutationRate(params.algorithm) &&
    params.mutationRate !== ctx.canonicalMutationRate
  ) {
    return 'UNUSED_MUTATION_RATE';
  }

  return null;
}

export interface SmartPruneSummary {
  rawPlannedTrials: number;
  activeTrials: number;
  prunedTotal: number;
  breakdown: SmartPruneBreakdown;
}

/**
 * Computes exact raw vs pruned trial counts for any ResearchSweepConfig in O(shapes * pairs * hypers)
 * without allocating trial objects. Matches ResearchPool's exact queue filtering 1:1.
 */
export function analyzeSmartPrune(
  config: ResearchSweepConfig
): SmartPruneSummary {
  const ctx = createSmartPruneContext(config);
  const difficulties = Array.from(new Set(config.difficulties));
  const rawArchitectures: NetworkArchitecture[] = Array.from(
    new Set(
      config.architectures && config.architectures.length > 0
        ? config.architectures
        : (['MLP'] as NetworkArchitecture[])
    )
  );
  const architectures: NetworkArchitecture[] =
    config.evolutionTopologyMode === 'ISLAND_SPECIATION'
      ? [
          rawArchitectures.includes('HYBRID_MOE')
            ? 'HYBRID_MOE'
            : rawArchitectures[0],
        ]
      : rawArchitectures;
  const weightPrecisions = Array.from(
    new Set(
      config.weightPrecisions && config.weightPrecisions.length > 0
        ? config.weightPrecisions
        : ['FP32']
    )
  );
  const populationSizes = Array.from(new Set(config.populationSizes));
  const mutationRates = Array.from(new Set(config.mutationRates));
  const mutationStrengths = Array.from(new Set(config.mutationStrengths));
  const currOpts = resolveCurriculumOptions(config);
  const shapeOpts = resolveShapedFitnessOptions(config);
  const maxParams =
    config.maxParameters !== undefined ? config.maxParameters : null;

  const rawInputSets =
    config.inputFeatureSets && config.inputFeatureSets.length > 0
      ? config.inputFeatureSets
      : [[...CLASSIC_5_SENSOR_FEATURES]];
  const uniqueInputs: SensorFeatureId[][] = [];
  const seenIn = new Set<string>();
  for (const s of rawInputSets) {
    const clean = normalizeInputFeatures(s);
    const key = formatInputSubsetKey(clean);
    if (seenIn.has(key)) continue;
    seenIn.add(key);
    uniqueInputs.push(clean);
  }

  // Factorized exact count (fast even for 100k+ topology x input combinations)
  const sharedHyperBase =
    weightPrecisions.length *
    populationSizes.length *
    mutationStrengths.length *
    currOpts.length *
    shapeOpts.length;
  const totalRateCount = mutationRates.length;

  let rawPlannedTrials = 0;
  let activeTrials = 0;
  let skipOnDepth0 = 0;
  let unusedMutationRate = 0;
  let staticPipeVy = 0;
  let blindNoClearance = 0;

  // Pre-count static vs moving difficulties
  let staticDiffCount = 0;
  let movingDiffCount = 0;
  for (const diff of difficulties) {
    if (ctx.staticDifficulties.has(diff)) staticDiffCount += 1;
    else movingDiffCount += 1;
  }

  const totalDiffCount = difficulties.length;

  for (let a = 0; a < architectures.length; a++) {
    const arch = architectures[a];
    const archAlgos = resolveAlgorithmsForArchitecture(config, arch);
    const archTopos = resolveTopologiesForArchitecture(config, arch);
    const archMorphCount = resolveMorphModesForArchitecture(config, arch).length;
    const archKCount = resolveReasoningStepsForArchitecture(config, arch).length;
    const archPercCount = resolvePerceptionModesForArchitecture(config, arch).length;
    const archHyperBase =
      sharedHyperBase * archMorphCount * archKCount * archPercCount;

    let rateActiveAlgoCount = 0;
    let rateIgnoredAlgoCount = 0;
    for (const algo of archAlgos) {
      if (algorithmUsesMutationRate(algo)) rateActiveAlgoCount += 1;
      else rateIgnoredAlgoCount += 1;
    }
    const totalAlgoCount = archAlgos.length;

    for (let ii = 0; ii < uniqueInputs.length; ii++) {
      const inp = uniqueInputs[ii];
      const inCount = inp.length;
      const isBlind = ctx.enabled && ctx.hasNonBlindInputSet && isBlindSensorSubset(inp);
      const withoutStaticPvy = inp.filter(
        (f) => f !== 'PIPE_VY' && f !== 'NEXT_PIPE_VY'
      );
      const isRedundantPvyOnStatic =
        ctx.enabled &&
        (inp.includes('PIPE_VY') || inp.includes('NEXT_PIPE_VY')) &&
        withoutStaticPvy.length > 0 &&
        ctx.inputKeySet.has(formatInputSubsetKey(withoutStaticPvy));

      for (let t = 0; t < archTopos.length; t++) {
        const topo = archTopos[t];
        if (maxParams !== null) {
          const p = calculateParameterCount(topo, inCount, 1, arch);
          if (p > maxParams) continue;
        }

        const shapeTotal =
          totalAlgoCount * totalDiffCount * archHyperBase * totalRateCount;
        rawPlannedTrials += shapeTotal;

        if (!ctx.enabled) {
          activeTrials += shapeTotal;
          continue;
        }

        if (arch === 'RESIDUAL_SKIP' && topo.length === 0 && ctx.hasMlp) {
          skipOnDepth0 += shapeTotal;
          continue;
        }

        if (isBlind) {
          blindNoClearance += shapeTotal;
          continue;
        }

        const keptDiffs = isRedundantPvyOnStatic
          ? movingDiffCount
          : totalDiffCount;
        if (isRedundantPvyOnStatic && staticDiffCount > 0) {
          staticPipeVy +=
            totalAlgoCount * staticDiffCount * archHyperBase * totalRateCount;
        }

        if (keptDiffs === 0) continue;

        const keptAlgoRates =
          rateActiveAlgoCount * totalRateCount +
          rateIgnoredAlgoCount * Math.min(1, totalRateCount);
        const prunedRateDupes =
          rateIgnoredAlgoCount * Math.max(0, totalRateCount - 1);

        activeTrials += keptDiffs * archHyperBase * keptAlgoRates;
        unusedMutationRate += keptDiffs * archHyperBase * prunedRateDupes;
      }
    }
  }

  const prunedTotal =
    skipOnDepth0 + unusedMutationRate + staticPipeVy + blindNoClearance;

  return {
    rawPlannedTrials,
    activeTrials,
    prunedTotal,
    breakdown: {
      skipOnDepth0,
      unusedMutationRate,
      staticPipeVy,
      blindNoClearance,
    },
  };
}

/**
 * Verified built-in Knowledge Base documenting scientifically proven no-op
 * rules and empirical findings from prior NeuroLab sweeps.
 */
export const BUILTIN_KNOWLEDGE_ENTRIES: KnowledgeEntry[] = [
  {
    id: 'rule_skip_d0',
    category: 'PRUNE_RULE',
    status: 'VERIFIED',
    title: 'RESIDUAL_SKIP na Depth 0 ([]) jest w 100% równoważny MLP',
    summary:
      'Sieć liniowa bez warstw ukrytych (D0) ma 0 parametrów połączenia skrótowego — RESIDUAL_SKIP wykonuje dokładnie tę samą operację co MLP.',
    evidence:
      'calculateArchitectureExtraParams([], in, "RESIDUAL_SKIP") === 0. Smart Prune pomija duplikat D0, gdy wybrano MLP i RESIDUAL_SKIP.',
    impact: 'Eliminuje 100% zdublowanych prób Depth-0 bez żadnej utraty informacji.',
    source: 'BUILTIN',
    createdAt: '2026-11-20T00:00:00.000Z',
  },
  {
    id: 'rule_unused_mutation_rate',
    category: 'PRUNE_RULE',
    status: 'VERIFIED',
    title: 'Parametr mutationRate jest ignorowany przez ES, CEM, PSO i CMA-Hybrid',
    summary:
      'Jedynie GA, DE (crossover CR) i Adaptive ES wykorzystują mutationRate. Pozostałe 5 optymalizatorów korzysta wyłącznie z mutationStrength (sigma).',
    evidence:
      'Audyt pętli ewolucji: NATURAL_ES, ADAM_ES, CEM, PSO i CMA_HYBRID dają identyczne wyniki dla dowolnej wartości mutationRate.',
    impact: 'Zamiast N powtórzeń uruchamiana jest 1 kanoniczna próba na optymalizator.',
    source: 'BUILTIN',
    createdAt: '2026-11-20T00:00:00.000Z',
  },
  {
    id: 'rule_static_pipe_vy',
    category: 'PRUNE_RULE',
    status: 'VERIFIED',
    title: 'Sensory PIPE_VY i NEXT_PIPE_VY wynoszą 0.0 na scenariuszach statycznych (Easy / Medium)',
    summary:
      'Na Easy i Medium (oraz statycznych trybach legacy) rury nie poruszają się pionowo — wejścia PVy/N2PVy to martwe zera.',
    evidence:
      'movingPipes === false => pVy[idx] = 0 w każdej klatce. Dodanie PVy jedynie zwiększa wymiar przestrzeni wag o bezużyteczne parametry.',
    impact: 'Gdy w planie jest odpowiednik bez PVy/N2PVy, wariant z martwym sensorem jest pomijany.',
    source: 'BUILTIN',
    createdAt: '2026-11-20T00:00:00.000Z',
  },
  {
    id: 'rule_blind_subsets',
    category: 'PRUNE_RULE',
    status: 'VERIFIED',
    title: 'Ślepe podzbiory bez TOP_CLEAR i BOT_CLEAR nie widzą prześwitu rury',
    summary:
      '15 z 63 kombinacji sensorów nie zawiera żadnej informacji o wysokości luki, przez co sieć osiąga 0–2 rury niezależnie od topologii.',
    evidence:
      'Mechanistic Policy Summary (n=3266): 76,5% wrażliwości decyzji pochodzi z BOT_CLEAR (58,3%) i TOP_CLEAR (18,2%).',
    impact: 'Oszczędza ~24% mocy w pełnej kombinatoryce sensorów (można wyłączyć do testów kontrolnych).',
    source: 'BUILTIN',
    createdAt: '2026-11-20T00:00:00.000Z',
  },
  {
    id: 'finding_regime_split',
    category: 'EMPIRICAL',
    status: 'VERIFIED',
    title: 'Podział 7 rozwiązanych vs 4 scenariusze Frontier (13,7% vs 86,3% obliczeń)',
    summary:
      '7/11 scenariuszy osiąga 98,8% perfekcji (nawet 1→1 z 2 parametrami w 1,8 norm-ms), podczas gdy 4 scenariusze Frontier pochłaniają 86,3% mocy CPU.',
    evidence:
      'Seria 5 192 prób (1000 rur × 5 seedów): Solved Regime 3266/3304 (98,8%), Frontier (Moving+Gaps, Insane, Gust Chaos, Extreme Turb.) 0/1888.',
    impact: 'Nowe badania architektur i sensorów należy koncentrować na 4 scenariuszach Frontier.',
    source: 'BUILTIN',
    createdAt: '2026-11-20T00:00:00.000Z',
  },
  {
    id: 'finding_multiseed_vs_gens',
    category: 'EMPIRICAL',
    status: 'VERIFIED',
    title: 'Trening K=1 seed/gen bije K=3 seedy/gen przy równym budżecie epizodów',
    summary:
      'Więcej generacji na pojedynczym losowym torze daje drastycznie lepszą generalizację na Frontier niż mniej generacji uśrednianych po 3 seedach.',
    evidence:
      'Autonomiczny test Frontier (30k epizodów): Moving+Gaps 67,6p (K=1) vs 23,9p (K=3); Insane 68,8p (K=1) vs 2,1p (K=3).',
    impact: 'Utrzymywać K=1 w pętli treningu i inwestować budżet w większą liczbę generacji.',
    source: 'BUILTIN',
    createdAt: '2026-11-20T00:00:00.000Z',
  },
  {
    id: 'finding_iso_neuron_bottleneck',
    category: 'EMPIRICAL',
    status: 'VERIFIED',
    title: 'Głębokie wąskie gardła (bottleneck) przewyższają płaskie warstwy na Insane',
    summary:
      'Przy stałej liczbie 6 neuronów ukrytych, wąskie gardła 4→1→4→1→1 (20p) i 4→2→4→1 (27p) znacząco wyprzedzają płaskie 4→6→1 (37p).',
    evidence:
      'Mniejsza liczba parametrów zwiększa stosunek sygnału do szumu w ewolucji bezgradientowej (GA/DE/PSO).',
    impact: 'Generator All Shapes (≤Nn, D1–D4) pozwala systematycznie eksplorować wąskie gardła.',
    source: 'BUILTIN',
    createdAt: '2026-11-20T00:00:00.000Z',
  },
  {
    id: 'finding_int4_efficiency',
    category: 'EMPIRICAL',
    status: 'VERIFIED',
    title: 'Kwantyzacja INT4 zachowuje ~98,4% perfekcji FP32 przy 8× mniejszej pamięci',
    summary:
      'Wagi 4-bitowe tracą zaledwie ~1 pkt proc. perfekcji względem FP32, osiągając gęstość do 125 rur/bit.',
    evidence:
      'Testy porównawcze FP32 (63,4%) vs INT4 (62,4%) na pełnym zestawie architektur.',
    impact: 'INT4 jest optymalnym punktem kompresji do testów Frontier i wdrożeń minimalnych.',
    source: 'BUILTIN',
    createdAt: '2026-11-20T00:00:00.000Z',
  },
  {
    id: 'finding_lookahead_n2y_frontier',
    category: 'FRONTIER',
    status: 'VERIFIED',
    title: '7. sensor Lookahead (NEXT_PIPE_DY) przy krótkim budżecie (40g) osłabia Frontier przez wzrost wymiaru',
    summary:
      'Dodanie N2Y jako 6. wejścia w krótkim treningu (DE 150×40g) obniżyło wyniki na Moving+Gaps (36,5p→14,0p) i Insane (14,8p→1,8p), dając jedynie lekką przewagę max-seed w Extreme Turb. (1p→3p).',
    evidence:
      'Autonomiczny eksperyment A/B (Residual Skip [4,4], DE 150×40g, 5 seedów audytu): Baseline 5-in vs +N2Y 6-in na 3 scenariuszach Frontier.',
    impact:
      'Traktować N2Y jako opcjonalny sensor do dłuższych przebiegów (≥120g) lub w konfiguracji 5-in bez VEL_VY (DX·Top·Bot·PVy·N2Y).',
    source: 'BUILTIN',
    createdAt: '2026-11-22T00:00:00.000Z',
  },
  {
    id: 'finding_curriculum_vs_shaped_frontier',
    category: 'FRONTIER',
    status: 'VERIFIED',
    title: 'Shaped Survival Fitness wzmacnia Extreme Turb. (6× Avg Min) i Insane (22→26p); Curriculum szkodzi przy krótkim budżecie (40g)',
    summary:
      'Gęste kształtowanie fitnessu (centrowanie w luce + margines + niski jerk) poprawiło Turbulence Extreme z 0,3p→1,8p Avg Min (4× Best Min: 1→4p, 2× Avg Mean: 3,3→6,5p) oraz Insane Best Min z 22→26p bez narzutu czasu. Curriculum Annealing pomogło tylko w Extreme Turb. (0,3→1,3p), ale obniżyło Moving+Gaps (25,3→14,3p) i Insane (7,5→2,0p), bo 18/40 generacji na łatwej fizyce zabiera czas adaptacji do fizyki docelowej.',
    evidence:
      'Autonomiczny eksperyment A/B 4×3 (Residual Skip [4,4], 6-in +N2Y, DE 150×40g, 4 próby × 5-seedowy audyt 100% fizyki docelowej): Baseline vs Curriculum vs Shaped vs Both.',
    impact:
      'Używać Shaped Fitness (opt-in) na Insane / Turbulence Extreme; Curriculum Annealing włączać wyłącznie przy dłuższych budżetach (≥120g) lub skrajnie rzadkiej nagrodzie.',
    source: 'BUILTIN',
    createdAt: '2026-11-22T00:00:00.000Z',
  },
  {
    id: 'finding_ttc_extrapolation_cliff',
    category: 'FRONTIER',
    status: 'VERIFIED',
    title: 'Zero-Shot Test-Time Compute (Looped K=2 → K=4) zwiększa wynik 4,2× na Insane przed klifem prze-myślenia (K=6)',
    summary:
      'Sieć Looped Reasoner [4] (45p) wytrenowana wyłącznie z K=2 krokami myślenia (Mean 7,6p) po zero-shot zwiększeniu K w czasie testu osiągnęła 10,8p (K=3) oraz 32,0p (K=4, 4,2× wzrost bez zmiany ani jednej wagi!), po czym spadła do 14,6p przy K=6 (klasyczny efekt overthinking / przeregulowania punktu stałego jak w LLM CoT).',
    evidence:
      'Autonomiczny eksperyment EXP 1 (Looped Reasoner [4], 6-in +N2Y, Insane, 5 seedów): K_test=1: 5,4p | K=2: 7,6p | K=3: 10,8p | K=4: 32,0p [3,46,44,37,30] | K=6: 14,6p.',
    impact:
      'Pozwala trenować tanio na małym K=2 i skalować budżet wnioskowania (K=3–4) zero-shot podczas trudnych audytów.',
    source: 'BUILTIN',
    createdAt: '2026-11-22T23:35:00.000Z',
  },
  {
    id: 'finding_reasoning_archs_ood_gate',
    category: 'FRONTIER',
    status: 'VERIFIED',
    title: 'Selective SSM adaptuje bramkę pamięci do entropii fizyki (z_t: 0,42→0,66), a Latent Rollout wygrywa Moving+Gaps i OOD Gust Chaos',
    summary:
      'MinGRU/Selective SSM spontanicznie zwiększa bramkę nadpisywania z_t wraz z chaosem środowiska (Moving+Gaps 0,421 → Insane 0,631 → Extreme Turb. 0,658) i prowadzi wśród architektur rozumowania na Insane. Latent Rollout osiągnął #1 Best Min na Moving+Gaps (28p vs MLP 25p), perfekcyjny transfer 300/300 na Heavy Gravity i #1 zero-shot transfer na Gust Chaos (44,4p vs MLP 19,6p). Ponder ACT na Insane wykazał emergentny System 1/2 (Calm 2,56 vs Danger 2,75 kroku).',
    evidence:
      'Autonomiczny eksperyment EXP 2 + EXP 3 (6 architektur [4], 6-in +N2Y, Shaped, 3×35g, 5-seed audit + zero-shot OOD z Moving+Gaps).',
    impact:
      'Dobierać architekturę do reżimu: Latent Rollout do deterministycznej/okresowej fizyki i OOD, Selective SSM do szybkich chaotycznych zakłóceń.',
    source: 'BUILTIN',
    createdAt: '2026-11-22T23:35:00.000Z',
  },
  {
    id: 'finding_self_consistency_voting',
    category: 'FRONTIER',
    status: 'VERIFIED',
    title: 'Głosowanie większościowe (Self-Consistency 5× [4] Skip) miażdży pojedynczy duży model [8,4] na Insane (86p vs 24,2p = 3,55×)',
    summary:
      '5 niezależnych małych sieci [4] Skip (39p każda, średni wynik pojedynczej 11,8p) połączonych głosowaniem większościowym (Self-Consistency) osiągnęło Mean 86,0p (Min 19p, seedy [19,121,143,60,87]) — 3,55× lepiej niż pojedyncza większa sieć [8,4] (103p, Mean 24,2p, Min 2p) i 7,3× lepiej niż pojedyncza mała sieć. Nawet 3× [4] (117p) daje 46,6p (~2× lepiej przy niemal równej liczbie wag).',
    evidence:
      'Autonomiczny eksperyment EXP 4 (Insane, 5-seed audit): 5× indywidualne [4] avg 11,8p | 1× [8,4] (103p) 24,2p | Vote 3×[4] 46,6p | Vote 5×[4] 86,0p.',
    impact:
      'Na chaotycznych scenariuszach Frontier ewolucja małych, niezależnych modeli + Self-Consistency Voting znosi nieskorelowane błędy pojedynczych polityk.',
    source: 'BUILTIN',
    createdAt: '2026-11-22T23:35:00.000Z',
  },
  {
    id: 'finding_cpu_lockstep_soa_speedup',
    category: 'PERFORMANCE',
    status: 'VERIFIED',
    title: 'Lockstep Shared Physics (3,46×) i Float32 SoA Batch Kernel (do 1,92×) radykalnie przyspieszają CPU bez utraty determinizmu F64 w audycie',
    summary:
      'Współdzielona fizyka toru rur obliczana raz na klatkę (evaluatePopulationLockstep) przyspieszyła ewaluację populacji MinGRU 6→4→1 na Moving+Gaps z 0,43M do 1,48M ticków/s (3,46×). Pakiet Float32 SoA w FlappySimulation przyspieszył MLP D1 do 1,92× (5,03M/s), Skip D2 o 1,27× i MLP D2 o 1,23×, zachowując w 100% bit-exact Float64 dla audytów i VS_AI.',
    evidence:
      'Micro-benchmark CPU (pop=150, MOVING_GAPS): Per-Bird 0,43M/s vs Lockstep Shared 1,48M/s (3,46×); Float32 SoA Skip D2 2,44→3,09M/s (1,27×), MLP D1 do 5,03M/s.',
    impact:
      'Pozwala trenować ciężkie architektury rekurencyjne (Looped, Ponder, MinGRU, Rollout) wielokrotnie szybciej na samym CPU.',
    source: 'BUILTIN',
    createdAt: '2026-11-22T23:35:00.000Z',
  },
];

/**
 * Automatically synthesizes new actionable knowledge entries from recorded
 * IndexedDB experiment runs (thermal drift, Perf/W champion, Frontier breakthroughs).
 */
export function synthesizeKnowledgeFromRuns(
  runs: readonly ExperimentRunRecord[]
): KnowledgeEntry[] {
  if (runs.length === 0) return [];
  const findings: KnowledgeEntry[] = [];

  // 1. Best Perf/Watt power setting across runs with perfMetrics
  const perfRuns = runs.filter((r) => r.perfMetrics && r.perfMetrics.wallSec >= 10);
  if (perfRuns.length >= 2) {
    const sortedByPpw = [...perfRuns].sort(
      (a, b) => (b.perfMetrics?.estPerfPerWatt ?? 0) - (a.perfMetrics?.estPerfPerWatt ?? 0)
    );
    const best = sortedByPpw[0];
    const worst = sortedByPpw[sortedByPpw.length - 1];
    if (
      best.perfMetrics &&
      worst.perfMetrics &&
      best.perfMetrics.estPerfPerWatt > worst.perfMetrics.estPerfPerWatt * 1.08
    ) {
      const gainPct = (
        ((best.perfMetrics.estPerfPerWatt - worst.perfMetrics.estPerfPerWatt) /
          Math.max(0.01, worst.perfMetrics.estPerfPerWatt)) *
        100
      ).toFixed(0);
      findings.push({
        id: `auto_ppw_${best.id}`,
        category: 'PERFORMANCE',
        status: 'AUTO_DISCOVERED',
        title: `Optimum Perf/Watt: ${best.perfMetrics.priorityLabel} (${best.perfMetrics.priorityLevel}%) daje +${gainPct}% wydajności/W`,
        summary: `Profil ${best.perfMetrics.priorityLabel} (${best.perfMetrics.trainWorkers} wątków) osiągnął ${best.perfMetrics.estPerfPerWatt.toFixed(1)} M/s/W przy ${best.perfMetrics.ticksMPerSec.toFixed(1)}M ticks/s vs ${worst.perfMetrics.estPerfPerWatt.toFixed(1)} M/s/W w trybie ${worst.perfMetrics.priorityLabel}.`,
        evidence: `Porównanie ${perfRuns.length} zapisanych serii (najlepsza: "${best.name}").`,
        impact: 'Ustaw suwak Perf/Watt w okolicach tego punktu do długich, chłodnych serii badawczych.',
        source: 'AUTO_RUN',
        createdAt: best.completedAt,
      });
    }
  }

  // 2. Detect severe thermal throttling runs
  const throttledRuns = perfRuns.filter(
    (r) => r.perfMetrics?.thermalStatus === 'THERMAL_THROTTLING'
  );
  if (throttledRuns.length > 0) {
    const latest = throttledRuns[0];
    const pm = latest.perfMetrics!;
    findings.push({
      id: `auto_thermal_${latest.id}`,
      category: 'PERFORMANCE',
      status: 'AUTO_DISCOVERED',
      title: `Wykryto throttling termiczny (${pm.thermalDriftPct?.toFixed(0)}%) w profilu ${pm.priorityLabel}`,
      summary: `Przepustowość spadła z ${pm.peakWindowMps.toFixed(1)}M/s na starcie do ${pm.lateWindowMps.toFixed(1)}M/s pod koniec przebiegu "${latest.name}".`,
      evidence: `${pm.trainWorkers} wątków na ${pm.hardwareCores} rdzeniach przez ${pm.wallSec.toFixed(0)}s.`,
      impact: 'Obniż suwak Perf/Watt do 45–60% (Sweet Spot), aby utrzymać stabilny zegar i wyższy Perf/W.',
      source: 'AUTO_RUN',
      createdAt: latest.completedAt,
    });
  }

  // 3. Frontier breakthrough detection (bestMinSeedScore >= 80 on hard/insane or legacy frontier runs)
  const frontierRuns = runs.filter(
    (r) =>
      r.config.difficulties.some((d) =>
        [
          'HARD',
          'INSANE',
          'MOVING_GAPS',
          'GUST_CHAOS',
          'TURBULENCE_EXTREME',
        ].includes(d)
      ) && r.summary.bestMinSeedScore >= 80
  );
  if (frontierRuns.length > 0) {
    const bestFrontier = [...frontierRuns].sort(
      (a, b) => b.summary.bestMinSeedScore - a.summary.bestMinSeedScore
    )[0];
    const usedLookahead = (bestFrontier.config.inputFeatureSets ?? []).some(
      (set) =>
        set.includes('NEXT_PIPE_DY') ||
        set.includes('NEXT_BOT_CLEAR') ||
        set.includes('NEXT_PIPE_DX') ||
        set.includes('PIPE_TTF')
    );
    findings.push({
      id: `auto_frontier_${bestFrontier.id}`,
      category: 'FRONTIER',
      status: 'AUTO_DISCOVERED',
      title: `Rekord Frontier: ${bestFrontier.summary.bestMinSeedScore} rur min-seed${usedLookahead ? ' (+Dual-Pipe Lookahead)' : ''}`,
      summary: `W przebiegu "${bestFrontier.name}" najlepsza konfiguracja (${bestFrontier.summary.bestTrialSummary}) osiągnęła ${bestFrontier.summary.bestMinSeedScore} rur na najgorszym z ${bestFrontier.config.verificationSeeds} niewidzianych seedów.`,
      evidence: `${bestFrontier.summary.totalTrials} prób, ${bestFrontier.summary.verifiedPerfect} perfekcyjnych (${bestFrontier.summary.perfectRatePct.toFixed(1)}%).`,
      impact: usedLookahead
        ? 'Sensory wyprzedzenia 2. rury (Pipe 2 / TTF) potwierdzają wysoką skuteczność na trudnych scenariuszach.'
        : 'Warto powtórzyć tę konfigurację z sensorami 2. rury (Dual Bot / Full-12) i dłuższym horyzontem generacji.',
      source: 'AUTO_RUN',
      createdAt: bestFrontier.completedAt,
    });
  }

  return findings;
}

export function formatKnowledgeLogMarkdown(
  entries: readonly KnowledgeEntry[]
): string {
  const lines = [
    `## Empirical Knowledge Log & Smart Prune Rules (${entries.length} entries)`,
    '',
  ];
  for (const e of entries) {
    lines.push(
      `- **[${e.category}/${e.status}] ${e.title}**: ${e.summary} _(Evidence: ${e.evidence} → Action: ${e.impact})_`
    );
  }
  return lines.join('\n');
}
