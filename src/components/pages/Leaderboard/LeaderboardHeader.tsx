import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const LeaderboardHeader: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
      <div className="bg-gradient-to-b from-black via-black/95 to-black/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-[1920px] mx-auto px-4">
          <div className="flex items-center h-16">
            {/* Left Section */}
            <Link to="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <motion.div
                whileHover={{ x: -4 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back to App</span>
              </motion.div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default LeaderboardHeader; 