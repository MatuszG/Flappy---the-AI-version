/**
 * WebGL2 GPGPU Compute Evaluator (GLSL ES 3.00 + Transform Feedback).
 *
 * Dual-Kernel Zero-Spill Architecture:
 * 1) FAST_REGISTER_GLSL (Depth 0 & Depth 1):
 *    - ZERO local arrays anywhere in the shader -> 0 bytes private stack spill -> peak GPU SIMD occupancy!
 *    - 5-slot pure-register vec4 pipe queue (p0..p4) -> zero loops for pipe advance, next-pipe lookup, or scoring.
 *    - Register-cached weights for compact networks (Depth 0 & Depth 1 H<=4) -> ZERO texture fetches inside the physics loop!
 *    - RGBA32F packed weights (4 floats/texel) for wider Depth 1 networks (4x fewer texture fetches).
 * 2) DEEP_MLP_GLSL (Depth >= 2):
 *    - Same zero-array vec4 pipe queue + RGBA32F weights, compiled as a separate GL program so its
 *      actA[24]/actB[24] scratch arrays NEVER pollute FAST_REGISTER_GLSL's register allocation!
 */

import {
  TASK_STRIDE_U32,
  type GpuBatchResult,
  type GpuKernelKind,
  type GpuPendingBatch,
} from './webgpuEvaluator';

const TASKS_TEX_WIDTH = 1024; // 1024 RGBA texels/row => 512 tasks/row (2 texels per task)
const WEIGHTS_TEX_WIDTH = 1024; // 1024 RGBA32UI texels/row => 8192 FP16 weights/row

// Branchless IEEE-754 Float32 -> Float16 lookup tables (512 entries = sign + 8-bit exp)
const F16_BASE = new Uint16Array(512);
const F16_SHIFT = new Uint8Array(512);
for (let exp = 0; exp < 256; exp++) {
  if (exp < 113) {
    F16_BASE[exp] = 0x0000;
    F16_BASE[exp | 0x100] = 0x8000;
    F16_SHIFT[exp] = 24;
    F16_SHIFT[exp | 0x100] = 24;
  } else if (exp <= 142) {
    const hExp = (exp - 112) << 10;
    F16_BASE[exp] = hExp;
    F16_BASE[exp | 0x100] = 0x8000 | hExp;
    F16_SHIFT[exp] = 13;
    F16_SHIFT[exp | 0x100] = 13;
  } else if (exp < 255) {
    F16_BASE[exp] = 0x7bff;
    F16_BASE[exp | 0x100] = 0xfbff;
    F16_SHIFT[exp] = 24;
    F16_SHIFT[exp | 0x100] = 24;
  } else {
    F16_BASE[exp] = 0x0000;
    F16_BASE[exp | 0x100] = 0x0000;
    F16_SHIFT[exp] = 24;
    F16_SHIFT[exp | 0x100] = 24;
  }
}

function packWeightsF32ToHalfU32(
  srcF32: Float32Array,
  floatCount: number,
  dstU32: Uint32Array
): void {
  const srcU32 = new Uint32Array(srcF32.buffer, srcF32.byteOffset, floatCount);
  const fullPairs = floatCount >>> 1;
  for (let p = 0; p < fullPairs; p++) {
    const i0 = p << 1;
    const u0 = srcU32[i0];
    const e0 = (u0 >>> 23) & 0x1ff;
    const h0 = F16_BASE[e0] + ((u0 & 0x007fffff) >>> F16_SHIFT[e0]);
    const u1 = srcU32[i0 + 1];
    const e1 = (u1 >>> 23) & 0x1ff;
    const h1 = F16_BASE[e1] + ((u1 & 0x007fffff) >>> F16_SHIFT[e1]);
    dstU32[p] = (h0 | (h1 << 16)) >>> 0;
  }
  if ((floatCount & 1) !== 0) {
    const u0 = srcU32[floatCount - 1];
    const e0 = (u0 >>> 23) & 0x1ff;
    dstU32[fullPairs] = F16_BASE[e0] + ((u0 & 0x007fffff) >>> F16_SHIFT[e0]);
  }
}

const COMMON_GLSL_HEADER = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp usampler2D;

uniform usampler2D uTasksU32;
uniform sampler2D uTasksF32;
uniform usampler2D uWeightsU32;

out vec4 vResult;

const float CANVAS_WIDTH = 640.0;
const float PLAYABLE_HEIGHT = 424.0;
const float BIRD_X = 148.0;
const float PIPE_WIDTH = 60.0;
const float MAX_VY = 10.5;
const float PIPE_HIT_R = 11.0;
const float PIPE_HIT_R2 = 121.0;
const float FLOOR_HIT_R = 12.0;
const float INV_HALF_PLAYABLE = 2.0 / 424.0;
const float INV_MAX_VY = 1.0 / 10.5;
const float INV_CANVAS_W = 1.0 / 640.0;
const float INV_PIPE_VY = 0.5;
const float INV_ALIGN_WINDOW = 1.0 / (424.0 * 0.6);
const float MIN_PIPE_X = 135.0;
const float TWO_PI = 6.28318530718;

// Full-rate FMA rational tanh (max err < 0.0007, avoids SFU exp2 bottleneck on iGPU)
float fastTanh(float x) {
  float ax = abs(x);
  if (ax >= 3.8) return sign(x);
  float x2 = x * x;
  return clamp(
    x * (945.0 + x2 * (105.0 + x2)) / (945.0 + x2 * (420.0 + 15.0 * x2)),
    -1.0,
    1.0
  );
}

float fastSigmoid(float x) {
  return 0.5 + 0.5 * fastTanh(0.5 * x);
}

uint getLayerDim(uint meta0, uint meta1, uint idx) {
  if (idx == 0u) return (meta0 >> 8u) & 0xffu;
  if (idx == 1u) return (meta0 >> 16u) & 0xffu;
  if (idx == 2u) return (meta0 >> 24u) & 0xffu;
  if (idx == 3u) return meta1 & 0xffu;
  if (idx == 4u) return (meta1 >> 8u) & 0xffu;
  if (idx == 5u) return (meta1 >> 16u) & 0xffu;
  return (meta1 >> 24u) & 0xffu;
}

// 8 FP16 weights packed per RGBA32UI texel (2x less VRAM/L1 traffic!)
float fetchWeight(uint idx) {
  uint q = idx >> 3u;
  uvec4 t = texelFetch(uWeightsU32, ivec2(int(q & 1023u), int(q >> 10u)), 0);
  uint lane = (idx >> 1u) & 3u;
  uint packed = lane == 0u ? t.x : lane == 1u ? t.y : lane == 2u ? t.z : t.w;
  vec2 pair = unpackHalf2x16(packed);
  return (idx & 1u) == 0u ? pair.x : pair.y;
}

vec4 fetchWeight4(uint idx) {
  uint q = idx >> 3u;
  uvec4 t0 = texelFetch(uWeightsU32, ivec2(int(q & 1023u), int(q >> 10u)), 0);
  uint c = idx & 7u;
  if (c == 0u) return vec4(unpackHalf2x16(t0.x), unpackHalf2x16(t0.y));
  if (c == 1u) return vec4(unpackHalf2x16(t0.x).y, unpackHalf2x16(t0.y), unpackHalf2x16(t0.z).x);
  if (c == 2u) return vec4(unpackHalf2x16(t0.y), unpackHalf2x16(t0.z));
  if (c == 3u) return vec4(unpackHalf2x16(t0.y).y, unpackHalf2x16(t0.z), unpackHalf2x16(t0.w).x);
  if (c == 4u) return vec4(unpackHalf2x16(t0.z), unpackHalf2x16(t0.w));
  uint q1 = q + 1u;
  uvec4 t1 = texelFetch(uWeightsU32, ivec2(int(q1 & 1023u), int(q1 >> 10u)), 0);
  if (c == 5u) return vec4(unpackHalf2x16(t0.z).y, unpackHalf2x16(t0.w), unpackHalf2x16(t1.x).x);
  if (c == 6u) return vec4(unpackHalf2x16(t0.w), unpackHalf2x16(t1.x));
  return vec4(unpackHalf2x16(t0.w).y, unpackHalf2x16(t1.x), unpackHalf2x16(t1.y).x);
}

