import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet as WalletIcon,
  TrendingUp,
  CreditCard,
  History,
  AlertCircle,
  Coins,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useWallet } from '../../../hooks/useWallet';
import ConnectWalletButton from '../WalletWrapper/ConnectWalletButton';
import StatsCard from '../../pages/CreatorHub/StatsCard';
import EmptyState from '../EmptyState';
import Loader from '../Loader';
import { useAccessList, useClaim, usePurchaseStatus } from '../../../hooks/useOnchainPass';
import type { OnchainAccessData } from '../../../types/onchainPass';
import { formatAmount } from '../../../lib/utils';

const WalletTab: React.FC = () => {
  const { data: wallet, isLoading, error } = useWallet();
  const isOnchainEnabled = process.env.REACT_APP_FEATURE_ONCHAIN_PASSES !== 'false';
  const { data: accessList, isLoading: isAccessLoading } = useAccessList({ enabled: isOnchainEnabled });

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <EmptyState
        title="Error Loading Wallet"
        description={error.message}
        icon={AlertCircle}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatsCard
          icon={WalletIcon}
          title="Balance"
          value={`${Number(wallet?.balance || 0)} TUBE`}
          change={12.5}
          loading={isLoading}
        />
        <StatsCard
          icon={History}
          title="Transactions"
          value={wallet?.transactions?.length?.toString() || '0'}
          change={0}
          loading={isLoading}
        />
        <StatsCard
          icon={TrendingUp}
          title="Daily Volume"
          value="Coming Soon"
          change={0}
          loading={isLoading}
        />
        <StatsCard
          icon={CreditCard}
          title="NFT Passes"
          value="Coming Soon"
          change={0}
          loading={isLoading}
        />
      </div>

      {/* Wallet Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet Details */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="lg:col-span-2 p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden"
          style={{
            boxShadow: `
              0 0 20px 5px rgba(250, 117, 23, 0.1),
              0 0 40px 10px rgba(250, 117, 23, 0.05),
              inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
            `
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-900/50 rounded-lg">
                <WalletIcon className="w-5 h-5 text-[#fa7517]" />
              </div>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                Wallet Details
              </h2>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-900/50 rounded-lg">
                <p className="text-gray-400 text-sm">Wallet Address</p>
                <p className="text-sm font-mono mt-1 truncate">{wallet?.walletAddress}</p>
              </div>

              <div className="p-4 bg-gray-900/50 rounded-lg">
                <p className="text-gray-400 text-sm">Network</p>
                <p className="text-sm mt-1">Base Mainnet</p>
              </div>
            </div>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
          
          <motion.div
            className="absolute inset-0 bg-[#fa7517] opacity-0 blur-2xl transition-opacity duration-300"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 0.03 }}
          />
        </motion.div>

        {/* Quick Actions - significantly increased height */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-visible min-h-[500px]"
          style={{
            boxShadow: `
              0 0 20px 5px rgba(250, 117, 23, 0.1),
              0 0 40px 10px rgba(250, 117, 23, 0.05),
              inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
            `
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-900/50 rounded-lg">
                <CreditCard className="w-5 h-5 text-[#fa7517]" />
              </div>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                Quick Actions
              </h2>
            </div>
            
            <div className="flex justify-center">
              <ConnectWalletButton 
                className="w-full"
                customText="Connect / Switch Wallet"
              />
            </div>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
          
          <motion.div
            className="absolute inset-0 bg-[#fa7517] opacity-0 blur-2xl transition-opacity duration-300"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 0.03 }}
          />
        </motion.div>
      </div>

      {/* Claimable Balances */}
      {isOnchainEnabled && (
        <ClaimableBalances accessItems={accessList?.data || []} loading={isAccessLoading} />
      )}
    </motion.div>
  );
};

export default WalletTab;

// --- Claimable Balances Section ---

const ClaimableBalances: React.FC<{ accessItems: OnchainAccessData[]; loading?: boolean }> = ({ accessItems, loading }) => {
  const claimable = useMemo(() => {
    return (accessItems || []).filter((a) => {
      const raw = (a && typeof a.vaultBalance === 'string') ? a.vaultBalance : '0';
      // Fallback parse without BigInt to avoid TS target issues
      const asNumber = Number(raw);
      if (!Number.isNaN(asNumber)) return asNumber > 0;
      // If non-numeric string, default to not claimable
      return false;
    });
  }, [accessItems]);

  if (loading) {
    return (
      <div className="p-6 rounded-xl bg-black/50 border border-gray-800/30">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="w-4 h-4 text-[#fa7517] animate-spin" />
          <h2 className="text-lg font-semibold">Loading claimable balances…</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-900/40 border border-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!claimable.length) {
    return null;
  }

  return (
    <div className="p-6 rounded-xl bg-black/50 border border-gray-800/30">
      <div className="flex items-center gap-2 mb-2">
        <Coins className="w-5 h-5 text-[#fa7517]" />
        <h2 className="text-lg font-semibold">Claimable Balances</h2>
      </div>
      <p className="text-sm text-gray-400 mb-4">Claim funds from your vault once purchases are minted on-chain.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {claimable.map((a) => (
          <ClaimItem key={a.passId} access={a} />
        ))}
      </div>
    </div>
  );
};

const ClaimItem: React.FC<{ access: OnchainAccessData }> = ({ access }) => {
  const [purchaseId, setPurchaseId] = useState('');
  const { data: statusResponse } = usePurchaseStatus(purchaseId || undefined, { enabled: Boolean(purchaseId), intervalMs: 5000 });
  const claim = useClaim();

  const isMinted = ['pending', 'minting', 'minted', 'claiming', 'claimed', 'completed'].includes(statusResponse?.data?.status || '');
  const canClaim = isMinted && !!purchaseId && !claim.isPending;

  const vaultDisplay = formatAmount(access.vaultBalance || '0', { decimals: 0, minFraction: 0, maxFraction: 0 });

  return (
    <div className="p-4 bg-gray-900/40 border border-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm">
          <div className="font-semibold">Pass ID</div>
          <div className="text-gray-400 font-mono text-xs truncate" title={access.passId}>{access.passId}</div>
        </div>
        {isMinted ? (
          <div className="flex items-center gap-1 text-emerald-400 text-xs">
            <CheckCircle className="w-4 h-4" />
            Minted
          </div>
        ) : (
          <div className="text-xs text-gray-400">Status: {statusResponse?.data?.status || 'unknown'}</div>
        )}
      </div>

      <div className="flex items-center justify-between mb-3 text-sm">
        <div className="text-gray-400">Vault balance</div>
        <div className="font-medium">{vaultDisplay}</div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          placeholder="Enter purchase ID"
          value={purchaseId}
          onChange={(e) => setPurchaseId(e.target.value)}
          className="flex-1 px-3 py-2 bg-black border border-gray-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#fa7517]/40"
        />
        <button
          disabled={!canClaim}
          onClick={() => claim.mutate({ purchaseId })}
          className={`px-3 py-2 rounded-lg text-xs font-semibold ${canClaim ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : 'bg-gray-800 text-gray-400 cursor-not-allowed'}`}
        >
          {claim.isPending ? 'Claiming…' : 'Claim'}
        </button>
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-500">
        <span>source: {access.source}</span>
        <span title={new Date(access.timestamp).toLocaleString()}>updated {Math.max(0, Math.floor((Date.now() - access.timestamp) / 1000))}s ago</span>
      </div>
    </div>
  );
};