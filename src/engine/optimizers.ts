import { NeuralNetwork, randn } from './neuralNetwork';
import type {
  EvolutionConfig,
  LearningAlgorithm,
  OptimizerParamSupport,
} from './types';

export interface OptimizerMember {
  id: number;
  fitness: number;
  score: number;
  brain: NeuralNetwork | null;
  isChampion: boolean;
  esPairIndex?: number;
  esSign?: 1 | -1 | 0;
}

export interface OptimizerContext {
  config: EvolutionConfig;
  createBrain: () => NeuralNetwork;
  allTimeBestBrain: NeuralNetwork | null;
  plasticityScale?: Float32Array;
  activeParamMask?: Uint8Array;
}

export interface SpawnedMemberSpec {
  brain: NeuralNetwork;
  isChampion: boolean;
  esPairIndex?: number;
  esSign?: 1 | -1 | 0;
}

/**
 * Pluggable strategy contract for all 8 derivative-free neuroevolution optimizers.
 * Each strategy encapsulates its own internal distribution/archive state cleanly.
 */
export interface EvolutionOptimizer {
  readonly algorithm: LearningAlgorithm;
  reset(config: EvolutionConfig): void;
  initPopulation(
    ctx: OptimizerContext,
    popSize: number,
    seedBrain?: NeuralNetwork
  ): SpawnedMemberSpec[];
  evolve(
    ctx: OptimizerContext,
    population: readonly OptimizerMember[],
    sorted: readonly OptimizerMember[],
    nextPopulationSize: number
  ): SpawnedMemberSpec[];
  onMorphogenesisEvent?(
    eliteVec: Float64Array,
    activeMask: Uint8Array,
    plasticityScale: Float32Array
  ): void;
}

class GeneticAlgorithmOptimizer implements EvolutionOptimizer {
  readonly algorithm: LearningAlgorithm = 'GA';

  reset(): void {
    // Stateless elitist tournament GA
  }

  initPopulation(
    ctx: OptimizerContext,
    popSize: number,
    seedBrain?: NeuralNetwork
  ): SpawnedMemberSpec[] {
    const out: SpawnedMemberSpec[] = new Array(popSize);
    if (seedBrain) {
      for (let i = 0; i < popSize; i++) {
        const b = seedBrain.clone();
        if (i > 0) {
          b.mutate(
            Math.max(0.08, ctx.config.mutationRate),
            ctx.config.mutationStrength * 0.7,
            ctx.plasticityScale,
            ctx.activeParamMask
          );
        }
        out[i] = { brain: b, isChampion: i === 0 };
      }
      return out;
    }
    for (let i = 0; i < popSize; i++) {
      out[i] = { brain: ctx.createBrain(), isChampion: false };
    }
    return out;
  }

  evolve(
    ctx: OptimizerContext,
    _population: readonly OptimizerMember[],
    sorted: readonly OptimizerMember[],
    nextPopulationSize: number
  ): SpawnedMemberSpec[] {
    const elites = Math.min(
      ctx.config.elitismCount,
      sorted.length,
      nextPopulationSize
    );
    const out: SpawnedMemberSpec[] = new Array(nextPopulationSize);

    for (let i = 0; i < elites; i++) {
      const eliteBrain = sorted[i].brain
        ? sorted[i].brain!.clone()
        : ctx.createBrain();
      out[i] = { brain: eliteBrain, isChampion: i === 0 };
    }

    const pickParent = (): OptimizerMember => {
      const tournamentSize = Math.min(4, sorted.length);
      let winner = sorted[Math.floor(Math.random() * sorted.length)];
      for (let t = 1; t < tournamentSize; t++) {
        const contender = sorted[Math.floor(Math.random() * sorted.length)];
        if (contender.fitness > winner.fitness) {
          winner = contender;
        }
      }
      return winner;
    };

    for (let i = elites; i < nextPopulationSize; i++) {
      const parentA = pickParent();
      const parentB = pickParent();
      let childBrain: NeuralNetwork;

      if (parentA.brain && parentB.brain && Math.random() < 0.72) {
        childBrain = parentA.brain.crossover(parentB.brain);
      } else if (parentA.brain) {
        childBrain = parentA.brain.clone();
      } else {
        childBrain = ctx.createBrain();
      }

      childBrain.mutate(
        ctx.config.mutationRate,
        ctx.config.mutationStrength,
        ctx.plasticityScale,
        ctx.activeParamMask
      );
      out[i] = { brain: childBrain, isChampion: false };
    }

    return out;
  }
}

class NaturalEsOptimizer implements EvolutionOptimizer {
  readonly algorithm: LearningAlgorithm;
  private readonly useAdam: boolean;
  private centerTheta: Float64Array | null = null;
  private pairEpsilons: Float64Array[] = [];
  private adamM: Float64Array | null = null;
  private adamV: Float64Array | null = null;
  private adamStep = 0;

  constructor(useAdam: boolean) {
    this.useAdam = useAdam;
    this.algorithm = useAdam ? 'ADAM_ES' : 'NATURAL_ES';
  }

  reset(): void {
    this.centerTheta = null;
    this.pairEpsilons = [];
    this.adamM = null;
    this.adamV = null;
    this.adamStep = 0;
  }

  onMorphogenesisEvent(
    eliteVec: Float64Array,
    activeMask: Uint8Array,
    plasticityScale: Float32Array
  ): void {
    if (!this.centerTheta || this.centerTheta.length !== eliteVec.length) {
      this.centerTheta = new Float64Array(eliteVec);
      return;
    }
    for (let j = 0; j < eliteVec.length; j++) {
      if (activeMask[j] === 0) {
        this.centerTheta[j] = 0;
        if (this.adamM) this.adamM[j] = 0;
        if (this.adamV) this.adamV[j] = 0;
      } else if (plasticityScale[j] > 1.0) {
        this.centerTheta[j] = eliteVec[j];
        if (this.adamM) this.adamM[j] = 0;
        if (this.adamV) this.adamV[j] = 0;
      }
    }
  }

