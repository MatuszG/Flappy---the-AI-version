/**
 * Self-contained Dual-Target CUDA C++ / OpenMP C++17 Engine for Google Colab GPU Offload.
 *
 * Compiles natively inside Colab via:
 *   GPU: nvcc -O3 -use_fast_math -Xcompiler -O3,-fopenmp,-fPIC -shared neurolab_cuda.cu -o libneurolab.so
 *   CPU: g++  -O3 -fopenmp -fPIC -shared -x c++ neurolab_cuda.cu -o libneurolab.so
 *
 * Parity guarantees with NeuroLab TypeScript engine:
 * - Identical Mulberry32 PRNG, pipe spawning, wind gusts, moving pipes, circle-vs-AABB collision
 * - Identical Curriculum Annealing cosine ramp & Shaped Fitness
 * - All 12 dual-pipe & TTF sensors (Y, VY, DX, TOP_CLEAR, BOT_CLEAR, PIPE_VY, NEXT_PIPE_DY, NEXT_TOP_CLEAR, NEXT_BOT_CLEAR, NEXT_PIPE_DX, NEXT_PIPE_VY, PIPE_TTF)
 * - All 10 architectures (MLP, RESIDUAL_SKIP, LTC_FLY, NEUROCHEM_GATE, SYNAPTIC_STP,
 *   LOOPED_REASONER, PONDER_ACT, SELECTIVE_SSM, LATENT_ROLLOUT, HYBRID_MOE) + reasoningSteps K + metabolicStepCost
 * - All 6 weight precisions (FP32, FP16, INT8, INT4, TERNARY, BINARY)
 * - All 8 evolutionary optimizers (GA, DE, PSO, CMA_HYBRID, CEM, ADAPTIVE_ES, NATURAL_ES, ADAM_ES)
 * - Bio-Inspired Self-Growing Morphogenesis (Zero-Init width/sensor/K growth, HYBRID_MOE expert spawning + ROI rollback, myelination, pruning)
 * - Multi-Architecture Speciation Islands (ISLAND_SPECIATION) + Hardware Auto-Routing (CUDA GPU_LOCKSTEP vs OpenMP CPU_SPECIALIZED)
 * - Deterministic Float64 final multi-seed audit + FailureAutopsy + ReasoningTelemetry
 */

