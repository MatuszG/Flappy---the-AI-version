import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { resolveMorphogenesisConfig } from '../engine/morphogenesis';
import {
  ALL_ARCHITECTURES,
  ARCHITECTURE_META,
  calculateParameterCount,
  estimateArchitectureFlops,
  formatTopologyLabel,
  getTrialComputeProfile,
  normalizeHiddenLayers,
} from '../engine/neuralNetwork';
import {
  CORE_OPTIMIZER_ALGORITHMS,
  EXTENDED_OPTIMIZER_ALGORITHMS,
  OPTIMIZER_PARAM_SUPPORT,
  OPTIMIZER_ROLE_BADGES,
} from '../engine/optimizers';
import { verifyScenarioSolvability } from '../engine/physics';
import {
  ALL_SENSOR_FEATURES,
  formatInputSubsetLabel,
  INPUT_SUBSET_PRESETS,
  normalizeInputFeatures,
  SENSOR_METADATA,
} from '../engine/sensors';
import {
  ALL_DIFFICULTIES_ORDERED,
  DIFFICULTY_META,
  DIFFICULTY_SETTINGS,
  resolveEnvironment,
} from '../engine/simulation';
import type {
  EnvironmentConfig,
  EvolutionConfig,
  LearningAlgorithm,
  SensorFeatureId,
} from '../engine/types';
import { useLanguage } from '../i18n/LanguageContext';
import { getDifficultyText, getSensorText } from '../i18n/catalog';
import { InfoTooltip } from './InfoTooltip';
import { TopologyDiagram } from './research/TopologyDiagram';

interface EvolutionControlsProps {
  config: EvolutionConfig;
  onChange: (next: EvolutionConfig) => void;
  onLoadFruitFlyPreset?: () => void;
  onLoadDecoupledCortexPreset?: () => void;
}

const ALGORITHMS: { id: LearningAlgorithm; label: string; desc: string }[] = [
  { id: 'GA', label: 'GA', desc: 'Tournament selection, crossover & Gaussian mutation' },
  { id: 'NATURAL_ES', label: 'Natural ES', desc: 'Antithetic mirrored Gaussian gradient ES' },
  { id: 'ADAM_ES', label: 'Adam-ES', desc: 'Natural ES with Adam first & second momentum' },
  { id: 'ADAPTIVE_ES', label: 'Adaptive ES', desc: '(1+λ) self-adaptive sigma step control' },
  { id: 'CEM', label: 'CEM', desc: 'Cross-Entropy Method distribution fitting' },
  { id: 'DE', label: 'Diff. Evol.', desc: 'Differential Evolution (DE/best/1/bin)' },
  { id: 'PSO', label: 'PSO', desc: 'Particle Swarm Optimization with pBest/gBest' },
  { id: 'CMA_HYBRID', label: 'Neuro-CMA', desc: 'Custom Sep-CMA-ES + antithetic + elite DE polisher' },
];

const SCENARIOS = ALL_DIFFICULTIES_ORDERED.map((id) => ({
  id,
  label: DIFFICULTY_META[id].shortLabel,
  tier: DIFFICULTY_META[id].tier,
  tierPl: DIFFICULTY_META[id].tierPl,
  desc: DIFFICULTY_META[id].description,
  descPl: DIFFICULTY_META[id].descriptionPl,
}));

const TOPOLOGY_PRESETS: { label: string; layers: number[] }[] = [
  { label: 'Lin', layers: [] },
  { label: '4', layers: [4] },
  { label: '8', layers: [8] },
  { label: '4·4', layers: [4, 4] },
  { label: '6·2', layers: [6, 2] },
  { label: '8·4', layers: [8, 4] },
  { label: '6·6·4', layers: [6, 6, 4] },
];

