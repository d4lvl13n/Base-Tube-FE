// /ai-thumbnails — the AI Thumbnails landing page. Only true claims: prices,
// videos and the free trial come from GET /api/v1/subscriptions/plans; the one
// market figure and the Reddit quotes are in landingContent.ts with their source.
import React from 'react';
import { Link } from 'react-router-dom';
import { useMySubscription, useSubscriptionPlans } from '../../../hooks/useSubscription';
import { useStudioAccountState } from '../../../hooks/useStudioAccount';
import { startOffer, type StartOffer } from '../CTREngine/components/billing/StartOffer';
import ThumbnailLandingHeader from './ThumbnailLandingHeader';
import ThumbnailHero from './ThumbnailHero';
import NumbersBar from './NumbersBar';
import ProblemSection from './ProblemSection';
import CreatorQuotes from './CreatorQuotes';
import HowItWorks from './HowItWorks';
import ThumbnailFeatures from './ThumbnailFeatures';
import MeasuredNotPredicted from './MeasuredNotPredicted';
import PricingTeaser from './PricingTeaser';
import FreeReviewCard from './FreeReviewCard';
import ThumbnailFAQ from './ThumbnailFAQ';
import FinalCTA from './FinalCTA';

const footerLink = 'block text-sm text-gray-400 transition-colors hover:text-[#fa7517]';

function LandingFooter() {
  return (
    <footer className="border-t border-gray-800/30 bg-black py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <img src="/assets/basetubelogo.png" alt="Base.Tube Logo" className="h-10 w-10" />
              <div>
                <span className="bg-gradient-to-r from-[#fa7517] to-orange-400 bg-clip-text text-lg font-bold text-transparent">Base.Tube</span>
                <p className="text-xs text-gray-400">AI Thumbnails</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              AI thumbnails in your channel&apos;s style, and reviews that say what to change.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">Product</h3>
            <div className="space-y-2">
              <Link to="/ai-thumbnails/pricing" className={footerLink}>
                Pricing
              </Link>
              <Link to="/ai-thumbnails/audit" className={footerLink}>
                Free review
              </Link>
              <Link to="/ai-thumbnails/projects" className={footerLink}>
                Studio
              </Link>
              <a href="#features" className={footerLink}>
                Features
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">Company</h3>
            <div className="space-y-2">
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
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">Support</h3>
            <div className="space-y-2">
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
          </div>
        </div>

        <div className="mt-12 border-t border-gray-800/30 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-sm text-gray-500">© 2026 Base.Tube. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <a href="https://twitter.com/basetube" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 transition-colors hover:text-[#fa7517]">
                Twitter
              </a>
              <a href="https://youtube.com/@basetube" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 transition-colors hover:text-[#fa7517]">
                YouTube
              </a>
              <a href="https://discord.gg/basetube" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 transition-colors hover:text-[#fa7517]">
                Discord
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

const ThumbnailLanding: React.FC = () => {
  const { account, resolved } = useStudioAccountState();
  const signedIn = account !== 'anonymous';
  const plans = useSubscriptionPlans();
  const me = useMySubscription();
  const offer: StartOffer = resolved
    ? startOffer({ catalog: plans.data, catalogFailed: Boolean(plans.error), signedIn, me: me.data, meFailed: Boolean(me.error) })
    : { kind: 'loading' };

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <ThumbnailLandingHeader offer={offer} signedIn={signedIn} />
      <main>
        <ThumbnailHero offer={offer} signedIn={signedIn} />
        <NumbersBar catalog={plans.data} loading={plans.isPending} />
        <ProblemSection />
        <CreatorQuotes />
        <HowItWorks />
        <ThumbnailFeatures />
        <MeasuredNotPredicted />
        <PricingTeaser
          catalog={plans.data}
          loading={plans.isPending}
          signedIn={signedIn}
          me={me.data}
          meLoading={signedIn && (me.isPending || !resolved)}
        />
        {resolved && !signedIn && <FreeReviewCard />}
        <ThumbnailFAQ catalog={plans.data} />
        <FinalCTA offer={offer} signedIn={signedIn} />
      </main>
      <LandingFooter />
    </div>
  );
};

export default ThumbnailLanding;
