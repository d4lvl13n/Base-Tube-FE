import { act, renderHook, waitFor } from '@testing-library/react';
import { useViewTracking } from '../useViewTracking';
import { initializeVideoView, sendViewBeacon, updateVideoView } from '../../api/video';
import { DEFAULT_VIEW_CONFIG } from '../../types/config';

jest.mock('../../api/video', () => ({
  initializeVideoView: jest.fn(),
  updateVideoView: jest.fn(),
  sendViewBeacon: jest.fn(),
}));

const mockConfig = { viewConfig: DEFAULT_VIEW_CONFIG };
jest.mock('../../contexts/ConfigContext', () => ({
  useConfig: () => mockConfig,
}));

const initView = initializeVideoView as jest.MockedFunction<typeof initializeVideoView>;
const updateView = updateVideoView as jest.MockedFunction<typeof updateVideoView>;
const beacon = sendViewBeacon as jest.MockedFunction<typeof sendViewBeacon>;

const VIDEO_DURATION = 600;

/** Feed `timeupdate`s at 0.25 s cadence, as a real player does. */
const play = (
  result: { current: ReturnType<typeof useViewTracking> },
  fromSeconds: number,
  toSeconds: number
) => {
  act(() => {
    for (let t = fromSeconds + 0.25; t <= toSeconds + 1e-9; t += 0.25) {
      result.current.updateWatchedDuration(Number(t.toFixed(3)));
    }
  });
};

const render = () =>
  renderHook(() => useViewTracking({ videoId: '42', videoDuration: VIDEO_DURATION }));

/** Let the pending `initializeVideoView` promise settle so the viewId lands. */
const settle = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

