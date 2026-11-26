import { Award, Check, Pause, Play, RotateCcw, Sparkles, UserCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  BIRD_RADIUS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  FlappySimulation,
  GROUND_HEIGHT,
  PIPE_WIDTH,
  PLAYABLE_HEIGHT,
} from '../engine/simulation';
import { SENSOR_METADATA } from '../engine/sensors';
import { ARCHITECTURE_CATALOG } from '../engine/architectureCatalog';
import type {
  ArcadeOrb,
  BirdRenderState,
  DifficultyPreset,
  EnvironmentConfig,
  GameMode,
  Pipe,
  PlayScorePopup,
  PlaySubMode,
  RenderSnapshot,
  SensorFeatureId,
  VsAiPhase,
} from '../engine/types';
import { useLanguage } from '../i18n/LanguageContext';
import { getMedalForScore } from './PlayArcadePanel';

export interface TrainingCanvasHud {
  algorithmLabel: string;
  topologyLabel: string;
  generation: number;
  aliveCount: number;
  totalPopulation: number;
  currentBestScore: number;
  allTimeBestScore: number;
  effectiveMultiplier?: number;
  showMultiplier?: boolean;
}

interface ArcadeCanvasProps {
  trainingSnapshotRef: React.MutableRefObject<RenderSnapshot | null>;
  vsAiSimRef: React.MutableRefObject<FlappySimulation>;
  running: boolean;
  showSensors: boolean;
  mode: GameMode;
  playSubMode?: PlaySubMode;
  personalBest?: number;
  bestPoints?: number;
  lastRunWasNewRecord?: boolean;
  trainingHud?: TrainingCanvasHud;
  vsAiPhase: VsAiPhase;
  playerScore: number;
  playerPoints?: number;
  playerCombo?: number;
  playerMaxCombo?: number;
  playerOrbsCollected?: number;
  playerNick?: string;
  aiOpponentScore: number;
  playerAlive: boolean;
  aiOpponentAlive: boolean;
  vsAiWinner: 'PLAYER' | 'AI' | 'TIE' | null;
  onPlayerFlap: () => void;
  onTogglePause?: () => void;
  onFinishEarly: () => void;
  onRematch: () => void;
  onBackToLab: () => void;
  onSaveRunWithNick?: (nick: string) => void;
  onSyncVsAiTelemetry: () => void;
}

type VisualThemeKey =
  | 'EASY'
  | 'STANDARD'
  | 'WIND'
  | 'GRAVITY'
  | 'DYNAMIC'
  | 'EXTREME'
  | 'CUSTOM';

interface VisualThemePalette {
  skyStops: [string, string, string];
  gridColor: string;
  skylineFill: string;
  skylineRim: string;
  windowPrimary: string;
  windowSecondary: string;
  cloudFill: string;
  pipeBody: string;
  pipeLight: string;
  pipeMid: string;
  pipeDark: string;
  pipeBorder: string;
  pipeCap: string;
  pipeCapLight: string;
  groundTop: string;
  groundSub: string;
  groundBase: string;
  groundStripe: string;
  hazardCaps: boolean;
}

const THEME_PALETTES: Record<VisualThemeKey, VisualThemePalette> = {
  EASY: {
    skyStops: ['#081A2F', '#123254', '#1C4B70'],
    gridColor: 'rgba(125, 211, 252, 0.06)',
    skylineFill: 'rgba(10, 25, 44, 0.65)',
    skylineRim: 'rgba(56, 189, 248, 0.25)',
    windowPrimary: 'rgba(52, 211, 153, 0.28)',
    windowSecondary: 'rgba(125, 211, 252, 0.24)',
    cloudFill: 'rgba(186, 230, 253, 0.11)',
    pipeBody: '#10B981',
    pipeLight: '#6EE7B7',
    pipeMid: '#34D399',
    pipeDark: '#059669',
    pipeBorder: '#022C22',
    pipeCap: '#34D399',
    pipeCapLight: '#A7F3D0',
    groundTop: '#34D399',
    groundSub: '#059669',
    groundBase: '#0C1A2A',
    groundStripe: '#162A42',
    hazardCaps: false,
  },
  STANDARD: {
    skyStops: ['#071022', '#10213E', '#1B365D'],
    gridColor: 'rgba(148, 163, 184, 0.05)',
    skylineFill: 'rgba(11, 19, 36, 0.72)',
    skylineRim: 'rgba(30, 41, 59, 0.55)',
    windowPrimary: 'rgba(34, 211, 238, 0.25)',
    windowSecondary: 'rgba(250, 204, 21, 0.2)',
    cloudFill: 'rgba(148, 163, 184, 0.08)',
    pipeBody: '#059669',
    pipeLight: '#34D399',
    pipeMid: '#10B981',
    pipeDark: '#047857',
    pipeBorder: '#022C22',
    pipeCap: '#10B981',
    pipeCapLight: '#6EE7B7',
    groundTop: '#10B981',
    groundSub: '#047857',
    groundBase: '#0F172A',
    groundStripe: '#1E293B',
    hazardCaps: false,
  },
  WIND: {
    skyStops: ['#061322', '#0E2942', '#194262'],
    gridColor: 'rgba(56, 189, 248, 0.07)',
    skylineFill: 'rgba(9, 23, 39, 0.74)',
    skylineRim: 'rgba(56, 189, 248, 0.35)',
    windowPrimary: 'rgba(56, 189, 248, 0.3)',
    windowSecondary: 'rgba(224, 242, 254, 0.22)',
    cloudFill: 'rgba(125, 211, 252, 0.12)',
    pipeBody: '#0284C7',
    pipeLight: '#38BDF8',
    pipeMid: '#0EA5E9',
    pipeDark: '#0369A1',
    pipeBorder: '#082F49',
    pipeCap: '#0EA5E9',
    pipeCapLight: '#7DD3FC',
    groundTop: '#38BDF8',
    groundSub: '#0369A1',
    groundBase: '#0B1626',
    groundStripe: '#172A40',
    hazardCaps: false,
  },
  GRAVITY: {
    skyStops: ['#161021', '#261932', '#3B2335'],
    gridColor: 'rgba(251, 146, 60, 0.06)',
    skylineFill: 'rgba(22, 14, 30, 0.78)',
    skylineRim: 'rgba(245, 158, 11, 0.3)',
    windowPrimary: 'rgba(251, 191, 36, 0.28)',
    windowSecondary: 'rgba(249, 115, 22, 0.22)',
    cloudFill: 'rgba(251, 191, 36, 0.07)',
    pipeBody: '#B45309',
    pipeLight: '#F59E0B',
    pipeMid: '#D97706',
    pipeDark: '#92400E',
    pipeBorder: '#2D1606',
    pipeCap: '#D97706',
    pipeCapLight: '#FCD34D',
    groundTop: '#F59E0B',
    groundSub: '#92400E',
    groundBase: '#18111F',
    groundStripe: '#291D33',
    hazardCaps: false,
  },
  DYNAMIC: {
    skyStops: ['#0D102A', '#191C45', '#272963'],
    gridColor: 'rgba(167, 139, 250, 0.07)',
    skylineFill: 'rgba(15, 16, 42, 0.78)',
    skylineRim: 'rgba(167, 139, 250, 0.32)',
    windowPrimary: 'rgba(167, 139, 250, 0.3)',
    windowSecondary: 'rgba(34, 211, 238, 0.25)',
    cloudFill: 'rgba(196, 181, 253, 0.08)',
    pipeBody: '#6D28D9',
    pipeLight: '#A78BFA',
    pipeMid: '#7C3AED',
    pipeDark: '#5B21B6',
    pipeBorder: '#1E103C',
    pipeCap: '#7C3AED',
    pipeCapLight: '#C4B5FD',
    groundTop: '#8B5CF6',
    groundSub: '#5B21B6',
    groundBase: '#111126',
    groundStripe: '#1E1E3F',
    hazardCaps: false,
  },
  EXTREME: {
    skyStops: ['#160812', '#2B0E20', '#441528'],
    gridColor: 'rgba(244, 63, 94, 0.08)',
    skylineFill: 'rgba(20, 8, 18, 0.82)',
    skylineRim: 'rgba(244, 63, 94, 0.38)',
    windowPrimary: 'rgba(251, 113, 133, 0.3)',
    windowSecondary: 'rgba(251, 191, 36, 0.24)',
    cloudFill: 'rgba(251, 113, 133, 0.08)',
    pipeBody: '#9F1239',
    pipeLight: '#FB7185',
    pipeMid: '#BE123C',
    pipeDark: '#881337',
    pipeBorder: '#2A0712',
    pipeCap: '#E11D48',
    pipeCapLight: '#FDA4AF',
    groundTop: '#F43F5E',
    groundSub: '#881337',
    groundBase: '#170B14',
    groundStripe: '#291222',
    hazardCaps: true,
  },
  CUSTOM: {
    skyStops: ['#07181B', '#0E2C30', '#164247'],
    gridColor: 'rgba(45, 212, 191, 0.07)',
    skylineFill: 'rgba(8, 25, 28, 0.75)',
    skylineRim: 'rgba(45, 212, 191, 0.32)',
    windowPrimary: 'rgba(45, 212, 191, 0.28)',
    windowSecondary: 'rgba(52, 211, 153, 0.22)',
    cloudFill: 'rgba(94, 234, 212, 0.09)',
    pipeBody: '#0D9488',
    pipeLight: '#2DD4BF',
    pipeMid: '#14B8A6',
    pipeDark: '#0F766E',
    pipeBorder: '#042F2E',
    pipeCap: '#14B8A6',
    pipeCapLight: '#5EEAD4',
    groundTop: '#14B8A6',
    groundSub: '#0F766E',
    groundBase: '#0A1A1D',
    groundStripe: '#142E33',
    hazardCaps: false,
  },
};

