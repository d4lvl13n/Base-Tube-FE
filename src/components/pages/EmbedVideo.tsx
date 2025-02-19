import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import VideoPlayer, { VideoPlayerRef } from '../common/Video/VideoPlayer';
import { getVideoEmbed } from '../../api/embed';

const EmbedVideo: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [video, setVideo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<VideoPlayerRef | null>(null);

  useEffect(() => {
    // Add meta tags for embedding
    document.title = 'Base.Tube Player';
    const meta = document.createElement('meta');
    meta.setAttribute('content', 'upgrade-insecure-requests');
    document.head.appendChild(meta);
  }, []);

  useEffect(() => {
    if (videoId) {
      getVideoEmbed(videoId)
        .then(data => {
          setVideo(data);
          // Send video metadata to parent window
          window.parent.postMessage({
            type: 'video-metadata',
            data: {
              title: data.title,
              duration: data.duration,
              thumbnail_url: data.thumbnail_url
            }
          }, '*');
        })
        .catch((err) => {
          console.error('Error fetching video in embed:', err);
          setError('Video not found or unavailable.');
        });
    }
  }, [videoId]);

  return (
    <div style={{ 
      background: 'black', 
      width: '100%', 
      height: '100%',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      {error ? (
        <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
          {error}
        </div>
      ) : !video ? (
        <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
          Loading...
        </div>
      ) : (
        <VideoPlayer
          src={video.video_url}
          video_url={video.video_url}
          video_urls={video.video_urls}
          thumbnail_path={video.thumbnail_url}
          thumbnail_url={video.thumbnail_url}
          duration={video.duration}
          videoId={video.id.toString()}
          ref={playerRef}
          isEmbed={true}
          title={video.title}
        />
      )}
    </div>
  );
};

export default EmbedVideo; 