void fetchWeight8(uint idx, out vec4 w0, out vec4 w1) {
  uint q = idx >> 3u;
  uvec4 t0 = texelFetch(uWeightsU32, ivec2(int(q & 1023u), int(q >> 10u)), 0);
  uint c = idx & 7u;
  vec2 p0 = unpackHalf2x16(t0.x);
  vec2 p1 = unpackHalf2x16(t0.y);
  vec2 p2 = unpackHalf2x16(t0.z);
  vec2 p3 = unpackHalf2x16(t0.w);
  if (c == 0u) {
    w0 = vec4(p0, p1);
    w1 = vec4(p2, p3);
    return;
  }
  uint q1 = q + 1u;
  uvec4 t1 = texelFetch(uWeightsU32, ivec2(int(q1 & 1023u), int(q1 >> 10u)), 0);
  vec2 n0 = unpackHalf2x16(t1.x);
  vec2 n1 = unpackHalf2x16(t1.y);
  vec2 n2 = unpackHalf2x16(t1.z);
  vec2 n3 = unpackHalf2x16(t1.w);
  if (c == 1u) { w0 = vec4(p0.y, p1, p2.x); w1 = vec4(p2.y, p3, n0.x); return; }
  if (c == 2u) { w0 = vec4(p1, p2);         w1 = vec4(p3, n0);         return; }
  if (c == 3u) { w0 = vec4(p1.y, p2, p3.x); w1 = vec4(p3.y, n0, n1.x); return; }
  if (c == 4u) { w0 = vec4(p2, p3);         w1 = vec4(n0, n1);         return; }
  if (c == 5u) { w0 = vec4(p2.y, p3, n0.x); w1 = vec4(n0.y, n1, n2.x); return; }
  if (c == 6u) { w0 = vec4(p3, n0);         w1 = vec4(n1, n2);         return; }
  w0 = vec4(p3.y, n0, n1.x); w1 = vec4(n1.y, n2, n3.x);
}

float nextRand(inout uint state) {
  uint a = state + 0x6d2b79f5u;
  state = a;
  uint t = (a ^ (a >> 15u)) * (1u | a);
  t = (t + ((t ^ (t >> 7u)) * (61u | t))) ^ t;
  return float(t ^ (t >> 14u)) * (1.0 / 4294967296.0);
}

float getRawSensor(
  uint featIdx,
  float raw0,
  float raw1,
  float raw2,
  float raw3,
  float raw4,
  float raw5
) {
  if (featIdx == 0u) return raw0;
  if (featIdx == 1u) return raw1;
  if (featIdx == 2u) return raw2;
  if (featIdx == 3u) return raw3;
  if (featIdx == 4u) return raw4;
  return raw5;
}

void updateMovingPipe(
  inout vec4 p,
  inout vec2 m,
  float tickSpeed,
  float timeAngle,
  float moveAmp
) {
  p.x -= tickSpeed;
  float prevTop = p.y;
  float offset = sin(timeAngle + m.x) * moveAmp;
  float maxTop = PLAYABLE_HEIGHT - p.z - 42.0;
  float clamped = clamp(p.w + offset, 42.0, maxTop);
  p.y = clamped;
  m.y = clamped - prevTop;
}

void loadNeuronRow(
  uint rowOff,
  uint inCount,
  float biasVal,
  out vec4 wA,
  out vec4 wB
) {
  wA = vec4(
    inCount > 0u ? fetchWeight(rowOff + 0u) : 0.0,
    inCount > 1u ? fetchWeight(rowOff + 1u) : 0.0,
    inCount > 2u ? fetchWeight(rowOff + 2u) : 0.0,
    inCount > 3u ? fetchWeight(rowOff + 3u) : 0.0
  );
  wB = vec4(
    inCount > 4u ? fetchWeight(rowOff + 4u) : 0.0,
    inCount > 5u ? fetchWeight(rowOff + 5u) : 0.0,
    biasVal,
    0.0
  );
}
`;

const PIPE_LOOP_PREAMBLE_GLSL = `
  int t0 = gl_VertexID * 2;
  int t1 = t0 + 1;
  ivec2 uv0 = ivec2(t0 & 1023, t0 >> 10);
  ivec2 uv1 = ivec2(t1 & 1023, t1 >> 10);

  uvec4 u0 = texelFetch(uTasksU32, uv0, 0);
  uvec4 u1 = texelFetch(uTasksU32, uv1, 0);
  vec4 f0 = texelFetch(uTasksF32, uv0, 0);
  vec4 f1 = texelFetch(uTasksF32, uv1, 0);

  uint weightOffset = u0.x;
  uint rng = u0.y;
  uint targetPipeCap = u0.z;
  uint maxFrames = u0.w;

  uint topoMeta0 = u1.x;
  uint topoMeta1 = u1.y;
  uint sensorMask = u1.z;
  uint flags = u1.w;

  float baseGap = f0.x;
  float gapVar = f0.y;
  float baseSpeed = f0.z;
  float speedVar = f0.w;

  float baseSpacing = f1.x;
  float moveAmp = f1.y;
  float gravity = f1.z;
  float jumpImpulse = f1.w;

  bool movingPipes = (flags & 1u) != 0u;
  bool computeFitness = (flags & 2u) != 0u;
  bool hasSpeedVar = speedVar > 0.0;
  bool hasGapVar = gapVar > 0.0;
  bool hasAnyVar = hasSpeedVar || hasGapVar;
  float margin = movingPipes ? 72.0 : 52.0;

  float speedPhaseA = nextRand(rng) * TWO_PI;
  float speedPhaseB = nextRand(rng) * TWO_PI;

  // Unpack sensor indices ONCE outside the simulation loop
  uint transitions = topoMeta0 & 0xffu;
  uint inCount = (topoMeta0 >> 8u) & 0xffu;
  uint hLen = (topoMeta0 >> 16u) & 0xffu;
  uint h2Len = (topoMeta0 >> 24u) & 0xffu;
  uint s0 = sensorMask & 0xfu;
  uint s1 = (sensorMask >> 4u) & 0xfu;
  uint s2 = (sensorMask >> 8u) & 0xfu;
  uint s3 = (sensorMask >> 12u) & 0xfu;
  uint s4 = (sensorMask >> 16u) & 0xfu;
  uint s5 = (sensorMask >> 20u) & 0xfu;

  // 5-slot pure-register pipe queue (ZERO local arrays -> ZERO VRAM stack spill!)
  // pK = vec4(x, top, gap, baseTop), mK = vec2(phase, vy)
  vec4 p0 = vec4(0.0);
  vec4 p1 = vec4(0.0);
  vec4 p2 = vec4(0.0);
  vec4 p3 = vec4(0.0);
  vec4 p4 = vec4(0.0);
  vec2 m0 = vec2(0.0);
  vec2 m1 = vec2(0.0);
  vec2 m2 = vec2(0.0);
  vec2 m3 = vec2(0.0);
  vec2 m4 = vec2(0.0);
  uint pPassedMask = 0u;

  float initGap = baseGap;
  if (hasGapVar) {
    initGap += (nextRand(rng) * 2.0 - 1.0) * gapVar;
  }
  initGap = clamp(initGap, 76.0, 204.0);
  float initSpan = max(20.0, PLAYABLE_HEIGHT - initGap - margin * 2.0);
  float initTop = margin + nextRand(rng) * initSpan;
  p0 = vec4(CANVAS_WIDTH + 60.0, initTop, initGap, initTop);
  m0 = vec2(nextRand(rng) * TWO_PI, 0.0);

  uint count = 1u;
  float distUntilNextSpawn = baseSpacing;

  float y = PLAYABLE_HEIGHT * 0.46;
  float vy = 0.0;
  uint score = 0u;
  float fitness = 0.0;
  uint frameCount = 0u;
  uint survivedFull = 0u;
