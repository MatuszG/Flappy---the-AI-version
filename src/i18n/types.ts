import type pl from './locales/pl.json';

/**
 * Canonical reference dictionary type derived directly from `locales/pl.json`.
 * Every additional locale JSON must match this exact nested key tree at compile time.
 */
export type ReferenceDictionary = typeof pl;

/**
 * Recursive structural contract: every key in T must exist with the exact same
 * nesting shape (string leaf vs nested object), and no extra keys are allowed.
 */
export type StrictTranslationTree<T> = {
  readonly [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends Record<string, unknown>
      ? StrictTranslationTree<T[K]>
      : never;
};

/**
 * Bidirectional compile-time schema assertion:
 * Produces `never` (causing a TypeScript error) if Candidate is missing any key
 * from Ref OR contains any extra key not present in Ref, at any nesting depth.
 */
export type ExactSchema<Ref, Candidate> =
  [keyof Ref] extends [keyof Candidate]
    ? [keyof Candidate] extends [keyof Ref]
      ? {
          readonly [K in keyof Ref]: Ref[K] extends string
            ? Candidate[K] extends string
              ? string
              : never
            : Ref[K] extends Record<string, unknown>
              ? Candidate[K] extends Record<string, unknown>
                ? ExactSchema<Ref[K], Candidate[K]>
                : never
              : never;
        }
      : never
    : never;

/**
 * Produces a dot-separated union of all leaf translation keys in `T`.
 * Example: `'nav.play' | 'research.topology.paramsLabel' | ...`
 */
type JoinPath<Prefix extends string, Key extends string> = Prefix extends ''
  ? Key
  : `${Prefix}.${Key}`;

export type LeafPaths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? JoinPath<Prefix, K>
    : T[K] extends Record<string, unknown>
      ? LeafPaths<T[K], JoinPath<Prefix, K>>
      : never;
}[keyof T & string];

export type TranslationKey = LeafPaths<ReferenceDictionary>;

export type TranslationParams = Record<string, string | number>;

export type TranslateFn = (
  key: TranslationKey,
  params?: TranslationParams
) => string;
