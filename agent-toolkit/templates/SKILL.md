---
name: universal-agent-toolkit
description: Automated Playwright visual UI verification, DOM overflow/clipping audit, Web Worker OOM/IPC protection, and portable workspace sync for web applications.
---

# Universal Agent Toolkit (`verify:ui` & Runtime Guard)

Whenever building or modifying UI components, responsive layouts, or high-throughput Web Worker/WebGPU pipelines:

1. **Run Visual & DOM Layout Verification**:
   - Execute `npm run verify:ui` (or `node scripts/verify-ui.mjs`).
   - This automatically launches or connects to the dev server (`:3000` / `:4173`), captures Desktop (`1440x900`) and Mobile (`390x844`) PNG screenshots across discovered navigation tabs into `.ui-screenshots/`, and checks for:
     - Uncaught `pageerror` and `console.error`
     - Horizontal page overflow (`documentElement.scrollWidth > innerWidth`)
     - Clipped text inside buttons/badges (`scrollWidth > clientWidth + 6`)
     - Overlapping interactive buttons
2. **Inspect Generated Screenshots Directly**:
   - Read `.ui-screenshots/report.json` and view `.ui-screenshots/*.png` using your file viewing tool (`view_file` / `Read`) to confirm visual quality and fix any layout issues before completing the turn.
3. **Prevent Large-Dataset & Worker OOM Crashes**:
   - Use `safeMax` / `safeMin` from `src/toolkit/runtimeWatchdog.ts` instead of `Math.max(...arr)` on large arrays (>10k items).
   - Use `stripHeavyFieldsForWorkerIpc` before `worker.postMessage` when sending large result arrays to analytics/export workers.
   - Use `createQueuedAsyncSaver` for IndexedDB checkpoints so final `COMPLETED` saves are queued rather than dropped if an autosave is mid-flight.
