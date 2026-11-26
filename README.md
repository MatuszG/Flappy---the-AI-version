# Flappy NeuroLab — WebGPU & Multi-Worker Neuroevolution Research Suite

Interactive neuroevolution laboratory and factorial sweep engine with **8-tier dynamic WebGPU WGSL compute shaders** (up to 64 neurons/layer), **multi-worker IEEE-754 `f64` CPU verification**, **12 neural architectures** (`MLP`, `Drosophila Connectome`, `Decoupled Fly-Cortex`, `Hybrid MoE`, `Ponder ACT`, `Selective SSM / MinGRU`, `Fly-LTC`, `Residual Skip`, `NeuroChem Gate`, `Synaptic STP`, `Looped Reasoner`, `Latent Rollout`), and **8 evolutionary optimizers** (`Neuro-CMA`, `Differential Evolution`, `GA`, `Natural ES`, `Adam-ES`, `Adaptive ES`, `CEM`, `PSO`).

---

## 1. Praca z Git i Rozwój w GitHub (Git Workflow)

Repozytorium jest skonfigurowane jako w pełni przenośny projekt (100% client-side, `base: './'` w `vite.config.ts`) gotowy do pracy zespołowej i wieloagentowej (`AGENTS.md` dla Claude Code, Cursor, GitHub Copilot, Windsurf, AI Studio):

```bash
# 1. Inicjalizacja / podpięcie własnego repozytorium GitHub
git init
git add .
git commit -m "feat: initial Flappy NeuroLab release"
git branch -M main
git remote add origin https://github.com/<TWOJ-LOGIN>/<TWOJE-REPO>.git
git push -u origin main
```

### Lokalny development i weryfikacja przed commitem
```bash
npm install
npm run dev           # Serwer deweloperski na http://localhost:3000
npm run lint          # Ścisła kontrola typów TypeScript (tsc --noEmit)
npm run test:engine   # Deterministyczne testy fizyki i neuroewolucji
npm run build         # Produkcyjna paczka w dist/
npm run verify:ui     # Zrzuty ekranu UI i testy układu w Playwright (wymaga Chromium)
```

---

## 2. Uruchomienie Aplikacji na Żywo na GitHubie (GitHub Pages)

Każdy `git push` na gałąź `main` automatycznie uruchamia workflow `.github/workflows/ci-and-pages.yml`:
1. W swoim repozytorium na GitHubie wejdź w **Settings → Pages**.
2. W sekcji **Build and deployment → Source** wybierz **GitHub Actions**.
3. Po zakończeniu akcji aplikacja działa na żywo pod adresem:
   `https://<TWOJ-LOGIN>.github.io/<TWOJE-REPO>/`

---

## 3. Budowanie Programu Desktop (`.exe` / `.msi` / `.dmg` / `.AppImage`) oraz Android (`.apk`)

Repozytorium zawiera gotową konfigurację **Tauri v2** (`/src-tauri/tauri.conf.json` z flagami WebGPU `--enable-unsafe-webgpu --disable-gpu-watchdog`) oraz **Capacitor Android** (`/capacitor.config.json` + `/scripts/build-android-apk.mjs`).

### Opcja A: Budowanie w chmurze GitHub Actions (1 kliknięciem — bez instalowania Rusta i Android Studio!)
Wystarczy wejść na GitHubie w zakładkę **Actions → Build Android (.apk) & Desktop (.exe / .dmg / .AppImage)** i kliknąć **Run workflow** (lub wypchnąć tag `git tag v1.0.0 && git push --tags`):
- **Android `.apk`**: Job `build-android-apk` automatycznie kompiluje plik **`Flappy-NeuroLab-android.apk`** gotowy do pobrania z sekcji *Artifacts* i zainstalowania na telefonie.
- **Windows / macOS / Linux**: Job `build-desktop-app` buduje natywne instalatory **`.exe` / `.msi` (Windows)**, **`.dmg` (macOS)** oraz **`.AppImage` / `.deb` (Linux)**.

### Opcja B: Budowanie lokalnie na własnym komputerze

#### Android (`.apk`)
Wymaga zainstalowanego JDK 21 oraz Android SDK (`ANDROID_HOME`):
```bash
npm run android:apk
# Gotowy plik instalacyjny pojawi się w głównym katalogu jako:
# ./Flappy-NeuroLab-android.apk
```

#### Desktop (Windows `.exe` / macOS `.dmg` / Linux `.AppImage`)
Wymaga zainstalowanego kompilatora Rust (`https://rustup.rs`):
```bash
npm run desktop:dev     # Uruchomienie w natywnym oknie desktopowym na żywo
npm run desktop:build   # Kompilacja instalatora w src-tauri/target/release/bundle/
```

---

## 4. Zapis Danych, Historia Badań i GitHub Research Data Lake

Aplikacja działa w 100% po stronie przeglądarki (GitHub Pages to statyczny hosting tylko do odczytu), a dane zapisują się w dwóch warstwach:
- **Lokalnie w przeglądarce**:
  - **Play & Training Lab (`localStorage`)**: tabela najlepszych graczy (Play Leaderboard), historia gier, zapisane sieci mistrzów (**Zapisane Sieci / Saved Brains** z eksportem/importem pojedynczego mózgu `.json`) oraz wybrany język `PL/EN`.
  - **Research Lab (`IndexedDB`: `flappy-neurolab-autosave-v1`)**: automatyczny zapis aktywnego sweepu co `20s` (konfigurowalny w panelu `Sprzęt`), po każdych `≥250` nowych próbach oraz przy pauzie/zakończeniu, wraz z archiwum do 120 biegów w **Historia Runów (Run History)** i eksportem/importem `dataset.json` / `.jsonl` / Google Colab.
- **Globalnie na GitHubie (`research-data/runs/` → `GitHub Lake`)**:
  - Aby zapisać wyniki na GitHubie, wyeksportuj w **Raport & Eksport** plik `LLM Pack (.jsonl + MD)` (lub `dataset.json`), umieść go w `research-data/runs/<YYYY-MM-DD-etykieta>/trials.jsonl` i wykonaj `git push`.
  - Workflow `.github/workflows/analyze-research.yml` uruchomi `npm run lake:sync`, zdeduplikuje wszystkie próby po `trialSignature`, zaktualizuje raporty `research-data/LEADERBOARD.md`, `ai-delta-digest.md`, `llm-meta-dossier.md` oraz wygeneruje `public/data/research-lake.json`, który aplikacja ładuje jednym kliknięciem przyciskiem **`GitHub Lake`**.
