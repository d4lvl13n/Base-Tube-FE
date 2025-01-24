import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getChannelVideos } from '../../../../api/channel';
import { updateVideo, deleteVideo } from '../../../../api/video';
import { VideoAction, VideoFilters, SortField, SortState } from './types';
import { VideoList } from './components/VideoList/videolist';
import EditVideoModal from './EditVideoModal';
import DeleteConfirmationDialog from '../../../common/DeleteConfirmationDialog';
import { Video } from '../../../../types/video';
import { useChannelSelection } from '../../../../contexts/ChannelSelectionContext';
import { useVideoProcessing } from '../../../../hooks/useVideoProcessing';

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
  const { selectedChannelId } = useChannelSelection();

  // Add sort state
  const [sort, setSort] = useState<SortState>({
    field: 'date',
    direction: 'desc'
  });

  const processingVideoIds = videos
    .filter(v => v.status === 'pending' || v.status === 'processing')
    .map(v => v.id);
  
  const { processingVideos } = useVideoProcessing(processingVideoIds);

  // Fetch videos with react-query
  const {
    data,
    isLoading,
    isFetching,
    error
  } = useQuery<PaginatedResponse>({
    queryKey: ['channelVideos', selectedChannelId, page, filters],
    queryFn: () => getChannelVideos(selectedChannelId, page),
    enabled: !!selectedChannelId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

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

  return (
    <div className="relative pt-24">
      <div className="px-4 md:px-6 space-y-6 max-w-[1920px] mx-auto">
        <div className="overflow-hidden rounded-lg border border-gray-800/30">
          <VideoList
            videos={sortedVideos}
            processingVideos={processingVideos}
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

        {editingVideo && (
          <EditVideoModal
            video={editingVideo}
            isOpen={!!editingVideo}
            onClose={() => setEditingVideo(null)}
            onUpdate={handleUpdateVideo}
          />
        )}

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