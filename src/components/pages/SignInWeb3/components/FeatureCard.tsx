import { motion } from 'framer-motion';
import { FeatureCardProps } from '../types';

export const FeatureCard: React.FC<FeatureCardProps> = ({ 
  icon, 
  title, 
  description, 
  className = '' 
}) => (
  <motion.div 
    whileHover={{ scale: 1.05 }}
    className={`p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden h-[160px] ${className}`}
    style={{
      boxShadow: `
        0 0 20px 5px rgba(250, 117, 23, 0.1),
        0 0 40px 10px rgba(250, 117, 23, 0.05),
        inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
      `
    }}
  >
    <div className="relative z-10 flex flex-col h-full">
      <div className="p-2 bg-gray-900/50 rounded-lg w-fit mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="text-xs text-gray-400 mt-2">{description}</p>
    </div>
    
    <div className="absolute inset-0 bg-gradient-to-br from-[#fa751708] to-transparent" />
    
    <motion.div
      className="absolute inset-0 bg-[#fa7517] opacity-0 blur-2xl transition-opacity duration-300"
      initial={{ opacity: 0 }}
      whileHover={{ opacity: 0.03 }}
    />
  </motion.div>
);