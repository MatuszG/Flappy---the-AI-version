/**
 * Vectorized Float32 Structure-of-Arrays (SoA) CPU Population Batch Kernel
 * & Precomputed Shared Pipe Trajectory Evaluator.
 *
 * Eliminates per-bird object pointer chasing, polymorphic JS dispatch, and
 * Float64 cache bloat during CPU training rollouts while keeping official
 * Mastery Audits on bit-exact Float64.
 */

import { NeuralNetwork } from './neuralNetwork';
import {
  BIRD_X,
  CANVAS_WIDTH,
  createSeededRng,
  FLOOR_HIT_R,
  GRAVITY,
  JUMP_IMPULSE,
  MAX_PIPE_VY_NORM,
  MAX_VY,
  PIPE_HIT_R,
  PIPE_HIT_R2,
  PIPE_WIDTH,
  PLAYABLE_HEIGHT,
  resolveEnvironment,
} from './physics';
import { ALL_SENSOR_FEATURES, getInputFeatureIndices, isFullSensorSet } from './sensors';
import type {
  DifficultyPreset,
  EnvironmentConfig,
  NetworkArchitecture,
} from './types';

function fastTanhF32(x: number): number {
  if (x >= 3.8) return 1;
  if (x <= -3.8) return -1;
  const x2 = x * x;
  const v = (x * (945 + x2 * (105 + x2))) / (945 + x2 * (420 + 15 * x2));
  return v > 1 ? 1 : v < -1 ? -1 : v;
}

function fastSigmoidF32(x: number): number {
  return 0.5 + 0.5 * fastTanhF32(0.5 * x);
}

/**
 * Packed Float32 SoA population state for high-throughput CPU training ticks.
 * Supports Depth 0, Depth 1, and Depth 2 across all 9 architectures.
 */
export class PopulationBatchKernel {
  readonly count: number;
  readonly arch: NetworkArchitecture;
  readonly inCount: number;
  readonly depth: number;
  readonly h1: number;
  readonly h2: number;
  readonly lastH: number;
  readonly reasoningSteps: number;

  // Bird kinematics (SoA)
  readonly y: Float32Array;
  readonly vy: Float32Array;
  readonly fitness: Float32Array;
  readonly score: Int32Array;
  readonly lastPassedPipeId: Int32Array;
  readonly alive: Uint8Array;
  readonly hitFloorOrCeiling: Uint8Array;
  readonly aliveList: Int32Array;
  aliveCount: number;

  // Packed network weights (contiguously strided per bird in Float32 for L1/L2 cache efficiency)
  readonly w0Stride: number;
  readonly b0Stride: number;
  readonly w1Stride: number;
  readonly b1Stride: number;
  readonly w2Stride: number;
  readonly b2Stride: number;
  readonly bioStride: number;
  readonly stateStride: number;

  readonly w0: Float32Array;
  readonly b0: Float32Array;
  readonly w1: Float32Array;
  readonly b1: Float32Array;
  readonly w2: Float32Array;
  readonly b2: Float32Array;
  readonly bio: Float32Array;
  readonly bioRates: Float32Array;
  readonly bioOmr: Float32Array;
  readonly bioAplGamma: Float32Array;
  readonly state: Float32Array;

  // Shared scratch buffers (reused across all birds & ticks — zero allocation)
  private readonly rawIn = new Float32Array(ALL_SENSOR_FEATURES.length);
  private readonly subIn: Float32Array;
  private readonly act1: Float32Array;
  private readonly driveBuf: Float32Array;
  private readonly nextBuf: Float32Array;
  private readonly rollBufA: Float32Array;
  private readonly rollBufB: Float32Array;

  readonly inputIndices: Int32Array;
  readonly useFullInputs: boolean;
  readonly sensorMask: number;
  readonly isOnlyBotClear: boolean;
  private lastEvalPonderSteps = 1;
  private readonly stepOut = {
    evaluatedTicks: 0,
    maxScore: 0,
    maxScoreBirdIdx: -1,
  };

  constructor(brains: readonly NeuralNetwork[]) {
    const n = brains.length;
    const proto = brains[0];
    this.count = n;
    this.arch = proto.architecture;
    this.inCount = proto.inputNodes;
    this.depth = proto.hiddenLayers.length;
    this.h1 = this.depth >= 1 ? proto.hiddenLayers[0] : 0;
    this.h2 = this.depth >= 2 ? proto.hiddenLayers[1] : 0;
    this.lastH = this.depth === 0 ? 1 : this.depth === 1 ? this.h1 : this.h2;
    this.reasoningSteps = proto.reasoningSteps;

    this.y = new Float32Array(n);
    this.vy = new Float32Array(n);
    this.fitness = new Float32Array(n);
    this.score = new Int32Array(n);
    this.lastPassedPipeId = new Int32Array(n);
    this.alive = new Uint8Array(n);
    this.hitFloorOrCeiling = new Uint8Array(n);
    this.aliveList = new Int32Array(n);
    this.aliveCount = n;

    this.w0Stride = proto.qLayerWeights[0].length;
    this.b0Stride = proto.qLayerBiases[0].length;
    this.w1Stride = proto.qLayerWeights.length >= 2 ? proto.qLayerWeights[1].length : 0;
    this.b1Stride = proto.qLayerBiases.length >= 2 ? proto.qLayerBiases[1].length : 0;
    this.w2Stride = proto.qLayerWeights.length >= 3 ? proto.qLayerWeights[2].length : 0;
    this.b2Stride = proto.qLayerBiases.length >= 3 ? proto.qLayerBiases[2].length : 0;
    this.bioStride = proto.qBioParams.length;

    const totalHidden = this.h1 + this.h2;
    this.stateStride =
      this.arch === 'DROSOPHILA_CONNECTOME'
        ? Math.max(1, totalHidden) + 1
        : this.arch === 'LTC_FLY' ||
            this.arch === 'NEUROCHEM_GATE' ||
            this.arch === 'SYNAPTIC_STP' ||
            this.arch === 'SELECTIVE_SSM'
          ? Math.max(1, totalHidden)
          : this.arch === 'LOOPED_REASONER' ||
              this.arch === 'PONDER_ACT' ||
              this.arch === 'LATENT_ROLLOUT'
            ? this.lastH
            : 0;

    this.w0 = new Float32Array(n * this.w0Stride);
    this.b0 = new Float32Array(n * this.b0Stride);
    this.w1 = new Float32Array(n * this.w1Stride);
    this.b1 = new Float32Array(n * this.b1Stride);
    this.w2 = new Float32Array(n * this.w2Stride);
    this.b2 = new Float32Array(n * this.b2Stride);
    this.bio = new Float32Array(n * this.bioStride);
    this.bioRates = new Float32Array(n * this.stateStride);
    this.bioOmr = new Float32Array(n * this.stateStride);
    this.bioAplGamma = new Float32Array(n);
    this.state = new Float32Array(n * this.stateStride);

    this.subIn = new Float32Array(this.inCount);
    this.act1 = new Float32Array(Math.max(1, this.h1));
    this.driveBuf = new Float32Array(Math.max(1, this.lastH));
    this.nextBuf = new Float32Array(Math.max(1, this.lastH));
    this.rollBufA = new Float32Array(Math.max(1, this.lastH));
    this.rollBufB = new Float32Array(Math.max(1, this.lastH));

    this.useFullInputs =
      this.inCount === ALL_SENSOR_FEATURES.length &&
      isFullSensorSet(proto.inputFeatures);
    const idxList = getInputFeatureIndices(proto.inputFeatures);
    this.inputIndices = new Int32Array(idxList);
    let mask = 0;
    for (let i = 0; i < idxList.length; i++) mask |= 1 << idxList[i];
    this.sensorMask = mask;
    this.isOnlyBotClear = idxList.length === 1 && idxList[0] === 4;

    this.packPopulation(brains);
  }

