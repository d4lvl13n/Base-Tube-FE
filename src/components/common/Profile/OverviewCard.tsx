import React from 'react';
import { motion } from 'framer-motion';

interface OverviewCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

const OverviewCard: React.FC<OverviewCardProps> = ({ title, value, icon }) => (
  <motion.div 
    className="bg-gray-800 rounded-xl p-4 flex items-center"
    whileHover={{ scale: 1.05 }}
    style={{
      boxShadow: `0 0 10px 2px rgba(250, 117, 23, 0.3), 
                  0 0 30px 5px rgba(250, 117, 23, 0.2), 
                  0 0 50px 10px rgba(250, 117, 23, 0.1)`
    }}
  >
    <div className="bg-[#fa7517] rounded-full p-2 mr-4">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </motion.div>
);

export default OverviewCard;