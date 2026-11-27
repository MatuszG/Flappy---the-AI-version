import { Cpu, X, Zap, Activity, Brain, Shield } from 'lucide-react';
import { useState } from 'react';
import researchEmblemImg from '../assets/images/research_emblem_1795032939270.jpg';
import { useLanguage } from '../i18n/LanguageContext';

interface HowItWorksModalProps {
  open: boolean;
  onClose: () => void;
}

export function HowItWorksModal({ open, onClose }: HowItWorksModalProps) {
  const { t } = useLanguage();
  const [imgError, setImgError] = useState(false);
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);

  if (!open) return null;

  const tabs = [
    {
      id: 0,
      title: t('modals.perceptionSensorsTitle'),
      icon: Activity,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      desc: t('modals.perceptionSensorsDesc'),
    },
    {
      id: 1,
      title: t('modals.neuralArchTitle'),
      icon: Brain,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      desc: t('modals.neuralArchDesc'),
    },
    {
      id: 2,
      title: t('modals.arcadePlayTitle'),
      icon: Zap,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      desc: t('modals.arcadePlayDesc'),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/[0.12] bg-[#090C14] shadow-2xl shadow-cyan-950/30 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.08] px-5 py-4 sm:px-6 sm:py-5 bg-[#0D111A]">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-10 w-10 sm:h-11 sm:w-11 overflow-hidden rounded-xl border border-white/[0.1] bg-[#07090F] shrink-0 flex items-center justify-center shadow-inner">
              {!imgError ? (
                <img
                  src={researchEmblemImg}
                  alt={t('modals.geometricNeuralSongbirdEmblem')}
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Cpu className="h-5 w-5 text-cyan-400" aria-hidden="true" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 font-mono text-[9.5px] font-bold text-cyan-300 uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  <Shield className="w-3 h-3" />
                  Guide
                </span>
              </div>
              <h2
                id="how-modal-title"
                className="font-display text-base sm:text-xl font-bold text-white tracking-tight mt-0.5 truncate"
              >
                {t('modals.howNeurolabWorks')}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('modals.closeModal')}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/[0.2] hover:text-white hover:bg-white/[0.06] cursor-pointer transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-[#06080E] border-b border-white/[0.07]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as 0 | 1 | 2)}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 font-display text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-white/[0.08] text-white shadow-sm border border-white/[0.12]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="truncate">{tab.title}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-sm leading-relaxed text-slate-300">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0B0F19] p-5 sm:p-6 shadow-lg space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl border ${tabs[activeTab].color}`}>
                {activeTab === 0 && <Activity className="w-5 h-5" />}
                {activeTab === 1 && <Brain className="w-5 h-5" />}
                {activeTab === 2 && <Zap className="w-5 h-5" />}
              </div>
              <h3 className="font-display text-base sm:text-lg font-bold text-white tracking-wide">
                {tabs[activeTab].title}
              </h3>
            </div>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              {tabs[activeTab].desc}
            </p>

            <div className="pt-3 border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
              <span className="text-cyan-300">Flappy NeuroLab Architecture Engine v2.4</span>
              <span className="text-slate-400">60 Hz Bit-Exact Physics</span>
            </div>
          </div>

          <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-4 text-xs sm:text-sm text-cyan-200/90 leading-normal flex items-start gap-3">
            <Cpu className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Wskazówka:</span> {t('modals.exploreDocsPrompt')}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end sm:justify-between border-t border-white/[0.08] px-5 py-3.5 sm:px-6 sm:py-4 bg-[#0D111A]">
          <span className="hidden sm:inline font-mono text-[11px] text-slate-400">
            Press <kbd className="px-1.5 py-0.5 bg-white/[0.08] rounded text-slate-200 font-mono">Esc</kbd> to close
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 cursor-pointer transition-all"
          >
            {t('modals.gotIt')}
          </button>
        </div>
      </div>
    </div>
  );
}
