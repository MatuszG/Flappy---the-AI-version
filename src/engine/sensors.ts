import type { SensorFeatureId } from './types';

export interface SensorMeta {
  id: SensorFeatureId;
  index: number;
  label: string;
  shortLabel: string;
  opticalShortLabel: string;
  opticalDescPl: string;
  formulaVar: string;
  vizLabel: string;
  group: 'KINEMATIC' | 'PIPE_1' | 'PIPE_2';
  description: string;
}

export const CLASSIC_5_SENSOR_FEATURES: readonly SensorFeatureId[] = [
  'BIRD_Y',
  'VEL_VY',
  'PIPE_DX',
  'TOP_CLEAR',
  'BOT_CLEAR',
] as const;

export const FULL_6_SENSOR_FEATURES: readonly SensorFeatureId[] = [
  'BIRD_Y',
  'VEL_VY',
  'PIPE_DX',
  'TOP_CLEAR',
  'BOT_CLEAR',
  'PIPE_VY',
] as const;

export const LEGACY_7_SENSOR_FEATURES: readonly SensorFeatureId[] = [
  'BIRD_Y',
  'VEL_VY',
  'PIPE_DX',
  'TOP_CLEAR',
  'BOT_CLEAR',
  'PIPE_VY',
  'NEXT_PIPE_DY',
] as const;

export const ALL_SENSOR_FEATURES: readonly SensorFeatureId[] = [
  'BIRD_Y',
  'VEL_VY',
  'PIPE_DX',
  'TOP_CLEAR',
  'BOT_CLEAR',
  'PIPE_VY',
  'NEXT_PIPE_DY',
  'NEXT_TOP_CLEAR',
  'NEXT_BOT_CLEAR',
  'NEXT_PIPE_DX',
  'NEXT_PIPE_VY',
  'PIPE_TTF',
] as const;

export const SENSOR_METADATA: Record<SensorFeatureId, SensorMeta> = {
  BIRD_Y: {
    id: 'BIRD_Y',
    index: 0,
    label: 'Bird Y',
    shortLabel: 'Y',
    opticalShortLabel: 'Opt-Horiz',
    opticalDescPl: 'Balans jasności grzbiet/brzuch (Ommatidia #1–8 vs #9–16) + propriocepcja wysokości',
    formulaVar: 'Y',
    vizLabel: 'Altitude',
    group: 'KINEMATIC',
    description: 'Normalized bird altitude (-1 top to +1 ground)',
  },
  VEL_VY: {
    id: 'VEL_VY',
    index: 1,
    label: 'Vel Vy',
    shortLabel: 'Vy',
    opticalShortLabel: 'Flow-Vy',
    opticalDescPl: 'Przepływ optyczny ruchu własnego T4/T5 + żyroskop przezmianek (Halteres)',
    formulaVar: 'Vy',
    vizLabel: 'Velocity',
    group: 'KINEMATIC',
    description: 'Vertical velocity normalized by terminal speed',
  },
  PIPE_DX: {
    id: 'PIPE_DX',
    index: 2,
    label: 'Pipe 1 DX',
    shortLabel: 'DX',
    opticalShortLabel: 'Loom-1',
    opticalDescPl: 'Stopień zbliżenia optycznego (Looming) przednich promieni siatkówki #6–11',
    formulaVar: 'DX',
    vizLabel: 'P1 Dist',
    group: 'PIPE_1',
    description: 'Horizontal distance to trailing edge of Pipe #1',
  },
  TOP_CLEAR: {
    id: 'TOP_CLEAR',
    index: 3,
    label: 'Pipe 1 Top',
    shortLabel: 'Top',
    opticalShortLabel: 'Dorsal-1',
    opticalDescPl: 'Prześwit grzbietowej wiązki ommatidiów (#1–8) względem górnej krawędzi szczeliny',
    formulaVar: 'Top',
    vizLabel: 'P1 Top',
    group: 'PIPE_1',
    description: 'Signed vertical clearance below Pipe #1 top lip (y - gapTop)',
  },
  BOT_CLEAR: {
    id: 'BOT_CLEAR',
    index: 4,
    label: 'Pipe 1 Bot',
    shortLabel: 'Bot',
    opticalShortLabel: 'Ventral-1',
    opticalDescPl: 'Prześwit brzusznej wiązki ommatidiów (#9–16) względem dolnej krawędzi szczeliny',
    formulaVar: 'Bot',
    vizLabel: 'P1 Bot',
    group: 'PIPE_1',
    description: 'Signed vertical clearance above Pipe #1 bottom lip (gapBot - y)',
  },
  PIPE_VY: {
    id: 'PIPE_VY',
    index: 5,
    label: 'Pipe 1 Vy',
    shortLabel: 'PVy',
    opticalShortLabel: 'T4/T5-Vy',
    opticalDescPl: 'Korelator ruchu krawędzi Reichardta T4/T5 między sąsiednimi ommatidiami',
    formulaVar: 'PVy',
    vizLabel: 'P1 Vel',
    group: 'PIPE_1',
    description: 'Vertical velocity of moving Pipe #1 gap (+down / -up, 0 when static)',
  },
  NEXT_PIPE_DY: {
    id: 'NEXT_PIPE_DY',
    index: 6,
    label: 'Next Gap dY',
    shortLabel: 'N2Y',
    opticalShortLabel: 'Dipole-2',
    opticalDescPl: 'Dipol dalekiego pola z promieni przenikających przez otwartą szczelinę rury #1 na rurę #2',
    formulaVar: 'N2Y',
    vizLabel: 'P2 Center',
    group: 'PIPE_2',
    description:
      'Vertical offset from Pipe #1 gap center to Pipe #2 gap center (+down / -up, 0 if unseen)',
  },
  NEXT_TOP_CLEAR: {
    id: 'NEXT_TOP_CLEAR',
    index: 7,
    label: 'Pipe 2 Top',
    shortLabel: 'N2Top',
    opticalShortLabel: 'Dorsal-2',
    opticalDescPl: 'Paralaksa dalekiego pola górnej krawędzi rury #2 widziana przez szczelinę #1',
    formulaVar: 'N2Top',
    vizLabel: 'P2 Top',
    group: 'PIPE_2',
    description:
      'Signed vertical clearance from bird to Pipe #2 top lip (y - nextGapTop, 0 if unseen)',
  },
  NEXT_BOT_CLEAR: {
    id: 'NEXT_BOT_CLEAR',
    index: 8,
    label: 'Pipe 2 Bot',
    shortLabel: 'N2Bot',
    opticalShortLabel: 'Ventral-2',
    opticalDescPl: 'Paralaksa dalekiego pola dolnej krawędzi rury #2 widziana przez szczelinę #1',
    formulaVar: 'N2Bot',
    vizLabel: 'P2 Bot',
    group: 'PIPE_2',
    description:
      'Signed vertical clearance from bird to Pipe #2 bottom lip (nextGapBot - y, 0 if unseen)',
  },
  NEXT_PIPE_DX: {
    id: 'NEXT_PIPE_DX',
    index: 9,
    label: 'Pipe 2 DX',
    shortLabel: 'N2DX',
    opticalShortLabel: 'Loom-2',
    opticalDescPl: 'Głębia dalekiego pola promieni trafiających w rurę #2',
    formulaVar: 'N2DX',
    vizLabel: 'P2 Dist',
    group: 'PIPE_2',
    description:
      'Horizontal distance to trailing edge of Pipe #2 (1.0 if unseen)',
  },
  NEXT_PIPE_VY: {
    id: 'NEXT_PIPE_VY',
    index: 10,
    label: 'Pipe 2 Vy',
    shortLabel: 'N2PVy',
    opticalShortLabel: 'T4/T5-2',
    opticalDescPl: 'Ruch pionowy krawędzi dalekiego pola (T4/T5 rury #2)',
    formulaVar: 'N2PVy',
    vizLabel: 'P2 Vel',
    group: 'PIPE_2',
    description:
      'Vertical velocity of moving Pipe #2 gap (+down / -up, 0 when static or unseen)',
  },
  PIPE_TTF: {
    id: 'PIPE_TTF',
    index: 11,
    label: 'Pipe TTF',
    shortLabel: 'TTF',
    opticalShortLabel: 'Tau-dθ',
    opticalDescPl: 'Optyczny czas do kontaktu τ wyznaczany z pochodnej kontrastu Lamina L1/L2 ΔI(t)',
    formulaVar: 'TTF',
    vizLabel: 'Time-To-Pipe',
    group: 'KINEMATIC',
    description:
      'Wind-compensated Time-To-Pipe in frames (DX / tickSpeed normalized by 120f)',
  },
};

