import { ALGORITHM_SHORT_LABELS, getTrialComputeMs } from '../../engine/researchReport';
import { formatInputSubsetKey } from '../../engine/sensors';
import { resolveEnvironment } from '../../engine/simulation';
import type {
  DifficultyPreset,
  EnvironmentConfig,
  ResearchTrialResult,
  SavedBrain,
} from '../../engine/types';

export const DIFF_COLORS: Record<DifficultyPreset, string> = {
  EASY: '#10B981',
  MEDIUM: '#38BDF8',
  STANDARD: '#06B6D4',
  HARD: '#F59E0B',
  INSANE: '#F87171',
  EXTRA_INSANE: '#E11D48',
  VARIABLE_SPEED: '#38BDF8',
  DYNAMIC_GAPS: '#A78BFA',
  MOVING_GAPS: '#C084FC',
  MOVING_GUSTS: '#60A5FA',
  HEAVY_GRAVITY: '#FB923C',
  GUST_CHAOS: '#FB7185',
  TURBULENCE_EXTREME: '#F43F5E',
  CUSTOM: '#34D399',
};

export interface MatrixRowTopology {
  topoLabel: string;
  hiddenLayers: number[];
  inputCount: number;
  parameterCount: number;
  hiddenNeuronCount: number;
}

export interface MatrixInputOption {
  key: string;
  label: string;
  count: number;
}

export function compareBestTrial(
  a: ResearchTrialResult,
  b: ResearchTrialResult
): number {
  if (a.verifiedPerfect !== b.verifiedPerfect) {
    return a.verifiedPerfect ? 1 : -1;
  }
  if (a.minSeedScore !== b.minSeedScore) {
    return a.minSeedScore - b.minSeedScore;
  }
  return getTrialComputeMs(b) - getTrialComputeMs(a);
}

export function formatNormCompute(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${ms.toFixed(0)}ms`;
}

export function getFastResultInputKey(r: ResearchTrialResult): string {
  return formatInputSubsetKey(r.inputFeatures);
}

export function toSavedBrain(
  trial: ResearchTrialResult,
  customEnvironment?: EnvironmentConfig
): SavedBrain | null {
  if (!trial.bestBrain) return null;
  const envLabel = resolveEnvironment(trial.difficulty, customEnvironment).label;
  return {
    id: trial.id,
    name: `${envLabel} · ${ALGORITHM_SHORT_LABELS[trial.algorithm]} · ${trial.topologyLabel} (${trial.parameterCount}p)`,
    bestScore: trial.minSeedScore,
    generation: trial.generationsRun,
    createdAt: new Date().toISOString(),
    network: trial.bestBrain,
  };
}
