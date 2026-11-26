/**
 * WebGPU Compute Shader (WGSL) Mega-Batch Simulation Evaluator.
 *
 * Tri-Kernel Full-Frontier Architecture (all 9 architectures + 7 sensors + Shaped Fitness + Curriculum):
 * 1) FAST_REGISTER_WGSL (Depth 0, 1, 2 MLP with H1<=8):
 *    - ZERO local arrays anywhere -> 0 bytes private stack spill -> peak GPU SIMD occupancy!
 *    - 5-slot pure-register vec4<f32> pipe queue (p0..p4) with 2-pipe lookahead (N2Y) & Shaped Fitness.
 *    - Register-cached weights for Depth 0 & Depth 1 (H <= 4) -> ZERO VRAM reads inside the physics loop!
 * 2) DEEP_MLP_WGSL (Depth >= 2 MLP, width up to 24):
 *    - Same zero-array vec4<f32> pipe queue, compiled as a separate ComputePipeline so its
 *      actA[24]/actB[24] scratch arrays NEVER pollute FAST_REGISTER_WGSL's register allocation!
 * 3) BIO_REASONING_WGSL (ALL 9 architectures: MLP, RESIDUAL_SKIP, LTC_FLY, NEUROCHEM_GATE,
 *    SYNAPTIC_STP, LOOPED_REASONER, PONDER_ACT, SELECTIVE_SSM / MinGRU, LATENT_ROLLOUT):
 *    - Full stateful hidden dynamics, K-step test-time compute, ACT halting gate, and 2-step
 *      counterfactual world-model rollouts directly in WGSL (Depth 0..4, width <= 16, totalHidden <= 24).
 * All 3 kernels drain a persistent atomic work queue with 2-slot ping-pong double-buffering.
 */

import type {
  DifficultyPreset,
  EnvironmentConfig,
  NetworkArchitecture,
} from './types';
import {
  GRAVITY,
  JUMP_IMPULSE,
  resolveEnvironment,
} from './simulation';
import {
  detectIntegratedGpu,
  probeWebGl2Info,
  WebGl2Evaluator,
} from './webgl2Evaluator';

interface GpuAdapterInfoLike {
  vendor?: string;
  architecture?: string;
  device?: string;
  description?: string;
}

interface GpuAdapterLike {
  info?: GpuAdapterInfoLike;
  requestAdapterInfo?: () => Promise<GpuAdapterInfoLike>;
  requestDevice: (descriptor?: {
    requiredLimits?: Record<string, number>;
  }) => Promise<GpuDeviceLike>;
  limits?: {
    maxStorageBufferBindingSize?: number;
    maxBufferSize?: number;
    maxComputeWorkgroupsPerDimension?: number;
  };
}

interface GpuBufferLike {
  size: number;
  destroy: () => void;
  mapAsync: (mode: number, offset?: number, size?: number) => Promise<void>;
  getMappedRange: (offset?: number, size?: number) => ArrayBuffer;
  unmap: () => void;
}

interface GpuShaderModuleLike {
  getCompilationInfo?: () => Promise<{
    messages: Array<{ type: string; message: string; lineNum: number }>;
  }>;
}

interface GpuComputePipelineLike {
  getBindGroupLayout: (index: number) => unknown;
}

interface GpuComputePassEncoderLike {
  setPipeline: (pipeline: GpuComputePipelineLike) => void;
  setBindGroup: (index: number, bindGroup: unknown) => void;
  dispatchWorkgroups: (x: number, y?: number, z?: number) => void;
  end: () => void;
}

interface GpuCommandEncoderLike {
  beginComputePass: () => GpuComputePassEncoderLike;
  copyBufferToBuffer: (
    src: GpuBufferLike,
    srcOffset: number,
    dst: GpuBufferLike,
    dstOffset: number,
    size: number
  ) => void;
  finish: () => unknown;
}

interface GpuDeviceLike {
  limits: {
    maxStorageBufferBindingSize: number;
    maxBufferSize: number;
    maxComputeWorkgroupsPerDimension: number;
  };
  queue: {
    writeBuffer: (
      buffer: GpuBufferLike,
      bufferOffset: number,
      data: BufferSource | ArrayBufferLike,
      dataOffset?: number,
      size?: number
    ) => void;
    submit: (commandBuffers: unknown[]) => void;
    onSubmittedWorkDone?: () => Promise<void>;
  };
  createShaderModule: (desc: { code: string }) => GpuShaderModuleLike;
  createComputePipeline: (desc: {
    layout: 'auto';
    compute: { module: GpuShaderModuleLike; entryPoint: string };
  }) => GpuComputePipelineLike;
  createBuffer: (desc: { size: number; usage: number }) => GpuBufferLike;
  createBindGroup: (desc: {
    layout: unknown;
    entries: Array<{ binding: number; resource: { buffer: GpuBufferLike } }>;
  }) => unknown;
  createCommandEncoder: () => GpuCommandEncoderLike;
  destroy: () => void;
}

interface NavigatorGpuLike {
  requestAdapter: (options?: {
    powerPreference?: 'high-performance' | 'low-power';
  }) => Promise<GpuAdapterLike | null>;
}

const GPU_BUFFER_USAGE = {
  MAP_READ: 0x0001,
  COPY_SRC: 0x0004,
  COPY_DST: 0x0008,
  UNIFORM: 0x0040,
  STORAGE: 0x0080,
} as const;

const GPU_MAP_MODE_READ = 0x0001;

export type GpuEngineKind = 'WEBGPU' | 'WEBGL2' | 'NONE';

export interface WebGpuProbeInfo {
  available: boolean;
  engine: GpuEngineKind;
  label: string;
  isSoftware?: boolean;
  isIntegrated?: boolean;
  reason?: string;
  webgpuReason?: string;
}

export interface GpuPendingBatch {
  readonly slotIdx: number;
  readonly taskCount: number;
}

/**
 * Dynamic WebGPU Compute Pipeline Tiers:
 * 0 = FAST_REGISTER (Depth 0 & 1 MLP, ultra-lean SIMD16)
 * 1 = COMPACT_DEEP (Depth 2..5 MLP with maxWidth <= 8)
 * 2 = DEEP_24 (Depth >= 2 MLP with maxWidth <= 24)
 * 3 = BIO_TINY (Bio + Reasoning, maxWidth <= 8, totalHidden <= 12 -> 292 B/thread)
 * 4 = BIO_STD  (Bio + Reasoning, maxWidth <= 16, totalHidden <= 24 -> 468 B/thread)
 * 5 = BIO_MED  (Bio + Reasoning, maxWidth <= 32, totalHidden <= 36 -> 836 B/thread, lazy JIT)
 * 6 = BIO_LARGE (Bio + Reasoning, maxWidth <= 64, totalHidden <= 64 -> 1.58 KB/thread, lazy JIT)
 * 7 = DEEP_64  (Depth >= 2 MLP with maxWidth 25..64, lazy JIT)
 */
export type GpuKernelKind = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface GpuCalibrationProfile {
  /** Measured slowdown ratio of BIO_STD vs BIO_TINY (>1.5 indicates tight register file / AMD/Intel spill) */
  registerPressureRatio: number;
  /** Calibrated persistent workgroup count for this GPU */
  calibratedWorkgroups: number;
  /** Safe hard wave duration ceiling (ms) well below Windows 2000ms TDR reset */
  tdrCeilingMs: number;
}

export function encodeArchitectureCode(arch?: NetworkArchitecture): number {
  switch (arch) {
    case 'RESIDUAL_SKIP':
      return 1;
    case 'LTC_FLY':
      return 2;
    case 'NEUROCHEM_GATE':
      return 3;
    case 'SYNAPTIC_STP':
      return 4;
    case 'LOOPED_REASONER':
      return 5;
    case 'PONDER_ACT':
      return 6;
    case 'SELECTIVE_SSM':
      return 7;
    case 'LATENT_ROLLOUT':
      return 8;
    case 'DROSOPHILA_CONNECTOME':
      return 9;
    default:
      return 0;
  }
}

export interface GpuComputeEvaluator {
  readonly engine: 'WEBGPU' | 'WEBGL2';
  readonly adapterLabel: string;
  readonly isIntegrated?: boolean;
  readonly supportsBioKernels?: boolean;
  /** True on WebGPU WGSL: supports all 12 dual-pipe/TTF sensors, Shaped Fitness, Curriculum Annealing, and all 10 GPU architectures up to 64/64 */
  readonly supportsFullFrontier?: boolean;
  readonly recommendedAuditCap: number;
  readonly webgpuFallbackReason?: string;
  readonly calibration?: GpuCalibrationProfile;
  prepareKernelTier?(kind: GpuKernelKind): Promise<void>;
  evaluateRawBatch(
    taskCount: number,
    tasksU32: Uint32Array,
    weightsF32: Float32Array,
    weightFloatCount: number,
    kernelHint?: boolean | GpuKernelKind
  ): Promise<GpuBatchResult>;
  submitRawBatch?(
    slotIdx: number,
    taskCount: number,
    tasksU32: Uint32Array,
    weightsF32: Float32Array,
    weightFloatCount: number,
    kernelHint?: boolean | GpuKernelKind
  ): GpuPendingBatch;
  awaitRawBatch?(pending: GpuPendingBatch): Promise<GpuBatchResult>;
  discardPendingBatch?(pending: GpuPendingBatch): void;
  dispose(): void;
}

async function requestWebGpuAdapterMulti(
  navGpu: NavigatorGpuLike
): Promise<GpuAdapterLike | null> {
  const attempts: Array<
    { powerPreference?: 'high-performance' | 'low-power' } | undefined
  > = [
    { powerPreference: 'high-performance' },
    undefined,
    { powerPreference: 'low-power' },
  ];
  for (const opts of attempts) {
    try {
      const adapter = await navGpu.requestAdapter(opts);
      if (adapter) return adapter;
    } catch {
      // Try next preference
    }
  }
  return null;
}

export async function probeWebGpuInfo(): Promise<WebGpuProbeInfo> {
  let webgpuReason = '';
  const nav =
    typeof navigator !== 'undefined'
      ? (navigator as unknown as { gpu?: NavigatorGpuLike })
      : null;

  if (!nav?.gpu) {
    webgpuReason = 'Browser does not expose navigator.gpu';
  } else {
    try {
      const adapter = await requestWebGpuAdapterMulti(nav.gpu);
      if (adapter) {
        let info: GpuAdapterInfoLike | undefined = adapter.info;
        if (!info && adapter.requestAdapterInfo) {
          try {
            info = await adapter.requestAdapterInfo();
          } catch {
            info = undefined;
          }
        }
        const rawName = [
          info?.description,
          info?.device,
          info?.vendor,
          info?.architecture,
        ]
          .filter((s): s is string => Boolean(s && s.trim().length > 0))
          .slice(0, 2)
          .join(' · ');
        return {
          available: true,
          engine: 'WEBGPU',
          label: `WebGPU · ${rawName || 'GPU'}`,
          isSoftware: false,
          isIntegrated: detectIntegratedGpu(rawName),
        };
      }
      webgpuReason =
        'WebGPU adapter returned null (iframe/driver/Linux flag restriction)';
    } catch (err) {
      webgpuReason = err instanceof Error ? err.message : String(err);
    }
  }

  const gl2 = probeWebGl2Info();
  if (gl2.available) {
    return {
      available: true,
      engine: 'WEBGL2',
      label: `WebGL2 · ${gl2.label}`,
      isSoftware: gl2.isSoftware,
      isIntegrated: gl2.isIntegrated,
      reason: gl2.isSoftware
        ? gl2.reason
        : `WebGPU unavailable (${webgpuReason}) — using WebGL2 GPGPU Transform Feedback instead`,
      webgpuReason,
    };
  }

  return {
    available: false,
    engine: 'NONE',
    label: 'GPU N/A',
    reason: `${webgpuReason}; ${gl2.reason ?? 'WebGL2 unavailable'}`,
    webgpuReason,
  };
}

export interface GpuBatchResult {
  scores: Uint32Array;
  ticks: Uint32Array;
  survivedFull: Uint32Array;
  fitnesses: Float32Array;
  totalTicks: number;
  dispatchMs: number;
}

