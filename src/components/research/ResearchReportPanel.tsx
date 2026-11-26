import {
  Check,
  Copy,
  Cpu,
  Download,
  FileJson,
  FileText,
  Trash2,
  Upload,
} from 'lucide-react';
import { memo, useRef, useState } from 'react';
import { analyticsClient } from '../../engine/analyticsClient';
import {
  ARCHITECTURE_META,
  WEIGHT_PRECISION_META,
} from '../../engine/neuralNetwork';
import { SENSOR_NAMES } from '../../engine/policyAnalysis';
import {
  ALGORITHM_SHORT_LABELS,
  estimateLlmTokens,
  getTrialComputeMs,
  type ResearchFindings,
} from '../../engine/researchReport';
import { resolveEnvironment } from '../../engine/simulation';
import type {
  ResearchSweepConfig,
  ResearchTrialResult,
} from '../../engine/types';
import researchEmblemImg from '../../assets/images/research_emblem_1795032939270.jpg';
import { useLanguage } from '../../i18n/LanguageContext';
import { formatNormCompute } from './researchUtils';

interface ResearchReportPanelProps {
  sweepConfig: ResearchSweepConfig;
  results: ResearchTrialResult[];
  findings: ResearchFindings;
  isBusy: boolean;
  onImportJsonDataset: (file: File) => void;
  onLoadGithubLake?: () => void;
  githubLakeMeta?: {
    runCount: number;
    totalTrials: number;
    totalPerfect: number;
    updatedAt: string;
  } | null;
  onClearSavedSession: () => void;
}

