import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Flame, Clock, TrendingUp } from 'lucide-react';
import { SearchSortOption } from './types';

interface FilterPanelProps {
  sortBy: SearchSortOption;
  setSortBy: (value: SearchSortOption) => void;
  pageSize: number;
  setPageSize: (value: number) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  sortBy,
  setSortBy,
  pageSize,
  setPageSize,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const sortOptions: { value: SearchSortOption; label: string; icon: React.ReactNode }[] = [
    { value: 'relevance', label: 'Most Relevant', icon: <Flame size={18} /> },
    { value: 'views', label: 'Most Viewed', icon: <TrendingUp size={18} /> },
    { value: 'date', label: 'Most Recent', icon: <Clock size={18} /> },
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
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSortBy(value);
                          setIsOpen(false);
                        }}
                      >
                        {icon}
                        <span>{label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-2">Results per page</h3>
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