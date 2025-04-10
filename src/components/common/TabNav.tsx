import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

// Define the shape of a tab with optional icon
interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface TabNavProps {
  tabs: (string | TabItem)[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabNav: React.FC<TabNavProps> = ({ tabs, activeTab, setActiveTab }) => {
  // Helper to determine if the tab is a string or TabItem
  const isTabItem = (tab: string | TabItem): tab is TabItem => {
    return typeof tab !== 'string';
  };

  return (
    <div className="flex flex-wrap gap-4">
      {tabs.map((tab) => {
        // Handle both string tabs and TabItem objects
        const tabId = isTabItem(tab) ? tab.id : tab;
        const tabLabel = isTabItem(tab) ? tab.label : tab;
        const Icon = isTabItem(tab) ? tab.icon : undefined;
        
        return (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            className={`relative px-6 py-2.5 rounded-xl transition-all duration-300 ${
              activeTab === tabId
                ? 'text-white bg-orange-500 shadow-lg shadow-orange-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {Icon && <Icon className="w-4 h-4" />}
              <span>{tabLabel}</span>
            </div>
            {activeTab === tabId && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-orange-500 rounded-xl -z-10"
                transition={{ duration: 0.3 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TabNav;
