#!/usr/bin/env tsx
/**
 * Flappy NeuroLab — GitHub Research Data Lake Aggregator
 *
 * Scans `research-data/runs/**\/*.{jsonl,json}`, deduplicates all trials globally
 * by `trialSignature` (retaining champions & best verified scores), runs full
 * scientific meta-analysis, and writes:
 *   - research-data/LEADERBOARD.md          (GitHub-rendered executive summary)
 *   - research-data/ai-delta-digest.md      (~2k-token LLM delta packet)
 *   - research-data/llm-meta-dossier.md     (Full multi-run scientific dossier)
 *   - public/data/research-lake.json        (Static snapshot served by GitHub Pages)
 *
 * Usage:
 *   npm run lake:sync
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  calculateTopologyBreakdown,
  estimateArchitectureFlops,
  formatTopologyLabel,
  getTrialComputeProfile,
} from '../src/engine/neuralNetwork';
import { CORE_DIFFICULTIES } from '../src/engine/physics';
import {
  buildLlmMetaPack,
  computeResearchFindings,
} from '../src/engine/researchReport';
import { getResultSignature } from '../src/engine/researchStorage';
import {
  ALL_SENSOR_FEATURES,
  formatInputSubsetLabel,
  normalizeInputFeatures,
} from '../src/engine/sensors';
import type {
  DifficultyPreset,
  LearningAlgorithm,
  NetworkArchitecture,
  ResearchSweepConfig,
  ResearchTrialResult,
  SensorFeatureId,
  WeightPrecision,
} from '../src/engine/types';

const ROOT = process.cwd();
const RUNS_DIR = path.join(ROOT, 'research-data', 'runs');
const DATA_DIR = path.join(ROOT, 'research-data');
const PUBLIC_DATA_DIR = path.join(ROOT, 'public', 'data');

function collectRunFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectRunFiles(full));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.jsonl') || entry.name.endsWith('.json')) &&
      entry.name !== 'meta.json'
    ) {
      results.push(full);
    }
  }
  return results.sort();
}

function hydrateRecord(
  raw: Record<string, unknown>,
  idx: number
): ResearchTrialResult | null {
  if (!raw || typeof raw !== 'object') return null;
  // Skip metadata-only JSON files that lack trial structure
  if (
    raw.minSeedScore === undefined &&
    raw.bestScore === undefined &&
    raw.algorithm === undefined
  ) {
    return null;
  }

  const inputFeatures = normalizeInputFeatures(
    Array.isArray(raw.inputFeatures)
      ? (raw.inputFeatures as SensorFeatureId[])
      : undefined
  );
  const topology = Array.isArray(raw.topology)
    ? (raw.topology as number[])
    : [4];
  const arch = (raw.architecture as NetworkArchitecture) ?? 'MLP';
  const b = calculateTopologyBreakdown(topology, inputFeatures.length, 1, arch);
  const topoLabel =
    (typeof raw.topologyLabel === 'string' && raw.topologyLabel) ||
    formatTopologyLabel(topology, inputFeatures.length);
  const depth = topology.length;
  let maxWidth = 0;
  for (let i = 0; i < topology.length; i++) {
    if (topology[i] > maxWidth) maxWidth = topology[i];
  }

  let policyProfile = raw.policyProfile as ResearchTrialResult['policyProfile'];
  if (
    !policyProfile &&
    raw.sensorImportance &&
    typeof raw.sensorImportance === 'object'
  ) {
    const mapObj = raw.sensorImportance as Record<string, number>;
    const impVec = ALL_SENSOR_FEATURES.map((f) => Number(mapObj[f] ?? 0));
    policyProfile = {
      sensorImportance: impVec,
      sensorSignedSensitivity: impVec.map(() => 0),
      dominantSensor:
        typeof raw.dominantSensor === 'string'
          ? raw.dominantSensor
          : 'Pipe 1 Bot',
      weightL2Norm: 4.5,
      weightMeanAbs: 0.42,
      sparsityRatio: 0.25,
      flapRateCanonical: 0.35,
      linearFormula: null,
    };
  }

  const trial: ResearchTrialResult = {
    id: String(raw.id ?? `lake-${idx}`),
    trialSignature:
      typeof raw.signature === 'string'
        ? raw.signature
        : typeof raw.trialSignature === 'string'
          ? raw.trialSignature
          : undefined,
    algorithm: (raw.algorithm as LearningAlgorithm) ?? 'DE',
    difficulty: (raw.difficulty as DifficultyPreset) ?? 'MEDIUM',
    topology,
    topologyLabel: topoLabel,
    inputFeatures,
    inputCount: Number(raw.inputCount ?? inputFeatures.length),
    inputSetLabel:
      typeof raw.inputSetLabel === 'string'
        ? raw.inputSetLabel
        : formatInputSubsetLabel(inputFeatures),
    architecture: arch,
    weightPrecision: (raw.weightPrecision as WeightPrecision) ?? 'FP32',
    evolutionTopologyMode:
      (raw.evolutionTopologyMode as ResearchTrialResult['evolutionTopologyMode']) ??
      'SINGLE_SPECIES',
    computeProfile:
      (raw.computeProfile as ResearchTrialResult['computeProfile']) ??
      getTrialComputeProfile(
        arch,
        (raw.evolutionTopologyMode as ResearchTrialResult['evolutionTopologyMode']) ??
          'SINGLE_SPECIES'
      ),
    meanFlopsPerFrame:
      typeof raw.meanFlopsPerFrame === 'number'
        ? raw.meanFlopsPerFrame
        : typeof raw.mean_flops_per_frame === 'number'
          ? raw.mean_flops_per_frame
          : estimateArchitectureFlops(
              topology,
              inputFeatures.length,
              arch,
              Number(raw.reasoningSteps ?? 1)
            ),
    computeEfficiencyScore:
      typeof raw.computeEfficiencyScore === 'number'
        ? raw.computeEfficiencyScore
        : undefined,
    islandSummary:
      (raw.islandSummary as ResearchTrialResult['islandSummary']) ?? undefined,
    morphogenesisMode:
      (raw.morphogenesisMode as ResearchTrialResult['morphogenesisMode']) ??
      'STATIC',
    morphogenesisSummary:
      (raw.morphogenesisSummary as ResearchTrialResult['morphogenesisSummary']) ??
      undefined,
    maxWidth: Number(raw.maxWidth ?? maxWidth),
    hiddenNodes: Number(raw.hiddenNodes ?? b.hiddenNeuronCount),
    hiddenNeuronCount: Number(raw.hiddenNeuronCount ?? b.hiddenNeuronCount),
    weightCount: Number(raw.weightCount ?? b.weightCount),
    biasCount: Number(raw.biasCount ?? b.biasCount),
    depth: Number(raw.depth ?? depth),
    parameterCount: Number(raw.parameterCount ?? b.parameterCount),
    populationSize: Number(raw.populationSize ?? 120),
    mutationRate: Number(raw.mutationRate ?? 0.16),
    mutationStrength: Number(raw.mutationStrength ?? 0.35),
    targetPipeCap: Number(raw.targetPipeCap ?? 500),
    verificationSeeds: Number(raw.verificationSeeds ?? 5),
    reasoningSteps: Number(raw.reasoningSteps ?? 1),
    generationsRun: Number(raw.generationsRun ?? 40),
    bestScore: Number(raw.bestScore ?? raw.minSeedScore ?? 0),
    bestFitness: Number(raw.bestFitness ?? Number(raw.bestScore ?? 0) * 10),
    finalAvgScore: Number(raw.finalAvgScore ?? raw.meanSeedScore ?? 0),
    solved: Boolean(raw.solved ?? raw.verifiedPerfect ?? false),
    generationsToSolve:
      typeof raw.generationsToSolve === 'number'
        ? raw.generationsToSolve
        : null,
    timeToPerfectionMs:
      typeof raw.timeToPerfectionMs === 'number'
        ? raw.timeToPerfectionMs
        : null,
    totalTicksEvaluated: Number(raw.totalTicksEvaluated ?? 50000),
    birdEpisodesEvaluated:
      typeof raw.birdEpisodes === 'number'
        ? raw.birdEpisodes
        : (raw.birdEpisodesEvaluated as number | undefined),
    normalizedComputeMs:
      typeof raw.normalizedComputeMs === 'number'
        ? raw.normalizedComputeMs
        : undefined,
    ticksPerSecond: Number(raw.ticksPerSecond ?? 500000),
    minSeedScore: Number(raw.minSeedScore ?? 0),
    meanSeedScore: Number(raw.meanSeedScore ?? raw.minSeedScore ?? 0),
    seedScores: Array.isArray(raw.seedScores)
      ? (raw.seedScores as number[])
      : [Number(raw.minSeedScore ?? 0)],
    verifiedPerfect: Boolean(raw.verifiedPerfect ?? false),
    generalizationRatio: Number(raw.generalizationRatio ?? 0.9),
    knowledgeDensity: Number(raw.knowledgeDensity ?? 1),
    pipesPerBit:
      typeof raw.pipesPerBit === 'number' ? raw.pipesPerBit : undefined,
    durationMs: Number(raw.durationMs ?? 250),
    stoppedReason:
      (raw.stoppedReason as ResearchTrialResult['stoppedReason']) ?? 'MAX_GENS',
    bestBrain:
      raw.bestBrain && typeof raw.bestBrain === 'object'
        ? (raw.bestBrain as ResearchTrialResult['bestBrain'])
        : null,
    scoreCurve: Array.isArray(raw.scoreCurve)
      ? (raw.scoreCurve as number[])
      : [0, Number(raw.minSeedScore ?? 0)],
    policyProfile,
    failureAutopsy:
      (raw.failureAutopsy as ResearchTrialResult['failureAutopsy']) ??
      undefined,
    reasoningTelemetry:
      (raw.reasoningTelemetry as ResearchTrialResult['reasoningTelemetry']) ??
      undefined,
    learningDynamic:
      (raw.learningDynamic as ResearchTrialResult['learningDynamic']) ??
      undefined,
  };

  trial.trialSignature = getResultSignature(trial);
  return trial;
}

function loadTrialsFromFile(filePath: string): ResearchTrialResult[] {
  const rawText = fs.readFileSync(filePath, 'utf-8').trim();
  if (!rawText) return [];
  const out: ResearchTrialResult[] = [];

  if (
    filePath.endsWith('.jsonl') ||
    (!rawText.startsWith('{') && !rawText.startsWith('['))
  ) {
    const lines = rawText.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      try {
        const obj = JSON.parse(line) as Record<string, unknown>;
        const hydrated = hydrateRecord(obj, i);
        if (hydrated) out.push(hydrated);
      } catch {
        // Ignore malformed single line
      }
    }
    return out;
  }

  try {
    const parsed = JSON.parse(rawText) as
      | Record<string, unknown>[]
      | { trials?: Record<string, unknown>[]; champions?: Record<string, unknown>[] };
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.trials)
        ? parsed.trials
        : Array.isArray(parsed.champions)
          ? parsed.champions
          : [];
    for (let i = 0; i < list.length; i++) {
      const hydrated = hydrateRecord(list[i], i);
      if (hydrated) out.push(hydrated);
    }
  } catch {
    // Ignore malformed JSON file
  }
  return out;
}

function pickBetterTrial(
  existing: ResearchTrialResult,
  incoming: ResearchTrialResult
): ResearchTrialResult {
  if (incoming.verifiedPerfect && !existing.verifiedPerfect) return incoming;
  if (existing.verifiedPerfect && !incoming.verifiedPerfect) {
    return existing.bestBrain || !incoming.bestBrain
      ? existing
      : { ...existing, bestBrain: incoming.bestBrain };
  }
  if (incoming.minSeedScore > existing.minSeedScore) return incoming;
  if (
    incoming.minSeedScore === existing.minSeedScore &&
    incoming.meanSeedScore > existing.meanSeedScore
  ) {
    return incoming;
  }
  if (!existing.bestBrain && incoming.bestBrain) {
    return { ...existing, bestBrain: incoming.bestBrain };
  }
  return existing;
}

function main(): void {
  fs.mkdirSync(RUNS_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });

  const files = collectRunFiles(RUNS_DIR);
  const runFolders = new Set<string>();
  const deduped = new Map<string, ResearchTrialResult>();
  let rawLoadedCount = 0;

  for (const filePath of files) {
    const rel = path.relative(RUNS_DIR, filePath);
    const folder = rel.includes(path.sep) ? rel.split(path.sep)[0] : 'root';
    runFolders.add(folder);

    const fileTrials = loadTrialsFromFile(filePath);
    rawLoadedCount += fileTrials.length;
    for (const trial of fileTrials) {
      const sig = getResultSignature(trial);
      const prev = deduped.get(sig);
      deduped.set(sig, prev ? pickBetterTrial(prev, trial) : trial);
    }
  }

  const allTrials = Array.from(deduped.values());
  const nowIso = new Date().toISOString();

  // Build synthetic protocol covering all discovered dimensions
  const algorithms = Array.from(new Set(allTrials.map((t) => t.algorithm)));
  const difficulties = Array.from(new Set(allTrials.map((t) => t.difficulty)));
  const architectures = Array.from(
    new Set(allTrials.map((t) => t.architecture ?? 'MLP'))
  );
  const weightPrecisions = Array.from(
    new Set(allTrials.map((t) => t.weightPrecision ?? 'FP32'))
  );
  const topoMap = new Map<string, number[]>();
  const featMap = new Map<string, SensorFeatureId[]>();
  for (const t of allTrials) {
    topoMap.set(t.topology.join('-'), t.topology);
    const feats = normalizeInputFeatures(t.inputFeatures);
    featMap.set(feats.join(','), feats);
  }

  const protocol: ResearchSweepConfig = {
    algorithms: algorithms.length > 0 ? algorithms : ['DE', 'CMA_HYBRID'],
    difficulties: difficulties.length > 0 ? difficulties : [...CORE_DIFFICULTIES],
    topologies: topoMap.size > 0 ? Array.from(topoMap.values()) : [[4]],
    inputFeatureSets:
      featMap.size > 0 ? Array.from(featMap.values()) : [[...ALL_SENSOR_FEATURES]],
    architectures: architectures.length > 0 ? architectures : ['MLP'],
    weightPrecisions: weightPrecisions.length > 0 ? weightPrecisions : ['FP32'],
    populationSizes: [120],
    mutationRates: [0.16],
    mutationStrengths: [0.35],
    maxGenerations: 120,
    stagnationLimit: 32,
    targetPipeCap: allTrials[0]?.targetPipeCap ?? 500,
    verificationSeeds: allTrials[0]?.verificationSeeds ?? 5,
    workerThreads: 0,
  };

  if (allTrials.length === 0) {
    const emptyMd = [
      '# Flappy NeuroLab — GitHub Research Data Lake',
      '',
      `_Last synced: ${nowIso}_`,
      '',
      'No runs imported yet. Drop any exported `trials.jsonl` or `dataset.json` into `research-data/runs/<YYYY-MM-DD>-<label>/` and push to GitHub — Actions will automatically deduplicate, analyze, and publish the global leaderboard here and on GitHub Pages.',
      '',
    ].join('\n');

    fs.writeFileSync(path.join(DATA_DIR, 'LEADERBOARD.md'), emptyMd, 'utf-8');
    fs.writeFileSync(path.join(DATA_DIR, 'ai-delta-digest.md'), emptyMd, 'utf-8');
    fs.writeFileSync(path.join(DATA_DIR, 'llm-meta-dossier.md'), emptyMd, 'utf-8');
    fs.writeFileSync(
      path.join(PUBLIC_DATA_DIR, 'research-lake.json'),
      JSON.stringify(
        {
          schema: 'flappy-neurolab-lake-v1',
          updatedAt: nowIso,
          runCount: 0,
          rawTrialCount: 0,
          totalTrials: 0,
          totalPerfect: 0,
          protocol,
          trials: [],
        },
        null,
        2
      ) + '\n',
      'utf-8'
    );
    console.log('[lake:sync] Research lake is currently empty (0 runs). Wrote clean baseline manifests.');
    return;
  }

  const findings = computeResearchFindings(allTrials, protocol);
  const pack = buildLlmMetaPack(allTrials, protocol, findings);

  // Compact trials for GitHub Pages static JSON: keep full bestBrain only for bucket champions
  const bucketBest = new Map<string, number>();
  for (const t of allTrials) {
    const key = `${t.difficulty}|${t.architecture ?? 'MLP'}`;
    if (t.minSeedScore > (bucketBest.get(key) ?? -1)) {
      bucketBest.set(key, t.minSeedScore);
    }
  }
  const keptBrainBuckets = new Set<string>();
  const compactTrials = allTrials.map((t) => {
    const key = `${t.difficulty}|${t.architecture ?? 'MLP'}`;
    const keepBrain =
      Boolean(t.bestBrain) &&
      t.minSeedScore >= (bucketBest.get(key) ?? 0) &&
      !keptBrainBuckets.has(key);
    if (keepBrain) keptBrainBuckets.add(key);
    return {
      ...t,
      bestBrain: keepBrain ? t.bestBrain : null,
      scoreCurve:
        t.scoreCurve && t.scoreCurve.length > 16
          ? [t.scoreCurve[0], t.scoreCurve[Math.floor(t.scoreCurve.length / 2)], t.scoreCurve[t.scoreCurve.length - 1]]
          : t.scoreCurve,
    };
  });

  const topRows = [...allTrials]
    .sort((a, b) => {
      if (b.verifiedPerfect !== a.verifiedPerfect) {
        return Number(b.verifiedPerfect) - Number(a.verifiedPerfect);
      }
      if (b.minSeedScore !== a.minSeedScore) return b.minSeedScore - a.minSeedScore;
      return a.parameterCount - b.parameterCount;
    })
    .slice(0, 25);

  const leaderboardMd = [
    '# Flappy NeuroLab — Global Research Data Lake Leaderboard',
    '',
    `- **Last synced**: ${nowIso}`,
    `- **Ingested run folders**: ${runFolders.size} (${files.length} files, ${rawLoadedCount.toLocaleString()} raw rows → **${allTrials.length.toLocaleString()} unique deduplicated trials**)`,
    `- **Verified Perfect (f64 audit)**: **${findings.totalPerfect.toLocaleString()}** (${((findings.totalPerfect / Math.max(1, findings.totalTrials)) * 100).toFixed(1)}%)`,
    `- **Pareto Frontier Points**: ${findings.paretoFrontier.length}`,
    '',
    '## Top 25 Verified Trials (Ranked by Perfect → Min-Seed Score → Parameter Efficiency)',
    '',
    '| # | Scenario | Arch | Optimizer | Topology | Sensors | Params | Min Seed | Mean Seed | Perfect |',
    '|---:|---|---|---|---|---|---:|---:|---:|:---:|',
    ...topRows.map(
      (t, idx) =>
        `| ${idx + 1} | ${t.difficulty} | ${t.architecture ?? 'MLP'} | ${t.algorithm} | \`${t.topologyLabel}\` | ${t.inputSetLabel ?? `${t.inputCount}s`} | ${t.parameterCount} | ${t.minSeedScore} | ${t.meanSeedScore.toFixed(1)} | ${t.verifiedPerfect ? 'YES' : '—'} |`
    ),
    '',
    '---',
    '',
    '> Full AI-ready synthesis files in this folder: [`ai-delta-digest.md`](./ai-delta-digest.md) (~2k tokens) and [`llm-meta-dossier.md`](./llm-meta-dossier.md).',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(DATA_DIR, 'LEADERBOARD.md'), leaderboardMd, 'utf-8');
  fs.writeFileSync(path.join(DATA_DIR, 'ai-delta-digest.md'), pack.aiDeltaMd, 'utf-8');
  fs.writeFileSync(path.join(DATA_DIR, 'llm-meta-dossier.md'), pack.metaDossierMd, 'utf-8');
  fs.writeFileSync(
    path.join(PUBLIC_DATA_DIR, 'research-lake.json'),
    JSON.stringify(
      {
        schema: 'flappy-neurolab-lake-v1',
        updatedAt: nowIso,
        runCount: runFolders.size,
        rawTrialCount: rawLoadedCount,
        totalTrials: allTrials.length,
        totalPerfect: findings.totalPerfect,
        protocol,
        trials: compactTrials,
      },
      null,
      2
    ) + '\n',
    'utf-8'
  );

  console.log(
    `[lake:sync] Synced ${runFolders.size} runs (${allTrials.length} unique trials, ${findings.totalPerfect} perfect) -> research-data/{LEADERBOARD,ai-delta-digest,llm-meta-dossier}.md + public/data/research-lake.json`
  );
}

main();
