import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getChannelVideos } from '../../../../api/channel';
import { VideoAction, VideoFilters } from './types';
import VideoList from './components/VideoList';
import VideoActions from './components/VideoActions';
import VideoFiltersComponent from './components/VideoFilters';
import { toast } from 'react-toastify';
import { useChannelSelection } from '../../../../contexts/ChannelSelectionContext';
import { Video } from '../../../../types/video';
import { ChannelVideosResponse } from '../../../../types/channel';

const VideosManagement: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<VideoFilters>({});
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const { selectedChannelId } = useChannelSelection();

  const {
    data,
    isLoading,
    isFetching,
    error
  } = useQuery<ChannelVideosResponse>({
    queryKey: ['channelVideos', selectedChannelId, page],
    queryFn: () => getChannelVideos(selectedChannelId, page),
    enabled: !!selectedChannelId,
    staleTime: 1000 * 60 * 5,
  });

  React.useEffect(() => {
    if (data) {
      if (page === 1) {
        setVideos(data.data);
      } else {
        setVideos(prev => [...prev, ...data.data]);
      }
    }
  }, [data, page]);

  const handleLoadMore = () => {
    if (!isFetching && data?.pagination.page && data?.pagination.totalPages && data?.pagination.page < data?.pagination.totalPages) {
      setPage(prev => prev + 1);
    }
  };

  const handleVideoAction = async (videoId: string, action: VideoAction) => {
    try {
      switch(action) {
        case 'edit':
          // Navigate to edit page
          break;
        case 'delete':
          // Show confirmation dialog
          break;
        case 'toggle_visibility':
          // Toggle video visibility
          break;
        default:
          throw new Error(`Unsupported action: ${action}`);
      }
    } catch (error) {
      toast.error('Failed to perform action');
      console.error('Video action error:', error);
    }
  };

  const handleBulkAction = async (action: VideoAction) => {
    try {
      if (!selectedVideos.length) return;
      
      for (const videoId of selectedVideos) {
        await handleVideoAction(videoId, action);
      }
    } catch (error) {
      toast.error('Failed to perform bulk action');
      console.error('Bulk action error:', error);
    }
  };

  const handleVideoSelect = (videoId: string) => {
    setSelectedVideos(prev => 
      prev.includes(videoId)
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const handleSelectAll = (videoIds: string[]) => {
    setSelectedVideos(videoIds);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#09090B]">
        <div className="flex">
          <main className="flex-1 p-6">
            <p className="text-red-500 text-center">Failed to load videos</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B]">
      <div className="flex">
        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Video Management</h1>
            <VideoActions 
              selectedVideos={selectedVideos}
              onBulkAction={handleBulkAction}
            />
          </div>

          <VideoFiltersComponent
            filters={filters}
            onFilterChange={setFilters}
          />

          <VideoList
            videos={videos}
            isLoading={isLoading}
            onLoadMore={handleLoadMore}
            hasMore={data ? data.pagination.page < data.pagination.totalPages : false}
            onVideoAction={handleVideoAction}
            selectedVideos={selectedVideos}
            onVideoSelect={handleVideoSelect}
            onSelectAll={handleSelectAll}
          />
        </main>
      </div>
    </div>
  );
};

export default VideosManagement; 