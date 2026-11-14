import { ViewSession, viewSessions } from '../viewSession';
import { initializeVideoView, sendViewBeacon, updateVideoView } from '../../api/video';
import { DEFAULT_VIEW_CONFIG } from '../../types/config';

jest.mock('../../api/video', () => ({
  initializeVideoView: jest.fn(),
  updateVideoView: jest.fn(),
  sendViewBeacon: jest.fn(),
}));

const initView = initializeVideoView as jest.MockedFunction<typeof initializeVideoView>;
const updateView = updateVideoView as jest.MockedFunction<typeof updateVideoView>;
const beacon = sendViewBeacon as jest.MockedFunction<typeof sendViewBeacon>;

const SETTINGS = {
  duration: 600,
  thresholds: DEFAULT_VIEW_CONFIG.thresholds,
  updateInterval: DEFAULT_VIEW_CONFIG.updateInterval,
};

/**
 * Feed ticks at the real 0.25 s cadence from one player. The first tick at
 * `from` only anchors (a tick with no predecessor is never credited).
 */
const play = (
  session: ViewSession,
  holder: 'primary' | 'mini',
  from: number,
  to: number
) => {
  session.tick(holder, from);
  for (let t = from + 0.25; t <= to + 1e-9; t += 0.25) {
    session.tick(holder, Number(t.toFixed(3)));
  }
};

const settle = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

beforeEach(() => {
  jest.useFakeTimers();
  viewSessions.resetForTests();
  initView.mockReset().mockResolvedValue({
    success: true,
    message: 'ok',
    data: { viewId: 'view-1', beaconToken: 'tok-1' },
  } as any);
  updateView.mockReset().mockResolvedValue({ success: true, message: 'ok' } as any);
  beacon.mockReset().mockReturnValue(true);
});

afterEach(() => {
  viewSessions.resetForTests();
  jest.useRealTimers();
});

describe('one session across the main player and the mini player', () => {
  it('keeps counting in the mini player, in the same view, after the watch page unmounts', async () => {
    const primary = viewSessions.acquirePrimary('42', SETTINGS);
    primary.start('primary');
    play(primary, 'primary', 0, 40);
    await settle();
    expect(initView).toHaveBeenCalledTimes(1);

    // Minimise: the main player pauses, the mini player takes the session.
    primary.pause('primary');
    await settle();
    const mini = viewSessions.carry('42', SETTINGS);
    expect(mini).toBe(primary);

    // The viewer leaves the watch page: the main player unmounts.
    viewSessions.releasePrimary(primary);
    await settle();
    expect(mini.isEnded()).toBe(false);

    // The mini player plays on from where it was.
    mini.start('mini');
    play(mini, 'mini', 40, 60);
    expect(mini.getPlayedSeconds()).toBeCloseTo(60, 0);

    // Still one view row.
    expect(initView).toHaveBeenCalledTimes(1);
    mini.pause('mini');
    await settle();
    const last = updateView.mock.calls[updateView.mock.calls.length - 1];
    expect(last[0]).toBe('42');
    expect(last[1]).toBe('view-1');
    expect(last[2]).toBeCloseTo(60, 0);
  });

  it('"Return to video" hands the same session back — no second view row', async () => {
    const first = viewSessions.acquirePrimary('42', SETTINGS);
    first.start('primary');
    play(first, 'primary', 0, 40);
    await settle();
    first.pause('primary');
    viewSessions.carry('42', SETTINGS);
    viewSessions.releasePrimary(first);

    first.start('mini');
    play(first, 'mini', 40, 50);
    first.pause('mini');
    viewSessions.returnToPrimary('42');

    // The watch page mounts again and adopts the carried session.
    const again = viewSessions.acquirePrimary('42', SETTINGS);
    expect(again).toBe(first);
    again.start('primary');
    play(again, 'primary', 50, 60);
    await settle();

    expect(again.getPlayedSeconds()).toBeCloseTo(60, 0);
    expect(initView).toHaveBeenCalledTimes(1);
  });

  it('never counts the same second twice when both players report at once', () => {
    const session = viewSessions.acquirePrimary('42', SETTINGS);
    session.start('primary');
    play(session, 'primary', 0, 10);
    viewSessions.carry('42', SETTINGS);
    session.start('mini');

    // The main player was not paused and keeps firing timeupdate.
    for (let t = 10.25; t <= 20; t += 0.25) {
      session.tick('primary', t);
      session.tick('mini', t);
    }

    expect(session.getPlayedSeconds()).toBeCloseTo(20, 0);
  });

  it('ignores a late pause from the main player once the mini player has taken over', () => {
    const session = viewSessions.acquirePrimary('42', SETTINGS);
    viewSessions.carry('42', SETTINGS);
    session.start('mini');
    session.pause('primary');
    expect(session.getHolder()).toBe('mini');
    play(session, 'mini', 0, 5);
    expect(session.getPlayedSeconds()).toBeCloseTo(5, 0);
  });

  it('does not credit the jump between where one player stopped and the other starts', () => {
    const session = viewSessions.acquirePrimary('42', SETTINGS);
    session.start('primary');
    play(session, 'primary', 0, 10);
    session.pause('primary');
    viewSessions.carry('42', SETTINGS);
    session.start('mini');
    // The mini player starts 0.2 s further on (its own seek to the handover point).
    session.tick('mini', 10.2);
    play(session, 'mini', 10.2, 15.2);
    expect(session.getPlayedSeconds()).toBeCloseTo(15, 0);
  });
});

