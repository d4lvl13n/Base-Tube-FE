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
  const [scrollProgress, setScrollProgress] = useState(0);

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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const progress = 
      target.scrollTop / (target.scrollHeight - target.clientHeight);
    setScrollProgress(progress);
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop without blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ 
              x: 0,
              transition: {
                type: "spring",
                damping: 20,
                stiffness: 100,
                duration: 0.8
              }
            }}
            exit={{ 
              x: '100%',
              transition: {
                type: "spring",
                damping: 30,
                stiffness: 200,
                duration: 0.8,
                ease: "easeInOut"
              }
            }}
            className="fixed right-0 top-0 h-full z-50 overflow-hidden"
          >
            {/* Panel Container with width animation */}
            <motion.div
              animate={{ 
                width: isExpanded ? 800 : 500,
                transition: {
                  type: "spring",
                  damping: 20,
                  stiffness: 100,
                  duration: 0.6
                }
              }}
              className="h-full bg-black/95 shadow-2xl"
            >
              {/* Gradient Border */}
              <div className="absolute left-0 inset-y-0 w-[2px]">
                <div className="absolute inset-0 bg-gradient-to-b from-[#fa7517]/30 via-[#fa7517]/10 to-[#fa7517]/30" />
              </div>

              {/* Content Container */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  transition: {
                    delay: 0.2,
                    duration: 0.4,
                    ease: "easeOut"
                  }
                }}
                exit={{ 
                  opacity: 0, 
                  x: 20,
                  transition: {
                    duration: 0.3,
                    ease: "easeIn"
                  }
                }}
                className="h-full flex flex-col"
              >
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
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 hover:bg-gray-800/50 rounded-full transition-colors"
                        title={isExpanded ? "Collapse panel" : "Expand panel"}
                      >
                        {isExpanded ? (
                          <Minimize2 className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Maximize2 className="w-5 h-5 text-gray-400" />
                        )}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800/50 rounded-full transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-400" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Enhanced Sort Controls */}
                  <div className="flex gap-4 mt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSortBy('latest')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                        relative overflow-hidden transition-all duration-200 ease-out
                        ${sortBy === 'latest' 
                          ? 'bg-[#fa7517] text-black shadow-lg shadow-[#fa7517]/20' 
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                        }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Latest
                      {sortBy === 'latest' && (
                        <motion.div
                          layoutId="sortIndicator"
                          className="absolute inset-0 bg-gradient-to-r from-[#fa7517] to-[#fa7517]/80"
                          style={{ zIndex: -1 }}
                        />
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSortBy('top')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                        relative overflow-hidden transition-all duration-200 ease-out
                        ${sortBy === 'top' 
                          ? 'bg-[#fa7517] text-black shadow-lg shadow-[#fa7517]/20' 
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                        }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      Top
                      {sortBy === 'top' && (
                        <motion.div
                          layoutId="sortIndicator"
                          className="absolute inset-0 bg-gradient-to-r from-[#fa7517] to-[#fa7517]/80"
                          style={{ zIndex: -1 }}
                        />
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Comments List Section with Scroll Progress */}
                <div 
                  className="flex-1 overflow-y-auto relative"
                  onScroll={handleScroll}
                >
                  {/* Scroll Progress Indicator */}
                  <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-gray-800/30">
                    <motion.div
                      className="w-full bg-[#fa7517]/30"
                      animate={{ height: `${scrollProgress * 100}%` }}
                      transition={{ type: "spring", bounce: 0 }}
                    />
                  </div>

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
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommentPanel;