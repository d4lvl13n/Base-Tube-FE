import type {
  ActiveUploadSummary,
  CompletedPart,
  CreateUploadResult,
  MultipartPartCapability,
  UploadStateData,
} from '../contracts';
import type { UploadApi } from '../endpoints';
import type { UploadQueueEntry } from '../types';
import type { UploadTransferDependencies } from '../upload-transfer';

export function capability(partNumber: number, contentLength: number): MultipartPartCapability {
  return {
    partNumber,
    method: 'PUT',
    url: `https://intake.example/part/${partNumber}`,
    requiredHeaders: {},
    uaManagedSignedHeaders: { 'content-length': String(contentLength) },
  };
}

export function completedPart(partNumber: number, sizeBytes: number): CompletedPart {
  return { partNumber, etag: `etag-${partNumber}`, sizeBytes };
}

/** A `GET /videos/uploads?active=true` row, shaped like the backend's summary. */
export function activeSummary(
  overrides: Partial<ActiveUploadSummary> = {},
): ActiveUploadSummary {
  return {
    uploadId: 'upload-1',
    uploadState: 'uploading',
    channelId: 7,
    title: 'clip',
    description: null,
    isPublic: false,
    tags: null,
    originalFilename: 'clip.mp4',
    declaredSizeBytes: 300,
    partSizeBytes: 100,
    partCount: 3,
    videoId: null,
    videoStatus: null,
    errorCode: null,
    createdAt: '2026-08-28T10:00:00.000Z',
    updatedAt: '2026-08-28T10:00:00.000Z',
    ...overrides,
  };
}

/** A `File` stand-in: jsdom is not available in this package's node test env. */
export function fakeFile(size: number, name = 'clip.mp4'): File {
  return {
    name,
    size,
    type: 'video/mp4',
    lastModified: 1_700_000_000_000,
    slice: (start: number, end: number) => ({ size: (end ?? size) - (start ?? 0) }) as Blob,
  } as unknown as File;
}

export function queueEntry(overrides: Partial<UploadQueueEntry> = {}): UploadQueueEntry {
  const now = new Date('2026-08-28T10:00:00.000Z').toISOString();
  return {
    localId: 'local-1',
    clientAttemptId: 'attempt-1',
    uploadId: null,
    channelId: 7,
    title: 'clip',
    description: null,
    isPublic: false,
    tags: null,
    filename: 'clip.mp4',
    sizeBytes: 300,
    lastModified: 1_700_000_000_000,
    contentType: 'video/mp4',
    partSizeBytes: null,
    partCount: null,
    completedParts: [],
    status: 'queued',
    progress: 0,
    errorCode: null,
    errorMessage: null,
    retryAt: null,
    videoId: null,
    videoStatus: null,
    createdAt: now,
    updatedAt: now,
    file: null,
    ...overrides,
  };
}

export function uploadState(overrides: Partial<UploadStateData> = {}): UploadStateData {
  return {
    uploadId: 'upload-1',
    uploadState: 'uploading',
    partSizeBytes: 100,
    partCount: 3,
    completedParts: [],
    canRenewCapabilities: true,
    ...overrides,
  };
}

export interface StubApi extends UploadApi {
  calls: {
    create: unknown[];
    renew: number[][];
    complete: unknown[];
    getState: number;
  };
}

export function stubApi(overrides: Partial<UploadApi> = {}): StubApi {
  const calls = { create: [] as unknown[], renew: [] as number[][], complete: [] as unknown[], getState: 0 };
  const api: StubApi = {
    calls,
    async create(body): Promise<CreateUploadResult> {
      calls.create.push(body);
      return {
        kind: 'ready',
        data: {
          uploadId: 'upload-1',
          partSizeBytes: 100,
          partCount: 3,
          capabilities: [],
          expiresAt: '2026-08-28T11:00:00.000Z',
        },
      };
    },
    async getState() {
      calls.getState += 1;
      return uploadState();
    },
    async renewCapabilities(_uploadId, partNumbers) {
      calls.renew.push([...partNumbers]);
      return { capabilities: partNumbers.map((n) => capability(n, 100)) };
    },
    async complete(_uploadId, body) {
      calls.complete.push(body);
      return { uploadId: 'upload-1', uploadState: 'processing', videoId: 42 };
    },
    async abort() {},
    async patch() {},
    async listActive() {
      return [];
    },
    ...overrides,
  } as StubApi;
  api.calls = calls;
  return api;
}

export function dependencies(
  api: UploadApi,
  putBlob: UploadTransferDependencies['putBlob'],
  sleep: UploadTransferDependencies['sleep'] = async () => {},
): UploadTransferDependencies {
  return { api, putBlob, sleep };
}
