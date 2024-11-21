import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

const FloatingActionButton: React.FC = () => {
  return (
    <motion.div 
      className="fixed bottom-8 right-8 bg-[#fa7517] rounded-full p-4 cursor-pointer"
      whileHover={{ scale: 1.1 }}
      onClick={(e) => {
        e.stopPropagation();
        // Handle action button click
      }}
    >
      <Plus size={24} className="text-black" />
    </motion.div>
  );
};

export default FloatingActionButton;