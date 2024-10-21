import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    await onConfirm();
    setIsConfirming(false);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 7000); // Increased from 3000 to 7000 milliseconds (7 seconds)
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {!isSuccess ? (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-black rounded-2xl p-8 w-full max-w-md relative overflow-hidden border-2 border-[#fa7517]"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                style={{
                  boxShadow: '0 0 20px rgba(250, 117, 23, 0.5), 0 0 60px rgba(250, 117, 23, 0.3)',
                }}
              >
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-[#fa7517] hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
                <h2 className="text-3xl font-bold mb-6 text-[#fa7517]">{title}</h2>
                <p className="text-white mb-8 text-lg">{message}</p>
                <div className="flex justify-end space-x-4">
                  <motion.button
                    onClick={onClose}
                    className="px-6 py-3 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isConfirming}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleConfirm}
                    className="px-6 py-3 rounded-full bg-[#fa7517] text-black hover:bg-[#ff8c3a] transition-colors"
                    whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(250, 117, 23, 0.8)' }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isConfirming}
                  >
                    {isConfirming ? 'Creating...' : 'Confirm'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <SuccessAnimation />
          )}
        </>
      )}
    </AnimatePresence>
  );
};

const SuccessAnimation: React.FC = () => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-full h-full"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        {/* Central play button morphing into a channel icon */}
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 1.5, times: [0, 0.6, 1] }}
        >
          <motion.div
            className="w-32 h-32 bg-[#fa7517] rounded-full flex items-center justify-center"
            animate={{
              borderRadius: ["50%", "15%"],
            }}
            transition={{ duration: 1, delay: 1 }}
          >
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-16 h-16 text-black"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </motion.svg>
          </motion.div>
        </motion.div>

        {/* Animated text */}
        <motion.div
          className="absolute top-2/3 left-1/2 transform -translate-x-1/2 text-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <motion.h2
            className="text-5xl font-bold text-[#fa7517] mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7, duration: 0.5 }}
          >
            Channel Created!
          </motion.h2>
          <motion.p
            className="text-white text-2xl mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.9, duration: 0.5 }}
          >
            Your journey as a creator begins now!
          </motion.p>
        </motion.div>

        {/* Animated particles */}
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-[#fa7517] rounded-full"
            initial={{
              x: "50%",
              y: "50%",
              opacity: 0,
            }}
            animate={{
              x: `${Math.random() * 100}%`,
              y: `${Math.random() * 100}%`,
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              delay: 2 + Math.random() * 0.5,
              repeat: Infinity,
              repeatType: "loop",
            }}
          />
        ))}

        {/* Pulsating ring */}
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-[#fa7517] rounded-full"
          initial={{ scale: 0, opacity: 1 }}
          animate={{
            scale: [0, 1.5, 2],
            opacity: [1, 0.5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "loop",
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export default ConfirmationModal;
