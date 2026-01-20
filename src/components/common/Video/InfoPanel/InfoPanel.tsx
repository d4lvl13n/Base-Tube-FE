import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Heart, Calendar, Clock, ExternalLink, Twitter, Instagram, Facebook } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Video } from '../../../../types/video';
import { Channel } from '../../../../types/channel';
import { SubscribeButton } from '../../buttons/SubscribeButton';
import RichTextDisplay from '../../RichTextDisplay';

interface InfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  video: Video;
  channel: Channel | null;
}

const formatNumber = (num: number): string => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${secs}s`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const InfoPanel: React.FC<InfoPanelProps> = ({
  isOpen,
  onClose,
  video,
  channel
}) => {
  const navigate = useNavigate();

  const channelImageUrl = channel?.channel_image_url ||
    (channel?.channel_image_path?.startsWith('http')
      ? channel.channel_image_path
      : channel?.channel_image_path
        ? `${process.env.REACT_APP_API_URL}/${channel.channel_image_path}`
        : '/assets/default-avatar.jpg');

  const handleChannelClick = () => {
    if (channel) {
      navigate(`/channel/${channel.handle || channel.id}`);
      onClose();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{
              x: 0,
              transition: {
                type: "spring",
                damping: 25,
                stiffness: 120,
              }
            }}
            exit={{
              x: '100%',
              transition: {
                type: "spring",
                damping: 30,
                stiffness: 200,
              }
            }}
            className="fixed right-0 top-0 h-full w-[420px] max-w-[90vw] z-[56] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glass container */}
            <div className="h-full bg-[#0a0a0a]/95 backdrop-blur-2xl border-l border-white/5 flex flex-col">

              {/* Accent line */}
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#fa7517] via-[#fa7517]/20 to-transparent" />

              {/* Header with close button */}
              <div className="flex items-center justify-between p-4">
                <span className="text-xs font-medium uppercase tracking-widest text-gray-500">Video Info</span>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </motion.button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">

                {/* Channel Banner Section - AT THE TOP */}
                {channel && (
                  <div className="px-4 pb-4">
                    {/* Channel banner image - shorter aspect ratio */}
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="relative w-full aspect-[21/9] rounded-xl overflow-hidden cursor-pointer ring-1 ring-white/10"
                      onClick={handleChannelClick}
                    >
                      <img
                        src={channelImageUrl}
                        alt={channel.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      {/* Channel info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="text-white font-semibold truncate text-lg">
                          {channel.name}
                        </h3>
                        <p className="text-sm text-gray-300">
                          {formatNumber(channel.subscribers_count)} subscribers
                        </p>
                      </div>
                    </motion.div>

                    {/* Subscribe + Social row */}
                    <div className="flex items-center gap-2 mt-3">
                      <SubscribeButton
                        channelId={channel.id}
                        className="flex-1 !rounded-xl !py-2.5 text-sm"
                      />

                      {/* Social links */}
                      {(channel.twitter_link || channel.instagram_link || channel.facebook_link) && (
                        <div className="flex items-center gap-1">
                          {channel.twitter_link && (
                            <a
                              href={channel.twitter_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                            >
                              <Twitter className="w-4 h-4 text-gray-400" />
                            </a>
                          )}
                          {channel.instagram_link && (
                            <a
                              href={channel.instagram_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                            >
                              <Instagram className="w-4 h-4 text-gray-400" />
                            </a>
                          )}
                          {channel.facebook_link && (
                            <a
                              href={channel.facebook_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                            >
                              <Facebook className="w-4 h-4 text-gray-400" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-white/5" />

                {/* Video Title Section */}
                <div className="p-5">
                  <h1 className="text-xl font-bold text-white leading-tight mb-4">
                    {video.title}
                  </h1>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Eye className="w-4 h-4" />
                      <span>{formatNumber(video.views_count || 0)} views</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Heart className="w-4 h-4" />
                      <span>{formatNumber(video.likes_count || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(video.duration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(video.createdAt)}</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/5" />

                {/* Description Section */}
                <div className="p-5">
                  <h4 className="text-xs font-medium uppercase tracking-widest text-gray-500 mb-3">
                    Description
                  </h4>
                  <div className="text-gray-300 text-sm leading-relaxed">
                    {video.description ? (
                      <RichTextDisplay content={video.description} />
                    ) : (
                      <p className="text-gray-500 italic">No description provided</p>
                    )}
                  </div>
                </div>

                {/* Tags Section */}
                {video.tags && (
                  <>
                    <div className="border-t border-white/5" />
                    <div className="p-5">
                      <h4 className="text-xs font-medium uppercase tracking-widest text-gray-500 mb-3">
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {video.tags.split(',').map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 text-xs rounded-full bg-white/5 text-gray-400 hover:bg-[#fa7517]/20 hover:text-[#fa7517] transition-colors cursor-pointer"
                          >
                            #{tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}

              </div>

              {/* Footer - View Channel CTA */}
              {channel && (
                <div className="p-4 border-t border-white/5">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleChannelClick}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#fa7517] to-[#ff8c42] text-black font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    View Channel
                    <ExternalLink className="w-4 h-4" />
                  </motion.button>
                </div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
