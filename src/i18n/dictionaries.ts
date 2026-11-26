import pl from './locales/pl.json';
import en from './locales/en.json';
import type {
  ExactSchema,
  ReferenceDictionary,
  StrictTranslationTree,
  TranslationKey,
  TranslationParams,
} from './types';

export type AppLanguage = 'pl' | 'en';

export interface LanguageOption {
  code: AppLanguage;
  shortCode: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: readonly LanguageOption[] = [
  { code: 'pl', shortCode: 'PL', nativeName: 'Polski' },
  { code: 'en', shortCode: 'EN', nativeName: 'English' },
] as const;

export const REFERENCE_LANGUAGE: AppLanguage = 'pl';

/**
 * Compile-time bidirectional structural check against reference `pl.json`.
 * Adding a new language:
 *   1. Add `locales/<lang>.json`
 *   2. Import it above and add an `assertLocaleSchema` line + `DICTIONARIES` entry
 *   3. Run `npm run lint` and `npm run i18n:check`
 */
function assertLocaleSchema<T extends ExactSchema<ReferenceDictionary, T>>(
  dict: T
): StrictTranslationTree<ReferenceDictionary> {
  return dict;
}

export const DICTIONARIES: Record<
  AppLanguage,
  StrictTranslationTree<ReferenceDictionary>
> = {
  pl: assertLocaleSchema(pl),
  en: assertLocaleSchema(en),
};

const flatCache = new Map<AppLanguage, Record<string, string>>();

function flattenDictionary(
  obj: Record<string, unknown>,
  prefix = '',
  out: Record<string, string> = {}
): Record<string, string> {
  for (const [key, value] of Object.entries(obj)) {
    const nextPath = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      out[nextPath] = value;
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenDictionary(value as Record<string, unknown>, nextPath, out);
    }
  }
  return out;
}

function getFlatDictionary(lang: AppLanguage): Record<string, string> {
  let cached = flatCache.get(lang);
  if (!cached) {
    const source = DICTIONARIES[lang] ?? DICTIONARIES[REFERENCE_LANGUAGE];
    cached = flattenDictionary(source as unknown as Record<string, unknown>);
    flatCache.set(lang, cached);
  }
  return cached;
}

/**
 * Pure translation resolver usable inside React components, hooks, and engine helpers.
 * Uses callback replacement so `$&` / `$1` sequences in parameter values are never interpreted.
 */
export function translate(
  lang: AppLanguage,
  key: TranslationKey,
  params?: TranslationParams
): string {
  const flat = getFlatDictionary(lang);
  const template =
    flat[key] ?? getFlatDictionary(REFERENCE_LANGUAGE)[key] ?? key;

  if (!params) return template;

  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, token: string) => {
    if (Object.prototype.hasOwnProperty.call(params, token)) {
      return String(params[token]);
    }
    return match;
  });
}

export function isSupportedLanguage(value: unknown): value is AppLanguage {
  return (
    typeof value === 'string' &&
    SUPPORTED_LANGUAGES.some((item) => item.code === value)
  );
}
