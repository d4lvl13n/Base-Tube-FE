import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { StartOfferButton, startOfferTerms, type StartOffer } from '../CTREngine/components/billing/StartOffer';
import { HERO_POSTER_SRC, HERO_VIDEO_SRC } from './landingContent';
import ThumbnailWall from './ThumbnailWall';
import { RevealHeading } from './motionKit';
import { primaryButton, ReviewButton } from './LandingButtons';

/**
 * The hero. Behind it: the owner's background video when the file exists
 * (`/assets/ai-thumbnails/hero-background.mp4`), otherwise the drifting wall of example
 * thumbnails. The dark veil opens where the cursor is, so the wall shows through; the headline
 * lands word by word, white then orange.
 */
const ThumbnailHero: React.FC<{ offer: StartOffer; signedIn: boolean }> = ({ offer, signedIn }) => {
  const reduceMotion = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const terms = startOfferTerms(offer);

  const follow = (event: React.PointerEvent<HTMLElement>) => {
    if (reduceMotion || event.pointerType !== 'mouse' || !section.current) return;
    const box = section.current.getBoundingClientRect();
    section.current.style.setProperty('--lp-mx', `${event.clientX - box.left}px`);
    section.current.style.setProperty('--lp-my', `${event.clientY - box.top}px`);
  };

  return (
    <section
      ref={section}
      onPointerMove={follow}
      aria-labelledby="landing-hero-title"
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-20"
    >
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
      {/* Dark in the middle for the words, open at the edges and under the cursor, fading into the page. */}
      <div
        aria-hidden="true"
        className="lp-veil absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_55%_at_50%_47%,rgba(7,7,9,0.9)_0%,rgba(7,7,9,0.68)_48%,rgba(7,7,9,0.22)_100%)]"
      />
      <div aria-hidden="true" className="lp-spot pointer-events-none absolute inset-0 -z-10" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-b from-transparent to-[#070709]" />

      <div className="mx-auto w-full max-w-5xl px-5 pb-24 text-center sm:px-8">
        <motion.a
          href="#demo"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-black/40 py-1.5 pl-2.5 pr-4 text-sm text-white/85 backdrop-blur-md transition-colors hover:border-[#fa7517]/60 hover:text-white"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#fa7517] opacity-70 motion-reduce:hidden" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#fa7517]" />
          </span>
          See how it works
        </motion.a>

        <RevealHeading
          as="h1"
          id="landing-hero-title"
          immediate
          delay={0.1}
          className="lp-display text-[2.9rem] text-white sm:text-7xl lg:text-[6.4rem]"
          parts={['AI thumbnails that look like ', { accent: 'your channel.' }]}
        />

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.85 }}
        >
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-zinc-300 sm:text-xl">
            Paste your video link or script. Get <span className="font-semibold text-[#ff9a3c]">three thumbnail ideas</span> built from your
            video, with <span className="font-semibold text-white">your face and your channel&apos;s style</span>, ready for YouTube&apos;s Test
            &amp; Compare. Change anything in plain words.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <StartOfferButton offer={offer} className={primaryButton} />
            <ReviewButton signedIn={signedIn} />
          </div>
          <p className="mt-5 min-h-[1.25rem] text-sm text-zinc-400">{terms}</p>
        </motion.div>
      </div>
    </section>
  );
};

export default ThumbnailHero;
