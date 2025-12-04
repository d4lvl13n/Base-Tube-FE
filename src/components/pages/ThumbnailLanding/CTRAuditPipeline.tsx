import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Eye, BrainCircuit, Wand2, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: <UploadCloud />,
    title: "Ingestion",
    desc: "Upload image or paste URL.",
    status: "Processing"
  },
  {
    icon: <Eye />,
    title: "Vision Scan",
    desc: "Detects faces, text & contrast.",
    status: "Analyzing"
  },
  {
    icon: <BrainCircuit />,
    title: "Scoring Model",
    desc: "Compares against million+ dataset.",
    status: "Calculating"
  },
  {
    icon: <Wand2 />,
    title: "Generative Fix",
    desc: "AI redraws weak areas instantly.",
    status: "Optimizing"
  }
];

const PipelineStep = ({ icon, step, title, desc, isActive }: any) => (
  <div className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-500 ${
    isActive 
      ? 'bg-black/80 border-[#fa7517]/50 shadow-[0_0_30px_rgba(250,117,23,0.1)]' 
      : 'bg-black/20 border-gray-800/30 opacity-50'
  }`}>
    <div className="flex items-center gap-4 mb-4">
        <motion.div 
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors duration-300 ${
                isActive ? 'bg-[#fa7517] text-black' : 'bg-gray-900 text-gray-500'
            }`}
            animate={isActive ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5 }}
        >
            {icon}
        </motion.div>
        <span className="text-[10px] font-mono font-bold text-[#fa7517] tracking-wider">
            STEP 0{step + 1}
        </span>
    </div>
    
    <h3 className={`text-lg font-bold mb-2 ${isActive ? 'text-white' : 'text-gray-400'}`}>
        {title}
    </h3>
    <p className="text-sm text-gray-500 leading-relaxed">
        {desc}
    </p>

    {/* Active Scan Line */}
    {isActive && (
        <motion.div 
            className="absolute bottom-0 left-0 h-[2px] bg-[#fa7517]"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3, ease: "linear" }}
        />
    )}
  </div>
);

const CTRAuditPipeline: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 bg-[#09090B] relative overflow-hidden">
        {/* Background Stream Line */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-800 hidden md:block" />
        <motion.div 
            className="absolute top-1/2 left-0 h-[2px] w-40 bg-gradient-to-r from-transparent via-[#fa7517] to-transparent blur-sm hidden md:block z-0"
            animate={{ left: ["-10%", "110%"] }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
                 <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900 border border-gray-800 text-xs font-medium text-gray-400 mb-6"
                 >
                    <span className="w-2 h-2 bg-[#fa7517] rounded-full animate-pulse" />
                    LIVE PROCESSING
                 </motion.div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                    From Upload to <span className="text-[#fa7517]">Optimized</span>
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    The audit happens in milliseconds, passing your image through multiple neural networks.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {steps.map((step, i) => (
                    <div key={i} className="relative">
                        <PipelineStep 
                            {...step} 
                            step={i} 
                            isActive={activeStep === i} 
                        />
                        {/* Mobile Connector */}
                        {i < 3 && (
                            <div className="md:hidden flex justify-center py-4 text-gray-700">
                                <ArrowRight className="rotate-90" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    </section>
  );
};

export default CTRAuditPipeline;