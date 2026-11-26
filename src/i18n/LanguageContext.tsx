import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type AppLanguage = 'pl' | 'en';

const STORAGE_KEY = 'flappy_neurolab_lang';

interface LanguageContextValue {
  lang: AppLanguage;
  setLang: (next: AppLanguage) => void;
  toggleLang: () => void;
  /** Returns Polish string when lang === 'pl', otherwise English */
  bi: (pl: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'pl',
  setLang: () => {},
  toggleLang: () => {},
  bi: (pl) => pl,
});

function loadInitialLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'pl';
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'pl' || saved === 'en') return saved;
  } catch {
    // Ignore storage errors
  }
  return 'pl';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>(loadInitialLanguage);

  const setLang = useCallback((next: AppLanguage) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'pl' ? 'en' : 'pl');
  }, [lang, setLang]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const bi = useCallback(
    (pl: string, en: string) => (lang === 'pl' ? pl : en),
    [lang]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, toggleLang, bi }),
    [lang, setLang, toggleLang, bi]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
