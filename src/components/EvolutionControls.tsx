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
  desc: DIFFICULTY_META[id].description,
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
  const { bi } = useLanguage();
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
          {bi('Sterowanie Ewolucją, Topologią i Fizyką', 'Evolution, Topology & Physics Controls')}
        </h2>
        <p className="text-xs text-slate-400">
          {bi(
            'Suwaki populacji i mutacji działają od kolejnego pokolenia · Zmiana metody lub kształtu resetuje stado',
            'Hyperparameters apply next gen · Changing method or topology resets flock'
          )}
        </p>
      </div>

      {/* Learning Algorithm — Two-Tier Consolidated Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
            {bi('Metoda Optymalizacji AI (Core 3)', 'AI Optimization Method (Core 3)')}
            <InfoTooltip
              align="left"
              label={bi('O metodach optymalizacji', 'About consolidated optimization tiers')}
              text={bi(
                '3 główne algorytmy pokrywają wszystkie reżimy: Neuro-CMA (najszybsza zbieżność G1 ≤100 param.), Diff. Evol. (33.5% ogólnej skuteczności) oraz GA (krzyżowanie). Pozostałe warianty ES/Swarm są w rozwijanym pasku.',
                '26,700 empirical trials proved 3 core optimizers cover all regimes: Neuro-CMA (fastest G1 convergence ≤100p), Diff. Evol. (33.5% overall vector sweet-spot), and GA (crossover).'
              )}
            />
          </span>
          <button
            type="button"
            onClick={() => setShowExtendedOptimizers((prev) => !prev)}
            className="font-mono text-[10px] text-cyan-300 hover:text-cyan-200 cursor-pointer"
          >
            {showExtendedOptimizers || isExtendedOptimizerActive
              ? bi('Ukryj +5 ES', 'Hide Extended ES')
              : bi('+5 metod ES/Swarm', '+5 Extended ES/Swarm')}
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
            {bi('Percepcja & Niestacjonarny Świat', 'Perception & Non-Stationary World')}
            <InfoTooltip
              align="left"
              label={bi('O oku złożonym 16-Ray i anomaliach', 'About Compound-Eye Retinal Pixels & Anomaly Zones')}
              text={bi(
                'Zastępuje dokładną telemetrię laboratoryjną 16-promieniowym wachlarzem siatkówki oka złożonego (Ommatidia), filtrem kontrastu L1/L2 ΔI(t) oraz detektorami ruchu T4/T5. Anomalie modulują grawitację (0.78g–1.22g) w trakcie lotu.',
                'Replaces exact laboratory telemetry with a biological 16-Ommatidia retinal ray fan, Lamina L1/L2 temporal high-pass contrast filter ΔI(t), and T4/T5 Reichardt motion correlators. Anomaly Zones periodically modulate gravity (0.78g–1.22g) mid-flight to require real-time adaptation.'
              )}
            />
          </span>
          <span className="font-mono text-[10px] text-emerald-300">
            {(config.perceptionMode ?? 'GEOMETRIC_LAB') === 'COMPOUND_EYE_PIXELS'
              ? '16-Ray Ommatidia'
              : bi('Dokładna Lab', 'Exact Lab')}
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
            {bi('Telemetria Lab (Dokładna)', 'Lab Telemetry (Exact)')}
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
            {bi('Oko Złożone 16-Ray (Piksele)', 'Compound-Eye Pixels')}
          </button>
        </div>

        {config.perceptionMode === 'COMPOUND_EYE_PIXELS' && (
          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">
                {bi('Szum Kontrastu Optycznego & Odblaski', 'Optical Contrast Noise & Glare')}
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
            title="Periodic in-flight gravity & contrast anomalies (0.78g ↔ 1.22g) that force online adaptation instead of single-seed memorization"
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
            {bi('Anomalie:', 'Anomalies:')} {config.nonStationaryAnomalies ? 'ON (0.78–1.22g)' : 'OFF'}
          </button>
          <button
            type="button"
            disabled={!hasFlyCortexActive}
            title={
              !hasFlyCortexActive
                ? bi(
                    'Plastyczność dopaminowa (DA) działa w banku pamięci Fly-Cortex (DECOUPLED_FLY_CORTEX lub Arena)',
                    'Online Dopamine (DA) plasticity applies to the Fly-Cortex associative bank (DECOUPLED_FLY_CORTEX or Arena)'
                  )
                : bi(
                    'Plastyczność dopaminowa w locie: aktualizuje sloty pamięci FlyHash APL w czasie rzeczywistym na podstawie błędu predykcji nagrody',
                    'Online Lifetime Dopamine Plasticity: updates active FlyHash APL associative skill slots during flight based on real-time survival reward prediction error'
                  )
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
            {bi('Plastyczność DA Online:', 'Online DA Plasticity:')}{' '}
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
              {bi(
                'Strumienie Płata Wzrokowego (z 16-Ray Ommatidia)',
                'Optic Lobe Streams (from 16-Ray Ommatidia)'
              )}
              <InfoTooltip
                align="left"
                label={bi('Dlaczego ukryto sensory geometryczne?', 'Why are geometric sensors replaced?')}
                text={bi(
                  'W trybie Siatkówki 16-Ray ptak nie korzysta z ręcznych laserów współrzędnych (DX, Top, Bot). Zamiast tego 16 fotoreceptorów (-68°..+68°) trafia do płata wzrokowego Lamina L1/L2 i Medulla T4/T5, który wylicza biologiczne strumienie przepływu optycznego podawane na wejścia sieci.',
                  'In 16-Ray Retina mode the bird does not use manual geometric coordinate lasers (DX, Top, Bot). Instead, 16 photoreceptors (-68°..+68°) feed the Lamina L1/L2 and Medulla T4/T5 optic lobe to produce biological optical flow streams.'
                )}
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
                  title={meta.opticalDescPl}
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
                  label: bi('5 Strumieni (Bliskie Pole)', '5 Streams (Near Field)'),
                  features: ['BIRD_Y', 'VEL_VY', 'PIPE_DX', 'TOP_CLEAR', 'BOT_CLEAR'] as SensorFeatureId[],
                },
                {
                  label: bi('6 Strumieni (+T4/T5 Ruch)', '6 Streams (+T4/T5 Motion)'),
                  features: ['BIRD_Y', 'VEL_VY', 'PIPE_DX', 'TOP_CLEAR', 'BOT_CLEAR', 'PIPE_VY'] as SensorFeatureId[],
                },
                {
                  label: bi('8 Strumieni (+Dalekie Pole #2)', '8 Streams (+Far Field #2)'),
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
                  label: bi('12 Strumieni (Pełny Płat + Tau)', '12 Streams (Full Lobe + Tau)'),
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
              {bi('Sensory Wejściowe (Pula 1–12)', 'Sensor Inputs (1–12 Pool)')}
              <InfoTooltip
                align="left"
                label={bi('O 12 sensorach', 'About 12-sensor dual-pipe pool')}
                text={bi(
                  'Rura #1 (DX, Top, Bot, PVy), Rura #2 (N2Y, N2Top, N2Bot, N2DX, N2PVy) oraz Bird Y, Vy i czas dolotu TTF. Wymagany jest min. 1 sensor szczeliny (Top lub Bot), a prędkości rur (PVy) są aktywne tylko dla ruchomych rur.',
                  'Pipe #1 (DX, Top, Bot, PVy), Pipe #2 lookahead (N2Y, N2Top, N2Bot, N2DX, N2PVy), plus Bird Y, Vy, and Time-To-Pipe (TTF).'
                )}
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
                      ? bi(
                          `${meta.label}: wyłączone przy statycznych rurach`,
                          `${meta.label}: disabled for static pipes`
                        )
                      : isLastClearance
                        ? bi(
                            'Wymagany min. 1 sensor szczeliny (TOP_CLEAR lub BOT_CLEAR)',
                            'Requires at least 1 gap clearance sensor (TOP_CLEAR or BOT_CLEAR)'
                          )
                        : `${meta.label}: ${meta.description}`
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
            {bi('Topologia Sieci (Głębokość × Szerokość)', 'Network Topology (Depth × Width)')}
            <InfoTooltip
              align="left"
              label={bi('O topologii sieci', 'About topology')}
              text={bi(
                'Określa liczbę warstw ukrytych i liczbę neuronów w każdej warstwie (do 64 neuronów z akceleracją WebGPU). Mniejsze sieci uczą się błyskawicznie; głębsze dają większą pojemność nieliniową.',
                'Controls hidden layers and neurons per layer (up to 64 neurons with WebGPU acceleration).'
              )}
            />
          </span>
          <span className="font-mono tabular-nums text-emerald-300">
            {topoLabel} · {paramCount} {bi('param.', 'params')}
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
                    ? bi(
                        'Residual Skip na głębokości 0 (Lin) jest matematycznie identyczny z MLP',
                        'Residual Skip at Depth 0 (Lin) is mathematically identical to MLP'
                      )
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
                  ? `${bi('Lin', 'Lin')} (${inputCount + 1} param.)`
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
            {bi('Warstwa', 'Layer')}
          </button>
        </div>

        {hiddenLayers.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {hiddenLayers.map((width, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="w-20 font-mono text-[11px] text-slate-400">
                  {bi(`Warstwa H${idx + 1}`, `Layer H${idx + 1}`)}
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
                  {width} {bi('neur.', 'neur.')}
                </span>
                <button
                  type="button"
                  title={bi('Usuń warstwę', 'Remove layer')}
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
            {bi('Architektura Neuronowa (12 typów)', 'Architecture (Bio + MoE)')}
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
            Starts as lean MLP core · Progressively spawns Zero-Init LTC / MinGRU / Ponder experts on stagnation with FLOPs ROI rollback.
          </p>
        )}
        {activeArch === 'DROSOPHILA_CONNECTOME' && (
          <p className="font-mono text-[10px] leading-snug text-amber-200/90">
            Fruit-Fly Connectome (◆ WebGPU Lockstep): Optic Lobe T4/T5 LTC + Mushroom Body APL lateral inhibition + Octopamine arousal gain + Giant Fiber direct sensory→motor reflex bypass.
          </p>
        )}
        {activeArch === 'DECOUPLED_FLY_CORTEX' && (
          <p className="font-mono text-[10px] leading-snug text-emerald-200/90">
            Decoupled Reasoning vs Knowledge Brain: Compact Giant-Fiber + T4/T5 Executive Core separated from a 16-Slot FlyHash APL Associative Skill Bank updated live in-flight via Dopamine Prediction-Error Plasticity.
          </p>
        )}
        <div className="grid grid-cols-1 gap-1.5">
          {onLoadFruitFlyPreset && (
            <button
              type="button"
              onClick={onLoadFruitFlyPreset}
              className="w-full rounded-md border border-amber-500/45 bg-amber-500/12 px-2.5 py-1.5 font-mono text-[10.5px] font-semibold text-amber-200 cursor-pointer transition-colors hover:border-amber-400 hover:bg-amber-500/20"
            >
              Load Fruit Fly (Drosophila 6→4 · WebGPU Lockstep)
            </button>
          )}
          {onLoadDecoupledCortexPreset && (
            <button
              type="button"
              onClick={onLoadDecoupledCortexPreset}
              className="w-full rounded-md border border-emerald-500/45 bg-emerald-500/12 px-2.5 py-1.5 font-mono text-[10.5px] font-semibold text-emerald-200 cursor-pointer transition-colors hover:border-emerald-400 hover:bg-emerald-500/20"
            >
              Load Decoupled Fly-Cortex (Compound-Eye Pixels + Online DA Memory)
            </button>
          )}
        </div>
        {(activeArch === 'LOOPED_REASONER' ||
          activeArch === 'PONDER_ACT' ||
          activeArch === 'HYBRID_MOE') && (
          <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
            <span className="text-slate-400">
              {bi('Kroki Myślenia (K)', 'Thinking Steps (K)')}
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
            {bi('Samorosnąca Morfogeneza Sieci', 'Self-Growing Morphogenesis')}
            <InfoTooltip
              align="left"
              label={bi('O morfogenezie sieci', 'About self-growing morphogenesis')}
              text={bi(
                'Startuje z małego zalążka (seedling), chroni wyuczone wagi przez mielinizację i dodaje nowe neurony, kroki myślenia K lub sensory w przypadku stagnacji — oraz przycina zbędne synapsy.',
                'Starts from a compact seedling core, shields learned weights via myelination, and grows new neurons, reasoning steps K, or deferred sensors on stagnation — plus synaptic pruning when bloated.'
              )}
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
            {config.morphogenesis ? bi('AKTYWNA', 'ACTIVE') : bi('STATYCZNA', 'STATIC')}
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
              Sensors: {morphCfg.progressiveSensors ? 'Wave Unlock' : 'All Gen0'}
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
              Seedling: {Math.round(morphCfg.initialWidthRatio * 100)}% width
            </button>
            {hasMoeActive && (
              <button
                type="button"
                title={bi(
                  'Automatyczne dokładanie wyspecjalizowanych ekspertów (LTC, MinGRU, Ponder) dla Hybrid MoE',
                  'Toggle compute-justified expert module spawning (LTC, MinGRU, Ponder) for Hybrid MoE'
                )}
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
                {bi('Eksperci:', 'Experts:')}{' '}
                {(morphCfg.allowExpertSpawning ?? true) ? 'Auto-Spawn' : 'Locked'}
              </button>
            )}
            {hasReasoningKActive && (
              <button
                type="button"
                title={bi(
                  'Start od K=1 (szybki odruch) i dokładanie kolejnych kroków rozumowania przy stagnacji',
                  'Start at K=1 fast reflex and grow reasoning steps K on stagnation'
                )}
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
                {bi('Kroki K:', 'Steps K:')}{' '}
                {morphCfg.growReasoningSteps ? '1→maxK' : bi('Stałe K', 'Fixed K')}
              </button>
            )}
            <button
              type="button"
              title={bi(
                'Zmiana kary obliczeniowej FLOPs na 100 nadmiarowych FLOPs/klatkę',
                'Cycle FLOPs compute penalty per 100 excess FLOPs/frame'
              )}
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
              FLOPs Pen: {(morphCfg.flopsPenaltyWeight ?? 0.004).toFixed(3)}
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
              {bi('Rozmiar Populacji', 'Population Size')}
              <InfoTooltip
                align="left"
                label={bi('O rozmiarze populacji', 'About population size')}
                text={bi(
                  'Liczba sieci neuronowych ocenianych równolegle w każdym pokoleniu. Większe stado eksploruje więcej rozwiązań naraz.',
                  'Number of candidate neural networks evaluated in parallel each generation. Larger flocks explore more solutions per generation at higher CPU cost per tick.'
                )}
              />
            </label>
            <span className="font-mono tabular-nums text-cyan-300">
              {config.populationSize} {bi('ptaków', 'birds')}
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
                    label="About mutation probability"
                    text="Probability each individual weight is perturbed during GA / Adaptive ES reproduction, or binomial crossover rate CR in DE."
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
                  Perturbation Mode
                </span>
                <span className="font-mono text-[10px] text-cyan-300">
                  100% Dense
                </span>
              </div>
              <p className="mt-1 font-mono text-[9.5px] leading-snug text-slate-400">
                {paramSupport.rateDisabledReason ??
                  'Continuous covariance / gradient step updates all weights every generation.'}
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
                  label="About mutation sigma"
                  text="Gaussian perturbation scale (σ) applied to weights. Larger values (0.3–0.5) escape local optima faster; smaller values (0.1–0.2) fine-tune an existing champion."
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
            {bi('Scenariusz Środowiska (Poziomy + Custom)', 'Environment Scenario (Tiers + Custom)')}
            <InfoTooltip
              align="left"
              label={bi('O poziomach trudności', 'About verified difficulty tiers')}
              text={bi(
                'Poziomy trudności (Easy, Medium, Hard, Insane, Extra Insane) oraz Custom. Każdy poziom ma wyliczony matematyczny dowód przechodniości balistycznej.',
                'Consolidated tiers (Easy, Medium, Hard, Insane, Extra Insane) plus Custom. Every tier is mathematically verified using worst-case ballistic climb/dive and moving-lip corridor proofs.'
              )}
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
                title={`${s.tier}: ${s.desc}`}
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
              {envProof.solvable ? 'PROVEN SOLVABLE' : 'UNSOLVABLE RISK'}
            </span>
            <span className="text-slate-400">
              dt≥{envProof.dtMinFrames}f · gap≥{envProof.minGapPx}px
            </span>
          </div>
          <div className="mt-1 text-slate-400">
            climb {envProof.climbSlackPx >= 0 ? '+' : ''}
            {envProof.climbSlackPx}px · dive {envProof.diveSlackPx >= 0 ? '+' : ''}
            {envProof.diveSlackPx}px · transit{' '}
            {envProof.transitClearancePx >= 0 ? '+' : ''}
            {envProof.transitClearancePx}px
          </div>
        </div>

        {/* Fine-grained physics sliders (auto-switches to Custom on adjust) */}
        <div className="space-y-2 rounded-lg border border-slate-800 bg-[#0B1120]/70 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              {bi('Strojenie Fizyki & Zagrożeń', 'Physics & Hazard Tuning')}
              <InfoTooltip
                align="left"
                label={bi('O suwakach fizyki', 'About custom physics sliders')}
                text={bi(
                  'Zmiana dowolnego suwaka automatycznie przełącza scenariusz na Custom, pozwalając badać pojedyncze zagrożenia (wiatr, grawitację, szerokość szczelin).',
                  'Adjusting any slider automatically switches to the Custom scenario so you can isolate individual hazards like wind gusts, gap variance, or gravity.'
                )}
              />
            </span>
            <span className="font-mono text-slate-300">{activeEnv.label}</span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
            <div>
              <div className="flex justify-between text-slate-300">
                <span title="Mean vertical opening height between top and bottom pipes">
                  Gap Width
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
                <span title="Random per-pipe variation around the base gap width">
                  Gap Variance
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
                <span title="Base horizontal scroll speed of pipes in pixels per tick">
                  Base Speed
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
                <span title="Non-periodic multi-sine wind gusts modulating horizontal pipe speed">
                  Speed Gusts
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
                <span title="Multiplier on downward gravity; flap impulse scales by √g to keep jump arc playable">
                  Gravity Scale
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
                {activeEnv.movingPipes ? 'Moving Pipes: On' : 'Moving Pipes: Off'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