export function EvolutionControls({
  config,
  onChange,
  onLoadFruitFlyPreset,
  onLoadDecoupledCortexPreset,
}: EvolutionControlsProps) {
  const { lang, t } = useLanguage();
  const [showExtendedOptimizers, setShowExtendedOptimizers] = useState(false);
  const hiddenLayers = normalizeHiddenLayers(
    config.hiddenLayers !== undefined ? config.hiddenLayers : config.hiddenNodes
  );
  const activeInputs = normalizeInputFeatures(config.inputFeatures);
  const inputCount = activeInputs.length;
  const activeArch = config.architecture ?? 'MLP';
  const paramCount = calculateParameterCount(hiddenLayers, inputCount, 1, activeArch);
  const topoLabel = formatTopologyLabel(hiddenLayers, inputCount);
  const activeRouteProfile = getTrialComputeProfile(activeArch, 'SINGLE_SPECIES');
  const activeEstFlops = Math.round(
    estimateArchitectureFlops(hiddenLayers, inputCount, activeArch, config.reasoningSteps ?? 3)
  );

  const activeEnv = resolveEnvironment(config.difficulty, config.customEnvironment);
  const envProof = verifyScenarioSolvability(activeEnv);
  const paramSupport = OPTIMIZER_PARAM_SUPPORT[config.algorithm];
  const morphCfg = resolveMorphogenesisConfig(config.morphogenesisConfig);
  const isArenaMode = config.evolutionTopologyMode === 'ISLAND_SPECIATION';
  const hasFlyCortexActive =
    activeArch === 'DECOUPLED_FLY_CORTEX' ||
    (isArenaMode &&
      (!config.islandSpecies ||
        config.islandSpecies.includes('DECOUPLED_FLY_CORTEX')));
  const hasMoeActive =
    activeArch === 'HYBRID_MOE' ||
    (isArenaMode &&
      (!config.islandSpecies || config.islandSpecies.includes('HYBRID_MOE')));
  const hasReasoningKActive =
    activeArch === 'LOOPED_REASONER' ||
    activeArch === 'PONDER_ACT' ||
    activeArch === 'HYBRID_MOE' ||
    isArenaMode;
  const isExtendedOptimizerActive = EXTENDED_OPTIMIZER_ALGORITHMS.includes(
    config.algorithm
  );

  const toggleSensor = (sensor: SensorFeatureId) => {
    if (!activeEnv.movingPipes && (sensor === 'PIPE_VY' || sensor === 'NEXT_PIPE_VY')) {
      return;
    }
    const exists = activeInputs.includes(sensor);
    const next = exists
      ? activeInputs.filter((s) => s !== sensor)
      : [...activeInputs, sensor];
    if (next.length === 0) return;
    if (!next.includes('TOP_CLEAR') && !next.includes('BOT_CLEAR')) {
      return;
    }
    onChange({
      ...config,
      inputFeatures: normalizeInputFeatures(next),
    });
  };

  const updateField = <K extends keyof EvolutionConfig>(
    key: K,
    value: EvolutionConfig[K]
  ) => {
    onChange({ ...config, [key]: value });
  };

  const applyLayers = (nextLayers: number[]) => {
    const clean = normalizeHiddenLayers(nextLayers);
    const totalHidden =
      clean.length === 1 ? clean[0] : clean.reduce((a, b) => a + b, 0);
    onChange({
      ...config,
      hiddenLayers: clean,
      hiddenNodes: totalHidden,
    });
  };

  const updateCustomEnv = <K extends keyof EnvironmentConfig>(
    key: K,
    value: EnvironmentConfig[K]
  ) => {
    const base =
      config.difficulty === 'CUSTOM' && config.customEnvironment
        ? config.customEnvironment
        : { ...DIFFICULTY_SETTINGS[config.difficulty], label: 'Custom' };
    onChange({
      ...config,
      difficulty: 'CUSTOM',
      customEnvironment: {
        ...base,
        label: 'Custom',
        [key]: value,
      },
    });
  };

  const layersMatch = (a: number[], b: number[]) =>
    a.length === b.length && a.every((v, i) => v === b[i]);

  return (
    <div className="space-y-4">
      <div className="border-b border-slate-800/80 pb-3">
        <h2 className="font-display text-base font-semibold text-slate-100">
          {t('training.evolutionTopologyPhysicsControls')}
        </h2>
        <p className="text-xs text-slate-400">
          {t('training.hyperparametersApplyNextGenChanging')}
        </p>
      </div>

      {/* Learning Algorithm — Two-Tier Consolidated Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
            {t('training.aiOptimizationMethodCore3')}
            <InfoTooltip
              align="left"
              label={t('training.aboutConsolidatedOptimizationTiers')}
              text={t('training.k26700EmpiricalTrialsProved')}
            />
          </span>
          <button
            type="button"
            onClick={() => setShowExtendedOptimizers((prev) => !prev)}
            className="font-mono text-[10px] text-cyan-300 hover:text-cyan-200 cursor-pointer"
          >
            {showExtendedOptimizers || isExtendedOptimizerActive
              ? t('training.hideExtendedEs')
              : t('training.k5ExtendedEsSwarm')}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {CORE_OPTIMIZER_ALGORITHMS.map((algId) => {
            const algMeta = ALGORITHMS.find((a) => a.id === algId)!;
            const roleMeta = OPTIMIZER_ROLE_BADGES[algId];
            const active = config.algorithm === algId;
            return (
              <button
                key={algId}
                type="button"
                title={roleMeta.shortNote}
                onClick={() => updateField('algorithm', algId)}
                className={`rounded-lg border px-2 py-1.5 text-left cursor-pointer transition-colors ${
                  active
                    ? 'border-cyan-500/55 bg-cyan-500/15 text-cyan-200'
                    : 'border-slate-800 bg-[#0B1120] text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="text-[11px] font-semibold truncate">
                  {algMeta.label}
                </div>
                <div className="font-mono text-[9.5px] text-slate-400 truncate">
                  {roleMeta.badge}
                </div>
              </button>
            );
          })}
        </div>

        {(showExtendedOptimizers || isExtendedOptimizerActive) && (
          <div className="grid grid-cols-5 gap-1 rounded-lg border border-slate-800 bg-slate-900/90 p-1">
            {EXTENDED_OPTIMIZER_ALGORITHMS.map((algId) => {
              const algMeta = ALGORITHMS.find((a) => a.id === algId)!;
              const roleMeta = OPTIMIZER_ROLE_BADGES[algId];
              const active = config.algorithm === algId;
              return (
                <button
                  key={algId}
                  type="button"
                  title={roleMeta.shortNote}
                  onClick={() => updateField('algorithm', algId)}
                  className={`rounded-md py-1 px-1 text-[10.5px] font-medium whitespace-nowrap truncate cursor-pointer transition-colors ${
                    active
                      ? 'bg-violet-500/20 text-violet-200 border border-violet-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {algMeta.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Realistic Compound-Eye Pixel Perception & Non-Stationary Anomaly Zones */}
      <div className="space-y-2 rounded-lg border border-slate-800 bg-[#0B1120]/70 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-200">
            {t('training.perceptionNonStationaryWorld')}
            <InfoTooltip
              align="left"
              label={t('training.aboutCompoundEyeRetinalPixels')}
              text={t('training.replacesExactLaboratoryTelemetryWith')}
            />
          </span>
          <span className="font-mono text-[10px] text-emerald-300">
            {(config.perceptionMode ?? 'GEOMETRIC_LAB') === 'COMPOUND_EYE_PIXELS'
              ? '16-Ray Ommatidia'
              : t('training.exactLab')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-md border border-slate-800 bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => updateField('perceptionMode', 'GEOMETRIC_LAB')}
            className={`rounded py-1 font-mono text-[10.5px] font-medium cursor-pointer transition-colors ${
              (config.perceptionMode ?? 'GEOMETRIC_LAB') === 'GEOMETRIC_LAB'
                ? 'bg-slate-800 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('training.labTelemetryExact')}
          </button>
          <button
            type="button"
            onClick={() => updateField('perceptionMode', 'COMPOUND_EYE_PIXELS')}
            className={`rounded py-1 font-mono text-[10.5px] font-medium cursor-pointer transition-colors ${
              config.perceptionMode === 'COMPOUND_EYE_PIXELS'
                ? 'bg-emerald-500/20 text-emerald-200 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('training.compoundEyePixels')}
          </button>
        </div>

        {config.perceptionMode === 'COMPOUND_EYE_PIXELS' && (
          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">
                {t('training.opticalContrastNoiseGlare')}
              </span>
              <span className="font-mono tabular-nums text-emerald-300">
                {Math.round((config.opticalNoiseLevel ?? 0.04) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={0.35}
              step={0.01}
              value={config.opticalNoiseLevel ?? 0.04}
              onChange={(e) =>
                updateField('opticalNoiseLevel', Number(e.target.value))
              }
              className="lab-slider w-full"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-1.5 pt-0.5 font-mono text-[10px]">
          <button
            type="button"
            title={t('training.periodicInFlightGravityContrast')}
            onClick={() =>
              updateField(
                'nonStationaryAnomalies',
                !config.nonStationaryAnomalies
              )
            }
            className={`rounded border px-2 py-1 text-left cursor-pointer transition-colors ${
              config.nonStationaryAnomalies
                ? 'border-amber-500/50 bg-amber-500/15 text-amber-200'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('training.anomalies')} {config.nonStationaryAnomalies ? 'ON (0.78–1.22g)' : 'OFF'}
          </button>
          <button
            type="button"
            disabled={!hasFlyCortexActive}
            title={
              !hasFlyCortexActive
                ? t('training.onlineDopamineDaPlasticityApplies')
                : t('training.onlineLifetimeDopaminePlasticityUpda')
            }
            onClick={() =>
              updateField('onlinePlasticity', !config.onlinePlasticity)
            }
            className={`rounded border px-2 py-1 text-left cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              hasFlyCortexActive &&
              (config.onlinePlasticity || activeArch === 'DECOUPLED_FLY_CORTEX')
                ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('training.onlineDaPlasticity')}{' '}
            {!hasFlyCortexActive
              ? 'N/A (Fly-Cortex)'
              : config.onlinePlasticity || activeArch === 'DECOUPLED_FLY_CORTEX'
                ? 'ON'
                : 'OFF'}
          </button>
        </div>
      </div>

      {/* Sensor Input Selection (Geometric Lab Pool vs 16-Ray Optic Lobe Streams) */}
      {config.perceptionMode === 'COMPOUND_EYE_PIXELS' ? (
        <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-[#0B1120]/80 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-200">
              {t('training.opticLobeStreamsFrom16')}
              <InfoTooltip
                align="left"
                label={t('training.whyAreGeometricSensorsReplaced')}
                text={t('training.in16RayRetinaMode')}
              />
            </span>
            <span className="font-mono text-[11px] tabular-nums text-emerald-300">
              16-Ray → {activeInputs.length} ch
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {activeInputs.map((id) => {
              const meta = SENSOR_METADATA[id];
              return (
                <span
                  key={id}
                  title={getSensorText(lang, id).opticalDesc}
                  className="rounded border border-emerald-500/35 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-200"
                >
                  {meta.opticalShortLabel}
                </span>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-1 pt-0.5">
            {(
              [
                {
                  label: t('training.k5StreamsNearField'),
                  features: ['BIRD_Y', 'VEL_VY', 'PIPE_DX', 'TOP_CLEAR', 'BOT_CLEAR'] as SensorFeatureId[],
                },
                {
                  label: t('training.k6StreamsT4T5Motion'),
                  features: ['BIRD_Y', 'VEL_VY', 'PIPE_DX', 'TOP_CLEAR', 'BOT_CLEAR', 'PIPE_VY'] as SensorFeatureId[],
                },
                {
                  label: t('training.k8StreamsFarField2'),
                  features: [
                    'VEL_VY',
                    'PIPE_DX',
                    'TOP_CLEAR',
                    'BOT_CLEAR',
                    'PIPE_VY',
                    'NEXT_TOP_CLEAR',
                    'NEXT_BOT_CLEAR',
                    'NEXT_PIPE_DX',
                  ] as SensorFeatureId[],
                },
                {
                  label: t('training.k12StreamsFullLobeTau'),
                  features: [...ALL_SENSOR_FEATURES],
                },
              ] as const
            ).map((opt) => {
              const isMatch = activeInputs.length === opt.features.length;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() =>
                    onChange({ ...config, inputFeatures: [...opt.features] })
                  }
                  className={`rounded border px-2 py-1 font-mono text-[10px] cursor-pointer transition-colors ${
                    isMatch
                      ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-200 font-semibold'
                      : 'border-slate-800 bg-slate-900/90 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-2 rounded-lg border border-slate-800 bg-[#0B1120]/70 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-200">
              {t('training.sensorInputs112Pool')}
              <InfoTooltip
                align="left"
                label={t('training.about12SensorDualPipe')}
                text={t('training.pipe1DxTopBot')}
              />
            </span>
            <span className="font-mono text-[11px] tabular-nums text-cyan-300">
              {formatInputSubsetLabel(activeInputs)}
            </span>
          </div>

          <div className="grid grid-cols-6 gap-1">
            {ALL_SENSOR_FEATURES.map((id) => {
              const meta = SENSOR_METADATA[id];
              const active = activeInputs.includes(id);
              const staticBlocked =
                !activeEnv.movingPipes && (id === 'PIPE_VY' || id === 'NEXT_PIPE_VY');
              const isLastClearance =
                active &&
                (id === 'TOP_CLEAR' || id === 'BOT_CLEAR') &&
                activeInputs.filter((s) => s === 'TOP_CLEAR' || s === 'BOT_CLEAR')
                  .length === 1;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={staticBlocked || isLastClearance}
                  title={
                    staticBlocked
                      ? t('training.disabledForStaticPipes', { label: meta.label })
                      : isLastClearance
                        ? t('training.requiresAtLeast1Gap2')
                        : `${meta.label}: ${getSensorText(lang, id).description}`
                  }
                  onClick={() => toggleSensor(id)}
                  className={`rounded-md border py-1 text-center font-mono text-[10px] font-medium cursor-pointer transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${
                    active
                      ? meta.group === 'PIPE_2' || id === 'PIPE_TTF'
                        ? 'border-amber-500/50 bg-amber-500/15 text-amber-200'
                        : 'border-cyan-500/50 bg-cyan-500/15 text-cyan-200'
                      : 'border-slate-800 bg-[#0B1120] text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {meta.shortLabel}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-1">
            {INPUT_SUBSET_PRESETS.slice(0, 7).map((preset) => (
              <button
                key={preset.id}
                type="button"
                title={preset.rationale}
                onClick={() =>
                  onChange({ ...config, inputFeatures: [...preset.features] })
                }
                className="rounded border border-slate-800 bg-slate-900/90 px-2 py-0.5 font-mono text-[10px] text-slate-400 cursor-pointer hover:border-cyan-500/40 hover:text-cyan-200"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Depth & Width Topology Builder + Live SVG Diagram */}
      <div className="space-y-2.5 rounded-lg border border-slate-800 bg-[#0B1120]/70 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-200">
            {t('training.networkTopologyDepthWidth')}
            <InfoTooltip
              align="left"
              label={t('training.aboutTopology')}
              text={t('training.controlsHiddenLayersAndNeurons')}
            />
          </span>
          <span className="font-mono tabular-nums text-emerald-300">
            {topoLabel} · {paramCount} {t('training.params')}
          </span>
        </div>

        <TopologyDiagram
          inputCount={inputCount}
          hiddenLayers={hiddenLayers}
          architecture={activeArch}
          paramCount={paramCount}
        />

        <div className="grid grid-cols-4 gap-1">
          {TOPOLOGY_PRESETS.map((preset) => {
            const skipLinearDisabled =
              activeArch === 'RESIDUAL_SKIP' && preset.layers.length === 0;
            return (
              <button
                key={preset.label}
                type="button"
                disabled={skipLinearDisabled}
                title={
                  skipLinearDisabled
                    ? t('training.residualSkipAtDepth02')
                    : undefined
                }
                onClick={() => {
                  if (skipLinearDisabled) return;
                  applyLayers(preset.layers);
                }}
                className={`rounded-md border py-1 font-mono text-[11px] cursor-pointer transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${
                  layersMatch(hiddenLayers, preset.layers)
                    ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-200'
                    : 'border-slate-800 bg-[#0B1120] text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset.layers.length === 0
                  ? t('training.linearParamsChip', { count: inputCount + 1 })
                  : preset.label}
              </button>
            );
          })}
          <button
            type="button"
            disabled={hiddenLayers.length >= 4}
            onClick={() => applyLayers([...hiddenLayers, 4])}
            className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-700 bg-slate-800/80 py-1 text-[11px] font-medium text-slate-200 cursor-pointer hover:border-emerald-500/50 disabled:opacity-40"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
            {t('training.layer')}
          </button>
        </div>

        {hiddenLayers.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {hiddenLayers.map((width, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="w-20 font-mono text-[11px] text-slate-400">
                  {t('training.layerH', { val0: idx + 1 })}
                </span>
                <input
                  type="range"
                  min={1}
                  max={64}
                  step={1}
                  value={width}
                  onChange={(e) => {
                    const next = [...hiddenLayers];
                    next[idx] = Number(e.target.value);
                    applyLayers(next);
                  }}
                  aria-label={`Hidden layer ${idx + 1} width`}
                  className="lab-slider flex-1"
                />
                <span className="w-12 text-right font-mono tabular-nums text-cyan-300">
                  {width} {t('training.neur')}
                </span>
                <button
                  type="button"
                  title={t('training.removeLayer')}
                  onClick={() => applyLayers(hiddenLayers.filter((_, i) => i !== idx))}
                  className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-red-400 cursor-pointer"
                >
                  <Minus className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Neuron & Reasoning Architecture */}
      <div className="space-y-2 rounded-lg border border-slate-800 bg-[#0B1120]/70 p-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium text-slate-200 truncate">
            {t('training.architectureBioMoe')}
          </span>
          <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] tabular-nums">
            <span
              title={ARCHITECTURE_META[activeArch].routingReason}
              className={`rounded border px-1.5 py-0.5 whitespace-nowrap ${
                activeRouteProfile === 'CPU_SPECIALIZED'
                  ? 'border-amber-500/45 bg-amber-500/10 text-amber-200'
                  : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
              }`}
            >
              {activeRouteProfile === 'CPU_SPECIALIZED'
                ? '◇ CPU-Only'
                : '◆ GPU Lockstep'}
            </span>
            <span className="text-slate-400">~{activeEstFlops} FLOPs/f</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {ALL_ARCHITECTURES.map((arch) => {
            const meta = ARCHITECTURE_META[arch];
            const active = activeArch === arch;
            const isCpuOnly = meta.computeProfile === 'CPU_SPECIALIZED';
            return (
              <button
                key={arch}
                type="button"
                title={`${meta.description} (${meta.routingReason})`}
                onClick={() => {
                  if (arch === 'RESIDUAL_SKIP' && hiddenLayers.length === 0) {
                    onChange({
                      ...config,
                      architecture: arch,
                      hiddenLayers: [4],
                      hiddenNodes: 4,
                    });
                    return;
                  }
                  updateField('architecture', arch);
                }}
                className={`rounded-md border px-1.5 py-1 text-[10px] font-medium truncate cursor-pointer transition-colors ${
                  active
                    ? isCpuOnly
                      ? 'border-amber-500/55 bg-amber-500/15 text-amber-200'
                      : 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200'
                    : 'border-slate-800 bg-[#0B1120] text-slate-400 hover:text-slate-200'
                }`}
              >
                {isCpuOnly ? '◇ ' : ''}{meta.shortLabel}
              </button>
            );
          })}
        </div>
        {activeArch === 'HYBRID_MOE' && (
          <p className="font-mono text-[10px] leading-snug text-amber-200/90">
            {t('training.startsAsLeanMlpCore')}
          </p>
        )}
        {activeArch === 'DROSOPHILA_CONNECTOME' && (
          <p className="font-mono text-[10px] leading-snug text-amber-200/90">
            {t('training.fruitFlyConnectomeWebgpuLockstep')}
          </p>
        )}
        {activeArch === 'DECOUPLED_FLY_CORTEX' && (
          <p className="font-mono text-[10px] leading-snug text-emerald-200/90">
            {t('training.decoupledReasoningVsKnowledgeBrain')}
          </p>
        )}
        <div className="grid grid-cols-1 gap-1.5">
          {onLoadFruitFlyPreset && (
            <button
              type="button"
              onClick={onLoadFruitFlyPreset}
              className="w-full rounded-md border border-amber-500/45 bg-amber-500/12 px-2.5 py-1.5 font-mono text-[10.5px] font-semibold text-amber-200 cursor-pointer transition-colors hover:border-amber-400 hover:bg-amber-500/20"
            >
              {t('training.loadFruitFlyDrosophila6')}
            </button>
          )}
          {onLoadDecoupledCortexPreset && (
            <button
              type="button"
              onClick={onLoadDecoupledCortexPreset}
              className="w-full rounded-md border border-emerald-500/45 bg-emerald-500/12 px-2.5 py-1.5 font-mono text-[10.5px] font-semibold text-emerald-200 cursor-pointer transition-colors hover:border-emerald-400 hover:bg-emerald-500/20"
            >
              {t('training.loadDecoupledFlyCortexCompound')}
            </button>
          )}
        </div>
        {(activeArch === 'LOOPED_REASONER' ||
          activeArch === 'PONDER_ACT' ||
          activeArch === 'HYBRID_MOE') && (
          <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
            <span className="text-slate-400">
              {t('training.thinkingStepsK')}
            </span>
            <div className="flex gap-1">
              {[2, 3, 4].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => updateField('reasoningSteps', k)}
                  className={`rounded border px-2 py-0.5 font-mono text-[10px] cursor-pointer ${
                    (config.reasoningSteps ?? 3) === k
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                      : 'border-slate-800 bg-[#0B1120] text-slate-400'
                  }`}
                >
                  K={k}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Self-Growing Morphogenesis Toggle (Playground) */}
      <div className="space-y-2 rounded-lg border border-slate-800 bg-[#0B1120]/70 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-200">
            {t('training.selfGrowingMorphogenesis')}
            <InfoTooltip
              align="left"
              label={t('training.aboutSelfGrowingMorphogenesis')}
              text={t('training.startsFromACompactSeedling')}
            />
          </span>
          <button
            type="button"
            onClick={() => updateField('morphogenesis', !config.morphogenesis)}
            className={`rounded border px-2.5 py-0.5 font-mono text-[11px] font-medium cursor-pointer transition-colors ${
              config.morphogenesis
                ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            {config.morphogenesis ? t('training.active') : t('training.static')}
          </button>
        </div>
        {config.morphogenesis && (
          <div className="grid grid-cols-2 gap-1.5 pt-1 font-mono text-[10px] text-slate-300">
            <button
              type="button"
              onClick={() =>
                updateField('morphogenesisConfig', {
                  ...morphCfg,
                  progressiveSensors: !morphCfg.progressiveSensors,
                })
              }
              className={`rounded border px-2 py-1 text-left cursor-pointer ${
                morphCfg.progressiveSensors
                  ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
                  : 'border-slate-800 bg-slate-950 text-slate-400'
              }`}
            >
              {t('training.sensors2')}{' '}
              {morphCfg.progressiveSensors
                ? t('training.waveUnlock')
                : t('training.allGen0')}
            </button>
            <button
              type="button"
              onClick={() =>
                updateField('morphogenesisConfig', {
                  ...morphCfg,
                  initialWidthRatio: morphCfg.initialWidthRatio <= 0.35 ? 0.5 : 0.33,
                })
              }
              className="rounded border border-slate-800 bg-slate-950 px-2 py-1 text-left text-slate-300 cursor-pointer hover:border-cyan-500/40"
            >
              {t('training.seedling')} {Math.round(morphCfg.initialWidthRatio * 100)}% {t('training.width')}
            </button>
            {hasMoeActive && (
              <button
                type="button"
                title={t('training.toggleComputeJustifiedExpertModule')}
                onClick={() =>
                  updateField('morphogenesisConfig', {
                    ...morphCfg,
                    allowExpertSpawning: !(morphCfg.allowExpertSpawning ?? true),
                  })
                }
                className={`rounded border px-2 py-1 text-left cursor-pointer ${
                  (morphCfg.allowExpertSpawning ?? true)
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                {t('training.experts')}{' '}
                {(morphCfg.allowExpertSpawning ?? true) ? 'Auto-Spawn' : 'Locked'}
              </button>
            )}
            {hasReasoningKActive && (
              <button
                type="button"
                title={t('training.startAtK1Fast')}
                onClick={() =>
                  updateField('morphogenesisConfig', {
                    ...morphCfg,
                    growReasoningSteps: !morphCfg.growReasoningSteps,
                  })
                }
                className={`rounded border px-2 py-1 text-left cursor-pointer ${
                  morphCfg.growReasoningSteps
                    ? 'border-emerald-500/45 bg-emerald-500/10 text-emerald-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                {t('training.stepsK')}{' '}
                {morphCfg.growReasoningSteps ? '1→maxK' : t('training.fixedK')}
              </button>
            )}
            <button
              type="button"
              title={t('training.cycleFlopsComputePenaltyPer')}
              onClick={() => {
                const cur = morphCfg.flopsPenaltyWeight ?? 0.004;
                const next = cur === 0.004 ? 0.01 : cur === 0.01 ? 0 : 0.004;
                updateField('morphogenesisConfig', {
                  ...morphCfg,
                  flopsPenaltyWeight: next,
                });
              }}
              className="rounded border border-slate-800 bg-slate-950 px-2 py-1 text-left text-slate-300 cursor-pointer hover:border-amber-500/40"
            >
              {t('training.flopsPen')} {(morphCfg.flopsPenaltyWeight ?? 0.004).toFixed(3)}
            </button>
          </div>
        )}
      </div>

      {/* Population & Mutation Sliders */}
      <div className="space-y-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <label
              htmlFor="pop-slider"
              className="inline-flex items-center gap-1.5 font-medium text-slate-300"
            >
              {t('training.populationSize')}
              <InfoTooltip
                align="left"
                label={t('training.aboutPopulationSize')}
                text={t('training.numberOfCandidateNeuralNetworks')}
              />
            </label>
            <span className="font-mono tabular-nums text-cyan-300">
              {config.populationSize} {t('training.birds')}
            </span>
          </div>
          <input
            id="pop-slider"
            type="range"
            min={20}
            max={500}
            step={10}
            value={config.populationSize}
            onChange={(e) => updateField('populationSize', Number(e.target.value))}
            className="lab-slider w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {paramSupport.usesMutationRate ? (
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <label
                  htmlFor="mut-rate-slider"
                  className="inline-flex items-center gap-1 font-medium text-slate-300"
                >
                  {paramSupport.mutationRateLabel}
                  <InfoTooltip
                    align="left"
                    label={t('training.aboutMutationProbability')}
                    text={t('training.probabilityEachIndividualWeightIs')}
                  />
                </label>
                <span className="font-mono tabular-nums text-cyan-300">
                  {Math.round(config.mutationRate * 100)}%
                </span>
              </div>
              <input
                id="mut-rate-slider"
                type="range"
                min={0.02}
                max={0.45}
                step={0.01}
                value={config.mutationRate}
                onChange={(e) =>
                  updateField('mutationRate', Number(e.target.value))
                }
                className="lab-slider w-full"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-slate-800/90 bg-[#0B1120] px-2.5 py-2 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-300">
                  {t('training.perturbationMode')}
                </span>
                <span className="font-mono text-[10px] text-cyan-300">
                  {t('training.k100Dense')}
                </span>
              </div>
              <p className="mt-1 font-mono text-[9.5px] leading-snug text-slate-400">
                {paramSupport.rateDisabledReason ??
                  t('training.continuousCovarianceGradientStepUpda')}
              </p>
            </div>
          )}

          <div
            title={
              !paramSupport.usesMutationStrength
                ? paramSupport.strengthDisabledReason
                : undefined
            }
            className={
              !paramSupport.usesMutationStrength
                ? 'opacity-45 cursor-not-allowed select-none'
                : ''
            }
          >
            <div className="mb-1 flex items-center justify-between text-xs">
              <label
                htmlFor="mut-str-slider"
                className="inline-flex items-center gap-1 font-medium text-slate-300"
              >
                {paramSupport.mutationStrengthLabel}
                <InfoTooltip
                  align="right"
                  label={t('training.aboutMutationSigma')}
                  text={t('training.gaussianPerturbationScaleAppliedTo')}
                />
              </label>
              <span className="font-mono tabular-nums text-cyan-300">
                ±{config.mutationStrength.toFixed(2)}
              </span>
            </div>
            <input
              id="mut-str-slider"
              type="range"
              min={0.05}
              max={0.8}
              step={0.05}
              disabled={!paramSupport.usesMutationStrength}
              value={config.mutationStrength}
              onChange={(e) => updateField('mutationStrength', Number(e.target.value))}
              className="lab-slider w-full disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Course Scenario + Customizable Environment Physics */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
            {t('training.environmentScenarioTiersCustom')}
            <InfoTooltip
              align="left"
              label={t('training.aboutVerifiedDifficultyTiers')}
              text={t('training.consolidatedTiersEasyMediumHard')}
            />
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1 rounded-lg border border-slate-800 bg-slate-900/90 p-1">
          {SCENARIOS.map((s) => {
            const active = config.difficulty === s.id;
            const activeClass =
              s.tier === 'Custom'
                ? 'bg-teal-500/20 text-teal-300'
                : s.tier === 'Calm'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : s.tier === 'Moderate'
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : s.tier === 'Dynamic'
                      ? 'bg-violet-500/20 text-violet-300'
                      : 'bg-rose-500/20 text-rose-300';
            return (
              <button
                key={s.id}
                type="button"
                title={`${getDifficultyText(lang, s.id).tier}: ${getDifficultyText(lang, s.id).description}`}
                onClick={() => updateField('difficulty', s.id)}
                className={`rounded-md py-1.5 px-1 text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  active
                    ? activeClass
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Mathematical Solvability Proof Readout */}
        <div
          className={`rounded-lg border px-2.5 py-2 font-mono text-[10px] tabular-nums ${
            envProof.solvable
              ? 'border-cyan-500/30 bg-[#0B1120] text-slate-300'
              : 'border-rose-500/45 bg-rose-500/10 text-rose-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={
                envProof.solvable
                  ? 'font-semibold text-cyan-300'
                  : 'font-semibold text-rose-300'
              }
            >
              {envProof.solvable
                ? t('training.provenSolvable')
                : t('training.unsolvableRisk')}
            </span>
            <span className="text-slate-400">
              dt≥{envProof.dtMinFrames}f · {t('training.gap')}≥{envProof.minGapPx}px
            </span>
          </div>
          <div className="mt-1 text-slate-400">
            {t('training.climb')} {envProof.climbSlackPx >= 0 ? '+' : ''}
            {envProof.climbSlackPx}px · {t('training.dive')} {envProof.diveSlackPx >= 0 ? '+' : ''}
            {envProof.diveSlackPx}px · {t('training.transit')}{' '}
            {envProof.transitClearancePx >= 0 ? '+' : ''}
            {envProof.transitClearancePx}px
          </div>
        </div>

        {/* Fine-grained physics sliders (auto-switches to Custom on adjust) */}
        <div className="space-y-2 rounded-lg border border-slate-800 bg-[#0B1120]/70 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              {t('training.physicsHazardTuning')}
              <InfoTooltip
                align="left"
                label={t('training.aboutCustomPhysicsSliders')}
                text={t('training.adjustingAnySliderAutomaticallySwitc')}
              />
            </span>
            <span className="font-mono text-slate-300">{activeEnv.label}</span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
            <div>
              <div className="flex justify-between text-slate-300">
                <span
                  title={t('training.meanVerticalOpeningHeightBetween')}
                >
                  {t('training.gapWidth')}
                </span>
                <span className="font-mono text-cyan-300">{activeEnv.gap}px</span>
              </div>
              <input
                type="range"
                min={84}
                max={176}
                step={2}
                value={activeEnv.gap}
                onChange={(e) => updateCustomEnv('gap', Number(e.target.value))}
                className="lab-slider w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300">
                <span
                  title={t('training.randomPerPipeVariationAround')}
                >
                  {t('training.gapVariance')}
                </span>
                <span className="font-mono text-cyan-300">±{activeEnv.gapVariance}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={44}
                step={2}
                value={activeEnv.gapVariance}
                onChange={(e) => updateCustomEnv('gapVariance', Number(e.target.value))}
                className="lab-slider w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300">
                <span
                  title={t('training.baseHorizontalScrollSpeedOf')}
                >
                  {t('training.baseSpeed')}
                </span>
                <span className="font-mono text-cyan-300">{activeEnv.pipeSpeed.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={2.0}
                max={4.8}
                step={0.1}
                value={activeEnv.pipeSpeed}
                onChange={(e) => updateCustomEnv('pipeSpeed', Number(e.target.value))}
                className="lab-slider w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300">
                <span
                  title={t('training.nonPeriodicMultiSineWind')}
                >
                  {t('training.speedGusts')}
                </span>
                <span className="font-mono text-cyan-300">
                  ±{Math.round(activeEnv.speedVariability * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={0.65}
                step={0.05}
                value={activeEnv.speedVariability}
                onChange={(e) =>
                  updateCustomEnv('speedVariability', Number(e.target.value))
                }
                className="lab-slider w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300">
                <span
                  title={t('training.multiplierOnDownwardGravityFlap')}
                >
                  {t('training.gravityScale')}
                </span>
                <span className="font-mono text-cyan-300">
                  {activeEnv.gravityScale.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={0.75}
                max={1.35}
                step={0.05}
                value={activeEnv.gravityScale}
                onChange={(e) => updateCustomEnv('gravityScale', Number(e.target.value))}
                className="lab-slider w-full"
              />
            </div>

            <div className="flex items-end pb-0.5">
              <button
                type="button"
                onClick={() => {
                  const nextMoving = !activeEnv.movingPipes;
                  const base =
                    config.difficulty === 'CUSTOM' && config.customEnvironment
                      ? config.customEnvironment
                      : { ...DIFFICULTY_SETTINGS[config.difficulty], label: 'Custom' };
                  onChange({
                    ...config,
                    difficulty: 'CUSTOM',
                    customEnvironment: {
                      ...base,
                      label: 'Custom',
                      movingPipes: nextMoving,
                      moveAmplitude: nextMoving ? Math.max(20, base.moveAmplitude) : 0,
                    },
                  });
                }}
                className={`w-full rounded-md border py-1.5 text-[11px] font-medium cursor-pointer transition-colors ${
                  activeEnv.movingPipes
                    ? 'border-amber-500/50 bg-amber-500/15 text-amber-200'
                    : 'border-slate-700 bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {activeEnv.movingPipes
                  ? t('training.movingPipesOn')
                  : t('training.movingPipesOff')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
