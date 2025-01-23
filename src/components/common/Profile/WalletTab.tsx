// src/components/common/Profile/WalletTab.tsx

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  CreditCard,
  History
} from 'lucide-react';
import EmptyState from '../EmptyState';
import StatsCard from '../../pages/CreatorHub/StatsCard';
import { UserWallet } from '../../../types/user';
import Loader from '../Loader';

type WalletTabProps = {
  wallet: UserWallet | undefined;
  isLoading?: boolean;
  error?: Error | null;
}

const WalletTab: React.FC<WalletTabProps> = ({ wallet, isLoading, error }) => {
  const { totalReceived, totalSent } = useMemo(() => {
    if (!wallet?.transactions) {
      return { totalReceived: 0, totalSent: 0 };
    }

    return wallet.transactions.reduce((acc, transaction) => {
      if (transaction.type === 'receive') {
        acc.totalReceived += transaction.amount;
      } else if (transaction.type === 'send') {
        acc.totalSent += transaction.amount;
      }
      return acc;
    }, { totalReceived: 0, totalSent: 0 });
  }, [wallet?.transactions]);

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <EmptyState
        title="Error Loading Wallet"
        description={error.message}
        imageSrc="/assets/error.svg"
      />
    );
  }

  if (!wallet) {
    return (
      <EmptyState
        title="No Wallet Found"
        description="Unable to load wallet information"
        imageSrc="/assets/error.svg"
      />
    );
  }

  const transactions = wallet.transactions || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fa7517] to-orange-400 mb-3">
          Wallet Overview
        </h1>
        <p className="text-gray-400 text-lg">Manage your TUBE balance and transactions</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatsCard 
          icon={Wallet}
          title="Current Balance"
          value={`${wallet.balance} TUBE`}
          change={12.5}
        />
        <StatsCard 
          icon={ArrowDownLeft}
          title="Total Received"
          value={`${totalReceived} TUBE`}
          change={8.3}
        />
        <StatsCard 
          icon={ArrowUpRight}
          title="Total Sent"
          value={`${totalSent} TUBE`}
          change={-4.2}
        />
        <StatsCard 
          icon={History}
          title="Transactions"
          value={transactions.length.toString()}
          change={15.7}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction History */}
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-900/50 rounded-lg">
                  <History className="w-5 h-5 text-[#fa7517]" />
                </div>
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                  Recent Transactions
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    whileHover={{ scale: 1.01 }}
                    className="p-4 bg-gray-900/50 rounded-xl border border-gray-800/30 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-gray-800/50 rounded-lg">
                          {transaction.type === 'receive' ? (
                            <ArrowDownLeft className="w-5 h-5 text-green-500" />
                          ) : transaction.type === 'send' ? (
                            <ArrowUpRight className="w-5 h-5 text-red-500" />
                          ) : (
                            <RefreshCw className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </p>
                          <p className="text-sm text-gray-400">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                          {transaction.hash && (
                            <p className="text-xs text-gray-500 font-mono truncate max-w-[200px]">
                              {transaction.hash}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.type === 'receive' 
                            ? 'text-green-500' 
                            : transaction.type === 'send' 
                            ? 'text-red-500' 
                            : 'text-blue-500'
                        }`}>
                          {transaction.type === 'receive' ? '+' : '-'} {transaction.amount} TUBE
                        </p>
                        <p className="text-sm text-gray-400">≈ ${(transaction.amount * 0.1).toFixed(2)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <EmptyState
                  title="No Transactions"
                  description="You haven't made any transactions yet"
                  imageSrc="/assets/empty-transactions.svg"
                />
              )}
            </div>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
          
          <motion.div
            className="absolute inset-0 bg-[#fa7517] opacity-0 blur-2xl transition-opacity duration-300"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 0.03 }}
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden"
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
            
            <div className="space-y-4">
              <button className="w-full p-4 bg-[#fa7517] hover:bg-[#fa7517]/90 text-white rounded-xl font-semibold transition-colors">
                Send TUBE
              </button>
              
              <button className="w-full p-4 bg-gray-900/50 hover:bg-gray-900/70 text-white rounded-xl font-semibold transition-colors border border-gray-800/30">
                Receive TUBE
              </button>
              
              <button className="w-full p-4 bg-gray-900/50 hover:bg-gray-900/70 text-white rounded-xl font-semibold transition-colors border border-gray-800/30">
                Buy TUBE
              </button>
            </div>

            <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
              <p className="text-gray-400 text-sm">Wallet Address</p>
              <p className="text-sm font-mono mt-1 truncate">{wallet.walletAddress}</p>
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
