import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getChannelVideos } from '../../../../api/channel';
import { updateVideo, deleteVideo } from '../../../../api/video';
import { VideoAction, VideoFilters } from './types';
import VideoList from './components/VideoList';
import VideoActions from './components/VideoActions';
import VideoFiltersComponent from './components/VideoFilters';
import EditVideoModal from './EditVideoModal';
import DeleteConfirmationDialog from '../../../common/DeleteConfirmationDialog';
import { Video } from '../../../../types/video';
import { useChannelSelection } from '../../../../contexts/ChannelSelectionContext';

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
  const [filters, setFilters] = useState<VideoFilters>({});
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<Video | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { selectedChannelId } = useChannelSelection();

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

  // Handle video actions (edit, delete, visibility)
  const handleVideoAction = useCallback(async (videoId: string, action: VideoAction) => {
    const video = videos.find(v => v.id.toString() === videoId);
    if (!video) return;

    switch (action) {
      case 'edit':
        setEditingVideo(video);
        break;
        
      case 'delete':
        setDeletingVideo(video);
        break;
        
      case 'toggle_visibility':
        if (!isUpdating) {
          const formData = new FormData();
          formData.append('is_public', (!video.is_public).toString());
          handleUpdateVideo(videoId, formData);
        }
        break;
    }
  }, [videos, isUpdating]);

  // Handle video update
  const handleUpdateVideo = async (videoId: string, formData: FormData) => {
    setIsUpdating(true);
    try {
      const result = await updateVideo(videoId, formData);
      if (result.success && result.data) {
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
    } finally {
      setIsUpdating(false);
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
        setSelectedVideos(prev => 
          prev.filter(id => id !== videoId)
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

  // Handle bulk actions
  const handleBulkAction = async (action: VideoAction) => {
    if (!selectedVideos.length) return;
    
    try {
      for (const videoId of selectedVideos) {
        await handleVideoAction(videoId, action);
      }
      setSelectedVideos([]); // Clear selection after bulk action
    } catch (error) {
      toast.error('Failed to perform bulk action');
      console.error('Bulk action error:', error);
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: VideoFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset pagination when filters change
  };

  if (error) {
    return <div className="p-6 text-red-500">Failed to load videos</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <VideoFiltersComponent
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {selectedVideos.length > 0 && (
        <VideoActions
          selectedVideos={selectedVideos}
          onBulkAction={handleBulkAction}
        />
      )}

      <VideoList
        videos={videos}
        isLoading={isLoading}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        onVideoAction={handleVideoAction}
        selectedVideos={selectedVideos}
        onVideoSelect={(videoId) => {
          setSelectedVideos(prev => 
            prev.includes(videoId) 
              ? prev.filter(id => id !== videoId)
              : [...prev, videoId]
          );
        }}
        onSelectAll={(videoIds) => {
          setSelectedVideos(prev => 
            prev.length === videoIds.length ? [] : videoIds
          );
        }}
      />

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
  );
};

export default VideosManagement; 