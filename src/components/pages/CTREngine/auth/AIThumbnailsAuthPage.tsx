import React, { useEffect, useId, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Check, Coins, CreditCard, Wallet } from 'lucide-react';
import { useStudioAccountState } from '../../../../hooks/useStudioAccount';
import { useWelcomeOffer, WELCOME_CREDITS_GIVEN_OUT } from '../../../../hooks/useWelcomeOffer';
import { catalogTrial, useSubscriptionPlans } from '../../../../hooks/useSubscription';
import ConnectWalletButton from '../../../common/WalletWrapper/ConnectWalletButton';
import { AIThumbnailsSignIn, AIThumbnailsSignUp } from './AIThumbnailsClerk';
import {
  cleanStudioAuthUrl,
  readStudioAuthOrigin,
  setStudioAuthConsent,
  startStudioAuth,
  STUDIO_AUTH_CONTINUE_PATH,
  touchStudioAuthOrigin,
  type StudioAuthIntent,
} from '../../../../utils/studioAuth';
import { planIntentFromLink, readPlanIntent, rememberPlanIntent, withoutPlanLink, type PlanIntent } from '../../../../utils/studioDraft';
import { loadEmailGate, saveEmailGate } from '../../../../utils/studioFunnel';
import { planPriceText } from '../components/billing/PlanChoices';
import { STUDIO_HOME_PATH } from '../components/billing/StartOffer';
import { noteStudioAuthStart } from '../../../../utils/studioWelcome';
import ThumbnailWall from '../../ThumbnailLanding/ThumbnailWall';
import { RevealHeading, type HeadingPart } from '../../ThumbnailLanding/motionKit';
import { useLandingFonts } from '../../ThumbnailLanding/useLandingFonts';
import { AI_THUMBNAILS_LANDING_URL } from '../../ThumbnailLanding/LandingMoved';
import '../../ThumbnailLanding/landing.css';

/**
 * AI Thumbnails' own sign-in and sign-up pages (`/ai-thumbnails/sign-in/*`,
 * `/ai-thumbnails/sign-up/*`; Clerk's steps are sub-paths). Same Clerk
 * accounts as base.tube. Done, Clerk always goes to `/ai-thumbnails/auth/continue`
 * (AIThumbnailsAuthContinue), which returns to the AI Thumbnails page the
 * visitor came from (utils/studioAuth) without base.tube's onboarding.
 */

// What the account gets, as on the landing page: outcomes, not features.
const OUTCOMES = [
  'Three thumbnail ideas for every video, with your face.',
  'A review that says exactly what to change.',
  'Your channel’s style, remembered for every idea.',
];

/**
 * What both pages do before Clerk renders: a plan link from base.tube is
 * remembered and taken out of the address; then a visitor already signed in
 * goes to the continue screen; a foreign Clerk redirect in the URL is dropped
 * (Clerk ranks it above its props); the origin marker is kept up to date.
 */
function useStudioAuthScreen(intent: StudioAuthIntent) {
  const location = useLocation();
  const { account, resolved } = useStudioAccountState();
  // On the first render, before anything else reads it: the continue screen
  // (where a signed-in visitor goes at once) opens this plan's checkout. The
  // Studio is where the visitor goes if the account already has a plan.
  useState(() => {
    const planIntent = planIntentFromLink(location.search);
    if (!planIntent) return;
    startStudioAuth(intent, STUDIO_HOME_PATH);
    rememberPlanIntent(planIntent);
  });
  const planLinkSearch = withoutPlanLink(location.search);
  // A Clerk session that appears while the page is open is Clerk's own sign-in
  // finishing: Clerk goes to the continue screen itself. A wallet sign-in on the
  // sign-in page is finished here.
  const [clerkAtMount] = useState(() => account.startsWith('clerk:'));
  const signedIn = resolved && (account.startsWith('web3:') || (clerkAtMount && account.startsWith('clerk:')));
  const cleaned = cleanStudioAuthUrl(location.search, location.hash);
  const ready = planLinkSearch === null && !signedIn && !cleaned;
  useEffect(() => {
    if (!ready) return;
    touchStudioAuthOrigin(intent);
    noteStudioAuthStart();
  }, [ready, intent]);
  const redirect = planLinkSearch !== null
    ? <Navigate to={{ pathname: location.pathname, search: planLinkSearch, hash: location.hash }} replace />
    : signedIn
      ? <Navigate to={STUDIO_AUTH_CONTINUE_PATH} replace />
      : cleaned
        ? <Navigate to={{ pathname: location.pathname, search: cleaned.search, hash: cleaned.hash }} replace />
        : null;
  return { redirect, location };
}

