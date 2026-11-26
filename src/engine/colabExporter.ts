/**
 * 1-Click Google Colab CUDA C++ Notebook (.ipynb) Exporter.
 *
 * Uses an O(1)-memory Factorized Lazy Trial Generator inside the notebook so even
 * 10,000,000+ trial Cartesian grids export in <20ms into a compact ~120 KB .ipynb
 * file without ever triggering browser JSON/array allocation size overflows.
 *
 * The generated self-contained Jupyter Notebook:
 * 1. Verifies Colab GPU (T4 / L4 / A100) and optionally mounts Google Drive for checkpoints.
 * 2. Embeds the compact factorized ResearchSweepConfig + SmartPrune rules + delta skipSignatures,
 *    with simple top-of-cell controls for START_TRIAL / END_TRIAL / MAX_RUNTIME_MINUTES.
 * 3. Compiles our native dual-target CUDA C++ / OpenMP engine (~8s via nvcc).
 * 4. Runs a 5-second Pre-Flight Smoke Test, Parity Check & GPU Batch Size Auto-Tuner.
 * 5. Lazily streams batches with a rich live Progress Bar (tqdm + telemetry) & checkpoints.
 * 6. Exports and auto-downloads a 100% NeuroLab-compatible JSON dataset + Performance Log.
 */

import { COLAB_CUDA_ENGINE_SOURCE } from './colabCudaSource';
import { resolveMorphogenesisConfig } from './morphogenesis';
import {
  calculateParameterCount,
  calculateTopologyBreakdown,
  formatTopologyLabel,
  getTrialComputeProfile,
  normalizeHiddenLayers,
  WEIGHT_PRECISION_META,
} from './neuralNetwork';
import { DIFFICULTY_SETTINGS, resolveEnvironment } from './physics';
import { buildTrialSignature, getResultSignature } from './researchStorage';
import {
  CLASSIC_5_SENSOR_FEATURES,
  formatInputSubsetKey,
  formatInputSubsetLabel,
  getInputFeatureIndices,
  isClassic5SensorSet,
  normalizeInputFeatures,
} from './sensors';
import {
  analyzeSmartPrune,
  createSmartPruneContext,
  getAllActiveTopologies,
  getTrialPruneReason,
  isBlindSensorSubset,
} from './smartPrune';
import { buildSweepGridPlan, computeRemainingTrialsCount } from './trialGrid';
import type {
  ComputeProfileKind,
  DifficultyPreset,
  EnvironmentConfig,
  EvolutionTopologyMode,
  LearningAlgorithm,
  NetworkArchitecture,
  ResearchSweepConfig,
  ResearchTrialResult,
  SensorFeatureId,
  WeightPrecision,
} from './types';

export type ColabExportScope = 'REMAINING' | 'FULL';

export interface ColabExportOptions {
  scope: ColabExportScope;
  cachedResults?: readonly ResearchTrialResult[];
  runLabel?: string;
  maxRuntimeMinutes?: number;
  checkpointEvery?: number;
}

export interface ColabTrialExportSpec {
  signature: string;
  algorithm: LearningAlgorithm;
  difficulty: DifficultyPreset;
  architecture: NetworkArchitecture;
  evolutionTopologyMode?: EvolutionTopologyMode;
  computeProfile?: ComputeProfileKind;
  weightPrecision: WeightPrecision;
  topology: number[];
  topologyLabel: string;
  inputFeatures: SensorFeatureId[];
  inputSetLabel: string;
  inputIndices: number[];
  populationSize: number;
  mutationRate: number;
  mutationStrength: number;
  parameterCount: number;
  bitsPerParam: number;
  totalBits: number;
  morphogenesisMode?: 'STATIC' | 'GROWING';
  env: EnvironmentConfig;
}

export interface ColabNotebookSummary {
  notebookJson: string;
  filename: string;
  exportedTrialsCount: number;
  skippedCachedCount: number;
  prunedCount: number;
}

/**
 * Expands a bounded sweep config into explicit trial specs (capped for safety so callers
 * can never trigger browser OOM on multi-million-trial grids).
 */
