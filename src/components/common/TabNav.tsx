import React from 'react';
import { motion } from 'framer-motion';

interface TabNavProps {
  tabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabNav: React.FC<TabNavProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <nav className="flex space-x-2 mb-6 overflow-x-auto">
      {tabs.map((tab) => (
        <motion.button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
            activeTab === tab
              ? 'bg-gradient-to-r from-[#fa7517] to-[#ff9a5a] text-black'
              : 'bg-gray-800 text-white hover:bg-gray-700'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {tab}
        </motion.button>
      ))}
    </nav>
  );
};

export default TabNav;
