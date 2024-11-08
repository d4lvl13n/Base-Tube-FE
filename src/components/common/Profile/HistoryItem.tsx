import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface HistoryItemProps {
  title: string;
  channelName: string;
  timestamp: string;
  thumbnailPath: string;
  completed?: boolean;
  isLiked?: boolean;
}

const HistoryItem: React.FC<HistoryItemProps> = ({
  title,
  channelName,
  timestamp,
  thumbnailPath,
  completed,
  isLiked,
}) => {
  const formattedDate = React.useMemo(() => {
    try {
      return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
    } catch (error) {
      return 'some time ago';
    }
  }, [timestamp]);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="p-4 bg-gray-900/50 rounded-lg flex items-center gap-4"
    >
      <img
        src={thumbnailPath}
        alt={title}
        className="w-24 h-16 object-cover rounded-lg"
      />
      <div className="flex-1">
        <h3 className="font-medium text-gray-200">{title}</h3>
        <p className="text-sm text-gray-400">{channelName}</p>
        <p className="text-xs text-gray-500">{formattedDate}</p>
      </div>
      {completed !== undefined && (
        <div
          className={`text-xs px-2 py-1 rounded ${
            completed
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}
        >
          {completed ? 'Completed' : 'In Progress'}
        </div>
      )}
      {isLiked !== undefined && (
        <div className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400">
          Liked
        </div>
      )}
    </motion.div>
  );
};

export default HistoryItem;