import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Clock, Star, Zap } from 'lucide-react';

interface NavItem {
  Icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { Icon: Flame, label: 'Trending' },
  { Icon: Clock, label: 'Recent' },
  { Icon: Star, label: 'Favorites' },
  { Icon: Zap, label: 'Live' },
];

const FloatingNavigation: React.FC = () => {
  return (
    <motion.div 
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 rounded-full p-2 backdrop-blur-md"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <div className="flex space-x-4">
        {navItems.map((item, index) => (
          <FloatingNavItem key={index} {...item} />
        ))}
      </div>
    </motion.div>
  );
};

const FloatingNavItem: React.FC<NavItem> = ({ Icon, label }) => (
  <motion.div 
    className="flex flex-col items-center cursor-pointer group"
    whileHover={{ y: -5 }}
  >
    <motion.div 
      className="bg-[#fa7517] rounded-full p-3 group-hover:bg-opacity-80 transition-all duration-300"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Icon size={24} className="text-black" />
    </motion.div>
    <motion.span 
      className="mt-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      initial={{ y: 10 }}
      animate={{ y: 0 }}
    >
      {label}
    </motion.span>
  </motion.div>
);

export default FloatingNavigation;