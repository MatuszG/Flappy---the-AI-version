import { Cpu, Gauge, History } from 'lucide-react';
import {
  memo,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { analyticsClient } from '../engine/analyticsClient';
import { downloadColabNotebook } from '../engine/colabExporter';
import type { PresetId } from '../engine/experimentPresets';
import {
  calculateTopologyBreakdown,
  formatTopologyLabel,
  normalizeHiddenLayers,
} from '../engine/neuralNetwork';
import { clampPriority, resolvePowerProfile } from '../engine/powerProfile';
import { getHardwareCores } from '../engine/researchPool';
import {
  computeResearchFindings,
  type ResearchFindings,
} from '../engine/researchReport';
import {
  CLASSIC_5_SENSOR_FEATURES,
  formatInputSubsetKey,
  formatInputSubsetLabel,
  normalizeInputFeatures,
} from '../engine/sensors';
import { analyzeSmartPrune, getAllActiveTopologies } from '../engine/smartPrune';
import {
  estimateSweepComputeCost,
  formatDurationCompact,
} from '../engine/sweepCostEstimator';
import type {
  DifficultyPreset,
  ExperimentRunRecord,
  LearningAlgorithm,
  QueuedExperiment,
  ResearchProgress,
  ResearchSweepConfig,
  ResearchTrialResult,
  SavedBrain,
  SensorFeatureId,
} from '../engine/types';
import { ExperimentHistoryAndQueuePanel } from './ExperimentOpsPanel';
import { HardwareComputePanel } from './research/HardwareComputePanel';
import { LabUtilityModal } from './research/LabUtilityModal';
import { ResearchComparisonTables } from './research/ResearchComparisonTables';
import { ResearchEmpiricalMatrix } from './research/ResearchEmpiricalMatrix';
import { ResearchHeaderAndProgress } from './research/ResearchHeaderAndProgress';
import { ResearchProtocolConfigurator } from './research/ResearchProtocolConfigurator';
import { ResearchReportPanel } from './research/ResearchReportPanel';
import { ResearchScalingCharts } from './research/ResearchScalingCharts';
import { SweepCostDiagnosticPanel } from './research/SweepCostDiagnosticPanel';
import { useLanguage } from '../i18n/LanguageContext';
import {
  compareBestTrial,
  getFastResultInputKey,
  type MatrixRowTopology,
} from './research/researchUtils';

type WorkspaceViewTab =
  | 'PROTOCOL'
  | 'MATRIX_SCENARIO'
  | 'MATRIX_ALGO'
  | 'CHARTS'
  | 'TABLES'
  | 'REPORT';
type UtilityModalView = 'HARDWARE' | 'ETA_COLAB' | 'HISTORY' | null;

interface ResearchLabViewProps {
  sweepConfig: ResearchSweepConfig;
  progress: ResearchProgress;
  results: ResearchTrialResult[];
  autosavedAt: string | null;
  unsavedCount: number;
  remainingTrialsCount: number;
  wasInterrupted: boolean;
  activeRunLabel: string;
  experimentQueue: QueuedExperiment[];
  queueActive: boolean;
  runHistory: ExperimentRunRecord[];
  onChangeConfig: (next: ResearchSweepConfig) => void;
  onChangeActiveRunLabel: (label: string) => void;
  onChangePriority: (priority: number) => void;
  onChangeGpuLoad: (gpuLoadPercent: number) => void;
  onEnqueueCurrent: (customName?: string) => void;
  onEnqueuePreset: (presetId: PresetId) => void;
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
  onStartSweep: () => void;
  onContinueSweep: () => void;
  onPauseSweep: () => void;
  onResumeSweep: () => void;
  onSkipTrial: () => void;
  onStopSweep: () => void;
  onSaveSessionNow: () => void;
  onClearSavedSession: () => void;
  onImportJsonDataset: (file: File) => void;
  onLoadTrialIntoLab: (
    brain: SavedBrain,
    difficulty: DifficultyPreset,
    algorithm?: LearningAlgorithm
  ) => void;
  onRaceTrial: (brain: SavedBrain, difficulty: DifficultyPreset) => void;
  onGetPerfReport?: () => string | null;
}

export const ResearchLabView = memo(function ResearchLabView({
  sweepConfig,
  progress,
  results,
  autosavedAt,
  unsavedCount,
  remainingTrialsCount,
  wasInterrupted,
  activeRunLabel,
  experimentQueue,
  queueActive,
  runHistory,
  onChangeConfig,
  onChangeActiveRunLabel,
  onChangePriority,
  onChangeGpuLoad,
  onEnqueueCurrent,
  onEnqueuePreset,
  onEnqueueThermalSweep,
  onEnqueueValidationSuite,
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
  onStartSweep,
  onContinueSweep,
  onPauseSweep,
  onResumeSweep,
  onSkipTrial,
  onStopSweep,
  onSaveSessionNow,
  onClearSavedSession,
  onImportJsonDataset,
  onLoadTrialIntoLab,
  onRaceTrial,
  onGetPerfReport,
}: ResearchLabViewProps) {
  const { bi } = useLanguage();
  const [activeTab, setActiveTab] = useState<WorkspaceViewTab>('PROTOCOL');
  const [utilityModal, setUtilityModal] = useState<UtilityModalView>(null);
  const [matrixAlgoFilter, setMatrixAlgoFilter] = useState<
    LearningAlgorithm | 'ALL'
  >('ALL');
  const [matrixDiffFilter, setMatrixDiffFilter] = useState<
    DifficultyPreset | 'ALL'
  >('ALL');
  const [matrixInputFilter, setMatrixInputFilter] = useState<string>('ALL');
  const [selectedTrialId, setSelectedTrialId] = useState<string | null>(null);

  const isRunning = progress.status === 'RUNNING';
  const isPaused = progress.status === 'PAUSED';
  const isBusy = isRunning || isPaused;
  const hasRunActivity =
    isBusy || results.length > 0 || progress.completedTrials > 0;

  useEffect(() => {
    if (!hasRunActivity && activeTab !== 'PROTOCOL') {
      setActiveTab('PROTOCOL');
    }
  }, [hasRunActivity, activeTab]);

  const hardwareCores = useMemo(() => getHardwareCores(), []);
  const powerPriority = clampPriority(sweepConfig.performancePriority);
  const powerPlan = useMemo(
    () => resolvePowerProfile(powerPriority, hardwareCores),
    [powerPriority, hardwareCores]
  );
  const quickCostEstimate = useMemo(
    () =>
      estimateSweepComputeCost(
        sweepConfig,
        remainingTrialsCount > 0 && results.length > 0
          ? remainingTrialsCount
          : undefined,
        {
          liveTicksPerSec: progress.liveTicksPerSec,
          gpuActive: progress.gpuActive,
          computeBackend: progress.computeBackend,
        }
      ),
    [
      sweepConfig,
      remainingTrialsCount,
      results.length,
      progress.liveTicksPerSec,
      progress.gpuActive,
      progress.computeBackend,
    ]
  );

  const activeInputSets = useMemo(() => {
    const raw =
      sweepConfig.inputFeatureSets && sweepConfig.inputFeatureSets.length > 0
        ? sweepConfig.inputFeatureSets
        : [[...CLASSIC_5_SENSOR_FEATURES]];
    const seen = new Set<string>();
    const out: SensorFeatureId[][] = [];
    for (const s of raw) {
      const clean = normalizeInputFeatures(s);
      const key = formatInputSubsetKey(clean);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(clean);
      }
    }
    return out;
  }, [sweepConfig.inputFeatureSets]);

  const pruneAnalysis = useMemo(
    () => analyzeSmartPrune(sweepConfig),
    [sweepConfig]
  );
  const totalPlannedTrials = pruneAnalysis.activeTrials;

  const deferredResults = useDeferredValue(results);
  const deferredSweepConfig = useDeferredValue(sweepConfig);

  const reportConfigSlice = useMemo<ResearchSweepConfig>(
    () => ({
      ...deferredSweepConfig,
    }),
    [
      deferredSweepConfig.algorithms,
      deferredSweepConfig.algorithmsByArchitecture,
      deferredSweepConfig.difficulties,
      deferredSweepConfig.inputFeatureSets,
      deferredSweepConfig.topologies,
      deferredSweepConfig.topologiesByArchitecture,
      deferredSweepConfig.architectures,
      deferredSweepConfig.morphogenesisByArchitecture,
      deferredSweepConfig.evolutionTopologyMode,
      deferredSweepConfig.populationSizes,
      deferredSweepConfig.targetPipeCap,
      deferredSweepConfig.verificationSeeds,
      deferredSweepConfig.customEnvironment,
    ]
  );

  // Off-main-thread analytics computation via Analytics Web Worker (eliminates main-thread lag spikes)
  const [findings, setFindings] = useState<ResearchFindings>(() =>
    computeResearchFindings([], sweepConfig)
  );
  const [analyticsSyncing, setAnalyticsSyncing] = useState(false);

  useEffect(() => {
    let active = true;
    if (deferredResults.length === 0) {
      setFindings(computeResearchFindings([], reportConfigSlice));
      setAnalyticsSyncing(false);
      return;
    }
    setAnalyticsSyncing(true);
    void analyticsClient
      .computeFindingsLatest(deferredResults, reportConfigSlice)
      .then((res) => {
        if (active && res) {
          setFindings(res.findings);
          setAnalyticsSyncing(false);
        }
      })
      .catch(() => {
        if (active) setAnalyticsSyncing(false);
      });
    return () => {
      active = false;
    };
  }, [deferredResults, reportConfigSlice]);

  const resultInputOptions = useMemo(() => {
    const map = new Map<
      string,
      { key: string; label: string; count: number }
    >();
    for (let i = 0; i < deferredResults.length; i++) {
      const r = deferredResults[i];
      const key = getFastResultInputKey(r);
      if (!map.has(key)) {
        const feats = normalizeInputFeatures(r.inputFeatures);
        map.set(key, {
          key,
          label: r.inputSetLabel ?? formatInputSubsetLabel(feats),
          count: feats.length,
        });
      }
    }
    return map;
  }, [deferredResults]);

  const matrixInputOptions = useMemo(() => {
    const map = new Map(resultInputOptions);
    for (const set of activeInputSets) {
      const key = formatInputSubsetKey(set);
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: formatInputSubsetLabel(set),
          count: set.length,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [activeInputSets, resultInputOptions]);

  const matrixRowTopologies = useMemo<MatrixRowTopology[]>(() => {
    const matchingInputSets =
      matrixInputFilter === 'ALL'
        ? activeInputSets
        : activeInputSets.filter(
            (s) => formatInputSubsetKey(s) === matrixInputFilter
          );
    const setsToUse =
      matchingInputSets.length > 0
        ? matchingInputSets
        : [[...CLASSIC_5_SENSOR_FEATURES]];
    const seen = new Set<string>();
    const rows: MatrixRowTopology[] = [];
    const allTopos = getAllActiveTopologies(sweepConfig);
    for (const set of setsToUse) {
      for (const rawTopo of allTopos) {
        const clean = normalizeHiddenLayers(rawTopo);
        const topoLabel = formatTopologyLabel(clean, set.length);
        if (seen.has(topoLabel)) continue;
        seen.add(topoLabel);
        const breakdown = calculateTopologyBreakdown(clean, set.length);
        rows.push({
          topoLabel,
          hiddenLayers: clean,
          inputCount: set.length,
          parameterCount: breakdown.parameterCount,
          hiddenNeuronCount: breakdown.hiddenNeuronCount,
        });
      }
    }
    return rows.sort(
      (a, b) =>
        a.parameterCount - b.parameterCount ||
        a.hiddenLayers.length - b.hiddenLayers.length
    );
  }, [activeInputSets, matrixInputFilter, sweepConfig]);

  const matrixMap = useMemo(() => {
    const map = new Map<string, ResearchTrialResult>();
    if (activeTab !== 'MATRIX_SCENARIO' && activeTab !== 'CHARTS') {
      return map;
    }
    for (let i = 0; i < deferredResults.length; i++) {
      const r = deferredResults[i];
      if (matrixAlgoFilter !== 'ALL' && r.algorithm !== matrixAlgoFilter)
        continue;
      if (
        matrixInputFilter !== 'ALL' &&
        getFastResultInputKey(r) !== matrixInputFilter
      ) {
        continue;
      }
      const key = `${r.topologyLabel}|${r.difficulty}`;
      const existing = map.get(key);
      if (!existing || compareBestTrial(r, existing) > 0) {
        map.set(key, r);
      }
    }
    return map;
  }, [activeTab, deferredResults, matrixAlgoFilter, matrixInputFilter]);

  const algoTopoMatrixMap = useMemo(() => {
    const map = new Map<string, ResearchTrialResult>();
    if (activeTab !== 'MATRIX_ALGO') {
      return map;
    }
    for (let i = 0; i < deferredResults.length; i++) {
      const r = deferredResults[i];
      if (matrixDiffFilter !== 'ALL' && r.difficulty !== matrixDiffFilter)
        continue;
      if (
        matrixInputFilter !== 'ALL' &&
        getFastResultInputKey(r) !== matrixInputFilter
      ) {
        continue;
      }
      const key = `${r.algorithm}|${r.topologyLabel}`;
      const existing = map.get(key);
      if (!existing || compareBestTrial(r, existing) > 0) {
        map.set(key, r);
      }
    }
    return map;
  }, [activeTab, deferredResults, matrixDiffFilter, matrixInputFilter]);

  const bestPerTopologyMap = useMemo(() => {
    const map = new Map<string, ResearchTrialResult>();
    if (activeTab !== 'CHARTS') {
      return map;
    }
    for (let i = 0; i < deferredResults.length; i++) {
      const r = deferredResults[i];
      const existing = map.get(r.topologyLabel);
      if (!existing || compareBestTrial(r, existing) > 0) {
        map.set(r.topologyLabel, r);
      }
    }
    return map;
  }, [activeTab, deferredResults]);

  const selectedTrial = useMemo(() => {
    if (selectedTrialId) {
      const match = deferredResults.find((r) => r.id === selectedTrialId);
      if (match) return match;
    }
    const bestId = findings.overallBestTrial?.id;
    if (bestId) {
      const hydratedBest = deferredResults.find((r) => r.id === bestId);
      if (hydratedBest) return hydratedBest;
    }
    return (
      findings.overallBestTrial ??
      deferredResults[deferredResults.length - 1] ??
      null
    );
  }, [findings.overallBestTrial, deferredResults, selectedTrialId]);

  const handleSelectTrialAndInspect = (id: string) => {
    setSelectedTrialId(id);
  };

  const gpuLoadPct = Math.max(10, Math.min(100, Math.round(sweepConfig.gpuLoadPercent ?? 100)));

  const utilityDock = (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setUtilityModal('HARDWARE')}
          title={bi(
            'Silnik WebGPU/CPU, wątki, obciążenie GPU oraz profil mocy',
            'WebGPU/CPU compute backend, CPU threads, GPU load & power profile'
          )}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
            utilityModal === 'HARDWARE'
              ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-200'
              : 'border-slate-800 bg-[#111827] text-slate-300 hover:border-cyan-500/40 hover:text-white'
          }`}
        >
          <Cpu className="h-3.5 w-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
          <span>{bi('Sprzęt & Moc', 'Hardware & Power')}</span>
          <span className="font-mono text-[10px] text-slate-400 tabular-nums">
            {sweepConfig.computeBackend ?? 'CPU'} · GPU {gpuLoadPct}%
          </span>
        </button>

        <button
          type="button"
          onClick={() => setUtilityModal('ETA_COLAB')}
          title={bi(
            'Szacowany czas lokalny vs Google Colab T4/L4/A100 i eksport .ipynb',
            'Local vs Google Colab T4/L4/A100 ETA and CUDA .ipynb export'
          )}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
            utilityModal === 'ETA_COLAB'
              ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200'
              : 'border-slate-800 bg-[#111827] text-slate-300 hover:border-emerald-500/40 hover:text-white'
          }`}
        >
          <Gauge className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
          <span>ETA &amp; Colab CUDA</span>
          <span className="font-mono text-[10px] text-slate-400 tabular-nums">
            ~{formatDurationCompact(quickCostEstimate.localEstSec)} · T4{' '}
            {formatDurationCompact(quickCostEstimate.colabT4Sec)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setUtilityModal('HISTORY')}
          title={bi(
            'Historia uruchomień i kolejka eksperymentów',
            'Run history and experiment queue'
          )}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
            utilityModal === 'HISTORY'
              ? 'border-amber-500/60 bg-amber-500/15 text-amber-200'
              : 'border-slate-800 bg-[#111827] text-slate-300 hover:border-amber-500/40 hover:text-white'
          }`}
        >
          <History className="h-3.5 w-3.5 text-amber-400 shrink-0" aria-hidden="true" />
          <span>{bi('Historia & Kolejka', 'History & Queue')}</span>
          <span className="font-mono text-[10px] text-slate-400 tabular-nums">
            {runHistory.length}
            {experimentQueue.length > 0 ? ` · Q:${experimentQueue.length}` : ''}
          </span>
        </button>
      </div>

      <div className="font-mono text-[10.5px] tabular-nums text-slate-400 hidden sm:flex items-center gap-2">
        <span>{powerPlan.thermalBadge}</span>
        <span className="text-slate-700">·</span>
        <span>
          {sweepConfig.workerThreads === 0
            ? `Auto ${powerPlan.targetCpuThreads}/${hardwareCores}t`
            : sweepConfig.workerThreads === -1
              ? `Max ${hardwareCores}t`
              : sweepConfig.workerThreads === -2
                ? `Turbo ${hardwareCores}t`
                : `${sweepConfig.workerThreads}t`}
        </span>
      </div>
    </>
  );

  return (
    <div className="space-y-5">
      <ResearchHeaderAndProgress
        sweepConfig={sweepConfig}
        progress={progress}
        resultsCount={results.length}
        totalPerfect={findings.totalPerfect}
        totalPlannedTrials={totalPlannedTrials}
        remainingTrialsCount={remainingTrialsCount}
        autosavedAt={autosavedAt}
        unsavedCount={unsavedCount}
        wasInterrupted={wasInterrupted}
        utilityDock={utilityDock}
        onStartSweep={onStartSweep}
        onContinueSweep={onContinueSweep}
        onPauseSweep={onPauseSweep}
        onResumeSweep={onResumeSweep}
        onSkipTrial={onSkipTrial}
        onStopSweep={onStopSweep}
        onSaveSessionNow={onSaveSessionNow}
        onExportColab={() => {
          downloadColabNotebook(sweepConfig, {
            scope:
              remainingTrialsCount > 0 && results.length > 0
                ? 'REMAINING'
                : 'FULL',
            cachedResults: results,
            runLabel: activeRunLabel,
            maxRuntimeMinutes: 55,
            checkpointEvery: 50,
          });
        }}
        onImportJsonDataset={onImportJsonDataset}
        onGetPerfReport={onGetPerfReport}
      />

      {/* Full-Width Workspace Navigation Bar (Report & Matrix tabs visible once a run exists) */}
      <section className="space-y-4">
        {hasRunActivity && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#111827] px-3 py-2">
            <div
              className="flex flex-wrap items-center gap-1"
              role="tablist"
              aria-label={bi('Widoki laboratorium badawczego', 'Research lab views')}
            >
              {(
                [
                  { id: 'PROTOCOL', label: bi('Protokół Badawczy', 'Research Protocol') },
                  { id: 'MATRIX_SCENARIO', label: bi('Topologia × Scenariusz', 'Topology × Scenario') },
                  { id: 'MATRIX_ALGO', label: bi('Algorytm × Topologia', 'AI × Topology') },
                  { id: 'CHARTS', label: bi('Wykresy Skalowania', 'Scaling Charts') },
                  { id: 'TABLES', label: bi('Tabele Porównawcze', 'Comparison Tables') },
                  { id: 'REPORT', label: bi('Raport & Eksport', 'Report & Export') },
                ] as const
              ).map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                      active
                        ? tab.id === 'PROTOCOL'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35'
                          : 'bg-slate-800 text-cyan-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums text-slate-400">
              <span>
                {findings.totalTrials.toLocaleString()} {bi('prób', 'trials')}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-emerald-300">
                {findings.totalPerfect.toLocaleString()} perfect
              </span>
              {analyticsSyncing && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-cyan-300">Sync…</span>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'PROTOCOL' && (
          <ResearchProtocolConfigurator
            sweepConfig={sweepConfig}
            activeInputSets={activeInputSets}
            isBusy={isBusy}
            onChangeConfig={onChangeConfig}
            onChangeActiveRunLabel={onChangeActiveRunLabel}
            onEnqueuePreset={onEnqueuePreset}
          />
        )}

        {(activeTab === 'MATRIX_SCENARIO' || activeTab === 'MATRIX_ALGO') && (
          <ResearchEmpiricalMatrix
            sweepConfig={sweepConfig}
            progress={progress}
            isBusy={isBusy}
            forcedView={
              activeTab === 'MATRIX_ALGO' ? 'ALGO_TOPO' : 'TOPO_SCENARIO'
            }
            matrixRowTopologies={matrixRowTopologies}
            matrixInputOptions={matrixInputOptions}
            matrixAlgoFilter={matrixAlgoFilter}
            matrixDiffFilter={matrixDiffFilter}
            matrixInputFilter={matrixInputFilter}
            matrixMap={matrixMap}
            algoTopoMatrixMap={algoTopoMatrixMap}
            selectedTrial={selectedTrial}
            onChangeAlgoFilter={setMatrixAlgoFilter}
            onChangeDiffFilter={setMatrixDiffFilter}
            onChangeInputFilter={setMatrixInputFilter}
            onSelectTrial={handleSelectTrialAndInspect}
            onLoadTrialIntoLab={onLoadTrialIntoLab}
            onRaceTrial={onRaceTrial}
          />
        )}

        {activeTab === 'CHARTS' && (
          <ResearchScalingCharts
            sweepConfig={sweepConfig}
            results={deferredResults}
            matrixRowTopologies={matrixRowTopologies}
            matrixMap={matrixMap}
            bestPerTopologyMap={bestPerTopologyMap}
            paretoFrontier={findings.paretoFrontier}
            selectedTrial={selectedTrial}
            onSelectTrial={(id) => {
              setSelectedTrialId(id);
            }}
          />
        )}

        {activeTab === 'TABLES' && (
          <ResearchComparisonTables findings={findings} />
        )}

        {activeTab === 'REPORT' && (
          <ResearchReportPanel
            sweepConfig={sweepConfig}
            results={results}
            findings={findings}
            isBusy={isBusy}
            onImportJsonDataset={onImportJsonDataset}
            onClearSavedSession={onClearSavedSession}
          />
        )}
      </section>

      {/* Modal Views triggered from Header Utility Icon Dock */}
      <LabUtilityModal
        open={utilityModal === 'HARDWARE'}
        title={bi('Sprzęt & Moc', 'Hardware & Power')}
        subtitle={bi(
          'Silnik WebGPU/CPU, wątki CPU, suwak obciążenia GPU (z ochroną TDR) oraz profil mocy',
          'WebGPU/CPU backend, CPU thread cap, live GPU Load % (with TDR guard) & power profile'
        )}
        icon={<Cpu className="h-4 w-4 text-cyan-400" aria-hidden="true" />}
        maxWidthClass="max-w-xl"
        onClose={() => setUtilityModal(null)}
      >
        <HardwareComputePanel
          sweepConfig={sweepConfig}
          progress={progress}
          isBusy={isBusy}
          onChangeConfig={onChangeConfig}
          onChangePriority={onChangePriority}
          onChangeGpuLoad={onChangeGpuLoad}
        />
      </LabUtilityModal>

      <LabUtilityModal
        open={utilityModal === 'ETA_COLAB'}
        title={bi('ETA & Eksport Google Colab CUDA', 'ETA & Google Colab CUDA Export')}
        subtitle={bi(
          'Szacunek czasu lokalnego vs chmura CUDA (T4/L4/A100) oraz eksport/import wyników',
          'Local vs cloud CUDA ETA (T4/L4/A100) and notebook export / JSON import'
        )}
        icon={<Gauge className="h-4 w-4 text-emerald-400" aria-hidden="true" />}
        maxWidthClass="max-w-3xl"
        onClose={() => setUtilityModal(null)}
      >
        <SweepCostDiagnosticPanel
          sweepConfig={sweepConfig}
          progress={progress}
          cachedResults={results}
          remainingTrialsCount={remainingTrialsCount}
          activeRunLabel={activeRunLabel}
          isBusy={isBusy}
          onChangeConfig={onChangeConfig}
          onImportJsonDataset={onImportJsonDataset}
        />
      </LabUtilityModal>

      <LabUtilityModal
        open={utilityModal === 'HISTORY'}
        title={bi('Historia & Kolejka Eksperymentów', 'Run History & Experiment Queue')}
        subtitle={bi(
          'Zapisane uruchomienia oraz kolejka serii badawczych',
          'Saved runs and experiment queue'
        )}
        icon={<History className="h-4 w-4 text-amber-400" aria-hidden="true" />}
        maxWidthClass="max-w-4xl"
        onClose={() => setUtilityModal(null)}
      >
        <ExperimentHistoryAndQueuePanel
          sweepConfig={sweepConfig}
          progress={progress}
          activeRunLabel={activeRunLabel}
          queue={experimentQueue}
          queueActive={queueActive}
          history={runHistory}
          onEnqueueCurrent={onEnqueueCurrent}
          onEnqueueThermalSweep={onEnqueueThermalSweep}
          onEnqueueValidationSuite={onEnqueueValidationSuite}
          onRemoveQueueItem={onRemoveQueueItem}
          onMoveQueueItem={onMoveQueueItem}
          onClearQueue={onClearQueue}
          onStartQueue={onStartQueue}
          onStopQueue={onStopQueue}
          onLoadConfigFromHistory={(cfg, label) => {
            onLoadConfigFromHistory(cfg, label);
            setUtilityModal(null);
          }}
          onRequeueFromHistory={onRequeueFromHistory}
          onMarkReviewed={onMarkReviewed}
          onDeleteHistoryItem={onDeleteHistoryItem}
          onClearHistory={onClearHistory}
          defaultExpanded={true}
        />
      </LabUtilityModal>
    </div>
  );
});