export const TASK_STRIDE_U32 = 20; // 80 bytes per TaskDesc (16-byte aligned)
const RESULT_STRIDE_U32 = 4; // 16 bytes per TaskResult
const WORKGROUP_SIZE = 64;
const MAX_PERSISTENT_WORKGROUPS = 512;

export function encodeTopologyAndSensors(
  layers: number[],
  activeIndices: number[]
): {
  topoMeta0: number;
  topoMeta1: number;
  sensorMask: number;
  sensorMask1: number;
} {
  const numTransitions = Math.max(1, Math.min(6, layers.length - 1));
  const d0 = layers[0] ?? 5;
  const d1 = layers[1] ?? 1;
  const d2 = layers[2] ?? 0;
  const d3 = layers[3] ?? 0;
  const d4 = layers[4] ?? 0;
  const d5 = layers[5] ?? 0;
  const d6 = layers[6] ?? 0;

  const topoMeta0 =
    ((numTransitions & 0xff) |
      ((d0 & 0xff) << 8) |
      ((d1 & 0xff) << 16) |
      ((d2 & 0xff) << 24)) >>>
    0;
  const topoMeta1 =
    ((d3 & 0xff) |
      ((d4 & 0xff) << 8) |
      ((d5 & 0xff) << 16) |
      ((d6 & 0xff) << 24)) >>>
    0;

  let sensorMask = 0;
  let sensorMask1 = 0;
  for (let k = 0; k < activeIndices.length && k < 12; k++) {
    const idx = activeIndices[k] & 0xf;
    if (k < 8) {
      sensorMask |= idx << (k * 4);
    } else {
      sensorMask1 |= idx << ((k - 8) * 4);
    }
  }
  return {
    topoMeta0,
    topoMeta1,
    sensorMask: sensorMask >>> 0,
    sensorMask1: sensorMask1 >>> 0,
  };
}

export function writeTaskDescToBuffers(
  u32View: Uint32Array,
  f32View: Float32Array,
  taskIdx: number,
  spec: {
    weightOffset: number;
    seed: number;
    targetPipeCap: number;
    maxFrames: number;
    topoMeta0: number;
    topoMeta1: number;
    sensorMask: number;
    sensorMask1?: number;
    env: EnvironmentConfig;
    computeFitness: boolean;
    architecture?: NetworkArchitecture;
    shapedFitness?: boolean;
    reasoningSteps?: number;
    metabolicStepCost?: number;
  }
): void {
  const base = taskIdx * TASK_STRIDE_U32;
  const env = spec.env;
  const archCode = encodeArchitectureCode(spec.architecture);
  const rSteps = Math.max(1, Math.min(8, Math.round(spec.reasoningSteps ?? 3)));
  const metaCode = Math.max(
    0,
    Math.min(15, Math.round((spec.metabolicStepCost ?? 0) / 0.005))
  );
  // Bit layout (100% backwards-compatible with WebGL2 for archCode 0..4):
  //   bit 0: movingPipes
  //   bit 1: computeFitness
  //   bits 2..5: archCode (0..8)
  //   bit 6: shapedFitness
  //   bits 7..10: reasoningSteps (1..8)
  //   bits 11..14: quantized metabolicStepCost (0..15 * 0.005 = 0.000..0.075)
  const flags =
    (env.movingPipes ? 1 : 0) |
    (spec.computeFitness ? 2 : 0) |
    ((archCode & 0xf) << 2) |
    (spec.shapedFitness ? 64 : 0) |
    ((rSteps & 0xf) << 7) |
    ((metaCode & 0xf) << 11);

  u32View[base + 0] = spec.weightOffset >>> 0;
  u32View[base + 1] = spec.seed >>> 0;
  u32View[base + 2] = spec.targetPipeCap >>> 0;
  u32View[base + 3] = spec.maxFrames >>> 0;

  u32View[base + 4] = spec.topoMeta0 >>> 0;
  u32View[base + 5] = spec.topoMeta1 >>> 0;
  u32View[base + 6] = spec.sensorMask >>> 0;
  u32View[base + 7] = flags >>> 0;

  f32View[base + 8] = env.gap;
  f32View[base + 9] = env.gapVariance;
  f32View[base + 10] = env.pipeSpeed;
  f32View[base + 11] = env.speedVariability;

  f32View[base + 12] = env.pipeSpeed * env.spawnFrames;
  f32View[base + 13] = env.moveAmplitude;
  f32View[base + 14] = GRAVITY * env.gravityScale;
  f32View[base + 15] = JUMP_IMPULSE * Math.sqrt(env.gravityScale);

  u32View[base + 16] = (spec.sensorMask1 ?? 0) >>> 0;
  u32View[base + 17] = 0;
  u32View[base + 18] = 0;
  u32View[base + 19] = 0;
}

const COMMON_WGSL_HEADER = /* wgsl */ `
struct Params {
  taskCount: u32,
  pad0: u32,
  pad1: u32,
  pad2: u32,
};

struct WorkCounter {
  nextIdx: atomic<u32>,
};

struct TaskDesc {
  weightOffset: u32,
  seed: u32,
  targetPipeCap: u32,
  maxFrames: u32,
  topoMeta0: u32,
  topoMeta1: u32,
  sensorMask: u32,
  flags: u32,
  baseGap: f32,
  gapVar: f32,
  baseSpeed: f32,
  speedVar: f32,
  baseSpacing: f32,
  moveAmp: f32,
  gravity: f32,
  jumpImpulse: f32,
  sensorMask1: u32,
  padTask0: u32,
  padTask1: u32,
  padTask2: u32,
};

struct TaskResult {
  score: u32,
  ticks: u32,
  survivedFull: u32,
  fitness: f32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read_write> workCounter: WorkCounter;
@group(0) @binding(2) var<storage, read> tasks: array<TaskDesc>;
@group(0) @binding(3) var<storage, read> weights: array<f32>;
@group(0) @binding(4) var<storage, read_write> results: array<TaskResult>;

const CANVAS_WIDTH: f32 = 640.0;
const PLAYABLE_HEIGHT: f32 = 424.0;
const BIRD_X: f32 = 148.0;
const PIPE_WIDTH: f32 = 60.0;
const MAX_VY: f32 = 10.5;
const PIPE_HIT_R: f32 = 11.0;
const PIPE_HIT_R2: f32 = 121.0;
const FLOOR_HIT_R: f32 = 12.0;
const INV_HALF_PLAYABLE: f32 = 2.0 / 424.0;
const INV_MAX_VY: f32 = 1.0 / 10.5;
const INV_CANVAS_W: f32 = 1.0 / 640.0;
const INV_PIPE_VY: f32 = 0.5;
const INV_ALIGN_WINDOW: f32 = 1.0 / (424.0 * 0.6);
const MIN_PIPE_X: f32 = 135.0;
const TWO_PI: f32 = 6.28318530718;

fn next_rand(state: ptr<function, u32>) -> f32 {
  let a = (*state) + 0x6d2b79f5u;
  *state = a;
  var t = (a ^ (a >> 15u)) * (1u | a);
  t = (t + ((t ^ (t >> 7u)) * (61u | t))) ^ t;
  return f32(t ^ (t >> 14u)) / 4294967296.0;
}

fn fast_tanh(x: f32) -> f32 {
  return tanh(clamp(x, -15.0, 15.0));
}

fn fast_sigmoid(x: f32) -> f32 {
  return 1.0 / (1.0 + exp(-clamp(x, -15.0, 15.0)));
}

fn get_layer_dim(meta0: u32, meta1: u32, idx: u32) -> u32 {
  switch (idx) {
    case 0u: { return (meta0 >> 8u) & 0xffu; }
    case 1u: { return (meta0 >> 16u) & 0xffu; }
    case 2u: { return (meta0 >> 24u) & 0xffu; }
    case 3u: { return meta1 & 0xffu; }
    case 4u: { return (meta1 >> 8u) & 0xffu; }
    case 5u: { return (meta1 >> 16u) & 0xffu; }
    default: { return (meta1 >> 24u) & 0xffu; }
  }
}

fn get_raw_sensor(
  featIdx: u32,
  raw0: f32,
  raw1: f32,
  raw2: f32,
  raw3: f32,
  raw4: f32,
  raw5: f32,
  raw6: f32,
  raw7: f32,
  raw8: f32,
  raw9: f32,
  raw10: f32,
  raw11: f32
) -> f32 {
  switch (featIdx) {
    case 0u: { return raw0; }
    case 1u: { return raw1; }
    case 2u: { return raw2; }
    case 3u: { return raw3; }
    case 4u: { return raw4; }
    case 5u: { return raw5; }
    case 6u: { return raw6; }
    case 7u: { return raw7; }
    case 8u: { return raw8; }
    case 9u: { return raw9; }
    case 10u: { return raw10; }
    default: { return raw11; }
  }
}

fn update_moving_pipe(
  p: ptr<function, vec4<f32>>,
  m: ptr<function, vec2<f32>>,
  tickSpeed: f32,
  timeAngle: f32,
  moveAmp: f32
) {
  var pv = *p;
  var mv = *m;
  pv.x = pv.x - tickSpeed;
  let prevTop = pv.y;
  let offset = sin(timeAngle + mv.x) * moveAmp;
  let maxTop = PLAYABLE_HEIGHT - pv.z - 42.0;
  let clamped = clamp(pv.w + offset, 42.0, maxTop);
  pv.y = clamped;
  mv.y = clamped - prevTop;
  *p = pv;
  *m = mv;
}

fn load_row_a(rowOff: u32, inCount: u32) -> vec4<f32> {
  var r = vec4<f32>(0.0);
  if (inCount > 0u) { r.x = weights[rowOff + 0u]; }
  if (inCount > 1u) { r.y = weights[rowOff + 1u]; }
  if (inCount > 2u) { r.z = weights[rowOff + 2u]; }
  if (inCount > 3u) { r.w = weights[rowOff + 3u]; }
  return r;
}

fn load_row_b(rowOff: u32, inCount: u32, biasVal: f32) -> vec4<f32> {
  // x = w4, y = w5, z = bias, w = w6 (7th lookahead sensor N2Y)
  var r = vec4<f32>(0.0, 0.0, biasVal, 0.0);
  if (inCount > 4u) { r.x = weights[rowOff + 4u]; }
  if (inCount > 5u) { r.y = weights[rowOff + 5u]; }
  if (inCount > 6u) { r.w = weights[rowOff + 6u]; }
  return r;
}

fn load_row_c(rowOff: u32, inCount: u32) -> vec4<f32> {
  var r = vec4<f32>(0.0);
  if (inCount > 7u) { r.x = weights[rowOff + 7u]; }
  if (inCount > 8u) { r.y = weights[rowOff + 8u]; }
  if (inCount > 9u) { r.z = weights[rowOff + 9u]; }
  if (inCount > 10u) { r.w = weights[rowOff + 10u]; }
  return r;
}
`;

