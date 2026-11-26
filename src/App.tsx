import {
  BookmarkPlus,
  Brain,
  Eye,
  EyeOff,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Swords,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ArcadeCanvas } from './components/ArcadeCanvas';
import { ArenaLeaderboardPanel } from './components/ArenaLeaderboardPanel';
import { BrainManagerModal } from './components/BrainManagerModal';
import { EvolutionControls } from './components/EvolutionControls';
import { FitnessChart } from './components/FitnessChart';
import { HowItWorksModal } from './components/HowItWorksModal';
import { InfoTooltip } from './components/InfoTooltip';
import { NeuralNetworkViz } from './components/NeuralNetworkViz';
import { PlayArcadePanel } from './components/PlayArcadePanel';
import { ProjectDocumentationView } from './components/ProjectDocumentationView';
import { ResearchLabView } from './components/ResearchLabView';
import { TopBar } from './components/TopBar';
import { formatTopologyLabel } from './engine/neuralNetwork';
import {
  CORE_OPTIMIZER_ALGORITHMS,
  EXTENDED_OPTIMIZER_ALGORITHMS,
  OPTIMIZER_ROLE_BADGES,
} from './engine/optimizers';
import { PRETRAINED_ACE_BRAIN } from './engine/pretrainedBrain';
import { CORE_DIFFICULTIES, DIFFICULTY_META } from './engine/physics';
import { ALGORITHM_SHORT_LABELS } from './engine/researchReport';
import {
  ALL_SENSOR_FEATURES,
  INPUT_SUBSET_PRESETS,
  normalizeInputFeatures,
  SENSOR_METADATA,
} from './engine/sensors';
import {
  FlappySimulation,
  resolveEnvironment,
} from './engine/simulation';
import type {
  GameMode,
  SensorFeatureId,
  SpeedSetting,
} from './engine/types';
import { useResearchSession } from './hooks/useResearchSession';
import { useSandboxSimulation } from './hooks/useSandboxSimulation';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';

const PLAYGROUND_TOPOLOGIES: { label: string; layers: number[] }[] = [
  { label: '5→1', layers: [] },
  { label: '2·2', layers: [2, 2] },
  { label: '2·2·2', layers: [2, 2, 2] },
  { label: '4', layers: [4] },
  { label: '3·2', layers: [3, 2] },
  { label: '2·4', layers: [2, 4] },
  { label: '6·2', layers: [6, 2] },
  { label: '8', layers: [8] },
  { label: '6·2·6', layers: [6, 2, 6] },
  { label: '8·8', layers: [8, 8] },
];

const SPEED_OPTIONS: SpeedSetting[] = [
  1,
  2,
  5,
  10,
  25,
  50,
  100,
  250,
  500,
  'MAX',
];

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

