// src/components/common/Profile/WalletTab.tsx

import React from 'react';
import { UserWallet } from '../../../types/user';

interface WalletTabProps {
  wallet: UserWallet | null;
  loading?: boolean;
}

const WalletTab: React.FC<WalletTabProps> = ({ wallet, loading = false }) => {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-800 h-12 rounded mb-4"></div>
        <div className="bg-gray-800 h-48 rounded"></div>
      </div>
    );
  }

  return (
    <div>
      {wallet ? (
        <>
          <div className="bg-gray-800 p-4 rounded-lg mb-4">
            <h3 className="text-xl font-bold mb-2">Wallet Address</h3>
            <p>{wallet.walletAddress}</p>
            <p>
              <strong>Balance:</strong> {wallet.balance} ETH
            </p>
            <p>
              <strong>TUBE Balance:</strong> {wallet.tubeBalance} TUBE
            </p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2">Transaction History</h3>
            {wallet.transactions.length > 0 ? (
              <ul>
                {wallet.transactions.map((tx) => (
                  <li key={tx.id} className="mb-2">
                    <p>
                      <strong>{tx.type}:</strong> {tx.amount} ETH
                    </p>
                    <p>
                      <strong>Date:</strong> {new Date(tx.date).toLocaleString()}
                    </p>
                    <a
                      href={`https://etherscan.io/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500"
                    >
                      View on Etherscan
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No transactions available.</p>
            )}
          </div>
        </>
      ) : (
        <div>
          <p>No wallet connected.</p>
          <button
            className="mt-4 px-4 py-2 bg-[#fa7517] text-black rounded"
            onClick={() => {
              // Function to connect wallet
            }}
          >
            Connect Wallet
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletTab;