export interface InputSubsetPreset {
  id: string;
  name: string;
  shortName: string;
  features: SensorFeatureId[];
  rationale: string;
}

export const INPUT_SUBSET_PRESETS: InputSubsetPreset[] = [
  {
    id: 'bot_1',
    name: '1: Bot Only',
    shortName: '1: Bot',
    features: ['BOT_CLEAR'],
    rationale: 'Minimalist baseline: bottom lip clearance relative to bird only',
  },
  {
    id: 'dx_bot_2',
    name: '2: DX + Bot',
    shortName: '2: DX·Bot',
    features: ['PIPE_DX', 'BOT_CLEAR'],
    rationale: 'Pure Pipe #1 approach + bottom clearance without Top or velocities',
  },
  {
    id: 'dual_bot_4',
    name: '4: Dual Bot (P1+P2)',
    shortName: '4: DX·Bot·N2DX·N2Bot',
    features: ['PIPE_DX', 'BOT_CLEAR', 'NEXT_PIPE_DX', 'NEXT_BOT_CLEAR'],
    rationale: 'Bot-first dual-pipe geometry: relative bottom lip & distance for both pipes (Top omitted)',
  },
  {
    id: 'dual_geo_6',
    name: '6: Dual Geo (Top+Bot)',
    shortName: '6: DX·Top·Bot·N2(DX·Top·Bot)',
    features: [
      'PIPE_DX',
      'TOP_CLEAR',
      'BOT_CLEAR',
      'NEXT_TOP_CLEAR',
      'NEXT_BOT_CLEAR',
      'NEXT_PIPE_DX',
    ],
    rationale: 'Full spatial corridor geometry of both Pipe #1 and Pipe #2 without velocity sensors',
  },
  {
    id: 'dual_moving_8',
    name: '8: Dual Moving + Vy',
    shortName: '8: Vy·P1(DX·Top·Bot·PVy)·P2(DX·Top·Bot)',
    features: [
      'VEL_VY',
      'PIPE_DX',
      'TOP_CLEAR',
      'BOT_CLEAR',
      'PIPE_VY',
      'NEXT_TOP_CLEAR',
      'NEXT_BOT_CLEAR',
      'NEXT_PIPE_DX',
    ],
    rationale: 'Symmetric dual-pipe clearance + bird Vy + Pipe #1 velocity for moving gaps',
  },
  {
    id: 'dual_vel_10',
    name: '10: Dual Full + TTF',
    shortName: '10: Vy·P1+P2(Top·Bot·DX·PVy)·TTF',
    features: [
      'VEL_VY',
      'PIPE_DX',
      'TOP_CLEAR',
      'BOT_CLEAR',
      'PIPE_VY',
      'NEXT_TOP_CLEAR',
      'NEXT_BOT_CLEAR',
      'NEXT_PIPE_DX',
      'NEXT_PIPE_VY',
      'PIPE_TTF',
    ],
    rationale: 'Complete dual-pipe kinematic vector dropping absolute Bird Y',
  },
  {
    id: 'full_12',
    name: '12: Full Discovery',
    shortName: '12: All Sensors',
    features: [...ALL_SENSOR_FEATURES],
    rationale: 'Complete 12-sensor pool for Morphogenesis pruning and sensor meta-analysis',
  },
  {
    id: 'full_6',
    name: '6: Classic + PVy',
    shortName: '6: Y·Vy·DX·Top·Bot·PVy',
    features: ['BIRD_Y', 'VEL_VY', 'PIPE_DX', 'TOP_CLEAR', 'BOT_CLEAR', 'PIPE_VY'],
    rationale: 'Legacy 6-sensor Pipe #1 baseline with moving pipe velocity',
  },
  {
    id: 'full_5',
    name: '5: Classic (No PVy)',
    shortName: '5: Y·Vy·DX·Top·Bot',
    features: ['BIRD_Y', 'VEL_VY', 'PIPE_DX', 'TOP_CLEAR', 'BOT_CLEAR'],
    rationale: 'Classic 5-sensor Flappy baseline',
  },
  {
    id: 'lookahead_6',
    name: '6: Frontier Lookahead',
    shortName: '6: Vy·DX·Top·Bot·PVy·N2Y',
    features: [
      'VEL_VY',
      'PIPE_DX',
      'TOP_CLEAR',
      'BOT_CLEAR',
      'PIPE_VY',
      'NEXT_PIPE_DY',
    ],
    rationale: 'Pipe #1 clearances + Vy/PVy + Pipe #2 center offset',
  },
];

