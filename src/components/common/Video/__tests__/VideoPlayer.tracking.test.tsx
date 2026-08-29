// View-tracking wiring in VideoPlayer. Source-swap mechanics have their own
// suite in VideoPlayer.test.tsx; what is asserted here is that the player's
// once-registered listeners always reach the CURRENT tracking callbacks, and
// that a scrub is reported as a scrub.
import React from 'react';
import { act, render } from '@testing-library/react';
import videojs from 'video.js';
import VideoPlayer from '../VideoPlayer';
import { useViewTracking } from '../../../../hooks/useViewTracking';

jest.mock('video.js');
jest.mock('../../../../hooks/useViewTracking');
jest.mock('video.js/dist/video-js.css', () => ({}), { virtual: true });

type Handler = () => void;

/** A video.js stand-in that remembers what was registered against it. */
const makePlayer = () => {
  const handlers = new Map<string, Handler[]>();
  const player: any = {
    handlers,
    currentTimeValue: 0,
    pausedValue: true,
    on: jest.fn((event: string, cb: Handler) => {
      handlers.set(event, [...(handlers.get(event) ?? []), cb]);
    }),
    one: jest.fn((event: string, cb: Handler) => {
      handlers.set(event, [...(handlers.get(event) ?? []), cb]);
    }),
    off: jest.fn((event: string, cb: Handler) => {
      handlers.set(event, (handlers.get(event) ?? []).filter((h) => h !== cb));
    }),
    currentTime: jest.fn((t?: number) => {
      if (typeof t === 'number') player.currentTimeValue = t;
      return player.currentTimeValue;
    }),
    paused: jest.fn(() => player.pausedValue),
    play: jest.fn(() => Promise.resolve()),
    pause: jest.fn(),
    src: jest.fn(),
    dispose: jest.fn(),
    error: jest.fn(),
    isFullscreen: jest.fn(() => false),
    requestFullscreen: jest.fn(),
    exitFullscreen: jest.fn(),
  };
  return player;
};

const fire = (player: any, event: string) =>
  (player.handlers.get(event) ?? []).forEach((h: Handler) => h());

const videojsMock = videojs as unknown as jest.Mock;
const useViewTrackingMock = useViewTracking as jest.MockedFunction<typeof useViewTracking>;

let player: any;
/** A fresh tracking object per render, so identity changes are observable. */
let tracking: any;

const makeTracking = () => ({
  startTracking: jest.fn(),
  pauseTracking: jest.fn(),
  updateWatchedDuration: jest.fn(),
  finalize: jest.fn().mockResolvedValue(undefined),
  getPlayedSeconds: jest.fn(() => 0),
});

const baseProps = {
  src: 'https://cdn.test/original.mp4',
  thumbnail_path: 'thumb.jpg',
  videoId: '42',
  duration: 600,
};

beforeEach(() => {
  jest.clearAllMocks();
  player = makePlayer();
  videojsMock.mockReturnValue(player);
  tracking = makeTracking();
  useViewTrackingMock.mockImplementation(() => {
    // A NEW object every render — exactly what caused the stale-closure bug.
    tracking = makeTracking();
    return tracking as any;
  });
});

