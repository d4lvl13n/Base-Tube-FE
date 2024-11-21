import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getVideoById } from '../../api/video';
import { getChannelDetails } from '../../api/channel';
import VideoPlayer, { VideoPlayerRef } from '../common/Video/VideoPlayer';
import { Video } from '../../types/video';
import { Channel } from '../../types/channel';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import { VideoInfoOverlay } from '../common/Video/VideoInfoOverlay';
import { CreatorBox } from '../common/Video/CreatorBox';
import { ViewCount } from '../common/Video/ViewCount';
import CommentPanel from '../common/Video/Comments/CommentPanel';
import { useVideoContext } from '../../contexts/VideoContext';
import { RadialMenu } from '../common/Video/RadialMenu/RadialMenu';
import { useComments } from '../../hooks/useComments';
import { useLikes } from '../../hooks/useLikes';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

const SingleVideo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [showInterface, setShowInterface] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<VideoPlayerRef>(null);
  const { isCommentsPanelOpen, setIsCommentsPanelOpen } = useVideoContext();
  const commentsData = useComments({
    videoId: video?.id.toString() || '',
    initialLimit: 30,
    sortBy: 'latest'
  });

  const {
    isLiked,
    toggleLike,
    isTogglingLike
  } = useLikes(id || '');

  const [likesCount, setLikesCount] = useState<number>(0);
  const [shouldShowOverlay, setShouldShowOverlay] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const videoProps = useMemo(() => {
    if (!video) {
      return null;
    }
    return {
      src: `${API_BASE_URL}/${video.video_path}`,
      thumbnail_path: `${API_BASE_URL}/${video.thumbnail_path}`,
      duration: video.duration,
      videoId: video.id.toString(),
    };
  }, [video]);

  useEffect(() => {
    if (video?.like_count !== undefined) {
      setLikesCount(video.like_count);
    }
  }, [video?.like_count]);

  const handleLike = async () => {
    try {
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
      
      const response = await toggleLike();
      
      if (response?.data) {
        setLikesCount(response.data.likesCount);
      }
    } catch (error) {
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
      console.error('Error toggling like:', error);
    }
  };

  useEffect(() => {
    const fetchVideoAndChannel = async () => {
      if (!id) {
        console.error('No video ID provided');
        navigate('/');
        return;
      }

      try {
        const videoData = await getVideoById(id);
        setVideo(videoData);

        if (videoData.channel_id) {
          const channelData = await getChannelDetails(videoData.channel_id.toString());
          setChannel(channelData.channel);
        }
      } catch (error) {
        console.error('Error fetching video or channel:', error);
        setError('Failed to load video. Please try again later.');
      }
    };

    fetchVideoAndChannel();
  }, [id, navigate]);

  const handlePlayerReady = useCallback((player: VideoPlayerRef) => {
    player.on('play', () => {
      setIsPlaying(true);
      setShouldShowOverlay(false);
    });
    
    player.on('pause', () => {
      setIsPlaying(false);
      setShouldShowOverlay(true);
    });
    
    player.on('fullscreenchange', () => {
      setIsFullscreen(player.isFullscreen());
    });
  }, []);

  const handleToggleInterface = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInterface(!showInterface);
  };

  if (error) {
    return <div className="text-white text-center mt-10">{error}</div>;
  }

  if (!video || !videoProps) {
    return <div className="text-white text-center mt-10">Loading...</div>;
  }

  return (
    <div className="bg-black text-white min-h-screen w-screen relative">
      <AnimatePresence>
        {showInterface && !isFullscreen && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="absolute top-0 left-0 right-0 z-40"
          >
            <Header />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-screen">
        <AnimatePresence>
          {showInterface && !isFullscreen && (
            <motion.div
              initial={{ x: -250 }}
              animate={{ x: 0 }}
              exit={{ x: -250 }}
              transition={{ duration: 0.3 }}
              className="absolute top-0 left-0 bottom-0 z-30"
              style={{ paddingTop: '100px' }}
            >
              <Sidebar />
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 flex items-center justify-center p-8">
          <motion.div
            ref={containerRef}
            className="w-full max-w-6xl bg-gray-900 rounded-3xl shadow-2xl relative"
            layout
            style={{
              boxShadow: `0 0 20px 5px rgba(250, 117, 23, 0.3), 
                          0 0 60px 10px rgba(250, 117, 23, 0.2), 
                          0 0 100px 20px rgba(250, 117, 23, 0.1)`,
            }}
          >
            <div className="relative w-full h-full">
              <VideoPlayer
                {...videoProps}
                onReady={handlePlayerReady}
                ref={playerRef}
              />
              
              <AnimatePresence>
                {(shouldShowOverlay || !isPlaying) && showInterface && (
                  <motion.div 
                    className="absolute inset-0 z-20 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <VideoInfoOverlay video={video} />
                    {channel && <CreatorBox channel={channel} />}
                    <ViewCount video={video} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </main>
      </div>

      {showInterface && (
        <motion.div
          className="fixed bottom-8 right-8 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <RadialMenu 
            commentCount={commentsData.totalComments}
            likeCount={likesCount}
            isLiked={isLiked}
            onLike={handleLike}
            isTogglingLike={isTogglingLike}
          />
        </motion.div>
      )}

      <div
        className="parent-container"
        style={{ pointerEvents: 'none' }}
      >
        <motion.button
          className="absolute top-20 right-5 bg-black bg-opacity-70 text-[#fa7517] px-4 py-2 rounded-full"
          onClick={handleToggleInterface}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{ pointerEvents: 'auto', zIndex: 10 }}
        >
          {showInterface ? 'Hide UI' : 'Show UI'}
        </motion.button>
      </div>

      <AnimatePresence>
        {isCommentsPanelOpen && video && (
          <CommentPanel 
            isOpen={isCommentsPanelOpen} 
            onClose={() => setIsCommentsPanelOpen(false)}
            videoId={video.id.toString()}
            commentsData={commentsData}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SingleVideo;
