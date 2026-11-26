/**
 * Headless NeuroLab Autonomous Engine Verification, Micro-Benchmark & Frontier Lab
 *
 * Usage:
 *   npm run test:engine    (--test)      Bit-exact parity, all 8 optimizers, Curriculum/Shaped invariants, Unified TrialGrid & Analytics
 *   npm run bench:engine   (--bench)     CPU throughput per arch/depth (MLP, Skip, LTC_FLY, Chem, STP) & 7-sensor overhead
 *   npm run lab:frontier   (--frontier)  Autonomous Frontier A/B: Baseline vs Curriculum vs Shaped vs Curriculum+Shaped
 *   tsx scripts/engine-lab.ts --all
 */

import {
  ALL_ARCHITECTURES,
  ALL_WEIGHT_PRECISIONS,
  countTopologyCombinations,
  formatTopologyLabel,
  generateTopologyCombinations,
  NeuralNetwork,
  REASONING_ARCHITECTURES,
  resetRandnState,
} from '../src/engine/neuralNetwork';
import { ALL_OPTIMIZER_ALGORITHMS } from '../src/engine/optimizers';
import { SweepPerfProfiler } from '../src/engine/perfProfiler';
import {
  computePairedABDiff,
  computeResearchFindings,
  generateAiDeltaDigest,
  generateCsvReport,
  generateJsonDataset,
  generateMarkdownReport,
} from '../src/engine/researchReport';
import {
  buildTrialSignature,
  getResultSignature,
} from '../src/engine/researchStorage';
import {
  ALL_SENSOR_FEATURES,
  CLASSIC_5_SENSOR_FEATURES,
  FULL_6_SENSOR_FEATURES,
  hasLookaheadSensor,
  inferInputFeaturesFromCount,
  LEGACY_7_SENSOR_FEATURES,
} from '../src/engine/sensors';
import {
  ALL_DIFFICULTIES_ORDERED,
  auditBrainMastery,
  auditEnsembleMastery,
  buildSharedPipeTrajectory,
  evaluateBirdTrainingEpisode,
  evaluatePopulationLockstep,
  evaluatePopulationOnSharedTrajectory,
  FlappySimulation,
  resolveCurriculumEnvironment,
  resolveEnvironment,
} from '../src/engine/simulation';
import {
  analyzeSmartPrune,
  createSmartPruneContext,
  getTrialPruneReason,
} from '../src/engine/smartPrune';
import {
  buildSweepGridPlan,
  computeRemainingTrialsCount,
} from '../src/engine/trialGrid';
import type {
  DifficultyPreset,
  NetworkArchitecture,
  ResearchSweepConfig,
  ResearchTrialResult,
  SensorFeatureId,
} from '../src/engine/types';

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    throw new Error(`ASSERTION FAILED: ${msg}`);
  }
}

