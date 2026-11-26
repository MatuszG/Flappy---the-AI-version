import type {
  ComputeProfileKind,
  LearningAlgorithm,
  NetworkArchitecture,
  WeightPrecision,
} from './types';

/**
 * Tier 1 — Primary architectures surfaced directly on the main UI.
 * Empirically validated across 26,700 trials + specialized biological & LLM-cortex prototypes.
 */
export const TIER_1_ARCHITECTURES: readonly NetworkArchitecture[] = [
  'MLP',
  'DROSOPHILA_CONNECTOME',
  'DECOUPLED_FLY_CORTEX',
  'HYBRID_MOE',
  'PONDER_ACT',
  'SELECTIVE_SSM',
  'LTC_FLY',
] as const;

/**
 * Tier 2 — Additional recurrent, synaptic-plasticity, and world-model architectures.
 */
export const TIER_2_LEGACY_ARCHITECTURES: readonly NetworkArchitecture[] = [
  'RESIDUAL_SKIP',
  'NEUROCHEM_GATE',
  'SYNAPTIC_STP',
  'LOOPED_REASONER',
  'LATENT_ROLLOUT',
] as const;

/**
 * Complete list of all 12 neural architectures available in Training Stage and Live Arena.
 */
export const ALL_CATALOG_ARCHITECTURES: readonly NetworkArchitecture[] = [
  ...TIER_1_ARCHITECTURES,
  ...TIER_2_LEGACY_ARCHITECTURES,
] as const;

/**
 * Core 6 flagship architectures preset for quick Arena filtering.
 */
export const CORE_6_ARENA_SPECIES: readonly NetworkArchitecture[] = [
  'DROSOPHILA_CONNECTOME',
  'DECOUPLED_FLY_CORTEX',
  'HYBRID_MOE',
  'PONDER_ACT',
  'SELECTIVE_SSM',
  'MLP',
] as const;

/**
 * Default competing architectures for the Live Multi-Architecture Arena in Training Lab (all 12).
 */
export const DEFAULT_ARENA_SPECIES: readonly NetworkArchitecture[] = [
  ...ALL_CATALOG_ARCHITECTURES,
] as const;

export interface ArchitectureCatalogEntry {
  id: NetworkArchitecture;
  tier: 'TIER_1' | 'TIER_2_LEGACY';
  shortLabel: string;
  fullNamePl: string;
  badgePl: string;
  badgeEn: string;
  colorHex: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  computeProfile: ComputeProfileKind;
  whatItDoesPl: string;
  whenToUsePl: string;
  empiricalVerdictPl: string;
  formulaSummary: string;
  label: string;
  categoryBadge: string;
  summaryPl: string;
  howItWorksPl: string;
  keyFormula: string;
  flopsMultiplier: number;
}

interface RawArchitectureCatalogEntry {
  id: NetworkArchitecture;
  tier: 'TIER_1' | 'TIER_2_LEGACY';
  shortLabel: string;
  fullNamePl: string;
  badgePl: string;
  badgeEn: string;
  colorHex: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  computeProfile: ComputeProfileKind;
  whatItDoesPl: string;
  whenToUsePl: string;
  empiricalVerdictPl: string;
  formulaSummary: string;
}

const RAW_ARCHITECTURE_CATALOG: Record<
  NetworkArchitecture,
  RawArchitectureCatalogEntry