describe('the player dispatches through a ref, never a captured render', () => {
  it('calls the latest startTracking, not the one captured at mount', () => {
    const { rerender } = render(<VideoPlayer {...baseProps} />);
    const firstRenderTracking = tracking;

    rerender(<VideoPlayer {...baseProps} title="renamed" />);
    rerender(<VideoPlayer {...baseProps} title="renamed again" />);
    const latestTracking = tracking;
    expect(latestTracking).not.toBe(firstRenderTracking);

    act(() => fire(player, 'playing'));

    // The listeners are registered once on mount, by design. Before the ref
    // they held render zero's callbacks — built before the view config had
    // loaded — and a first visit tracked nothing.
    expect(latestTracking.startTracking).toHaveBeenCalledTimes(1);
    expect(firstRenderTracking.startTracking).not.toHaveBeenCalled();
  });

  it('routes pause, timeupdate and ended to the latest callbacks too', () => {
    const { rerender } = render(<VideoPlayer {...baseProps} />);
    const stale = tracking;
    rerender(<VideoPlayer {...baseProps} title="x" />);
    const latest = tracking;

    player.currentTimeValue = 12.5;
    act(() => {
      fire(player, 'pause');
      fire(player, 'timeupdate');
      fire(player, 'ended');
    });

    expect(latest.pauseTracking).toHaveBeenCalledTimes(1);
    expect(latest.updateWatchedDuration).toHaveBeenCalledWith(12.5, false);
    expect(latest.finalize).toHaveBeenCalledTimes(1);
    expect(stale.pauseTracking).not.toHaveBeenCalled();
    expect(stale.updateWatchedDuration).not.toHaveBeenCalled();
    expect(stale.finalize).not.toHaveBeenCalled();
  });

  it('finalizes through the ref on dispose', () => {
    const { rerender, unmount } = render(<VideoPlayer {...baseProps} />);
    rerender(<VideoPlayer {...baseProps} title="x" />);
    const latest = tracking;

    act(() => {
      unmount();
    });

    expect(latest.finalize).toHaveBeenCalledTimes(1);
    expect(player.dispose).toHaveBeenCalledTimes(1);
  });
});

describe('scrubbing is reported as scrubbing', () => {
  it('marks timeupdate as seeking between seeking and seeked', () => {
    render(<VideoPlayer {...baseProps} />);
    const t = tracking;

    player.currentTimeValue = 5;
    act(() => fire(player, 'timeupdate'));
    expect(t.updateWatchedDuration).toHaveBeenLastCalledWith(5, false);

    act(() => fire(player, 'seeking'));
    player.currentTimeValue = 400;
    act(() => fire(player, 'timeupdate'));
    expect(t.updateWatchedDuration).toHaveBeenLastCalledWith(400, true);

    act(() => fire(player, 'seeked'));
    // The landing position is reported once, flagged as a seek.
    expect(t.updateWatchedDuration).toHaveBeenLastCalledWith(400, true);

    player.currentTimeValue = 400.25;
    act(() => fire(player, 'timeupdate'));
    expect(t.updateWatchedDuration).toHaveBeenLastCalledWith(400.25, false);
  });
});

describe('tracking survives a rendition swap', () => {
  it('keeps reporting through the same listeners after the source changes', () => {
    const { rerender } = render(<VideoPlayer {...baseProps} />);
    expect(videojsMock).toHaveBeenCalledTimes(1);

    rerender(
      <VideoPlayer {...baseProps} video_urls={{ '720p': 'https://cdn.test/720p.mp4' }} />
    );
    const latest = tracking;

    // The player is swapped in place, never rebuilt — rebuilding it would drop
    // every listener registered on mount, tracking included.
    expect(videojsMock).toHaveBeenCalledTimes(1);
    expect(player.dispose).not.toHaveBeenCalled();

    player.currentTimeValue = 140;
    act(() => fire(player, 'timeupdate'));

    expect(latest.updateWatchedDuration).toHaveBeenCalledWith(140, false);
  });

  it('does not treat the swap itself as watched time', () => {
    const { rerender } = render(<VideoPlayer {...baseProps} />);

    player.currentTimeValue = 137;
    player.pausedValue = false;
    rerender(
      <VideoPlayer {...baseProps} video_urls={{ '720p': 'https://cdn.test/720p.mp4' }} />
    );

    const latest = tracking;
    latest.updateWatchedDuration.mockClear();

    // The new source loads at 0 and is seeked back to where the viewer was.
    player.currentTimeValue = 0;
    act(() => fire(player, 'loadedmetadata'));

    // Restoring the playhead must not look like 137 seconds of playback. The
    // hook only counts deltas it is told about, and nothing was reported here.
    expect(latest.updateWatchedDuration).not.toHaveBeenCalled();
    expect(player.currentTime).toHaveBeenCalledWith(137);
  });
});
