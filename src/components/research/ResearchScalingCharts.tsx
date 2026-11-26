import { memo, useMemo, useState } from 'react';
import { estimateArchitectureFlops, getTrialComputeProfile } from '../../engine/neuralNetwork';
import {
  ALGORITHM_SHORT_LABELS,
  getTrialComputeMs,
  type ParetoFrontierPoint,
} from '../../engine/researchReport';
import { resolveEnvironment } from '../../engine/simulation';
import type {
  DifficultyPreset,
  ResearchSweepConfig,
  ResearchTrialResult,
} from '../../engine/types';
import {
  DIFF_COLORS,
  formatNormCompute,
  type MatrixRowTopology,
} from './researchUtils';

interface ResearchScalingChartsProps {
  sweepConfig: ResearchSweepConfig;
  results: ResearchTrialResult[];
  matrixRowTopologies: MatrixRowTopology[];
  matrixMap: Map<string, ResearchTrialResult>;
  bestPerTopologyMap: Map<string, ResearchTrialResult>;
  paretoFrontier?: ParetoFrontierPoint[];
  selectedTrial: ResearchTrialResult | null;
  onSelectTrial: (id: string) => void;
}

export const ResearchScalingCharts = memo(function ResearchScalingCharts({
  sweepConfig,
  results,
  matrixRowTopologies,
  matrixMap,
  bestPerTopologyMap,
  paretoFrontier = [],
  selectedTrial,
  onSelectTrial,
}: ResearchScalingChartsProps) {
  const [chartMode, setChartMode] = useState<
    'score' | 'density' | 'time' | 'neurons' | 'pareto'
  >('score');
  const [chartLogX, setChartLogX] = useState<'auto' | 'log' | 'linear'>('auto');
  const [chartLogY, setChartLogY] = useState<'auto' | 'log' | 'linear'>('auto');
  const [chartRegime, setChartRegime] = useState<'ALL' | 'SOLVED' | 'FRONTIER'>(
    'ALL'
  );
  const [hiddenChartDiffs, setHiddenChartDiffs] = useState<DifficultyPreset[]>(
    []
  );
  const [hoveredChartPoint, setHoveredChartPoint] = useState<{
    diff: DifficultyPreset;
    trial: ResearchTrialResult;
  } | null>(null);
  const [hoveredNeuronTrialId, setHoveredNeuronTrialId] = useState<
    string | null
  >(null);
  const [hoveredParetoTrialId, setHoveredParetoTrialId] = useState<
    string | null
  >(null);

  const chartW = 540;
  const chartH = 220;
  const padL = 52;
  const padR = 18;
  const padT = 18;
  const padB = 34;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const minParams =
    matrixRowTopologies.length > 0 ? matrixRowTopologies[0].parameterCount : 2;
  const maxParams =
    matrixRowTopologies.length > 0
      ? matrixRowTopologies[matrixRowTopologies.length - 1].parameterCount
      : 129;

  const useLogX =
    chartLogX === 'log' ||
    (chartLogX === 'auto' && maxParams / Math.max(1, minParams) >= 10);

  const useLogY =
    chartMode !== 'neurons' &&
    (chartLogY === 'log' ||
      (chartLogY === 'auto' &&
        (chartMode === 'density' || chartMode === 'time')));

  const getChartValue = (t: ResearchTrialResult): number => {
    if (chartMode === 'score') return t.minSeedScore;
    if (chartMode === 'density') return t.knowledgeDensity;
    return getTrialComputeMs(t);
  };

  const solvedDiffSet = useMemo(() => {
    const solved = new Set<DifficultyPreset>();
    for (const diff of sweepConfig.difficulties) {
      for (const row of matrixRowTopologies) {
        const cell = matrixMap.get(`${row.topoLabel}|${diff}`);
        if (cell?.verifiedPerfect) {
          solved.add(diff);
          break;
        }
      }
    }
    return solved;
  }, [sweepConfig.difficulties, matrixRowTopologies, matrixMap]);

  const hiddenDiffSet = useMemo(
    () => new Set(hiddenChartDiffs),
    [hiddenChartDiffs]
  );

  const regimeFilteredDiffs = useMemo(() => {
    if (chartRegime === 'SOLVED') {
      return sweepConfig.difficulties.filter((d) => solvedDiffSet.has(d));
    }
    if (chartRegime === 'FRONTIER') {
      return sweepConfig.difficulties.filter((d) => !solvedDiffSet.has(d));
    }
    return sweepConfig.difficulties;
  }, [sweepConfig.difficulties, chartRegime, solvedDiffSet]);

  const visibleChartDiffs = useMemo(
    () => regimeFilteredDiffs.filter((d) => !hiddenDiffSet.has(d)),
    [regimeFilteredDiffs, hiddenDiffSet]
  );

  const chartSeries = useMemo(() => {
    if (chartMode === 'neurons' || chartMode === 'pareto') return [];
    return visibleChartDiffs.map((diff) => {
      const bestByParam = new Map<number, ResearchTrialResult>();
      for (const row of matrixRowTopologies) {
        const cell = matrixMap.get(`${row.topoLabel}|${diff}`);
        if (!cell) continue;
        const p = cell.parameterCount;
        const prev = bestByParam.get(p);
        if (!prev) {
          bestByParam.set(p, cell);
          continue;
        }
        let better = false;
        if (chartMode === 'score') {
          better =
            cell.minSeedScore > prev.minSeedScore ||
            (cell.minSeedScore === prev.minSeedScore &&
              Number(cell.verifiedPerfect) > Number(prev.verifiedPerfect)) ||
            (cell.minSeedScore === prev.minSeedScore &&
              cell.verifiedPerfect === prev.verifiedPerfect &&
              getTrialComputeMs(cell) < getTrialComputeMs(prev));
        } else if (chartMode === 'density') {
          better =
            cell.knowledgeDensity > prev.knowledgeDensity ||
            (cell.knowledgeDensity === prev.knowledgeDensity &&
              Number(cell.verifiedPerfect) > Number(prev.verifiedPerfect));
        } else {
          if (cell.verifiedPerfect !== prev.verifiedPerfect) {
            better = cell.verifiedPerfect;
          } else {
            better = getTrialComputeMs(cell) < getTrialComputeMs(prev);
          }
        }
        if (better) bestByParam.set(p, cell);
      }
      const pts = Array.from(bestByParam.values()).sort(
        (a, b) => a.parameterCount - b.parameterCount
      );
      return { diff, pts };
    });
  }, [chartMode, visibleChartDiffs, matrixRowTopologies, matrixMap]);

  const { maxChartY, minLogChartY } = useMemo(() => {
    let maxVal = 0;
    let minPos = Infinity;
    for (let s = 0; s < chartSeries.length; s++) {
      const pts = chartSeries[s].pts;
      for (let i = 0; i < pts.length; i++) {
        const v =
          chartMode === 'score'
            ? pts[i].minSeedScore
            : chartMode === 'density'
              ? pts[i].knowledgeDensity
              : getTrialComputeMs(pts[i]);
        if (v > maxVal) maxVal = v;
        if (v > 0 && v < minPos) minPos = v;
      }
    }
    if (maxVal <= 0) {
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const v =
          chartMode === 'score'
            ? r.minSeedScore
            : chartMode === 'density'
              ? r.knowledgeDensity
              : getTrialComputeMs(r);
        if (v > maxVal) maxVal = v;
        if (v > 0 && v < minPos) minPos = v;
      }
    }
    const floorMax =
      chartMode === 'score'
        ? Math.max(
            10,
            chartRegime === 'FRONTIER'
              ? maxVal * 1.15
              : Math.max(sweepConfig.targetPipeCap, maxVal)
          )
        : chartMode === 'density'
          ? Math.max(1, maxVal * 1.08)
          : Math.max(10, maxVal * 1.1);
    const minLogFloor =
      chartMode === 'score'
        ? 1
        : chartMode === 'density'
          ? Math.min(
              0.1,
              Number.isFinite(minPos)
                ? Math.pow(10, Math.floor(Math.log10(minPos)))
                : 0.1
            )
          : Math.min(
              1,
              Number.isFinite(minPos)
                ? Math.pow(10, Math.floor(Math.log10(minPos)))
                : 1
            );
    return {
      maxChartY: floorMax,
      minLogChartY: Math.max(0.01, Math.min(minLogFloor, floorMax / 10)),
    };
  }, [
    chartSeries,
    chartMode,
    chartRegime,
    results,
    sweepConfig.targetPipeCap,
  ]);

  const getChartX = (params: number) => {
    if (maxParams === minParams) return padL + plotW / 2;
    if (useLogX) {
      const lo = Math.log10(Math.max(1, minParams));
      const hi = Math.log10(Math.max(2, maxParams));
      const cur = Math.log10(Math.max(1, params));
      const t = (cur - lo) / Math.max(1e-6, hi - lo);
      return padL + Math.max(0, Math.min(1, t)) * plotW;
    }
    return padL + ((params - minParams) / (maxParams - minParams)) * plotW;
  };

  const getChartY = (val: number) => {
    if (useLogY) {
      const lo = Math.log10(minLogChartY);
      const hi = Math.log10(Math.max(minLogChartY * 10, maxChartY));
      const clamped = Math.max(minLogChartY, val);
      const ratio = (Math.log10(clamped) - lo) / Math.max(1e-6, hi - lo);
      return padT + plotH - Math.max(0, Math.min(1, ratio)) * plotH;
    }
    const ratio = Math.max(0, Math.min(1, val / Math.max(1e-6, maxChartY)));
    return padT + plotH - ratio * plotH;
  };

  const chartXTicks = useMemo(() => {
    const uniqueParams = Array.from(
      new Set(matrixRowTopologies.map((row) => row.parameterCount))
    ).sort((a, b) => a - b);
    if (uniqueParams.length <= 1) return uniqueParams;

    const minSpacingPx = 42;
    const chosen: number[] = [];
    let lastX = -Infinity;
    for (let i = 0; i < uniqueParams.length; i++) {
      const p = uniqueParams[i];
      const x = getChartX(p);
      if (i === 0 || x - lastX >= minSpacingPx) {
        chosen.push(p);
        lastX = x;
      }
    }
    const lastParam = uniqueParams[uniqueParams.length - 1];
    if (chosen[chosen.length - 1] !== lastParam) {
      const endX = getChartX(lastParam);
      if (
        chosen.length > 1 &&
        endX - getChartX(chosen[chosen.length - 1]) < minSpacingPx * 0.72
      ) {
        chosen[chosen.length - 1] = lastParam;
      } else {
        chosen.push(lastParam);
      }
    }
    return chosen;
  }, [matrixRowTopologies, useLogX, minParams, maxParams, plotW]);

  const chartYTicks = useMemo(() => {
    if (!useLogY) {
      return [0, 0.25, 0.5, 0.75, 1].map((f) => maxChartY * f);
    }
    const ticks: number[] = [];
    const minExp = Math.floor(Math.log10(minLogChartY));
    const maxExp = Math.ceil(Math.log10(Math.max(minLogChartY * 10, maxChartY)));
    for (let e = minExp; e <= maxExp; e++) {
      const v = Math.pow(10, e);
      if (v >= minLogChartY * 0.99 && v <= maxChartY * 1.05) {
        ticks.push(v);
      }
    }
    if (ticks.length < 2) {
      return [minLogChartY, maxChartY];
    }
    const filtered: number[] = [];
    let lastY = Infinity;
    for (const v of ticks) {
      const y = getChartY(v);
      if (Math.abs(lastY - y) >= 20) {
        filtered.push(v);
        lastY = y;
      }
    }
    const topY = getChartY(maxChartY);
    if (
      filtered.length > 0 &&
      Math.abs(getChartY(filtered[filtered.length - 1]) - topY) >= 22
    ) {
      filtered.push(maxChartY);
    }
    return filtered;
  }, [useLogY, minLogChartY, maxChartY, plotH]);

  const toggleChartDiff = (diff: DifficultyPreset) => {
    setHiddenChartDiffs((prev) =>
      prev.includes(diff) ? prev.filter((d) => d !== diff) : [...prev, diff]
    );
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div>
          <h2 className="font-display text-base font-semibold text-white">
            {chartMode === 'neurons'
              ? 'Hidden Neurons vs. Synaptic Parameters (Iso-Param Map)'
              : chartMode === 'pareto'
                ? 'FLOPs-vs-Score Pareto Frontier (Compute Efficiency)'
                : 'Parameter Scaling, Density & Convergence Speed'}
          </h2>
          <p className="text-xs text-slate-400">
            {chartMode === 'score'
              ? 'Worst-case pipes cleared across unseen seeds vs. parameter count'
              : chartMode === 'density'
                ? 'Knowledge density (worst-case pipes cleared per parameter)'
                : chartMode === 'time'
                  ? 'Hardware-independent synaptic compute (norm-ms at 10M ops/s) across parameter counts'
                  : chartMode === 'pareto'
                    ? 'Non-dominated Score vs FLOPs/frame frontier across GPU Lockstep and CPU-Only architectures'
                    : 'Iso-Parameter (vertical) & Iso-Neuron (horizontal) decoupling of hidden nodes vs weights'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-800 bg-[#0B1120] p-1">
            {(
              [
                { id: 'score', label: 'Min Seed Score', accent: 'cyan' },
                { id: 'density', label: 'Score / Param', accent: 'cyan' },
                { id: 'time', label: 'Compute (norm-ms)', accent: 'cyan' },
                { id: 'pareto', label: 'Pareto (FLOPs)', accent: 'amber' },
                {
                  id: 'neurons',
                  label: 'Neurons × Params',
                  accent: 'emerald',
                },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setChartMode(btn.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap cursor-pointer ${
                  chartMode === btn.id
                    ? btn.accent === 'emerald'
                      ? 'bg-slate-800 text-emerald-300'
                      : btn.accent === 'amber'
                        ? 'bg-slate-800 text-amber-300'
                        : 'bg-slate-800 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {chartMode !== 'pareto' && (
            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-800 bg-[#0B1120] p-1 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setChartLogX(useLogX ? 'linear' : 'log')}
                title="Toggle logarithmic X-axis (parameters)"
                className={`rounded px-2 py-1 cursor-pointer ${
                  useLogX
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                X:{useLogX ? 'Log' : 'Lin'}
              </button>
              {chartMode !== 'neurons' && (
                <button
                  type="button"
                  onClick={() => setChartLogY(useLogY ? 'linear' : 'log')}
                  title="Toggle logarithmic Y-axis"
                  className={`rounded px-2 py-1 cursor-pointer ${
                    useLogY
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Y:{useLogY ? 'Log' : 'Lin'}
                </button>
              )}
            </div>
          )}

          {chartMode !== 'neurons' &&
            chartMode !== 'pareto' &&
            solvedDiffSet.size > 0 &&
            solvedDiffSet.size < sweepConfig.difficulties.length && (
              <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-[#0B1120] p-1 text-[11px]">
                {(['ALL', 'SOLVED', 'FRONTIER'] as const).map((reg) => (
                  <button
                    key={reg}
                    type="button"
                    onClick={() => setChartRegime(reg)}
                    className={`rounded px-2 py-1 font-medium cursor-pointer ${
                      chartRegime === reg
                        ? reg === 'FRONTIER'
                          ? 'bg-amber-500/20 text-amber-300'
                          : reg === 'SOLVED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-200'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {reg === 'ALL'
                      ? 'All'
                      : reg === 'SOLVED'
                        ? `Solved (${solvedDiffSet.size})`
                        : `Frontier (${sweepConfig.difficulties.length - solvedDiffSet.size})`}
                  </button>
                ))}
              </div>
            )}
        </div>
      </div>

      <div className="mt-4">
        {chartMode === 'pareto' ? (
          results.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-slate-800 text-xs text-slate-400">
              Run a sweep to inspect the FLOPs-vs-Score Pareto Frontier.
            </div>
          ) : (
            (() => {
              const pts = results.slice(0, 400).map((r) => {
                const arch = r.architecture ?? 'MLP';
                const evoMode = r.evolutionTopologyMode ?? 'SINGLE_SPECIES';
                const flops =
                  r.meanFlopsPerFrame ??
                  estimateArchitectureFlops(
                    r.topology,
                    r.inputCount ?? r.inputFeatures?.length ?? 5,
                    arch,
                    r.reasoningSteps ?? 3,
                    r.morphogenesisSummary?.activeExperts
                  );
                const profile =
                  r.computeProfile ?? getTrialComputeProfile(arch, evoMode);
                return { trial: r, flops: Math.max(1, flops), profile };
              });
              let minF = Infinity;
              let maxF = 10;
              let maxS = Math.max(10, sweepConfig.targetPipeCap);
              for (const p of pts) {
                if (p.flops < minF) minF = p.flops;
                if (p.flops > maxF) maxF = p.flops;
                if (p.trial.minSeedScore > maxS) maxS = p.trial.minSeedScore;
              }
              if (!Number.isFinite(minF)) minF = 1;
              const loLogF = Math.log10(Math.max(1, minF * 0.9));
              const hiLogF = Math.log10(Math.max(minF * 1.5, maxF * 1.08));
              const getFlopsX = (f: number) => {
                const t =
                  (Math.log10(Math.max(1, f)) - loLogF) /
                  Math.max(1e-6, hiLogF - loLogF);
                return padL + Math.max(0, Math.min(1, t)) * plotW;
              };
              const getScoreY = (s: number) =>
                padT + plotH - Math.max(0, Math.min(1, s / Math.max(1, maxS))) * plotH;
              const frontierSorted = [...paretoFrontier].sort(
                (a, b) => a.meanFlopsPerFrame - b.meanFlopsPerFrame
              );
              const frontierPath = frontierSorted
                .map((fp, i) => {
                  const x = getFlopsX(fp.meanFlopsPerFrame);
                  const y = getScoreY(fp.minSeedScore);
                  return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                })
                .join(' ');
              const frontierIdSet = new Set(paretoFrontier.map((p) => p.trialId));
              const hoveredPt = hoveredParetoTrialId
                ? pts.find((p) => p.trial.id === hoveredParetoTrialId) ?? null
                : null;

              return (
                <div className="space-y-2">
                  <svg
                    viewBox={`0 0 ${chartW} ${chartH}`}
                    className="w-full h-auto"
                    role="img"
                    aria-label="FLOPs per frame versus worst-case pipes Pareto frontier scatter plot"
                  >
                    {[0, 0.25, 0.5, 0.75, 1].map((f, idx) => {
                      const val = maxS * f;
                      const y = getScoreY(val);
                      return (
                        <g key={`py-${idx}`}>
                          <line
                            x1={padL}
                            y1={y}
                            x2={chartW - padR}
                            y2={y}
                            stroke="rgba(148, 163, 184, 0.12)"
                            strokeDasharray="3 3"
                          />
                          <text
                            x={padL - 8}
                            y={y + 3.5}
                            textAnchor="end"
                            className="fill-slate-500 font-mono text-[9.5px] tabular-nums"
                          >
                            {Math.round(val).toLocaleString()}
                          </text>
                        </g>
                      );
                    })}
                    {[minF, Math.sqrt(minF * maxF), maxF].map((fv, idx) => {
                      const x = getFlopsX(fv);
                      return (
                        <g key={`px-${idx}`}>
                          <line
                            x1={x}
                            y1={padT}
                            x2={x}
                            y2={padT + plotH}
                            stroke="rgba(148, 163, 184, 0.08)"
                          />
                          <text
                            x={x}
                            y={chartH - 10}
                            textAnchor="middle"
                            className="fill-slate-400 font-mono text-[9.5px] tabular-nums"
                          >
                            {Math.round(fv)} FLOPs/f
                          </text>
                        </g>
                      );
                    })}

                    {frontierPath && (
                      <path
                        d={frontierPath}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                      />
                    )}

                    {pts.map(({ trial, flops, profile }) => {
                      const cx = getFlopsX(flops);
                      const cy = getScoreY(trial.minSeedScore);
                      const isFrontier = frontierIdSet.has(trial.id);
                      const isHovered = hoveredParetoTrialId === trial.id;
                      const isCpu = profile === 'CPU_SPECIALIZED';
                      const r = isHovered ? 6 : isFrontier ? 4.8 : 3.2;
                      return isCpu ? (
                        <rect
                          key={trial.id}
                          x={cx - r}
                          y={cy - r}
                          width={r * 2}
                          height={r * 2}
                          transform={`rotate(45 ${cx} ${cy})`}
                          fill="#F59E0B"
                          fillOpacity={isFrontier ? 0.95 : 0.6}
                          stroke={isFrontier || isHovered ? '#FFFFFF' : '#0B1120'}
                          strokeWidth={isFrontier || isHovered ? 1.5 : 0.8}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredParetoTrialId(trial.id)}
                          onMouseLeave={() => setHoveredParetoTrialId(null)}
                          onClick={() => onSelectTrial(trial.id)}
                        />
                      ) : (
                        <circle
                          key={trial.id}
                          cx={cx}
                          cy={cy}
                          r={r}
                          fill={isFrontier ? '#10B981' : '#06B6D4'}
                          fillOpacity={isFrontier ? 0.95 : 0.6}
                          stroke={isFrontier || isHovered ? '#FFFFFF' : '#0B1120'}
                          strokeWidth={isFrontier || isHovered ? 1.5 : 0.8}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredParetoTrialId(trial.id)}
                          onMouseLeave={() => setHoveredParetoTrialId(null)}
                          onClick={() => onSelectTrial(trial.id)}
                        />
                      );
                    })}
                  </svg>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                    <div>
                      {hoveredPt ? (
                        <span className="text-slate-200">
                          {hoveredPt.profile === 'CPU_SPECIALIZED'
                            ? '◇ CPU-Only'
                            : '◆ GPU Lockstep'}{' '}
                          · {hoveredPt.trial.architecture ?? 'MLP'} ·{' '}
                          {hoveredPt.trial.topologyLabel} ·{' '}
                          <span className="text-amber-300">
                            {Math.round(hoveredPt.flops)} FLOPs/f
                          </span>{' '}
                          ·{' '}
                          <span className="text-emerald-300">
                            {hoveredPt.trial.minSeedScore.toLocaleString()}p
                          </span>
                          {hoveredPt.trial.computeEfficiencyScore !== undefined
                            ? ` · Eff ${hoveredPt.trial.computeEfficiencyScore.toFixed(1)}`
                            : ''}
                        </span>
                      ) : (
                        <span>
                          Circle = GPU Lockstep · Diamond = CPU-Only (Hybrid/Islands) · Dashed green = Pareto Frontier ({paretoFrontier.length} pts)
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500">Click node to inspect</span>
                  </div>
                </div>
              );
            })()
          )
        ) : chartMode === 'neurons' ? (
          (() => {
            let maxNeurons = 8;
            for (let i = 0; i < matrixRowTopologies.length; i++) {
              if (matrixRowTopologies[i].hiddenNeuronCount > maxNeurons) {
                maxNeurons = matrixRowTopologies[i].hiddenNeuronCount;
              }
            }
            for (let i = 0; i < results.length; i++) {
              if (results[i].hiddenNeuronCount > maxNeurons) {
                maxNeurons = results[i].hiddenNeuronCount;
              }
            }
            const getNeuronY = (neurons: number) =>
              padT +
              plotH -
              Math.min(1, neurons / Math.max(1, maxNeurons)) * plotH;

            const isoParamClusters = Array.from(
              matrixRowTopologies.reduce((acc, row) => {
                acc.set(
                  row.parameterCount,
                  (acc.get(row.parameterCount) ?? 0) + 1
                );
                return acc;
              }, new Map<number, number>())
            )
              .filter(([, count]) => count > 1)
              .map(([p]) => p)
              .sort((a, b) => a - b);

            const isoNeuronRows = Array.from(
              matrixRowTopologies.reduce((acc, row) => {
                const n = row.hiddenNeuronCount;
                if (n > 0) acc.set(n, (acc.get(n) ?? 0) + 1);
                return acc;
              }, new Map<number, number>())
            )
              .filter(([, count]) => count > 1)
              .map(([n]) => n)
              .sort((a, b) => a - b);

            const hoveredTrial = hoveredNeuronTrialId
              ? (results.find((r) => r.id === hoveredNeuronTrialId) ?? null)
              : null;

            let lastIsoParamLabelX = -Infinity;
            const isoParamLabelSet = new Set<number>();
            for (const p of isoParamClusters) {
              const x = getChartX(p);
              if (x - lastIsoParamLabelX >= 38) {
                isoParamLabelSet.add(p);
                lastIsoParamLabelX = x;
              }
            }

            let lastIsoNeuronLabelY = Infinity;
            const isoNeuronLabelSet = new Set<number>();
            for (const n of isoNeuronRows) {
              const y = getNeuronY(n);
              if (Math.abs(lastIsoNeuronLabelY - y) >= 14) {
                isoNeuronLabelSet.add(n);
                lastIsoNeuronLabelY = y;
              }
            }

            const denseNodeMode = matrixRowTopologies.length > 22;
            const placedLabels: { x: number; y: number }[] = [];

            return (
              <div className="space-y-2">
                <svg
                  viewBox={`0 0 ${chartW} ${chartH}`}
                  className="w-full h-auto"
                  role="img"
                  aria-label="Hidden neurons versus synaptic parameters scatter plot"
                >
                  {isoNeuronRows.map((n) => {
                    const y = getNeuronY(n);
                    return (
                      <g key={`iso-n-${n}`}>
                        <line
                          x1={padL}
                          y1={y}
                          x2={chartW - padR}
                          y2={y}
                          stroke="rgba(56, 189, 248, 0.16)"
                          strokeDasharray="4 4"
                        />
                        {isoNeuronLabelSet.has(n) && (
                          <text
                            x={padL - 8}
                            y={y + 3}
                            textAnchor="end"
                            className="fill-cyan-400/80 font-mono text-[9.5px] tabular-nums"
                          >
                            {n}n
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {isoParamClusters.map((p) => {
                    const x = getChartX(p);
                    return (
                      <g key={`iso-p-${p}`}>
                        <line
                          x1={x}
                          y1={padT}
                          x2={x}
                          y2={padT + plotH}
                          stroke="rgba(16, 185, 129, 0.18)"
                          strokeDasharray="4 4"
                        />
                        {isoParamLabelSet.has(p) && (
                          <text
                            x={x}
                            y={chartH - 8}
                            textAnchor="middle"
                            className="fill-emerald-300 font-mono text-[9.5px] tabular-nums"
                          >
                            {p}p
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {[0, maxNeurons].map((n) => (
                    <text
                      key={`base-y-${n}`}
                      x={padL - 8}
                      y={getNeuronY(n) + 3.5}
                      textAnchor="end"
                      className="fill-slate-500 font-mono text-[9.5px] tabular-nums"
                    >
                      {n}n
                    </text>
                  ))}

                  {matrixRowTopologies.map((row) => {
                    const label = row.topoLabel;
                    const trial = bestPerTopologyMap.get(label);
                    const cx = getChartX(row.parameterCount);
                    const cy = getNeuronY(row.hiddenNeuronCount);
                    const compactLabel =
                      row.hiddenNeuronCount === 0
                        ? label
                        : label.replace(/^\d+→/, '').replace(/→1$/, '');

                    const isHighlighted =
                      trial &&
                      (hoveredNeuronTrialId === trial.id ||
                        selectedTrial?.id === trial.id);
                    let showLabel = !denseNodeMode || Boolean(isHighlighted);
                    if (!showLabel) {
                      const collides = placedLabels.some(
                        (pl) =>
                          Math.abs(pl.x - cx) < 38 && Math.abs(pl.y - cy) < 13
                      );
                      if (!collides) {
                        placedLabels.push({ x: cx, y: cy });
                        showLabel = true;
                      }
                    }

                    if (!trial) {
                      return (
                        <g key={`planned-${label}`}>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={denseNodeMode ? 3.2 : 4.2}
                            fill="#0B1120"
                            stroke="#475569"
                            strokeWidth={1.1}
                            strokeDasharray="2 2"
                          />
                          {showLabel && (
                            <text
                              x={cx}
                              y={cy - 6}
                              textAnchor="middle"
                              className="fill-slate-500 font-mono text-[8.5px]"
                            >
                              {compactLabel}
                            </text>
                          )}
                        </g>
                      );
                    }

                    const ratio = Math.min(
                      1,
                      trial.minSeedScore /
                        Math.max(1, sweepConfig.targetPipeCap)
                    );
                    const fill = trial.verifiedPerfect
                      ? '#10B981'
                      : ratio >= 0.25
                        ? '#06B6D4'
                        : '#94A3B8';

                    return (
                      <g
                        key={trial.id}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredNeuronTrialId(trial.id)}
                        onMouseLeave={() => setHoveredNeuronTrialId(null)}
                        onClick={() => onSelectTrial(trial.id)}
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r={
                            isHighlighted
                              ? 7
                              : trial.verifiedPerfect
                                ? denseNodeMode
                                  ? 4.6
                                  : 6.5
                                : denseNodeMode
                                  ? 3.8
                                  : 5
                          }
                          fill={fill}
                          stroke={
                            selectedTrial?.id === trial.id
                              ? '#FFFFFF'
                              : '#0B1120'
                          }
                          strokeWidth={selectedTrial?.id === trial.id ? 2 : 1.2}
                        />
                        {showLabel && (
                          <text
                            x={cx}
                            y={cy - 8}
                            textAnchor="middle"
                            className={`font-mono text-[8.5px] ${
                              isHighlighted
                                ? 'fill-white font-semibold'
                                : 'fill-slate-300'
                            }`}
                          >
                            {compactLabel}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                  <div>
                    {hoveredTrial ? (
                      <span className="text-slate-200">
                        {hoveredTrial.topologyLabel} ·{' '}
                        {hoveredTrial.parameterCount}p ·{' '}
                        {hoveredTrial.hiddenNeuronCount}n ·{' '}
                        {hoveredTrial.weightCount}w ·{' '}
                        {ALGORITHM_SHORT_LABELS[hoveredTrial.algorithm]} ·{' '}
                        <span className="text-emerald-300">
                          {hoveredTrial.minSeedScore.toLocaleString()} pipes
                        </span>
                      </span>
                    ) : (
                      <span>
                        Emerald vertical lines = Iso-Parameter shapes · Cyan
                        horizontal = Iso-Neuron rows
                      </span>
                    )}
                  </div>
                  <span className="text-slate-500">
                    Hover or click node to inspect
                  </span>
                </div>
              </div>
            );
          })()
        ) : results.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-slate-800 text-xs text-slate-400">
            Run a sweep to plot scaling curves across parameter counts and
            scenarios.
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full h-auto"
              role="img"
              aria-label="Parameter scaling chart across scenarios"
            >
              {chartYTicks.map((val, idx) => {
                const y = getChartY(val);
                return (
                  <g key={`y-tick-${idx}`}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={chartW - padR}
                      y2={y}
                      stroke="rgba(148, 163, 184, 0.12)"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padL - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      className="fill-slate-500 font-mono text-[9.5px] tabular-nums"
                    >
                      {chartMode === 'score'
                        ? val < 10
                          ? val.toFixed(1)
                          : Math.round(val).toLocaleString()
                        : chartMode === 'time'
                          ? formatNormCompute(val)
                          : val < 10
                            ? val.toFixed(1)
                            : Math.round(val).toLocaleString()}
                    </text>
                  </g>
                );
              })}

              {chartXTicks.map((p) => {
                const x = getChartX(p);
                return (
                  <g key={`x-tick-${p}`}>
                    <line
                      x1={x}
                      y1={padT}
                      x2={x}
                      y2={padT + plotH}
                      stroke="rgba(148, 163, 184, 0.06)"
                    />
                    <text
                      x={x}
                      y={chartH - 10}
                      textAnchor="middle"
                      className="fill-slate-400 font-mono text-[9.5px] tabular-nums"
                    >
                      {p}p
                    </text>
                  </g>
                );
              })}

              {chartSeries.map(({ diff, pts }) => {
                if (pts.length === 0) return null;

                const pathD = pts
                  .map((pt, idx) => {
                    const x = getChartX(pt.parameterCount);
                    const y = getChartY(getChartValue(pt));
                    return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                  })
                  .join(' ');

                const color = DIFF_COLORS[diff];
                const isDimmed =
                  hoveredChartPoint !== null && hoveredChartPoint.diff !== diff;

                return (
                  <g key={diff} opacity={isDimmed ? 0.28 : 1}>
                    <path
                      d={pathD}
                      fill="none"
                      stroke={color}
                      strokeWidth={hoveredChartPoint?.diff === diff ? 2.6 : 1.9}
                    />
                    {pts.map((pt) => {
                      const x = getChartX(pt.parameterCount);
                      const y = getChartY(getChartValue(pt));
                      const isHovered = hoveredChartPoint?.trial.id === pt.id;
                      return (
                        <circle
                          key={pt.id}
                          cx={x}
                          cy={y}
                          r={isHovered ? 6 : pt.verifiedPerfect ? 3.8 : 2.9}
                          fill={color}
                          stroke={
                            isHovered || pt.verifiedPerfect
                              ? '#FFFFFF'
                              : '#0B1120'
                          }
                          strokeWidth={isHovered ? 1.8 : 1.1}
                          className="cursor-pointer"
                          onMouseEnter={() =>
                            setHoveredChartPoint({ diff, trial: pt })
                          }
                          onMouseLeave={() => setHoveredChartPoint(null)}
                          onClick={() => onSelectTrial(pt.id)}
                        />
                      );
                    })}
                  </g>
                );
              })}
            </svg>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
              <div>
                {hoveredChartPoint ? (
                  <span className="text-slate-200">
                    <span
                      className="inline-block h-2 w-2 rounded-full mr-1.5 align-middle"
                      style={{
                        backgroundColor: DIFF_COLORS[hoveredChartPoint.diff],
                      }}
                    />
                    {
                      resolveEnvironment(
                        hoveredChartPoint.diff,
                        sweepConfig.customEnvironment
                      ).label
                    }{' '}
                    ·{' '}
                    <span className="text-cyan-300">
                      {hoveredChartPoint.trial.topologyLabel}
                    </span>{' '}
                    ({hoveredChartPoint.trial.parameterCount}p) ·{' '}
                    {ALGORITHM_SHORT_LABELS[hoveredChartPoint.trial.algorithm]}{' '}
                    ·{' '}
                    <span className="text-emerald-300">
                      {hoveredChartPoint.trial.minSeedScore.toLocaleString()}{' '}
                      pipes
                    </span>{' '}
                    · {hoveredChartPoint.trial.knowledgeDensity.toFixed(1)}/p ·{' '}
                    {formatNormCompute(
                      getTrialComputeMs(hoveredChartPoint.trial)
                    )}
                  </span>
                ) : (
                  <span>
                    Pareto-best per unique parameter count (
                    {useLogX ? 'Log' : 'Linear'} X ·{' '}
                    {useLogY ? 'Log' : 'Linear'} Y) · Click legend to toggle
                    scenarios
                  </span>
                )}
              </div>
              <span className="text-slate-500">
                White-ringed = 100% verified · Click point to inspect
              </span>
            </div>
          </div>
        )}

        {chartMode !== 'neurons' && chartMode !== 'pareto' && (
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {regimeFilteredDiffs.map((diff) => {
                const isHidden = hiddenDiffSet.has(diff);
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => toggleChartDiff(diff)}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] cursor-pointer transition-opacity ${
                      isHidden
                        ? 'border-slate-800 bg-[#0B1120]/50 text-slate-500 opacity-50 line-through'
                        : 'border-slate-800 bg-[#0B1120] text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: DIFF_COLORS[diff] }}
                    />
                    {
                      resolveEnvironment(diff, sweepConfig.customEnvironment)
                        .label
                    }
                  </button>
                );
              })}
              {hiddenChartDiffs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setHiddenChartDiffs([])}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 cursor-pointer ml-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
