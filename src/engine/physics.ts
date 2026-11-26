import type {
  CoreDifficultyPreset,
  DifficultyPreset,
  EnvironmentConfig,
  ScenarioSolvabilityProof,
} from './types';

export const CANVAS_WIDTH = 640;
export const CANVAS_HEIGHT = 480;
export const GROUND_HEIGHT = 56;
export const PLAYABLE_HEIGHT = CANVAS_HEIGHT - GROUND_HEIGHT;
export const BIRD_X = 148;
export const BIRD_RADIUS = 13;
export const PIPE_WIDTH = 60;
export const GRAVITY = 0.42;
export const JUMP_IMPULSE = -7.35;
export const MAX_VY = 10.5;

export const MAX_PIPE_VY_NORM = 2.0;
export const PIPE_HIT_R = BIRD_RADIUS - 2; // 11px circle radius vs pipe AABB
export const PIPE_HIT_R2 = PIPE_HIT_R * PIPE_HIT_R;
export const FLOOR_HIT_R = BIRD_RADIUS - 1; // 12px matches rendered ellipse vertical radius

export const CORE_DIFFICULTIES: readonly CoreDifficultyPreset[] = [
  'EASY',
  'MEDIUM',
  'HARD',
  'INSANE',
  'EXTRA_INSANE',
] as const;

export const DIFFICULTY_LEGACY_ALIASES: Record<
  DifficultyPreset,
  CoreDifficultyPreset | 'CUSTOM'
> = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
  INSANE: 'INSANE',
  EXTRA_INSANE: 'EXTRA_INSANE',
  STANDARD: 'EASY',
  VARIABLE_SPEED: 'MEDIUM',
  DYNAMIC_GAPS: 'MEDIUM',
  HEAVY_GRAVITY: 'HARD',
  MOVING_GUSTS: 'HARD',
  MOVING_GAPS: 'HARD',
  GUST_CHAOS: 'INSANE',
  TURBULENCE_EXTREME: 'INSANE',
  CUSTOM: 'CUSTOM',
};

export function normalizeDifficultyPreset(
  preset: DifficultyPreset
): CoreDifficultyPreset | 'CUSTOM' {
  return DIFFICULTY_LEGACY_ALIASES[preset] ?? 'EASY';
}