  private spawn(
    ctx: OptimizerContext,
    theta: Float64Array,
    popSize: number
  ): SpawnedMemberSpec[] {
    const sigma = Math.max(0.08, ctx.config.mutationStrength);
    const paramLen = theta.length;
    const mask = ctx.activeParamMask;
    const plast = ctx.plasticityScale;
    const pairCount = Math.max(1, Math.floor((popSize - 1) / 2));
    this.pairEpsilons = new Array(pairCount);
    const out: SpawnedMemberSpec[] = [];

    if (mask) {
      for (let j = 0; j < paramLen; j++) {
        if (mask[j] === 0) theta[j] = 0;
      }
    }

    const centerBrain = ctx.createBrain();
    centerBrain.fromFlatVector(theta);
    out.push({ brain: centerBrain, isChampion: true, esSign: 0 });

    const tmpVec = new Float64Array(paramLen);
    for (let p = 0; p < pairCount && out.length < popSize; p++) {
      const eps = new Float64Array(paramLen);
      for (let j = 0; j < paramLen; j++) {
        if (mask && mask[j] === 0) {
          eps[j] = 0;
        } else {
          eps[j] = randn() * (plast ? plast[j] : 1);
        }
      }
      this.pairEpsilons[p] = eps;

      for (let j = 0; j < paramLen; j++) {
        tmpVec[j] = mask && mask[j] === 0 ? 0 : theta[j] + sigma * eps[j];
      }
      const posBrain = ctx.createBrain();
      posBrain.fromFlatVector(tmpVec);
      out.push({
        brain: posBrain,
        isChampion: false,
        esPairIndex: p,
        esSign: 1,
      });

      if (out.length < popSize) {
        for (let j = 0; j < paramLen; j++) {
          tmpVec[j] = mask && mask[j] === 0 ? 0 : theta[j] - sigma * eps[j];
        }
        const negBrain = ctx.createBrain();
        negBrain.fromFlatVector(tmpVec);
        out.push({
          brain: negBrain,
          isChampion: false,
          esPairIndex: p,
          esSign: -1,
        });
      }
    }

    return out;
  }

  initPopulation(
    ctx: OptimizerContext,
    popSize: number,
    seedBrain?: NeuralNetwork
  ): SpawnedMemberSpec[] {
    const vec = (seedBrain ?? ctx.createBrain()).toFlatVector();
    this.centerTheta = new Float64Array(vec);
    this.adamM = new Float64Array(vec.length);
    this.adamV = new Float64Array(vec.length);
    this.adamStep = 0;
    return this.spawn(ctx, this.centerTheta, popSize);
  }

  evolve(
    ctx: OptimizerContext,
    population: readonly OptimizerMember[],
    sorted: readonly OptimizerMember[],
    nextPopulationSize: number
  ): SpawnedMemberSpec[] {
    if (!this.centerTheta) {
      this.centerTheta =
        sorted[0]?.brain?.toFlatVector() ?? ctx.createBrain().toFlatVector();
    }

    const n = sorted.length;
    const rankUtil = new Map<number, number>();
    for (let r = 0; r < n; r++) {
      const util = n > 1 ? 0.5 - r / (n - 1) : 0;
      rankUtil.set(sorted[r].id, util);
    }

    const pairGrads = new Float64Array(this.pairEpsilons.length);
    for (let i = 0; i < population.length; i++) {
      const b = population[i];
      if (b.esPairIndex === undefined || !b.esSign) continue;
      const u = rankUtil.get(b.id) ?? 0;
      pairGrads[b.esPairIndex] += b.esSign * u;
    }

    const theta = this.centerTheta;
    const paramLen = theta.length;
    const pairCount = Math.max(1, this.pairEpsilons.length);
    const sigma = Math.max(0.08, ctx.config.mutationStrength);

    if (this.useAdam) {
      if (!this.adamM || this.adamM.length !== paramLen) {
        this.adamM = new Float64Array(paramLen);
        this.adamV = new Float64Array(paramLen);
        this.adamStep = 0;
      }
      const grad = new Float64Array(paramLen);
      const invScale = 1 / (pairCount * sigma);
      for (let p = 0; p < this.pairEpsilons.length; p++) {
        const g = pairGrads[p];
        if (g === 0) continue;
        const eps = this.pairEpsilons[p];
        const factor = g * invScale;
        for (let j = 0; j < paramLen; j++) {
          grad[j] += factor * eps[j];
        }
      }

      this.adamStep += 1;
      const lr = 0.085;
      const b1 = 0.9;
      const b2 = 0.999;
      const epsAdam = 1e-8;
      const bc1 = 1 - Math.pow(b1, this.adamStep);
      const bc2 = 1 - Math.pow(b2, this.adamStep);
      const m = this.adamM;
      const v = this.adamV!;

      const mask = ctx.activeParamMask;
      const plast = ctx.plasticityScale;
      for (let j = 0; j < paramLen; j++) {
        if (mask && mask[j] === 0) {
          theta[j] = 0;
          continue;
        }
        const gj = grad[j];
        m[j] = b1 * m[j] + (1 - b1) * gj;
        v[j] = b2 * v[j] + (1 - b2) * gj * gj;
        const mHat = m[j] / bc1;
        const vHat = v[j] / bc2;
        const pScale = plast ? plast[j] : 1;
        theta[j] += (lr * pScale * mHat) / (Math.sqrt(vHat) + epsAdam);
      }
    } else {
      const lr = 0.22;
      const scale = lr / (pairCount * sigma);
      const mask = ctx.activeParamMask;
      const plast = ctx.plasticityScale;
      for (let p = 0; p < this.pairEpsilons.length; p++) {
        const g = pairGrads[p];
        if (g === 0) continue;
        const eps = this.pairEpsilons[p];
        const step = scale * g;
        for (let j = 0; j < paramLen; j++) {
          if (mask && mask[j] === 0) continue;
          theta[j] += step * eps[j] * (plast ? plast[j] : 1);
        }
      }
      if (mask) {
        for (let j = 0; j < paramLen; j++) {
          if (mask[j] === 0) theta[j] = 0;
        }
      }
    }

    return this.spawn(ctx, theta, nextPopulationSize);
  }
}

class AdaptiveEsOptimizer implements EvolutionOptimizer {
  readonly algorithm: LearningAlgorithm = 'ADAPTIVE_ES';
  private bestTheta: Float64Array | null = null;
  private bestFitness = -Infinity;
  private sigma = 0.28;

  reset(config: EvolutionConfig): void {
    this.bestTheta = null;
    this.bestFitness = -Infinity;
    this.sigma = config.mutationStrength;
  }

