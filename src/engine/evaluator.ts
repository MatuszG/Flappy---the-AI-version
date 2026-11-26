import { estimateArchitectureFlops, isReasoningArchitecture, NeuralNetwork } from './neuralNetwork';
import {
  BIRD_RADIUS,
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
import {
  ALL_SENSOR_FEATURES,
  getInputFeatureIndices,
  isFullSensorSet,
} from './sensors';
import type {
  DifficultyPreset,
  EnvironmentConfig,
  FailureAutopsy,
  FailureCause,
  LearningDynamicKind,
  ReasoningTelemetry,
} from './types';

export interface MasteryAuditResult {
  seedScores: number[];
  minSeedScore: number;
  meanSeedScore: number;
  verifiedPerfect: boolean;
  ticksEvaluated: number;
  failureAutopsy?: FailureAutopsy | null;
  reasoningTelemetry?: ReasoningTelemetry | null;
}

interface RingSlab {
  px: Float64Array;
  pBaseTop: Float64Array;
  pGap: Float64Array;
  pTop: Float64Array;
  pBot: Float64Array;
  pPhase: Float64Array;
  pVy: Float64Array;
  pPassed: Uint8Array;
}

const RING_SLAB_POOL: RingSlab[] = [];
const MAX_RING_SLAB_POOL = 64;

function acquireRingSlab(): RingSlab {
  const recycled = RING_SLAB_POOL.pop();
  if (recycled) return recycled;
  const cap = 16;
  return {
    px: new Float64Array(cap),
    pBaseTop: new Float64Array(cap),
    pGap: new Float64Array(cap),
    pTop: new Float64Array(cap),
    pBot: new Float64Array(cap),
    pPhase: new Float64Array(cap),
    pVy: new Float64Array(cap),
    pPassed: new Uint8Array(cap),
  };
}

export function releaseSeedEvaluatorState(st: SeedEvaluatorState): void {
  if (RING_SLAB_POOL.length >= MAX_RING_SLAB_POOL) return;
  RING_SLAB_POOL.push({
    px: st.px,
    pBaseTop: st.pBaseTop,
    pGap: st.pGap,
    pTop: st.pTop,
    pBot: st.pBot,
    pPhase: st.pPhase,
    pVy: st.pVy,
    pPassed: st.pPassed,
  });
}

export interface SeedEvaluatorState {
  env: EnvironmentConfig;
  rng: () => number;
  baseGap: number;
  gapVar: number;
  baseSpeed: number;
  speedVar: number;
  baseSpacing: number;
  movingPipes: boolean;
  moveAmp: number;
  gravity: number;
  jumpImpulse: number;
  speedPhaseA: number;
  speedPhaseB: number;
  px: Float64Array;
  pBaseTop: Float64Array;
  pGap: Float64Array;
  pTop: Float64Array;
  pBot: Float64Array;
  pPhase: Float64Array;
  pVy: Float64Array;
  pPassed: Uint8Array;
  head: number;
  count: number;
  distUntilNextSpawn: number;
  y: number;
  vy: number;
  score: number;
  frameCount: number;
  maxFrames: number;
  targetPipeCap: number;
  done: boolean;
  survivedFull: boolean;
  deathCause: FailureCause;
  deathAbsVy: number;
  deathGapErr: number;
  // Reasoning telemetry accumulators (only active for reasoning architectures)
  reasoningTicks: number;
  ponderSum: number;
  calmTicks: number;
  calmPonderSum: number;
  dangerTicks: number;
  dangerPonderSum: number;
  system2Ticks: number;
  rolloutAdvSum: number;
  ssmGateSum: number;
}

export function createSeedEvaluatorState(
  difficulty: DifficultyPreset,
  targetPipeCap: number,
  seed: number,
  customEnvironment?: EnvironmentConfig,
  envOverride?: EnvironmentConfig
): SeedEvaluatorState {
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

  // Zero-alloc pooled power-of-2 ring buffer (cap = 16 -> & 15 bitmask avoids modulo)
  const { px, pBaseTop, pGap, pTop, pBot, pPhase, pVy, pPassed } =
    acquireRingSlab();

  const st: SeedEvaluatorState = {
    env,
    rng,
    baseGap,
    gapVar,
    baseSpeed,
    speedVar,
    baseSpacing,
    movingPipes,
    moveAmp,
    gravity,
    jumpImpulse,
    speedPhaseA,
    speedPhaseB,
    px,
    pBaseTop,
    pGap,
    pTop,
    pBot,
    pPhase,
    pVy,
    pPassed,
    head: 0,
    count: 0,
    distUntilNextSpawn: baseSpacing,
    y: PLAYABLE_HEIGHT * 0.46,
    vy: 0,
    score: 0,
    frameCount: 0,
    maxFrames: (targetPipeCap + 8) * Math.round(env.spawnFrames * 1.35 + 16),
    targetPipeCap,
    done: false,
    survivedFull: false,
    deathCause: 'NONE',
    deathAbsVy: 0,
    deathGapErr: 0,
    reasoningTicks: 0,
    ponderSum: 0,
    calmTicks: 0,
    calmPonderSum: 0,
    dangerTicks: 0,
    dangerPonderSum: 0,
    system2Ticks: 0,
    rolloutAdvSum: 0,
    ssmGateSum: 0,
  };

  // Spawn initial pipe
  const pipeGap = Math.max(
    76,
    Math.min(204, baseGap + (gapVar > 0 ? (rng() * 2 - 1) * gapVar : 0))
  );
  const margin = movingPipes ? 72 : 52;
  const spanRange = Math.max(20, PLAYABLE_HEIGHT - pipeGap - margin * 2);
  const baseTop = margin + rng() * spanRange;
  px[0] = CANVAS_WIDTH + 60;
  pBaseTop[0] = baseTop;
  pGap[0] = pipeGap;
  pTop[0] = baseTop;
  pBot[0] = baseTop + pipeGap;
  pPhase[0] = rng() * Math.PI * 2;
  pVy[0] = 0;
  pPassed[0] = 0;
  st.count = 1;

  return st;
}

export function advanceSeedEvaluator(
  st: SeedEvaluatorState,
  brain: NeuralNetwork,
  rawBuf: Float64Array,
  subBuf: Float64Array,
  useFullInputs: boolean,
  activeIndices: number[],
  pipeLimit: number
): void {
  if (st.done) return;

  const {
    rng,
    baseGap,
    gapVar,
    baseSpeed,
    speedVar,
    baseSpacing,
    movingPipes,
    moveAmp,
    gravity,
    jumpImpulse,
    speedPhaseA,
    speedPhaseB,
    px,
    pBaseTop,
    pGap,
    pTop,
    pBot,
    pPhase,
    pVy,
    pPassed,
    maxFrames,
    targetPipeCap,
  } = st;

  const hasSpeedVar = speedVar > 0;
  const hasAnyVar = hasSpeedVar || gapVar > 0;
  const margin = movingPipes ? 72 : 52;
  const subLen = subBuf.length;
  const invHalfPlayable = 2 / PLAYABLE_HEIGHT;
  const invMaxVy = 1 / MAX_VY;
  const invCanvasW = 1 / CANVAS_WIDTH;
  const invPipeVy = 1 / MAX_PIPE_VY_NORM;
  const minPipeX = BIRD_X - BIRD_RADIUS;

  let head = st.head;
  let count = st.count;
  let distUntilNextSpawn = st.distUntilNextSpawn;
  let y = st.y;
  let vy = st.vy;
  let score = st.score;
  let frameCount = st.frameCount;

  if (frameCount === 0) {
    brain.resetState();
  }

  const effectiveCap = pipeLimit < targetPipeCap ? pipeLimit : targetPipeCap;

  // Precompute active sensor mask so 1-in..6-in audits never waste cycles computing unused inputs
  const fullCount = ALL_SENSOR_FEATURES.length;
  let sensorMask = (1 << fullCount) - 1;
  const isOnlyBotClear = !useFullInputs && subLen === 1 && activeIndices[0] === 4;
  if (!useFullInputs) {
    sensorMask = 0;
    for (let k = 0; k < subLen; k++) {
      sensorMask |= 1 << activeIndices[k];
    }
  }
  const needLookahead = useFullInputs || (sensorMask & 64) !== 0;
  const evalBuf = useFullInputs ? rawBuf : subBuf;
  const trackReasoning = isReasoningArchitecture(brain.architecture);

  while (frameCount < maxFrames) {
    frameCount += 1;
    let tickSpeed = baseSpeed;
    if (hasSpeedVar) {
      const speedMult =
        1 +
        speedVar *
          (0.55 * Math.sin(frameCount * 0.031 + speedPhaseA) +
            0.45 * Math.cos(frameCount * 0.079 + speedPhaseB));
      const s = baseSpeed * speedMult;
      tickSpeed = s > 1.2 ? s : 1.2;
    }

    distUntilNextSpawn -= tickSpeed;
    if (distUntilNextSpawn <= 0) {
      const tail = (head + count) & 15;
      const pipeGap = Math.max(
        76,
        Math.min(204, baseGap + (gapVar > 0 ? (rng() * 2 - 1) * gapVar : 0))
      );
      const spanRange = PLAYABLE_HEIGHT - pipeGap - margin * 2;
      const baseTop = margin + rng() * (spanRange > 20 ? spanRange : 20);
      px[tail] = CANVAS_WIDTH + 20;
      pBaseTop[tail] = baseTop;
      pGap[tail] = pipeGap;
      pTop[tail] = baseTop;
      pBot[tail] = baseTop + pipeGap;
      pPhase[tail] = rng() * Math.PI * 2;
      pVy[tail] = 0;
      pPassed[tail] = 0;
      count += 1;

      distUntilNextSpawn = hasAnyVar
        ? baseSpacing * (0.88 + rng() * 0.24)
        : baseSpacing;
    }

    let nextIdx = head;
    let foundNext = false;
    let next2Idx = -1;

    if (movingPipes) {
      const timeAngle = frameCount * 0.045;
      for (let k = 0; k < count; k++) {
        const idx = (head + k) & 15;
        px[idx] -= tickSpeed;
        const gSize = pGap[idx];
        const prevTop = pTop[idx];
        const offset = Math.sin(timeAngle + pPhase[idx]) * moveAmp;
        const maxTop = PLAYABLE_HEIGHT - gSize - 42;
        let clamped = pBaseTop[idx] + offset;
        if (clamped < 42) clamped = 42;
        else if (clamped > maxTop) clamped = maxTop;
        pTop[idx] = clamped;
        pBot[idx] = clamped + gSize;
        pVy[idx] = clamped - prevTop;

        if (!foundNext) {
          if (px[idx] + PIPE_WIDTH >= minPipeX) {
            nextIdx = idx;
            foundNext = true;
          }
        } else if (next2Idx === -1) {
          next2Idx = idx;
        }
      }
    } else {
      for (let k = 0; k < count; k++) {
        const idx = (head + k) & 15;
        px[idx] -= tickSpeed;
        if (!foundNext) {
          if (px[idx] + PIPE_WIDTH >= minPipeX) {
            nextIdx = idx;
            foundNext = true;
          }
        } else if (next2Idx === -1) {
          next2Idx = idx;
        }
      }
    }

    if (count > 0 && px[head] + PIPE_WIDTH < -24) {
      head = (head + 1) & 15;
      count -= 1;
    }

    const gapTop = foundNext ? pTop[nextIdx] : PLAYABLE_HEIGHT * 0.35;
    const gapBot = foundNext ? pBot[nextIdx] : PLAYABLE_HEIGHT * 0.65;
    const hasNext2 = foundNext && next2Idx !== -1;

    if (isOnlyBotClear) {
      subBuf[0] = (gapBot - y) * invHalfPlayable;
    } else if (useFullInputs) {
      const pipeEdgeX = foundNext ? px[nextIdx] + PIPE_WIDTH : CANVAS_WIDTH;
      const gapVyVal = foundNext && movingPipes ? pVy[nextIdx] * invPipeVy : 0;
      rawBuf[0] = y * invHalfPlayable - 1;
      const vyNorm = vy * invMaxVy;
      rawBuf[1] = vyNorm < -1 ? -1 : vyNorm > 1 ? 1 : vyNorm;
      const distNorm = (pipeEdgeX - BIRD_X) * invCanvasW;
      rawBuf[2] = distNorm < -0.2 ? -0.2 : distNorm > 1 ? 1 : distNorm;
      rawBuf[3] = (y - gapTop) * invHalfPlayable;
      rawBuf[4] = (gapBot - y) * invHalfPlayable;
      rawBuf[5] = gapVyVal < -1 ? -1 : gapVyVal > 1 ? 1 : gapVyVal;
      if (hasNext2) {
        const n2Dy =
          ((pTop[next2Idx] + pBot[next2Idx] - (gapTop + gapBot)) * 0.5) *
          invHalfPlayable;
        rawBuf[6] = n2Dy < -1 ? -1 : n2Dy > 1 ? 1 : n2Dy;
        rawBuf[7] = (y - pTop[next2Idx]) * invHalfPlayable;
        rawBuf[8] = (pBot[next2Idx] - y) * invHalfPlayable;
        const n2Dx = (px[next2Idx] + PIPE_WIDTH - BIRD_X) * invCanvasW;
        rawBuf[9] = n2Dx < -0.2 ? -0.2 : n2Dx > 1 ? 1 : n2Dx;
        const n2Vy = movingPipes ? pVy[next2Idx] * invPipeVy : 0;
        rawBuf[10] = n2Vy < -1 ? -1 : n2Vy > 1 ? 1 : n2Vy;
      } else {
        rawBuf[6] = 0;
        rawBuf[7] = 0;
        rawBuf[8] = 0;
        rawBuf[9] = 1.0;
        rawBuf[10] = 0;
      }
      if (foundNext) {
        const ttf = (pipeEdgeX - BIRD_X) / (tickSpeed * 120);
        rawBuf[11] = ttf < 0 ? 0 : ttf > 1 ? 1 : ttf;
      } else {
        rawBuf[11] = 1.0;
      }
    } else {
      if (sensorMask & 1) rawBuf[0] = y * invHalfPlayable - 1;
      if (sensorMask & 2) {
        const vyNorm = vy * invMaxVy;
        rawBuf[1] = vyNorm < -1 ? -1 : vyNorm > 1 ? 1 : vyNorm;
      }
      if (sensorMask & 4) {
        const pipeEdgeX = foundNext ? px[nextIdx] + PIPE_WIDTH : CANVAS_WIDTH;
        const distNorm = (pipeEdgeX - BIRD_X) * invCanvasW;
        rawBuf[2] = distNorm < -0.2 ? -0.2 : distNorm > 1 ? 1 : distNorm;
      }
      if (sensorMask & 8) rawBuf[3] = (y - gapTop) * invHalfPlayable;
      if (sensorMask & 16) rawBuf[4] = (gapBot - y) * invHalfPlayable;
      if (sensorMask & 32) {
        const gapVyVal = foundNext && movingPipes ? pVy[nextIdx] * invPipeVy : 0;
        rawBuf[5] = gapVyVal < -1 ? -1 : gapVyVal > 1 ? 1 : gapVyVal;
      }
      if (needLookahead) {
        if (hasNext2) {
          const n2Dy =
            ((pTop[next2Idx] + pBot[next2Idx] - (gapTop + gapBot)) * 0.5) *
            invHalfPlayable;
          rawBuf[6] = n2Dy < -1 ? -1 : n2Dy > 1 ? 1 : n2Dy;
        } else {
          rawBuf[6] = 0;
        }
      }
      if (sensorMask & 128) {
        rawBuf[7] = hasNext2 ? (y - pTop[next2Idx]) * invHalfPlayable : 0;
      }
      if (sensorMask & 256) {
        rawBuf[8] = hasNext2 ? (pBot[next2Idx] - y) * invHalfPlayable : 0;
      }
      if (sensorMask & 512) {
        if (hasNext2) {
          const n2Dx = (px[next2Idx] + PIPE_WIDTH - BIRD_X) * invCanvasW;
          rawBuf[9] = n2Dx < -0.2 ? -0.2 : n2Dx > 1 ? 1 : n2Dx;
        } else {
          rawBuf[9] = 1.0;
        }
      }
      if (sensorMask & 1024) {
        if (hasNext2 && movingPipes) {
          const n2Vy = pVy[next2Idx] * invPipeVy;
          rawBuf[10] = n2Vy < -1 ? -1 : n2Vy > 1 ? 1 : n2Vy;
        } else {
          rawBuf[10] = 0;
        }
      }
      if (sensorMask & 2048) {
        if (foundNext) {
          const pipeEdgeX = px[nextIdx] + PIPE_WIDTH;
          const ttf = (pipeEdgeX - BIRD_X) / (tickSpeed * 120);
          rawBuf[11] = ttf < 0 ? 0 : ttf > 1 ? 1 : ttf;
        } else {
          rawBuf[11] = 1.0;
        }
      }
      for (let k = 0; k < subLen; k++) {
        subBuf[k] = rawBuf[activeIndices[k]];
      }
    }

    if (brain.shouldFlap(evalBuf)) {
      vy = jumpImpulse;
    }

    if (trackReasoning) {
      const steps = brain.lastPonderSteps;
      st.reasoningTicks += 1;
      st.ponderSum += steps;
      if (steps >= 2) st.system2Ticks += 1;
      const pipeEdgeDist = foundNext
        ? (px[nextIdx] + PIPE_WIDTH - BIRD_X) * invCanvasW
        : 1.0;
      const isDanger = pipeEdgeDist <= 0.34 || (movingPipes && Math.abs(pVy[nextIdx]) > 0.6);
      if (isDanger) {
        st.dangerTicks += 1;
        st.dangerPonderSum += steps;
      } else {
        st.calmTicks += 1;
        st.calmPonderSum += steps;
      }
      st.rolloutAdvSum += Math.abs(brain.lastRolloutAdvantage);
      st.ssmGateSum += brain.lastSsmGateMean;
    }

    vy += gravity;
    if (vy > MAX_VY) vy = MAX_VY;
    y += vy;

    if (y - FLOOR_HIT_R <= 0 || y + FLOOR_HIT_R >= PLAYABLE_HEIGHT) {
      st.done = true;
      st.survivedFull = false;
      st.deathCause = y - FLOOR_HIT_R <= 0 ? 'CEILING' : 'FLOOR';
      st.deathAbsVy = Math.abs(vy);
      st.deathGapErr = Math.abs(y - 0.5 * (gapTop + gapBot));
      break;
    }

    if (foundNext) {
      const pipeLeft = px[nextIdx];
      const pipeRight = pipeLeft + PIPE_WIDTH;
      let dx = 0;
      if (BIRD_X < pipeLeft) dx = pipeLeft - BIRD_X;
      else if (BIRD_X > pipeRight) dx = BIRD_X - pipeRight;
      if (dx < PIPE_HIT_R) {
        const topLim = pTop[nextIdx];
        const botLim = pBot[nextIdx];
        if (y <= topLim || y >= botLim) {
          st.done = true;
          st.survivedFull = false;
          st.deathCause = y <= topLim ? 'PIPE_TOP' : 'PIPE_BOTTOM';
          st.deathAbsVy = Math.abs(vy);
          st.deathGapErr = Math.abs(y - 0.5 * (topLim + botLim));
          break;
        }
        if (y - PIPE_HIT_R < topLim || y + PIPE_HIT_R > botLim) {
          const effY = dx === 0 ? PIPE_HIT_R : Math.sqrt(PIPE_HIT_R2 - dx * dx);
          if (y - effY < topLim || y + effY > botLim) {
            st.done = true;
            st.survivedFull = false;
            st.deathCause = y - effY < topLim ? 'PIPE_TOP' : 'PIPE_BOTTOM';
            st.deathAbsVy = Math.abs(vy);
            st.deathGapErr = Math.abs(y - 0.5 * (topLim + botLim));
            break;
          }
        }
      }
    }

    if (count > 0 && pPassed[head] === 0 && px[head] + PIPE_WIDTH < BIRD_X) {
      pPassed[head] = 1;
      score += 1;
      if (score >= targetPipeCap) {
        st.done = true;
        st.survivedFull = true;
        break;
      }
      if (score >= effectiveCap) {
        break;
      }
    }
  }

  if (!st.done && frameCount >= maxFrames) {
    st.done = true;
    st.survivedFull = score >= targetPipeCap;
  }

  st.head = head;
  st.count = count;
  st.distUntilNextSpawn = distUntilNextSpawn;
  st.y = y;
  st.vy = vy;
  st.score = score;
  st.frameCount = frameCount;
}

/**
 * Ultra-fast zero-allocation single-bird evaluator across deterministic unseen pipe courses.
 */
export function evaluateBrainOnSeed(
  brain: NeuralNetwork,
  difficulty: DifficultyPreset,
  targetPipeCap: number,
  seed: number,
  customEnvironment?: EnvironmentConfig
): { score: number; ticks: number; survivedFull: boolean } {
  const st = createSeedEvaluatorState(
    difficulty,
    targetPipeCap,
    seed,
    customEnvironment
  );
  const rawBuf = new Float64Array(ALL_SENSOR_FEATURES.length);
  const useFullInputs =
    brain.inputNodes === ALL_SENSOR_FEATURES.length &&
    isFullSensorSet(brain.inputFeatures);
  const activeIndices = useFullInputs
    ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    : getInputFeatureIndices(brain.inputFeatures);
  const subBuf = useFullInputs ? rawBuf : new Float64Array(brain.inputNodes);

  advanceSeedEvaluator(
    st,
    brain,
    rawBuf,
    subBuf,
    useFullInputs,
    activeIndices,
    targetPipeCap
  );

  return { score: st.score, ticks: st.frameCount, survivedFull: st.survivedFull };
}

/**
 * Exact f64 single-bird training rollout with full fitness accumulation.
 * Supports optional shaped survival fitness and curriculum environment overrides.
 */
export function evaluateBirdTrainingEpisode(
  brain: NeuralNetwork,
  difficulty: DifficultyPreset,
  targetPipeCap: number,
  seed: number,
  customEnvironment?: EnvironmentConfig,
  options?: {
    shapedFitness?: boolean;
    trainingEnvOverride?: EnvironmentConfig;
    metabolicStepCost?: number;
    flopsPenaltyWeight?: number;
  }
): { score: number; fitness: number; ticks: number; survivedFull: boolean } {
  brain.resetState();
  const st = createSeedEvaluatorState(
    difficulty,
    targetPipeCap,
    seed,
    customEnvironment,
    options?.trainingEnvOverride
  );
  const shapedFitness = Boolean(options?.shapedFitness);
  const metabolicStepCost =
    brain.architecture === 'PONDER_ACT'
      ? Math.max(0, options?.metabolicStepCost ?? 0)
      : 0;
  const flopsPenaltyWeight = Math.max(0, options?.flopsPenaltyWeight ?? 0);
  const baselineMlpFlops =
    flopsPenaltyWeight > 0
      ? estimateArchitectureFlops(brain.hiddenLayers, brain.inputNodes, 'MLP', 1)
      : 0;
  const excessFlopsPerFrameCost =
    flopsPenaltyWeight > 0
      ? Math.max(0, (brain.estimateFlopsPerFrame() - baselineMlpFlops) / 100) *
        flopsPenaltyWeight
      : 0;
  const rawBuf = new Float64Array(ALL_SENSOR_FEATURES.length);
  const useFullInputs =
    brain.inputNodes === ALL_SENSOR_FEATURES.length &&
    isFullSensorSet(brain.inputFeatures);
  const activeIndices = useFullInputs
    ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    : getInputFeatureIndices(brain.inputFeatures);
  let sensorMask = 0;
  for (let i = 0; i < activeIndices.length; i++) {
    sensorMask |= 1 << activeIndices[i];
  }
  const isOnlyBotClear = activeIndices.length === 1 && activeIndices[0] === 4;
  const subBuf = useFullInputs ? rawBuf : new Float64Array(brain.inputNodes);
  const evalBuf = useFullInputs ? rawBuf : subBuf;

  const {
    rng,
    baseGap,
    gapVar,
    baseSpeed,
    speedVar,
    baseSpacing,
    movingPipes,
    moveAmp,
    gravity,
    jumpImpulse,
    speedPhaseA,
    speedPhaseB,
    px,
    pBaseTop,
    pGap,
    pTop,
    pBot,
    pPhase,
    pVy,
    pPassed,
    maxFrames,
  } = st;

  const hasSpeedVar = speedVar > 0;
  const hasGapVar = gapVar > 0;
  const hasAnyVar = hasSpeedVar || hasGapVar;
  const margin = movingPipes ? 72 : 52;
  const minPipeX = BIRD_X - BIRD_RADIUS;
  const invHalfPlayable = 2 / PLAYABLE_HEIGHT;
  const invMaxVy = 1 / MAX_VY;
  const invCanvasW = 1 / CANVAS_WIDTH;
  const invAlignWindow = 1 / (PLAYABLE_HEIGHT * 0.6);
  const pipeHitR = PIPE_HIT_R;
  const pipeHitR2 = PIPE_HIT_R2;
  const floorHitR = FLOOR_HIT_R;
  const TWO_PI = Math.PI * 2;

  let head = st.head;
  let count = st.count;
  let distUntilNextSpawn = st.distUntilNextSpawn;
  let y = st.y;
  let vy = st.vy;
  let score = 0;
  let fitness = 0;
  let frameCount = 0;
  let survivedFull = false;

  while (frameCount < maxFrames) {
    frameCount += 1;

    let tickSpeed = baseSpeed;
    if (hasSpeedVar) {
      const speedMult =
        1 +
        speedVar *
          (0.55 * Math.sin(frameCount * 0.031 + speedPhaseA) +
            0.45 * Math.cos(frameCount * 0.079 + speedPhaseB));
      tickSpeed = Math.max(1.2, baseSpeed * speedMult);
    }

    distUntilNextSpawn -= tickSpeed;
    if (distUntilNextSpawn <= 0 && count < 15) {
      const tail = (head + count) & 15;
      const pipeGap = Math.max(
        76,
        Math.min(204, baseGap + (hasGapVar ? (rng() * 2 - 1) * gapVar : 0))
      );
      const spanRange = Math.max(20, PLAYABLE_HEIGHT - pipeGap - margin * 2);
      const baseTop = margin + rng() * spanRange;
      px[tail] = CANVAS_WIDTH + 20;
      pBaseTop[tail] = baseTop;
      pGap[tail] = pipeGap;
      pTop[tail] = baseTop;
      pBot[tail] = baseTop + pipeGap;
      pPhase[tail] = rng() * TWO_PI;
      pVy[tail] = 0;
      pPassed[tail] = 0;
      count += 1;
      distUntilNextSpawn = hasAnyVar
        ? baseSpacing * (0.88 + rng() * 0.24)
        : baseSpacing;
    }

    let nextIdx = -1;
    let next2Idx = -1;
    if (movingPipes) {
      const timeAngle = frameCount * 0.045;
      for (let k = 0; k < count; k++) {
        const idx = (head + k) & 15;
        px[idx] -= tickSpeed;
        const gSize = pGap[idx];
        const prevTop = pTop[idx];
        const offset = Math.sin(timeAngle + pPhase[idx]) * moveAmp;
        const maxTop = PLAYABLE_HEIGHT - gSize - 42;
        const clamped = Math.max(42, Math.min(maxTop, pBaseTop[idx] + offset));
        pTop[idx] = clamped;
        pBot[idx] = clamped + gSize;
        pVy[idx] = clamped - prevTop;
        if (nextIdx === -1) {
          if (px[idx] + PIPE_WIDTH >= minPipeX) nextIdx = idx;
        } else if (next2Idx === -1) {
          next2Idx = idx;
        }
      }
    } else {
      for (let k = 0; k < count; k++) {
        const idx = (head + k) & 15;
        px[idx] -= tickSpeed;
        if (nextIdx === -1) {
          if (px[idx] + PIPE_WIDTH >= minPipeX) nextIdx = idx;
        } else if (next2Idx === -1) {
          next2Idx = idx;
        }
      }
    }

    if (count > 0 && px[head] + PIPE_WIDTH < -24) {
      head = (head + 1) & 15;
      count -= 1;
    }

    const gapTop = nextIdx !== -1 ? pTop[nextIdx] : PLAYABLE_HEIGHT * 0.35;
    const gapBot = nextIdx !== -1 ? pBot[nextIdx] : PLAYABLE_HEIGHT * 0.65;
    const hasNext2Ep = nextIdx !== -1 && next2Idx !== -1;

    if (isOnlyBotClear) {
      subBuf[0] = (gapBot - y) * invHalfPlayable;
    } else if (useFullInputs) {
      const pipeEdgeX = nextIdx !== -1 ? px[nextIdx] + PIPE_WIDTH : CANVAS_WIDTH;
      const gapVyVal = nextIdx !== -1 && movingPipes ? pVy[nextIdx] * 0.5 : 0;
      const vyNorm = vy * invMaxVy;
      const distNorm = (pipeEdgeX - BIRD_X) * invCanvasW;
      rawBuf[0] = y * invHalfPlayable - 1;
      rawBuf[1] = vyNorm < -1 ? -1 : vyNorm > 1 ? 1 : vyNorm;
      rawBuf[2] = distNorm < -0.2 ? -0.2 : distNorm > 1 ? 1 : distNorm;
      rawBuf[3] = (y - gapTop) * invHalfPlayable;
      rawBuf[4] = (gapBot - y) * invHalfPlayable;
      rawBuf[5] = gapVyVal < -1 ? -1 : gapVyVal > 1 ? 1 : gapVyVal;
      if (hasNext2Ep) {
        const n2Dy =
          ((pTop[next2Idx] + pBot[next2Idx] - (gapTop + gapBot)) * 0.5) *
          invHalfPlayable;
        rawBuf[6] = n2Dy < -1 ? -1 : n2Dy > 1 ? 1 : n2Dy;
        rawBuf[7] = (y - pTop[next2Idx]) * invHalfPlayable;
        rawBuf[8] = (pBot[next2Idx] - y) * invHalfPlayable;
        const n2Dx = (px[next2Idx] + PIPE_WIDTH - BIRD_X) * invCanvasW;
        rawBuf[9] = n2Dx < -0.2 ? -0.2 : n2Dx > 1 ? 1 : n2Dx;
        const n2Vy = movingPipes ? pVy[next2Idx] * 0.5 : 0;
        rawBuf[10] = n2Vy < -1 ? -1 : n2Vy > 1 ? 1 : n2Vy;
      } else {
        rawBuf[6] = 0;
        rawBuf[7] = 0;
        rawBuf[8] = 0;
        rawBuf[9] = 1.0;
        rawBuf[10] = 0;
      }
      if (nextIdx !== -1) {
        const ttf = (pipeEdgeX - BIRD_X) / (tickSpeed * 120);
        rawBuf[11] = ttf < 0 ? 0 : ttf > 1 ? 1 : ttf;
      } else {
        rawBuf[11] = 1.0;
      }
    } else {
      if (sensorMask & 1) rawBuf[0] = y * invHalfPlayable - 1;
      if (sensorMask & 2) {
        const vyNorm = vy * invMaxVy;
        rawBuf[1] = vyNorm < -1 ? -1 : vyNorm > 1 ? 1 : vyNorm;
      }
      if (sensorMask & 4) {
        const pipeEdgeX = nextIdx !== -1 ? px[nextIdx] + PIPE_WIDTH : CANVAS_WIDTH;
        const distNorm = (pipeEdgeX - BIRD_X) * invCanvasW;
        rawBuf[2] = distNorm < -0.2 ? -0.2 : distNorm > 1 ? 1 : distNorm;
      }
      if (sensorMask & 8) rawBuf[3] = (y - gapTop) * invHalfPlayable;
      if (sensorMask & 16) rawBuf[4] = (gapBot - y) * invHalfPlayable;
      if (sensorMask & 32) {
        const gapVyVal = nextIdx !== -1 && movingPipes ? pVy[nextIdx] * 0.5 : 0;
        rawBuf[5] = gapVyVal < -1 ? -1 : gapVyVal > 1 ? 1 : gapVyVal;
      }
      if (sensorMask & 64) {
        if (hasNext2Ep) {
          const n2Dy =
            ((pTop[next2Idx] + pBot[next2Idx] - (gapTop + gapBot)) * 0.5) *
            invHalfPlayable;
          rawBuf[6] = n2Dy < -1 ? -1 : n2Dy > 1 ? 1 : n2Dy;
        } else {
          rawBuf[6] = 0;
        }
      }
      if (sensorMask & 128) {
        rawBuf[7] = hasNext2Ep ? (y - pTop[next2Idx]) * invHalfPlayable : 0;
      }
      if (sensorMask & 256) {
        rawBuf[8] = hasNext2Ep ? (pBot[next2Idx] - y) * invHalfPlayable : 0;
      }
      if (sensorMask & 512) {
        if (hasNext2Ep) {
          const n2Dx = (px[next2Idx] + PIPE_WIDTH - BIRD_X) * invCanvasW;
          rawBuf[9] = n2Dx < -0.2 ? -0.2 : n2Dx > 1 ? 1 : n2Dx;
        } else {
          rawBuf[9] = 1.0;
        }
      }
      if (sensorMask & 1024) {
        if (hasNext2Ep && movingPipes) {
          const n2Vy = pVy[next2Idx] * 0.5;
          rawBuf[10] = n2Vy < -1 ? -1 : n2Vy > 1 ? 1 : n2Vy;
        } else {
          rawBuf[10] = 0;
        }
      }
      if (sensorMask & 2048) {
        if (nextIdx !== -1) {
          const pipeEdgeX = px[nextIdx] + PIPE_WIDTH;
          const ttf = (pipeEdgeX - BIRD_X) / (tickSpeed * 120);
          rawBuf[11] = ttf < 0 ? 0 : ttf > 1 ? 1 : ttf;
        } else {
          rawBuf[11] = 1.0;
        }
      }
      for (let i = 0; i < activeIndices.length; i++) {
        subBuf[i] = rawBuf[activeIndices[i]];
      }
    }

    if (brain.shouldFlapFast(evalBuf)) {
      vy = jumpImpulse;
    }

    const nextVy = vy + gravity;
    vy = nextVy > MAX_VY ? MAX_VY : nextVy;
    y += vy;

    if (y - floorHitR <= 0 || y + floorHitR >= PLAYABLE_HEIGHT) {
      if (score === 0) fitness *= 0.85;
      break;
    }

    if (nextIdx !== -1) {
      const pipeLeft = px[nextIdx];
      const pipeRight = pipeLeft + PIPE_WIDTH;
      let dx = 0;
      if (BIRD_X < pipeLeft) dx = pipeLeft - BIRD_X;
      else if (BIRD_X > pipeRight) dx = BIRD_X - pipeRight;
      if (dx < pipeHitR) {
        if (y - pipeHitR < gapTop || y + pipeHitR > gapBot) {
          const effY =
            dx === 0 ? pipeHitR : Math.sqrt(Math.max(0, pipeHitR2 - dx * dx));
          if (y - effY < gapTop || y + effY > gapBot) {
            break;
          }
        }
      }
    }

    fitness += 0.1;
    if (nextIdx !== -1) {
      const gapCenter = 0.5 * (gapTop + gapBot);
      const absDy = Math.abs(y - gapCenter);
      if (shapedFitness) {
        // Dense smooth centering + safe margin + low-jerk survival shaping
        const gapHalf = Math.max(24, 0.5 * (gapBot - gapTop));
        const normErr = absDy / (gapHalf * 0.9);
        const centerReward = 0.42 / (1 + normErr * normErr);
        const insideCorridor = y > gapTop + 14 && y < gapBot - 14 ? 0.12 : 0;
        const jerkPenalty = 0.035 * Math.abs(vy) * invMaxVy;
        fitness += Math.max(0, centerReward + insideCorridor - jerkPenalty);
      } else {
        const align = Math.max(0, 1 - absDy * invAlignWindow);
        fitness += 0.15 * align;
      }
    }
    if (metabolicStepCost > 0 && brain.lastPonderSteps > 1) {
      fitness = Math.max(0, fitness - metabolicStepCost * (brain.lastPonderSteps - 1));
    }
    if (excessFlopsPerFrameCost > 0) {
      fitness = Math.max(0, fitness - excessFlopsPerFrameCost);
    }

    for (let k = 0; k < count; k++) {
      const idx = (head + k) & 15;
      if (pPassed[idx] === 0 && px[idx] + PIPE_WIDTH < BIRD_X) {
        pPassed[idx] = 1;
        score += 1;
        fitness += 40;
        if (score >= targetPipeCap) {
          survivedFull = true;
          break;
        }
      }
    }
    if (survivedFull) break;
  }

  return { score, fitness, ticks: frameCount, survivedFull };
}

function aggregateAuditDiagnostics(
  states: readonly SeedEvaluatorState[],
  isReasoning: boolean,
  bestTrainScore = 0,
  minSeedScore = 0
): {
  failureAutopsy: FailureAutopsy;
  reasoningTelemetry: ReasoningTelemetry | null;
} {
  let totalDeaths = 0;
  let floorDeaths = 0;
  let ceilingDeaths = 0;
  let pipeTopDeaths = 0;
  let pipeBottomDeaths = 0;
  let sumVy = 0;
  let sumErr = 0;

  let rTicks = 0;
  let pSum = 0;
  let cTicks = 0;
  let cPSum = 0;
  let dTicks = 0;
  let dPSum = 0;
  let s2Ticks = 0;
  let rollSum = 0;
  let ssmSum = 0;

  for (let i = 0; i < states.length; i++) {
    const st = states[i];
    if (st.deathCause !== 'NONE') {
      totalDeaths += 1;
      if (st.deathCause === 'FLOOR') floorDeaths += 1;
      else if (st.deathCause === 'CEILING') ceilingDeaths += 1;
      else if (st.deathCause === 'PIPE_TOP') pipeTopDeaths += 1;
      else if (st.deathCause === 'PIPE_BOTTOM') pipeBottomDeaths += 1;
      sumVy += st.deathAbsVy;
      sumErr += st.deathGapErr;
    }
    if (isReasoning) {
      rTicks += st.reasoningTicks;
      pSum += st.ponderSum;
      cTicks += st.calmTicks;
      cPSum += st.calmPonderSum;
      dTicks += st.dangerTicks;
      dPSum += st.dangerPonderSum;
      s2Ticks += st.system2Ticks;
      rollSum += st.rolloutAdvSum;
      ssmSum += st.ssmGateSum;
    }
  }

  let dominantFailure: FailureCause = 'NONE';
  let domCount = 0;
  const pairs: [FailureCause, number][] = [
    ['PIPE_TOP', pipeTopDeaths],
    ['PIPE_BOTTOM', pipeBottomDeaths],
    ['FLOOR', floorDeaths],
    ['CEILING', ceilingDeaths],
  ];
  for (const [cause, cnt] of pairs) {
    if (cnt > domCount) {
      domCount = cnt;
      dominantFailure = cause;
    }
  }

  const failureAutopsy: FailureAutopsy = {
    totalDeaths,
    floorDeaths,
    ceilingDeaths,
    pipeTopDeaths,
    pipeBottomDeaths,
    avgDeathAbsVy: totalDeaths > 0 ? Number((sumVy / totalDeaths).toFixed(2)) : 0,
    avgDeathGapErr: totalDeaths > 0 ? Number((sumErr / totalDeaths).toFixed(1)) : 0,
    dominantFailure,
    generalizationGap: Math.max(0, Math.round(bestTrainScore - minSeedScore)),
  };

  const reasoningTelemetry: ReasoningTelemetry | null =
    isReasoning && rTicks > 0
      ? {
          avgPonderSteps: Number((pSum / rTicks).toFixed(3)),
          calmPonderSteps: cTicks > 0 ? Number((cPSum / cTicks).toFixed(3)) : 1,
          dangerPonderSteps: dTicks > 0 ? Number((dPSum / dTicks).toFixed(3)) : 1,
          system2Ratio: Number((s2Ticks / rTicks).toFixed(3)),
          avgRolloutAdvantage: Number((rollSum / rTicks).toFixed(3)),
          avgSsmGate: Number((ssmSum / rTicks).toFixed(3)),
        }
      : null;

  return { failureAutopsy, reasoningTelemetry };
}

/**
 * Classifies the training curve dynamics (G1 Instant, Smooth Climb, Late Phase-Transition / Grokking,
 * Plateau, or Overfit Collapse) for AI Delta-Digest pattern mining.
 */
export function classifyLearningDynamic(
  scoreCurve: readonly number[],
  bestTrainScore: number,
  minSeedScore: number,
  verifiedPerfect: boolean
): LearningDynamicKind {
  if (verifiedPerfect && scoreCurve.length <= 2) return 'G1_INSTANT';
  if (bestTrainScore >= 30 && minSeedScore < bestTrainScore * 0.25) {
    return 'OVERFIT_COLLAPSE';
  }
  if (scoreCurve.length >= 8) {
    const midIdx = Math.floor(scoreCurve.length * 0.55);
    const earlyMax = Math.max(...scoreCurve.slice(0, midIdx));
    const lateMax = Math.max(...scoreCurve.slice(midIdx));
    if (lateMax >= Math.max(15, earlyMax * 2.4)) {
      return 'PHASE_TRANSITION';
    }
    const tail = scoreCurve.slice(-5);
    const tailSpread = Math.max(...tail) - Math.min(...tail);
    if (!verifiedPerfect && tailSpread <= 2 && lateMax <= earlyMax + 2) {
      return 'PLATEAU';
    }
  }
  return 'SMOOTH_CLIMB';
}

/**
 * Multi-seed mastery auditor with Lockstep Chunked Fail-Fast, zero-alloc slab pooling,
 * Failure Autopsy, and Reasoning Telemetry.
 * INVARIANT: Always evaluates on 100% unmodified target physics (never curriculum).
 */
export function auditBrainMastery(
  brain: NeuralNetwork,
  difficulty: DifficultyPreset,
  targetPipeCap: number,
  numSeeds: number,
  customEnvironment?: EnvironmentConfig,
  failFast = false,
  bestTrainScore = 0
): MasteryAuditResult {
  if (numSeeds <= 0) {
    return {
      seedScores: [],
      minSeedScore: 0,
      meanSeedScore: 0,
      verifiedPerfect: false,
      ticksEvaluated: 0,
      failureAutopsy: null,
      reasoningTelemetry: null,
    };
  }

  const rawBuf = new Float64Array(ALL_SENSOR_FEATURES.length);
  const useFullInputs =
    brain.inputNodes === ALL_SENSOR_FEATURES.length &&
    isFullSensorSet(brain.inputFeatures);
  const activeIndices = useFullInputs
    ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    : getInputFeatureIndices(brain.inputFeatures);
  const subBuf = useFullInputs ? rawBuf : new Float64Array(brain.inputNodes);
  const isReasoning = isReasoningArchitecture(brain.architecture);

  if (failFast && numSeeds > 1 && targetPipeCap > 96) {
    const isStateful =
      brain.architecture === 'LTC_FLY' ||
      brain.architecture === 'NEUROCHEM_GATE' ||
      brain.architecture === 'SYNAPTIC_STP' ||
      brain.architecture === 'SELECTIVE_SSM' ||
      brain.architecture === 'DROSOPHILA_CONNECTOME' ||
      brain.architecture === 'DECOUPLED_FLY_CORTEX';
    const states: SeedEvaluatorState[] = [];
    const seedBrains: NeuralNetwork[] = [];
    for (let s = 0; s < numSeeds; s++) {
      states.push(
        createSeedEvaluatorState(
          difficulty,
          targetPipeCap,
          1009 + s * 7919,
          customEnvironment
        )
      );
      seedBrains.push(isStateful ? brain.clone() : brain);
    }

    const stages: number[] = [];
    if (targetPipeCap > 64) stages.push(64);
    if (targetPipeCap > 256) stages.push(256);
    if (targetPipeCap > 1024) stages.push(1024);
    stages.push(targetPipeCap);

    let failed = false;
    for (const cap of stages) {
      for (let s = 0; s < numSeeds; s++) {
        advanceSeedEvaluator(
          states[s],
          seedBrains[s],
          rawBuf,
          subBuf,
          useFullInputs,
          activeIndices,
          cap
        );
        if (states[s].done && !states[s].survivedFull) {
          failed = true;
          break;
        }
      }
      if (failed) break;
    }

    const seedScores: number[] = [];
    let minSeedScore = Infinity;
    let sum = 0;
    let totalTicks = 0;
    let allSurvived = !failed;

    for (let s = 0; s < numSeeds; s++) {
      const st = states[s];
      totalTicks += st.frameCount;
      if (st.frameCount > 0) {
        seedScores.push(st.score);
        sum += st.score;
        if (st.score < minSeedScore) minSeedScore = st.score;
      }
      if (!st.survivedFull) allSurvived = false;
    }

    const finalMin = seedScores.length > 0 ? minSeedScore : 0;
    const { failureAutopsy, reasoningTelemetry } = aggregateAuditDiagnostics(
      states,
      isReasoning,
      bestTrainScore,
      finalMin
    );
    for (let s = 0; s < states.length; s++) releaseSeedEvaluatorState(states[s]);

    return {
      seedScores,
      minSeedScore: finalMin,
      meanSeedScore:
        seedScores.length > 0 ? Number((sum / seedScores.length).toFixed(1)) : 0,
      verifiedPerfect: allSurvived && seedScores.length === numSeeds,
      ticksEvaluated: totalTicks,
      failureAutopsy,
      reasoningTelemetry,
    };
  }

  const seedScores: number[] = [];
  const executedStates: SeedEvaluatorState[] = [];
  let minSeedScore = Infinity;
  let sum = 0;
  let totalTicks = 0;
  let allSurvived = true;

  for (let s = 0; s < numSeeds; s++) {
    const seed = 1009 + s * 7919;
    const st = createSeedEvaluatorState(
      difficulty,
      targetPipeCap,
      seed,
      customEnvironment
    );
    advanceSeedEvaluator(
      st,
      brain,
      rawBuf,
      subBuf,
      useFullInputs,
      activeIndices,
      targetPipeCap
    );
    executedStates.push(st);
    seedScores.push(st.score);
    sum += st.score;
    totalTicks += st.frameCount;
    if (st.score < minSeedScore) minSeedScore = st.score;
    if (!st.survivedFull) {
      allSurvived = false;
      if (failFast) {
        break;
      }
    }
  }

  const finalMin = seedScores.length > 0 ? minSeedScore : 0;
  const { failureAutopsy, reasoningTelemetry } = aggregateAuditDiagnostics(
    executedStates,
    isReasoning,
    bestTrainScore,
    finalMin
  );
  for (let s = 0; s < executedStates.length; s++) {
    releaseSeedEvaluatorState(executedStates[s]);
  }

  return {
    seedScores,
    minSeedScore: finalMin,
    meanSeedScore:
      seedScores.length > 0 ? Number((sum / seedScores.length).toFixed(1)) : 0,
    verifiedPerfect: allSurvived && seedScores.length === numSeeds && numSeeds > 0,
    ticksEvaluated: totalTicks,
    failureAutopsy,
    reasoningTelemetry,
  };
}

/**
 * Self-Consistency Majority-Voting Ensemble Auditor (Weak-to-Strong Collective Reasoning).
 * Steps M independent brains in lockstep on exact Float64 target physics and flaps iff
 * strict majority (> M/2) votes to flap.
 */
export function auditEnsembleMastery(
  brains: readonly NeuralNetwork[],
  difficulty: DifficultyPreset,
  targetPipeCap: number,
  numSeeds: number,
  customEnvironment?: EnvironmentConfig
): MasteryAuditResult {
  if (brains.length === 0 || numSeeds <= 0) {
    return {
      seedScores: [],
      minSeedScore: 0,
      meanSeedScore: 0,
      verifiedPerfect: false,
      ticksEvaluated: 0,
    };
  }
  if (brains.length === 1) {
    return auditBrainMastery(
      brains[0],
      difficulty,
      targetPipeCap,
      numSeeds,
      customEnvironment
    );
  }

  const rawBuf = new Float64Array(ALL_SENSOR_FEATURES.length);
  const perBrainMeta = brains.map((br) => {
    const full =
      br.inputNodes === ALL_SENSOR_FEATURES.length &&
      isFullSensorSet(br.inputFeatures);
    const indices = full
      ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
      : getInputFeatureIndices(br.inputFeatures);
    return {
      br,
      full,
      indices,
      subBuf: full ? rawBuf : new Float64Array(br.inputNodes),
    };
  });

  const majorityThreshold = Math.floor(brains.length / 2) + 1;
  const seedScores: number[] = [];
  let minSeedScore = Infinity;
  let sum = 0;
  let totalTicks = 0;
  let allSurvived = true;

  for (let s = 0; s < numSeeds; s++) {
    const seed = 1009 + s * 7919;
    const st = createSeedEvaluatorState(
      difficulty,
      targetPipeCap,
      seed,
      customEnvironment
    );
    for (let m = 0; m < brains.length; m++) brains[m].resetState();

    const {
      rng,
      baseGap,
      gapVar,
      baseSpeed,
      speedVar,
      baseSpacing,
      movingPipes,
      moveAmp,
      gravity,
      jumpImpulse,
      speedPhaseA,
      speedPhaseB,
      px,
      pBaseTop,
      pGap,
      pTop,
      pBot,
      pPhase,
      pVy,
      pPassed,
      maxFrames,
    } = st;

    const margin = movingPipes ? 72 : 52;
    const invHalfPlayable = 2 / PLAYABLE_HEIGHT;
    const invMaxVy = 1 / MAX_VY;
    const invCanvasW = 1 / CANVAS_WIDTH;
    const invPipeVy = 1 / MAX_PIPE_VY_NORM;
    const minPipeX = BIRD_X - BIRD_RADIUS;

    let head = st.head;
    let count = st.count;
    let distUntilNextSpawn = st.distUntilNextSpawn;
    let y = st.y;
    let vy = st.vy;
    let score = 0;
    let frameCount = 0;
    let survived = false;

    while (frameCount < maxFrames) {
      frameCount += 1;
      let tickSpeed = baseSpeed;
      if (speedVar > 0) {
        const mult =
          1 +
          speedVar *
            (0.55 * Math.sin(frameCount * 0.031 + speedPhaseA) +
              0.45 * Math.cos(frameCount * 0.079 + speedPhaseB));
        tickSpeed = Math.max(1.2, baseSpeed * mult);
      }

      distUntilNextSpawn -= tickSpeed;
      if (distUntilNextSpawn <= 0) {
        const tail = (head + count) & 15;
        const pg = Math.max(
          76,
          Math.min(204, baseGap + (gapVar > 0 ? (rng() * 2 - 1) * gapVar : 0))
        );
        const bt =
          margin + rng() * Math.max(20, PLAYABLE_HEIGHT - pg - margin * 2);
        px[tail] = CANVAS_WIDTH + 20;
        pBaseTop[tail] = bt;
        pGap[tail] = pg;
        pTop[tail] = bt;
        pBot[tail] = bt + pg;
        pPhase[tail] = rng() * Math.PI * 2;
        pVy[tail] = 0;
        pPassed[tail] = 0;
        count += 1;
        distUntilNextSpawn =
          speedVar > 0 || gapVar > 0
            ? baseSpacing * (0.88 + rng() * 0.24)
            : baseSpacing;
      }

      let nextIdx = head;
      let foundNext = false;
      let next2Idx = -1;
      const timeAngle = frameCount * 0.045;
      for (let k = 0; k < count; k++) {
        const idx = (head + k) & 15;
        px[idx] -= tickSpeed;
        if (movingPipes) {
          const prevTop = pTop[idx];
          const pg = pGap[idx];
          let nt = pBaseTop[idx] + Math.sin(timeAngle + pPhase[idx]) * moveAmp;
          const maxTop = PLAYABLE_HEIGHT - pg - 42;
          if (nt < 42) nt = 42;
          else if (nt > maxTop) nt = maxTop;
          pTop[idx] = nt;
          pBot[idx] = nt + pg;
          pVy[idx] = nt - prevTop;
        }
        if (!foundNext) {
          if (px[idx] + PIPE_WIDTH >= minPipeX) {
            nextIdx = idx;
            foundNext = true;
          }
        } else if (next2Idx === -1) {
          next2Idx = idx;
        }
      }
      if (count > 0 && px[head] + PIPE_WIDTH < -24) {
        head = (head + 1) & 15;
        count -= 1;
      }

      const gapTop = foundNext ? pTop[nextIdx] : PLAYABLE_HEIGHT * 0.35;
      const gapBot = foundNext ? pBot[nextIdx] : PLAYABLE_HEIGHT * 0.65;
      const pipeEdgeX = foundNext ? px[nextIdx] + PIPE_WIDTH : CANVAS_WIDTH;
      const gapVyVal = foundNext && movingPipes ? pVy[nextIdx] * invPipeVy : 0;

      rawBuf[0] = y * invHalfPlayable - 1;
      const vyNorm = vy * invMaxVy;
      rawBuf[1] = vyNorm < -1 ? -1 : vyNorm > 1 ? 1 : vyNorm;
      const distNorm = (pipeEdgeX - BIRD_X) * invCanvasW;
      rawBuf[2] = distNorm < -0.2 ? -0.2 : distNorm > 1 ? 1 : distNorm;
      rawBuf[3] = (y - gapTop) * invHalfPlayable;
      rawBuf[4] = (gapBot - y) * invHalfPlayable;
      rawBuf[5] = gapVyVal < -1 ? -1 : gapVyVal > 1 ? 1 : gapVyVal;
      if (foundNext && next2Idx !== -1) {
        const n2Dy =
          ((pTop[next2Idx] + pBot[next2Idx] - (gapTop + gapBot)) * 0.5) *
          invHalfPlayable;
        rawBuf[6] = n2Dy < -1 ? -1 : n2Dy > 1 ? 1 : n2Dy;
      } else {
        rawBuf[6] = 0;
      }

      let votes = 0;
      for (let m = 0; m < perBrainMeta.length; m++) {
        const pm = perBrainMeta[m];
        if (!pm.full) {
          for (let k = 0; k < pm.indices.length; k++) {
            pm.subBuf[k] = rawBuf[pm.indices[k]];
          }
        }
        if (pm.br.shouldFlap(pm.subBuf)) votes += 1;
      }
      if (votes >= majorityThreshold) {
        vy = jumpImpulse;
      }

      vy += gravity;
      if (vy > MAX_VY) vy = MAX_VY;
      y += vy;

      if (y - FLOOR_HIT_R <= 0 || y + FLOOR_HIT_R >= PLAYABLE_HEIGHT) break;
      if (foundNext) {
        const pipeLeft = px[nextIdx];
        const pipeRight = pipeLeft + PIPE_WIDTH;
        let dx = 0;
        if (BIRD_X < pipeLeft) dx = pipeLeft - BIRD_X;
        else if (BIRD_X > pipeRight) dx = BIRD_X - pipeRight;
        if (dx < PIPE_HIT_R) {
          const effY = dx === 0 ? PIPE_HIT_R : Math.sqrt(PIPE_HIT_R2 - dx * dx);
          if (y - effY < pTop[nextIdx] || y + effY > pBot[nextIdx]) break;
        }
      }

      if (count > 0 && pPassed[head] === 0 && px[head] + PIPE_WIDTH < BIRD_X) {
        pPassed[head] = 1;
        score += 1;
        if (score >= targetPipeCap) {
          survived = true;
          break;
        }
      }
    }

    releaseSeedEvaluatorState(st);
    seedScores.push(score);
    sum += score;
    totalTicks += frameCount;
    if (score < minSeedScore) minSeedScore = score;
    if (!survived) allSurvived = false;
  }

  return {
    seedScores,
    minSeedScore: seedScores.length > 0 ? minSeedScore : 0,
    meanSeedScore:
      seedScores.length > 0 ? Number((sum / seedScores.length).toFixed(1)) : 0,
    verifiedPerfect: allSurvived && seedScores.length === numSeeds,
    ticksEvaluated: totalTicks,
  };
}
