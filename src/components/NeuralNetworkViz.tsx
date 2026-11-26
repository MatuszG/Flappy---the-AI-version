import { ARCHITECTURE_CATALOG } from '../engine/architectureCatalog';
import { ARCHITECTURE_META } from '../engine/neuralNetwork';
import { inferInputFeaturesFromCount, SENSOR_METADATA } from '../engine/sensors';
import type { HybridExpertKind, NetworkSnapshot, PerceptionMode } from '../engine/types';
import { useLanguage } from '../i18n/LanguageContext';

interface NeuralNetworkVizProps {
  snapshot: NetworkSnapshot | null;
  perceptionMode?: PerceptionMode;
}

export function NeuralNetworkViz({ snapshot, perceptionMode }: NeuralNetworkVizProps) {
  const { lang, t } = useLanguage();
  const isCompoundEye = perceptionMode === 'COMPOUND_EYE_PIXELS';
  if (!snapshot) {
    return (
      <div className="flex h-60 items-center justify-center text-sm text-slate-400">
        {t('training.waitingForLiveNeuralNetwork')}
      </div>
    );
  }

  const width = 480;
  const height = 256;
  const inputX = 112;
  const outputX = 398;

  const layers =
    snapshot.layers && snapshot.layers.length >= 2
      ? snapshot.layers
      : snapshot.hiddenNodes > 0
        ? [snapshot.inputNodes, snapshot.hiddenNodes, snapshot.outputNodes]
        : [snapshot.inputNodes, snapshot.outputNodes];

  const activeInputFeatures = inferInputFeaturesFromCount(
    layers[0],
    snapshot.inputFeatures
  );

  const hiddenLayers = layers.slice(1, -1);
  const depth = hiddenLayers.length;

  let paramCount = 0;
  for (let l = 0; l < layers.length - 1; l++) {
    paramCount += layers[l] * layers[l + 1] + layers[l + 1];
  }

  const topologyText = layers.join('→');

  const getLayerX = (layerIdx: number) => {
    if (layerIdx === 0) return inputX;
    if (layerIdx === layers.length - 1) return outputX;
    const frac = layerIdx / (layers.length - 1);
    return inputX + frac * (outputX - inputX);
  };

  const getY = (index: number, count: number) => {
    const topPad = count > 8 ? 18 : 28;
    const usable = height - topPad * 2;
    if (count <= 1) return height / 2;
    return topPad + (index / (count - 1)) * usable;
  };

  const getNodeRadius = (count: number) => {
    if (count > 12) return 5.5;
    if (count > 8) return 7;
    if (count > 5) return 8.5;
    return 10;
  };

  const getWeight = (layerIdx: number, prevIdx: number, nextIdx: number, prevCount: number): number => {
    if (snapshot.layerWeights && snapshot.layerWeights[layerIdx]) {
      return snapshot.layerWeights[layerIdx][nextIdx * prevCount + prevIdx] ?? 0;
    }
    if (depth === 0) return snapshot.weightsHO[prevIdx] ?? 0;
    if (layerIdx === 0) return snapshot.weightsIH[nextIdx * prevCount + prevIdx] ?? 0;
    return snapshot.weightsHO[prevIdx] ?? 0;
  };

  const getActivation = (layerIdx: number, nodeIdx: number): number => {
    if (snapshot.activations && snapshot.activations[layerIdx]) {
      return snapshot.activations[layerIdx][nodeIdx] ?? 0;
    }
    if (layerIdx === 0) return snapshot.inputs[nodeIdx] ?? 0;
    if (layerIdx === layers.length - 1) return snapshot.output;
    return snapshot.hiddenActivations[nodeIdx] ?? 0;
  };

  const archMeta = snapshot.architecture
    ? ARCHITECTURE_META[snapshot.architecture]
    : undefined;
  const archCatalog = snapshot.architecture
    ? ARCHITECTURE_CATALOG[snapshot.architecture]
    : undefined;
  const routeProfile =
    snapshot.computeProfile ?? archMeta?.computeProfile ?? 'GPU_LOCKSTEP';
  const hybridTelemetry =
    snapshot.hybridTelemetry ?? snapshot.morphogenesis?.hybridTelemetry;
  const showReasoningBanner =
    Boolean(snapshot.reasoningStepInfo) &&
    (snapshot.architecture === 'PONDER_ACT' ||
      snapshot.architecture === 'LOOPED_REASONER' ||
      snapshot.architecture === 'LATENT_ROLLOUT' ||
      snapshot.architecture === 'SELECTIVE_SSM');

  return (
    <div>
      <div className="flex items-start justify-between gap-2.5 border-b border-slate-800/80 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="font-display text-sm sm:text-base font-semibold text-slate-100 whitespace-nowrap">
              {t('training.leaderBrain')}
            </h2>
            {archCatalog && (
              <span
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold text-slate-950 whitespace-nowrap shrink-0"
                style={{ backgroundColor: archCatalog.colorHex }}
              >
                {archCatalog.shortLabel}
              </span>
            )}
            <span
              className={`rounded border px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap shrink-0 ${
                routeProfile === 'CPU_SPECIALIZED'
                  ? 'border-amber-500/45 bg-amber-500/10 text-amber-200'
                  : 'border-cyan-500/35 bg-cyan-500/10 text-cyan-200'
              }`}
            >
              {routeProfile === 'CPU_SPECIALIZED'
                ? '◇ CPU-Only'
                : '◆ GPU Lockstep'}
            </span>
          </div>
          <p className="mt-1 font-mono text-[11px] tabular-nums text-slate-400 truncate">
            {topologyText} · {paramCount}p · D{depth}
            {snapshot.flopsPerFrame !== undefined
              ? ` · ${Math.round(snapshot.flopsPerFrame)} FLOPs/f`
              : ''}
          </p>
        </div>
        <div className="w-[106px] sm:w-[128px] shrink-0 text-right font-mono text-xs tabular-nums">
          <div
            className={`inline-block rounded border px-2 py-0.5 text-[10.5px] sm:text-[11px] font-semibold whitespace-nowrap ${
              snapshot.shouldFlap
                ? 'border-emerald-500/45 bg-emerald-500/15 text-emerald-300'
                : 'border-slate-800 bg-slate-900/90 text-slate-400'
            }`}
          >
            {snapshot.shouldFlap
              ? t('training.flapWings')
              : t('training.gliding')}
          </div>
          <div className="mt-0.5 text-[10.5px] text-slate-500">
            out: {snapshot.output >= 0 ? '+' : ''}
            {snapshot.output.toFixed(2)}
          </div>
        </div>
      </div>

      {showReasoningBanner && snapshot.reasoningStepInfo && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-2.5 py-1.5 font-mono text-[11px] tabular-nums">
          <span className="text-emerald-300 font-semibold">
            {snapshot.architecture === 'PONDER_ACT'
              ? snapshot.reasoningStepInfo.ponderSteps > 1
                ? t('training.system2Steps', { ponderSteps: snapshot.reasoningStepInfo.ponderSteps, maxSteps: snapshot.reasoningStepInfo.maxSteps })
                : t('training.system11Step', { maxSteps: snapshot.reasoningStepInfo.maxSteps })
              : snapshot.architecture === 'LOOPED_REASONER'
                ? t('training.loopedCotSteps', { ponderSteps: snapshot.reasoningStepInfo.ponderSteps })
                : snapshot.architecture === 'LATENT_ROLLOUT'
                  ? t('training.imaginationRollout')
                  : 'SELECTIVE SSM / MinGRU'}
          </span>
          <span className="text-slate-300">
            {snapshot.reasoningStepInfo.rolloutAdvantage !== undefined
              ? `ΔV(SKOK−CZEKAJ)=${snapshot.reasoningStepInfo.rolloutAdvantage >= 0 ? '+' : ''}${snapshot.reasoningStepInfo.rolloutAdvantage.toFixed(2)}`
              : snapshot.reasoningStepInfo.ssmGateMean !== undefined
                ? t('training.gateZT', { val0: snapshot.reasoningStepInfo.ssmGateMean.toFixed(2) })
                : t('training.depth', { ponderSteps: snapshot.reasoningStepInfo.ponderSteps, maxSteps: snapshot.reasoningStepInfo.maxSteps })}
          </span>
        </div>
      )}

      {snapshot.architecture === 'DROSOPHILA_CONNECTOME' && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1.5 font-mono text-[10px] tabular-nums text-emerald-200">
          <span className="font-semibold">DROSOPHILA · FlyWire 2024</span>
          <span className="text-slate-300">T4/T5 LTC · APL · Giant Fiber</span>
        </div>
      )}

      {snapshot.architecture === 'DECOUPLED_FLY_CORTEX' && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-purple-500/40 bg-purple-500/10 px-2.5 py-1.5 font-mono text-[10px] tabular-nums text-purple-200">
          <span className="font-semibold">FLY-CORTEX (0p Memory + Plastic Core)</span>
          <span className="text-slate-300">FlyHash APL + LTC + Online DA</span>
        </div>
      )}

      {hybridTelemetry && (
        <div className="mt-2 rounded-lg border border-amber-500/35 bg-[#0B1120] px-2.5 py-2 font-mono text-[10px] tabular-nums space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-amber-300">
              {t('training.hybridMoeRouterActiveBlocks', { activeExperts: 1 + hybridTelemetry.activeExperts.length })}
            </span>
            <span className="text-slate-300">
              {Math.round(hybridTelemetry.avgFlopsPerFrame)} {t('training.flopsFApproved')}{' '}
              <span className="text-emerald-300 font-bold">
                {hybridTelemetry.committedExpertsCount ?? 0}
              </span>{' '}
              · {t('training.rolledBack')}{' '}
              <span className="text-rose-300 font-bold">
                {hybridTelemetry.rollbackCount}
              </span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                { key: 'MLP', label: t('training.k1MlpCore'), color: '#3B82F6' },
                { key: 'LTC_FLY', label: '2. LTC Fly (ODE)', color: '#10B981' },
                { key: 'SELECTIVE_SSM', label: '3. MinGRU (SSM)', color: '#06B6D4' },
                { key: 'PONDER_ACT', label: t('training.k4PonderSys2'), color: '#F97316' },
              ] as const
            ).map((blk) => {
              const weight = hybridTelemetry.routerWeights[blk.key] ?? 0;
              const pct = Math.round(weight * 100);
              const isCore = blk.key === 'MLP';
              const active =
                isCore ||
                hybridTelemetry.activeExperts.includes(blk.key as HybridExpertKind);
              const alpha = !isCore
                ? hybridTelemetry.alphaGates[blk.key as HybridExpertKind]
                : undefined;
              const inTrial = hybridTelemetry.inTrialExpert === blk.key;
              return (
                <div
                  key={blk.key}
                  className={`rounded border px-2 py-1.5 space-y-1 ${
                    active
                      ? inTrial
                        ? 'border-amber-400/60 bg-amber-500/10 text-amber-200'
                        : 'border-cyan-500/35 bg-slate-900/90 text-slate-200'
                      : 'border-slate-800/80 bg-slate-950/60 text-slate-500 opacity-65'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate font-semibold">{blk.label}</span>
                    <span className="font-bold text-white">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-150"
                      style={{
                        width: `${Math.max(4, pct)}%`,
                        backgroundColor: active ? blk.color : '#475569',
                      }}
                    />
                  </div>
                  <div className="text-[9px] text-slate-400 flex items-center justify-between">
                    <span>
                      {isCore
                        ? t('training.alwaysActive')
                        : inTrial
                          ? t('training.trialWindowG', { trialGensRemaining: hybridTelemetry.trialGensRemaining })
                          : active
                            ? t('training.committed', { val0: (alpha ?? 0).toFixed(2) })
                            : t('training.dormant0Flops')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {snapshot.morphogenesis?.enabled && (
        <div className="mt-2 rounded-lg border border-slate-800 bg-[#0B1120] px-2.5 py-2 font-mono text-[10px] tabular-nums space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-cyan-300">
              MORPHOGENESIS STAGE {snapshot.morphogenesis.stage}/{snapshot.morphogenesis.maxStages}
            </span>
            <span className="text-slate-300">
              {snapshot.morphogenesis.activeParams}/{snapshot.morphogenesis.ceilingParams}p · Pruned {snapshot.morphogenesis.prunedSynapses}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400">
            <span>
              Width [{snapshot.morphogenesis.activeHiddenCounts.join('·')}]/{snapshot.morphogenesis.ceilingHiddenCounts.join('·')} · Sensors {snapshot.morphogenesis.activeSensorCount}/{snapshot.morphogenesis.totalSensorCount} · K={snapshot.morphogenesis.activeReasoningSteps}/{snapshot.morphogenesis.maxReasoningSteps}
            </span>
            <span>Sat {snapshot.morphogenesis.lastSaturationPct}%</span>
          </div>
          {snapshot.morphogenesis.events.length > 0 && (
            <div className="border-t border-slate-800/80 pt-1 text-[9.5px] text-slate-400 space-y-0.5">
              {snapshot.morphogenesis.events.slice(-2).map((ev, idx) => (
                <div key={`${ev.generation}-${ev.kind}-${idx}`} className="truncate">
                  <span className={ev.kind === 'PRUNE' ? 'text-rose-300' : 'text-amber-300'}>
                    G{ev.generation} {ev.kind}
                  </span>{' '}
                  — {ev.detail}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          role="img"
          aria-label={`Live neural network topology ${topologyText} showing real-time synapse weights and neuron activations`}
        >
          {/* Edges across all layers */}
          {layers.slice(0, -1).map((prevCount, l) => {
            const nextCount = layers[l + 1];
            const x1 = getLayerX(l);
            const x2 = getLayerX(l + 1);
            const denseEdge = prevCount * nextCount > 48;
            const morphEdges = snapshot.morphogenesis?.enabled
              ? snapshot.morphogenesis.edgeStates[l]
              : undefined;

            return Array.from({ length: nextCount }).map((_, nIdx) =>
              Array.from({ length: prevCount }).map((__, pIdx) => {
                const edgeIdx = nIdx * prevCount + pIdx;
                const morphState = morphEdges ? (morphEdges[edgeIdx] ?? 1) : 1;
                if (morphState === 0) {
                  return (
                    <line
                      key={`e-${l}-${pIdx}-${nIdx}`}
                      x1={x1}
                      y1={getY(pIdx, prevCount)}
                      x2={x2}
                      y2={getY(nIdx, nextCount)}
                      stroke="#334155"
                      strokeOpacity={0.18}
                      strokeDasharray="2 3"
                      strokeWidth={0.55}
                    />
                  );
                }
                const weight = getWeight(l, pIdx, nIdx, prevCount);
                const signal = Math.abs(getActivation(l, pIdx));
                const absW = Math.min(1.8, Math.abs(weight));
                const baseOpacity = denseEdge ? 0.08 : 0.14;
                const opacity = Math.min(0.92, baseOpacity + absW * 0.28 + signal * 0.2);
                const stroke =
                  morphState === 2
                    ? '#F59E0B'
                    : weight >= 0
                      ? '#10B981'
                      : '#F87171';
                return (
                  <line
                    key={`e-${l}-${pIdx}-${nIdx}`}
                    x1={x1}
                    y1={getY(pIdx, prevCount)}
                    x2={x2}
                    y2={getY(nIdx, nextCount)}
                    stroke={stroke}
                    strokeOpacity={morphState === 2 ? Math.max(0.45, opacity) : opacity}
                    strokeWidth={(denseEdge ? 0.55 : 0.85) + absW * (denseEdge ? 0.7 : 1.05)}
                  />
                );
              })
            );
          })}

          {/* Input Layer Nodes */}
          {Array.from({ length: layers[0] }).map((_, i) => {
            const y = getY(i, layers[0]);
            const val = getActivation(0, i);
            const intensity = Math.min(1, Math.abs(val));
            const featureId = activeInputFeatures[i];
            const inputLabel = featureId
              ? isCompoundEye
                ? SENSOR_METADATA[featureId].opticalShortLabel
                : SENSOR_METADATA[featureId].shortLabel
              : `In ${i + 1}`;
            const nodeState = snapshot.morphogenesis?.enabled
              ? (snapshot.morphogenesis.nodeStates[0]?.[i] ?? 1)
              : 1;
            const dormantNode = nodeState === 0;
            const plasticNode = nodeState === 2;
            return (
              <g key={`in-${i}`} opacity={dormantNode ? 0.35 : 1}>
                <text
                  x={inputX - 16}
                  y={y + 3.5}
                  textAnchor="end"
                  className={`text-[10.5px] font-mono font-medium ${
                    dormantNode
                      ? 'fill-slate-600'
                      : plasticNode
                        ? 'fill-amber-300'
                        : 'fill-slate-400'
                  }`}
                >
                  {inputLabel}
                </text>
                <circle
                  cx={inputX}
                  cy={y}
                  r={layers[0] > 8 ? 8 : 10}
                  fill={
                    dormantNode
                      ? 'rgba(15, 23, 42, 0.7)'
                      : val >= 0
                        ? `rgba(6, 182, 212, ${0.2 + intensity * 0.65})`
                        : `rgba(245, 158, 11, ${0.2 + intensity * 0.65})`
                  }
                  stroke={
                    dormantNode ? '#1E293B' : plasticNode ? '#F59E0B' : '#334155'
                  }
                  strokeDasharray={dormantNode ? '2 2' : undefined}
                  strokeWidth={1.5}
                />
                <text
                  x={inputX}
                  y={y + 3}
                  textAnchor="middle"
                  className="fill-slate-100 font-mono text-[8px] tabular-nums"
                >
                  {dormantNode ? '—' : val.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Arbitrary Hidden Layers */}
          {hiddenLayers.map((nodeCount, hLayerIdx) => {
            const layerIdx = hLayerIdx + 1;
            const x = getLayerX(layerIdx);
            const radius = getNodeRadius(nodeCount);
            const morphNodes = snapshot.morphogenesis?.enabled
              ? snapshot.morphogenesis.nodeStates[layerIdx]
              : undefined;
            return Array.from({ length: nodeCount }).map((_, nIdx) => {
              const y = getY(nIdx, nodeCount);
              const act = getActivation(layerIdx, nIdx);
              const intensity = Math.min(1, Math.abs(act));
              const mState = morphNodes ? (morphNodes[nIdx] ?? 1) : 1;
              const isDormant = mState === 0;
              const isPlastic = mState === 2;
              return (
                <g key={`hid-${layerIdx}-${nIdx}`} opacity={isDormant ? 0.35 : 1}>
                  <circle
                    cx={x}
                    cy={y}
                    r={radius}
                    fill={
                      isDormant
                        ? 'rgba(15, 23, 42, 0.75)'
                        : act >= 0
                          ? `rgba(16, 185, 129, ${0.18 + intensity * 0.72})`
                          : `rgba(248, 113, 113, ${0.18 + intensity * 0.72})`
                    }
                    stroke={
                      isDormant
                        ? '#334155'
                        : isPlastic
                          ? '#F59E0B'
                          : snapshot.morphogenesis?.enabled
                            ? '#06B6D4'
                            : '#475569'
                    }
                    strokeDasharray={isDormant ? '2 2' : undefined}
                    strokeWidth={isPlastic || snapshot.morphogenesis?.enabled ? 1.7 : 1.3}
                  />
                  {radius >= 8 && (
                    <text
                      x={x}
                      y={y + 2.8}
                      textAnchor="middle"
                      className="fill-slate-100 font-mono text-[7.5px] tabular-nums"
                    >
                      {isDormant ? '·' : act.toFixed(1)}
                    </text>
                  )}
                </g>
              );
            });
          })}

          {/* Output Node */}
          <g>
            <circle
              cx={outputX}
              cy={getY(0, 1)}
              r={16}
              fill={
                snapshot.shouldFlap
                  ? 'rgba(16, 185, 129, 0.85)'
                  : 'rgba(30, 41, 59, 0.95)'
              }
              stroke={snapshot.shouldFlap ? '#6EE7B7' : '#475569'}
              strokeWidth={2}
            />
            <text
              x={outputX}
              y={getY(0, 1) + 3.5}
              textAnchor="middle"
              className="fill-white font-mono text-[10px] font-semibold tabular-nums"
            >
              {snapshot.output.toFixed(2)}
            </text>
            <text
              x={outputX + 24}
              y={getY(0, 1) + 4}
              textAnchor="start"
              className={`text-[11px] font-semibold ${
                snapshot.shouldFlap ? 'fill-emerald-400' : 'fill-slate-400'
              }`}
            >
              {snapshot.shouldFlap ? t('training.flap2') : t('training.glide')}
            </text>
          </g>
        </svg>

        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          {snapshot.morphogenesis?.enabled ? (
            <>
              <span className="text-cyan-300">
                {t('training.cyanNodeMyelinatedCore')}
              </span>
              <span className="text-amber-300">
                {t('training.amberPlasticNewborn')}
              </span>
              <span className="text-slate-500">
                {t('training.dashedDormantPruned')}
              </span>
            </>
          ) : (
            <>
              <span>{t('training.greenEdgesExcitatory')}</span>
              <span>{t('training.redEdgesInhibitory')}</span>
            </>
          )}
        </div>

        {snapshot.decoupledTelemetry && (
          <div className="mt-2.5 space-y-1.5 rounded-lg border border-emerald-500/35 bg-emerald-950/20 px-2.5 py-2 font-mono text-[10px] tabular-nums">
            <div className="flex flex-wrap items-center justify-between gap-1 text-emerald-200">
              <span className="font-semibold">
                DECOUPLED CORTEX ·{' '}
                {snapshot.decoupledTelemetry.system2Active
                  ? 'SYSTEM 2 (2-STEP PONDER)'
                  : 'SYSTEM 1 (1-STEP REFLEX)'}
              </span>
              <span className="text-slate-300">
                Surprise {snapshot.decoupledTelemetry.surpriseLevel.toFixed(2)} ·
                DA δ{' '}
                {snapshot.decoupledTelemetry.dopamineSignal >= 0 ? '+' : ''}
                {snapshot.decoupledTelemetry.dopamineSignal.toFixed(2)} ·{' '}
                {snapshot.decoupledTelemetry.onlineUpdates} writes
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1 text-slate-300">
              <span>
                FlyHash APL Top-2:{' '}
                <strong className="text-amber-300">
                  #{snapshot.decoupledTelemetry.activeSlots[0]}
                </strong>{' '}
                ({Math.round(snapshot.decoupledTelemetry.slotWeights[0] * 100)}%)
                {' + '}
                <strong className="text-cyan-300">
                  #{snapshot.decoupledTelemetry.activeSlots[1]}
                </strong>{' '}
                ({Math.round(snapshot.decoupledTelemetry.slotWeights[1] * 100)}%)
              </span>
              <span>
                Skill Readout:{' '}
                <strong className="text-emerald-300">
                  {snapshot.decoupledTelemetry.memoryReadout >= 0 ? '+' : ''}
                  {snapshot.decoupledTelemetry.memoryReadout.toFixed(2)}
                </strong>
              </span>
            </div>

            <div
              className="grid grid-cols-16 gap-0.5 pt-0.5"
              title="16-Slot FlyHash APL Associative Skill Memory Bank (highlighted slots are addressed by Winner-Take-Most Kenyon sparse hash)"
            >
              {Array.from({ length: 16 }, (_, slotIdx) => {
                const isSlot0 =
                  snapshot.decoupledTelemetry?.activeSlots[0] === slotIdx;
                const isSlot1 =
                  snapshot.decoupledTelemetry?.activeSlots[1] === slotIdx;
                return (
                  <div
                    key={slotIdx}
                    className={`h-3 rounded-xs flex items-center justify-center text-[7.5px] ${
                      isSlot0
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : isSlot1
                          ? 'bg-cyan-400 text-slate-950 font-bold'
                          : 'bg-slate-800/90 text-slate-500'
                    }`}
                  >
                    {slotIdx}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
