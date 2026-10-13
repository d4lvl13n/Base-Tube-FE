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
  /**
   * Local only — never a server state (UP-UX §10). The control plane refused
   * the session and one shared refresh did not renew it; the attempt waits,
   * with its progress intact, until the creator signs in again.
   */
  | 'auth_required'
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

  /**
   * Draft metadata the SERVER has not yet acknowledged (the fields of the
   * last un-flushed PATCH). Persisted so a reload during the debounce — or
   * after a failed PATCH — rebuilds the pending change instead of silently
   * completing with whatever the server last saw. `title`/`description`/
   * `isPublic` above are the DESIRED values; this records which of them are
   * still unacknowledged. Absent/null means everything shown is saved.
   */
  pendingPatch?: {
    title?: string;
    description?: string | null;
    isPublic?: boolean;
    tags?: string[] | null;
    channelId?: number;
  } | null;

  /**
   * Set when this attempt belongs to a creator draft (UP-UX). Absent on every
   * historical upload, which keeps its Upload V2 behaviour untouched.
   *
   * `clientDraftId` is the stable local identity persisted before the first
   * request; `draftId` is the server draft, null until `POST /creator-drafts`
   * has answered. A draft-bound attempt is created through
   * `POST /creator-drafts/:id/uploads`, so it cannot start before `draftId`.
   */
  creatorDraft?: { clientDraftId: string; draftId: string | null } | null;

  createdAt: string;
  updatedAt: string;
}

export interface UploadQueueEntry extends PersistedUploadRecord {
  /** Null after a reload: the browser cannot re-open a file on its own. */
  file: File | null;
}
