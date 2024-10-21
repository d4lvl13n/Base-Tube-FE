// src/components/common/Profile/WalletTab.tsx

import React from 'react';
import { UserWallet } from '../../../types/user';
import EmptyState from '../EmptyState';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';

interface WalletTabProps {
  wallet: UserWallet | null;
}

const WalletTab: React.FC<WalletTabProps> = ({ wallet }) => {
  if (!wallet) {
    return (
      <EmptyState
        imageSrc="/assets/no-wallet.svg"
        title="No Wallet Connected"
        description="You haven't connected a wallet yet."
        buttonText="Connect Wallet"
        onButtonClick={() => {
          // Trigger wallet connection
        }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <motion.div
        className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl shadow-lg"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <h3 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#fa7517] to-[#ffa726]">
          Wallet Information
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 mb-1">Address</p>
            <p className="text-lg font-medium">{wallet.walletAddress}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 mb-1">Balance</p>
            <p className="text-3xl font-bold text-[#fa7517]">{wallet.balance} TUBE</p>
          </div>
        </div>
      </motion.div>

      <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
        <h3 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#fa7517] to-[#ffa726]">
          Transaction History
        </h3>
        {wallet.transactions.length > 0 ? (
          <ul className="space-y-4">
            {wallet.transactions.map((tx) => (
              <motion.li
                key={tx.id}
                className="bg-gray-800 p-4 rounded-xl flex items-center justify-between"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center">
                  {tx.type === 'receive' ? (
                    <ArrowDownLeft className="text-green-500 mr-3" size={24} />
                  ) : tx.type === 'send' ? (
                    <ArrowUpRight className="text-red-500 mr-3" size={24} />
                  ) : (
                    <RefreshCw className="text-blue-500 mr-3" size={24} />
                  )}
                  <div>
                    <p className="font-semibold">{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</p>
                    <p className="text-sm text-gray-400">{new Date(tx.date).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.type === 'receive' ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.type === 'receive' ? '+' : '-'}{tx.amount} ETH
                  </p>
                  <p className={`text-sm ${tx.status === 'completed' ? 'text-green-400' : tx.status === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No transactions available.</p>
        )}
      </div>
    </motion.div>
  );
};

export default WalletTab;