> = {
  MLP: {
    id: 'MLP',
    tier: 'TIER_1',
    shortLabel: 'MLP',
    fullNamePl: 'Standard MLP (Punkt Odniesienia)',
    badgePl: 'Bazowy · Bez pamięci',
    badgeEn: 'Baseline · Stateless',
    colorHex: '#38BDF8',
    borderClass: 'border-sky-500/50',
    bgClass: 'bg-sky-500/15',
    textClass: 'text-sky-200',
    computeProfile: 'GPU_LOCKSTEP',
    whatItDoesPl:
      'Klasyczna sieć jednokierunkowa (Feed-Forward tanh) bez stanu wewnętrznego. Reaguje wyłącznie na bieżącą klatkę.',
    whenToUsePl:
      'Najlepsza na łatwych i statycznych torach (Easy/Medium) jako ultra-szybki punkt odniesienia (rozwiązuje Easy w 1. generacji przy 13 wagach).',
    empiricalVerdictPl:
      'Mistrz kompresji wiedzy w Easy (38.5 rur/parametr), ale bezradny w Insane/Extra Insane przez brak pamięci fazowej.',
    formulaSummary: 'h_l = tanh(W_l · h_{l-1} + b_l)',
  },
  DROSOPHILA_CONNECTOME: {
    id: 'DROSOPHILA_CONNECTOME',
    tier: 'TIER_1',
    shortLabel: 'Drosophila',
    fullNamePl: 'Drosophila Connectome (Mózg Muszki Owocowej)',
    badgePl: 'Lider Frontier · Bio-GPU',
    badgeEn: 'Frontier Leader · Bio-GPU',
    colorHex: '#F59E0B',
    borderClass: 'border-amber-500/55',
    bgClass: 'bg-amber-500/15',
    textClass: 'text-amber-200',
    computeProfile: 'GPU_LOCKSTEP',
    whatItDoesPl:
      'Biologiczny 4-częściowy obwód lotu Drosophila melanogaster: detektory ruchu T4/T5 (LTC) + rzadkie kodowanie Mushroom Body APL (hamowanie boczne) + modulacja oktopaminą + bezpośredni odruch ucieczki Giant Fiber.',
    whenToUsePl:
      'Główny wybór na ekstremalne warunki (Hard, Insane, Extra Insane). Posiada natywny kernel WebGPU (archCode=9) oraz CUDA C++.',
    empiricalVerdictPl:
      'Zdeklasował klasyczne architektury w reżimie Insane dzięki rozdzieleniu szybkiego odruchu Giant Fiber od rzadkiej reprezentacji stanu.',
    formulaSummary:
      'T4/T5 LTC(τ) → APL WTA Inhibition → Octopamine Gain + Giant Fiber Bypass',
  },
  DECOUPLED_FLY_CORTEX: {
    id: 'DECOUPLED_FLY_CORTEX',
    tier: 'TIER_1',
    shortLabel: 'Fly-Cortex',
    fullNamePl: 'Decoupled Fly-Cortex (Prototyp Rozumowanie vs Wiedza)',
    badgePl: 'Prototyp LLM · Online DA',
    badgeEn: 'LLM Prototype · Online DA',
    colorHex: '#10B981',
    borderClass: 'border-emerald-500/55',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-200',
    computeProfile: 'CPU_SPECIALIZED',
    whatItDoesPl:
      'Oddziela mały Rdzeń Rozumowania Wykonawczego (LTC + Giant Fiber + bramka zaskoczenia System-1/2) od 16-slotowego Banku Pamięci Skojarzeniowej FlyHash APL aktualizowanego w locie dopaminą (Online Plasticity).',
    whenToUsePl:
      'Do badań nad nowymi architekturami typu LLM na PC oraz adaptacji w czasie rzeczywistym (surowe piksele oka złożonego + anomalie grawitacji w trakcie lotu).',
    empiricalVerdictPl:
      'Potwierdza, że mała warstwa rozumowania potrafi adaptować się w ułamku sekundy bez kosztownego przeliczania całej warstwy wiedzy.',
    formulaSummary:
      'y = ExecCore(x) + Σ_{i∈Top2(FlyHash(x))} w_i · M[i],  ΔM[i] = η · δ_DA · e_i',
  },
  HYBRID_MOE: {
    id: 'HYBRID_MOE',
    tier: 'TIER_1',
    shortLabel: 'Hybrid MoE',
    fullNamePl: 'Hybrid Mixture of Experts (Router 4 Modułów)',
    badgePl: 'Auto-Router · Kontrola FLOPs',
    badgeEn: 'Auto-Router · FLOPs Budget',
    colorHex: '#EC4899',
    borderClass: 'border-pink-500/50',
    bgClass: 'bg-pink-500/15',
    textClass: 'text-pink-200',
    computeProfile: 'CPU_SPECIALIZED',
    whatItDoesPl:
      'Pojedynczy mózg, który startuje jako szybki MLP i w miarę potrzeby dynamicznie dołącza 3 wyspecjalizowanych ekspertów (LTC Fly, MinGRU SSM, Ponder ACT) sterowanych bramką Softmax Router z kontrolą zwrotu z FLOPs (ROI Rollback).',
    whenToUsePl:
      'Gdy nie wiesz z góry, jak trudne jest środowisko, i chcesz, aby sieć sama dobrała minimalny zestaw modułów bez marnowania FLOPs.',
    empiricalVerdictPl:
      'Utrzymuje niski koszt obliczeniowy w łatwych fazach i aktywuje ekspertów czasowych tylko przy ruchomych rurach i porywach wiatru.',
    formulaSummary:
      'y = g_0·MLP(x) + Σ_{k∈{LTC,SSM,ACT}} g_k·α_k·Expert_k(x),  g = Softmax(W_r·x)',
  },
  PONDER_ACT: {
    id: 'PONDER_ACT',
    tier: 'TIER_1',
    shortLabel: 'Ponder ACT',
    fullNamePl: 'Ponder ACT (System-1 / System-2 Adaptive Compute)',
    badgePl: 'System 1/2 · Surprise Gate',
    badgeEn: 'System 1/2 · Surprise Gate',
    colorHex: '#A855F7',
    borderClass: 'border-purple-500/50',
    bgClass: 'bg-purple-500/15',
    textClass: 'text-purple-200',
    computeProfile: 'GPU_LOCKSTEP',
    whatItDoesPl:
      'Sieć rekurencyjna ze współdzielonymi wagami i wyuczoną bramką zatrzymania (Halting Gate) wyzwalaną błędem predykcji: w spokojnym locie wykonuje 1 szybki krok (System-1), a w niebezpieczeństwie do K kroków głębokiego namysłu (System-2).',
    whenToUsePl:
      'Do badania alokacji budżetu obliczeniowego Test-Time Compute (myśl dłużej tylko wtedy, gdy rośnie zaskoczenie fizyczne).',
    empiricalVerdictPl:
      'Oszczędza ~65% FLOPs względem sztywnego Looped Reasonera przy zachowaniu pełnej głębokości decyzyjnej w ciasnych oknach.',
    formulaSummary:
      'h^{(k)} = tanh(W·h^{(k-1)} + x),  stop when p_halt(h^{(k)}, surprise) > θ',
  },
  SELECTIVE_SSM: {
    id: 'SELECTIVE_SSM',
    tier: 'TIER_1',
    shortLabel: 'MinGRU / SSM',
    fullNamePl: 'Selective SSM / MinGRU (Mamba State-Space)',
    badgePl: 'Pamięć Fazowa · Liniowy SSM',
    badgeEn: 'Phase Memory · Linear SSM',
    colorHex: '#06B6D4',
    borderClass: 'border-cyan-500/50',
    bgClass: 'bg-cyan-500/15',
    textClass: 'text-cyan-200',
    computeProfile: 'GPU_LOCKSTEP',
    whatItDoesPl:
      'Nowoczesna komórka przestrzeni stanów (inspirowana Mamba / MinGRU) z selektywną bramką zapominania z_t zależną od wejścia. Błyskawicznie resetuje pamięć po minięciu rury i śledzi fazę oscylacji.',
    whenToUsePl:
      'Przy ruchomych rurach i zmiennym wietrze, gdzie potrzebna jest czysta, szybka pamięć sekwencyjna działająca w pełnym Lockstepie na GPU.',
    empiricalVerdictPl:
      'Najbardziej stabilna klasyczna architektura sekwencyjna na GPU o niskim narzucie parametrów (+2 wagi/neuron).',
    formulaSummary:
      'z_t = σ(w_z·x_t + b_z),  h_t = (1 - z_t)⊙h_{t-1} + z_t⊙tanh(W·x_t)',
  },
  LTC_FLY: {
    id: 'LTC_FLY',
    tier: 'TIER_1',
    shortLabel: 'Fly-LTC',
    fullNamePl: 'Liquid Time-Constant Network (Ciekła Stała Czasowa)',
    badgePl: 'Ciągły Czas ODE · τ(x)',
    badgeEn: 'Continuous ODE · τ(x)',
    colorHex: '#F97316',
    borderClass: 'border-orange-500/50',
    bgClass: 'bg-orange-500/15',
    textClass: 'text-orange-200',
    computeProfile: 'GPU_LOCKSTEP',
    whatItDoesPl:
      'Sieć oparta o równania różniczkowe błony neuronowej ze zmienną stałą czasową τ. Potrafi sama wyliczyć prędkość rury i opadania z samej historii pozycji.',
    whenToUsePl:
      'Gdy sieć ma ograniczoną liczbę sensorów (np. brak jawnego sensora prędkości) lub działa w płynnie zmieniającej się fizyce.',
    empiricalVerdictPl:
      'Fundament warstwy wzrokowej w Drosophila Connectome; świetna ciągła dynamika czasowa.',
    formulaSummary: 'dh/dt = -h/τ + f(x, h),  h_t = (1 - α_τ)·h_{t-1} + α_τ·tanh(z_t)',
  },

  // ==================== TIER 2: ADDITIONAL RECURRENT / PLASTICITY / WORLD-MODEL ====================
  RESIDUAL_SKIP: {
    id: 'RESIDUAL_SKIP',
    tier: 'TIER_2_LEGACY',
    shortLabel: 'Res-Skip',
    fullNamePl: 'Residual Skip Connection',
    badgePl: 'Skrót liniowy · Skip',
    badgeEn: 'Linear Shortcut · Skip',
    colorHex: '#818CF8',
    borderClass: 'border-indigo-500/50',
    bgClass: 'bg-indigo-500/15',
    textClass: 'text-indigo-200',
    computeProfile: 'GPU_LOCKSTEP',
    whatItDoesPl:
      'Dodaje bezpośrednie połączenie liniowe wejście→wyjście omijające warstwy ukryte.',
    whenToUsePl:
      'Gdy potrzebujesz połączenia szybkiego odruchu liniowego z nieliniową korektą głębszych warstw ukrytych.',
    empiricalVerdictPl:
      'Przyspiesza początkowy sygnał gradientowy w głębszych sieciach (D2–D4).',
    formulaSummary: 'y = σ(W_out·h_L + W_skip·x + b)',
  },
  NEUROCHEM_GATE: {
    id: 'NEUROCHEM_GATE',
    tier: 'TIER_2_LEGACY',
    shortLabel: 'NeuroChem',
    fullNamePl: 'Neurochemical Gain Gate',
    badgePl: 'Modulacja wzmocnienia',
    badgeEn: 'Gain Neuromodulation',
    colorHex: '#2DD4BF',
    borderClass: 'border-teal-500/50',
    bgClass: 'bg-teal-500/15',
    textClass: 'text-teal-200',
    computeProfile: 'GPU_LOCKSTEP',
    whatItDoesPl:
      'Powolny stan neuromodulatora skalujący czułość (gain) każdego neuronu ukrytego.',
    whenToUsePl:
      'Do badania adaptacji pobudzenia sieci przy nagłych zmianach prędkości i grawitacji.',
    empiricalVerdictPl:
      'Wprowadza pamięć pobudzenia (+3 parametry na neuron) działającą w pełnym GPU Lockstep.',
    formulaSummary: 'm_t = (1-β)m_{t-1} + β|z_t|,  h_t = tanh((1 + γ·m_t)·z_t)',
  },
  SYNAPTIC_STP: {
    id: 'SYNAPTIC_STP',
    tier: 'TIER_2_LEGACY',
    shortLabel: 'Syn-STP',
    fullNamePl: 'Short-Term Synaptic Plasticity (Tsodyks-Markram)',
    badgePl: 'Plastyczność STP',
    badgeEn: 'STP Plasticity',
    colorHex: '#FB7185',
    borderClass: 'border-rose-500/50',
    bgClass: 'bg-rose-500/15',
    textClass: 'text-rose-200',
    computeProfile: 'GPU_LOCKSTEP',
    whatItDoesPl:
      'Modeluje biofizyczne wyczerpywanie pęcherzyków synaptycznych i facylitację wapniową w trakcie lotu.',
    whenToUsePl:
      'Do porównań biofizycznej plastyczności krótkoterminowej z pamięcią dopaminową FlyHash.',
    empiricalVerdictPl:
      'Automatycznie tłumi powtarzalne pobudzenia i wzmacnia nagłe zmiany bodźców.',
    formulaSummary: 'u_t = u_{t-1} + U(1-u_{t-1}),  h_t = tanh(u_t · z_t)',
  },
  LOOPED_REASONER: {
    id: 'LOOPED_REASONER',
    tier: 'TIER_2_LEGACY',
    shortLabel: 'Loop-K',
    fullNamePl: 'Fixed-Depth Looped Reasoner (Universal Transformer)',
    badgePl: 'Stałe K pętli · Rekurencja',
    badgeEn: 'Fixed K-Loop · Recurrent',
    colorHex: '#C084FC',
    borderClass: 'border-purple-400/50',
    bgClass: 'bg-purple-500/15',
    textClass: 'text-purple-200',
    computeProfile: 'GPU_LOCKSTEP',
    whatItDoesPl:
      'Wykonuje stałą liczbę K pętli rekurencyjnych na tych samych wagach w każdej klatce.',
    whenToUsePl:
      'Do badania głębokiego rozumowania przy bardzo małym budżecie wag oraz jako punkt odniesienia dla Ponder ACT.',
    empiricalVerdictPl:
      'Pozwala płytkiej sieci (np. 4 neurony) symulować wielowarstwowe przetwarzanie poprzez iterację w czasie.',
    formulaSummary: 'h^{(k)} = tanh(W·h^{(k-1)} + z_0)  for k=1..K',
  },
  LATENT_ROLLOUT: {
    id: 'LATENT_ROLLOUT',
    tier: 'TIER_2_LEGACY',
    shortLabel: 'Rollout',
    fullNamePl: 'Counterfactual Latent World-Model Rollout',
    badgePl: 'Model Świata · 2 ścieżki',
    badgeEn: 'World Model · 2-Path',
    colorHex: '#EAB308',
    borderClass: 'border-yellow-500/50',
    bgClass: 'bg-yellow-500/15',
    textClass: 'text-yellow-200',
    computeProfile: 'GPU_LOCKSTEP',
    whatItDoesPl:
      'Symuluje w przestrzeni ukrytej dwie alternatywne przyszłości (SKOK vs SZYBOWANIE) i wybiera stan o wyższej wartości V.',
    whenToUsePl:
      'Do badania jawnego planowania kontrfaktycznego (World Model) wewnątrz pojedynczej klatki.',
    empiricalVerdictPl:
      'Ciekawy model predykcyjny porównujący dwie trajektorie przed podjęciem decyzji o skoku.',
    formulaSummary: 'ΔV = V(Rollout_JUMP(h_t)) - V(Rollout_WAIT(h_t))',
  },
};

