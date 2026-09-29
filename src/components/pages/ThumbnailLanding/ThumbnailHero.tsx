import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { StartOfferButton, startOfferTerms, type StartOffer } from '../CTREngine/components/billing/StartOffer';
import { HERO_POSTER_SRC, HERO_VIDEO_SRC } from './landingContent';

/** The visitor asked the system for less motion: the still, never an autoplaying video. */
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    && Boolean(window.matchMedia('(prefers-reduced-motion: reduce)')?.matches);
}

/**
 * The hero over a full-bleed background video (the owner's
 * `/assets/ai-thumbnails/hero-background.mp4`, still `hero-poster.jpg`). Under
 * it, a plain dark gradient: the page reads the same while the video loads, when
 * the files are missing, and with reduced motion (the still only, no video).
 */
const ThumbnailHero: React.FC<{ offer: StartOffer; signedIn: boolean }> = ({ offer, signedIn }) => {
  const [reduceMotion] = useState(prefersReducedMotion);
  const [videoFailed, setVideoFailed] = useState(false);
  const terms = startOfferTerms(offer);

  return (
    <section aria-labelledby="landing-hero-title" className="relative isolate flex min-h-[88vh] items-center overflow-hidden pt-16">
      {/* Fallback: a plain dark gradient, then the still (a missing file simply shows nothing). */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-30 bg-[radial-gradient(ellipse_at_top,rgba(250,117,23,0.16),transparent_60%),linear-gradient(to_bottom,#141416,#09090B)]"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_POSTER_SRC})` }} />
      {!reduceMotion && !videoFailed && (
        <video
          aria-hidden="true"
          tabIndex={-1}
          autoPlay
          muted
          loop
          playsInline
          poster={HERO_POSTER_SRC}
          // React sets `muted` as a property only; some browsers want the attribute to autoplay.
          ref={(video) => {
            if (!video) return;
            video.muted = true;
            video.setAttribute('muted', '');
          }}
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        >
          <source src={HERO_VIDEO_SRC} type="video/mp4" onError={() => setVideoFailed(true)} />
        </video>
      )}
      {/* Contrast for the text over any frame of the video. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-black/75 via-black/60 to-[#09090B]" />

      <div className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6">
        <h1 id="landing-hero-title" className="text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
          AI thumbnails that look like{' '}
          <span className="bg-gradient-to-r from-[#fa7517] to-orange-300 bg-clip-text text-transparent">your channel</span>.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-200 sm:text-xl">
          Paste your video link or script. Get three thumbnail ideas built from your video, with your face and your channel&apos;s style,
          ready for YouTube&apos;s Test &amp; Compare. Change anything in plain words.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:items-start">
          <StartOfferButton offer={offer} />
          <Link
            to="/ai-thumbnails/audit"
            className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-base font-semibold text-white backdrop-blur transition-colors hover:border-white/40 hover:bg-white/10"
          >
            {signedIn ? 'Review a thumbnail' : 'Review a thumbnail free'}
          </Link>
        </div>
        <p className="mt-4 min-h-[1.25rem] text-sm text-zinc-300">{terms}</p>
      </div>
    </section>
  );
};

export default ThumbnailHero;
