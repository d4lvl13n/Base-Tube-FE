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
import { Checkbox } from './Checkbox';
import { useCompactLayout } from './useCompactLayout';
import { descriptionToPreview } from '../../../../../../utils/descriptionText';

/** How long the orange edge stays lit after arriving from an upload. */
const HIGHLIGHT_MS = 1_500;

/** Placeholder rows while the very first page is in flight. */
const SKELETON_ROWS = 6;

/** Anything with `.has(id)`: a Set of ids, or a Map keyed by them. */
export interface IdLookup {
  has(id: number): boolean;
}

/**
 * A row is either a table row or a card, and only ever one of them.
 *
 * The two are the same component with the same data, the same handlers and the
 * same JSX body — what differs is the element each cell is rendered as and the
 * classes that place it.
 */
export type RowLayout = 'table' | 'card';

/**
 * Where each cell sits, per layout.
 *
 * The table is ordinary: fixed-width columns, and `w-full max-w-0` on the
 * video cell so it takes the leftover width and truncates inside it.
 *
 * The card is an explicit six-column grid rather than a wrap heuristic. Every
 * cell names its own row and column, so there is no arithmetic to get wrong
 * and no way for one cell to end up on the wrong line: the checkbox and the
 * video own line one, and visibility · date · views · likes · actions form the
 * strip underneath.
 */
const CELLS: Record<RowLayout, Record<string, string>> = {
  table: {
    row: styles.table.row,
    checkbox: `${styles.table.cell} w-10`,
    main: `${styles.table.cell} w-full max-w-0`,
    visibility: `${styles.table.cell} w-[8.5rem]`,
    date: `${styles.table.cell} w-24 text-right ${styles.stat}`,
    views: `${styles.table.cell} w-20 text-right ${styles.stat}`,
    likes: `${styles.table.cell} w-20 text-right ${styles.stat}`,
    actions: `${styles.table.cell} w-[9.5rem]`,
  },
  card: {
    row: `${styles.table.row} grid grid-cols-[auto_minmax(0,1fr)_auto_auto_auto_auto]
          items-center gap-x-3 gap-y-2.5 px-3 py-3`,
    checkbox: 'col-start-1 row-start-1 self-start pt-1',
    main: 'col-start-2 col-span-5 row-start-1 min-w-0',
    visibility: 'col-start-1 col-span-2 row-start-2',
    date: `col-start-3 row-start-2 ${styles.stat}`,
    views: `col-start-4 row-start-2 ${styles.stat}`,
    likes: `col-start-5 row-start-2 ${styles.stat}`,
    actions: 'col-start-6 row-start-2 justify-self-end',
  },
};

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
      className="group flex w-full items-center justify-end gap-1.5 uppercase tracking-wider
                 transition-colors hover:text-gray-300 focus-visible:outline-none
                 focus-visible:text-gray-300"
      aria-label={`Sort by ${label}`}
    >
      {label}
      <span className="text-gray-600">
        {active ? (
          ascending ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100" />
        )}
      </span>
    </button>
  );
};

interface VideoRowProps {
  layout: RowLayout;
  video: Video;
  /** The poll's row for this video, or `undefined` while it has nothing to say. */
  processingRow?: ProcessingVideo;
  selected: boolean;
  /** True once anything at all is selected: the tick boxes stop hiding. */
  selecting: boolean;
  /** True while this row's visibility flip is still in the air. */
  busy: boolean;
  isHighlighted: boolean;
  highlightLit: boolean;
  /** True only on the render that first shows this row. */
  animateIn: boolean;
  rowRef?: React.Ref<HTMLElement>;
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
    previous.layout === next.layout &&
    previous.selected === next.selected &&
    previous.selecting === next.selecting &&
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
  layout,
  video,
  processingRow,
  selected,
  selecting,
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
  const cell = CELLS[layout];

  const handleEdit = useCallback(() => onEdit(video.id), [onEdit, video.id]);
  const handleDelete = useCallback(() => onDelete(video.id), [onDelete, video.id]);
  const handleCopyLink = useCallback(() => onCopyLink(video.id), [onCopyLink, video.id]);
  const handleSelect = useCallback(
    (checked: boolean) => onSelect(video.id, checked),
    [onSelect, video.id],
  );
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