  onMorphogenesisEvent(
    eliteVec: Float64Array,
    activeMask: Uint8Array,
    plasticityScale: Float32Array
  ): void {
    if (!this.bestTheta || this.bestTheta.length !== eliteVec.length) {
      this.bestTheta = new Float64Array(eliteVec);
      return;
    }
    for (let j = 0; j < eliteVec.length; j++) {
      if (activeMask[j] === 0) this.bestTheta[j] = 0;
      else if (plasticityScale[j] > 1.0) this.bestTheta[j] = eliteVec[j];
    }
  }

  private spawn(
    ctx: OptimizerContext,
    theta: Float64Array,
    popSize: number
  ): SpawnedMemberSpec[] {
    const sigma = this.sigma;
    const mutRate = Math.max(0.35, ctx.config.mutationRate);
    const paramLen = theta.length;
    const mask = ctx.activeParamMask;
    const plast = ctx.plasticityScale;
    const out: SpawnedMemberSpec[] = new Array(popSize);
    const tmpVec = new Float64Array(paramLen);

    if (mask) {
      for (let j = 0; j < paramLen; j++) {
        if (mask[j] === 0) theta[j] = 0;
      }
    }

    const parentBrain = ctx.createBrain();
    parentBrain.fromFlatVector(theta);
    out[0] = { brain: parentBrain, isChampion: true };

    for (let i = 1; i < popSize; i++) {
      let mutatedAny = false;
      let firstActive = -1;
      for (let j = 0; j < paramLen; j++) {
        if (mask && mask[j] === 0) {
          tmpVec[j] = 0;
          continue;
        }
        if (firstActive === -1) firstActive = j;
        const pScale = plast ? plast[j] : 1;
        const effRate = Math.min(1, mutRate * Math.max(0.35, pScale));
        if (Math.random() < effRate) {
          tmpVec[j] = theta[j] + randn() * sigma * pScale;
          mutatedAny = true;
        } else {
          tmpVec[j] = theta[j];
        }
      }
      if (!mutatedAny && firstActive >= 0) {
        const pScale = plast ? plast[firstActive] : 1;
        tmpVec[firstActive] = theta[firstActive] + randn() * sigma * pScale;
      }
      const childBrain = ctx.createBrain();
      childBrain.fromFlatVector(tmpVec);
      out[i] = { brain: childBrain, isChampion: false };
    }

    return out;
  }

  initPopulation(
    ctx: OptimizerContext,
    popSize: number,
    seedBrain?: NeuralNetwork
  ): SpawnedMemberSpec[] {
    const vec = (seedBrain ?? ctx.createBrain()).toFlatVector();
    this.bestTheta = new Float64Array(vec);
    this.bestFitness = -Infinity;
    this.sigma = ctx.config.mutationStrength;
    return this.spawn(ctx, this.bestTheta, popSize);
  }

  evolve(
    ctx: OptimizerContext,
    population: readonly OptimizerMember[],
    sorted: readonly OptimizerMember[],
    nextPopulationSize: number
  ): SpawnedMemberSpec[] {
    // Re-baseline stored champion fitness when re-evaluated on a new stochastic pipe seed
    const champFit = population[0]?.fitness;
    if (
      champFit !== undefined &&
      Number.isFinite(champFit) &&
      Number.isFinite(this.bestFitness) &&
      champFit < this.bestFitness
    ) {
      this.bestFitness = this.bestFitness * 0.6 + champFit * 0.4;
    }

    const best = sorted[0];
    if (best && best.brain) {
      if (!this.bestTheta || best.fitness > this.bestFitness) {
        this.bestFitness = best.fitness;
        this.bestTheta = best.brain.toFlatVector();
        this.sigma = Math.min(0.95, this.sigma * 1.15);
      } else {
        this.sigma = Math.max(0.05, this.sigma * 0.86);
      }
    }

    const theta = this.bestTheta ?? ctx.createBrain().toFlatVector();
    this.bestTheta = theta;
    return this.spawn(ctx, theta, nextPopulationSize);
  }
}

class CemOptimizer implements EvolutionOptimizer {
  readonly algorithm: LearningAlgorithm = 'CEM';
  private mu: Float64Array | null = null;
  private std: Float64Array | null = null;

  reset(): void {
    this.mu = null;
    this.std = null;
  }

  onMorphogenesisEvent(
    eliteVec: Float64Array,
    activeMask: Uint8Array,
    plasticityScale: Float32Array
  ): void {
    if (!this.mu || !this.std || this.mu.length !== eliteVec.length) return;
    for (let j = 0; j < eliteVec.length; j++) {
      if (activeMask[j] === 0) {
        this.mu[j] = 0;
        this.std[j] = 0.035;
      } else if (plasticityScale[j] > 1.0) {
        this.mu[j] = eliteVec[j];
        this.std[j] = Math.max(this.std[j], 0.35);
      }
    }
  }

  private spawn(ctx: OptimizerContext, popSize: number): SpawnedMemberSpec[] {
    const mu = this.mu!;
    const std = this.std!;
    const paramLen = mu.length;
    const mask = ctx.activeParamMask;
    const plast = ctx.plasticityScale;
    const out: SpawnedMemberSpec[] = new Array(popSize);
    const tmpVec = new Float64Array(paramLen);

    if (mask) {
      for (let j = 0; j < paramLen; j++) {
        if (mask[j] === 0) mu[j] = 0;
      }
    }

    const meanBrain = ctx.createBrain();
    meanBrain.fromFlatVector(mu);
    out[0] = { brain: meanBrain, isChampion: true };

    for (let i = 1; i < popSize; i++) {
      for (let j = 0; j < paramLen; j++) {
        if (mask && mask[j] === 0) {
          tmpVec[j] = 0;
        } else {
          tmpVec[j] = mu[j] + randn() * std[j] * (plast ? plast[j] : 1);
        }
      }
      const childBrain = ctx.createBrain();
      childBrain.fromFlatVector(tmpVec);
      out[i] = { brain: childBrain, isChampion: false };
    }
    return out;
  }

  initPopulation(
    ctx: OptimizerContext,
    popSize: number,
    seedBrain?: NeuralNetwork
  ): SpawnedMemberSpec[] {
    const vec = (seedBrain ?? ctx.createBrain()).toFlatVector();
    this.mu = new Float64Array(vec);
    const initStd = seedBrain
      ? Math.max(0.18, ctx.config.mutationStrength)
      : Math.max(0.25, ctx.config.mutationStrength * 1.25);
    this.std = new Float64Array(vec.length).fill(initStd);
    return this.spawn(ctx, popSize);
  }

