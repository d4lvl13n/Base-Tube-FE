import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Copy, 
  Twitter, 
  Facebook, 
  MessageCircle, 
  Link2, 
  Mail,
  Instagram,
  Linkedin,
  Download,
  Sparkles,
  Zap
} from 'lucide-react';
import { toast } from 'react-toastify';

interface GeneratedThumbnail {
  id: string;
  prompt: string;
  imageUrl: string;
  createdAt: string;
}

interface ViralSharePopupProps {
  isOpen: boolean;
  onClose: () => void;
  thumbnail: GeneratedThumbnail | null;
}

export const ViralSharePopup: React.FC<ViralSharePopupProps> = ({ 
  isOpen, 
  onClose, 
  thumbnail 
}) => {
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared'>('idle');

  if (!thumbnail) return null;

  const shareText = `🔥 Just created this amazing thumbnail with AI!\n\n"${thumbnail.prompt}"\n\nTry it yourself for free:`;
  const shareUrl = `${window.location.origin}/ai-thumbnails`;
  const fullShareText = `${shareText} ${shareUrl}`;

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: Copy,
      color: '#fa7517',
      description: 'Copy link to clipboard',
      onClick: async () => {
        await navigator.clipboard.writeText(fullShareText);
        toast.success('🔗 Link copied! Ready to share your AI creation');
        setShareStatus('shared');
        setTimeout(() => {
          setShareStatus('idle');
          onClose();
        }, 1500);
      }
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: '#1DA1F2',
      description: 'Share on Twitter/X',
      onClick: () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank', 'width=550,height=420');
        setShareStatus('shared');
        setTimeout(() => setShareStatus('idle'), 2000);
      }
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: '#0077B5',
      description: 'Share on LinkedIn',
      onClick: () => {
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent('Amazing AI Thumbnail Generator')}&summary=${encodeURIComponent(shareText)}`;
        window.open(linkedinUrl, '_blank', 'width=550,height=420');
        setShareStatus('shared');
        setTimeout(() => setShareStatus('idle'), 2000);
      }
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: '#1877F2',
      description: 'Share on Facebook',
      onClick: () => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        window.open(facebookUrl, '_blank', 'width=550,height=420');
        setShareStatus('shared');
        setTimeout(() => setShareStatus('idle'), 2000);
      }
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: '#25D366',
      description: 'Share on WhatsApp',
      onClick: () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullShareText)}`;
        window.open(whatsappUrl, '_blank');
        setShareStatus('shared');
        setTimeout(() => setShareStatus('idle'), 2000);
      }
    },
    {
      name: 'Email',
      icon: Mail,
      color: '#EA4335',
      description: 'Share via Email',
      onClick: () => {
        const emailUrl = `mailto:?subject=${encodeURIComponent('Check out this AI-generated thumbnail!')}&body=${encodeURIComponent(fullShareText)}`;
        window.open(emailUrl, '_blank');
        setShareStatus('shared');
        setTimeout(() => setShareStatus('idle'), 2000);
      }
    },
  ];

  const handleClose = () => {
    setShareStatus('idle');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with spectacular visual effects */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#fa7517]/20 via-black/95 to-black z-[100] backdrop-blur-sm"
            onClick={handleClose}
          >
            {/* Animated particles background */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-[#fa7517]/40 rounded-full"
                  initial={{ 
                    x: Math.random() * window.innerWidth, 
                    y: window.innerHeight + 100 
                  }}
                  animate={{ 
                    y: -100,
                    opacity: [0, 1, 0],
                  }}
                  transition={{ 
                    duration: Math.random() * 4 + 3, 
                    repeat: Infinity, 
                    delay: Math.random() * 2,
                    ease: "linear"
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Popup */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ 
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.6
            }}
            className="fixed inset-0 flex items-center justify-center z-[101] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-[480px] max-w-full bg-gradient-to-br from-black/95 via-black/90 to-black/95 
                     backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl
                     max-h-[90vh] overflow-y-auto">
            
              {/* Epic gradient borders */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#fa7517]/20 via-transparent to-[#fa7517]/20 rounded-3xl" />
              <div className="absolute inset-[1px] bg-gradient-to-br from-black/95 via-black/90 to-black/95 rounded-3xl" />
              
              {/* Floating orbs */}
              <div className="absolute top-8 right-16 w-24 h-24 bg-[#fa7517]/10 rounded-full blur-2xl animate-pulse" />
              <div className="absolute bottom-12 left-12 w-32 h-32 bg-orange-400/10 rounded-full blur-2xl animate-pulse delay-1000" />

              {/* Close Button */}
              <motion.button
                onClick={handleClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-6 right-6 z-20 w-10 h-10 bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-full flex items-center justify-center shadow-xl hover:shadow-[#fa7517]/50 transition-all duration-300"
              >
                <X className="w-5 h-5 text-white" />
              </motion.button>

              {/* Header */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative z-10 mb-8"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-2xl flex items-center justify-center">
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <motion.div 
                      className="absolute -inset-1 bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-2xl opacity-75 blur-sm"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                      {shareStatus === 'shared' ? '🎉 Shared Successfully!' : '🚀 Share Your Creation'}
                    </h2>
                    <p className="text-[#fa7517] flex items-center gap-2 mt-1">
                      <Zap className="w-4 h-4" />
                      {shareStatus === 'shared' ? 'Help others discover AI magic!' : 'Spread the AI revolution'}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Thumbnail Preview */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="relative z-10 mb-6"
              >
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-[#fa7517]/50 via-orange-400/50 to-[#fa7517]/50 rounded-xl blur-xl opacity-75" />
                  <div className="relative bg-black/60 rounded-xl overflow-hidden border border-white/20 aspect-video">
                    <img
                      src={thumbnail.imageUrl}
                      alt="AI Generated Thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-white text-sm font-medium line-clamp-2">
                        "{thumbnail.prompt}"
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {shareStatus === 'shared' ? (
                /* Success State */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative z-10 text-center space-y-4"
                >
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6 }}
                    >
                      ✨
                    </motion.div>
                  </div>
                  <p className="text-gray-300 text-lg">
                    Your AI creation is now spreading across the internet!
                  </p>
                  <p className="text-gray-400 text-sm">
                    Every share helps more creators discover the power of AI thumbnails
                  </p>
                </motion.div>
              ) : (
                /* Share Options */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="relative z-10"
                >
                  {/* URL Preview */}
                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl mb-6 border border-white/10">
                    <Link2 className="w-5 h-5 text-[#fa7517] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 truncate">
                        {shareText}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {shareUrl}
                      </p>
                    </div>
                  </div>

                  {/* Share Options Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {shareOptions.map((option, index) => (
                      <motion.button
                        key={option.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={option.onClick}
                        className="group flex items-center gap-3 p-4 rounded-xl
                                 bg-gradient-to-br from-white/5 to-white/[0.02] hover:from-white/10 hover:to-white/5
                                 border border-white/10 hover:border-white/20 transition-all duration-300
                                 hover:shadow-lg hover:shadow-black/20"
                      >
                        <div 
                          className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110"
                          style={{ backgroundColor: `${option.color}20` }}
                        >
                          <option.icon 
                            className="w-5 h-5 transition-all duration-300" 
                            style={{ color: option.color }} 
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="block text-white font-medium group-hover:text-gray-100">
                            {option.name}
                          </span>
                          <span className="block text-gray-400 text-xs mt-0.5 group-hover:text-gray-300">
                            {option.description}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Bottom CTA */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-6 text-center"
                  >
                    <p className="text-gray-500 text-sm">
                      Share your AI creation and inspire others to try it! 🎨
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 