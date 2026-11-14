import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Copy, Facebook, Shield, Twitter } from 'lucide-react';
import { toast } from 'react-toastify';
import { button, cx, form, frame, heroGlow, list, sheen, surface } from '../Business/businessStyles';

interface SuccessScreenProps {
  title: string;
  priceLabel: string;
  /** Path only (`/p/slug`); the origin is added here, as it always was. */
  passUrl: string;
  onViewPass: () => void;
  onCreateAnother: () => void;
}

/**
 * The pass is live: one card with the one glow, the link to share, one
 * orange action. Share and copy handlers are unchanged.
 */
const SuccessScreen: React.FC<SuccessScreenProps> = ({ title, priceLabel, passUrl, onViewPass, onCreateAnother }) => {
  const prefersReducedMotion = useReducedMotion();
  const fullUrl = `${window.location.origin}${passUrl}`;

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}${passUrl}`);
    toast.success('URL copied to clipboard!');
  };

  return (
    <main className={frame.page}>
      <div className="mx-auto max-w-2xl px-4 md:px-6">
        <motion.section
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={surface.card}
          style={heroGlow}
          aria-labelledby="pass-live-title"
        >
          <div className={sheen} aria-hidden="true" />
          <div className="relative flex flex-col items-center px-6 py-10 text-center md:px-10">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#fa7517]/30 bg-[#fa7517]/10 text-[#fa7517]">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="mt-5 text-sm text-gray-400">Content Pass · Published</p>
            <h1 id="pass-live-title" className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Your pass is live
            </h1>
            <p className="mt-2 max-w-md text-sm text-gray-400">Fans can buy it now. Share the link when you are ready.</p>
            <p className="mt-4 flex max-w-full items-center gap-2 text-sm text-gray-200">
              <span className="truncate">{title}</span>
              <span aria-hidden="true" className="text-gray-500">·</span>
              <span className="shrink-0 tabular-nums">{priceLabel}</span>
            </p>

            <div className="mt-6 flex w-full items-center gap-2 rounded-lg border border-gray-800/70 bg-black/40 py-1.5 pl-3 pr-1.5 text-left">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400">Pass URL</p>
                <p className="truncate text-sm text-gray-100">{fullUrl}</p>
              </div>
              <button type="button" onClick={copyLink} aria-label="Copy pass URL" className={list.actionButton}>
                <Copy className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                className={form.secondaryButton}
                onClick={() => {
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my exclusive content on Base.Tube: ${window.location.origin}${passUrl}`)}`);
                }}
              >
                <Twitter className="h-4 w-4" aria-hidden="true" />
                Share on Twitter
              </button>

              <button
                type="button"
                className={form.secondaryButton}
                onClick={() => {
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}${passUrl}`)}`);
                }}
              >
                <Facebook className="h-4 w-4" aria-hidden="true" />
                Share on Facebook
              </button>

              <button type="button" className={form.secondaryButton} onClick={copyLink}>
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copy link
              </button>
            </div>

            <div className="mt-8 flex w-full flex-col items-stretch gap-2 border-t border-gray-800/50 pt-6 sm:flex-row sm:justify-center">
              <button type="button" onClick={onViewPass} className={cx(button.primary, 'h-10 px-5')}>
                <Shield className="h-4 w-4" aria-hidden="true" />
                View pass
              </button>
              <button type="button" onClick={onCreateAnother} className={cx(form.ghostButton, 'h-10 justify-center')}>
                Create another
              </button>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
};

export default SuccessScreen;
