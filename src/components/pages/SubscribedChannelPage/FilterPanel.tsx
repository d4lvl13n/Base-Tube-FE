import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Users, Clock, SortAsc, Bell } from 'lucide-react';
import { SortOption } from './types';

interface FilterPanelProps {
  sortBy: SortOption;
  setSortBy: (value: SortOption) => void;
  pageSize: number;
  setPageSize: (value: number) => void;
  showNewContent: boolean;
  setShowNewContent: (value: boolean) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  sortBy,
  setSortBy,
  pageSize,
  setPageSize,
  showNewContent,
  setShowNewContent,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: 'subscribers_count', label: 'Most Popular', icon: <Users size={18} /> },
    { value: 'createdAt', label: 'Recently Added', icon: <Clock size={18} /> },
    { value: 'name', label: 'Alphabetical', icon: <SortAsc size={18} /> },
  ];

  const pageSizeOptions = [12, 24, 48];

  return (
    <div className="relative inline-block">
      <motion.button
        className={`p-3 rounded-full transition-all duration-300 relative
          ${isOpen 
            ? 'bg-[#fa7517] text-black shadow-lg shadow-[#fa7517]/30' 
            : 'bg-black/50 text-white hover:bg-black/70'}`}
        whileHover={{ 
          scale: 1.1,
          boxShadow: '0 0 20px rgba(250, 117, 23, 0.3)'
        }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <motion.div
          animate={isOpen ? { rotate: 180 } : { rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <SlidersHorizontal size={24} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 top-full mt-2 z-50"
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="bg-black/90 rounded-2xl p-4 backdrop-blur-sm w-[280px] 
                          shadow-xl shadow-black/50 border border-white/10">
              <div className="space-y-4">
                <div>
                  <motion.button
                    className={`flex items-center space-x-2 w-full p-2 rounded-lg transition-all
                      ${showNewContent 
                        ? 'bg-[#fa7517] text-black shadow-lg shadow-[#fa7517]/20' 
                        : 'text-white hover:bg-white/10'}`}
                    whileHover={{ 
                      scale: 1.02,
                      backgroundColor: showNewContent ? '#fa9517' : 'rgba(255, 255, 255, 0.15)',
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowNewContent(!showNewContent)}
                  >
                    <Bell size={18} className={showNewContent ? 'animate-bounce' : ''} />
                    <span>Show New Content Only</span>
                  </motion.button>
                </div>

                <div className="h-px bg-white/10" />

                <div>
                  <h3 className="text-white font-semibold mb-2">Sort By</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {sortOptions.map(({ value, label, icon }) => (
                      <motion.button
                        key={value}
                        className={`flex items-center space-x-2 w-full p-2 rounded-lg transition-all
                          ${sortBy === value 
                            ? 'bg-[#fa7517] text-black shadow-lg shadow-[#fa7517]/20' 
                            : 'text-white hover:bg-white/10'}`}
                        whileHover={{ 
                          scale: 1.02,
                          backgroundColor: sortBy === value ? '#fa9517' : 'rgba(255, 255, 255, 0.15)',
                          transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSortBy(value);
                          setIsOpen(false);
                        }}
                      >
                        <span className="inline-block">{icon}</span>
                        <span>{label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-2">Channels per page</h3>
                  <div className="flex gap-2">
                    {pageSizeOptions.map((size) => (
                      <motion.button
                        key={size}
                        className={`flex-1 p-2 rounded-lg transition-all
                          ${pageSize === size 
                            ? 'bg-[#fa7517] text-black shadow-lg shadow-[#fa7517]/20' 
                            : 'text-white hover:bg-white/10'}`}
                        whileHover={{ 
                          scale: 1.02,
                          backgroundColor: pageSize === size ? '#fa9517' : 'rgba(255, 255, 255, 0.15)',
                          transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setPageSize(size);
                          setIsOpen(false);
                        }}
                      >
                        {size}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterPanel; 