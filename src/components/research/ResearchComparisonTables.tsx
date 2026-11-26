import { memo, useMemo, useState } from 'react';
import {
  ALGORITHM_LABELS,
  type ResearchFindings,
} from '../../engine/researchReport';
import { resolveEnvironment } from '../../engine/simulation';
import { useLanguage } from '../../i18n/LanguageContext';
import { formatNormCompute } from './researchUtils';

interface ResearchComparisonTablesProps {
  findings: ResearchFindings;
}

export const ResearchComparisonTables = memo(function ResearchComparisonTables({
  findings,
}: ResearchComparisonTablesProps) {
  const { t } = useLanguage();
  const [topoTableSearch, setTopoTableSearch] = useState('');

  const filteredPerTopology = useMemo(() => {
    const q = topoTableSearch.trim().toLowerCase();
    if (!q) return findings.perTopology;
    return findings.perTopology.filter(
      (row) =>
        row.topologyLabel.toLowerCase().includes(q) ||
        `${row.parameterCount}p`.includes(q) ||
        `${row.hiddenNeuronCount}n`.includes(q) ||
        `d${row.depth}`.includes(q)
    );
  }, [findings.perTopology, topoTableSearch]);

  return (
    <div className="space-y-5">
      {/* Sensor Input Ablation Comparison Table */}
      {(findings.perInputSet.length > 1 ||
        findings.perInputSet.some(
          (s) => s.inputCount !== 5 || s.hasPipeVy
        )) && (
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="font-display text-base font-semibold text-white">
              {t('research.sensorInputAblation112')}
            </h2>
            <p className="text-xs text-slate-400">
              {t('research.compareMinimalSensoryRepresentations')}
            </p>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 pr-3 font-medium">Input Subset</th>
                  <th className="px-2 py-2 font-medium text-right">Sensors</th>
                  <th className="px-2 py-2 font-medium text-right">Perfect</th>
                  <th className="px-2 py-2 font-medium text-right">Rate</th>
                  <th className="px-2 py-2 font-medium text-right">
                    Min Params
                  </th>
                  <th className="px-2 py-2 font-medium text-right">
                    Avg Compute
                  </th>
                  <th className="pl-2 py-2 font-medium text-right">
                    Mean Min-Seed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                {findings.perInputSet.map((row) => (
                  <tr key={row.inputSetKey}>
                    <td className="py-2.5 pr-3 font-sans font-medium text-slate-200">
                      {row.inputSetLabel}
                    </td>
                    <td className="px-2 py-2.5 text-right text-cyan-300">
                      {row.inputCount}
                    </td>
                    <td className="px-2 py-2.5 text-right text-emerald-300">
                      {row.perfectCount}/{row.trialCount}
                    </td>
                    <td className="px-2 py-2.5 text-right text-emerald-300">
                      {row.perfectRate}%
                    </td>
                    <td className="px-2 py-2.5 text-right text-slate-300">
                      {row.minPerfectParams !== null
                        ? `${row.minPerfectParams}p`
                        : '—'}
                    </td>
                    <td className="px-2 py-2.5 text-right text-cyan-300">
                      {row.avgComputeMsToPerfection !== null
                        ? formatNormCompute(row.avgComputeMsToPerfection)
                        : '—'}
                    </td>
                    <td className="pl-2 py-2.5 text-right text-slate-200">
                      {row.meanMinSeedScore.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bio-Inspired Neuron Architecture Comparison Table */}
      {findings.perArchitecture.filter((a) => a.trialCount > 0).length > 1 && (
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="font-display text-base font-semibold text-white">
              {t('research.bioInspiredNeuronArchitectureCompari')}
            </h2>
            <p className="text-xs text-slate-400">
              {t('research.drosophilaLeakyContinuousTimeNeuroch')}
            </p>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 pr-3 font-medium">Architecture</th>
                  <th className="px-2 py-2 font-medium text-right">Perfect</th>
                  <th className="px-2 py-2 font-medium text-right">
                    Overall %
                  </th>
                  <th className="px-2 py-2 font-medium text-right">Solved %</th>
                  <th className="px-2 py-2 font-medium text-right">
                    Avg Params
                  </th>
                  <th className="px-2 py-2 font-medium text-right">
                    Avg Compute
                  </th>
                  <th className="pl-2 py-2 font-medium text-right">
                    Best / Mean
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                {findings.perArchitecture
                  .filter((a) => a.trialCount > 0)
                  .map((row) => (
                    <tr key={row.architecture}>
                      <td className="py-2.5 pr-3 font-sans font-medium text-slate-200">
                        {row.label}
                      </td>
                      <td className="px-2 py-2.5 text-right text-emerald-300">
                        {row.perfectCount}/{row.trialCount}
                      </td>
                      <td className="px-2 py-2.5 text-right text-emerald-300">
                        {row.perfectRate}%
                      </td>
                      <td className="px-2 py-2.5 text-right text-cyan-300">
                        {row.solvedRegimePerfectRate !== null
                          ? `${row.solvedRegimePerfectRate}%`
                          : '—'}
                      </td>
                      <td className="px-2 py-2.5 text-right text-slate-300">
                        {row.avgParams}p
                      </td>
                      <td className="px-2 py-2.5 text-right text-cyan-300">
                        {row.avgComputeMsToPerfection !== null
                          ? formatNormCompute(row.avgComputeMsToPerfection)
                          : '—'}
                      </td>
                      <td className="pl-2 py-2.5 text-right text-slate-200">
                        {row.bestMinSeedScore.toLocaleString()} /{' '}
                        {row.meanMinSeedScore.toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pareto Frontier (Score vs FLOPs/frame) & Hardware Auto-Routing */}
      {(findings.paretoFrontier.length > 0 ||
        findings.hardwareRoutingSummary ||
        findings.computeRoiSummary) && (
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="font-display text-base font-semibold text-white">
                {t('research.flopsVsScoreParetoFrontier')}
              </h2>
              <p className="text-xs text-slate-400">
                {t('research.nonDominatedTrialsMaximizingUnseen')}
              </p>
            </div>
            {findings.computeRoiSummary && (
              <div className="font-mono text-[11px] tabular-nums text-slate-300">
                Avg {findings.computeRoiSummary.avgFlopsPerFrame} FLOPs/f
                {findings.computeRoiSummary.hybridTrials > 0 && (
                  <>
                    <span className="mx-2 text-slate-600">·</span>
                    <span className="text-emerald-300">
                      Commits {findings.computeRoiSummary.totalCommits}
                    </span>{' '}
                    /{' '}
                    <span className="text-rose-300">
                      Rollbacks {findings.computeRoiSummary.totalRollbacks}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {findings.hardwareRoutingSummary && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 font-mono text-xs tabular-nums">
              <div className="rounded-lg border border-cyan-500/25 bg-[#0B1120] p-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-cyan-300">
                    ◆ GPU Lockstep Route
                  </span>
                  <span className="text-slate-400">
                    {findings.hardwareRoutingSummary.gpuLockstepTrials} trials
                  </span>
                </div>
                <div className="mt-1 text-slate-200">
                  Perf {findings.hardwareRoutingSummary.gpuPerfectRate ?? '—'}% ·
                  Mean {findings.hardwareRoutingSummary.gpuMeanScore ?? '—'}p ·{' '}
                  {findings.hardwareRoutingSummary.gpuMeanFlops ?? '—'} FLOPs/f
                </div>
              </div>
              <div className="rounded-lg border border-amber-500/25 bg-[#0B1120] p-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-amber-300">
                    ◇ CPU-Only Specialized Route
                  </span>
                  <span className="text-slate-400">
                    {findings.hardwareRoutingSummary.cpuSpecializedTrials} trials
                  </span>
                </div>
                <div className="mt-1 text-slate-200">
                  Perf {findings.hardwareRoutingSummary.cpuPerfectRate ?? '—'}% ·
                  Mean {findings.hardwareRoutingSummary.cpuMeanScore ?? '—'}p ·{' '}
                  {findings.hardwareRoutingSummary.cpuMeanFlops ?? '—'} FLOPs/f
                </div>
              </div>
            </div>
          )}

          {findings.paretoFrontier.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 pr-2 font-medium">Rank</th>
                    <th className="px-2 py-2 font-medium">Config</th>
                    <th className="px-2 py-2 font-medium">Scenario</th>
                    <th className="px-2 py-2 font-medium">Route</th>
                    <th className="px-2 py-2 font-medium text-right">FLOPs/f</th>
                    <th className="px-2 py-2 font-medium text-right">
                      Min-Seed
                    </th>
                    <th className="pl-2 py-2 font-medium text-right">
                      Eff (p/100f)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                  {findings.paretoFrontier.slice(0, 12).map((pt, idx) => (
                    <tr key={pt.trialId}>
                      <td className="py-2 pr-2 text-emerald-300 font-semibold">
                        P{idx + 1}
                      </td>
                      <td className="px-2 py-2 font-sans font-medium text-slate-200">
                        {pt.label}
                      </td>
                      <td className="px-2 py-2 font-sans text-slate-300">
                        {resolveEnvironment(pt.difficulty).label}
                      </td>
                      <td
                        className={`px-2 py-2 whitespace-nowrap ${
                          pt.computeProfile === 'CPU_SPECIALIZED'
                            ? 'text-amber-300'
                            : 'text-cyan-300'
                        }`}
                      >
                        {pt.computeProfile === 'CPU_SPECIALIZED'
                          ? '◇ CPU-Only'
                          : '◆ GPU Lockstep'}
                      </td>
                      <td className="px-2 py-2 text-right text-slate-300">
                        {pt.meanFlopsPerFrame}
                      </td>
                      <td className="px-2 py-2 text-right text-emerald-300 font-semibold">
                        {pt.minSeedScore.toLocaleString()}
                        {pt.verifiedPerfect ? ' ★' : ''}
                      </td>
                      <td className="pl-2 py-2 text-right text-cyan-300">
                        {pt.efficiencyScore.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Multi-Arch Island Speciation Leaderboard */}
      {findings.islandWinnerSummary &&
        findings.islandWinnerSummary.totalIslandTrials > 0 && (
          <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h2 className="font-display text-base font-semibold text-white">
                  {t('research.multiArchitectureIslandSpeciationCom')}
                </h2>
                <p className="text-xs text-slate-400">
                  {t('research.compensatoryFlopsEfficiencyPopulatio', { totalIslandTrials: findings.islandWinnerSummary.totalIslandTrials, rebalanceEventsTot: findings.islandWinnerSummary.rebalanceEventsTotal })}
                </p>
              </div>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 pr-3 font-medium">Species</th>
                    <th className="px-2 py-2 font-medium text-right">Wins</th>
                    <th className="px-2 py-2 font-medium text-right">
                      Win Share
                    </th>
                    <th className="px-2 py-2 font-medium text-right">
                      Mean Score
                    </th>
                    <th className="pl-2 py-2 font-medium text-right">
                      Mean FLOPs/f
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                  {findings.islandWinnerSummary.winners.map((w) => (
                    <tr key={w.species}>
                      <td className="py-2 pr-3 font-sans font-medium text-slate-200">
                        {w.label}
                      </td>
                      <td className="px-2 py-2 text-right text-emerald-300">
                        {w.wins}
                      </td>
                      <td className="px-2 py-2 text-right text-cyan-300">
                        {w.winSharePct}%
                      </td>
                      <td className="px-2 py-2 text-right text-slate-200">
                        {w.meanScore.toLocaleString()}
                      </td>
                      <td className="pl-2 py-2 text-right text-amber-300">
                        {w.meanFlops}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Weight Bit-Precision & Memory Compression Table */}
      {findings.perPrecision.filter((p) => p.trialCount > 0).length > 1 && (
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="font-display text-base font-semibold text-white">
              {t('research.weightBitPrecisionInformationCompres')}
            </h2>
            <p className="text-xs text-slate-400">
              {t('research.straightThroughQuantizedSynapsesFrom')}
            </p>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 pr-3 font-medium">Precision</th>
                  <th className="px-2 py-2 font-medium text-right">
                    Bits/Param
                  </th>
                  <th className="px-2 py-2 font-medium text-right">Avg Bits</th>
                  <th className="px-2 py-2 font-medium text-right">
                    Perfect %
                  </th>
                  <th className="px-2 py-2 font-medium text-right">
                    Peak Pipes/Bit
                  </th>
                  <th className="px-2 py-2 font-medium text-right">
                    Avg Compute
                  </th>
                  <th className="pl-2 py-2 font-medium text-right">
                    Mean Min-Seed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                {findings.perPrecision
                  .filter((p) => p.trialCount > 0)
                  .map((row) => (
                    <tr key={row.precision}>
                      <td className="py-2.5 pr-3 font-sans font-medium text-slate-200">
                        {row.label}
                      </td>
                      <td className="px-2 py-2.5 text-right text-amber-300">
                        {row.bitsPerParam}b
                      </td>
                      <td className="px-2 py-2.5 text-right text-slate-300">
                        {row.avgTotalBits.toLocaleString()}b
                      </td>
                      <td className="px-2 py-2.5 text-right text-emerald-300">
                        {row.perfectRate}%
                      </td>
                      <td className="px-2 py-2.5 text-right text-cyan-300 font-semibold">
                        {row.maxPipesPerBit}
                      </td>
                      <td className="px-2 py-2.5 text-right text-slate-300">
                        {row.avgComputeMsToPerfection !== null
                          ? formatNormCompute(row.avgComputeMsToPerfection)
                          : '—'}
                      </td>
                      <td className="pl-2 py-2.5 text-right text-slate-200">
                        {row.meanMinSeedScore.toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8-Optimizer Leaderboard */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="font-display text-base font-semibold text-white">
            {t('research.aiOptimizationMethodAdaptabilityLead')}
          </h2>
          <p className="text-xs text-slate-400">
            {t('research.hardwareIndependentComputeCostNorm')}
          </p>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 pr-3 font-medium">Method</th>
                <th className="px-2 py-2 font-medium text-right">Perfect</th>
                <th className="px-2 py-2 font-medium text-right">Static %</th>
                <th className="px-2 py-2 font-medium text-right">Dynamic %</th>
                <th className="px-2 py-2 font-medium text-right">
                  Avg Compute
                </th>
                <th className="px-2 py-2 font-medium text-right">Avg Evals</th>
                <th className="pl-2 py-2 font-medium text-right">
                  Mean Min-Seed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
              {findings.perAlgorithm.map((row) => (
                <tr key={row.algorithm}>
                  <td className="py-2.5 pr-3 font-sans font-medium text-slate-200">
                    {ALGORITHM_LABELS[row.algorithm]}
                  </td>
                  <td className="px-2 py-2.5 text-right text-emerald-300">
                    {row.perfectCount}/{row.trialCount}
                  </td>
                  <td className="px-2 py-2.5 text-right text-slate-300">
                    {row.staticPerfectRate !== null
                      ? `${row.staticPerfectRate}%`
                      : '—'}
                  </td>
                  <td className="px-2 py-2.5 text-right text-amber-300">
                    {row.dynamicPerfectRate !== null
                      ? `${row.dynamicPerfectRate}%`
                      : '—'}
                  </td>
                  <td className="px-2 py-2.5 text-right text-cyan-300">
                    {row.avgComputeMsToPerfection !== null
                      ? formatNormCompute(row.avgComputeMsToPerfection)
                      : '—'}
                  </td>
                  <td className="px-2 py-2.5 text-right text-slate-300">
                    {row.avgEpisodesToPerfection !== null
                      ? row.avgEpisodesToPerfection.toLocaleString()
                      : '—'}
                  </td>
                  <td className="pl-2 py-2.5 text-right text-slate-200">
                    {row.meanMinSeedScore.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Topology Depth × Width Comparison Table */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="font-display text-base font-semibold text-white">
              {t('research.topologyShapeNeuronsWeightsDepth')}
            </h2>
            <p className="text-xs text-slate-400">
              {t('research.compareNarrow2NChains')}
            </p>
          </div>
          {findings.perTopology.length > 12 && (
            <input
              type="text"
              value={topoTableSearch}
              onChange={(e) => setTopoTableSearch(e.target.value)}
              placeholder={t('research.filterTopologies', { perTopology: findings.perTopology.length })}
              aria-label={t('research.filterTopologyAnalysisRows')}
              className="w-44 rounded-lg border border-slate-800 bg-[#0B1120] px-2.5 py-1.5 font-mono text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          )}
        </div>
        <div className="mt-3 max-h-[520px] overflow-auto rounded-lg border border-slate-800/70">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-20 bg-[#111827]">
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="sticky left-0 z-30 bg-[#111827] py-2 pl-2 pr-3 font-medium">
                  Topology ({filteredPerTopology.length})
                </th>
                <th className="px-2 py-2 font-medium text-right">Depth</th>
                <th className="px-2 py-2 font-medium text-right">Neurons</th>
                <th className="px-2 py-2 font-medium text-right">Weights</th>
                <th className="px-2 py-2 font-medium text-right">Params</th>
                <th className="px-2 py-2 font-medium text-right">Perfect %</th>
                <th className="px-2 py-2 font-medium text-right">
                  Mean Min-Seed
                </th>
                <th className="px-2 py-2 font-medium text-right">
                  Avg Compute
                </th>
                <th className="pl-2 pr-2 py-2 font-medium text-right">
                  Avg Evals
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
              {filteredPerTopology.map((row) => (
                <tr key={row.topologyLabel}>
                  <td className="sticky left-0 z-10 bg-[#111827] py-2 pl-2 pr-3 font-semibold text-slate-200 whitespace-nowrap">
                    {row.topologyLabel}
                  </td>
                  <td className="px-2 py-2 text-right text-slate-400">
                    {row.depth}
                  </td>
                  <td className="px-2 py-2 text-right text-slate-300">
                    {row.hiddenNeuronCount}n
                  </td>
                  <td className="px-2 py-2 text-right text-slate-400">
                    {row.weightCount}w
                  </td>
                  <td className="px-2 py-2 text-right text-cyan-300">
                    {row.parameterCount}p
                  </td>
                  <td className="px-2 py-2 text-right text-emerald-300">
                    {row.perfectRate}%
                  </td>
                  <td className="px-2 py-2 text-right text-slate-200">
                    {row.meanMinSeedScore.toLocaleString()}
                  </td>
                  <td className="px-2 py-2 text-right text-cyan-300">
                    {row.avgComputeMsToPerfection !== null
                      ? formatNormCompute(row.avgComputeMsToPerfection)
                      : '—'}
                  </td>
                  <td className="pl-2 pr-2 py-2 text-right text-slate-300">
                    {row.avgEpisodesToPerfection !== null
                      ? row.avgEpisodesToPerfection.toLocaleString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