export const DIFFICULTY_SETTINGS: Record<DifficultyPreset, EnvironmentConfig> = {
  EASY: {
    label: 'Easy',
    gap: 156,
    gapVariance: 0,
    pipeSpeed: 2.55,
    speedVariability: 0,
    spawnFrames: 104,
    movingPipes: false,
    moveAmplitude: 0,
    gravityScale: 1.0,
  },
  MEDIUM: {
    label: 'Medium',
    gap: 130,
    gapVariance: 22,
    pipeSpeed: 3.0,
    speedVariability: 0.25,
    spawnFrames: 92,
    movingPipes: false,
    moveAmplitude: 0,
    gravityScale: 1.0,
  },
  HARD: {
    label: 'Hard',
    gap: 120,
    gapVariance: 18,
    pipeSpeed: 3.25,
    speedVariability: 0.3,
    spawnFrames: 88,
    movingPipes: true,
    moveAmplitude: 20,
    gravityScale: 1.08,
  },
  INSANE: {
    label: 'Insane',
    gap: 112,
    gapVariance: 20,
    pipeSpeed: 3.5,
    speedVariability: 0.38,
    spawnFrames: 84,
    movingPipes: true,
    moveAmplitude: 24,
    gravityScale: 1.15,
  },
  EXTRA_INSANE: {
    label: 'Extra Insane (Overdrive)',
    gap: 96,
    gapVariance: 24,
    pipeSpeed: 4.15,
    speedVariability: 0.48,
    spawnFrames: 70,
    movingPipes: true,
    moveAmplitude: 34,
    gravityScale: 1.24,
  },
  // Legacy preset definitions preserved solely for deterministic replay of imported legacy JSONs
  STANDARD: {
    label: 'Standard (Legacy)',
    gap: 132,
    gapVariance: 0,
    pipeSpeed: 2.85,
    speedVariability: 0,
    spawnFrames: 96,
    movingPipes: false,
    moveAmplitude: 0,
    gravityScale: 1.0,
  },
  VARIABLE_SPEED: {
    label: 'Variable Speed (Legacy)',
    gap: 128,
    gapVariance: 10,
    pipeSpeed: 3.05,
    speedVariability: 0.45,
    spawnFrames: 88,
    movingPipes: false,
    moveAmplitude: 0,
    gravityScale: 1.0,
  },
  DYNAMIC_GAPS: {
    label: 'Dynamic Gaps (Legacy)',
    gap: 124,
    gapVariance: 32,
    pipeSpeed: 3.15,
    speedVariability: 0.1,
    spawnFrames: 86,
    movingPipes: false,
    moveAmplitude: 0,
    gravityScale: 1.0,
  },
  MOVING_GAPS: {
    label: 'Moving + Gaps (Legacy)',
    gap: 124,
    gapVariance: 28,
    pipeSpeed: 3.15,
    speedVariability: 0,
    spawnFrames: 86,
    movingPipes: true,
    moveAmplitude: 24,
    gravityScale: 1.0,
  },
  MOVING_GUSTS: {
    label: 'Moving + Gusts (Legacy)',
    gap: 124,
    gapVariance: 0,
    pipeSpeed: 3.2,
    speedVariability: 0.4,
    spawnFrames: 84,
    movingPipes: true,
    moveAmplitude: 24,
    gravityScale: 1.0,
  },
  HEAVY_GRAVITY: {
    label: 'High Gravity (Legacy)',
    gap: 118,
    gapVariance: 10,
    pipeSpeed: 3.25,
    speedVariability: 0.1,
    spawnFrames: 84,
    movingPipes: false,
    moveAmplitude: 0,
    gravityScale: 1.35,
  },
  GUST_CHAOS: {
    label: 'Chaos & Gusts (Legacy)',
    gap: 116,
    gapVariance: 26,
    pipeSpeed: 3.4,
    speedVariability: 0.5,
    spawnFrames: 80,
    movingPipes: true,
    moveAmplitude: 24,
    gravityScale: 1.1,
  },
  TURBULENCE_EXTREME: {
    label: 'Extreme Turb. (Legacy)',
    gap: 114,
    gapVariance: 30,
    pipeSpeed: 3.5,
    speedVariability: 0.55,
    spawnFrames: 78,
    movingPipes: true,
    moveAmplitude: 32,
    gravityScale: 1.15,
  },
  CUSTOM: {
    label: 'Custom',
    gap: 124,
    gapVariance: 18,
    pipeSpeed: 3.15,
    speedVariability: 0.25,
    spawnFrames: 88,
    movingPipes: true,
    moveAmplitude: 18,
    gravityScale: 1.05,
  },
};

export const DIFFICULTY_ORDER: DifficultyPreset[] = [
  'EASY',
  'MEDIUM',
  'HARD',
  'INSANE',
  'EXTRA_INSANE',
];

export const ALL_DIFFICULTIES_ORDERED: DifficultyPreset[] = [
  ...DIFFICULTY_ORDER,
  'CUSTOM',
];

export type DifficultyTier =
  | 'Calm'
  | 'Moderate'
  | 'Dynamic'
  | 'Frontier'
  | 'Extreme'
  | 'Custom';

export const DIFFICULTY_META: Record<
  DifficultyPreset,
  {
    tier: DifficultyTier;
    tierPl: string;
    shortLabel: string;
    description: string;
    descriptionPl: string;
  }
