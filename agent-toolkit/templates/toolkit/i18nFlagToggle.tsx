/**
 * Universal Bilingual (PL | EN) Context & Single-Button SVG Flag Toggle
 * - Clicking the flag toggles between Polish (🇵🇱) and English (🇬🇧)
 * - Displays the active language flag with accessible tooltip
 */

import React, { createContext, useCallback, useContext, useState } from 'react';

export type AppLanguage = 'pl' | 'en';

export interface LanguageContextValue {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  toggleLang: () => void;
  bi: <T = string>(pl: T, en: T) => T;
}

const STORAGE_KEY = 'app_ui_lang_v1';

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'pl',
  setLang: () => {},
  toggleLang: () => {},
  bi: (pl) => pl,
});

export const LanguageProvider: React.FC<{
  children: React.ReactNode;
  defaultLang?: AppLanguage;
  storageKey?: string;
}> = ({ children, defaultLang = 'pl', storageKey = STORAGE_KEY }) => {
  const [lang, setLangState] = useState<AppLanguage>(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved === 'pl' || saved === 'en') return saved;
    } catch {}
    return defaultLang;
  });

  const setLang = useCallback(
    (next: AppLanguage) => {
      setLangState(next);
      try {
        window.localStorage.setItem(storageKey, next);
      } catch {}
    },
    [storageKey]
  );

  const toggleLang = useCallback(() => {
    setLang(lang === 'pl' ? 'en' : 'pl');
  }, [lang, setLang]);

  const bi = useCallback(<T = string,>(pl: T, en: T): T => (lang === 'pl' ? pl : en), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, bi }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

export const LanguageFlagButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { lang, toggleLang, bi } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLang}
      title={bi(
        'Język: Polski — kliknij, aby przełączyć na English',
        'Language: English — click to switch to Polski'
      )}
      aria-label={bi('Przełącz język na angielski', 'Switch language to Polish')}
      className={`inline-flex items-center justify-center rounded-md border border-slate-700/80 bg-slate-900/80 px-2 py-1 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 ${className}`}
    >
      {lang === 'pl' ? (
        <svg viewBox="0 0 24 16" className="h-3.5 w-5 rounded-[2px] shadow-sm" aria-hidden="true">
          <rect width="24" height="8" y="0" fill="#ffffff" />
          <rect width="24" height="8" y="8" fill="#dc143c" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 16" className="h-3.5 w-5 rounded-[2px] shadow-sm" aria-hidden="true">
          <rect width="24" height="16" fill="#012169" />
          <path d="M0,0 L24,16 M24,0 L0,16" stroke="#ffffff" strokeWidth="3.2" />
          <path d="M0,0 L24,16 M24,0 L0,16" stroke="#C8102E" strokeWidth="1.8" />
          <path d="M12,0 V16 M0,8 H24" stroke="#ffffff" strokeWidth="5.2" />
          <path d="M12,0 V16 M0,8 H24" stroke="#C8102E" strokeWidth="3" />
        </svg>
      )}
    </button>
  );
};