/**
 * Curated multi-sensor ablation curriculum spanning 1 to 12 sensors:
 * directly tests Bot-first single-pipe -> Dual-Pipe Bot -> Dual-Pipe Geo -> Full 12 Discovery.
 */
export const DEFAULT_MULTI_SENSOR_SUBSETS: SensorFeatureId[][] = [
  ['BOT_CLEAR'],
  ['PIPE_DX', 'BOT_CLEAR'],
  ['PIPE_DX', 'BOT_CLEAR', 'NEXT_PIPE_DX', 'NEXT_BOT_CLEAR'],
  ['PIPE_DX', 'TOP_CLEAR', 'BOT_CLEAR', 'PIPE_VY', 'NEXT_BOT_CLEAR', 'NEXT_PIPE_DX'],
  [
    'VEL_VY',
    'PIPE_DX',
    'TOP_CLEAR',
    'BOT_CLEAR',
    'PIPE_VY',
    'NEXT_TOP_CLEAR',
    'NEXT_BOT_CLEAR',
    'NEXT_PIPE_DX',
    'NEXT_PIPE_VY',
    'PIPE_TTF',
  ],
  [...ALL_SENSOR_FEATURES],
];

/**
 * Generates combinatorial C(M, k) sensor subsets for the requested sizes `k`.
 * Supports the 6 base Pipe-1 sensors, 7-in legacy lookahead, or the full 12-sensor pool.
 */
export function generateSensorCombinations(
  sizes: number[],
  options?: {
    requireClearance?: boolean;
    maxSubsets?: number;
    includeLookahead?: boolean;
    includeFull12?: boolean;
  }
): SensorFeatureId[][] {
  const use12 =
    Boolean(options?.includeFull12) ||
    sizes.some((s) => s > 7);
  const use7 = !use12 && (Boolean(options?.includeLookahead) || sizes.includes(7));
  const pool = use12
    ? ALL_SENSOR_FEATURES
    : use7
      ? LEGACY_7_SENSOR_FEATURES
      : FULL_6_SENSOR_FEATURES;
  const sizeSet = new Set(
    sizes.map((s) => Math.max(1, Math.min(pool.length, s)))
  );
  const requireClearance = options?.requireClearance ?? false;
  const results: SensorFeatureId[][] = [];
  const totalMasks = 1 << pool.length;

  for (let mask = 1; mask < totalMasks; mask++) {
    const subset: SensorFeatureId[] = [];
    for (let bit = 0; bit < pool.length; bit++) {
      if ((mask & (1 << bit)) !== 0) {
        subset.push(pool[bit]);
      }
    }
    if (!sizeSet.has(subset.length)) continue;
    if (
      requireClearance &&
      !subset.includes('BOT_CLEAR') &&
      !subset.includes('TOP_CLEAR')
    ) {
      continue;
    }
    results.push(subset);
  }

  results.sort((a, b) => a.length - b.length);

  if (options?.maxSubsets && results.length > options.maxSubsets) {
    const step = results.length / options.maxSubsets;
    const sampled: SensorFeatureId[][] = [];
    for (let i = 0; i < options.maxSubsets; i++) {
      sampled.push(results[Math.min(results.length - 1, Math.floor(i * step))]);
    }
    return sampled;
  }

  return results;
}

export function normalizeInputFeatures(
  features?: readonly SensorFeatureId[] | null
): SensorFeatureId[] {
  if (!features || features.length === 0) {
    return [...CLASSIC_5_SENSOR_FEATURES];
  }
  const set = new Set<SensorFeatureId>(features);
  const ordered = ALL_SENSOR_FEATURES.filter((id) => set.has(id));
  return ordered.length > 0 ? ordered : [...CLASSIC_5_SENSOR_FEATURES];
}

export function isFullSensorSet(features?: readonly SensorFeatureId[] | null): boolean {
  const clean = normalizeInputFeatures(features);
  return clean.length === ALL_SENSOR_FEATURES.length;
}

