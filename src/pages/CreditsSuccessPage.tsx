// src/pages/CreditsSuccessPage.tsx
// Post-checkout return for credit purchases. Stripe redirects here
// (/credits/success?session_id=...). The credit grant lands via an async Stripe
// webhook, so we poll the balance briefly and model every outcome explicitly —
// never a false "success" and never a permanent spinner.

import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Coins, Loader2, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { creditsApi } from '../api/credits';
import { CreditInfo } from '../types/ctr';

const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 6;

type Status = 'no-session' | 'polling' | 'confirmed' | 'pending' | 'error';

const CreditsSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState<Status>(sessionId ? 'polling' : 'no-session');
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);

  const mountedRef = useRef(true);
  const pollsRef = useRef(0);
  const initialBalanceRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    if (!sessionId) return; // no-session state already set; nothing to poll

    const poll = async () => {
      try {
        const { creditInfo: info } = await creditsApi.getCreditBalance();
        if (!mountedRef.current) return;
        setCreditInfo(info);
        if (initialBalanceRef.current === null) initialBalanceRef.current = info.balance;

        const granted = info.balance > (initialBalanceRef.current ?? info.balance);
        pollsRef.current += 1;

        if (granted) {
          setStatus('confirmed');
        } else if (pollsRef.current >= MAX_POLLS) {
          setStatus('pending'); // paid, grant hasn't landed yet — do NOT tell them to re-buy
        } else {
          timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch {
        if (!mountedRef.current) return;
        setStatus('error'); // balance unavailable (auth/network) — surface it, don't fake success
      }
    };

    poll();
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sessionId]);

  const heading =
    status === 'no-session'
      ? 'No checkout session'
      : status === 'error'
      ? "Couldn't confirm your top-up"
      : status === 'pending'
      ? 'Payment received'
      : 'Payment received';

  const subline =
    status === 'no-session'
      ? 'This page is shown after a credit purchase. Start a purchase from the studio.'
      : status === 'error'
      ? "We couldn't load your balance just now. Your payment is safe — check your balance in the studio in a minute."
      : status === 'pending'
      ? "Your credits are still being added (this can take a moment). No need to pay again — they'll appear on your balance shortly."
      : status === 'confirmed'
      ? 'Your credits have been added to your balance.'
      : 'Confirming your top-up…';

  const Icon =
    status === 'error' ? AlertCircle : status === 'pending' ? Clock : status === 'no-session' ? AlertCircle : CheckCircle;
  const iconColor = status === 'error' ? 'text-red-400' : status === 'pending' ? 'text-amber-400' : status === 'no-session' ? 'text-gray-400' : 'text-emerald-400';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#0b0b0b] border border-gray-800/60 rounded-2xl p-8 text-center shadow-2xl shadow-black/50"
      >
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-black/40 flex items-center justify-center border border-gray-800/60">
          <Icon className={`w-7 h-7 ${iconColor}`} />
        </div>

        <h1 className="text-xl font-semibold text-white mb-2">{heading}</h1>
        <p className="text-sm text-gray-400 mb-6">{subline}</p>

        {status !== 'no-session' && status !== 'error' && (
          <div className="rounded-xl border border-gray-800/60 bg-black/40 p-5 mb-6">
            <p className="text-xs text-gray-500 mb-1">Current balance</p>
            <div className="flex items-center justify-center gap-2">
              <Coins className="w-5 h-5 text-[#fa7517]" />
              {creditInfo ? (
                <span className="text-2xl font-semibold text-white">
                  {creditInfo.available.toLocaleString()}
                </span>
              ) : (
                <Loader2 className="w-5 h-5 animate-spin text-[#fa7517]" />
              )}
              <span className="text-sm text-gray-500">credits</span>
            </div>
            {status === 'polling' && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Confirming your top-up…
              </p>
            )}
          </div>
        )}

        <Link
          to="/ai-thumbnails/generate"
          className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-gradient-to-r from-[#fa7517] to-orange-500 text-white text-sm font-semibold shadow-lg shadow-[#fa7517]/25 hover:opacity-95 transition-opacity"
        >
          Back to the studio
          <ArrowRight className="w-4 h-4" />
        </Link>

        {sessionId && <p className="mt-4 text-[10px] text-gray-700 truncate">Ref: {sessionId}</p>}
      </motion.div>
    </div>
  );
};

export default CreditsSuccessPage;
