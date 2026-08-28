/**
 * Server upload state → queue status. Identical mapping to the AmazingAerial
 * `submission-mapping.ts` `statusFromServer`.
 */
import type { UploadState } from './contracts';
import type { UploadQueueStatus } from './types';

export function statusFromServer(state: UploadState): UploadQueueStatus {
  if (state === 'processing') return 'processing';
  if (state === 'ready') return 'ready';
  if (state === 'failed') return 'failed';
  if (state === 'held') return 'held';
  if (state === 'aborted') return 'aborted';
  if (state === 'completing') return 'uploaded';
  return 'uploading';
}

/** Statuses the server owns from here on — the client stops transferring. */
export const TERMINAL_SERVER_STATUSES: readonly UploadQueueStatus[] = [
  'processing',
  'ready',
  'failed',
  'held',
  'aborted',
];

export function isTerminalServerStatus(status: UploadQueueStatus): boolean {
  return TERMINAL_SERVER_STATUSES.includes(status);
}
