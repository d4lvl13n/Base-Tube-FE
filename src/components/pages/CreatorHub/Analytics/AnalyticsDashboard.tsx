import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TabNav from '../../../common/TabNav';
import { useAudienceAvailability, useCreatorAnalytics } from '../../../../hooks/useAnalyticsData';
import { ContentPerformanceTab } from './tabs/ContentPerformanceTab';
import { AlertCircle } from 'lucide-react';
import { useChannelSelection } from '../../../../contexts/ChannelSelectionContext';
import ChannelPreviewCard from '../../../common/CreatorHub/ChannelPreviewCard';
import { OverviewTab } from './tabs/OverviewTab';
import { AudienceInsightsTab } from './tabs/AudienceInsightsTab';
import { GrowthTab } from './tabs/GrowthMonetizationTab';
import { EngagementAnalyticsTab } from './tabs/EngagementAnalyticsTab';
import { DetailedVideoPerformanceTab } from './tabs/DetailedVideoPerformanceTab';
import { AIInsightsTab } from './tabs/AIInsightsTab';
import NoChannelView from '../NoChannelView';
import HowViewsAreCounted from './HowViewsAreCounted';

const BASE_TABS = [
  'Overview',
  'Content',
  'Growth',
  'Engagement',
  'Video Performance',
  'AI Insights'
];

/** `?tab=growth` (any case, "video-performance" for spaces) opens that tab. */
const tabFromQuery = (value: string | null): string | null => {
  if (!value) return null;
  const wanted = value.trim().toLowerCase().replace(/[-_]+/g, ' ');
  return BASE_TABS.find((tab) => tab.toLowerCase() === wanted) ?? null;
};

const AnalyticsDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => tabFromQuery(searchParams.get('tab')) ?? 'Overview');
  const { selectedChannelId, selectedChannel, channels } = useChannelSelection();
  const channelName = selectedChannel?.name;

  // The Audience tab comes back only when the API says since when its numbers
  // are reliable (see useAudienceAvailability). Without that date it stays
  // hidden: the old numbers multiplied each country by the days in the window.
  const { measuredSince: audienceReliableSince } = useAudienceAvailability(selectedChannelId);
  
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

  // 'Audience' is listed ONLY when the API returns `measuredSince`:
  // AudienceDemographicsService used to sum cumulative per-country counters
  // across days, so the geographic split was multiplied by the number of days
  // in the window (docs/ANALYTICS_REVIEW_2026-08-29.md (base-be) finding 4).
  const tabs = audienceReliableSince
    ? [...BASE_TABS.slice(0, 2), 'Audience', ...BASE_TABS.slice(2)]
    : BASE_TABS;
  // A tab that is not offered (Audience without its flag) falls back to Overview.
  const shownTab = tabs.includes(activeTab) ? activeTab : 'Overview';

  const renderActiveTab = () => {
    switch (shownTab) {
      case 'Overview':
        return <OverviewTab channelId={selectedChannelId} channelName={channelName} />;
      case 'Content':
        return <ContentPerformanceTab channelId={selectedChannelId} channelName={channelName} />;
      case 'Audience':
        return <AudienceInsightsTab channelId={selectedChannelId} />;
      case 'Growth':
        return <GrowthTab channelId={selectedChannelId} channelName={channelName} />;
      case 'Engagement':
        return <EngagementAnalyticsTab channelId={selectedChannelId} channelName={channelName} />;
      case 'Video Performance':
        return <DetailedVideoPerformanceTab channelId={selectedChannelId} channelName={channelName} />;
      case 'AI Insights':
        return <AIInsightsTab channelId={selectedChannelId} />;
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
            activeTab={shownTab}
            setActiveTab={setActiveTab}
          />
          <p className="mt-4 text-sm text-gray-400">
            Every number below is for the channel{' '}
            <span className="text-white font-medium">{channelName ?? 'selected above'}</span> only.
          </p>
          <HowViewsAreCounted className="mt-3" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={shownTab}
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