import {
  Archive,
  Check,
  ChevronDown,
  Cpu,
  Layers,
  Plus,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  ARCHITECTURE_CATALOG,
  TIER_1_ARCHITECTURES,
  TIER_2_LEGACY_ARCHITECTURES,
} from '../../engine/architectureCatalog';
import {
  getPresetById,
  RESEARCH_PRESETS,
  type PresetId,
} from '../../engine/experimentPresets';
import {
  ALL_ARCHITECTURES,
  ALL_WEIGHT_PRECISIONS,
  ARCHITECTURE_META,
  calculateParameterCount,
  calculateTopologyBreakdown,
  countTopologyCombinations,
  formatTopologyLabel,
  generateTopologyCombinations,
  isGpuBioTopologySupported,
  normalizeHiddenLayers,
  WEIGHT_PRECISION_META,
} from '../../engine/neuralNetwork';
import {
  resolveMorphogenesisConfig,
  MORPHOGENESIS_PROFILES,
} from '../../engine/morphogenesis';
import {
  CORE_OPTIMIZER_ALGORITHMS,
  EXTENDED_OPTIMIZER_ALGORITHMS,
  OPTIMIZER_ROLE_BADGES,
} from '../../engine/optimizers';
import { verifyScenarioSolvability } from '../../engine/physics';
import { ALGORITHM_SHORT_LABELS } from '../../engine/researchReport';
import {
  ALL_SENSOR_FEATURES,
  DEFAULT_MULTI_SENSOR_SUBSETS,
  formatInputSubsetKey,
  formatInputSubsetLabel,
  generateSensorCombinations,
  INPUT_SUBSET_PRESETS,
  normalizeInputFeatures,
  SENSOR_METADATA,
} from '../../engine/sensors';
import {
  ALL_DIFFICULTIES_ORDERED,
  DIFFICULTY_META,
  DIFFICULTY_SETTINGS,
  resolveEnvironment,
} from '../../engine/simulation';
import {
  algorithmUsesMutationRate,
  getAllActiveAlgorithms,
  resolveCurriculumOptions,
  resolveMorphModesForArchitecture,
  resolvePerceptionModesForArchitecture,
  resolveReasoningStepsForArchitecture,
  resolveShapedFitnessOptions,
  resolveTopologiesForArchitecture,
} from '../../engine/smartPrune';
import type {
  DifficultyPreset,
  EnvironmentConfig,
  EvolutionTopologyMode,
  LearningAlgorithm,
  MorphogenesisMode,
  NetworkArchitecture,
  PerceptionMode,
  ResearchSweepConfig,
  SensorFeatureId,
  WeightPrecision,
} from '../../engine/types';
import { useLanguage } from '../../i18n/LanguageContext';
import { InfoTooltip } from '../InfoTooltip';
import { LabUtilityModal } from './LabUtilityModal';
import { TopologyDiagram } from './TopologyDiagram';

const ALL_ALGORITHMS: LearningAlgorithm[] = [
  'GA',
  'DE',
  'PSO',
  'CMA_HYBRID',
  'CEM',
  'ADAPTIVE_ES',
  'NATURAL_ES',
  'ADAM_ES',
];

const ALL_DIFFICULTIES: DifficultyPreset[] = ALL_DIFFICULTIES_ORDERED;

const DEFAULT_TOPOLOGY_OPTIONS: number[][] = [
  [],
  [1],
  [2],
  [3],
  [4],
  [5],
  [6],
  [8],
  [2, 2],
  [3, 2],
  [2, 3],
  [4, 2],
  [2, 4],
  [3, 3],
  [2, 2, 2],
  [3, 2, 2],
  [2, 2, 2, 2],
  [6, 2],
  [4, 4],
  [4, 4, 2],
  [8, 4],
];

const TOPOLOGY_BUNDLES: Record<
  'SUB50_ZOO' | 'TWO_BY_N' | 'ISO_PARAM' | 'BOTTLENECK',
  {
    labelPl: string;
    labelEn: string;
    subPl: string;
    subEn: string;
    tooltipPl: string;
    tooltipEn: string;
    shapes: number[][];
  }
> = {
  SUB50_ZOO: {
    labelPl: 'Przekrój ≤50 param.',
    labelEn: 'Zoo ≤50 params',
    subPl: '11 kształtów D0–D4',
    subEn: '11 shapes D0–D4',
    tooltipPl:
      'Przekrojowy zestaw 11 małych sieci (od liniowej po 4 warstwy ukryte) mieszczących się w budżecie ~50 parametrów.',
    tooltipEn:
      'Cross-section of 11 compact networks (from linear to 4 hidden layers) within a ~50 parameter budget.',
    shapes: [
      [],
      [1],
      [2],
      [3],
      [4],
      [6],
      [2, 2],
      [3, 2],
      [4, 2],
      [2, 2, 2],
      [2, 2, 2, 2],
    ],
  },
  TWO_BY_N: {
    labelPl: 'Test głębokości (2×N)',
    labelEn: 'Depth Test (2×N)',
    subPl: '0..4 warstwy po 2 neur.',
    subEn: '0..4 layers × 2 neur.',
    tooltipPl:
      'Porównuje sieci o stałej szerokości 2 neuronów i rosnącej głębokości ([], [2], [2,2], [2,2,2], [2,2,2,2]) — izoluje wpływ samej liczby warstw.',
    tooltipEn:
      'Compares fixed 2-neuron width across increasing depths ([], [2], [2,2], [2,2,2], [2,2,2,2]) to isolate pure depth effects.',
    shapes: [[], [2], [4], [2, 2], [2, 2, 2], [2, 2, 2, 2], [3, 2, 2]],
  },
  ISO_PARAM: {
    labelPl: 'Równe param. (Iso)',
    labelEn: 'Equal Params (Iso)',
    subPl: 'Płytka vs głęboka',
    subEn: 'Shallow vs deep',
    tooltipPl:
      'Zestawia sieci 1-warstwowe ([6], [8]) i 2-warstwowe ([3,2], [2,3], [4,2], [3,3]) o zbliżonej liczbie wag — bada czy lepiej dać 1 szerszą czy 2 węższe warstwy.',
    tooltipEn:
      'Compares 1-layer ([6], [8]) vs 2-layer ([3,2], [2,3], [4,2], [3,3]) shapes at similar parameter budgets.',
    shapes: [[4], [3, 2], [2, 3], [4, 2], [2, 4], [6], [3, 3], [8]],
  },
  BOTTLENECK: {
    labelPl: 'Lejek (Bottleneck)',
    labelEn: 'Funnel (Bottleneck)',
    subPl: 'Zwężenie [6→2, 8→4]',
    subEn: 'Compression [6→2, 8→4]',
    tooltipPl:
      'Sieci zwężające się ku wyjściu ([6,2], [4,2], [8,4], [4,4,2]) — pierwsza szersza warstwa rozkłada sygnały sensorów, a węższa kompresuje je przed decyzją.',
    tooltipEn:
      'Tapering hidden layers ([6,2], [4,2], [8,4], [4,4,2]) that expand sensor features first and compress them before the output.',
    shapes: [[4], [6, 2], [4, 2], [8, 4], [4, 4, 2]],
  },
};

const MAX_PARAM_PRESETS: { value: number | null; labelPl: string; labelEn: string }[] = [
  { value: 25, labelPl: '≤25 param.', labelEn: '≤25 params' },
  { value: 50, labelPl: '≤50 param.', labelEn: '≤50 params' },
  { value: 100, labelPl: '≤100 param.', labelEn: '≤100 params' },
  { value: null, labelPl: 'Bez limitu', labelEn: 'No Cap' },
];

const ALL_POPULATIONS = [60, 150, 300, 500];
const ALL_MUTATION_RATES = [0.08, 0.16, 0.25];
const ALL_MUTATION_STRENGTHS = [0.15, 0.3, 0.5];
const SCORE_CAP_PRESETS = [500, 1000, 10000, 50000];

interface ResearchProtocolConfiguratorProps {
  sweepConfig: ResearchSweepConfig;
  activeInputSets: SensorFeatureId[][];
  isBusy: boolean;
  onChangeConfig: (next: ResearchSweepConfig) => void;
  onChangeActiveRunLabel: (label: string) => void;
  onEnqueuePreset: (presetId: PresetId) => void;
}

