import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, MessageCircle, Trash, Edit, Pin } from 'lucide-react';
import type { Comment, ApiResponse } from '../../../../types/comment';
import CommentInput from './CommentInput';

interface CommentCardProps {
  comment: Comment;
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

const CommentCard: React.FC<CommentCardProps> = ({
  comment,
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
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleEdit = async (content: string, _parentId?: number): Promise<ApiResponse<Comment>> => {
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

  const handleReply = async (content: string, _parentId?: number): Promise<ApiResponse<Comment>> => {
    try {
      const response = await onAddReply(content, comment.id);
      setIsReplying(false);
      return response;
    } catch (error) {
      console.error('Error adding reply:', error);
      throw error;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`p-4 rounded-xl bg-gray-900/50 backdrop-blur-sm
                 border border-gray-800/30 ${comment.isPinned ? 'border-[#fa7517]/30' : ''}`}
    >
      <div className="flex gap-3">
        <img
          src={comment.commenter.profile_image_url || '/default-avatar.png'}
          alt={comment.commenter.username}
          className="w-10 h-10 rounded-full"
        />
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-medium text-gray-200">
                {comment.commenter.username}
              </span>
              {comment.isPinned && (
                <span className="ml-2 text-xs text-[#fa7517]">
                  Pinned
                </span>
              )}
            </div>
            
            {(canModifyComment(comment) || canPinComment(comment)) && (
              <div className="relative">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="p-1 hover:bg-gray-800/50 rounded-full transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
                
                {showOptions && (
                  <div className="absolute right-0 mt-1 py-1 w-32 bg-gray-900 
                               rounded-xl border border-gray-800/30 shadow-xl">
                    {canModifyComment(comment) && (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setShowOptions(false);
                          }}
                          className="w-full px-3 py-1.5 text-left text-sm text-gray-300 
                                   hover:bg-gray-800/50 flex items-center gap-2"
                          disabled={isEditingComment}
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            handleDelete();
                            setShowOptions(false);
                          }}
                          className="w-full px-3 py-1.5 text-left text-sm text-red-500 
                                   hover:bg-gray-800/50 flex items-center gap-2"
                          disabled={isDeletingComment}
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
                        className="w-full px-3 py-1.5 text-left text-sm text-gray-300 
                                 hover:bg-gray-800/50 flex items-center gap-2"
                      >
                        <Pin className="w-4 h-4" />
                        {comment.isPinned ? 'Unpin' : 'Pin'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {isEditing ? (
            <CommentInput
              onAddComment={handleEdit}
              isAddingComment={isEditingComment}
              initialContent={comment.content}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <p className="mt-1 text-gray-300 whitespace-pre-wrap">
              {comment.content}
            </p>
          )}
          
          <div className="mt-2 flex items-center gap-4">
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="text-sm text-gray-400 hover:text-white 
                       flex items-center gap-1 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Reply
            </button>
          </div>
          
          {isReplying && (
            <div className="mt-4">
              <CommentInput
                onAddComment={handleReply}
                isAddingComment={false}
                onCommentAdded={() => setIsReplying(false)}
              />
            </div>
          )}
          
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4 pl-4 border-l border-gray-800/30">
              {comment.replies.map((reply) => (
                <CommentCard
                  key={`${reply.id}-${reply.updatedAt}`}
                  comment={reply}
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
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CommentCard;