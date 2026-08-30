import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Copy, Facebook, Shield, Twitter } from 'lucide-react';
import { toast } from 'react-toastify';
import { cx, editorial, form, motionPresets } from '../shared/hubStyles';

const STAGGER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

interface SuccessScreenProps {
  title: string;
  priceLabel: string;
  /** Path only (`/p/slug`); the origin is added here, as it always was. */
  passUrl: string;
  onViewPass: () => void;
  onCreateAnother: () => void;
}

/**
 * The moment that earns ceremony: the public pass page's register, once.
 * Eyebrow, masthead, strip, one white pill. Share/copy handlers unchanged.
 */
const SuccessScreen: React.FC<SuccessScreenProps> = ({ title, priceLabel, passUrl, onViewPass, onCreateAnother }) => {
  const prefersReducedMotion = useReducedMotion();
  const fadeUp = prefersReducedMotion ? undefined : motionPresets.fadeUp;
  const fadeUpSmall = prefersReducedMotion ? undefined : motionPresets.fadeUpSmall;
  const fullUrl = `${window.location.origin}${passUrl}`;

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}${passUrl}`);
    toast.success('URL copied to clipboard!');
  };

  return (
    <main className="relative pt-24 pb-16 text-[#f0f0f0]">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-16 h-[300px] w-[600px] -translate-x-1/2"
        style={editorial.glowStyle}
      />

      <motion.div
        initial={prefersReducedMotion ? false : 'hidden'}
        animate="visible"
        variants={prefersReducedMotion ? undefined : STAGGER}
        className="relative mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 text-center"
      >
        <motion.p variants={fadeUpSmall} className={editorial.eyebrow} style={{ letterSpacing: '0.3em' }}>
          Content Pass · Published
        </motion.p>

        <motion.h1
          variants={fadeUp}
          className={cx(editorial.masthead, '[text-wrap:balance]')}
          style={editorial.mastheadStyle}
        >
          Your pass is live
        </motion.h1>

        <motion.p variants={fadeUpSmall} className={cx('max-w-md text-sm', editorial.textSecondary)}>
          Fans can buy it now. Share the link when you are ready.
        </motion.p>

        <motion.div variants={fadeUpSmall} className={editorial.strip} style={{ letterSpacing: '0.16em' }}>
          <span className="truncate max-w-[16rem]">{title}</span>
          <span aria-hidden className={editorial.textTertiary}>·</span>
          <span className="tabular-nums">{priceLabel}</span>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className={cx(editorial.panel, 'w-full max-w-xl px-5 py-4')}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 text-left">
              <p className={cx('text-xs uppercase', editorial.textTertiary)} style={{ letterSpacing: '0.16em' }}>
                Pass URL
              </p>
              <p className={cx('mt-1 truncate text-sm', editorial.textPrimary)}>{fullUrl}</p>
            </div>
            <button
              type="button"
              onClick={copyLink}
              aria-label="Copy pass URL"
              className={cx(
                'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors',
                editorial.frostBorder,
                'text-[#a1a4a5] hover:bg-white/[0.04] hover:text-[#f0f0f0]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/40',
              )}
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </motion.div>

        <motion.div variants={fadeUpSmall} className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className={editorial.secondaryButton}
            onClick={() => {
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my exclusive content on Base.Tube: ${window.location.origin}${passUrl}`)}`);
            }}
          >
            <Twitter className="h-4 w-4" aria-hidden="true" />
            Share on Twitter
          </button>

          <button
            type="button"
            className={editorial.secondaryButton}
            onClick={() => {
              window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}${passUrl}`)}`);
            }}
          >
            <Facebook className="h-4 w-4" aria-hidden="true" />
            Share on Facebook
          </button>

          <button type="button" className={editorial.secondaryButton} onClick={copyLink}>
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy link
          </button>
        </motion.div>

        <motion.div
          variants={fadeUpSmall}
          className={cx('flex w-full max-w-xl flex-col items-center gap-3 pt-6 sm:flex-row sm:justify-center', editorial.divider)}
        >
          <button type="button" onClick={onViewPass} className={editorial.primaryButton}>
            <Shield className="h-4 w-4" aria-hidden="true" />
            View pass
          </button>
          <button type="button" onClick={onCreateAnother} className={form.ghostButton}>
            Create another
          </button>
        </motion.div>
      </motion.div>
    </main>
  );
};

export default SuccessScreen;