function resolveVisualTheme(difficulty: DifficultyPreset): VisualThemeKey {
  switch (difficulty) {
    case 'EASY':
      return 'EASY';
    case 'STANDARD':
      return 'STANDARD';
    case 'MEDIUM':
    case 'VARIABLE_SPEED':
    case 'MOVING_GUSTS':
      return 'WIND';
    case 'HARD':
    case 'HEAVY_GRAVITY':
      return 'GRAVITY';
    case 'DYNAMIC_GAPS':
    case 'MOVING_GAPS':
      return 'DYNAMIC';
    case 'INSANE':
    case 'EXTRA_INSANE':
    case 'GUST_CHAOS':
    case 'TURBULENCE_EXTREME':
      return 'EXTREME';
    case 'CUSTOM':
      return 'CUSTOM';
  }
}

const STARS = Array.from({ length: 34 }, (_, i) => ({
  x: ((i * 137) % (CANVAS_WIDTH - 20)) + 10,
  y: ((i * 73) % 190) + 18,
  size: i % 3 === 0 ? 2 : 1.5,
  alpha: 0.25 + (i % 4) * 0.14,
}));

const CLOUDS = [
  { x: 60, y: 84, w: 72, h: 18 },
  { x: 240, y: 58, w: 94, h: 22 },
  { x: 440, y: 98, w: 68, h: 16 },
  { x: 580, y: 66, w: 80, h: 20 },
];

const WIND_STREAKS = Array.from({ length: 14 }, (_, i) => ({
  y: 26 + ((i * 31) % (PLAYABLE_HEIGHT - 56)),
  len: 28 + (i % 4) * 18,
  speedMult: 0.9 + (i % 3) * 0.35,
  phase: i * 97,
}));

const GRAVITY_STREAKS = Array.from({ length: 12 }, (_, i) => ({
  x: 24 + ((i * 53) % (CANVAS_WIDTH - 48)),
  len: 16 + (i % 3) * 10,
  phase: i * 61,
}));

const SKYLINE_BLOCKS = [
  { x: 0, w: 46, h: 68 },
  { x: 48, w: 34, h: 96 },
  { x: 84, w: 54, h: 56 },
  { x: 140, w: 40, h: 112 },
  { x: 182, w: 62, h: 74 },
  { x: 246, w: 38, h: 88 },
  { x: 286, w: 56, h: 60 },
  { x: 344, w: 44, h: 104 },
  { x: 390, w: 58, h: 72 },
  { x: 450, w: 36, h: 92 },
  { x: 488, w: 60, h: 64 },
  { x: 550, w: 46, h: 108 },
  { x: 598, w: 44, h: 78 },
];

function createSkyBackdrop(themeKey: VisualThemeKey): HTMLCanvasElement {
  const palette = THEME_PALETTES[themeKey];
  const offscreen = document.createElement('canvas');
  offscreen.width = CANVAS_WIDTH;
  offscreen.height = PLAYABLE_HEIGHT;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return offscreen;

  const skyGrad = ctx.createLinearGradient(0, 0, 0, PLAYABLE_HEIGHT);
  skyGrad.addColorStop(0, palette.skyStops[0]);
  skyGrad.addColorStop(0.55, palette.skyStops[1]);
  skyGrad.addColorStop(1, palette.skyStops[2]);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, PLAYABLE_HEIGHT);

  ctx.strokeStyle = palette.gridColor;
  ctx.lineWidth = 1;
  for (let gx = 0; gx < CANVAS_WIDTH; gx += 40) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, PLAYABLE_HEIGHT);
    ctx.stroke();
  }
  for (let gy = 0; gy < PLAYABLE_HEIGHT; gy += 40) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(CANVAS_WIDTH, gy);
    ctx.stroke();
  }

  for (const star of STARS) {
    ctx.fillStyle = `rgba(226, 232, 240, ${star.alpha})`;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }

  // Retro stepped arcade skyline with glowing window pixels
  for (let idx = 0; idx < SKYLINE_BLOCKS.length; idx++) {
    const b = SKYLINE_BLOCKS[idx];
    const topY = PLAYABLE_HEIGHT - b.h;
    ctx.fillStyle = palette.skylineFill;
    ctx.fillRect(b.x, topY, b.w, b.h);
    ctx.fillStyle = palette.skylineRim;
    ctx.fillRect(b.x, topY, b.w, 3);

    for (let wy = topY + 10; wy < PLAYABLE_HEIGHT - 12; wy += 12) {
      for (let wx = b.x + 8; wx < b.x + b.w - 8; wx += 10) {
        if ((wx + wy + idx) % 5 === 0) {
          ctx.fillStyle =
            (wx + idx) % 2 === 0
              ? palette.windowPrimary
              : palette.windowSecondary;
          ctx.fillRect(wx, wy, 4, 5);
        }
      }
    }
  }

  return offscreen;
}

function drawClouds(
  ctx: CanvasRenderingContext2D,
  offset: number,
  palette: VisualThemePalette
) {
  ctx.save();
  ctx.fillStyle = palette.cloudFill;
  for (const c of CLOUDS) {
    const cx =
      (((c.x - offset * 0.25) % (CANVAS_WIDTH + 140)) + (CANVAS_WIDTH + 140)) %
        (CANVAS_WIDTH + 140) -
      90;
    ctx.fillRect(cx, c.y, c.w, c.h);
    ctx.fillRect(cx + 12, c.y - 8, c.w - 24, 8);
  }
  ctx.restore();
}