  static canAccelerate(brains: readonly NeuralNetwork[]): boolean {
    if (brains.length === 0) return false;
    const proto = brains[0];
    const arch = proto.architecture;
    if (arch === 'HYBRID_MOE' || arch === 'DECOUPLED_FLY_CORTEX') return false;
    const depth = proto.hiddenLayers.length;
    if (depth > 2) return false;
    const inNodes = proto.inputNodes;
    const rSteps = proto.reasoningSteps;
    for (let i = 1; i < brains.length; i++) {
      const br = brains[i];
      if (
        br.architecture !== arch ||
        br.inputNodes !== inNodes ||
        br.reasoningSteps !== rSteps ||
        br.hiddenLayers.length !== depth
      ) {
        return false;
      }
      for (let l = 0; l < depth; l++) {
        if (br.hiddenLayers[l] !== proto.hiddenLayers[l]) return false;
      }
    }
    return true;
  }

  packPopulation(brains: readonly NeuralNetwork[]): void {
    const n = brains.length;
    const initStateVal = this.arch === 'SYNAPTIC_STP' ? 1.0 : 0.0;
    const initY = PLAYABLE_HEIGHT * 0.46;

    for (let b = 0; b < n; b++) {
      const br = brains[b];
      this.y[b] = initY;
      this.vy[b] = 0;
      this.fitness[b] = 0;
      this.score[b] = 0;
      this.lastPassedPipeId[b] = 0;
      this.alive[b] = 1;
      this.hitFloorOrCeiling[b] = 0;
      this.aliveList[b] = b;

      this.w0.set(br.qLayerWeights[0], b * this.w0Stride);
      this.b0.set(br.qLayerBiases[0], b * this.b0Stride);
      if (this.w1Stride > 0) {
        this.w1.set(br.qLayerWeights[1], b * this.w1Stride);
        this.b1.set(br.qLayerBiases[1], b * this.b1Stride);
      }
      if (this.w2Stride > 0) {
        this.w2.set(br.qLayerWeights[2], b * this.w2Stride);
        this.b2.set(br.qLayerBiases[2], b * this.b2Stride);
      }
      if (this.bioStride > 0) {
        const bOff = b * this.bioStride;
        const qbp = br.qBioParams;
        this.bio.set(qbp, bOff);

        // Precompute Float32 rates matching exact architecture semantics
        const sOff = b * this.stateStride;
        const stLen = this.stateStride;
        if (this.arch === 'LTC_FLY') {
          for (let i = 0; i < stLen; i++) {
            const a = 1 / (1 + Math.exp(-qbp[i * 2]));
            this.bioRates[sOff + i] = a;
            this.bioOmr[sOff + i] = 1 - a;
          }
        } else if (this.arch === 'NEUROCHEM_GATE') {
          for (let i = 0; i < stLen; i++) {
            const r = 1 / (1 + Math.exp(-qbp[i * 3]));
            this.bioRates[sOff + i] = r;
            this.bioOmr[sOff + i] = 1 - r;
          }
        } else if (this.arch === 'SYNAPTIC_STP') {
          for (let i = 0; i < stLen; i++) {
            const r = 0.12 / (1 + Math.exp(-qbp[i * 2]));
            this.bioRates[sOff + i] = r;
            this.bioOmr[sOff + i] = 1 - r;
          }
        } else if (
          this.arch === 'LOOPED_REASONER' ||
          this.arch === 'PONDER_ACT'
        ) {
          const alphaOff = stLen * stLen + stLen;
          for (let i = 0; i < stLen; i++) {
            const a = 1 / (1 + Math.exp(-qbp[alphaOff + i]));
            this.bioRates[sOff + i] = a;
            this.bioOmr[sOff + i] = 1 - a;
          }
        } else if (this.arch === 'DROSOPHILA_CONNECTOME') {
          const bioNodes = stLen - 1;
          for (let i = 0; i < bioNodes; i++) {
            const a = 1 / (1 + Math.exp(-qbp[i * 2]));
            this.bioRates[sOff + i] = a;
            this.bioOmr[sOff + i] = 1 - a;
          }
          const tailOff =
            bioNodes * 2 + (this.depth > 0 ? this.inCount : 0);
          const oaBeta = 1 / (1 + Math.exp(-qbp[tailOff + 1]));
          this.bioRates[sOff + bioNodes] = oaBeta;
          this.bioOmr[sOff + bioNodes] = 1 - oaBeta;
          this.bioAplGamma[b] = 0.5 / (1 + Math.exp(-qbp[tailOff]));
        }
      }
    }
    if (this.state.length > 0) {
      this.state.fill(initStateVal);
    }
    this.aliveCount = n;
  }

