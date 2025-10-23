import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useDescriptionDock } from '../../../../contexts/DescriptionDockContext';
import { usePlayback } from '../../../../contexts/PlaybackContext';
import RichTextDisplay from '../../RichTextDisplay';

const DescriptionDock: React.FC = () => {
  const { isOpen, video, close } = useDescriptionDock();
  const playback = usePlayback();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          className="w-full flex justify-center px-4"
          onAnimationComplete={() => {
            // scroll into view after the dock appears
            try {
              const el = document.getElementById('bt-description-dock');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch {}
          }}
        >
          <div id="bt-description-dock" className="w-full max-w-[1280px] bg-black/90 border border-gray-800/50 rounded-xl shadow-2xl backdrop-blur-md mt-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/50">
              <div className="text-sm uppercase tracking-wider text-gray-400">Description</div>
              <button onClick={close} className="p-2 rounded hover:bg-gray-800/60" aria-label="Close description">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-6">
              <h1 className="text-xl font-semibold mb-3">{video?.title || 'Video'}</h1>
              <RichTextDisplay content={video?.description || ''} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DescriptionDock;