`;

const PIPE_STEP_AND_SENSORS_GLSL = `
    frameCount += 1u;

    float tickSpeed = baseSpeed;
    if (hasSpeedVar) {
      float fc = float(frameCount);
      float speedMult = 1.0 + speedVar * (
        0.55 * sin(fc * 0.031 + speedPhaseA) +
        0.45 * cos(fc * 0.079 + speedPhaseB)
      );
      tickSpeed = max(1.2, baseSpeed * speedMult);
    }

    distUntilNextSpawn -= tickSpeed;
    if (distUntilNextSpawn <= 0.0 && count < 5u) {
      float pipeGap = baseGap;
      if (hasGapVar) {
        pipeGap += (nextRand(rng) * 2.0 - 1.0) * gapVar;
      }
      pipeGap = clamp(pipeGap, 76.0, 204.0);
      float spanRange = max(20.0, PLAYABLE_HEIGHT - pipeGap - margin * 2.0);
      float baseTop = margin + nextRand(rng) * spanRange;
      vec4 newP = vec4(CANVAS_WIDTH + 20.0, baseTop, pipeGap, baseTop);
      vec2 newM = vec2(nextRand(rng) * TWO_PI, 0.0);
      if (count == 0u) { p0 = newP; m0 = newM; }
      else if (count == 1u) { p1 = newP; m1 = newM; }
      else if (count == 2u) { p2 = newP; m2 = newM; }
      else if (count == 3u) { p3 = newP; m3 = newM; }
      else { p4 = newP; m4 = newM; }
      pPassedMask &= ~(1u << count);
      count += 1u;

      if (hasAnyVar) {
        distUntilNextSpawn = baseSpacing * (0.88 + nextRand(rng) * 0.24);
      } else {
        distUntilNextSpawn = baseSpacing;
      }
    }

    if (movingPipes) {
      float timeAngle = float(frameCount) * 0.045;
      if (count > 0u) updateMovingPipe(p0, m0, tickSpeed, timeAngle, moveAmp);
      if (count > 1u) updateMovingPipe(p1, m1, tickSpeed, timeAngle, moveAmp);
      if (count > 2u) updateMovingPipe(p2, m2, tickSpeed, timeAngle, moveAmp);
      if (count > 3u) updateMovingPipe(p3, m3, tickSpeed, timeAngle, moveAmp);
      if (count > 4u) updateMovingPipe(p4, m4, tickSpeed, timeAngle, moveAmp);
    } else {
      p0.x -= tickSpeed;
      if (count > 1u) p1.x -= tickSpeed;
      if (count > 2u) p2.x -= tickSpeed;
      if (count > 3u) p3.x -= tickSpeed;
      if (count > 4u) p4.x -= tickSpeed;
    }

    if (count > 0u && p0.x + PIPE_WIDTH < -24.0) {
      p0 = p1; p1 = p2; p2 = p3; p3 = p4;
      m0 = m1; m1 = m2; m2 = m3; m3 = m4;
      pPassedMask >>= 1u;
      count -= 1u;
    }

    bool foundNext = false;
    vec4 np = vec4(0.0);
    float npVy = 0.0;
    if (count > 0u && p0.x + PIPE_WIDTH >= MIN_PIPE_X) {
      np = p0; npVy = m0.y; foundNext = true;
    } else if (count > 1u && p1.x + PIPE_WIDTH >= MIN_PIPE_X) {
      np = p1; npVy = m1.y; foundNext = true;
    } else if (count > 2u && p2.x + PIPE_WIDTH >= MIN_PIPE_X) {
      np = p2; npVy = m2.y; foundNext = true;
    }

    float pipeEdgeX = foundNext ? (np.x + PIPE_WIDTH) : CANVAS_WIDTH;
    float gapTop = foundNext ? np.y : (PLAYABLE_HEIGHT * 0.35);
    float gapBot = foundNext ? (np.y + np.z) : (PLAYABLE_HEIGHT * 0.65);
    float gapVyVal = (foundNext && movingPipes) ? (npVy * INV_PIPE_VY) : 0.0;

    float raw0 = y * INV_HALF_PLAYABLE - 1.0;
    float raw1 = clamp(vy * INV_MAX_VY, -1.0, 1.0);
    float raw2 = clamp((pipeEdgeX - BIRD_X) * INV_CANVAS_W, -0.2, 1.0);
    float raw3 = (y - gapTop) * INV_HALF_PLAYABLE;
    float raw4 = (gapBot - y) * INV_HALF_PLAYABLE;
    float raw5 = clamp(gapVyVal, -1.0, 1.0);
`;

const PIPE_COLLISION_AND_SCORE_GLSL = `
    vy = min(MAX_VY, vy + gravity);
    y += vy;

    // Ceiling / Floor collision
    if (y - FLOOR_HIT_R <= 0.0 || y + FLOOR_HIT_R >= PLAYABLE_HEIGHT) {
      if (computeFitness && score == 0u) {
        fitness *= 0.85;
      }
      break;
    }

    // Exact Circle-vs-AABB pipe collision
    if (foundNext) {
      float pipeLeft = np.x;
      float pipeRight = pipeLeft + PIPE_WIDTH;
      float dx = 0.0;
      if (BIRD_X < pipeLeft) {
        dx = pipeLeft - BIRD_X;
      } else if (BIRD_X > pipeRight) {
        dx = BIRD_X - pipeRight;
      }
      if (dx < PIPE_HIT_R) {
        float effY = sqrt(max(0.0, PIPE_HIT_R2 - dx * dx));
        if (y - effY < gapTop || y + effY > gapBot) {
          break;
        }
      }
    }

    if (computeFitness) {
      fitness += 0.1;
      if (foundNext) {
        float gapCenter = 0.5 * (gapTop + gapBot);
        float align = max(0.0, 1.0 - abs(y - gapCenter) * INV_ALIGN_WINDOW);
        fitness += 0.15 * align;
      }
    }

    if (count > 0u && (pPassedMask & 1u) == 0u && p0.x + PIPE_WIDTH < BIRD_X) {
      pPassedMask |= 1u;
      score += 1u;
      if (computeFitness) fitness += 40.0;
      if (score >= targetPipeCap) {
        survivedFull = 1u;
        break;
      }
    }
    if (count > 1u && (pPassedMask & 2u) == 0u && p1.x + PIPE_WIDTH < BIRD_X) {
      pPassedMask |= 2u;
      score += 1u;
      if (computeFitness) fitness += 40.0;
      if (score >= targetPipeCap) {
        survivedFull = 1u;
        break;
      }
    }
`;

// KERNEL 1: ZERO local arrays, register-cached weights for Depth 0 & Depth 1 (H <= 4)
const FAST_REGISTER_VERT_GLSL = `${COMMON_GLSL_HEADER}
void main() {
${PIPE_LOOP_PREAMBLE_GLSL}

  // Preload weights ONCE into pure GPU registers for Depth 0 and Depth 1 (H <= 4)
  bool isLinear = (transitions == 1u);
  bool isSmallHidden = (transitions == 2u && hLen <= 4u);

  vec4 h0A = vec4(0.0), h0B = vec4(0.0);
  vec4 h1A = vec4(0.0), h1B = vec4(0.0);
  vec4 h2A = vec4(0.0), h2B = vec4(0.0);
  vec4 h3A = vec4(0.0), h3B = vec4(0.0);
  vec4 outW = vec4(0.0);
  float outB = 0.0;

  if (isLinear) {
    loadNeuronRow(weightOffset, inCount, fetchWeight(weightOffset + inCount), h0A, h0B);
  } else if (isSmallHidden) {
    uint b0Off = weightOffset + inCount * hLen;
    uint w1Off = b0Off + hLen;
    outB = fetchWeight(w1Off + hLen);
    if (hLen > 0u) {
      loadNeuronRow(weightOffset + 0u * inCount, inCount, fetchWeight(b0Off + 0u), h0A, h0B);
      outW.x = fetchWeight(w1Off + 0u);
    }
    if (hLen > 1u) {
      loadNeuronRow(weightOffset + 1u * inCount, inCount, fetchWeight(b0Off + 1u), h1A, h1B);
      outW.y = fetchWeight(w1Off + 1u);
    }
    if (hLen > 2u) {
      loadNeuronRow(weightOffset + 2u * inCount, inCount, fetchWeight(b0Off + 2u), h2A, h2B);
      outW.z = fetchWeight(w1Off + 2u);
    }
    if (hLen > 3u) {
      loadNeuronRow(weightOffset + 3u * inCount, inCount, fetchWeight(b0Off + 3u), h3A, h3B);
      outW.w = fetchWeight(w1Off + 3u);
    }
  }

  uint b0Wide = weightOffset + inCount * hLen;
  uint w1Wide = b0Wide + hLen;

  while (frameCount < maxFrames) {
${PIPE_STEP_AND_SENSORS_GLSL}

    float x0 = getRawSensor(s0, raw0, raw1, raw2, raw3, raw4, raw5);
    float x1 = inCount > 1u ? getRawSensor(s1, raw0, raw1, raw2, raw3, raw4, raw5) : 0.0;
    float x2 = inCount > 2u ? getRawSensor(s2, raw0, raw1, raw2, raw3, raw4, raw5) : 0.0;
    float x3 = inCount > 3u ? getRawSensor(s3, raw0, raw1, raw2, raw3, raw4, raw5) : 0.0;
    float x4 = inCount > 4u ? getRawSensor(s4, raw0, raw1, raw2, raw3, raw4, raw5) : 0.0;
    float x5 = inCount > 5u ? getRawSensor(s5, raw0, raw1, raw2, raw3, raw4, raw5) : 0.0;

    bool flap = false;
    if (isLinear) {
      float sum = h0B.z + x0 * h0A.x + x1 * h0A.y + x2 * h0A.z + x3 * h0A.w + x4 * h0B.x + x5 * h0B.y;
      flap = sum > 0.0;
    } else if (isSmallHidden) {
      float outSum = outB;
      float z0 = h0B.z + x0 * h0A.x + x1 * h0A.y + x2 * h0A.z + x3 * h0A.w + x4 * h0B.x + x5 * h0B.y;
      outSum += fastTanh(z0) * outW.x;
      if (hLen > 1u) {
        float z1 = h1B.z + x0 * h1A.x + x1 * h1A.y + x2 * h1A.z + x3 * h1A.w + x4 * h1B.x + x5 * h1B.y;
        outSum += fastTanh(z1) * outW.y;
      }
      if (hLen > 2u) {
        float z2 = h2B.z + x0 * h2A.x + x1 * h2A.y + x2 * h2A.z + x3 * h2A.w + x4 * h2B.x + x5 * h2B.y;
        outSum += fastTanh(z2) * outW.z;
      }
      if (hLen > 3u) {
        float z3 = h3B.z + x0 * h3A.x + x1 * h3A.y + x2 * h3A.z + x3 * h3A.w + x4 * h3B.x + x5 * h3B.y;
        outSum += fastTanh(z3) * outW.w;
      }
      flap = outSum > 0.0;
    } else {
      // Wide Depth 1 (H > 4): zero local arrays + vectorized fetchWeight4!
      vec4 xA = vec4(x0, x1, x2, x3);
      float outSum = fetchWeight(w1Wide + hLen);
      for (uint j = 0u; j < hLen; j++) {
        uint rowOff = weightOffset + j * inCount;
        float sum = fetchWeight(b0Wide + j);
        if (inCount >= 4u) {
          sum += dot(xA, fetchWeight4(rowOff));
          if (inCount > 4u) sum += x4 * fetchWeight(rowOff + 4u);
          if (inCount > 5u) sum += x5 * fetchWeight(rowOff + 5u);
        } else {
          sum += x0 * fetchWeight(rowOff + 0u);
          if (inCount > 1u) sum += x1 * fetchWeight(rowOff + 1u);
          if (inCount > 2u) sum += x2 * fetchWeight(rowOff + 2u);
        }
        outSum += fastTanh(sum) * fetchWeight(w1Wide + j);
      }
      flap = outSum > 0.0;
    }

    if (flap) {
      vy = jumpImpulse;
    }

${PIPE_COLLISION_AND_SCORE_GLSL}
  }

  if (survivedFull == 0u && frameCount >= maxFrames && score >= targetPipeCap) {
    survivedFull = 1u;
  }

  vResult = vec4(float(score), float(frameCount), float(survivedFull), fitness);
}
`;

// KERNEL 1: Compact Deep MLP (Depth 2..5, maxWidth <= 8) — ONLY vec4 a0..a1 / b0..b1 (32 fewer regs than DEEP_MLP!)
const COMPACT_DEEP_VERT_GLSL = `${COMMON_GLSL_HEADER}
float evalNeuronReg8(uint rowOff, uint prevLen, float bias, vec4 a0, vec4 a1) {
  float sum = bias;
  if (prevLen >= 8u) {
    vec4 w0, w1;
    fetchWeight8(rowOff, w0, w1);
    return sum + dot(a0, w0) + dot(a1, w1);
  }
  if (prevLen >= 4u) {
    sum += dot(a0, fetchWeight4(rowOff));
    if (prevLen > 4u) sum += a1.x * fetchWeight(rowOff + 4u);
    if (prevLen > 5u) sum += a1.y * fetchWeight(rowOff + 5u);
    if (prevLen > 6u) sum += a1.z * fetchWeight(rowOff + 6u);
    return sum;
  }
  sum += a0.x * fetchWeight(rowOff);
  if (prevLen > 1u) sum += a0.y * fetchWeight(rowOff + 1u);
  if (prevLen > 2u) sum += a0.z * fetchWeight(rowOff + 2u);
  return sum;
}

