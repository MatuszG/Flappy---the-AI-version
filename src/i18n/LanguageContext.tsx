import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  isSupportedLanguage,
  REFERENCE_LANGUAGE,
  SUPPORTED_LANGUAGES,
  translate,
  type AppLanguage,
  type LanguageOption,
} from './dictionaries';
import type { TranslateFn, TranslationKey, TranslationParams } from './types';

export type { AppLanguage, LanguageOption, TranslateFn, TranslationKey, TranslationParams };

const STORAGE_KEY = 'flappy_neurolab_lang';

interface LanguageContextValue {
  lang: AppLanguage;
  setLang: (next: AppLanguage) => void;
  toggleLang: () => void;
  languages: readonly LanguageOption[];
  t: TranslateFn;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: REFERENCE_LANGUAGE,
  setLang: () => {},
  toggleLang: () => {},
  languages: SUPPORTED_LANGUAGES,
  t: (key, params) => translate(REFERENCE_LANGUAGE, key, params),
});

function loadInitialLanguage(): AppLanguage {
  if (typeof window === 'undefined') return REFERENCE_LANGUAGE;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isSupportedLanguage(saved)) return saved;
  } catch {
    // Ignore storage errors
  }
  return REFERENCE_LANGUAGE;
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
    const idx = SUPPORTED_LANGUAGES.findIndex((item) => item.code === lang);
    const next =
      SUPPORTED_LANGUAGES[(idx + 1) % SUPPORTED_LANGUAGES.length]?.code ??
      REFERENCE_LANGUAGE;
    setLang(next);
  }, [lang, setLang]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const t = useCallback<TranslateFn>(
    (key, params) => translate(lang, key, params),
    [lang]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      toggleLang,
      languages: SUPPORTED_LANGUAGES,
      t,
    }),
    [lang, setLang, toggleLang, t]
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
