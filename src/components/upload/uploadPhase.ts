/**
 * The upload vocabulary, in one place.
 *
 * A file goes through four phases, and the creator has to be able to tell them
 * apart at a glance:
 *
 *   Uploading   bytes are still moving (this is the only phase with a %)
 *   Processing  every byte is in storage; the server is making the video
 *   Ready       the video is processed and watchable
 *   Failed      the upload or the processing gave up (or was cancelled)
 *
 * The old UI collapsed the middle two into "uploading 100%", which is how nine
 * finished videos could read as "processing 100%" forever.
 */
import type { UploadQueueViewEntry } from '../../hooks/useUploadQueue';

export type UploadPhase = 'uploading' | 'processing' | 'ready' | 'failed';

/** Statuses where the browser still has bytes to push (or is about to). */
export const TRANSFERRING_STATUSES: readonly string[] = [
  'queued',
  'reselect_required',
  'reserving',
  'retry_wait',
  'uploading',
];

export function uploadPhase(entry: UploadQueueViewEntry): UploadPhase {
  if (entry.videoStatus === 'failed') return 'failed';
  if (['failed', 'held', 'aborted'].includes(entry.status)) return 'failed';
  if (entry.videoStatus === 'processed') return 'ready';
  if (TRANSFERRING_STATUSES.includes(entry.status)) return 'uploading';
  return 'processing';
}

/** True while the browser still owes the server bytes. */
export function isTransferring(entry: UploadQueueViewEntry): boolean {
  return uploadPhase(entry) === 'uploading';
}

/** The chip: the phase, in the creator's words. */
export function phaseLabel(entry: UploadQueueViewEntry): string {
  switch (uploadPhase(entry)) {
    case 'failed':
      return entry.status === 'aborted' ? 'Cancelled' : 'Failed';
    case 'ready':
      return 'Ready';
    case 'processing':
      // No video row yet means the server has not even inspected the file.
      return entry.videoId === null ? 'Uploaded' : 'Processing';
    default:
      if (entry.status === 'reselect_required') return 'Reselect file';
      if (entry.status === 'retry_wait') return 'Retrying';
      if (entry.status === 'reserving') return 'Preparing';
      if (entry.status === 'queued') return 'Queued';
      return 'Uploading';
  }
}

/** What the transcoder is doing right now, from the rendition states. */
function renditionDetail(entry: UploadQueueViewEntry): string {
  const renditions = entry.renditions ?? [];
  if (renditions.length === 0) return 'inspecting';
  const active = renditions.find((rendition) => rendition.state === 'in_progress');
  if (active) return `transcoding ${active.quality}`;
  const done = renditions.filter((rendition) => rendition.state === 'verified').length;
  if (done > 0) return `transcoded ${done}/${renditions.length}`;
  return 'queued for transcoding';
}

/**
 * The line next to the chip. Deliberately never a percentage outside the
 * `Uploading` phase — a byte count says nothing about transcoding.
 */
export function phaseDetail(entry: UploadQueueViewEntry): string {
  switch (uploadPhase(entry)) {
    case 'failed':
      if (entry.errorMessage) return entry.errorMessage;
      if (entry.status === 'aborted') return 'cancelled';
      if (entry.videoStatus === 'failed') return 'processing failed — retry from Videos Management';
      return entry.errorCode ?? 'upload failed';
    case 'ready':
      return 'ready to watch';
    case 'processing':
      return entry.videoId === null ? 'waiting for processing' : renditionDetail(entry);
    default:
      if (entry.status === 'reselect_required') return 'reselect the file to resume';
      return `${entry.progress}%`;
  }
}

/** File size in the unit a creator would say out loud. */
export function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}
