import { MorphogenesisController } from './morphogenesis';
import { estimateArchitectureFlops, NeuralNetwork } from './neuralNetwork';
import {
  createOptimizer,
  type EvolutionOptimizer,
  type OptimizerContext,
  type OptimizerMember,
  type SpawnedMemberSpec,
} from './optimizers';
import { normalizeInputFeatures } from './sensors';
import type {
  EnvironmentConfig,
  EvolutionConfig,
  IslandSpeciationSummary,
  IslandSpeciesSnapshot,
  MorphogenesisEvent,
  MorphogenesisSnapshot,
  MorphogenesisSummary,
  NetworkArchitecture,
} from './types';

export const DEFAULT_ISLAND_SPECIES: readonly NetworkArchitecture[] = [
  'MLP',
  'DROSOPHILA_CONNECTOME',
  'DECOUPLED_FLY_CORTEX',
  'HYBRID_MOE',
  'PONDER_ACT',
  'SELECTIVE_SSM',
  'LTC_FLY',
  'RESIDUAL_SKIP',
  'NEUROCHEM_GATE',
  'SYNAPTIC_STP',
  'LOOPED_REASONER',
  'LATENT_ROLLOUT',
] as const;

export interface IslandMemberSpec extends SpawnedMemberSpec {
  species: NetworkArchitecture;
  islandIndex: number;
}

export interface IslandEvalMember extends OptimizerMember {
  species?: NetworkArchitecture;
  islandIndex?: number;
}

interface IslandState {
  index: number;
  species: NetworkArchitecture;
  optimizer: EvolutionOptimizer;
  morphogenesis: MorphogenesisController | null;
  sharePct: number;
  targetPopCount: number;
  bestScore: number;
  bestFitness: number;
  avgFlopsPerFrame: number;
  efficiencyScore: number;
  allTimeBestScore: number;
  allTimeBestFitness: number;
  allTimeBestBrain: NeuralNetwork | null;
  lastImprovementGen: number;
}

function normalizeSpeciesList(
  raw?: readonly NetworkArchitecture[]
): NetworkArchitecture[] {
  const src =
    raw && raw.length >= 2 ? raw : [...DEFAULT_ISLAND_SPECIES];
  const unique: NetworkArchitecture[] = [];
  for (let i = 0; i < src.length; i++) {
    if (!unique.includes(src[i])) unique.push(src[i]);
  }
  return unique.length >= 2 ? unique : [...DEFAULT_ISLAND_SPECIES];
}