  /**
   * Evaluates one packed bird's decision logit directly from contiguous Float32 arrays.
   */
  private evalBirdLogit(b: number, inp: Float32Array): number {
    const arch = this.arch;
    const inCount = this.inCount;
    const depth = this.depth;
    const w0Base = b * this.w0Stride;
    const b0Base = b * this.b0Stride;
    const w0 = this.w0;
    const b0 = this.b0;

    // Fast path: MLP (Depth 0, 1, 2)
    if (arch === 'MLP') {
      if (depth === 0) {
        let sum = b0[b0Base];
        for (let i = 0; i < inCount; i++) sum += inp[i] * w0[w0Base + i];
        return sum;
      }
      if (depth === 1) {
        const w1Base = b * this.w1Stride;
        const h1 = this.h1;
        const w1 = this.w1;
        let outSum = this.b1[b];
        for (let j = 0; j < h1; j++) {
          let sum = b0[b0Base + j];
          const off = w0Base + j * inCount;
          for (let i = 0; i < inCount; i++) sum += inp[i] * w0[off + i];
          outSum += fastTanhF32(sum) * w1[w1Base + j];
        }
        return outSum;
      }
      // Depth 2
      const h1 = this.h1;
      const h2 = this.h2;
      const act1 = this.act1;
      for (let j = 0; j < h1; j++) {
        let sum = b0[b0Base + j];
        const off = w0Base + j * inCount;
        for (let i = 0; i < inCount; i++) sum += inp[i] * w0[off + i];
        act1[j] = fastTanhF32(sum);
      }
      const w1Base = b * this.w1Stride;
      const b1Base = b * this.b1Stride;
      const w2Base = b * this.w2Stride;
      const w1 = this.w1;
      const b1 = this.b1;
      const w2 = this.w2;
      let outSum = this.b2[b];
      for (let j = 0; j < h2; j++) {
        let sum = b1[b1Base + j];
        const off = w1Base + j * h1;
        for (let i = 0; i < h1; i++) sum += act1[i] * w1[off + i];
        outSum += fastTanhF32(sum) * w2[w2Base + j];
      }
      return outSum;
    }

    // RESIDUAL_SKIP
    if (arch === 'RESIDUAL_SKIP') {
      const bioBase = b * this.bioStride;
      const bio = this.bio;
      if (depth === 0) {
        let sum = b0[b0Base];
        for (let i = 0; i < inCount; i++) sum += inp[i] * w0[w0Base + i];
        return sum;
      }
      let outSum = 0;
      if (depth === 1) {
        const w1Base = b * this.w1Stride;
        const h1 = this.h1;
        outSum = this.b1[b];
        for (let j = 0; j < h1; j++) {
          let sum = b0[b0Base + j];
          const off = w0Base + j * inCount;
          for (let i = 0; i < inCount; i++) sum += inp[i] * w0[off + i];
          outSum += fastTanhF32(sum) * this.w1[w1Base + j];
        }
      } else {
        const h1 = this.h1;
        const h2 = this.h2;
        const act1 = this.act1;
        for (let j = 0; j < h1; j++) {
          let sum = b0[b0Base + j];
          const off = w0Base + j * inCount;
          for (let i = 0; i < inCount; i++) sum += inp[i] * w0[off + i];
          act1[j] = fastTanhF32(sum);
        }
        const w1Base = b * this.w1Stride;
        const b1Base = b * this.b1Stride;
        const w2Base = b * this.w2Stride;
        outSum = this.b2[b];
        for (let j = 0; j < h2; j++) {
          let sum = this.b1[b1Base + j];
          const off = w1Base + j * h1;
          for (let i = 0; i < h1; i++) sum += act1[i] * this.w1[off + i];
          outSum += fastTanhF32(sum) * this.w2[w2Base + j];
        }
      }
      for (let i = 0; i < inCount; i++) outSum += inp[i] * bio[bioBase + i];
      return outSum;
    }

    const sBase = b * this.stateStride;
    const bioBase = b * this.bioStride;
    const st = this.state;
    const bio = this.bio;
    const rates = this.bioRates;
    const omr = this.bioOmr;

    if (arch === 'DROSOPHILA_CONNECTOME') {
      let absInSum = 0;
      for (let i = 0; i < inCount; i++) {
        const v = inp[i];
        absInSum += v < 0 ? -v : v;
      }
      const meanAbsIn = absInSum / inCount;
      const bioNodes = this.stateStride - 1;
      const gfOff = bioBase + bioNodes * 2;
      const tailOff = gfOff + (depth > 0 ? inCount : 0);
      const oaIdx = sBase + bioNodes;
      const oaTone =
        omr[oaIdx] * st[oaIdx] +
        rates[oaIdx] * fastTanhF32(bio[tailOff + 2] * meanAbsIn);
      st[oaIdx] = oaTone;
      const rawMod = 1 + bio[tailOff + 3] * oaTone;
      const oaMod = rawMod < 0.25 ? 0.25 : rawMod > 2.25 ? 2.25 : rawMod;

      if (depth === 0) {
        let outSum = b0[b0Base];
        for (let i = 0; i < inCount; i++) outSum += inp[i] * w0[w0Base + i];
        const prevH = st[sBase];
        const nextH =
          omr[sBase] * prevH +
          rates[sBase] * fastTanhF32(outSum * oaMod + bio[bioBase + 1] * prevH);
        st[sBase] = nextH;
        return nextH * 4.0;
      }

      const aplGamma = this.bioAplGamma[b];
      const h1 = this.h1;
      const act1 = this.act1;
      let layerSum1 = 0;
      for (let j = 0; j < h1; j++) {
        let sum = b0[b0Base + j];
        const off = w0Base + j * inCount;
        for (let i = 0; i < inCount; i++) sum += inp[i] * w0[off + i];
        const si = sBase + j;
        const prevH = st[si];
        const nextH =
          omr[si] * prevH +
          rates[si] * fastTanhF32(sum * oaMod + bio[bioBase + j * 2 + 1] * prevH);
        st[si] = nextH;
        act1[j] = nextH;
        layerSum1 += nextH;
      }
      const inh1 = aplGamma * (layerSum1 / h1);
      for (let j = 0; j < h1; j++) {
        const v = act1[j] - inh1;
        act1[j] = v < -1 ? -1 : v > 1 ? 1 : v;
      }

      if (depth === 1) {
        const w1Base = b * this.w1Stride;
        let outSum = this.b1[b];
        for (let j = 0; j < h1; j++) outSum += act1[j] * this.w1[w1Base + j];
        outSum *= oaMod;
        for (let i = 0; i < inCount; i++) outSum += inp[i] * bio[gfOff + i];
        return outSum;
      }

      // Depth 2
      const h2 = this.h2;
      const w1Base = b * this.w1Stride;
      const b1Base = b * this.b1Stride;
      const w2Base = b * this.w2Stride;
      const act2 = this.nextBuf;
      let layerSum2 = 0;
      for (let j = 0; j < h2; j++) {
        let sum = this.b1[b1Base + j];
        const off = w1Base + j * h1;
        for (let i = 0; i < h1; i++) sum += act1[i] * this.w1[off + i];
        const nIdx = h1 + j;
        const si = sBase + nIdx;
        const prevH = st[si];
        const nextH =
          omr[si] * prevH +
          rates[si] *
            fastTanhF32(sum * oaMod + bio[bioBase + nIdx * 2 + 1] * prevH);
        st[si] = nextH;
        act2[j] = nextH;
        layerSum2 += nextH;
      }
      const inh2 = aplGamma * (layerSum2 / h2);
      let outSum = this.b2[b];
      for (let j = 0; j < h2; j++) {
        const v = act2[j] - inh2;
        const clamped = v < -1 ? -1 : v > 1 ? 1 : v;
        outSum += clamped * this.w2[w2Base + j];
      }
      outSum *= oaMod;
      for (let i = 0; i < inCount; i++) outSum += inp[i] * bio[gfOff + i];
      return outSum;
    }

    // Stateful per-neuron architectures: LTC_FLY, NEUROCHEM_GATE, SYNAPTIC_STP, SELECTIVE_SSM
    if (
      arch === 'LTC_FLY' ||
      arch === 'NEUROCHEM_GATE' ||
      arch === 'SYNAPTIC_STP' ||
      arch === 'SELECTIVE_SSM'
    ) {
      if (depth === 0) {
        let outSum = b0[b0Base];
        for (let i = 0; i < inCount; i++) outSum += inp[i] * w0[w0Base + i];
        if (arch === 'LTC_FLY') {
          const prevH = st[sBase];
          const nextH =
            omr[sBase] * prevH +
            rates[sBase] * fastTanhF32(outSum + bio[bioBase + 1] * prevH);
          st[sBase] = nextH;
          return nextH * 4.0;
        }
        if (arch === 'NEUROCHEM_GATE') {
          const nextM =
            omr[sBase] * st[sBase] +
            rates[sBase] * fastTanhF32(bio[bioBase + 1] * outSum);
          st[sBase] = nextM;
          const g = bio[bioBase + 2];
          return (1 + g * nextM) * outSum + 0.5 * g * nextM;
        }
        if (arch === 'SYNAPTIC_STP') {
          const act = fastTanhF32(outSum);
          const absAct = act < 0 ? -act : act;
          const prevU = st[sBase];
          let nextU =
            prevU +
            rates[sBase] * (1 - prevU) +
            bio[bioBase + 1] * absAct * (1.5 - prevU) -
            0.18 * absAct * prevU;
          if (nextU < 0.15) nextU = 0.15;
          else if (nextU > 2.0) nextU = 2.0;
          st[sBase] = nextU;
          return nextU * outSum;
        }
        // SELECTIVE_SSM D0
        const prevH = st[sBase];
        const z = fastSigmoidF32(
          bio[bioBase] * outSum + bio[bioBase + 2] * prevH + bio[bioBase + 1]
        );
        const nextH = (1 - z) * prevH + z * fastTanhF32(outSum);
        st[sBase] = nextH;
        return nextH * 4.0;
      }

      const h1 = this.h1;
      const act1 = this.act1;
      for (let j = 0; j < h1; j++) {
        let sum = b0[b0Base + j];
        const off = w0Base + j * inCount;
        for (let i = 0; i < inCount; i++) sum += inp[i] * w0[off + i];
        const si = sBase + j;
        if (arch === 'LTC_FLY') {
          const prevH = st[si];
          const nextH =
            omr[si] * prevH +
            rates[si] * fastTanhF32(sum + bio[bioBase + j * 2 + 1] * prevH);
          st[si] = nextH;
          act1[j] = nextH;
        } else if (arch === 'NEUROCHEM_GATE') {
          const p = bioBase + j * 3;
          const nextM =
            omr[si] * st[si] + rates[si] * fastTanhF32(bio[p + 1] * sum);
          st[si] = nextM;
          const eff = bio[p + 2] * nextM;
          const g = (1 + eff) * fastTanhF32(sum + 0.5 * eff);
          act1[j] = g > 2 ? 2 : g < -2 ? -2 : g;
        } else if (arch === 'SYNAPTIC_STP') {
          const act = fastTanhF32(sum);
          const absAct = act < 0 ? -act : act;
          const prevU = st[si];
          let nextU =
            prevU +
            rates[si] * (1 - prevU) +
            bio[bioBase + j * 2 + 1] * absAct * (1.5 - prevU) -
            0.18 * absAct * prevU;
          if (nextU < 0.15) nextU = 0.15;
          else if (nextU > 2.0) nextU = 2.0;
          st[si] = nextU;
          act1[j] = nextU * act;
        } else {
          // SELECTIVE_SSM
          const p = bioBase + j * 3;
          const prevH = st[si];
          const z = fastSigmoidF32(
            bio[p] * sum + bio[p + 2] * prevH + bio[p + 1]
          );
          const nextH = (1 - z) * prevH + z * fastTanhF32(sum);
          st[si] = nextH;
          act1[j] = nextH;
        }
      }

      if (depth === 1) {
        const w1Base = b * this.w1Stride;
        let outSum = this.b1[b];
        for (let j = 0; j < h1; j++) outSum += act1[j] * this.w1[w1Base + j];
        return outSum;
      }

      // Depth 2
      const h2 = this.h2;
      const w1Base = b * this.w1Stride;
      const b1Base = b * this.b1Stride;
      const w2Base = b * this.w2Stride;
      let outSum = this.b2[b];
      for (let j = 0; j < h2; j++) {
        let sum = this.b1[b1Base + j];
        const off = w1Base + j * h1;
        for (let i = 0; i < h1; i++) sum += act1[i] * this.w1[off + i];
        const nIdx = h1 + j;
        const si = sBase + nIdx;
        let act = 0;
        if (arch === 'LTC_FLY') {
          const prevH = st[si];
          act =
            omr[si] * prevH +
            rates[si] * fastTanhF32(sum + bio[bioBase + nIdx * 2 + 1] * prevH);
          st[si] = act;
        } else if (arch === 'NEUROCHEM_GATE') {
          const p = bioBase + nIdx * 3;
          const nextM =
            omr[si] * st[si] + rates[si] * fastTanhF32(bio[p + 1] * sum);
          st[si] = nextM;
          const eff = bio[p + 2] * nextM;
          const g = (1 + eff) * fastTanhF32(sum + 0.5 * eff);
          act = g > 2 ? 2 : g < -2 ? -2 : g;
        } else if (arch === 'SYNAPTIC_STP') {
          const a = fastTanhF32(sum);
          const absA = a < 0 ? -a : a;
          const prevU = st[si];
          let nextU =
            prevU +
            rates[si] * (1 - prevU) +
            bio[bioBase + nIdx * 2 + 1] * absA * (1.5 - prevU) -
            0.18 * absA * prevU;
          if (nextU < 0.15) nextU = 0.15;
          else if (nextU > 2.0) nextU = 2.0;
          st[si] = nextU;
          act = nextU * a;
        } else {
          const p = bioBase + nIdx * 3;
          const prevH = st[si];
          const z = fastSigmoidF32(
            bio[p] * sum + bio[p + 2] * prevH + bio[p + 1]
          );
          act = (1 - z) * prevH + z * fastTanhF32(sum);
          st[si] = act;
        }
        outSum += act * this.w2[w2Base + j];
      }
      return outSum;
    }

    // Reasoning Latent-Space Architectures: LOOPED_REASONER, PONDER_ACT, LATENT_ROLLOUT
    const H = this.lastH;
    const drive = this.driveBuf;
    if (depth === 0) {
      let sum = b0[b0Base];
      for (let i = 0; i < inCount; i++) sum += inp[i] * w0[w0Base + i];
      drive[0] = sum;
    } else if (depth === 1) {
      for (let j = 0; j < H; j++) {
        let sum = b0[b0Base + j];
        const off = w0Base + j * inCount;
        for (let i = 0; i < inCount; i++) sum += inp[i] * w0[off + i];
        drive[j] = sum;
      }
    } else {
      const h1 = this.h1;
      const act1 = this.act1;
      for (let j = 0; j < h1; j++) {
        let sum = b0[b0Base + j];
        const off = w0Base + j * inCount;
        for (let i = 0; i < inCount; i++) sum += inp[i] * w0[off + i];
        act1[j] = fastTanhF32(sum);
      }
      const w1Base = b * this.w1Stride;
      const b1Base = b * this.b1Stride;
      for (let j = 0; j < H; j++) {
        let sum = this.b1[b1Base + j];
        const off = w1Base + j * h1;
        for (let i = 0; i < h1; i++) sum += act1[i] * this.w1[off + i];
        drive[j] = sum;
      }
    }

    const outW = depth === 1 ? this.w1 : depth === 2 ? this.w2 : null;
    const outWBase =
      depth === 1 ? b * this.w1Stride : depth === 2 ? b * this.w2Stride : 0;
    const outBias = depth === 1 ? this.b1[b] : depth === 2 ? this.b2[b] : 0;

    if (arch === 'LOOPED_REASONER') {
      const nextH = this.nextBuf;
      const bRecOff = bioBase + H * H;
      const K = this.reasoningSteps;
      for (let step = 0; step < K; step++) {
        for (let j = 0; j < H; j++) {
          let sum = drive[j] + bio[bRecOff + j];
          const row = bioBase + j * H;
          for (let i = 0; i < H; i++) sum += bio[row + i] * st[sBase + i];
          nextH[j] = omr[sBase + j] * st[sBase + j] + rates[sBase + j] * fastTanhF32(sum);
        }
        for (let j = 0; j < H; j++) st[sBase + j] = nextH[j];
      }
      if (!outW) return st[sBase] * 4.0;
      let outSum = outBias;
      for (let j = 0; j < H; j++) outSum += st[sBase + j] * outW[outWBase + j];
      return outSum;
    }

    if (arch === 'PONDER_ACT') {
      const nextH = this.nextBuf;
      const bRecOff = bioBase + H * H;
      const wHaltOff = bioBase + H * H + H * 2;
      const bHalt = bio[wHaltOff + H];
      const maxK = Math.max(2, this.reasoningSteps);
      let remain = 1.0;
      let cumHalt = 0.0;
      let outAcc = 0.0;
      let stepsUsed = 0;

      for (let step = 0; step < maxK; step++) {
        stepsUsed += 1;
        let fluxSum = 0.0;
        for (let j = 0; j < H; j++) {
          let sum = drive[j] + bio[bRecOff + j];
          const row = bioBase + j * H;
          for (let i = 0; i < H; i++) sum += bio[row + i] * st[sBase + i];
          const nh = omr[sBase + j] * st[sBase + j] + rates[sBase + j] * fastTanhF32(sum);
          nextH[j] = nh;
          fluxSum += Math.abs(nh - st[sBase + j]);
        }
        for (let j = 0; j < H; j++) st[sBase + j] = nextH[j];

        let stepLogit = outBias;
        if (outW) {
          for (let j = 0; j < H; j++) stepLogit += st[sBase + j] * outW[outWBase + j];
        } else {
          stepLogit = st[sBase] * 4.0;
        }
        if (step === maxK - 1) {
          outAcc += remain * stepLogit;
          break;
        }
        const meanFlux = fluxSum / H;
        let haltLogit = bHalt + 1.35 - 3.2 * meanFlux;
        for (let j = 0; j < H; j++) haltLogit += bio[wHaltOff + j] * st[sBase + j];
        const pHalt = fastSigmoidF32(haltLogit);
        const sw = remain * pHalt;
        if (cumHalt + sw >= 0.68) {
          outAcc += remain * stepLogit;
          break;
        }
        outAcc += sw * stepLogit;
        cumHalt += sw;
        remain -= sw;
      }
      this.lastEvalPonderSteps = stepsUsed;
      return outAcc;
    }

    // LATENT_ROLLOUT
    const sJump = this.rollBufA;
    const sWait = this.rollBufB;
    const wActOff = bioBase + H * H;
    const bDynOff = bioBase + H * H + H;
    const wValOff = bioBase + H * H + H * 2;

    for (let j = 0; j < H; j++) {
      st[sBase + j] = 0.45 * st[sBase + j] + 0.55 * fastTanhF32(drive[j]);
    }
    let vJump = 0;
    let vWait = 0;
    for (let j = 0; j < H; j++) {
      let base = bio[bDynOff + j];
      const row = bioBase + j * H;
      for (let i = 0; i < H; i++) base += bio[row + i] * st[sBase + i];
      const actShift = bio[wActOff + j];
      const j1 = fastTanhF32(base + actShift);
      const w1 = fastTanhF32(base - actShift);
      sJump[j] = j1;
      sWait[j] = w1;
      const immW = outW ? outW[outWBase + j] : 1.0;
      vJump += j1 * immW;
      vWait += w1 * immW;
    }
    for (let j = 0; j < H; j++) {
      const baseBias = bio[bDynOff + j] - 0.5 * bio[wActOff + j];
      let sumJ = baseBias;
      let sumW = baseBias;
      const row = bioBase + j * H;
      for (let i = 0; i < H; i++) {
        const wd = bio[row + i];
        sumJ += wd * sJump[i];
        sumW += wd * sWait[i];
      }
      const valW = bio[wValOff + j];
      vJump += fastTanhF32(sumJ) * valW;
      vWait += fastTanhF32(sumW) * valW;
    }
    const outSum = vJump - vWait + outBias;
    const chosen = outSum > 0 ? sJump : sWait;
    for (let j = 0; j < H; j++) st[sBase + j] = chosen[j];
    return outSum;
  }

