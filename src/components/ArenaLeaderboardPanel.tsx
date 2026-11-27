import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Eye,
  Flame,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
} from 'lucide-react';
import {
  ALL_CATALOG_ARCHITECTURES,
  ARCHITECTURE_CATALOG,
  CORE_6_ARENA_SPECIES,
  DEFAULT_ARENA_SPECIES,
  TIER_1_ARCHITECTURES,
} from '../engine/architectureCatalog';
import { DEFAULT_ISLAND_SPECIES } from '../engine/islandSpeciation';
import {
  CORE_DIFFICULTIES,
  DIFFICULTY_META,
  resolveEnvironment,
  verifyScenarioSolvability,
} from '../engine/physics';
import type {
  DifficultyPreset,
  EvolutionConfig,
  IslandSpeciesSnapshot,
  NetworkArchitecture,
  SimulationTelemetry,
} from '../engine/types';
import { useLanguage } from '../i18n/LanguageContext';
import { getArchText } from '../i18n/catalog';

interface ArenaLeaderboardPanelProps {
  config: EvolutionConfig;
  telemetry: SimulationTelemetry;
  onUpdateConfig: (partial: Partial<EvolutionConfig>) => void;
  onSelectDifficulty: (difficulty: DifficultyPreset) => void;
}

export const ArenaLeaderboardPanel: React.FC<ArenaLeaderboardPanelProps> = ({
  config,
  telemetry,
  onUpdateConfig,
  onSelectDifficulty,
}) => {
  const { lang, t } = useLanguage();
  const [showSpeciesPicker, setShowSpeciesPicker] = useState(false);
  const [showArchCatalog, setShowArchCatalog] = useState(false);
  const [showArenaBoard, setShowArenaBoard] = useState(true);

  const isArenaMode = config.evolutionTopologyMode === 'ISLAND_SPECIATION';
  const activeSpeciesList: readonly NetworkArchitecture[] =
    config.islandSpecies && config.islandSpecies.length >= 2
      ? config.islandSpecies
      : DEFAULT_ISLAND_SPECIES;

  const activeOverdrivePct = config.overdrivePct ?? 120;

  const activeEnv = useMemo(
    () =>
      resolveEnvironment(
        config.difficulty,
        config.customEnvironment,
        activeOverdrivePct
      ),
    [config.difficulty, config.customEnvironment, activeOverdrivePct]
  );

  const solvabilityProof = useMemo(
    () => verifyScenarioSolvability(activeEnv),
    [activeEnv]
  );

  const worstSlackPx = Math.min(
    solvabilityProof.climbSlackPx,
    solvabilityProof.diveSlackPx,
    solvabilityProof.transitClearancePx
  );

  const snapshots: IslandSpeciesSnapshot[] = useMemo(() => {
    if (telemetry.speciesSnapshots && telemetry.speciesSnapshots.length > 0) {
      return [...telemetry.speciesSnapshots].sort((a, b) => {
        const curA = a.currentGenBestScore ?? 0;
        const curB = b.currentGenBestScore ?? 0;
        if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
        if (curB !== curA) return curB - curA;
        const aliveFlagA = (a.aliveCount ?? 0) > 0 ? 1 : 0;
        const aliveFlagB = (b.aliveCount ?? 0) > 0 ? 1 : 0;
        if (aliveFlagB !== aliveFlagA) return aliveFlagB - aliveFlagA;
        if (b.bestFitness !== a.bestFitness) return b.bestFitness - a.bestFitness;
        return (b.aliveCount ?? 0) - (a.aliveCount ?? 0);
      });
    }
    const perIslandPop = Math.max(
      4,
      Math.floor(config.populationSize / Math.max(1, activeSpeciesList.length))
    );
    return activeSpeciesList.map((arch) => ({
      species: arch,
      sharePct: Math.round(100 / Math.max(1, activeSpeciesList.length)),
      popCount: perIslandPop,
      aliveCount: perIslandPop,
      currentGenBestScore: 0,
      bestScore: 0,
      bestFitness: 0,
      avgFlopsPerFrame: 100,
      efficiencyScore: 1.0,
    }));
  }, [
    telemetry.speciesSnapshots,
    config.populationSize,
    activeSpeciesList,
  ]);

  const handleToggleArenaMode = (enableArena: boolean) => {
    if (enableArena) {
      const targetSpecies =
        config.islandSpecies && config.islandSpecies.length >= 2
          ? config.islandSpecies
          : [...DEFAULT_ARENA_SPECIES];
      onUpdateConfig({
        evolutionTopologyMode: 'ISLAND_SPECIATION',
        islandSpecies: targetSpecies,
        populationSize: Math.max(targetSpecies.length * 8, config.populationSize),
      });
    } else {
      onUpdateConfig({
        evolutionTopologyMode: 'SINGLE_SPECIES',
        inspectedSpecies: null,
      });
    }
  };

  const handleSelectAll12Arena = () => {
    onUpdateConfig({
      evolutionTopologyMode: 'ISLAND_SPECIATION',
      islandSpecies: [...ALL_CATALOG_ARCHITECTURES],
      populationSize: Math.max(96, config.populationSize),
    });
  };

  const handleToggleCompetingSpecies = (arch: NetworkArchitecture) => {
    const exists = activeSpeciesList.includes(arch);
    if (exists) {
      if (activeSpeciesList.length <= 2) return;
      const next = activeSpeciesList.filter((a) => a !== arch);
      onUpdateConfig({
        islandSpecies: next,
        inspectedSpecies:
          config.inspectedSpecies === arch ? null : config.inspectedSpecies,
      });
    } else {
      if (activeSpeciesList.length >= ALL_CATALOG_ARCHITECTURES.length) return;
      const next = [...activeSpeciesList, arch];
      onUpdateConfig({
        islandSpecies: next,
        populationSize: Math.max(next.length * 8, config.populationSize),
      });
    }
  };

  const inspectedSpecies = config.inspectedSpecies ?? null;
  const currentLeaderSpecies =
    telemetry.activeInspectedSpecies ??
    snapshots[0]?.species ??
    config.architecture ??
    'DROSOPHILA_CONNECTOME';

  const activeArch = config.architecture ?? 'MLP';
  const activeArchInfo = ARCHITECTURE_CATALOG[activeArch];

  return (
    <div className="bg-[#0B1120]/95 border border-slate-800/90 rounded-xl p-3 sm:p-3.5 shadow-xl space-y-3">
      {/* Structured 2-Zone Header Bar: Left = Mode & Architecture/Lineup, Right = Course & Proof */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Left Zone: Mode Segmented Toggle + Contextual Architecture/Lineup Action */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
          <div
            className="grid grid-cols-2 sm:inline-flex rounded-lg border border-slate-800 bg-slate-950/90 p-1 gap-1 shrink-0"
            role="group"
            aria-label={t('arena.trainingTopologyMode')}
          >
            <button
              type="button"
              onClick={() => handleToggleArenaMode(true)}
              className={`inline-flex min-h-[36px] items-center justify-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                isArenaMode
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Swords
                className={`w-3.5 h-3.5 shrink-0 ${
                  isArenaMode ? 'text-slate-950' : 'text-emerald-400'
                }`}
              />
              <span>{`Arena (${activeSpeciesList.length}/12)`}</span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleArenaMode(false)}
              className={`inline-flex min-h-[36px] items-center justify-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                !isArenaMode
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Cpu
                className={`w-3.5 h-3.5 shrink-0 ${
                  !isArenaMode ? 'text-slate-950' : 'text-cyan-400'
                }`}
              />
              <span>{t('arena.singleNetwork')}</span>
            </button>
          </div>

          {/* Contextual Controls matching selected mode cleanly without jumping shapes */}
          {!isArenaMode ? (
            <button
              type="button"
              onClick={() => setShowArchCatalog((v) => !v)}
              className="inline-flex min-h-[40px] sm:min-h-[38px] items-center justify-between sm:justify-start gap-2 rounded-lg border border-slate-700/90 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-100 whitespace-nowrap cursor-pointer transition-colors hover:border-cyan-500/50 hover:text-cyan-200"
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: activeArchInfo?.colorHex ?? '#38BDF8' }}
                />
                <span className="truncate">{activeArchInfo?.shortLabel ?? activeArch}</span>
                <span className="font-mono text-[10px] font-normal text-slate-400">
                  ({t('arena.pick1Of12')})
                </span>
              </span>
              {showArchCatalog ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
            </button>
          ) : (
            <div className="flex w-full sm:w-auto flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowSpeciesPicker((v) => !v)}
                className={`inline-flex min-h-[38px] flex-1 sm:flex-initial items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  showSpeciesPicker
                    ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-200'
                    : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/90 text-slate-200'
                }`}
              >
                <span>{t('arena.lineup')}</span>
                {showSpeciesPicker ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {activeSpeciesList.length < ALL_CATALOG_ARCHITECTURES.length && (
                <button
                  type="button"
                  onClick={handleSelectAll12Arena}
                  className="inline-flex min-h-[38px] flex-1 sm:flex-initial items-center justify-center px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-xs font-semibold text-emerald-300 whitespace-nowrap cursor-pointer transition-colors"
                >
                  {t('arena.all12')}
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowArenaBoard((v) => !v)}
                className="inline-flex min-h-[38px] flex-1 sm:flex-initial items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/90 text-xs font-medium text-slate-300 whitespace-nowrap cursor-pointer transition-colors"
              >
                <span>
                  {showArenaBoard
                    ? t('arena.hideBoard')
                    : t('arena.showBoard')}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Right Zone: Track Difficulty Switcher + Ballistic Solvability Proof */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center lg:justify-end gap-2">
          <div className="flex items-center justify-between gap-2">
            <span
              title={
                solvabilityProof.solvable
                  ? t('arena.mathematicallySolvableCourseDtF', { dtMinFrames: solvabilityProof.dtMinFrames, val1: Math.round(solvabilityProof.climbSlackPx), val2: Math.round(solvabilityProof.diveSlackPx) })
                  : t('arena.overdriveBeyondBallisticProofPx', { val0: Math.round(worstSlackPx) })
              }
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[10.5px] whitespace-nowrap ${
                solvabilityProof.solvable
                  ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-500/45 bg-rose-500/15 text-rose-200'
              }`}
            >
              {solvabilityProof.solvable ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              )}
              <span>
                {solvabilityProof.solvable
                  ? t('arena.passablePx', { val0: Math.round(worstSlackPx) })
                  : `Overdrive (${Math.round(worstSlackPx)}px)`}
              </span>
            </span>

            {config.difficulty === 'EXTRA_INSANE' && (
              <div className="inline-flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-md border border-rose-500/40 sm:hidden">
                <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="text-[11px] font-mono font-semibold text-rose-200">
                  {activeOverdrivePct}%
                </span>
                <input
                  type="range"
                  min={100}
                  max={145}
                  step={5}
                  value={activeOverdrivePct}
                  onChange={(e) =>
                    onUpdateConfig({ overdrivePct: Number(e.target.value) })
                  }
                  className="w-20 accent-rose-500 cursor-pointer"
                />
              </div>
            )}
          </div>

          <div
            className="grid grid-cols-5 sm:inline-flex rounded-lg border border-slate-800 bg-slate-950/90 p-0.5 gap-0.5"
            role="group"
            aria-label={t('arena.trackDifficulty')}
          >
            {CORE_DIFFICULTIES.map((diff) => {
              const meta = DIFFICULTY_META[diff];
              const active = config.difficulty === diff;
              const isExtraInsane = diff === 'EXTRA_INSANE';
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => onSelectDifficulty(diff)}
                  title={meta.description}
                  className={`min-h-[32px] px-1.5 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors whitespace-nowrap truncate ${
                    active
                      ? isExtraInsane
                        ? 'bg-rose-500/25 text-rose-200'
                        : 'bg-cyan-500/20 text-cyan-200'
                      : isExtraInsane
                        ? 'text-rose-300/80 hover:bg-rose-950/40 hover:text-rose-200'
                        : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                  }`}
                >
                  {isExtraInsane ? (
                  <>
                    <span className="sm:hidden">Extra</span>
                    <span className="hidden sm:inline">Extra Insane</span>
                  </>
                ) : (
                  meta.shortLabel
                )}
                </button>
              );
            })}
          </div>

          {config.difficulty === 'EXTRA_INSANE' && (
            <div className="hidden sm:inline-flex items-center gap-2 bg-slate-950/80 px-2.5 py-1 rounded-md border border-rose-500/40">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[11px] font-mono font-semibold text-rose-200">
                {activeOverdrivePct}%
              </span>
              <input
                type="range"
                min={100}
                max={145}
                step={5}
                value={activeOverdrivePct}
                onChange={(e) =>
                  onUpdateConfig({ overdrivePct: Number(e.target.value) })
                }
                className="w-24 accent-rose-500 cursor-pointer"
                title={t('arena.k100InsaneBoundary11pxSlack')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Species Picker for Arena Live (2 to 12 architectures) */}
      {isArenaMode && showSpeciesPicker && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-300">
              {t('arena.arenaLineupPick212')}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleSelectAll12Arena}
                className="text-[11px] px-2.5 py-1 rounded-md border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 font-semibold cursor-pointer"
              >
                {t('arena.all12')}
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateConfig({
                    islandSpecies: [...TIER_1_ARCHITECTURES],
                    populationSize: Math.max(72, config.populationSize),
                  })
                }
                className="text-[11px] px-2.5 py-1 rounded-md border border-cyan-500/35 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 font-medium cursor-pointer"
              >
                {t('arena.k7Core')}
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateConfig({
                    islandSpecies: [...CORE_6_ARENA_SPECIES],
                    populationSize: Math.max(72, config.populationSize),
                  })
                }
                className="text-[11px] px-2.5 py-1 rounded-md border border-slate-700 bg-slate-800 text-slate-300 hover:text-white font-medium cursor-pointer"
              >
                {t('arena.k6Top')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
            {ALL_CATALOG_ARCHITECTURES.map((arch) => {
              const info = ARCHITECTURE_CATALOG[arch];
              const selected = activeSpeciesList.includes(arch);
              return (
                <button
                  key={arch}
                  type="button"
                  onClick={() => handleToggleCompetingSpecies(arch)}
                  className={`flex items-center gap-2 min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                    selected
                      ? 'bg-slate-800 text-white border-cyan-500/50 shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: info.colorHex }}
                  />
                  <span className="truncate font-semibold">{info.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Multi-Architecture Arena Leaderboard */}
      {isArenaMode ? (
        showArenaBoard ? (
          <div className="space-y-2 border-t border-slate-800/80 pt-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-semibold text-slate-200">
                  {t('arena.leaderboardArchGen', { snapshots: snapshots.length, generation: telemetry.generation })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onUpdateConfig({ inspectedSpecies: null })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border cursor-pointer transition-colors ${
                  inspectedSpecies === null
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                ★ {t('arena.autoLeader')} ({ARCHITECTURE_CATALOG[currentLeaderSpecies]?.shortLabel})
              </button>
            </div>

            {/* Mobile (<sm): Sleek Timing-Tower Rows; Tablet/Desktop (sm+): Clean Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {snapshots.map((snap, rankIdx) => {
                const info = ARCHITECTURE_CATALOG[snap.species];
                const alive = snap.aliveCount ?? 0;
                const pop = Math.max(1, snap.popCount);
                const alivePct = Math.round((alive / pop) * 100);
                const curScore = snap.currentGenBestScore ?? 0;
                const isInspected =
                  inspectedSpecies === snap.species ||
                  (inspectedSpecies === null && snap.species === currentLeaderSpecies);

                return (
                  <div
                    key={snap.species}
                    onClick={() =>
                      onUpdateConfig({
                        inspectedSpecies:
                          inspectedSpecies === snap.species
                            ? null
                            : snap.species,
                      })
                    }
                    title={`${getArchText(lang, snap.species).fullName}: ${getArchText(lang, snap.species).summary}\n${getArchText(lang, snap.species).verdict}`}
                    className={`cursor-pointer rounded-lg px-3 py-2 sm:p-2.5 border transition-colors ${
                      isInspected
                        ? 'bg-slate-900/95 border-cyan-500/60'
                        : 'bg-slate-900/55 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Compact Mobile Row (<sm) */}
                    <div className="flex sm:hidden items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] font-bold text-slate-950 shrink-0"
                          style={{ backgroundColor: info.colorHex }}
                        >
                          {rankIdx + 1}
                        </span>
                        <span className="font-bold text-slate-100 truncate">
                          {info.shortLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 font-mono text-[11px] shrink-0">
                        <span className={alive > 0 ? 'text-emerald-300' : 'text-slate-500'}>
                          {alive}/{pop}
                        </span>
                        <span className="text-slate-300">
                          {t('arena.now')} <strong className="text-white">{curScore}</strong>
                        </span>
                        <span className="text-amber-300">
                          {t('arena.best')} <strong>{snap.bestScore}</strong>
                        </span>
                        <Eye
                          className={`w-3.5 h-3.5 ${
                            isInspected ? 'text-cyan-300' : 'text-slate-500'
                          }`}
                          aria-label={isInspected ? 'Inspecting' : 'Inspect'}
                        />
                      </div>
                    </div>

                    {/* Desktop/Tablet Card Layout (sm+) */}
                    <div className="hidden sm:flex flex-col justify-between gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-5 h-5 rounded-md flex items-center justify-center font-mono text-[10px] font-bold text-slate-950 shrink-0"
                            style={{ backgroundColor: info.colorHex }}
                          >
                            #{rankIdx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-100 truncate">
                              {info.shortLabel}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {getArchText(lang, snap.species).badge}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateConfig({
                              inspectedSpecies:
                                inspectedSpecies === snap.species
                                  ? null
                                  : snap.species,
                            });
                          }}
                          className={`px-2 py-1 rounded text-[10px] font-semibold inline-flex items-center gap-1 shrink-0 border cursor-pointer ${
                            isInspected
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                          <span>
                            {isInspected
                              ? t('arena.inspecting')
                              : t('arena.inspect')}
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[10.5px] font-mono pt-1.5 border-t border-slate-800/70">
                        <div className="flex items-center gap-1.5">
                          <Activity
                            className={`w-3 h-3 ${
                              alive > 0 ? 'text-emerald-400' : 'text-slate-600'
                            }`}
                          />
                          <span
                            className={
                              alive > 0
                                ? 'text-emerald-300 font-semibold'
                                : 'text-slate-500'
                            }
                          >
                            {alive}/{pop}
                          </span>
                          <div className="w-9 h-1.5 bg-slate-800 rounded-sm overflow-hidden">
                            <div
                              className="h-full transition-all duration-150"
                              style={{
                                width: `${alivePct}%`,
                                backgroundColor: info.colorHex,
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="text-slate-300">
                            {t('arena.now')} <strong className="text-white">{curScore}</strong>
                          </span>
                          <span className="text-amber-300">
                            {t('arena.best')} <strong>{snap.bestScore}</strong>
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {info.flopsMultiplier}×
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null
      ) : showArchCatalog ? (
        /* Collapsible Single Network Architecture Selector (All 12 Architectures) */
        <div className="space-y-2 border-t border-slate-800/80 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="font-semibold text-slate-200">
                {t('arena.selectNeuralArchitecture')}
              </span>
            </div>
            <span className="text-cyan-300 font-mono text-[11px] font-semibold">
              {getArchText(lang, activeArch).fullName}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
            {ALL_CATALOG_ARCHITECTURES.map((arch) => {
              const info = ARCHITECTURE_CATALOG[arch];
              const active = activeArch === arch;
              return (
                <button
                  key={arch}
                  type="button"
                  onClick={() => {
                    onUpdateConfig({ architecture: arch });
                    setShowArchCatalog(false);
                  }}
                  title={`${getArchText(lang, arch).fullName}\n${getArchText(lang, arch).summary}\n${getArchText(lang, arch).verdict}`}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors flex flex-col justify-between gap-1.5 ${
                    active
                      ? 'bg-slate-800/95 border-cyan-500/60 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: info.colorHex }}
                      />
                      <span className="text-xs font-bold text-slate-100 truncate">
                        {info.shortLabel}
                      </span>
                    </span>
                    <span className="text-[9.5px] font-mono text-slate-400 shrink-0">
                      {info.flopsMultiplier}×
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">
                    {getArchText(lang, arch).badge}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};
