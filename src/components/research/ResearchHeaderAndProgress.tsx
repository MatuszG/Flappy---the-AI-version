import {
  Check,
  Copy,
  Download,
  FastForward,
  FlaskConical,
  Pause,
  Play,
  RotateCcw,
  Save,
  Square,
  Upload,
} from 'lucide-react';
import { memo, useRef, useState, type ReactNode } from 'react';
import {
  ARCHITECTURE_META,
  formatTopologyLabel,
  getTrialComputeProfile,
  WEIGHT_PRECISION_META,
} from '../../engine/neuralNetwork';
import { ALGORITHM_SHORT_LABELS } from '../../engine/researchReport';
import { resolveEnvironment } from '../../engine/simulation';
import type {
  ResearchProgress,
  ResearchSweepConfig,
} from '../../engine/types';
import labHeroBannerImg from '../../assets/images/lab_hero_banner_1795032938322.jpg';
import { useLanguage } from '../../i18n/LanguageContext';

interface ResearchHeaderAndProgressProps {
  sweepConfig: ResearchSweepConfig;
  progress: ResearchProgress;
  resultsCount: number;
  totalPerfect: number;
  totalPlannedTrials: number;
  remainingTrialsCount: number;
  autosavedAt: string | null;
  unsavedCount: number;
  wasInterrupted: boolean;
  utilityDock?: ReactNode;
  onStartSweep: () => void;
  onContinueSweep: () => void;
  onPauseSweep: () => void;
  onResumeSweep: () => void;
  onSkipTrial: () => void;
  onStopSweep: () => void;
  onSaveSessionNow: () => void;
  onExportColab?: () => void;
  onImportJsonDataset?: (file: File) => void;
  onLoadGithubLake?: () => void;
  githubLakeMeta?: {
    runCount: number;
    totalTrials: number;
    totalPerfect: number;
    updatedAt: string;
  } | null;
  onGetPerfReport?: () => string | null;
}

