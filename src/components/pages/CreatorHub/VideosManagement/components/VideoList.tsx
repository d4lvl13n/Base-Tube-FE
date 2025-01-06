import React from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, MoreVertical } from 'lucide-react';
import { VideoListProps } from '../types';
import { formatDistanceToNow } from 'date-fns';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Video } from '../../../../../types/video';

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getThumbnailUrl = (video: Video): string => {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
  
  if (video.thumbnail_url) {
    return video.thumbnail_url;
  }
  
  if (video.thumbnail_path?.startsWith('http')) {
    return video.thumbnail_path;
  }
  
  return video.thumbnail_path ? `${API_BASE_URL}/${video.thumbnail_path}` : '/assets/default-thumbnail.jpg';
};

const VideoList: React.FC<VideoListProps> = ({
  videos,
  isLoading,
  onLoadMore,
  hasMore,
  onVideoAction,
  selectedVideos,
  onVideoSelect,
  onSelectAll
}) => {
  if (isLoading && !videos.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#fa7517]"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/30 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-8">
                <input
                  type="checkbox"
                  className="rounded border-gray-600 text-[#fa7517] focus:ring-[#fa7517]"
                  checked={videos.length > 0 && selectedVideos.length === videos.length}
                  onChange={(e) => onSelectAll(e.target.checked ? videos.map(v => v.id.toString()) : [])}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Video
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Visibility
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Views
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Likes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/30">
            {videos.map((video) => (
              <motion.tr
                key={video.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-gray-800/30"
              >
                <td className="px-6 py-4 whitespace-nowrap w-8">
                  <input
                    type="checkbox"
                    className="rounded border-gray-600 text-[#fa7517] focus:ring-[#fa7517]"
                    checked={selectedVideos.includes(video.id.toString())}
                    onChange={() => onVideoSelect(video.id.toString())}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-32 h-20 rounded-md overflow-hidden bg-gray-800">
                      <img
                        src={getThumbnailUrl(video)}
                        alt={video.title || 'Video thumbnail'}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/assets/default-thumbnail.jpg';
                        }}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{video.title || 'Untitled'}</div>
                      <div className="text-sm text-gray-400">
                        {video.description ? `${video.description.substring(0, 50)}...` : 'No description'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {video.is_public ? (
                      <Eye className="h-4 w-4 text-[#fa7517] mr-2" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400 mr-2" />
                    )}
                    <span className="text-sm capitalize">{video.is_public ? 'Public' : 'Private'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {video.createdAt ? formatDistanceToNow(new Date(video.createdAt), { addSuffix: true }) : 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {video.views_count?.toLocaleString() ?? '0'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {video.likes_count?.toLocaleString() ?? '0'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {formatDuration(video.duration)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="p-1 hover:bg-gray-800/50 rounded-full">
                        <MoreVertical className="h-5 w-5 text-gray-400" />
                      </button>
                    </DropdownMenu.Trigger>
                    
                    <DropdownMenu.Content className="min-w-[160px] bg-gray-900 rounded-lg p-1 shadow-lg">
                      <DropdownMenu.Item className="text-white px-2 py-1.5 text-sm hover:bg-gray-800 rounded cursor-pointer"
                        onClick={() => onVideoAction(video.id.toString(), 'edit')}>
                        Edit
                      </DropdownMenu.Item>
                      <DropdownMenu.Item className="text-red-400 px-2 py-1.5 text-sm hover:bg-gray-800 rounded cursor-pointer"
                        onClick={() => onVideoAction(video.id.toString(), 'delete')}>
                        Delete
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {hasMore && (
        <div className="flex justify-center py-4">
          <button
            onClick={onLoadMore}
            className="px-4 py-2 bg-gray-800/50 text-white rounded-lg hover:bg-gray-700/50 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoList; 