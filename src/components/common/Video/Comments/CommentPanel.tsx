import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, TrendingUp, Minimize2, Maximize2 } from 'lucide-react';
import CommentInput from './CommentInput';
import CommentsList from './CommentsList';
import { useComments } from '../../../../hooks/useComments';
import type { Comment } from '../../../../types/comment';

interface CommentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  pinnedComment?: Comment;
}

const CommentPanel: React.FC<CommentPanelProps> = ({ isOpen, onClose, videoId }) => {
  const [sortBy, setSortBy] = React.useState<'latest' | 'top'>('latest');
  const [isExpanded, setIsExpanded] = useState(false);

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
    isAddingComment,
    totalComments
  } = useComments({
    videoId,
    initialLimit: 30,
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
          className={`fixed right-0 top-0 h-full bg-black/95 backdrop-blur-xl 
                     shadow-2xl z-50 overflow-hidden
                     ${isExpanded ? 'w-[800px]' : 'w-[500px]'}
                     transition-all duration-300 ease-in-out`}
        >
          {/* Gradient Border Effect */}
          <div className="absolute left-0 inset-y-0 w-[2px]">
            <div className="absolute inset-0 bg-gradient-to-b from-[#fa7517]/30 via-[#fa7517]/10 to-[#fa7517]/30" />
          </div>

          {/* Content Container */}
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-800/30">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h2 className="text-xl font-semibold tracking-tight">Comments</h2>
                  <span className="text-sm text-gray-400 mt-0.5">
                    {loading ? (
                      <span className="animate-pulse">Loading comments...</span>
                    ) : (
                      `${totalComments.toLocaleString()} comments`
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 hover:bg-gray-800/50 rounded-full transition-colors"
                    title={isExpanded ? "Collapse panel" : "Expand panel"}
                  >
                    {isExpanded ? (
                      <Minimize2 className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Maximize2 className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-800/50 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Sort Buttons */}
              <div className="flex gap-4 mt-4">
                <button
                  onClick={() => setSortBy('latest')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                    transition-all duration-200 ease-out
                    ${sortBy === 'latest' 
                      ? 'bg-[#fa7517] text-black' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                    }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  Latest
                </button>
                <button
                  onClick={() => setSortBy('top')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                    transition-all duration-200 ease-out
                    ${sortBy === 'top' 
                      ? 'bg-[#fa7517] text-black' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                    }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Top
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
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
                  isPanelExpanded={isExpanded}
                />
              </div>
            </div>

            {/* Comment Input */}
            <div className="border-t border-gray-800/30 p-4">
              <CommentInput
                onAddComment={addComment}
                isAddingComment={isAddingComment}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommentPanel;