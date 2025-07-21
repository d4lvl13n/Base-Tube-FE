import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Check, Copy, Calendar, Zap, Mail, Eye, Sparkles, ExternalLink, ArrowRight, Share2 } from 'lucide-react';
import { usePublicThumbnailGenerator } from '../../../hooks/usePublicThumbnailGenerator';
import Button from '../../common/Button';
import { ViralSharePopup } from './ViralSharePopup';

interface GeneratedThumbnail {
  id: string;
  prompt: string;
  imageUrl: string;
  createdAt: string;
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
    clearError,
    getCurrentThumbnailContext
  } = usePublicThumbnailGenerator();

  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'downloaded'>('idle');
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared'>('idle');
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
      await downloadThumbnail(thumbnail.id);
      
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
          await forceDownload(thumbnail.id);
          setDownloadStatus('downloaded');
          setTimeout(() => setDownloadStatus('idle'), 2000);
        }, 1000); // Small delay to show success message
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
    <AnimatePresence>
      {isOpen && thumbnail && (
        <>
          {/* Backdrop with spectacular visual effects */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#fa7517]/20 via-black/95 to-black z-40 cursor-pointer"
            onClick={onClose}
          >
            {/* Animated particles background */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-[#fa7517]/30 rounded-full"
                  initial={{ 
                    x: Math.random() * window.innerWidth, 
                    y: window.innerHeight + 100 
                  }}
                  animate={{ 
                    y: -100,
                    opacity: [0, 1, 0],
                  }}
                  transition={{ 
                    duration: Math.random() * 3 + 2, 
                    repeat: Infinity, 
                    delay: Math.random() * 2,
                    ease: "linear"
                  }}
                />
              ))}
            </div>
          </motion.div>
          
          {/* Revolutionary Modal Design */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: 100 }}
            transition={{ 
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.6
            }}
            className="fixed inset-4 md:inset-8 lg:inset-16 bg-gradient-to-br from-black/95 via-black/90 to-black/95 backdrop-blur-2xl z-50 rounded-3xl shadow-2xl border border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Epic gradient borders */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#fa7517]/20 via-transparent to-[#fa7517]/20 rounded-3xl" />
            <div className="absolute inset-[1px] bg-gradient-to-br from-black/95 via-black/90 to-black/95 rounded-3xl" />
            
            {/* Floating orbs */}
            <div className="absolute top-10 right-20 w-32 h-32 bg-[#fa7517]/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 left-16 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
            
            {/* Close button - Floating and prominent */}
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-6 right-6 z-20 w-12 h-12 bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-full flex items-center justify-center shadow-xl hover:shadow-[#fa7517]/50 transition-all duration-300"
            >
              <X className="w-6 h-6 text-white" />
            </motion.button>
            
            {/* Content Layout */}
            <div className="relative h-full flex flex-col p-8">
              
              {/* Header - Sleek and modern */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-4 mb-8"
              >
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
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                    AI Masterpiece
                  </h1>
                  <p className="text-[#fa7517] flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4" />
                    Generated {formatDate(thumbnail.createdAt)}
                  </p>
                </div>
              </motion.div>

              {/* Main content grid */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-8">
                
                {/* Left - Spectacular image showcase */}
                <motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="lg:col-span-3 relative"
                >
                  <div className="relative group">
                    {/* Glowing frame */}
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#fa7517]/50 via-orange-400/50 to-[#fa7517]/50 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Image container */}
                    <div className="relative bg-black/60 rounded-2xl overflow-hidden border border-white/20 aspect-video">
                      {/* Background pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fa7517' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        }} />
                      </div>
                      
                      {/* Actual thumbnail */}
                      <img
                        src={thumbnail.imageUrl}
                        alt="AI Generated Thumbnail"
                        className="w-full h-full object-contain relative z-10"
                        onContextMenu={handleContextMenu}
                        draggable="false"
                      />
                      
                      {/* Floating action button */}
                      <motion.button
                        onClick={handleDownload}
                        disabled={downloadStatus === 'downloading'}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="absolute bottom-4 right-4 bg-gradient-to-r from-[#fa7517] to-orange-400 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-xl hover:shadow-[#fa7517]/50 transition-all duration-300 disabled:opacity-60 z-20"
                      >
                        {downloadStatus === 'downloading' ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                            <Download className="w-5 h-5" />
                          </motion.div>
                        ) : downloadStatus === 'downloaded' ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                        <span className="font-semibold">
                          {downloadStatus === 'downloading' ? 'Processing...' :
                           downloadStatus === 'downloaded' ? 'Downloaded!' : 'Download HD'}
                        </span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>

                {/* Right - Elegant details panel */}
                <motion.div 
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="lg:col-span-2 flex flex-col space-y-6"
                >
                  
                  {/* Prompt showcase */}
                  <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Zap className="w-5 h-5 text-[#fa7517]" />
                        Your Prompt
                      </h3>
                      <motion.button
                        onClick={copyPrompt}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 ${
                          copiedPrompt 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-white/5 text-gray-300 hover:text-white border border-white/10 hover:border-white/20'
                        }`}
                      >
                        {copiedPrompt ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span className="text-sm font-medium">
                          {copiedPrompt ? 'Copied!' : 'Copy'}
                        </span>
                      </motion.button>
                    </div>
                    <div className="text-gray-300 leading-relaxed text-sm bg-black/40 rounded-xl p-4 border border-white/5">
                      {thumbnail.prompt}
                    </div>
                  </div>

                  {/* Specs showcase */}
                  <div className="bg-gradient-to-br from-[#fa7517]/10 to-orange-400/5 rounded-2xl p-6 border border-[#fa7517]/20">
                    <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <ExternalLink className="w-5 h-5 text-[#fa7517]" />
                      Thumbnail Specs
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { label: 'Resolution', value: '1536×1024 HD', icon: '🎯' },
                        { label: 'Format', value: 'PNG with Alpha', icon: '📸' },
                        { label: 'License', value: 'Commercial Use', icon: '✅' },
                        { label: 'Quality', value: 'Ultra High', icon: '⭐' }
                      ].map((spec, i) => (
                        <motion.div 
                          key={spec.label}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                          className="flex items-center justify-between bg-white/5 rounded-xl p-3"
                        >
                          <span className="text-gray-400 text-sm flex items-center gap-2">
                            <span>{spec.icon}</span>
                            {spec.label}
                          </span>
                          <span className="text-white text-sm font-medium">{spec.value}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-4"
                  >
                    <Button
                      onClick={handleDownload}
                      disabled={downloadStatus === 'downloading'}
                      className="w-full bg-gradient-to-r from-[#fa7517] to-orange-400 hover:from-[#fa7517]/90 hover:to-orange-400/90 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-[#fa7517]/50 transition-all duration-300 group"
                    >
                      {downloadStatus === 'downloading' ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Preparing Magic...</span>
                        </div>
                      ) : downloadStatus === 'downloaded' ? (
                        <div className="flex items-center justify-center gap-3">
                          <Check className="w-6 h-6" />
                          <span>Downloaded Successfully!</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <Download className="w-6 h-6" />
                          <span>Download Your Masterpiece</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      )}
                    </Button>
                    
                    {/* Share Button */}
                    <motion.button
                      onClick={handleShare}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:shadow-purple-500/30 text-white"
                    >
                      <Share2 className="w-5 h-5" />
                      <span>Share Your Creation</span>
                    </motion.button>
                  </motion.div>

                </motion.div>
              </div>

              {/* Bottom hint */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6 text-center"
              >
                <p className="text-gray-500 text-sm">
                  Press <kbd className="px-2 py-1 bg-white/10 rounded-lg text-white mx-1">ESC</kbd> 
                  or click outside to close
                </p>
              </motion.div>
            </div>
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
                          <motion.div 
                            className="absolute inset-0 rounded-2xl border-2 border-[#fa7517]/50 opacity-0 focus-within:opacity-100 transition-opacity pointer-events-none"
                            initial={false}
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