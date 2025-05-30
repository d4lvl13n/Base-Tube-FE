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
      className="flex flex-col md:flex-row justify-center items-center mb-8 md:mb-12 mt-4 md:mt-8 py-4 md:py-6 px-4 md:px-8 rounded-3xl relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Mobile View (Vertical Steps) */}
      <div className="md:hidden w-full">
        {steps.map(({ key, icon: Icon, label }, index) => (
          <div key={key} className="flex items-center mb-4 last:mb-0">
            <motion.div
              className={`p-3 rounded-full cursor-pointer mr-4 ${
                parseInt(activeStep) >= parseInt(key)
                  ? 'text-[#fa7517] bg-[#fa7517]/10'
                  : 'text-gray-400 bg-gray-800/30'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onStepClick && onStepClick(key)}
            >
              <Icon size={20} />
            </motion.div>
            
            <div className="flex-1">
              <span className={`font-medium ${
                parseInt(activeStep) >= parseInt(key)
                  ? 'text-[#fa7517]'
                  : 'text-gray-400'
              }`}>
                {label}
              </span>
              
              {index < steps.length - 1 && (
                <motion.div 
                  className="h-0.5 w-full mt-2 bg-gray-600"
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
            </div>
          </div>
        ))}
      </div>
      
      {/* Desktop View (Horizontal Steps) */}
      <div className="hidden md:flex justify-center items-center w-full">
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
                    ? 'text-[#fa7517] bg-[#fa7517]/10'
                    : 'text-gray-400 bg-gray-800/30'
                }`}
                whileHover={{ scale: 1.1, boxShadow: '0 0 25px rgba(250, 117, 23, 0.5)' }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon size={22} />
              </motion.div>
              
              <div className="text-xs mt-2 text-center">
                <span className={`${
                  parseInt(activeStep) >= parseInt(key)
                    ? 'text-[#fa7517]'
                    : 'text-gray-400'
                }`}>
                  {label}
                </span>
              </div>
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
      </div>
    </motion.div>
  );
};

export default StepIndicator;
