import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  Check,
  Download,
  FileImage,
  Mail,
  Share2,
  X,
} from 'lucide-react';
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
  onClose,
}) => {
  const {
    needsEmailCapture,
    submitEmailForDownload,
    downloadThumbnail,
    forceDownload,
    error,
    clearError,
  } = usePublicThumbnailGenerator();

  const [email, setEmail] = useState('');
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'downloaded'>('idle');
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [isViralShareOpen, setIsViralShareOpen] = useState(false);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setDownloadStatus('idle');
      setEmailSuccess(false);
      setEmail('');
      clearError();
    }
  }, [clearError, isOpen]);

  const handleDownload = async () => {
    if (!thumbnail) return;

    const sourceUrl = thumbnail.imageUrl || thumbnail.thumbnailUrl;
    setDownloadStatus('downloading');
    clearError();

    try {
      await downloadThumbnail(thumbnail.id.toString(), sourceUrl);

      if (!needsEmailCapture) {
        setDownloadStatus('downloaded');
        window.setTimeout(() => setDownloadStatus('idle'), 1800);
      }
    } catch (err) {
      console.error('Download error:', err);
      setDownloadStatus('idle');
    }
  };

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;

    setEmailSubmitting(true);
    setEmailSuccess(false);
    clearError();

    try {
      await submitEmailForDownload(email, thumbnail?.id);
      setEmailSuccess(true);

      if (thumbnail) {
        const sourceUrl = thumbnail.imageUrl || thumbnail.thumbnailUrl;
        window.setTimeout(async () => {
          await forceDownload(thumbnail.id.toString(), sourceUrl);
          setDownloadStatus('downloaded');
          window.setTimeout(() => setDownloadStatus('idle'), 1800);
        }, 500);
      }

      setEmail('');
      window.setTimeout(() => setEmailSuccess(false), 3000);
    } catch (err) {
      console.error('Email submission error:', err);
    } finally {
      setEmailSubmitting(false);
    }
  };

  const handleShare = () => {
    if (!thumbnail) return;
    setIsViralShareOpen(true);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  const imageSrc = thumbnail?.imageUrl || thumbnail?.thumbnailUrl || '';
  const isPersistedThumbnail = /^\d+$/.test(String(thumbnail?.id ?? ''));
  const sourceLabel = isPersistedThumbnail ? 'Saved thumbnail' : 'Fresh generation';
  const hasShareUrl = Boolean(thumbnail?.shareUrl);
  const statusLabel = hasShareUrl ? 'Public link ready' : 'Ready to export';

  return (
    <AnimatePresence mode="wait">
      {isOpen && thumbnail && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Thumbnail details"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 z-50 h-full w-full overflow-hidden sm:w-[680px] xl:w-[720px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-full flex-col bg-[#09090a] text-white shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
              <header className="border-b border-white/10 px-4 py-4 sm:px-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] sm:flex">
                      <FileImage className="h-5 w-5 text-[#fa7517]" />
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
                        Thumbnail
                      </h2>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1.5 text-emerald-300">
                          <Check className="h-3.5 w-3.5" />
                          {statusLabel}
                        </span>
                        <span>{sourceLabel}</span>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[#fa7517]" />
                          {formatDate(thumbnail.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-gray-400 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                    aria-label="Close thumbnail details"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

              </header>

              <main className="min-h-0 flex-1 bg-[#060607] p-3 sm:p-5">
                <div className="flex h-full min-h-0 flex-col">
                  <section className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt="AI generated thumbnail"
                        className="max-h-full w-full object-contain"
                        onContextMenu={handleContextMenu}
                        draggable="false"
                        onError={(event) => {
                          console.error('Failed to load thumbnail image:', imageSrc);
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex min-h-[320px] w-full flex-col items-center justify-center gap-3 text-gray-500">
                        <FileImage className="h-8 w-8" />
                        <p className="text-sm">Preview unavailable</p>
                      </div>
                    )}
                  </section>

                  {error && !needsEmailCapture && (
                    <p className="mt-4 rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {error}
                    </p>
                  )}
                </div>
              </main>

              <footer className="border-t border-white/10 bg-[#09090a]/95 px-4 py-4 backdrop-blur-xl sm:px-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                  <Button
                    onClick={handleDownload}
                    disabled={downloadStatus === 'downloading'}
                    className="min-h-[52px] w-full rounded-lg bg-[#fa7517] px-5 py-3 font-semibold text-white shadow-[0_14px_34px_rgba(250,117,23,0.24)] transition-colors hover:bg-orange-500 disabled:opacity-50"
                  >
                    {downloadStatus === 'downloading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Preparing
                      </span>
                    ) : downloadStatus === 'downloaded' ? (
                      <span className="flex items-center justify-center gap-2">
                        <Check className="h-5 w-5" />
                        Downloaded
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Download className="h-5 w-5" />
                        Download image
                      </span>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-5 py-3 font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/[0.08]"
                  >
                    <Share2 className="h-4.5 w-4.5 text-[#fa7517]" />
                    Share
                  </button>
                </div>
              </footer>
            </div>
          </motion.aside>

          <AnimatePresence>
            {needsEmailCapture && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
              >
                <motion.div
                  initial={{ scale: 0.96, opacity: 0, y: 12 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.96, opacity: 0, y: 12 }}
                  transition={{ duration: 0.18 }}
                  className="w-full max-w-md rounded-lg border border-white/10 bg-[#0b0b0d] p-6 shadow-2xl"
                >
                  <div className="mb-5 flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                      emailSuccess ? 'bg-emerald-500/15 text-emerald-300' : 'bg-[#fa7517]/15 text-[#fa7517]'
                    }`}>
                      {emailSuccess ? <Check className="h-6 w-6" /> : <Mail className="h-6 w-6" />}
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {emailSuccess ? 'Download starting' : 'Enter email to download'}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-gray-400">
                        {emailSuccess
                          ? 'Your file should appear in your downloads folder shortly.'
                          : 'Anonymous exports require an email before the file is released.'}
                      </p>
                    </div>
                  </div>

                  {!emailSuccess && (
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        disabled={emailSubmitting}
                        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-[#fa7517]/60 disabled:opacity-50"
                        required
                      />

                      {error && (
                        <p className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                          {error}
                        </p>
                      )}

                      <Button
                        type="submit"
                        disabled={emailSubmitting}
                        className="min-h-[48px] w-full rounded-lg bg-[#fa7517] px-5 py-3 font-semibold text-white transition-colors hover:bg-orange-500 disabled:opacity-50"
                      >
                        {emailSubmitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            Preparing download
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <Download className="h-5 w-5" />
                            Continue to download
                          </span>
                        )}
                      </Button>
                    </form>
                  )}

                  {emailSuccess && (
                    <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                      Download queued.
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <ViralSharePopup
        thumbnail={thumbnail}
        isOpen={isViralShareOpen}
        onClose={() => setIsViralShareOpen(false)}
      />
    </AnimatePresence>
  );
};
