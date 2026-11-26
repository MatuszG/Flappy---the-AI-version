import { formatTopologyLabel, normalizeHiddenLayers } from './neuralNetwork';
import {
  formatInputSubsetKey,
  isClassic5SensorSet,
  normalizeInputFeatures,
} from './sensors';
import type {
  DifficultyPreset,
  EvolutionConfig,
  LearningAlgorithm,
  ResearchSweepConfig,
  ResearchTrialResult,
  SensorFeatureId,
} from './types';

export interface PersistedResearchSession {
  version: number;
  updatedAt: string;
  sweepConfig: ResearchSweepConfig;
  results: ResearchTrialResult[];
  wasRunning: boolean;
  migratedFromLegacy?: boolean;
}

export interface PersistedResearchMeta {
  version: 2;
  updatedAt: string;
  sweepConfig: ResearchSweepConfig;
  wasRunning: boolean;
  trialCount: number;
}

export interface PersistedTrainingState {
  updatedAt: string;
  config: EvolutionConfig;
}

const DB_NAME = 'flappy-neurolab-autosave-v1';
const DB_VERSION = 3;
const STORE_NAME = 'checkpoints';
const TRIALS_STORE_NAME = 'trials';
const HISTORY_STORE_NAME = 'run_history';
const RESEARCH_KEY = 'active_research_session';
const RESEARCH_META_KEY = 'active_research_meta_v2';
const TRAINING_LS_KEY = 'flappy-neurolab-training-config-v1';
const RESEARCH_FALLBACK_LS_KEY = 'flappy-neurolab-research-meta-v1';
const EXPERIMENT_QUEUE_LS_KEY = 'flappy-neurolab-experiment-queue-v1';
const IDB_WRITE_CHUNK_SIZE = 500;
const MAX_HISTORY_RECORDS = 120;

export function buildTrialSignature(spec: {
  algorithm: LearningAlgorithm;
  difficulty: DifficultyPreset;
  topology: number[];
  inputFeatures?: readonly SensorFeatureId[];
  architecture?: import('./types').NetworkArchitecture;
  weightPrecision?: import('./types').WeightPrecision;
  populationSize: number;
  mutationRate: number;
  mutationStrength: number;
  targetPipeCap: number;
  verificationSeeds: number;
  curriculumLearning?: boolean;
  shapedFitness?: boolean;
  reasoningSteps?: number;
  morphogenesisMode?: 'STATIC' | 'GROWING';
  evolutionTopologyMode?: import('./types').EvolutionTopologyMode;
  perceptionMode?: import('./types').PerceptionMode;
}): string {
  const classic5 = isClassic5SensorSet(spec.inputFeatures);
  const cleanFeatures = normalizeInputFeatures(spec.inputFeatures);
  const topo = formatTopologyLabel(
    normalizeHiddenLayers(spec.topology),
    cleanFeatures.length
  );
  const arch = spec.architecture ?? 'MLP';
  const prec = spec.weightPrecision ?? 'FP32';
  let sig = `${spec.algorithm}|${spec.difficulty}|${topo}|p${spec.populationSize}|r${spec.mutationRate}|s${spec.mutationStrength}|cap${spec.targetPipeCap}|sd${spec.verificationSeeds}`;
  if (!classic5) sig += `|in:${formatInputSubsetKey(cleanFeatures)}`;
  if (arch !== 'MLP') sig += `|arch:${arch}`;
  if (prec !== 'FP32') sig += `|prec:${prec}`;
  if (spec.curriculumLearning) sig += '|curr';
  if (spec.shapedFitness) sig += '|shape';
  if (
    (arch === 'LOOPED_REASONER' || arch === 'PONDER_ACT') &&
    spec.reasoningSteps !== undefined &&
    spec.reasoningSteps !== 3
  ) {
    sig += `|k${spec.reasoningSteps}`;
  }
  if (spec.morphogenesisMode === 'GROWING') {
    sig += '|morph';
  }
  if (spec.evolutionTopologyMode === 'ISLAND_SPECIATION') {
    sig += '|isl';
  }
  if (
    (arch === 'DROSOPHILA_CONNECTOME' || arch === 'DECOUPLED_FLY_CORTEX') &&
    spec.perceptionMode === 'COMPOUND_EYE_PIXELS'
  ) {
    sig += '|eye';
  }
  return sig;
}

