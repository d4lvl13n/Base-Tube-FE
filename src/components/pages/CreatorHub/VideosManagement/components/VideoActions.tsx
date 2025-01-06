import React from 'react';
import { Plus } from 'lucide-react';
import { VideoActionsProps } from '../types';
import { Link } from 'react-router-dom';

const VideoActions: React.FC<VideoActionsProps> = ({ selectedVideos, onBulkAction }) => {
  return (
    <div className="flex items-center gap-4">
      {selectedVideos.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={() => onBulkAction('toggle_visibility')}
            className="px-4 py-2 bg-gray-800/50 text-white rounded-lg hover:bg-gray-700/50 transition-colors"
          >
            Change Visibility
          </button>
          <button
            onClick={() => onBulkAction('delete')}
            className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            Delete Selected
          </button>
        </div>
      )}
      
      <Link
        to="/creator-hub/upload-video"
        className="px-4 py-2 bg-[#fa7517] text-black rounded-lg hover:bg-[#fa9517] transition-colors flex items-center gap-2"
      >
        <Plus className="h-5 w-5" />
        Upload Video
      </Link>
    </div>
  );
};

export default VideoActions; 