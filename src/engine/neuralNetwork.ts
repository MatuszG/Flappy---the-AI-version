import { ALL_SENSOR_FEATURES, inferInputFeaturesFromCount } from './sensors';
import type {
  ComputeProfileKind,
  EvolutionTopologyMode,
  HybridExpertKind,
  HybridModuleTelemetry,
  NetworkArchitecture,
  NetworkSnapshot,
  SensorFeatureId,
  SerializedNeuralNetwork,
  WeightPrecision,
} from './types';

export interface ArchitectureMeta {
  id: NetworkArchitecture;
  label: string;
  shortLabel: string;
  stateful: boolean;
  gpuNative: boolean;
  computeProfile: ComputeProfileKind;
  baseFlopsMultiplier: number;
  routingReason: string;
  bioInspiration: string;
  description: string;
}

export const HYBRID_EXPERT_KINDS: readonly HybridExpertKind[] = [
  'LTC_FLY',
  'SELECTIVE_SSM',
  'PONDER_ACT',
] as const;

export const ALL_ARCHITECTURES: readonly NetworkArchitecture[] = [
  'MLP',
  'RESIDUAL_SKIP',
  'LTC_FLY',
  'NEUROCHEM_GATE',
  'SYNAPTIC_STP',
  'LOOPED_REASONER',
  'PONDER_ACT',
  'SELECTIVE_SSM',
  'LATENT_ROLLOUT',
  'HYBRID_MOE',
  'DROSOPHILA_CONNECTOME',
  'DECOUPLED_FLY_CORTEX',
] as const;

export const REASONING_ARCHITECTURES: readonly NetworkArchitecture[] = [
  'LOOPED_REASONER',
  'PONDER_ACT',
  'SELECTIVE_SSM',
  'LATENT_ROLLOUT',
  'HYBRID_MOE',
  'DECOUPLED_FLY_CORTEX',
] as const;

export function isReasoningArchitecture(arch?: NetworkArchitecture): boolean {
  return (
    arch === 'LOOPED_REASONER' ||
    arch === 'PONDER_ACT' ||
    arch === 'SELECTIVE_SSM' ||
    arch === 'LATENT_ROLLOUT' ||
    arch === 'HYBRID_MOE' ||
    arch === 'DECOUPLED_FLY_CORTEX'
  );
}

export const ARCHITECTURE_META: Record<NetworkArchitecture, ArchitectureMeta> = {
  MLP: {
    id: 'MLP',
    label: 'Standard MLP',
    shortLabel: 'MLP',
    stateful: false,
    gpuNative: true,
    computeProfile: 'GPU_LOCKSTEP',
    baseFlopsMultiplier: 1.0,
    routingReason: 'Uniform dense layers execute in full SIMT lockstep on WebGPU/CUDA',
    bioInspiration: 'Memoryless feedforward perceptron',
    description: 'Classic stateless tanh MLP baseline (runs natively on GPU & CPU at all bit precisions)',
  },
  RESIDUAL_SKIP: {
    id: 'RESIDUAL_SKIP',
    label: 'Fly Reflex Skip',
    shortLabel: 'Skip',
    stateful: false,
    gpuNative: true,
    computeProfile: 'GPU_LOCKSTEP',
    baseFlopsMultiplier: 1.15,
    routingReason: 'Fixed linear bypass executes uniformly across all GPU threads',
    bioInspiration: 'Drosophila giant-fiber reflex + parallel descending pathway',
    description: 'Direct linear sensory→motor bypass summed with nonlinear hidden pathway (+K skip weights, runs on GPU & CPU)',
  },
  LTC_FLY: {
    id: 'LTC_FLY',
    label: 'Drosophila LTC',
    shortLabel: 'Fly-LTC',
    stateful: true,
    gpuNative: true,
    computeProfile: 'GPU_LOCKSTEP',
    baseFlopsMultiplier: 2.6,
    routingReason: 'Homogeneous membrane ODE update per neuron fits GPU lockstep',
    bioInspiration: 'Fruit-fly T4/T5 motion detector & C. elegans Liquid Time-Constant neuron',
    description: 'Learnable membrane time-constant τ & recurrent self-coupling (+2p/neuron) — infers hidden Vy & Pipe Vy from position history (GPU & CPU)',
  },
  NEUROCHEM_GATE: {
    id: 'NEUROCHEM_GATE',
    label: 'Neurochem Gate',
    shortLabel: 'NeuroChem',
    stateful: true,
    gpuNative: true,
    computeProfile: 'GPU_LOCKSTEP',
    baseFlopsMultiplier: 2.8,
    routingReason: 'Fixed per-neuron chemical state gate fits GPU lockstep',
    bioInspiration: 'Drosophila octopamine/dopamine neuromodulatory gain switching',
    description: 'Slow chemical state m_t multiplicatively gates gain & threshold (+3p/neuron) — one rich neuron adapts across calm vs gust regimes (GPU & CPU)',
  },
  SYNAPTIC_STP: {
    id: 'SYNAPTIC_STP',
    label: 'Synaptic STP',
    shortLabel: 'Syn-STP',
    stateful: true,
    gpuNative: true,
    computeProfile: 'GPU_LOCKSTEP',
    baseFlopsMultiplier: 2.5,
    routingReason: 'Homogeneous vesicle recovery update fits GPU lockstep',
    bioInspiration: 'Tsodyks-Markram vesicle depletion & calcium facilitation',
    description: 'Dynamic per-neuron synaptic efficacy u_t with recovery & facilitation (+2p/neuron) — automatic gain control & gust adaptation (GPU & CPU)',
  },
  LOOPED_REASONER: {
    id: 'LOOPED_REASONER',
    label: 'Looped Reasoner',
    shortLabel: 'Loop-K',
    stateful: true,
    gpuNative: true,
    computeProfile: 'GPU_LOCKSTEP',
    baseFlopsMultiplier: 3.8,
    routingReason: 'Fixed K-step loop executes identically across every GPU lane',
    bioInspiration: 'Universal Transformer / Recurrent-Depth LLM (Latent Chain-of-Thought)',
    description: 'Weight-tied recurrent refinement executes K iterative thinking steps per frame without adding parameters — native WebGPU WGSL & CPU',
  },
  PONDER_ACT: {
    id: 'PONDER_ACT',
    label: 'Ponder ACT (S1/S2)',
    shortLabel: 'Ponder',
    stateful: true,
    gpuNative: true,
    computeProfile: 'GPU_LOCKSTEP',
    baseFlopsMultiplier: 4.2,
    routingReason: 'Bounded K<=4 halting loop compiles cleanly into BIO_REASONING WGSL/CUDA',
    bioInspiration: 'PonderNet / Adaptive Computation Time (System 1 vs System 2)',
    description: 'Weight-tied recursive core with learned Halting Gate — dynamically allocates 1 step in calm flight (S1) and up to K steps in danger (S2) on WebGPU & CPU',
  },
  SELECTIVE_SSM: {
    id: 'SELECTIVE_SSM',
    label: 'Selective SSM (MinGRU)',
    shortLabel: 'MinGRU',
    stateful: true,
    gpuNative: true,
    computeProfile: 'GPU_LOCKSTEP',
    baseFlopsMultiplier: 3.1,
    routingReason: 'Element-wise selective gating fits GPU lockstep without branch divergence',
    bioInspiration: 'Mamba Selective State Space / Minimal Gated Recurrent Unit',
    description: 'Input-dependent selective forget/update gate z_t dynamically locks onto oscillations or resets memory instantaneously after passing a pipe (WebGPU & CPU)',
  },
  LATENT_ROLLOUT: {
    id: 'LATENT_ROLLOUT',
    label: 'Latent Rollout',
    shortLabel: 'Rollout',
    stateful: true,
    gpuNative: true,
    computeProfile: 'GPU_LOCKSTEP',
    baseFlopsMultiplier: 5.5,
    routingReason: 'Fixed 2-branch counterfactual rollout fits GPU lockstep',
    bioInspiration: 'World-Model / Tree-of-Thought Counterfactual Action Imagination',
    description: 'Imagines 2-step future latent trajectories for both JUMP and WAIT using a shared world model, then selects the higher-value future ΔV (WebGPU & CPU)',
  },
  HYBRID_MOE: {
    id: 'HYBRID_MOE',
    label: 'Hybrid MoE',
    shortLabel: 'Hybrid MoE',
    stateful: true,
    gpuNative: false,
    computeProfile: 'CPU_SPECIALIZED',
    baseFlopsMultiplier: 1.0,
    routingReason: 'Conditional expert branching & Zero-Init module spawning cause GPU warp divergence; auto-routed to CPU Workers / Colab OpenMP',
    bioInspiration: 'Cortical columns: lean MLP reflex core + on-demand LTC, MinGRU & Ponder ACT experts under FLOPs ROI control',
    description: 'Starts as a cheap MLP reflex core and dynamically attaches LTC_FLY, SELECTIVE_SSM, and PONDER_ACT experts with Zero-Init gating & trial-window ROI rollback (CPU-Optimized)',
  },
  DROSOPHILA_CONNECTOME: {
    id: 'DROSOPHILA_CONNECTOME',
    label: 'Drosophila Connectome',
    shortLabel: 'Drosophila',
    stateful: true,
    gpuNative: true,
    computeProfile: 'GPU_LOCKSTEP',
    baseFlopsMultiplier: 2.9,
    routingReason: 'Fused Optic-Lobe LTC + Mushroom Body APL + Octopamine + Giant Fiber kernel executes in SIMT lockstep on WebGPU WGSL (archCode=9) & Colab CUDA',
    bioInspiration: 'Drosophila melanogaster optic-lobe T4/T5 LTC + Mushroom Body APL inhibition + Octopamine arousal + Giant Fiber escape reflex',
    description: '4-part fruit-fly flight connectome: Optic-lobe LTC motion detectors, Mushroom Body APL global lateral inhibition, Octopamine arousal gain, and Giant Fiber direct sensory→motor escape reflex (WebGPU & CPU)',
  },
  DECOUPLED_FLY_CORTEX: {
    id: 'DECOUPLED_FLY_CORTEX',
    label: 'Decoupled Fly-Cortex',
    shortLabel: 'Fly-Cortex',
    stateful: true,
    gpuNative: false,
    computeProfile: 'CPU_SPECIALIZED',
    baseFlopsMultiplier: 2.3,
    routingReason: 'Sparse Top-2 Winner-Take-Most FlyHash APL associative memory addressing & online lifetime Dopamine plasticity run on CPU Workers / Colab OpenMP',
    bioInspiration: 'Decoupled Executive LTC + Giant Fiber Reasoning Core paired with 16-slot Mushroom Body FlyHash APL Associative Skill Memory & Dopamine Plasticity',
    description: 'Separates compact Executive Reasoning Core (LTC + Giant Fiber + Surprise S1/S2 Gate) from an O(1) FlyHash APL Associative Knowledge Bank with real-time Dopamine adaptation',
  },
};

export function getTrialComputeProfile(
  architecture: NetworkArchitecture = 'MLP',
  evolutionTopologyMode: EvolutionTopologyMode = 'SINGLE_SPECIES'
): ComputeProfileKind {
  if (evolutionTopologyMode === 'ISLAND_SPECIATION') {
    return 'CPU_SPECIALIZED';
  }
  return ARCHITECTURE_META[architecture]?.computeProfile ?? 'GPU_LOCKSTEP';
}

export function isCpuSpecializedTrial(
  architecture: NetworkArchitecture = 'MLP',
  evolutionTopologyMode: EvolutionTopologyMode = 'SINGLE_SPECIES'
): boolean {
  return getTrialComputeProfile(architecture, evolutionTopologyMode) === 'CPU_SPECIALIZED';
}

export type GpuTopologyTier =
  | 'FAST'
  | 'COMPACT_DEEP'
  | 'DEEP_24'
  | 'DEEP_64'
  | 'BIO_TINY'
  | 'BIO_STD'
  | 'BIO_MED'
  | 'BIO_LARGE'
  | 'CPU_ONLY';

export function getGpuTopologyTier(
  hiddenLayers: readonly number[],
  architecture: NetworkArchitecture
): GpuTopologyTier {
  if (architecture === 'HYBRID_MOE' || architecture === 'DECOUPLED_FLY_CORTEX') {
    return 'CPU_ONLY';
  }
  let maxW = 0;
  let totalHidden = 0;
  for (let i = 0; i < hiddenLayers.length; i++) {
    const w = hiddenLayers[i];
    if (w > maxW) maxW = w;
    totalHidden += w;
  }
  if (architecture === 'MLP') {
    if (hiddenLayers.length > 5 || maxW > 64) return 'CPU_ONLY';
    if (hiddenLayers.length <= 1) return 'FAST';
    if (maxW <= 8) return 'COMPACT_DEEP';
    return maxW <= 24 ? 'DEEP_24' : 'DEEP_64';
  }
  if (hiddenLayers.length > 4 || maxW > 64 || totalHidden > 64) {
    return 'CPU_ONLY';
  }
  if (maxW <= 8 && totalHidden <= 12) return 'BIO_TINY';
  if (maxW <= 16 && totalHidden <= 24) return 'BIO_STD';
  if (maxW <= 32 && totalHidden <= 36) return 'BIO_MED';
  return 'BIO_LARGE';
}

export function isGpuBioTopologySupported(
  hiddenLayers: readonly number[],
  architecture: NetworkArchitecture
): boolean {
  return getGpuTopologyTier(hiddenLayers, architecture) !== 'CPU_ONLY';
}

export function isWebGl2BioTopologySupported(
  hiddenLayers: readonly number[],
  architecture: NetworkArchitecture
): boolean {
  if (architecture === 'HYBRID_MOE' || architecture === 'DROSOPHILA_CONNECTOME') return false;
  if (architecture === 'MLP') return true;
  if (isReasoningArchitecture(architecture)) return false;
  if (hiddenLayers.length > 4) return false;
  let totalHidden = 0;
  for (let i = 0; i < hiddenLayers.length; i++) {
    const w = hiddenLayers[i];
    if (w > 8) return false;
    totalHidden += w;
  }
  return totalHidden <= 12;
}

export interface WeightPrecisionMeta {
  id: WeightPrecision;
  label: string;
  shortLabel: string;
  bitsPerParam: number;
  description: string;
}

export const ALL_WEIGHT_PRECISIONS: readonly WeightPrecision[] = [
  'FP32',
  'FP16',
  'INT8',
  'INT4',
  'TERNARY',
  'BINARY',
] as const;

export const WEIGHT_PRECISION_META: Record<WeightPrecision, WeightPrecisionMeta> = {
  FP32: {
    id: 'FP32',
    label: '32-bit Float',
    shortLabel: 'FP32',
    bitsPerParam: 32,
    description: 'Full continuous floating-point precision baseline (32 bits/param)',
  },
  FP16: {
    id: 'FP16',
    label: '16-bit Half',
    shortLabel: 'FP16',
    bitsPerParam: 16,
    description: 'IEEE-754 half-precision float quantization (16 bits/param)',
  },
  INT8: {
    id: 'INT8',
    label: '8-bit Int',
    shortLabel: 'INT8',
    bitsPerParam: 8,
    description: 'Uniform 8-bit fixed-point quantization in [-4, 4] (step 1/32)',
  },
  INT4: {
    id: 'INT4',
    label: '4-bit Int',
    shortLabel: 'INT4',
    bitsPerParam: 4,
    description: 'Ultra-compact 4-bit weights (16 levels, step 0.5 in [-3.5, 4.0])',
  },
  TERNARY: {
    id: 'TERNARY',
    label: '1.58-bit Ternary',
    shortLabel: '1.58b',
    bitsPerParam: 1.585,
    description: 'BitNet-style ternary weights {-1, 0, +1} with ±0.35 deadzone',
  },
  BINARY: {
    id: 'BINARY',
    label: '1-bit Binary',
    shortLabel: '1b',
    bitsPerParam: 1,
    description: 'Extreme 1-bit sign weights {-1, +1} (XNOR/BNN style)',
  },
};

export function quantizeScalar(v: number, precision: WeightPrecision): number {
  if (precision === 'FP32') return v;
  if (precision === 'BINARY') return v >= 0 ? 1 : -1;
  if (precision === 'TERNARY') {
    if (v > 0.35) return 1;
    if (v < -0.35) return -1;
    return 0;
  }
  if (precision === 'INT4') {
    // 16 discrete levels: -3.5, -3.0, ..., 0.0, ..., +4.0
    const q = Math.round(v * 2) * 0.5;
    return q < -3.5 ? -3.5 : q > 4.0 ? 4.0 : q;
  }
  if (precision === 'INT8') {
    // 256 discrete levels: step 1/32 = 0.03125 in [-4.0, 3.96875]
    const q = Math.round(v * 32) * 0.03125;
    return q < -4.0 ? -4.0 : q > 3.96875 ? 3.96875 : q;
  }
  // FP16 approximate IEEE-754 half-precision quantization
  if (v === 0) return 0;
  const clamped = v < -65504 ? -65504 : v > 65504 ? 65504 : v;
  const abs = Math.abs(clamped);
  if (abs < 6.103515625e-5) {
    return Math.round(clamped * 16777216) / 16777216;
  }
  const exp = Math.floor(Math.log2(abs));
  const scale = Math.pow(2, 10 - exp);
  return Math.round(clamped * scale) / scale;
}

export interface HybridExpertLayout {
  kind: HybridExpertKind;
  index: number;
  start: number;
  len: number;
  wIHStart: number;
  wIHLen: number;
  bHStart: number;
  bHLen: number;
  wHOStart: number;
  wHOLen: number;
  bOIdx: number;
  bioStart: number;
  bioLen: number;
  alphaIdx: number;
}

export interface HybridMoeLayout {
  expertHidden: number;
  routerWStart: number;
  routerWLen: number;
  routerBStart: number;
  routerBLen: number;
  experts: [HybridExpertLayout, HybridExpertLayout, HybridExpertLayout];
  totalBioParams: number;
}

export function getHybridMoeLayout(
  hiddenSpec: number | number[],
  inputNodes = 5
): HybridMoeLayout {
  const hidden = normalizeHiddenLayers(hiddenSpec);
  const firstW = hidden.length > 0 ? hidden[0] : 4;
  const expertHidden = Math.max(3, Math.min(6, firstW));
  let cur = 0;
  const routerWStart = cur;
  const routerWLen = inputNodes * 4;
  cur += routerWLen;
  const routerBStart = cur;
  const routerBLen = 4;
  cur += routerBLen;

  const makeExpert = (
    kind: HybridExpertKind,
    index: number,
    extraBioLen: number
  ): HybridExpertLayout => {
    const start = cur;
    const wIHStart = cur;
    const wIHLen = inputNodes * expertHidden;
    cur += wIHLen;
    const bHStart = cur;
    const bHLen = expertHidden;
    cur += bHLen;
    const wHOStart = cur;
    const wHOLen = expertHidden;
    cur += wHOLen;
    const bOIdx = cur++;
    const bioStart = cur;
    cur += extraBioLen;
    const alphaIdx = cur++;
    return {
      kind,
      index,
      start,
      len: cur - start,
      wIHStart,
      wIHLen,
      bHStart,
      bHLen,
      wHOStart,
      wHOLen,
      bOIdx,
      bioStart,
      bioLen: extraBioLen,
      alphaIdx,
    };
  };

  const e0 = makeExpert('LTC_FLY', 0, expertHidden * 2);
  const e1 = makeExpert('SELECTIVE_SSM', 1, expertHidden * 3);
  const e2 = makeExpert(
    'PONDER_ACT',
    2,
    expertHidden * expertHidden + expertHidden * 3 + 1
  );

  return {
    expertHidden,
    routerWStart,
    routerWLen,
    routerBStart,
    routerBLen,
    experts: [e0, e1, e2],
    totalBioParams: cur,
  };
}

export function calculateArchitectureExtraParams(
  hiddenSpec: number | number[],
  inputNodes = 5,
  architecture: NetworkArchitecture = 'MLP'
): number {
  const hidden = normalizeHiddenLayers(hiddenSpec);
  const hiddenNeuronCount = hidden.reduce((sum, w) => sum + w, 0);
  if (architecture === 'MLP') return 0;
  if (architecture === 'HYBRID_MOE') {
    return getHybridMoeLayout(hidden, inputNodes).totalBioParams;
  }
  if (architecture === 'RESIDUAL_SKIP') {
    // Only adds direct input->output skip weights when at least 1 hidden layer exists
    return hidden.length > 0 ? inputNodes : 0;
  }
  // Stateful bio-neurons: act on every hidden neuron, OR on the 1 output membrane when Depth 0
  const bioNodes = Math.max(1, hiddenNeuronCount);
  const lastH = hidden.length > 0 ? hidden[hidden.length - 1] : 1;
  if (architecture === 'LTC_FLY') return bioNodes * 2; // tau_logit, self_recurrent
  if (architecture === 'NEUROCHEM_GATE') return bioNodes * 3; // decay_logit, drive, gain
  if (architecture === 'SYNAPTIC_STP') return bioNodes * 2; // rec_logit, facilitation
  if (architecture === 'LOOPED_REASONER') return lastH * lastH + lastH * 2; // W_rec + b_rec + alpha_logit
  if (architecture === 'PONDER_ACT') return lastH * lastH + lastH * 3 + 1; // W_rec + b_rec + alpha_logit + w_halt + b_halt
  if (architecture === 'SELECTIVE_SSM') return bioNodes * 3; // gate_scale, gate_bias, state_mix
  if (architecture === 'LATENT_ROLLOUT') return lastH * lastH + lastH * 3; // W_dyn + w_act + b_dyn + w_val
  if (architecture === 'DROSOPHILA_CONNECTOME') {
    const gfLen = hidden.length > 0 ? inputNodes : 0;
    return bioNodes * 2 + gfLen + 4; // [tau_logit, self_rec]*bioNodes + w_GF + [apl_logit, oa_decay_logit, oa_drive, oa_gain]
  }
  if (architecture === 'DECOUPLED_FLY_CORTEX') {
    const gfLen = hidden.length > 0 ? inputNodes : 0;
    // [tau_logit, self_rec]*bioNodes + w_GF + 16 FlyHash associative slots + [apl_logit, mem_gate_logit, surprise_thresh_logit, da_lr_logit]
    return bioNodes * 2 + gfLen + 16 + 4;
  }
  return 0;
}

