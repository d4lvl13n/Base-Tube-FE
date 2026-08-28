/**
 * The Upload V2 control-plane routes (contract §9) over the SDK axios instance.
 *
 * Everything here speaks the standard envelope and converts failures into a
 * single `UploadApiError` carrying the machine-readable code and the server's
 * `Retry-After`, which is what the transfer's failure classifier reasons about.
 */
import type { AxiosInstance } from 'axios';
import type {
  ActiveUploadsData,
  ApiErrorEnvelope,
  CompleteUploadBody,
  CompleteUploadData,
  CreateUploadBody,
  CreateUploadData,
  CreateUploadPendingData,
  CreateUploadResult,
  PatchUploadBody,
  UploadCapabilitiesData,
  UploadStateData,
} from './contracts';

const BASE = '/api/v1/videos/uploads';

export class UploadApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly retryAfterSeconds: number | null,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'UploadApiError';
  }
}

interface AxiosLikeError {
  isAxiosError?: boolean;
  message?: string;
  response?: {
    status: number;
    data?: unknown;
    headers?: Record<string, unknown>;
  };
}

function headerRetryAfter(headers: Record<string, unknown> | undefined): number | null {
  const raw = headers?.['retry-after'] ?? headers?.['Retry-After'];
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
  const text = String(raw).trim();
  return /^\d+$/u.test(text) ? Number(text) : null;
}

function bodyRetryAfter(details: unknown): number | null {
  if (details && typeof details === 'object' && 'retryAfterSeconds' in details) {
    const value = (details as { retryAfterSeconds?: unknown }).retryAfterSeconds;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return null;
}

/** Normalises anything thrown by axios into an `UploadApiError`. */
export function toUploadApiError(error: unknown): UploadApiError {
  if (error instanceof UploadApiError) return error;

  const candidate = error as AxiosLikeError | null;
  const response = candidate?.response;
  if (!response) {
    // No response at all: DNS, offline, CORS preflight. Treated as retryable
    // by the classifier because 5xx-like conditions usually clear on their own.
    return new UploadApiError(
      candidate?.message ?? 'The upload service is unreachable',
      0,
      'NETWORK_ERROR',
      null,
    );
  }

  const envelope = (response.data ?? {}) as ApiErrorEnvelope;
  const code = envelope.error?.code ?? 'REQUEST_FAILED';
  const message = envelope.error?.message ?? `Request failed (${response.status})`;
  const retryAfter = headerRetryAfter(response.headers) ?? bodyRetryAfter(envelope.error?.details);
  return new UploadApiError(message, response.status, code, retryAfter, envelope.error?.details);
}

interface Envelope<T> {
  success?: boolean;
  data?: T;
}

function unwrap<T>(body: unknown): T {
  const envelope = body as Envelope<T> | null;
  if (!envelope || typeof envelope !== 'object' || envelope.data === undefined) {
    throw new UploadApiError('The server returned an unexpected response', 502, 'INVALID_RESPONSE', null);
  }
  return envelope.data;
}

export interface UploadApi {
  create: (body: CreateUploadBody) => Promise<CreateUploadResult>;
  getState: (uploadId: string) => Promise<UploadStateData>;
  renewCapabilities: (uploadId: string, partNumbers: number[]) => Promise<UploadCapabilitiesData>;
  complete: (uploadId: string, body: CompleteUploadBody) => Promise<CompleteUploadData>;
  abort: (uploadId: string) => Promise<void>;
  patch: (uploadId: string, body: PatchUploadBody) => Promise<void>;
  listActive: () => Promise<ActiveUploadsData>;
}

export function createUploadApi(http: AxiosInstance): UploadApi {
  const call = async <T>(fn: () => Promise<{ status: number; data: unknown }>): Promise<{
    status: number;
    data: T;
  }> => {
    try {
      const response = await fn();
      return { status: response.status, data: unwrap<T>(response.data) };
    } catch (error) {
      throw toUploadApiError(error);
    }
  };

  return {
    async create(body) {
      try {
        const response = await http.post(BASE, body);
        // 202 means another request holds the initialization lease (§7.2);
        // the caller sleeps and asks again with the same clientAttemptId.
        if (response.status === 202) {
          const pending = unwrap<CreateUploadPendingData>(response.data);
          return {
            kind: 'pending',
            data: {
              uploadId: pending.uploadId ?? null,
              retryAfterSeconds:
                pending.retryAfterSeconds ??
                headerRetryAfter(response.headers as Record<string, unknown>) ??
                2,
            },
          };
        }
        return { kind: 'ready', data: unwrap<CreateUploadData>(response.data) };
      } catch (error) {
        throw toUploadApiError(error);
      }
    },

    async getState(uploadId) {
      const { data } = await call<UploadStateData>(() => http.get(`${BASE}/${uploadId}/upload`));
      return data;
    },

    async renewCapabilities(uploadId, partNumbers) {
      const { data } = await call<UploadCapabilitiesData>(() =>
        http.post(`${BASE}/${uploadId}/upload-capabilities`, { partNumbers }),
      );
      return data;
    },

    async complete(uploadId, body) {
      const { data } = await call<CompleteUploadData>(() =>
        http.put(`${BASE}/${uploadId}/completion`, body),
      );
      return data;
    },

    async abort(uploadId) {
      try {
        await http.delete(`${BASE}/${uploadId}`);
      } catch (error) {
        throw toUploadApiError(error);
      }
    },

    async patch(uploadId, body) {
      try {
        await http.patch(`${BASE}/${uploadId}`, body);
      } catch (error) {
        throw toUploadApiError(error);
      }
    },

    async listActive() {
      const { data } = await call<ActiveUploadsData>(() => http.get(BASE, { params: { active: true } }));
      return data;
    },
  };
}
