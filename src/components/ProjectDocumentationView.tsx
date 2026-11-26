import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Brain,
  Cpu,
  Flame,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  GitBranch,
  CheckCircle2,
  Archive,
  Code2,
  Zap,
} from 'lucide-react';
import {
  ARCHITECTURE_CATALOG,
  OPTIMIZER_CATALOG,
  PRECISION_CATALOG,
  TIER_1_ARCHITECTURES,
  TIER_2_LEGACY_ARCHITECTURES,
} from '../engine/architectureCatalog';
import {
  buildOverdriveEnvironment,
  DIFFICULTY_META,
  DIFFICULTY_SETTINGS,
  verifyScenarioSolvability,
} from '../engine/physics';
import { CoreDifficultyPreset } from '../engine/types';

type DocSection =
  | 'VISION_LLM'
  | 'ARCHITECTURES_MOE'
  | 'MATH_PROOFS'
  | 'OPTIMIZERS_PROTOCOL'
  | 'CODE_ENGINE';

export const ProjectDocumentationView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<DocSection>('VISION_LLM');

  const scenarioProofRows = useMemo(() => {
    const presets: Array<{
      id: string;
      title: string;
      subtitle: string;
      env: ReturnType<typeof buildOverdriveEnvironment>;
      isOverdrive?: boolean;
    }> = (['EASY', 'MEDIUM', 'HARD', 'INSANE'] as CoreDifficultyPreset[]).map(
      (diff) => ({
        id: diff,
        title: DIFFICULTY_META[diff].shortLabel,
        subtitle: DIFFICULTY_META[diff].description,
        env: DIFFICULTY_SETTINGS[diff],
      })
    );

    presets.push(
      {
        id: 'EXTRA_INSANE_115',
        title: 'Extra Insane (115% Overdrive)',
        subtitle: 'Wejście w strefę ujemnego marginesu balistycznego',
        env: buildOverdriveEnvironment(115),
        isOverdrive: true,
      },
      {
        id: 'EXTRA_INSANE_120',
        title: 'Extra Insane (120% Domyślny)',
        subtitle: 'Wymaga predykcji fazy ruchu rur i adaptacji online',
        env: buildOverdriveEnvironment(120),
        isOverdrive: true,
      },
      {
        id: 'EXTRA_INSANE_135',
        title: 'Extra Insane (135% Ekstremalny)',
        subtitle: 'Głęboki deficyt fizyczny dla testów stresu konektomu',
        env: buildOverdriveEnvironment(135),
        isOverdrive: true,
      }
    );

    return presets.map((item) => ({
      ...item,
      proof: verifyScenarioSolvability(item.env),
    }));
  }, []);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-5 space-y-5 text-slate-200">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0F172A] via-[#0B1120] to-[#111827] p-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-300">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Dokumentacja Badawcza & Architektura Systemu Flappy NeuroLab</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Od Konektomu Muszki Owocowej do Rozdzielenia Rozumowania od Wiedzy w LLM
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              To laboratorium nie służy wyłącznie do gry we Flappy Bird. Gra jest tutaj{' '}
              <strong className="text-white">
                deterministycznym poligonem fizycznym czasu rzeczywistego
              </strong>
              , w którym badamy, jak ultra-małe sieci biologiczne i rekurencyjne (13–120 parametrów)
              rozwiązują problemy nieosiągalne dla klasycznych gęstych sieci MLP — w celu
              zaprojektowania nowej generacji modeli językowych (LLM) na komputery PC, w których{' '}
              <strong className="text-emerald-300">
                warstwa rozumowania i adaptacji online jest całkowicie rozdzielona od zamrożonej warstwy wiedzy
              </strong>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs font-mono bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/90 shrink-0">
            <div>
              <div className="text-slate-400">Architektury Główne</div>
              <div className="text-base font-bold text-emerald-400">7 Tier-1 (+5 Legacy)</div>
            </div>
            <div>
              <div className="text-slate-400">Optymalizatory</div>
              <div className="text-base font-bold text-cyan-400">3 Core + 5 ES (8)</div>
            </div>
            <div>
              <div className="text-slate-400">Silnik Obliczeniowy</div>
              <div className="text-base font-bold text-amber-300">WebGPU + CPU F64</div>
            </div>
            <div>
              <div className="text-slate-400">Dowody Fizyczne</div>
              <div className="text-base font-bold text-rose-400">Easy..Extra Insane</div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Pills */}
        <div className="mt-5 flex flex-wrap gap-2 pt-4 border-t border-slate-800/80">
          {(
            [
              {
                id: 'VISION_LLM',
                label: '1. Cel Projektu: Mózg vs Wiedza (LLM)',
                icon: Brain,
              },
              {
                id: 'ARCHITECTURES_MOE',
                label: '2. Katalog Architektur, MoE i Wyspy',
                icon: Layers,
              },
              {
                id: 'MATH_PROOFS',
                label: '3. Dowody Matematyczne vs Extra Insane',
                icon: Flame,
              },
              {
                id: 'OPTIMIZERS_PROTOCOL',
                label: '4. Optymalizatory i Protokół Badawczy',
                icon: Sparkles,
              },
              {
                id: 'CODE_ENGINE',
                label: '5. Architektura Kodu i Silnik WebGPU/CUDA',
                icon: Code2,
              },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all border ${
                  active
                    ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50 shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: VISION & BRAIN VS KNOWLEDGE FOR LLMS */}
      {activeSection === 'VISION_LLM' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0B1120] p-5 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <span>Dlaczego klasyczne LLM są wolne na PC i jak rozwiązuje to Konektom Drosophila?</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              We współczesnych modelach językowych (Transformerach 7B–70B+) <strong>wiedza encyklopedyczna</strong>{' '}
              (fakty, słownictwo, składnia) jest wymieszana w tych samych gęstych macierzach wag co{' '}
              <strong>umiejętność rozumowania i podejmowania decyzji</strong>. Skutkuje to tym, że przy każdym
              generowanym słowie komputer musi mnożyć miliardy parametrów, a model po treningu jest statyczny
              i nie potrafi uczyć się nowych umiejętności w locie.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/15 p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-emerald-300">
                  WARSTWA 1: Percepcja Ciekła (T4/T5 LTC)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Komórki wzrokowe T4/T5 muszki owocowej używają równań różniczkowych o zmiennej stałej
                  czasowej <code className="text-emerald-200">τ(x)</code>. Gdy otoczenie zmienia się gwałtownie
                  (poryw wiatru, wąska rura), neuron przyspiesza swój zegar biologiczny; gdy sytuacja jest
                  stabilna, filtruje szum.
                </p>
              </div>

              <div className="rounded-lg border border-purple-500/30 bg-purple-950/15 p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-purple-300">
                  WARSTWA 2: Zamrożony Korteks Wiedzy (FlyHash + APL)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ciało Grzybowate (Mushroom Body) rzutuje sygnały na rzadką przestrzeń skojarzeniową, gdzie
                  interneuron hamujący <strong>APL</strong> zostawia tylko 25% najsilniejszych pojęć (Winner-Take-All).{' '}
                  <strong>Ta warstwa ma 0 uczonych wag</strong> — w LLM odpowiada za szybki, zamrożony indeks wiedzy.
                </p>
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-950/15 p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-amber-300">
                  WARSTWA 3: Plastyczny Rdzeń Rozumowania + Dopamina
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Malutki moduł wykonawczy (~30–60 wag) z bezpośrednią ścieżką ratunkową{' '}
                  <strong>Giant Fiber</strong> oraz <strong>3-czynnikową plastycznością Hebbowską online</strong>:{' '}
                  synapsy modyfikują się <em>w trakcie pojedynczego lotu</em> na podstawie sygnału nagrody/zaskoczenia
                  dopaminowego.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-2">
              <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                Co odkryliśmy w eksperymencie 26 700 prób (Easy vs Insane)?
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
                <li>
                  W prostych warunkach (<strong>Easy</strong>) zwykły płytki <strong>MLP (1→4→1, 13 wag)</strong>{' '}
                  osiąga 100% perfekcji (500 rur na 5 nieznanych ziarnach) już w 1. generacji (11.1 norm-ms).
                </li>
                <li>
                  W warunkach ekstremalnej nieliniowości i szumu (<strong>Insane</strong> — ruchome rury + porywy
                  wiatru + wąskie szczeliny) <strong>wszystkie klasyczne architektury (MLP, Skip, MinGRU, Ponder) spadły do 0.0% perfekcji</strong>{' '}
                  (średnio 3–13 rur).
                </li>
                <li>
                  Tylko <strong>DROSOPHILA_CONNECTOME</strong> osiągnęła <strong>29.8% pełnej perfekcji (500/500 rur)</strong>{' '}
                  oraz średnio <strong>294.7 rur</strong> w Insane — zarówno przy uczeniu CMA-ES (31.6%), GA (29.2%),
                  jak i OpenAI-ES (28.7%). Dowodzi to, że przewaga wynika z <strong>architektury obwodu biologicznego</strong>,
                  a nie z konkretnego algorytmu optymalizacji!
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Jak przetestować to na żywo w aplikacji?</span>
            </h3>
            <ol className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <li className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <strong className="text-emerald-300 block mb-0.5">
                  1. Włącz Tryb Arena Live (Widok 1: Training Lab)
                </strong>
                Na górnym pasku w Training Lab wybierz <em>Arena Live (2–12 Architektur)</em> oraz poziom trudności{' '}
                <strong>Insane</strong> lub <strong>🔥 Extra Insane</strong>. Zobaczysz na jednym ekranie, jak
                Drosophila i Fly-Cortex odjeżdżają klasycznemu MLP.
              </li>
              <li className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <strong className="text-purple-300 block mb-0.5">
                  2. Kliknij na kartę architektury w Tabeli Na Żywo
                </strong>
                Klikając na dowolny wiersz w tabeli Areny (np. <em>Fly-Cortex</em> lub <em>Hybrid MoE</em>),
                przełączasz prawy panel <em>Mózg Lidera Na Żywo</em> na podgląd neuronów i bramek tego konkretnego
                gatunku.
              </li>
              <li className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <strong className="text-rose-300 block mb-0.5">
                  3. Przesuń suwak Overdrive (100% → 145%) w Extra Insane
                </strong>
                Sprawdź, przy jakim deficycie balistycznym w pikselach (np. -18px lub -32px) nawet konektom
                muszki owocowej osiąga swój fizyczny limit.
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* SECTION 2: CATALOG OF ALL ARCHITECTURES & HYBRID MOE VS ISLANDS */}
      {activeSection === 'ARCHITECTURES_MOE' && (
        <div className="space-y-5">
          {/* Explanation of Hybrid MoE vs Island Speciation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-amber-500/35 bg-[#0B1120] p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  <span>Jak działa HYBRID_MOE (Morfogeneza 4 Ekspertów w 1 Mózgu)?</span>
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-200 border border-amber-500/30">
                  Wewnątrz 1 ptaka
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>Hybrid MoE</strong> to pojedyncza sieć neuronowa posiadająca 4 równoległe bloki ekspertów
                na pierwszej warstwie ukrytej:
              </p>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                <li>
                  <strong>1. Rdzeń MLP (Zawsze aktywny):</strong> zapewnia natychmiastowy, tani odruch liniowy.
                </li>
                <li>
                  <strong>2. LTC Fly (Czas ciągły ODE):</strong> dołączany, gdy potrzebna jest pamięć prędkości.
                </li>
                <li>
                  <strong>3. MinGRU (Bramkowana pamięć):</strong> filtruje szum sensorów i pamięta fazę rury.
                </li>
                <li>
                  <strong>4. Ponder ACT (System 2):</strong> wykonuje dodatkowe kroki myślenia w wąskich korytarzach.
                </li>
              </ul>
              <p className="text-xs text-slate-400 leading-relaxed pt-1 border-t border-slate-800">
                <strong>Mechanizm Okresu Próbnego i Rollbacku:</strong> Sieć startuje jako czysty MLP. Gdy utknie
                w stagnacji, otwiera <em>okres próbny (10 generacji)</em> dla kolejnego eksperta z miękką bramką{' '}
                <code>α = 0.05 → 1.0</code>. Jeśli zysk wyniku podzielony przez koszt FLOPs jest mniejszy niż 2%,
                ekspert jest <strong>odrzucany (Rollback)</strong>, chroniąc sieć przed niepotrzebnym rozrostem!
              </p>
            </div>

            <div className="rounded-xl border border-cyan-500/35 bg-[#0B1120] p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-cyan-300 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>Jak działa Arena Live / Island Speciation (Wyścig Gatunków)?</span>
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-200 border border-cyan-500/30">
                  Populacja podzielona na wyspy
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                W trybie <strong>Arena Live (Island Speciation)</strong> cała populacja jest dzielona na{' '}
                <strong>2–12 niezależnych wysp gatunkowych</strong> (domyślnie wszystkie 12 architektur katalogowych:
                Drosophila, Fly-Cortex, Hybrid MoE, Ponder ACT, MinGRU/SSM, Fly-LTC, MLP oraz 5 architektur Tier 2).
              </p>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                <li>
                  Każda wyspa posiada własny, odizolowany optymalizator (np. własną macierz kowariancji CMA-ES
                  dopasowaną do liczby wag danej architektury).
                </li>
                <li>
                  Wszystkie wybrane gatunki lecą <strong>jednocześnie przez ten sam tor przeszkód i te same podmuchy wiatru</strong>.
                </li>
                <li>
                  Dzięki temu widzisz na żywo na płótnie (różne kolory ptaków i etykiety nad liderami) oraz
                  w tabeli wyników, która architektura najszybciej uczy się w danej trudności fizycznej.
                </li>
              </ul>
            </div>
          </div>

          {/* 7 Tier 1 Main Architectures */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>7 Głównych Architektur Badawczych (Tier 1 — Aktywne na wierzchu UI)</span>
              </h3>
              <span className="text-xs text-slate-400">
                Reprezentują unikalne, niepokrywające się paradygmaty obliczeniowe
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {TIER_1_ARCHITECTURES.map((arch) => {
                const info = ARCHITECTURE_CATALOG[arch];
                return (
                  <div
                    key={arch}
                    className="rounded-xl border border-slate-800 bg-[#0B1120] p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: info.colorHex }}
                          />
                          <span className="font-bold text-sm text-white">
                            {info.label}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                          {info.categoryBadge}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {info.howItWorksPl}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px]">
                      <div className="font-mono text-cyan-300 bg-slate-950/80 px-2 py-1 rounded border border-slate-800/80 truncate">
                        {info.keyFormula}
                      </div>
                      <div className="text-emerald-300/90 leading-snug">
                        <strong>Werdykt:</strong> {info.empiricalVerdictPl}
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                        <span>Koszt: ~{info.flopsMultiplier}× MLP FLOPs</span>
                        <span>
                          Silnik:{' '}
                          {info.computeProfile === 'GPU_LOCKSTEP'
                            ? '◆ WebGPU Lockstep + CPU'
                            : '◇ CPU Specialized'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5 Tier 2 Legacy Architectures */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-300 flex items-center gap-2">
                <Archive className="w-4 h-4 text-slate-400" />
                <span>5 Architektur Pomocniczych / Legacy (Tier 2 — Schowane w szufladzie Zaawansowane)</span>
              </h3>
              <span className="text-xs text-slate-500">
                Zachowane dla pełnej kompatybilności wstecznej, ale zastąpione przez Tier 1
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2.5">
              {TIER_2_LEGACY_ARCHITECTURES.map((arch) => {
                const info = ARCHITECTURE_CATALOG[arch];
                return (
                  <div
                    key={arch}
                    className="rounded-lg border border-slate-800/70 bg-slate-950/60 p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-slate-200">
                        {info.shortLabel}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                        {info.flopsMultiplier}× FLOPs
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {info.summaryPl}
                    </p>
                    <p className="text-[10px] text-amber-300/80 leading-snug pt-1 border-t border-slate-800/60">
                      {info.empiricalVerdictPl}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: MATHEMATICAL SOLVABILITY PROOFS VS EXTRA INSANE */}
      {activeSection === 'MATH_PROOFS' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-5 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-400" />
              <span>
                Dowody Balistyczne (Easy..Insane) vs Nowy Poziom Extra Insane (Unproven Overdrive)
              </span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Funkcja <code className="text-cyan-300">verifyScenarioSolvability(env)</code> w pliku{' '}
              <code>src/engine/physics.ts</code> wylicza dokładnym całkowaniem Eulera klatka po klatce, czy
              w najgorszym możliwym ułożeniu dwóch kolejnych rur (skrajny skok wysokości + minimalny odstęp
              losowy 0.88× + najszybszy poryw wiatru + ruch wargi rury) ptak jest w stanie fizycznie wznieść się
              lub zanurkować do nowej szczeliny.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              W scenariuszach <strong>Easy → Insane</strong> zapas balistyczny jest zawsze dodatni (100% gwarancji
              rozwiązywalności reaktywnej). W nowym scenariuszu <strong>Extra Insane (Overdrive 115%–145%)</strong>{' '}
              celowo przekraczamy tę granicę (zapas staje się ujemny, np. <strong>-18px</strong>), aby sprawdzić,
              które architektury potrafią <strong>przewidywać fazę oscylacji rury z wyprzedzeniem</strong> zamiast
              reagować w ostatniej chwili!
            </p>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="py-2.5 px-3">Scenariusz</th>
                    <th className="py-2.5 px-3">Szczelina (Min)</th>
                    <th className="py-2.5 px-3">Prędkość + Wiatr</th>
                    <th className="py-2.5 px-3">Ruch Rur</th>
                    <th className="py-2.5 px-3">Okno Czasu (dt)</th>
                    <th className="py-2.5 px-3">Zapas Wznoszenia</th>
                    <th className="py-2.5 px-3">Zapas Nurkowania</th>
                    <th className="py-2.5 px-3">Prześwit Pasażu</th>
                    <th className="py-2.5 px-3">Status Matematyczny</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 font-mono">
                  {scenarioProofRows.map((row) => {
                    const p = row.proof;
                    return (
                      <tr
                        key={row.id}
                        className={
                          row.isOverdrive
                            ? 'bg-rose-950/15 hover:bg-rose-950/25'
                            : 'hover:bg-slate-900/50'
                        }
                      >
                        <td className="py-2.5 px-3 font-sans">
                          <div className="font-bold text-slate-100">{row.title}</div>
                          <div className="text-[10px] text-slate-400">{row.subtitle}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {row.env.gap}px (min {p.minGapPx}px)
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {row.env.pipeSpeed} (±{Math.round(row.env.speedVariability * 100)}%)
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {row.env.movingPipes ? `±${row.env.moveAmplitude}px` : 'Statyczne'}
                        </td>
                        <td className="py-2.5 px-3 text-cyan-300">{p.dtMinFrames} klatek</td>
                        <td
                          className={`py-2.5 px-3 font-bold ${
                            p.climbSlackPx >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {p.climbSlackPx >= 0 ? '+' : ''}
                          {Math.round(p.climbSlackPx)}px
                        </td>
                        <td
                          className={`py-2.5 px-3 font-bold ${
                            p.diveSlackPx >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {p.diveSlackPx >= 0 ? '+' : ''}
                          {Math.round(p.diveSlackPx)}px
                        </td>
                        <td
                          className={`py-2.5 px-3 font-bold ${
                            p.transitClearancePx > 4 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          +{Math.round(p.transitClearancePx)}px
                        </td>
                        <td className="py-2.5 px-3">
                          {p.solvable ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                              <ShieldCheck className="w-3 h-3" /> UDOWODNIONY
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-semibold">
                              <AlertTriangle className="w-3 h-3" /> OVERDRIVE (Deficyt)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: OPTIMIZERS & EXPERIMENTAL PROTOCOL */}
      {activeSection === 'OPTIMIZERS_PROTOCOL' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-5 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>8 Optymalizatorów Bezgradientowych (3 Core + 5 Extended ES/Swarm)</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Główny widok udostępnia 3 podstawowe rodziny o najwyższej skuteczności (<strong>Neuro-CMA</strong>,{' '}
                <strong>Diff. Evol.</strong> i <strong>GA</strong>), natomiast po rozwinięciu sekcji{' '}
                <em>+5 ES/Swarm</em> możesz porównać je z pięcioma klasycznymi algorytmami ewolucyjnymi i rojowymi:
              </p>
              <div className="space-y-2.5">
                {Object.values(OPTIMIZER_CATALOG).map((opt) => (
                  <div
                    key={opt.id}
                    className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-cyan-300">{opt.label}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Najlepszy dla: {opt.bestForPl}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {opt.summaryPl}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-5 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>Kwantyzacja Wag (Weight Bit Precision) — Kiedy ma znaczenie?</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Wagi sieci mogą być podczas ewaluacji rzutowane w locie na niższą precyzję bitową (symulacja
                wdrożenia na mikrokontrolery lub układy neuromorficzne). W głównym widoku protokołu domyślnie
                używamy <strong>FP32</strong>, natomiast pozostałe 5 trybów znajduje się w szufladzie{' '}
                <em>Zaawansowane / Legacy</em>:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.values(PRECISION_CATALOG).map((prec) => (
                  <div
                    key={prec.id}
                    className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5 space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-200">{prec.label}</span>
                      <span className="text-[10px] font-mono text-amber-300">
                        {prec.bitsPerWeight} b/wagę
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {prec.summaryPl}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Archiwum Wniosków Empirycznych (76,862 Prób Badawczych) */}
          <div className="rounded-xl border border-cyan-900/40 bg-gradient-to-br from-[#0B1120] via-slate-900/90 to-[#0F172A] p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-white font-display">
                    Empirical Conclusions Archive (76,862-Trial Dynamic/Ablation + 7.2k Static Runs)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Wnioski empiryczne z gigantycznej serii testowej: Solved 7 (95.8% perf, 17.3% compute) vs Unsolved 4 (82.7% compute sink)
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Pomiary historyczne n=84,062
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  1. The 82.7% Compute Sink &amp; Pipe Vy
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  7 prostszych scenariuszy osiągało <span className="font-mono text-slate-200">95.8%</span> sukcesu
                  zużywając jedynie 17.3% czasu GPU/CPU. 4 scenariusze z dynamicznie poruszającymi się przeszkodami
                  i wąskimi szczelinami (<em>Mov+Gaps, Insane, Chaos, Ext Turb</em>) pochłaniały 82.7% zasobów
                  stagnując na 0%. Kluczowe okazało się dodanie sensora prędkości pionowej przeszkody{' '}
                  <span className="font-mono text-emerald-300 font-bold">Pipe Vy</span> oraz lookaheadu{' '}
                  <span className="font-mono text-amber-300 font-bold">Next Gap ΔY</span>.
                </p>
              </div>

              <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-xs">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  2. Rozdwojenie Zestawu Sensorów (1-in vs 4-in)
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  W łatwych scenariuszach najprostszy sensor <span className="font-mono text-slate-200">1-in (Dystans do Dolnej Rury)</span>{' '}
                  osiągał 98.1% sukcesu w rekordowym czasie (442ms — <span className="text-emerald-300 font-semibold">13.5× szybciej</span> niż 5-in).
                  Jednak w trudnych warunkach 1-in zatrzymywał się na 6–14 punktach, podczas gdy modele 3-in i 4-in
                  ze świadomością wektora prędkości pozwalały na stabilny lot.
                </p>
              </div>

              <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-300 font-semibold text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  3. Wąskie Gardło G1 → Równoległy Audyt
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  <span className="font-mono text-slate-200">47.5%</span> wszystkich perfekcyjnych modeli rozwiązywało
                  zadanie już w 1. generacji (G1). Wprowadzono bezheurystyczny fast-path, wielowątkowy audyt z dedup-cache
                  oraz dedykowanego workera analityki, co wyeliminowało zacięcia interfejsu i skróciło czas weryfikacji o 70%.
                </p>
              </div>

              <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-purple-300 font-semibold text-xs">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  4. Efektywność Optymalizatorów
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Liderzy wskaźnika sukcesu: GA (99.3%), DE (99.0%), PSO (98.9%), Neuro-CMA (98.4%).
                  Mechanizm Smart Pruning automatycznie pomija nieefektywne kombinacje, a Curriculum Annealing
                  i Shaped Fitness umożliwiają przełamywanie barier w ekstremalnych turbulencjach.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: CODE ARCHITECTURE & WEBGPU / CUDA ENGINE */}
      {activeSection === 'CODE_ENGINE' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-5 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>Modularna Architektura Kodu (Podział Odpowiedzialności)</span>
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-emerald-300 font-bold">src/engine/architectureCatalog.ts</div>
                <div className="text-slate-400 font-sans mt-0.5">
                  Jedno źródło prawdy o 7 architekturach Tier 1, 5 architekturach Tier 2 (12 łącznie), kolorach
                  Areny, opisach matematycznych oraz 8 optymalizatorach (3 Core + 5 Extended).
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-cyan-300 font-bold">
                  src/engine/physics.ts, neuralNetwork.ts & sensors.ts
                </div>
                <div className="text-slate-400 font-sans mt-0.5">
                  Deterministyczna fizyka Eulera (60 Hz), PRNG Mulberry32, dowody rozwiązywalności{' '}
                  <code>verifyScenarioSolvability</code>, siatkówka <code>16-Ray Ommatidia</code> (L1/L2 ΔI + T4/T5)
                  oraz forward-pass wszystkich 12 architektur.
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-amber-300 font-bold">
                  src/engine/webgpuEvaluator.ts, gpu.worker.ts & researchPool.ts
                </div>
                <div className="text-slate-400 font-sans mt-0.5">
                  8-tierowy dynamiczny pipeline WGSL (<code>TIER_8_12</code> → <code>DENSE_64</code>) ze Startup
                  Auto-Tunerem i ochroną Windows TDR, fallback WebGL2, plus wielowątkowy audyt Float64 na CPU i zegar
                  profilera odporny na pauzę (<code>perfProfiler.ts</code>).
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-purple-300 font-bold">
                  ArenaLeaderboardPanel.tsx & ResearchProtocolConfigurator.tsx
                </div>
                <div className="text-slate-400 font-sans mt-0.5">
                  Interfejs wyścigu 2–12 architektur na żywo w Training Lab oraz 3-krokowy konfigurator eksperymentów
                  z adaptacyjnym estymatorem t/s i ETA w <code>ResearchHeaderAndProgress.tsx</code>.
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-5 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Dlaczego Diagnostyka ETA i Hybrydowy Silnik (WebGPU + CPU) działają szybko?</span>
            </h3>
            <ul className="text-xs text-slate-300 space-y-2.5 list-disc list-inside leading-relaxed">
              <li>
                <strong>Auto-Tuner A/B/C (CPU vs GPU vs HYBRID):</strong> Przed startem dużego eksperymentu
                silnik mierzy rzeczywistą przepustowość (<code>M ticks/s</code>) oraz opóźnienie pętli zdarzeń (<code>loopLag</code>),
                a zegar aktywny (<code>perfProfiler.ts</code>) automatycznie wyklucza przerwy w pauzie z kalkulacji prędkości i ETA.
              </li>
              <li>
                <strong>8-Tier WebGPU WGSL + Audyt Float64 CPU:</strong> Karty graficzne liczą w precyzji{' '}
                <code>f32</code>. Każdy kandydat osiągający próg milowy (np. ≥25 rur) jest weryfikowany na nieznanych
                ziarnach w pełnej precyzji <code>Float64</code> przez pomocnicze wątki CPU (<code>Audit Helpers</code>).
              </li>
              <li>
                <strong>Dynamiczny Estymator ETA &amp; Niezmienniczość Przyspieszenia:</strong> Suwaki prędkości
                (<code>1x..500x..MAX</code>) oraz suwak obciążenia GPU regulują wyłącznie liczbę kroków dyskretnych na klatkę —
                trajektorie, mutacje i wyniki są identyczne niezależnie od przyspieszenia.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
