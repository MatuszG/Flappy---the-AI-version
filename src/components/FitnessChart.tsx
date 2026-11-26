import { useState } from 'react';
import type { GenerationRecord, LearningMilestones } from '../engine/types';
import { useLanguage } from '../i18n/LanguageContext';

interface FitnessChartProps {
  history: GenerationRecord[];
  milestones?: LearningMilestones;
  allTimeBestScore?: number;
}

export function FitnessChart({
  history,
  milestones,
  allTimeBestScore,
}: FitnessChartProps) {
  const { t } = useLanguage();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [metric, setMetric] = useState<'score' | 'fitness'>('score');

  const width = 460;
  const height = 165;
  const padLeft = 36;
  const padRight = 14;
  const padTop = 14;
  const padBottom = 26;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const hasData = history.length > 0;
  const peakValues = history.map((d) =>
    metric === 'score' ? d.bestScore : d.bestFitness
  );
  const avgValues = history.map((d) =>
    metric === 'score' ? d.avgScore : d.avgFitness
  );
  const movingAvgValues = peakValues.map((_, idx) => {
    const start = Math.max(0, idx - 4);
    let sum = 0;
    for (let j = start; j <= idx; j++) sum += peakValues[j];
    return sum / (idx - start + 1);
  });

  const maxVal = Math.max(
    metric === 'score' ? 5 : 50,
    ...peakValues,
    ...avgValues
  );

  const getX = (idx: number) => {
    if (history.length <= 1) return padLeft + plotW / 2;
    return padLeft + (idx / (history.length - 1)) * plotW;
  };

  const getY = (val: number) => {
    const ratio = Math.max(0, Math.min(1, val / maxVal));
    return padTop + plotH - ratio * plotH;
  };

  const buildPath = (values: number[]) =>
    values
      .map((val, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(val).toFixed(1)}`)
      .join(' ');

  const hovered = hoveredIdx !== null ? history[hoveredIdx] : null;

  const formatMs = (ms: number | null) => {
    if (ms === null) return '—';
    return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-base font-semibold text-slate-100">
              {t('training.evolutionHistory2')}
            </h2>
            {allTimeBestScore !== undefined && (
              <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-emerald-300">
                {t('training.allTimePipes', { allTimeBestScore })}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {hasData
              ? t('training.generations1', { generation: history[history.length - 1].generation })
              : t('training.completingGeneration1ToPlot')}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-900/90 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setMetric('score')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              metric === 'score'
                ? 'bg-slate-800 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('training.pipes')}
          </button>
          <button
            type="button"
            onClick={() => setMetric('fitness')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              metric === 'fitness'
                ? 'bg-slate-800 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Fitness
          </button>
        </div>
      </div>

      <div className="relative mt-3">
        {!hasData ? (
          <div className="flex h-[165px] items-center justify-center rounded-lg border border-dashed border-slate-800 px-4 text-center text-xs text-slate-400">
            {t('training.firstGenerationStillFlyingLearning')}
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto"
            onMouseLeave={() => setHoveredIdx(null)}
            role="img"
            aria-label="Generation fitness and pipe score history chart"
          >
            {/* Horizontal grid lines */}
            {[0, 0.5, 1].map((tick) => {
              const y = padTop + plotH * (1 - tick);
              const val = Math.round(maxVal * tick);
              return (
                <g key={tick}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    stroke="rgba(148, 163, 184, 0.12)"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padLeft - 6}
                    y={y + 3.5}
                    textAnchor="end"
                    className="fill-slate-500 font-mono text-[9.5px] tabular-nums"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Average series */}
            <path
              d={buildPath(avgValues)}
              fill="none"
              stroke="#94A3B8"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />

            {/* 5-Generation Moving Average series */}
            <path
              d={buildPath(movingAvgValues)}
              fill="none"
              stroke="#F59E0B"
              strokeWidth={1.7}
              strokeOpacity={0.85}
            />

            {/* Peak series */}
            <path
              d={buildPath(peakValues)}
              fill="none"
              stroke="#06B6D4"
              strokeWidth={2.2}
            />

            {/* Points & invisible hover targets */}
            {history.map((rec, idx) => {
              const cx = getX(idx);
              const cy = getY(metric === 'score' ? rec.bestScore : rec.bestFitness);
              const isHov = hoveredIdx === idx;
              return (
                <g key={rec.generation}>
                  {isHov && (
                    <line
                      x1={cx}
                      y1={padTop}
                      x2={cx}
                      y2={padTop + plotH}
                      stroke="rgba(34, 211, 238, 0.35)"
                      strokeWidth={1}
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHov ? 4.5 : history.length < 24 ? 2.5 : 0}
                    fill="#22D3EE"
                  />
                  <rect
                    x={cx - Math.max(4, plotW / Math.max(2, history.length * 2))}
                    y={padTop}
                    width={Math.max(8, plotW / Math.max(1, history.length))}
                    height={plotH}
                    fill="transparent"
                    onMouseEnter={() => setHoveredIdx(idx)}
                  />
                </g>
              );
            })}

            {/* X-axis label */}
            <text
              x={padLeft}
              y={height - 6}
              className="fill-slate-500 font-mono text-[9.5px] tabular-nums"
            >
              Gen {history[0].generation}
            </text>
            <text
              x={width - padRight}
              y={height - 6}
              textAnchor="end"
              className="fill-slate-500 font-mono text-[9.5px] tabular-nums"
            >
              Gen {history[history.length - 1].generation}
            </text>
          </svg>
        )}

        {/* Legend & Hover readout */}
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center gap-3.5">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-3 bg-cyan-400" />
              {t('training.genBest')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-3 bg-amber-400" />
              {t('training.k5GenTrend')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-3 border-t border-dashed border-slate-400" />
              {t('training.popAvg')}
            </span>
          </div>

          {hovered && (
            <span className="font-mono tabular-nums text-cyan-300">
              Gen {hovered.generation} · Best {hovered.bestScore}p · 5g{' '}
              {movingAvgValues[hoveredIdx ?? 0]?.toFixed(1)} · Avg{' '}
              {hovered.avgFitness.toFixed(0)} fit
            </span>
          )}
        </div>

        <p className="mt-1 text-[10px] leading-snug text-slate-500">
          {t('training.singleSeedPerGenEvaluation')}
        </p>

        {milestones && (
          <div className="mt-2.5 rounded-lg border border-slate-800 bg-[#0B1120] px-2.5 py-2 font-mono text-[10px] tabular-nums">
            <div className="mb-1.5 flex items-center justify-between text-slate-400">
              <span className="font-semibold text-amber-300">
                {t('training.learningSpeedMilestones')}
              </span>
              <span>
                {t('training.elapsed')} {formatMs(milestones.elapsedMs)}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  {
                    label: t('training.k1Pipe'),
                    gen: milestones.reached1Gen,
                    ms: milestones.reached1Ms,
                  },
                  {
                    label: t('training.k10Pipes'),
                    gen: milestones.reached10Gen,
                    ms: milestones.reached10Ms,
                  },
                  {
                    label: t('training.k50Pipes'),
                    gen: milestones.reached50Gen,
                    ms: milestones.reached50Ms,
                  },
                  {
                    label: t('training.k100Pipes'),
                    gen: milestones.reached100Gen,
                    ms: milestones.reached100Ms,
                  },
                ] as const
              ).map((m) => (
                <div
                  key={m.label}
                  className={`rounded border px-2 py-1 ${
                    m.gen !== null
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                      : 'border-slate-800 bg-slate-950/60 text-slate-500'
                  }`}
                >
                  <div className="font-semibold">{m.label}</div>
                  <div className="text-[9.5px]">
                    {m.gen !== null
                      ? `Gen ${m.gen} · ${formatMs(m.ms)}`
                      : t('training.pending')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

