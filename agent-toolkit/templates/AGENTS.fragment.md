<!-- AGENT-TOOLKIT:START -->
## Universal Agent Toolkit — Visual Inspection & Runtime Reliability Rules

1. **Automated Visual UI Verification (`npm run verify:ui`)**:
   - After UI/layout changes, run `npm run verify:ui` (`node scripts/verify-ui.mjs`).
   - The script automatically detects or spawns a dev/preview server, navigates across tabs on Desktop (`1440x900`) and Mobile (`390x844`), checks for `pageerror`, `console.error`, horizontal overflow, clipped text (`scrollWidth > clientWidth`), and button overlap, and saves PNG screenshots to `.ui-screenshots/`.
   - **Inspect Screenshots Directly**: Always use the `view_file` (or Read) tool on `.ui-screenshots/*.png` and `.ui-screenshots/report.json` to visually verify the rendered interface before finishing a task.
2. **Large-Dataset & Worker OOM Guards (`src/toolkit/runtimeWatchdog.ts`)**:
   - Never use `Math.max(...arr)` or `Math.min(...arr)` on arrays that can exceed 10,000 items (causes `RangeError: Maximum call stack size exceeded` at >65k items); use `safeMax(arr)` / `safeMin(arr)`.
   - Strip heavy blobs/weights (`stripHeavyFieldsForWorkerIpc`) before sending large result arrays via `worker.postMessage(...)` when the worker does not consume those fields.
   - Terminate or release heavy compute workers (`worker.terminate()`) before triggering end-of-batch UI state flushes and IndexedDB persistence, and use `createQueuedAsyncSaver` so a final completion save is never dropped if an incremental autosave is mid-flight.
3. **Portable Workspace & Bilingual UI Conventions (`src/toolkit/`)**:
   - Use `workspaceSync.ts` (`downloadWorkspaceBackup` / `restoreWorkspaceSnapshot`) for 1-click `.json` state portability across Web, Tauri, and Android.
   - Use `i18nFlagToggle.tsx` (`bi('Polski', 'English')` + `<LanguageFlagButton />`) for clean single-button SVG flag switching without layout shifts.
<!-- AGENT-TOOLKIT:END -->