export const COLAB_CUDA_ENGINE_SOURCE = String.raw`// ============================================================================
// Flappy NeuroLab — Native CUDA C++ / OpenMP C++17 Research Sweep Engine
// Zero external dependencies. Lockstep Shared-Physics GPU Kernel + CPU Specialized OpenMP Router + F64 Audit.
// ============================================================================
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <algorithm>
#include <vector>
#include <chrono>

#ifdef _OPENMP
#include <omp.h>
#endif

#ifdef __CUDACC__
#include <cuda_runtime.h>
#define HD __host__ __device__
#define DEV __device__
#else
#define HD
#define DEV
#endif

// Physics constants — 100% bit-identical to src/engine/physics.ts
static constexpr double K_CANVAS_W = 640.0;
static constexpr double K_PLAYABLE_H = 424.0;
static constexpr double K_BIRD_X = 148.0;
static constexpr double K_BIRD_R = 13.0;
static constexpr double K_PIPE_W = 60.0;
static constexpr double K_GRAVITY = 0.42;
static constexpr double K_JUMP = -7.35;
static constexpr double K_MAX_VY = 10.5;
static constexpr double K_MAX_PIPE_VY_NORM = 2.0;
static constexpr double K_PIPE_HIT_R = 11.0;
static constexpr double K_PIPE_HIT_R2 = 121.0;
static constexpr double K_FLOOR_HIT_R = 12.0;
static constexpr double K_TWO_PI = 6.28318530717958647692;
static constexpr double K_PI = 3.14159265358979323846;

// Architecture IDs
enum ArchId : int {
  ARCH_MLP = 0,
  ARCH_RESIDUAL_SKIP = 1,
  ARCH_LTC_FLY = 2,
  ARCH_NEUROCHEM_GATE = 3,
  ARCH_SYNAPTIC_STP = 4,
  ARCH_LOOPED_REASONER = 5,
  ARCH_PONDER_ACT = 6,
  ARCH_SELECTIVE_SSM = 7,
  ARCH_LATENT_ROLLOUT = 8,
  ARCH_HYBRID_MOE = 9,
  ARCH_DROSOPHILA_CONNECTOME = 10,
  ARCH_DECOUPLED_FLY_CORTEX = 11
};

enum EvoTopologyMode : int {
  EVO_SINGLE_SPECIES = 0,
  EVO_ISLAND_SPECIATION = 1
};

enum ComputeProfileId : int {
  PROFILE_GPU_LOCKSTEP = 0,
  PROFILE_CPU_SPECIALIZED = 1
};

// Precision IDs
enum PrecId : int {
  PREC_FP32 = 0,
  PREC_FP16 = 1,
  PREC_INT8 = 2,
  PREC_INT4 = 3,
  PREC_TERNARY = 4,
  PREC_BINARY = 5
};

// Optimizer IDs
enum AlgoId : int {
  ALGO_GA = 0,
  ALGO_DE = 1,
  ALGO_PSO = 2,
  ALGO_CMA_HYBRID = 3,
  ALGO_CEM = 4,
  ALGO_ADAPTIVE_ES = 5,
  ALGO_NATURAL_ES = 6,
  ALGO_ADAM_ES = 7
};

// Failure cause IDs
enum FailCauseId : int {
  FAIL_NONE = 0,
  FAIL_FLOOR = 1,
  FAIL_CEILING = 2,
  FAIL_PIPE_TOP = 3,
  FAIL_PIPE_BOTTOM = 4
};

// Limits supported in register-friendly GPU kernel
static constexpr int MAX_LAYERS = 6;       // input + up to 4 hidden + output
static constexpr int MAX_WIDTH = 32;       // max neurons per layer
static constexpr int MAX_STATE = 32;       // max total stateful hidden neurons
static constexpr int MAX_PARAMS = 2048;    // max parameters per network
static constexpr int MAX_SENSORS = 12;

struct EnvParams {
  double gap;
  double gapVariance;
  double pipeSpeed;
  double speedVariability;
  double spawnFrames;
  int movingPipes;
  double moveAmplitude;
  double gravityScale;
};

struct TrialTask {
  int algorithm;
  int architecture;
  int weightPrecision;
  int populationSize;
  int maxGenerations;
  int stagnationLimit;     // <= 0 means disabled
  int targetPipeCap;
  int verificationSeeds;
  int curriculumLearning;
  int curriculumGenerations;
  int shapedFitness;
  int reasoningSteps;
  int inputCount;
  int inputIndices[MAX_SENSORS];
  int hiddenDepth;
  int hiddenLayers[5];
  double mutationRate;
  double mutationStrength;
  EnvParams env;
  uint32_t trialSeed;
  int auditFloat32; // 1 = ultra-fast GPU FP32 audit, 0 = bit-exact CPU FP64 audit
  // Morphogenesis settings
  int morphogenesisEnabled;
  int progressiveSensors;
  int growReasoningSteps;
  int growthStagnationTrigger;
  double initialWidthRatio;
  double saturationThreshold;
  double myelinationScale;
  double pruneThreshold;
  double pruneSparsityTrigger;
  double metabolicStepCost;
  // Compute-justified plasticity & Island Speciation
  int evolutionTopologyMode; // 0=SINGLE_SPECIES, 1=ISLAND_SPECIATION
  double flopsPenaltyWeight;
  int expertTrialWindowGens;
  double expertMinRoiGain;
  int allowExpertSpawning;
};

struct TrialOutput {
  int bestTrainScore;
  int minSeedScore;
  double meanSeedScore;
  int verifiedPerfect;
  int stoppedReason; // 0=PERFECT, 1=MAX_GENS, 2=STAGNATED
  double bestFitness;
  double finalAvgScore;
  int generationsRun;
  uint64_t trainingTicks;
  uint64_t auditTicks;
  int paramCount;
  int scoreCurveLen;
  int seedScoresLen;
  double durationMs;
  // Failure Autopsy
  int totalDeaths;
  int floorDeaths;
  int ceilingDeaths;
  int pipeTopDeaths;
  int pipeBottomDeaths;
  double avgDeathAbsVy;
  double avgDeathGapErr;
  int dominantFailure;
  // Reasoning Telemetry
  int hasReasoningTelemetry;
  double avgPonderSteps;
  double calmPonderSteps;
  double dangerPonderSteps;
  double system2Ratio;
  double avgRolloutAdvantage;
  double avgSsmGate;
  // Morphogenesis Summary
  int initialActiveParams;
  int finalActiveParams;
  int prunedSynapses;
  int growthEventsCount;
  int pruneEventsCount;
  int finalReasoningSteps;
  int finalActiveSensors;
  int finalHiddenLayers[5];
  // Compute-Justified Multi-Arch Plasticity & Hardware Routing
  int computeProfile; // 0=GPU_LOCKSTEP, 1=CPU_SPECIALIZED
  double meanFlopsPerFrame;
  int rollbackCount;
  int committedExpertsCount;
  int winningSpecies; // -1 if single-species, else ArchId
  int rebalanceCount;
  int activeExpertsMask; // bitmask 0..7 for HYBRID_MOE
};

struct BatchPerfCounters {
  double gpuKernelMs;
  double hostOptimizerMs;
  double f64AuditMs;
  double totalWallMs;
  uint64_t totalTrainingTicks;
  uint64_t totalAuditTicks;
  int usedCuda;
};

// ============================================================================
// Exact Mulberry32 PRNG (identical to src/engine/physics.ts createSeededRng)
// ============================================================================
struct Mulberry32 {
  uint32_t a;
  HD Mulberry32() = default;
  HD explicit Mulberry32(uint32_t seed) : a(seed) {}
  HD inline double next_f64() {
    a = (uint32_t)(a + 0x6d2b79f5u);
    uint32_t t = (a ^ (a >> 15)) * (1u | a);
    t = (t + ((t ^ (t >> 7)) * (61u | t))) ^ t;
    uint32_t shifted = (t >> 14) | ((t & 0x80000000u) ? 0xFFFC0000u : 0u);
    return (double)(t ^ shifted) / 4294967296.0;
  }
  HD inline float next_f32() {
    return (float)next_f64();
  }
};

// Fast host xorshift64* for optimizer mutations/sampling (thread-safe per trial)
struct FastRng {
  uint64_t s;
  bool hasSpare;
  double spare;
  explicit FastRng(uint64_t seed) : s(seed ? seed : 0x9e3779b97f4a7c15ULL), hasSpare(false), spare(0.0) {}
  inline uint64_t next_u64() {
    uint64_t x = s;
    x ^= x >> 12;
    x ^= x << 25;
    x ^= x >> 27;
    s = x;
    return x * 0x2545F4914F6CDD1DULL;
  }
  inline double uniform() {
    return (double)(next_u64() >> 11) * (1.0 / 9007199254740992.0);
  }
  inline int rand_int(int bound) {
    return bound <= 1 ? 0 : (int)(next_u64() % (uint64_t)bound);
  }
  inline double randn() {
    if (hasSpare) {
      hasSpare = false;
      return spare;
    }
    double u = uniform();
    if (u < 1e-12) u = 1e-12;
    double v = uniform();
    double mag = std::sqrt(-2.0 * std::log(u));
    double ang = K_TWO_PI * v;
    spare = mag * std::sin(ang);
    hasSpare = true;
    return mag * std::cos(ang);
  }
};

// ============================================================================
// Math & Quantization helpers (identical to src/engine/neuralNetwork.ts)
// ============================================================================
HD inline float fast_tanh_f32(float x) {
  if (x >= 3.8f) return 1.0f;
  if (x <= -3.8f) return -1.0f;
  float x2 = x * x;
  float v = (x * (945.0f + x2 * (105.0f + x2))) / (945.0f + x2 * (420.0f + 15.0f * x2));
  return v > 1.0f ? 1.0f : (v < -1.0f ? -1.0f : v);
}

HD inline float fast_sigmoid_f32(float x) {
  return 0.5f + 0.5f * fast_tanh_f32(0.5f * x);
}

HD inline double exact_sigmoid_f64(double x) {
  if (x < -40.0) return 0.0;
  if (x > 40.0) return 1.0;
  return 1.0 / (1.0 + exp(-x));
}

HD inline double quantize_scalar(double v, int prec) {
  if (prec == PREC_FP32) return v;
  if (prec == PREC_BINARY) return v >= 0.0 ? 1.0 : -1.0;
  if (prec == PREC_TERNARY) {
    if (v > 0.35) return 1.0;
    if (v < -0.35) return -1.0;
    return 0.0;
  }
  if (prec == PREC_INT4) {
    double q = floor(v * 2.0 + 0.5) * 0.5;
    if (q < -3.5) q = -3.5;
    else if (q > 4.0) q = 4.0;
    return q;
  }
  if (prec == PREC_INT8) {
    double q = floor(v * 32.0 + 0.5) * 0.03125;
    if (q < -4.0) q = -4.0;
    else if (q > 3.96875) q = 3.96875;
    return q;
  }
  // FP16
  if (v == 0.0) return 0.0;
  double c = v < -65504.0 ? -65504.0 : (v > 65504.0 ? 65504.0 : v);
  double av = fabs(c);
  if (av < 6.103515625e-5) {
    return floor(c * 16777216.0 + 0.5) / 16777216.0;
  }
  double ex = floor(log2(av));
  double sc = pow(2.0, 10.0 - ex);
  return floor(c * sc + 0.5) / sc;
}

HD inline int hybrid_expert_hidden(int hiddenDepth, const int* hiddenLayers) {
  int firstW = hiddenDepth > 0 ? hiddenLayers[0] : 4;
  return firstW < 3 ? 3 : (firstW > 6 ? 6 : firstW);
}

HD inline int calc_bio_params(int hiddenDepth, const int* hiddenLayers, int inputCount, int arch) {
  int totalH = 0;
  for (int i = 0; i < hiddenDepth; i++) totalH += hiddenLayers[i];
  if (arch == ARCH_MLP) return 0;
  if (arch == ARCH_RESIDUAL_SKIP) return hiddenDepth > 0 ? inputCount : 0;
  int bioNodes = totalH > 0 ? totalH : 1;
  int lastH = hiddenDepth > 0 ? hiddenLayers[hiddenDepth - 1] : 1;
  if (arch == ARCH_LTC_FLY) return bioNodes * 2;
  if (arch == ARCH_NEUROCHEM_GATE) return bioNodes * 3;
  if (arch == ARCH_SYNAPTIC_STP) return bioNodes * 2;
  if (arch == ARCH_LOOPED_REASONER) return lastH * lastH + lastH * 2;
  if (arch == ARCH_PONDER_ACT) return lastH * lastH + lastH * 3 + 1;
  if (arch == ARCH_SELECTIVE_SSM) return bioNodes * 3;
  if (arch == ARCH_LATENT_ROLLOUT) return lastH * lastH + lastH * 3;
  if (arch == ARCH_DROSOPHILA_CONNECTOME) {
    int gfLen = hiddenDepth > 0 ? inputCount : 0;
    return bioNodes * 2 + gfLen + 4;
  }
  if (arch == ARCH_DECOUPLED_FLY_CORTEX) {
    int gfLen = hiddenDepth > 0 ? inputCount : 0;
    return bioNodes * 2 + gfLen + 16 + 4;
  }
  if (arch == ARCH_HYBRID_MOE) {
    int he = hybrid_expert_hidden(hiddenDepth, hiddenLayers);
    int routerLen = inputCount * 4 + 4;
    int e0Len = inputCount * he + he + he + 1 + he * 2 + 1;
    int e1Len = inputCount * he + he + he + 1 + he * 3 + 1;
    int e2Len = inputCount * he + he + he + 1 + (he * he + he * 3 + 1) + 1;
    return routerLen + e0Len + e1Len + e2Len;
  }
  return 0;
}

HD inline int calc_param_count(int inputCount, int hiddenDepth, const int* hiddenLayers, int arch) {
  int dims[MAX_LAYERS];
  dims[0] = inputCount;
  for (int i = 0; i < hiddenDepth; i++) dims[i + 1] = hiddenLayers[i];
  dims[hiddenDepth + 1] = 1;
  int total = 0;
  for (int l = 0; l <= hiddenDepth; l++) {
    total += dims[l] * dims[l + 1] + dims[l + 1];
  }
  total += calc_bio_params(hiddenDepth, hiddenLayers, inputCount, arch);
  return total;
}

HD inline double estimate_arch_flops(
    int inputCount,
    int hiddenDepth,
    const int* hiddenLayers,
    int arch,
    int reasoningSteps,
    int hybridMaskBits = 0) {
  int dims[MAX_LAYERS];
  dims[0] = inputCount;
  for (int i = 0; i < hiddenDepth; i++) dims[i + 1] = hiddenLayers[i];
  dims[hiddenDepth + 1] = 1;
  int macs = 0;
  int neurons = 0;
  for (int l = 0; l <= hiddenDepth; l++) {
    macs += dims[l] * dims[l + 1];
    neurons += dims[l + 1];
  }
  double coreFlops = (double)(macs * 2 + neurons * 4);
  if (arch == ARCH_MLP) return coreFlops;
  if (arch == ARCH_RESIDUAL_SKIP) return coreFlops + (double)(inputCount * 2);
  int bioN = neurons > 1 ? neurons - 1 : 1;
  if (arch == ARCH_LTC_FLY) return coreFlops + (double)(bioN * 9);
  if (arch == ARCH_NEUROCHEM_GATE) return coreFlops + (double)(bioN * 12);
  if (arch == ARCH_SYNAPTIC_STP) return coreFlops + (double)(bioN * 11);
  if (arch == ARCH_SELECTIVE_SSM) return coreFlops + (double)(bioN * 14);
  if (arch == ARCH_DROSOPHILA_CONNECTOME) {
    return coreFlops + (double)(bioN * 12 + (hiddenDepth > 0 ? inputCount * 2 : 0) + 8);
  }
  if (arch == ARCH_DECOUPLED_FLY_CORTEX) {
    return coreFlops + (double)(bioN * 14 + (hiddenDepth > 0 ? inputCount * 2 : 0) + 28);
  }
  int lastH = hiddenDepth > 0 ? hiddenLayers[hiddenDepth - 1] : 1;
  int kSteps = reasoningSteps < 1 ? 1 : (reasoningSteps > 8 ? 8 : reasoningSteps);
  if (arch == ARCH_LOOPED_REASONER) return coreFlops + (double)kSteps * (double)(lastH * lastH * 2 + lastH * 8);
  if (arch == ARCH_PONDER_ACT) return coreFlops + (double)kSteps * (double)(lastH * lastH * 2 + lastH * 11);
  if (arch == ARCH_LATENT_ROLLOUT) return coreFlops + 4.0 * (double)(lastH * lastH * 2 + lastH * 8);
  if (arch == ARCH_HYBRID_MOE) {
    if ((hybridMaskBits & 7) == 0) return coreFlops;
    int he = hybrid_expert_hidden(hiddenDepth, hiddenLayers);
    double total = coreFlops + (double)(inputCount * 8 + 16);
    double baseExp = (double)((inputCount * he + he) * 2 + he * 4);
    if (hybridMaskBits & 1) total += baseExp + (double)(he * 9);
    if (hybridMaskBits & 2) total += baseExp + (double)(he * 14);
    if (hybridMaskBits & 4) {
      int pk = kSteps < 3 ? kSteps : 3;
      total += baseExp + (double)pk * (double)(he * he * 2 + he * 11);
    }
    return total;
  }
  return coreFlops;
}

HD inline EnvParams resolve_curriculum_env(const EnvParams& target, int gen, int rampGens) {
  int rg = rampGens < 2 ? 2 : rampGens;
  double rawP = (double)((gen < 1 ? 1 : gen) - 1) / (double)(rg - 1);
  if (rawP >= 1.0) return target;
  if (rawP < 0.0) rawP = 0.0;
  double t = 0.5 - 0.5 * cos(K_PI * rawP);
  double startGap = target.gap + 28.0;
  if (startGap > 162.0) startGap = 162.0;
  if (startGap < target.gap) startGap = target.gap;
  double startSpeed = target.pipeSpeed > 3.15 ? (target.pipeSpeed * 0.88 > 3.0 ? target.pipeSpeed * 0.88 : 3.0) : target.pipeSpeed;
  EnvParams out = target;
  out.gap = startGap + (target.gap - startGap) * t;
  out.gapVariance = target.gapVariance * (0.25 + 0.75 * t);
  out.pipeSpeed = startSpeed + (target.pipeSpeed - startSpeed) * t;
  out.speedVariability = target.speedVariability * (0.25 + 0.75 * t);
  out.moveAmplitude = target.movingPipes ? target.moveAmplitude * (0.2 + 0.8 * t) : 0.0;
  return out;
}

// ============================================================================
// Unified Templated Forward Pass (Float32 for GPU Training, Float64 for Audit)
// Supports ALL 9 architectures and Depth 0..4 identically!
// ============================================================================
template <typename T, bool FastMath>
HD inline T act_tanh(T x) {
  if constexpr (FastMath) {
    return (T)fast_tanh_f32((float)x);
  } else {
    return (T)tanh((double)x);
  }
}

template <typename T, bool FastMath>
HD inline T act_sigmoid(T x) {
  if constexpr (FastMath) {
    return (T)fast_sigmoid_f32((float)x);
  } else {
    return (T)exact_sigmoid_f64((double)x);
  }
}

struct ReasoningStepStats {
  double ponderSteps;
  double rolloutAdvantage;
  double ssmGateMean;
};

template <typename T, bool FastMath>
HD inline T forward_network(
    const T* params,
    int inputCount,
    int hiddenDepth,
    const int* hiddenLayers,
    int arch,
    int reasoningSteps,
    const T* inp,
    T* state,
    ReasoningStepStats* rstats,
    T* outHiddenActs = nullptr) {
  int dims[MAX_LAYERS];
  dims[0] = inputCount;
  int totalHidden = 0;
  for (int i = 0; i < hiddenDepth; i++) {
    dims[i + 1] = hiddenLayers[i];
    totalHidden += hiddenLayers[i];
  }
  dims[hiddenDepth + 1] = 1;
  int transitions = hiddenDepth + 1;

  // Compute offset of bioParams
  int bioOffset = 0;
  for (int l = 0; l < transitions; l++) {
    bioOffset += dims[l] * dims[l + 1] + dims[l + 1];
  }
  const T* bio = params + bioOffset;

  T bufA[MAX_WIDTH];
  T bufB[MAX_WIDTH];
  for (int i = 0; i < inputCount; i++) bufA[i] = inp[i];
  T* cur = bufA;
  T* nxt = bufB;

  if (arch == ARCH_DROSOPHILA_CONNECTOME) {
    T absInSum = (T)0;
    for (int i = 0; i < inputCount; i++) {
      T v = inp[i];
      absInSum += v < (T)0 ? -v : v;
    }
    T meanAbsIn = absInSum / (T)inputCount;
    int bioNodes = totalHidden > 0 ? totalHidden : 1;
    int gfOff = bioNodes * 2;
    int tailOff = gfOff + (hiddenDepth > 0 ? inputCount : 0);
    T oaBeta = act_sigmoid<T, FastMath>(bio[tailOff + 1]);
    T oaAct = act_tanh<T, FastMath>(bio[tailOff + 2] * meanAbsIn);
    T oaTone = ((T)1 - oaBeta) * state[bioNodes] + oaBeta * oaAct;
    state[bioNodes] = oaTone;
    T rawMod = (T)1 + bio[tailOff + 3] * oaTone;
    T oaMod = rawMod < (T)0.25 ? (T)0.25 : (rawMod > (T)2.25 ? (T)2.25 : rawMod);

    if (hiddenDepth == 0) {
      const T* outW0 = params;
      T outB0 = params[inputCount];
      T sum = outB0;
      for (int i = 0; i < inputCount; i++) sum += inp[i] * outW0[i];
      T a = act_sigmoid<T, FastMath>(bio[0]);
      T prevH = state[0];
      T nh = ((T)1 - a) * prevH + a * act_tanh<T, FastMath>(sum * oaMod + bio[1] * prevH);
      state[0] = nh;
      return nh * (T)4.0;
    }

    T aplGamma = (T)0.5 * act_sigmoid<T, FastMath>(bio[tailOff]);
    int off = 0;
    int stCur = 0;
    for (int l = 0; l < hiddenDepth; l++) {
      int inD = dims[l];
      int outD = dims[l + 1];
      const T* W = params + off;
      off += inD * outD;
      const T* B = params + off;
      off += outD;
      T layerSum = (T)0;
      for (int j = 0; j < outD; j++) {
        T sum = B[j];
        const T* row = W + j * inD;
        for (int i = 0; i < inD; i++) sum += cur[i] * row[i];
        int si = stCur + j;
        T a = act_sigmoid<T, FastMath>(bio[si * 2]);
        T prevH = state[si];
        T nh = ((T)1 - a) * prevH + a * act_tanh<T, FastMath>(sum * oaMod + bio[si * 2 + 1] * prevH);
        state[si] = nh;
        nxt[j] = nh;
        layerSum += nh;
      }
      T inh = aplGamma * (layerSum / (T)outD);
      for (int j = 0; j < outD; j++) {
        T v = nxt[j] - inh;
        nxt[j] = v < (T)-1 ? (T)-1 : (v > (T)1 ? (T)1 : v);
        if (outHiddenActs != nullptr) outHiddenActs[l * MAX_WIDTH + j] = nxt[j];
      }
      stCur += outD;
      T* tmp = cur;
      cur = nxt;
      nxt = tmp;
    }
    int lastD = dims[hiddenDepth];
    const T* outW = params + off;
    T outB = params[off + lastD];
    T outSum = outB;
    for (int i = 0; i < lastD; i++) outSum += cur[i] * outW[i];
    outSum *= oaMod;
    for (int i = 0; i < inputCount; i++) outSum += inp[i] * bio[gfOff + i];
    return outSum;
  }

  if (arch == ARCH_DECOUPLED_FLY_CORTEX) {
    T absInSum = (T)0;
    for (int i = 0; i < inputCount; i++) {
      T v = inp[i];
      absInSum += v < (T)0 ? -v : v;
    }
    T meanAbsIn = absInSum / (T)inputCount;
    int bioNodes = totalHidden > 0 ? totalHidden : 1;
    int gfLen = hiddenDepth > 0 ? inputCount : 0;
    int gfOff = bioNodes * 2;
    int memOff = gfOff + gfLen;
    int tailOff = memOff + 16;

    T aplGamma = (T)0.45 * act_sigmoid<T, FastMath>(bio[tailOff]);
    T memBeta = (T)1.8 * act_tanh<T, FastMath>(bio[tailOff + 1]);
    T s2Thresh = (T)0.18 + (T)0.45 * act_sigmoid<T, FastMath>(bio[tailOff + 2]);
    T oaGain = (T)0.35 + (T)0.85 * act_sigmoid<T, FastMath>(bio[tailOff + 3]);

    T prevArousal = state[bioNodes];
    T oaTone = (T)0.78 * prevArousal + (T)0.22 * act_tanh<T, FastMath>(oaGain * meanAbsIn);
    state[bioNodes] = oaTone;
    T rawMod = (T)1 + (T)0.65 * oaTone;
    T oaMod = rawMod < (T)0.35 ? (T)0.35 : (rawMod > (T)2.15 ? (T)2.15 : rawMod);

    T bestScore1 = (T)-1e9, bestScore2 = (T)-1e9;
    int slot1 = 0, slot2 = 1;
    for (int s = 0; s < 16; s++) {
      int i0 = (s * 3) % inputCount;
      int i1 = (s * 5 + 1) % inputCount;
      int i2 = (s * 7 + 2) % inputCount;
      T s0 = (s & 1) == 0 ? (T)1 : (T)-1;
      T s1 = (s & 2) == 0 ? (T)1 : (T)-1;
      T s2 = (s & 4) == 0 ? (T)1 : (T)-1;
      T score = s0 * inp[i0] + (T)0.75 * s1 * inp[i1] + (T)0.5 * s2 * inp[i2];
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
    T expDiff = act_sigmoid<T, FastMath>((bestScore1 - bestScore2) * (T)2.5);
    T w1 = (T)0.5 + (T)0.45 * expDiff;
    T w2 = (T)1.0 - w1;
    T memReadout = w1 * bio[memOff + slot1] + w2 * bio[memOff + slot2];

    if (hiddenDepth == 0) {
      const T* outW0 = params;
      T outB0 = params[inputCount];
      T sum = outB0;
      for (int i = 0; i < inputCount; i++) sum += inp[i] * outW0[i];
      T a = act_sigmoid<T, FastMath>(bio[0]);
      T prevH = state[0];
      T nh = ((T)1 - a) * prevH + a * act_tanh<T, FastMath>(sum * oaMod + bio[1] * prevH + memBeta * memReadout);
      state[0] = nh;
      if (rstats) {
        T flux = nh - prevH;
        if (flux < (T)0) flux = -flux;
        rstats->ponderSteps = flux > s2Thresh ? 2.0 : 1.0;
        rstats->rolloutAdvantage = (double)memReadout;
        rstats->ssmGateMean = (double)w1;
      }
      return nh * (T)4.0;
    }

    int off = 0;
    int stCur = 0;
    T fluxSum = (T)0;
    for (int l = 0; l < hiddenDepth; l++) {
      int inD = dims[l];
      int outD = dims[l + 1];
      const T* W = params + off;
      off += inD * outD;
      const T* B = params + off;
      off += outD;
      T layerSum = (T)0;
      for (int j = 0; j < outD; j++) {
        T sum = B[j];
        const T* row = W + j * inD;
        for (int i = 0; i < inD; i++) sum += cur[i] * row[i];
        int si = stCur + j;
        T a = act_sigmoid<T, FastMath>(bio[si * 2]);
        T prevH = state[si];
        T nh = ((T)1 - a) * prevH + a * act_tanh<T, FastMath>(sum * oaMod + bio[si * 2 + 1] * prevH);
        T df = nh - prevH;
        fluxSum += df < (T)0 ? -df : df;
        state[si] = nh;
        nxt[j] = nh;
        layerSum += nh;
      }
      T inh = aplGamma * (layerSum / (T)outD);
      for (int j = 0; j < outD; j++) {
        T v = nxt[j] - inh;
        nxt[j] = v < (T)-1 ? (T)-1 : (v > (T)1 ? (T)1 : v);
        if (outHiddenActs != nullptr) outHiddenActs[l * MAX_WIDTH + j] = nxt[j];
      }
      stCur += outD;
      T* tmp = cur;
      cur = nxt;
      nxt = tmp;
    }

    T surprise = fluxSum / (T)bioNodes + (T)0.35 * meanAbsIn;
    bool s2 = (surprise >= s2Thresh);
    int lastD = dims[hiddenDepth];
    if (s2) {
      int lastCur = stCur - lastD;
      for (int j = 0; j < lastD; j++) {
        int si = lastCur + j;
        T a = act_sigmoid<T, FastMath>(bio[si * 2]);
        T recW = bio[si * 2 + 1];
        T refined = ((T)1 - (T)0.5 * a) * cur[j] + (T)0.5 * a * act_tanh<T, FastMath>(cur[j] * ((T)1 + recW) + (T)0.35 * memBeta * memReadout);
        cur[j] = refined;
        state[si] = refined;
      }
    }

    const T* outW = params + off;
    T outB = params[off + lastD];
    T outSum = outB;
    for (int i = 0; i < lastD; i++) outSum += cur[i] * outW[i];
    outSum = outSum * oaMod + memBeta * memReadout;
    for (int i = 0; i < inputCount; i++) outSum += inp[i] * bio[gfOff + i];
    if (rstats) {
      rstats->ponderSteps = s2 ? 2.0 : 1.0;
      rstats->rolloutAdvantage = (double)memReadout;
      rstats->ssmGateMean = (double)w1;
    }
    return outSum;
  }

  bool isPerNeuronStateful =
      (arch == ARCH_LTC_FLY || arch == ARCH_NEUROCHEM_GATE ||
       arch == ARCH_SYNAPTIC_STP || arch == ARCH_SELECTIVE_SSM);
  bool isLatentReasoning =
      (arch == ARCH_LOOPED_REASONER || arch == ARCH_PONDER_ACT ||
       arch == ARCH_LATENT_ROLLOUT);

  int offset = 0;
  int stateCursor = 0;
  double ssmGateAcc = 0.0;
  int ssmGateCnt = 0;

  // Forward through hidden layers
  for (int l = 0; l < hiddenDepth; l++) {
    int inD = dims[l];
    int outD = dims[l + 1];
    const T* W = params + offset;
    offset += inD * outD;
    const T* B = params + offset;
    offset += outD;

    bool isLastHidden = (l == hiddenDepth - 1);
    for (int j = 0; j < outD; j++) {
      T sum = B[j];
      const T* row = W + j * inD;
      for (int i = 0; i < inD; i++) sum += cur[i] * row[i];

      if (isLatentReasoning && isLastHidden) {
        // Store raw drive for recurrent reasoning block
        nxt[j] = sum;
      } else if (isPerNeuronStateful) {
        int si = stateCursor + j;
        if (arch == ARCH_LTC_FLY) {
          T a = act_sigmoid<T, FastMath>(bio[si * 2]);
          T prevH = state[si];
          T nh = ((T)1 - a) * prevH + a * act_tanh<T, FastMath>(sum + bio[si * 2 + 1] * prevH);
          state[si] = nh;
          nxt[j] = nh;
        } else if (arch == ARCH_NEUROCHEM_GATE) {
          int p = si * 3;
          T r = act_sigmoid<T, FastMath>(bio[p]);
          T nm = ((T)1 - r) * state[si] + r * act_tanh<T, FastMath>(bio[p + 1] * sum);
          state[si] = nm;
          T eff = bio[p + 2] * nm;
          T g = ((T)1 + eff) * act_tanh<T, FastMath>(sum + (T)0.5 * eff);
          if (g > (T)2) g = (T)2;
          else if (g < (T)-2) g = (T)-2;
          nxt[j] = g;
        } else if (arch == ARCH_SYNAPTIC_STP) {
          T act = act_tanh<T, FastMath>(sum);
          T absA = act < (T)0 ? -act : act;
          T r = (T)0.12 * act_sigmoid<T, FastMath>(bio[si * 2]);
          T prevU = state[si];
          T nu = prevU + r * ((T)1 - prevU) + bio[si * 2 + 1] * absA * ((T)1.5 - prevU) - (T)0.18 * absA * prevU;
          if (nu < (T)0.15) nu = (T)0.15;
          else if (nu > (T)2.0) nu = (T)2.0;
          state[si] = nu;
          nxt[j] = nu * act;
        } else {
          // ARCH_SELECTIVE_SSM
          int p = si * 3;
          T prevH = state[si];
          T z = act_sigmoid<T, FastMath>(bio[p] * sum + bio[p + 2] * prevH + bio[p + 1]);
          T nh = ((T)1 - z) * prevH + z * act_tanh<T, FastMath>(sum);
          state[si] = nh;
          nxt[j] = nh;
          ssmGateAcc += (double)z;
          ssmGateCnt += 1;
        }
      } else {
        nxt[j] = act_tanh<T, FastMath>(sum);
      }
    }
    stateCursor += outD;
    if (outHiddenActs != nullptr) {
      for (int j = 0; j < outD; j++) outHiddenActs[l * MAX_WIDTH + j] = nxt[j];
    }
    T* tmp = cur;
    cur = nxt;
    nxt = tmp;
  }

  // Output layer weights (dims[hiddenDepth] -> 1)
  int lastD = dims[hiddenDepth];
  const T* outW = params + offset;
  T outB = params[offset + lastD];

  if (!isLatentReasoning) {
    T outSum = outB;
    for (int i = 0; i < lastD; i++) outSum += cur[i] * outW[i];

    if (arch == ARCH_RESIDUAL_SKIP && hiddenDepth > 0) {
      for (int i = 0; i < inputCount; i++) outSum += inp[i] * bio[i];
      return outSum;
    }

    if (hiddenDepth == 0 && isPerNeuronStateful) {
      if (arch == ARCH_LTC_FLY) {
        T a = act_sigmoid<T, FastMath>(bio[0]);
        T prevH = state[0];
        T nh = ((T)1 - a) * prevH + a * act_tanh<T, FastMath>(outSum + bio[1] * prevH);
        state[0] = nh;
        return nh * (T)4.0;
      } else if (arch == ARCH_NEUROCHEM_GATE) {
        T r = act_sigmoid<T, FastMath>(bio[0]);
        T nm = ((T)1 - r) * state[0] + r * act_tanh<T, FastMath>(bio[1] * outSum);
        state[0] = nm;
        T g = bio[2];
        return ((T)1 + g * nm) * outSum + (T)0.5 * g * nm;
      } else if (arch == ARCH_SYNAPTIC_STP) {
        T act = act_tanh<T, FastMath>(outSum);
        T absA = act < (T)0 ? -act : act;
        T r = (T)0.12 * act_sigmoid<T, FastMath>(bio[0]);
        T prevU = state[0];
        T nu = prevU + r * ((T)1 - prevU) + bio[1] * absA * ((T)1.5 - prevU) - (T)0.18 * absA * prevU;
        if (nu < (T)0.15) nu = (T)0.15;
        else if (nu > (T)2.0) nu = (T)2.0;
        state[0] = nu;
        return nu * outSum;
      } else {
        // ARCH_SELECTIVE_SSM D0
        T prevH = state[0];
        T z = act_sigmoid<T, FastMath>(bio[0] * outSum + bio[2] * prevH + bio[1]);
        T nh = ((T)1 - z) * prevH + z * act_tanh<T, FastMath>(outSum);
        state[0] = nh;
        if (rstats) {
          rstats->ponderSteps = 1.0;
          rstats->rolloutAdvantage = 0.0;
          rstats->ssmGateMean = (double)z;
        }
        return nh * (T)4.0;
      }
    }

    if (rstats && arch == ARCH_SELECTIVE_SSM) {
      rstats->ponderSteps = 1.0;
      rstats->rolloutAdvantage = 0.0;
      rstats->ssmGateMean = ssmGateCnt > 0 ? (ssmGateAcc / (double)ssmGateCnt) : 0.5;
    }
    return outSum;
  }

  // Latent-Space Reasoning Architectures (LOOPED_REASONER, PONDER_ACT, LATENT_ROLLOUT)
  int H = hiddenDepth > 0 ? hiddenLayers[hiddenDepth - 1] : 1;
  T drive[MAX_WIDTH];
  if (hiddenDepth == 0) {
    T s = outB;
    for (int i = 0; i < inputCount; i++) s += inp[i] * outW[i];
    drive[0] = s;
  } else {
    for (int j = 0; j < H; j++) drive[j] = cur[j];
  }

  if (arch == ARCH_LOOPED_REASONER) {
    T nextH[MAX_WIDTH];
    int bRecOff = H * H;
    int alphaOff = H * H + H;
    int K = reasoningSteps < 1 ? 1 : (reasoningSteps > 8 ? 8 : reasoningSteps);
    for (int step = 0; step < K; step++) {
      for (int j = 0; j < H; j++) {
        T s = drive[j] + bio[bRecOff + j];
        const T* row = bio + j * H;
        for (int i = 0; i < H; i++) s += row[i] * state[i];
        T a = act_sigmoid<T, FastMath>(bio[alphaOff + j]);
        nextH[j] = ((T)1 - a) * state[j] + a * act_tanh<T, FastMath>(s);
      }
      for (int j = 0; j < H; j++) state[j] = nextH[j];
    }
    if (rstats) {
      rstats->ponderSteps = (double)K;
      rstats->rolloutAdvantage = 0.0;
      rstats->ssmGateMean = 0.5;
    }
    if (outHiddenActs != nullptr && hiddenDepth > 0) {
      for (int j = 0; j < H; j++) outHiddenActs[(hiddenDepth - 1) * MAX_WIDTH + j] = state[j];
    }
    if (hiddenDepth == 0) return state[0] * (T)4.0;
    T outSum = outB;
    for (int j = 0; j < H; j++) outSum += state[j] * outW[j];
    return outSum;
  }

  if (arch == ARCH_PONDER_ACT) {
    T nextH[MAX_WIDTH];
    int bRecOff = H * H;
    int alphaOff = H * H + H;
    int wHaltOff = H * H + H * 2;
    T bHalt = bio[wHaltOff + H];
    int maxK = reasoningSteps < 2 ? 2 : (reasoningSteps > 8 ? 8 : reasoningSteps);
    T remain = (T)1.0;
    T cumHalt = (T)0.0;
    T outAcc = (T)0.0;
    int executedSteps = 0;

    for (int step = 0; step < maxK; step++) {
      executedSteps = step + 1;
      T fluxSum = (T)0.0;
      for (int j = 0; j < H; j++) {
        T s = drive[j] + bio[bRecOff + j];
        const T* row = bio + j * H;
        for (int i = 0; i < H; i++) s += row[i] * state[i];
        T a = act_sigmoid<T, FastMath>(bio[alphaOff + j]);
        T nh = ((T)1 - a) * state[j] + a * act_tanh<T, FastMath>(s);
        nextH[j] = nh;
        T df = nh - state[j];
        fluxSum += df < (T)0 ? -df : df;
      }
      for (int j = 0; j < H; j++) state[j] = nextH[j];

      T stepLogit = hiddenDepth == 0 ? state[0] * (T)4.0 : outB;
      if (hiddenDepth > 0) {
        for (int j = 0; j < H; j++) stepLogit += state[j] * outW[j];
      }
      if (step == maxK - 1) {
        outAcc += remain * stepLogit;
        break;
      }
      T meanFlux = fluxSum / (T)H;
      T haltLogit = bHalt + (T)1.35 - (T)3.2 * meanFlux;
      for (int j = 0; j < H; j++) haltLogit += bio[wHaltOff + j] * state[j];
      T pHalt = act_sigmoid<T, FastMath>(haltLogit);
      T sw = remain * pHalt;
      if (cumHalt + sw >= (T)0.68) {
        outAcc += remain * stepLogit;
        break;
      }
      outAcc += sw * stepLogit;
      cumHalt += sw;
      remain -= sw;
    }
    if (rstats) {
      rstats->ponderSteps = (double)executedSteps;
      rstats->rolloutAdvantage = 0.0;
      rstats->ssmGateMean = 0.5;
    }
    if (outHiddenActs != nullptr && hiddenDepth > 0) {
      for (int j = 0; j < H; j++) outHiddenActs[(hiddenDepth - 1) * MAX_WIDTH + j] = state[j];
    }
    return outAcc;
  }

  // ARCH_LATENT_ROLLOUT
  T sJump[MAX_WIDTH];
  T sWait[MAX_WIDTH];
  int wActOff = H * H;
  int bDynOff = H * H + H;
  int wValOff = H * H + H * 2;

  for (int j = 0; j < H; j++) {
    state[j] = (T)0.45 * state[j] + (T)0.55 * act_tanh<T, FastMath>(drive[j]);
  }
  T vJump = (T)0.0;
  T vWait = (T)0.0;
  for (int j = 0; j < H; j++) {
    T base = bio[bDynOff + j];
    const T* row = bio + j * H;
    for (int i = 0; i < H; i++) base += row[i] * state[i];
    T actShift = bio[wActOff + j];
    T j1 = act_tanh<T, FastMath>(base + actShift);
    T w1 = act_tanh<T, FastMath>(base - actShift);
    sJump[j] = j1;
    sWait[j] = w1;
    T immW = hiddenDepth > 0 ? outW[j] : (T)1.0;
    vJump += j1 * immW;
    vWait += w1 * immW;
  }
  for (int j = 0; j < H; j++) {
    T baseBias = bio[bDynOff + j] - (T)0.5 * bio[wActOff + j];
    T sumJ = baseBias;
    T sumW = baseBias;
    const T* row = bio + j * H;
    for (int i = 0; i < H; i++) {
      T wd = row[i];
      sumJ += wd * sJump[i];
      sumW += wd * sWait[i];
    }
    T valW = bio[wValOff + j];
    vJump += act_tanh<T, FastMath>(sumJ) * valW;
    vWait += act_tanh<T, FastMath>(sumW) * valW;
  }
  T outSum = vJump - vWait + (hiddenDepth > 0 ? outB : (T)0.0);
  const T* chosen = outSum > (T)0 ? sJump : sWait;
  for (int j = 0; j < H; j++) state[j] = chosen[j];
  if (rstats) {
    rstats->ponderSteps = 2.0;
    rstats->rolloutAdvantage = (double)(vJump - vWait);
    rstats->ssmGateMean = 0.5;
  }
  if (outHiddenActs != nullptr && hiddenDepth > 0) {
    for (int j = 0; j < H; j++) outHiddenActs[(hiddenDepth - 1) * MAX_WIDTH + j] = state[j];
  }
  return outSum;
}

template <typename T, bool FastMath>
HD inline T forward_hybrid_moe(
    const T* params,
    int inputCount,
    int hiddenDepth,
    const int* hiddenLayers,
    int reasoningSteps,
    const T* inp,
    T* state,
    int hybridMaskBits,
    ReasoningStepStats* rstats,
    T* outHiddenActs = nullptr,
    double* outFrameFlops = nullptr) {
  T coreLogit = forward_network<T, FastMath>(
      params, inputCount, hiddenDepth, hiddenLayers,
      ARCH_MLP, 1, inp, state, nullptr, outHiddenActs);
  double baseMlpFlops = estimate_arch_flops(inputCount, hiddenDepth, hiddenLayers, ARCH_MLP, 1, 0);
  if ((hybridMaskBits & 7) == 0) {
    if (rstats) {
      rstats->ponderSteps = 1.0;
      rstats->rolloutAdvantage = 0.0;
      rstats->ssmGateMean = 0.5;
    }
    if (outFrameFlops) *outFrameFlops = baseMlpFlops;
    return coreLogit;
  }

  int bioOffset = 0;
  int prevD = inputCount;
  for (int l = 0; l < hiddenDepth; l++) {
    bioOffset += prevD * hiddenLayers[l] + hiddenLayers[l];
    prevD = hiddenLayers[l];
  }
  bioOffset += prevD + 1;
  const T* bio = params + bioOffset;
  int He = hybrid_expert_hidden(hiddenDepth, hiddenLayers);

  int routerWLen = inputCount * 4;
  int routerBStart = routerWLen;
  int cur = routerBStart + 4;

  T scores[4] = {(T)0, (T)-1e9, (T)-1e9, (T)-1e9};
  T maxScore = (T)-1e9;
  for (int m = 0; m < 4; m++) {
    if (m > 0 && ((hybridMaskBits & (1 << (m - 1))) == 0)) continue;
    T s = bio[routerBStart + m];
    int off = m * inputCount;
    for (int i = 0; i < inputCount; i++) s += inp[i] * bio[off + i];
    if (s > (T)12) s = (T)12;
    else if (s < (T)-12) s = (T)-12;
    scores[m] = s;
    if (s > maxScore) maxScore = s;
  }
  double rw[4] = {0.0, 0.0, 0.0, 0.0};
  double expSum = 0.0;
  for (int m = 0; m < 4; m++) {
    if (m > 0 && ((hybridMaskBits & (1 << (m - 1))) == 0)) continue;
    double e = exp((double)(scores[m] - maxScore));
    rw[m] = e;
    expSum += e;
  }
  double invSum = expSum > 0.0 ? 1.0 / expSum : 1.0;
  for (int m = 0; m < 4; m++) rw[m] *= invSum;

  T totalLogit = coreLogit;
  double frameFlops = baseMlpFlops + (double)(inputCount * 8 + 16);
  double execSteps = 1.0;
  double ssmMean = 0.5;

  // Expert 0: LTC_FLY
  int e0wIH = cur; cur += inputCount * He;
  int e0bH = cur; cur += He;
  int e0wHO = cur; cur += He;
  int e0bO = cur++;
  int e0bio = cur; cur += He * 2;
  int e0alpha = cur++;
  if (hybridMaskBits & 1) {
    T exOut = bio[e0bO];
    for (int j = 0; j < He; j++) {
      T sum = bio[e0bH + j];
      int off = e0wIH + j * inputCount;
      for (int i = 0; i < inputCount; i++) sum += inp[i] * bio[off + i];
      T prevH = state[j];
      T a = act_sigmoid<T, FastMath>(bio[e0bio + j * 2]);
      T nh = ((T)1 - a) * prevH + a * act_tanh<T, FastMath>(sum + bio[e0bio + j * 2 + 1] * prevH);
      state[j] = nh;
      exOut += nh * bio[e0wHO + j];
    }
    T alpha = act_tanh<T, FastMath>(bio[e0alpha]);
    totalLogit += alpha * (T)rw[1] * exOut;
    frameFlops += (double)((inputCount * He + He) * 2 + He * 13);
  }

  // Expert 1: SELECTIVE_SSM
  int e1wIH = cur; cur += inputCount * He;
  int e1bH = cur; cur += He;
  int e1wHO = cur; cur += He;
  int e1bO = cur++;
  int e1bio = cur; cur += He * 3;
  int e1alpha = cur++;
  if (hybridMaskBits & 2) {
    T exOut = bio[e1bO];
    double gSum = 0.0;
    for (int j = 0; j < He; j++) {
      T sum = bio[e1bH + j];
      int off = e1wIH + j * inputCount;
      for (int i = 0; i < inputCount; i++) sum += inp[i] * bio[off + i];
      int sIdx = He + j;
      int pOff = e1bio + j * 3;
      T prevH = state[sIdx];
      T z = act_sigmoid<T, FastMath>(bio[pOff] * sum + bio[pOff + 2] * prevH + bio[pOff + 1]);
      T nh = ((T)1 - z) * prevH + z * act_tanh<T, FastMath>(sum);
      state[sIdx] = nh;
      gSum += (double)z;
      exOut += nh * bio[e1wHO + j];
    }
    ssmMean = gSum / (double)He;
    T alpha = act_tanh<T, FastMath>(bio[e1alpha]);
    totalLogit += alpha * (T)rw[2] * exOut;
    frameFlops += (double)((inputCount * He + He) * 2 + He * 18);
  }

  // Expert 2: PONDER_ACT
  int e2wIH = cur; cur += inputCount * He;
  int e2bH = cur; cur += He;
  int e2wHO = cur; cur += He;
  int e2bO = cur++;
  int e2bio = cur;
  cur += He * He + He * 3 + 1;
  int e2alpha = cur++;
  if (hybridMaskBits & 4) {
    T drive[8];
    T nextH[8];
    for (int j = 0; j < He; j++) {
      T sum = bio[e2bH + j];
      int off = e2wIH + j * inputCount;
      for (int i = 0; i < inputCount; i++) sum += inp[i] * bio[off + i];
      drive[j] = sum;
    }
    int maxK = reasoningSteps < 2 ? 2 : (reasoningSteps > 3 ? 3 : reasoningSteps);
    int bRecOff = e2bio + He * He;
    int alphaOff = bRecOff + He;
    int wHaltOff = alphaOff + He;
    T bHalt = bio[wHaltOff + He];
    int stBase = He * 2;
    T remain = (T)1.0;
    T cumHalt = (T)0.0;
    T exOutAcc = (T)0.0;
    int stepsUsed = maxK;

    for (int step = 0; step < maxK; step++) {
      for (int j = 0; j < He; j++) {
        T sum = drive[j] + bio[bRecOff + j];
        int rOff = e2bio + j * He;
        for (int i = 0; i < He; i++) sum += bio[rOff + i] * state[stBase + i];
        T a = act_sigmoid<T, FastMath>(bio[alphaOff + j]);
        nextH[j] = ((T)1 - a) * state[stBase + j] + a * act_tanh<T, FastMath>(sum);
      }
      for (int j = 0; j < He; j++) state[stBase + j] = nextH[j];
      T stepLogit = bio[e2bO];
      for (int j = 0; j < He; j++) stepLogit += state[stBase + j] * bio[e2wHO + j];
      if (step == maxK - 1) {
        exOutAcc += remain * stepLogit;
        stepsUsed = maxK;
        break;
      }
      T hLogit = bHalt;
      for (int j = 0; j < He; j++) hLogit += bio[wHaltOff + j] * state[stBase + j];
      T pHalt = act_sigmoid<T, FastMath>(hLogit);
      T sw = remain * pHalt;
      if (cumHalt + sw >= (T)0.92) {
        exOutAcc += remain * stepLogit;
        stepsUsed = step + 1;
        break;
      }
      exOutAcc += sw * stepLogit;
      cumHalt += sw;
      remain -= sw;
    }
    execSteps = (double)stepsUsed;
    T alpha = act_tanh<T, FastMath>(bio[e2alpha]);
    totalLogit += alpha * (T)rw[3] * exOutAcc;
    frameFlops += (double)((inputCount * He + He) * 2 + stepsUsed * (He * He * 2 + He * 11));
  }

  if (rstats) {
    rstats->ponderSteps = execSteps;
    rstats->rolloutAdvantage = 0.0;
    rstats->ssmGateMean = ssmMean;
  }
  if (outFrameFlops) *outFrameFlops = frameFlops;
  return totalLogit;
}

// ============================================================================
// GPU Lockstep Batch Evaluation Descriptor & Kernel
// 1 Block = 1 Active Trial Generation; Threads = Birds in Population (Parallel!)
// Thread 0 computes shared pipe physics ONCE per tick in __shared__ memory!
// ============================================================================
struct GpuEvalJob {
  int popSize;
  int paramCount;
  int weightOffset;     // offset in d_weights (floats)
  int resultOffset;     // offset in d_scores / d_fitness
  int architecture;
  int reasoningSteps;
  int inputCount;
  int inputIndices[MAX_SENSORS];
  int hiddenDepth;
  int hiddenLayers[5];
  int shapedFitness;
  int maxFrames;
  int pipeCap;
  uint32_t seed;
  // Active env (already curriculum-annealed for this generation)
  float baseGap;
  float gapVar;
  float baseSpeed;
  float speedVar;
  float baseSpacing;
  int movingPipes;
  float moveAmp;
  float gravity;
  float jumpImpulse;
  float metabolicStepCost;
  int hybridMaskBits;
  float excessFlopsCost;
};

#ifdef __CUDACC__
struct SharedPipeFrame {
  // Ring buffer (only touched by thread 0)
  double px[16], pBaseTop[16], pGap[16], pTop[16], pBot[16], pPhase[16], pVy[16];
  int pId[16];
  int head, count, pipeCounter;
  double distUntilNextSpawn;
  double speedPhaseA, speedPhaseB;
  Mulberry32 rng;
  // Broadcast fields read by all bird threads
  int hasNextPipe;
  float gapTop, gapBot, gapCenter, pipeEdgeX, gapVy, next2GapCenter;
  float next2GapTop, next2GapBot, next2EdgeX, next2GapVy, curTickSpeed;
  int hasNext2;
  int pipeHorizHit;
  float pipeEffY;
  int passedFirstPipe;
  int firstPipeId;
  int aliveCount;
  int maxScoreReached;
  unsigned long long ticksAccum;
};

__global__ void eval_population_lockstep_kernel(
    const GpuEvalJob* jobs,
    const float* allWeights,
    int* outScores,
    float* outFitness,
    unsigned long long* outTicks) {
  int jobIdx = blockIdx.x;
  const GpuEvalJob job = jobs[jobIdx];

  __shared__ SharedPipeFrame sh;

  if (threadIdx.x == 0) {
    sh.rng = Mulberry32(job.seed);
    sh.speedPhaseA = sh.rng.next_f64() * K_TWO_PI;
    sh.speedPhaseB = sh.rng.next_f64() * K_TWO_PI;
    sh.head = 0;
    sh.count = 1;
    sh.pipeCounter = 1;
    sh.distUntilNextSpawn = (double)job.baseSpacing;
    double margin = job.movingPipes ? 72.0 : 52.0;
    double initGap = (double)job.baseGap + (job.gapVar > 0.0f ? (sh.rng.next_f64() * 2.0 - 1.0) * (double)job.gapVar : 0.0);
    if (initGap < 76.0) initGap = 76.0;
    else if (initGap > 204.0) initGap = 204.0;
    double span = K_PLAYABLE_H - initGap - margin * 2.0;
    if (span < 20.0) span = 20.0;
    double initTop = margin + sh.rng.next_f64() * span;
    sh.px[0] = K_CANVAS_W + 60.0;
    sh.pBaseTop[0] = initTop;
    sh.pGap[0] = initGap;
    sh.pTop[0] = initTop;
    sh.pBot[0] = initTop + initGap;
    sh.pPhase[0] = sh.rng.next_f64() * K_TWO_PI;
    sh.pVy[0] = 0.0;
    sh.pId[0] = 1;
    sh.aliveCount = job.popSize;
    sh.maxScoreReached = 0;
    sh.ticksAccum = 0ULL;
  }
  __syncthreads();

  // Up to 2 birds per thread (with up to 256 threads/block => supports popSize up to 512 with minimal register footprint)
  constexpr int MAX_BPT = 2;
  float by[MAX_BPT], bvy[MAX_BPT], bfit[MAX_BPT];
  int bscore[MAX_BPT], bpass[MAX_BPT], balive[MAX_BPT];
  float bstate[MAX_BPT][MAX_STATE];

  int numLocal = 0;
  float initSt = (job.architecture == ARCH_SYNAPTIC_STP) ? 1.0f : 0.0f;
  for (int k = 0; k < MAX_BPT; k++) {
    int b = threadIdx.x + k * blockDim.x;
    if (b < job.popSize) {
      numLocal = k + 1;
      by[k] = (float)(K_PLAYABLE_H * 0.46);
      bvy[k] = 0.0f;
      bfit[k] = 0.0f;
      bscore[k] = 0;
      bpass[k] = 0;
      balive[k] = 1;
      for (int s = 0; s < MAX_STATE; s++) bstate[k][s] = initSt;
    }
  }

  const float invHalfPlayable = (float)(2.0 / K_PLAYABLE_H);
  const float invMaxVy = (float)(1.0 / K_MAX_VY);
  const float invCanvasW = (float)(1.0 / K_CANVAS_W);
  const float invPipeVy = (float)(1.0 / K_MAX_PIPE_VY_NORM);
  const float invAlignWin = (float)(1.0 / (K_PLAYABLE_H * 0.6));
  const double margin = job.movingPipes ? 72.0 : 52.0;

  for (int f = 1; f <= job.maxFrames; f++) {
    if (sh.aliveCount == 0 || sh.maxScoreReached >= job.pipeCap) break;

    if (threadIdx.x == 0) {
      double speedMult = 1.0;
      if (job.speedVar > 0.0f) {
        speedMult = 1.0 + (double)job.speedVar *
                              (0.55 * sin((double)f * 0.031 + sh.speedPhaseA) +
                               0.45 * cos((double)f * 0.079 + sh.speedPhaseB));
      }
      double tickSpeed = (double)job.baseSpeed * speedMult;
      if (tickSpeed < 1.2) tickSpeed = 1.2;
      sh.curTickSpeed = (float)tickSpeed;

      sh.distUntilNextSpawn -= tickSpeed;
      if (sh.distUntilNextSpawn <= 0.0 && sh.count < 15) {
        int slot = (sh.head + sh.count) & 15;
        double pg = (double)job.baseGap + (job.gapVar > 0.0f ? (sh.rng.next_f64() * 2.0 - 1.0) * (double)job.gapVar : 0.0);
        if (pg < 76.0) pg = 76.0;
        else if (pg > 204.0) pg = 204.0;
        double span = K_PLAYABLE_H - pg - margin * 2.0;
        if (span < 20.0) span = 20.0;
        double bt = margin + sh.rng.next_f64() * span;
        sh.pipeCounter += 1;
        sh.px[slot] = K_CANVAS_W + 60.0;
        sh.pBaseTop[slot] = bt;
        sh.pGap[slot] = pg;
        sh.pTop[slot] = bt;
        sh.pBot[slot] = bt + pg;
        sh.pPhase[slot] = sh.rng.next_f64() * K_TWO_PI;
        sh.pVy[slot] = 0.0;
        sh.pId[slot] = sh.pipeCounter;
        sh.count += 1;
        sh.distUntilNextSpawn = (job.speedVar > 0.0f || job.gapVar > 0.0f)
                                    ? (double)job.baseSpacing * (0.88 + sh.rng.next_f64() * 0.24)
                                    : (double)job.baseSpacing;
      }

      int nextIdx = -1;
      int next2Idx = -1;
      double oscAngle = (double)f * 0.045;
      for (int k = 0; k < sh.count; k++) {
        int idx = (sh.head + k) & 15;
        double nx = sh.px[idx] - tickSpeed;
        sh.px[idx] = nx;
        if (job.movingPipes) {
          double prevTop = sh.pTop[idx];
          double pg = sh.pGap[idx];
          double nt = sh.pBaseTop[idx] + sin(oscAngle + sh.pPhase[idx]) * (double)job.moveAmp;
          double maxTop = K_PLAYABLE_H - pg - 42.0;
          if (nt < 42.0) nt = 42.0;
          else if (nt > maxTop) nt = maxTop;
          sh.pTop[idx] = nt;
          sh.pBot[idx] = nt + pg;
          sh.pVy[idx] = nt - prevTop;
        }
        if (nx + K_PIPE_W > K_BIRD_X - 10.0) {
          if (nextIdx == -1) nextIdx = idx;
          else if (next2Idx == -1) next2Idx = idx;
        }
      }
      if (sh.count > 0 && sh.px[sh.head] + K_PIPE_W < -24.0) {
        sh.head = (sh.head + 1) & 15;
        sh.count -= 1;
      }

      if (nextIdx != -1) {
        sh.hasNextPipe = 1;
        sh.gapTop = (float)sh.pTop[nextIdx];
        sh.gapBot = (float)sh.pBot[nextIdx];
        sh.gapCenter = 0.5f * (sh.gapTop + sh.gapBot);
        sh.pipeEdgeX = (float)(sh.px[nextIdx] + K_PIPE_W);
        sh.gapVy = (float)sh.pVy[nextIdx];
        if (next2Idx != -1) {
          sh.hasNext2 = 1;
          sh.next2GapTop = (float)sh.pTop[next2Idx];
          sh.next2GapBot = (float)sh.pBot[next2Idx];
          sh.next2GapCenter = 0.5f * (sh.next2GapTop + sh.next2GapBot);
          sh.next2EdgeX = (float)(sh.px[next2Idx] + K_PIPE_W);
          sh.next2GapVy = (float)sh.pVy[next2Idx];
        } else {
          sh.hasNext2 = 0;
          sh.next2GapCenter = 0.0f;
          sh.next2GapTop = 0.0f;
          sh.next2GapBot = 0.0f;
          sh.next2EdgeX = (float)K_CANVAS_W;
          sh.next2GapVy = 0.0f;
        }
        double pLeft = sh.px[nextIdx];
        double pRight = pLeft + K_PIPE_W;
        double dx = 0.0;
        if (K_BIRD_X < pLeft) dx = pLeft - K_BIRD_X;
        else if (K_BIRD_X > pRight) dx = K_BIRD_X - pRight;
        if (dx < K_PIPE_HIT_R) {
          sh.pipeHorizHit = 1;
          sh.pipeEffY = (float)(dx == 0.0 ? K_PIPE_HIT_R : sqrt(fmax(0.0, K_PIPE_HIT_R2 - dx * dx)));
        } else {
          sh.pipeHorizHit = 0;
          sh.pipeEffY = 0.0f;
        }
      } else {
        sh.hasNextPipe = 0;
        sh.gapTop = (float)(K_PLAYABLE_H * 0.35);
        sh.gapBot = (float)(K_PLAYABLE_H * 0.65);
        sh.gapCenter = (float)(K_PLAYABLE_H * 0.5);
        sh.pipeEdgeX = (float)K_CANVAS_W;
        sh.gapVy = 0.0f;
        sh.hasNext2 = 0;
        sh.next2GapCenter = 0.0f;
        sh.next2GapTop = 0.0f;
        sh.next2GapBot = 0.0f;
        sh.next2EdgeX = (float)K_CANVAS_W;
        sh.next2GapVy = 0.0f;
        sh.pipeHorizHit = 0;
        sh.pipeEffY = 0.0f;
      }

      if (sh.count > 0) {
        sh.firstPipeId = sh.pId[sh.head];
        sh.passedFirstPipe = (sh.px[sh.head] + K_PIPE_W < K_BIRD_X) ? 1 : 0;
      } else {
        sh.firstPipeId = 0;
        sh.passedFirstPipe = 0;
      }
      sh.ticksAccum += (unsigned long long)sh.aliveCount;
    }
    __syncthreads();

    int diedThisTick = 0;
    int localMaxScore = 0;

    float rawDistNorm = (sh.pipeEdgeX - (float)K_BIRD_X) * invCanvasW;
    if (rawDistNorm < -0.2f) rawDistNorm = -0.2f;
    else if (rawDistNorm > 1.0f) rawDistNorm = 1.0f;

    float rawGapVy = sh.gapVy * invPipeVy;
    if (rawGapVy < -1.0f) rawGapVy = -1.0f;
    else if (rawGapVy > 1.0f) rawGapVy = 1.0f;

    float rawNext2 = 0.0f;
    float rawNext2Dx = 1.0f;
    float rawNext2Vy = 0.0f;
    if (sh.hasNextPipe && sh.hasNext2) {
      rawNext2 = (sh.next2GapCenter - sh.gapCenter) * invHalfPlayable;
      if (rawNext2 < -1.0f) rawNext2 = -1.0f;
      else if (rawNext2 > 1.0f) rawNext2 = 1.0f;
      rawNext2Dx = (sh.next2EdgeX - (float)K_BIRD_X) * invCanvasW;
      if (rawNext2Dx < -0.2f) rawNext2Dx = -0.2f;
      else if (rawNext2Dx > 1.0f) rawNext2Dx = 1.0f;
      if (job.movingPipes) {
        rawNext2Vy = sh.next2GapVy * invPipeVy;
        if (rawNext2Vy < -1.0f) rawNext2Vy = -1.0f;
        else if (rawNext2Vy > 1.0f) rawNext2Vy = 1.0f;
      }
    }
    float rawPipeTtf = 1.0f;
    if (sh.hasNextPipe) {
      float ttfSpeed = fmaxf(1.2f, sh.curTickSpeed);
      rawPipeTtf = (sh.pipeEdgeX - (float)K_BIRD_X) / (ttfSpeed * 120.0f);
      if (rawPipeTtf < 0.0f) rawPipeTtf = 0.0f;
      else if (rawPipeTtf > 1.0f) rawPipeTtf = 1.0f;
    }

    float gapHalf = 0.5f * (sh.gapBot - sh.gapTop);
    if (gapHalf < 24.0f) gapHalf = 24.0f;
    float invShapedScale = 1.0f / (gapHalf * 0.9f);
    bool checkMetabolic = (job.metabolicStepCost > 0.0f && job.architecture == ARCH_PONDER_ACT);

    for (int k = 0; k < numLocal; k++) {
      if (!balive[k]) continue;
      int b = threadIdx.x + k * blockDim.x;
      float y = by[k];
      float vy = bvy[k];

      float rawIn[MAX_SENSORS];
      rawIn[0] = y * invHalfPlayable - 1.0f;
      float vn = vy * invMaxVy;
      rawIn[1] = vn < -1.0f ? -1.0f : (vn > 1.0f ? 1.0f : vn);
      rawIn[2] = rawDistNorm;
      rawIn[3] = (y - sh.gapTop) * invHalfPlayable;
      rawIn[4] = (sh.gapBot - y) * invHalfPlayable;
      rawIn[5] = rawGapVy;
      rawIn[6] = rawNext2;
      rawIn[7] = (sh.hasNextPipe && sh.hasNext2) ? (y - sh.next2GapTop) * invHalfPlayable : 0.0f;
      rawIn[8] = (sh.hasNextPipe && sh.hasNext2) ? (sh.next2GapBot - y) * invHalfPlayable : 0.0f;
      rawIn[9] = rawNext2Dx;
      rawIn[10] = rawNext2Vy;
      rawIn[11] = rawPipeTtf;

      float subIn[MAX_SENSORS];
      for (int s = 0; s < job.inputCount; s++) {
        subIn[s] = rawIn[job.inputIndices[s]];
      }

      ReasoningStepStats rstat{1.0, 0.0, 0.5};
      const float* wptr = allWeights + (size_t)job.weightOffset + (size_t)b * (size_t)job.paramCount;
      float logit = forward_network<float, true>(
          wptr, job.inputCount, job.hiddenDepth, job.hiddenLayers,
          job.architecture, job.reasoningSteps, subIn, bstate[k], checkMetabolic ? &rstat : nullptr);

      if (logit > 0.0f) vy = job.jumpImpulse;
      vy += job.gravity;
      if (vy > (float)K_MAX_VY) vy = (float)K_MAX_VY;
      y += vy;
      by[k] = y;
      bvy[k] = vy;

      int hitFloor = (y - (float)K_FLOOR_HIT_R <= 0.0f || y + (float)K_FLOOR_HIT_R >= (float)K_PLAYABLE_H);
      int hitPipe = (!hitFloor && sh.pipeHorizHit && (y - sh.pipeEffY < sh.gapTop || y + sh.pipeEffY > sh.gapBot));

      if (hitFloor || hitPipe) {
        balive[k] = 0;
        if (hitFloor && bscore[k] == 0) bfit[k] *= 0.85f;
        diedThisTick += 1;
        continue;
      }

      float fit = bfit[k] + 0.1f;
      if (sh.hasNextPipe) {
        float absDy = fabsf(y - sh.gapCenter);
        if (job.shapedFitness) {
          float ne = absDy * invShapedScale;
          float cr = 0.42f / (1.0f + ne * ne);
          float corr = (y > sh.gapTop + 14.0f && y < sh.gapBot - 14.0f) ? 0.12f : 0.0f;
          float jp = 0.035f * fabsf(vy) * invMaxVy;
          float bonus = cr + corr - jp;
          if (bonus > 0.0f) fit += bonus;
        } else {
          float nd = absDy * invAlignWin;
          if (nd < 1.0f) fit += 0.15f * (1.0f - nd);
        }
      }
      if (checkMetabolic && rstat.ponderSteps > 1.0) {
        fit = fmaxf(0.0f, fit - job.metabolicStepCost * (float)(rstat.ponderSteps - 1.0));
      }
      if (job.excessFlopsCost > 0.0f) {
        fit = fmaxf(0.0f, fit - job.excessFlopsCost);
      }

      if (sh.passedFirstPipe && sh.firstPipeId > bpass[k]) {
        bpass[k] = sh.firstPipeId;
        bscore[k] += 1;
        fit += 40.0f;
        if (bscore[k] > localMaxScore) localMaxScore = bscore[k];
      }
      bfit[k] = fit;
    }

    if (diedThisTick > 0) atomicSub(&sh.aliveCount, diedThisTick);
    if (localMaxScore > sh.maxScoreReached) atomicMax(&sh.maxScoreReached, localMaxScore);
    __syncthreads();
  }

  for (int k = 0; k < numLocal; k++) {
    int b = threadIdx.x + k * blockDim.x;
    outScores[job.resultOffset + b] = bscore[k];
    outFitness[job.resultOffset + b] = bfit[k];
  }
  if (threadIdx.x == 0) {
    outTicks[jobIdx] = sh.ticksAccum;
  }
}
#endif

// ============================================================================
// Host OpenMP Lockstep Fallback (exact same algorithm when running without GPU)
// ============================================================================
static void eval_population_lockstep_cpu(
    const GpuEvalJob& job,
    const float* allWeights,
    int* outScores,
    float* outFitness,
    uint64_t* outTicks) {
  Mulberry32 rng(job.seed);
  double speedPhaseA = rng.next_f64() * K_TWO_PI;
  double speedPhaseB = rng.next_f64() * K_TWO_PI;
  double margin = job.movingPipes ? 72.0 : 52.0;

  double px[16], pBaseTop[16], pGap[16], pTop[16], pBot[16], pPhase[16], pVy[16];
  int pId[16];
  int head = 0, count = 1, pipeCounter = 1;
  double distUntilNextSpawn = (double)job.baseSpacing;
  double initGap = (double)job.baseGap + (job.gapVar > 0.0f ? (rng.next_f64() * 2.0 - 1.0) * (double)job.gapVar : 0.0);
  initGap = std::max(76.0, std::min(204.0, initGap));
  double initTop = margin + rng.next_f64() * std::max(20.0, K_PLAYABLE_H - initGap - margin * 2.0);
  px[0] = K_CANVAS_W + 60.0;
  pBaseTop[0] = initTop;
  pGap[0] = initGap;
  pTop[0] = initTop;
  pBot[0] = initTop + initGap;
  pPhase[0] = rng.next_f64() * K_TWO_PI;
  pVy[0] = 0.0;
  pId[0] = 1;

  int N = job.popSize;
  std::vector<float> by(N, (float)(K_PLAYABLE_H * 0.46));
  std::vector<float> bvy(N, 0.0f);
  std::vector<float> bfit(N, 0.0f);
  std::vector<int> bscore(N, 0);
  std::vector<int> bpass(N, 0);
  std::vector<int> aliveList(N);
  for (int i = 0; i < N; i++) aliveList[i] = i;
  int aliveCount = N;

  float initSt = (job.architecture == ARCH_SYNAPTIC_STP) ? 1.0f : 0.0f;
  std::vector<float> states((size_t)N * MAX_STATE, initSt);

  const float invHalfPlayable = (float)(2.0 / K_PLAYABLE_H);
  const float invMaxVy = (float)(1.0 / K_MAX_VY);
  const float invCanvasW = (float)(1.0 / K_CANVAS_W);
  const float invPipeVy = (float)(1.0 / K_MAX_PIPE_VY_NORM);
  const float invAlignWin = (float)(1.0 / (K_PLAYABLE_H * 0.6));

  uint64_t ticks = 0;
  int maxScoreReached = 0;

  for (int f = 1; f <= job.maxFrames && aliveCount > 0 && maxScoreReached < job.pipeCap; f++) {
    double speedMult = 1.0;
    if (job.speedVar > 0.0f) {
      speedMult = 1.0 + (double)job.speedVar *
                            (0.55 * std::sin((double)f * 0.031 + speedPhaseA) +
                             0.45 * std::cos((double)f * 0.079 + speedPhaseB));
    }
    double tickSpeed = std::max(1.2, (double)job.baseSpeed * speedMult);
    distUntilNextSpawn -= tickSpeed;
    if (distUntilNextSpawn <= 0.0 && count < 15) {
      int slot = (head + count) & 15;
      double pg = std::max(76.0, std::min(204.0, (double)job.baseGap + (job.gapVar > 0.0f ? (rng.next_f64() * 2.0 - 1.0) * (double)job.gapVar : 0.0)));
      double bt = margin + rng.next_f64() * std::max(20.0, K_PLAYABLE_H - pg - margin * 2.0);
      pipeCounter += 1;
      px[slot] = K_CANVAS_W + 60.0;
      pBaseTop[slot] = bt;
      pGap[slot] = pg;
      pTop[slot] = bt;
      pBot[slot] = bt + pg;
      pPhase[slot] = rng.next_f64() * K_TWO_PI;
      pVy[slot] = 0.0;
      pId[slot] = pipeCounter;
      count += 1;
      distUntilNextSpawn = (job.speedVar > 0.0f || job.gapVar > 0.0f)
                               ? (double)job.baseSpacing * (0.88 + rng.next_f64() * 0.24)
                               : (double)job.baseSpacing;
    }

    int nextIdx = -1, next2Idx = -1;
    double oscAngle = (double)f * 0.045;
    for (int k = 0; k < count; k++) {
      int idx = (head + k) & 15;
      px[idx] -= tickSpeed;
      if (job.movingPipes) {
        double prevTop = pTop[idx];
        double pg = pGap[idx];
        double nt = std::max(42.0, std::min(K_PLAYABLE_H - pg - 42.0, pBaseTop[idx] + std::sin(oscAngle + pPhase[idx]) * (double)job.moveAmp));
        pTop[idx] = nt;
        pBot[idx] = nt + pg;
        pVy[idx] = nt - prevTop;
      }
      if (px[idx] + K_PIPE_W > K_BIRD_X - 10.0) {
        if (nextIdx == -1) nextIdx = idx;
        else if (next2Idx == -1) next2Idx = idx;
      }
    }
    if (count > 0 && px[head] + K_PIPE_W < -24.0) {
      head = (head + 1) & 15;
      count -= 1;
    }

    int hasNext = nextIdx != -1 ? 1 : 0;
    float gapTop = hasNext ? (float)pTop[nextIdx] : (float)(K_PLAYABLE_H * 0.35);
    float gapBot = hasNext ? (float)pBot[nextIdx] : (float)(K_PLAYABLE_H * 0.65);
    float gapCenter = 0.5f * (gapTop + gapBot);
    float pipeEdgeX = hasNext ? (float)(px[nextIdx] + K_PIPE_W) : (float)K_CANVAS_W;
    float gapVy = hasNext ? (float)pVy[nextIdx] : 0.0f;
    int hasNext2 = (hasNext && next2Idx != -1) ? 1 : 0;
    float next2Center = hasNext2 ? (float)(0.5 * (pTop[next2Idx] + pBot[next2Idx])) : 0.0f;
    float next2Top = hasNext2 ? (float)pTop[next2Idx] : 0.0f;
    float next2Bot = hasNext2 ? (float)pBot[next2Idx] : 0.0f;
    float next2EdgeX = hasNext2 ? (float)(px[next2Idx] + K_PIPE_W) : (float)K_CANVAS_W;
    float next2Vy = hasNext2 ? (float)pVy[next2Idx] : 0.0f;

    int pipeHorizHit = 0;
    float pipeEffY = 0.0f;
    if (hasNext) {
      double pLeft = px[nextIdx], pRight = pLeft + K_PIPE_W;
      double dx = 0.0;
      if (K_BIRD_X < pLeft) dx = pLeft - K_BIRD_X;
      else if (K_BIRD_X > pRight) dx = K_BIRD_X - pRight;
      if (dx < K_PIPE_HIT_R) {
        pipeHorizHit = 1;
        pipeEffY = (float)(dx == 0.0 ? K_PIPE_HIT_R : std::sqrt(std::max(0.0, K_PIPE_HIT_R2 - dx * dx)));
      }
    }

    int firstPipeId = count > 0 ? pId[head] : 0;
    int passedFirst = (count > 0 && px[head] + K_PIPE_W < K_BIRD_X) ? 1 : 0;

    float rawDistNorm = std::max(-0.2f, std::min(1.0f, (pipeEdgeX - (float)K_BIRD_X) * invCanvasW));
    float rawGapVy = std::max(-1.0f, std::min(1.0f, gapVy * invPipeVy));
    float rawNext2 = hasNext2 ? std::max(-1.0f, std::min(1.0f, (next2Center - gapCenter) * invHalfPlayable)) : 0.0f;
    float rawNext2Dx = hasNext2 ? std::max(-0.2f, std::min(1.0f, (next2EdgeX - (float)K_BIRD_X) * invCanvasW)) : 1.0f;
    float rawNext2Vy = (hasNext2 && job.movingPipes) ? std::max(-1.0f, std::min(1.0f, next2Vy * invPipeVy)) : 0.0f;
    float rawPipeTtf = hasNext ? std::max(0.0f, std::min(1.0f, (pipeEdgeX - (float)K_BIRD_X) / (std::max(1.2f, (float)tickSpeed) * 120.0f))) : 1.0f;
    float gapHalf = std::max(24.0f, 0.5f * (gapBot - gapTop));
    float invShapedScale = 1.0f / (gapHalf * 0.9f);
    bool checkMetabolic = (job.metabolicStepCost > 0.0f && job.architecture == ARCH_PONDER_ACT);

    ticks += (uint64_t)aliveCount;

    int idx = 0;
    while (idx < aliveCount) {
      int b = aliveList[idx];
      float y = by[b], vy = bvy[b];

      float rawIn[MAX_SENSORS];
      rawIn[0] = y * invHalfPlayable - 1.0f;
      rawIn[1] = std::max(-1.0f, std::min(1.0f, vy * invMaxVy));
      rawIn[2] = rawDistNorm;
      rawIn[3] = (y - gapTop) * invHalfPlayable;
      rawIn[4] = (gapBot - y) * invHalfPlayable;
      rawIn[5] = rawGapVy;
      rawIn[6] = rawNext2;
      rawIn[7] = hasNext2 ? (y - next2Top) * invHalfPlayable : 0.0f;
      rawIn[8] = hasNext2 ? (next2Bot - y) * invHalfPlayable : 0.0f;
      rawIn[9] = rawNext2Dx;
      rawIn[10] = rawNext2Vy;
      rawIn[11] = rawPipeTtf;

      float subIn[MAX_SENSORS];
      for (int s = 0; s < job.inputCount; s++) subIn[s] = rawIn[job.inputIndices[s]];

      ReasoningStepStats rstat{1.0, 0.0, 0.5};
      const float* wptr = allWeights + (size_t)job.weightOffset + (size_t)b * (size_t)job.paramCount;
      float logit = (job.architecture == ARCH_HYBRID_MOE)
          ? forward_hybrid_moe<float, true>(
                wptr, job.inputCount, job.hiddenDepth, job.hiddenLayers,
                job.reasoningSteps, subIn, &states[(size_t)b * MAX_STATE], job.hybridMaskBits,
                checkMetabolic ? &rstat : nullptr, nullptr, nullptr)
          : forward_network<float, true>(
                wptr, job.inputCount, job.hiddenDepth, job.hiddenLayers,
                job.architecture, job.reasoningSteps, subIn, &states[(size_t)b * MAX_STATE],
                checkMetabolic ? &rstat : nullptr);

      if (logit > 0.0f) vy = job.jumpImpulse;
      vy += job.gravity;
      if (vy > (float)K_MAX_VY) vy = (float)K_MAX_VY;
      y += vy;
      by[b] = y;
      bvy[b] = vy;

      bool hitFloor = (y - (float)K_FLOOR_HIT_R <= 0.0f || y + (float)K_FLOOR_HIT_R >= (float)K_PLAYABLE_H);
      bool hitPipe = (!hitFloor && pipeHorizHit && (y - pipeEffY < gapTop || y + pipeEffY > gapBot));
      if (hitFloor || hitPipe) {
        if (hitFloor && bscore[b] == 0) bfit[b] *= 0.85f;
        aliveCount -= 1;
        aliveList[idx] = aliveList[aliveCount];
        continue;
      }

      float fit = bfit[b] + 0.1f;
      if (hasNext) {
        float absDy = std::fabs(y - gapCenter);
        if (job.shapedFitness) {
          float ne = absDy * invShapedScale;
          float bonus = 0.42f / (1.0f + ne * ne) + ((y > gapTop + 14.0f && y < gapBot - 14.0f) ? 0.12f : 0.0f) - 0.035f * std::fabs(vy) * invMaxVy;
          if (bonus > 0.0f) fit += bonus;
        } else {
          float nd = absDy * invAlignWin;
          if (nd < 1.0f) fit += 0.15f * (1.0f - nd);
        }
      }
      if (checkMetabolic && rstat.ponderSteps > 1.0) {
        fit = std::max(0.0f, fit - job.metabolicStepCost * (float)(rstat.ponderSteps - 1.0));
      }
      if (job.excessFlopsCost > 0.0f) {
        fit = std::max(0.0f, fit - job.excessFlopsCost);
      }

      if (passedFirst && firstPipeId > bpass[b]) {
        bpass[b] = firstPipeId;
        bscore[b] += 1;
        fit += 40.0f;
        if (bscore[b] > maxScoreReached) maxScoreReached = bscore[b];
      }
      bfit[b] = fit;
      idx += 1;
    }
  }

  for (int b = 0; b < N; b++) {
    outScores[job.resultOffset + b] = bscore[b];
    outFitness[job.resultOffset + b] = bfit[b];
  }
  *outTicks = ticks;
}

// ============================================================================
// Exact Float64 Multi-Seed Audit (100% parity with src/engine/evaluator.ts)
// ============================================================================
struct AuditResultF64 {
  std::vector<double> seedScores;
  int minSeedScore = 0;
  double meanSeedScore = 0.0;
  bool verifiedPerfect = false;
  uint64_t ticksEvaluated = 0;
  int totalDeaths = 0, floorDeaths = 0, ceilingDeaths = 0, pipeTopDeaths = 0, pipeBottomDeaths = 0;
  double avgDeathAbsVy = 0.0, avgDeathGapErr = 0.0;
  int dominantFailure = FAIL_NONE;
  bool hasReasoning = false;
  double avgPonderSteps = 1.0, calmPonderSteps = 1.0, dangerPonderSteps = 1.0;
  double system2Ratio = 0.0, avgRolloutAdvantage = 0.0, avgSsmGate = 0.5;
};

static AuditResultF64 audit_brain_f64(
    const TrialTask& task,
    const std::vector<double>& qWeights,
    int targetCap,
    int numSeeds,
    bool failFast,
    int reasoningStepsOverride = -1,
    int hybridMaskOverride = -1) {
  AuditResultF64 res;
  if (numSeeds <= 0) return res;

  const EnvParams& env = task.env;
  int activeReasoningSteps = reasoningStepsOverride > 0 ? reasoningStepsOverride : task.reasoningSteps;
  double baseSpacing = env.pipeSpeed * env.spawnFrames;
  double gravity = K_GRAVITY * env.gravityScale;
  double jumpImpulse = K_JUMP * std::sqrt(env.gravityScale);
  double margin = env.movingPipes ? 72.0 : 52.0;
  int maxFrames = (targetCap + 8) * (int)std::llround(env.spawnFrames * 1.35 + 16.0);
  double minPipeX = K_BIRD_X - K_BIRD_R;
  const double invHalfPlayable = 2.0 / K_PLAYABLE_H;
  const double invMaxVy = 1.0 / K_MAX_VY;
  const double invCanvasW = 1.0 / K_CANVAS_W;
  const double invPipeVy = 1.0 / K_MAX_PIPE_VY_NORM;
  bool isReasoning = ((task.architecture >= ARCH_LOOPED_REASONER && task.architecture <= ARCH_HYBRID_MOE) || task.architecture == ARCH_DECOUPLED_FLY_CORTEX);

  double sumVy = 0.0, sumErr = 0.0;
  uint64_t rTicks = 0, cTicks = 0, dTicks = 0, s2Ticks = 0;
  double pSum = 0.0, cPSum = 0.0, dPSum = 0.0, rollSum = 0.0, ssmSum = 0.0;

  int minSc = 1000000000;
  double sumSc = 0.0;
  bool allSurvived = true;

  for (int s = 0; s < numSeeds; s++) {
    uint32_t seed = (uint32_t)(1009 + s * 7919);
    Mulberry32 rng(seed);
    double speedPhaseA = rng.next_f64() * K_TWO_PI;
    double speedPhaseB = rng.next_f64() * K_TWO_PI;

    double px[16], pBaseTop[16], pGap[16], pTop[16], pBot[16], pPhase[16], pVy[16];
    uint8_t pPassed[16];
    int head = 0, count = 1;
    double distUntilNextSpawn = baseSpacing;
    double initGap = std::max(76.0, std::min(204.0, env.gap + (env.gapVariance > 0.0 ? (rng.next_f64() * 2.0 - 1.0) * env.gapVariance : 0.0)));
    double initTop = margin + rng.next_f64() * std::max(20.0, K_PLAYABLE_H - initGap - margin * 2.0);
    px[0] = K_CANVAS_W + 60.0;
    pBaseTop[0] = initTop;
    pGap[0] = initGap;
    pTop[0] = initTop;
    pBot[0] = initTop + initGap;
    pPhase[0] = rng.next_f64() * K_TWO_PI;
    pVy[0] = 0.0;
    pPassed[0] = 0;

    double y = K_PLAYABLE_H * 0.46;
    double vy = 0.0;
    int score = 0;
    int frameCount = 0;
    bool survived = false;
    int deathCause = FAIL_NONE;
    double deathAbsVy = 0.0, deathGapErr = 0.0;

    double state[MAX_STATE];
    double initSt = (task.architecture == ARCH_SYNAPTIC_STP) ? 1.0 : 0.0;
    for (int i = 0; i < MAX_STATE; i++) state[i] = initSt;

    while (frameCount < maxFrames) {
      frameCount += 1;
      double tickSpeed = env.pipeSpeed;
      if (env.speedVariability > 0.0) {
        double sm = 1.0 + env.speedVariability *
                              (0.55 * std::sin((double)frameCount * 0.031 + speedPhaseA) +
                               0.45 * std::cos((double)frameCount * 0.079 + speedPhaseB));
        tickSpeed = std::max(1.2, env.pipeSpeed * sm);
      }
      distUntilNextSpawn -= tickSpeed;
      if (distUntilNextSpawn <= 0.0) {
        int tail = (head + count) & 15;
        double pg = std::max(76.0, std::min(204.0, env.gap + (env.gapVariance > 0.0 ? (rng.next_f64() * 2.0 - 1.0) * env.gapVariance : 0.0)));
        double bt = margin + rng.next_f64() * std::max(20.0, K_PLAYABLE_H - pg - margin * 2.0);
        px[tail] = K_CANVAS_W + 20.0;
        pBaseTop[tail] = bt;
        pGap[tail] = pg;
        pTop[tail] = bt;
        pBot[tail] = bt + pg;
        pPhase[tail] = rng.next_f64() * K_TWO_PI;
        pVy[tail] = 0.0;
        pPassed[tail] = 0;
        count += 1;
        distUntilNextSpawn = (env.speedVariability > 0.0 || env.gapVariance > 0.0)
                                 ? baseSpacing * (0.88 + rng.next_f64() * 0.24)
                                 : baseSpacing;
      }

      int nextIdx = head;
      bool foundNext = false;
      int next2Idx = -1;
      double timeAngle = (double)frameCount * 0.045;
      for (int k = 0; k < count; k++) {
        int idx = (head + k) & 15;
        px[idx] -= tickSpeed;
        if (env.movingPipes) {
          double prevTop = pTop[idx];
          double pg = pGap[idx];
          double nt = std::max(42.0, std::min(K_PLAYABLE_H - pg - 42.0, pBaseTop[idx] + std::sin(timeAngle + pPhase[idx]) * env.moveAmplitude));
          pTop[idx] = nt;
          pBot[idx] = nt + pg;
          pVy[idx] = nt - prevTop;
        }
        if (!foundNext) {
          if (px[idx] + K_PIPE_W >= minPipeX) {
            nextIdx = idx;
            foundNext = true;
          }
        } else if (next2Idx == -1) {
          next2Idx = idx;
        }
      }
      if (count > 0 && px[head] + K_PIPE_W < -24.0) {
        head = (head + 1) & 15;
        count -= 1;
      }

      double gapTop = foundNext ? pTop[nextIdx] : K_PLAYABLE_H * 0.35;
      double gapBot = foundNext ? pBot[nextIdx] : K_PLAYABLE_H * 0.65;
      double pipeEdgeX = foundNext ? px[nextIdx] + K_PIPE_W : K_CANVAS_W;
      double gapVyVal = (foundNext && env.movingPipes) ? pVy[nextIdx] * invPipeVy : 0.0;
      bool hasNext2 = (foundNext && next2Idx != -1);

      double rawIn[MAX_SENSORS];
      rawIn[0] = y * invHalfPlayable - 1.0;
      rawIn[1] = std::max(-1.0, std::min(1.0, vy * invMaxVy));
      rawIn[2] = std::max(-0.2, std::min(1.0, (pipeEdgeX - K_BIRD_X) * invCanvasW));
      rawIn[3] = (y - gapTop) * invHalfPlayable;
      rawIn[4] = (gapBot - y) * invHalfPlayable;
      rawIn[5] = std::max(-1.0, std::min(1.0, gapVyVal));
      if (hasNext2) {
        double n2 = ((pTop[next2Idx] + pBot[next2Idx] - (gapTop + gapBot)) * 0.5) * invHalfPlayable;
        rawIn[6] = std::max(-1.0, std::min(1.0, n2));
        rawIn[7] = (y - pTop[next2Idx]) * invHalfPlayable;
        rawIn[8] = (pBot[next2Idx] - y) * invHalfPlayable;
        rawIn[9] = std::max(-0.2, std::min(1.0, (px[next2Idx] + K_PIPE_W - K_BIRD_X) * invCanvasW));
        rawIn[10] = env.movingPipes ? std::max(-1.0, std::min(1.0, pVy[next2Idx] * invPipeVy)) : 0.0;
      } else {
        rawIn[6] = 0.0;
        rawIn[7] = 0.0;
        rawIn[8] = 0.0;
        rawIn[9] = 1.0;
        rawIn[10] = 0.0;
      }
      rawIn[11] = foundNext
                      ? std::max(0.0, std::min(1.0, (pipeEdgeX - K_BIRD_X) / (std::max(1.2, tickSpeed) * 120.0)))
                      : 1.0;

      double subIn[MAX_SENSORS];
      for (int i = 0; i < task.inputCount; i++) subIn[i] = rawIn[task.inputIndices[i]];

      ReasoningStepStats rstat{1.0, 0.0, 0.5};
      int hMask = (hybridMaskOverride >= 0) ? hybridMaskOverride : (task.morphogenesisEnabled ? 0 : 7);
      double logit = (task.architecture == ARCH_HYBRID_MOE)
          ? forward_hybrid_moe<double, false>(
                qWeights.data(), task.inputCount, task.hiddenDepth, task.hiddenLayers,
                activeReasoningSteps, subIn, state, hMask, isReasoning ? &rstat : nullptr, nullptr, nullptr)
          : forward_network<double, false>(
                qWeights.data(), task.inputCount, task.hiddenDepth, task.hiddenLayers,
                task.architecture, activeReasoningSteps, subIn, state, isReasoning ? &rstat : nullptr);

      if (logit > 0.0) vy = jumpImpulse;

      if (isReasoning) {
        rTicks += 1;
        pSum += rstat.ponderSteps;
        if (rstat.ponderSteps >= 2.0) s2Ticks += 1;
        double pipeDist = foundNext ? (px[nextIdx] + K_PIPE_W - K_BIRD_X) * invCanvasW : 1.0;
        bool isDanger = (pipeDist <= 0.34) || (env.movingPipes && std::fabs(pVy[nextIdx]) > 0.6);
        if (isDanger) {
          dTicks += 1;
          dPSum += rstat.ponderSteps;
        } else {
          cTicks += 1;
          cPSum += rstat.ponderSteps;
        }
        rollSum += std::fabs(rstat.rolloutAdvantage);
        ssmSum += rstat.ssmGateMean;
      }

      vy += gravity;
      if (vy > K_MAX_VY) vy = K_MAX_VY;
      y += vy;

      if (y - K_FLOOR_HIT_R <= 0.0 || y + K_FLOOR_HIT_R >= K_PLAYABLE_H) {
        deathCause = (y - K_FLOOR_HIT_R <= 0.0) ? FAIL_CEILING : FAIL_FLOOR;
        deathAbsVy = std::fabs(vy);
        deathGapErr = std::fabs(y - 0.5 * (gapTop + gapBot));
        break;
      }

      if (foundNext) {
        double pLeft = px[nextIdx], pRight = pLeft + K_PIPE_W;
        double dx = 0.0;
        if (K_BIRD_X < pLeft) dx = pLeft - K_BIRD_X;
        else if (K_BIRD_X > pRight) dx = K_BIRD_X - pRight;
        if (dx < K_PIPE_HIT_R) {
          double effY = dx == 0.0 ? K_PIPE_HIT_R : std::sqrt(std::max(0.0, K_PIPE_HIT_R2 - dx * dx));
          if (y - effY < pTop[nextIdx] || y + effY > pBot[nextIdx]) {
            deathCause = (y - effY < pTop[nextIdx]) ? FAIL_PIPE_TOP : FAIL_PIPE_BOTTOM;
            deathAbsVy = std::fabs(vy);
            deathGapErr = std::fabs(y - 0.5 * (pTop[nextIdx] + pBot[nextIdx]));
            break;
          }
        }
      }

      if (count > 0 && pPassed[head] == 0 && px[head] + K_PIPE_W < K_BIRD_X) {
        pPassed[head] = 1;
        score += 1;
        if (score >= targetCap) {
          survived = true;
          break;
        }
      }
    }

    res.ticksEvaluated += (uint64_t)frameCount;
    res.seedScores.push_back((double)score);
    sumSc += (double)score;
    if (score < minSc) minSc = score;
    if (deathCause != FAIL_NONE) {
      res.totalDeaths += 1;
      if (deathCause == FAIL_FLOOR) res.floorDeaths += 1;
      else if (deathCause == FAIL_CEILING) res.ceilingDeaths += 1;
      else if (deathCause == FAIL_PIPE_TOP) res.pipeTopDeaths += 1;
      else if (deathCause == FAIL_PIPE_BOTTOM) res.pipeBottomDeaths += 1;
      sumVy += deathAbsVy;
      sumErr += deathGapErr;
    }
    if (!survived) {
      allSurvived = false;
      if (failFast) break;
    }
  }

  res.minSeedScore = res.seedScores.empty() ? 0 : minSc;
  res.meanSeedScore = res.seedScores.empty() ? 0.0 : sumSc / (double)res.seedScores.size();
  res.verifiedPerfect = allSurvived && ((int)res.seedScores.size() == numSeeds);
  if (res.totalDeaths > 0) {
    res.avgDeathAbsVy = sumVy / (double)res.totalDeaths;
    res.avgDeathGapErr = sumErr / (double)res.totalDeaths;
    int bestCnt = 0;
    const int counts[4] = {res.pipeTopDeaths, res.pipeBottomDeaths, res.floorDeaths, res.ceilingDeaths};
    const int causes[4] = {FAIL_PIPE_TOP, FAIL_PIPE_BOTTOM, FAIL_FLOOR, FAIL_CEILING};
    for (int i = 0; i < 4; i++) {
      if (counts[i] > bestCnt) {
        bestCnt = counts[i];
        res.dominantFailure = causes[i];
      }
    }
  }
  if (isReasoning && rTicks > 0) {
    res.hasReasoning = true;
    res.avgPonderSteps = pSum / (double)rTicks;
    res.calmPonderSteps = cTicks > 0 ? cPSum / (double)cTicks : 1.0;
    res.dangerPonderSteps = dTicks > 0 ? dPSum / (double)dTicks : 1.0;
    res.system2Ratio = (double)s2Ticks / (double)rTicks;
    res.avgRolloutAdvantage = rollSum / (double)rTicks;
    res.avgSsmGate = ssmSum / (double)rTicks;
  }
  return res;
}

// ============================================================================
// Ultra-Fast GPU-Native Float32 Multi-Seed Audit Kernel (1 thread per seed!)
// Computes full score, Failure Autopsy, and Reasoning Telemetry on GPU FP32.
// ============================================================================
struct GpuAuditSeedJob {
  int trialIndex;
  int seedIndex;
  int architecture;
  int reasoningSteps;
  int inputCount;
  int inputIndices[MAX_SENSORS];
  int hiddenDepth;
  int hiddenLayers[5];
  int paramCount;
  int weightOffset;
  int targetCap;
  uint32_t seed;
  float baseGap;
  float gapVar;
  float baseSpeed;
  float speedVar;
  float baseSpacing;
  int movingPipes;
  float moveAmp;
  float gravity;
  float jumpImpulse;
  int maxFrames;
  int hybridMaskBits;
};

struct GpuAuditSeedOut {
  int score;
  int survived;
  int deathCause;
  int ticks;
  float deathAbsVy;
  float deathGapErr;
  uint32_t rTicks;
  uint32_t cTicks;
  uint32_t dTicks;
  uint32_t s2Ticks;
  float pSum;
  float cPSum;
  float dPSum;
  float rollSum;
  float ssmSum;
};

HD static void audit_single_seed_f32(
    const GpuAuditSeedJob& jb,
    const float* allWeights,
    GpuAuditSeedOut* out) {
  Mulberry32 rng(jb.seed);
  float speedPhaseA = rng.next_f32() * (float)K_TWO_PI;
  float speedPhaseB = rng.next_f32() * (float)K_TWO_PI;
  float margin = jb.movingPipes ? 72.0f : 52.0f;
  float minPipeX = (float)(K_BIRD_X - K_BIRD_R);
  const float invHalfPlayable = (float)(2.0 / K_PLAYABLE_H);
  const float invMaxVy = (float)(1.0 / K_MAX_VY);
  const float invCanvasW = (float)(1.0 / K_CANVAS_W);
  const float invPipeVy = (float)(1.0 / K_MAX_PIPE_VY_NORM);
  bool isReasoning = (jb.architecture >= ARCH_LOOPED_REASONER && jb.architecture <= ARCH_HYBRID_MOE);

  float px[16], pBaseTop[16], pGap[16], pTop[16], pBot[16], pPhase[16], pVy[16];
  uint8_t pPassed[16];
  int head = 0, count = 1;
  float distUntilNextSpawn = jb.baseSpacing;
  float initGap = jb.baseGap + (jb.gapVar > 0.0f ? (rng.next_f32() * 2.0f - 1.0f) * jb.gapVar : 0.0f);
  if (initGap < 76.0f) initGap = 76.0f;
  if (initGap > 204.0f) initGap = 204.0f;
  float span0 = (float)K_PLAYABLE_H - initGap - margin * 2.0f;
  if (span0 < 20.0f) span0 = 20.0f;
  float initTop = margin + rng.next_f32() * span0;
  px[0] = (float)(K_CANVAS_W + 60.0);
  pBaseTop[0] = initTop;
  pGap[0] = initGap;
  pTop[0] = initTop;
  pBot[0] = initTop + initGap;
  pPhase[0] = rng.next_f32() * (float)K_TWO_PI;
  pVy[0] = 0.0f;
  pPassed[0] = 0;

  float y = (float)(K_PLAYABLE_H * 0.46);
  float vy = 0.0f;
  int score = 0;
  int frameCount = 0;
  int survived = 0;
  int deathCause = FAIL_NONE;
  float deathAbsVy = 0.0f, deathGapErr = 0.0f;

  uint32_t rTicks = 0, cTicks = 0, dTicks = 0, s2Ticks = 0;
  float pSum = 0.0f, cPSum = 0.0f, dPSum = 0.0f, rollSum = 0.0f, ssmSum = 0.0f;

  float state[MAX_STATE];
  float initSt = (jb.architecture == ARCH_SYNAPTIC_STP) ? 1.0f : 0.0f;
  for (int i = 0; i < MAX_STATE; i++) state[i] = initSt;

  const float* wptr = allWeights + (size_t)jb.weightOffset;

  while (frameCount < jb.maxFrames) {
    frameCount += 1;
    float tickSpeed = jb.baseSpeed;
    if (jb.speedVar > 0.0f) {
      float sm = 1.0f + jb.speedVar *
                            (0.55f * sinf((float)frameCount * 0.031f + speedPhaseA) +
                             0.45f * cosf((float)frameCount * 0.079f + speedPhaseB));
      tickSpeed = jb.baseSpeed * sm;
      if (tickSpeed < 1.2f) tickSpeed = 1.2f;
    }
    distUntilNextSpawn -= tickSpeed;
    if (distUntilNextSpawn <= 0.0f && count < 15) {
      int tail = (head + count) & 15;
      float pg = jb.baseGap + (jb.gapVar > 0.0f ? (rng.next_f32() * 2.0f - 1.0f) * jb.gapVar : 0.0f);
      if (pg < 76.0f) pg = 76.0f;
      if (pg > 204.0f) pg = 204.0f;
      float sp = (float)K_PLAYABLE_H - pg - margin * 2.0f;
      if (sp < 20.0f) sp = 20.0f;
      float bt = margin + rng.next_f32() * sp;
      px[tail] = (float)(K_CANVAS_W + 20.0);
      pBaseTop[tail] = bt;
      pGap[tail] = pg;
      pTop[tail] = bt;
      pBot[tail] = bt + pg;
      pPhase[tail] = rng.next_f32() * (float)K_TWO_PI;
      pVy[tail] = 0.0f;
      pPassed[tail] = 0;
      count += 1;
      distUntilNextSpawn = (jb.speedVar > 0.0f || jb.gapVar > 0.0f)
                               ? jb.baseSpacing * (0.88f + rng.next_f32() * 0.24f)
                               : jb.baseSpacing;
    }

    int nextIdx = head;
    bool foundNext = false;
    int next2Idx = -1;
    float timeAngle = (float)frameCount * 0.045f;
    for (int k = 0; k < count; k++) {
      int idx = (head + k) & 15;
      px[idx] -= tickSpeed;
      if (jb.movingPipes) {
        float prevTop = pTop[idx];
        float pg = pGap[idx];
        float nt = pBaseTop[idx] + sinf(timeAngle + pPhase[idx]) * jb.moveAmp;
        float maxT = (float)K_PLAYABLE_H - pg - 42.0f;
        if (nt < 42.0f) nt = 42.0f;
        if (nt > maxT) nt = maxT;
        pTop[idx] = nt;
        pBot[idx] = nt + pg;
        pVy[idx] = nt - prevTop;
      }
      if (!foundNext) {
        if (px[idx] + (float)K_PIPE_W >= minPipeX) {
          nextIdx = idx;
          foundNext = true;
        }
      } else if (next2Idx == -1) {
        next2Idx = idx;
      }
    }
    if (count > 0 && px[head] + (float)K_PIPE_W < -24.0f) {
      head = (head + 1) & 15;
      count -= 1;
    }

    float gapTop = foundNext ? pTop[nextIdx] : (float)(K_PLAYABLE_H * 0.35);
    float gapBot = foundNext ? pBot[nextIdx] : (float)(K_PLAYABLE_H * 0.65);
    float pipeEdgeX = foundNext ? px[nextIdx] + (float)K_PIPE_W : (float)K_CANVAS_W;
    float gapVyVal = (foundNext && jb.movingPipes) ? pVy[nextIdx] * invPipeVy : 0.0f;
    bool hasNext2 = (foundNext && next2Idx != -1);

    float rawIn[MAX_SENSORS];
    rawIn[0] = y * invHalfPlayable - 1.0f;
    float vn = vy * invMaxVy;
    rawIn[1] = vn < -1.0f ? -1.0f : (vn > 1.0f ? 1.0f : vn);
    float dn = (pipeEdgeX - (float)K_BIRD_X) * invCanvasW;
    rawIn[2] = dn < -0.2f ? -0.2f : (dn > 1.0f ? 1.0f : dn);
    rawIn[3] = (y - gapTop) * invHalfPlayable;
    rawIn[4] = (gapBot - y) * invHalfPlayable;
    rawIn[5] = gapVyVal < -1.0f ? -1.0f : (gapVyVal > 1.0f ? 1.0f : gapVyVal);
    if (hasNext2) {
      float n2 = ((pTop[next2Idx] + pBot[next2Idx] - (gapTop + gapBot)) * 0.5f) * invHalfPlayable;
      rawIn[6] = n2 < -1.0f ? -1.0f : (n2 > 1.0f ? 1.0f : n2);
      rawIn[7] = (y - pTop[next2Idx]) * invHalfPlayable;
      rawIn[8] = (pBot[next2Idx] - y) * invHalfPlayable;
      float n2dx = (px[next2Idx] + (float)K_PIPE_W - (float)K_BIRD_X) * invCanvasW;
      rawIn[9] = n2dx < -0.2f ? -0.2f : (n2dx > 1.0f ? 1.0f : n2dx);
      if (jb.movingPipes) {
        float n2vy = pVy[next2Idx] * invPipeVy;
        rawIn[10] = n2vy < -1.0f ? -1.0f : (n2vy > 1.0f ? 1.0f : n2vy);
      } else {
        rawIn[10] = 0.0f;
      }
    } else {
      rawIn[6] = 0.0f;
      rawIn[7] = 0.0f;
      rawIn[8] = 0.0f;
      rawIn[9] = 1.0f;
      rawIn[10] = 0.0f;
    }
    if (foundNext) {
      float ttf = (pipeEdgeX - (float)K_BIRD_X) / (fmaxf(1.2f, tickSpeed) * 120.0f);
      rawIn[11] = ttf < 0.0f ? 0.0f : (ttf > 1.0f ? 1.0f : ttf);
    } else {
      rawIn[11] = 1.0f;
    }

    float subIn[MAX_SENSORS];
    for (int i = 0; i < jb.inputCount; i++) subIn[i] = rawIn[jb.inputIndices[i]];

    ReasoningStepStats rstat{1.0, 0.0, 0.5};
    float logit = (jb.architecture == ARCH_HYBRID_MOE)
        ? forward_hybrid_moe<float, true>(
              wptr, jb.inputCount, jb.hiddenDepth, jb.hiddenLayers,
              jb.reasoningSteps, subIn, state, jb.hybridMaskBits, isReasoning ? &rstat : nullptr, nullptr, nullptr)
        : forward_network<float, true>(
              wptr, jb.inputCount, jb.hiddenDepth, jb.hiddenLayers,
              jb.architecture, jb.reasoningSteps, subIn, state, isReasoning ? &rstat : nullptr);

    if (logit > 0.0f) vy = jb.jumpImpulse;

    if (isReasoning) {
      rTicks += 1;
      float ps = (float)rstat.ponderSteps;
      pSum += ps;
      if (ps >= 2.0f) s2Ticks += 1;
      float pipeDist = foundNext ? (px[nextIdx] + (float)K_PIPE_W - (float)K_BIRD_X) * invCanvasW : 1.0f;
      bool isDanger = (pipeDist <= 0.34f) || (jb.movingPipes && fabsf(pVy[nextIdx]) > 0.6f);
      if (isDanger) {
        dTicks += 1;
        dPSum += ps;
      } else {
        cTicks += 1;
        cPSum += ps;
      }
      rollSum += fabsf((float)rstat.rolloutAdvantage);
      ssmSum += (float)rstat.ssmGateMean;
    }

    vy += jb.gravity;
    if (vy > (float)K_MAX_VY) vy = (float)K_MAX_VY;
    y += vy;

    if (y - (float)K_FLOOR_HIT_R <= 0.0f || y + (float)K_FLOOR_HIT_R >= (float)K_PLAYABLE_H) {
      deathCause = (y - (float)K_FLOOR_HIT_R <= 0.0f) ? FAIL_CEILING : FAIL_FLOOR;
      deathAbsVy = fabsf(vy);
      deathGapErr = fabsf(y - 0.5f * (gapTop + gapBot));
      break;
    }

    if (foundNext) {
      float pLeft = px[nextIdx], pRight = pLeft + (float)K_PIPE_W;
      float dx = 0.0f;
      if ((float)K_BIRD_X < pLeft) dx = pLeft - (float)K_BIRD_X;
      else if ((float)K_BIRD_X > pRight) dx = (float)K_BIRD_X - pRight;
      if (dx < (float)K_PIPE_HIT_R) {
        float diff2 = (float)K_PIPE_HIT_R2 - dx * dx;
        float effY = dx == 0.0f ? (float)K_PIPE_HIT_R : sqrtf(diff2 > 0.0f ? diff2 : 0.0f);
        if (y - effY < pTop[nextIdx] || y + effY > pBot[nextIdx]) {
          deathCause = (y - effY < pTop[nextIdx]) ? FAIL_PIPE_TOP : FAIL_PIPE_BOTTOM;
          deathAbsVy = fabsf(vy);
          deathGapErr = fabsf(y - 0.5f * (pTop[nextIdx] + pBot[nextIdx]));
          break;
        }
      }
    }

    if (count > 0 && pPassed[head] == 0 && px[head] + (float)K_PIPE_W < (float)K_BIRD_X) {
      pPassed[head] = 1;
      score += 1;
      if (score >= jb.targetCap) {
        survived = 1;
        break;
      }
    }
  }

  out->score = score;
  out->survived = survived;
  out->deathCause = deathCause;
  out->ticks = frameCount;
  out->deathAbsVy = deathAbsVy;
  out->deathGapErr = deathGapErr;
  out->rTicks = rTicks;
  out->cTicks = cTicks;
  out->dTicks = dTicks;
  out->s2Ticks = s2Ticks;
  out->pSum = pSum;
  out->cPSum = cPSum;
  out->dPSum = dPSum;
  out->rollSum = rollSum;
  out->ssmSum = ssmSum;
}

#ifdef __CUDACC__
__global__ void audit_batch_f32_kernel(
    int nJobs,
    const GpuAuditSeedJob* jobs,
    const float* allWeights,
    GpuAuditSeedOut* outs) {
  int idx = blockIdx.x * blockDim.x + threadIdx.x;
  if (idx >= nJobs) return;
  audit_single_seed_f32(jobs[idx], allWeights, &outs[idx]);
}
#endif

static void run_audit_jobs_f32(
    bool useCuda,
    const std::vector<GpuAuditSeedJob>& jobs,
    const std::vector<float>& weights,
    std::vector<GpuAuditSeedOut>& outs) {
  int n = (int)jobs.size();
  outs.resize(n);
  if (n == 0) return;

  if (useCuda) {
#ifdef __CUDACC__
    GpuAuditSeedJob* d_j = nullptr;
    float* d_w = nullptr;
    GpuAuditSeedOut* d_o = nullptr;
    cudaMalloc(&d_j, (size_t)n * sizeof(GpuAuditSeedJob));
    cudaMalloc(&d_w, weights.size() * sizeof(float));
    cudaMalloc(&d_o, (size_t)n * sizeof(GpuAuditSeedOut));
    cudaMemcpy(d_j, jobs.data(), (size_t)n * sizeof(GpuAuditSeedJob), cudaMemcpyHostToDevice);
    cudaMemcpy(d_w, weights.data(), weights.size() * sizeof(float), cudaMemcpyHostToDevice);
    int threads = 128;
    int blocks = (n + threads - 1) / threads;
    audit_batch_f32_kernel<<<blocks, threads>>>(n, d_j, d_w, d_o);
    cudaDeviceSynchronize();
    cudaMemcpy(outs.data(), d_o, (size_t)n * sizeof(GpuAuditSeedOut), cudaMemcpyDeviceToHost);
    cudaFree(d_j);
    cudaFree(d_w);
    cudaFree(d_o);
    return;
#endif
  }

#ifdef _OPENMP
  #pragma omp parallel for schedule(dynamic)
#endif
  for (int i = 0; i < n; i++) {
    audit_single_seed_f32(jobs[i], weights.data(), &outs[i]);
  }
}

static AuditResultF64 aggregate_f32_seed_outs(
    int architecture,
    int numSeeds,
    const GpuAuditSeedOut* seedOuts) {
  AuditResultF64 res;
  res.seedScores.reserve(numSeeds);
  int minSc = 1000000000;
  double sumSc = 0.0;
  bool allSurv = true;
  double sumVy = 0.0, sumErr = 0.0;
  uint64_t rTicks = 0, cTicks = 0, dTicks = 0, s2Ticks = 0;
  double pSum = 0.0, cPSum = 0.0, dPSum = 0.0, rollSum = 0.0, ssmSum = 0.0;

  for (int s = 0; s < numSeeds; s++) {
    const GpuAuditSeedOut& o = seedOuts[s];
    res.ticksEvaluated += (uint64_t)o.ticks;
    res.seedScores.push_back((double)o.score);
    sumSc += (double)o.score;
    if (o.score < minSc) minSc = o.score;
    if (!o.survived) allSurv = false;
    if (o.deathCause != FAIL_NONE) {
      res.totalDeaths += 1;
      if (o.deathCause == FAIL_FLOOR) res.floorDeaths += 1;
      else if (o.deathCause == FAIL_CEILING) res.ceilingDeaths += 1;
      else if (o.deathCause == FAIL_PIPE_TOP) res.pipeTopDeaths += 1;
      else if (o.deathCause == FAIL_PIPE_BOTTOM) res.pipeBottomDeaths += 1;
      sumVy += (double)o.deathAbsVy;
      sumErr += (double)o.deathGapErr;
    }
    rTicks += o.rTicks;
    cTicks += o.cTicks;
    dTicks += o.dTicks;
    s2Ticks += o.s2Ticks;
    pSum += (double)o.pSum;
    cPSum += (double)o.cPSum;
    dPSum += (double)o.dPSum;
    rollSum += (double)o.rollSum;
    ssmSum += (double)o.ssmSum;
  }

  res.minSeedScore = res.seedScores.empty() ? 0 : minSc;
  res.meanSeedScore = res.seedScores.empty() ? 0.0 : sumSc / (double)res.seedScores.size();
  res.verifiedPerfect = allSurv && ((int)res.seedScores.size() == numSeeds) && (numSeeds > 0);
  if (res.totalDeaths > 0) {
    res.avgDeathAbsVy = sumVy / (double)res.totalDeaths;
    res.avgDeathGapErr = sumErr / (double)res.totalDeaths;
    int bestCnt = 0;
    const int counts[4] = {res.pipeTopDeaths, res.pipeBottomDeaths, res.floorDeaths, res.ceilingDeaths};
    const int causes[4] = {FAIL_PIPE_TOP, FAIL_PIPE_BOTTOM, FAIL_FLOOR, FAIL_CEILING};
    for (int i = 0; i < 4; i++) {
      if (counts[i] > bestCnt) {
        bestCnt = counts[i];
        res.dominantFailure = causes[i];
      }
    }
  }
  if (architecture >= ARCH_LOOPED_REASONER && architecture <= ARCH_HYBRID_MOE && rTicks > 0) {
    res.hasReasoning = true;
    res.avgPonderSteps = pSum / (double)rTicks;
    res.calmPonderSteps = cTicks > 0 ? cPSum / (double)cTicks : 1.0;
    res.dangerPonderSteps = dTicks > 0 ? dPSum / (double)dTicks : 1.0;
    res.system2Ratio = (double)s2Ticks / (double)rTicks;
    res.avgRolloutAdvantage = rollSum / (double)rTicks;
    res.avgSsmGate = ssmSum / (double)rTicks;
  }
  return res;
}

static GpuAuditSeedJob make_audit_seed_job(
    const TrialTask& tk,
    int trialIdx,
    int seedIdx,
    int paramCount,
    int weightOffset,
    int targetCap,
    int reasoningStepsOverride = -1,
    int hybridMaskOverride = -1) {
  GpuAuditSeedJob jb;
  jb.trialIndex = trialIdx;
  jb.seedIndex = seedIdx;
  jb.architecture = tk.architecture;
  jb.reasoningSteps = reasoningStepsOverride > 0 ? reasoningStepsOverride : tk.reasoningSteps;
  jb.inputCount = tk.inputCount;
  for (int i = 0; i < MAX_SENSORS; i++) jb.inputIndices[i] = tk.inputIndices[i];
  jb.hiddenDepth = tk.hiddenDepth;
  for (int i = 0; i < 5; i++) jb.hiddenLayers[i] = tk.hiddenLayers[i];
  jb.paramCount = paramCount;
  jb.weightOffset = weightOffset;
  jb.targetCap = targetCap;
  jb.seed = (uint32_t)(1009 + seedIdx * 7919);
  jb.baseGap = (float)tk.env.gap;
  jb.gapVar = (float)tk.env.gapVariance;
  jb.baseSpeed = (float)tk.env.pipeSpeed;
  jb.speedVar = (float)tk.env.speedVariability;
  jb.baseSpacing = (float)(tk.env.pipeSpeed * tk.env.spawnFrames);
  jb.movingPipes = tk.env.movingPipes;
  jb.moveAmp = (float)tk.env.moveAmplitude;
  jb.gravity = (float)(K_GRAVITY * tk.env.gravityScale);
  jb.jumpImpulse = (float)(K_JUMP * std::sqrt(tk.env.gravityScale));
  jb.maxFrames = (targetCap + 8) * (int)std::llround(tk.env.spawnFrames * 1.35 + 16.0);
  jb.hybridMaskBits = (hybridMaskOverride >= 0) ? hybridMaskOverride : (tk.morphogenesisEnabled ? 0 : 7);
  return jb;
}

// ============================================================================
// Per-Trial Optimizer State (all 8 optimizers matching src/engine/optimizers.ts)
// ============================================================================
struct ParamRange {
  int wStart, wLen, bStart, bLen, fanIn, fanOut;
};

struct TrialState {
  TrialTask task;
  int paramCount = 0;
  int popSize = 0;
  int gen = 1;
  bool done = false;
  int stoppedReason = 1;
  bool verifiedPerfect = false;
  int bestTrainScore = 0;
  double bestFitness = -1e18;
  double lastAvgScore = 0.0;
  int bestProgressScore = 0;
  double bestProgressFit = -1e18;
  int gensNoImprove = 0;
  int nextAuditTrigger = 40;
  uint64_t trainTicks = 0;
  uint64_t auditTicks = 0;
  FastRng rng;

  // Masked Super-Network Morphogenesis state
  bool morphEnabled = false;
  int activeHiddenCounts[5] = {0, 0, 0, 0, 0};
  int activeSensorCount = 0;
  int activeReasoningSteps = 1;
  int maxReasoningSteps = 1;
  int bioStart = 0;
  int bioLen = 0;
  int initialActiveParams = 0;
  int prunedSynapses = 0;
  int growthEventsCount = 0;
  int pruneEventsCount = 0;
  double morphBestFit = -1e18;
  int morphBestScore = -1;
  int morphStagnation = 0;
  int morphLastEventGen = -999;
  int morphLastPruneGen = -999;
  int morphStage = 0;
  std::vector<ParamRange> transitions;
  std::vector<uint8_t> activeParamMask;
  std::vector<uint8_t> prunedMask;
  std::vector<double> plasticityScale;

  // HYBRID_MOE expert spawning & Trial Grace Window ROI rollback
  int hybridExpertMask = 0;
  int inTrialExpertIdx = -1;
  int trialStartGen = 0;
  double trialPreBestFit = -1e18;
  int trialPreBestScore = -1;
  double trialPreFlops = 0.0;
  double trialPeakFit = -1e18;
  int trialPeakScore = -1;
  std::vector<double> trialPreEliteVec;
  std::vector<uint8_t> trialPreActiveMask;
  std::vector<double> trialPrePlasticity;
  int trialPreExpertMask = 0;
  int expertCooldownUntilGen[3] = {0, 0, 0};
  int rollbackCount = 0;
  int committedExpertsCount = 0;
  double lastAvgFlops = 0.0;

  // Latent continuous population [popSize * paramCount]
  std::vector<double> pop;
  std::vector<double> bestVec;
  std::vector<int> scoreCurve;
  AuditResultF64 bestAudit;
  bool hasBestAudit = false;
  std::vector<double> bestAuditVec;

  // Optimizer-specific persistent state
  std::vector<double> centerTheta;
  std::vector<double> esEps;
  std::vector<int> esPairIdx;
  std::vector<int> esSign;
  std::vector<double> adamM, adamV;
  int adamStep = 0;

  double adaptSigma = 0.28;
  double adaptBestFit = -1e18;
  std::vector<double> adaptBestTheta;

  std::vector<double> cemMu, cemStd;

  std::vector<double> deParents, deParentFit;
  bool deTrialPhase = false;

  std::vector<double> psoVel, psoPBestPos, psoPBestFit, psoGBestPos;
  double psoGBestFit = -1e18;

  std::vector<double> cmaMean, cmaDiagD, cmaPc, cmaPs, cmaBestVec;
  double cmaSigma = 0.35, cmaBestFit = -1e18;
  std::vector<std::vector<double>> cmaArchive;
  int cmaGen = 0;

  TrialState() : rng(17ULL) {}

  explicit TrialState(const TrialTask& t)
      : task(t), rng((uint64_t)t.trialSeed * 0x9e3779b97f4a7c15ULL + 17ULL) {
    paramCount = calc_param_count(t.inputCount, t.hiddenDepth, t.hiddenLayers, t.architecture);
    popSize = t.populationSize;
    nextAuditTrigger = std::min(t.targetPipeCap, 40);
    pop.resize((size_t)popSize * (size_t)paramCount);
    bestVec.assign(paramCount, 0.0);

    init_morphogenesis();
    init_population();
  }

  int active_count_for_layer(int layerIdx) const {
    if (layerIdx == 0) return activeSensorCount;
    if (layerIdx == task.hiddenDepth + 1) return 1;
    return activeHiddenCounts[layerIdx - 1];
  }

  int count_active_params() const {
    int n = 0;
    for (int i = 0; i < paramCount; i++) {
      if (activeParamMask[i] == 1) n++;
    }
    return n;
  }

  double compute_active_flops() const {
    return estimate_arch_flops(
        activeSensorCount > 0 ? activeSensorCount : task.inputCount,
        task.hiddenDepth,
        activeHiddenCounts,
        task.architecture,
        activeReasoningSteps,
        hybridExpertMask);
  }

  float compute_excess_flops_cost() const {
    if (task.flopsPenaltyWeight <= 0.0) return 0.0f;
    double activeFlops = compute_active_flops();
    double baseMlpFlops = estimate_arch_flops(
        activeSensorCount > 0 ? activeSensorCount : task.inputCount,
        task.hiddenDepth,
        activeHiddenCounts,
        ARCH_MLP,
        1,
        0);
    double excess = (activeFlops - baseMlpFlops) / 100.0;
    if (excess <= 0.0) return 0.0f;
    return (float)(excess * task.flopsPenaltyWeight);
  }

  void init_morphogenesis() {
    transitions.clear();
    int dims[MAX_LAYERS];
    dims[0] = task.inputCount;
    for (int i = 0; i < task.hiddenDepth; i++) dims[i + 1] = task.hiddenLayers[i];
    dims[task.hiddenDepth + 1] = 1;
    int cursor = 0;
    for (int l = 0; l <= task.hiddenDepth; l++) {
      ParamRange pr;
      pr.fanIn = dims[l];
      pr.fanOut = dims[l + 1];
      pr.wLen = pr.fanIn * pr.fanOut;
      pr.bLen = pr.fanOut;
      pr.wStart = cursor;
      pr.bStart = cursor + pr.wLen;
      transitions.push_back(pr);
      cursor += pr.wLen + pr.bLen;
    }
    bioStart = cursor;
    bioLen = paramCount - cursor;

    activeParamMask.assign(paramCount, 1);
    prunedMask.assign(paramCount, 0);
    plasticityScale.assign(paramCount, 1.0);

    morphEnabled = (task.morphogenesisEnabled != 0);
    maxReasoningSteps = (task.architecture == ARCH_PONDER_ACT)
                            ? std::max(2, task.reasoningSteps)
                            : ((task.architecture == ARCH_LOOPED_REASONER || task.architecture == ARCH_HYBRID_MOE) ? std::max(1, task.reasoningSteps) : 1);

    if (!morphEnabled) {
      for (int i = 0; i < task.hiddenDepth; i++) activeHiddenCounts[i] = task.hiddenLayers[i];
      activeSensorCount = task.inputCount;
      activeReasoningSteps = task.reasoningSteps;
      hybridExpertMask = (task.architecture == ARCH_HYBRID_MOE) ? 7 : 0;
      initialActiveParams = paramCount;
      lastAvgFlops = compute_active_flops();
      return;
    }

    hybridExpertMask = 0; // HYBRID_MOE starts lean on core MLP
    double initRatio = std::max(0.25, std::min(1.0, task.initialWidthRatio > 0.0 ? task.initialWidthRatio : 0.5));
    for (int i = 0; i < task.hiddenDepth; i++) {
      int w = task.hiddenLayers[i];
      if (w <= 2) activeHiddenCounts[i] = w;
      else activeHiddenCounts[i] = std::max(2, std::min(w, (int)std::ceil((double)w * initRatio)));
    }

    int deferredSensors = 0;
    if (task.progressiveSensors && task.inputCount >= 4) {
      for (int i = task.inputCount - 1; i >= 3; i--) {
        if (task.inputIndices[i] >= 5) deferredSensors += 1;
        else break;
      }
    }
    activeSensorCount = std::max(1, task.inputCount - deferredSensors);

    bool canGrowK = task.growReasoningSteps &&
                    (task.architecture == ARCH_LOOPED_REASONER || task.architecture == ARCH_PONDER_ACT) &&
                    maxReasoningSteps > 1;
    activeReasoningSteps = canGrowK ? 1 : maxReasoningSteps;

    rebuild_masks(nullptr, false);
    initialActiveParams = count_active_params();
    lastAvgFlops = compute_active_flops();
  }

  void get_hybrid_expert_bounds(int ei, int& outStart, int& outLen, int& outWIHLen, int& outAlphaIdx) const {
    int he = hybrid_expert_hidden(task.hiddenDepth, task.hiddenLayers);
    int inC = task.inputCount;
    int cur = bioStart + inC * 4 + 4;
    int lens[3] = {
      inC * he + he + he + 1 + he * 2 + 1,
      inC * he + he + he + 1 + he * 3 + 1,
      inC * he + he + he + 1 + (he * he + he * 3 + 1) + 1
    };
    for (int k = 0; k < ei; k++) cur += lens[k];
    outStart = cur;
    outLen = lens[ei];
    outWIHLen = inC * he;
    outAlphaIdx = cur + outLen - 1;
  }

  void mark_active_bio_params() {
    if (bioLen <= 0) return;
    int arch = task.architecture;
    int base = bioStart;
    if (arch == ARCH_HYBRID_MOE) {
      if ((hybridExpertMask & 7) != 0) {
        int rWLen = task.inputCount * 4;
        int rBStart = base + rWLen;
        for (int m = 0; m < 4; m++) {
          if (rBStart + m < paramCount && prunedMask[rBStart + m] == 0) activeParamMask[rBStart + m] = 1;
          for (int s = 0; s < activeSensorCount; s++) {
            int wIdx = base + m * task.inputCount + s;
            if (wIdx < paramCount && prunedMask[wIdx] == 0) activeParamMask[wIdx] = 1;
          }
        }
      }
      for (int ei = 0; ei < 3; ei++) {
        if ((hybridExpertMask & (1 << ei)) == 0) continue;
        int eStart = 0, eLen = 0, wIHL = 0, aIdx = 0;
        get_hybrid_expert_bounds(ei, eStart, eLen, wIHL, aIdx);
        for (int k = 0; k < eLen; k++) {
          int idx = eStart + k;
          if (idx < paramCount && prunedMask[idx] == 0) activeParamMask[idx] = 1;
        }
      }
      return;
    }
    if (arch == ARCH_RESIDUAL_SKIP) {
      for (int i = 0; i < activeSensorCount && i < bioLen; i++) {
        if (prunedMask[base + i] == 0) activeParamMask[base + i] = 1;
      }
      return;
    }
    if (arch == ARCH_LTC_FLY || arch == ARCH_NEUROCHEM_GATE ||
        arch == ARCH_SYNAPTIC_STP || arch == ARCH_SELECTIVE_SSM) {
      int perNode = (arch == ARCH_NEUROCHEM_GATE || arch == ARCH_SELECTIVE_SSM) ? 3 : 2;
      if (task.hiddenDepth == 0) {
        for (int k = 0; k < std::min(perNode, bioLen); k++) {
          if (prunedMask[base + k] == 0) activeParamMask[base + k] = 1;
        }
        return;
      }
      int nodeOff = 0;
      for (int l = 0; l < task.hiddenDepth; l++) {
        int cap = task.hiddenLayers[l];
        int act = activeHiddenCounts[l];
        for (int j = 0; j < act; j++) {
          int pOff = base + (nodeOff + j) * perNode;
          for (int k = 0; k < perNode && pOff + k < paramCount; k++) {
            if (prunedMask[pOff + k] == 0) activeParamMask[pOff + k] = 1;
          }
        }
        nodeOff += cap;
      }
      return;
    }
    if (arch == ARCH_DROSOPHILA_CONNECTOME) {
      int totalH = 0;
      for (int l = 0; l < task.hiddenDepth; l++) totalH += task.hiddenLayers[l];
      int bioNodes = totalH > 0 ? totalH : 1;
      if (task.hiddenDepth == 0) {
        for (int k = 0; k < std::min(2, bioLen); k++) {
          if (prunedMask[base + k] == 0) activeParamMask[base + k] = 1;
        }
      } else {
        int nodeOff = 0;
        for (int l = 0; l < task.hiddenDepth; l++) {
          int cap = task.hiddenLayers[l];
          int act = activeHiddenCounts[l];
          for (int j = 0; j < act; j++) {
            int pOff = base + (nodeOff + j) * 2;
            for (int k = 0; k < 2 && pOff + k < paramCount; k++) {
              if (prunedMask[pOff + k] == 0) activeParamMask[pOff + k] = 1;
            }
          }
          nodeOff += cap;
        }
      }
      int gfOff = base + bioNodes * 2;
      int gfLen = task.hiddenDepth > 0 ? task.inputCount : 0;
      for (int i = 0; i < activeSensorCount && i < gfLen; i++) {
        if (gfOff + i < paramCount && prunedMask[gfOff + i] == 0) activeParamMask[gfOff + i] = 1;
      }
      int tailOff = gfOff + gfLen;
      for (int k = 0; k < 4; k++) {
        if (tailOff + k < paramCount && prunedMask[tailOff + k] == 0) activeParamMask[tailOff + k] = 1;
      }
      return;
    }
    int H = task.hiddenDepth > 0 ? task.hiddenLayers[task.hiddenDepth - 1] : 1;
    int actH = task.hiddenDepth > 0 ? activeHiddenCounts[task.hiddenDepth - 1] : 1;
    for (int j = 0; j < actH; j++) {
      for (int i = 0; i < actH; i++) {
        int idx = base + j * H + i;
        if (idx < paramCount && prunedMask[idx] == 0) activeParamMask[idx] = 1;
      }
    }
    int v1 = base + H * H;
    int v2 = v1 + H;
    int v3 = v2 + H;
    for (int j = 0; j < actH; j++) {
      if (v1 + j < paramCount && prunedMask[v1 + j] == 0) activeParamMask[v1 + j] = 1;
      if (v2 + j < paramCount && prunedMask[v2 + j] == 0) activeParamMask[v2 + j] = 1;
      if ((arch == ARCH_PONDER_ACT || arch == ARCH_LATENT_ROLLOUT) &&
          v3 + j < paramCount && prunedMask[v3 + j] == 0) {
        activeParamMask[v3 + j] = 1;
      }
    }
    if (arch == ARCH_PONDER_ACT) {
      int bHaltIdx = v3 + H;
      if (bHaltIdx < paramCount && prunedMask[bHaltIdx] == 0) activeParamMask[bHaltIdx] = 1;
    }
  }

  void rebuild_masks(const std::vector<uint8_t>* prevMask, bool applyMyelination) {
    std::fill(activeParamMask.begin(), activeParamMask.end(), 0);
    for (int l = 0; l < (int)transitions.size(); l++) {
      const ParamRange& tr = transitions[l];
      int actIn = active_count_for_layer(l);
      int actOut = active_count_for_layer(l + 1);
      for (int o = 0; o < actOut; o++) {
        int bIdx = tr.bStart + o;
        if (prunedMask[bIdx] == 0) activeParamMask[bIdx] = 1;
        int rowOff = tr.wStart + o * tr.fanIn;
        for (int i = 0; i < actIn; i++) {
          int wIdx = rowOff + i;
          if (prunedMask[wIdx] == 0) activeParamMask[wIdx] = 1;
        }
      }
    }
    mark_active_bio_params();

    double myelScale = std::max(0.05, std::min(1.0, task.myelinationScale > 0.0 ? task.myelinationScale : 0.25));
    for (int i = 0; i < paramCount; i++) {
      if (activeParamMask[i] == 0) {
        plasticityScale[i] = 0.0;
      } else if (applyMyelination && prevMask != nullptr && (*prevMask)[i] == 1) {
        plasticityScale[i] = myelScale;
      } else if (applyMyelination && prevMask != nullptr && (*prevMask)[i] == 0) {
        plasticityScale[i] = 1.25;
      } else {
        plasticityScale[i] = 1.0;
      }
    }
  }

  void enforce_masks_on_vec(double* v) const {
    if (!morphEnabled) return;
    for (int i = 0; i < paramCount; i++) {
      if (activeParamMask[i] == 0) v[i] = 0.0;
    }
  }

  void enforce_all_masks() {
    if (!morphEnabled) return;
    for (int i = 0; i < popSize; i++) enforce_masks_on_vec(&pop[(size_t)i * paramCount]);
    enforce_masks_on_vec(bestVec.data());
    if (!bestAuditVec.empty()) enforce_masks_on_vec(bestAuditVec.data());
    if (!centerTheta.empty()) enforce_masks_on_vec(centerTheta.data());
    if (!adaptBestTheta.empty()) enforce_masks_on_vec(adaptBestTheta.data());
    if (!cemMu.empty()) enforce_masks_on_vec(cemMu.data());
    if (!deParents.empty()) {
      for (int i = 0; i < popSize; i++) enforce_masks_on_vec(&deParents[(size_t)i * paramCount]);
    }
    if (!psoPBestPos.empty()) {
      for (int i = 0; i < popSize; i++) enforce_masks_on_vec(&psoPBestPos[(size_t)i * paramCount]);
      enforce_masks_on_vec(psoGBestPos.data());
      enforce_masks_on_vec(psoVel.data());
    }
    if (!cmaMean.empty()) {
      enforce_masks_on_vec(cmaMean.data());
      enforce_masks_on_vec(cmaBestVec.data());
    }
  }

  void apply_zero_init_for_new_params(
      const std::vector<uint8_t>& prevMask,
      int unlockedHiddenLayerIdx,
      int nStart,
      int nEnd) {
    std::vector<uint8_t> isIncoming(paramCount, 0);
    if (unlockedHiddenLayerIdx >= 0 && nEnd > nStart) {
      const ParamRange& trIn = transitions[unlockedHiddenLayerIdx];
      int actIn = active_count_for_layer(unlockedHiddenLayerIdx);
      for (int o = nStart; o < nEnd; o++) {
        isIncoming[trIn.bStart + o] = 1;
        int rowOff = trIn.wStart + o * trIn.fanIn;
        for (int i = 0; i < actIn; i++) isIncoming[rowOff + i] = 1;
      }
    }

    auto applyVec = [&](double* v, bool useRandomIn) {
      for (int i = 0; i < paramCount; i++) {
        if (activeParamMask[i] == 0) v[i] = 0.0;
        else if (prevMask[i] == 0 && activeParamMask[i] == 1) {
          v[i] = (useRandomIn && isIncoming[i]) ? (rng.randn() * 0.35) : 0.0;
        }
      }
    };

    for (int i = 0; i < popSize; i++) applyVec(&pop[(size_t)i * paramCount], true);
    applyVec(bestVec.data(), false);
    if (!centerTheta.empty()) applyVec(centerTheta.data(), false);
    if (!adaptBestTheta.empty()) applyVec(adaptBestTheta.data(), false);
    if (!cemMu.empty()) {
      applyVec(cemMu.data(), false);
      for (int i = 0; i < paramCount; i++) {
        if (prevMask[i] == 0 && activeParamMask[i] == 1) {
          cemStd[i] = std::max(0.25, task.mutationStrength * 1.25);
        }
      }
    }
    if (!deParents.empty()) {
      for (int i = 0; i < popSize; i++) applyVec(&deParents[(size_t)i * paramCount], true);
    }
    if (!psoPBestPos.empty()) {
      for (int i = 0; i < popSize; i++) applyVec(&psoPBestPos[(size_t)i * paramCount], false);
      applyVec(psoGBestPos.data(), false);
      for (int i = 0; i < popSize; i++) {
        for (int j = 0; j < paramCount; j++) {
          if (activeParamMask[j] == 0 || (prevMask[j] == 0 && activeParamMask[j] == 1)) {
            psoVel[(size_t)i * paramCount + j] = 0.0;
          }
        }
      }
    }
    if (!cmaMean.empty()) {
      applyVec(cmaMean.data(), false);
      applyVec(cmaBestVec.data(), false);
      for (int j = 0; j < paramCount; j++) {
        if (prevMask[j] == 0 && activeParamMask[j] == 1) {
          cmaDiagD[j] = 1.0;
          cmaPc[j] = 0.0;
          cmaPs[j] = 0.0;
        }
      }
      for (auto& av : cmaArchive) applyVec(av.data(), false);
    }
  }

  void diagnose_elite(
      const EnvParams& env,
      uint32_t seed,
      double& outOverallSat,
      double* outLayerSat,
      double& outActiveSparsity) const {
    auto qVec = quantize_vec(bestVec);
    Mulberry32 mRng(seed);
    double speedPhaseA = mRng.next_f64() * K_TWO_PI;
    double speedPhaseB = mRng.next_f64() * K_TWO_PI;
    double baseSpacing = env.pipeSpeed * env.spawnFrames;
    double gravity = K_GRAVITY * env.gravityScale;
    double jumpImpulse = K_JUMP * std::sqrt(env.gravityScale);
    double margin = env.movingPipes ? 72.0 : 52.0;
    double minPipeX = K_BIRD_X - K_BIRD_R;
    const double invHalfPlayable = 2.0 / K_PLAYABLE_H;
    const double invMaxVy = 1.0 / K_MAX_VY;
    const double invCanvasW = 1.0 / K_CANVAS_W;
    const double invPipeVy = 1.0 / K_MAX_PIPE_VY_NORM;

    double px[16], pBaseTop[16], pGap[16], pTop[16], pBot[16], pPhase[16], pVy[16];
    int head = 0, count = 1;
    double distUntilNextSpawn = baseSpacing;
    double initGap = std::max(76.0, std::min(204.0, env.gap + (env.gapVariance > 0.0 ? (mRng.next_f64() * 2.0 - 1.0) * env.gapVariance : 0.0)));
    double initTop = margin + mRng.next_f64() * std::max(20.0, K_PLAYABLE_H - initGap - margin * 2.0);
    px[0] = K_CANVAS_W + 60.0;
    pBaseTop[0] = initTop;
    pGap[0] = initGap;
    pTop[0] = initTop;
    pBot[0] = initTop + initGap;
    pPhase[0] = mRng.next_f64() * K_TWO_PI;
    pVy[0] = 0.0;

    double y = K_PLAYABLE_H * 0.46;
    double vy = 0.0;
    double state[MAX_STATE];
    double initSt = (task.architecture == ARCH_SYNAPTIC_STP) ? 1.0 : 0.0;
    for (int i = 0; i < MAX_STATE; i++) state[i] = initSt;

    double layerHits[5] = {0, 0, 0, 0, 0};
    double layerTotal[5] = {0, 0, 0, 0, 0};
    double hiddenActs[4 * MAX_WIDTH];

    for (int f = 1; f <= 220; f++) {
      double tickSpeed = env.pipeSpeed;
      if (env.speedVariability > 0.0) {
        double sm = 1.0 + env.speedVariability *
                              (0.55 * std::sin((double)f * 0.031 + speedPhaseA) +
                               0.45 * std::cos((double)f * 0.079 + speedPhaseB));
        tickSpeed = std::max(1.2, env.pipeSpeed * sm);
      }
      distUntilNextSpawn -= tickSpeed;
      if (distUntilNextSpawn <= 0.0 && count < 15) {
        int tail = (head + count) & 15;
        double pg = std::max(76.0, std::min(204.0, env.gap + (env.gapVariance > 0.0 ? (mRng.next_f64() * 2.0 - 1.0) * env.gapVariance : 0.0)));
        double bt = margin + mRng.next_f64() * std::max(20.0, K_PLAYABLE_H - pg - margin * 2.0);
        px[tail] = K_CANVAS_W + 20.0;
        pBaseTop[tail] = bt;
        pGap[tail] = pg;
        pTop[tail] = bt;
        pBot[tail] = bt + pg;
        pPhase[tail] = mRng.next_f64() * K_TWO_PI;
        pVy[tail] = 0.0;
        count += 1;
        distUntilNextSpawn = (env.speedVariability > 0.0 || env.gapVariance > 0.0)
                                 ? baseSpacing * (0.88 + mRng.next_f64() * 0.24)
                                 : baseSpacing;
      }

      int nextIdx = head;
      bool foundNext = false;
      int next2Idx = -1;
      double timeAngle = (double)f * 0.045;
      for (int k = 0; k < count; k++) {
        int idx = (head + k) & 15;
        px[idx] -= tickSpeed;
        if (env.movingPipes) {
          double prevTop = pTop[idx];
          double pg = pGap[idx];
          double nt = std::max(42.0, std::min(K_PLAYABLE_H - pg - 42.0, pBaseTop[idx] + std::sin(timeAngle + pPhase[idx]) * env.moveAmplitude));
          pTop[idx] = nt;
          pBot[idx] = nt + pg;
          pVy[idx] = nt - prevTop;
        }
        if (!foundNext) {
          if (px[idx] + K_PIPE_W >= minPipeX) {
            nextIdx = idx;
            foundNext = true;
          }
        } else if (next2Idx == -1) {
          next2Idx = idx;
        }
      }
      if (count > 0 && px[head] + K_PIPE_W < -24.0) {
        head = (head + 1) & 15;
        count -= 1;
      }

      double gapTop = foundNext ? pTop[nextIdx] : K_PLAYABLE_H * 0.35;
      double gapBot = foundNext ? pBot[nextIdx] : K_PLAYABLE_H * 0.65;
      double pipeEdgeX = foundNext ? px[nextIdx] + K_PIPE_W : K_CANVAS_W;
      double gapVyVal = (foundNext && env.movingPipes) ? pVy[nextIdx] * invPipeVy : 0.0;
      bool hasNext2 = (foundNext && next2Idx != -1);

      double rawIn[MAX_SENSORS];
      rawIn[0] = y * invHalfPlayable - 1.0;
      rawIn[1] = std::max(-1.0, std::min(1.0, vy * invMaxVy));
      rawIn[2] = std::max(-0.2, std::min(1.0, (pipeEdgeX - K_BIRD_X) * invCanvasW));
      rawIn[3] = (y - gapTop) * invHalfPlayable;
      rawIn[4] = (gapBot - y) * invHalfPlayable;
      rawIn[5] = std::max(-1.0, std::min(1.0, gapVyVal));
      if (hasNext2) {
        double n2 = ((pTop[next2Idx] + pBot[next2Idx] - (gapTop + gapBot)) * 0.5) * invHalfPlayable;
        rawIn[6] = std::max(-1.0, std::min(1.0, n2));
        rawIn[7] = (y - pTop[next2Idx]) * invHalfPlayable;
        rawIn[8] = (pBot[next2Idx] - y) * invHalfPlayable;
        rawIn[9] = std::max(-0.2, std::min(1.0, (px[next2Idx] + K_PIPE_W - K_BIRD_X) * invCanvasW));
        rawIn[10] = env.movingPipes ? std::max(-1.0, std::min(1.0, pVy[next2Idx] * invPipeVy)) : 0.0;
      } else {
        rawIn[6] = 0.0;
        rawIn[7] = 0.0;
        rawIn[8] = 0.0;
        rawIn[9] = 1.0;
        rawIn[10] = 0.0;
      }
      rawIn[11] = foundNext
                      ? std::max(0.0, std::min(1.0, (pipeEdgeX - K_BIRD_X) / (std::max(1.2, tickSpeed) * 120.0)))
                      : 1.0;

      double subIn[MAX_SENSORS];
      for (int i = 0; i < task.inputCount; i++) subIn[i] = rawIn[task.inputIndices[i]];

      double logit = (task.architecture == ARCH_HYBRID_MOE)
          ? forward_hybrid_moe<double, false>(
                qVec.data(), task.inputCount, task.hiddenDepth, task.hiddenLayers,
                activeReasoningSteps, subIn, state, hybridExpertMask, nullptr, hiddenActs, nullptr)
          : forward_network<double, false>(
                qVec.data(), task.inputCount, task.hiddenDepth, task.hiddenLayers,
                task.architecture, activeReasoningSteps, subIn, state, nullptr, hiddenActs);

      for (int l = 0; l < task.hiddenDepth; l++) {
        int actN = activeHiddenCounts[l];
        for (int j = 0; j < actN; j++) {
          if (std::fabs(hiddenActs[l * MAX_WIDTH + j]) > 0.88) layerHits[l] += 1.0;
        }
        layerTotal[l] += (double)actN;
      }

      if (logit > 0.0) vy = jumpImpulse;
      vy += gravity;
      if (vy > K_MAX_VY) vy = K_MAX_VY;
      y += vy;

      if (y - K_FLOOR_HIT_R <= 0.0 || y + K_FLOOR_HIT_R >= K_PLAYABLE_H) break;
      if (foundNext) {
        double pLeft = px[nextIdx], pRight = pLeft + K_PIPE_W;
        double dx = 0.0;
        if (K_BIRD_X < pLeft) dx = pLeft - K_BIRD_X;
        else if (K_BIRD_X > pRight) dx = K_BIRD_X - pRight;
        if (dx < K_PIPE_HIT_R) {
          double effY = dx == 0.0 ? K_PIPE_HIT_R : std::sqrt(std::max(0.0, K_PIPE_HIT_R2 - dx * dx));
          if (y - effY < pTop[nextIdx] || y + effY > pBot[nextIdx]) break;
        }
      }
    }

    double totHits = 0.0, totChk = 0.0;
    for (int l = 0; l < task.hiddenDepth; l++) {
      outLayerSat[l] = layerTotal[l] > 0.0 ? (layerHits[l] / layerTotal[l]) : 0.0;
      totHits += layerHits[l];
      totChk += layerTotal[l];
    }
    outOverallSat = totChk > 0.0 ? (totHits / totChk) : 0.0;

    int activeWTot = 0, nearZero = 0;
    double pThresh = task.pruneThreshold > 0.0 ? task.pruneThreshold : 0.06;
    for (const auto& tr : transitions) {
      for (int i = 0; i < tr.wLen; i++) {
        int idx = tr.wStart + i;
        if (activeParamMask[idx] == 1) {
          activeWTot++;
          if (std::fabs(qVec[idx]) < pThresh) nearZero++;
        }
      }
    }
    outActiveSparsity = activeWTot > 0 ? ((double)nearZero / (double)activeWTot) : 0.0;
  }

  bool execute_synaptic_pruning() {
    double cutoff = task.pruneThreshold > 0.0 ? task.pruneThreshold : 0.06;
    std::vector<int> toPrune;
    for (int l = 0; l < (int)transitions.size(); l++) {
      const auto& tr = transitions[l];
      int actIn = active_count_for_layer(l);
      int actOut = active_count_for_layer(l + 1);
      for (int o = 0; o < actOut; o++) {
        int rowOff = tr.wStart + o * tr.fanIn;
        double maxAbs = -1.0;
        int strongestIdx = -1;
        std::vector<int> weakRow;
        for (int i = 0; i < actIn; i++) {
          int idx = rowOff + i;
          if (activeParamMask[idx] != 1) continue;
          double a = std::fabs(bestVec[idx]);
          if (a > maxAbs) {
            maxAbs = a;
            strongestIdx = idx;
          }
          if (a < cutoff) weakRow.push_back(idx);
        }
        for (int idx : weakRow) {
          if (idx != strongestIdx) toPrune.push_back(idx);
        }
      }
    }
    if ((int)toPrune.size() < 2) return false;
    for (int idx : toPrune) {
      prunedMask[idx] = 1;
      activeParamMask[idx] = 0;
      plasticityScale[idx] = 0.0;
    }
    prunedSynapses += (int)toPrune.size();
    pruneEventsCount += 1;
    morphLastPruneGen = gen;
    morphLastEventGen = gen;
    morphStagnation = 0;
    enforce_all_masks();
    return true;
  }

  void zero_init_hybrid_expert_on_vec(double* v, int ei, bool randomIn) {
    int eStart = 0, eLen = 0, wIHL = 0, aIdx = 0;
    get_hybrid_expert_bounds(ei, eStart, eLen, wIHL, aIdx);
    int he = hybrid_expert_hidden(task.hiddenDepth, task.hiddenLayers);
    double wScale = std::sqrt(2.0 / (double)(task.inputCount + he));
    for (int k = 0; k < wIHL; k++) v[eStart + k] = randomIn ? (rng.randn() * wScale) : 0.0;
    for (int k = wIHL; k < eLen; k++) v[eStart + k] = 0.0;
    v[aIdx] = 0.0; // exact Zero-Init alpha = 0 -> zero perturbation at spawn
    int rBStart = bioStart + task.inputCount * 4;
    if (rBStart < paramCount) v[rBStart] = 0.65;
    if (rBStart + 1 + ei < paramCount) v[rBStart + 1 + ei] = -0.2;
  }

  void apply_zero_init_expert_all(int ei) {
    for (int i = 0; i < popSize; i++) zero_init_hybrid_expert_on_vec(&pop[(size_t)i * paramCount], ei, i > 0);
    zero_init_hybrid_expert_on_vec(bestVec.data(), ei, false);
    if (!centerTheta.empty()) zero_init_hybrid_expert_on_vec(centerTheta.data(), ei, false);
    if (!adaptBestTheta.empty()) zero_init_hybrid_expert_on_vec(adaptBestTheta.data(), ei, false);
    if (!cemMu.empty()) {
      zero_init_hybrid_expert_on_vec(cemMu.data(), ei, false);
      int eStart = 0, eLen = 0, wIHL = 0, aIdx = 0;
      get_hybrid_expert_bounds(ei, eStart, eLen, wIHL, aIdx);
      for (int k = 0; k < eLen; k++) cemStd[eStart + k] = std::max(0.25, task.mutationStrength * 1.25);
    }
    if (!deParents.empty()) {
      for (int i = 0; i < popSize; i++) zero_init_hybrid_expert_on_vec(&deParents[(size_t)i * paramCount], ei, i > 0);
    }
    if (!psoPBestPos.empty()) {
      for (int i = 0; i < popSize; i++) zero_init_hybrid_expert_on_vec(&psoPBestPos[(size_t)i * paramCount], ei, false);
      zero_init_hybrid_expert_on_vec(psoGBestPos.data(), ei, false);
    }
    if (!cmaMean.empty()) {
      zero_init_hybrid_expert_on_vec(cmaMean.data(), ei, false);
      zero_init_hybrid_expert_on_vec(cmaBestVec.data(), ei, false);
    }
    enforce_all_masks();
  }

  int select_diagnostic_expert(const EnvParams& env) const {
    if (task.architecture != ARCH_HYBRID_MOE || !task.allowExpertSpawning || inTrialExpertIdx != -1) return -1;
    int ord[3];
    if (env.movingPipes) { ord[0] = 0; ord[1] = 1; ord[2] = 2; }
    else if (env.speedVariability > 0.1 || env.gapVariance > 10.0) { ord[0] = 1; ord[1] = 2; ord[2] = 0; }
    else { ord[0] = 2; ord[1] = 0; ord[2] = 1; }
    for (int k = 0; k < 3; k++) {
      int ei = ord[k];
      if ((hybridExpertMask & (1 << ei)) == 0 && gen >= expertCooldownUntilGen[ei]) return ei;
    }
    return -1;
  }

  void step_morphogenesis(double genBestFit, int genBestSc, const EnvParams& activeEnv) {
    lastAvgFlops = compute_active_flops();
    if (!morphEnabled) return;

    // 1. Evaluate Trial Grace Window ROI (Commit vs Rollback)
    if (inTrialExpertIdx != -1) {
      if (genBestFit > trialPeakFit) trialPeakFit = genBestFit;
      if (genBestSc > trialPeakScore) trialPeakScore = genBestSc;
      int winLen = task.expertTrialWindowGens > 0 ? task.expertTrialWindowGens : 12;
      if (gen - trialStartGen >= winLen) {
        int ei = inTrialExpertIdx;
        double currFlops = compute_active_flops();
        double deltaKFlops = std::max(0.4, (currFlops - trialPreFlops) / 100.0);
        double reqGain = std::max(task.expertMinRoiGain > 0.0 ? task.expertMinRoiGain : 1.2,
                                  deltaKFlops * task.flopsPenaltyWeight * 280.0);
        bool didImproveScore = (trialPeakScore > trialPreBestScore);
        bool didPayOff = (trialPeakFit >= trialPreBestFit + reqGain);

        if (didImproveScore || didPayOff) {
          inTrialExpertIdx = -1;
          trialPreEliteVec.clear();
          committedExpertsCount += 1;
          std::vector<uint8_t> prevMask = activeParamMask;
          rebuild_masks(&prevMask, true);
          morphLastEventGen = gen;
          morphStagnation = 0;
        } else {
          // Rollback expert cleanly to lossless pre-spawn elite snapshot
          hybridExpertMask = trialPreExpertMask;
          activeParamMask = trialPreActiveMask;
          plasticityScale = trialPrePlasticity;
          if (!trialPreEliteVec.empty()) {
            bestVec = trialPreEliteVec;
            for (int i = 0; i < popSize; i++) {
              double* dst = &pop[(size_t)i * paramCount];
              std::memcpy(dst, trialPreEliteVec.data(), sizeof(double) * paramCount);
              if (i > 0) {
                for (int j = 0; j < paramCount; j++) {
                  if (activeParamMask[j] && rng.uniform() < 0.15) {
                    dst[j] += rng.randn() * 0.22 * plasticityScale[j];
                  }
                }
              }
            }
            if (!centerTheta.empty()) centerTheta = trialPreEliteVec;
            if (!adaptBestTheta.empty()) adaptBestTheta = trialPreEliteVec;
            if (!cemMu.empty()) cemMu = trialPreEliteVec;
            if (!cmaMean.empty()) { cmaMean = trialPreEliteVec; cmaBestVec = trialPreEliteVec; }
          }
          inTrialExpertIdx = -1;
          trialPreEliteVec.clear();
          rollbackCount += 1;
          expertCooldownUntilGen[ei] = gen + 24;
          morphLastEventGen = gen;
          morphStagnation = 0;
          enforce_all_masks();
        }
        lastAvgFlops = compute_active_flops();
      }
      return;
    }

    if (genBestSc > morphBestScore || genBestFit > morphBestFit + 0.5) {
      morphBestScore = std::max(morphBestScore, genBestSc);
      morphBestFit = std::max(morphBestFit, genBestFit);
      morphStagnation = 0;
    } else {
      morphStagnation += 1;
    }

    if (gen - morphLastEventGen == 12) {
      for (int i = 0; i < paramCount; i++) {
        if (activeParamMask[i] == 1 && plasticityScale[i] > 1.0) plasticityScale[i] = 1.0;
      }
    }

    int stagTrig = std::max(4, task.growthStagnationTrigger > 0 ? task.growthStagnationTrigger : 10);
    int cooldown = std::max(4, (int)std::floor((double)stagTrig * 0.6));
    if (morphStagnation < stagTrig || gen - morphLastEventGen < cooldown) return;

    double overallSat = 0.0, activeSparsity = 0.0;
    double layerSat[5] = {0, 0, 0, 0, 0};
    uint32_t probeSeed = (uint32_t)(task.trialSeed * 1664525u + (uint32_t)gen * 1013904223u + 7u);
    diagnose_elite(activeEnv, probeSeed, overallSat, layerSat, activeSparsity);

    double pruneSpTrig = task.pruneSparsityTrigger > 0.0 ? task.pruneSparsityTrigger : 0.28;
    if (activeSparsity >= pruneSpTrig && gen - morphLastPruneGen >= stagTrig * 2) {
      if (execute_synaptic_pruning()) return;
    }

    int mostSatLayer = -1;
    double bestLayerSat = -1.0;
    for (int l = 0; l < task.hiddenDepth; l++) {
      if (activeHiddenCounts[l] < task.hiddenLayers[l]) {
        double sat = layerSat[l];
        if (sat > bestLayerSat) {
          bestLayerSat = sat;
          mostSatLayer = l;
        }
      }
    }
    bool canGrowWidth = (mostSatLayer != -1);
    bool canGrowK = task.growReasoningSteps &&
                    (task.architecture == ARCH_LOOPED_REASONER || task.architecture == ARCH_PONDER_ACT) &&
                    activeReasoningSteps < maxReasoningSteps;
    bool canUnlockSensor = (activeSensorCount < task.inputCount);
    int expCand = select_diagnostic_expert(activeEnv);
    bool canSpawnExpert = (expCand != -1);

    if (!canGrowWidth && !canGrowK && !canUnlockSensor && !canSpawnExpert) {
      if (activeSparsity >= pruneSpTrig * 0.85 && gen - morphLastPruneGen >= stagTrig * 2) {
        execute_synaptic_pruning();
      }
      return;
    }

    double satThresh = task.saturationThreshold > 0.0 ? task.saturationThreshold : 0.62;
    int chosen = 0; // 0=GROW_WIDTH, 1=GROW_K, 2=UNLOCK_SENSOR, 3=SPAWN_EXPERT
    if (canGrowWidth && bestLayerSat >= satThresh) chosen = 0;
    else if (canSpawnExpert && (activeEnv.movingPipes || morphStage >= 1 || !canGrowWidth)) chosen = 3;
    else if (canGrowK && (activeReasoningSteps == 1 || !canGrowWidth)) chosen = 1;
    else if (canUnlockSensor && (morphStage >= 1 || !canGrowWidth)) chosen = 2;
    else if (canGrowWidth) chosen = 0;
    else if (canSpawnExpert) chosen = 3;
    else if (canGrowK) chosen = 1;
    else chosen = 2;

    std::vector<uint8_t> prevMask = activeParamMask;
    if (chosen == 3 && expCand >= 0) {
      trialPreBestFit = genBestFit;
      trialPreBestScore = genBestSc;
      trialPreFlops = compute_active_flops();
      trialPeakFit = genBestFit;
      trialPeakScore = genBestSc;
      trialStartGen = gen;
      trialPreExpertMask = hybridExpertMask;
      trialPreActiveMask = activeParamMask;
      trialPrePlasticity = plasticityScale;
      trialPreEliteVec = bestVec;
      inTrialExpertIdx = expCand;

      hybridExpertMask |= (1 << expCand);
      rebuild_masks(&prevMask, true);
      apply_zero_init_expert_all(expCand);
      growthEventsCount += 1;
      morphStage += 1;
    } else if (chosen == 0) {
      int cap = task.hiddenLayers[mostSatLayer];
      int prevW = activeHiddenCounts[mostSatLayer];
      int delta = cap >= 8 ? std::min(2, cap - prevW) : 1;
      int nextW = prevW + delta;
      activeHiddenCounts[mostSatLayer] = nextW;
      rebuild_masks(&prevMask, true);
      apply_zero_init_for_new_params(prevMask, mostSatLayer, prevW, nextW);
      growthEventsCount += 1;
      morphStage += 1;
    } else if (chosen == 1) {
      activeReasoningSteps += 1;
      rebuild_masks(&prevMask, true);
      for (int i = bioStart; i < paramCount; i++) {
        if (activeParamMask[i] == 1) plasticityScale[i] = 1.2;
      }
      growthEventsCount += 1;
      morphStage += 1;
    } else {
      activeSensorCount += 1;
      rebuild_masks(&prevMask, true);
      apply_zero_init_for_new_params(prevMask, -1, 0, 0);
      growthEventsCount += 1;
      morphStage += 1;
    }
    morphLastEventGen = gen;
    morphStagnation = 0;
    lastAvgFlops = compute_active_flops();
  }

  void random_brain(double* dst) {
    int dims[MAX_LAYERS];
    dims[0] = task.inputCount;
    for (int i = 0; i < task.hiddenDepth; i++) dims[i + 1] = task.hiddenLayers[i];
    dims[task.hiddenDepth + 1] = 1;
    int off = 0;
    for (int l = 0; l <= task.hiddenDepth; l++) {
      int inD = dims[l], outD = dims[l + 1];
      double scale = std::sqrt(2.0 / (double)(inD + outD));
      for (int k = 0; k < inD * outD; k++) dst[off++] = rng.randn() * scale;
      for (int k = 0; k < outD; k++) dst[off++] = rng.randn() * 0.25;
    }
    if (task.architecture == ARCH_DROSOPHILA_CONNECTOME) {
      int totalH = 0;
      for (int l = 0; l < task.hiddenDepth; l++) totalH += task.hiddenLayers[l];
      int bioNodes = totalH > 0 ? totalH : 1;
      for (int i = 0; i < bioNodes && off + 1 < paramCount; i++) {
        dst[off++] = rng.randn() * 0.8 + 0.4;
        dst[off++] = rng.randn() * 0.5;
      }
      if (task.hiddenDepth > 0) {
        double gfScale = std::sqrt(1.0 / (double)std::max(1, task.inputCount)) * 0.75;
        for (int i = 0; i < task.inputCount && off < paramCount; i++) {
          dst[off++] = rng.randn() * gfScale;
        }
      }
      if (off < paramCount) dst[off++] = rng.randn() * 0.5 + 0.2;
      if (off < paramCount) dst[off++] = rng.randn() * 0.6 - 0.5;
      if (off < paramCount) dst[off++] = rng.randn() * 0.6 + 0.6;
      if (off < paramCount) dst[off++] = rng.randn() * 0.4;
    }
    while (off < paramCount) dst[off++] = rng.randn() * 0.35;
    enforce_masks_on_vec(dst);
  }

  void init_population() {
    if (task.algorithm == ALGO_NATURAL_ES || task.algorithm == ALGO_ADAM_ES) {
      centerTheta.resize(paramCount);
      random_brain(centerTheta.data());
      adamM.assign(paramCount, 0.0);
      adamV.assign(paramCount, 0.0);
      adamStep = 0;
      spawn_es();
    } else if (task.algorithm == ALGO_ADAPTIVE_ES) {
      adaptBestTheta.resize(paramCount);
      random_brain(adaptBestTheta.data());
      adaptSigma = task.mutationStrength;
      adaptBestFit = -1e18;
      spawn_adaptive_es();
    } else if (task.algorithm == ALGO_CEM) {
      cemMu.resize(paramCount);
      random_brain(cemMu.data());
      cemStd.assign(paramCount, std::max(0.25, task.mutationStrength * 1.25));
      spawn_cem();
    } else if (task.algorithm == ALGO_CMA_HYBRID) {
      cmaMean.resize(paramCount);
      random_brain(cmaMean.data());
      cmaDiagD.assign(paramCount, 1.0);
      cmaPc.assign(paramCount, 0.0);
      cmaPs.assign(paramCount, 0.0);
      cmaSigma = std::max(0.24, task.mutationStrength * 1.2);
      cmaBestVec = cmaMean;
      cmaBestFit = -1e18;
      cmaArchive.clear();
      cmaArchive.push_back(cmaMean);
      cmaGen = 0;
      spawn_cma();
    } else {
      for (int i = 0; i < popSize; i++) random_brain(&pop[(size_t)i * paramCount]);
      if (task.algorithm == ALGO_DE) {
        deParents = pop;
        deParentFit.assign(popSize, -1e18);
        deTrialPhase = false;
      } else if (task.algorithm == ALGO_PSO) {
        psoVel.resize((size_t)popSize * paramCount);
        for (size_t i = 0; i < psoVel.size(); i++) {
          int j = (int)(i % (size_t)paramCount);
          psoVel[i] = activeParamMask[j] ? (rng.randn() * task.mutationStrength * 0.4 * plasticityScale[j]) : 0.0;
        }
        psoPBestPos = pop;
        psoPBestFit.assign(popSize, -1e18);
        psoGBestPos.assign(pop.begin(), pop.begin() + paramCount);
        psoGBestFit = -1e18;
      }
    }
    bestVec.assign(pop.begin(), pop.begin() + paramCount);
  }

  void spawn_es() {
    double sigma = std::max(0.08, task.mutationStrength);
    int pairs = std::max(1, (popSize - 1) / 2);
    esEps.resize((size_t)pairs * paramCount);
    esPairIdx.assign(popSize, -1);
    esSign.assign(popSize, 0);
    std::memcpy(&pop[0], centerTheta.data(), sizeof(double) * paramCount);
    int idx = 1;
    for (int p = 0; p < pairs && idx < popSize; p++) {
      double* ep = &esEps[(size_t)p * paramCount];
      for (int j = 0; j < paramCount; j++) {
        ep[j] = activeParamMask[j] ? rng.randn() : 0.0;
      }
      double* pos = &pop[(size_t)idx * paramCount];
      for (int j = 0; j < paramCount; j++) {
        pos[j] = activeParamMask[j] ? (centerTheta[j] + sigma * plasticityScale[j] * ep[j]) : 0.0;
      }
      esPairIdx[idx] = p;
      esSign[idx] = 1;
      idx++;
      if (idx < popSize) {
        double* neg = &pop[(size_t)idx * paramCount];
        for (int j = 0; j < paramCount; j++) {
          neg[j] = activeParamMask[j] ? (centerTheta[j] - sigma * plasticityScale[j] * ep[j]) : 0.0;
        }
        esPairIdx[idx] = p;
        esSign[idx] = -1;
        idx++;
      }
    }
  }

  void spawn_adaptive_es() {
    double mutRate = std::max(0.35, task.mutationRate);
    std::memcpy(&pop[0], adaptBestTheta.data(), sizeof(double) * paramCount);
    for (int i = 1; i < popSize; i++) {
      double* dst = &pop[(size_t)i * paramCount];
      bool any = false;
      for (int j = 0; j < paramCount; j++) {
        if (!activeParamMask[j]) {
          dst[j] = 0.0;
        } else if (rng.uniform() < mutRate) {
          dst[j] = adaptBestTheta[j] + rng.randn() * adaptSigma * plasticityScale[j];
          any = true;
        } else {
          dst[j] = adaptBestTheta[j];
        }
      }
      if (!any && paramCount > 0) {
        int rj = rng.rand_int(paramCount);
        if (activeParamMask[rj]) dst[rj] = adaptBestTheta[rj] + rng.randn() * adaptSigma * plasticityScale[rj];
      }
    }
  }

  void spawn_cem() {
    std::memcpy(&pop[0], cemMu.data(), sizeof(double) * paramCount);
    for (int i = 1; i < popSize; i++) {
      double* dst = &pop[(size_t)i * paramCount];
      for (int j = 0; j < paramCount; j++) {
        dst[j] = activeParamMask[j] ? (cemMu[j] + rng.randn() * cemStd[j] * plasticityScale[j]) : 0.0;
      }
    }
  }

  void spawn_cma() {
    int idx = 0;
    std::memcpy(&pop[0], cmaBestVec.data(), sizeof(double) * paramCount);
    idx++;
    if (idx < popSize) {
      std::memcpy(&pop[(size_t)idx * paramCount], cmaMean.data(), sizeof(double) * paramCount);
      idx++;
    }
    int polish = std::min(std::max(2, (int)(popSize * 0.2)), std::max(0, popSize - idx));
    double localScale = std::max(0.03, cmaSigma * 0.35);
    for (int k = 0; k < polish && idx < popSize; k++, idx++) {
      double* dst = &pop[(size_t)idx * paramCount];
      if (cmaArchive.size() >= 3 && (k % 2 == 0)) {
        int a = rng.rand_int((int)cmaArchive.size());
        int b = rng.rand_int((int)cmaArchive.size());
        if (b == a) b = (a + 1) % (int)cmaArchive.size();
        double fStep = 0.35 + rng.uniform() * 0.4;
        for (int j = 0; j < paramCount; j++) {
          if (!activeParamMask[j]) dst[j] = 0.0;
          else {
            double ps = plasticityScale[j];
            dst[j] = cmaBestVec[j] + fStep * ps * (cmaArchive[a][j] - cmaArchive[b][j]) + rng.randn() * localScale * ps * cmaDiagD[j] * 0.35;
          }
        }
      } else {
        double sp = std::min(1.0, std::max(0.25, 4.0 / (double)std::max(1, paramCount)));
        for (int j = 0; j < paramCount; j++) {
          if (!activeParamMask[j]) dst[j] = 0.0;
          else dst[j] = (rng.uniform() < sp) ? (cmaBestVec[j] + rng.randn() * localScale * plasticityScale[j] * cmaDiagD[j]) : cmaBestVec[j];
        }
      }
    }
    std::vector<double> z(paramCount);
    while (idx < popSize) {
      for (int j = 0; j < paramCount; j++) z[j] = activeParamMask[j] ? rng.randn() : 0.0;
      double* pos = &pop[(size_t)idx * paramCount];
      for (int j = 0; j < paramCount; j++) {
        pos[j] = activeParamMask[j] ? (cmaMean[j] + cmaSigma * plasticityScale[j] * cmaDiagD[j] * z[j]) : 0.0;
      }
      idx++;
      if (idx < popSize) {
        double* neg = &pop[(size_t)idx * paramCount];
        for (int j = 0; j < paramCount; j++) {
          neg[j] = activeParamMask[j] ? (cmaMean[j] - cmaSigma * plasticityScale[j] * cmaDiagD[j] * z[j]) : 0.0;
        }
        idx++;
      }
    }
  }

  void pack_quantized_f32(float* dst) const {
    for (int b = 0; b < popSize; b++) {
      const double* src = &pop[(size_t)b * paramCount];
      float* out = &dst[(size_t)b * paramCount];
      for (int j = 0; j < paramCount; j++) {
        out[j] = activeParamMask[j] ? (float)quantize_scalar(src[j], task.weightPrecision) : 0.0f;
      }
    }
  }

  std::vector<double> quantize_vec(const std::vector<double>& src) const {
    std::vector<double> q(src.size());
    for (size_t i = 0; i < src.size(); i++) {
      q[i] = activeParamMask[i] ? quantize_scalar(src[i], task.weightPrecision) : 0.0;
    }
    return q;
  }

  void evolve(const int* scores, const float* fits, const EnvParams& activeEnv) {
    // Sort indices by fitness descending
    std::vector<int> order(popSize);
    for (int i = 0; i < popSize; i++) order[i] = i;
    std::sort(order.begin(), order.end(), [&](int a, int b) {
      return fits[a] > fits[b];
    });

    int bestIdx = order[0];
    int genBestSc = scores[bestIdx];
    double genBestFit = (double)fits[bestIdx];
    double sumSc = 0.0;
    for (int i = 0; i < popSize; i++) sumSc += (double)scores[i];
    lastAvgScore = sumSc / (double)popSize;
    scoreCurve.push_back(genBestSc);

    if (genBestSc > bestTrainScore || (genBestSc == bestTrainScore && genBestFit > bestFitness)) {
      bestTrainScore = std::max(bestTrainScore, genBestSc);
      bestFitness = std::max(bestFitness, genBestFit);
      bestVec.assign(&pop[(size_t)bestIdx * paramCount], &pop[(size_t)(bestIdx + 1) * paramCount]);
    } else if (genBestFit > bestFitness) {
      bestFitness = genBestFit;
    }

    // Stagnation check
    if (task.stagnationLimit > 0) {
      if (bestTrainScore > bestProgressScore || bestFitness > bestProgressFit * 1.03 + 2.0) {
        bestProgressScore = std::max(bestProgressScore, bestTrainScore);
        bestProgressFit = std::max(bestProgressFit, bestFitness);
        gensNoImprove = 0;
      } else {
        gensNoImprove += 1;
        if (gen >= 15 && gensNoImprove >= task.stagnationLimit) {
          done = true;
          stoppedReason = 2; // STAGNATED
          return;
        }
      }
    }

    if (gen >= task.maxGenerations) {
      done = true;
      stoppedReason = 1; // MAX_GENS
      return;
    }

    std::vector<double> nextPop((size_t)popSize * paramCount);

    if (task.algorithm == ALGO_GA) {
      int elites = std::max(2, std::min(popSize, (int)std::llround(popSize * 0.07)));
      for (int i = 0; i < elites; i++) {
        std::memcpy(&nextPop[(size_t)i * paramCount], &pop[(size_t)order[i] * paramCount], sizeof(double) * paramCount);
      }
      auto pick = [&]() {
        int tSz = std::min(4, popSize);
        int w = order[rng.rand_int(popSize)];
        for (int t = 1; t < tSz; t++) {
          int c = order[rng.rand_int(popSize)];
          if (fits[c] > fits[w]) w = c;
        }
        return w;
      };
      for (int i = elites; i < popSize; i++) {
        int pA = pick(), pB = pick();
        double* dst = &nextPop[(size_t)i * paramCount];
        const double* a = &pop[(size_t)pA * paramCount];
        const double* b = &pop[(size_t)pB * paramCount];
        bool cross = rng.uniform() < 0.72;
        for (int j = 0; j < paramCount; j++) {
          if (!activeParamMask[j]) {
            dst[j] = 0.0;
            continue;
          }
          double v = (cross && rng.uniform() < 0.5) ? b[j] : a[j];
          if (rng.uniform() < task.mutationRate) {
            v += rng.randn() * task.mutationStrength * plasticityScale[j];
          }
          dst[j] = v;
        }
      }
      pop.swap(nextPop);
    } else if (task.algorithm == ALGO_NATURAL_ES || task.algorithm == ALGO_ADAM_ES) {
      std::vector<double> rankUtil(popSize, 0.0);
      for (int r = 0; r < popSize; r++) {
        rankUtil[order[r]] = popSize > 1 ? (0.5 - (double)r / (double)(popSize - 1)) : 0.0;
      }
      int pairs = std::max(1, (popSize - 1) / 2);
      std::vector<double> pairGrads(pairs, 0.0);
      for (int i = 0; i < popSize; i++) {
        if (esPairIdx[i] >= 0 && esSign[i] != 0) {
          pairGrads[esPairIdx[i]] += (double)esSign[i] * rankUtil[i];
        }
      }
      double sigma = std::max(0.08, task.mutationStrength);
      if (task.algorithm == ALGO_ADAM_ES) {
        std::vector<double> grad(paramCount, 0.0);
        double invS = 1.0 / ((double)pairs * sigma);
        for (int p = 0; p < pairs; p++) {
          if (pairGrads[p] == 0.0) continue;
          double fac = pairGrads[p] * invS;
          const double* ep = &esEps[(size_t)p * paramCount];
          for (int j = 0; j < paramCount; j++) grad[j] += fac * ep[j];
        }
        adamStep += 1;
        double bc1 = 1.0 - std::pow(0.9, adamStep);
        double bc2 = 1.0 - std::pow(0.999, adamStep);
        for (int j = 0; j < paramCount; j++) {
          if (!activeParamMask[j]) {
            centerTheta[j] = 0.0;
            continue;
          }
          adamM[j] = 0.9 * adamM[j] + 0.1 * grad[j];
          adamV[j] = 0.999 * adamV[j] + 0.001 * grad[j] * grad[j];
          centerTheta[j] += ((0.085 * (adamM[j] / bc1)) / (std::sqrt(adamV[j] / bc2) + 1e-8)) * plasticityScale[j];
        }
      } else {
        double scale = 0.22 / ((double)pairs * sigma);
        for (int p = 0; p < pairs; p++) {
          if (pairGrads[p] == 0.0) continue;
          double stp = scale * pairGrads[p];
          const double* ep = &esEps[(size_t)p * paramCount];
          for (int j = 0; j < paramCount; j++) {
            if (activeParamMask[j]) centerTheta[j] += stp * ep[j] * plasticityScale[j];
          }
        }
      }
      spawn_es();
    } else if (task.algorithm == ALGO_ADAPTIVE_ES) {
      double champFit = (double)fits[0];
      if (adaptBestFit > -1e17 && champFit < adaptBestFit) {
        adaptBestFit = 0.6 * adaptBestFit + 0.4 * champFit;
      }
      if (genBestFit >= adaptBestFit) {
        adaptBestFit = genBestFit;
        adaptBestTheta.assign(&pop[(size_t)bestIdx * paramCount], &pop[(size_t)(bestIdx + 1) * paramCount]);
        adaptSigma = std::min(0.95, adaptSigma * 1.15);
      } else {
        adaptSigma = std::max(0.05, adaptSigma * 0.88);
      }
      spawn_adaptive_es();
    } else if (task.algorithm == ALGO_CEM) {
      int ec = std::max(3, (int)(popSize * 0.2));
      ec = std::min(ec, popSize);
      std::vector<double> nMu(paramCount, 0.0), nVar(paramCount, 0.0);
      for (int k = 0; k < ec; k++) {
        const double* v = &pop[(size_t)order[k] * paramCount];
        for (int j = 0; j < paramCount; j++) nMu[j] += v[j];
      }
      double invK = 1.0 / (double)ec;
      for (int j = 0; j < paramCount; j++) nMu[j] *= invK;
      for (int k = 0; k < ec; k++) {
        const double* v = &pop[(size_t)order[k] * paramCount];
        for (int j = 0; j < paramCount; j++) {
          double d = v[j] - nMu[j];
          nVar[j] += d * d;
        }
      }
      for (int j = 0; j < paramCount; j++) {
        if (!activeParamMask[j]) {
          cemMu[j] = 0.0;
          cemStd[j] = 0.0;
          continue;
        }
        double ps = plasticityScale[j];
        cemMu[j] += (nMu[j] - cemMu[j]) * 0.72 * ps;
        double es = std::sqrt(nVar[j] * invK + 1e-4);
        cemStd[j] = std::max(0.035, std::min(1.25, 0.72 * es + 0.28 * cemStd[j]));
      }
      spawn_cem();
    } else if (task.algorithm == ALGO_DE) {
      if (!deTrialPhase) {
        deParents = pop;
        for (int i = 0; i < popSize; i++) deParentFit[i] = (double)fits[i];
        deTrialPhase = true;
      } else {
        for (int i = 0; i < popSize; i++) {
          if ((double)fits[i] >= deParentFit[i]) {
            std::memcpy(&deParents[(size_t)i * paramCount], &pop[(size_t)i * paramCount], sizeof(double) * paramCount);
            deParentFit[i] = (double)fits[i];
          }
        }
      }
      int bIdx = 0;
      for (int i = 1; i < popSize; i++) if (deParentFit[i] > deParentFit[bIdx]) bIdx = i;
      const double* bVec = &deParents[(size_t)bIdx * paramCount];
      double fFac = 0.45 + task.mutationStrength * 0.7;
      double cr = std::max(0.35, std::min(0.95, 1.0 - task.mutationRate * 0.8));
      std::memcpy(&nextPop[0], bVec, sizeof(double) * paramCount);
      for (int i = 1; i < popSize; i++) {
        int r1 = rng.rand_int(popSize), r2 = rng.rand_int(popSize);
        if (popSize > 2) {
          while (r1 == i) r1 = rng.rand_int(popSize);
          while (r2 == i || r2 == r1) r2 = rng.rand_int(popSize);
        }
        const double* tgt = &deParents[(size_t)i * paramCount];
        const double* v1 = &deParents[(size_t)r1 * paramCount];
        const double* v2 = &deParents[(size_t)r2 * paramCount];
        int jRand = rng.rand_int(std::max(1, paramCount));
        double* dst = &nextPop[(size_t)i * paramCount];
        for (int j = 0; j < paramCount; j++) {
          if (!activeParamMask[j]) {
            dst[j] = 0.0;
            continue;
          }
          if (j == jRand || rng.uniform() < cr) {
            double mutant = bVec[j] + fFac * (v1[j] - v2[j]);
            dst[j] = tgt[j] + (mutant - tgt[j]) * plasticityScale[j];
          } else {
            dst[j] = tgt[j];
          }
        }
      }
      pop.swap(nextPop);
    } else if (task.algorithm == ALGO_PSO) {
      double champFit = (double)fits[0];
      if (psoGBestFit > -1e17 && champFit < psoGBestFit) {
        psoGBestFit = 0.6 * psoGBestFit + 0.4 * champFit;
      }
      for (int i = 0; i < popSize; i++) {
        if ((double)fits[i] >= psoPBestFit[i]) {
          psoPBestFit[i] = (double)fits[i];
          std::memcpy(&psoPBestPos[(size_t)i * paramCount], &pop[(size_t)i * paramCount], sizeof(double) * paramCount);
        } else if (psoPBestFit[i] > -1e17) {
          psoPBestFit[i] = 0.92 * psoPBestFit[i] + 0.08 * (double)fits[i];
        }
        if ((double)fits[i] >= psoGBestFit) {
          psoGBestFit = (double)fits[i];
          psoGBestPos.assign(&pop[(size_t)i * paramCount], &pop[(size_t)(i + 1) * paramCount]);
        }
      }
      double jitter = std::max(0.02, task.mutationStrength * 0.25);
      std::memcpy(&pop[0], psoGBestPos.data(), sizeof(double) * paramCount);
      for (int i = 1; i < popSize; i++) {
        double* p = &pop[(size_t)i * paramCount];
        double* v = &psoVel[(size_t)i * paramCount];
        const double* pb = &psoPBestPos[(size_t)i * paramCount];
        for (int j = 0; j < paramCount; j++) {
          if (!activeParamMask[j]) {
            v[j] = 0.0;
            p[j] = 0.0;
            continue;
          }
          double vn = 0.65 * v[j] + (1.4 * rng.uniform() * (pb[j] - p[j]) + 1.6 * rng.uniform() * (psoGBestPos[j] - p[j]) + rng.randn() * jitter) * plasticityScale[j];
          if (vn > 1.2) vn = 1.2;
          else if (vn < -1.2) vn = -1.2;
          v[j] = vn;
          p[j] += vn;
        }
      }
    } else if (task.algorithm == ALGO_CMA_HYBRID) {
      double champFit = (double)fits[0];
      if (cmaBestFit > -1e17 && champFit < cmaBestFit) {
        cmaBestFit = 0.6 * cmaBestFit + 0.4 * champFit;
      }
      std::vector<double> topVec(&pop[(size_t)bestIdx * paramCount], &pop[(size_t)(bestIdx + 1) * paramCount]);
      if (genBestFit >= cmaBestFit) {
        cmaBestFit = genBestFit;
        cmaBestVec = topVec;
      }
      cmaArchive.push_back(topVec);
      if (cmaArchive.size() > 14) cmaArchive.erase(cmaArchive.begin());

      int mu = std::max(3, std::min(popSize, (int)(popSize * 0.25)));
      std::vector<double> rw(mu);
      double wSum = 0.0;
      for (int i = 0; i < mu; i++) {
        rw[i] = std::log((double)mu + 0.5) - std::log((double)(i + 1));
        wSum += rw[i];
      }
      double wSq = 0.0;
      for (int i = 0; i < mu; i++) {
        rw[i] /= wSum;
        wSq += rw[i] * rw[i];
      }
      double muEff = 1.0 / std::max(1e-8, wSq);
      cmaGen += 1;
      std::vector<double> oldMean = cmaMean;
      std::vector<double> nextMean(paramCount, 0.0);
      for (int i = 0; i < mu; i++) {
        const double* ev = &pop[(size_t)order[i] * paramCount];
        for (int j = 0; j < paramCount; j++) nextMean[j] += rw[i] * ev[j];
      }
      double dim = (double)paramCount;
      double sigma = std::max(0.02, cmaSigma);
      double invS = 1.0 / sigma;
      double cs = (muEff + 2.0) / (dim + muEff + 5.0);
      double cc = (4.0 + muEff / dim) / (dim + 4.0 + (2.0 * muEff) / dim);
      double c1 = std::min(0.45, 2.0 / ((dim + 1.3) * (dim + 1.3) + muEff));
      double cmu = std::min(1.0 - c1, (2.0 * (muEff - 2.0 + 1.0 / muEff)) / ((dim + 2.0) * (dim + 2.0) + muEff));
      double damp = 1.0 + 2.0 * std::max(0.0, std::sqrt((muEff - 1.0) / (dim + 1.0)) - 1.0) + cs;
      double chiN = std::sqrt(dim) * (1.0 - 1.0 / (4.0 * dim) + 1.0 / (21.0 * dim * dim));
      double sqrtCs = std::sqrt(cs * (2.0 - cs) * muEff);
      double sqrtCc = std::sqrt(cc * (2.0 - cc) * muEff);

      double psNormSq = 0.0;
      for (int j = 0; j < paramCount; j++) {
        double yj = (nextMean[j] - oldMean[j]) * invS;
        double dj = std::max(0.05, cmaDiagD[j]);
        cmaPs[j] = (1.0 - cs) * cmaPs[j] + sqrtCs * (yj / dj);
        psNormSq += cmaPs[j] * cmaPs[j];
        cmaPc[j] = (1.0 - cc) * cmaPc[j] + sqrtCc * yj;
      }
      double scaleAdapt = std::min(1.0, (dim + 2.0) / 3.0);
      double c1Sep = std::min(0.45, c1 * scaleAdapt);
      double cmuSep = std::min(0.75 - c1Sep, cmu * scaleAdapt);
      for (int j = 0; j < paramCount; j++) {
        double rmu = 0.0;
        for (int i = 0; i < mu; i++) {
          double d = (pop[(size_t)order[i] * paramCount + j] - oldMean[j]) * invS;
          rmu += rw[i] * d * d;
        }
        double nv = (1.0 - c1Sep - cmuSep) * cmaDiagD[j] * cmaDiagD[j] + c1Sep * cmaPc[j] * cmaPc[j] + cmuSep * rmu;
        cmaDiagD[j] = std::sqrt(std::max(0.04, std::min(9.0, nv)));
      }
      double sf = std::exp(std::max(-0.45, std::min(0.45, (cs / damp) * (std::sqrt(psNormSq) / chiN - 1.0))));
      cmaSigma = std::max(0.04, std::min(1.4, cmaSigma * sf));
      double ab = (cmaGen % 6 == 0) ? 0.12 : 0.0;
      for (int j = 0; j < paramCount; j++) {
        if (!activeParamMask[j]) cmaMean[j] = 0.0;
        else {
          double targetM = ab > 0.0 ? ((1.0 - ab) * nextMean[j] + ab * cmaBestVec[j]) : nextMean[j];
          cmaMean[j] = oldMean[j] + (targetM - oldMean[j]) * plasticityScale[j];
        }
      }
      spawn_cma();
    }

    if (morphEnabled) {
      step_morphogenesis(genBestFit, genBestSc, activeEnv);
    }

    gen += 1;
  }

  void resize_population(int newPop) {
    if (newPop < 1 || newPop == popSize) return;
    int oldPop = popSize;
    std::vector<double> newP((size_t)newPop * paramCount, 0.0);
    int copyN = std::min(oldPop, newPop);
    std::memcpy(newP.data(), pop.data(), sizeof(double) * (size_t)copyN * paramCount);
    for (int i = copyN; i < newPop; i++) {
      double* dst = &newP[(size_t)i * paramCount];
      std::memcpy(dst, bestVec.data(), sizeof(double) * paramCount);
      for (int j = 0; j < paramCount; j++) {
        if (activeParamMask[j] && rng.uniform() < 0.25) {
          dst[j] += rng.randn() * std::max(0.08, task.mutationStrength) * plasticityScale[j];
        }
      }
    }
    pop.swap(newP);
    popSize = newPop;
    task.populationSize = newPop;
    if (task.algorithm == ALGO_NATURAL_ES || task.algorithm == ALGO_ADAM_ES) {
      if (centerTheta.size() != (size_t)paramCount) centerTheta = bestVec;
      spawn_es();
    } else if (task.algorithm == ALGO_ADAPTIVE_ES) {
      if (adaptBestTheta.size() != (size_t)paramCount) adaptBestTheta = bestVec;
      spawn_adaptive_es();
    } else if (task.algorithm == ALGO_CEM) {
      spawn_cem();
    } else if (task.algorithm == ALGO_CMA_HYBRID) {
      spawn_cma();
    } else if (task.algorithm == ALGO_DE) {
      deParents = pop;
      deParentFit.assign(newPop, -1e18);
      deTrialPhase = false;
    } else if (task.algorithm == ALGO_PSO) {
      psoVel.resize((size_t)newPop * paramCount, 0.0);
      psoPBestPos = pop;
      psoPBestFit.assign(newPop, -1e18);
    }
  }
};

// ============================================================================
// Multi-Architecture Speciation Islands Coordinator (CPU Specialized OpenMP)
// ============================================================================
static void allocate_island_pops(const std::vector<double>& sharesPct, int totalPop, std::vector<int>& outCounts) {
  int m = (int)sharesPct.size();
  int minCount = (totalPop >= m * 3) ? 3 : std::max(1, totalPop / m);
  outCounts.assign(m, minCount);
  int rem = std::max(0, totalPop - minCount * m);
  if (rem == 0) return;
  std::vector<double> rawExtras(m);
  std::vector<int> floorExtras(m);
  for (int i = 0; i < m; i++) {
    rawExtras[i] = (sharesPct[i] / 100.0) * (double)rem;
    floorExtras[i] = (int)std::floor(rawExtras[i]);
    outCounts[i] += floorExtras[i];
    rem -= floorExtras[i];
  }
  std::vector<int> ord(m);
  for (int i = 0; i < m; i++) ord[i] = i;
  std::sort(ord.begin(), ord.end(), [&](int a, int b) {
    return (rawExtras[a] - floorExtras[a]) > (rawExtras[b] - floorExtras[b]);
  });
  for (int k = 0; k < rem; k++) outCounts[ord[k % m]] += 1;
}

struct IslandCoordinatorState {
  TrialTask baseTask;
  std::vector<TrialState> islands;
  std::vector<double> sharesPct;
  std::vector<double> lastBestScore;
  std::vector<double> lastBestFit;
  std::vector<double> allTimeBestFit;
  std::vector<int> allTimeBestScore;
  std::vector<int> lastImproveGen;
  int gen = 1;
  bool done = false;
  int stoppedReason = 1;
  bool verifiedPerfect = false;
  int bestTrainScore = 0;
  double bestFitness = 0.0;
  double lastAvgScore = 0.0;
  int bestProgressScore = 0;
  double bestProgressFit = -1e18;
  int gensNoImprove = 0;
  int leaderIdx = 0;
  int rebalanceCount = 0;
  uint64_t trainTicks = 0;
  uint64_t auditTicks = 0;
  std::vector<int> scoreCurve;
  AuditResultF64 bestAudit;
  bool hasBestAudit = false;
  std::vector<double> bestAuditVec;
  int bestAuditLeaderIdx = 0;

  explicit IslandCoordinatorState(const TrialTask& tk) : baseTask(tk) {
    const int speciesList[5] = {ARCH_MLP, ARCH_LTC_FLY, ARCH_SELECTIVE_SSM, ARCH_PONDER_ACT, ARCH_HYBRID_MOE};
    int m = 5;
    sharesPct.assign(m, 100.0 / (double)m);
    std::vector<int> counts;
    allocate_island_pops(sharesPct, std::max(m, tk.populationSize), counts);
    islands.reserve(m);
    for (int i = 0; i < m; i++) {
      TrialTask itk = tk;
      itk.architecture = speciesList[i];
      itk.populationSize = counts[i];
      itk.evolutionTopologyMode = EVO_SINGLE_SPECIES;
      itk.trialSeed = tk.trialSeed + (uint32_t)(i * 7919u + 31u);
      islands.emplace_back(itk);
    }
    lastBestScore.assign(m, 0.0);
    lastBestFit.assign(m, 0.0);
    allTimeBestFit.assign(m, 0.0);
    allTimeBestScore.assign(m, 0);
    lastImproveGen.assign(m, 1);
  }

  double get_mean_flops() const {
    double wSum = 0.0;
    int pSum = 0;
    for (const auto& isl : islands) {
      wSum += isl.compute_active_flops() * (double)isl.popSize;
      pSum += isl.popSize;
    }
    return pSum > 0 ? (wSum / (double)pSum) : 0.0;
  }

  void run_to_completion() {
    while (!done) {
      EnvParams activeEnv = baseTask.curriculumLearning
                                ? resolve_curriculum_env(baseTask.env, gen, baseTask.curriculumGenerations)
                                : baseTask.env;
      int genPipeCap = std::min(baseTask.targetPipeCap, 160);
      int maxF = (genPipeCap + 18) * (int)std::llround(activeEnv.spawnFrames * 1.25 + 14.0);

      double genBestFit = -1e18;
      int genBestSc = 0;
      double totalScoreSum = 0.0;
      int totalPop = 0;
      double bestUtility = -1e18;
      int nextLeader = leaderIdx;

      for (int idx = 0; idx < (int)islands.size(); idx++) {
        TrialState& st = islands[idx];
        st.gen = gen;
        GpuEvalJob jb;
        jb.popSize = st.popSize;
        jb.paramCount = st.paramCount;
        jb.weightOffset = 0;
        jb.resultOffset = 0;
        jb.architecture = st.task.architecture;
        jb.reasoningSteps = st.activeReasoningSteps;
        jb.inputCount = st.task.inputCount;
        for (int s = 0; s < MAX_SENSORS; s++) jb.inputIndices[s] = st.task.inputIndices[s];
        jb.hiddenDepth = st.task.hiddenDepth;
        for (int h = 0; h < 5; h++) jb.hiddenLayers[h] = st.task.hiddenLayers[h];
        jb.shapedFitness = st.task.shapedFitness;
        jb.maxFrames = maxF;
        jb.pipeCap = genPipeCap;
        jb.seed = (uint32_t)(baseTask.trialSeed * 1664525u + (uint32_t)gen * 1013904223u + 7u);
        jb.baseGap = (float)activeEnv.gap;
        jb.gapVar = (float)activeEnv.gapVariance;
        jb.baseSpeed = (float)activeEnv.pipeSpeed;
        jb.speedVar = (float)activeEnv.speedVariability;
        jb.baseSpacing = (float)(activeEnv.pipeSpeed * activeEnv.spawnFrames);
        jb.movingPipes = activeEnv.movingPipes;
        jb.moveAmp = (float)activeEnv.moveAmplitude;
        jb.gravity = (float)(K_GRAVITY * activeEnv.gravityScale);
        jb.jumpImpulse = (float)(K_JUMP * std::sqrt(activeEnv.gravityScale));
        jb.metabolicStepCost = (float)(st.task.morphogenesisEnabled ? st.task.metabolicStepCost : 0.0);
        jb.hybridMaskBits = st.hybridExpertMask;
        jb.excessFlopsCost = st.compute_excess_flops_cost();

        std::vector<float> fWeights((size_t)jb.popSize * jb.paramCount);
        std::vector<int> fScores(jb.popSize, 0);
        std::vector<float> fFits(jb.popSize, 0.0f);
        uint64_t tk = 0;
        st.pack_quantized_f32(fWeights.data());
        eval_population_lockstep_cpu(jb, fWeights.data(), fScores.data(), fFits.data(), &tk);
        st.trainTicks += tk;
        trainTicks += tk;

        int iBestSc = 0;
        double iBestFit = -1e18;
        int iBestIdx = 0;
        for (int b = 0; b < st.popSize; b++) {
          totalScoreSum += (double)fScores[b];
          totalPop += 1;
          if ((double)fFits[b] > iBestFit) {
            iBestFit = (double)fFits[b];
            iBestSc = fScores[b];
            iBestIdx = b;
          }
          if (fScores[b] > genBestSc || (fScores[b] == genBestSc && (double)fFits[b] > genBestFit)) {
            genBestSc = fScores[b];
            genBestFit = (double)fFits[b];
          }
        }
        lastBestScore[idx] = (double)iBestSc;
        lastBestFit[idx] = iBestFit;
        if (iBestSc > allTimeBestScore[idx] || (iBestSc == allTimeBestScore[idx] && iBestFit > allTimeBestFit[idx])) {
          lastImproveGen[idx] = gen;
          allTimeBestScore[idx] = std::max(allTimeBestScore[idx], iBestSc);
          allTimeBestFit[idx] = std::max(allTimeBestFit[idx], iBestFit);
          st.bestVec.assign(&st.pop[(size_t)iBestIdx * st.paramCount], &st.pop[(size_t)(iBestIdx + 1) * st.paramCount]);
          st.bestTrainScore = allTimeBestScore[idx];
          st.bestFitness = allTimeBestFit[idx];
        }

        double denomKF = std::max(0.5, st.compute_active_flops() / 100.0);
        double eff = iBestFit / denomKF;
        double util = eff + (double)allTimeBestScore[idx] * 0.35 + ((gen - lastImproveGen[idx] <= 4) ? 1.5 : 0.0);
        if (util > bestUtility) {
          bestUtility = util;
          nextLeader = idx;
        }

        // Evolve island internally (without stopping prematurely on single-island maxGen)
        int savedMaxG = st.task.maxGenerations;
        int savedStag = st.task.stagnationLimit;
        st.task.maxGenerations = gen + 100;
        st.task.stagnationLimit = 0;
        st.evolve(fScores.data(), fFits.data(), activeEnv);
        st.task.maxGenerations = savedMaxG;
        st.task.stagnationLimit = savedStag;
      }

      leaderIdx = nextLeader;
      lastAvgScore = totalPop > 0 ? (totalScoreSum / (double)totalPop) : 0.0;
      scoreCurve.push_back(genBestSc);
      if (genBestSc > bestTrainScore || (genBestSc == bestTrainScore && genBestFit > bestFitness)) {
        bestTrainScore = std::max(bestTrainScore, genBestSc);
        bestFitness = std::max(bestFitness, genBestFit);
      } else if (genBestFit > bestFitness) {
        bestFitness = genBestFit;
      }

      // Check early audit on overall leading island if high score reached
      const TrialState& leadSt = islands[leaderIdx];
      if (allTimeBestScore[leaderIdx] >= std::min(baseTask.targetPipeCap, 40) &&
          (gen % 15 == 0 || allTimeBestScore[leaderIdx] >= baseTask.targetPipeCap)) {
        auto qv = leadSt.quantize_vec(leadSt.bestVec);
        int preCap = std::min(64, baseTask.targetPipeCap);
        AuditResultF64 pre = audit_brain_f64(leadSt.task, qv, preCap, baseTask.verificationSeeds, true, leadSt.activeReasoningSteps, leadSt.hybridExpertMask);
        auditTicks += pre.ticksEvaluated;
        if (pre.verifiedPerfect) {
          AuditResultF64 full = (preCap == baseTask.targetPipeCap)
                                    ? pre
                                    : audit_brain_f64(leadSt.task, qv, baseTask.targetPipeCap, baseTask.verificationSeeds, true, leadSt.activeReasoningSteps, leadSt.hybridExpertMask);
          if (preCap != baseTask.targetPipeCap) auditTicks += full.ticksEvaluated;
          bestAudit = full;
          hasBestAudit = true;
          bestAuditVec = leadSt.bestVec;
          bestAuditLeaderIdx = leaderIdx;
          if (full.verifiedPerfect) {
            verifiedPerfect = true;
            done = true;
            stoppedReason = 0;
            break;
          }
        }
      }

      if (baseTask.stagnationLimit > 0) {
        if (bestTrainScore > bestProgressScore || bestFitness > bestProgressFit * 1.03 + 2.0) {
          bestProgressScore = std::max(bestProgressScore, bestTrainScore);
          bestProgressFit = std::max(bestProgressFit, bestFitness);
          gensNoImprove = 0;
        } else {
          gensNoImprove += 1;
          if (gen >= 15 && gensNoImprove >= baseTask.stagnationLimit) {
            done = true;
            stoppedReason = 2;
            break;
          }
        }
      }
      if (gen >= baseTask.maxGenerations) {
        done = true;
        stoppedReason = 1;
        break;
      }

      // Rebalance island shares every 10 generations using softmax efficiency + diversity floor
      if (gen > 1 && gen % 10 == 0) {
        int m = (int)islands.size();
        double floorPct = (double)std::max(10, std::min(14, 55 / m));
        std::vector<double> utils(m);
        double maxU = -1e18;
        for (int i = 0; i < m; i++) {
          double denomKF = std::max(0.5, islands[i].compute_active_flops() / 100.0);
          utils[i] = lastBestFit[i] / denomKF + (double)allTimeBestScore[i] * 0.4 + ((gen - lastImproveGen[i] <= 6) ? 1.8 : 0.0);
          if (utils[i] > maxU) maxU = utils[i];
        }
        double scale = std::max(1.0, maxU * 0.25);
        std::vector<double> exps(m);
        double expSum = 0.0;
        for (int i = 0; i < m; i++) {
          exps[i] = std::exp(std::max(-6.0, std::min(6.0, (utils[i] - maxU) / scale)));
          expSum += exps[i];
        }
        double freeB = std::max(0.0, 100.0 - floorPct * (double)m);
        for (int i = 0; i < m; i++) sharesPct[i] = floorPct + (exps[i] / std::max(1e-9, expSum)) * freeB;
        std::vector<int> newCounts;
        allocate_island_pops(sharesPct, std::max(m, baseTask.populationSize), newCounts);
        for (int i = 0; i < m; i++) islands[i].resize_population(newCounts[i]);
        rebalanceCount += 1;
      }

      gen += 1;
    }

    // Pick best overall all-time island
    int winIdx = 0;
    for (int i = 1; i < (int)islands.size(); i++) {
      if (allTimeBestScore[i] > allTimeBestScore[winIdx] ||
          (allTimeBestScore[i] == allTimeBestScore[winIdx] && allTimeBestFit[i] > allTimeBestFit[winIdx])) {
        winIdx = i;
      }
    }
    leaderIdx = winIdx;
    if (!hasBestAudit) {
      const TrialState& wSt = islands[winIdx];
      auto qv = wSt.quantize_vec(wSt.bestVec);
      bestAudit = audit_brain_f64(wSt.task, qv, baseTask.targetPipeCap, baseTask.verificationSeeds, false, wSt.activeReasoningSteps, wSt.hybridExpertMask);
      auditTicks += bestAudit.ticksEvaluated;
      hasBestAudit = true;
      bestAuditVec = wSt.bestVec;
      bestAuditLeaderIdx = winIdx;
      if (bestAudit.verifiedPerfect) {
        verifiedPerfect = true;
        stoppedReason = 0;
      }
    }
  }
};

// ============================================================================
// Exported C ABI for Python ctypes Orchestrator
// ============================================================================
extern "C" {

int neurolab_has_cuda() {
#ifdef __CUDACC__
  int devCount = 0;
  if (cudaGetDeviceCount(&devCount) == cudaSuccess && devCount > 0) return devCount;
#endif
  return 0;
}

void neurolab_run_batch(
    int nTrials,
    const TrialTask* tasks,
    TrialOutput* outputs,
    double* outBestWeights,
    int maxWeightsPerTrial,
    int* outScoreCurves,
    int maxCurveLen,
    double* outSeedScores,
    int maxSeeds,
    BatchPerfCounters* perf) {
  using Clock = std::chrono::steady_clock;
  auto tBatchStart = Clock::now();
  double gpuKernelMs = 0.0;
  double hostOptMs = 0.0;
  double f64AuditMs = 0.0;
  uint64_t batchTrainTicks = 0;
  uint64_t batchAuditTicks = 0;

  bool useCuda = (neurolab_has_cuda() > 0);
  if (perf) std::memset(perf, 0, sizeof(BatchPerfCounters));

  // Partition batch via Hardware Auto-Routing:
  // - Single-species GPU_LOCKSTEP -> CUDA kernel (when GPU present) or OpenMP fallback
  // - HYBRID_MOE -> CPU_SPECIALIZED OpenMP path (bypasses warp-divergent CUDA)
  // - ISLAND_SPECIATION -> CPU_SPECIALIZED OpenMP Multi-Arch Island coordinator
  std::vector<int> singleIndices;
  std::vector<int> islandIndices;
  std::vector<TrialState> states;
  std::vector<int> taskToSingle(nTrials, -1);
  std::vector<IslandCoordinatorState> islandStates;
  std::vector<int> taskToIsland(nTrials, -1);

  for (int i = 0; i < nTrials; i++) {
    if (tasks[i].evolutionTopologyMode == EVO_ISLAND_SPECIATION) {
      taskToIsland[i] = (int)islandStates.size();
      islandIndices.push_back(i);
      islandStates.emplace_back(tasks[i]);
    } else {
      taskToSingle[i] = (int)states.size();
      singleIndices.push_back(i);
      states.emplace_back(tasks[i]);
    }
  }

  // Execute ISLAND_SPECIATION trials across OpenMP CPU workers
  if (!islandStates.empty()) {
    auto tIsl0 = Clock::now();
#ifdef _OPENMP
    #pragma omp parallel for schedule(dynamic)
#endif
    for (int k = 0; k < (int)islandStates.size(); k++) {
      islandStates[k].run_to_completion();
    }
    for (const auto& ist : islandStates) {
      batchTrainTicks += ist.trainTicks;
      batchAuditTicks += ist.auditTicks;
    }
    hostOptMs += std::chrono::duration<double, std::milli>(Clock::now() - tIsl0).count();
  }

  // Execute single-species trials (CUDA GPU_LOCKSTEP + OpenMP CPU_SPECIALIZED routing)
  std::vector<GpuEvalJob> gpuJobs;
  std::vector<int> gpuActiveMap;
  std::vector<float> gpuWeights;
  std::vector<int> gpuScores;
  std::vector<float> gpuFitness;
  std::vector<unsigned long long> gpuTicks;

  std::vector<GpuEvalJob> cpuJobs;
  std::vector<int> cpuActiveMap;
  std::vector<float> cpuWeights;
  std::vector<int> cpuScores;
  std::vector<float> cpuFitness;
  std::vector<unsigned long long> cpuTicks;

#ifdef __CUDACC__
  GpuEvalJob* d_jobs = nullptr;
  float* d_weights = nullptr;
  int* d_scores = nullptr;
  float* d_fitness = nullptr;
  unsigned long long* d_ticks = nullptr;
  size_t d_jobs_cap = 0, d_weights_cap = 0, d_res_cap = 0;
#endif

  auto buildJobForSingle = [&](int si, size_t& wOff, size_t& rOff) -> GpuEvalJob {
    const TrialTask& tk = states[si].task;
    EnvParams activeEnv = tk.curriculumLearning
                              ? resolve_curriculum_env(tk.env, states[si].gen, tk.curriculumGenerations)
                              : tk.env;
    int genPipeCap = std::min(tk.targetPipeCap, 160);
    int maxF = (genPipeCap + 18) * (int)std::llround(activeEnv.spawnFrames * 1.25 + 14.0);

    GpuEvalJob jb;
    jb.popSize = states[si].popSize;
    jb.paramCount = states[si].paramCount;
    jb.weightOffset = (int)wOff;
    jb.resultOffset = (int)rOff;
    jb.architecture = tk.architecture;
    jb.reasoningSteps = states[si].activeReasoningSteps;
    jb.inputCount = tk.inputCount;
    for (int s = 0; s < MAX_SENSORS; s++) jb.inputIndices[s] = tk.inputIndices[s];
    jb.hiddenDepth = tk.hiddenDepth;
    for (int h = 0; h < 5; h++) jb.hiddenLayers[h] = tk.hiddenLayers[h];
    jb.shapedFitness = tk.shapedFitness;
    jb.maxFrames = maxF;
    jb.pipeCap = genPipeCap;
    jb.seed = (uint32_t)(tk.trialSeed * 1664525u + (uint32_t)states[si].gen * 1013904223u + 7u);
    jb.baseGap = (float)activeEnv.gap;
    jb.gapVar = (float)activeEnv.gapVariance;
    jb.baseSpeed = (float)activeEnv.pipeSpeed;
    jb.speedVar = (float)activeEnv.speedVariability;
    jb.baseSpacing = (float)(activeEnv.pipeSpeed * activeEnv.spawnFrames);
    jb.movingPipes = activeEnv.movingPipes;
    jb.moveAmp = (float)activeEnv.moveAmplitude;
    jb.gravity = (float)(K_GRAVITY * activeEnv.gravityScale);
    jb.jumpImpulse = (float)(K_JUMP * std::sqrt(activeEnv.gravityScale));
    jb.metabolicStepCost = (float)(tk.morphogenesisEnabled ? tk.metabolicStepCost : 0.0);
    jb.hybridMaskBits = states[si].hybridExpertMask;
    jb.excessFlopsCost = states[si].compute_excess_flops_cost();
    wOff += (size_t)jb.popSize * (size_t)jb.paramCount;
    rOff += (size_t)jb.popSize;
    return jb;
  };

  while (!states.empty()) {
    gpuJobs.clear();
    gpuActiveMap.clear();
    cpuJobs.clear();
    cpuActiveMap.clear();
    size_t gpuTotalW = 0, gpuTotalR = 0;
    size_t cpuTotalW = 0, cpuTotalR = 0;

    for (int si = 0; si < (int)states.size(); si++) {
      if (states[si].done) continue;
      bool isCpuOnly = (states[si].task.architecture == ARCH_HYBRID_MOE || states[si].task.architecture == ARCH_DECOUPLED_FLY_CORTEX) || !useCuda;
      if (isCpuOnly) {
        cpuJobs.push_back(buildJobForSingle(si, cpuTotalW, cpuTotalR));
        cpuActiveMap.push_back(si);
      } else {
        gpuJobs.push_back(buildJobForSingle(si, gpuTotalW, gpuTotalR));
        gpuActiveMap.push_back(si);
      }
    }

    if (gpuJobs.empty() && cpuJobs.empty()) break;

    if (!gpuJobs.empty()) {
      gpuWeights.resize(gpuTotalW);
      gpuScores.resize(gpuTotalR);
      gpuFitness.resize(gpuTotalR);
      gpuTicks.resize(gpuJobs.size());

      auto tPack0 = Clock::now();
#ifdef _OPENMP
      #pragma omp parallel for schedule(static)
#endif
      for (int j = 0; j < (int)gpuJobs.size(); j++) {
        states[gpuActiveMap[j]].pack_quantized_f32(&gpuWeights[gpuJobs[j].weightOffset]);
      }
      hostOptMs += std::chrono::duration<double, std::milli>(Clock::now() - tPack0).count();

      auto tK0 = Clock::now();
#ifdef __CUDACC__
      if (gpuJobs.size() > d_jobs_cap) {
        if (d_jobs) cudaFree(d_jobs);
        if (d_ticks) cudaFree(d_ticks);
        d_jobs_cap = gpuJobs.size() * 2;
        cudaMalloc(&d_jobs, d_jobs_cap * sizeof(GpuEvalJob));
        cudaMalloc(&d_ticks, d_jobs_cap * sizeof(unsigned long long));
      }
      if (gpuTotalW > d_weights_cap) {
        if (d_weights) cudaFree(d_weights);
        d_weights_cap = gpuTotalW * 2;
        cudaMalloc(&d_weights, d_weights_cap * sizeof(float));
      }
      if (gpuTotalR > d_res_cap) {
        if (d_scores) cudaFree(d_scores);
        if (d_fitness) cudaFree(d_fitness);
        d_res_cap = gpuTotalR * 2;
        cudaMalloc(&d_scores, d_res_cap * sizeof(int));
        cudaMalloc(&d_fitness, d_res_cap * sizeof(float));
      }
      cudaMemcpy(d_jobs, gpuJobs.data(), gpuJobs.size() * sizeof(GpuEvalJob), cudaMemcpyHostToDevice);
      cudaMemcpy(d_weights, gpuWeights.data(), gpuTotalW * sizeof(float), cudaMemcpyHostToDevice);

      int maxPop = 64;
      for (size_t j = 0; j < gpuJobs.size(); j++) {
        if (gpuJobs[j].popSize > maxPop) maxPop = gpuJobs[j].popSize;
      }
      int threads = maxPop <= 64 ? 64 : (maxPop <= 128 ? 128 : 256);
      eval_population_lockstep_kernel<<<(int)gpuJobs.size(), threads>>>(
          d_jobs, d_weights, d_scores, d_fitness, d_ticks);
      cudaDeviceSynchronize();

      cudaMemcpy(gpuScores.data(), d_scores, gpuTotalR * sizeof(int), cudaMemcpyDeviceToHost);
      cudaMemcpy(gpuFitness.data(), d_fitness, gpuTotalR * sizeof(float), cudaMemcpyDeviceToHost);
      cudaMemcpy(gpuTicks.data(), d_ticks, gpuJobs.size() * sizeof(unsigned long long), cudaMemcpyDeviceToHost);
#endif
      gpuKernelMs += std::chrono::duration<double, std::milli>(Clock::now() - tK0).count();
    }

    if (!cpuJobs.empty()) {
      cpuWeights.resize(cpuTotalW);
      cpuScores.resize(cpuTotalR);
      cpuFitness.resize(cpuTotalR);
      cpuTicks.resize(cpuJobs.size());

      auto tCpu0 = Clock::now();
#ifdef _OPENMP
      #pragma omp parallel for schedule(static)
#endif
      for (int j = 0; j < (int)cpuJobs.size(); j++) {
        states[cpuActiveMap[j]].pack_quantized_f32(&cpuWeights[cpuJobs[j].weightOffset]);
      }
#ifdef _OPENMP
      #pragma omp parallel for schedule(dynamic)
#endif
      for (int j = 0; j < (int)cpuJobs.size(); j++) {
        uint64_t tk = 0;
        eval_population_lockstep_cpu(
            cpuJobs[j], cpuWeights.data(), cpuScores.data(), cpuFitness.data(), &tk);
        cpuTicks[j] = (unsigned long long)tk;
      }
      hostOptMs += std::chrono::duration<double, std::milli>(Clock::now() - tCpu0).count();
    }

    // Mid-trial early-stop audit triggers + evolutionary step
    auto tOpt0 = Clock::now();
    std::vector<int> auditCandidates;
    auto collectCand = [&](const std::vector<GpuEvalJob>& jList, const std::vector<int>& mList,
                           const std::vector<int>& sList, const std::vector<float>& fList,
                           const std::vector<unsigned long long>& tList) {
      for (int j = 0; j < (int)jList.size(); j++) {
        int si = mList[j];
        states[si].trainTicks += (uint64_t)tList[j];
        batchTrainTicks += (uint64_t)tList[j];
        int bestGenSc = 0;
        int bestGenIdx = 0;
        const int* sc = &sList[jList[j].resultOffset];
        const float* ft = &fList[jList[j].resultOffset];
        for (int b = 0; b < jList[j].popSize; b++) {
          if (sc[b] > bestGenSc || (sc[b] == bestGenSc && ft[b] > ft[bestGenIdx])) {
            bestGenSc = sc[b];
            bestGenIdx = b;
          }
        }
        if (bestGenSc >= states[si].nextAuditTrigger) {
          states[si].bestVec.assign(
              &states[si].pop[(size_t)bestGenIdx * states[si].paramCount],
              &states[si].pop[(size_t)(bestGenIdx + 1) * states[si].paramCount]);
          auditCandidates.push_back(si);
        }
      }
    };
    collectCand(gpuJobs, gpuActiveMap, gpuScores, gpuFitness, gpuTicks);
    collectCand(cpuJobs, cpuActiveMap, cpuScores, cpuFitness, cpuTicks);
    hostOptMs += std::chrono::duration<double, std::milli>(Clock::now() - tOpt0).count();

    if (!auditCandidates.empty()) {
      auto tAud0 = Clock::now();
      bool useF32Aud = (nTrials > 0 && tasks[0].auditFloat32 != 0);
      if (useF32Aud) {
        std::vector<GpuAuditSeedJob> preJobs;
        std::vector<float> preWeights;
        std::vector<int> candStarts, candSeeds, candSi;
        for (int si : auditCandidates) {
          TrialState& st = states[si];
          auto qv = st.quantize_vec(st.bestVec);
          int wOff = (int)preWeights.size();
          for (int p = 0; p < st.paramCount; p++) preWeights.push_back((float)qv[p]);
          int preCap = std::min(64, st.task.targetPipeCap);
          candStarts.push_back((int)preJobs.size());
          candSeeds.push_back(st.task.verificationSeeds);
          candSi.push_back(si);
          for (int s = 0; s < st.task.verificationSeeds; s++) {
            preJobs.push_back(make_audit_seed_job(st.task, si, s, st.paramCount, wOff, preCap, st.activeReasoningSteps, st.hybridExpertMask));
          }
        }
        std::vector<GpuAuditSeedOut> preOuts;
        run_audit_jobs_f32(useCuda, preJobs, preWeights, preOuts);

        std::vector<int> passedIdx;
        for (int c = 0; c < (int)candSi.size(); c++) {
          int si = candSi[c];
          TrialState& st = states[si];
          AuditResultF64 pre = aggregate_f32_seed_outs(st.task.architecture, candSeeds[c], &preOuts[candStarts[c]]);
          st.auditTicks += pre.ticksEvaluated;
          if (pre.verifiedPerfect) {
            if (std::min(64, st.task.targetPipeCap) == st.task.targetPipeCap) {
              st.bestAudit = pre;
              st.hasBestAudit = true;
              st.bestAuditVec = st.bestVec;
              st.verifiedPerfect = true;
              st.done = true;
              st.stoppedReason = 0;
            } else {
              passedIdx.push_back(si);
            }
          }
          int gLim = std::min(st.task.targetPipeCap, 160);
          st.nextAuditTrigger = std::min(gLim, std::max(st.nextAuditTrigger + 40, (int)std::llround(st.nextAuditTrigger * 1.4)));
          if (st.nextAuditTrigger >= gLim) st.nextAuditTrigger = gLim + 1;
        }

        if (!passedIdx.empty()) {
          std::vector<GpuAuditSeedJob> fullJobs;
          std::vector<float> fullWeights;
          std::vector<int> fStarts, fSeeds;
          for (int si : passedIdx) {
            TrialState& st = states[si];
            auto qv = st.quantize_vec(st.bestVec);
            int wOff = (int)fullWeights.size();
            for (int p = 0; p < st.paramCount; p++) fullWeights.push_back((float)qv[p]);
            fStarts.push_back((int)fullJobs.size());
            fSeeds.push_back(st.task.verificationSeeds);
            for (int s = 0; s < st.task.verificationSeeds; s++) {
              fullJobs.push_back(make_audit_seed_job(st.task, si, s, st.paramCount, wOff, st.task.targetPipeCap, st.activeReasoningSteps, st.hybridExpertMask));
            }
          }
          std::vector<GpuAuditSeedOut> fullOuts;
          run_audit_jobs_f32(useCuda, fullJobs, fullWeights, fullOuts);
          for (int k = 0; k < (int)passedIdx.size(); k++) {
            int si = passedIdx[k];
            TrialState& st = states[si];
            AuditResultF64 full = aggregate_f32_seed_outs(st.task.architecture, fSeeds[k], &fullOuts[fStarts[k]]);
            st.auditTicks += full.ticksEvaluated;
            if (!st.hasBestAudit || full.verifiedPerfect || full.minSeedScore > st.bestAudit.minSeedScore) {
              st.bestAudit = full;
              st.hasBestAudit = true;
              st.bestAuditVec = st.bestVec;
            }
            if (full.verifiedPerfect) {
              st.verifiedPerfect = true;
              st.done = true;
              st.stoppedReason = 0;
            }
          }
        }
      } else {
#ifdef _OPENMP
        #pragma omp parallel for schedule(dynamic)
#endif
        for (int c = 0; c < (int)auditCandidates.size(); c++) {
          int si = auditCandidates[c];
          TrialState& st = states[si];
          auto qv = st.quantize_vec(st.bestVec);
          int preCap = std::min(64, st.task.targetPipeCap);
          AuditResultF64 pre = audit_brain_f64(st.task, qv, preCap, st.task.verificationSeeds, true, st.activeReasoningSteps, st.hybridExpertMask);
          st.auditTicks += pre.ticksEvaluated;
          if (pre.verifiedPerfect) {
            AuditResultF64 full = (preCap == st.task.targetPipeCap)
                                      ? pre
                                      : audit_brain_f64(st.task, qv, st.task.targetPipeCap, st.task.verificationSeeds, true, st.activeReasoningSteps, st.hybridExpertMask);
            if (preCap != st.task.targetPipeCap) st.auditTicks += full.ticksEvaluated;
            if (!st.hasBestAudit || full.verifiedPerfect || full.minSeedScore > st.bestAudit.minSeedScore) {
              st.bestAudit = full;
              st.hasBestAudit = true;
              st.bestAuditVec = st.bestVec;
            }
            if (full.verifiedPerfect) {
              st.verifiedPerfect = true;
              st.done = true;
              st.stoppedReason = 0;
            }
          }
          int gLim = std::min(st.task.targetPipeCap, 160);
          st.nextAuditTrigger = std::min(gLim, std::max(st.nextAuditTrigger + 40, (int)std::llround(st.nextAuditTrigger * 1.4)));
          if (st.nextAuditTrigger >= gLim) st.nextAuditTrigger = gLim + 1;
        }
      }
      f64AuditMs += std::chrono::duration<double, std::milli>(Clock::now() - tAud0).count();
    }

    auto tEv0 = Clock::now();
    auto stepEvolveGroup = [&](const std::vector<GpuEvalJob>& jList, const std::vector<int>& mList,
                               const std::vector<int>& sList, const std::vector<float>& fList) {
#ifdef _OPENMP
      #pragma omp parallel for schedule(dynamic)
#endif
      for (int j = 0; j < (int)jList.size(); j++) {
        int si = mList[j];
        if (!states[si].done) {
          const TrialTask& tk = states[si].task;
          EnvParams activeEnv = tk.curriculumLearning
                                    ? resolve_curriculum_env(tk.env, states[si].gen, tk.curriculumGenerations)
                                    : tk.env;
          states[si].evolve(&sList[jList[j].resultOffset], &fList[jList[j].resultOffset], activeEnv);
        } else if ((int)states[si].scoreCurve.size() < states[si].gen) {
          const int* sc = &sList[jList[j].resultOffset];
          int bSc = 0;
          for (int b = 0; b < jList[j].popSize; b++) if (sc[b] > bSc) bSc = sc[b];
          states[si].scoreCurve.push_back(bSc);
        }
      }
    };
    if (!gpuJobs.empty()) stepEvolveGroup(gpuJobs, gpuActiveMap, gpuScores, gpuFitness);
    if (!cpuJobs.empty()) stepEvolveGroup(cpuJobs, cpuActiveMap, cpuScores, cpuFitness);
    hostOptMs += std::chrono::duration<double, std::milli>(Clock::now() - tEv0).count();
  }

#ifdef __CUDACC__
  if (d_jobs) cudaFree(d_jobs);
  if (d_weights) cudaFree(d_weights);
  if (d_scores) cudaFree(d_scores);
  if (d_fitness) cudaFree(d_fitness);
  if (d_ticks) cudaFree(d_ticks);
#endif

  // Final multi-seed audit for single-species trials
  auto tFinalAud0 = Clock::now();
  if (!states.empty()) {
    bool useF32Final = (tasks[singleIndices[0]].auditFloat32 != 0);
    if (useF32Final) {
      std::vector<GpuAuditSeedJob> finJobs;
      std::vector<float> finWeights;
      std::vector<int> finSi, finStarts, finSeeds;
      std::vector<std::vector<double>> finCands;
      for (int si = 0; si < (int)states.size(); si++) {
        TrialState& st = states[si];
        bool needsFull = !st.hasBestAudit ||
                         (!st.bestAudit.verifiedPerfect && (int)st.bestAudit.seedScores.size() < st.task.verificationSeeds);
        if (!needsFull) continue;
        const auto& cand = st.hasBestAudit ? st.bestAuditVec : st.bestVec;
        auto qv = st.quantize_vec(cand);
        int wOff = (int)finWeights.size();
        for (int p = 0; p < st.paramCount; p++) finWeights.push_back((float)qv[p]);
        finSi.push_back(si);
        finStarts.push_back((int)finJobs.size());
        finSeeds.push_back(st.task.verificationSeeds);
        finCands.push_back(cand);
        for (int s = 0; s < st.task.verificationSeeds; s++) {
          finJobs.push_back(make_audit_seed_job(st.task, si, s, st.paramCount, wOff, st.task.targetPipeCap, st.activeReasoningSteps, st.hybridExpertMask));
        }
      }
      std::vector<GpuAuditSeedOut> finOuts;
      run_audit_jobs_f32(useCuda, finJobs, finWeights, finOuts);
      for (int k = 0; k < (int)finSi.size(); k++) {
        int si = finSi[k];
        TrialState& st = states[si];
        AuditResultF64 full = aggregate_f32_seed_outs(st.task.architecture, finSeeds[k], &finOuts[finStarts[k]]);
        st.auditTicks += full.ticksEvaluated;
        if (!st.hasBestAudit || full.verifiedPerfect ||
            full.minSeedScore > st.bestAudit.minSeedScore ||
            (full.minSeedScore == st.bestAudit.minSeedScore && full.meanSeedScore > st.bestAudit.meanSeedScore) ||
            (int)full.seedScores.size() > (int)st.bestAudit.seedScores.size()) {
          st.bestAudit = full;
          st.hasBestAudit = true;
          st.bestAuditVec = finCands[k];
        }
        if (full.verifiedPerfect) {
          st.verifiedPerfect = true;
          st.stoppedReason = 0;
        }
      }
    } else {
#ifdef _OPENMP
      #pragma omp parallel for schedule(dynamic)
#endif
      for (int si = 0; si < (int)states.size(); si++) {
        TrialState& st = states[si];
        bool needsFull = !st.hasBestAudit ||
                         (!st.bestAudit.verifiedPerfect && (int)st.bestAudit.seedScores.size() < st.task.verificationSeeds);
        if (needsFull) {
          const auto& cand = st.hasBestAudit ? st.bestAuditVec : st.bestVec;
          auto qv = st.quantize_vec(cand);
          AuditResultF64 full = audit_brain_f64(st.task, qv, st.task.targetPipeCap, st.task.verificationSeeds, false, st.activeReasoningSteps, st.hybridExpertMask);
          st.auditTicks += full.ticksEvaluated;
          if (!st.hasBestAudit || full.verifiedPerfect ||
              full.minSeedScore > st.bestAudit.minSeedScore ||
              (full.minSeedScore == st.bestAudit.minSeedScore && full.meanSeedScore > st.bestAudit.meanSeedScore) ||
              (int)full.seedScores.size() > (int)st.bestAudit.seedScores.size()) {
            st.bestAudit = full;
            st.hasBestAudit = true;
            st.bestAuditVec = cand;
          }
          if (full.verifiedPerfect) {
            st.verifiedPerfect = true;
            st.stoppedReason = 0;
          }
        }
      }
    }
  }
  f64AuditMs += std::chrono::duration<double, std::milli>(Clock::now() - tFinalAud0).count();

  double totalWallMs = std::chrono::duration<double, std::milli>(Clock::now() - tBatchStart).count();
  double avgTrialMs = nTrials > 0 ? totalWallMs / (double)nTrials : totalWallMs;

  auto writeAuditOutputs = [](TrialOutput& out, const AuditResultF64& aud) {
    out.totalDeaths = aud.totalDeaths;
    out.floorDeaths = aud.floorDeaths;
    out.ceilingDeaths = aud.ceilingDeaths;
    out.pipeTopDeaths = aud.pipeTopDeaths;
    out.pipeBottomDeaths = aud.pipeBottomDeaths;
    out.avgDeathAbsVy = aud.avgDeathAbsVy;
    out.avgDeathGapErr = aud.avgDeathGapErr;
    out.dominantFailure = aud.dominantFailure;
    out.hasReasoningTelemetry = aud.hasReasoning ? 1 : 0;
    out.avgPonderSteps = aud.avgPonderSteps;
    out.calmPonderSteps = aud.calmPonderSteps;
    out.dangerPonderSteps = aud.dangerPonderSteps;
    out.system2Ratio = aud.system2Ratio;
    out.avgRolloutAdvantage = aud.avgRolloutAdvantage;
    out.avgSsmGate = aud.avgSsmGate;
  };

  for (int i = 0; i < nTrials; i++) {
    TrialOutput& out = outputs[i];
    std::memset(&out, 0, sizeof(TrialOutput));
    out.winningSpecies = -1;

    if (taskToIsland[i] >= 0) {
      const IslandCoordinatorState& ist = islandStates[taskToIsland[i]];
      const TrialState& wSt = ist.islands[ist.hasBestAudit ? ist.bestAuditLeaderIdx : ist.leaderIdx];
      out.bestTrainScore = ist.bestTrainScore;
      out.minSeedScore = ist.hasBestAudit ? ist.bestAudit.minSeedScore : ist.bestTrainScore;
      out.meanSeedScore = ist.hasBestAudit ? ist.bestAudit.meanSeedScore : (double)ist.bestTrainScore;
      out.verifiedPerfect = (ist.verifiedPerfect || (ist.hasBestAudit && ist.bestAudit.verifiedPerfect)) ? 1 : 0;
      out.stoppedReason = out.verifiedPerfect ? 0 : ist.stoppedReason;
      out.bestFitness = ist.bestFitness < 0.0 ? 0.0 : ist.bestFitness;
      out.finalAvgScore = ist.lastAvgScore;
      out.generationsRun = ist.gen;
      out.trainingTicks = ist.trainTicks;
      out.auditTicks = ist.auditTicks;
      out.paramCount = wSt.paramCount;
      out.durationMs = avgTrialMs;
      if (ist.hasBestAudit) writeAuditOutputs(out, ist.bestAudit);

      out.initialActiveParams = wSt.initialActiveParams;
      out.finalActiveParams = wSt.count_active_params();
      out.prunedSynapses = wSt.prunedSynapses;
      out.growthEventsCount = wSt.growthEventsCount;
      out.pruneEventsCount = wSt.pruneEventsCount;
      out.finalReasoningSteps = wSt.activeReasoningSteps;
      out.finalActiveSensors = wSt.activeSensorCount;
      for (int h = 0; h < 5; h++) {
        out.finalHiddenLayers[h] = (h < wSt.task.hiddenDepth) ? wSt.activeHiddenCounts[h] : 0;
      }

      out.computeProfile = PROFILE_CPU_SPECIALIZED;
      out.meanFlopsPerFrame = ist.get_mean_flops();
      out.rollbackCount = wSt.rollbackCount;
      out.committedExpertsCount = wSt.committedExpertsCount;
      out.winningSpecies = wSt.task.architecture;
      out.rebalanceCount = ist.rebalanceCount;
      out.activeExpertsMask = wSt.hybridExpertMask;

      auto qBest = wSt.quantize_vec(ist.hasBestAudit ? ist.bestAuditVec : wSt.bestVec);
      int wCopy = std::min(wSt.paramCount, maxWeightsPerTrial);
      std::memcpy(&outBestWeights[(size_t)i * maxWeightsPerTrial], qBest.data(), sizeof(double) * wCopy);

      int cCopy = std::min((int)ist.scoreCurve.size(), maxCurveLen);
      out.scoreCurveLen = cCopy;
      for (int k = 0; k < cCopy; k++) outScoreCurves[(size_t)i * maxCurveLen + k] = ist.scoreCurve[k];

      int sCopy = ist.hasBestAudit ? std::min((int)ist.bestAudit.seedScores.size(), maxSeeds) : 0;
      out.seedScoresLen = sCopy;
      for (int k = 0; k < sCopy; k++) outSeedScores[(size_t)i * maxSeeds + k] = ist.bestAudit.seedScores[k];
      continue;
    }

    const TrialState& st = states[taskToSingle[i]];
    batchAuditTicks += st.auditTicks;
    out.bestTrainScore = st.bestTrainScore;
    out.minSeedScore = st.hasBestAudit ? st.bestAudit.minSeedScore : st.bestTrainScore;
    out.meanSeedScore = st.hasBestAudit ? st.bestAudit.meanSeedScore : (double)st.bestTrainScore;
    out.verifiedPerfect = (st.verifiedPerfect || (st.hasBestAudit && st.bestAudit.verifiedPerfect)) ? 1 : 0;
    out.stoppedReason = out.verifiedPerfect ? 0 : st.stoppedReason;
    out.bestFitness = st.bestFitness < 0.0 ? 0.0 : st.bestFitness;
    out.finalAvgScore = st.lastAvgScore;
    out.generationsRun = st.gen;
    out.trainingTicks = st.trainTicks;
    out.auditTicks = st.auditTicks;
    out.paramCount = st.paramCount;
    out.durationMs = avgTrialMs;
    if (st.hasBestAudit) writeAuditOutputs(out, st.bestAudit);

    out.initialActiveParams = st.initialActiveParams;
    out.finalActiveParams = st.count_active_params();
    out.prunedSynapses = st.prunedSynapses;
    out.growthEventsCount = st.growthEventsCount;
    out.pruneEventsCount = st.pruneEventsCount;
    out.finalReasoningSteps = st.activeReasoningSteps;
    out.finalActiveSensors = st.activeSensorCount;
    for (int h = 0; h < 5; h++) {
      out.finalHiddenLayers[h] = (h < st.task.hiddenDepth) ? st.activeHiddenCounts[h] : 0;
    }

    out.computeProfile = (st.task.architecture == ARCH_HYBRID_MOE || st.task.architecture == ARCH_DECOUPLED_FLY_CORTEX) ? PROFILE_CPU_SPECIALIZED : PROFILE_GPU_LOCKSTEP;
    out.meanFlopsPerFrame = st.lastAvgFlops > 0.0 ? st.lastAvgFlops : st.compute_active_flops();
    out.rollbackCount = st.rollbackCount;
    out.committedExpertsCount = st.committedExpertsCount;
    out.winningSpecies = -1;
    out.rebalanceCount = 0;
    out.activeExpertsMask = st.hybridExpertMask;

    auto qBest = st.quantize_vec(st.hasBestAudit ? st.bestAuditVec : st.bestVec);
    int wCopy = std::min(st.paramCount, maxWeightsPerTrial);
    std::memcpy(&outBestWeights[(size_t)i * maxWeightsPerTrial], qBest.data(), sizeof(double) * wCopy);

    int cCopy = std::min((int)st.scoreCurve.size(), maxCurveLen);
    out.scoreCurveLen = cCopy;
    for (int k = 0; k < cCopy; k++) outScoreCurves[(size_t)i * maxCurveLen + k] = st.scoreCurve[k];

    int sCopy = st.hasBestAudit ? std::min((int)st.bestAudit.seedScores.size(), maxSeeds) : 0;
    out.seedScoresLen = sCopy;
    for (int k = 0; k < sCopy; k++) outSeedScores[(size_t)i * maxSeeds + k] = st.bestAudit.seedScores[k];
  }

  if (perf) {
    perf->gpuKernelMs = gpuKernelMs;
    perf->hostOptimizerMs = hostOptMs;
    perf->f64AuditMs = f64AuditMs;
    perf->totalWallMs = totalWallMs;
    perf->totalTrainingTicks = batchTrainTicks;
    perf->totalAuditTicks = batchAuditTicks;
    perf->usedCuda = useCuda ? 1 : 0;
  }
}

} // extern "C"
`;
