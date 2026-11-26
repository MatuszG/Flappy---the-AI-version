import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Download,
  History,
  Layers,
  Play,
  Plus,
  RotateCcw,
  Square,
  Trash2,
} from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import {
  buildMetaAnalysisBundle,
  countPlannedTrials,
  formatConfigSummary,
} from '../engine/experimentPresets';
import { resolvePowerProfile } from '../engine/powerProfile';
import { getHardwareCores } from '../engine/researchPool';
import type {
  ExperimentRunRecord,
  QueuedExperiment,
  ResearchProgress,
  ResearchSweepConfig,
} from '../engine/types';
import { useLanguage } from '../i18n/LanguageContext';

export interface ExperimentHistoryAndQueuePanelProps {
  sweepConfig: ResearchSweepConfig;
  progress: ResearchProgress;
  activeRunLabel: string;
  queue: QueuedExperiment[];
  queueActive: boolean;
  history: ExperimentRunRecord[];
  onEnqueueCurrent: (customName?: string) => void;
  onEnqueueThermalSweep: () => void;
  onEnqueueValidationSuite: () => void;
  onRemoveQueueItem: (id: string) => void;
  onMoveQueueItem: (id: string, dir: -1 | 1) => void;
  onClearQueue: () => void;
  onStartQueue: () => void;
  onStopQueue: () => void;
  onLoadConfigFromHistory: (cfg: ResearchSweepConfig, label: string) => void;
  onRequeueFromHistory: (rec: ExperimentRunRecord) => void;
  onMarkReviewed: (
    ids: string[],
    patch: {
      perfReviewedAt?: string | null;
      reportReviewedAt?: string | null;
      metaReviewedAt?: string | null;
    }
  ) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
  defaultExpanded?: boolean;
}

