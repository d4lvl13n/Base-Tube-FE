import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import type { ApiResponse, Comment } from '../../../../types/comment';

interface CommentInputProps {
  onAddComment: (content: string, parentId?: number) => Promise<ApiResponse<Comment>>;
  isAddingComment: boolean;
  replyTo?: number;
  onCommentAdded?: () => void;
  initialContent?: string;
  onCancel?: () => void;
}

const CommentInput: React.FC<CommentInputProps> = ({
  onAddComment,
  isAddingComment,
  replyTo,
  onCommentAdded,
  initialContent = '',
  onCancel
}) => {
  const { user } = useUser();
  const [comment, setComment] = useState(initialContent);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!comment.trim() || isAddingComment) return;
    
    try {
      setError(null);
      await onAddComment(comment.trim(), replyTo);
      setComment('');
      setIsFocused(false);
      onCommentAdded?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add comment');
    }
  };

  const handleCancel = () => {
    setComment(initialContent);
    setIsFocused(false);
    onCancel?.();
  };

  if (!user) {
    return (
      <div className="text-center p-4 text-gray-400">
        Please sign in to comment
      </div>
    );
  }

  return (
    <div className="relative">
      <motion.div
        animate={{ height: isFocused ? '120px' : '56px' }}
        className="flex gap-3"
      >
        <img
          src={user.imageUrl || '/default-avatar.png'}
          alt={user.username || ''}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1 relative">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => !comment && setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              } else if (e.key === 'Escape') {
                handleCancel();
              }
            }}
            placeholder="Add a comment..."
            className="w-full h-full bg-gray-900/50 rounded-xl px-4 py-3 
                     text-gray-200 placeholder-gray-500 resize-none
                     border border-gray-800/30 focus:border-[#fa7517]/30
                     transition-all duration-300 backdrop-blur-sm"
          />
          
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
          
          <div className="absolute bottom-3 right-3 flex gap-2">
            {onCancel && (
              <button
                onClick={handleCancel}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}
            
            <motion.button
              onClick={handleSubmit}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: comment ? 1 : 0,
                scale: comment ? 1 : 0.8,
              }}
              className="p-2 bg-[#fa7517] rounded-full text-black disabled:opacity-50"
              disabled={!comment.trim() || isAddingComment}
            >
              {isAddingComment ? (
                <Loader className="animate-spin" size={18} />
              ) : (
                <Send size={18} />
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
      
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#fa751708] to-transparent 
                    rounded-xl pointer-events-none" />
    </div>
  );
};

export default CommentInput;