export function estimateArchitectureFlops(
  hiddenSpec: number | number[],
  inputNodes = 5,
  architecture: NetworkArchitecture = 'MLP',
  reasoningSteps = 3,
  activeExperts?: readonly HybridExpertKind[]
): number {
  const hidden = normalizeHiddenLayers(hiddenSpec);
  const dims = [inputNodes, ...hidden, 1];
  let macs = 0;
  let neurons = 0;
  for (let l = 0; l < dims.length - 1; l++) {
    macs += dims[l] * dims[l + 1];
    neurons += dims[l + 1];
  }
  const coreFlops = macs * 2 + neurons * 4;
  if (architecture === 'MLP') return coreFlops;
  if (architecture === 'RESIDUAL_SKIP') return coreFlops + inputNodes * 2;
  if (architecture === 'LTC_FLY') return coreFlops + Math.max(1, neurons - 1) * 9;
  if (architecture === 'NEUROCHEM_GATE') return coreFlops + Math.max(1, neurons - 1) * 12;
  if (architecture === 'SYNAPTIC_STP') return coreFlops + Math.max(1, neurons - 1) * 11;
  if (architecture === 'SELECTIVE_SSM') return coreFlops + Math.max(1, neurons - 1) * 14;
  if (architecture === 'DROSOPHILA_CONNECTOME') {
    return (
      coreFlops +
      Math.max(1, neurons - 1) * 12 +
      (hidden.length > 0 ? inputNodes * 2 : 0) +
      8
    );
  }
  if (architecture === 'DECOUPLED_FLY_CORTEX') {
    // O(1) Top-2 FlyHash lookup adds only 32 fixed hash ops + 4 readout ops regardless of memory bank capacity
    return (
      coreFlops +
      Math.max(1, neurons - 1) * 11 +
      (hidden.length > 0 ? inputNodes * 2 : 0) +
      36
    );
  }
  const lastH = hidden.length > 0 ? hidden[hidden.length - 1] : 1;
  const kSteps = Math.max(1, Math.min(8, Math.round(reasoningSteps)));
  if (architecture === 'LOOPED_REASONER') {
    return coreFlops + kSteps * (lastH * lastH * 2 + lastH * 8);
  }
  if (architecture === 'PONDER_ACT') {
    return coreFlops + kSteps * (lastH * lastH * 2 + lastH * 11);
  }
  if (architecture === 'LATENT_ROLLOUT') {
    return coreFlops + 4 * (lastH * lastH * 2 + lastH * 8);
  }
  // HYBRID_MOE: lean coreFlops when no experts are active; pays only for active experts + router
  const experts = activeExperts ?? [];
  if (experts.length === 0) return coreFlops;
  const he = Math.max(3, Math.min(6, hidden[0] ?? 4));
  let total = coreFlops + inputNodes * 8 + 16; // router overhead
  for (let i = 0; i < experts.length; i++) {
    const kind = experts[i];
    const baseExp = (inputNodes * he + he) * 2 + he * 4;
    if (kind === 'LTC_FLY') total += baseExp + he * 9;
    else if (kind === 'SELECTIVE_SSM') total += baseExp + he * 14;
    else if (kind === 'PONDER_ACT') {
      total += baseExp + Math.min(3, kSteps) * (he * he * 2 + he * 11);
    }
  }
  return total;
}

let hasSpareRandn = false;
let spareRandn = 0;

export function resetRandnState(): void {
  hasSpareRandn = false;
  spareRandn = 0;
}

export function randn(): number {
  if (hasSpareRandn) {
    hasSpareRandn = false;
    return spareRandn;
  }
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const mag = Math.sqrt(-2.0 * Math.log(u));
  const angle = 2.0 * Math.PI * v;
  spareRandn = mag * Math.sin(angle);
  hasSpareRandn = true;
  return mag * Math.cos(angle);
}

function sigmoid(x: number): number {
  if (x < -40) return 0;
  if (x > 40) return 1;
  return 1 / (1 + Math.exp(-x));
}

// Reusable 8-byte scratch buffer for zero-allocation exact IEEE-754 f64 bit fingerprinting
const F64_FP_BUF = new Float64Array(1);
const U32_FP_VIEW = new Uint32Array(F64_FP_BUF.buffer);

// Fast Padé rational tanh for CPU training rollouts (max error < 0.0007, ~6x faster than Math.tanh)
function fastTanhCpu(x: number): number {
  if (x >= 3.8) return 1;
  if (x <= -3.8) return -1;
  const x2 = x * x;
  const v = (x * (945 + x2 * (105 + x2))) / (945 + x2 * (420 + 15 * x2));
  return v > 1 ? 1 : v < -1 ? -1 : v;
}

function fastSigmoidCpu(x: number): number {
  return 0.5 + 0.5 * fastTanhCpu(0.5 * x);
}

export function normalizeHiddenLayers(
  hiddenSpec: number | number[] | undefined
): number[] {
  if (Array.isArray(hiddenSpec)) {
    return hiddenSpec
      .map((w) => Math.max(0, Math.min(64, Math.round(w))))
      .filter((w) => w > 0);
  }
  if (typeof hiddenSpec === 'number' && hiddenSpec > 0) {
    return [Math.max(1, Math.min(64, Math.round(hiddenSpec)))];
  }
  return [];
}

export function formatTopologyLabel(
  hiddenLayers: number[],
  inputNodes = 5
): string {
  const clean = normalizeHiddenLayers(hiddenLayers);
  if (clean.length === 0) return `${inputNodes}→1`;
  return `${inputNodes}→${clean.join('→')}→1`;
}

export interface TopologyCombinationOptions {
  /** Maximum total hidden neurons summed across all hidden layers (0..16) */
  maxHiddenNeurons: number;
  /** Maximum number of hidden layers (0..5, default 4) */
  maxDepth?: number;
  /** Minimum neurons per hidden layer (default 1; set 2 to skip 1-neuron bottlenecks) */
  minLayerWidth?: number;
  /** Whether to include Depth-0 linear perceptron [] (default true) */
  includeLinear?: boolean;
}

/**
 * Computes the exact number of unique ordered hidden-layer topologies
 * with sum(layers) <= maxHiddenNeurons and layers.length <= maxDepth in O(N*D).
 */
export function countTopologyCombinations(
  options: TopologyCombinationOptions
): number {
  const maxN = Math.max(0, Math.min(16, Math.round(options.maxHiddenNeurons)));
  const maxD = Math.max(0, Math.min(5, Math.round(options.maxDepth ?? 4)));
  const minW = Math.max(1, Math.min(8, Math.round(options.minLayerWidth ?? 1)));
  const includeLinear = options.includeLinear !== false;

  let total = includeLinear ? 1 : 0;
  if (maxD === 0 || maxN < minW) return total;

  // dp[d][s] = number of ordered compositions of sum s using exactly d layers >= minW
  let prev = new Float64Array(maxN + 1);
  prev[0] = 1;
  for (let d = 1; d <= maxD; d++) {
    const next = new Float64Array(maxN + 1);
    for (let s = d * minW; s <= maxN; s++) {
      let ways = 0;
      for (let w = minW; w <= s; w++) {
        ways += prev[s - w];
      }
      next[s] = ways;
      total += ways;
    }
    prev = next;
  }
  return total;
}

/**
 * Generates all unique ordered hidden-layer topologies (compositions) with
 * sum(layers) <= maxHiddenNeurons, layers.length <= maxDepth, and each width >= minLayerWidth.
 * Sorted naturally by total hidden neurons -> depth -> funnel-first descending widths.
 */
export function generateTopologyCombinations(
  options: TopologyCombinationOptions
): number[][] {
  const maxN = Math.max(0, Math.min(16, Math.round(options.maxHiddenNeurons)));
  const maxD = Math.max(0, Math.min(5, Math.round(options.maxDepth ?? 4)));
  const minW = Math.max(1, Math.min(8, Math.round(options.minLayerWidth ?? 1)));
  const includeLinear = options.includeLinear !== false;

  const out: number[][] = [];
  if (includeLinear) {
    out.push([]);
  }
  if (maxD === 0 || maxN < minW) return out;

  const current: number[] = [];
  const emitCompositions = (remaining: number, layersLeft: number) => {
    if (layersLeft === 1) {
      if (remaining >= minW) {
        current.push(remaining);
        out.push([...current]);
        current.pop();
      }
      return;
    }
    const maxW = remaining - (layersLeft - 1) * minW;
    for (let w = maxW; w >= minW; w--) {
      current.push(w);
      emitCompositions(remaining - w, layersLeft - 1);
      current.pop();
    }
  };

  for (let totalN = minW; totalN <= maxN; totalN++) {
    const maxLayersForN = Math.min(maxD, Math.floor(totalN / minW));
    for (let d = 1; d <= maxLayersForN; d++) {
      emitCompositions(totalN, d);
    }
  }
  return out;
}

export function calculateParameterCount(
  hiddenSpec: number | number[],
  inputNodes = 5,
  outputNodes = 1,
  architecture: NetworkArchitecture = 'MLP'
): number {
  const hidden = normalizeHiddenLayers(hiddenSpec);
  const dims = [inputNodes, ...hidden, outputNodes];
  let total = 0;
  for (let l = 0; l < dims.length - 1; l++) {
    total += dims[l] * dims[l + 1] + dims[l + 1];
  }
  total += calculateArchitectureExtraParams(hidden, inputNodes, architecture);
  return total;
}

export function calculateTopologyBreakdown(
  hiddenSpec: number | number[],
  inputNodes = 5,
  outputNodes = 1,
  architecture: NetworkArchitecture = 'MLP'
): {
  hiddenNeuronCount: number;
  weightCount: number;
  biasCount: number;
  bioParamCount: number;
  parameterCount: number;
} {
  const hidden = normalizeHiddenLayers(hiddenSpec);
  const dims = [inputNodes, ...hidden, outputNodes];
  let weightCount = 0;
  let biasCount = 0;
  for (let l = 0; l < dims.length - 1; l++) {
    weightCount += dims[l] * dims[l + 1];
    biasCount += dims[l + 1];
  }
  const hiddenNeuronCount = hidden.reduce((sum, w) => sum + w, 0);
  const bioParamCount = calculateArchitectureExtraParams(
    hidden,
    inputNodes,
    architecture
  );
  return {
    hiddenNeuronCount,
    weightCount,
    biasCount,
    bioParamCount,
    parameterCount: weightCount + biasCount + bioParamCount,
  };
}

export class NeuralNetwork {
  readonly inputNodes: number;
  readonly inputFeatures: SensorFeatureId[];
  readonly hiddenLayers: number[];
  readonly hiddenNodes: number;
  readonly outputNodes: number;
  readonly layers: number[];
  readonly architecture: NetworkArchitecture;
  readonly weightPrecision: WeightPrecision;
  /** Recursive Test-Time Compute steps K (for LOOPED_REASONER) or max steps (for PONDER_ACT). Can be modified post-training for TTC Extrapolation tests! */
  reasoningSteps: number;

  // Continuous latent parameters (used by optimizers: GA/DE/PSO/CMA/ES)
  layerWeights: Float64Array[];
  layerBiases: Float64Array[];
  bioParams: Float64Array;

  // Pre-quantized inference caches (aliased directly to latent arrays when FP32)
  qLayerWeights: Float64Array[];
  qLayerBiases: Float64Array[];
  qBioParams: Float64Array;

  // Precomputed per-bio-neuron constant rates (sigmoid(tau/decay/rec) * factor) to avoid billions of Math.exp() calls
  private bioRates: Float64Array;
  private bioOneMinusRates: Float64Array;
  private bioAux0: Float64Array;
  private bioAux1: Float64Array;

  // Dynamic per-neuron internal state (membrane potential / chemical tone / STP vesicles / latent reasoning state)
  private neuronState: Float64Array;
  private reasoningScratchA: Float64Array;
  private reasoningScratchB: Float64Array;
  private reasoningScratchC: Float64Array;
  private layerActivations: Float64Array[];
  private lastOutput: number;

  // Hybrid MoE module state (for HYBRID_MOE: 0=LTC_FLY, 1=SELECTIVE_SSM, 2=PONDER_ACT)
  hybridActiveMask: Uint8Array;
  hybridLayout: HybridMoeLayout | null;
  lastHybridRouterWeights: Float64Array;
  lastHybridFlops: number;

  // Lightweight live telemetry scalars updated during reasoning inference (zero allocation)
  lastPonderSteps = 1;
  lastRolloutAdvantage = 0;
  lastSsmGateMean = 0.5;
  lastActiveSlots: [number, number] = [0, 1];
  lastSlotWeights: [number, number] = [0.5, 0.5];
  lastMemoryReadout = 0;
  lastDopamineSignal = 0;
  onlineUpdatesCount = 0;
  lastSurpriseLevel = 0;
  lastSystem2Active = false;

  constructor(
    inputNodes = 5,
    hiddenSpec: number | number[] = [6],
    outputNodes = 1,
    serialized?: SerializedNeuralNetwork,
    inputFeatures?: SensorFeatureId[],
    architecture?: NetworkArchitecture,
    weightPrecision?: WeightPrecision,
    reasoningSteps?: number
  ) {
    this.inputNodes = inputNodes;
    this.inputFeatures = inferInputFeaturesFromCount(
      inputNodes,
      serialized?.inputFeatures ?? inputFeatures
    );
    this.hiddenLayers = normalizeHiddenLayers(
      serialized?.hiddenLayers !== undefined ? serialized.hiddenLayers : hiddenSpec
    );
    this.hiddenNodes =
      this.hiddenLayers.length === 0
        ? 0
        : this.hiddenLayers.reduce((acc, v) => acc + v, 0);
    this.outputNodes = outputNodes;
    this.layers = [inputNodes, ...this.hiddenLayers, outputNodes];
    this.architecture = serialized?.architecture ?? architecture ?? 'MLP';
    this.weightPrecision = serialized?.weightPrecision ?? weightPrecision ?? 'FP32';
    const defaultSteps =
      this.architecture === 'PONDER_ACT'
        ? 4
        : this.architecture === 'HYBRID_MOE'
          ? 3
          : 3;
    const rawSteps = serialized?.reasoningSteps ?? reasoningSteps ?? defaultSteps;
    this.reasoningSteps = Math.max(1, Math.min(8, Math.round(rawSteps)));

    const transitions = this.layers.length - 1;
    this.layerWeights = new Array(transitions);
    this.layerBiases = new Array(transitions);
    this.layerActivations = new Array(this.layers.length);

    for (let i = 0; i < this.layers.length; i++) {
      this.layerActivations[i] = new Float64Array(this.layers[i]);
    }

    for (let l = 0; l < transitions; l++) {
      const fanIn = this.layers[l];
      const fanOut = this.layers[l + 1];
      this.layerWeights[l] = new Float64Array(fanIn * fanOut);
      this.layerBiases[l] = new Float64Array(fanOut);
    }

    this.hybridLayout =
      this.architecture === 'HYBRID_MOE'
        ? getHybridMoeLayout(this.hiddenLayers, this.inputNodes)
        : null;
    this.hybridActiveMask = new Uint8Array(3);
    this.lastHybridRouterWeights = new Float64Array([1, 0, 0, 0]);
    this.lastHybridFlops = estimateArchitectureFlops(
      this.hiddenLayers,
      this.inputNodes,
      this.architecture,
      this.reasoningSteps
    );

    if (this.architecture === 'HYBRID_MOE') {
      if (serialized?.hybridActiveExperts) {
        for (let i = 0; i < serialized.hybridActiveExperts.length; i++) {
          const idx = HYBRID_EXPERT_KINDS.indexOf(serialized.hybridActiveExperts[i]);
          if (idx >= 0) this.hybridActiveMask[idx] = 1;
        }
      } else {
        // Static HYBRID_MOE starts with all 3 experts ready; MorphogenesisController masks to [0,0,0] at Gen 0
        this.hybridActiveMask[0] = 1;
        this.hybridActiveMask[1] = 1;
        this.hybridActiveMask[2] = 1;
      }
    }

    const extraLen = calculateArchitectureExtraParams(
      this.hiddenLayers,
      this.inputNodes,
      this.architecture
    );
    this.bioParams = new Float64Array(extraLen);

    const lastH =
      this.hiddenLayers.length > 0
        ? this.hiddenLayers[this.hiddenLayers.length - 1]
        : 1;
    const stateNodes =
      this.architecture === 'HYBRID_MOE'
        ? (this.hybridLayout?.expertHidden ?? 4) * 3
        : this.architecture === 'DROSOPHILA_CONNECTOME'
          ? Math.max(1, this.hiddenNodes) + 1
          : this.architecture === 'DECOUPLED_FLY_CORTEX'
            ? Math.max(1, this.hiddenNodes) + 32 + this.inputNodes
            : this.architecture === 'LTC_FLY' ||
                this.architecture === 'NEUROCHEM_GATE' ||
                this.architecture === 'SYNAPTIC_STP' ||
                this.architecture === 'SELECTIVE_SSM'
              ? Math.max(1, this.hiddenNodes)
              : this.architecture === 'LOOPED_REASONER' ||
                  this.architecture === 'PONDER_ACT' ||
                  this.architecture === 'LATENT_ROLLOUT'
                ? lastH
                : 0;
    const rateNodes =
      this.architecture === 'DECOUPLED_FLY_CORTEX'
        ? Math.max(1, this.hiddenNodes) + 4
        : stateNodes;
    this.neuronState = new Float64Array(stateNodes);
    this.bioRates = new Float64Array(rateNodes);
    this.bioOneMinusRates = new Float64Array(rateNodes);
    this.bioAux0 = new Float64Array(rateNodes);
    this.bioAux1 = new Float64Array(rateNodes);

    const scratchLen =
      this.architecture === 'HYBRID_MOE'
        ? this.hybridLayout?.expertHidden ?? 4
        : this.architecture === 'LOOPED_REASONER' ||
            this.architecture === 'PONDER_ACT' ||
            this.architecture === 'LATENT_ROLLOUT'
          ? lastH
          : 0;
    this.reasoningScratchA = new Float64Array(scratchLen);
    this.reasoningScratchB = new Float64Array(scratchLen);
    this.reasoningScratchC = new Float64Array(scratchLen);

    if (serialized) {
      if (
        serialized.layerWeights &&
        serialized.layerBiases &&
        serialized.layerWeights.length === transitions &&
        serialized.layerBiases.length === transitions
      ) {
        for (let l = 0; l < transitions; l++) {
          this.layerWeights[l].set(serialized.layerWeights[l]);
          this.layerBiases[l].set(serialized.layerBiases[l]);
        }
      } else if (transitions === 1) {
        this.layerWeights[0].set(serialized.weightsHO);
        this.layerBiases[0].set(serialized.biasO);
      } else if (transitions === 2) {
        this.layerWeights[0].set(serialized.weightsIH);
        this.layerBiases[0].set(serialized.biasH);
        this.layerWeights[1].set(serialized.weightsHO);
        this.layerBiases[1].set(serialized.biasO);
      }
      if (serialized.bioParams && serialized.bioParams.length === extraLen) {
        this.bioParams.set(serialized.bioParams);
      } else if (extraLen > 0) {
        this.initBioParams();
      }
    } else {
      for (let l = 0; l < transitions; l++) {
        const fanIn = this.layers[l];
        const fanOut = this.layers[l + 1];
        const scale = Math.sqrt(2 / (fanIn + fanOut));
        const w = this.layerWeights[l];
        const b = this.layerBiases[l];
        for (let i = 0; i < w.length; i++) {
          w[i] = randn() * scale;
        }
        for (let i = 0; i < b.length; i++) {
          b[i] = randn() * 0.25;
        }
      }
      if (extraLen > 0) {
        this.initBioParams();
      }
    }

    if (this.weightPrecision === 'FP32') {
      this.qLayerWeights = this.layerWeights;
      this.qLayerBiases = this.layerBiases;
      this.qBioParams = this.bioParams;
      if (this.bioRates.length > 0) {
        this.syncBioRatesCache();
      }
    } else {
      this.qLayerWeights = this.layerWeights.map((w) => new Float64Array(w.length));
      this.qLayerBiases = this.layerBiases.map((b) => new Float64Array(b.length));
      this.qBioParams = new Float64Array(this.bioParams.length);
      this.syncQuantizedCache();
    }

    this.resetState();
    this.lastOutput = 0.5;
  }

