/**
 * The Content Studio stat cards, as a pure function of the queue.
 *
 * Kept out of the component so the counting rules — which are the whole point
 * of the phase vocabulary — can be tested without rendering anything.
 */
import type { UploadQueueViewEntry } from '../../../../hooks/useUploadQueue';
import { uploadPhase } from '../../../upload/uploadPhase';

export interface QueueSummary {
  total: number;
  /** Bytes still moving. */
  uploading: number;
  /** Bytes done, video not processed yet. */
  processing: number;
  /** `videoStatus === 'processed'`. */
  ready: number;
  /** Upload failed/held/cancelled, or the video failed to process. */
  failed: number;
  /** Average byte progress across the queue — the transfer, nothing else. */
  transferPercent: number;
  /** True once no entry has bytes left to send. */
  transferComplete: boolean;
}

export function summarizeEntries(entries: readonly UploadQueueViewEntry[]): QueueSummary {
  const counts = { uploading: 0, processing: 0, ready: 0, failed: 0 };
  let progressSum = 0;
  for (const entry of entries) {
    counts[uploadPhase(entry)] += 1;
    progressSum += entry.progress;
  }
  return {
    total: entries.length,
    ...counts,
    transferPercent: entries.length > 0 ? Math.round(progressSum / entries.length) : 0,
    transferComplete: entries.length > 0 && counts.uploading === 0,
  };
}

/** How a summary segment should read — colour is meaning, not decoration. */
export type SummaryTone = 'muted' | 'active' | 'ready' | 'failed';

export interface SummarySegment {
  key: string;
  text: string;
  tone: SummaryTone;
}

/**
 * The status strip: `9 files · 2 uploading · 3 processing · 4 ready · 1 failed`.
 *
 * Only the total is always shown; a phase earns a segment by having something
 * in it, so a queue that is simply working reads as one short line.
 */
export function summarySegments(summary: QueueSummary): SummarySegment[] {
  if (summary.total === 0) return [];
  const segments: SummarySegment[] = [
    { key: 'total', text: `${summary.total} ${summary.total === 1 ? 'file' : 'files'}`, tone: 'muted' },
  ];
  const phases: ReadonlyArray<[keyof QueueSummary, string, SummaryTone]> = [
    ['uploading', 'uploading', 'active'],
    ['processing', 'processing', 'muted'],
    ['ready', 'ready', 'ready'],
    ['failed', 'failed', 'failed'],
  ];
  for (const [key, label, tone] of phases) {
    const count = summary[key] as number;
    if (count > 0) segments.push({ key: String(key), text: `${count} ${label}`, tone });
  }
  return segments;
}