  evolve(
    ctx: OptimizerContext,
    _population: readonly OptimizerMember[],
    sorted: readonly OptimizerMember[],
    nextPopulationSize: number
  ): SpawnedMemberSpec[] {
    const template = ctx.createBrain();
    const paramLen = template.getParameterCount();
    if (!this.mu || this.mu.length !== paramLen) {
      this.mu = template.toFlatVector();
      this.std = new Float64Array(paramLen).fill(
        Math.max(0.25, ctx.config.mutationStrength * 1.25)
      );
    }

    const eliteCount = Math.max(3, Math.floor(sorted.length * 0.2));
    const eliteVecs: Float64Array[] = [];
    for (let i = 0; i < eliteCount && i < sorted.length; i++) {
      if (sorted[i].brain) {
        eliteVecs.push(sorted[i].brain!.toFlatVector());
      }
    }

    if (eliteVecs.length > 0) {
      const nextMu = new Float64Array(paramLen);
      for (let k = 0; k < eliteVecs.length; k++) {
        const v = eliteVecs[k];
        for (let j = 0; j < paramLen; j++) {
          nextMu[j] += v[j];
        }
      }
      const invK = 1 / eliteVecs.length;
      for (let j = 0; j < paramLen; j++) {
        nextMu[j] *= invK;
      }

      const nextVar = new Float64Array(paramLen);
      for (let k = 0; k < eliteVecs.length; k++) {
        const v = eliteVecs[k];
        for (let j = 0; j < paramLen; j++) {
          const diff = v[j] - nextMu[j];
          nextVar[j] += diff * diff;
        }
      }

      const alpha = 0.72;
      const minStd = 0.035;
      const maxStd = 1.25;
      for (let j = 0; j < paramLen; j++) {
        this.mu[j] = alpha * nextMu[j] + (1 - alpha) * this.mu[j];
        const empStd = Math.sqrt(nextVar[j] * invK + 1e-4);
        const blendedStd = alpha * empStd + (1 - alpha) * this.std![j];
        this.std![j] = Math.max(minStd, Math.min(maxStd, blendedStd));
      }
    }

    return this.spawn(ctx, nextPopulationSize);
  }
}

class DifferentialEvolutionOptimizer implements EvolutionOptimizer {
  readonly algorithm: LearningAlgorithm = 'DE';
  private parents: Float64Array[] = [];
  private parentFitness: Float64Array = new Float64Array(0);
  private trialPhase = false;

  reset(): void {
    this.parents = [];
    this.parentFitness = new Float64Array(0);
    this.trialPhase = false;
  }

  onMorphogenesisEvent(
    eliteVec: Float64Array,
    activeMask: Uint8Array,
    plasticityScale: Float32Array
  ): void {
    for (let i = 0; i < this.parents.length; i++) {
      const p = this.parents[i];
      if (!p || p.length !== eliteVec.length) continue;
      for (let j = 0; j < eliteVec.length; j++) {
        if (activeMask[j] === 0) p[j] = 0;
        else if (plasticityScale[j] > 1.0) p[j] = eliteVec[j];
      }
    }
  }

  initPopulation(
    ctx: OptimizerContext,
    popSize: number,
    seedBrain?: NeuralNetwork
  ): SpawnedMemberSpec[] {
    this.parents = new Array(popSize);
    this.parentFitness = new Float64Array(popSize).fill(-Infinity);
    this.trialPhase = false;
    const out: SpawnedMemberSpec[] = new Array(popSize);

    for (let i = 0; i < popSize; i++) {
      const b = seedBrain
        ? (() => {
            const c = seedBrain.clone();
            if (i > 0) {
              c.mutate(
                0.3,
                ctx.config.mutationStrength,
                ctx.plasticityScale,
                ctx.activeParamMask
              );
            }
            return c;
          })()
        : ctx.createBrain();
      this.parents[i] = b.toFlatVector();
      out[i] = { brain: b, isChampion: i === 0 };
    }
    return out;
  }

  evolve(
    ctx: OptimizerContext,
    population: readonly OptimizerMember[],
    _sorted: readonly OptimizerMember[],
    nextPopulationSize: number
  ): SpawnedMemberSpec[] {
    const count = population.length;
    if (this.parents.length !== count) {
      this.parents = new Array(count);
      this.parentFitness = new Float64Array(count).fill(-Infinity);
      this.trialPhase = false;
    }

    if (!this.trialPhase) {
      for (let i = 0; i < count; i++) {
        const b = population[i];
        if (b.brain) {
          this.parents[i] = b.brain.toFlatVector();
          this.parentFitness[i] = b.fitness;
        }
      }
      this.trialPhase = true;
    } else {
      for (let i = 0; i < count; i++) {
        const b = population[i];
        if (b.brain && b.fitness >= this.parentFitness[i]) {
          this.parents[i] = b.brain.toFlatVector();
          this.parentFitness[i] = b.fitness;
        }
      }
    }

    let bestIdx = 0;
    for (let i = 1; i < count; i++) {
      if (this.parentFitness[i] > this.parentFitness[bestIdx]) {
        bestIdx = i;
      }
    }
    const bestVec = this.parents[bestIdx];
    const paramLen = bestVec.length;
    const fFactor = 0.45 + ctx.config.mutationStrength * 0.7;
    const cr = Math.max(
      0.35,
      Math.min(0.95, 1 - ctx.config.mutationRate * 0.8)
    );

    const out: SpawnedMemberSpec[] = new Array(nextPopulationSize);
    const trialVec = new Float64Array(paramLen);

    const bestBrain = ctx.createBrain();
    bestBrain.fromFlatVector(bestVec);
    out[0] = { brain: bestBrain, isChampion: true };

    for (let i = 1; i < nextPopulationSize; i++) {
      const targetIdx = i % count;
      const target = this.parents[targetIdx];
      let r1 = Math.floor(Math.random() * count);
      let r2 = Math.floor(Math.random() * count);
      if (count > 2) {
        while (r1 === targetIdx) r1 = Math.floor(Math.random() * count);
        while (r2 === targetIdx || r2 === r1)
          r2 = Math.floor(Math.random() * count);
      }
      const v1 = this.parents[r1];
      const v2 = this.parents[r2];
      const jRand = Math.floor(Math.random() * Math.max(1, paramLen));

      const mask = ctx.activeParamMask;
      const plast = ctx.plasticityScale;
      for (let j = 0; j < paramLen; j++) {
        if (mask && mask[j] === 0) {
          trialVec[j] = 0;
          continue;
        }
        const pScale = plast ? plast[j] : 1;
        if (j === jRand || Math.random() < cr) {
          const diff = v1[j] - v2[j];
          // Inject small exploration kick for newborn Zero-Init synapses where population diff is initially 0
          const newbornKick =
            pScale > 1.0 && Math.abs(diff) < 1e-6
              ? randn() * Math.max(0.08, ctx.config.mutationStrength * 0.5)
              : 0;
          trialVec[j] = bestVec[j] + fFactor * pScale * diff + newbornKick;
        } else {
          trialVec[j] = target[j];
        }
      }

      const childBrain = ctx.createBrain();
      childBrain.fromFlatVector(trialVec);
      out[i] = { brain: childBrain, isChampion: false };
    }

    if (nextPopulationSize !== count) {
      this.parents = out.map((spec) => spec.brain.toFlatVector());
      const nextFit = new Float64Array(nextPopulationSize).fill(-Infinity);
      nextFit[0] = this.parentFitness[bestIdx];
      this.parentFitness = nextFit;
    }

    return out;
  }
}