> = {
  EASY: {
    tier: 'Calm',
    tierPl: 'Spokojny',
    shortLabel: 'Easy',
    description:
      'Calm baseline: wide 156px static gaps, gentle 2.55 speed, 1.0x gravity.',
    descriptionPl:
      'Spokojny tor bazowy: szerokie statyczne szczeliny 156px, łagodna prędkość 2.55, grawitacja 1.0x.',
  },
  MEDIUM: {
    tier: 'Moderate',
    tierPl: 'Umiarkowany',
    shortLabel: 'Medium',
    description:
      'Variable gaps (130±22px) + ±25% wind gusts at 3.0 speed. Tests lookahead and arrival timing.',
    descriptionPl:
      'Zmienne szczeliny (130±22px) + porywy wiatru ±25% przy prędkości 3.0. Testuje wyprzedzenie i wyczucie czasu.',
  },
  HARD: {
    tier: 'Dynamic',
    tierPl: 'Dynamiczny',
    shortLabel: 'Hard',
    description:
      'Oscillating pipes (±20px) + variable gaps (120±18px) + ±30% gusts + 1.08x gravity.',
    descriptionPl:
      'Ruchome rury (±20px) + zmienne szczeliny (120±18px) + porywy ±30% + grawitacja 1.08x.',
  },
  INSANE: {
    tier: 'Frontier',
    tierPl: 'Frontier',
    shortLabel: 'Insane',
    description:
      'Full coupled frontier: narrow moving gaps (112±20px, ±24px oscillation), ±38% gusts, 3.50 speed, 1.15x gravity — mathematically verified passable.',
    descriptionPl:
      'Pełny tor Frontier: wąskie ruchome szczeliny (112±20px, oscylacja ±24px), porywy ±38%, prędkość 3.50, grawitacja 1.15x — z dowodem przechodniości.',
  },
  EXTRA_INSANE: {
    tier: 'Extreme',
    tierPl: 'Ekstremalny',
    shortLabel: 'Extra Insane',
    description:
      'Unproven Overdrive beyond deterministic ballistic guarantees: 96±24px gaps, ±34px fast moving pipes, ±48% gusts, 4.15 speed, 1.24x gravity — tests phase anticipation and real-time plasticity.',
    descriptionPl:
      'Tryb Overdrive poza gwarancją balistyczną: szczeliny 96±24px, szybkie ruchome rury ±34px, porywy ±48%, prędkość 4.15, grawitacja 1.24x — testuje antycypację fazy i plastyczność.',
  },
  STANDARD: {
    tier: 'Calm',
    tierPl: 'Spokojny',
    shortLabel: 'Standard',
    description: 'Legacy alias mapped to Easy/Calm baseline.',
    descriptionPl: 'Starszy alias zmapowany na spokojny tor bazowy Easy.',
  },
  VARIABLE_SPEED: {
    tier: 'Moderate',
    tierPl: 'Umiarkowany',
    shortLabel: 'Var Speed',
    description: 'Legacy alias mapped to Medium.',
    descriptionPl: 'Starszy alias zmapowany na poziom Medium.',
  },
  DYNAMIC_GAPS: {
    tier: 'Moderate',
    tierPl: 'Umiarkowany',
    shortLabel: 'Dyn Gaps',
    description: 'Legacy alias mapped to Medium.',
    descriptionPl: 'Starszy alias zmapowany na poziom Medium.',
  },
  MOVING_GAPS: {
    tier: 'Dynamic',
    tierPl: 'Dynamiczny',
    shortLabel: 'Mov+Gaps',
    description: 'Legacy alias mapped to Hard.',
    descriptionPl: 'Starszy alias zmapowany na poziom Hard.',
  },
  MOVING_GUSTS: {
    tier: 'Dynamic',
    tierPl: 'Dynamiczny',
    shortLabel: 'Mov+Gusts',
    description: 'Legacy alias mapped to Hard.',
    descriptionPl: 'Starszy alias zmapowany na poziom Hard.',
  },
  HEAVY_GRAVITY: {
    tier: 'Dynamic',
    tierPl: 'Dynamiczny',
    shortLabel: 'High Grav',
    description: 'Legacy alias mapped to Hard.',
    descriptionPl: 'Starszy alias zmapowany na poziom Hard.',
  },
  GUST_CHAOS: {
    tier: 'Frontier',
    tierPl: 'Frontier',
    shortLabel: 'Chaos',
    description: 'Legacy alias mapped to Insane.',
    descriptionPl: 'Starszy alias zmapowany na poziom Insane.',
  },
  TURBULENCE_EXTREME: {
    tier: 'Extreme',
    tierPl: 'Ekstremalny',
    shortLabel: 'Ext Turb',
    description: 'Legacy alias mapped to Insane.',
    descriptionPl: 'Starszy alias zmapowany na poziom Insane.',
  },
  CUSTOM: {
    tier: 'Custom',
    tierPl: 'Własny',
    shortLabel: 'Custom',
    description:
      'Custom physics sandbox tuned with your own gap, speed, gusts, gravity, and moving-pipe sliders.',
    descriptionPl:
      'Własna fizyka dostrojona suwakami szerokości szczeliny, prędkości, porywów, grawitacji i ruchu rur.',
  },
};

