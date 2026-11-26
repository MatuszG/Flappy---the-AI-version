import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  BookOpen,
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
import { ALL_SENSOR_FEATURES, SENSOR_METADATA } from '../engine/sensors';
import type { CoreDifficultyPreset, LearningAlgorithm } from '../engine/types';
import { useLanguage } from '../i18n/LanguageContext';

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
  DE: { speedPct: 86, explorePct: 94, usesMutRate: false },
  GA: { speedPct: 74, explorePct: 85, usesMutRate: true },
  ADAPTIVE_ES: { speedPct: 82, explorePct: 68, usesMutRate: true },
  NATURAL_ES: { speedPct: 78, explorePct: 72, usesMutRate: false },
  ADAM_ES: { speedPct: 84, explorePct: 65, usesMutRate: false },
  PSO: { speedPct: 80, explorePct: 76, usesMutRate: false },
  CEM: { speedPct: 76, explorePct: 62, usesMutRate: false },
};

export const ProjectDocumentationView: React.FC = () => {
  const { bi } = useLanguage();
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
        subtitle: DIFFICULTY_META[diff].description,
        env: DIFFICULTY_SETTINGS[diff],
      })
    );

    presets.push(
      {
        id: 'EXTRA_INSANE_115',
        title: 'Extra Insane (115%)',
        subtitle: bi('Próg strefy ujemnej', 'Enters negative slack zone'),
        env: buildOverdriveEnvironment(115),
        isOverdrive: true,
      },
      {
        id: 'EXTRA_INSANE_120',
        title: 'Extra Insane (120%)',
        subtitle: bi('Wymaga predykcji fazy rur', 'Forces phase lookahead'),
        env: buildOverdriveEnvironment(120),
        isOverdrive: true,
      },
      {
        id: 'EXTRA_INSANE_135',
        title: 'Extra Insane (135%)',
        subtitle: bi('Ekstremalny test stresu', 'Extreme connectome stress'),
        env: buildOverdriveEnvironment(135),
        isOverdrive: true,
      }
    );

    return presets.map((item) => ({
      ...item,
      proof: verifyScenarioSolvability(item.env),
    }));
  }, [bi]);

  const navTabs: {
    id: DocSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    activeCls: string;
  }[] = [
    {
      id: 'OVERVIEW',
      label: bi('1. Mapa Systemu', '1. System Map'),
      icon: Compass,
      activeCls: 'bg-amber-500/20 text-amber-200 border-amber-500/50',
    },
    {
      id: 'VIEWS_CONTROLS',
      label: bi('2. Widoki i Sensory', '2. Views & Sensors'),
      icon: Sliders,
      activeCls: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50',
    },
    {
      id: 'ARCHITECTURES_MOE',
      label: bi('3. 12 Architektur & MoE', '3. 12 Archs & MoE'),
      icon: Layers,
      activeCls: 'bg-purple-500/20 text-purple-200 border-purple-500/50',
    },
    {
      id: 'OPTIMIZERS_RESEARCH',
      label: bi('4. Algorytmy & Badania', '4. Optimizers & Lab'),
      icon: Sparkles,
      activeCls: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/50',
    },
    {
      id: 'VISION_PROOFS',
      label: bi('5. Fly-Cortex & Dowody', '5. Fly-Cortex & Proofs'),
      icon: Flame,
      activeCls: 'bg-rose-500/20 text-rose-200 border-rose-500/50',
    },
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-0 sm:px-2 py-2 sm:py-4 space-y-5 text-slate-200 overflow-x-clip">
      {/* Header Blueprint Card */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0F172A] via-[#0B1120] to-[#111827] p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl min-w-0">
            <div className="flex items-center gap-2 font-mono text-xs text-emerald-300">
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>
                {bi(
                  'Dokumentacja Wizualna · Flappy NeuroLab',
                  'Visual System Blueprint · Flappy NeuroLab'
                )}
              </span>
            </div>
            <h1 className="font-display text-xl sm:text-3xl font-bold text-white tracking-tight">
              {bi(
                'Od Ogółu do Szczegółu: Widoki, Schematy i Architektury',
                'System Map, Schematics & Neural Architectures'
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-snug">
              {bi(
                'Wspólna fizyka 60 Hz łączy tryb Arcade z Laboratorium Treningu AI oraz masowymi badaniami WebGPU + Float64.',
                'Shared 60 Hz deterministic Euler physics unites Play Arcade, Live Neuroevolution, and WebGPU + Float64 Research.'
              )}
            </p>
          </div>

          <div className="grid w-full lg:w-auto min-w-0 grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 text-xs font-mono tabular-nums bg-slate-950/75 p-3 rounded-xl border border-slate-800 shrink-0">
            <div className="rounded-lg bg-slate-900/70 px-2.5 py-2 border border-amber-500/25">
              <div className="text-[10px] text-slate-400">{bi('Gra & Ranking', 'Play & Rank')}</div>
              <div className="text-sm font-bold text-amber-300">Solo + Duel</div>
            </div>
            <div className="rounded-lg bg-slate-900/70 px-2.5 py-2 border border-emerald-500/25">
              <div className="text-[10px] text-slate-400">{bi('Architektury', 'Archs')}</div>
              <div className="text-sm font-bold text-emerald-300">7 T1 + 5 T2</div>
            </div>
            <div className="rounded-lg bg-slate-900/70 px-2.5 py-2 border border-cyan-500/25">
              <div className="text-[10px] text-slate-400">{bi('Algorytmy', 'Optimizers')}</div>
              <div className="text-sm font-bold text-cyan-300">3 Core + 5 ES</div>
            </div>
            <div className="rounded-lg bg-slate-900/70 px-2.5 py-2 border border-purple-500/25">
              <div className="text-[10px] text-slate-400">{bi('Obliczenia', 'Compute')}</div>
              <div className="text-sm font-bold text-purple-300">GPU F32 + F64</div>
            </div>
          </div>
        </div>

        {/* Interactive Section Tabs */}
        <div className="mt-4 flex flex-wrap gap-1.5 pt-4 border-t border-slate-800/80">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors border cursor-pointer ${
                  active
                    ? `${tab.activeCls} shadow-sm`
                    : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-100 hover:border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: VISUAL SYSTEM MAP */}
      {activeSection === 'OVERVIEW' && (
        <div className="space-y-4">
          {/* SVG System Flow Diagram */}
          <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  {bi('Diagram Przepływu: Jak współpracują moduły', 'End-to-End Architecture Flow')}
                </span>
              </h2>
              <span className="font-mono text-[11px] text-slate-400">
                100% Client-Side · 60 Hz Physics Parity
              </span>
            </div>

            {/* Mobile (<sm) Compact Vertical Flow Schematic — zero horizontal clipping */}
            <div className="sm:hidden rounded-xl border border-slate-800/90 bg-slate-950/75 p-2.5">
              <svg
                viewBox="0 0 340 278"
                className="w-full h-auto"
                role="img"
                aria-label="Flappy NeuroLab architecture pipeline mobile diagram"
              >
                <defs>
                  <linearGradient id="gAmberM" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#B45309" stopOpacity="0.08" />
                  </linearGradient>
                  <linearGradient id="gCyanM" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#0E7490" stopOpacity="0.08" />
                  </linearGradient>
                  <linearGradient id="gPurpleM" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#A855F7" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#6B21A8" stopOpacity="0.08" />
                  </linearGradient>
                  <linearGradient id="gEmeraldM" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#047857" stopOpacity="0.08" />
                  </linearGradient>
                </defs>

                {/* Top-Left: Play */}
                <rect x="6" y="8" width="154" height="102" rx="10" fill="url(#gAmberM)" stroke="#F59E0B" strokeOpacity="0.65" strokeWidth="1.2" />
                <text x="16" y="28" fill="#FCD34D" fontSize="11.5" fontWeight="700" fontFamily="Bricolage Grotesque, sans-serif">1. GRAJ ARCADE</text>
                <text x="16" y="45" fill="#E2E8F0" fontSize="9.5" fontFamily="Plus Jakarta Sans, sans-serif">Solo · Pojedynek AI</text>
                <text x="16" y="62" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono, monospace">PKT · Orby ★/◆</text>
                <text x="16" y="77" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono, monospace">Combo ×N · Tabela</text>
                <text x="16" y="96" fill="#FDE68A" fontSize="8.5" fontFamily="JetBrains Mono, monospace">60 Hz Native</text>

                {/* Top-Right: Training */}
                <rect x="180" y="8" width="154" height="102" rx="10" fill="url(#gCyanM)" stroke="#06B6D4" strokeOpacity="0.65" strokeWidth="1.2" />
                <text x="190" y="28" fill="#67E8F9" fontSize="11.5" fontWeight="700" fontFamily="Bricolage Grotesque, sans-serif">2. TRENING AI</text>
                <text x="190" y="45" fill="#E2E8F0" fontSize="9.5" fontFamily="Plus Jakarta Sans, sans-serif">Arena (2–12) / Single</text>
                <text x="190" y="62" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono, monospace">12 Geo | 16-Ray</text>
                <text x="190" y="77" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono, monospace">Live Mózg · Wykres</text>
                <text x="190" y="96" fill="#A5F3FC" fontSize="8.5" fontFamily="JetBrains Mono, monospace">Eco Mobile Guard</text>

                {/* Arrow Training -> Play */}
                <line x1="180" y1="58" x2="162" y2="58" stroke="#FBBF24" strokeWidth="1.8" />
                <text x="170" y="50" fill="#FCD34D" fontSize="7.5" textAnchor="middle" fontFamily="JetBrains Mono, monospace">Duel</text>

                {/* Bottom-Left: Brains */}
                <rect x="6" y="132" width="154" height="96" rx="10" fill="url(#gPurpleM)" stroke="#A855F7" strokeOpacity="0.65" strokeWidth="1.2" />
                <text x="16" y="152" fill="#D8B4FE" fontSize="11.5" fontWeight="700" fontFamily="Bricolage Grotesque, sans-serif">SIECI (.JSON)</text>
                <text x="16" y="169" fill="#E2E8F0" fontSize="9.5" fontFamily="Plus Jakarta Sans, sans-serif">Biblioteka Mistrzów</text>
                <text x="16" y="186" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono, monospace">Weights + Arch</text>
                <text x="16" y="201" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono, monospace">Verified Ace 155+</text>
                <text x="16" y="218" fill="#E9D5FF" fontSize="8.5" fontFamily="JetBrains Mono, monospace">Auto-Persist Sync</text>

                {/* Bottom-Right: Research */}
                <rect x="180" y="132" width="154" height="96" rx="10" fill="url(#gEmeraldM)" stroke="#10B981" strokeOpacity="0.65" strokeWidth="1.2" />
                <text x="190" y="152" fill="#6EE7B7" fontSize="11.5" fontWeight="700" fontFamily="Bricolage Grotesque, sans-serif">3. BADANIA</text>
                <text x="190" y="169" fill="#E2E8F0" fontSize="9.5" fontFamily="Plus Jakarta Sans, sans-serif">Siatki Ablacji</text>
                <text x="190" y="186" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono, monospace">WebGPU → F64 Audit</text>
                <text x="190" y="201" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono, monospace">Smart Prune · Colab</text>
                <text x="190" y="218" fill="#A7F3D0" fontSize="8.5" fontFamily="JetBrains Mono, monospace">TDR &lt;800ms Guard</text>

                {/* Arrows into Brains */}
                <line x1="257" y1="110" x2="115" y2="132" stroke="#38BDF8" strokeWidth="1.4" strokeDasharray="3 3" />
                <line x1="180" y1="180" x2="162" y2="180" stroke="#34D399" strokeWidth="1.8" />

                {/* Shared Engine Strip */}
                <rect x="6" y="242" width="328" height="28" rx="6" fill="#0F172A" stroke="#1E293B" />
                <text x="170" y="259" fill="#94A3B8" fontSize="8.5" textAnchor="middle" fontFamily="JetBrains Mono, monospace">
                  SHARED KERNEL: Euler 60 Hz · Mulberry32 · Wind Gusts
                </text>
              </svg>
            </div>

            <div className="hidden sm:block rounded-xl border border-slate-800/90 bg-slate-950/75 p-2 sm:p-3">
              <svg
                viewBox="0 0 920 210"
                className="w-full h-auto"
                role="img"
                aria-label="Flappy NeuroLab architecture pipeline diagram"
              >
                <defs>
                  <linearGradient id="gAmber" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#B45309" stopOpacity="0.08" />
                  </linearGradient>
                  <linearGradient id="gCyan" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#0E7490" stopOpacity="0.08" />
                  </linearGradient>
                  <linearGradient id="gPurple" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#A855F7" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#6B21A8" stopOpacity="0.08" />
                  </linearGradient>
                  <linearGradient id="gEmerald" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#047857" stopOpacity="0.08" />
                  </linearGradient>
                  <marker id="arrowCyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#38BDF8" />
                  </marker>
                  <marker id="arrowAmber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#FBBF24" />
                  </marker>
                </defs>

                {/* Node 1: Play */}
                <rect x="16" y="34" width="195" height="122" rx="14" fill="url(#gAmber)" stroke="#F59E0B" strokeOpacity="0.65" strokeWidth="1.5" />
                <text x="32" y="60" fill="#FCD34D" fontSize="13" fontWeight="700" fontFamily="Bricolage Grotesque, sans-serif">1. GRAJ (PLAY ARCADE)</text>
                <text x="32" y="82" fill="#E2E8F0" fontSize="11" fontFamily="Plus Jakarta Sans, sans-serif">Solo · Pojedynek z Duchem AI</text>
                <text x="32" y="102" fill="#94A3B8" fontSize="10.5" fontFamily="JetBrains Mono, monospace">PKT · Orby ★/◆ · Combo ×N</text>
                <text x="32" y="122" fill="#94A3B8" fontSize="10.5" fontFamily="JetBrains Mono, monospace">Tabela Graczy · Historia</text>
                <rect x="32" y="132" width="102" height="16" rx="4" fill="#F59E0B" fillOpacity="0.18" />
                <text x="40" y="143" fill="#FDE68A" fontSize="9.5" fontFamily="JetBrains Mono, monospace">60 Hz Native FPS</text>

                {/* Node 2: Training Lab */}
                <rect x="252" y="34" width="205" height="122" rx="14" fill="url(#gCyan)" stroke="#06B6D4" strokeOpacity="0.65" strokeWidth="1.5" />
                <text x="268" y="60" fill="#67E8F9" fontSize="13" fontWeight="700" fontFamily="Bricolage Grotesque, sans-serif">2. TRENING AI (LAB)</text>
                <text x="268" y="82" fill="#E2E8F0" fontSize="11" fontFamily="Plus Jakarta Sans, sans-serif">Arena (2–12) lub Single Network</text>
                <text x="268" y="102" fill="#94A3B8" fontSize="10.5" fontFamily="JetBrains Mono, monospace">12 Sensorów Geo | 16-Ray</text>
                <text x="268" y="122" fill="#94A3B8" fontSize="10.5" fontFamily="JetBrains Mono, monospace">Live Mózg Lidera · Wykres</text>
                <rect x="268" y="132" width="128" height="16" rx="4" fill="#06B6D4" fillOpacity="0.18" />
                <text x="275" y="143" fill="#A5F3FC" fontSize="9.5" fontFamily="JetBrains Mono, monospace">Eco (Auto) on Mobile</text>

                {/* Node 3: Brains */}
                <rect x="498" y="34" width="175" height="122" rx="14" fill="url(#gPurple)" stroke="#A855F7" strokeOpacity="0.65" strokeWidth="1.5" />
                <text x="514" y="60" fill="#D8B4FE" fontSize="13" fontWeight="700" fontFamily="Bricolage Grotesque, sans-serif">SIECI (.JSON)</text>
                <text x="514" y="82" fill="#E2E8F0" fontSize="11" fontFamily="Plus Jakarta Sans, sans-serif">Biblioteka Mistrzów</text>
                <text x="514" y="102" fill="#94A3B8" fontSize="10.5" fontFamily="JetBrains Mono, monospace">Exact Weights + Arch</text>
                <text x="514" y="122" fill="#94A3B8" fontSize="10.5" fontFamily="JetBrains Mono, monospace">Verified Ace (155+)</text>
                <rect x="514" y="132" width="108" height="16" rx="4" fill="#A855F7" fillOpacity="0.18" />
                <text x="522" y="143" fill="#E9D5FF" fontSize="9.5" fontFamily="JetBrains Mono, monospace">LocalStorage Sync</text>

                {/* Node 4: Research */}
                <rect x="714" y="34" width="190" height="122" rx="14" fill="url(#gEmerald)" stroke="#10B981" strokeOpacity="0.65" strokeWidth="1.5" />
                <text x="730" y="60" fill="#6EE7B7" fontSize="13" fontWeight="700" fontFamily="Bricolage Grotesque, sans-serif">3. BADANIA (BENCH)</text>
                <text x="730" y="82" fill="#E2E8F0" fontSize="11" fontFamily="Plus Jakarta Sans, sans-serif">Siatki Ablacji &amp; Kolejka</text>
                <text x="730" y="102" fill="#94A3B8" fontSize="10.5" fontFamily="JetBrains Mono, monospace">WebGPU F32 -&gt; CPU F64</text>
                <text x="730" y="122" fill="#94A3B8" fontSize="10.5" fontFamily="JetBrains Mono, monospace">Smart Prune · Colab GPU</text>
                <rect x="730" y="132" width="118" height="16" rx="4" fill="#10B981" fillOpacity="0.18" />
                <text x="738" y="143" fill="#A7F3D0" fontSize="9.5" fontFamily="JetBrains Mono, monospace">TDR &lt;800ms Guard</text>

                {/* Arrows */}
                <line x1="252" y1="80" x2="215" y2="80" stroke="#FBBF24" strokeWidth="2" markerEnd="url(#arrowAmber)" />
                <text x="233" y="72" fill="#FCD34D" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono, monospace">Duel</text>

                <line x1="457" y1="92" x2="494" y2="92" stroke="#38BDF8" strokeWidth="2" markerEnd="url(#arrowCyan)" />
                <line x1="714" y1="92" x2="677" y2="92" stroke="#38BDF8" strokeWidth="2" markerEnd="url(#arrowCyan)" />

                {/* Shared Engine Base Strip */}
                <rect x="16" y="172" width="888" height="26" rx="6" fill="#0F172A" stroke="#1E293B" />
                <text x="460" y="189" fill="#94A3B8" fontSize="10.5" textAnchor="middle" fontFamily="JetBrains Mono, monospace">
                  SHARED KERNEL: Euler 60 Hz Flight Physics · Mulberry32 PRNG · Exact Bit-Identical Collision &amp; Wind Gusts
                </text>
              </svg>
            </div>

            {/* 4 Color-Coded Compact View Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 pt-1">
              <div className="rounded-xl border border-amber-500/35 bg-amber-950/10 p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-amber-300">
                    <Gamepad2 className="w-4 h-4 shrink-0" />
                    1. {bi('Graj Arcade', 'Play Arcade')}
                  </span>
                  <span className="font-mono text-[10px] text-amber-200">Solo + VS AI</span>
                </div>
                <div className="text-xs text-slate-300 leading-snug">
                  <span className="font-mono text-[10px] text-amber-300 mr-1">CO:</span>
                  {bi(
                    'Lot o punkty (★/◆ orby + combo), medale, historia i Tabela Najlepszych Graczy.',
                    'Points flight (★/◆ orbs + combos), medals, history, and Top Players Leaderboard.'
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-cyan-500/35 bg-cyan-950/10 p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-cyan-300">
                    <Brain className="w-4 h-4 shrink-0" />
                    2. {bi('Trening AI', 'Training Lab')}
                  </span>
                  <span className="font-mono text-[10px] text-cyan-200">Arena 2–12</span>
                </div>
                <div className="text-xs text-slate-300 leading-snug">
                  <span className="font-mono text-[10px] text-cyan-300 mr-1">CO:</span>
                  {bi(
                    'Ewolucja stada na żywo z podglądem synaps, wykresem pokoleń i pojedynkiem Areny.',
                    'Live flock evolution with synaptic graph, generation chart, and Multi-Arch Arena.'
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/10 p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-emerald-300">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    3. {bi('Badania', 'Research')}
                  </span>
                  <span className="font-mono text-[10px] text-emerald-200">WebGPU + F64</span>
                </div>
                <div className="text-xs text-slate-300 leading-snug">
                  <span className="font-mono text-[10px] text-emerald-300 mr-1">CO:</span>
                  {bi(
                    'Siatki eksperymentów (19 presetów + kolejka), audyt 5-seed Float64 i eksport Colab.',
                    'Ablation sweeps (19 presets + queue), 5-seed Float64 proofs, and Colab export.'
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-purple-500/35 bg-purple-950/10 p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-purple-300">
                    <Archive className="w-4 h-4 shrink-0" />
                    4. {bi('Sieci & Zapis', 'Brains & Save')}
                  </span>
                  <span className="font-mono text-[10px] text-purple-200">Auto-Persist</span>
                </div>
                <div className="text-xs text-slate-300 leading-snug">
                  <span className="font-mono text-[10px] text-purple-300 mr-1">CO:</span>
                  {bi(
                    'Przycisk "Sieci" zapisuje liderów (.json), a postęp gry i badań wznawia się sam.',
                    '"Brains" saves/imports .json champions while play & research autosave automatically.'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Timeline + Keycaps + Arcade Points Visual Formula */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0B1120] p-4 sm:p-5 space-y-3">
              <h3 className="font-display text-sm sm:text-base font-bold text-white">
                {bi('Punktacja Arcade i Obieg 3 Kroków', 'Arcade Scoring Formula & 3-Step Flow')}
              </h3>

              {/* Scoring Formula Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-3 py-2">
                  <div className="text-[10px] text-emerald-300">{bi('Rura', 'Pipe Clear')}</div>
                  <div className="text-sm font-bold text-white">+100 × Tor</div>
                </div>
                <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2">
                  <div className="text-[10px] text-amber-300">Combo ×N</div>
                  <div className="text-sm font-bold text-white">+35..280p</div>
                </div>
                <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 px-3 py-2">
                  <div className="text-[10px] text-cyan-300">{bi('Orby w locie', 'Mid-Air Orbs')}</div>
                  <div className="text-sm font-bold text-white">★ +75 | ◆ +150</div>
                </div>
                <div className="rounded-lg border border-purple-500/30 bg-purple-950/20 px-3 py-2">
                  <div className="text-[10px] text-purple-300">{bi('Tabela & Nick', 'Leaderboard')}</div>
                  <div className="text-sm font-bold text-white flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-300" />
                    Auto-Log
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-1">
                  <div className="font-mono font-bold text-amber-300">
                    01 · {bi('Wpisz Nick & Leć', 'Set Nick & Fly')}
                  </div>
                  <p className="text-slate-300 leading-snug">
                    {bi(
                      'Zbieraj orby i trafiaj środkiem rur, by wbijać mnożnik ×N w Tabeli Graczy.',
                      'Collect orbs and thread gap centers to build ×N streaks on the Leaderboard.'
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-1">
                  <div className="font-mono font-bold text-cyan-300">
                    02 · {bi('Odpal Arenę AI', 'Launch AI Arena')}
                  </div>
                  <p className="text-slate-300 leading-snug">
                    {bi(
                      'W Treningu AI obserwuj wyścig do 12 gatunków lub testuj własną sieć 60 FPS.',
                      'Watch up to 12 species evolve concurrently on identical wind & pipes.'
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-1">
                  <div className="font-mono font-bold text-emerald-300">
                    03 · {bi('Pojedynek z Liderem', 'Duel Your Champion')}
                  </div>
                  <p className="text-slate-300 leading-snug">
                    {bi(
                      'Kliknij "Ścigaj się z AI", aby zmierzyć się ze swoją siecią w trybie VS AI.',
                      'Hit "Race AI" to pit your human reflexes directly against your best brain.'
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-4 sm:p-5 space-y-2.5">
              <h3 className="font-display text-sm sm:text-base font-bold text-white">
                {bi('Klawiatura & Dotyk', 'Keycaps & Touch')}
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-900/80 px-3 py-2 border border-slate-800">
                  <span className="text-slate-300">{bi('Skok', 'Flap')}</span>
                  <div className="flex items-center gap-1 font-mono text-[10.5px]">
                    <kbd className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-amber-200">Space</kbd>
                    <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-slate-200">↑</kbd>
                    <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-slate-200">W</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-900/80 px-3 py-2 border border-slate-800">
                  <span className="text-slate-300">{bi('Pauza', 'Pause')}</span>
                  <div className="flex items-center gap-1 font-mono text-[10.5px]">
                    <kbd className="rounded border border-cyan-500/40 bg-cyan-500/10 px-1.5 py-0.5 text-cyan-200">P</kbd>
                    <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-slate-200">Esc</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-900/80 px-3 py-2 border border-slate-800">
                  <span className="text-slate-300">{bi('Nowy lot', 'Restart')}</span>
                  <kbd className="rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10.5px] text-emerald-200">R</kbd>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-900/80 px-3 py-2 border border-slate-800">
                  <span className="text-slate-300">{bi('Smartfon', 'Mobile')}</span>
                  <span className="font-mono text-[11px] text-amber-300">SKOK (FLAP) · Eco Auto</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: VISUAL SENSOR & RETINA SCHEMATICS + VIEW GUIDES */}
      {activeSection === 'VIEWS_CONTROLS' && (
        <div className="space-y-4">
          {/* Dual SVG Visual Perception Schematics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Schematic 1: Geometric Lab Sensors */}
            <div className="rounded-xl border border-cyan-500/35 bg-[#0B1120] p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-sm sm:text-base font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 shrink-0" />
                  <span>{bi('Tryb A: Sensory Geometryczne (1–12)', 'Mode A: Geometric Sensors (1–12)')}</span>
                </h2>
                <span className="font-mono text-[10px] text-slate-400">Exact Kinematics</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#070E1D] p-2">
                <svg viewBox="0 0 440 190" className="w-full h-auto" role="img" aria-label="Geometric sensor vectors diagram">
                  {/* Sky Grid */}
                  <line x1="0" y1="95" x2="440" y2="95" stroke="#1E293B" strokeDasharray="3 4" />
                  {/* Pipe 1 */}
                  <rect x="210" y="0" width="42" height="58" fill="#059669" fillOpacity="0.45" stroke="#34D399" />
                  <rect x="210" y="132" width="42" height="58" fill="#059669" fillOpacity="0.45" stroke="#34D399" />
                  {/* Pipe 2 */}
                  <rect x="360" y="0" width="42" height="36" fill="#0284C7" fillOpacity="0.35" stroke="#38BDF8" />
                  <rect x="360" y="114" width="42" height="76" fill="#0284C7" fillOpacity="0.35" stroke="#38BDF8" />

                  {/* Bird */}
                  <circle cx="88" cy="95" r="12" fill="#F59E0B" stroke="#FEF3C7" strokeWidth="1.8" />
                  <circle cx="93" cy="91" r="2.5" fill="#0B1120" />

                  {/* Y Altitude */}
                  <line x1="48" y1="12" x2="48" y2="178" stroke="#A78BFA" strokeDasharray="3 3" />
                  <line x1="48" y1="95" x2="74" y2="95" stroke="#A78BFA" strokeWidth="1.6" />
                  <text x="36" y="99" fill="#C4B5FD" fontSize="10" fontWeight="700" fontFamily="JetBrains Mono, monospace">Y</text>

                  {/* Vy Arrow */}
                  <line x1="88" y1="81" x2="88" y2="48" stroke="#34D399" strokeWidth="2" />
                  <polygon points="88,43 84,51 92,51" fill="#34D399" />
                  <text x="72" y="56" fill="#6EE7B7" fontSize="10" fontWeight="700" fontFamily="JetBrains Mono, monospace">Vy</text>

                  {/* DX Ray */}
                  <line x1="100" y1="95" x2="252" y2="95" stroke="#38BDF8" strokeDasharray="5 3" strokeWidth="1.5" />
                  <text x="160" y="89" fill="#7DD3FC" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">DX · TTF</text>

                  {/* Top & Bot Clear */}
                  <line x1="96" y1="89" x2="210" y2="58" stroke="#10B981" strokeDasharray="4 3" strokeWidth="1.5" />
                  <text x="195" y="52" fill="#6EE7B7" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">Top</text>

                  <line x1="96" y1="101" x2="210" y2="132" stroke="#22D3EE" strokeDasharray="4 3" strokeWidth="1.5" />
                  <text x="195" y="145" fill="#67E8F9" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">Bot</text>

                  {/* PVy & N2Y */}
                  <circle cx="231" cy="95" r="3" fill="#F472B6" />
                  <line x1="231" y1="95" x2="231" y2="68" stroke="#F472B6" strokeWidth="1.8" />
                  <text x="238" y="72" fill="#F9A8D4" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">PVy</text>

                  <line x1="231" y1="95" x2="381" y2="75" stroke="#FACC15" strokeDasharray="4 3" strokeWidth="1.4" />
                  <circle cx="381" cy="75" r="3.5" fill="#FDE047" />
                  <text x="306" y="76" fill="#FDE047" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">N2Y</text>
                </svg>
              </div>
              <p className="font-mono text-[11px] text-slate-400">
                {bi(
                  'Blokady spójności: wymagane min. Top/Bot · PVy/N2PVy wyłączone na statycznych rurach.',
                  'Invariants: min Top/Bot clearance · PVy/N2PVy auto-disabled on static tracks.'
                )}
              </p>
            </div>

            {/* Schematic 2: 16-Ray Compound Retina */}
            <div className="rounded-xl border border-emerald-500/35 bg-[#0B1120] p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-sm sm:text-base font-bold text-emerald-300 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 shrink-0" />
                  <span>{bi('Tryb B: Siatkówka 16-Ray (Ommatidia)', 'Mode B: 16-Ray Compound Retina')}</span>
                </h2>
                <span className="font-mono text-[10px] text-slate-400">-68°..+68° Optical Fan</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#070E1D] p-2">
                <svg viewBox="0 0 440 190" className="w-full h-auto" role="img" aria-label="16-Ray compound eye optical fan diagram">
                  {/* Pipe Obstacle */}
                  <rect x="265" y="0" width="44" height="58" fill="#10B981" fillOpacity="0.3" stroke="#34D399" />
                  <rect x="265" y="132" width="44" height="58" fill="#10B981" fillOpacity="0.3" stroke="#34D399" />

                  {/* Fan Rays */}
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

                  {/* Bird + Optic Lobe Block */}
                  <circle cx="82" cy="95" r="12" fill="#22D3EE" stroke="#ECFEFF" strokeWidth="1.6" />
                  <rect x="330" y="24" width="96" height="142" rx="10" fill="#0F172A" stroke="#10B981" strokeOpacity="0.5" />
                  <text x="378" y="48" fill="#6EE7B7" fontSize="10.5" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono, monospace">OPTIC LOBE</text>
                  <rect x="342" y="60" width="72" height="24" rx="5" fill="#064E3B" />
                  <text x="378" y="76" fill="#A7F3D0" fontSize="9.5" textAnchor="middle" fontFamily="JetBrains Mono, monospace">L1/L2 ΔI Contrast</text>
                  <rect x="342" y="94" width="72" height="24" rx="5" fill="#164E63" />
                  <text x="378" y="110" fill="#A5F3FC" fontSize="9.5" textAnchor="middle" fontFamily="JetBrains Mono, monospace">T4/T5 Motion</text>
                  <rect x="342" y="128" width="72" height="24" rx="5" fill="#3B0764" />
                  <text x="378" y="144" fill="#E9D5FF" fontSize="9.5" textAnchor="middle" fontFamily="JetBrains Mono, monospace">5–12ch Feature</text>
                </svg>
              </div>
              <p className="font-mono text-[11px] text-slate-400">
                {bi(
                  'Sieć nie dostaje dokładnych pikseli X/Y rury — uczy się z różnic luminancji i szumu 0–25%.',
                  'Network receives optical contrast & motion deltas with tunable 0–25% fog noise instead of exact coords.'
                )}
              </p>
            </div>
          </div>

          {/* Play vs Training Controls Visual Cheat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-amber-500/30 bg-[#0B1120] p-4 space-y-2.5">
              <h3 className="font-display text-sm font-bold text-amber-300">
                {bi('Panel Graj · Kluczowe Ustawienia', 'Play View · Key Mechanics')}
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5">
                  <div className="font-mono text-[11px] font-bold text-amber-200">Solo / VS AI</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{bi('Lot samemu lub obok ducha sieci', 'Solo flight or vs AI ghost')}</div>
                </div>
                <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5">
                  <div className="font-mono text-[11px] font-bold text-emerald-300">Orby ★/◆ &amp; Combo</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{bi('Punkty za środek szczeliny i orby', 'Bonus points for center pass & orbs')}</div>
                </div>
                <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5">
                  <div className="font-mono text-[11px] font-bold text-cyan-300">{bi('Tabela & Historia', 'Leaderboard')}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{bi('Nick gracza, ranking PKT i rur', 'Nick profile, top scores & run log')}</div>
                </div>
                <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5">
                  <div className="font-mono text-[11px] font-bold text-rose-300">Overdrive 100–145%</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{bi('Ekstremalna fizyka na Extra Insane', 'Extreme slider on Extra Insane')}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-cyan-500/30 bg-[#0B1120] p-4 space-y-2.5">
              <h3 className="font-display text-sm font-bold text-cyan-300">
                {bi('Panel Trening AI · Tryby Pracy', 'Training Lab · Key Modes')}
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5">
                  <div className="font-mono text-[11px] font-bold text-emerald-300">Arena vs Single</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{bi('12 wysp gatunkowych lub 1 pełna sieć', '12 species islands or 1 focused flock')}</div>
                </div>
                <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5">
                  <div className="font-mono text-[11px] font-bold text-amber-300">{bi('Samorozrost', 'Auto-Grow')}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{bi('Start 50% wag i dokładanie neuronów', 'Grows hidden width on stagnation')}</div>
                </div>
                <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5">
                  <div className="font-mono text-[11px] font-bold text-purple-300">Shaped + Curriculum</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{bi('Premia osi + łagodny start pokoleń', 'Centering reward + gentle ramp')}</div>
                </div>
                <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5">
                  <div className="font-mono text-[11px] font-bold text-cyan-300">Eco (Auto) + 1x..MAX</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{bi('Płynność smartfona + krok 1/60s', 'Phone throttle guard + single-tick step')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 12 Sensors Visual Reference Grid */}
          <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-sm sm:text-base font-bold text-white">
                {bi('Wszystkie 12 Wejść Sieci (Geo ↔ 16-Ray)', 'All 12 Sensor Channels (Geo ↔ 16-Ray)')}
              </h3>
              <span className="font-mono text-[11px] text-cyan-300">
                5 Core · 2 Velocity/Gap · 4 Lookahead #2 · 1 Timing
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {ALL_SENSOR_FEATURES.map((sId) => {
                const meta = SENSOR_METADATA[sId];
                const isPipe2 = meta.group === 'PIPE_2' || sId === 'PIPE_TTF';
                return (
                  <div
                    key={sId}
                    className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1.5 font-mono">
                      <span className={`text-xs font-bold ${isPipe2 ? 'text-amber-300' : 'text-cyan-300'}`}>
                        {meta.shortLabel}
                      </span>
                      <span className="text-[10px] text-emerald-300">
                        {meta.opticalShortLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      {meta.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: 12 ARCHITECTURES & MOE VS ISLANDS DIAGRAMS */}
      {activeSection === 'ARCHITECTURES_MOE' && (
        <div className="space-y-4">
          {/* Dual SVG Schematics: Hybrid MoE vs Arena Speciation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-amber-500/35 bg-[#0B1120] p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-sm sm:text-base font-bold text-amber-300 flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 shrink-0" />
                  <span>HYBRID_MOE · {bi('Auto-Router w 1 Mózgu', 'Single-Bird Auto-Router')}</span>
                </h3>
                <span className="font-mono text-[10px] text-amber-200">ROI ≥ 2% Gate</span>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#070E1D] p-2">
                <svg viewBox="0 0 430 148" className="w-full h-auto" role="img" aria-label="Hybrid MoE Router Diagram">
                  <rect x="8" y="54" width="54" height="40" rx="8" fill="#0F172A" stroke="#38BDF8" />
                  <text x="35" y="78" fill="#7DD3FC" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono, monospace">Input x</text>

                  <rect x="84" y="44" width="76" height="60" rx="8" fill="#451A03" stroke="#F59E0B" />
                  <text x="122" y="70" fill="#FDE68A" fontSize="10.5" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono, monospace">Softmax</text>
                  <text x="122" y="86" fill="#FCD34D" fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono, monospace">Router α</text>

                  <line x1="62" y1="74" x2="84" y2="74" stroke="#38BDF8" strokeWidth="1.8" />

                  {/* 4 Expert Blocks */}
                  {[
                    { y: 8, label: 'MLP Reflex', c: '#38BDF8' },
                    { y: 42, label: 'LTC ODE τ', c: '#34D399' },
                    { y: 76, label: 'MinGRU SSM', c: '#F472B6' },
                    { y: 110, label: 'Ponder ACT', c: '#A855F7' },
                  ].map((ex, i) => (
                    <g key={ex.label}>
                      <line x1="160" y1="74" x2="198" y2={ex.y + 13} stroke={ex.c} strokeWidth="1.4" strokeOpacity="0.8" />
                      <rect x="198" y={ex.y} width="106" height="26" rx="6" fill="#0F172A" stroke={ex.c} />
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
              <p className="font-mono text-[11px] text-slate-400">
                {bi(
                  'Startuje jako lekki MLP; testuje ekspertów przez 10 pokoleń i odrzuca przy zysku <2%/FLOP.',
                  'Starts as MLP; trials specialists for 10 gens and rolls back if gain/FLOP < 2%.'
                )}
              </p>
            </div>

            <div className="rounded-xl border border-cyan-500/35 bg-[#0B1120] p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-sm sm:text-base font-bold text-cyan-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>Arena Live · {bi('Wyspy Gatunkowe', 'Island Speciation')}</span>
                </h3>
                <span className="font-mono text-[10px] text-cyan-200">2–12 Species Parallel</span>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#070E1D] p-2">
                <svg viewBox="0 0 430 148" className="w-full h-auto" role="img" aria-label="Arena Live Island Speciation Diagram">
                  {[
                    { y: 12, name: 'Island #1 · Hybrid MoE', opt: 'CMA-ES', c: '#F59E0B', pct: 86 },
                    { y: 46, name: 'Island #2 · Drosophila', opt: 'CMA-ES', c: '#10B981', pct: 74 },
                    { y: 80, name: 'Island #3 · Fly-Cortex', opt: 'Diff Evol', c: '#A855F7', pct: 66 },
                    { y: 114, name: 'Island #4..12 · SSM/ACT', opt: 'GA / ES', c: '#38BDF8', pct: 52 },
                  ].map((isl) => (
                    <g key={isl.name}>
                      <rect x="10" y={isl.y} width="268" height="24" rx="6" fill="#0F172A" stroke={isl.c} strokeOpacity="0.65" />
                      <text x="20" y={isl.y + 15.5} fill="#E2E8F0" fontSize="10" fontWeight="700" fontFamily="JetBrains Mono, monospace">
                        {isl.name}
                      </text>
                      <text x="268" y={isl.y + 15.5} fill={isl.c} fontSize="9.5" textAnchor="end" fontFamily="JetBrains Mono, monospace">
                        {isl.opt}
                      </text>
                      <line x1="278" y1={isl.y + 12} x2="316" y2="74" stroke={isl.c} strokeWidth="1.4" strokeOpacity="0.7" />
                    </g>
                  ))}

                  <rect x="316" y="42" width="104" height="64" rx="10" fill="#0F172A" stroke="#22D3EE" />
                  <text x="368" y="66" fill="#67E8F9" fontSize="10.5" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono, monospace">SHARED SEED</text>
                  <text x="368" y="82" fill="#E2E8F0" fontSize="9.5" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">Identyczne rury</text>
                  <text x="368" y="96" fill="#94A3B8" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono, monospace">Klik = Podgląd</text>
                </svg>
              </div>
              <p className="font-mono text-[11px] text-slate-400">
                {bi(
                  'Każda wyspa ewoluuje własnym optymalizatorem na identycznym ziarnie rur. Klik w wiersz = podgląd Mózgu.',
                  'Each island runs its isolated optimizer on shared seeded courses. Click any row to inspect.'
                )}
              </p>
            </div>
          </div>

          {/* 7 Tier-1 Primary Architectures with Color Accents & Visual FLOPs Meters */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{bi('7 Głównych Architektur Badawczych (Tier 1)', '7 Primary Architectures (Tier 1)')}</span>
              </h3>
              <span className="font-mono text-[11px] text-slate-400">
                ◆ WebGPU Lockstep vs ◇ CPU Specialized
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {TIER_1_ARCHITECTURES.map((arch) => {
                const info = ARCHITECTURE_CATALOG[arch];
                const flopsBarPct = Math.min(100, Math.round((info.flopsMultiplier / 2.6) * 100));
                return (
                  <div
                    key={arch}
                    className="rounded-xl border border-slate-800 bg-[#0B1120] overflow-hidden flex flex-col justify-between"
                  >
                    <div className="h-1 w-full" style={{ backgroundColor: info.colorHex }} />
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display font-bold text-sm text-white truncate">
                            {info.label}
                          </span>
                          <span className="font-mono text-[10px] text-slate-300 shrink-0">
                            {info.categoryBadge}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-snug">
                          {info.howItWorksPl}
                        </p>

                        <div className="font-mono text-[10.5px] text-cyan-300 bg-slate-950/90 px-2.5 py-1.5 rounded-md border border-slate-800 truncate">
                          {info.keyFormula}
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-800/80 text-[11px]">
                        <div className="text-emerald-300/95 leading-snug">
                          <span className="font-mono text-[10px] text-emerald-400 mr-1">WERDYKT:</span>
                          {info.empiricalVerdictPl}
                        </div>

                        {/* Visual FLOPs Cost Meter */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
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
                          <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
                            <div
                              className="h-full rounded-full"
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
          <div className="space-y-2 pt-1">
            <h3 className="font-display text-sm font-bold text-slate-300 flex items-center gap-2">
              <Archive className="w-4 h-4 text-slate-400" />
              <span>{bi('5 Architektur Pomocniczych / Legacy (Tier 2)', '5 Auxiliary / Legacy (Tier 2)')}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {TIER_2_LEGACY_ARCHITECTURES.map((arch) => {
                const info = ARCHITECTURE_CATALOG[arch];
                return (
                  <div
                    key={arch}
                    className="rounded-lg border border-slate-800/80 bg-slate-950/70 p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-1 font-mono">
                      <span className="font-display font-bold text-xs text-slate-100">
                        {info.shortLabel}
                      </span>
                      <span className="text-[10px] text-amber-300">{info.flopsMultiplier}×</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{info.summaryPl}</p>
                    <p className="font-mono text-[10px] text-amber-300/85 pt-1 border-t border-slate-800/70">
                      {info.empiricalVerdictPl}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: OPTIMIZERS, QUANTIZATION SPECTRUM & AUDIT PIPELINE */}
      {activeSection === 'OPTIMIZERS_RESEARCH' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 8 Optimizers with Speed/Exploration Bars */}
            <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>{bi('8 Optymalizatorów Bezgradientowych', '8 Gradient-Free Optimizers')}</span>
                </h3>
                <span className="font-mono text-[10px] text-slate-400">
                  Zero Backprop · Closed Physics Loop
                </span>
              </div>

              <div className="space-y-2">
                {Object.values(OPTIMIZER_CATALOG).map((opt) => {
                  const prof = OPTIMIZER_PROFILE[opt.id];
                  return (
                    <div
                      key={opt.id}
                      className="rounded-lg border border-slate-800 bg-slate-900/65 p-3 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-display font-bold text-xs text-cyan-300">
                          {opt.label}
                        </span>
                        <div className="flex items-center gap-2 font-mono text-[10px]">
                          <span className={prof.usesMutRate ? 'text-amber-300' : 'text-slate-500'}>
                            {prof.usesMutRate ? '✓ Mut. Rate' : '— Covariance/DE'}
                          </span>
                          <span className="text-emerald-300">{opt.bestForPl}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">{opt.summaryPl}</p>
                      <div className="grid grid-cols-2 gap-3 pt-0.5 font-mono text-[10px] text-slate-400">
                        <div>
                          <div className="flex justify-between">
                            <span>{bi('Szybkość G1', 'G1 Speed')}</span>
                            <span className="text-cyan-300">{prof.speedPct}%</span>
                          </div>
                          <div className="mt-0.5 h-1.5 rounded-full bg-slate-950 overflow-hidden">
                            <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${prof.speedPct}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between">
                            <span>{bi('Eksploracja', 'Explore')}</span>
                            <span className="text-emerald-300">{prof.explorePct}%</span>
                          </div>
                          <div className="mt-0.5 h-1.5 rounded-full bg-slate-950 overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${prof.explorePct}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              {/* Weight Quantization Spectrum */}
              <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    <span>{bi('Spektrum Kwantyzacji Wag', 'Weight Precision Spectrum')}</span>
                  </h3>
                  <span className="font-mono text-[10px] text-amber-300">32-bit → 1-bit Edge</span>
                </div>

                {/* Bit-Width Spectrum Bar */}
                <div className="h-2.5 w-full rounded-full overflow-hidden flex border border-slate-800">
                  <div className="bg-cyan-400 w-[24%]" title="FP32" />
                  <div className="bg-sky-400 w-[20%]" title="FP16" />
                  <div className="bg-emerald-400 w-[18%]" title="INT8" />
                  <div className="bg-amber-400 w-[16%]" title="INT4" />
                  <div className="bg-orange-400 w-[12%]" title="TERNARY" />
                  <div className="bg-rose-400 w-[10%]" title="BINARY" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.values(PRECISION_CATALOG).map((prec) => (
                    <div
                      key={prec.id}
                      className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5 space-y-1"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-xs text-slate-100">{prec.label}</span>
                        <span className="text-[10.5px] font-bold text-amber-300">
                          {prec.bitsPerWeight} b/w
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{prec.summaryPl}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Research F32 -> F64 Audit Pipeline Diagram */}
              <div className="rounded-xl border border-emerald-500/35 bg-[#0B1120] p-4 sm:p-5 space-y-3">
                <h3 className="font-display text-base font-bold text-emerald-300">
                  {bi('Potok Badań: WebGPU F32 → Audyt CPU Float64', 'Research Pipeline: WebGPU → Float64 Audit')}
                </h3>
                <div className="rounded-lg border border-slate-800 bg-[#070E1D] p-2">
                  <svg viewBox="0 0 460 116" className="w-full h-auto" role="img" aria-label="Research WebGPU to F64 Audit pipeline">
                    <rect x="8" y="18" width="98" height="74" rx="8" fill="#0F172A" stroke="#38BDF8" />
                    <text x="57" y="42" fill="#7DD3FC" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono, monospace">Smart Prune</text>
                    <text x="57" y="60" fill="#CBD5E1" fontSize="9.5" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">Pomija ~65%</text>
                    <text x="57" y="75" fill="#94A3B8" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono, monospace">duplikatów</text>

                    <line x1="106" y1="55" x2="122" y2="55" stroke="#10B981" strokeWidth="1.8" />

                    <rect x="122" y="18" width="106" height="74" rx="8" fill="#0F172A" stroke="#10B981" />
                    <text x="175" y="42" fill="#6EE7B7" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono, monospace">WebGPU F32</text>
                    <text x="175" y="60" fill="#CBD5E1" fontSize="9.5" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">8-Tier WGSL</text>
                    <text x="175" y="75" fill="#94A3B8" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono, monospace">&lt;800ms TDR</text>

                    <line x1="228" y1="55" x2="244" y2="55" stroke="#FBBF24" strokeWidth="1.8" />

                    <rect x="244" y="18" width="96" height="74" rx="8" fill="#451A03" stroke="#F59E0B" />
                    <text x="292" y="42" fill="#FDE68A" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono, monospace">Milestone</text>
                    <text x="292" y="60" fill="#FCD34D" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono, monospace">≥25 rur</text>
                    <text x="292" y="75" fill="#FDE68A" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono, monospace">Smart Gate</text>

                    <line x1="340" y1="55" x2="356" y2="55" stroke="#A855F7" strokeWidth="1.8" />

                    <rect x="356" y="18" width="96" height="74" rx="8" fill="#3B0764" stroke="#A855F7" />
                    <text x="404" y="42" fill="#E9D5FF" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono, monospace">CPU Float64</text>
                    <text x="404" y="60" fill="#D8B4FE" fontSize="9.5" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">5-Seed Proof</text>
                    <text x="404" y="75" fill="#C4B5FD" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono, monospace">Colab / JSONL</text>
                  </svg>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-300">
                  <div className="rounded bg-slate-900/75 px-2.5 py-1.5 border border-slate-800">
                    19 Presetów + Kolejka
                  </div>
                  <div className="rounded bg-slate-900/75 px-2.5 py-1.5 border border-slate-800">
                    GPU Load 10%–100%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Empirical Conclusions Visual KPI Cards */}
          <div className="rounded-xl border border-cyan-900/40 bg-gradient-to-br from-[#0B1120] via-slate-900/90 to-[#0F172A] p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                <Archive className="w-4 h-4 text-cyan-400" />
                <span>Empirical Conclusions (84,062 Historical Trials)</span>
              </h3>
              <span className="font-mono text-[11px] text-cyan-300">n = 84,062</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg bg-slate-950/65 border border-amber-500/25 p-3 space-y-1">
                <div className="font-mono font-bold text-amber-300">01 · PVy + N2Y</div>
                <p className="text-slate-400 text-[11px] leading-snug">
                  {bi(
                    'Odblokowują przelot przez ruchome rury na torze Insane.',
                    'Unlock moving-pipe tracking and next-gap trajectories on Insane.'
                  )}
                </p>
              </div>
              <div className="rounded-lg bg-slate-950/65 border border-cyan-500/25 p-3 space-y-1">
                <div className="font-mono font-bold text-cyan-300">02 · 1-in vs 4-in</div>
                <p className="text-slate-400 text-[11px] leading-snug">
                  {bi(
                    'Na Easy wystarczy 1 wejście (98.1%), Insane wymaga min. 4–6.',
                    'Easy reaches 98.1% with 1 sensor; Insane demands 4–6 sensors.'
                  )}
                </p>
              </div>
              <div className="rounded-lg bg-slate-950/65 border border-emerald-500/25 p-3 space-y-1">
                <div className="font-mono font-bold text-emerald-300">03 · F32 → F64</div>
                <p className="text-slate-400 text-[11px] leading-snug">
                  {bi(
                    'GPU szuka szybko, a CPU Float64 dowodzi odporności na 5 ziarnach.',
                    'GPU searches rapidly; CPU Float64 certifies unseen-seed robustness.'
                  )}
                </p>
              </div>
              <div className="rounded-lg bg-slate-950/65 border border-purple-500/25 p-3 space-y-1">
                <div className="font-mono font-bold text-purple-300">04 · Obwód &gt; Alg.</div>
                <p className="text-slate-400 text-[11px] leading-snug">
                  {bi(
                    'Drosophila wygrywała (29–32%) niezależnie od optymalizatora.',
                    'Drosophila scored 29–32% across CMA-ES, GA, and ES while MLP hit 0%.'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: FLY-CORTEX SVG CIRCUIT & BALLISTIC PROOFS WITH GAUGE BARS */}
      {activeSection === 'VISION_PROOFS' && (
        <div className="space-y-4">
          {/* 3-Layer Fly-Cortex Circuit Diagram */}
          <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400 shrink-0" />
                <span>
                  {bi(
                    'Fly-Cortex: Rozdzielenie Rozumowania od Wiedzy (Prototyp LLM)',
                    'Fly-Cortex: Decoupling Reasoning from Frozen Knowledge'
                  )}
                </span>
              </h2>
              <span className="font-mono text-[11px] text-purple-300">
                30–60 Plastic Weights
              </span>
            </div>

            <div className="sm:hidden rounded-xl border border-slate-800 bg-[#070E1D] p-2.5 space-y-2 text-xs">
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

            <div className="hidden sm:block rounded-xl border border-slate-800 bg-[#070E1D] p-2 sm:p-3">
              <svg viewBox="0 0 880 156" className="w-full h-auto" role="img" aria-label="Fly-Cortex 3-Layer Connectome Circuit">
                {/* Layer 1 */}
                <rect x="14" y="20" width="230" height="84" rx="12" fill="#064E3B" fillOpacity="0.45" stroke="#10B981" strokeWidth="1.5" />
                <text x="30" y="45" fill="#6EE7B7" fontSize="12" fontWeight="700" fontFamily="Bricolage Grotesque, sans-serif">1. T4/T5 LTC Perception</text>
                <text x="30" y="65" fill="#CBD5E1" fontSize="10.5" fontFamily="Plus Jakarta Sans, sans-serif">Ciekła stała czasowa τ(x)</text>
                <text x="30" y="85" fill="#A7F3D0" fontSize="10" fontFamily="JetBrains Mono, monospace">16-Ray ΔI + Edge Motion</text>

                {/* Giant Fiber Bypass */}
                <path d="M 129 104 L 129 138 L 745 138 L 745 106" fill="none" stroke="#EF4444" strokeWidth="1.8" strokeDasharray="5 4" />
                <rect x="330" y="126" width="230" height="22" rx="6" fill="#450A0A" stroke="#EF4444" />
                <text x="445" y="140.5" fill="#FCA5A5" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono, monospace">
                  GIANT FIBER ESCAPE BYPASS (&lt;1 tick)
                </text>

                <line x1="244" y1="62" x2="296" y2="62" stroke="#34D399" strokeWidth="2" />

                {/* Layer 2 */}
                <rect x="296" y="20" width="268" height="84" rx="12" fill="#3B0764" fillOpacity="0.55" stroke="#A855F7" strokeWidth="1.5" />
                <text x="312" y="45" fill="#E9D5FF" fontSize="12" fontWeight="700" fontFamily="Bricolage Grotesque, sans-serif">2. Frozen FlyHash APL Index</text>
                <text x="312" y="65" fill="#CBD5E1" fontSize="10.5" fontFamily="Plus Jakarta Sans, sans-serif">Zamrożony indeks pojęć (0-backprop)</text>
                <text x="312" y="85" fill="#D8B4FE" fontSize="10" fontFamily="JetBrains Mono, monospace">16-Slot Sparse Top-25% k-WTA</text>

                <line x1="564" y1="62" x2="616" y2="62" stroke="#A855F7" strokeWidth="2" />

                {/* Layer 3 */}
                <rect x="616" y="20" width="250" height="84" rx="12" fill="#451A03" fillOpacity="0.55" stroke="#F59E0B" strokeWidth="1.5" />
                <text x="632" y="45" fill="#FDE68A" fontSize="12" fontWeight="700" fontFamily="Bricolage Grotesque, sans-serif">3. Plastic Executive + DA</text>
                <text x="632" y="65" fill="#CBD5E1" fontSize="10.5" fontFamily="Plus Jakarta Sans, sans-serif">Rozumowanie i plastyczność online</text>
                <text x="632" y="85" fill="#FCD34D" fontSize="10" fontFamily="JetBrains Mono, monospace">Δw = η · DA(t) · pre · post</text>
              </svg>
            </div>
          </div>

          {/* Mathematical Solvability Proofs Table + Visual Slack Bars */}
          <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-400 shrink-0" />
                <span>
                  {bi(
                    'Dowody Balistyczne (Easy..Insane) vs Overdrive',
                    'Ballistic Solvability Proofs vs Overdrive'
                  )}
                </span>
              </h2>
              <span className="font-mono text-[11px] text-slate-400">
                verifyScenarioSolvability(env)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="py-2 px-2.5">{bi('Scenariusz', 'Scenario')}</th>
                    <th className="py-2 px-2.5">{bi('Szczelina', 'Gap')}</th>
                    <th className="py-2 px-2.5">{bi('Prędkość', 'Speed')}</th>
                    <th className="py-2 px-2.5">dt</th>
                    <th className="py-2 px-2.5">{bi('Margines Wznoszenia', 'Climb Slack')}</th>
                    <th className="py-2 px-2.5">{bi('Margines Nurkowania', 'Dive Slack')}</th>
                    <th className="py-2 px-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                  {scenarioProofRows.map((row) => {
                    const p = row.proof;
                    const climbPct = Math.min(100, Math.max(8, Math.round((Math.abs(p.climbSlackPx) / 220) * 100)));
                    const divePct = Math.min(100, Math.max(8, Math.round((Math.abs(p.diveSlackPx) / 220) * 100)));
                    return (
                      <tr
                        key={row.id}
                        className={row.isOverdrive ? 'bg-rose-950/15' : 'hover:bg-slate-900/45'}
                      >
                        <td className="py-2.5 px-2.5 font-sans">
                          <div className="font-bold text-slate-100">{row.title}</div>
                          <div className="text-[10px] text-slate-400">{row.subtitle}</div>
                        </td>
                        <td className="py-2.5 px-2.5 text-slate-300">
                          {row.env.gap}px <span className="text-slate-500">({p.minGapPx})</span>
                        </td>
                        <td className="py-2.5 px-2.5 text-slate-300">
                          {row.env.pipeSpeed} ±{Math.round(row.env.speedVariability * 100)}%
                        </td>
                        <td className="py-2.5 px-2.5 text-cyan-300">{p.dtMinFrames}f</td>
                        <td className="py-2.5 px-2.5 min-w-[115px]">
                          <div className={`font-bold ${p.climbSlackPx >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {p.climbSlackPx >= 0 ? '+' : ''}
                            {Math.round(p.climbSlackPx)}px
                          </div>
                          <div className="mt-1 h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${p.climbSlackPx >= 0 ? 'bg-emerald-400' : 'bg-rose-500'}`}
                              style={{ width: `${climbPct}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-2.5 min-w-[115px]">
                          <div className={`font-bold ${p.diveSlackPx >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {p.diveSlackPx >= 0 ? '+' : ''}
                            {Math.round(p.diveSlackPx)}px
                          </div>
                          <div className="mt-1 h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${p.diveSlackPx >= 0 ? 'bg-emerald-400' : 'bg-rose-500'}`}
                              style={{ width: `${divePct}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-2.5">
                          {p.solvable ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                              <ShieldCheck className="w-3 h-3" /> {bi('PRZECHODNI', 'PASSABLE')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-semibold">
                              <AlertTriangle className="w-3 h-3" /> OVERDRIVE
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

          {/* Engine Runtime Chips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
            <div className="rounded-xl border border-emerald-500/30 bg-[#0B1120] p-4 space-y-1.5">
              <div className="font-display font-bold text-emerald-300 flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                <span>8-Tier Dynamic WebGPU WGSL</span>
              </div>
              <p className="font-sans text-slate-400 text-[11.5px] leading-snug">
                {bi(
                  'Automatyczny routing TIER_8_12 → DENSE_64 ze Startup Auto-Tunerem i ochroną TDR (<800ms).',
                  'Auto-routes TIER_8_12 → DENSE_64 with startup GPU profiling & <800ms TDR dispatch guard.'
                )}
              </p>
            </div>
            <div className="rounded-xl border border-cyan-500/30 bg-[#0B1120] p-4 space-y-1.5">
              <div className="font-display font-bold text-cyan-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Deterministic Mulberry32 · Float64 Parity</span>
              </div>
              <p className="font-sans text-slate-400 text-[11.5px] leading-snug">
                {bi(
                  'Identyczne trajektorie przy prędkościach 1x..MAX oraz na każdym urządzeniu.',
                  'Bit-identical Euler kinematics & trajectories from 1x..MAX across desktop & mobile.'
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
