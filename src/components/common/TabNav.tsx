import React from 'react';
import { motion } from 'framer-motion';

interface TabNavProps {
  tabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabNav: React.FC<TabNavProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="flex flex-wrap gap-4">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`relative px-6 py-2.5 rounded-xl transition-all duration-300 ${
            activeTab === tab
              ? 'text-white bg-orange-500 shadow-lg shadow-orange-500/20'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          {tab}
          {activeTab === tab && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-orange-500 rounded-xl -z-10"
              transition={{ duration: 0.3 }}
            />
          )}
        </button>
      ))}
    </div>
  );
};

export default TabNav;
