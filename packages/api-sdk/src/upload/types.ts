/**
 * Client-side upload queue types.
 *
 * Ported from the AmazingAerial contributor upload `types.ts`, with the
 * batch/item/metadata layer removed: BaseTube merges the item and the media
 * object into a single `video_uploads` row (contract §6.1).
 */
import type { CompletedPart, UploadVideoStatus } from './contracts';

export type UploadQueueStatus =
  | 'queued'
  | 'reselect_required'
  | 'reserving'
  | 'retry_wait'
  | 'uploading'
  | 'uploaded'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'held'
  | 'aborted';

/** The shape persisted to IndexedDB — everything except the `File` handle. */
export interface PersistedUploadRecord {
  localId: string;
  clientAttemptId: string;
  /** Server row id, once `POST /videos/uploads` has returned. */
  uploadId: string | null;
  channelId: number;

  /** Draft metadata; `title` is seeded with the filename stem. */
  title: string;
  description: string | null;
  isPublic: boolean;
  tags: string[] | null;

  filename: string;
  sizeBytes: number;
  lastModified: number;
  contentType: string;

  partSizeBytes: number | null;
  partCount: number | null;
  completedParts: CompletedPart[];

  status: UploadQueueStatus;
  progress: number;
  errorCode: string | null;
  errorMessage: string | null;
  retryAt: number | null;

  /** Set once the worker has inspected the original and created the Video. */
  videoId: number | null;
  videoStatus: UploadVideoStatus | null;

  createdAt: string;
  updatedAt: string;
}

export interface UploadQueueEntry extends PersistedUploadRecord {
  /** Null after a reload: the browser cannot re-open a file on its own. */
  file: File | null;
}