export interface ProbePipe {
  x: number;
  baseGapTop: number;
  gapSize: number;
  gapTop: number;
  gapBottom: number;
  gapCenter: number;
  phase: number;
  gapVy: number;
}

export interface ProbePhysicsState {
  env: EnvironmentConfig;
  rng: () => number;
  speedPhaseA: number;
  speedPhaseB: number;
  distUntilNextSpawn: number;
  frameCount: number;
  tickSpeed: number;
  y: number;
  vy: number;
  alive: boolean;
  pipes: ProbePipe[];
}

export function createInitialPhysicsState(
  env: EnvironmentConfig,
  seed: number
): ProbePhysicsState {
  const rng = createSeededRng(seed);
  const gapSize = Math.max(
    76,
    Math.min(
      204,
      env.gap + (env.gapVariance > 0 ? (rng() * 2 - 1) * env.gapVariance : 0)
    )
  );
  const margin = env.movingPipes ? 72 : 52;
  const span = Math.max(20, PLAYABLE_HEIGHT - gapSize - margin * 2);
  const baseGapTop = margin + rng() * span;
  return {
    env,
    rng,
    speedPhaseA: rng() * Math.PI * 2,
    speedPhaseB: rng() * Math.PI * 2,
    distUntilNextSpawn: env.pipeSpeed * env.spawnFrames,
    frameCount: 0,
    tickSpeed: env.pipeSpeed,
    y: PLAYABLE_HEIGHT * 0.46,
    vy: 0,
    alive: true,
    pipes: [
      {
        x: CANVAS_WIDTH + 60,
        baseGapTop,
        gapSize,
        gapTop: baseGapTop,
        gapBottom: baseGapTop + gapSize,
        gapCenter: baseGapTop + gapSize * 0.5,
        phase: rng() * Math.PI * 2,
        gapVy: 0,
      },
    ],
  };
}