  private initBioParams(): void {
    const bp = this.bioParams;
    if (this.architecture === 'RESIDUAL_SKIP') {
      const scale = Math.sqrt(1 / Math.max(1, this.inputNodes));
      for (let i = 0; i < bp.length; i++) bp[i] = randn() * scale;
      return;
    }
    if (this.architecture === 'LTC_FLY') {
      // [tau_logit, self_rec] per neuron: tau around 0..1.5 => alpha in [0.5, 0.82]
      for (let i = 0; i < bp.length; i += 2) {
        bp[i] = randn() * 0.8 + 0.4;
        bp[i + 1] = randn() * 0.5;
      }
      return;
    }
    if (this.architecture === 'NEUROCHEM_GATE') {
      // [decay_logit, drive, gain] per neuron
      for (let i = 0; i < bp.length; i += 3) {
        bp[i] = randn() * 0.7 - 0.6; // slower chemical time constant
        bp[i + 1] = randn() * 0.6;
        bp[i + 2] = randn() * 0.45;
      }
      return;
    }
    if (this.architecture === 'SYNAPTIC_STP') {
      // [rec_logit, facilitation] per neuron
      for (let i = 0; i < bp.length; i += 2) {
        bp[i] = randn() * 0.7;
        bp[i + 1] = randn() * 0.4;
      }
      return;
    }
    if (
      this.architecture === 'LOOPED_REASONER' ||
      this.architecture === 'PONDER_ACT'
    ) {
      const H = this.neuronState.length;
      const recScale = Math.sqrt(1 / Math.max(1, H)) * 0.7;
      let idx = 0;
      for (let i = 0; i < H * H; i++) bp[idx++] = randn() * recScale; // W_rec
      for (let i = 0; i < H; i++) bp[idx++] = randn() * 0.15; // b_rec
      for (let i = 0; i < H; i++) bp[idx++] = randn() * 0.6 + 0.35; // alpha_logit
      if (this.architecture === 'PONDER_ACT') {
        for (let i = 0; i < H; i++) bp[idx++] = randn() * 0.5; // w_halt
        bp[idx++] = randn() * 0.35 - 0.25; // b_halt (starts ~0.44 halt prob -> explores S1 & S2)
      }
      return;
    }
    if (this.architecture === 'SELECTIVE_SSM') {
      // [gate_scale, gate_bias, state_mix] per neuron
      for (let i = 0; i < bp.length; i += 3) {
        bp[i] = randn() * 0.65;
        bp[i + 1] = randn() * 0.5 + 0.25;
        bp[i + 2] = randn() * 0.5;
      }
      return;
    }
    if (this.architecture === 'LATENT_ROLLOUT') {
      const H = this.neuronState.length;
      const dynScale = Math.sqrt(1 / Math.max(1, H)) * 0.7;
      let idx = 0;
      for (let i = 0; i < H * H; i++) bp[idx++] = randn() * dynScale; // W_dyn
      for (let i = 0; i < H; i++) bp[idx++] = randn() * 0.7; // w_act
      for (let i = 0; i < H; i++) bp[idx++] = randn() * 0.15; // b_dyn
      for (let i = 0; i < H; i++) bp[idx++] = randn() * 0.7; // w_val
      return;
    }
    if (this.architecture === 'DROSOPHILA_CONNECTOME') {
      const bioNodes = Math.max(1, this.hiddenNodes);
      for (let i = 0; i < bioNodes; i++) {
        bp[i * 2] = randn() * 0.8 + 0.4; // tau_logit
        bp[i * 2 + 1] = randn() * 0.5; // self_rec
      }
      let cur = bioNodes * 2;
      if (this.hiddenLayers.length > 0) {
        const gfScale = Math.sqrt(1 / Math.max(1, this.inputNodes)) * 0.75;
        for (let i = 0; i < this.inputNodes; i++) {
          bp[cur++] = randn() * gfScale; // w_GF Giant Fiber reflex
        }
      }
      bp[cur++] = randn() * 0.5 + 0.2; // apl_logit (Mushroom Body lateral inhibition)
      bp[cur++] = randn() * 0.6 - 0.5; // oa_decay_logit (Octopamine persistence)
      bp[cur++] = randn() * 0.6 + 0.6; // oa_drive (sensory arousal sensitivity)
      bp[cur++] = randn() * 0.4; // oa_gain (arousal gain modulation)
      return;
    }
    if (this.architecture === 'DECOUPLED_FLY_CORTEX') {
      const bioNodes = Math.max(1, this.hiddenNodes);
      for (let i = 0; i < bioNodes; i++) {
        bp[i * 2] = randn() * 0.7 + 0.45; // tau_logit (Executive LTC core)
        bp[i * 2 + 1] = randn() * 0.45; // self_rec
      }
      let cur = bioNodes * 2;
      if (this.hiddenLayers.length > 0) {
        const gfScale = Math.sqrt(1 / Math.max(1, this.inputNodes)) * 0.8;
        for (let i = 0; i < this.inputNodes; i++) {
          bp[cur++] = randn() * gfScale; // w_GF Giant Fiber 0-lag reflex bypass
        }
      }
      // 16-slot External FlyHash APL Associative Skill Bank
      for (let s = 0; s < 16; s++) {
        bp[cur++] = randn() * 0.35;
      }
      bp[cur++] = randn() * 0.4 + 0.25; // apl_logit
      bp[cur++] = randn() * 0.4 + 0.1; // mem_gate_logit
      bp[cur++] = randn() * 0.3 - 0.15; // surprise_thresh_logit
      bp[cur++] = randn() * 0.3 - 0.2; // da_lr_logit
      return;
    }
    if (this.architecture === 'HYBRID_MOE' && this.hybridLayout) {
      const lay = this.hybridLayout;
      const He = lay.expertHidden;
      const rScale = Math.sqrt(1 / Math.max(1, this.inputNodes)) * 0.35;
      for (let i = 0; i < lay.routerWLen; i++) bp[lay.routerWStart + i] = randn() * rScale;
      bp[lay.routerBStart] = 0.85; // MLP reflex bias
      bp[lay.routerBStart + 1] = -0.15;
      bp[lay.routerBStart + 2] = -0.15;
      bp[lay.routerBStart + 3] = -0.15;

      const wScale = Math.sqrt(2 / (this.inputNodes + He));
      const oScale = Math.sqrt(1 / He) * 0.6;
      for (let ei = 0; ei < 3; ei++) {
        const ex = lay.experts[ei];
        for (let i = 0; i < ex.wIHLen; i++) bp[ex.wIHStart + i] = randn() * wScale;
        for (let i = 0; i < ex.bHLen; i++) bp[ex.bHStart + i] = randn() * 0.2;
        for (let i = 0; i < ex.wHOLen; i++) bp[ex.wHOStart + i] = randn() * oScale;
        bp[ex.bOIdx] = 0;
        bp[ex.alphaIdx] = 0.45;
        if (ex.kind === 'LTC_FLY') {
          for (let j = 0; j < He; j++) {
            bp[ex.bioStart + j * 2] = randn() * 0.6 + 0.4;
            bp[ex.bioStart + j * 2 + 1] = randn() * 0.4;
          }
        } else if (ex.kind === 'SELECTIVE_SSM') {
          for (let j = 0; j < He; j++) {
            bp[ex.bioStart + j * 3] = randn() * 0.6;
            bp[ex.bioStart + j * 3 + 1] = randn() * 0.4 + 0.25;
            bp[ex.bioStart + j * 3 + 2] = randn() * 0.45;
          }
        } else {
          let p = ex.bioStart;
          const recScale = Math.sqrt(1 / He) * 0.65;
          for (let i = 0; i < He * He; i++) bp[p++] = randn() * recScale;
          for (let i = 0; i < He; i++) bp[p++] = randn() * 0.15;
          for (let i = 0; i < He; i++) bp[p++] = randn() * 0.5 + 0.35;
          for (let i = 0; i < He; i++) bp[p++] = randn() * 0.45;
          bp[p++] = randn() * 0.3 - 0.2;
        }
      }
    }
  }

  private syncBioRatesCache(): void {
    const rates = this.bioRates;
    const omr = this.bioOneMinusRates;
    const aux0 = this.bioAux0;
    const aux1 = this.bioAux1;
    const n = rates.length;
    if (n === 0) return;
    const qbp = this.qBioParams;
    const arch = this.architecture;
    if (arch === 'LTC_FLY') {
      for (let i = 0; i < n; i++) {
        const a = sigmoid(qbp[i * 2]);
        rates[i] = a;
        omr[i] = 1 - a;
        aux0[i] = qbp[i * 2 + 1];
      }
    } else if (arch === 'NEUROCHEM_GATE') {
      for (let i = 0; i < n; i++) {
        const b = sigmoid(qbp[i * 3]);
        rates[i] = b;
        omr[i] = 1 - b;
        aux0[i] = qbp[i * 3 + 1];
        aux1[i] = qbp[i * 3 + 2];
      }
    } else if (arch === 'SYNAPTIC_STP') {
      for (let i = 0; i < n; i++) {
        const r = 0.12 * sigmoid(qbp[i * 2]);
        rates[i] = r;
        omr[i] = 1 - r;
        aux0[i] = qbp[i * 2 + 1];
      }
    } else if (arch === 'LOOPED_REASONER' || arch === 'PONDER_ACT') {
      const alphaOff = n * n + n;
      for (let i = 0; i < n; i++) {
        const a = sigmoid(qbp[alphaOff + i]);
        rates[i] = a;
        omr[i] = 1 - a;
      }
    } else if (arch === 'SELECTIVE_SSM') {
      for (let i = 0; i < n; i++) {
        rates[i] = qbp[i * 3]; // gate_scale
        aux0[i] = qbp[i * 3 + 1]; // gate_bias
        aux1[i] = qbp[i * 3 + 2]; // state_mix
      }
    } else if (arch === 'HYBRID_MOE' && this.hybridLayout) {
      const He = this.hybridLayout.expertHidden;
      const e0 = this.hybridLayout.experts[0];
      for (let j = 0; j < He; j++) {
        const a = sigmoid(qbp[e0.bioStart + j * 2]);
        rates[j] = a;
        omr[j] = 1 - a;
        aux0[j] = qbp[e0.bioStart + j * 2 + 1];
      }
      const e2 = this.hybridLayout.experts[2];
      const alphaOff = e2.bioStart + He * He + He;
      for (let j = 0; j < He; j++) {
        const a = sigmoid(qbp[alphaOff + j]);
        rates[He * 2 + j] = a;
        omr[He * 2 + j] = 1 - a;
      }
    } else if (arch === 'DROSOPHILA_CONNECTOME') {
      const bioNodes = n - 1;
      for (let i = 0; i < bioNodes; i++) {
        const a = sigmoid(qbp[i * 2]);
        rates[i] = a;
        omr[i] = 1 - a;
        aux0[i] = qbp[i * 2 + 1];
      }
      const tailOff =
        bioNodes * 2 + (this.hiddenLayers.length > 0 ? this.inputNodes : 0);
      const oaBeta = sigmoid(qbp[tailOff + 1]);
      rates[bioNodes] = oaBeta;
      omr[bioNodes] = 1 - oaBeta;
      aux0[bioNodes] = 0.5 * sigmoid(qbp[tailOff]); // aplGamma
    } else if (arch === 'DECOUPLED_FLY_CORTEX') {
      const bioNodes = Math.max(1, this.hiddenNodes);
      for (let i = 0; i < bioNodes; i++) {
        const a = sigmoid(qbp[i * 2]);
        rates[i] = a;
        omr[i] = 1 - a;
        aux0[i] = qbp[i * 2 + 1];
      }
      const tailOff =
        bioNodes * 2 +
        (this.hiddenLayers.length > 0 ? this.inputNodes : 0) +
        16;
      aux0[bioNodes] = 0.45 * sigmoid(qbp[tailOff]); // aplGamma
      const tb1 = qbp[tailOff + 1];
      aux0[bioNodes + 1] =
        1.8 * (tb1 > 19.5 ? 1 : tb1 < -19.5 ? -1 : Math.tanh(tb1)); // memBeta
      aux0[bioNodes + 2] = 0.18 + 0.45 * sigmoid(qbp[tailOff + 2]); // s2Thresh
      aux0[bioNodes + 3] = 0.35 + 0.85 * sigmoid(qbp[tailOff + 3]); // oaGain
    }
  }

  syncQuantizedCache(): void {
    const prec = this.weightPrecision;
    if (prec !== 'FP32') {
      for (let l = 0; l < this.layerWeights.length; l++) {
        const w = this.layerWeights[l];
        const qw = this.qLayerWeights[l];
        for (let i = 0; i < w.length; i++) qw[i] = quantizeScalar(w[i], prec);
        const b = this.layerBiases[l];
        const qb = this.qLayerBiases[l];
        for (let i = 0; i < b.length; i++) qb[i] = quantizeScalar(b[i], prec);
      }
      const bp = this.bioParams;
      const qbp = this.qBioParams;
      for (let i = 0; i < bp.length; i++) {
        qbp[i] = quantizeScalar(bp[i], prec);
      }
    }
    if (this.bioRates.length > 0) {
      this.syncBioRatesCache();
    }
  }

  resetState(): void {
    this.lastPonderSteps = 1;
    this.lastRolloutAdvantage = 0;
    this.lastSsmGateMean = 0.5;
    this.lastDopamineSignal = 0;
    this.onlineUpdatesCount = 0;
    this.lastSurpriseLevel = 0;
    this.lastSystem2Active = false;
    if (this.neuronState.length === 0) return;
    const initVal = this.architecture === 'SYNAPTIC_STP' ? 1.0 : 0.0;
    this.neuronState.fill(initVal);
    if (this.architecture === 'DECOUPLED_FLY_CORTEX' && this.qBioParams) {
      const bioNodes = Math.max(1, this.hiddenNodes);
      const memStateOff = bioNodes + 1;
      const memOff =
        bioNodes * 2 + (this.hiddenLayers.length > 0 ? this.inputNodes : 0);
      for (let s = 0; s < 16; s++) {
        this.neuronState[memStateOff + s] = this.qBioParams[memOff + s] ?? 0;
      }
    }
  }

  getLayerActivations(layerIdx: number): Float64Array | undefined {
    return this.layerActivations[layerIdx];
  }

  getParameterCount(): number {
    let total = this.bioParams.length;
    for (let l = 0; l < this.layerWeights.length; l++) {
      total += this.layerWeights[l].length + this.layerBiases[l].length;
    }
    return total;
  }

  toFlatVector(out?: Float64Array): Float64Array {
    const total = this.getParameterCount();
    const vec = out && out.length === total ? out : new Float64Array(total);
    let idx = 0;
    for (let l = 0; l < this.layerWeights.length; l++) {
      vec.set(this.layerWeights[l], idx);
      idx += this.layerWeights[l].length;
      vec.set(this.layerBiases[l], idx);
      idx += this.layerBiases[l].length;
    }
    if (this.bioParams.length > 0) {
      vec.set(this.bioParams, idx);
    }
    return vec;
  }

  toQuantizedFlatVector(out?: Float64Array): Float64Array {
    const total = this.getParameterCount();
    const vec = out && out.length === total ? out : new Float64Array(total);
    let idx = 0;
    for (let l = 0; l < this.qLayerWeights.length; l++) {
      vec.set(this.qLayerWeights[l], idx);
      idx += this.qLayerWeights[l].length;
      vec.set(this.qLayerBiases[l], idx);
      idx += this.qLayerBiases[l].length;
    }
    if (this.qBioParams.length > 0) {
      vec.set(this.qBioParams, idx);
    }
    return vec;
  }

  fromFlatVector(vec: Float64Array): void {
    let idx = 0;
    for (let l = 0; l < this.layerWeights.length; l++) {
      const wLen = this.layerWeights[l].length;
      this.layerWeights[l].set(vec.subarray(idx, idx + wLen));
      idx += wLen;
      const bLen = this.layerBiases[l].length;
      this.layerBiases[l].set(vec.subarray(idx, idx + bLen));
      idx += bLen;
    }
    if (this.bioParams.length > 0) {
      this.bioParams.set(vec.subarray(idx, idx + this.bioParams.length));
    }
    this.syncQuantizedCache();
  }

  /**
   * Exact, collision-free IEEE-754 bit fingerprint of the quantized inference parameters
   * (`qLayerWeights`, `qLayerBiases`, `qBioParams`). Used to skip redundant multi-thousand-pipe
   * exact f64 audits when an unchanged elite or identical quantized phenotype reappears in later generations.
   */
  getQuantizedFingerprint(): string {
    const prec = this.weightPrecision;
    const parts: string[] = [];
    if (this.architecture === 'HYBRID_MOE') {
      parts.push(
        `H${this.hybridActiveMask[0]}${this.hybridActiveMask[1]}${this.hybridActiveMask[2]}`
      );
    }
    if (
      this.architecture === 'LOOPED_REASONER' ||
      this.architecture === 'PONDER_ACT'
    ) {
      parts.push(`K${this.reasoningSteps}`);
    }
    if (prec === 'BINARY' || prec === 'TERNARY' || prec === 'INT4') {
      // Exact compact encoding for low-bit discrete levels (integers in [-7, +8] after *2)
      for (let l = 0; l < this.qLayerWeights.length; l++) {
        const qw = this.qLayerWeights[l];
        for (let i = 0; i < qw.length; i++) parts.push(String(qw[i] * 2));
        const qb = this.qLayerBiases[l];
        for (let i = 0; i < qb.length; i++) parts.push(String(qb[i] * 2));
      }
      const qbp = this.qBioParams;
      for (let i = 0; i < qbp.length; i++) parts.push(String(qbp[i] * 2));
      return parts.join(',');
    }

    for (let l = 0; l < this.qLayerWeights.length; l++) {
      const qw = this.qLayerWeights[l];
      for (let i = 0; i < qw.length; i++) {
        const v = qw[i];
        F64_FP_BUF[0] = v === 0 ? 0 : v;
        parts.push(
          `${U32_FP_VIEW[1].toString(36)}.${U32_FP_VIEW[0].toString(36)}`
        );
      }
      const qb = this.qLayerBiases[l];
      for (let i = 0; i < qb.length; i++) {
        const v = qb[i];
        F64_FP_BUF[0] = v === 0 ? 0 : v;
        parts.push(
          `${U32_FP_VIEW[1].toString(36)}.${U32_FP_VIEW[0].toString(36)}`
        );
      }
    }
    const qbp = this.qBioParams;
    for (let i = 0; i < qbp.length; i++) {
      const v = qbp[i];
      F64_FP_BUF[0] = v === 0 ? 0 : v;
      parts.push(
        `${U32_FP_VIEW[1].toString(36)}.${U32_FP_VIEW[0].toString(36)}`
      );
    }
    return parts.join(',');
  }

  getActiveHybridExperts(): HybridExpertKind[] {
    if (this.architecture !== 'HYBRID_MOE') return [];
    const out: HybridExpertKind[] = [];
    for (let i = 0; i < 3; i++) {
      if (this.hybridActiveMask[i] === 1) {
        out.push(HYBRID_EXPERT_KINDS[i]);
      }
    }
    return out;
  }

  estimateFlopsPerFrame(): number {
    if (this.architecture === 'HYBRID_MOE') {
      return this.lastHybridFlops;
    }
    return estimateArchitectureFlops(
      this.hiddenLayers,
      this.inputNodes,
      this.architecture,
      this.architecture === 'PONDER_ACT'
        ? this.lastPonderSteps
        : this.reasoningSteps
    );
  }

  setHybridExpertMask(mask: readonly number[]): void {
    if (this.architecture !== 'HYBRID_MOE') return;
    for (let i = 0; i < 3; i++) {
      this.hybridActiveMask[i] = mask[i] ? 1 : 0;
    }
    this.lastHybridFlops = estimateArchitectureFlops(
      this.hiddenLayers,
      this.inputNodes,
      'HYBRID_MOE',
      this.reasoningSteps,
      this.getActiveHybridExperts()
    );
  }

  zeroInitHybridExpert(expertIdx: number): void {
    if (this.architecture !== 'HYBRID_MOE' || !this.hybridLayout) return;
    const ex = this.hybridLayout.experts[expertIdx];
    if (!ex) return;
    const lay = this.hybridLayout;
    const He = lay.expertHidden;
    const wScale = Math.sqrt(2 / (this.inputNodes + He));
    for (let i = 0; i < ex.wIHLen; i++) {
      this.bioParams[ex.wIHStart + i] = randn() * wScale;
    }
    for (let i = 0; i < ex.bHLen; i++) {
      this.bioParams[ex.bHStart + i] = randn() * 0.15;
    }
    // Strict Zero-Init on outgoing expert weights + alpha scalar -> <1e-12 function invariance at spawn!
    for (let i = 0; i < ex.wHOLen; i++) {
      this.bioParams[ex.wHOStart + i] = 0;
    }
    this.bioParams[ex.bOIdx] = 0;
    this.bioParams[ex.alphaIdx] = 0;
    if (ex.kind === 'LTC_FLY') {
      for (let j = 0; j < He; j++) {
        this.bioParams[ex.bioStart + j * 2] = randn() * 0.5 + 0.4;
        this.bioParams[ex.bioStart + j * 2 + 1] = randn() * 0.35;
      }
    } else if (ex.kind === 'SELECTIVE_SSM') {
      for (let j = 0; j < He; j++) {
        this.bioParams[ex.bioStart + j * 3] = randn() * 0.5;
        this.bioParams[ex.bioStart + j * 3 + 1] = 0.25;
        this.bioParams[ex.bioStart + j * 3 + 2] = randn() * 0.35;
      }
    } else {
      let p = ex.bioStart;
      const recScale = Math.sqrt(1 / He) * 0.6;
      for (let i = 0; i < He * He; i++) this.bioParams[p++] = randn() * recScale;
      for (let i = 0; i < He; i++) this.bioParams[p++] = randn() * 0.1;
      for (let i = 0; i < He; i++) this.bioParams[p++] = 0.4;
      for (let i = 0; i < He; i++) this.bioParams[p++] = randn() * 0.3;
      this.bioParams[p++] = -0.2;
    }
    this.setHybridExpertMask([
      expertIdx === 0 ? 1 : this.hybridActiveMask[0],
      expertIdx === 1 ? 1 : this.hybridActiveMask[1],
      expertIdx === 2 ? 1 : this.hybridActiveMask[2],
    ]);
    this.syncQuantizedCache();
  }

  private evalCoreMlpLogit(
    inputs: ArrayLike<number>,
    fast: boolean,
    recordActivations: boolean
  ): number {
    const inCount = this.inputNodes;
    const transitions = this.qLayerWeights.length;
    if (recordActivations) {
      const inAct = this.layerActivations[0];
      for (let i = 0; i < inCount; i++) inAct[i] = inputs[i] ?? 0;
    }
    if (transitions === 1) {
      const w0 = this.qLayerWeights[0];
      let sum = this.qLayerBiases[0][0];
      for (let i = 0; i < inCount; i++) sum += inputs[i] * w0[i];
      return sum;
    }
    const lastLayer = transitions - 1;
    for (let l = 0; l < lastLayer; l++) {
      const prevAct = l === 0 && !recordActivations ? inputs : this.layerActivations[l];
      const nextAct = this.layerActivations[l + 1];
      const w = this.qLayerWeights[l];
      const b = this.qLayerBiases[l];
      const prevLen = l === 0 ? inCount : prevAct.length;
      const nextLen = nextAct.length;
      for (let j = 0; j < nextLen; j++) {
        let sum = b[j];
        const off = j * prevLen;
        let i = 0;
        for (; i + 3 < prevLen; i += 4) {
          sum +=
            prevAct[i] * w[off + i] +
            prevAct[i + 1] * w[off + i + 1] +
            prevAct[i + 2] * w[off + i + 2] +
            prevAct[i + 3] * w[off + i + 3];
        }
        for (; i < prevLen; i++) sum += prevAct[i] * w[off + i];
        nextAct[j] = fast
          ? fastTanhCpu(sum)
          : sum > 19.5
            ? 1
            : sum < -19.5
              ? -1
              : Math.tanh(sum);
      }
    }
    const prevAct = this.layerActivations[lastLayer];
    const wOut = this.qLayerWeights[lastLayer];
    let outSum = this.qLayerBiases[lastLayer][0];
    for (let j = 0; j < prevAct.length; j++) outSum += prevAct[j] * wOut[j];
    return outSum;
  }

