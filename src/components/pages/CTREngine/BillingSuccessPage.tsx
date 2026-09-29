// /ai-thumbnails/billing/success?session_id=…&return=<path> — back from Stripe
// Checkout for a plan (or its free trial: `trialing` counts as on). The plan
// and its credits arrive through Stripe's webhooks, so the plan is read every
// 2 seconds for about a minute until it is on with its credits. Never a false
// "done", never an endless spinner.
import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle, Clock, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import AIThumbnailsLayout from './AIThumbnailsLayout';
import useCTREngine from '../../../hooks/useCTREngine';
import { useStudioAccountState } from '../../../hooks/useStudioAccount';
import { notifyStudioUsageChanged } from '../../../hooks/useStudioBalance';
import { shortDate, subscriptionKey } from '../../../hooks/useSubscription';
import { subscriptionsApi } from '../../../api/subscriptions';
import type { MySubscription } from '../../../types/subscription';
import { creditsReturnDestination } from '../../../utils/studioDraft';
import { startStudioAuth, STUDIO_SIGN_IN_PATH } from '../../../utils/studioAuth';
import { plainApiError } from '../../../utils/plainApiError';
import { TechnicalErrorDetail } from '../../common/TechnicalErrorDetail';

export const BILLING_POLL_INTERVAL_MS = 2000;
/** 30 reads 2 seconds apart: about a minute. */
export const BILLING_MAX_POLLS = 30;

/** The plan is on, with its credits. */
export const planIsReady = (me: MySubscription) =>
  (me.subscription?.status === 'active' || me.subscription?.status === 'trialing') &&
  (me.videosRemaining > 0 || me.credits.subscription.available > 0);

type Status = 'no-session' | 'waiting-account' | 'signed-out' | 'polling' | 'confirmed' | 'slow' | 'error';

