import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb,
  Target,
  CheckCircle2,
  ChevronUp,
  Brain,
  ScanFace,
  Layers
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface HelpContent {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  tips: string[];
  features: string[];
}

const HELP_CONTENT: Record<string, HelpContent> = {
  '/ai-thumbnails/generate': {
    title: 'Generation Protocols',
    icon: Brain,
    description: 'Our engine transforms semantic titles into high-CTR visual concepts. For maximum performance, align your input with the specific "Niche Bias" of your channel.',
    features: [
      'Face ID Consistency (Upload in Settings)',
      'Niche-Specific Style Weights',
      'High-Contrast Text Overlay Engine',
      'Multi-Concept A/B Generation'
    ],
    tips: [
      'For vlogs/personal brands, always enable "Face Consistency".',
      'Keep text overlays under 5 words for mobile readability.',
      'Use the "Advanced" tab to force specific concept counts (3+ recommended).',
      'Select a Niche manually if the auto-detect feels generic.'
    ]
  },
  '/ai-thumbnails/audit': {
    title: 'CTR Audit & Forensics',
    icon: ScanFace,
    description: 'A 15-point algorithmic inspection of your thumbnail before deployment. We simulate computer vision attention maps to predict click probability.',
    features: [
      'Computer Vision Saliency Map',
      'Mobile Viewport Emulation',
      'Generative "One-Click Fix" Engine',
      'Persona-based Sentiment Analysis'
    ],
    tips: [
      'Target a Score > 7.5 for "Viral Potential".',
      'Check "Mobile Readability" first (80% of traffic).',
      'If Contrast is low, use the "Fix with AI" button immediately.',
      'Use Persona Feedback to spot subjective biases (e.g., confusing expressions).'
    ]
  },
  '/ai-thumbnails/history': {
    title: 'Performance Logs',
    icon: Layers,
    description: 'Track your visual optimization velocity. Identify which niches and styles are yielding the highest pre-publish scores over time.',
    features: [
      'Longitudinal Score Tracking',
      'Niche Performance Breakdown',
      'Improvement Delta (+%) Analysis',
      'Exportable Audit Data'
    ],
    tips: [
      'Review your "Average Score" trend weekly.',
      'Identify patterns in your top 10% highest-scoring thumbnails.',
      'Re-audit old thumbnails to find optimization opportunities.',
      'Compare "Before/After" scores to validate your design changes.'
    ]
  }
};

const HelpCard: React.FC = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  let helpContent = HELP_CONTENT[location.pathname];
  
  if (!helpContent) {
    const matchingKey = Object.keys(HELP_CONTENT).find(key => 
      location.pathname.startsWith(key)
    );
    if (matchingKey) {
      helpContent = HELP_CONTENT[matchingKey];
    }
  }

  if (!helpContent) return null;

  const Icon = helpContent.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ width: isCollapsed ? 'auto' : 340, opacity: 1, x: 0 }}
      className="flex-shrink-0 h-fit hidden xl:block" // Hidden on smaller screens to save space
    >
      <div className={`sticky top-24 bg-[#0c0c0e]/80 border border-gray-800/50 rounded-2xl backdrop-blur-xl overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-[340px]'}`}
        style={{
          boxShadow: `
            0 0 0 1px rgba(255,255,255,0.05),
            0 4px 20px rgba(0,0,0,0.5)
          `
        }}
      >
        {/* Header */}
        <div 
          className={`flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-between p-5'} border-b border-gray-800/50 bg-white/[0.02] cursor-pointer`}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#fa7517]/10 border border-[#fa7517]/20 flex items-center justify-center">
                <Icon className="w-4 h-4 text-[#fa7517]" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">{helpContent.title}</h3>
            </div>
          )}
          <button
            className={`text-gray-500 hover:text-white transition-colors ${isCollapsed ? 'w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl' : ''}`}
          >
            {isCollapsed ? <Icon className="w-5 h-5 text-[#fa7517]" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Content */}
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <div className="p-5 space-y-6">
                
                {/* Description */}
                <p className="text-sm text-gray-400 leading-relaxed font-medium">
                  {helpContent.description}
                </p>

                {/* System Capabilities (Features) */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-3.5 h-3.5 text-[#fa7517]" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">System Capabilities</h4>
                  </div>
                  <ul className="space-y-2.5">
                    {helpContent.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2.5 text-xs text-gray-300">
                        <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#fa7517]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Optimization Vector (Tips) */}
                <div className="bg-[#fa7517]/5 rounded-xl p-4 border border-[#fa7517]/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-3.5 h-3.5 text-[#fa7517]" />
                    <h4 className="text-xs font-bold text-[#fa7517] uppercase tracking-wider">Optimization Vector</h4>
                  </div>
                  <ul className="space-y-3">
                    {helpContent.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-xs text-gray-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#fa7517]/60 mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default HelpCard;