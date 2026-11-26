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
  fullNameEn: string;
  badgePl: string;
  badgeEn: string;
  colorHex: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  computeProfile: ComputeProfileKind;
  whatItDoesPl: string;
  whatItDoesEn: string;
  whenToUsePl: string;
  whenToUseEn: string;
  empiricalVerdictPl: string;
  empiricalVerdictEn: string;
  formulaSummary: string;
  label: string;
  labelEn: string;
  categoryBadge: string;
  summaryPl: string;
  summaryEn: string;
  howItWorksPl: string;
  howItWorksEn: string;
  keyFormula: string;
  flopsMultiplier: number;
}

interface RawArchitectureCatalogEntry {
  id: NetworkArchitecture;
  tier: 'TIER_1' | 'TIER_2_LEGACY';
  shortLabel: string;
  fullNamePl: string;
  fullNameEn: string;
  badgePl: string;
  badgeEn: string;
  colorHex: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  computeProfile: ComputeProfileKind;
  whatItDoesPl: string;
  whatItDoesEn: string;
  whenToUsePl: string;
  whenToUseEn: string;
  empiricalVerdictPl: string;
  empiricalVerdictEn: string;
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
    fullNameEn: 'Standard MLP (Baseline)',
    badgePl: 'Bazowy · Bez pamięci',
    badgeEn: 'Baseline · Stateless',
    colorHex: '#38BDF8',
    borderClass: 'border-sky-500/50',
    bgClass: 'bg-sky-500/15',
    textClass: 'text-sky-200',
    computeProfile: 'GPU_LOCKSTEP',
    whatItDoesPl:
      'Klasyczna sieć jednokierunkowa (Feed-Forward tanh) bez stanu wewnętrznego. Reaguje wyłącznie na bieżącą klatkę.',
    whatItDoesEn:
      'Classic feed-forward tanh network with zero internal state. Reacts strictly to the current frame.',
    whenToUsePl:
      'Najlepsza na łatwych i statycznych torach (Easy/Medium) jako ultra-szybki punkt odniesienia (rozwiązuje Easy w 1. generacji przy 13 wagach).',
    whenToUseEn:
      'Best on calm and static courses (Easy/Medium) as an ultra-fast baseline (solves Easy in Gen 1 with 13 weights).',
    empiricalVerdictPl:
      'Mistrz kompresji wiedzy w Easy (38.5 rur/parametr), ale bezradny w Insane/Extra Insane przez brak pamięci fazowej.',
    empiricalVerdictEn:
      'Knowledge-compression champion on Easy (38.5 pipes/param), but vulnerable on Insane/Extra Insane without phase memory.',
    formulaSummary: 'h_l = tanh(W_l · h_{l-1} + b_l)',
  },
  DROSOPHILA_CONNECTOME: {
    id: 'DROSOPHILA_CONNECTOME',
    tier: 'TIER_1',
    shortLabel: 'Drosophila',
    fullNamePl: 'Drosophila Connectome (Mózg Muszki Owocowej)',
    fullNameEn: 'Drosophila Connectome (Fruit-Fly Flight Circuit)',
    badgePl: 'Lider Frontier · Bio-GPU',
    badgeEn: 'Frontier Leader · Bio-GPU',
    colorHex: '#F59E0B',
    borderClass: 'border-amber-500/55',
    bgClass: 'bg-amber-500/15',
    textClass: 'text-amber-200',
    computeProfile: 'GPU_LOCKSTEP',
    whatItDoesPl:
      'Biologiczny 4-częściowy obwód lotu Drosophila melanogaster: detektory ruchu T4/T5 (LTC) + rzadkie kodowanie Mushroom Body APL (hamowanie boczne) + modulacja oktopaminą + bezpośredni odruch ucieczki Giant Fiber.',
    whatItDoesEn:
      'Biological 4-module Drosophila melanogaster flight circuit: T4/T5 motion LTC detectors + Mushroom Body APL sparse lateral inhibition + Octopamine arousal gain + Giant Fiber direct escape reflex.',
    whenToUsePl:
      'Główny wybór na ekstremalne warunki (Hard, Insane, Extra Insane). Posiada natywny kernel WebGPU (archCode=9) oraz CUDA C++.',
    whenToUseEn:
      'Primary choice for extreme courses (Hard, Insane, Extra Insane). Ships with native WebGPU (archCode=9) and CUDA C++ kernels.',
    empiricalVerdictPl:
      'Zdeklasował klasyczne architektury w reżimie Insane dzięki rozdzieleniu szybkiego odruchu Giant Fiber od rzadkiej reprezentacji stanu.',
    empiricalVerdictEn:
      'Outperforms classic baselines on Insane by separating the rapid Giant Fiber reflex from sparse state representations.',
    formulaSummary:
      'T4/T5 LTC(τ) → APL WTA Inhibition → Octopamine Gain + Giant Fiber Bypass',
  },
  DECOUPLED_FLY_CORTEX: {
    id: 'DECOUPLED_FLY_CORTEX',
    tier: 'TIER_1',
    shortLabel: 'Fly-Cortex',
    fullNamePl: 'Decoupled Fly-Cortex (Prototyp Rozumowanie vs Wiedza)',
    fullNameEn: 'Decoupled Fly-Cortex (Reasoning vs Knowledge Prototype)',
    badgePl: 'Prototyp LLM · Online DA',
    badgeEn: 'LLM Prototype · Online DA',
    colorHex: '#10B981',
    borderClass: 'border-emerald-500/55',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-200',
    computeProfile: 'CPU_SPECIALIZED',
    whatItDoesPl:
      'Oddziela mały Rdzeń Rozumowania Wykonawczego (LTC + Giant Fiber + bramka zaskoczenia System-1/2) od 16-slotowego Banku Pamięci Skojarzeniowej FlyHash APL aktualizowanego w locie dopaminą (Online Plasticity).',
    whatItDoesEn:
      'Separates a compact Executive Reasoning Core (LTC + Giant Fiber + System-1/2 surprise gate) from a 16-slot FlyHash APL Associative Skill Bank updated mid-flight via Dopamine plasticity.',
    whenToUsePl:
      'Do badań nad nowymi architekturami typu LLM na PC oraz adaptacji w czasie rzeczywistym (surowe piksele oka złożonego + anomalie grawitacji w trakcie lotu).',
    whenToUseEn:
      'Ideal for researching decoupled reasoning/memory architectures and real-time adaptation (16-ray compound-eye pixels + mid-flight gravity anomalies).',
    empiricalVerdictPl:
      'Potwierdza, że mała warstwa rozumowania potrafi adaptować się w ułamku sekundy bez kosztownego przeliczania całej warstwy wiedzy.',
    empiricalVerdictEn:
      'Demonstrates that a compact executive core adapts in sub-second time without recomputing an entire monolithic weight matrix.',
    formulaSummary:
      'y = ExecCore(x) + Σ_{i∈Top2(FlyHash(x))} w_i · M[i],  ΔM[i] = η · δ_DA · e_i',
  },
  HYBRID_MOE: {
    id: 'HYBRID_MOE',
    tier: 'TIER_1',
    shortLabel: 'Hybrid MoE',
    fullNamePl: 'Hybrid Mixture of Experts (Router 4 Modułów)',
    fullNameEn: 'Hybrid Mixture of Experts (4-Module Router)',
    badgePl: 'Auto-Router · Kontrola FLOPs',
    badgeEn: 'Auto-Router · FLOPs Budget',
    colorHex: '#EC4899',
    borderClass: 'border-pink-500/50',
    bgClass: 'bg-pink-500/15',
    textClass: 'text-pink-200',
    computeProfile: 'CPU_SPECIALIZED',
    whatItDoesPl:
      'Pojedynczy mózg, który startuje jako szybki MLP i w miarę potrzeby dynamicznie dołącza 3 wyspecjalizowanych ekspertów (LTC Fly, MinGRU SSM, Ponder ACT) sterowanych bramką Softmax Router z kontrolą zwrotu z FLOPs (ROI Rollback).',
    whatItDoesEn:
      'A single brain starting as a lean MLP core that progressively spawns up to 3 specialist experts (LTC Fly, MinGRU SSM, Ponder ACT) gated by a Softmax Router with FLOPs ROI rollback.',
    whenToUsePl:
      'Gdy nie wiesz z góry, jak trudne jest środowisko, i chcesz, aby sieć sama dobrała minimalny zestaw modułów bez marnowania FLOPs.',
    whenToUseEn:
      'Best when environment difficulty is unknown upfront and you want the network to allocate the smallest effective expert set per FLOPs budget.',
    empiricalVerdictPl:
      'Utrzymuje niski koszt obliczeniowy w łatwych fazach i aktywuje ekspertów czasowych tylko przy ruchomych rurach i porywach wiatru.',
    empiricalVerdictEn:
      'Keeps compute lean during calm phases and activates temporal experts only during moving pipes and wind gusts.',
    formulaSummary:
      'y = g_0·MLP(x) + Σ_{k∈{LTC,SSM,ACT}} g_k·α_k·Expert_k(x),  g = Softmax(W_r·x)',
  },
  PONDER_ACT: {
    id: 'PONDER_ACT',
    tier: 'TIER_1',
    shortLabel: 'Ponder ACT',
    fullNamePl: 'Ponder ACT (System-1 / System-2 Adaptive Compute)',
    fullNameEn: 'Ponder ACT (System-1 / System-2 Adaptive Compute)',
    badgePl: 'System 1/2 · Bramka Zaskoczenia',
    badgeEn: 'System 1/2 · Surprise Gate',
    colorHex: '#A855F7',
    borderClass: 'border-purple-500/50',
    bgClass: 'bg-purple-500/15',
    textClass: 'text-purple-200',
    computeProfile: 'GPU_LOCKSTEP',
    whatItDoesPl:
      'Sieć rekurencyjna ze współdzielonymi wagami i wyuczoną bramką zatrzymania (Halting Gate) wyzwalaną błędem predykcji: w spokojnym locie wykonuje 1 szybki krok (System-1), a w niebezpieczeństwie do K kroków głębokiego namysłu (System-2).',
    whatItDoesEn:
      'Weight-shared recurrent network with a learned Halting Gate triggered by prediction surprise: runs 1 fast step in calm flight (System-1) and up to K deep deliberation steps in danger (System-2).',
    whenToUsePl:
      'Do badania alokacji budżetu obliczeniowego Test-Time Compute (myśl dłużej tylko wtedy, gdy rośnie zaskoczenie fizyczne).',
    whenToUseEn:
      'Ideal for studying Test-Time Compute allocation—spending extra reasoning loops only when physical surprise spikes.',
    empiricalVerdictPl:
      'Oszczędza ~65% FLOPs względem sztywnego Looped Reasonera przy zachowaniu pełnej głębokości decyzyjnej w ciasnych oknach.',
    empiricalVerdictEn:
      'Saves ~65% FLOPs compared to fixed Looped Reasoner while retaining full decision depth through tight corridors.',
    formulaSummary:
      'h^{(k)} = tanh(W·h^{(k-1)} + x),  stop when p_halt(h^{(k)}, surprise) > θ',
  },
  SELECTIVE_SSM: {
    id: 'SELECTIVE_SSM',
    tier: 'TIER_1',
    shortLabel: 'MinGRU / SSM',
    fullNamePl: 'Selective SSM / MinGRU (Przestrzeń Stanów Mamba)',
    fullNameEn: 'Selective SSM / MinGRU (Mamba State-Space)',
    badgePl: 'Pamięć Fazowa · Liniowy SSM',
    badgeEn: 'Phase Memory · Linear SSM',
    colorHex: '#06B6D4',
    borderClass: 'border-cyan-500/50',
    bgClass: 'bg-cyan-500/15',
    textClass: 'text-cyan-200',
    computeProfile: 'GPU_LOCKSTEP',
    whatItDoesPl:
      'Nowoczesna komórka przestrzeni stanów (inspirowana Mamba / MinGRU) z selektywną bramką zapominania z_t zależną od wejścia. Błyskawicznie resetuje pamięć po minięciu rury i śledzi fazę oscylacji.',
    whatItDoesEn:
      'Modern state-space cell (Mamba / MinGRU-inspired) with an input-dependent selective forget gate z_t. Cleanly flushes state after clearing a pipe while tracking oscillation phase.',
    whenToUsePl:
      'Przy ruchomych rurach i zmiennym wietrze, gdzie potrzebna jest czysta, szybka pamięć sekwencyjna działająca w pełnym Lockstepie na GPU.',
    whenToUseEn:
      'Best for moving pipes and variable gusts needing clean, low-overhead sequential memory in full GPU Lockstep.',
    empiricalVerdictPl:
      'Najbardziej stabilna klasyczna architektura sekwencyjna na GPU o niskim narzucie parametrów (+2 wagi/neuron).',
    empiricalVerdictEn:
      'Most stable sequential GPU architecture with minimal parameter overhead (+2 weights per hidden neuron).',
    formulaSummary:
      'z_t = σ(w_z·x_t + b_z),  h_t = (1 - z_t)⊙h_{t-1} + z_t⊙tanh(W·x_t)',
  },
  LTC_FLY: {
    id: 'LTC_FLY',
    tier: 'TIER_1',
    shortLabel: 'Fly-LTC',
    fullNamePl: 'Liquid Time-Constant Network (Ciekła Stała Czasowa)',
    fullNameEn: 'Liquid Time-Constant Network (Continuous ODE)',
    badgePl: 'Ciągły Czas ODE · τ(x)',
    badgeEn: 'Continuous ODE · τ(x)',
    colorHex: '#F97316',
    borderClass: 'border-orange-500/50',
    bgClass: 'bg-orange-500/15',
    textClass: 'text-orange-200',
    computeProfile: 'GPU_LOCKSTEP',
    whatItDoesPl:
      'Sieć oparta o równania różniczkowe błony neuronowej ze zmienną stałą czasową τ. Potrafi sama wyliczyć prędkość rury i opadania z samej historii pozycji.',
    whatItDoesEn:
      'Neural membrane ODE network with an input-adaptive time constant τ. Can infer bird and pipe velocity purely from positional history.',
    whenToUsePl:
      'Gdy sieć ma ograniczoną liczbę sensorów (np. brak jawnego sensora prędkości) lub działa w płynnie zmieniającej się fizyce.',
    whenToUseEn:
      'Best when sensor inputs are sparse (e.g. missing velocity sensors) or under smoothly varying physical regimes.',
    empiricalVerdictPl:
      'Fundament warstwy wzrokowej w Drosophila Connectome; świetna ciągła dynamika czasowa.',
    empiricalVerdictEn:
      'Foundation of the Drosophila Connectome optic lobe; strong continuous-time temporal dynamics.',
    formulaSummary: 'dh/dt = -h/τ + f(x, h),  h_t = (1 - α_τ)·h_{t-1} + α_τ·tanh(z_t)',
  },

  // ==================== TIER 2: ADDITIONAL RECURRENT / PLASTICITY / WORLD-MODEL ====================
  RESIDUAL_SKIP: {
    id: 'RESIDUAL_SKIP',
    tier: 'TIER_2_LEGACY',
    shortLabel: 'Res-Skip',
    fullNamePl: 'Residual Skip Connection (Połączenie Skrótowe)',
    fullNameEn: 'Residual Skip Connection',
    badgePl: 'Skrót liniowy · Skip',
    badgeEn: 'Linear Shortcut · Skip',
    colorHex: '#818CF8',
    borderClass: 'border-indigo-500/50',
    bgClass: 'bg-indigo-500/15',
    textClass: 'text-indigo-200',
    computeProfile: 'GPU_LOCKSTEP',
    whatItDoesPl:
      'Dodaje bezpośrednie połączenie liniowe wejście→wyjście omijające warstwy ukryte.',
    whatItDoesEn:
      'Adds a direct linear input→output shortcut bypassing hidden layers.',
    whenToUsePl:
      'Gdy potrzebujesz połączenia szybkiego odruchu liniowego z nieliniową korektą głębszych warstw ukrytych.',
    whenToUseEn:
      'Useful when combining a fast linear reflex with nonlinear corrections from deeper hidden layers.',
    empiricalVerdictPl:
      'Przyspiesza początkowy sygnał gradientowy w głębszych sieciach (D2–D4).',
    empiricalVerdictEn:
      'Accelerates early evolutionary signal propagation in deeper topologies (D2–D4).',
    formulaSummary: 'y = σ(W_out·h_L + W_skip·x + b)',
  },
  NEUROCHEM_GATE: {
    id: 'NEUROCHEM_GATE',
    tier: 'TIER_2_LEGACY',
    shortLabel: 'NeuroChem',
    fullNamePl: 'Neurochemical Gain Gate (Bramka Neuromodulacji)',
    fullNameEn: 'Neurochemical Gain Gate',
    badgePl: 'Modulacja wzmocnienia',
    badgeEn: 'Gain Neuromodulation',
    colorHex: '#2DD4BF',
    borderClass: 'border-teal-500/50',
    bgClass: 'bg-teal-500/15',
    textClass: 'text-teal-200',
    computeProfile: 'GPU_LOCKSTEP',
    whatItDoesPl:
      'Powolny stan neuromodulatora skalujący czułość (gain) każdego neuronu ukrytego.',
    whatItDoesEn:
      'Slow neuromodulator trace that dynamically scales the sensitivity (gain) of each hidden neuron.',
    whenToUsePl:
      'Do badania adaptacji pobudzenia sieci przy nagłych zmianach prędkości i grawitacji.',
    whenToUseEn:
      'Ideal for testing arousal-gain adaptation under abrupt speed gusts and gravity changes.',
    empiricalVerdictPl:
      'Wprowadza pamięć pobudzenia (+3 parametry na neuron) działającą w pełnym GPU Lockstep.',
    empiricalVerdictEn:
      'Adds arousal memory (+3 params/neuron) running in full GPU Lockstep.',
    formulaSummary: 'm_t = (1-β)m_{t-1} + β|z_t|,  h_t = tanh((1 + γ·m_t)·z_t)',
  },
  SYNAPTIC_STP: {
    id: 'SYNAPTIC_STP',
    tier: 'TIER_2_LEGACY',
    shortLabel: 'Syn-STP',
    fullNamePl: 'Plastyczność Krótkoterminowa (Tsodyks-Markram STP)',
    fullNameEn: 'Short-Term Synaptic Plasticity (Tsodyks-Markram)',
    badgePl: 'Plastyczność STP',
    badgeEn: 'STP Plasticity',
    colorHex: '#FB7185',
    borderClass: 'border-rose-500/50',
    bgClass: 'bg-rose-500/15',
    textClass: 'text-rose-200',
    computeProfile: 'GPU_LOCKSTEP',
    whatItDoesPl:
      'Modeluje biofizyczne wyczerpywanie pęcherzyków synaptycznych i facylitację wapniową w trakcie lotu.',
    whatItDoesEn:
      'Models biophysical synaptic vesicle depletion and calcium facilitation in real time during flight.',
    whenToUsePl:
      'Do porównań biofizycznej plastyczności krótkoterminowej z pamięcią dopaminową FlyHash.',
    whenToUseEn:
      'Useful for contrasting biophysical short-term plasticity against FlyHash dopamine memory.',
    empiricalVerdictPl:
      'Automatycznie tłumi powtarzalne pobudzenia i wzmacnia nagłe zmiany bodźców.',
    empiricalVerdictEn:
      'Automatically dampens repetitive firing while amplifying sudden stimulus transients.',
    formulaSummary: 'u_t = u_{t-1} + U(1-u_{t-1}),  h_t = tanh(u_t · z_t)',
  },
  LOOPED_REASONER: {
    id: 'LOOPED_REASONER',
    tier: 'TIER_2_LEGACY',
    shortLabel: 'Loop-K',
    fullNamePl: 'Fixed-Depth Looped Reasoner (Universal Transformer)',
    fullNameEn: 'Fixed-Depth Looped Reasoner (Universal Transformer)',
    badgePl: 'Stałe K pętli · Rekurencja',
    badgeEn: 'Fixed K-Loop · Recurrent',
    colorHex: '#C084FC',
    borderClass: 'border-purple-400/50',
    bgClass: 'bg-purple-500/15',
    textClass: 'text-purple-200',
    computeProfile: 'GPU_LOCKSTEP',
    whatItDoesPl:
      'Wykonuje stałą liczbę K pętli rekurencyjnych na tych samych wagach w każdej klatce.',
    whatItDoesEn:
      'Executes a fixed count of K weight-tied recurrent refinement loops on every frame.',
    whenToUsePl:
      'Do badania głębokiego rozumowania przy bardzo małym budżecie wag oraz jako punkt odniesienia dla Ponder ACT.',
    whenToUseEn:
      'Best for testing deep iterative refinement under tiny parameter budgets and benchmarking Ponder ACT.',
    empiricalVerdictPl:
      'Pozwala płytkiej sieci (np. 4 neurony) symulować wielowarstwowe przetwarzanie poprzez iterację w czasie.',
    empiricalVerdictEn:
      'Allows a shallow layer (e.g. 4 neurons) to emulate multi-layer depth via fixed temporal iteration.',
    formulaSummary: 'h^{(k)} = tanh(W·h^{(k-1)} + z_0)  for k=1..K',
  },
  LATENT_ROLLOUT: {
    id: 'LATENT_ROLLOUT',
    tier: 'TIER_2_LEGACY',
    shortLabel: 'Rollout',
    fullNamePl: 'Kontrfaktyczny Model Świata (Latent Rollout)',
    fullNameEn: 'Counterfactual Latent World-Model Rollout',
    badgePl: 'Model Świata · 2 ścieżki',
    badgeEn: 'World Model · 2-Path',
    colorHex: '#EAB308',
    borderClass: 'border-yellow-500/50',
    bgClass: 'bg-yellow-500/15',
    textClass: 'text-yellow-200',
    computeProfile: 'GPU_LOCKSTEP',
    whatItDoesPl:
      'Symuluje w przestrzeni ukrytej dwie alternatywne przyszłości (SKOK vs SZYBOWANIE) i wybiera stan o wyższej wartości V.',
    whatItDoesEn:
      'Imagines two counterfactual latent futures (FLAP vs GLIDE) inside a single frame and picks the higher-value state V.',
    whenToUsePl:
      'Do badania jawnego planowania kontrfaktycznego (World Model) wewnątrz pojedynczej klatki.',
    whenToUseEn:
      'Built for testing explicit single-frame counterfactual planning and internal world models.',
    empiricalVerdictPl:
      'Ciekawy model predykcyjny porównujący dwie trajektorie przed podjęciem decyzji o skoku.',
    empiricalVerdictEn:
      'Predictive planning architecture comparing competing latent trajectories before deciding to flap.',
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
        labelEn: v.fullNameEn,
        categoryBadge: v.badgePl,
        summaryPl: v.whatItDoesPl,
        summaryEn: v.whatItDoesEn,
        howItWorksPl: v.whenToUsePl,
        howItWorksEn: v.whenToUseEn,
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
  fullNameEn: string;
  badgePl: string;
  badgeEn: string;
  whatItDoesPl: string;
  whatItDoesEn: string;
  empiricalStatsPl: string;
  empiricalStatsEn: string;
  label: string;
  bestForPl: string;
  bestForEn: string;
  summaryPl: string;
  summaryEn: string;
}

