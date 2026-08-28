import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Bot, Wand2, Copy, Check, RefreshCw } from 'lucide-react';

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
  mode: 'video' | 'channel' | 'pass';
  /**
   * Applies the generated description to the form the panel was opened from.
   *
   * Optional on purpose: the channel and pass screens do not pass it, so they
   * keep the copy-and-paste flow they have always had and no new button
   * appears for them.
   */
  onAcceptDescription?: (description: string) => void;
  /**
   * Whether the target field already holds something. Only used to decide
   * whether applying a description needs a confirmation first.
   */
  hasExistingDescription?: boolean;
  /** Keywords the generator picked out, rendered as chips. */
  generatedKeywords?: string[];
  /** Hashtag line, already split, rendered as chips under the description. */
  hashtags?: string[];
}

const CHIP =
  'inline-flex items-center rounded-full border border-gray-800 bg-black/40 px-2.5 py-1 text-xs text-gray-300';

const SECONDARY =
  'inline-flex items-center gap-1.5 rounded text-xs text-[#fa7517] transition-colors ' +
  'hover:text-[#ff8c3a] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#fa7517]/60 ' +
  'disabled:cursor-not-allowed disabled:text-gray-600';

const APPLY =
  'inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[#fa7517] px-3 py-1.5 ' +
  'text-xs font-medium text-black transition-colors hover:bg-[#ff8c3a] focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-[#fa7517]/60';

const FIELD =
  'mt-2 w-full rounded-md border border-gray-800 bg-black/40 px-3 py-2 text-sm text-white ' +
  'placeholder:text-gray-600 transition-colors focus:border-[#fa7517]/60 focus:outline-none ' +
  'focus-visible:ring-1 focus-visible:ring-[#fa7517]/60';

const LABEL = 'block text-xs font-medium text-gray-400';

/** Grey bars where the description will be — a shape, not a spinner. */
const DescriptionSkeleton: React.FC = () => (
  <div className="space-y-2" data-testid="ai-description-skeleton" aria-hidden="true">
    {['w-3/4', 'w-full', 'w-full', 'w-5/6', 'w-1/2'].map((width, index) => (
      <div key={index} className={`h-3 animate-pulse rounded bg-gray-800/70 ${width}`} />
    ))}
  </div>
);

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
  mode,
  onAcceptDescription,
  hasExistingDescription = false,
  generatedKeywords,
  hashtags
}) => {
  const [copied, setCopied] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleCopyDescription = async () => {
    if (generatedDescription) {
      await navigator.clipboard.writeText(generatedDescription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /**
   * Applying replaces whatever is in the field, so a draft that already has
   * words in it gets one question first. An empty field just takes the text.
   */
  const handleAcceptDescription = () => {
    if (!generatedDescription || !onAcceptDescription) return;
    if (
      hasExistingDescription &&
      // eslint-disable-next-line no-alert
      !window.confirm('Replace your current description with the AI version?')
    ) {
      return;
    }
    onAcceptDescription(generatedDescription);
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
    if (mode === 'pass') {
      return {
        title: 'Pass Description Assistant',
        subtitle: 'Let AI help you write a premium content-pass description',
        keywordsPlaceholder: 'Enter pass keywords (comma separated)',
        contextPlaceholder: 'Describe the videos, audience, and what makes this pass valuable...',
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
  const hasResult = Boolean(generatedDescription);

  const panel = (
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
            className="fixed right-0 top-0 bottom-0 h-screen w-full max-w-[560px] bg-black/95 z-50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient Border */}
            <div className="absolute left-0 inset-y-0 w-[2px] h-full">
              <div className="absolute inset-0 bg-gradient-to-b from-[#fa7517]/30 via-[#fa7517]/10 to-[#fa7517]/30" />
            </div>

            {/* Content */}
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="border-b border-gray-800/30 p-5">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Bot className="h-4 w-4 text-[#fa7517]" aria-hidden="true" />
                    <h2 className="text-base font-semibold text-white">{contextText.title}</h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    aria-label="Close"
                    className="rounded-full p-1.5 transition-colors hover:bg-gray-800/50"
                  >
                    <X className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  </motion.button>
                </div>
                <p className="text-xs text-gray-500">{contextText.subtitle}</p>
              </div>

              {/* Main Content - Scrollable Area */}
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-5 p-5">
                  {/* Show suggested title only for video mode */}
                  {mode === 'video' && suggestedTitle && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <span className={LABEL}>AI Suggested Title</span>
                      <div className="rounded-md border border-[#fa7517]/30 bg-[#fa7517]/10 p-3">
                        <p className="text-sm text-white">{suggestedTitle}</p>
                        <button type="button" onClick={onAcceptTitle} className={`mt-3 ${APPLY}`}>
                          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                          Use This Title
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Generated description — or the skeleton standing in for it */}
                  {(hasResult || isGenerating) && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className={LABEL}>AI Generated Description</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={onGenerate}
                            disabled={isGenerating}
                            className={SECONDARY}
                          >
                            <RefreshCw
                              className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`}
                              aria-hidden="true"
                            />
                            Regenerate
                          </button>
                          {hasResult && (
                            <button
                              type="button"
                              onClick={handleCopyDescription}
                              className={SECONDARY}
                            >
                              {copied ? (
                                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                              )}
                              {copied ? 'Copied!' : 'Copy'}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="rounded-md border border-[#fa7517]/30 bg-[#fa7517]/10 p-3">
                        {isGenerating && !hasResult ? (
                          <DescriptionSkeleton />
                        ) : (
                          <>
                            {/* `whitespace-pre-wrap` is the whole point: the
                                generator's blank lines and `•` bullets are the
                                description, not decoration around it. */}
                            <p
                              data-testid="ai-generated-description"
                              className="whitespace-pre-wrap text-sm leading-relaxed text-white"
                            >
                              {generatedDescription}
                            </p>

                            {hashtags && hashtags.length > 0 && (
                              <div
                                data-testid="ai-hashtags"
                                className="mt-3 flex flex-wrap gap-1.5 border-t border-[#fa7517]/20 pt-3"
                              >
                                {hashtags.map((hashtag) => (
                                  <span key={hashtag} className={CHIP}>
                                    {hashtag.startsWith('#') ? hashtag : `#${hashtag}`}
                                  </span>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {hasResult && onAcceptDescription && (
                        <button type="button" onClick={handleAcceptDescription} className={APPLY}>
                          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                          Use description
                        </button>
                      )}
                    </motion.div>
                  )}

                  {generatedKeywords && generatedKeywords.length > 0 && (
                    <div className="space-y-2">
                      <span className={LABEL}>Suggested keywords</span>
                      <div data-testid="ai-keywords" className="flex flex-wrap gap-1.5">
                        {generatedKeywords.map((keyword) => (
                          <span key={keyword} className={CHIP}>
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className={LABEL} htmlFor="ai-assistant-keywords">
                        Keywords
                      </label>
                      <input
                        id="ai-assistant-keywords"
                        type="text"
                        value={keywords}
                        onChange={(e) => onKeywordsChange(e.target.value)}
                        placeholder={contextText.keywordsPlaceholder}
                        className={FIELD}
                      />
                    </div>

                    <div>
                      <label className={LABEL} htmlFor="ai-assistant-context">
                        Additional Context
                      </label>
                      <textarea
                        id="ai-assistant-context"
                        value={additionalInfo}
                        onChange={(e) => onAdditionalInfoChange(e.target.value)}
                        placeholder={contextText.contextPlaceholder}
                        rows={4}
                        className={FIELD}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer with Generate Button */}
              <div className="border-t border-gray-800/30 p-5">
                <button
                  type="button"
                  onClick={onGenerate}
                  disabled={isGenerating}
                  title={title ? `Describe: ${title}` : undefined}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5
                    text-sm font-medium transition-colors focus-visible:outline-none
                    focus-visible:ring-2 focus-visible:ring-[#fa7517]/60
                    ${
                      isGenerating
                        ? 'cursor-not-allowed bg-gray-800 text-gray-500'
                        : 'bg-[#fa7517] text-black hover:bg-[#ff8c3a]'
                    }`}
                >
                  <Wand2 className="h-4 w-4" aria-hidden="true" />
                  {isGenerating ? 'Generating...' : 'Generate Content'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) {
    return null;
  }

  return createPortal(panel, document.body);
};

export default AIAssistantPanel;
