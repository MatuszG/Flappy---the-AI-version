/**
 * Performance-per-Watt & Thermal Priority Controller.
 * Maps a continuous 0–100 slider (0 = Silent / Ultra-Cool / Max Perf-per-Watt,
 * 50 = Eco Balanced Sweet-Spot, 75 = High Performance, 100 = Max Speed / Turbo)
 * into hardware-aware CPU worker concurrency, worker duty-cycle pacing,
 * iGPU TDP-contention rules, and relative silicon power estimation.
 */

export type PowerModeId = 'SILENT' | 'ECO' | 'BALANCED' | 'PERFORMANCE' | 'TURBO';

export interface PowerProfilePlan {
  priority: number; // 0..100
  modeId: PowerModeId;
  label: string;
  shortLabel: string;
  description: string;
  /** Recommended CPU training threads for this priority level (respecting OS headroom) */
  targetCpuThreads: number;
  /** Fraction of logical cores used (0..1) */
  coreFraction: number;
  /** Worker compute slice length (ms) before yielding */
  workerChunkMs: number;
  /** Worker cooling pause (ms) between compute chunks (0 = MessageChannel immediate) */
  workerRestMs: number;
  /** Whether integrated GPU is permitted in AUTO mode (disabled in cool/silent modes to protect SoC TDP) */
  allowIntegratedGpu: boolean;
  /** Auto-Tuner objective: 'EFFICIENCY' favors Perf/Watt; 'BALANCED' penalizes lag; 'SPEED' favors raw ticks/s */
  autoTuneObjective: 'EFFICIENCY' | 'BALANCED' | 'SPEED';
  /** Estimated thermal headroom tag */
  thermalBadge: 'Ultra-Cool' | 'Cool' | 'Warm' | 'Hot / Max TDP';
  /** Estimated relative power draw (0.25 .. 1.00 normalized to full-TDP turbo) */
  estimatedRelativePower: number;
}

export interface EfficiencyMetrics {
  /** Normalized relative SoC power index (1.0 ≈ full-core 100% turbo load) */
  estRelPower: number;
  /** Estimated Performance per Watt index: M ticks/s per normalized power unit */
  estPerfPerWatt: number;
  /** Per-active-core throughput: M ticks/s per busy CPU core */
  ticksPerActiveCore: number;
  /** Percentage change from early/peak 30s window to late sustained 30s windows (negative = thermal throttling) */
  thermalDriftPct: number | null;
  /** Peak 30s window M ticks/s */
  peakWindowMps: number;
  /** Late sustained 30s window M ticks/s */
  lateWindowMps: number;
  /** Human-readable thermal stability assessment */
  thermalStatus: 'INSUFFICIENT_DATA' | 'COOL_STABLE' | 'MILD_DRIFT' | 'THERMAL_THROTTLING';
}

export const POWER_PRESET_STOPS: {
  priority: number;
  modeId: PowerModeId;
  label: string;
  hint: string;
}[] = [
  { priority: 15, modeId: 'SILENT', label: 'Silent / Cool', hint: 'Max Perf/W · Whisper fans · P-core low-V' },
  { priority: 45, modeId: 'ECO', label: 'Eco Sweet-Spot', hint: 'Best Perf/W · Cool sustained runs' },
  { priority: 70, modeId: 'BALANCED', label: 'Balanced', hint: 'High speed · Smooth UI · Low lag' },
  { priority: 88, modeId: 'PERFORMANCE', label: 'Performance', hint: 'Near-full cores · Fast sweeps' },
  { priority: 100, modeId: 'TURBO', label: 'Max Speed', hint: 'Full TDP · Max raw throughput' },
];

export function clampPriority(priority: number | undefined | null): number {
  if (typeof priority !== 'number' || !Number.isFinite(priority)) return 70;
  return Math.max(0, Math.min(100, Math.round(priority)));
}

/**
 * Resolves a 0..100 priority value into exact CPU thread count, worker chunk/rest pacing,
 * and Auto-Tuner policy for the detected logical core count.
 */
