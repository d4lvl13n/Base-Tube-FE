/**
 * The creator-draft routes (`base-be/docs/CREATOR_DRAFTS_API.md`) over the SDK axios instance.
 *
 * Failures become the same `UploadApiError` the Upload V2 routes raise — one
 * error type carrying status, machine code and `Retry-After` — so the web
 * workspace and the transfer engine reason about both with one classifier.
 *
 * Every success payload is checked before it is returned. A payload the client
 * does not understand is an `INVALID_RESPONSE` (502), never a silently empty
 * draft: treating an unknown answer as "nothing saved" would drop edits.
 */
import type { AxiosInstance } from 'axios';
import type {
  CreateUploadData,
  CreateUploadPendingData,
  CreateUploadResult,
  UploadState,
  UploadVideoStatus,
} from '../upload/contracts';
import { UploadApiError, toUploadApiError } from '../upload/endpoints';
import type {
  CreateDraftBody,
  CreateDraftResult,
  CreateDraftUploadBody,
  CreatorDraftView,
  DeleteDraftResult,
  DraftPreviewData,
  DraftPublicationBody,
  DraftRecoveryAction,
  DraftThumbnailAsset,
  ListDraftsParams,
  ListDraftsResult,
  PatchDraftBody,
  RetryDraftProcessingBody,
  SelectDraftThumbnailBody,
  TemporaryMedia,
} from './contracts';

const BASE = '/api/v1/creator-drafts';

const RECOVERY_ACTIONS: readonly DraftRecoveryAction[] = [
  'none',
  'wait',
  'reselect_file',
  'retry_processing',
  'replace_file',
  'contact_support',
];

