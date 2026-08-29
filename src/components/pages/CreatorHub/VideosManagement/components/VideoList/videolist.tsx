import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowUp, ArrowUpDown, FileVideo, RefreshCw, SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import { SortField, VideoSortOption } from '../../types';
import { Video } from '../../../../../../types/video';
import { styles } from './styles';
import { formatDuration, formatRowDate, getThumbnailUrl, isPlayable } from './utils';
import { ProcessingVideo } from '../../../../../../hooks/useVideoProcessing';
import { ProcessingStatus } from './processingstatus';
import { VisibilitySwitch } from './VisibilitySwitch';
import { RowActions } from './RowActions';
import { descriptionToPreview } from '../../../../../../utils/descriptionText';

/** How long the orange edge stays lit after arriving from an upload. */
const HIGHLIGHT_MS = 1_500;

/** Placeholder rows while the very first page is in flight. */
const SKELETON_ROWS = 6;

/**
 * A row's status line when the progress poll has not answered yet.
 *
 * A video the list already knows is `failed` must say so — and offer Retry —
 * without waiting on a round-trip. The poll's row, once it lands, carries the
 * transcoder's actual reason and replaces this one.
 */
function fallbackProcessingRow(video: Video): ProcessingVideo | undefined {
  if (video.status !== 'failed') return undefined;
  return { videoId: video.id, status: 'failed', renditions: [] };
}

/** Which sort option a stat column asks for when it is clicked. */
function sortForField(field: SortField, current: VideoSortOption): VideoSortOption {
  if (field === 'views') return 'most_viewed';
  if (field === 'likes') return 'most_liked';
  return current === 'newest' ? 'oldest' : 'newest';
}

interface SortableHeaderProps {
  field: SortField;
  label: string;
  sort: VideoSortOption;
  onSort: (value: VideoSortOption) => void;
}

/**
 * The sort control *inside* a header cell — the `<th>` belongs to the caller.
 *
 * This used to render its own `<th>` while every call site already wrapped it
 * in one, which React reported as `validateDOMNesting: <th> cannot appear as a
 * child of <th>` and which the browser then un-nested behind our backs.
 */