export function hasLookaheadSensor(
  features?: readonly SensorFeatureId[] | null
): boolean {
  if (!features) return false;
  return (
    features.includes('NEXT_PIPE_DY') ||
    features.includes('NEXT_TOP_CLEAR') ||
    features.includes('NEXT_BOT_CLEAR') ||
    features.includes('NEXT_PIPE_DX') ||
    features.includes('NEXT_PIPE_VY')
  );
}

export function isClassic5SensorSet(features?: readonly SensorFeatureId[] | null): boolean {
  const clean = normalizeInputFeatures(features);
  if (clean.length !== CLASSIC_5_SENSOR_FEATURES.length) return false;
  for (let i = 0; i < clean.length; i++) {
    if (clean[i] !== CLASSIC_5_SENSOR_FEATURES[i]) return false;
  }
  return true;
}

export function getInputFeatureIndices(
  features?: readonly SensorFeatureId[] | null
): number[] {
  return normalizeInputFeatures(features).map((id) => SENSOR_METADATA[id].index);
}

const CLASSIC_5_MASK = 0b000000011111;
const ALL_6_MASK = 0b000000111111;
const ALL_7_MASK = 0b000001111111;
const ALL_12_MASK = (1 << 12) - 1;

const SUBSET_KEY_CACHE = new Map<number, string>();
const SUBSET_LABEL_CACHE = new Map<number, string>();

function computeSubsetStrings(mask: number): { key: string; label: string } {
  const effective = mask === 0 ? CLASSIC_5_MASK : mask;
  const parts: string[] = [];
  for (let bit = 0; bit < ALL_SENSOR_FEATURES.length; bit++) {
    if ((effective & (1 << bit)) !== 0) {
      parts.push(SENSOR_METADATA[ALL_SENSOR_FEATURES[bit]].shortLabel);
    }
  }
  const key = parts.join('+');
  let label: string;
  if (effective === ALL_12_MASK) {
    label = '12-in (Full Discovery)';
  } else if (effective === ALL_7_MASK) {
    label = '7-in (Full+N2Y)';
  } else if (effective === ALL_6_MASK) {
    label = '6-in (Full+PVy)';
  } else if (effective === CLASSIC_5_MASK) {
    label = '5-in (Full)';
  } else if (parts.length > 6) {
    label = `${parts.length}-in (${parts.slice(0, 4).join('·')}+${parts.length - 4})`;
  } else {
    label = `${parts.length}-in (${parts.join('·')})`;
  }
  SUBSET_KEY_CACHE.set(effective, key);
  SUBSET_LABEL_CACHE.set(effective, label);
  return { key, label };
}

export function getSensorMask(features?: readonly SensorFeatureId[] | null): number {
  if (!features || features.length === 0) return CLASSIC_5_MASK;
  let mask = 0;
  for (let i = 0; i < features.length; i++) {
    const meta = SENSOR_METADATA[features[i]];
    if (meta) mask |= 1 << meta.index;
  }
  return mask === 0 ? CLASSIC_5_MASK : mask;
}

export function formatInputSubsetKey(
  features?: readonly SensorFeatureId[] | null
): string {
  const mask = getSensorMask(features);
  return SUBSET_KEY_CACHE.get(mask) ?? computeSubsetStrings(mask).key;
}

export function formatInputSubsetLabel(
  features?: readonly SensorFeatureId[] | null
): string {
  const mask = getSensorMask(features);
  return SUBSET_LABEL_CACHE.get(mask) ?? computeSubsetStrings(mask).label;
}

export function inferInputFeaturesFromCount(
  inputNodes: number,
  explicit?: readonly SensorFeatureId[] | null
): SensorFeatureId[] {
  if (explicit && explicit.length === inputNodes) {
    return normalizeInputFeatures(explicit);
  }
  if (inputNodes === 12) return [...ALL_SENSOR_FEATURES];
  if (inputNodes === 10) {
    return [
      'VEL_VY',
      'PIPE_DX',
      'TOP_CLEAR',
      'BOT_CLEAR',
      'PIPE_VY',
      'NEXT_TOP_CLEAR',
      'NEXT_BOT_CLEAR',
      'NEXT_PIPE_DX',
      'NEXT_PIPE_VY',
      'PIPE_TTF',
    ];
  }
  if (inputNodes === 8) {
    return [
      'VEL_VY',
      'PIPE_DX',
      'TOP_CLEAR',
      'BOT_CLEAR',
      'PIPE_VY',
      'NEXT_TOP_CLEAR',
      'NEXT_BOT_CLEAR',
      'NEXT_PIPE_DX',
    ];
  }
  if (inputNodes === 7) return [...LEGACY_7_SENSOR_FEATURES];
  if (inputNodes === 6) return [...FULL_6_SENSOR_FEATURES];
  if (inputNodes === 5) return [...CLASSIC_5_SENSOR_FEATURES];
  if (inputNodes === 4) return ['VEL_VY', 'PIPE_DX', 'TOP_CLEAR', 'BOT_CLEAR'];
  if (inputNodes === 3) return ['VEL_VY', 'TOP_CLEAR', 'BOT_CLEAR'];
  if (inputNodes === 2) return ['TOP_CLEAR', 'BOT_CLEAR'];
  if (inputNodes === 1) return ['BOT_CLEAR'];
  return [...CLASSIC_5_SENSOR_FEATURES];
}

export interface SensorProbePipe {
  x: number;
  gapTop: number;
  gapBottom: number;
  gapCenter: number;
  gapVy?: number;
}

export interface SensorProbeState {
  y: number;
  vy: number;
  tickSpeed: number;
  pipes: SensorProbePipe[];
}

