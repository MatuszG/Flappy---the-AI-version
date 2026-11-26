# AGENTS.md — Multi-Agent Repository Memory & Architecture Guide

This document provides persistent architectural memory for AI coding agents (**Claude Code**, **Cursor**, **GitHub Copilot**, **Windsurf**, and **Google AI Studio**) working on **Flappy NeuroLab**.

---

## 1. Core Architecture & Compute Pipeline

- **Zero-Backend Portable SPA**: Runs 100% client-side (`vite.config.ts` uses `base: './'`) so the exact same `dist/` bundle works on local dev, GitHub Pages, Tauri v2 (Windows/macOS/Linux), and Capacitor (Android/iOS).
- **8-Tier Dynamic WebGPU WGSL Compute Pipeline (`/src/engine/webgpuEvaluator.ts`, `/src/engine/gpu.worker.ts`)**:
  - Tiers automatically route based on architecture family, network depth, and width:
    - MLP / Residual Skip: `FAST_REGISTER` (`≤3L, ≤12W`), `COMPACT_DEEP` (`≤8L, ≤12W`), `DEEP_24` (`≤8L, ≤24W`), `DEEP_64` (`≤8L, ≤64W`)
    - Bio / Connectome / Reasoning: `BIO_TINY` (`≤12`), `BIO_STD` (`≤24`), `BIO_MED` (`≤32`), `BIO_LARGE` (`≤64`)
  - **Startup Auto-Tuner**: Probes GPU shader compilation and micro-dispatch latency on initialization to determine `maxStableTier` and avoid register spilling on iGPUs.
  - **Windows TDR Watchdog**: Chunks large dispatches strictly below `400ms` (`140–150ms` iGPU, `380–400ms` dGPU) and tracks `tdrTimeoutCount` to prevent 2-second OS GPU driver resets.
  - **GPU Load Slider (`10%–100%`)**: Configurable in `HardwareComputePanel.tsx` (`gpuLoadPercent`), throttling workgroups and yielding between generations when `<100%`.
- **IEEE-754 `f64` CPU Worker Pool (`/src/engine/researchPool.ts`, `/src/engine/research.worker.ts`)**:
  - Executes multi-threaded CPU evolution and deterministic `f64` verification audits.
  - **Smart Audit Gate**: `f64` verification audit only runs when a trial reaches a real milestone (`bestPipes >= 25` or `solvedGeneration !== null`) and uses full worker pool parallelism.

---

## 2. Software-Enforced Anti-Redundancy Invariants

Do **not** re-introduce invalid combinations into the UI or sweep grid:
1. **`RESIDUAL_SKIP` at `D0` (`[]` hidden layers)**: Mathematically identical to `MLP` (`D0`). Blocked in UI and skipped when `MLP` is selected.
2. **Blind Sensor Sets**: Every input sensor combination must contain at least one vertical gap sensor (`TOP_CLEAR` or `BOT_CLEAR`). `normalizeInputFeatures()` in `/src/engine/sensors.ts` guarantees this automatically.
3. **Static Pipe Scenarios (`EASY`, `MEDIUM`, `HARD`)**: Vertical pipe velocity sensors (`PIPE_VY`, `NEXT_PIPE_VY`) are always `0` on non-moving pipe scenarios and are disabled in the UI for static scenarios.
4. **Optimizer-Specific Hyperparameters**: The 8 optimizers are `CMA_HYBRID`, `DE`, `GA`, `NATURAL_ES`, `ADAM_ES`, `CEM`, `PSO`, `ADAPTIVE_ES`. `Mutation Rate` (or CR rate) is only used by `GA`, `DE`, and `ADAPTIVE_ES`; it is hidden when only `CMA_HYBRID`, `NATURAL_ES`, `ADAM_ES`, `CEM`, or `PSO` are selected.

---

## 3. UI & UX Conventions

- **Typed Multi-Language i18n (`/src/i18n/locales/*.json`, `/src/i18n/dictionaries.ts`, `/src/i18n/catalog.ts`)**:
  - Use `const { t } = useLanguage();` and add all user-facing strings to `/src/i18n/locales/pl.json` (reference) and every registered locale JSON (`en.json`, etc.).
  - Double-layer safety: TypeScript (`ExactSchema` in `types.ts`) enforces identical nested key structure at compile time, and `npm run i18n:check` verifies JSON integrity, non-empty leaves, `{param}` placeholder parity, and zero stray inline `bi(...)` calls.
- **Clean Scientific Telemetry**:
  - Never add filler instructions like `"najedź po podgląd"` or `"kliknij aby..."`.
  - Keep badges fixed-width (`whitespace-nowrap shrink-0`) in high-frequency 60 FPS components (`NeuralNetworkViz.tsx`) so live telemetry never causes flexbox layout shifts.
- **Persistence & GitHub Research Data Lake**:
  - `localStorage` stores Play leaderboard/history, saved champion brains (JSON export/import in `BrainManagerModal.tsx`), language (`PL/EN`), and experiment queue metadata (`flappy-neurolab-*`).
  - `IndexedDB` (`flappy-neurolab-autosave-v1`) stores incremental Research Lab sweep checkpoints (`checkpoints`, `trials`) and up to 120 archived runs (`run_history`).
  - Shared GitHub persistence works via `research-data/runs/<run>/trials.jsonl` + `npm run lake:sync` (`.github/workflows/analyze-research.yml`) → `public/data/research-lake.json`, loaded in-app via the `GitHub Lake` button.

---

## 4. Verification Commands

Before committing or opening a PR, always run:
```bash
npm run lint          # tsc --noEmit (must pass with 0 errors, incl. i18n schema types)
npm run i18n:check    # Dictionary JSON structure, non-empty & {param} parity unit tests
npm run test:engine   # Deterministic physics & neuroevolution suite
npm run build         # Production Vite bundle into dist/
npm run verify:ui     # Playwright Chromium UI screenshots & layout checks (.ui-screenshots/)
```
