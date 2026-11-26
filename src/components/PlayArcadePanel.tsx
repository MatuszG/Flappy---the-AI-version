import {
  Award,
  Brain,
  Check,
  Clock,
  Crown,
  Flame,
  Gamepad2,
  History,
  Keyboard,
  Medal,
  Sparkles,
  Swords,
  Trash2,
  Trophy,
  UserCheck,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { PlayRunRecord } from '../engine/playRecords';
import { PRETRAINED_ACE_BRAIN } from '../engine/pretrainedBrain';
import { CORE_DIFFICULTIES, DIFFICULTY_META } from '../engine/physics';
import type {
  DifficultyPreset,
  NetworkSnapshot,
  PerceptionMode,
  PlaySubMode,
  SavedBrain,
} from '../engine/types';
import type { PlaySessionStats } from '../hooks/useSandboxSimulation';
import { useLanguage } from '../i18n/LanguageContext';
import { NeuralNetworkViz } from './NeuralNetworkViz';

export interface MedalTier {
  id: 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  labelPl: string;
  labelEn: string;
  minScore: number;
  nextScore: number | null;
  colorClass: string;
  badgeBg: string;
}

export function getMedalForScore(score: number): MedalTier {
  if (score >= 60) {
    return {
      id: 'PLATINUM',
      labelPl: 'Platynowy As',
      labelEn: 'Platinum Ace',
      minScore: 60,
      nextScore: null,
      colorClass: 'text-cyan-200',
      badgeBg: 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200',
    };
  }
  if (score >= 30) {
    return {
      id: 'GOLD',
      labelPl: 'Złoty Medal',
      labelEn: 'Gold Medal',
      minScore: 30,
      nextScore: 60,
      colorClass: 'text-amber-300',
      badgeBg: 'border-amber-400/50 bg-amber-500/15 text-amber-200',
    };
  }
  if (score >= 15) {
    return {
      id: 'SILVER',
      labelPl: 'Srebrny Medal',
      labelEn: 'Silver Medal',
      minScore: 15,
      nextScore: 30,
      colorClass: 'text-slate-200',
      badgeBg: 'border-slate-400/50 bg-slate-400/15 text-slate-100',
    };
  }
  if (score >= 5) {
    return {
      id: 'BRONZE',
      labelPl: 'Brązowy Medal',
      labelEn: 'Bronze Medal',
      minScore: 5,
      nextScore: 15,
      colorClass: 'text-orange-300',
      badgeBg: 'border-orange-500/50 bg-orange-500/15 text-orange-200',
    };
  }
  return {
    id: 'NONE',
    labelPl: 'Cel: 5 rur (Brąz)',
    labelEn: 'Goal: 5 pipes (Bronze)',
    minScore: 0,
    nextScore: 5,
    colorClass: 'text-slate-400',
    badgeBg: 'border-slate-700 bg-slate-900 text-slate-400',
  };
}

interface PlayArcadePanelProps {
  playSubMode: PlaySubMode;
  difficulty: DifficultyPreset;
  overdrivePct?: number;
  humanBestByDifficulty: Partial<Record<DifficultyPreset, number>>;
  bestPointsByDifficulty: Partial<Record<DifficultyPreset, number>>;
  sessionStats: PlaySessionStats;
  playerNick: string;
  playHistory: PlayRunRecord[];
  leaderboard: PlayRunRecord[];
  activeOpponentName: string;
  hasTrainedChampion: boolean;
  trainedChampionScore: number;
  savedBrains: SavedBrain[];
  leaderNetwork: NetworkSnapshot | null;
  perceptionMode?: PerceptionMode;
  onChangePlaySubMode: (next: PlaySubMode) => void;
  onSelectDifficulty: (diff: DifficultyPreset) => void;
  onChangeOverdrivePct: (pct: number) => void;
  onSelectAceOpponent: () => void;
  onSelectTrainedChampion: () => void;
  onSelectSavedBrain: (brain: SavedBrain) => void;
  onOpenBrains?: () => void;
  onSaveNick: (nick: string) => void;
  onClearHistory: () => void;
  onClearLeaderboard: () => void;
}

type DeckTab = 'PLAY' | 'LEADERBOARD' | 'HISTORY';

function formatRunTimestamp(iso?: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}.${mm} ${hh}:${min}`;
  } catch {
    return '—';
  }
}

function getDiffShort(diff: DifficultyPreset): string {
  if (diff === 'EXTRA_INSANE') return 'Extra';
  return DIFFICULTY_META[diff]?.shortLabel ?? diff;
}

export function PlayArcadePanel({
  playSubMode,
  difficulty,
  overdrivePct = 120,
  humanBestByDifficulty,
  bestPointsByDifficulty,
  sessionStats,
  playerNick,
  playHistory,
  leaderboard,
  activeOpponentName,
  hasTrainedChampion,
  trainedChampionScore,
  savedBrains,
  leaderNetwork,
  perceptionMode,
  onChangePlaySubMode,
  onSelectDifficulty,
  onChangeOverdrivePct,
  onSelectAceOpponent,
  onSelectTrainedChampion,
  onSelectSavedBrain,
  onOpenBrains,
  onSaveNick,
  onClearHistory,
  onClearLeaderboard,
}: PlayArcadePanelProps) {
  const { bi } = useLanguage();
  const [deckTab, setDeckTab] = useState<DeckTab>('PLAY');
  const [boardTrackFilter, setBoardTrackFilter] = useState<'ALL' | DifficultyPreset>('ALL');
  const [boardSortBy, setBoardSortBy] = useState<'POINTS' | 'PIPES'>('POINTS');
  const [nickInput, setNickInput] = useState(playerNick);
  const [nickSavedFlash, setNickSavedFlash] = useState(false);
  const [confirmClearBoard, setConfirmClearBoard] = useState(false);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);

  useEffect(() => {
    setNickInput(playerNick);
  }, [playerNick]);

  const currentBestPipes = humanBestByDifficulty[difficulty] ?? 0;
  const currentBestPoints = bestPointsByDifficulty[difficulty] ?? 0;
  const medal = getMedalForScore(currentBestPipes);

  const filteredLeaderboard = useMemo(() => {
    const list =
      boardTrackFilter === 'ALL'
        ? leaderboard
        : leaderboard.filter((item) => item.difficulty === boardTrackFilter);
    return [...list]
      .sort((a, b) => {
        if (boardSortBy === 'PIPES') {
          if (b.pipes !== a.pipes) return b.pipes - a.pipes;
          return b.points - a.points;
        }
        if (b.points !== a.points) return b.points - a.points;
        return b.pipes - a.pipes;
      })
      .slice(0, 20);
  }, [boardSortBy, boardTrackFilter, leaderboard]);

  return (
    <div className="space-y-4">
      {/* Compact Segmented Deck Tabs: Setup | Leaderboard | History */}
      <div
        className="grid grid-cols-3 gap-1 rounded-xl border border-white/[0.08] bg-[#07080D] p-1"
        role="tablist"
        aria-label={bi('Widoki panelu gry', 'Play panel sections')}
      >
        <button
          type="button"
          role="tab"
          aria-selected={deckTab === 'PLAY'}
          onClick={() => setDeckTab('PLAY')}
          className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
            deckTab === 'PLAY'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
          }`}
        >
          <Gamepad2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{bi('Gra i Tor', 'Play')}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={deckTab === 'LEADERBOARD'}
          onClick={() => {
            setDeckTab('LEADERBOARD');
            setConfirmClearBoard(false);
          }}
          className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
            deckTab === 'LEADERBOARD'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
          }`}
        >
          <Crown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {bi('Tabela', 'Top')} ({leaderboard.length})
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={deckTab === 'HISTORY'}
          onClick={() => {
            setDeckTab('HISTORY');
            setConfirmClearHistory(false);
          }}
          className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
            deckTab === 'HISTORY'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
          }`}
        >
          <History className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {bi('Historia', 'History')} ({playHistory.length})
          </span>
        </button>
      </div>

      {deckTab === 'PLAY' && (
        <div className="space-y-4">
          {/* Mode Switcher: Solo Arcade vs Duel vs AI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-sm sm:text-base font-semibold text-white">
                {bi('Tryb Gry', 'Game Mode')}
              </h2>
              <span className="font-mono text-[11px] text-slate-400">
                {playSubMode === 'SOLO'
                  ? bi('Lot o punkty i rekord', 'Points & PB Arcade')
                  : bi('Wyścig z duchem AI', 'Race vs. AI Ghost')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/[0.08] bg-[#07080D] p-1">
              <button
                type="button"
                onClick={() => onChangePlaySubMode('SOLO')}
                className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold cursor-pointer transition-colors ${
                  playSubMode === 'SOLO'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                <Gamepad2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{bi('Solo Arcade', 'Solo Arcade')}</span>
              </button>

              <button
                type="button"
                onClick={() => onChangePlaySubMode('VS_AI')}
                className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold cursor-pointer transition-colors ${
                  playSubMode === 'VS_AI'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                <Swords className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{bi('Pojedynek z AI', 'Duel vs. AI')}</span>
              </button>
            </div>
          </div>

          {/* Personal Best, Points & Player Nick Profile — Editorial Hairline Strip */}
          <div className="rounded-xl border border-white/[0.08] bg-[#080A10] p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400 shrink-0" aria-hidden="true" />
                <span className="font-display text-sm font-bold tracking-tight text-slate-100">
                  {bi('Profil i Rekordy', 'Profile & Records')}
                </span>
              </div>
              <span className={`inline-flex items-center gap-1 font-mono text-[11px] font-semibold ${medal.colorClass}`}>
                <Award className="h-3 w-3 shrink-0" aria-hidden="true" />
                {bi(medal.labelPl, medal.labelEn)}
              </span>
            </div>

            <div className="grid grid-cols-3 divide-x divide-white/[0.08] rounded-lg border border-white/[0.08] bg-[#0B0E17] tabular-nums">
              <div className="px-3 py-2.5">
                <div className="font-mono text-[10px] tracking-wider text-slate-400">
                  {bi('Rekord PKT', 'Best PTS')}
                </div>
                <div className="mt-0.5 font-display text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-300">
                  {currentBestPoints.toLocaleString()}
                </div>
              </div>
              <div className="px-3 py-2.5">
                <div className="font-mono text-[10px] tracking-wider text-slate-400">
                  {bi('Rekord Rur', 'Best Pipes')}
                </div>
                <div className="mt-0.5 font-display text-xl sm:text-2xl font-extrabold tracking-tight text-amber-300">
                  {currentBestPipes}
                </div>
              </div>
              <div className="px-3 py-2.5">
                <div className="font-mono text-[10px] tracking-wider text-slate-400">
                  {bi('Loty', 'Runs')}
                </div>
                <div className="mt-0.5 font-display text-xl sm:text-2xl font-extrabold tracking-tight text-slate-100">
                  {playHistory.length || sessionStats.runs}
                </div>
              </div>
            </div>

            {/* Active Player Nick Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSaveNick(nickInput);
                setNickSavedFlash(true);
                window.setTimeout(() => setNickSavedFlash(false), 1800);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#0D1019] p-1.5"
            >
              <UserCheck className="ml-1.5 h-3.5 w-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
              <input
                type="text"
                maxLength={22}
                value={nickInput}
                onChange={(e) => setNickInput(e.target.value)}
                placeholder={bi('Twój nick w tabeli (np. AcePilot)', 'Your leaderboard nick...')}
                aria-label={bi('Twój nick gracza', 'Player nickname')}
                className="min-w-0 flex-1 bg-transparent px-1.5 py-1 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className={`inline-flex min-h-[30px] items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  nickSavedFlash
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-white/[0.07] text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-200'
                }`}
              >
                {nickSavedFlash ? (
                  <>
                    <Check className="h-3 w-3" aria-hidden="true" />
                    {bi('Zapisano', 'Saved')}
                  </>
                ) : (
                  bi('Zapisz nick', 'Set Nick')
                )}
              </button>
            </form>

            {/* Scoring Rules Strip */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-white/[0.07] pt-2 font-mono text-[10.5px] text-slate-400">
              <span className="inline-flex items-center gap-1 text-amber-300">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                ★ +75p / ◆ +150p
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-300">
                {bi('Środek szczeliny: Combo ×N', 'Center pass: Combo ×N')}
              </span>
            </div>
          </div>

          {/* Track / Difficulty Selector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-display text-sm sm:text-base font-semibold text-slate-100">
                {bi('Wybierz Tor / Poziom', 'Select Track / Level')}
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                {bi('mnożnik 1.0× – 2.95×', '1.0× – 2.95× pts')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {CORE_DIFFICULTIES.map((diff) => {
                const meta = DIFFICULTY_META[diff];
                const active = difficulty === diff;
                const pbPipes = humanBestByDifficulty[diff] ?? 0;
                const pbPts = bestPointsByDifficulty[diff] ?? 0;
                const isExtra = diff === 'EXTRA_INSANE';
                const specText =
                  diff === 'EASY'
                    ? bi('144px · 1.0× PKT', '144px · 1.0× PTS')
                    : diff === 'MEDIUM'
                      ? bi('±25% wiatr · 1.3×', '±25% gust · 1.3×')
                      : diff === 'HARD'
                        ? bi('114px · 1.7× PKT', '114px · 1.7× PTS')
                        : diff === 'INSANE'
                          ? bi('Ruchome · 2.2×', 'Moving · 2.2×')
                          : bi(
                              'Ekstremalne ruchome rury + Overdrive (do 2.95×)',
                              'High-speed moving pipes + Overdrive (up to 2.95×)'
                            );

                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => onSelectDifficulty(diff)}
                    title={meta.description}
                      className={`flex min-h-[60px] flex-col justify-between rounded-xl border px-3 py-2 text-left cursor-pointer transition-colors ${
                        isExtra ? 'col-span-2' : ''
                      } ${
                        active
                          ? isExtra
                            ? 'border-rose-500/75 bg-rose-500/12 text-rose-50'
                            : 'border-amber-500/75 bg-amber-500/12 text-amber-50'
                          : 'border-white/[0.08] bg-[#080A10] text-slate-200 hover:border-white/25 hover:text-white'
                      }`}
                  >
                    <div className="flex w-full items-center justify-between gap-1.5">
                      <span className="font-display text-xs sm:text-sm font-bold leading-tight">
                        {isExtra ? 'Extra Insane' : meta.shortLabel}
                      </span>
                      <span
                        className={`font-mono text-[11px] font-bold tabular-nums shrink-0 ${
                          pbPts > 0 || pbPipes > 0 ? 'text-amber-300' : 'text-slate-500'
                        }`}
                      >
                        {pbPts > 0 ? `${pbPts.toLocaleString()}p` : `PB ${pbPipes}`}
                      </span>
                    </div>
                    <span className="mt-1 text-[11px] leading-snug text-slate-400">
                      {specText}
                    </span>
                  </button>
                );
              })}
            </div>

            {difficulty === 'EXTRA_INSANE' && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/35 bg-rose-950/20 px-3.5 py-2.5">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs sm:text-sm font-semibold text-rose-200">
                  <Flame className="h-4 w-4 text-rose-400" aria-hidden="true" />
                  Overdrive {overdrivePct}%
                </span>
                <input
                  type="range"
                  min={100}
                  max={145}
                  step={5}
                  value={overdrivePct}
                  onChange={(e) => onChangeOverdrivePct(Number(e.target.value))}
                  className="h-2 w-36 sm:w-44 accent-rose-500 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Duel Mode: Opponent Picker + Live Ghost Brain */}
          {playSubMode === 'VS_AI' ? (
            <div className="space-y-4 border-t border-slate-800 pt-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-100">
                    {bi('Przeciwnik AI', 'AI Opponent')}
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs text-cyan-300 truncate max-w-[140px]">
                      {activeOpponentName}
                    </span>
                    {onOpenBrains && (
                      <button
                        type="button"
                        onClick={onOpenBrains}
                        className="inline-flex min-h-[30px] items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-medium text-slate-300 whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:border-cyan-500/50 hover:text-cyan-200"
                      >
                        <Brain className="h-3 w-3 text-cyan-400" aria-hidden="true" />
                        {bi('Sieci', 'Brains')}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onSelectAceOpponent}
                    className={`inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border px-3 py-2 text-xs sm:text-sm font-medium cursor-pointer transition-colors ${
                      activeOpponentName === PRETRAINED_ACE_BRAIN.name
                        ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-200 font-semibold'
                        : 'border-slate-800 bg-[#0B1120] text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <Zap className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                    Verified Ace (155+)
                  </button>

                  {hasTrainedChampion && (
                    <button
                      type="button"
                      onClick={onSelectTrainedChampion}
                      className={`inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border px-3 py-2 text-xs sm:text-sm font-medium cursor-pointer transition-colors ${
                        activeOpponentName.startsWith('Evolved Champion')
                          ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200 font-semibold'
                          : 'border-slate-800 bg-[#0B1120] text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {bi('Twój Mistrz', 'Lab Champion')} ({trainedChampionScore})
                    </button>
                  )}

                  {savedBrains.slice(0, 3).map((brain) => (
                    <button
                      key={brain.id}
                      type="button"
                      onClick={() => onSelectSavedBrain(brain)}
                      className={`inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border px-3 py-2 text-xs sm:text-sm font-medium cursor-pointer transition-colors ${
                        activeOpponentName === brain.name
                          ? 'border-amber-500/60 bg-amber-500/15 text-amber-200 font-semibold'
                          : 'border-slate-800 bg-[#0B1120] text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span className="truncate max-w-[140px]">{brain.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-4">
                <NeuralNetworkViz
                  snapshot={leaderNetwork}
                  perceptionMode={perceptionMode}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800/80 bg-[#0B1120]/80 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Keyboard className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                <span>{bi('Sterowanie', 'Controls')}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px] text-slate-400">
                <div className="flex items-center justify-between gap-1">
                  <span>{bi('Skok', 'Flap')}</span>
                  <span className="text-slate-200 whitespace-nowrap">Space / ↑ / Tap</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span>{bi('Pauza', 'Pause')}</span>
                  <span className="text-slate-200 whitespace-nowrap">P / Esc</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span>{bi('Restart', 'Restart')}</span>
                  <span className="text-slate-200 whitespace-nowrap">R / Space</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span>{bi('Medale', 'Medals')}</span>
                  <span className="text-amber-300 whitespace-nowrap">5 · 15 · 30 · 60</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {deckTab === 'LEADERBOARD' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-sm sm:text-base font-semibold text-white flex items-center gap-1.5">
                <Crown className="h-4 w-4 text-amber-400" aria-hidden="true" />
                <span>{bi('Tabela Najlepszych Graczy', 'Top Players Leaderboard')}</span>
              </h2>
              <p className="font-mono text-[11px] text-slate-400">
                {bi(
                  'Wszystkie zapisane rekordy lokalne (PKT i Rury)',
                  'Locally recorded player high scores'
                )}
              </p>
            </div>

            <div className="inline-flex rounded-lg border border-slate-800 bg-[#0B1120] p-0.5 font-mono text-[11px]">
              <button
                type="button"
                onClick={() => setBoardSortBy('POINTS')}
                className={`rounded-md px-2 py-1 font-semibold cursor-pointer transition-colors ${
                  boardSortBy === 'POINTS'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                PKT
              </button>
              <button
                type="button"
                onClick={() => setBoardSortBy('PIPES')}
                className={`rounded-md px-2 py-1 font-semibold cursor-pointer transition-colors ${
                  boardSortBy === 'PIPES'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {bi('Rury', 'Pipes')}
              </button>
            </div>
          </div>

          {/* Track Filter */}
          <div className="flex flex-wrap gap-1">
            {(['ALL', ...CORE_DIFFICULTIES] as const).map((f) => {
              const active = boardTrackFilter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setBoardTrackFilter(f)}
                  className={`rounded-md border px-2 py-1 font-mono text-[10.5px] font-semibold cursor-pointer transition-colors ${
                    active
                      ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-200'
                      : 'border-slate-800 bg-[#0B1120] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f === 'ALL' ? bi('Wszystkie', 'All') : getDiffShort(f)}
                </button>
              );
            })}
          </div>

          {filteredLeaderboard.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-[#0B1120]/70 p-6 text-center space-y-2">
              <Medal className="mx-auto h-7 w-7 text-slate-600" aria-hidden="true" />
              <p className="text-xs font-medium text-slate-300">
                {bi(
                  'Brak zapisanych wyników dla tego filtra.',
                  'No saved leaderboard scores yet.'
                )}
              </p>
              <p className="text-[11px] text-slate-500">
                {bi(
                  'Wykonaj pierwszy lot w zakładce Gra i Tor — wynik zapisze się automatycznie lub pod Twoim nickiem.',
                  'Complete a flight in Play — runs save automatically under your chosen nick.'
                )}
              </p>
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto rounded-xl border border-white/[0.08] bg-[#080A10] divide-y divide-white/[0.06]">
              {filteredLeaderboard.map((entry, idx) => {
                const rank = idx + 1;
                const rankTextColor =
                  rank === 1
                    ? 'text-amber-300'
                    : rank === 2
                      ? 'text-slate-200'
                      : rank === 3
                        ? 'text-orange-300'
                        : 'text-slate-500';
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-2.5 px-3 py-2.5 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`w-6 font-mono text-xs font-bold tabular-nums shrink-0 ${rankTextColor}`}
                      >
                        {String(rank).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                          <span className="font-sans truncate text-xs font-bold text-slate-100">
                            {entry.playerName}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="shrink-0">{getDiffShort(entry.difficulty)}</span>
                          {entry.subMode === 'VS_AI' && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className={entry.wonVsAi ? 'text-emerald-300 font-semibold' : 'text-cyan-300'}>
                                {entry.wonVsAi ? 'VS AI W' : 'VS AI'}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 tabular-nums">
                          {entry.orbsCollected > 0 ? `★${entry.orbsCollected} · ` : ''}
                          {entry.maxCombo > 1 ? `×${entry.maxCombo} · ` : ''}
                          {formatRunTimestamp(entry.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono tabular-nums shrink-0">
                      <div className="text-xs font-bold text-emerald-300">
                        {entry.points.toLocaleString()}p
                      </div>
                      <div className="text-[10.5px] text-amber-300">
                        {entry.pipes} {bi('rur', 'pipes')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {leaderboard.length > 0 && (
            <div className="flex justify-end pt-1">
              {confirmClearBoard ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-rose-300">
                    {bi('Usunąć tabelę?', 'Clear table?')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClearLeaderboard();
                      setConfirmClearBoard(false);
                    }}
                    className="rounded-md bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white cursor-pointer hover:bg-rose-400"
                  >
                    {bi('Tak', 'Yes')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearBoard(false)}
                    className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300 cursor-pointer"
                  >
                    {bi('Nie', 'No')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClearBoard(true)}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-300 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                  {bi('Wyczyść tabelę', 'Clear leaderboard')}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {deckTab === 'HISTORY' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-sm sm:text-base font-semibold text-white flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                <span>{bi('Historia Ostatnich Lotów', 'Recent Flight History')}</span>
              </h2>
              <p className="font-mono text-[11px] text-slate-400">
                {bi(
                  'Automatyczny dziennik każdej próby (do 80 lotów)',
                  'Auto-recorded run log (up to 80 flights)'
                )}
              </p>
            </div>
          </div>

          {playHistory.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-[#0B1120]/70 p-6 text-center space-y-2">
              <History className="mx-auto h-7 w-7 text-slate-600" aria-hidden="true" />
              <p className="text-xs font-medium text-slate-300">
                {bi('Brak historii lotów.', 'No flights recorded yet.')}
              </p>
              <p className="text-[11px] text-slate-500">
                {bi(
                  'Zacznij lecieć po punkty i rury — każda zakończona próba pojawi się tutaj.',
                  'Fly a round to log points, pipes, orbs, and combos here.'
                )}
              </p>
            </div>
          ) : (
            <div className="max-h-[440px] overflow-y-auto rounded-xl border border-white/[0.08] bg-[#080A10] divide-y divide-white/[0.06]">
              {playHistory.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                      <span className="font-sans truncate text-xs font-semibold text-slate-100">
                        {run.playerName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{getDiffShort(run.difficulty)}</span>
                      {run.subMode === 'VS_AI' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className={run.wonVsAi ? 'text-emerald-300 font-semibold' : 'text-cyan-300'}>
                            {run.wonVsAi ? 'VS AI ★' : 'VS AI'}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-slate-500 tabular-nums">
                      {formatRunTimestamp(run.createdAt)}
                      {run.orbsCollected > 0 ? ` · ★${run.orbsCollected}` : ''}
                      {run.maxCombo > 1 ? ` · ×${run.maxCombo}` : ''}
                    </div>
                  </div>

                  <div className="text-right font-mono tabular-nums shrink-0">
                    <div className="text-xs font-bold text-emerald-300">
                      {run.points.toLocaleString()}p
                    </div>
                    <div className="text-[10.5px] text-slate-400">
                      {run.pipes} {bi('rur', 'pipes')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {playHistory.length > 0 && (
            <div className="flex justify-end pt-1">
              {confirmClearHistory ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-rose-300">
                    {bi('Wyczyścić historię?', 'Clear history?')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClearHistory();
                      setConfirmClearHistory(false);
                    }}
                    className="rounded-md bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white cursor-pointer hover:bg-rose-400"
                  >
                    {bi('Tak', 'Yes')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearHistory(false)}
                    className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300 cursor-pointer"
                  >
                    {bi('Nie', 'No')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClearHistory(true)}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-300 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                  {bi('Wyczyść historię', 'Clear history')}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
