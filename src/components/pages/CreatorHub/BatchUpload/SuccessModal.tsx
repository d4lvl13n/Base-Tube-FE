import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Film, Folders, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadedCount: number;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, uploadedCount }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full h-full flex items-center justify-center"
        >
          {/* Main Content Container */}
          <div className="relative max-w-md w-full mx-4">
            {/* Close Button */}
            <motion.button
              onClick={onClose}
              className="absolute -top-12 right-0 text-gray-400 hover:text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-6 h-6" />
            </motion.button>

            {/* Success Animation */}
            <motion.div
              className="mb-8 relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.8 }}
            >
              {/* Animated Circle */}
              <div className="w-32 h-32 mx-auto relative">
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-[#fa7517]"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [0.8, 1.2, 1], opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Folders className="w-16 h-16 text-[#fa7517]" />
                </motion.div>
              </div>

              {/* Animated Rings */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: [1, 1.5, 1.8],
                    opacity: [0.3, 0.2, 0]
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.3,
                    repeat: Infinity,
                  }}
                >
                  <div className="w-32 h-32 mx-auto rounded-full border border-[#fa7517]" />
                </motion.div>
              ))}
            </motion.div>

            {/* Success Message */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-white mb-2">
                Batch Upload Complete! 🎉
              </h2>
              <p className="text-gray-400">
                Successfully uploaded {uploadedCount} video{uploadedCount !== 1 ? 's' : ''}
              </p>
            </motion.div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <motion.button
                onClick={() => navigate('/creator-hub/videos')}
                className="w-full p-4 rounded-xl bg-[#fa7517] text-black font-medium relative overflow-hidden group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Film className="w-5 h-5" />
                  View My Videos
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-[#ff8c3a] to-[#fa7517]"
                  initial={{ x: '100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ type: "tween" }}
                />
              </motion.button>

              <motion.button
                onClick={onClose}
                className="w-full p-4 rounded-xl bg-gray-800/50 text-white font-medium border border-gray-700/30 backdrop-blur-sm hover:bg-gray-700/50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Upload More
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SuccessModal; 