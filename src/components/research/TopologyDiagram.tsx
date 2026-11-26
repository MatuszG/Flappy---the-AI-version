import React, { useMemo } from 'react';
import {
  calculateParameterCount,
  getGpuTopologyTier,
  type GpuTopologyTier,
} from '../../engine/neuralNetwork';
import type { NetworkArchitecture } from '../../engine/types';
import { useLanguage } from '../../i18n/LanguageContext';

interface TopologyDiagramProps {
  inputCount: number;
  hiddenLayers: number[];
  architecture: NetworkArchitecture;
  paramCount?: number;
}

const RECURRENT_ARCHS = new Set<NetworkArchitecture>([
  'LTC_FLY',
  'NEUROCHEM_GATE',
  'SYNAPTIC_STP',
  'LOOPED_REASONER',
  'PONDER_ACT',
  'SELECTIVE_SSM',
  'LATENT_ROLLOUT',
  'DROSOPHILA_CONNECTOME',
  'DECOUPLED_FLY_CORTEX',
  'HYBRID_MOE',
]);

const SKIP_ARCHS = new Set<NetworkArchitecture>([
  'RESIDUAL_SKIP',
  'DROSOPHILA_CONNECTOME',
  'DECOUPLED_FLY_CORTEX',
  'HYBRID_MOE',
]);

function formatTierBadge(
  tier: GpuTopologyTier,
  lang: 'pl' | 'en'
): { label: string; tone: string } {
  switch (tier) {
    case 'FAST':
      return { label: 'WebGPU FAST', tone: 'text-emerald-300' };
    case 'COMPACT_DEEP':
      return { label: 'WebGPU DEEP ≤8', tone: 'text-emerald-300' };
    case 'DEEP_24':
      return { label: 'WebGPU DEEP 24', tone: 'text-cyan-300' };
    case 'DEEP_64':
      return { label: 'WebGPU DEEP 64', tone: 'text-cyan-300' };
    case 'BIO_TINY':
      return { label: 'WebGPU BIO 8/12', tone: 'text-emerald-300' };
    case 'BIO_STD':
      return { label: 'WebGPU BIO 16/24', tone: 'text-cyan-300' };
    case 'BIO_MED':
      return { label: 'WebGPU BIO 32/36', tone: 'text-amber-300' };
    case 'BIO_LARGE':
      return { label: 'WebGPU BIO 64/64', tone: 'text-amber-300' };
    default:
      return {
        label: lang === 'pl' ? 'CPU Workers' : 'CPU Workers',
        tone: 'text-slate-400',
      };
  }
}