const WGSL_PIPE_PREAMBLE = /* wgsl */ `
  let task = tasks[taskIdx];
  var rng: u32 = task.seed;

  let movingPipes = (task.flags & 1u) != 0u;
  let computeFitness = (task.flags & 2u) != 0u;
  let archCode = (task.flags >> 2u) & 15u;
  let shapedFitness = (task.flags & 64u) != 0u;
  let reasoningSteps = clamp((task.flags >> 7u) & 15u, 1u, 8u);
  let metabolicCost = f32((task.flags >> 11u) & 15u) * 0.005;
  let hasSpeedVar = task.speedVar > 0.0;
  let hasGapVar = task.gapVar > 0.0;
  let hasAnyVar = hasSpeedVar || hasGapVar;
  let margin = select(52.0, 72.0, movingPipes);

  let speedPhaseA = next_rand(&rng) * TWO_PI;
  let speedPhaseB = next_rand(&rng) * TWO_PI;

  let transitions = task.topoMeta0 & 0xffu;
  let inCount = (task.topoMeta0 >> 8u) & 0xffu;
  let hLen = (task.topoMeta0 >> 16u) & 0xffu;
  let h2Len = (task.topoMeta0 >> 24u) & 0xffu;
  let s0 = task.sensorMask & 0xfu;
  let s1 = (task.sensorMask >> 4u) & 0xfu;
  let s2 = (task.sensorMask >> 8u) & 0xfu;
  let s3 = (task.sensorMask >> 12u) & 0xfu;
  let s4 = (task.sensorMask >> 16u) & 0xfu;
  let s5 = (task.sensorMask >> 20u) & 0xfu;
  let s6 = (task.sensorMask >> 24u) & 0xfu;
  let s7 = (task.sensorMask >> 28u) & 0xfu;
  let s8 = task.sensorMask1 & 0xfu;
  let s9 = (task.sensorMask1 >> 4u) & 0xfu;
  let s10 = (task.sensorMask1 >> 8u) & 0xfu;
  let s11 = (task.sensorMask1 >> 12u) & 0xfu;

  // 5-slot pure-register pipe queue (ZERO local arrays -> ZERO VRAM stack spill!)
  var p0 = vec4<f32>(0.0);
  var p1 = vec4<f32>(0.0);
  var p2 = vec4<f32>(0.0);
  var p3 = vec4<f32>(0.0);
  var p4 = vec4<f32>(0.0);
  var m0 = vec2<f32>(0.0);
  var m1 = vec2<f32>(0.0);
  var m2 = vec2<f32>(0.0);
  var m3 = vec2<f32>(0.0);
  var m4 = vec2<f32>(0.0);
  var pPassedMask: u32 = 0u;

  var initGap = task.baseGap;
  if (hasGapVar) {
    initGap = initGap + (next_rand(&rng) * 2.0 - 1.0) * task.gapVar;
  }
  initGap = clamp(initGap, 76.0, 204.0);
  let initSpan = max(20.0, PLAYABLE_HEIGHT - initGap - margin * 2.0);
  let initTop = margin + next_rand(&rng) * initSpan;
  p0 = vec4<f32>(CANVAS_WIDTH + 60.0, initTop, initGap, initTop);
  m0 = vec2<f32>(next_rand(&rng) * TWO_PI, 0.0);

  var count: u32 = 1u;
  var distUntilNextSpawn: f32 = task.baseSpacing;

  var y: f32 = PLAYABLE_HEIGHT * 0.46;
  var vy: f32 = 0.0;
  var score: u32 = 0u;
  var fitness: f32 = 0.0;
  var frameCount: u32 = 0u;
  var survivedFull: u32 = 0u;
`;

const WGSL_PIPE_STEP_AND_SENSORS = /* wgsl */ `
    frameCount = frameCount + 1u;

    var tickSpeed = task.baseSpeed;
    if (hasSpeedVar) {
      let fc = f32(frameCount);
      let speedMult = 1.0 + task.speedVar * (
        0.55 * sin(fc * 0.031 + speedPhaseA) +
        0.45 * cos(fc * 0.079 + speedPhaseB)
      );
      tickSpeed = max(1.2, task.baseSpeed * speedMult);
    }

    distUntilNextSpawn = distUntilNextSpawn - tickSpeed;
    if (distUntilNextSpawn <= 0.0 && count < 5u) {
      var pipeGap = task.baseGap;
      if (hasGapVar) {
        pipeGap = pipeGap + (next_rand(&rng) * 2.0 - 1.0) * task.gapVar;
      }
      pipeGap = clamp(pipeGap, 76.0, 204.0);
      let spanRange = max(20.0, PLAYABLE_HEIGHT - pipeGap - margin * 2.0);
      let baseTop = margin + next_rand(&rng) * spanRange;
      let newP = vec4<f32>(CANVAS_WIDTH + 20.0, baseTop, pipeGap, baseTop);
      let newM = vec2<f32>(next_rand(&rng) * TWO_PI, 0.0);
      if (count == 0u) { p0 = newP; m0 = newM; }
      else if (count == 1u) { p1 = newP; m1 = newM; }
      else if (count == 2u) { p2 = newP; m2 = newM; }
      else if (count == 3u) { p3 = newP; m3 = newM; }
      else { p4 = newP; m4 = newM; }
      pPassedMask = pPassedMask & ~(1u << count);
      count = count + 1u;

      if (hasAnyVar) {
        distUntilNextSpawn = task.baseSpacing * (0.88 + next_rand(&rng) * 0.24);
      } else {
        distUntilNextSpawn = task.baseSpacing;
      }
    }

    if (movingPipes) {
      let timeAngle = f32(frameCount) * 0.045;
      if (count > 0u) { update_moving_pipe(&p0, &m0, tickSpeed, timeAngle, task.moveAmp); }
      if (count > 1u) { update_moving_pipe(&p1, &m1, tickSpeed, timeAngle, task.moveAmp); }
      if (count > 2u) { update_moving_pipe(&p2, &m2, tickSpeed, timeAngle, task.moveAmp); }
      if (count > 3u) { update_moving_pipe(&p3, &m3, tickSpeed, timeAngle, task.moveAmp); }
      if (count > 4u) { update_moving_pipe(&p4, &m4, tickSpeed, timeAngle, task.moveAmp); }
    } else {
      p0.x = p0.x - tickSpeed;
      if (count > 1u) { p1.x = p1.x - tickSpeed; }
      if (count > 2u) { p2.x = p2.x - tickSpeed; }
      if (count > 3u) { p3.x = p3.x - tickSpeed; }
      if (count > 4u) { p4.x = p4.x - tickSpeed; }
    }

    if (count > 0u && p0.x + PIPE_WIDTH < -24.0) {
      p0 = p1; p1 = p2; p2 = p3; p3 = p4;
      m0 = m1; m1 = m2; m2 = m3; m3 = m4;
      pPassedMask = pPassedMask >> 1u;
      count = count - 1u;
    }

    var foundNext: bool = false;
    var foundNext2: bool = false;
    var np = vec4<f32>(0.0);
    var np2 = vec4<f32>(0.0);
    var npVy: f32 = 0.0;
    var np2Vy: f32 = 0.0;
    if (count > 0u && p0.x + PIPE_WIDTH >= MIN_PIPE_X) {
      np = p0; npVy = m0.y; foundNext = true;
      if (count > 1u) { np2 = p1; np2Vy = m1.y; foundNext2 = true; }
    } else if (count > 1u && p1.x + PIPE_WIDTH >= MIN_PIPE_X) {
      np = p1; npVy = m1.y; foundNext = true;
      if (count > 2u) { np2 = p2; np2Vy = m2.y; foundNext2 = true; }
    } else if (count > 2u && p2.x + PIPE_WIDTH >= MIN_PIPE_X) {
      np = p2; npVy = m2.y; foundNext = true;
      if (count > 3u) { np2 = p3; np2Vy = m3.y; foundNext2 = true; }
    } else if (count > 3u && p3.x + PIPE_WIDTH >= MIN_PIPE_X) {
      np = p3; npVy = m3.y; foundNext = true;
      if (count > 4u) { np2 = p4; np2Vy = m4.y; foundNext2 = true; }
    }

    let pipeEdgeX = select(CANVAS_WIDTH, np.x + PIPE_WIDTH, foundNext);
    let gapTop = select(PLAYABLE_HEIGHT * 0.35, np.y, foundNext);
    let gapBot = select(PLAYABLE_HEIGHT * 0.65, np.y + np.z, foundNext);
    let gapVyVal = select(0.0, npVy * INV_PIPE_VY, foundNext && movingPipes);
    let n2Center = np2.y + 0.5 * np2.z;
    let curCenter = 0.5 * (gapTop + gapBot);
    let n2GapTop = np2.y;
    let n2GapBot = np2.y + np2.z;

    let raw0 = y * INV_HALF_PLAYABLE - 1.0;
    let raw1 = clamp(vy * INV_MAX_VY, -1.0, 1.0);
    let raw2 = clamp((pipeEdgeX - BIRD_X) * INV_CANVAS_W, -0.2, 1.0);
    let raw3 = (y - gapTop) * INV_HALF_PLAYABLE;
    let raw4 = (gapBot - y) * INV_HALF_PLAYABLE;
    let raw5 = clamp(gapVyVal, -1.0, 1.0);
    let raw6 = select(0.0, clamp((n2Center - curCenter) * INV_HALF_PLAYABLE, -1.0, 1.0), foundNext && foundNext2);
    let raw7 = select(0.0, (y - n2GapTop) * INV_HALF_PLAYABLE, foundNext && foundNext2);
    let raw8 = select(0.0, (n2GapBot - y) * INV_HALF_PLAYABLE, foundNext && foundNext2);
    let raw9 = select(1.0, clamp((np2.x + PIPE_WIDTH - BIRD_X) * INV_CANVAS_W, -0.2, 1.0), foundNext && foundNext2);
    let raw10 = select(0.0, clamp(np2Vy * INV_PIPE_VY, -1.0, 1.0), foundNext && foundNext2 && movingPipes);
    let raw11 = select(1.0, clamp((pipeEdgeX - BIRD_X) / (max(1.2, tickSpeed) * 120.0), 0.0, 1.0), foundNext);
`;

const WGSL_PIPE_COLLISION_AND_SCORE = /* wgsl */ `
    vy = min(MAX_VY, vy + task.gravity);
    y = y + vy;

    if (y - FLOOR_HIT_R <= 0.0 || y + FLOOR_HIT_R >= PLAYABLE_HEIGHT) {
      if (computeFitness && score == 0u) {
        fitness = fitness * 0.85;
      }
      break;
    }

    if (foundNext) {
      let pipeLeft = np.x;
      let pipeRight = pipeLeft + PIPE_WIDTH;
      var dx: f32 = 0.0;
      if (BIRD_X < pipeLeft) {
        dx = pipeLeft - BIRD_X;
      } else if (BIRD_X > pipeRight) {
        dx = BIRD_X - pipeRight;
      }
      if (dx < PIPE_HIT_R) {
        let effY = sqrt(max(0.0, PIPE_HIT_R2 - dx * dx));
        if (y - effY < gapTop || y + effY > gapBot) {
          break;
        }
      }
    }

    if (computeFitness) {
      fitness = fitness + 0.1;
      if (foundNext) {
        let gapCenter = 0.5 * (gapTop + gapBot);
        let absDy = abs(y - gapCenter);
        if (shapedFitness) {
          let gapHalf = max(24.0, 0.5 * (gapBot - gapTop));
          let normErr = absDy / (gapHalf * 0.9);
          let centerReward = 0.42 / (1.0 + normErr * normErr);
          let insideCorridor = select(0.0, 0.12, y > gapTop + 14.0 && y < gapBot - 14.0);
          let jerkPenalty = 0.035 * abs(vy) * INV_MAX_VY;
          fitness = fitness + max(0.0, centerReward + insideCorridor - jerkPenalty);
        } else {
          let align = max(0.0, 1.0 - absDy * INV_ALIGN_WINDOW);
          fitness = fitness + 0.15 * align;
        }
      }
    }

    if (count > 0u && (pPassedMask & 1u) == 0u && p0.x + PIPE_WIDTH < BIRD_X) {
      pPassedMask = pPassedMask | 1u;
      score = score + 1u;
      if (computeFitness) { fitness = fitness + 40.0; }
      if (score >= task.targetPipeCap) {
        survivedFull = 1u;
        break;
      }
    }
    if (count > 1u && (pPassedMask & 2u) == 0u && p1.x + PIPE_WIDTH < BIRD_X) {
      pPassedMask = pPassedMask | 2u;
      score = score + 1u;
      if (computeFitness) { fitness = fitness + 40.0; }
      if (score >= task.targetPipeCap) {
        survivedFull = 1u;
        break;
      }
    }
`;