const ARCH_FLOPS_MAP: Record<NetworkArchitecture, number> = {
  MLP: 1.0,
  DROSOPHILA_CONNECTOME: 1.8,
  DECOUPLED_FLY_CORTEX: 2.1,
  HYBRID_MOE: 1.6,
  PONDER_ACT: 2.2,
  SELECTIVE_SSM: 1.3,
  LTC_FLY: 1.4,
  RESIDUAL_SKIP: 1.1,
  NEUROCHEM_GATE: 1.3,
  SYNAPTIC_STP: 1.4,
  LOOPED_REASONER: 3.0,
  LATENT_ROLLOUT: 2.8,
};

export const ARCHITECTURE_CATALOG: Record<
  NetworkArchitecture,
  ArchitectureCatalogEntry
> = Object.fromEntries(
  Object.entries(RAW_ARCHITECTURE_CATALOG).map(([k, v]) => {
    const archKey = k as NetworkArchitecture;
    return [
      archKey,
      {
        ...v,
        label: v.fullNamePl,
        categoryBadge: v.badgePl,
        summaryPl: v.whatItDoesPl,
        howItWorksPl: v.whenToUsePl,
        keyFormula: v.formulaSummary,
        flopsMultiplier: ARCH_FLOPS_MAP[archKey] ?? 1.2,
      },
    ];
  })
) as Record<NetworkArchitecture, ArchitectureCatalogEntry>;