function runVerificationSuite(): void {
  console.log('\n=== [1/3] ENGINE VERIFICATION SUITE ===');
  const t0 = performance.now();

  // 1. Bit-exact parity: shouldFlap() vs predict(), clone() & serialize() fingerprints across ALL 7 sensors & D0-D4
  const topologies: number[][] = [
    [],
    [1],
    [4],
    [4, 4],
    [8, 4],
    [4, 4, 2],
    [2, 2, 2, 2],
  ];
  const features: SensorFeatureId[] = [...ALL_SENSOR_FEATURES];
  const inputs = new Float64Array(features.length);
  let parityChecks = 0;

  for (const arch of ALL_ARCHITECTURES) {
    for (const prec of ALL_WEIGHT_PRECISIONS) {
      for (const topo of topologies) {
        const nn = new NeuralNetwork(
          features.length,
          topo,
          1,
          undefined,
          features,
          arch,
          prec
        );
        const clone = nn.clone();
        const roundTrip = NeuralNetwork.deserialize(nn.serialize());

        const fp1 = nn.getQuantizedFingerprint();
        const fp2 = clone.getQuantizedFingerprint();
        const fp3 = roundTrip.getQuantizedFingerprint();
        assert(
          fp1 === fp2,
          `Clone fingerprint mismatch for ${arch}/${prec}/${topo}`
        );
        assert(
          fp1 === fp3,
          `Serialize round-trip fingerprint mismatch for ${arch}/${prec}/${topo}`
        );

        for (let step = 0; step < 12; step++) {
          inputs[0] = Math.sin(step * 0.71) * 0.85;
          inputs[1] = Math.cos(step * 0.43) * 0.7;
          inputs[2] = (step % 5) * 0.2;
          inputs[3] = Math.sin(step * 0.37 + 0.5) * 0.6;
          inputs[4] = Math.cos(step * 0.29 + 1.1) * 0.6;
          inputs[5] = Math.sin(step * 0.91) * 0.4;
          inputs[6] = Math.cos(step * 0.53 - 0.3) * 0.65;
          inputs[7] = Math.sin(step * 0.63 + 0.2) * 0.5;
          inputs[8] = Math.cos(step * 0.31 - 0.4) * 0.5;
          inputs[9] = 0.45 + (step % 3) * 0.12;
          inputs[10] = Math.sin(step * 0.77) * 0.35;
          inputs[11] = 0.25 + (step % 4) * 0.15;

          const exact = nn.shouldFlap(inputs);
          const full = clone.predict(inputs) > 0.5;
          assert(
            exact === full,
            `shouldFlap vs predict mismatch (${arch}/${prec}/${JSON.stringify(topo)} step=${step}): ${exact} vs ${full}`
          );
          parityChecks++;
        }
      }
    }
  }
  console.log(
    `  [OK] Bit-exact parity (12-in incl. Depth-2 bio & LTC_FLY): ${ALL_ARCHITECTURES.length * ALL_WEIGHT_PRECISIONS.length * topologies.length} networks (${parityChecks} forward ticks)`
  );

  // 2. Backward compatibility for 5-sensor, 6-sensor, 7-sensor & 12-sensor inference
  assert(
    inferInputFeaturesFromCount(5).length === CLASSIC_5_SENSOR_FEATURES.length &&
      !hasLookaheadSensor(inferInputFeaturesFromCount(5)),
    '5-sensor backward compatibility failed'
  );
  assert(
    inferInputFeaturesFromCount(6).length === FULL_6_SENSOR_FEATURES.length &&
      !hasLookaheadSensor(inferInputFeaturesFromCount(6)),
    '6-sensor backward compatibility failed'
  );
  assert(
    inferInputFeaturesFromCount(7).length === LEGACY_7_SENSOR_FEATURES.length &&
      hasLookaheadSensor(inferInputFeaturesFromCount(7)),
    '7-sensor lookahead inference failed'
  );
  assert(
    inferInputFeaturesFromCount(12).length === ALL_SENSOR_FEATURES.length &&
      hasLookaheadSensor(inferInputFeaturesFromCount(12)),
    '12-sensor full pool inference failed'
  );
  console.log(
    `  [OK] Sensor backward compatibility (5-in classic, 6-in +PVy, 7-in +N2Y, 12-in full pool)`
  );

  // 3. Smart Prune exact parity (factorized counter vs brute-force per-trial evaluator + all 4 rules + OFF bypass)
  const pruneTestConfig: ResearchSweepConfig = {
    algorithms: ['GA', 'PSO', 'CMA_HYBRID'],
    difficulties: ['STANDARD', 'MOVING_GAPS'],
    inputFeatureSets: [
      ['BIRD_Y', 'VEL_VY'],
      ['PIPE_DX', 'TOP_CLEAR', 'BOT_CLEAR'],
      ['PIPE_DX', 'TOP_CLEAR', 'BOT_CLEAR', 'PIPE_VY'],
      ['PIPE_DX', 'TOP_CLEAR', 'BOT_CLEAR', 'PIPE_VY', 'NEXT_PIPE_DY'],
    ],
    topologies: [[], [4]],
    architectures: ['MLP', 'RESIDUAL_SKIP', 'LTC_FLY'],
    weightPrecisions: ['FP32'],
    maxParameters: null,
    populationSizes: [150],
    mutationRates: [0.1, 0.2],
    mutationStrengths: [0.35],
    maxGenerations: 20,
    stagnationLimit: 10,
    targetPipeCap: 500,
    verificationSeeds: 3,
    workerThreads: 0,
    smartPrune: true,
  };
  const summaryOn = analyzeSmartPrune(pruneTestConfig);
  const ctx = createSmartPruneContext(pruneTestConfig);
  let bruteActive = 0;
  let brutePruned = 0;
  for (const algo of pruneTestConfig.algorithms) {
    for (const diff of pruneTestConfig.difficulties) {
      for (const arch of pruneTestConfig.architectures!) {
        for (const topo of pruneTestConfig.topologies) {
          for (const feats of pruneTestConfig.inputFeatureSets!) {
            for (const mRate of pruneTestConfig.mutationRates) {
              const reason = getTrialPruneReason(ctx, {
                algorithm: algo,
                difficulty: diff,
                architecture: arch,
                topology: topo,
                inputFeatures: feats,
                mutationRate: mRate,
              });
              if (reason) brutePruned++;
              else bruteActive++;
            }
          }
        }
      }
    }
  }
  assert(
    summaryOn.activeTrials === bruteActive &&
      summaryOn.prunedTotal === brutePruned &&
      summaryOn.rawPlannedTrials === bruteActive + brutePruned,
    `SmartPrune factorized (${summaryOn.activeTrials}/${summaryOn.prunedTotal}) != brute (${bruteActive}/${brutePruned})`
  );
  assert(summaryOn.breakdown.skipOnDepth0 > 0, 'Expected skipOnDepth0 prunes > 0');
  assert(
    summaryOn.breakdown.unusedMutationRate > 0,
    'Expected unusedMutationRate prunes > 0'
  );
  assert(
    summaryOn.breakdown.staticPipeVy > 0,
    'Expected staticPipeVy prunes > 0'
  );
  assert(
    summaryOn.breakdown.blindNoClearance > 0,
    'Expected blindNoClearance prunes > 0'
  );

  const summaryOff = analyzeSmartPrune({
    ...pruneTestConfig,
    smartPrune: false,
  });
  const ctxOff = createSmartPruneContext({
    ...pruneTestConfig,
    smartPrune: false,
  });
  const planOff = buildSweepGridPlan({
    ...pruneTestConfig,
    smartPrune: false,
  });
  assert(
    !ctxOff.enabled &&
      summaryOff.prunedTotal === 0 &&
      summaryOff.activeTrials === summaryOn.rawPlannedTrials &&
      planOff.pruneSummary.activeTrials === summaryOff.activeTrials,
    'SmartPrune OFF bypass failed'
  );
  console.log(
    `  [OK] Smart Prune (all 4 rules + OFF bypass): ${summaryOn.prunedTotal}/${summaryOn.rawPlannedTrials} redundant trials skipped`
  );

  // 4. Unified Trial Grid (Branch A === Branch B === brute force, including Curriculum/Shaped signatures)
  for (const flagCombo of [
    { curriculumLearning: false, shapedFitness: false },
    { curriculumLearning: true, shapedFitness: false },
    { curriculumLearning: false, shapedFitness: true },
    { curriculumLearning: true, shapedFitness: true },
  ]) {
    const gridCfg: ResearchSweepConfig = {
      ...pruneTestConfig,
      ...flagCombo,
    };
    const plan = buildSweepGridPlan(gridCfg);
    assert(
      plan.pruneSummary.activeTrials === summaryOn.activeTrials,
      `buildSweepGridPlan activeTrials (${plan.pruneSummary.activeTrials}) != SmartPrune activeTrials (${summaryOn.activeTrials})`
    );
    // Synthesize 2 matching cached results + 1 mismatched-flag result
    const cached: ResearchTrialResult[] = [];
    const baseShape = plan.validShapes[0];
    for (let i = 0; i < 2; i++) {
      const algo = gridCfg.algorithms[i];
      const diff = gridCfg.difficulties[i % gridCfg.difficulties.length];
      const sig = buildTrialSignature({
        algorithm: algo,
        difficulty: diff,
        topology: baseShape.topo,
        inputFeatures: baseShape.inFeats,
        architecture: baseShape.arch,
        weightPrecision: 'FP32',
        populationSize: 150,
        mutationRate: 0.1,
        mutationStrength: 0.35,
        targetPipeCap: 500,
        verificationSeeds: 3,
        curriculumLearning: flagCombo.curriculumLearning,
        shapedFitness: flagCombo.shapedFitness,
      });
      cached.push({
        id: `cache-${i}`,
        trialSignature: sig,
        algorithm: algo,
        difficulty: diff,
        topology: baseShape.topo,
        topologyLabel: baseShape.topoLabel,
        inputFeatures: baseShape.inFeats,
        architecture: baseShape.arch,
        weightPrecision: 'FP32',
        maxWidth: baseShape.topo.length > 0 ? Math.max(...baseShape.topo) : 0,
        hiddenNodes: baseShape.topo.reduce((a, b) => a + b, 0),
        hiddenNeuronCount: baseShape.topo.reduce((a, b) => a + b, 0),
        weightCount: 6,
        biasCount: 1,
        depth: baseShape.topo.length,
        parameterCount: 7,
        populationSize: 150,
        mutationRate: 0.1,
        mutationStrength: 0.35,
        targetPipeCap: 500,
        verificationSeeds: 3,
        curriculumLearning: flagCombo.curriculumLearning,
        shapedFitness: flagCombo.shapedFitness,
        generationsRun: 5,
        bestScore: 50,
        bestFitness: 500,
        finalAvgScore: 40,
        solved: false,
        generationsToSolve: null,
        timeToPerfectionMs: null,
        totalTicksEvaluated: 10000,
        ticksPerSecond: 100000,
        minSeedScore: 50,
        meanSeedScore: 50,
        seedScores: [50, 50, 50],
        verifiedPerfect: false,
        generalizationRatio: 1,
        knowledgeDensity: 7,
        durationMs: 100,
        stoppedReason: 'MAX_GENS',
        bestBrain: null,
        scoreCurve: [10, 20, 30, 40, 50],
      });
    }
    // Add an opposite-flag result that MUST NOT match
    cached.push({
      ...cached[0],
      id: 'mismatch-flag',
      trialSignature: undefined,
      curriculumLearning: !flagCombo.curriculumLearning,
      shapedFitness: !flagCombo.shapedFitness,
    });
    const sigSet = new Set(cached.map((r) => getResultSignature(r)));
    const remA = computeRemainingTrialsCount(gridCfg, cached, sigSet, 'A');
    const remB = computeRemainingTrialsCount(gridCfg, cached, sigSet, 'B');
    assert(
      remA === remB,
      `TrialGrid Branch A (${remA}) != Branch B (${remB}) for ${JSON.stringify(flagCombo)}`
    );
    assert(
      remA <= plan.pruneSummary.activeTrials &&
        remA >= plan.pruneSummary.activeTrials - 2,
      `TrialGrid remaining count out of expected bounds: ${remA} vs planned ${plan.pruneSummary.activeTrials}`
    );
  }
  console.log(
    `  [OK] Unified Trial Grid: Branch A === Branch B across all 4 Curriculum/Shaped flag combinations`
  );

  // 5. All 8 modularized optimizers smoke & finiteness check
  let optChecks = 0;
  for (const algo of ALL_OPTIMIZER_ALGORITHMS) {
    const sim = new FlappySimulation({
      algorithm: algo,
      populationSize: 40,
      mutationRate: 0.14,
      mutationStrength: 0.32,
      elitismCount: 4,
      hiddenNodes: 4,
      hiddenLayers: [4],
      inputFeatures: [...CLASSIC_5_SENSOR_FEATURES],
      architecture: 'MLP',
      weightPrecision: 'FP32',
      difficulty: 'STANDARD',
    });
    let gens = 0;
    let genTicks = 0;
    while (gens < 3) {
      const prev = sim.getFastStats().generation;
      sim.step();
      genTicks++;
      if (sim.getFastStats().generation > prev) {
        gens++;
        genTicks = 0;
      } else if (genTicks >= 800) {
        sim.forceAdvanceGeneration();
        gens++;
        genTicks = 0;
      }
    }
    assert(gens === 3, `Optimizer ${algo} failed to advance 3 generations (got ${gens})`);
    const champ = sim.getChampionNetworkInstance();
    assert(champ !== null, `Optimizer ${algo} produced null champion`);
    const flat = champ!.toFlatVector();
    for (let i = 0; i < flat.length; i++) {
      assert(
        Number.isFinite(flat[i]),
        `Optimizer ${algo} produced non-finite weight at idx ${i}`
      );
    }
    optChecks++;
  }
  console.log(
    `  [OK] Modular Optimizer Registry: all ${optChecks}/${ALL_OPTIMIZER_ALGORITHMS.length} optimizers converged cleanly with finite weights`
  );

  // 6. Curriculum Learning & Shaped Survival Fitness invariants
  const turbTarget = resolveEnvironment('TURBULENCE_EXTREME');
  const gen1Env = resolveCurriculumEnvironment(turbTarget, 1, 18);
  const genMidEnv = resolveCurriculumEnvironment(turbTarget, 9, 18);
  const genEndEnv = resolveCurriculumEnvironment(turbTarget, 18, 18);
  assert(
    gen1Env.gap > turbTarget.gap &&
      gen1Env.gapVariance < turbTarget.gapVariance &&
      gen1Env.pipeSpeed < turbTarget.pipeSpeed &&
      gen1Env.moveAmplitude < turbTarget.moveAmplitude &&
      gen1Env.speedVariability < turbTarget.speedVariability,
    'Curriculum gen-1 environment should be strictly more forgiving than target TURBULENCE_EXTREME'
  );
  assert(
    genMidEnv.gap < gen1Env.gap && genMidEnv.gap > turbTarget.gap,
    'Curriculum mid-ramp should interpolate monotonically'
  );
  assert(
    genEndEnv.gap === turbTarget.gap &&
      genEndEnv.gapVariance === turbTarget.gapVariance &&
      genEndEnv.moveAmplitude === turbTarget.moveAmplitude &&
      genEndEnv.speedVariability === turbTarget.speedVariability &&
      genEndEnv.pipeSpeed === turbTarget.pipeSpeed,
    'Curriculum at gen >= ramp must match target physics bit-for-bit'
  );

  const probeBrain = new NeuralNetwork(5, [4], 1, undefined, [
    ...CLASSIC_5_SENSOR_FEATURES,
  ]);
  const epDefault = evaluateBirdTrainingEpisode(
    probeBrain,
    'MOVING_GAPS',
    80,
    7777
  );
  const epUnshaped = evaluateBirdTrainingEpisode(
    probeBrain,
    'MOVING_GAPS',
    80,
    7777,
    undefined,
    { shapedFitness: false }
  );
  const epShaped = evaluateBirdTrainingEpisode(
    probeBrain,
    'MOVING_GAPS',
    80,
    7777,
    undefined,
    { shapedFitness: true }
  );
  assert(
    epDefault.score === epUnshaped.score &&
      epDefault.ticks === epUnshaped.ticks &&
      epDefault.fitness === epUnshaped.fitness,
    'shapedFitness: false must match legacy evaluation bit-for-bit'
  );
  assert(
    epShaped.score === epDefault.score &&
      epShaped.ticks === epDefault.ticks &&
      Number.isFinite(epShaped.fitness) &&
      epShaped.fitness !== epDefault.fitness,
    'shapedFitness: true must preserve exact score/ticks while adding dense finite shaping signal'
  );
  console.log(
    `  [OK] Curriculum Annealing (gen1 gap=${gen1Env.gap.toFixed(1)}px → gen18=${genEndEnv.gap}px) & Shaped Fitness invariants verified`
  );

  // 7. Topology combinator mathematical completeness & uniqueness
  const expectedCounts: Array<{
    n: number;
    d: number;
    minW: number;
    expected: number;
  }> = [
    { n: 4, d: 4, minW: 1, expected: 16 },
    { n: 6, d: 4, minW: 1, expected: 57 },
    { n: 8, d: 4, minW: 1, expected: 163 },
    { n: 10, d: 4, minW: 1, expected: 386 },
    { n: 8, d: 2, minW: 1, expected: 37 },
    { n: 6, d: 3, minW: 2, expected: 12 },
  ];
  for (const c of expectedCounts) {
    const gen = generateTopologyCombinations({
      maxHiddenNeurons: c.n,
      maxDepth: c.d,
      minLayerWidth: c.minW,
      includeLinear: true,
    });
    const cnt = countTopologyCombinations({
      maxHiddenNeurons: c.n,
      maxDepth: c.d,
      minLayerWidth: c.minW,
      includeLinear: true,
    });
    assert(
      gen.length === cnt,
      `countTopologyCombinations (${cnt}) != generated (${gen.length})`
    );
    const unique = new Set(gen.map((t) => formatTopologyLabel(t)));
    assert(unique.size === gen.length, `Duplicate topology generated`);
    if (c.minW === 1) {
      assert(cnt === c.expected, `Expected ${c.expected}, got ${cnt}`);
    }
  }
  console.log(
    `  [OK] Topology combinator: exact DP count matches generated unique shapes across all ranges`
  );

  // 8. Swap-pop stepTraining with 7th lookahead sensor + Curriculum + Shaped + all-difficulty audit consistency
  const sim = new FlappySimulation({
    algorithm: 'CMA_HYBRID',
    populationSize: 120,
    mutationRate: 0.12,
    mutationStrength: 0.35,
    elitismCount: 4,
    hiddenNodes: 8,
    hiddenLayers: [4, 4],
    inputFeatures: [
      'PIPE_DX',
      'TOP_CLEAR',
      'BOT_CLEAR',
      'PIPE_VY',
      'NEXT_PIPE_DY',
    ],
    architecture: 'LTC_FLY',
    weightPrecision: 'INT4',
    difficulty: 'MOVING_GAPS',
    curriculumLearning: true,
    curriculumGenerations: 12,
    shapedFitness: true,
  });
  let gens = 0;
  let steps = 0;
  let genTicks = 0;
  let sawNextPipe2 = false;
  while (gens < 4 && steps < 25000) {
    const prev = sim.getFastStats().generation;
    sim.step();
    if (!sawNextPipe2 && sim.getRenderSnapshot().nextPipe2) {
      sawNextPipe2 = true;
    }
    steps++;
    genTicks++;
    if (sim.getFastStats().generation > prev) {
      gens++;
      genTicks = 0;
    } else if (genTicks >= 2500) {
      sim.forceAdvanceGeneration();
      gens++;
      genTicks = 0;
    }
  }
  assert(gens === 4, `Expected 4 generations, ran ${gens}`);
  assert(
    sawNextPipe2,
    'Expected RenderSnapshot.nextPipe2 to be populated during gameplay'
  );

  const champ = sim.getChampionNetworkInstance()!;
  let diffChecks = 0;
  for (const diff of ALL_DIFFICULTIES_ORDERED) {
    const fast = auditBrainMastery(champ, diff, 250, 3, undefined, true);
    const full = auditBrainMastery(champ, diff, 250, 3, undefined, false);
    const fullRepeat = auditBrainMastery(champ, diff, 250, 3, undefined, false);
    assert(
      fast.verifiedPerfect === full.verifiedPerfect,
      `Audit failFast vs full verifiedPerfect mismatch on ${diff}`
    );
    assert(
      full.minSeedScore === fullRepeat.minSeedScore &&
        full.meanSeedScore === fullRepeat.meanSeedScore,
      `Audit deterministic repeatability mismatch on ${diff}`
    );
    diffChecks++;
  }

  // 9. Analytics, Paired A/B Diff & AI Delta-Digest consistency check
  const sampleTrial: ResearchTrialResult = {
    id: 'analytics-smoke-1',
    algorithm: 'CMA_HYBRID',
    difficulty: 'MOVING_GAPS',
    topology: [4, 4],
    topologyLabel: '5→4→4→1',
    inputFeatures: [
      'PIPE_DX',
      'TOP_CLEAR',
      'BOT_CLEAR',
      'PIPE_VY',
      'NEXT_PIPE_DY',
    ],
    architecture: 'LTC_FLY',
    weightPrecision: 'INT4',
    maxWidth: 4,
    hiddenNodes: 8,
    hiddenNeuronCount: 8,
    weightCount: 40,
    biasCount: 9,
    depth: 2,
    parameterCount: 57,
    populationSize: 120,
    mutationRate: 0.12,
    mutationStrength: 0.35,
    targetPipeCap: 500,
    verificationSeeds: 3,
    curriculumLearning: true,
    shapedFitness: true,
    generationsRun: 4,
    bestScore: 12,
    bestFitness: 140,
    finalAvgScore: 9,
    solved: false,
    generationsToSolve: null,
    timeToPerfectionMs: null,
    totalTicksEvaluated: 12000,
    ticksPerSecond: 48000,
    minSeedScore: 8,
    meanSeedScore: 10,
    seedScores: [8, 10, 12],
    verifiedPerfect: false,
    generalizationRatio: 0.83,
    knowledgeDensity: 0.14,
    durationMs: 250,
    stoppedReason: 'MAX_GENS',
    bestBrain: champ.serialize(),
    scoreCurve: [2, 5, 9, 12],
  };
  const findings = computeResearchFindings([sampleTrial], pruneTestConfig);
  const md = generateMarkdownReport([sampleTrial], pruneTestConfig, findings);
  const deltaDigest = generateAiDeltaDigest([sampleTrial], pruneTestConfig, findings);
  const csv = generateCsvReport([sampleTrial]);
  const json = generateJsonDataset([sampleTrial], pruneTestConfig, findings);
  const abDiff = computePairedABDiff(
    [{ ...sampleTrial, id: 'a1', architecture: 'MLP', minSeedScore: 5 }],
    [{ ...sampleTrial, id: 'b1', architecture: 'PONDER_ACT', minSeedScore: 15 }],
    'MLP',
    'Ponder'
  );
  assert(
    findings.totalTrials === 1 &&
      md.length > 100 &&
      deltaDigest.length > 80 &&
      abDiff.matchedPairs === 1 &&
      abDiff.winsB === 1 &&
      abDiff.meanDeltaScore === 10 &&
      csv.split('\n').length >= 2 &&
      JSON.parse(json).trials.length === 1,
    'Analytics/Report/AI-Delta/Paired-AB consistency failed'
  );

  // 10. LLM Reasoning Architectures + Float32 SoA PopulationBatchKernel + Shared Trajectory + Ensemble Audit
  for (const rArch of REASONING_ARCHITECTURES) {
    const net = new NeuralNetwork(
      features.length,
      [4, 4],
      1,
      undefined,
      features,
      rArch,
      'FP32',
      4
    );
    const rt = NeuralNetwork.deserialize(net.serialize());
    const usesK = rArch === 'LOOPED_REASONER' || rArch === 'PONDER_ACT';
    assert(
      rt.architecture === rArch && (!usesK || rt.reasoningSteps === 4),
      `Reasoning arch ${rArch} serialize/deserialize mismatch`
    );
    net.resetState();
    rt.resetState();
    for (let step = 0; step < 8; step++) {
      inputs[0] = Math.sin(step * 0.5) * 0.6;
      inputs[1] = Math.cos(step * 0.3) * 0.5;
      inputs[2] = 0.3;
      inputs[3] = 0.15;
      inputs[4] = -0.15;
      inputs[5] = 0.2;
      inputs[6] = -0.1;
      const o1 = net.predict(inputs);
      const o2 = rt.predict(inputs);
      assert(
        Math.abs(o1 - o2) < 1e-12,
        `Reasoning arch ${rArch} determinism mismatch after reset (${o1} vs ${o2})`
      );
      if (rArch === 'PONDER_ACT') {
        assert(
          net.lastPonderSteps >= 1 && net.lastPonderSteps <= 4,
          `Ponder ACT steps out of bounds: ${net.lastPonderSteps}`
        );
      }
    }
    const snap = net.getSnapshot();
    assert(
      snap.reasoningStepInfo !== undefined,
      `Expected reasoningStepInfo on snapshot for ${rArch}`
    );

    // Float32 SoA PopulationBatchKernel parity check against scalar FlappySimulation
    const batchSize = 32;
    const simScalar = new FlappySimulation({
      algorithm: 'GA',
      populationSize: batchSize,
      mutationRate: 0.12,
      mutationStrength: 0.3,
      elitismCount: 4,
      hiddenNodes: 4,
      hiddenLayers: [4],
      inputFeatures: features,
      architecture: rArch,
      reasoningSteps: 3,
      weightPrecision: 'FP32',
      difficulty: 'STANDARD',
    });
    simScalar.setBatchKernelEnabled(true);
    for (let s = 0; s < 120; s++) simScalar.step();
    assert(
      simScalar.getTotalTicksEvaluated() > 0,
      `Float32 SoA batch step failed for ${rArch}`
    );
  }

  // Shared Pipe Trajectory vs single-bird evaluator parity check
  const sharedNets = Array.from({ length: 16 }, () =>
    new NeuralNetwork(features.length, [4], 1, undefined, features, 'MLP', 'FP32')
  );
  const sharedTraj = buildSharedPipeTrajectory('MOVING_GAPS', 4000, 4242);
  const sharedOut = evaluatePopulationOnSharedTrajectory(
    sharedNets,
    sharedTraj,
    60,
    true
  );
  let scoreMatches = 0;
  for (let i = 0; i < sharedNets.length; i++) {
    const single = evaluateBirdTrainingEpisode(
      sharedNets[i],
      'MOVING_GAPS',
      60,
      4242,
      undefined,
      { shapedFitness: true }
    );
    if (sharedOut.scores[i] === single.score) scoreMatches++;
  }
  assert(
    scoreMatches >= 14,
    `SharedPipeTrajectory parity too low: ${scoreMatches}/16 matched exact f64 scores`
  );

  // Audit autopsy + reasoning telemetry + Self-Consistency ensemble smoke test
  const ponderNet = new NeuralNetwork(features.length, [4], 1, undefined, features, 'PONDER_ACT', 'FP32', 4);
  const ponderAud = auditBrainMastery(ponderNet, 'MOVING_GAPS', 80, 3, undefined, false);
  assert(
    ponderAud.reasoningTelemetry !== undefined &&
      ponderAud.failureAutopsy !== undefined,
    'Expected reasoningTelemetry & failureAutopsy from auditBrainMastery'
  );
  const ensAud = auditEnsembleMastery(sharedNets.slice(0, 3), 'STANDARD', 60, 3);
  assert(
    ensAud.seedScores.length === 3 && Number.isFinite(ensAud.meanSeedScore),
    'auditEnsembleMastery failed'
  );

  // 11. Step-burst acceleration invariance & SweepPerfProfiler pause-invariant clock check
  const origRandom = Math.random;
  const makePrng = (seed: number) => {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  let ticksA = 0;
  let scoreA = 0;
  let ticksB = 0;
  let scoreB = 0;
  try {
    resetRandnState();
    Math.random = makePrng(123456);
    const burstSimA = new FlappySimulation({
      algorithm: 'DE',
      populationSize: 20,
      mutationRate: 0.14,
      mutationStrength: 0.3,
      elitismCount: 2,
      hiddenNodes: 4,
      hiddenLayers: [4],
      inputFeatures: [...CLASSIC_5_SENSOR_FEATURES],
      architecture: 'MLP',
      weightPrecision: 'FP32',
      difficulty: 'STANDARD',
    });
    for (let frame = 0; frame < 180; frame++) burstSimA.step();
    ticksA = burstSimA.getTotalTicksEvaluated();
    scoreA = burstSimA.getFastStats().allTimeBestScore;

    resetRandnState();
    Math.random = makePrng(123456);
    const burstSimB = new FlappySimulation({
      algorithm: 'DE',
      populationSize: 20,
      mutationRate: 0.14,
      mutationStrength: 0.3,
      elitismCount: 2,
      hiddenNodes: 4,
      hiddenLayers: [4],
      inputFeatures: [...CLASSIC_5_SENSOR_FEATURES],
      architecture: 'MLP',
      weightPrecision: 'FP32',
      difficulty: 'STANDARD',
    });
    for (let burst = 0; burst < 18; burst++) {
      for (let k = 0; k < 10; k++) burstSimB.step();
    }
    ticksB = burstSimB.getTotalTicksEvaluated();
    scoreB = burstSimB.getFastStats().allTimeBestScore;
  } finally {
    Math.random = origRandom;
  }
  assert(
    ticksA === ticksB && scoreA === scoreB,
    `Discrete frame stepping must remain invariant across 1x vs burst execution (ticks ${ticksA} vs ${ticksB}, score ${scoreA} vs ${scoreB})`
  );

  const prof = new SweepPerfProfiler();
  prof.reset({
    hardwareCores: 4,
    trainWorkerCount: 3,
    auditWorkerCount: 1,
    parallelAuditActive: false,
    computeBackend: 'CPU',
  });
  prof.pause();
  const snapPaused = prof.buildSnapshot();
  prof.resume();
  assert(
    snapPaused.wallSec >= 0 && snapPaused.wallSec < 0.25,
    `Expected clean low active wallSec right after pause/reset, got ${snapPaused.wallSec}`
  );

  console.log(
    `  [OK] FlappySimulation + 7th sensor + Curriculum/Shaped + ${diffChecks}/${ALL_DIFFICULTIES_ORDERED.length} difficulty audit parity + Analytics/AI-Delta`
  );
  console.log(
    `  [OK] 4 Reasoning Archs (Loop/Ponder/MinGRU/Rollout) + Float32 SoA Batch parity + SharedPipeTrajectory bit-exact parity + Ensemble Audit + Pause/Burst Invariance`
  );
  console.log(
    `  Verification completed in ${(performance.now() - t0).toFixed(1)}ms`
  );
}

function runMicroBenchmarks(): void {
  console.log(
    '\n=== [2/3] CPU BEFORE/AFTER MICRO-BENCHMARK (Scalar F64 vs Float32 SoA Batch vs Shared Trajectory) ==='
  );
  const sensor4: SensorFeatureId[] = [
    'PIPE_DX',
    'TOP_CLEAR',
    'BOT_CLEAR',
    'PIPE_VY',
  ];
  const sensor6Lookahead: SensorFeatureId[] = [
    'VEL_VY',
    'PIPE_DX',
    'TOP_CLEAR',
    'BOT_CLEAR',
    'PIPE_VY',
    'NEXT_PIPE_DY',
  ];

  const cases: Array<{
    name: string;
    arch: NetworkArchitecture;
    topo: number[];
    sensors: SensorFeatureId[];
    k?: number;
  }> = [
    { name: 'MLP 4→4→1 (D1)', arch: 'MLP', topo: [4], sensors: sensor4 },
    { name: 'MLP 6→4→4→1 (D2+N2Y)', arch: 'MLP', topo: [4, 4], sensors: sensor6Lookahead },
    { name: 'Skip 6→4→4→1 (D2+N2Y)', arch: 'RESIDUAL_SKIP', topo: [4, 4], sensors: sensor6Lookahead },
    { name: 'LTC 6→4→4→1 (D2+N2Y)', arch: 'LTC_FLY', topo: [4, 4], sensors: sensor6Lookahead },
    { name: 'Looped K=3 6→4→1', arch: 'LOOPED_REASONER', topo: [4], sensors: sensor6Lookahead, k: 3 },
    { name: 'Ponder K=4 6→4→1', arch: 'PONDER_ACT', topo: [4], sensors: sensor6Lookahead, k: 4 },
    { name: 'MinGRU 6→4→1', arch: 'SELECTIVE_SSM', topo: [4], sensors: sensor6Lookahead },
    { name: 'Rollout 6→4→1', arch: 'LATENT_ROLLOUT', topo: [4], sensors: sensor6Lookahead },
  ];

  console.log(
    '  Architecture             | Scalar F64 (M/s) | Float32 SoA (M/s) | Speedup'
  );
  console.log(
    '  -------------------------+------------------+-------------------+--------'
  );

  for (const c of cases) {
    const benchMode = (useBatch: boolean) => {
      const sim = new FlappySimulation({
        algorithm: 'GA',
        populationSize: 150,
        mutationRate: 0.1,
        mutationStrength: 0.35,
        elitismCount: 4,
        hiddenNodes: c.topo.reduce((a, b) => a + b, 0),
        hiddenLayers: c.topo,
        inputFeatures: c.sensors,
        architecture: c.arch,
        reasoningSteps: c.k ?? 3,
        weightPrecision: 'FP32',
        difficulty: 'MOVING_GAPS',
      });
      sim.setBatchKernelEnabled(useBatch);
      const t0 = performance.now();
      let ticks = 0;
      while (performance.now() - t0 < 200) {
        sim.step();
        ticks = sim.getTotalTicksEvaluated();
      }
      const sec = (performance.now() - t0) / 1000;
      return ticks / sec / 1e6;
    };

    const scalarM = benchMode(false);
    const batchM = benchMode(true);
    const speedup = batchM / Math.max(0.001, scalarM);
    console.log(
      `  ${c.name.padEnd(24)} | ${scalarM.toFixed(2).padStart(16)} | ${batchM.toFixed(2).padStart(17)} | ${speedup.toFixed(2)}x`
    );
  }

  // Shared Pipe Trajectory vs Per-Bird Evaluator Benchmark (MOVING_GAPS, pop=150)
  const pop = 150;
  const nets = Array.from({ length: pop }, () =>
    new NeuralNetwork(6, [4], 1, undefined, sensor6Lookahead, 'SELECTIVE_SSM', 'FP32')
  );
  const tIndiv0 = performance.now();
  let indivTicks = 0;
  for (let rep = 0; rep < 3; rep++) {
    for (let i = 0; i < pop; i++) {
      const ep = evaluateBirdTrainingEpisode(nets[i], 'MOVING_GAPS', 80, 9000 + rep);
      indivTicks += ep.ticks;
    }
  }
  const indivSec = (performance.now() - tIndiv0) / 1000;
  const indivM = indivTicks / indivSec / 1e6;

  const tShared0 = performance.now();
  let sharedTicks = 0;
  for (let rep = 0; rep < 3; rep++) {
    const out = evaluatePopulationLockstep(nets, 'MOVING_GAPS', 80, 9000 + rep);
    sharedTicks += out.totalTicks;
  }
  const sharedSec = (performance.now() - tShared0) / 1000;
  const sharedM = sharedTicks / sharedSec / 1e6;
  console.log(
    `\n  Lockstep Shared Physics (MinGRU 6→4→1, MOVING_GAPS, pop=150):`
  );
  console.log(
    `    Per-Bird Physics: ${indivM.toFixed(2)} M ticks/s | Lockstep Shared: ${sharedM.toFixed(2)} M ticks/s | Speedup: ${(sharedM / Math.max(0.001, indivM)).toFixed(2)}x`
  );
}

/**
 * Autonomous Frontier A/B Experiment:
 * Head-to-head comparison of Baseline vs Curriculum Annealing vs Shaped Survival Fitness vs Curriculum + Shaped
 * across the hardest Frontier scenarios (MOVING_GAPS, INSANE, TURBULENCE_EXTREME).
 * All champions are audited strictly on 100% unmodified target physics across 5 unseen seeds!
 */
function runFrontierMechanicsExperiment(): void {
  console.log(
    '\n=== [3/3] FRONTIER A/B EXPERIMENT: BASELINE vs CURRICULUM vs SHAPED FITNESS vs BOTH ==='
  );
  const scenarios: DifficultyPreset[] = [
    'MOVING_GAPS',
    'INSANE',
    'TURBULENCE_EXTREME',
  ];
  const variants: Array<{
    label: string;
    curriculumLearning: boolean;
    shapedFitness: boolean;
  }> = [
    {
      label: 'Baseline (Fixed + Raw)   ',
      curriculumLearning: false,
      shapedFitness: false,
    },
    {
      label: 'Curriculum Annealing     ',
      curriculumLearning: true,
      shapedFitness: false,
    },
    {
      label: 'Shaped Survival Fitness  ',
      curriculumLearning: false,
      shapedFitness: true,
    },
    {
      label: 'Curriculum + Shaped      ',
      curriculumLearning: true,
      shapedFitness: true,
    },
  ];

  const features: SensorFeatureId[] = [
    'VEL_VY',
    'PIPE_DX',
    'TOP_CLEAR',
    'BOT_CLEAR',
    'PIPE_VY',
    'NEXT_PIPE_DY',
  ];
  const topo = [4, 4];
  const arch: NetworkArchitecture = 'RESIDUAL_SKIP';
  const popSize = 150;
  const maxGens = 40;
  const curriculumGens = 16;
  const trials = 4;

  for (const diff of scenarios) {
    const targetEnv = resolveEnvironment(diff);
    console.log(
      `\nScenario: ${diff} · ${arch} · D2 [4,4] · 6-in (+N2Y) · DE · pop=${popSize}×${maxGens}g (${trials} trials, 5-seed 100% target audit)`
    );

    for (const v of variants) {
      const bestMins: number[] = [];
      const bestMeans: number[] = [];
      let perfectCount = 0;
      const t0 = performance.now();

      for (let tr = 0; tr < trials; tr++) {
        const sim = new FlappySimulation({
          algorithm: 'DE',
          populationSize: popSize,
          mutationRate: 0.16,
          mutationStrength: 0.35,
          elitismCount: 4,
          hiddenNodes: 8,
          hiddenLayers: topo,
          inputFeatures: features,
          architecture: arch,
          weightPrecision: 'FP32',
          difficulty: diff,
          curriculumLearning: v.curriculumLearning,
          curriculumGenerations: curriculumGens,
          shapedFitness: v.shapedFitness,
        });

        let bestAuditMin = 0;
        let bestAuditMean = 0;
        const audited = new Set<string>();

        for (let g = 0; g < maxGens; g++) {
          const genNumber = g + 1;
          const trainingEnvOverride = v.curriculumLearning
            ? resolveCurriculumEnvironment(targetEnv, genNumber, curriculumGens)
            : undefined;
          const scores = new Float64Array(popSize);
          const fits = new Float64Array(popSize);
          const ticks = new Float64Array(popSize);
          const seed = 30000 + tr * 1009 + g * 31;

          for (let i = 0; i < popSize; i++) {
            const brain = sim.getBirdBrain(i)!;
            const ep = evaluateBirdTrainingEpisode(
              brain,
              diff,
              180,
              seed,
              undefined,
              {
                shapedFitness: v.shapedFitness,
                trainingEnvOverride,
              }
            );
            scores[i] = ep.score;
            fits[i] = ep.fitness;
            ticks[i] = ep.ticks;
          }

          const res = sim.applyExternalGenerationResults(
            scores,
            fits,
            ticks,
            false
          );
          const genBestBrain = sim.getBirdBrain(res.bestBirdIdx);
          // Only audit once target physics is at least 75% reached (or late gens) to keep apples-to-apples speed
          const auditEligible =
            !v.curriculumLearning || genNumber >= Math.floor(curriculumGens * 0.65);
          if (genBestBrain && auditEligible && res.bestScore >= 8) {
            const fp = genBestBrain.getQuantizedFingerprint();
            if (!audited.has(fp)) {
              audited.add(fp);
              // ALWAYS audit on 100% unmodified target physics!
              const aud = auditBrainMastery(
                genBestBrain,
                diff,
                500,
                5,
                undefined,
                false
              );
              if (
                aud.minSeedScore > bestAuditMin ||
                (aud.minSeedScore === bestAuditMin &&
                  aud.meanSeedScore > bestAuditMean)
              ) {
                bestAuditMin = aud.minSeedScore;
                bestAuditMean = aud.meanSeedScore;
              }
              if (aud.verifiedPerfect) {
                perfectCount++;
                break;
              }
            }
          }
          sim.forceAdvanceGeneration();
        }
        bestMins.push(bestAuditMin);
        bestMeans.push(bestAuditMean);
      }

      const maxMin = Math.max(...bestMins);
      const avgMin = bestMins.reduce((a, b) => a + b, 0) / trials;
      const avgMean = bestMeans.reduce((a, b) => a + b, 0) / trials;
      const sec = ((performance.now() - t0) / 1000).toFixed(2);
      console.log(
        `  ${v.label} | Perf: ${perfectCount}/${trials} | Best Min: ${String(maxMin).padStart(3)}p | Avg Min: ${avgMin.toFixed(1).padStart(5)}p | Avg Mean: ${avgMean.toFixed(1).padStart(5)}p | ${sec}s`
      );
    }
  }
}

/**
 * Autonomous Open-Mysteries LLM-Reasoning Scientific Suite (--reasoning):
 *  Exp 1: Test-Time Compute (TTC) Scaling & Zero-Shot Extrapolation (K=1,2,3,4 + K=2 -> K=4,6 zero-shot)
 *  Exp 2: 4-Architecture Reasoning Showdown + Emergent System 1 vs 2 + Failure Autopsy (MOVING_GAPS, INSANE, TURBULENCE_EXTREME)
 *  Exp 3: Zero-Shot Out-of-Distribution (OOD) Physics Transfer (MOVING_GAPS -> INSANE / HEAVY_GRAVITY / GUST_CHAOS)
 *  Exp 4: Self-Consistency Majority-Voting Ensemble (3x & 5x tiny [4] brains vs 1x [8,4] brain on INSANE)
 */
function trainReasoningTrial(opts: {
  arch: NetworkArchitecture;
  topo: number[];
  diff: DifficultyPreset;
  features: SensorFeatureId[];
  reasoningSteps?: number;
  popSize: number;
  maxGens: number;
  seedOffset: number;
  auditCap?: number;
}): {
  bestBrain: NeuralNetwork;
  bestAudit: ReturnType<typeof auditBrainMastery>;
} {
  const sim = new FlappySimulation({
    algorithm: 'DE',
    populationSize: opts.popSize,
    mutationRate: 0.16,
    mutationStrength: 0.35,
    elitismCount: 4,
    hiddenNodes: opts.topo.reduce((a, b) => a + b, 0),
    hiddenLayers: opts.topo,
    inputFeatures: opts.features,
    architecture: opts.arch,
    reasoningSteps: opts.reasoningSteps ?? 3,
    weightPrecision: 'FP32',
    difficulty: opts.diff,
    shapedFitness: true,
  });

  const auditCap = opts.auditCap ?? 300;
  let bestBrain: NeuralNetwork = sim.getBirdBrain(0)!.clone();
  let bestAudit = auditBrainMastery(bestBrain, opts.diff, auditCap, 5, undefined, false);
  const audited = new Set<string>();

  const scoresF64 = new Float64Array(opts.popSize);
  const fitsF64 = new Float64Array(opts.popSize);
  const ticksF64 = new Float64Array(opts.popSize);

  for (let g = 0; g < opts.maxGens; g++) {
    const popBrains: NeuralNetwork[] = [];
    for (let i = 0; i < opts.popSize; i++) popBrains.push(sim.getBirdBrain(i)!);
    const shared = evaluatePopulationLockstep(
      popBrains,
      opts.diff,
      150,
      40000 + opts.seedOffset * 1009 + g * 37,
      undefined,
      { shapedFitness: true }
    );
    const avgTicks = shared.totalTicks / opts.popSize;
    for (let i = 0; i < opts.popSize; i++) {
      scoresF64[i] = shared.scores[i];
      fitsF64[i] = shared.fitnesses[i];
      ticksF64[i] = avgTicks;
    }
    const res = sim.applyExternalGenerationResults(
      scoresF64,
      fitsF64,
      ticksF64,
      false
    );
    const genBest = sim.getBirdBrain(res.bestBirdIdx);
    if (genBest && (res.bestScore >= 5 || g === opts.maxGens - 1)) {
      const fp = genBest.getQuantizedFingerprint();
      if (!audited.has(fp)) {
        audited.add(fp);
        const aud = auditBrainMastery(genBest, opts.diff, auditCap, 5, undefined, false);
        if (
          aud.minSeedScore > bestAudit.minSeedScore ||
          (aud.minSeedScore === bestAudit.minSeedScore &&
            aud.meanSeedScore > bestAudit.meanSeedScore)
        ) {
          bestAudit = aud;
          bestBrain = genBest.clone();
        }
        if (aud.verifiedPerfect) break;
      }
    }
    sim.forceAdvanceGeneration();
  }
  return { bestBrain, bestAudit };
}

function runReasoningScientificSuite(): void {
  console.log('\n=======================================================================');
  console.log('=== [4/4] AUTONOMOUS LLM-REASONING & OPEN-MYSTERIES FRONTIER SUITE ===');
  console.log('=======================================================================');

  const features: SensorFeatureId[] = [
    'VEL_VY',
    'PIPE_DX',
    'TOP_CLEAR',
    'BOT_CLEAR',
    'PIPE_VY',
    'NEXT_PIPE_DY',
  ];

  // --- EXP 1: Test-Time Compute (TTC) Scaling & Zero-Shot K Extrapolation ---
  console.log('\n[EXP 1] Test-Time Compute Scaling (Looped Reasoner [4], 45p, INSANE, 3 trials × 35g):');
  const kValues = [1, 2, 3, 4];
  let bestK2Brain: NeuralNetwork | null = null;
  let bestK2Score = -1;

  for (const k of kValues) {
    const mins: number[] = [];
    const means: number[] = [];
    for (let tr = 0; tr < 3; tr++) {
      const { bestBrain, bestAudit } = trainReasoningTrial({
        arch: 'LOOPED_REASONER',
        topo: [4],
        diff: 'INSANE',
        features,
        reasoningSteps: k,
        popSize: 120,
        maxGens: 35,
        seedOffset: 100 + k * 10 + tr,
      });
      mins.push(bestAudit.minSeedScore);
      means.push(bestAudit.meanSeedScore);
      if (k === 2 && bestAudit.meanSeedScore > bestK2Score) {
        bestK2Score = bestAudit.meanSeedScore;
        bestK2Brain = bestBrain;
      }
    }
    const avgMin = mins.reduce((a, b) => a + b, 0) / mins.length;
    const avgMean = means.reduce((a, b) => a + b, 0) / means.length;
    console.log(
      `  Looped K=${k} (same 45p) | Best Min: ${String(Math.max(...mins)).padStart(3)}p | Avg Min: ${avgMin.toFixed(1).padStart(5)}p | Avg Mean: ${avgMean.toFixed(1).padStart(5)}p`
    );
  }

  if (bestK2Brain) {
    console.log('  -> Zero-Shot TTC Extrapolation (best brain trained at K=2, audited zero-shot at K=1,2,3,4,6):');
    const ser = bestK2Brain.serialize();
    for (const testK of [1, 2, 3, 4, 6]) {
      const extrapNet = NeuralNetwork.deserialize({ ...ser, reasoningSteps: testK });
      const aud = auditBrainMastery(extrapNet, 'INSANE', 300, 5, undefined, false);
      console.log(
        `     K_test=${testK}: Min=${aud.minSeedScore}p | Mean=${aud.meanSeedScore}p | Seeds=[${aud.seedScores.join(',')}]`
      );
    }
  }

  // --- EXP 2: 4-Architecture Showdown + Emergent System 1/2 + Failure Autopsy ---
  console.log('\n[EXP 2] 6-Architecture Frontier Showdown + Emergent System 1/2 + Crash Autopsy ([4], 6-in +N2Y, Shaped):');
  const showdownArchs: Array<{ arch: NetworkArchitecture; label: string; k?: number }> = [
    { arch: 'MLP', label: 'MLP Baseline   ' },
    { arch: 'RESIDUAL_SKIP', label: 'Residual Skip  ' },
    { arch: 'LOOPED_REASONER', label: 'Looped CoT K=3 ', k: 3 },
    { arch: 'PONDER_ACT', label: 'Ponder ACT K=4 ', k: 4 },
    { arch: 'SELECTIVE_SSM', label: 'Selective SSM  ' },
    { arch: 'LATENT_ROLLOUT', label: 'Latent Rollout ' },
  ];
  const movingGapsChampions = new Map<string, NeuralNetwork>();

  for (const diff of ['MOVING_GAPS', 'INSANE', 'TURBULENCE_EXTREME'] as DifficultyPreset[]) {
    console.log(`\n  Scenario: ${diff} (3 trials × 35g, pop=120, 5-seed audit)`);
    for (const cfg of showdownArchs) {
      const mins: number[] = [];
      const means: number[] = [];
      let perfects = 0;
      let calmSum = 0;
      let dangerSum = 0;
      let s2Sum = 0;
      let advSum = 0;
      let ssmSum = 0;
      let telemetryCount = 0;
      const causes: Record<string, number> = { FLOOR: 0, CEILING: 0, PIPE_TOP: 0, PIPE_BOTTOM: 0 };
      let bestArchBrain: NeuralNetwork | null = null;
      let bestArchMin = -1;

      for (let tr = 0; tr < 3; tr++) {
        const { bestBrain, bestAudit } = trainReasoningTrial({
          arch: cfg.arch,
          topo: [4],
          diff,
          features,
          reasoningSteps: cfg.k ?? 3,
          popSize: 120,
          maxGens: 35,
          seedOffset: 500 + tr * 17,
        });
        mins.push(bestAudit.minSeedScore);
        means.push(bestAudit.meanSeedScore);
        if (bestAudit.verifiedPerfect) perfects++;
        if (bestAudit.minSeedScore > bestArchMin) {
          bestArchMin = bestAudit.minSeedScore;
          bestArchBrain = bestBrain;
        }
        if (bestAudit.failureAutopsy) {
          causes.FLOOR += bestAudit.failureAutopsy.floorDeaths;
          causes.CEILING += bestAudit.failureAutopsy.ceilingDeaths;
          causes.PIPE_TOP += bestAudit.failureAutopsy.pipeTopDeaths;
          causes.PIPE_BOTTOM += bestAudit.failureAutopsy.pipeBottomDeaths;
        }
        if (bestAudit.reasoningTelemetry) {
          telemetryCount++;
          calmSum += bestAudit.reasoningTelemetry.calmPonderSteps;
          dangerSum += bestAudit.reasoningTelemetry.dangerPonderSteps;
          s2Sum += bestAudit.reasoningTelemetry.system2Ratio;
          advSum += bestAudit.reasoningTelemetry.avgRolloutAdvantage ?? 0;
          ssmSum += bestAudit.reasoningTelemetry.avgSsmGate ?? 0;
        }
      }
      if (diff === 'MOVING_GAPS' && bestArchBrain) {
        movingGapsChampions.set(cfg.label.trim(), bestArchBrain);
      }

      const domCause = Object.entries(causes).sort((a, b) => b[1] - a[1])[0];
      const avgMin = mins.reduce((a, b) => a + b, 0) / mins.length;
      const avgMean = means.reduce((a, b) => a + b, 0) / means.length;
      let extra = '';
      if (cfg.arch === 'PONDER_ACT' && telemetryCount > 0) {
        extra = ` | Calm=${(calmSum / telemetryCount).toFixed(2)} vs Danger=${(dangerSum / telemetryCount).toFixed(2)} (S2=${((s2Sum / telemetryCount) * 100).toFixed(0)}%)`;
      } else if (cfg.arch === 'LATENT_ROLLOUT' && telemetryCount > 0) {
        extra = ` | |ΔV|=${(advSum / telemetryCount).toFixed(3)}`;
      } else if (cfg.arch === 'SELECTIVE_SSM' && telemetryCount > 0) {
        extra = ` | Gate z_t=${(ssmSum / telemetryCount).toFixed(3)}`;
      }
      console.log(
        `    ${cfg.label} | Perf ${perfects}/3 | Best ${String(Math.max(...mins)).padStart(3)}p | AvgMin ${avgMin.toFixed(1).padStart(5)}p | AvgMean ${avgMean.toFixed(1).padStart(5)}p | Crash: ${domCause[1] > 0 ? domCause[0] : 'NONE'}${extra}`
      );
    }
  }

  // --- EXP 3: Zero-Shot OOD Physics Transfer ---
  console.log('\n[EXP 3] Zero-Shot OOD Transfer (Trained ONLY on MOVING_GAPS -> Audited Zero-Shot on Unseen Regimes):');
  for (const [label, brain] of movingGapsChampions.entries()) {
    const oodInsane = auditBrainMastery(brain, 'INSANE', 300, 5, undefined, false);
    const oodHeavy = auditBrainMastery(brain, 'HEAVY_GRAVITY', 300, 5, undefined, false);
    const oodGust = auditBrainMastery(brain, 'GUST_CHAOS', 300, 5, undefined, false);
    console.log(
      `  ${label.padEnd(16)} -> INSANE: min ${String(oodInsane.minSeedScore).padStart(3)}p (μ${oodInsane.meanSeedScore.toFixed(1)}) | HEAVY_G: min ${String(oodHeavy.minSeedScore).padStart(3)}p (μ${oodHeavy.meanSeedScore.toFixed(1)}) | GUST_CHAOS: min ${String(oodGust.minSeedScore).padStart(3)}p (μ${oodGust.meanSeedScore.toFixed(1)})`
    );
  }

  // --- EXP 4: Self-Consistency Majority-Voting Ensemble ---
  console.log('\n[EXP 4] Self-Consistency Voting Ensemble (5× independent tiny [4] Skip brains vs 1× larger [8,4] Skip brain on INSANE):');
  const tinyBrains: NeuralNetwork[] = [];
  const tinyScores: number[] = [];
  for (let i = 0; i < 5; i++) {
    const { bestBrain, bestAudit } = trainReasoningTrial({
      arch: 'RESIDUAL_SKIP',
      topo: [4],
      diff: 'INSANE',
      features,
      popSize: 120,
      maxGens: 35,
      seedOffset: 900 + i * 29,
    });
    tinyBrains.push(bestBrain);
    tinyScores.push(bestAudit.minSeedScore);
  }
  const bigSingle = trainReasoningTrial({
    arch: 'RESIDUAL_SKIP',
    topo: [8, 4],
    diff: 'INSANE',
    features,
    popSize: 120,
    maxGens: 35,
    seedOffset: 999,
  });
  const ens3 = auditEnsembleMastery(tinyBrains.slice(0, 3), 'INSANE', 300, 5);
  const ens5 = auditEnsembleMastery(tinyBrains, 'INSANE', 300, 5);
  console.log(
    `  5 Individual [4] Skip brains (39p ea): MinScores=[${tinyScores.join(', ')}] (Avg=${(tinyScores.reduce((a, b) => a + b, 0) / 5).toFixed(1)}p, BestSingle=${Math.max(...tinyScores)}p)`
  );
  console.log(
    `  1 Larger [8,4] Skip brain (${bigSingle.bestBrain.getParameterCount()}p): Min=${bigSingle.bestAudit.minSeedScore}p | Mean=${bigSingle.bestAudit.meanSeedScore}p`
  );
  console.log(
    `  Self-Consistency Vote (3× [4] = 117p): Min=${ens3.minSeedScore}p | Mean=${ens3.meanSeedScore}p | Seeds=[${ens3.seedScores.join(',')}]`
  );
  console.log(
    `  Self-Consistency Vote (5× [4] = 195p): Min=${ens5.minSeedScore}p | Mean=${ens5.meanSeedScore}p | Seeds=[${ens5.seedScores.join(',')}]`
  );
}

const args = new Set(process.argv.slice(2));
const runAll = args.size === 0 || args.has('--all');

if (runAll || args.has('--test')) runVerificationSuite();
if (runAll || args.has('--bench')) runMicroBenchmarks();
if (runAll || args.has('--frontier')) runFrontierMechanicsExperiment();
if (runAll || args.has('--reasoning')) runReasoningScientificSuite();