// KERNEL 1: ZERO local arrays, register-cached weights for Depth 0 & Depth 1 (H <= 4), supports up to 12 sensors + Shaped Fitness
const FAST_REGISTER_WGSL = `${COMMON_WGSL_HEADER}
fn evaluate_task(taskIdx: u32) {
${WGSL_PIPE_PREAMBLE}
  let _unusedArch = archCode + reasoningSteps;

  let isLinear = (transitions == 1u);
  let isSmallHidden = (transitions == 2u && hLen <= 4u);

  var h0A = vec4<f32>(0.0); var h0B = vec4<f32>(0.0); var h0C = vec4<f32>(0.0); var h0D: f32 = 0.0;
  var h1A = vec4<f32>(0.0); var h1B = vec4<f32>(0.0); var h1C = vec4<f32>(0.0); var h1D: f32 = 0.0;
  var h2A = vec4<f32>(0.0); var h2B = vec4<f32>(0.0); var h2C = vec4<f32>(0.0); var h2D: f32 = 0.0;
  var h3A = vec4<f32>(0.0); var h3B = vec4<f32>(0.0); var h3C = vec4<f32>(0.0); var h3D: f32 = 0.0;
  var outW = vec4<f32>(0.0);
  var outB: f32 = 0.0;

  if (isLinear) {
    h0A = load_row_a(task.weightOffset, inCount);
    h0B = load_row_b(task.weightOffset, inCount, weights[task.weightOffset + inCount]);
    h0C = load_row_c(task.weightOffset, inCount);
    if (inCount > 11u) { h0D = weights[task.weightOffset + 11u]; }
  } else if (isSmallHidden) {
    let b0Off = task.weightOffset + inCount * hLen;
    let w1Off = b0Off + hLen;
    outB = weights[w1Off + hLen];
    if (hLen > 0u) {
      h0A = load_row_a(task.weightOffset, inCount);
      h0B = load_row_b(task.weightOffset, inCount, weights[b0Off + 0u]);
      h0C = load_row_c(task.weightOffset, inCount);
      if (inCount > 11u) { h0D = weights[task.weightOffset + 11u]; }
      outW.x = weights[w1Off + 0u];
    }
    if (hLen > 1u) {
      h1A = load_row_a(task.weightOffset + inCount, inCount);
      h1B = load_row_b(task.weightOffset + inCount, inCount, weights[b0Off + 1u]);
      h1C = load_row_c(task.weightOffset + inCount, inCount);
      if (inCount > 11u) { h1D = weights[task.weightOffset + inCount + 11u]; }
      outW.y = weights[w1Off + 1u];
    }
    if (hLen > 2u) {
      h2A = load_row_a(task.weightOffset + 2u * inCount, inCount);
      h2B = load_row_b(task.weightOffset + 2u * inCount, inCount, weights[b0Off + 2u]);
      h2C = load_row_c(task.weightOffset + 2u * inCount, inCount);
      if (inCount > 11u) { h2D = weights[task.weightOffset + 2u * inCount + 11u]; }
      outW.z = weights[w1Off + 2u];
    }
    if (hLen > 3u) {
      h3A = load_row_a(task.weightOffset + 3u * inCount, inCount);
      h3B = load_row_b(task.weightOffset + 3u * inCount, inCount, weights[b0Off + 3u]);
      h3C = load_row_c(task.weightOffset + 3u * inCount, inCount);
      if (inCount > 11u) { h3D = weights[task.weightOffset + 3u * inCount + 11u]; }
      outW.w = weights[w1Off + 3u];
    }
  }

  let b0Wide = task.weightOffset + inCount * hLen;
  let w1Wide = b0Wide + hLen;
  let b1Deep2 = w1Wide + hLen * h2Len;
  let w2Deep2 = b1Deep2 + h2Len;

  while (frameCount < task.maxFrames) {
${WGSL_PIPE_STEP_AND_SENSORS}

    let x0 = get_raw_sensor(s0, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11);
    let x1 = select(0.0, get_raw_sensor(s1, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11), inCount > 1u);
    let x2 = select(0.0, get_raw_sensor(s2, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11), inCount > 2u);
    let x3 = select(0.0, get_raw_sensor(s3, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11), inCount > 3u);
    let x4 = select(0.0, get_raw_sensor(s4, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11), inCount > 4u);
    let x5 = select(0.0, get_raw_sensor(s5, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11), inCount > 5u);
    let x6 = select(0.0, get_raw_sensor(s6, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11), inCount > 6u);
    let x7 = select(0.0, get_raw_sensor(s7, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11), inCount > 7u);
    let x8 = select(0.0, get_raw_sensor(s8, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11), inCount > 8u);
    let x9 = select(0.0, get_raw_sensor(s9, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11), inCount > 9u);
    let x10 = select(0.0, get_raw_sensor(s10, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11), inCount > 10u);
    let x11 = select(0.0, get_raw_sensor(s11, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11), inCount > 11u);

    var flap: bool = false;
    if (isLinear) {
      let sum = h0B.z + x0 * h0A.x + x1 * h0A.y + x2 * h0A.z + x3 * h0A.w + x4 * h0B.x + x5 * h0B.y + x6 * h0B.w + x7 * h0C.x + x8 * h0C.y + x9 * h0C.z + x10 * h0C.w + x11 * h0D;
      flap = sum > 0.0;
    } else if (isSmallHidden) {
      var outSum = outB;
      let z0 = h0B.z + x0 * h0A.x + x1 * h0A.y + x2 * h0A.z + x3 * h0A.w + x4 * h0B.x + x5 * h0B.y + x6 * h0B.w + x7 * h0C.x + x8 * h0C.y + x9 * h0C.z + x10 * h0C.w + x11 * h0D;
      outSum = outSum + fast_tanh(z0) * outW.x;
      if (hLen > 1u) {
        let z1 = h1B.z + x0 * h1A.x + x1 * h1A.y + x2 * h1A.z + x3 * h1A.w + x4 * h1B.x + x5 * h1B.y + x6 * h1B.w + x7 * h1C.x + x8 * h1C.y + x9 * h1C.z + x10 * h1C.w + x11 * h1D;
        outSum = outSum + fast_tanh(z1) * outW.y;
      }
      if (hLen > 2u) {
        let z2 = h2B.z + x0 * h2A.x + x1 * h2A.y + x2 * h2A.z + x3 * h2A.w + x4 * h2B.x + x5 * h2B.y + x6 * h2B.w + x7 * h2C.x + x8 * h2C.y + x9 * h2C.z + x10 * h2C.w + x11 * h2D;
        outSum = outSum + fast_tanh(z2) * outW.z;
      }
      if (hLen > 3u) {
        let z3 = h3B.z + x0 * h3A.x + x1 * h3A.y + x2 * h3A.z + x3 * h3A.w + x4 * h3B.x + x5 * h3B.y + x6 * h3B.w + x7 * h3C.x + x8 * h3C.y + x9 * h3C.z + x10 * h3C.w + x11 * h3D;
        outSum = outSum + fast_tanh(z3) * outW.w;
      }
      flap = outSum > 0.0;
    } else if (transitions == 2u) {
      var outSum = weights[w1Wide + hLen];
      for (var j: u32 = 0u; j < hLen; j = j + 1u) {
        let rowOff = task.weightOffset + j * inCount;
        var sum = weights[b0Wide + j];
        sum = sum + x0 * weights[rowOff + 0u];
        if (inCount > 1u) { sum = sum + x1 * weights[rowOff + 1u]; }
        if (inCount > 2u) { sum = sum + x2 * weights[rowOff + 2u]; }
        if (inCount > 3u) { sum = sum + x3 * weights[rowOff + 3u]; }
        if (inCount > 4u) { sum = sum + x4 * weights[rowOff + 4u]; }
        if (inCount > 5u) { sum = sum + x5 * weights[rowOff + 5u]; }
        if (inCount > 6u) { sum = sum + x6 * weights[rowOff + 6u]; }
        if (inCount > 7u) { sum = sum + x7 * weights[rowOff + 7u]; }
        if (inCount > 8u) { sum = sum + x8 * weights[rowOff + 8u]; }
        if (inCount > 9u) { sum = sum + x9 * weights[rowOff + 9u]; }
        if (inCount > 10u) { sum = sum + x10 * weights[rowOff + 10u]; }
        if (inCount > 11u) { sum = sum + x11 * weights[rowOff + 11u]; }
        outSum = outSum + fast_tanh(sum) * weights[w1Wide + j];
      }
      flap = outSum > 0.0;
    } else {
      // Register-only Depth 2 (K -> H1<=8 -> H2 -> 1): ZERO local arrays!
      var a0 = vec4<f32>(0.0);
      var a1 = vec4<f32>(0.0);
      for (var j: u32 = 0u; j < hLen; j = j + 1u) {
        let rowOff = task.weightOffset + j * inCount;
        var sum = weights[b0Wide + j];
        sum = sum + x0 * weights[rowOff + 0u];
        if (inCount > 1u) { sum = sum + x1 * weights[rowOff + 1u]; }
        if (inCount > 2u) { sum = sum + x2 * weights[rowOff + 2u]; }
        if (inCount > 3u) { sum = sum + x3 * weights[rowOff + 3u]; }
        if (inCount > 4u) { sum = sum + x4 * weights[rowOff + 4u]; }
        if (inCount > 5u) { sum = sum + x5 * weights[rowOff + 5u]; }
        if (inCount > 6u) { sum = sum + x6 * weights[rowOff + 6u]; }
        if (inCount > 7u) { sum = sum + x7 * weights[rowOff + 7u]; }
        if (inCount > 8u) { sum = sum + x8 * weights[rowOff + 8u]; }
        if (inCount > 9u) { sum = sum + x9 * weights[rowOff + 9u]; }
        if (inCount > 10u) { sum = sum + x10 * weights[rowOff + 10u]; }
        if (inCount > 11u) { sum = sum + x11 * weights[rowOff + 11u]; }
        let act = fast_tanh(sum);
        if (j == 0u) { a0.x = act; }
        else if (j == 1u) { a0.y = act; }
        else if (j == 2u) { a0.z = act; }
        else if (j == 3u) { a0.w = act; }
        else if (j == 4u) { a1.x = act; }
        else if (j == 5u) { a1.y = act; }
        else if (j == 6u) { a1.z = act; }
        else { a1.w = act; }
      }
      var outSum = weights[w2Deep2 + h2Len];
      for (var j: u32 = 0u; j < h2Len; j = j + 1u) {
        let rowOff = w1Wide + j * hLen;
        var sum = weights[b1Deep2 + j];
        sum = sum + a0.x * weights[rowOff + 0u];
        if (hLen > 1u) { sum = sum + a0.y * weights[rowOff + 1u]; }
        if (hLen > 2u) { sum = sum + a0.z * weights[rowOff + 2u]; }
        if (hLen > 3u) { sum = sum + a0.w * weights[rowOff + 3u]; }
        if (hLen > 4u) { sum = sum + a1.x * weights[rowOff + 4u]; }
        if (hLen > 5u) { sum = sum + a1.y * weights[rowOff + 5u]; }
        if (hLen > 6u) { sum = sum + a1.z * weights[rowOff + 6u]; }
        if (hLen > 7u) { sum = sum + a1.w * weights[rowOff + 7u]; }
        outSum = outSum + fast_tanh(sum) * weights[w2Deep2 + j];
      }
      flap = outSum > 0.0;
    }

    if (flap) {
      vy = task.jumpImpulse;
    }

${WGSL_PIPE_COLLISION_AND_SCORE}
  }

  if (survivedFull == 0u && frameCount >= task.maxFrames && score >= task.targetPipeCap) {
    survivedFull = 1u;
  }

  if (_unusedArch == 999999u) {
    results[taskIdx] = TaskResult(0u, 0u, 0u, 0.0);
    return;
  }
  results[taskIdx] = TaskResult(score, frameCount, survivedFull, fitness);
}

@compute @workgroup_size(64)
fn main() {
  loop {
    let taskIdx = atomicAdd(&workCounter.nextIdx, 1u);
    if (taskIdx >= params.taskCount) {
      break;
    }
    evaluate_task(taskIdx);
  }
}
`;

