import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, TrendingUp } from 'lucide-react';
import CommentInput from './CommentInput';
import CommentsList from './CommentsList';
import { useComments } from '../../../../hooks/useComments';
import type { Comment } from '../../../../types/comment';

interface CommentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
}

const CommentPanel: React.FC<CommentPanelProps> = ({ isOpen, onClose, videoId }) => {
  const [sortBy, setSortBy] = React.useState<'latest' | 'top'>('latest');

  // Single instance of useComments
  const {
    comments,
    loading,
    error,
    hasMore,
    loadMore,
    addComment,
    editComment,
    deleteComment,
    pinComment,
    unpinComment,
    canModifyComment,
    canPinComment,
    isDeletingComment,
    isEditingComment,
    isAddingComment
  } = useComments({
    videoId,
    initialLimit: 10,
    sortBy
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed right-0 top-0 h-full w-[400px] bg-black/80 backdrop-blur-xl 
                     border-l border-gray-800/30 shadow-2xl z-50"
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-800/30">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold bg-clip-text text-transparent 
                              bg-gradient-to-r from-white to-gray-300">
                  Comments
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-800/50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="flex gap-4 mt-4">
                <button
                  onClick={() => setSortBy('latest')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                    ${sortBy === 'latest' 
                      ? 'bg-[#fa7517] text-black font-medium' 
                      : 'text-gray-400 hover:text-white'
                    }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  Latest
                </button>
                <button
                  onClick={() => setSortBy('top')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                    ${sortBy === 'top' 
                      ? 'bg-[#fa7517] text-black font-medium' 
                      : 'text-gray-400 hover:text-white'
                    }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Top
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <CommentsList
                comments={comments}
                loading={loading}
                error={error}
                hasMore={hasMore}
                loadMore={loadMore}
                onEdit={editComment}
                onDelete={deleteComment}
                onPin={pinComment}
                onUnpin={unpinComment}
                onAddReply={addComment}
                canModifyComment={canModifyComment}
                canPinComment={canPinComment}
                isDeletingComment={isDeletingComment}
                isEditingComment={isEditingComment}
              />
            </div>

            {/* Comment Input */}
            <div className="border-t border-gray-800/30 p-4">
              <CommentInput
                onAddComment={addComment}
                isAddingComment={isAddingComment}
              />
            </div>
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-[#fa751708] to-transparent" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommentPanel;