// src/components/common/TabNav.tsx

import React from 'react';

interface TabNavProps {
  tabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabNav: React.FC<TabNavProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <nav className="flex space-x-2 mb-6 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2 rounded-full focus:outline-none whitespace-nowrap ${
            activeTab === tab
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
};

export default TabNav;