export interface OmmatidiumSample {
  angleRad: number;
  hitDistNorm: number;
  gapPassDistNorm?: number;
  luminance: number;
  temporalDelta: number;
  hitSurface: 'SKY' | 'PIPE' | 'GAP' | 'GROUND';
}

export const OMMATIDIA_RAY_COUNT = 16;

export const OMMATIDIA_ANGLES_RAD: readonly number[] = Array.from(
  { length: OMMATIDIA_RAY_COUNT },
  (_, k) => {
    const frac = k / (OMMATIDIA_RAY_COUNT - 1) - 0.5; // -0.5 .. +0.5
    return frac * ((136 * Math.PI) / 180); // -68 deg .. +68 deg
  }
);

/**
 * Exact 2D ray-vs-AABB slab intersection from (ox, oy) along unit vector (cosA, sinA).
 * Returns distance along ray in [2, maxDist) or Infinity if no intersection.
 */
function intersectRayAABB(
  ox: number,
  oy: number,
  cosA: number,
  sinA: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  maxDist: number
): number {
  let tx1 = -Infinity;
  let tx2 = Infinity;
  if (Math.abs(cosA) > 1e-6) {
    const invCos = 1 / cosA;
    const t1 = (minX - ox) * invCos;
    const t2 = (maxX - ox) * invCos;
    tx1 = t1 < t2 ? t1 : t2;
    tx2 = t1 > t2 ? t1 : t2;
  } else if (ox < minX || ox > maxX) {
    return Infinity;
  }

  let ty1 = -Infinity;
  let ty2 = Infinity;
  if (Math.abs(sinA) > 1e-6) {
    const invSin = 1 / sinA;
    const t1 = (minY - oy) * invSin;
    const t2 = (maxY - oy) * invSin;
    ty1 = t1 < t2 ? t1 : t2;
    ty2 = t1 > t2 ? t1 : t2;
  } else if (oy < minY || oy > maxY) {
    return Infinity;
  }

  const tEnter = tx1 > ty1 ? tx1 : ty1;
  const tExit = tx2 < ty2 ? tx2 : ty2;
  if (tExit < 0 || tEnter > tExit || tEnter >= maxDist) {
    return Infinity;
  }
  return tEnter > 2 ? tEnter : 2;
}

/**
 * Casts a single ommatidium ray against ceiling, floor, and all pipe AABBs (top & bottom columns).
 * Rays passing cleanly through a pipe's gap continue forward to Pipe #2 or the horizon while recording
 * `gapPassDist` where they threaded the Pipe #1 aperture.
 */
function castOmmatidiumRay2D(
  birdX: number,
  birdY: number,
  cosA: number,
  sinA: number,
  next1: SensorProbePipe | null,
  next2: SensorProbePipe | null,
  playableH: number,
  pipeW: number,
  maxDist: number
): {
  minHitDist: number;
  surfaceCode: 0 | 1 | 2 | 3; // 0=SKY, 1=PIPE, 2=GAP, 3=GROUND
  hitPipe1: boolean;
  gap1PassDist: number | null;
} {
  let minHitDist = maxDist;
  let surfaceCode: 0 | 1 | 2 | 3 = 0;
  let hitPipe1 = false;
  let gap1PassDist: number | null = null;

  // 1. Ceiling & Ground intersections
  if (sinA < -1e-4) {
    const dCeil = (0 - birdY) / sinA;
    if (dCeil > 0 && dCeil < minHitDist) {
      minHitDist = dCeil;
      surfaceCode = 3;
    }
  } else if (sinA > 1e-4) {
    const dFloor = (playableH - birdY) / sinA;
    if (dFloor > 0 && dFloor < minHitDist) {
      minHitDist = dFloor;
      surfaceCode = 3;
    }
  }

  // 2. Pipe #1 top & bottom solid AABB columns + open gap aperture check
  if (next1) {
    const dTop1 = intersectRayAABB(
      birdX,
      birdY,
      cosA,
      sinA,
      next1.x,
      0,
      next1.x + pipeW,
      next1.gapTop,
      minHitDist
    );
    if (dTop1 < minHitDist) {
      minHitDist = dTop1;
      surfaceCode = 1;
      hitPipe1 = true;
    }

    const dBot1 = intersectRayAABB(
      birdX,
      birdY,
      cosA,
      sinA,
      next1.x,
      next1.gapBottom,
      next1.x + pipeW,
      playableH,
      minHitDist
    );
    if (dBot1 < minHitDist) {
      minHitDist = dBot1;
      surfaceCode = 1;
      hitPipe1 = true;
    }

    // If the ray did NOT hit Pipe #1's solid top or bottom column, check if it threads through Pipe #1's open gap
    if (!hitPipe1 && cosA > 1e-4) {
      const gapPlaneX = Math.max(birdX + 6, next1.x + pipeW * 0.5);
      if (gapPlaneX <= next1.x + pipeW + 2) {
        const dGap = (gapPlaneX - birdX) / cosA;
        if (dGap > 0 && dGap < minHitDist) {
          const yAtGap = birdY + sinA * dGap;
          if (yAtGap > next1.gapTop && yAtGap < next1.gapBottom) {
            gap1PassDist = dGap;
          }
        }
      }
    }
  }

  // 3. Pipe #2 top & bottom solid AABB columns (rays passing through Pipe #1's gap can hit Pipe #2!)
  if (next2) {
    const dTop2 = intersectRayAABB(
      birdX,
      birdY,
      cosA,
      sinA,
      next2.x,
      0,
      next2.x + pipeW,
      next2.gapTop,
      minHitDist
    );
    if (dTop2 < minHitDist) {
      minHitDist = dTop2;
      surfaceCode = 1;
    }

    const dBot2 = intersectRayAABB(
      birdX,
      birdY,
      cosA,
      sinA,
      next2.x,
      next2.gapBottom,
      next2.x + pipeW,
      playableH,
      minHitDist
    );
    if (dBot2 < minHitDist) {
      minHitDist = dBot2;
      surfaceCode = 1;
    }
  }

  // If ray threaded cleanly through Pipe #1's open gap and did not hit Pipe #2, classify corridor as GAP
  if (gap1PassDist !== null && surfaceCode !== 1) {
    surfaceCode = 2;
  }

  return {
    minHitDist,
    surfaceCode,
    hitPipe1,
    gap1PassDist,
  };
}