void main() {
${PIPE_LOOP_PREAMBLE_GLSL}

  uint lastLayer = transitions - 1u;

  while (frameCount < maxFrames) {
${PIPE_STEP_AND_SENSORS_GLSL}

    vec4 a0 = vec4(
      getRawSensor(s0, raw0, raw1, raw2, raw3, raw4, raw5),
      inCount > 1u ? getRawSensor(s1, raw0, raw1, raw2, raw3, raw4, raw5) : 0.0,
      inCount > 2u ? getRawSensor(s2, raw0, raw1, raw2, raw3, raw4, raw5) : 0.0,
      inCount > 3u ? getRawSensor(s3, raw0, raw1, raw2, raw3, raw4, raw5) : 0.0
    );
    vec4 a1 = vec4(
      inCount > 4u ? getRawSensor(s4, raw0, raw1, raw2, raw3, raw4, raw5) : 0.0,
      inCount > 5u ? getRawSensor(s5, raw0, raw1, raw2, raw3, raw4, raw5) : 0.0,
      0.0,
      0.0
    );

    uint cursor = weightOffset;
    for (uint l = 0u; l < lastLayer; l++) {
      uint prevLen = getLayerDim(topoMeta0, topoMeta1, l);
      uint nextLen = getLayerDim(topoMeta0, topoMeta1, l + 1u);
      uint bOff = cursor + prevLen * nextLen;
      vec4 b0 = vec4(0.0);
      vec4 b1 = vec4(0.0);

      for (uint j = 0u; j < nextLen; j++) {
        float act = fastTanh(evalNeuronReg8(cursor + j * prevLen, prevLen, fetchWeight(bOff + j), a0, a1));
        if (j == 0u) b0.x = act;
        else if (j == 1u) b0.y = act;
        else if (j == 2u) b0.z = act;
        else if (j == 3u) b0.w = act;
        else if (j == 4u) b1.x = act;
        else if (j == 5u) b1.y = act;
        else if (j == 6u) b1.z = act;
        else b1.w = act;
      }

      a0 = b0;
      a1 = b1;
      cursor = bOff + nextLen;
    }

    uint prevLen = getLayerDim(topoMeta0, topoMeta1, lastLayer);
    float outSum = evalNeuronReg8(cursor, prevLen, fetchWeight(cursor + prevLen), a0, a1);

    if (outSum > 0.0) {
      vy = jumpImpulse;
    }

${PIPE_COLLISION_AND_SCORE_GLSL}
  }

  if (survivedFull == 0u && frameCount >= maxFrames && score >= targetPipeCap) {
    survivedFull = 1u;
  }

  vResult = vec4(float(score), float(frameCount), float(survivedFull), fitness);
}
`;

// KERNEL 3: Bio-Inspired / Stateful Neurons (RESIDUAL_SKIP, LTC_FLY, NEUROCHEM_GATE, SYNAPTIC_STP)
// Zero local arrays: up to 12 total hidden bio-neurons in pure registers (st0, st1, st2), maxWidth <= 8!
const BIO_NEURON_VERT_GLSL = `${COMMON_GLSL_HEADER}
float evalNeuronBio8(uint rowOff, uint prevLen, float bias, vec4 a0, vec4 a1) {
  float sum = bias;
  if (prevLen >= 8u) {
    vec4 w0, w1;
    fetchWeight8(rowOff, w0, w1);
    return sum + dot(a0, w0) + dot(a1, w1);
  }
  if (prevLen >= 4u) {
    sum += dot(a0, fetchWeight4(rowOff));
    if (prevLen > 4u) sum += a1.x * fetchWeight(rowOff + 4u);
    if (prevLen > 5u) sum += a1.y * fetchWeight(rowOff + 5u);
    if (prevLen > 6u) sum += a1.z * fetchWeight(rowOff + 6u);
    return sum;
  }
  sum += a0.x * fetchWeight(rowOff);
  if (prevLen > 1u) sum += a0.y * fetchWeight(rowOff + 1u);
  if (prevLen > 2u) sum += a0.z * fetchWeight(rowOff + 2u);
  return sum;
}

float getBioState(uint idx, vec4 st0, vec4 st1, vec4 st2) {
  if (idx < 4u) {
    return idx == 0u ? st0.x : idx == 1u ? st0.y : idx == 2u ? st0.z : st0.w;
  }
  if (idx < 8u) {
    uint k = idx - 4u;
    return k == 0u ? st1.x : k == 1u ? st1.y : k == 2u ? st1.z : st1.w;
  }
  uint k = idx - 8u;
  return k == 0u ? st2.x : k == 1u ? st2.y : k == 2u ? st2.z : st2.w;
}

void setBioState(uint idx, float val, inout vec4 st0, inout vec4 st1, inout vec4 st2) {
  if (idx == 0u) st0.x = val;
  else if (idx == 1u) st0.y = val;
  else if (idx == 2u) st0.z = val;
  else if (idx == 3u) st0.w = val;
  else if (idx == 4u) st1.x = val;
  else if (idx == 5u) st1.y = val;
  else if (idx == 6u) st1.z = val;
  else if (idx == 7u) st1.w = val;
  else if (idx == 8u) st2.x = val;
  else if (idx == 9u) st2.y = val;
  else if (idx == 10u) st2.z = val;
  else st2.w = val;
}

