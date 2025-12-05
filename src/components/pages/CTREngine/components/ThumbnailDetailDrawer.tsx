import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Check, Copy, Calendar, Zap, Mail, Eye, Sparkles, ExternalLink, ArrowRight, Share2 } from 'lucide-react';
import { usePublicThumbnailGenerator } from '../../../../hooks/usePublicThumbnailGenerator';
import Button from '../../../common/Button';
import { ViralSharePopup } from './ViralSharePopup';

interface GeneratedThumbnail {
  id: string | number;
  prompt: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  shareUrl?: string;
}

interface ThumbnailDetailDrawerProps {
  thumbnail: GeneratedThumbnail | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ThumbnailDetailDrawer: React.FC<ThumbnailDetailDrawerProps> = ({
  thumbnail,
  isOpen,
  onClose
}) => {
  const {
    needsEmailCapture,
    submitEmailForDownload,
    downloadThumbnail,
    forceDownload,
    error,
    clearError
  } = usePublicThumbnailGenerator();

  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'downloaded'>('idle');
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [isViralShareOpen, setIsViralShareOpen] = useState(false);

  // ESC key to close drawer
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen, onClose]);

  // Copy prompt to clipboard
  const copyPrompt = () => {
    if (thumbnail?.prompt) {
      navigator.clipboard.writeText(thumbnail.prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  // Handle download
  const handleDownload = async () => {
    if (!thumbnail) return;
    
    setDownloadStatus('downloading');
    clearError();
    
    try {
      await downloadThumbnail(thumbnail.id.toString());
      
      // If email capture is not needed, mark as downloaded
      if (!needsEmailCapture) {
        setDownloadStatus('downloaded');
        setTimeout(() => setDownloadStatus('idle'), 2000);
      }
    } catch (err) {
      console.error('Download error:', err);
      setDownloadStatus('idle');
    }
  };

  // Handle email submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setEmailSubmitting(true);
    setEmailSuccess(false);
    clearError();
    
    try {
      await submitEmailForDownload(email, thumbnail?.id);
      
      // Show success state
      setEmailSuccess(true);
      
      // After successful email submission, force download the thumbnail
      if (thumbnail) {
        console.log('📧 Email submitted successfully, scheduling download for:', thumbnail.id);
        setTimeout(async () => {
          console.log('⏰ Timeout reached, calling forceDownload...');
          await forceDownload(thumbnail.id.toString());
          setDownloadStatus('downloaded');
          setTimeout(() => setDownloadStatus('idle'), 2000);
        }, 1000);
      } else {
        console.error('❌ No thumbnail available for download after email submission');
      }
      
      setEmail('');
      
      // Auto-close success message after a while
      setTimeout(() => {
        setEmailSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Email submission error:', error);
    } finally {
      setEmailSubmitting(false);
    }
  };

  // Handle viral sharing
  const handleShare = () => {
    if (!thumbnail) return;
    setIsViralShareOpen(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  // Prevent right-click on image
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && thumbnail && (
        <>
          {/* Backdrop without blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ 
              x: 0,
              transition: {
                type: "spring",
                damping: 20,
                stiffness: 100,
                duration: 0.8
              }
            }}
            exit={{ 
              x: '100%',
              transition: {
                type: "spring",
                damping: 30,
                stiffness: 200,
                duration: 0.8,
                ease: "easeInOut"
              }
            }}
            className="fixed right-0 top-0 h-full z-50 overflow-hidden w-full sm:w-[600px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Panel Container */}
            <motion.div
              className="h-full w-full sm:w-[600px] bg-black/95 shadow-2xl"
            >
              {/* Gradient Border */}
              <div className="absolute left-0 inset-y-0 w-[2px]">
                <div className="absolute inset-0 bg-gradient-to-b from-[#fa7517]/30 via-[#fa7517]/10 to-[#fa7517]/30" />
              </div>

              {/* Content Container */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  transition: {
                    delay: 0.2,
                    duration: 0.4,
                    ease: "easeOut"
                  }
                }}
                exit={{ 
                  opacity: 0, 
                  x: 20,
                  transition: {
                    duration: 0.3,
                    ease: "easeIn"
                  }
                }}
                className="h-full flex flex-col"
              >
                {/* Header */}
                <div className="p-3 sm:p-4 border-b border-gray-800/30">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-white truncate">Thumbnail Details</h2>
                        <span className="text-xs sm:text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{formatDate(thumbnail.createdAt)}</span>
                        </span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onClose}
                      className="p-2 hover:bg-gray-800/50 rounded-full transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </motion.button>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                    {/* Thumbnail Image */}
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#fa7517]/30 via-orange-400/30 to-[#fa7517]/30 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
                      <div className="relative bg-black/60 rounded-xl overflow-hidden border border-white/20">
                        <img
                          src={thumbnail.imageUrl || thumbnail.thumbnailUrl || ''}
                          alt="AI Generated Thumbnail"
                          className="w-full h-full object-contain"
                          onContextMenu={handleContextMenu}
                          draggable="false"
                          onError={(e) => {
                            console.error('Failed to load thumbnail image:', thumbnail.imageUrl || thumbnail.thumbnailUrl);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>

                    {/* Prompt Section */}
                    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                          <Zap className="w-4 h-4 text-[#fa7517]" />
                          Prompt
                        </h3>
                        <motion.button
                          onClick={copyPrompt}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-2 text-xs ${
                            copiedPrompt 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-white/5 text-gray-300 hover:text-white border border-white/10 hover:border-white/20'
                          }`}
                        >
                          {copiedPrompt ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span className="font-medium">
                            {copiedPrompt ? 'Copied!' : 'Copy'}
                          </span>
                        </motion.button>
                      </div>
                      <div className="text-gray-300 leading-relaxed text-sm bg-black/40 rounded-lg p-3 border border-white/5">
                        {thumbnail.prompt}
                      </div>
                    </div>

                    {/* Specs Section */}
                    <div className="bg-gradient-to-br from-[#fa7517]/10 to-orange-400/5 rounded-xl p-4 border border-[#fa7517]/20">
                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
                        <ExternalLink className="w-4 h-4 text-[#fa7517]" />
                        Specs
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Resolution', value: '1536×1024', icon: '🎯' },
                          { label: 'Format', value: 'PNG', icon: '📸' },
                          { label: 'License', value: 'Commercial', icon: '✅' },
                          { label: 'Quality', value: 'Ultra HD', icon: '⭐' }
                        ].map((spec) => (
                          <div 
                            key={spec.label}
                            className="flex items-center justify-between bg-white/5 rounded-lg p-2"
                          >
                            <span className="text-gray-400 text-xs flex items-center gap-1">
                              <span>{spec.icon}</span>
                              {spec.label}
                            </span>
                            <span className="text-white text-xs font-medium">{spec.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-gray-800/30 p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <Button
                    onClick={handleDownload}
                    disabled={downloadStatus === 'downloading'}
                    className="w-full bg-gradient-to-r from-[#fa7517] to-orange-400 hover:from-[#fa7517]/90 hover:to-orange-400/90 text-white py-3 sm:py-3 rounded-xl font-semibold shadow-lg hover:shadow-[#fa7517]/50 transition-all duration-300 group min-h-[52px] sm:min-h-[48px] text-sm sm:text-base"
                  >
                    {downloadStatus === 'downloading' ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : downloadStatus === 'downloaded' ? (
                      <div className="flex items-center justify-center gap-2">
                        <Check className="w-5 h-5" />
                        <span>Downloaded!</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Download className="w-5 h-5" />
                        <span>Download HD</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform hidden sm:block" />
                      </div>
                    )}
                  </Button>
                  
                  <motion.button
                    onClick={handleShare}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 sm:py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:shadow-purple-500/30 text-white min-h-[52px] sm:min-h-[48px] text-sm sm:text-base"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
          
          {/* Enhanced Email Capture Modal */}
          <AnimatePresence>
            {needsEmailCapture && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-[70] p-4"
                onClick={() => {/* Prevent closing on backdrop click during email capture */}}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, y: 50 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: 50 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="relative max-w-md w-full"
                >
                  {/* Glow effect */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 rounded-3xl blur-2xl" />
                  
                  <div className="relative bg-gradient-to-br from-black/95 to-black/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    
                    {/* Header with animated icon */}
                    <div className="text-center mb-6">
                      <motion.div 
                        className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-500 ${
                          emailSuccess 
                            ? 'bg-gradient-to-r from-green-500 to-green-600' 
                            : 'bg-gradient-to-r from-[#fa7517] to-orange-400'
                        }`}
                        animate={{ 
                          scale: emailSuccess ? [1, 1.1, 1] : [1, 1.05, 1],
                          rotate: emailSuccess ? [0, 360] : 0
                        }}
                        transition={{ 
                          scale: { duration: 0.5 },
                          rotate: { duration: 0.8 }
                        }}
                      >
                        {emailSuccess ? (
                          <Check className="w-10 h-10 text-white" />
                        ) : (
                          <Mail className="w-10 h-10 text-white" />
                        )}
                      </motion.div>
                      
                      <h3 className="text-3xl font-bold text-white mb-3">
                        {emailSuccess ? '🎉 Success!' : '🎨 Almost There!'}
                      </h3>
                      <p className="text-gray-300 leading-relaxed">
                        {emailSuccess 
                          ? 'Your download is starting! Check your email for exclusive AI thumbnail tips and tricks.'
                          : 'Enter your email to unlock this HD thumbnail and get insider AI creation secrets delivered to your inbox.'
                        }
                      </p>
                    </div>

                    {!emailSuccess && (
                      <form onSubmit={handleEmailSubmit} className="space-y-6">
                        <div className="relative">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            disabled={emailSubmitting}
                            className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#fa7517]/50 focus:ring-4 focus:ring-[#fa7517]/20 transition-all duration-300 disabled:opacity-50 text-center text-lg"
                            required
                          />
                        </div>

                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-500/10 border-2 border-red-500/20 rounded-2xl p-4 text-red-300 text-center"
                          >
                            {error}
                          </motion.div>
                        )}

                        <Button
                          type="submit"
                          disabled={emailSubmitting}
                          className="w-full bg-gradient-to-r from-[#fa7517] to-orange-400 hover:from-[#fa7517]/90 hover:to-orange-400/90 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-[#fa7517]/50 transition-all duration-300 disabled:opacity-50"
                        >
                          {emailSubmitting ? (
                            <div className="flex items-center justify-center gap-3">
                              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Securing Your Download...</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-3">
                              <Download className="w-6 h-6" />
                              <span>Get My Thumbnail</span>
                              <Sparkles className="w-5 h-5" />
                            </div>
                          )}
                        </Button>
                      </form>
                    )}

                    {emailSuccess && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-500/10 border-2 border-green-500/20 rounded-2xl p-6 text-center"
                      >
                        <div className="text-green-300 mb-2">
                          ✨ Download starting automatically...
                        </div>
                        <div className="text-green-400 text-sm">
                          Check your downloads folder in a few seconds!
                        </div>
                      </motion.div>
                    )}

                    {/* Trust indicators */}
                    <div className="mt-6 text-center space-y-2">
                      <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          No spam ever
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          Instant download
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          Free tips
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Powered by Formspree • Your email is 100% secure
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
      
      {/* Viral Share Popup */}
      <ViralSharePopup
        thumbnail={thumbnail}
        isOpen={isViralShareOpen}
        onClose={() => setIsViralShareOpen(false)}
      />
    </AnimatePresence>
  );
};
