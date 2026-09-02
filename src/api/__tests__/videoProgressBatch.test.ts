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

  // A failing chunk must not short-circuit the batch: the chunks AFTER it are
  // still fetched and merged, and the overall verdict stays success:false so
  // callers do not read the (partial) map as a deletion verdict.
  it('keeps fetching and merging later chunks after a mid-batch success:false', async () => {
    const ids = Array.from({ length: 101 }, (_, index) => index + 1); // 3 chunks
    mockedGet
      .mockResolvedValueOnce({
        data: { success: true, data: [{ videoId: 1, status: 'processing', renditions: [] }] },
      })
      .mockResolvedValueOnce({ data: { success: false, data: [] } })
      .mockResolvedValueOnce({
        data: { success: true, data: [{ videoId: 101, status: 'processed', renditions: [] }] },
      });

    const result = await getVideoProgressBatch(ids);

    // The third chunk went out despite the second one degrading…
    expect(mockedGet).toHaveBeenCalledTimes(3);
    expect(String(mockedGet.mock.calls[2][1].params.ids).split(',')).toEqual(
      ids.slice(100).map(String),
    );
    // …its rows merged next to the first chunk's…
    expect(result.data['1']).toMatchObject({ videoId: 1, status: 'processing' });
    expect(result.data['101']).toMatchObject({ videoId: 101, status: 'processed' });
    // …and the one bad chunk still poisons the overall verdict.
    expect(result.success).toBe(false);
  });

  // STRICT TRUST: a chunk counts only when it is an explicit `success: true`
  // with an ARRAY payload. The old normalization turned any odd 200 into
  // "success with no rows", which the queue read as "every id deleted" and
  // erased processing uploads. Anything short of the contract now degrades the
  // verdict and contributes no rows.
  describe('strict chunk trust', () => {
    it.each<[string, unknown]>([
      ['success:true with no data', { success: true }],
      ['data array with no success flag', { data: [{ videoId: 3, status: 'processing', renditions: [] }] }],
      ['success:true with a non-array data (object)', { success: true, data: { videoId: 3 } }],
      ['success:true with a non-array data (string)', { success: true, data: 'oops' }],
      ['success:true with null data', { success: true, data: null }],
      ['success as a truthy non-boolean', { success: 'true', data: [] }],
      ['empty object body', {}],
      ['undefined body', undefined],
      ['null body', null],
      ['string body (HTML error page)', '<html>502</html>'],
    ])('marks the result success:false and yields no rows for %s', async (_label, body) => {
      mockedGet.mockResolvedValue({ data: body });

      const result = await getVideoProgressBatch([3]);

      expect(result.success).toBe(false);
      expect(result.data).toEqual({});
    });

    it('drops rows from an untrusted chunk while merging well-formed neighbours', async () => {
      const ids = Array.from({ length: 101 }, (_, index) => index + 1); // 3 chunks
      mockedGet
        .mockResolvedValueOnce({
          data: { success: true, data: [{ videoId: 1, status: 'processing', renditions: [] }] },
        })
        // No success flag: even though it carries a plausible row, it is not trusted.
        .mockResolvedValueOnce({
          data: { data: [{ videoId: 51, status: 'processing', renditions: [] }] },
        })
        .mockResolvedValueOnce({
          data: { success: true, data: [{ videoId: 101, status: 'processed', renditions: [] }] },
        });

      const result = await getVideoProgressBatch(ids);

      expect(mockedGet).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(false);
      expect(Object.keys(result.data).sort()).toEqual(['1', '101']);
      expect(result.data['51']).toBeUndefined();
    });

    it('keeps fetching later chunks after a malformed (non-object) chunk body', async () => {
      const ids = Array.from({ length: 51 }, (_, index) => index + 1); // 2 chunks
      mockedGet
        .mockResolvedValueOnce({ data: undefined })
        .mockResolvedValueOnce({
          data: { success: true, data: [{ videoId: 51, status: 'processed', renditions: [] }] },
        });

      const result = await getVideoProgressBatch(ids);

      expect(mockedGet).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(false);
      expect(result.data['51']).toMatchObject({ videoId: 51, status: 'processed' });
    });

    it('skips non-row entries inside a trusted array without poisoning the verdict', async () => {
      mockedGet.mockResolvedValue({
        data: {
          success: true,
          data: [null, 'junk', { status: 'processing' }, { videoId: '4' }, { videoId: 5, status: 'pending', renditions: [] }],
        },
      });

      const result = await getVideoProgressBatch([4, 5]);

      // The chunk honoured the contract; only its unusable entries are ignored.
      expect(result.success).toBe(true);
      expect(Object.keys(result.data)).toEqual(['5']);
    });
  });
});
