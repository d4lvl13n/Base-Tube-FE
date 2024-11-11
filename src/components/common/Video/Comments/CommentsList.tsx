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
  isPanelExpanded: boolean;
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
  isEditingComment,
  isPanelExpanded
}) => {
  // Only render top-level comments
  const topLevelComments = comments?.filter(comment => !comment.parent_id) || [];

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
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {topLevelComments.map((comment) => (
          <motion.div key={`${comment.id}-${comment.updatedAt}`}>
            <CommentCard
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
            
            {/* Level 1 replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="ml-8 space-y-4 border-l-2 border-gray-800 pl-4">
                {comment.replies.map((reply) => (
                  <div key={`${reply.id}-${reply.updatedAt}`}>
                    <CommentCard
                      comment={reply}
                      nestingLevel={1}
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
                    
                    {/* Level 2 replies */}
                    {reply.replies && reply.replies.length > 0 && (
                      <div className="ml-6 space-y-4 border-l-2 border-gray-800/50 pl-4">
                        {reply.replies.map((nestedReply) => (
                          <CommentCard
                            key={`${nestedReply.id}-${nestedReply.updatedAt}`}
                            comment={nestedReply}
                            nestingLevel={2}
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
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      
      {hasMore && (
        <button onClick={loadMore} className="w-full py-2 text-gray-400 hover:text-white">
          Load more comments
        </button>
      )}
    </div>
  );
};

export default CommentsList;