class PsoOptimizer implements EvolutionOptimizer {
  readonly algorithm: LearningAlgorithm = 'PSO';
  private positions: Float64Array[] = [];
  private velocities: Float64Array[] = [];
  private pBestPos: Float64Array[] = [];
  private pBestFit: Float64Array = new Float64Array(0);
  private gBestPos: Float64Array | null = null;
  private gBestFit = -Infinity;

  reset(): void {
    this.positions = [];
    this.velocities = [];
    this.pBestPos = [];
    this.pBestFit = new Float64Array(0);
    this.gBestPos = null;
    this.gBestFit = -Infinity;
  }

  onMorphogenesisEvent(
    eliteVec: Float64Array,
    activeMask: Uint8Array,
    plasticityScale: Float32Array
  ): void {
    const syncVec = (v: Float64Array | null) => {
      if (!v || v.length !== eliteVec.length) return;
      for (let j = 0; j < eliteVec.length; j++) {
        if (activeMask[j] === 0) v[j] = 0;
        else if (plasticityScale[j] > 1.0) v[j] = eliteVec[j];
      }
    };
    syncVec(this.gBestPos);
    for (let i = 0; i < this.positions.length; i++) {
      syncVec(this.positions[i]);
      syncVec(this.pBestPos[i]);
      const vel = this.velocities[i];
      if (vel && vel.length === eliteVec.length) {
        for (let j = 0; j < eliteVec.length; j++) {
          if (activeMask[j] === 0) vel[j] = 0;
        }
      }
    }
  }

  initPopulation(
    ctx: OptimizerContext,
    popSize: number,
    seedBrain?: NeuralNetwork
  ): SpawnedMemberSpec[] {
    const template = seedBrain ?? ctx.createBrain();
    const paramLen = template.getParameterCount();
    const mask = ctx.activeParamMask;
    const plast = ctx.plasticityScale;
    this.positions = new Array(popSize);
    this.velocities = new Array(popSize);
    this.pBestPos = new Array(popSize);
    this.pBestFit = new Float64Array(popSize).fill(-Infinity);
    this.gBestPos = seedBrain ? new Float64Array(seedBrain.toFlatVector()) : null;
    this.gBestFit = -Infinity;
    const out: SpawnedMemberSpec[] = new Array(popSize);

    for (let i = 0; i < popSize; i++) {
      const b = seedBrain
        ? (() => {
            const c = seedBrain.clone();
            if (i > 0) {
              c.mutate(
                0.4,
                ctx.config.mutationStrength * 1.2,
                plast,
                mask
              );
            }
            return c;
          })()
        : ctx.createBrain();
      const pos = b.toFlatVector();
      const vel = new Float64Array(paramLen);
      for (let j = 0; j < paramLen; j++) {
        if (mask && mask[j] === 0) {
          pos[j] = 0;
          vel[j] = 0;
        } else {
          vel[j] = randn() * ctx.config.mutationStrength * 0.4 * (plast ? plast[j] : 1);
        }
      }
      this.positions[i] = pos;
      this.velocities[i] = vel;
      this.pBestPos[i] = new Float64Array(pos);
      out[i] = { brain: b, isChampion: i === 0 };
    }
    return out;
  }

  evolve(
    ctx: OptimizerContext,
    population: readonly OptimizerMember[],
    _sorted: readonly OptimizerMember[],
    nextPopulationSize: number
  ): SpawnedMemberSpec[] {
    const count = population.length;
    if (this.positions.length !== count) {
      return this.initPopulation(
        ctx,
        nextPopulationSize,
        ctx.allTimeBestBrain ?? undefined
      );
    }

    // Re-baseline gBestFit when out[0] (gBestPos) underperforms on the new stochastic pipe seed
    const champFit = population[0]?.fitness;
    if (
      champFit !== undefined &&
      Number.isFinite(champFit) &&
      Number.isFinite(this.gBestFit) &&
      champFit < this.gBestFit
    ) {
      this.gBestFit = this.gBestFit * 0.6 + champFit * 0.4;
    }

    for (let i = 0; i < count; i++) {
      const b = population[i];
      if (!b.brain) continue;
      if (b.fitness >= this.pBestFit[i]) {
        this.pBestFit[i] = b.fitness;
        this.pBestPos[i] = b.brain.toFlatVector();
      } else if (Number.isFinite(this.pBestFit[i])) {
        this.pBestFit[i] = this.pBestFit[i] * 0.92 + b.fitness * 0.08;
      }
      if (b.fitness >= this.gBestFit) {
        this.gBestFit = b.fitness;
        this.gBestPos = b.brain.toFlatVector();
      }
    }

    const gBest = this.gBestPos ?? this.pBestPos[0];
    const paramLen = gBest.length;
    const inertia = 0.65;
    const c1 = 1.4;
    const c2 = 1.6;
    const jitter = Math.max(0.02, ctx.config.mutationStrength * 0.25);

    const out: SpawnedMemberSpec[] = new Array(nextPopulationSize);

    const gBrain = ctx.createBrain();
    gBrain.fromFlatVector(gBest);
    out[0] = { brain: gBrain, isChampion: true };
    if (this.positions[0]) {
      this.positions[0].set(gBest);
    }

    for (let i = 1; i < nextPopulationSize; i++) {
      const idx = i % count;
      const pos =
        i < count
          ? this.positions[idx]
          : new Float64Array(this.positions[idx]);
      const vel =
        i < count
          ? this.velocities[idx]
          : new Float64Array(this.velocities[idx]);
      const pBest = this.pBestPos[idx];

      const mask = ctx.activeParamMask;
      const plast = ctx.plasticityScale;
      for (let j = 0; j < paramLen; j++) {
        if (mask && mask[j] === 0) {
          vel[j] = 0;
          pos[j] = 0;
          continue;
        }
        const pScale = plast ? plast[j] : 1;
        const r1 = Math.random();
        const r2 = Math.random();
        let vNext =
          inertia * vel[j] +
          c1 * r1 * (pBest[j] - pos[j]) +
          c2 * r2 * (gBest[j] - pos[j]) +
          randn() * jitter * pScale;
        vNext *= pScale;
        if (vNext > 1.2) vNext = 1.2;
        else if (vNext < -1.2) vNext = -1.2;
        vel[j] = vNext;
        pos[j] += vNext;
      }

      if (i >= count) {
        this.positions[i] = pos;
        this.velocities[i] = vel;
        this.pBestPos[i] = new Float64Array(pos);
        const expandedFit = new Float64Array(nextPopulationSize).fill(-Infinity);
        expandedFit.set(this.pBestFit);
        this.pBestFit = expandedFit;
      }

      const b = ctx.createBrain();
      b.fromFlatVector(pos);
      out[i] = { brain: b, isChampion: false };
    }

    return out;
  }
}

