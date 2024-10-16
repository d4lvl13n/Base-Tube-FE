import React from 'react';
import { motion } from 'framer-motion';

interface ChannelTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ChannelTabs: React.FC<ChannelTabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs = ['Videos', 'About', 'Community'];

  return (
    <div className="flex justify-center space-x-4 mb-6">
      {tabs.map((tab) => (
        <motion.button
          key={tab}
          className={`px-4 py-2 rounded-full ${
            activeTab === tab.toLowerCase() ? 'bg-[#fa7517] text-black' : 'bg-gray-800 text-white'
          }`}
          onClick={() => setActiveTab(tab.toLowerCase())}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {tab}
        </motion.button>
      ))}
    </div>
  );
};

export default ChannelTabs;