function invalid(what: string): UploadApiError {
  return new UploadApiError(`The server returned an unexpected ${what} response`, 502, 'INVALID_RESPONSE', null);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function unwrap(body: unknown, what: string): unknown {
  if (!isRecord(body) || body.data === undefined) throw invalid(what);
  return body.data;
}

function nullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function nullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function stringList(value: unknown): value is string[] | null {
  return value === null || (Array.isArray(value) && value.every((item) => typeof item === 'string'));
}

/**
 * Validates one `CreatorDraftView`. Exported so a caller holding a payload of
 * unknown origin (an error `details`, a cached copy) can check it the same way.
 */
export function parseCreatorDraftView(value: unknown): CreatorDraftView {
  if (!isRecord(value)) throw invalid('draft');
  const thumbnail = value.thumbnail;
  const recovery = value.recovery;
  const valid =
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.revision === 'number' &&
    Number.isInteger(value.revision) &&
    typeof value.channelId === 'number' &&
    typeof value.title === 'string' &&
    nullableString(value.description) &&
    stringList(value.tags) &&
    (value.publicationState === 'draft' || value.publicationState === 'published') &&
    nullableString(value.uploadId) &&
    nullableNumber(value.videoId) &&
    nullableString(value.uploadState) &&
    nullableString(value.videoStatus) &&
    typeof value.transferConfirmed === 'boolean' &&
    typeof value.playbackReady === 'boolean' &&
    isRecord(thumbnail) &&
    nullableString(thumbnail.assetId) &&
    (thumbnail.source === 'automatic' || thumbnail.source === 'custom') &&
    typeof thumbnail.ready === 'boolean' &&
    typeof value.canPublish === 'boolean' &&
    stringList(value.publishBlockers) &&
    value.publishBlockers !== null &&
    isRecord(recovery) &&
    RECOVERY_ACTIONS.includes(recovery.action as DraftRecoveryAction) &&
    nullableString(recovery.code) &&
    nullableNumber(recovery.retryAfterSeconds) &&
    typeof value.updatedAt === 'string';
  if (!valid) throw invalid('draft');
  return {
    id: value.id as string,
    revision: value.revision as number,
    channelId: value.channelId as number,
    title: value.title as string,
    description: value.description as string | null,
    tags: value.tags as string[] | null,
    publicationState: value.publicationState as CreatorDraftView['publicationState'],
    uploadId: value.uploadId as string | null,
    videoId: value.videoId as number | null,
    uploadState: value.uploadState as UploadState | null,
    videoStatus: value.videoStatus as UploadVideoStatus | null,
    transferConfirmed: value.transferConfirmed as boolean,
    playbackReady: value.playbackReady as boolean,
    thumbnail: {
      assetId: (thumbnail as Record<string, unknown>).assetId as string | null,
      source: (thumbnail as Record<string, unknown>).source as 'automatic' | 'custom',
      ready: (thumbnail as Record<string, unknown>).ready as boolean,
    },
    canPublish: value.canPublish as boolean,
    publishBlockers: [...(value.publishBlockers as string[])],
    recovery: {
      action: (recovery as Record<string, unknown>).action as DraftRecoveryAction,
      code: (recovery as Record<string, unknown>).code as string | null,
      retryAfterSeconds: (recovery as Record<string, unknown>).retryAfterSeconds as number | null,
    },
    updatedAt: value.updatedAt as string,
  };
}

function headerRetryAfter(headers: unknown): number | null {
  if (!isRecord(headers)) return null;
  const raw = headers['retry-after'] ?? headers['Retry-After'];
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
  const text = String(raw).trim();
  return /^\d+$/u.test(text) ? Number(text) : null;
}

function parseTemporaryMedia(value: unknown): TemporaryMedia | null {
  if (value === null || value === undefined) return null;
  if (!isRecord(value) || typeof value.url !== 'string' || typeof value.expiresAt !== 'string') {
    throw invalid('preview');
  }
  return { url: value.url, expiresAt: value.expiresAt };
}

/**
 * `AttachDraftUploadResult` → the Upload V2 `CreateUploadResult` the transfer
 * engine already understands:
 *   - 202 `PendingDraftUploadInitialization` → `pending` (retry after `Retry-After`);
 *   - 201 / 200 `InitializedDraftUpload` → `ready` with its capabilities;
 *   - 200 `DraftUploadSummary` (replay of a sealed or terminal attempt) → `ready`
 *     with no capabilities: the engine reads `/videos/uploads/:id/upload` next
 *     and reaches the attempt's real state from there.
 */
function parseAttachResult(status: number, headers: unknown, body: unknown): CreateUploadResult {
  const data = unwrap(body, 'draft upload');
  if (!isRecord(data) || typeof data.uploadId !== 'string') throw invalid('draft upload');
  if (status === 202) {
    const pending = data as Partial<CreateUploadPendingData>;
    return {
      kind: 'pending',
      data: {
        uploadId: data.uploadId,
        retryAfterSeconds:
          typeof pending.retryAfterSeconds === 'number'
            ? pending.retryAfterSeconds
            : (headerRetryAfter(headers) ?? 2),
      },
    };
  }
  if (typeof data.partSizeBytes !== 'number' || typeof data.partCount !== 'number') {
    throw invalid('draft upload');
  }
  const ready: CreateUploadData = {
    uploadId: data.uploadId,
    partSizeBytes: data.partSizeBytes,
    partCount: data.partCount,
    capabilities: Array.isArray(data.capabilities) ? (data.capabilities as CreateUploadData['capabilities']) : [],
    expiresAt: typeof data.expiresAt === 'string' ? data.expiresAt : '',
    resumeExpiresAt: typeof data.resumeExpiresAt === 'string' ? data.resumeExpiresAt : null,
    resumeExpiresAtEstimated: data.resumeExpiresAtEstimated === true,
  };
  return { kind: 'ready', data: ready };
}

export interface CreatorDraftsApi {
  create: (body: CreateDraftBody) => Promise<CreateDraftResult>;
  list: (params?: ListDraftsParams) => Promise<ListDraftsResult>;
  get: (draftId: string) => Promise<CreatorDraftView>;
  /** Resolves with the projection AFTER commit; a revision mismatch is 409 `DRAFT_REVISION_CONFLICT`. */
  patch: (draftId: string, body: PatchDraftBody) => Promise<CreatorDraftView>;
  /** Attaches a transfer attempt; the transfer then runs on `/api/v1/videos/uploads/:id`. */
  createUpload: (draftId: string, body: CreateDraftUploadBody) => Promise<CreateUploadResult>;
  /** Stores an image as a draft asset (201). It is NOT selected; `selectThumbnail` does that. */
  uploadThumbnailAsset: (
    draftId: string,
    input: { clientAssetId: string; file: Blob; filename: string },
  ) => Promise<DraftThumbnailAsset>;
  selectThumbnail: (draftId: string, body: SelectDraftThumbnailBody) => Promise<CreatorDraftView>;
  setPublication: (draftId: string, body: DraftPublicationBody) => Promise<CreatorDraftView>;
  /**
   * Inspection retry (202) — only when `recovery.action=retry_processing` and
   * `videoId` is null. With a `videoId`, the existing `POST /videos/retry/:videoId` applies.
   */
  retryProcessing: (draftId: string, body: RetryDraftProcessingBody) => Promise<CreatorDraftView>;
  /** Owner-only URLs that expire after five minutes. */
  getPreview: (draftId: string) => Promise<DraftPreviewData>;
  /** 202: a durable tombstone is committed; cleanup is asynchronous. */
  remove: (draftId: string, revision: number) => Promise<DeleteDraftResult>;
}

export function createCreatorDraftsApi(http: AxiosInstance): CreatorDraftsApi {
  const draftPath = (draftId: string) => `${BASE}/${encodeURIComponent(draftId)}`;

  const request = async <T>(
    send: () => Promise<{ status: number; data: unknown; headers?: unknown }>,
    read: (response: { status: number; data: unknown; headers?: unknown }) => T,
  ): Promise<T> => {
    let response: { status: number; data: unknown; headers?: unknown };
    try {
      response = await send();
    } catch (error) {
      throw toUploadApiError(error);
    }
    return read(response);
  };

  const view = (what: string) => (response: { data: unknown }) =>
    parseCreatorDraftView(unwrap(response.data, what));

  return {
    create(body) {
      return request(
        () => http.post(BASE, body),
        (response) => ({
          created: response.status === 201,
          draft: parseCreatorDraftView(unwrap(response.data, 'draft creation')),
        }),
      );
    },

    list(params = {}) {
      const query: Record<string, string | number> = {};
      if (params.channelId !== undefined) query.channelId = params.channelId;
      if (params.state) query.state = params.state;
      if (params.cursor) query.cursor = params.cursor;
      if (params.limit !== undefined) query.limit = Math.min(Math.max(1, params.limit), 50);
      return request(
        () => http.get(BASE, { params: query }),
        (response) => {
          const data = unwrap(response.data, 'draft list');
          if (!isRecord(data) || !Array.isArray(data.items) || !nullableString(data.nextCursor ?? null)) {
            throw invalid('draft list');
          }
          return {
            items: data.items.map(parseCreatorDraftView),
            nextCursor: (data.nextCursor as string | null | undefined) ?? null,
          };
        },
      );
    },

    get(draftId) {
      return request(() => http.get(draftPath(draftId)), view('draft'));
    },

    patch(draftId, body) {
      return request(() => http.patch(draftPath(draftId), body), view('draft save'));
    },

    createUpload(draftId, body) {
      return request(
        () => http.post(`${draftPath(draftId)}/uploads`, body),
        (response) => parseAttachResult(response.status, response.headers, response.data),
      );
    },

    uploadThumbnailAsset(draftId, { clientAssetId, file, filename }) {
      const form = new FormData();
      form.append('clientAssetId', clientAssetId);
      form.append('file', file, filename);
      return request(
        () =>
          http.post(`${draftPath(draftId)}/thumbnail-assets`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          }),
        (response) => {
          const data = unwrap(response.data, 'thumbnail');
          if (
            !isRecord(data) ||
            typeof data.id !== 'string' ||
            typeof data.assetId !== 'string' ||
            data.assetId.length === 0 ||
            typeof data.sizeBytes !== 'number'
          ) {
            throw invalid('thumbnail');
          }
          return {
            id: data.id,
            assetId: data.assetId,
            state: 'ready',
            sizeBytes: data.sizeBytes,
            mimeType: 'image/jpeg',
          };
        },
      );
    },

    selectThumbnail(draftId, body) {
      return request(() => http.put(`${draftPath(draftId)}/thumbnail`, body), view('thumbnail selection'));
    },

    setPublication(draftId, body) {
      return request(() => http.post(`${draftPath(draftId)}/publication`, body), view('publication'));
    },

    retryProcessing(draftId, body) {
      return request(() => http.post(`${draftPath(draftId)}/retry-processing`, body), view('processing retry'));
    },

    getPreview(draftId) {
      return request(
        () => http.get(`${draftPath(draftId)}/preview`),
        (response) => {
          const data = unwrap(response.data, 'preview');
          if (!isRecord(data)) throw invalid('preview');
          const assets = Array.isArray(data.assets) ? data.assets : [];
          return {
            thumbnail: parseTemporaryMedia(data.thumbnail),
            playback: parseTemporaryMedia(data.playback),
            assets: assets.map((asset) => {
              const media = parseTemporaryMedia(asset);
              if (!media || !isRecord(asset) || typeof asset.id !== 'string' || typeof asset.assetId !== 'string') {
                throw invalid('preview');
              }
              return { ...media, id: asset.id, assetId: asset.assetId };
            }),
          };
        },
      );
    },

    remove(draftId, revision) {
      return request(
        () => http.delete(draftPath(draftId), { headers: { 'If-Match': String(revision) } }),
        (response) => {
          const data = unwrap(response.data, 'draft deletion');
          if (!isRecord(data) || data.deleted !== true || typeof data.id !== 'string') {
            throw invalid('draft deletion');
          }
          return {
            id: data.id,
            deleted: true,
            revision: typeof data.revision === 'number' ? data.revision : revision,
          };
        },
      );
    },
  };
}