export const ResearchReportPanel = memo(function ResearchReportPanel({
  sweepConfig,
  results,
  findings,
  isBusy,
  onImportJsonDataset,
  onLoadGithubLake,
  githubLakeMeta,
  onClearSavedSession,
}: ResearchReportPanelProps) {
  const { t } = useLanguage();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [emblemError, setEmblemError] = useState(false);
  const [copiedLlmMeta, setCopiedLlmMeta] = useState<string | null>(null);
  const [copiedDeltaMeta, setCopiedDeltaMeta] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState<
    null | 'copy' | 'delta' | 'md' | 'csv' | 'json' | 'llmpack'
  >(null);

  const triggerDownload = (
    content: string,
    filename: string,
    mime: string
  ) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAiDelta = async () => {
    if (results.length === 0 || exportBusy) return;
    setExportBusy('delta');
    try {
      const md = await analyticsClient.exportAiDeltaDigest(results, sweepConfig);
      const tokens = estimateLlmTokens(md);
      const label = `~${(tokens / 1000).toFixed(1)}k tok`;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(md);
          setCopiedDeltaMeta(label);
          window.setTimeout(() => setCopiedDeltaMeta(null), 2600);
          return;
        } catch {
          // Fall through to download
        }
      }
      triggerDownload(
        md,
        `flappy-neurolab-ai-delta-${Date.now()}.md`,
        'text/markdown'
      );
    } finally {
      setExportBusy(null);
    }
  };

  const handleCopyLlmDigest = async () => {
    if (results.length === 0 || exportBusy) return;
    setExportBusy('copy');
    try {
      const md = await analyticsClient.exportMarkdown(results, sweepConfig);
      const tokens = estimateLlmTokens(md);
      const label = `~${(tokens / 1000).toFixed(1)}k tok`;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(md);
          setCopiedLlmMeta(label);
          window.setTimeout(() => setCopiedLlmMeta(null), 2600);
          return;
        } catch {
          // Fall through to download
        }
      }
      triggerDownload(
        md,
        `flappy-neurolab-llm-digest-${Date.now()}.md`,
        'text/markdown'
      );
    } finally {
      setExportBusy(null);
    }
  };

  const handleExportMd = async () => {
    if (results.length === 0 || exportBusy) return;
    setExportBusy('md');
    try {
      const md = await analyticsClient.exportMarkdown(results, sweepConfig);
      triggerDownload(
        md,
        `flappy-neurolab-llm-report-${Date.now()}.md`,
        'text/markdown'
      );
    } finally {
      setExportBusy(null);
    }
  };

  const handleExportLlmPack = async () => {
    if (results.length === 0 || exportBusy) return;
    setExportBusy('llmpack');
    try {
      const [md, jsonl] = await Promise.all([
        analyticsClient.exportMarkdown(results, sweepConfig),
        analyticsClient.exportJsonl(results, sweepConfig),
      ]);
      const ts = Date.now();
      triggerDownload(jsonl, `flappy-neurolab-trials-${ts}.jsonl`, 'application/x-ndjson');
      window.setTimeout(() => {
        triggerDownload(md, `flappy-neurolab-meta-dossier-${ts}.md`, 'text/markdown');
      }, 180);
    } finally {
      setExportBusy(null);
    }
  };

  const handleExportCsv = async () => {
    if (results.length === 0 || exportBusy) return;
    setExportBusy('csv');
    try {
      const csv = await analyticsClient.exportCsv(results);
      triggerDownload(
        csv,
        `flappy-neurolab-trials-${Date.now()}.csv`,
        'text/csv'
      );
    } finally {
      setExportBusy(null);
    }
  };

  const handleExportJson = async () => {
    if (results.length === 0 || exportBusy) return;
    setExportBusy('json');
    try {
      const json = await analyticsClient.exportJson(results, sweepConfig);
      triggerDownload(
        json,
        `flappy-neurolab-dataset-${Date.now()}.json`,
        'application/json'
      );
    } finally {
      setExportBusy(null);
    }
  };

  return (
    <section className="rounded-xl border border-slate-800 bg-[#111827] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 overflow-hidden rounded-lg border border-slate-700 bg-[#0B1120] shrink-0 flex items-center justify-center">
            {!emblemError ? (
              <img
                src={researchEmblemImg}
                alt={t('research.neuralNetworkBirdResearchEmblem')}
                referrerPolicy="no-referrer"
                onError={() => setEmblemError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <Cpu className="h-5 w-5 text-cyan-400" aria-hidden="true" />
            )}
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-white">
              {t('research.automatedResearchReportWorldModel')}
            </h2>
            <p className="text-xs text-slate-400">
              {t('research.computeNormalizedEmpiricalSynthesisH')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".json,.jsonl,application/json,application/x-ndjson"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onImportJsonDataset(file);
              }
              e.target.value = '';
            }}
          />
          <button
            type="button"
            disabled={isBusy}
            onClick={() => importInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 whitespace-nowrap cursor-pointer transition-colors hover:border-cyan-500/50 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            Import JSON/L
          </button>
          {onLoadGithubLake && (
            <button
              type="button"
              disabled={isBusy}
              onClick={onLoadGithubLake}
              title={
                githubLakeMeta && githubLakeMeta.totalTrials > 0
                  ? t('research.loadAggregatedGithubDataLake', { runCount: githubLakeMeta.runCount, totalTrials: githubLakeMeta.totalTrials, totalPerfect: githubLakeMeta.totalPerfect })
                  : t('research.loadAggregatedGithubResearchData2')
              }
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-200 whitespace-nowrap cursor-pointer transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              {githubLakeMeta && githubLakeMeta.totalTrials > 0
                ? `GitHub Lake (${githubLakeMeta.totalTrials.toLocaleString()})`
                : 'GitHub Lake'}
            </button>
          )}
          {results.length > 0 && !isBusy && (
            <button
              type="button"
              onClick={onClearSavedSession}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0B1120] px-3 py-2 text-xs font-medium text-slate-400 whitespace-nowrap cursor-pointer transition-colors hover:border-red-500/50 hover:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t('research.clearCache')}
            </button>
          )}
          <button
            type="button"
            disabled={results.length === 0 || exportBusy !== null}
            title={t('research.copyUltraCompactAiDelta')}
            onClick={() => void handleCopyAiDelta()}
            className="inline-flex items-center gap-2 rounded-lg border border-violet-500/50 bg-violet-500/15 px-3 py-2 text-xs font-semibold text-violet-200 whitespace-nowrap cursor-pointer transition-colors hover:bg-violet-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copiedDeltaMeta ? (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Delta ({copiedDeltaMeta})
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                {exportBusy === 'delta' ? t('research.compiling') : 'AI Delta'}
              </>
            )}
          </button>
          <button
            type="button"
            disabled={results.length === 0 || exportBusy !== null}
            title={t('research.copyCompactLlmNativeDigest')}
            onClick={() => void handleCopyLlmDigest()}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 whitespace-nowrap cursor-pointer transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copiedLlmMeta ? (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                {t('research.copied2')} ({copiedLlmMeta})
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                {exportBusy === 'copy'
                  ? t('research.compiling')
                  : t('research.copyForLlm')}
              </>
            )}
          </button>
          <button
            type="button"
            disabled={results.length === 0 || exportBusy !== null}
            title={t('research.downloadCompactLlmReadyMarkdown')}
            onClick={() => void handleExportMd()}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 whitespace-nowrap cursor-pointer transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            {exportBusy === 'md'
              ? t('research.building')
              : t('research.llmReportMd')}
          </button>
          <button
            type="button"
            disabled={results.length === 0 || exportBusy !== null}
            title={t('research.downloadLlmAnalysisPackTrials')}
            onClick={() => void handleExportLlmPack()}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/15 px-3.5 py-2 text-xs font-semibold text-amber-200 whitespace-nowrap cursor-pointer transition-colors hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {exportBusy === 'llmpack'
              ? t('research.packing')
              : 'LLM Pack (.jsonl + MD)'}
          </button>
          <button
            type="button"
            disabled={results.length === 0 || exportBusy !== null}
            title={t('research.downloadFullRawPerTrial')}
            onClick={() => void handleExportCsv()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 whitespace-nowrap cursor-pointer transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {exportBusy === 'csv' ? t('research.building') : 'Raw CSV'}
          </button>
          <button
            type="button"
            disabled={results.length === 0 || exportBusy !== null}
            title={t('research.downloadFullRawDatasetProtocol')}
            onClick={() => void handleExportJson()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 whitespace-nowrap cursor-pointer transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileJson className="h-3.5 w-3.5" aria-hidden="true" />
            {exportBusy === 'json' ? t('research.building') : 'Raw JSON'}
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6 space-y-4">
          {findings.totalTrials > 0 ? (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-3">
                <div className="text-[11px] font-medium text-slate-400">
                  {t('research.verifiedPerfection')}
                </div>
                <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-emerald-300">
                  {(
                    (findings.totalPerfect / findings.totalTrials) *
                    100
                  ).toFixed(1)}
                  %
                </div>
                <div className="mt-0.5 font-mono text-[11px] tabular-nums text-slate-400">
                  {findings.totalPerfect.toLocaleString()} /{' '}
                  {findings.totalTrials.toLocaleString()} ·{' '}
                  {findings.generationDistribution.g1Pct}% G1
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-3">
                <div className="text-[11px] font-medium text-slate-400">
                  {t('research.regimeComputeSplit')}
                </div>
                <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-cyan-300">
                  {findings.regimeSplit.solvedScenarios.length} {t('research.solved')} /{' '}
                  {findings.regimeSplit.unsolvedScenarios.length} Frontier
                </div>
                <div className="mt-0.5 font-mono text-[11px] tabular-nums text-slate-400">
                  {findings.regimeSplit.solvedComputePct}% vs{' '}
                  {findings.regimeSplit.unsolvedComputePct}% {t('research.compute')}
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-3">
                <div className="text-[11px] font-medium text-slate-400">
                  {t('research.fastestPerfection')}
                </div>
                <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-white">
                  {findings.fastestPerfectTrial
                    ? `${getTrialComputeMs(findings.fastestPerfectTrial).toFixed(1)} ms`
                    : '—'}
                </div>
                <div className="mt-0.5 font-mono text-[11px] tabular-nums text-slate-400 truncate">
                  {findings.fastestPerfectTrial
                    ? `${ALGORITHM_SHORT_LABELS[findings.fastestPerfectTrial.algorithm]} · ${findings.fastestPerfectTrial.topologyLabel} (${findings.fastestPerfectTrial.parameterCount}p, G${findings.fastestPerfectTrial.generationsRun})`
                    : t('research.noVerifiedPerfectTrialYet')}
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-3">
                <div className="text-[11px] font-medium text-slate-400">
                  {t('research.peakCompression')}
                </div>
                <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-amber-300">
                  {findings.mostDenseTrial
                    ? `${findings.mostDenseTrial.knowledgeDensity.toLocaleString()} p/w`
                    : '—'}
                </div>
                <div className="mt-0.5 font-mono text-[11px] tabular-nums text-slate-400 truncate">
                  {findings.mostBitEfficientTrial &&
                  findings.mostBitEfficientTrial.pipesPerBit !== undefined
                    ? `${findings.mostBitEfficientTrial.pipesPerBit} pipes/bit · ${findings.mostBitEfficientTrial.topologyLabel}`
                    : findings.mostDenseTrial
                      ? `${findings.mostDenseTrial.topologyLabel} (${findings.mostDenseTrial.parameterCount}p)`
                      : '—'}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-4 text-xs leading-relaxed text-slate-400">
              {findings.abstractSummary}
            </div>
          )}

          {(findings.autopsySummary || findings.reasoningSummary) && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {findings.autopsySummary && (
                <div className="rounded-lg border border-rose-500/25 bg-[#0B1120] p-3 space-y-1">
                  <div className="font-display text-[11px] font-semibold uppercase tracking-wide text-rose-300">
                    Crash Autopsy ({findings.autopsySummary.totalDeaths} deaths)
                  </div>
                  <div className="font-mono text-xs text-slate-200">
                    Dominant:{' '}
                    <span className="font-semibold text-rose-300">
                      {findings.autopsySummary.dominantFailure}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-400">
                    Top {findings.autopsySummary.causes.PIPE_TOP} · Bot{' '}
                    {findings.autopsySummary.causes.PIPE_BOTTOM} · Floor{' '}
                    {findings.autopsySummary.causes.FLOOR} · GenGap{' '}
                    {findings.autopsySummary.avgGeneralizationGap}p
                  </div>
                </div>
              )}
              {findings.reasoningSummary && (
                <div className="rounded-lg border border-emerald-500/25 bg-[#0B1120] p-3 space-y-1">
                  <div className="font-display text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                    Reasoning Telemetry (n={findings.reasoningSummary.sampleCount})
                  </div>
                  {findings.reasoningSummary.ponderTrials > 0 && (
                    <div className="font-mono text-xs text-slate-200">
                      Ponder: Calm{' '}
                      <span className="text-cyan-300">
                        {findings.reasoningSummary.calmPonderSteps}
                      </span>{' '}
                      vs Danger{' '}
                      <span className="text-amber-300">
                        {findings.reasoningSummary.dangerPonderSteps}
                      </span>{' '}
                      (S2 {findings.reasoningSummary.avgSystem2Ratio}%)
                    </div>
                  )}
                  <div className="font-mono text-[11px] text-slate-400">
                    {findings.reasoningSummary.avgRolloutAdvantage !== null
                      ? `Rollout |ΔV|=${findings.reasoningSummary.avgRolloutAdvantage}`
                      : ''}
                    {findings.reasoningSummary.avgRolloutAdvantage !== null &&
                    findings.reasoningSummary.avgSsmGate !== null
                      ? ' · '
                      : ''}
                    {findings.reasoningSummary.avgSsmGate !== null
                      ? `SSM z_t=${findings.reasoningSummary.avgSsmGate}`
                      : ''}
                  </div>
                </div>
              )}
            </div>
          )}

          {(findings.hardwareRoutingSummary ||
            findings.computeRoiSummary ||
            findings.islandWinnerSummary) && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {findings.hardwareRoutingSummary && (
                <div className="rounded-lg border border-cyan-500/25 bg-[#0B1120] p-3 space-y-1">
                  <div className="font-display text-[11px] font-semibold uppercase tracking-wide text-cyan-300">
                    Hardware Auto-Routing &amp; Pareto ({findings.paretoFrontier.length} pts)
                  </div>
                  <div className="font-mono text-xs text-slate-200 tabular-nums">
                    ◆ GPU {findings.hardwareRoutingSummary.gpuLockstepTrials} ({findings.hardwareRoutingSummary.gpuMeanFlops ?? '—'}f) · ◇ CPU {findings.hardwareRoutingSummary.cpuSpecializedTrials} ({findings.hardwareRoutingSummary.cpuMeanFlops ?? '—'}f)
                  </div>
                  {findings.computeRoiSummary && (
                    <div className="font-mono text-[11px] text-slate-400 tabular-nums">
                      Avg Eff {findings.computeRoiSummary.avgEfficiencyScore} p/100f
                      {findings.computeRoiSummary.hybridTrials > 0
                        ? ` · Hybrid Commits ${findings.computeRoiSummary.totalCommits} / Rollbacks ${findings.computeRoiSummary.totalRollbacks}`
                        : ''}
                    </div>
                  )}
                </div>
              )}
              {findings.islandWinnerSummary &&
                findings.islandWinnerSummary.winners.length > 0 && (
                  <div className="rounded-lg border border-amber-500/25 bg-[#0B1120] p-3 space-y-1">
                    <div className="font-display text-[11px] font-semibold uppercase tracking-wide text-amber-300">
                      Island Speciation ({findings.islandWinnerSummary.totalIslandTrials} trials)
                    </div>
                    <div className="font-mono text-xs text-slate-200 tabular-nums">
                      Top:{' '}
                      <span className="font-semibold text-amber-200">
                        {findings.islandWinnerSummary.winners[0].label}
                      </span>{' '}
                      ({findings.islandWinnerSummary.winners[0].winSharePct}% wins)
                    </div>
                    <div className="font-mono text-[11px] text-slate-400 tabular-nums">
                      Rebalances: {findings.islandWinnerSummary.rebalanceEventsTotal} · Mean {findings.islandWinnerSummary.winners[0].meanScore}p @ {findings.islandWinnerSummary.winners[0].meanFlops} FLOPs/f
                    </div>
                  </div>
                )}
            </div>
          )}

          {findings.hyperparameterSweetSpot && (
            <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-3.5 space-y-1">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-emerald-300">
                Hyperparameter Sweet Spot
              </h3>
              <p className="text-xs leading-relaxed text-slate-300">
                {findings.hyperparameterSweetSpot}
              </p>
            </div>
          )}

          {findings.depthVsWidthAnalysis && (
            <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-3.5 space-y-1">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-cyan-300">
                Depth vs. Width &amp; Compression
              </h3>
              <p className="text-xs leading-relaxed text-slate-300">
                {findings.depthVsWidthAnalysis}
              </p>
            </div>
          )}

          {(findings.isoParamComparisons.length > 0 ||
            findings.isoNeuronComparison) && (
            <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-3.5 space-y-2">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-cyan-300">
                Iso-Parameter &amp; Iso-Neuron Decoupling
              </h3>
              <ul className="space-y-1.5 text-xs leading-relaxed text-slate-300">
                {findings.isoParamComparisons.map((line, idx) => {
                  const splitIdx = line.indexOf(':');
                  return (
                    <li key={`iso-p-${idx}`} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-400" />
                      <span>
                        {splitIdx > 0 ? (
                          <>
                            <span className="font-mono font-medium text-slate-100">
                              {line.slice(0, splitIdx + 1)}
                            </span>
                            {line.slice(splitIdx + 1)}
                          </>
                        ) : (
                          line
                        )}
                      </span>
                    </li>
                  );
                })}
                {findings.isoNeuronComparison && (
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                    <span>
                      <span className="font-mono font-medium text-slate-100">
                        {findings.isoNeuronComparison.slice(
                          0,
                          findings.isoNeuronComparison.indexOf(':') + 1
                        )}
                      </span>
                      {findings.isoNeuronComparison.slice(
                        findings.isoNeuronComparison.indexOf(':') + 1
                      )}
                    </span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {findings.worldModelImplications.length > 0 && (
            <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-3.5 space-y-2">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-amber-300">
                World Models &amp; Agent Takeaways
              </h3>
              <ul className="space-y-2 text-xs leading-relaxed text-slate-300">
                {findings.worldModelImplications.map((item, idx) => {
                  const splitIdx = item.indexOf(':');
                  return (
                    <li key={idx} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                      <span>
                        {splitIdx > 0 ? (
                          <>
                            <span className="font-medium text-slate-100">
                              {item.slice(0, splitIdx + 1)}
                            </span>
                            {item.slice(splitIdx + 1)}
                          </>
                        ) : (
                          item
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="lg:col-span-6 space-y-5">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-200 mb-3">
              Minimum Parameters for Verified Perfection by Scenario
            </h3>
            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-[#0B1120]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="px-3 py-2 font-medium">Scenario</th>
                    <th className="px-3 py-2 font-medium">
                      Min Perfect Topology
                    </th>
                    <th className="px-3 py-2 font-medium">Norm Compute</th>
                    <th className="px-3 py-2 font-medium text-right">
                      Best Min-Seed
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                  {findings.perDifficulty.map((row) => (
                    <tr key={row.difficulty}>
                      <td className="px-3 py-2.5 font-sans font-medium text-slate-200">
                        {
                          resolveEnvironment(
                            row.difficulty,
                            sweepConfig.customEnvironment
                          ).label
                        }
                      </td>
                      <td className="px-3 py-2.5 text-emerald-300">
                        {row.minimumPerfectTrial
                          ? `${row.minimumPerfectTrial.topologyLabel} (${row.minimumPerfectTrial.parameterCount}p, ${ALGORITHM_SHORT_LABELS[row.minimumPerfectTrial.algorithm]}${
                              row.minimumPerfectTrial.architecture &&
                              row.minimumPerfectTrial.architecture !== 'MLP'
                                ? `, ${ARCHITECTURE_META[row.minimumPerfectTrial.architecture].shortLabel}`
                                : ''
                            }${
                              row.minimumPerfectTrial.weightPrecision &&
                              row.minimumPerfectTrial.weightPrecision !== 'FP32'
                                ? `, ${WEIGHT_PRECISION_META[row.minimumPerfectTrial.weightPrecision].shortLabel}`
                                : ''
                            })`
                          : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-cyan-300">
                        {row.minimumPerfectTrial
                          ? formatNormCompute(
                              getTrialComputeMs(row.minimumPerfectTrial)
                            )
                          : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-200">
                        {row.bestTrial
                          ? `${row.bestTrial.minSeedScore.toLocaleString()}`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {findings.mechanisticAggregate && (
            <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-sm font-semibold text-cyan-300">
                  How Winning Networks Fly (Aggregate Sensor Attribution)
                </h3>
                <span className="font-mono text-[11px] tabular-nums text-slate-400">
                  n={findings.mechanisticAggregate.sampleCount} · L2{' '}
                  {findings.mechanisticAggregate.avgWeightL2Norm}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                {findings.policyMechanismSummary}
              </p>
              <div className="space-y-2">
                {SENSOR_NAMES.map((name, idx) => {
                  const pct =
                    findings.mechanisticAggregate!.avgSensorImportance[idx] ??
                    0;
                  if (pct === 0 && idx >= 6) return null;
                  return (
                    <div key={name} className="space-y-1">
                      <div className="flex items-center justify-between font-mono text-[11px] tabular-nums">
                        <span className="text-slate-300">{name}</span>
                        <span className="text-cyan-300">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-cyan-400"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {findings.mechanisticAggregate.bestLinearFormula && (
                <div className="border-t border-slate-800 pt-2.5 font-mono text-[11px] text-emerald-300 break-all">
                  Sample Linear Law:{' '}
                  {findings.mechanisticAggregate.bestLinearFormula}
                </div>
              )}
            </div>
          )}

          {findings.scenarioProofs.length > 0 && (
            <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-cyan-300">
                  Mathematical Scenario Solvability Proofs
                </h3>
                <span className="font-mono text-[10px] text-slate-400">
                  Worst-case Euler Ballistics
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px] tabular-nums">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-1.5 pr-2 font-medium">Scenario</th>
                      <th className="py-1.5 px-2 font-medium">dt</th>
                      <th className="py-1.5 px-2 font-medium">Gap</th>
                      <th className="py-1.5 px-2 font-medium">Climb</th>
                      <th className="py-1.5 pl-2 font-medium text-right">Transit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {findings.scenarioProofs.map((sp) => (
                      <tr key={sp.difficulty}>
                        <td className="py-1.5 pr-2 font-sans text-slate-200">
                          {sp.label}
                        </td>
                        <td className="py-1.5 px-2 text-slate-300">
                          {sp.proof.dtMinFrames}f
                        </td>
                        <td className="py-1.5 px-2 text-slate-300">
                          {sp.proof.minGapPx}px
                        </td>
                        <td
                          className={`py-1.5 px-2 ${
                            sp.proof.climbSlackPx > 0
                              ? 'text-cyan-300'
                              : 'text-rose-300'
                          }`}
                        >
                          {sp.proof.climbSlackPx >= 0 ? '+' : ''}
                          {sp.proof.climbSlackPx}px
                        </td>
                        <td
                          className={`py-1.5 pl-2 text-right ${
                            sp.proof.solvable ? 'text-cyan-300' : 'text-rose-300'
                          }`}
                        >
                          +{sp.proof.transitClearancePx}px
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {findings.morphogenesisComparison && (
        <div className="mt-6 rounded-lg border border-slate-800 bg-[#0B1120] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <h3 className="font-display text-sm font-semibold text-amber-300">
              Self-Growing Morphogenesis A/B Comparison
            </h3>
            <span className="font-mono text-[11px] tabular-nums text-slate-400">
              Static {findings.morphogenesisComparison.staticTrials} vs Growing{' '}
              {findings.morphogenesisComparison.growingTrials}
              {findings.morphogenesisComparison.matchedPairs > 0
                ? ` · ${findings.morphogenesisComparison.matchedPairs} paired (W/T/L ${findings.morphogenesisComparison.winsGrowing}/${findings.morphogenesisComparison.ties}/${findings.morphogenesisComparison.winsStatic}, p=${findings.morphogenesisComparison.signTestPValue ?? '—'})`
                : ''}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-xs tabular-nums">
            <div className="rounded border border-slate-800 bg-slate-950/70 p-2.5">
              <div className="text-[10px] font-sans text-slate-400">
                Mean Min-Seed Lift
              </div>
              <div className="mt-0.5 text-sm font-semibold text-cyan-300">
                {findings.morphogenesisComparison.staticMeanMinSeed} →{' '}
                {findings.morphogenesisComparison.growingMeanMinSeed}
              </div>
            </div>
            <div className="rounded border border-slate-800 bg-slate-950/70 p-2.5">
              <div className="text-[10px] font-sans text-slate-400">
                Init → Final Params
              </div>
              <div className="mt-0.5 text-sm font-semibold text-amber-300">
                {findings.morphogenesisComparison.avgInitialParams ?? '—'} →{' '}
                {findings.morphogenesisComparison.avgFinalParams ?? '—'}p
              </div>
            </div>
            <div className="rounded border border-slate-800 bg-slate-950/70 p-2.5">
              <div className="text-[10px] font-sans text-slate-400">
                Pruned Synapses (Avg)
              </div>
              <div className="mt-0.5 text-sm font-semibold text-slate-200">
                {findings.morphogenesisComparison.avgPrunedSynapses ?? '—'}
              </div>
            </div>
            <div className="rounded border border-slate-800 bg-slate-950/70 p-2.5">
              <div className="text-[10px] font-sans text-slate-400">
                Final K / Sensors
              </div>
              <div className="mt-0.5 text-sm font-semibold text-cyan-300">
                K={findings.morphogenesisComparison.avgFinalK ?? '—'} ·{' '}
                {findings.morphogenesisComparison.avgFinalSensors ?? '—'}s
              </div>
            </div>
          </div>
        </div>
      )}

      {findings.sensorDiscovery && findings.sensorDiscovery.totalTestedSensors > 0 && (
        <div className="mt-6 rounded-lg border border-slate-800 bg-[#0B1120] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div>
              <h3 className="font-display text-sm font-semibold text-cyan-300">
                12-Sensor Discovery Meta-Analysis (&ldquo;Why &amp; When&rdquo;)
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">
                {findings.sensorDiscovery.botFirstNote}
              </p>
            </div>
            <span className="font-mono text-[11px] tabular-nums text-slate-400">
              {findings.sensorDiscovery.totalTestedSensors}/12 sensors tested
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 pr-3 font-medium">Sensor</th>
                  <th className="py-2 px-2 font-medium text-right">Marginal Δ</th>
                  <th className="py-2 px-2 font-medium text-right">Moving Δ</th>
                  <th className="py-2 px-2 font-medium text-right">Turb Δ</th>
                  <th className="py-2 px-2 font-medium text-right">Jac %</th>
                  <th className="py-2 pl-3 font-medium">Why &amp; When It Helps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {findings.sensorDiscovery.sensors
                  .filter((s) => s.trialsWithSensor > 0)
                  .map((s) => {
                    const fmtDelta = (v: number | null) =>
                      v === null ? '—' : `${v >= 0 ? '+' : ''}${v}`;
                    return (
                      <tr key={s.sensor}>
                        <td className="py-2 pr-3 font-mono whitespace-nowrap text-slate-200">
                          {s.label}{' '}
                          <span className="text-slate-500">({s.shortLabel})</span>
                        </td>
                        <td
                          className={`py-2 px-2 font-mono tabular-nums text-right ${
                            s.trialsWithoutSensor === 0
                              ? 'text-slate-500'
                              : s.marginalLift >= 0
                                ? 'text-cyan-300'
                                : 'text-amber-300'
                          }`}
                        >
                          {s.trialsWithoutSensor > 0 ? fmtDelta(s.marginalLift) : '—'}
                        </td>
                        <td className="py-2 px-2 font-mono tabular-nums text-right text-slate-300">
                          {fmtDelta(s.movingLift)}
                        </td>
                        <td className="py-2 px-2 font-mono tabular-nums text-right text-slate-300">
                          {fmtDelta(s.turbulentLift)}
                        </td>
                        <td className="py-2 px-2 font-mono tabular-nums text-right text-cyan-300">
                          {s.avgJacobianSharePct}%
                        </td>
                        <td className="py-2 pl-3 text-[11px] leading-snug text-slate-300">
                          <span className="text-slate-100">{s.whyItHelps}</span>{' '}
                          <span className="text-slate-400">{s.whenItHelps}</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
});