  /**
   * Advances all alive birds by 1 shared physics frame in a single flat Float32 pass.
   * Returns { evaluatedTicks, bestScoreDelta, bestBirdIdx }.
   */
  stepSharedFrame(params: {
    hasNextPipe: boolean;
    gapTop: number;
    gapBottom: number;
    gapCenter: number;
    pipeEdgeX: number;
    gapVy: number;
    next2GapCenter: number | null;
    next2GapTop?: number;
    next2GapBot?: number;
    next2PipeEdgeX?: number | null;
    next2GapVy?: number;
    tickSpeed?: number;
    movingPipes?: boolean;
    pipeHorizHit: boolean;
    pipeEffY: number;
    passedFirstPipe: boolean;
    firstPipeId: number;
    gravity: number;
    jumpImpulse: number;
    useShaped: boolean;
    metabolicStepCost?: number;
  }): { evaluatedTicks: number; maxScore: number; maxScoreBirdIdx: number } {
    let aliveLen = this.aliveCount;
    if (aliveLen === 0) {
      this.stepOut.evaluatedTicks = 0;
      this.stepOut.maxScore = 0;
      this.stepOut.maxScoreBirdIdx = -1;
      return this.stepOut;
    }

    const {
      hasNextPipe,
      gapTop,
      gapBottom,
      gapCenter,
      pipeEdgeX,
      gapVy,
      next2GapCenter,
      next2GapTop = PLAYABLE_HEIGHT * 0.35,
      next2GapBot = PLAYABLE_HEIGHT * 0.65,
      next2PipeEdgeX = null,
      next2GapVy = 0,
      tickSpeed = 2.85,
      movingPipes = false,
      pipeHorizHit,
      pipeEffY,
      passedFirstPipe,
      firstPipeId,
      gravity,
      jumpImpulse,
      useShaped,
      metabolicStepCost = 0,
    } = params;
    const applyMetabolic = metabolicStepCost > 0 && this.arch === 'PONDER_ACT';

    const invHalfPlayable = 2 / PLAYABLE_HEIGHT;
    const invMaxVy = 1 / MAX_VY;
    const invAlignWindow = 1 / (PLAYABLE_HEIGHT * 0.6);
    const gapHalf = Math.max(24, (gapBottom - gapTop) * 0.5);
    const invShapedScale = 1 / (gapHalf * 0.9);
    const hasNext2 = hasNextPipe && next2GapCenter !== null;

    const rawIn = this.rawIn;
    const subIn = this.subIn;
    const useFull = this.useFullInputs;
    const evalBuf = useFull ? rawIn : subIn;
    const indices = this.inputIndices;
    const subLen = indices.length;
    const mask = this.sensorMask;
    const onlyBotClear = this.isOnlyBotClear;

    if (useFull || (mask & 4)) {
      const rawDistNorm = (pipeEdgeX - BIRD_X) / CANVAS_WIDTH;
      rawIn[2] = rawDistNorm < -0.2 ? -0.2 : rawDistNorm > 1 ? 1 : rawDistNorm;
    }
    if (useFull || (mask & 32)) {
      const gv = gapVy / MAX_PIPE_VY_NORM;
      rawIn[5] = gv < -1 ? -1 : gv > 1 ? 1 : gv;
    }
    if (useFull || (mask & 64)) {
      if (hasNext2) {
        const n2 = (next2GapCenter - gapCenter) * invHalfPlayable;
        rawIn[6] = n2 < -1 ? -1 : n2 > 1 ? 1 : n2;
      } else {
        rawIn[6] = 0;
      }
    }
    if (useFull || (mask & 512)) {
      if (hasNext2 && next2PipeEdgeX !== null) {
        const n2d = (next2PipeEdgeX - BIRD_X) / CANVAS_WIDTH;
        rawIn[9] = n2d < -0.2 ? -0.2 : n2d > 1 ? 1 : n2d;
      } else {
        rawIn[9] = 1.0;
      }
    }
    if (useFull || (mask & 1024)) {
      if (hasNext2 && movingPipes) {
        const n2v = next2GapVy / MAX_PIPE_VY_NORM;
        rawIn[10] = n2v < -1 ? -1 : n2v > 1 ? 1 : n2v;
      } else {
        rawIn[10] = 0;
      }
    }
    if (useFull || (mask & 2048)) {
      if (hasNextPipe) {
        const ttf = (pipeEdgeX - BIRD_X) / (Math.max(1.2, tickSpeed) * 120);
        rawIn[11] = ttf < 0 ? 0 : ttf > 1 ? 1 : ttf;
      } else {
        rawIn[11] = 1.0;
      }
    }

    const yArr = this.y;
    const vyArr = this.vy;
    const fitArr = this.fitness;
    const scoreArr = this.score;
    const passArr = this.lastPassedPipeId;
    const aliveArr = this.alive;
    const floorArr = this.hitFloorOrCeiling;
    const aliveList = this.aliveList;

    const evaluatedTicks = aliveLen;
    let maxScore = 0;
    let maxScoreBirdIdx = -1;

    let idx = 0;
    while (idx < aliveLen) {
      const b = aliveList[idx];
      let y = yArr[b];
      let vy = vyArr[b];

      if (onlyBotClear) {
        subIn[0] = (gapBottom - y) * invHalfPlayable;
      } else if (useFull) {
        rawIn[0] = y * invHalfPlayable - 1;
        const vn = vy * invMaxVy;
        rawIn[1] = vn < -1 ? -1 : vn > 1 ? 1 : vn;
        rawIn[3] = (y - gapTop) * invHalfPlayable;
        rawIn[4] = (gapBottom - y) * invHalfPlayable;
        rawIn[7] = hasNext2 ? (y - next2GapTop) * invHalfPlayable : 0;
        rawIn[8] = hasNext2 ? (next2GapBot - y) * invHalfPlayable : 0;
      } else {
        if (mask & 1) rawIn[0] = y * invHalfPlayable - 1;
        if (mask & 2) {
          const vn = vy * invMaxVy;
          rawIn[1] = vn < -1 ? -1 : vn > 1 ? 1 : vn;
        }
        if (mask & 8) rawIn[3] = (y - gapTop) * invHalfPlayable;
        if (mask & 16) rawIn[4] = (gapBottom - y) * invHalfPlayable;
        if (mask & 128) rawIn[7] = hasNext2 ? (y - next2GapTop) * invHalfPlayable : 0;
        if (mask & 256) rawIn[8] = hasNext2 ? (next2GapBot - y) * invHalfPlayable : 0;
        for (let k = 0; k < subLen; k++) subIn[k] = rawIn[indices[k]];
      }

      if (this.evalBirdLogit(b, evalBuf) > 0) {
        vy = jumpImpulse;
      }

      vy += gravity;
      if (vy > MAX_VY) vy = MAX_VY;
      y += vy;
      yArr[b] = y;
      vyArr[b] = vy;

      let crashed = false;
      if (y - FLOOR_HIT_R <= 0 || y + FLOOR_HIT_R >= PLAYABLE_HEIGHT) {
        floorArr[b] = 1;
        crashed = true;
      } else if (
        pipeHorizHit &&
        (y - pipeEffY < gapTop || y + pipeEffY > gapBottom)
      ) {
        crashed = true;
      }

      if (crashed) {
        aliveArr[b] = 0;
        if (floorArr[b] === 1 && scoreArr[b] === 0) {
          fitArr[b] *= 0.85;
        }
        aliveLen -= 1;
        aliveList[idx] = aliveList[aliveLen];
        continue;
      }

      let fit = fitArr[b] + 0.1;
      if (hasNextPipe) {
        const dy = y - gapCenter;
        const absDy = dy < 0 ? -dy : dy;
        if (useShaped) {
          const normErr = absDy * invShapedScale;
          const centerReward = 0.42 / (1 + normErr * normErr);
          const insideCorridor =
            y > gapTop + 14 && y < gapBottom - 14 ? 0.12 : 0;
          const absVy = vy < 0 ? -vy : vy;
          const jerkPenalty = 0.035 * absVy * invMaxVy;
          const bonus = centerReward + insideCorridor - jerkPenalty;
          if (bonus > 0) fit += bonus;
        } else {
          const normDist = absDy * invAlignWindow;
          if (normDist < 1) fit += 0.15 * (1 - normDist);
        }
      }

      if (passedFirstPipe && firstPipeId > passArr[b]) {
        passArr[b] = firstPipeId;
        const sc = scoreArr[b] + 1;
        scoreArr[b] = sc;
        fit += 40;
        if (sc > maxScore) {
          maxScore = sc;
          maxScoreBirdIdx = b;
        }
      }

      if (applyMetabolic && this.lastEvalPonderSteps > 1) {
        fit -= metabolicStepCost * (this.lastEvalPonderSteps - 1);
        if (fit < 0) fit = 0;
      }

      fitArr[b] = fit;
      idx += 1;
    }

    this.aliveCount = aliveLen;
    this.stepOut.evaluatedTicks = evaluatedTicks;
    this.stepOut.maxScore = maxScore;
    this.stepOut.maxScoreBirdIdx = maxScoreBirdIdx;
    return this.stepOut;
  }
}

