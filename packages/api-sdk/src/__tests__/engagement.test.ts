import { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { createBasetubeClient } from '../index';

function makeAdapter(
  handler: (config: InternalAxiosRequestConfig) => { status: number; data?: unknown }
): { adapter: AxiosAdapter; requests: InternalAxiosRequestConfig[] } {
  const requests: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    requests.push(config);
    const result = handler(config);
    const response: AxiosResponse = {
      data: result.data,
      status: result.status,
      statusText: '',
      headers: {},
      config,
    };
    return response;
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
});