export function stepPhysics(
  state: ProbePhysicsState,
  decision: number,
  env: EnvironmentConfig
): void {
  if (!state.alive) return;
  const gravity = GRAVITY * env.gravityScale;
  const jumpImpulse = JUMP_IMPULSE * Math.sqrt(env.gravityScale);

  state.frameCount += 1;
  const speedMult =
    env.speedVariability > 0
      ? 1 +
        env.speedVariability *
          (0.55 * Math.sin(state.frameCount * 0.031 + state.speedPhaseA) +
            0.45 * Math.cos(state.frameCount * 0.079 + state.speedPhaseB))
      : 1;
  const tickSpeed = Math.max(1.2, env.pipeSpeed * speedMult);
  state.tickSpeed = tickSpeed;

  const baseSpacing = env.pipeSpeed * env.spawnFrames;
  state.distUntilNextSpawn -= tickSpeed;
  if (state.distUntilNextSpawn <= 0 && state.pipes.length < 8) {
    const gapSize = Math.max(
      76,
      Math.min(
        204,
        env.gap +
          (env.gapVariance > 0 ? (state.rng() * 2 - 1) * env.gapVariance : 0)
      )
    );
    const margin = env.movingPipes ? 72 : 52;
    const span = Math.max(20, PLAYABLE_HEIGHT - gapSize - margin * 2);
    const baseGapTop = margin + state.rng() * span;
    state.pipes.push({
      x: CANVAS_WIDTH + 20,
      baseGapTop,
      gapSize,
      gapTop: baseGapTop,
      gapBottom: baseGapTop + gapSize,
      gapCenter: baseGapTop + gapSize * 0.5,
      phase: state.rng() * Math.PI * 2,
      gapVy: 0,
    });
    state.distUntilNextSpawn =
      env.speedVariability > 0 || env.gapVariance > 0
        ? baseSpacing * (0.88 + state.rng() * 0.24)
        : baseSpacing;
  }

  let nextPipe: ProbePipe | null = null;
  const minPipeX = BIRD_X - BIRD_RADIUS;
  for (let i = 0; i < state.pipes.length; i++) {
    const p = state.pipes[i];
    p.x -= tickSpeed;
    if (env.movingPipes) {
      const prevTop = p.gapTop;
      const offset =
        Math.sin(state.frameCount * 0.045 + p.phase) * env.moveAmplitude;
      const maxTop = PLAYABLE_HEIGHT - p.gapSize - 42;
      const nextTop = Math.max(42, Math.min(maxTop, p.baseGapTop + offset));
      p.gapTop = nextTop;
      p.gapBottom = nextTop + p.gapSize;
      p.gapCenter = nextTop + p.gapSize * 0.5;
      p.gapVy = nextTop - prevTop;
    } else {
      p.gapVy = 0;
    }
    if (!nextPipe && p.x + PIPE_WIDTH >= minPipeX) {
      nextPipe = p;
    }
  }
  if (state.pipes.length > 0 && state.pipes[0].x + PIPE_WIDTH < -24) {
    state.pipes.shift();
  }

  if (decision > 0.5) {
    state.vy = jumpImpulse;
  }
  state.vy = Math.min(MAX_VY, state.vy + gravity);
  state.y += state.vy;

  if (state.y - FLOOR_HIT_R <= 0 || state.y + FLOOR_HIT_R >= PLAYABLE_HEIGHT) {
    state.alive = false;
    return;
  }
  if (nextPipe) {
    const pipeLeft = nextPipe.x;
    const pipeRight = pipeLeft + PIPE_WIDTH;
    let dx = 0;
    if (BIRD_X < pipeLeft) dx = pipeLeft - BIRD_X;
    else if (BIRD_X > pipeRight) dx = BIRD_X - pipeRight;
    if (dx < PIPE_HIT_R) {
      const effY = dx === 0 ? PIPE_HIT_R : Math.sqrt(PIPE_HIT_R2 - dx * dx);
      if (state.y - effY < nextPipe.gapTop || state.y + effY > nextPipe.gapBottom) {
        state.alive = false;
      }
    }
  }
}

/**
 * Builds an Overdrive environment from a percentage (100% = Insane Proven Frontier,
 * 120% = Default Extra Insane Unproven Overdrive, up to 145% Extreme Ballistic Deficit).
 */