export default function BillingSuccessPage() {
  const access = useCTREngine();
  const { account, resolved } = useStudioAccountState();
  const client = useQueryClient();
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const [returnTo] = useState(() => creditsReturnDestination(params.get('return'), '/ai-thumbnails/projects'));
  const cameFromPage = returnTo !== '/ai-thumbnails/projects';
  const [run, setRun] = useState(0);
  const [status, setStatus] = useState<Status>(sessionId ? 'waiting-account' : 'no-session');
  const [me, setMe] = useState<MySubscription | null>(null);
  const [errorDetail, setErrorDetail] = useState<{ message: string; technical: string | null } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const signedIn = account !== 'anonymous';
  useEffect(() => {
    if (!sessionId || !resolved) return;
    if (!signedIn) {
      setStatus('signed-out');
      return;
    }
    let active = true;
    let polls = 0;
    setStatus('polling');
    const poll = async () => {
      try {
        const value = await subscriptionsApi.getMe();
        if (!active) return;
        setMe(value);
        client.setQueryData(subscriptionKey(account), value);
        if (planIsReady(value)) {
          setStatus('confirmed');
          // Every balance on screen reads the new credits.
          notifyStudioUsageChanged();
          return;
        }
      } catch (failure) {
        if (!active) return;
        const problem = plainApiError(failure, 'Your plan could not be read just now.');
        if (problem.status === 401 || problem.status === 403) {
          setErrorDetail(problem);
          setStatus('error');
          return;
        }
        // A failed read counts as one try; the next one may work.
      }
      polls += 1;
      if (polls >= BILLING_MAX_POLLS) setStatus('slow');
      else timer.current = setTimeout(() => void poll(), BILLING_POLL_INTERVAL_MS);
    };
    void poll();
    return () => {
      active = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [sessionId, resolved, signedIn, account, client, run]);

  const planName = me?.subscription?.planName;
  const videos = me?.videosRemaining ?? 0;
  const videoCount = `${videos.toLocaleString()} video${videos === 1 ? '' : 's'}`;
  // A free trial: nothing was paid; the plan is charged when the trial ends.
  const trialing = me?.subscription?.status === 'trialing';
  const trialEnd = trialing ? shortDate(me?.trialEndsAt || me?.subscription?.currentPeriodEnd) : '';

  let icon = <Loader2 className="h-7 w-7 animate-spin text-[#fa7517]" aria-hidden="true" />;
  let heading = 'Confirming your plan…';
  let text = 'Stripe confirmed your checkout. Your plan and its credits are being set up.';
  if (status === 'confirmed' && trialing) {
    icon = <CheckCircle className="h-7 w-7 text-emerald-400" aria-hidden="true" />;
    heading = `Your free trial of ${planName} has started — ${videoCount} to use`;
    text = trialEnd
      ? `Nothing is charged before ${trialEnd}. Cancel before ${trialEnd} in Settings › Subscription and you pay nothing.`
      : 'Nothing is charged until your trial ends. Cancel before then in Settings › Subscription and you pay nothing.';
  } else if (status === 'confirmed') {
    icon = <CheckCircle className="h-7 w-7 text-emerald-400" aria-hidden="true" />;
    heading = `You're on ${planName} — ${videoCount} this month`;
    text = `${(me?.credits.subscription.available ?? 0).toLocaleString()} credits from your plan are in your balance.`;
  } else if (status === 'slow') {
    icon = <Clock className="h-7 w-7 text-amber-400" aria-hidden="true" />;
    heading = trialing ? 'Free trial confirmed' : 'Payment confirmed';
    text = trialing
      ? 'Stripe confirmed your free trial. Your credits arrive within a minute. Nothing is charged today.'
      : 'Stripe confirmed your payment. Your credits arrive within a minute. No need to pay again.';
  } else if (status === 'no-session') {
    icon = <AlertCircle className="h-7 w-7 text-zinc-400" aria-hidden="true" />;
    heading = 'No checkout session';
    text = 'This page is shown after you subscribe to a plan. Pick a plan on the pricing page.';
  } else if (status === 'signed-out') {
    icon = <AlertCircle className="h-7 w-7 text-zinc-400" aria-hidden="true" />;
    heading = 'Sign in to see your plan';
    text = 'Your payment is safe. Sign in with the account you subscribed with to see your plan and credits.';
  } else if (status === 'error') {
    icon = <AlertCircle className="h-7 w-7 text-red-400" aria-hidden="true" />;
    heading = "Couldn't read your plan";
    text = `${errorDetail?.message ?? ''} Your payment is safe. Check your plan in Settings in a minute.`.trim();
  }

  const primary =
    'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#fa7517] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#fa7517]/25 hover:bg-[#fb8a3c]';

  return (
    <AIThumbnailsLayout usageAccess={access.usageAccess} isLoadingQuota={access.isLoadingQuota}>
      <div className="mx-auto max-w-md py-10">
        <div className="rounded-2xl border border-white/10 bg-[#0e0e10] p-8 text-center shadow-2xl shadow-black/50">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/40">{icon}</div>
          <h1 className="mb-2 text-xl font-semibold text-white">{heading}</h1>
          <p role="status" className="mb-6 text-sm text-zinc-400">
            {text}
            {status === 'error' && <TechnicalErrorDetail detail={errorDetail?.technical} />}
          </p>
          {status === 'slow' && (
            <button
              type="button"
              onClick={() => setRun((value) => value + 1)}
              className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-medium text-white hover:bg-white/5"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </button>
          )}
          {status === 'signed-out' ? (
            <Link to={STUDIO_SIGN_IN_PATH} onClick={() => startStudioAuth('sign-in', '/ai-thumbnails/settings/subscription')} className={primary}>
              Sign in
            </Link>
          ) : status === 'no-session' ? (
            <Link to="/ai-thumbnails/pricing" className={primary}>
              See plans
            </Link>
          ) : (
            <Link to={returnTo} className={primary}>
              {cameFromPage ? 'Back to where you were' : 'Go to your projects'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
          {sessionId && <p className="mt-4 truncate text-[10px] text-zinc-700">Ref: {sessionId}</p>}
        </div>
      </div>
    </AIThumbnailsLayout>
  );
}
