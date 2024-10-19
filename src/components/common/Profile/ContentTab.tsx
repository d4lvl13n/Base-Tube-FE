// src/components/common/Profile/ContentTab.tsx

import React from 'react';
import { Video } from '../../../types/video'; // Update the import path
import VideoCard from '../VideoCard';

interface ContentTabProps {
  videos: Video[];
}

const ContentTab: React.FC<ContentTabProps> = ({ videos }) => {
  return (
    <div>
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} size="normal" />
          ))}
        </div>
      ) : (
        <p>You have not uploaded any videos yet.</p>
      )}
    </div>
  );
};

export default ContentTab;