  private evalHybridMoe(
    inputs: ArrayLike<number>,
    fast: boolean,
    recordActivations: boolean
  ): number {
    const coreLogit = this.evalCoreMlpLogit(inputs, fast, recordActivations);
    const lay = this.hybridLayout;
    const mask = this.hybridActiveMask;
    if (!lay || (mask[0] | mask[1] | mask[2]) === 0) {
      this.lastHybridRouterWeights[0] = 1;
      this.lastHybridRouterWeights[1] = 0;
      this.lastHybridRouterWeights[2] = 0;
      this.lastHybridRouterWeights[3] = 0;
      this.lastPonderSteps = 1;
      this.lastHybridFlops = estimateArchitectureFlops(
        this.hiddenLayers,
        this.inputNodes,
        'MLP',
        1
      );
      if (recordActivations) {
        const prob = sigmoid(coreLogit);
        this.layerActivations[this.qLayerWeights.length][0] = prob;
        this.lastOutput = prob;
      }
      return coreLogit;
    }

    const qbp = this.qBioParams;
    const inCount = this.inputNodes;
    const He = lay.expertHidden;
    const st = this.neuronState;

    // 1. Lightweight context router across active experts
    let maxScore = -1e9;
    const scores = [0, -1e9, -1e9, -1e9];
    for (let m = 0; m < 4; m++) {
      if (m > 0 && mask[m - 1] === 0) continue;
      let s = qbp[lay.routerBStart + m];
      const off = lay.routerWStart + m * inCount;
      for (let i = 0; i < inCount; i++) {
        s += (inputs[i] ?? 0) * qbp[off + i];
      }
      if (s > 12) s = 12;
      else if (s < -12) s = -12;
      scores[m] = s;
      if (s > maxScore) maxScore = s;
    }
    let expSum = 0;
    const rw = this.lastHybridRouterWeights;
    for (let m = 0; m < 4; m++) {
      if (m > 0 && mask[m - 1] === 0) {
        rw[m] = 0;
      } else {
        const e = Math.exp(scores[m] - maxScore);
        rw[m] = e;
        expSum += e;
      }
    }
    const invSum = expSum > 0 ? 1 / expSum : 1;
    for (let m = 0; m < 4; m++) rw[m] *= invSum;

    let totalLogit = coreLogit;
    let frameFlops =
      estimateArchitectureFlops(this.hiddenLayers, inCount, 'MLP', 1) +
      inCount * 8 +
      16;

    // Expert 0: LTC_FLY
    if (mask[0] === 1) {
      const ex = lay.experts[0];
      const rates = this.bioRates;
      const omr = this.bioOneMinusRates;
      const aux0 = this.bioAux0;
      let exOut = qbp[ex.bOIdx];
      for (let j = 0; j < He; j++) {
        let sum = qbp[ex.bHStart + j];
        const off = ex.wIHStart + j * inCount;
        for (let i = 0; i < inCount; i++) sum += (inputs[i] ?? 0) * qbp[off + i];
        const prevH = st[j];
        const dIn = sum + aux0[j] * prevH;
        const act = fast
          ? fastTanhCpu(dIn)
          : dIn > 19.5
            ? 1
            : dIn < -19.5
              ? -1
              : Math.tanh(dIn);
        const nextH = omr[j] * prevH + rates[j] * act;
        st[j] = nextH;
        exOut += nextH * qbp[ex.wHOStart + j];
      }
      const rawA = qbp[ex.alphaIdx];
      const alpha = fast ? fastTanhCpu(rawA) : Math.tanh(rawA);
      totalLogit += alpha * rw[1] * exOut;
      frameFlops += (inCount * He + He) * 2 + He * 13;
    }

    // Expert 1: SELECTIVE_SSM (MinGRU)
    if (mask[1] === 1) {
      const ex = lay.experts[1];
      let exOut = qbp[ex.bOIdx];
      let gSum = 0;
      for (let j = 0; j < He; j++) {
        let sum = qbp[ex.bHStart + j];
        const off = ex.wIHStart + j * inCount;
        for (let i = 0; i < inCount; i++) sum += (inputs[i] ?? 0) * qbp[off + i];
        const sIdx = He + j;
        const pOff = ex.bioStart + j * 3;
        const prevH = st[sIdx];
        const gIn = qbp[pOff] * sum + qbp[pOff + 2] * prevH + qbp[pOff + 1];
        const z = fast ? fastSigmoidCpu(gIn) : sigmoid(gIn);
        const cand = fast
          ? fastTanhCpu(sum)
          : sum > 19.5
            ? 1
            : sum < -19.5
              ? -1
              : Math.tanh(sum);
        const nextH = (1 - z) * prevH + z * cand;
        st[sIdx] = nextH;
        gSum += z;
        exOut += nextH * qbp[ex.wHOStart + j];
      }
      this.lastSsmGateMean = gSum / He;
      const rawA = qbp[ex.alphaIdx];
      const alpha = fast ? fastTanhCpu(rawA) : Math.tanh(rawA);
      totalLogit += alpha * rw[2] * exOut;
      frameFlops += (inCount * He + He) * 2 + He * 18;
    }

    // Expert 2: PONDER_ACT (Adaptive System 1/2)
    if (mask[2] === 1) {
      const ex = lay.experts[2];
      const drive = this.reasoningScratchA;
      const nextH = this.reasoningScratchB;
      for (let j = 0; j < He; j++) {
        let sum = qbp[ex.bHStart + j];
        const off = ex.wIHStart + j * inCount;
        for (let i = 0; i < inCount; i++) sum += (inputs[i] ?? 0) * qbp[off + i];
        drive[j] = sum;
      }
      const maxK = Math.max(2, Math.min(3, this.reasoningSteps));
      const pOff = ex.bioStart;
      const bRecOff = pOff + He * He;
      const wHaltOff = bRecOff + He * 2;
      const bHalt = qbp[wHaltOff + He];
      const stBase = He * 2;
      let remain = 1.0;
      let cumHalt = 0.0;
      let exOutAcc = 0.0;
      let stepsUsed = maxK;

      for (let step = 0; step < maxK; step++) {
        for (let j = 0; j < He; j++) {
          let sum = drive[j] + qbp[bRecOff + j];
          const rOff = pOff + j * He;
          for (let i = 0; i < He; i++) sum += qbp[rOff + i] * st[stBase + i];
          const act = fast
            ? fastTanhCpu(sum)
            : sum > 19.5
              ? 1
              : sum < -19.5
                ? -1
                : Math.tanh(sum);
          nextH[j] =
            this.bioOneMinusRates[stBase + j] * st[stBase + j] +
            this.bioRates[stBase + j] * act;
        }
        for (let j = 0; j < He; j++) st[stBase + j] = nextH[j];

        let stepLogit = qbp[ex.bOIdx];
        for (let j = 0; j < He; j++) {
          stepLogit += st[stBase + j] * qbp[ex.wHOStart + j];
        }
        if (step === maxK - 1) {
          exOutAcc += remain * stepLogit;
          stepsUsed = maxK;
          break;
        }
        let hLogit = bHalt;
        for (let j = 0; j < He; j++) hLogit += qbp[wHaltOff + j] * st[stBase + j];
        const pHalt = fast ? fastSigmoidCpu(hLogit) : sigmoid(hLogit);
        const stepWeight = remain * pHalt;
        if (cumHalt + stepWeight >= 0.92) {
          exOutAcc += remain * stepLogit;
          stepsUsed = step + 1;
          break;
        }
        exOutAcc += stepWeight * stepLogit;
        cumHalt += stepWeight;
        remain -= stepWeight;
      }

      this.lastPonderSteps = stepsUsed;
      const rawA = qbp[ex.alphaIdx];
      const alpha = fast ? fastTanhCpu(rawA) : Math.tanh(rawA);
      totalLogit += alpha * rw[3] * exOutAcc;
      frameFlops += (inCount * He + He) * 2 + stepsUsed * (He * He * 2 + He * 11);
    } else {
      this.lastPonderSteps = 1;
    }

    this.lastHybridFlops = frameFlops;
    if (recordActivations) {
      const prob = sigmoid(totalLogit);
      this.layerActivations[this.qLayerWeights.length][0] = prob;
      this.lastOutput = prob;
    }
    return totalLogit;
  }

  /**
   * High-speed monomorphic CPU inference for bio-architectures during training rollouts.
   * Uses precomputed `bioRates` (zero Math.exp per tick), directly inlined `fastTanhCpu`
   * (no indirect call), 4x unrolled dot products, and zero-copy Depth-0 / Depth-1 fast paths.
   */
  private evalBioOutputLogitFast(inputs: ArrayLike<number>): number {
    const arch = this.architecture;
    if (arch === 'HYBRID_MOE') return this.evalHybridMoe(inputs, true, false);
    if (arch === 'DROSOPHILA_CONNECTOME') {
      return this.evalDrosophilaConnectome(inputs, true, false);
    }
    if (arch === 'DECOUPLED_FLY_CORTEX') {
      return this.evalDecoupledFlyCortex(inputs, true, false);
    }
    if (arch === 'NEUROCHEM_GATE') return this.evalNeurochemFast(inputs);
    if (arch === 'SYNAPTIC_STP') return this.evalSynapticStpFast(inputs);
    if (arch === 'LTC_FLY') return this.evalLtcFlyFast(inputs);
    if (arch === 'LOOPED_REASONER') return this.evalLoopedReasoner(inputs, true, false);
    if (arch === 'PONDER_ACT') return this.evalPonderAct(inputs, true, false);
    if (arch === 'SELECTIVE_SSM') return this.evalSelectiveSsm(inputs, true, false);
    if (arch === 'LATENT_ROLLOUT') return this.evalLatentRollout(inputs, true, false);
    return this.evalResidualSkipFast(inputs);
  }

  /**
   * 5) DROSOPHILA_CONNECTOME (Fruit-Fly Flight Connectome):
   * - Optic Lobe T4/T5 LTC leaky integrator hidden neurons
   * - Mushroom Body APL global lateral inhibition across each hidden layer
   * - Scalar Octopamine global arousal state o_t modulating synaptic & motor gain
   * - Giant Fiber (GF) linear sensory->motor escape reflex bypass
   */
  private evalDrosophilaConnectome(
    inputs: ArrayLike<number>,
    fast: boolean,
    recordActivations: boolean
  ): number {
    const inCount = this.inputNodes;
    const transitions = this.qLayerWeights.length;
    const st = this.neuronState;
    const qbp = this.qBioParams;
    const rates = this.bioRates;
    const omr = this.bioOneMinusRates;
    const aux0 = this.bioAux0;

    if (recordActivations) {
      const inAct = this.layerActivations[0];
      for (let i = 0; i < inCount; i++) inAct[i] = inputs[i] ?? 0;
    }

    let absInSum = 0;
    for (let i = 0; i < inCount; i++) {
      const v = inputs[i];
      absInSum += v < 0 ? -v : v;
    }
    const meanAbsIn = absInSum / inCount;

    const bioNodes = st.length - 1;
    const gfOff = bioNodes * 2;
    const tailOff = gfOff + (transitions > 1 ? inCount : 0);

    const oaDriveIn = qbp[tailOff + 2] * meanAbsIn;
    const oaAct = fast
      ? fastTanhCpu(oaDriveIn)
      : oaDriveIn > 19.5
        ? 1
        : oaDriveIn < -19.5
          ? -1
          : Math.tanh(oaDriveIn);
    const oaTone = omr[bioNodes] * st[bioNodes] + rates[bioNodes] * oaAct;
    st[bioNodes] = oaTone;
    const rawMod = 1 + qbp[tailOff + 3] * oaTone;
    const oaMod = rawMod < 0.25 ? 0.25 : rawMod > 2.25 ? 2.25 : rawMod;

    if (transitions === 1) {
      const w0 = this.qLayerWeights[0];
      let sum = this.qLayerBiases[0][0];
      for (let i = 0; i < inCount; i++) sum += inputs[i] * w0[i];
      const prevH = st[0];
      const dIn = sum * oaMod + aux0[0] * prevH;
      const act = fast
        ? fastTanhCpu(dIn)
        : dIn > 19.5
          ? 1
          : dIn < -19.5
            ? -1
            : Math.tanh(dIn);
      const nextH = omr[0] * prevH + rates[0] * act;
      st[0] = nextH;
      const outSum = nextH * 4.0;
      if (recordActivations) {
        const prob = sigmoid(outSum);
        this.layerActivations[1][0] = prob;
        this.lastOutput = prob;
      }
      return outSum;
    }

    const aplGamma = aux0[bioNodes];
    const lastLayer = transitions - 1;
    let bioIdx = 0;

    for (let l = 0; l < lastLayer; l++) {
      const prevAct =
        l === 0 && !recordActivations ? inputs : this.layerActivations[l];
      const nextAct = this.layerActivations[l + 1];
      const w = this.qLayerWeights[l];
      const b = this.qLayerBiases[l];
      const prevLen = l === 0 ? inCount : prevAct.length;
      const nextLen = nextAct.length;
      let layerSum = 0;

      for (let j = 0; j < nextLen; j++) {
        let sum = b[j];
        const off = j * prevLen;
        for (let i = 0; i < prevLen; i++) sum += prevAct[i] * w[off + i];
        const prevH = st[bioIdx];
        const dIn = sum * oaMod + aux0[bioIdx] * prevH;
        const act = fast
          ? fastTanhCpu(dIn)
          : dIn > 19.5
            ? 1
            : dIn < -19.5
              ? -1
              : Math.tanh(dIn);
        const nextH = omr[bioIdx] * prevH + rates[bioIdx] * act;
        st[bioIdx] = nextH;
        nextAct[j] = nextH;
        layerSum += nextH;
        bioIdx += 1;
      }

      const inh = aplGamma * (layerSum / nextLen);
      for (let j = 0; j < nextLen; j++) {
        const v = nextAct[j] - inh;
        nextAct[j] = v < -1 ? -1 : v > 1 ? 1 : v;
      }
    }

    const lastHiddenAct = this.layerActivations[lastLayer];
    const wOut = this.qLayerWeights[lastLayer];
    let outSum = this.qLayerBiases[lastLayer][0];
    for (let j = 0; j < lastHiddenAct.length; j++) {
      outSum += lastHiddenAct[j] * wOut[j];
    }
    outSum *= oaMod;
    for (let i = 0; i < inCount; i++) {
      outSum += inputs[i] * qbp[gfOff + i];
    }

    if (recordActivations) {
      const prob = sigmoid(outSum);
      this.layerActivations[transitions][0] = prob;
      this.lastOutput = prob;
    }
    return outSum;
  }

  /**
   * 6) DECOUPLED_FLY_CORTEX (Decoupled Reasoning Core vs External FlyHash APL Associative Knowledge Bank):
   * - Executive Reasoning Core: Giant Fiber 0-lag linear reflex + T4/T5 LTC hidden controller + Surprise S1/S2 Gate
   * - External Knowledge Bank: 16-slot FlyHash APL sparse Winner-Take-Most associative memory addressed in O(1)
   * - Online Lifetime Dopamine Plasticity: real-time 3-factor eligibility trace updates on active memory slots
   */
  private evalDecoupledFlyCortex(
    inputs: ArrayLike<number>,
    fast: boolean,
    recordActivations: boolean
  ): number {
    const inCount = this.inputNodes;
    const transitions = this.qLayerWeights.length;
    const st = this.neuronState;
    const qbp = this.qBioParams;
    const rates = this.bioRates;
    const omr = this.bioOneMinusRates;
    const aux0 = this.bioAux0;

    if (recordActivations) {
      const inAct = this.layerActivations[0];
      for (let i = 0; i < inCount; i++) inAct[i] = inputs[i] ?? 0;
    }

    let absInSum = 0;
    for (let i = 0; i < inCount; i++) {
      const v = inputs[i];
      absInSum += v < 0 ? -v : v;
    }
    const meanAbsIn = absInSum / inCount;

    const bioNodes = Math.max(1, this.hiddenNodes);
    const gfLen = transitions > 1 ? inCount : 0;
    const gfOff = bioNodes * 2;
    const memOff = gfOff + gfLen;
    const tailOff = memOff + 16;
    const memStateOff = bioNodes + 1;
    const eligStateOff = bioNodes + 17;

    const aplGamma = fast
      ? 0.45 * fastSigmoidCpu(qbp[tailOff])
      : aux0[bioNodes];
    const memBeta = fast
      ? 1.8 * fastTanhCpu(qbp[tailOff + 1])
      : aux0[bioNodes + 1];
    const s2Thresh = fast
      ? 0.18 + 0.45 * fastSigmoidCpu(qbp[tailOff + 2])
      : aux0[bioNodes + 2];
    const oaGain = fast
      ? 0.35 + 0.85 * fastSigmoidCpu(qbp[tailOff + 3])
      : aux0[bioNodes + 3];

    const prevArousal = st[bioNodes];
    const oaIn = oaGain * meanAbsIn;
    const oaAct = fast
      ? fastTanhCpu(oaIn)
      : oaIn > 19.5
        ? 1
        : oaIn < -19.5
          ? -1
          : Math.tanh(oaIn);
    const oaTone = 0.78 * prevArousal + 0.22 * oaAct;
    st[bioNodes] = oaTone;
    const rawMod = 1 + 0.65 * oaTone;
    const oaMod = rawMod < 0.35 ? 0.35 : rawMod > 2.15 ? 2.15 : rawMod;

    // O(1) FlyHash APL Sparse Associative Knowledge Addressing (16 Kenyon slots, Top-2 Winner-Take-Most)
    let bestScore1 = -1e9;
    let bestScore2 = -1e9;
    let slot1 = 0;
    let slot2 = 1;
    for (let s = 0; s < 16; s++) {
      const i0 = (s * 3) % inCount;
      const i1 = (s * 5 + 1) % inCount;
      const i2 = (s * 7 + 2) % inCount;
      const s0 = (s & 1) === 0 ? 1 : -1;
      const s1 = (s & 2) === 0 ? 1 : -1;
      const s2 = (s & 4) === 0 ? 1 : -1;
      const score =
        s0 * inputs[i0] + 0.75 * s1 * inputs[i1] + 0.5 * s2 * inputs[i2];
      if (score > bestScore1) {
        bestScore2 = bestScore1;
        slot2 = slot1;
        bestScore1 = score;
        slot1 = s;
      } else if (score > bestScore2) {
        bestScore2 = score;
        slot2 = s;
      }
    }
    const diffScaled = (bestScore1 - bestScore2) * 2.5;
    const expDiff = fast ? fastSigmoidCpu(diffScaled) : sigmoid(diffScaled);
    const w1 = 0.5 + 0.45 * expDiff;
    const w2 = 1.0 - w1;
    this.lastActiveSlots = [slot1, slot2];
    this.lastSlotWeights = [w1, w2];

    // Decay all 16 eligibility traces and boost Top-2 active Kenyon slots
    for (let s = 0; s < 16; s++) {
      st[eligStateOff + s] *= 0.84;
    }
    st[eligStateOff + slot1] = Math.min(2.0, st[eligStateOff + slot1] + w1);
    st[eligStateOff + slot2] = Math.min(2.0, st[eligStateOff + slot2] + w2);

    const memVal1 =
      this.onlineUpdatesCount > 0 ? st[memStateOff + slot1] : qbp[memOff + slot1];
    const memVal2 =
      this.onlineUpdatesCount > 0 ? st[memStateOff + slot2] : qbp[memOff + slot2];
    const memReadout = w1 * memVal1 + w2 * memVal2;
    this.lastMemoryReadout = memReadout;
    this.lastRolloutAdvantage = memReadout;
    this.lastSsmGateMean = w1;

    if (transitions === 1) {
      const w0 = this.qLayerWeights[0];
      let sum = this.qLayerBiases[0][0];
      for (let i = 0; i < inCount; i++) sum += inputs[i] * w0[i];
      const a = fast ? fastSigmoidCpu(qbp[0]) : rates[0];
      const prevH = st[0];
      const dIn = sum * oaMod + qbp[1] * prevH + memBeta * memReadout;
      const act = fast
        ? fastTanhCpu(dIn)
        : dIn > 19.5
          ? 1
          : dIn < -19.5
            ? -1
            : Math.tanh(dIn);
      const nh = (1 - a) * prevH + a * act;
      st[0] = nh;
      const flux = nh >= prevH ? nh - prevH : prevH - nh;
      const s2 = flux > s2Thresh;
      this.lastSurpriseLevel = flux;
      this.lastSystem2Active = s2;
      this.lastPonderSteps = s2 ? 2 : 1;
      const outSum = nh * 4.0;
      if (recordActivations) {
        const prob = sigmoid(outSum);
        this.layerActivations[1][0] = prob;
        this.lastOutput = prob;
      }
      return outSum;
    }

    const lastLayer = transitions - 1;
    let bioIdx = 0;
    let fluxSum = 0;

    for (let l = 0; l < lastLayer; l++) {
      const prevAct =
        l === 0 && !recordActivations ? inputs : this.layerActivations[l];
      const nextAct = this.layerActivations[l + 1];
      const w = this.qLayerWeights[l];
      const b = this.qLayerBiases[l];
      const prevLen = l === 0 ? inCount : prevAct.length;
      const nextLen = nextAct.length;
      let layerSum = 0;

      for (let j = 0; j < nextLen; j++) {
        let sum = b[j];
        const off = j * prevLen;
        for (let i = 0; i < prevLen; i++) sum += prevAct[i] * w[off + i];
        const a = fast ? fastSigmoidCpu(qbp[bioIdx * 2]) : rates[bioIdx];
        const prevH = st[bioIdx];
        const dIn = sum * oaMod + qbp[bioIdx * 2 + 1] * prevH;
        const act = fast
          ? fastTanhCpu(dIn)
          : dIn > 19.5
            ? 1
            : dIn < -19.5
              ? -1
              : Math.tanh(dIn);
        const nh = (1 - a) * prevH + a * act;
        const df = nh >= prevH ? nh - prevH : prevH - nh;
        fluxSum += df;
        st[bioIdx] = nh;
        nextAct[j] = nh;
        layerSum += nh;
        bioIdx += 1;
      }

      const inh = aplGamma * (layerSum / nextLen);
      for (let j = 0; j < nextLen; j++) {
        const v = nextAct[j] - inh;
        nextAct[j] = v < -1 ? -1 : v > 1 ? 1 : v;
      }
    }

    const surprise = fluxSum / bioNodes + 0.35 * meanAbsIn;
    const s2 = surprise >= s2Thresh;
    this.lastSurpriseLevel = surprise;
    this.lastSystem2Active = s2;
    this.lastPonderSteps = s2 ? 2 : 1;

    const lastHiddenAct = this.layerActivations[lastLayer];
    const lastD = lastHiddenAct.length;
    if (s2) {
      const lastCur = bioIdx - lastD;
      for (let j = 0; j < lastD; j++) {
        const si = lastCur + j;
        const a = fast ? fastSigmoidCpu(qbp[si * 2]) : rates[si];
        const recW = qbp[si * 2 + 1];
        const rIn =
          lastHiddenAct[j] * (1 + recW) + 0.35 * memBeta * memReadout;
        const rAct = fast
          ? fastTanhCpu(rIn)
          : rIn > 19.5
            ? 1
            : rIn < -19.5
              ? -1
              : Math.tanh(rIn);
        const refined = (1 - 0.5 * a) * lastHiddenAct[j] + 0.5 * a * rAct;
        lastHiddenAct[j] = refined;
        st[si] = refined;
      }
    }

    const wOut = this.qLayerWeights[lastLayer];
    let outSum = this.qLayerBiases[lastLayer][0];
    for (let j = 0; j < lastD; j++) {
      outSum += lastHiddenAct[j] * wOut[j];
    }
    outSum = outSum * oaMod + memBeta * memReadout;
    for (let i = 0; i < inCount; i++) {
      outSum += inputs[i] * qbp[gfOff + i];
    }

    if (recordActivations) {
      const prob = sigmoid(outSum);
      this.layerActivations[transitions][0] = prob;
      this.lastOutput = prob;
    }
    return outSum;
  }

