#!/usr/bin/env tsx
/**
 * Flappy NeuroLab — i18n Dictionary & Static Usage Unit Test Suite (`npm run i18n:check`).
 *
 * Enforces double-layer localization safety alongside TypeScript compile-time schema checks:
 *  1. Valid JSON & non-empty reference dictionary (`src/i18n/locales/pl.json`)
 *  2. 1:1 parity between `src/i18n/locales/*.json` files and `DICTIONARIES` / `SUPPORTED_LANGUAGES`
 *  3. Exact nested key structure (zero missing keys, zero extra/orphan keys, identical nesting types)
 *  4. Zero empty / whitespace-only / TODO translation leaves in any locale
 *  5. Exact `{param}` interpolation placeholder parity against `pl.json`
 *  6. Zero Polish diacritic leaks in `en.json`
 *  7. Static source-code audit: zero leftover `bi(...)` calls and all literal `t('...')` keys exist
 *  8. Runtime `translate()` & catalog accessor unit tests
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  DICTIONARIES,
  REFERENCE_LANGUAGE,
  SUPPORTED_LANGUAGES,
  translate,
  type AppLanguage,
} from '../src/i18n/dictionaries';
import {
  getArchText,
  getDifficultyText,
  getMorphogenesisText,
  getOptimizerText,
  getPowerProfileText,
  getPrecisionText,
  getPresetText,
  getSensorText,
} from '../src/i18n/catalog';
import type { TranslationKey } from '../src/i18n/types';

const LOCALES_DIR = path.resolve(process.cwd(), 'src/i18n/locales');
const SRC_DIR = path.resolve(process.cwd(), 'src');

interface FlatEntry {
  key: string;
  value: unknown;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function flattenEntries(
  obj: Record<string, unknown>,
  prefix = '',
  out: Map<string, FlatEntry> = new Map()
): Map<string, FlatEntry> {
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (isPlainObject(v)) {
      if (Object.keys(v).length === 0) {
        out.set(fullKey, { key: fullKey, value: v });
      } else {
        flattenEntries(v, fullKey, out);
      }
    } else {
      out.set(fullKey, { key: fullKey, value: v });
    }
  }
  return out;
}

function extractPlaceholders(text: string): {
  tokens: Set<string>;
  malformed: string[];
} {
  const tokens = new Set<string>();
  const malformed: string[] = [];

  // Match valid `{paramName}` placeholders
  const validRe = /\{([a-zA-Z0-9_]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = validRe.exec(text)) !== null) {
    tokens.add(m[1]);
  }

  // Strip valid placeholders and detect stray unclosed/empty braces like `{}` or `{foo `
  const stripped = text.replace(validRe, '');
  const badRe = /\{[^}]*\}|\{[^}]*$/g;
  while ((m = badRe.exec(stripped)) !== null) {
    malformed.push(m[0]);
  }

  return { tokens, malformed };
}

function walkSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkSourceFiles(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

let passedTests = 0;
const failures: string[] = [];

function runTest(name: string, fn: () => void) {
  try {
    fn();
    passedTests++;
    console.log(`  [OK] ${name}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    failures.push(`${name}: ${msg}`);
    console.error(`  [FAIL] ${name}\n         ${msg}`);
  }
}

console.log('=== FLAPPY NEUROLAB — i18n DICTIONARY & PARITY SUITE ===');

const jsonFiles = fs
  .readdirSync(LOCALES_DIR)
  .filter((f) => f.endsWith('.json'))
  .sort();

const parsedLocales = new Map<string, Record<string, unknown>>();
const flatLocales = new Map<string, Map<string, FlatEntry>>();

runTest('1. All locale JSON files parse cleanly as objects', () => {
  assert.ok(jsonFiles.length >= 2, 'Expected at least 2 locale JSON files');
  assert.ok(
    jsonFiles.includes(`${REFERENCE_LANGUAGE}.json`),
    `Missing reference locale file ${REFERENCE_LANGUAGE}.json`
  );
  for (const file of jsonFiles) {
    const code = file.replace(/\.json$/, '');
    const raw = fs.readFileSync(path.join(LOCALES_DIR, file), 'utf8');
    const data = JSON.parse(raw);
    assert.ok(isPlainObject(data), `${file} root must be a JSON object`);
    parsedLocales.set(code, data);
    flatLocales.set(code, flattenEntries(data));
  }
});

runTest('2. Locale JSON files match DICTIONARIES & SUPPORTED_LANGUAGES registry', () => {
  const fileCodes = [...parsedLocales.keys()].sort();
  const dictCodes = Object.keys(DICTIONARIES).sort();
  const supportedCodes = SUPPORTED_LANGUAGES.map((l) => l.code).sort();
  assert.deepEqual(
    fileCodes,
    dictCodes,
    `Mismatch between locales/*.json (${fileCodes.join(',')}) and DICTIONARIES (${dictCodes.join(',')})`
  );
  assert.deepEqual(
    supportedCodes,
    dictCodes,
    `Mismatch between SUPPORTED_LANGUAGES (${supportedCodes.join(',')}) and DICTIONARIES (${dictCodes.join(',')})`
  );
});

const refFlat = flatLocales.get(REFERENCE_LANGUAGE)!;

runTest(`3. Reference dictionary (${REFERENCE_LANGUAGE}.json) has valid non-empty leaves`, () => {
  assert.ok(refFlat.size > 100, `Reference dictionary looks too small (${refFlat.size} keys)`);
  const invalid: string[] = [];
  for (const [key, entry] of refFlat.entries()) {
    if (typeof entry.value !== 'string') {
      invalid.push(`${key}: expected string leaf, got ${typeof entry.value}`);
      continue;
    }
    if (entry.value.trim().length === 0) {
      invalid.push(`${key}: empty or whitespace-only string`);
      continue;
    }
    const { malformed } = extractPlaceholders(entry.value);
    if (malformed.length > 0) {
      invalid.push(`${key}: malformed placeholder(s) ${malformed.join(', ')}`);
    }
  }
  assert.equal(
    invalid.length,
    0,
    `Invalid entries in ${REFERENCE_LANGUAGE}.json:\n${invalid.slice(0, 15).join('\n')}`
  );
});

runTest('4. Exact key structure parity across all locales (zero missing / zero extra)', () => {
  const errors: string[] = [];
  for (const [code, flat] of flatLocales.entries()) {
    if (code === REFERENCE_LANGUAGE) continue;
    for (const key of refFlat.keys()) {
      if (!flat.has(key)) {
        errors.push(`[${code}.json] Missing key: "${key}"`);
      }
    }
    for (const key of flat.keys()) {
      if (!refFlat.has(key)) {
        errors.push(`[${code}.json] Extra/orphan key not in ${REFERENCE_LANGUAGE}.json: "${key}"`);
      }
    }
  }
  assert.equal(
    errors.length,
    0,
    `Key parity errors (${errors.length}):\n${errors.slice(0, 20).join('\n')}`
  );
});

runTest('5. Zero empty, non-string, or TODO values across all locales', () => {
  const errors: string[] = [];
  for (const [code, flat] of flatLocales.entries()) {
    for (const [key, entry] of flat.entries()) {
      if (typeof entry.value !== 'string') {
        errors.push(`[${code}.json] "${key}" is not a string`);
      } else if (entry.value.trim().length === 0) {
        errors.push(`[${code}.json] "${key}" is empty`);
      } else if (/^\s*(TODO|FIXME|TBD)\b/i.test(entry.value)) {
        errors.push(`[${code}.json] "${key}" contains unfinished marker: "${entry.value}"`);
      }
    }
  }
  assert.equal(
    errors.length,
    0,
    `Empty/unfinished translations (${errors.length}):\n${errors.slice(0, 20).join('\n')}`
  );
});

runTest('6. Exact {param} interpolation placeholder parity against reference dictionary', () => {
  const errors: string[] = [];
  for (const [code, flat] of flatLocales.entries()) {
    if (code === REFERENCE_LANGUAGE) continue;
    for (const [key, refEntry] of refFlat.entries()) {
      const targetEntry = flat.get(key);
      if (!targetEntry || typeof refEntry.value !== 'string' || typeof targetEntry.value !== 'string') {
        continue;
      }
      const refPh = extractPlaceholders(refEntry.value);
      const targetPh = extractPlaceholders(targetEntry.value);
      if (targetPh.malformed.length > 0) {
        errors.push(`[${code}.json] "${key}" has malformed placeholders: ${targetPh.malformed.join(', ')}`);
      }
      const missing = [...refPh.tokens].filter((t) => !targetPh.tokens.has(t));
      const extra = [...targetPh.tokens].filter((t) => !refPh.tokens.has(t));
      if (missing.length > 0 || extra.length > 0) {
        errors.push(
          `[${code}.json] "${key}" placeholder mismatch (missing: [${missing.join(', ')}], extra: [${extra.join(', ')}])`
        );
      }
    }
  }
  assert.equal(
    errors.length,
    0,
    `Placeholder mismatches (${errors.length}):\n${errors.slice(0, 20).join('\n')}`
  );
});

runTest('7. Non-PL locales contain zero accidental Polish diacritic leaks', () => {
  const leaks: string[] = [];
  const polishDiacriticsRe = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
  for (const [code, flat] of flatLocales.entries()) {
    if (code === 'pl') continue;
    for (const [key, entry] of flat.entries()) {
      if (typeof entry.value !== 'string') continue;
      if (polishDiacriticsRe.test(entry.value)) {
        leaks.push(`[${code}.json] "${key}" => "${entry.value.slice(0, 80)}"`);
      }
    }
  }
  assert.equal(
    leaks.length,
    0,
    `Polish diacritic leaks detected (${leaks.length}):\n${leaks.slice(0, 20).join('\n')}`
  );
});

runTest('8. Source code audit: zero leftover bi() calls & every static t() key exists', () => {
  const files = walkSourceFiles(SRC_DIR).filter(
    (f) => !f.includes(`${path.sep}i18n${path.sep}`)
  );
  const leftoverBi: string[] = [];
  const missingKeys: string[] = [];

  for (const file of files) {
    const rel = path.relative(process.cwd(), file);
    const code = fs.readFileSync(file, 'utf8');

    // Strip line & block comments before checking calls
    const stripped = code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');

    if (/(^|[^A-Za-z0-9_$.])(bi|biRef\.current)\s*\(/.test(stripped)) {
      leftoverBi.push(rel);
    }

    const callRe = /(?:^|[^A-Za-z0-9_$.])(?:t|tRef\.current)\(\s*'([a-zA-Z0-9_.]+)'/g;
    let m: RegExpExecArray | null;
    while ((m = callRe.exec(stripped)) !== null) {
      const key = m[1];
      if (!refFlat.has(key)) {
        missingKeys.push(`${rel}: unknown key "${key}"`);
      }
    }
  }

  assert.equal(
    leftoverBi.length,
    0,
    `Leftover bi() calls found in: ${leftoverBi.join(', ')}`
  );
  assert.equal(
    missingKeys.length,
    0,
    `Unknown t() keys referenced in source (${missingKeys.length}):\n${missingKeys.slice(0, 20).join('\n')}`
  );
});

runTest('9. Runtime translate() interpolation, fallback & catalog accessors', () => {
  // Basic PL & EN lookup
  assert.equal(translate('pl', 'play.medals.GOLD'), 'Złoty Medal');
  assert.equal(translate('en', 'play.medals.GOLD'), 'Gold Medal');

  // Repeated parameter substitution + zero value
  assert.equal(
    translate('pl', 'research.topology.hiddenLayersCount', { depth: 0 }),
    '0 warstw ukr. (D0)'
  );
  assert.equal(
    translate('en', 'research.topology.hiddenLayersCount', { depth: 3 }),
    '3 hidden layers (D3)'
  );

  // Special `$&` replacement pattern safety
  assert.equal(
    translate('en', 'research.downloadedColab', { filename: 'run_$&_1.ipynb', count: 42 }),
    'Downloaded run_$&_1.ipynb (42 trials)'
  );

  // Fallback for unknown runtime language code
  assert.equal(
    translate('xx' as AppLanguage, 'play.medals.PLATINUM' as TranslationKey),
    'Platynowy As'
  );

  // Catalog accessors across all supported languages
  for (const { code } of SUPPORTED_LANGUAGES) {
    assert.ok(getArchText(code, 'MLP').fullName.length > 0);
    assert.ok(getOptimizerText(code, 'CMA_HYBRID').fullName.length > 0);
    assert.ok(getPrecisionText(code, 'FP32').summary.length > 0);
    assert.ok(getSensorText(code, 'PIPE_DX').description.length > 0);
    assert.ok(getDifficultyText(code, 'HARD').description.length > 0);
    assert.ok(getPowerProfileText(code, 'BALANCED').thermalBadge.length > 0);
    assert.ok(getMorphogenesisText(code, 'BALANCED_SEEDLING').name.length > 0);
    assert.ok(getPresetText(code, 'FRUIT_FLY_SPEED_LAB').title.length > 0);
  }
});

console.log(
  `\nSummary: ${passedTests}/${passedTests + failures.length} tests passed · ${flatLocales.size} locales · ${refFlat.size} keys/locale`
);

if (failures.length > 0) {
  process.exit(1);
}
