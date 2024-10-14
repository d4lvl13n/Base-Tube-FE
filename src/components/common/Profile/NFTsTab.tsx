import React from 'react';
import { motion } from 'framer-motion';
import { UserNFT } from '../../../types/user';

interface NFTsTabProps {
  nfts: UserNFT[];
}

const NFTsTab: React.FC<NFTsTabProps> = ({ nfts }) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      {nfts.map((nft) => (
        <motion.div 
          key={nft.id}
          className="bg-gray-800 rounded-xl overflow-hidden"
          whileHover={{ scale: 1.05 }}
          style={{
            boxShadow: `0 0 10px 2px rgba(250, 117, 23, 0.3), 
                        0 0 30px 5px rgba(250, 117, 23, 0.2), 
                        0 0 50px 10px rgba(250, 117, 23, 0.1)`
          }}
        >
          <img src={nft.imageUrl} alt={nft.name} className="w-full h-40 object-cover" />
          <div className="p-4">
            <h3 className="font-semibold">{nft.name}</h3>
            <p className="text-sm text-gray-300">Rarity: {nft.rarity}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default NFTsTab;