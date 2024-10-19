// src/components/common/Profile/NFTsTab.tsx

import React from 'react';
import { UserNFT } from '../../../types/user';

interface NFTsTabProps {
  nfts: UserNFT[];
}

const NFTsTab: React.FC<NFTsTabProps> = ({ nfts }) => {
  return (
    <div>
      {nfts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {nfts.map((nft) => (
            <div key={nft.id} className="bg-gray-800 p-4 rounded-lg">
              <img
                src={nft.image_path}
                alt={nft.name}
                className="w-full h-48 object-cover rounded-md mb-2"
              />
              <h3 className="text-lg font-bold">{nft.name}</h3>
              <p className="text-sm text-gray-400">{nft.description || 'No description provided.'}</p>
              <p className="text-sm mt-2">
                <strong>Rarity:</strong> {nft.rarity}
              </p>
              <p className="text-sm">
                <strong>Token ID:</strong> {nft.tokenId}
              </p>
              <p className="text-sm">
                <strong>Contract Address:</strong>{' '}
                <a
                  href={`https://etherscan.io/address/${nft.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500"
                >
                  {nft.contractAddress}
                </a>
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p>You do not own any NFTs yet.</p>
      )}
    </div>
  );
};

export default NFTsTab;