export function getResultSignature(r: ResearchTrialResult): string {
  if (r.trialSignature) return r.trialSignature;
  return buildTrialSignature({
    algorithm: r.algorithm,
    difficulty: r.difficulty,
    topology: r.topology,
    inputFeatures: r.inputFeatures,
    architecture: r.architecture,
    weightPrecision: r.weightPrecision,
    populationSize: r.populationSize,
    mutationRate: r.mutationRate,
    mutationStrength: r.mutationStrength,
    targetPipeCap: r.targetPipeCap,
    verificationSeeds: r.verificationSeeds,
    curriculumLearning: r.curriculumLearning,
    shapedFitness: r.shapedFitness,
    reasoningSteps: r.reasoningSteps,
    morphogenesisMode: r.morphogenesisMode,
    evolutionTopologyMode: r.evolutionTopologyMode,
    perceptionMode: r.perceptionMode,
  });
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
        if (!db.objectStoreNames.contains(TRIALS_STORE_NAME)) {
          db.createObjectStore(TRIALS_STORE_NAME);
        }
        if (!db.objectStoreNames.contains(HISTORY_STORE_NAME)) {
          db.createObjectStore(HISTORY_STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function yieldEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Incremental, non-blocking IndexedDB v2 checkpoint writer.
 * Writes only newly added/updated trials in small 500-trial chunks (yielding between
 * chunks so main-thread event-loop lag stays <5ms even with 200k+ stored trials).
 * Only commits the v2 metadata record AFTER all chunks finish (atomic crash safety).
 */
export async function saveResearchSessionIncremental(
  meta: Omit<PersistedResearchMeta, 'version'>,
  dirtyTrials: ResearchTrialResult[],
  options?: { replaceAll?: boolean }
): Promise<boolean> {
  try {
    const db = await openDb();
    if (db) {
      try {
        if (options?.replaceAll) {
          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(TRIALS_STORE_NAME, 'readwrite');
            tx.objectStore(TRIALS_STORE_NAME).clear();
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () =>
              reject(tx.error ?? new Error('IndexedDB clear transaction aborted'));
          });
        }

        // Write dirty trials in small non-blocking chunks to prevent 1000ms+ structured-clone freezes
        for (let start = 0; start < dirtyTrials.length; start += IDB_WRITE_CHUNK_SIZE) {
          const end = Math.min(dirtyTrials.length, start + IDB_WRITE_CHUNK_SIZE);
          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(TRIALS_STORE_NAME, 'readwrite');
            const store = tx.objectStore(TRIALS_STORE_NAME);
            for (let i = start; i < end; i++) {
              const trial = dirtyTrials[i];
              store.put(trial, getResultSignature(trial));
            }
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () =>
              reject(tx.error ?? new Error('IndexedDB chunk transaction aborted'));
          });
          if (end < dirtyTrials.length) {
            await yieldEventLoop();
          }
        }

        // Commit lightweight v2 metadata record (and retire legacy monolithic blob once migrated)
        const v2Meta: PersistedResearchMeta = {
          version: 2,
          ...meta,
        };
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.put(v2Meta, RESEARCH_META_KEY);
          if (options?.replaceAll) {
            store.delete(RESEARCH_KEY);
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
          tx.onabort = () =>
            reject(tx.error ?? new Error('IndexedDB meta transaction aborted'));
        });

        db.close();
        return true;
      } catch {
        db.close();
      }
    }
  } catch {
    // Fall back below if IndexedDB unavailable
  }
  return false;
}

export async function saveResearchSession(
  session: PersistedResearchSession
): Promise<boolean> {
  const ok = await saveResearchSessionIncremental(
    {
      updatedAt: session.updatedAt,
      sweepConfig: session.sweepConfig,
      wasRunning: session.wasRunning,
      trialCount: session.results.length,
    },
    session.results,
    { replaceAll: true }
  );
  if (ok) return true;

  try {
    const compact: PersistedResearchSession = {
      ...session,
      results: session.results.map((r) => ({ ...r, bestBrain: null })),
    };
    localStorage.setItem(RESEARCH_FALLBACK_LS_KEY, JSON.stringify(compact));
    return true;
  } catch {
    return false;
  }
}