interface RawOptimizerCatalogEntry {
  id: LearningAlgorithm;
  tier: 'CORE_3' | 'EXTENDED_5';
  shortLabel: string;
  fullNamePl: string;
  fullNameEn: string;
  badgePl: string;
  badgeEn: string;
  whatItDoesPl: string;
  whatItDoesEn: string;
  empiricalStatsPl: string;
  empiricalStatsEn: string;
}

const RAW_OPTIMIZER_CATALOG: Record<
  LearningAlgorithm,
  RawOptimizerCatalogEntry
> = {
  CMA_HYBRID: {
    id: 'CMA_HYBRID',
    tier: 'CORE_3',
    shortLabel: 'Neuro-CMA',
    fullNamePl: 'Neuro-CMA-ES (Kowariancja Diagonalna + Elityzm)',
    fullNameEn: 'Neuro-CMA-ES (Diagonal Covariance + Elitist Injection)',
    badgePl: 'Najszybszy w G1 (11.1 ms)',
    badgeEn: 'Fastest Gen-1 (11.1 ms)',
    whatItDoesPl:
      'Adaptuje macierz kowariancji kroku mutacji dla każdej synapsy osobno i wstrzykuje najlepszego mistrza wszech czasów.',
    whatItDoesEn:
      'Adapts per-synapse mutation covariance scales and injects the all-time champion back into the search distribution.',
    empiricalStatsPl:
      'Najszybsza zbieżność w 1. generacji (11.1 norm-ms dla 1→4→1) i najwyższa skuteczność przy budżecie ≤100 parametrów.',
    empiricalStatsEn:
      'Fastest Gen-1 convergence (11.1 norm-ms for 1→4→1) and top efficiency under ≤100-parameter budgets.',
  },
  DE: {
    id: 'DE',
    tier: 'CORE_3',
    shortLabel: 'Diff. Evol.',
    fullNamePl: 'Ewolucja Różnicowa (DE/best/1/bin)',
    fullNameEn: 'Differential Evolution (DE/best/1/bin)',
    badgePl: 'Najlepszy Sweet-Spot (Pop 150)',
    badgeEn: 'Top Sweet-Spot (Pop 150)',
    whatItDoesPl:
      'Przeszukuje przestrzeń wag za pomocą różnic wektorowych między osobnikami populacji: v = x_best + F·(x_r1 - x_r2).',
    whatItDoesEn:
      'Explores weight space using population vector differences: v = x_best + F·(x_r1 - x_r2).',
    empiricalStatsPl:
      'Zwycięzca globalnego sweet-spotu w 26,700 próbach (Pop 150, Sigma 0.35 → 33.5% perfekcji, śr. 331 ewaluacji).',
    empiricalStatsEn:
      'Global sweet-spot winner across 26,700 trials (Pop 150, Sigma 0.35 → 33.5% perfect rate, mean 331 evals).',
  },
  GA: {
    id: 'GA',
    tier: 'CORE_3',
    shortLabel: 'Genetic Alg.',
    fullNamePl: 'Elitarny Algorytm Genetyczny (Turniej + Krzyżowanie)',
    fullNameEn: 'Elitist Genetic Algorithm (Tournament + Uniform Crossover)',
    badgePl: '100% w trybie Easy',
    badgeEn: '100% Solved-Regime',
    whatItDoesPl:
      'Klasyczny algorytm genetyczny z selekcją turniejową, krzyżowaniem jednorodnym i mutacją gaussowską.',
    whatItDoesEn:
      'Classic genetic algorithm combining tournament selection, uniform crossover, and Gaussian weight mutation.',
    empiricalStatsPl:
      '100% skuteczności w reżimie rozwiązywalnym (Easy) i najlepszy przy skokowym łączeniu cech z różnych podpopulacji.',
    empiricalStatsEn:
      '100% solve rate on Easy and excels at recombining discrete traits across diverse subpopulations.',
  },
  NATURAL_ES: {
    id: 'NATURAL_ES',
    tier: 'EXTENDED_5',
    shortLabel: 'Natural ES',
    fullNamePl: 'Natural Evolution Strategies (Próbkowanie Lustrzane)',
    fullNameEn: 'Natural Evolution Strategies (Antithetic Mirrored Sampling)',
    badgePl: 'Rozszerzony · Lustrzany gradient',
    badgeEn: 'Extended · Mirrored Gradient',
    whatItDoesPl:
      'Estymuje gradient naturalny za pomocą par lustrzanych zaburzeń (+ε, -ε) z rangowym kształtowaniem nagród.',
    whatItDoesEn:
      'Estimates the natural gradient via antithetic perturbation pairs (+ε, -ε) with rank-based fitness shaping.',
    empiricalStatsPl:
      'Dobra stabilność na większych sieciach (>100p), ale wymaga parzystej liczby ewaluacji na krok.',
    empiricalStatsEn:
      'Strong stability on larger networks (>100p), requiring paired evaluations per step.',
  },
  ADAM_ES: {
    id: 'ADAM_ES',
    tier: 'EXTENDED_5',
    shortLabel: 'Adam-ES',
    fullNamePl: 'Adam-ES (Strategie Ewolucyjne z Pędem Adam)',
    fullNameEn: 'Adam-Momentum Evolution Strategies',
    badgePl: 'Rozszerzony · Moment 1. i 2. rzędu',
    badgeEn: 'Extended · 1st & 2nd Moments',
    whatItDoesPl:
      'Łączy estymator gradientu ES z optymalizatorem Adam (pęd β1=0.9, skalowanie wariancji β2=0.99).',
    whatItDoesEn:
      'Pairs the ES gradient estimator with Adam momentum (β1=0.9) and adaptive variance scaling (β2=0.99).',
    empiricalStatsPl:
      'Pomocny przy długich, zaszumionych przebiegach z kształtowaną funkcją celu (Shaped Fitness).',
    empiricalStatsEn:
      'Helpful on long, noisy sweeps paired with Shaped Fitness rewards.',
  },
  CEM: {
    id: 'CEM',
    tier: 'EXTENDED_5',
    shortLabel: 'Cross-Entropy',
    fullNamePl: 'Cross-Entropy Method (Dopasowanie Gaussa Elity)',
    fullNameEn: 'Cross-Entropy Method (Diagonal Gaussian Fit)',
    badgePl: 'Rozszerzony · Dopasowanie elity',
    badgeEn: 'Extended · Elite Fit',
    whatItDoesPl:
      'W każdej generacji dopasowuje średnią i wariancję rozkładu Gaussa do 20% najlepszych osobników.',
    whatItDoesEn:
      'Refits a diagonal Gaussian mean and variance to the top 20% elite candidates every generation.',
    empiricalStatsPl:
      'Szybki na prostych zadaniach, lecz podatny na przedwczesne zapadnięcie wariancji na torach Frontier.',
    empiricalStatsEn:
      'Fast on simple tasks, but prone to premature variance collapse on Frontier courses.',
  },
  PSO: {
    id: 'PSO',
    tier: 'EXTENDED_5',
    shortLabel: 'Particle Swarm',
    fullNamePl: 'Particle Swarm Optimization (Rój Cząstek)',
    fullNameEn: 'Particle Swarm Optimization (Inertial Velocity Swarm)',
    badgePl: 'Rozszerzony · Rój cząstek',
    badgeEn: 'Extended · Particle Swarm',
    whatItDoesPl:
      'Każdy ptak pamięta swoje najlepsze wagi (pBest) i podąża z bezwładnością w stronę lidera roju (gBest).',
    whatItDoesEn:
      'Each particle tracks its personal best (pBest) and steers with inertia toward the global swarm leader (gBest).',
    empiricalStatsPl:
      'Ciekawa dynamika eksploracji ciągłej, ale wolniejsza konwergencja końcowa niż DE i Neuro-CMA.',
    empiricalStatsEn:
      'Rich continuous exploration dynamics, though slower final convergence than DE and Neuro-CMA.',
  },
  ADAPTIVE_ES: {
    id: 'ADAPTIVE_ES',
    tier: 'EXTENDED_5',
    shortLabel: 'Adaptive ES',
    fullNamePl: 'Strategia Ewolucyjna z Regułą 1/5 Rechenberga',
    fullNameEn: 'Rechenberg 1/5-Success-Rule Evolution Strategy',
    badgePl: 'Rozszerzony · Auto-skalowanie σ',
    badgeEn: 'Extended · Auto-Scaling σ',
    whatItDoesPl:
      'Automatycznie zwiększa lub zmniejsza promień mutacji σ, aby utrzymać dokładnie 20% udanych mutacji.',
    whatItDoesEn:
      'Automatically expands or shrinks mutation step size σ to maintain a 20% mutation success ratio.',
    empiricalStatsPl:
      'Klasyczny punkt odniesienia dla samoadaptacji kroku mutacji.',
    empiricalStatsEn:
      'Classic reference benchmark for self-adapting mutation step size.',
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
      bestForEn: v.badgeEn,
      summaryPl: v.whatItDoesPl,
      summaryEn: v.whatItDoesEn,
    },
  ])
) as Record<LearningAlgorithm, OptimizerCatalogEntry>;

