import React from 'react';
import { Link } from 'react-router-dom';
import { StartOfferButton, startOfferTerms, type StartOffer } from '../CTREngine/components/billing/StartOffer';
import ThumbnailWall from './ThumbnailWall';
import { primaryButton, secondaryButton } from './ThumbnailHero';

/** The last call to action, over the same drifting wall as the hero. */
const FinalCTA: React.FC<{ offer: StartOffer; signedIn: boolean }> = ({ offer, signedIn }) => {
  const terms = startOfferTerms(offer);
  return (
    <section aria-labelledby="landing-final-title" className="relative isolate overflow-hidden border-t border-white/[0.06] py-32 sm:py-44">
      <ThumbnailWall rows={3} lazy className="-z-20 opacity-70" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_65%_at_50%_50%,rgba(7,7,9,0.95)_0%,rgba(7,7,9,0.8)_50%,rgba(7,7,9,0.45)_100%)]" />
      <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
        <h2 id="landing-final-title" className="lp-display text-5xl text-white sm:text-7xl">
          Your next upload deserves three good options.
        </h2>
        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <StartOfferButton offer={offer} className={primaryButton} />
          <Link to="/ai-thumbnails/audit" className={secondaryButton}>
            {signedIn ? 'Review a thumbnail' : 'Review a thumbnail free'}
          </Link>
        </div>
        {terms && <p className="mt-5 text-sm text-zinc-400">{terms}</p>}
      </div>
    </section>
  );
};

export default FinalCTA;
