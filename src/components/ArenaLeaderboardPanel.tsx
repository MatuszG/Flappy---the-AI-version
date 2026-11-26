import React, { useMemo, useState } from 'react';
import {
  Trophy,
  Swords,
  Eye,
  Flame,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Activity,
} from 'lucide-react';
import {
  DifficultyPreset,
  EvolutionConfig,
  IslandSpeciesSnapshot,
  NetworkArchitecture,
  SimulationTelemetry,
} from '../engine/types';
import {
  ALL_CATALOG_ARCHITECTURES,
  ARCHITECTURE_CATALOG,
  CORE_6_ARENA_SPECIES,
  DEFAULT_ARENA_SPECIES,
  TIER_1_ARCHITECTURES,
} from '../engine/architectureCatalog';
import {
  CORE_DIFFICULTIES,
  DIFFICULTY_META,
  resolveEnvironment,
  verifyScenarioSolvability,
} from '../engine/physics';
import { DEFAULT_ISLAND_SPECIES } from '../engine/islandSpeciation';
import { useLanguage } from '../i18n/LanguageContext';

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
  const { lang, bi } = useLanguage();
  const [showSpeciesPicker, setShowSpeciesPicker] = useState(false);

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
      if (activeSpeciesList.length <= 2) return; // Require at least 2 in Arena
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

  return (
    <div className="bg-[#0B1120]/95 border border-slate-800/90 rounded-xl p-3.5 shadow-xl space-y-3">
      {/* Top Bar: Mode Switcher (Arena Live vs Single Sandbox) + Scenario & Overdrive Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-900/90 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => handleToggleArenaMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                isArenaMode
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Swords className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {bi(
                  `Arena Na Żywo (${activeSpeciesList.length}/12 arch.)`,
                  `Live Arena (${activeSpeciesList.length}/12 arch.)`
                )}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleArenaMode(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                !isArenaMode
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {bi('Pojedyncza Sieć (1 z 12 arch.)', 'Single Network (1 of 12 arch.)')}
              </span>
            </button>
          </div>

          {isArenaMode && activeSpeciesList.length < ALL_CATALOG_ARCHITECTURES.length && (
            <button
              type="button"
              onClick={handleSelectAll12Arena}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-[11px] font-semibold text-emerald-300 cursor-pointer transition-colors"
            >
              {bi('Włącz wszystkie 12 arch.', 'Enable all 12 arch.')}
            </button>
          )}

          {isArenaMode && (
            <button
              type="button"
              onClick={() => setShowSpeciesPicker((v) => !v)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 cursor-pointer transition-colors"
            >
              <span>{bi('Skład Areny', 'Arena Lineup')}</span>
              {showSpeciesPicker ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          )}
        </div>

        {/* Quick Scenario Switcher including EXTRA_INSANE + Compact Solvability Badge */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            title={
              solvabilityProof.solvable
                ? bi(
                    `Tor gwarantowany fizycznie: okno dt≥${solvabilityProof.dtMinFrames}kl · zapas wznoszenia +${Math.round(solvabilityProof.climbSlackPx)}px · nurkowania +${Math.round(solvabilityProof.diveSlackPx)}px · prześwit +${Math.round(solvabilityProof.transitClearancePx)}px`,
                    `Mathematically solvable course: dt≥${solvabilityProof.dtMinFrames}f · climb slack +${Math.round(solvabilityProof.climbSlackPx)}px · dive +${Math.round(solvabilityProof.diveSlackPx)}px · clearance +${Math.round(solvabilityProof.transitClearancePx)}px`
                  )
                : bi(
                    `Overdrive poza dowodem balistycznym: deficyt ${Math.round(worstSlackPx)}px (wymaga predykcji z wyprzedzeniem)`,
                    `Overdrive beyond ballistic proof: ${Math.round(worstSlackPx)}px deficit (requires early predictive planning)`
                  )
            }
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[10.5px] ${
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
                ? bi(
                    `Tor przechodni (+${Math.round(worstSlackPx)}px)`,
                    `Passable (+${Math.round(worstSlackPx)}px)`
                  )
                : bi(
                    `Overdrive (${Math.round(worstSlackPx)}px)`,
                    `Overdrive (${Math.round(worstSlackPx)}px)`
                  )}
            </span>
          </span>

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
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-all border ${
                  active
                    ? isExtraInsane
                      ? 'bg-rose-500/25 text-rose-200 border-rose-500/60'
                      : 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50'
                    : isExtraInsane
                    ? 'bg-rose-950/30 text-rose-300/80 border-rose-900/50 hover:bg-rose-900/40'
                    : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {isExtraInsane ? 'Extra Insane' : meta.shortLabel}
              </button>
            );
          })}

          {config.difficulty === 'EXTRA_INSANE' && (
            <div className="inline-flex items-center gap-2 bg-slate-950/80 px-2.5 py-1 rounded-md border border-rose-500/40">
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
                title={bi(
                  '100% = Granica Insane (+11px zapasu). 120% = Extra Insane (-18px deficytu). 145% = Ekstremalny limit fizyczny.',
                  '100% = Insane boundary (+11px slack). 120% = Extra Insane (-18px deficit). 145% = Extreme physical limit.'
                )}
              />
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Species Picker for Arena Live (2 to 12 architectures) */}
      {isArenaMode && showSpeciesPicker && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-300">
              {bi(
                'Wybierz od 2 do 12 architektur ścigających się jednocześnie na tym samym torze:',
                'Select 2 to 12 architectures racing simultaneously on the exact same course:'
              )}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll12Arena}
                className="text-[11px] px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 font-semibold cursor-pointer"
              >
                {bi('Wszystkie 12 architektur', 'All 12 Architectures')}
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateConfig({
                    islandSpecies: [...TIER_1_ARCHITECTURES],
                    populationSize: Math.max(72, config.populationSize),
                  })
                }
                className="text-[11px] px-2 py-0.5 rounded border border-cyan-500/35 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 font-medium cursor-pointer"
              >
                {bi('7 Głównych (Tier 1)', '7 Core (Tier 1)')}
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateConfig({
                    islandSpecies: [...CORE_6_ARENA_SPECIES],
                    populationSize: Math.max(72, config.populationSize),
                  })
                }
                className="text-[11px] px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-300 hover:text-white font-medium cursor-pointer"
              >
                {bi('6 Top Frontier', '6 Top Frontier')}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-1.5">
            {ALL_CATALOG_ARCHITECTURES.map((arch) => {
              const info = ARCHITECTURE_CATALOG[arch];
              const selected = activeSpeciesList.includes(arch);
              return (
                <button
                  key={arch}
                  type="button"
                  onClick={() => handleToggleCompetingSpecies(arch)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium border cursor-pointer transition-all ${
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

      {/* Live Multi-Architecture Arena Leaderboard Table */}
      {isArenaMode ? (
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 px-1">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-slate-200">
                {bi(
                  `Klasyfikacja Na Żywo (${snapshots.length} arch.) — Pokolenie #${telemetry.generation}`,
                  `Live Leaderboard (${snapshots.length} arch.) — Generation #${telemetry.generation}`
                )}
              </span>
              <span className="text-slate-500 hidden sm:inline">
                {bi(
                  '(wszystkie architektury lecą w tych samych warunkach)',
                  '(all architectures fly under identical course conditions)'
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>{bi('Podgląd sieci:', 'Inspect brain:')}</span>
              <button
                type="button"
                onClick={() => onUpdateConfig({ inspectedSpecies: null })}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer transition-colors ${
                  inspectedSpecies === null
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                ★ {bi('Auto-Lider', 'Auto-Leader')} ({ARCHITECTURE_CATALOG[currentLeaderSpecies]?.shortLabel})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {snapshots.map((snap, rankIdx) => {
              const info = ARCHITECTURE_CATALOG[snap.species];
              const alive = snap.aliveCount ?? 0;
              const pop = Math.max(1, snap.popCount);
              const alivePct = Math.round((alive / pop) * 100);
              const curScore = snap.currentGenBestScore ?? 0;
              const isInspected =
                inspectedSpecies === snap.species ||
                (inspectedSpecies === null && rankIdx === 0);

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
                  title={`${info.label}: ${info.summaryPl}\n${info.empiricalVerdictPl}`}
                  className={`cursor-pointer rounded-lg p-2.5 border transition-all flex flex-col justify-between gap-1.5 ${
                    isInspected
                      ? 'bg-slate-900/95 border-cyan-500/60'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-slate-950 shrink-0"
                        style={{ backgroundColor: info.colorHex }}
                      >
                        #{rankIdx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-bold text-slate-100 whitespace-nowrap shrink-0">
                            {info.shortLabel}
                          </span>
                          <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-medium truncate">
                            {lang === 'pl' ? info.badgePl : info.badgeEn}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {lang === 'pl' ? info.summaryPl : info.formulaSummary}
                        </p>
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
                      className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 shrink-0 border cursor-pointer ${
                        isInspected
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>
                        {isInspected
                          ? bi('Aktywny', 'Inspecting')
                          : bi('Podgląd', 'Inspect')}
                      </span>
                    </button>
                  </div>

                  {/* Stats Row: Alive bar, Current Pipes, Record Pipes, FLOPs */}
                  <div className="flex items-center justify-between text-[10.5px] font-mono pt-1 border-t border-slate-800/70">
                    <div className="flex items-center gap-1.5">
                      <Activity
                        className={`w-3 h-3 ${
                          alive > 0 ? 'text-emerald-400' : 'text-slate-600'
                        }`}
                      />
                      <span
                        className={
                          alive > 0 ? 'text-emerald-300 font-semibold' : 'text-slate-500'
                        }
                      >
                        {alive}/{pop}
                      </span>
                      <div className="w-10 h-1.5 bg-slate-800 rounded-sm overflow-hidden">
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
                        {bi('Lot:', 'Now:')} <strong className="text-white">{curScore}</strong>
                      </span>
                      <span className="text-amber-300">
                        {bi('Rek:', 'Best:')} <strong>{snap.bestScore}</strong>
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {info.flopsMultiplier}×
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Single Sandbox Architecture Selector (All 12 Architectures) */
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 px-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-slate-200">
                {bi(
                  'Pojedyncza Sieć — Wybierz dowolną z 12 architektur neuronowych:',
                  'Single Network — Select any of all 12 neural architectures:'
                )}
              </span>
            </div>
            <span className="text-cyan-300 font-mono font-semibold">
              {bi('Aktywna:', 'Active:')}{' '}
              {ARCHITECTURE_CATALOG[config.architecture ?? 'MLP']?.label}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-1.5">
            {ALL_CATALOG_ARCHITECTURES.map((arch) => {
              const info = ARCHITECTURE_CATALOG[arch];
              const active = (config.architecture ?? 'MLP') === arch;
              return (
                <button
                  key={arch}
                  type="button"
                  onClick={() => onUpdateConfig({ architecture: arch })}
                  title={`${info.label}\n${info.summaryPl}\n${info.empiricalVerdictPl}`}
                  className={`p-2 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between ${
                    active
                      ? 'bg-slate-800/95 border-cyan-500/60 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: info.colorHex }}
                      />
                      <span className="text-xs font-bold text-slate-100 whitespace-nowrap">
                        {info.shortLabel}
                      </span>
                    </div>
                    <div className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-950/90 text-slate-300 font-mono truncate">
                      {lang === 'pl' ? info.badgePl : info.badgeEn}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-2 leading-tight mt-1.5">
                    {lang === 'pl' ? info.summaryPl : info.formulaSummary}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

