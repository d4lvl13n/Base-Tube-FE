import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface IndicatorStep {
  key: string;
  icon: LucideIcon;
  label: string;
}

interface StepIndicatorProps {
  steps: IndicatorStep[];
  activeStep: string;
  onStepClick?: (step: string) => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, activeStep, onStepClick }) => {
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const lineVariants = {
    hidden: { width: 0 },
    visible: { width: '100%', transition: { duration: 1 } }
  };

  return (
    <motion.div
      className="flex justify-center items-center mb-12 mt-8 py-6 px-8 rounded-3xl relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {steps.map(({ key, icon: Icon, label }, index) => (
        <React.Fragment key={key}>
          <motion.div
            className="flex flex-col items-center relative z-10"
            variants={stepVariants}
            onHoverStart={() => setHoveredStep(key)}
            onHoverEnd={() => setHoveredStep(null)}
            onClick={() => onStepClick && onStepClick(key)}
          >
            <motion.div
              className={`p-3 rounded-full cursor-pointer ${
                parseInt(activeStep) >= parseInt(key)
                  ? 'text-[#fa7517]'
                  : 'text-gray-400'
              }`}
              whileHover={{ scale: 1.1, boxShadow: '0 0 25px rgba(250, 117, 23, 0.5)' }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon size={22} />
            </motion.div>
            <AnimatePresence>
              {hoveredStep === key && (
                <motion.div
                  className="absolute top-full mt-2 bg-gray-800 text-white text-xs rounded-md px-2 py-1 z-20"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {label}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          {index < steps.length - 1 && (
            <motion.div 
              className="flex-grow h-0.5 mx-2 bg-gray-600"
              variants={lineVariants}
            >
              <motion.div
                className="h-full bg-[#fa7517]"
                initial={{ width: '0%' }}
                animate={{ width: parseInt(activeStep) > parseInt(key) ? '100%' : '0%' }}
                transition={{ duration: 1 }}
              />
            </motion.div>
          )}
        </React.Fragment>
      ))}
      {/* Commented out background animation
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-[#fa751733] to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ repeat: Infinity, duration: 5, ease: 'linear' }}
      />
      */}
    </motion.div>
  );
};

export default StepIndicator;
