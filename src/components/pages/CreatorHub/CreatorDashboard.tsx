// src/components/common/CreatorHub/CreatorDashboard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import StatsCard from './StatsCard';
import { Users, Play, Clock, MessageSquare, BarChart2, Upload, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Channel } from '../../../types/channel';

interface CreatorDashboardProps {
  channels: Channel[];
  userProfile: any;
  clerkUser: any;
}

const CreatorDashboard: React.FC<CreatorDashboardProps> = ({ channels, userProfile, clerkUser }) => {
  const navigate = useNavigate();
  const username = userProfile?.username || clerkUser?.username || 'Creator';

  // Stats calculations remain the same
  const totalSubscribers = channels.reduce((acc, channel) => acc + channel.subscribers_count, 0) || 2451;
  const totalViews = channels.reduce((acc, channel) => acc + channel.views, 0) || 12300;
  const watchTime = channels.reduce((acc, channel) => acc + channel.watchTime, 0) || 845;
  const comments = channels.reduce((acc, channel) => acc + channel.comments, 0) || 231;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 max-w-7xl mx-auto"
    >
      <div className="mb-12">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fa7517] to-orange-400 mb-3">
          Welcome back, {username}!
        </h1>
        <p className="text-gray-400 text-lg">Here's how your content is performing</p>
      </div>

      {/* Stats Grid with more spacing for the enhanced cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatsCard 
          icon={Users} 
          title="Total Subscribers" 
          value={totalSubscribers.toLocaleString()} 
          change={5.2}
        />
        <StatsCard 
          icon={Play} 
          title="Total Views" 
          value={totalViews.toLocaleString()} 
          change={-2.1}
        />
        <StatsCard 
          icon={Clock} 
          title="Watch Time (hrs)" 
          value={watchTime.toLocaleString()} 
          change={3.7}
        />
        <StatsCard 
          icon={MessageSquare} 
          title="Comments" 
          value={comments.toLocaleString()} 
          change={12.4}
        />
      </div>

      {/* Performance and Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Performance */}
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
                  Recent Performance
                </h2>
              </div>
            </div>
            <div className="h-[300px] bg-gray-900/50 rounded-xl flex items-center justify-center backdrop-blur-sm border border-gray-800/30">
              <BarChart2 className="w-16 h-16 text-[#fa7517]/20" />
            </div>
          </div>
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
          
          {/* Subtle glow effect on hover */}
          <motion.div
            className="absolute inset-0 bg-[#fa7517] opacity-0 blur-2xl transition-opacity duration-300"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 0.03 }}
          />
        </motion.div>

        {/* Quick Actions */}
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
                <Settings className="w-5 h-5 text-[#fa7517]" />
              </div>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                Quick Actions
              </h2>
            </div>
            
            <div className="space-y-3">
              <motion.button
                onClick={() => navigate('/creator-hub/upload')}
                className="w-full p-4 bg-gradient-to-r from-[#fa7517] to-[#ff9a5a] text-black rounded-xl 
                  hover:from-[#ff8c3a] hover:to-[#ffad7d] transition-all flex items-center justify-center 
                  font-medium shadow-lg shadow-orange-500/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Video
              </motion.button>
              <motion.button
                onClick={() => navigate('/creator-hub/channel-settings')}
                className="w-full p-4 bg-gray-900/50 text-white rounded-xl border border-gray-800/30 
                  hover:bg-gray-800/50 transition-all flex items-center justify-center font-medium 
                  backdrop-blur-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Settings className="w-5 h-5 mr-2" />
                Channel Settings
              </motion.button>
            </div>
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
          
          {/* Subtle glow effect on hover */}
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

export default CreatorDashboard;