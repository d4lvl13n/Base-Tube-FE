import React from 'react';
import { motion } from 'framer-motion';
import { 
  ScanFace, 
  Wand2,
  TrendingUp, 
  Zap,
  Smartphone,
  Sparkles
} from 'lucide-react';

// --- VISUAL COMPONENTS (SCALED UP FOR READABILITY) ---

// 1. VISION ENGINE
const VisionVisual = () => (
  <div className="relative w-full h-full bg-[#050505] overflow-hidden flex items-center justify-center">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#fa751708_1px,transparent_1px),linear-gradient(to_bottom,#fa751708_1px,transparent_1px)] bg-[size:30px_30px]" />
    
    <div className="relative w-48 h-32 bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden shadow-2xl">
        <div className="absolute right-3 top-3 w-16 h-16 bg-gray-600/50 rounded-full" /> 
        <div className="absolute left-3 bottom-3 w-24 h-6 bg-gray-600/50 rounded" />
    </div>

    {/* Bounding Box - Bigger */}
    <motion.div 
        className="absolute w-20 h-20 border-2 border-[#fa7517] rounded-lg shadow-[0_0_20px_rgba(250,117,23,0.4)]"
        style={{ top: '35%', right: '35%' }}
        animate={{ scale: [1.05, 1, 1.05], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity }}
    >
        <div className="absolute -top-6 left-0 bg-[#fa7517] text-black text-[10px] font-bold px-2 py-0.5 rounded">EMOTION: JOY</div>
    </motion.div>

    <motion.div 
        className="absolute w-32 h-8 border border-blue-500/80 rounded"
        style={{ bottom: '38%', left: '30%' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
    >
         <div className="absolute -bottom-5 left-0 text-blue-400 text-[10px] font-mono font-bold">READABILITY: 98%</div>
    </motion.div>
  </div>
);

// 2. PREDICTIVE GRAPH (CTR - THE HERO)
const PredictionVisual = () => (
    <div className="w-full h-full p-8 flex items-end relative overflow-hidden bg-gradient-to-b from-gray-900/0 to-[#fa7517]/5">
        {/* Graph Lines */}
        <svg className="w-full h-40 overflow-visible">
            <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fa7517" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#fa7517" stopOpacity="0" />
                </linearGradient>
            </defs>
            
            {/* Area */}
            <motion.path 
                 d="M0,120 Q150,100 300,60 T600,20 L600,150 L0,150 Z" 
                 fill="url(#areaGradient)"
                 initial={{ opacity: 0 }}
                 whileInView={{ opacity: 1 }}
                 transition={{ duration: 1 }}
            />

            {/* Baseline */}
            <path d="M0,120 Q150,110 300,115 T600,120" fill="none" stroke="#333" strokeWidth="2" strokeDasharray="6 6" />
            
            {/* Winning Line */}
            <motion.path 
                d="M0,120 Q150,100 300,60 T600,20" 
                fill="none" 
                stroke="#fa7517" 
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
            />
            
            {/* Floating Score Tag - Much Bigger */}
            <motion.g initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.5 }}>
                 <circle cx="600" cy="20" r="6" fill="white" stroke="#fa7517" strokeWidth="3" />
                 <foreignObject x="480" y="-40" width="140" height="50">
                     <div className="bg-[#fa7517] text-black text-sm font-bold px-3 py-1.5 rounded-lg shadow-xl text-center transform hover:scale-110 transition-transform">
                        🚀 8.4% CTR
                     </div>
                 </foreignObject>
            </motion.g>
        </svg>
    </div>
);

