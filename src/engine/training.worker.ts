import { FlappySimulation } from './simulation';
import type {
  EvolutionConfig,
  RenderSnapshot,
  SerializedNeuralNetwork,
  SimulationTelemetry,
  SpeedSetting,
} from './types';

export type WorkerInboundMessage =
  | { type: 'INIT'; config: EvolutionConfig; speed: SpeedSetting; running: boolean }
  | { type: 'SET_RUNNING'; running: boolean }
  | { type: 'SET_SPEED'; speed: SpeedSetting }
  | { type: 'SET_VISIBILITY'; hidden: boolean }
  | { type: 'STEP_ONCE' }
  | { type: 'UPDATE_CONFIG'; config: EvolutionConfig }
  | { type: 'RESET' }
  | { type: 'LOAD_BRAIN'; network: SerializedNeuralNetwork };

export type WorkerOutboundMessage =
  | {
      type: 'FRAME';
      snapshot: RenderSnapshot;
      telemetry: SimulationTelemetry;
      championBrain: SerializedNeuralNetwork | null;
      effectiveMultiplier: number;
      scored: boolean;
      genAdvanced: boolean;
    }
  | {
      type: 'BG_TELEMETRY';
      telemetry: SimulationTelemetry;
      championBrain: SerializedNeuralNetwork | null;
      effectiveMultiplier: number;
    };

const workerScope = self as unknown as {
  postMessage: (message: WorkerOutboundMessage) => void;
  onmessage: ((ev: MessageEvent<WorkerInboundMessage>) => void) | null;
};

const TRAINING_POWER_CAP = 0.95;
const TRAINING_FRAME_TARGET_MS = 16;

let sim: FlappySimulation | null = null;
let running = false;
let speed: SpeedSetting = 1;
let tabHidden = false;
let timerId: ReturnType<typeof setTimeout> | null = null;

let pendingScored = false;
let pendingGenAdvanced = false;
let lastBgEmit = 0;

let perfSteps = 0;
let perfWindowStart = performance.now();
let effectiveMultiplier = 0;

function createSim(config: EvolutionConfig): FlappySimulation {
  return new FlappySimulation(config, {
    onScore: () => {
      pendingScored = true;
    },
    onGenerationAdvance: () => {
      pendingGenAdvanced = true;
    },
  });
}

function emitFullFrame(): void {
  if (!sim) return;
  workerScope.postMessage({
    type: 'FRAME',
    snapshot: sim.getRenderSnapshot(),
    telemetry: sim.getTelemetry(),
    championBrain: sim.getChampionBrain(),
    effectiveMultiplier,
    scored: pendingScored,
    genAdvanced: pendingGenAdvanced,
  });
  pendingScored = false;
  pendingGenAdvanced = false;
}

function tickLoop(): void {
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }

  const loopStart = performance.now();

  if (sim && running) {
    const targetSteps = speed === 'MAX' ? 6000 : speed;
    const budgetMs = tabHidden ? 48 : TRAINING_FRAME_TARGET_MS * TRAINING_POWER_CAP;

    let stepsDone = 0;
    for (let s = 0; s < targetSteps; s++) {
      sim.step();
      stepsDone += 1;
      if (s > 0 && (s & 7) === 0 && performance.now() - loopStart > budgetMs) {
        break;
      }
    }

    perfSteps += stepsDone;
    const elapsed = performance.now() - perfWindowStart;
    if (elapsed >= 400) {
      const stepsPerSec = (perfSteps / elapsed) * 1000;
      effectiveMultiplier = Math.max(1, Math.round(stepsPerSec / 60));
      perfSteps = 0;
      perfWindowStart = performance.now();
    }
  } else {
    perfSteps = 0;
    perfWindowStart = performance.now();
    effectiveMultiplier = 0;
  }

  if (sim) {
    if (!tabHidden) {
      emitFullFrame();
    } else {
      const now = performance.now();
      if (now - lastBgEmit >= 250) {
        lastBgEmit = now;
        pendingScored = false;
        pendingGenAdvanced = false;
        workerScope.postMessage({
          type: 'BG_TELEMETRY',
          telemetry: sim.getTelemetry(),
          championBrain: sim.getChampionBrain(),
          effectiveMultiplier,
        });
      }
    }
  }

  const workMs = performance.now() - loopStart;
  if (running) {
    const targetInterval = tabHidden ? 45 : TRAINING_FRAME_TARGET_MS;
    const minPauseMs = tabHidden ? 2 : Math.max(1, Math.round(TRAINING_FRAME_TARGET_MS * (1 - TRAINING_POWER_CAP)));
    const delay = Math.max(minPauseMs, targetInterval - workMs);
    timerId = setTimeout(tickLoop, delay);
  }
}

workerScope.onmessage = (ev: MessageEvent<WorkerInboundMessage>) => {
  const msg = ev.data;
  switch (msg.type) {
    case 'INIT': {
      sim = createSim(msg.config);
      speed = msg.speed;
      running = msg.running;
      if (!running) sim.pauseClock();
      effectiveMultiplier = running ? (speed === 'MAX' ? 100 : speed) : 0;
      perfSteps = 0;
      perfWindowStart = performance.now();
      emitFullFrame();
      if (running && timerId === null) {
        tickLoop();
      }
      break;
    }
    case 'SET_RUNNING': {
      running = msg.running;
      perfSteps = 0;
      perfWindowStart = performance.now();
      if (!running) {
        sim?.pauseClock();
        if (timerId !== null) {
          clearTimeout(timerId);
          timerId = null;
        }
        effectiveMultiplier = 0;
        emitFullFrame();
      } else {
        sim?.resumeClock();
        effectiveMultiplier = speed === 'MAX' ? 100 : speed;
        emitFullFrame();
        if (timerId === null) {
          tickLoop();
        }
      }
      break;
    }
    case 'SET_SPEED': {
      speed = msg.speed;
      perfSteps = 0;
      perfWindowStart = performance.now();
      if (running) {
        effectiveMultiplier = speed === 'MAX' ? Math.max(effectiveMultiplier, 100) : speed;
      }
      break;
    }
    case 'SET_VISIBILITY': {
      tabHidden = msg.hidden;
      if (!tabHidden && running) {
        emitFullFrame();
      }
      break;
    }
    case 'STEP_ONCE': {
      if (!sim) break;
      running = false;
      sim.pauseClock();
      effectiveMultiplier = 0;
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
      sim.step();
      emitFullFrame();
      break;
    }
    case 'UPDATE_CONFIG': {
      if (!sim) break;
      sim.updateConfig(msg.config);
      emitFullFrame();
      break;
    }
    case 'RESET': {
      if (!sim) break;
      sim.resetEvolution();
      if (!running) {
        sim.pauseClock();
        effectiveMultiplier = 0;
      }
      emitFullFrame();
      break;
    }
    case 'LOAD_BRAIN': {
      if (!sim) break;
      sim.loadBrainIntoTraining(msg.network);
      if (!running) {
        sim.pauseClock();
        effectiveMultiplier = 0;
      }
      emitFullFrame();
      break;
    }
  }
};
