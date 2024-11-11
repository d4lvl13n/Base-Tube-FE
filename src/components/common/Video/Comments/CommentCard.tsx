import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, MessageCircle, Trash, Edit, Pin, Heart } from 'lucide-react';
import type { Comment, ApiResponse } from '../../../../types/comment';
import CommentInput from './CommentInput';
import { formatDistanceToNow } from 'date-fns';

interface CommentCardProps {
  comment: Comment;
  nestingLevel: number;
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

const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  nestingLevel,
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
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const commenterImage = comment.commenter?.profile_image_url;
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

  const handleReply = async (content: string) => {
    try {
      const response = await onAddReply(content, comment.id);
      setIsReplying(false);
      return response;
    } catch (error) {
      console.error('Error adding reply:', error);
      throw error;
    }
  };

  const handleEdit = async (content: string) => {
    try {
      const response = await onEdit(comment.id, content);
      setIsEditing(false);
      return response;
    } catch (error) {
      console.error('Error editing comment:', error);
      throw error;
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handlePin = async () => {
    try {
      if (comment.isPinned) {
        await onUnpin(comment.id);
      } else {
        await onPin(comment.id);
      }
    } catch (error) {
      console.error('Error pinning/unpinning comment:', error);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`group relative p-4 rounded-lg transition-colors duration-200
                   ${comment.isPinned ? 'bg-[#fa7517]/5' : 'hover:bg-gray-900/30'}`}
      >
        <div className="flex gap-3">
          {/* Enhanced Avatar */}
          <div className="relative">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 ring-2 ring-gray-700/50">
              {commenterImage ? (
                <img
                  src={commenterImage}
                  alt={comment.commenter?.username || 'User'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-300">
                    {comment.commenter?.username?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-grow min-w-0">
            {/* Enhanced Header */}
            <div className="flex items-baseline gap-2">
              <span className="font-medium text-sm">
                {comment.commenter?.username}
              </span>
              <span className="text-xs text-gray-400">{timeAgo}</span>
              {comment.isPinned && (
                <span className="text-xs text-[#fa7517] bg-[#fa7517]/10 px-2 py-0.5 rounded-full">
                  Pinned
                </span>
              )}
            </div>

            {/* Enhanced Content */}
            {isEditing ? (
              <CommentInput
                initialContent={comment.content}
                onAddComment={handleEdit}
                isAddingComment={isEditingComment}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <div className="mt-1">
                {comment.replyingTo && (
                  <span className="text-xs text-[#fa7517] mb-1 block">
                    Replying to @{comment.replyingTo}
                  </span>
                )}
                <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            )}

            {/* Enhanced Actions */}
            <div className="mt-2 flex items-center gap-4">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`text-xs flex items-center gap-1 transition-colors
                           ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                Like
              </button>
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Reply
              </button>
            </div>

            {/* Reply Input */}
            <AnimatePresence>
              {isReplying && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3"
                >
                  <CommentInput
                    onAddComment={handleReply}
                    isAddingComment={isEditingComment}
                    onCancel={() => setIsReplying(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Enhanced Options Menu */}
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50
                         opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showOptions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 rounded-xl bg-gray-900/90 backdrop-blur-sm
                           border border-gray-800/50 shadow-xl z-10"
                >
                  {canModifyComment(comment) && (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowOptions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-800/50
                                 transition-colors flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          handleDelete();
                          setShowOptions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-800/50
                                 transition-colors text-red-500 flex items-center gap-2"
                      >
                        <Trash className="w-4 h-4" />
                        Delete
                      </button>
                    </>
                  )}
                  {canPinComment(comment) && (
                    <button
                      onClick={() => {
                        handlePin();
                        setShowOptions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-800/50
                               transition-colors flex items-center gap-2"
                    >
                      <Pin className="w-4 h-4" />
                      {comment.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Show reply count when panel is not expanded and has replies */}
        {!isPanelExpanded && comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 text-sm text-gray-400">
            {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
          </div>
        )}

        {/* Only show nested replies when panel is expanded */}
        {isPanelExpanded && comment.replies && comment.replies.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`ml-11 mt-4 space-y-4 ${nestingLevel >= 2 ? 'ml-8' : ''}`}
          >
            {comment.replies.map((reply) => (
              <CommentCard
                key={`${reply.id}-${reply.updatedAt}`}
                comment={reply}
                nestingLevel={nestingLevel + 1}
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
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default CommentCard;