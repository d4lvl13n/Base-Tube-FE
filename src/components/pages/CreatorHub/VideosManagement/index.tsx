import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import { getChannelVideos } from '../../../../api/channel';
import { updateVideo, deleteVideo, retryVideoProcessing } from '../../../../api/video';
import { VideoAction, VideoFilters, SortField, SortState } from './types';
import { VideoList } from './components/VideoList/videolist';
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

const VideosManagement: React.FC = () => {
  // State management
  const [page, setPage] = useState(1);
  const [filters] = useState<VideoFilters>({});
  const [videos, setVideos] = useState<Video[]>([]);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<Video | null>(null);
  const { selectedChannelId, channels, selectedChannel, isLoading: isChannelsLoading } = useChannelSelection();

  // `?highlight=<videoId|uploadId>` — how the upload pages hand a creator over
  // to the row they just created.
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  // Add sort state
  const [sort, setSort] = useState<SortState>({
    field: 'date',
    direction: 'desc'
  });

  // `failed` belongs here too: without it the poll never returns a row for a
  // failed video, so the list showed no status and no Retry — the one state
  // where the creator actually has something to do.
  const processingVideoIds = useMemo(() => {
    return videos
      .filter(v => v.status === 'pending' || v.status === 'processing' || v.status === 'failed')
      .map(v => v.id);
  }, [videos]);
  
  const { processingVideos, restart: restartProcessingPoll } = useVideoProcessing(processingVideoIds);

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

  // Fetch videos with react-query
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch
  } = useQuery<PaginatedResponse>({
    queryKey: ['channelVideos', selectedChannelId, page, filters],
    queryFn: () => getChannelVideos(selectedChannelId, page),
    enabled: !!selectedChannelId && !!selectedChannel && channels.length > 0 && !isChannelsLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // The list was fetched before the worker created this video, so the row to
  // highlight is not in it. One refetch per resolved id — enough to bring the
  // row in, and never a loop when the id genuinely is not ours.
  useEffect(() => {
    if (resolvedHighlightId === null || refetchedForRef.current === resolvedHighlightId) return;
    if (videos.some((video) => String(video.id) === resolvedHighlightId)) return;
    refetchedForRef.current = resolvedHighlightId;
    void refetch();
  }, [refetch, resolvedHighlightId, videos]);

  // Calculate hasMore outside of handleLoadMore
  const hasMore = data ? page < data.pagination.totalPages : false;

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!isFetching && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [isFetching, hasMore]);

  // Update videos state when data changes
  React.useEffect(() => {
    if (data) {
      if (page === 1) {
        setVideos(data.data);
      } else {
        setVideos(prev => [...prev, ...data.data]); 
      }
    }
  }, [data, page]);

  // Handle video update
  const handleUpdateVideo = async (videoId: string, formData: FormData) => {
    try {
      const result = await updateVideo(videoId, formData);
      if (result.success) {
        setVideos(prevVideos => 
          prevVideos.map(v => 
            v.id.toString() === videoId ? result.data! : v
          )
        );
        toast.success('Video updated successfully');
      } else {
        toast.error(result.message || 'Failed to update video');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update video';
      toast.error(message);
      console.error('Update error:', error);
    }
  };

  // Handle video deletion
  const handleDeleteVideo = async (videoId: string) => {
    try {
      const result = await deleteVideo(videoId);
      if (result.success) {
        setVideos(prevVideos => 
          prevVideos.filter(v => v.id.toString() !== videoId)
        );
        toast.success('Video deleted successfully');
      } else {
        toast.error(result.message || 'Failed to delete video');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete video';
      toast.error(message);
      console.error('Delete error:', error);
    }
    setDeletingVideo(null);
  };

  // Handle a failed transcode. The backend owns the retry; this only asks.
  //
  // The retry reuses the video id, so both caches of "this one failed" have to
  // be dropped — the list's own `status` and the poll's terminal row — or the
  // row stays red and the poll never asks about it again.
  const handleRetryProcessing = useCallback(async (videoId: number) => {
    try {
      const result = await retryVideoProcessing(videoId);
      if (result.success) {
        setVideos(prevVideos =>
          prevVideos.map(v => (v.id === videoId ? { ...v, status: 'pending' } : v))
        );
        restartProcessingPoll([videoId]);
        toast.success('Processing restarted');
      } else {
        toast.error(result.message || 'Failed to restart processing');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restart processing';
      toast.error(message);
    }
  }, [restartProcessingPoll]);

  // Handle sort
  const handleSort = useCallback((field: SortField) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Sort videos
  const sortedVideos = useMemo(() => {
    return [...videos].sort((a, b) => {
      const modifier = sort.direction === 'asc' ? 1 : -1;
      
      switch (sort.field) {
        case 'views':
          return (a.views_count - b.views_count) * modifier;
        case 'likes':
          return (a.likes_count - b.likes_count) * modifier;
        case 'date':
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * modifier;
        case 'status':
          return (a.is_public === b.is_public ? 0 : a.is_public ? 1 : -1) * modifier;
        default:
          return 0;
      }
    });
  }, [videos, sort]);

  if (error) {
    return <div className="p-6 text-red-500">Failed to load videos</div>;
  }

  if (editingVideo) {
    return (
      <div className="relative pt-24">
        <div className="px-4 md:px-6 max-w-[1920px] mx-auto">
          <EditVideoModal
            video={editingVideo}
            isOpen={!!editingVideo}
            onClose={() => setEditingVideo(null)}
            onUpdate={handleUpdateVideo}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative pt-24">
      <div className="px-4 md:px-6 space-y-6 max-w-[1920px] mx-auto">
        <div className="overflow-hidden rounded-lg border border-gray-800/30">
          <VideoList
            videos={sortedVideos}
            processingVideos={processingVideos}
            onRetryProcessing={handleRetryProcessing}
            highlightId={resolvedHighlightId}
            isLoading={isLoading}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onVideoAction={async (videoId: string, action: VideoAction, formData?: FormData) => {
              switch (action) {
                case 'edit':
                  if (formData) {
                    await handleUpdateVideo(videoId, formData);
                  } else {
                    const video = videos.find(v => v.id.toString() === videoId);
                    if (video) setEditingVideo(video);
                  }
                  break;
                case 'delete':
                  const video = videos.find(v => v.id.toString() === videoId);
                  if (video) setDeletingVideo(video);
                  break;
              }
            }}
            sort={sort}
            onSort={handleSort}
          />
        </div>
        {deletingVideo && (
          <DeleteConfirmationDialog
            isOpen={!!deletingVideo}
            onClose={() => setDeletingVideo(null)}
            onConfirm={() => handleDeleteVideo(deletingVideo.id.toString())}
            title="Delete Video"
            message={`Are you sure you want to delete "${deletingVideo.title}"? This action cannot be undone.`}
          />
        )}
      </div>
    </div>
  );
};

export default VideosManagement;