// KERNEL 2 / 7 Factory: Arbitrary Depth >= 2 MLP (width <= 24 or lazy 64)
function buildDeepMlpWgsl(maxWidth: number): string {
  const actLen = Math.max(12, maxWidth);
  return `${COMMON_WGSL_HEADER}
fn evaluate_task(taskIdx: u32) {
${WGSL_PIPE_PREAMBLE}
  let _unusedArch = archCode + reasoningSteps;

  var actA: array<f32, ${actLen}>;
  var actB: array<f32, ${actLen}>;
  let lastLayer = transitions - 1u;

  while (frameCount < task.maxFrames) {
${WGSL_PIPE_STEP_AND_SENSORS}

    actA[0] = get_raw_sensor(s0, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11);
    if (inCount > 1u) { actA[1] = get_raw_sensor(s1, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11); }
    if (inCount > 2u) { actA[2] = get_raw_sensor(s2, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11); }
    if (inCount > 3u) { actA[3] = get_raw_sensor(s3, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11); }
    if (inCount > 4u) { actA[4] = get_raw_sensor(s4, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11); }
    if (inCount > 5u) { actA[5] = get_raw_sensor(s5, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11); }
    if (inCount > 6u) { actA[6] = get_raw_sensor(s6, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11); }
    if (inCount > 7u) { actA[7] = get_raw_sensor(s7, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11); }
    if (inCount > 8u) { actA[8] = get_raw_sensor(s8, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11); }
    if (inCount > 9u) { actA[9] = get_raw_sensor(s9, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11); }
    if (inCount > 10u) { actA[10] = get_raw_sensor(s10, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11); }
    if (inCount > 11u) { actA[11] = get_raw_sensor(s11, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11); }

    var cursor = task.weightOffset;
    for (var l: u32 = 0u; l < lastLayer; l = l + 1u) {
      let prevLen = get_layer_dim(task.topoMeta0, task.topoMeta1, l);
      let nextLen = get_layer_dim(task.topoMeta0, task.topoMeta1, l + 1u);
      let bOff = cursor + prevLen * nextLen;
      for (var j: u32 = 0u; j < nextLen; j = j + 1u) {
        var sum = weights[bOff + j];
        let rowOff = cursor + j * prevLen;
        for (var i: u32 = 0u; i < prevLen; i = i + 1u) {
          sum = sum + actA[i] * weights[rowOff + i];
        }
        actB[j] = fast_tanh(sum);
      }
      for (var j: u32 = 0u; j < nextLen; j = j + 1u) {
        actA[j] = actB[j];
      }
      cursor = bOff + nextLen;
    }

    let prevLen = get_layer_dim(task.topoMeta0, task.topoMeta1, lastLayer);
    var outSum = weights[cursor + prevLen];
    for (var i: u32 = 0u; i < prevLen; i = i + 1u) {
      outSum = outSum + actA[i] * weights[cursor + i];
    }

    if (outSum > 0.0) {
      vy = task.jumpImpulse;
    }

${WGSL_PIPE_COLLISION_AND_SCORE}
  }

  if (survivedFull == 0u && frameCount >= task.maxFrames && score >= task.targetPipeCap) {
    survivedFull = 1u;
  }

  if (_unusedArch == 999999u) {
    results[taskIdx] = TaskResult(0u, 0u, 0u, 0.0);
    return;
  }
  results[taskIdx] = TaskResult(score, frameCount, survivedFull, fitness);
}

@compute @workgroup_size(64)
fn main() {
  loop {
    let taskIdx = atomicAdd(&workCounter.nextIdx, 1u);
    if (taskIdx >= params.taskCount) {
      break;
    }
    evaluate_task(taskIdx);
  }
}
`;
}

const DEEP_MLP_WGSL = buildDeepMlpWgsl(24);

// KERNEL 3..6 Factory: Dynamic Tiered Bio + LLM Reasoning Kernel (8/12, 16/24, 32/36, 64/64)
// Smaller tiers keep tight register footprints for peak SM occupancy; larger tiers compile lazily on first use.
function buildBioReasoningWgsl(maxWidth: number, maxBioState: number): string {
  const actLen = Math.max(12, maxWidth);
  return `${COMMON_WGSL_HEADER}
fn evaluate_task(taskIdx: u32) {
${WGSL_PIPE_PREAMBLE}

  let hiddenDepth = transitions - 1u;
  let isPerNeuronStateful =
    (archCode == 2u || archCode == 3u || archCode == 4u || archCode == 7u || archCode == 9u);
  let isLatentReasoning =
    (archCode == 5u || archCode == 6u || archCode == 8u);

  var bioOffset: u32 = task.weightOffset;
  var totalHidden: u32 = 0u;
  for (var l: u32 = 0u; l < transitions; l = l + 1u) {
    let dIn = get_layer_dim(task.topoMeta0, task.topoMeta1, l);
    let dOut = get_layer_dim(task.topoMeta0, task.topoMeta1, l + 1u);
    bioOffset = bioOffset + dIn * dOut + dOut;
    if (l < hiddenDepth) {
      totalHidden = totalHidden + dOut;
    }
  }
  let bioNodes = max(1u, totalHidden);
  let drosGfOff = bioOffset + bioNodes * 2u;
  let drosTailOff = drosGfOff + select(0u, inCount, hiddenDepth > 0u);

  var inp: array<f32, 12>;
  var actA: array<f32, ${actLen}>;
  var actB: array<f32, ${actLen}>;
  var bioState: array<f32, ${maxBioState}>;
  var drive: array<f32, ${maxWidth}>;
  var scratchA: array<f32, ${maxWidth}>;
  var scratchB: array<f32, ${maxWidth}>;

  let initState = select(0.0, 1.0, archCode == 4u);
  for (var i: u32 = 0u; i < ${maxBioState}u; i = i + 1u) {
    bioState[i] = initState;
  }

  while (frameCount < task.maxFrames) {
${WGSL_PIPE_STEP_AND_SENSORS}

    inp[0] = get_raw_sensor(s0, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11);
    if (inCount > 1u) { inp[1] = get_raw_sensor(s1, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11); }
    if (inCount > 2u) { inp[2] = get_raw_sensor(s2, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11); }
    if (inCount > 3u) { inp[3] = get_raw_sensor(s3, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11); }
    if (inCount > 4u) { inp[4] = get_raw_sensor(s4, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11); }
    if (inCount > 5u) { inp[5] = get_raw_sensor(s5, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11); }
    if (inCount > 6u) { inp[6] = get_raw_sensor(s6, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11); }
    if (inCount > 7u) { inp[7] = get_raw_sensor(s7, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11); }
    if (inCount > 8u) { inp[8] = get_raw_sensor(s8, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11); }
    if (inCount > 9u) { inp[9] = get_raw_sensor(s9, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11); }
    if (inCount > 10u) { inp[10] = get_raw_sensor(s10, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11); }
    if (inCount > 11u) { inp[11] = get_raw_sensor(s11, raw0, raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8, raw9, raw10, raw11); }

    var oaMod: f32 = 1.0;
    var aplGamma: f32 = 0.0;
    if (archCode == 9u) {
      var absInSum: f32 = 0.0;
      for (var i: u32 = 0u; i < inCount; i = i + 1u) {
        absInSum = absInSum + abs(inp[i]);
      }
      let meanAbsIn = absInSum / f32(inCount);
      let oaBeta = fast_sigmoid(weights[drosTailOff + 1u]);
      let oaAct = fast_tanh(weights[drosTailOff + 2u] * meanAbsIn);
      let oaTone = (1.0 - oaBeta) * bioState[bioNodes] + oaBeta * oaAct;
      bioState[bioNodes] = oaTone;
      oaMod = clamp(1.0 + weights[drosTailOff + 3u] * oaTone, 0.25, 2.25);
      aplGamma = 0.5 * fast_sigmoid(weights[drosTailOff]);
    }

    for (var i: u32 = 0u; i < inCount; i = i + 1u) {
      actA[i] = inp[i];
    }

    var cursor: u32 = task.weightOffset;
    var stateCursor: u32 = 0u;

    // Hidden layers
    for (var l: u32 = 0u; l < hiddenDepth; l = l + 1u) {
      let inD = get_layer_dim(task.topoMeta0, task.topoMeta1, l);
      let outD = get_layer_dim(task.topoMeta0, task.topoMeta1, l + 1u);
      let bOff = cursor + inD * outD;
      let isLastHidden = (l == hiddenDepth - 1u);
      var layerSum: f32 = 0.0;

      for (var j: u32 = 0u; j < outD; j = j + 1u) {
        var sum = weights[bOff + j];
        let rowOff = cursor + j * inD;
        for (var i: u32 = 0u; i < inD; i = i + 1u) {
          sum = sum + actA[i] * weights[rowOff + i];
        }

        if (isLatentReasoning && isLastHidden) {
          actB[j] = sum;
        } else if (isPerNeuronStateful) {
          let si = stateCursor + j;
          if (archCode == 2u) {
            // LTC_FLY
            let a = fast_sigmoid(weights[bioOffset + si * 2u]);
            let prevH = bioState[si];
            let nh = (1.0 - a) * prevH + a * fast_tanh(sum + weights[bioOffset + si * 2u + 1u] * prevH);
            bioState[si] = nh;
            actB[j] = nh;
          } else if (archCode == 9u) {
            // DROSOPHILA_CONNECTOME (Optic-Lobe T4/T5 LTC + Octopamine gain)
            let a = fast_sigmoid(weights[bioOffset + si * 2u]);
            let prevH = bioState[si];
            let nh = (1.0 - a) * prevH + a * fast_tanh(sum * oaMod + weights[bioOffset + si * 2u + 1u] * prevH);
            bioState[si] = nh;
            actB[j] = nh;
            layerSum = layerSum + nh;
          } else if (archCode == 3u) {
            // NEUROCHEM_GATE
            let p = bioOffset + si * 3u;
            let r = fast_sigmoid(weights[p]);
            let nm = (1.0 - r) * bioState[si] + r * fast_tanh(weights[p + 1u] * sum);
            bioState[si] = nm;
            let eff = weights[p + 2u] * nm;
            actB[j] = clamp((1.0 + eff) * fast_tanh(sum + 0.5 * eff), -2.0, 2.0);
          } else if (archCode == 4u) {
            // SYNAPTIC_STP
            let act = fast_tanh(sum);
            let absA = abs(act);
            let r = 0.12 * fast_sigmoid(weights[bioOffset + si * 2u]);
            let prevU = bioState[si];
            let nu = clamp(
              prevU + r * (1.0 - prevU) + weights[bioOffset + si * 2u + 1u] * absA * (1.5 - prevU) - 0.18 * absA * prevU,
              0.15,
              2.0
            );
            bioState[si] = nu;
            actB[j] = nu * act;
          } else {
            // SELECTIVE_SSM (MinGRU, archCode == 7u)
            let p = bioOffset + si * 3u;
            let prevH = bioState[si];
            let z = fast_sigmoid(weights[p] * sum + weights[p + 2u] * prevH + weights[p + 1u]);
            let nh = (1.0 - z) * prevH + z * fast_tanh(sum);
            bioState[si] = nh;
            actB[j] = nh;
          }
        } else {
          actB[j] = fast_tanh(sum);
        }
      }

      if (archCode == 9u) {
        let inh = aplGamma * (layerSum / f32(outD));
        for (var j: u32 = 0u; j < outD; j = j + 1u) {
          actA[j] = clamp(actB[j] - inh, -1.0, 1.0);
        }
      } else {
        for (var j: u32 = 0u; j < outD; j = j + 1u) {
          actA[j] = actB[j];
        }
      }
      stateCursor = stateCursor + outD;
      cursor = bOff + outD;
    }

    // Output layer / Latent-space reasoning head
    let lastD = get_layer_dim(task.topoMeta0, task.topoMeta1, hiddenDepth);
    let outWOff = cursor;
    let outB = weights[outWOff + lastD];
    var outSum: f32 = 0.0;

    var ponderStepsUsed: u32 = 1u;
    if (!isLatentReasoning) {
      outSum = outB;
      for (var i: u32 = 0u; i < lastD; i = i + 1u) {
        outSum = outSum + actA[i] * weights[outWOff + i];
      }

      if (archCode == 1u && hiddenDepth > 0u) {
        // RESIDUAL_SKIP direct input -> output highway
        for (var i: u32 = 0u; i < inCount; i = i + 1u) {
          outSum = outSum + inp[i] * weights[bioOffset + i];
        }
      } else if (archCode == 9u && hiddenDepth > 0u) {
        // DROSOPHILA_CONNECTOME Octopamine motor gain + Giant Fiber direct sensory->motor reflex
        outSum = outSum * oaMod;
        for (var i: u32 = 0u; i < inCount; i = i + 1u) {
          outSum = outSum + inp[i] * weights[drosGfOff + i];
        }
      } else if (hiddenDepth == 0u && isPerNeuronStateful) {
        if (archCode == 2u) {
          let a = fast_sigmoid(weights[bioOffset]);
          let prevH = bioState[0];
          let nh = (1.0 - a) * prevH + a * fast_tanh(outSum + weights[bioOffset + 1u] * prevH);
          bioState[0] = nh;
          outSum = nh * 4.0;
        } else if (archCode == 9u) {
          let a = fast_sigmoid(weights[bioOffset]);
          let prevH = bioState[0];
          let nh = (1.0 - a) * prevH + a * fast_tanh(outSum * oaMod + weights[bioOffset + 1u] * prevH);
          bioState[0] = nh;
          outSum = nh * 4.0;
        } else if (archCode == 3u) {
          let r = fast_sigmoid(weights[bioOffset]);
          let nm = (1.0 - r) * bioState[0] + r * fast_tanh(weights[bioOffset + 1u] * outSum);
          bioState[0] = nm;
          let g = weights[bioOffset + 2u];
          outSum = (1.0 + g * nm) * outSum + 0.5 * g * nm;
        } else if (archCode == 4u) {
          let act = fast_tanh(outSum);
          let absA = abs(act);
          let r = 0.12 * fast_sigmoid(weights[bioOffset]);
          let prevU = bioState[0];
          let nu = clamp(
            prevU + r * (1.0 - prevU) + weights[bioOffset + 1u] * absA * (1.5 - prevU) - 0.18 * absA * prevU,
            0.15,
            2.0
          );
          bioState[0] = nu;
          outSum = nu * outSum;
        } else {
          // SELECTIVE_SSM D0
          let prevH = bioState[0];
          let z = fast_sigmoid(weights[bioOffset] * outSum + weights[bioOffset + 2u] * prevH + weights[bioOffset + 1u]);
          let nh = (1.0 - z) * prevH + z * fast_tanh(outSum);
          bioState[0] = nh;
          outSum = nh * 4.0;
        }
      }
    } else {
      // Latent-Space Reasoning: LOOPED_REASONER (5), PONDER_ACT (6), LATENT_ROLLOUT (8)
      let H = select(1u, lastD, hiddenDepth > 0u);
      if (hiddenDepth == 0u) {
        var ds = outB;
        for (var i: u32 = 0u; i < inCount; i = i + 1u) {
          ds = ds + inp[i] * weights[outWOff + i];
        }
        drive[0] = ds;
      } else {
        for (var j: u32 = 0u; j < H; j = j + 1u) {
          drive[j] = actA[j];
        }
      }

      if (archCode == 5u) {
        // LOOPED_REASONER: K iterative weight-tied latent refinement steps
        let bRecOff = bioOffset + H * H;
        let alphaOff = bRecOff + H;
        for (var step: u32 = 0u; step < reasoningSteps; step = step + 1u) {
          for (var j: u32 = 0u; j < H; j = j + 1u) {
            var s = drive[j] + weights[bRecOff + j];
            let rowOff = bioOffset + j * H;
            for (var i: u32 = 0u; i < H; i = i + 1u) {
              s = s + weights[rowOff + i] * bioState[i];
            }
            let a = fast_sigmoid(weights[alphaOff + j]);
            scratchA[j] = (1.0 - a) * bioState[j] + a * fast_tanh(s);
          }
          for (var j: u32 = 0u; j < H; j = j + 1u) {
            bioState[j] = scratchA[j];
          }
        }
        if (hiddenDepth == 0u) {
          outSum = bioState[0] * 4.0;
        } else {
          outSum = outB;
          for (var j: u32 = 0u; j < H; j = j + 1u) {
            outSum = outSum + bioState[j] * weights[outWOff + j];
          }
        }
      } else if (archCode == 6u) {
        // PONDER_ACT: Adaptive Computation Time with Surprise-Modulated Halting Gate (S1/S2)
        let bRecOff = bioOffset + H * H;
        let alphaOff = bRecOff + H;
        let wHaltOff = alphaOff + H;
        let bHalt = weights[wHaltOff + H];
        let maxK = max(2u, reasoningSteps);
        var remain: f32 = 1.0;
        var cumHalt: f32 = 0.0;
        var outAcc: f32 = 0.0;
        var stepsUsed: u32 = 0u;

        for (var step: u32 = 0u; step < maxK; step = step + 1u) {
          stepsUsed = stepsUsed + 1u;
          var fluxSum: f32 = 0.0;
          for (var j: u32 = 0u; j < H; j = j + 1u) {
            var s = drive[j] + weights[bRecOff + j];
            let rowOff = bioOffset + j * H;
            for (var i: u32 = 0u; i < H; i = i + 1u) {
              s = s + weights[rowOff + i] * bioState[i];
            }
            let a = fast_sigmoid(weights[alphaOff + j]);
            let nh = (1.0 - a) * bioState[j] + a * fast_tanh(s);
            fluxSum = fluxSum + abs(nh - bioState[j]);
            scratchA[j] = nh;
          }
          for (var j: u32 = 0u; j < H; j = j + 1u) {
            bioState[j] = scratchA[j];
          }

          var stepLogit: f32 = select(bioState[0] * 4.0, outB, hiddenDepth > 0u);
          if (hiddenDepth > 0u) {
            for (var j: u32 = 0u; j < H; j = j + 1u) {
              stepLogit = stepLogit + bioState[j] * weights[outWOff + j];
            }
          }
          if (step == maxK - 1u) {
            outAcc = outAcc + remain * stepLogit;
            break;
          }
          let meanFlux = fluxSum / f32(H);
          var haltLogit = bHalt + 1.35 - 3.2 * meanFlux;
          for (var j: u32 = 0u; j < H; j = j + 1u) {
            haltLogit = haltLogit + weights[wHaltOff + j] * bioState[j];
          }
          let pHalt = fast_sigmoid(haltLogit);
          let sw = remain * pHalt;
          if (cumHalt + sw >= 0.68) {
            outAcc = outAcc + remain * stepLogit;
            break;
          }
          outAcc = outAcc + sw * stepLogit;
          cumHalt = cumHalt + sw;
          remain = remain - sw;
        }
        ponderStepsUsed = stepsUsed;
        outSum = outAcc;
      } else {
        // LATENT_ROLLOUT (archCode == 8u): 2-step counterfactual JUMP vs WAIT world model
        let wActOff = bioOffset + H * H;
        let bDynOff = wActOff + H;
        let wValOff = bDynOff + H;

        for (var j: u32 = 0u; j < H; j = j + 1u) {
          bioState[j] = 0.45 * bioState[j] + 0.55 * fast_tanh(drive[j]);
        }

        var vJump: f32 = 0.0;
        var vWait: f32 = 0.0;
        for (var j: u32 = 0u; j < H; j = j + 1u) {
          var base = weights[bDynOff + j];
          let rowOff = bioOffset + j * H;
          for (var i: u32 = 0u; i < H; i = i + 1u) {
            base = base + weights[rowOff + i] * bioState[i];
          }
          let actShift = weights[wActOff + j];
          let j1 = fast_tanh(base + actShift);
          let w1 = fast_tanh(base - actShift);
          scratchA[j] = j1;
          scratchB[j] = w1;
          let immW = select(1.0, weights[outWOff + j], hiddenDepth > 0u);
          vJump = vJump + j1 * immW;
          vWait = vWait + w1 * immW;
        }

        for (var j: u32 = 0u; j < H; j = j + 1u) {
          let baseBias = weights[bDynOff + j] - 0.5 * weights[wActOff + j];
          var sumJ = baseBias;
          var sumW = baseBias;
          let rowOff = bioOffset + j * H;
          for (var i: u32 = 0u; i < H; i = i + 1u) {
            let wd = weights[rowOff + i];
            sumJ = sumJ + wd * scratchA[i];
            sumW = sumW + wd * scratchB[i];
          }
          let valW = weights[wValOff + j];
          vJump = vJump + fast_tanh(sumJ) * valW;
          vWait = vWait + fast_tanh(sumW) * valW;
        }

        outSum = vJump - vWait + select(0.0, outB, hiddenDepth > 0u);
        if (outSum > 0.0) {
          for (var j: u32 = 0u; j < H; j = j + 1u) { bioState[j] = scratchA[j]; }
        } else {
          for (var j: u32 = 0u; j < H; j = j + 1u) { bioState[j] = scratchB[j]; }
        }
      }
    }

    if (outSum > 0.0) {
      vy = task.jumpImpulse;
    }

${WGSL_PIPE_COLLISION_AND_SCORE}
    if (computeFitness && archCode == 6u && metabolicCost > 0.0 && ponderStepsUsed > 1u) {
      fitness = max(0.0, fitness - metabolicCost * f32(ponderStepsUsed - 1u));
    }
  }

  if (survivedFull == 0u && frameCount >= task.maxFrames && score >= task.targetPipeCap) {
    survivedFull = 1u;
  }

  results[taskIdx] = TaskResult(score, frameCount, survivedFull, fitness);
}

@compute @workgroup_size(64)
fn main() {
  loop {
    let taskIdx = atomicAdd(&workCounter.nextIdx, 1u);
    if (taskIdx >= params.taskCount) {
      break;
    }
    evaluate_task(taskIdx);
  }
}
`;
}

