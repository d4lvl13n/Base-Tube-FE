import React from 'react';
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

interface VideoListProps {
  videos: Video[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onVideoAction: (videoId: string, action: VideoAction, formData?: FormData) => Promise<void>;
  processingVideos?: Record<number, ProcessingVideo>;
  sort?: SortState;
  onSort?: (field: SortField) => void;
}

interface SortableHeaderProps {
  field: SortField;
  label: string;
  currentSort?: SortState;
  onSort?: (field: SortField) => void;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ field, label, currentSort, onSort }) => {
  const isActive = currentSort?.field === field;
  
  return (
    <th 
      className={`${styles.table.headerCell} cursor-pointer group`}
      onClick={() => onSort?.(field)}
    >
      <div className="flex items-center gap-2">
        {label}
        <div className="text-gray-500 transition-colors group-hover:text-[#fa7517]">
          {isActive ? (
            currentSort.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
          ) : (
            <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-100" />
          )}
        </div>
      </div>
    </th>
  );
};

export const VideoList: React.FC<VideoListProps> = ({
  videos,
  isLoading,
  hasMore,
  onLoadMore,
  onVideoAction,
  processingVideos,
  sort,
  onSort,
}) => {
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
                <th className="w-[600px] min-w-[600px] max-w-[600px] px-4 py-3.5">Video</th>
                <th className="w-[70px] px-4 py-3.5">
                  <SortableHeader field="status" label="Visibility" currentSort={sort} onSort={onSort} />
                </th>
                <th className="w-[80px] hidden lg:table-cell px-4 py-3.5">
                  <SortableHeader field="date" label="Date" currentSort={sort} onSort={onSort} />
                </th>
                <th className="w-[60px] hidden lg:table-cell px-4 py-3.5">
                  <SortableHeader field="views" label="Views" currentSort={sort} onSort={onSort} />
                </th>
                <th className="w-[60px] hidden lg:table-cell px-4 py-3.5">
                  <SortableHeader field="likes" label="Likes" currentSort={sort} onSort={onSort} />
                </th>
                <th className="w-[70px] px-4 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {videos.map((video) => (
                  <motion.tr
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={styles.table.row}
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
                          <h3 className="text-sm font-medium truncate">
                            {video.title || 'Untitled'}
                          </h3>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2 break-words">
                            {video.description || 'No description'}
                          </p>
                          {processingVideos?.[video.id] && (
                            <div className="mt-2">
                              <ProcessingStatus
                                videoId={video.id}
                                processingStatus={processingVideos[video.id]}
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
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VideoList;