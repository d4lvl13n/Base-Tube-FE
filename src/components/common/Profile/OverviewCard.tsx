import React from 'react';
import { motion } from 'framer-motion';

interface OverviewCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variants: any;
}

const OverviewCard: React.FC<OverviewCardProps> = ({ title, value, icon, variants }) => (
  <motion.div
    className="bg-gray-800 rounded-xl p-6 flex items-center hover:shadow-lg transition-shadow duration-300"
    variants={variants}
    whileHover={{ scale: 1.05 }}
  >
    <div className="bg-gray-700 rounded-full p-4 mr-4">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-semibold text-gray-300">{title}</h3>
      <p className="text-2xl font-bold bg-gradient-to-r from-[#fa7517] to-[#ff9a5a] text-transparent bg-clip-text">{value}</p>
    </div>
  </motion.div>
);

export default OverviewCard;