import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePassDetails, usePurchasedPasses } from '../hooks/usePass';
import { useAccess } from '../hooks/useOnchainPass';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { ChevronDown, Lock as LockIcon } from 'lucide-react';
import PremiumHeader from '../components/pass/PremiumHeader';
import StickyPassHeader from '../components/pass/StickyPassHeader';
import PassActionButton from '../components/pass/PassActionButton';
import TestnetModeBadge from '../components/pass/TestnetModeBadge';
import RichTextDisplay from '../components/common/RichTextDisplay';
import type { PassVideo } from '../types/pass';

/**
 * Pass detail page — curator-collection framing.
 * Editorial masthead, centered artwork, typographic roster, dedicated access panel.
 * Resend tokens: pure black, frost borders rgba(214,235,253,0.19), orange as sole accent.
 */

const TEASER_LIMIT = 200;
const DESCRIPTION_COLLAPSE_AT = 400;

const FROST_BORDER = 'border-[rgba(214,235,253,0.19)]';
const FROST_BORDER_ALT = 'border-[rgba(217,237,254,0.145)]';
const TEXT_PRIMARY = 'text-[#f0f0f0]';
const TEXT_SECONDARY = 'text-[#a1a4a5]';
const TEXT_TERTIARY = 'text-[#5c5c5c]';
const ACCENT_ORANGE = '#ff801f';

// Motion tokens — editorial, slow, confident easing (never bouncy).
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const VIEWPORT_ONCE = { once: true, margin: '-80px' } as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE_OUT },
  },
};

const fadeUpSmall: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT },
  },
};

const staggerContainer = (
  staggerChildren = 0.08,
  delayChildren = 0.05,
): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren, delayChildren },
  },
});

const stripHtml = (html: string): string =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const formatDuration = (seconds?: number): string => {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: 'What do I get when I buy this pass?',
    a: 'Lifetime streaming access to every video bundled in this pass, plus an NFT that represents your ownership. Stream as many times as you want — the pass never expires.',
  },
  {
    q: 'Can I resell it later?',
    a: 'Yes. Your pass is a tradeable NFT on Base. List it on any marketplace that supports the contract. Access transfers with the token, so selling transfers the streaming access too.',
  },
  {
    q: 'Do I need a crypto wallet?',
    a: 'No. Pay with a card and we reserve the NFT for you — claim it to your wallet whenever you\u2019re ready. If you already have a wallet, you can also pay in crypto directly on Base L2.',
  },
  {
    q: 'What happens right after checkout?',
    a: 'Card payments unlock streaming access instantly. The NFT is held in a claimable balance you can sweep to your wallet any time. Crypto purchases settle on-chain in one transaction.',
  },
];

const PassDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: pass, isLoading, error } = usePassDetails(slug);
  const prefersReducedMotion = useReducedMotion();
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { data: purchasedPasses, isLoading: isPurchasedLoading } = usePurchasedPasses();
  const ownsViaList = purchasedPasses?.some((p) => p.id === pass?.id);
  const hasAccessFromApi = pass?.has_access === true;
  const { data: accessData, isLoading: isOnchainLoading } = useAccess(pass?.id, {
    enabled: Boolean(pass?.id),
  });
  const alreadyOwns =
    hasAccessFromApi || ownsViaList || Boolean(accessData?.data?.hasAccess);
  const isAccessLoading = isPurchasedLoading || isOnchainLoading;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 350);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (pass) document.title = `${pass.title} | Premium Content Pass`;
  }, [pass]);

  const teaser = useMemo(() => {
    if (!pass?.description) return '';
    const plain = stripHtml(pass.description);
    if (plain.length <= TEASER_LIMIT) return plain;
    return `${plain.slice(0, TEASER_LIMIT).trimEnd()}…`;
  }, [pass?.description]);

  const descriptionNeedsToggle = (pass?.description?.length || 0) > DESCRIPTION_COLLAPSE_AT;

  if (isLoading || isAccessLoading) {
    return (
      <>
        <PremiumHeader />
        <div className="flex items-center justify-center min-h-screen bg-black">
          <div className="flex flex-col items-center gap-6">
            <div
              className={`w-10 h-10 rounded-full border ${FROST_BORDER} border-t-transparent animate-spin`}
              style={{ borderTopColor: ACCENT_ORANGE }}
            />
            <p
              className={`text-sm ${TEXT_SECONDARY} uppercase`}
              aria-live="polite"
              style={{ letterSpacing: '0.12em' }}
            >
              Loading
            </p>
          </div>
        </div>
      </>
    );
  }

  if (error || !pass) {
    return (
      <>
        <PremiumHeader />
        <div className="flex items-center justify-center min-h-screen bg-black">
          <div className={`text-center p-10 ${FROST_BORDER} border rounded-2xl max-w-md`}>
            <LockIcon className={`w-8 h-8 mx-auto mb-5 ${TEXT_SECONDARY}`} />
            <h2
              className={`text-2xl font-medium mb-3 ${TEXT_PRIMARY}`}
              style={{ letterSpacing: '-0.02em' }}
            >
              Pass not found
            </h2>
            <p className={`text-sm ${TEXT_SECONDARY}`}>
              {error?.message ||
                "We couldn\u2019t load this pass. The link may be broken or the pass may have been removed."}
            </p>
          </div>
        </div>
      </>
    );
  }

  const heroThumbnail = pass.videos?.[0]?.thumbnail_url || '/assets/Content-pass.webp';
  const hasSupplyCap = Boolean(pass.supply_cap && pass.supply_cap > 0);
  const soldCount = (pass.sold_count ?? (pass.minted_count || 0));
  const totalCount = pass.supply_cap || 0;
  const soldPct = hasSupplyCap ? Math.min(100, (soldCount / totalCount) * 100) : 0;
  const videoCount = pass.videos?.length || 0;
  const channelIdCandidate = (pass.channel as { id?: string } | undefined)?.id;

  return (
    <div className="min-h-screen bg-black text-[#f0f0f0]">
      <PremiumHeader passTitle={pass.title} creatorName={pass.channel?.name} />
      <TestnetModeBadge topOffsetPx={isScrolled ? 112 : 64} />
      <StickyPassHeader isVisible={isScrolled} pass={pass} alreadyOwns={alreadyOwns} />

      {/* MASTHEAD — the page opens like a chapter */}
      <section className="relative pt-28 pb-16">
        {/* Very soft warm glow behind the title */}
        <div
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 top-24 w-[600px] h-[300px] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${ACCENT_ORANGE}14 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.1, 0.15)}
            className="flex flex-col items-center gap-8"
          >
            {/* Eyebrow — classification, not a badge */}
            <motion.div
              variants={fadeUpSmall}
              className={`text-xs uppercase ${TEXT_TERTIARY}`}
              style={{ letterSpacing: '0.3em' }}
            >
              Content Pass · Collection
            </motion.div>

            {/* Creator — quiet attribution */}
            <motion.div variants={fadeUpSmall}>
              <Link
                to={`/channel/${channelIdCandidate || ''}`}
                className={`inline-flex items-center gap-3 text-sm ${TEXT_SECONDARY} hover:text-[#f0f0f0] transition-colors`}
              >
                <div
                  className={`w-7 h-7 rounded-full border ${FROST_BORDER} flex items-center justify-center uppercase text-[10px] font-medium ${TEXT_PRIMARY}`}
                >
                  {pass.channel?.name?.charAt(0) || '?'}
                </div>
                <span>
                  Curated by{' '}
                  <span className={TEXT_PRIMARY}>
                    {pass.channel?.name || 'Unknown Channel'}
                  </span>
                </span>
              </Link>
            </motion.div>

            {/* Title — the headline of the chapter */}
            <motion.h1
              variants={fadeUp}
              className={`${TEXT_PRIMARY} font-medium text-balance`}
              style={{
                fontSize: 'clamp(2.75rem, 6vw, 4.5rem)',
                lineHeight: 1.0,
                letterSpacing: '-0.04em',
              }}
            >
              {pass.title}
            </motion.h1>

            {/* Subtitle / teaser — a single poetic line, not marketing */}
            {teaser && (
              <motion.p
                variants={fadeUpSmall}
                className={`max-w-2xl text-lg leading-relaxed ${TEXT_SECONDARY} text-balance`}
              >
                {teaser}
              </motion.p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ARTWORK — centered cover plate, museum-style */}
      <section className="relative pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 1.02, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.35 }}
            className={`relative rounded-2xl overflow-hidden border ${FROST_BORDER}`}
          >
            <img
              src={heroThumbnail}
              alt={`${pass.title} cover`}
              className="w-full aspect-[16/9] object-cover"
            />
            {/* Subtle vignette at the bottom for integration with the black page */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
          </motion.div>

          {/* Metadata strip beneath the artwork — like a museum placard */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.75 }}
            className={`mt-6 flex items-center justify-center gap-8 text-xs uppercase ${TEXT_SECONDARY}`}
            style={{ letterSpacing: '0.16em' }}
          >
            <span>
              <span className={TEXT_PRIMARY}>
                {videoCount.toString().padStart(2, '0')}
              </span>{' '}
              Video{videoCount !== 1 ? 's' : ''}
            </span>
            {hasSupplyCap && (
              <>
                <span className={TEXT_TERTIARY}>·</span>
                <span>
                  <span className={TEXT_PRIMARY}>
                    {soldCount.toLocaleString()}
                  </span>
                  {' / '}
                  {totalCount.toLocaleString()} Minted
                </span>
              </>
            )}
            <span className={TEXT_TERTIARY}>·</span>
            <span>
              Base <span className={TEXT_PRIMARY}>L2</span>
            </span>
          </motion.div>
        </div>
      </section>

      {/* ROSTER — typographic, editorial, numbered */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          variants={fadeUpSmall}
          className="flex items-end justify-between mb-12"
        >
          <h2
            className={`${TEXT_PRIMARY} font-medium`}
            style={{
              fontSize: 'clamp(1.75rem, 3.2vw, 2.5rem)',
              lineHeight: 1.1,
              letterSpacing: '-0.035em',
            }}
          >
            Inside
          </h2>
          <span
            className={`text-xs uppercase ${TEXT_TERTIARY}`}
            style={{ letterSpacing: '0.16em' }}
          >
            The collection
          </span>
        </motion.div>

        {videoCount > 0 ? (
          <motion.ol
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            variants={staggerContainer(0.06, 0.1)}
            className={`border-t ${FROST_BORDER_ALT}`}
          >
            {pass.videos.map((video, i) => (
              <VideoRosterRow
                key={video.id}
                video={video}
                index={i + 1}
                unlocked={alreadyOwns}
                passId={pass.id}
                prefersReducedMotion={prefersReducedMotion}
              />
            ))}
          </motion.ol>
        ) : (
          <p className={`text-sm ${TEXT_SECONDARY}`}>No videos listed yet.</p>
        )}
      </section>

      {/* NOTES — about the pass */}
      {pass.description && (
        <>
          <div className="max-w-3xl mx-auto px-6">
            <div className={`border-t ${FROST_BORDER_ALT}`} />
          </div>
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            variants={staggerContainer(0.08, 0.05)}
            className="max-w-2xl mx-auto px-6 py-24"
          >
            <motion.div
              variants={fadeUpSmall}
              className={`text-xs uppercase ${TEXT_TERTIARY} mb-6`}
              style={{ letterSpacing: '0.3em' }}
            >
              Notes
            </motion.div>
            <motion.div variants={fadeUpSmall} className="relative">
              <RichTextDisplay
                content={pass.description}
                className={`text-[#a1a4a5] ${
                  descriptionNeedsToggle && !expandedDesc ? 'max-h-[240px] overflow-hidden' : ''
                }`}
              />
              {descriptionNeedsToggle && !expandedDesc && (
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent pointer-events-none" />
              )}
            </motion.div>
            {descriptionNeedsToggle && (
              <motion.button
                variants={fadeUpSmall}
                onClick={() => setExpandedDesc((v) => !v)}
                className={`mt-6 text-xs uppercase ${TEXT_SECONDARY} hover:text-[#f0f0f0] transition-colors`}
                style={{ letterSpacing: '0.16em' }}
              >
                {expandedDesc ? '— Show less' : '— Continue reading'}
              </motion.button>
            )}
          </motion.section>
        </>
      )}

      <div className="max-w-5xl mx-auto px-6">
        <div className={`border-t ${FROST_BORDER_ALT}`} />
      </div>

      {/* ACCESS — the invitation, its own moment */}
      <section className="max-w-5xl mx-auto px-6 py-28">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.99 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={VIEWPORT_ONCE}
          transition={{ duration: 0.9, ease: EASE_OUT }}
          className={`relative rounded-3xl border ${FROST_BORDER} overflow-hidden`}
        >
          {/* Subtle warm glow in the panel */}
          <div
            aria-hidden
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[200px] pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, ${ACCENT_ORANGE}14 0%, transparent 70%)`,
              filter: 'blur(40px)',
            }}
          />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            variants={staggerContainer(0.1, 0.2)}
            className="relative p-8 md:p-12"
          >
            {/* Top: story | purchase, fair proportions */}
            <div className="grid md:grid-cols-[1.4fr,1fr] gap-10 md:gap-16 items-start">
              {/* Story */}
              <div className="space-y-5">
                <motion.div
                  variants={fadeUpSmall}
                  className={`text-xs uppercase ${TEXT_TERTIARY}`}
                  style={{ letterSpacing: '0.3em' }}
                >
                  {alreadyOwns ? 'Your access' : 'The invitation'}
                </motion.div>
                <motion.h2
                  variants={fadeUp}
                  className={`${TEXT_PRIMARY} font-medium [text-wrap:balance]`}
                  style={{
                    fontSize: 'clamp(1.75rem, 3.2vw, 2.5rem)',
                    lineHeight: 1.08,
                    letterSpacing: '-0.035em',
                  }}
                >
                  {alreadyOwns
                    ? 'You have access to this collection.'
                    : 'Access the full collection.'}
                </motion.h2>
                <motion.p
                  variants={fadeUpSmall}
                  className={`text-base leading-relaxed ${TEXT_SECONDARY} max-w-lg`}
                >
                  {alreadyOwns
                    ? 'Stream every video any time. Your pass is an NFT you own on Base L2 — keep it, gift it, or resell it whenever you like.'
                    : 'One pass unlocks every video in the collection — forever. Pay with a card or crypto. Your ownership lives on-chain as a tradeable NFT.'}
                </motion.p>
              </div>

              {/* Purchase */}
              <motion.div variants={fadeUp} className="md:pl-4">
                <PassActionButton
                  pass={{
                    id: pass.id,
                    onchain_pass_id: pass.onchain_pass_id,
                    tier: pass.tier,
                    formatted_price: pass.formatted_price,
                    supply_cap: pass.supply_cap,
                    minted_count: pass.minted_count,
                    sold_count: pass.sold_count,
                    can_purchase: pass.can_purchase,
                    purchase_block_reason_code: pass.purchase_block_reason_code,
                    purchase_block_reason: pass.purchase_block_reason,
                  }}
                  alreadyOwns={alreadyOwns}
                  isAccessLoading={isAccessLoading}
                />
              </motion.div>
            </div>

            {/* Bottom strip: full-width metadata + supply */}
            <motion.div
              variants={fadeUpSmall}
              className={`mt-10 md:mt-12 pt-6 border-t ${FROST_BORDER_ALT}`}
            >
              <div
                className={`flex flex-wrap items-center gap-x-8 gap-y-4 text-xs uppercase ${TEXT_SECONDARY}`}
                style={{ letterSpacing: '0.16em' }}
              >
                <MetaItem label="Access" value="Lifetime" />
                <MetaSep />
                <MetaItem label="Ownership" value="NFT on Base" />
                <MetaSep />
                <MetaItem label="Transferable" value="Yes" />
                {hasSupplyCap && (
                  <>
                    <MetaSep />
                    <div className="flex items-center gap-3 min-w-[180px] flex-1">
                      <span className={TEXT_TERTIARY}>Supply</span>
                      <span className={TEXT_PRIMARY}>
                        {soldCount.toLocaleString()} / {totalCount.toLocaleString()}
                      </span>
                      <div className="flex-1 h-px bg-white/[0.06] relative overflow-hidden min-w-[60px]">
                        <motion.div
                          className="absolute inset-y-0 left-0"
                          style={{ backgroundColor: ACCENT_ORANGE }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${soldPct}%` }}
                          viewport={VIEWPORT_ONCE}
                          transition={{ duration: 1.0, ease: EASE_OUT, delay: 0.4 }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      <div className="max-w-3xl mx-auto px-6">
        <div className={`border-t ${FROST_BORDER_ALT}`} />
      </div>

      {/* QUESTIONS */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT_ONCE}
        variants={staggerContainer(0.06, 0.05)}
        className="max-w-3xl mx-auto px-6 py-24"
      >
        <motion.div
          variants={fadeUpSmall}
          className={`text-xs uppercase ${TEXT_TERTIARY} mb-8`}
          style={{ letterSpacing: '0.3em' }}
        >
          Questions
        </motion.div>
        <motion.div variants={fadeUpSmall}>
          <FaqList />
        </motion.div>
      </motion.section>

      <div className="h-24" />
    </div>
  );
};

const MetaItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="inline-flex items-baseline gap-2">
    <span className={TEXT_TERTIARY}>{label}</span>
    <span className={TEXT_PRIMARY}>{value}</span>
  </div>
);

const MetaSep: React.FC = () => (
  <span className={`${TEXT_TERTIARY} select-none`} aria-hidden>·</span>
);

const VideoRosterRow: React.FC<{
  video: PassVideo;
  index: number;
  unlocked: boolean;
  passId: string;
  prefersReducedMotion: boolean | null;
}> = ({ video, index, unlocked, passId, prefersReducedMotion }) => {
  const duration = formatDuration(video.duration);
  const labelIndex = index.toString().padStart(2, '0');

  const rowContent = (
    <div
      className={`grid grid-cols-[auto,1fr,auto] items-baseline gap-6 py-6 border-b ${FROST_BORDER_ALT} transition-colors ${
        unlocked ? 'hover:bg-white/[0.02]' : ''
      }`}
    >
      <div
        className={`text-xs uppercase ${TEXT_TERTIARY} tabular-nums`}
        style={{ letterSpacing: '0.16em' }}
      >
        {labelIndex}
      </div>

      <div className="min-w-0">
        <div
          className={`text-lg md:text-xl ${TEXT_PRIMARY} truncate`}
          style={{ letterSpacing: '-0.015em' }}
        >
          {video.title || `Untitled video ${labelIndex}`}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        {duration && (
          <span
            className={`text-sm ${TEXT_SECONDARY} tabular-nums`}
            style={{ fontFamily: "'Commit Mono', ui-monospace, SFMono-Regular, Menlo, monospace" }}
          >
            {duration}
          </span>
        )}
        {!unlocked && <LockIcon className={`w-3.5 h-3.5 ${TEXT_TERTIARY}`} />}
      </div>
    </div>
  );

  if (unlocked) {
    return (
      <motion.li
        variants={fadeUpSmall}
        whileHover={{ x: prefersReducedMotion ? 0 : 4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <Link to={`/watch/${passId}`} className="block">
          {rowContent}
        </Link>
      </motion.li>
    );
  }
  return <motion.li variants={fadeUpSmall}>{rowContent}</motion.li>;
};

const FaqList: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className={`border-t ${FROST_BORDER_ALT}`}>
      {FAQ_ITEMS.map((item, i) => (
        <FaqRow
          key={item.q}
          q={item.q}
          a={item.a}
          isOpen={openIdx === i}
          onToggle={() => setOpenIdx((curr) => (curr === i ? null : i))}
        />
      ))}
    </div>
  );
};

const FaqRow: React.FC<{
  q: string;
  a: string;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ q, a, isOpen, onToggle }) => (
  <div className={`border-b ${FROST_BORDER_ALT}`}>
    <button
      onClick={onToggle}
      aria-expanded={isOpen}
      className="w-full flex items-center justify-between gap-4 py-6 text-left hover:bg-white/[0.02] transition-colors px-2 -mx-2 rounded-lg"
    >
      <span
        className={`text-base md:text-lg ${TEXT_PRIMARY}`}
        style={{ letterSpacing: '-0.015em' }}
      >
        {q}
      </span>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.3, ease: EASE_OUT }}
        className="flex-shrink-0"
      >
        <ChevronDown className={`w-4 h-4 ${TEXT_SECONDARY}`} />
      </motion.div>
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="answer"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
          className="overflow-hidden"
        >
          <div className={`pb-6 px-2 -mx-2 text-sm leading-relaxed ${TEXT_SECONDARY} max-w-2xl`}>
            {a}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default PassDetailsPage;
