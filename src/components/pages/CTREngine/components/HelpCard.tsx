import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  Lightbulb,
  Target,
  CheckCircle2,
  HelpCircle,
  Brain,
  ScanFace,
  Layers,
  Palette
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
  '/ai-thumbnails/creative': {
    title: 'Creative Studio',
    icon: Palette,
    description:
      'Free-form thumbnail generation for exploration. Use this when you want to iterate visually without strict CTR constraints.',
    features: [
      'Prompt-based creative generation',
      'Fast iteration for style discovery',
      'Export-ready thumbnails',
      'Pairs well with Audit → Optimize flow',
    ],
    tips: [
      'Describe the emotion + focal subject first (e.g. “shocked face + huge red arrow”).',
      'Keep on-image text under 5 words for mobile.',
      'After you like a concept, run an Audit to identify quick CTR upgrades.',
      'Save variants you like, then A/B test on your next uploads.',
    ],
  },
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
  const [isOpen, setIsOpen] = useState(false);

  const helpContent = useMemo(() => {
    const direct = HELP_CONTENT[location.pathname];
    if (direct) return direct;
    const matchingKey = Object.keys(HELP_CONTENT).find((key) =>
      location.pathname.startsWith(key)
    );
    return matchingKey ? HELP_CONTENT[matchingKey] : null;
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    // Close when navigating to a different screen
    setIsOpen(false);
  }, [location.pathname]);

  if (!helpContent) return null;

  const Icon = helpContent.icon;

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-[70]">
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsOpen(true)}
          aria-label="Open help"
          className="relative w-14 h-14 rounded-2xl bg-black/80 border border-gray-800/60 backdrop-blur-xl flex items-center justify-center"
          style={{
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.06),
              0 12px 30px rgba(0,0,0,0.55),
              0 0 28px rgba(250,117,23,0.18)
            `,
          }}
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517]/25 to-orange-400/10 rounded-2xl blur opacity-70" />
          <div className="relative">
            <Icon className="w-6 h-6 text-[#fa7517]" />
          </div>
        </motion.button>
      </div>

      {/* Overlay panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[80]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Click-away backdrop */}
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute bottom-6 right-6 w-[360px] max-w-[calc(100vw-3rem)] rounded-2xl overflow-hidden bg-[#0c0c0e]/90 border border-gray-800/60 backdrop-blur-2xl"
              style={{
                boxShadow: `
                  0 0 0 1px rgba(255,255,255,0.06),
                  0 18px 60px rgba(0,0,0,0.65),
                  0 0 34px rgba(250,117,23,0.12)
                `,
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/60 bg-white/[0.02]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#fa7517]/10 border border-[#fa7517]/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#fa7517]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-gray-500">Helper</p>
                    <h3 className="text-sm font-bold text-white tracking-wide truncate">
                      {helpContent.title}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close help"
                  className="w-9 h-9 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-6 max-h-[70vh] overflow-auto">
                <p className="text-sm text-gray-400 leading-relaxed font-medium">
                  {helpContent.description}
                </p>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-3.5 h-3.5 text-[#fa7517]" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      System Capabilities
                    </h4>
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

                <div className="bg-[#fa7517]/5 rounded-xl p-4 border border-[#fa7517]/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-3.5 h-3.5 text-[#fa7517]" />
                    <h4 className="text-xs font-bold text-[#fa7517] uppercase tracking-wider">
                      Optimization Vector
                    </h4>
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

                <div className="pt-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Tip: press Esc to close</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HelpCard;