  /**
   * Three-factor Dopamine lifetime synaptic plasticity update:
   * ΔM[s] = η_DA * δ_DA(t) * eligibility_s(t)
   * Updates the decoupled associative skill memory bank online during flight without destabilizing the executive core.
   */
  applyOnlineDopaminePlasticity(
    dopamineSignal: number,
    consolidateToGenome = false
  ): void {
    const clampedDa =
      dopamineSignal < -1 ? -1 : dopamineSignal > 1 ? 1 : dopamineSignal;
    this.lastDopamineSignal = clampedDa;
    if (Math.abs(clampedDa) < 1e-4) return;

    if (this.architecture === 'DECOUPLED_FLY_CORTEX') {
      const bioNodes = Math.max(1, this.hiddenNodes);
      const memStateOff = bioNodes + 1;
      const eligStateOff = bioNodes + 17;
      const lr = 0.035;
      const st = this.neuronState;
      const memParamOff =
        bioNodes * 2 + (this.hiddenLayers.length > 0 ? this.inputNodes : 0);

      for (let s = 0; s < 16; s++) {
        const elig = st[eligStateOff + s];
        if (elig > 0.02) {
          const delta = lr * clampedDa * elig;
          let nextVal = st[memStateOff + s] + delta;
          if (nextVal < -3.5) nextVal = -3.5;
          else if (nextVal > 3.5) nextVal = 3.5;
          st[memStateOff + s] = nextVal;
          if (consolidateToGenome && this.weightPrecision === 'FP32') {
            const gVal = this.bioParams[memParamOff + s] + delta * 0.15;
            this.bioParams[memParamOff + s] =
              gVal < -3.5 ? -3.5 : gVal > 3.5 ? 3.5 : gVal;
          }
        }
      }
      this.onlineUpdatesCount += 1;
      return;
    }

    // Fallback lightweight motor-readout plasticity when enabled on other architectures
    const transitions = this.qLayerWeights.length;
    const lastLayer = transitions - 1;
    const wOut = this.qLayerWeights[lastLayer];
    const prevAct = this.layerActivations[lastLayer];
    const lr = 0.008 * clampedDa;
    for (let j = 0; j < wOut.length && j < prevAct.length; j++) {
      const nextW = wOut[j] + lr * prevAct[j];
      wOut[j] = nextW < -4 ? -4 : nextW > 4 ? 4 : nextW;
    }
    this.onlineUpdatesCount += 1;
  }

  /**
   * Computes sensory drive vector u ∈ R^H for the final hidden layer (or scalar u[0] on Depth 0).
   */
  private computeEncoderDrive(
    inputs: ArrayLike<number>,
    outDrive: Float64Array,
    fast: boolean,
    recordActivations: boolean
  ): void {
    const inCount = this.inputNodes;
    const transitions = this.qLayerWeights.length;
    if (recordActivations) {
      const inAct = this.layerActivations[0];
      for (let i = 0; i < inCount; i++) inAct[i] = inputs[i] ?? 0;
    }
    if (transitions === 1) {
      // Depth 0: linear drive directly into 1-unit latent state
      const w0 = this.qLayerWeights[0];
      let sum = this.qLayerBiases[0][0];
      for (let i = 0; i < inCount; i++) sum += inputs[i] * w0[i];
      outDrive[0] = sum;
      return;
    }
    const lastHiddenLayer = transitions - 1;
    // Intermediate hidden layers (if Depth >= 2)
    for (let l = 0; l < lastHiddenLayer - 1; l++) {
      const prevAct = l === 0 && !recordActivations ? inputs : this.layerActivations[l];
      const nextAct = this.layerActivations[l + 1];
      const w = this.qLayerWeights[l];
      const b = this.qLayerBiases[l];
      const prevLen = l === 0 ? inCount : prevAct.length;
      const nextLen = nextAct.length;
      for (let j = 0; j < nextLen; j++) {
        let sum = b[j];
        const off = j * prevLen;
        for (let i = 0; i < prevLen; i++) sum += prevAct[i] * w[off + i];
        nextAct[j] = fast
          ? fastTanhCpu(sum)
          : sum > 19.5
            ? 1
            : sum < -19.5
              ? -1
              : Math.tanh(sum);
      }
    }
    // Final hidden pre-activation drive -> outDrive
    const encLayer = lastHiddenLayer - 1;
    const prevAct =
      encLayer === 0 && !recordActivations ? inputs : this.layerActivations[encLayer];
    const prevLen = encLayer === 0 ? inCount : prevAct.length;
    const w = this.qLayerWeights[encLayer];
    const b = this.qLayerBiases[encLayer];
    const H = outDrive.length;
    for (let j = 0; j < H; j++) {
      let sum = b[j];
      const off = j * prevLen;
      let i = 0;
      for (; i + 3 < prevLen; i += 4) {
        sum +=
          prevAct[i] * w[off + i] +
          prevAct[i + 1] * w[off + i + 1] +
          prevAct[i + 2] * w[off + i + 2] +
          prevAct[i + 3] * w[off + i + 3];
      }
      for (; i < prevLen; i++) sum += prevAct[i] * w[off + i];
      outDrive[j] = sum;
    }
  }

  /**
   * 1) LOOPED_REASONER (Universal Transformer / Recurrent-Depth Latent CoT):
   * Runs K weight-tied recursive refinement steps per tick on the compact latent state.
   */
  private evalLoopedReasoner(
    inputs: ArrayLike<number>,
    fast: boolean,
    recordActivations: boolean
  ): number {
    const H = this.neuronState.length;
    const drive = this.reasoningScratchA;
    const nextH = this.reasoningScratchB;
    this.computeEncoderDrive(inputs, drive, fast, recordActivations);

    const h = this.neuronState;
    const qbp = this.qBioParams;
    const rates = this.bioRates;
    const omr = this.bioOneMinusRates;
    const bRecOff = H * H;
    const K = this.reasoningSteps;

    for (let step = 0; step < K; step++) {
      for (let j = 0; j < H; j++) {
        let sum = drive[j] + qbp[bRecOff + j];
        const row = j * H;
        for (let i = 0; i < H; i++) {
          sum += qbp[row + i] * h[i];
        }
        const act = fast
          ? fastTanhCpu(sum)
          : sum > 19.5
            ? 1
            : sum < -19.5
              ? -1
              : Math.tanh(sum);
        nextH[j] = omr[j] * h[j] + rates[j] * act;
      }
      for (let j = 0; j < H; j++) h[j] = nextH[j];
    }

    this.lastPonderSteps = K;
    const transitions = this.qLayerWeights.length;
    let outSum = 0;
    if (transitions === 1) {
      outSum = h[0] * 4.0;
    } else {
      const lastHiddenAct = this.layerActivations[transitions - 1];
      if (recordActivations) {
        for (let j = 0; j < H; j++) lastHiddenAct[j] = h[j];
      }
      const wOut = this.qLayerWeights[transitions - 1];
      outSum = this.qLayerBiases[transitions - 1][0];
      for (let j = 0; j < H; j++) outSum += h[j] * wOut[j];
    }

    if (recordActivations) {
      const prob = sigmoid(outSum);
      this.layerActivations[transitions][0] = prob;
      this.lastOutput = prob;
    }
    return outSum;
  }

  /**
   * 2) PONDER_ACT (Adaptive Computation Time / PonderNet — System 1 vs System 2):
   * Weight-tied recursive refinement with learned Halting Gate & true early-exit.
   */
  private evalPonderAct(
    inputs: ArrayLike<number>,
    fast: boolean,
    recordActivations: boolean
  ): number {
    const H = this.neuronState.length;
    const drive = this.reasoningScratchA;
    const nextH = this.reasoningScratchB;
    this.computeEncoderDrive(inputs, drive, fast, recordActivations);

    const h = this.neuronState;
    const qbp = this.qBioParams;
    const rates = this.bioRates;
    const omr = this.bioOneMinusRates;
    const bRecOff = H * H;
    const wHaltOff = H * H + H * 2;
    const bHalt = qbp[wHaltOff + H];
    const maxK = Math.max(2, this.reasoningSteps);
    const transitions = this.qLayerWeights.length;
    const wOut = transitions > 1 ? this.qLayerWeights[transitions - 1] : null;
    const bOut = transitions > 1 ? this.qLayerBiases[transitions - 1][0] : 0;

    let remain = 1.0;
    let cumHalt = 0.0;
    let outAcc = 0.0;
    let stepsUsed = maxK;

    for (let step = 0; step < maxK; step++) {
      let fluxSum = 0;
      for (let j = 0; j < H; j++) {
        let sum = drive[j] + qbp[bRecOff + j];
        const row = j * H;
        for (let i = 0; i < H; i++) {
          sum += qbp[row + i] * h[i];
        }
        const act = fast
          ? fastTanhCpu(sum)
          : sum > 19.5
            ? 1
            : sum < -19.5
              ? -1
              : Math.tanh(sum);
        const nh = omr[j] * h[j] + rates[j] * act;
        const diff = nh - h[j];
        fluxSum += diff < 0 ? -diff : diff;
        nextH[j] = nh;
      }
      for (let j = 0; j < H; j++) h[j] = nextH[j];

      let stepLogit = bOut;
      if (wOut) {
        for (let j = 0; j < H; j++) stepLogit += h[j] * wOut[j];
      } else {
        stepLogit = h[0] * 4.0;
      }

      if (step === maxK - 1) {
        outAcc += remain * stepLogit;
        stepsUsed = maxK;
        break;
      }

      const meanFlux = fluxSum / H;
      this.lastSurpriseLevel = meanFlux;
      // Surprise-modulated Halting Gate: calm low-flux flight halts at K=1 (S1); high sensory surprise wakes up K=2..maxK (S2)
      let haltLogit = bHalt + 1.35 - 3.2 * meanFlux;
      for (let j = 0; j < H; j++) haltLogit += qbp[wHaltOff + j] * h[j];
      const pHalt = fast ? fastSigmoidCpu(haltLogit) : sigmoid(haltLogit);
      const stepWeight = remain * pHalt;
      if (cumHalt + stepWeight >= 0.68) {
        outAcc += remain * stepLogit;
        stepsUsed = step + 1;
        break;
      }
      outAcc += stepWeight * stepLogit;
      cumHalt += stepWeight;
      remain -= stepWeight;
    }

    this.lastPonderSteps = stepsUsed;
    if (recordActivations) {
      if (transitions > 1) {
        const lastHiddenAct = this.layerActivations[transitions - 1];
        for (let j = 0; j < H; j++) lastHiddenAct[j] = h[j];
      }
      const prob = sigmoid(outAcc);
      this.layerActivations[transitions][0] = prob;
      this.lastOutput = prob;
    }
    return outAcc;
  }

  /**
   * 3) SELECTIVE_SSM (Micro-Mamba / MinGRU Selective State Space):
   * Input- and state-dependent selective gate z_t = σ(s*u + m*h + b) per neuron.
   */
  private evalSelectiveSsm(
    inputs: ArrayLike<number>,
    fast: boolean,
    recordActivations: boolean
  ): number {
    const inCount = this.inputNodes;
    const transitions = this.qLayerWeights.length;
    const st = this.neuronState;
    const gScale = this.bioRates;
    const gBias = this.bioAux0;
    const sMix = this.bioAux1;

    if (recordActivations) {
      const inAct = this.layerActivations[0];
      for (let i = 0; i < inCount; i++) inAct[i] = inputs[i] ?? 0;
    }

    if (transitions === 1) {
      const w0 = this.qLayerWeights[0];
      let sum = this.qLayerBiases[0][0];
      for (let i = 0; i < inCount; i++) sum += inputs[i] * w0[i];
      const prevH = st[0];
      const gateIn = gScale[0] * sum + sMix[0] * prevH + gBias[0];
      const z = fast ? fastSigmoidCpu(gateIn) : sigmoid(gateIn);
      const cand = fast
        ? fastTanhCpu(sum)
        : sum > 19.5
          ? 1
          : sum < -19.5
            ? -1
            : Math.tanh(sum);
      const nextH = (1 - z) * prevH + z * cand;
      st[0] = nextH;
      this.lastSsmGateMean = z;
      const outSum = nextH * 4.0;
      if (recordActivations) {
        const prob = sigmoid(outSum);
        this.layerActivations[1][0] = prob;
        this.lastOutput = prob;
      }
      return outSum;
    }

    const lastLayer = transitions - 1;
    let bioIdx = 0;
    let gateSum = 0;

    for (let l = 0; l < lastLayer; l++) {
      const prevAct =
        l === 0 && !recordActivations ? inputs : this.layerActivations[l];
      const nextAct = this.layerActivations[l + 1];
      const w = this.qLayerWeights[l];
      const b = this.qLayerBiases[l];
      const prevLen = l === 0 ? inCount : prevAct.length;
      const nextLen = nextAct.length;

      for (let j = 0; j < nextLen; j++) {
        let sum = b[j];
        const off = j * prevLen;
        let i = 0;
        for (; i + 3 < prevLen; i += 4) {
          sum +=
            prevAct[i] * w[off + i] +
            prevAct[i + 1] * w[off + i + 1] +
            prevAct[i + 2] * w[off + i + 2] +
            prevAct[i + 3] * w[off + i + 3];
        }
        for (; i < prevLen; i++) sum += prevAct[i] * w[off + i];

        const prevH = st[bioIdx];
        const gateIn = gScale[bioIdx] * sum + sMix[bioIdx] * prevH + gBias[bioIdx];
        const z = fast ? fastSigmoidCpu(gateIn) : sigmoid(gateIn);
        const cand = fast
          ? fastTanhCpu(sum)
          : sum > 19.5
            ? 1
            : sum < -19.5
              ? -1
              : Math.tanh(sum);
        const nextH = (1 - z) * prevH + z * cand;
        st[bioIdx] = nextH;
        nextAct[j] = nextH;
        gateSum += z;
        bioIdx += 1;
      }
    }

    this.lastSsmGateMean = bioIdx > 0 ? gateSum / bioIdx : 0.5;

    const prevAct = this.layerActivations[lastLayer];
    const wOut = this.qLayerWeights[lastLayer];
    let outSum = this.qLayerBiases[lastLayer][0];
    for (let j = 0; j < prevAct.length; j++) outSum += prevAct[j] * wOut[j];

    if (recordActivations) {
      const prob = sigmoid(outSum);
      this.layerActivations[transitions][0] = prob;
      this.lastOutput = prob;
    }
    return outSum;
  }

  /**
   * 4) LATENT_ROLLOUT (World-Model / Counterfactual Dual-Branch Imagination):
   * Imagines 2-step future states for both JUMP (+a) and WAIT (-a) using a shared
   * latent transition model, then selects the higher-value imagined future ΔV.
   */
  private evalLatentRollout(
    inputs: ArrayLike<number>,
    fast: boolean,
    recordActivations: boolean
  ): number {
    const H = this.neuronState.length;
    const drive = this.reasoningScratchA;
    const sJump = this.reasoningScratchB;
    const sWait = this.reasoningScratchC;
    this.computeEncoderDrive(inputs, drive, fast, recordActivations);

    const sCur = this.neuronState;
    const qbp = this.qBioParams;
    const wActOff = H * H;
    const bDynOff = H * H + H;
    const wValOff = H * H + H * 2;
    const transitions = this.qLayerWeights.length;
    const wOut = transitions > 1 ? this.qLayerWeights[transitions - 1] : null;
    const bOut = transitions > 1 ? this.qLayerBiases[transitions - 1][0] : 0;

    // Anchor latent world state with current sensory observation
    for (let j = 0; j < H; j++) {
      const obs = fast
        ? fastTanhCpu(drive[j])
        : drive[j] > 19.5
          ? 1
          : drive[j] < -19.5
            ? -1
            : Math.tanh(drive[j]);
      sCur[j] = 0.45 * sCur[j] + 0.55 * obs;
    }

    // Step 1 imagination: counterfactual JUMP (+w_act) vs WAIT (-w_act)
    let vJump = 0;
    let vWait = 0;
    for (let j = 0; j < H; j++) {
      let base = qbp[bDynOff + j];
      const row = j * H;
      for (let i = 0; i < H; i++) base += qbp[row + i] * sCur[i];
      const actShift = qbp[wActOff + j];
      const inJ = base + actShift;
      const inW = base - actShift;
      const j1 = fast
        ? fastTanhCpu(inJ)
        : inJ > 19.5
          ? 1
          : inJ < -19.5
            ? -1
            : Math.tanh(inJ);
      const w1 = fast
        ? fastTanhCpu(inW)
        : inW > 19.5
          ? 1
          : inW < -19.5
            ? -1
            : Math.tanh(inW);
      sJump[j] = j1;
      sWait[j] = w1;
      const immediateW = wOut ? wOut[j] : 1.0;
      vJump += j1 * immediateW;
      vWait += w1 * immediateW;
    }

    // Step 2 imagination: coasting follow-through scored by shared Value Head V(s_2)
    for (let j = 0; j < H; j++) {
      let sumJ = qbp[bDynOff + j] - 0.5 * qbp[wActOff + j];
      let sumW = qbp[bDynOff + j] - 0.5 * qbp[wActOff + j];
      const row = j * H;
      for (let i = 0; i < H; i++) {
        const wDyn = qbp[row + i];
        sumJ += wDyn * sJump[i];
        sumW += wDyn * sWait[i];
      }
      const j2 = fast
        ? fastTanhCpu(sumJ)
        : sumJ > 19.5
          ? 1
          : sumJ < -19.5
            ? -1
            : Math.tanh(sumJ);
      const w2 = fast
        ? fastTanhCpu(sumW)
        : sumW > 19.5
          ? 1
          : sumW < -19.5
            ? -1
            : Math.tanh(sumW);
      const valW = qbp[wValOff + j];
      vJump += j2 * valW;
      vWait += w2 * valW;
    }

    const advantage = vJump - vWait;
    this.lastRolloutAdvantage = advantage;
    const outSum = advantage + bOut;

    // Commit chosen counterfactual branch into persistent world state
    const chosen = outSum > 0 ? sJump : sWait;
    for (let j = 0; j < H; j++) sCur[j] = chosen[j];

    if (recordActivations) {
      if (transitions > 1) {
        const lastHiddenAct = this.layerActivations[transitions - 1];
        for (let j = 0; j < H; j++) lastHiddenAct[j] = chosen[j];
      }
      const prob = sigmoid(outSum);
      this.layerActivations[transitions][0] = prob;
      this.lastOutput = prob;
    }
    return outSum;
  }

  private evalResidualSkipFast(inputs: ArrayLike<number>): number {
    const transitions = this.qLayerWeights.length;
    const inCount = this.inputNodes;
    const qbp = this.qBioParams;

    // Depth 0: identical to linear MLP (no skip params)
    if (transitions === 1) {
      const w0 = this.qLayerWeights[0];
      let sum = this.qLayerBiases[0][0];
      let i = 0;
      for (; i + 3 < inCount; i += 4) {
        sum +=
          inputs[i] * w0[i] +
          inputs[i + 1] * w0[i + 1] +
          inputs[i + 2] * w0[i + 2] +
          inputs[i + 3] * w0[i + 3];
      }
      for (; i < inCount; i++) sum += inputs[i] * w0[i];
      return sum;
    }

    // Depth 1 zero-copy fast path
    if (transitions === 2) {
      const w0 = this.qLayerWeights[0];
      const b0 = this.qLayerBiases[0];
      const w1 = this.qLayerWeights[1];
      const hLen = b0.length;
      let outSum = this.qLayerBiases[1][0];
      for (let j = 0; j < hLen; j++) {
        let sum = b0[j];
        const offset = j * inCount;
        let i = 0;
        for (; i + 3 < inCount; i += 4) {
          sum +=
            inputs[i] * w0[offset + i] +
            inputs[i + 1] * w0[offset + i + 1] +
            inputs[i + 2] * w0[offset + i + 2] +
            inputs[i + 3] * w0[offset + i + 3];
        }
        for (; i < inCount; i++) sum += inputs[i] * w0[offset + i];
        outSum += fastTanhCpu(sum) * w1[j];
      }
      for (let i = 0; i < inCount; i++) {
        outSum += inputs[i] * qbp[i];
      }
      return outSum;
    }

    // Multi-layer (Depth >= 2): read layer 0 directly from inputs (zero-copy)
    const lastLayer = transitions - 1;
    for (let l = 0; l < lastLayer; l++) {
      const prevAct = l === 0 ? inputs : this.layerActivations[l];
      const nextAct = this.layerActivations[l + 1];
      const w = this.qLayerWeights[l];
      const b = this.qLayerBiases[l];
      const prevLen = l === 0 ? inCount : prevAct.length;
      const nextLen = nextAct.length;
      for (let j = 0; j < nextLen; j++) {
        let sum = b[j];
        const offset = j * prevLen;
        let i = 0;
        for (; i + 3 < prevLen; i += 4) {
          sum +=
            prevAct[i] * w[offset + i] +
            prevAct[i + 1] * w[offset + i + 1] +
            prevAct[i + 2] * w[offset + i + 2] +
            prevAct[i + 3] * w[offset + i + 3];
        }
        for (; i < prevLen; i++) sum += prevAct[i] * w[offset + i];
        nextAct[j] = fastTanhCpu(sum);
      }
    }

    const prevAct = this.layerActivations[lastLayer];
    const wOut = this.qLayerWeights[lastLayer];
    const prevLen = prevAct.length;
    let outSum = this.qLayerBiases[lastLayer][0];
    let i = 0;
    for (; i + 3 < prevLen; i += 4) {
      outSum +=
        prevAct[i] * wOut[i] +
        prevAct[i + 1] * wOut[i + 1] +
        prevAct[i + 2] * wOut[i + 2] +
        prevAct[i + 3] * wOut[i + 3];
    }
    for (; i < prevLen; i++) outSum += prevAct[i] * wOut[i];
    for (let k = 0; k < inCount; k++) outSum += inputs[k] * qbp[k];
    return outSum;
  }

