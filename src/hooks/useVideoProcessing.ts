import { useCallback, useEffect, useRef, useState } from 'react';
import { getVideoProgressBatch, VideoProgressBatchRow } from '../api/video';

export type ProcessingVideo = VideoProgressBatchRow;

/** Base poll interval; jitter is added so N dashboards do not sync up. */
const BASE_INTERVAL_MS = 5_000;
const JITTER_MS = 1_000;
/** A hidden tab still polls, three times more slowly. */
const HIDDEN_MULTIPLIER = 3;
/** After this long a video is almost certainly queued behind others. */
const BACKOFF_AFTER_MS = 10 * 60 * 1_000;
const BACKOFF_INTERVAL_MS = 30_000;
/** Contract 9: `GET /videos/progress?ids=` takes at most 50 ids. */
const MAX_IDS = 50;

/**
 * Terminal states from `GET /videos/progress?ids=`.
 *
 * The batch route reports the `Videos.status` enum verbatim, whose success
 * value is `processed`; `completed` is only ever emitted by the legacy
 * single-video route and is kept here as an alias so a row from either source
 * stops the poll.
 */
const TERMINAL_STATUSES = new Set(['processed', 'completed', 'failed']);

/**
 * Does this progress row say anything the one we already hold did not?
 *
 * Everything a row is read for: its status, its failure reason, and which
 * rendition is in which state. Anything else the batch route happens to send
 * back is not on screen, so a change in it must not churn React.
 */
export function sameProgress(previous?: ProcessingVideo, next?: ProcessingVideo): boolean {
  if (previous === next) return true;
  if (!previous || !next) return false;
  if (previous.status !== next.status) return false;
  if (previous.error?.code !== next.error?.code) return false;
  if (previous.error?.message !== next.error?.message) return false;
  const a = previous.renditions ?? [];
  const b = next.renditions ?? [];
  if (a.length !== b.length) return false;
  return a.every((rendition, index) => (
    rendition.quality === b[index].quality && rendition.state === b[index].state
  ));
}

function nextDelay(startedAt: number): number {
  const base = Date.now() - startedAt > BACKOFF_AFTER_MS ? BACKOFF_INTERVAL_MS : BASE_INTERVAL_MS;
  const jittered = base + (Math.random() * 2 - 1) * JITTER_MS;
  return document.visibilityState === 'hidden' ? jittered * HIDDEN_MULTIPLIER : jittered;
}

/**
 * Tracks transcoding progress for the videos on screen.
 *
 * One batched request per tick instead of one per video: a creator with thirty
 * videos in flight used to fire thirty requests every five seconds.
 */
export const useVideoProcessing = (videoIds: number[]) => {
  const [processingVideos, setProcessingVideos] = useState<Record<number, ProcessingVideo>>({});
  /** Bumped by `restart`, so the poll effect re-arms after a terminal state. */
  const [restartRevision, setRestartRevision] = useState(0);
  const isMountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef(Date.now());
  const processingVideosRef = useRef(processingVideos);
  const videoIdsRef = useRef(videoIds);
  const idsKey = videoIds.join(',');

  useEffect(() => {
    processingVideosRef.current = processingVideos;
  }, [processingVideos]);

  useEffect(() => {
    videoIdsRef.current = videoIds;
  }, [videoIds]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** Ids we have not yet seen reach a terminal state. */
  const pendingIds = useCallback(
    () =>
      videoIdsRef.current
        .filter((id) => {
          const known = processingVideosRef.current[id];
          return !known || !TERMINAL_STATUSES.has(known.status);
        })
        .slice(0, MAX_IDS),
    [],
  );

  /**
   * Forget what we know about these videos and start polling them again.
   *
   * A retried transcode reuses the video id, so the cached `failed` row would
   * otherwise keep the id out of `pendingIds` forever — the poll had stopped
   * for good and the row stayed red however well the retry went.
   */
  const restart = useCallback((ids: readonly number[]) => {
    if (ids.length === 0) return;
    setProcessingVideos((previous) => {
      const next = { ...previous };
      let changed = false;
      for (const id of ids) {
        if (id in next) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : previous;
    });
    setRestartRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    startedAtRef.current = Date.now();
    let cancelled = false;

    const schedule = () => {
      if (cancelled) return;
      timerRef.current = setTimeout(() => void tick(), nextDelay(startedAtRef.current));
    };

    const tick = async () => {
      if (cancelled || !isMountedRef.current) return;
      const ids = pendingIds();
      if (ids.length === 0) return;

      try {
        const response = await getVideoProgressBatch(ids);
        if (cancelled || !isMountedRef.current) return;
        const updates: Record<number, ProcessingVideo> = {};
        for (const id of ids) {
          const row = response.data?.[String(id)];
          // A tick that says exactly what the last one said is not news. The
          // old code spread a fresh object in every time, so `processingVideos`
          // — and every row object inside it — changed identity every 5 s, and
          // the whole Videos Management list rebuilt itself for nothing.
          if (row && !sameProgress(processingVideosRef.current[id], { ...row, videoId: id })) {
            updates[id] = { ...row, videoId: id };
          }
        }
        if (Object.keys(updates).length > 0) {
          setProcessingVideos((previous) => ({ ...previous, ...updates }));
        }
      } catch (error) {
        // Progress is a convenience, not the source of truth; keep polling.
        console.warn('[useVideoProcessing] progress poll failed', error);
      }
      schedule();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      clearTimer();
      void tick();
    };

    if (pendingIds().length > 0) void tick();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      clearTimer();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
    // `idsKey` is the stable identity of `videoIds`; the array itself is a new
    // reference on every render of the dashboard.
  }, [idsKey, clearTimer, pendingIds, restartRevision]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return { processingVideos, restart };
};
