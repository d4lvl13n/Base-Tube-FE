import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Twitter, Facebook, MessageCircle, Link2, Mail } from 'lucide-react';

interface SharePopupProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
}

export const SharePopup: React.FC<SharePopupProps> = ({ isOpen, onClose, videoUrl, title }) => {
  const shareOptions = [
    {
      name: 'Copy Link',
      icon: Copy,
      color: '#fa7517',
      onClick: async () => {
        await navigator.clipboard.writeText(videoUrl);
        onClose();
      }
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: '#1DA1F2',
      onClick: () => {
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(title)}`, '_blank');
      }
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: '#1877F2',
      onClick: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`, '_blank');
      }
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: '#25D366',
      onClick: () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(`${title} ${videoUrl}`)}`, '_blank');
      }
    },
    {
      name: 'Email',
      icon: Mail,
      color: '#EA4335',
      onClick: () => {
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(videoUrl)}`, '_blank');
      }
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - increase z-index */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Popup - increase z-index */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101]
                     w-full max-w-md bg-black/90 rounded-2xl p-6
                     border border-white/10 shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full
                       hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Share Video</h2>
              <p className="text-gray-400 mt-1">Choose how you want to share</p>
            </div>

            {/* URL Preview */}
            <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg mb-6">
              <Link2 className="w-5 h-5 text-[#fa7517]" />
              <p className="text-sm text-gray-300 truncate flex-1">
                {videoUrl}
              </p>
            </div>

            {/* Share Options */}
            <div className="grid grid-cols-2 gap-4">
              {shareOptions.map((option) => (
                <motion.button
                  key={option.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={option.onClick}
                  className="flex items-center gap-3 p-4 rounded-xl
                           bg-white/5 hover:bg-white/10 transition-colors
                           border border-white/5 hover:border-white/10"
                >
                  <option.icon 
                    className="w-5 h-5" 
                    style={{ color: option.color }} 
                  />
                  <span className="text-white font-medium">{option.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 