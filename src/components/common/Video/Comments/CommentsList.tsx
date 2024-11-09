import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader } from 'lucide-react';
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
}

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
  isEditingComment
}) => {
  if (loading && (!comments || comments.length === 0)) {
    return (
      <div className="flex justify-center p-8">
        <Loader className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {comments.map((comment) => (
          <CommentCard
            key={`${comment.id}-${comment.updatedAt}`}
            comment={comment}
            onEdit={onEdit}
            onDelete={onDelete}
            onPin={onPin}
            onUnpin={onUnpin}
            onAddReply={onAddReply}
            canModifyComment={canModifyComment}
            canPinComment={canPinComment}
            isDeletingComment={isDeletingComment}
            isEditingComment={isEditingComment}
          />
        ))}
      </AnimatePresence>
      
      {hasMore && (
        <button
          onClick={() => loadMore()}
          className="w-full py-2 text-gray-400 hover:text-white transition-colors"
        >
          Load more comments
        </button>
      )}
    </div>
  );
};

export default CommentsList;