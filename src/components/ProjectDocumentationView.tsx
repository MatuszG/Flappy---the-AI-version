import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  Brain,
  Code2,
  Compass,
  Cpu,
  Crown,
  Eye,
  Flame,
  Gamepad2,
  GitBranch,
  Layers,
  ShieldCheck,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  ARCHITECTURE_CATALOG,
  OPTIMIZER_CATALOG,
  PRECISION_CATALOG,
  TIER_1_ARCHITECTURES,
  TIER_2_LEGACY_ARCHITECTURES,
} from '../engine/architectureCatalog';
import {
  buildOverdriveEnvironment,
  DIFFICULTY_META,
  DIFFICULTY_SETTINGS,
  verifyScenarioSolvability,
} from '../engine/physics';
import { RESEARCH_PRESETS } from '../engine/experimentPresets';
import { ALL_SENSOR_FEATURES, SENSOR_METADATA } from '../engine/sensors';
import type { CoreDifficultyPreset, LearningAlgorithm } from '../engine/types';
import { useLanguage } from '../i18n/LanguageContext';
import {
  getArchText,
  getDifficultyText,
  getOptimizerText,
  getPrecisionText,
} from '../i18n/catalog';

type DocSection =
  | 'OVERVIEW'
  | 'VIEWS_CONTROLS'
  | 'ARCHITECTURES_MOE'
  | 'OPTIMIZERS_RESEARCH'
  | 'VISION_PROOFS';

const OPTIMIZER_PROFILE: Record<
  LearningAlgorithm,
  { speedPct: number; explorePct: number; usesMutRate: boolean }
> = {
  CMA_HYBRID: { speedPct: 96, explorePct: 78, usesMutRate: false },
  DE: { speedPct: 86, explorePct: 94, usesMutRate: true },
  GA: { speedPct: 74, explorePct: 85, usesMutRate: true },
  ADAPTIVE_ES: { speedPct: 82, explorePct: 68, usesMutRate: true },
  NATURAL_ES: { speedPct: 78, explorePct: 72, usesMutRate: false },
  ADAM_ES: { speedPct: 84, explorePct: 65, usesMutRate: false },
  PSO: { speedPct: 80, explorePct: 76, usesMutRate: false },
  CEM: { speedPct: 76, explorePct: 62, usesMutRate: false },
};

