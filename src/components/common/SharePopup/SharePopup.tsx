import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Copy, 
  Code, 
  Twitter, 
  Facebook, 
  MessageCircle, 
  Link2, 
  Mail,
  MonitorSmartphone,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';
import { generateEmbedCode, EMBED_SIZES } from '../../../utils/embed';
import { toast } from 'react-toastify';
import { ShareToast } from '../Toast/ShareToast';
import { recordShareAction, type ShareActionPlatform } from '../../../api/shareApi';

interface SharePopupProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
  videoId?: string;
}

export const SharePopup: React.FC<SharePopupProps> = ({ isOpen, onClose, videoUrl, title, videoId }) => {
  const [showEmbedOptions, setShowEmbedOptions] = useState(false);

  // One share is recorded per COMPLETED action: after the copy succeeded, or
  // once the social window actually opened. Fire-and-forget.
  const track = (platform: ShareActionPlatform) => {
    void recordShareAction(videoId, platform);
  };
  const openShareWindow = (url: string, platform: ShareActionPlatform) => {
    const opened = window.open(url, '_blank');
    // A blocked pop-up returns null: nothing was shared.
    if (opened) track(platform);
  };

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: Copy,
      color: '#fa7517',
      onClick: async () => {
        try {
          await navigator.clipboard.writeText(videoUrl);
        } catch {
          toast.error(ShareToast({ type: 'error' }));
          return;
        }
        toast.success(ShareToast({ type: 'success' }));
        track('copy_link');
        onClose();
      }
    },
    {
      name: 'Embed',
      icon: Code,
      color: '#10B981',
      onClick: () => setShowEmbedOptions(true)
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: '#1DA1F2',
      onClick: () => {
        openShareWindow(`https://twitter.com/intent/tweet?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(title)}`, 'x');
      }
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: '#1877F2',
      onClick: () => {
        openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`, 'facebook');
      }
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: '#25D366',
      onClick: () => {
        openShareWindow(`https://wa.me/?text=${encodeURIComponent(`${title} ${videoUrl}`)}`, 'whatsapp');
      }
    },
    {
      name: 'Email',
      icon: Mail,
      color: '#EA4335',
      onClick: () => {
        // A mailto: hand-off gives no signal back (most browsers return null
        // here even when the mail app opens), so the click is the action.
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(videoUrl)}`, '_blank');
        track('email');
      }
    },
  ];

  const embedSizeOptions = [
    {
      ...EMBED_SIZES.SMALL,
      name: 'Small',
      icon: Smartphone,
      description: 'Perfect for mobile & small widgets'
    },
    {
      ...EMBED_SIZES.MEDIUM,
      name: 'Medium',
      icon: Tablet,
      description: 'Great for blog posts'
    },
    {
      ...EMBED_SIZES.LARGE,
      name: 'Large',
      icon: MonitorSmartphone,
      description: 'Ideal for articles'
    },
    {
      ...EMBED_SIZES.HD,
      name: 'HD',
      icon: Monitor,
      description: 'Best for dedicated video pages'
    }
  ];

  const handleCopyEmbed = async (option: typeof embedSizeOptions[number]) => {
    if (videoId) {
      const embedCode = generateEmbedCode(videoId, title, option);
      try {
        await navigator.clipboard.writeText(embedCode);
      } catch {
        toast.error(ShareToast({ type: 'error' }));
        return;
      }
      toast.success(ShareToast({ type: 'embed-success' }));
      track('embed');
      onClose();
    }
  };

  const handleClose = () => {
    setShowEmbedOptions(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            onClick={handleClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="fixed left-1/3 top-32 z-[101]
                     w-[420px] bg-black/95 rounded-2xl p-6
                     border border-white/10 shadow-2xl
                     max-h-[90vh] overflow-y-auto
                     flex flex-col"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full z-10
                       hover:bg-white/10 transition-colors
                       focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            {/* Header */}
            <div className="mb-6 flex-shrink-0">
              <h2 className="text-2xl font-bold text-white">
                {showEmbedOptions ? 'Embed Player' : 'Share Video'}
              </h2>
              <p className="text-gray-400 mt-1">
                {showEmbedOptions 
                  ? 'Select the perfect size for your website' 
                  : 'Share this video with your audience'}
              </p>
            </div>

            {!showEmbedOptions ? (
              <>
                {/* URL Preview */}
                <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg mb-6 flex-shrink-0">
                  <Link2 className="w-5 h-5 text-[#fa7517]" />
                  <p className="text-sm text-gray-300 truncate flex-1">
                    {videoUrl}
                  </p>
                </div>

                {/* Share Options */}
                <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
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
              </>
            ) : (
              /* Embed Size Options */
              <div className="grid grid-cols-1 gap-4">
                {embedSizeOptions.map((option) => (
                  <motion.button
                    key={option.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => void handleCopyEmbed(option)}
                    className="flex items-center gap-4 p-4 rounded-xl
                             bg-white/5 hover:bg-white/10 transition-colors
                             border border-white/5 hover:border-white/10
                             group hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5"
                  >
                    <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10">
                      <option.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <span className="block text-white font-medium">
                        {option.name}
                      </span>
                      <span className="block text-gray-400 text-sm mt-0.5">
                        {option.description}
                      </span>
                    </div>
                    <span className="text-gray-500 text-sm">
                      {option.width}×{option.height}
                    </span>
                  </motion.button>
                ))}
                <p className="text-center text-gray-400 text-sm mt-2">
                  The embed code will be copied to your clipboard automatically
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 