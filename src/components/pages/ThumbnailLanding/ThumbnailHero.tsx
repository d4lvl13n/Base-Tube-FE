import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { StartOfferButton, startOfferTerms, type StartOffer } from '../CTREngine/components/billing/StartOffer';
import { HERO_POSTER_SRC, HERO_VIDEO_SRC } from './landingContent';
import ThumbnailWall from './ThumbnailWall';

export const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#fa7517] px-7 py-4 text-base font-semibold text-white shadow-[0_10px_40px_-10px_rgba(250,117,23,0.8)] transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[#ff8a33] disabled:cursor-not-allowed disabled:opacity-60';
export const secondaryButton =
  'inline-flex items-center justify-center rounded-full border border-white/20 bg-white/[0.06] px-7 py-4 text-base font-semibold text-white backdrop-blur-md transition-colors hover:border-white/40 hover:bg-white/[0.12]';

const LINE_ONE = ['AI', 'thumbnails', 'that', 'look'];
const LINE_TWO = ['like', 'your', 'channel.'];

/**
 * The hero. Behind it: the owner's background video when the file exists
 * (`/assets/ai-thumbnails/hero-background.mp4`), otherwise the drifting wall of
 * example thumbnails. The headline lands word by word once; nothing else moves on load.
 */
const ThumbnailHero: React.FC<{ offer: StartOffer; signedIn: boolean }> = ({ offer, signedIn }) => {
  const reduceMotion = useReducedMotion();
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const terms = startOfferTerms(offer);

  const word = (text: string, index: number, accent = false) => (
    <motion.span
      key={`${text}-${index}`}
      className={`inline-block ${accent ? 'lp-accent' : ''}`}
      initial={reduceMotion ? false : { opacity: 0, y: '0.45em', filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.7, delay: 0.15 + index * 0.07, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {text}
    </motion.span>
  );

  return (
    <section aria-labelledby="landing-hero-title" className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-20">
      <ThumbnailWall rows={5} className="-z-30" />
      {!reduceMotion && !videoFailed && (
        <video
          aria-hidden="true"
          tabIndex={-1}
          autoPlay
          muted
          loop
          playsInline
          poster={HERO_POSTER_SRC}
          onLoadedData={() => setVideoReady(true)}
          ref={(video) => {
            if (!video) return;
            // React sets `muted` as a property only; some browsers want the attribute to autoplay.
            video.muted = true;
            video.setAttribute('muted', '');
          }}
          className={`absolute inset-0 -z-20 h-full w-full object-cover transition-opacity duration-1000 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
        >
          <source src={HERO_VIDEO_SRC} type="video/mp4" onError={() => setVideoFailed(true)} />
        </video>
      )}
      {/* Dark in the middle for the words, open at the edges for the pictures, fading into the page. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_55%_at_50%_47%,rgba(7,7,9,0.9)_0%,rgba(7,7,9,0.68)_48%,rgba(7,7,9,0.22)_100%)]"
      />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-b from-transparent to-[#070709]" />

      <div className="mx-auto w-full max-w-5xl px-5 pb-24 text-center sm:px-8">
        <motion.a
          href="#demo"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-black/40 py-1.5 pl-2.5 pr-4 text-sm text-white/85 backdrop-blur-md transition-colors hover:border-white/30 hover:text-white"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#fa7517] opacity-70 motion-reduce:hidden" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#fa7517]" />
          </span>
          See how it works
        </motion.a>

        <h1 id="landing-hero-title" className="lp-display text-[2.9rem] text-white sm:text-7xl lg:text-[6.4rem]">
          <span className="block">{LINE_ONE.map((text, index) => <React.Fragment key={text}>{word(text, index)} </React.Fragment>)}</span>
          <span className="block">
            {word(LINE_TWO[0], LINE_ONE.length)}{' '}
            <span className="whitespace-nowrap">
              {word(LINE_TWO[1], LINE_ONE.length + 1, true)} {word(LINE_TWO[2], LINE_ONE.length + 2, true)}
            </span>
          </span>
        </h1>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75 }}
        >
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-zinc-300 sm:text-xl">
            Paste your video link or script. Get three thumbnail ideas built from your video, with your face and your channel&apos;s
            style, ready for YouTube&apos;s Test &amp; Compare. Change anything in plain words.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <StartOfferButton offer={offer} className={primaryButton} />
            <Link to="/ai-thumbnails/audit" className={secondaryButton}>
              {signedIn ? 'Review a thumbnail' : 'Review a thumbnail free'}
            </Link>
          </div>
          <p className="mt-5 min-h-[1.25rem] text-sm text-zinc-400">{terms}</p>
        </motion.div>
      </div>
    </section>
  );
};

export default ThumbnailHero;