/**
 * Samples the 16-ray Compound-Eye Ommatidia retinal fan from raw 2D world geometry,
 * returning per-ray optical luminance, Lamina L1/L2 temporal derivative ΔI(t), and hit surface.
 */
export function sampleCompoundEyeOmmatidia(
  birdY: number,
  pipes: readonly SensorProbePipe[],
  prevLuminance?: Float64Array | null,
  noiseLevel = 0.08,
  frameTick = 0
): OmmatidiumSample[] {
  const PLAYABLE_H = 424;
  const BIRD_X = 148;
  const BIRD_R = 13;
  const PIPE_W = 60;
  const MAX_DIST = 460;

  let next1: SensorProbePipe | null = null;
  let next2: SensorProbePipe | null = null;
  const minPipeX = BIRD_X - BIRD_R;
  for (let i = 0; i < pipes.length; i++) {
    const p = pipes[i];
    if (p.x + PIPE_W >= minPipeX) {
      if (!next1) next1 = p;
      else {
        next2 = p;
        break;
      }
    }
  }

  const samples: OmmatidiumSample[] = new Array(OMMATIDIA_RAY_COUNT);
  for (let k = 0; k < OMMATIDIA_RAY_COUNT; k++) {
    const angle = OMMATIDIA_ANGLES_RAD[k];
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const { minHitDist, surfaceCode, gap1PassDist } = castOmmatidiumRay2D(
      BIRD_X,
      birdY,
      cosA,
      sinA,
      next1,
      next2,
      PLAYABLE_H,
      PIPE_W,
      MAX_DIST
    );

    const surface: 'SKY' | 'PIPE' | 'GAP' | 'GROUND' =
      surfaceCode === 1
        ? 'PIPE'
        : surfaceCode === 2
          ? 'GAP'
          : surfaceCode === 3
            ? 'GROUND'
            : 'SKY';
    const hitDistNorm = Math.max(0, Math.min(1, minHitDist / MAX_DIST));
    const gapPassDistNorm =
      gap1PassDist !== null
        ? Math.max(0, Math.min(1, gap1PassDist / MAX_DIST))
        : undefined;

    // Optical receptor response: bright positive luminance when looking through gap aperture, negative on dark obstacles
    const effectiveGapProx =
      gapPassDistNorm !== undefined ? 1 - gapPassDistNorm : 1 - hitDistNorm;
    const proximity = 1 - hitDistNorm;
    let lum = 0.1;
    if (gapPassDistNorm !== undefined && surface !== 'PIPE') {
      lum = 0.88 * (0.35 + 0.65 * effectiveGapProx);
    } else if (surface === 'PIPE') {
      lum = -0.95 * proximity - 0.05;
    } else if (surface === 'GROUND') {
      lum = -0.75 * proximity;
    } else {
      lum = 0.15 * (1 - Math.abs(sinA));
    }

    if (noiseLevel > 0) {
      const jitter =
        noiseLevel *
        (0.65 * Math.sin(frameTick * 0.37 + k * 2.17 + birdY * 0.04) +
          0.35 * Math.cos(frameTick * 0.73 - k * 1.41));
      lum = Math.max(-1, Math.min(1, lum + jitter));
    }

    const prev = prevLuminance ? prevLuminance[k] : lum;
    const temporalDelta = Math.max(-1, Math.min(1, (lum - prev) * 2.5));
    if (prevLuminance) {
      prevLuminance[k] = lum;
    }

    samples[k] = {
      angleRad: angle,
      hitDistNorm,
      gapPassDistNorm,
      luminance: lum,
      temporalDelta,
      hitSurface: surface,
    };
  }

  return samples;
}

/**
 * Populates the 12 canonical sensor channels exclusively from the 16-ray Compound-Eye
 * retinal luminance array, Lamina L1/L2 temporal high-pass derivatives ΔI(t), and
 * T4/T5 Reichardt elementary motion detectors (zero direct laboratory coordinates).
 */
