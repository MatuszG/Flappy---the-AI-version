/**
 * Promise-based client for the Off-Main-Thread Analytics Web Worker.
 * Features latest-request-wins cancellation for live findings updates and
 * graceful synchronous fallback when running in non-Worker environments (CLI/tests).
 */

import type {
  AnalyticsWorkerInbound,
  AnalyticsWorkerOutbound,
} from './analytics.worker';
import { runIntegrityChecks } from './experimentPresets';
import {
  computeResearchFindings,
  generateAiDeltaDigest,
  generateCsvReport,
  generateJsonDataset,
  generateJsonlDataset,
  generateMarkdownReport,
  type ResearchFindings,
} from './researchReport';
import type {
  IntegrityCheckSummary,
  ResearchSweepConfig,
  ResearchTrialResult,
} from './types';

export interface ArchiveSnapshotPayload {
  findings: ResearchFindings;
  scientificReportMarkdown: string;
  integrity: IntegrityCheckSummary;
  elapsedMs: number;
}

interface PendingRequest<T> {
  resolve: (value: T) => void;
  reject: (err: Error) => void;
}

const EMPTY_SCORE_CURVE: number[] = [];

/**
 * Strips heavy serialized weight blobs (`bestBrain`) and per-generation curves (`scoreCurve`)
 * before structured-cloning large trial arrays to the Analytics Web Worker.
 * Neither findings aggregation, Markdown/CSV/AI-Delta reports, nor integrity checks read them,
 * cutting post-sweep IPC memory spikes by >90% and preventing Chrome renderer OOM reloads.
 */
function stripHeavyTrialFields(
  results: ResearchTrialResult[]
): ResearchTrialResult[] {
  const out = new Array<ResearchTrialResult>(results.length);
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.bestBrain !== null || (r.scoreCurve && r.scoreCurve.length > 0)) {
      out[i] = {
        ...r,
        bestBrain: null,
        scoreCurve: EMPTY_SCORE_CURVE,
      };
    } else {
      out[i] = r;
    }
  }
  return out;
}

class AnalyticsWorkerClient {
  private worker: Worker | null = null;
  private nextReqId = 1;
  private latestFindingsReqId = 0;
  private pending = new Map<number, PendingRequest<unknown>>();

  private ensureWorker(): Worker | null {
    if (this.worker) return this.worker;
    if (typeof Worker === 'undefined') return null;
    try {
      const w = new Worker(
        new URL('./analytics.worker.ts', import.meta.url),
        { type: 'module' }
      );
      w.onmessage = (ev: MessageEvent<AnalyticsWorkerOutbound>) => {
        const msg = ev.data;
        const entry = this.pending.get(msg.requestId);
        if (!entry) return;
        this.pending.delete(msg.requestId);
        if (msg.type === 'ERROR') {
          entry.reject(new Error(msg.message));
        } else {
          entry.resolve(msg);
        }
      };
      w.onerror = () => {
        // Fallback to synchronous on worker crash
        this.dispose();
      };
      w.onmessageerror = () => {
        this.dispose();
      };
      this.worker = w;
      return w;
    } catch {
      return null;
    }
  }

