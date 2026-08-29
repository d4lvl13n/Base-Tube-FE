import { AxiosAdapter, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { createBasetubeClient, DEFAULT_VIEW_TRACKING_CONFIG } from '../index';

/**
 * Captures outgoing requests and returns canned results, HONOURING
 * validateStatus — a custom axios adapter must reject a non-2xx itself, and one
 * that always resolved made every error-handling test here pass without ever
 * reaching the code it was meant to cover. Same shape as client.test.ts.
 */
function makeAdapter(
  handler: (
    config: InternalAxiosRequestConfig
  ) => { status: number; data?: unknown; headers?: Record<string, string> }
): { adapter: AxiosAdapter; requests: InternalAxiosRequestConfig[] } {
  const requests: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    requests.push(config);
    const result = handler(config);
    const response: AxiosResponse = {
      data: result.data,
      status: result.status,
      statusText: '',
      headers: result.headers ?? {},
      config,
    };
    if (result.status >= 200 && result.status < 300) return response;
    throw new AxiosError('mock error', String(result.status), config, {}, response);
  };
  return { adapter, requests };
}

describe('engagement', () => {
  it('lists comments with page/limit and returns the comments envelope', async () => {
    const { adapter, requests } = makeAdapter(() => ({
      status: 200,
      data: { comments: [{ id: 1, content: 'hi', createdAt: 'now' }], totalComments: 1, totalPages: 1, currentPage: 1 },
    }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });

    const res = await client.engagement.listComments(42, 2, 10);

    expect(requests[0].url).toBe('/api/v1/comments/video/42');
    expect(requests[0].params).toMatchObject({ page: 2, limit: 10 });
    expect(res.comments).toHaveLength(1);
    expect(res.totalComments).toBe(1);
  });

  it('posts a comment with video_id + content and unwraps data', async () => {
    const { adapter, requests } = makeAdapter(() => ({ status: 200, data: { success: true, data: { id: 9, content: 'gg', createdAt: 'now' } } }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });

    const created = await client.engagement.addComment(42, 'gg');

    expect(requests[0].url).toBe('/api/v1/comments');
    expect(JSON.parse(requests[0].data)).toMatchObject({ video_id: 42, content: 'gg' });
    expect(created).toMatchObject({ id: 9, content: 'gg' });
  });

  it('toggles a like at the correct URL', async () => {
    const { adapter, requests } = makeAdapter(() => ({ status: 200, data: { success: true, data: { isLiked: true, likesCount: 5 } } }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });

    const res = await client.engagement.toggleLike(7);

    expect(requests[0].url).toBe('/api/v1/likes/videos/7/toggle');
    expect(res.data.isLiked).toBe(true);
  });

  it('reads like status as a boolean', async () => {
    const { adapter } = makeAdapter(() => ({ status: 200, data: { success: true, data: { isLiked: false } } }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });

    await expect(client.engagement.likeStatus(7)).resolves.toBe(false);
  });

  it('subscribes to a channel by identifier', async () => {
    const { adapter, requests } = makeAdapter(() => ({ status: 200, data: { success: true } }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });

    await client.channels.subscribe('cool-creator');

    expect(requests[0].method).toBe('post');
    expect(requests[0].url).toBe('/api/v1/channels/cool-creator/subscribe');
  });
  // --- view tracking (analytics review F1) --------------------------------
  // `trackView` used to POST `{}`. `validateViewRequest` requires
  // `watchedDuration`, so every mobile view was a 400 the SDK swallowed and
  // mobile contributed zero views to every creator number.
  it('records a view with the watched duration and returns the viewId', async () => {
    const { adapter, requests } = makeAdapter(() => ({
      status: 200,
      data: { success: true, data: { viewId: 'view-1', beaconToken: 'tok' } },
    }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });

    const viewId = await client.engagement.recordView(42, 31.5);

    expect(requests[0].url).toBe('/api/v1/videos/42/views');
    expect(requests[0].method).toBe('post');
    expect(JSON.parse(requests[0].data)).toEqual({ watchedDuration: 31.5 });
    expect(viewId).toBe('view-1');
  });

  it('returns null rather than throwing when the backend declines a view', async () => {
    const { adapter } = makeAdapter(() => ({ status: 400, data: { success: false } }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });

    await expect(client.engagement.recordView(42, 31)).resolves.toBeNull();
  });

  it('patches an open view row with the running played time', async () => {
    const { adapter, requests } = makeAdapter(() => ({ status: 200, data: { success: true } }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });

    await client.engagement.updateView(42, 'view-1', 90);

    expect(requests[0].url).toBe('/api/v1/videos/42/views/view-1');
    expect(requests[0].method).toBe('patch');
    expect(JSON.parse(requests[0].data)).toEqual({ watchedDuration: 90 });
  });

  it('never throws out of updateView — tracking must not break playback', async () => {
    const { adapter } = makeAdapter(() => ({ status: 500 }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });

    await expect(client.engagement.updateView(42, 'view-1', 90)).resolves.toBeUndefined();
  });

  it('the deprecated trackView now sends a body the backend accepts', async () => {
    const { adapter, requests } = makeAdapter(() => ({ status: 200, data: { success: true, data: { viewId: 'v' } } }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });

    await client.engagement.trackView(42);

    expect(JSON.parse(requests[0].data)).toEqual({ watchedDuration: 30 });
  });
  // --- view config ---------------------------------------------------------
  // Each client hardcoding its own copy of the view rules means one server-side
  // change silently desynchronises every app — and the failure is invisible,
  // because views simply stop being accepted.
  it('reads the view config from the server', async () => {
    const config = {
      thresholds: { percentage: 42, seconds: 12 },
      updateInterval: 5_000,
    };
    const { adapter, requests } = makeAdapter(() => ({
      status: 200,
      data: { success: true, data: config },
    }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });

    await expect(client.engagement.viewConfig()).resolves.toEqual(config);
    expect(requests[0].url).toBe('/api/v1/config/view-config');
  });

  it('falls back to the documented defaults when the config call fails', async () => {
    const { adapter } = makeAdapter(() => ({ status: 500 }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });

    await expect(client.engagement.viewConfig()).resolves.toEqual(DEFAULT_VIEW_TRACKING_CONFIG);
  });

  it.each([
    ['an empty envelope', { success: true }],
    ['a null payload', { success: true, data: null }],
    ['a partial payload', { success: true, data: { updateInterval: 5_000 } }],
    ['thresholds of the wrong type', {
      success: true,
      data: { thresholds: { percentage: 'lots', seconds: 12 }, updateInterval: 5_000 },
    }],
    ['a missing interval', {
      success: true,
      data: { thresholds: { percentage: 30, seconds: 30 } },
    }],
    ['a bare array', { success: true, data: [] }],
  ])('treats %s as no config at all', async (_label, data) => {
    const { adapter } = makeAdapter(() => ({ status: 200, data }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });

    // Half a config is more dangerous than none: it would read as
    // `thresholds.percentage === undefined` and never fire.
    await expect(client.engagement.viewConfig()).resolves.toEqual(DEFAULT_VIEW_TRACKING_CONFIG);
  });

  // --- retryable vs verdict ------------------------------------------------
  it.each([400, 401, 403, 404, 422])(
    'treats %i as a verdict — the view was refused on its merits',
    async (status) => {
      const { adapter } = makeAdapter(() => ({ status }));
      const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });

      await expect(client.engagement.recordViewResult(42, 31)).resolves.toEqual({
        viewId: null,
        retryable: false,
        retryAfterMs: undefined,
      });
    }
  );

  it.each([408, 409, 425, 429])('treats %i as transient — worth asking again', async (status) => {
    const { adapter } = makeAdapter(() => ({ status }));
    // The transport's own 429 retry is off here so the outcome under test is
    // the classification, not the retry.
    const client = createBasetubeClient({
      baseUrl: 'https://api.test',
      adapter,
      maxRateLimitRetries: 0,
    });

    const outcome = await client.engagement.recordViewResult(42, 31);

    expect(outcome.viewId).toBeNull();
    expect(outcome.retryable).toBe(true);
  });

  it.each([500, 502, 503, 504])('treats %i as transient', async (status) => {
    const { adapter } = makeAdapter(() => ({ status }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });

    expect((await client.engagement.recordViewResult(42, 31)).retryable).toBe(true);
  });

  it('treats a network failure with no response as transient', async () => {
    const adapter = async () => {
      throw new Error('Network Error');
    };
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });

    expect((await client.engagement.recordViewResult(42, 31)).retryable).toBe(true);
  });

  it('reads Retry-After as delta-seconds', async () => {
    const { adapter } = makeAdapter(() => ({ status: 429, headers: { 'retry-after': '30' } }));
    const client = createBasetubeClient({
      baseUrl: 'https://api.test',
      adapter,
      maxRateLimitRetries: 0,
    });

    const outcome = await client.engagement.recordViewResult(42, 31);

    expect(outcome.retryable).toBe(true);
    expect(outcome.retryAfterMs).toBe(30_000);
  });

  it('reads Retry-After given as an HTTP date', async () => {
    const { adapter } = makeAdapter(() => ({
      status: 503,
      headers: { 'retry-after': new Date(Date.now() + 20_000).toUTCString() },
    }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });

    const outcome = await client.engagement.recordViewResult(42, 31);

    expect(outcome.retryAfterMs).toBeGreaterThan(15_000);
    expect(outcome.retryAfterMs).toBeLessThanOrEqual(20_000);
  });

  it('ignores a Retry-After in the past', async () => {
    const { adapter } = makeAdapter(() => ({
      status: 503,
      headers: { 'retry-after': new Date(Date.now() - 20_000).toUTCString() },
    }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });

    expect((await client.engagement.recordViewResult(42, 31)).retryAfterMs).toBeUndefined();
  });

  it('ignores a Retry-After it cannot make sense of', async () => {
    const { adapter } = makeAdapter(() => ({ status: 503 }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });

    expect((await client.engagement.recordViewResult(42, 31)).retryAfterMs).toBeUndefined();
  });
});
