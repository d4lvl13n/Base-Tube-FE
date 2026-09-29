import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { StartOfferButton, startOfferTerms, type StartOffer } from '../CTREngine/components/billing/StartOffer';
import { HERO_POSTER_SRC, HERO_VIDEO_SRC } from './landingContent';
import ThumbnailFeed from './ThumbnailFeed';
import { RevealHeading } from './motionKit';
import { primaryButton, ReviewButton } from './LandingButtons';

/**
 * The hero. Behind it: the owner's background video when the file exists
 * (`/assets/ai-thumbnails/hero-background.mp4`), otherwise a YouTube feed of example thumbnails.
 * The dark veil opens where the cursor is, so the feed shows through; the headline lands word by
 * word, white then orange.
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
      <ThumbnailFeed className="-z-30" />
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
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
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