/**
 * Precomputed Pipe Trajectory Table for evaluating an entire population of N brains
 * on the exact same seeded pipe physics with 1× trigonometry/RNG cost instead of N×.
 */
export interface PrecomputedPipeTrajectory {
  maxFrames: number;
  gravity: number;
  jumpImpulse: number;
  movingPipes: boolean;
  tickSpeed: Float32Array;
  hasNextPipe: Uint8Array;
  gapTop: Float32Array;
  gapBottom: Float32Array;
  gapCenter: Float32Array;
  pipeEdgeX: Float32Array;
  gapVy: Float32Array;
  next2GapCenter: Float32Array;
  next2GapTop: Float32Array;
  next2GapBot: Float32Array;
  next2PipeEdgeX: Float32Array;
  next2GapVy: Float32Array;
  hasNext2: Uint8Array;
  pipeHorizHit: Uint8Array;
  pipeEffY: Float32Array;
  passedFirstPipe: Uint8Array;
  firstPipeId: Int32Array;
}

export function buildSharedPipeTrajectory(
  difficulty: DifficultyPreset,
  maxFrames: number,
  seed: number,
  customEnvironment?: EnvironmentConfig,
  envOverride?: EnvironmentConfig
): PrecomputedPipeTrajectory {
  const env = envOverride ?? resolveEnvironment(difficulty, customEnvironment);
  const rng = createSeededRng(seed);
  const baseGap = env.gap;
  const gapVar = env.gapVariance;
  const baseSpeed = env.pipeSpeed;
  const speedVar = env.speedVariability;
  const baseSpacing = env.pipeSpeed * env.spawnFrames;
  const movingPipes = env.movingPipes;
  const moveAmp = env.moveAmplitude;
  const gravity = GRAVITY * env.gravityScale;
  const jumpImpulse = JUMP_IMPULSE * Math.sqrt(env.gravityScale);
  const speedPhaseA = rng() * Math.PI * 2;
  const speedPhaseB = rng() * Math.PI * 2;
  const margin = movingPipes ? 72 : 52;

  const cap = 16;
  const px = new Float64Array(cap);
  const pBaseTop = new Float64Array(cap);
  const pGap = new Float64Array(cap);
  const pTop = new Float64Array(cap);
  const pBot = new Float64Array(cap);
  const pPhase = new Float64Array(cap);
  const pVy = new Float64Array(cap);
  const pId = new Int32Array(cap);

  let head = 0;
  let count = 1;
  let pipeCounter = 1;
  let distUntilNextSpawn = baseSpacing;

  const initGap = Math.max(
    76,
    Math.min(204, baseGap + (gapVar > 0 ? (rng() * 2 - 1) * gapVar : 0))
  );
  const initTop =
    margin + rng() * Math.max(20, PLAYABLE_HEIGHT - initGap - margin * 2);
  px[0] = CANVAS_WIDTH + 60;
  pBaseTop[0] = initTop;
  pGap[0] = initGap;
  pTop[0] = initTop;
  pBot[0] = initTop + initGap;
  pPhase[0] = rng() * Math.PI * 2;
  pVy[0] = 0;
  pId[0] = pipeCounter;

  const tickSpeedArr = new Float32Array(maxFrames);
  const hasNextPipe = new Uint8Array(maxFrames);
  const gapTop = new Float32Array(maxFrames);
  const gapBottom = new Float32Array(maxFrames);
  const gapCenter = new Float32Array(maxFrames);
  const pipeEdgeX = new Float32Array(maxFrames);
  const gapVy = new Float32Array(maxFrames);
  const next2GapCenter = new Float32Array(maxFrames);
  const next2GapTop = new Float32Array(maxFrames);
  const next2GapBot = new Float32Array(maxFrames);
  const next2PipeEdgeX = new Float32Array(maxFrames);
  const next2GapVy = new Float32Array(maxFrames);
  const hasNext2 = new Uint8Array(maxFrames);
  const pipeHorizHit = new Uint8Array(maxFrames);
  const pipeEffY = new Float32Array(maxFrames);
  const passedFirstPipe = new Uint8Array(maxFrames);
  const firstPipeId = new Int32Array(maxFrames);

  for (let f = 0; f < maxFrames; f++) {
    const frameCount = f + 1;
    const speedMult =
      speedVar > 0
        ? 1 +
          speedVar *
            (0.55 * Math.sin(frameCount * 0.031 + speedPhaseA) +
              0.45 * Math.cos(frameCount * 0.079 + speedPhaseB))
        : 1;
    const tickSpeed = Math.max(1.2, baseSpeed * speedMult);
    tickSpeedArr[f] = tickSpeed;

    distUntilNextSpawn -= tickSpeed;
    if (distUntilNextSpawn <= 0) {
      const slot = (head + count) & 15;
      const pg = Math.max(
        76,
        Math.min(204, baseGap + (gapVar > 0 ? (rng() * 2 - 1) * gapVar : 0))
      );
      const bt =
        margin + rng() * Math.max(20, PLAYABLE_HEIGHT - pg - margin * 2);
      pipeCounter += 1;
      px[slot] = CANVAS_WIDTH + 60;
      pBaseTop[slot] = bt;
      pGap[slot] = pg;
      pTop[slot] = bt;
      pBot[slot] = bt + pg;
      pPhase[slot] = rng() * Math.PI * 2;
      pVy[slot] = 0;
      pId[slot] = pipeCounter;
      count += 1;
      distUntilNextSpawn =
        speedVar > 0 || gapVar > 0
          ? baseSpacing * (0.88 + rng() * 0.24)
          : baseSpacing;
    }

    let nextIdx = -1;
    let next2Idx = -1;
    const oscAngle = frameCount * 0.045;

    for (let k = 0; k < count; k++) {
      const idx = (head + k) & 15;
      const nx = px[idx] - tickSpeed;
      px[idx] = nx;
      if (movingPipes) {
        const prevTop = pTop[idx];
        const pg = pGap[idx];
        let nt = pBaseTop[idx] + Math.sin(oscAngle + pPhase[idx]) * moveAmp;
        const maxTop = PLAYABLE_HEIGHT - pg - 42;
        if (nt < 42) nt = 42;
        else if (nt > maxTop) nt = maxTop;
        pTop[idx] = nt;
        pBot[idx] = nt + pg;
        pVy[idx] = nt - prevTop;
      }
      if (nx + PIPE_WIDTH > BIRD_X - 10) {
        if (nextIdx === -1) nextIdx = idx;
        else if (next2Idx === -1) next2Idx = idx;
      }
    }

    if (count > 0 && px[head] + PIPE_WIDTH < -24) {
      head = (head + 1) & 15;
      count -= 1;
    }

    if (nextIdx !== -1) {
      hasNextPipe[f] = 1;
      const gt = pTop[nextIdx];
      const gb = pBot[nextIdx];
      gapTop[f] = gt;
      gapBottom[f] = gb;
      gapCenter[f] = 0.5 * (gt + gb);
      pipeEdgeX[f] = px[nextIdx] + PIPE_WIDTH;
      gapVy[f] = pVy[nextIdx];
      if (next2Idx !== -1) {
        hasNext2[f] = 1;
        next2GapTop[f] = pTop[next2Idx];
        next2GapBot[f] = pBot[next2Idx];
        next2GapCenter[f] = 0.5 * (pTop[next2Idx] + pBot[next2Idx]);
        next2PipeEdgeX[f] = px[next2Idx] + PIPE_WIDTH;
        next2GapVy[f] = pVy[next2Idx];
      }
      const pipeLeft = px[nextIdx];
      const pipeRight = pipeLeft + PIPE_WIDTH;
      let dx = 0;
      if (BIRD_X < pipeLeft) dx = pipeLeft - BIRD_X;
      else if (BIRD_X > pipeRight) dx = BIRD_X - pipeRight;
      if (dx < PIPE_HIT_R) {
        pipeHorizHit[f] = 1;
        pipeEffY[f] =
          dx === 0 ? PIPE_HIT_R : Math.sqrt(Math.max(0, PIPE_HIT_R2 - dx * dx));
      }
    } else {
      gapTop[f] = PLAYABLE_HEIGHT * 0.35;
      gapBottom[f] = PLAYABLE_HEIGHT * 0.65;
      gapCenter[f] = PLAYABLE_HEIGHT * 0.5;
      pipeEdgeX[f] = CANVAS_WIDTH;
    }

    if (count > 0) {
      firstPipeId[f] = pId[head];
      if (px[head] + PIPE_WIDTH < BIRD_X) {
        passedFirstPipe[f] = 1;
      }
    }
  }

  return {
    maxFrames,
    gravity,
    jumpImpulse,
    movingPipes,
    tickSpeed: tickSpeedArr,
    hasNextPipe,
    gapTop,
    gapBottom,
    gapCenter,
    pipeEdgeX,
    gapVy,
    next2GapCenter,
    next2GapTop,
    next2GapBot,
    next2PipeEdgeX,
    next2GapVy,
    hasNext2,
    pipeHorizHit,
    pipeEffY,
    passedFirstPipe,
    firstPipeId,
  };
}

