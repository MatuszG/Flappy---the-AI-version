/**
 * Pre-Colab Empirical Calibration Benchmark Suite
 *
 * Compiles the exact native Colab CUDA/C++ engine (OpenMP C++ mode) and runs 4 targeted
 * micro-benchmarks on Frontier regimes (MOVING_GAPS, INSANE, TURBULENCE_EXTREME) to empirically
 * measure which optimizers, architectures, topologies, sensors, and hyperparameters deliver the
 * highest signal-per-compute before launching a massive Google Colab GPU sweep.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildColabNotebook } from '../src/engine/colabExporter';
import { ALL_ARCHITECTURES } from '../src/engine/neuralNetwork';
import type {
  DifficultyPreset,
  LearningAlgorithm,
  NetworkArchitecture,
  ResearchSweepConfig,
  ResearchTrialResult,
  SensorFeatureId,
  WeightPrecision,
} from '../src/engine/types';

function runNativeBatch(
  label: string,
  cfg: ResearchSweepConfig
): { trials: ResearchTrialResult[]; wallSec: number; ticksMps: number } {
  const nbSummary = buildColabNotebook(cfg, {
    scope: 'FULL',
    runLabel: label,
    maxRuntimeMinutes: 10,
    checkpointEvery: 0,
  });
  const nb = JSON.parse(nbSummary.notebookJson);
  const codeCells = nb.cells
    .filter((c: { cell_type: string }) => c.cell_type === 'code')
    .map((c: { source: string[] }) => c.source.join(''));

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neurolab-bench-'));
  // Reuse compiled libneurolab.so across benchmarks via shared cache path!
  const cachedLib = path.join(os.tmpdir(), 'neurolab_prebench_lib.so');
  const patchCompile = fs.existsSync(cachedLib)
    ? `import ctypes\nCOMPILE_MODE = "CPU_OPENMP"\nCOMPILE_SEC = 0.0\nLIB_PATH = ${JSON.stringify(cachedLib)}\nLIB = ctypes.CDLL(LIB_PATH)\n`
    : `${codeCells[2]}\nimport shutil\nshutil.copyfile(LIB_PATH, ${JSON.stringify(cachedLib)})\n`;

  const combinedPy = [
    codeCells[0],
    codeCells[1],
    `BATCH_TRIALS = "16"\n`,
    patchCompile,
    codeCells[3],
    codeCells[4],
    codeCells[5],
  ].join('\n\n# ===== CELL =====\n\n');

  const pyFile = path.join(tmpDir, 'bench.py');
  fs.writeFileSync(pyFile, combinedPy, 'utf-8');
  execSync(`python3 "${pyFile}"`, {
    cwd: tmpDir,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const jsonFile = fs
    .readdirSync(tmpDir)
    .find((f) => f.startsWith('flappy-neurolab-colab-dataset-') && f.endsWith('.json'));
  if (!jsonFile) throw new Error(`Missing dataset for ${label}`);
  const parsed = JSON.parse(fs.readFileSync(path.join(tmpDir, jsonFile), 'utf-8'));
  fs.rmSync(tmpDir, { recursive: true, force: true });

  return {
    trials: parsed.trials as ResearchTrialResult[],
    wallSec: parsed.colabMeta?.wallSec ?? 0,
    ticksMps: parsed.colabMeta?.ticksMPerSec ?? 0,
  };
}

function groupSummary(
  trials: ResearchTrialResult[],
  keyFn: (t: ResearchTrialResult) => string
) {
  const map = new Map<
    string,
    { n: number; minSum: number; meanSum: number; bestMin: number; bestMean: number; msSum: number }
  >();
  for (const t of trials) {
    const k = keyFn(t);
    const cur = map.get(k) ?? { n: 0, minSum: 0, meanSum: 0, bestMin: 0, bestMean: 0, msSum: 0 };
    cur.n += 1;
    cur.minSum += t.minSeedScore;
    cur.meanSum += t.meanSeedScore;
    if (t.minSeedScore > cur.bestMin) cur.bestMin = t.minSeedScore;
    if (t.meanSeedScore > cur.bestMean) cur.bestMean = t.meanSeedScore;
    cur.msSum += t.durationMs;
    map.set(k, cur);
  }
  return Array.from(map.entries())
    .map(([k, v]) => ({
      key: k,
      n: v.n,
      avgMin: Number((v.minSum / v.n).toFixed(1)),
      avgMean: Number((v.meanSum / v.n).toFixed(1)),
      bestMin: v.bestMin,
      bestMean: Number(v.bestMean.toFixed(1)),
      avgMs: Math.round(v.msSum / v.n),
    }))
    .sort((a, b) => b.avgMean - a.avgMean || b.bestMin - a.bestMin);
}

const SENSORS_5: SensorFeatureId[] = ['VEL_VY', 'PIPE_DX', 'TOP_CLEAR', 'BOT_CLEAR', 'PIPE_VY'];
const SENSORS_6: SensorFeatureId[] = ['VEL_VY', 'PIPE_DX', 'TOP_CLEAR', 'BOT_CLEAR', 'PIPE_VY', 'NEXT_PIPE_DY'];

const BASE: ResearchSweepConfig = {
  algorithms: ['DE'],
  difficulties: ['MOVING_GAPS', 'INSANE'],
  inputFeatureSets: [SENSORS_5],
  architectures: ['RESIDUAL_SKIP'],
  weightPrecisions: ['FP32'],
  topologies: [[4, 4]],
  maxParameters: 180,
  populationSizes: [120],
  mutationRates: [0.16],
  mutationStrengths: [0.35],
  maxGenerations: 45,
  stagnationLimit: 18,
  targetPipeCap: 300,
  verificationSeeds: 4,
  workerThreads: 0,
  shapedFitness: true,
  curriculumLearning: false,
  reasoningSteps: 3,
  smartPrune: true,
};

async function main() {
  const tAll0 = performance.now();

  // B1: All 8 Optimizers head-to-head on MOVING_GAPS + INSANE × [RESIDUAL_SKIP, SELECTIVE_SSM]
  console.log('=== BENCHMARK 1: All 8 Optimizers (DE/GA/PSO/CMA/CEM/AES/NES/AdamES) ===');
  const b1 = runNativeBatch('B1-Optimizers', {
    ...BASE,
    algorithms: ['GA', 'DE', 'PSO', 'CMA_HYBRID', 'CEM', 'ADAPTIVE_ES', 'NATURAL_ES', 'ADAM_ES'] as LearningAlgorithm[],
    difficulties: ['MOVING_GAPS', 'INSANE'] as DifficultyPreset[],
    architectures: ['RESIDUAL_SKIP', 'SELECTIVE_SSM'] as NetworkArchitecture[],
    topologies: [[4], [4, 4]],
  });
  console.log(`  Ran ${b1.trials.length} trials in ${b1.wallSec.toFixed(1)}s (${b1.ticksMps.toFixed(1)} M t/s)`);
  for (const r of groupSummary(b1.trials, (t) => t.algorithm)) {
    console.log(
      `  ${r.key.padEnd(12)} | AvgMean=${String(r.avgMean).padStart(5)} | AvgMin=${String(r.avgMin).padStart(5)} | BestMin=${String(r.bestMin).padStart(3)} | BestMean=${String(r.bestMean).padStart(5)} | ${r.avgMs}ms/tr`
    );
  }

  // B2: All 9 Architectures head-to-head on MOVING_GAPS + INSANE + TURBULENCE_EXTREME
  console.log('\n=== BENCHMARK 2: All 9 Architectures on Frontier (DE + GA, [4] & [4,4]) ===');
  const b2 = runNativeBatch('B2-Architectures', {
    ...BASE,
    algorithms: ['DE', 'GA'],
    difficulties: ['MOVING_GAPS', 'INSANE', 'TURBULENCE_EXTREME'],
    architectures: [...ALL_ARCHITECTURES],
    topologies: [[4], [4, 4]],
    maxParameters: 220,
  });
  console.log(`  Ran ${b2.trials.length} trials in ${b2.wallSec.toFixed(1)}s (${b2.ticksMps.toFixed(1)} M t/s)`);
  for (const r of groupSummary(b2.trials, (t) => t.architecture ?? 'MLP')) {
    console.log(
      `  ${r.key.padEnd(16)} | AvgMean=${String(r.avgMean).padStart(5)} | AvgMin=${String(r.avgMin).padStart(5)} | BestMin=${String(r.bestMin).padStart(3)} | BestMean=${String(r.bestMean).padStart(5)} | ${r.avgMs}ms/tr`
    );
  }

  // B3: Topologies (Shallow vs Bottleneck vs Deep Wide) on MOVING_GAPS + INSANE
  console.log('\n=== BENCHMARK 3: Topology Sweet Spot ([4], [8], [2,4], [4,2], [4,4], [6,4], [8,4]) ===');
  const b3 = runNativeBatch('B3-Topologies', {
    ...BASE,
    algorithms: ['DE', 'GA'],
    difficulties: ['MOVING_GAPS', 'INSANE'],
    architectures: ['RESIDUAL_SKIP', 'SELECTIVE_SSM', 'LATENT_ROLLOUT'],
    topologies: [[4], [8], [2, 4], [4, 2], [4, 4], [6, 4], [8, 4]],
    maxParameters: 260,
  });
  console.log(`  Ran ${b3.trials.length} trials in ${b3.wallSec.toFixed(1)}s (${b3.ticksMps.toFixed(1)} M t/s)`);
  for (const r of groupSummary(b3.trials, (t) => `[${t.topology.join(',')}]`)) {
    console.log(
      `  ${r.key.padEnd(10)} | AvgMean=${String(r.avgMean).padStart(5)} | AvgMin=${String(r.avgMin).padStart(5)} | BestMin=${String(r.bestMin).padStart(3)} | BestMean=${String(r.bestMean).padStart(5)} | ${r.avgMs}ms/tr`
    );
  }

  // B4: Hyperparameter & Sensor A/B (Pop 100/150/250 × σ 0.25/0.35/0.50 × 5-in vs 6-in+N2Y × FP32 vs INT4)
  console.log('\n=== BENCHMARK 4: Sensors (±N2Y) × Precision (FP32/INT4) × Sigma (0.25/0.35/0.50) ===');
  const b4 = runNativeBatch('B4-Hypers', {
    ...BASE,
    algorithms: ['DE', 'GA'],
    difficulties: ['MOVING_GAPS', 'INSANE'],
    architectures: ['RESIDUAL_SKIP', 'SELECTIVE_SSM'],
    inputFeatureSets: [SENSORS_5, SENSORS_6],
    weightPrecisions: ['FP32', 'INT4'] as WeightPrecision[],
    topologies: [[4, 4]],
    mutationStrengths: [0.25, 0.35, 0.5],
  });
  console.log(`  Ran ${b4.trials.length} trials in ${b4.wallSec.toFixed(1)}s (${b4.ticksMps.toFixed(1)} M t/s)`);
  console.log('  -- By Sensor Set --');
  for (const r of groupSummary(b4.trials, (t) => `${t.inputCount}-in (${t.inputSetLabel})`)) {
    console.log(`    ${r.key.padEnd(34)} | AvgMean=${r.avgMean} | AvgMin=${r.avgMin} | BestMin=${r.bestMin}`);
  }
  console.log('  -- By Weight Precision --');
  for (const r of groupSummary(b4.trials, (t) => t.weightPrecision ?? 'FP32')) {
    console.log(`    ${r.key.padEnd(10)} | AvgMean=${r.avgMean} | AvgMin=${r.avgMin} | BestMin=${r.bestMin}`);
  }
  console.log('  -- By Mutation Strength (sigma) --');
  for (const r of groupSummary(b4.trials, (t) => `sigma=${t.mutationStrength}`)) {
    console.log(`    ${r.key.padEnd(12)} | AvgMean=${r.avgMean} | AvgMin=${r.avgMin} | BestMin=${r.bestMin}`);
  }

  // Cleanup cached .so
  const cachedLib = path.join(os.tmpdir(), 'neurolab_prebench_lib.so');
  if (fs.existsSync(cachedLib)) fs.unlinkSync(cachedLib);

  console.log(`\nTotal Pre-Colab Benchmark Suite Time: ${((performance.now() - tAll0) / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
