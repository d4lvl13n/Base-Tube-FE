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
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface HelpContent {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  tips: string[];
  features: string[];
}

// What each page really does. No prediction, score target or button that does not exist.
const HELP_CONTENT: Record<string, HelpContent> = {
  '/ai-thumbnails/generate': {
    title: 'Create a thumbnail',
    icon: Brain,
    description:
      'Describe your video, or start from a YouTube link, a script or an image. AI Thumbnails turns it into 1 to 3 thumbnail ideas in your channel’s style.',
    features: [
      'Your face, logo and colours from your channel profile',
      '1 to 3 ideas per click, to upload to YouTube’s Test & Compare',
      'Change any idea in plain words',
      'A review that lists what to fix',
    ],
    tips: [
      'Say the most interesting thing viewers will discover in one sentence: the ideas are built on it.',
      'Keep the text on the thumbnail to four or five words so it reads on a phone.',
      'Set your face, logo and colours once in Settings › Channel style.',
      'Compare the ideas at YouTube size before you keep one.',
    ],
  },
  '/ai-thumbnails/audit': {
    title: 'Thumbnail review',
    icon: ScanFace,
    description:
      'Upload a thumbnail, paste its link or a YouTube video link. You get a score out of 10 and what to change, in plain words. It reviews the image; it does not predict your click rate.',
    features: [
      'A score out of 10',
      'Mobile readability, contrast, composition and brightness',
      'Strengths and what to improve',
      'Optional opinions from AI viewer personas',
    ],
    tips: [
      'Give the real video title: the review checks the image against it.',
      'Fix mobile readability first: most viewers see thumbnails small.',
      'From the result, start a new thumbnail for the same video in one click.',
      'Your real click rate is in YouTube Studio: check it there after you change a thumbnail.',
    ],
  },
  '/ai-thumbnails/history': {
    title: 'Review history',
    icon: Layers,
    description: 'Every thumbnail review you ran, with its score.',
    features: [
      'Your average and best score',
      'Filter by topic',
      'Open any past review',
    ],
    tips: [
      'Reopen a past review to see what it asked you to change.',
      'Review the new version of a thumbnail to compare the two scores.',
    ],
  },
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