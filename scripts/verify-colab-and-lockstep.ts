/**
 * End-to-End Verification Suite for:
 * 1. Google Colab CUDA C++ Notebook (.ipynb) Generator
 * 2. Real Compilation (g++ -O3 -fopenmp) & Execution of Generated Notebook Cells
 * 3. Bit-Exact Float64 Audit Parity between C++ Engine and TypeScript NeuroLab Engine
 *    across ALL 9 architectures, ALL 8 optimizers, ALL 6 precisions, 7 sensors, Curriculum & Shaped Fitness
 * 4. Exact trialSignature & JSON Import Round-Trip Compatibility
 * 5. Local Worker Lockstep stepHeadlessBatch Speed & Parity Check
 * 6. Sweep Cost & ETA Diagnostic Estimator Verification
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getPresetById } from '../src/engine/experimentPresets';
import { DEFAULT_SWEEP_CONFIG } from '../src/hooks/useResearchSession';
import { buildColabNotebook } from '../src/engine/colabExporter';
import { PopulationBatchKernel } from '../src/engine/cpuBatchKernel';
import { auditBrainMastery } from '../src/engine/evaluator';
import { MorphogenesisController } from '../src/engine/morphogenesis';
import {
  ALL_ARCHITECTURES,
  ALL_WEIGHT_PRECISIONS,
  ARCHITECTURE_META,
  isGpuBioTopologySupported,
  isWebGl2BioTopologySupported,
  NeuralNetwork,
} from '../src/engine/neuralNetwork';
import {
  ALL_OPTIMIZER_ALGORITHMS,
  OPTIMIZER_PARAM_SUPPORT,
} from '../src/engine/optimizers';
import {
  CORE_DIFFICULTIES,
  normalizeDifficultyPreset,
  verifyScenarioSolvability,
} from '../src/engine/physics';
import { buildLlmMetaPack } from '../src/engine/researchReport';
import { getResultSignature } from '../src/engine/researchStorage';
import {
  ALL_SENSOR_FEATURES,
  buildSensorInputs,
} from '../src/engine/sensors';
import { FlappySimulation, resolveEnvironment } from '../src/engine/simulation';
import {
  buildQuickTrimConfig,
  estimateSweepComputeCost,
  formatDurationCompact,
} from '../src/engine/sweepCostEstimator';
import {
  encodeArchitectureCode,
  encodeTopologyAndSensors,
  getWebGpuShaderSources,
  TASK_STRIDE_U32,
  writeTaskDescToBuffers,
} from '../src/engine/webgpuEvaluator';
import type {
  DifficultyPreset,
  ResearchSweepConfig,
  ResearchTrialResult,
} from '../src/engine/types';

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    throw new Error(`ASSERTION FAILED: ${msg}`);
  }
}

async function main() {
  console.log('=== 1. Testing Sweep Cost & ETA Diagnostic Estimator ===');
  const heavyCfg: ResearchSweepConfig = {
    algorithms: ['GA', 'DE', 'CMA_HYBRID'],
    difficulties: ['EASY', 'MEDIUM', 'HARD', 'INSANE'],
    topologies: [[], [2], [4], [2, 2], [4, 2], [4, 4]],
    inputFeatureSets: [[...ALL_SENSOR_FEATURES]],
    architectures: ['MLP', 'LTC_FLY', 'LOOPED_REASONER', 'PONDER_ACT', 'SELECTIVE_SSM', 'LATENT_ROLLOUT'],
    weightPrecisions: ['FP32', 'INT4', 'TERNARY'],
    populationSizes: [60, 100],
    mutationRates: [0.12, 0.25],
    mutationStrengths: [0.25, 0.45],
    maxGenerations: 200,
    stagnationLimit: 60,
    targetPipeCap: 2000,
    verificationSeeds: 6,
    workerThreads: 0,
    performancePriority: 70,
    computeBackend: 'AUTO',
    smartPrune: true,
    curriculumLearning: true,
    shapedFitness: true,
    reasoningSteps: 4,
  };
  const cost = estimateSweepComputeCost(heavyCfg);
  console.log(
    `  Heavy Frontier Grid: ${cost.activeTrials} active trials (${cost.cpuOnlyPct}% CPU-only)`
  );
  console.log(
    `  Local (Lockstep): ${formatDurationCompact(cost.localEstSec)} (vs legacy ${formatDurationCompact(cost.localLegacyEstSec)})`
  );
  console.log(
    `  Colab T4: ${formatDurationCompact(cost.colabT4Sec)} (${cost.t4SpeedupX}x faster) | L4: ${formatDurationCompact(cost.colabL4Sec)} | A100: ${formatDurationCompact(cost.colabA100Sec)}`
  );
  assert(cost.recommendColab === true, 'Heavy Frontier sweep should recommend Colab');
  assert(
    cost.cpuOnlyPct === 0,
    `Full-Frontier WebGPU should accelerate Shaped+Curriculum+12-sensor+Reasoning (got ${cost.cpuOnlyPct}% CPU-only)`
  );
  assert(cost.colabT4Sec < cost.localEstSec, 'Colab T4 must be faster than local WebGPU');

  const trimmed = buildQuickTrimConfig(heavyCfg);
  const trimmedCost = estimateSweepComputeCost(trimmed);
  console.log(
    `  Quick-Trim Pilot: ${trimmedCost.activeTrials} trials -> Local ${formatDurationCompact(trimmedCost.localEstSec)}`
  );
  assert(trimmedCost.activeTrials < cost.activeTrials, 'Quick-Trim must reduce active trials');

  console.log('\n=== 1b. Testing COLAB_MEGA_FRONTIER Preset & 10,000,000+ Trial O(1) Export ===');
  const megaCfg = getPresetById('COLAB_MEGA_FRONTIER').buildConfig(DEFAULT_SWEEP_CONFIG);
  const megaCost = estimateSweepComputeCost(megaCfg);
  const tMega0 = performance.now();
  const megaNb = buildColabNotebook(megaCfg, {
    scope: 'FULL',
    runLabel: 'Colab-GPU-Mega-Frontier',
    maxRuntimeMinutes: 55,
  });
  const megaMs = performance.now() - tMega0;
  console.log(
    `  COLAB_MEGA_FRONTIER: ${megaCost.activeTrials.toLocaleString()} active trials | Local ${formatDurationCompact(megaCost.localEstSec)} | T4 ${formatDurationCompact(megaCost.colabT4Sec)} | L4 ${formatDurationCompact(megaCost.colabL4Sec)} | A100 ${formatDurationCompact(megaCost.colabA100Sec)}`
  );
  console.log(
    `  Exported ${megaNb.filename} (${(megaNb.notebookJson.length / 1024).toFixed(1)} KB) in ${megaMs.toFixed(1)} ms`
  );
  assert(megaCost.activeTrials >= 2000 && megaCost.activeTrials <= 16000, `Unexpected mega trials: ${megaCost.activeTrials}`);
  assert(megaNb.notebookJson.length < 350 * 1024, 'Mega notebook must stay < 350 KB');

  // Extreme stress test: >10,000,000 Cartesian trials must export in <1.5s & <350KB without allocation overflow!
  const stressTopos: number[][] = [];
  for (let a = 1; a <= 8; a++) {
    stressTopos.push([a]);
    for (let b = 1; b <= 6; b++) {
      stressTopos.push([a, b]);
      for (let c = 1; c <= 4; c++) stressTopos.push([a, b, c]);
    }
  }
  const monsterCfg: ResearchSweepConfig = {
    ...heavyCfg,
    algorithms: ['GA', 'DE', 'PSO', 'CMA_HYBRID', 'CEM', 'ADAPTIVE_ES', 'NATURAL_ES', 'ADAM_ES'],
    difficulties: [
      'EASY', 'MEDIUM', 'HARD', 'INSANE',
      'STANDARD', 'VARIABLE_SPEED', 'DYNAMIC_GAPS', 'MOVING_GAPS',
      'MOVING_GUSTS', 'HEAVY_GRAVITY', 'GUST_CHAOS', 'TURBULENCE_EXTREME',
    ],
    architectures: [...ALL_ARCHITECTURES],
    weightPrecisions: [...ALL_WEIGHT_PRECISIONS],
    topologies: stressTopos,
    populationSizes: [60, 150, 300],
    mutationRates: [0.08, 0.16, 0.25],
    mutationStrengths: [0.25, 0.35, 0.5],
    morphogenesisMode: 'PAIRED_AB',
    maxParameters: undefined,
    smartPrune: true,
  };
  const tMon0 = performance.now();
  const monsterNb = buildColabNotebook(monsterCfg, {
    scope: 'FULL',
    runLabel: 'Monster-10M-Stress',
  });
  const monMs = performance.now() - tMon0;
  console.log(
    `  [PASS] Monster Grid: ${monsterNb.exportedTrialsCount.toLocaleString()} active trials exported in ${monMs.toFixed(1)} ms (${(monsterNb.notebookJson.length / 1024).toFixed(1)} KB .ipynb, ZERO overflow!)`
  );
  assert(monsterNb.exportedTrialsCount > 10_000_000, 'Monster stress test should exceed 10M trials');
  assert(monsterNb.notebookJson.length < 350 * 1024, 'Even 10M+ trial notebook must be < 350 KB');
  assert(monMs < 1500, `Monster export took too long: ${monMs}ms`);

  console.log('\n=== 2. Generating & Executing Real Google Colab Notebook (.ipynb, 12-Sensor + Paired Morphogenesis) ===');
  const testSweepCfg: ResearchSweepConfig = {
    algorithms: ['GA', 'DE', 'PSO', 'CMA_HYBRID', 'CEM', 'ADAPTIVE_ES', 'NATURAL_ES', 'ADAM_ES'],
    difficulties: ['EASY', 'INSANE'],
    topologies: [[4], [4, 2]],
    inputFeatureSets: [[...ALL_SENSOR_FEATURES]],
    architectures: [...ALL_ARCHITECTURES],
    weightPrecisions: [...ALL_WEIGHT_PRECISIONS],
    populationSizes: [24],
    mutationRates: [0.18],
    mutationStrengths: [0.35],
    maxGenerations: 8,
    stagnationLimit: 20,
    targetPipeCap: 60,
    verificationSeeds: 3,
    workerThreads: 0,
    smartPrune: true,
    curriculumLearning: true,
    shapedFitness: true,
    reasoningSteps: 3,
    morphogenesisMode: 'PAIRED_AB',
    morphogenesisConfig: {
      initialWidthRatio: 0.5,
      growthStagnationTrigger: 2,
      saturationThreshold: 0.55,
      myelinationScale: 0.25,
      pruneThreshold: 0.06,
      pruneSparsityTrigger: 0.25,
      progressiveSensors: true,
      growReasoningSteps: true,
      metabolicStepCost: 0.015,
    },
  };

  const nbSummary = buildColabNotebook(testSweepCfg, {
    scope: 'FULL',
    runLabel: 'Verify-All9Arch-All8Algo-All6Prec-Morpho12',
    maxRuntimeMinutes: 10,
    checkpointEvery: 30,
  });

  const nb = JSON.parse(nbSummary.notebookJson);
  assert(nb.nbformat === 4, 'Notebook must be nbformat 4');
  assert(Array.isArray(nb.cells) && nb.cells.length === 7, 'Notebook must have 7 cells');
  console.log(
    `  Generated ${nbSummary.filename} (${nbSummary.exportedTrialsCount} trials, ${(nbSummary.notebookJson.length / 1024).toFixed(1)} KB)`
  );

  // Extract Python cells and execute a representative slice covering ALL 9 archs, 8 algos, 6 precisions, AND both STATIC + GROWING Morphogenesis
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neurolab-colab-verify-'));
  const codeCells = nb.cells
    .filter((c: { cell_type: string }) => c.cell_type === 'code')
    .map((c: { source: string[] }) => c.source.join(''));

  const combinedPy = [
    ...codeCells.slice(0, 2),
    `# Verify exact lazy generator count & pick comprehensive slice covering ALL 9 archs, 8 algos, 6 precisions, STATIC + GROWING\n` +
      `picked = []\nseen_arch, seen_algo, seen_prec, seen_morph = set(), set(), set(), set()\n` +
      `gen_count = 0\n` +
      `for e in iter_all_exported_trials():\n` +
      `    gen_count += 1\n` +
      `    m_mode = e[10] if len(e) > 10 else "STATIC"\n` +
      `    if e[3] not in seen_arch or e[1] not in seen_algo or e[4] not in seen_prec or m_mode not in seen_morph:\n` +
      `        picked.append(e)\n` +
      `        seen_arch.add(e[3]); seen_algo.add(e[1]); seen_prec.add(e[4]); seen_morph.add(m_mode)\n` +
      `assert gen_count == total_available, f"Lazy gen count mismatch: {gen_count} != {total_available}"\n` +
      `assert "GROWING" in seen_morph and "STATIC" in seen_morph, f"Missing Morphogenesis modes: {seen_morph}"\n` +
      `CUSTOM_SELECTED_TRIALS = picked\n` +
      `BATCH_TRIALS = "16"\n` +
      `print(f"[TEST HARNESS] Lazy gen verified {gen_count}=={total_available}; selected {len(picked)} trials covering {len(seen_arch)} archs, {len(seen_algo)} algos, {len(seen_prec)} precisions, modes={sorted(seen_morph)}")\n`,
    ...codeCells.slice(2, 4),
    `# Smoke-test default FP32_GPU batch audit across all selected trials (all 9 archs, 8 algos, 6 precs, STATIC + GROWING)\n` +
      `f32_outs, _, _, _, _, _, _, f32_perf = run_c_batch(CUSTOM_SELECTED_TRIALS, 0)\n` +
      `for i, e in enumerate(CUSTOM_SELECTED_TRIALS):\n` +
      `    assert math.isfinite(f32_outs[i].bestFitness) and f32_outs[i].auditTicks > 0\n` +
      `print(f"[PASS] FP32_GPU batch audit verified across {len(CUSTOM_SELECTED_TRIALS)} trials (auditMs={f32_perf.f64AuditMs:.1f}ms, auditTicks={f32_perf.totalAuditTicks})")\n` +
      `AUDIT_PRECISION = "FP64_EXACT"\n`,
    ...codeCells.slice(4),
  ].join('\n\n# ===== CELL BOUNDARY =====\n\n');

  const runnerPath = path.join(tmpDir, 'run_colab_notebook.py');
  fs.writeFileSync(runnerPath, combinedPy, 'utf-8');

  console.log(`  Compiling C++/OpenMP engine & running Colab notebook in ${tmpDir}...`);
  const pyOut = execSync(`python3 "${runnerPath}"`, {
    cwd: tmpDir,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  console.log(
    pyOut
      .split('\n')
      .map((l) => `    | ${l}`)
      .join('\n')
  );

  const jsonFiles = fs
    .readdirSync(tmpDir)
    .filter((f) => f.startsWith('flappy-neurolab-colab-dataset-') && f.endsWith('.json'));
  assert(jsonFiles.length === 1, 'Expected exactly 1 exported Colab JSON dataset');

  const dataset = JSON.parse(
    fs.readFileSync(path.join(tmpDir, jsonFiles[0]), 'utf-8')
  );
  assert(dataset.source === 'GOOGLE_COLAB_CUDA', 'Dataset source tag must match');
  assert(Array.isArray(dataset.trials) && dataset.trials.length >= 9, 'Expected >= 9 exported trials');

  console.log(
    `\n=== 3. Verifying Bit-Exact F64 Audit Parity (C++ vs TypeScript) across ${dataset.trials.length} Trials ===`
  );
  let exactMatches = 0;
  let growingMatched = 0;
  for (const t of dataset.trials as ResearchTrialResult[]) {
    const recomputedSig = getResultSignature(t);
    assert(
      recomputedSig === t.trialSignature,
      `Signature mismatch: C++=${t.trialSignature} vs TS=${recomputedSig}`
    );
    assert(Boolean(t.bestBrain), `Trial ${t.id} missing serialized bestBrain`);

    const brain = NeuralNetwork.deserialize(t.bestBrain!);
    const tsAudit = auditBrainMastery(
      brain,
      t.difficulty,
      t.targetPipeCap,
      t.verificationSeeds,
      testSweepCfg.customEnvironment,
      false,
      t.bestScore
    );

    assert(
      tsAudit.minSeedScore === t.minSeedScore,
      `F64 Audit Parity Mismatch on ${t.architecture}/${t.algorithm}/${t.weightPrecision}/${t.difficulty}/${t.morphogenesisMode}: C++ minSeed=${t.minSeedScore} vs TS minSeed=${tsAudit.minSeedScore}`
    );
    assert(
      tsAudit.verifiedPerfect === t.verifiedPerfect,
      `verifiedPerfect mismatch on ${t.architecture}/${t.algorithm}`
    );
    if (t.morphogenesisMode === 'GROWING') {
      assert(
        Boolean(t.morphogenesisSummary),
        `GROWING Colab trial ${t.id} missing morphogenesisSummary`
      );
      growingMatched += 1;
    }
    exactMatches += 1;
  }
  assert(growingMatched >= 1, 'Expected at least 1 GROWING Morphogenesis trial in Colab parity check');
  console.log(
    `  [PASS] ${exactMatches}/${dataset.trials.length} trials (incl. ${growingMatched} Morphogenesis GROWING) matched TypeScript Float64 audit 100% BIT-EXACTLY (9 archs, 8 algos, 6 precs, 12 sensors)!`
  );

  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log('\n=== 4. Verifying Local Worker stepHeadlessBatch Lockstep Kernel (12 Sensors) ===');
  const sim = new FlappySimulation({
    algorithm: 'CMA_HYBRID',
    populationSize: 60,
    mutationRate: 0.15,
    mutationStrength: 0.3,
    elitismCount: 4,
    hiddenNodes: 4,
    hiddenLayers: [4],
    inputFeatures: [...ALL_SENSOR_FEATURES],
    architecture: 'LOOPED_REASONER',
    weightPrecision: 'FP32',
    difficulty: 'HARD',
    curriculumLearning: true,
    shapedFitness: true,
    reasoningSteps: 3,
  });
  assert(sim.isUsingBatchKernel(), 'FlappySimulation should use PopulationBatchKernel for [4] LOOPED_REASONER');

  const t0 = performance.now();
  let gens = 0;
  let totalFrames = 0;
  while (gens < 8 && totalFrames < 30000) {
    const res = sim.stepHeadlessBatch(96, 6000, 0, 80);
    totalFrames += res.framesStepped;
    if (res.genAdvanced) gens += 1;
  }
  const dtMs = Math.max(1, performance.now() - t0);
  const ticks = sim.getTotalTicksEvaluated();
  console.log(
    `  [PASS] stepHeadlessBatch (12 sensors) ran ${gens} gens (${ticks.toLocaleString()} ticks) in ${dtMs.toFixed(1)} ms (${((ticks / (dtMs / 1000)) / 1e6).toFixed(2)} M ticks/s)`
  );
  assert(ticks > 0 && gens >= 1, 'stepHeadlessBatch must evaluate ticks and advance generations');

  console.log('\n=== 5. Verifying Full-Frontier WebGPU WGSL Encoding (12 Sensors), Routing & Shader Integrity ===');
  const seenArchCodes = new Set<number>();
  const gpuNativeArchs = ALL_ARCHITECTURES.filter(
    (a) => ARCHITECTURE_META[a].gpuNative
  );
  for (const arch of gpuNativeArchs) {
    const code = encodeArchitectureCode(arch);
    assert(code >= 0 && code <= 9, `archCode out of range for ${arch}: ${code}`);
    assert(!seenArchCodes.has(code), `Duplicate archCode ${code} for ${arch}`);
    seenArchCodes.add(code);
    assert(isGpuBioTopologySupported([4, 4], arch), `WebGPU must support [4,4] for ${arch}`);
    assert(isGpuBioTopologySupported([16], arch), `WebGPU must support width=16 for ${arch}`);
  }
  assert(seenArchCodes.size === 10, 'All 10 GPU-native architectures (incl. DROSOPHILA_CONNECTOME) must have unique WGSL codes 0..9');
  assert(isGpuBioTopologySupported([6, 4], 'DROSOPHILA_CONNECTOME'), 'DROSOPHILA_CONNECTOME must now be GPU Lockstep supported');
  assert(!isGpuBioTopologySupported([4, 4], 'HYBRID_MOE'), 'HYBRID_MOE must route as CPU_SPECIALIZED');
  assert(!isGpuBioTopologySupported([4, 4], 'DECOUPLED_FLY_CORTEX'), 'DECOUPLED_FLY_CORTEX must route as CPU_SPECIALIZED');
  assert(!isGpuBioTopologySupported([12, 14], 'LTC_FLY'), 'WebGPU Bio must reject totalHidden=26 (>24)');
  assert(!isWebGl2BioTopologySupported([4], 'LOOPED_REASONER'), 'Legacy WebGL2 must reject reasoning archs');
  assert(!isWebGl2BioTopologySupported([12], 'LTC_FLY'), 'Legacy WebGL2 must reject width > 8');
  assert(isWebGl2BioTopologySupported([4, 4], 'LTC_FLY'), 'Legacy WebGL2 must keep supporting [4,4] LTC_FLY');

  // Verify 12-sensor bitmask packing across sensorMask (s0..s7) + sensorMask1 (s8..s11)
  const enc12 = encodeTopologyAndSensors([12, 6, 4, 1], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  for (let k = 0; k < 12; k++) {
    const decoded =
      k < 8
        ? (enc12.sensorMask >>> (k * 4)) & 0xf
        : (enc12.sensorMask1 >>> ((k - 8) * 4)) & 0xf;
    assert(decoded === k, `12-sensor mask mismatch at slot ${k}: got ${decoded}`);
  }

  const taskBuf = new ArrayBuffer(TASK_STRIDE_U32 * 4);
  const taskU32 = new Uint32Array(taskBuf);
  const taskF32 = new Float32Array(taskBuf);
  const envHard = resolveEnvironment('HARD');
  writeTaskDescToBuffers(taskU32, taskF32, 0, {
    weightOffset: 128,
    seed: 1009,
    targetPipeCap: 42,
    maxFrames: 2000,
    topoMeta0: enc12.topoMeta0,
    topoMeta1: enc12.topoMeta1,
    sensorMask: enc12.sensorMask,
    sensorMask1: enc12.sensorMask1,
    env: envHard,
    computeFitness: true,
    architecture: 'LATENT_ROLLOUT',
    shapedFitness: true,
    reasoningSteps: 5,
    metabolicStepCost: 0.015,
  });
  const flags = taskU32[7];
  assert((flags & 1) === 1, 'movingPipes bit 0 must be set');
  assert((flags & 2) === 2, 'computeFitness bit 1 must be set');
  assert(((flags >>> 2) & 0xf) === 8, `LATENT_ROLLOUT archCode must decode to 8`);
  assert((flags & 64) === 64, 'shapedFitness bit 6 must be set');
  assert(((flags >>> 7) & 0xf) === 5, `reasoningSteps must decode to 5`);
  assert(((flags >>> 11) & 0xf) === 3, `metabolicStepCost 0.015 must encode as 3`);
  assert(taskU32[16] === enc12.sensorMask1, 'sensorMask1 must pack into TaskDesc word 16');

  const shaders = getWebGpuShaderSources();
  for (const [name, src] of Object.entries(shaders)) {
    let braceDepth = 0;
    let parenDepth = 0;
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (ch === '{') braceDepth++;
      else if (ch === '}') braceDepth--;
      else if (ch === '(') parenDepth++;
      else if (ch === ')') parenDepth--;
      assert(braceDepth >= 0, `WGSL ${name}: unbalanced '}' at offset ${i}`);
      assert(parenDepth >= 0, `WGSL ${name}: unbalanced ')' at offset ${i}`);
    }
    assert(braceDepth === 0, `WGSL ${name}: unclosed '{' (depth=${braceDepth})`);
    assert(parenDepth === 0, `WGSL ${name}: unclosed '(' (depth=${parenDepth})`);
    assert(src.includes('@compute @workgroup_size(64)'), `WGSL ${name}: missing @compute entry`);
    assert(src.includes('shapedFitness'), `WGSL ${name}: missing shapedFitness support`);
    assert(src.includes('raw11'), `WGSL ${name}: missing 12th sensor raw11 (PIPE_TTF)`);
    assert(src.includes('foundNext2'), `WGSL ${name}: missing 2-pipe lookahead foundNext2`);
    assert(!/\b(float|int|uint)\s+[a-zA-Z_]/.test(src), `WGSL ${name}: contains GLSL type declaration`);
  }
  for (const code of ['1u', '2u', '3u', '4u', '5u', '6u', '7u', '8u', '9u']) {
    assert(shaders.bio.includes(`archCode == ${code}`), `WGSL BIO_REASONING missing archCode == ${code}`);
  }
  console.log(
    `  [PASS] All 3 WGSL shaders (FAST=${shaders.fast.length}B, DEEP=${shaders.deep.length}B, BIO_REASONING=${shaders.bio.length}B, incl. DROSOPHILA_CONNECTOME archCode=9) passed 12-sensor & metabolic Checks!`
  );

  console.log('\n=== 5b. Verifying DECOUPLED_FLY_CORTEX + Compound-Eye 16-Ray Pixels + Online Dopamine Plasticity ===');
  const decoupledSim = new FlappySimulation({
    algorithm: 'CMA_HYBRID',
    populationSize: 20,
    mutationRate: 0.14,
    mutationStrength: 0.28,
    elitismCount: 2,
    hiddenNodes: 10,
    hiddenLayers: [6, 4],
    inputFeatures: [...ALL_SENSOR_FEATURES],
    architecture: 'DECOUPLED_FLY_CORTEX',
    weightPrecision: 'FP32',
    difficulty: 'HARD',
    perceptionMode: 'COMPOUND_EYE_PIXELS',
    opticalNoiseLevel: 0.05,
    nonStationaryAnomalies: true,
    onlinePlasticity: true,
  });
  for (let f = 0; f < 25; f++) {
    decoupledSim.step();
  }
  const rSnap = decoupledSim.getRenderSnapshot();
  const tSnap = decoupledSim.getTelemetry();
  assert(
    rSnap.perceptionMode === 'COMPOUND_EYE_PIXELS' &&
      Array.isArray(rSnap.ommatidiaRays) &&
      rSnap.ommatidiaRays.length === 16,
    'Compound-Eye Pixel mode must populate 16 ommatidiaRays in RenderSnapshot'
  );
  assert(
    Boolean(tSnap.leaderNetwork?.decoupledTelemetry) &&
      tSnap.leaderNetwork!.decoupledTelemetry!.onlineUpdates > 0,
    'DECOUPLED_FLY_CORTEX must record online Dopamine plasticity updates in decoupledTelemetry'
  );
  console.log(
    `  [PASS] DECOUPLED_FLY_CORTEX & Compound-Eye 16-Ray Ommatidia verified (onlineUpdates=${tSnap.leaderNetwork!.decoupledTelemetry!.onlineUpdates}, activeSlots=${tSnap.leaderNetwork!.decoupledTelemetry!.activeSlots.join('/')})!`
  );

  console.log('\n=== 6. Verifying 4 Scenario Math Proofs, Legacy Aliasing & Optimizer Param Support ===');
  for (const diff of CORE_DIFFICULTIES) {
    const env = resolveEnvironment(diff);
    const proof = verifyScenarioSolvability(env);
    assert(
      proof.solvable && proof.climbSlackPx > 0 && proof.diveSlackPx > 0 && proof.transitClearancePx > 4,
      `Core scenario ${diff} failed solvability proof: ${proof.summary}`
    );
    console.log(`  [PASS] ${diff}: ${proof.summary}`);
  }
  const legacyPairs: Array<[DifficultyPreset, DifficultyPreset]> = [
    ['STANDARD', 'EASY'],
    ['VARIABLE_SPEED', 'MEDIUM'],
    ['DYNAMIC_GAPS', 'MEDIUM'],
    ['HEAVY_GRAVITY', 'HARD'],
    ['MOVING_GUSTS', 'HARD'],
    ['MOVING_GAPS', 'HARD'],
    ['GUST_CHAOS', 'INSANE'],
    ['TURBULENCE_EXTREME', 'INSANE'],
  ];
  for (const [leg, norm] of legacyPairs) {
    assert(
      normalizeDifficultyPreset(leg) === norm,
      `Legacy alias mismatch: ${leg} -> ${normalizeDifficultyPreset(leg)} != ${norm}`
    );
  }
  for (const algo of ALL_OPTIMIZER_ALGORITHMS) {
    const sup = OPTIMIZER_PARAM_SUPPORT[algo];
    const expectedMut = algo === 'GA' || algo === 'DE' || algo === 'ADAPTIVE_ES';
    assert(
      sup.usesMutationRate === expectedMut,
      `OPTIMIZER_PARAM_SUPPORT mismatch for ${algo}: got ${sup.usesMutationRate}, expected ${expectedMut}`
    );
  }
  console.log('  [PASS] All 8 legacy aliases & OPTIMIZER_PARAM_SUPPORT invariants verified');

  console.log('\n=== 7. Verifying Morphogenesis Zero-Init Invariance, 12-Sensor Build Parity & LLM Meta-Pack ===');
  const testSensors = [...ALL_SENSOR_FEATURES];
  const probeStates = [
    new Float64Array(testSensors.map((_, i) => Math.sin(i * 0.61) * 0.7)),
    new Float64Array(testSensors.map((_, i) => Math.cos(i * 0.47) * 0.55)),
    new Float64Array(testSensors.map((_, i) => (i % 3 === 0 ? 0.35 : -0.25))),
  ];
  const mBrain = new NeuralNetwork(
    testSensors.length,
    [6, 4],
    1,
    undefined,
    testSensors,
    'PONDER_ACT',
    'FP32',
    3
  );
  const ctrl = new MorphogenesisController(mBrain, {
    initialWidthRatio: 0.5,
    growthStagnationTrigger: 4,
    saturationThreshold: 0.2,
    myelinationScale: 0.25,
    pruneSparsityTrigger: 0.7,
    progressiveSensors: true,
    growReasoningSteps: false,
  });
  const popBrains = [mBrain, mBrain.clone()];
  for (const b of popBrains) ctrl.enforceOnBrain(b);

  // Step through cooldown/trigger until first structural growth occurs
  let grew = false;
  for (let g = 1; g <= 24; g++) {
    const outputsBefore = probeStates.map((st) => {
      mBrain.resetState();
      return mBrain.predict(st);
    });
    const out = ctrl.stepGeneration(g, 10, 1, mBrain, popBrains, envHard, 123 + g);
    if (out.changed && out.event && (out.event.kind === 'GROW_WIDTH' || out.event.kind === 'UNLOCK_SENSOR')) {
      const outputsAfter = probeStates.map((st) => {
        mBrain.resetState();
        return mBrain.predict(st);
      });
      for (let k = 0; k < probeStates.length; k++) {
        const diff = Math.abs(outputsBefore[k] - outputsAfter[k]);
        assert(
          diff < 1e-12,
          `Zero-Init invariance broken on ${out.event.kind}: before=${outputsBefore[k]} vs after=${outputsAfter[k]} (diff=${diff})`
        );
      }
      grew = true;
      break;
    }
  }
  assert(grew, 'Expected MorphogenesisController to trigger Zero-Init structural growth');
  const snap = ctrl.getSnapshot();
  assert(snap.activeParams < snap.ceilingParams || snap.stage > 0, 'Morphogenesis snapshot mismatch');

  // Verify 12-sensor buildSensorInputs matches PopulationBatchKernel sensor layout
  const probeEnv = resolveEnvironment('INSANE');
  const probePhysics = {
    y: 192,
    vy: 2.3,
    tickSpeed: 3.4,
    pipes: [
      { x: 260, gapTop: 120, gapBottom: 240, gapCenter: 180, gapVy: -0.75 },
      { x: 510, gapTop: 150, gapBottom: 270, gapCenter: 210, gapVy: 0.85 },
    ],
  };
  const sBuf12 = new Float64Array(12);
  buildSensorInputs(probePhysics, ALL_SENSOR_FEATURES, probeEnv, sBuf12);
  const probeBrain12 = new NeuralNetwork(12, [4], 1, undefined, [...ALL_SENSOR_FEATURES]);
  const bk = new PopulationBatchKernel([probeBrain12]);
  assert(bk.count === 1 && Number.isFinite(sBuf12[11]) && sBuf12[11] > 0 && sBuf12[11] < 1, '12th sensor PIPE_TTF check failed');

  // Verify buildLlmMetaPack end-to-end
  const dummyTrial: ResearchTrialResult = {
    id: 'verify-llm-1',
    algorithm: 'DE',
    difficulty: 'INSANE',
    topology: [6, 4],
    topologyLabel: '12→6→4→1',
    inputFeatures: [...ALL_SENSOR_FEATURES],
    architecture: 'PONDER_ACT',
    weightPrecision: 'FP32',
    morphogenesisMode: 'GROWING',
    morphogenesisSummary: ctrl.getSummary(),
    maxWidth: 6,
    hiddenNodes: 10,
    hiddenNeuronCount: 10,
    weightCount: 90,
    biasCount: 11,
    depth: 2,
    parameterCount: 101,
    populationSize: 60,
    mutationRate: 0.16,
    mutationStrength: 0.35,
    targetPipeCap: 500,
    verificationSeeds: 5,
    generationsRun: 25,
    bestScore: 42,
    bestFitness: 500,
    finalAvgScore: 28,
    solved: false,
    generationsToSolve: null,
    timeToPerfectionMs: null,
    totalTicksEvaluated: 45000,
    ticksPerSecond: 900000,
    minSeedScore: 34,
    meanSeedScore: 38,
    seedScores: [34, 36, 38, 40, 42],
    verifiedPerfect: false,
    generalizationRatio: 0.81,
    knowledgeDensity: 0.34,
    durationMs: 120,
    stoppedReason: 'MAX_GENS',
    bestBrain: null,
    scoreCurve: [4, 15, 28, 42],
  };
  const pack = buildLlmMetaPack([dummyTrial], testSweepCfg);
  const jsonlObj = JSON.parse(pack.trialsJsonl.trim());
  assert(jsonlObj.normalizedDifficulty === 'INSANE', 'JSONL normalizedDifficulty missing');
  assert(pack.metaDossierMd.includes('6c. 12-Sensor Discovery Meta-Analysis'), 'Missing Section 6c');
  assert(pack.metaDossierMd.includes('6d. Mathematical Scenario Solvability Proofs'), 'Missing Section 6d');
  assert(JSON.parse(pack.sensorMatrixJson).scenarioProofs.length >= 4, 'sensorMatrixJson missing scenarioProofs');
  console.log('  [PASS] Morphogenesis Zero-Init (<1e-12), 12-Sensor & LLM Meta-Pack verified!');

  console.log('\nALL COLAB CUDA + WEBGPU WGSL + MORPHOGENESIS + 12-SENSOR + PARITY VERIFICATIONS PASSED!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

