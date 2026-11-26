import { useRef, useState } from 'react';
import { Download, RotateCcw, Upload } from 'lucide-react';
import type { GameMode } from '../engine/types';
import { useLanguage } from '../i18n/LanguageContext';

interface TopBarProps {
  mode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onOpenBrains: () => void;
  onOpenHowItWorks: () => void;
  onPrimaryAction: () => void;
}

const WORKSPACE_STORAGE_PREFIXES = ['flappy-neuro-', 'neurolab_'];

export function TopBar({
  mode,
  onSelectMode,
  onOpenBrains,
  onOpenHowItWorks,
  onPrimaryAction,
}: TopBarProps) {
  const { lang, toggleLang, bi } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const handleExportWorkspace = () => {
    try {
      const storageDump: Record<string, string> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (
          key &&
          WORKSPACE_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))
        ) {
          const val = window.localStorage.getItem(key);
          if (val !== null) {
            storageDump[key] = val;
          }
        }
      }
      const payload = {
        schema: 'flappy-neurolab-workspace-v1',
        exportedAt: new Date().toISOString(),
        keysCount: Object.keys(storageDump).length,
        storage: storageDump,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `neurolab-workspace-${dateStamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSyncNotice(bi('Zapisano backup', 'Backup saved'));
      window.setTimeout(() => setSyncNotice(null), 2500);
    } catch {
      setSyncNotice(bi('Błąd eksportu', 'Export error'));
      window.setTimeout(() => setSyncNotice(null), 2500);
    }
  };

  const handleImportWorkspace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (
          !parsed ||
          typeof parsed !== 'object' ||
          !parsed.storage ||
          typeof parsed.storage !== 'object'
        ) {
          setSyncNotice(bi('Nieprawidłowy plik', 'Invalid file'));
          window.setTimeout(() => setSyncNotice(null), 3000);
          return;
        }
        const entries = Object.entries(
          parsed.storage as Record<string, unknown>
        );
        let restored = 0;
        for (const [key, value] of entries) {
          if (
            WORKSPACE_STORAGE_PREFIXES.some((prefix) =>
              key.startsWith(prefix)
            ) &&
            typeof value === 'string'
          ) {
            window.localStorage.setItem(key, value);
            restored++;
          }
        }
        if (restored > 0) {
          setSyncNotice(
            bi(`Przywrócono (${restored})...`, `Restored (${restored})...`)
          );
          window.setTimeout(() => window.location.reload(), 450);
        }
      } catch {
        setSyncNotice(bi('Błąd odczytu JSON', 'JSON parse error'));
        window.setTimeout(() => setSyncNotice(null), 3000);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="border-b border-slate-800/80 bg-[#0B1120]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-5 gap-y-2.5 px-3 py-3 sm:px-6 sm:py-3.5">
        {/* Zone 1: Single-line brand wordmark */}
        <button
          type="button"
          onClick={() => onSelectMode('TRAINING')}
          className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-50 whitespace-nowrap shrink-0 cursor-pointer hover:text-cyan-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400 rounded-sm"
        >
          Flappy NeuroLab
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Primary"
          className="order-3 flex w-full items-center gap-4 overflow-x-auto border-t border-slate-800/60 pt-2 text-xs sm:text-sm font-medium lg:order-2 lg:w-auto lg:gap-6 lg:border-t-0 lg:pt-0"
        >
          <button
            type="button"
            onClick={() => onSelectMode('TRAINING')}
            className={`relative py-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400 rounded-sm ${
              mode === 'TRAINING'
                ? 'text-cyan-300'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            {bi('Laboratorium Treningu', 'Training Lab')}
            {mode === 'TRAINING' && (
              <span className="absolute inset-x-0 -bottom-0.5 lg:-bottom-[15px] h-0.5 bg-cyan-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectMode('VS_AI')}
            className={`relative py-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400 rounded-sm ${
              mode === 'VS_AI'
                ? 'text-amber-300'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            {bi('Gra vs AI', 'Play vs. AI')}
            {mode === 'VS_AI' && (
              <span className="absolute inset-x-0 -bottom-0.5 lg:-bottom-[15px] h-0.5 bg-amber-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectMode('RESEARCH')}
            className={`relative py-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400 rounded-sm ${
              mode === 'RESEARCH'
                ? 'text-emerald-300'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            {bi('Badania (Sweep)', 'Research Sweep')}
            {mode === 'RESEARCH' && (
              <span className="absolute inset-x-0 -bottom-0.5 lg:-bottom-[15px] h-0.5 bg-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectMode('DOCS')}
            className={`relative py-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400 rounded-sm ${
              mode === 'DOCS'
                ? 'text-purple-300'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            {bi('Dokumentacja', 'Documentation')}
            {mode === 'DOCS' && (
              <span className="absolute inset-x-0 -bottom-0.5 lg:-bottom-[15px] h-0.5 bg-purple-400" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenBrains}
            className="py-1 text-slate-400 hover:text-slate-100 whitespace-nowrap shrink-0 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400 rounded-sm"
          >
            {bi('Zapisane Sieci', 'Saved Brains')}
          </button>

          <button
            type="button"
            onClick={onOpenHowItWorks}
            className="py-1 text-slate-400 hover:text-slate-100 whitespace-nowrap shrink-0 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400 rounded-sm"
          >
            {bi('Jak to działa', 'How It Works')}
          </button>
        </nav>

        {/* Zone 3: Portable Workspace Sync + Language Switcher (PL/EN) + Single primary action */}
        <div className="order-2 flex items-center gap-2 shrink-0 lg:order-3">
          {syncNotice && (
            <span className="rounded-md border border-emerald-500/30 bg-emerald-950/60 px-2 py-1 font-mono text-[10px] text-emerald-300">
              {syncNotice}
            </span>
          )}

          <div
            role="group"
            aria-label={bi('Synchronizacja stanu laboratorium', 'Workspace state sync')}
            className="inline-flex items-center rounded-lg border border-slate-800 bg-slate-900/90 p-0.5 font-mono text-[11px]"
          >
            <button
              type="button"
              onClick={handleExportWorkspace}
              title={bi(
                'Eksportuj pełny stan laboratorium (sieci, badania, historia) do pliku JSON',
                'Export full lab workspace (brains, sweeps, history) to JSON file'
              )}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-slate-300 hover:bg-slate-800 hover:text-cyan-200 cursor-pointer transition-colors"
            >
              <Download className="h-3 w-3" aria-hidden="true" />
              <span className="hidden sm:inline">{bi('Backup', 'Backup')}</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title={bi(
                'Wczytaj pełny stan laboratorium z pliku JSON (synchronizacja między urządzeniami)',
                'Import full lab workspace from JSON file (cross-device sync)'
              )}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-slate-300 hover:bg-slate-800 hover:text-emerald-200 cursor-pointer transition-colors"
            >
              <Upload className="h-3 w-3" aria-hidden="true" />
              <span className="hidden sm:inline">{bi('Wczytaj', 'Restore')}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportWorkspace}
              className="hidden"
            />
          </div>

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
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-2 py-1.5 font-mono text-[11px] font-semibold text-slate-200 whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:border-cyan-500/50 hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          >
            {lang === 'pl' ? (
              <>
                {/* UK / English flag — clicking switches to English and swaps flag to Polish */}
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
                {/* Polish flag — clicking switches to Polish and swaps flag to English */}
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

          <button
            type="button"
            onClick={onPrimaryAction}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-slate-100 whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:border-cyan-500/50 hover:bg-slate-800 hover:text-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {mode === 'VS_AI'
              ? bi('Nowy Mecz', 'New Match')
              : mode === 'RESEARCH'
                ? bi('Wyczyść Wyniki', 'Clear Results')
                : bi('Reset Ewolucji', 'Reset Evolution')}
          </button>
        </div>
      </div>
    </header>
  );
}

