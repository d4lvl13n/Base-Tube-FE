import React from 'react';
import { motion } from 'framer-motion';
import { Video, Info, Users } from 'lucide-react';

interface ChannelTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ChannelTabs: React.FC<ChannelTabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { key: 'videos', label: 'Videos', icon: <Video size={18} /> },
    { key: 'about', label: 'About', icon: <Info size={18} /> },
    { key: 'community', label: 'Community', icon: <Users size={18} /> },
  ];

  return (
    <div className="flex justify-center space-x-2 p-4">
      {tabs.map(({ key, label, icon }) => {
        const isActive = activeTab === key;
        
        return (
          <motion.div key={key} className="relative">
            <motion.button
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200
                ${isActive 
                  ? 'bg-[#fa7517] text-black shadow-lg shadow-[#fa7517]/20' 
                  : 'bg-black/50 text-white hover:bg-black/70'}`}
              whileHover={{ 
                scale: 1.05,
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(key)}
            >
              <motion.span
                animate={isActive ? { rotate: 360 } : { rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="inline-block"
              >
                {icon}
              </motion.span>
              <span className="font-medium">{label}</span>
              
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-lg border-2 border-[#fa7517]"
                  layoutId="activeTab"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </motion.button>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ChannelTabs;