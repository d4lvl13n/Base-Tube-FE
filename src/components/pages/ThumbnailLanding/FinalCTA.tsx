import React from 'react';
import { Link } from 'react-router-dom';
import { StartOfferButton, startOfferTerms, type StartOffer } from '../CTREngine/components/billing/StartOffer';

const FinalCTA: React.FC<{ offer: StartOffer; signedIn: boolean }> = ({ offer, signedIn }) => {
  const terms = startOfferTerms(offer);
  return (
    <section aria-labelledby="landing-final-title" className="py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c0e] px-6 py-16 text-center sm:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fa7517]/10 blur-[100px]"
          />
          <div className="relative">
            <h2 id="landing-final-title" className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Your next upload deserves three good options.
            </h2>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:items-start">
              <StartOfferButton offer={offer} />
              <Link
                to="/ai-thumbnails/audit"
                className="inline-flex items-center justify-center rounded-xl border border-white/25 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/5"
              >
                {signedIn ? 'Review a thumbnail' : 'Review a thumbnail free'}
              </Link>
            </div>
            {terms && <p className="mt-4 text-sm text-zinc-400">{terms}</p>}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
