import { Swords } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import {
  ARCHITECTURE_META,
  formatTopologyLabel,
  getTrialComputeProfile,
  WEIGHT_PRECISION_META,
} from '../../engine/neuralNetwork';
import { SENSOR_NAMES } from '../../engine/policyAnalysis';
import {
  ALGORITHM_SHORT_LABELS,
  getTrialComputeMs,
  getTrialEpisodes,
} from '../../engine/researchReport';
import {
  ALL_SENSOR_FEATURES,
  formatInputSubsetLabel,
  normalizeInputFeatures,
} from '../../engine/sensors';
import { resolveEnvironment } from '../../engine/simulation';
import type {
  DifficultyPreset,
  LearningAlgorithm,
  ResearchProgress,
  ResearchSweepConfig,
  ResearchTrialResult,
  SavedBrain,
} from '../../engine/types';
import {
  formatNormCompute,
  toSavedBrain,
  type MatrixInputOption,
  type MatrixRowTopology,
} from './researchUtils';
import { useLanguage } from '../../i18n/LanguageContext';

interface ResearchEmpiricalMatrixProps {
  sweepConfig: ResearchSweepConfig;
  progress: ResearchProgress;
  isBusy: boolean;
  forcedView?: 'TOPO_SCENARIO' | 'ALGO_TOPO';
  matrixRowTopologies: MatrixRowTopology[];
  matrixInputOptions: MatrixInputOption[];
  matrixAlgoFilter: LearningAlgorithm | 'ALL';
  matrixDiffFilter: DifficultyPreset | 'ALL';
  matrixInputFilter: string;
  matrixMap: Map<string, ResearchTrialResult>;
  algoTopoMatrixMap: Map<string, ResearchTrialResult>;
  selectedTrial: ResearchTrialResult | null;
  onChangeAlgoFilter: (next: LearningAlgorithm | 'ALL') => void;
  onChangeDiffFilter: (next: DifficultyPreset | 'ALL') => void;
  onChangeInputFilter: (next: string) => void;
  onSelectTrial: (id: string) => void;
  onLoadTrialIntoLab: (
    brain: SavedBrain,
    difficulty: DifficultyPreset,
    algorithm?: LearningAlgorithm
  ) => void;
  onRaceTrial: (brain: SavedBrain, difficulty: DifficultyPreset) => void;
}

