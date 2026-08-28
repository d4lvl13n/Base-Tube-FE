/**
 * Wire types for the BaseTube Upload V2 control plane.
 *
 * Hand-written from `docs/UPLOAD_SYSTEM_V2_BUILD_CONTRACT.md` §7.2–7.4 and §9
 * (backend repo). Every route lives under `/api/v1/videos/uploads` and uses the
 * standard envelope `{ success, data | error: { code, message, details? } }`.
 */

/** `video_uploads.upload_state` (contract §7.1). */
export type UploadState =
  | 'initiated'
  | 'uploading'
  | 'completing'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'aborted'
  | 'held';

/**
 * `Videos.status` as the V2 routes report it (contract §6.4: the enum is
 * unchanged, `processed` is the terminal success value). Distinct from the
 * SDK's legacy `VideoStatus`, which spells that value `completed`.
 */
export type UploadVideoStatus = 'pending' | 'processing' | 'processed' | 'failed';

/**
 * A signed capability for exactly one multipart part.
 *
 * `uaManagedSignedHeaders['content-length']` is pinned into the signature: the
 * blob must be that many bytes or the storage provider rejects the PUT.
 */
export interface MultipartPartCapability {
  partNumber: number;
  method: 'PUT';
  url: string;
  requiredHeaders: Record<string, string>;
  uaManagedSignedHeaders: { 'content-length': string };
}

/** A part the server has actually seen (from `ListParts`). */
export interface CompletedPart {
  partNumber: number;
  etag: string | null;
  sizeBytes: number;
}

/** `POST /videos/uploads` request body (§7.2). */
export interface CreateUploadBody {
  clientAttemptId: string;
  channelId: number;
  title: string;
  description?: string | null;
  isPublic?: boolean;
  tags?: string[] | null;
  filename: string;
  declaredContentType: string;
  declaredSizeBytes: number;
  lastModifiedAt?: string | null;
}

/** `POST /videos/uploads` 201 payload (§7.2). Never contains storage keys. */
export interface CreateUploadData {
  uploadId: string;
  partSizeBytes: number;
  partCount: number;
  capabilities: MultipartPartCapability[];
  expiresAt: string;
}

/**
 * `POST /videos/uploads` 202 payload — another request holds the multipart
 * initialization lease; retry the create after `retryAfterSeconds`.
 */
export interface CreateUploadPendingData {
  uploadId?: string | null;
  retryAfterSeconds: number;
}

export type CreateUploadResult =
  | { kind: 'ready'; data: CreateUploadData }
  | { kind: 'pending'; data: CreateUploadPendingData };

/** `GET /videos/uploads/:id/upload` payload (§7.3). */
export interface UploadStateData {
  uploadId: string;
  uploadState: UploadState;
  partSizeBytes: number | null;
  partCount: number | null;
  completedParts: CompletedPart[];
  canRenewCapabilities: boolean;
}

/** `POST /videos/uploads/:id/upload-capabilities` request/response (§7.3). */
export interface UploadCapabilitiesBody {
  partNumbers: number[];
}

export interface UploadCapabilitiesData {
  capabilities: MultipartPartCapability[];
}

/** `PUT /videos/uploads/:id/completion` request/response (§7.4). */
export interface CompleteUploadBody {
  parts: Array<{ partNumber: number; etag: string | null }>;
}

export interface CompleteUploadData {
  uploadId: string;
  uploadState: UploadState;
  videoId?: number | null;
}

/** `PATCH /videos/uploads/:id` request body (§7.3). */
export interface PatchUploadBody {
  title?: string;
  description?: string | null;
  isPublic?: boolean;
  tags?: string[] | null;
  channelId?: number;
}

/** One row of `GET /videos/uploads?active=true` (§7.3). */
export interface ActiveUploadSummary {
  uploadId: string;
  clientAttemptId: string;
  channelId: number;
  title: string;
  originalFilename: string;
  declaredSizeBytes: number;
  uploadState: UploadState;
  videoId: number | null;
  videoStatus: UploadVideoStatus | null;
  errorCode: string | null;
  updatedAt: string;
}

export interface ActiveUploadsData {
  uploads: ActiveUploadSummary[];
}

/** The error half of the standard envelope (§9). */
export interface ApiErrorEnvelope {
  success?: false;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}