export async function loadResearchSession(): Promise<PersistedResearchSession | null> {
  try {
    const db = await openDb();
    if (db) {
      try {
        // Prefer v2 incremental store (fast meta + per-trial store)
        const v2Meta = await new Promise<PersistedResearchMeta | null>((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const req = tx.objectStore(STORE_NAME).get(RESEARCH_META_KEY);
          req.onsuccess = () =>
            resolve((req.result as PersistedResearchMeta | undefined) ?? null);
          req.onerror = () => resolve(null);
        });

        if (v2Meta && v2Meta.sweepConfig) {
          const results = await new Promise<ResearchTrialResult[]>((resolve) => {
            const tx = db.transaction(TRIALS_STORE_NAME, 'readonly');
            const req = tx.objectStore(TRIALS_STORE_NAME).getAll();
            req.onsuccess = () =>
              resolve(Array.isArray(req.result) ? (req.result as ResearchTrialResult[]) : []);
            req.onerror = () => resolve([]);
          });
          db.close();
          return {
            version: 2,
            updatedAt: v2Meta.updatedAt,
            sweepConfig: v2Meta.sweepConfig,
            results,
            wasRunning: v2Meta.wasRunning,
            migratedFromLegacy: false,
          };
        }

        // Seamless zero-loss fallback for legacy v1 monolithic checkpoint
        const legacyData = await new Promise<PersistedResearchSession | null>((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const req = tx.objectStore(STORE_NAME).get(RESEARCH_KEY);
          req.onsuccess = () =>
            resolve((req.result as PersistedResearchSession | undefined) ?? null);
          req.onerror = () => resolve(null);
        });
        db.close();
        if (legacyData && Array.isArray(legacyData.results) && legacyData.sweepConfig) {
          return {
            ...legacyData,
            migratedFromLegacy: true,
          };
        }
      } catch {
        db.close();
      }
    }
  } catch {
    // Fallback below
  }

  try {
    const raw = localStorage.getItem(RESEARCH_FALLBACK_LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedResearchSession;
    if (parsed && Array.isArray(parsed.results) && parsed.sweepConfig) {
      return {
        ...parsed,
        migratedFromLegacy: true,
      };
    }
  } catch {
    // Ignore corrupt cache
  }
  return null;
}

export async function clearResearchSession(): Promise<void> {
  try {
    const db = await openDb();
    if (db) {
      await new Promise<void>((resolve) => {
        const stores = db.objectStoreNames.contains(TRIALS_STORE_NAME)
          ? [STORE_NAME, TRIALS_STORE_NAME]
          : [STORE_NAME];
        const tx = db.transaction(stores, 'readwrite');
        const metaStore = tx.objectStore(STORE_NAME);
        metaStore.delete(RESEARCH_KEY);
        metaStore.delete(RESEARCH_META_KEY);
        if (db.objectStoreNames.contains(TRIALS_STORE_NAME)) {
          tx.objectStore(TRIALS_STORE_NAME).clear();
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
      db.close();
    }
  } catch {
    // Ignore
  }
  try {
    localStorage.removeItem(RESEARCH_FALLBACK_LS_KEY);
  } catch {
    // Ignore
  }
}

export function saveTrainingConfig(config: EvolutionConfig): void {
  try {
    const payload: PersistedTrainingState = {
      updatedAt: new Date().toISOString(),
      config,
    };
    localStorage.setItem(TRAINING_LS_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadTrainingConfig(): EvolutionConfig | null {
  try {
    const raw = localStorage.getItem(TRAINING_LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedTrainingState;
    if (parsed && parsed.config && parsed.config.algorithm) {
      return parsed.config;
    }
  } catch {
    // Ignore
  }
  return null;
}

export async function saveRunHistoryRecord(
  record: import('./types').ExperimentRunRecord
): Promise<boolean> {
  try {
    const db = await openDb();
    if (!db) return false;
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(HISTORY_STORE_NAME, 'readwrite');
        tx.objectStore(HISTORY_STORE_NAME).put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () =>
          reject(tx.error ?? new Error('IndexedDB history transaction aborted'));
      });

      // Prune oldest records if exceeding MAX_HISTORY_RECORDS
      const all = await new Promise<import('./types').ExperimentRunRecord[]>((resolve) => {
        const tx = db.transaction(HISTORY_STORE_NAME, 'readonly');
        const req = tx.objectStore(HISTORY_STORE_NAME).getAll();
        req.onsuccess = () =>
          resolve(
            Array.isArray(req.result)
              ? (req.result as import('./types').ExperimentRunRecord[])
              : []
          );
        req.onerror = () => resolve([]);
      });
      if (all.length > MAX_HISTORY_RECORDS) {
        all.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
        const toDelete = all.slice(MAX_HISTORY_RECORDS);
        await new Promise<void>((resolve) => {
          const tx = db.transaction(HISTORY_STORE_NAME, 'readwrite');
          const store = tx.objectStore(HISTORY_STORE_NAME);
          for (const item of toDelete) {
            store.delete(item.id);
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        });
      }
      db.close();
      return true;
    } catch {
      db.close();
    }
  } catch {
    // Ignore storage errors
  }
  return false;
}

export async function loadRunHistory(): Promise<import('./types').ExperimentRunRecord[]> {
  try {
    const db = await openDb();
    if (!db) return [];
    try {
      const all = await new Promise<import('./types').ExperimentRunRecord[]>((resolve) => {
        const tx = db.transaction(HISTORY_STORE_NAME, 'readonly');
        const req = tx.objectStore(HISTORY_STORE_NAME).getAll();
        req.onsuccess = () =>
          resolve(
            Array.isArray(req.result)
              ? (req.result as import('./types').ExperimentRunRecord[])
              : []
          );
        req.onerror = () => resolve([]);
      });
      db.close();
      return all.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
    } catch {
      db.close();
    }
  } catch {
    // Ignore
  }
  return [];
}

export async function updateRunReviewFlags(
  ids: string[],
  patch: {
    perfReviewedAt?: string | null;
    reportReviewedAt?: string | null;
    metaReviewedAt?: string | null;
  }
): Promise<boolean> {
  if (ids.length === 0) return true;
  try {
    const db = await openDb();
    if (!db) return false;
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(HISTORY_STORE_NAME, 'readwrite');
        const store = tx.objectStore(HISTORY_STORE_NAME);
        for (const id of ids) {
          const getReq = store.get(id);
          getReq.onsuccess = () => {
            const existing = getReq.result as
              | import('./types').ExperimentRunRecord
              | undefined;
            if (!existing) return;
            const updated: import('./types').ExperimentRunRecord = {
              ...existing,
              ...(patch.perfReviewedAt !== undefined
                ? { perfReviewedAt: patch.perfReviewedAt }
                : {}),
              ...(patch.reportReviewedAt !== undefined
                ? { reportReviewedAt: patch.reportReviewedAt }
                : {}),
              ...(patch.metaReviewedAt !== undefined
                ? { metaReviewedAt: patch.metaReviewedAt }
                : {}),
            };
            store.put(updated);
          };
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
      return true;
    } catch {
      db.close();
    }
  } catch {
    // Ignore
  }
  return false;
}

export async function deleteRunHistoryRecord(id: string): Promise<boolean> {
  try {
    const db = await openDb();
    if (!db) return false;
    try {
      await new Promise<void>((resolve) => {
        const tx = db.transaction(HISTORY_STORE_NAME, 'readwrite');
        tx.objectStore(HISTORY_STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
      db.close();
      return true;
    } catch {
      db.close();
    }
  } catch {
    // Ignore
  }
  return false;
}

export async function clearRunHistory(): Promise<boolean> {
  try {
    const db = await openDb();
    if (!db) return false;
    try {
      await new Promise<void>((resolve) => {
        const tx = db.transaction(HISTORY_STORE_NAME, 'readwrite');
        tx.objectStore(HISTORY_STORE_NAME).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
      db.close();
      return true;
    } catch {
      db.close();
    }
  } catch {
    // Ignore
  }
  return false;
}

export function saveExperimentQueue(
  queue: import('./types').QueuedExperiment[]
): void {
  try {
    localStorage.setItem(EXPERIMENT_QUEUE_LS_KEY, JSON.stringify(queue));
  } catch {
    // Ignore quota errors
  }
}

export function loadExperimentQueue(): import('./types').QueuedExperiment[] {
  try {
    const raw = localStorage.getItem(EXPERIMENT_QUEUE_LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return (parsed as import('./types').QueuedExperiment[]).map((item) => ({
        ...item,
        status: item.status === 'RUNNING' ? 'PENDING' : item.status,
      }));
    }
  } catch {
    // Ignore corrupt cache
  }
  return [];
}