function allocatePopCounts(
  sharesPct: number[],
  totalPop: number
): number[] {
  const m = sharesPct.length;
  const minCount = totalPop >= m * 3 ? 3 : Math.max(1, Math.floor(totalPop / m));
  const counts = new Array<number>(m).fill(minCount);
  let rem = Math.max(0, totalPop - minCount * m);
  if (rem === 0) return counts;

  const rawExtras = sharesPct.map((s) => (s / 100) * rem);
  const floorExtras = rawExtras.map((v) => Math.floor(v));
  for (let i = 0; i < m; i++) {
    counts[i] += floorExtras[i];
    rem -= floorExtras[i];
  }
  const order = rawExtras
    .map((v, i) => ({ i, frac: v - floorExtras[i] }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < rem; k++) {
    counts[order[k % m].i] += 1;
  }
  return counts;
}

export class IslandSpeciationCoordinator {
  private readonly baseConfig: EvolutionConfig;
  private readonly islands: IslandState[];
  private readonly rebalanceInterval = 10;
  private rebalanceCount = 0;
  private readonly allocationTimeline: Array<{
    generation: number;
    shares: Record<string, number>;
    leaderSpecies: NetworkArchitecture;
  }> = [];
  private winningSpecies: NetworkArchitecture;

  constructor(config: EvolutionConfig) {
    this.baseConfig = config;
    const speciesList = normalizeSpeciesList(config.islandSpecies);
    const m = speciesList.length;
    const equalShare = 100 / m;
    const counts = allocatePopCounts(
      new Array<number>(m).fill(equalShare),
      config.populationSize
    );
    const features = normalizeInputFeatures(config.inputFeatures);

    this.islands = speciesList.map((species, idx) => {
      const islandCfg: EvolutionConfig = {
        ...config,
        architecture: species,
        populationSize: counts[idx],
        elitismCount: Math.max(1, Math.round(counts[idx] * 0.12)),
      };
      const optimizer = createOptimizer(config.algorithm);
      optimizer.reset(islandCfg);

      let morphogenesis: MorphogenesisController | null = null;
      if (config.morphogenesis) {
        const sample = new NeuralNetwork(
          features.length,
          config.hiddenLayers,
          1,
          undefined,
          features,
          species,
          config.weightPrecision ?? 'FP32',
          config.reasoningSteps
        );
        morphogenesis = new MorphogenesisController(
          sample,
          config.morphogenesisConfig
        );
      }

      const initFlops = morphogenesis
        ? morphogenesis.computeActiveFlops()
        : estimateArchitectureFlops(
            config.hiddenLayers,
            features.length,
            species,
            config.reasoningSteps ?? 3
          );

      return {
        index: idx,
        species,
        optimizer,
        morphogenesis,
        sharePct: Number(equalShare.toFixed(1)),
        targetPopCount: counts[idx],
        bestScore: 0,
        bestFitness: 0,
        avgFlopsPerFrame: initFlops,
        efficiencyScore: 0,
        allTimeBestScore: 0,
        allTimeBestFitness: 0,
        allTimeBestBrain: null,
        lastImprovementGen: 1,
      };
    });

    this.winningSpecies = speciesList[0];
    this.recordTimelineSnapshot(1);
  }

  private buildIslandConfig(isl: IslandState): EvolutionConfig {
    return {
      ...this.baseConfig,
      architecture: isl.species,
      populationSize: isl.targetPopCount,
      elitismCount: Math.max(1, Math.min(isl.targetPopCount - 1, Math.round(isl.targetPopCount * 0.14))),
    };
  }

  private createIslandBrain(isl: IslandState): NeuralNetwork {
    const features = normalizeInputFeatures(this.baseConfig.inputFeatures);
    const brain = new NeuralNetwork(
      features.length,
      this.baseConfig.hiddenLayers,
      1,
      undefined,
      features,
      isl.species,
      this.baseConfig.weightPrecision ?? 'FP32',
      isl.morphogenesis
        ? isl.morphogenesis.activeReasoningSteps
        : this.baseConfig.reasoningSteps
    );
    if (isl.morphogenesis) {
      isl.morphogenesis.enforceOnBrain(brain);
    }
    return brain;
  }

  private buildOptimizerContext(isl: IslandState): OptimizerContext {
    return {
      config: this.buildIslandConfig(isl),
      createBrain: () => this.createIslandBrain(isl),
      allTimeBestBrain: isl.allTimeBestBrain,
      plasticityScale: isl.morphogenesis?.plasticityScale,
      activeParamMask: isl.morphogenesis?.activeParamMask,
    };
  }

  private recordTimelineSnapshot(generation: number): void {
    const shares: Record<string, number> = {};
    for (let i = 0; i < this.islands.length; i++) {
      shares[this.islands[i].species] = Number(this.islands[i].sharePct.toFixed(1));
    }
    this.allocationTimeline.push({
      generation,
      shares,
      leaderSpecies: this.winningSpecies,
    });
    if (this.allocationTimeline.length > 40) {
      this.allocationTimeline.shift();
    }
  }

  initPopulation(seedBrain?: NeuralNetwork): IslandMemberSpec[] {
    const out: IslandMemberSpec[] = [];
    for (let idx = 0; idx < this.islands.length; idx++) {
      const isl = this.islands[idx];
      const seedForIsl =
        seedBrain && seedBrain.architecture === isl.species ? seedBrain : undefined;
      const spawned = isl.optimizer.initPopulation(
        this.buildOptimizerContext(isl),
        isl.targetPopCount,
        seedForIsl
      );
      for (let k = 0; k < spawned.length; k++) {
        if (isl.morphogenesis) {
          isl.morphogenesis.enforceOnBrain(spawned[k].brain);
        }
        out.push({
          ...spawned[k],
          species: isl.species,
          islandIndex: idx,
        });
      }
    }
    return out;
  }

  stepAndEvolve(
    generation: number,
    members: IslandEvalMember[],
    env: EnvironmentConfig
  ): {
    nextSpecs: IslandMemberSpec[];
    rebalanceEvent: MorphogenesisEvent | null;
  } {
    const grouped: IslandEvalMember[][] = this.islands.map(() => []);
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const idx =
        m.islandIndex !== undefined &&
        m.islandIndex >= 0 &&
        m.islandIndex < this.islands.length
          ? m.islandIndex
          : 0;
      grouped[idx].push(m);
    }

    let globalLeaderIdx = 0;
    let bestGlobalUtility = -Infinity;

    for (let idx = 0; idx < this.islands.length; idx++) {
      const isl = this.islands[idx];
      const list = grouped[idx];
      const sorted = [...list].sort((a, b) => b.fitness - a.fitness);
      const best = sorted[0];

      let flopsSum = 0;
      let flopsCount = 0;
      for (let j = 0; j < list.length; j++) {
        if (list[j].brain) {
          flopsSum += list[j].brain!.estimateFlopsPerFrame();
          flopsCount += 1;
        }
      }
      if (flopsCount > 0) {
        isl.avgFlopsPerFrame = Number((flopsSum / flopsCount).toFixed(1));
      }

      if (best) {
        isl.bestScore = best.score;
        isl.bestFitness = Number(best.fitness.toFixed(1));
        if (
          best.score > isl.allTimeBestScore ||
          (best.score === isl.allTimeBestScore &&
            best.fitness > isl.allTimeBestFitness)
        ) {
          isl.lastImprovementGen = generation;
        }
        if (best.score > isl.allTimeBestScore) {
          isl.allTimeBestScore = best.score;
        }
        if (best.fitness > isl.allTimeBestFitness) {
          isl.allTimeBestFitness = best.fitness;
        }
        if (best.brain && best.score >= isl.allTimeBestScore) {
          isl.allTimeBestBrain = best.brain.clone();
        }
      }

      const denomKFlops = Math.max(0.5, isl.avgFlopsPerFrame / 100);
      isl.efficiencyScore = Number((isl.bestFitness / denomKFlops).toFixed(2));
      const utility =
        isl.efficiencyScore +
        isl.allTimeBestScore * 0.35 +
        (generation - isl.lastImprovementGen <= 4 ? 1.5 : 0);
      if (utility > bestGlobalUtility) {
        bestGlobalUtility = utility;
        globalLeaderIdx = idx;
      }

      if (isl.morphogenesis && best?.brain) {
        const popBrains: NeuralNetwork[] = [];
        for (let j = 0; j < sorted.length; j++) {
          if (sorted[j].brain) popBrains.push(sorted[j].brain!);
        }
        const outcome = isl.morphogenesis.stepGeneration(
          generation,
          best.fitness,
          best.score,
          best.brain,
          popBrains,
          env,
          1009 + generation * 7919 + idx * 131
        );
        if (outcome.changed) {
          isl.optimizer.onMorphogenesisEvent?.(
            best.brain.toFlatVector(),
            isl.morphogenesis.activeParamMask,
            isl.morphogenesis.plasticityScale
          );
          if (isl.allTimeBestBrain) {
            isl.morphogenesis.enforceOnBrain(isl.allTimeBestBrain);
          }
        }
      }
    }

    this.winningSpecies = this.islands[globalLeaderIdx].species;

    let rebalanceEvent: MorphogenesisEvent | null = null;
    if (generation > 1 && generation % this.rebalanceInterval === 0) {
      this.rebalanceIslands(generation);
      rebalanceEvent = {
        generation,
        kind: 'ISLAND_REBALANCE',
        detail: this.islands
          .map((i) => `${i.species}:${Math.round(i.sharePct)}%`)
          .join(' '),
        saturationPct: 0,
        sparsityPct: 0,
        activeParamsAfter:
          this.islands[globalLeaderIdx].allTimeBestBrain?.getParameterCount() ?? 0,
      };
    }

    const nextSpecs: IslandMemberSpec[] = [];
    for (let idx = 0; idx < this.islands.length; idx++) {
      const isl = this.islands[idx];
      const list = grouped[idx];
      const sorted = [...list].sort((a, b) => b.fitness - a.fitness);
      const ctx = this.buildOptimizerContext(isl);
      const evolved =
        list.length >= 2
          ? isl.optimizer.evolve(ctx, list, sorted, isl.targetPopCount)
          : isl.optimizer.initPopulation(ctx, isl.targetPopCount, isl.allTimeBestBrain ?? undefined);

      for (let k = 0; k < evolved.length; k++) {
        if (isl.morphogenesis) {
          isl.morphogenesis.enforceOnBrain(evolved[k].brain);
        }
        nextSpecs.push({
          ...evolved[k],
          species: isl.species,
          islandIndex: idx,
        });
      }
    }

    return { nextSpecs, rebalanceEvent };
  }

  private rebalanceIslands(generation: number): void {
    const m = this.islands.length;
    const minShareFloor = Math.max(3, Math.min(14, Math.floor(55 / m)));
    const rawUtilities = this.islands.map((isl) => {
      const denomKFlops = Math.max(0.5, isl.avgFlopsPerFrame / 100);
      return (
        isl.bestFitness / denomKFlops +
        isl.allTimeBestScore * 0.4 +
        (generation - isl.lastImprovementGen <= 6 ? 1.8 : 0)
      );
    });
    const maxU = Math.max(...rawUtilities);
    const scale = Math.max(1, maxU * 0.25);
    const exps = rawUtilities.map((u) => Math.exp(Math.max(-6, Math.min(6, (u - maxU) / scale))));
    const expSum = exps.reduce((a, b) => a + b, 0) || 1;

    const freeBudget = Math.max(0, 100 - minShareFloor * m);
    for (let i = 0; i < m; i++) {
      this.islands[i].sharePct = Number(
        (minShareFloor + (exps[i] / expSum) * freeBudget).toFixed(1)
      );
    }

    const newCounts = allocatePopCounts(
      this.islands.map((i) => i.sharePct),
      this.baseConfig.populationSize
    );
    let totalParamsSum = 0;
    for (let i = 0; i < m; i++) {
      this.islands[i].targetPopCount = newCounts[i];
      totalParamsSum += newCounts[i];
    }
    if (totalParamsSum > 0) {
      for (let i = 0; i < m; i++) {
        this.islands[i].sharePct = Number(
          ((this.islands[i].targetPopCount / totalParamsSum) * 100).toFixed(1)
        );
      }
    }
    this.rebalanceCount += 1;
    this.recordTimelineSnapshot(generation);
  }

  getMeanFlopsPerFrame(): number {
    let weightedFlops = 0;
    let totalPop = 0;
    for (let i = 0; i < this.islands.length; i++) {
      weightedFlops += this.islands[i].avgFlopsPerFrame * this.islands[i].targetPopCount;
      totalPop += this.islands[i].targetPopCount;
    }
    return totalPop > 0 ? Number((weightedFlops / totalPop).toFixed(1)) : 0;
  }

  getLeaderSpeciesIndex(): number {
    let bestIdx = 0;
    let bestScore = -1;
    let bestFit = -Infinity;
    for (let i = 0; i < this.islands.length; i++) {
      const isl = this.islands[i];
      if (
        isl.allTimeBestScore > bestScore ||
        (isl.allTimeBestScore === bestScore && isl.allTimeBestFitness > bestFit)
      ) {
        bestScore = isl.allTimeBestScore;
        bestFit = isl.allTimeBestFitness;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  getMorphogenesisSnapshot(): MorphogenesisSnapshot | null {
    const leader = this.islands[this.getLeaderSpeciesIndex()];
    return leader?.morphogenesis ? leader.morphogenesis.getSnapshot() : null;
  }

  getMorphogenesisSummary(): MorphogenesisSummary | null {
    const leader = this.islands[this.getLeaderSpeciesIndex()];
    return leader?.morphogenesis ? leader.morphogenesis.getSummary() : null;
  }

  getActiveReasoningSteps(): number {
    const leader = this.islands[this.getLeaderSpeciesIndex()];
    if (leader?.morphogenesis) return leader.morphogenesis.activeReasoningSteps;
    return this.baseConfig.reasoningSteps ?? 1;
  }

  getSpeciesSnapshots(): IslandSpeciesSnapshot[] {
    return this.islands.map((isl) => ({
      species: isl.species,
      sharePct: isl.sharePct,
      popCount: isl.targetPopCount,
      bestScore: isl.allTimeBestScore,
      bestFitness: isl.allTimeBestFitness,
      avgFlopsPerFrame: isl.avgFlopsPerFrame,
      efficiencyScore: isl.efficiencyScore,
    }));
  }

  getSummary(): IslandSpeciationSummary {
    const leaderIdx = this.getLeaderSpeciesIndex();
    return {
      enabled: true,
      rebalanceCount: this.rebalanceCount,
      winningSpecies: this.islands[leaderIdx]?.species ?? this.winningSpecies,
      finalShares: this.getSpeciesSnapshots(),
      allocationTimeline: this.allocationTimeline.map((row) => ({
        generation: row.generation,
        shares: { ...row.shares },
        leaderSpecies: row.leaderSpecies,
      })),
    };
  }

  getWinningBrain(): NeuralNetwork | null {
    const leader = this.islands[this.getLeaderSpeciesIndex()];
    return leader?.allTimeBestBrain ?? null;
  }
}
