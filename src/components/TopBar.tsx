import { HelpCircle } from 'lucide-react';
import type { GameMode } from '../engine/types';
import { useLanguage } from '../i18n/LanguageContext';

interface TopBarProps {
  mode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onOpenHowItWorks: () => void;
}

export function TopBar({
  mode,
  onSelectMode,
  onOpenHowItWorks,
}: TopBarProps) {
  const { lang, toggleLang, bi } = useLanguage();

  const navItems: {
    id: GameMode;
    label: string;
    shortLabel: string;
    activeText: string;
    accentBar: string;
  }[] = [
    {
      id: 'VS_AI',
      label: bi('Graj', 'Play'),
      shortLabel: bi('Graj', 'Play'),
      activeText: 'text-amber-300',
      accentBar: 'bg-amber-400',
    },
    {
      id: 'TRAINING',
      label: bi('Trening AI', 'Training Lab'),
      shortLabel: bi('Trening', 'Training'),
      activeText: 'text-cyan-300',
      accentBar: 'bg-cyan-400',
    },
    {
      id: 'RESEARCH',
      label: bi('Badania', 'Research'),
      shortLabel: bi('Badania', 'Research'),
      activeText: 'text-emerald-300',
      accentBar: 'bg-emerald-400',
    },
    {
      id: 'DOCS',
      label: bi('Dokumentacja', 'Docs'),
      shortLabel: bi('Docs', 'Docs'),
      activeText: 'text-purple-300',
      accentBar: 'bg-purple-400',
    },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#07080D]/90 backdrop-blur-md">
      {/* Main Row: Single-row on Tablet & Desktop (md+); Compact utility row on Mobile (<md) */}
      <div className="mx-auto flex h-12 md:h-14 max-w-[1440px] items-center justify-between gap-2 sm:gap-8 px-3 sm:px-5 lg:px-6">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectMode('VS_AI')}
          className="font-display text-[15px] sm:text-base lg:text-lg font-extrabold tracking-[-0.03em] text-slate-50 whitespace-nowrap shrink-0 cursor-pointer hover:text-amber-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400 rounded-sm"
        >
          Flappy NeuroLab
        </button>

        {/* Zone 2: Desktop & Tablet Navigation (md+) */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-6 lg:gap-8 text-[13.5px] font-medium tracking-[-0.01em]"
        >
          {navItems.map((item) => {
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectMode(item.id)}
                className={`relative py-4 whitespace-nowrap shrink-0 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400 rounded-sm ${
                  active ? `${item.activeText} font-semibold` : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    className={`absolute inset-x-0 bottom-0 h-[2px] ${item.accentBar}`}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Guide + Language Flag */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenHowItWorks}
            title={bi('Jak to działa', 'How It Works')}
            aria-label={bi('Jak to działa', 'How It Works')}
            className="inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-lg border border-white/[0.09] bg-[#0D1018] px-2.5 sm:px-3 text-xs font-medium text-slate-300 whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:border-white/25 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          >
            <HelpCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">
              {bi('Pomoc', 'Guide')}
            </span>
          </button>

          <button
            type="button"
            onClick={toggleLang}
            title={
              lang === 'pl'
                ? 'Switch to English (EN)'
                : 'Przełącz na język polski (PL)'
            }
            aria-label={
              lang === 'pl'
                ? 'Switch interface language to English'
                : 'Zmień język interfejsu na polski'
            }
            className="inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-lg border border-white/[0.09] bg-[#0D1018] px-2.5 font-mono text-[11px] font-semibold text-slate-200 whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:border-cyan-500/50 hover:bg-[#141824] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          >
            {lang === 'pl' ? (
              <>
                <svg
                  viewBox="0 0 24 16"
                  className="h-3.5 w-5 rounded-[2px] border border-slate-700/80 shrink-0"
                  aria-hidden="true"
                >
                  <rect width="24" height="16" fill="#012169" />
                  <path d="M0 0L24 16M24 0L0 16" stroke="#FFFFFF" strokeWidth="3" />
                  <path d="M0 0L24 16M24 0L0 16" stroke="#C8102E" strokeWidth="1.4" />
                  <path d="M12 0V16M0 8H24" stroke="#FFFFFF" strokeWidth="4.6" />
                  <path d="M12 0V16M0 8H24" stroke="#C8102E" strokeWidth="2.6" />
                </svg>
                <span>EN</span>
              </>
            ) : (
              <>
                <svg
                  viewBox="0 0 24 16"
                  className="h-3.5 w-5 rounded-[2px] border border-slate-700/80 shrink-0"
                  aria-hidden="true"
                >
                  <rect width="24" height="8" y="0" fill="#FFFFFF" />
                  <rect width="24" height="8" y="8" fill="#DC143C" />
                </svg>
                <span>PL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Primary Mode Bar (<md): 4 equal-width tabs, zero horizontal scroll, zero clipping */}
      <nav
        aria-label="Primary Mobile"
        className="grid grid-cols-4 border-t border-white/[0.07] md:hidden"
      >
        {navItems.map((item) => {
          const active = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectMode(item.id)}
              className={`relative flex h-10 items-center justify-center text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                active
                  ? `${item.activeText} bg-white/[0.04]`
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.shortLabel}
              {active && (
                <span
                  className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full ${item.accentBar}`}
                />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
