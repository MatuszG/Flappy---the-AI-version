/**
 * Single Source of Truth for Trial Grid Enumeration, Remaining Trial Counting & Cache Matching.
 *
 * Shared by UI (useResearchSession / ResearchLabView), SmartPrune, and ResearchPool
 * so planned, pruned, cached, and remaining trial counts can never diverge.
 */

import {
  calculateParameterCount,
  formatTopologyLabel,
  normalizeHiddenLayers,
} from './neuralNetwork';
import { getResultSignature } from './researchStorage';
import {
  CLASSIC_5_SENSOR_FEATURES,
  formatInputSubsetKey,
  isClassic5SensorSet,
  normalizeInputFeatures,
} from './sensors';
import {
  analyzeSmartPrune,
  createSmartPruneContext,
  getTrialPruneReason,
  resolveAlgorithmsForArchitecture,
  resolveCurriculumOptions,
  resolveMorphModesForArchitecture,
  resolvePerceptionModesForArchitecture,
  resolveReasoningStepsForArchitecture,
  resolveShapedFitnessOptions,
  resolveTopologiesForArchitecture,
  type SmartPruneSummary,
} from './smartPrune';
import type {
  NetworkArchitecture,
  PerceptionMode,
  ResearchSweepConfig,
  ResearchTrialResult,
  SensorFeatureId,
  WeightPrecision,
} from './types';

export interface ValidTrialShape {
  arch: NetworkArchitecture;
  inFeats: SensorFeatureId[];
  inSuffix: string;
  inKey: string;
  topo: number[];
  topoLabel: string;
}

export interface SweepGridPlan {
  pruneSummary: SmartPruneSummary;
  architectures: NetworkArchitecture[];
  weightPrecisions: WeightPrecision[];
  validShapes: ValidTrialShape[];
}

export function buildSweepGridPlan(cfg: ResearchSweepConfig): SweepGridPlan {
  const pruneSummary = analyzeSmartPrune(cfg);
  const rawInputSets =
    cfg.inputFeatureSets && cfg.inputFeatureSets.length > 0
      ? cfg.inputFeatureSets
      : [[...CLASSIC_5_SENSOR_FEATURES]];
  const rawArchitectures: NetworkArchitecture[] =
    cfg.architectures && cfg.architectures.length > 0
      ? Array.from(new Set(cfg.architectures))
      : ['MLP'];
  const architectures: NetworkArchitecture[] =
    cfg.evolutionTopologyMode === 'ISLAND_SPECIATION'
      ? [
          rawArchitectures.includes('HYBRID_MOE')
            ? 'HYBRID_MOE'
            : rawArchitectures[0],
        ]
      : rawArchitectures;
  const weightPrecisions: WeightPrecision[] =
    cfg.weightPrecisions && cfg.weightPrecisions.length > 0
      ? Array.from(new Set(cfg.weightPrecisions))
      : ['FP32'];
  const maxParams = cfg.maxParameters !== undefined ? cfg.maxParameters : null;

  const preInputs: {
    feats: SensorFeatureId[];
    inCount: number;
    key: string;
    inSuffix: string;
  }[] = [];
  const seenInputKeys = new Set<string>();
  for (let i = 0; i < rawInputSets.length; i++) {
    const clean = normalizeInputFeatures(rawInputSets[i]);
    const key = formatInputSubsetKey(clean);
    if (seenInputKeys.has(key)) continue;
    seenInputKeys.add(key);
    preInputs.push({
      feats: clean,
      inCount: clean.length,
      key,
      inSuffix: isClassic5SensorSet(clean) ? '' : `|in:${key}`,
    });
  }

  const validShapes: ValidTrialShape[] = [];
  for (let a = 0; a < architectures.length; a++) {
    const arch = architectures[a];
    const archTopos = resolveTopologiesForArchitecture(cfg, arch);
    for (let ii = 0; ii < preInputs.length; ii++) {
      const inp = preInputs[ii];
      for (let t = 0; t < archTopos.length; t++) {
        const topo = archTopos[t];
        if (
          maxParams !== null &&
          calculateParameterCount(topo, inp.inCount, 1, arch) > maxParams
        ) {
          continue;
        }
        validShapes.push({
          arch,
          inFeats: inp.feats,
          inSuffix: inp.inSuffix,
          inKey: inp.key,
          topo,
          topoLabel: formatTopologyLabel(topo, inp.inCount),
        });
      }
    }
  }

  return {
    pruneSummary,
    architectures,
    weightPrecisions,
    validShapes,
  };
}

