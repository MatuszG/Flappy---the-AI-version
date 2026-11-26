import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { analyticsClient } from '../engine/analyticsClient';
import {
  buildThermalEfficiencySweepQueue,
  buildValidationAndLoadQueue,
  getPresetById,
  type PresetId,
} from '../engine/experimentPresets';
import { analyzePolicyMechanism } from '../engine/policyAnalysis';
import { ResearchPool } from '../engine/researchPool';
import { ALGORITHM_SHORT_LABELS } from '../engine/researchReport';
import {
  clearResearchSession,
  clearRunHistory,
  deleteRunHistoryRecord,
  getResultSignature,
  loadExperimentQueue,
  loadResearchSession,
  loadRunHistory,
  saveExperimentQueue,
  saveResearchSessionIncremental,
  saveRunHistoryRecord,
  updateRunReviewFlags,
} from '../engine/researchStorage';
import {
  CLASSIC_5_SENSOR_FEATURES,
  DEFAULT_MULTI_SENSOR_SUBSETS,
} from '../engine/sensors';
import { DIFFICULTY_SETTINGS } from '../engine/simulation';
import { computeRemainingTrialsCount } from '../engine/trialGrid';
import type {
  ExperimentRunRecord,
  QueuedExperiment,
  ResearchProgress,
  ResearchSweepConfig,
  ResearchTrialResult,
} from '../engine/types';

export const DEFAULT_SWEEP_CONFIG: ResearchSweepConfig = {
  algorithms: ['GA', 'DE'],
  difficulties: ['EASY', 'MEDIUM', 'HARD', 'INSANE'],
  inputFeatureSets: DEFAULT_MULTI_SENSOR_SUBSETS.map((s) => [...s]),
  topologies: [[], [2], [4], [2, 2]],
  architectures: ['MLP', 'LTC_FLY', 'NEUROCHEM_GATE'],
  weightPrecisions: ['FP32', 'INT4', 'TERNARY'],
  maxParameters: 80,
  populationSizes: [150],
  mutationRates: [0.16],
  mutationStrengths: [0.4],
  maxGenerations: 40,
  stagnationLimit: 15,
  targetPipeCap: 500,
  verificationSeeds: 3,
  workerThreads: 0,
  performancePriority: 70,
  computeBackend: 'AUTO',
  auditParallelism: true,
  scheduleMode: 'BALANCED',
  smartPrune: true,
  curriculumLearning: false,
  shapedFitness: false,
  morphogenesisMode: 'STATIC',
  evolutionTopologyMode: 'SINGLE_SPECIES',
  autosaveIntervalSec: 60,
  customEnvironment: { ...DIFFICULTY_SETTINGS.CUSTOM },
};

export const INITIAL_RESEARCH_PROGRESS: ResearchProgress = {
  status: 'IDLE',
  currentTrialIndex: 0,
  completedTrials: 0,
  totalTrials: 0,
  workerCount: 1,
  activeWorkers: [],
  activeAlgorithm: null,
  activeDifficulty: null,
  activeTopology: [],
  activeHiddenNodes: 0,
  activePopulationSize: 0,
  activeMutationRate: 0,
  activeMutationStrength: 0,
  activeGeneration: 0,
  activeBestScore: 0,
  activePhase: 'TRAINING',
  elapsedMs: 0,
};

