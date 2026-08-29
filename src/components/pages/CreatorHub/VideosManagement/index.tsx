import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import { ChannelVideoQuery, getChannelVideos } from '../../../../api/channel';
import { updateVideo, deleteVideo, retryVideoProcessing } from '../../../../api/video';
import {
  BulkAction,
  DEFAULT_FILTERS,
  VideoFilters,
  VideoSortOption,
  VideoVisibilityFilter,
  hasActiveFilters,
} from './types';
import { VideoList } from './components/VideoList/videolist';
import { VideosToolbar } from './components/VideosToolbar';
import { BulkActionBar } from './components/BulkActionBar';
import { isPlayable } from './components/VideoList/utils';
import {
  ChannelVideoPage,
  ChannelVideoPages,
  channelVideosKey,
  mergeDefined,
  patchCachedChannelVideos,
  reconcileChannelVideos,
  removeCachedChannelVideos,
} from './videoCache';
import { styles } from './components/VideoList/styles';
import EditVideoModal from './EditVideoModal';
import DeleteConfirmationDialog from '../../../common/DeleteConfirmationDialog';
import { Video, VideoStatus } from '../../../../types/video';
import { useChannelSelection } from '../../../../contexts/ChannelSelectionContext';
import { useUploadQueueContext } from '../../../../contexts/UploadQueueContext';
import { ProcessingVideo, useVideoProcessing } from '../../../../hooks/useVideoProcessing';

/**
 * How long we keep watching the upload queue for `?highlight=<uploadId>`.
 *
 * The video row does not exist at the moment the upload page hands over — the
 * worker creates it during completion — so the id in the URL is the upload's
 * until the queue learns the video id. A minute is far longer than that takes;
 * after it, the creator is just looking at their videos.
 */
const HIGHLIGHT_RESOLVE_MS = 60_000;

/** `?highlight=` carrying a video id rather than an upload id. */
function isVideoId(value: string): boolean {
  return /^\d+$/.test(value);
}

const VISIBILITY_VALUES: VideoVisibilityFilter[] = ['all', 'public', 'private', 'processing'];
const SORT_VALUES: VideoSortOption[] = ['newest', 'oldest', 'most_viewed', 'most_liked'];

function readVisibility(value: string | null): VideoVisibilityFilter {
  return VISIBILITY_VALUES.includes(value as VideoVisibilityFilter)
    ? (value as VideoVisibilityFilter)
    : DEFAULT_FILTERS.visibility;
}

function readSort(value: string | null): VideoSortOption {
  return SORT_VALUES.includes(value as VideoSortOption)
    ? (value as VideoSortOption)
    : DEFAULT_FILTERS.sort;
}

/**
 * The status the progress poll has settled on, if it has.
 *
 * The poll is the only thing that learns a transcode finished, and the list's
 * own `status` is whatever the server said when the page was fetched. Without
 * copying this back, a video that finished five minutes ago still reads
 * `processing` to everything that asks the list: Watch stayed disabled, the
 * visibility switch stayed locked, and the row sat under the Processing filter
 * for as long as the tab was open.
 */
export function settledStatus(row: ProcessingVideo): VideoStatus | null {
  if (row.status === 'processed' || row.status === 'completed' || row.status === 'failed') {
    return row.status;
  }
  return null;
}

export interface BulkTally {
  done: number;
  failed: number;
  /** Rows the action could not apply to — a video that is not ready to publish. */
  skipped: number;
  verb: string;
}

/** The one sentence a bulk run gets, whatever happened inside it. */
export function bulkSummary({ done, failed, skipped, verb }: BulkTally): string {
  const stillProcessing = skipped > 0 ? ` · ${skipped} still processing` : '';
  if (failed === 0) return `${done} ${verb}${stillProcessing}`;
  const attempted = done + failed;
  const past = verb === 'deleted' ? 'deleted' : 'updated';
  return `${done} of ${attempted} ${past} — ${failed} failed${stillProcessing}`;
}

