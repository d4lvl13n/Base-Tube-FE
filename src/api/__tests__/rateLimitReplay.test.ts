import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';
import api from '../index';

/** Counts attempts and always answers 429, so a replay is visible as a 2nd call. */
function alwaysRateLimited(data: unknown = {}): { adapter: AxiosAdapter; count: () => number } {
  let calls = 0;
  const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    calls += 1;
    const response: AxiosResponse = {
      data,
      status: 429,
      statusText: 'Too Many Requests',
      headers: { 'retry-after': '1' } as never,
      config,
    };
    throw new AxiosError('rate limited', '429', config, {}, response);
  };
  return { adapter, count: () => calls };
}

describe('429 replay guard', () => {
  const original = api.defaults.adapter;

  afterEach(() => {
    api.defaults.adapter = original;
  });

  // A one-shot stream body cannot be replayed: axios has already consumed it,
  // so a retry either re-sends the whole payload or sends nothing at all.
  it.each([
    ['FormData', () => new FormData()],
    ['Blob', () => new Blob(['x'])],
    ['File', () => new File(['x'], 'clip.mp4', { type: 'video/mp4' })],
  ])('does not replay a 429 for a %s body', async (_label, makeBody) => {
    const { adapter, count } = alwaysRateLimited();
    api.defaults.adapter = adapter;

    await expect(
      api.post('/api/v1/videos/1', makeBody(), {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    ).rejects.toBeInstanceOf(AxiosError);

    expect(count()).toBe(1);
  });

  it('still replays a 429 for a plain JSON body', async () => {
    const { adapter, count } = alwaysRateLimited();
    api.defaults.adapter = adapter;

    await expect(api.post('/api/v1/anything', { a: 1 })).rejects.toBeInstanceOf(AxiosError);

    expect(count()).toBe(2);
  }, 10_000);
});

describe('limited Studio routes', () => {
  const original = api.defaults.adapter;
  afterEach(() => {
    api.defaults.adapter = original;
  });

  // Counted per account over ten minutes: a replay after a few seconds is refused
  // again, and the page tells the creator how long to wait instead.
  it.each([
    ['get', '/api/v1/thumbnail-studio/versions/v1/export'],
    ['post', '/api/v1/thumbnail-studio/exports'],
    ['post', '/api/v1/thumbnail-studio/projects/p1/youtube-source'],
    ['post', '/api/v1/thumbnail-studio/assets/from-thumbnail'],
    ['post', '/api/v1/thumbnail-studio/profiles/legacy-import'],
  ])('does not replay a 429 for %s %s', async (method, url) => {
    const { adapter, count } = alwaysRateLimited();
    api.defaults.adapter = adapter;

    await expect(api.request({ method, url, data: method === 'post' ? { a: 1 } : undefined })).rejects.toBeInstanceOf(AxiosError);

    expect(count()).toBe(1);
  });
});

describe('spent daily allowances', () => {
  const original = api.defaults.adapter;
  afterEach(() => {
    api.defaults.adapter = original;
  });

  // Waiting a few seconds cannot bring back today's free audits or a quota.
  it.each(['ANONYMOUS_AUDIT_CAPACITY', 'ANONYMOUS_AUDIT_QUOTA_EXCEEDED', 'QUOTA_EXCEEDED'])('does not replay a 429 %s', async code => {
    const { adapter, count } = alwaysRateLimited({ success: false, error: { code, message: 'Refused' } });
    api.defaults.adapter = adapter;

    await expect(api.post('/api/v1/ctr/audit', { imageUrl: 'https://example.com/a.png' })).rejects.toBeInstanceOf(AxiosError);

    expect(count()).toBe(1);
  });
});
