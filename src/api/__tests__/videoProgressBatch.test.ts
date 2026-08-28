import { getVideoProgressBatch } from '../video';
import api from '../index';

jest.mock('../index', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockedGet = (api as unknown as { get: jest.Mock }).get;

describe('getVideoProgressBatch', () => {
  beforeEach(() => jest.clearAllMocks());

  it('re-keys the backend ARRAY payload by videoId', async () => {
    mockedGet.mockResolvedValue({
      data: {
        success: true,
        data: [
          {
            videoId: 7,
            status: 'processing',
            renditions: [{ quality: '720p', state: 'running' }],
            progress: { percent: 42 },
          },
          { videoId: 9, status: 'processed', renditions: [], progress: null },
        ],
      },
    });

    const result = await getVideoProgressBatch([7, 9]);

    expect(mockedGet).toHaveBeenCalledWith('/api/v1/videos/progress', {
      params: { ids: '7,9' },
    });
    expect(result.data['7']).toMatchObject({ videoId: 7, status: 'processing' });
    expect(result.data['9']).toMatchObject({ videoId: 9, status: 'processed' });
  });

  it('omits ids the caller does not own rather than inventing rows', async () => {
    mockedGet.mockResolvedValue({
      data: { success: true, data: [{ videoId: 7, status: 'pending', renditions: [] }] },
    });

    const result = await getVideoProgressBatch([7, 8]);

    expect(Object.keys(result.data)).toEqual(['7']);
  });

  it('tolerates an empty array and never calls out for an empty id list', async () => {
    mockedGet.mockResolvedValue({ data: { success: true, data: [] } });
    await expect(getVideoProgressBatch([1])).resolves.toEqual({ success: true, data: {} });

    mockedGet.mockClear();
    await expect(getVideoProgressBatch([])).resolves.toEqual({ success: true, data: {} });
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('caps the request at the contract limit of 50 ids', async () => {
    mockedGet.mockResolvedValue({ data: { success: true, data: [] } });
    await getVideoProgressBatch(Array.from({ length: 60 }, (_, index) => index + 1));

    const sent = String(mockedGet.mock.calls[0][1].params.ids).split(',');
    expect(sent).toHaveLength(50);
  });
});