export interface PrecisionCatalogEntry {
  id: WeightPrecision;
  label: string;
  bits: number;
  shortDescPl: string;
  shortDescEn: string;
  isDefault: boolean;
  bitsPerWeight: number;
  summaryPl: string;
  summaryEn: string;
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
    shortDescEn: 'Full 32-bit floating-point precision (default research baseline)',
    summaryPl: 'Pełna precyzja zmiennoprzecinkowa (domyślny standard badawczy)',
    summaryEn: 'Full 32-bit floating-point precision (default research baseline)',
    isDefault: true,
  },
  FP16: {
    id: 'FP16',
    label: 'FP16 (16-bit)',
    bits: 16,
    bitsPerWeight: 16,
    shortDescPl: 'Połowiczna precyzja GPU (2× mniej pamięci bez utraty jakości)',
    shortDescEn: 'Half-precision GPU floats (2× smaller footprint with negligible loss)',
    summaryPl: 'Połowiczna precyzja GPU (2× mniej pamięci bez utraty jakości)',
    summaryEn: 'Half-precision GPU floats (2× smaller footprint with negligible loss)',
    isDefault: false,
  },
  INT8: {
    id: 'INT8',
    label: 'INT8 (8-bit)',
    bits: 8,
    bitsPerWeight: 8,
    shortDescPl: 'Kwantyzacja całkowitoliczbowa 256 poziomów',
    shortDescEn: '8-bit integer quantization (256 discrete levels per weight)',
    summaryPl: 'Kwantyzacja całkowitoliczbowa 256 poziomów',
    summaryEn: '8-bit integer quantization (256 discrete levels per weight)',
    isDefault: false,
  },
  INT4: {
    id: 'INT4',
    label: 'INT4 (4-bit)',
    bits: 4,
    bitsPerWeight: 4,
    shortDescPl: 'Rekord gęstości wiedzy w eksperymencie: 9.62 rur / bit (52 bity łącznie)',
    shortDescEn: 'Empirical knowledge-density record: 9.62 pipes/bit (52 bits total)',
    summaryPl: 'Rekord gęstości wiedzy w eksperymencie: 9.62 rur / bit (52 bity łącznie)',
    summaryEn: 'Empirical knowledge-density record: 9.62 pipes/bit (52 bits total)',
    isDefault: false,
  },
  TERNARY: {
    id: 'TERNARY',
    label: 'BitNet 1.58b {-1,0,+1}',
    bits: 1.58,
    bitsPerWeight: 1.58,
    shortDescPl: 'Wagi trójwartościowe (styl BitNet b1.58) — tylko dodawanie i odejmowanie bez mnożenia',
    shortDescEn: 'Ternary weights (BitNet b1.58 style) — multiplication-free add/subtract inference',
    summaryPl: 'Wagi trójwartościowe (styl BitNet b1.58) — tylko dodawanie i odejmowanie bez mnożenia',
    summaryEn: 'Ternary weights (BitNet b1.58 style) — multiplication-free add/subtract inference',
    isDefault: false,
  },
  BINARY: {
    id: 'BINARY',
    label: 'Binary 1-bit {-1,+1}',
    bits: 1,
    bitsPerWeight: 1,
    shortDescPl: 'Ekstremalna kompresja 1-bitowa na synapsę (bramki XNOR)',
    shortDescEn: 'Extreme 1-bit per synapse compression (XNOR logic gates)',
    summaryPl: 'Ekstremalna kompresja 1-bitowa na synapsę (bramki XNOR)',
    summaryEn: 'Extreme 1-bit per synapse compression (XNOR logic gates)',
    isDefault: false,
  },
};