// 3. GENERATIVE REMASTER VISUAL
const GenerativeVisual = () => (
    <div className="w-full h-full p-6 flex flex-col justify-between bg-black/20 relative overflow-hidden">
        {/* Abstract Image Rep */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#fa7517]/20 to-transparent rounded-bl-full blur-xl" />
        
        <div className="space-y-3 relative z-10">
            {/* The "Prompt" Simulation */}
            <div className="bg-black/80 border border-gray-700 rounded-lg p-3 font-mono text-[10px] text-gray-400">
                <span className="text-[#fa7517]">$ fix_thumbnail</span> --boost-contrast --enhance-face
            </div>
            
            {/* Steps */}
            <div className="space-y-2">
                <motion.div 
                    className="flex items-center gap-2 text-[10px] text-gray-300"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Correcting exposure...
                </motion.div>
                <motion.div 
                    className="flex items-center gap-2 text-[10px] text-gray-300"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Upscaling facial features...
                </motion.div>
            </div>
        </div>

        {/* Success Badge */}
        <motion.div 
            className="self-end bg-[#fa7517] text-black text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ type: "spring", delay: 1.2 }}
        >
            <Sparkles className="w-3 h-3" /> GENERATED
        </motion.div>
    </div>
);

// 4. MOBILE SIMULATOR
const MobileVisual = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#050505]">
        <div className="w-32 h-56 border-[3px] border-gray-700 rounded-2xl bg-black p-2 flex flex-col gap-3 relative shadow-2xl">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-4 bg-gray-800 rounded-b-lg" />
            
            {/* Simulated Feed */}
            <motion.div 
                className="w-full aspect-video bg-gray-800 rounded-md border-2 border-[#fa7517]"
                animate={{ borderColor: ['#333', '#fa7517', '#333'] }}
                transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="w-3/4 h-2.5 bg-gray-800 rounded" />
            <div className="w-1/2 h-2.5 bg-gray-800 rounded" />
            
            <motion.div 
                className="absolute -right-6 top-12 bg-green-500 text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg"
                initial={{ x: 10, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                READABLE
            </motion.div>
        </div>
    </div>
);


const BentoCard: React.FC<any> = ({ title, description, icon, children, className, tag, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, delay }}
    className={`group relative overflow-hidden rounded-[2rem] border border-gray-800 bg-[#0c0c0e] hover:border-[#fa7517]/40 transition-all duration-500 flex flex-col ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-[#fa7517]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    
    <div className="relative z-10 p-8 flex flex-col h-full pointer-events-none">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-black border border-gray-800 text-[#fa7517] shadow-lg group-hover:scale-110 transition-transform duration-500">
                {React.cloneElement(icon, { size: 24 })}
            </div>
            {tag && (
                <div className="px-3 py-1 rounded-full bg-[#fa7517]/10 border border-[#fa7517]/20 text-[11px] font-mono font-bold text-[#fa7517] flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fa7517] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#fa7517]"></span>
                    </span>
                    {tag}
                </div>
            )}
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-base text-gray-400 leading-relaxed max-w-[90%]">{description}</p>
      
      {/* Visual Container - Expanded Height */}
      <div className="relative flex-grow mt-8 min-h-[200px] rounded-t-2xl overflow-hidden border-t border-l border-r border-gray-800/50 bg-black/40 backdrop-blur-sm shadow-inner">
         {children}
      </div>
    </div>
  </motion.div>
);


const ThumbnailFeatures: React.FC = () => {
  return (
    <section id="features" className="py-32 bg-[#09090B] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <div className="mb-20 max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fa7517]/10 border border-[#fa7517]/20 text-xs font-medium text-[#fa7517] mb-6"
          >
            <Zap className="w-3 h-3" /> VISUAL & GENERATIVE ENGINE
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
            Audit the flaws. <br />
            <span className="text-gray-600">Generate the fix.</span>
          </h2>
          <p className="text-xl text-gray-400">
            Our loop is simple: we identify why your thumbnail is failing, then use Generative AI to rebuild it for higher CTR.
          </p>
        </div>

        {/* BENTO GRID - NEW LAYOUT */}
        {/* Row 1: CTR (Large) + Mobile (Tall) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[420px]">
          
          {/* Card 1: Prediction (THE HERO CARD) */}
          <BentoCard 
            className="md:col-span-2"
            title="CTR Forecasting"
            description="Stop guessing. Get a predicted Click-Through Rate score based on millions of historical data points."
            icon={<TrendingUp />}
            tag="AI MODEL v2.0"
            delay={0.1}
          >
            <PredictionVisual />
          </BentoCard>

          {/* Card 2: Mobile First (Tall) */}
          <BentoCard 
            className="md:col-span-1 md:row-span-2"
            title="Mobile Emulation"
            description="80% of views are mobile. We simulate small screens to ensure your text pops even at 100px width."
            icon={<Smartphone />}
            delay={0.2}
          >
             <MobileVisual />
          </BentoCard>

          {/* Card 3: Vision Engine */}
          <BentoCard 
            className="md:col-span-1"
            title="Computer Vision Audit"
            description="Scans for facial prominence, emotion, and text legibility like a human eye."
            icon={<ScanFace />}
            delay={0.3}
          >
            <VisionVisual />
          </BentoCard>

          {/* Card 4: Generative Remaster */}
          <BentoCard 
            className="md:col-span-1"
            title="Generative Remaster"
            description="One-click fix. Our AI redraws lighting, boosts contrast, and fixes composition instantly."
            icon={<Wand2 />}
            delay={0.4}
            tag="GEN AI"
          >
            <GenerativeVisual />
          </BentoCard>

        </div>
      </div>
    </section>
  );
};

export default ThumbnailFeatures;