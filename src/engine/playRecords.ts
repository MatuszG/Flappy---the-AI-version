import type { DifficultyPreset, PlaySubMode } from './types';

export type PlayMedalId = 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface PlayRunRecord {
  id: string;
  playerName: string;
  points: number;
  pipes: number;
  orbsCollected: number;
  maxCombo: number;
  difficulty: DifficultyPreset;
  subMode: PlaySubMode;
  opponentName?: string;
  wonVsAi?: boolean | null;
  medalId: PlayMedalId;
  createdAt: string;
}

export interface PlayRecordsSnapshot {
  playerNick: string;
  history: PlayRunRecord[];
  leaderboard: PlayRunRecord[];
  bestPointsByDifficulty: Partial<Record<DifficultyPreset, number>>;
}

const NICK_KEY = 'flappy-neuro-player-nick-v1';
const HISTORY_KEY = 'flappy-neuro-play-history-v1';
const LEADERBOARD_KEY = 'flappy-neuro-leaderboard-v1';
const BEST_POINTS_KEY = 'flappy-neuro-human-best-points-v1';

const MAX_HISTORY_ITEMS = 80;
const MAX_LEADERBOARD_ITEMS = 50;

export function sanitizePlayerName(raw: string, fallback = 'Anon Pilot'): string {
  const cleaned = raw.replace(/\s+/g, ' ').trim().slice(0, 22);
  return cleaned.length > 0 ? cleaned : fallback;
}

export function loadPlayerNick(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(NICK_KEY) ?? '';
  } catch {
    return '';
  }
}

export function persistPlayerNick(nick: string): string {
  const cleaned = nick.replace(/\s+/g, ' ').trim().slice(0, 22);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(NICK_KEY, cleaned);
    } catch {
      // ignore storage quota errors
    }
  }
  return cleaned;
}

function readJsonArray<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

export function loadPlayHistory(): PlayRunRecord[] {
  return readJsonArray<PlayRunRecord>(HISTORY_KEY);
}

export function loadPlayLeaderboard(): PlayRunRecord[] {
  return readJsonArray<PlayRunRecord>(LEADERBOARD_KEY);
}

export function loadBestPointsByDifficulty(): Partial<Record<DifficultyPreset, number>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(BEST_POINTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object'
      ? (parsed as Partial<Record<DifficultyPreset, number>>)
      : {};
  } catch {
    return {};
  }
}

export function loadPlayRecordsSnapshot(): PlayRecordsSnapshot {
  return {
    playerNick: loadPlayerNick(),
    history: loadPlayHistory(),
    leaderboard: loadPlayLeaderboard(),
    bestPointsByDifficulty: loadBestPointsByDifficulty(),
  };
}

export function sortLeaderboardRuns(runs: PlayRunRecord[]): PlayRunRecord[] {
  return [...runs]
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.pipes !== a.pipes) return b.pipes - a.pipes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, MAX_LEADERBOARD_ITEMS);
}

export function computeMedalId(pipes: number): PlayMedalId {
  if (pipes >= 60) return 'PLATINUM';
  if (pipes >= 30) return 'GOLD';
  if (pipes >= 15) return 'SILVER';
  if (pipes >= 5) return 'BRONZE';
  return 'NONE';
}

export function addCompletedPlayRun(params: {
  playerNick: string;
  points: number;
  pipes: number;
  orbsCollected: number;
  maxCombo: number;
  difficulty: DifficultyPreset;
  subMode: PlaySubMode;
  opponentName?: string;
  wonVsAi?: boolean | null;
  fallbackName: string;
}): {
  record: PlayRunRecord;
  history: PlayRunRecord[];
  leaderboard: PlayRunRecord[];
  bestPointsByDifficulty: Partial<Record<DifficultyPreset, number>>;
  isNewPointsRecord: boolean;
} {
  const record: PlayRunRecord = {
    id: `play-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    playerName: sanitizePlayerName(params.playerNick, params.fallbackName),
    points: Math.max(0, Math.round(params.points)),
    pipes: Math.max(0, Math.round(params.pipes)),
    orbsCollected: Math.max(0, Math.round(params.orbsCollected)),
    maxCombo: Math.max(0, Math.round(params.maxCombo)),
    difficulty: params.difficulty,
    subMode: params.subMode,
    opponentName: params.subMode === 'VS_AI' ? params.opponentName : undefined,
    wonVsAi: params.subMode === 'VS_AI' ? params.wonVsAi ?? null : null,
    medalId: computeMedalId(params.pipes),
    createdAt: new Date().toISOString(),
  };

  const prevHistory = loadPlayHistory();
  const nextHistory = [record, ...prevHistory].slice(0, MAX_HISTORY_ITEMS);
  writeJson(HISTORY_KEY, nextHistory);

  const prevBoard = loadPlayLeaderboard();
  const nextBoard = sortLeaderboardRuns([record, ...prevBoard]);
  writeJson(LEADERBOARD_KEY, nextBoard);

  const prevBestPts = loadBestPointsByDifficulty();
  const currentBestPts = prevBestPts[params.difficulty] ?? 0;
  const isNewPointsRecord = record.points > currentBestPts;
  const nextBestPts = isNewPointsRecord
    ? { ...prevBestPts, [params.difficulty]: record.points }
    : prevBestPts;
  if (isNewPointsRecord) {
    writeJson(BEST_POINTS_KEY, nextBestPts);
  }

  return {
    record,
    history: nextHistory,
    leaderboard: nextBoard,
    bestPointsByDifficulty: nextBestPts,
    isNewPointsRecord,
  };
}

export function updateSavedPlayRunNick(params: {
  runId: string;
  nick: string;
  fallbackName: string;
}): {
  playerNick: string;
  history: PlayRunRecord[];
  leaderboard: PlayRunRecord[];
} {
  const playerNick = persistPlayerNick(params.nick);
  const displayName = sanitizePlayerName(playerNick, params.fallbackName);

  const history = loadPlayHistory().map((r) =>
    r.id === params.runId ? { ...r, playerName: displayName } : r
  );
  writeJson(HISTORY_KEY, history);

  const leaderboard = sortLeaderboardRuns(
    loadPlayLeaderboard().map((r) =>
      r.id === params.runId ? { ...r, playerName: displayName } : r
    )
  );
  writeJson(LEADERBOARD_KEY, leaderboard);

  return { playerNick, history, leaderboard };
}

export function clearStoredPlayHistory(): PlayRunRecord[] {
  writeJson(HISTORY_KEY, []);
  return [];
}

export function clearStoredLeaderboard(): PlayRunRecord[] {
  writeJson(LEADERBOARD_KEY, []);
  return [];
}