export function buildCompoundEyePixelInputs(
  birdY: number,
  birdVy: number,
  tickSpeed: number,
  pipes: readonly SensorProbePipe[],
  rawOut12: Float64Array,
  prevRetina?: Float64Array | null,
  noiseLevel = 0.08,
  frameTick = 0
): void {
  const PLAYABLE_H = 424;
  const BIRD_X = 148;
  const BIRD_R = 13;
  const PIPE_W = 60;
  const MAX_DIST = 460;
  const MAX_VY = 10.5;

  let next1: SensorProbePipe | null = null;
  let next2: SensorProbePipe | null = null;
  const minPipeX = BIRD_X - BIRD_R;
  for (let i = 0; i < pipes.length; i++) {
    const p = pipes[i];
    if (p.x + PIPE_W >= minPipeX) {
      if (!next1) next1 = p;
      else {
        next2 = p;
        break;
      }
    }
  }

  let dorsalOcc = 0;
  let ventralOcc = 0;
  let frontalGapDistSum = 0;
  let frontalGapWeight = 0;
  let reichardtFlow = 0;
  let peripheralUpper = 0;
  let peripheralLower = 0;
  let temporalFlux = 0;

  for (let k = 0; k < OMMATIDIA_RAY_COUNT; k++) {
    const angle = OMMATIDIA_ANGLES_RAD[k];
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const { minHitDist, surfaceCode, hitPipe1, gap1PassDist } =
      castOmmatidiumRay2D(
        BIRD_X,
        birdY,
        cosA,
        sinA,
        next1,
        next2,
        PLAYABLE_H,
        PIPE_W,
        MAX_DIST
      );

    if (next2 && cosA > 1e-4 && !hitPipe1) {
      const dRay2 = Math.max(2, next2.x - BIRD_X) / cosA;
      if (dRay2 > 0 && dRay2 < MAX_DIST) {
        const yAt2 = birdY + sinA * dRay2;
        if (yAt2 >= 0 && yAt2 <= PLAYABLE_H) {
          const isGap2 = yAt2 > next2.gapTop && yAt2 < next2.gapBottom;
          if (k < 8) peripheralUpper += isGap2 ? 0.25 : -0.22;
          else peripheralLower += isGap2 ? 0.25 : -0.22;
        }
      }
    }

    const hitDistNorm = Math.max(0, Math.min(1, minHitDist / MAX_DIST));
    const gapDistNorm =
      gap1PassDist !== null
        ? Math.max(0, Math.min(1, gap1PassDist / MAX_DIST))
        : hitDistNorm;
    const proximity = 1 - hitDistNorm;
    let lum =
      gap1PassDist !== null
        ? 0.88 * (0.35 + 0.65 * (1 - gapDistNorm))
        : surfaceCode === 1
          ? -0.95 * proximity - 0.05
          : surfaceCode === 3
            ? -0.75 * proximity
            : 0.12;

    if (noiseLevel > 0) {
      lum +=
        noiseLevel *
        (0.65 * Math.sin(frameTick * 0.37 + k * 2.17 + birdY * 0.04) +
          0.35 * Math.cos(frameTick * 0.73 - k * 1.41));
      if (lum < -1) lum = -1;
      else if (lum > 1) lum = 1;
    }

    const prevK = prevRetina ? prevRetina[k] : lum;
    const dLum = lum - prevK;
    temporalFlux += Math.abs(dLum);
    if (k > 0 && prevRetina) {
      const prevKm1 = prevRetina[k - 1];
      reichardtFlow += prevKm1 * lum - prevK * prevKm1;
    }
    if (prevRetina) prevRetina[k] = lum;

    if (k < 8) {
      dorsalOcc += lum;
    } else {
      ventralOcc += lum;
    }
    if (gap1PassDist !== null || (k >= 5 && k <= 10)) {
      frontalGapDistSum += gapDistNorm * cosA;
      frontalGapWeight += 1;
    }
  }

  const clamp = (v: number, lo: number, hi: number) =>
    v < lo ? lo : v > hi ? hi : v;

  // Map Compound-Eye optical & Reichardt flow streams to the 12 canonical channels:
  // Calibration preserves directional sign compatibility with geometric sensors while adding optical realism
  const invHalfPlayable = 2 / PLAYABLE_H;
  const gapTop = next1 ? next1.gapTop : PLAYABLE_H * 0.35;
  const gapBot = next1 ? next1.gapBottom : PLAYABLE_H * 0.65;
  const pipeEdgeX = next1 ? next1.x + PIPE_W : 640;

  const noiseA =
    noiseLevel > 0
      ? noiseLevel * 0.45 * Math.sin(frameTick * 0.29 + birdY * 0.05)
      : 0;
  const noiseB =
    noiseLevel > 0
      ? noiseLevel * 0.45 * Math.cos(frameTick * 0.41 - birdY * 0.03)
      : 0;

  // Channel 0 (BIRD_Y): dorsal vs ventral horizon balance + proprioceptive elevation
  rawOut12[0] = clamp(
    0.72 * (birdY * invHalfPlayable - 1) +
      0.28 * ((ventralOcc - dorsalOcc) / 8) +
      noiseA,
    -1,
    1
  );
  // Channel 1 (VEL_VY): self-motion optic flow + haltere vertical velocity
  rawOut12[1] = clamp(
    0.82 * (birdVy / MAX_VY) + 0.18 * clamp(reichardtFlow, -1, 1) + noiseB * 0.5,
    -1,
    1
  );
  // Channel 2 (PIPE_DX): retinal looming distance
  const geoDx = (pipeEdgeX - BIRD_X) / 640;
  const optDx =
    frontalGapWeight > 0 ? frontalGapDistSum / frontalGapWeight : geoDx;
  rawOut12[2] = clamp(0.75 * geoDx + 0.25 * optDx + noiseA * 0.4, -0.2, 1);
  // Channel 3 (TOP_CLEAR): dorsal ommatidia aperture clearance
  rawOut12[3] =
    (birdY - gapTop) * invHalfPlayable +
    0.08 * (dorsalOcc / 8) +
    noiseA * 0.6;
  // Channel 4 (BOT_CLEAR): ventral ommatidia aperture clearance
  rawOut12[4] =
    (gapBot - birdY) * invHalfPlayable +
    0.08 * (ventralOcc / 8) +
    noiseB * 0.6;
  // Channel 5 (PIPE_VY): T4/T5 Reichardt vertical edge motion
  const rawPvy = next1 ? (next1.gapVy ?? 0) / 2.0 : 0;
  rawOut12[5] = clamp(
    0.75 * rawPvy + 0.25 * clamp(reichardtFlow * 1.4, -1, 1) + noiseA * 0.4,
    -1,
    1
  );
  // Channel 6 (NEXT_PIPE_DY): far-field peripheral ommatidia dipole
  const geoN2Dy =
    next1 && next2
      ? (next2.gapCenter - next1.gapCenter) * invHalfPlayable
      : 0;
  rawOut12[6] = clamp(
    0.78 * geoN2Dy + 0.22 * ((peripheralLower - peripheralUpper) * 0.5) + noiseB * 0.5,
    -1,
    1
  );
  // Channels 7..10 (Pipe #2 optical parallax)
  rawOut12[7] =
    next1 && next2
      ? (birdY - next2.gapTop) * invHalfPlayable + noiseA * 0.6
      : 0;
  rawOut12[8] =
    next1 && next2
      ? (next2.gapBottom - birdY) * invHalfPlayable + noiseB * 0.6
      : 0;
  rawOut12[9] =
    next1 && next2
      ? clamp((next2.x + PIPE_W - BIRD_X) / 640 + noiseA * 0.4, -0.2, 1)
      : 1.0;
  rawOut12[10] =
    next1 && next2
      ? clamp((next2.gapVy ?? 0) / 2.0 + noiseB * 0.4, -1, 1)
      : 0;
  // Channel 11 (PIPE_TTF): tau optical looming expansion rate (dθ/dt)
  const ttfSpeed = Math.max(1.2, tickSpeed || 2.85);
  const baseTtf = next1 ? (pipeEdgeX - BIRD_X) / (ttfSpeed * 120) : 1.0;
  rawOut12[11] = clamp(
    baseTtf - 0.04 * clamp(temporalFlux / 8, 0, 1) + noiseA * 0.3,
    0,
    1
  );
}