export interface OptimizerCatalogEntry {
  id: LearningAlgorithm;
  tier: 'CORE_3' | 'EXTENDED_5';
  shortLabel: string;
  fullNamePl: string;
  badgePl: string;
  whatItDoesPl: string;
  empiricalStatsPl: string;
  label: string;
  bestForPl: string;
  summaryPl: string;
}

interface RawOptimizerCatalogEntry {
  id: LearningAlgorithm;
  tier: 'CORE_3' | 'EXTENDED_5';
  shortLabel: string;
  fullNamePl: string;
  badgePl: string;
  whatItDoesPl: string;
  empiricalStatsPl: string;
}

const RAW_OPTIMIZER_CATALOG: Record<
  LearningAlgorithm,
  RawOptimizerCatalogEntry
> = {
  CMA_HYBRID: {
    id: 'CMA_HYBRID',
    tier: 'CORE_3',
    shortLabel: 'Neuro-CMA',
    fullNamePl: 'Neuro-CMA-ES (Diagonal Covariance + Elitist Injection)',
    badgePl: 'Najszybszy w G1 (11.1 ms)',
    whatItDoesPl:
      'Adaptuje macierz kowariancji kroku mutacji dla każdej synapsy osobno i wstrzykuje najlepszego mistrza wszech czasów.',
    empiricalStatsPl:
      'Najszybsza zbieżność w 1. generacji (11.1 norm-ms dla 1→4→1) i najwyższa skuteczność przy budżecie ≤100 parametrów.',
  },
  DE: {
    id: 'DE',
    tier: 'CORE_3',
    shortLabel: 'Diff. Evol.',
    fullNamePl: 'Differential Evolution (DE/best/1/bin)',
    badgePl: 'Najlepszy Sweet-Spot (Pop 150)',
    whatItDoesPl:
      'Przeszukuje przestrzeń wag za pomocą różnic wektorowych między osobnikami populacji: v = x_best + F·(x_r1 - x_r2).',
    empiricalStatsPl:
      'Zwycięzca globalnego sweet-spotu w 26,700 próbach (Pop 150, Sigma 0.35 → 33.5% perfekcji, śr. 331 ewaluacji).',
  },
  GA: {
    id: 'GA',
    tier: 'CORE_3',
    shortLabel: 'Genetic Alg.',
    fullNamePl: 'Elitist Genetic Algorithm (Tournament + Uniform Crossover)',
    badgePl: '100% Solved-Regime',
    whatItDoesPl:
      'Klasyczny algorytm genetyczny z selekcją turniejową, krzyżowaniem jednorodnym i mutacją gaussowską.',
    empiricalStatsPl:
      '100% skuteczności w reżimie rozwiązywalnym (Easy) i najlepszy przy skokowym łączeniu cech z różnych podpopulacji.',
  },
  NATURAL_ES: {
    id: 'NATURAL_ES',
    tier: 'EXTENDED_5',
    shortLabel: 'OpenAI-ES',
    fullNamePl: 'Natural Evolution Strategies (Antithetic Mirrored Sampling)',
    badgePl: 'Extended · Lustrzany gradient',
    whatItDoesPl:
      'Estymuje gradient naturalny za pomocą par lustrzanych zaburzeń (+ε, -ε) z rangowym kształtowaniem nagród.',
    empiricalStatsPl:
      'Dobra stabilność na większych sieciach (>100p), ale wymaga parzystej liczby ewaluacji na krok.',
  },
  ADAM_ES: {
    id: 'ADAM_ES',
    tier: 'EXTENDED_5',
    shortLabel: 'Adam-ES',
    fullNamePl: 'Adam-Momentum Evolution Strategies',
    badgePl: 'Extended · Moment 1. i 2. rzędu',
    whatItDoesPl:
      'Łączy estymator gradientu ES z optymalizatorem Adam (pęd β1=0.9, skalowanie wariancji β2=0.99).',
    empiricalStatsPl:
      'Pomocny przy długich, zaszumionych przebiegach z kształtowaną funkcją celu (Shaped Fitness).',
  },
  CEM: {
    id: 'CEM',
    tier: 'EXTENDED_5',
    shortLabel: 'Cross-Entropy',
    fullNamePl: 'Cross-Entropy Method (Diagonal Gaussian Fit)',
    badgePl: 'Extended · Dopasowanie elity',
    whatItDoesPl:
      'W każdej generacji dopasowuje średnią i wariancję rozkładu Gaussa do 20% najlepszych osobników.',
    empiricalStatsPl:
      'Szybki na prostych zadaniach, lecz podatny na przedwczesne zapadnięcie wariancji na torach Frontier.',
  },
  PSO: {
    id: 'PSO',
    tier: 'EXTENDED_5',
    shortLabel: 'Particle Swarm',
    fullNamePl: 'Particle Swarm Optimization (Inertial Velocity Swarm)',
    badgePl: 'Extended · Rój cząstek',
    whatItDoesPl:
      'Każdy ptak pamięta swoje najlepsze wagi (pBest) i podąża z bezwładnością w stronę lidera roju (gBest).',
    empiricalStatsPl:
      'Ciekawa dynamika eksploracji ciągłej, ale wolniejsza konwergencja końcowa niż DE i Neuro-CMA.',
  },
  ADAPTIVE_ES: {
    id: 'ADAPTIVE_ES',
    tier: 'EXTENDED_5',
    shortLabel: '1/5-Rule ES',
    fullNamePl: 'Rechenberg 1/5-Success-Rule Evolution Strategy',
    badgePl: 'Extended · Auto-skalowanie σ',
    whatItDoesPl:
      'Automatycznie zwiększa lub zmniejsza promień mutacji σ, aby utrzymać dokładnie 20% udanych mutacji.',
    empiricalStatsPl:
      'Klasyczny punkt odniesienia dla samoadaptacji kroku mutacji.',
  },
};

