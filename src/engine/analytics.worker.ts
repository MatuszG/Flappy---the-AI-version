/**
 * Dedicated Off-Main-Thread Analytics & Report Compilation Web Worker.
 *
 * Moves O(N) research aggregation (`computeResearchFindings`), scientific Markdown/CSV/JSON
 * report synthesis, and run-archive snapshots off the React main thread so Event-Loop Lag
 * stays <15ms even on 5,000–50,000+ trial datasets.
 */

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

export type AnalyticsWorkerInbound =
  | {
      type: 'COMPUTE_FINDINGS';
      requestId: number;
      results: ResearchTrialResult[];
      config: ResearchSweepConfig;
    }
  | {
      type: 'EXPORT_MARKDOWN';
      requestId: number;
      results: ResearchTrialResult[];
      config: ResearchSweepConfig;
    }
  | {
      type: 'EXPORT_CSV';
      requestId: number;
      results: ResearchTrialResult[];
    }
  | {
      type: 'EXPORT_JSON';
      requestId: number;
      results: ResearchTrialResult[];
      config: ResearchSweepConfig;
    }
  | {
      type: 'EXPORT_AI_DELTA_DIGEST';
      requestId: number;
      results: ResearchTrialResult[];
      config: ResearchSweepConfig;
    }
  | {
      type: 'EXPORT_JSONL';
      requestId: number;
      results: ResearchTrialResult[];
      config: ResearchSweepConfig;
    }
  | {
      type: 'BUILD_ARCHIVE_SNAPSHOT';
      requestId: number;
      results: ResearchTrialResult[];
      config: ResearchSweepConfig;
    };

export type AnalyticsWorkerOutbound =
  | {
      type: 'FINDINGS_READY';
      requestId: number;
      findings: ResearchFindings;
      elapsedMs: number;
    }
  | {
      type: 'EXPORT_READY';
      requestId: number;
      content: string;
      elapsedMs: number;
    }
  | {
      type: 'ARCHIVE_SNAPSHOT_READY';
      requestId: number;
      findings: ResearchFindings;
      scientificReportMarkdown: string;
      integrity: IntegrityCheckSummary;
      elapsedMs: number;
    }
  | {
      type: 'ERROR';
      requestId: number;
      message: string;
    };

const workerScope = self as unknown as {
  postMessage: (msg: AnalyticsWorkerOutbound) => void;
  onmessage: ((ev: MessageEvent<AnalyticsWorkerInbound>) => void) | null;
};

workerScope.onmessage = (ev: MessageEvent<AnalyticsWorkerInbound>) => {
  const msg = ev.data;
  const t0 = performance.now();
  try {
    switch (msg.type) {
      case 'COMPUTE_FINDINGS': {
        const findings = computeResearchFindings(msg.results, msg.config);
        workerScope.postMessage({
          type: 'FINDINGS_READY',
          requestId: msg.requestId,
          findings,
          elapsedMs: performance.now() - t0,
        });
        break;
      }
      case 'EXPORT_MARKDOWN': {
        const findings = computeResearchFindings(msg.results, msg.config);
        const content = generateMarkdownReport(msg.results, msg.config, findings);
        workerScope.postMessage({
          type: 'EXPORT_READY',
          requestId: msg.requestId,
          content,
          elapsedMs: performance.now() - t0,
        });
        break;
      }
      case 'EXPORT_CSV': {
        const content = generateCsvReport(msg.results);
        workerScope.postMessage({
          type: 'EXPORT_READY',
          requestId: msg.requestId,
          content,
          elapsedMs: performance.now() - t0,
        });
        break;
      }
      case 'EXPORT_JSON': {
        const findings = computeResearchFindings(msg.results, msg.config);
        const content = generateJsonDataset(msg.results, msg.config, findings);
        workerScope.postMessage({
          type: 'EXPORT_READY',
          requestId: msg.requestId,
          content,
          elapsedMs: performance.now() - t0,
        });
        break;
      }
      case 'EXPORT_AI_DELTA_DIGEST': {
        const findings = computeResearchFindings(msg.results, msg.config);
        const content = generateAiDeltaDigest(msg.results, msg.config, findings);
        workerScope.postMessage({
          type: 'EXPORT_READY',
          requestId: msg.requestId,
          content,
          elapsedMs: performance.now() - t0,
        });
        break;
      }
      case 'EXPORT_JSONL': {
        const content = generateJsonlDataset(msg.results, msg.config);
        workerScope.postMessage({
          type: 'EXPORT_READY',
          requestId: msg.requestId,
          content,
          elapsedMs: performance.now() - t0,
        });
        break;
      }
      case 'BUILD_ARCHIVE_SNAPSHOT': {
        const findings = computeResearchFindings(msg.results, msg.config);
        const scientificReportMarkdown = generateMarkdownReport(
          msg.results,
          msg.config,
          findings
        );
        const integrity = runIntegrityChecks(msg.results, msg.config);
        workerScope.postMessage({
          type: 'ARCHIVE_SNAPSHOT_READY',
          requestId: msg.requestId,
          findings,
          scientificReportMarkdown,
          integrity,
          elapsedMs: performance.now() - t0,
        });
        break;
      }
    }
  } catch (err) {
    workerScope.postMessage({
      type: 'ERROR',
      requestId: msg.requestId,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
