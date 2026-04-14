import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Check, Copy, Calendar, Mail, Sparkles, ArrowRight, Share2, Link2, ShieldCheck, FileImage } from 'lucide-react';
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
    const sourceUrl = thumbnail.imageUrl || thumbnail.thumbnailUrl;
    
    setDownloadStatus('downloading');
    clearError();
    
    try {
      await downloadThumbnail(thumbnail.id.toString(), sourceUrl);
      
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
        const sourceUrl = thumbnail.imageUrl || thumbnail.thumbnailUrl;
        console.log('📧 Email submitted successfully, scheduling download for:', thumbnail.id);
        setTimeout(async () => {
          console.log('⏰ Timeout reached, calling forceDownload...');
          await forceDownload(thumbnail.id.toString(), sourceUrl);
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

  const imageSrc = thumbnail?.imageUrl || thumbnail?.thumbnailUrl || '';
  const isPersistedThumbnail = /^\d+$/.test(String(thumbnail?.id ?? ''));
  const sourceLabel = isPersistedThumbnail ? 'Saved asset' : 'Fresh generation';
  const details = [
    { label: 'Source', value: sourceLabel, icon: Sparkles },
    { label: 'Export', value: 'PNG image', icon: FileImage },
    { label: 'Usage', value: 'Commercial use', icon: ShieldCheck },
  ];

  return (
    <AnimatePresence mode="wait">
      {isOpen && thumbnail && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 bg-black/65 backdrop-blur-[2px] z-40"
            onClick={onClose}
          />

          <motion.aside
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
            className="fixed right-0 top-0 z-50 h-full w-full overflow-hidden sm:w-[640px] xl:w-[680px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex h-full flex-col bg-[#080809]/96 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
              <div className="absolute left-0 inset-y-0 w-px bg-gradient-to-b from-transparent via-[#fa7517]/35 to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,117,23,0.10),transparent_30%)] pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

              <div className="relative border-b border-white/6 px-4 py-5 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#fa7517]/20 bg-[#fa7517]/12">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#fa7517]">
                          Thumbnail Details
                        </p>
                        <h2 className="truncate text-xl font-semibold text-white sm:text-2xl">
                          Review And Export
                        </h2>
                        <p className="mt-1 text-sm text-gray-400">
                          Preview the final image, copy the prompt, or export a clean PNG.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-gray-400">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#fa7517]" />
                        {formatDate(thumbnail.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-[#fa7517]" />
                        {sourceLabel}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-300">
                        <Check className="h-3.5 w-3.5" />
                        Ready to export
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-gray-500 sm:inline-flex">
                      Esc
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={onClose}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] text-gray-400 transition-colors hover:border-white/15 hover:bg-white/[0.08] hover:text-white"
                      aria-label="Close drawer"
                    >
                      <X className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="relative flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
                <div className="space-y-5">
                  <section className="space-y-4">
                    <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.32)]">
                      <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-black">
                        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 border-b border-white/8 bg-gradient-to-b from-black/68 to-black/10 px-4 py-3 backdrop-blur-md">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#fa7517]">
                              Preview
                            </p>
                            <p className="truncate text-sm text-gray-300">
                              {isPersistedThumbnail ? 'Saved in your gallery and ready to download.' : 'Freshly generated result ready for export.'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleShare}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black/30 bg-black/55 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-200 backdrop-blur-md transition-colors hover:bg-black/70"
                          >
                            <Share2 className="h-3.5 w-3.5 text-[#fa7517]" />
                            Share link
                          </button>
                        </div>
                        <img
                          src={imageSrc}
                          alt="AI generated thumbnail"
                          className="aspect-video w-full object-cover"
                          onContextMenu={handleContextMenu}
                          draggable="false"
                          onError={(e) => {
                            console.error('Failed to load thumbnail image:', imageSrc);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      {details.map((detail) => (
                        <div
                          key={detail.label}
                          className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3.5"
                        >
                          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                            <detail.icon className="h-3.5 w-3.5 text-[#fa7517]" />
                            {detail.label}
                          </p>
                          <p className="mt-2 text-sm font-medium text-white">{detail.value}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[24px] border border-white/8 bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#fa7517]">
                          Generation Prompt
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-white">Creative Direction</h3>
                        <p className="mt-1 text-sm text-gray-400">
                          Keep this handy if you want to regenerate, iterate, or brief a designer.
                        </p>
                      </div>
                      <motion.button
                        onClick={copyPrompt}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                          copiedPrompt
                            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                            : 'border-white/10 bg-white/[0.04] text-gray-300 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {copiedPrompt ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedPrompt ? 'Copied' : 'Copy prompt'}
                      </motion.button>
                    </div>
                    <div className="mt-4 rounded-2xl border border-white/8 bg-black/30 p-4">
                      <p className="max-h-48 overflow-y-auto pr-1 text-sm leading-7 text-gray-200">{thumbnail.prompt}</p>
                    </div>
                  </section>

                  <section className="grid grid-cols-1 gap-3 sm:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#fa7517]">
                        Export Notes
                      </p>
                      <div className="mt-3 space-y-3 text-sm leading-6 text-gray-300">
                        <p>
                          Use <span className="font-medium text-white">Download HD</span> for the actual image file.
                        </p>
                        <p>
                          Use <span className="font-medium text-white">Share</span> when you want a clean public link instead of a raw asset URL.
                        </p>
                        <p>
                          The preview disables right-click to reduce accidental misuse, but the proper file stays available through the export action.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-[#fa7517]/18 bg-gradient-to-br from-[#fa7517]/10 to-transparent p-5">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fa7517]/16">
                          <Link2 className="h-4.5 w-4.5 text-[#fa7517]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#fa7517]">
                            Recommended
                          </p>
                          <h3 className="mt-1 text-sm font-semibold text-white">Export first, share second</h3>
                          <p className="mt-1 text-sm leading-6 text-gray-300">
                            Save the image locally before sharing so you keep the final asset even if you revisit the session later.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <div className="relative border-t border-white/6 bg-black/60 px-4 py-4 backdrop-blur-xl sm:px-6">
                <div className="mb-3 flex items-center justify-between gap-4 text-xs text-gray-500">
                  <span>{needsEmailCapture ? 'One quick step before export' : 'High-resolution export ready'}</span>
                  <span>{needsEmailCapture ? 'Email unlock' : 'PNG download'}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.3fr_0.9fr]">
                  <Button
                    onClick={handleDownload}
                    disabled={downloadStatus === 'downloading'}
                    className="w-full rounded-2xl bg-gradient-to-r from-[#fa7517] to-orange-400 py-3.5 font-semibold text-white shadow-[0_16px_40px_rgba(250,117,23,0.25)] transition-all duration-300 hover:from-[#fa7517]/92 hover:to-orange-400/92 hover:shadow-[0_20px_45px_rgba(250,117,23,0.35)] min-h-[54px]"
                  >
                    {downloadStatus === 'downloading' ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span>Preparing export…</span>
                      </div>
                    ) : downloadStatus === 'downloaded' ? (
                      <div className="flex items-center justify-center gap-2">
                        <Check className="h-5 w-5" />
                        <span>Downloaded</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Download className="h-5 w-5" />
                        <span>Download HD</span>
                        <ArrowRight className="hidden h-4 w-4 sm:block" />
                      </div>
                    )}
                  </Button>

                  <motion.button
                    onClick={handleShare}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 font-semibold text-white transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08]"
                  >
                    <Share2 className="h-4.5 w-4.5 text-[#fa7517]" />
                    <span>Share</span>
                  </motion.button>
                </div>
                {error && !needsEmailCapture && (
                  <p className="mt-3 text-sm text-red-300">{error}</p>
                )}
                {!error && (
                  <p className="mt-3 text-sm text-gray-500">
                    Download gives you the file. Share opens a clean public link flow.
                  </p>
                )}
              </div>
            </div>
          </motion.aside>
          
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