const BIO_REASONING_WGSL = buildBioReasoningWgsl(16, 25);

type PipelineSlotKey =
  | 'FAST'
  | 'DEEP_24'
  | 'DEEP_64'
  | 'BIO_TINY'
  | 'BIO_STD'
  | 'BIO_MED'
  | 'BIO_LARGE';

function pipelineKeyForKernelKind(kind: GpuKernelKind): PipelineSlotKey {
  switch (kind) {
    case 0:
      return 'FAST';
    case 1:
    case 2:
      return 'DEEP_24';
    case 3:
      return 'BIO_TINY';
    case 4:
      return 'BIO_STD';
    case 5:
      return 'BIO_MED';
    case 6:
      return 'BIO_LARGE';
    case 7:
      return 'DEEP_64';
  }
}

function wgslForPipelineKey(key: PipelineSlotKey): string {
  switch (key) {
    case 'FAST':
      return FAST_REGISTER_WGSL;
    case 'DEEP_24':
      return DEEP_MLP_WGSL;
    case 'DEEP_64':
      return buildDeepMlpWgsl(64);
    case 'BIO_TINY':
      return buildBioReasoningWgsl(8, 13);
    case 'BIO_STD':
      return BIO_REASONING_WGSL;
    case 'BIO_MED':
      return buildBioReasoningWgsl(32, 37);
    case 'BIO_LARGE':
      return buildBioReasoningWgsl(64, 65);
  }
}

/** Exported for automated static WGSL verification tests */
export function getWebGpuShaderSources(): {
  fast: string;
  deep: string;
  bio: string;
} {
  return {
    fast: FAST_REGISTER_WGSL,
    deep: DEEP_MLP_WGSL,
    bio: BIO_REASONING_WGSL,
  };
}

async function compileWgslPipeline(
  device: GpuDeviceLike,
  code: string,
  tag: string
): Promise<GpuComputePipelineLike> {
  const shaderModule = device.createShaderModule({ code });
  if (shaderModule.getCompilationInfo) {
    const comp = await shaderModule.getCompilationInfo();
    const errors = comp.messages.filter((m) => m.type === 'error');
    if (errors.length > 0) {
      throw new Error(
        `WGSL ${tag} compile error: ${errors.map((e) => `L${e.lineNum}: ${e.message}`).join('; ')}`
      );
    }
  }
  return device.createComputePipeline({
    layout: 'auto',
    compute: {
      module: shaderModule,
      entryPoint: 'main',
    },
  });
}

interface WebGpuSlotResources {
  paramsBuf: GpuBufferLike;
  counterBuf: GpuBufferLike;
  tasksBuf: GpuBufferLike | null;
  weightsBuf: GpuBufferLike | null;
  resultsBuf: GpuBufferLike | null;
  readbackBuf: GpuBufferLike | null;
  bindGroups: Partial<Record<PipelineSlotKey, unknown>>;
  tasksCapBytes: number;
  weightsCapBytes: number;
  resultsCapBytes: number;
}

interface WebGpuPendingBatch extends GpuPendingBatch {
  readonly resultBytes: number;
  readonly submittedAtMs: number;
  readonly mapPromise: Promise<void>;
  readonly readbackBuf: GpuBufferLike | null;
}

