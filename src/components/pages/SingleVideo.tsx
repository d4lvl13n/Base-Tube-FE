import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Maximize, Minimize } from 'lucide-react';
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
  const { totalComments } = useComments({
    videoId: video?.id.toString() || '',
    initialLimit: 1,  // We only need the count, so minimize data fetch
    sortBy: 'latest'
  });

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

  const handlePlayerReady = (player: VideoPlayerRef) => {
    player.on('play', () => setIsPlaying(true));
    player.on('pause', () => setIsPlaying(false));
    player.on('fullscreenchange', () => {
      setIsFullscreen(player.isFullscreen());
    });
  };

  const togglePlay = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
    }
  };

  const toggleFullscreen = () => {
    if (playerRef.current) {
      if (isFullscreen) {
        playerRef.current.exitFullscreen();
      } else {
        playerRef.current.requestFullscreen();
      }
    }
  };

  if (error) {
    return <div className="text-white text-center mt-10">{error}</div>;
  }

  if (!video) {
    return <div className="text-white text-center mt-10">Loading...</div>;
  }

  return (
    <div className="bg-black text-white min-h-screen w-screen overflow-hidden relative">
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

        <main className="flex-1 flex items-center justify-center">
          <motion.div
            className="w-full h-full max-w-7xl max-h-[80vh] bg-gray-900 rounded-3xl overflow-hidden shadow-2xl relative"
            layout
            style={{
              boxShadow: `0 0 20px 5px rgba(250, 117, 23, 0.3), 
                          0 0 60px 10px rgba(250, 117, 23, 0.2), 
                          0 0 100px 20px rgba(250, 117, 23, 0.1)`,
            }}
          >
            <VideoPlayer
              ref={playerRef}
              src={`${process.env.REACT_APP_API_URL}/${video.video_path}`}
              thumbnail_path={`${process.env.REACT_APP_API_URL}/${video.thumbnail_path}`}
              onReady={handlePlayerReady}
            />
            {showInterface && (
              <>
                <VideoInfoOverlay video={video} />
                {channel && <CreatorBox channel={channel} />}
                <ViewCount video={video} />
              </>
            )}
          </motion.div>
        </main>
      </div>

      {showInterface && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 pointer-events-auto">
            <motion.button
              onClick={togglePlay}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="bg-[#fa7517] text-black p-3 rounded-full"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </motion.button>
            <motion.button
              onClick={toggleFullscreen}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="bg-[#fa7517] text-black p-3 rounded-full"
            >
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </motion.button>
          </div>

          <div className="absolute bottom-8 right-8 w-64 h-64 pointer-events-auto">
            <RadialMenu 
              commentCount={totalComments}
              likeCount={video?.like_count || 0}
            />
          </div>
        </motion.div>
      )}

      <motion.button
        className="absolute top-20 right-5 bg-black bg-opacity-70 text-[#fa7517] px-4 py-2 rounded-full z-50"
        onClick={() => setShowInterface(!showInterface)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{ top: '100px', right: '20px' }}
      >
        {showInterface ? 'Hide UI' : 'Show UI'}
      </motion.button>

      <AnimatePresence>
        {isCommentsPanelOpen && video && (
          <CommentPanel 
            isOpen={isCommentsPanelOpen} 
            onClose={() => setIsCommentsPanelOpen(false)}
            videoId={video.id.toString()}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SingleVideo;