/** A success toast that offers to put things back. */
const UndoToast: React.FC<{ message: string; onUndo: () => void; closeToast?: () => void }> = ({
  message,
  onUndo,
  closeToast,
}) => (
  <span className="flex items-center justify-between gap-3">
    {message}
    <button
      type="button"
      onClick={() => {
        closeToast?.();
        onUndo();
      }}
      className="shrink-0 font-medium underline underline-offset-2"
    >
      Undo
    </button>
  </span>
);

type FlipOutcome =
  | { status: 'ok'; prior: boolean; generation: number }
  | { status: 'noop' }
  | { status: 'missing' }
  | { status: 'not_ready' }
  | { status: 'failed'; message: string };

const VideosManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { selectedChannelId, channels, selectedChannel, isLoading: isChannelsLoading } =
    useChannelSelection();

  // Nothing may touch component state after the creator has navigated away —
  // a request that lands into an unmounted tree is a React warning at best and
  // a toast for a page nobody is on at worst.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Filters live in the URL ──────────────────────────────────────────────
  // Not in component state: a creator who filters to "Private", opens a video
  // and comes back — or refreshes, or sends the link to themselves — must land
  // on the same list, not on page one of everything.
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const filters: VideoFilters = useMemo(
    () => ({
      q: searchParams.get('q') ?? '',
      visibility: readVisibility(searchParams.get('visibility')),
      sort: readSort(searchParams.get('sort')),
    }),
    [searchParams],
  );

  // The current values are read back out of the URL inside the updater rather
  // than closed over, so these callbacks keep one identity for the tab's life:
  // the toolbar's debounce timer is keyed on them, and the memoised rows are
  // handed several of them.
  const writeFilters = useCallback(
    (patch: Partial<VideoFilters>, replace: boolean) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          const merged: VideoFilters = {
            q: previous.get('q') ?? '',
            visibility: readVisibility(previous.get('visibility')),
            sort: readSort(previous.get('sort')),
            ...patch,
          };
          const write = (key: string, value: string, fallback: string) => {
            if (value === fallback) next.delete(key);
            else next.set(key, value);
          };
          write('q', merged.q.trim(), '');
          write('visibility', merged.visibility, DEFAULT_FILTERS.visibility);
          write('sort', merged.sort, DEFAULT_FILTERS.sort);
          return next;
        },
        { replace },
      );
    },
    [setSearchParams],
  );

  // Typing replaces the current entry — a word would otherwise leave five
  // history entries between the creator and the page they came from. Picking a
  // chip or a sort order is a decision, and pushes.
  const handleSearchChange = useCallback((q: string) => writeFilters({ q }, true), [writeFilters]);
  const handleVisibilityChange = useCallback(
    (visibility: VideoVisibilityFilter) => writeFilters({ visibility }, false),
    [writeFilters],
  );
  const handleSortChange = useCallback(
    (sort: VideoSortOption) => writeFilters({ sort }, false),
    [writeFilters],
  );
  const handleClearFilters = useCallback(() => writeFilters(DEFAULT_FILTERS, false), [writeFilters]);

  // ── The request those filters describe ───────────────────────────────────
  const apiQuery: ChannelVideoQuery = useMemo(() => {
    const query: ChannelVideoQuery = { sort: filters.sort };
    const search = filters.q.trim();
    if (search) query.search = search;
    if (filters.visibility === 'public' || filters.visibility === 'private') {
      query.visibility = filters.visibility;
    } else if (filters.visibility === 'processing') {
      query.status = 'processing';
    }
    return query;
  }, [filters]);

  // The filters are part of the key: two different filtered lists are two
  // different cache entries, and switching back to one the creator has looked
  // at shows it immediately instead of a spinner.
  const queryKey = useMemo(
    () => channelVideosKey(selectedChannelId, apiQuery),
    [selectedChannelId, apiQuery],
  );

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, error, refetch } =
    useInfiniteQuery<ChannelVideoPage, Error, ChannelVideoPages, typeof queryKey, number>({
      queryKey,
      // The signal aborts a search the moment the next keystroke supersedes it,
      // instead of letting three overlapping answers race to land last.
      queryFn: ({ pageParam, signal }) =>
        getChannelVideos(selectedChannelId, pageParam, apiQuery, signal),
      initialPageParam: 1,
      getNextPageParam: (last) =>
        last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
      enabled: !!selectedChannelId && !!selectedChannel && channels.length > 0 && !isChannelsLoading,
      staleTime: 1000 * 60 * 5, // 5 minutes
      // The list only changes when the creator changes it. Refetching because a
      // window regained focus (or a component remounted) hands back a brand-new
      // array of brand-new video objects, which rebuilt every row on screen —
      // rows re-animated, the "Ready" chip flashed again. The row's news comes
      // from the progress poll; the list is refetched explicitly, when a
      // mutation has moved rows and the pagination underneath needs it.
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    });

  // A video can move between pages while the creator pages (a fresh upload
  // pushes the last row of page 1 onto page 2), so the same id can arrive
  // twice. Two rows with one key is a React warning and a duplicated action.
  const videos = useMemo(() => {
    const pages = data?.pages ?? [];
    const seen = new Set<number>();
    const flat: Video[] = [];
    for (const page of pages) {
      for (const video of page.data) {
        if (seen.has(video.id)) continue;
        seen.add(video.id);
        flat.push(video);
      }
    }
    return flat;
  }, [data]);

  const videosRef = useRef<Video[]>(videos);
  videosRef.current = videos;

  /** The channel's video count as the server counts it, not the rows loaded. */
  const total = data?.pages[0]?.pagination.total ?? null;

  // ── Cache writes ─────────────────────────────────────────────────────────
  // Every mutation edits the cache in place rather than refetching the list:
  // a refetch would hand back new objects for every row and rebuild the whole
  // table to report one switch flipping. What it cannot do in place is
  // pagination — see `reconcile`.

  const patchVideos = useCallback(
    (ids: ReadonlySet<number>, patch: (video: Video) => Video): boolean =>
      patchCachedChannelVideos(queryClient, selectedChannelId, ids, patch),
    [queryClient, selectedChannelId],
  );

  /**
   * Put the pagination back on its feet after rows have left a list.
   *
   * Only called when something actually moved: a flip that leaves a video in
   * the same list (the usual case, on the unfiltered list) touches nothing
   * else and the rows on screen do not so much as re-render.
   */
  const reconcile = useCallback(
    (moved: boolean) => {
      if (!moved) return;
      reconcileChannelVideos(queryClient, selectedChannelId);
    },
    [queryClient, selectedChannelId],
  );

  // ── Selection ────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<number>>(() => new Set());
  /**
   * How many mutations are in flight per video, not whether one is.
   *
   * With a plain set, the first of two overlapping flips to finish would clear
   * the flag while the second was still running, and the row would offer a
   * control that was about to be overwritten.
   */
  const [busyCounts, setBusyCounts] = useState<ReadonlyMap<number, number>>(() => new Map());
  const [bulkBusy, setBulkBusy] = useState(false);

  // A selection is about the rows on screen. Change the filter or the channel
  // and those rows are gone — acting on ids the creator can no longer see is
  // the one thing a bulk bar must never do.
  const selectionScope = `${selectedChannelId}|${filters.q}|${filters.visibility}`;
  useEffect(() => {
    setSelectedIds(new Set());
  }, [selectionScope]);

  const handleSelect = useCallback((videoId: number, selected: boolean) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (selected) next.add(videoId);
      else next.delete(videoId);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    setSelectedIds(selected ? new Set(videosRef.current.map((video) => video.id)) : new Set());
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const markBusy = useCallback((videoId: number, delta: 1 | -1) => {
    if (!mountedRef.current) return;
    setBusyCounts((previous) => {
      const next = new Map(previous);
      const count = (next.get(videoId) ?? 0) + delta;
      if (count > 0) next.set(videoId, count);
      else next.delete(videoId);
      return next;
    });
  }, []);

  // ── Visibility ───────────────────────────────────────────────────────────

  /**
   * Which mutation is the current owner of each video's visibility.
   *
   * Optimistic updates only survive contact with a creator who clicks twice.
   * Every flip takes a number; a flip that fails only rolls back if it still
   * holds the latest number, and an Undo offered by an older flip does nothing
   * at all. Without this, a slow failing request could undo a newer successful
   * one several seconds after the creator had moved on.
   */
  const generationsRef = useRef<Map<number, number>>(new Map());
  const claim = useCallback((videoId: number): number => {
    const generation = (generationsRef.current.get(videoId) ?? 0) + 1;
    generationsRef.current.set(videoId, generation);
    return generation;
  }, []);
  const stillOwns = useCallback(
    (videoId: number, generation: number) => generationsRef.current.get(videoId) === generation,
    [],
  );

  const writeVisibility = useCallback(
    (videoId: number, isPublic: boolean) =>
      patchVideos(new Set([videoId]), (video) =>
        video.is_public === isPublic ? video : { ...video, is_public: isPublic },
      ),
    [patchVideos],
  );

  /**
   * Flip one video's `is_public`, optimistically.
   *
   * The switch moves before the request leaves, because the creator's own
   * click is the best evidence we will ever have of what they meant; if the
   * server disagrees the row goes back to the value it actually had — not to
   * `!next`, which is the same thing only when the click was not a no-op. The
   * caller owns the announcement, so this is equally the undo path and the
   * bulk path.
   */
  const flipVisibility = useCallback(
    async (videoId: number, next: boolean): Promise<FlipOutcome> => {
      const current = videosRef.current.find((video) => video.id === videoId);
      if (!current) return { status: 'missing' };
      // Writing a value a video already has would still bump the generation
      // and could roll a *different*, real change back on failure.
      if (current.is_public === next) return { status: 'noop' };
      if (next && !isPlayable(current.status)) return { status: 'not_ready' };

      const prior = current.is_public;
      const generation = claim(videoId);

      markBusy(videoId, 1);
      const movedOptimistically = writeVisibility(videoId, next);
      try {
        const formData = new FormData();
        formData.append('is_public', String(next));
        const result = await updateVideo(String(videoId), formData);
        if (!result.success) {
          if (stillOwns(videoId, generation)) reconcile(writeVisibility(videoId, prior));
          return { status: 'failed', message: result.message || 'Failed to update visibility' };
        }
        reconcile(movedOptimistically);
        return { status: 'ok', prior, generation };
      } catch (caught) {
        // Only put it back if nothing newer has claimed this video since: a
        // later flip's value is the creator's latest word, not ours.
        if (stillOwns(videoId, generation)) reconcile(writeVisibility(videoId, prior));
        return {
          status: 'failed',
          message: caught instanceof Error ? caught.message : 'Failed to update visibility',
        };
      } finally {
        markBusy(videoId, -1);
      }
    },
    [claim, markBusy, reconcile, stillOwns, writeVisibility],
  );

  const handleToggleVisibility = useCallback(
    async (videoId: number, next: boolean) => {
      const result = await flipVisibility(videoId, next);
      if (!mountedRef.current) return;
      if (result.status === 'not_ready') {
        toast.error('This video is still processing — it can go public once it is ready');
        return;
      }
      if (result.status === 'failed') {
        toast.error(result.message);
        return;
      }
      if (result.status !== 'ok') return;

      const { prior, generation } = result;
      const undo = () => {
        // An Undo from a flip the creator has already superseded is not an
        // undo, it is an overwrite.
        if (!stillOwns(videoId, generation)) return;
        void flipVisibility(videoId, prior).then((undone) => {
          if (undone.status === 'failed' && mountedRef.current) toast.error(undone.message);
        });
      };

      toast.success(
        ((props: { closeToast?: () => void }) => (
          <UndoToast
            message={next ? 'Now public' : 'Now private'}
            closeToast={props?.closeToast}
            onUndo={undo}
          />
        )) as unknown as React.ReactNode,
        { autoClose: 6000 },
      );
    },
    [flipVisibility, stillOwns],
  );

  // ── Row actions ──────────────────────────────────────────────────────────

  const [editingVideoId, setEditingVideoId] = useState<number | null>(null);
  const editingVideo = useMemo(
    () => videos.find((video) => video.id === editingVideoId) ?? null,
    [videos, editingVideoId],
  );

  const handleEdit = useCallback((videoId: number) => setEditingVideoId(videoId), []);

  const handleCopyLink = useCallback(async (videoId: number) => {
    const url = `${window.location.origin}/video/${videoId}`;
    try {
      await navigator.clipboard.writeText(url);
      if (mountedRef.current) toast.success('Link copied');
    } catch {
      if (mountedRef.current) toast.error('Could not copy the link');
    }
  }, []);

  const handleUpdateVideo = useCallback(
    async (videoId: string, formData: FormData) => {
      try {
        const result = await updateVideo(videoId, formData);
        if (!mountedRef.current) return;
        if (result.success && result.data) {
          // Merge, do not replace: the edit response is built from the model
          // row and carries no signed `thumbnail_url`, so swapping the whole
          // object in blanked the artwork of every row it touched.
          const returned = result.data;
          reconcile(
            patchVideos(new Set([Number(videoId)]), (video) => mergeDefined(video, returned)),
          );
          toast.success('Video updated successfully');
        } else {
          toast.error(result.message || 'Failed to update video');
        }
      } catch (caught) {
        if (!mountedRef.current) return;
        toast.error(caught instanceof Error ? caught.message : 'Failed to update video');
      }
    },
    [patchVideos, reconcile],
  );

  // ── Deletion ─────────────────────────────────────────────────────────────
  // Never `window.confirm`: it blocks the page thread and cannot be styled,
  // read by a screen reader on our terms, or driven by a test.
  const [pendingDelete, setPendingDelete] = useState<number[] | null>(null);

  const handleDelete = useCallback((videoId: number) => setPendingDelete([videoId]), []);

  const deleteOne = useCallback(async (videoId: number): Promise<boolean> => {
    try {
      const result = await deleteVideo(String(videoId));
      return Boolean(result.success);
    } catch {
      return false;
    }
  }, []);

  const confirmDelete = useCallback(async () => {
    const ids = pendingDelete ?? [];
    setPendingDelete(null);
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      const results = await Promise.allSettled(ids.map((id) => deleteOne(id)));
      const removed = ids.filter((_, index) => {
        const result = results[index];
        return result.status === 'fulfilled' && result.value;
      });
      if (removed.length > 0) {
        removeCachedChannelVideos(queryClient, selectedChannelId, new Set(removed));
        // A delete always shifts every offset after it, so the pages already
        // loaded have to be re-read: otherwise the next "Load more" silently
        // skips exactly one video, forever.
        reconcile(true);
      }
      setSelectedIds((previous) => {
        const next = new Set(previous);
        removed.forEach((id) => next.delete(id));
        return next;
      });
      if (!mountedRef.current) return;
      const failed = ids.length - removed.length;
      if (ids.length === 1) {
        if (failed === 0) toast.success('Video deleted successfully');
        else toast.error('Failed to delete video');
        return;
      }
      const summary = bulkSummary({ done: removed.length, failed, skipped: 0, verb: 'deleted' });
      if (failed === 0) toast.success(summary);
      else toast.error(summary);
    } finally {
      if (mountedRef.current) setBulkBusy(false);
    }
  }, [deleteOne, pendingDelete, queryClient, reconcile, selectedChannelId]);

  // ── Bulk ─────────────────────────────────────────────────────────────────
  // There is no bulk endpoint, so this is N requests. `allSettled`, not `all`:
  // one refusal must not abandon the other nineteen half-way.
  const handleBulkAction = useCallback(
    async (action: BulkAction) => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;
      if (action === 'delete') {
        setPendingDelete(ids);
        return;
      }

      const next = action === 'make_public';
      // A video that is still transcoding cannot be published — the server
      // refuses it, and asking anyway would spend a request to be told so.
      // These are set aside and named in the summary rather than counted as
      // failures the creator could do something about.
      const eligible = next
        ? ids.filter((id) => {
            const video = videosRef.current.find((candidate) => candidate.id === id);
            return video ? isPlayable(video.status) : false;
          })
        : ids;
      const skipped = ids.length - eligible.length;

      setBulkBusy(true);
      try {
        const results = await Promise.allSettled(eligible.map((id) => flipVisibility(id, next)));
        const failedIds: number[] = [];
        let done = 0;
        eligible.forEach((id, index) => {
          const result = results[index];
          const outcome = result.status === 'fulfilled' ? result.value.status : 'failed';
          // A row that was already where the creator wants it is not a failure.
          if (outcome === 'ok' || outcome === 'noop') done += 1;
          else failedIds.push(id);
        });

        if (!mountedRef.current) return;
        const summary = bulkSummary({
          done,
          failed: failedIds.length,
          skipped,
          verb: next ? 'made public' : 'made private',
        });
        if (failedIds.length === 0 && skipped === 0) toast.success(summary);
        else toast.error(summary);

        // Whatever failed stays ticked, so "try again" is one click and does
        // not re-send the requests that already worked.
        setSelectedIds(new Set(failedIds));
      } finally {
        if (mountedRef.current) setBulkBusy(false);
      }
    },
    [flipVisibility, selectedIds],
  );

  // ── Processing ───────────────────────────────────────────────────────────
  // `failed` belongs here too: without it the poll never returns a row for a
  // failed video, so the list showed no status and no Retry — the one state
  // where the creator actually has something to do.
  const processingVideoIds = useMemo(
    () =>
      videos
        .filter((v) => v.status === 'pending' || v.status === 'processing' || v.status === 'failed')
        .map((v) => v.id),
    [videos],
  );

  const { processingVideos, restart: restartProcessingPoll } = useVideoProcessing(processingVideoIds);

  /**
   * Verdicts already written back, so each is written back once.
   *
   * Copying a settled status onto a video in the Processing list takes it out
   * of that list, which makes the pagination refetch. If the server has not
   * caught up yet it answers with the same row still `processing`, and without
   * this we would patch it, drop it, refetch, and be told again — a refetch
   * loop for as long as the lag lasts.
   */
  const settledAppliedRef = useRef<Map<number, VideoStatus>>(new Map());

  // The poll is the only thing that learns a transcode finished. Copying its
  // verdict onto the list's own `status` is what unlocks Watch and the
  // visibility switch, and what takes a finished video out of the Processing
  // filter — none of which used to happen until the page was reloaded.
  useEffect(() => {
    const settled = new Map<number, VideoStatus>();
    for (const row of Object.values(processingVideos)) {
      const status = settledStatus(row);
      if (!status) continue;
      if (settledAppliedRef.current.get(row.videoId) === status) continue;
      const known = videosRef.current.find((video) => video.id === row.videoId);
      if (known && known.status !== status) settled.set(row.videoId, status);
    }
    if (settled.size === 0) return;
    settled.forEach((status, id) => settledAppliedRef.current.set(id, status));
    reconcile(
      patchVideos(new Set(settled.keys()), (video) => ({
        ...video,
        status: settled.get(video.id) ?? video.status,
      })),
    );
  }, [patchVideos, processingVideos, reconcile, videos]);

  // Handle a failed transcode. The backend owns the retry; this only asks.
  //
  // The retry reuses the video id, so both caches of "this one failed" have to
  // be dropped — the list's own `status` and the poll's terminal row — or the
  // row stays red and the poll never asks about it again.
  const handleRetryProcessing = useCallback(
    async (videoId: number) => {
      try {
        const result = await retryVideoProcessing(videoId);
        if (!mountedRef.current) return;
        if (result.success) {
          // The same id is about to be transcoded again, so the verdict we
          // already wrote back is void — its successor must be applied too.
          settledAppliedRef.current.delete(videoId);
          reconcile(patchVideos(new Set([videoId]), (video) => ({ ...video, status: 'pending' })));
          restartProcessingPoll([videoId]);
          toast.success('Processing restarted');
        } else {
          toast.error(result.message || 'Failed to restart processing');
        }
      } catch (caught) {
        if (!mountedRef.current) return;
        toast.error(caught instanceof Error ? caught.message : 'Failed to restart processing');
      }
    },
    [patchVideos, reconcile, restartProcessingPoll],
  );

  // ── `?highlight=` resolution ─────────────────────────────────────────────
  // The upload pages link here with whichever id they hold. A video id can be
  // matched against the list directly; an upload id cannot — the API does not
  // return it — so it is resolved through the queue, which knows both.
  const { entries: queueEntries } = useUploadQueueContext();
  const numericHighlight = highlightId !== null && isVideoId(highlightId);
  const [queueHighlightId, setQueueHighlightId] = useState<string | null>(null);
  const [highlightExpired, setHighlightExpired] = useState(false);
  /** The video ids we have already refetched for, so one miss is one refetch. */
  const refetchedForRef = useRef<string | null>(null);

  // A real deadline, cleared on unmount: after a minute the creator is simply
  // looking at their videos, and we stop waiting on an upload that never
  // produced one.
  useEffect(() => {
    setQueueHighlightId(null);
    setHighlightExpired(false);
    refetchedForRef.current = null;
    if (highlightId === null || numericHighlight) return;
    const timer = setTimeout(() => setHighlightExpired(true), HIGHLIGHT_RESOLVE_MS);
    return () => clearTimeout(timer);
  }, [highlightId, numericHighlight]);

  // The queue re-renders on every one of its own polls, so this reads as a
  // poll without owning a second timer.
  useEffect(() => {
    if (highlightId === null || numericHighlight || highlightExpired) return;
    if (queueHighlightId !== null) return;
    const match = queueEntries.find(
      (entry) => entry.uploadId === highlightId || entry.localId === highlightId,
    );
    if (match?.videoId != null) setQueueHighlightId(String(match.videoId));
  }, [highlightId, highlightExpired, numericHighlight, queueEntries, queueHighlightId]);

  const resolvedHighlightId = numericHighlight ? highlightId : queueHighlightId;

  // The list was fetched before the worker created this video, so the row to
  // highlight is not in it. One refetch per resolved id — enough to bring the
  // row in, and never a loop when the id genuinely is not ours.
  useEffect(() => {
    if (resolvedHighlightId === null || refetchedForRef.current === resolvedHighlightId) return;
    if (videos.some((video) => String(video.id) === resolvedHighlightId)) return;
    refetchedForRef.current = resolvedHighlightId;
    void refetch();
  }, [refetch, resolvedHighlightId, videos]);

  const handleLoadMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (error) {
    return <div className="p-6 text-red-500">Failed to load videos</div>;
  }

  if (editingVideo) {
    return (
      <div className="relative pt-24">
        <div className="px-4 md:px-6 max-w-[1920px] mx-auto">
          <EditVideoModal
            video={editingVideo}
            isOpen
            onClose={() => setEditingVideoId(null)}
            onUpdate={handleUpdateVideo}
          />
        </div>
      </div>
    );
  }

  const deleteCount = pendingDelete?.length ?? 0;
  const deleteTitle = videos.find((video) => video.id === pendingDelete?.[0])?.title;

  return (
    <div className="relative pt-24 pb-8">
      <div className="mx-auto max-w-[1600px] space-y-4 px-4 md:px-6">
        <VideosToolbar
          filters={filters}
          total={total}
          onSearchChange={handleSearchChange}
          onVisibilityChange={handleVisibilityChange}
          onSortChange={handleSortChange}
        />

        <div className={styles.panel}>
          <VideoList
            videos={videos}
            processingVideos={processingVideos}
            onRetryProcessing={handleRetryProcessing}
            highlightId={resolvedHighlightId}
            isLoading={isLoading}
            isFetchingMore={isFetchingNextPage}
            hasMore={Boolean(hasNextPage)}
            onLoadMore={handleLoadMore}
            sort={filters.sort}
            onSort={handleSortChange}
            selectedIds={selectedIds}
            busyIds={busyCounts}
            selecting={selectedIds.size > 0}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCopyLink={handleCopyLink}
            onToggleVisibility={handleToggleVisibility}
            filtered={hasActiveFilters(filters)}
            onClearFilters={handleClearFilters}
          />
        </div>

        <BulkActionBar
          count={selectedIds.size}
          busy={bulkBusy}
          onAction={handleBulkAction}
          onClear={clearSelection}
        />

        {deleteCount > 0 && (
          <DeleteConfirmationDialog
            isOpen
            onClose={() => setPendingDelete(null)}
            onConfirm={() => void confirmDelete()}
            title={deleteCount === 1 ? 'Delete Video' : `Delete ${deleteCount} videos`}
            message={
              deleteCount === 1
                ? `Are you sure you want to delete "${deleteTitle ?? 'this video'}"? This action cannot be undone.`
                : `Are you sure you want to delete ${deleteCount} videos? This action cannot be undone.`
            }
          />
        )}
      </div>
    </div>
  );
};

export default VideosManagement;
