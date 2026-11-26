/**
 * Universal Runtime Watchdog, Memory/IPC Compactor & Safe Array/IndexedDB Helpers
 * Prevents browser tab reloads (OOM), stack overflow RangeErrors on >65k arrays,
 * dropped final IndexedDB saves, and monitors main-thread Event-Loop lag.
 */

/**
 * Iterative max/min helpers that never throw `RangeError: Maximum call stack size exceeded`
 * when arrays exceed 65,536 elements (unlike `Math.max(...arr)`).
 */
export function safeMax(values: readonly number[], fallback = -Infinity): number {
  let max = fallback;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v > max) max = v;
  }
  return max;
}

export function safeMin(values: readonly number[], fallback = Infinity): number {
  let min = fallback;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v < min) min = v;
  }
  return min;
}

/**
 * Strips heavy fields (e.g. neural weights, large blobs, raw time-series arrays)
 * before `worker.postMessage(...)` so structured clone does not spike browser RAM by hundreds of MB.
 */
export function stripHeavyFieldsForWorkerIpc<T extends Record<string, unknown>>(
  items: readonly T[],
  nullifyKeys: readonly (keyof T)[],
  emptyArrayKeys: readonly (keyof T)[] = []
): T[] {
  return items.map((item) => {
    const copy: Record<string, unknown> = { ...item };
    for (let i = 0; i < nullifyKeys.length; i++) {
      copy[nullifyKeys[i] as string] = null;
    }
    for (let i = 0; i < emptyArrayKeys.length; i++) {
      copy[emptyArrayKeys[i] as string] = [];
    }
    return copy as T;
  });
}

/**
 * Ensures a critical final save (e.g. `status = 'COMPLETED'`) is never silently dropped
 * if an incremental periodic autosave is currently in-flight.
 */
export function createQueuedAsyncSaver<TState>(
  saveFn: (state: TState) => Promise<boolean>
): (state: TState) => Promise<boolean> {
  let isSaving = false;
  let queuedState: { value: TState } | null = null;

  const runSave = async (state: TState): Promise<boolean> => {
    if (isSaving) {
      queuedState = { value: state };
      return false;
    }
    isSaving = true;
    try {
      return await saveFn(state);
    } finally {
      isSaving = false;
      if (queuedState !== null) {
        const next = queuedState.value;
        queuedState = null;
        void runSave(next);
      }
    }
  };

  return runSave;
}

/**
 * Lightweight circular-buffer Event-Loop Lag Watchdog (constant O(1) memory footprint).
 */
export class EventLoopWatchdog {
  private timerId: number | null = null;
  private readonly samplesMs: number[] = [];
  private readonly maxSamples: number;
  private spikesOver40Ms = 0;
  private totalTicks = 0;

  constructor(maxSamples = 512) {
    this.maxSamples = maxSamples;
  }

  start(intervalMs = 500): void {
    if (this.timerId !== null || typeof window === 'undefined') return;
    let expected = performance.now() + intervalMs;
    this.timerId = window.setInterval(() => {
      const now = performance.now();
      const lag = Math.max(0, now - expected);
      expected = now + intervalMs;
      this.totalTicks++;
      if (lag >= 40) this.spikesOver40Ms++;
      if (this.samplesMs.length >= this.maxSamples) {
        this.samplesMs.shift();
      }
      this.samplesMs.push(lag);
    }, intervalMs);
  }

  stop(): void {
    if (this.timerId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  getSummary(): { avgLagMs: number; maxLagMs: number; spikesOver40Ms: number; totalTicks: number } {
    if (this.samplesMs.length === 0) {
      return { avgLagMs: 0, maxLagMs: 0, spikesOver40Ms: 0, totalTicks: 0 };
    }
    let sum = 0;
    for (let i = 0; i < this.samplesMs.length; i++) sum += this.samplesMs[i];
    return {
      avgLagMs: sum / this.samplesMs.length,
      maxLagMs: safeMax(this.samplesMs, 0),
      spikesOver40Ms: this.spikesOver40Ms,
      totalTicks: this.totalTicks,
    };
  }
}