class CmaHybridOptimizer implements EvolutionOptimizer {
  readonly algorithm: LearningAlgorithm = 'CMA_HYBRID';
  private mean: Float64Array | null = null;
  private diagD: Float64Array | null = null;
  private pc: Float64Array | null = null;
  private ps: Float64Array | null = null;
  private sigma = 0.35;
  private bestVec: Float64Array | null = null;
  private bestFit = -Infinity;
  private archive: Float64Array[] = [];
  private genCount = 0;

  reset(config: EvolutionConfig): void {
    this.mean = null;
    this.diagD = null;
    this.pc = null;
    this.ps = null;
    this.sigma = Math.max(0.22, config.mutationStrength * 1.15);
    this.bestVec = null;
    this.bestFit = -Infinity;
    this.archive = [];
    this.genCount = 0;
  }

  private initState(seedVec: Float64Array, mutationStrength: number): void {
    const dim = seedVec.length;
    this.mean = new Float64Array(seedVec);
    this.diagD = new Float64Array(dim).fill(1);
    this.pc = new Float64Array(dim);
    this.ps = new Float64Array(dim);
    this.sigma = Math.max(0.24, mutationStrength * 1.2);
    this.bestVec = new Float64Array(seedVec);
    this.bestFit = -Infinity;
    this.archive = [new Float64Array(seedVec)];
    this.genCount = 0;
  }

  onMorphogenesisEvent(
    eliteVec: Float64Array,
    activeMask: Uint8Array,
    plasticityScale: Float32Array
  ): void {
    const dim = eliteVec.length;
    if (!this.mean || this.mean.length !== dim) return;
    for (let j = 0; j < dim; j++) {
      if (activeMask[j] === 0) {
        this.mean[j] = 0;
        if (this.bestVec) this.bestVec[j] = 0;
        if (this.pc) this.pc[j] = 0;
        if (this.ps) this.ps[j] = 0;
        if (this.diagD) this.diagD[j] = 0.2;
      } else if (plasticityScale[j] > 1.0) {
        this.mean[j] = eliteVec[j];
        if (this.bestVec) this.bestVec[j] = eliteVec[j];
        if (this.pc) this.pc[j] = 0;
        if (this.ps) this.ps[j] = 0;
        if (this.diagD) this.diagD[j] = Math.max(this.diagD[j], 1.1);
      }
    }
    for (let a = 0; a < this.archive.length; a++) {
      const av = this.archive[a];
      if (av.length !== dim) continue;
      for (let j = 0; j < dim; j++) {
        if (activeMask[j] === 0) av[j] = 0;
        else if (plasticityScale[j] > 1.0) av[j] = eliteVec[j];
      }
    }
  }

  private spawn(ctx: OptimizerContext, popSize: number): SpawnedMemberSpec[] {
    const mean = this.mean!;
    const diagD = this.diagD!;
    const sigma = this.sigma;
    const dim = mean.length;
    const mask = ctx.activeParamMask;
    const plast = ctx.plasticityScale;
    const out: SpawnedMemberSpec[] = [];
    const tmp = new Float64Array(dim);

    if (mask) {
      for (let j = 0; j < dim; j++) {
        if (mask[j] === 0) {
          mean[j] = 0;
          if (this.bestVec) this.bestVec[j] = 0;
        }
      }
    }

    const bestAnchor = this.bestVec ?? mean;
    const champBrain = ctx.createBrain();
    champBrain.fromFlatVector(bestAnchor);
    out.push({ brain: champBrain, isChampion: true });

    if (out.length < popSize) {
      const meanBrain = ctx.createBrain();
      meanBrain.fromFlatVector(mean);
      out.push({ brain: meanBrain, isChampion: false });
    }

    const polishCount = Math.min(
      Math.max(2, Math.floor(popSize * 0.2)),
      Math.max(0, popSize - out.length)
    );
    const localScale = Math.max(0.03, sigma * 0.35);
    for (let k = 0; k < polishCount && out.length < popSize; k++) {
      if (this.archive.length >= 3 && k % 2 === 0) {
        const aIdx = Math.floor(Math.random() * this.archive.length);
        let bIdx = Math.floor(Math.random() * this.archive.length);
        if (bIdx === aIdx) bIdx = (aIdx + 1) % this.archive.length;
        const va = this.archive[aIdx];
        const vb = this.archive[bIdx];
        const fStep = 0.35 + Math.random() * 0.4;
        for (let j = 0; j < dim; j++) {
          if (mask && mask[j] === 0) {
            tmp[j] = 0;
          } else {
            const pScale = plast ? plast[j] : 1;
            tmp[j] =
              bestAnchor[j] +
              fStep * pScale * (va[j] - vb[j]) +
              randn() * localScale * diagD[j] * 0.35 * pScale;
          }
        }
      } else {
        const sparseProb = Math.min(1, Math.max(0.25, 4 / Math.max(1, dim)));
        for (let j = 0; j < dim; j++) {
          if (mask && mask[j] === 0) {
            tmp[j] = 0;
          } else {
            const pScale = plast ? plast[j] : 1;
            tmp[j] =
              Math.random() < Math.min(1, sparseProb * Math.max(0.4, pScale))
                ? bestAnchor[j] + randn() * localScale * diagD[j] * pScale
                : bestAnchor[j];
          }
        }
      }
      const b = ctx.createBrain();
      b.fromFlatVector(tmp);
      out.push({ brain: b, isChampion: false });
    }

    while (out.length < popSize) {
      const z = new Float64Array(dim);
      for (let j = 0; j < dim; j++) {
        z[j] = mask && mask[j] === 0 ? 0 : randn() * (plast ? plast[j] : 1);
      }

      for (let j = 0; j < dim; j++) {
        tmp[j] = mask && mask[j] === 0 ? 0 : mean[j] + sigma * diagD[j] * z[j];
      }
      const posBrain = ctx.createBrain();
      posBrain.fromFlatVector(tmp);
      out.push({ brain: posBrain, isChampion: false });

      if (out.length < popSize) {
        for (let j = 0; j < dim; j++) {
          tmp[j] = mask && mask[j] === 0 ? 0 : mean[j] - sigma * diagD[j] * z[j];
        }
        const negBrain = ctx.createBrain();
        negBrain.fromFlatVector(tmp);
        out.push({ brain: negBrain, isChampion: false });
      }
    }

    return out;
  }

