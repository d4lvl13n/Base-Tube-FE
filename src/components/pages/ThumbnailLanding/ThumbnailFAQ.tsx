import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const ThumbnailFAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How does AI thumbnail generation work?",
      answer: "Our AI analyzes your text prompt and generates thumbnails using advanced machine learning models trained on millions of high-performing thumbnails. It understands context, style, and visual elements that drive clicks and engagement."
    },
    {
      question: "Do I need design skills to use this tool?",
      answer: "Not at all! Simply describe your video content in plain English, and our AI will create professional thumbnails for you. For example, 'cooking tutorial for beginners' or 'iPhone review with pros and cons' work perfectly."
    },
    {
      question: "What makes AI thumbnails better than traditional design?",
      answer: "AI thumbnails are created in seconds, not hours. They're based on data from millions of successful thumbnails, ensuring they follow proven design principles. Plus, you can generate unlimited variations until you find the perfect one."
    },
    {
      question: "Can I use these thumbnails commercially?",
      answer: "Yes! All thumbnails generated are yours to use commercially. You can use them for YouTube videos, social media posts, marketing materials, or any other purpose. There are no licensing restrictions."
    },
    {
      question: "What's the difference between free and premium accounts?",
      answer: "Free accounts get 3 thumbnail generations per day, while premium accounts get unlimited generations, priority processing, advanced customization options, and access to premium styles and templates."
    },
    {
      question: "How long does it take to generate a thumbnail?",
      answer: "Most thumbnails are generated in under 30 seconds. During peak times, it might take up to 1 minute. Premium users get priority processing for even faster results."
    },
    {
      question: "What image formats and sizes are supported?",
      answer: "All thumbnails are generated in 1280x720 HD resolution in PNG format, perfect for YouTube and other platforms. We also support custom sizes and formats for premium users."
    },
    {
      question: "Can I edit the generated thumbnails?",
      answer: "While the AI creates complete thumbnails, you can always request variations by adjusting your prompt. Premium users get access to our built-in editor for fine-tuning colors, text, and elements."
    },
    {
      question: "Do you store my generated thumbnails?",
      answer: "Your thumbnails are temporarily stored for 30 days so you can re-download them. After that, they're automatically deleted. We never use your content for training or share it with third parties."
    },
    {
      question: "What if I'm not satisfied with the results?",
      answer: "You can regenerate thumbnails with different prompts at no extra cost. Our AI learns from feedback, so the more specific your prompt, the better the results. Premium users also get priority support."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="py-20 bg-gradient-to-br from-[#09090B] via-[#111114] to-[#09090B]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 rounded-full border border-[#fa7517]/30 mb-6">
            <HelpCircle className="w-4 h-4 text-[#fa7517]" />
            <span className="text-sm font-medium text-white">Got Questions?</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-[#fa7517] to-orange-400 bg-clip-text text-transparent">
              Frequently Asked
            </span>
            <br />
            Questions
          </h2>
          
          <p className="text-xl text-gray-300 leading-relaxed">
            Everything you need to know about AI thumbnail generation
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-all duration-300" />
                <div className="relative bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-[#fa7517]/30 transition-all duration-300">
                  
                  {/* Question */}
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-6 text-left flex items-center justify-between group/button hover:bg-white/5 transition-colors duration-200"
                  >
                    <h3 className="text-lg font-semibold text-white pr-4 group-hover/button:text-[#fa7517] transition-colors duration-200">
                      {faq.question}
                    </h3>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover/button:bg-[#fa7517]/20 transition-colors duration-200">
                      <motion.div
                        animate={{ rotate: openIndex === index ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {openIndex === index ? (
                          <ChevronUp className="w-5 h-5 text-white" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-white" />
                        )}
                      </motion.div>
                    </div>
                  </button>

                  {/* Answer */}
                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6">
                          <div className="border-t border-white/10 pt-4">
                            <p className="text-gray-300 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="relative group inline-block">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <div className="relative bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-[#fa7517]/30 transition-all duration-300">
              <h3 className="text-2xl font-bold text-white mb-4">
                Still have questions?
              </h3>
              <p className="text-gray-300 mb-6">
                We're here to help! Get in touch with our support team for personalized assistance.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
                <a 
                  href="mailto:support@base.tube" 
                  className="hover:text-[#fa7517] transition-colors duration-200"
                >
                  📧 support@base.tube
                </a>
                <span>•</span>
                <span>💬 Live chat available</span>
                <span>•</span>
                <span>⚡ 24/7 support</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ThumbnailFAQ; 