void main() {
${PIPE_LOOP_PREAMBLE_GLSL}

  uint archCode = (flags >> 2u) & 7u;
  uint lastLayer = transitions - 1u;

  // Compute bioParams start offset once outside the simulation loop
  uint bioBaseOff = weightOffset;
  for (uint l = 0u; l < transitions; l++) {
    uint pL = getLayerDim(topoMeta0, topoMeta1, l);
    uint nL = getLayerDim(topoMeta0, topoMeta1, l + 1u);
    bioBaseOff += pL * nL + nL;
  }

  float initState = (archCode == 4u) ? 1.0 : 0.0;
  vec4 st0 = vec4(initState);
  vec4 st1 = vec4(initState);
  vec4 st2 = vec4(initState);

  while (frameCount < maxFrames) {
${PIPE_STEP_AND_SENSORS_GLSL}

    vec4 in0 = vec4(
      getRawSensor(s0, raw0, raw1, raw2, raw3, raw4, raw5),
      inCount > 1u ? getRawSensor(s1, raw0, raw1, raw2, raw3, raw4, raw5) : 0.0,
      inCount > 2u ? getRawSensor(s2, raw0, raw1, raw2, raw3, raw4, raw5) : 0.0,
      inCount > 3u ? getRawSensor(s3, raw0, raw1, raw2, raw3, raw4, raw5) : 0.0
    );
    vec4 in1 = vec4(
      inCount > 4u ? getRawSensor(s4, raw0, raw1, raw2, raw3, raw4, raw5) : 0.0,
      inCount > 5u ? getRawSensor(s5, raw0, raw1, raw2, raw3, raw4, raw5) : 0.0,
      0.0,
      0.0
    );

    vec4 a0 = in0;
    vec4 a1 = in1;
    uint cursor = weightOffset;
    uint bioNodeIdx = 0u;

    for (uint l = 0u; l < lastLayer; l++) {
      uint prevLen = getLayerDim(topoMeta0, topoMeta1, l);
      uint nextLen = getLayerDim(topoMeta0, topoMeta1, l + 1u);
      uint bOff = cursor + prevLen * nextLen;
      vec4 b0 = vec4(0.0);
      vec4 b1 = vec4(0.0);

      for (uint j = 0u; j < nextLen; j++) {
        float sum = evalNeuronBio8(cursor + j * prevLen, prevLen, fetchWeight(bOff + j), a0, a1);
        float outAct;
        if (archCode == 2u) {
          // LTC_FLY: [tauLogit, selfRec]
          uint bp = bioBaseOff + bioNodeIdx * 2u;
          float alpha = fastSigmoid(fetchWeight(bp));
          float rec = fetchWeight(bp + 1u);
          float prevH = getBioState(bioNodeIdx, st0, st1, st2);
          float nextH = (1.0 - alpha) * prevH + alpha * fastTanh(sum + rec * prevH);
          setBioState(bioNodeIdx, nextH, st0, st1, st2);
          outAct = nextH;
          bioNodeIdx += 1u;
        } else if (archCode == 3u) {
          // NEUROCHEM_GATE: [decayLogit, chemDrive, chemGain]
          uint bp = bioBaseOff + bioNodeIdx * 3u;
          float beta = fastSigmoid(fetchWeight(bp));
          float chemDrive = fetchWeight(bp + 1u);
          float chemGain = fetchWeight(bp + 2u);
          float prevM = getBioState(bioNodeIdx, st0, st1, st2);
          float nextM = (1.0 - beta) * prevM + beta * fastTanh(chemDrive * sum);
          setBioState(bioNodeIdx, nextM, st0, st1, st2);
          float mod = 1.0 + chemGain * nextM;
          outAct = clamp(mod * fastTanh(sum + 0.5 * chemGain * nextM), -2.0, 2.0);
          bioNodeIdx += 1u;
        } else if (archCode == 4u) {
          // SYNAPTIC_STP: [recLogit, fac]
          uint bp = bioBaseOff + bioNodeIdx * 2u;
          float rho = fastSigmoid(fetchWeight(bp));
          float fac = fetchWeight(bp + 1u);
          float prevU = getBioState(bioNodeIdx, st0, st1, st2);
          float act = fastTanh(sum);
          float absAct = abs(act);
          float nextU = clamp(
            prevU + 0.12 * rho * (1.0 - prevU) + fac * absAct * (1.5 - prevU) - 0.18 * absAct * prevU,
            0.15,
            2.0
          );
          setBioState(bioNodeIdx, nextU, st0, st1, st2);
          outAct = nextU * act;
          bioNodeIdx += 1u;
        } else {
          // RESIDUAL_SKIP / MLP hidden neurons are standard tanh
          outAct = fastTanh(sum);
        }

        if (j == 0u) b0.x = outAct;
        else if (j == 1u) b0.y = outAct;
        else if (j == 2u) b0.z = outAct;
        else if (j == 3u) b0.w = outAct;
        else if (j == 4u) b1.x = outAct;
        else if (j == 5u) b1.y = outAct;
        else if (j == 6u) b1.z = outAct;
        else b1.w = outAct;
      }

      a0 = b0;
      a1 = b1;
      cursor = bOff + nextLen;
    }

    uint prevLen = getLayerDim(topoMeta0, topoMeta1, lastLayer);
    float outSum = evalNeuronBio8(cursor, prevLen, fetchWeight(cursor + prevLen), a0, a1);

    if (archCode == 1u && transitions > 1u) {
      // RESIDUAL_SKIP direct sensory -> motor linear bypass
      outSum += in0.x * fetchWeight(bioBaseOff);
      if (inCount > 1u) outSum += in0.y * fetchWeight(bioBaseOff + 1u);
      if (inCount > 2u) outSum += in0.z * fetchWeight(bioBaseOff + 2u);
      if (inCount > 3u) outSum += in0.w * fetchWeight(bioBaseOff + 3u);
      if (inCount > 4u) outSum += in1.x * fetchWeight(bioBaseOff + 4u);
      if (inCount > 5u) outSum += in1.y * fetchWeight(bioBaseOff + 5u);
    } else if (transitions == 1u) {
      // Depth-0 bio-stateful membrane directly on output neuron
      if (archCode == 2u) {
        float alpha = fastSigmoid(fetchWeight(bioBaseOff));
        float rec = fetchWeight(bioBaseOff + 1u);
        float nextH = (1.0 - alpha) * st0.x + alpha * fastTanh(outSum + rec * st0.x);
        st0.x = nextH;
        outSum = nextH * 4.0;
      } else if (archCode == 3u) {
        float beta = fastSigmoid(fetchWeight(bioBaseOff));
        float chemDrive = fetchWeight(bioBaseOff + 1u);
        float chemGain = fetchWeight(bioBaseOff + 2u);
        float nextM = (1.0 - beta) * st0.x + beta * fastTanh(chemDrive * outSum);
        st0.x = nextM;
        outSum = (1.0 + chemGain * nextM) * outSum + 0.5 * chemGain * nextM;
      } else if (archCode == 4u) {
        float rho = fastSigmoid(fetchWeight(bioBaseOff));
        float fac = fetchWeight(bioBaseOff + 1u);
        float act = fastTanh(outSum);
        float absAct = abs(act);
        float nextU = clamp(
          st0.x + 0.12 * rho * (1.0 - st0.x) + fac * absAct * (1.5 - st0.x) - 0.18 * absAct * st0.x,
          0.15,
          2.0
        );
        st0.x = nextU;
        outSum = nextU * outSum;
      }
    }

    if (outSum > 0.0) {
      vy = jumpImpulse;
    }

${PIPE_COLLISION_AND_SCORE_GLSL}
  }

  if (survivedFull == 0u && frameCount >= maxFrames && score >= targetPipeCap) {
    survivedFull = 1u;
  }

  vResult = vec4(float(score), float(frameCount), float(survivedFull), fitness);
}
`;

// KERNEL 2: Wide Depth >= 2 & Width <= 24 MLP with ZERO local arrays + FP16 fetchWeight8!
const DEEP_MLP_VERT_GLSL = `${COMMON_GLSL_HEADER}