  private evalLtcFlyFast(inputs: ArrayLike<number>): number {
    const transitions = this.qLayerWeights.length;
    const inCount = this.inputNodes;
    const rates = this.bioRates;
    const omr = this.bioOneMinusRates;
    const rec = this.bioAux0;
    const st = this.neuronState;

    // Depth 0 membrane on output neuron
    if (transitions === 1) {
      const w0 = this.qLayerWeights[0];
      let outSum = this.qLayerBiases[0][0];
      for (let i = 0; i < inCount; i++) outSum += inputs[i] * w0[i];
      const prevH = st[0];
      const nextH = omr[0] * prevH + rates[0] * fastTanhCpu(outSum + rec[0] * prevH);
      st[0] = nextH;
      return nextH * 4.0;
    }

    // Depth 1 zero-copy fast path
    if (transitions === 2) {
      const w0 = this.qLayerWeights[0];
      const b0 = this.qLayerBiases[0];
      const w1 = this.qLayerWeights[1];
      const hLen = b0.length;
      let outSum = this.qLayerBiases[1][0];
      for (let j = 0; j < hLen; j++) {
        let sum = b0[j];
        const offset = j * inCount;
        let i = 0;
        for (; i + 3 < inCount; i += 4) {
          sum +=
            inputs[i] * w0[offset + i] +
            inputs[i + 1] * w0[offset + i + 1] +
            inputs[i + 2] * w0[offset + i + 2] +
            inputs[i + 3] * w0[offset + i + 3];
        }
        for (; i < inCount; i++) sum += inputs[i] * w0[offset + i];
        const prevH = st[j];
        const nextH = omr[j] * prevH + rates[j] * fastTanhCpu(sum + rec[j] * prevH);
        st[j] = nextH;
        outSum += nextH * w1[j];
      }
      return outSum;
    }

    // Depth 2 zero-copy fused fast path (e.g. 4->4->4->1, 5->8->4->1): skips writing layer 2 buffer!
    if (transitions === 3) {
      const w0 = this.qLayerWeights[0];
      const b0 = this.qLayerBiases[0];
      const h0Len = b0.length;
      const a1 = this.layerActivations[1];
      for (let j = 0; j < h0Len; j++) {
        let sum = b0[j];
        const offset = j * inCount;
        let i = 0;
        for (; i + 3 < inCount; i += 4) {
          sum +=
            inputs[i] * w0[offset + i] +
            inputs[i + 1] * w0[offset + i + 1] +
            inputs[i + 2] * w0[offset + i + 2] +
            inputs[i + 3] * w0[offset + i + 3];
        }
        for (; i < inCount; i++) sum += inputs[i] * w0[offset + i];
        const prevH = st[j];
        const nextH = omr[j] * prevH + rates[j] * fastTanhCpu(sum + rec[j] * prevH);
        st[j] = nextH;
        a1[j] = nextH;
      }

      const w1 = this.qLayerWeights[1];
      const b1 = this.qLayerBiases[1];
      const w2 = this.qLayerWeights[2];
      const h1Len = b1.length;
      let outSum = this.qLayerBiases[2][0];
      for (let j = 0; j < h1Len; j++) {
        let sum = b1[j];
        const offset = j * h0Len;
        let i = 0;
        for (; i + 3 < h0Len; i += 4) {
          sum +=
            a1[i] * w1[offset + i] +
            a1[i + 1] * w1[offset + i + 1] +
            a1[i + 2] * w1[offset + i + 2] +
            a1[i + 3] * w1[offset + i + 3];
        }
        for (; i < h0Len; i++) sum += a1[i] * w1[offset + i];
        const bIdx = h0Len + j;
        const prevH = st[bIdx];
        const nextH =
          omr[bIdx] * prevH + rates[bIdx] * fastTanhCpu(sum + rec[bIdx] * prevH);
        st[bIdx] = nextH;
        outSum += nextH * w2[j];
      }
      return outSum;
    }

    // Multi-layer (Depth >= 3): read layer 0 directly from inputs (zero-copy)
    const lastLayer = transitions - 1;
    let bioNodeIdx = 0;
    for (let l = 0; l < lastLayer; l++) {
      const prevAct = l === 0 ? inputs : this.layerActivations[l];
      const nextAct = this.layerActivations[l + 1];
      const w = this.qLayerWeights[l];
      const b = this.qLayerBiases[l];
      const prevLen = l === 0 ? inCount : prevAct.length;
      const nextLen = nextAct.length;
      for (let j = 0; j < nextLen; j++) {
        let sum = b[j];
        const offset = j * prevLen;
        let i = 0;
        for (; i + 3 < prevLen; i += 4) {
          sum +=
            prevAct[i] * w[offset + i] +
            prevAct[i + 1] * w[offset + i + 1] +
            prevAct[i + 2] * w[offset + i + 2] +
            prevAct[i + 3] * w[offset + i + 3];
        }
        for (; i < prevLen; i++) sum += prevAct[i] * w[offset + i];
        const prevH = st[bioNodeIdx];
        const nextH =
          omr[bioNodeIdx] * prevH +
          rates[bioNodeIdx] * fastTanhCpu(sum + rec[bioNodeIdx] * prevH);
        st[bioNodeIdx] = nextH;
        nextAct[j] = nextH;
        bioNodeIdx += 1;
      }
    }

    const prevAct = this.layerActivations[lastLayer];
    const wOut = this.qLayerWeights[lastLayer];
    const prevLen = prevAct.length;
    let outSum = this.qLayerBiases[lastLayer][0];
    let i = 0;
    for (; i + 3 < prevLen; i += 4) {
      outSum +=
        prevAct[i] * wOut[i] +
        prevAct[i + 1] * wOut[i + 1] +
        prevAct[i + 2] * wOut[i + 2] +
        prevAct[i + 3] * wOut[i + 3];
    }
    for (; i < prevLen; i++) outSum += prevAct[i] * wOut[i];
    return outSum;
  }

  private evalNeurochemFast(inputs: ArrayLike<number>): number {
    const transitions = this.qLayerWeights.length;
    const inCount = this.inputNodes;
    const qbp = this.qBioParams;
    const rates = this.bioRates;
    const st = this.neuronState;

    // Depth 0 neurochemical gate on output neuron
    if (transitions === 1) {
      const w0 = this.qLayerWeights[0];
      let outSum = this.qLayerBiases[0][0];
      for (let i = 0; i < inCount; i++) outSum += inputs[i] * w0[i];
      const beta = rates[0];
      const nextM = (1 - beta) * st[0] + beta * fastTanhCpu(qbp[1] * outSum);
      st[0] = nextM;
      const eff = qbp[2] * nextM;
      return (1 + eff) * outSum + 0.5 * eff;
    }

    // Depth 1 zero-copy fast path
    if (transitions === 2) {
      const w0 = this.qLayerWeights[0];
      const b0 = this.qLayerBiases[0];
      const w1 = this.qLayerWeights[1];
      const hLen = b0.length;
      let outSum = this.qLayerBiases[1][0];
      for (let j = 0; j < hLen; j++) {
        let sum = b0[j];
        const offset = j * inCount;
        let i = 0;
        for (; i + 3 < inCount; i += 4) {
          sum +=
            inputs[i] * w0[offset + i] +
            inputs[i + 1] * w0[offset + i + 1] +
            inputs[i + 2] * w0[offset + i + 2] +
            inputs[i + 3] * w0[offset + i + 3];
        }
        for (; i < inCount; i++) sum += inputs[i] * w0[offset + i];
        const pIdx = j * 3;
        const beta = rates[j];
        const nextM = (1 - beta) * st[j] + beta * fastTanhCpu(qbp[pIdx + 1] * sum);
        st[j] = nextM;
        const eff = qbp[pIdx + 2] * nextM;
        const gated = (1 + eff) * fastTanhCpu(sum + 0.5 * eff);
        const clamped = gated > 2 ? 2 : gated < -2 ? -2 : gated;
        outSum += clamped * w1[j];
      }
      return outSum;
    }

    // Multi-layer (Depth >= 2): read layer 0 directly from inputs (zero-copy)
    const lastLayer = transitions - 1;
    let bioNodeIdx = 0;
    for (let l = 0; l < lastLayer; l++) {
      const prevAct = l === 0 ? inputs : this.layerActivations[l];
      const nextAct = this.layerActivations[l + 1];
      const w = this.qLayerWeights[l];
      const b = this.qLayerBiases[l];
      const prevLen = l === 0 ? inCount : prevAct.length;
      const nextLen = nextAct.length;
      for (let j = 0; j < nextLen; j++) {
        let sum = b[j];
        const offset = j * prevLen;
        let i = 0;
        for (; i + 3 < prevLen; i += 4) {
          sum +=
            prevAct[i] * w[offset + i] +
            prevAct[i + 1] * w[offset + i + 1] +
            prevAct[i + 2] * w[offset + i + 2] +
            prevAct[i + 3] * w[offset + i + 3];
        }
        for (; i < prevLen; i++) sum += prevAct[i] * w[offset + i];
        const pIdx = bioNodeIdx * 3;
        const beta = rates[bioNodeIdx];
        const nextM =
          (1 - beta) * st[bioNodeIdx] + beta * fastTanhCpu(qbp[pIdx + 1] * sum);
        st[bioNodeIdx] = nextM;
        const eff = qbp[pIdx + 2] * nextM;
        const gated = (1 + eff) * fastTanhCpu(sum + 0.5 * eff);
        nextAct[j] = gated > 2 ? 2 : gated < -2 ? -2 : gated;
        bioNodeIdx += 1;
      }
    }

    const prevAct = this.layerActivations[lastLayer];
    const wOut = this.qLayerWeights[lastLayer];
    const prevLen = prevAct.length;
    let outSum = this.qLayerBiases[lastLayer][0];
    let i = 0;
    for (; i + 3 < prevLen; i += 4) {
      outSum +=
        prevAct[i] * wOut[i] +
        prevAct[i + 1] * wOut[i + 1] +
        prevAct[i + 2] * wOut[i + 2] +
        prevAct[i + 3] * wOut[i + 3];
    }
    for (; i < prevLen; i++) outSum += prevAct[i] * wOut[i];
    return outSum;
  }

  private evalSynapticStpFast(inputs: ArrayLike<number>): number {
    const transitions = this.qLayerWeights.length;
    const inCount = this.inputNodes;
    const qbp = this.qBioParams;
    const rates = this.bioRates; // precomputed 0.12 * sigmoid(recLogit)
    const st = this.neuronState;

    // Depth 0 synaptic STP on output neuron
    if (transitions === 1) {
      const w0 = this.qLayerWeights[0];
      let outSum = this.qLayerBiases[0][0];
      for (let i = 0; i < inCount; i++) outSum += inputs[i] * w0[i];
      const rate = rates[0];
      const prevU = st[0];
      const act = fastTanhCpu(outSum);
      const absAct = act < 0 ? -act : act;
      let nextU =
        prevU +
        rate * (1 - prevU) +
        qbp[1] * absAct * (1.5 - prevU) -
        0.18 * absAct * prevU;
      if (nextU < 0.15) nextU = 0.15;
      else if (nextU > 2.0) nextU = 2.0;
      st[0] = nextU;
      return nextU * outSum;
    }

    // Depth 1 zero-copy fast path
    if (transitions === 2) {
      const w0 = this.qLayerWeights[0];
      const b0 = this.qLayerBiases[0];
      const w1 = this.qLayerWeights[1];
      const hLen = b0.length;
      let outSum = this.qLayerBiases[1][0];
      for (let j = 0; j < hLen; j++) {
        let sum = b0[j];
        const offset = j * inCount;
        let i = 0;
        for (; i + 3 < inCount; i += 4) {
          sum +=
            inputs[i] * w0[offset + i] +
            inputs[i + 1] * w0[offset + i + 1] +
            inputs[i + 2] * w0[offset + i + 2] +
            inputs[i + 3] * w0[offset + i + 3];
        }
        for (; i < inCount; i++) sum += inputs[i] * w0[offset + i];
        const rate = rates[j];
        const prevU = st[j];
        const act = fastTanhCpu(sum);
        const absAct = act < 0 ? -act : act;
        let nextU =
          prevU +
          rate * (1 - prevU) +
          qbp[j * 2 + 1] * absAct * (1.5 - prevU) -
          0.18 * absAct * prevU;
        if (nextU < 0.15) nextU = 0.15;
        else if (nextU > 2.0) nextU = 2.0;
        st[j] = nextU;
        outSum += nextU * act * w1[j];
      }
      return outSum;
    }

    // Multi-layer (Depth >= 2): read layer 0 directly from inputs (zero-copy)
    const lastLayer = transitions - 1;
    let bioNodeIdx = 0;
    for (let l = 0; l < lastLayer; l++) {
      const prevAct = l === 0 ? inputs : this.layerActivations[l];
      const nextAct = this.layerActivations[l + 1];
      const w = this.qLayerWeights[l];
      const b = this.qLayerBiases[l];
      const prevLen = l === 0 ? inCount : prevAct.length;
      const nextLen = nextAct.length;
      for (let j = 0; j < nextLen; j++) {
        let sum = b[j];
        const offset = j * prevLen;
        let i = 0;
        for (; i + 3 < prevLen; i += 4) {
          sum +=
            prevAct[i] * w[offset + i] +
            prevAct[i + 1] * w[offset + i + 1] +
            prevAct[i + 2] * w[offset + i + 2] +
            prevAct[i + 3] * w[offset + i + 3];
        }
        for (; i < prevLen; i++) sum += prevAct[i] * w[offset + i];
        const rate = rates[bioNodeIdx];
        const prevU = st[bioNodeIdx];
        const act = fastTanhCpu(sum);
        const absAct = act < 0 ? -act : act;
        let nextU =
          prevU +
          rate * (1 - prevU) +
          qbp[bioNodeIdx * 2 + 1] * absAct * (1.5 - prevU) -
          0.18 * absAct * prevU;
        if (nextU < 0.15) nextU = 0.15;
        else if (nextU > 2.0) nextU = 2.0;
        st[bioNodeIdx] = nextU;
        nextAct[j] = nextU * act;
        bioNodeIdx += 1;
      }
    }

    const prevAct = this.layerActivations[lastLayer];
    const wOut = this.qLayerWeights[lastLayer];
    const prevLen = prevAct.length;
    let outSum = this.qLayerBiases[lastLayer][0];
    let i = 0;
    for (; i + 3 < prevLen; i += 4) {
      outSum +=
        prevAct[i] * wOut[i] +
        prevAct[i + 1] * wOut[i + 1] +
        prevAct[i + 2] * wOut[i + 2] +
        prevAct[i + 3] * wOut[i + 3];
    }
    for (; i < prevLen; i++) outSum += prevAct[i] * wOut[i];
    return outSum;
  }

