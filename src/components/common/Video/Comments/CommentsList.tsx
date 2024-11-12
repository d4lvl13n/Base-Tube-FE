import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, AlertTriangle } from 'lucide-react';
import type { Comment, ApiResponse } from '../../../../types/comment';
import CommentCard from './CommentCard';

interface CommentsListProps {
  comments: Comment[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  onEdit: (commentId: number, content: string) => Promise<ApiResponse<Comment>>;
  onDelete: (commentId: number) => Promise<ApiResponse<void>>;
  onPin: (commentId: number) => Promise<ApiResponse<Comment>>;
  onUnpin: (commentId: number) => Promise<ApiResponse<void>>;
  onAddReply: (content: string, parentId?: number) => Promise<ApiResponse<Comment>>;
  canModifyComment: (comment: Comment) => boolean;
  canPinComment: (comment: Comment) => boolean;
  isDeletingComment: boolean;
  isEditingComment: boolean;
  isPanelExpanded: boolean;
}

const LoadingComment = () => (
  <div className="animate-pulse space-y-3">
    <div className="flex gap-3">
      <div className="w-8 h-8 bg-gray-800 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-800 rounded w-24" />
        <div className="h-3 bg-gray-800 rounded w-full" />
        <div className="h-3 bg-gray-800 rounded w-3/4" />
      </div>
    </div>
  </div>
);

const CommentsList: React.FC<CommentsListProps> = ({
  comments,
  loading,
  error,
  hasMore,
  loadMore,
  onEdit,
  onDelete,
  onPin,
  onUnpin,
  onAddReply,
  canModifyComment,
  canPinComment,
  isDeletingComment,
  isEditingComment,
  isPanelExpanded
}) => {
  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <LoadingComment />
            <LoadingComment />
            <LoadingComment />
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-500">
                  Error loading comments
                </h3>
                <p className="text-xs text-red-400 mt-1">
                  {error.message}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs text-red-500 hover:text-red-400 mt-2
                           underline underline-offset-2"
                >
                  Try refreshing the page
                </button>
              </div>
            </div>
          </motion.div>
        ) : comments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center py-12 text-gray-400"
          >
            <MessageCircle className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No comments yet</p>
            <p className="text-sm mt-1">Be the first to share your thoughts!</p>
          </motion.div>
        ) : (
          <>
            {comments.map((comment) => (
              <CommentCard
                key={`${comment.id}-${comment.updatedAt}`}
                comment={comment}
                nestingLevel={0}
                onEdit={onEdit}
                onDelete={onDelete}
                onPin={onPin}
                onUnpin={onUnpin}
                onAddReply={onAddReply}
                canModifyComment={canModifyComment}
                canPinComment={canPinComment}
                isDeletingComment={isDeletingComment}
                isEditingComment={isEditingComment}
                isPanelExpanded={isPanelExpanded}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {hasMore && !loading && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={loadMore}
          className="w-full py-2 text-gray-400 hover:text-white"
        >
          Load more comments
        </motion.button>
      )}
    </div>
  );
};

export default CommentsList;