  initPopulation(
    ctx: OptimizerContext,
    popSize: number,
    seedBrain?: NeuralNetwork
  ): SpawnedMemberSpec[] {
    const vec = (seedBrain ?? ctx.createBrain()).toFlatVector();
    this.initState(vec, ctx.config.mutationStrength);
    return this.spawn(ctx, popSize);
  }

  evolve(
    ctx: OptimizerContext,
    population: readonly OptimizerMember[],
    sorted: readonly OptimizerMember[],
    nextPopulationSize: number
  ): SpawnedMemberSpec[] {
    const template = ctx.createBrain();
    const dim = template.getParameterCount();

    if (
      !this.mean ||
      !this.diagD ||
      !this.pc ||
      !this.ps ||
      this.mean.length !== dim
    ) {
      const seed = sorted[0]?.brain?.toFlatVector() ?? template.toFlatVector();
      this.initState(seed, ctx.config.mutationStrength);
    }

    const mean = this.mean!;
    const diagD = this.diagD!;
    const pc = this.pc!;
    const ps = this.ps!;

    // Re-baseline stored champion fitness when population[0] (exact evaluation of this.bestVec) scores lower on the new seed
    const champFit = population[0]?.fitness;
    if (
      champFit !== undefined &&
      Number.isFinite(champFit) &&
      Number.isFinite(this.bestFit) &&
      champFit < this.bestFit
    ) {
      this.bestFit = this.bestFit * 0.6 + champFit * 0.4;
    }

    if (sorted[0]?.brain) {
      const topVec = sorted[0].brain.toFlatVector();
      if (sorted[0].fitness >= this.bestFit || !this.bestVec) {
        this.bestFit = sorted[0].fitness;
        this.bestVec = new Float64Array(topVec);
      }
      this.archive.push(topVec);
      if (this.archive.length > 14) {
        this.archive.shift();
      }
    }

    const mu = Math.max(
      3,
      Math.min(sorted.length, Math.floor(sorted.length * 0.25))
    );
    const rawWeights = new Float64Array(mu);
    let wSum = 0;
    for (let i = 0; i < mu; i++) {
      rawWeights[i] = Math.log(mu + 0.5) - Math.log(i + 1);
      wSum += rawWeights[i];
    }
    let wSqSum = 0;
    for (let i = 0; i < mu; i++) {
      rawWeights[i] /= wSum;
      wSqSum += rawWeights[i] * rawWeights[i];
    }
    const muEff = 1 / Math.max(1e-8, wSqSum);

    const eliteVecs: Float64Array[] = [];
    for (let i = 0; i < mu; i++) {
      if (sorted[i]?.brain) {
        eliteVecs.push(sorted[i].brain!.toFlatVector());
      }
    }

    if (eliteVecs.length > 0) {
      this.genCount += 1;
      const oldMean = new Float64Array(mean);
      const nextMean = new Float64Array(dim);
      for (let i = 0; i < eliteVecs.length; i++) {
        const w = rawWeights[i];
        const v = eliteVecs[i];
        for (let j = 0; j < dim; j++) {
          nextMean[j] += w * v[j];
        }
      }

      const sigma = Math.max(0.02, this.sigma);
      const invSigma = 1 / sigma;
      const cs = (muEff + 2) / (dim + muEff + 5);
      const cc = (4 + muEff / dim) / (dim + 4 + (2 * muEff) / dim);
      const c1 = Math.min(0.45, 2 / ((dim + 1.3) * (dim + 1.3) + muEff));
      const cmu = Math.min(
        1 - c1,
        (2 * (muEff - 2 + 1 / muEff)) / ((dim + 2) * (dim + 2) + muEff)
      );
      const damp =
        1 + 2 * Math.max(0, Math.sqrt((muEff - 1) / (dim + 1)) - 1) + cs;
      const chiN =
        Math.sqrt(dim) * (1 - 1 / (4 * dim) + 1 / (21 * dim * dim));

      const sqrtCs = Math.sqrt(cs * (2 - cs) * muEff);
      const sqrtCc = Math.sqrt(cc * (2 - cc) * muEff);

      let psNormSq = 0;
      for (let j = 0; j < dim; j++) {
        const yj = (nextMean[j] - oldMean[j]) * invSigma;
        const dj = Math.max(0.05, diagD[j]);
        ps[j] = (1 - cs) * ps[j] + sqrtCs * (yj / dj);
        psNormSq += ps[j] * ps[j];
        pc[j] = (1 - cc) * pc[j] + sqrtCc * yj;
      }

      const scaleAdapt = Math.min(1, (dim + 2) / 3);
      const c1Sep = Math.min(0.45, c1 * scaleAdapt);
      const cmuSep = Math.min(0.75 - c1Sep, cmu * scaleAdapt);

      for (let j = 0; j < dim; j++) {
        let rankMuTerm = 0;
        for (let i = 0; i < eliteVecs.length; i++) {
          const diff = (eliteVecs[i][j] - oldMean[j]) * invSigma;
          rankMuTerm += rawWeights[i] * diff * diff;
        }
        const prevVar = diagD[j] * diagD[j];
        const nextVar =
          (1 - c1Sep - cmuSep) * prevVar +
          c1Sep * pc[j] * pc[j] +
          cmuSep * rankMuTerm;
        diagD[j] = Math.sqrt(Math.max(0.04, Math.min(9.0, nextVar)));
      }

      const psNorm = Math.sqrt(psNormSq);
      const sigmaFactor = Math.exp(
        Math.max(-0.45, Math.min(0.45, (cs / damp) * (psNorm / chiN - 1)))
      );
      this.sigma = Math.max(0.04, Math.min(1.4, sigma * sigmaFactor));

      const anchorBlend = this.genCount % 6 === 0 && this.bestVec ? 0.12 : 0;
      for (let j = 0; j < dim; j++) {
        mean[j] =
          anchorBlend > 0 && this.bestVec
            ? (1 - anchorBlend) * nextMean[j] + anchorBlend * this.bestVec[j]
            : nextMean[j];
      }
    }

    return this.spawn(ctx, nextPopulationSize);
  }
}

