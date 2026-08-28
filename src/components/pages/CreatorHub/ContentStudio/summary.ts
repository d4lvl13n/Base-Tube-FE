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