float evalNeuronReg24(
  uint rowOff,
  uint prevLen,
  float bias,
  vec4 a0,
  vec4 a1,
  vec4 a2,
  vec4 a3,
  vec4 a4,
  vec4 a5
) {
  float sum = bias;
  if (prevLen >= 8u) {
    vec4 w0, w1;
    fetchWeight8(rowOff, w0, w1);
    sum += dot(a0, w0) + dot(a1, w1);
    if (prevLen >= 16u) {
      fetchWeight8(rowOff + 8u, w0, w1);
      sum += dot(a2, w0) + dot(a3, w1);
      if (prevLen >= 24u) {
        fetchWeight8(rowOff + 16u, w0, w1);
        sum += dot(a4, w0) + dot(a5, w1);
      } else if (prevLen >= 20u) {
        sum += dot(a4, fetchWeight4(rowOff + 16u));
      }
    } else if (prevLen >= 12u) {
      sum += dot(a2, fetchWeight4(rowOff + 8u));
    }
  } else if (prevLen >= 4u) {
    sum += dot(a0, fetchWeight4(rowOff));
  }
  uint rem = prevLen & 3u;
  if (rem != 0u) {
    uint base = prevLen - rem;
    vec4 tailA = base == 0u
      ? a0
      : base == 4u
        ? a1
        : base == 8u
          ? a2
          : base == 12u
            ? a3
            : base == 16u
              ? a4
              : a5;
    sum += tailA.x * fetchWeight(rowOff + base);
    if (rem > 1u) sum += tailA.y * fetchWeight(rowOff + base + 1u);
    if (rem > 2u) sum += tailA.z * fetchWeight(rowOff + base + 2u);
  }
  return sum;
}

