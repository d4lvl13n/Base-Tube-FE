import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Bot, Wand2, Copy, Check } from 'lucide-react';

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  keywords: string;
  additionalInfo: string;
  onKeywordsChange: (value: string) => void;
  onAdditionalInfoChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  generatedDescription?: string;
  suggestedTitle?: string;
  onAcceptTitle?: () => void;
  mode: 'video' | 'channel';
}

const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  isOpen,
  onClose,
  title,
  keywords,
  additionalInfo,
  onKeywordsChange,
  onAdditionalInfoChange,
  onGenerate,
  isGenerating,
  generatedDescription,
  suggestedTitle,
  onAcceptTitle,
  mode
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyDescription = async () => {
    if (generatedDescription) {
      await navigator.clipboard.writeText(generatedDescription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getContextualText = () => {
    if (mode === 'video') {
      return {
        title: 'Video Description Assistant',
        subtitle: 'Let AI help you create engaging video descriptions',
        keywordsPlaceholder: 'Enter video keywords (comma separated)',
        contextPlaceholder: 'Provide more context about your video...',
      };
    }
    return {
      title: 'Channel Description Assistant',
      subtitle: 'Let AI help you create an engaging channel description',
      keywordsPlaceholder: 'Enter channel keywords (comma separated)',
      contextPlaceholder: 'Provide more context about your channel...',
    };
  };

  const contextText = getContextualText();

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="fixed right-0 top-0 bottom-0 h-screen w-[500px] bg-black/95 z-50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient Border */}
            <div className="absolute left-0 inset-y-0 w-[2px] h-full">
              <div className="absolute inset-0 bg-gradient-to-b from-[#fa7517]/30 via-[#fa7517]/10 to-[#fa7517]/30" />
            </div>

            {/* Content */}
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-800/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Bot className="w-6 h-6 text-[#fa7517]" />
                    <h2 className="text-xl font-semibold">{contextText.title}</h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="p-2 hover:bg-gray-800/50 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </motion.button>
                </div>
                <p className="text-gray-400">{contextText.subtitle}</p>
              </div>

              {/* Main Content - Scrollable Area */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Show suggested title only for video mode */}
                  {mode === 'video' && suggestedTitle && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <label className="text-sm font-medium text-gray-400">AI Suggested Title</label>
                      <div className="p-4 bg-[#fa7517]/10 rounded-lg border border-[#fa7517]/30">
                        <p className="text-white">{suggestedTitle}</p>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={onAcceptTitle}
                          className="mt-3 px-4 py-2 bg-[#fa7517] text-black rounded-lg font-medium
                            flex items-center justify-center space-x-2 w-full"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Use This Title</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Generated Description */}
                  {generatedDescription && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-400">AI Generated Description</label>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleCopyDescription}
                          className="flex items-center space-x-2 text-[#fa7517] hover:text-[#ff8c3a] transition-colors px-3 py-1 rounded-full bg-[#fa7517]/10"
                        >
                          {copied ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                        </motion.button>
                      </div>
                      <div className="p-4 bg-[#fa7517]/10 rounded-lg border border-[#fa7517]/30">
                        <p className="text-white whitespace-pre-wrap">{generatedDescription}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Input Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400">Keywords</label>
                      <input
                        type="text"
                        value={keywords}
                        onChange={(e) => onKeywordsChange(e.target.value)}
                        placeholder={contextText.keywordsPlaceholder}
                        className="mt-2 w-full px-4 py-3 bg-gray-900/50 border border-gray-800/30 rounded-lg focus:outline-none focus:border-[#fa7517] text-white"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-400">Additional Context</label>
                      <textarea
                        value={additionalInfo}
                        onChange={(e) => onAdditionalInfoChange(e.target.value)}
                        placeholder={contextText.contextPlaceholder}
                        rows={4}
                        className="mt-2 w-full px-4 py-3 bg-gray-900/50 border border-gray-800/30 rounded-lg focus:outline-none focus:border-[#fa7517] text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer with Generate Button */}
              <div className="p-6 border-t border-gray-800/30">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onGenerate}
                  disabled={isGenerating}
                  className={`w-full px-6 py-4 rounded-xl font-semibold
                    flex items-center justify-center space-x-3 shadow-lg
                    ${isGenerating 
                      ? 'bg-gray-700 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] hover:shadow-[#fa7517]/50'
                    }`}
                >
                  {isGenerating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6"
                      >
                        ⟳
                      </motion.div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-6 h-6" />
                      <span>Generate Content</span>
                      <Sparkles className="w-6 h-6" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AIAssistantPanel; 