import React from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  Video, 
  ThumbsUp, 
  MessageCircle, 
  Wallet, 
  TrendingUp, 
  BarChart2,
  AlertCircle 
} from 'lucide-react';
import { useUserMetrics } from '../../../hooks/useMetricsData';
import StatsCard from '../../pages/CreatorHub/StatsCard';
import { ExtendedUser, UserWallet } from '../../../types/user';
import Error from '../Error';
import Loader from '../Loader';

type DashboardTabProps = {
  userProfile: ExtendedUser;
  userWallet: UserWallet | undefined;
  errors: { [key: string]: string };
};

const DashboardTab: React.FC<DashboardTabProps> = ({
  userProfile,
  userWallet,
  errors
}) => {
  const { 
    data: metrics, 
    isLoading: isMetricsLoading, 
    error: metricsError 
  } = useUserMetrics();

  // Show error banner if there's an API error
  const showErrorBanner = metricsError || errors.metrics;

  if (!userProfile) {
    return <Error message="No user data available" />;
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'Watched Video':
        return <Video className="w-4 h-4 text-blue-400" />;
      case 'Liked Video':
        return <ThumbsUp className="w-4 h-4 text-red-400" />;
      case 'Commented on Video':
        return <MessageCircle className="w-4 h-4 text-green-400" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Error Banner */}
      {showErrorBanner && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p>Some metrics may be unavailable at the moment</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatsCard 
          icon={Eye} 
          title="Total Views" 
          value={metrics?.totalViews?.toLocaleString() || '0'}
          change={12.5}
          loading={isMetricsLoading}
        />
        <StatsCard 
          icon={Video} 
          title="Videos Watched" 
          value={metrics?.videosWatched.toString() || '0'}
          change={5.2}
          loading={isMetricsLoading}
        />
        <StatsCard 
          icon={ThumbsUp} 
          title="Likes Given" 
          value={metrics?.likesGiven.toString() || '0'}
          change={8.1}
          loading={isMetricsLoading}
        />
        <StatsCard 
          icon={MessageCircle} 
          title="Comments" 
          value={metrics?.commentsCount.toString() || '0'}
          change={15.3}
          loading={isMetricsLoading}
        />
      </div>

      {/* Activity and Wallet Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="lg:col-span-2 p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden"
          style={{
            boxShadow: `
              0 0 20px 5px rgba(250, 117, 23, 0.1),
              0 0 40px 10px rgba(250, 117, 23, 0.05),
              inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
            `
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-900/50 rounded-lg">
                  <BarChart2 className="w-5 h-5 text-[#fa7517]" />
                </div>
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                  Recent Activity
                </h2>
              </div>
            </div>
            
            {isMetricsLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader />
              </div>
            ) : metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {metrics.recentActivity.map((activity, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-gray-900/50 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-900/50 rounded-lg">
                        {getActivityIcon(activity.action)}
                      </div>
                      <div>
                        <p className="text-gray-300">{activity.action}</p>
                        <p className="text-sm text-gray-500">{activity.details}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No recent activity to display
              </div>
            )}
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
          
          <motion.div
            className="absolute inset-0 bg-[#fa7517] opacity-0 blur-2xl transition-opacity duration-300"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 0.03 }}
          />
        </motion.div>

        {/* Wallet Overview */}
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
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-900/50 rounded-lg">
                <Wallet className="w-5 h-5 text-[#fa7517]" />
              </div>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                Wallet Overview
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-900/50 rounded-lg">
                <p className="text-gray-400 text-sm">Balance</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {Number(userWallet?.balance || 0)} TUBE
                  </p>
                  <div className="flex items-center text-green-400 text-sm bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +12.5%
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-900/50 rounded-lg">
                <p className="text-gray-400 text-sm">Recent Transactions</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mt-1">
                  {userWallet?.transactions?.length || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
          
          <motion.div
            className="absolute inset-0 bg-[#fa7517] opacity-0 blur-2xl transition-opacity duration-300"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 0.03 }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardTab;