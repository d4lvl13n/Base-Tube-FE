import React from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet as WalletIcon,
  TrendingUp,
  CreditCard,
  History,
  AlertCircle
} from 'lucide-react';
import { useWallet } from '../../../hooks/useWallet';
import ConnectWalletButton from '../WalletWrapper/ConnectWalletButton';
import StatsCard from '../../pages/CreatorHub/StatsCard';
import EmptyState from '../EmptyState';
import Loader from '../Loader';

const WalletTab: React.FC = () => {
  const { wallet, isLoading, error } = useWallet();

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
    </motion.div>
  );
};

export default WalletTab;