  const Row = (layout === 'table' ? motion.tr : motion.li) as typeof motion.tr;
  const Cell = (layout === 'table' ? 'td' : 'div') as 'td';

  return (
    <Row
      ref={rowRef as React.Ref<HTMLTableRowElement>}
      // A poll tick is not an arrival: only a row that has never been on screen
      // plays the enter animation, or the whole list re-animates every 5 s.
      initial={animateIn ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      data-highlighted={isHighlighted && highlightLit ? 'true' : undefined}
      className={`${cell.row} ${
        isHighlighted && highlightLit ? 'bg-[#fa7517]/[0.06]' : ''
      }`}
    >
      <Cell className={cell.checkbox}>
        <Checkbox
          checked={selected}
          onChange={handleSelect}
          label={`Select ${video.title || 'Untitled'}`}
          // Tick boxes are clutter until they are the point. Once anything is
          // selected they all stay put, so the next one is where you expect.
          className={selected || selecting ? undefined : styles.revealed}
        />
      </Cell>

      <Cell className={cell.main}>
        <div className="flex items-center gap-3">
          <div className="relative w-32 shrink-0">
            <img
              src={getThumbnailUrl(video)}
              alt=""
              className="aspect-video w-full rounded-lg bg-black/40 object-cover"
              loading="lazy"
              onError={(event) => {
                const target = event.target as HTMLImageElement;
                target.src = '/assets/default-thumbnail.jpg';
              }}
            />
            <span
              className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-px text-[10px]
                         tabular-nums text-gray-200"
            >
              {formatDuration(video.duration)}
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <button
              type="button"
              onClick={handleEdit}
              title={video.title || 'Untitled'}
              className={styles.title}
            >
              {video.title || 'Untitled'}
            </button>

            {row ? (
              <ProcessingStatus
                videoId={video.id}
                processingStatus={row}
                onRetry={onRetryProcessing ? handleRetry : undefined}
              />
            ) : preview ? (
              // One line, tags gone, line breaks turned into spaces — the cell
              // must never read "…filmées en 4KAbonnez-vous…".
              <p className={styles.preview} title={preview}>
                {preview}
              </p>
            ) : (
              <p className="truncate text-xs text-gray-600">
                No description ·{' '}
                <button
                  type="button"
                  onClick={handleEdit}
                  className="underline decoration-dotted underline-offset-2 transition-colors
                             hover:text-[#fa7517] focus-visible:outline-none
                             focus-visible:text-[#fa7517]"
                >
                  add one
                </button>
              </p>
            )}
          </div>
        </div>
      </Cell>

      <Cell className={cell.visibility}>
        <VisibilitySwitch
          isPublic={video.is_public}
          canPublish={playable}
          busy={busy}
          title={video.title}
          onToggle={handleToggle}
        />
      </Cell>

      <Cell className={cell.date}>{formatRowDate(video.createdAt)}</Cell>
      <Cell className={cell.views}>{(video.views_count ?? 0).toLocaleString()}</Cell>
      <Cell className={cell.likes}>{(video.likes_count ?? 0).toLocaleString()}</Cell>

      <Cell className={cell.actions}>
        <div className={styles.revealed}>
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
        </div>
      </Cell>
    </Row>
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
  selectedIds: IdLookup & { size?: number };
  busyIds: IdLookup;
  selecting: boolean;
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
  selecting,
  onSelect,
  onSelectAll,
  onEdit,
  onDelete,
  onCopyLink,
  onToggleVisibility,
  filtered,
  onClearFilters,
}) => {
  // One question to the browser, one layout. Reflowing `<tr>`/`<td>` from
  // table to flex with `md:` overrides is a chain that half-applies when
  // anything upstream changes — and when it half-applies, the desktop gets the
  // phone's layout with no warning.
  const compact = useCompactLayout();
  const layout: RowLayout = compact ? 'card' : 'table';

  const highlightRowRef = useRef<HTMLElement | null>(null);
  const [highlightLit, setHighlightLit] = useState(false);
  /** Video ids already painted once, so a row never re-plays its arrival. */
  const seenIdsRef = useRef<Set<number>>(new Set());

  const highlightedVideoId = useMemo(() => {
    if (!highlightId) return null;
    const match = videos.find((video) => String(video.id) === highlightId);
    return match ? match.id : null;
  }, [videos, highlightId]);

  // Arriving from an upload: put the row on screen, light it briefly, and then
  // get out of the way. Nothing here is sticky.
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

  if (isLoading && !videos.length) {
    return (
      <div className={styles.divider} data-testid="video-list-skeleton">
        {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-4 py-3">
            <div className="h-4 w-4 shrink-0 rounded bg-white/5" />
            <div className="aspect-video w-32 shrink-0 animate-pulse rounded-lg bg-white/5" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="h-3.5 w-2/5 animate-pulse rounded bg-white/5" />
              <div className="h-3 w-3/5 animate-pulse rounded bg-white/[0.03]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!videos.length) {
    return filtered ? (
      <div className={styles.emptyState.wrapper}>
        <SearchX className="h-8 w-8 text-gray-600" aria-hidden="true" />
        <p className={`mt-4 ${styles.emptyState.title}`}>Nothing matches</p>
        <p className={styles.emptyState.subtitle}>No video here fits the current filters.</p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 rounded-md border border-gray-800/60 px-3 py-1.5 text-sm text-gray-300
                     transition-colors hover:border-gray-700 hover:text-white
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/40"
        >
          Clear filters
        </button>
      </div>
    ) : (
      <div className={styles.emptyState.wrapper}>
        <FileVideo className="h-8 w-8 text-gray-600" aria-hidden="true" />
        <p className={`mt-4 ${styles.emptyState.title}`}>No videos yet</p>
        <p className={styles.emptyState.subtitle}>
          Everything you upload shows up here, ready to edit and publish.
        </p>
        <Link
          to="/creator-hub/content-studio"
          className="mt-4 rounded-md bg-[#fa7517] px-3.5 py-2 text-sm font-medium text-black
                     transition-colors hover:bg-[#ff8c3a] focus-visible:outline-none
                     focus-visible:ring-2 focus-visible:ring-[#fa7517]/60"
        >
          Upload your first video
        </Link>
      </div>
    );
  }

  const rows = videos.map((video) => {
    const isHighlighted = highlightedVideoId === video.id;
    return (
      <MemoVideoRow
        key={video.id}
        layout={layout}
        video={video}
        processingRow={processingVideos?.[video.id]}
        selected={selectedIds.has(video.id)}
        selecting={selecting}
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
  });

  const selectAll = (
    <Checkbox
      checked={allSelected}
      indeterminate={someSelected}
      onChange={onSelectAll}
      label={`Select all ${videos.length} loaded`}
    />
  );

  return (
    <Tooltip.Provider delayDuration={300}>
      {layout === 'table' ? (
        <table className="w-full">
          <thead className={styles.table.header}>
            <tr>
              <th className={`${styles.table.headerCell} w-10`}>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <span className="inline-flex">{selectAll}</span>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className={styles.tooltip} sideOffset={6}>
                      Select all {videos.length} loaded
                      <Tooltip.Arrow className="fill-[#0f0f0f]" />
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
              <th className={`${styles.table.headerCell} w-[9.5rem]`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className={styles.divider}>
            <AnimatePresence initial={false}>{rows}</AnimatePresence>
          </tbody>
        </table>
      ) : (
        <>
          <div className="flex items-center gap-3 border-b border-gray-800/60 px-3 py-2.5">
            {selectAll}
            <span className="text-[11px] uppercase tracking-wider text-gray-500">
              {videos.length} loaded
            </span>
          </div>
          <ul className={styles.divider}>
            <AnimatePresence initial={false}>{rows}</AnimatePresence>
          </ul>
        </>
      )}

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
    </Tooltip.Provider>
  );
};

export default VideoList;
