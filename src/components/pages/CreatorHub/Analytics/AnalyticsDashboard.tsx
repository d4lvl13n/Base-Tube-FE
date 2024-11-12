import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TabNav from '../../../common/TabNav';
import { useAnalyticsData } from '../../../../hooks/useAnalyticsData';
import { GrowthTab } from './tabs/GrowthTab';
import { ContentPerformanceTab } from './tabs/ContentPerformanceTab';
import { AudienceEngagementTab } from './tabs/AudienceEngagementTab';
import { AlertCircle } from 'lucide-react';
import { ChannelSelector } from '../../../common/CreatorHub/ChannelSelector';
import { Channel } from '../../../../types/channel';
import { LikesAnalyticsTab } from './tabs/LikesAnalyticsTab';

interface AnalyticsDashboardProps {
  channels: Channel[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ channels }) => {
  const [activeTab, setActiveTab] = useState('Growth');
  const [activeChannelId, setActiveChannelId] = useState<string>(
    channels[0]?.id.toString() || ''
  );
  
  const { isError } = useAnalyticsData('7d', activeChannelId);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Growth':
        return <GrowthTab channelId={activeChannelId} />;
      case 'Performance':
        return <ContentPerformanceTab channelId={activeChannelId} />;
      case 'Engagement':
        return <AudienceEngagementTab channelId={activeChannelId} />;
      case 'Likes':
        return <LikesAnalyticsTab channelId={activeChannelId} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto space-y-8"
    >
      <div className="mb-12">
        <ChannelSelector 
          channels={channels} 
          onChannelChange={(channelId) => setActiveChannelId(channelId)}
        />
      </div>

      {/* Error Banner */}
      {isError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p>Some metrics may be unavailable at the moment</p>
        </div>
      )}

      {/* Navigation Tabs with Creator Hub styling */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden"
        style={{
          boxShadow: `
            0 0 20px 5px rgba(250, 117, 23, 0.1),
            0 0 40px 10px rgba(250, 117, 23, 0.05),
            inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
          `
        }}
      >
        <div className="relative z-10">
          <TabNav
            tabs={['Growth', 'Performance', 'Engagement', 'Likes']}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
              {renderActiveTab()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
        
        <motion.div
          className="absolute inset-0 bg-[#fa7517] opacity-0 blur-2xl transition-opacity duration-300"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 0.03 }}
        />
      </motion.div>
    </motion.div>
  );
};

export default AnalyticsDashboard;