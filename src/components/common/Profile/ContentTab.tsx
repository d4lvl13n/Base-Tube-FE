import React from 'react';
import { motion } from 'framer-motion';
import { UserVideo } from '../../../types/user';

interface ContentTabProps {
  videos: UserVideo[];
}

const ContentTab: React.FC<ContentTabProps> = ({ videos }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {videos.map((video) => (
        <motion.div 
          key={video.id}
          className="bg-gray-800 rounded-xl overflow-hidden"
          whileHover={{ scale: 1.05 }}
          style={{
            boxShadow: `0 0 10px 2px rgba(250, 117, 23, 0.3), 
                        0 0 30px 5px rgba(250, 117, 23, 0.2), 
                        0 0 50px 10px rgba(250, 117, 23, 0.1)`
          }}
        >
          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-32 object-cover" />
          <div className="p-4">
            <h3 className="font-semibold">{video.title}</h3>
            <p className="text-sm text-gray-300">{video.views} views • {video.uploadDate}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ContentTab;