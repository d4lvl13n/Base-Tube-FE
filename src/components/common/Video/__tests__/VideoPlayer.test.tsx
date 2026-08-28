import React from 'react';
import { render } from '@testing-library/react';
import VideoPlayer from '../VideoPlayer';

interface FakePlayer {
  time: number;
  isPaused: boolean;
  src: jest.Mock;
  currentTime: jest.Mock;
  paused: jest.Mock;
  play: jest.Mock;
  pause: jest.Mock;
  on: jest.Mock;
  one: jest.Mock;
  dispose: jest.Mock;
  error: jest.Mock;
  isFullscreen: jest.Mock;
  requestFullscreen: jest.Mock;
  exitFullscreen: jest.Mock;
}

/**
 * A fake video.js player.
 *
 * `currentTime` is both the getter and the setter in video.js, so it is
 * modelled that way — the whole point of the test is that the playhead
 * survives a source swap.
 *
 * CRA resets every mock (implementations included) between tests, so the
 * player is rebuilt in `beforeEach` rather than declared once.
 */
function createPlayer(): FakePlayer {
  const player: FakePlayer = {
    time: 0,
    isPaused: true,
    src: jest.fn(),
    currentTime: jest.fn((value?: number) => {
      if (typeof value === 'number') player.time = value;
      return player.time;
    }),
    paused: jest.fn(() => player.isPaused),
    play: jest.fn(() => Promise.resolve()),
    pause: jest.fn(),
    on: jest.fn(),
    one: jest.fn(),
    dispose: jest.fn(),
    error: jest.fn(),
    isFullscreen: jest.fn(() => false),
    requestFullscreen: jest.fn(),
    exitFullscreen: jest.fn(),
  };
  return player;
}

let mockPlayer: FakePlayer = createPlayer();
const mockVideojs = jest.fn();

jest.mock('video.js', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockVideojs(...(args as [])),
}));

// The real hook reaches for ConfigContext and the views API; playback source
// selection has nothing to do with either.
jest.mock('../../../../hooks/useViewTracking', () => ({
  useViewTracking: () => ({
    startTracking: jest.fn(),
    pauseTracking: jest.fn(),
    updateWatchedDuration: jest.fn(),
    finalize: jest.fn().mockResolvedValue(undefined),
  }),
}));

/** The `loadedmetadata` handler the swap registered, if any. */
function loadedMetadataHandler(): (() => void) | undefined {
  const call = mockPlayer.one.mock.calls.find(([event]) => event === 'loadedmetadata');
  return call?.[1] as (() => void) | undefined;
}

const ORIGINAL = 'https://cdn.example/original.mp4';
const RENDITION = 'https://cdn.example/720p.mp4';

beforeEach(() => {
  mockPlayer = createPlayer();
  mockVideojs.mockImplementation(() => mockPlayer);
});

describe('VideoPlayer source switching', () => {
  it('loads the selected source on mount', () => {
    render(
      <VideoPlayer src={ORIGINAL} thumbnail_path="/poster.jpg" videoId="1" duration={120} />,
    );

    expect(mockVideojs).toHaveBeenCalledTimes(1);
    const options = mockVideojs.mock.calls[0][1] as { sources: Array<{ src: string }> };
    expect(options.sources[0].src).toBe(ORIGINAL);
    expect(mockPlayer.src).not.toHaveBeenCalled();
  });

  it('switches to a rendition that appears after mount, keeping time and playback', () => {
    const { rerender } = render(
      <VideoPlayer src={ORIGINAL} thumbnail_path="/poster.jpg" videoId="1" duration={120} />,
    );

    // Watching, 42 seconds in, when the transcoder's 720p lands.
    mockPlayer.time = 42;
    mockPlayer.isPaused = false;

    rerender(
      <VideoPlayer
        src={ORIGINAL}
        video_urls={{ '720p': RENDITION }}
        thumbnail_path="/poster.jpg"
        videoId="1"
        duration={120}
      />,
    );

    // The player is swapped, not rebuilt: no second videojs() call.
    expect(mockVideojs).toHaveBeenCalledTimes(1);
    expect(mockPlayer.src).toHaveBeenCalledWith({ src: RENDITION, type: 'video/mp4' });

    const onLoaded = loadedMetadataHandler();
    expect(onLoaded).toBeDefined();
    // The swap resets the playhead; the handler puts it back and resumes.
    mockPlayer.time = 0;
    onLoaded!();
    expect(mockPlayer.currentTime).toHaveBeenCalledWith(42);
    expect(mockPlayer.play).toHaveBeenCalled();
  });

  it('does not resume a player that was paused when the source changed', () => {
    const { rerender } = render(
      <VideoPlayer src={ORIGINAL} thumbnail_path="/poster.jpg" videoId="1" duration={120} />,
    );

    mockPlayer.time = 10;
    mockPlayer.isPaused = true;

    rerender(
      <VideoPlayer
        src={ORIGINAL}
        video_urls={{ '720p': RENDITION }}
        thumbnail_path="/poster.jpg"
        videoId="1"
        duration={120}
      />,
    );

    loadedMetadataHandler()!();
    expect(mockPlayer.play).not.toHaveBeenCalled();
  });

  it('leaves the player alone when the selected source is unchanged', () => {
    const { rerender } = render(
      <VideoPlayer src={ORIGINAL} thumbnail_path="/poster.jpg" videoId="1" duration={120} />,
    );

    rerender(
      <VideoPlayer
        src={ORIGINAL}
        thumbnail_path="/poster.jpg"
        thumbnail_url="/other-poster.jpg"
        videoId="1"
        duration={120}
      />,
    );

    expect(mockPlayer.src).not.toHaveBeenCalled();
  });
});
