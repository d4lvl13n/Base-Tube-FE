import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, BarChart2 } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
  index: number;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, onClick, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.05 }}
    className={`border rounded-xl overflow-hidden transition-all duration-300 ${
      isOpen 
        ? 'bg-black/60 border-[#fa7517]/30' 
        : 'bg-black/30 border-gray-800/30 hover:border-gray-700/50'
    }`}
  >
    <button
      onClick={onClick}
      className="w-full px-6 py-5 flex items-center justify-between text-left"
    >
      <span className={`font-semibold transition-colors ${isOpen ? 'text-white' : 'text-gray-300'}`}>
        {question}
      </span>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        className={`flex-shrink-0 ml-4 ${isOpen ? 'text-[#fa7517]' : 'text-gray-500'}`}
      >
        <ChevronDown className="w-5 h-5" />
      </motion.div>
    </button>
    
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="px-6 pb-5 text-gray-400 leading-relaxed">
            {answer}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

const ThumbnailFAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "What exactly is a CTR Audit?",
      answer: "A CTR (Click-Through Rate) Audit is an AI-powered analysis of your thumbnail that scores it against 15+ factors known to influence viewer clicks. Unlike generic feedback, our audit shows you specific metrics like color contrast, text readability, facial prominence, and composition—all with actionable scores and recommendations."
    },
    {
      question: "How accurate is the CTR prediction?",
      answer: "Our CTR predictions are based on analyzing millions of YouTube thumbnails and their actual performance data. While no prediction is 100% accurate (CTR also depends on title, timing, and audience), our users typically see their actual CTR fall within ±0.5% of our prediction. The real value is in the relative improvement—thumbnails that score higher in our audit consistently outperform their lower-scoring counterparts."
    },
    {
      question: "What makes this different from other thumbnail generators?",
      answer: "Most AI thumbnail tools focus solely on generation—making something that 'looks good.' We focus on optimization. Our CTR Audit tells you exactly why a thumbnail performs well or poorly, then helps you either fix your existing thumbnail or generate a new one based on those insights. It's the difference between guessing and knowing."
    },
    {
      question: "Can I audit thumbnails I didn't create here?",
      answer: "Absolutely! You can upload any thumbnail image or paste a YouTube URL to audit thumbnails from any video. This is great for analyzing competitor thumbnails, understanding what works in your niche, or auditing your existing catalog to find underperformers worth updating."
    },
    {
      question: "What metrics does the audit analyze?",
      answer: "The audit analyzes: Mobile Readability (how clear it is on small screens), Color Contrast (visibility and attention-grabbing potential), Composition Score (visual balance and focal points), Brightness (overall luminosity and appeal), Text Clarity (font size, legibility, and impact), Face Prominence (presence and positioning of faces), plus niche-specific factors based on your content category."
    },
    {
      question: "How long does an audit take?",
      answer: "Most audits complete in under 5 seconds. You'll get your CTR score, detailed metric breakdown, and AI-generated recommendations almost instantly. No waiting around—iterate quickly and find your best-performing thumbnail."
    },
    {
      question: "Is it free to try?",
      answer: "Yes! You can run your first audits and generations for free without a credit card. We want you to see the value before committing. Free users get a limited number of audits and generations per day, with premium tiers unlocking unlimited access and advanced features."
    },
    {
      question: "Can the AI generate thumbnails based on my audit results?",
      answer: "Yes! After an audit, you can click 'Generate Better Thumbnail' to create a new version that addresses the weaknesses identified. The AI uses your audit insights to produce an optimized alternative, or you can manually adjust the prompt to keep creative control."
    },
  ];

  return (
    <section id="faq" className="py-24 bg-gradient-to-b from-black to-[#09090B]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black/60 border border-gray-800/50 rounded-full text-xs font-medium text-gray-400 mb-6"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#fa7517]" />
            FREQUENTLY ASKED
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Questions About CTR Optimization
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400"
          >
            Everything you need to know about auditing and optimizing your thumbnails.
          </motion.p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              index={index}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400 mb-4">Still have questions?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:support@base.tube"
              className="text-[#fa7517] hover:text-orange-400 font-medium transition-colors"
            >
              Contact Support →
            </a>
            <span className="hidden sm:inline text-gray-600">or</span>
            <a
              href="/ai-thumbnails/audit"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#fa7517]/10 hover:bg-[#fa7517]/20 border border-[#fa7517]/30 rounded-full text-[#fa7517] font-medium transition-colors"
            >
              <BarChart2 className="w-4 h-4" />
              Try Your First Audit
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ThumbnailFAQ;
