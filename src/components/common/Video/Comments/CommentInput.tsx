import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader, Smile } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleEmojiSelect = (emoji: any) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newComment = 
      comment.substring(0, start) + 
      emoji.native + 
      comment.substring(end);
    
    setComment(newComment);
    setShowEmojiPicker(false);

    // Set cursor position after emoji
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + emoji.native.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError(null);
      await onAddComment(comment.trim(), replyTo);
      setComment('');
      setIsFocused(false);
      onCommentAdded?.();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
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
        animate={{ height: isFocused ? '120px' : '48px' }}
        className="flex gap-3"
      >
        <img
          src={user.imageUrl || '/default-avatar.png'}
          alt={user.username || ''}
          className="w-8 h-8 rounded-full"
        />
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => !comment && setIsFocused(false)}
            placeholder="Add a comment..."
            className="w-full h-full bg-gray-900/30 rounded-lg px-3 py-2 
                     text-sm text-gray-200 placeholder-gray-500 resize-none
                     border border-transparent focus:border-[#fa7517]/30
                     transition-all duration-300 outline-none
                     focus:ring-2 focus:ring-[#fa7517]/20
                     focus:border-[#fa7517]/50"
          />
          
          {error && (
            <div className="absolute -bottom-6 left-0 text-xs text-red-500">
              {error}
            </div>
          )}
          
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              ref={emojiButtonRef}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-400 hover:text-[#fa7517] transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>
            
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

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full right-0 mb-2 z-50"
          >
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              theme="dark"
              previewPosition="none"
              skinTonePosition="none"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommentInput;