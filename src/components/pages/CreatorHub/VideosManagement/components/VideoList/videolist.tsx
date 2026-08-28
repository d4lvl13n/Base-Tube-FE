import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Edit2, Trash2, Eye, EyeOff, FileVideo, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { VideoAction } from '../../types';
import { Video } from '../../../../../../types/video';
import { styles } from './styles';
import { formatDuration, getThumbnailUrl } from './utils';
import { ProcessingVideo } from '../../../../../../hooks/useVideoProcessing';
import { SortField, SortState } from '../../types';
import * as Tooltip from '@radix-ui/react-tooltip';
import { ProcessingStatus } from './processingstatus';
import { descriptionToPreview } from '../../../../../../utils/descriptionText';

interface VideoListProps {
  videos: Video[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onVideoAction: (videoId: string, action: VideoAction, formData?: FormData) => Promise<void>;
  processingVideos?: Record<number, ProcessingVideo>;
  onRetryProcessing?: (videoId: number) => Promise<void>;
  /** The video id to light up, already resolved from `?highlight=`. */
  highlightId?: string | null;
  sort?: SortState;
  onSort?: (field: SortField) => void;
}

/** How long the orange edge stays lit after arriving from an upload. */
const HIGHLIGHT_MS = 1_500;

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

interface SortableHeaderProps {
  field: SortField;
  label: string;
  currentSort?: SortState;
  onSort?: (field: SortField) => void;
}

/**
 * The sort control *inside* a header cell — the `<th>` belongs to the caller.
 *
 * This used to render its own `<th>` while every call site already wrapped it
 * in one, which React reported as `validateDOMNesting: <th> cannot appear as a
 * child of <th>` and which the browser then un-nested behind our backs.
 */
const SortableHeader: React.FC<SortableHeaderProps> = ({ field, label, currentSort, onSort }) => {
  const isActive = currentSort?.field === field;

  return (
    <button
      type="button"
      onClick={() => onSort?.(field)}
      className="group flex w-full items-center gap-2 text-left uppercase tracking-wider
                 transition-colors hover:text-[#fa7517] focus:outline-none
                 focus-visible:text-[#fa7517]"
      aria-label={`Sort by ${label}`}
    >
      {label}
      <span className="text-gray-500 transition-colors group-hover:text-[#fa7517]">
        {isActive ? (
          currentSort.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
        ) : (
          <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-100" />
        )}
      </span>
    </button>
  );
};

interface VideoRowProps {
  video: Video;
  /** The poll's row for this video, or `undefined` while it has nothing to say. */
  processingRow?: ProcessingVideo;
  isHighlighted: boolean;
  highlightLit: boolean;
  /** True only on the render that first shows this row. */
  animateIn: boolean;
  rowRef?: React.Ref<HTMLTableRowElement>;
  onVideoAction: (videoId: string, action: VideoAction, formData?: FormData) => Promise<void>;
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
    previous.isHighlighted === next.isHighlighted &&
    previous.highlightLit === next.highlightLit &&
    previous.animateIn === next.animateIn &&
    previous.rowRef === next.rowRef &&
    previous.onVideoAction === next.onVideoAction &&
    previous.onRetryProcessing === next.onRetryProcessing
  );
}

const VideoRow: React.FC<VideoRowProps> = ({
  video,
  processingRow,
  isHighlighted,
  highlightLit,
  animateIn,
  rowRef,
  onVideoAction,
  onRetryProcessing,
}) => {
  const row = processingRow ?? fallbackProcessingRow(video);
  const preview = descriptionToPreview(video.description) || 'No description';
  const handleRetry = useCallback(
    () => (onRetryProcessing ? onRetryProcessing(video.id) : Promise.resolve()),
    [onRetryProcessing, video.id],
  );

  return (
    <motion.tr
      ref={rowRef}
      // A poll tick is not an arrival: only a row that has never been on screen
      // plays the enter animation, or the whole list re-animates every 5 s.
      initial={animateIn ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      data-highlighted={isHighlighted && highlightLit ? 'true' : undefined}
      className={`${styles.table.row} border-l-2 ${
        isHighlighted && highlightLit ? 'border-l-[#fa7517]' : 'border-l-transparent'
      }`}
    >
      <td className={`${styles.table.cell} w-[600px] min-w-[600px] max-w-[600px]`}>
        <div className="flex items-start space-x-3">
          <div className="w-28 flex-shrink-0 relative">
            <img
              src={getThumbnailUrl(video)}
              alt={video.title || 'Video thumbnail'}
              className="w-full aspect-video object-cover rounded-lg"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/assets/default-thumbnail.jpg';
              }}
            />
            <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-xs text-white">
              {formatDuration(video.duration)}
            </div>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <h3 className="text-sm font-medium truncate">{video.title || 'Untitled'}</h3>
            {/* One line, tags gone, line breaks turned into spaces — the cell
                must never read "…filmées en 4KAbonnez-vous…". */}
            <p className="text-xs text-gray-400 mt-1 truncate break-words" title={preview}>
              {preview}
            </p>
            {row && (
              <div className="mt-2">
                <ProcessingStatus
                  videoId={video.id}
                  processingStatus={row}
                  onRetry={onRetryProcessing ? handleRetry : undefined}
                />
              </div>
            )}
          </div>
        </div>
      </td>
      <td className={`${styles.table.cell} w-[70px]`}>
        <div className={video.is_public ? styles.status.public : styles.status.private}>
          {video.is_public ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {video.is_public ? 'Public' : 'Private'}
        </div>
      </td>
      <td className={`${styles.table.cell} w-[80px] hidden lg:table-cell text-sm text-gray-400`}>
        {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
      </td>
      <td className={`${styles.table.cell} w-[60px] hidden lg:table-cell text-sm text-gray-400`}>
        {video.views_count?.toLocaleString() ?? '0'}
      </td>
      <td className={`${styles.table.cell} w-[60px] hidden lg:table-cell text-sm text-gray-400`}>
        {video.likes_count?.toLocaleString() ?? '0'}
      </td>
      <td className={`${styles.table.cell} w-[70px]`}>
        <div className="flex items-center justify-end gap-2">
          <Tooltip.Provider delayDuration={300}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  className={styles.actionButton}
                  onClick={() => onVideoAction(video.id.toString(), 'edit')}
                >
                  <Edit2 className={styles.actionIcon} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className={styles.tooltip} sideOffset={5}>
                  Edit video
                  <Tooltip.Arrow className="fill-gray-900" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>

            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  className={styles.actionButton}
                  onClick={() => onVideoAction(video.id.toString(), 'delete')}
                >
                  <Trash2 className={`${styles.actionIcon} group-hover:text-red-500`} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className={styles.tooltip} sideOffset={5}>
                  Delete video
                  <Tooltip.Arrow className="fill-gray-900" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>
      </td>
    </motion.tr>
  );
};

const MemoVideoRow = React.memo(VideoRow, sameRow);

export const VideoList: React.FC<VideoListProps> = ({
  videos,
  isLoading,
  hasMore,
  onLoadMore,
  onVideoAction,
  processingVideos,
  onRetryProcessing,
  highlightId,
  sort,
  onSort,
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

  if (isLoading && !videos.length) {
    return (
      <motion.div
        className="flex justify-center items-center h-64"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="w-8 h-8 text-[#fa7517]" />
        </motion.div>
      </motion.div>
    );
  }

  if (!videos.length) {
    return (
      <motion.div
        className={styles.emptyState.wrapper}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <FileVideo className="w-12 h-12 text-gray-500 mb-4" />
        <div className={styles.emptyState.title}>No videos found</div>
        <div className={styles.emptyState.subtitle}>Try adjusting your filters or upload some videos</div>
      </motion.div>
    );
  }

  return (
    <div className="overflow-x-auto w-full">
      <div className="min-w-full inline-block align-middle">
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-800/30">
            <thead className={styles.table.header}>
              <tr>
                <th className={`${styles.table.headerCell} w-[600px] min-w-[600px] max-w-[600px]`}>Video</th>
                <th className={`${styles.table.headerCell} w-[70px]`}>
                  <SortableHeader field="status" label="Visibility" currentSort={sort} onSort={onSort} />
                </th>
                <th className={`${styles.table.headerCell} w-[80px] hidden lg:table-cell`}>
                  <SortableHeader field="date" label="Date" currentSort={sort} onSort={onSort} />
                </th>
                <th className={`${styles.table.headerCell} w-[60px] hidden lg:table-cell`}>
                  <SortableHeader field="views" label="Views" currentSort={sort} onSort={onSort} />
                </th>
                <th className={`${styles.table.headerCell} w-[60px] hidden lg:table-cell`}>
                  <SortableHeader field="likes" label="Likes" currentSort={sort} onSort={onSort} />
                </th>
                <th className={`${styles.table.headerCell} w-[70px]`}></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {videos.map((video) => {
                  const isHighlighted = highlightedVideoId === video.id;
                  return (
                    <MemoVideoRow
                      key={video.id}
                      video={video}
                      processingRow={processingVideos?.[video.id]}
                      isHighlighted={isHighlighted}
                      highlightLit={highlightLit}
                      animateIn={animateIds.has(video.id)}
                      rowRef={isHighlighted ? highlightRowRef : undefined}
                      onVideoAction={onVideoAction}
                      onRetryProcessing={onRetryProcessing}
                    />
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VideoList;
