// src/components/common/Profile/NFTsTab.tsx

import React from 'react';
import { UserNFT } from '../../../types/user';
import EmptyState from '../EmptyState';
import { motion } from 'framer-motion';
import Error from '../Error';

interface NFTsTabProps {
  nfts: UserNFT[] | null;
  error?: string;
}

const NFTsTab: React.FC<NFTsTabProps> = ({ nfts, error }) => {
  if (error) {
    return <Error message={error} />;
  }

  if (!nfts || !Array.isArray(nfts) || nfts.length === 0) {
    return (
      <EmptyState
        imageSrc="/assets/no-nfts.svg"
        title="No NFTs Owned"
        description="You don't own any NFTs yet."
        buttonText="Explore NFT Marketplace"
        onButtonClick={() => {
          // Navigate to NFT marketplace
        }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {nfts.map((nft) => (
        <motion.div
          key={nft.id}
          className="bg-gray-900 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
          whileHover={{ scale: 1.02 }}
        >
          <img
            src={nft.image_path}
            alt={nft.name}
            className="w-full h-48 object-cover rounded-md mb-4"
          />
          <h3 className="text-lg font-bold mb-2 text-[#fa7517]">{nft.name}</h3>
          <p className="text-sm text-gray-400">
            {nft.description || 'No description provided.'}
          </p>
          <div className="mt-4">
            <p className="text-sm text-gray-300">
              <strong>Rarity:</strong> {nft.rarity}
            </p>
            <p className="text-sm text-gray-300">
              <strong>Token ID:</strong> {nft.tokenId}
            </p>
            <p className="text-sm text-gray-300">
              <strong>Contract Address:</strong>{' '}
              <a
                href={`https://etherscan.io/address/${nft.contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#fa7517] hover:underline"
              >
                {nft.contractAddress}
              </a>
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default NFTsTab;