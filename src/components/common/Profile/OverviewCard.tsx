import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface OverviewCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  variants?: any;
}

const OverviewCard: React.FC<OverviewCardProps> = ({
  title,
  value,
  icon,
  trend,
  variants,
}) => {
  return (
    <motion.div
      variants={variants}
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
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-gray-900/50 rounded-lg">
            <span className="text-[#fa7517]">{icon}</span>
          </div>
          {trend && (
            <div className="flex items-center text-green-500 text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend}
            </div>
          )}
        </div>
        <h3 className="text-gray-400 text-sm">{title}</h3>
        <p className="text-2xl font-bold mt-1">{value}</p>
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
  );
};

export default OverviewCard;