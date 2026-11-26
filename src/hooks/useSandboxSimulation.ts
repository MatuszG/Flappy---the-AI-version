import { useCallback, useEffect, useRef, useState } from 'react';
import { arcadeAudio } from '../engine/audio';
import {
  isSmartphoneDevice,
  loadEcoPreference,
  persistEcoPreference,
  resolveEcoActive,
  type EcoModePreference,
} from '../engine/deviceProfile';
import { normalizeHiddenLayers } from '../engine/neuralNetwork';
import {
  addCompletedPlayRun,
  clearStoredLeaderboard,
  clearStoredPlayHistory,
  loadPlayRecordsSnapshot,
  persistPlayerNick,
  updateSavedPlayRunNick,
  type PlayRunRecord,
} from '../engine/playRecords';
import {
  loadSavedBrains,
  persistSavedBrains,
  PRETRAINED_ACE_BRAIN,
} from '../engine/pretrainedBrain';
import { loadTrainingConfig, saveTrainingConfig } from '../engine/researchStorage';
import {
  CLASSIC_5_SENSOR_FEATURES,
  inferInputFeaturesFromCount,
  normalizeInputFeatures,
} from '../engine/sensors';
import {
  FlappySimulation,
  normalizeDifficultyPreset,
} from '../engine/simulation';
import type {
  WorkerInboundMessage,
  WorkerOutboundMessage,
} from '../engine/training.worker';
import type {
  DifficultyPreset,
  EnvironmentConfig,
  EvolutionConfig,
  GameMode,
  LearningAlgorithm,
  PlaySubMode,
  RenderSnapshot,
  SavedBrain,
  SerializedNeuralNetwork,
  SimulationTelemetry,
  SpeedSetting,
} from '../engine/types';

const HUMAN_PB_STORAGE_KEY = 'flappy-neuro-human-pb-v1';

function loadHumanPersonalBests(): Partial<Record<DifficultyPreset, number>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(HUMAN_PB_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as Partial<Record<DifficultyPreset, number>>;
    }
  } catch {
    // ignore storage errors
  }
  return {};
}

function persistHumanPersonalBests(
  bests: Partial<Record<DifficultyPreset, number>>
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HUMAN_PB_STORAGE_KEY, JSON.stringify(bests));
  } catch {
    // ignore storage quota errors
  }
}

export interface PlaySessionStats {
  runs: number;
  totalScore: number;
  bestSessionScore: number;
  lastRunWasNewRecord: boolean;
}

export const DEFAULT_EVOLUTION_CONFIG: EvolutionConfig = {
  algorithm: 'CMA_HYBRID',
  populationSize: 60,
  mutationRate: 0.14,
  mutationStrength: 0.28,
  elitismCount: 4,
  hiddenNodes: 6,
  hiddenLayers: [6],
  inputFeatures: [...CLASSIC_5_SENSOR_FEATURES],
  difficulty: 'MEDIUM',
  morphogenesis: false,
};

