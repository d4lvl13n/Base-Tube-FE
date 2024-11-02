// src/components/common/CreatorHub/StatsCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  change: number;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ icon: Icon, title, value, change, className = '' }) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      className={`p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden ${className}`}
      style={{
        boxShadow: `
          0 0 20px 5px rgba(250, 117, 23, 0.1),
          0 0 40px 10px rgba(250, 117, 23, 0.05),
          inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
        `
      }}
    >
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-gray-900/50 rounded-lg w-fit">
            <Icon className="w-5 h-5 text-[#fa7517]" />
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className={`px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-sm
              ${change >= 0 
                ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
          >
            {change >= 0 ? '+' : ''}{change}%
          </motion.div>
        </div>
        
        <div className="mt-4">
          <h3 className="text-sm text-gray-400 font-medium">{title}</h3>
          <p className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mt-1">
            {value}
          </p>
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
  );
};

export default StatsCard;