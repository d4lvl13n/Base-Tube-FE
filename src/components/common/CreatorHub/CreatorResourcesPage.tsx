import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Play, 
  Clock, 
  MessageCircle, 
  BarChart3 
} from 'lucide-react';

const AnalyticsSection = ({ 
  icon: Icon, 
  title, 
  description, 
  metrics 
}: { 
  icon: any, 
  title: string, 
  description: string,
  metrics: string[] 
}) => (
  <motion.div 
    whileHover={{ 
      scale: 1.02,
      backgroundColor: 'rgba(250, 117, 23, 0.1)',
    }}
    whileTap={{ scale: 0.98 }}
    className="p-6 rounded-xl bg-gray-900/50 border border-gray-800/30 backdrop-blur-sm
               transition-all duration-300 hover:border-[#fa7517]/30 relative overflow-hidden"
    style={{
      boxShadow: '0 0 20px 5px rgba(250, 117, 23, 0.05)'
    }}
  >
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gray-800/50 rounded-lg">
          <Icon className="w-6 h-6 text-[#fa7517]" />
        </div>
        <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
          {title}
        </h3>
      </div>
      <p className="text-gray-400 mb-4">{description}</p>
      <ul className="space-y-3">
        {metrics.map((metric, index) => (
          <li key={index} className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors">
            <div className="w-1.5 h-1.5 rounded-full bg-[#fa7517]" />
            {metric}
          </li>
        ))}
      </ul>
    </div>
    
    {/* Gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
  </motion.div>
);

const CreatorResourcesPage: React.FC = () => {
  const analyticsCategories = [
    {
      icon: TrendingUp,
      title: "Growth Analytics",
      description: "Track your channel's growth and audience expansion over time",
      metrics: [
        "Subscriber count and growth trends",
        "View count trends",
        "Overall engagement rate",
        "Growth comparison (7-day vs 30-day periods)"
      ]
    },
    {
      icon: Play,
      title: "Content Performance",
      description: "Understand how your videos are performing",
      metrics: [
        "Total watch time and videos watched",
        "Video completion rates",
        "Peak viewing hours",
        "Performance by video length",
        "Recent videos performance tracking"
      ]
    },
    {
      icon: Users,
      title: "Audience Engagement",
      description: "Monitor how viewers interact with your content",
      metrics: [
        "Comment metrics and response rates",
        "Average response time",
        "Engagement rate trends",
        "Peak engagement hours",
        "Community interaction patterns"
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r 
                         from-white via-gray-200 to-[#fa7517]">
            Understanding Your Analytics
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Learn how to leverage your channel analytics to grow your audience, improve content performance, 
            and build stronger engagement with your community.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analyticsCategories.map((category) => (
            <AnalyticsSection key={category.title} {...category} />
          ))}
        </div>

        <motion.div 
          className="mt-12 p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm
                     relative overflow-hidden"
          whileHover={{ scale: 1.01 }}
          style={{
            boxShadow: `
              0 0 20px 5px rgba(250, 117, 23, 0.1),
              0 0 40px 10px rgba(250, 117, 23, 0.05),
              inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
            `
          }}
        >
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent 
                          bg-gradient-to-r from-white to-gray-300">
              Tips for Using Analytics
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-[#fa7517]">Best Practices</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Check your analytics regularly (weekly recommended)</li>
                  <li>• Compare metrics across different time periods</li>
                  <li>• Use insights to plan content strategy</li>
                  <li>• Focus on trends rather than absolute numbers</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3 text-[#fa7517]">Key Actions</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Identify peak engagement times for posting</li>
                  <li>• Monitor which content types perform best</li>
                  <li>• Track community growth and interaction patterns</li>
                  <li>• Adjust strategy based on performance data</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CreatorResourcesPage;