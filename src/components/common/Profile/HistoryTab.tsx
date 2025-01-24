import React from 'react';
import { motion } from 'framer-motion';
import { History, Play, Clock, Eye, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useWatchHistory } from '../../../hooks/useWatchHistory';
import { formatDuration } from '../../pages/CreatorHub/VideosManagement/components/VideoList/utils';
import Loader from '../Loader';
import Error from '../Error';

interface HistoryTabProps {
  errors: {
    profile: string;
    wallet: string;
    settings: string;
  }
}

const VIDEO_BASE_URL = '/video';

const HistoryTab: React.FC<HistoryTabProps> = ({ errors }) => {
  const {
    watchHistory,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
  } = useWatchHistory();

  if (isLoading) return <Loader />;
  if (isError) return <Error message="Failed to load watch history" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden"
        style={{
          boxShadow: `
            0 0 20px 5px rgba(250, 117, 23, 0.1),
            0 0 40px 10px rgba(250, 117, 23, 0.05),
            inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
          `
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-900/50 rounded-lg">
              <History className="w-5 h-5 text-[#fa7517]" />
            </div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              Watch History
            </h2>
          </div>

          {watchHistory.length > 0 ? (
            <div className="space-y-4">
              {watchHistory.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gray-900/50 rounded-lg flex items-start gap-4"
                >
                  {/* Make thumbnail clickable */}
                  <a 
                    href={`${VIDEO_BASE_URL}/${entry.video?.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-40 h-24 rounded-lg overflow-hidden group relative"
                  >
                    <img
                      src={entry.video?.thumbnail_url}
                      alt={entry.video?.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </a>

                  {/* Video Info */}
                  <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white hover:text-[#fa7517] flex-grow">
                        <a 
                          href={`${VIDEO_BASE_URL}/${entry.video?.id}`}
                          target="_blank"
                          rel="noopener noreferrer" 
                          className="hover:underline"
                        >
                          {entry.video?.title}
                        </a>
                      </h3>
                      <a 
                        href={`${VIDEO_BASE_URL}/${entry.video?.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-lg hover:bg-gray-800/50 transition-colors"
                        title="Open video in new tab"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-400 hover:text-[#fa7517]" />
                      </a>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(entry.video?.duration)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Play className="w-4 h-4" />
                        <span>
                          {entry.video?.duration 
                            ? `${Math.round((entry.durationWatched / entry.video.duration) * 100)}% watched`
                            : '0% watched'
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{entry.video?.views_count} views</span>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      Watched {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No watch history available
            </div>
          )}

          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              className="mt-4 w-full py-2 bg-gray-900/50 text-gray-400 rounded-lg hover:bg-gray-800/50 transition-colors"
            >
              Load More
            </button>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
        
        <motion.div
          className="absolute inset-0 bg-[#fa7517] opacity-0 blur-2xl transition-opacity duration-300"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 0.03 }}
        />
      </motion.div>
    </motion.div>
  );
};

export default HistoryTab;