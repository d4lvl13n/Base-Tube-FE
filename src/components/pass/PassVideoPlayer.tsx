import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, RefreshCw, RotateCcw, SkipForward } from 'lucide-react';

// Load YouTube IFrame API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface PassVideoPlayerProps {
  /**
   * A signed URL returned from the backend. Can be a YouTube watch URL, youtu.be short link, or a
   * direct mp4 (S3 / Storj) link.
   */
  signedUrl: string;
  /** Poster / thumbnail image to show before play (only applies to mp4 rendering) */
  poster?: string;
  /** Should the video autoplay? default = true */
  autoPlay?: boolean;
  /** Optional title for accessibility */
  title?: string;
  /** Extra tailwind classes for wrapper */
  className?: string;
  /** Optional callback function to trigger playing the next video */
  onNextVideo?: () => void;
}

// Utility to extract a YouTube videoId from various URL formats
function getYouTubeId(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const hostname = u.hostname.toLowerCase();
    const pathname = u.pathname;

    if (hostname.includes('youtube.com')) {
      // Check for /embed/ format first
      if (pathname.startsWith('/embed/')) {
        // Path: /embed/VIDEO_ID?... or /embed/VIDEO_ID&... or /embed/VIDEO_ID
        // Get the part after /embed/ -> VIDEO_ID?... or VIDEO_ID&... or VIDEO_ID
        const potentialId = pathname.split('/')[2];
        // Split by '?' then '&' to remove any params
        return potentialId?.split('?')[0]?.split('&')[0] || null;
      }
      // Then check for watch?v= format (searchParams handles this correctly)
      const videoId = u.searchParams.get('v');
      if (videoId) {
        return videoId;
      }
    } else if (hostname === 'youtu.be') {
      // Handle youtu.be links
      // Path: /VIDEO_ID?... or /VIDEO_ID&... or /VIDEO_ID
      const pathPart = pathname.slice(1); // Remove leading '/' -> VIDEO_ID?... or VIDEO_ID&... or VIDEO_ID
      // Split by '?' first, then by '&' to isolate the ID
      return pathPart?.split('?')[0]?.split('&')[0] || null;
    }
  } catch (_) {
    // Ignore URL parsing errors for invalid formats
    console.error("Error parsing URL in getYouTubeId:", url, _);
  }
  // Return null if no valid ID pattern was matched
  return null;
}

