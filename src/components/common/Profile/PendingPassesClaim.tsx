import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { usePendingPurchases, useMintPending } from '../../../hooks/useOnchainPass';
import {
  Gift,
  Wallet,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';
import type { PendingPurchase, MintResult } from '../../../types/onchainPass';

interface MintResultsModalProps {
  results: MintResult[];
  onClose: () => void;
}

const MintResultsModal: React.FC<MintResultsModalProps> = ({ results, onClose }) => {
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');
  const alreadyMinted = results.filter(r => r.status === 'already_minted');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Mint Results</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          {successful.length > 0 && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">{successful.length} Successfully Minted</span>
              </div>
              <p className="text-sm text-green-300/80">
                Your passes are now NFTs in your wallet!
              </p>
            </div>
          )}

          {alreadyMinted.length > 0 && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">{alreadyMinted.length} Already Minted</span>
              </div>
              <p className="text-sm text-blue-300/80">
                These passes were already in your wallet.
              </p>
            </div>
          )}

          {failed.length > 0 && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">{failed.length} Failed</span>
              </div>
              <p className="text-sm text-red-300/80">
                Some passes failed to mint. Please try again later.
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-[#fa7517] hover:bg-[#fa8527] text-black font-bold rounded-xl transition-colors"
        >
          Done
        </button>
      </motion.div>
    </motion.div>
  );
};

const PendingPassCard: React.FC<{ purchase: PendingPurchase }> = ({ purchase }) => {
  const tierColors: Record<string, string> = {
    bronze: 'from-amber-500 to-amber-700',
    silver: 'from-slate-300 to-slate-500',
    gold: 'from-yellow-300 to-yellow-600',
    platinum: 'from-sky-300 to-sky-600',
  };

  const tierColor = tierColors[purchase.pass.tier.toLowerCase()] || 'from-purple-400 to-purple-600';

  return (
    <div className="flex items-center gap-4 p-3 bg-black/50 rounded-lg border border-gray-800/50">
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#fa7517]/20 to-orange-600/20 flex items-center justify-center">
        <Gift className="w-6 h-6 text-[#fa7517]" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-white truncate">{purchase.pass.title}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${tierColor} text-white font-medium`}>
            {purchase.pass.tier}
          </span>
          <span className="text-xs text-gray-500">
            Purchased {new Date(purchase.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

const PendingPassesClaim: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { data: pendingData, isLoading: isPendingLoading, refetch } = usePendingPurchases();
  const { mutate: mintPending, isPending: isMinting } = useMintPending();

  const [mintResults, setMintResults] = useState<MintResult[] | null>(null);
  const [showResults, setShowResults] = useState(false);

  const pendingPurchases = pendingData?.data?.purchases || [];
  const hasPending = pendingPurchases.length > 0;

  // Refetch pending purchases when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      refetch();
    }
  }, [isConnected, address, refetch]);

  const handleMint = () => {
    if (!address) return;

    mintPending({ walletAddress: address }, {
      onSuccess: (data) => {
        const results = data?.data?.minted || [];
        setMintResults(results);
        setShowResults(true);
      },
      onError: (error) => {
        console.error('Mint failed:', error);
        // Show error toast or handle error
      }
    });
  };

  // Don't show if no pending purchases
  if (!hasPending && !isPendingLoading) {
    return null;
  }

  // Loading state
  if (isPendingLoading) {
    return (
      <div className="p-4 bg-gray-900/50 border border-gray-800/30 rounded-xl animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
        <div className="h-16 bg-gray-800 rounded"></div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 relative overflow-hidden rounded-xl border border-[#fa7517]/30 bg-gradient-to-br from-[#fa7517]/10 via-black to-black"
      >
        {/* Animated background glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#fa7517]/5 to-orange-500/5"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        <div className="relative z-10 p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#fa7517]/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#fa7517]" />
            </div>
            <div>
              <h3 className="font-bold text-white">
                {pendingPurchases.length} Pass{pendingPurchases.length !== 1 ? 'es' : ''} Ready to Claim
              </h3>
              <p className="text-sm text-gray-400">
                Mint your purchases to your wallet as NFTs
              </p>
            </div>
          </div>

          {/* Pending passes list */}
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {pendingPurchases.map((purchase) => (
              <PendingPassCard key={purchase.id} purchase={purchase} />
            ))}
          </div>

          {/* Action button */}
          {isConnected ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleMint}
              disabled={isMinting}
              className="w-full py-3 bg-gradient-to-r from-[#fa7517] to-orange-600 hover:from-[#fa8527] hover:to-orange-500 text-black font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isMinting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Minting to Wallet...
                </>
              ) : (
                <>
                  <Gift className="w-5 h-5" />
                  Claim All to Wallet
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openConnectModal}
              className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Wallet className="w-5 h-5" />
              Connect Wallet to Claim
            </motion.button>
          )}

          {/* Info text */}
          <p className="text-xs text-gray-500 text-center mt-3">
            Your passes will be minted as NFTs on Base. You can trade or transfer them anytime.
          </p>
        </div>
      </motion.div>

      {/* Results modal */}
      <AnimatePresence>
        {showResults && mintResults && (
          <MintResultsModal
            results={mintResults}
            onClose={() => {
              setShowResults(false);
              setMintResults(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default PendingPassesClaim;