export const ResearchHeaderAndProgress = memo(function ResearchHeaderAndProgress({
  sweepConfig,
  progress,
  resultsCount,
  totalPerfect,
  totalPlannedTrials,
  remainingTrialsCount,
  autosavedAt,
  unsavedCount,
  wasInterrupted,
  utilityDock,
  onStartSweep,
  onContinueSweep,
  onPauseSweep,
  onResumeSweep,
  onSkipTrial,
  onStopSweep,
  onSaveSessionNow,
  onExportColab,
  onImportJsonDataset,
  onLoadGithubLake,
  githubLakeMeta,
  onGetPerfReport,
}: ResearchHeaderAndProgressProps) {
  const { t } = useLanguage();
  const [bannerError, setBannerError] = useState(false);
  const [copiedPerfLog, setCopiedPerfLog] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const isRunning = progress.status === 'RUNNING';
  const isPaused = progress.status === 'PAUSED';
  const isBusy = isRunning || isPaused;

  const pctComplete =
    progress.totalTrials > 0
      ? Math.min(
          100,
          Math.round((progress.completedTrials / progress.totalTrials) * 100)
        )
      : 0;

  const busyWorkerSlots = progress.activeWorkers.filter(
    (w) => w.phase !== 'IDLE'
  );

  return (
    <section className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#111827]">
      <div className="relative min-h-[124px] flex flex-col justify-center px-5 py-4 md:px-6 md:py-5">
        {!bannerError ? (
          <img
            src={labHeroBannerImg}
            alt={t('research.geometricCyanBirdNavigatingEmerald')}
            referrerPolicy="no-referrer"
            onError={() => setBannerError(true)}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45"
          />
        ) : (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0B1528] via-[#112240] to-[#0B1120]" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0B1120] via-[#0B1120]/90 to-[#0B1120]/50" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="font-display text-xl font-bold tracking-tight text-white md:text-2xl text-balance">
              {t('research.neurolabAblationEvolutionBench')}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] tabular-nums text-slate-400">
              <span>
                {resultsCount.toLocaleString()} {t('research.cached')}
              </span>
              {sweepConfig.curriculumLearning && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-violet-300">Curriculum</span>
                </>
              )}
              {sweepConfig.shapedFitness && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-emerald-300">Shaped Fitness</span>
                </>
              )}
              {sweepConfig.evolutionTopologyMode === 'ISLAND_SPECIATION' && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-amber-300">
                    {t('research.k12ArchIslandsCpu')}
                  </span>
                </>
              )}
              {autosavedAt && (
                <>
                  <span className="text-slate-600">·</span>
                  <span>
                    {t('research.saved')}{' '}
                    {new Date(autosavedAt).toLocaleTimeString()}
                  </span>
                </>
              )}
              {unsavedCount > 0 && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-cyan-300">
                    {unsavedCount} {t('research.unsaved')}
                  </span>
                  <button
                    type="button"
                    onClick={onSaveSessionNow}
                    className="inline-flex items-center gap-1 rounded border border-cyan-500/40 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-200 cursor-pointer hover:bg-cyan-500/20"
                  >
                    <Save className="h-2.5 w-2.5" aria-hidden="true" />
                    {t('research.save')}
                  </button>
                </>
              )}
              {wasInterrupted && remainingTrialsCount > 0 && !isBusy && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-amber-300">
                    {t('research.resumedLeft', { remainingTrialsCou: remainingTrialsCount })}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex min-w-0 w-full sm:w-auto flex-wrap items-center gap-2">
            {!isBusy ? (
              <>
                {resultsCount > 0 &&
                remainingTrialsCount > 0 &&
                remainingTrialsCount < totalPlannedTrials ? (
                  <>
                    <button
                      type="button"
                      onClick={onContinueSweep}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 whitespace-nowrap cursor-pointer transition-colors hover:bg-emerald-400"
                    >
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('research.continue')} ({remainingTrialsCount.toLocaleString()})
                    </button>
                    <button
                      type="button"
                      onClick={onStartSweep}
                      title={t('research.discardCacheAndRestartThe')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs font-medium text-slate-200 whitespace-nowrap cursor-pointer transition-colors hover:border-cyan-500/50 hover:text-cyan-200"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('research.restart')} ({totalPlannedTrials.toLocaleString()})
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={onStartSweep}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 whitespace-nowrap cursor-pointer transition-colors hover:bg-emerald-400"
                  >
                    <FlaskConical className="h-4 w-4" aria-hidden="true" />
                    {t('research.run')} ({totalPlannedTrials.toLocaleString()} {t('research.trials')})
                  </button>
                )}
                {onExportColab && (
                  <button
                    type="button"
                    disabled={totalPlannedTrials === 0}
                    onClick={onExportColab}
                    title={t('research.exportProtocolAsGoogleColab')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200 whitespace-nowrap cursor-pointer transition-colors hover:bg-cyan-500/20 disabled:opacity-40"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    CUDA (.ipynb)
                  </button>
                )}
                {onImportJsonDataset && (
                  <>
                    <input
                      ref={importInputRef}
                      type="file"
                      accept=".json,.jsonl,application/json,application/x-ndjson"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          onImportJsonDataset(f);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => importInputRef.current?.click()}
                      title={t('research.importMergeJsonOrJsonl')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs font-medium text-slate-200 whitespace-nowrap cursor-pointer transition-colors hover:border-cyan-500/50 hover:text-cyan-200"
                    >
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      Import JSON/L
                    </button>
                  </>
                )}
                {onLoadGithubLake && githubLakeMeta && githubLakeMeta.totalTrials > 0 && (
                  <button
                    type="button"
                    onClick={onLoadGithubLake}
                    title={t('research.loadAggregatedGithubResearchData', { runCount: githubLakeMeta.runCount, totalTrials: githubLakeMeta.totalTrials, totalPerfect: githubLakeMeta.totalPerfect })}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-200 whitespace-nowrap cursor-pointer transition-colors hover:bg-emerald-500/20"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    GitHub Lake ({githubLakeMeta.totalTrials.toLocaleString()})
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={isRunning ? onPauseSweep : onResumeSweep}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-xs font-semibold text-slate-950 whitespace-nowrap cursor-pointer transition-colors hover:bg-cyan-400"
                >
                  {isRunning ? (
                    <>
                      <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('research.pauseSweep')}
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('research.resumeSweep')}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onSkipTrial}
                  title={t('research.finalizeSkipTheSlowestActive')}
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5 text-xs font-medium text-amber-200 whitespace-nowrap cursor-pointer transition-colors hover:bg-amber-500/20"
                >
                  <FastForward className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('research.skipSlow')}
                </button>
                <button
                  type="button"
                  onClick={onStopSweep}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/90 px-4 py-2.5 text-xs font-medium text-slate-200 whitespace-nowrap cursor-pointer transition-colors hover:border-red-500/50 hover:text-red-300"
                >
                  <Square className="h-3.5 w-3.5" aria-hidden="true" />
                  Stop
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {utilityDock && (
        <div className="border-t border-slate-800/80 bg-[#0B1120]/80 px-5 py-2 flex flex-wrap items-center justify-between gap-2">
          {utilityDock}
        </div>
      )}

      {/* Live Sweep Progress Strip */}
      {(isBusy || progress.status === 'COMPLETED') && (
        <div className="border-t border-slate-800 bg-[#0B1120]/90 px-6 py-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs tabular-nums">
            <div className="text-slate-300">
              {progress.status === 'COMPLETED' ? (
                <span className="font-semibold text-emerald-300">
                  {t('research.sweepComplete')} · {resultsCount}{' '}
                  {t('research.trials')} · {totalPerfect}{' '}
                  {t('research.verifiedPerfect')} · {progress.workerCount}{' '}
                  {progress.workerCount === 1
                    ? t('research.workerSingular')
                    : t('research.workerPlural')}
                </span>
              ) : (
                <>
                  {isPaused && (
                    <>
                      <span className="rounded border border-amber-500/45 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200 whitespace-nowrap">
                        {t('research.paused')}
                      </span>
                      <span className="mx-2 text-slate-600">·</span>
                    </>
                  )}
                  <span className="font-semibold text-white">
                    {t('research.completed2')} {progress.completedTrials}/{progress.totalTrials}
                  </span>
                  {progress.workerCount > 0 && (
                    <>
                      <span className="mx-2 text-slate-600">·</span>
                      <span className="text-cyan-300">
                        {progress.workerCount} CPU
                        {(progress.auditWorkerCount ?? 0) > 0
                          ? ` + ${progress.auditWorkerCount} ${t('research.auditShort')}`
                          : ` ${
                              progress.workerCount === 1
                                ? t('research.workerSingular')
                                : t('research.workerPlural')
                            }`}
                      </span>
                    </>
                  )}
                  {(progress.gpuActive ||
                    progress.computeBackend === 'GPU' ||
                    progress.computeBackend === 'HYBRID') && (
                    <>
                      <span className="mx-2 text-slate-600">·</span>
                      <span className="text-emerald-300">
                        {progress.gpuLabel?.startsWith('WebGL2')
                          ? 'WebGL2 GPU'
                          : 'WebGPU'}
                        {(progress.gpuActiveTrials ?? 0) > 0
                          ? ` (${progress.gpuActiveTrials} ${t('research.trials')}`
                          : ` (${t('research.booting')}`}
                        {(progress.gpuTicksPerSec ?? 0) > 0
                          ? ` · ${((progress.gpuTicksPerSec ?? 0) / 1e6).toFixed(1)}M t/s)`
                          : ')'}
                      </span>
                    </>
                  )}
                  {progress.autoTuneStatus && (
                    <>
                      <span className="mx-2 text-slate-600">·</span>
                      <span className="text-violet-300">
                        {progress.autoTuneStatus}
                      </span>
                    </>
                  )}
                  {(progress.activeAuditSeeds ?? 0) > 0 && (
                    <>
                      <span className="mx-2 text-slate-600">·</span>
                      <span className="text-amber-300">
                        {progress.activeAuditSeeds}{' '}
                        {progress.activeAuditSeeds === 1
                          ? t('research.auditSeedSingular')
                          : t('research.auditSeedPlural')}
                      </span>
                    </>
                  )}
                  {typeof progress.queueRemaining === 'number' && (
                    <>
                      <span className="mx-2 text-slate-600">·</span>
                      <span>
                        {t('research.queue')}: {progress.queueRemaining}{' '}
                        {t('research.left')}
                      </span>
                    </>
                  )}
                  <span className="mx-2 text-slate-600">·</span>
                  <span>
                    {t('research.cap')}{' '}
                    {sweepConfig.maxGenerations === null
                      ? t('research.unlimitedGens')
                      : `${sweepConfig.maxGenerations} ${t('research.gensShort')}`}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 text-slate-400">
              <span>
                {t('research.active')}{' '}
                {(progress.elapsedMs / 1000).toFixed(1)}s · {pctComplete}%
                {isBusy &&
                  progress.totalTrials > progress.completedTrials &&
                  (() => {
                    const sessionDone =
                      progress.sessionCompletedTrials ?? progress.completedTrials;
                    const fallbackRate =
                      sessionDone >= 2 && progress.elapsedMs >= 1500
                        ? sessionDone / (progress.elapsedMs / 1000)
                        : 0;
                    const rate =
                      progress.liveTrialsPerSec && progress.liveTrialsPerSec > 0
                        ? progress.liveTrialsPerSec
                        : fallbackRate;
                    if (rate <= 0.005) return null;
                    const remSec = Math.max(
                      1,
                      Math.round(
                        (progress.totalTrials - progress.completedTrials) /
                          Math.max(0.01, rate)
                      )
                    );
                    const etaStr =
                      remSec >= 3600
                        ? `${Math.floor(remSec / 3600)}h ${Math.floor(
                            (remSec % 3600) / 60
                          )}m`
                        : remSec >= 60
                          ? `${Math.floor(remSec / 60)}m ${remSec % 60}s`
                          : `${remSec}s`;
                    return isPaused
                      ? ` · ${rate.toFixed(1)} t/s · ~${etaStr} (${t('research.pausedShort')})`
                      : ` · ${rate.toFixed(1)} t/s · ~${etaStr} ${t('research.etaLeft')}`;
                  })()}
              </span>
              {onGetPerfReport && (
                <button
                  type="button"
                  title={t('research.copyTemporaryWorkerMainThread')}
                  onClick={() => {
                    const md = onGetPerfReport();
                    if (!md) return;
                    // eslint-disable-next-line no-console
                    console.log(md);
                    if (navigator.clipboard?.writeText) {
                      void navigator.clipboard.writeText(md).then(() => {
                        setCopiedPerfLog(true);
                        window.setTimeout(
                          () => setCopiedPerfLog(false),
                          1800
                        );
                      });
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded border border-slate-700/80 bg-slate-900/90 px-2 py-0.5 text-[11px] font-medium text-slate-300 cursor-pointer transition-colors hover:border-cyan-500/50 hover:text-cyan-200"
                >
                  {copiedPerfLog ? (
                    <>
                      <Check
                        className="h-3 w-3 text-emerald-400"
                        aria-hidden="true"
                      />
                      {t('research.copiedTrace')}
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" aria-hidden="true" />
                      {t('research.copyPerfLog')}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full origin-left bg-emerald-400 transition-transform duration-150"
              style={{
                transform: `scaleX(${
                  progress.status === 'COMPLETED' ? 1 : pctComplete / 100
                })`,
              }}
            />
          </div>

          {isBusy && busyWorkerSlots.length > 0 && (
            <div className="grid grid-cols-1 gap-2 pt-0.5 sm:grid-cols-2 lg:grid-cols-4">
              {busyWorkerSlots.map((slot) => (
                <div
                  key={`${slot.workerId}-${slot.trialIndex}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#111827] px-3 py-1.5 font-mono text-[11px] tabular-nums"
                >
                  <div className="min-w-0 truncate text-slate-200">
                    <span
                      className={
                        slot.workerId >= 200
                          ? 'text-emerald-300 font-semibold'
                          : 'text-cyan-300 font-semibold'
                      }
                    >
                      {slot.workerId >= 200
                        ? `GPU#${slot.workerId - 200}`
                        : `W${slot.workerId}`}
                    </span>{' '}
                    {slot.algorithm
                      ? ALGORITHM_SHORT_LABELS[slot.algorithm]
                      : '—'}{' '}
                    ·{' '}
                    {slot.difficulty
                      ? resolveEnvironment(
                          slot.difficulty,
                          sweepConfig.customEnvironment
                        ).label
                      : '—'}{' '}
                    ·{' '}
                    {formatTopologyLabel(
                      slot.topology,
                      slot.inputFeatures?.length ?? 5
                    )}
                    {slot.evolutionTopologyMode === 'ISLAND_SPECIATION' ? (
                      <span className="text-amber-300"> · 5-Islands ◇CPU</span>
                    ) : (
                      <>
                        {slot.architecture && slot.architecture !== 'MLP' && (
                          <span className="text-violet-300">
                            {' '}
                            · {ARCHITECTURE_META[slot.architecture].shortLabel}
                          </span>
                        )}
                        {(slot.computeProfile ??
                          getTrialComputeProfile(
                            slot.architecture ?? 'MLP',
                            slot.evolutionTopologyMode ?? 'SINGLE_SPECIES'
                          )) === 'CPU_SPECIALIZED' && (
                          <span className="text-amber-300"> · ◇CPU</span>
                        )}
                      </>
                    )}
                    {slot.weightPrecision &&
                      slot.weightPrecision !== 'FP32' && (
                        <span className="text-amber-300">
                          {' '}
                          ·{' '}
                          {
                            WEIGHT_PRECISION_META[slot.weightPrecision]
                              .shortLabel
                          }
                        </span>
                      )}
                  </div>
                  <div className="shrink-0 text-right">
                    {slot.phase === 'AUDITING' ? (
                      <span className="text-amber-300">
                        {slot.auditDetail ?? 'Audit…'}
                      </span>
                    ) : (
                      <span className="text-emerald-300">
                        G{slot.generation}
                        {sweepConfig.maxGenerations !== null
                          ? `/${sweepConfig.maxGenerations}`
                          : ''}{' '}
                        · {slot.bestScore}p
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
});
