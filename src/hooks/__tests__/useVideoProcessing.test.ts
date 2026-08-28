import { renderHook, waitFor } from '@testing-library/react';
import { useVideoProcessing } from '../useVideoProcessing';
import { getVideoProgressBatch } from '../../api/video';

jest.mock('../../api/video');
const mockedBatch = getVideoProgressBatch as jest.MockedFunction<typeof getVideoProgressBatch>;

const mockVisibilityState = (state: 'visible' | 'hidden') => {
  Object.defineProperty(document, 'visibilityState', {
    writable: true,
    configurable: true,
    value: state,
  });
};

describe('useVideoProcessing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVisibilityState('visible');
  });

  it('asks for every tracked video in a single batched request', async () => {
    mockedBatch.mockResolvedValue({
      success: true,
      data: {
        1: { videoId: 1, status: 'processing', renditions: [{ quality: '720p', state: 'running' }] },
        2: { videoId: 2, status: 'processed', renditions: [] },
      },
    });

    const { result } = renderHook(() => useVideoProcessing([1, 2]));

    await waitFor(() => expect(mockedBatch).toHaveBeenCalledTimes(1));
    expect(mockedBatch).toHaveBeenCalledWith([1, 2]);
    await waitFor(() => expect(result.current.processingVideos[2]?.status).toBe('processed'));
    expect(result.current.processingVideos[1]?.status).toBe('processing');
    expect(result.current.processingVideos[1]?.renditions).toEqual([
      { quality: '720p', state: 'running' },
    ]);
  });

  it('stops polling once every id has reached `processed`', async () => {
    mockedBatch.mockResolvedValue({
      success: true,
      data: { 1: { videoId: 1, status: 'processed', renditions: [] } },
    });

    renderHook(() => useVideoProcessing([1]));

    await waitFor(() => expect(mockedBatch).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(mockedBatch).toHaveBeenCalledTimes(1);
  });

  it('treats `failed` as terminal too', async () => {
    mockedBatch.mockResolvedValue({
      success: true,
      data: { 1: { videoId: 1, status: 'failed', renditions: [] } },
    });

    const { result } = renderHook(() => useVideoProcessing([1]));

    await waitFor(() => expect(result.current.processingVideos[1]?.status).toBe('failed'));
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(mockedBatch).toHaveBeenCalledTimes(1);
  });

  it('keeps polling while a video is still pending or processing', async () => {
    mockedBatch.mockResolvedValue({
      success: true,
      data: { 1: { videoId: 1, status: 'processing', renditions: [] } },
    });

    renderHook(() => useVideoProcessing([1]));

    await waitFor(() => expect(mockedBatch).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockedBatch.mock.calls.length).toBeGreaterThan(1), {
      timeout: 10_000,
    });
  }, 15_000);

  // The legacy single-video route still spells the terminal success value
  // `completed`; a row carrying it must not restart the poll.
  it('accepts `completed` as a legacy alias for `processed`', async () => {
    mockedBatch.mockResolvedValue({
      success: true,
      data: { 1: { videoId: 1, status: 'completed', renditions: [] } },
    });

    renderHook(() => useVideoProcessing([1]));

    await waitFor(() => expect(mockedBatch).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(mockedBatch).toHaveBeenCalledTimes(1);
  });

  it('makes no request when there is nothing to track', () => {
    renderHook(() => useVideoProcessing([]));
    expect(mockedBatch).not.toHaveBeenCalled();
  });

  it('keeps its state when a progress call fails', async () => {
    mockedBatch.mockRejectedValue(new Error('offline'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useVideoProcessing([1]));

    await waitFor(() => expect(mockedBatch).toHaveBeenCalled());
    expect(result.current.processingVideos).toEqual({});
    warn.mockRestore();
  });

  it('removes its visibility listener on unmount', () => {
    mockedBatch.mockResolvedValue({ success: true, data: {} });
    const addSpy = jest.spyOn(document, 'addEventListener');
    const removeSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useVideoProcessing([1]));
    expect(addSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('survives rapid videoId changes', async () => {
    mockedBatch.mockResolvedValue({ success: true, data: {} });

    const { rerender } = renderHook(({ videoIds }) => useVideoProcessing(videoIds), {
      initialProps: { videoIds: [1] },
    });

    for (let i = 2; i <= 10; i += 1) {
      rerender({ videoIds: [i] });
    }

    await waitFor(() => expect(mockedBatch).toHaveBeenCalled());
    expect(mockedBatch).toHaveBeenLastCalledWith([10]);
  });
});
