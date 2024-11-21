import React, { useEffect, useRef, forwardRef } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';
import '../../../styles/video-player.css';
import { useViewTracking } from '../../../hooks/useViewTracking';

interface VideoPlayerProps {
  src: string;
  thumbnail_path: string;
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
  ({ src, thumbnail_path, onReady, videoId, duration }, ref) => {
    const videoRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<Player | null>(null);

    const viewTracking = useViewTracking({
      videoId,
      videoDuration: duration,
    });

    useEffect(() => {
      if (!videoRef.current || playerRef.current) return;

      const videoElement = document.createElement('video');
      videoElement.className = 'video-js vjs-big-play-centered';
      videoRef.current.appendChild(videoElement);

      const player = videojs(videoElement, {
        controls: true,
        autoplay: false,
        preload: 'auto',
        fluid: true,
        responsive: true,
        poster: thumbnail_path,
        userActions: {
          hotkeys: true,
          doubleClick: false,
          click: false,
          clickToggle: false,
        },
        sources: [{ 
          src, 
          type: 'video/mp4'
        }],
        controlBar: {
          children: [
            'playToggle',
            'currentTimeDisplay',
            'progressControl',
            'durationDisplay',
            'volumePanel',
            'playbackRateMenuButton',
            'fullscreenToggle'
          ]
        }
      });

      playerRef.current = player;

      player.ready(() => {
        // Keep view tracking setup
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
          if (typeof ref === 'function') ref(playerInterface);
          else (ref as React.MutableRefObject<VideoPlayerRef>).current = playerInterface;
        }

        if (onReady) onReady(playerInterface);
      });

      return () => {
        if (playerRef.current) {
          void viewTracking.finalize();
          playerRef.current.dispose();
          playerRef.current = null;
        }
      };
    }, [src, thumbnail_path, videoId, duration, onReady, ref, viewTracking]);

    return (
      <div className="video-container aspect-video">
        <div data-vjs-player className="h-full">
          <div ref={videoRef} className="h-full" />
        </div>
      </div>
    );
  }
);

export default VideoPlayer;