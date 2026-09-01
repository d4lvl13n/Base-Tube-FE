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

  // Callers treat "asked about but absent from a successful answer" as
  // "deleted", so silently truncating at the contract limit of 50 ids ERASED
  // uploads 51+ from the queue during a processing backlog. The request is now
  // CHUNKED: several 50-id GETs whose row maps are merged.
  it('chunks past the 50-id contract limit and merges the row maps', async () => {
    const ids = Array.from({ length: 60 }, (_, index) => index + 1);
    mockedGet
      .mockResolvedValueOnce({
        data: { success: true, data: [{ videoId: 1, status: 'processing', renditions: [] }] },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: [{ videoId: 60, status: 'processed', renditions: [] }] },
      });

    const result = await getVideoProgressBatch(ids);

    expect(mockedGet).toHaveBeenCalledTimes(2);
    const first = String(mockedGet.mock.calls[0][1].params.ids).split(',');
    const second = String(mockedGet.mock.calls[1][1].params.ids).split(',');
    expect(first).toEqual(ids.slice(0, 50).map(String));
    expect(second).toEqual(ids.slice(50).map(String));

    // Rows from every chunk land in one merged map — nothing truncated.
    expect(result.success).toBe(true);
    expect(result.data['1']).toMatchObject({ videoId: 1, status: 'processing' });
    expect(result.data['60']).toMatchObject({ videoId: 60, status: 'processed' });
  });

  it('reports failure when any chunk answers success:false, keeping the rows it did get', async () => {
    const ids = Array.from({ length: 51 }, (_, index) => index + 1);
    mockedGet
      .mockResolvedValueOnce({
        data: { success: true, data: [{ videoId: 2, status: 'processed', renditions: [] }] },
      })
      .mockResolvedValueOnce({ data: { success: false, data: [] } });

    const result = await getVideoProgressBatch(ids);

    expect(result.success).toBe(false);
    expect(result.data['2']).toMatchObject({ videoId: 2, status: 'processed' });
  });
});