export class WebGpuEvaluator implements GpuComputeEvaluator {
  readonly engine = 'WEBGPU' as const;
  readonly supportsBioKernels = true;
  readonly supportsFullFrontier = true;
  readonly recommendedAuditCap = 2500;
  readonly adapterLabel: string;
  readonly isIntegrated: boolean;
  readonly calibration: GpuCalibrationProfile;

  private device: GpuDeviceLike;
  private pipelines: Partial<Record<PipelineSlotKey, GpuComputePipelineLike>> = {};
  private pendingCompiles: Partial<Record<PipelineSlotKey, Promise<GpuComputePipelineLike>>> = {};
  private slots: [WebGpuSlotResources, WebGpuSlotResources];

  private readonly zeroU32 = new Uint32Array([0]);
  private readonly paramsU32 = new Uint32Array(4);
  private lastCompletedAtMs = 0;
  private deviceLostError: Error | null = null;
  private deviceLostPromise: Promise<never>;
  private disposed = false;

  private constructor(
    device: GpuDeviceLike,
    initialPipelines: Partial<Record<PipelineSlotKey, GpuComputePipelineLike>>,
    adapterLabel: string,
    isIntegrated: boolean,
    calibration: GpuCalibrationProfile
  ) {
    this.device = device;
    this.pipelines = { ...initialPipelines };
    this.adapterLabel = adapterLabel;
    this.isIntegrated = isIntegrated;
    this.calibration = calibration;

    const lostPromise = (
      device as unknown as { lost?: Promise<{ message?: string; reason?: string }> }
    ).lost;
    this.deviceLostPromise = lostPromise
      ? lostPromise.then((info) => {
          const reason = info?.reason || 'unknown';
          const msg = info?.message || '';
          const err = new Error(
            `WebGPU device lost (${reason})${msg ? `: ${msg}` : ''}`
          );
          if (!this.deviceLostError) {
            this.deviceLostError = err;
          }
          if (!this.disposed) {
            // eslint-disable-next-line no-console
            console.warn('WebGPU device lost:', msg, reason);
          }
          throw err;
        })
      : new Promise<never>(() => {});
    // Attach no-op catch to avoid UnhandledRejection if no batch is currently awaiting
    this.deviceLostPromise.catch(() => {});

    const makeSlot = (): WebGpuSlotResources => ({
      paramsBuf: device.createBuffer({
        size: 16,
        usage: GPU_BUFFER_USAGE.UNIFORM | GPU_BUFFER_USAGE.COPY_DST,
      }),
      counterBuf: device.createBuffer({
        size: 4,
        usage: GPU_BUFFER_USAGE.STORAGE | GPU_BUFFER_USAGE.COPY_DST,
      }),
      tasksBuf: null,
      weightsBuf: null,
      resultsBuf: null,
      readbackBuf: null,
      bindGroups: {},
      tasksCapBytes: 0,
      weightsCapBytes: 0,
      resultsCapBytes: 0,
    });
    this.slots = [makeSlot(), makeSlot()];
  }

  static async create(): Promise<WebGpuEvaluator> {
    const nav =
      typeof navigator !== 'undefined'
        ? (navigator as unknown as { gpu?: NavigatorGpuLike })
        : null;
    if (!nav?.gpu) {
      throw new Error('WebGPU is not available in this browser context.');
    }
    const adapter = await requestWebGpuAdapterMulti(nav.gpu);
    if (!adapter) {
      throw new Error('No WebGPU adapter found.');
    }

    let info: GpuAdapterInfoLike | undefined = adapter.info;
    if (!info && adapter.requestAdapterInfo) {
      try {
        info = await adapter.requestAdapterInfo();
      } catch {
        info = undefined;
      }
    }
    const rawName =
      [info?.description, info?.device, info?.vendor, info?.architecture]
        .filter((s): s is string => Boolean(s && s.trim().length > 0))
        .slice(0, 2)
        .join(' · ') || 'GPU';
    const label = `WebGPU · ${rawName}`;
    const isIntegrated = detectIntegratedGpu(rawName);

    const device = await adapter.requestDevice();
    try {
      const [fastPipeline, deep24Pipeline, bioTinyPipeline, bioStdPipeline] =
        await Promise.all([
          compileWgslPipeline(device, FAST_REGISTER_WGSL, 'FAST'),
          compileWgslPipeline(device, DEEP_MLP_WGSL, 'DEEP_24'),
          compileWgslPipeline(device, wgslForPipelineKey('BIO_TINY'), 'BIO_TINY'),
          compileWgslPipeline(device, BIO_REASONING_WGSL, 'BIO_STD'),
        ]);

      const defaultCal: GpuCalibrationProfile = {
        registerPressureRatio: 1.15,
        calibratedWorkgroups: isIntegrated ? 256 : 768,
        tdrCeilingMs: isIntegrated ? 140 : 380,
      };
      const evaluator = new WebGpuEvaluator(
        device,
        {
          FAST: fastPipeline,
          DEEP_24: deep24Pipeline,
          BIO_TINY: bioTinyPipeline,
          BIO_STD: bioStdPipeline,
        },
        label,
        isIntegrated,
        defaultCal
      );

      // Lightweight startup hardware register-pressure micro-tuner (~10-25ms):
      // Measures actual BIO_TINY (8/12) vs BIO_STD (16/24) latency ratio on this GPU
      // so AMD/Intel/NVIDIA register files auto-adapt wave budgets & workgroups safely below TDR.
      try {
        const probeTasks = 512;
        const layers = [4, 4, 1];
        const paramCount = 4 * 4 + 4 + 4 + 1 + 4 * 2; // LTC_FLY 4->4->1
        const encoded = encodeTopologyAndSensors(layers, [1, 2, 3, 4]);
        const env = resolveEnvironment('STANDARD');
        const tBuf = new ArrayBuffer(probeTasks * TASK_STRIDE_U32 * 4);
        const tU32 = new Uint32Array(tBuf);
        const tF32 = new Float32Array(tBuf);
        const wF32 = new Float32Array(probeTasks * paramCount);
        for (let i = 0; i < wF32.length; i++) {
          wF32[i] = ((i * 37) % 100) / 100 - 0.5;
        }
        for (let i = 0; i < probeTasks; i++) {
          writeTaskDescToBuffers(tU32, tF32, i, {
            weightOffset: i * paramCount,
            seed: 2027 + i * 17,
            targetPipeCap: 8,
            maxFrames: 240,
            topoMeta0: encoded.topoMeta0,
            topoMeta1: encoded.topoMeta1,
            sensorMask: encoded.sensorMask,
            env,
            computeFitness: true,
            architecture: 'LTC_FLY',
          });
        }
        const rTiny = await evaluator.evaluateRawBatch(
          probeTasks,
          tU32,
          wF32,
          wF32.length,
          3
        );
        const rStd = await evaluator.evaluateRawBatch(
          probeTasks,
          tU32,
          wF32,
          wF32.length,
          4
        );
        const ratio = Math.max(
          0.9,
          Math.min(3.0, rStd.dispatchMs / Math.max(0.4, rTiny.dispatchMs))
        );
        const maxWgCap = Math.min(
          1024,
          device.limits?.maxComputeWorkgroupsPerDimension ?? 1024
        );
        evaluator.calibration.registerPressureRatio = Number(ratio.toFixed(2));
        evaluator.calibration.calibratedWorkgroups = isIntegrated
          ? ratio > 1.5
            ? 192
            : 320
          : Math.min(maxWgCap, ratio > 1.5 ? 512 : 1024);
        evaluator.calibration.tdrCeilingMs = isIntegrated
          ? ratio > 1.5
            ? 110
            : 150
          : ratio > 1.5
            ? 300
            : 400;
      } catch {
        // Keep safe defaults if micro-tuner skipped
      }

      return evaluator;
    } catch (err) {
      device.destroy();
      throw err;
    }
  }

  async prepareKernelTier(kind: GpuKernelKind): Promise<void> {
    const key = pipelineKeyForKernelKind(kind);
    if (this.pipelines[key]) return;
    let pending = this.pendingCompiles[key];
    if (!pending) {
      pending = compileWgslPipeline(
        this.device,
        wgslForPipelineKey(key),
        key
      ).then((pipe) => {
        this.pipelines[key] = pipe;
        delete this.pendingCompiles[key];
        return pipe;
      });
      this.pendingCompiles[key] = pending;
    }
    await pending;
  }

