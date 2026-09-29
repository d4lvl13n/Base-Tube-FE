import React, { useEffect, useId, useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Coins, CreditCard, ScanSearch, Sparkles, Wallet, Wand2 } from 'lucide-react';
import { useStudioAccountState } from '../../../../hooks/useStudioAccount';
import { useWelcomeOffer, WELCOME_CREDITS_GIVEN_OUT } from '../../../../hooks/useWelcomeOffer';
import { catalogTrial, useSubscriptionPlans } from '../../../../hooks/useSubscription';
import ConnectWalletButton from '../../../common/WalletWrapper/ConnectWalletButton';
import { AIThumbnailsSignIn, AIThumbnailsSignUp } from './AIThumbnailsClerk';
import {
  cleanStudioAuthUrl,
  readStudioAuthOrigin,
  setStudioAuthConsent,
  STUDIO_AUTH_CONTINUE_PATH,
  touchStudioAuthOrigin,
  type StudioAuthIntent,
} from '../../../../utils/studioAuth';
import { readPlanIntent, type PlanIntent } from '../../../../utils/studioDraft';
import { loadEmailGate, saveEmailGate } from '../../../../utils/studioFunnel';
import { planPriceText } from '../components/billing/PlanChoices';
import { noteStudioAuthStart } from '../../../../utils/studioWelcome';

/**
 * AI Thumbnails' own sign-in and sign-up pages (`/ai-thumbnails/sign-in/*`,
 * `/ai-thumbnails/sign-up/*`; Clerk's steps are sub-paths). Same Clerk
 * accounts as base.tube. Done, Clerk always goes to `/ai-thumbnails/auth/continue`
 * (AIThumbnailsAuthContinue), which returns to the AI Thumbnails page the
 * visitor came from (utils/studioAuth) without base.tube's onboarding.
 */

const FEATURES = [
  { Icon: Sparkles, title: 'Create', text: 'Thumbnails from a video title, a script, a YouTube link or an image.' },
  { Icon: Wand2, title: 'Fix', text: 'Change the text, the face or a detail of a thumbnail you made.' },
  { Icon: ScanSearch, title: 'Audit', text: 'Check a thumbnail, or a whole channel, before you publish.' },
];

/**
 * What both pages do before Clerk renders: a visitor already signed in goes to
 * the continue screen; a foreign Clerk redirect in the URL is dropped (Clerk
 * ranks it above its props); the origin marker is kept up to date.
 */
function useStudioAuthScreen(intent: StudioAuthIntent) {
  const location = useLocation();
  const { account, resolved } = useStudioAccountState();
  // A Clerk session that appears while the page is open is Clerk's own sign-in
  // finishing: Clerk goes to the continue screen itself. A wallet sign-in on the
  // sign-in page is finished here.
  const [clerkAtMount] = useState(() => account.startsWith('clerk:'));
  const signedIn = resolved && (account.startsWith('web3:') || (clerkAtMount && account.startsWith('clerk:')));
  const cleaned = cleanStudioAuthUrl(location.search, location.hash);
  const ready = !signedIn && !cleaned;
  useEffect(() => {
    if (!ready) return;
    touchStudioAuthOrigin(intent);
    noteStudioAuthStart();
  }, [ready, intent]);
  const redirect = signedIn
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
    <p className="mt-6 flex items-center gap-2 rounded-xl border border-[#fa7517]/25 bg-[#fa7517]/5 px-3 py-2.5 text-sm text-zinc-200">
      <Icon className="h-4 w-4 shrink-0 text-[#fa7517]" aria-hidden="true" />
      {text}
    </p>
  );
}

function AuthLayout({ title, subtitle, note, children }: { title: string; subtitle: string; note?: React.ReactNode; children: React.ReactNode }) {
  const titleId = useId();
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100">
      <header className="border-b border-white/[0.06]">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4 sm:px-6">
          <Link to="/ai-thumbnails" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#fa7517]/30 bg-[#fa7517]/10">
              <img src="/assets/basetubelogo.png" alt="" className="h-6 w-6" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-zinc-100">Base.Tube</span>
            <span className="text-sm text-zinc-500">AI Thumbnails</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-12 lg:py-14">
        <section aria-labelledby={titleId} className="lg:pt-4">
          <h1 id={titleId} className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
          <ul className="mt-6 space-y-3">
            {FEATURES.map(({ Icon, title: name, text }) => (
              <li key={name} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#fa7517]/10">
                  <Icon className="h-4 w-4 text-[#fa7517]" aria-hidden="true" />
                </span>
                <span><span className="font-semibold text-white">{name}.</span> <span className="text-zinc-400">{text}</span></span>
              </li>
            ))}
          </ul>
          {note}
        </section>
        <div className="min-w-0 space-y-4">{children}</div>
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
    <AuthLayout title="Sign in to AI Thumbnails" subtitle="Your base.tube account works here." note={<AuthNote planIntent={planIntent} gift={false} />}>
      <AIThumbnailsSignIn routing="path" />
      <section ref={wallet} aria-labelledby={walletTitleId} className="rounded-2xl border border-white/10 bg-[#111113] p-4">
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
  if (redirect) return redirect;
  return (
    <AuthLayout
      title={planIntent?.trial ? "Create your account to start your free trial" : "Create your free AI Thumbnails account"}
      subtitle="One account for AI Thumbnails and the rest of base.tube."
      note={<AuthNote planIntent={planIntent} gift />}
    >
      {/* Read before the form is sent: the value goes with the sign-up confirmation (consent). */}
      <label className="flex cursor-pointer select-none items-start gap-3 rounded-xl border border-white/10 bg-[#111113] px-3 py-2.5">
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