export function resolvePowerProfile(
  rawPriority: number | undefined | null,
  hardwareCores: number
): PowerProfilePlan {
  const priority = clampPriority(rawPriority);
  const cores = Math.max(2, Math.min(32, hardwareCores));

  // Map 0..100 priority onto core fraction (~0.24 at 0 -> ~0.95 at 100)
  // On 22 cores:
  //   p=0   -> 5 threads  (23%) + 14ms rest  (ultra-silent)
  //   p=15  -> 7 threads  (32%) + 8ms rest   (silent/cool)
  //   p=45  -> 11 threads (50%) + 2ms rest   (eco sweet-spot perf/W)
  //   p=70  -> 15 threads (68%) + 0ms rest   (balanced smooth UI, 7 cores free for OS/UI!)
  //   p=88  -> 18 threads (82%) + 0ms rest   (high performance, 4 cores free)
  //   p=100 -> 20 threads (91%) + 0ms rest   (max speed, 2 cores free so PC never locks up)
  const t = priority / 100;
  const maxSafeThreads = cores >= 12 ? cores - 2 : Math.max(2, cores - 1);
  const minThreads = Math.max(1, Math.min(maxSafeThreads, Math.round(cores * 0.22)));
  const rawThreads = minThreads + (maxSafeThreads - minThreads) * Math.pow(t, 0.92);
  const targetCpuThreads = Math.max(1, Math.min(maxSafeThreads, Math.round(rawThreads)));
  const coreFraction = targetCpuThreads / cores;

  // Worker duty pacing:
  // Below 55, insert gentle cooling micro-pauses between short compute slices so
  // laptop boost clocks stay in their low-voltage efficiency knee & fans stay quiet.
  let workerChunkMs = 30;
  let workerRestMs = 0;
  if (priority < 25) {
    workerChunkMs = 14 + Math.round((priority / 25) * 4);
    workerRestMs = Math.round(14 - (priority / 25) * 8); // 14ms -> 6ms
  } else if (priority < 55) {
    const k = (priority - 25) / 30;
    workerChunkMs = 18 + Math.round(k * 8); // 18 -> 26ms
    workerRestMs = Math.round(5 * (1 - k)); // 5 -> 0ms
  } else if (priority < 85) {
    workerChunkMs = 28;
    workerRestMs = 0;
  } else {
    workerChunkMs = 35;
    workerRestMs = 0;
  }

  let modeId: PowerModeId;
  let label: string;
  let shortLabel: string;
  let description: string;
  let thermalBadge: PowerProfilePlan['thermalBadge'];
  let allowIntegratedGpu: boolean;
  let autoTuneObjective: PowerProfilePlan['autoTuneObjective'];

  if (priority < 25) {
    modeId = 'SILENT';
    label = 'Silent / Ultra-Cool';
    shortLabel = 'Silent';
    description = 'Lowest heat & fan noise. P-core efficiency knee with thermal micro-rests; iGPU off.';
    thermalBadge = 'Ultra-Cool';
    allowIntegratedGpu = false;
    autoTuneObjective = 'EFFICIENCY';
  } else if (priority < 55) {
    modeId = 'ECO';
    label = 'Eco Perf/Watt';
    shortLabel = 'Eco';
    description = 'Sweet-spot performance per watt. Avoids thermal throttling & E-core voltage cliff.';
    thermalBadge = 'Cool';
    allowIntegratedGpu = false;
    autoTuneObjective = 'EFFICIENCY';
  } else if (priority < 80) {
    modeId = 'BALANCED';
    label = 'Balanced';
    shortLabel = 'Balanced';
    description = 'High throughput with generous OS/UI headroom for stutter-free multitasking.';
    thermalBadge = 'Warm';
    allowIntegratedGpu = true;
    autoTuneObjective = 'BALANCED';
  } else if (priority < 95) {
    modeId = 'PERFORMANCE';
    label = 'High Performance';
    shortLabel = 'Perf';
    description = 'Near-full CPU saturation with responsive UI guardrails.';
    thermalBadge = 'Warm';
    allowIntegratedGpu = true;
    autoTuneObjective = 'SPEED';
  } else {
    modeId = 'TURBO';
    label = 'Max Speed / Turbo';
    shortLabel = 'Turbo';
    description = 'Maximum raw ticks/sec across almost all logical cores at full SoC TDP.';
    thermalBadge = 'Hot / Max TDP';
    allowIntegratedGpu = true;
    autoTuneObjective = 'SPEED';
  }

  const dutyRatio = workerChunkMs / Math.max(1, workerChunkMs + workerRestMs);
  const estimatedRelativePower = estimateRelativeSoCPower(
    coreFraction,
    dutyRatio,
    0,
    false
  );

  return {
    priority,
    modeId,
    label,
    shortLabel,
    description,
    targetCpuThreads,
    coreFraction,
    workerChunkMs,
    workerRestMs,
    allowIntegratedGpu,
    autoTuneObjective,
    thermalBadge,
    estimatedRelativePower,
  };
}

