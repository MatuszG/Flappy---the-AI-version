import { Cpu, Flame, Gauge, Snowflake, Zap } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';
import { clampPriority, resolvePowerProfile } from '../../engine/powerProfile';
import {
  getHardwareCores,
  resolveAutoWorkerCount,
} from '../../engine/researchPool';
import type {
  ComputeBackend,
  ResearchProgress,
  ResearchSweepConfig,
} from '../../engine/types';
import {
  probeWebGpuInfo,
  runWebGpuMicroBenchmark,
  type WebGpuProbeInfo,
} from '../../engine/webgpuEvaluator';
import { useLanguage } from '../../i18n/LanguageContext';
import { InfoTooltip } from '../InfoTooltip';

const QUICK_POWER_STOPS = [
  { labelPl: 'Cichy', labelEn: 'Quiet', priority: 25 },
  { labelPl: 'Eco', labelEn: 'Eco', priority: 50 },
  { labelPl: 'Balans', labelEn: 'Balanced', priority: 75 },
  { labelPl: '100% Max', labelEn: '100% Max', priority: 100 },
] as const;

const GPU_LOAD_STOPS = [
  { label: '25%', value: 25 },
  { label: '50%', value: 50 },
  { label: '75%', value: 75 },
  { label: '100% Max', value: 100 },
] as const;

const AUTOSAVE_CYCLE = [30, 60, 120, 0] as const;

interface HardwareComputePanelProps {
  sweepConfig: ResearchSweepConfig;
  progress: ResearchProgress;
  isBusy: boolean;
  onChangeConfig: (next: ResearchSweepConfig) => void;
  onChangePriority: (priority: number) => void;
  onChangeGpuLoad: (gpuLoadPercent: number) => void;
}