export const OPTIMIZER_CATALOG: Record<
  LearningAlgorithm,
  OptimizerCatalogEntry
> = Object.fromEntries(
  Object.entries(RAW_OPTIMIZER_CATALOG).map(([k, v]) => [
    k,
    {
      ...v,
      label: v.fullNamePl,
      bestForPl: v.badgePl,
      summaryPl: v.whatItDoesPl,
    },
  ])
) as Record<LearningAlgorithm, OptimizerCatalogEntry>;

export interface PrecisionCatalogEntry {
  id: WeightPrecision;
  label: string;
  bits: number;
  shortDescPl: string;
  isDefault: boolean;
  bitsPerWeight: number;
  summaryPl: string;
}

export const PRECISION_CATALOG: Record<
  WeightPrecision,
  PrecisionCatalogEntry
> = {
  FP32: {
    id: 'FP32',
    label: 'FP32 (32-bit)',
    bits: 32,
    bitsPerWeight: 32,
    shortDescPl: 'Pełna precyzja zmiennoprzecinkowa (domyślny standard badawczy)',
    summaryPl: 'Pełna precyzja zmiennoprzecinkowa (domyślny standard badawczy)',
    isDefault: true,
  },
  FP16: {
    id: 'FP16',
    label: 'FP16 (16-bit)',
    bits: 16,
    bitsPerWeight: 16,
    shortDescPl: 'Połowiczna precyzja GPU (2× mniej pamięci bez utraty jakości)',
    summaryPl: 'Połowiczna precyzja GPU (2× mniej pamięci bez utraty jakości)',
    isDefault: false,
  },
  INT8: {
    id: 'INT8',
    label: 'INT8 (8-bit)',
    bits: 8,
    bitsPerWeight: 8,
    shortDescPl: 'Kwantyzacja całkowitoliczbowa 256 poziomów',
    summaryPl: 'Kwantyzacja całkowitoliczbowa 256 poziomów',
    isDefault: false,
  },
  INT4: {
    id: 'INT4',
    label: 'INT4 (4-bit)',
    bits: 4,
    bitsPerWeight: 4,
    shortDescPl: 'Rekord gęstości wiedzy w eksperymencie: 9.62 rur / bit (52 bity łącznie)',
    summaryPl: 'Rekord gęstości wiedzy w eksperymencie: 9.62 rur / bit (52 bity łącznie)',
    isDefault: false,
  },
  TERNARY: {
    id: 'TERNARY',
    label: 'BitNet 1.58b {-1,0,+1}',
    bits: 1.58,
    bitsPerWeight: 1.58,
    shortDescPl: 'Wagi trójwartościowe (styl BitNet b1.58) — tylko dodawanie i odejmowanie bez mnożenia',
    summaryPl: 'Wagi trójwartościowe (styl BitNet b1.58) — tylko dodawanie i odejmowanie bez mnożenia',
    isDefault: false,
  },
  BINARY: {
    id: 'BINARY',
    label: 'Binary 1-bit {-1,+1}',
    bits: 1,
    bitsPerWeight: 1,
    shortDescPl: 'Ekstremalna kompresja 1-bitowa na synapsę (bramki XNOR)',
    summaryPl: 'Ekstremalna kompresja 1-bitowa na synapsę (bramki XNOR)',
    isDefault: false,
  },
};