// Format seconds to MM:SS
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const PassVideoPlayer: React.FC<PassVideoPlayerProps> = ({
  signedUrl,
  poster,
  autoPlay = true,
  title = 'Premium video',
  className = '',
  onNextVideo,
}) => {
  const youTubeId = useMemo(() => getYouTubeId(signedUrl), [signedUrl]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [buffering, setBuffering] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);
  
  // Timer for hiding controls
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize YouTube iframe API (only for YouTube videos)
  useEffect(() => {
    if (!youTubeId) return;
    
    // Load the YouTube IFrame API if it's not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
    
    // Initialize the player when the API is ready
    const initPlayer = () => {
      if (window.YT && window.YT.Player && playerRef.current) {
        youtubePlayerRef.current = new window.YT.Player(playerRef.current, {
          videoId: youTubeId,
          playerVars: {
            autoplay: autoPlay ? 1 : 0,
            controls: 0, // Hide YouTube controls
            rel: 0, // Don't show related videos
            showinfo: 0, // Hide video info
            modestbranding: 1, // Hide YouTube logo
            fs: 0, // Disable YouTube fullscreen button
            disablekb: 1, // Disable keyboard controls
            iv_load_policy: 3, // Hide annotations
            origin: window.location.origin
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError: onPlayerError
          }
        });
      }
    };
    
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }
    
    return () => {
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.destroy();
      }
    };
  }, [youTubeId, autoPlay]);
  
  // Handle mouseMove to show controls
  useEffect(() => {
    if (!youTubeId) return; // Skip for non-YouTube videos
    
    const handleMouseMove = () => {
      setControlsVisible(true);
      
      // Reset the timer
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
      
      // Hide controls after 3 seconds
      hideControlsTimerRef.current = setTimeout(() => {
        if (isPlaying) {
          setControlsVisible(false);
        }
      }, 3000);
    };
    
    const container = playerRef.current?.parentElement;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseenter', handleMouseMove);
      container.addEventListener('mouseleave', () => {
        if (isPlaying) setControlsVisible(false);
      });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseenter', handleMouseMove);
        container.removeEventListener('mouseleave', () => {});
      }
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [youTubeId, isPlaying]);
  
  // Fullscreen handling
  useEffect(() => {
    if (!youTubeId) return; // Skip for non-YouTube videos
    
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!document.fullscreenElement || 
        !!(document as any).webkitFullscreenElement
      );
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [youTubeId]);
  
  // Update current time periodically
  useEffect(() => {
    if (!youTubeId || !isPlaying || !youtubePlayerRef.current) return;
    
    const interval = setInterval(() => {
      if (youtubePlayerRef.current) {
        try {
          setCurrentTime(youtubePlayerRef.current.getCurrentTime() || 0);
        } catch (e) {
          console.error("Error getting current time:", e);
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [youTubeId, isPlaying]);
  
  // YouTube player event handlers
  const onPlayerReady = (event: any) => {
    setIsLoaded(true);
    setDuration(event.target.getDuration() || 0);
    if (autoPlay) {
      event.target.playVideo();
      setIsPlaying(true);
    }
    setShowEndScreen(false);
  };
  
  const onPlayerStateChange = (event: any) => {
    const playerState = event.data;
    
    // YouTube states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
    switch (playerState) {
      case 1: // playing
        setIsPlaying(true);
        setBuffering(false);
        setShowEndScreen(false);
        break;
      case 2: // paused
        setIsPlaying(false);
        setBuffering(false);
        break;
      case 3: // buffering
        setBuffering(true);
        break;
      case 0: // ended
        setIsPlaying(false);
        setBuffering(false);
        setCurrentTime(0);
        setShowEndScreen(true);
        break;
    }
  };
  
  const onPlayerError = (event: any) => {
    console.error("YouTube player error:", event.data);
  };
  
  // Player controls
  const togglePlay = () => {
    if (!youtubePlayerRef.current) return;
    
    if (showEndScreen) {
      youtubePlayerRef.current.seekTo(0, true);
      youtubePlayerRef.current.playVideo();
      setIsPlaying(true);
      setShowEndScreen(false);
    } else if (isPlaying) {
      youtubePlayerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      youtubePlayerRef.current.playVideo();
      setIsPlaying(true);
    }
  };
  
  const replayVideo = () => {
    if (!youtubePlayerRef.current) return;
    youtubePlayerRef.current.seekTo(0, true);
    youtubePlayerRef.current.playVideo();
    setIsPlaying(true);
    setShowEndScreen(false);
  };
  
  const toggleMute = () => {
    if (!youtubePlayerRef.current) return;
    
    if (isMuted) {
      youtubePlayerRef.current.unMute();
      setIsMuted(false);
    } else {
      youtubePlayerRef.current.mute();
      setIsMuted(true);
    }
  };
  
  const seekTo = (timePercent: number) => {
    if (!youtubePlayerRef.current || !duration) return;
    
    const timeInSeconds = duration * (timePercent / 100);
    youtubePlayerRef.current.seekTo(timeInSeconds, true);
    setCurrentTime(timeInSeconds);
  };
  
  const toggleFullscreen = () => {
    const container = wrapperRef.current;
    if (!container) return;
    
    if (isFullscreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    } else {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      }
    }
  };
  
  const changePlaybackRate = (rate: number) => {
    if (!youtubePlayerRef.current) return;
    
    youtubePlayerRef.current.setPlaybackRate(rate);
    setPlaybackRate(rate);
    setShowSettings(false);
  };
  
  // Render functions for different parts of the UI
  const renderProgressBar = () => {
    const progress = duration ? (currentTime / duration) * 100 : 0;
    return (
      <div 
        className="w-full h-2 bg-gray-800/70 rounded-full overflow-hidden cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const offsetX = e.clientX - rect.left;
          const percent = (offsetX / rect.width) * 100;
          seekTo(percent);
        }}
      >
        <div 
          className="h-full bg-gradient-to-r from-[#fa7517] to-orange-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  };
  
  const renderTimestamps = () => {
    return (
      <div className="text-xs text-white/80 flex justify-between w-full">
        <div>{formatTime(currentTime)}</div>
        <div>{formatTime(duration)}</div>
      </div>
    );
  };
  
  const renderPlaybackSettings = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    
    return (
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute right-0 bottom-16 bg-black/80 backdrop-blur-sm border border-gray-800/50 rounded-lg overflow-hidden p-2 shadow-lg w-40"
          >
            <div className="text-sm text-gray-400 mb-2 px-2">Playback Speed</div>
            {rates.map(rate => (
              <button
                key={rate}
                onClick={() => changePlaybackRate(rate)}
                className={`block w-full text-left px-3 py-1.5 rounded ${
                  playbackRate === rate 
                    ? 'bg-[#fa7517] text-white' 
                    : 'hover:bg-gray-800/70 text-white'
                }`}
              >
                {rate === 1 ? 'Normal' : `${rate}x`}
                {playbackRate === rate && (
                  <span className="float-right">✓</span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  // Render function for the end screen overlay
  const renderEndScreenOverlay = () => {
    return (
      <AnimatePresence>
        {showEndScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={replayVideo}
              className="flex flex-col items-center gap-2 text-white/80 hover:text-white"
            >
              <div className="w-16 h-16 rounded-full bg-[#fa7517]/30 hover:bg-[#fa7517]/50 flex items-center justify-center transition-colors">
                <RotateCcw className="w-8 h-8" />
              </div>
              <span>Replay</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  // For normal mp4 videos, use the native video player
  const renderVideo = () => {
    return (
      <video
        src={signedUrl}
        controls
        autoPlay={autoPlay}
        poster={poster}
        className="w-full h-full"
      />
    );
  };
  
  // For YouTube, render enhanced player with controls
  const renderYouTube = () => {
    if (!youTubeId) return null;
    
    return (
      <div className="relative w-full h-full">
        {/* YouTube iframe container */}
        <div className="absolute inset-0">
          <div ref={playerRef} className="w-full h-full"></div>
        </div>
        
        {/* Loading indicator */}
        {(!isLoaded || buffering) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
            <div className="flex flex-col items-center">
              <RefreshCw className="w-10 h-10 text-[#fa7517] animate-spin mb-3" />
              <span className="text-white text-sm">{isLoaded ? 'Buffering...' : 'Loading video...'}</span>
            </div>
          </div>
        )}

        {/* End Screen Overlay */}
        {renderEndScreenOverlay()}
        
        {/* Custom controls */}
        <AnimatePresence>
          {controlsVisible && !showEndScreen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 left-0 right-0 p-4 space-y-2 z-10"
            >
              {/* Semi-transparent background for controls only */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent -z-10"></div>
              
              {/* Video Title */}
              {title && (
                <div className="mb-2 text-white text-sm md:text-base font-medium line-clamp-1">
                  {title}
                </div>
              )}
              
              {/* Progress bar */}
              {renderProgressBar()}
              
              {/* Controls row */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {/* Play/Pause button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-[#fa7517]/80 hover:bg-[#fa7517] flex items-center justify-center"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white" fill="white" />
                    )}
                  </motion.button>
                  
                  {/* Next Video button (Conditionally rendered) */}
                  {onNextVideo && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onNextVideo}
                      className="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center"
                      title="Next video"
                    >
                      <SkipForward className="w-4 h-4 text-white" />
                    </motion.button>
                  )}
                  
                  {/* Volume button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleMute}
                    className="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-white" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-white" />
                    )}
                  </motion.button>
                  
                  {/* Time display */}
                  <div className="hidden sm:block">
                    {renderTimestamps()}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Playback speed */}
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowSettings(!showSettings)}
                      className="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center"
                      title="Playback settings"
                    >
                      <Settings className="w-4 h-4 text-white" />
                    </motion.button>
                    
                    {/* Settings dropdown */}
                    {renderPlaybackSettings()}
                  </div>
                  
                  {/* Fullscreen button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleFullscreen}
                    className="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center"
                  >
                    <Maximize className="w-4 h-4 text-white" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div ref={wrapperRef} className={`relative w-full h-[56.25vw] max-h-[80vh] bg-black ${className}`}>
      {youTubeId ? renderYouTube() : renderVideo()}
      {/* Overlay to hide YouTube default Share/WatchLater buttons */}
      {youTubeId && (
        <div className="absolute top-0 right-0 w-40 h-12 pointer-events-none bg-gradient-to-l from-black/80 to-transparent" />
      )}
    </div>
  );
};

export default PassVideoPlayer; 