function formatDurationShort(sec: number): string {
  if (!Number.isFinite(sec) || sec < 1) return '<1s';
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export const ExperimentHistoryAndQueuePanel = memo(
  function ExperimentHistoryAndQueuePanel({
    sweepConfig,
    progress,
    activeRunLabel,
    queue,
    queueActive,
    history,
    onEnqueueCurrent,
    onRemoveQueueItem,
    onMoveQueueItem,
    onClearQueue,
    onStartQueue,
    onStopQueue,
    onLoadConfigFromHistory,
    onRequeueFromHistory,
    onMarkReviewed,
    onDeleteHistoryItem,
    onClearHistory,
  }: ExperimentHistoryAndQueuePanelProps) {
    const { t } = useLanguage();
    const hardwareCores = useMemo(() => getHardwareCores(), []);
    const [activeTab, setActiveTab] = useState<'HISTORY' | 'QUEUE'>('HISTORY');
    const [customRunName, setCustomRunName] = useState('');
    const [copiedNote, setCopiedNote] = useState<string | null>(null);

    const isBusy =
      progress.status === 'RUNNING' || progress.status === 'PAUSED';
    const pendingQueueCount = useMemo(
      () => queue.filter((q) => q.status === 'PENDING').length,
      [queue]
    );

    const copyMarkdown = (content: string, filename: string, label: string) => {
      if (navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(content).catch(() => {
          const blob = new Blob([content], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
        });
      }
      setCopiedNote(label);
      window.setTimeout(() => setCopiedNote(null), 2600);
    };

    const handleCopySingleRun = (rec: ExperimentRunRecord) => {
      const md = buildMetaAnalysisBundle([rec], 'BOTH');
      copyMarkdown(
        md,
        `neurolab-run-${rec.id}.md`,
        t('research.copied', { name: rec.name })
      );
      const nowIso = new Date().toISOString();
      onMarkReviewed([rec.id], {
        perfReviewedAt: nowIso,
        reportReviewedAt: nowIso,
        metaReviewedAt: nowIso,
      });
    };

    const handleCopyAll = () => {
      if (history.length === 0) return;
      const md = buildMetaAnalysisBundle(history, 'BOTH');
      copyMarkdown(
        md,
        `neurolab-history-${Date.now()}.md`,
        t('research.copiedReport', { history: history.length })
      );
    };

    return (
      <div className="space-y-4">
        {/* Single clean tab bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="inline-flex rounded-lg border border-slate-800 bg-[#0B1120] p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('HISTORY')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                activeTab === 'HISTORY'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
              {t('research.history')} ({history.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('QUEUE')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                activeTab === 'QUEUE'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
              {t('research.queue')} ({pendingQueueCount})
              {queueActive && (
                <span className="font-mono text-[10px] text-emerald-300">
                  · ON
                </span>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {copiedNote && (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-300">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                {copiedNote}
              </span>
            )}
            {activeTab === 'HISTORY' && history.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1.5 text-[11px] font-medium text-cyan-200 cursor-pointer hover:bg-cyan-500/20"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('research.copyMdReport')}
                </button>
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-[#0B1120] px-2.5 py-1.5 text-[11px] text-slate-400 cursor-pointer hover:text-rose-300"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('research.clear')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* HISTORY TAB */}
        {activeTab === 'HISTORY' && (
          <div className="space-y-2">
            {history.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-800 bg-[#0B1120]/60 p-6 text-center text-xs text-slate-400">
                {t('research.noArchivedRunsYetFinished')}
              </div>
            ) : (
              <div className="space-y-2 max-h-[56vh] overflow-y-auto pr-1">
                {history.map((rec) => {
                  const pm = rec.perfMetrics;
                  const speedText = pm?.ticksMPerSec
                    ? `${pm.ticksMPerSec.toFixed(1)}M/s`
                    : '—';
                  const finishedDate = new Date(
                    rec.completedAt || rec.startedAt
                  ).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const plannedTrials = countPlannedTrials(rec.config);

                  return (
                    <div
                      key={rec.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-800 bg-[#0B1120] px-3.5 py-2.5"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-slate-100 truncate">
                            {rec.name}
                          </span>
                          <span
                            className={`font-mono text-[10px] ${
                              rec.status === 'COMPLETED'
                                ? 'text-emerald-300'
                                : 'text-amber-300'
                            }`}
                          >
                            {rec.status === 'COMPLETED'
                              ? t('research.completed')
                              : t('research.stopped')}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {finishedDate}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[11px] tabular-nums text-slate-400">
                          <span>
                            <strong className="text-slate-200">
                              {rec.summary.totalTrials}/{plannedTrials}
                            </strong>{' '}
                            {t('research.trials')}
                          </span>
                          <span className="text-emerald-300">
                            {rec.summary.verifiedPerfect} perfect
                          </span>
                          <span>{formatDurationShort(rec.durationSec)}</span>
                          <span className="text-cyan-300">{speedText}</span>
                          <span>{pm?.backendLabel ?? rec.config.computeBackend ?? 'AUTO'}</span>
                        </div>

                        <p className="truncate font-mono text-[10px] text-slate-500">
                          {formatConfigSummary(rec.config, hardwareCores)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            onLoadConfigFromHistory(rec.config, rec.name)
                          }
                          title={t('research.loadThisRunConfiguration')}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] text-slate-200 cursor-pointer hover:border-cyan-500/50 hover:text-cyan-200"
                        >
                          <RotateCcw className="h-3 w-3" aria-hidden="true" />
                          {t('research.load')}
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequeueFromHistory(rec)}
                          title={t('research.addToQueue')}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 text-[11px] text-slate-300 cursor-pointer hover:border-amber-500/40 hover:text-amber-200"
                        >
                          <Plus className="h-3 w-3" aria-hidden="true" />Q
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopySingleRun(rec)}
                          title={t('research.copyMarkdownReport')}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 text-[11px] text-slate-300 cursor-pointer hover:border-emerald-500/40 hover:text-emerald-200"
                        >
                          <Copy className="h-3 w-3" aria-hidden="true" />
                          MD
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteHistoryItem(rec.id)}
                          aria-label={t('research.deleteRun')}
                          className="rounded-md border border-slate-800 bg-slate-950 p-1.5 text-slate-500 cursor-pointer hover:text-rose-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* QUEUE TAB */}
        {activeTab === 'QUEUE' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={customRunName}
                onChange={(e) => setCustomRunName(e.target.value)}
                placeholder={t('research.optionalJobLabelEG')}
                className="flex-1 min-w-[200px] rounded-lg border border-slate-700 bg-[#0B1120] px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  onEnqueueCurrent(customRunName.trim() || undefined);
                  setCustomRunName('');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/50 bg-cyan-500/15 px-3 py-1.5 text-xs font-medium text-cyan-100 whitespace-nowrap cursor-pointer hover:bg-cyan-500/25"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                {t('research.addCurrent')} (
                {countPlannedTrials(sweepConfig).toLocaleString()})
              </button>

              {!queueActive ? (
                <button
                  type="button"
                  disabled={pendingQueueCount === 0 || isBusy}
                  onClick={onStartQueue}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 cursor-pointer hover:bg-emerald-400 disabled:opacity-40"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('research.runQueue')} ({pendingQueueCount})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onStopQueue}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/50 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200 cursor-pointer hover:bg-rose-500/25"
                >
                  <Square className="h-3 w-3" aria-hidden="true" />
                  {t('research.stopQueue')}
                </button>
              )}

              {queue.length > 0 && (
                <button
                  type="button"
                  disabled={queueActive && isBusy}
                  onClick={onClearQueue}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-[#0B1120] px-2.5 py-1.5 text-[11px] text-slate-400 cursor-pointer hover:text-rose-300 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('research.clear')}
                </button>
              )}
            </div>

            {queueActive && isBusy && (
              <div className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 font-mono text-xs text-cyan-100 flex items-center justify-between gap-2">
                <span className="truncate">
                  {t('research.activeJob')}{' '}
                  <strong>{activeRunLabel}</strong>
                </span>
                <span className="text-cyan-300 shrink-0 tabular-nums">
                  {pendingQueueCount} {t('research.pending')}
                </span>
              </div>
            )}

            {queue.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-800 bg-[#0B1120]/60 p-6 text-center text-xs text-slate-400">
                {t('research.queueIsEmptyAddYour')}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
                {queue.map((item, idx) => {
                  const planned = countPlannedTrials(item.config);
                  const pPlan = resolvePowerProfile(
                    item.config.performancePriority ?? 70,
                    hardwareCores
                  );
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs ${
                        item.status === 'RUNNING'
                          ? 'border-cyan-500/50 bg-cyan-500/10'
                          : item.status === 'COMPLETED'
                            ? 'border-emerald-500/30 bg-emerald-500/5 opacity-75'
                            : 'border-slate-800 bg-[#0B1120]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-500">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold text-slate-100 truncate">
                            {item.name}
                          </span>
                          <span
                            className={`font-mono text-[10px] ${
                              item.status === 'RUNNING'
                                ? 'text-cyan-300'
                                : item.status === 'COMPLETED'
                                  ? 'text-emerald-300'
                                  : item.status === 'STOPPED'
                                    ? 'text-amber-300'
                                    : 'text-slate-400'
                            }`}
                          >
                            {item.status === 'RUNNING'
                              ? t('research.running')
                              : item.status === 'COMPLETED'
                                ? t('research.completed')
                                : item.status === 'STOPPED'
                                  ? t('research.stopped')
                                  : t('research.pending2')}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                            {planned.toLocaleString()} {t('research.trials')} ·{' '}
                            {item.config.computeBackend ?? 'AUTO'} ·{' '}
                            {pPlan.priority}%
                          </span>
                        </div>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-slate-500">
                          {formatConfigSummary(item.config, hardwareCores)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0 || item.status === 'RUNNING'}
                          onClick={() => onMoveQueueItem(item.id, -1)}
                          className="rounded border border-slate-800 bg-slate-900 p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          aria-label={t('research.moveUp')}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={
                            idx === queue.length - 1 || item.status === 'RUNNING'
                          }
                          onClick={() => onMoveQueueItem(item.id, 1)}
                          className="rounded border border-slate-800 bg-slate-900 p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          aria-label={t('research.moveDown')}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={item.status === 'RUNNING'}
                          onClick={() => onRemoveQueueItem(item.id)}
                          className="rounded border border-slate-800 bg-slate-900 p-1 text-slate-400 hover:text-rose-300 disabled:opacity-30 cursor-pointer"
                          aria-label={t('research.removeFromQueue')}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);
