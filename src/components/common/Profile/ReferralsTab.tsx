import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Loader2,
  RefreshCcw,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';
import { toast } from 'react-toastify';
import Error from '../Error';
import Loader from '../Loader';
import {
  useApplyReferralCode,
  useReferralInfo,
  useRotateReferralCode,
} from '../../../hooks/useProfileData';

interface ReferralsTabProps {
  errors?: { [key: string]: string };
}

const ReferralsTab: React.FC<ReferralsTabProps> = ({ errors }) => {
  const referralInfo = useReferralInfo();
  const applyReferral = useApplyReferralCode();
  const rotateReferral = useRotateReferralCode();
  const [applyCode, setApplyCode] = useState('');
  const [showRotateConfirm, setShowRotateConfirm] = useState(false);

  if (errors?.referrals) {
    return <Error message={errors.referrals} />;
  }

  if (referralInfo.isLoading) {
    return <Loader />;
  }

  if (referralInfo.error || !referralInfo.data) {
    return <Error message="Failed to load your referral details" />;
  }

  const referral = referralInfo.data;
  const referralCode = referral.code;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = `${baseUrl}/sign-up?ref=${encodeURIComponent(referralCode)}`;

  const handleCopy = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on BaseTube',
          text: 'Use my referral link to sign up on BaseTube.',
          url: referralLink,
        });
        return;
      } catch {
        // user cancelled or share unavailable, fall through to copy
      }
    }

    await handleCopy(referralLink, 'Invite link copied');
  };

  const handleApplyReferral = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedCode = applyCode.trim();

    if (!normalizedCode) {
      toast.error('Enter a referral code first');
      return;
    }

    try {
      const result = await applyReferral.mutateAsync(normalizedCode);
      setApplyCode('');
      toast.success(
        result.status === 'activated'
          ? 'Referral applied. Your referral was activated.'
          : 'Referral applied. Referral recorded.'
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to apply referral code');
    }
  };

  const handleRotateReferral = async () => {
    try {
      await rotateReferral.mutateAsync();
      setShowRotateConfirm(false);
      toast.success('Referral code rotated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to rotate referral code');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fa7517] to-orange-400 mb-3">
          Invite Friends
        </h1>
        <p className="text-gray-400 text-lg">Your referral code is ready automatically. Share it, copy it, or rotate it only when you need to.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr,0.8fr] gap-6">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden"
        >
          <div className="relative z-10 space-y-6">
            <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#fa7517]/10 rounded-lg">
                    <Share2 className="w-5 h-5 text-[#fa7517]" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Your referral code</h2>
                </div>
                <p className="text-sm text-gray-400">
                  Invite friends with your stable code. It is created automatically for your account.
                </p>
              </div>

              <button
                onClick={() => setShowRotateConfirm(true)}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium flex items-center gap-2 transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                Rotate code
              </button>
            </div>

            <div className="rounded-2xl border border-[#fa7517]/20 bg-[#fa7517]/8 p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-[#fa7517] mb-2">Invite friends</div>
              <div className="text-3xl font-bold text-white tracking-[0.18em]">{referralCode}</div>
              <p className="text-sm text-gray-400 mt-3">
                Anyone signing up with this code can be attributed to you.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-sm text-gray-300 font-medium">Share link</div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300 break-all">
                {referralLink}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => handleCopy(referralCode, 'Referral code copied')}
                  className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy code
                </button>
                <button
                  onClick={() => handleCopy(referralLink, 'Invite link copied')}
                  className="px-4 py-3 rounded-xl bg-[#fa7517] hover:bg-orange-500 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy link
                </button>
                <button
                  onClick={handleShare}
                  className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#fa7517]/10 rounded-lg">
              <Users className="w-5 h-5 text-[#fa7517]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Referral overview</h2>
              <p className="text-sm text-gray-400">A quick view of your current referral identity.</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-gray-400">Successful referrals</div>
            <div className="text-3xl font-bold text-white mt-1">{referral.referralsCount.toLocaleString()}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-gray-400">Referral earnings</div>
            <div className="text-3xl font-bold text-white mt-1">{referral.earnings.toLocaleString()}</div>
          </div>

          <div className="rounded-xl border border-[#fa7517]/15 bg-[#fa7517]/6 p-4 text-sm text-gray-300">
            <div className="flex items-center gap-2 text-white font-medium mb-2">
              <Sparkles className="w-4 h-4 text-[#fa7517]" />
              Stable referral identity
            </div>
            Your code is created automatically. Rotate it only if you intentionally want to replace the code you have already shared.
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr,1.05fr] gap-6">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#fa7517]" />
            <h2 className="text-xl font-bold text-white">Apply a referral code</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Enter a code someone shared with you. This records referral attribution for your account. It is not a coupon or discount.
          </p>
          <form onSubmit={handleApplyReferral} className="space-y-4">
            <div className="flex gap-3 flex-col sm:flex-row">
              <input
                value={applyCode}
                onChange={(event) => setApplyCode(event.target.value)}
                placeholder="Enter referral code"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#fa7517]/50"
              />
              <button
                type="submit"
                disabled={applyReferral.isPending}
                className="px-5 py-3 rounded-xl bg-[#fa7517] text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {applyReferral.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Apply
              </button>
            </div>
            <div className="text-xs text-gray-500">
              Successful outcomes can be recorded as either <span className="text-gray-300">registered</span> or <span className="text-gray-300">activated</span>.
            </div>
          </form>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-[#fa7517]" />
            <h2 className="text-xl font-bold text-white">How this works</h2>
          </div>
          <div className="space-y-4 text-sm text-gray-300">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              Open this tab and your referral code is ready automatically. You do not need to generate it first.
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              Copy the link or the code and share it with friends who are creating a BaseTube account.
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              Rotate your code only when you want to replace the one you have already shared. Older links may stop attributing back to you.
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showRotateConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              if (!rotateReferral.isPending) {
                setShowRotateConfirm(false);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0b10] p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-white">Rotate referral code?</h3>
              <p className="text-sm text-gray-400 mt-3">
                Your current referral code will be replaced. Anyone using the old code may no longer be attributed to you.
              </p>

              <div className="mt-6 flex gap-3 justify-end flex-col sm:flex-row">
                <button
                  onClick={() => setShowRotateConfirm(false)}
                  disabled={rotateReferral.isPending}
                  className="px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRotateReferral}
                  disabled={rotateReferral.isPending}
                  className="px-4 py-3 rounded-xl bg-[#fa7517] hover:bg-orange-500 text-white font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {rotateReferral.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                  Rotate code
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ReferralsTab;
