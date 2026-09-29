import React from 'react';
import { StartOfferButton, startOfferTerms, type StartOffer } from '../CTREngine/components/billing/StartOffer';
import ThumbnailWall from './ThumbnailWall';
import { primaryButton, ReviewButton } from './LandingButtons';
import { FadeIn, RevealHeading } from './motionKit';

/** The last call to action, over the same drifting wall as the hero, with a warm glow breathing behind the buttons. */
const FinalCTA: React.FC<{ offer: StartOffer; signedIn: boolean }> = ({ offer, signedIn }) => {
  const terms = startOfferTerms(offer);
  return (
    <section aria-labelledby="landing-final-title" className="relative isolate overflow-hidden border-t border-white/[0.06] py-32 sm:py-44">
      <ThumbnailWall rows={3} lazy className="-z-20 opacity-70" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_65%_at_50%_50%,rgba(7,7,9,0.95)_0%,rgba(7,7,9,0.8)_50%,rgba(7,7,9,0.45)_100%)]" />
      <div aria-hidden="true" className="absolute left-1/2 top-[62%] -z-10 h-[260px] w-[620px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-[#fa7517]/20 blur-[110px] motion-reduce:animate-none" />
      <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
        <RevealHeading
          id="landing-final-title"
          className="lp-display text-5xl text-white sm:text-7xl"
          parts={['Your next upload deserves ', { accent: 'three good options.' }]}
        />
        <FadeIn delay={0.3}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <StartOfferButton offer={offer} className={primaryButton} />
            <ReviewButton signedIn={signedIn} />
          </div>
          {terms && <p className="mt-5 text-sm text-zinc-400">{terms}</p>}
        </FadeIn>
      </div>
    </section>
  );
};

export default FinalCTA;
