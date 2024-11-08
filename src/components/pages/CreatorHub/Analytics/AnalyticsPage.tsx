import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import AnalyticsDashboard from './AnalyticsDashboard';
import Loader from '../../../common/Loader';
import Error from '../../../common/Error';
import { getMyChannels } from '../../../../api/channel';

const AnalyticsPage: React.FC = () => {
  const {
    data: channels = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['myChannels'],
    queryFn: () => getMyChannels(1, 10, 'createdAt'),
    staleTime: 5 * 60 * 1000
  });

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return <Error message={error.message} />;
  }

  if (!channels || channels.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        <p>No channels available. Please connect a channel to view analytics.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 max-w-7xl mx-auto"
    >
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fa7517] to-orange-400 mb-6">
        Analytics Dashboard
      </h1>

      <div className="space-y-6">
        <AnalyticsDashboard channels={channels} />
      </div>
    </motion.div>
  );
};

export default AnalyticsPage;