/**
 * The sign-in and sign-up pages' note. On sign-up, the welcome credits when
 * the gift is on (GET /tool/welcome-offer; they need a verified email). Else,
 * when a plan button led here, what comes right after: Stripe Checkout for
 * that plan (its free trial when the button promised one). Else nothing.
 */
function AuthNote({ planIntent, gift }: { planIntent: PlanIntent | null; gift: boolean }) {
  const offer = useWelcomeOffer();
  const plans = useSubscriptionPlans(Boolean(planIntent));
  const trial = planIntent?.trial ? catalogTrial(plans.data) : null;
  const plan = planIntent ? plans.data?.plans.find(({ id }) => id === planIntent.planId) ?? null : null;
  let Icon = Coins;
  let text: string | null = null;
  if (gift && offer.credits !== null) text = offer.givenOut ? WELCOME_CREDITS_GIVEN_OUT : `${offer.credits} free credits once your email is verified.`;
  else if (trial) {
    Icon = CreditCard;
    text = `Next: secure checkout for your ${trial.days}-day free trial${plan ? ` of ${plan.name}` : ''}, ${trial.videos} video${trial.videos === 1 ? '' : 's'} included. Your card is charged on day ${trial.days + 1} unless you cancel.`;
  } else if (planIntent && plan && !planIntent.trial) {
    Icon = CreditCard;
    text = `Next: secure checkout for ${plan.name} (${planPriceText(plan, planIntent.interval)}).`;
  }
  if (!text) return null;
  return (
    <p className="mt-8 flex items-start gap-3 rounded-2xl border border-[#fa7517]/30 bg-[#fa7517]/[0.08] px-4 py-3.5 text-sm leading-relaxed text-zinc-100 backdrop-blur-md">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fa7517] text-white">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className="pt-0.5">{text}</span>
    </p>
  );
}

/**
 * The two pages' frame, mirroring the landing page: on the left the drifting wall of thumbnails
 * under a dark veil, a white and orange headline, the outcomes and the next step; on the right the
 * form on a glass panel. On a phone the left side shortens to the headline above the form.
 */
function AuthLayout({ heading, subtitle, note, children }: { heading: HeadingPart[]; subtitle: string; note?: React.ReactNode; children: React.ReactNode }) {
  useLandingFonts();
  const titleId = useId();
  return (
    <div className="lp relative isolate min-h-screen overflow-hidden text-zinc-100">
      <ThumbnailWall rows={5} className="-z-20 opacity-80" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,7,9,0.82)_0%,rgba(7,7,9,0.9)_45%,rgba(7,7,9,0.97)_60%,#070709_100%)] max-lg:bg-[linear-gradient(180deg,rgba(7,7,9,0.85)_0%,rgba(7,7,9,0.96)_40%,#070709_70%)]"
      />
      <div aria-hidden="true" className="absolute right-[12%] top-1/3 -z-10 h-[420px] w-[520px] rounded-full bg-[#fa7517]/[0.1] blur-[140px]" />

      <header className="relative">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href={AI_THUMBNAILS_LANDING_URL} className="flex items-center gap-2.5">
            <img src="/assets/basetubelogo.png" alt="" className="h-8 w-8" />
            <span className="flex flex-col leading-tight">
              <span className="text-[15px] font-bold text-white">Base.Tube</span>
              <span className="text-xs text-white/55">AI Thumbnails</span>
            </span>
          </a>
          <a href={AI_THUMBNAILS_LANDING_URL} className="text-sm text-white/70 transition-colors hover:text-white">
            Back to AI Thumbnails
          </a>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-6 sm:px-8 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-12 lg:gap-16 lg:pb-20">
        <section aria-labelledby={titleId} className="lg:col-span-7">
          <RevealHeading as="h1" id={titleId} immediate className="lp-display max-w-2xl text-[2.6rem] text-white sm:text-6xl lg:text-7xl" parts={heading} />
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-300">{subtitle}</p>
          <ul className="mt-8 hidden space-y-3 sm:block">
            {OUTCOMES.map((outcome) => (
              <li key={outcome} className="flex items-center gap-3 text-base text-zinc-200">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fa7517] text-white shadow-[0_8px_30px_-8px_rgba(250,117,23,0.8)]">
                  <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                </span>
                {outcome}
              </li>
            ))}
          </ul>
          {note}
        </section>
        <div className="min-w-0 space-y-4 lg:col-span-5">{children}</div>
      </main>
    </div>
  );
}

