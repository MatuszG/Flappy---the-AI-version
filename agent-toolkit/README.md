# Universal Agent Toolkit (`agent-toolkit`)

Gotowe repozytorium-paczka łączące najlepsze narzędzia wypracowane podczas budowy **Flappy NeuroLab**, zaprojektowane tak, aby jednym poleceniem działało w **Google AI Studio**, **Claude Code**, **Cursor**, **Windsurf** oraz lokalnych projektach React/Vite/Next.js.

---

## Co jest już w sieci (Open Source), a co daje nasza paczka?

W ekosystemie AI Coding Agents istnieją obecnie 3 główne podejścia:
1. **`@playwright/mcp` (Microsoft Playwright MCP)** oraz **`chrome-devtools-mcp`** — serwery MCP dla Claude Desktop / Cursor. Ich wadą jest to, że **nie działają wewnątrz kontenera Google AI Studio** (gdzie nie można podpiąć zewnętrznego serwera MCP do konfiguracji IDE) i zużywają bardzo dużo tokenów na drzewo dostępności (Accessibility Tree).
2. **`lackeyjb/playwright-skill` / `agent-browser`** — lekkie skille CLI dla Claude Code do robienia screenshotów przez Playwrighta, ale bez automatycznego audytu geometrii DOM (uciętych tekstów `scrollWidth > clientWidth`, nachodzących na siebie przycisków) i bez narzędzi zapobiegających OOM w Workerach / IndexedDB.
3. **`universal-agent-toolkit` (ten katalog)** — działa **wszędzie** (w tym w **Google AI Studio** przez `run_command` + `view_file` na plikach `.png` oraz przez automatyczne wstrzyknięcie reguł do `AGENTS.md`, które AI Studio ładuje jako `<user_rules>`).

---

## Co instaluje `agent-toolkit` po uruchomieniu `install`?

1. **`scripts/verify-ui.mjs` (`npm run verify:ui`)**:
   - Automatycznie wykrywa działający serwer (`:3000`, `:5173`, `:4173`) lub sam podnosi tymczasowy serwer w tle.
   - Automatycznie wykrywa zakładki nawigacyjne (`header nav button`, `[role="tab"]`), przeklikuje je i zapisuje zrzuty ekranu Desktop (`1440x900`) oraz Mobile (`390x844`) do `.ui-screenshots/`.
   - Sprawdza geometrię DOM pod kątem:
     - błędów `pageerror` i `console.error`,
     - poziomego rozjechania strony (`HORIZONTAL_PAGE_OVERFLOW`),
     - uciętych tekstów w przyciskach/badge'ach (`CLIPPED_TEXT`: `scrollWidth > clientWidth + 6`),
     - nachodzących na siebie przycisków (`ELEMENT_OVERLAP`).
   - Zapisuje raport `.ui-screenshots/report.json`, a agent ogląda wygenerowane `.png` bezpośrednio narzędziem `view_file`.
2. **`src/toolkit/runtimeWatchdog.ts`**:
   - `safeMax` / `safeMin` — iteracyjne maksimum/minimum odporne na `RangeError: Maximum call stack size exceeded` przy tablicach >65 tys. elementów.
   - `stripHeavyFieldsForWorkerIpc` — odchudzanie ciężkich obiektów przed `worker.postMessage(...)`, chroniące przed skokami RAM i przeładowaniem karty Chrome.
   - `createQueuedAsyncSaver` — strażnik zapisu do IndexedDB gwarantujący, że końcowy zapis (`COMPLETED`) nigdy nie zostanie pominięty, gdy w tle trwa okresowy autozapis.
   - `EventLoopWatchdog` — lekki licznik lagów głównego wątku (`avgLagMs`, `maxLagMs`, `spikesOver40Ms`) o stałym zużyciu pamięci O(1).
3. **`src/toolkit/workspaceSync.ts`**:
   - Eksport i import całego stanu aplikacji (`localStorage` + dodatkowe dane) do jednego pliku `.json` jednym przyciskiem.
4. **`src/toolkit/i18nFlagToggle.tsx`**:
   - Dwujęzyczny kontekst `PL | EN` (`bi('Polski', 'English')`) z pojedynczym przyciskiem flagi SVG (`<LanguageFlagButton />`), który po kliknięciu zmienia flagę i język.
5. **`AGENTS.md` + `CLAUDE.md` + `.claude/skills/universal-agent-toolkit/SKILL.md`**:
   - Automatycznie wstrzykuje reguły dla wszystkich agentów AI.

---

## Jak wypchnąć to jako własne globalne repozytorium na GitHub?

Wystarczy wypchnąć zawartość folderu `agent-toolkit/` do nowego repozytorium na swoim GitHubie (np. `github.com/twoj-login/agent-toolkit`):

```bash
cd agent-toolkit
git init
git add .
git commit -m "Initial commit: Universal Agent Toolkit"
git branch -M main
git remote add origin https://github.com/<twoj-login>/agent-toolkit.git
git push -u origin main
```

Od tej chwili w **dowolnym nowym lub istniejącym projekcie** (w Google AI Studio, Claude Code, Cursorze czy terminalu) wystarczy uruchomić:

```bash
# Instalacja wszystkich narzędzi + reguł AGENTS.md w projekcie:
npx -y github:<twoj-login>/agent-toolkit install

# (Opcjonalnie) Instalacja razem z pobraniem binarki Playwright Chromium:
npx -y github:<twoj-login>/agent-toolkit install --with-browser

# (Opcjonalnie) Instalacja jako globalny Skill w ~/.claude/skills/ dla Claude Code:
npx -y github:<twoj-login>/agent-toolkit install-global-skill
```