  private ensureSlotBuffers(
    slot: WebGpuSlotResources,
    taskCount: number,
    weightFloatCount: number,
    pipelineKey: PipelineSlotKey
  ): unknown {
    const needTasksBytes = Math.max(64, taskCount * TASK_STRIDE_U32 * 4);
    const needWeightsBytes = Math.max(64, weightFloatCount * 4);
    const needResultsBytes = Math.max(16, taskCount * RESULT_STRIDE_U32 * 4);

    let buffersReallocated = false;

    if (needTasksBytes > slot.tasksCapBytes) {
      slot.tasksBuf?.destroy();
      slot.tasksCapBytes = Math.max(needTasksBytes, slot.tasksCapBytes * 2);
      slot.tasksBuf = this.device.createBuffer({
        size: slot.tasksCapBytes,
        usage: GPU_BUFFER_USAGE.STORAGE | GPU_BUFFER_USAGE.COPY_DST,
      });
      buffersReallocated = true;
    }

    if (needWeightsBytes > slot.weightsCapBytes) {
      slot.weightsBuf?.destroy();
      slot.weightsCapBytes = Math.max(needWeightsBytes, slot.weightsCapBytes * 2);
      slot.weightsBuf = this.device.createBuffer({
        size: slot.weightsCapBytes,
        usage: GPU_BUFFER_USAGE.STORAGE | GPU_BUFFER_USAGE.COPY_DST,
      });
      buffersReallocated = true;
    }

    if (needResultsBytes > slot.resultsCapBytes || !slot.readbackBuf) {
      slot.resultsBuf?.destroy();
      slot.readbackBuf?.destroy();
      slot.resultsCapBytes = Math.max(needResultsBytes, slot.resultsCapBytes * 2);
      slot.resultsBuf = this.device.createBuffer({
        size: slot.resultsCapBytes,
        usage: GPU_BUFFER_USAGE.STORAGE | GPU_BUFFER_USAGE.COPY_SRC,
      });
      slot.readbackBuf = this.device.createBuffer({
        size: slot.resultsCapBytes,
        usage: GPU_BUFFER_USAGE.MAP_READ | GPU_BUFFER_USAGE.COPY_DST,
      });
      buffersReallocated = true;
    }

    if (buffersReallocated) {
      slot.bindGroups = {};
    }

    let bg = slot.bindGroups[pipelineKey];
    if (!bg && slot.tasksBuf && slot.weightsBuf && slot.resultsBuf) {
      const pipe = this.pipelines[pipelineKey] ?? this.pipelines.BIO_STD ?? this.pipelines.FAST!;
      bg = this.device.createBindGroup({
        layout: pipe.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: slot.paramsBuf } },
          { binding: 1, resource: { buffer: slot.counterBuf } },
          { binding: 2, resource: { buffer: slot.tasksBuf } },
          { binding: 3, resource: { buffer: slot.weightsBuf } },
          { binding: 4, resource: { buffer: slot.resultsBuf } },
        ],
      });
      slot.bindGroups[pipelineKey] = bg;
    }
    return bg;
  }

  private resolvePipelineKey(
    taskCount: number,
    tasksU32: Uint32Array,
    kernelHint?: boolean | GpuKernelKind
  ): PipelineSlotKey {
    if (typeof kernelHint === 'number') {
      const key = pipelineKeyForKernelKind(kernelHint);
      if (this.pipelines[key]) return key;
    }

    let hasBio = false;
    let maxW = 0;
    let maxTotalH = 0;
    let useDeep =
      typeof kernelHint === 'number' ? kernelHint >= 1 : Boolean(kernelHint);

    for (let i = 0; i < taskCount; i++) {
      const base = i * TASK_STRIDE_U32;
      const flags = tasksU32[base + 7];
      const archCode = (flags >>> 2) & 0xf;
      const meta0 = tasksU32[base + 4];
      const meta1 = tasksU32[base + 5];
      const tr = meta0 & 0xff;
      const hiddenDepth = Math.max(0, tr - 1);
      const dims = [
        (meta0 >>> 16) & 0xff,
        (meta0 >>> 24) & 0xff,
        meta1 & 0xff,
        (meta1 >>> 8) & 0xff,
        (meta1 >>> 16) & 0xff,
      ];
      let totalH = 0;
      for (let l = 0; l < hiddenDepth && l < dims.length; l++) {
        if (dims[l] > maxW) maxW = dims[l];
        totalH += dims[l];
      }
      if (totalH > maxTotalH) maxTotalH = totalH;
      if (archCode !== 0) {
        hasBio = true;
      } else if (!useDeep && (tr > 3 || (tr === 3 && dims[0] > 8))) {
        useDeep = true;
      }
    }

    if (hasBio) {
      if (maxW <= 8 && maxTotalH <= 12) return 'BIO_TINY';
      if (maxW <= 16 && maxTotalH <= 24) return 'BIO_STD';
      if (maxW <= 32 && maxTotalH <= 36 && this.pipelines.BIO_MED) {
        return 'BIO_MED';
      }
      if (this.pipelines.BIO_LARGE) return 'BIO_LARGE';
      return 'BIO_STD';
    }
    if (maxW > 24 && this.pipelines.DEEP_64) return 'DEEP_64';
    return useDeep ? 'DEEP_24' : 'FAST';
  }

  submitRawBatch(
    slotIdx: number,
    taskCount: number,
    tasksU32: Uint32Array,
    weightsF32: Float32Array,
    weightFloatCount: number,
    kernelHint?: boolean | GpuKernelKind
  ): GpuPendingBatch {
    if (this.deviceLostError) {
      throw this.deviceLostError;
    }
    const safeSlot = slotIdx === 1 ? 1 : 0;
    if (taskCount <= 0) {
      const empty: WebGpuPendingBatch = {
        slotIdx: safeSlot,
        taskCount: 0,
        resultBytes: 0,
        submittedAtMs: performance.now(),
        mapPromise: Promise.resolve(),
        readbackBuf: null,
      };
      return empty;
    }

    const slot = this.slots[safeSlot];
    const pipelineKey = this.resolvePipelineKey(taskCount, tasksU32, kernelHint);
    const t0 = performance.now();

    const bindGroup = this.ensureSlotBuffers(
      slot,
      taskCount,
      weightFloatCount,
      pipelineKey
    );

    this.paramsU32[0] = taskCount >>> 0;
    this.device.queue.writeBuffer(slot.paramsBuf, 0, this.paramsU32);
    this.device.queue.writeBuffer(slot.counterBuf, 0, this.zeroU32);
    this.device.queue.writeBuffer(
      slot.tasksBuf!,
      0,
      tasksU32.buffer,
      tasksU32.byteOffset,
      taskCount * TASK_STRIDE_U32 * 4
    );
    this.device.queue.writeBuffer(
      slot.weightsBuf!,
      0,
      weightsF32.buffer,
      weightsF32.byteOffset,
      weightFloatCount * 4
    );

    const maxWg = this.calibration.calibratedWorkgroups || MAX_PERSISTENT_WORKGROUPS;
    const workgroups = Math.min(
      maxWg,
      Math.max(1, Math.ceil(taskCount / WORKGROUP_SIZE))
    );
    const resultBytes = taskCount * RESULT_STRIDE_U32 * 4;

    const pipeline =
      this.pipelines[pipelineKey] ??
      this.pipelines.BIO_STD ??
      this.pipelines.FAST!;

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(workgroups);
    pass.end();
    encoder.copyBufferToBuffer(
      slot.resultsBuf!,
      0,
      slot.readbackBuf!,
      0,
      resultBytes
    );
    this.device.queue.submit([encoder.finish()]);

    const readbackBuf = slot.readbackBuf!;
    const mapPromise = readbackBuf.mapAsync(GPU_MAP_MODE_READ, 0, resultBytes);

    const pending: WebGpuPendingBatch = {
      slotIdx: safeSlot,
      taskCount,
      resultBytes,
      submittedAtMs: t0,
      mapPromise,
      readbackBuf,
    };
    return pending;
  }

  async awaitRawBatch(pending: GpuPendingBatch): Promise<GpuBatchResult> {
    const p = pending as WebGpuPendingBatch;
    if (p.taskCount <= 0 || !p.readbackBuf) {
      return {
        scores: new Uint32Array(0),
        ticks: new Uint32Array(0),
        survivedFull: new Uint32Array(0),
        fitnesses: new Float32Array(0),
        totalTicks: 0,
        dispatchMs: 0,
      };
    }

    if (this.deviceLostError) {
      throw this.deviceLostError;
    }

    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error('WebGPU batch readback timed out (15000ms GPU watchdog)'));
      }, 15000);
    });
    try {
      await Promise.race([p.mapPromise, this.deviceLostPromise, timeoutPromise]);
    } finally {
      if (timeoutHandle !== null) clearTimeout(timeoutHandle);
    }

    const mapped = p.readbackBuf.getMappedRange(0, p.resultBytes);
    const u32Res = new Uint32Array(mapped);
    const f32Res = new Float32Array(mapped);

    const taskCount = p.taskCount;
    const scores = new Uint32Array(taskCount);
    const ticks = new Uint32Array(taskCount);
    const survivedFull = new Uint32Array(taskCount);
    const fitnesses = new Float32Array(taskCount);
    let totalTicks = 0;

    for (let i = 0; i < taskCount; i++) {
      const off = i * RESULT_STRIDE_U32;
      scores[i] = u32Res[off];
      const tk = u32Res[off + 1];
      ticks[i] = tk;
      survivedFull[i] = u32Res[off + 2];
      fitnesses[i] = f32Res[off + 3];
      totalTicks += tk;
    }

    p.readbackBuf.unmap();
    const now = performance.now();
    // When 2 waves overlap in ping-pong, wave N+1 waits in the GPU queue behind wave N.
    // Measure true marginal GPU wave duration from max(submittedAt, prevCompletedAt) so the
    // anti-freeze governor never sees 2x inflated latency and starves waveWeightBudget.
    const effectiveStartMs = Math.max(p.submittedAtMs, this.lastCompletedAtMs);
    const dispatchMs = Math.max(0.1, now - effectiveStartMs);
    this.lastCompletedAtMs = now;

    return {
      scores,
      ticks,
      survivedFull,
      fitnesses,
      totalTicks,
      dispatchMs,
    };
  }

  discardPendingBatch(pending: GpuPendingBatch): void {
    const p = pending as WebGpuPendingBatch;
    if (!p.readbackBuf) return;
    const slot = this.slots[p.slotIdx === 1 ? 1 : 0];
    const staleBuf = p.readbackBuf;
    if (slot.readbackBuf === staleBuf) {
      slot.readbackBuf = null;
    }
    p.mapPromise
      .then(() => {
        try {
          staleBuf.unmap();
        } catch {
          // Ignore if already unmapped/destroyed
        }
      })
      .catch(() => {
        // Ignore aborted mapAsync on device destroy
      })
      .finally(() => {
        try {
          staleBuf.destroy();
        } catch {
          // Ignore
        }
      });
  }

  async evaluateRawBatch(
    taskCount: number,
    tasksU32: Uint32Array,
    weightsF32: Float32Array,
    weightFloatCount: number,
    kernelHint?: boolean | GpuKernelKind
  ): Promise<GpuBatchResult> {
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
    this.disposed = true;
    for (const slot of this.slots) {
      slot.paramsBuf.destroy();
      slot.counterBuf.destroy();
      slot.tasksBuf?.destroy();
      slot.weightsBuf?.destroy();
      slot.resultsBuf?.destroy();
      slot.readbackBuf?.destroy();
    }
    this.device.destroy();
  }
}

export async function createBestGpuEvaluator(): Promise<GpuComputeEvaluator> {
  try {
    return await WebGpuEvaluator.create();
  } catch (webgpuErr) {
    const msg1 =
      webgpuErr instanceof Error ? webgpuErr.message : String(webgpuErr);
    // eslint-disable-next-line no-console
    console.warn('[NeuroLab GPU] WebGPU unavailable, using WebGL2:', msg1);
    try {
      return WebGl2Evaluator.create(msg1);
    } catch (gl2Err) {
      const msg2 = gl2Err instanceof Error ? gl2Err.message : String(gl2Err);
      throw new Error(`GPU unavailable (WebGPU: ${msg1}; WebGL2: ${msg2})`);
    }
  }
}

/**
 * Realistic GPU micro-benchmark:
 * Evaluates 3 × 8,192 evolving 4->4->1 birds (perturbed around a stable flying policy)
 * capped at 900 frames so GPU warps stay well-populated without artificial 100x tail skew.
 */
export async function runWebGpuMicroBenchmark(
  difficulty: DifficultyPreset = 'STANDARD'
): Promise<{
  engine: 'WEBGPU' | 'WEBGL2';
  adapterLabel: string;
  webgpuFallbackReason?: string;
  tasks: number;
  totalTicks: number;
  elapsedMs: number;
  mTicksPerSec: number;
}> {
  const gpu = await createBestGpuEvaluator();
  try {
    const tasks = 8192;
    const layers = [4, 4, 1]; // 25 params: [VEL_VY, DIST_X, TOP_CLEAR, BOT_CLEAR] -> 4 -> 1
    const paramCount = 4 * 4 + 4 + 4 * 1 + 1;
    const activeIndices = [1, 2, 3, 4];
    const encoded = encodeTopologyAndSensors(layers, activeIndices);
    const env = resolveEnvironment(difficulty);

    const tasksBuf = new ArrayBuffer(tasks * TASK_STRIDE_U32 * 4);
    const tasksU32 = new Uint32Array(tasksBuf);
    const tasksF32 = new Float32Array(tasksBuf);
    const weightsF32 = new Float32Array(tasks * paramCount);

    // Base centering policy (flies smoothly through multiple pipes) + per-bird mutation noise
    // Input order: 0=VEL_VY, 1=DIST_X, 2=TOP_CLEAR (y - gapTop), 3=BOT_CLEAR (gapBot - y)
    // Flap when bird is too low (BOT_CLEAR small / TOP_CLEAR large) and falling (VEL_VY > 0)
    const baseWeights = [
      // H0..H3 rows (4 inputs each)
      0.8, 0.0, 1.4, -1.6,
      0.4, -0.2, 0.9, -1.1,
      -0.3, 0.1, -0.8, 0.9,
      0.6, 0.1, 1.1, -1.2,
      // H0..H3 biases
      0.05, -0.05, 0.0, 0.02,
      // Output weights + bias
      1.2, 0.8, -0.9, 0.9, -0.15,
    ];

    let s = 1337;
    const nextRand = () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    for (let b = 0; b < tasks; b++) {
      const off = b * paramCount;
      for (let k = 0; k < paramCount; k++) {
        weightsF32[off + k] = baseWeights[k] + (nextRand() * 2 - 1) * 0.45;
      }
    }

    for (let i = 0; i < tasks; i++) {
      writeTaskDescToBuffers(tasksU32, tasksF32, i, {
        weightOffset: i * paramCount,
        seed: 1009 + (i & 31) * 7919,
        targetPipeCap: 24,
        maxFrames: 900,
        topoMeta0: encoded.topoMeta0,
        topoMeta1: encoded.topoMeta1,
        sensorMask: encoded.sensorMask,
        env,
        computeFitness: true,
      });
    }

    // Warm-up dispatch (shader JIT)
    await gpu.evaluateRawBatch(256, tasksU32, weightsF32, 256 * paramCount, false);

    // Timed 3-round burst
    let totalTicks = 0;
    let elapsedMs = 0;
    for (let r = 0; r < 3; r++) {
      const res = await gpu.evaluateRawBatch(
        tasks,
        tasksU32,
        weightsF32,
        tasks * paramCount,
        false
      );
      totalTicks += res.totalTicks;
      elapsedMs += res.dispatchMs;
    }

    const mTicksPerSec =
      elapsedMs > 0 ? totalTicks / 1e6 / (elapsedMs / 1000) : 0;

    return {
      engine: gpu.engine,
      adapterLabel: gpu.adapterLabel,
      webgpuFallbackReason: gpu.webgpuFallbackReason,
      tasks: tasks * 3,
      totalTicks,
      elapsedMs,
      mTicksPerSec,
    };
  } finally {
    gpu.dispose();
  }
}