describe('when the session ends', () => {
  it('ends with the main player when the mini player never took it', async () => {
    const session = viewSessions.acquirePrimary('42', SETTINGS);
    session.start('primary');
    play(session, 'primary', 0, 40);
    await settle();

    viewSessions.releasePrimary(session);
    expect(session.isEnded()).toBe(true);

    // A later visit to the same video is a new view.
    const next = viewSessions.acquirePrimary('42', SETTINGS);
    expect(next).not.toBe(session);
    next.start('primary');
    play(next, 'primary', 0, 40);
    await settle();
    expect(initView).toHaveBeenCalledTimes(2);
  });

  it('ends when the mini player is closed, and stops its heartbeat', async () => {
    const session = viewSessions.acquirePrimary('42', SETTINGS);
    session.start('primary');
    play(session, 'primary', 0, 40);
    await settle();
    viewSessions.carry('42', SETTINGS);
    viewSessions.releasePrimary(session);
    session.start('mini');

    viewSessions.dropCarried('42');
    expect(session.isEnded()).toBe(true);

    updateView.mockClear();
    jest.advanceTimersByTime(DEFAULT_VIEW_CONFIG.updateInterval * 3);
    expect(updateView).not.toHaveBeenCalled();
  });

  it('closing the mini player while the watch page is still open keeps the main player\'s session', () => {
    const session = viewSessions.acquirePrimary('42', SETTINGS);
    viewSessions.carry('42', SETTINGS);
    viewSessions.dropCarried('42');
    expect(session.isEnded()).toBe(false);
    viewSessions.releasePrimary(session);
    expect(session.isEnded()).toBe(true);
  });

  it('a carried session for another video ends when a new watch page starts', () => {
    const old = viewSessions.acquirePrimary('42', SETTINGS);
    viewSessions.carry('42', SETTINGS);
    viewSessions.releasePrimary(old);
    expect(old.isEnded()).toBe(false);

    const other = viewSessions.acquirePrimary('77', SETTINGS);
    expect(old.isEnded()).toBe(true);
    expect(other.videoId).toBe('77');
  });

  it('flushes the tail with a beacon on page hide while the mini player plays', async () => {
    const session = viewSessions.acquirePrimary('42', SETTINGS);
    session.start('primary');
    play(session, 'primary', 0, 40);
    await settle();
    viewSessions.carry('42', SETTINGS);
    viewSessions.releasePrimary(session);
    await settle();
    session.start('mini');
    play(session, 'mini', 40, 70);

    window.dispatchEvent(new Event('pagehide'));

    expect(beacon).toHaveBeenCalledTimes(1);
    expect(beacon.mock.calls[0][2]).toBeCloseTo(70, 0);
  });

  it('heartbeats while the mini player plays', async () => {
    const session = viewSessions.acquirePrimary('42', SETTINGS);
    session.start('primary');
    play(session, 'primary', 0, 40);
    await settle();
    session.pause('primary');
    await settle();
    viewSessions.carry('42', SETTINGS);
    viewSessions.releasePrimary(session);
    await settle();
    updateView.mockClear();

    session.start('mini');
    play(session, 'mini', 40, 65);
    jest.advanceTimersByTime(DEFAULT_VIEW_CONFIG.updateInterval);
    await settle();

    expect(updateView).toHaveBeenCalledTimes(1);
    expect(updateView.mock.calls[0][2]).toBeCloseTo(65, 0);
  });
});