const SortableHeader: React.FC<SortableHeaderProps> = ({ field, label, sort, onSort }) => {
  const active =
    (field === 'date' && (sort === 'newest' || sort === 'oldest')) ||
    (field === 'views' && sort === 'most_viewed') ||
    (field === 'likes' && sort === 'most_liked');
  const ascending = field === 'date' && sort === 'oldest';

  return (
    <button
      type="button"
      onClick={() => onSort(sortForField(field, sort))}
      className="group flex w-full items-center justify-end gap-1.5 text-right uppercase
                 tracking-wider transition-colors hover:text-[#fa7517] focus:outline-none
                 focus-visible:text-[#fa7517]"
      aria-label={`Sort by ${label}`}
    >
      {label}
      <span className="text-gray-500 transition-colors group-hover:text-[#fa7517]">
        {active ? (
          ascending ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
        )}
      </span>
    </button>
  );
};

interface VideoRowProps {
  video: Video;
  /** The poll's row for this video, or `undefined` while it has nothing to say. */
  processingRow?: ProcessingVideo;
  selected: boolean;
  /** True while this row's visibility flip is still in the air. */
  busy: boolean;
  isHighlighted: boolean;
  highlightLit: boolean;
  /** True only on the render that first shows this row. */
  animateIn: boolean;
  rowRef?: React.Ref<HTMLTableRowElement>;
  onSelect: (videoId: number, selected: boolean) => void;
  onEdit: (videoId: number) => void;
  onDelete: (videoId: number) => void;
  onCopyLink: (videoId: number) => void;
  onToggleVisibility: (videoId: number, next: boolean) => void;
  onRetryProcessing?: (videoId: number) => Promise<void>;
}

/** The fields the row actually paints. Anything else changing is not its news. */
function sameRow(previous: VideoRowProps, next: VideoRowProps): boolean {
  const a = previous.video;
  const b = next.video;
  if (
    a.id !== b.id ||
    a.title !== b.title ||
    a.description !== b.description ||
    a.duration !== b.duration ||
    a.is_public !== b.is_public ||
    a.status !== b.status ||
    a.createdAt !== b.createdAt ||
    a.views_count !== b.views_count ||
    a.likes_count !== b.likes_count ||
    getThumbnailUrl(a) !== getThumbnailUrl(b)
  ) {
    return false;
  }

  const p = previous.processingRow;
  const q = next.processingRow;
  if (p !== q) {
    if (!p || !q) return false;
    if (p.status !== q.status) return false;
    if (p.error?.message !== q.error?.message) return false;
    if (p.error?.code !== q.error?.code) return false;
    // Renditions are only ever read as "which quality, in what state".
    const pr = p.renditions ?? [];
    const qr = q.renditions ?? [];
    if (pr.length !== qr.length) return false;
    for (let i = 0; i < pr.length; i += 1) {
      if (pr[i].quality !== qr[i].quality || pr[i].state !== qr[i].state) return false;
    }
  }

  return (
    previous.selected === next.selected &&
    previous.busy === next.busy &&
    previous.isHighlighted === next.isHighlighted &&
    previous.highlightLit === next.highlightLit &&
    previous.animateIn === next.animateIn &&
    previous.rowRef === next.rowRef &&
    previous.onSelect === next.onSelect &&
    previous.onEdit === next.onEdit &&
    previous.onDelete === next.onDelete &&
    previous.onCopyLink === next.onCopyLink &&
    previous.onToggleVisibility === next.onToggleVisibility &&
    previous.onRetryProcessing === next.onRetryProcessing
  );
}

const VideoRow: React.FC<VideoRowProps> = ({
  video,
  processingRow,
  selected,
  busy,
  isHighlighted,
  highlightLit,
  animateIn,
  rowRef,
  onSelect,
  onEdit,
  onDelete,
  onCopyLink,
  onToggleVisibility,
  onRetryProcessing,
}) => {
  const row = processingRow ?? fallbackProcessingRow(video);
  const preview = descriptionToPreview(video.description);
  const playable = isPlayable(video.status);

  const handleEdit = useCallback(() => onEdit(video.id), [onEdit, video.id]);
  const handleDelete = useCallback(() => onDelete(video.id), [onDelete, video.id]);
  const handleCopyLink = useCallback(() => onCopyLink(video.id), [onCopyLink, video.id]);
  const handleToggle = useCallback(
    (next: boolean) => onToggleVisibility(video.id, next),
    [onToggleVisibility, video.id],
  );
  const handleRetry = useCallback(
    () => (onRetryProcessing ? onRetryProcessing(video.id) : Promise.resolve()),
    [onRetryProcessing, video.id],
  );
  const handleRetryFromMenu = useCallback(() => {
    void handleRetry();
  }, [handleRetry]);

  return (
    <motion.tr
      ref={rowRef}
      // A poll tick is not an arrival: only a row that has never been on screen
      // plays the enter animation, or the whole list re-animates every 5 s.
      initial={animateIn ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      data-highlighted={isHighlighted && highlightLit ? 'true' : undefined}
      // Below `md` the row stops being a table row and becomes a card: the
      // cells reflow as flex items onto two lines. One DOM either way — a
      // separate mobile list would duplicate every row and every control.
      className={`${styles.table.row} group flex flex-wrap items-start gap-x-3 gap-y-2
                  px-3 py-3 md:table-row md:p-0 border-l-2 ${
                    isHighlighted && highlightLit ? 'border-l-[#fa7517]' : 'border-l-transparent'
                  }`}
    >
      <td className="flex items-start pt-1 md:table-cell md:w-10 md:px-3 md:py-4 md:align-top">
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={selected}
          onChange={(event) => onSelect(video.id, event.target.checked)}
          aria-label={`Select ${video.title || 'Untitled'}`}
        />
      </td>

      <td
        className={`min-w-0 grow basis-[calc(100%_-_2.5rem)] md:table-cell md:w-full md:max-w-0
                    md:basis-auto ${styles.table.cellNext} md:align-top`}
      >
        <div className="flex items-start gap-3">
          <div className="relative w-28 shrink-0 sm:w-32">
            <img
              src={getThumbnailUrl(video)}
              alt=""
              className="aspect-video w-full rounded-lg object-cover"
              loading="lazy"
              onError={(event) => {
                const target = event.target as HTMLImageElement;
                target.src = '/assets/default-thumbnail.jpg';
              }}
            />
            <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] tabular-nums text-white">
              {formatDuration(video.duration)}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <button
              type="button"
              onClick={handleEdit}
              title={video.title || 'Untitled'}
              className="truncate text-left text-sm font-medium text-white transition-colors
                         hover:text-[#fa7517] focus:outline-none focus-visible:text-[#fa7517]"
            >
              {video.title || 'Untitled'}
            </button>

            {row ? (
              <div className="mt-1">
                <ProcessingStatus
                  videoId={video.id}
                  processingStatus={row}
                  onRetry={onRetryProcessing ? handleRetry : undefined}
                />
              </div>
            ) : preview ? (
              // One line, tags gone, line breaks turned into spaces — the cell
              // must never read "…filmées en 4KAbonnez-vous…".
              <p className="mt-1 truncate text-xs text-gray-400" title={preview}>
                {preview}
              </p>
            ) : (
              <p className="mt-1 truncate text-xs text-gray-600">
                No description ·{' '}
                <button
                  type="button"
                  onClick={handleEdit}
                  className="underline decoration-dotted underline-offset-2 transition-colors
                             hover:text-[#fa7517] focus:outline-none focus-visible:text-[#fa7517]"
                >
                  add one
                </button>
              </p>
            )}
          </div>
        </div>
      </td>

      <td className={`self-center ${styles.table.cellNext} md:table-cell md:w-[8.5rem] md:align-top`}>
        <VisibilitySwitch
          isPublic={video.is_public}
          canPublish={playable}
          busy={busy}
          title={video.title}
          onToggle={handleToggle}
        />
      </td>

      <td
        className={`self-center ${styles.table.cellNext} text-xs tabular-nums text-gray-400
                    md:table-cell md:w-24 md:text-right md:text-sm md:align-top`}
      >
        {formatRowDate(video.createdAt)}
      </td>
      <td
        className={`self-center ${styles.table.cellNext} text-xs tabular-nums text-gray-400
                    md:table-cell md:w-20 md:text-right md:text-sm md:align-top`}
        title="Views"
      >
        {(video.views_count ?? 0).toLocaleString()}
        <span className="ml-1 text-gray-600 md:hidden">views</span>
      </td>
      <td
        className={`self-center ${styles.table.cellNext} text-xs tabular-nums text-gray-400
                    md:table-cell md:w-20 md:text-right md:text-sm md:align-top`}
        title="Likes"
      >
        {(video.likes_count ?? 0).toLocaleString()}
        <span className="ml-1 text-gray-600 md:hidden">likes</span>
      </td>

      <td className={`ml-auto self-center ${styles.table.cellNext} md:ml-0 md:table-cell md:w-[11rem] md:align-top`}>
        <RowActions
          videoId={video.id}
          title={video.title}
          playable={playable}
          failed={video.status === 'failed' || processingRow?.status === 'failed'}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCopyLink={handleCopyLink}
          onRetry={onRetryProcessing ? handleRetryFromMenu : undefined}
        />
      </td>
    </motion.tr>
  );
};

const MemoVideoRow = React.memo(VideoRow, sameRow);

interface VideoListProps {
  videos: Video[];
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  processingVideos?: Record<number, ProcessingVideo>;
  onRetryProcessing?: (videoId: number) => Promise<void>;
  /** The video id to light up, already resolved from `?highlight=`. */
  highlightId?: string | null;
  sort: VideoSortOption;
  onSort: (value: VideoSortOption) => void;
  selectedIds: ReadonlySet<number>;
  busyIds: ReadonlySet<number>;
  onSelect: (videoId: number, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onEdit: (videoId: number) => void;
  onDelete: (videoId: number) => void;
  onCopyLink: (videoId: number) => void;
  onToggleVisibility: (videoId: number, next: boolean) => void;
  /** True when the empty list is empty *because of* a filter. */
  filtered: boolean;
  onClearFilters: () => void;
}

export const VideoList: React.FC<VideoListProps> = ({
  videos,
  isLoading,
  isFetchingMore,
  hasMore,
  onLoadMore,
  processingVideos,
  onRetryProcessing,
  highlightId,
  sort,
  onSort,
  selectedIds,
  busyIds,
  onSelect,
  onSelectAll,
  onEdit,
  onDelete,
  onCopyLink,
  onToggleVisibility,
  filtered,
  onClearFilters,
}) => {
  const highlightRowRef = useRef<HTMLTableRowElement | null>(null);
  const [highlightLit, setHighlightLit] = useState(false);
  /** Video ids already painted once, so a row never re-plays its arrival. */
  const seenIdsRef = useRef<Set<number>>(new Set());

  const highlightedVideoId = useMemo(() => {
    if (!highlightId) return null;
    const match = videos.find((video) => String(video.id) === highlightId);
    return match ? match.id : null;
  }, [videos, highlightId]);

  // Arriving from an upload: put the row on screen, light its edge briefly, and
  // then get out of the way. Nothing here is sticky.
  useEffect(() => {
    if (highlightedVideoId === null) {
      setHighlightLit(false);
      return;
    }
    const row = highlightRowRef.current;
    if (row && typeof row.scrollIntoView === 'function') {
      row.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    setHighlightLit(true);
    const timer = setTimeout(() => setHighlightLit(false), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightedVideoId]);

  // Which rows are new *this* render; committed to `seenIds` afterwards, so a
  // re-render of the same list animates nothing.
  const animateIds = useMemo(
    () => new Set(videos.filter((video) => !seenIdsRef.current.has(video.id)).map((v) => v.id)),
    [videos],
  );
  useEffect(() => {
    videos.forEach((video) => seenIdsRef.current.add(video.id));
  }, [videos]);

  const allSelected = videos.length > 0 && videos.every((video) => selectedIds.has(video.id));
  const someSelected = !allSelected && videos.some((video) => selectedIds.has(video.id));
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
  }, [someSelected]);

  if (isLoading && !videos.length) {
    return (
      <div className="divide-y divide-gray-800/20" data-testid="video-list-skeleton">
        {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-3 py-4 md:px-6">
            <div className="h-4 w-4 shrink-0 rounded bg-gray-800/50" />
            <div className="aspect-video w-28 shrink-0 animate-pulse rounded-lg bg-gray-800/50 sm:w-32" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="h-3.5 w-2/5 animate-pulse rounded bg-gray-800/50" />
              <div className="h-3 w-3/5 animate-pulse rounded bg-gray-800/30" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!videos.length) {
    return filtered ? (
      <motion.div
        className={styles.emptyState.wrapper}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <SearchX className="mb-4 h-12 w-12 text-gray-600" aria-hidden="true" />
        <div className={styles.emptyState.title}>Nothing matches</div>
        <div className={styles.emptyState.subtitle}>No video here fits the current filters.</div>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 rounded-lg border border-gray-800/50 px-4 py-2 text-sm text-white
                     transition-colors hover:border-[#fa7517]/40 hover:text-[#fa7517]
                     focus:outline-none focus-visible:ring-1 focus-visible:ring-[#fa7517]/60"
        >
          Clear filters
        </button>
      </motion.div>
    ) : (
      <motion.div
        className={styles.emptyState.wrapper}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <FileVideo className="mb-4 h-12 w-12 text-gray-600" aria-hidden="true" />
        <div className={styles.emptyState.title}>No videos yet</div>
        <div className={styles.emptyState.subtitle}>
          Everything you upload shows up here, ready to edit and publish.
        </div>
        <Link
          to="/creator-hub/content-studio"
          className="mt-4 rounded-lg bg-[#fa7517] px-4 py-2 text-sm font-medium text-black
                     transition-colors hover:bg-[#ff8c3a]"
        >
          Upload your first video
        </Link>
      </motion.div>
    );
  }

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="w-full">
        <table className="block w-full md:table">
          <thead className={`${styles.table.header} hidden md:table-header-group`}>
            <tr>
              <th className={`${styles.table.headerCell} w-10`}>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      className={styles.checkbox}
                      checked={allSelected}
                      onChange={(event) => onSelectAll(event.target.checked)}
                      aria-label={`Select all ${videos.length} loaded`}
                    />
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className={styles.tooltip} sideOffset={5}>
                      Select all {videos.length} loaded
                      <Tooltip.Arrow className="fill-gray-900" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </th>
              <th className={styles.table.headerCell}>Video</th>
              <th className={`${styles.table.headerCell} w-[8.5rem]`}>Visibility</th>
              <th className={`${styles.table.headerCell} w-24 text-right`}>
                <SortableHeader field="date" label="Date" sort={sort} onSort={onSort} />
              </th>
              <th className={`${styles.table.headerCell} w-20 text-right`}>
                <SortableHeader field="views" label="Views" sort={sort} onSort={onSort} />
              </th>
              <th className={`${styles.table.headerCell} w-20 text-right`}>
                <SortableHeader field="likes" label="Likes" sort={sort} onSort={onSort} />
              </th>
              <th className={`${styles.table.headerCell} w-[11rem]`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group">
            <AnimatePresence mode="popLayout">
              {videos.map((video) => {
                const isHighlighted = highlightedVideoId === video.id;
                return (
                  <MemoVideoRow
                    key={video.id}
                    video={video}
                    processingRow={processingVideos?.[video.id]}
                    selected={selectedIds.has(video.id)}
                    busy={busyIds.has(video.id)}
                    isHighlighted={isHighlighted}
                    highlightLit={highlightLit}
                    animateIn={animateIds.has(video.id)}
                    rowRef={isHighlighted ? highlightRowRef : undefined}
                    onSelect={onSelect}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onCopyLink={onCopyLink}
                    onToggleVisibility={onToggleVisibility}
                    onRetryProcessing={onRetryProcessing}
                  />
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>

        {hasMore && (
          <div className={styles.loadMore.wrapper}>
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isFetchingMore}
              className={styles.loadMore.button}
            >
              {isFetchingMore ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Loading…
                </>
              ) : (
                'Load more'
              )}
            </button>
          </div>
        )}
      </div>
    </Tooltip.Provider>
  );
};

export default VideoList;