function drawEnvironmentEffects(
  ctx: CanvasRenderingContext2D,
  env: EnvironmentConfig,
  tickSpeed: number,
  animOffset: number
) {
  // Wind gust streaks scaled dynamically by instantaneous gust speed
  if (env.speedVariability > 0.05) {
    const gustRatio = Math.max(0.5, tickSpeed / Math.max(1.5, env.pipeSpeed));
    const alpha = Math.min(0.32, 0.08 + env.speedVariability * 0.28 * gustRatio);
    ctx.save();
    ctx.strokeStyle = `rgba(186, 230, 253, ${alpha.toFixed(2)})`;
    ctx.lineWidth = gustRatio > 1.15 ? 1.5 : 1;
    for (const s of WIND_STREAKS) {
      const span = CANVAS_WIDTH + s.len + 40;
      const x =
        CANVAS_WIDTH +
        20 -
        ((animOffset * 4.2 * s.speedMult * gustRatio + s.phase) % span);
      ctx.beginPath();
      ctx.moveTo(x, s.y);
      ctx.lineTo(x + s.len * gustRatio, s.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Heavy gravity subtle downward pull streaks
  if (env.gravityScale >= 1.1) {
    const intensity = Math.min(1, (env.gravityScale - 1.05) / 0.35);
    ctx.save();
    ctx.strokeStyle = `rgba(251, 191, 36, ${(0.07 + intensity * 0.14).toFixed(2)})`;
    ctx.lineWidth = 1;
    for (const g of GRAVITY_STREAKS) {
      const span = PLAYABLE_HEIGHT + g.len;
      const y = ((animOffset * (2.4 + intensity * 2.2) + g.phase) % span) - g.len;
      ctx.beginPath();
      ctx.moveTo(g.x, y);
      ctx.lineTo(g.x, y + g.len);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawBird(
  ctx: CanvasRenderingContext2D,
  bird: BirdRenderState,
  isHighlight: boolean,
  isGhost = false
) {
  ctx.save();
  ctx.globalAlpha = isGhost ? bird.opacity * 0.26 : bird.opacity;
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  if (isGhost) {
    // Non-distracting translucent AI ghost while the human player is actively flying
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_RADIUS + 1, BIRD_RADIUS - 1, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.32)';
    ctx.fill();
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.85)';
    ctx.stroke();
    ctx.setLineDash([]);

    const wingOffsetY = Math.sin(bird.wingPhase) * 3.0;
    ctx.beginPath();
    ctx.ellipse(-4, 2 + wingOffsetY * 0.6, 6, 3.8, -0.15, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(125, 211, 252, 0.45)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(5.5, -3, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(224, 242, 254, 0.7)';
    ctx.fill();

    ctx.restore();

    if (bird.alive) {
      ctx.save();
      ctx.globalAlpha = 0.38;
      ctx.font = '600 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#67E8F9';
      ctx.fillText('AI', bird.x, bird.y - BIRD_RADIUS - 8);
      ctx.restore();
    }
    return;
  }

  let bodyColor = 'rgba(56, 189, 248, 0.34)';
  let borderColor = 'rgba(186, 230, 253, 0.45)';
  let wingColor = 'rgba(125, 211, 252, 0.45)';
  let beakColor = 'rgba(251, 191, 36, 0.55)';
  const speciesEntry = bird.species
    ? ARCHITECTURE_CATALOG[bird.species]
    : undefined;
  const isHero = isHighlight || bird.isChampion || Boolean(bird.isSpeciesLeader);

  if (bird.isPlayer) {
    bodyColor = bird.alive ? '#F59E0B' : 'rgba(245, 158, 11, 0.35)';
    borderColor = '#FEF3C7';
    wingColor = '#FDE68A';
    beakColor = '#EA580C';
  } else if (speciesEntry) {
    bodyColor = isHero ? speciesEntry.colorHex : `${speciesEntry.colorHex}55`;
    borderColor = isHighlight ? '#FFFFFF' : isHero ? '#F8FAFC' : `${speciesEntry.colorHex}AA`;
    wingColor = isHighlight ? '#FACC15' : '#E2E8F0';
    beakColor = '#F97316';
  } else if (isHighlight || bird.isChampion) {
    bodyColor = bird.alive ? '#06B6D4' : 'rgba(6, 182, 212, 0.35)';
    borderColor = '#ECFEFF';
    wingColor = '#FACC15';
    beakColor = '#F97316';
  }

  if ((isHero || bird.isPlayer) && bird.alive) {
    ctx.beginPath();
    ctx.arc(0, 0, isHighlight ? BIRD_RADIUS + 6 : BIRD_RADIUS + 4, 0, Math.PI * 2);
    ctx.strokeStyle = bird.isPlayer
      ? 'rgba(245, 158, 11, 0.45)'
      : speciesEntry
        ? `${speciesEntry.colorHex}88`
        : 'rgba(34, 211, 238, 0.45)';
    ctx.lineWidth = isHighlight ? 2 : 1.4;
    ctx.stroke();

    // Retro tail feather & crest
    ctx.beginPath();
    ctx.moveTo(-BIRD_RADIUS + 2, -2);
    ctx.lineTo(-BIRD_RADIUS - 7, -5);
    ctx.lineTo(-BIRD_RADIUS - 5, 3);
    ctx.closePath();
    ctx.fillStyle = bird.isPlayer
      ? '#FBBF24'
      : speciesEntry
        ? speciesEntry.colorHex
        : '#22D3EE';
    ctx.fill();
  }

  ctx.beginPath();
  ctx.ellipse(0, 0, BIRD_RADIUS + 1, BIRD_RADIUS - 1, 0, 0, Math.PI * 2);
  ctx.fillStyle = bodyColor;
  ctx.fill();
  ctx.lineWidth = isHero || bird.isPlayer ? 2 : 1.25;
  ctx.strokeStyle = borderColor;
  ctx.stroke();

  const wingOffsetY = Math.sin(bird.wingPhase) * 3.2;
  ctx.beginPath();
  ctx.ellipse(-4, 2 + wingOffsetY * 0.6, 6.5, 4.2, -0.15, 0, Math.PI * 2);
  ctx.fillStyle = wingColor;
  ctx.fill();

  if (isHero || bird.isPlayer) {
    ctx.beginPath();
    ctx.arc(5.5, -3.5, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(6.8, -3.5, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = '#0F172A';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(10, -1);
    ctx.lineTo(18, 2);
    ctx.lineTo(10, 5);
    ctx.closePath();
    ctx.fillStyle = beakColor;
    ctx.fill();
  }

  ctx.restore();

  if (speciesEntry && isHighlight && bird.alive && !bird.isPlayer) {
    ctx.save();
    ctx.font = '700 9.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const tag = `★ ${speciesEntry.shortLabel}`;
    const tagW = ctx.measureText(tag).width + 10;
    const tagX = Math.max(6, Math.min(CANVAS_WIDTH - tagW - 6, bird.x - tagW / 2));
    const tagY = Math.max(6, bird.y - BIRD_RADIUS - 20);
    ctx.fillStyle = 'rgba(11, 17, 32, 0.9)';
    ctx.fillRect(tagX, tagY, tagW, 14);
    ctx.strokeStyle = speciesEntry.colorHex;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(tagX, tagY, tagW, 14);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(tag, tagX + tagW / 2, tagY + 10);
    ctx.restore();
  }

  if (bird.isPlayer && bird.alive) {
    ctx.save();
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FCD34D';
    ctx.fillText('YOU', bird.x, bird.y - BIRD_RADIUS - 10);
    ctx.restore();
  } else if (bird.isChampion && bird.alive && !isHighlight) {
    ctx.save();
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#67E8F9';
    ctx.fillText('AI', bird.x, bird.y - BIRD_RADIUS - 10);
    ctx.restore();
  }
}

function drawPipe(
  ctx: CanvasRenderingContext2D,
  pipe: Pipe,
  palette: VisualThemePalette,
  movingPipes: boolean
) {
  const capHeight = 16;
  const capOverhang = 2; // Tightened to match exact Circle-vs-AABB hitbox

  // Hydraulic vertical track rails behind moving pipes
  if (movingPipes) {
    const cx = pipe.x + PIPE_WIDTH * 0.5;
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, pipe.gapTop);
    ctx.lineTo(cx, pipe.gapBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Subtle motion direction chevron on moving pipe gap edges
    const gapVy = pipe.gapVy ?? 0;
    if (Math.abs(gapVy) > 0.04) {
      const dir = gapVy > 0 ? 1 : -1;
      ctx.fillStyle =
        dir > 0 ? 'rgba(251, 191, 36, 0.55)' : 'rgba(56, 189, 248, 0.55)';
      const drawChevron = (y: number) => {
        ctx.beginPath();
        ctx.moveTo(cx - 5, y - dir * 2);
        ctx.lineTo(cx, y + dir * 3);
        ctx.lineTo(cx + 5, y - dir * 2);
        ctx.closePath();
        ctx.fill();
      };
      drawChevron(pipe.gapTop - 8);
      drawChevron(pipe.gapBottom + 8);
    }
    ctx.restore();
  }

  const drawPipeSegment = (
    x: number,
    y: number,
    w: number,
    h: number,
    capAtBottom: boolean
  ) => {
    if (h <= 0) return;

    ctx.fillStyle = palette.pipeBody;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = palette.pipeLight;
    ctx.fillRect(x + 5, y, 8, h);
    ctx.fillStyle = palette.pipeMid;
    ctx.fillRect(x + 15, y, 14, h);
    ctx.fillStyle = palette.pipeDark;
    ctx.fillRect(x + w - 12, y, 12, h);

    ctx.strokeStyle = palette.pipeBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    const capY = capAtBottom ? y + h - capHeight : y;
    const capX = x - capOverhang;
    const capW = w + capOverhang * 2;
    ctx.fillStyle = palette.pipeCap;
    ctx.fillRect(capX, capY, capW, capHeight);
    ctx.fillStyle = palette.pipeCapLight;
    ctx.fillRect(capX + 5, capY + 2, 10, capHeight - 4);
    ctx.fillStyle = palette.pipeDark;
    ctx.fillRect(x + w - 8, capY + 2, 8, capHeight - 4);

    // Hazard diagonal stripes on extreme presets (Insane / Chaos / Ext Turb)
    if (palette.hazardCaps) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(capX + 1, capY + 1, capW - 2, capHeight - 2);
      ctx.clip();
      ctx.fillStyle = 'rgba(251, 191, 36, 0.42)';
      for (let sx = capX - capHeight; sx < capX + capW + capHeight; sx += 14) {
        ctx.beginPath();
        ctx.moveTo(sx, capY + capHeight);
        ctx.lineTo(sx + 6, capY + capHeight);
        ctx.lineTo(sx + 6 + capHeight * 0.6, capY);
        ctx.lineTo(sx + capHeight * 0.6, capY);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.strokeStyle = palette.pipeBorder;
    ctx.strokeRect(capX, capY, capW, capHeight);

    // Metallic arcade cap rivets
    ctx.fillStyle = palette.pipeBorder;
    ctx.fillRect(capX + 2, capY + capHeight / 2 - 1, 2, 2);
    ctx.fillRect(capX + capW - 4, capY + capHeight / 2 - 1, 2, 2);
  };

  drawPipeSegment(pipe.x, 0, PIPE_WIDTH, pipe.gapTop, true);
  drawPipeSegment(
    pipe.x,
    pipe.gapBottom,
    PIPE_WIDTH,
    PLAYABLE_HEIGHT - pipe.gapBottom,
    false
  );
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lineWidth = 2
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 3) return;
  const angle = Math.atan2(dy, dx);
  const head = Math.min(7, len * 0.45);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - head * Math.cos(angle - Math.PI / 6),
    y2 - head * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    x2 - head * Math.cos(angle + Math.PI / 6),
    y2 - head * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

function drawSensorRays(
  ctx: CanvasRenderingContext2D,
  leader: BirdRenderState,
  nextPipe: Pipe | null,
  nextPipe2: Pipe | null | undefined,
  activeFeatures: SensorFeatureId[],
  tickSpeed: number,
  dimmedForGhost = false
) {
  if (!leader.alive || activeFeatures.length === 0) return;

  const has = (id: SensorFeatureId) => activeFeatures.includes(id);

  ctx.save();
  if (dimmedForGhost) {
    ctx.globalAlpha = 0.28;
  }
  ctx.font = '600 9px "JetBrains Mono", monospace';
  ctx.textBaseline = 'middle';

  // 1. BIRD_Y — vertical altitude ruler on the left side of the bird
  if (has('BIRD_Y')) {
    const railX = leader.x - 30;
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(railX, 8);
    ctx.lineTo(railX, PLAYABLE_HEIGHT - 8);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#A78BFA';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(railX - 4, leader.y);
    ctx.lineTo(leader.x - BIRD_RADIUS - 3, leader.y);
    ctx.stroke();

    ctx.fillStyle = '#C4B5FD';
    ctx.fillRect(railX - 3, leader.y - 3, 6, 6);
    ctx.textAlign = 'right';
    ctx.fillText('Y', railX - 6, leader.y);
  }

  // 2. VEL_VY — vertical velocity arrow at the bird
  if (has('VEL_VY')) {
    const vecLen = Math.max(-44, Math.min(44, leader.vy * 4.4));
    const vyColor = leader.vy < 0 ? '#34D399' : '#FB923C';
    if (Math.abs(vecLen) >= 3) {
      drawArrow(ctx, leader.x, leader.y, leader.x, leader.y + vecLen, vyColor, 2);
      ctx.fillStyle = vyColor;
      ctx.textAlign = 'right';
      ctx.fillText('Vy', leader.x - 16, leader.y + vecLen * 0.65);
    } else {
      ctx.fillStyle = '#94A3B8';
      ctx.beginPath();
      ctx.arc(leader.x, leader.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (nextPipe) {
    const pipeTrailX = nextPipe.x + PIPE_WIDTH;

    // 3. PIPE_DX / PIPE_TTF — horizontal distance ruler to trailing pipe edge + arrival time
    if (has('PIPE_DX') || has('PIPE_TTF')) {
      const rulerY = leader.y;
      ctx.strokeStyle = has('PIPE_DX')
        ? 'rgba(56, 189, 248, 0.78)'
        : 'rgba(245, 158, 11, 0.75)';
      ctx.lineWidth = 1.3;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(leader.x + BIRD_RADIUS + 2, rulerY);
      ctx.lineTo(pipeTrailX, rulerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // End tick on trailing edge
      ctx.beginPath();
      ctx.moveTo(pipeTrailX, rulerY - 5);
      ctx.lineTo(pipeTrailX, rulerY + 5);
      ctx.stroke();

      const midX = (leader.x + pipeTrailX) * 0.5;
      const dxPx = Math.max(0, pipeTrailX - leader.x);
      const ttfFrames = Math.round(dxPx / Math.max(1.2, tickSpeed));
      const label =
        has('PIPE_DX') && has('PIPE_TTF')
          ? `DX · ${ttfFrames}f`
          : has('PIPE_TTF')
            ? `TTF ${ttfFrames}f`
            : 'DX';
      ctx.fillStyle = has('PIPE_TTF') ? '#FCD34D' : '#7DD3FC';
      ctx.textAlign = 'center';
      ctx.fillText(label, midX, rulerY - 8);
    }

    // 4. TOP_CLEAR — ray to top pipe lip
    if (has('TOP_CLEAR')) {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
      ctx.lineWidth = 1.35;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(leader.x, leader.y);
      ctx.lineTo(nextPipe.x, nextPipe.gapTop);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#10B981';
      ctx.fillRect(nextPipe.x - 3, nextPipe.gapTop - 3, 6, 6);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#6EE7B7';
      ctx.fillText('Top', nextPipe.x + 5, nextPipe.gapTop - 7);
    }

    // 5. BOT_CLEAR — ray to bottom pipe lip
    if (has('BOT_CLEAR')) {
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.82)';
      ctx.lineWidth = 1.35;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(leader.x, leader.y);
      ctx.lineTo(nextPipe.x, nextPipe.gapBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#22D3EE';
      ctx.fillRect(nextPipe.x - 3, nextPipe.gapBottom - 3, 6, 6);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#67E8F9';
      ctx.fillText('Bot', nextPipe.x + 5, nextPipe.gapBottom + 9);
    }

    // 6. PIPE_VY — vertical pipe motion vector on nextPipe center
    if (has('PIPE_VY')) {
      const cx = nextPipe.x + PIPE_WIDTH * 0.5;
      const cy = nextPipe.gapCenter;
      const pvyLen = Math.max(-36, Math.min(36, (nextPipe.gapVy ?? 0) * 22));

      ctx.fillStyle = '#F472B6';
      ctx.beginPath();
      ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
      ctx.fill();

      if (Math.abs(pvyLen) >= 3) {
        drawArrow(ctx, cx, cy, cx, cy + pvyLen, '#F472B6', 2);
      } else {
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy);
        ctx.lineTo(cx + 6, cy);
        ctx.stroke();
      }
      ctx.fillStyle = '#F9A8D4';
      ctx.textAlign = 'left';
      ctx.fillText('PVy', cx + 8, cy);
    }

    // 7. NEXT_PIPE_DY — lookahead vertical delta guide from nextPipe gapCenter to nextPipe2 gapCenter
    if (has('NEXT_PIPE_DY') && nextPipe2) {
      const x1 = nextPipe.x + PIPE_WIDTH * 0.5;
      const y1 = nextPipe.gapCenter;
      const x2 = nextPipe2.x + PIPE_WIDTH * 0.5;
      const y2 = nextPipe2.gapCenter;

      ctx.strokeStyle = 'rgba(250, 204, 21, 0.78)';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y1);
      ctx.stroke();
      ctx.setLineDash([]);

      drawArrow(ctx, x2, y1, x2, y2, '#FACC15', 1.8);

      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(x2, y2, 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.fillText('N2Y', (x1 + x2) * 0.5, y1 - 8);
    }

    // 8–11. Dual-Pipe #2 explicit rays (N2DX, N2Top, N2Bot, N2PVy)
    if (nextPipe2) {
      const p2TrailX = nextPipe2.x + PIPE_WIDTH;
      if (has('NEXT_PIPE_DX')) {
        const yGuide = Math.max(24, leader.y - 14);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
        ctx.lineWidth = 1.05;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(leader.x + BIRD_RADIUS, yGuide);
        ctx.lineTo(p2TrailX, yGuide);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(253, 224, 71, 0.85)';
        ctx.textAlign = 'right';
        ctx.fillText('N2DX', p2TrailX - 4, yGuide - 7);
      }

      if (has('NEXT_TOP_CLEAR')) {
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.42)';
        ctx.lineWidth = 1.05;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(leader.x, leader.y);
        ctx.lineTo(nextPipe2.x, nextPipe2.gapTop);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#34D399';
        ctx.fillRect(nextPipe2.x - 2.5, nextPipe2.gapTop - 2.5, 5, 5);
        ctx.textAlign = 'left';
        ctx.fillText('N2Top', nextPipe2.x + 5, nextPipe2.gapTop - 7);
      }

      if (has('NEXT_BOT_CLEAR')) {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 1.05;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(leader.x, leader.y);
        ctx.lineTo(nextPipe2.x, nextPipe2.gapBottom);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(nextPipe2.x - 2.5, nextPipe2.gapBottom - 2.5, 5, 5);
        ctx.textAlign = 'left';
        ctx.fillText('N2Bot', nextPipe2.x + 5, nextPipe2.gapBottom + 9);
      }

      if (has('NEXT_PIPE_VY')) {
        const cx2 = nextPipe2.x + PIPE_WIDTH * 0.5;
        const cy2 = nextPipe2.gapCenter;
        const p2vyLen = Math.max(-30, Math.min(30, (nextPipe2.gapVy ?? 0) * 20));
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.arc(cx2, cy2, 2.8, 0, Math.PI * 2);
        ctx.fill();
        if (Math.abs(p2vyLen) >= 3) {
          drawArrow(ctx, cx2, cy2, cx2, cy2 + p2vyLen, '#FBBF24', 1.6);
        }
        ctx.textAlign = 'left';
        ctx.fillText('N2PVy', cx2 + 6, cy2);
      }
    }
  }

  ctx.restore();
}

function drawCompoundEyeOmmatidia(
  ctx: CanvasRenderingContext2D,
  leader: BirdRenderState,
  rays: NonNullable<RenderSnapshot['ommatidiaRays']>,
  dimmedForGhost: boolean
) {
  ctx.save();
  if (dimmedForGhost) {
    ctx.globalAlpha = 0.25;
  }

  const MAX_RAY_DIST = 460;
  for (let i = 0; i < rays.length; i++) {
    const ray = rays[i];
    const distPx = ray.hitDistNorm * MAX_RAY_DIST;
    const hitX = leader.x + Math.cos(ray.angleRad) * distPx;
    const hitY = leader.y + Math.sin(ray.angleRad) * distPx;
    const deltaMag = Math.min(1, Math.abs(ray.temporalDelta) * 2.5);
    const strokeColor =
      ray.hitSurface === 'PIPE'
        ? `rgba(251, 191, 36, ${(0.38 + deltaMag * 0.45).toFixed(2)})`
        : ray.hitSurface === 'GAP'
          ? `rgba(16, 185, 129, ${(0.32 + deltaMag * 0.38).toFixed(2)})`
          : ray.hitSurface === 'GROUND'
            ? 'rgba(167, 139, 250, 0.28)'
            : 'rgba(34, 211, 238, 0.2)';

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = ray.hitSurface === 'PIPE' ? 1.45 : 1.05;
    ctx.setLineDash(ray.hitSurface === 'SKY' ? [3, 4] : []);
    ctx.beginPath();
    ctx.moveTo(leader.x, leader.y);
    ctx.lineTo(hitX, hitY);
    ctx.stroke();

    if (ray.hitSurface !== 'SKY') {
      ctx.fillStyle =
        ray.hitSurface === 'PIPE'
          ? '#FBBF24'
          : ray.hitSurface === 'GAP'
            ? '#34D399'
            : '#A78BFA';
      ctx.beginPath();
      ctx.arc(hitX, hitY, 2 + deltaMag * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawArcadeOrbsAndPopups(
  ctx: CanvasRenderingContext2D,
  orbs: ArcadeOrb[] | undefined,
  popups: PlayScorePopup[] | undefined,
  animTick: number
) {
  if (orbs && orbs.length > 0) {
    for (let i = 0; i < orbs.length; i++) {
      const orb = orbs[i];
      if (orb.collected) continue;
      const pulse = 1 + Math.sin(animTick * 0.12 + orb.phase) * 0.12;
      const r = orb.radius * pulse;
      const isPrism = orb.kind === 'PRISM';

      ctx.save();
      ctx.translate(orb.x, orb.y);

      // Outer halo
      const halo = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 2.1);
      halo.addColorStop(
        0,
        isPrism ? 'rgba(34, 211, 238, 0.5)' : 'rgba(251, 191, 36, 0.52)'
      );
      halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.rotate(animTick * (isPrism ? 0.04 : 0.025) + orb.phase);

      if (isPrism) {
        // Diamond cyan prism (+150)
        ctx.fillStyle = '#22D3EE';
        ctx.strokeStyle = '#ECFEFF';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.15);
        ctx.lineTo(r * 0.9, 0);
        ctx.lineTo(0, r * 1.15);
        ctx.lineTo(-r * 0.9, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Golden amber energy star orb (+75)
        ctx.fillStyle = '#FBBF24';
        ctx.strokeStyle = '#FEF3C7';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFBEB';
        ctx.beginPath();
        ctx.arc(-r * 0.25, -r * 0.25, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  if (popups && popups.length > 0) {
    ctx.save();
    ctx.font = '800 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < popups.length; i++) {
      const p = popups[i];
      ctx.globalAlpha = Math.max(0, Math.min(1, p.ttl));
      ctx.fillStyle = 'rgba(7, 12, 24, 0.85)';
      ctx.fillText(p.label, p.x + 1, p.y + 1);
      ctx.fillStyle = p.color;
      ctx.fillText(p.label, p.x, p.y);
    }
    ctx.restore();
  }
}

export function ArcadeCanvas({
  trainingSnapshotRef,
  vsAiSimRef,
  running,
  showSensors,
  mode,
  playSubMode = 'SOLO',
  personalBest = 0,
  bestPoints = 0,
  lastRunWasNewRecord = false,
  trainingHud,
  vsAiPhase,
  playerScore,
  playerPoints = 0,
  playerCombo = 0,
  playerMaxCombo = 0,
  playerOrbsCollected = 0,
  playerNick = '',
  aiOpponentScore,
  playerAlive,
  aiOpponentAlive,
  vsAiWinner,
  onPlayerFlap,
  onTogglePause,
  onFinishEarly,
  onRematch,
  onBackToLab,
  onSaveRunWithNick,
  onSyncVsAiTelemetry,
}: ArcadeCanvasProps) {
  const { t } = useLanguage();
  const [nickDraft, setNickDraft] = useState(playerNick);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setNickDraft(playerNick);
  }, [playerNick]);

  useEffect(() => {
    if (vsAiPhase !== 'GAME_OVER') {
      setSavedNotice(false);
    }
  }, [vsAiPhase]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const skyCacheRef = useRef<Map<VisualThemeKey, HTMLCanvasElement>>(new Map());
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const animOffsetRef = useRef(0);

  const runningRef = useRef(running);
  const sensorsRef = useRef(showSensors);
  const modeRef = useRef(mode);
  const playSubModeRef = useRef<PlaySubMode>(playSubMode);

  runningRef.current = running;
  sensorsRef.current = showSensors;
  modeRef.current = mode;
  playSubModeRef.current = playSubMode;

  const isSoloPlay = playSubMode === 'SOLO';
  const isPlayPaused = mode === 'VS_AI' && vsAiPhase === 'PLAYING' && !running;
  const runMedal = getMedalForScore(playerScore);

  useEffect(() => {
    let rafId = 0;
    let frameTick = 0;

    const getSkyLayer = (themeKey: VisualThemeKey) => {
      let cached = skyCacheRef.current.get(themeKey);
      if (!cached) {
        cached = createSkyBackdrop(themeKey);
        skyCacheRef.current.set(themeKey, cached);
      }
      return cached;
    };

    let lastTime = performance.now();
    let accumulator = 0;
    const fixedStepMs = 1000 / 60;

    const renderFrame = (currentTime: number) => {
      const dt = currentTime - lastTime;
      lastTime = currentTime;
      if (dt < 250) {
        accumulator += dt;
      }

      if (modeRef.current === 'VS_AI') {
        if (runningRef.current) {
          while (accumulator >= fixedStepMs) {
            vsAiSimRef.current.step();
            accumulator -= fixedStepMs;
          }
        } else {
          accumulator = 0;
        }
        frameTick += 1;
        if (frameTick % 2 === 0 || !runningRef.current) {
          onSyncVsAiTelemetry();
        }
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const snap =
        modeRef.current === 'VS_AI'
          ? vsAiSimRef.current.getRenderSnapshot()
          : trainingSnapshotRef.current;

      if (canvas && ctx && snap) {
        const themeKey = resolveVisualTheme(snap.difficulty);
        const palette = THEME_PALETTES[themeKey];
        const env = snap.environment;

        if (runningRef.current) {
          animOffsetRef.current += 0.6;
        }

        ctx.drawImage(getSkyLayer(themeKey), 0, 0);
        drawClouds(ctx, animOffsetRef.current, palette);
        drawEnvironmentEffects(ctx, env, snap.tickSpeed, animOffsetRef.current);

        for (let i = 0; i < snap.pipes.length; i++) {
          drawPipe(ctx, snap.pipes[i], palette, env.movingPipes);
        }

        const playerBird = snap.birds.find((b) => b.isPlayer);
        const aiGhostMode =
          snap.mode === 'VS_AI' && Boolean(playerBird?.alive);

        const leader =
          snap.birds.find((b) => b.isLeader) ??
          snap.birds.find((b) => b.isChampion);

        // Smooth motion ribbon trail behind the active leader bird
        if (leader && leader.alive) {
          const trail = trailRef.current;
          const stepDx = snap.tickSpeed || 2.85;
          for (let t = 0; t < trail.length; t++) {
            trail[t].x -= stepDx;
          }
          trail.push({ x: leader.x - 10, y: leader.y });
          while (trail.length > 16 || (trail.length > 0 && trail[0].x < 40)) {
            trail.shift();
          }

          const trailAlphaScale = aiGhostMode ? 0.12 : 0.42;
          for (let t = 0; t < trail.length; t++) {
            const pt = trail[t];
            const ratio = (t + 1) / trail.length;
            ctx.fillStyle = `rgba(34, 211, 238, ${(ratio * trailAlphaScale).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 1.5 + ratio * 2, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          trailRef.current.length = 0;
        }

        if (sensorsRef.current && leader) {
          if (
            snap.perceptionMode === 'COMPOUND_EYE_PIXELS' &&
            snap.ommatidiaRays &&
            snap.ommatidiaRays.length > 0
          ) {
            drawCompoundEyeOmmatidia(
              ctx,
              leader,
              snap.ommatidiaRays,
              aiGhostMode
            );
          } else {
            drawSensorRays(
              ctx,
              leader,
              snap.nextPipe,
              snap.nextPipe2,
              snap.activeInputFeatures,
              snap.tickSpeed || 2.85,
              aiGhostMode
            );
          }
        }

        if (snap.mode === 'VS_AI') {
          drawArcadeOrbsAndPopups(
            ctx,
            snap.arcadeOrbs,
            snap.scorePopups,
            animOffsetRef.current
          );
        }

        for (let i = 0; i < snap.birds.length; i++) {
          const bird = snap.birds[i];
          if (bird !== leader && !bird.isPlayer) {
            drawBird(ctx, bird, false, false);
          }
        }
        if (leader && !leader.isPlayer) {
          drawBird(ctx, leader, true, aiGhostMode);
        }
        for (let i = 0; i < snap.birds.length; i++) {
          const bird = snap.birds[i];
          if (bird.isPlayer) {
            drawBird(ctx, bird, true, false);
          }
        }

        // Ground strip themed to scenario
        ctx.fillStyle = palette.groundBase;
        ctx.fillRect(0, PLAYABLE_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);

        ctx.fillStyle = palette.groundTop;
        ctx.fillRect(0, PLAYABLE_HEIGHT, CANVAS_WIDTH, 8);
        ctx.fillStyle = palette.groundSub;
        ctx.fillRect(0, PLAYABLE_HEIGHT + 8, CANVAS_WIDTH, 4);

        ctx.fillStyle = palette.groundStripe;
        for (let gx = -32; gx < CANVAS_WIDTH + 32; gx += 32) {
          const xPos = gx - snap.groundOffset;
          ctx.beginPath();
          ctx.moveTo(xPos, PLAYABLE_HEIGHT + 14);
          ctx.lineTo(xPos + 16, PLAYABLE_HEIGHT + 14);
          ctx.lineTo(xPos + 6, CANVAS_HEIGHT);
          ctx.lineTo(xPos - 10, CANVAS_HEIGHT);
          ctx.closePath();
          ctx.fill();
        }

        ctx.strokeStyle = palette.pipeBorder;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, PLAYABLE_HEIGHT);
        ctx.lineTo(CANVAS_WIDTH, PLAYABLE_HEIGHT);
        ctx.stroke();

        // Non-overlapping ground HUD bar: crisp 1-row large readout on narrow phones (<500px), rich 2-row readout on wider screens
        const canvasDisplayW = canvas.clientWidth || CANVAS_WIDTH;
        const isSmallCanvas = canvasDisplayW < 500;

        ctx.save();
        ctx.fillStyle = 'rgba(7, 12, 24, 0.84)';
        ctx.fillRect(6, PLAYABLE_HEIGHT + 13, CANVAS_WIDTH - 12, GROUND_HEIGHT - 16);
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(6, PLAYABLE_HEIGHT + 13, CANVAS_WIDTH - 12, GROUND_HEIGHT - 16);

        ctx.beginPath();
        ctx.rect(10, PLAYABLE_HEIGHT + 14, CANVAS_WIDTH - 20, GROUND_HEIGHT - 18);
        ctx.clip();

        if (isSmallCanvas) {
          ctx.font = '700 13.5px "JetBrains Mono", monospace';
          ctx.textBaseline = 'middle';
          const centerY = PLAYABLE_HEIGHT + 32;
          ctx.textAlign = 'left';
          ctx.fillStyle = '#94A3B8';
          ctx.fillText(
            `${(snap.tickSpeed || env.pipeSpeed).toFixed(2)} px/f`,
            16,
            centerY
          );

          ctx.textAlign = 'right';
          ctx.fillStyle = snap.anomalyActive ? '#FCD34D' : '#E2E8F0';
          const shortTags = [`${Math.round(env.gap)}px`];
          if (env.movingPipes) shortTags.push(`±${Math.round(env.moveAmplitude)}px`);
          if (env.speedVariability > 0) {
            shortTags.push(`±${Math.round(env.speedVariability * 100)}%`);
          }
          const sensorSuffix =
            sensorsRef.current && snap.activeInputFeatures.length > 0
              ? ` · ${snap.activeInputFeatures.length}in`
              : '';
          ctx.fillText(
            `${env.label.toUpperCase()} · ${shortTags.join(' · ')}${sensorSuffix}`,
            CANVAS_WIDTH - 16,
            centerY
          );
        } else {
          ctx.font = '600 9.5px "JetBrains Mono", monospace';
          ctx.textBaseline = 'middle';
          const row1Y = PLAYABLE_HEIGHT + 24;
          const row2Y = PLAYABLE_HEIGHT + 40;
          const maxRowWidth = CANVAS_WIDTH - 28;

          if (sensorsRef.current && snap.activeInputFeatures.length > 0) {
            const isPixelEye = snap.perceptionMode === 'COMPOUND_EYE_PIXELS';
            const prefixLabel = isPixelEye
              ? `RETINA 16-RAY (${Math.round((snap.opticalNoiseLevel ?? 0) * 100)}% NOISE) → T4/T5 (${snap.activeInputFeatures.length}ch): `
              : `SENSORS (${snap.activeInputFeatures.length}/12): `;
            const sensorLabels = snap.activeInputFeatures.map((f) =>
              isPixelEye
                ? SENSOR_METADATA[f].opticalShortLabel
                : SENSOR_METADATA[f].shortLabel
            );
            let sensorList = sensorLabels.join(' · ');
            ctx.textAlign = 'left';
            ctx.fillStyle = isPixelEye
              ? 'rgba(110, 231, 183, 0.95)'
              : 'rgba(148, 163, 184, 0.9)';
            ctx.fillText(prefixLabel, 14, row1Y);
            const prefixW = ctx.measureText(prefixLabel).width;
            const availListW = Math.max(40, maxRowWidth - prefixW);
            if (ctx.measureText(sensorList).width > availListW) {
              const trimmed = sensorLabels.slice(0, sensorLabels.length);
              while (
                trimmed.length > 1 &&
                ctx.measureText(`${trimmed.join(' · ')} · …`).width > availListW
              ) {
                trimmed.pop();
              }
              sensorList = `${trimmed.join(' · ')} · +${sensorLabels.length - trimmed.length}`;
            }
            ctx.fillStyle = isPixelEye ? '#A7F3D0' : '#67E8F9';
            ctx.fillText(sensorList, 14 + prefixW, row1Y);
          } else {
            ctx.textAlign = 'left';
            if (modeRef.current === 'VS_AI' && playSubModeRef.current === 'SOLO') {
              ctx.fillStyle = 'rgba(252, 211, 77, 0.88)';
              ctx.fillText('SOLO ARCADE · TAP OR SPACE TO FLAP', 14, row1Y);
            } else {
              ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
              ctx.fillText('SENSORS OVERLAY: HIDDEN', 14, row1Y);
            }
          }

          const hazardTags: string[] = [`Gap ${Math.round(env.gap)}px`];
          if (env.gapVariance > 0) hazardTags.push(`±${Math.round(env.gapVariance)}px`);
          if (env.movingPipes) hazardTags.push(`Mov ±${Math.round(env.moveAmplitude)}px`);
          if (env.speedVariability > 0) {
            hazardTags.push(`Gust ±${Math.round(env.speedVariability * 100)}%`);
          }
          if (snap.anomalyActive && snap.anomalyGravityMult !== undefined) {
            hazardTags.push(`ANOMALY ${(env.gravityScale * snap.anomalyGravityMult).toFixed(2)}g`);
          } else if (env.gravityScale !== 1) {
            hazardTags.push(`Grav ${env.gravityScale.toFixed(2)}g`);
          }

          const leftSpeedText = `SPEED ${(snap.tickSpeed || env.pipeSpeed).toFixed(2)} px/f`;
          ctx.textAlign = 'left';
          ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
          ctx.fillText(leftSpeedText, 14, row2Y);

          ctx.textAlign = 'right';
          ctx.fillStyle = snap.anomalyActive
            ? '#FCD34D'
            : 'rgba(226, 232, 240, 0.9)';
          ctx.fillText(
            `${env.label.toUpperCase()} · ${hazardTags.join(' · ')}`,
            CANVAS_WIDTH - 14,
            row2Y
          );
        }
        ctx.restore();
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [trainingSnapshotRef, vsAiSimRef, onSyncVsAiTelemetry]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#091326] shadow-lg">
      {/* Small-screen dedicated Generation & Live Telemetry header (keeps sky clear & crisp font) */}
      {mode === 'TRAINING' && trainingHud && (
        <div className="flex sm:hidden flex-wrap items-center justify-between gap-2 border-b border-slate-800/90 bg-[#0B1120] px-3 py-2 font-mono text-[11px] tabular-nums">
          <div className="flex items-center gap-2 min-w-0">
            <span className="rounded bg-cyan-500/20 border border-cyan-500/35 px-1.5 py-0.5 font-bold text-cyan-300">
              {t('play.gen')} {trainingHud.generation}
            </span>
            <span className="text-slate-300">
              <strong className="text-emerald-300">{trainingHud.aliveCount}</strong>/{trainingHud.totalPopulation}
            </span>
            <span className="text-slate-400 truncate">
              {trainingHud.algorithmLabel} · {trainingHud.topologyLabel}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-slate-300">
              {t('play.now')} <strong className="text-white">{trainingHud.currentBestScore}</strong>
            </span>
            <span className="text-amber-300 font-bold">
              {t('play.best')} {trainingHud.allTimeBestScore}
            </span>
          </div>
        </div>
      )}

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerDown={(e) => {
            if (mode !== 'VS_AI') return;
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            e.preventDefault();
            onPlayerFlap();
          }}
          className={`block w-full aspect-[4/3] select-none ${
            mode === 'VS_AI' ? 'cursor-pointer touch-none' : ''
          }`}
        />

      {mode === 'TRAINING' && trainingHud && (
        <div className="pointer-events-none hidden sm:flex absolute inset-x-0 top-2 justify-start px-3">
          <div className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg border border-slate-700/70 bg-[#0B1120]/82 px-2.5 py-1 font-mono text-[11px] tabular-nums text-slate-300 backdrop-blur-sm">
            <span className="font-semibold text-white whitespace-nowrap shrink-0">
              {trainingHud.algorithmLabel}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-200 whitespace-nowrap shrink-0">
              {trainingHud.topologyLabel}
            </span>
            <span className="text-slate-600">·</span>
            <span className="whitespace-nowrap shrink-0">
              {t('play.gen')} {trainingHud.generation}
            </span>
            <span className="text-slate-600">·</span>
            <span className="whitespace-nowrap shrink-0">
              {t('play.alive')} {trainingHud.aliveCount}/{trainingHud.totalPopulation}
            </span>
            <span className="text-slate-600">·</span>
            <span className="whitespace-nowrap shrink-0">
              {t('play.best2')} {trainingHud.currentBestScore}
            </span>
            <span className="text-slate-600">·</span>
            <span className="font-semibold text-cyan-300 whitespace-nowrap shrink-0">
              {t('play.record')} {trainingHud.allTimeBestScore}
            </span>
            {trainingHud.showMultiplier && (trainingHud.effectiveMultiplier ?? 0) > 0 && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-emerald-300 whitespace-nowrap shrink-0">
                  ~{trainingHud.effectiveMultiplier}x
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {mode === 'VS_AI' && (
        <div className="pointer-events-none absolute inset-x-0 top-2.5 sm:top-3 flex items-start justify-between px-2.5 sm:px-4">
          {/* Left HUD: Points + PB in Solo, or Player Points/Pipes in Duel */}
          {isSoloPlay ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="rounded-lg border border-amber-500/40 bg-[#0B1120]/85 px-2.5 py-1 backdrop-blur-sm">
                <span className="font-mono text-[10px] uppercase tracking-wide text-amber-300">
                  {t('play.pts')}
                </span>
                <span className="ml-1.5 font-mono text-sm font-bold tabular-nums text-white">
                  {playerPoints.toLocaleString()}
                </span>
                {playerCombo > 1 && (
                  <span className="ml-1.5 font-mono text-[10px] font-bold text-emerald-300">
                    ×{playerCombo}
                  </span>
                )}
              </div>
              <div className="hidden sm:block rounded-lg border border-slate-700/70 bg-[#0B1120]/82 px-2.5 py-1 backdrop-blur-sm">
                <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">
                  {t('play.best3')}
                </span>
                <span className="ml-1.5 font-mono text-sm font-bold tabular-nums text-amber-300">
                  {Math.max(personalBest, playerScore)}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-700/70 bg-[#0B1120]/85 px-2.5 sm:px-3 py-1 sm:py-1.5 backdrop-blur-sm">
              <span className="text-[11px] sm:text-xs font-medium text-amber-300">
                {t('play.you')}
              </span>
              <span className="ml-1.5 font-mono text-sm sm:text-base font-bold tabular-nums text-white">
                {playerScore}
              </span>
              <span className="ml-2 font-mono text-[11px] font-semibold tabular-nums text-emerald-300">
                {playerPoints.toLocaleString()}p
              </span>
              {playerCombo > 1 && (
                <span className="ml-1 font-mono text-[10px] font-bold text-amber-300">
                  ×{playerCombo}
                </span>
              )}
            </div>
          )}

          {/* Center Score Display during active Solo flight */}
          {isSoloPlay && vsAiPhase === 'PLAYING' && (
            <div className="font-display text-3xl sm:text-5xl font-black tabular-nums text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.85)]">
              {playerScore}
            </div>
          )}

          {/* Right HUD: AI Ghost score (Duel) + Pause button during active flight */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {!isSoloPlay && (
              <div className="rounded-lg border border-slate-700/70 bg-[#0B1120]/85 px-2.5 sm:px-3 py-1 sm:py-1.5 backdrop-blur-sm">
                <span className="text-[11px] sm:text-xs font-medium text-cyan-300">
                  {playerAlive
                    ? t('play.aiGhost')
                    : t('play.aiAce')}
                </span>
                <span className="ml-2 font-mono text-sm sm:text-base font-bold tabular-nums text-white">
                  {aiOpponentScore}
                </span>
              </div>
            )}

            {vsAiPhase === 'PLAYING' && onTogglePause && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePause();
                }}
                aria-label={running ? t('play.pause') : t('play.resume')}
                title={running ? t('play.pauseP') : t('play.resumeP')}
                className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/80 bg-[#0B1120]/85 text-slate-200 backdrop-blur-sm cursor-pointer transition-colors hover:border-amber-400/60 hover:text-amber-300"
              >
                {running ? (
                  <Pause className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Play className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {mode === 'VS_AI' && vsAiPhase === 'READY' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-12 sm:bottom-16 flex justify-center px-3">
          <div className="rounded-xl border border-slate-700/85 bg-[#0B1120]/90 px-5 py-3 sm:px-7 sm:py-4 text-center backdrop-blur-sm shadow-xl">
            <p className="font-display text-base sm:text-lg font-bold text-white">
              {t('play.tapOrPressSpaceTo')}
            </p>
            <p className="mt-1 text-xs sm:text-sm text-slate-300">
              {isSoloPlay
                ? t('play.soloArcadeBeatYourPersonal')
                : t('play.youFlyAmberAiFlies')}
            </p>
          </div>
        </div>
      )}

      {isPlayPaused && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute inset-0 flex items-center justify-center bg-[#0B1120]/70 backdrop-blur-[2px] p-4"
        >
          <div className="w-full max-w-[290px] rounded-xl border border-slate-700 bg-[#111827] p-5 text-center shadow-xl">
            <h3 className="font-display text-xl font-bold text-white">
              {t('play.paused')}
            </h3>
            <p className="mt-1 font-mono text-xs sm:text-sm tabular-nums text-slate-400">
              {t('play.currentScore')}{' '}
              <strong className="text-amber-300">{playerScore}</strong>
            </p>
            <div className="mt-4 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={onTogglePause}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 whitespace-nowrap cursor-pointer transition-colors hover:bg-amber-400"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                {t('play.resume')}
              </button>
              <button
                type="button"
                onClick={onRematch}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 whitespace-nowrap cursor-pointer transition-colors hover:bg-slate-700"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {t('play.restart')}
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'VS_AI' &&
        !isSoloPlay &&
        vsAiPhase === 'PLAYING' &&
        !playerAlive &&
        aiOpponentAlive && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-12 sm:bottom-16 flex justify-center px-3"
          >
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 rounded-xl border border-slate-700/80 bg-[#0B1120]/92 px-3.5 py-2 backdrop-blur-sm">
              <span className="font-mono text-xs tabular-nums text-slate-200">
                {t('play.scoreAiFlying', { playerScore, aiOpponentScore })}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onRematch}
                  className="min-h-[36px] rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 whitespace-nowrap cursor-pointer transition-colors hover:bg-amber-400"
                >
                  {t('play.retry')}
                </button>
                <button
                  type="button"
                  onClick={onFinishEarly}
                  className="min-h-[36px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 whitespace-nowrap cursor-pointer transition-colors hover:bg-slate-700"
                >
                  {t('play.finish')}
                </button>
              </div>
            </div>
          </div>
        )}

      {mode === 'VS_AI' && vsAiPhase === 'GAME_OVER' && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute inset-0 flex items-center justify-center bg-[#0B1120]/76 backdrop-blur-[2px] p-2.5 sm:p-3 overflow-y-auto"
        >
          <div className="w-full max-w-[360px] rounded-xl border border-slate-700 bg-[#111827] p-4 sm:p-5 text-center shadow-2xl">
            {lastRunWasNewRecord && playerScore > 0 && (
              <div className="mb-1.5 inline-flex items-center gap-1 rounded-md border border-amber-400/50 bg-amber-500/15 px-2.5 py-0.5 font-mono text-[11px] font-bold text-amber-300">
                <Award className="h-3.5 w-3.5" aria-hidden="true" />
                {t('play.newPersonalBest')}
              </div>
            )}

            <h3 className="font-display text-lg sm:text-xl font-bold text-white">
              {isSoloPlay
                ? t('play.flightComplete')
                : vsAiWinner === 'PLAYER'
                  ? t('play.youBeatTheAi')
                  : vsAiWinner === 'AI'
                    ? t('play.aiChampionWins')
                    : t('play.drawMatch')}
            </h3>

            <div className="mt-2.5 grid grid-cols-3 gap-2 rounded-lg border border-slate-800 bg-[#0B1120] p-2.5 font-mono tabular-nums">
              <div>
                <div className="text-[10px] uppercase text-slate-400">
                  {t('play.points')}
                </div>
                <div className="text-lg sm:text-xl font-bold text-emerald-300">
                  {playerPoints.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-400">
                  {t('play.pipes')}
                </div>
                <div className="text-lg sm:text-xl font-bold text-white">
                  {playerScore}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-400">
                  {isSoloPlay ? t('play.best3') : 'AI'}
                </div>
                <div className="text-lg sm:text-xl font-bold text-amber-300">
                  {isSoloPlay
                    ? Math.max(personalBest, playerScore)
                    : aiOpponentScore}
                </div>
              </div>
            </div>

            {(playerOrbsCollected > 0 || playerMaxCombo > 1 || bestPoints > 0) && (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 font-mono text-[10.5px] text-slate-400">
                <span className="inline-flex items-center gap-1 text-amber-300">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  {t('play.orbs')} {playerOrbsCollected}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-cyan-300">
                  Max Combo: ×{Math.max(1, playerMaxCombo)}
                </span>
                {bestPoints > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      PB {Math.max(bestPoints, playerPoints).toLocaleString()}p
                    </span>
                  </>
                )}
              </div>
            )}

            {runMedal.id !== 'NONE' && (
              <div
                className={`mt-2 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 font-mono text-[11px] font-semibold ${runMedal.badgeBg}`}
              >
                <Award className="h-3.5 w-3.5" aria-hidden="true" />
                {t(`play.medals.${runMedal.id}`)}
              </div>
            )}

            {/* Quick Save Nick to Leaderboard */}
            {onSaveRunWithNick && (playerPoints >= 4 || playerScore > 0) && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSaveRunWithNick(nickDraft);
                  setSavedNotice(true);
                }}
                className="mt-3 flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0B1120] p-1.5"
              >
                <input
                  type="text"
                  maxLength={22}
                  value={nickDraft}
                  onChange={(e) => {
                    setNickDraft(e.target.value);
                    setSavedNotice(false);
                  }}
                  placeholder={t('play.yourNameOnLeaderboard')}
                  aria-label={t('play.yourLeaderboardNickname')}
                  className="min-w-0 flex-1 bg-transparent px-2 py-1 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className={`inline-flex min-h-[32px] items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    savedNotice
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 hover:bg-cyan-500/30'
                  }`}
                >
                  {savedNotice ? (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('play.saved')}
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('play.save')}
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={onRematch}
                className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 whitespace-nowrap cursor-pointer transition-colors hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {t('play.playAgain')}
              </button>
              <button
                type="button"
                onClick={onBackToLab}
                className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm font-medium text-slate-200 whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:bg-slate-700"
              >
                {t('play.lab')}
              </button>
            </div>
            <p className="mt-2 font-mono text-[10.5px] text-slate-400">
              {t('play.pressSpaceOrTapTo')}
            </p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
