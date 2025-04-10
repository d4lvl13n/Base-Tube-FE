import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TabNav from '../../../common/TabNav';
import { useCreatorAnalytics } from '../../../../hooks/useAnalyticsData';
import { ContentPerformanceTab } from './tabs/ContentPerformanceTab';
import { AlertCircle, Sparkles, BarChart2, Users, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { useChannelSelection } from '../../../../contexts/ChannelSelectionContext';
import ChannelPreviewCard from '../../../common/CreatorHub/ChannelPreviewCard';
import { OverviewTab } from './tabs/OverviewTab';
import { AudienceInsightsTab } from './tabs/AudienceInsightsTab';
import { GrowthTab } from './tabs/GrowthMonetizationTab';
import { EngagementAnalyticsTab } from './tabs/EngagementAnalyticsTab';
import { DetailedVideoPerformanceTab } from './tabs/DetailedVideoPerformanceTab';
import { AIInsightsTab } from './tabs/AIInsightsTab';

const AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const { selectedChannelId, selectedChannel } = useChannelSelection();
  
  const analyticsData = useCreatorAnalytics('7d', selectedChannelId);
  const isError = analyticsData.viewMetrics === undefined && 
                  Object.values(analyticsData.errors).some(err => err !== null);

  if (!selectedChannel) {
    return null;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Overview':
        return <OverviewTab channelId={selectedChannelId} />;
      case 'Content':
        return <ContentPerformanceTab channelId={selectedChannelId} />;
      case 'Audience':
        return <AudienceInsightsTab channelId={selectedChannelId} />;
      case 'Growth':
        return <GrowthTab channelId={selectedChannelId} />;
      case 'Engagement':
        return <EngagementAnalyticsTab channelId={selectedChannelId} />;
      case 'Video Performance':
        return <DetailedVideoPerformanceTab channelId={selectedChannelId} />;
      case 'AI Insights':
        return <AIInsightsTab channelId={selectedChannelId} />;
      default:
        return null;
    }
  };

  // Define tabs with icons
  const tabs = [
    'Overview',
    'Content',
    'Audience',
    'Growth',
    'Engagement',
    'Video Performance',
    { id: 'AI Insights', label: 'AI Insights', icon: Sparkles }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto space-y-8"
    >
      <div className="mb-12">
        <ChannelPreviewCard channel={selectedChannel} />
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
            tabs={tabs}
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