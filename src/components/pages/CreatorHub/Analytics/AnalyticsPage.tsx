import React from 'react';
import { motion } from 'framer-motion';
import AnalyticsDashboard from './AnalyticsDashboard';
import { useChannelSelection } from '../../../../contexts/ChannelSelectionContext';
import Loader from '../../../common/Loader';

const AnalyticsPage: React.FC = () => {
  const { isLoading } = useChannelSelection();

  if (isLoading) {
    return <Loader />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-8 pt-24"
    >
      <h1 className="mb-8 scroll-mt-24 text-3xl font-semibold text-white">
        Analytics
      </h1>

      <div className="space-y-6">
        <AnalyticsDashboard />
      </div>
    </motion.div>
  );
};

export default AnalyticsPage;