export const TopologyDiagram: React.FC<TopologyDiagramProps> = ({
  inputCount,
  hiddenLayers,
  architecture,
  paramCount,
}) => {
  const { lang } = useLanguage();

  const metrics = useMemo(() => {
    const safeIn = Math.max(1, inputCount);
    const layers = [safeIn, ...hiddenLayers, 1];
    const params =
      paramCount ??
      calculateParameterCount(hiddenLayers, safeIn, 1, architecture);
    const totalHidden = hiddenLayers.reduce((a, b) => a + b, 0);
    const tier = getGpuTopologyTier(hiddenLayers, architecture);
    return {
      layers,
      params,
      totalHidden,
      depth: hiddenLayers.length,
      tier,
      isRecurrent: RECURRENT_ARCHS.has(architecture),
      hasSkip: SKIP_ARCHS.has(architecture),
    };
  }, [architecture, hiddenLayers, inputCount, paramCount]);

  const width = 460;
  const height = 104;
  const padX = 36;
  const padY = 18;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const maxVisibleNodes = 7;

  const layerColumns = useMemo(() => {
    const count = metrics.layers.length;
    return metrics.layers.map((size, colIdx) => {
      const x = count <= 1 ? width / 2 : padX + (innerW * colIdx) / (count - 1);
      const visible = Math.min(size, maxVisibleNodes);
      const overflow = size > maxVisibleNodes ? size - maxVisibleNodes : 0;
      const ys: number[] = [];
      for (let i = 0; i < visible; i++) {
        const t = visible === 1 ? 0.5 : i / (visible - 1);
        ys.push(padY + t * innerH);
      }
      return {
        colIdx,
        size,
        x,
        ys,
        overflow,
        role:
          colIdx === 0
            ? 'input'
            : colIdx === count - 1
              ? 'output'
              : 'hidden',
      };
    });
  }, [innerH, innerW, metrics.layers]);

  const edges = useMemo(() => {
    const lines: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      key: string;
    }> = [];
    for (let c = 0; c < layerColumns.length - 1; c++) {
      const left = layerColumns[c];
      const right = layerColumns[c + 1];
      for (let i = 0; i < left.ys.length; i++) {
        for (let j = 0; j < right.ys.length; j++) {
          lines.push({
            x1: left.x,
            y1: left.ys[i],
            x2: right.x,
            y2: right.ys[j],
            key: `${c}-${i}-${j}`,
          });
        }
      }
    }
    return lines;
  }, [layerColumns]);

  const tierMeta = formatTierBadge(metrics.tier, lang);
  const shapeText = metrics.layers.join('→');

  return (
    <div className="rounded-lg border border-slate-800/90 bg-slate-950/80 px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-800/70">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono tabular-nums">
          <span className="text-slate-100 font-semibold">{shapeText}</span>
          <span className="text-slate-600">·</span>
          <span className="text-cyan-300">
            {metrics.params}{' '}
            {lang === 'pl' ? 'param. (wagi+biasy)' : 'params (weights+biases)'}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-emerald-300/90">
            {metrics.totalHidden}{' '}
            {lang === 'pl' ? 'neur. ukrytych' : 'hidden neurons'}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">
            {lang === 'pl'
              ? `${metrics.depth} warstw ukr. (D${metrics.depth})`
              : `${metrics.depth} hidden layers (D${metrics.depth})`}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          {metrics.isRecurrent && (
            <span className="text-violet-300">
              {lang === 'pl' ? 'pętla stanu' : 'stateful loop'}
            </span>
          )}
          {metrics.hasSkip && (
            <span className="text-amber-300">
              {lang === 'pl' ? 'skrót skip' : 'skip arc'}
            </span>
          )}
          <span className={`font-semibold ${tierMeta.tone}`}>
            {tierMeta.label}
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[96px] block select-none"
        role="img"
        aria-label={`${shapeText} (${metrics.params} params)`}
      >
        <g stroke="rgba(148, 163, 184, 0.22)" strokeWidth="0.9">
          {edges.map((e) => (
            <line key={e.key} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} />
          ))}
        </g>

        {metrics.hasSkip && layerColumns.length >= 2 && (
          <path
            d={`M ${layerColumns[0].x} ${padY - 4} Q ${width / 2} 2 ${layerColumns[layerColumns.length - 1].x} ${padY - 4}`}
            fill="none"
            stroke="rgba(251, 191, 36, 0.65)"
            strokeWidth="1.25"
            strokeDasharray="4 3"
          />
        )}

        {metrics.isRecurrent &&
          layerColumns
            .filter((col) => col.role === 'hidden')
            .map((col) => {
              const topY = col.ys[0] ?? padY;
              return (
                <path
                  key={`rec-${col.colIdx}`}
                  d={`M ${col.x - 5} ${topY - 4} C ${col.x - 16} ${topY - 19}, ${col.x + 16} ${topY - 19}, ${col.x + 5} ${topY - 4}`}
                  fill="none"
                  stroke="rgba(167, 139, 250, 0.78)"
                  strokeWidth="1.25"
                />
              );
            })}

        {layerColumns.map((col) => {
          const fill =
            col.role === 'input'
              ? '#22d3ee'
              : col.role === 'output'
                ? '#fb7185'
                : '#34d399';
          const stroke =
            col.role === 'input'
              ? '#083344'
              : col.role === 'output'
                ? '#4c0519'
                : '#064e3b';

          return (
            <g key={`col-${col.colIdx}`}>
              {col.ys.map((y, idx) => (
                <circle
                  key={`n-${col.colIdx}-${idx}`}
                  cx={col.x}
                  cy={y}
                  r={col.size > 5 ? 3.5 : 4.4}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth="1.2"
                />
              ))}
              <text
                x={col.x}
                y={height - 3}
                textAnchor="middle"
                fill={col.overflow > 0 ? '#94a3b8' : '#64748b'}
                fontSize="8.5"
                fontFamily="ui-monospace, monospace"
              >
                {col.overflow > 0
                  ? `+${col.overflow}`
                  : col.role === 'input'
                    ? `IN(${col.size})`
                    : col.role === 'output'
                      ? 'OUT(1)'
                      : `H${col.colIdx}(${col.size})`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
