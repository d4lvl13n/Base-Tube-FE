import { getChannelOverview, getChannelVideos } from '../channel';
import { getVideoById } from '../video';
import api from '../index';

jest.mock('../index', () => ({ __esModule: true, default: { get: jest.fn() } }));
const get = api.get as jest.Mock;
beforeEach(() => jest.clearAllMocks());

it('unwraps the additive overview envelope with the viewer fields and pagination intact', async () => {
  const data = { channel: { id: 7, isOwner: true, isSubscribed: false }, videos: [{ id: 1 }], pagination: { total: 20, page: 1, limit: 12, totalPages: 2 } };
  get.mockResolvedValue({ data: { success: true, data } });
  const signal = new AbortController().signal;
  await expect(getChannelOverview('creator.base', 12, signal)).resolves.toEqual(data);
  expect(get).toHaveBeenCalledWith('/api/v1/channels/creator.base/overview', { params: { limit: 12 }, signal });
});

it('preserves page size and cancellation for subsequent video pages', async () => {
  const response = { success: true, data: [{ id: 2 }], pagination: { total: 20, page: 2, limit: 12, totalPages: 2 } };
  get.mockResolvedValue({ data: response });
  const signal = new AbortController().signal;
  await expect(getChannelVideos(7, 2, { limit: 12 }, signal)).resolves.toEqual(response);
  expect(get).toHaveBeenCalledWith('/api/v1/channels/7/videos', expect.objectContaining({ params: expect.objectContaining({ page: 2, limit: 12 }), signal }));
});

it('propagates overview cancellation without starting another request', async () => {
  const error = new Error('cancelled');
  get.mockRejectedValue(error);
  await expect(getChannelOverview(7)).rejects.toBe(error);
  expect(get).toHaveBeenCalledTimes(1);
});

it('preserves the video detail contract and passes cancellation to the transport', async () => {
  const video = { id: 1, title: 'Video' };
  get.mockResolvedValue({ data: { success: true, data: video } });
  const signal = new AbortController().signal;
  await expect(getVideoById('1', signal)).resolves.toEqual(video);
  expect(get).toHaveBeenCalledWith('/api/v1/videos/1', { signal });
});
