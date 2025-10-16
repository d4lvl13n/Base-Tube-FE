import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useCheckoutStatus, usePassDetails } from '../hooks/usePass';
import { useAccess, usePurchaseStatus } from '../hooks/useOnchainPass';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, ArrowLeft, RefreshCw, Sparkles, Crown } from 'lucide-react';

const CheckoutSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const [passId, setPassId] = useState<string | null>(null);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);

  // Poll for checkout status
  const { 
    data: checkoutStatus, 
    error: statusError, 
    isLoading: isStatusLoading,
    isError: isStatusError
  } = useCheckoutStatus(sessionId);

  // Start polling onchain purchase status by session id (backend resolves via session_id/payment_intent)
  const { data: purchaseStatusResp } = usePurchaseStatus(sessionId ?? undefined, { enabled: Boolean(sessionId), intervalMs: 3000 });

  // Fetch pass details if we have passId to obtain videoId securely
  const { data: passDetails } = usePassDetails(passId ?? undefined);

  // Prefetch and assert access as soon as passId is known
  const { isLoading: isAccessLoading } = useAccess(passId ?? undefined, { enabled: Boolean(passId) });

  // No longer auto-play content on success page; we show a premium success screen instead

  // Handle initial invalid access
  useEffect(() => {
    if (!sessionId) {
      navigate('/');
    }
  }, [sessionId, navigate]);

  // When checkout resolver exposes purchase_id, store it locally and begin purchase polling
  useEffect(() => {
    if (checkoutStatus?.purchase_id && !purchaseId) {
      setPurchaseId(checkoutStatus.purchase_id);
      try { localStorage.setItem('last_purchase_id', checkoutStatus.purchase_id); } catch {}
    }
  }, [checkoutStatus?.purchase_id, purchaseId]);

  // When onchain purchase status reaches terminal state, set passId for details/access
  useEffect(() => {
    const onchainStatus = purchaseStatusResp?.data?.status;
    if (onchainStatus && ['minted', 'claimed', 'completed'].includes(onchainStatus)) {
      const resolvedPassId = purchaseStatusResp?.data?.passId || (purchaseStatusResp?.data as any)?.pass_id;
      if (resolvedPassId) setPassId(resolvedPassId);
    }
  }, [purchaseStatusResp]);

  // Fallback when checkout status already includes pass_id (completed)
  useEffect(() => {
    if (checkoutStatus?.status === 'completed' && checkoutStatus.pass_id) {
      setPassId(checkoutStatus.pass_id);
    }
  }, [checkoutStatus]);

  if (!sessionId) return null;

  // Loading state - waiting for checkout confirmation / mint completion
  const isProcessing = !isStatusError && (checkoutStatus?.status === 'processing' || checkoutStatus?.status === 'open');
  const isMintPolling = Boolean(sessionId) && !(purchaseStatusResp?.data?.status && ['minted','claimed','completed'].includes(purchaseStatusResp.data.status)) && !passId;
  if (isStatusLoading || isAccessLoading || (isProcessing && isMintPolling) || isMintPolling) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="space-y-6 text-center max-w-lg p-8">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="mx-auto w-12 h-12 text-orange-500"
          >
            <RefreshCw className="w-12 h-12" />
          </motion.div>
          <h1 className="text-3xl font-bold">Minting content pass…</h1>
          <p className="text-gray-300">
            Your payment was successful! We're now minting your content pass on-chain.
          </p>
          {purchaseStatusResp?.data?.mintTxUrl && (
            <p>
              <a
                href={purchaseStatusResp.data.mintTxUrl}
                target="_blank"
                rel="noreferrer"
                className="text-orange-400 hover:text-orange-300 underline"
              >
                View mint transaction on explorer
              </a>
            </p>
          )}
        </div>
      </div>
    );
  }

  // Error with checkout status
  if (isStatusError || ['expired', 'open'].includes(checkoutStatus?.status || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="space-y-6 text-center max-w-lg p-8 bg-red-900/20 rounded-xl border border-red-500/20">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-3xl font-bold">Payment issue</h1>
          <p className="text-gray-300">
            {statusError?.message || 
             `There was a problem with your purchase (Status: ${checkoutStatus?.status || 'unknown'}).`}
          </p>
          <div className="pt-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Premium success screen with stunning animation
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated background gradients */}
      <motion.div 
        className="absolute inset-0 bg-gradient-radial from-[#fa7517]/20 via-black to-black"
        animate={{ 
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
      />

      {/* Animated light rays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => {
          const angle = (i / 12) * 360;
          return (
            <motion.div
              key={`ray-${i}`}
              className="absolute h-[2px] bg-gradient-to-r from-transparent via-[#fa7517]/30 to-transparent"
              style={{
                top: '50%',
                left: '50%',
                transformOrigin: '0 0',
                transform: `rotate(${angle}deg)`,
                width: '0px',
              }}
              animate={{
                width: ['0px', '800px', '0px'],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: 4,
                delay: i * 0.3,
                repeat: Infinity,
                repeatDelay: 4,
              }}
            />
          );
        })}
      </div>

      {/* Floating particles */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 rounded-full bg-[#FFD700]"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 0.8, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: Math.random() * 5,
            repeat: Infinity,
            repeatType: "loop",
          }}
        />
      ))}

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        {/* Header with back button */}
        <motion.div 
          className="flex items-center justify-between mb-8 sm:mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Return to Home</span>
          </Link>
          <motion.div 
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-500/20 text-green-400 rounded-full"
            animate={{
              boxShadow: ["0 0 10px rgba(20, 184, 129, 0.3)", "0 0 20px rgba(20, 184, 129, 0.5)", "0 0 10px rgba(20, 184, 129, 0.3)"],
            }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium">Purchase Successful</span>
          </motion.div>
        </motion.div>

        {/* Main elite club card */}
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          {/* Animated crown centerpiece */}
          <motion.div
            className="relative mb-8 sm:mb-12"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring",
              damping: 12,
              stiffness: 100,
              delay: 0.3
            }}
          >
            <motion.div
              className="relative"
              animate={{ 
                rotateY: [0, 360],
                rotateX: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Glowing aura */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-[#FFD700] to-[#fa7517] rounded-full opacity-60 blur-2xl"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 0.7, 0.4]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  repeatType: "reverse" 
                }}
              />
              
              {/* Crown container */}
              <motion.div
                className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#fa7517] to-[#ff8c3a] flex items-center justify-center"
                animate={{
                  boxShadow: [
                    "0 0 30px rgba(250, 117, 23, 0.4)", 
                    "0 0 60px rgba(250, 117, 23, 0.7)", 
                    "0 0 30px rgba(250, 117, 23, 0.4)"
                  ],
                }}
                transition={{
                  boxShadow: { duration: 2, repeat: Infinity, repeatType: "reverse" },
                }}
              >
                <Crown className="w-12 h-12 sm:w-16 sm:h-16 text-white drop-shadow-lg" strokeWidth={1.5} />
              </motion.div>

              {/* Orbiting sparkles */}
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={`sparkle-${i}`}
                  className="absolute"
                  style={{
                    top: '50%',
                    left: '50%',
                  }}
                  animate={{
                    x: Math.cos((i * Math.PI * 2) / 4) * 80,
                    y: Math.sin((i * Math.PI * 2) / 4) * 80,
                    rotate: 360,
                    scale: [1, 1.3, 1],
                  }}
                  transition={{
                    x: { duration: 4, repeat: Infinity, ease: "linear" },
                    y: { duration: 4, repeat: Infinity, ease: "linear" },
                    rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity, repeatType: "reverse" },
                  }}
                >
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFD700]" />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Elite welcome text */}
          <motion.div
            className="text-center mb-8 sm:mb-12 px-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.h1
              className="text-3xl sm:text-5xl md:text-6xl font-bold mb-3 sm:mb-4"
              animate={{
                textShadow: [
                  "0 0 20px rgba(250, 117, 23, 0.5)",
                  "0 0 40px rgba(250, 117, 23, 0.8)",
                  "0 0 20px rgba(250, 117, 23, 0.5)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FFD700] via-[#fa7517] to-[#FFD700]">
                You're In. Welcome Home.
              </span>
            </motion.h1>
            <motion.p
              className="text-lg sm:text-xl md:text-2xl text-white/80 mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              You're now part of an exclusive community
            </motion.p>
            <motion.p
              className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              Access premium content, connect with creators, and be part of something bigger
            </motion.p>
          </motion.div>

          {/* Pass details card */}
          <motion.div
            className="w-full max-w-3xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
          >
            <div className="relative overflow-hidden rounded-2xl border border-[#fa7517]/30 bg-gradient-to-br from-[#111] via-[#0a0a0f] to-[#09090B] p-6 sm:p-8">
              {/* Card glow effect */}
              <motion.div
                className="absolute inset-0 opacity-20 pointer-events-none"
                animate={{
                  background: [
                    "radial-gradient(circle at 0% 0%, #fa7517 0%, transparent 50%)",
                    "radial-gradient(circle at 100% 100%, #fa7517 0%, transparent 50%)",
                    "radial-gradient(circle at 0% 0%, #fa7517 0%, transparent 50%)",
                  ],
                }}
                transition={{ duration: 6, repeat: Infinity }}
              />

              <div className="relative z-10 space-y-6">
                {/* Pass info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <motion.div 
                    className="p-4 sm:p-5 rounded-lg bg-white/5 border border-white/10"
                    whileHover={{ scale: 1.05, borderColor: "rgba(250, 117, 23, 0.5)" }}
                  >
                    <div className="text-xs sm:text-sm text-white/60 mb-1">Your Pass</div>
                    <div className="text-base sm:text-lg text-white font-bold truncate">{passDetails?.title || 'Premium Pass'}</div>
                  </motion.div>
                  <motion.div 
                    className="p-4 sm:p-5 rounded-lg bg-white/5 border border-white/10"
                    whileHover={{ scale: 1.05, borderColor: "rgba(250, 117, 23, 0.5)" }}
                  >
                    <div className="text-xs sm:text-sm text-white/60 mb-1">Investment</div>
                    <div className="text-base sm:text-lg text-white font-bold">{passDetails?.formatted_price || ''}</div>
                  </motion.div>
                  <motion.div 
                    className="p-4 sm:p-5 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30"
                    animate={{
                      boxShadow: [
                        "0 0 10px rgba(20, 184, 129, 0.2)",
                        "0 0 20px rgba(20, 184, 129, 0.4)",
                        "0 0 10px rgba(20, 184, 129, 0.2)",
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                  >
                    <div className="text-xs sm:text-sm text-emerald-300/80 mb-1">Membership</div>
                    <div className="text-base sm:text-lg text-emerald-400 font-bold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      Active
                    </div>
                  </motion.div>
                </div>

                {/* Description */}
                <motion.div
                  className="text-center py-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                >
                  <p className="text-sm sm:text-base text-white/80 mb-2 leading-relaxed">
                    Your support empowers creators to keep making amazing content.
                  </p>
                  <p className="text-sm sm:text-base text-white/60 mb-4">
                    This isn't just a purchase — it's your backstage pass to the future of creator economy.
                  </p>
                  {(purchaseStatusResp?.data?.claimTxUrl || purchaseStatusResp?.data?.mintTxUrl) && (
                    <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm mt-4 pt-4 border-t border-white/10">
                      <span className="text-white/50">On-chain proof:</span>
                      {purchaseStatusResp?.data?.mintTxUrl && (
                        <a
                          href={purchaseStatusResp.data.mintTxUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-orange-400 hover:text-orange-300 underline font-medium"
                        >
                          View mint transaction
                        </a>
                      )}
                      {purchaseStatusResp?.data?.claimTxUrl && (
                        <a
                          href={purchaseStatusResp.data.claimTxUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-orange-400 hover:text-orange-300 underline font-medium"
                        >
                          View claim transaction
                        </a>
                      )}
                    </div>
                  )}
                </motion.div>

                {/* CTA buttons */}
                <motion.div
                  className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.7 }}
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                    <Link
                      to={passId ? `/watch/${passId}` : '/my-passes'}
                      className="inline-flex items-center gap-2 px-6 sm:px-10 py-4 rounded-lg bg-gradient-to-r from-[#fa7517] to-[#ff9f55] text-black font-bold text-sm sm:text-base hover:opacity-90 shadow-lg shadow-orange-500/30 w-full sm:w-auto justify-center"
                    >
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      Dive Into Your Content
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                    <Link
                      to="/my-passes"
                      className="inline-flex items-center gap-2 px-6 sm:px-10 py-4 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-sm sm:text-base w-full sm:w-auto justify-center"
                    >
                      Explore All Passes
                    </Link>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage; 