export const ResearchEmpiricalMatrix = memo(function ResearchEmpiricalMatrix({
  sweepConfig,
  progress,
  isBusy,
  forcedView,
  matrixRowTopologies,
  matrixInputOptions,
  matrixAlgoFilter,
  matrixDiffFilter,
  matrixInputFilter,
  matrixMap,
  algoTopoMatrixMap,
  selectedTrial,
  onChangeAlgoFilter,
  onChangeDiffFilter,
  onChangeInputFilter,
  onSelectTrial,
  onLoadTrialIntoLab,
  onRaceTrial,
}: ResearchEmpiricalMatrixProps) {
  const { t } = useLanguage();
  const [internalMatrixView, setInternalMatrixView] = useState<
    'TOPO_SCENARIO' | 'ALGO_TOPO'
  >('TOPO_SCENARIO');
  const matrixView = forcedView ?? internalMatrixView;
  const [matrixTopoSearch, setMatrixTopoSearch] = useState('');

  const busyWorkerSlots = useMemo(
    () => progress.activeWorkers.filter((w) => w.phase !== 'IDLE'),
    [progress.activeWorkers]
  );

  const filteredMatrixRowTopologies = useMemo(() => {
    const q = matrixTopoSearch.trim().toLowerCase();
    if (!q) return matrixRowTopologies;
    return matrixRowTopologies.filter(
      (row) =>
        row.topoLabel.toLowerCase().includes(q) ||
        `${row.parameterCount}p`.includes(q) ||
        `${row.hiddenNeuronCount}n`.includes(q)
    );
  }, [matrixRowTopologies, matrixTopoSearch]);

  return (
    <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="font-display text-base font-semibold text-white">
            {matrixView === 'TOPO_SCENARIO'
              ? t('research.topologyScenarioMatrix')
              : t('research.aiAlgorithmTopologyMatrix')}
          </h2>
          <p className="text-xs text-slate-400">
            {t('research.worstCaseAcrossUnseenSeeds', { verificationSeeds: sweepConfig.verificationSeeds })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!forcedView && (
            <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-[#0B1120] p-1">
              <button
                type="button"
                onClick={() => setInternalMatrixView('TOPO_SCENARIO')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  matrixView === 'TOPO_SCENARIO'
                    ? 'bg-slate-800 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('research.topologyScenario')}
              </button>
              <button
                type="button"
                onClick={() => setInternalMatrixView('ALGO_TOPO')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  matrixView === 'ALGO_TOPO'
                    ? 'bg-slate-800 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('research.aiTopology2')}
              </button>
            </div>
          )}

          {matrixView === 'TOPO_SCENARIO' ? (
            <select
              aria-label={t('research.filterMatrixByAiAlgorithm')}
              value={matrixAlgoFilter}
              onChange={(e) =>
                onChangeAlgoFilter(e.target.value as LearningAlgorithm | 'ALL')
              }
              className="rounded-lg border border-slate-800 bg-[#0B1120] px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
            >
              <option value="ALL">{t('research.allAlgos')}</option>
              {sweepConfig.algorithms.map((a) => (
                <option key={a} value={a}>
                  {ALGORITHM_SHORT_LABELS[a]}
                </option>
              ))}
            </select>
          ) : (
            <select
              aria-label={t('research.filterMatrixByScenario')}
              value={matrixDiffFilter}
              onChange={(e) =>
                onChangeDiffFilter(e.target.value as DifficultyPreset | 'ALL')
              }
              className="rounded-lg border border-slate-800 bg-[#0B1120] px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
            >
              <option value="ALL">{t('research.allScenarios')}</option>
              {sweepConfig.difficulties.map((d) => (
                <option key={d} value={d}>
                  {resolveEnvironment(d, sweepConfig.customEnvironment).label}
                </option>
              ))}
            </select>
          )}

          {matrixInputOptions.length > 1 && (
            <select
              aria-label={t('research.filterMatrixBySensorInput')}
              value={matrixInputFilter}
              onChange={(e) => onChangeInputFilter(e.target.value)}
              className="rounded-lg border border-slate-800 bg-[#0B1120] px-2.5 py-1.5 font-mono text-xs text-cyan-200 focus:border-cyan-400 focus:outline-none"
            >
              <option value="ALL">
                {t('research.allInputs')} ({matrixInputOptions.length})
              </option>
              {matrixInputOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {matrixRowTopologies.length > 12 && (
            <input
              type="text"
              value={matrixTopoSearch}
              onChange={(e) => setMatrixTopoSearch(e.target.value)}
              placeholder={t('research.filterTopologies2', { matrixRowTopologie: matrixRowTopologies.length })}
              aria-label={t('research.filterMatrixTopologies')}
              className="w-40 rounded-lg border border-slate-800 bg-[#0B1120] px-2.5 py-1.5 font-mono text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          )}

          <span className="font-mono text-xs tabular-nums text-emerald-300">
            {t('research.cap')}: {sweepConfig.targetPipeCap.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="mt-4 max-h-[540px] overflow-auto rounded-lg border border-slate-800/70">
        {matrixView === 'TOPO_SCENARIO' ? (
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 z-20 bg-[#111827]">
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="sticky left-0 z-30 bg-[#111827] py-2 pl-2 pr-3 font-medium">
                  {t('research.topology2')} ({filteredMatrixRowTopologies.length})
                </th>
                {sweepConfig.difficulties.map((d) => (
                  <th
                    key={d}
                    className="px-1.5 py-2 font-medium text-center whitespace-nowrap"
                  >
                    {resolveEnvironment(d, sweepConfig.customEnvironment).label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredMatrixRowTopologies.map((row) => {
                const { topoLabel, parameterCount, hiddenNeuronCount } = row;
                return (
                  <tr key={topoLabel}>
                    <td className="sticky left-0 z-10 bg-[#111827] py-2 pl-2 pr-3 font-mono tabular-nums text-slate-200 whitespace-nowrap">
                      <span className="font-semibold">{topoLabel}</span>
                      <span className="ml-1.5 text-[11px] text-slate-500">
                        ({parameterCount}p · {hiddenNeuronCount}n)
                      </span>
                    </td>
                    {sweepConfig.difficulties.map((diff) => {
                      const cell = matrixMap.get(`${topoLabel}|${diff}`);
                      const isSelected = cell && selectedTrial?.id === cell.id;
                      const ratio = cell
                        ? Math.min(
                            1,
                            cell.minSeedScore /
                              Math.max(1, sweepConfig.targetPipeCap)
                          )
                        : 0;

                      return (
                        <td key={diff} className="p-1 text-center">
                          {cell ? (
                            <button
                              type="button"
                              onClick={() => onSelectTrial(cell.id)}
                              className={`w-full rounded-lg border px-2 py-1.5 font-mono tabular-nums cursor-pointer transition-colors ${
                                isSelected
                                  ? 'border-cyan-400 bg-cyan-500/20 text-white'
                                  : cell.verifiedPerfect
                                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200 hover:border-emerald-400'
                                    : ratio >= 0.25
                                      ? 'border-slate-700 bg-cyan-500/10 text-cyan-200 hover:border-slate-500'
                                      : 'border-slate-800 bg-[#0B1120] text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <div className="text-xs font-semibold">
                                {cell.verifiedPerfect
                                  ? 'PERFECT'
                                  : cell.minSeedScore.toLocaleString()}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {ALGORITHM_SHORT_LABELS[cell.algorithm]} ·{' '}
                                {formatNormCompute(getTrialComputeMs(cell))}
                              </div>
                            </button>
                          ) : (
                            (() => {
                              const activeSlot = isBusy
                                ? busyWorkerSlots.find(
                                    (w) =>
                                      w.difficulty === diff &&
                                      formatTopologyLabel(
                                        w.topology,
                                        w.inputFeatures?.length ?? 5
                                      ) === topoLabel &&
                                      (matrixAlgoFilter === 'ALL' ||
                                        w.algorithm === matrixAlgoFilter)
                                  )
                                : undefined;
                              return (
                                <div
                                  className={`rounded-lg border px-2 py-2.5 font-mono text-[11px] ${
                                    activeSlot
                                      ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
                                      : 'border-slate-800/60 bg-[#0B1120]/50 text-slate-600'
                                  }`}
                                >
                                  {activeSlot
                                    ? activeSlot.phase === 'AUDITING'
                                      ? `W${activeSlot.workerId} · ${activeSlot.auditDetail ?? 'Audit…'}`
                                      : `W${activeSlot.workerId} · G${activeSlot.generation}`
                                    : '—'}
                                </div>
                              );
                            })()
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 z-20 bg-[#111827]">
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="sticky left-0 z-30 bg-[#111827] py-2 pl-2 pr-3 font-medium">
                  Topology ({filteredMatrixRowTopologies.length})
                </th>
                {sweepConfig.algorithms.map((algo) => (
                  <th
                    key={algo}
                    className="px-1.5 py-2 font-medium text-center whitespace-nowrap"
                  >
                    {ALGORITHM_SHORT_LABELS[algo]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredMatrixRowTopologies.map((row) => {
                const { topoLabel, parameterCount, hiddenNeuronCount } = row;
                return (
                  <tr key={topoLabel}>
                    <td className="sticky left-0 z-10 bg-[#111827] py-2 pl-2 pr-3 font-mono tabular-nums text-slate-200 whitespace-nowrap">
                      <span className="font-semibold">{topoLabel}</span>
                      <span className="ml-1.5 text-[11px] text-slate-500">
                        ({parameterCount}p · {hiddenNeuronCount}n)
                      </span>
                    </td>
                    {sweepConfig.algorithms.map((algo) => {
                      const cell = algoTopoMatrixMap.get(
                        `${algo}|${topoLabel}`
                      );
                      const isSelected = cell && selectedTrial?.id === cell.id;
                      const ratio = cell
                        ? Math.min(
                            1,
                            cell.minSeedScore /
                              Math.max(1, sweepConfig.targetPipeCap)
                          )
                        : 0;

                      return (
                        <td key={algo} className="p-1 text-center">
                          {cell ? (
                            <button
                              type="button"
                              onClick={() => onSelectTrial(cell.id)}
                              className={`w-full rounded-lg border px-2 py-1.5 font-mono tabular-nums cursor-pointer transition-colors ${
                                isSelected
                                  ? 'border-cyan-400 bg-cyan-500/20 text-white'
                                  : cell.verifiedPerfect
                                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200 hover:border-emerald-400'
                                    : ratio >= 0.25
                                      ? 'border-slate-700 bg-cyan-500/10 text-cyan-200 hover:border-slate-500'
                                      : 'border-slate-800 bg-[#0B1120] text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <div className="text-xs font-semibold">
                                {cell.verifiedPerfect
                                  ? 'PERFECT'
                                  : cell.minSeedScore.toLocaleString()}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {
                                  resolveEnvironment(
                                    cell.difficulty,
                                    sweepConfig.customEnvironment
                                  ).label
                                }{' '}
                                · {formatNormCompute(getTrialComputeMs(cell))}
                              </div>
                            </button>
                          ) : (
                            (() => {
                              const activeSlot = isBusy
                                ? busyWorkerSlots.find(
                                    (w) =>
                                      w.algorithm === algo &&
                                      formatTopologyLabel(
                                        w.topology,
                                        w.inputFeatures?.length ?? 5
                                      ) === topoLabel &&
                                      (matrixDiffFilter === 'ALL' ||
                                        w.difficulty === matrixDiffFilter)
                                  )
                                : undefined;
                              return (
                                <div
                                  className={`rounded-lg border px-2 py-2.5 font-mono text-[11px] ${
                                    activeSlot
                                      ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
                                      : 'border-slate-800/60 bg-[#0B1120]/50 text-slate-600'
                                  }`}
                                >
                                  {activeSlot
                                    ? activeSlot.phase === 'AUDITING'
                                      ? `W${activeSlot.workerId} · ${activeSlot.auditDetail ?? 'Audit…'}`
                                      : `W${activeSlot.workerId} · G${activeSlot.generation}`
                                    : '—'}
                                </div>
                              );
                            })()
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Selected Trial Quick Actions & Mechanistic Policy Inspector */}
      {selectedTrial && (
        <div className="mt-4 space-y-3 border-t border-slate-800 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 font-mono text-xs tabular-nums text-slate-300">
              <div>
                <span className="font-semibold text-white">
                  {
                    resolveEnvironment(
                      selectedTrial.difficulty,
                      sweepConfig.customEnvironment
                    ).label
                  }
                </span>
                <span className="mx-2 text-slate-600">·</span>
                {ALGORITHM_SHORT_LABELS[selectedTrial.algorithm]}
                <span className="mx-2 text-slate-600">·</span>
                {selectedTrial.topologyLabel} ({selectedTrial.parameterCount}p ·{' '}
                {selectedTrial.hiddenNeuronCount}n · {selectedTrial.weightCount}
                w)
                {selectedTrial.architecture &&
                  selectedTrial.architecture !== 'MLP' && (
                    <>
                      <span className="mx-2 text-slate-600">·</span>
                      <span className="text-violet-300">
                        {ARCHITECTURE_META[selectedTrial.architecture].shortLabel}
                      </span>
                    </>
                  )}
                {selectedTrial.weightPrecision &&
                  selectedTrial.weightPrecision !== 'FP32' && (
                    <>
                      <span className="mx-2 text-slate-600">·</span>
                      <span className="text-amber-300">
                        {
                          WEIGHT_PRECISION_META[selectedTrial.weightPrecision]
                            .shortLabel
                        }
                      </span>
                    </>
                  )}
                {selectedTrial.curriculumLearning && (
                  <>
                    <span className="mx-2 text-slate-600">·</span>
                    <span className="text-violet-300">Curriculum</span>
                  </>
                )}
                {selectedTrial.shapedFitness && (
                  <>
                    <span className="mx-2 text-slate-600">·</span>
                    <span className="text-emerald-300">Shaped</span>
                  </>
                )}
                <span className="mx-2 text-slate-600">·</span>
                <span className="text-cyan-300">
                  {selectedTrial.inputSetLabel ??
                    formatInputSubsetLabel(selectedTrial.inputFeatures)}
                </span>
                <span className="mx-2 text-slate-600">·</span>
                Pop {selectedTrial.populationSize} · σ
                {selectedTrial.mutationStrength.toFixed(2)}
                <span className="mx-2 text-slate-600">·</span>
                {selectedTrial.verifiedPerfect ? (
                  <span className="font-semibold text-emerald-300">
                    VERIFIED PERFECT (
                    {selectedTrial.minSeedScore.toLocaleString()} pipes)
                  </span>
                ) : (
                  <span>
                    Min Seed {selectedTrial.minSeedScore.toLocaleString()} pipes
                    ({selectedTrial.stoppedReason})
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                Norm Compute{' '}
                <span className="text-cyan-300">
                  {getTrialComputeMs(selectedTrial).toFixed(1)} ms
                </span>
                <span className="mx-2 text-slate-600">·</span>
                {getTrialEpisodes(selectedTrial).toLocaleString()} bird-evals (G
                {selectedTrial.generationsRun})
                <span className="mx-2 text-slate-600">·</span>
                Active CPU {(selectedTrial.durationMs / 1000).toFixed(2)}s
                <span className="mx-2 text-slate-600">·</span>
                Density {selectedTrial.knowledgeDensity.toLocaleString()} p/w
                {selectedTrial.totalBits !== undefined && (
                  <>
                    <span className="mx-2 text-slate-600">·</span>
                    <span className="text-amber-300">
                      {selectedTrial.totalBits}b (
                      {selectedTrial.pipesPerBit ?? 0} p/bit)
                    </span>
                  </>
                )}
                <span className="mx-2 text-slate-600">·</span>
                Gen Ratio {Math.round(selectedTrial.generalizationRatio * 100)}%
                <span className="mx-2 text-slate-600">·</span>
                {(() => {
                  const prof =
                    selectedTrial.computeProfile ??
                    getTrialComputeProfile(
                      selectedTrial.architecture ?? 'MLP',
                      selectedTrial.evolutionTopologyMode ?? 'SINGLE_SPECIES'
                    );
                  return (
                    <span
                      className={
                        prof === 'CPU_SPECIALIZED'
                          ? 'text-amber-300'
                          : 'text-cyan-300'
                      }
                    >
                      {prof === 'CPU_SPECIALIZED'
                        ? '◇ CPU-Only'
                        : '◆ GPU Lockstep'}
                    </span>
                  );
                })()}
                {selectedTrial.meanFlopsPerFrame !== undefined && (
                  <>
                    <span className="mx-2 text-slate-600">·</span>
                    <span className="text-slate-300">
                      {Math.round(selectedTrial.meanFlopsPerFrame)} FLOPs/f
                      {selectedTrial.computeEfficiencyScore !== undefined
                        ? ` (Eff ${selectedTrial.computeEfficiencyScore.toFixed(1)})`
                        : ''}
                    </span>
                  </>
                )}
                {selectedTrial.learningDynamic && (
                  <>
                    <span className="mx-2 text-slate-600">·</span>
                    <span className="text-cyan-300">
                      {selectedTrial.learningDynamic.replace(/_/g, ' ')}
                    </span>
                  </>
                )}
              </div>
              {(selectedTrial.failureAutopsy ||
                selectedTrial.reasoningTelemetry ||
                selectedTrial.morphogenesisSummary?.activeExperts ||
                selectedTrial.islandSummary?.enabled) && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                  {selectedTrial.failureAutopsy &&
                    selectedTrial.failureAutopsy.totalDeaths > 0 && (
                      <span>
                        Autopsy:{' '}
                        <span className="text-rose-300 font-semibold">
                          {selectedTrial.failureAutopsy.dominantFailure}
                        </span>{' '}
                        (|Vy| {selectedTrial.failureAutopsy.avgDeathAbsVy}, GapErr{' '}
                        {selectedTrial.failureAutopsy.avgDeathGapErr}px, GenGap{' '}
                        {selectedTrial.failureAutopsy.generalizationGap}p)
                      </span>
                    )}
                  {selectedTrial.reasoningTelemetry && (
                    <span className="text-emerald-300">
                      Reasoning:{' '}
                      {selectedTrial.architecture === 'PONDER_ACT' ||
                      selectedTrial.architecture === 'LOOPED_REASONER'
                        ? `avg ${selectedTrial.reasoningTelemetry.avgPonderSteps} steps (Calm ${selectedTrial.reasoningTelemetry.calmPonderSteps} vs Danger ${selectedTrial.reasoningTelemetry.dangerPonderSteps} · S2 ${Math.round(selectedTrial.reasoningTelemetry.system2Ratio * 100)}%)`
                        : selectedTrial.reasoningTelemetry.avgRolloutAdvantage !==
                            undefined
                          ? `|ΔV(JUMP−WAIT)| ${selectedTrial.reasoningTelemetry.avgRolloutAdvantage}`
                          : selectedTrial.reasoningTelemetry.avgSsmGate !== undefined
                            ? `SSM gate z_t ${selectedTrial.reasoningTelemetry.avgSsmGate}`
                            : 'Active'}
                    </span>
                  )}
                  {selectedTrial.morphogenesisSummary &&
                    (selectedTrial.morphogenesisSummary.activeExperts !==
                      undefined ||
                      (selectedTrial.morphogenesisSummary.rollbackCount ?? 0) >
                        0) && (
                      <span className="text-amber-300">
                        Hybrid ROI: Commits{' '}
                        {selectedTrial.morphogenesisSummary
                          .committedExpertsCount ?? 0}{' '}
                        · Rollbacks{' '}
                        {selectedTrial.morphogenesisSummary.rollbackCount ?? 0}
                        {selectedTrial.morphogenesisSummary.activeExperts &&
                        selectedTrial.morphogenesisSummary.activeExperts
                          .length > 0
                          ? ` · Experts [${selectedTrial.morphogenesisSummary.activeExperts
                              .map((e) => ARCHITECTURE_META[e]?.shortLabel ?? e)
                              .join(', ')}]`
                          : ''}
                      </span>
                    )}
                  {selectedTrial.islandSummary?.enabled && (
                    <span className="text-cyan-300">
                      Island Winner:{' '}
                      <span className="font-semibold">
                        {ARCHITECTURE_META[
                          selectedTrial.islandSummary.winningSpecies
                        ]?.shortLabel ??
                          selectedTrial.islandSummary.winningSpecies}
                      </span>{' '}
                      ({selectedTrial.islandSummary.rebalanceCount} rebalances)
                    </span>
                  )}
                </div>
              )}
            </div>

            {selectedTrial.bestBrain && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const b = toSavedBrain(
                      selectedTrial,
                      sweepConfig.customEnvironment
                    );
                    if (b) {
                      onLoadTrialIntoLab(
                        b,
                        selectedTrial.difficulty,
                        selectedTrial.algorithm
                      );
                    }
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 whitespace-nowrap cursor-pointer transition-colors hover:border-cyan-500/50 hover:text-cyan-200"
                >
                  Load into Training Lab
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const b = toSavedBrain(
                      selectedTrial,
                      sweepConfig.customEnvironment
                    );
                    if (b) onRaceTrial(b, selectedTrial.difficulty);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 whitespace-nowrap cursor-pointer transition-colors hover:bg-amber-400"
                >
                  <Swords className="h-3.5 w-3.5" aria-hidden="true" />
                  Race This Model
                </button>
              </div>
            )}
          </div>

          {selectedTrial.policyProfile && (
            <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-slate-400">
                <span className="font-sans font-medium text-slate-200">
                  Mechanistic Policy Attribution (Sensor Jacobian Sensitivity)
                </span>
                <div>
                  Dominant:{' '}
                  <span className="text-cyan-300">
                    {selectedTrial.policyProfile.dominantSensor}
                  </span>
                  <span className="mx-2 text-slate-600">·</span>
                  L2 Norm {selectedTrial.policyProfile.weightL2Norm}
                  <span className="mx-2 text-slate-600">·</span>
                  Sparsity{' '}
                  {Math.round(selectedTrial.policyProfile.sparsityRatio * 100)}%
                  <span className="mx-2 text-slate-600">·</span>
                  Flap Rate{' '}
                  {Math.round(
                    selectedTrial.policyProfile.flapRateCanonical * 100
                  )}
                  %
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {SENSOR_NAMES.map((name, idx) => {
                  const sensorId = ALL_SENSOR_FEATURES[idx];
                  const trialFeatures = normalizeInputFeatures(
                    selectedTrial.inputFeatures
                  );
                  const sensorActive = trialFeatures.includes(sensorId);
                  const pct =
                    selectedTrial.policyProfile!.sensorImportance[idx] ?? 0;
                  const signed =
                    selectedTrial.policyProfile!.sensorSignedSensitivity[idx] ??
                    0;
                  return (
                    <div
                      key={name}
                      className={`space-y-1 ${sensorActive ? '' : 'opacity-40'}`}
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] tabular-nums">
                        <span className="text-slate-300 truncate">{name}</span>
                        <span
                          className={
                            sensorActive ? 'text-cyan-300' : 'text-slate-500'
                          }
                        >
                          {sensorActive ? `${pct}%` : 'off'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full ${
                            signed >= 0 ? 'bg-cyan-400' : 'bg-amber-400'
                          }`}
                          style={{
                            width: `${sensorActive ? Math.min(100, pct) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedTrial.policyProfile.linearFormula && (
                <div className="pt-1 font-mono text-[11px] text-emerald-300 break-all">
                  Control Law: {selectedTrial.policyProfile.linearFormula}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
