import React, { useEffect, useRef, useImperativeHandle, forwardRef, useCallback, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  src: string;
  thumbnail_path: string;
  onReady?: (player: VideoPlayerRef) => void;
}

export interface VideoPlayerRef {
  play: () => void;
  pause: () => void;
  currentTime: (time?: number) => number;
  on: (event: string, callback: () => void) => void;
  isFullscreen: () => boolean;
  requestFullscreen: () => void;
  exitFullscreen: () => void;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ src, thumbnail_path, onReady }, ref) => {
    const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
    const [isVideoElementReady, setIsVideoElementReady] = useState(false);

    const videoRef = useCallback((node: HTMLVideoElement) => {
      if (node) {
        setIsVideoElementReady(true);
      }
    }, []);

    useImperativeHandle(ref, () => ({
      play: () => playerRef.current?.play(),
      pause: () => playerRef.current?.pause(),
      currentTime: (time?: number): number => {
        if (time !== undefined) {
          playerRef.current?.currentTime(time);
        }
        return playerRef.current?.currentTime() ?? 0;
      },
      on: (event: string, callback: () => void) => playerRef.current?.on(event, callback),
      isFullscreen: () => playerRef.current?.isFullscreen() ?? false,
      requestFullscreen: () => playerRef.current?.requestFullscreen(),
      exitFullscreen: () => playerRef.current?.exitFullscreen(),
    }));

    useEffect(() => {
      if (isVideoElementReady && !playerRef.current) {
        const videoElement = document.querySelector('.video-js');
        if (videoElement) {
          const player = videojs(videoElement, {
            controls: true,
            autoplay: false,
            preload: 'auto',
            fluid: true,
            poster: thumbnail_path,
            sources: [{ src, type: 'video/mp4' }],
            controlBar: {
              fullscreenToggle: true,
            },
          });

          playerRef.current = player;

          player.ready(() => {
            console.log('Video.js Player is ready');
            if (onReady) {
              onReady({
                play: () => player.play(),
                pause: () => player.pause(),
                currentTime: (time?: number): number => {
                  if (time !== undefined) {
                    player.currentTime(time);
                  }
                  return player.currentTime() ?? 0;
                },
                on: (event: string, callback: () => void) => player.on(event, callback),
                isFullscreen: () => player.isFullscreen() ?? false,
                requestFullscreen: () => player.requestFullscreen(),
                exitFullscreen: () => player.exitFullscreen(),
              });
            }
          });

          player.on('error', () => {
            const error = player.error();
            console.error('Video.js Player Error:', error);
          });
        }
      }

      return () => {
        if (playerRef.current) {
          playerRef.current.dispose();
          playerRef.current = null;
        }
      };
    }, [src, thumbnail_path, onReady, isVideoElementReady]);

    return <video ref={videoRef} className="video-js vjs-default-skin vjs-big-play-centered" />;
  }
);

export default VideoPlayer;
