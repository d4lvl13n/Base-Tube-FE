import { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { createBasetubeClient } from '../index';

it('reads a channel and first video page in one additive request, encoding the identifier', async () => {
  const requests: InternalAxiosRequestConfig[] = [];
  const payload = { success: true, data: { channel: { id: 7, handle: 'creator.base', isOwner: false, isSubscribed: true }, videos: [{ id: 9, title: 'First video' }], pagination: { total: 15, page: 1, limit: 12, totalPages: 2 } } };
  const adapter: AxiosAdapter = async config => {
    requests.push(config);
    return { data: payload, status: 200, statusText: 'OK', headers: {}, config };
  };
  const client = createBasetubeClient({ baseUrl: 'https://example.test', getToken: () => 'viewer-token', adapter });
  expect(await client.channels.overview('creator.base')).toEqual(payload);
  expect(requests).toHaveLength(1);
  expect(requests[0].url).toBe('/api/v1/channels/creator.base/overview');
  expect(requests[0].params).toEqual({ limit: 12 });
  expect(requests[0].headers.get('Authorization')).toBe('Bearer viewer-token');
  await client.channels.overview('path/with space', 24);
  expect(requests[1].url).toBe('/api/v1/channels/path%2Fwith%20space/overview');
  expect(requests[1].params).toEqual({ limit: 24 });
});
