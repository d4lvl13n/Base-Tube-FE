import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { getVideoById } from '../../api/video';
import { Video } from '../../types/video';

const DefaultVideoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const videoNode = useRef<HTMLVideoElement | null>(null);
  const player = useRef<ReturnType<typeof videojs> | null>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!id) {
        setError('No video ID provided');
        return;
      }

      try {
        const videoData = await getVideoById(id);
        setVideo(videoData);
      } catch (err) {
        console.error('Failed to fetch video:', err);
        setError('Failed to load video. Please try again later.');
      }
    };

    fetchVideo();
  }, [id]);

  useEffect(() => {
    if (video && videoNode.current) {
      player.current = videojs(videoNode.current, {
        controls: true,
        autoplay: false,
        preload: 'auto',
        fluid: true,
        poster: `${process.env.REACT_APP_API_URL}/${video.thumbnail_path}`,
        sources: [
          {
            src: `${process.env.REACT_APP_API_URL}/${video.video_path}`,
            type: 'video/mp4',
          }
        ],
        controlBar: {
          fullscreenToggle: true,
        },
      });

      player.current.ready(() => {
        console.log('Video.js Player is ready');
      });

      player.current.on('error', () => {
  const error = player.current?.error();
  console.error('Video.js Player Error:', error);
  console.error('Video source:', `http://localhost:3000/${video.video_path}`);
  console.error('Error code:', error?.code);
  console.error('Error message:', error?.message);
});

      return () => {
        if (player.current) {
          player.current.dispose();
          player.current = null;
        }
      };
    }
  }, [video]);

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-black text-red-500">
        {error}
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex justify-center items-center h-screen bg-black text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen bg-black">
      <video ref={videoNode} className="video-js vjs-default-skin" />
    </div>
  );
};

export default DefaultVideoPage;