/**
 * Convex relative SoC power model (normalized so 100% cores @ 100% duty ≈ 1.00).
 * Modern CPUs have superlinear power vs active core utilization (P ~ base + k * u^1.55)
 * due to turbo V/f scaling and shared ring/L3 power. This gives an apples-to-apples
 * relative Perf/Watt efficiency index across slider levels on the same machine.
 */
export function estimateRelativeSoCPower(
  coreOccupancyFraction: number,
  workerDutyFraction: number,
  gpuActiveWallFraction: number,
  gpuIsIntegrated: boolean
): number {
  const u = Math.max(0, Math.min(1.1, coreOccupancyFraction));
  const d = Math.max(0.1, Math.min(1, workerDutyFraction));
  const effectiveLoad = u * d;
  // Base uncore/memory idle floor (0.14) + convex compute power (0.86 * load^1.55)
  const cpuRelPower = 0.14 + 0.86 * Math.pow(effectiveLoad, 1.55);
  const gpuWeight = gpuIsIntegrated ? 0.24 : 0.42;
  const gpuRelPower = Math.max(0, Math.min(1, gpuActiveWallFraction)) * gpuWeight;
  return Number(Math.max(0.15, cpuRelPower + gpuRelPower).toFixed(3));
}

/**
 * Computes sustained efficiency & thermal drift diagnostics from profiler telemetry.
 */
export function computeEfficiencyMetrics(params: {
  ticksMPerSec: number;
  avgActiveCores: number;
  hardwareCores: number;
  internalDutyFraction: number;
  gpuWaitWallFraction: number;
  gpuIsIntegrated: boolean;
  windowMpsList: number[];
}): EfficiencyMetrics {
  const occupancy = params.avgActiveCores / Math.max(1, params.hardwareCores);
  const estRelPower = estimateRelativeSoCPower(
    occupancy,
    params.internalDutyFraction,
    params.gpuWaitWallFraction,
    params.gpuIsIntegrated
  );
  const estPerfPerWatt =
    estRelPower > 0 ? params.ticksMPerSec / estRelPower : 0;
  const ticksPerActiveCore =
    params.avgActiveCores > 0.05
      ? params.ticksMPerSec / params.avgActiveCores
      : params.ticksMPerSec;

  // Analyze 30s throughput windows for thermal throttling drift
  const validWindows = params.windowMpsList.filter((v) => Number.isFinite(v) && v > 0.1);
  let peakWindowMps = 0;
  let lateWindowMps = 0;
  let thermalDriftPct: number | null = null;
  let thermalStatus: EfficiencyMetrics['thermalStatus'] = 'INSUFFICIENT_DATA';

  if (validWindows.length >= 1) {
    peakWindowMps = Math.max(...validWindows);
    lateWindowMps = validWindows[validWindows.length - 1];
  }

  if (validWindows.length >= 3) {
    // Compare early sustained peak (max of first 2 windows) vs late sustained windows
    const earlyRef = Math.max(validWindows[0], validWindows[1]);
    const tailSlice = validWindows.slice(-2);
    // If the very last window drops below 30% of the preceding window, it indicates
    // a queue-draining tail (sweep finishing mid-window), NOT thermal throttling.
    if (tailSlice.length === 2 && tailSlice[1] < tailSlice[0] * 0.3) {
      lateWindowMps = tailSlice[0];
    } else {
      lateWindowMps =
        tailSlice.reduce((a, b) => a + b, 0) / Math.max(1, tailSlice.length);
    }
    if (earlyRef > 0.1) {
      thermalDriftPct = ((lateWindowMps - earlyRef) / earlyRef) * 100;
      if (thermalDriftPct <= -14) {
        thermalStatus = 'THERMAL_THROTTLING';
      } else if (thermalDriftPct <= -6) {
        thermalStatus = 'MILD_DRIFT';
      } else {
        thermalStatus = 'COOL_STABLE';
      }
    }
  } else if (validWindows.length >= 1) {
    thermalStatus = 'COOL_STABLE';
  }

  return {
    estRelPower,
    estPerfPerWatt,
    ticksPerActiveCore,
    thermalDriftPct,
    peakWindowMps,
    lateWindowMps,
    thermalStatus,
  };
}
