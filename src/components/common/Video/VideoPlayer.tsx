import React, { useEffect, useRef, forwardRef } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';
import '../../../styles/videojs-skin.css';
import '../../../styles/video-player.css';
import { useViewTracking } from '../../../hooks/useViewTracking';

interface VideoPlayerProps {
  src: string;
  video_url?: string;
  video_urls?: Record<string, string>;
  thumbnail_path: string;
  thumbnail_url?: string;
  onReady?: (player: VideoPlayerRef) => void;
  videoId: string;
  duration: number;
}

export interface VideoPlayerRef {
  play: () => Promise<void>;
  pause: () => void;
  currentTime: (time?: number) => number;
  on: (event: string, callback: () => void) => void;
  isFullscreen: () => boolean;
  requestFullscreen: () => void;
  exitFullscreen: () => void;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ src, video_url, video_urls, thumbnail_path, thumbnail_url, onReady, videoId, duration }, ref) => {
    const videoRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<Player | null>(null);

    // Initialize view tracking
    const viewTracking = useViewTracking({
      videoId,
      videoDuration: duration,
    });

    useEffect(() => {
      if (!videoRef.current || playerRef.current) return;

      console.log('Initializing VideoPlayer');

      const videoElement = document.createElement('video');
      videoElement.className = 'video-js vjs-big-play-centered';
      videoElement.setAttribute('role', 'application');
      videoElement.setAttribute('aria-label', 'Video Player');
      videoRef.current.appendChild(videoElement);

      // Detect if the device is a touch device
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Determine video source (prefer Storj URL if available)
      const videoSource = video_url || src;
      const thumbnailSource = thumbnail_url || thumbnail_path;

      const playerOptions = {
        controls: true,
        autoplay: false,
        preload: 'auto',
        fluid: true,
        responsive: true,
        aspectRatio: '16:9',
        poster: thumbnailSource,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        userActions: {
          hotkeys: true,
          doubleClick: true,
          click: true,
        },
        sources: [
          {
            src: videoSource,
            type: 'video/mp4',
          },
        ],
        controlBar: {
          children: [
            {
              name: 'playToggle',
            },
            {
              name: 'volumePanel',
              inline: true,
            },
            {
              name: 'currentTimeDisplay',
            },
            {
              name: 'timeDivider',
            },
            {
              name: 'durationDisplay',
            },
            {
              name: 'progressControl',
            },
            {
              name: 'playbackRateMenuButton',
            },
            {
              name: 'pictureInPictureToggle',
            },
            {
              name: 'fullscreenToggle',
            },
          ],
        },
        inactivityTimeout: 3000,
        techOrder: ['html5'],
      };

      const player = videojs(videoElement, playerOptions);
      playerRef.current = player;

      // Event listeners for view tracking
      player.on('playing', () => {
        console.log('▶️ Starting view tracking');
        viewTracking.startTracking();
      });

      player.on('pause', () => {
        console.log('⏸️ Pausing view tracking');
        viewTracking.pauseTracking();
      });

      player.on('timeupdate', () => {
        const currentTime = player.currentTime();
        if (typeof currentTime === 'number') {
          viewTracking.updateWatchedDuration(currentTime);
        }
      });

      player.on('ended', () => {
        console.log('🎬 Video ended');
        void viewTracking.finalize();
      });

      // Add error event listener
      player.on('error', () => {
        console.error('Video.js Error:', player.error());
      });

      // Expose player methods via ref
      const playerInterface: VideoPlayerRef = {
        play: async () => {
          try {
            await player.play();
          } catch (error) {
            console.error('Error playing video:', error);
            throw error;
          }
        },
        pause: () => {
          player.pause();
        },
        currentTime: (time?: number) => {
          if (typeof time === 'number') {
            player.currentTime(time);
          }
          return player.currentTime() || 0;
        },
        on: (event: string, callback: () => void) => {
          player.on(event, callback);
        },
        isFullscreen: () => player.isFullscreen() || false,
        requestFullscreen: () => player.requestFullscreen(),
        exitFullscreen: () => player.exitFullscreen(),
      };

      if (ref) {
        if (typeof ref === 'function') {
          ref(playerInterface);
        } else {
          ref.current = playerInterface;
        }
      }

      if (onReady) {
        onReady(playerInterface);
      }

      return () => {
        console.log('Disposing VideoPlayer');
        if (playerRef.current) {
          void viewTracking.finalize();
          playerRef.current.dispose();
          playerRef.current = null;
        }
      };
    }, []); // Empty dependency array to run only once on mount

    return (
      <div className="video-player-container w-full h-full">
        <div data-vjs-player className="w-full h-full">
          <div ref={videoRef} className="w-full h-full" />
        </div>
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;