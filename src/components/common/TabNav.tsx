import React from 'react';
import { motion } from 'framer-motion';

interface TabNavProps {
  tabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabNav: React.FC<TabNavProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <nav className="flex justify-center items-center space-x-2 my-8">
      {tabs.map((tab) => (
        <TabButton
          key={tab}
          tab={tab}
          isActive={activeTab === tab}
          onClick={() => setActiveTab(tab)}
        />
      ))}
    </nav>
  );
};

interface TabButtonProps {
  tab: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ tab, isActive, onClick }) => {
  return (
    <motion.button
      className={`relative px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 ease-out ${
        isActive ? 'text-black' : 'text-white hover:text-[#fa7517]'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <span className="relative z-10">{tab}</span>
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#fa7517] to-[#ffa726] rounded-full"
          layoutId="activeTabBackground"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.path
          d="M0,50 Q25,45 50,50 Q75,55 100,50 L100,100 L0,100 Z"
          fill={isActive ? 'none' : 'rgba(250, 117, 23, 0.1)'}
          initial={{ d: "M0,50 Q25,50 50,50 Q75,50 100,50 L100,100 L0,100 Z" }}
          animate={{ 
            d: isActive 
              ? "M0,50 Q25,0 50,50 Q75,100 100,50 L100,100 L0,100 Z" 
              : "M0,50 Q25,50 50,50 Q75,50 100,50 L100,100 L0,100 Z" 
          }}
          transition={{ duration: 0.3 }}
        />
      </svg>
    </motion.button>
  );
};

export default TabNav;