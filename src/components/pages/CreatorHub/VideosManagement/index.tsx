import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InfiniteData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
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
import EditVideoModal from './EditVideoModal';
import DeleteConfirmationDialog from '../../../common/DeleteConfirmationDialog';
import { Video } from '../../../../types/video';
import { useChannelSelection } from '../../../../contexts/ChannelSelectionContext';
import { useUploadQueueContext } from '../../../../contexts/UploadQueueContext';
import { useVideoProcessing } from '../../../../hooks/useVideoProcessing';

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

interface PaginatedResponse {
  data: Video[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

type VideoPages = InfiniteData<PaginatedResponse, number>;

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

/** The one sentence a bulk run gets, whatever happened inside it. */
export function bulkSummary(done: number, total: number, verb: string): string {
  if (done === total) return `${total} ${verb}`;
  const past = verb === 'deleted' ? 'deleted' : 'updated';
  return `${done} of ${total} ${past} — ${total - done} failed`;
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

const VideosManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { selectedChannelId, channels, selectedChannel, isLoading: isChannelsLoading } =
    useChannelSelection();

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
  // different cache entries, and switching back to one the creator has looked at
  // shows it immediately instead of a spinner.
  const queryKey = useMemo(
    () => ['channelVideos', selectedChannelId, apiQuery] as const,
    [selectedChannelId, apiQuery],
  );

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, error, refetch } =
    useInfiniteQuery<PaginatedResponse, Error, VideoPages, typeof queryKey, number>({
      queryKey,
      queryFn: ({ pageParam }) => getChannelVideos(selectedChannelId, pageParam, apiQuery),
      initialPageParam: 1,
      getNextPageParam: (last) =>
        last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
      enabled: !!selectedChannelId && !!selectedChannel && channels.length > 0 && !isChannelsLoading,
      staleTime: 1000 * 60 * 5, // 5 minutes
      // The list only changes when the creator changes it. Refetching because a
      // window regained focus (or a component remounted) hands back a brand-new
      // array of brand-new video objects, which rebuilt every row on screen —
      // rows re-animated, the "Ready" chip flashed again. The row's news comes
      // from the progress poll; the list is invalidated explicitly, by a retry
      // or by `?highlight=` resolving to a video we have not fetched yet.
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

  /** The channel's video count as the server counts it, not the rows loaded. */
  const total = data?.pages[0]?.pagination.total ?? null;

  // ── Cache writes ─────────────────────────────────────────────────────────
  // Every mutation edits the cache in place rather than refetching the list:
  // a refetch would hand back new objects for every row and rebuild the whole
  // table to report one switch flipping.

  const patchVideos = useCallback(
    (patch: (video: Video) => Video | null, ids: ReadonlySet<number>) => {
      queryClient.setQueryData<VideoPages>(queryKey, (old) => {
        if (!old) return old;
        let touched = false;
        const pages = old.pages.map((page) => {
          if (!page.data.some((video) => ids.has(video.id))) return page;
          touched = true;
          const next: Video[] = [];
          for (const video of page.data) {
            if (!ids.has(video.id)) {
              next.push(video);
              continue;
            }
            const replacement = patch(video);
            if (replacement) next.push(replacement);
          }
          return { ...page, data: next };
        });
        return touched ? { ...old, pages } : old;
      });
    },
    [queryClient, queryKey],
  );

  const setVisibilityInCache = useCallback(
    (ids: ReadonlySet<number>, isPublic: boolean) =>
      patchVideos((video) => (video.is_public === isPublic ? video : { ...video, is_public: isPublic }), ids),
    [patchVideos],
  );

  const replaceVideoInCache = useCallback(
    (updated: Video) => patchVideos(() => updated, new Set([updated.id])),
    [patchVideos],
  );

  const removeVideosFromCache = useCallback(
    (ids: ReadonlySet<number>) => patchVideos(() => null, ids),
    [patchVideos],
  );

  const setStatusInCache = useCallback(
    (videoId: number, status: Video['status']) =>
      patchVideos((video) => ({ ...video, status }), new Set([videoId])),
    [patchVideos],
  );

  // ── Selection ────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<number>>(() => new Set());
  const [busyIds, setBusyIds] = useState<ReadonlySet<number>>(() => new Set());
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

  const videosRef = useRef<Video[]>(videos);
  videosRef.current = videos;

  const handleSelectAll = useCallback((selected: boolean) => {
    setSelectedIds(selected ? new Set(videosRef.current.map((video) => video.id)) : new Set());
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const markBusy = useCallback((videoId: number, busy: boolean) => {
    setBusyIds((previous) => {
      const next = new Set(previous);
      if (busy) next.add(videoId);
      else next.delete(videoId);
      return next;
    });
  }, []);

  // ── Visibility ───────────────────────────────────────────────────────────

  /**
   * Flip one video's `is_public`, optimistically.
   *
   * The switch moves before the request leaves, because the creator's own
   * click is the best evidence we will ever have of what they meant; if the
   * server disagrees the row goes back exactly where it was. The caller owns
   * the announcement, so this is equally the undo path and the bulk path.
   */
  const flipVisibility = useCallback(
    async (videoId: number, next: boolean): Promise<{ ok: true } | { ok: false; message: string }> => {
      const ids = new Set([videoId]);
      markBusy(videoId, true);
      setVisibilityInCache(ids, next);
      try {
        const formData = new FormData();
        formData.append('is_public', String(next));
        const result = await updateVideo(String(videoId), formData);
        if (!result.success) {
          setVisibilityInCache(ids, !next);
          return { ok: false, message: result.message || 'Failed to update visibility' };
        }
        return { ok: true };
      } catch (caught) {
        setVisibilityInCache(ids, !next);
        return {
          ok: false,
          message: caught instanceof Error ? caught.message : 'Failed to update visibility',
        };
      } finally {
        markBusy(videoId, false);
      }
    },
    [markBusy, setVisibilityInCache],
  );

  const handleToggleVisibility = useCallback(
    async (videoId: number, next: boolean) => {
      const result = await flipVisibility(videoId, next);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      const undo = () => {
        void flipVisibility(videoId, !next).then((undone) => {
          if (!undone.ok) toast.error(undone.message);
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
    [flipVisibility],
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
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  }, []);

  const handleUpdateVideo = useCallback(
    async (videoId: string, formData: FormData) => {
      try {
        const result = await updateVideo(videoId, formData);
        if (result.success && result.data) {
          replaceVideoInCache(result.data);
          toast.success('Video updated successfully');
        } else {
          toast.error(result.message || 'Failed to update video');
        }
      } catch (caught) {
        toast.error(caught instanceof Error ? caught.message : 'Failed to update video');
      }
    },
    [replaceVideoInCache],
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
      if (removed.length > 0) removeVideosFromCache(new Set(removed));
      setSelectedIds((previous) => {
        const next = new Set(previous);
        removed.forEach((id) => next.delete(id));
        return next;
      });
      if (removed.length === 0) {
        toast.error(ids.length === 1 ? 'Failed to delete video' : `Could not delete any of the ${ids.length}`);
      } else if (ids.length === 1) {
        toast.success('Video deleted successfully');
      } else {
        const summary = bulkSummary(removed.length, ids.length, 'deleted');
        if (removed.length === ids.length) toast.success(summary);
        else toast.error(summary);
      }
    } finally {
      setBulkBusy(false);
    }
  }, [deleteOne, pendingDelete, removeVideosFromCache]);

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
      setBulkBusy(true);
      try {
        const results = await Promise.allSettled(ids.map((id) => flipVisibility(id, next)));
        const done = results.filter(
          (result) => result.status === 'fulfilled' && result.value.ok,
        ).length;
        const summary = bulkSummary(done, ids.length, next ? 'made public' : 'made private');
        if (done === 0) toast.error(`Could not update any of the ${ids.length}`);
        else if (done === ids.length) toast.success(summary);
        else toast.error(summary);
        if (done > 0) clearSelection();
      } finally {
        setBulkBusy(false);
      }
    },
    [clearSelection, flipVisibility, selectedIds],
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

  // Handle a failed transcode. The backend owns the retry; this only asks.
  //
  // The retry reuses the video id, so both caches of "this one failed" have to
  // be dropped — the list's own `status` and the poll's terminal row — or the
  // row stays red and the poll never asks about it again.
  const handleRetryProcessing = useCallback(
    async (videoId: number) => {
      try {
        const result = await retryVideoProcessing(videoId);
        if (result.success) {
          setStatusInCache(videoId, 'pending');
          restartProcessingPoll([videoId]);
          toast.success('Processing restarted');
        } else {
          toast.error(result.message || 'Failed to restart processing');
        }
      } catch (caught) {
        toast.error(caught instanceof Error ? caught.message : 'Failed to restart processing');
      }
    },
    [restartProcessingPoll, setStatusInCache],
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
      <div className="px-4 md:px-6 space-y-4 max-w-[1920px] mx-auto">
        <VideosToolbar
          filters={filters}
          total={total}
          onSearchChange={handleSearchChange}
          onVisibilityChange={handleVisibilityChange}
          onSortChange={handleSortChange}
        />

        <div className="overflow-hidden rounded-lg border border-gray-800/30">
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
            busyIds={busyIds}
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