export const HardwareComputePanel = memo(function HardwareComputePanel({
  sweepConfig,
  progress,
  isBusy,
  onChangeConfig,
  onChangePriority,
  onChangeGpuLoad,
}: HardwareComputePanelProps) {
  const { bi } = useLanguage();
  const hardwareCores = useMemo(() => getHardwareCores(), []);
  const autoWorkers = useMemo(() => resolveAutoWorkerCount(), []);
  const priority = clampPriority(sweepConfig.performancePriority);
  const gpuLoadPercent = Math.max(
    10,
    Math.min(100, Math.round(sweepConfig.gpuLoadPercent ?? 100))
  );
  const plan = useMemo(
    () => resolvePowerProfile(priority, hardwareCores),
    [priority, hardwareCores]
  );
  const isRunning = progress.status === 'RUNNING';

  const [gpuProbe, setGpuProbe] = useState<WebGpuProbeInfo | null>(null);
  const [gpuBenchBusy, setGpuBenchBusy] = useState(false);
  const [gpuBenchResult, setGpuBenchResult] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void probeWebGpuInfo().then((info) => {
      if (active) setGpuProbe(info);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleRunGpuBench = () => {
    if (gpuBenchBusy || isBusy) return;
    setGpuBenchBusy(true);
    setGpuBenchResult(null);
    void runWebGpuMicroBenchmark('STANDARD')
      .then((res) => {
        setGpuBenchResult(
          `${res.engine}: ${res.mTicksPerSec.toFixed(0)}M/s (${res.elapsedMs.toFixed(0)}ms)`
        );
      })
      .catch((err) => {
        setGpuBenchResult(
          `${bi('Błąd', 'Error')}: ${err instanceof Error ? err.message : String(err)}`
        );
      })
      .finally(() => {
        setGpuBenchBusy(false);
      });
  };

  const manualThreadOptions = useMemo(
    () => [2, 4, 6, 8, 12, 16, 24, 32],
    []
  );

  const activeAutosave = sweepConfig.autosaveIntervalSec ?? 60;
  const cycleAutosave = () => {
    const idx = AUTOSAVE_CYCLE.indexOf(
      activeAutosave as (typeof AUTOSAVE_CYCLE)[number]
    );
    const next = AUTOSAVE_CYCLE[(idx + 1) % AUTOSAVE_CYCLE.length];
    onChangeConfig({ ...sweepConfig, autosaveIntervalSec: next });
  };

  return (
    <div className="space-y-4">
      {/* 1. Compute Backend */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-200">
            <Cpu className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
            {bi('Silnik obliczeń', 'Compute Backend')}
            <InfoTooltip
              align="left"
              label={bi('Backend obliczeń', 'Compute Backend')}
              text={bi(
                'Auto wybiera najszybszy silnik w locie. CPU używa wyłącznie Web Workerów f64. GPU uruchamia dynamiczne tiery WebGPU (8/12 → 64/64) z kalibracją rejestrów i ochroną TDR + wątki CPU dla równoległego audytu f64. Hybrid uruchamia oba naraz.',
                'Auto picks the fastest backend at runtime. CPU uses f64 Web Workers only. GPU runs dynamic WebGPU tiers (8/12 → 64/64) with startup register calibration & TDR guard + CPU threads for parallel f64 audit. Hybrid runs both.'
              )}
            />
          </span>
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`truncate font-mono text-[10.5px] ${
                gpuProbe?.available
                  ? gpuProbe.isSoftware
                    ? 'text-amber-300'
                    : 'text-emerald-300'
                  : 'text-slate-500'
              }`}
              title={gpuProbe?.reason ?? gpuProbe?.label}
            >
              {gpuProbe
                ? gpuProbe.available
                  ? gpuProbe.label
                  : 'GPU N/A'
                : 'GPU…'}
            </span>
            {gpuProbe?.available && (
              <button
                type="button"
                disabled={isBusy || gpuBenchBusy}
                onClick={handleRunGpuBench}
                className="shrink-0 rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300 cursor-pointer hover:border-emerald-500/50 disabled:opacity-40"
              >
                {gpuBenchBusy ? '…' : 'Bench'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1 rounded-lg border border-slate-800 bg-[#0B1120] p-1">
          {(
            [
              { id: 'AUTO', label: 'Auto' },
              { id: 'CPU', label: 'CPU' },
              {
                id: 'GPU',
                label: gpuProbe?.engine === 'WEBGL2' ? 'WebGL2' : 'GPU',
              },
              { id: 'HYBRID', label: 'Hybrid' },
            ] as { id: ComputeBackend; label: string }[]
          ).map((opt) => {
            const active = (sweepConfig.computeBackend ?? 'CPU') === opt.id;
            const disabled =
              isBusy ||
              (opt.id !== 'CPU' &&
                opt.id !== 'AUTO' &&
                gpuProbe !== null &&
                !gpuProbe.available);
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChangeConfig({ ...sweepConfig, computeBackend: opt.id })
                }
                className={`rounded-md py-1.5 font-mono text-xs whitespace-nowrap cursor-pointer transition-colors disabled:opacity-35 ${
                  active
                    ? opt.id === 'AUTO'
                      ? 'bg-violet-500/25 text-violet-200 font-semibold'
                      : opt.id === 'CPU'
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                        : 'bg-emerald-500/20 text-emerald-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {gpuBenchResult && (
          <p className="font-mono text-[10.5px] text-emerald-300">
            {gpuBenchResult}
          </p>
        )}
      </div>

      {/* 2. Live GPU Load % Slider (Default 100% Focus + Windows TDR Watchdog) */}
      <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-200">
            <Zap className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            {bi('Obciążenie GPU (WebGPU)', 'GPU Load (WebGPU)')}
            <InfoTooltip
              align="left"
              label={bi('Obciążenie GPU i ochrona TDR', 'GPU Load & TDR Watchdog')}
              text={bi(
                '100% = pełne nasycenie GPU bez sztucznych przerw (z automatyczną ochroną Windows TDR <400ms i auto-tunerem rejestrów). Obniż wartość na laptopach/iGPU, aby zachować płynny pulpit i niższą temperaturę.',
                '100% = full GPU saturation with zero artificial rest (with automatic Windows TDR <400ms watchdog & startup register auto-tuner). Lower on laptops/iGPUs for cooler temps and smooth desktop video.'
              )}
            />
            {isRunning && progress.gpuActive && (
              <span className="font-mono text-[10px] text-emerald-300">
                · {bi('na żywo', 'live')}
              </span>
            )}
          </span>

          <span className="font-mono text-[11px] tabular-nums text-slate-300">
            <strong className="text-emerald-300">{gpuLoadPercent}%</strong> ·{' '}
            {gpuLoadPercent >= 98
              ? bi('Pełny focus · TDR guard', 'Full focus · TDR guard')
              : bi('Duty-cycle · płynny pulpit', 'Duty-cycle · smooth UI')}
          </span>
        </div>

        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={gpuLoadPercent}
          aria-label={bi('Docelowe obciążenie GPU w procentach', 'Target GPU load percentage')}
          onChange={(e) => onChangeGpuLoad(Number(e.target.value))}
          className="lab-slider w-full cursor-pointer"
        />

        <div className="grid grid-cols-4 gap-1">
          {GPU_LOAD_STOPS.map((stop) => {
            const active = Math.abs(gpuLoadPercent - stop.value) <= 5;
            return (
              <button
                key={stop.value}
                type="button"
                onClick={() => onChangeGpuLoad(stop.value)}
                className={`rounded-md border py-1 font-mono text-[10.5px] whitespace-nowrap cursor-pointer transition-colors ${
                  active
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200 font-semibold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {stop.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. CPU Thread Limit */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-200">
            {bi('Limit wątków CPU', 'CPU Thread Limit')}
            <InfoTooltip
              align="left"
              label={bi('Wątki CPU', 'CPU Threads')}
              text={bi(
                'Ustawia łączny limit wątków CPU dla treningu i równoległego audytu f64 (wszystkie dostępne wątki audytu działają automatycznie przy >1 ziarnie).',
                'Sets total CPU thread budget for training and parallel f64 verification audit (automatically uses all available audit threads when verification seeds > 1).'
              )}
            />
          </span>
          <span className="font-mono text-[11px] text-cyan-300 tabular-nums">
            {sweepConfig.workerThreads === 0
              ? `Auto (${autoWorkers}/${hardwareCores}t)`
              : sweepConfig.workerThreads === -1 ||
                  sweepConfig.workerThreads === -2
                ? `100% (${hardwareCores}/${hardwareCores}t)`
                : `${sweepConfig.workerThreads}t`}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="grid flex-1 grid-cols-3 gap-1 rounded-lg border border-slate-800 bg-[#0B1120] p-1">
            {[
              { id: 0, label: `Auto (${autoWorkers})` },
              {
                id: Math.max(1, Math.floor(hardwareCores / 2)),
                label: `50% (${Math.max(1, Math.floor(hardwareCores / 2))})`,
              },
              { id: -1, label: `100% (${hardwareCores}t)` },
            ].map((choice) => {
              const active =
                choice.id === -1
                  ? sweepConfig.workerThreads === -1 ||
                    sweepConfig.workerThreads === -2
                  : sweepConfig.workerThreads === choice.id;
              return (
                <button
                  key={choice.id}
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    onChangeConfig({
                      ...sweepConfig,
                      workerThreads: choice.id,
                    })
                  }
                  className={`rounded-md py-1.5 font-mono text-[11px] whitespace-nowrap cursor-pointer transition-colors disabled:opacity-40 ${
                    active
                      ? choice.id === -1
                        ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                        : 'bg-cyan-500/20 text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {choice.label}
                </button>
              );
            })}
          </div>

          <select
            aria-label={bi('Własna liczba wątków CPU', 'Custom CPU thread count')}
            disabled={isBusy}
            value={
              sweepConfig.workerThreads > 0 ? sweepConfig.workerThreads : ''
            }
            onChange={(e) => {
              const v = Number(e.target.value);
              if (v > 0) {
                onChangeConfig({ ...sweepConfig, workerThreads: v });
              }
            }}
            className="rounded-lg border border-slate-800 bg-[#0B1120] px-2.5 py-2 font-mono text-[11px] text-slate-300 focus:border-cyan-400 focus:outline-none disabled:opacity-40"
          >
            <option value="" disabled>
              {bi('Własne…', 'Custom…')}
            </option>
            {manualThreadOptions.map((n) => (
              <option key={n} value={n}>
                {n} {bi('wątków', 'threads')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. CPU Power & Thermal Priority */}
      <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-200">
            {priority < 50 ? (
              <Snowflake className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            ) : priority < 85 ? (
              <Gauge className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
            ) : (
              <Flame className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
            )}
            {bi('Moc & Temperatura CPU', 'CPU Power & Thermal')}
            {isRunning && (
              <span className="font-mono text-[10px] text-emerald-300">
                · {bi('na żywo', 'live')}
              </span>
            )}
          </span>

          <span className="font-mono text-[11px] tabular-nums text-slate-300">
            <strong className="text-white">{priority}%</strong> ·{' '}
            {plan.thermalBadge} ·{' '}
            {plan.workerRestMs > 0 ? `${plan.workerRestMs}ms rest` : '0ms rest'}
            {isRunning && (progress.liveTicksPerSec ?? 0) > 0 && (
              <span className="text-emerald-300">
                {' '}
                · {((progress.liveTicksPerSec ?? 0) / 1e6).toFixed(1)}M/s
              </span>
            )}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={priority}
          aria-label={bi('Priorytet mocy CPU względem temperatury', 'CPU performance vs thermal priority')}
          onChange={(e) => onChangePriority(Number(e.target.value))}
          className="lab-slider w-full cursor-pointer"
        />

        <div className="grid grid-cols-4 gap-1">
          {QUICK_POWER_STOPS.map((stop) => {
            const active = Math.abs(priority - stop.priority) <= 8;
            return (
              <button
                key={stop.priority}
                type="button"
                onClick={() => onChangePriority(stop.priority)}
                className={`rounded-md border py-1 font-mono text-[10.5px] whitespace-nowrap cursor-pointer transition-colors ${
                  active
                    ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-200 font-semibold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {bi(stop.labelPl, stop.labelEn)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Execution Options Strip (Queue Order & Autosave only — Prune & Parallel Audit are always smart-active in software) */}
      <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
        <button
          type="button"
          disabled={isBusy}
          title={bi(
            'Balanced miesza ciężkie i lekkie próby; LPT uruchamia najcięższe najpierw',
            'Balanced mixes heavy & light trials; LPT runs heaviest first'
          )}
          onClick={() =>
            onChangeConfig({
              ...sweepConfig,
              scheduleMode:
                (sweepConfig.scheduleMode ?? 'BALANCED') === 'BALANCED'
                  ? 'LPT'
                  : 'BALANCED',
            })
          }
          className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#0B1120] px-3 py-2 text-slate-300 cursor-pointer hover:border-cyan-500/40 disabled:opacity-50"
        >
          <span className="text-slate-400">{bi('Kolejka zadań', 'Job Schedule')}</span>
          <span className="text-cyan-300 font-semibold">
            {(sweepConfig.scheduleMode ?? 'BALANCED') === 'BALANCED'
              ? 'Balanced'
              : 'LPT'}
          </span>
        </button>

        <button
          type="button"
          title={bi(
            'Interwał autozapisu checkpointów w IndexedDB',
            'IndexedDB checkpoint autosave interval'
          )}
          onClick={cycleAutosave}
          className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#0B1120] px-3 py-2 text-slate-300 cursor-pointer hover:border-emerald-500/40"
        >
          <span className="text-slate-400">{bi('Autozapis', 'Autosave')}</span>
          <span className="text-emerald-300 font-semibold">
            {activeAutosave === 0
              ? bi('Ręczny', 'Manual')
              : activeAutosave >= 120
                ? '2m'
                : `${activeAutosave}s`}
          </span>
        </button>
      </div>
    </div>
  );
});