/** `/ai-thumbnails/sign-in/*`: email (and Google, Discord) with Clerk, or a wallet. */
export function AIThumbnailsSignInPage() {
  const { redirect, location } = useStudioAuthScreen('sign-in');
  const wallet = useRef<HTMLElement>(null);
  const walletTitleId = useId();
  const showWallet = Boolean((location.state as { wallet?: boolean } | null)?.wallet);
  useEffect(() => {
    if (!showWallet || redirect) return;
    wallet.current?.scrollIntoView?.({ block: 'center' });
    wallet.current?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }, [showWallet, redirect]);
  const offer = useWelcomeOffer();
  const [planIntent] = useState(() => readPlanIntent());
  if (redirect) return redirect;
  return (
    <AuthLayout
      heading={['Welcome ', { accent: 'back.' }]}
      subtitle="Sign in with your base.tube account to open your Studio, your projects and your channel profiles."
      note={<AuthNote planIntent={planIntent} gift={false} />}
    >
      <AIThumbnailsSignIn routing="path" />
      <section ref={wallet} aria-labelledby={walletTitleId} className="rounded-[22px] border border-white/10 bg-[#101015]/90 p-5 backdrop-blur-xl">
        <h2 id={walletTitleId} tabIndex={-1} className="flex items-center gap-2 text-sm font-semibold text-white focus:outline-none">
          <Wallet className="h-4 w-4 text-[#fa7517]" aria-hidden="true" />
          Sign in with a wallet
        </h2>
        {offer.credits !== null && <p className="mt-1 text-xs text-zinc-400">Welcome credits need an account with a verified email.</p>}
        <div className="mt-3">
          <ConnectWalletButton className="w-full" customText="Sign in with a wallet" />
        </div>
      </section>
    </AuthLayout>
  );
}

/** `/ai-thumbnails/sign-up/*`: Clerk's sign-up and the unticked opt-in box. */
export function AIThumbnailsSignUpPage() {
  const { redirect } = useStudioAuthScreen('sign-up');
  // The gate's box when the gate started this sign-up, else this page's.
  const [consent, setConsent] = useState(() => {
    const gate = loadEmailGate();
    return gate?.phase === 'awaiting_sign_in' ? gate.marketingConsent : readStudioAuthOrigin()?.consent === true;
  });
  const onConsent = (checked: boolean) => {
    setConsent(checked);
    setStudioAuthConsent(checked);
    const gate = loadEmailGate();
    if (gate?.phase === 'awaiting_sign_in') saveEmailGate({ ...gate, marketingConsent: checked, updatedAt: Date.now() });
  };
  // A plan button led here: its checkout opens right after the sign-up (AIThumbnailsAuthContinue).
  const [planIntent] = useState(() => readPlanIntent());
  const plans = useSubscriptionPlans();
  const trial = catalogTrial(plans.data);
  const plan = planIntent ? plans.data?.plans.find(({ id }) => id === planIntent.planId) ?? null : null;
  if (redirect) return redirect;
  // Why the visitor is here decides the headline: a trial button, a paid plan button, or just signing up.
  const heading: HeadingPart[] = planIntent?.trial
    ? ['Start your ', { accent: trial ? `${trial.days}-day free trial.` : 'free trial.' }]
    : planIntent && plan
      ? ['Create your account for ', { accent: `${plan.name}.` }]
      : ['Make thumbnails that look like ', { accent: 'your channel.' }];
  const subtitle = planIntent
    ? 'Create your account, then a secure Stripe page opens. One account for AI Thumbnails and the rest of base.tube.'
    : trial
      ? `Create your free account. Then try any plan free for ${trial.days} days, with ${trial.videos} video${trial.videos === 1 ? '' : 's'} included.`
      : 'Create your free account. One account for AI Thumbnails and the rest of base.tube.';
  return (
    <AuthLayout heading={heading} subtitle={subtitle} note={<AuthNote planIntent={planIntent} gift />}>
      {/* Read before the form is sent: the value goes with the sign-up confirmation (consent). */}
      <label className="flex cursor-pointer select-none items-start gap-3 rounded-2xl border border-white/10 bg-[#101015]/90 px-4 py-3 backdrop-blur-xl">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => onConsent(event.target.checked)}
          className="mt-0.5 h-4 w-4 cursor-pointer rounded border-white/20 bg-white/5 accent-[#fa7517]"
        />
        <span className="text-xs leading-relaxed text-zinc-400">
          Send me occasional product tips and updates. Optional — you can unsubscribe any time.
        </span>
      </label>
      <AIThumbnailsSignUp routing="path" />
    </AuthLayout>
  );
}
