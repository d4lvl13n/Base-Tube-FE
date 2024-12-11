import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { ChannelSortOption } from '../../types/channel';

interface NavigationOption {
  key: ChannelSortOption;
  icon: LucideIcon;
  label: string;
}

interface FloatingNavigationProps {
  options: NavigationOption[];
  activeOption: ChannelSortOption;
  setActiveOption: (option: ChannelSortOption) => void;
}

const FloatingNavigation: React.FC<FloatingNavigationProps> = ({ options, activeOption, setActiveOption }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 rounded-full p-2 backdrop-blur-md ${isVisible ? 'block' : 'hidden'}`}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: isVisible ? 0 : 100, opacity: isVisible ? 1 : 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <div className="flex space-x-4">
        {options.map(({ key, icon: Icon, label }) => (
          <motion.div
            key={key}
            className="relative group"
          >
            <motion.button
              className={`p-3 rounded-full ${activeOption === key ? 'bg-[#fa7517] text-black' : 'bg-black bg-opacity-50 text-white'}`}
              whileHover={{ scale: 1.1 }}
              onClick={(e) => {
                e.preventDefault();
                setActiveOption(key);
              }}
            >
              <Icon size={24} />
            </motion.button>
            <motion.span
              className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              {label}
            </motion.span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default FloatingNavigation;