beforeEach(() => {
  jest.useFakeTimers();
  initView.mockReset();
  updateView.mockReset();
  beacon.mockReset();
  initView.mockResolvedValue({
    success: true,
    message: 'ok',
    data: { viewId: 'view-1', beaconToken: 'tok-1' },
  } as any);
  updateView.mockResolvedValue({ success: true, message: 'ok' } as any);
  beacon.mockReturnValue(true);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('watched duration is time actually played', () => {
  it('accumulates deltas while playing', async () => {
    const { result } = render();
    act(() => result.current.startTracking());

    play(result, 0, 10);

    // The very first `timeupdate` has no predecessor to diff against, so one
    // 0.25 s tick is never counted. That is the honest direction to err in.
    expect(result.current.getPlayedSeconds()).toBeCloseTo(10, 0);
  });

  it('ignores a forward seek — scrubbing to the end is not a watch', async () => {
    const { result } = render();
    act(() => result.current.startTracking());

    play(result, 0, 5);
    // Drag the scrubber to the last second of a 10-minute video.
    act(() => result.current.updateWatchedDuration(599, true));
    act(() => result.current.updateWatchedDuration(599.25));

    // 5 s of real playback plus one honest 0.25 s tick — not 599.
    expect(result.current.getPlayedSeconds()).toBeLessThan(6);
  });

  it('ignores a rewind and does not double-count the replayed stretch beyond real time', () => {
    const { result } = render();
    act(() => result.current.startTracking());

    play(result, 0, 10);
    act(() => result.current.updateWatchedDuration(2, true));
    play(result, 2, 5);

    // 10 s watched + 3 s re-watched = 13 s of playback, not 5 (position) and
    // not 10 (furthest reached).
    expect(result.current.getPlayedSeconds()).toBeCloseTo(13, 0);
  });

  it('caps an oversized tick (stall / backgrounded tab catching up)', () => {
    const { result } = render();
    act(() => result.current.startTracking());

    act(() => {
      result.current.updateWatchedDuration(0);
      result.current.updateWatchedDuration(120); // 2-minute jump in one event
    });

    expect(result.current.getPlayedSeconds()).toBeLessThanOrEqual(1.5);
  });

  it('counts nothing while paused', () => {
    const { result } = render();
    act(() => result.current.startTracking());
    play(result, 0, 5);
    act(() => result.current.pauseTracking());

    const atPause = result.current.getPlayedSeconds();
    play(result, 5, 60);

    expect(result.current.getPlayedSeconds()).toBeCloseTo(atPause, 1);
  });
});

describe('the view row', () => {
  it('is created once the min(30 %, 30 s) threshold is crossed', async () => {
    const { result } = render();
    act(() => result.current.startTracking());

    play(result, 0, 20);
    expect(initView).not.toHaveBeenCalled();

    play(result, 20, 31);
    await waitFor(() => expect(initView).toHaveBeenCalledTimes(1));
    expect(initView.mock.calls[0][0]).toBe('42');
    expect(initView.mock.calls[0][1]).toBeGreaterThanOrEqual(30);
  });
});

describe('the 30 s heartbeat actually fires', () => {
  const startTrackedSession = async () => {
    const utils = render();
    act(() => utils.result.current.startTracking());
    play(utils.result, 0, 31);
    await waitFor(() => expect(initView).toHaveBeenCalled());
    await settle();
    return utils;
  };

  it('sends the current played duration on every interval tick', async () => {
    const { result } = await startTrackedSession();
    expect(updateView).not.toHaveBeenCalled();

    play(result, 31, 61);
    await act(async () => {
      jest.advanceTimersByTime(DEFAULT_VIEW_CONFIG.updateInterval);
    });
    await waitFor(() => expect(updateView).toHaveBeenCalledTimes(1));
    expect(updateView.mock.calls[0][2]).toBeCloseTo(61, 0);

    play(result, 61, 91);
    await act(async () => {
      jest.advanceTimersByTime(DEFAULT_VIEW_CONFIG.updateInterval);
    });
    await waitFor(() => expect(updateView).toHaveBeenCalledTimes(2));
    expect(updateView.mock.calls[1][2]).toBeCloseTo(91, 0);
  });

  it('does not send a duration the server already has', async () => {
    const { result } = await startTrackedSession();

    play(result, 31, 61);
    await act(async () => {
      jest.advanceTimersByTime(DEFAULT_VIEW_CONFIG.updateInterval);
    });
    await waitFor(() => expect(updateView).toHaveBeenCalledTimes(1));

    // Playback stopped feeding ticks — later heartbeats have nothing new to say.
    await act(async () => {
      jest.advanceTimersByTime(DEFAULT_VIEW_CONFIG.updateInterval * 3);
    });

    expect(updateView).toHaveBeenCalledTimes(1);
  });

  it('flushes on pause', async () => {
    const { result } = await startTrackedSession();
    play(result, 31, 45);

    await act(async () => {
      result.current.pauseTracking();
    });

    await waitFor(() => expect(updateView).toHaveBeenCalledTimes(1));
    expect(updateView.mock.calls[0][2]).toBeCloseTo(45, 0);
  });

  it('flushes on unmount', async () => {
    const { result, unmount } = await startTrackedSession();
    play(result, 31, 50);

    await act(async () => {
      unmount();
    });

    await waitFor(() => expect(updateView).toHaveBeenCalledTimes(1));
    expect(updateView.mock.calls[0][2]).toBeCloseTo(50, 0);
  });
});

describe('pagehide flush', () => {
  it('sends a beacon carrying the view id, played time and token', async () => {
    const { result } = render();
    act(() => result.current.startTracking());
    play(result, 0, 31);
    await waitFor(() => expect(initView).toHaveBeenCalled());
    await settle();

    play(result, 31, 75);

    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });

    expect(beacon).toHaveBeenCalledTimes(1);
    const [videoId, viewId, played, token] = beacon.mock.calls[0];
    expect(videoId).toBe('42');
    expect(viewId).toBe('view-1');
    expect(played).toBeCloseTo(75, 0);
    expect(token).toBe('tok-1');
  });

  it('sends nothing when there is no view row yet', () => {
    const { result } = render();
    act(() => result.current.startTracking());
    play(result, 0, 5);

    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });

    expect(beacon).not.toHaveBeenCalled();
  });

  it('sends nothing when the server already has this duration', async () => {
    const { result } = render();
    act(() => result.current.startTracking());
    play(result, 0, 31);
    await waitFor(() => expect(initView).toHaveBeenCalled());
    await settle();

    // Flush whatever the create call did not cover, then hide the page with
    // nothing new to report.
    await act(async () => {
      await result.current.finalize();
    });
    updateView.mockClear();

    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });

    expect(beacon).not.toHaveBeenCalled();
  });
});
