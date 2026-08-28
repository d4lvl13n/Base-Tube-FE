import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';
import api from '../index';

/** Counts attempts and always answers 429, so a replay is visible as a 2nd call. */
function alwaysRateLimited(): { adapter: AxiosAdapter; count: () => number } {
  let calls = 0;
  const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    calls += 1;
    const response: AxiosResponse = {
      data: {},
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