export function buildOverdriveEnvironment(overdrivePct = 120): EnvironmentConfig {
  const clamped = Math.max(100, Math.min(145, Math.round(overdrivePct)));
  const factor = (clamped - 100) / 20; // 0.0 at 100% (Insane), 1.0 at 120% (Extra Insane), 2.25 at 145%
  const base = DIFFICULTY_SETTINGS.INSANE;
  return {
    label: `Extra Insane (${clamped}% Overdrive)`,
    gap: Math.max(76, Math.round(base.gap - 16 * factor)),
    gapVariance: Math.min(36, Math.round(base.gapVariance + 4 * factor)),
    pipeSpeed: Number((base.pipeSpeed + 0.65 * factor).toFixed(2)),
    speedVariability: Number(Math.min(0.65, base.speedVariability + 0.1 * factor).toFixed(2)),
    spawnFrames: Math.max(54, Math.round(base.spawnFrames - 14 * factor)),
    movingPipes: true,
    moveAmplitude: Math.min(48, Math.round(base.moveAmplitude + 10 * factor)),
    gravityScale: Number((base.gravityScale + 0.09 * factor).toFixed(2)),
  };
}

export function resolveEnvironment(
  difficulty: DifficultyPreset,
  customEnvironment?: EnvironmentConfig,
  overdrivePct?: number
): EnvironmentConfig {
  if (difficulty === 'CUSTOM' && customEnvironment) {
    return customEnvironment;
  }
  if (difficulty === 'EXTRA_INSANE') {
    if (overdrivePct !== undefined && overdrivePct >= 100) {
      return buildOverdriveEnvironment(overdrivePct);
    }
    return DIFFICULTY_SETTINGS.EXTRA_INSANE;
  }
  return DIFFICULTY_SETTINGS[difficulty] ?? DIFFICULTY_SETTINGS.EASY;
}

/**
 * Deterministic Ballistic & Geometric Reachability Proof.
 * Verifies mathematically that even under worst-case consecutive gap placement,
 * minimum random pipe spacing (0.88x), fastest wind gust (1 + speedVar),
 * narrowest gap (gap - gapVar), and maximum moving-lip oscillation during slow-gust
 * pipe transit, an agent has strictly positive climb, dive, and corridor slack.
 */
