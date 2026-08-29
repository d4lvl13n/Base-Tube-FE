import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TabNav from '../../../common/TabNav';
import { useCreatorAnalytics } from '../../../../hooks/useAnalyticsData';
import { ContentPerformanceTab } from './tabs/ContentPerformanceTab';
import { AlertCircle } from 'lucide-react';
import { useChannelSelection } from '../../../../contexts/ChannelSelectionContext';
import ChannelPreviewCard from '../../../common/CreatorHub/ChannelPreviewCard';
import { OverviewTab } from './tabs/OverviewTab';
import { AudienceInsightsTab } from './tabs/AudienceInsightsTab';
import { GrowthTab } from './tabs/GrowthMonetizationTab';
import { EngagementAnalyticsTab } from './tabs/EngagementAnalyticsTab';
import { DetailedVideoPerformanceTab } from './tabs/DetailedVideoPerformanceTab';
import NoChannelView from '../NoChannelView';

const AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const { selectedChannelId, selectedChannel, channels } = useChannelSelection();
  
  const analyticsData = useCreatorAnalytics('7d', selectedChannelId);
  const isError = analyticsData.viewMetrics === undefined && 
                  Object.values(analyticsData.errors).some(err => err !== null);

  if (!selectedChannel || channels.length === 0) {
    return (
      <NoChannelView 
        title="Channel Analytics Dashboard"
        description="Create a channel to access detailed performance metrics, audience insights, and growth statistics."
        buttonText="Create a Channel"
      />
    );
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
      default:
        return null;
    }
  };

  // 'Audience' is intentionally NOT listed: AudienceDemographicsService sums
  // cumulative per-country counters across days, so the geographic split is
  // multiplied by the number of days in the window — those numbers are wrong, not
  // merely sparse. The component is still in the tree and the case is still routed on
  // the backend; re-add it here once the underlying data is fixed. See
  // docs/ANALYTICS_REVIEW_2026-08-29.md (base-be) finding 4.
  //
  // 'AI Insights' is gone as a TAB rather than hidden: Insights v2 is a card group at
  // the top of Overview, next to the numbers it was computed from, which is the only
  // place its coverage strip means anything.
  const tabs = [
    'Overview',
    'Content',
    'Growth',
    'Engagement',
    'Video Performance'
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