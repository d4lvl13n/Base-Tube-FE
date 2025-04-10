import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  ThumbsUp, 
  MessageCircle, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  Percent,
  List,
  BarChart2,
  Play,
  Loader as LoaderIcon,
  Filter,
  Search,
  Eye,
  Timer
} from 'lucide-react';
import { useDetailedVideoPerformance } from '../../../../../hooks/useDetailedVideoPerformance';
import StatsCard from '../../../CreatorHub/StatsCard';
import { Select } from '../../../../ui/Select';
import { formatDuration } from '../../../../../utils/format';
import Loader from '../../../../common/Loader';

// Helper to format time duration in minutes and seconds
const formatWatchTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};

// Calculate viewthrough rate (views to completion percentage)
const calculateViewthroughRate = (avgPercentage: number): string => {
  return `${avgPercentage.toFixed(1)}%`;
};

// Format date in a more readable format
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  });
};

// Helper to get the period description
const getPeriodDescription = (period: string): string => {
  switch (period) {
    case '7d':
      return 'Last 7 days';
    case '30d':
      return 'Last 30 days';
    case '90d':
      return 'Last 90 days';
    default:
      return 'All time';
  }
};

export const DetailedVideoPerformanceTab: React.FC<{ channelId: string }> = ({ channelId }) => {
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredVideos, setFilteredVideos] = useState<any[]>([]);
  const [showHelpTips, setShowHelpTips] = useState<boolean>(false);
  
  // Use our custom hook with initial sort by creation date (newest first)
  const { 
    videos,
    pagination,
    isLoading,
    isFetching,
    isPlaceholderData,
    error,
    currentPage,
    sortBy,
    sortOrder,
    period,
    limit,
    setPage,
    setLimit,
    handleSort,
    handlePeriodChange
  } = useDetailedVideoPerformance(channelId, {
    initialLimit: rowsPerPage,
    initialSortBy: 'createdAt',
    initialSortOrder: 'desc',
    initialPeriod: 'all'
  });

  // Keep local rowsPerPage state in sync with the hook's limit
  useEffect(() => {
    setRowsPerPage(limit);
  }, [limit]);

  // Filter videos by title when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVideos(videos);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      setFilteredVideos(
        videos.filter(video => 
          video.title.toLowerCase().includes(lowercaseSearch)
        )
      );
    }
  }, [videos, searchTerm]);

  // Function to handle rows per page change
  const handleRowsPerPageChange = (value: string) => {
    const newLimit = parseInt(value);
    setRowsPerPage(newLimit);
    setLimit(newLimit);
    // Reset to page 1 when changing limit
    setPage(1);
  };

  // Function to determine sort icon for a column
  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === 'desc' ? 
      <ChevronDown className="w-4 h-4 inline-block ml-1" /> : 
      <ChevronUp className="w-4 h-4 inline-block ml-1" />;
  };

  // Function to handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && (!pagination || newPage <= pagination.totalPages)) {
      setPage(newPage);
    }
  };

  // Calculate average metrics for filtered videos
  const avgRetention = filteredVideos.length > 0 
    ? (filteredVideos.reduce((sum, video) => sum + video.average_percentage_viewed, 0) / filteredVideos.length).toFixed(1) 
    : '0';
  
  const engagementRate = filteredVideos.length > 0 
    ? ((filteredVideos.reduce((sum, video) => sum + video.likes, 0) / filteredVideos.reduce((sum, video) => sum + video.views, 0)) * 100).toFixed(1)
    : '0';
    
  const avgWatchDuration = filteredVideos.length > 0
    ? filteredVideos.reduce((sum, video) => sum + video.average_watch_duration_seconds, 0) / filteredVideos.length
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Detailed Video Performance</h2>
          <p className="text-gray-400">In-depth analytics for each video on your channel</p>
        </div>

        {/* Time Period Filter */}
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-400 flex items-center">
            <Filter className="w-4 h-4 mr-1" />
            Publication Period:
          </div>
          <Select
            value={period}
            onValueChange={(value) => handlePeriodChange(value as 'all' | '7d' | '30d' | '90d')}
            options={[
              { value: 'all', label: 'All Time' },
              { value: '7d', label: 'Last 7 Days' },
              { value: '30d', label: 'Last 30 Days' },
              { value: '90d', label: 'Last 90 Days' },
            ]}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={Play}
          title="Total Videos"
          value={pagination?.total.toLocaleString() ?? '0'}
          change={0}
          loading={isLoading}
          subtitle={`${getPeriodDescription(period)}`}
        />
        <StatsCard
          icon={Eye}
          title="Total Views"
          value={filteredVideos.reduce((sum, video) => sum + video.views, 0).toLocaleString()}
          change={0}
          loading={isLoading}
          subtitle={`Across all videos`}
        />
        <StatsCard
          icon={Timer}
          title="Avg. Watch Time"
          value={formatWatchTime(avgWatchDuration)}
          change={0}
          loading={isLoading}
          subtitle={`Average session duration`}
        />
        <StatsCard
          icon={Percent}
          title="Avg. Retention"
          value={`${avgRetention}%`}
          change={0}
          loading={isLoading}
          subtitle={`Video completion rate`}
        />
      </div>

      {/* Videos Performance Table */}
      <div className="bg-black/50 p-6 rounded-xl border border-gray-800/50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold flex items-center">
            <List className="mr-2 text-[#fa7517]" /> Video Performance Metrics
            <span className="text-sm font-normal text-gray-400 ml-2">
              ({getPeriodDescription(period)})
            </span>
            <button 
              className="ml-2 text-xs text-gray-400 hover:text-white border border-gray-700 rounded-full h-5 w-5 flex items-center justify-center"
              onClick={() => setShowHelpTips(!showHelpTips)}
              title="Toggle metric explanations"
            >
              ?
            </button>
          </h3>
          <div className="flex items-center gap-3">
            {isFetching && (
              <div className="text-gray-400 flex items-center">
                <LoaderIcon className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm">Updating...</span>
              </div>
            )}
            <div className="relative">
              <input
                type="text"
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-4 py-1 bg-black/30 border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#fa7517] text-white w-48"
              />
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
              {searchTerm && (
                <button 
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={() => setSearchTerm('')}
                >
                  ×
                </button>
              )}
            </div>
            <Select
              value={rowsPerPage.toString()}
              onValueChange={(value) => handleRowsPerPageChange(value)}
              options={[
                { value: '5', label: '5 per page' },
                { value: '10', label: '10 per page' },
                { value: '20', label: '20 per page' },
                { value: '50', label: '50 per page' },
              ]}
            />
          </div>
        </div>

        {showHelpTips && (
          <div className="mb-4 text-sm bg-black/30 p-3 rounded-lg text-gray-300">
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <li><span className="text-white font-medium">Views:</span> Total number of times the video has been viewed</li>
              <li><span className="text-white font-medium">Likes:</span> Total number of likes received</li>
              <li><span className="text-white font-medium">Comments:</span> Total number of comments received</li>
              <li><span className="text-white font-medium">Avg. Watch Time:</span> Average duration viewers watch the video</li>
              <li><span className="text-white font-medium">Retention:</span> Average percentage of the video watched</li>
              <li><span className="text-white font-medium">Published:</span> Date when the video was uploaded</li>
            </ul>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-gray-400 text-sm border-b border-gray-800">
              <tr>
                <th className="py-3 pl-2 pr-2 font-medium">Video</th>
                <th 
                  className="py-3 px-2 font-medium text-right cursor-pointer"
                  onClick={() => handleSort('views')}
                >
                  <div className="flex items-center justify-end">
                    <Eye className="w-3 h-3 mr-1" />
                    <span>Views</span> 
                    {getSortIcon('views')}
                  </div>
                </th>
                <th 
                  className="py-3 px-2 font-medium text-right cursor-pointer"
                  onClick={() => handleSort('likes')}
                >
                  <div className="flex items-center justify-end">
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    <span>Likes</span> 
                    {getSortIcon('likes')}
                  </div>
                </th>
                <th 
                  className="py-3 px-2 font-medium text-right cursor-pointer"
                  onClick={() => handleSort('comments')}
                >
                  <div className="flex items-center justify-end">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    <span>Comments</span> 
                    {getSortIcon('comments')}
                  </div>
                </th>
                <th 
                  className="py-3 px-2 font-medium text-right cursor-pointer"
                  onClick={() => handleSort('average_watch_duration_seconds')}
                >
                  <div className="flex items-center justify-end">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>Watch Time</span> 
                    {getSortIcon('average_watch_duration_seconds')}
                  </div>
                </th>
                <th 
                  className="py-3 px-2 font-medium text-right cursor-pointer"
                  onClick={() => handleSort('average_percentage_viewed')}
                >
                  <div className="flex items-center justify-end">
                    <Percent className="w-3 h-3 mr-1" />
                    <span>Retention</span> 
                    {getSortIcon('average_percentage_viewed')}
                  </div>
                </th>
                <th 
                  className="py-3 px-2 font-medium text-right cursor-pointer"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center justify-end">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>Published</span> 
                    {getSortIcon('createdAt')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-20">
                    <div className="flex flex-col items-center justify-center">
                      <LoaderIcon className="w-8 h-8 text-[#fa7517] animate-spin mb-2" />
                      <p className="text-gray-400">Loading video data...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-20">
                    <div className="flex flex-col items-center justify-center">
                      <BarChart2 className="w-8 h-8 text-red-400 mb-2" />
                      <p className="text-red-400">Error loading data. Please try again.</p>
                      <p className="text-sm text-red-400/70 mt-1">{error.message}</p>
                    </div>
                  </td>
                </tr>
              ) : filteredVideos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20">
                    <div className="flex flex-col items-center justify-center">
                      <BarChart2 className="w-8 h-8 text-gray-500 mb-2" />
                      <p className="text-gray-400">
                        {searchTerm 
                          ? `No videos found matching "${searchTerm}"`
                          : "No videos found for this channel."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVideos.map(video => (
                  <tr key={video.id} className="hover:bg-black/30 transition-colors">
                    <td className="py-4 pl-2 pr-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-9 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                          <img 
                            src={video.thumbnail_url || '/placeholder-thumbnail.jpg'}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-thumbnail.jpg';
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <a
                            href={`/video/${video.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-white hover:text-[#fa7517] text-sm truncate block transition-colors"
                            title={video.title}
                          >
                            <div className="flex items-center">
                              <span className="truncate max-w-[150px] md:max-w-[200px] lg:max-w-[250px]">
                                {video.title}
                              </span>
                              <ExternalLink className="w-3 h-3 ml-1 text-gray-400" />
                            </div>
                          </a>
                          <span className="text-xs text-gray-500 truncate max-w-[150px] md:max-w-[200px] block">
                            {formatDuration(video.duration)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right font-medium text-[#fa7517]">
                      {video.views.toLocaleString()}
                    </td>
                    <td className="py-4 px-2 text-right text-green-400">
                      {video.likes.toLocaleString()}
                      <span className="text-xs text-gray-500 ml-1">
                        ({((video.likes / (video.views || 1)) * 100).toFixed(1)}%)
                      </span>
                    </td>
                    <td className="py-4 px-2 text-right text-blue-400">
                      {video.comments.toLocaleString()}
                    </td>
                    <td className="py-4 px-2 text-right text-yellow-400">
                      {formatWatchTime(video.average_watch_duration_seconds)}
                    </td>
                    <td className="py-4 px-2 text-right">
                      {calculateViewthroughRate(video.average_percentage_viewed)}
                    </td>
                    <td className="py-4 px-2 text-right text-gray-400">
                      {formatDate(video.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && !searchTerm && (
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Showing {((currentPage - 1) * rowsPerPage) + 1}-
              {Math.min(currentPage * rowsPerPage, pagination.total)} of {pagination.total} videos
            </div>
            <div className="flex items-center space-x-1">
              <button
                className="p-2 rounded hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-transparent"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1 || isLoading}
                aria-label="First page"
              >
                <ChevronLeft className="w-4 h-4" />
                <ChevronLeft className="w-4 h-4 -ml-2" />
              </button>
              <button
                className="p-2 rounded hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-transparent"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 py-1 bg-black/30 rounded">
                {currentPage} / {pagination.totalPages}
              </div>
              <button
                className="p-2 rounded hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-transparent"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages || isLoading}
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                className="p-2 rounded hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-transparent"
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={currentPage === pagination.totalPages || isLoading}
                aria-label="Last page"
              >
                <ChevronRight className="w-4 h-4" />
                <ChevronRight className="w-4 h-4 -ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Table Legend */}
        <div className="mt-4 text-sm bg-black/30 p-3 rounded-lg text-gray-400">
          <p>
            <span className="font-medium text-white">Video Performance Metrics</span> provide insights into how your content performs. 
            Watch Time indicates how long viewers spend on your videos, while Retention shows what percentage of the video they typically watch.
            Higher retention rates correlate with algorithm promotion and overall content health.
          </p>
        </div>
      </div>
    </div>
  );
}; 