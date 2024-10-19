// src/components/common/TabNav.tsx

import React from 'react';

interface TabNavProps {
  tabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabNav: React.FC<TabNavProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <nav className="flex space-x-4 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2 rounded-full focus:outline-none ${
            activeTab === tab ? 'bg-[#fa7517] text-black' : 'bg-gray-800 text-white'
          }`}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
};

export default TabNav;