  /**
   * Exact IEEE-754 f64 bio-architecture evaluation (used for deterministic certification
   * audits and live visualization). Uses precomputed `bioRates` (bit-exact with sigmoid)
   * and exact `Math.tanh` with |z| > 19.5 saturation guard.
   */
  private evalBioOutputLogitExact(
    inputs: ArrayLike<number>,
    recordActivations: boolean
  ): number {
    const arch = this.architecture;
    if (arch === 'HYBRID_MOE') {
      return this.evalHybridMoe(inputs, false, recordActivations);
    }
    if (arch === 'DROSOPHILA_CONNECTOME') {
      return this.evalDrosophilaConnectome(inputs, false, recordActivations);
    }
    if (arch === 'DECOUPLED_FLY_CORTEX') {
      return this.evalDecoupledFlyCortex(inputs, false, recordActivations);
    }
    if (arch === 'LOOPED_REASONER') {
      return this.evalLoopedReasoner(inputs, false, recordActivations);
    }
    if (arch === 'PONDER_ACT') {
      return this.evalPonderAct(inputs, false, recordActivations);
    }
    if (arch === 'SELECTIVE_SSM') {
      return this.evalSelectiveSsm(inputs, false, recordActivations);
    }
    if (arch === 'LATENT_ROLLOUT') {
      return this.evalLatentRollout(inputs, false, recordActivations);
    }
    const inCount = this.inputNodes;
    const transitions = this.qLayerWeights.length;
    const qbp = this.qBioParams;
    const rates = this.bioRates;
    const omr = this.bioOneMinusRates;
    const aux0 = this.bioAux0;
    const aux1 = this.bioAux1;
    const st = this.neuronState;

    // Exact IEEE-754 f64 zero-copy fast paths for Depth 0, Depth 1, and Depth 2 audits (!recordActivations)
    if (!recordActivations && transitions <= 3) {
      if (transitions === 1) {
        const w0 = this.qLayerWeights[0];
        let outSum = this.qLayerBiases[0][0];
        for (let i = 0; i < inCount; i++) outSum += inputs[i] * w0[i];
        if (arch === 'LTC_FLY') {
          const prevH = st[0];
          const dIn = outSum + aux0[0] * prevH;
          const nextH =
            omr[0] * prevH +
            rates[0] * (dIn > 19.5 ? 1 : dIn < -19.5 ? -1 : Math.tanh(dIn));
          st[0] = nextH;
          return nextH * 4.0;
        }
        if (arch === 'NEUROCHEM_GATE') {
          const dIn = aux0[0] * outSum;
          const nextM =
            omr[0] * st[0] +
            rates[0] * (dIn > 19.5 ? 1 : dIn < -19.5 ? -1 : Math.tanh(dIn));
          st[0] = nextM;
          return (1 + aux1[0] * nextM) * outSum + 0.5 * aux1[0] * nextM;
        }
        if (arch === 'SYNAPTIC_STP') {
          const rate = rates[0];
          const act = outSum > 19.5 ? 1 : outSum < -19.5 ? -1 : Math.tanh(outSum);
          const absAct = act < 0 ? -act : act;
          let nextU =
            st[0] +
            rate * (1 - st[0]) +
            aux0[0] * absAct * (1.5 - st[0]) -
            0.18 * absAct * st[0];
          if (nextU < 0.15) nextU = 0.15;
          else if (nextU > 2.0) nextU = 2.0;
          st[0] = nextU;
          return nextU * outSum;
        }
        return outSum;
      }

      if (transitions === 2) {
        // Depth 1
        const w0 = this.qLayerWeights[0];
        const b0 = this.qLayerBiases[0];
        const w1 = this.qLayerWeights[1];
        const hLen = b0.length;
        let outSum = this.qLayerBiases[1][0];

        if (arch === 'RESIDUAL_SKIP') {
          for (let j = 0; j < hLen; j++) {
            let sum = b0[j];
            const offset = j * inCount;
            let i = 0;
            for (; i + 3 < inCount; i += 4) {
              sum +=
                inputs[i] * w0[offset + i] +
                inputs[i + 1] * w0[offset + i + 1] +
                inputs[i + 2] * w0[offset + i + 2] +
                inputs[i + 3] * w0[offset + i + 3];
            }
            for (; i < inCount; i++) sum += inputs[i] * w0[offset + i];
            outSum += (sum > 19.5 ? 1 : sum < -19.5 ? -1 : Math.tanh(sum)) * w1[j];
          }
          for (let k = 0; k < inCount; k++) outSum += inputs[k] * qbp[k];
          return outSum;
        }
        if (arch === 'LTC_FLY') {
          for (let j = 0; j < hLen; j++) {
            let sum = b0[j];
            const offset = j * inCount;
            let i = 0;
            for (; i + 3 < inCount; i += 4) {
              sum +=
                inputs[i] * w0[offset + i] +
                inputs[i + 1] * w0[offset + i + 1] +
                inputs[i + 2] * w0[offset + i + 2] +
                inputs[i + 3] * w0[offset + i + 3];
            }
            for (; i < inCount; i++) sum += inputs[i] * w0[offset + i];
            const prevH = st[j];
            const dIn = sum + aux0[j] * prevH;
            const nextH =
              omr[j] * prevH +
              rates[j] * (dIn > 19.5 ? 1 : dIn < -19.5 ? -1 : Math.tanh(dIn));
            st[j] = nextH;
            outSum += nextH * w1[j];
          }
          return outSum;
        }
        if (arch === 'NEUROCHEM_GATE') {
          for (let j = 0; j < hLen; j++) {
            let sum = b0[j];
            const offset = j * inCount;
            let i = 0;
            for (; i + 3 < inCount; i += 4) {
              sum +=
                inputs[i] * w0[offset + i] +
                inputs[i + 1] * w0[offset + i + 1] +
                inputs[i + 2] * w0[offset + i + 2] +
                inputs[i + 3] * w0[offset + i + 3];
            }
            for (; i < inCount; i++) sum += inputs[i] * w0[offset + i];
            const dIn = aux0[j] * sum;
            const nextM =
              omr[j] * st[j] +
              rates[j] * (dIn > 19.5 ? 1 : dIn < -19.5 ? -1 : Math.tanh(dIn));
            st[j] = nextM;
            const eff = aux1[j] * nextM;
            const gIn = sum + 0.5 * eff;
            const gated =
              (1 + eff) * (gIn > 19.5 ? 1 : gIn < -19.5 ? -1 : Math.tanh(gIn));
            outSum += (gated > 2 ? 2 : gated < -2 ? -2 : gated) * w1[j];
          }
          return outSum;
        }
        // SYNAPTIC_STP
        for (let j = 0; j < hLen; j++) {
          let sum = b0[j];
          const offset = j * inCount;
          let i = 0;
          for (; i + 3 < inCount; i += 4) {
            sum +=
              inputs[i] * w0[offset + i] +
              inputs[i + 1] * w0[offset + i + 1] +
              inputs[i + 2] * w0[offset + i + 2] +
              inputs[i + 3] * w0[offset + i + 3];
          }
          for (; i < inCount; i++) sum += inputs[i] * w0[offset + i];
          const rate = rates[j];
          const prevU = st[j];
          const act = sum > 19.5 ? 1 : sum < -19.5 ? -1 : Math.tanh(sum);
          const absAct = act < 0 ? -act : act;
          let nextU =
            prevU +
            rate * (1 - prevU) +
            aux0[j] * absAct * (1.5 - prevU) -
            0.18 * absAct * prevU;
          if (nextU < 0.15) nextU = 0.15;
          else if (nextU > 2.0) nextU = 2.0;
          st[j] = nextU;
          outSum += nextU * act * w1[j];
        }
        return outSum;
      }

      // transitions === 3 (Depth 2 exact f64 fused zero-copy audit path)
      const w0 = this.qLayerWeights[0];
      const b0 = this.qLayerBiases[0];
      const w1 = this.qLayerWeights[1];
      const b1 = this.qLayerBiases[1];
      const w2 = this.qLayerWeights[2];
      const h0Len = b0.length;
      const h1Len = b1.length;
      const a1 = this.layerActivations[1];
      let outSum = this.qLayerBiases[2][0];

      if (arch === 'RESIDUAL_SKIP') {
        for (let j = 0; j < h0Len; j++) {
          let sum = b0[j];
          const offset = j * inCount;
          let i = 0;
          for (; i + 3 < inCount; i += 4) {
            sum +=
              inputs[i] * w0[offset + i] +
              inputs[i + 1] * w0[offset + i + 1] +
              inputs[i + 2] * w0[offset + i + 2] +
              inputs[i + 3] * w0[offset + i + 3];
          }
          for (; i < inCount; i++) sum += inputs[i] * w0[offset + i];
          a1[j] = sum > 19.5 ? 1 : sum < -19.5 ? -1 : Math.tanh(sum);
        }
        for (let j = 0; j < h1Len; j++) {
          let sum = b1[j];
          const offset = j * h0Len;
          let i = 0;
          for (; i + 3 < h0Len; i += 4) {
            sum +=
              a1[i] * w1[offset + i] +
              a1[i + 1] * w1[offset + i + 1] +
              a1[i + 2] * w1[offset + i + 2] +
              a1[i + 3] * w1[offset + i + 3];
          }
          for (; i < h0Len; i++) sum += a1[i] * w1[offset + i];
          outSum += (sum > 19.5 ? 1 : sum < -19.5 ? -1 : Math.tanh(sum)) * w2[j];
        }
        for (let k = 0; k < inCount; k++) outSum += inputs[k] * qbp[k];
        return outSum;
      }

      if (arch === 'LTC_FLY') {
        for (let j = 0; j < h0Len; j++) {
          let sum = b0[j];
          const offset = j * inCount;
          let i = 0;
          for (; i + 3 < inCount; i += 4) {
            sum +=
              inputs[i] * w0[offset + i] +
              inputs[i + 1] * w0[offset + i + 1] +
              inputs[i + 2] * w0[offset + i + 2] +
              inputs[i + 3] * w0[offset + i + 3];
          }
          for (; i < inCount; i++) sum += inputs[i] * w0[offset + i];
          const prevH = st[j];
          const dIn = sum + aux0[j] * prevH;
          const nextH =
            omr[j] * prevH +
            rates[j] * (dIn > 19.5 ? 1 : dIn < -19.5 ? -1 : Math.tanh(dIn));
          st[j] = nextH;
          a1[j] = nextH;
        }
        for (let j = 0; j < h1Len; j++) {
          let sum = b1[j];
          const offset = j * h0Len;
          let i = 0;
          for (; i + 3 < h0Len; i += 4) {
            sum +=
              a1[i] * w1[offset + i] +
              a1[i + 1] * w1[offset + i + 1] +
              a1[i + 2] * w1[offset + i + 2] +
              a1[i + 3] * w1[offset + i + 3];
          }
          for (; i < h0Len; i++) sum += a1[i] * w1[offset + i];
          const bIdx = h0Len + j;
          const prevH = st[bIdx];
          const dIn = sum + aux0[bIdx] * prevH;
          const nextH =
            omr[bIdx] * prevH +
            rates[bIdx] * (dIn > 19.5 ? 1 : dIn < -19.5 ? -1 : Math.tanh(dIn));
          st[bIdx] = nextH;
          outSum += nextH * w2[j];
        }
        return outSum;
      }

      if (arch === 'NEUROCHEM_GATE') {
        for (let j = 0; j < h0Len; j++) {
          let sum = b0[j];
          const offset = j * inCount;
          let i = 0;
          for (; i + 3 < inCount; i += 4) {
            sum +=
              inputs[i] * w0[offset + i] +
              inputs[i + 1] * w0[offset + i + 1] +
              inputs[i + 2] * w0[offset + i + 2] +
              inputs[i + 3] * w0[offset + i + 3];
          }
          for (; i < inCount; i++) sum += inputs[i] * w0[offset + i];
          const dIn = aux0[j] * sum;
          const nextM =
            omr[j] * st[j] +
            rates[j] * (dIn > 19.5 ? 1 : dIn < -19.5 ? -1 : Math.tanh(dIn));
          st[j] = nextM;
          const eff = aux1[j] * nextM;
          const gIn = sum + 0.5 * eff;
          const gated =
            (1 + eff) * (gIn > 19.5 ? 1 : gIn < -19.5 ? -1 : Math.tanh(gIn));
          a1[j] = gated > 2 ? 2 : gated < -2 ? -2 : gated;
        }
        for (let j = 0; j < h1Len; j++) {
          let sum = b1[j];
          const offset = j * h0Len;
          let i = 0;
          for (; i + 3 < h0Len; i += 4) {
            sum +=
              a1[i] * w1[offset + i] +
              a1[i + 1] * w1[offset + i + 1] +
              a1[i + 2] * w1[offset + i + 2] +
              a1[i + 3] * w1[offset + i + 3];
          }
          for (; i < h0Len; i++) sum += a1[i] * w1[offset + i];
          const bIdx = h0Len + j;
          const dIn = aux0[bIdx] * sum;
          const nextM =
            omr[bIdx] * st[bIdx] +
            rates[bIdx] * (dIn > 19.5 ? 1 : dIn < -19.5 ? -1 : Math.tanh(dIn));
          st[bIdx] = nextM;
          const eff = aux1[bIdx] * nextM;
          const gIn = sum + 0.5 * eff;
          const gated =
            (1 + eff) * (gIn > 19.5 ? 1 : gIn < -19.5 ? -1 : Math.tanh(gIn));
          outSum += (gated > 2 ? 2 : gated < -2 ? -2 : gated) * w2[j];
        }
        return outSum;
      }

      // SYNAPTIC_STP Depth 2
      for (let j = 0; j < h0Len; j++) {
        let sum = b0[j];
        const offset = j * inCount;
        let i = 0;
        for (; i + 3 < inCount; i += 4) {
          sum +=
            inputs[i] * w0[offset + i] +
            inputs[i + 1] * w0[offset + i + 1] +
            inputs[i + 2] * w0[offset + i + 2] +
            inputs[i + 3] * w0[offset + i + 3];
        }
        for (; i < inCount; i++) sum += inputs[i] * w0[offset + i];
        const rate = rates[j];
        const prevU = st[j];
        const act = sum > 19.5 ? 1 : sum < -19.5 ? -1 : Math.tanh(sum);
        const absAct = act < 0 ? -act : act;
        let nextU =
          prevU +
          rate * (1 - prevU) +
          aux0[j] * absAct * (1.5 - prevU) -
          0.18 * absAct * prevU;
        if (nextU < 0.15) nextU = 0.15;
        else if (nextU > 2.0) nextU = 2.0;
        st[j] = nextU;
        a1[j] = nextU * act;
      }
      for (let j = 0; j < h1Len; j++) {
        let sum = b1[j];
        const offset = j * h0Len;
        let i = 0;
        for (; i + 3 < h0Len; i += 4) {
          sum +=
            a1[i] * w1[offset + i] +
            a1[i + 1] * w1[offset + i + 1] +
            a1[i + 2] * w1[offset + i + 2] +
            a1[i + 3] * w1[offset + i + 3];
        }
        for (; i < h0Len; i++) sum += a1[i] * w1[offset + i];
        const bIdx = h0Len + j;
        const rate = rates[bIdx];
        const prevU = st[bIdx];
        const act = sum > 19.5 ? 1 : sum < -19.5 ? -1 : Math.tanh(sum);
        const absAct = act < 0 ? -act : act;
        let nextU =
          prevU +
          rate * (1 - prevU) +
          aux0[bIdx] * absAct * (1.5 - prevU) -
          0.18 * absAct * prevU;
        if (nextU < 0.15) nextU = 0.15;
        else if (nextU > 2.0) nextU = 2.0;
        st[bIdx] = nextU;
        outSum += nextU * act * w2[j];
      }
      return outSum;
    }

    if (recordActivations) {
      const inAct = this.layerActivations[0];
      for (let i = 0; i < inCount; i++) {
        inAct[i] = inputs[i] ?? 0;
      }
    }

    const lastLayer = transitions - 1;
    let bioNodeIdx = 0;

    // Hidden layers (architecture branched outside inner loops; zero-copy layer 0 when !recordActivations)
    if (arch === 'LTC_FLY') {
      for (let l = 0; l < lastLayer; l++) {
        const prevAct = l === 0 && !recordActivations ? inputs : this.layerActivations[l];
        const nextAct = this.layerActivations[l + 1];
        const w = this.qLayerWeights[l];
        const b = this.qLayerBiases[l];
        const prevLen = l === 0 ? inCount : prevAct.length;
        const nextLen = nextAct.length;
        for (let j = 0; j < nextLen; j++) {
          let sum = b[j];
          const offset = j * prevLen;
          let i = 0;
          for (; i + 3 < prevLen; i += 4) {
            sum +=
              prevAct[i] * w[offset + i] +
              prevAct[i + 1] * w[offset + i + 1] +
              prevAct[i + 2] * w[offset + i + 2] +
              prevAct[i + 3] * w[offset + i + 3];
          }
          for (; i < prevLen; i++) sum += prevAct[i] * w[offset + i];
          const alpha = rates[bioNodeIdx];
          const rec = qbp[bioNodeIdx * 2 + 1];
          const prevH = st[bioNodeIdx];
          const driveIn = sum + rec * prevH;
          const drive = driveIn > 19.5 ? 1 : driveIn < -19.5 ? -1 : Math.tanh(driveIn);
          const nextH = (1 - alpha) * prevH + alpha * drive;
          st[bioNodeIdx] = nextH;
          nextAct[j] = nextH;
          bioNodeIdx += 1;
        }
      }
    } else if (arch === 'NEUROCHEM_GATE') {
      for (let l = 0; l < lastLayer; l++) {
        const prevAct = l === 0 && !recordActivations ? inputs : this.layerActivations[l];
        const nextAct = this.layerActivations[l + 1];
        const w = this.qLayerWeights[l];
        const b = this.qLayerBiases[l];
        const prevLen = l === 0 ? inCount : prevAct.length;
        const nextLen = nextAct.length;
        for (let j = 0; j < nextLen; j++) {
          let sum = b[j];
          const offset = j * prevLen;
          let i = 0;
          for (; i + 3 < prevLen; i += 4) {
            sum +=
              prevAct[i] * w[offset + i] +
              prevAct[i + 1] * w[offset + i + 1] +
              prevAct[i + 2] * w[offset + i + 2] +
              prevAct[i + 3] * w[offset + i + 3];
          }
          for (; i < prevLen; i++) sum += prevAct[i] * w[offset + i];
          const pIdx = bioNodeIdx * 3;
          const beta = rates[bioNodeIdx];
          const chemDrive = qbp[pIdx + 1];
          const chemGain = qbp[pIdx + 2];
          const prevM = st[bioNodeIdx];
          const dIn = chemDrive * sum;
          const nextM =
            (1 - beta) * prevM +
            beta * (dIn > 19.5 ? 1 : dIn < -19.5 ? -1 : Math.tanh(dIn));
          st[bioNodeIdx] = nextM;
          const eff = chemGain * nextM;
          const gIn = sum + 0.5 * eff;
          const gated =
            (1 + eff) * (gIn > 19.5 ? 1 : gIn < -19.5 ? -1 : Math.tanh(gIn));
          nextAct[j] = gated > 2 ? 2 : gated < -2 ? -2 : gated;
          bioNodeIdx += 1;
        }
      }
    } else if (arch === 'SYNAPTIC_STP') {
      for (let l = 0; l < lastLayer; l++) {
        const prevAct = l === 0 && !recordActivations ? inputs : this.layerActivations[l];
        const nextAct = this.layerActivations[l + 1];
        const w = this.qLayerWeights[l];
        const b = this.qLayerBiases[l];
        const prevLen = l === 0 ? inCount : prevAct.length;
        const nextLen = nextAct.length;
        for (let j = 0; j < nextLen; j++) {
          let sum = b[j];
          const offset = j * prevLen;
          let i = 0;
          for (; i + 3 < prevLen; i += 4) {
            sum +=
              prevAct[i] * w[offset + i] +
              prevAct[i + 1] * w[offset + i + 1] +
              prevAct[i + 2] * w[offset + i + 2] +
              prevAct[i + 3] * w[offset + i + 3];
          }
          for (; i < prevLen; i++) sum += prevAct[i] * w[offset + i];
          const rate = rates[bioNodeIdx];
          const fac = qbp[bioNodeIdx * 2 + 1];
          const prevU = st[bioNodeIdx];
          const act = sum > 19.5 ? 1 : sum < -19.5 ? -1 : Math.tanh(sum);
          const absAct = act < 0 ? -act : act;
          let nextU =
            prevU +
            rate * (1 - prevU) +
            fac * absAct * (1.5 - prevU) -
            0.18 * absAct * prevU;
          if (nextU < 0.15) nextU = 0.15;
          else if (nextU > 2.0) nextU = 2.0;
          st[bioNodeIdx] = nextU;
          nextAct[j] = nextU * act;
          bioNodeIdx += 1;
        }
      }
    } else {
      // RESIDUAL_SKIP hidden neurons are standard tanh
      for (let l = 0; l < lastLayer; l++) {
        const prevAct = l === 0 && !recordActivations ? inputs : this.layerActivations[l];
        const nextAct = this.layerActivations[l + 1];
        const w = this.qLayerWeights[l];
        const b = this.qLayerBiases[l];
        const prevLen = l === 0 ? inCount : prevAct.length;
        const nextLen = nextAct.length;
        for (let j = 0; j < nextLen; j++) {
          let sum = b[j];
          const offset = j * prevLen;
          let i = 0;
          for (; i + 3 < prevLen; i += 4) {
            sum +=
              prevAct[i] * w[offset + i] +
              prevAct[i + 1] * w[offset + i + 1] +
              prevAct[i + 2] * w[offset + i + 2] +
              prevAct[i + 3] * w[offset + i + 3];
          }
          for (; i < prevLen; i++) sum += prevAct[i] * w[offset + i];
          nextAct[j] = sum > 19.5 ? 1 : sum < -19.5 ? -1 : Math.tanh(sum);
        }
      }
    }

    // Output layer
    const prevAct = this.layerActivations[lastLayer];
    const wOut = this.qLayerWeights[lastLayer];
    const prevLen = prevAct.length;
    let outSum = this.qLayerBiases[lastLayer][0];
    let i = 0;
    for (; i + 3 < prevLen; i += 4) {
      outSum +=
        prevAct[i] * wOut[i] +
        prevAct[i + 1] * wOut[i + 1] +
        prevAct[i + 2] * wOut[i + 2] +
        prevAct[i + 3] * wOut[i + 3];
    }
    for (; i < prevLen; i++) outSum += prevAct[i] * wOut[i];

    if (arch === 'RESIDUAL_SKIP' && this.hiddenLayers.length > 0) {
      for (let k = 0; k < inCount; k++) {
        outSum += (inputs[k] ?? 0) * qbp[k];
      }
    } else if (this.hiddenLayers.length === 0) {
      // Depth-0 bio-stateful membrane directly on output neuron
      if (arch === 'LTC_FLY') {
        const alpha = rates[0];
        const prevH = st[0];
        const dIn = outSum + qbp[1] * prevH;
        const nextH =
          (1 - alpha) * prevH +
          alpha * (dIn > 19.5 ? 1 : dIn < -19.5 ? -1 : Math.tanh(dIn));
        st[0] = nextH;
        outSum = nextH * 4.0;
      } else if (arch === 'NEUROCHEM_GATE') {
        const beta = rates[0];
        const dIn = qbp[1] * outSum;
        const nextM =
          (1 - beta) * st[0] +
          beta * (dIn > 19.5 ? 1 : dIn < -19.5 ? -1 : Math.tanh(dIn));
        st[0] = nextM;
        outSum = (1 + qbp[2] * nextM) * outSum + 0.5 * qbp[2] * nextM;
      } else if (arch === 'SYNAPTIC_STP') {
        const rate = rates[0];
        const act = outSum > 19.5 ? 1 : outSum < -19.5 ? -1 : Math.tanh(outSum);
        const absAct = act < 0 ? -act : act;
        let nextU =
          st[0] +
          rate * (1 - st[0]) +
          qbp[1] * absAct * (1.5 - st[0]) -
          0.18 * absAct * st[0];
        if (nextU < 0.15) nextU = 0.15;
        else if (nextU > 2.0) nextU = 2.0;
        st[0] = nextU;
        outSum = nextU * outSum;
      }
    }

    if (recordActivations) {
      const prob = sigmoid(outSum);
      this.layerActivations[transitions][0] = prob;
      this.lastOutput = prob;
    }
    return outSum;
  }

  predict(inputs: ArrayLike<number>): number {
    if (this.architecture !== 'MLP') {
      this.evalBioOutputLogitExact(inputs, true);
      return this.lastOutput;
    }

    const inAct = this.layerActivations[0];
    const inCount = this.inputNodes;
    for (let i = 0; i < inCount; i++) {
      inAct[i] = inputs[i] ?? 0;
    }

    const transitions = this.qLayerWeights.length;
    for (let l = 0; l < transitions; l++) {
      const prevAct = this.layerActivations[l];
      const nextAct = this.layerActivations[l + 1];
      const w = this.qLayerWeights[l];
      const b = this.qLayerBiases[l];
      const prevLen = prevAct.length;
      const nextLen = nextAct.length;
      const isOutput = l === transitions - 1;

      for (let j = 0; j < nextLen; j++) {
        let sum = b[j];
        const offset = j * prevLen;
        for (let i = 0; i < prevLen; i++) {
          sum += prevAct[i] * w[offset + i];
        }
        nextAct[j] = isOutput ? sigmoid(sum) : Math.tanh(sum);
      }
    }

    const out = this.layerActivations[transitions][0];
    this.lastOutput = out;
    return out;
  }

  /**
   * Mathematically identical to `this.predict(inputs) > 0.5`, since
   * `sigmoid(z) > 0.5 <=> z > 0`. Exact IEEE-754 f64 (used for deterministic audits)
   * with 4x unrolled dot products and |z| > 19.5 saturation fast-path.
   */
  shouldFlap(inputs: ArrayLike<number>): boolean {
    if (this.architecture !== 'MLP') {
      return this.evalBioOutputLogitExact(inputs, false) > 0;
    }

    const transitions = this.qLayerWeights.length;
    const inCount = this.inputNodes;

    // Fast path: Depth 0 (linear K -> 1)
    if (transitions === 1) {
      const w0 = this.qLayerWeights[0];
      let sum = this.qLayerBiases[0][0];
      let i = 0;
      for (; i + 3 < inCount; i += 4) {
        sum +=
          inputs[i] * w0[i] +
          inputs[i + 1] * w0[i + 1] +
          inputs[i + 2] * w0[i + 2] +
          inputs[i + 3] * w0[i + 3];
      }
      for (; i < inCount; i++) {
        sum += inputs[i] * w0[i];
      }
      return sum > 0;
    }

    // Fast path: Depth 1 (K -> H -> 1)
    if (transitions === 2) {
      const w0 = this.qLayerWeights[0];
      const b0 = this.qLayerBiases[0];
      const w1 = this.qLayerWeights[1];
      const hLen = b0.length;
      let outSum = this.qLayerBiases[1][0];
      for (let j = 0; j < hLen; j++) {
        let sum = b0[j];
        const offset = j * inCount;
        let i = 0;
        for (; i + 3 < inCount; i += 4) {
          sum +=
            inputs[i] * w0[offset + i] +
            inputs[i + 1] * w0[offset + i + 1] +
            inputs[i + 2] * w0[offset + i + 2] +
            inputs[i + 3] * w0[offset + i + 3];
        }
        for (; i < inCount; i++) {
          sum += inputs[i] * w0[offset + i];
        }
        const act = sum > 19 ? 1 : sum < -19 ? -1 : Math.tanh(sum);
        outSum += act * w1[j];
      }
      return outSum > 0;
    }

    // Fast path: Depth 2 (K -> H1 -> H2 -> 1) zero-copy + fused H2->Out accumulation
    if (transitions === 3) {
      const w0 = this.qLayerWeights[0];
      const b0 = this.qLayerBiases[0];
      const h1Act = this.layerActivations[1];
      const h1Len = b0.length;
      for (let j = 0; j < h1Len; j++) {
        let sum = b0[j];
        const offset = j * inCount;
        let i = 0;
        for (; i + 3 < inCount; i += 4) {
          sum +=
            inputs[i] * w0[offset + i] +
            inputs[i + 1] * w0[offset + i + 1] +
            inputs[i + 2] * w0[offset + i + 2] +
            inputs[i + 3] * w0[offset + i + 3];
        }
        for (; i < inCount; i++) sum += inputs[i] * w0[offset + i];
        h1Act[j] = sum > 19.5 ? 1 : sum < -19.5 ? -1 : Math.tanh(sum);
      }
      const w1 = this.qLayerWeights[1];
      const b1 = this.qLayerBiases[1];
      const w2 = this.qLayerWeights[2];
      const h2Len = b1.length;
      let outSum = this.qLayerBiases[2][0];
      for (let j = 0; j < h2Len; j++) {
        let sum = b1[j];
        const offset = j * h1Len;
        let i = 0;
        for (; i + 3 < h1Len; i += 4) {
          sum +=
            h1Act[i] * w1[offset + i] +
            h1Act[i + 1] * w1[offset + i + 1] +
            h1Act[i + 2] * w1[offset + i + 2] +
            h1Act[i + 3] * w1[offset + i + 3];
        }
        for (; i < h1Len; i++) sum += h1Act[i] * w1[offset + i];
        outSum += (sum > 19.5 ? 1 : sum < -19.5 ? -1 : Math.tanh(sum)) * w2[j];
      }
      return outSum > 0;
    }

    // General multi-layer fast path (Depth >= 3): read layer 0 directly from inputs
    const lastLayer = transitions - 1;
    for (let l = 0; l < lastLayer; l++) {
      const prevAct = l === 0 ? inputs : this.layerActivations[l];
      const nextAct = this.layerActivations[l + 1];
      const w = this.qLayerWeights[l];
      const b = this.qLayerBiases[l];
      const prevLen = l === 0 ? inCount : prevAct.length;
      const nextLen = nextAct.length;

      for (let j = 0; j < nextLen; j++) {
        let sum = b[j];
        const offset = j * prevLen;
        let i = 0;
        for (; i + 3 < prevLen; i += 4) {
          sum +=
            prevAct[i] * w[offset + i] +
            prevAct[i + 1] * w[offset + i + 1] +
            prevAct[i + 2] * w[offset + i + 2] +
            prevAct[i + 3] * w[offset + i + 3];
        }
        for (; i < prevLen; i++) {
          sum += prevAct[i] * w[offset + i];
        }
        nextAct[j] = sum > 19 ? 1 : sum < -19 ? -1 : Math.tanh(sum);
      }
    }

    const prevAct = this.layerActivations[lastLayer];
    const wOut = this.qLayerWeights[lastLayer];
    let outSum = this.qLayerBiases[lastLayer][0];
    const prevLen = prevAct.length;
    let i = 0;
    for (; i + 3 < prevLen; i += 4) {
      outSum +=
        prevAct[i] * wOut[i] +
        prevAct[i + 1] * wOut[i + 1] +
        prevAct[i + 2] * wOut[i + 2] +
        prevAct[i + 3] * wOut[i + 3];
    }
    for (; i < prevLen; i++) {
      outSum += prevAct[i] * wOut[i];
    }
    return outSum > 0;
  }

