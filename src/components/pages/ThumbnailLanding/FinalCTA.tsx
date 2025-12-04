import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Wand2, Terminal, Cpu, ShieldCheck } from 'lucide-react';

const FinalCTA: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-32 overflow-hidden bg-[#09090B]">
      
      {/* 1. Background Grid (Profondeur) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
            className="w-[150vw] h-[150vh] bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:60px_60px] opacity-[0.05]" 
            style={{ transform: 'perspective(500px) rotateX(60deg) translateY(-200px)' }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-[2rem] bg-[#0c0c0e] border border-white/10 overflow-hidden"
        >
            {/* Top Highlight Line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            {/* Ambient Glow behind content */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#fa7517]/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 px-8 py-20 text-center">
                
                {/* Badge "Beta Access" */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-mono font-medium tracking-wide uppercase"
                >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    Early Access Open
                </motion.div>

                <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 leading-[1]">
                    Ready to dominate <br />
                    <span className="text-gray-500">the feed?</span>
                </h2>

                <p className="text-xl text-gray-400 max-w-xl mx-auto mb-12 leading-relaxed">
                    Join the new wave of creators using data, not luck. 
                    Audit your thumbnail instantly.
                </p>

                {/* THE BUTTONS - Reworked for maximum clickability */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    
                    {/* Primary "Nuclear" Button */}
                    <button
                        onClick={() => navigate('/ai-thumbnails/audit')}
                        className="group relative px-8 py-4 bg-[#fa7517] text-white font-bold text-lg rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset] overflow-hidden transition-all hover:scale-105 active:scale-95"
                    >
                        {/* Glow Effect Layer */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-600 to-orange-400 opacity-100 group-hover:opacity-90 transition-opacity" />
                        
                        {/* Bottom Reflection */}
                        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
                        
                        {/* Content */}
                        <span className="relative flex items-center gap-2 drop-shadow-md">
                            Start Free Audit
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>

                        {/* Outer Glow on Hover */}
                        <div className="absolute -inset-4 bg-orange-500/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </button>

                    {/* Secondary "Glass" Button */}
                    <button
                        onClick={() => navigate('/ai-thumbnails/generate')}
                        className="group px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white font-medium rounded-xl transition-all flex items-center gap-2 backdrop-blur-md"
                    >
                        <Wand2 className="w-5 h-5 text-gray-500 group-hover:text-[#fa7517] transition-colors" />
                        Fix with AI
                    </button>
                </div>

                {/* TECH SPECS FOOTER (Replacement for Social Proof) */}
                <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-mono text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-gray-600" />
                        <span>v1.0.4 Stable</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-gray-600" />
                        <span>GPU Clusters Ready</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-gray-600" />
                        <span>Privacy First</span>
                    </div>
                </div>

            </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;