/**
 * Evaluates an entire population on a precomputed Shared Pipe Trajectory using
 * the vectorized Float32 SoA kernel (zero redundant pipe math or allocations).
 */
export function evaluatePopulationOnSharedTrajectory(
  brains: readonly NeuralNetwork[],
  traj: PrecomputedPipeTrajectory,
  targetPipeCap: number,
  shapedFitness = false
): {
  scores: Int32Array;
  fitnesses: Float32Array;
  totalTicks: number;
  bestScore: number;
} {
  const kernel = new PopulationBatchKernel(brains);
  let totalTicks = 0;
  let bestScore = 0;

  for (let f = 0; f < traj.maxFrames; f++) {
    if (kernel.aliveCount === 0) break;
    const h2 = traj.hasNext2[f] === 1;
    const stepRes = kernel.stepSharedFrame({
      hasNextPipe: traj.hasNextPipe[f] === 1,
      gapTop: traj.gapTop[f],
      gapBottom: traj.gapBottom[f],
      gapCenter: traj.gapCenter[f],
      pipeEdgeX: traj.pipeEdgeX[f],
      gapVy: traj.gapVy[f],
      next2GapCenter: h2 ? traj.next2GapCenter[f] : null,
      next2GapTop: h2 ? traj.next2GapTop[f] : PLAYABLE_HEIGHT * 0.35,
      next2GapBot: h2 ? traj.next2GapBot[f] : PLAYABLE_HEIGHT * 0.65,
      next2PipeEdgeX: h2 ? traj.next2PipeEdgeX[f] : null,
      next2GapVy: h2 ? traj.next2GapVy[f] : 0,
      tickSpeed: traj.tickSpeed[f],
      movingPipes: traj.movingPipes,
      pipeHorizHit: traj.pipeHorizHit[f] === 1,
      pipeEffY: traj.pipeEffY[f],
      passedFirstPipe: traj.passedFirstPipe[f] === 1,
      firstPipeId: traj.firstPipeId[f],
      gravity: traj.gravity,
      jumpImpulse: traj.jumpImpulse,
      useShaped: shapedFitness,
    });
    totalTicks += stepRes.evaluatedTicks;
    if (stepRes.maxScore > bestScore) {
      bestScore = stepRes.maxScore;
      if (bestScore >= targetPipeCap) break;
    }
  }

  return {
    scores: kernel.score,
    fitnesses: kernel.fitness,
    totalTicks,
    bestScore,
  };
}