export const ProjectDocumentationView: React.FC = () => {
  const { lang, t } = useLanguage();
  const [activeSection, setActiveSection] = useState<DocSection>('OVERVIEW');

  const scenarioProofRows = useMemo(() => {
    const presets: Array<{
      id: string;
      title: string;
      subtitle: string;
      env: ReturnType<typeof buildOverdriveEnvironment>;
      isOverdrive?: boolean;
    }> = (['EASY', 'MEDIUM', 'HARD', 'INSANE'] as CoreDifficultyPreset[]).map(
      (diff) => ({
        id: diff,
        title: DIFFICULTY_META[diff].shortLabel,
        subtitle: getDifficultyText(lang, diff).description,
        env: DIFFICULTY_SETTINGS[diff],
      })
    );

    presets.push(
      {
        id: 'EXTRA_INSANE_115',
        title: 'Extra Insane (115%)',
        subtitle: t('docs.entersNegativeSlackZone'),
        env: buildOverdriveEnvironment(115),
        isOverdrive: true,
      },
      {
        id: 'EXTRA_INSANE_120',
        title: 'Extra Insane (120%)',
        subtitle: t('docs.forcesPhaseLookahead'),
        env: buildOverdriveEnvironment(120),
        isOverdrive: true,
      },
      {
        id: 'EXTRA_INSANE_135',
        title: 'Extra Insane (135%)',
        subtitle: t('docs.extremeConnectomeStress'),
        env: buildOverdriveEnvironment(135),
        isOverdrive: true,
      }
    );

    return presets.map((item) => ({
      ...item,
      proof: verifyScenarioSolvability(item.env),
    }));
  }, [lang, t]);

  const navTabs: {
    id: DocSection;
    index: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    activeText: string;
    activeBar: string;
  }[] = [
    {
      id: 'OVERVIEW',
      index: '01',
      label: t('docs.systemMap'),
      icon: Compass,
      activeText: 'text-amber-300',
      activeBar: 'bg-amber-400',
    },
    {
      id: 'VIEWS_CONTROLS',
      index: '02',
      label: t('docs.viewsSensors'),
      icon: Sliders,
      activeText: 'text-cyan-300',
      activeBar: 'bg-cyan-400',
    },
    {
      id: 'ARCHITECTURES_MOE',
      index: '03',
      label: t('docs.k12ArchsMoe'),
      icon: Layers,
      activeText: 'text-purple-300',
      activeBar: 'bg-purple-400',
    },
    {
      id: 'OPTIMIZERS_RESEARCH',
      index: '04',
      label: t('docs.optimizersLab'),
      icon: Sparkles,
      activeText: 'text-emerald-300',
      activeBar: 'bg-emerald-400',
    },
    {
      id: 'VISION_PROOFS',
      index: '05',
      label: t('docs.flyCortexProofs'),
      icon: Flame,
      activeText: 'text-rose-300',
      activeBar: 'bg-rose-400',
    },
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-0 sm:px-2 py-2 sm:py-4 space-y-6 sm:space-y-8 text-slate-200 overflow-x-clip">
      {/* EDITORIAL BROADSHEET HERO — Obsidian gallery header without boxy card soup */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-end pt-1">
          <div className="lg:col-span-8 space-y-3 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] tracking-wider text-slate-400">
              <span className="text-emerald-300 font-semibold">Flappy NeuroLab</span>
              <span aria-hidden="true">·</span>
              <span>{t('docs.visualSystemBlueprint')}</span>
              <span aria-hidden="true">·</span>
              <span>100% Client-Side</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-[-0.04em] leading-[0.96] text-white">
              {t('docs.systemPhysics')}
              <span className="bg-gradient-to-r from-amber-200 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                {t('docs.neuralArchitectures')}
              </span>
            </h1>
          </div>

          <div className="lg:col-span-4 space-y-2 border-t lg:border-t-0 lg:border-l border-white/[0.08] pt-3 lg:pt-0 lg:pl-6">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t('docs.endToEndTechnicalBlueprint')}
            </p>
            <div className="font-mono text-[11px] text-slate-500">
              Euler 60 Hz · Mulberry32 PRNG · WebGPU WGSL
            </div>
          </div>
        </div>

        {/* Flush 4-Column Hairline Specimen Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08] border-y border-white/[0.08] bg-[#0A0C12]/80">
          <div className="px-4 py-3.5 sm:py-4">
            <div className="font-mono text-[10.5px] tracking-wider text-slate-400">
              01 · {t('docs.playRank')}
            </div>
            <div className="mt-1 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-300 tabular-nums">
              Solo + Duel
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">
              {t('docs.orbsNCombosLeaderboard')}
            </div>
          </div>

          <div className="px-4 py-3.5 sm:py-4 border-l border-white/[0.08] sm:border-l-0">
            <div className="font-mono text-[10.5px] tracking-wider text-slate-400">
              02 · {t('docs.architectures')}
            </div>
            <div className="mt-1 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-cyan-300 tabular-nums">
              12
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">
              {t('docs.k7Tier1Research5')}
            </div>
          </div>

          <div className="px-4 py-3.5 sm:py-4">
            <div className="font-mono text-[10.5px] tracking-wider text-slate-400">
              03 · {t('docs.optimizers')}
            </div>
            <div className="mt-1 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-300 tabular-nums">
              8
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">
              {t('docs.k3Core5EsSwarm')}
            </div>
          </div>

          <div className="px-4 py-3.5 sm:py-4 border-l border-white/[0.08] sm:border-l-0">
            <div className="font-mono text-[10.5px] tracking-wider text-slate-400">
              04 · {t('docs.computeStack')}
            </div>
            <div className="mt-1 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-purple-300 tabular-nums">
              F32 → F64
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">
              {t('docs.k8TierGpuWgslCpu')}
            </div>
          </div>
        </div>

        {/* Clean Chapter Index Tabs */}
        <nav
          aria-label={t('docs.documentationChapters')}
          className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-white/[0.08] pb-1"
        >
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={`relative inline-flex min-h-[42px] items-center gap-2 px-3 py-2 text-xs sm:text-[13px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  active ? tab.activeText : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="font-mono text-[10.5px] opacity-65 tabular-nums">
                  {tab.index}
                </span>
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{tab.label}</span>
                {active && (
                  <span
                    className={`absolute inset-x-2 -bottom-[5px] h-[2px] ${tab.activeBar}`}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </section>

      {/* SECTION 01: VISUAL SYSTEM MAP */}
      {activeSection === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Specimen Plate FIG. 01 */}
          <div className="rounded-xl border border-white/[0.08] bg-[#090B11] overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono text-[11px] font-bold text-cyan-300 tabular-nums">
                  FIG. 01
                </span>
                <h2 className="font-display text-sm sm:text-base font-bold text-white">
                  {t('docs.endToEndArchitecturePipeline')}
                </h2>
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                60 Hz Physics Parity · Auto-Persist LocalStorage
              </span>
            </div>

            <div className="p-3 sm:p-5 bg-[#06070B]">
              {/* Mobile (<sm) Compact 2x2 Flow Schematic — zero clipping */}
              <div className="sm:hidden">
                <svg
                  viewBox="0 0 340 278"
                  className="w-full h-auto"
                  role="img"
                  aria-label="Flappy NeuroLab architecture pipeline mobile diagram"
                >
                  <defs>
                    <linearGradient id="gAmberM" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#B45309" stopOpacity="0.06" />
                    </linearGradient>
                    <linearGradient id="gCyanM" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#0E7490" stopOpacity="0.06" />
                    </linearGradient>
                    <linearGradient id="gPurpleM" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#A855F7" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#6B21A8" stopOpacity="0.06" />
                    </linearGradient>
                    <linearGradient id="gEmeraldM" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#047857" stopOpacity="0.06" />
                    </linearGradient>
                  </defs>

                  <rect x="6" y="8" width="154" height="102" rx="10" fill="url(#gAmberM)" stroke="#F59E0B" strokeOpacity="0.6" strokeWidth="1.2" />
                  <text x="16" y="28" fill="#FCD34D" fontSize="11.5" fontWeight="700" fontFamily="Bricolage Grotesque, sans-serif">{t('docs.k01PlayArcade')}</text>
                  <text x="16" y="45" fill="#E2E8F0" fontSize="9.5" fontFamily="Plus Jakarta Sans, sans-serif">{t('docs.soloDuelVsAi')}</text>
                  <text x="16" y="62" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono, monospace">{t('docs.ptsOrbs')}</text>
                  <text x="16" y="77" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono, monospace">{t('docs.comboNTopList')}</text>
                  <text x="16" y="96" fill="#FDE68A" fontSize="8.5" fontFamily="JetBrains Mono, monospace">60 Hz Native</text>

                  <rect x="180" y="8" width="154" height="102" rx="10" fill="url(#gCyanM)" stroke="#06B6D4" strokeOpacity="0.6" strokeWidth="1.2" />
                  <text x="190" y="28" fill="#67E8F9" fontSize="11.5" fontWeight="700" fontFamily="Bricolage Grotesque, sans-serif">{t('docs.k02AiTraining')}</text>
                  <text x="190" y="45" fill="#E2E8F0" fontSize="9.5" fontFamily="Plus Jakarta Sans, sans-serif">Arena (2–12) / Single</text>
                  <text x="190" y="62" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono, monospace">12 Geo | 16-Ray</text>
                  <text x="190" y="77" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono, monospace">{t('docs.liveBrainChart')}</text>
                  <text x="190" y="96" fill="#A5F3FC" fontSize="8.5" fontFamily="JetBrains Mono, monospace">95% Duty Cap</text>

                  <line x1="180" y1="58" x2="162" y2="58" stroke="#FBBF24" strokeWidth="1.8" />
                  <text x="170" y="50" fill="#FCD34D" fontSize="7.5" textAnchor="middle" fontFamily="JetBrains Mono, monospace">Duel</text>

                  <rect x="6" y="132" width="154" height="96" rx="10" fill="url(#gPurpleM)" stroke="#A855F7" strokeOpacity="0.6" strokeWidth="1.2" />
                  <text x="16" y="152" fill="#D8B4FE" fontSize="11.5" fontWeight="700" fontFamily="Bricolage Grotesque, sans-serif">{t('docs.brainsJson')}</text>
                  <text x="16" y="169" fill="#E2E8F0" fontSize="9.5" fontFamily="Plus Jakarta Sans, sans-serif">{t('docs.championsLibrary')}</text>
                  <text x="16" y="186" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono, monospace">Weights + Arch</text>
                  <text x="16" y="201" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono, monospace">Verified Ace 155+</text>
                  <text x="16" y="218" fill="#E9D5FF" fontSize="8.5" fontFamily="JetBrains Mono, monospace">Auto-Persist Sync</text>

                  <rect x="180" y="132" width="154" height="96" rx="10" fill="url(#gEmeraldM)" stroke="#10B981" strokeOpacity="0.6" strokeWidth="1.2" />
                  <text x="190" y="152" fill="#6EE7B7" fontSize="11.5" fontWeight="700" fontFamily="Bricolage Grotesque, sans-serif">{t('docs.k03Research')}</text>
                  <text x="190" y="169" fill="#E2E8F0" fontSize="9.5" fontFamily="Plus Jakarta Sans, sans-serif">{t('docs.ablationSweeps')}</text>
                  <text x="190" y="186" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono, monospace">WebGPU → F64 Audit</text>
                  <text x="190" y="201" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono, monospace">Smart Prune · Colab</text>
                  <text x="190" y="218" fill="#A7F3D0" fontSize="8.5" fontFamily="JetBrains Mono, monospace">TDR &lt;400ms Guard</text>

                  <line x1="257" y1="110" x2="115" y2="132" stroke="#38BDF8" strokeWidth="1.4" strokeDasharray="3 3" />
                  <line x1="180" y1="180" x2="162" y2="180" stroke="#34D399" strokeWidth="1.8" />

                  <rect x="6" y="242" width="328" height="28" rx="6" fill="#0B0E17" stroke="#1E293B" />
                  <text x="170" y="259" fill="#94A3B8" fontSize="8.5" textAnchor="middle" fontFamily="JetBrains Mono, monospace">
                    SHARED KERNEL: Euler 60 Hz · Mulberry32 · Wind Gusts
                  </text>
                </svg>
              </div>

              {/* Desktop Wide Horizontal Schematic */}
              <div className="hidden sm:block">
                <svg
                  viewBox="0 0 920 210"
                  className="w-full h-auto"
                  role="img"
                  aria-label="Flappy NeuroLab architecture pipeline diagram"
                >
                  <defs>
                    <linearGradient id="gAmber" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#B45309" stopOpacity="0.06" />
                    </linearGradient>
                    <linearGradient id="gCyan" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#0E7490" stopOpacity="0.06" />
                    </linearGradient>
                    <linearGradient id="gPurple" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#A855F7" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#6B21A8" stopOpacity="0.06" />
                    </linearGradient>
                    <linearGradient id="gEmerald" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#047857" stopOpacity="0.06" />
                    </linearGradient>
                    <marker id="arrowCyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#38BDF8" />
                    </marker>
                    <marker id="arrowAmber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#FBBF24" />
                    </marker>
                  </defs>

                  <rect x="16" y="28" width="195" height="126" rx="12" fill="url(#gAmber)" stroke="#F59E0B" strokeOpacity="0.6" strokeWidth="1.4" />
                  <text x="32" y="54" fill="#FCD34D" fontSize="13" fontWeight="800" fontFamily="Bricolage Grotesque, sans-serif">{t('docs.k01PlayArcade')}</text>
                  <text x="32" y="76" fill="#E2E8F0" fontSize="11" fontFamily="Plus Jakarta Sans, sans-serif">{t('docs.soloDuelVsAiGhost')}</text>
                  <text x="32" y="98" fill="#94A3B8" fontSize="10.5" fontFamily="JetBrains Mono, monospace">{t('docs.ptsOrbsComboN')}</text>
                  <text x="32" y="118" fill="#94A3B8" fontSize="10.5" fontFamily="JetBrains Mono, monospace">{t('docs.leaderboardRunHistory')}</text>
                  <text x="32" y="140" fill="#FDE68A" fontSize="9.5" fontFamily="JetBrains Mono, monospace">60 Hz Native FPS</text>

                  <rect x="252" y="28" width="205" height="126" rx="12" fill="url(#gCyan)" stroke="#06B6D4" strokeOpacity="0.6" strokeWidth="1.4" />
                  <text x="268" y="54" fill="#67E8F9" fontSize="13" fontWeight="800" fontFamily="Bricolage Grotesque, sans-serif">{t('docs.k02AiTraining')}</text>
                  <text x="268" y="76" fill="#E2E8F0" fontSize="11" fontFamily="Plus Jakarta Sans, sans-serif">{t('docs.arena212OrSingle')}</text>
                  <text x="268" y="98" fill="#94A3B8" fontSize="10.5" fontFamily="JetBrains Mono, monospace">{t('docs.k12GeoSensors16Ray')}</text>
                  <text x="268" y="118" fill="#94A3B8" fontSize="10.5" fontFamily="JetBrains Mono, monospace">{t('docs.liveLeaderBrainChart')}</text>
                  <text x="268" y="140" fill="#A5F3FC" fontSize="9.5" fontFamily="JetBrains Mono, monospace">95% Duty Cap</text>

                  <rect x="498" y="28" width="175" height="126" rx="12" fill="url(#gPurple)" stroke="#A855F7" strokeOpacity="0.6" strokeWidth="1.4" />
                  <text x="514" y="54" fill="#D8B4FE" fontSize="13" fontWeight="800" fontFamily="Bricolage Grotesque, sans-serif">{t('docs.brainsJson')}</text>
                  <text x="514" y="76" fill="#E2E8F0" fontSize="11" fontFamily="Plus Jakarta Sans, sans-serif">{t('docs.championsLibrary')}</text>
                  <text x="514" y="98" fill="#94A3B8" fontSize="10.5" fontFamily="JetBrains Mono, monospace">Exact Weights + Arch</text>
                  <text x="514" y="118" fill="#94A3B8" fontSize="10.5" fontFamily="JetBrains Mono, monospace">Verified Ace (155+)</text>
                  <text x="514" y="140" fill="#E9D5FF" fontSize="9.5" fontFamily="JetBrains Mono, monospace">LocalStorage Sync</text>

                  <rect x="714" y="28" width="190" height="126" rx="12" fill="url(#gEmerald)" stroke="#10B981" strokeOpacity="0.6" strokeWidth="1.4" />
                  <text x="730" y="54" fill="#6EE7B7" fontSize="13" fontWeight="800" fontFamily="Bricolage Grotesque, sans-serif">{t('docs.k03Research')}</text>
                  <text x="730" y="76" fill="#E2E8F0" fontSize="11" fontFamily="Plus Jakarta Sans, sans-serif">{t('docs.ablationSweepsQueue')}</text>
                  <text x="730" y="98" fill="#94A3B8" fontSize="10.5" fontFamily="JetBrains Mono, monospace">WebGPU F32 -&gt; CPU F64</text>
                  <text x="730" y="118" fill="#94A3B8" fontSize="10.5" fontFamily="JetBrains Mono, monospace">Smart Prune · Colab GPU</text>
                  <text x="730" y="140" fill="#A7F3D0" fontSize="9.5" fontFamily="JetBrains Mono, monospace">TDR &lt;400ms Guard</text>

                  <line x1="252" y1="80" x2="215" y2="80" stroke="#FBBF24" strokeWidth="2" markerEnd="url(#arrowAmber)" />
                  <text x="233" y="72" fill="#FCD34D" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono, monospace">Duel</text>

                  <line x1="457" y1="92" x2="494" y2="92" stroke="#38BDF8" strokeWidth="2" markerEnd="url(#arrowCyan)" />
                  <line x1="714" y1="92" x2="677" y2="92" stroke="#38BDF8" strokeWidth="2" markerEnd="url(#arrowCyan)" />

                  <rect x="16" y="170" width="888" height="28" rx="6" fill="#0B0E17" stroke="#1E293B" />
                  <text x="460" y="188" fill="#94A3B8" fontSize="10.5" textAnchor="middle" fontFamily="JetBrains Mono, monospace">
                    SHARED KERNEL: Euler 60 Hz Flight Physics · Mulberry32 PRNG · Exact Bit-Identical Collision &amp; Wind Gusts
                  </text>
                </svg>
              </div>
            </div>

            {/* Flush 4-Column Module Directory (Hairline Divided) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/[0.08] border-t border-white/[0.08] bg-[#090B11]">
              <div className="p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl font-extrabold text-amber-300 tabular-nums">
                    01
                  </span>
                  <span className="font-mono text-[10.5px] text-slate-400">Solo + VS AI</span>
                </div>
                <div className="font-display text-sm font-bold text-white flex items-center gap-1.5">
                  <Gamepad2 className="w-4 h-4 text-amber-400 shrink-0" />
                  {t('docs.playArcade')}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('docs.arcadePointsFlightOrbsN')}
                </p>
              </div>

              <div className="p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl font-extrabold text-cyan-300 tabular-nums">
                    02
                  </span>
                  <span className="font-mono text-[10.5px] text-slate-400">Arena 2–12</span>
                </div>
                <div className="font-display text-sm font-bold text-white flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-cyan-400 shrink-0" />
                  {t('docs.trainingLab')}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('docs.liveFlockNeuroevolutionWithReal')}
                </p>
              </div>

              <div className="p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl font-extrabold text-emerald-300 tabular-nums">
                    03
                  </span>
                  <span className="font-mono text-[10.5px] text-slate-400">WebGPU + F64</span>
                </div>
                <div className="font-display text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  {t('docs.research')}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('docs.automatedAblationSweeps19Presets')}
                </p>
              </div>

              <div className="p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl font-extrabold text-purple-300 tabular-nums">
                    04
                  </span>
                  <span className="font-mono text-[10.5px] text-slate-400">Auto-Persist</span>
                </div>
                <div className="font-display text-sm font-bold text-white flex items-center gap-1.5">
                  <Archive className="w-4 h-4 text-purple-400 shrink-0" />
                  {t('docs.brainsSave')}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('docs.brainsExportsImportsJsonChampions')}
                </p>
              </div>
            </div>
          </div>

          {/* Asymmetric 12-Col Split: Arcade Scoring Broadsheet + Tactile Keycaps */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 rounded-xl border border-white/[0.08] bg-[#090B11] overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-3">
                <h3 className="font-display text-sm sm:text-base font-bold text-white">
                  {t('docs.arcadeScoringFormula3Step')}
                </h3>
                <span className="font-mono text-[11px] text-amber-300">
                  {t('docs.ptsOrbsComboN2')}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-white/[0.08] border-b border-white/[0.08] tabular-nums">
                <div className="px-4 py-3">
                  <div className="font-mono text-[10px] text-emerald-300">{t('docs.pipeClear')}</div>
                  <div className="mt-0.5 font-display text-lg sm:text-xl font-extrabold text-white">{t('docs.k100Track')}</div>
                </div>
                <div className="px-4 py-3">
                  <div className="font-mono text-[10px] text-amber-300">Combo ×N</div>
                  <div className="mt-0.5 font-display text-lg sm:text-xl font-extrabold text-white">+35..280p</div>
                </div>
                <div className="px-4 py-3">
                  <div className="font-mono text-[10px] text-cyan-300">{t('docs.midAirOrbs')}</div>
                  <div className="mt-0.5 font-display text-lg sm:text-xl font-extrabold text-white">★ 75 · ◆ 150</div>
                </div>
                <div className="px-4 py-3">
                  <div className="font-mono text-[10px] text-purple-300">{t('docs.leaderboard')}</div>
                  <div className="mt-0.5 font-display text-lg sm:text-xl font-extrabold text-white flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-300 shrink-0" />
                    Auto-Log
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07] text-xs">
                <div className="p-4 space-y-1">
                  <div className="font-mono font-bold text-amber-300">
                    01 · {t('docs.setNickFly')}
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    {t('docs.collectOrbsAndThreadGap')}
                  </p>
                </div>
                <div className="p-4 space-y-1">
                  <div className="font-mono font-bold text-cyan-300">
                    02 · {t('docs.launchAiArena')}
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    {t('docs.compareUpTo12Neural')}
                  </p>
                </div>
                <div className="p-4 space-y-1">
                  <div className="font-mono font-bold text-emerald-300">
                    03 · {t('docs.duelYourChampion')}
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    {t('docs.clickRaceAiToTest')}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 rounded-xl border border-white/[0.08] bg-[#090B11] overflow-hidden">
              <div className="border-b border-white/[0.07] px-4 py-3">
                <h3 className="font-display text-sm sm:text-base font-bold text-white">
                  {t('docs.keycapsTouch')}
                </h3>
              </div>
              <div className="divide-y divide-white/[0.07] text-xs">
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <span className="text-slate-300">{t('docs.flap')}</span>
                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    <kbd className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-amber-200">Space</kbd>
                    <kbd className="rounded border border-white/15 bg-white/[0.04] px-2 py-0.5 text-slate-200">↑</kbd>
                    <kbd className="rounded border border-white/15 bg-white/[0.04] px-2 py-0.5 text-slate-200">W</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <span className="text-slate-300">{t('docs.pause')}</span>
                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    <kbd className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-cyan-200">P</kbd>
                    <kbd className="rounded border border-white/15 bg-white/[0.04] px-2 py-0.5 text-slate-200">Esc</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <span className="text-slate-300">{t('docs.restart')}</span>
                  <kbd className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-200">R</kbd>
                </div>
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <span className="text-slate-300">{t('docs.mobile')}</span>
                  <span className="font-mono text-[11px] text-amber-300">{t('docs.flap95Cap')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 02: VISUAL SENSOR & RETINA SCHEMATICS + VIEW GUIDES */}
      {activeSection === 'VIEWS_CONTROLS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* FIG. 02 */}
            <div className="rounded-xl border border-white/[0.08] bg-[#090B11] overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-cyan-300">FIG. 02</span>
                  <h2 className="font-display text-sm sm:text-base font-bold text-white">
                    {t('docs.modeAGeometricSensors1')}
                  </h2>
                </div>
                <span className="font-mono text-[10.5px] text-slate-400">Exact Kinematics</span>
              </div>
              <div className="p-3 bg-[#06070B]">
                <svg viewBox="0 0 440 190" className="w-full h-auto" role="img" aria-label="Geometric sensor vectors diagram">
                  <line x1="0" y1="95" x2="440" y2="95" stroke="#1E293B" strokeDasharray="3 4" />
                  <rect x="210" y="0" width="42" height="58" fill="#059669" fillOpacity="0.45" stroke="#34D399" />
                  <rect x="210" y="132" width="42" height="58" fill="#059669" fillOpacity="0.45" stroke="#34D399" />
                  <rect x="360" y="0" width="42" height="36" fill="#0284C7" fillOpacity="0.35" stroke="#38BDF8" />
                  <rect x="360" y="114" width="42" height="76" fill="#0284C7" fillOpacity="0.35" stroke="#38BDF8" />
                  <circle cx="88" cy="95" r="12" fill="#F59E0B" stroke="#FEF3C7" strokeWidth="1.8" />
                  <circle cx="93" cy="91" r="2.5" fill="#0B1120" />
                  <line x1="48" y1="12" x2="48" y2="178" stroke="#A78BFA" strokeDasharray="3 3" />
                  <line x1="48" y1="95" x2="74" y2="95" stroke="#A78BFA" strokeWidth="1.6" />
                  <text x="36" y="99" fill="#C4B5FD" fontSize="10" fontWeight="700" fontFamily="JetBrains Mono, monospace">Y</text>
                  <line x1="88" y1="81" x2="88" y2="48" stroke="#34D399" strokeWidth="2" />
                  <polygon points="88,43 84,51 92,51" fill="#34D399" />
                  <text x="72" y="56" fill="#6EE7B7" fontSize="10" fontWeight="700" fontFamily="JetBrains Mono, monospace">Vy</text>
                  <line x1="100" y1="95" x2="252" y2="95" stroke="#38BDF8" strokeDasharray="5 3" strokeWidth="1.5" />
                  <text x="160" y="89" fill="#7DD3FC" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">DX · TTF</text>
                  <line x1="96" y1="89" x2="210" y2="58" stroke="#10B981" strokeDasharray="4 3" strokeWidth="1.5" />
                  <text x="195" y="52" fill="#6EE7B7" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">Top</text>
                  <line x1="96" y1="101" x2="210" y2="132" stroke="#22D3EE" strokeDasharray="4 3" strokeWidth="1.5" />
                  <text x="195" y="145" fill="#67E8F9" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">Bot</text>
                  <circle cx="231" cy="95" r="3" fill="#F472B6" />
                  <line x1="231" y1="95" x2="231" y2="68" stroke="#F472B6" strokeWidth="1.8" />
                  <text x="238" y="72" fill="#F9A8D4" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">PVy</text>
                  <line x1="231" y1="95" x2="381" y2="75" stroke="#FACC15" strokeDasharray="4 3" strokeWidth="1.4" />
                  <circle cx="381" cy="75" r="3.5" fill="#FDE047" />
                  <text x="306" y="76" fill="#FDE047" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">N2Y</text>
                </svg>
              </div>
              <p className="border-t border-white/[0.07] px-4 py-2.5 font-mono text-[11px] text-slate-400">
                {t('docs.invariantsMinTopBotClearance')}
              </p>
            </div>

            {/* FIG. 03 */}
            <div className="rounded-xl border border-white/[0.08] bg-[#090B11] overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-emerald-300">FIG. 03</span>
                  <h2 className="font-display text-sm sm:text-base font-bold text-white">
                    {t('docs.modeB16RayCompound')}
                  </h2>
                </div>
                <span className="font-mono text-[10.5px] text-slate-400">-68°..+68° Fan</span>
              </div>
              <div className="p-3 bg-[#06070B]">
                <svg viewBox="0 0 440 190" className="w-full h-auto" role="img" aria-label="16-Ray compound eye optical fan diagram">
                  <rect x="265" y="0" width="44" height="58" fill="#10B981" fillOpacity="0.3" stroke="#34D399" />
                  <rect x="265" y="132" width="44" height="58" fill="#10B981" fillOpacity="0.3" stroke="#34D399" />
                  {[-0.95, -0.75, -0.55, -0.35, -0.15, 0.08, 0.3, 0.52, 0.74, 0.96].map((ang, i) => {
                    const hitGap = Math.abs(ang) < 0.25;
                    const len = hitGap ? 290 : 185;
                    const x2 = 82 + Math.cos(ang) * len;
                    const y2 = 95 + Math.sin(ang) * len;
                    return (
                      <g key={i}>
                        <line
                          x1="82"
                          y1="95"
                          x2={x2}
                          y2={Math.max(8, Math.min(182, y2))}
                          stroke={hitGap ? '#34D399' : '#22D3EE'}
                          strokeOpacity={hitGap ? 0.75 : 0.42}
                          strokeDasharray={hitGap ? undefined : '3 3'}
                          strokeWidth={hitGap ? 1.6 : 1.1}
                        />
                        {!hitGap && (
                          <circle cx={x2} cy={Math.max(8, Math.min(182, y2))} r="2.6" fill="#FBBF24" />
                        )}
                      </g>
                    );
                  })}
                  <circle cx="82" cy="95" r="12" fill="#22D3EE" stroke="#ECFEFF" strokeWidth="1.6" />
                  <rect x="330" y="24" width="96" height="142" rx="10" fill="#0B0E17" stroke="#10B981" strokeOpacity="0.5" />
                  <text x="378" y="48" fill="#6EE7B7" fontSize="10.5" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono, monospace">OPTIC LOBE</text>
                  <rect x="342" y="60" width="72" height="24" rx="5" fill="#064E3B" />
                  <text x="378" y="76" fill="#A7F3D0" fontSize="9.5" textAnchor="middle" fontFamily="JetBrains Mono, monospace">L1/L2 ΔI Contrast</text>
                  <rect x="342" y="94" width="72" height="24" rx="5" fill="#164E63" />
                  <text x="378" y="110" fill="#A5F3FC" fontSize="9.5" textAnchor="middle" fontFamily="JetBrains Mono, monospace">T4/T5 Motion</text>
                  <rect x="342" y="128" width="72" height="24" rx="5" fill="#3B0764" />
                  <text x="378" y="144" fill="#E9D5FF" fontSize="9.5" textAnchor="middle" fontFamily="JetBrains Mono, monospace">5–12ch Feature</text>
                </svg>
              </div>
              <p className="border-t border-white/[0.07] px-4 py-2.5 font-mono text-[11px] text-slate-400">
                {t('docs.networkReceivesOpticalContrastMotion')}
              </p>
            </div>
          </div>

          {/* Play vs Training Directory (Flush Hairline Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08] rounded-xl border border-white/[0.08] bg-[#090B11]">
            <div className="p-4 sm:p-5 space-y-3">
              <h3 className="font-display text-sm sm:text-base font-bold text-amber-300">
                {t('docs.playViewKeyMechanics')}
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="font-mono text-[11px] font-bold text-amber-200">Solo / VS AI</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{t('docs.soloFlightOrVsAi')}</div>
                </div>
                <div>
                  <div className="font-mono text-[11px] font-bold text-emerald-300">Orby ★/◆ &amp; Combo</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{t('docs.bonusPointsForCenterPass')}</div>
                </div>
                <div>
                  <div className="font-mono text-[11px] font-bold text-cyan-300">{t('docs.leaderboard2')}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{t('docs.nickProfileTopScoresRun')}</div>
                </div>
                <div>
                  <div className="font-mono text-[11px] font-bold text-rose-300">Overdrive 100–145%</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{t('docs.extremeSliderOnExtraInsane')}</div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-3">
              <h3 className="font-display text-sm sm:text-base font-bold text-cyan-300">
                {t('docs.trainingLabKeyModes')}
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="font-mono text-[11px] font-bold text-emerald-300">Arena vs Single</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{t('docs.k12SpeciesIslandsOr1')}</div>
                </div>
                <div>
                  <div className="font-mono text-[11px] font-bold text-amber-300">{t('docs.autoGrow')}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{t('docs.growsHiddenWidthOnStagnation')}</div>
                </div>
                <div>
                  <div className="font-mono text-[11px] font-bold text-purple-300">Shaped + Curriculum</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{t('docs.centeringRewardGentleRamp')}</div>
                </div>
                <div>
                  <div className="font-mono text-[11px] font-bold text-cyan-300">95% Cap + 1x..MAX</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{t('docs.constant95PowerCapSingle')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 12-Sensor Swiss Hairline Matrix */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
                {t('docs.all12SensorChannelsGeo')}
              </h3>
              <span className="font-mono text-[11px] text-cyan-300">
                5 Core · 2 Velocity/Gap · 4 Lookahead #2 · 1 Timing
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-white/[0.08] rounded-xl overflow-hidden border border-white/[0.08]">
              {ALL_SENSOR_FEATURES.map((sId, idx) => {
                const meta = SENSOR_METADATA[sId];
                const isPipe2 = meta.group === 'PIPE_2' || sId === 'PIPE_TTF';
                return (
                  <div key={sId} className="bg-[#090B11] p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-1.5 font-mono">
                      <span className={`text-xs font-bold ${isPipe2 ? 'text-amber-300' : 'text-cyan-300'}`}>
                        {String(idx + 1).padStart(2, '0')} · {meta.shortLabel}
                      </span>
                      <span className="text-[10px] text-emerald-300">
                        {meta.opticalShortLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {meta.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 03: 12 ARCHITECTURES & MOE VS ISLANDS */}
      {activeSection === 'ARCHITECTURES_MOE' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* FIG. 04 */}
            <div className="rounded-xl border border-white/[0.08] bg-[#090B11] overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-amber-300">FIG. 04</span>
                  <h3 className="font-display text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                    <GitBranch className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>HYBRID_MOE · {t('docs.singleBirdAutoRouter')}</span>
                  </h3>
                </div>
                <span className="font-mono text-[10.5px] text-amber-200">ROI ≥ 2% Gate</span>
              </div>
              <div className="p-3 bg-[#06070B]">
                <svg viewBox="0 0 430 148" className="w-full h-auto" role="img" aria-label="Hybrid MoE Router Diagram">
                  <rect x="8" y="54" width="54" height="40" rx="8" fill="#0B0E17" stroke="#38BDF8" />
                  <text x="35" y="78" fill="#7DD3FC" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono, monospace">Input x</text>
                  <rect x="84" y="44" width="76" height="60" rx="8" fill="#451A03" stroke="#F59E0B" />
                  <text x="122" y="70" fill="#FDE68A" fontSize="10.5" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono, monospace">Softmax</text>
                  <text x="122" y="86" fill="#FCD34D" fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono, monospace">Router α</text>
                  <line x1="62" y1="74" x2="84" y2="74" stroke="#38BDF8" strokeWidth="1.8" />
                  {[
                    { y: 8, label: 'MLP Reflex', c: '#38BDF8' },
                    { y: 42, label: 'LTC ODE τ', c: '#34D399' },
                    { y: 76, label: 'MinGRU SSM', c: '#F472B6' },
                    { y: 110, label: 'Ponder ACT', c: '#A855F7' },
                  ].map((ex, i) => (
                    <g key={ex.label}>
                      <line x1="160" y1="74" x2="198" y2={ex.y + 13} stroke={ex.c} strokeWidth="1.4" strokeOpacity="0.8" />
                      <rect x="198" y={ex.y} width="106" height="26" rx="6" fill="#0B0E17" stroke={ex.c} />
                      <text x="251" y={ex.y + 17} fill="#E2E8F0" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono, monospace">
                        {i + 1}. {ex.label}
                      </text>
                      <line x1="304" y1={ex.y + 13} x2="342" y2="74" stroke={ex.c} strokeWidth="1.2" strokeOpacity="0.7" />
                    </g>
                  ))}
                  <rect x="342" y="48" width="78" height="52" rx="8" fill="#064E3B" stroke="#10B981" />
                  <text x="381" y="71" fill="#A7F3D0" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono, monospace">Σ α·Expert</text>
                  <text x="381" y="87" fill="#6EE7B7" fontSize="9.5" textAnchor="middle" fontFamily="JetBrains Mono, monospace">→ FLAP</text>
                </svg>
              </div>
              <p className="border-t border-white/[0.07] px-4 py-2.5 font-mono text-[11px] text-slate-400">
                {t('docs.startsAsMlpTrialsSpecialists')}
              </p>
            </div>

            {/* FIG. 05 */}
            <div className="rounded-xl border border-white/[0.08] bg-[#090B11] overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-cyan-300">FIG. 05</span>
                  <h3 className="font-display text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Arena Live · {t('docs.islandSpeciation')}</span>
                  </h3>
                </div>
                <span className="font-mono text-[10.5px] text-cyan-200">2–12 Species Parallel</span>
              </div>
              <div className="p-3 bg-[#06070B]">
                <svg viewBox="0 0 430 148" className="w-full h-auto" role="img" aria-label="Arena Live Island Speciation Diagram">
                  {[
                    { y: 12, name: 'Island #1 · Hybrid MoE', opt: 'CMA-ES', c: '#F59E0B' },
                    { y: 46, name: 'Island #2 · Drosophila', opt: 'CMA-ES', c: '#10B981' },
                    { y: 80, name: 'Island #3 · Fly-Cortex', opt: 'Diff Evol', c: '#A855F7' },
                    { y: 114, name: 'Island #4..12 · SSM/ACT', opt: 'GA / ES', c: '#38BDF8' },
                  ].map((isl) => (
                    <g key={isl.name}>
                      <rect x="10" y={isl.y} width="268" height="24" rx="6" fill="#0B0E17" stroke={isl.c} strokeOpacity="0.65" />
                      <text x="20" y={isl.y + 15.5} fill="#E2E8F0" fontSize="10" fontWeight="700" fontFamily="JetBrains Mono, monospace">
                        {isl.name}
                      </text>
                      <text x="268" y={isl.y + 15.5} fill={isl.c} fontSize="9.5" textAnchor="end" fontFamily="JetBrains Mono, monospace">
                        {isl.opt}
                      </text>
                      <line x1="278" y1={isl.y + 12} x2="316" y2="74" stroke={isl.c} strokeWidth="1.4" strokeOpacity="0.7" />
                    </g>
                  ))}
                  <rect x="316" y="42" width="104" height="64" rx="10" fill="#0B0E17" stroke="#22D3EE" />
                  <text x="368" y="66" fill="#67E8F9" fontSize="10.5" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono, monospace">SHARED SEED</text>
                  <text x="368" y="82" fill="#E2E8F0" fontSize="9.5" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">{t('docs.identicalPipes')}</text>
                  <text x="368" y="96" fill="#94A3B8" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono, monospace">{t('docs.clickInspect')}</text>
                </svg>
              </div>
              <p className="border-t border-white/[0.07] px-4 py-2.5 font-mono text-[11px] text-slate-400">
                {t('docs.eachIslandRunsItsIsolated')}
              </p>
            </div>
          </div>

          {/* 7 Tier-1 Primary Architecture Typographic Specimen Matrix */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{t('docs.k7PrimaryArchitecturesTier1')}</span>
              </h3>
              <span className="font-mono text-[11px] text-slate-400">
                ◆ WebGPU Lockstep · ◇ CPU Specialized
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-white/[0.08] rounded-xl overflow-hidden border border-white/[0.08]">
              {TIER_1_ARCHITECTURES.map((arch, idx) => {
                const info = ARCHITECTURE_CATALOG[arch];
                const flopsBarPct = Math.min(100, Math.round((info.flopsMultiplier / 2.6) * 100));
                return (
                  <div key={arch} className="bg-[#090B11] flex flex-col justify-between">
                    <div className="h-[2px] w-full" style={{ backgroundColor: info.colorHex }} />
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-2.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="flex items-baseline gap-2 min-w-0">
                            <span
                              className="font-display text-lg font-extrabold tabular-nums shrink-0"
                              style={{ color: info.colorHex }}
                            >
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className="font-display font-bold text-base text-white truncate">
                              {getArchText(lang, arch).label}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400 shrink-0">
                            {getArchText(lang, arch).badge}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {getArchText(lang, arch).howItWorks}
                        </p>

                        <div className="font-mono text-[11px] text-cyan-300 bg-[#05060A] px-3 py-2 rounded border border-white/[0.07] truncate">
                          {info.keyFormula}
                        </div>
                      </div>

                      <div className="space-y-2.5 pt-3 border-t border-white/[0.07] text-[11px]">
                        <div className="text-emerald-300/95 leading-snug">
                          <span className="font-mono text-[10px] text-emerald-400 mr-1.5">{t('docs.verdict')}</span>
                          {getArchText(lang, arch).verdict}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 tabular-nums">
                            <span>FLOPs: {info.flopsMultiplier}× MLP</span>
                            <span
                              className={
                                info.computeProfile === 'GPU_LOCKSTEP'
                                  ? 'text-amber-300'
                                  : 'text-purple-300'
                              }
                            >
                              {info.computeProfile === 'GPU_LOCKSTEP'
                                ? '◆ WebGPU + CPU'
                                : '◇ CPU Specialized'}
                            </span>
                          </div>
                          <div className="h-1 w-full bg-white/[0.06] overflow-hidden">
                            <div
                              className="h-full"
                              style={{
                                width: `${flopsBarPct}%`,
                                backgroundColor: info.colorHex,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5 Tier 2 Auxiliary / Legacy */}
          <div className="space-y-2.5">
            <h3 className="font-display text-sm font-bold text-slate-300 flex items-center gap-2">
              <Archive className="w-4 h-4 text-slate-400" />
              <span>{t('docs.k5AuxiliaryLegacyTier2')}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-white/[0.08] rounded-xl overflow-hidden border border-white/[0.08]">
              {TIER_2_LEGACY_ARCHITECTURES.map((arch) => {
                const info = ARCHITECTURE_CATALOG[arch];
                return (
                  <div key={arch} className="bg-[#090B11] p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-1 font-mono tabular-nums">
                      <span className="font-display font-bold text-xs text-slate-100">
                        {info.shortLabel}
                      </span>
                      <span className="text-[10.5px] text-amber-300">{info.flopsMultiplier}×</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {getArchText(lang, arch).summary}
                    </p>
                    <p className="font-mono text-[10px] text-amber-300/85 pt-1.5 border-t border-white/[0.06]">
                      {getArchText(lang, arch).verdict}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 04: OPTIMIZERS, QUANTIZATION SPECTRUM & AUDIT PIPELINE */}
      {activeSection === 'OPTIMIZERS_RESEARCH' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 8 Optimizers Flush Ledger */}
            <div className="rounded-xl border border-white/[0.08] bg-[#090B11] overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-3">
                <h3 className="font-display text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>{t('docs.k8GradientFreeOptimizers')}</span>
                </h3>
                <span className="font-mono text-[10px] text-slate-400">
                  Zero Backprop · Closed Physics Loop
                </span>
              </div>

              <div className="divide-y divide-white/[0.07]">
                {Object.values(OPTIMIZER_CATALOG).map((opt) => {
                  const prof = OPTIMIZER_PROFILE[opt.id];
                  return (
                    <div key={opt.id} className="p-3.5 sm:px-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-display font-bold text-xs sm:text-sm text-cyan-300">
                          {getOptimizerText(lang, opt.id).fullName}
                        </span>
                        <div className="flex items-center gap-2 font-mono text-[10px]">
                          <span className={prof.usesMutRate ? 'text-amber-300' : 'text-slate-500'}>
                            {prof.usesMutRate
                              ? opt.id === 'DE'
                                ? '✓ CR Rate'
                                : '✓ Mut. Rate'
                              : '— Covariance/ES'}
                          </span>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="text-emerald-300">
                            {getOptimizerText(lang, opt.id).badge}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11.5px] text-slate-300 leading-snug">
                        {getOptimizerText(lang, opt.id).summary}
                      </p>
                      <div className="grid grid-cols-2 gap-4 pt-0.5 font-mono text-[10px] text-slate-400 tabular-nums">
                        <div>
                          <div className="flex justify-between">
                            <span>{t('docs.g1Speed')}</span>
                            <span className="text-cyan-300">{prof.speedPct}%</span>
                          </div>
                          <div className="mt-1 h-1 bg-white/[0.06] overflow-hidden">
                            <div className="h-full bg-cyan-400" style={{ width: `${prof.speedPct}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between">
                            <span>{t('docs.explore')}</span>
                            <span className="text-emerald-300">{prof.explorePct}%</span>
                          </div>
                          <div className="mt-1 h-1 bg-white/[0.06] overflow-hidden">
                            <div className="h-full bg-emerald-400" style={{ width: `${prof.explorePct}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-5">
              {/* Weight Quantization Spectrum */}
              <div className="rounded-xl border border-white/[0.08] bg-[#090B11] overflow-hidden">
                <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-3">
                  <h3 className="font-display text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    <span>{t('docs.weightPrecisionSpectrum')}</span>
                  </h3>
                  <span className="font-mono text-[10.5px] text-amber-300">32-bit → 1-bit Edge</span>
                </div>

                <div className="p-4 space-y-3">
                  <div className="h-2 w-full overflow-hidden flex border border-white/[0.08]">
                    <div className="bg-cyan-400 w-[24%]" title="FP32" />
                    <div className="bg-sky-400 w-[20%]" title="FP16" />
                    <div className="bg-emerald-400 w-[18%]" title="INT8" />
                    <div className="bg-amber-400 w-[16%]" title="INT4" />
                    <div className="bg-orange-400 w-[12%]" title="TERNARY" />
                    <div className="bg-rose-400 w-[10%]" title="BINARY" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.07] border border-white/[0.07] rounded-lg overflow-hidden">
                    {Object.values(PRECISION_CATALOG).map((prec) => (
                      <div key={prec.id} className="bg-[#0B0E16] p-3 space-y-1">
                        <div className="flex items-center justify-between font-mono tabular-nums">
                          <span className="font-bold text-xs text-slate-100">{prec.label}</span>
                          <span className="text-[10.5px] font-bold text-amber-300">
                            {prec.bitsPerWeight} b/w
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          {getPrecisionText(lang, prec.id).summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* FIG. 06 Research F32 -> F64 Audit Pipeline */}
              <div className="rounded-xl border border-white/[0.08] bg-[#090B11] overflow-hidden">
                <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-emerald-300">FIG. 06</span>
                    <h3 className="font-display text-sm sm:text-base font-bold text-white">
                      {t('docs.researchPipelineWebgpuFloat64Audit')}
                    </h3>
                  </div>
                </div>

                <div className="p-3 bg-[#06070B]">
                  <svg viewBox="0 0 460 116" className="w-full h-auto" role="img" aria-label="Research WebGPU to F64 Audit pipeline">
                    <rect x="8" y="18" width="98" height="74" rx="8" fill="#0B0E17" stroke="#38BDF8" />
                    <text x="57" y="42" fill="#7DD3FC" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono, monospace">Smart Prune</text>
                    <text x="57" y="60" fill="#CBD5E1" fontSize="9.5" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">{t('docs.skips65')}</text>
                    <text x="57" y="75" fill="#94A3B8" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono, monospace">{t('docs.duplicates')}</text>
                    <line x1="106" y1="55" x2="122" y2="55" stroke="#10B981" strokeWidth="1.8" />
                    <rect x="122" y="18" width="106" height="74" rx="8" fill="#0B0E17" stroke="#10B981" />
                    <text x="175" y="42" fill="#6EE7B7" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono, monospace">WebGPU F32</text>
                    <text x="175" y="60" fill="#CBD5E1" fontSize="9.5" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">8-Tier WGSL</text>
                    <text x="175" y="75" fill="#94A3B8" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono, monospace">&lt;400ms TDR</text>
                    <line x1="228" y1="55" x2="244" y2="55" stroke="#FBBF24" strokeWidth="1.8" />
                    <rect x="244" y="18" width="96" height="74" rx="8" fill="#451A03" stroke="#F59E0B" />
                    <text x="292" y="42" fill="#FDE68A" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono, monospace">Milestone</text>
                    <text x="292" y="60" fill="#FCD34D" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono, monospace">{t('docs.k25Pipes')}</text>
                    <text x="292" y="75" fill="#FDE68A" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono, monospace">Smart Gate</text>
                    <line x1="340" y1="55" x2="356" y2="55" stroke="#A855F7" strokeWidth="1.8" />
                    <rect x="356" y="18" width="96" height="74" rx="8" fill="#3B0764" stroke="#A855F7" />
                    <text x="404" y="42" fill="#E9D5FF" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono, monospace">CPU Float64</text>
                    <text x="404" y="60" fill="#D8B4FE" fontSize="9.5" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">5-Seed Proof</text>
                    <text x="404" y="75" fill="#C4B5FD" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono, monospace">Colab / JSONL</text>
                  </svg>
                </div>

                <div className="grid grid-cols-2 divide-x divide-white/[0.07] border-t border-white/[0.07] font-mono text-[11px] text-slate-300">
                  <div className="px-4 py-2.5">
                    {t('docs.presetsQueue', { RESEARCH_PRESETS: RESEARCH_PRESETS.length })}
                  </div>
                  <div className="px-4 py-2.5">GPU Load 10%–100%</div>
                </div>
              </div>

              {/* Research Persistence & GitHub Data Lake */}
              <div className="rounded-xl border border-white/[0.08] bg-[#090B11] overflow-hidden">
                <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-3">
                  <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-emerald-400" />
                    <span>{t('docs.persistenceIndexeddbVsGithubData')}</span>
                  </h3>
                  <span className="font-mono text-[10px] text-emerald-300">Static SPA + CI</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07] text-[11.5px] leading-relaxed">
                  <div className="p-3.5 space-y-1">
                    <div className="font-mono text-[10.5px] font-bold text-cyan-300">
                      {t('docs.k1LocalBrowserAutomatic')}
                    </div>
                    <p className="text-slate-400">
                      {t('docs.allTrialRowsCheckpointsEvery')}
                    </p>
                  </div>
                  <div className="p-3.5 space-y-1">
                    <div className="font-mono text-[10.5px] font-bold text-emerald-300">
                      {t('docs.k2GithubPagesDataLake')}
                    </div>
                    <p className="text-slate-400">
                      {t('docs.githubPagesIsStaticRead')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Broadsheet Empirical Conclusions Strip */}
          <div className="rounded-xl border border-white/[0.08] bg-[#090B11] overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-3">
              <h3 className="font-display text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Archive className="w-4 h-4 text-cyan-400" />
                <span>
                  {t('docs.empiricalConclusions84062Historical')}
                </span>
              </h3>
              <span className="font-mono text-[11px] text-cyan-300 tabular-nums">n = 84,062</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
              <div className="p-4 space-y-1.5">
                <div className="font-display text-2xl font-extrabold text-amber-300 tabular-nums">PVy + N2Y</div>
                <div className="font-mono text-[10px] text-slate-400">01 · MOVING PIPES</div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {t('docs.unlockMovingPipeTrackingAnd')}
                </p>
              </div>
              <div className="p-4 space-y-1.5">
                <div className="font-display text-2xl font-extrabold text-cyan-300 tabular-nums">98.1% vs 4–6</div>
                <div className="font-mono text-[10px] text-slate-400">02 · SENSOR RANK</div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {t('docs.easyReaches981With')}
                </p>
              </div>
              <div className="p-4 space-y-1.5">
                <div className="font-display text-2xl font-extrabold text-emerald-300 tabular-nums">5-seed F64</div>
                <div className="font-mono text-[10px] text-slate-400">03 · GENERALIZATION</div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {t('docs.gpuSearchesRapidlyCpuFloat64')}
                </p>
              </div>
              <div className="p-4 space-y-1.5">
                <div className="font-display text-2xl font-extrabold text-purple-300 tabular-nums">29–32%</div>
                <div className="font-mono text-[10px] text-slate-400">04 · CIRCUIT &gt; ALG</div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {t('docs.drosophilaScored2932Across')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 05: FLY-CORTEX SVG CIRCUIT & BALLISTIC PROOFS */}
      {activeSection === 'VISION_PROOFS' && (
        <div className="space-y-6">
          {/* FIG. 07 Fly-Cortex Circuit */}
          <div className="rounded-xl border border-white/[0.08] bg-[#090B11] overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-purple-300">FIG. 07</span>
                <h2 className="font-display text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>
                    {t('docs.flyCortexDecouplingReasoningFrom')}
                  </span>
                </h2>
              </div>
              <span className="font-mono text-[11px] text-purple-300">
                30–60 Plastic Weights
              </span>
            </div>

            <div className="p-3 bg-[#06070B]">
              <div className="sm:hidden space-y-2 text-xs">
                <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/35 p-2.5">
                  <div className="font-display font-bold text-emerald-300">1. T4/T5 LTC Perception</div>
                  <div className="text-[11px] text-slate-300">Ciekła stała czasowa τ(x) · <span className="font-mono text-emerald-200">16-Ray ΔI</span></div>
                </div>
                <div className="rounded-lg border border-purple-500/40 bg-purple-950/40 p-2.5">
                  <div className="font-display font-bold text-purple-200">2. Frozen FlyHash APL Index</div>
                  <div className="text-[11px] text-slate-300">Zamrożony indeks (0-backprop) · <span className="font-mono text-purple-200">Top-25% k-WTA</span></div>
                </div>
                <div className="rounded-lg border border-amber-500/40 bg-amber-950/40 p-2.5">
                  <div className="font-display font-bold text-amber-200">3. Plastic Executive + DA</div>
                  <div className="text-[11px] text-slate-300">Rozumowanie i plastyczność · <span className="font-mono text-amber-300">Δw = η·DA·pre·post</span></div>
                </div>
                <div className="rounded-md border border-rose-500/50 bg-rose-950/50 px-2.5 py-1.5 text-center font-mono text-[10px] font-bold text-rose-200">
                  GIANT FIBER ESCAPE BYPASS (&lt;1 tick)
                </div>
              </div>

              <div className="hidden sm:block">
                <svg viewBox="0 0 880 156" className="w-full h-auto" role="img" aria-label="Fly-Cortex 3-Layer Connectome Circuit">
                  <rect x="14" y="20" width="230" height="84" rx="12" fill="#064E3B" fillOpacity="0.45" stroke="#10B981" strokeWidth="1.5" />
                  <text x="30" y="45" fill="#6EE7B7" fontSize="12" fontWeight="700" fontFamily="Bricolage Grotesque, sans-serif">1. T4/T5 LTC Perception</text>
                  <text x="30" y="65" fill="#CBD5E1" fontSize="10.5" fontFamily="Plus Jakarta Sans, sans-serif">{t('docs.liquidTimeConstantX')}</text>
                  <text x="30" y="85" fill="#A7F3D0" fontSize="10" fontFamily="JetBrains Mono, monospace">16-Ray ΔI + Edge Motion</text>
                  <path d="M 129 104 L 129 138 L 745 138 L 745 106" fill="none" stroke="#EF4444" strokeWidth="1.8" strokeDasharray="5 4" />
                  <rect x="330" y="126" width="230" height="22" rx="6" fill="#450A0A" stroke="#EF4444" />
                  <text x="445" y="140.5" fill="#FCA5A5" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono, monospace">
                    GIANT FIBER ESCAPE BYPASS (&lt;1 tick)
                  </text>
                  <line x1="244" y1="62" x2="296" y2="62" stroke="#34D399" strokeWidth="2" />
                  <rect x="296" y="20" width="268" height="84" rx="12" fill="#3B0764" fillOpacity="0.55" stroke="#A855F7" strokeWidth="1.5" />
                  <text x="312" y="45" fill="#E9D5FF" fontSize="12" fontWeight="700" fontFamily="Bricolage Grotesque, sans-serif">2. Frozen FlyHash APL Index</text>
                  <text x="312" y="65" fill="#CBD5E1" fontSize="10.5" fontFamily="Plus Jakarta Sans, sans-serif">{t('docs.frozenConceptIndex0Backprop')}</text>
                  <text x="312" y="85" fill="#D8B4FE" fontSize="10" fontFamily="JetBrains Mono, monospace">16-Slot Sparse Top-25% k-WTA</text>
                  <line x1="564" y1="62" x2="616" y2="62" stroke="#A855F7" strokeWidth="2" />
                  <rect x="616" y="20" width="250" height="84" rx="12" fill="#451A03" fillOpacity="0.55" stroke="#F59E0B" strokeWidth="1.5" />
                  <text x="632" y="45" fill="#FDE68A" fontSize="12" fontWeight="700" fontFamily="Bricolage Grotesque, sans-serif">3. Plastic Executive + DA</text>
                  <text x="632" y="65" fill="#CBD5E1" fontSize="10.5" fontFamily="Plus Jakarta Sans, sans-serif">{t('docs.reasoningOnlinePlasticity')}</text>
                  <text x="632" y="85" fill="#FCD34D" fontSize="10" fontFamily="JetBrains Mono, monospace">Δw = η · DA(t) · pre · post</text>
                </svg>
              </div>
            </div>
          </div>

          {/* Mathematical Solvability Proofs Table */}
          <div className="rounded-xl border border-white/[0.08] bg-[#090B11] overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-3">
              <h2 className="font-display text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  {t('docs.ballisticSolvabilityProofsVsOverdriv')}
                </span>
              </h2>
              <span className="font-mono text-[11px] text-slate-400">
                verifyScenarioSolvability(env)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-slate-400 font-mono text-[11px]">
                    <th className="py-2.5 px-3">{t('docs.scenario')}</th>
                    <th className="py-2.5 px-3">{t('docs.gap')}</th>
                    <th className="py-2.5 px-3">{t('docs.speed')}</th>
                    <th className="py-2.5 px-3">dt</th>
                    <th className="py-2.5 px-3">{t('docs.climbSlack')}</th>
                    <th className="py-2.5 px-3">{t('docs.diveSlack')}</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] font-mono tabular-nums">
                  {scenarioProofRows.map((row) => {
                    const p = row.proof;
                    const climbPct = Math.min(100, Math.max(8, Math.round((Math.abs(p.climbSlackPx) / 220) * 100)));
                    const divePct = Math.min(100, Math.max(8, Math.round((Math.abs(p.diveSlackPx) / 220) * 100)));
                    return (
                      <tr
                        key={row.id}
                        className={row.isOverdrive ? 'bg-rose-950/15' : 'hover:bg-white/[0.02]'}
                      >
                        <td className="py-3 px-3 font-sans">
                          <div className="font-bold text-slate-100">{row.title}</div>
                          <div className="text-[10.5px] text-slate-400">{row.subtitle}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {row.env.gap}px <span className="text-slate-500">({p.minGapPx})</span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {row.env.pipeSpeed} ±{Math.round(row.env.speedVariability * 100)}%
                        </td>
                        <td className="py-3 px-3 text-cyan-300">{p.dtMinFrames}f</td>
                        <td className="py-3 px-3 min-w-[115px]">
                          <div className={`font-bold ${p.climbSlackPx >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {p.climbSlackPx >= 0 ? '+' : ''}
                            {Math.round(p.climbSlackPx)}px
                          </div>
                          <div className="mt-1 h-1 w-full bg-white/[0.06] overflow-hidden">
                            <div
                              className={`h-full ${p.climbSlackPx >= 0 ? 'bg-emerald-400' : 'bg-rose-500'}`}
                              style={{ width: `${climbPct}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-3 min-w-[115px]">
                          <div className={`font-bold ${p.diveSlackPx >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {p.diveSlackPx >= 0 ? '+' : ''}
                            {Math.round(p.diveSlackPx)}px
                          </div>
                          <div className="mt-1 h-1 w-full bg-white/[0.06] overflow-hidden">
                            <div
                              className={`h-full ${p.diveSlackPx >= 0 ? 'bg-emerald-400' : 'bg-rose-500'}`}
                              style={{ width: `${divePct}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {p.solvable ? (
                            <span className="inline-flex items-center gap-1 text-emerald-300 text-[10.5px] font-semibold">
                              <ShieldCheck className="w-3.5 h-3.5" /> {t('docs.passable')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-300 text-[10.5px] font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5" /> OVERDRIVE
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Engine Runtime Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.08] rounded-xl border border-white/[0.08] bg-[#090B11] text-xs">
            <div className="p-4 sm:p-5 space-y-1.5">
              <div className="font-display font-bold text-emerald-300 flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                <span>8-Tier Dynamic WebGPU WGSL</span>
              </div>
              <p className="text-slate-400 text-[12px] leading-relaxed">
                {t('docs.autoRoutesFastRegisterDeep')}
              </p>
            </div>
            <div className="p-4 sm:p-5 space-y-1.5">
              <div className="font-display font-bold text-cyan-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Deterministic Mulberry32 · Float64 Parity</span>
              </div>
              <p className="text-slate-400 text-[12px] leading-relaxed">
                {t('docs.bitIdenticalEulerKinematicsTrajector')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