export const ResearchProtocolConfigurator = memo(
  function ResearchProtocolConfigurator({
    sweepConfig,
    activeInputSets,
    isBusy,
    onChangeConfig,
    onChangeActiveRunLabel,
    onEnqueuePreset,
  }: ResearchProtocolConfiguratorProps) {
    const { lang, bi } = useLanguage();
    const [customTopoInput, setCustomTopoInput] = useState('12, 8, 4');
    const [hoveredTopology, setHoveredTopology] = useState<number[] | null>(
      null
    );
    const [topoGenMaxNeurons, setTopoGenMaxNeurons] = useState<number>(6);
    const [topoGenMaxDepth, setTopoGenMaxDepth] = useState<number>(3);
    const [topoGenMinWidth, setTopoGenMinWidth] = useState<1 | 2>(1);
    const [customSensors, setCustomSensors] = useState<SensorFeatureId[]>([
      'VEL_VY',
      'TOP_CLEAR',
      'BOT_CLEAR',
      'PIPE_VY',
    ]);
    const [showExtendedOptimizers, setShowExtendedOptimizers] = useState(false);
    const [showCustomSensorBuilder, setShowCustomSensorBuilder] = useState(false);
    const [showActiveSensorList, setShowActiveSensorList] = useState(false);
    const [showPresetsModal, setShowPresetsModal] = useState(false);
    const [showScenariosModal, setShowScenariosModal] = useState(false);
    const [showOptimizersModal, setShowOptimizersModal] = useState(false);
    const [showTrainingAuditModal, setShowTrainingAuditModal] = useState(false);
    const [archMenuOpen, setArchMenuOpen] = useState(false);
    const archMenuRef = useRef<HTMLDivElement>(null);
    const [inspectedArch, setInspectedArch] = useState<NetworkArchitecture>('MLP');

    useEffect(() => {
      if (!archMenuOpen) return;
      const handleClickOutside = (event: MouseEvent) => {
        if (
          archMenuRef.current &&
          !archMenuRef.current.contains(event.target as Node)
        ) {
          setArchMenuOpen(false);
        }
      };
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') setArchMenuOpen(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [archMenuOpen]);

    const presetSensorKeySet = useMemo(
      () => new Set(INPUT_SUBSET_PRESETS.map((p) => formatInputSubsetKey(p.features))),
      []
    );
    const extraNonPresetSensorSets = useMemo(
      () =>
        activeInputSets.filter(
          (s) => !presetSensorKeySet.has(formatInputSubsetKey(s))
        ),
      [activeInputSets, presetSensorKeySet]
    );
    const activeSensorKeysSignature = useMemo(
      () =>
        Array.from(new Set(activeInputSets.map((s) => formatInputSubsetKey(s))))
          .sort()
          .join(','),
      [activeInputSets]
    );
    const allPresetsSelected = useMemo(
      () =>
        activeInputSets.length === INPUT_SUBSET_PRESETS.length &&
        extraNonPresetSensorSets.length === 0,
      [activeInputSets.length, extraNonPresetSensorSets.length]
    );

    const primaryInputCount = useMemo(() => {
      if (activeInputSets.length === 0) return 5;
      // Show parameter counts for the largest active sensor subset if 1-sensor [BOT_CLEAR] is first,
      // or the first active subset when only 1 subset is selected.
      return activeInputSets[0]?.length ?? 5;
    }, [activeInputSets]);
    const inputCountRangeLabel = useMemo(() => {
      if (activeInputSets.length <= 1) return `${primaryInputCount}`;
      const counts = activeInputSets.map((s) => s.length);
      const minC = Math.min(...counts);
      const maxC = Math.max(...counts);
      return minC === maxC ? `${minC}` : `${minC}–${maxC}`;
    }, [activeInputSets, primaryInputCount]);
    const activeArchitectures = useMemo<NetworkArchitecture[]>(
      () =>
        sweepConfig.architectures && sweepConfig.architectures.length > 0
          ? sweepConfig.architectures
          : ['MLP'],
      [sweepConfig.architectures]
    );
    const activePrecisions = useMemo<WeightPrecision[]>(
      () =>
        sweepConfig.weightPrecisions && sweepConfig.weightPrecisions.length > 0
          ? sweepConfig.weightPrecisions
          : ['FP32'],
      [sweepConfig.weightPrecisions]
    );
    const activeMaxParams =
      sweepConfig.maxParameters !== undefined ? sweepConfig.maxParameters : null;
    const activeCustomEnv: EnvironmentConfig =
      sweepConfig.customEnvironment ?? DIFFICULTY_SETTINGS.CUSTOM;

    const allScenariosStatic = useMemo(
      () =>
        sweepConfig.difficulties.length > 0 &&
        sweepConfig.difficulties.every(
          (d) => !resolveEnvironment(d, sweepConfig.customEnvironment).movingPipes
        ),
      [sweepConfig.customEnvironment, sweepConfig.difficulties]
    );

    const isSkipRedundantOnD0 =
      inspectedArch === 'RESIDUAL_SKIP' && activeArchitectures.includes('MLP');

    const inspectedTopologies = useMemo(
      () => resolveTopologiesForArchitecture(sweepConfig, inspectedArch),
      [sweepConfig, inspectedArch]
    );

    const selectedTopologyKeySet = useMemo(() => {
      const set = new Set<string>();
      for (const t of inspectedTopologies) {
        set.add(formatTopologyLabel(normalizeHiddenLayers(t)));
      }
      return set;
    }, [inspectedTopologies]);

    const topoGenCount = useMemo(
      () =>
        countTopologyCombinations({
          maxHiddenNeurons: topoGenMaxNeurons,
          maxDepth: topoGenMaxDepth,
          minLayerWidth: topoGenMinWidth,
          includeLinear: true,
        }),
      [topoGenMaxNeurons, topoGenMaxDepth, topoGenMinWidth]
    );

    const availableTopologies = useMemo(() => {
      const seen = new Set<string>();
      const list: number[][] = [];
      for (const t of [...DEFAULT_TOPOLOGY_OPTIONS, ...inspectedTopologies]) {
        const clean = normalizeHiddenLayers(t);
        const key = formatTopologyLabel(clean, primaryInputCount);
        if (!seen.has(key)) {
          seen.add(key);
          list.push(clean);
        }
      }
      return list;
    }, [inspectedTopologies, primaryInputCount]);

    const applyLoopPreset = (presetId: PresetId) => {
      if (isBusy) return;
      const def = getPresetById(presetId);
      const nextCfg = def.buildConfig(sweepConfig);
      onChangeConfig(nextCfg);
      onChangeActiveRunLabel(def.title);
      if (nextCfg.architectures && nextCfg.architectures.length > 0) {
        setInspectedArch(nextCfg.architectures[0]);
      }
    };

    const toggleArchitecture = (arch: NetworkArchitecture) => {
      if (isBusy) return;
      const exists = activeArchitectures.includes(arch);
      const next = exists
        ? activeArchitectures.filter((a) => a !== arch)
        : [...activeArchitectures, arch];
      if (next.length === 0) return;
      onChangeConfig({
        ...sweepConfig,
        architectures: ALL_ARCHITECTURES.filter((a) => next.includes(a)),
      });
    };

    const togglePrecision = (prec: WeightPrecision) => {
      if (isBusy) return;
      const exists = activePrecisions.includes(prec);
      const next = exists
        ? activePrecisions.filter((p) => p !== prec)
        : [...activePrecisions, prec];
      if (next.length === 0) return;
      onChangeConfig({
        ...sweepConfig,
        weightPrecisions: ALL_WEIGHT_PRECISIONS.filter((p) => next.includes(p)),
      });
    };

    const morphCfg = useMemo(
      () => resolveMorphogenesisConfig(sweepConfig.morphogenesisConfig),
      [sweepConfig.morphogenesisConfig]
    );

    const activeCurriculumOpts = useMemo(
      () => resolveCurriculumOptions(sweepConfig),
      [sweepConfig]
    );
    const activeShapedOpts = useMemo(
      () => resolveShapedFitnessOptions(sweepConfig),
      [sweepConfig]
    );

    const toggleCurriculumOption = (val: boolean) => {
      if (isBusy) return;
      const exists = activeCurriculumOpts.includes(val);
      const next = exists
        ? activeCurriculumOpts.filter((v) => v !== val)
        : [...activeCurriculumOpts, val];
      if (next.length === 0) return;
      const ordered = [false, true].filter((v) => next.includes(v));
      onChangeConfig({
        ...sweepConfig,
        curriculumLearning: ordered.length === 1 ? ordered[0] : true,
        curriculumOptions: ordered,
      });
    };

    const toggleShapedOption = (val: boolean) => {
      if (isBusy) return;
      const exists = activeShapedOpts.includes(val);
      const next = exists
        ? activeShapedOpts.filter((v) => v !== val)
        : [...activeShapedOpts, val];
      if (next.length === 0) return;
      const ordered = [false, true].filter((v) => next.includes(v));
      onChangeConfig({
        ...sweepConfig,
        shapedFitness: ordered.length === 1 ? ordered[0] : true,
        shapedFitnessOptions: ordered,
      });
    };

    const activeGlobalAlgorithms = useMemo(
      () => getAllActiveAlgorithms(sweepConfig),
      [sweepConfig]
    );

    const hasRateUsingOptimizer = useMemo(
      () => activeGlobalAlgorithms.some((a) => algorithmUsesMutationRate(a)),
      [activeGlobalAlgorithms]
    );

    const toggleGlobalAlgorithm = (algo: LearningAlgorithm) => {
      if (isBusy) return;
      const exists = activeGlobalAlgorithms.includes(algo);
      const next = exists
        ? activeGlobalAlgorithms.filter((a) => a !== algo)
        : [...activeGlobalAlgorithms, algo];
      if (next.length === 0) return;
      const ordered = ALL_ALGORITHMS.filter((a) => next.includes(a));
      onChangeConfig({
        ...sweepConfig,
        algorithms: ordered,
        algorithmsByArchitecture: undefined,
      });
    };

    const setGlobalAlgorithmsPreset = (algos: LearningAlgorithm[]) => {
      if (isBusy || algos.length === 0) return;
      const ordered = ALL_ALGORITHMS.filter((a) => algos.includes(a));
      onChangeConfig({
        ...sweepConfig,
        algorithms: ordered,
        algorithmsByArchitecture: undefined,
      });
    };

    const toggleArchMorphMode = (
      arch: NetworkArchitecture,
      modeBit: 'STATIC' | 'GROWING'
    ) => {
      if (isBusy) return;
      const current = resolveMorphModesForArchitecture(sweepConfig, arch);
      const exists = current.includes(modeBit);
      const next = exists
        ? current.filter((m) => m !== modeBit)
        : [...current, modeBit];
      if (next.length === 0) return;
      const nextEnum: MorphogenesisMode =
        next.length === 2 ? 'PAIRED_AB' : next[0];
      const nextMap: Partial<Record<NetworkArchitecture, MorphogenesisMode>> = {
        ...(sweepConfig.morphogenesisByArchitecture ?? {}),
        [arch]: nextEnum,
      };
      onChangeConfig({
        ...sweepConfig,
        morphogenesisMode:
          activeArchitectures.length === 1 && activeArchitectures[0] === arch
            ? nextEnum
            : sweepConfig.morphogenesisMode,
        morphogenesisByArchitecture: nextMap,
      });
    };

    const applyArchMorphToAll = (arch: NetworkArchitecture) => {
      if (isBusy) return;
      const current = resolveMorphModesForArchitecture(sweepConfig, arch);
      const nextEnum: MorphogenesisMode =
        current.length === 2 ? 'PAIRED_AB' : current[0];
      onChangeConfig({
        ...sweepConfig,
        morphogenesisMode: nextEnum,
        morphogenesisByArchitecture: undefined,
      });
    };

    const toggleReasoningK = (kVal: number) => {
      if (isBusy) return;
      const current = resolveReasoningStepsForArchitecture(
        sweepConfig,
        'PONDER_ACT'
      );
      const exists = current.includes(kVal);
      const next = exists
        ? current.filter((k) => k !== kVal)
        : [...current, kVal].sort((a, b) => a - b);
      if (next.length === 0) return;
      onChangeConfig({
        ...sweepConfig,
        reasoningSteps: next[0],
        reasoningStepsList: next,
      });
    };

    const togglePerceptionMode = (mode: PerceptionMode) => {
      if (isBusy) return;
      const current = resolvePerceptionModesForArchitecture(
        sweepConfig,
        'DROSOPHILA_CONNECTOME'
      );
      const exists = current.includes(mode);
      const next = exists
        ? current.filter((m) => m !== mode)
        : [...current, mode];
      if (next.length === 0) return;
      const ordered: PerceptionMode[] = (
        ['GEOMETRIC_LAB', 'COMPOUND_EYE_PIXELS'] as PerceptionMode[]
      ).filter((m) => next.includes(m));
      onChangeConfig({
        ...sweepConfig,
        perceptionMode: ordered[0],
        perceptionModes: ordered,
        opticalNoiseLevel: ordered.includes('COMPOUND_EYE_PIXELS')
          ? (sweepConfig.opticalNoiseLevel ?? 0.05)
          : sweepConfig.opticalNoiseLevel,
      });
    };

    const applySensorBundle = (
      bundle:
        | 'MULTI_DEFAULT'
        | 'BOT_FIRST_AB'
        | 'ALL_PRESETS'
        | 'COMB_WITH_GAP'
        | 'COMB_ALL_63'
    ) => {
      if (isBusy) return;
      if (bundle === 'MULTI_DEFAULT') {
        onChangeConfig({
          ...sweepConfig,
          inputFeatureSets: DEFAULT_MULTI_SENSOR_SUBSETS.map((s) => [...s]),
        });
      } else if (bundle === 'BOT_FIRST_AB') {
        onChangeConfig({
          ...sweepConfig,
          inputFeatureSets: [
            ['BOT_CLEAR'],
            ['PIPE_DX', 'BOT_CLEAR'],
            ['PIPE_DX', 'BOT_CLEAR', 'NEXT_PIPE_DX', 'NEXT_BOT_CLEAR'],
            [
              'PIPE_DX',
              'TOP_CLEAR',
              'BOT_CLEAR',
              'NEXT_TOP_CLEAR',
              'NEXT_BOT_CLEAR',
              'NEXT_PIPE_DX',
            ],
            [...ALL_SENSOR_FEATURES],
          ],
        });
      } else if (bundle === 'ALL_PRESETS') {
        onChangeConfig({
          ...sweepConfig,
          inputFeatureSets: INPUT_SUBSET_PRESETS.map((p) =>
            normalizeInputFeatures(p.features)
          ),
        });
      } else if (bundle === 'COMB_WITH_GAP') {
        onChangeConfig({
          ...sweepConfig,
          inputFeatureSets: generateSensorCombinations([1, 2, 3, 4, 5, 6], {
            requireClearance: true,
          }),
        });
      } else {
        // Merge all 63 classic 6-sensor combinations + all visible Dual-Pipe/TTF presets (deduplicated)
        const base63 = generateSensorCombinations([1, 2, 3, 4, 5, 6], {
          requireClearance: false,
        });
        const seen = new Set<string>(base63.map((s) => formatInputSubsetKey(s)));
        const merged = [...base63];
        for (const preset of INPUT_SUBSET_PRESETS) {
          const clean = normalizeInputFeatures(preset.features);
          const key = formatInputSubsetKey(clean);
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(clean);
          }
        }
        onChangeConfig({
          ...sweepConfig,
          inputFeatureSets: merged,
        });
      }
    };

    const setArchTopologies = (
      arch: NetworkArchitecture,
      nextTopos: number[][]
    ) => {
      if (isBusy || nextTopos.length === 0) return;
      const nextMap: Partial<Record<NetworkArchitecture, number[][]>> = {
        ...(sweepConfig.topologiesByArchitecture ?? {}),
        [arch]: nextTopos,
      };
      onChangeConfig({
        ...sweepConfig,
        topologies:
          activeArchitectures.length === 1 && activeArchitectures[0] === arch
            ? nextTopos
            : sweepConfig.topologies,
        topologiesByArchitecture: nextMap,
      });
    };

    const applyArchTopologiesToAll = (arch: NetworkArchitecture) => {
      if (isBusy) return;
      const current = resolveTopologiesForArchitecture(sweepConfig, arch);
      if (current.length === 0) return;
      onChangeConfig({
        ...sweepConfig,
        topologies: current.map((t) => [...t]),
        topologiesByArchitecture: undefined,
      });
    };

    const applyTopologyBundle = (
      bundleKey: 'SUB50_ZOO' | 'TWO_BY_N' | 'ISO_PARAM' | 'BOTTLENECK'
    ) => {
      if (isBusy) return;
      const shapes = TOPOLOGY_BUNDLES[bundleKey].shapes
        .filter((t) => !(isSkipRedundantOnD0 && t.length === 0))
        .map((t) => [...t]);
      if (shapes.length === 0) return;
      setArchTopologies(inspectedArch, shapes);
    };

    const selectAllVisibleTopologies = () => {
      if (isBusy) return;
      const shapes = availableTopologies
        .filter((t) => !(isSkipRedundantOnD0 && t.length === 0))
        .map((t) => [...t]);
      if (shapes.length === 0) return;
      setArchTopologies(inspectedArch, shapes);
    };

    const clearArchTopologies = () => {
      if (isBusy) return;
      setArchTopologies(inspectedArch, [[4]]);
    };

    const applyAllTopologiesInRange = () => {
      if (isBusy) return;
      const generated = generateTopologyCombinations({
        maxHiddenNeurons: topoGenMaxNeurons,
        maxDepth: topoGenMaxDepth,
        minLayerWidth: topoGenMinWidth,
        includeLinear: !isSkipRedundantOnD0,
      });
      if (generated.length === 0) return;
      setArchTopologies(inspectedArch, generated);
    };

    const toggleInputFeatureSet = (features: SensorFeatureId[]) => {
      if (isBusy) return;
      const clean = normalizeInputFeatures(features);
      const key = formatInputSubsetKey(clean);
      const exists = activeInputSets.some(
        (s) => formatInputSubsetKey(s) === key
      );
      const next = exists
        ? activeInputSets.filter((s) => formatInputSubsetKey(s) !== key)
        : [...activeInputSets, clean];
      if (next.length === 0) return;
      onChangeConfig({ ...sweepConfig, inputFeatureSets: next });
    };

    const sanitizedCustomSensors = useMemo(() => {
      const base = allScenariosStatic
        ? customSensors.filter(
            (s) => s !== 'PIPE_VY' && s !== 'NEXT_PIPE_VY'
          )
        : customSensors;
      const normalized = normalizeInputFeatures(
        base.length > 0 ? base : ['BOT_CLEAR']
      );
      if (
        !normalized.includes('TOP_CLEAR') &&
        !normalized.includes('BOT_CLEAR')
      ) {
        return normalizeInputFeatures([...normalized, 'BOT_CLEAR']);
      }
      return normalized;
    }, [allScenariosStatic, customSensors]);

    const handleAddCustomInputSet = () => {
      if (isBusy || sanitizedCustomSensors.length === 0) return;
      const clean = normalizeInputFeatures(sanitizedCustomSensors);
      const key = formatInputSubsetKey(clean);
      const exists = activeInputSets.some(
        (s) => formatInputSubsetKey(s) === key
      );
      if (!exists) {
        onChangeConfig({
          ...sweepConfig,
          inputFeatureSets: [...activeInputSets, clean],
        });
      }
    };

    const toggleCustomSensor = (id: SensorFeatureId) => {
      if (isBusy) return;
      if (allScenariosStatic && (id === 'PIPE_VY' || id === 'NEXT_PIPE_VY')) {
        return;
      }
      const exists = sanitizedCustomSensors.includes(id);
      const next = exists
        ? sanitizedCustomSensors.filter((s) => s !== id)
        : [...sanitizedCustomSensors, id];
      if (next.length === 0) return;
      // Enforce non-blind clearance rule directly in UI
      if (!next.includes('TOP_CLEAR') && !next.includes('BOT_CLEAR')) {
        return;
      }
      setCustomSensors(normalizeInputFeatures(next));
    };

    const toggleDifficulty = (diff: DifficultyPreset) => {
      if (isBusy) return;
      const exists = sweepConfig.difficulties.includes(diff);
      const next = exists
        ? sweepConfig.difficulties.filter((d) => d !== diff)
        : [...sweepConfig.difficulties, diff];
      if (next.length === 0) return;
      onChangeConfig({
        ...sweepConfig,
        difficulties: ALL_DIFFICULTIES.filter((d) => next.includes(d)),
      });
    };

    const toggleTopology = (topo: number[]) => {
      if (isBusy) return;
      if (isSkipRedundantOnD0 && topo.length === 0) return;
      const label = formatTopologyLabel(topo);
      const exists = inspectedTopologies.some(
        (t) => formatTopologyLabel(t) === label
      );
      const next = exists
        ? inspectedTopologies.filter((t) => formatTopologyLabel(t) !== label)
        : [...inspectedTopologies, topo];
      if (next.length === 0) return;
      setArchTopologies(inspectedArch, next);
    };

    const parsedCustomTopo = useMemo(
      () =>
        customTopoInput
          .split(/[,x\->\s]+/)
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !Number.isNaN(n) && n > 0 && n <= 64)
          .slice(0, 4),
      [customTopoInput]
    );

    const isCustomTopoAlreadySelected =
      parsedCustomTopo.length > 0 &&
      selectedTopologyKeySet.has(formatTopologyLabel(parsedCustomTopo));

    const handleAddCustomTopology = () => {
      if (isBusy || parsedCustomTopo.length === 0 || isCustomTopoAlreadySelected)
        return;
      setArchTopologies(inspectedArch, [
        ...inspectedTopologies,
        parsedCustomTopo,
      ]);
    };

    const togglePopulation = (pop: number) => {
      if (isBusy) return;
      const exists = sweepConfig.populationSizes.includes(pop);
      const next = exists
        ? sweepConfig.populationSizes.filter((p) => p !== pop)
        : [...sweepConfig.populationSizes, pop];
      if (next.length === 0) return;
      onChangeConfig({
        ...sweepConfig,
        populationSizes: ALL_POPULATIONS.filter((p) => next.includes(p)),
      });
    };

    const toggleMutationRate = (rate: number) => {
      if (isBusy) return;
      const exists = sweepConfig.mutationRates.includes(rate);
      const next = exists
        ? sweepConfig.mutationRates.filter((r) => r !== rate)
        : [...sweepConfig.mutationRates, rate];
      if (next.length === 0) return;
      onChangeConfig({
        ...sweepConfig,
        mutationRates: ALL_MUTATION_RATES.filter((r) => next.includes(r)),
      });
    };

    const toggleMutationStrength = (str: number) => {
      if (isBusy) return;
      const exists = sweepConfig.mutationStrengths.includes(str);
      const next = exists
        ? sweepConfig.mutationStrengths.filter((s) => s !== str)
        : [...sweepConfig.mutationStrengths, str];
      if (next.length === 0) return;
      onChangeConfig({
        ...sweepConfig,
        mutationStrengths: ALL_MUTATION_STRENGTHS.filter((s) =>
          next.includes(s)
        ),
      });
    };

    const updateCustomEnvField = <K extends keyof EnvironmentConfig>(
      key: K,
      value: EnvironmentConfig[K]
    ) => {
      if (isBusy) return;
      onChangeConfig({
        ...sweepConfig,
        customEnvironment: {
          ...activeCustomEnv,
          label: 'Custom',
          [key]: value,
        },
      });
    };

    const handlePipeCapInput = (raw: string) => {
      if (isBusy) return;
      const parsed = parseInt(raw, 10);
      if (Number.isNaN(parsed)) return;
      const clamped = Math.max(50, Math.min(100000, parsed));
      onChangeConfig({ ...sweepConfig, targetPipeCap: clamped });
    };

    const provenScenariosCount = sweepConfig.difficulties.filter((d) =>
      verifyScenarioSolvability(
        resolveEnvironment(d, sweepConfig.customEnvironment)
      ).solvable
    ).length;

    const scenariosTooltip = `Aktywne scenariusze (${sweepConfig.difficulties.length}/${ALL_DIFFICULTIES.length}): ${sweepConfig.difficulties
      .map((d) => resolveEnvironment(d, sweepConfig.customEnvironment).label)
      .join(', ')} · Rozwiązywalność: ${provenScenariosCount}/${sweepConfig.difficulties.length} PROVEN`;

    const optimizersTooltip = `Globalne optymalizatory dla wszystkich architektur (${activeGlobalAlgorithms.length}/8): ${activeGlobalAlgorithms
      .map((a) => ALGORITHM_SHORT_LABELS[a])
      .join(', ')}`;

    const trainingAuditTooltip = [
      `Cap ${sweepConfig.targetPipeCap >= 1000 ? `${sweepConfig.targetPipeCap / 1000}k` : sweepConfig.targetPipeCap}`,
      `${sweepConfig.verificationSeeds} seedów`,
      `Pop ${sweepConfig.populationSizes.join('/')}`,
      `Kwantyzacja: ${activePrecisions.map((p) => WEIGHT_PRECISION_META[p].shortLabel).join('+')}`,
      activeCurriculumOpts.length === 2
        ? 'Curriculum A/B'
        : activeCurriculumOpts[0]
          ? 'Curriculum ON'
          : 'Curriculum OFF',
      activeShapedOpts.length === 2
        ? 'Shaped Fit A/B'
        : activeShapedOpts[0]
          ? 'Shaped Fit ON'
          : 'Shaped Fit OFF',
    ].join(' · ');

    return (
      <section className="space-y-3">
            {/* Global Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-[#111827] px-3.5 py-2.5">
          <button
            type="button"
            title={bi(
              '19 presetów badawczych (Frontier, Diagnostic, Classic)',
              '19 curated research presets (Frontier, Diagnostic, Classic)'
            )}
            onClick={() => setShowPresetsModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-[#0B1120] px-3 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:border-amber-400 hover:bg-amber-500/10 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300 shrink-0" aria-hidden="true" />
            <span>{bi('Presety', 'Presets')}</span>
            <span className="font-mono text-[10px] text-amber-300/80">
              {RESEARCH_PRESETS.length}
            </span>
          </button>

          <button
            type="button"
            title={scenariosTooltip}
            onClick={() => setShowScenariosModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-[#0B1120] px-3 py-1.5 text-xs font-semibold text-slate-100 transition-colors hover:border-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
          >
            <Layers className="h-3.5 w-3.5 text-emerald-300 shrink-0" aria-hidden="true" />
            <span>{bi('Scenariusze', 'Scenarios')}</span>
            <span className="font-mono text-[10px] text-emerald-300 tabular-nums">
              {sweepConfig.difficulties.length}/{ALL_DIFFICULTIES.length}
            </span>
          </button>

          <button
            type="button"
            title={optimizersTooltip}
            onClick={() => setShowOptimizersModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-[#0B1120] px-3 py-1.5 text-xs font-semibold text-slate-100 transition-colors hover:border-violet-400 hover:bg-violet-500/10 cursor-pointer"
          >
            <Cpu className="h-3.5 w-3.5 text-violet-300 shrink-0" aria-hidden="true" />
            <span>{bi('Optymalizatory', 'Optimizers')}</span>
            <span className="font-mono text-[10px] text-violet-300 tabular-nums">
              {activeGlobalAlgorithms.length}/8
            </span>
          </button>

          <button
            type="button"
            title={trainingAuditTooltip}
            onClick={() => setShowTrainingAuditModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-[#0B1120] px-3 py-1.5 text-xs font-semibold text-slate-100 transition-colors hover:border-cyan-400 hover:bg-cyan-500/10 cursor-pointer"
          >
            <SlidersHorizontal
              className="h-3.5 w-3.5 text-cyan-300 shrink-0"
              aria-hidden="true"
            />
            <span>{bi('Trening & Audyt', 'Training & Audit')}</span>
          </button>
        </div>

        {/* Full-Width Contextual Architecture Workbench with Integrated Selector */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-4">
          {(() => {
            const inspMeta = ARCHITECTURE_META[inspectedArch];
            const inspCat = ARCHITECTURE_CATALOG[inspectedArch];
            const inspActive = activeArchitectures.includes(inspectedArch);
            const isFlyCortex = inspectedArch === 'DECOUPLED_FLY_CORTEX';
            const isDrosophila = inspectedArch === 'DROSOPHILA_CONNECTOME';
            const isMoE = inspectedArch === 'HYBRID_MOE';
            const topoRoleHint =
              inspectedArch === 'LOOPED_REASONER' ||
              inspectedArch === 'PONDER_ACT' ||
              inspectedArch === 'LATENT_ROLLOUT'
                ? bi(
                    'Wcześniejsze warstwy kodują wejście, a ostatnia warstwa (lastH) wyznacza rozmiar macierzy rekurencyjnej (lastH×lastH). WebGPU 8/12 → 64/64.',
                    'Earlier layers encode inputs while the last layer (lastH) sizes the recurrent reasoning matrix (lastH×lastH). WebGPU 8/12 → 64/64.'
                  )
                : inspectedArch === 'HYBRID_MOE'
                  ? bi(
                      'Definiuje rdzeń refleksyjny MLP; szerokość 1. warstwy ustala rozmiar 3 ekspertów (LTC, MinGRU, Ponder) na CPU.',
                      'Defines the MLP reflex core; 1st layer width sizes the 3 adaptive experts (LTC, MinGRU, Ponder) on CPU.'
                    )
                  : isFlyCortex
                    ? bi(
                        'Określa rozmiar rdzenia wykonawczego LTC (+ Giant Fiber przy D≥1); 16-slotowa pamięć FlyHash APL ma stały rozmiar (CPU).',
                        'Sizes the executive LTC core (+ Giant Fiber at D≥1); the 16-slot FlyHash APL memory has fixed size (CPU).'
                      )
                    : isDrosophila
                      ? bi(
                          'Określa rozmiar płata wzrokowego LTC (+ Giant Fiber przy D≥1). Dynamiczny WebGPU do D≤4, szer.≤64, suma≤64n.',
                          'Sizes the optic-lobe LTC core (+ Giant Fiber at D≥1). Dynamic WebGPU up to D≤4, width≤64, total≤64n.'
                        )
                      : inspectedArch === 'RESIDUAL_SKIP'
                        ? bi(
                            'Przy Depth≥1 dodaje bezpośredni bypass sensory→motor. Depth 0 (Linear) jest wyłączony przy aktywnym MLP (matematycznie identyczny).',
                            'At Depth≥1 adds a direct sensory→motor bypass. Depth 0 is disabled alongside MLP (0 extra params, identical forward/learning).'
                          )
                        : inspectedArch === 'MLP'
                          ? bi(
                              'Klasyczne warstwy gęste tanh — pełne przyspieszenie WebGPU (FAST / DEEP 24 / DEEP 64 do 64 neuronów/warstwę).',
                              'Classic dense tanh layers — full WebGPU acceleration (FAST / DEEP 24 / DEEP 64 up to 64 neurons/layer).'
                            )
                          : bi(
                              'Każdy ukryty neuron otrzymuje stanową dynamikę bio-membrany. Dynamiczny WebGPU w 4 tierach (8/12 → 16/24 → 32/36 → 64/64, D≤4).',
                              'Each hidden neuron runs stateful bio-membrane dynamics. Dynamic 4-tier WebGPU (8/12 → 16/24 → 32/36 → 64/64, D≤4).'
                            );
            const hasReasoningK =
              inspectedArch === 'PONDER_ACT' ||
              inspectedArch === 'LOOPED_REASONER';
            const hasBioPlasticity =
              isFlyCortex ||
              isDrosophila ||
              inspectedArch === 'LTC_FLY' ||
              inspectedArch === 'NEUROCHEM_GATE' ||
              inspectedArch === 'SYNAPTIC_STP';
            const supportsCompoundEye = isFlyCortex || isDrosophila;
            const archMorphModes = resolveMorphModesForArchitecture(
              sweepConfig,
              inspectedArch
            );
            const archHasGrowing = archMorphModes.includes('GROWING');
            const isIslandSpeciation =
              (sweepConfig.evolutionTopologyMode ?? 'SINGLE_SPECIES') ===
              'ISLAND_SPECIATION';
            const archKList = resolveReasoningStepsForArchitecture(
              sweepConfig,
              inspectedArch
            );
            const archPercModes = resolvePerceptionModesForArchitecture(
              sweepConfig,
              inspectedArch
            );
            const onlyCompoundEye =
              supportsCompoundEye &&
              archPercModes.length === 1 &&
              archPercModes[0] === 'COMPOUND_EYE_PIXELS';
            const visibleMorphProfiles = Object.values(MORPHOGENESIS_PROFILES).filter(
              (prof) => isMoE || prof.id !== 'ADAPTIVE_MOE_ROLLBACK'
            );

            // Detect exact quick sensor bundle active state
            const dual6Sig = Array.from(
              new Set(
                DEFAULT_MULTI_SENSOR_SUBSETS.map((s) =>
                  formatInputSubsetKey(normalizeInputFeatures(s))
                )
              )
            )
              .sort()
              .join(',');
            const c648Sig = Array.from(
              new Set(
                generateSensorCombinations([1, 2, 3, 4, 5, 6], {
                  requireClearance: true,
                }).map((s) => formatInputSubsetKey(s))
              )
            )
              .sort()
              .join(',');
            const isDual6Active = activeSensorKeysSignature === dual6Sig;
            const isC648Active = activeSensorKeysSignature === c648Sig;
            const isAll69Active = activeInputSets.length === 69;

            return (
              <div className="space-y-4">
                {/* Compact Unified Header: Selector + Badge/Formula + Concise Architecture Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center border-b border-slate-800/80 pb-3.5">
                  <div className="lg:col-span-5 flex flex-wrap items-center gap-2.5">
                    <div className="relative" ref={archMenuRef}>
                      <button
                        type="button"
                        onClick={() => setArchMenuOpen((v) => !v)}
                        aria-expanded={archMenuOpen}
                        aria-haspopup="listbox"
                        className={`group inline-flex items-center gap-2.5 rounded-lg border bg-[#0B1120] px-3 py-1.5 text-left transition-colors cursor-pointer ${
                          archMenuOpen
                            ? 'border-cyan-400/80 ring-1 ring-cyan-500/25'
                            : 'border-slate-700/90 hover:border-cyan-500/60'
                        }`}
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                            inspActive ? '' : 'opacity-35 ring-1 ring-slate-500'
                          }`}
                          style={{ backgroundColor: inspCat?.colorHex ?? '#06B6D4' }}
                        />
                        <span className="text-xs font-semibold text-white">
                          {inspCat?.shortLabel ?? inspMeta.shortLabel}
                        </span>
                        <span className="font-mono text-[10.5px] text-slate-400 tabular-nums">
                          {inspectedTopologies.length}t ·{' '}
                          {inspMeta.computeProfile === 'CPU_SPECIALIZED' ? 'CPU' : 'GPU'}
                        </span>
                        <span className="h-3.5 w-px bg-slate-800" aria-hidden="true" />
                        <span className="font-mono text-[10.5px] font-medium text-cyan-300 tabular-nums">
                          {activeArchitectures.length}/{ALL_ARCHITECTURES.length}
                        </span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                            archMenuOpen
                              ? 'rotate-180 text-cyan-300'
                              : 'group-hover:text-slate-200'
                          }`}
                          aria-hidden="true"
                        />
                      </button>

                      {archMenuOpen && (
                        <div
                          role="listbox"
                          aria-label={bi('Wybór architektury', 'Select architecture')}
                          className="absolute left-0 top-full z-40 mt-1.5 w-[330px] sm:w-[400px] rounded-xl border border-slate-700/90 bg-[#0B1120] p-2.5 shadow-2xl shadow-black/70"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-800 pb-2 font-mono text-[10.5px]">
                            <span className="text-slate-400 tabular-nums">
                              {activeArchitectures.length}/{ALL_ARCHITECTURES.length}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  onChangeConfig({
                                    ...sweepConfig,
                                    architectures: [inspectedArch],
                                  })
                                }
                                className="text-slate-400 hover:text-white cursor-pointer disabled:opacity-50"
                              >
                                {bi('Tylko ta', 'Only this')}
                              </button>
                              <span className="text-slate-700">·</span>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  onChangeConfig({
                                    ...sweepConfig,
                                    architectures: [...TIER_1_ARCHITECTURES],
                                  })
                                }
                                className="text-cyan-300 hover:text-cyan-200 cursor-pointer disabled:opacity-50"
                              >
                                Tier 1 ({TIER_1_ARCHITECTURES.length})
                              </button>
                              <span className="text-slate-700">·</span>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  onChangeConfig({
                                    ...sweepConfig,
                                    architectures: [...ALL_ARCHITECTURES],
                                  })
                                }
                                className="text-emerald-300 hover:text-emerald-200 cursor-pointer disabled:opacity-50"
                              >
                                {bi('Wszystkie', 'All')}
                              </button>
                            </div>
                          </div>

                          <div className="max-h-[360px] space-y-2.5 overflow-y-auto pr-0.5">
                            <div className="space-y-1">
                              <div className="px-1.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-400/80">
                                {bi('Tier 1 — Główne', 'Tier 1 — Core')}
                              </div>
                              {TIER_1_ARCHITECTURES.map((arch) => {
                                const m = ARCHITECTURE_META[arch];
                                const c = ARCHITECTURE_CATALOG[arch];
                                const isAct = activeArchitectures.includes(arch);
                                const isSel = inspectedArch === arch;
                                const tCount = resolveTopologiesForArchitecture(
                                  sweepConfig,
                                  arch
                                ).length;
                                const archMorphs = resolveMorphModesForArchitecture(
                                  sweepConfig,
                                  arch
                                );
                                const morphTag =
                                  archMorphs.length === 2
                                    ? 'A/B'
                                    : archMorphs[0] === 'GROWING'
                                      ? 'Grow'
                                      : null;
                                const isCpuSpec =
                                  m.computeProfile === 'CPU_SPECIALIZED';
                                return (
                                  <div
                                    key={arch}
                                    role="option"
                                    aria-selected={isSel}
                                    onClick={() => {
                                      setInspectedArch(arch);
                                      setArchMenuOpen(false);
                                    }}
                                    className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                                      isSel
                                        ? 'border-cyan-500/60 bg-cyan-500/12 text-white'
                                        : isAct
                                          ? 'border-transparent bg-slate-900/70 text-slate-200 hover:border-slate-700 hover:bg-slate-900'
                                          : 'border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <button
                                        type="button"
                                        disabled={isBusy}
                                        aria-label={`${isAct ? 'Disable' : 'Enable'} ${c?.shortLabel ?? m.shortLabel}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleArchitecture(arch);
                                        }}
                                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors cursor-pointer disabled:opacity-50 ${
                                          isAct
                                            ? 'border-emerald-400 bg-emerald-500/25 text-emerald-300'
                                            : 'border-slate-600 bg-slate-950 text-transparent hover:border-slate-400'
                                        }`}
                                      >
                                        <Check className="h-3 w-3" aria-hidden="true" />
                                      </button>
                                      <span
                                        className="h-2 w-2 rounded-full shrink-0"
                                        style={{
                                          backgroundColor: c?.colorHex ?? '#06B6D4',
                                        }}
                                      />
                                      <span className="font-medium truncate">
                                        {c?.shortLabel ?? m.shortLabel}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                                      <span className="text-emerald-300/80">
                                        {tCount}t
                                      </span>
                                      {morphTag && (
                                        <span className="text-amber-300">
                                          {morphTag}
                                        </span>
                                      )}
                                      <span
                                        className={
                                          isCpuSpec
                                            ? 'text-amber-300/90'
                                            : 'text-slate-500'
                                        }
                                      >
                                        {isCpuSpec ? 'CPU' : 'GPU'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="space-y-1 border-t border-slate-800/80 pt-2">
                              <div className="inline-flex items-center gap-1 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                <Archive className="h-3 w-3" aria-hidden="true" />
                                Tier 2 — Legacy
                              </div>
                              {TIER_2_LEGACY_ARCHITECTURES.map((arch) => {
                                const m = ARCHITECTURE_META[arch];
                                const c = ARCHITECTURE_CATALOG[arch];
                                const isAct = activeArchitectures.includes(arch);
                                const isSel = inspectedArch === arch;
                                const tCount = resolveTopologiesForArchitecture(
                                  sweepConfig,
                                  arch
                                ).length;
                                return (
                                  <div
                                    key={arch}
                                    role="option"
                                    aria-selected={isSel}
                                    onClick={() => {
                                      setInspectedArch(arch);
                                      setArchMenuOpen(false);
                                    }}
                                    className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                                      isSel
                                        ? 'border-cyan-500/60 bg-cyan-500/12 text-white'
                                        : isAct
                                          ? 'border-transparent bg-slate-900/70 text-slate-200 hover:border-slate-700 hover:bg-slate-900'
                                          : 'border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <button
                                        type="button"
                                        disabled={isBusy}
                                        aria-label={`${isAct ? 'Disable' : 'Enable'} ${c?.shortLabel ?? m.shortLabel}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleArchitecture(arch);
                                        }}
                                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors cursor-pointer disabled:opacity-50 ${
                                          isAct
                                            ? 'border-emerald-400 bg-emerald-500/25 text-emerald-300'
                                            : 'border-slate-600 bg-slate-950 text-transparent hover:border-slate-400'
                                        }`}
                                      >
                                        <Check className="h-3 w-3" aria-hidden="true" />
                                      </button>
                                      <span className="font-medium truncate">
                                        {c?.shortLabel ?? m.shortLabel}
                                      </span>
                                    </div>
                                    <span className="font-mono text-[10px] text-slate-500 shrink-0">
                                      {tCount}t
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {inspCat && (
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="font-mono text-[10px] text-slate-400">
                          {inspCat.formulaSummary}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-7 text-[11.5px] leading-relaxed text-slate-300">
                    <span className="font-semibold text-slate-100">
                      {lang === 'pl'
                        ? inspCat?.fullNamePl ?? inspMeta.label
                        : inspMeta.label}
                      :{' '}
                    </span>
                    {lang === 'pl'
                      ? inspCat?.whatItDoesPl ?? inspMeta.description
                      : inspMeta.description}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                <div className="xl:col-span-6 space-y-4">

                {/* Block 2: Architecture-Specific Morphogenesis (multi-select Static / Growing) */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-200">
                      {bi('Morphogenesis (Samorozrost)', 'Morphogenesis (Growth)')}
                      <InfoTooltip
                        align="left"
                        label={bi(
                          'Morphogenesis dla tej architektury',
                          'Morphogenesis for this architecture'
                        )}
                        text={bi(
                          'Zaznacz Static, Growing lub OBA naraz (test A/B porównujący sieć stałą z samorozrastającą się). Pokazujemy tu wyłącznie parametry mające zastosowanie do tej architektury.',
                          'Select Static, Growing, or BOTH (an A/B test comparing fixed networks against self-growing networks). Only parameters supported by this architecture are shown.'
                        )}
                      />
                    </span>
                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      <span className="text-amber-300">
                        {isIslandSpeciation
                          ? bi('Wyłączone (Islands)', 'Disabled (Islands)')
                          : archMorphModes.length === 2
                            ? 'A/B (Static + Grow)'
                            : archHasGrowing
                              ? `Grow ${Math.round(morphCfg.initialWidthRatio * 100)}%→100%`
                              : 'Static'}
                      </span>
                      {!isIslandSpeciation && activeArchitectures.length > 1 && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => applyArchMorphToAll(inspectedArch)}
                          className="text-slate-400 hover:text-cyan-300 cursor-pointer disabled:opacity-50"
                        >
                          {bi('· Dla wszystkich', '· Apply to all')}
                        </button>
                      )}
                    </div>
                  </div>

                  {isIslandSpeciation ? (
                    <div className="rounded border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5 font-mono text-[10px] text-amber-200/90">
                      {bi(
                        'Tryb 5-Arch Islands automatycznie wyłącza Morphogenesis (wyspy rywalizują równolegle).',
                        '5-Arch Islands mode automatically disables Morphogenesis (islands compete in parallel).'
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(
                          [
                            {
                              id: 'STATIC',
                              label: bi('Static (stała sieć)', 'Static (fixed size)'),
                              desc: bi(
                                'Pełny rozmiar od 1. pokolenia',
                                'Full width from generation 1'
                              ),
                            },
                            {
                              id: 'GROWING',
                              label: bi('Growing (samorozrost)', 'Growing (morphogenesis)'),
                              desc: bi(
                                `Start ${Math.round(morphCfg.initialWidthRatio * 100)}% + mielinizacja`,
                                `Start ${Math.round(morphCfg.initialWidthRatio * 100)}% + myelination`
                              ),
                            },
                          ] as const
                        ).map((opt) => {
                          const active = archMorphModes.includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                toggleArchMorphMode(inspectedArch, opt.id)
                              }
                              className={`rounded-md border px-2.5 py-1.5 text-left cursor-pointer transition-colors disabled:opacity-50 ${
                                active
                                  ? opt.id === 'GROWING'
                                    ? 'border-amber-500/55 bg-amber-500/15 text-amber-100'
                                    : 'border-cyan-500/50 bg-cyan-500/12 text-cyan-100'
                                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <div className="text-[11px] font-semibold leading-tight">
                                {opt.label}
                              </div>
                              <div className="mt-0.5 font-mono text-[9.5px] opacity-75 truncate">
                                {opt.desc}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {archHasGrowing && (
                        <div className="space-y-2 pt-0.5">
                          <div
                            className={`grid gap-1.5 ${
                              visibleMorphProfiles.length === 4
                                ? 'grid-cols-2'
                                : 'grid-cols-3'
                            }`}
                          >
                            {visibleMorphProfiles.map((prof) => {
                              const active =
                                morphCfg.initialWidthRatio ===
                                  prof.config.initialWidthRatio &&
                                morphCfg.growthStagnationTrigger ===
                                  prof.config.growthStagnationTrigger &&
                                morphCfg.pruneThreshold ===
                                  prof.config.pruneThreshold;
                              return (
                                <button
                                  key={prof.id}
                                  type="button"
                                  disabled={isBusy}
                                  title={`${prof.hypothesisPl} · ${prof.idealForPl}`}
                                  onClick={() =>
                                    onChangeConfig({
                                      ...sweepConfig,
                                      morphogenesisConfig: { ...prof.config },
                                    })
                                  }
                                  className={`rounded-md border px-2 py-1.5 text-left cursor-pointer transition-colors disabled:opacity-50 ${
                                    active
                                      ? 'border-amber-500/60 bg-amber-500/15 text-amber-100'
                                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                                  }`}
                                >
                                  <div className="text-[10.5px] font-semibold leading-tight truncate">
                                    {prof.namePl}
                                  </div>
                                  <div className="mt-0.5 font-mono text-[9px] text-amber-300/90 leading-tight truncate">
                                    {prof.badgePl}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                            <button
                              type="button"
                              disabled={isBusy}
                              title="Rozmiar startowy zalążka sieci (warstwy ukryte)"
                              onClick={() =>
                                onChangeConfig({
                                  ...sweepConfig,
                                  morphogenesisConfig: {
                                    ...morphCfg,
                                    initialWidthRatio:
                                      morphCfg.initialWidthRatio <= 0.35
                                        ? 0.5
                                        : morphCfg.initialWidthRatio === 0.5
                                          ? 0.75
                                          : 0.33,
                                  },
                                })
                              }
                              className="rounded border border-slate-800 bg-slate-950 px-2 py-1 text-slate-300 cursor-pointer hover:border-cyan-500/40 disabled:opacity-50"
                            >
                              <span className="text-slate-500">Start: </span>
                              <span className="font-semibold text-cyan-300">
                                {Math.round(morphCfg.initialWidthRatio * 100)}%
                              </span>
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              title="Pokolenia stagnacji przed rozrostem"
                              onClick={() =>
                                onChangeConfig({
                                  ...sweepConfig,
                                  morphogenesisConfig: {
                                    ...morphCfg,
                                    growthStagnationTrigger:
                                      morphCfg.growthStagnationTrigger === 10
                                        ? 15
                                        : morphCfg.growthStagnationTrigger === 15
                                          ? 6
                                          : 10,
                                  },
                                })
                              }
                              className="rounded border border-slate-800 bg-slate-950 px-2 py-1 text-slate-300 cursor-pointer hover:border-cyan-500/40 disabled:opacity-50"
                            >
                              <span className="text-slate-500">Stagnacja: </span>
                              <span className="font-semibold text-amber-300">
                                {morphCfg.growthStagnationTrigger}g
                              </span>
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              title="Stopniowe odblokowywanie końcowych sensorów predykcyjnych (PIPE_VY, NEXT_*, TTF)"
                              onClick={() =>
                                onChangeConfig({
                                  ...sweepConfig,
                                  morphogenesisConfig: {
                                    ...morphCfg,
                                    progressiveSensors: !morphCfg.progressiveSensors,
                                  },
                                })
                              }
                              className={`rounded border px-2 py-1 cursor-pointer disabled:opacity-50 ${
                                morphCfg.progressiveSensors
                                  ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
                                  : 'border-slate-800 bg-slate-950 text-slate-400'
                              }`}
                            >
                              <span className="text-slate-500">Sensory: </span>
                              <span className="font-semibold">
                                {morphCfg.progressiveSensors ? 'Fale' : 'Od razu'}
                              </span>
                            </button>

                            {/* ONLY shown for Hybrid MoE */}
                            {isMoE && (
                              <>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  title="Okres próbny nowych ekspertów MoE przed commit/rollback"
                                  onClick={() => {
                                    const cur = morphCfg.expertTrialWindowGens ?? 12;
                                    const next = cur === 12 ? 8 : cur === 8 ? 20 : 12;
                                    onChangeConfig({
                                      ...sweepConfig,
                                      morphogenesisConfig: {
                                        ...morphCfg,
                                        expertTrialWindowGens: next,
                                      },
                                    });
                                  }}
                                  className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-amber-200 cursor-pointer hover:border-amber-400 disabled:opacity-50"
                                >
                                  <span className="text-amber-300/75">MoE ROI: </span>
                                  <span className="font-semibold">
                                    {morphCfg.expertTrialWindowGens ?? 12}g
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  title="Automatyczne dokładanie nowych ekspertów (LTC / SSM / Ponder)"
                                  onClick={() =>
                                    onChangeConfig({
                                      ...sweepConfig,
                                      morphogenesisConfig: {
                                        ...morphCfg,
                                        allowExpertSpawning: !(
                                          morphCfg.allowExpertSpawning ?? true
                                        ),
                                      },
                                    })
                                  }
                                  className={`rounded border px-2 py-1 cursor-pointer disabled:opacity-50 ${
                                    (morphCfg.allowExpertSpawning ?? true)
                                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                                      : 'border-slate-800 bg-slate-950 text-slate-400'
                                  }`}
                                >
                                  <span className="text-slate-400">Eksperci: </span>
                                  <span className="font-semibold">
                                    {(morphCfg.allowExpertSpawning ?? true)
                                      ? 'Auto-Spawn'
                                      : 'Off'}
                                  </span>
                                </button>
                              </>
                            )}

                            {/* ONLY shown for Looped Reasoner / PonderNet */}
                            {hasReasoningK && (
                              <button
                                type="button"
                                disabled={isBusy}
                                title="Start od K=1 (szybki odruch) i dokładanie kolejnych kroków rozumowania przy stagnacji"
                                onClick={() =>
                                  onChangeConfig({
                                    ...sweepConfig,
                                    morphogenesisConfig: {
                                      ...morphCfg,
                                      growReasoningSteps: !morphCfg.growReasoningSteps,
                                    },
                                  })
                                }
                                className={`rounded border px-2 py-1 cursor-pointer disabled:opacity-50 ${
                                  morphCfg.growReasoningSteps
                                    ? 'border-emerald-500/45 bg-emerald-500/10 text-emerald-200'
                                    : 'border-slate-800 bg-slate-950 text-slate-400'
                                }`}
                              >
                                <span className="text-slate-400">Wzrost K: </span>
                                <span className="font-semibold">
                                  {morphCfg.growReasoningSteps ? '1→maxK' : 'Stałe K'}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Block 3: Compound Eye vs Geometric Perception — Multi-select A/B (Fly / Drosophila) */}
                {supportsCompoundEye && (
                  <div className="pt-2.5 border-t border-slate-800/70 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-200">
                        Percepcja wejściowa (zaznacz 1 lub obie dla A/B)
                      </span>
                      <span className="font-mono text-[10px] text-emerald-300">
                        {archPercModes.length === 2
                          ? 'A/B: Lab + Oko'
                          : archPercModes[0] === 'COMPOUND_EYE_PIXELS'
                            ? '16 Omatidiów'
                            : 'Telemetria Lab'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          {
                            id: 'GEOMETRIC_LAB',
                            label: 'Telemetria Lab (1–12)',
                            desc: 'Czyste wejścia geometryczne',
                          },
                          {
                            id: 'COMPOUND_EYE_PIXELS',
                            label: 'Oko Złożone (16r)',
                            desc: 'Promienie + L1/L2 + T4/T5',
                          },
                        ] as const
                      ).map((opt) => {
                        const active = archPercModes.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={isBusy}
                            onClick={() => togglePerceptionMode(opt.id)}
                            className={`rounded-md border px-2.5 py-1.5 text-left cursor-pointer transition-colors disabled:opacity-50 ${
                              active
                                ? opt.id === 'COMPOUND_EYE_PIXELS'
                                  ? 'border-emerald-500/55 bg-emerald-500/15 text-emerald-100'
                                  : 'border-cyan-500/50 bg-cyan-500/12 text-cyan-100'
                                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <div className="text-[11px] font-semibold leading-tight">
                              {opt.label}
                            </div>
                            <div className="mt-0.5 font-mono text-[9.5px] opacity-75 truncate">
                              {opt.desc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Block 4: Thinking Steps K — Multi-select (Ponder / Looped) */}
                {hasReasoningK && (
                  <div className="pt-2.5 border-t border-slate-800/70 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-emerald-200">
                      Kroki rozumowania K (zaznacz 1 lub wiele)
                    </span>
                    <div className="flex items-center gap-1">
                      {[2, 3, 4].map((kVal) => {
                        const activeK = archKList.includes(kVal);
                        return (
                          <button
                            key={kVal}
                            type="button"
                            disabled={isBusy}
                            onClick={() => toggleReasoningK(kVal)}
                            className={`rounded border px-2.5 py-1 font-mono text-[10.5px] cursor-pointer transition-colors disabled:opacity-50 ${
                              activeK
                                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200 font-semibold'
                                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            K={kVal}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Block 5: Evolution Topology (Hybrid MoE / Island Speciation) */}
                {isMoE && (
                  <div className="pt-2.5 border-t border-slate-800/70 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-200 font-medium">
                        Specjacja Wyspowa
                      </span>
                      <span className="font-mono text-[10px] text-amber-300">
                        Router [TTF, PVy, N2Y]
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 rounded-md border border-slate-800 bg-slate-950 p-0.5">
                      {(
                        [
                          { id: 'SINGLE_SPECIES', label: 'Single Species' },
                          { id: 'ISLAND_SPECIATION', label: '5-Arch Islands' },
                        ] as { id: EvolutionTopologyMode; label: string }[]
                      ).map((opt) => {
                        const active =
                          (sweepConfig.evolutionTopologyMode ??
                            'SINGLE_SPECIES') === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              onChangeConfig({
                                ...sweepConfig,
                                evolutionTopologyMode: opt.id,
                              })
                            }
                            className={`rounded py-1 font-mono text-[10px] cursor-pointer transition-colors disabled:opacity-50 ${
                              active
                                ? opt.id === 'ISLAND_SPECIATION'
                                  ? 'bg-amber-500/20 text-amber-200 font-semibold'
                                  : 'bg-slate-800 text-cyan-300 font-semibold'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Block 6: Bio-Plasticity & Environmental Anomalies */}
                {hasBioPlasticity && (
                  <div className="pt-2.5 border-t border-slate-800/70 grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                    <button
                      type="button"
                      disabled={isBusy || isFlyCortex}
                      title="Uczenie Hebbowskie z dopaminą w trakcie lotu"
                      onClick={() =>
                        onChangeConfig({
                          ...sweepConfig,
                          onlinePlasticity: !sweepConfig.onlinePlasticity,
                        })
                      }
                      className={`rounded border px-2 py-1.5 text-left cursor-pointer transition-colors disabled:opacity-60 ${
                        sweepConfig.onlinePlasticity || isFlyCortex
                          ? 'border-emerald-500/45 bg-emerald-500/15 text-emerald-200'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      DA Plasticity:{' '}
                      <span className="font-semibold">
                        {sweepConfig.onlinePlasticity || isFlyCortex
                          ? 'ON'
                          : 'OFF'}
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      title="Losowe zmiany wiatru i grawitacji (0.78–1.22g) w trakcie lotu"
                      onClick={() =>
                        onChangeConfig({
                          ...sweepConfig,
                          nonStationaryAnomalies:
                            !sweepConfig.nonStationaryAnomalies,
                        })
                      }
                      className={`rounded border px-2 py-1.5 text-left cursor-pointer transition-colors disabled:opacity-50 ${
                        sweepConfig.nonStationaryAnomalies
                          ? 'border-amber-500/50 bg-amber-500/15 text-amber-200'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Anomalie:{' '}
                      <span className="font-semibold">
                        {sweepConfig.nonStationaryAnomalies ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  </div>
                )}

                {/* Block 7: Sensory Inputs (kept in left column to balance with Topologies on right) */}
                {onlyCompoundEye ? (
                  <div className="pt-3.5 border-t border-slate-800/70">
                    <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-2 font-mono text-[10px] text-emerald-200">
                      Aktywne wyłącznie Oko Złożone: 16 omatidiów + filtry L1/L2 + detektory ruchu T4/T5. Zaznacz wyżej także „Telemetria Lab”, aby porównać oba tryby.
                    </div>
                  </div>
                ) : (
                  <div className="pt-3.5 border-t border-slate-800/70 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="font-medium text-slate-200">
                        {bi(
                          `Sensory (${activeInputSets.length} zestawów)`,
                          `Sensors (${activeInputSets.length} subsets)`
                        )}
                      </span>
                      <div className="flex items-center gap-2 font-mono text-[10px]">
                        <button
                          type="button"
                          disabled={isBusy}
                          title={bi(
                            'Zaznacz wszystkie 10 gotowych presetów poniżej',
                            'Select all 10 built-in sensor presets below'
                          )}
                          onClick={() => applySensorBundle('ALL_PRESETS')}
                          className={`cursor-pointer transition-colors disabled:opacity-50 ${
                            allPresetsSelected
                              ? 'text-emerald-300 font-semibold'
                              : 'text-slate-400 hover:text-emerald-300'
                          }`}
                        >
                          {bi('Wszystkie 10', 'All 10')}
                        </button>
                        <span className="text-slate-600">·</span>
                        <button
                          type="button"
                          onClick={() => setShowCustomSensorBuilder((v) => !v)}
                          className="text-cyan-400 hover:text-cyan-300 cursor-pointer"
                        >
                          {showCustomSensorBuilder
                            ? bi('▲ Ukryj własny', '▲ Hide custom')
                            : bi('+ Własny', '+ Custom')}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {(
                        [
                          {
                            id: 'MULTI_DEFAULT',
                            label: 'Dual-6',
                            active: isDual6Active,
                            title: '6 kluczowych zestawów od 1 do 12 sensorów',
                          },
                          {
                            id: 'BOT_FIRST_AB',
                            label: 'Bot-1st',
                            active: false,
                            title: 'Progresja Bot-only → Dual-Pipe → Full 12',
                          },
                          {
                            id: 'COMB_WITH_GAP',
                            label: 'C(6) 48',
                            active: isC648Active,
                            title: 'Wszystkie 48 kombinacji 6 bazowych sensorów rury #1 zawierających Top lub Bot (2^6 − 2^4 = 48)',
                          },
                          {
                            id: 'COMB_ALL_63',
                            label: 'All 69',
                            active: isAll69Active,
                            title: 'Wszystkie 63 kombinacje rury #1 + wszystkie 6 presetów Dual-Pipe/TTF',
                          },
                        ] as const
                      ).map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          disabled={isBusy}
                          title={b.title}
                          onClick={() => applySensorBundle(b.id)}
                          className={`rounded border px-1.5 py-1 text-[10px] font-mono font-medium whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 ${
                            b.active
                              ? 'border-cyan-400/70 bg-cyan-500/15 text-cyan-200 font-semibold'
                              : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-200'
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-1">
                      {INPUT_SUBSET_PRESETS.map((preset) => {
                        const key = formatInputSubsetKey(preset.features);
                        const active = activeInputSets.some(
                          (s) => formatInputSubsetKey(s) === key
                        );
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            disabled={isBusy}
                            title={preset.rationale}
                            onClick={() => toggleInputFeatureSet(preset.features)}
                            className={`rounded border px-2 py-1 text-left cursor-pointer transition-colors disabled:opacity-50 ${
                              active
                                ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200'
                                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <div className="font-medium text-[10.5px] truncate">
                              {preset.name}
                            </div>
                            <div className="font-mono text-[9.5px] text-slate-500 truncate">
                              {preset.shortName}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {extraNonPresetSensorSets.length > 0 && (
                      <div className="rounded border border-slate-800 bg-slate-950/80 px-2 py-1.5 space-y-1.5">
                        <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                          <span className="text-slate-400">
                            +{extraNonPresetSensorSets.length} dodatkowych spoza 10 presetów
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowActiveSensorList((v) => !v)}
                            className="text-cyan-400 hover:text-cyan-300 cursor-pointer whitespace-nowrap"
                          >
                            {showActiveSensorList
                              ? '▲ Ukryj dodatkowe'
                              : `▼ Pokaż (${extraNonPresetSensorSets.length})`}
                          </button>
                        </div>
                        {showActiveSensorList && (
                          <div className="max-h-32 overflow-y-auto flex flex-wrap gap-1 pt-1 border-t border-slate-800/80">
                            {extraNonPresetSensorSets.map((set) => {
                              const key = formatInputSubsetKey(set);
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  disabled={isBusy || activeInputSets.length <= 1}
                                  title="Kliknij, aby usunąć ten zestaw z aktywnych"
                                  onClick={() => toggleInputFeatureSet(set)}
                                  className="rounded border border-slate-700 bg-[#0B1120] px-1.5 py-0.5 font-mono text-[9.5px] text-slate-300 hover:border-rose-500/50 hover:text-rose-200 cursor-pointer disabled:opacity-50"
                                >
                                  {formatInputSubsetLabel(set)} ×
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {showCustomSensorBuilder && (
                      <div className="rounded border border-slate-800 bg-slate-950 p-2 space-y-1.5">
                        <div className="grid grid-cols-6 gap-1">
                          {ALL_SENSOR_FEATURES.map((id) => {
                            const meta = SENSOR_METADATA[id];
                            const active = sanitizedCustomSensors.includes(id);
                            const isStaticBlocked =
                              allScenariosStatic &&
                              (id === 'PIPE_VY' || id === 'NEXT_PIPE_VY');
                            const isLastClearance =
                              active &&
                              (id === 'TOP_CLEAR' || id === 'BOT_CLEAR') &&
                              sanitizedCustomSensors.filter(
                                (s) => s === 'TOP_CLEAR' || s === 'BOT_CLEAR'
                              ).length === 1;
                            return (
                              <button
                                key={id}
                                type="button"
                                disabled={isBusy || isStaticBlocked || isLastClearance}
                                title={
                                  isStaticBlocked
                                    ? bi(
                                        `${meta.label}: wyłączone przy statycznych rurach`,
                                        `${meta.label}: disabled for static-pipe scenarios`
                                      )
                                    : isLastClearance
                                      ? bi(
                                          'Wymagany min. 1 sensor szczeliny (TOP_CLEAR lub BOT_CLEAR)',
                                          'Requires at least 1 gap clearance sensor (TOP_CLEAR or BOT_CLEAR)'
                                        )
                                      : `${meta.label}: ${meta.description}`
                                }
                                onClick={() => toggleCustomSensor(id)}
                                className={`rounded border py-1 font-mono text-[9.5px] cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                                  active
                                    ? meta.group === 'PIPE_2' || id === 'PIPE_TTF'
                                      ? 'border-amber-400/60 bg-amber-500/15 text-amber-200'
                                      : 'border-cyan-500/50 bg-cyan-500/15 text-cyan-200'
                                    : 'border-slate-800 bg-[#0B1120] text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                {meta.shortLabel}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={handleAddCustomInputSet}
                          className="w-full inline-flex items-center justify-center gap-1 rounded border border-slate-700 bg-slate-800/80 py-1 text-[10.5px] font-medium text-slate-200 cursor-pointer hover:border-cyan-500/50 disabled:opacity-50"
                        >
                          <Plus className="h-3 w-3" aria-hidden="true" />
                          {bi('Dodaj:', 'Add:')}{' '}
                          {formatInputSubsetLabel(sanitizedCustomSensors)}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                </div>

                {/* Right Half of Full-Width Settings Workbench: Live SVG Diagram + Per-Architecture Topologies */}
                <div className="xl:col-span-6 space-y-3 xl:border-l xl:border-slate-800/70 xl:pl-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-slate-200">
                      {bi('Topologie: Głębokość × Szerokość', 'Topologies: Depth × Width')} ({inspectedTopologies.length}) ·{' '}
                      <span className="text-emerald-300 font-mono text-[10px]">
                        {inspCat?.shortLabel ?? inspMeta.shortLabel}
                      </span>
                    </span>
                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      <span className="text-slate-400">
                        {bi(`Wejścia IN: ${inputCountRangeLabel}`, `Inputs IN: ${inputCountRangeLabel}`)}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-emerald-300">
                        {activeMaxParams !== null
                          ? bi(`Limit ≤${activeMaxParams} param.`, `Cap ≤${activeMaxParams} params`)
                          : bi('Bez limitu param.', 'No param cap')}
                      </span>
                      <span className="text-slate-600">·</span>
                      <button
                        type="button"
                        disabled={isBusy}
                        title={bi(
                          'Zastosuj te topologie dla wszystkich architektur',
                          'Apply these topologies to all architectures'
                        )}
                        onClick={() => applyArchTopologiesToAll(inspectedArch)}
                        className="text-slate-400 hover:text-cyan-300 cursor-pointer disabled:opacity-50"
                      >
                        {bi('Dla wszystkich', 'Apply All')}
                      </button>
                    </div>
                  </div>

                  {/* Interactive SVG Neural Topology Diagram — defaults to a multi-layer active topology so hidden layers are visible even before hover */}
                  <TopologyDiagram
                    inputCount={primaryInputCount}
                    hiddenLayers={
                      hoveredTopology ??
                      inspectedTopologies.find((t) => t.length >= 2) ??
                      inspectedTopologies.find((t) => t.length >= 1) ??
                      inspectedTopologies[0] ?? [4, 4]
                    }
                    architecture={inspectedArch}
                  />

                  <p className="rounded-md border border-slate-800/90 bg-slate-950/70 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-slate-400">
                    {topoRoleHint}
                  </p>

                  {/* 1. Limit budżetu wag + Szybkie czyszczenie / zaznaczenie */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <div
                      className="flex flex-1 min-w-[240px] items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1"
                      title={bi(
                        'Górny limit parametrów (wag + biasów): próby przekraczające ten budżet zostaną automatycznie pominięte',
                        'Upper parameter cap (weights + biases): trials exceeding this budget are automatically skipped'
                      )}
                    >
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {bi('Limit wag:', 'Param cap:')}
                      </span>
                      <div className="grid flex-1 grid-cols-4 gap-1">
                        {MAX_PARAM_PRESETS.map((cap) => (
                          <button
                            key={cap.labelEn}
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              onChangeConfig({ ...sweepConfig, maxParameters: cap.value })
                            }
                            className={`rounded-md py-1 font-mono text-[10px] cursor-pointer transition-colors disabled:opacity-50 ${
                              activeMaxParams === cap.value
                                ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {lang === 'pl' ? cap.labelPl : cap.labelEn}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isBusy}
                      title={bi(
                        'Wyczyść zaznaczenie do pojedynczej bazowej sieci [4]',
                        'Reset selection to a single baseline [4] network'
                      )}
                      onClick={clearArchTopologies}
                      className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-2.5 py-1.5 font-mono text-[10px] font-medium text-rose-200 whitespace-nowrap cursor-pointer transition-colors hover:border-rose-400 disabled:opacity-50"
                    >
                      {bi('Wyczyść (1)', 'Clear (1)')}
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={selectAllVisibleTopologies}
                      className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 font-mono text-[10px] font-semibold text-emerald-200 whitespace-nowrap cursor-pointer transition-colors hover:border-emerald-400 disabled:opacity-50"
                    >
                      {bi('Wszystkie', 'All')} ({availableTopologies.length})
                    </button>
                  </div>

                  {/* 2. Gotowe presety kształtów pod hipotezę badawczą */}
                  <div className="rounded-lg border border-slate-800/90 bg-slate-950/60 p-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-medium text-slate-300">
                        {bi(
                          'Gotowe zestawy kształtów (presety hipotez)',
                          'Hypothesis Shape Bundles (1-click presets)'
                        )}
                      </span>
                      <span className="font-mono text-slate-500">
                        {bi('zastępuje wybór dla tej architektury', 'replaces selection for this arch')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {(
                        ['SUB50_ZOO', 'TWO_BY_N', 'ISO_PARAM', 'BOTTLENECK'] as const
                      ).map((bundleKey) => {
                        const b = TOPOLOGY_BUNDLES[bundleKey];
                        return (
                          <button
                            key={bundleKey}
                            type="button"
                            disabled={isBusy}
                            title={lang === 'pl' ? b.tooltipPl : b.tooltipEn}
                            onClick={() => applyTopologyBundle(bundleKey)}
                            className="rounded-md border border-slate-800 bg-[#0B1120] px-2 py-1.5 text-left cursor-pointer transition-colors hover:border-cyan-500/50 disabled:opacity-50"
                          >
                            <div className="text-[10.5px] font-semibold text-cyan-300 truncate">
                              {lang === 'pl' ? b.labelPl : b.labelEn}
                            </div>
                            <div className="font-mono text-[9px] text-slate-400 truncate">
                              {lang === 'pl' ? b.subPl : b.subEn}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Automatyczny generator kombinacji (pełna siatka matematyczna) */}
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="font-medium text-slate-300">
                          {bi('Generator kombinacji', 'Combinatorial Generator')}
                        </span>
                        <InfoTooltip
                          align="left"
                          label={bi('O generatorze siatki kształtów', 'About combinatorial generator')}
                          text={bi(
                            'Wylicza wszystkie matematyczne podziały zadanej liczby neuronów ukrytych (Max neur.) na 1..4 warstwy ukryte. Przy "szer. ≥2" odrzuca warstwy z pojedynczym neuronem.',
                            'Generates all mathematical partitions of up to N hidden neurons across 1..4 hidden layers. "width ≥2" skips 1-neuron bottleneck layers.'
                          )}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <div className="inline-flex items-center gap-1 rounded border border-slate-800 bg-[#0B1120] px-1.5 py-0.5">
                          <span className="text-[10px] text-slate-400">
                            {bi('Suma neur. ≤', 'Max neur. ≤')}
                          </span>
                          <button
                            type="button"
                            disabled={isBusy || topoGenMaxNeurons <= 1}
                            onClick={() =>
                              setTopoGenMaxNeurons((v) => Math.max(1, v - 1))
                            }
                            className="h-4 w-4 rounded border border-slate-700 bg-slate-900 font-mono text-[10px] text-slate-300 cursor-pointer hover:border-cyan-500/50 disabled:opacity-40"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-mono text-[10.5px] font-semibold text-emerald-300 tabular-nums">
                            {topoGenMaxNeurons}
                          </span>
                          <button
                            type="button"
                            disabled={isBusy || topoGenMaxNeurons >= 14}
                            onClick={() =>
                              setTopoGenMaxNeurons((v) => Math.min(14, v + 1))
                            }
                            className="h-4 w-4 rounded border border-slate-700 bg-slate-900 font-mono text-[10px] text-slate-300 cursor-pointer hover:border-cyan-500/50 disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>

                        <div
                          className="grid grid-cols-4 gap-0.5 rounded border border-slate-800 bg-[#0B1120] p-0.5"
                          title={bi(
                            'Maksymalna liczba warstw ukrytych (1w = 1 warstwa, 4w = do 4 warstw)',
                            'Maximum hidden layer depth (1L = 1 layer, 4L = up to 4 layers)'
                          )}
                        >
                          {([1, 2, 3, 4] as const).map((d) => (
                            <button
                              key={d}
                              type="button"
                              disabled={isBusy}
                              onClick={() => setTopoGenMaxDepth(d)}
                              className={`rounded px-1.5 py-0.5 font-mono text-[10px] cursor-pointer transition-colors disabled:opacity-50 ${
                                topoGenMaxDepth === d
                                  ? 'bg-cyan-500/20 text-cyan-200 font-semibold'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {lang === 'pl' ? `${d}w` : `${d}L`}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          disabled={isBusy}
                          title={bi(
                            'Minimalna szerokość każdej warstwy ukrytej (≥1 lub ≥2 neurony w warstwie)',
                            'Minimum width of each hidden layer (≥1 or ≥2 neurons per layer)'
                          )}
                          onClick={() => setTopoGenMinWidth((w) => (w === 1 ? 2 : 1))}
                          className={`rounded border px-2 py-0.5 font-mono text-[10px] whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 ${
                            topoGenMinWidth === 2
                              ? 'border-amber-500/50 bg-amber-500/15 text-amber-200'
                              : 'border-slate-800 bg-[#0B1120] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {bi(`szer. ≥${topoGenMinWidth}`, `width ≥${topoGenMinWidth}`)}
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={applyAllTopologiesInRange}
                          className="rounded border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10.5px] font-semibold text-emerald-200 cursor-pointer transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
                        >
                          {bi('Generuj', 'Generate')} ({topoGenCount.toLocaleString()})
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[280px] overflow-y-auto pr-0.5">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                      {availableTopologies.slice(0, 96).map((topo) => {
                        const label = formatTopologyLabel(topo, primaryInputCount);
                        const canonicalKey = formatTopologyLabel(topo);
                        const breakdown = calculateTopologyBreakdown(
                          topo,
                          primaryInputCount
                        );
                        const archParams = calculateParameterCount(
                          topo,
                          primaryInputCount,
                          1,
                          inspectedArch
                        );
                        const gpuOk = isGpuBioTopologySupported(topo, inspectedArch);
                        const skipD0Blocked = isSkipRedundantOnD0 && topo.length === 0;
                        const active =
                          !skipD0Blocked && selectedTopologyKeySet.has(canonicalKey);
                        const overCap =
                          activeMaxParams !== null && archParams > activeMaxParams;
                        return (
                          <button
                            key={label}
                            type="button"
                            disabled={isBusy || skipD0Blocked}
                            onMouseEnter={() => setHoveredTopology(topo)}
                            onMouseLeave={() => setHoveredTopology(null)}
                            title={
                              skipD0Blocked
                                ? bi(
                                    '0 warstw ukrytych dla Residual Skip ma 0 dodatkowych wag i jest matematycznie identyczne z aktywnym MLP',
                                    '0 hidden layers on Residual Skip adds 0 parameters and is mathematically identical to active MLP'
                                  )
                                : overCap
                                  ? `${archParams} param. > limit ≤${activeMaxParams} (${inspCat?.shortLabel ?? inspMeta.shortLabel})`
                                  : bi(
                                      `${archParams} parametrów (wagi+biasy) · ${breakdown.hiddenNeuronCount} neuronów ukrytych · ${topo.length} warstw ukrytych · ${gpuOk ? 'WebGPU' : 'CPU Workers'}`,
                                      `${archParams} parameters (weights+biases) · ${breakdown.hiddenNeuronCount} hidden neurons · ${topo.length} hidden layers · ${gpuOk ? 'WebGPU' : 'CPU Workers'}`
                                    )
                            }
                            onClick={() => toggleTopology(topo)}
                            className={`rounded-lg border px-1.5 py-1.5 text-center font-mono text-xs cursor-pointer transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${
                              active
                                ? overCap
                                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-200/80'
                                  : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
                                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <div className="font-semibold text-[11px] truncate">
                              {label}
                            </div>
                            <div className="text-[9.5px] text-slate-400 flex items-center justify-center gap-1">
                              <span>
                                {archParams} param · {breakdown.hiddenNeuronCount} neur
                              </span>
                              {!gpuOk && (
                                <span className="text-amber-300">CPU</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {availableTopologies.length > 96 && (
                      <div className="mt-1.5 rounded-md border border-emerald-500/25 bg-emerald-500/5 px-2 py-1 text-center font-mono text-[10px] text-emerald-300">
                        +{(availableTopologies.length - 96).toLocaleString()} {bi('dodatkowych topologii aktywnych', 'more active topologies')}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      disabled={isBusy}
                      value={customTopoInput}
                      onChange={(e) => setCustomTopoInput(e.target.value)}
                      placeholder={bi('np. 16, 16 lub 32, 16', 'e.g. 16, 16 or 32, 16')}
                      aria-label={bi('Własne szerokości warstw ukrytych (do 64)', 'Custom hidden layer widths (up to 64)')}
                      className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 font-mono text-xs text-slate-200 focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                    />
                    <button
                      type="button"
                      disabled={
                        isBusy ||
                        parsedCustomTopo.length === 0 ||
                        isCustomTopoAlreadySelected ||
                        (isSkipRedundantOnD0 && parsedCustomTopo.length === 0)
                      }
                      title={bi(
                        'Dodaj własny kształt dla wybranej architektury (max 4 warstwy, do 64 neuronów/warstwę)',
                        'Add custom topology shape (up to 4 layers, up to 64 neurons/layer)'
                      )}
                      onClick={handleAddCustomTopology}
                      className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-50 ${
                        isCustomTopoAlreadySelected
                          ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300 cursor-default'
                          : 'border-slate-700 bg-slate-800 text-slate-200 cursor-pointer hover:border-cyan-500/50'
                      }`}
                    >
                      {isCustomTopoAlreadySelected ? (
                        <>
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          {bi('Dodany', 'Added')}
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          {bi('Dodaj kształt', 'Add Shape')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Dedicated Popup Modal: Frontier Training (A/B), Audit Limits, Evolution Hyperparams & Quantization */}
        <LabUtilityModal
          open={showTrainingAuditModal}
          onClose={() => setShowTrainingAuditModal(false)}
          title="Trening, Audyt & Parametry Globalne"
          subtitle="Frontier Training (z wyborem A/B), limity audytu wieloziarnowego, populacja/mutacja oraz kwantyzacja wag"
          icon={<SlidersHorizontal className="h-4 w-4 text-cyan-300" aria-hidden="true" />}
          maxWidthClass="max-w-2xl"
        >
          {/* 1. Frontier Training (Multi-select A/B) */}
          <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-white">
                Frontier Training (wybierz 1 lub OBA dla testu A/B)
                <InfoTooltip
                  align="left"
                  label="O Frontier Training"
                  text="Curriculum Annealing stopniowo utrudnia fizykę przez pierwsze 40% generacji. Shaped Fitness dodaje gęste nagrody za środek szczeliny i płynny lot. Zaznacz jednocześnie OFF i ON, aby bezpośrednio porównać ich wpływ w jednej siatce. Audyt ZAWSZE używa 100% surowej fizyki."
                />
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                Audyt = 100% fizyki
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1 font-medium text-slate-300">
                    <TrendingUp className="h-3.5 w-3.5 text-violet-300" aria-hidden="true" />
                    Curriculum Annealing
                  </span>
                  <span className="font-mono text-[10px] text-violet-300">
                    {activeCurriculumOpts.length === 2
                      ? 'A/B (OFF + ON)'
                      : activeCurriculumOpts[0]
                        ? 'ON'
                        : 'OFF'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {([false, true] as const).map((val) => {
                    const active = activeCurriculumOpts.includes(val);
                    return (
                      <button
                        key={String(val)}
                        type="button"
                        disabled={isBusy}
                        onClick={() => toggleCurriculumOption(val)}
                        className={`rounded-md border py-1.5 font-mono text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 ${
                          active
                            ? val
                              ? 'border-violet-500/60 bg-violet-500/15 text-violet-200 font-semibold'
                              : 'border-cyan-500/50 bg-cyan-500/12 text-cyan-200 font-semibold'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {val ? 'ON' : 'OFF'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1 font-medium text-slate-300">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
                    Shaped Survival Fitness
                  </span>
                  <span className="font-mono text-[10px] text-emerald-300">
                    {activeShapedOpts.length === 2
                      ? 'A/B (OFF + ON)'
                      : activeShapedOpts[0]
                        ? 'ON'
                        : 'OFF'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {([false, true] as const).map((val) => {
                    const active = activeShapedOpts.includes(val);
                    return (
                      <button
                        key={String(val)}
                        type="button"
                        disabled={isBusy}
                        onClick={() => toggleShapedOption(val)}
                        className={`rounded-md border py-1.5 font-mono text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 ${
                          active
                            ? val
                              ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200 font-semibold'
                              : 'border-cyan-500/50 bg-cyan-500/12 text-cyan-200 font-semibold'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {val ? 'ON' : 'OFF'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Audit Limits */}
          <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-3.5 space-y-3">
            <div className="text-xs font-semibold text-white">
              Limity Audytu &amp; Weryfikacji
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[11px]">
                  <label
                    htmlFor="mastery-limit-input"
                    className="font-medium text-slate-300"
                  >
                    Mastery Score Limit (Pipes / Seed)
                  </label>
                  <span className="font-mono text-[10px] text-emerald-300">
                    50–100k
                  </span>
                </div>
                <input
                  id="mastery-limit-input"
                  type="number"
                  min={50}
                  max={100000}
                  step={500}
                  disabled={isBusy}
                  value={sweepConfig.targetPipeCap}
                  onChange={(e) => handlePipeCapInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-sm font-semibold tabular-nums text-white focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                />
                <div className="mt-1.5 grid grid-cols-4 gap-1">
                  {SCORE_CAP_PRESETS.map((cap) => (
                    <button
                      key={cap}
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        onChangeConfig({ ...sweepConfig, targetPipeCap: cap })
                      }
                      className={`rounded border py-1 font-mono text-[10.5px] tabular-nums cursor-pointer transition-colors disabled:opacity-50 ${
                        sweepConfig.targetPipeCap === cap
                          ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cap >= 1000 ? `${cap / 1000}k` : cap}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
                    Unseen Stress-Test Seeds
                    <InfoTooltip
                      align="left"
                      label="About stress-test seeds"
                      text="Liczba deterministycznych, nigdy niewidzianych podczas treningu torów rur używanych do certyfikacji generalizacji."
                    />
                  </span>
                  <div className="grid grid-cols-3 gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
                    {[1, 3, 5].map((seeds) => (
                      <button
                        key={seeds}
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          onChangeConfig({
                            ...sweepConfig,
                            verificationSeeds: seeds,
                          })
                        }
                        className={`rounded py-1.5 font-mono text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 ${
                          sweepConfig.verificationSeeds === seeds
                            ? 'bg-slate-800 text-cyan-300'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {seeds} {seeds === 1 ? 'seed' : 'seeds'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Evolution Hyperparameters */}
          <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-3.5 space-y-3">
            <div className="text-xs font-semibold text-white">
              Hiperparametry Ewolucji
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[11px]">
                  <span className="font-medium text-slate-300">
                    Population Scale
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    ×{sweepConfig.populationSizes.length} w macierzy
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {ALL_POPULATIONS.map((pop) => {
                    const active = sweepConfig.populationSizes.includes(pop);
                    return (
                      <button
                        key={pop}
                        type="button"
                        disabled={isBusy}
                        onClick={() => togglePopulation(pop)}
                        className={`rounded-md border py-1.5 font-mono text-xs cursor-pointer transition-colors disabled:opacity-50 ${
                          active
                            ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {pop}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1 font-medium text-slate-300">
                    Mutation Sigma (σ)
                    <InfoTooltip
                      align="left"
                      label={bi('Kiedy warto testować wiele σ', 'When multiple σ values help')}
                      text={bi(
                        'Neuro-CMA, CEM i Adaptive ES same adaptują σ w trakcie ewolucji — zazwyczaj wystarczy jedna wartość (0.3).',
                        'Neuro-CMA, CEM, and Adaptive ES self-adapt σ during evolution — a single value (0.3) usually suffices.'
                      )}
                    />
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    CMA/CEM auto-adapt
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {ALL_MUTATION_STRENGTHS.map((str) => {
                    const active = sweepConfig.mutationStrengths.includes(str);
                    return (
                      <button
                        key={str}
                        type="button"
                        disabled={isBusy}
                        onClick={() => toggleMutationStrength(str)}
                        className={`rounded-md border py-1.5 font-mono text-xs cursor-pointer disabled:opacity-50 ${
                          active
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {str}
                      </button>
                    );
                  })}
                </div>
              </div>

              {hasRateUsingOptimizer && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-300">
                      Mutation Rate (GA / DE / Adaptive ES)
                    </span>
                    <span className="font-mono text-[10px] text-cyan-300">
                      {sweepConfig.mutationRates.length}×
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {ALL_MUTATION_RATES.map((rate) => {
                      const active = sweepConfig.mutationRates.includes(rate);
                      return (
                        <button
                          key={rate}
                          type="button"
                          disabled={isBusy}
                          onClick={() => toggleMutationRate(rate)}
                          className={`rounded-md border py-1.5 font-mono text-xs cursor-pointer disabled:opacity-50 ${
                            active
                              ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {rate}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <div className="mb-1.5 flex items-center justify-between text-[11px]">
                  <span className="font-medium text-slate-300">
                    {bi('Maks. pokoleń / próba', 'Max Gens / Trial')}
                  </span>
                  <span className="font-mono text-[10px] text-emerald-300">
                    {sweepConfig.maxGenerations === null
                      ? bi('∞ do perfekcji', '∞ to perfection')
                      : `Cap ${sweepConfig.maxGenerations}`}
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
                  {([25, 40, 60, 100, 250, null] as (number | null)[]).map((g) => (
                    <button
                      key={g === null ? 'unlim' : g}
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        onChangeConfig({ ...sweepConfig, maxGenerations: g })
                      }
                      className={`rounded py-1 font-mono text-[11px] whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 ${
                        sweepConfig.maxGenerations === g
                          ? g === null
                            ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                            : 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {g === null ? '∞' : g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-[11px]">
                  <span className="font-medium text-slate-300">
                    {bi('Stop przy stagnacji', 'Stagnation Early-Stop')}
                  </span>
                  <span className="font-mono text-[10px] text-amber-300">
                    {sweepConfig.stagnationLimit === null
                      ? 'Off'
                      : `${sweepConfig.stagnationLimit}g`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
                  {([null, 12, 15, 25] as (number | null)[]).map((stag) => (
                    <button
                      key={stag === null ? 'off' : stag}
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        onChangeConfig({ ...sweepConfig, stagnationLimit: stag })
                      }
                      className={`rounded py-1 font-mono text-[11px] whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 ${
                        sweepConfig.stagnationLimit === stag
                          ? 'bg-amber-500/20 text-amber-300 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {stag === null ? 'Off' : `${stag}g`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Weight Quantization (STE) — Clearly explained & separated from Legacy */}
          <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-white">
                Kwantyzacja wag (STE · {activePrecisions.length}/6)
                <InfoTooltip
                  align="left"
                  label="Czym jest kwantyzacja wag"
                  text="Symuluje kompresję wag sieci podczas lotu (FP32 = pełne 32 bity, INT8/INT4/1.58-bit/1-bit = skwantyzowane wagi pod mikrokontrolery). Domyślnie wystarczy samo FP32; zaznacz wiele, aby zbadać utratę jakości po kompresji."
                />
              </span>
              <span className="font-mono text-[10px] text-amber-300">
                {activePrecisions.map((p) => WEIGHT_PRECISION_META[p].shortLabel).join(' · ')}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {ALL_WEIGHT_PRECISIONS.map((prec) => {
                const meta = WEIGHT_PRECISION_META[prec];
                const active = activePrecisions.includes(prec);
                return (
                  <button
                    key={prec}
                    type="button"
                    disabled={isBusy}
                    title={meta.description}
                    onClick={() => togglePrecision(prec)}
                    className={`rounded-md border px-2 py-1.5 text-center font-mono text-[11px] cursor-pointer transition-colors disabled:opacity-50 ${
                      active
                        ? 'border-amber-500/55 bg-amber-500/15 text-amber-200 font-semibold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {meta.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </LabUtilityModal>

        {/* Dedicated Scenarios & Physics Popup Modal */}
        <LabUtilityModal
          open={showScenariosModal}
          onClose={() => setShowScenariosModal(false)}
          title={bi('Scenariusze & Fizyka Środowiska', 'Scenarios & Environment Physics')}
          subtitle={bi(
            'Wybierz zweryfikowane poziomy trudności lub skonfiguruj własną fizykę toru',
            'Select verified difficulty tiers or configure custom pipe physics'
          )}
          icon={<Layers className="h-4 w-4 text-emerald-300" />}
          maxWidthClass="max-w-2xl"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
                4 Verified Tiers + Overdrive &amp; Custom ({sweepConfig.difficulties.length}/{ALL_DIFFICULTIES.length})
                <InfoTooltip
                  align="left"
                  label={bi('O poziomach scenariuszy', 'About scenario tiers')}
                  text={bi(
                    '4 matematycznie udowodnione poziomy (Easy, Medium, Hard, Insane), ekstremalny Overdrive (RISK) oraz konfigurowalny Custom.',
                    '4 mathematically proven tiers (Easy, Medium, Hard, Insane), extreme Overdrive (RISK), plus configurable Custom physics.'
                  )}
                />
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                Rozwiązywalność:{' '}
                <span className="text-emerald-300 font-semibold">
                  {
                    sweepConfig.difficulties.filter((d) =>
                      verifyScenarioSolvability(
                        resolveEnvironment(d, sweepConfig.customEnvironment)
                      ).solvable
                    ).length
                  }
                  /{sweepConfig.difficulties.length} PROVEN
                </span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_DIFFICULTIES.map((diff) => {
                const active = sweepConfig.difficulties.includes(diff);
                const env = resolveEnvironment(
                  diff,
                  sweepConfig.customEnvironment
                );
                const meta = DIFFICULTY_META[diff];
                const proof = verifyScenarioSolvability(env);
                const activeStyle =
                  meta.tier === 'Calm'
                    ? 'border-emerald-500/55 bg-emerald-500/12 text-emerald-200'
                    : meta.tier === 'Moderate'
                      ? 'border-cyan-500/55 bg-cyan-500/12 text-cyan-200'
                      : meta.tier === 'Dynamic'
                        ? 'border-violet-500/55 bg-violet-500/12 text-violet-200'
                        : meta.tier === 'Frontier' || meta.tier === 'Extreme'
                          ? 'border-rose-500/55 bg-rose-500/12 text-rose-200'
                          : 'border-teal-500/55 bg-teal-500/12 text-teal-200';
                return (
                  <button
                    key={diff}
                    type="button"
                    disabled={isBusy}
                    title={`${meta.tier}: ${meta.description} · Proof: ${proof.summary}`}
                    onClick={() => toggleDifficulty(diff)}
                    className={`rounded-lg border px-3 py-2.5 text-left text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 ${
                      active
                        ? activeStyle
                        : 'border-slate-800 bg-[#0B1120] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold truncate">{env.label}</span>
                      <span
                        className={`font-mono text-[9.5px] uppercase tracking-wider shrink-0 ${
                          proof.solvable ? 'text-emerald-300' : 'text-amber-300'
                        }`}
                      >
                        {proof.solvable ? 'PROVEN' : 'RISK'}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[10.5px] text-slate-400 truncate">
                      {env.gap}px{env.gapVariance > 0 ? `±${env.gapVariance}` : ''}
                      {env.movingPipes ? ' · mov' : ''}
                      {env.speedVariability > 0
                        ? ` · ±${Math.round(env.speedVariability * 100)}%`
                        : env.gravityScale > 1.08
                          ? ` · ${env.gravityScale.toFixed(2)}g`
                          : ` · ${env.pipeSpeed.toFixed(1)}`}
                    </div>
                    <div className="mt-1 font-mono text-[9.5px] text-slate-500 truncate">
                      {proof.summary}
                    </div>
                  </button>
                );
              })}
            </div>

            {sweepConfig.difficulties.includes('CUSTOM') && (
              <div className="space-y-2.5 rounded-xl border border-emerald-500/35 bg-[#0B1120] p-3.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-300">
                    Custom Scenario Physics
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {verifyScenarioSolvability(activeCustomEnv).summary}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-slate-300">
                      <span>Gap</span>
                      <span className="font-mono">{activeCustomEnv.gap}px</span>
                    </div>
                    <input
                      type="range"
                      min={84}
                      max={176}
                      step={2}
                      disabled={isBusy}
                      value={activeCustomEnv.gap}
                      onChange={(e) =>
                        updateCustomEnvField('gap', Number(e.target.value))
                      }
                      className="lab-slider w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-300">
                      <span>Gap Var</span>
                      <span className="font-mono">
                        ±{activeCustomEnv.gapVariance}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={44}
                      step={2}
                      disabled={isBusy}
                      value={activeCustomEnv.gapVariance}
                      onChange={(e) =>
                        updateCustomEnvField(
                          'gapVariance',
                          Number(e.target.value)
                        )
                      }
                      className="lab-slider w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-300">
                      <span>Speed</span>
                      <span className="font-mono">
                        {activeCustomEnv.pipeSpeed.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2.0}
                      max={4.8}
                      step={0.1}
                      disabled={isBusy}
                      value={activeCustomEnv.pipeSpeed}
                      onChange={(e) =>
                        updateCustomEnvField('pipeSpeed', Number(e.target.value))
                      }
                      className="lab-slider w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-300">
                      <span>Gusts</span>
                      <span className="font-mono">
                        ±{Math.round(activeCustomEnv.speedVariability * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={0.65}
                      step={0.05}
                      disabled={isBusy}
                      value={activeCustomEnv.speedVariability}
                      onChange={(e) =>
                        updateCustomEnvField(
                          'speedVariability',
                          Number(e.target.value)
                        )
                      }
                      className="lab-slider w-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </LabUtilityModal>

        {/* Dedicated Research Presets Popup Modal */}
        <LabUtilityModal
          open={showPresetsModal}
          onClose={() => setShowPresetsModal(false)}
          title="Presety Badawcze"
          subtitle="19 gotowych konfiguracji eksperymentów"
          icon={<Sparkles className="h-4 w-4 text-amber-300" aria-hidden="true" />}
          maxWidthClass="max-w-4xl"
        >
          <div className="space-y-4">
            {(
              [
                {
                  cat: 'FRONTIER',
                  heading: 'Frontier & Lookahead Runs (Data-Driven)',
                  headingColor: 'text-amber-300',
                },
                {
                  cat: 'DIAGNOSTIC',
                  heading: 'Self-Test & Thermal Load Diagnostics',
                  headingColor: 'text-cyan-300',
                },
                {
                  cat: 'CLASSIC',
                  heading: 'Classic Compact Labs (≤50p)',
                  headingColor: 'text-slate-400',
                },
              ] as const
            ).map((group) => {
              const items = RESEARCH_PRESETS.filter(
                (p) => p.category === group.cat
              );
              return (
                <div key={group.cat} className="space-y-2">
                  <span
                    className={`block text-[11px] font-semibold ${group.headingColor}`}
                  >
                    {group.heading}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {items.map((preset) => {
                      const tone =
                        preset.accent === 'rose'
                          ? 'border-rose-500/45 bg-rose-500/10 text-rose-100 hover:border-rose-400'
                          : preset.accent === 'amber'
                            ? 'border-amber-500/45 bg-amber-500/10 text-amber-100 hover:border-amber-400'
                            : preset.accent === 'teal'
                              ? 'border-teal-500/45 bg-teal-500/10 text-teal-100 hover:border-teal-400'
                              : preset.accent === 'sky'
                                ? 'border-sky-500/45 bg-sky-500/10 text-sky-100 hover:border-sky-400'
                                : preset.accent === 'emerald'
                                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100 hover:border-emerald-400'
                                  : preset.accent === 'violet'
                                    ? 'border-violet-500/40 bg-violet-500/10 text-violet-100 hover:border-violet-400'
                                    : preset.accent === 'cyan'
                                      ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-100 hover:border-cyan-400'
                                      : 'border-slate-800 bg-[#0B1120] text-slate-200 hover:border-amber-500/50';
                      return (
                        <div
                          key={preset.id}
                          className={`group flex items-stretch rounded-lg border overflow-hidden transition-colors ${tone}`}
                        >
                          <button
                            type="button"
                            disabled={isBusy}
                            title={preset.description}
                            onClick={() => {
                              applyLoopPreset(preset.id);
                              setShowPresetsModal(false);
                            }}
                            className="flex-1 min-w-0 px-2.5 py-2 text-left text-xs cursor-pointer disabled:opacity-50"
                          >
                            <div className="font-semibold truncate">
                              {preset.title}
                            </div>
                            <div className="text-[10px] opacity-75 truncate">
                              {preset.subtitle}
                            </div>
                          </button>
                          <button
                            type="button"
                            title={`Dodaj "${preset.title}" bezpośrednio do kolejki eksperymentów`}
                            onClick={() => onEnqueuePreset(preset.id)}
                            className="shrink-0 border-l border-slate-700/60 bg-slate-950/40 px-2 font-mono text-[10px] font-semibold text-slate-300 cursor-pointer hover:bg-slate-900 hover:text-cyan-200"
                          >
                            +Q
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </LabUtilityModal>

        {/* Dedicated Global AI Optimizers Popup Modal */}
        <LabUtilityModal
          open={showOptimizersModal}
          onClose={() => setShowOptimizersModal(false)}
          title="Optymalizatory AI (Globalne)"
          subtitle="Wszystkie 12 architektur obsługuje ten sam zestaw 8 algorytmów ewolucyjnych i ES/Swarm"
          icon={<Cpu className="h-4 w-4 text-violet-300" aria-hidden="true" />}
          maxWidthClass="max-w-2xl"
        >
          <div className="space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-medium text-slate-300">
                Aktywne metody ({activeGlobalAlgorithms.length}/8)
              </span>
              <div className="flex items-center gap-2 font-mono text-[10.5px]">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    setGlobalAlgorithmsPreset([...CORE_OPTIMIZER_ALGORITHMS])
                  }
                  className="text-emerald-300 hover:text-emerald-200 cursor-pointer disabled:opacity-50"
                >
                  Tylko Core 3
                </button>
                <span className="text-slate-600">·</span>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setGlobalAlgorithmsPreset([...ALL_ALGORITHMS])}
                  className="text-cyan-300 hover:text-cyan-200 cursor-pointer disabled:opacity-50"
                >
                  Wszystkie 8
                </button>
                <span className="text-slate-600">·</span>
                <button
                  type="button"
                  onClick={() => setShowExtendedOptimizers((v) => !v)}
                  className="text-violet-300 hover:text-violet-200 cursor-pointer"
                >
                  {showExtendedOptimizers ||
                  activeGlobalAlgorithms.some((a) =>
                    EXTENDED_OPTIMIZER_ALGORITHMS.includes(a)
                  )
                    ? 'Zwiń +5'
                    : 'Pokaż +5 ES/Swarm'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {CORE_OPTIMIZER_ALGORITHMS.map((algo) => {
                const active = activeGlobalAlgorithms.includes(algo);
                const roleMeta = OPTIMIZER_ROLE_BADGES[algo];
                return (
                  <button
                    key={algo}
                    type="button"
                    disabled={isBusy}
                    title={roleMeta.shortNote}
                    onClick={() => toggleGlobalAlgorithm(algo)}
                    className={`rounded-lg border px-3 py-2.5 text-left text-xs cursor-pointer transition-colors disabled:opacity-50 ${
                      active
                        ? 'border-cyan-500/55 bg-cyan-500/12 text-cyan-200'
                        : 'border-slate-800 bg-[#0B1120] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-semibold">
                      {ALGORITHM_SHORT_LABELS[algo]}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-slate-400">
                      {roleMeta.badge}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500 leading-snug">
                      {roleMeta.shortNote}
                    </div>
                  </button>
                );
              })}
            </div>

            {(showExtendedOptimizers ||
              activeGlobalAlgorithms.some((a) =>
                EXTENDED_OPTIMIZER_ALGORITHMS.includes(a)
              )) && (
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <span className="block text-[11px] font-medium text-slate-400">
                  Rozszerzone metody ES / Swarm (+5)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {EXTENDED_OPTIMIZER_ALGORITHMS.map((algo) => {
                    const active = activeGlobalAlgorithms.includes(algo);
                    const roleMeta = OPTIMIZER_ROLE_BADGES[algo];
                    return (
                      <button
                        key={algo}
                        type="button"
                        disabled={isBusy}
                        title={roleMeta.shortNote}
                        onClick={() => toggleGlobalAlgorithm(algo)}
                        className={`rounded-lg border px-3 py-2 text-left text-xs cursor-pointer transition-colors disabled:opacity-50 ${
                          active
                            ? 'border-violet-500/55 bg-violet-500/15 text-violet-200'
                            : 'border-slate-800 bg-[#0B1120] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold truncate">
                            {ALGORITHM_SHORT_LABELS[algo]}
                          </span>
                          <span className="font-mono text-[9.5px] text-slate-400 shrink-0">
                            {roleMeta.badge}
                          </span>
                        </div>
                        <div className="mt-1 text-[10px] text-slate-500 leading-snug">
                          {roleMeta.shortNote}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </LabUtilityModal>
      </section>
    );
  }
);