/**
 * Zero-waste Lockstep Shared-Physics Population Evaluator:
 * Advances pipe physics ONCE per frame on-the-fly strictly while `kernel.aliveCount > 0`,
 * eliminating both N× redundant pipe physics AND any wasted precomputation beyond the
 * longest-living bird. Uses the vectorized Float32 SoA kernel for all birds.
 */
export function evaluatePopulationLockstep(
  brains: readonly NeuralNetwork[],
  difficulty: DifficultyPreset,
  targetPipeCap: number,
  seed: number,
  customEnvironment?: EnvironmentConfig,
  options?: {
    shapedFitness?: boolean;
    trainingEnvOverride?: EnvironmentConfig;
    maxFrames?: number;
  }
): {
  scores: Int32Array;
  fitnesses: Float32Array;
  totalTicks: number;
  bestScore: number;
  framesRun: number;
} {
  const env =
    options?.trainingEnvOverride ??
    resolveEnvironment(difficulty, customEnvironment);
  const useShaped = Boolean(options?.shapedFitness);
  const maxFrames =
    options?.maxFrames ?? Math.max(6000, targetPipeCap * 160);
  const rng = createSeededRng(seed);

  const baseGap = env.gap;
  const gapVar = env.gapVariance;
  const baseSpeed = env.pipeSpeed;
  const speedVar = env.speedVariability;
  const baseSpacing = env.pipeSpeed * env.spawnFrames;
  const movingPipes = env.movingPipes;
  const moveAmp = env.moveAmplitude;
  const gravity = GRAVITY * env.gravityScale;
  const jumpImpulse = JUMP_IMPULSE * Math.sqrt(env.gravityScale);
  const speedPhaseA = rng() * Math.PI * 2;
  const speedPhaseB = rng() * Math.PI * 2;
  const margin = movingPipes ? 72 : 52;

  const cap = 16;
  const px = new Float64Array(cap);
  const pBaseTop = new Float64Array(cap);
  const pGap = new Float64Array(cap);
  const pTop = new Float64Array(cap);
  const pBot = new Float64Array(cap);
  const pPhase = new Float64Array(cap);
  const pVy = new Float64Array(cap);
  const pId = new Int32Array(cap);

  let head = 0;
  let count = 1;
  let pipeCounter = 1;
  let distUntilNextSpawn = baseSpacing;

  const initGap = Math.max(
    76,
    Math.min(204, baseGap + (gapVar > 0 ? (rng() * 2 - 1) * gapVar : 0))
  );
  const initTop =
    margin + rng() * Math.max(20, PLAYABLE_HEIGHT - initGap - margin * 2);
  px[0] = CANVAS_WIDTH + 60;
  pBaseTop[0] = initTop;
  pGap[0] = initGap;
  pTop[0] = initTop;
  pBot[0] = initTop + initGap;
  pPhase[0] = rng() * Math.PI * 2;
  pVy[0] = 0;
  pId[0] = pipeCounter;

  const kernel = new PopulationBatchKernel(brains);
  const frameView = {
    hasNextPipe: false,
    gapTop: PLAYABLE_HEIGHT * 0.35,
    gapBottom: PLAYABLE_HEIGHT * 0.65,
    gapCenter: PLAYABLE_HEIGHT * 0.5,
    pipeEdgeX: CANVAS_WIDTH,
    gapVy: 0,
    next2GapCenter: null as number | null,
    next2GapTop: PLAYABLE_HEIGHT * 0.35,
    next2GapBot: PLAYABLE_HEIGHT * 0.65,
    next2PipeEdgeX: null as number | null,
    next2GapVy: 0,
    tickSpeed: baseSpeed,
    movingPipes,
    pipeHorizHit: false,
    pipeEffY: 0,
    passedFirstPipe: false,
    firstPipeId: 0,
    gravity,
    jumpImpulse,
    useShaped,
  };

  let totalTicks = 0;
  let bestScore = 0;
  let framesRun = 0;

  for (let f = 0; f < maxFrames; f++) {
    if (kernel.aliveCount === 0) break;
    framesRun = f + 1;

    const speedMult =
      speedVar > 0
        ? 1 +
          speedVar *
            (0.55 * Math.sin(framesRun * 0.031 + speedPhaseA) +
              0.45 * Math.cos(framesRun * 0.079 + speedPhaseB))
        : 1;
    const tickSpeed = Math.max(1.2, baseSpeed * speedMult);
    frameView.tickSpeed = tickSpeed;

    distUntilNextSpawn -= tickSpeed;
    if (distUntilNextSpawn <= 0) {
      const slot = (head + count) & 15;
      const pg = Math.max(
        76,
        Math.min(204, baseGap + (gapVar > 0 ? (rng() * 2 - 1) * gapVar : 0))
      );
      const bt =
        margin + rng() * Math.max(20, PLAYABLE_HEIGHT - pg - margin * 2);
      pipeCounter += 1;
      px[slot] = CANVAS_WIDTH + 60;
      pBaseTop[slot] = bt;
      pGap[slot] = pg;
      pTop[slot] = bt;
      pBot[slot] = bt + pg;
      pPhase[slot] = rng() * Math.PI * 2;
      pVy[slot] = 0;
      pId[slot] = pipeCounter;
      count += 1;
      distUntilNextSpawn =
        speedVar > 0 || gapVar > 0
          ? baseSpacing * (0.88 + rng() * 0.24)
          : baseSpacing;
    }

    let nextIdx = -1;
    let next2Idx = -1;
    const oscAngle = framesRun * 0.045;

    for (let k = 0; k < count; k++) {
      const idx = (head + k) & 15;
      const nx = px[idx] - tickSpeed;
      px[idx] = nx;
      if (movingPipes) {
        const prevTop = pTop[idx];
        const pg = pGap[idx];
        let nt = pBaseTop[idx] + Math.sin(oscAngle + pPhase[idx]) * moveAmp;
        const maxTop = PLAYABLE_HEIGHT - pg - 42;
        if (nt < 42) nt = 42;
        else if (nt > maxTop) nt = maxTop;
        pTop[idx] = nt;
        pBot[idx] = nt + pg;
        pVy[idx] = nt - prevTop;
      }
      if (nx + PIPE_WIDTH > BIRD_X - 10) {
        if (nextIdx === -1) nextIdx = idx;
        else if (next2Idx === -1) next2Idx = idx;
      }
    }

    if (count > 0 && px[head] + PIPE_WIDTH < -24) {
      head = (head + 1) & 15;
      count -= 1;
    }

    if (nextIdx !== -1) {
      frameView.hasNextPipe = true;
      const gt = pTop[nextIdx];
      const gb = pBot[nextIdx];
      frameView.gapTop = gt;
      frameView.gapBottom = gb;
      frameView.gapCenter = 0.5 * (gt + gb);
      frameView.pipeEdgeX = px[nextIdx] + PIPE_WIDTH;
      frameView.gapVy = pVy[nextIdx];
      if (next2Idx !== -1) {
        frameView.next2GapCenter = 0.5 * (pTop[next2Idx] + pBot[next2Idx]);
        frameView.next2GapTop = pTop[next2Idx];
        frameView.next2GapBot = pBot[next2Idx];
        frameView.next2PipeEdgeX = px[next2Idx] + PIPE_WIDTH;
        frameView.next2GapVy = pVy[next2Idx];
      } else {
        frameView.next2GapCenter = null;
        frameView.next2GapTop = PLAYABLE_HEIGHT * 0.35;
        frameView.next2GapBot = PLAYABLE_HEIGHT * 0.65;
        frameView.next2PipeEdgeX = null;
        frameView.next2GapVy = 0;
      }
      const pipeLeft = px[nextIdx];
      const pipeRight = pipeLeft + PIPE_WIDTH;
      let dx = 0;
      if (BIRD_X < pipeLeft) dx = pipeLeft - BIRD_X;
      else if (BIRD_X > pipeRight) dx = BIRD_X - pipeRight;
      if (dx < PIPE_HIT_R) {
        frameView.pipeHorizHit = true;
        frameView.pipeEffY =
          dx === 0 ? PIPE_HIT_R : Math.sqrt(Math.max(0, PIPE_HIT_R2 - dx * dx));
      } else {
        frameView.pipeHorizHit = false;
        frameView.pipeEffY = 0;
      }
    } else {
      frameView.hasNextPipe = false;
      frameView.gapTop = PLAYABLE_HEIGHT * 0.35;
      frameView.gapBottom = PLAYABLE_HEIGHT * 0.65;
      frameView.gapCenter = PLAYABLE_HEIGHT * 0.5;
      frameView.pipeEdgeX = CANVAS_WIDTH;
      frameView.gapVy = 0;
      frameView.next2GapCenter = null;
      frameView.next2GapTop = PLAYABLE_HEIGHT * 0.35;
      frameView.next2GapBot = PLAYABLE_HEIGHT * 0.65;
      frameView.next2PipeEdgeX = null;
      frameView.next2GapVy = 0;
      frameView.pipeHorizHit = false;
      frameView.pipeEffY = 0;
    }

    if (count > 0) {
      frameView.firstPipeId = pId[head];
      frameView.passedFirstPipe = px[head] + PIPE_WIDTH < BIRD_X;
    } else {
      frameView.firstPipeId = 0;
      frameView.passedFirstPipe = false;
    }

    const stepRes = kernel.stepSharedFrame(frameView);
    totalTicks += stepRes.evaluatedTicks;
    if (stepRes.maxScore > bestScore) {
      bestScore = stepRes.maxScore;
      if (bestScore >= targetPipeCap) break;
    }
  }

  return {
    scores: kernel.score,
    fitnesses: kernel.fitness,
    totalTicks,
    bestScore,
    framesRun,
  };
}
