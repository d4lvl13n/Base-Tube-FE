import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wand2, Target, Sparkles, RefreshCw } from 'lucide-react';

// Animated Transformation Card
const TransformationCard = () => {
    return (
        <div className="relative w-full min-h-[420px] lg:min-h-[480px] rounded-2xl border border-gray-800 bg-[#0c0c0e] overflow-hidden shadow-2xl group">
            
            {/* Split View Container */}
            <div className="absolute inset-0 flex">
                
                {/* Layer 1: The "Bad" Original (Background) */}
                <div className="absolute inset-0">
                    <img 
                        src="https://images.unsplash.com/photo-1515516089376-88db1e26e9c0?w=800&q=80" 
                        alt="Original thumbnail"
                        className="w-full h-full object-cover opacity-40 grayscale"
                    />
                     {/* Failure Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                         <div className="bg-black/80 backdrop-blur border border-red-500/30 px-4 py-2 rounded-lg flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-red-400 font-mono text-xs">CTR SCORE: 3.2 (POOR)</span>
          </div>
        </div>
      </div>

                {/* Layer 2: The "Fixed" AI Version (Foreground with mask) */}
            <motion.div
                    className="absolute inset-0 border-l-2 border-[#fa7517] bg-[#0c0c0e] overflow-hidden"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 4, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                >
                     <img 
                        src="https://images.unsplash.com/photo-1515516089376-88db1e26e9c0?w=800&q=80" 
                        alt="Optimized thumbnail"
                        className="absolute inset-0 w-full h-full object-cover" // Need full width absolute to align with background
                        style={{ filter: 'contrast(1.2) saturation(1.2) brightness(1.1)' }} // CSS Simulated enhancement
                    />
                    {/* Generative UI Overlay */}
                    <div className="absolute top-6 right-6">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#fa7517]/20 backdrop-blur border border-[#fa7517]/40 rounded-lg shadow-lg">
                            <Wand2 className="w-3 h-3 text-[#fa7517]" />
                            <span className="text-xs font-bold text-[#fa7517]">AI REMASTERED</span>
                        </div>
                    </div>
                    
                    {/* Floating Success Metrics */}
                    <div className="absolute bottom-6 left-6 right-6">
                        <div className="bg-black/80 backdrop-blur p-4 rounded-xl border border-green-500/30 flex justify-between items-center">
                            <div>
                                <div className="text-[10px] text-gray-400 uppercase tracking-wider">Projected Lift</div>
                                <div className="text-xl font-bold text-white">+142% <span className="text-sm font-normal text-gray-500">Views</span></div>
                            </div>
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                                <Sparkles className="w-6 h-6 text-green-400" />
                          </div>
                          </div>
                        </div>
                      </motion.div>

              </div>

            {/* Scan Line Effect */}
            <motion.div
                className="absolute top-0 bottom-0 w-[2px] bg-[#fa7517] shadow-[0_0_40px_rgba(250,117,23,0.8)] z-20"
                initial={{ left: "0%" }}
                animate={{ left: "100%" }}
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
            >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-[#fa7517] text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg">
                    GENERATING
              </div>
            </motion.div>
        </div>
    );
};

const ThumbnailHero = ({ onSignUpClick }: { onSignUpClick: () => void }) => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center bg-[#09090B] overflow-x-hidden pt-20">
      
      {/* Background Noise */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#fa7517]/10 rounded-full blur-[120px] opacity-40" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        
            {/* Left: Copy */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-2xl"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fa7517]/10 border border-[#fa7517]/20 text-[#fa7517] text-sm font-medium mb-8">
                    <Target className="w-4 h-4" /> Audit & Generate
                </div>
            
                {/* NEW HEADLINE: EMPHASIS ON FIXING */}
                <h1 className="text-5xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6">
                    Don't just audit. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fa7517] to-orange-200">
                    Instantly fix it.
                  </span>
                </h1>
            
                <p className="text-xl text-gray-400 mb-8 max-w-lg leading-relaxed">
                    Identify why your thumbnail fails, then let our <strong>Generative Engine</strong> redraw, brighten, and optimize it for maximum clicks in seconds.
                </p>
            
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* PRIMARY CTA: GENERATE */}
                    <button
                        onClick={() => navigate('/ai-thumbnails/generate')}
                        className="group px-8 py-4 bg-[#fa7517] hover:bg-[#fa7517]/90 text-white font-bold rounded-lg transition-all shadow-[0_0_30px_rgba(250,117,23,0.3)] hover:shadow-[0_0_40px_rgba(250,117,23,0.5)] flex items-center justify-center gap-2"
                    >
                        <Wand2 className="w-4 h-4" />
                        Fix My Thumbnail
                    </button>
                    
                    {/* SECONDARY CTA: AUDIT */}
                    <button
                        onClick={() => navigate('/ai-thumbnails/audit')}
                        className="px-8 py-4 bg-white/5 border border-white/10 text-gray-200 font-medium rounded-lg hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Just Audit
                    </button>
                    </div>

                <div className="mt-10 flex items-center gap-6 text-xs text-gray-500 font-mono uppercase tracking-wider">
                    <span className="flex items-center gap-2"><div className="w-1 h-1 bg-green-500 rounded-full"/> Vision AI</span>
                    <span className="flex items-center gap-2"><div className="w-1 h-1 bg-green-500 rounded-full"/> Generative Fill</span>
                    <span className="flex items-center gap-2"><div className="w-1 h-1 bg-green-500 rounded-full"/> A/B Sim</span>
                  </div>
                </motion.div>

            {/* Right: Visual */}
                <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative w-full max-w-xl lg:max-w-none mx-auto lg:mx-0"
            >
                <TransformationCard />
                
                {/* Floating Elements behind */}
                <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-[#fa7517]/20 via-transparent to-transparent rounded-full blur-3xl opacity-50" />
            </motion.div>

        </div>
      </div>
    </div>
  );
};

export default ThumbnailHero; 