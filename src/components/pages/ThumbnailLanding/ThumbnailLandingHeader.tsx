import React from 'react';
import { Link } from 'react-router-dom';
import { startStudioAuth, STUDIO_SIGN_IN_PATH } from '../../../utils/studioAuth';
import { StartOfferButton, type StartOffer } from '../CTREngine/components/billing/StartOffer';

const LANDING_PATH = '/ai-thumbnails';

/**
 * The landing page's header: Features, Pricing, the free review, "Log in"
 * (AI Thumbnails' own sign-in page, back here afterwards) and the start
 * button ("Start free trial" for a visitor: sign-up, then Stripe Checkout).
 */
const ThumbnailLandingHeader: React.FC<{ offer: StartOffer; signedIn: boolean }> = ({ offer, signedIn }) => {
  const link = 'text-sm text-white/70 transition-colors hover:text-white';
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <img src="/assets/basetubelogo.png" alt="Base.Tube Logo" className="h-9 w-9" />
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold text-white">Base.Tube</span>
            <span className="text-xs text-white/60">AI Thumbnails</span>
          </span>
        </Link>

        <nav aria-label="AI Thumbnails" className="flex items-center gap-4 sm:gap-6">
          <a href="#features" className={`${link} hidden md:inline`}>
            Features
          </a>
          <Link to="/ai-thumbnails/pricing" className={`${link} hidden md:inline`}>
            Pricing
          </Link>
          <Link to="/ai-thumbnails/audit" className={`${link} hidden md:inline`}>
            {signedIn ? 'Thumbnail review' : 'Free review'}
          </Link>
          {!signedIn && (
            <Link to={STUDIO_SIGN_IN_PATH} onClick={() => startStudioAuth('sign-in', LANDING_PATH)} className={link}>
              Log in
            </Link>
          )}
          <StartOfferButton
            offer={offer}
            short
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#fa7517] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#fb8a3c] disabled:cursor-not-allowed disabled:opacity-60"
          />
        </nav>
      </div>
    </header>
  );
};

export default ThumbnailLandingHeader;
