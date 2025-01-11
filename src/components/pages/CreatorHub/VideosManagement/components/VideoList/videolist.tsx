import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Edit2, Trash2, Eye, EyeOff, FileVideo, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, ThumbsUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { VideoAction } from '../../types';
import { Video } from '../../../../../../types/video';
import { ProcessingStatus } from './processingstatus';
import { styles } from './styles';
import { formatDuration, getThumbnailUrl } from './utils';
import { ProcessingVideo } from '../../../../../../hooks/useVideoProcessing';
import EditVideoModal from '../../EditVideoModal';
import { SortField, SortState } from '../../types';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as AlertDialog from '@radix-ui/react-alert-dialog';

interface VideoListProps {
  videos: Video[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onVideoAction: (videoId: string, action: VideoAction, formData?: FormData) => Promise<void>;
  onRetryProcessing?: (videoId: number) => void;
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
  onRetryProcessing,
  sort,
  onSort,
  processingVideos,
}) => {
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  const [deletingVideo, setDeletingVideo] = useState<Video | null>(null);

  const handleAction = async (videoId: string, action: VideoAction) => {
    const actionKey = `${videoId}-${action}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    try {
      await onVideoAction(videoId, action);
    } finally {
      setLoadingActions(prev => {
        const newState = { ...prev };
        delete newState[actionKey];
        return newState;
      });
    }
  };

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
    <div className={styles.container}>
      <div className={styles.table.wrapper}>
        <ErrorBoundary fallback={
          <div className="p-4 text-red-400 bg-red-400/10 rounded-lg">
            <AlertCircle className="w-5 h-5 inline-block mr-2" />
            Something went wrong displaying the video list. 
            <button 
              onClick={() => window.location.reload()}
              className="ml-2 underline hover:text-red-300"
            >
              Refresh page
            </button>
          </div>
        }>
          <table className="w-full">
            <thead className={styles.table.header}>
              <tr>
                <th className={styles.table.headerCell}>Video</th>
                <SortableHeader field="status" label="Visibility" currentSort={sort} onSort={onSort} />
                <th className="hidden md:table-cell">
                  <SortableHeader field="date" label="Date" currentSort={sort} onSort={onSort} />
                </th>
                <th className="hidden md:table-cell">
                  <SortableHeader field="views" label="Views" currentSort={sort} onSort={onSort} />
                </th>
                <th className="hidden md:table-cell">
                  <SortableHeader field="likes" label="Likes" currentSort={sort} onSort={onSort} />
                </th>
                <th className="hidden md:table-cell">Duration</th>
                <th className={`${styles.table.headerCell} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/30">
              <AnimatePresence mode="popLayout">
                {videos.map((video) => (
                  <motion.tr
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                    layoutId={`video-${video.id}`}
                    transition={{
                      layout: { duration: 0.3 },
                      opacity: { duration: 0.2 },
                    }}
                    className={styles.table.row}
                  >
                    <td className={styles.table.cell}>
                      <div className="flex items-center space-x-3">
                        <motion.div 
                          className={styles.thumbnail.wrapper}
                          layoutId={`thumbnail-${video.id}`}
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="relative w-full h-full">
                            <img
                              src={getThumbnailUrl(video)}
                              alt={video.title || 'Video thumbnail'}
                              className={`${styles.thumbnail.image} transition-opacity duration-200`}
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/assets/default-thumbnail.jpg';
                              }}
                            />
                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded text-xs text-white backdrop-blur-sm">
                              {formatDuration(video.duration)}
                            </div>
                          </div>
                        </motion.div>
                        <div className="flex flex-col gap-2 flex-grow">
                          <div>
                            <div className={styles.videoInfo.title}>
                              {video.title || 'Untitled'}
                            </div>
                            <div className={styles.videoInfo.description}>
                              {video.description || 'No description'}
                            </div>
                          </div>
                          <ProcessingStatus 
                            videoId={video.id} 
                            processingStatus={processingVideos?.[video.id]}
                            onRetry={async () => {
                              try {
                                const confirmed = window.confirm('Are you sure you want to retry processing this video?');
                                if (!confirmed) return;

                                const actionKey = `${video.id}-retry`;
                                setLoadingActions(prev => ({ ...prev, [actionKey]: true }));

                                await onRetryProcessing?.(video.id);

                                console.log('Processing retry initiated successfully');
                              } catch (error) {
                                console.error('Failed to retry processing:', error);
                              } finally {
                                setLoadingActions(prev => {
                                  const newState = { ...prev };
                                  delete newState[`${video.id}-retry`];
                                  return newState;
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className={styles.table.mobileInfo}>
                        <div className={styles.table.mobileStats}>
                          <div className={styles.table.mobileStat}>
                            <Eye className="w-3 h-3" />
                            {video.views_count?.toLocaleString() ?? '0'} views
                          </div>
                          <div className={styles.table.mobileStat}>
                            <ThumbsUp className="w-3 h-3" />
                            {video.likes_count?.toLocaleString() ?? '0'} likes
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </td>
                    <td className={styles.table.cell}>
                      <div className={video.is_public ? styles.status.public : styles.status.private}>
                        <motion.div className="flex items-center gap-1.5">
                          {video.is_public ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {video.is_public ? 'Public' : 'Private'}
                        </motion.div>
                      </div>
                    </td>
                    <td className={`${styles.table.cell} hidden md:table-cell text-sm text-gray-400`}>
                      {video.createdAt 
                        ? formatDistanceToNow(new Date(video.createdAt), { addSuffix: true }) 
                        : 'Unknown'}
                    </td>
                    <td className={`${styles.table.cell} hidden md:table-cell text-sm text-gray-400`}>
                      {video.views_count?.toLocaleString() ?? '0'}
                    </td>
                    <td className={`${styles.table.cell} hidden md:table-cell text-sm text-gray-400`}>
                      {video.likes_count?.toLocaleString() ?? '0'}
                    </td>
                    <td className={`${styles.table.cell} hidden md:table-cell text-sm text-gray-400`}>
                      {formatDuration(video.duration)}
                    </td>
                    <td className={`${styles.table.cell} text-right`}>
                      <div className="flex items-center justify-end gap-2">
                        <Tooltip.Provider delayDuration={300}>
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <motion.button
                                className={styles.actionButton}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setEditingVideo(video)}
                                disabled={loadingActions[`${video.id}-edit`]}
                              >
                                {loadingActions[`${video.id}-edit`] ? (
                                  <RefreshCw className={`${styles.actionIcon} animate-spin`} />
                                ) : (
                                  <Edit2 className={styles.actionIcon} />
                                )}
                              </motion.button>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content
                                className={styles.tooltip}
                                sideOffset={5}
                              >
                                Edit video
                                <Tooltip.Arrow className="fill-gray-900" />
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>

                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <motion.button
                                className={styles.actionButton}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setDeletingVideo(video)}
                                disabled={loadingActions[`${video.id}-delete`]}
                              >
                                {loadingActions[`${video.id}-delete`] ? (
                                  <RefreshCw className={`${styles.actionIcon} animate-spin text-red-500`} />
                                ) : (
                                  <Trash2 className={`${styles.actionIcon} group-hover:text-red-500`} />
                                )}
                              </motion.button>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content
                                className={styles.tooltip}
                                sideOffset={5}
                              >
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
        </ErrorBoundary>
      </div>
      
      {hasMore && (
        <div className={styles.loadMore.wrapper}>
          <motion.button
            onClick={onLoadMore}
            className={styles.loadMore.button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Load More
          </motion.button>
        </div>
      )}

      <AlertDialog.Root open={!!deletingVideo} onOpenChange={() => setDeletingVideo(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 p-6 rounded-lg max-w-md w-full">
            <AlertDialog.Title className="text-lg font-bold mb-4">
              Delete Video
            </AlertDialog.Title>
            <AlertDialog.Description className="text-gray-400 mb-6">
              Are you sure you want to delete this video? This action cannot be undone.
            </AlertDialog.Description>
            <div className="flex justify-end gap-4">
              <AlertDialog.Cancel asChild>
                <button className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700">
                  Cancel
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                  onClick={() => {
                    if (deletingVideo) {
                      handleAction(deletingVideo.id.toString(), 'delete');
                      setDeletingVideo(null);
                    }
                  }}
                >
                  Delete
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      {editingVideo && (
        <EditVideoModal
          video={editingVideo}
          isOpen={!!editingVideo}
          onClose={() => setEditingVideo(null)}
          onUpdate={async (videoId, formData) => {
            await onVideoAction(videoId, 'edit', formData);
            setEditingVideo(null);
          }}
        />
      )}
    </div>
  );
};

export default VideoList;

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}