export const ALL_OPTIMIZER_ALGORITHMS: readonly LearningAlgorithm[] = [
  'GA',
  'NATURAL_ES',
  'ADAM_ES',
  'ADAPTIVE_ES',
  'CEM',
  'DE',
  'PSO',
  'CMA_HYBRID',
];

export const CORE_OPTIMIZER_ALGORITHMS: readonly LearningAlgorithm[] = [
  'CMA_HYBRID',
  'DE',
  'GA',
];

export const EXTENDED_OPTIMIZER_ALGORITHMS: readonly LearningAlgorithm[] = [
  'PSO',
  'CEM',
  'ADAM_ES',
  'NATURAL_ES',
  'ADAPTIVE_ES',
];

export const OPTIMIZER_ROLE_BADGES: Record<
  LearningAlgorithm,
  { tier: 'CORE' | 'EXTENDED'; badge: string; shortNote: string }
> = {
  CMA_HYBRID: {
    tier: 'CORE',
    badge: 'Fastest ≤100p',
    shortNote: '11.1 norm-ms record · Rank-μ covariance adaptation',
  },
  DE: {
    tier: 'CORE',
    badge: 'Sweet-Spot',
    shortNote: 'Best Pop 150 / F=0.35 stability · Differential vector steps',
  },
  GA: {
    tier: 'CORE',
    badge: '100% Solved',
    shortNote: 'Zero-drop crossover · Ideal for MoE & Discrete Quantization',
  },
  PSO: {
    tier: 'EXTENDED',
    badge: 'Swarm Vel',
    shortNote: 'Continuous velocity swarm with non-stationary pBest decay',
  },
  CEM: {
    tier: 'EXTENDED',
    badge: 'Diag Gauss',
    shortNote: 'Cross-Entropy elite diagonal Gaussian refitting',
  },
  ADAM_ES: {
    tier: 'EXTENDED',
    badge: 'Momentum ES',
    shortNote: 'Antithetic OpenAI-ES with Adam first/second moment steps',
  },
  NATURAL_ES: {
    tier: 'EXTENDED',
    badge: 'Vanilla ES',
    shortNote: 'Antithetic finite-difference natural gradient estimator',
  },
  ADAPTIVE_ES: {
    tier: 'EXTENDED',
    badge: '1/5th Rule',
    shortNote: 'Rechenberg step-size adaptation with EMA baseline',
  },
};

export const OPTIMIZER_REGISTRY: Record<
  LearningAlgorithm,
  () => EvolutionOptimizer
> = {
  GA: () => new GeneticAlgorithmOptimizer(),
  NATURAL_ES: () => new NaturalEsOptimizer(false),
  ADAM_ES: () => new NaturalEsOptimizer(true),
  ADAPTIVE_ES: () => new AdaptiveEsOptimizer(),
  CEM: () => new CemOptimizer(),
  DE: () => new DifferentialEvolutionOptimizer(),
  PSO: () => new PsoOptimizer(),
  CMA_HYBRID: () => new CmaHybridOptimizer(),
};

export const OPTIMIZER_PARAM_SUPPORT: Record<
  LearningAlgorithm,
  OptimizerParamSupport
> = {
  GA: {
    usesMutationRate: true,
    usesMutationStrength: true,
    mutationRateLabel: 'Mut Prob',
    mutationStrengthLabel: 'Sigma / Step',
  },
  DE: {
    usesMutationRate: true,
    usesMutationStrength: true,
    mutationRateLabel: 'Mut Prob (CR)',
    mutationStrengthLabel: 'Scale F',
  },
  ADAPTIVE_ES: {
    usesMutationRate: true,
    usesMutationStrength: true,
    mutationRateLabel: 'Mut Prob',
    mutationStrengthLabel: 'Init Sigma',
  },
  NATURAL_ES: {
    usesMutationRate: false,
    usesMutationStrength: true,
    mutationRateLabel: 'Mut Prob',
    mutationStrengthLabel: 'ES Sigma',
    rateDisabledReason: 'Natural ES perturbs all weights antithetically',
  },
  ADAM_ES: {
    usesMutationRate: false,
    usesMutationStrength: true,
    mutationRateLabel: 'Mut Prob',
    mutationStrengthLabel: 'ES Sigma',
    rateDisabledReason: 'Adam-ES perturbs all weights antithetically',
  },
  CEM: {
    usesMutationRate: false,
    usesMutationStrength: true,
    mutationRateLabel: 'Mut Prob',
    mutationStrengthLabel: 'Init Std',
    rateDisabledReason: 'CEM samples all weights from Gaussian σ',
  },
  PSO: {
    usesMutationRate: false,
    usesMutationStrength: true,
    mutationRateLabel: 'Mut Prob',
    mutationStrengthLabel: 'Jitter / Vel',
    rateDisabledReason: 'PSO updates velocity continuously across all weights',
  },
  CMA_HYBRID: {
    usesMutationRate: false,
    usesMutationStrength: true,
    mutationRateLabel: 'Mut Prob',
    mutationStrengthLabel: 'Init Sigma',
    rateDisabledReason: 'Neuro-CMA adapts covariance step size automatically',
  },
};

export function createOptimizer(algorithm: LearningAlgorithm): EvolutionOptimizer {
  const factory = OPTIMIZER_REGISTRY[algorithm] ?? OPTIMIZER_REGISTRY.GA;
  return factory();
}