export function useSandboxSimulation(params: {
  mode: GameMode;
  setMode: (next: GameMode) => void;
  sweepCustomEnvironment?: EnvironmentConfig;
  brainsModalOpen: boolean;
  howModalOpen: boolean;
  onCloseModals: () => void;
  showNotice: (msg: string) => void;
}) {
  const {
    mode,
    setMode,
    sweepCustomEnvironment,
    brainsModalOpen,
    howModalOpen,
    onCloseModals,
    showNotice,
  } = params;

  const [config, setConfig] = useState<EvolutionConfig>(() => {
    const loaded = loadTrainingConfig();
    if (!loaded) return DEFAULT_EVOLUTION_CONFIG;
    return {
      ...DEFAULT_EVOLUTION_CONFIG,
      ...loaded,
      difficulty: normalizeDifficultyPreset(loaded.difficulty),
    };
  });
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState<SpeedSetting>(1);
  const [effectiveMultiplier, setEffectiveMultiplier] = useState<number>(1);
  const [showSensors, setShowSensors] = useState(true);
  const [muted, setMuted] = useState(true);
  const [savedBrains, setSavedBrains] = useState<SavedBrain[]>(() =>
    loadSavedBrains()
  );
  const [activeOpponentName, setActiveOpponentName] =
    useState<string>('Evolved Champion');
  const [playSubMode, setPlaySubMode] = useState<PlaySubMode>('SOLO');
  const [humanBestByDifficulty, setHumanBestByDifficulty] = useState<
    Partial<Record<DifficultyPreset, number>>
  >(() => loadHumanPersonalBests());
  const [playSessionStats, setPlaySessionStats] = useState<PlaySessionStats>({
    runs: 0,
    totalScore: 0,
    bestSessionScore: 0,
    lastRunWasNewRecord: false,
  });
  const [playerNick, setPlayerNick] = useState<string>(
    () => loadPlayRecordsSnapshot().playerNick
  );
  const [playHistory, setPlayHistory] = useState<PlayRunRecord[]>(
    () => loadPlayRecordsSnapshot().history
  );
  const [leaderboard, setLeaderboard] = useState<PlayRunRecord[]>(
    () => loadPlayRecordsSnapshot().leaderboard
  );
  const [bestPointsByDifficulty, setBestPointsByDifficulty] = useState<
    Partial<Record<DifficultyPreset, number>>
  >(() => loadPlayRecordsSnapshot().bestPointsByDifficulty);
  const [lastCompletedRunId, setLastCompletedRunId] = useState<string | null>(
    null
  );
  const playerNickRef = useRef<string>(playerNick);
  playerNickRef.current = playerNick;
  const activeOpponentNameRef = useRef<string>(activeOpponentName);
  activeOpponentNameRef.current = activeOpponentName;
  const [ecoPreference, setEcoPreference] = useState<EcoModePreference>(() =>
    loadEcoPreference()
  );
  const [smartphoneDetected, setSmartphoneDetected] = useState<boolean>(() =>
    isSmartphoneDevice()
  );
  const ecoActive = resolveEcoActive(ecoPreference, smartphoneDetected);
  const ecoActiveRef = useRef<boolean>(ecoActive);
  ecoActiveRef.current = ecoActive;

  const vsAiSimRef = useRef<FlappySimulation | null>(null);
  if (!vsAiSimRef.current) {
    arcadeAudio.setMuted(true);
    const loaded = loadTrainingConfig();
    const initialVsConfig = loaded
      ? { ...DEFAULT_EVOLUTION_CONFIG, ...loaded, difficulty: normalizeDifficultyPreset(loaded.difficulty) }
      : DEFAULT_EVOLUTION_CONFIG;
    vsAiSimRef.current = new FlappySimulation(initialVsConfig, {
      onScore: () => arcadeAudio.playScore(),
      onOrbCollect: (isPrism) => arcadeAudio.playOrbCollect(isPrism),
      onCrash: () => arcadeAudio.playCrash(),
    });
    vsAiSimRef.current.prepareVsAiMatch(true);
  }

  const workerRef = useRef<Worker | null>(null);
  const trainingSnapshotRef = useRef<RenderSnapshot | null>(null);
  const trainingChampionRef = useRef<SerializedNeuralNetwork | null>(null);
  const lastUiSyncRef = useRef<number>(0);
  const modeRef = useRef<GameMode>(mode);
  modeRef.current = mode;
  const playSubModeRef = useRef<PlaySubMode>(playSubMode);
  playSubModeRef.current = playSubMode;
  const runningRef = useRef<boolean>(running);
  runningRef.current = running;
  const configDifficultyRef = useRef<DifficultyPreset>(config.difficulty);
  configDifficultyRef.current = config.difficulty;
  const prevVsPhaseRef = useRef<string>('READY');
  const lastCrashAtRef = useRef<number>(0);
  const scoredRunRef = useRef<boolean>(false);

  const [trainingTelemetry, setTrainingTelemetry] =
    useState<SimulationTelemetry>(() => ({
      mode: 'TRAINING',
      vsAiPhase: 'READY',
      algorithm: DEFAULT_EVOLUTION_CONFIG.algorithm,
      generation: 1,
      aliveCount: DEFAULT_EVOLUTION_CONFIG.populationSize,
      totalPopulation: DEFAULT_EVOLUTION_CONFIG.populationSize,
      currentBestScore: 0,
      allTimeBestScore: 0,
      allTimeBestGeneration: 0,
      playerScore: 0,
      aiOpponentScore: 0,
      playerAlive: false,
      aiOpponentAlive: false,
      vsAiWinner: null,
      leaderNetwork: null,
      history: [],
      hasChampionBrain: false,
      milestones: {
        reached1Gen: null,
        reached1Ms: null,
        reached10Gen: null,
        reached10Ms: null,
        reached50Gen: null,
        reached50Ms: null,
        reached100Gen: null,
        reached100Ms: null,
        elapsedMs: 0,
      },
    }));

  const [vsAiTelemetry, setVsAiTelemetry] = useState<SimulationTelemetry>(() =>
    vsAiSimRef.current!.getTelemetry()
  );

  const postToWorker = useCallback((msg: WorkerInboundMessage) => {
    workerRef.current?.postMessage(msg);
  }, []);

  const syncVsAiTelemetry = useCallback(() => {
    const sim = vsAiSimRef.current;
    if (!sim) return;
    const nextTel = sim.getTelemetry();
    const prevPhase = prevVsPhaseRef.current;
    prevVsPhaseRef.current = nextTel.vsAiPhase;

    if (nextTel.vsAiPhase === 'READY') {
      scoredRunRef.current = false;
    }

    if (
      nextTel.vsAiPhase === 'PLAYING' &&
      !nextTel.playerAlive &&
      lastCrashAtRef.current === 0
    ) {
      lastCrashAtRef.current = performance.now();
    }

    if (nextTel.vsAiPhase === 'GAME_OVER' && prevPhase !== 'GAME_OVER' && !scoredRunRef.current) {
      scoredRunRef.current = true;
      lastCrashAtRef.current = performance.now();
      const score = nextTel.playerScore;
      const pts = nextTel.playerPoints ?? 0;
      const orbs = nextTel.playerOrbsCollected ?? 0;
      const maxCombo = nextTel.playerMaxCombo ?? 0;
      const diff = configDifficultyRef.current;
      let isNewRecord = false;
      setHumanBestByDifficulty((prev) => {
        const currentBest = prev[diff] ?? 0;
        if (score > currentBest) {
          isNewRecord = true;
          const updated = { ...prev, [diff]: score };
          persistHumanPersonalBests(updated);
          if (score > 0) {
            arcadeAudio.playNewRecord();
          }
          return updated;
        }
        return prev;
      });
      setPlaySessionStats((prev) => ({
        runs: prev.runs + 1,
        totalScore: prev.totalScore + score,
        bestSessionScore: Math.max(prev.bestSessionScore, score),
        lastRunWasNewRecord: isNewRecord,
      }));

      if (pts >= 4 || score > 0 || orbs > 0) {
        const wonVsAi =
          playSubModeRef.current === 'VS_AI'
            ? nextTel.vsAiWinner === 'PLAYER'
              ? true
              : nextTel.vsAiWinner === 'AI'
                ? false
                : null
            : null;
        const saved = addCompletedPlayRun({
          playerNick: playerNickRef.current,
          points: pts,
          pipes: score,
          orbsCollected: orbs,
          maxCombo,
          difficulty: diff,
          subMode: playSubModeRef.current,
          opponentName: activeOpponentNameRef.current,
          wonVsAi,
          fallbackName: 'Anon Pilot',
        });
        setPlayHistory(saved.history);
        setLeaderboard(saved.leaderboard);
        setBestPointsByDifficulty(saved.bestPointsByDifficulty);
        setLastCompletedRunId(saved.record.id);
      } else {
        setLastCompletedRunId(null);
      }
    }

    setVsAiTelemetry(nextTel);
  }, []);

  useEffect(() => {
    const worker = new Worker(
      new URL('../engine/training.worker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    worker.onmessage = (ev: MessageEvent<WorkerOutboundMessage>) => {
      const msg = ev.data;
      if (msg.type === 'FRAME') {
        trainingSnapshotRef.current = msg.snapshot;
        trainingChampionRef.current = msg.championBrain;
        if (modeRef.current !== 'TRAINING') return;

        if (msg.scored) arcadeAudio.playScore();
        if (msg.genAdvanced) arcadeAudio.playGenerationAdvance();

        const now = performance.now();
        const uiSyncMinMs = ecoActiveRef.current ? 140 : 55;
        if (
          now - lastUiSyncRef.current >= uiSyncMinMs ||
          msg.genAdvanced ||
          msg.scored
        ) {
          lastUiSyncRef.current = now;
          setTrainingTelemetry(msg.telemetry);
          setEffectiveMultiplier(msg.effectiveMultiplier);
        }
      } else if (msg.type === 'BG_TELEMETRY') {
        trainingChampionRef.current = msg.championBrain;
        if (modeRef.current !== 'TRAINING') return;
        setTrainingTelemetry(msg.telemetry);
        setEffectiveMultiplier(msg.effectiveMultiplier);
      }
    };

    const initialConfig = loadTrainingConfig() ?? DEFAULT_EVOLUTION_CONFIG;
    worker.postMessage({
      type: 'INIT',
      config: {
        ...DEFAULT_EVOLUTION_CONFIG,
        ...initialConfig,
        difficulty: normalizeDifficultyPreset(initialConfig.difficulty),
        inputFeatures: normalizeInputFeatures(initialConfig.inputFeatures),
      },
      speed: 1,
      running: modeRef.current === 'TRAINING',
    } satisfies WorkerInboundMessage);

    const handleVisibilityChange = () => {
      worker.postMessage({
        type: 'SET_VISIBILITY',
        hidden: document.hidden,
      } satisfies WorkerInboundMessage);
    };

    const handleResize = () => {
      setSmartphoneDetected(isSmartphoneDevice());
    };

    worker.postMessage({
      type: 'SET_MOBILE_ECO',
      enabled: ecoActiveRef.current,
    } satisfies WorkerInboundMessage);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    persistEcoPreference(ecoPreference);
    postToWorker({ type: 'SET_MOBILE_ECO', enabled: ecoActive });
  }, [ecoPreference, ecoActive, postToWorker]);

  const handleCycleEcoMode = useCallback(() => {
    setEcoPreference((prev) => {
      if (prev === 'AUTO') return smartphoneDetected ? 'FULL' : 'ECO';
      if (prev === 'ECO') return 'FULL';
      return 'AUTO';
    });
  }, [smartphoneDetected]);

  useEffect(() => {
    saveTrainingConfig(config);
  }, [config]);

  const handleSelectMode = useCallback(
    (nextMode: GameMode, forcedSubMode?: PlaySubMode) => {
      if (nextMode === 'VS_AI') {
        const vsSim = vsAiSimRef.current;
        if (!vsSim) return;

        postToWorker({ type: 'SET_RUNNING', running: false });

        const targetSubMode = forcedSubMode ?? playSubModeRef.current;
        setPlaySubMode(targetSubMode);
        playSubModeRef.current = targetSubMode;

        if (trainingTelemetry.allTimeBestScore > 0 && trainingChampionRef.current) {
          vsSim.setChampionBrain(trainingChampionRef.current);
          setActiveOpponentName(
            `Evolved Champion (${trainingTelemetry.allTimeBestScore} pipes)`
          );
        } else {
          vsSim.setChampionBrain(PRETRAINED_ACE_BRAIN.network);
          setActiveOpponentName(PRETRAINED_ACE_BRAIN.name);
        }
        lastCrashAtRef.current = 0;
        scoredRunRef.current = false;
        vsSim.prepareVsAiMatch(targetSubMode === 'SOLO');
        setMode('VS_AI');
        setRunning(true);
        syncVsAiTelemetry();
      } else if (nextMode === 'RESEARCH' || nextMode === 'DOCS') {
        postToWorker({ type: 'SET_RUNNING', running: false });
        setMode(nextMode);
      } else {
        setMode('TRAINING');
        setRunning(true);
        postToWorker({ type: 'SET_RUNNING', running: true });
      }
    },
    [postToWorker, setMode, syncVsAiTelemetry, trainingTelemetry.allTimeBestScore]
  );

  const handleChangePlaySubMode = useCallback(
    (nextSubMode: PlaySubMode) => {
      setPlaySubMode(nextSubMode);
      playSubModeRef.current = nextSubMode;
      const vsSim = vsAiSimRef.current;
      if (!vsSim) return;
      if (nextSubMode === 'VS_AI') {
        if (trainingTelemetry.allTimeBestScore > 0 && trainingChampionRef.current) {
          vsSim.setChampionBrain(trainingChampionRef.current);
          setActiveOpponentName(
            `Evolved Champion (${trainingTelemetry.allTimeBestScore} pipes)`
          );
        } else {
          vsSim.setChampionBrain(PRETRAINED_ACE_BRAIN.network);
          setActiveOpponentName(PRETRAINED_ACE_BRAIN.name);
        }
      }
      lastCrashAtRef.current = 0;
      scoredRunRef.current = false;
      vsSim.prepareVsAiMatch(nextSubMode === 'SOLO');
      setRunning(true);
      syncVsAiTelemetry();
    },
    [syncVsAiTelemetry, trainingTelemetry.allTimeBestScore]
  );

  const handleToggleRunning = useCallback(() => {
    setRunning((prev) => {
      const next = !prev;
      if (modeRef.current === 'TRAINING') {
        postToWorker({ type: 'SET_RUNNING', running: next });
      }
      return next;
    });
  }, [postToWorker]);

  const handleSelectSpeed = useCallback(
    (opt: SpeedSetting) => {
      setSpeed(opt);
      postToWorker({ type: 'SET_SPEED', speed: opt });
    },
    [postToWorker]
  );

  const handleResetTraining = useCallback(() => {
    postToWorker({ type: 'RESET' });
    postToWorker({ type: 'SET_RUNNING', running: true });
    setActiveOpponentName('Evolved Champion');
    setRunning(true);
  }, [postToWorker]);

  const handleRematchVsAi = useCallback(() => {
    lastCrashAtRef.current = 0;
    scoredRunRef.current = false;
    setPlaySessionStats((prev) => ({ ...prev, lastRunWasNewRecord: false }));
    vsAiSimRef.current?.prepareVsAiMatch(playSubModeRef.current === 'SOLO');
    setRunning(true);
    syncVsAiTelemetry();
  }, [syncVsAiTelemetry]);

  const handleFinishVsAiEarly = useCallback(() => {
    vsAiSimRef.current?.finishVsAiMatchEarly();
    syncVsAiTelemetry();
  }, [syncVsAiTelemetry]);

  const handlePlayerFlap = useCallback(() => {
    const sim = vsAiSimRef.current;
    if (!sim) return;
    const phase = sim.getVsAiPhase();
    if (phase === 'GAME_OVER') {
      if (performance.now() - lastCrashAtRef.current >= 380) {
        lastCrashAtRef.current = 0;
        scoredRunRef.current = false;
        setPlaySessionStats((prev) => ({ ...prev, lastRunWasNewRecord: false }));
        sim.prepareVsAiMatch(playSubModeRef.current === 'SOLO');
        setRunning(true);
        syncVsAiTelemetry();
      }
      return;
    }
    if (phase === 'PLAYING' && !runningRef.current) {
      setRunning(true);
    }
    const flapped = sim.playerFlap();
    if (flapped) {
      arcadeAudio.playFlap();
    }
    syncVsAiTelemetry();
  }, [syncVsAiTelemetry]);

  const handleConfigChange = useCallback(
    (nextConfig: EvolutionConfig) => {
      const normalizedConfig: EvolutionConfig = {
        ...nextConfig,
        inputFeatures: normalizeInputFeatures(nextConfig.inputFeatures),
      };
      setConfig(normalizedConfig);
      postToWorker({ type: 'UPDATE_CONFIG', config: normalizedConfig });
      if (vsAiSimRef.current) {
        const currentVs = vsAiSimRef.current.getConfig();
        const vsConfig =
          modeRef.current === 'VS_AI'
            ? {
                ...normalizedConfig,
                hiddenNodes: currentVs.hiddenNodes,
                hiddenLayers: currentVs.hiddenLayers,
                inputFeatures: currentVs.inputFeatures,
              }
            : normalizedConfig;
        vsAiSimRef.current.updateConfig(vsConfig);
        if (modeRef.current === 'VS_AI') {
          syncVsAiTelemetry();
        }
      }
    },
    [postToWorker, syncVsAiTelemetry]
  );

  const handleStepFrame = useCallback(() => {
    setRunning(false);
    postToWorker({ type: 'STEP_ONCE' });
  }, [postToWorker]);

  const handleToggleAudio = useCallback(() => {
    setMuted((prev) => {
      const nextMuted = !prev;
      arcadeAudio.setMuted(nextMuted);
      return nextMuted;
    });
  }, []);

  const handleSaveCurrentBrain = useCallback(
    (name: string) => {
      const serialized = trainingChampionRef.current;
      if (!serialized) return;

      const newBrain: SavedBrain = {
        id: `brain-${Date.now()}`,
        name,
        bestScore: Math.max(
          trainingTelemetry.allTimeBestScore,
          trainingTelemetry.currentBestScore
        ),
        generation: trainingTelemetry.generation,
        createdAt: new Date().toISOString(),
        network: serialized,
      };

      setSavedBrains((prev) => {
        const next = [newBrain, ...prev];
        persistSavedBrains(next);
        return next;
      });
      showNotice(`Saved "${name}"`);
    },
    [
      showNotice,
      trainingTelemetry.allTimeBestScore,
      trainingTelemetry.currentBestScore,
      trainingTelemetry.generation,
    ]
  );

  const handleQuickSave = useCallback(() => {
    handleSaveCurrentBrain(`Champion Gen ${trainingTelemetry.generation}`);
  }, [handleSaveCurrentBrain, trainingTelemetry.generation]);

  const handleLoadIntoTraining = useCallback(
    (
      brain: SavedBrain,
      targetDifficulty?: DifficultyPreset,
      targetAlgorithm?: LearningAlgorithm
    ) => {
      const hiddenLayers = normalizeHiddenLayers(
        brain.network.hiddenLayers !== undefined
          ? brain.network.hiddenLayers
          : brain.network.hiddenNodes
      );
      const totalHidden =
        hiddenLayers.length === 1
          ? hiddenLayers[0]
          : hiddenLayers.reduce((a, b) => a + b, 0);
      const brainInputs = brain.network.inputFeatures
        ? normalizeInputFeatures(brain.network.inputFeatures)
        : inferInputFeaturesFromCount(brain.network.inputNodes || 5);
      const nextConfig: EvolutionConfig = {
        ...config,
        algorithm: targetAlgorithm ?? config.algorithm,
        hiddenNodes: totalHidden,
        hiddenLayers,
        inputFeatures: brainInputs,
        architecture: brain.network.architecture ?? 'MLP',
        weightPrecision: brain.network.weightPrecision ?? 'FP32',
        difficulty: targetDifficulty ?? config.difficulty,
        customEnvironment:
          targetDifficulty === 'CUSTOM'
            ? sweepCustomEnvironment ?? config.customEnvironment
            : config.customEnvironment,
      };
      setConfig(nextConfig);
      postToWorker({ type: 'UPDATE_CONFIG', config: nextConfig });
      postToWorker({ type: 'LOAD_BRAIN', network: brain.network });
      postToWorker({ type: 'SET_RUNNING', running: true });
      setMode('TRAINING');
      setRunning(true);
      showNotice(`Seeded lab with "${brain.name}"`);
    },
    [config, postToWorker, setMode, showNotice, sweepCustomEnvironment]
  );

  const handleRaceAgainstBrain = useCallback(
    (brain: SavedBrain, targetDifficulty?: DifficultyPreset) => {
      const vsSim = vsAiSimRef.current;
      if (!vsSim) return;
      postToWorker({ type: 'SET_RUNNING', running: false });
      if (targetDifficulty) {
        const nextConfig: EvolutionConfig = {
          ...config,
          difficulty: targetDifficulty,
          customEnvironment:
            targetDifficulty === 'CUSTOM'
              ? sweepCustomEnvironment ?? config.customEnvironment
              : config.customEnvironment,
        };
        setConfig(nextConfig);
        vsSim.updateConfig({
          ...nextConfig,
          hiddenNodes: vsSim.getConfig().hiddenNodes,
          hiddenLayers: vsSim.getConfig().hiddenLayers,
        });
      }
      vsSim.setChampionBrain(brain.network);
      setPlaySubMode('VS_AI');
      playSubModeRef.current = 'VS_AI';
      lastCrashAtRef.current = 0;
      scoredRunRef.current = false;
      vsSim.prepareVsAiMatch(false);
      setMode('VS_AI');
      setActiveOpponentName(brain.name);
      setRunning(true);
      syncVsAiTelemetry();
      showNotice(`Matched against "${brain.name}"`);
    },
    [config, postToWorker, setMode, showNotice, sweepCustomEnvironment, syncVsAiTelemetry]
  );

  const handleSelectPlayDifficulty = useCallback(
    (diff: DifficultyPreset) => {
      const nextConfig: EvolutionConfig = {
        ...config,
        difficulty: diff,
      };
      setConfig(nextConfig);
      postToWorker({ type: 'UPDATE_CONFIG', config: nextConfig });
      if (vsAiSimRef.current) {
        const currentVs = vsAiSimRef.current.getConfig();
        vsAiSimRef.current.updateConfig({
          ...nextConfig,
          hiddenNodes: currentVs.hiddenNodes,
          hiddenLayers: currentVs.hiddenLayers,
          inputFeatures: currentVs.inputFeatures,
        });
        lastCrashAtRef.current = 0;
        scoredRunRef.current = false;
        setPlaySessionStats((prev) => ({ ...prev, lastRunWasNewRecord: false }));
        vsAiSimRef.current.prepareVsAiMatch(playSubModeRef.current === 'SOLO');
        setRunning(true);
        syncVsAiTelemetry();
      }
    },
    [config, postToWorker, syncVsAiTelemetry]
  );

  const handleUseEvolvedChampionOpponent = useCallback(() => {
    const vsSim = vsAiSimRef.current;
    if (!vsSim) return;
    if (trainingChampionRef.current) {
      vsSim.setChampionBrain(trainingChampionRef.current);
      setActiveOpponentName(
        `Evolved Champion (${trainingTelemetry.allTimeBestScore} pipes)`
      );
    } else {
      vsSim.setChampionBrain(PRETRAINED_ACE_BRAIN.network);
      setActiveOpponentName(PRETRAINED_ACE_BRAIN.name);
    }
    setPlaySubMode('VS_AI');
    playSubModeRef.current = 'VS_AI';
    lastCrashAtRef.current = 0;
    scoredRunRef.current = false;
    vsSim.prepareVsAiMatch(false);
    setRunning(true);
    syncVsAiTelemetry();
  }, [syncVsAiTelemetry, trainingTelemetry.allTimeBestScore]);

  const handleDeleteBrain = useCallback((id: string) => {
    setSavedBrains((prev) => {
      const next = prev.filter((b) => b.id !== id);
      persistSavedBrains(next);
      return next;
    });
  }, []);

  const handleImportBrain = useCallback(
    (name: string, network: SerializedNeuralNetwork) => {
      const imported: SavedBrain = {
        id: `brain-${Date.now()}`,
        name,
        bestScore: 0,
        generation: 1,
        createdAt: new Date().toISOString(),
        network,
      };
      setSavedBrains((prev) => {
        const next = [imported, ...prev];
        persistSavedBrains(next);
        return next;
      });
      showNotice(`Imported "${name}"`);
    },
    [showNotice]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (brainsModalOpen || howModalOpen) {
        if (e.key === 'Escape') {
          onCloseModals();
        }
        return;
      }

      const target = e.target as HTMLElement | null;
      const isFormField =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
      if (isFormField) return;

      if (modeRef.current === 'VS_AI') {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
          e.preventDefault();
          if (target?.tagName === 'BUTTON') {
            target.blur();
          }
          handlePlayerFlap();
        } else if (e.code === 'KeyP' || e.code === 'Escape') {
          if (vsAiSimRef.current?.getVsAiPhase() === 'PLAYING') {
            e.preventDefault();
            setRunning((prev) => !prev);
          }
        } else if (e.code === 'KeyR') {
          e.preventDefault();
          handleRematchVsAi();
        }
      } else if (modeRef.current === 'TRAINING' && e.code === 'Space') {
        if (target?.tagName !== 'BUTTON') {
          e.preventDefault();
          handleToggleRunning();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    brainsModalOpen,
    howModalOpen,
    onCloseModals,
    handlePlayerFlap,
    handleRematchVsAi,
    handleToggleRunning,
  ]);

  const handleLoadFruitFlyPreset = useCallback(() => {
    const flyInputs = normalizeInputFeatures([
      'VEL_VY',
      'PIPE_DX',
      'TOP_CLEAR',
      'BOT_CLEAR',
      'PIPE_VY',
      'NEXT_PIPE_DX',
      'NEXT_TOP_CLEAR',
      'NEXT_BOT_CLEAR',
    ]);
    const nextConfig: EvolutionConfig = {
      ...config,
      algorithm: 'CMA_HYBRID',
      populationSize: 80,
      mutationRate: 0.14,
      mutationStrength: 0.28,
      elitismCount: 4,
      hiddenLayers: [6, 4],
      hiddenNodes: 10,
      inputFeatures: flyInputs,
      architecture: 'DROSOPHILA_CONNECTOME',
      weightPrecision: 'FP32',
      shapedFitness: true,
      curriculumLearning: true,
      morphogenesis: true,
      perceptionMode: 'GEOMETRIC_LAB',
      opticalNoiseLevel: 0,
      nonStationaryAnomalies: false,
      onlinePlasticity: false,
    };
    setConfig(nextConfig);
    postToWorker({ type: 'UPDATE_CONFIG', config: nextConfig });
    postToWorker({ type: 'RESET' });
    postToWorker({ type: 'SET_RUNNING', running: true });
    setMode('TRAINING');
    setRunning(true);
    showNotice(
      'Loaded Drosophila Fruit-Fly Connectome (6→4, Neuro-CMA + Morphogenesis)'
    );
  }, [config, postToWorker, setMode, showNotice]);

  const handleLoadDecoupledCortexPreset = useCallback(() => {
    const flyInputs = normalizeInputFeatures([
      'VEL_VY',
      'PIPE_DX',
      'TOP_CLEAR',
      'BOT_CLEAR',
      'PIPE_VY',
      'NEXT_PIPE_DX',
      'NEXT_TOP_CLEAR',
      'NEXT_BOT_CLEAR',
    ]);
    const nextConfig: EvolutionConfig = {
      ...config,
      algorithm: 'CMA_HYBRID',
      populationSize: 80,
      mutationRate: 0.14,
      mutationStrength: 0.28,
      elitismCount: 4,
      hiddenLayers: [6, 4],
      hiddenNodes: 10,
      inputFeatures: flyInputs,
      architecture: 'DECOUPLED_FLY_CORTEX',
      weightPrecision: 'FP32',
      shapedFitness: true,
      curriculumLearning: true,
      morphogenesis: true,
      perceptionMode: 'COMPOUND_EYE_PIXELS',
      opticalNoiseLevel: 0.05,
      nonStationaryAnomalies: true,
      onlinePlasticity: true,
    };
    setConfig(nextConfig);
    postToWorker({ type: 'UPDATE_CONFIG', config: nextConfig });
    postToWorker({ type: 'RESET' });
    postToWorker({ type: 'SET_RUNNING', running: true });
    setMode('TRAINING');
    setRunning(true);
    setShowSensors(true);
    showNotice(
      'Loaded Decoupled Fly-Cortex (Compound-Eye Pixels + FlyHash 16-Slot Memory + Online DA Plasticity)'
    );
  }, [config, postToWorker, setMode, showNotice]);

  const handleUpdatePlayerNick = useCallback((rawNick: string) => {
    const cleaned = persistPlayerNick(rawNick);
    setPlayerNick(cleaned);
  }, []);

  const handleSaveLastRunWithNick = useCallback(
    (rawNick: string) => {
      const targetId = lastCompletedRunId;
      const cleaned = persistPlayerNick(rawNick);
      setPlayerNick(cleaned);
      if (targetId) {
        const res = updateSavedPlayRunNick({
          runId: targetId,
          nick: cleaned,
          fallbackName: 'Anon Pilot',
        });
        setPlayHistory(res.history);
        setLeaderboard(res.leaderboard);
      }
      const display = cleaned || 'Anon Pilot';
      showNotice(`Zapisano profil / wynik: ${display}`);
    },
    [lastCompletedRunId, showNotice]
  );

  const handleClearPlayHistory = useCallback(() => {
    setPlayHistory(clearStoredPlayHistory());
    showNotice('Historia lotów wyczyszczona');
  }, [showNotice]);

  const handleClearLeaderboard = useCallback(() => {
    setLeaderboard(clearStoredLeaderboard());
    showNotice('Tabela wyników wyczyszczona');
  }, [showNotice]);

  return {
    config,
    running,
    speed,
    effectiveMultiplier,
    showSensors,
    setShowSensors,
    muted,
    savedBrains,
    activeOpponentName,
    playSubMode,
    humanBestByDifficulty,
    bestPointsByDifficulty,
    playSessionStats,
    playerNick,
    playHistory,
    leaderboard,
    lastCompletedRunId,
    ecoPreference,
    ecoActive,
    smartphoneDetected,
    trainingTelemetry,
    vsAiTelemetry,
    trainingSnapshotRef,
    vsAiSimRef,
    handleSelectMode,
    handleChangePlaySubMode,
    handleSelectPlayDifficulty,
    handleUseEvolvedChampionOpponent,
    handleCycleEcoMode,
    handleToggleRunning,
    handleSelectSpeed,
    handleResetTraining,
    handleRematchVsAi,
    handleFinishVsAiEarly,
    handlePlayerFlap,
    handleConfigChange,
    handleStepFrame,
    handleToggleAudio,
    handleSaveCurrentBrain,
    handleQuickSave,
    handleLoadIntoTraining,
    handleRaceAgainstBrain,
    handleDeleteBrain,
    handleImportBrain,
    handleLoadFruitFlyPreset,
    handleLoadDecoupledCortexPreset,
    handleUpdatePlayerNick,
    handleSaveLastRunWithNick,
    handleClearPlayHistory,
    handleClearLeaderboard,
    syncVsAiTelemetry,
  };
}
