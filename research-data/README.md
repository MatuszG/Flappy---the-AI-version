# Flappy NeuroLab — Research Data Lake (`research-data/`)

Ten katalog działa jak darmowa, wersjonowana w Gicie baza wszystkich eksperymentów z NeuroLab (z przeglądarki, Desktop `.exe`, Android `.apk` oraz Google Colab).

## Jak dodać wyniki nowego biegu?
1. W aplikacji wejdź w **Raport & Eksport → LLM Pack (.jsonl + MD)** (lub wyeksportuj `trials.jsonl` / `dataset.json` z Colaba).
2. Wrzuć plik do nowego podkatalogu:
   ```text
   research-data/runs/YYYY-MM-DD-nazwa-biegu/trials.jsonl
   ```
3. Zrób `git push` — workflow `.github/workflows/analyze-research.yml` automatycznie:
   - scali i zdeduplikuje wszystkie próby po `trialSignature`,
   - wygeneruje zaktualizowane raporty **`LEADERBOARD.md`**, **`ai-delta-digest.md`** (~2k tokenów) oraz **`llm-meta-dossier.md`**,
   - opublikuje plik **`public/data/research-lake.json`**, który można załadować jednym kliknięciem prosto w aplikacji na GitHub Pages (**GitHub Archive**).

## Ręczna synchronizacja lokalna
```bash
npm run lake:sync
```
