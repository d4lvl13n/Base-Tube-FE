// /ai-thumbnails — the AI Thumbnails landing page. Only true claims: prices,
// videos and the free trial come from GET /api/v1/subscriptions/plans; the one
// market figure, the Reddit quotes and the example images are in landingContent.ts with their source.
import React from 'react';
import { Link } from 'react-router-dom';
import { useMySubscription, useSubscriptionPlans } from '../../../hooks/useSubscription';
import { useStudioAccountState } from '../../../hooks/useStudioAccount';
import { startOffer, type StartOffer } from '../CTREngine/components/billing/StartOffer';
import ThumbnailLandingHeader from './ThumbnailLandingHeader';
import ThumbnailHero from './ThumbnailHero';
import ProductVideo from './ProductVideo';
import StudioDemo from './StudioDemo';
import ChannelMemory from './ChannelMemory';
import CreatorQuotes from './CreatorQuotes';
import ReviewSection from './ReviewSection';
import ThumbnailFeatures from './ThumbnailFeatures';
import PricingTeaser from './PricingTeaser';
import ThumbnailFAQ from './ThumbnailFAQ';
import FinalCTA from './FinalCTA';
import ScrollProgress from './ScrollProgress';
import { useLandingFonts } from './useLandingFonts';
import './landing.css';

const footerLink = 'block text-sm text-zinc-400 transition-colors hover:text-white';

function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <img src="/assets/basetubelogo.png" alt="Base.Tube Logo" className="h-9 w-9" />
              <div className="leading-tight">
                <p className="text-base font-bold text-white">Base.Tube</p>
                <p className="text-xs text-zinc-500">AI Thumbnails</p>
              </div>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-zinc-500">Thumbnails in your channel&apos;s style, and reviews that say what to change.</p>
          </div>

          <nav aria-label="Product">
            <p className="mb-4 text-sm font-semibold text-white">Product</p>
            <div className="space-y-2.5">
              <Link to="/ai-thumbnails/pricing" className={footerLink}>
                Pricing
              </Link>
              <Link to="/ai-thumbnails/audit" className={footerLink}>
                Thumbnail review
              </Link>
              <Link to="/ai-thumbnails/projects" className={footerLink}>
                Studio
              </Link>
              <a href="#features" className={footerLink}>
                Features
              </a>
            </div>
          </nav>

          <nav aria-label="Company">
            <p className="mb-4 text-sm font-semibold text-white">Company</p>
            <div className="space-y-2.5">
              <a href="/" className={footerLink}>
                Base.Tube Platform
              </a>
              <a href="/creator-hub" className={footerLink}>
                Creator Hub
              </a>
              <a href="/about" className={footerLink}>
                About Us
              </a>
              <a href="/contact" className={footerLink}>
                Contact
              </a>
            </div>
          </nav>

          <nav aria-label="Support">
            <p className="mb-4 text-sm font-semibold text-white">Support</p>
            <div className="space-y-2.5">
              <a href="mailto:support@base.tube" className={footerLink}>
                Help Center
              </a>
              <a href="/privacy" className={footerLink}>
                Privacy Policy
              </a>
              <a href="/terms" className={footerLink}>
                Terms of Service
              </a>
              <a href="/refund" className={footerLink}>
                Refund Policy
              </a>
              <a href="#faq" className={footerLink}>
                FAQ
              </a>
            </div>
          </nav>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 md:flex-row">
          <p className="text-sm text-zinc-600">© 2026 Base.Tube. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="https://twitter.com/basetube" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 transition-colors hover:text-white">
              Twitter
            </a>
            <a href="https://youtube.com/@basetube" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 transition-colors hover:text-white">
              YouTube
            </a>
            <a href="https://discord.gg/basetube" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 transition-colors hover:text-white">
              Discord
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

const ThumbnailLanding: React.FC = () => {
  useLandingFonts();
  const { account, resolved } = useStudioAccountState();
  const signedIn = account !== 'anonymous';
  const plans = useSubscriptionPlans();
  const me = useMySubscription();
  const offer: StartOffer = resolved
    ? startOffer({ catalog: plans.data, catalogFailed: Boolean(plans.error), signedIn, me: me.data, meFailed: Boolean(me.error) })
    : { kind: 'loading' };

  return (
    <div className="lp min-h-screen">
      <ScrollProgress />
      <ThumbnailLandingHeader offer={offer} signedIn={signedIn} />
      <main>
        <ThumbnailHero offer={offer} signedIn={signedIn} />
        <ProductVideo />
        <StudioDemo />
        <ChannelMemory catalog={plans.data} />
        <CreatorQuotes />
        <ReviewSection signedIn={signedIn} resolved={resolved} />
        <ThumbnailFeatures />
        <PricingTeaser
          catalog={plans.data}
          loading={plans.isPending}
          signedIn={signedIn}
          me={me.data}
          meLoading={signedIn && (me.isPending || !resolved)}
        />
        <ThumbnailFAQ catalog={plans.data} />
        <FinalCTA offer={offer} signedIn={signedIn} />
      </main>
      <LandingFooter />
    </div>
  );
};

export default ThumbnailLanding;