export function verifyScenarioSolvability(
  env: EnvironmentConfig
): ScenarioSolvabilityProof {
  const g = GRAVITY * env.gravityScale;
  const jump = JUMP_IMPULSE * Math.sqrt(env.gravityScale);
  const minGapPx = Math.max(76, env.gap - env.gapVariance);
  const margin = env.movingPipes ? 72 : 52;
  const span = Math.max(20, PLAYABLE_HEIGHT - minGapPx - margin * 2);

  // Worst-case vertical center delta between Pipe #1 and Pipe #2 (plus moving lip excursion)
  const oscExtra = env.movingPipes ? env.moveAmplitude * 0.65 : 0;
  const requiredDeltaYPx = Math.min(PLAYABLE_HEIGHT - minGapPx - 84, span + oscExtra);

  const hasRandomSpacing = env.speedVariability > 0 || env.gapVariance > 0;
  const minSpacing = env.pipeSpeed * env.spawnFrames * (hasRandomSpacing ? 0.88 : 1.0);
  const maxTickSpeed = env.pipeSpeed * (1 + env.speedVariability);
  const minTickSpeed = Math.max(1.2, env.pipeSpeed * (1 - env.speedVariability));
  const dtMinFrames = Math.max(1, Math.floor(minSpacing / Math.max(1.2, maxTickSpeed)));

  // Discrete Euler ballistic climb: flap whenever vy > -3.2 (sustained max climb rate)
  let climbDy = 0;
  let cVy = 0;
  for (let t = 0; t < dtMinFrames; t++) {
    if (cVy > jump * 0.42) {
      cVy = jump;
    }
    cVy = Math.min(MAX_VY, cVy + g);
    climbDy += -cVy;
  }

  // Discrete Euler free-fall dive from vy = 0
  let diveDy = 0;
  let dVy = 0;
  for (let t = 0; t < dtMinFrames; t++) {
    dVy = Math.min(MAX_VY, dVy + g);
    diveDy += dVy;
  }

  const maxClimbPx = Math.round(climbDy * 10) / 10;
  const maxDivePx = Math.round(diveDy * 10) / 10;
  const climbSlackPx = Math.round((maxClimbPx - requiredDeltaYPx) * 10) / 10;
  const diveSlackPx = Math.round((maxDivePx - requiredDeltaYPx) * 10) / 10;

  // Worst-case pipe transit aperture: bird body (2*PIPE_HIT_R=22px) + max lip movement during slow gust
  const transitFrames = Math.ceil((PIPE_WIDTH + 2 * PIPE_HIT_R) / minTickSpeed);
  const maxLipVel = env.movingPipes ? env.moveAmplitude * 0.045 : 0;
  const transitPipeTravelPx = Math.round(transitFrames * maxLipVel * 10) / 10;
  const transitClearancePx =
    Math.round((minGapPx - 2 * PIPE_HIT_R - transitPipeTravelPx) * 10) / 10;

  const solvable =
    climbSlackPx > 0 && diveSlackPx > 0 && transitClearancePx > 4;

  const summary = solvable
    ? `SOLVABLE (dt>=${dtMinFrames}f, climb +${Math.round(climbSlackPx)}px, dive +${Math.round(diveSlackPx)}px, transit +${Math.round(transitClearancePx)}px)`
    : `UNSOLVABLE RISK (climb ${climbSlackPx >= 0 ? '+' : ''}${Math.round(climbSlackPx)}px, dive ${diveSlackPx >= 0 ? '+' : ''}${Math.round(diveSlackPx)}px, transit ${transitClearancePx >= 0 ? '+' : ''}${Math.round(transitClearancePx)}px)`;

  return {
    solvable,
    dtMinFrames,
    minGapPx: Math.round(minGapPx),
    requiredDeltaYPx: Math.round(requiredDeltaYPx),
    maxClimbPx,
    maxDivePx,
    climbSlackPx,
    diveSlackPx,
    transitFrames,
    transitPipeTravelPx,
    transitClearancePx,
    summary,
  };
}

/**
 * Progressive Curriculum Annealing for training episodes ONLY.
 * Smoothly ramps gap width, oscillation amplitude, gap variance, and wind gust
 * variability from a forgiving warm-up at Gen 1 to 100% true target physics by
 * `curriculumGenerations` (default 18).
 *
 * INVARIANT: Never used in `auditBrainMastery` or `VS_AI` — certification always
 * runs at 100% unmodified target physics.
 */
export function resolveCurriculumEnvironment(
  targetEnv: EnvironmentConfig,
  generation: number,
  curriculumGenerations = 18
): EnvironmentConfig {
  const rampGens = Math.max(2, Math.round(curriculumGenerations));
  const rawProgress = (Math.max(1, generation) - 1) / (rampGens - 1);
  if (rawProgress >= 1) {
    return targetEnv;
  }
  const t = 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, rawProgress)));

  const startGap = Math.min(162, Math.max(targetEnv.gap, targetEnv.gap + 28));
  const startSpeed =
    targetEnv.pipeSpeed > 3.15
      ? Math.max(3.0, targetEnv.pipeSpeed * 0.88)
      : targetEnv.pipeSpeed;

  return {
    ...targetEnv,
    gap: Math.round(startGap + (targetEnv.gap - startGap) * t),
    gapVariance: Math.round(targetEnv.gapVariance * (0.25 + 0.75 * t)),
    pipeSpeed: Number((startSpeed + (targetEnv.pipeSpeed - startSpeed) * t).toFixed(2)),
    speedVariability: Number((targetEnv.speedVariability * (0.25 + 0.75 * t)).toFixed(3)),
    moveAmplitude: targetEnv.movingPipes
      ? Math.round(targetEnv.moveAmplitude * (0.2 + 0.8 * t))
      : 0,
  };
}

export function createSeededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >> 14)) >>> 0) / 4294967296;
  };
}