function AppContent() {
  const { bi } = useLanguage();
  const [mode, setMode] = useState<GameMode>('VS_AI');
  const [deckTab, setDeckTab] = useState<'history' | 'params'>('history');
  const [brainsModalOpen, setBrainsModalOpen] = useState(false);
  const [howModalOpen, setHowModalOpen] = useState(false);
  const [showExtendedOptimizers, setShowExtendedOptimizers] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = useCallback((msg: string) => {
    setNotice(msg);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleCloseModals = useCallback(() => {
    setBrainsModalOpen(false);
    setHowModalOpen(false);
  }, []);

  const research = useResearchSession(showNotice);

  const sandbox = useSandboxSimulation({
    mode,
    setMode,
    sweepCustomEnvironment: research.sweepConfig.customEnvironment,
    brainsModalOpen,
    howModalOpen,
    onCloseModals: handleCloseModals,
    showNotice,
  });

  const activeTelemetry =
    mode === 'VS_AI' ? sandbox.vsAiTelemetry : sandbox.trainingTelemetry;

  return (
    <div className="min-h-screen bg-[#07080D] bg-obsidian-grid text-slate-100 flex flex-col">
      <TopBar
        mode={mode}
        onSelectMode={sandbox.handleSelectMode}
        onOpenHowItWorks={() => setHowModalOpen(true)}
      />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-3 py-4 sm:px-6 sm:py-6">
        {mode === 'DOCS' ? (
          <ProjectDocumentationView />
        ) : mode === 'RESEARCH' ? (
          <ResearchLabView
            sweepConfig={research.sweepConfig}
            progress={research.researchProgress}
            results={research.researchResults}
            autosavedAt={research.autosavedAt}
            unsavedCount={research.unsavedCount}
            remainingTrialsCount={research.remainingTrialsCount}
            wasInterrupted={research.wasInterrupted}
            activeRunLabel={research.activeRunLabel}
            experimentQueue={research.experimentQueue}
            queueActive={research.queueActive}
            runHistory={research.runHistory}
            onChangeConfig={research.setSweepConfig}
            onChangeActiveRunLabel={research.setActiveRunLabel}
            onChangePriority={research.handleChangePerformancePriority}
            onChangeGpuLoad={research.handleChangeGpuLoadPercent}
            onEnqueueCurrent={research.handleEnqueueCurrent}
            onEnqueuePreset={research.handleEnqueuePreset}
            onEnqueueThermalSweep={research.handleEnqueueThermalSweep}
            onEnqueueValidationSuite={research.handleEnqueueValidationSuite}
            onRemoveQueueItem={research.handleRemoveQueueItem}
            onMoveQueueItem={research.handleMoveQueueItem}
            onClearQueue={research.handleClearQueue}
            onStartQueue={research.handleStartQueue}
            onStopQueue={research.handleStopQueue}
            onLoadConfigFromHistory={research.handleLoadConfigFromHistory}
            onRequeueFromHistory={research.handleRequeueFromHistory}
            onMarkReviewed={research.handleMarkReviewed}
            onDeleteHistoryItem={research.handleDeleteHistoryItem}
            onClearHistory={research.handleClearHistory}
            onStartSweep={research.handleStartResearchSweep}
            onContinueSweep={research.handleContinueResearchSweep}
            onPauseSweep={research.handlePauseResearchSweep}
            onResumeSweep={research.handleResumeResearchSweep}
            onSkipTrial={research.handleSkipTrial}
            onStopSweep={research.handleStopResearchSweep}
            onSaveSessionNow={research.handleSaveSessionNow}
            onClearSavedSession={research.handleClearSavedSession}
            onImportJsonDataset={research.handleImportJsonDataset}
            onLoadGithubLake={research.handleLoadGithubLake}
            githubLakeMeta={research.githubLakeMeta}
            onLoadTrialIntoLab={sandbox.handleLoadIntoTraining}
            onRaceTrial={sandbox.handleRaceAgainstBrain}
            onGetPerfReport={research.getPerfReport}
          />
        ) : (
          <>
            {/* Compact Play Header or Training Notice Strip */}
            {(mode === 'VS_AI' || notice) && (
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                {mode === 'VS_AI' ? (
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 min-w-0">
                    <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-[-0.03em] text-white">
                      {sandbox.playSubMode === 'SOLO'
                        ? bi('Flappy Arcade · Solo', 'Flappy Arcade · Solo')
                        : bi('Pojedynek: Ty vs AI', 'Duel: Human vs. AI')}
                    </h1>
                    <p className="font-mono text-[11px] sm:text-xs tabular-nums text-slate-400">
                      <span className="text-slate-200">
                        {
                          resolveEnvironment(
                            sandbox.config.difficulty,
                            sandbox.config.customEnvironment,
                            sandbox.config.overdrivePct
                          ).label
                        }
                      </span>
                      {sandbox.playSubMode === 'VS_AI' && (
                        <>
                          <span className="mx-1.5 text-slate-600">·</span>
                          <span className="text-cyan-300">
                            {sandbox.activeOpponentName}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                ) : (
                  <div />
                )}

                {notice && (
                  <p
                    role="status"
                    className="text-xs font-medium text-emerald-300 transition-opacity"
                  >
                    {notice}
                  </p>
                )}
              </div>
            )}

            {mode === 'TRAINING' && (
              <div className="mb-5">
                <ArenaLeaderboardPanel
                  config={sandbox.config}
                  telemetry={sandbox.trainingTelemetry}
                  onUpdateConfig={(partial) =>
                    sandbox.handleConfigChange({ ...sandbox.config, ...partial })
                  }
                  onSelectDifficulty={(diff) =>
                    sandbox.handleConfigChange({ ...sandbox.config, difficulty: diff })
                  }
                />
              </div>
            )}

            {mode === 'VS_AI' && (
              <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-[#0C0F17] px-2.5 py-2 lg:hidden">
                <div className="inline-flex rounded-lg border border-white/[0.08] bg-[#07080D] p-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => sandbox.handleChangePlaySubMode('SOLO')}
                    className={`min-h-[36px] rounded-md px-3 py-1 text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      sandbox.playSubMode === 'SOLO'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {bi('Solo', 'Solo')}
                  </button>
                  <button
                    type="button"
                    onClick={() => sandbox.handleChangePlaySubMode('VS_AI')}
                    className={`min-h-[36px] rounded-md px-3 py-1 text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      sandbox.playSubMode === 'VS_AI'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {bi('VS AI', 'VS AI')}
                  </button>
                </div>

                <label className="flex min-w-0 flex-1 items-center justify-end gap-2">
                  <span className="font-mono text-[11px] text-slate-400 shrink-0">
                    {bi('Tor:', 'Track:')}
                  </span>
                  <select
                    aria-label={bi('Wybierz tor', 'Select track')}
                    value={sandbox.config.difficulty}
                    onChange={(e) =>
                      sandbox.handleSelectPlayDifficulty(
                        e.target.value as typeof sandbox.config.difficulty
                      )
                    }
                    className="min-h-[36px] max-w-[170px] flex-1 rounded-lg border border-slate-700 bg-[#0B1120] px-2.5 py-1 text-xs font-semibold text-amber-200 focus-visible:outline-2 focus-visible:outline-amber-400"
                  >
                    {CORE_DIFFICULTIES.map((diff) => {
                      const pb = sandbox.humanBestByDifficulty[diff] ?? 0;
                      const label =
                        diff === 'EXTRA_INSANE'
                          ? 'Extra Insane'
                          : DIFFICULTY_META[diff].shortLabel;
                      return (
                        <option key={diff} value={diff}>
                          {label} (PB {pb})
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>
            )}

            {/* Two-Zone Sandbox Split */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
              {/* Left / Primary Stage */}
              <section
                className={`space-y-4 ${
                  mode === 'VS_AI'
                    ? 'lg:col-span-7 xl:col-span-8'
                    : 'lg:col-span-7'
                }`}
              >
                <ArcadeCanvas
                  trainingSnapshotRef={sandbox.trainingSnapshotRef}
                  vsAiSimRef={
                    sandbox.vsAiSimRef as React.MutableRefObject<FlappySimulation>
                  }
                  running={sandbox.running}
                  showSensors={
                    mode === 'VS_AI' && sandbox.playSubMode === 'SOLO'
                      ? false
                      : sandbox.showSensors
                  }
                  mode={mode}
                  playSubMode={sandbox.playSubMode}
                  personalBest={
                    sandbox.humanBestByDifficulty[sandbox.config.difficulty] ?? 0
                  }
                  bestPoints={
                    sandbox.bestPointsByDifficulty[sandbox.config.difficulty] ?? 0
                  }
                  lastRunWasNewRecord={
                    sandbox.playSessionStats.lastRunWasNewRecord
                  }
                  trainingHud={{
                    algorithmLabel: ALGORITHM_SHORT_LABELS[sandbox.config.algorithm],
                    topologyLabel: formatTopologyLabel(
                      sandbox.config.hiddenLayers,
                      normalizeInputFeatures(sandbox.config.inputFeatures).length
                    ),
                    generation: sandbox.trainingTelemetry.generation,
                    aliveCount: sandbox.trainingTelemetry.aliveCount,
                    totalPopulation: sandbox.trainingTelemetry.totalPopulation,
                    currentBestScore: sandbox.trainingTelemetry.currentBestScore,
                    allTimeBestScore: sandbox.trainingTelemetry.allTimeBestScore,
                    effectiveMultiplier: sandbox.effectiveMultiplier,
                    showMultiplier:
                      sandbox.running &&
                      (sandbox.speed === 'MAX' || sandbox.speed >= 25) &&
                      sandbox.effectiveMultiplier > 0,
                  }}
                  vsAiPhase={sandbox.vsAiTelemetry.vsAiPhase}
                  playerScore={sandbox.vsAiTelemetry.playerScore}
                  playerPoints={sandbox.vsAiTelemetry.playerPoints ?? 0}
                  playerCombo={sandbox.vsAiTelemetry.playerCurrentCombo ?? 0}
                  playerMaxCombo={sandbox.vsAiTelemetry.playerMaxCombo ?? 0}
                  playerOrbsCollected={
                    sandbox.vsAiTelemetry.playerOrbsCollected ?? 0
                  }
                  playerNick={sandbox.playerNick}
                  aiOpponentScore={sandbox.vsAiTelemetry.aiOpponentScore}
                  playerAlive={sandbox.vsAiTelemetry.playerAlive}
                  aiOpponentAlive={sandbox.vsAiTelemetry.aiOpponentAlive}
                  vsAiWinner={sandbox.vsAiTelemetry.vsAiWinner}
                  onPlayerFlap={sandbox.handlePlayerFlap}
                  onTogglePause={sandbox.handleToggleRunning}
                  onFinishEarly={sandbox.handleFinishVsAiEarly}
                  onRematch={sandbox.handleRematchVsAi}
                  onBackToLab={() => sandbox.handleSelectMode('TRAINING')}
                  onSaveRunWithNick={sandbox.handleSaveLastRunWithNick}
                  onSyncVsAiTelemetry={sandbox.syncVsAiTelemetry}
                />

                {/* Transport & Simulation Controls Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-white/[0.08] bg-[#0C0F17] px-3 py-2.5 sm:px-4 sm:py-3">
                  {mode === 'TRAINING' ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={sandbox.handleToggleRunning}
                        className={`inline-flex min-h-[38px] items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                          sandbox.running
                            ? 'bg-slate-800 text-slate-100 hover:bg-slate-700'
                            : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                        }`}
                      >
                        {sandbox.running ? (
                          <>
                            <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                            {bi('Pauza', 'Pause')}
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5" aria-hidden="true" />
                            {bi('Wznów', 'Resume')}
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={sandbox.handleStepFrame}
                        title={bi('Przesuń symulację o 1 klatkę', 'Advance one simulation tick')}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0B1120] px-3 py-2 text-xs font-medium text-slate-300 whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:border-slate-700 hover:text-white"
                      >
                        <SkipForward
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        {bi('Krok', 'Step')}
                      </button>

                      <button
                        type="button"
                        onClick={sandbox.handleResetTraining}
                        title={bi('Zresetuj populację i trening', 'Reset training population')}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0B1120] px-3 py-2 text-xs font-medium text-slate-300 whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:border-slate-700 hover:text-white"
                      >
                        <RotateCcw
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        {bi('Reset', 'Reset')}
                      </button>

                      <div
                        className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-800 bg-[#0B1120] p-1"
                        role="group"
                        aria-label={bi('Mnożnik prędkości symulacji', 'Simulation speed multiplier')}
                      >
                        {SPEED_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => sandbox.handleSelectSpeed(opt)}
                            className={`rounded-md px-2 py-1 font-mono text-xs font-medium tabular-nums whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                              sandbox.speed === opt
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {opt === 'MAX' ? 'MAX' : `${opt}x`}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Ergonomic Play Controls: Full-width Thumb FLAP Pad + Symmetric Utility Strip */
                    <div className="flex w-full flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <button
                          type="button"
                          onPointerDown={(e) => {
                            if (e.pointerType === 'mouse' && e.button !== 0) return;
                            e.preventDefault();
                            sandbox.handlePlayerFlap();
                          }}
                          className="inline-flex min-h-[54px] sm:min-h-[46px] w-full sm:w-auto sm:px-7 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-base font-bold text-slate-950 whitespace-nowrap select-none touch-none cursor-pointer transition-colors active:bg-amber-400 hover:bg-amber-400 shadow-sm"
                        >
                          {bi('SKOK (FLAP)', 'FLAP')}
                        </button>

                        <div className="flex items-center justify-between sm:justify-start gap-2">
                          <div className="flex items-center gap-2">
                            {sandbox.vsAiTelemetry.vsAiPhase === 'PLAYING' && (
                              <button
                                type="button"
                                onClick={sandbox.handleToggleRunning}
                                className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-100 whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:bg-slate-700"
                              >
                                {sandbox.running ? (
                                  <>
                                    <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                                    {bi('Pauza', 'Pause')}
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                                    {bi('Wznów', 'Resume')}
                                  </>
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={sandbox.handleRematchVsAi}
                              title={bi('Rozpocznij od nowa (R)', 'Restart flight (R)')}
                              className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-[#0B1120] px-3.5 py-2 text-xs font-medium text-slate-200 whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:border-amber-500/50 hover:text-amber-200"
                            >
                              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>{bi('Od nowa', 'Restart')}</span>
                            </button>
                          </div>

                          {/* Mobile utility right-side pair; hidden on sm+ where right column renders */}
                          <div className="flex sm:hidden items-center gap-2">
                            {sandbox.playSubMode === 'VS_AI' && (
                              <button
                                type="button"
                                onClick={() => sandbox.setShowSensors((s) => !s)}
                                aria-pressed={sandbox.showSensors}
                                className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                                  sandbox.showSensors
                                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                                    : 'border-slate-800 bg-[#0B1120] text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {sandbox.showSensors ? (
                                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                                ) : (
                                  <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                                )}
                                {bi('Sensory', 'Sensors')}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={sandbox.handleToggleAudio}
                              aria-pressed={!sandbox.muted}
                              className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                                !sandbox.muted
                                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                  : 'border-slate-800 bg-[#0B1120] text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {sandbox.muted ? (
                                <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
                              ) : (
                                <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                              )}
                              {sandbox.muted ? bi('Wyciszono', 'Muted') : 'Audio'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-2 justify-end">
                        {sandbox.playSubMode === 'VS_AI' && (
                          <button
                            type="button"
                            onClick={() => sandbox.setShowSensors((s) => !s)}
                            aria-pressed={sandbox.showSensors}
                            title={bi(
                              'Pokaż na planszy linie aktywnych sensorów wybranego mózgu',
                              'Toggle live canvas overlay showing active sensor inputs'
                            )}
                            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                              sandbox.showSensors
                                ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                                : 'border-slate-800 bg-[#0B1120] text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {sandbox.showSensors ? (
                              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                            {bi('Sensory', 'Sensors')}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={sandbox.handleToggleAudio}
                          aria-pressed={!sandbox.muted}
                          aria-label={
                            sandbox.muted
                              ? bi('Włącz dźwięk', 'Unmute arcade sound')
                              : bi('Wycisz dźwięk', 'Mute arcade sound')
                          }
                          className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                            !sandbox.muted
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                              : 'border-slate-800 bg-[#0B1120] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {sandbox.muted ? (
                            <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          {sandbox.muted ? bi('Wyciszono', 'Muted') : 'Audio'}
                        </button>
                      </div>
                    </div>
                  )}

                  {mode === 'TRAINING' && (
                    <div className="flex w-full sm:w-auto flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => sandbox.setShowSensors((s) => !s)}
                        aria-pressed={sandbox.showSensors}
                        title={bi(
                          'Pokaż na planszy linie aktywnych sensorów wybranego mózgu',
                          'Toggle live canvas overlay showing active sensor inputs'
                        )}
                        className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                          sandbox.showSensors
                            ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                            : 'border-slate-800 bg-[#0B1120] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {sandbox.showSensors ? (
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {bi('Sensory', 'Sensors')}
                      </button>

                      <button
                        type="button"
                        onClick={sandbox.handleToggleAudio}
                        aria-pressed={!sandbox.muted}
                        aria-label={
                          sandbox.muted
                            ? bi('Włącz dźwięk', 'Unmute arcade sound')
                            : bi('Wycisz dźwięk', 'Mute arcade sound')
                        }
                        className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                          !sandbox.muted
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                            : 'border-slate-800 bg-[#0B1120] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {sandbox.muted ? (
                          <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {sandbox.muted ? bi('Wyciszono', 'Muted') : 'Audio'}
                      </button>

                      <button
                        type="button"
                        onClick={sandbox.handleQuickSave}
                        disabled={!sandbox.trainingTelemetry.hasChampionBrain}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0B1120] px-3 py-2 text-xs font-medium text-slate-300 whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:border-slate-700 hover:text-white disabled:opacity-40"
                      >
                        <BookmarkPlus
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        {bi('Zapisz lidera', 'Save Best')}
                      </button>

                      <button
                        type="button"
                        onClick={() => setBrainsModalOpen(true)}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0B1120] px-3 py-2 text-xs font-medium text-slate-300 whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:border-cyan-500/50 hover:text-cyan-200"
                      >
                        <Brain className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                        {bi('Sieci', 'Brains')}
                      </button>

                      <button
                        type="button"
                        onClick={() => sandbox.handleSelectMode('VS_AI', 'VS_AI')}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:bg-amber-400"
                      >
                        <Swords className="h-3.5 w-3.5" aria-hidden="true" />
                        {bi('Ścigaj się z AI', 'Race AI')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Training Lab Interactive AI & Topology Playground Bar — Clean & Responsive */}
                {mode === 'TRAINING' && (
                  <div className="rounded-xl border border-white/[0.08] bg-[#0C0F17] p-4 space-y-3">
                    {/* Row 1: Optimizer Selection + Bio Benchmark Presets */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 shrink-0">
                        {bi('Optymalizator', 'Optimizer')}
                        <InfoTooltip
                          align="left"
                          label={bi('O optymalizatorach', 'About AI optimizers')}
                          text={bi(
                            'Neuro-CMA (najszybsza zbieżność dla małych sieci ≤100 param.), Diff. Evol. (najwyższa skuteczność ogólna 33.5%) oraz GA (krzyżowanie populacji).',
                            'Neuro-CMA (fastest G1 convergence ≤100 params), Diff. Evol. (33.5% overall sweet-spot), and GA (population crossover).'
                          )}
                        />
                      </span>
                      <div
                        className="flex flex-wrap items-center gap-1.5"
                        role="group"
                        aria-label="Training AI algorithm"
                      >
                        {CORE_OPTIMIZER_ALGORITHMS.map((algo) => {
                          const active = sandbox.config.algorithm === algo;
                          const roleMeta = OPTIMIZER_ROLE_BADGES[algo];
                          return (
                            <button
                              key={algo}
                              type="button"
                              title={roleMeta.shortNote}
                              onClick={() =>
                                sandbox.handleConfigChange({
                                  ...sandbox.config,
                                  algorithm: algo,
                                })
                              }
                              className={`rounded-lg border px-2.5 py-1 text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                                active
                                  ? 'border-cyan-500/55 bg-cyan-500/15 text-cyan-200 font-semibold'
                                  : 'border-slate-800 bg-[#0B1120] text-slate-300 hover:border-slate-700 hover:text-white'
                              }`}
                            >
                              {ALGORITHM_SHORT_LABELS[algo]}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() =>
                            setShowExtendedOptimizers((prev) => !prev)
                          }
                          className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] whitespace-nowrap cursor-pointer transition-colors ${
                            showExtendedOptimizers ||
                            EXTENDED_OPTIMIZER_ALGORITHMS.includes(
                              sandbox.config.algorithm
                            )
                              ? 'border-violet-500/50 bg-violet-500/15 text-violet-200'
                              : 'border-slate-800 bg-[#0B1120] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          {showExtendedOptimizers ||
                          EXTENDED_OPTIMIZER_ALGORITHMS.includes(
                            sandbox.config.algorithm
                          )
                            ? bi('Mniej', 'Less')
                            : bi('+5 metod ES', '+5 ES/Swarm')}
                        </button>
                      </div>
                    </div>

                    {(showExtendedOptimizers ||
                      EXTENDED_OPTIMIZER_ALGORITHMS.includes(
                        sandbox.config.algorithm
                      )) && (
                      <div className="flex flex-wrap items-center justify-end gap-1.5 pt-0.5">
                        {EXTENDED_OPTIMIZER_ALGORITHMS.map((algo) => {
                          const active = sandbox.config.algorithm === algo;
                          const roleMeta = OPTIMIZER_ROLE_BADGES[algo];
                          return (
                            <button
                              key={algo}
                              type="button"
                              title={roleMeta.shortNote}
                              onClick={() =>
                                sandbox.handleConfigChange({
                                  ...sandbox.config,
                                  algorithm: algo,
                                })
                              }
                              className={`rounded-md border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                                active
                                  ? 'border-violet-500/50 bg-violet-500/15 text-violet-200'
                                  : 'border-slate-800 bg-[#0B1120] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                              }`}
                            >
                              {ALGORITHM_SHORT_LABELS[algo]}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Row 2: Quick Topology + Morphogenesis */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 shrink-0">
                        {bi('Warstwy ukryte', 'Hidden Layers')}
                        <InfoTooltip
                          align="left"
                          label={bi('O topologii sieci', 'About network topology')}
                          text={bi(
                            'Liczba neuronów w warstwach ukrytych. N→1 to brak warstw ukrytych; np. 6·2 oznacza dwie warstwy (6 i 2 neurony).',
                            'Hidden layer widths between inputs and Flap output. N→1 has 0 hidden layers; 6·2 has two (6 and 2 neurons).'
                          )}
                        />
                      </span>
                      <div
                        className="flex flex-wrap items-center gap-1"
                        role="group"
                        aria-label="Quick hidden layer topology"
                      >
                        {PLAYGROUND_TOPOLOGIES.map((preset) => {
                          const inputCount = normalizeInputFeatures(
                            sandbox.config.inputFeatures
                          ).length;
                          const presetKey = formatTopologyLabel(
                            preset.layers,
                            inputCount
                          );
                          const active =
                            formatTopologyLabel(
                              sandbox.config.hiddenLayers,
                              inputCount
                            ) === presetKey;
                          const skipLinearDisabled =
                            sandbox.config.architecture === 'RESIDUAL_SKIP' &&
                            preset.layers.length === 0;
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              disabled={skipLinearDisabled}
                              title={
                                skipLinearDisabled
                                  ? bi(
                                      'Residual Skip przy 0 warstwach ukrytych jest identyczny z MLP',
                                      'Residual Skip at Depth 0 is identical to linear MLP'
                                    )
                                  : undefined
                              }
                              onClick={() => {
                                if (skipLinearDisabled) return;
                                const sumHidden =
                                  preset.layers.length > 0
                                    ? preset.layers.reduce((a, b) => a + b, 0)
                                    : 0;
                                sandbox.handleConfigChange({
                                  ...sandbox.config,
                                  hiddenLayers: preset.layers,
                                  hiddenNodes: sumHidden,
                                });
                              }}
                              className={`rounded-md border px-2 py-1 font-mono text-[11px] whitespace-nowrap cursor-pointer transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${
                                active
                                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200 font-semibold'
                                  : 'border-slate-800 bg-[#0B1120] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                              }`}
                            >
                              {preset.layers.length === 0
                                ? `${inputCount}→1`
                                : preset.label}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() =>
                            sandbox.handleConfigChange({
                              ...sandbox.config,
                              morphogenesis: !sandbox.config.morphogenesis,
                            })
                          }
                          title={bi(
                            'Samorozrost sieci (Morphogenesis): startuje od małego zalążka i dodaje neurony przy stagnacji.',
                            'Self-growing morphogenesis: starts lean and expands width on stagnation.'
                          )}
                          className={`rounded-md border px-2 py-1 font-mono text-[10.5px] font-medium cursor-pointer transition-colors ${
                            sandbox.config.morphogenesis
                              ? 'border-amber-500/60 bg-amber-500/15 text-amber-200'
                              : 'border-slate-800 bg-[#0B1120] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {bi('Samorozrost:', 'Auto-Grow:')}{' '}
                          {sandbox.config.morphogenesis ? 'ON' : 'OFF'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeckTab('params')}
                          className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-200 whitespace-nowrap cursor-pointer transition-colors hover:border-cyan-500/50 hover:text-cyan-200"
                        >
                          {bi('Suwaki (do 64)', 'Sliders (≤64)')}
                        </button>
                      </div>
                    </div>

                    {/* Row 3: Perception Mode Switcher + either Geometric Sensor Inputs (1-12) OR 16-Ray Retina Optical Lobe Pipeline */}
                    <div className="space-y-2.5 border-t border-slate-800/80 pt-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300">
                            {bi('Percepcja:', 'Perception:')}
                            <InfoTooltip
                              align="left"
                              label={bi('Tryby zmysłów', 'Perception modes')}
                              text={bi(
                                '1) Sensory Geometryczne: dokładne współrzędne (Y, Vy, DX, Top, Bot). 2) Siatkówka 16-Ray: wachlarz 16 promieni (-68°..+68°) przetwarzany przez płat L1/L2 + T4/T5.',
                                '1) Geometric Sensors: exact coordinates (Y, Vy, DX, Top, Bot). 2) 16-Ray Retina: 16 optical rays (-68°..+68°) processed via L1/L2 + T4/T5 streams.'
                              )}
                            />
                          </span>
                          <div className="inline-flex rounded-lg border border-slate-800 bg-[#0B1120] p-0.5">
                            <button
                              type="button"
                              onClick={() =>
                                sandbox.handleConfigChange({
                                  ...sandbox.config,
                                  perceptionMode: 'GEOMETRIC_LAB',
                                })
                              }
                              className={`rounded-md px-2.5 py-1 text-[11px] font-medium cursor-pointer transition-colors ${
                                (sandbox.config.perceptionMode ?? 'GEOMETRIC_LAB') ===
                                'GEOMETRIC_LAB'
                                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-semibold'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {bi(
                                `Sensory Geometryczne (${normalizeInputFeatures(sandbox.config.inputFeatures).length}/12)`,
                                `Geometric Sensors (${normalizeInputFeatures(sandbox.config.inputFeatures).length}/12)`
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                sandbox.handleConfigChange({
                                  ...sandbox.config,
                                  perceptionMode: 'COMPOUND_EYE_PIXELS',
                                })
                              }
                              className={`rounded-md px-2.5 py-1 text-[11px] font-medium cursor-pointer transition-colors ${
                                sandbox.config.perceptionMode === 'COMPOUND_EYE_PIXELS'
                                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 font-semibold'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {bi(
                                'Siatkówka 16-Ray (Ommatidia T4/T5)',
                                '16-Ray Retina (Ommatidia T4/T5)'
                              )}
                            </button>
                          </div>
                        </div>

                        {sandbox.config.perceptionMode !== 'COMPOUND_EYE_PIXELS' && (
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[10.5px] text-slate-500 mr-0.5">
                              {bi('Presety:', 'Presets:')}
                            </span>
                            {[
                              { idx: 0, short: '1 (Bot)' },
                              { idx: 1, short: '2 (DX+Bot)' },
                              { idx: 2, short: '4 (R1+R2)' },
                              { idx: 3, short: '6 (Geo)' },
                              { idx: 4, short: '8 (Ruch)' },
                              { idx: 6, short: '12 (Pełny)' },
                            ].map(({ idx, short }) => {
                              const preset = INPUT_SUBSET_PRESETS[idx];
                              if (!preset) return null;
                              const activeFeatures = normalizeInputFeatures(
                                sandbox.config.inputFeatures
                              );
                              const presetFeatures = normalizeInputFeatures(
                                preset.features
                              );
                              const isMatch =
                                activeFeatures.length === presetFeatures.length &&
                                activeFeatures.every(
                                  (f, i) => f === presetFeatures[i]
                                );
                              return (
                                <button
                                  key={preset.id}
                                  type="button"
                                  title={preset.rationale}
                                  onClick={() =>
                                    sandbox.handleConfigChange({
                                      ...sandbox.config,
                                      inputFeatures: presetFeatures,
                                    })
                                  }
                                  className={`rounded border px-2 py-0.5 font-mono text-[10px] cursor-pointer transition-colors ${
                                    isMatch
                                      ? 'border-cyan-500/55 bg-cyan-500/15 text-cyan-200 font-semibold'
                                      : 'border-slate-800 bg-[#0B1120] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                                  }`}
                                >
                                  {short}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {sandbox.config.perceptionMode === 'COMPOUND_EYE_PIXELS' ? (
                        <div className="rounded-lg border border-emerald-500/30 bg-[#0B1120]/90 p-2.5 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-[11px] text-slate-300">
                              <span className="font-semibold text-emerald-300">
                                {bi(
                                  'Siatkówka 16-Ray (-68°..+68°) · L1/L2 + T4/T5',
                                  '16-Ray Retina (-68°..+68°) · L1/L2 + T4/T5'
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10.5px] text-slate-400 font-mono">
                                {bi('Szum optyczny:', 'Optical noise:')}{' '}
                                <strong className="text-emerald-300">
                                  {Math.round(
                                    (sandbox.config.opticalNoiseLevel ?? 0) * 100
                                  )}
                                  %
                                </strong>
                              </span>
                              <input
                                type="range"
                                min={0}
                                max={0.25}
                                step={0.01}
                                value={sandbox.config.opticalNoiseLevel ?? 0}
                                onChange={(e) =>
                                  sandbox.handleConfigChange({
                                    ...sandbox.config,
                                    opticalNoiseLevel: Number(e.target.value),
                                  })
                                }
                                className="w-20 accent-emerald-400 cursor-pointer"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-[10px] font-mono text-slate-400 mr-1">
                                {bi('Wyjścia Płata Wzrokowego:', 'Optic Lobe Outputs:')}
                              </span>
                              {normalizeInputFeatures(
                                sandbox.config.inputFeatures
                              ).map((feat) => {
                                const meta = SENSOR_METADATA[feat];
                                return (
                                  <span
                                    key={feat}
                                    title={meta.opticalDescPl}
                                    className="rounded border border-emerald-500/35 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-200"
                                  >
                                    {meta.opticalShortLabel}
                                  </span>
                                );
                              })}
                            </div>

                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-[10px] text-slate-400 mr-0.5">
                                {bi('Strumienie T4/T5:', 'T4/T5 Streams:')}
                              </span>
                              {(
                                [
                                  {
                                    label: bi('5 (Bliskie Pole)', '5 (Near Field)'),
                                    features: [
                                      'BIRD_Y',
                                      'VEL_VY',
                                      'PIPE_DX',
                                      'TOP_CLEAR',
                                      'BOT_CLEAR',
                                    ] as SensorFeatureId[],
                                  },
                                  {
                                    label: bi('6 (+Ruch Krawędzi)', '6 (+Edge Motion)'),
                                    features: [
                                      'BIRD_Y',
                                      'VEL_VY',
                                      'PIPE_DX',
                                      'TOP_CLEAR',
                                      'BOT_CLEAR',
                                      'PIPE_VY',
                                    ] as SensorFeatureId[],
                                  },
                                  {
                                    label: bi('8 (+Dalekie Pole #2)', '8 (+Far Field #2)'),
                                    features: [
                                      'VEL_VY',
                                      'PIPE_DX',
                                      'TOP_CLEAR',
                                      'BOT_CLEAR',
                                      'PIPE_VY',
                                      'NEXT_TOP_CLEAR',
                                      'NEXT_BOT_CLEAR',
                                      'NEXT_PIPE_DX',
                                    ] as SensorFeatureId[],
                                  },
                                  {
                                    label: bi('12 (Pełny Płat + Tau)', '12 (Full Lobe + Tau)'),
                                    features: [...ALL_SENSOR_FEATURES],
                                  },
                                ] as const
                              ).map((opt) => {
                                const cur = normalizeInputFeatures(
                                  sandbox.config.inputFeatures
                                );
                                const active = cur.length === opt.features.length;
                                return (
                                  <button
                                    key={opt.label}
                                    type="button"
                                    onClick={() =>
                                      sandbox.handleConfigChange({
                                        ...sandbox.config,
                                        inputFeatures: [...opt.features],
                                      })
                                    }
                                    className={`rounded border px-2 py-0.5 font-mono text-[10px] cursor-pointer transition-colors ${
                                      active
                                        ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-200 font-semibold'
                                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1"
                          role="group"
                          aria-label="Active sensor input arguments"
                        >
                          {ALL_SENSOR_FEATURES.map((feat: SensorFeatureId) => {
                            const meta = SENSOR_METADATA[feat];
                            const activeFeatures = normalizeInputFeatures(
                              sandbox.config.inputFeatures
                            );
                            const active = activeFeatures.includes(feat);
                            const activeEnvNow = resolveEnvironment(
                              sandbox.config.difficulty,
                              sandbox.config.customEnvironment
                            );
                            const staticBlocked =
                              !activeEnvNow.movingPipes &&
                              (feat === 'PIPE_VY' || feat === 'NEXT_PIPE_VY');
                            const isLastClearance =
                              active &&
                              (feat === 'TOP_CLEAR' || feat === 'BOT_CLEAR') &&
                              activeFeatures.filter(
                                (s) => s === 'TOP_CLEAR' || s === 'BOT_CLEAR'
                              ).length === 1;
                            const isPipe2 =
                              meta.group === 'PIPE_2' || feat === 'PIPE_TTF';
                            return (
                              <button
                                key={feat}
                                type="button"
                                disabled={staticBlocked || isLastClearance}
                                title={
                                  staticBlocked
                                    ? bi(
                                        `${meta.label}: wyłączone przy statycznych rurach`,
                                        `${meta.label}: disabled for static pipes`
                                      )
                                    : isLastClearance
                                      ? bi(
                                          'Wymagany min. 1 sensor szczeliny (Top lub Bot)',
                                          'Requires at least 1 gap clearance sensor (Top or Bot)'
                                        )
                                      : `${meta.label}: ${meta.description}`
                                }
                                onClick={() => {
                                  if (staticBlocked || isLastClearance) return;
                                  const next = active
                                    ? activeFeatures.filter((f) => f !== feat)
                                    : normalizeInputFeatures([
                                        ...activeFeatures,
                                        feat,
                                      ]);
                                  if (
                                    !next.includes('TOP_CLEAR') &&
                                    !next.includes('BOT_CLEAR')
                                  ) {
                                    return;
                                  }
                                  sandbox.handleConfigChange({
                                    ...sandbox.config,
                                    inputFeatures: next,
                                  });
                                }}
                                className={`rounded-md border py-1.5 text-center font-mono text-[11px] cursor-pointer transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${
                                  active
                                    ? isPipe2
                                      ? 'border-amber-500/50 bg-amber-500/15 text-amber-200 font-semibold'
                                      : 'border-cyan-500/50 bg-cyan-500/15 text-cyan-200 font-semibold'
                                    : 'border-slate-800 bg-[#0B1120] text-slate-500 hover:border-slate-700 hover:text-slate-300'
                                }`}
                              >
                                {meta.shortLabel}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* Right / AI Inspector OR Dedicated Play Arcade Deck */}
              <aside
                className={`rounded-xl border border-white/[0.08] bg-[#0C0F17] p-4 sm:p-5 space-y-5 ${
                  mode === 'VS_AI'
                    ? 'lg:col-span-5 xl:col-span-4'
                    : 'lg:col-span-5'
                }`}
              >
                {mode === 'VS_AI' ? (
                  <PlayArcadePanel
                    playSubMode={sandbox.playSubMode}
                    difficulty={sandbox.config.difficulty}
                    overdrivePct={sandbox.config.overdrivePct}
                    humanBestByDifficulty={sandbox.humanBestByDifficulty}
                    bestPointsByDifficulty={sandbox.bestPointsByDifficulty}
                    sessionStats={sandbox.playSessionStats}
                    playerNick={sandbox.playerNick}
                    playHistory={sandbox.playHistory}
                    leaderboard={sandbox.leaderboard}
                    activeOpponentName={sandbox.activeOpponentName}
                    hasTrainedChampion={
                      sandbox.trainingTelemetry.allTimeBestScore > 0
                    }
                    trainedChampionScore={
                      sandbox.trainingTelemetry.allTimeBestScore
                    }
                    savedBrains={sandbox.savedBrains}
                    leaderNetwork={activeTelemetry.leaderNetwork}
                    perceptionMode={sandbox.config.perceptionMode}
                    onChangePlaySubMode={sandbox.handleChangePlaySubMode}
                    onSelectDifficulty={sandbox.handleSelectPlayDifficulty}
                    onChangeOverdrivePct={(pct) =>
                      sandbox.handleConfigChange({
                        ...sandbox.config,
                        overdrivePct: pct,
                      })
                    }
                    onSelectAceOpponent={() =>
                      sandbox.handleRaceAgainstBrain(PRETRAINED_ACE_BRAIN)
                    }
                    onSelectTrainedChampion={
                      sandbox.handleUseEvolvedChampionOpponent
                    }
                    onSelectSavedBrain={(brain) =>
                      sandbox.handleRaceAgainstBrain(brain)
                    }
                    onOpenBrains={() => setBrainsModalOpen(true)}
                    onSaveNick={sandbox.handleUpdatePlayerNick}
                    onClearHistory={sandbox.handleClearPlayHistory}
                    onClearLeaderboard={sandbox.handleClearLeaderboard}
                  />
                ) : (
                  <>
                    <NeuralNetworkViz
                      snapshot={activeTelemetry.leaderNetwork}
                      perceptionMode={sandbox.config.perceptionMode}
                    />

                    <div className="border-t border-slate-800 pt-5">
                      <div className="mb-4 flex items-center gap-1 rounded-lg border border-slate-800 bg-[#0B1120] p-1">
                        <button
                          type="button"
                          onClick={() => setDeckTab('history')}
                          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                            deckTab === 'history'
                              ? 'bg-slate-800 text-white'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {bi('Wykres Ewolucji', 'Evolution History')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeckTab('params')}
                          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                            deckTab === 'params'
                              ? 'bg-slate-800 text-white'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {bi('Ustawienia & Fizyka', 'Hyperparameters')}
                        </button>
                      </div>

                      {deckTab === 'history' ? (
                        <FitnessChart
                          history={sandbox.trainingTelemetry.history}
                          milestones={sandbox.trainingTelemetry.milestones}
                          allTimeBestScore={
                            sandbox.trainingTelemetry.allTimeBestScore
                          }
                        />
                      ) : (
                        <EvolutionControls
                          config={sandbox.config}
                          onChange={sandbox.handleConfigChange}
                          onLoadFruitFlyPreset={
                            sandbox.handleLoadFruitFlyPreset
                          }
                          onLoadDecoupledCortexPreset={
                            sandbox.handleLoadDecoupledCortexPreset
                          }
                        />
                      )}
                    </div>
                  </>
                )}
              </aside>
            </div>
          </>
        )}
      </main>

      <BrainManagerModal
        open={brainsModalOpen}
        brains={sandbox.savedBrains}
        canSaveCurrent={sandbox.trainingTelemetry.hasChampionBrain}
        currentBestScore={Math.max(
          sandbox.trainingTelemetry.allTimeBestScore,
          sandbox.trainingTelemetry.currentBestScore
        )}
        currentGeneration={sandbox.trainingTelemetry.generation}
        onClose={() => setBrainsModalOpen(false)}
        onSaveCurrent={sandbox.handleSaveCurrentBrain}
        onLoadIntoTraining={sandbox.handleLoadIntoTraining}
        onRaceAgainstBrain={sandbox.handleRaceAgainstBrain}
        onDeleteBrain={sandbox.handleDeleteBrain}
        onImportBrain={sandbox.handleImportBrain}
      />

      <HowItWorksModal
        open={howModalOpen}
        onClose={() => setHowModalOpen(false)}
      />
    </div>
  );
}
