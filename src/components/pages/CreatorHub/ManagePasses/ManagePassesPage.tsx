// src/components/pages/CreatorHub/ManagePasses/ManagePassesPage.tsx
import React, { useState } from 'react';
import TabNav from '../../../../components/common/TabNav';
import PassesOverview from './PassesOverview';
import PassesList from './PassesList';
import { BarChart2, PackageOpen } from 'lucide-react';

const ManagePassesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('passes');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'passes', label: 'My Passes', icon: PackageOpen }
  ];

  return (
    <div className="p-6 pt-16 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manage Content Passes</h1>
          <p className="text-gray-400 mt-1">
            View and manage your premium content passes
          </p>
        </div>
      </div>

      <div className="mb-6">
        <TabNav 
          tabs={tabs} 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
      
      <div className="mt-4">
        {activeTab === 'overview' && <PassesOverview />}
        {activeTab === 'passes' && <PassesList />}
      </div>
    </div>
  );
};

export default ManagePassesPage;