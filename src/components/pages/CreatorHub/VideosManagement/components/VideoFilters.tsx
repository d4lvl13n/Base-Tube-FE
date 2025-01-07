import React from 'react';
import { Search } from 'lucide-react';
import { VideoFiltersProps, VideoSortOption, VideoVisibilityOption } from '../types';

const VideoFilters: React.FC<VideoFiltersProps> = ({ filters, onFilterChange }) => {
  const handleSortChange = (value: VideoSortOption) => {
    onFilterChange({ ...filters, sortBy: value });
  };

  const handleVisibilityChange = (value: VideoVisibilityOption) => {
    onFilterChange({ ...filters, visibility: value });
  };

  return (
    <div className="mb-6 flex flex-wrap gap-4 items-center">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search videos..."
            className="w-full pl-10 pr-4 py-2 bg-gray-900/30 border border-gray-800/30 rounded-lg focus:outline-none focus:border-[#fa7517] text-white"
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <select
          className="px-4 py-2 bg-gray-900/30 border border-gray-800/30 rounded-lg focus:outline-none focus:border-[#fa7517] text-white"
          value={filters.sortBy || 'newest'}
          onChange={(e) => handleSortChange(e.target.value as VideoSortOption)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="most_viewed">Most Viewed</option>
          <option value="most_liked">Most Liked</option>
        </select>

        <select
          className="px-4 py-2 bg-gray-900/30 border border-gray-800/30 rounded-lg focus:outline-none focus:border-[#fa7517] text-white"
          value={filters.visibility || 'all'}
          onChange={(e) => handleVisibilityChange(e.target.value as VideoVisibilityOption)}
        >
          <option value="all">All Videos</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
          <option value="unlisted">Unlisted</option>
        </select>
      </div>
    </div>
  );
};

export default VideoFilters; 