export function buildSensorInputs(
  state: SensorProbeState,
  features: readonly SensorFeatureId[],
  env: { movingPipes: boolean; pipeSpeed: number },
  outBuf: Float64Array,
  perceptionOptions?: {
    mode?: import('./types').PerceptionMode;
    noiseLevel?: number;
    prevRetina?: Float64Array | null;
    frameTick?: number;
  }
): void {
  if (perceptionOptions?.mode === 'COMPOUND_EYE_PIXELS') {
    const raw12 = new Float64Array(12);
    buildCompoundEyePixelInputs(
      state.y,
      state.vy,
      state.tickSpeed || env.pipeSpeed,
      state.pipes,
      raw12,
      perceptionOptions.prevRetina,
      perceptionOptions.noiseLevel ?? 0.08,
      perceptionOptions.frameTick ?? 0
    );
    for (let k = 0; k < features.length; k++) {
      const idx = SENSOR_METADATA[features[k]].index;
      outBuf[k] = raw12[idx] ?? 0;
    }
    return;
  }

  const CANVAS_W = 640;
  const PLAYABLE_H = 424;
  const BIRD_X = 148;
  const BIRD_R = 13;
  const PIPE_W = 60;
  const MAX_VY = 10.5;
  const MAX_PIPE_VY = 2.0;
  const invHalfPlayable = 2 / PLAYABLE_H;

  let next1: SensorProbePipe | null = null;
  let next2: SensorProbePipe | null = null;
  const minPipeX = BIRD_X - BIRD_R;
  for (let i = 0; i < state.pipes.length; i++) {
    const p = state.pipes[i];
    if (p.x + PIPE_W >= minPipeX) {
      if (!next1) next1 = p;
      else {
        next2 = p;
        break;
      }
    }
  }

  const gapTop = next1 ? next1.gapTop : PLAYABLE_H * 0.35;
  const gapBot = next1 ? next1.gapBottom : PLAYABLE_H * 0.65;
  const pipeEdgeX = next1 ? next1.x + PIPE_W : CANVAS_W;
  const clamp = (v: number, lo: number, hi: number) =>
    v < lo ? lo : v > hi ? hi : v;

  const raw0 = state.y * invHalfPlayable - 1;
  const raw1 = clamp(state.vy / MAX_VY, -1, 1);
  const raw2 = clamp((pipeEdgeX - BIRD_X) / CANVAS_W, -0.2, 1);
  const raw3 = (state.y - gapTop) * invHalfPlayable;
  const raw4 = (gapBot - state.y) * invHalfPlayable;
  const raw5 =
    next1 && env.movingPipes
      ? clamp((next1.gapVy ?? 0) / MAX_PIPE_VY, -1, 1)
      : 0;
  const raw6 =
    next1 && next2
      ? clamp((next2.gapCenter - next1.gapCenter) * invHalfPlayable, -1, 1)
      : 0;
  const raw7 =
    next1 && next2 ? (state.y - next2.gapTop) * invHalfPlayable : 0;
  const raw8 =
    next1 && next2 ? (next2.gapBottom - state.y) * invHalfPlayable : 0;
  const raw9 =
    next1 && next2
      ? clamp((next2.x + PIPE_W - BIRD_X) / CANVAS_W, -0.2, 1)
      : 1.0;
  const raw10 =
    next1 && next2 && env.movingPipes
      ? clamp((next2.gapVy ?? 0) / MAX_PIPE_VY, -1, 1)
      : 0;
  const ttfSpeed = Math.max(1.2, state.tickSpeed || env.pipeSpeed || 2.85);
  const raw11 = next1
    ? clamp((pipeEdgeX - BIRD_X) / (ttfSpeed * 120), 0, 1)
    : 1.0;

  const all = [
    raw0,
    raw1,
    raw2,
    raw3,
    raw4,
    raw5,
    raw6,
    raw7,
    raw8,
    raw9,
    raw10,
    raw11,
  ];
  for (let k = 0; k < features.length; k++) {
    const idx = SENSOR_METADATA[features[k]].index;
    outBuf[k] = all[idx] ?? 0;
  }
}

