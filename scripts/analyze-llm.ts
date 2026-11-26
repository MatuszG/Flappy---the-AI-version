/**
 * Flappy NeuroLab — LLM Meta-Analysis CLI
 *
 * Emits compact, token-efficient research dossiers & structured streams for LLMs:
 *   - llm-meta-dossier.md         (Full scientific Markdown dossier incl. 12-sensor Why & When + Morphogenesis A/B + Scenario Proofs)
 *   - ai-delta-digest.md          (Ultra-compact ~2k-token delta packet)
 *   - trials.jsonl                (Streamable per-trial JSONL without weight blobs)
 *   - sensor-ablation-matrix.json (Structured 12-sensor discovery, Morphogenesis & solvability proofs)
 *
 * Usage:
 *   npm run analyze:llm -- --demo --out-dir ./analysis-out
 *   npm run analyze:llm -- --input path/to/export.json --out-dir ./analysis-out
 *   npm run analyze:llm -- --input path/to/trials.jsonl --out-dir ./analysis-out
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  calculateTopologyBreakdown,
  estimateArchitectureFlops,
  formatTopologyLabel,
  getTrialComputeProfile,
} from '../src/engine/neuralNetwork';
import {
  CORE_DIFFICULTIES,
  verifyScenarioSolvability,
} from '../src/engine/physics';
import {
  buildLlmMetaPack,
  computeResearchFindings,
} from '../src/engine/researchReport';
import {
  ALL_SENSOR_FEATURES,
  formatInputSubsetLabel,
  INPUT_SUBSET_PRESETS,
  normalizeInputFeatures,
} from '../src/engine/sensors';
import { resolveEnvironment } from '../src/engine/simulation';
import type {
  DifficultyPreset,
  LearningAlgorithm,
  NetworkArchitecture,
  ResearchSweepConfig,
  ResearchTrialResult,
  SensorFeatureId,
} from '../src/engine/types';

function printUsage(): void {
  console.log(
    [
      'Flappy NeuroLab — LLM Meta-Analysis CLI',
      '',
      'Options:',
      '  --input <file>     Path to Research Lab JSON export or .jsonl trials file',
      '  --out-dir <dir>    Output directory (default: ./analysis-out)',
      '  --demo             Run on synthetic multi-tier 12-sensor + Morphogenesis demo dataset',
      '  --help             Show this help message',
    ].join('\n')
  );
}

function parseArgs(argv: string[]): {
  inputPath?: string;
  outDir: string;
  demo: boolean;
  help: boolean;
} {
  let inputPath: string | undefined;
  let outDir = './analysis-out';
  let demo = false;
  let help = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') help = true;
    else if (a === '--demo') demo = true;
    else if (a === '--input' && argv[i + 1]) {
      inputPath = argv[++i];
    } else if (a.startsWith('--input=')) {
      inputPath = a.slice('--input='.length);
    } else if (a === '--out-dir' && argv[i + 1]) {
      outDir = argv[++i];
    } else if (a.startsWith('--out-dir=')) {
      outDir = a.slice('--out-dir='.length);
    }
  }
  return { inputPath, outDir, demo, help };
}

function hydrateTrialFromRecord(raw: Record<string, unknown>, idx: number): ResearchTrialResult {
  const inputFeatures = normalizeInputFeatures(
    Array.isArray(raw.inputFeatures) ? (raw.inputFeatures as SensorFeatureId[]) : undefined
  );
  const topology = Array.isArray(raw.topology) ? (raw.topology as number[]) : [4];
  const arch = (raw.architecture as NetworkArchitecture) ?? 'MLP';
  const b = calculateTopologyBreakdown(topology, inputFeatures.length, 1, arch);
  const topoLabel =
    (typeof raw.topologyLabel === 'string' && raw.topologyLabel) ||
    formatTopologyLabel(topology, inputFeatures.length);
  const depth = topology.length;
  const maxWidth = depth > 0 ? Math.max(...topology) : 0;

  let policyProfile = raw.policyProfile as ResearchTrialResult['policyProfile'];
  if (!policyProfile && raw.sensorImportance && typeof raw.sensorImportance === 'object') {
    const mapObj = raw.sensorImportance as Record<string, number>;
    const impVec: number[] = ALL_SENSOR_FEATURES.map((f) => Number(mapObj[f] ?? 0));
    policyProfile = {
      sensorImportance: impVec,
      sensorSignedSensitivity: impVec.map(() => 0),
      dominantSensor:
        typeof raw.dominantSensor === 'string' ? raw.dominantSensor : 'Pipe 1 Bot',
      weightL2Norm: 4.5,
      weightMeanAbs: 0.42,
      sparsityRatio: 0.25,
      flapRateCanonical: 0.35,
      linearFormula: null,
    };
  }

  return {
    id: String(raw.id ?? `trial-${idx}`),
    trialSignature: typeof raw.signature === 'string' ? raw.signature : (raw.trialSignature as string | undefined),
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
    weightPrecision: (raw.weightPrecision as ResearchTrialResult['weightPrecision']) ?? 'FP32',
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
          : estimateArchitectureFlops(topology, inputFeatures.length, arch, Number(raw.reasoningSteps ?? 3)),
    computeEfficiencyScore:
      typeof raw.computeEfficiencyScore === 'number'
        ? raw.computeEfficiencyScore
        : typeof raw.compute_efficiency_score === 'number'
          ? raw.compute_efficiency_score
          : undefined,
    islandSummary: (raw.islandSummary as ResearchTrialResult['islandSummary']) ?? undefined,
    morphogenesisMode:
      (raw.morphogenesisMode as ResearchTrialResult['morphogenesisMode']) ?? 'STATIC',
    morphogenesisSummary:
      (raw.morphogenesisSummary as ResearchTrialResult['morphogenesisSummary']) ?? undefined,
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
      typeof raw.generationsToSolve === 'number' ? raw.generationsToSolve : null,
    timeToPerfectionMs:
      typeof raw.timeToPerfectionMs === 'number' ? raw.timeToPerfectionMs : null,
    totalTicksEvaluated: Number(raw.totalTicksEvaluated ?? 50000),
    birdEpisodesEvaluated:
      typeof raw.birdEpisodes === 'number'
        ? raw.birdEpisodes
        : (raw.birdEpisodesEvaluated as number | undefined),
    normalizedComputeMs:
      typeof raw.normalizedComputeMs === 'number' ? raw.normalizedComputeMs : undefined,
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
    bestBrain: null,
    scoreCurve: Array.isArray(raw.scoreCurve)
      ? (raw.scoreCurve as number[])
      : [0, Number(raw.minSeedScore ?? 0)],
    policyProfile,
    failureAutopsy:
      (raw.failureAutopsy as ResearchTrialResult['failureAutopsy']) ?? undefined,
    reasoningTelemetry:
      (raw.reasoningTelemetry as ResearchTrialResult['reasoningTelemetry']) ?? undefined,
    learningDynamic:
      (raw.learningDynamic as ResearchTrialResult['learningDynamic']) ?? undefined,
  };
}

function buildDemoDataset(): {
  protocol: ResearchSweepConfig;
  trials: ResearchTrialResult[];
} {
  const subsetIds = [
    'bot_1',
    'bot_dx_2',
    'dual_bot_4',
    'dual_geo_6',
    'dual_moving_8',
    'full_12',
  ];
  const inputFeatureSets = subsetIds
    .map((id) => INPUT_SUBSET_PRESETS.find((p) => p.id === id)?.features)
    .filter((f): f is SensorFeatureId[] => Boolean(f))
    .map((f) => [...f]);

  const protocol: ResearchSweepConfig = {
    algorithms: ['DE', 'CMA_HYBRID', 'GA'],
    difficulties: [...CORE_DIFFICULTIES],
    topologies: [[4], [6, 4]],
    inputFeatureSets,
    architectures: ['MLP', 'RESIDUAL_SKIP', 'PONDER_ACT', 'SELECTIVE_SSM', 'HYBRID_MOE'],
    weightPrecisions: ['FP32'],
    populationSizes: [120],
    mutationRates: [0.16],
    mutationStrengths: [0.35],
    maxGenerations: 80,
    stagnationLimit: 24,
    targetPipeCap: 500,
    verificationSeeds: 5,
    workerThreads: 0,
    morphogenesisMode: 'PAIRED_AB',
    reasoningSteps: 3,
    shapedFitness: true,
  };

  const trials: ResearchTrialResult[] = [];
  let idx = 0;
  for (const diff of CORE_DIFFICULTIES) {
    const isMoving = diff === 'HARD' || diff === 'INSANE';
    const isTurb = diff !== 'EASY';
    for (const feats of inputFeatureSets) {
      const hasDx = feats.includes('PIPE_DX');
      const hasTop = feats.includes('TOP_CLEAR');
      const hasPvy = feats.includes('PIPE_VY');
      const hasTtf = feats.includes('PIPE_TTF');
      const hasN2 =
        feats.includes('NEXT_BOT_CLEAR') || feats.includes('NEXT_PIPE_DX');
      for (const arch of protocol.architectures!) {
        for (const topo of protocol.topologies) {
          for (const mode of ['STATIC', 'GROWING'] as const) {
            const algo: LearningAlgorithm =
              arch === 'PONDER_ACT' || arch === 'HYBRID_MOE' ? 'CMA_HYBRID' : 'DE';
            const b = calculateTopologyBreakdown(topo, feats.length, 1, arch);
            let score = diff === 'EASY' ? 280 : diff === 'MEDIUM' ? 110 : diff === 'HARD' ? 48 : 24;
            if (hasDx) score += diff === 'EASY' ? 160 : 55;
            if (hasTop && isTurb) score += 35;
            if (hasN2) score += diff === 'EASY' ? 40 : 65;
            if (hasPvy) score += isMoving ? 95 : -10;
            if (hasTtf) score += isTurb ? 65 : 5;
            if (arch === 'PONDER_ACT' || arch === 'SELECTIVE_SSM') score += isMoving ? 45 : 15;
            if (arch === 'HYBRID_MOE') score += isMoving ? 70 : 10;
            if (mode === 'GROWING') score += Math.round(diff === 'INSANE' ? 68 : 42);
            const minScore = Math.max(4, Math.min(protocol.targetPipeCap, score));
            const verifiedPerfect = minScore >= protocol.targetPipeCap;
            const activeExperts =
              arch === 'HYBRID_MOE'
                ? isMoving
                  ? (['LTC_FLY', 'SELECTIVE_SSM'] as const)
                  : (['LTC_FLY'] as const)
                : undefined;
            const meanFlops = estimateArchitectureFlops(
              topo,
              feats.length,
              arch,
              3,
              activeExperts ? [...activeExperts] : undefined
            );
            const isIslandDemo = arch === 'HYBRID_MOE' && mode === 'GROWING' && isMoving;
            const evoMode = isIslandDemo ? 'ISLAND_SPECIATION' : 'SINGLE_SPECIES';
            const cProfile = getTrialComputeProfile(arch, evoMode);

            const impVec: number[] = ALL_SENSOR_FEATURES.map((f) => {
              if (!feats.includes(f)) return 0;
              if (f === 'BOT_CLEAR') return 36;
              if (f === 'PIPE_DX') return 22;
              if (f === 'PIPE_VY' && isMoving) return 18;
              if (f === 'PIPE_TTF' && isTurb) return 14;
              if (f === 'NEXT_BOT_CLEAR' || f === 'NEXT_TOP_CLEAR') return 11;
              return 7;
            });
            const impSum = Math.max(1, impVec.reduce((a, c) => a + c, 0));
            const normImp = impVec.map((v) => Number(((v / impSum) * 100).toFixed(1)));
            const domIdx = normImp.indexOf(Math.max(...normImp));
            const topoMaxWidth = topo.length > 0 ? Math.max(...topo) : 0;

            idx += 1;
            trials.push({
              id: `demo-${idx}`,
              algorithm: algo,
              difficulty: diff,
              topology: topo,
              topologyLabel: formatTopologyLabel(topo, feats.length),
              inputFeatures: feats,
              inputCount: feats.length,
              inputSetLabel: formatInputSubsetLabel(feats),
              architecture: arch,
              weightPrecision: 'FP32',
              evolutionTopologyMode: evoMode,
              computeProfile: cProfile,
              meanFlopsPerFrame: meanFlops,
              computeEfficiencyScore: Number((minScore / Math.max(0.01, meanFlops / 100)).toFixed(2)),
              islandSummary: isIslandDemo
                ? {
                    enabled: true,
                    rebalanceCount: 4,
                    winningSpecies: 'HYBRID_MOE',
                    finalShares: [],
                    allocationTimeline: [],
                  }
                : null,
              morphogenesisMode: mode,
              morphogenesisSummary:
                mode === 'GROWING'
                  ? {
                      initialActiveParams: Math.max(4, Math.round(b.parameterCount * 0.45)),
                      finalActiveParams: Math.max(4, Math.round(b.parameterCount * 0.84)),
                      ceilingParams: b.parameterCount,
                      prunedSynapses: 5,
                      growthEventsCount: 3,
                      pruneEventsCount: 1,
                      finalReasoningSteps: arch === 'PONDER_ACT' || arch === 'HYBRID_MOE' ? 3 : 1,
                      finalActiveSensors: feats.length,
                      finalHiddenCounts: topo,
                      eventTimeline: [],
                      avgFlopsPerFrame: meanFlops,
                      computeRoiScore: Number((((minScore * 12) / Math.max(1, meanFlops)) * 100).toFixed(2)),
                      ...(arch === 'HYBRID_MOE'
                        ? {
                            activeExperts: activeExperts ? [...activeExperts] : [],
                            rollbackCount: isMoving ? 1 : 2,
                            committedExpertsCount: isMoving ? 2 : 1,
                          }
                        : {}),
                    }
                  : undefined,
              maxWidth: topoMaxWidth,
              hiddenNodes: b.hiddenNeuronCount,
              hiddenNeuronCount: b.hiddenNeuronCount,
              weightCount: b.weightCount,
              biasCount: b.biasCount,
              depth: topo.length,
              parameterCount: b.parameterCount,
              populationSize: 120,
              mutationRate: 0.16,
              mutationStrength: 0.35,
              targetPipeCap: protocol.targetPipeCap,
              verificationSeeds: 5,
              reasoningSteps: arch === 'PONDER_ACT' ? 3 : 1,
              generationsRun: verifiedPerfect ? 34 : 80,
              bestScore: Math.min(protocol.targetPipeCap, minScore + 28),
              bestFitness: minScore * 12,
              finalAvgScore: Math.round(minScore * 0.78),
              solved: verifiedPerfect,
              generationsToSolve: verifiedPerfect ? 34 : null,
              timeToPerfectionMs: verifiedPerfect ? 420 : null,
              totalTicksEvaluated: 95000,
              birdEpisodesEvaluated: verifiedPerfect ? 4080 : 9600,
              normalizedComputeMs: Number(((95000 * b.parameterCount) / 10000).toFixed(1)),
              ticksPerSecond: 850000,
              minSeedScore: minScore,
              meanSeedScore: Math.min(protocol.targetPipeCap, minScore + 12),
              seedScores: [minScore, minScore + 8, minScore + 12, minScore + 15, minScore + 25].map((x) =>
                Math.min(protocol.targetPipeCap, x)
              ),
              verifiedPerfect,
              generalizationRatio: Number((minScore / Math.max(1, minScore + 24)).toFixed(2)),
              knowledgeDensity: Number((minScore / Math.max(1, b.parameterCount)).toFixed(2)),
              pipesPerBit: Number((minScore / Math.max(1, b.parameterCount * 32)).toFixed(4)),
              durationMs: 320,
              stoppedReason: verifiedPerfect ? 'PERFECT' : 'MAX_GENS',
              bestBrain: null,
              scoreCurve: [4, Math.round(minScore * 0.4), Math.round(minScore * 0.75), minScore],
              policyProfile: {
                sensorImportance: normImp,
                sensorSignedSensitivity: normImp.map(() => 0),
                dominantSensor: ALL_SENSOR_FEATURES[domIdx] ?? 'BOT_CLEAR',
                weightL2Norm: 5.2,
                weightMeanAbs: 0.44,
                sparsityRatio: mode === 'GROWING' ? 0.36 : 0.18,
                flapRateCanonical: 0.35,
                linearFormula: null,
              },
              failureAutopsy: verifiedPerfect
                ? undefined
                : {
                    totalDeaths: 5,
                    floorDeaths: 0,
                    ceilingDeaths: 0,
                    pipeTopDeaths: isMoving ? 3 : 2,
                    pipeBottomDeaths: isMoving ? 2 : 3,
                    avgDeathAbsVy: 4.8,
                    avgDeathGapErr: 21,
                    dominantFailure: isMoving ? 'PIPE_TOP' : 'PIPE_BOTTOM',
                    generalizationGap: 24,
                  },
              reasoningTelemetry:
                arch === 'PONDER_ACT'
                  ? {
                      avgPonderSteps: 1.9,
                      calmPonderSteps: 1.25,
                      dangerPonderSteps: 2.65,
                      system2Ratio: 0.42,
                      avgRolloutAdvantage: 0,
                      avgSsmGate: 0,
                    }
                  : undefined,
              learningDynamic: verifiedPerfect
                ? 'SMOOTH_CLIMB'
                : mode === 'GROWING'
                  ? 'PHASE_TRANSITION'
                  : 'PLATEAU',
            });
          }
        }
      }
    }
  }

  return { protocol, trials };
}

function loadInputFile(filePath: string): {
  protocol: ResearchSweepConfig;
  trials: ResearchTrialResult[];
} {
  const rawText = fs.readFileSync(filePath, 'utf-8').trim();
  const baseProtocol: ResearchSweepConfig = {
    algorithms: ['GA', 'DE', 'CMA_HYBRID'],
    difficulties: [...CORE_DIFFICULTIES],
    topologies: [[4]],
    inputFeatureSets: [[...ALL_SENSOR_FEATURES]],
    architectures: ['MLP'],
    weightPrecisions: ['FP32'],
    populationSizes: [120],
    mutationRates: [0.16],
    mutationStrengths: [0.35],
    maxGenerations: 120,
    stagnationLimit: 32,
    targetPipeCap: 500,
    verificationSeeds: 5,
    workerThreads: 0,
  };

  if (filePath.endsWith('.jsonl') || (!rawText.startsWith('{') && !rawText.startsWith('['))) {
    const rows = rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, i) => hydrateTrialFromRecord(JSON.parse(line) as Record<string, unknown>, i));
    const diffs = Array.from(new Set(rows.map((r) => r.difficulty)));
    return {
      protocol: {
        ...baseProtocol,
        difficulties: diffs.length > 0 ? diffs : baseProtocol.difficulties,
        targetPipeCap: rows[0]?.targetPipeCap ?? baseProtocol.targetPipeCap,
        verificationSeeds: rows[0]?.verificationSeeds ?? baseProtocol.verificationSeeds,
      },
      trials: rows,
    };
  }

  const parsed = JSON.parse(rawText) as
    | ResearchTrialResult[]
    | { protocol?: ResearchSweepConfig; trials?: Record<string, unknown>[] };

  if (Array.isArray(parsed)) {
    const trials = parsed.map((r, i) =>
      hydrateTrialFromRecord(r as unknown as Record<string, unknown>, i)
    );
    return { protocol: baseProtocol, trials };
  }

  const trials = Array.isArray(parsed.trials)
    ? parsed.trials.map((r, i) => hydrateTrialFromRecord(r, i))
    : [];
  const protocol: ResearchSweepConfig = parsed.protocol
    ? { ...baseProtocol, ...parsed.protocol }
    : baseProtocol;
  return { protocol, trials };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.demo && !args.inputPath)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }

  const { protocol, trials } = args.demo
    ? buildDemoDataset()
    : loadInputFile(path.resolve(args.inputPath!));

  const findings = computeResearchFindings(trials, protocol);
  const pack = buildLlmMetaPack(trials, protocol, findings);

  const outDirAbs = path.resolve(args.outDir);
  fs.mkdirSync(outDirAbs, { recursive: true });

  const dossierPath = path.join(outDirAbs, 'llm-meta-dossier.md');
  const deltaPath = path.join(outDirAbs, 'ai-delta-digest.md');
  const jsonlPath = path.join(outDirAbs, 'trials.jsonl');
  const matrixPath = path.join(outDirAbs, 'sensor-ablation-matrix.json');

  fs.writeFileSync(dossierPath, pack.metaDossierMd, 'utf-8');
  fs.writeFileSync(deltaPath, pack.aiDeltaMd, 'utf-8');
  fs.writeFileSync(jsonlPath, pack.trialsJsonl, 'utf-8');
  fs.writeFileSync(matrixPath, pack.sensorMatrixJson, 'utf-8');

  console.log('=== Flappy NeuroLab LLM Meta-Analysis Complete ===');
  console.log(
    `Trials: ${findings.totalTrials} | Perfect: ${findings.totalPerfect} (${findings.totalTrials > 0 ? ((findings.totalPerfect / findings.totalTrials) * 100).toFixed(1) : '0.0'}%)`
  );
  if (findings.morphogenesisComparison) {
    const mc = findings.morphogenesisComparison;
    const sign = mc.meanDeltaScore >= 0 ? '+' : '';
    console.log(
      `Morphogenesis A/B: ${mc.matchedPairs} matched pairs | W/T/L ${mc.winsGrowing}/${mc.ties}/${mc.winsStatic} | Mean Δ ${sign}${mc.meanDeltaScore} pipes (p=${mc.signTestPValue ?? '—'})`
    );
  }
  if (findings.sensorDiscovery) {
    const topSensors = findings.sensorDiscovery.sensors
      .filter((s) => s.trialsWithSensor > 0 && s.marginalLift !== null)
      .sort((a, b) => (b.marginalLift ?? -999) - (a.marginalLift ?? -999))
      .slice(0, 4);
    console.log(
      `Top Sensor Marginal Lifts: ${topSensors.map((s) => `${s.shortLabel} (${(s.marginalLift ?? 0) >= 0 ? '+' : ''}${s.marginalLift}p)`).join(' · ')}`
    );
  }
  if (findings.hardwareRoutingSummary && findings.computeRoiSummary) {
    const hr = findings.hardwareRoutingSummary;
    const cr = findings.computeRoiSummary;
    console.log(
      `Hardware Auto-Routing: GPU_LOCKSTEP=${hr.gpuLockstepTrials} | CPU_SPECIALIZED=${hr.cpuSpecializedTrials} | Avg FLOPs/f=${cr.avgFlopsPerFrame} | ParetoPts=${findings.paretoFrontier.length}${
        cr.hybridTrials > 0 ? ` | Hybrid Commits=${cr.totalCommits} Rollbacks=${cr.totalRollbacks}` : ''
      }`
    );
  }
  if (findings.islandWinnerSummary) {
    const topW = findings.islandWinnerSummary.winners[0];
    if (topW) {
      console.log(
        `Island Speciation: ${findings.islandWinnerSummary.totalIslandTrials} runs | Top Winner=${topW.species} (${topW.winSharePct}%, ${topW.meanScore}p)`
      );
    }
  }
  const solvSummary = CORE_DIFFICULTIES.map((d) => {
    const p = verifyScenarioSolvability(resolveEnvironment(d));
    return `${d}:${p.solvable ? 'OK' : 'FAIL'}`;
  }).join(' ');
  console.log(`Core Scenario Math Proofs: ${solvSummary}`);
  console.log(`Written artifacts to: ${outDirAbs}`);
  console.log('  - llm-meta-dossier.md');
  console.log('  - ai-delta-digest.md');
  console.log('  - trials.jsonl');
  console.log('  - sensor-ablation-matrix.json');
}

main();