void main() {
${PIPE_LOOP_PREAMBLE_GLSL}

  uint lastLayer = transitions - 1u;

  while (frameCount < maxFrames) {
${PIPE_STEP_AND_SENSORS_GLSL}

    vec4 a0 = vec4(
      getRawSensor(s0, raw0, raw1, raw2, raw3, raw4, raw5),
      inCount > 1u ? getRawSensor(s1, raw0, raw1, raw2, raw3, raw4, raw5) : 0.0,
      inCount > 2u ? getRawSensor(s2, raw0, raw1, raw2, raw3, raw4, raw5) : 0.0,
      inCount > 3u ? getRawSensor(s3, raw0, raw1, raw2, raw3, raw4, raw5) : 0.0
    );
    vec4 a1 = vec4(
      inCount > 4u ? getRawSensor(s4, raw0, raw1, raw2, raw3, raw4, raw5) : 0.0,
      inCount > 5u ? getRawSensor(s5, raw0, raw1, raw2, raw3, raw4, raw5) : 0.0,
      0.0,
      0.0
    );
    vec4 a2 = vec4(0.0);
    vec4 a3 = vec4(0.0);
    vec4 a4 = vec4(0.0);
    vec4 a5 = vec4(0.0);

    uint cursor = weightOffset;
    for (uint l = 0u; l < lastLayer; l++) {
      uint prevLen = getLayerDim(topoMeta0, topoMeta1, l);
      uint nextLen = getLayerDim(topoMeta0, topoMeta1, l + 1u);
      uint bOff = cursor + prevLen * nextLen;
      vec4 b0 = vec4(0.0);
      vec4 b1 = vec4(0.0);
      vec4 b2 = vec4(0.0);
      vec4 b3 = vec4(0.0);
      vec4 b4 = vec4(0.0);
      vec4 b5 = vec4(0.0);

      for (uint g = 0u; g < nextLen; g += 4u) {
        vec4 res = vec4(0.0);
        if (g + 4u <= nextLen) {
          vec4 bv = fetchWeight4(bOff + g);
          res.x = fastTanh(evalNeuronReg24(cursor + (g + 0u) * prevLen, prevLen, bv.x, a0, a1, a2, a3, a4, a5));
          res.y = fastTanh(evalNeuronReg24(cursor + (g + 1u) * prevLen, prevLen, bv.y, a0, a1, a2, a3, a4, a5));
          res.z = fastTanh(evalNeuronReg24(cursor + (g + 2u) * prevLen, prevLen, bv.z, a0, a1, a2, a3, a4, a5));
          res.w = fastTanh(evalNeuronReg24(cursor + (g + 3u) * prevLen, prevLen, bv.w, a0, a1, a2, a3, a4, a5));
        } else {
          res.x = fastTanh(evalNeuronReg24(cursor + (g + 0u) * prevLen, prevLen, fetchWeight(bOff + g + 0u), a0, a1, a2, a3, a4, a5));
          if (g + 1u < nextLen) {
            res.y = fastTanh(evalNeuronReg24(cursor + (g + 1u) * prevLen, prevLen, fetchWeight(bOff + g + 1u), a0, a1, a2, a3, a4, a5));
          }
          if (g + 2u < nextLen) {
            res.z = fastTanh(evalNeuronReg24(cursor + (g + 2u) * prevLen, prevLen, fetchWeight(bOff + g + 2u), a0, a1, a2, a3, a4, a5));
          }
        }
        if (g == 0u) b0 = res;
        else if (g == 4u) b1 = res;
        else if (g == 8u) b2 = res;
        else if (g == 12u) b3 = res;
        else if (g == 16u) b4 = res;
        else b5 = res;
      }

      a0 = b0;
      a1 = b1;
      a2 = b2;
      a3 = b3;
      a4 = b4;
      a5 = b5;
      cursor = bOff + nextLen;
    }

    uint prevLen = getLayerDim(topoMeta0, topoMeta1, lastLayer);
    float outSum = evalNeuronReg24(
      cursor,
      prevLen,
      fetchWeight(cursor + prevLen),
      a0,
      a1,
      a2,
      a3,
      a4,
      a5
    );

    if (outSum > 0.0) {
      vy = jumpImpulse;
    }

${PIPE_COLLISION_AND_SCORE_GLSL}
  }

  if (survivedFull == 0u && frameCount >= maxFrames && score >= targetPipeCap) {
    survivedFull = 1u;
  }

  vResult = vec4(float(score), float(frameCount), float(survivedFull), fitness);
}
`;

const DUMMY_FRAG_GLSL = `#version 300 es
precision lowp float;
out vec4 fragColor;
void main() {
  fragColor = vec4(0.0);
}
`;

function createGl2Context(): WebGL2RenderingContext | null {
  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      const c = new OffscreenCanvas(1, 1);
      const gl = c.getContext('webgl2', {
        powerPreference: 'high-performance',
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
      }) as WebGL2RenderingContext | null;
      if (gl) return gl;
    }
  } catch {
    // Fallback below
  }
  try {
    if (typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      c.width = 1;
      c.height = 1;
      return c.getContext('webgl2', {
        powerPreference: 'high-performance',
        antialias: false,
        depth: false,
        stencil: false,
      });
    }
  } catch {
    // Ignore
  }
  return null;
}

export function detectIntegratedGpu(name: string): boolean {
  const lower = name.toLowerCase();
  if (
    lower.includes('rtx') ||
    lower.includes('gtx') ||
    lower.includes('radeon rx') ||
    lower.includes('arc a') ||
    lower.includes('arc b') ||
    lower.includes('quadro') ||
    lower.includes('tesla') ||
    lower.includes('apple m')
  ) {
    return false;
  }
  return (
    lower.includes('intel') ||
    lower.includes('uhd') ||
    lower.includes('iris') ||
    lower.includes('hd graphics') ||
    lower.includes('vega') ||
    lower.includes('radeon(tm) graphics')
  );
}

function readRendererInfo(gl: WebGL2RenderingContext): {
  label: string;
  isSoftware: boolean;
  isIntegrated: boolean;
} {
  let renderer = '';
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  if (dbg) {
    renderer = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) ?? '');
  }
  if (!renderer) {
    renderer = String(gl.getParameter(gl.RENDERER) ?? '');
  }
  const lower = renderer.toLowerCase();
  const isSoftware =
    lower.includes('swiftshader') ||
    lower.includes('llvmpipe') ||
    lower.includes('software') ||
    lower.includes('basic render driver') ||
    lower.includes('softpipe');

  let clean = renderer.trim();
  const angleMatch = clean.match(/^ANGLE\s*\(([^)]+)\)/i);
  if (angleMatch) {
    const parts = angleMatch[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    clean = parts[1] ?? parts[0] ?? clean;
    clean = clean
      .replace(/\s*\(0x[0-9a-f]+\).*/i, '')
      .replace(/Direct3D11.*$/i, '')
      .replace(/Vulkan.*$/i, '')
      .trim();
  }
  if (clean.length > 34) {
    clean = `${clean.slice(0, 33)}…`;
  }
  const isIntegrated = !isSoftware && detectIntegratedGpu(renderer);
  return {
    label: clean || 'WebGL2 GPU',
    isSoftware,
    isIntegrated,
  };
}

export function probeWebGl2Info(): {
  available: boolean;
  label: string;
  isSoftware: boolean;
  isIntegrated: boolean;
  reason?: string;
} {
  const gl = createGl2Context();
  if (!gl) {
    return {
      available: false,
      label: 'Unavailable',
      isSoftware: false,
      isIntegrated: false,
      reason:
        'WebGL2 context could not be created (hardware acceleration may be disabled)',
    };
  }
  const info = readRendererInfo(gl);
  try {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    // Ignore cleanup error
  }
  return {
    available: true,
    label: info.isSoftware ? `${info.label} (SW)` : info.label,
    isSoftware: info.isSoftware,
    isIntegrated: info.isIntegrated,
    reason: info.isSoftware
      ? 'Browser is using a CPU software GPU renderer (SwiftShader/llvmpipe) — enable Hardware Acceleration in browser settings for real GPU speed'
      : undefined,
  };
}

function compileTransformFeedbackProgram(
  gl: WebGL2RenderingContext,
  vertSource: string,
  tag: string
): WebGLProgram {
  const vs = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vs, vertSource);
  gl.compileShader(vs);
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(vs) ?? 'Unknown vertex shader error';
    gl.deleteShader(vs);
    throw new Error(`WebGL2 ${tag} VS compile error: ${log}`);
  }

  const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(fs, DUMMY_FRAG_GLSL);
  gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(fs) ?? 'Unknown fragment shader error';
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    throw new Error(`WebGL2 ${tag} FS compile error: ${log}`);
  }

  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.transformFeedbackVaryings(program, ['vResult'], gl.INTERLEAVED_ATTRIBS);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? 'Unknown link error';
    gl.deleteProgram(program);
    throw new Error(`WebGL2 ${tag} program link error: ${log}`);
  }

  gl.useProgram(program);
  gl.uniform1i(gl.getUniformLocation(program, 'uTasksU32'), 0);
  gl.uniform1i(gl.getUniformLocation(program, 'uTasksF32'), 1);
  gl.uniform1i(gl.getUniformLocation(program, 'uWeightsU32'), 2);
  return program;
}

interface Gl2PipelineSlot {
  tasksU32Tex: WebGLTexture;
  tasksF32Tex: WebGLTexture;
  weightsU32Tex: WebGLTexture;
  outBuf: WebGLBuffer;
  tasksTexHeight: number;
  weightsTexHeight: number;
  outCapFloats: number;
  packedTasksU32: Uint32Array;
  packedTasksF32: Float32Array;
  packedWeightsU32: Uint32Array;
  readbackF32: Float32Array;
}

interface Gl2PendingBatch extends GpuPendingBatch {
  sync: WebGLSync | null;
  submittedAtMs: number;
}

export class WebGl2Evaluator {
  readonly engine = 'WEBGL2' as const;
  readonly adapterLabel: string;
  readonly isSoftware: boolean;
  readonly isIntegrated: boolean;
  readonly supportsBioKernels = true;
  readonly supportsFullFrontier = false;
  readonly recommendedAuditCap = 1200;
  webgpuFallbackReason?: string;

  private gl: WebGL2RenderingContext;
  private fastProgram: WebGLProgram;
  private compactDeepProgram: WebGLProgram;
  private deepProgram: WebGLProgram;
  private bioProgram: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private tf: WebGLTransformFeedback;
  private slots: [Gl2PipelineSlot, Gl2PipelineSlot];
  private lastGpuCompleteMs = 0;

  private constructor(
    gl: WebGL2RenderingContext,
    fastProgram: WebGLProgram,
    compactDeepProgram: WebGLProgram,
    deepProgram: WebGLProgram,
    bioProgram: WebGLProgram,
    adapterLabel: string,
    isSoftware: boolean,
    isIntegrated: boolean
  ) {
    this.gl = gl;
    this.fastProgram = fastProgram;
    this.compactDeepProgram = compactDeepProgram;
    this.deepProgram = deepProgram;
    this.bioProgram = bioProgram;
    this.adapterLabel = adapterLabel;
    this.isSoftware = isSoftware;
    this.isIntegrated = isIntegrated;

    this.vao = gl.createVertexArray()!;
    this.tf = gl.createTransformFeedback()!;
    this.slots = [this.createPipelineSlot(), this.createPipelineSlot()];
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  }

  private createPipelineSlot(): Gl2PipelineSlot {
    return {
      tasksU32Tex: this.createNearestTex(),
      tasksF32Tex: this.createNearestTex(),
      weightsU32Tex: this.createNearestTex(),
      outBuf: this.gl.createBuffer()!,
      tasksTexHeight: 0,
      weightsTexHeight: 0,
      outCapFloats: 0,
      packedTasksU32: new Uint32Array(0),
      packedTasksF32: new Float32Array(0),
      packedWeightsU32: new Uint32Array(0),
      readbackF32: new Float32Array(0),
    };
  }

  private createNearestTex(): WebGLTexture {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  static create(webgpuFallbackReason?: string): WebGl2Evaluator {
    const gl = createGl2Context();
    if (!gl) {
      throw new Error('WebGL2 context unavailable.');
    }

    const fastProgram = compileTransformFeedbackProgram(
      gl,
      FAST_REGISTER_VERT_GLSL,
      'FAST'
    );
    const compactDeepProgram = compileTransformFeedbackProgram(
      gl,
      COMPACT_DEEP_VERT_GLSL,
      'COMPACT_DEEP'
    );
    const deepProgram = compileTransformFeedbackProgram(
      gl,
      DEEP_MLP_VERT_GLSL,
      'DEEP'
    );
    const bioProgram = compileTransformFeedbackProgram(
      gl,
      BIO_NEURON_VERT_GLSL,
      'BIO'
    );

    const info = readRendererInfo(gl);
    const inst = new WebGl2Evaluator(
      gl,
      fastProgram,
      compactDeepProgram,
      deepProgram,
      bioProgram,
      `WebGL2 · ${info.label}`,
      info.isSoftware,
      info.isIntegrated
    );
    inst.webgpuFallbackReason = webgpuFallbackReason;
    return inst;
  }

  private ensureSlotTexturesAndBuffers(
    slot: Gl2PipelineSlot,
    taskCount: number,
    weightFloatCount: number
  ): { taskH: number; weightH: number } {
    const gl = this.gl;
    const neededTaskTexels = taskCount * 2;
    const taskH = Math.max(1, Math.ceil(neededTaskTexels / TASKS_TEX_WIDTH));
    const neededTaskElems = taskH * TASKS_TEX_WIDTH * 4;

    if (slot.packedTasksU32.length < neededTaskElems) {
      slot.packedTasksU32 = new Uint32Array(neededTaskElems);
      slot.packedTasksF32 = new Float32Array(neededTaskElems);
    }

    if (taskH > slot.tasksTexHeight) {
      slot.tasksTexHeight = taskH;
      gl.bindTexture(gl.TEXTURE_2D, slot.tasksU32Tex);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA32UI,
        TASKS_TEX_WIDTH,
        taskH,
        0,
        gl.RGBA_INTEGER,
        gl.UNSIGNED_INT,
        null
      );
      gl.bindTexture(gl.TEXTURE_2D, slot.tasksF32Tex);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA32F,
        TASKS_TEX_WIDTH,
        taskH,
        0,
        gl.RGBA,
        gl.FLOAT,
        null
      );
    }

    // 8 FP16 weights per RGBA32UI texel (4 u32 per texel, 2 FP16 per u32)
    const neededWeightTexels = Math.max(1, Math.ceil(weightFloatCount / 8));
    const weightH = Math.max(
      1,
      Math.ceil(neededWeightTexels / WEIGHTS_TEX_WIDTH)
    );
    const neededWeightElems = weightH * WEIGHTS_TEX_WIDTH * 4;
    if (slot.packedWeightsU32.length < neededWeightElems) {
      slot.packedWeightsU32 = new Uint32Array(neededWeightElems);
    }

    if (weightH > slot.weightsTexHeight) {
      slot.weightsTexHeight = weightH;
      gl.bindTexture(gl.TEXTURE_2D, slot.weightsU32Tex);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA32UI,
        WEIGHTS_TEX_WIDTH,
        weightH,
        0,
        gl.RGBA_INTEGER,
        gl.UNSIGNED_INT,
        null
      );
    }

    const neededOutFloats = taskCount * 4;
    if (neededOutFloats > slot.outCapFloats) {
      slot.outCapFloats = Math.max(neededOutFloats, slot.outCapFloats * 2, 16384);
      slot.readbackF32 = new Float32Array(slot.outCapFloats);
      gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, slot.outBuf);
      gl.bufferData(
        gl.TRANSFORM_FEEDBACK_BUFFER,
        slot.outCapFloats * 4,
        gl.DYNAMIC_READ
      );
      gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);
    }

    return { taskH, weightH };
  }

  submitRawBatch(
    slotIdx: number,
    taskCount: number,
    tasksU32: Uint32Array,
    weightsF32: Float32Array,
    weightFloatCount: number,
    kernelHint?: boolean | GpuKernelKind
  ): GpuPendingBatch {
    const safeSlot = slotIdx & 1;
    if (taskCount <= 0) {
      const empty: Gl2PendingBatch = {
        slotIdx: safeSlot,
        taskCount: 0,
        sync: null,
        submittedAtMs: performance.now(),
      };
      return empty;
    }

    const submittedAtMs = performance.now();
    const gl = this.gl;
    const slot = this.slots[safeSlot];
    const { taskH, weightH } = this.ensureSlotTexturesAndBuffers(
      slot,
      taskCount,
      weightFloatCount
    );

    const tasksF32View = new Float32Array(
      tasksU32.buffer,
      tasksU32.byteOffset,
      taskCount * TASK_STRIDE_U32
    );
    const dstU32 = slot.packedTasksU32;
    const dstF32 = slot.packedTasksF32;

    let kernelKind: GpuKernelKind =
      typeof kernelHint === 'number'
        ? kernelHint === 7
          ? 2
          : kernelHint >= 3
            ? 3
            : kernelHint
        : kernelHint
          ? 2
          : 0;

    for (let i = 0; i < taskCount; i++) {
      const srcBase = i * TASK_STRIDE_U32;
      const dstBase = i * 8;
      const meta0 = tasksU32[srcBase + 4];
      const meta1 = tasksU32[srcBase + 5];
      const flags = tasksU32[srcBase + 7];
      const archCode = (flags >>> 2) & 7;

      if (archCode !== 0) {
        kernelKind = 3;
      } else if (kernelKind < 2) {
        const tr = meta0 & 0xff;
        if (tr >= 3) {
          const d1 = (meta0 >>> 16) & 0xff;
          const d2 = (meta0 >>> 24) & 0xff;
          const d3 = meta1 & 0xff;
          const d4 = (meta1 >>> 8) & 0xff;
          const d5 = (meta1 >>> 16) & 0xff;
          if (d1 > 8 || d2 > 8 || d3 > 8 || d4 > 8 || d5 > 8) {
            kernelKind = 2;
          } else if (kernelKind < 1) {
            kernelKind = 1;
          }
        }
      }

      dstU32[dstBase + 0] = tasksU32[srcBase + 0];
      dstU32[dstBase + 1] = tasksU32[srcBase + 1];
      dstU32[dstBase + 2] = tasksU32[srcBase + 2];
      dstU32[dstBase + 3] = tasksU32[srcBase + 3];
      dstU32[dstBase + 4] = meta0;
      dstU32[dstBase + 5] = meta1;
      dstU32[dstBase + 6] = tasksU32[srcBase + 6];
      dstU32[dstBase + 7] = flags;

      dstF32[dstBase + 0] = tasksF32View[srcBase + 8];
      dstF32[dstBase + 1] = tasksF32View[srcBase + 9];
      dstF32[dstBase + 2] = tasksF32View[srcBase + 10];
      dstF32[dstBase + 3] = tasksF32View[srcBase + 11];
      dstF32[dstBase + 4] = tasksF32View[srcBase + 12];
      dstF32[dstBase + 5] = tasksF32View[srcBase + 13];
      dstF32[dstBase + 6] = tasksF32View[srcBase + 14];
      dstF32[dstBase + 7] = tasksF32View[srcBase + 15];
    }

    packWeightsF32ToHalfU32(weightsF32, weightFloatCount, slot.packedWeightsU32);

    const taskUploadElems = taskH * TASKS_TEX_WIDTH * 4;
    const weightUploadElems = weightH * WEIGHTS_TEX_WIDTH * 4;

    const activeProgram =
      kernelKind === 3
        ? this.bioProgram
        : kernelKind === 2
          ? this.deepProgram
          : kernelKind === 1
            ? this.compactDeepProgram
            : this.fastProgram;
    gl.useProgram(activeProgram);
    gl.bindVertexArray(this.vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, slot.tasksU32Tex);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      TASKS_TEX_WIDTH,
      taskH,
      gl.RGBA_INTEGER,
      gl.UNSIGNED_INT,
      dstU32.subarray(0, taskUploadElems)
    );

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, slot.tasksF32Tex);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      TASKS_TEX_WIDTH,
      taskH,
      gl.RGBA,
      gl.FLOAT,
      dstF32.subarray(0, taskUploadElems)
    );

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, slot.weightsU32Tex);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      WEIGHTS_TEX_WIDTH,
      weightH,
      gl.RGBA_INTEGER,
      gl.UNSIGNED_INT,
      slot.packedWeightsU32.subarray(0, weightUploadElems)
    );

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.tf);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, slot.outBuf);
    gl.enable(gl.RASTERIZER_DISCARD);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, taskCount);
    gl.endTransformFeedback();
    gl.disable(gl.RASTERIZER_DISCARD);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();

    const pending: Gl2PendingBatch = {
      slotIdx: safeSlot,
      taskCount,
      sync,
      submittedAtMs,
    };
    return pending;
  }

  discardPendingBatch(pending: GpuPendingBatch): void {
    const p = pending as Gl2PendingBatch;
    if (p.sync) {
      this.gl.deleteSync(p.sync);
      p.sync = null;
    }
  }

  async awaitRawBatch(pending: GpuPendingBatch): Promise<GpuBatchResult> {
    const p = pending as Gl2PendingBatch;
    const taskCount = p.taskCount;
    if (taskCount <= 0) {
      return {
        scores: new Uint32Array(0),
        ticks: new Uint32Array(0),
        survivedFull: new Uint32Array(0),
        fitnesses: new Float32Array(0),
        totalTicks: 0,
        dispatchMs: 0,
      };
    }

    const gl = this.gl;
    const slot = this.slots[p.slotIdx & 1];

    if (p.sync) {
      let spins = 0;
      while (spins < 500) {
        const res = gl.clientWaitSync(p.sync, 0, 0);
        if (res === gl.ALREADY_SIGNALED || res === gl.CONDITION_SATISFIED) {
          break;
        }
        if (res === gl.WAIT_FAILED) break;
        spins += 1;
        await new Promise((r) => setTimeout(r, spins < 4 ? 0 : 1));
      }
      if (p.sync) {
        gl.deleteSync(p.sync);
        p.sync = null;
      }
    }

    gl.bindBuffer(gl.COPY_READ_BUFFER, slot.outBuf);
    gl.getBufferSubData(
      gl.COPY_READ_BUFFER,
      0,
      slot.readbackF32,
      0,
      taskCount * 4
    );
    gl.bindBuffer(gl.COPY_READ_BUFFER, null);

    const scores = new Uint32Array(taskCount);
    const ticks = new Uint32Array(taskCount);
    const survivedFull = new Uint32Array(taskCount);
    const fitnesses = new Float32Array(taskCount);
    let totalTicks = 0;

    for (let i = 0; i < taskCount; i++) {
      const off = i * 4;
      scores[i] = slot.readbackF32[off] >>> 0;
      const tk = slot.readbackF32[off + 1] >>> 0;
      ticks[i] = tk;
      survivedFull[i] = slot.readbackF32[off + 2] > 0.5 ? 1 : 0;
      fitnesses[i] = slot.readbackF32[off + 3];
      totalTicks += tk;
    }

    const now = performance.now();
    // Non-overlapping GPU active window accounting (prevents double-counting in 2-slot pipelined mode)
    const effectiveStart = Math.max(p.submittedAtMs, this.lastGpuCompleteMs);
    const dispatchMs = Math.max(0.1, now - effectiveStart);
    this.lastGpuCompleteMs = now;

    return {
      scores,
      ticks,
      survivedFull,
      fitnesses,
      totalTicks,
      dispatchMs,
    };
  }

  async evaluateRawBatch(
    taskCount: number,
    tasksU32: Uint32Array,
    weightsF32: Float32Array,
    weightFloatCount: number,
    kernelHint?: boolean | GpuKernelKind
  ): Promise<GpuBatchResult> {
    if (taskCount <= 0) {
      return {
        scores: new Uint32Array(0),
        ticks: new Uint32Array(0),
        survivedFull: new Uint32Array(0),
        fitnesses: new Float32Array(0),
        totalTicks: 0,
        dispatchMs: 0,
      };
    }
    const pending = this.submitRawBatch(
      0,
      taskCount,
      tasksU32,
      weightsF32,
      weightFloatCount,
      kernelHint
    );
    return this.awaitRawBatch(pending);
  }

  dispose(): void {
    const gl = this.gl;
    for (const slot of this.slots) {
      gl.deleteTexture(slot.tasksU32Tex);
      gl.deleteTexture(slot.tasksF32Tex);
      gl.deleteTexture(slot.weightsU32Tex);
      gl.deleteBuffer(slot.outBuf);
    }
    gl.deleteTransformFeedback(this.tf);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.fastProgram);
    gl.deleteProgram(this.compactDeepProgram);
    gl.deleteProgram(this.deepProgram);
    gl.deleteProgram(this.bioProgram);
    try {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      // Ignore
    }
  }
}
