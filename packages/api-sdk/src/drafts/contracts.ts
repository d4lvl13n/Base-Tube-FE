/**
 * Wire types for the creator-draft routes (`/api/v1/creator-drafts`).
 *
 * Source: the implemented contract `base-be/docs/CREATOR_DRAFTS_API.md`
 * ("Complete shared TypeScript shapes"), which extends Upload V2 additively.
 * The routes are available directly once deployed and migrated — there is no
 * capability flag to check.
 *
 * Envelope: `{ success: true, data }` / `{ success: false, error: { code, message, details? } }`,
 * identical to Upload V2, so failures surface as the same `UploadApiError`.
 * Error codes are extensible: every switch on them keeps an unknown-code fallback.
 */
import type { UploadState, UploadVideoStatus } from '../upload/contracts';

export type DraftPublicationState = 'draft' | 'published';

/** `recovery.action`. A browser that still holds the file resumes without a reselect prompt. */
export type DraftRecoveryAction =
  | 'none'
  | 'wait'
  | 'reselect_file'
  | 'retry_processing'
  | 'replace_file'
  | 'contact_support';

/** Why the server would refuse to publish now (also `DRAFT_NOT_READY.details.publishBlockers`). */
export type DraftPublishBlockerCode =
  | 'VIDEO_NOT_READY'
  | 'PLAYBACK_NOT_READY'
  | 'MODERATION_RESTRICTED'
  | 'THUMBNAIL_NOT_READY'
  | 'DRAFT_DELETED';

/**
 * The draft projection, available before and after the `Videos` row exists.
 * `uploadState` / `videoStatus` keep the unchanged Upload V2 and `Videos.status` enums.
 */
export interface CreatorDraftView {
  id: string;
  revision: number;
  channelId: number;
  title: string;
  description: string | null;
  tags: string[] | null;
  publicationState: DraftPublicationState;
  uploadId: string | null;
  videoId: number | null;
  uploadState: UploadState | null;
  videoStatus: UploadVideoStatus | null;
  /** Storage confirmed the final object and the move to processing is durable. Not a browser %. */
  transferConfirmed: boolean;
  /** Processed, moderation-allowed, with a playable rendition or passthrough original. */
  playbackReady: boolean;
  thumbnail: {
    assetId: string | null;
    source: 'automatic' | 'custom';
    ready: boolean;
  };
  canPublish: boolean;
  /**
   * Typed with the documented codes; a code added later by the server is kept
   * as-is by the parser (the contract says codes are extensible).
   */
  publishBlockers: Array<DraftPublishBlockerCode | (string & {})>;
  recovery: {
    action: DraftRecoveryAction;
    /** The durable Upload V2 machine error code (e.g. `UPLOAD_EXPIRED`), never an operator detail. */
    code: string | null;
    retryAfterSeconds: number | null;
  };
  updatedAt: string;
}

/** `POST /creator-drafts` body. 201 = created, 200 = identical replay of the same `clientDraftId`. */
export interface CreateDraftBody {
  clientDraftId: string;
  channelId: number;
  title: string;
  description?: string | null;
  tags?: string[] | null;
}

export interface CreateDraftResult {
  /** True on 201, false on a 200 replay. */
  created: boolean;
  draft: CreatorDraftView;
}

/** `GET /creator-drafts` query. Default limit 25, maximum 50. */
export interface ListDraftsParams {
  channelId?: number;
  state?: DraftPublicationState;
  cursor?: string | null;
  limit?: number;
}

/** `CreatorDraftPage`, sorted `updatedAt DESC, id DESC`. */
export interface ListDraftsResult {
  items: CreatorDraftView[];
  nextCursor: string | null;
}

/** `PATCH /creator-drafts/:id`. Strict body: `isPublic`, channel changes and unknown fields are rejected. */
export interface PatchDraftBody {
  expectedRevision: number;
  title?: string;
  description?: string | null;
  tags?: string[] | null;
}

/**
 * `POST /creator-drafts/:id/uploads` (`AttachCreatorDraftUpload`). The SDK
 * returns the Upload V2 `CreateUploadResult`, so the existing transfer engine
 * drives the attempt through `/api/v1/videos/uploads/:id` afterwards.
 */
export interface CreateDraftUploadBody {
  clientAttemptId: string;
  filename: string;
  declaredContentType: string;
  declaredSizeBytes: number;
  lastModifiedAt?: string | null;
}

/** `CreatorDraftAssetView` — every accepted image is re-encoded to JPEG. Uploading never selects it. */
export interface DraftThumbnailAsset {
  id: string;
  assetId: string;
  state: 'ready';
  sizeBytes: number;
  mimeType: 'image/jpeg';
}

/** `PUT /creator-drafts/:id/thumbnail`. `assetId: null` returns to the automatic poster. */
export interface SelectDraftThumbnailBody {
  expectedRevision: number;
  assetId: string | null;
}

/** `POST /creator-drafts/:id/publication`. A replay of the same operation returns its stored response. */
export interface DraftPublicationBody {
  clientOperationId: string;
  expectedRevision: number;
  state: DraftPublicationState;
}

/** `POST /creator-drafts/:id/retry-processing` — inspection retry when `videoId` is still null. */
export interface RetryDraftProcessingBody {
  expectedRevision: number;
}

/** A private, owner-only URL. Expires after five minutes (`Cache-Control: private, no-store`). */
export interface TemporaryMedia {
  url: string;
  expiresAt: string;
}

/** `GET /creator-drafts/:id/preview` (`CreatorDraftPreview`). */
export interface DraftPreviewData {
  thumbnail: TemporaryMedia | null;
  playback: TemporaryMedia | null;
  assets: Array<TemporaryMedia & { id: string; assetId: string }>;
}

/** `DELETE /creator-drafts/:id` 202 (`DeleteCreatorDraftResult`). Cleanup is asynchronous. */
export interface DeleteDraftResult {
  id: string;
  deleted: true;
  revision: number;
}

/** Error codes the implemented contract names. Unknown codes must still be handled. */
export const DRAFT_ERROR_CODES = {
  revisionConflict: 'DRAFT_REVISION_CONFLICT',
  notReady: 'DRAFT_NOT_READY',
  idempotencyConflict: 'IDEMPOTENCY_CONFLICT',
  explicitPublicationRequired: 'EXPLICIT_PUBLICATION_REQUIRED',
  workflowRequired: 'DRAFT_WORKFLOW_REQUIRED',
  notFound: 'DRAFT_NOT_FOUND',
  deleted: 'DRAFT_DELETED',
  uploadActive: 'DRAFT_UPLOAD_ACTIVE',
  videoReplacementUnsupported: 'DRAFT_VIDEO_REPLACEMENT_UNSUPPORTED',
  assetNotReady: 'DRAFT_ASSET_NOT_READY',
  invalidAsset: 'INVALID_DRAFT_ASSET',
  invalidThumbnail: 'INVALID_THUMBNAIL',
  thumbnailTooLarge: 'THUMBNAIL_TOO_LARGE',
  assetStateConflict: 'ASSET_STATE_CONFLICT',
  invalidMetadata: 'INVALID_DRAFT_METADATA',
  invalidRevision: 'INVALID_DRAFT_REVISION',
  channelForbidden: 'CHANNEL_FORBIDDEN',
  uploadExpired: 'UPLOAD_EXPIRED',
  videoAlreadyExists: 'DRAFT_VIDEO_ALREADY_EXISTS',
  originalUnavailable: 'DRAFT_ORIGINAL_UNAVAILABLE',
  processingNotRetryable: 'DRAFT_PROCESSING_NOT_RETRYABLE',
} as const;
