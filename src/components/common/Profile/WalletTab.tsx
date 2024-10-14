import React from 'react';
import { motion } from 'framer-motion';
import { UserWallet } from '../../../types/user';
import Button from '../Button';

interface WalletTabProps {
  wallet: UserWallet | null;
}

const WalletTab: React.FC<WalletTabProps> = ({ wallet }) => {
  if (!wallet) return <div>Wallet information not available</div>;

  return (
    <div className="space-y-6">
      <motion.div 
        className="bg-gray-800 rounded-xl p-6"
        whileHover={{ scale: 1.02 }}
        style={{
          boxShadow: `0 0 10px 2px rgba(250, 117, 23, 0.3), 
                      0 0 30px 5px rgba(250, 117, 23, 0.2), 
                      0 0 50px 10px rgba(250, 117, 23, 0.1)`
        }}
      >
        <h2 className="text-2xl font-bold mb-4">$TUBE Balance</h2>
        <p className="text-4xl font-bold text-[#fa7517]">{wallet.tubeBalance} $TUBE</p>
        <div className="mt-4 flex space-x-4">
          <Button onClick={() => {/* Handle send */}}>Send</Button>
          <Button onClick={() => {/* Handle receive */}}>Receive</Button>
          <Button onClick={() => {/* Handle swap */}}>Swap</Button>
        </div>
      </motion.div>
      <motion.div 
        className="bg-gray-800 rounded-xl p-6"
        whileHover={{ scale: 1.02 }}
        style={{
          boxShadow: `0 0 10px 2px rgba(250, 117, 23, 0.3), 
                      0 0 30px 5px rgba(250, 117, 23, 0.2), 
                      0 0 50px 10px rgba(250, 117, 23, 0.1)`
        }}
      >
        <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
        {/* Implement transaction history list here */}
      </motion.div>
    </div>
  );
};

export default WalletTab;