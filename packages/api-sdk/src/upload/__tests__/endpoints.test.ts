import type { AxiosInstance } from 'axios';
import { createUploadApi, UploadApiError } from '../endpoints';

interface Recorded {
  method: string;
  url: string;
  body?: unknown;
  config?: unknown;
}

function httpStub(
  responder: (call: Recorded) => Promise<{ status: number; data: unknown; headers?: unknown }>,
): { http: AxiosInstance; calls: Recorded[] } {
  const calls: Recorded[] = [];
  const record = (method: string) => async (url: string, body?: unknown, config?: unknown) => {
    const call: Recorded = { method, url, body, config };
    calls.push(call);
    return responder(call);
  };
  const http = {
    get: async (url: string, config?: unknown) => {
      const call: Recorded = { method: 'get', url, config };
      calls.push(call);
      return responder(call);
    },
    delete: async (url: string, config?: unknown) => {
      const call: Recorded = { method: 'delete', url, config };
      calls.push(call);
      return responder(call);
    },
    post: record('post'),
    put: record('put'),
    patch: record('patch'),
  } as unknown as AxiosInstance;
  return { http, calls };
}

const axiosFailure = (status: number, data: unknown, headers: Record<string, string> = {}) =>
  Object.assign(new Error('Request failed'), {
    isAxiosError: true,
    response: { status, data, headers },
  });

describe('createUploadApi', () => {
  it('unwraps the success envelope', async () => {
    const { http, calls } = httpStub(async () => ({
      status: 200,
      data: {
        success: true,
        data: {
          uploadId: 'u1',
          uploadState: 'uploading',
          partSizeBytes: 100,
          partCount: 2,
          completedParts: [],
          canRenewCapabilities: true,
        },
      },
    }));
    const api = createUploadApi(http);

    await expect(api.getState('u1')).resolves.toMatchObject({ uploadId: 'u1', partCount: 2 });
    expect(calls[0]).toMatchObject({ method: 'get', url: '/api/v1/videos/uploads/u1/upload' });
  });

  it('reports a 202 create as pending with the lease delay', async () => {
    const { http } = httpStub(async () => ({
      status: 202,
      data: { success: true, data: { uploadId: 'u1', retryAfterSeconds: 2 } },
      headers: { 'retry-after': '2' },
    }));
    const api = createUploadApi(http);

    await expect(
      api.create({
        clientAttemptId: 'a1',
        channelId: 1,
        title: 't',
        filename: 'a.mp4',
        declaredContentType: 'video/mp4',
        declaredSizeBytes: 10,
      }),
    ).resolves.toMatchObject({ kind: 'pending', data: { retryAfterSeconds: 2 } });
  });

  it('turns the error envelope and Retry-After into an UploadApiError', async () => {
    const { http } = httpStub(async () => {
      throw axiosFailure(
        429,
        { success: false, error: { code: 'UPLOAD_ADMISSION_BUSY', message: 'Too many uploads' } },
        { 'retry-after': '5' },
      );
    });
    const api = createUploadApi(http);

    await expect(api.getState('u1')).rejects.toMatchObject({
      name: 'UploadApiError',
      status: 429,
      code: 'UPLOAD_ADMISSION_BUSY',
      retryAfterSeconds: 5,
      message: 'Too many uploads',
    });
  });

  it('falls back to details.retryAfterSeconds when the header is absent', async () => {
    const { http } = httpStub(async () => {
      throw axiosFailure(429, {
        success: false,
        error: { code: 'UPLOAD_ADMISSION_BUSY', message: 'busy', details: { retryAfterSeconds: 7 } },
      });
    });
    await expect(createUploadApi(http).getState('u1')).rejects.toMatchObject({
      retryAfterSeconds: 7,
    });
  });

  it('classifies a transport failure with no response as an unreachable API', async () => {
    const { http } = httpStub(async () => {
      throw new Error('Network Error');
    });
    await expect(createUploadApi(http).getState('u1')).rejects.toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
    });
  });

  it('rejects a body that is not the standard envelope', async () => {
    const { http } = httpStub(async () => ({ status: 200, data: { nope: true } }));
    await expect(createUploadApi(http).getState('u1')).rejects.toBeInstanceOf(UploadApiError);
  });

  it('asks for active uploads with the reconciliation flag', async () => {
    const { http, calls } = httpStub(async () => ({
      status: 200,
      data: { success: true, data: [] },
    }));
    await createUploadApi(http).listActive();
    expect(calls[0]).toMatchObject({
      method: 'get',
      url: '/api/v1/videos/uploads',
      config: { params: { active: true } },
    });
  });

  // The controller does `res.json({ success: true, data: uploads })` — the
  // payload IS the array, with no wrapping `uploads` key.
  it('returns the active-uploads ARRAY straight from the envelope', async () => {
    const summary = {
      uploadId: 'u1',
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
    };
    const { http } = httpStub(async () => ({
      status: 200,
      data: { success: true, data: [summary] },
    }));

    const uploads = await createUploadApi(http).listActive();

    expect(Array.isArray(uploads)).toBe(true);
    expect(uploads).toHaveLength(1);
    expect(uploads[0]).toMatchObject({ uploadId: 'u1', partCount: 3 });
    // The server does not echo `clientAttemptId`; reconciliation is by uploadId.
    expect(uploads[0]).not.toHaveProperty('clientAttemptId');
  });

  // The single-upload read is the only endpoint that reports an upload whose
  // video finished — `listActive` has dropped it by then.
  it('reads one upload from GET /videos/uploads/:id and unwraps the envelope', async () => {
    const { http, calls } = httpStub(async () => ({
      status: 200,
      data: {
        success: true,
        data: { uploadId: 'u1', uploadState: 'ready', videoId: 250, videoStatus: 'processed' },
      },
    }));

    const upload = await createUploadApi(http).get('u1');

    expect(calls[0]).toMatchObject({ method: 'get', url: '/api/v1/videos/uploads/u1' });
    expect(upload).toMatchObject({ uploadId: 'u1', videoId: 250, videoStatus: 'processed' });
  });

  it('refuses a single-upload payload without an uploadId', async () => {
    const { http } = httpStub(async () => ({ status: 200, data: { success: true, data: [] } }));
    await expect(createUploadApi(http).get('u1')).rejects.toMatchObject({
      name: 'UploadApiError',
      code: 'INVALID_RESPONSE',
    });
  });

  it('refuses a non-array active-uploads payload instead of reading it as empty', async () => {
    const { http } = httpStub(async () => ({
      status: 200,
      data: { success: true, data: { uploads: [] } },
    }));

    await expect(createUploadApi(http).listActive()).rejects.toMatchObject({
      name: 'UploadApiError',
      code: 'INVALID_RESPONSE',
    });
  });
});