/**
 * Exact O(min(planned, cached)) remaining-trials counter — 1:1 parity with Smart Prune & ResearchPool.
 * Uses Branch A (exact grid signature scan) when planned <= cached, or Branch B (single O(cached) pass)
 * when planned > cached. Both branches produce bit-identical counts.
 */
export function computeRemainingTrialsCount(
  cfg: ResearchSweepConfig,
  cachedResults: readonly ResearchTrialResult[],
  precomputedSigSet?: ReadonlySet<string>,
  forceBranch?: 'A' | 'B'
): number {
  const plan = buildSweepGridPlan(cfg);
  const totalPlanned = plan.pruneSummary.activeTrials;

  if (totalPlanned === 0 || cachedResults.length === 0) {
    return totalPlanned;
  }

  const pruneCtx = createSmartPruneContext(cfg);
  const diffs = Array.from(new Set(cfg.difficulties));
  const pops = Array.from(new Set(cfg.populationSizes));
  const rates = Array.from(new Set(cfg.mutationRates));
  const strs = Array.from(new Set(cfg.mutationStrengths));
  const currOpts = resolveCurriculumOptions(cfg);
  const shapeOpts = resolveShapedFitnessOptions(cfg);
  const wantEvoMode = cfg.evolutionTopologyMode ?? 'SINGLE_SPECIES';
  const wantIslSuffix = wantEvoMode === 'ISLAND_SPECIATION' ? '|isl' : '';

  const useBranchA =
    forceBranch === 'A' ||
    (forceBranch !== 'B' && totalPlanned <= cachedResults.length);

  if (useBranchA) {
    const sigSet =
      precomputedSigSet ??
      new Set(cachedResults.map((r) => getResultSignature(r)));
    const tailSig = `|cap${cfg.targetPipeCap}|sd${cfg.verificationSeeds}`;
    let remaining = 0;

    for (let si = 0; si < plan.validShapes.length; si++) {
      const sh = plan.validShapes[si];
      const archAlgos = resolveAlgorithmsForArchitecture(cfg, sh.arch);
      const archMorphs = resolveMorphModesForArchitecture(cfg, sh.arch);
      const archKList = resolveReasoningStepsForArchitecture(cfg, sh.arch);
      const archPercs = resolvePerceptionModesForArchitecture(cfg, sh.arch);
      const archSuffix = sh.arch !== 'MLP' ? `|arch:${sh.arch}` : '';
      const isKArch =
        sh.arch === 'LOOPED_REASONER' || sh.arch === 'PONDER_ACT';

      for (let ai = 0; ai < archAlgos.length; ai++) {
        const algo = archAlgos[ai];
        for (let di = 0; di < diffs.length; di++) {
          const diff = diffs[di];
          const basePrefix = `${algo}|${diff}|${sh.topoLabel}|`;
          for (let pi = 0; pi < plan.weightPrecisions.length; pi++) {
            const prec = plan.weightPrecisions[pi];
            const precSuffix = prec !== 'FP32' ? `|prec:${prec}` : '';
            for (let popI = 0; popI < pops.length; popI++) {
              const pop = pops[popI];
              for (let rI = 0; rI < rates.length; rI++) {
                const mRate = rates[rI];
                if (
                  getTrialPruneReason(pruneCtx, {
                    algorithm: algo,
                    difficulty: diff,
                    architecture: sh.arch,
                    topology: sh.topo,
                    inputFeatures: sh.inFeats,
                    mutationRate: mRate,
                  }) !== null
                ) {
                  continue;
                }
                for (let sI = 0; sI < strs.length; sI++) {
                  const midSig = `${basePrefix}p${pop}|r${mRate}|s${strs[sI]}${tailSig}${sh.inSuffix}${archSuffix}${precSuffix}`;
                  for (let ci = 0; ci < currOpts.length; ci++) {
                    const currPart = currOpts[ci] ? '|curr' : '';
                    for (let shi = 0; shi < shapeOpts.length; shi++) {
                      const shapePart = shapeOpts[shi] ? '|shape' : '';
                      for (let ki = 0; ki < archKList.length; ki++) {
                        const kVal = archKList[ki];
                        const kPart = isKArch && kVal !== 3 ? `|k${kVal}` : '';
                        for (let mi = 0; mi < archMorphs.length; mi++) {
                          const morphPart =
                            archMorphs[mi] === 'GROWING' ? '|morph' : '';
                          for (let pei = 0; pei < archPercs.length; pei++) {
                            const eyePart =
                              archPercs[pei] === 'COMPOUND_EYE_PIXELS'
                                ? '|eye'
                                : '';
                            const sig = `${midSig}${currPart}${shapePart}${kPart}${morphPart}${wantIslSuffix}${eyePart}`;
                            if (!sigSet.has(sig)) remaining += 1;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return remaining;
  }

  // Branch B: planned grid is HUGE -> scan cached results ONCE with O(1) Set lookups + Smart Prune check
  const diffSet = new Set(diffs);
  const precSet = new Set<string>(plan.weightPrecisions);
  const popSet = new Set(pops);
  const rateSet = new Set(rates);
  const strSet = new Set(strs);
  const currSet = new Set(currOpts);
  const shapeSet = new Set(shapeOpts);
  const archMetaMap = new Map<
    NetworkArchitecture,
    {
      algos: Set<string>;
      morphs: Set<'STATIC' | 'GROWING'>;
      ks: Set<number>;
      percs: Set<PerceptionMode>;
    }
  >();
  for (let a = 0; a < plan.architectures.length; a++) {
    const arch = plan.architectures[a];
    archMetaMap.set(arch, {
      algos: new Set(resolveAlgorithmsForArchitecture(cfg, arch)),
      morphs: new Set(resolveMorphModesForArchitecture(cfg, arch)),
      ks: new Set(resolveReasoningStepsForArchitecture(cfg, arch)),
      percs: new Set(resolvePerceptionModesForArchitecture(cfg, arch)),
    });
  }
  const validShapeMap = new Map<
    string,
    { topo: number[]; inFeats: SensorFeatureId[] }
  >();
  for (let i = 0; i < plan.validShapes.length; i++) {
    const sh = plan.validShapes[i];
    validShapeMap.set(`${sh.arch}|${sh.inKey}|${sh.topoLabel}`, {
      topo: sh.topo,
      inFeats: sh.inFeats,
    });
  }

  const matchedSigs = new Set<string>();
  const cap = cfg.targetPipeCap;
  const seeds = cfg.verificationSeeds;
  for (let i = 0; i < cachedResults.length; i++) {
    const r = cachedResults[i];
    const arch = r.architecture ?? 'MLP';
    const meta = archMetaMap.get(arch);
    if (!meta) continue;
    const rMorph: 'STATIC' | 'GROWING' =
      r.morphogenesisMode === 'GROWING' ? 'GROWING' : 'STATIC';
    const rEvoMode = r.evolutionTopologyMode ?? 'SINGLE_SPECIES';
    const rPerc: PerceptionMode =
      (arch === 'DROSOPHILA_CONNECTOME' || arch === 'DECOUPLED_FLY_CORTEX') &&
      r.perceptionMode === 'COMPOUND_EYE_PIXELS'
        ? 'COMPOUND_EYE_PIXELS'
        : 'GEOMETRIC_LAB';
    if (
      r.targetPipeCap !== cap ||
      r.verificationSeeds !== seeds ||
      !currSet.has(Boolean(r.curriculumLearning)) ||
      !shapeSet.has(Boolean(r.shapedFitness)) ||
      rEvoMode !== wantEvoMode ||
      !meta.morphs.has(rMorph) ||
      !meta.percs.has(rPerc) ||
      !rateSet.has(r.mutationRate) ||
      !meta.algos.has(r.algorithm) ||
      !diffSet.has(r.difficulty) ||
      !precSet.has(r.weightPrecision ?? 'FP32') ||
      !popSet.has(r.populationSize) ||
      !strSet.has(r.mutationStrength)
    ) {
      continue;
    }
    if (arch === 'LOOPED_REASONER' || arch === 'PONDER_ACT') {
      const resK = r.reasoningSteps ?? 3;
      if (!meta.ks.has(resK)) continue;
    }
    const inKey = formatInputSubsetKey(r.inputFeatures);
    const shape = validShapeMap.get(`${arch}|${inKey}|${r.topologyLabel}`);
    if (!shape) continue;
    if (
      getTrialPruneReason(pruneCtx, {
        algorithm: r.algorithm,
        difficulty: r.difficulty,
        architecture: arch,
        topology: shape.topo,
        inputFeatures: shape.inFeats,
        mutationRate: r.mutationRate,
      }) !== null
    ) {
      continue;
    }
    matchedSigs.add(getResultSignature(r));
  }
  return Math.max(0, totalPlanned - matchedSigs.size);
}