  /**
   * Computes ResearchFindings asynchronously in the Analytics Worker.
   * Returns `null` if superseded by a newer request (latest-request-wins).
   */
  async computeFindingsLatest(
    results: ResearchTrialResult[],
    config: ResearchSweepConfig
  ): Promise<{ findings: ResearchFindings; elapsedMs: number } | null> {
    const reqId = this.nextReqId++;
    this.latestFindingsReqId = reqId;

    // Tiny datasets (<40 trials) are instant (<0.4ms) — skip structured-clone IPC overhead
    const worker = results.length >= 40 ? this.ensureWorker() : null;
    if (!worker) {
      const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const findings = computeResearchFindings(results, config);
      const elapsedMs =
        (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
      if (this.latestFindingsReqId !== reqId) return null;
      return { findings, elapsedMs };
    }

    const lightResults = stripHeavyTrialFields(results);
    const msg = await new Promise<AnalyticsWorkerOutbound>((resolve, reject) => {
      this.pending.set(reqId, {
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      worker.postMessage({
        type: 'COMPUTE_FINDINGS',
        requestId: reqId,
        results: lightResults,
        config,
      } satisfies AnalyticsWorkerInbound);
    });

    if (this.latestFindingsReqId !== reqId) {
      return null;
    }
    if (msg.type === 'FINDINGS_READY') {
      return { findings: msg.findings, elapsedMs: msg.elapsedMs };
    }
    return null;
  }

  async exportMarkdown(
    results: ResearchTrialResult[],
    config: ResearchSweepConfig
  ): Promise<string> {
    const worker = this.ensureWorker();
    if (!worker) {
      const findings = computeResearchFindings(results, config);
      return generateMarkdownReport(results, config, findings);
    }
    const reqId = this.nextReqId++;
    const lightResults = stripHeavyTrialFields(results);
    const msg = await new Promise<AnalyticsWorkerOutbound>((resolve, reject) => {
      this.pending.set(reqId, {
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      worker.postMessage({
        type: 'EXPORT_MARKDOWN',
        requestId: reqId,
        results: lightResults,
        config,
      } satisfies AnalyticsWorkerInbound);
    });
    if (msg.type === 'EXPORT_READY') return msg.content;
    throw new Error('Unexpected worker response for EXPORT_MARKDOWN');
  }

  async exportAiDeltaDigest(
    results: ResearchTrialResult[],
    config: ResearchSweepConfig
  ): Promise<string> {
    const worker = this.ensureWorker();
    if (!worker) {
      const findings = computeResearchFindings(results, config);
      return generateAiDeltaDigest(results, config, findings);
    }
    const reqId = this.nextReqId++;
    const lightResults = stripHeavyTrialFields(results);
    const msg = await new Promise<AnalyticsWorkerOutbound>((resolve, reject) => {
      this.pending.set(reqId, {
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      worker.postMessage({
        type: 'EXPORT_AI_DELTA_DIGEST',
        requestId: reqId,
        results: lightResults,
        config,
      } satisfies AnalyticsWorkerInbound);
    });
    if (msg.type === 'EXPORT_READY') return msg.content;
    throw new Error('Unexpected worker response for EXPORT_AI_DELTA_DIGEST');
  }

  async exportCsv(results: ResearchTrialResult[]): Promise<string> {
    const worker = this.ensureWorker();
    if (!worker) {
      return generateCsvReport(results);
    }
    const reqId = this.nextReqId++;
    const lightResults = stripHeavyTrialFields(results);
    const msg = await new Promise<AnalyticsWorkerOutbound>((resolve, reject) => {
      this.pending.set(reqId, {
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      worker.postMessage({
        type: 'EXPORT_CSV',
        requestId: reqId,
        results: lightResults,
      } satisfies AnalyticsWorkerInbound);
    });
    if (msg.type === 'EXPORT_READY') return msg.content;
    throw new Error('Unexpected worker response for EXPORT_CSV');
  }

  async exportJson(
    results: ResearchTrialResult[],
    config: ResearchSweepConfig
  ): Promise<string> {
    const worker = this.ensureWorker();
    if (!worker) {
      const findings = computeResearchFindings(results, config);
      return generateJsonDataset(results, config, findings);
    }
    const reqId = this.nextReqId++;
    const msg = await new Promise<AnalyticsWorkerOutbound>((resolve, reject) => {
      this.pending.set(reqId, {
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      worker.postMessage({
        type: 'EXPORT_JSON',
        requestId: reqId,
        results,
        config,
      } satisfies AnalyticsWorkerInbound);
    });
    if (msg.type === 'EXPORT_READY') return msg.content;
    throw new Error('Unexpected worker response for EXPORT_JSON');
  }

  async exportJsonl(
    results: ResearchTrialResult[],
    config: ResearchSweepConfig
  ): Promise<string> {
    const worker = this.ensureWorker();
    if (!worker) {
      return generateJsonlDataset(results, config);
    }
    const reqId = this.nextReqId++;
    const msg = await new Promise<AnalyticsWorkerOutbound>((resolve, reject) => {
      this.pending.set(reqId, {
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      worker.postMessage({
        type: 'EXPORT_JSONL',
        requestId: reqId,
        results,
        config,
      } satisfies AnalyticsWorkerInbound);
    });
    if (msg.type === 'EXPORT_READY') return msg.content;
    throw new Error('Unexpected worker response for EXPORT_JSONL');
  }

  async buildArchiveSnapshot(
    results: ResearchTrialResult[],
    config: ResearchSweepConfig
  ): Promise<ArchiveSnapshotPayload> {
    const worker = this.ensureWorker();
    if (!worker) {
      const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const findings = computeResearchFindings(results, config);
      const scientificReportMarkdown = generateMarkdownReport(
        results,
        config,
        findings
      );
      const integrity = runIntegrityChecks(results, config);
      return {
        findings,
        scientificReportMarkdown,
        integrity,
        elapsedMs:
          (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0,
      };
    }
    const reqId = this.nextReqId++;
    const lightResults = stripHeavyTrialFields(results);
    const msg = await new Promise<AnalyticsWorkerOutbound>((resolve, reject) => {
      this.pending.set(reqId, {
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      worker.postMessage({
        type: 'BUILD_ARCHIVE_SNAPSHOT',
        requestId: reqId,
        results: lightResults,
        config,
      } satisfies AnalyticsWorkerInbound);
    });
    if (msg.type === 'ARCHIVE_SNAPSHOT_READY') {
      return {
        findings: msg.findings,
        scientificReportMarkdown: msg.scientificReportMarkdown,
        integrity: msg.integrity,
        elapsedMs: msg.elapsedMs,
      };
    }
    throw new Error('Unexpected worker response for BUILD_ARCHIVE_SNAPSHOT');
  }

  dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    for (const entry of this.pending.values()) {
      entry.reject(new Error('Analytics worker disposed'));
    }
    this.pending.clear();
  }
}

export const analyticsClient = new AnalyticsWorkerClient();
