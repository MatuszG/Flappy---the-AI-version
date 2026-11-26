import { NeuralNetwork } from './neuralNetwork';
import {
  ALL_SENSOR_FEATURES,
  inferInputFeaturesFromCount,
  SENSOR_METADATA,
} from './sensors';
import type {
  PolicyMechanismProfile,
  SerializedNeuralNetwork,
} from './types';

export const SENSOR_NAMES: readonly string[] = ALL_SENSOR_FEATURES.map(
  (id) => SENSOR_METADATA[id].label
);

const TOTAL_SENSORS = ALL_SENSOR_FEATURES.length;

// Deterministic grid of canonical flight states covering diverse altitudes,
// vertical velocities, horizontal approaches, Pipe #1 & #2 top/bottom clearances,
// moving-pipe velocities, 2nd-pipe lookahead vertical offsets, and wind-compensated TTF.
const CANONICAL_STATES: Float64Array[] = (() => {
  const ys = [-0.45, 0.0, 0.45];
  const vys = [-0.55, 0.05, 0.65];
  const dxs = [0.05, 0.35, 0.72];
  const clearances = [-0.18, 0.14, 0.42];
  const pipeVys = [-0.6, 0.0, 0.6];
  const nextDys = [-0.55, 0.0, 0.55];
  const speedMults = [0.75, 1.0, 1.3];
  const states: Float64Array[] = [];
  let idx = 0;
  for (const y of ys) {
    for (const vy of vys) {
      for (const dx of dxs) {
        for (const topC of clearances) {
          const botC = 0.44 - topC; // typical gap width ~132px -> ~0.44 normalized
          const pipeVy = pipeVys[idx % pipeVys.length];
          const nextDy = nextDys[Math.floor(idx / 3) % nextDys.length];
          const next2TopC = topC - nextDy;
          const next2BotC = botC + nextDy;
          const next2Dx = Math.min(1.0, dx + 0.42);
          const next2PipeVy = pipeVys[(idx + 1) % pipeVys.length];
          const sMult = speedMults[Math.floor(idx / 9) % speedMults.length];
          const ttf = Math.max(0, Math.min(1.0, (dx * 640) / (3.1 * sMult * 120)));
          idx += 1;
          states.push(
            new Float64Array([
              y,
              vy,
              dx,
              topC,
              botC,
              pipeVy,
              nextDy,
              next2TopC,
              next2BotC,
              next2Dx,
              next2PipeVy,
              ttf,
            ])
          );
        }
      }
    }
  }
  return states;
})();

export function analyzePolicyMechanism(
  serialized: SerializedNeuralNetwork | null
): PolicyMechanismProfile | null {
  if (!serialized) return null;

  const net = NeuralNetwork.deserialize(serialized);
  const flat = net.toQuantizedFlatVector();
  const activeFeatures = inferInputFeaturesFromCount(
    net.inputNodes,
    serialized.inputFeatures ?? net.inputFeatures
  );
  const activeIndices = activeFeatures.map((id) => SENSOR_METADATA[id].index);
  const kCount = activeIndices.length;

  let sumSq = 0;
  let sumAbs = 0;
  let nearZero = 0;
  for (let i = 0; i < flat.length; i++) {
    const v = flat[i];
    const av = Math.abs(v);
    sumSq += v * v;
    sumAbs += av;
    if (av < 0.08) nearZero += 1;
  }

  const absGrad = new Array<number>(TOTAL_SENSORS).fill(0);
  const signedGrad = new Array<number>(TOTAL_SENSORS).fill(0);
  const eps = 0.025;
  const subBuf = new Float64Array(kCount);
  let flaps = 0;

  for (let s = 0; s < CANONICAL_STATES.length; s++) {
    const st = CANONICAL_STATES[s];
    for (let k = 0; k < kCount; k++) {
      subBuf[k] = st[activeIndices[k]];
    }
    net.resetState();
    const baseOut = net.predict(subBuf);
    if (baseOut > 0.5) flaps += 1;

    for (let k = 0; k < kCount; k++) {
      const fullIdx = activeIndices[k];
      const baseVal = st[fullIdx];
      subBuf[k] = baseVal + eps;
      net.resetState();
      const outPos = net.predict(subBuf);
      subBuf[k] = baseVal - eps;
      net.resetState();
      const outNeg = net.predict(subBuf);
      subBuf[k] = baseVal;
      const deriv = (outPos - outNeg) / (2 * eps);
      absGrad[fullIdx] += Math.abs(deriv);
      signedGrad[fullIdx] += deriv;
    }
  }

  let totalAbsGrad = 0;
  for (let j = 0; j < TOTAL_SENSORS; j++) {
    totalAbsGrad += absGrad[j];
  }
  const importance = new Array<number>(TOTAL_SENSORS).fill(0);
  const signedAvg = new Array<number>(TOTAL_SENSORS).fill(0);

  for (let j = 0; j < TOTAL_SENSORS; j++) {
    const isActive = activeIndices.includes(j);
    if (!isActive) {
      importance[j] = 0;
      signedAvg[j] = 0;
    } else {
      importance[j] =
        totalAbsGrad > 1e-9
          ? Number(((absGrad[j] / totalAbsGrad) * 100).toFixed(1))
          : Number((100 / Math.max(1, kCount)).toFixed(1));
      signedAvg[j] = Number((signedGrad[j] / CANONICAL_STATES.length).toFixed(3));
    }
  }

  let domIdx = activeIndices[0] ?? 0;
  for (let k = 1; k < kCount; k++) {
    const j = activeIndices[k];
    if (importance[j] > importance[domIdx]) domIdx = j;
  }

  // Exact linear decision formula if depth === 0 (K->1) on stateless linear architectures
  let linearFormula: string | null = null;
  if (
    net.hiddenLayers.length === 0 &&
    (net.architecture === 'MLP' || net.architecture === 'RESIDUAL_SKIP') &&
    flat.length >= kCount + 1
  ) {
    const terms = activeFeatures.map((id, k) => {
      const w = flat[k];
      const sign = w >= 0 ? (k === 0 ? '' : ' + ') : k === 0 ? '-' : ' - ';
      return `${sign}${Math.abs(w).toFixed(2)}·${SENSOR_METADATA[id].formulaVar}`;
    });
    const b = flat[kCount];
    const bStr = b >= 0 ? ` + ${b.toFixed(2)}` : ` - ${Math.abs(b).toFixed(2)}`;
    linearFormula = `Flap if ${terms.join('')}${bStr} > 0`;
  }

  return {
    sensorImportance: importance,
    sensorSignedSensitivity: signedAvg,
    dominantSensor: SENSOR_NAMES[domIdx],
    weightL2Norm: Number(Math.sqrt(sumSq).toFixed(2)),
    weightMeanAbs: flat.length > 0 ? Number((sumAbs / flat.length).toFixed(3)) : 0,
    sparsityRatio:
      flat.length > 0 ? Number((nearZero / flat.length).toFixed(2)) : 0,
    flapRateCanonical: Number((flaps / CANONICAL_STATES.length).toFixed(2)),
    linearFormula,
  };
}