export function buildColabTrialSpecs(
  cfg: ResearchSweepConfig,
  scope: ColabExportScope,
  cachedResults: readonly ResearchTrialResult[] = [],
  maxItems = 50000
): {
  trials: ColabTrialExportSpec[];
  skippedCachedCount: number;
  prunedCount: number;
  truncated: boolean;
} {
  const plan = buildSweepGridPlan(cfg);
  const pruneCtx = createSmartPruneContext(cfg);
  const cachedSigs =
    scope === 'REMAINING'
      ? new Set(cachedResults.map((r) => getResultSignature(r)))
      : new Set<string>();

  const algos = Array.from(new Set(cfg.algorithms));
  const diffs = Array.from(new Set(cfg.difficulties));
  const pops = Array.from(new Set(cfg.populationSizes));
  const rates = Array.from(new Set(cfg.mutationRates));
  const strs = Array.from(new Set(cfg.mutationStrengths));
  const reasoningSteps = cfg.reasoningSteps ?? 3;
  const morphModes: Array<'STATIC' | 'GROWING'> =
    cfg.morphogenesisMode === 'PAIRED_AB'
      ? ['STATIC', 'GROWING']
      : cfg.morphogenesisMode === 'GROWING'
        ? ['GROWING']
        : ['STATIC'];

  const trials: ColabTrialExportSpec[] = [];
  let skippedCachedCount = 0;
  let truncated = false;

  outer: for (let ai = 0; ai < algos.length; ai++) {
    const algorithm = algos[ai];
    for (let di = 0; di < diffs.length; di++) {
      const difficulty = diffs[di];
      const env = resolveEnvironment(difficulty, cfg.customEnvironment);
      for (let si = 0; si < plan.validShapes.length; si++) {
        const sh = plan.validShapes[si];
        const cleanInputs = normalizeInputFeatures(sh.inFeats);
        const inputIndices = getInputFeatureIndices(cleanInputs);
        const inputSetLabel = formatInputSubsetLabel(cleanInputs);
        const topoLabel = formatTopologyLabel(sh.topo, cleanInputs.length);
        const breakdown = calculateTopologyBreakdown(
          sh.topo,
          cleanInputs.length,
          1,
          sh.arch
        );

        for (let pi = 0; pi < plan.weightPrecisions.length; pi++) {
          const weightPrecision = plan.weightPrecisions[pi];
          const bitsPerParam = WEIGHT_PRECISION_META[weightPrecision].bitsPerParam;
          const totalBits = Math.max(
            1,
            Math.round(breakdown.parameterCount * bitsPerParam)
          );

          for (let popI = 0; popI < pops.length; popI++) {
            const populationSize = pops[popI];
            for (let rI = 0; rI < rates.length; rI++) {
              const mutationRate = rates[rI];
              if (
                getTrialPruneReason(pruneCtx, {
                  algorithm,
                  difficulty,
                  architecture: sh.arch,
                  topology: sh.topo,
                  inputFeatures: cleanInputs,
                  mutationRate,
                }) !== null
              ) {
                continue;
              }
              for (let sI = 0; sI < strs.length; sI++) {
                const mutationStrength = strs[sI];
                for (let mi = 0; mi < morphModes.length; mi++) {
                  const morphogenesisMode = morphModes[mi];
                  const evoMode: EvolutionTopologyMode =
                    cfg.evolutionTopologyMode ?? 'SINGLE_SPECIES';
                  const sig = buildTrialSignature({
                    algorithm,
                    difficulty,
                    topology: sh.topo,
                    inputFeatures: cleanInputs,
                    architecture: sh.arch,
                    weightPrecision,
                    populationSize,
                    mutationRate,
                    mutationStrength,
                    targetPipeCap: cfg.targetPipeCap,
                    verificationSeeds: cfg.verificationSeeds,
                    curriculumLearning: Boolean(cfg.curriculumLearning),
                    shapedFitness: Boolean(cfg.shapedFitness),
                    reasoningSteps,
                    morphogenesisMode,
                    evolutionTopologyMode: evoMode,
                  });

                  if (cachedSigs.has(sig)) {
                    skippedCachedCount += 1;
                    continue;
                  }

                  if (trials.length >= maxItems) {
                    truncated = true;
                    break outer;
                  }

                  trials.push({
                    signature: sig,
                    algorithm,
                    difficulty,
                    architecture: sh.arch,
                    evolutionTopologyMode: evoMode,
                    computeProfile: getTrialComputeProfile(sh.arch, evoMode),
                    weightPrecision,
                    topology: [...sh.topo],
                    topologyLabel: topoLabel,
                    inputFeatures: cleanInputs,
                    inputSetLabel,
                    inputIndices,
                    populationSize,
                    mutationRate,
                    mutationStrength,
                    parameterCount: breakdown.parameterCount,
                    bitsPerParam,
                    totalBits,
                    morphogenesisMode,
                    env,
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  return {
    trials,
    skippedCachedCount,
    prunedCount: plan.pruneSummary.prunedTotal,
    truncated,
  };
}

/**
 * Collects ONLY the cached trial signatures that actually match the active grid in
 * O(cachedResults.length) time — completely independent of total planned grid size!
 */
function collectMatchingCachedSignatures(
  cfg: ResearchSweepConfig,
  cachedResults: readonly ResearchTrialResult[]
): string[] {
  if (cachedResults.length === 0) return [];
  const plan = buildSweepGridPlan(cfg);
  const pruneCtx = createSmartPruneContext(cfg);

  const algoSet = new Set(cfg.algorithms);
  const diffSet = new Set(cfg.difficulties);
  const precSet = new Set<string>(plan.weightPrecisions);
  const popSet = new Set(cfg.populationSizes);
  const rateSet = new Set(cfg.mutationRates);
  const strSet = new Set(cfg.mutationStrengths);
  const wantCurr = Boolean(cfg.curriculumLearning);
  const wantShape = Boolean(cfg.shapedFitness);
  const wantReasoningK =
    cfg.reasoningSteps !== undefined && cfg.reasoningSteps !== 3
      ? cfg.reasoningSteps
      : undefined;
  const morphModes: Array<'STATIC' | 'GROWING'> =
    cfg.morphogenesisMode === 'PAIRED_AB'
      ? ['STATIC', 'GROWING']
      : cfg.morphogenesisMode === 'GROWING'
        ? ['GROWING']
        : ['STATIC'];
  const morphModeSet = new Set<'STATIC' | 'GROWING'>(morphModes);

  const validShapeMap = new Map<
    string,
    { topo: number[]; inFeats: SensorFeatureId[] }
  >();
  for (let i = 0; i < plan.validShapes.length; i++) {
    const sh = plan.validShapes[i];
    validShapeMap.set(`${sh.arch}|${sh.inKey}|${sh.topoLabel}`, {
      topo: sh.topo,
      inFeats: sh.inFeats,
    });
  }

  const matched = new Set<string>();
  const cap = cfg.targetPipeCap;
  const seeds = cfg.verificationSeeds;
  const wantEvoMode: EvolutionTopologyMode =
    cfg.evolutionTopologyMode ?? 'SINGLE_SPECIES';

  for (let i = 0; i < cachedResults.length; i++) {
    const r = cachedResults[i];
    const rMorph: 'STATIC' | 'GROWING' =
      r.morphogenesisMode === 'GROWING' ? 'GROWING' : 'STATIC';
    const rEvoMode: EvolutionTopologyMode =
      r.evolutionTopologyMode ?? 'SINGLE_SPECIES';
    if (
      r.targetPipeCap !== cap ||
      r.verificationSeeds !== seeds ||
      Boolean(r.curriculumLearning) !== wantCurr ||
      Boolean(r.shapedFitness) !== wantShape ||
      !morphModeSet.has(rMorph) ||
      rEvoMode !== wantEvoMode ||
      !rateSet.has(r.mutationRate) ||
      !algoSet.has(r.algorithm) ||
      !diffSet.has(r.difficulty) ||
      !precSet.has(r.weightPrecision ?? 'FP32') ||
      !popSet.has(r.populationSize) ||
      !strSet.has(r.mutationStrength)
    ) {
      continue;
    }
    const inKey = formatInputSubsetKey(r.inputFeatures);
    const arch = r.architecture ?? 'MLP';
    if (arch === 'LOOPED_REASONER' || arch === 'PONDER_ACT') {
      const resK =
        r.reasoningSteps !== undefined && r.reasoningSteps !== 3
          ? r.reasoningSteps
          : undefined;
      if (resK !== wantReasoningK) continue;
    }
    const shape = validShapeMap.get(`${arch}|${inKey}|${r.topologyLabel}`);
    if (!shape) continue;
    if (
      getTrialPruneReason(pruneCtx, {
        algorithm: r.algorithm,
        difficulty: r.difficulty,
        architecture: arch,
        topology: shape.topo,
        inputFeatures: shape.inFeats,
        mutationRate: r.mutationRate,
      }) !== null
    ) {
      continue;
    }
    matched.add(getResultSignature(r));
  }

  return Array.from(matched);
}

function toNotebookLines(code: string): string[] {
  const raw = code.split('\n');
  return raw.map((line, i) => (i < raw.length - 1 ? `${line}\n` : line));
}

export function buildColabNotebook(
  cfg: ResearchSweepConfig,
  options: ColabExportOptions
): ColabNotebookSummary {
  const pruneSummary = analyzeSmartPrune(cfg);
  const pruneCtx = createSmartPruneContext(cfg);
  const totalActiveTrials = pruneSummary.activeTrials;
  const prunedCount = pruneSummary.prunedTotal;

  const cachedResults = options.cachedResults ?? [];
  const skipSignatures =
    options.scope === 'REMAINING' && cachedResults.length > 0
      ? collectMatchingCachedSignatures(cfg, cachedResults)
      : [];
  const remainingCount =
    options.scope === 'REMAINING' && cachedResults.length > 0
      ? computeRemainingTrialsCount(cfg, cachedResults)
      : totalActiveTrials;
  const skippedCachedCount = Math.max(0, totalActiveTrials - remainingCount);
  const exportedTrialsCount =
    options.scope === 'REMAINING' ? remainingCount : totalActiveTrials;

  const runLabel =
    (options.runLabel && options.runLabel.trim()) ||
    `NeuroLab-Colab-${new Date().toISOString().slice(0, 10)}`;
  const maxRuntimeMin = options.maxRuntimeMinutes ?? 55;
  const checkpointEvery = options.checkpointEvery ?? 50;

  // Deduplicate factorized grid axes (O(1) size even for 100,000,000+ Cartesian trials!)
  const evoTopologyMode: EvolutionTopologyMode =
    cfg.evolutionTopologyMode ?? 'SINGLE_SPECIES';
  const algos = Array.from(new Set(cfg.algorithms));
  const diffs = Array.from(new Set(cfg.difficulties));
  const rawArchs: NetworkArchitecture[] =
    cfg.architectures && cfg.architectures.length > 0
      ? Array.from(new Set(cfg.architectures))
      : ['MLP'];
  const archs: NetworkArchitecture[] =
    evoTopologyMode === 'ISLAND_SPECIATION'
      ? [rawArchs.includes('HYBRID_MOE') ? 'HYBRID_MOE' : rawArchs[0]]
      : rawArchs;
  const precs: WeightPrecision[] =
    cfg.weightPrecisions && cfg.weightPrecisions.length > 0
      ? Array.from(new Set(cfg.weightPrecisions))
      : ['FP32'];
  const pops = Array.from(new Set(cfg.populationSizes));
  const rates = Array.from(new Set(cfg.mutationRates));
  const strs = Array.from(new Set(cfg.mutationStrengths));

  const rawInputSets =
    cfg.inputFeatureSets && cfg.inputFeatureSets.length > 0
      ? cfg.inputFeatureSets
      : [[...CLASSIC_5_SENSOR_FEATURES]];
  const uniqueInputMetas: {
    feats: SensorFeatureId[];
    inKey: string;
    inSuffix: string;
    isBlind: boolean;
    hasPvyWithoutKey: boolean;
  }[] = [];
  const seenInKeys = new Set<string>();
  for (let i = 0; i < rawInputSets.length; i++) {
    const clean = normalizeInputFeatures(rawInputSets[i]);
    const inKey = formatInputSubsetKey(clean);
    if (seenInKeys.has(inKey)) continue;
    seenInKeys.add(inKey);
    const withoutPvy = clean.filter(
      (f) => f !== 'PIPE_VY' && f !== 'NEXT_PIPE_VY'
    );
    const hasPvyWithoutKey =
      (clean.includes('PIPE_VY') || clean.includes('NEXT_PIPE_VY')) &&
      withoutPvy.length > 0 &&
      pruneCtx.inputKeySet.has(formatInputSubsetKey(withoutPvy));
    uniqueInputMetas.push({
      feats: clean,
      inKey,
      inSuffix: isClassic5SensorSet(clean) ? '' : `|in:${inKey}`,
      isBlind: isBlindSensorSubset(clean),
      hasPvyWithoutKey,
    });
  }

  const allConfiguredTopos = getAllActiveTopologies(cfg);
  const uniqueTopos: number[][] = [];
  const seenTopoKeys = new Set<string>();
  for (let i = 0; i < allConfiguredTopos.length; i++) {
    const clean = normalizeHiddenLayers(allConfiguredTopos[i]);
    const tk = clean.join('x');
    if (seenTopoKeys.has(tk)) continue;
    seenTopoKeys.add(tk);
    // Keep only topologies that pass maxParameters for at least one (arch, inputSet)
    const maxP = cfg.maxParameters !== undefined ? cfg.maxParameters : null;
    if (maxP !== null) {
      let anyValid = false;
      outerCheck: for (let a = 0; a < archs.length; a++) {
        for (let ii = 0; ii < uniqueInputMetas.length; ii++) {
          if (
            calculateParameterCount(
              clean,
              uniqueInputMetas[ii].feats.length,
              1,
              archs[a]
            ) <= maxP
          ) {
            anyValid = true;
            break outerCheck;
          }
        }
      }
      if (!anyValid) continue;
    }
    uniqueTopos.push(clean);
  }

  const normalizedProtocol: ResearchSweepConfig = {
    ...cfg,
    topologies: uniqueTopos,
    inputFeatureSets: uniqueInputMetas.map((m) => m.feats),
    architectures: archs,
    weightPrecisions: precs,
    evolutionTopologyMode: evoTopologyMode,
  };

  const morphModes: Array<'STATIC' | 'GROWING'> =
    cfg.morphogenesisMode === 'PAIRED_AB'
      ? ['STATIC', 'GROWING']
      : cfg.morphogenesisMode === 'GROWING'
        ? ['GROWING']
        : ['STATIC'];

  // Factorized compact Grid Spec (<20 KB even for 50,000,000 trials!)
  const gridSpec = {
    algorithms: algos,
    difficulties: diffs,
    architectures: archs,
    weightPrecisions: precs,
    topologies: uniqueTopos,
    inputSets: uniqueInputMetas,
    populationSizes: pops,
    mutationRates: rates.map((r) => [r, String(r)]),
    mutationStrengths: strs.map((s) => [s, String(s)]),
    morphModes,
    evolutionTopologyMode: evoTopologyMode,
    morphogenesisConfig: resolveMorphogenesisConfig(cfg.morphogenesisConfig),
    maxParameters: cfg.maxParameters !== undefined ? cfg.maxParameters : null,
    smartPrune: pruneCtx.enabled,
    hasMlp: pruneCtx.hasMlp,
    canonicalMutationRate: pruneCtx.canonicalMutationRate,
    hasNonBlindInputSet: pruneCtx.hasNonBlindInputSet,
    staticDifficulties: Array.from(pruneCtx.staticDifficulties),
    scheduleMode: cfg.scheduleMode ?? 'BALANCED',
    skipSignatures,
    totalActiveTrials,
    totalExportedTrials: exportedTrialsCount,
    prunedCount,
    skippedCachedCount,
  };

  const cell1Markdown = `# Flappy NeuroLab — Google Colab CUDA C++ GPU Runner

**Eksperyment:** \`${runLabel}\`  
**Zakres eksportu:** \`${options.scope === 'REMAINING' ? 'Delta (tylko brakujące próby)' : 'Pełna aktywna siatka'}\` · **${exportedTrialsCount.toLocaleString()} prób** (pominięto z cache: ${skippedCachedCount.toLocaleString()}, Smart Prune: ${prunedCount.toLocaleString()})

### Szybka instrukcja (3 kroki):
1. W menu Google Colab wybierz **Środowisko wykonawcze → Zmień typ środowiska wykonawczego → GPU (T4 / L4 / A100)** *(w darmowym Colab wybierz **T4 GPU**)*.
2. Kliknij **Środowisko wykonawcze → Uruchom wszystko** (\`Ctrl+F9\`).
3. Po zakończeniu (lub po limicie czasu) Colab automatycznie pobierze plik \`flappy-neurolab-colab-dataset-*.json\` — wczytaj go w aplikacji NeuroLab przyciskiem **Import Colab JSON** (wyniki scalą się bez duplikatów z lokalnym cache).

> **Wskazówka:** Notatnik używa **leniwego generatora O(1) RAM** (działa błyskawicznie nawet dla milionowych siatek). W **Komórce 3** możesz ustawić dokładny zakres (\`START_TRIAL\`, \`END_TRIAL\`) oraz limit czasu \`MAX_RUNTIME_MINUTES\` — kolejność prób jest zbalansowana tak, aby już pierwsza setka pokrywała wszystkie wybrane architektury, trudności i algorytmy.`;

  const cell2GpuCheck = `# @title 1. Weryfikacja GPU, Środowiska i Opcjonalnego Dysku Google
import os, subprocess, platform, multiprocessing, json, time

SAVE_TO_DRIVE = False  # @param {type:"boolean"}
DRIVE_FOLDER = "/content/drive/MyDrive/FlappyNeuroLab"  # @param {type:"string"}

def probe_hardware():
    info = {
        "gpu_available": False,
        "gpu_name": "CPU Only (OpenMP Fallback)",
        "vram_mb": 0,
        "sm_count": 0,
        "compute_cap": "",
        "driver_version": "",
        "nvcc_version": "",
        "cpu_cores": multiprocessing.cpu_count(),
        "platform": platform.platform(),
    }
    try:
        out = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=name,memory.total,compute_cap,driver_version", "--format=csv,noheader,nounits"],
            stderr=subprocess.DEVNULL, text=True
        ).strip()
        if out:
            parts = [p.strip() for p in out.splitlines()[0].split(",")]
            info["gpu_available"] = True
            info["gpu_name"] = parts[0]
            info["vram_mb"] = int(float(parts[1])) if len(parts) > 1 else 0
            info["compute_cap"] = parts[2] if len(parts) > 2 else ""
            info["driver_version"] = parts[3] if len(parts) > 3 else ""
    except Exception:
        pass
    try:
        nv = subprocess.check_output(["nvcc", "--version"], stderr=subprocess.DEVNULL, text=True)
        for line in nv.splitlines():
            if "release" in line.lower():
                info["nvcc_version"] = line.strip()
                break
    except Exception:
        pass
    return info

HW_INFO = probe_hardware()
print("=" * 68)
print(f"GPU        : {HW_INFO['gpu_name']}")
if HW_INFO["gpu_available"]:
    print(f"VRAM / CC  : {HW_INFO['vram_mb']} MB | Compute Capability {HW_INFO['compute_cap']}")
    print(f"CUDA nvcc  : {HW_INFO['nvcc_version']}")
else:
    print("UWAGA      : Brak GPU! Przelacz w Colab: Runtime -> Change runtime type -> T4/L4/A100 GPU")
    print("             Silnik zadziala w trybie OpenMP C++ na CPU, ale znacznie wolniej.")
print(f"CPU Cores  : {HW_INFO['cpu_cores']} vCPUs")
print("=" * 68)

OUTPUT_DIR = "/content" if os.path.isdir("/content") else os.getcwd()
if SAVE_TO_DRIVE:
    try:
        from google.colab import drive
        drive.mount("/content/drive")
        os.makedirs(DRIVE_FOLDER, exist_ok=True)
        OUTPUT_DIR = DRIVE_FOLDER
        print(f"Checkpointy i wynik trafia na Google Drive: {OUTPUT_DIR}")
    except Exception as e:
        print(f"Nie udalo sie zamontowac Google Drive ({e}) — zapis lokalny w {OUTPUT_DIR}")`;

  const cell3Config = `# @title 2. Zakres Zadań, Limity Czasu i Leniwy Generator Siatki (O(1) RAM)
# Możesz edytować poniższe parametry przed uruchomieniem (np. dzieląc sweep na 2 karty Colab!)

START_TRIAL = 0  # @param {type:"integer"}
END_TRIAL = 0  # @param {type:"integer"}  # 0 = do samego konca listy
MAX_RUNTIME_MINUTES = ${maxRuntimeMin}  # @param {type:"number"}
CHECKPOINT_EVERY = ${checkpointEvery}  # @param {type:"integer"}
BATCH_TRIALS = "AUTO"  # @param ["AUTO", "32", "64", "128", "256", "512", "1024"]
AUDIT_PRECISION = "FP32_GPU"  # @param ["FP32_GPU", "FP64_EXACT"]
RUN_LABEL = ${JSON.stringify(runLabel)}  # @param {type:"string"}

PROTOCOL_CONFIG = json.loads(${JSON.stringify(JSON.stringify(normalizedProtocol))})
DIFFICULTY_SETTINGS = json.loads(${JSON.stringify(JSON.stringify(DIFFICULTY_SETTINGS))})
GRID_SPEC = json.loads(${JSON.stringify(JSON.stringify(gridSpec))})

RATE_ACTIVE_ALGOS = {"GA", "DE", "ADAPTIVE_ES"}
STATIC_DIFFS = set(GRID_SPEC["staticDifficulties"])
SKIP_SIGS = set(GRID_SPEC["skipSignatures"])

def calc_param_count(topo, in_count, arch):
    dims = [in_count, *topo, 1]
    base = 0
    for i in range(len(dims) - 1):
        base += dims[i] * dims[i + 1] + dims[i + 1]
    if arch == "MLP":
        extra = 0
    elif arch == "RESIDUAL_SKIP":
        extra = in_count if len(topo) > 0 else 0
    else:
        bio_nodes = max(1, sum(topo))
        last_h = topo[-1] if len(topo) > 0 else 1
        if arch == "LTC_FLY":
            extra = bio_nodes * 2
        elif arch == "NEUROCHEM_GATE":
            extra = bio_nodes * 3
        elif arch == "SYNAPTIC_STP":
            extra = bio_nodes * 2
        elif arch == "LOOPED_REASONER":
            extra = last_h * last_h + last_h * 2
        elif arch == "PONDER_ACT":
            extra = last_h * last_h + last_h * 3 + 1
        elif arch == "SELECTIVE_SSM":
            extra = bio_nodes * 3
        elif arch == "LATENT_ROLLOUT":
            extra = last_h * last_h + last_h * 3
        elif arch == "DROSOPHILA_CONNECTOME":
            extra = bio_nodes * 2 + (in_count if len(topo) > 0 else 0) + 4
        elif arch == "DECOUPLED_FLY_CORTEX":
            extra = bio_nodes * 2 + (in_count if len(topo) > 0 else 0) + 16 + 4
        elif arch == "HYBRID_MOE":
            first_w = topo[0] if len(topo) > 0 else 4
            he = max(3, min(6, first_w))
            router_len = in_count * 4 + 4
            e0_len = in_count * he + he + he + 1 + he * 2 + 1
            e1_len = in_count * he + he + he + 1 + he * 3 + 1
            e2_len = in_count * he + he + he + 1 + (he * he + he * 3 + 1) + 1
            extra = router_len + e0_len + e1_len + e2_len
        else:
            extra = 0
    return base + extra

def format_topo_label(topo, in_count):
    if len(topo) == 0:
        return f"{in_count}\\u21921"
    return f"{in_count}\\u2192" + "\\u2192".join(str(x) for x in topo) + "\\u21921"

def make_trial_signature(algo, diff, topo, inp_meta, arch, prec, pop, mrate_str, mstr_str, morph_mode="STATIC"):
    topo_lbl = format_topo_label(topo, len(inp_meta["feats"]))
    cap = int(PROTOCOL_CONFIG["targetPipeCap"])
    sd = int(PROTOCOL_CONFIG["verificationSeeds"])
    sig = f"{algo}|{diff}|{topo_lbl}|p{pop}|r{mrate_str}|s{mstr_str}|cap{cap}|sd{sd}"
    if inp_meta["inSuffix"]:
        sig += inp_meta["inSuffix"]
    if arch != "MLP":
        sig += f"|arch:{arch}"
    if prec != "FP32":
        sig += f"|prec:{prec}"
    if PROTOCOL_CONFIG.get("curriculumLearning"):
        sig += "|curr"
    if PROTOCOL_CONFIG.get("shapedFitness"):
        sig += "|shape"
    rk = PROTOCOL_CONFIG.get("reasoningSteps")
    if arch in ("LOOPED_REASONER", "PONDER_ACT") and rk is not None and int(rk) != 3:
        sig += f"|k{int(rk)}"
    if morph_mode == "GROWING":
        sig += "|morph"
    if PROTOCOL_CONFIG.get("evolutionTopologyMode") == "ISLAND_SPECIATION":
        sig += "|isl"
    return sig

def iter_all_exported_trials():
    """
    O(1)-RAM lazy generator yielding tuples:
    [signature, algo, diff, arch, prec, topo, feats, pop, mrate, mstr, morph_mode]
    Ordered so arch/diff/algo/morph cycle rapidly on the inner loops — partial runs cover every
    architecture, difficulty, morphogenesis mode, and optimizer evenly without materializing millions of objects.
    """
    max_p = GRID_SPEC["maxParameters"]
    smart = bool(GRID_SPEC["smartPrune"])
    has_mlp = bool(GRID_SPEC["hasMlp"])
    canon_mr = GRID_SPEC["canonicalMutationRate"]
    has_non_blind = bool(GRID_SPEC["hasNonBlindInputSet"])

    precs = GRID_SPEC["weightPrecisions"]
    pops = GRID_SPEC["populationSizes"]
    mstrs = GRID_SPEC["mutationStrengths"]
    mrates = GRID_SPEC["mutationRates"]
    topos = GRID_SPEC["topologies"]
    inps = GRID_SPEC["inputSets"]
    algos = GRID_SPEC["algorithms"]
    diffs = GRID_SPEC["difficulties"]
    archs = GRID_SPEC["architectures"]
    morph_modes = GRID_SPEC.get("morphModes", ["STATIC"])

    for prec in precs:
        for pop in pops:
            for mstr_val, mstr_str in mstrs:
                for mrate_val, mrate_str in mrates:
                    for topo in topos:
                        for inp in inps:
                            if smart and has_non_blind and inp["isBlind"]:
                                continue
                            in_count = len(inp["feats"])
                            for algo in algos:
                                if smart and (algo not in RATE_ACTIVE_ALGOS) and mrate_val != canon_mr:
                                    continue
                                for diff in diffs:
                                    if smart and (diff in STATIC_DIFFS) and inp["hasPvyWithoutKey"]:
                                        continue
                                    for arch in archs:
                                        if smart and arch == "RESIDUAL_SKIP" and len(topo) == 0 and has_mlp:
                                            continue
                                        if max_p is not None and calc_param_count(topo, in_count, arch) > max_p:
                                            continue
                                        for morph_mode in morph_modes:
                                            sig = make_trial_signature(
                                                algo, diff, topo, inp, arch, prec, pop, mrate_str, mstr_str, morph_mode
                                            )
                                            if sig in SKIP_SIGS:
                                                continue
                                            yield [
                                                sig, algo, diff, arch, prec,
                                                topo, inp["feats"], pop, mrate_val, mstr_val, morph_mode
                                            ]

def iter_selected_trials(start_idx, end_idx):
    if CUSTOM_SELECTED_TRIALS is not None:
        for e in CUSTOM_SELECTED_TRIALS:
            yield e
        return
    idx = 0
    for e in iter_all_exported_trials():
        if idx >= end_idx:
            break
        if idx >= start_idx:
            yield e
        idx += 1

CUSTOM_SELECTED_TRIALS = None  # Optional override list for targeted tests
total_available = int(GRID_SPEC["totalExportedTrials"])
slice_start = max(0, min(total_available, int(START_TRIAL)))
slice_end = total_available if int(END_TRIAL) <= 0 else max(slice_start, min(total_available, int(END_TRIAL)))
TOTAL_TO_RUN = max(0, slice_end - slice_start)

EVO_MODE_LABEL = GRID_SPEC.get("evolutionTopologyMode", "SINGLE_SPECIES")
CPU_SPEC_ARCH_SET = {"HYBRID_MOE", "DECOUPLED_FLY_CORTEX"}
HAS_CPU_SPEC_ARCH = any(a in CPU_SPEC_ARCH_SET for a in GRID_SPEC["architectures"]) or EVO_MODE_LABEL == "ISLAND_SPECIATION"
ROUTING_SUMMARY = (
    "CPU_SPECIALIZED -> Host OpenMP C++17 (bypasses CUDA warp divergence)"
    if (EVO_MODE_LABEL == "ISLAND_SPECIATION" or all(a in CPU_SPEC_ARCH_SET for a in GRID_SPEC["architectures"]))
    else ("Hybrid Auto-Route (GPU_LOCKSTEP -> CUDA | CPU_SPECIALIZED -> Host OpenMP)" if HAS_CPU_SPEC_ARCH else "GPU_LOCKSTEP -> Native CUDA Kernel")
)
print(f"Protokol         : {RUN_LABEL}")
print(f"Proby w siatce   : {total_available:,} (Smart Prune usunal {GRID_SPEC['prunedCount']:,}, cache pominal {GRID_SPEC['skippedCachedCount']:,})")
print(f"Wybrany zakres   : [{slice_start:,} .. {slice_end:,}) -> {TOTAL_TO_RUN:,} prob do wykonania (generator O(1) RAM)")
print(f"Limit czasu      : {MAX_RUNTIME_MINUTES} min | Checkpoint co {CHECKPOINT_EVERY} prob | Audyt: {AUDIT_PRECISION}")
print(f"Flagi treningu   : Curriculum={bool(PROTOCOL_CONFIG.get('curriculumLearning'))} | Shaped={bool(PROTOCOL_CONFIG.get('shapedFitness'))} | K={PROTOCOL_CONFIG.get('reasoningSteps', 3)} | Morphogenesis={','.join(GRID_SPEC.get('morphModes', ['STATIC']))} | EvoMode={EVO_MODE_LABEL}")
print(f"Hardware Routing : {ROUTING_SUMMARY}")`;

  const cell4Compile = `# @title 3. Zapis i Kompilacja Natywnego Silnika CUDA C++ (~8s)
import subprocess, time, os, ctypes

CUDA_SOURCE = r'''${COLAB_CUDA_ENGINE_SOURCE}'''

with open("neurolab_cuda.cu", "w", encoding="utf-8") as f:
    f.write(CUDA_SOURCE)

t0 = time.perf_counter()
COMPILE_MODE = "CPU_OPENMP"
LIB_PATH = os.path.abspath("libneurolab.so")

if HW_INFO["gpu_available"] and HW_INFO["nvcc_version"]:
    arch_flags = []
    cc = HW_INFO.get("compute_cap", "").replace(".", "")
    if cc.isdigit() and len(cc) >= 2:
        arch_flags = [f"-arch=sm_{cc}"]
    cmd = [
        "nvcc", "-O3", "-use_fast_math", "-std=c++17",
        *arch_flags,
        "-Xcompiler", "-O3,-fopenmp,-fPIC",
        "-shared", "neurolab_cuda.cu", "-o", LIB_PATH,
    ]
    print("Kompilowanie natywnego jadra CUDA C++:", " ".join(cmd))
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        COMPILE_MODE = "CUDA_GPU"
    else:
        print("Kompilacja nvcc nie powiodla sie, fallback do OpenMP C++:")
        print(res.stderr[-1200:])

if COMPILE_MODE != "CUDA_GPU":
    cmd = [
        "g++", "-O3", "-std=c++17", "-fopenmp", "-fPIC", "-shared",
        "-x", "c++", "neurolab_cuda.cu", "-o", LIB_PATH,
    ]
    print("Kompilowanie silnika OpenMP C++:", " ".join(cmd))
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"Blad kompilacji C++:\\n{res.stderr}")

COMPILE_SEC = round(time.perf_counter() - t0, 2)
LIB = ctypes.CDLL(LIB_PATH)
print(f"Gotowe! Tryb: {COMPILE_MODE} | Czas kompilacji: {COMPILE_SEC}s | CUDA devices: {LIB.neurolab_has_cuda()}")`;

  const cell5BindingsAndPreflight = `# @title 4. Pre-Flight Smoke Test, Parity Check i Auto-Tuner Batcha GPU (~5s)
import ctypes, math, time, json

ALGO_MAP = {"GA": 0, "DE": 1, "PSO": 2, "CMA_HYBRID": 3, "CEM": 4, "ADAPTIVE_ES": 5, "NATURAL_ES": 6, "ADAM_ES": 7}
ARCH_MAP = {
    "MLP": 0, "RESIDUAL_SKIP": 1, "LTC_FLY": 2, "NEUROCHEM_GATE": 3, "SYNAPTIC_STP": 4,
    "LOOPED_REASONER": 5, "PONDER_ACT": 6, "SELECTIVE_SSM": 7, "LATENT_ROLLOUT": 8,
    "HYBRID_MOE": 9, "DROSOPHILA_CONNECTOME": 10, "DECOUPLED_FLY_CORTEX": 11,
}
ARCH_REV_MAP = {v: k for k, v in ARCH_MAP.items()}
EVO_MODE_MAP = {"SINGLE_SPECIES": 0, "ISLAND_SPECIATION": 1}
HYBRID_EXPERT_NAMES = ["LTC_FLY", "SELECTIVE_SSM", "PONDER_ACT"]
PREC_MAP = {"FP32": 0, "FP16": 1, "INT8": 2, "INT4": 3, "TERNARY": 4, "BINARY": 5}
PREC_BITS = {"FP32": 32.0, "FP16": 16.0, "INT8": 8.0, "INT4": 4.0, "TERNARY": 1.585, "BINARY": 1.0}
SENSOR_INDEX = {
    "BIRD_Y": 0, "VEL_VY": 1, "PIPE_DX": 2, "TOP_CLEAR": 3, "BOT_CLEAR": 4,
    "PIPE_VY": 5, "NEXT_PIPE_DY": 6, "NEXT_TOP_CLEAR": 7, "NEXT_BOT_CLEAR": 8,
    "NEXT_PIPE_DX": 9, "NEXT_PIPE_VY": 10, "PIPE_TTF": 11,
}
SENSOR_SHORT = {
    "BIRD_Y": "Y", "VEL_VY": "Vy", "PIPE_DX": "DX", "TOP_CLEAR": "Top", "BOT_CLEAR": "Bot",
    "PIPE_VY": "PVy", "NEXT_PIPE_DY": "N2Y", "NEXT_TOP_CLEAR": "N2Top", "NEXT_BOT_CLEAR": "N2Bot",
    "NEXT_PIPE_DX": "N2DX", "NEXT_PIPE_VY": "N2PVy", "PIPE_TTF": "TTF",
}
STOP_REASONS = {0: "PERFECT", 1: "MAX_GENS", 2: "STAGNATED"}
FAIL_CAUSES = {0: "NONE", 1: "FLOOR", 2: "CEILING", 3: "PIPE_TOP", 4: "PIPE_BOTTOM"}

class EnvParamsC(ctypes.Structure):
    _fields_ = [
        ("gap", ctypes.c_double), ("gapVariance", ctypes.c_double),
        ("pipeSpeed", ctypes.c_double), ("speedVariability", ctypes.c_double),
        ("spawnFrames", ctypes.c_double), ("movingPipes", ctypes.c_int),
        ("moveAmplitude", ctypes.c_double), ("gravityScale", ctypes.c_double),
    ]

class TrialTaskC(ctypes.Structure):
    _fields_ = [
        ("algorithm", ctypes.c_int), ("architecture", ctypes.c_int), ("weightPrecision", ctypes.c_int),
        ("populationSize", ctypes.c_int), ("maxGenerations", ctypes.c_int), ("stagnationLimit", ctypes.c_int),
        ("targetPipeCap", ctypes.c_int), ("verificationSeeds", ctypes.c_int),
        ("curriculumLearning", ctypes.c_int), ("curriculumGenerations", ctypes.c_int),
        ("shapedFitness", ctypes.c_int), ("reasoningSteps", ctypes.c_int),
        ("inputCount", ctypes.c_int), ("inputIndices", ctypes.c_int * 12),
        ("hiddenDepth", ctypes.c_int), ("hiddenLayers", ctypes.c_int * 5),
        ("mutationRate", ctypes.c_double), ("mutationStrength", ctypes.c_double),
        ("env", EnvParamsC), ("trialSeed", ctypes.c_uint32), ("auditFloat32", ctypes.c_int),
        ("morphogenesisEnabled", ctypes.c_int), ("progressiveSensors", ctypes.c_int),
        ("growReasoningSteps", ctypes.c_int), ("growthStagnationTrigger", ctypes.c_int),
        ("initialWidthRatio", ctypes.c_double), ("saturationThreshold", ctypes.c_double),
        ("myelinationScale", ctypes.c_double), ("pruneThreshold", ctypes.c_double),
        ("pruneSparsityTrigger", ctypes.c_double), ("metabolicStepCost", ctypes.c_double),
        ("evolutionTopologyMode", ctypes.c_int), ("flopsPenaltyWeight", ctypes.c_double),
        ("expertTrialWindowGens", ctypes.c_int), ("expertMinRoiGain", ctypes.c_double),
        ("allowExpertSpawning", ctypes.c_int),
    ]

class TrialOutputC(ctypes.Structure):
    _fields_ = [
        ("bestTrainScore", ctypes.c_int), ("minSeedScore", ctypes.c_int),
        ("meanSeedScore", ctypes.c_double), ("verifiedPerfect", ctypes.c_int),
        ("stoppedReason", ctypes.c_int), ("bestFitness", ctypes.c_double),
        ("finalAvgScore", ctypes.c_double), ("generationsRun", ctypes.c_int),
        ("trainingTicks", ctypes.c_uint64), ("auditTicks", ctypes.c_uint64),
        ("paramCount", ctypes.c_int), ("scoreCurveLen", ctypes.c_int),
        ("seedScoresLen", ctypes.c_int), ("durationMs", ctypes.c_double),
        ("totalDeaths", ctypes.c_int), ("floorDeaths", ctypes.c_int), ("ceilingDeaths", ctypes.c_int),
        ("pipeTopDeaths", ctypes.c_int), ("pipeBottomDeaths", ctypes.c_int),
        ("avgDeathAbsVy", ctypes.c_double), ("avgDeathGapErr", ctypes.c_double),
        ("dominantFailure", ctypes.c_int),
        ("hasReasoningTelemetry", ctypes.c_int),
        ("avgPonderSteps", ctypes.c_double), ("calmPonderSteps", ctypes.c_double),
        ("dangerPonderSteps", ctypes.c_double), ("system2Ratio", ctypes.c_double),
        ("avgRolloutAdvantage", ctypes.c_double), ("avgSsmGate", ctypes.c_double),
        ("initialActiveParams", ctypes.c_int), ("finalActiveParams", ctypes.c_int),
        ("prunedSynapses", ctypes.c_int), ("growthEventsCount", ctypes.c_int),
        ("pruneEventsCount", ctypes.c_int), ("finalReasoningSteps", ctypes.c_int),
        ("finalActiveSensors", ctypes.c_int), ("finalHiddenLayers", ctypes.c_int * 5),
        ("computeProfile", ctypes.c_int), ("meanFlopsPerFrame", ctypes.c_double),
        ("rollbackCount", ctypes.c_int), ("committedExpertsCount", ctypes.c_int),
        ("winningSpecies", ctypes.c_int), ("rebalanceCount", ctypes.c_int),
        ("activeExpertsMask", ctypes.c_int),
    ]

class BatchPerfCountersC(ctypes.Structure):
    _fields_ = [
        ("gpuKernelMs", ctypes.c_double), ("hostOptimizerMs", ctypes.c_double),
        ("f64AuditMs", ctypes.c_double), ("totalWallMs", ctypes.c_double),
        ("totalTrainingTicks", ctypes.c_uint64), ("totalAuditTicks", ctypes.c_uint64),
        ("usedCuda", ctypes.c_int),
    ]

LIB.neurolab_run_batch.argtypes = [
    ctypes.c_int, ctypes.POINTER(TrialTaskC), ctypes.POINTER(TrialOutputC),
    ctypes.POINTER(ctypes.c_double), ctypes.c_int,
    ctypes.POINTER(ctypes.c_int), ctypes.c_int,
    ctypes.POINTER(ctypes.c_double), ctypes.c_int,
    ctypes.POINTER(BatchPerfCountersC),
]
LIB.neurolab_run_batch.restype = None

MORPH_CFG = GRID_SPEC.get("morphogenesisConfig", {})

def resolve_env(diff_name):
    if diff_name == "CUSTOM" and PROTOCOL_CONFIG.get("customEnvironment"):
        return PROTOCOL_CONFIG["customEnvironment"]
    return DIFFICULTY_SETTINGS.get(diff_name, DIFFICULTY_SETTINGS["MEDIUM"])

def make_c_task(entry, trial_idx, override_gens=None, override_cap=None, override_seeds=None):
    sig, algo, diff, arch, prec, topo, feats, pop, mrate, mstr, morph_mode = entry
    env = resolve_env(diff)
    max_g = override_gens if override_gens is not None else (PROTOCOL_CONFIG.get("maxGenerations") or 220)
    stag = PROTOCOL_CONFIG.get("stagnationLimit")
    stag_int = int(stag) if stag is not None else 0
    curr_gens = max(8, min(24, round(max_g * 0.4))) if PROTOCOL_CONFIG.get("maxGenerations") else 18
    t = TrialTaskC()
    t.algorithm = ALGO_MAP[algo]
    t.architecture = ARCH_MAP[arch]
    t.weightPrecision = PREC_MAP[prec]
    t.populationSize = int(pop)
    t.maxGenerations = int(max_g)
    t.stagnationLimit = stag_int
    t.targetPipeCap = int(override_cap if override_cap is not None else PROTOCOL_CONFIG["targetPipeCap"])
    t.verificationSeeds = int(override_seeds if override_seeds is not None else PROTOCOL_CONFIG["verificationSeeds"])
    t.curriculumLearning = 1 if PROTOCOL_CONFIG.get("curriculumLearning") else 0
    t.curriculumGenerations = curr_gens
    t.shapedFitness = 1 if PROTOCOL_CONFIG.get("shapedFitness") else 0
    t.reasoningSteps = int(PROTOCOL_CONFIG.get("reasoningSteps") or 3)
    t.inputCount = len(feats)
    for k, fn in enumerate(feats[:12]):
        t.inputIndices[k] = SENSOR_INDEX[fn]
    t.hiddenDepth = len(topo)
    for k, w in enumerate(topo[:5]):
        t.hiddenLayers[k] = int(w)
    t.mutationRate = float(mrate)
    t.mutationStrength = float(mstr)
    t.env = EnvParamsC(
        float(env["gap"]), float(env["gapVariance"]), float(env["pipeSpeed"]),
        float(env["speedVariability"]), float(env["spawnFrames"]),
        1 if env["movingPipes"] else 0, float(env["moveAmplitude"]), float(env["gravityScale"]),
    )
    t.trialSeed = (2654435761 * (trial_idx + 1) + 1337) & 0xFFFFFFFF
    t.auditFloat32 = 1 if AUDIT_PRECISION == "FP32_GPU" else 0
    t.morphogenesisEnabled = 1 if morph_mode == "GROWING" else 0
    t.progressiveSensors = 1 if MORPH_CFG.get("progressiveSensors", True) else 0
    t.growReasoningSteps = 1 if MORPH_CFG.get("growReasoningSteps", True) else 0
    t.growthStagnationTrigger = int(MORPH_CFG.get("growthStagnationTrigger", 10))
    t.initialWidthRatio = float(MORPH_CFG.get("initialWidthRatio", 0.5))
    t.saturationThreshold = float(MORPH_CFG.get("saturationThreshold", 0.62))
    t.myelinationScale = float(MORPH_CFG.get("myelinationScale", 0.25))
    t.pruneThreshold = float(MORPH_CFG.get("pruneThreshold", 0.06))
    t.pruneSparsityTrigger = float(MORPH_CFG.get("pruneSparsityTrigger", 0.28))
    t.metabolicStepCost = float(MORPH_CFG.get("metabolicStepCost", 0.015))
    evo_mode = PROTOCOL_CONFIG.get("evolutionTopologyMode", "SINGLE_SPECIES")
    t.evolutionTopologyMode = EVO_MODE_MAP.get(evo_mode, 0)
    t.flopsPenaltyWeight = float(MORPH_CFG.get("flopsPenaltyWeight", 0.004))
    t.expertTrialWindowGens = int(MORPH_CFG.get("expertTrialWindowGens", 12))
    t.expertMinRoiGain = float(MORPH_CFG.get("expertMinRoiGain", 1.2))
    t.allowExpertSpawning = 1 if MORPH_CFG.get("allowExpertSpawning", True) else 0
    return t

def unpack_serialized_brain(entry, flat_weights, param_count, final_k=None, winning_species=-1, experts_mask=0):
    sig, algo, diff, arch, prec, topo, feats, pop, mrate, mstr, morph_mode = entry
    actual_arch = ARCH_REV_MAP.get(int(winning_species), arch) if int(winning_species) >= 0 else arch
    in_n = len(feats)
    dims = [in_n, *topo, 1]
    layer_w = []
    layer_b = []
    idx = 0
    for l in range(len(dims) - 1):
        w_len = dims[l] * dims[l + 1]
        b_len = dims[l + 1]
        layer_w.append([round(float(flat_weights[idx + k]), 6) for k in range(w_len)])
        idx += w_len
        layer_b.append([round(float(flat_weights[idx + k]), 6) for k in range(b_len)])
        idx += b_len
    bio_params = [round(float(flat_weights[k]), 6) for k in range(idx, param_count)]
    transitions = len(layer_w)
    is_single = len(topo) <= 1
    brain = {
        "inputNodes": in_n,
        "inputFeatures": list(feats),
        "hiddenNodes": topo[0] if len(topo) == 1 else sum(topo),
        "hiddenLayers": list(topo),
        "outputNodes": 1,
        "weightsIH": layer_w[0] if (is_single and transitions == 2) else [],
        "biasH": layer_b[0] if (is_single and transitions == 2) else [],
        "weightsHO": layer_w[-1],
        "biasO": layer_b[-1],
        "layerWeights": layer_w,
        "layerBiases": layer_b,
    }
    if actual_arch != "MLP":
        brain["architecture"] = actual_arch
    if prec != "FP32":
        brain["weightPrecision"] = prec
    if actual_arch in ("LOOPED_REASONER", "PONDER_ACT", "HYBRID_MOE"):
        brain["reasoningSteps"] = int(final_k if final_k else (PROTOCOL_CONFIG.get("reasoningSteps") or 3))
    if actual_arch == "HYBRID_MOE":
        brain["hybridActiveExperts"] = [HYBRID_EXPERT_NAMES[k] for k in range(3) if (int(experts_mask) & (1 << k))]
    if len(bio_params) > 0:
        brain["bioParams"] = bio_params
    return brain

def classify_dynamic(curve, best_train, min_seed, is_perfect):
    if is_perfect and len(curve) <= 2:
        return "G1_INSTANT"
    if best_train >= 30 and min_seed < best_train * 0.25:
        return "OVERFIT_COLLAPSE"
    if len(curve) >= 8:
        mid = int(len(curve) * 0.55)
        e_max = max(curve[:mid]) if mid > 0 else 0
        l_max = max(curve[mid:]) if mid < len(curve) else 0
        if l_max >= max(15, e_max * 2.4):
            return "PHASE_TRANSITION"
        tail = curve[-5:]
        if (not is_perfect) and (max(tail) - min(tail) <= 2) and (l_max <= e_max + 2):
            return "PLATEAU"
    return "SMOOTH_CLIMB"

def run_c_batch(entries, base_index, override_gens=None, override_cap=None, override_seeds=None):
    n = len(entries)
    max_w = 2048
    max_c = max(512, int(override_gens or PROTOCOL_CONFIG.get("maxGenerations") or 220) + 16)
    max_s = max(32, int(override_seeds or PROTOCOL_CONFIG.get("verificationSeeds") or 4))
    tasks = (TrialTaskC * n)()
    for i, e in enumerate(entries):
        tasks[i] = make_c_task(e, base_index + i, override_gens, override_cap, override_seeds)
    outs = (TrialOutputC * n)()
    w_buf = (ctypes.c_double * (n * max_w))()
    c_buf = (ctypes.c_int * (n * max_c))()
    s_buf = (ctypes.c_double * (n * max_s))()
    perf = BatchPerfCountersC()
    LIB.neurolab_run_batch(n, tasks, outs, w_buf, max_w, c_buf, max_c, s_buf, max_s, ctypes.byref(perf))
    return outs, w_buf, max_w, c_buf, max_c, s_buf, max_s, perf

# --- 1. Pre-Flight Smoke Test across active architectures (O(1) RAM bounded scan) ---
print("Uruchamianie Pre-Flight Smoke Test & Parity Check...")
seen_archs = {}
target_arch_count = len(GRID_SPEC["architectures"])
tuner_pool = []
max_pool = 1024 if HW_INFO.get("vram_mb", 0) >= 20000 else 256
for scanned, e in enumerate(iter_selected_trials(slice_start, slice_end)):
    if len(tuner_pool) < max_pool:
        tuner_pool.append(e)
    if e[3] not in seen_archs:
        seen_archs[e[3]] = e
    if len(seen_archs) >= target_arch_count and len(tuner_pool) >= max_pool:
        break
    if scanned >= 4000:
        break

smoke_entries = list(seen_archs.values())
if smoke_entries:
    s_outs, s_w, s_mw, s_c, s_mc, s_s, s_ms, s_perf = run_c_batch(
        smoke_entries, 0, override_gens=3, override_cap=40, override_seeds=2
    )
    for i, e in enumerate(smoke_entries):
        o = s_outs[i]
        assert math.isfinite(o.bestFitness), f"NaN fitness w architekturze {e[3]}!"
        assert o.paramCount > 0 and o.paramCount <= 2048, f"Nieprawidlowa liczba parametrow {o.paramCount}"
        assert o.trainingTicks > 0 and o.auditTicks > 0, f"Zero tickow w {e[3]}"
        brain = unpack_serialized_brain(
            e, s_w[i * s_mw : (i + 1) * s_mw], o.paramCount,
            winning_species=o.winningSpecies, experts_mask=o.activeExpertsMask
        )
        assert len(brain["layerWeights"]) == len(e[5]) + 1
    print(f"  [PASS] Zweryfikowano {len(smoke_entries)} architektur ({', '.join(seen_archs.keys())}) — 0 NaN, F64 audit OK!")

# --- 2. GPU Batch Auto-Tuner (mierzy realne M ticks/s na tym GPU; wysyca 108 SM na A100!) ---
TUNER_RESULTS = []
CHOSEN_BATCH = 64
if BATCH_TRIALS != "AUTO":
    CHOSEN_BATCH = int(BATCH_TRIALS)
    print(f"Wybrano reczny rozmiar batcha: BATCH_TRIALS = {CHOSEN_BATCH}")
elif len(tuner_pool) > 0:
    if COMPILE_MODE == "CUDA_GPU":
        candidates = [128, 256, 512, 1024] if HW_INFO.get("vram_mb", 0) >= 20000 else [32, 64, 128, 256]
    else:
        candidates = [8, 16]
    best_tps = -1.0
    print("Auto-tuning optymalnego rozmiaru batcha dla tego sprzetu...")
    for bsz in candidates:
        probe_batch = [tuner_pool[k % len(tuner_pool)] for k in range(bsz)]
        _, _, _, _, _, _, _, p = run_c_batch(probe_batch, 9999, override_gens=4, override_cap=50, override_seeds=2)
        total_t = p.totalTrainingTicks + p.totalAuditTicks
        tps_m = (total_t / max(1e-3, p.totalWallMs / 1000.0)) / 1e6
        TUNER_RESULTS.append({"batch": bsz, "ticks_m_per_s": round(tps_m, 2), "wall_ms": round(p.totalWallMs, 1)})
        print(f"  batch={bsz:>4d} -> {tps_m:>6.2f} M ticks/s  (wall={p.totalWallMs:.0f} ms | kernel={p.gpuKernelMs:.0f} ms | opt={p.hostOptimizerMs:.0f} ms | F64={p.f64AuditMs:.0f} ms)")
        if tps_m > best_tps:
            best_tps = tps_m
            CHOSEN_BATCH = bsz
    print(f"  -> Wybrano optymalny batch: BATCH_TRIALS = {CHOSEN_BATCH} ({best_tps:.2f} M ticks/s)")`;

  const cell6Runner = `# @title 5. Uruchomienie Sweepu z Paskiem Postępu na Żywo i Checkpointami
import time, json, os, math
from datetime import datetime, timezone

try:
    from tqdm.auto import tqdm
except ImportError:
    tqdm = None

def fmt_sec(sec):
    sec = max(0, int(round(sec)))
    h, rem = divmod(sec, 3600)
    m, s = divmod(rem, 60)
    if h > 0:
        return f"{h}h {m:02d}m {s:02d}s"
    return f"{m}m {s:02d}s"

def format_trial_result(entry, global_idx, o, w_slice, c_slice, s_slice):
    sig, algo, diff, arch, prec, topo, feats, pop, mrate, mstr, morph_mode = entry
    in_label = "+".join(SENSOR_SHORT[f] for f in feats)
    topo_label = format_topo_label(topo, len(feats))
    bits_pp = PREC_BITS[prec]
    total_bits = max(1, round(o.paramCount * bits_pp))
    best_train = int(o.bestTrainScore)
    min_seed = int(o.minSeedScore)
    mean_seed = round(float(o.meanSeedScore), 1)
    is_perfect = bool(o.verifiedPerfect)
    effective_score = max(best_train, min_seed)
    total_ticks = int(o.trainingTicks + o.auditTicks)
    dur_ms = max(1, round(float(o.durationMs)))
    tps = round(total_ticks / max(0.001, dur_ms / 1000.0))
    train_ops = int(o.trainingTicks) * int(o.paramCount)
    norm_ms = round(train_ops / 100000.0, 2)
    curve = [int(c_slice[k]) for k in range(int(o.scoreCurveLen))]
    seed_scores = [int(round(s_slice[k])) for k in range(int(o.seedScoresLen))]
    gen_ratio = round(min_seed / max(1, best_train), 3) if best_train > 0 else (1.0 if is_perfect else 0.0)
    final_k = int(o.finalReasoningSteps) if morph_mode == "GROWING" and int(o.finalReasoningSteps) > 0 else None
    brain = unpack_serialized_brain(
        entry, w_slice, int(o.paramCount), final_k,
        winning_species=int(o.winningSpecies), experts_mask=int(o.activeExpertsMask)
    )
    evo_mode = PROTOCOL_CONFIG.get("evolutionTopologyMode", "SINGLE_SPECIES")
    compute_profile = "CPU_SPECIALIZED" if int(o.computeProfile) == 1 else "GPU_LOCKSTEP"
    mean_flops = round(float(o.meanFlopsPerFrame), 2)
    eff_score = round(min_seed / max(0.01, mean_flops / 100.0), 2) if mean_flops > 0 else 0.0
    roi_score = round((float(o.bestFitness) / max(1.0, mean_flops)) * 100.0, 2) if mean_flops > 0 and float(o.bestFitness) > 0 else 0.0
    actual_arch = ARCH_REV_MAP.get(int(o.winningSpecies), arch) if int(o.winningSpecies) >= 0 else arch
    active_experts = [HYBRID_EXPERT_NAMES[k] for k in range(3) if (int(o.activeExpertsMask) & (1 << k))]

    autopsy = {
        "totalDeaths": int(o.totalDeaths),
        "floorDeaths": int(o.floorDeaths),
        "ceilingDeaths": int(o.ceilingDeaths),
        "pipeTopDeaths": int(o.pipeTopDeaths),
        "pipeBottomDeaths": int(o.pipeBottomDeaths),
        "avgDeathAbsVy": round(float(o.avgDeathAbsVy), 2),
        "avgDeathGapErr": round(float(o.avgDeathGapErr), 1),
        "dominantFailure": FAIL_CAUSES.get(int(o.dominantFailure), "NONE"),
        "generalizationGap": max(0, best_train - min_seed),
    }

    r_tel = None
    if o.hasReasoningTelemetry:
        r_tel = {
            "avgPonderSteps": round(float(o.avgPonderSteps), 3),
            "calmPonderSteps": round(float(o.calmPonderSteps), 3),
            "dangerPonderSteps": round(float(o.dangerPonderSteps), 3),
            "system2Ratio": round(float(o.system2Ratio), 3),
            "avgRolloutAdvantage": round(float(o.avgRolloutAdvantage), 3),
            "avgSsmGate": round(float(o.avgSsmGate), 3),
        }

    res = {
        "id": f"colab-{global_idx}-{int(time.time()*1000) % 100000}",
        "trialSignature": sig,
        "algorithm": algo,
        "difficulty": diff,
        "architecture": arch,
        "weightPrecision": prec,
        "bitsPerParam": bits_pp,
        "totalBits": total_bits,
        "pipesPerBit": round(min_seed / total_bits, 3),
        "inputFeatures": list(feats),
        "inputCount": len(feats),
        "inputSetLabel": in_label,
        "topology": list(topo),
        "topologyLabel": topo_label,
        "depth": len(topo),
        "hiddenNodes": sum(topo),
        "parameterCount": int(o.paramCount),
        "mutationRate": float(mrate),
        "mutationStrength": float(mstr),
        "populationSize": int(pop),
        "targetPipeCap": int(PROTOCOL_CONFIG["targetPipeCap"]),
        "verificationSeeds": int(PROTOCOL_CONFIG["verificationSeeds"]),
        "bestScore": effective_score,
        "minSeedScore": min_seed,
        "meanSeedScore": mean_seed,
        "seedScores": seed_scores if seed_scores else [best_train],
        "verifiedPerfect": is_perfect,
        "stoppedReason": "PERFECT" if is_perfect else STOP_REASONS.get(int(o.stoppedReason), "MAX_GENS"),
        "bestFitness": round(float(o.bestFitness), 1),
        "finalAvgScore": round(float(o.finalAvgScore), 2),
        "generationsRun": int(o.generationsRun),
        "solved": is_perfect,
        "generationsToSolve": int(o.generationsRun) if is_perfect else None,
        "timeToPerfectionMs": dur_ms if is_perfect else None,
        "totalTicksEvaluated": total_ticks,
        "trainingTicksEvaluated": int(o.trainingTicks),
        "auditTicksEvaluated": int(o.auditTicks),
        "birdEpisodesEvaluated": int(o.generationsRun) * int(pop),
        "trainingSynapticOps": train_ops,
        "normalizedComputeMs": norm_ms,
        "ticksPerSecond": tps,
        "knowledgeDensity": round(min_seed / max(1, int(o.paramCount)), 2),
        "generalizationRatio": gen_ratio,
        "durationMs": dur_ms,
        "failureAutopsy": autopsy,
        "reasoningTelemetry": r_tel,
        "learningDynamic": classify_dynamic(curve, best_train, min_seed, is_perfect),
        "morphogenesisMode": morph_mode,
        "evolutionTopologyMode": evo_mode,
        "computeProfile": compute_profile,
        "meanFlopsPerFrame": mean_flops,
        "computeEfficiencyScore": eff_score,
        "bestBrain": brain,
        "scoreCurve": curve,
    }
    if evo_mode == "ISLAND_SPECIATION" and int(o.winningSpecies) >= 0:
        res["islandSummary"] = {
            "enabled": True,
            "rebalanceCount": int(o.rebalanceCount),
            "winningSpecies": actual_arch,
            "finalShares": [],
            "allocationTimeline": [],
        }
    if morph_mode == "GROWING":
        ms = {
            "initialActiveParams": int(o.initialActiveParams),
            "finalActiveParams": int(o.finalActiveParams),
            "ceilingParams": int(o.paramCount),
            "prunedSynapses": int(o.prunedSynapses),
            "growthEventsCount": int(o.growthEventsCount),
            "pruneEventsCount": int(o.pruneEventsCount),
            "finalReasoningSteps": int(o.finalReasoningSteps),
            "finalActiveSensors": int(o.finalActiveSensors),
            "finalHiddenCounts": [int(o.finalHiddenLayers[k]) for k in range(len(topo))],
            "eventTimeline": [],
            "avgFlopsPerFrame": mean_flops,
            "computeRoiScore": roi_score,
        }
        if actual_arch == "HYBRID_MOE":
            ms["activeExperts"] = active_experts
            ms["rollbackCount"] = int(o.rollbackCount)
            ms["committedExpertsCount"] = int(o.committedExpertsCount)
        res["morphogenesisSummary"] = ms
    if PROTOCOL_CONFIG.get("curriculumLearning"):
        res["curriculumLearning"] = True
    if PROTOCOL_CONFIG.get("shapedFitness"):
        res["shapedFitness"] = True
    if arch in ("LOOPED_REASONER", "PONDER_ACT"):
        res["reasoningSteps"] = int(final_k if final_k else (PROTOCOL_CONFIG.get("reasoningSteps") or 3))
    return res

CHECKPOINT_PATH = os.path.join(OUTPUT_DIR, "flappy-neurolab-colab-checkpoint.json")
RESULTS = []
planned_total = len(CUSTOM_SELECTED_TRIALS) if CUSTOM_SELECTED_TRIALS is not None else TOTAL_TO_RUN
t_run_start = time.perf_counter()
max_wall_sec = max(60.0, float(MAX_RUNTIME_MINUTES) * 60.0)

agg_gpu_ms = 0.0
agg_opt_ms = 0.0
agg_aud_ms = 0.0
agg_train_ticks = 0
agg_audit_ticks = 0
perfect_count = 0
best_min_seed_seen = 0
stopped_early_time_limit = False
last_checkpoint_n = 0

pbar = tqdm(total=planned_total, desc="NeuroLab CUDA Sweep", unit="trial", dynamic_ncols=True) if tqdm else None

def save_checkpoint(path, trials_list):
    payload = {
        "version": 2,
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "source": "GOOGLE_COLAB_CUDA",
        "runLabel": RUN_LABEL,
        "colabMeta": {
            "gpu": HW_INFO["gpu_name"],
            "compileMode": COMPILE_MODE,
            "batchSize": CHOSEN_BATCH,
            "completedInChunk": len(trials_list),
            "plannedInChunk": planned_total,
        },
        "protocol": PROTOCOL_CONFIG,
        "trials": trials_list,
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f)

def flush_batch(batch_entries, base_cursor):
    global agg_gpu_ms, agg_opt_ms, agg_aud_ms, agg_train_ticks, agg_audit_ticks
    global perfect_count, best_min_seed_seen, last_checkpoint_n
    outs, w_buf, mw, c_buf, mc, s_buf, ms, perf = run_c_batch(batch_entries, slice_start + base_cursor)

    agg_gpu_ms += perf.gpuKernelMs
    agg_opt_ms += perf.hostOptimizerMs
    agg_aud_ms += perf.f64AuditMs
    agg_train_ticks += int(perf.totalTrainingTicks)
    agg_audit_ticks += int(perf.totalAuditTicks)

    for i, entry in enumerate(batch_entries):
        o = outs[i]
        tr = format_trial_result(
            entry, slice_start + base_cursor + i, o,
            w_buf[i * mw : (i + 1) * mw],
            c_buf[i * mc : (i + 1) * mc],
            s_buf[i * ms : (i + 1) * ms],
        )
        RESULTS.append(tr)
        if tr["verifiedPerfect"]:
            perfect_count += 1
        if tr["minSeedScore"] > best_min_seed_seen:
            best_min_seed_seen = tr["minSeedScore"]

    elapsed_s = max(0.001, time.perf_counter() - t_run_start)
    done_n = len(RESULTS)
    rate_tps = (agg_train_ticks + agg_audit_ticks) / elapsed_s / 1e6
    trials_per_min = (done_n / elapsed_s) * 60.0
    eta_s = ((planned_total - done_n) / max(1e-6, done_n / elapsed_s)) if done_n > 0 else 0.0
    perf_pct = (100.0 * perfect_count / max(1, done_n))

    if CHECKPOINT_EVERY > 0 and (done_n - last_checkpoint_n >= CHECKPOINT_EVERY or done_n == planned_total):
        save_checkpoint(CHECKPOINT_PATH, RESULTS)
        last_checkpoint_n = done_n

    if pbar is not None:
        pbar.update(len(batch_entries))
        pbar.set_postfix_str(
            f"PERF={perfect_count} ({perf_pct:.1f}%) | Best={best_min_seed_seen} | {rate_tps:.1f}M t/s | {trials_per_min:.1f} tr/m | ETA {fmt_sec(eta_s)}"
        )
    else:
        pct = 100.0 * done_n / max(1, planned_total)
        print(f"[{pct:5.1f}%] {done_n}/{planned_total} | PERF={perfect_count} ({perf_pct:.1f}%) | Best={best_min_seed_seen} | {rate_tps:.1f}M t/s | Elapsed {fmt_sec(elapsed_s)} | ETA {fmt_sec(eta_s)}")

cursor = 0
pending_batch = []
for entry in iter_selected_trials(slice_start, slice_end):
    pending_batch.append(entry)
    if len(pending_batch) >= CHOSEN_BATCH:
        if (time.perf_counter() - t_run_start) >= max_wall_sec:
            stopped_early_time_limit = True
            print(f"\\n[AUTO-STOP] Osiagnieto limit czasu {MAX_RUNTIME_MINUTES} min ({len(RESULTS)}/{planned_total} prob) — zapisywanie wynikow!")
            pending_batch = []
            break
        flush_batch(pending_batch, cursor)
        cursor += len(pending_batch)
        pending_batch = []

if pending_batch and not stopped_early_time_limit:
    flush_batch(pending_batch, cursor)
    cursor += len(pending_batch)

if pbar is not None:
    pbar.close()

TOTAL_WALL_SEC = max(0.001, time.perf_counter() - t_run_start)
print(f"\\nZakonczono: {len(RESULTS)}/{planned_total} prob w {fmt_sec(TOTAL_WALL_SEC)} | PERFECT: {perfect_count} ({100.0*perfect_count/max(1,len(RESULTS)):.1f}%)")`;

  const cell7ExportAndPerfLog = `# @title 6. Eksport Wyników JSON do NeuroLab + Log Performance (Markdown)
import json, os
from datetime import datetime, timezone

stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
FINAL_FILENAME = f"flappy-neurolab-colab-dataset-{stamp}.json"
FINAL_PATH = os.path.join(OUTPUT_DIR, FINAL_FILENAME)

total_ticks_all = agg_train_ticks + agg_audit_ticks
ticks_m_per_s = (total_ticks_all / TOTAL_WALL_SEC) / 1e6
sum_phase_ms = max(1e-3, agg_gpu_ms + agg_opt_ms + agg_aud_ms)
gpu_pct = 100.0 * agg_gpu_ms / sum_phase_ms
opt_pct = 100.0 * agg_opt_ms / sum_phase_ms
aud_pct = 100.0 * agg_aud_ms / sum_phase_ms

PERF_LOG_MD = f"""### Google Colab CUDA Performance Log
- **Run Label:** \`{RUN_LABEL}\`
- **Hardware:** \`{HW_INFO['gpu_name']}\` (VRAM: {HW_INFO['vram_mb']} MB, CC: {HW_INFO['compute_cap'] or 'n/a'}, {HW_INFO['cpu_cores']} vCPUs)
- **Engine Mode:** \`{COMPILE_MODE}\` (compile: {COMPILE_SEC}s, batch: {CHOSEN_BATCH}, audit: {AUDIT_PRECISION})
- **Completed:** {len(RESULTS)} / {planned_total} trials (range [{slice_start}..{slice_end}), time-limited={stopped_early_time_limit})
- **Wall Time:** {fmt_sec(TOTAL_WALL_SEC)} ({TOTAL_WALL_SEC:.1f}s) | **Speed:** {len(RESULTS)/TOTAL_WALL_SEC*60.0:.2f} trials/min
- **Throughput:** **{ticks_m_per_s:.2f} M ticks/s** ({total_ticks_all/1e9:.3f}B ticks: train={agg_train_ticks/1e9:.3f}B, audit={agg_audit_ticks/1e9:.3f}B)
- **Phase Time Split:** GPU Kernel \`{gpu_pct:.1f}%\` | Host Optimizer \`{opt_pct:.1f}%\` | Audit ({AUDIT_PRECISION}) \`{aud_pct:.1f}%\`
- **Scientific Yield:** PERFECT={perfect_count}/{len(RESULTS)} ({100.0*perfect_count/max(1,len(RESULTS)):.1f}%) | Best Min-Seed={best_min_seed_seen}
- **Auto-Tuner Probes:** {json.dumps(TUNER_RESULTS)}
"""

final_payload = {
    "version": 2,
    "exportedAt": datetime.now(timezone.utc).isoformat(),
    "source": "GOOGLE_COLAB_CUDA",
    "runLabel": RUN_LABEL,
    "colabMeta": {
        "gpu": HW_INFO["gpu_name"],
        "vramMb": HW_INFO["vram_mb"],
        "computeCap": HW_INFO["compute_cap"],
        "cpuCores": HW_INFO["cpu_cores"],
        "compileMode": COMPILE_MODE,
        "compileSec": COMPILE_SEC,
        "batchSize": CHOSEN_BATCH,
        "wallSec": round(TOTAL_WALL_SEC, 2),
        "ticksMPerSec": round(ticks_m_per_s, 2),
        "gpuKernelPct": round(gpu_pct, 1),
        "hostOptimizerPct": round(opt_pct, 1),
        "f64AuditPct": round(aud_pct, 1),
        "rangeStart": slice_start,
        "rangeEnd": slice_end,
        "stoppedEarlyTimeLimit": stopped_early_time_limit,
        "perfLogMarkdown": PERF_LOG_MD,
    },
    "protocol": PROTOCOL_CONFIG,
    "trials": RESULTS,
}

with open(FINAL_PATH, "w", encoding="utf-8") as f:
    json.dump(final_payload, f)

size_mb = os.path.getsize(FINAL_PATH) / (1024 * 1024)
print(f"Zapisano plik wynikowy: {FINAL_PATH} ({size_mb:.2f} MB)")
print()
print(PERF_LOG_MD)

try:
    from google.colab import files
    print("Uruchamianie automatycznego pobierania JSON do przegladarki...")
    files.download(FINAL_PATH)
except Exception:
    print(f"Pobierz recznie plik: {FINAL_PATH} i zaimportuj go w NeuroLab (przycisk Import Colab JSON).")`;

  const notebook = {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      colab: {
        provenance: [],
        gpuType: 'T4',
        collapsed_sections: [],
      },
      kernelspec: {
        name: 'python3',
        display_name: 'Python 3',
      },
      language_info: {
        name: 'python',
      },
      accelerator: 'GPU',
    },
    cells: [
      {
        cell_type: 'markdown',
        metadata: {},
        source: toNotebookLines(cell1Markdown),
      },
      {
        cell_type: 'code',
        metadata: { cellView: 'form' },
        execution_count: null,
        outputs: [],
        source: toNotebookLines(cell2GpuCheck),
      },
      {
        cell_type: 'code',
        metadata: { cellView: 'form' },
        execution_count: null,
        outputs: [],
        source: toNotebookLines(cell3Config),
      },
      {
        cell_type: 'code',
        metadata: { cellView: 'form' },
        execution_count: null,
        outputs: [],
        source: toNotebookLines(cell4Compile),
      },
      {
        cell_type: 'code',
        metadata: { cellView: 'form' },
        execution_count: null,
        outputs: [],
        source: toNotebookLines(cell5BindingsAndPreflight),
      },
      {
        cell_type: 'code',
        metadata: { cellView: 'form' },
        execution_count: null,
        outputs: [],
        source: toNotebookLines(cell6Runner),
      },
      {
        cell_type: 'code',
        metadata: { cellView: 'form' },
        execution_count: null,
        outputs: [],
        source: toNotebookLines(cell7ExportAndPerfLog),
      },
    ],
  };

  const safeSlug = runLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const filename = `flappy-neurolab-colab-${safeSlug || 'sweep'}-${exportedTrialsCount}t.ipynb`;

  return {
    notebookJson: JSON.stringify(notebook, null, 2),
    filename,
    exportedTrialsCount,
    skippedCachedCount,
    prunedCount,
  };
}

export function downloadColabNotebook(
  cfg: ResearchSweepConfig,
  options: ColabExportOptions
): ColabNotebookSummary {
  const summary = buildColabNotebook(cfg, options);
  const blob = new Blob([summary.notebookJson], {
    type: 'application/x-ipynb+json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = summary.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return summary;
}

export function formatInputSubsetSummary(feats: readonly SensorFeatureId[]): string {
  return formatInputSubsetKey(normalizeInputFeatures(feats));
}
