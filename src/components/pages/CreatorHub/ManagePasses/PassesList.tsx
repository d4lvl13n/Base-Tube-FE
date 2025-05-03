// src/components/pages/CreatorHub/ManagePasses/PassesList.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCreatorPasses } from '../../../../hooks/usePass';
import { Crown, Plus } from 'lucide-react';
import CreatorPassCard from './CreatorPassCard';

const PassesList: React.FC = () => {
  const { data: passes, isLoading, error } = useCreatorPasses();

  if (isLoading) {
    return (
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-800/30 rounded-xl h-80 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
        <p className="text-red-400">Failed to load your passes. Please try again.</p>
        <button className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
          Retry
        </button>
      </div>
    );
  }

  if (!passes?.length) {
    return (
      <div className="mt-8 p-8 border border-gray-800/30 rounded-xl bg-black/30 flex flex-col items-center justify-center text-center">
        <Crown className="w-12 h-12 text-gray-500 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Content Passes Yet</h3>
        <p className="text-gray-400 max-w-md mb-6">
          You haven't created any content passes yet. Start monetizing your content by creating your first pass!
        </p>
        <Link to="/creator-hub/monetization">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-gradient-to-r from-[#FFD700] to-[#fa7517] rounded-lg text-black font-bold flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Content Pass
          </motion.button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {passes.map(pass => (
          <CreatorPassCard key={pass.id} pass={pass} />
        ))}
      </div>
    </div>
  );
};

export default PassesList;