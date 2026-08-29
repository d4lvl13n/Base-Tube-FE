import React, { useEffect, useMemo, useRef, forwardRef } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';
import '../../../styles/videojs-skin.css';
import '../../../styles/video-player.css';
import { useViewTracking } from '../../../hooks/useViewTracking';
import { selectPlaybackSource } from './playbackSource';

interface VideoPlayerProps {
  src: string;
  video_url?: string;
  video_urls?: Record<string, string>;
  thumbnail_path: string;
  thumbnail_url?: string;
  onReady?: (player: VideoPlayerRef) => void;
  videoId: string;
  duration: number;
  isEmbed?: boolean;
  title?: string;
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
  ({ src, video_url, video_urls, thumbnail_path, thumbnail_url, onReady, videoId, duration, isEmbed = false, title }, ref) => {
    const videoRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<Player | null>(null);
    /** The URL currently loaded into the player, so a prop change can be seen. */
    const loadedSourceRef = useRef<string>('');
    /**
     * The pending `loadedmetadata` handler, so a second source change can take
     * the first one back off the player.
     *
     * Two swaps in quick succession used to leave two handlers armed, and the
     * older one carried the older playhead — it would fire on the newer
     * source's metadata and seek the viewer backwards.
     */
    const resumeHandlerRef = useRef<(() => void) | null>(null);
    /** True between `seeking` and `seeked`, so scrubbed time is not counted. */
    const isSeekingRef = useRef(false);

    // A rendition can arrive minutes after mount, when the transcoder finishes
    // and the parent refetches. Memoised so the switch effect below fires on a
    // genuinely different URL, not on every render.
    const playbackSource = useMemo(
      () => selectPlaybackSource({ video_url, video_urls, src }),
      [video_url, video_urls, src],
    );

    // Initialize view tracking
    const viewTracking = useViewTracking({
      videoId,
      videoDuration: duration,
    });

    /**
     * The player's listeners are registered ONCE (the init effect below has an
     * empty dependency array, on purpose — re-running it would tear down the
     * player). Those closures therefore captured render 0's `viewTracking`,
     * whose callbacks were built before the view config had loaded: the very
     * first visit to a page tracked nothing, because `hasMetViewThreshold`
     * was permanently reading a `null` config.
     *
     * Holding the object in a ref that is refreshed on every render means the
     * one-time listeners always call today's callbacks.
     */
    const viewTrackingRef = useRef(viewTracking);
    viewTrackingRef.current = viewTracking;

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

      // A rendition, when one exists, always beats the published original: the
      // original is the very file the transcoder was asked to rescue.
      const videoSource = selectPlaybackSource({ video_url, video_urls, src });
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
        title: title || '',
      };

      const player = videojs(videoElement, playerOptions);
      playerRef.current = player;
      loadedSourceRef.current = videoSource;

      // Event listeners for view tracking. Every one goes through the ref, so
      // none of them can pin a stale callback from the first render.
      player.on('playing', () => {
        viewTrackingRef.current.startTracking();
      });

      player.on('pause', () => {
        viewTrackingRef.current.pauseTracking();
      });

      // Played time is accumulated from the deltas between these events, so the
      // player has to say when a jump was a scrub rather than playback.
      player.on('seeking', () => {
        isSeekingRef.current = true;
      });

      player.on('seeked', () => {
        const currentTime = player.currentTime();
        if (typeof currentTime === 'number') {
          viewTrackingRef.current.updateWatchedDuration(currentTime, true);
        }
        isSeekingRef.current = false;
      });

      player.on('timeupdate', () => {
        const currentTime = player.currentTime();
        if (typeof currentTime === 'number') {
          viewTrackingRef.current.updateWatchedDuration(currentTime, isSeekingRef.current);
        }
      });

      player.on('ended', () => {
        void viewTrackingRef.current.finalize();
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
          void viewTrackingRef.current.finalize();
          playerRef.current.dispose();
          playerRef.current = null;
        }
      };
    }, []); // Empty dependency array to run only once on mount

    /**
     * Swap the source when the selected one changes after mount.
     *
     * The player is not rebuilt — that would drop the poster, the control bar
     * state and every listener above. The playhead and the play/pause state are
     * carried across, so a 720p rendition landing mid-watch is a quality change
     * rather than a restart.
     */
    useEffect(() => {
      const player = playerRef.current;
      if (!player) return;
      if (!playbackSource || playbackSource === loadedSourceRef.current) return;

      const resumeAt = player.currentTime() ?? 0;
      const wasPlaying = !player.paused();
      loadedSourceRef.current = playbackSource;

      // Whatever the previous swap armed is stale the moment this one starts.
      if (resumeHandlerRef.current) {
        player.off('loadedmetadata', resumeHandlerRef.current);
        resumeHandlerRef.current = null;
      }

      const onLoadedMetadata = () => {
        resumeHandlerRef.current = null;
        if (resumeAt > 0) player.currentTime(resumeAt);
        if (wasPlaying) {
          const resumed = player.play();
          if (resumed && typeof resumed.catch === 'function') {
            resumed.catch(() => {
              // Autoplay policy said no; the controls are still there.
            });
          }
        }
      };
      resumeHandlerRef.current = onLoadedMetadata;
      player.src({ src: playbackSource, type: 'video/mp4' });
      player.one('loadedmetadata', onLoadedMetadata);

      return () => {
        if (resumeHandlerRef.current === onLoadedMetadata) {
          player.off('loadedmetadata', onLoadedMetadata);
          resumeHandlerRef.current = null;
        }
      };
    }, [playbackSource]);

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