  /**
   * High-speed training rollout inference using 4x unrolled dot products and
   * Padé rational tanh (~3x-5x faster than libm Math.tanh in V8).
   * Deterministic certification audits ALWAYS use exact f64 `shouldFlap()`.
   */
  shouldFlapFast(inputs: ArrayLike<number>): boolean {
    if (this.architecture !== 'MLP') {
      return this.evalBioOutputLogitFast(inputs) > 0;
    }

    const transitions = this.qLayerWeights.length;
    const inCount = this.inputNodes;

    if (transitions === 1) {
      const w0 = this.qLayerWeights[0];
      let sum = this.qLayerBiases[0][0];
      let i = 0;
      for (; i + 3 < inCount; i += 4) {
        sum +=
          inputs[i] * w0[i] +
          inputs[i + 1] * w0[i + 1] +
          inputs[i + 2] * w0[i + 2] +
          inputs[i + 3] * w0[i + 3];
      }
      for (; i < inCount; i++) {
        sum += inputs[i] * w0[i];
      }
      return sum > 0;
    }

    if (transitions === 2) {
      const w0 = this.qLayerWeights[0];
      const b0 = this.qLayerBiases[0];
      const w1 = this.qLayerWeights[1];
      const hLen = b0.length;
      let outSum = this.qLayerBiases[1][0];
      for (let j = 0; j < hLen; j++) {
        let sum = b0[j];
        const offset = j * inCount;
        let i = 0;
        for (; i + 3 < inCount; i += 4) {
          sum +=
            inputs[i] * w0[offset + i] +
            inputs[i + 1] * w0[offset + i + 1] +
            inputs[i + 2] * w0[offset + i + 2] +
            inputs[i + 3] * w0[offset + i + 3];
        }
        for (; i < inCount; i++) {
          sum += inputs[i] * w0[offset + i];
        }
        outSum += fastTanhCpu(sum) * w1[j];
      }
      return outSum > 0;
    }

    // Fast path: Depth 2 (K -> H1 -> H2 -> 1) zero-copy + fused H2->Out accumulation
    if (transitions === 3) {
      const w0 = this.qLayerWeights[0];
      const b0 = this.qLayerBiases[0];
      const h1Act = this.layerActivations[1];
      const h1Len = b0.length;
      for (let j = 0; j < h1Len; j++) {
        let sum = b0[j];
        const offset = j * inCount;
        let i = 0;
        for (; i + 3 < inCount; i += 4) {
          sum +=
            inputs[i] * w0[offset + i] +
            inputs[i + 1] * w0[offset + i + 1] +
            inputs[i + 2] * w0[offset + i + 2] +
            inputs[i + 3] * w0[offset + i + 3];
        }
        for (; i < inCount; i++) sum += inputs[i] * w0[offset + i];
        h1Act[j] = fastTanhCpu(sum);
      }
      const w1 = this.qLayerWeights[1];
      const b1 = this.qLayerBiases[1];
      const w2 = this.qLayerWeights[2];
      const h2Len = b1.length;
      let outSum = this.qLayerBiases[2][0];
      for (let j = 0; j < h2Len; j++) {
        let sum = b1[j];
        const offset = j * h1Len;
        let i = 0;
        for (; i + 3 < h1Len; i += 4) {
          sum +=
            h1Act[i] * w1[offset + i] +
            h1Act[i + 1] * w1[offset + i + 1] +
            h1Act[i + 2] * w1[offset + i + 2] +
            h1Act[i + 3] * w1[offset + i + 3];
        }
        for (; i < h1Len; i++) sum += h1Act[i] * w1[offset + i];
        outSum += fastTanhCpu(sum) * w2[j];
      }
      return outSum > 0;
    }

    const lastLayer = transitions - 1;
    for (let l = 0; l < lastLayer; l++) {
      const prevAct = l === 0 ? inputs : this.layerActivations[l];
      const nextAct = this.layerActivations[l + 1];
      const w = this.qLayerWeights[l];
      const b = this.qLayerBiases[l];
      const prevLen = l === 0 ? inCount : prevAct.length;
      const nextLen = nextAct.length;

      for (let j = 0; j < nextLen; j++) {
        let sum = b[j];
        const offset = j * prevLen;
        let i = 0;
        for (; i + 3 < prevLen; i += 4) {
          sum +=
            prevAct[i] * w[offset + i] +
            prevAct[i + 1] * w[offset + i + 1] +
            prevAct[i + 2] * w[offset + i + 2] +
            prevAct[i + 3] * w[offset + i + 3];
        }
        for (; i < prevLen; i++) {
          sum += prevAct[i] * w[offset + i];
        }
        nextAct[j] = fastTanhCpu(sum);
      }
    }

    const prevAct = this.layerActivations[lastLayer];
    const wOut = this.qLayerWeights[lastLayer];
    let outSum = this.qLayerBiases[lastLayer][0];
    const prevLen = prevAct.length;
    let i = 0;
    for (; i + 3 < prevLen; i += 4) {
      outSum +=
        prevAct[i] * wOut[i] +
        prevAct[i + 1] * wOut[i + 1] +
        prevAct[i + 2] * wOut[i + 2] +
        prevAct[i + 3] * wOut[i + 3];
    }
    for (; i < prevLen; i++) {
      outSum += prevAct[i] * wOut[i];
    }
    return outSum > 0;
  }

  getHybridSnapshotTelemetry(
    morphogenesis?: import('./types').MorphogenesisSnapshot
  ): HybridModuleTelemetry | undefined {
    if (this.architecture !== 'HYBRID_MOE' || !this.hybridLayout) {
      return morphogenesis?.hybridTelemetry;
    }
    const qbp = this.qBioParams;
    const lay = this.hybridLayout;
    const rw = this.lastHybridRouterWeights;
    const alphaGates: Record<HybridExpertKind, number> = {
      LTC_FLY:
        this.hybridActiveMask[0] === 1 ? Math.tanh(qbp[lay.experts[0].alphaIdx]) : 0,
      SELECTIVE_SSM:
        this.hybridActiveMask[1] === 1 ? Math.tanh(qbp[lay.experts[1].alphaIdx]) : 0,
      PONDER_ACT:
        this.hybridActiveMask[2] === 1 ? Math.tanh(qbp[lay.experts[2].alphaIdx]) : 0,
    };
    return {
      activeExperts: this.getActiveHybridExperts(),
      routerWeights: {
        MLP: rw[0],
        LTC_FLY: rw[1],
        SELECTIVE_SSM: rw[2],
        PONDER_ACT: rw[3],
      },
      alphaGates,
      inTrialExpert: morphogenesis?.hybridTelemetry?.inTrialExpert ?? null,
      trialGensRemaining: morphogenesis?.hybridTelemetry?.trialGensRemaining ?? 0,
      avgFlopsPerFrame: this.estimateFlopsPerFrame(),
      rollbackCount: morphogenesis?.hybridTelemetry?.rollbackCount ?? 0,
      committedExpertsCount: morphogenesis?.hybridTelemetry?.committedExpertsCount ?? 0,
    };
  }

  getSnapshot(morphogenesis?: import('./types').MorphogenesisSnapshot): NetworkSnapshot {
    const transitions = this.qLayerWeights.length;
    const firstHiddenAct =
      this.hiddenLayers.length > 0 ? Array.from(this.layerActivations[1]) : [];
    const weightsIH =
      transitions >= 2 ? Array.from(this.qLayerWeights[0]) : [];
    const weightsHO = Array.from(this.qLayerWeights[transitions - 1]);
    const hybridTelemetry = this.getHybridSnapshotTelemetry(morphogenesis);

    return {
      inputs: Array.from(this.layerActivations[0]),
      inputFeatures: [...this.inputFeatures],
      hiddenActivations: firstHiddenAct,
      output: this.lastOutput,
      shouldFlap: this.lastOutput > 0.5,
      weightsIH,
      weightsHO,
      inputNodes: this.inputNodes,
      hiddenNodes: this.hiddenLayers.length === 1 ? this.hiddenLayers[0] : this.hiddenNodes,
      outputNodes: this.outputNodes,
      layers: [...this.layers],
      activations: this.layerActivations.map((arr) => Array.from(arr)),
      layerWeights: this.qLayerWeights.map((arr) => Array.from(arr)),
      architecture: this.architecture,
      computeProfile: ARCHITECTURE_META[this.architecture]?.computeProfile ?? 'GPU_LOCKSTEP',
      flopsPerFrame: this.estimateFlopsPerFrame(),
      ...(isReasoningArchitecture(this.architecture)
        ? {
            reasoningStepInfo: {
              ponderSteps: this.lastPonderSteps,
              maxSteps:
                this.architecture === 'PONDER_ACT'
                  ? Math.max(2, this.reasoningSteps)
                  : this.architecture === 'HYBRID_MOE'
                    ? this.hybridActiveMask[2] === 1
                      ? Math.min(3, this.reasoningSteps)
                      : 1
                    : this.architecture === 'LOOPED_REASONER'
                      ? this.reasoningSteps
                      : this.architecture === 'LATENT_ROLLOUT' ||
                          this.architecture === 'DECOUPLED_FLY_CORTEX'
                        ? 2
                        : 1,
              ...(this.architecture === 'LATENT_ROLLOUT'
                ? { rolloutAdvantage: this.lastRolloutAdvantage }
                : {}),
              ...(this.architecture === 'SELECTIVE_SSM' ||
              (this.architecture === 'HYBRID_MOE' && this.hybridActiveMask[1] === 1)
                ? { ssmGateMean: this.lastSsmGateMean }
                : {}),
            },
          }
        : {}),
      ...(this.architecture === 'DECOUPLED_FLY_CORTEX' ||
      this.onlineUpdatesCount > 0
        ? {
            decoupledTelemetry: {
              activeSlots: this.lastActiveSlots,
              slotWeights: this.lastSlotWeights,
              memoryReadout: this.lastMemoryReadout,
              dopamineSignal: this.lastDopamineSignal,
              onlineUpdates: this.onlineUpdatesCount,
              surpriseLevel: this.lastSurpriseLevel,
              system2Active:
                this.architecture === 'DECOUPLED_FLY_CORTEX'
                  ? this.lastSystem2Active
                  : this.lastPonderSteps >= 2,
            },
          }
        : {}),
      ...(hybridTelemetry ? { hybridTelemetry } : {}),
      ...(morphogenesis ? { morphogenesis } : {}),
    };
  }

  clone(): NeuralNetwork {
    const copy = Object.create(NeuralNetwork.prototype) as NeuralNetwork & {
      inputNodes: number;
      inputFeatures: SensorFeatureId[];
      hiddenLayers: number[];
      hiddenNodes: number;
      outputNodes: number;
      layers: number[];
      architecture: NetworkArchitecture;
      weightPrecision: WeightPrecision;
      reasoningSteps: number;
      layerWeights: Float64Array[];
      layerBiases: Float64Array[];
      bioParams: Float64Array;
      qLayerWeights: Float64Array[];
      qLayerBiases: Float64Array[];
      qBioParams: Float64Array;
    };
    copy.inputNodes = this.inputNodes;
    copy.inputFeatures = this.inputFeatures;
    copy.hiddenLayers = this.hiddenLayers;
    copy.hiddenNodes = this.hiddenNodes;
    copy.outputNodes = this.outputNodes;
    copy.layers = this.layers;
    copy.architecture = this.architecture;
    copy.weightPrecision = this.weightPrecision;
    copy.reasoningSteps = this.reasoningSteps;

    const transitions = this.layerWeights.length;
    const weights = new Array<Float64Array>(transitions);
    const biases = new Array<Float64Array>(transitions);
    for (let l = 0; l < transitions; l++) {
      weights[l] = new Float64Array(this.layerWeights[l]);
      biases[l] = new Float64Array(this.layerBiases[l]);
    }
    copy.layerWeights = weights;
    copy.layerBiases = biases;
    copy.bioParams = new Float64Array(this.bioParams);

    if (this.weightPrecision === 'FP32') {
      copy.qLayerWeights = weights;
      copy.qLayerBiases = biases;
      copy.qBioParams = copy.bioParams;
    } else {
      const qWeights = new Array<Float64Array>(transitions);
      const qBiases = new Array<Float64Array>(transitions);
      for (let l = 0; l < transitions; l++) {
        qWeights[l] = new Float64Array(this.qLayerWeights[l]);
        qBiases[l] = new Float64Array(this.qLayerBiases[l]);
      }
      copy.qLayerWeights = qWeights;
      copy.qLayerBiases = qBiases;
      copy.qBioParams = new Float64Array(this.qBioParams);
    }

    copy.bioRates = new Float64Array(this.bioRates);
    copy.bioOneMinusRates = new Float64Array(this.bioOneMinusRates);
    copy.bioAux0 = new Float64Array(this.bioAux0);
    copy.bioAux1 = new Float64Array(this.bioAux1);
    copy.neuronState = new Float64Array(this.neuronState.length);
    copy.reasoningScratchA = new Float64Array(this.reasoningScratchA.length);
    copy.reasoningScratchB = new Float64Array(this.reasoningScratchB.length);
    copy.reasoningScratchC = new Float64Array(this.reasoningScratchC.length);
    copy.hybridLayout = this.hybridLayout;
    copy.hybridActiveMask = new Uint8Array(this.hybridActiveMask);
    copy.lastHybridRouterWeights = new Float64Array(this.lastHybridRouterWeights);
    copy.lastHybridFlops = this.lastHybridFlops;
    copy.resetState();

    const actLen = this.layerActivations.length;
    const acts = new Array<Float64Array>(actLen);
    for (let i = 0; i < actLen; i++) {
      acts[i] = new Float64Array(this.layerActivations[i]);
    }
    copy.layerActivations = acts;
    copy.lastOutput = this.lastOutput;
    return copy;
  }

  crossover(partner: NeuralNetwork): NeuralNetwork {
    const child = this.clone();
    for (let l = 0; l < child.layerWeights.length; l++) {
      const cw = child.layerWeights[l];
      const pw = partner.layerWeights[l];
      for (let i = 0; i < cw.length; i++) {
        if (Math.random() < 0.5) cw[i] = pw[i];
      }
      const cb = child.layerBiases[l];
      const pb = partner.layerBiases[l];
      for (let i = 0; i < cb.length; i++) {
        if (Math.random() < 0.5) cb[i] = pb[i];
      }
    }
    if (child.bioParams.length > 0 && partner.bioParams.length === child.bioParams.length) {
      for (let i = 0; i < child.bioParams.length; i++) {
        if (Math.random() < 0.5) child.bioParams[i] = partner.bioParams[i];
      }
    }
    if (
      child.architecture === 'HYBRID_MOE' &&
      partner.architecture === 'HYBRID_MOE'
    ) {
      for (let i = 0; i < 3; i++) {
        child.hybridActiveMask[i] =
          child.hybridActiveMask[i] | partner.hybridActiveMask[i];
      }
    }
    child.syncQuantizedCache();
    return child;
  }

  mutate(
    rate: number,
    strength: number,
    plasticityScale?: Float32Array,
    activeParamMask?: Uint8Array
  ): void {
    let flatIdx = 0;
    for (let l = 0; l < this.layerWeights.length; l++) {
      const w = this.layerWeights[l];
      for (let i = 0; i < w.length; i++, flatIdx++) {
        if (activeParamMask && activeParamMask[flatIdx] === 0) {
          w[i] = 0;
          continue;
        }
        const pScale = plasticityScale ? plasticityScale[flatIdx] : 1;
        if (pScale <= 0) continue;
        const effRate = pScale < 0.5 ? rate * Math.max(0.35, pScale * 1.5) : rate;
        if (Math.random() < effRate) {
          const effStrength = strength * pScale;
          w[i] =
            pScale >= 0.7 && Math.random() < 0.08
              ? randn() * 0.8
              : w[i] + randn() * effStrength;
        }
      }
      const b = this.layerBiases[l];
      for (let i = 0; i < b.length; i++, flatIdx++) {
        if (activeParamMask && activeParamMask[flatIdx] === 0) {
          b[i] = 0;
          continue;
        }
        const pScale = plasticityScale ? plasticityScale[flatIdx] : 1;
        if (pScale <= 0) continue;
        const effRate = pScale < 0.5 ? rate * Math.max(0.35, pScale * 1.5) : rate;
        if (Math.random() < effRate) {
          const effStrength = strength * pScale;
          b[i] =
            pScale >= 0.7 && Math.random() < 0.08
              ? randn() * 0.8
              : b[i] + randn() * effStrength;
        }
      }
    }
    if (this.bioParams.length > 0) {
      const bp = this.bioParams;
      for (let i = 0; i < bp.length; i++, flatIdx++) {
        if (activeParamMask && activeParamMask[flatIdx] === 0) {
          bp[i] = 0;
          continue;
        }
        const pScale = plasticityScale ? plasticityScale[flatIdx] : 1;
        if (pScale <= 0) continue;
        const effRate = pScale < 0.5 ? rate * Math.max(0.35, pScale * 1.5) : rate;
        if (Math.random() < effRate) {
          const effStrength = strength * pScale;
          bp[i] =
            pScale >= 0.7 && Math.random() < 0.08
              ? randn() * 0.8
              : bp[i] + randn() * effStrength;
        }
      }
    }
    this.syncQuantizedCache();
  }

  serialize(): SerializedNeuralNetwork {
    const transitions = this.qLayerWeights.length;
    const isSingleOrLinear = this.hiddenLayers.length <= 1;
    const legacyIH =
      isSingleOrLinear && transitions === 2 ? Array.from(this.qLayerWeights[0]) : [];
    const legacyBiasH =
      isSingleOrLinear && transitions === 2 ? Array.from(this.qLayerBiases[0]) : [];
    const legacyHO = Array.from(this.qLayerWeights[transitions - 1]);
    const legacyBiasO = Array.from(this.qLayerBiases[transitions - 1]);

    return {
      inputNodes: this.inputNodes,
      inputFeatures: [...this.inputFeatures],
      hiddenNodes: this.hiddenLayers.length === 1 ? this.hiddenLayers[0] : this.hiddenNodes,
      hiddenLayers: [...this.hiddenLayers],
      outputNodes: this.outputNodes,
      ...(this.architecture !== 'MLP' ? { architecture: this.architecture } : {}),
      ...(this.weightPrecision !== 'FP32'
        ? { weightPrecision: this.weightPrecision }
        : {}),
      ...(this.architecture === 'LOOPED_REASONER' ||
      this.architecture === 'PONDER_ACT' ||
      this.architecture === 'HYBRID_MOE'
        ? { reasoningSteps: this.reasoningSteps }
        : {}),
      ...(this.architecture === 'HYBRID_MOE'
        ? { hybridActiveExperts: this.getActiveHybridExperts() }
        : {}),
      ...(this.qBioParams.length > 0 ? { bioParams: Array.from(this.qBioParams) } : {}),
      weightsIH: legacyIH,
      biasH: legacyBiasH,
      weightsHO: legacyHO,
      biasO: legacyBiasO,
      layerWeights: this.qLayerWeights.map((w) => Array.from(w)),
      layerBiases: this.qLayerBiases.map((b) => Array.from(b)),
    };
  }

  static deserialize(data: SerializedNeuralNetwork): NeuralNetwork {
    if (!data || typeof data.inputNodes !== 'number') {
      throw new Error('Invalid neural network brain file.');
    }

    const outputNodes = data.outputNodes ?? 1;
    if (
      data.inputNodes < 1 ||
      data.inputNodes > ALL_SENSOR_FEATURES.length ||
      outputNodes !== 1
    ) {
      throw new Error('Incompatible neural network input/output dimensions.');
    }

    const hiddenLayers = normalizeHiddenLayers(
      data.hiddenLayers !== undefined ? data.hiddenLayers : data.hiddenNodes
    );

    if (hiddenLayers.length > 5) {
      throw new Error('Neural network depth exceeds supported limit (max 5 hidden layers).');
    }

    const dims = [data.inputNodes, ...hiddenLayers, outputNodes];
    const transitions = dims.length - 1;

    if (data.layerWeights && data.layerBiases) {
      if (
        !Array.isArray(data.layerWeights) ||
        !Array.isArray(data.layerBiases) ||
        data.layerWeights.length !== transitions ||
        data.layerBiases.length !== transitions
      ) {
        throw new Error('Incompatible multi-layer neural network dimensions.');
      }

      for (let l = 0; l < transitions; l++) {
        const expectedW = dims[l] * dims[l + 1];
        const expectedB = dims[l + 1];
        if (
          !Array.isArray(data.layerWeights[l]) ||
          !Array.isArray(data.layerBiases[l]) ||
          data.layerWeights[l].length !== expectedW ||
          data.layerBiases[l].length !== expectedB
        ) {
          throw new Error('Corrupted neural network layer weight dimensions.');
        }
        const allValid =
          data.layerWeights[l].every((v) => typeof v === 'number' && Number.isFinite(v)) &&
          data.layerBiases[l].every((v) => typeof v === 'number' && Number.isFinite(v));
        if (!allValid) {
          throw new Error('Neural network weights contain invalid numbers.');
        }
      }

      return new NeuralNetwork(
        data.inputNodes,
        hiddenLayers,
        outputNodes,
        data,
        data.inputFeatures,
        data.architecture,
        data.weightPrecision,
        data.reasoningSteps
      );
    }

    // Legacy 0 or 1 hidden layer format
    if (
      typeof data.hiddenNodes !== 'number' ||
      !Array.isArray(data.weightsIH) ||
      !Array.isArray(data.biasH) ||
      !Array.isArray(data.weightsHO) ||
      !Array.isArray(data.biasO)
    ) {
      throw new Error('Invalid neural network brain file.');
    }

    const expectedHO =
      data.hiddenNodes === 0
        ? data.inputNodes * outputNodes
        : data.hiddenNodes * outputNodes;

    if (
      data.hiddenNodes < 0 ||
      data.hiddenNodes > 32 ||
      data.weightsIH.length !== data.inputNodes * data.hiddenNodes ||
      data.biasH.length !== data.hiddenNodes ||
      data.weightsHO.length !== expectedHO ||
      data.biasO.length !== outputNodes
    ) {
      throw new Error('Incompatible neural network dimensions.');
    }

    const allFinite = [
      ...data.weightsIH,
      ...data.biasH,
      ...data.weightsHO,
      ...data.biasO,
    ].every((v) => typeof v === 'number' && Number.isFinite(v));

    if (!allFinite) {
      throw new Error('Neural network weights contain invalid numbers.');
    }

    return new NeuralNetwork(
      data.inputNodes,
      hiddenLayers,
      outputNodes,
      data,
      data.inputFeatures,
      data.architecture,
      data.weightPrecision,
      data.reasoningSteps
    );
  }
}