export function useResearchSession(showNotice: (msg: string) => void) {
  const [sweepConfig, setSweepConfig] =
    useState<ResearchSweepConfig>(DEFAULT_SWEEP_CONFIG);
  const [researchProgress, setResearchProgress] = useState<ResearchProgress>(
    INITIAL_RESEARCH_PROGRESS
  );
  const [researchResults, setResearchResults] = useState<ResearchTrialResult[]>(
    []
  );
  const [autosavedAt, setAutosavedAt] = useState<string | null>(null);
  const [unsavedCount, setUnsavedCount] = useState(0);
  const [wasInterrupted, setWasInterrupted] = useState(false);
  const [experimentQueue, setExperimentQueue] = useState<QueuedExperiment[]>(
    () => loadExperimentQueue()
  );
  const [queueActive, setQueueActive] = useState(false);
  const [runHistory, setRunHistory] = useState<ExperimentRunRecord[]>([]);
  const [activeRunLabel, setActiveRunLabel] = useState<string>('Custom Protocol');

  const sessionHydratedRef = useRef(false);
  const researchPoolRef = useRef<ResearchPool | null>(null);
  const resultsMapRef = useRef<Map<string, ResearchTrialResult>>(new Map());
  const bestBucketScoreRef = useRef<Map<string, number>>(new Map());
  const retainedBrainsCountRef = useRef(0);
  const dirtySigsRef = useRef<Set<string>>(new Set());
  const needsFullV2SyncRef = useRef(false);
  const isSavingRef = useRef(false);
  const queuedSaveStatusRef = useRef<ResearchProgress['status'] | null>(null);
  const dirtyRef = useRef(false);
  const unsavedCountRef = useRef(0);
  const pendingUiFlushRef = useRef(false);
  const lastUiFlushMsRef = useRef(
    typeof performance !== 'undefined' ? performance.now() : 0
  );
  const latestProgressRef = useRef<ResearchProgress>(INITIAL_RESEARCH_PROGRESS);
  const sweepConfigRef = useRef<ResearchSweepConfig>(DEFAULT_SWEEP_CONFIG);
  sweepConfigRef.current = sweepConfig;
  const researchStatusRef = useRef<ResearchProgress['status']>('IDLE');
  researchStatusRef.current = researchProgress.status;
  const experimentQueueRef = useRef<QueuedExperiment[]>(experimentQueue);
  experimentQueueRef.current = experimentQueue;
  const queueActiveRef = useRef<boolean>(queueActive);
  queueActiveRef.current = queueActive;
  const activeRunLabelRef = useRef<string>(activeRunLabel);
  activeRunLabelRef.current = activeRunLabel;
  const activeQueueItemIdRef = useRef<string | null>(null);
  const activePresetIdRef = useRef<string | undefined>(undefined);
  const runStartedAtRef = useRef<number>(Date.now());
  const launchQueueItemRef = useRef<(item: QueuedExperiment) => void>(() => {});
  const archiveRunRef = useRef<
    (status: 'COMPLETED' | 'STOPPED', prog?: ResearchProgress) => void
  >(() => {});

  const flushResultsToState = useCallback(() => {
    const t0 = performance.now();
    pendingUiFlushRef.current = false;
    lastUiFlushMsRef.current = t0;
    const nextArr = Array.from(resultsMapRef.current.values());
    startTransition(() => {
      setResearchResults(nextArr);
    });
    setUnsavedCount(unsavedCountRef.current);
    researchPoolRef.current?.recordUiFlushMs(performance.now() - t0);
  }, []);

  const persistSessionNow = useCallback(
    async (statusOverride?: ResearchProgress['status']): Promise<boolean> => {
      if (!sessionHydratedRef.current) return false;
      if (isSavingRef.current) {
        // Never drop a final COMPLETED/IDLE/PAUSED save if an autosave is mid-flight
        queuedSaveStatusRef.current = statusOverride ?? researchStatusRef.current;
        return false;
      }

      const totalCount = resultsMapRef.current.size;
      const status = statusOverride ?? researchStatusRef.current;
      if (totalCount === 0 && status === 'IDLE' && !needsFullV2SyncRef.current) {
        dirtyRef.current = false;
        dirtySigsRef.current.clear();
        unsavedCountRef.current = 0;
        setUnsavedCount(0);
        return false;
      }

      isSavingRef.current = true;
      let ok = false;
      try {
        const replaceAll = needsFullV2SyncRef.current;
        const snapshotSigs = Array.from(dirtySigsRef.current);
        let trialsToWrite: ResearchTrialResult[];
        if (replaceAll) {
          trialsToWrite = Array.from(resultsMapRef.current.values());
        } else {
          trialsToWrite = [];
          for (let i = 0; i < snapshotSigs.length; i++) {
            const item = resultsMapRef.current.get(snapshotSigs[i]);
            if (item) trialsToWrite.push(item);
          }
        }

        const updatedAt = new Date().toISOString();
        const isRunningOrPaused = status === 'RUNNING' || status === 'PAUSED';

        ok = await saveResearchSessionIncremental(
          {
            updatedAt,
            sweepConfig: sweepConfigRef.current,
            wasRunning: isRunningOrPaused,
            trialCount: totalCount,
          },
          trialsToWrite,
          { replaceAll }
        );
        if (ok) {
          if (replaceAll) {
            needsFullV2SyncRef.current = false;
          }
          for (let i = 0; i < snapshotSigs.length; i++) {
            dirtySigsRef.current.delete(snapshotSigs[i]);
          }
          unsavedCountRef.current = dirtySigsRef.current.size;
          dirtyRef.current = dirtySigsRef.current.size > 0;
          setUnsavedCount(unsavedCountRef.current);
          setAutosavedAt(updatedAt);
        }
        return ok;
      } finally {
        isSavingRef.current = false;
        const queuedStatus = queuedSaveStatusRef.current;
        if (queuedStatus !== null) {
          queuedSaveStatusRef.current = null;
          void persistSessionNow(queuedStatus);
        }
      }
    },
    []
  );

  /**
   * Archives completed/stopped runs into IndexedDB Run History asynchronously via
   * the dedicated Analytics Web Worker (zero main-thread lag spikes on large datasets!).
   */
  const archiveCurrentRun = useCallback(
    (status: 'COMPLETED' | 'STOPPED', prog?: ResearchProgress) => {
      const trials = Array.from(resultsMapRef.current.values());
      if (trials.length === 0) return;

      const cfg = structuredClone(sweepConfigRef.current);
      const runName = activeRunLabelRef.current || 'Research Sweep';
      const presetId = activePresetIdRef.current;
      const completedAtMs = Date.now();
      const startedAtMs = runStartedAtRef.current || completedAtMs;
      const durationSec = Math.max(
        0.1,
        prog && prog.elapsedMs > 0
          ? prog.elapsedMs / 1000
          : (completedAtMs - startedAtMs) / 1000
      );
      const perfMetrics = researchPoolRef.current?.getPerfReportSnapshot() ?? null;
      const perfLogMarkdown =
        researchPoolRef.current?.getPerfReport() ?? 'No performance trace recorded.';

      void analyticsClient
        .buildArchiveSnapshot(trials, cfg)
        .then(({ findings, scientificReportMarkdown, integrity }) => {
          let g1Perfect = 0;
          let bestMinSeedScore = 0;
          let bestTrial: ResearchTrialResult | null = null;
          const diffSet = new Set<string>();
          const archSet = new Set<string>();
          const algoSet = new Set<string>();

          for (let i = 0; i < trials.length; i++) {
            const t = trials[i];
            diffSet.add(t.difficulty);
            archSet.add(t.architecture ?? 'MLP');
            algoSet.add(t.algorithm);
            if (t.verifiedPerfect && t.generationsRun <= 1) g1Perfect += 1;
            if (t.minSeedScore > bestMinSeedScore) {
              bestMinSeedScore = t.minSeedScore;
              bestTrial = t;
            }
          }

          const bestTrialSummary = bestTrial
            ? `${ALGORITHM_SHORT_LABELS[bestTrial.algorithm]} · ${bestTrial.topologyLabel} · ${bestTrial.difficulty} (${bestTrial.minSeedScore}p)`
            : 'None';

          const record: ExperimentRunRecord = {
            id: `run-${completedAtMs}-${Math.random().toString(36).slice(2, 6)}`,
            name: runName,
            presetId,
            startedAt: new Date(startedAtMs).toISOString(),
            completedAt: new Date(completedAtMs).toISOString(),
            status,
            durationSec,
            config: cfg,
            summary: {
              totalTrials: trials.length,
              verifiedPerfect: findings.totalPerfect,
              g1Perfect,
              perfectRatePct:
                trials.length > 0 ? (findings.totalPerfect / trials.length) * 100 : 0,
              bestMinSeedScore,
              bestTrialSummary,
              scenariosCount: diffSet.size,
              architecturesCount: archSet.size,
              algorithmsCount: algoSet.size,
            },
            perfMetrics,
            perfLogMarkdown,
            scientificReportMarkdown,
            integrity,
            perfReviewedAt: null,
            reportReviewedAt: null,
            metaReviewedAt: null,
          };

          setRunHistory((prev) => [record, ...prev]);
          void saveRunHistoryRecord(record);
        })
        .catch(() => {
          // Non-fatal archiving error
        });
    },
    []
  );
  archiveRunRef.current = archiveCurrentRun;

  // Initialize ResearchPool, hydrate IndexedDB session + history, manage periodic UI flush & visibility
  useEffect(() => {
    const pool = new ResearchPool({
      onProgress: (prog) => {
        latestProgressRef.current = prog;
        if (!document.hidden) {
          setResearchProgress(prog);
        }
      },
      onTrialComplete: (trial) => {
        const sig = getResultSignature(trial);
        // Smart memory compaction for large sweeps:
        // Keep 100% of metrics/autopsies, always keep full bestBrain weights for bucket
        // champions & up to 400 verified-perfect winners (plus all trials in small <250 runs),
        // and compact non-elite weight blobs + long scoreCurves to prevent renderer OOM reloads.
        const bucketKey = `${trial.difficulty}|${trial.architecture ?? 'MLP'}`;
        const prevBest = bestBucketScoreRef.current.get(bucketKey) ?? -1;
        const isBucketChamp = trial.minSeedScore >= prevBest;
        if (trial.minSeedScore > prevBest) {
          bestBucketScoreRef.current.set(bucketKey, trial.minSeedScore);
        }
        const currentCount = resultsMapRef.current.size;
        let storedTrial = trial;
        let nextBestBrain = trial.bestBrain;
        if (trial.bestBrain) {
          const keepBrain =
            isBucketChamp ||
            currentCount < 250 ||
            (trial.verifiedPerfect && retainedBrainsCountRef.current < 400);
          if (keepBrain) {
            retainedBrainsCountRef.current += 1;
          } else {
            nextBestBrain = null;
          }
        }
        let nextScoreCurve = trial.scoreCurve;
        if (
          !isBucketChamp &&
          currentCount >= 500 &&
          trial.scoreCurve &&
          trial.scoreCurve.length > 24
        ) {
          const src = trial.scoreCurve;
          const sampled: number[] = [];
          const stride = (src.length - 1) / 23;
          for (let k = 0; k < 24; k++) {
            sampled.push(src[Math.round(k * stride)]);
          }
          nextScoreCurve = sampled;
        }
        if (
          nextBestBrain !== trial.bestBrain ||
          nextScoreCurve !== trial.scoreCurve
        ) {
          storedTrial = {
            ...trial,
            bestBrain: nextBestBrain,
            scoreCurve: nextScoreCurve,
          };
        }
        resultsMapRef.current.set(sig, storedTrial);
        dirtySigsRef.current.add(sig);
        unsavedCountRef.current = dirtySigsRef.current.size;
        dirtyRef.current = true;
        pendingUiFlushRef.current = true;
        // Proactive incremental IndexedDB checkpoint during fast large sweeps
        if (dirtySigsRef.current.size >= 1000 && !isSavingRef.current) {
          void persistSessionNow();
        }
      },
      onSweepComplete: (prog) => {
        latestProgressRef.current = prog;
        researchStatusRef.current = prog.status;
        setResearchProgress(prog);
        setWasInterrupted(false);

        const finishedQueueId = activeQueueItemIdRef.current;
        if (finishedQueueId) {
          activeQueueItemIdRef.current = null;
          setExperimentQueue((prev) =>
            prev.map((q) =>
              q.id === finishedQueueId ? { ...q, status: 'COMPLETED' } : q
            )
          );
        }

        // Stagger post-sweep work after compute workers are terminated so GC reclaims
        // ~500-800MB RAM and IndexedDB, React flush, and Analytics never collide in one tick:
        // 1) Persist COMPLETED status immediately (atomic crash safety)
        // 2) Flush React results state after 120ms GC breath
        // 3) Archive snapshot asynchronously after 350ms
        void persistSessionNow(prog.status).finally(() => {
          window.setTimeout(() => {
            flushResultsToState();
          }, 120);

          window.setTimeout(() => {
            archiveRunRef.current('COMPLETED', prog);
          }, 350);

          if (queueActiveRef.current) {
            const nextPending = experimentQueueRef.current.find(
              (q) => q.id !== finishedQueueId && q.status === 'PENDING'
            );
            if (nextPending) {
              window.setTimeout(() => {
                if (queueActiveRef.current) {
                  launchQueueItemRef.current(nextPending);
                }
              }, 700);
            } else {
              setQueueActive(false);
              queueActiveRef.current = false;
              showNotice('All queued experiments completed & archived');
            }
          }
        });
      },
    });
    researchPoolRef.current = pool;

    loadRunHistory().then((records) => {
      setRunHistory(records);
    });

    loadResearchSession().then((saved) => {
      if (saved) {
        const hydratedConfig: ResearchSweepConfig = {
          ...DEFAULT_SWEEP_CONFIG,
          ...saved.sweepConfig,
          inputFeatureSets:
            saved.sweepConfig.inputFeatureSets &&
            saved.sweepConfig.inputFeatureSets.length > 0
              ? saved.sweepConfig.inputFeatureSets
              : [[...CLASSIC_5_SENSOR_FEATURES]],
          performancePriority:
            typeof saved.sweepConfig.performancePriority === 'number'
              ? saved.sweepConfig.performancePriority
              : 70,
          smartPrune:
            typeof saved.sweepConfig.smartPrune === 'boolean'
              ? saved.sweepConfig.smartPrune
              : true,
          curriculumLearning: Boolean(saved.sweepConfig.curriculumLearning),
          shapedFitness: Boolean(saved.sweepConfig.shapedFitness),
          auditParallelism:
            typeof saved.sweepConfig.auditParallelism === 'boolean'
              ? saved.sweepConfig.auditParallelism
              : true,
          computeBackend:
            saved.sweepConfig.computeBackend === 'AUTO' ||
            saved.sweepConfig.computeBackend === 'GPU' ||
            saved.sweepConfig.computeBackend === 'HYBRID' ||
            saved.sweepConfig.computeBackend === 'CPU'
              ? saved.sweepConfig.computeBackend
              : 'AUTO',
          scheduleMode:
            saved.sweepConfig.scheduleMode === 'LPT' ||
            saved.sweepConfig.scheduleMode === 'BALANCED'
              ? saved.sweepConfig.scheduleMode
              : 'BALANCED',
          autosaveIntervalSec:
            typeof saved.sweepConfig.autosaveIntervalSec === 'number'
              ? saved.sweepConfig.autosaveIntervalSec
              : 60,
          evolutionTopologyMode:
            saved.sweepConfig.evolutionTopologyMode === 'ISLAND_SPECIATION'
              ? 'ISLAND_SPECIATION'
              : 'SINGLE_SPECIES',
          islandSpecies: Array.isArray(saved.sweepConfig.islandSpecies)
            ? saved.sweepConfig.islandSpecies
            : undefined,
          customEnvironment:
            saved.sweepConfig.customEnvironment ?? { ...DIFFICULTY_SETTINGS.CUSTOM },
        };
        sweepConfigRef.current = hydratedConfig;
        setSweepConfig(hydratedConfig);
        resultsMapRef.current = new Map(
          saved.results.map((r) => [getResultSignature(r), r])
        );
        const hydratedBuckets = new Map<string, number>();
        let hydratedBrains = 0;
        for (let i = 0; i < saved.results.length; i++) {
          const r = saved.results[i];
          const bKey = `${r.difficulty}|${r.architecture ?? 'MLP'}`;
          if (r.minSeedScore > (hydratedBuckets.get(bKey) ?? -1)) {
            hydratedBuckets.set(bKey, r.minSeedScore);
          }
          if (r.bestBrain) hydratedBrains += 1;
        }
        bestBucketScoreRef.current = hydratedBuckets;
        retainedBrainsCountRef.current = hydratedBrains;
        needsFullV2SyncRef.current = Boolean(saved.migratedFromLegacy);
        setResearchResults(saved.results);
        setAutosavedAt(saved.updatedAt);
        setWasInterrupted(Boolean(saved.wasRunning));
      }
      sessionHydratedRef.current = true;
    });

    const uiFlushTimer = window.setInterval(() => {
      if (document.hidden || !pendingUiFlushRef.current) return;
      const count = resultsMapRef.current.size;
      const isRunning = researchStatusRef.current === 'RUNNING';
      if (isRunning && count > 50000) {
        setUnsavedCount(unsavedCountRef.current);
        return;
      }
      const minIntervalMs = isRunning
        ? count > 25000
          ? 120000
          : count > 10000
            ? 45000
            : count > 2000
              ? 15000
              : 6000
        : count > 50000
          ? 20000
          : 2500;
      if (performance.now() - lastUiFlushMsRef.current >= minIntervalMs) {
        flushResultsToState();
      } else if (isRunning) {
        setUnsavedCount(unsavedCountRef.current);
      }
    }, 2000);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (dirtyRef.current) {
          void persistSessionNow();
        }
      } else {
        setResearchProgress(latestProgressRef.current);
        if (
          pendingUiFlushRef.current &&
          (researchStatusRef.current !== 'RUNNING' ||
            performance.now() - lastUiFlushMsRef.current >= 10000)
        ) {
          flushResultsToState();
        }
      }
    };

    const handlePageHide = () => {
      if (
        dirtyRef.current &&
        !needsFullV2SyncRef.current &&
        dirtySigsRef.current.size <= 5000
      ) {
        void persistSessionNow();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      window.clearInterval(uiFlushTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      pool.dispose();
      researchPoolRef.current = null;
    };
  }, [flushResultsToState, persistSessionNow, showNotice]);

  useEffect(() => {
    saveExperimentQueue(experimentQueue);
  }, [experimentQueue]);

  useEffect(() => {
    const intervalSec = sweepConfig.autosaveIntervalSec ?? 60;
    if (intervalSec <= 0) return;

    const timer = window.setInterval(() => {
      if (dirtyRef.current) {
        void persistSessionNow();
      }
    }, intervalSec * 1000);

    return () => window.clearInterval(timer);
  }, [sweepConfig.autosaveIntervalSec, persistSessionNow]);

  // Background-tab protection: hold a Web Lock + best-effort Screen Wake Lock while running
  useEffect(() => {
    if (researchProgress.status !== 'RUNNING') return;

    let released = false;
    let releaseWebLock: (() => void) | null = null;
    let wakeLockSentinel: { release: () => Promise<void> } | null = null;

    const navWithLocks = navigator as Navigator & {
      locks?: {
        request: (name: string, callback: () => Promise<void>) => Promise<void>;
      };
      wakeLock?: {
        request: (type: 'screen') => Promise<{ release: () => Promise<void> }>;
      };
    };

    if (navWithLocks.locks?.request) {
      void navWithLocks.locks
        .request('flappy-neurolab-active-sweep', () => {
          return new Promise<void>((resolve) => {
            if (released) {
              resolve();
              return;
            }
            releaseWebLock = resolve;
          });
        })
        .catch(() => {});
    }

    const acquireWakeLock = () => {
      if (released || document.hidden || !navWithLocks.wakeLock?.request || wakeLockSentinel) {
        return;
      }
      void navWithLocks.wakeLock
        .request('screen')
        .then((sentinel) => {
          if (released) {
            void sentinel.release().catch(() => {});
          } else {
            wakeLockSentinel = sentinel;
          }
        })
        .catch(() => {});
    };

    const handleWakeVisibility = () => {
      if (document.hidden) {
        wakeLockSentinel = null;
      } else {
        acquireWakeLock();
      }
    };

    acquireWakeLock();
    document.addEventListener('visibilitychange', handleWakeVisibility);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', handleWakeVisibility);
      if (releaseWebLock) {
        releaseWebLock();
        releaseWebLock = null;
      }
      if (wakeLockSentinel) {
        void wakeLockSentinel.release().catch(() => {});
        wakeLockSentinel = null;
      }
    };
  }, [researchProgress.status]);

  // Unified Single Source of Truth for remaining trials count
  const isSweepRunning = researchProgress.status === 'RUNNING';
  const completedSigSet = useMemo(() => {
    const set = new Set<string>();
    if (isSweepRunning) return set;
    for (let i = 0; i < researchResults.length; i++) {
      set.add(getResultSignature(researchResults[i]));
    }
    return set;
  }, [isSweepRunning, researchResults]);

  const deferredSweepConfig = useDeferredValue(sweepConfig);

  const remainingTrialsCount = useMemo(() => {
    if (isSweepRunning) return 0;
    return computeRemainingTrialsCount(
      deferredSweepConfig,
      researchResults,
      completedSigSet
    );
  }, [isSweepRunning, deferredSweepConfig, researchResults, completedSigSet]);

  const launchSweepWithConfig = useCallback(
    (
      nextCfg: ResearchSweepConfig,
      label: string,
      presetId?: string,
      queueItemId?: string | null
    ) => {
      sweepConfigRef.current = nextCfg;
      setSweepConfig(nextCfg);
      setActiveRunLabel(label);
      activeRunLabelRef.current = label;
      activePresetIdRef.current = presetId;
      activeQueueItemIdRef.current = queueItemId ?? null;
      runStartedAtRef.current = Date.now();

      resultsMapRef.current = new Map();
      bestBucketScoreRef.current = new Map();
      retainedBrainsCountRef.current = 0;
      dirtySigsRef.current.clear();
      needsFullV2SyncRef.current = true;
      dirtyRef.current = false;
      unsavedCountRef.current = 0;
      pendingUiFlushRef.current = false;
      lastUiFlushMsRef.current = performance.now();
      setUnsavedCount(0);
      setResearchResults([]);
      setWasInterrupted(false);
      researchPoolRef.current?.start(nextCfg);
    },
    []
  );

  const launchQueueItem = useCallback(
    (item: QueuedExperiment) => {
      setExperimentQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'RUNNING' } : q))
      );
      launchSweepWithConfig(item.config, item.name, item.presetId, item.id);
    },
    [launchSweepWithConfig]
  );
  launchQueueItemRef.current = launchQueueItem;

  const handleStartResearchSweep = useCallback(() => {
    setQueueActive(false);
    queueActiveRef.current = false;
    launchSweepWithConfig(sweepConfig, activeRunLabel || 'Custom Sweep');
  }, [activeRunLabel, launchSweepWithConfig, sweepConfig]);

  const handleContinueResearchSweep = useCallback(() => {
    setQueueActive(false);
    queueActiveRef.current = false;
    activeQueueItemIdRef.current = null;
    runStartedAtRef.current = Date.now();
    setWasInterrupted(false);
    lastUiFlushMsRef.current = performance.now();
    researchPoolRef.current?.start(sweepConfig, resultsMapRef.current);
  }, [sweepConfig]);

  const handlePauseResearchSweep = useCallback(() => {
    researchPoolRef.current?.pause();
    flushResultsToState();
    void persistSessionNow('PAUSED');
  }, [flushResultsToState, persistSessionNow]);

  const handleResumeResearchSweep = useCallback(() => {
    researchPoolRef.current?.resume();
  }, []);

  const handleSkipTrial = useCallback(() => {
    researchPoolRef.current?.skipSlowestTrial();
  }, []);

  const handleStopResearchSweep = useCallback(() => {
    const wasRunning =
      researchStatusRef.current === 'RUNNING' ||
      researchStatusRef.current === 'PAUSED';
    researchPoolRef.current?.stop();
    if (activeQueueItemIdRef.current) {
      const stoppedId = activeQueueItemIdRef.current;
      activeQueueItemIdRef.current = null;
      setExperimentQueue((prev) =>
        prev.map((q) => (q.id === stoppedId ? { ...q, status: 'STOPPED' } : q))
      );
    }
    setQueueActive(false);
    queueActiveRef.current = false;
    void persistSessionNow('IDLE').finally(() => {
      window.setTimeout(() => {
        flushResultsToState();
      }, 100);
      if (wasRunning && resultsMapRef.current.size > 0) {
        window.setTimeout(() => {
          archiveCurrentRun('STOPPED', latestProgressRef.current);
        }, 300);
      }
    });
  }, [archiveCurrentRun, flushResultsToState, persistSessionNow]);

  const handleResetActiveResearch = useCallback(() => {
    researchPoolRef.current?.stop();
    resultsMapRef.current = new Map();
    bestBucketScoreRef.current = new Map();
    retainedBrainsCountRef.current = 0;
    dirtySigsRef.current.clear();
    needsFullV2SyncRef.current = true;
    dirtyRef.current = false;
    unsavedCountRef.current = 0;
    pendingUiFlushRef.current = false;
    setUnsavedCount(0);
    setResearchResults([]);
    setResearchProgress(INITIAL_RESEARCH_PROGRESS);
  }, []);

  const handleChangePerformancePriority = useCallback((priority: number) => {
    setSweepConfig((prev) => {
      const next = { ...prev, performancePriority: priority };
      sweepConfigRef.current = next;
      return next;
    });
    researchPoolRef.current?.setPerformancePriority(priority);
  }, []);

  const handleChangeGpuLoadPercent = useCallback((gpuLoadPercent: number) => {
    const clamped = Math.max(10, Math.min(100, Math.round(gpuLoadPercent)));
    setSweepConfig((prev) => {
      const next = { ...prev, gpuLoadPercent: clamped };
      sweepConfigRef.current = next;
      return next;
    });
    researchPoolRef.current?.setGpuLoadPercent(clamped);
  }, []);

  const handleEnqueueCurrent = useCallback(
    (customName?: string) => {
      const item: QueuedExperiment = {
        id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: customName || activeRunLabel || 'Custom Sweep',
        addedAt: new Date().toISOString(),
        status: 'PENDING',
        config: structuredClone(sweepConfig),
      };
      setExperimentQueue((prev) => [...prev, item]);
      showNotice(`Queued "${item.name}"`);
    },
    [activeRunLabel, showNotice, sweepConfig]
  );

  const handleEnqueuePreset = useCallback(
    (presetId: PresetId) => {
      const preset = getPresetById(presetId);
      const item: QueuedExperiment = {
        id: `q-${presetId}-${Date.now()}`,
        name: preset.title,
        presetId: preset.id,
        notes: preset.subtitle,
        addedAt: new Date().toISOString(),
        status: 'PENDING',
        config: preset.buildConfig(structuredClone(sweepConfig)),
      };
      setExperimentQueue((prev) => [...prev, item]);
      showNotice(`Queued preset "${preset.title}"`);
    },
    [showNotice, sweepConfig]
  );

  const handleEnqueueThermalSweep = useCallback(() => {
    const items = buildThermalEfficiencySweepQueue(sweepConfig);
    setExperimentQueue((prev) => [...prev, ...items]);
    showNotice('Queued 4× Perf/Watt Thermal Calibration Sweep');
  }, [showNotice, sweepConfig]);

  const handleEnqueueValidationSuite = useCallback(() => {
    const items = buildValidationAndLoadQueue(sweepConfig);
    setExperimentQueue((prev) => [...prev, ...items]);
    showNotice('Queued 3-stage Self-Test & Load Suite');
  }, [showNotice, sweepConfig]);

  const handleRemoveQueueItem = useCallback((id: string) => {
    setExperimentQueue((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const handleMoveQueueItem = useCallback((id: string, dir: -1 | 1) => {
    setExperimentQueue((prev) => {
      const idx = prev.findIndex((q) => q.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(idx, 1);
      copy.splice(target, 0, moved);
      return copy;
    });
  }, []);

  const handleClearQueue = useCallback(() => {
    setQueueActive(false);
    queueActiveRef.current = false;
    setExperimentQueue((prev) => prev.filter((q) => q.status === 'RUNNING'));
  }, []);

  const handleStartQueue = useCallback(() => {
    const nextPending = experimentQueueRef.current.find(
      (q) => q.status === 'PENDING'
    );
    if (!nextPending) return;
    setQueueActive(true);
    queueActiveRef.current = true;
    launchQueueItem(nextPending);
  }, [launchQueueItem]);

  const handleStopQueue = useCallback(() => {
    setQueueActive(false);
    queueActiveRef.current = false;
    showNotice('Auto-queue stopped (current run will finish normally)');
  }, [showNotice]);

  const handleLoadConfigFromHistory = useCallback(
    (cfg: ResearchSweepConfig, label: string) => {
      const cloned = structuredClone(cfg);
      sweepConfigRef.current = cloned;
      setSweepConfig(cloned);
      setActiveRunLabel(label);
      showNotice(`Loaded config from "${label}"`);
    },
    [showNotice]
  );

  const handleRequeueFromHistory = useCallback(
    (rec: ExperimentRunRecord) => {
      const item: QueuedExperiment = {
        id: `q-re-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: rec.name,
        presetId: rec.presetId,
        addedAt: new Date().toISOString(),
        status: 'PENDING',
        config: structuredClone(rec.config),
      };
      setExperimentQueue((prev) => [...prev, item]);
      showNotice(`Re-queued "${rec.name}"`);
    },
    [showNotice]
  );

  const handleMarkReviewed = useCallback(
    (
      ids: string[],
      patch: {
        perfReviewedAt?: string | null;
        reportReviewedAt?: string | null;
        metaReviewedAt?: string | null;
      }
    ) => {
      const idSet = new Set(ids);
      setRunHistory((prev) =>
        prev.map((rec) =>
          idSet.has(rec.id)
            ? {
                ...rec,
                perfReviewedAt:
                  patch.perfReviewedAt !== undefined
                    ? patch.perfReviewedAt
                    : rec.perfReviewedAt,
                reportReviewedAt:
                  patch.reportReviewedAt !== undefined
                    ? patch.reportReviewedAt
                    : rec.reportReviewedAt,
                metaReviewedAt:
                  patch.metaReviewedAt !== undefined
                    ? patch.metaReviewedAt
                    : rec.metaReviewedAt,
              }
            : rec
        )
      );
      void updateRunReviewFlags(ids, patch);
    },
    []
  );

  const handleDeleteHistoryItem = useCallback((id: string) => {
    setRunHistory((prev) => prev.filter((r) => r.id !== id));
    void deleteRunHistoryRecord(id);
  }, []);

  const handleClearHistory = useCallback(() => {
    setRunHistory([]);
    void clearRunHistory();
    showNotice('Cleared archived run history');
  }, [showNotice]);

  const handleSaveSessionNow = useCallback(() => {
    flushResultsToState();
    void persistSessionNow().then((ok) => {
      if (ok) showNotice('Checkpoint saved to IndexedDB');
    });
  }, [flushResultsToState, persistSessionNow, showNotice]);

  const handleClearSavedSession = useCallback(() => {
    researchPoolRef.current?.stop();
    resultsMapRef.current = new Map();
    dirtySigsRef.current.clear();
    needsFullV2SyncRef.current = false;
    dirtyRef.current = false;
    unsavedCountRef.current = 0;
    pendingUiFlushRef.current = false;
    setUnsavedCount(0);
    setResearchResults([]);
    setResearchProgress(INITIAL_RESEARCH_PROGRESS);
    setAutosavedAt(null);
    setWasInterrupted(false);
    void clearResearchSession();
    showNotice('Cleared cached research session');
  }, [showNotice]);

  const handleImportJsonDataset = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          const rawTrials: ResearchTrialResult[] = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed?.trials)
              ? parsed.trials
              : [];
          if (rawTrials.length === 0) {
            showNotice('No valid trials found in JSON file');
            return;
          }
          const enriched = rawTrials.map((t) => ({
            ...t,
            trialSignature: getResultSignature(t),
            policyProfile:
              t.policyProfile ?? analyzePolicyMechanism(t.bestBrain ?? null),
          }));
          let addedCount = 0;
          let updatedCount = 0;
          let perfectImported = 0;
          for (const r of enriched) {
            const sig = getResultSignature(r);
            if (resultsMapRef.current.has(sig)) {
              updatedCount += 1;
            } else {
              addedCount += 1;
            }
            if (r.verifiedPerfect) perfectImported += 1;
            resultsMapRef.current.set(sig, r);
            dirtySigsRef.current.add(sig);
          }
          dirtyRef.current = true;
          unsavedCountRef.current = dirtySigsRef.current.size;
          if (parsed?.protocol && Array.isArray(parsed.protocol.algorithms)) {
            const nextProtocol: ResearchSweepConfig = {
              ...sweepConfigRef.current,
              ...parsed.protocol,
              customEnvironment:
                parsed.protocol.customEnvironment ??
                sweepConfigRef.current.customEnvironment,
            };
            sweepConfigRef.current = nextProtocol;
            setSweepConfig(nextProtocol);
          }
          flushResultsToState();
          setWasInterrupted(false);
          void persistSessionNow();
          const colabGpu =
            parsed?.source === 'GOOGLE_COLAB_CUDA' && parsed?.colabMeta?.gpu
              ? ` (${String(parsed.colabMeta.gpu)})`
              : '';
          showNotice(
            `Imported ${enriched.length} trials${colabGpu}: +${addedCount} new, ${updatedCount} updated, ${perfectImported} PERFECT`
          );
        } catch {
          showNotice('Could not parse research JSON dataset');
        }
      };
      reader.readAsText(file);
    },
    [flushResultsToState, persistSessionNow, showNotice]
  );

  const getPerfReport = useCallback(
    () => researchPoolRef.current?.getPerfReport() ?? null,
    []
  );

  return {
    sweepConfig,
    setSweepConfig,
    researchProgress,
    researchResults,
    autosavedAt,
    unsavedCount,
    remainingTrialsCount,
    wasInterrupted,
    experimentQueue,
    queueActive,
    runHistory,
    activeRunLabel,
    setActiveRunLabel,
    handleStartResearchSweep,
    handleContinueResearchSweep,
    handlePauseResearchSweep,
    handleResumeResearchSweep,
    handleSkipTrial,
    handleStopResearchSweep,
    handleResetActiveResearch,
    handleChangePerformancePriority,
    handleChangeGpuLoadPercent,
    handleEnqueueCurrent,
    handleEnqueuePreset,
    handleEnqueueThermalSweep,
    handleEnqueueValidationSuite,
    handleRemoveQueueItem,
    handleMoveQueueItem,
    handleClearQueue,
    handleStartQueue,
    handleStopQueue,
    handleLoadConfigFromHistory,
    handleRequeueFromHistory,
    handleMarkReviewed,
    handleDeleteHistoryItem,
    handleClearHistory,
    handleSaveSessionNow,
    handleClearSavedSession,
    handleImportJsonDataset,
    getPerfReport,
  };
}
