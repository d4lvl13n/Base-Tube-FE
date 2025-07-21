import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const ThumbnailFAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How does this work?",
      answer: "Simply describe your video in plain words. Our technology understands your vision and creates thumbnails that capture exactly what you meant. No design skills needed."
    },
    {
      question: "Do I need any design experience?",
      answer: "None at all. If you can describe your video, you can create stunning thumbnails. Our technology handles all the design complexity behind the scenes."
    },
    {
      question: "What makes these thumbnails special?",
      answer: "Every thumbnail is crafted using principles that make people stop scrolling and start clicking. Your content gets the attention it deserves, not just another generic image."
    },
    {
      question: "Can I use these for my business?",
      answer: "Absolutely. All thumbnails are yours to use however you want - YouTube, social media, marketing materials, anywhere. No restrictions, no licensing headaches."
    },
    {
      question: "How much does this cost?",
      answer: "You can try it free to see if it works for you. If you love it, our plans start at just a few dollars per month - less than what you'd pay for a single designer thumbnail."
    },
    {
      question: "How fast will I get my thumbnail?",
      answer: "Your thumbnail appears in seconds, not hours or days. No waiting for designers, no back-and-forth revisions. Just instant results when inspiration strikes."
    },
    {
      question: "What if I don't like the result?",
      answer: "Try a different description or generate new variations. There's no limit to experimenting until you find exactly what feels right for your content."
    },
    {
      question: "Will my thumbnails look unique?",
      answer: "Every thumbnail is created fresh for your specific content. No templates, no cookie-cutter designs. Your thumbnails will be as unique as your videos."
    },
    {
      question: "How do I know this will work for my content?",
      answer: "Try it free with your actual video ideas. See for yourself how it transforms your content presentation. Most creators are amazed by their first result."
    },
    {
      question: "Is my content private?",
      answer: "Your ideas and thumbnails are yours alone. We don't store, share, or use your content for anything other than creating your thumbnails."
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
            <span className="text-sm font-medium text-white">Your Questions Answered</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-[#fa7517] to-orange-400 bg-clip-text text-transparent">
              Everything You Need
            </span>
            <br />
            to Know
          </h2>
          
          <p className="text-xl text-gray-300 leading-relaxed">
            The answers that help you make the right choice for your content
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
                Ready to Transform Your Content?
              </h3>
              <p className="text-gray-300 mb-6">
                Join creators who've discovered the secret to thumbnails that actually work.
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
                <span>⚡ Quick support</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ThumbnailFAQ; 