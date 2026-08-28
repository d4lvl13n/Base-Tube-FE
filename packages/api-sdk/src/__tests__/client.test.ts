import { AxiosError, AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { createBasetubeClient } from '../index';

interface MockResult {
  status: number;
  data?: unknown;
  headers?: Record<string, string>;
}

/** Captures outgoing requests and returns canned results, honouring validateStatus. */
function makeAdapter(
  handler: (config: InternalAxiosRequestConfig) => MockResult
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

const authHeader = (config: InternalAxiosRequestConfig): string | undefined => {
  const h = config.headers as unknown as {
    Authorization?: string;
    get?: (name: string) => string | undefined;
  };
  return h.Authorization ?? h.get?.('Authorization');
};

describe('transport', () => {
  it('injects a bearer token from getToken', async () => {
    const { adapter, requests } = makeAdapter(() => ({
      status: 200,
      data: { success: true, data: { videos: [], total: 0, hasMore: false, timeFrame: 'week', sort: 'trending' } },
    }));
    const client = createBasetubeClient({
      baseUrl: 'https://api.test',
      getToken: () => 'tok_123',
      adapter,
    });

    await client.videos.getTrending({ limit: 5 });

    expect(authHeader(requests[0])).toBe('Bearer tok_123');
    expect(requests[0].params).toMatchObject({ limit: 5, page: 1, sort: 'trending' });
  });

  it('omits the Authorization header when no token is available', async () => {
    const { adapter, requests } = makeAdapter(() => ({ status: 200, data: { success: true, data: {} } }));
    const client = createBasetubeClient({
      baseUrl: 'https://api.test',
      getToken: () => null,
      adapter,
    });

    await client.profile.me().catch(() => undefined);

    expect(authHeader(requests[0])).toBeUndefined();
  });

  it('forwards withCredentials to the request config', async () => {
    const { adapter, requests } = makeAdapter(() => ({ status: 200, data: { success: true, data: [] } }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', withCredentials: true, adapter });

    await client.discovery.getFeed();

    expect(requests[0].withCredentials).toBe(true);
  });

  it('invokes onUnauthorized on a 401 response', async () => {
    const onUnauthorized = jest.fn();
    const { adapter } = makeAdapter(() => ({ status: 401, data: { success: false } }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', onUnauthorized, adapter });

    await expect(client.profile.me()).rejects.toBeInstanceOf(AxiosError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('retries once on 429 then resolves', async () => {
    jest.useFakeTimers();
    let calls = 0;
    const { adapter } = makeAdapter(() => {
      calls += 1;
      if (calls === 1) return { status: 429, headers: { 'retry-after': '1' }, data: {} };
      return { status: 200, data: { success: true, data: { id: 7, title: 'ok' } } };
    });
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });

    const promise = client.videos.getById(7);
    await jest.advanceTimersByTimeAsync(1000);
    const video = await promise;

    expect(calls).toBe(2);
    expect(video).toMatchObject({ id: 7, title: 'ok' });
    jest.useRealTimers();
  });

  // A FormData / Blob / File body is a stream axios has already handed to the
  // network stack; replaying the config re-sends the payload or sends nothing.
  it.each([
    ['FormData', () => new FormData()],
    ['Blob', () => new Blob(['x'])],
    ['File', () => new File(['x'], 'clip.mp4', { type: 'video/mp4' })],
  ])('never replays a 429 whose body is a %s', async (_label, makeBody) => {
    let calls = 0;
    const { adapter } = makeAdapter(() => {
      calls += 1;
      return { status: 429, headers: { 'retry-after': '1' }, data: {} };
    });
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });
    await expect(client.http.post('/api/v1/anything', makeBody())).rejects.toBeInstanceOf(
      AxiosError,
    );

    expect(calls).toBe(1);
  });

  // The upload queue owns admission backoff (`UPLOAD_ADMISSION_BUSY` +
  // Retry-After + single-file probing); a silent transport retry both hides
  // that signal and stacks a second retry on top of the queue's own.
  it('never auto-retries a 429 from the upload control plane', async () => {
    let calls = 0;
    const { adapter } = makeAdapter(() => {
      calls += 1;
      return { status: 429, headers: { 'retry-after': '1' }, data: {} };
    });
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });

    await expect(client.uploads.listActive()).rejects.toBeTruthy();

    expect(calls).toBe(1);
  });

  it('still retries a 429 for an ordinary JSON body', async () => {
    jest.useFakeTimers();
    let calls = 0;
    const { adapter } = makeAdapter(() => {
      calls += 1;
      if (calls === 1) return { status: 429, headers: { 'retry-after': '1' }, data: {} };
      return { status: 200, data: { success: true, data: { ok: true } } };
    });
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });
    const promise = client.http.post('/api/v1/anything', { a: 1 });
    await jest.advanceTimersByTimeAsync(1000);
    await promise;

    expect(calls).toBe(2);
    jest.useRealTimers();
  });
});

describe('response unwrapping', () => {
  it('unwraps `{ success, data }` for getById', async () => {
    const { adapter } = makeAdapter(() => ({ status: 200, data: { success: true, data: { id: 1, title: 'A' } } }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });
    await expect(client.videos.getById(1)).resolves.toMatchObject({ id: 1, title: 'A' });
  });

  it('reads featured videos from the nested videos array', async () => {
    const { adapter } = makeAdapter(() => ({
      status: 200,
      data: { success: true, data: { videos: [{ id: 1 }, { id: 2 }], rotation: {}, total: 2 } },
    }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });
    await expect(client.videos.getFeatured()).resolves.toHaveLength(2);
  });

  it('reads popular channels from the `data` key', async () => {
    const { adapter } = makeAdapter(() => ({ status: 200, data: { success: true, data: [{ id: 1 }], total: 1 } }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });
    const res = await client.channels.popular();
    expect(res.data).toHaveLength(1);
  });

  it('reads the channel list from the `channels` key (not `data`)', async () => {
    const { adapter } = makeAdapter(() => ({ status: 200, data: { success: true, channels: [{ id: 1 }], total: 1 } }));
    const client = createBasetubeClient({ baseUrl: 'https://api.test', adapter });
    const res = await client.channels.list();
    expect(res.channels).toHaveLength(1);
  });
});
