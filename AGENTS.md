# AGENTS.md — Multi-Agent Repository Memory & Architecture Guide

This document provides persistent architectural memory for AI coding agents (**Claude Code**, **Cursor**, **GitHub Copilot**, **Windsurf**, and **Google AI Studio**) working on **Flappy NeuroLab**.

---

## 1. Core Architecture & Compute Pipeline

- **Zero-Backend Portable SPA**: Runs 100% client-side (`vite.config.ts` uses `base: './'`) so the exact same `dist/` bundle works on local dev, GitHub Pages, Tauri v2 (Windows/macOS/Linux), and Capacitor (Android/iOS).
- **8-Tier Dynamic WebGPU WGSL Compute Pipeline (`/src/engine/webgpuPool.ts`)**:
  - Tiers automatically route based on network depth (`maxLayers`) and width (`maxLayerWidth`):
    - `TIER_8_12` (`≤3L, ≤8W, ≤12Act`)
    - `TIER_16_24` (`≤4L, ≤16W, ≤24Act`)
    - `TIER_24_36` (`≤4L, ≤24W, ≤36Act`)
    - `TIER_32_48` (`≤4L, ≤32W, ≤48Act`)
    - `TIER_48_64` (`≤4L, ≤48W, ≤64Act`)
    - `TIER_64_64` (`≤4L, ≤64W, ≤64Act`)
    - `DENSE_24` (`≤8L, ≤24W`)
    - `DENSE_64` (`≤8L, ≤64W`)
  - **Startup Auto-Tuner**: Probes GPU shader compilation and micro-dispatch latency on initialization to determine `maxStableTier` and avoid register spilling on iGPUs.
  - **Windows TDR Watchdog**: Chunks large dispatches below ~800 ms and tracks `tdrTimeoutCount` to prevent 2-second OS GPU driver resets.
  - **GPU Load Slider (`10%–100%`)**: Configurable in `HardwareComputePanel.tsx` (`gpuLoadPercent`), throttling workgroups and yielding between generations when `<100%`.
- **IEEE-754 `f64` CPU Worker Pool (`/src/engine/workerPool.ts`, `/src/engine/researchWorker.ts`)**:
  - Executes multi-threaded CPU evolution and deterministic `f64` verification audits.
  - **Smart Audit Gate**: `f64` verification audit only runs when a trial reaches a real milestone (`bestPipes >= 25` or `solvedGeneration !== null`) and uses full worker pool parallelism.

---

## 2. Software-Enforced Anti-Redundancy Invariants

Do **not** re-introduce invalid combinations into the UI or sweep grid:
1. **`RESIDUAL_SKIP` at `D0` (`[]` hidden layers)**: Mathematically identical to `MLP` (`D0`). Blocked in UI and skipped when `MLP` is selected.
2. **Blind Sensor Sets**: Every input sensor combination must contain at least one vertical gap sensor (`TOP_CLEAR` or `BOT_CLEAR`). `normalizeInputFeatures()` in `/src/engine/types.ts` guarantees this automatically.
3. **Static Pipe Scenarios (`EASY`, `MEDIUM`, `HARD`)**: Vertical pipe velocity sensors (`PIPE_VY`, `NEXT_PIPE_VY`) are always `0` on non-moving pipe scenarios and are disabled in the UI for static scenarios.
4. **Optimizer-Specific Hyperparameters**: `Mutation Rate` is only used by `GA` and `(1+λ)-ES`; it is hidden when only `CMA-ES`, `DE`, `PSO`, `NES`, `OpenAI-ES`, or `PEPG` are selected.

---

## 3. UI & UX Conventions

- **Bilingual (`PL | EN`) Support (`/src/i18n/LanguageContext.tsx`)**:
  - Use `const { bi } = useLanguage();` and wrap all user-facing strings in `bi('Polski tekst', 'English text')`.
- **Clean Scientific Telemetry**:
  - Never add filler instructions like `"najedź po podgląd"` or `"kliknij aby..."`.
  - Keep badges fixed-width (`whitespace-nowrap shrink-0`) in high-frequency 60 FPS components (`NeuralNetworkViz.tsx`) so live telemetry never causes flexbox layout shifts.
- **Portable Workspace State Sync (`/src/components/TopBar.tsx`)**:
  - All persistent data in `localStorage` uses prefixes `flappy-neuro-` or `neurolab_`.
  - The top bar `Backup` / `Wczytaj` (`Restore`) buttons export and import all matching keys in a single `.json` snapshot (`flappy-neurolab-workspace-v1`).

---

## 4. Verification Commands

Before committing or opening a PR, always run:
```bash
npm run lint          # tsc --noEmit (must pass with 0 errors)
npm run test:engine   # Deterministic physics & neuroevolution suite
npm run build         # Production Vite bundle into dist/
npm run verify:ui     # Playwright Chromium UI screenshots & layout checks (.ui-screenshots/)
```
