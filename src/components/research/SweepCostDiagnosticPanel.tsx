import {
  AlertTriangle,
  Cpu,
  Download,
  Scissors,
  Upload,
  Zap,
} from 'lucide-react';
import { memo, useMemo, useRef, useState } from 'react';
import {
  downloadColabNotebook,
  type ColabExportScope,
} from '../../engine/colabExporter';
import {
  buildQuickTrimConfig,
  estimateSweepComputeCost,
  formatDurationCompact,
} from '../../engine/sweepCostEstimator';
import type {
  ResearchProgress,
  ResearchSweepConfig,
  ResearchTrialResult,
} from '../../engine/types';
import { useLanguage } from '../../i18n/LanguageContext';

interface SweepCostDiagnosticPanelProps {
  sweepConfig: ResearchSweepConfig;
  progress?: ResearchProgress;
  cachedResults: readonly ResearchTrialResult[];
  remainingTrialsCount: number;
  activeRunLabel: string;
  isBusy: boolean;
  onChangeConfig: (next: ResearchSweepConfig) => void;
  onImportJsonDataset: (file: File) => void;
}

const RUNTIME_PRESETS = [30, 55, 110] as const;

export const SweepCostDiagnosticPanel = memo(function SweepCostDiagnosticPanel({
  sweepConfig,
  progress,
  cachedResults,
  remainingTrialsCount,
  activeRunLabel,
  isBusy,
  onChangeConfig,
  onImportJsonDataset,
}: SweepCostDiagnosticPanelProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [exportScope, setExportScope] = useState<ColabExportScope>('REMAINING');
  const [maxRuntimeMin, setMaxRuntimeMin] = useState<number>(55);
  const [lastExportNote, setLastExportNote] = useState<string | null>(null);

  const effectiveScope: ColabExportScope =
    remainingTrialsCount > 0 && cachedResults.length > 0 ? exportScope : 'FULL';

  const estimate = useMemo(
    () =>
      estimateSweepComputeCost(
        sweepConfig,
        effectiveScope === 'REMAINING' ? remainingTrialsCount : undefined,
        progress
          ? {
              liveTicksPerSec: progress.liveTicksPerSec,
              gpuActive: progress.gpuActive,
              computeBackend: progress.computeBackend,
            }
          : undefined
      ),
    [
      sweepConfig,
      effectiveScope,
      remainingTrialsCount,
      progress?.liveTicksPerSec,
      progress?.gpuActive,
      progress?.computeBackend,
    ]
  );

  const hasLiveRate = (progress?.liveTicksPerSec ?? 0) > 10000;

  const handleExportNotebook = () => {
    const summary = downloadColabNotebook(sweepConfig, {
      scope: effectiveScope,
      cachedResults,
      runLabel: activeRunLabel,
      maxRuntimeMinutes: maxRuntimeMin,
      checkpointEvery: 50,
    });
    setLastExportNote(
      summary.skippedCachedCount > 0
        ? t('research.downloadedColabWithSkipped', {
            filename: summary.filename,
            count: summary.exportedTrialsCount.toLocaleString(),
            skipped: summary.skippedCachedCount.toLocaleString(),
          })
        : t('research.downloadedColab', {
            filename: summary.filename,
            count: summary.exportedTrialsCount.toLocaleString(),
          })
    );
  };

  return (
    <div className="space-y-4">
      {/* Compact 3-Card ETA Strip */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <div
          className={`rounded-lg border p-3 ${
            estimate.recommendColab
              ? 'border-amber-500/40 bg-amber-500/5'
              : 'border-emerald-500/35 bg-emerald-500/5'
          }`}
        >
          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
            <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-slate-200 truncate">
              <Cpu className="h-3.5 w-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {t('research.local')} · {estimate.activeLocalModeLabel}
              </span>
            </span>
            <span className="font-mono text-[10px] text-cyan-300 shrink-0 tabular-nums">
              {hasLiveRate ? '' : '~'}
              {estimate.localThroughputMps}M/s
            </span>
          </div>
          <div
            className={`mt-1.5 font-mono text-xl font-bold tabular-nums ${
              estimate.recommendColab ? 'text-amber-300' : 'text-emerald-300'
            }`}
          >
            {formatDurationCompact(estimate.localEstSec)}
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-slate-400 tabular-nums">
            {estimate.remainingTrials.toLocaleString()} {t('research.trials')} ·{' '}
            {hasLiveRate
              ? t('research.liveMeasured')
              : t('research.analyticalEst')}
          </div>
        </div>

        <div
          className={`rounded-lg border p-3 ${
            estimate.recommendColab
              ? 'border-cyan-400/50 bg-cyan-500/10'
              : 'border-slate-800 bg-[#0B1120]'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-medium text-cyan-200">
              <Zap className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
              Colab T4 (Free)
            </span>
            <span className="font-mono text-[10px] text-cyan-300 tabular-nums">
              {estimate.t4SpeedupX}×
            </span>
          </div>
          <div className="mt-1.5 font-mono text-xl font-bold text-white tabular-nums">
            {formatDurationCompact(estimate.colabT4Sec)}
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-slate-400">
            CUDA C++ · 40 SM · F64 audit
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-medium text-slate-200">Colab L4 / A100</span>
            <span className="font-mono text-[10px] text-violet-300">58–108 SM</span>
          </div>
          <div className="mt-1.5 font-mono text-xl font-bold text-emerald-300 tabular-nums">
            {formatDurationCompact(estimate.colabL4Sec)}
            <span className="text-xs font-normal text-slate-500">
              {' '}
              / {formatDurationCompact(estimate.colabA100Sec)}
            </span>
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-slate-400 tabular-nums">
            {estimate.gpuEligibleTrials.toLocaleString()} GPU ·{' '}
            {estimate.cpuOnlyTrials.toLocaleString()} CPU-Spec
          </div>
        </div>
      </div>

      {/* Export / Import Controls */}
      <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 font-mono text-[11px]">
            <button
              type="button"
              disabled={cachedResults.length === 0}
              onClick={() => setExportScope('REMAINING')}
              className={`rounded-md px-2.5 py-1 cursor-pointer transition-colors disabled:opacity-40 ${
                effectiveScope === 'REMAINING'
                  ? 'bg-cyan-500/20 text-cyan-200 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Delta ({remainingTrialsCount.toLocaleString()})
            </button>
            <button
              type="button"
              onClick={() => setExportScope('FULL')}
              className={`rounded-md px-2.5 py-1 cursor-pointer transition-colors ${
                effectiveScope === 'FULL'
                  ? 'bg-cyan-500/20 text-cyan-200 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('research.fullGrid')} ({estimate.activeTrials.toLocaleString()})
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-400">
              {t('research.colabCap')}
            </span>
            {RUNTIME_PRESETS.map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setMaxRuntimeMin(mins)}
                className={`rounded border px-2 py-0.5 font-mono text-[10px] cursor-pointer transition-colors ${
                  maxRuntimeMin === mins
                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 font-semibold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                onImportJsonDataset(f);
                e.target.value = '';
              }
            }}
          />

          <div className="flex flex-wrap items-center gap-2">
            {!isBusy && estimate.localEstSec > 900 && (
              <button
                type="button"
                onClick={() => onChangeConfig(buildQuickTrimConfig(sweepConfig))}
                title={t('research.trimsGenerationBudgetRepeatsPop')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-medium text-amber-200 cursor-pointer hover:bg-amber-500/20"
              >
                <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
                Pilot &lt;15m
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-medium text-slate-200 cursor-pointer hover:border-cyan-500/50 hover:text-cyan-200"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              {t('research.importColabJson')}
            </button>
          </div>

          <button
            type="button"
            disabled={estimate.remainingTrials === 0}
            onClick={handleExportNotebook}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[11px] font-semibold cursor-pointer transition-colors disabled:opacity-40 ${
              estimate.recommendColab
                ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                : 'border border-cyan-500/45 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25'
            }`}
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {t('research.exportIpynbNotebook')}
          </button>
        </div>

        {lastExportNote && (
          <div className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 font-mono text-[10px] text-emerald-200">
            {lastExportNote}
          </div>
        )}
      </div>

      {/* Bottlenecks (shown only when meaningful) */}
      {estimate.bottlenecks.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium text-slate-400">
            {t('research.primaryTimeBottlenecks')}
          </div>
          {estimate.bottlenecks.slice(0, 3).map((item, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-3 rounded-lg border border-slate-800/90 bg-[#0B1120] px-3 py-2"
            >
              <div className="flex items-start gap-2 min-w-0">
                <AlertTriangle
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                    item.severity === 'critical'
                      ? 'text-amber-400'
                      : item.severity === 'warn'
                        ? 'text-cyan-400'
                        : 'text-slate-400'
                  }`}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-200">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {item.detail}
                  </div>
                </div>
              </div>
              <span className="font-mono text-[10px] text-slate-300 whitespace-nowrap shrink-0 tabular-nums">
                {item.impactLabel}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
