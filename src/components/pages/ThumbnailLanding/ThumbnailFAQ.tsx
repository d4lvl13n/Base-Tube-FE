import React, { useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { RevealHeading } from './motionKit';
import { catalogTrial } from '../../../hooks/useSubscription';
import type { SubscriptionCatalog } from '../../../types/subscription';

interface FaqItem {
  question: string;
  answer: string;
}

/** The questions; the video, trial and expiry answers use the plan catalog's numbers (none are written here). */
export function landingFaq(catalog: SubscriptionCatalog | undefined): FaqItem[] {
  const trial = catalogTrial(catalog);
  const video = catalog
    ? (() => {
        const { concepts, edits, audits } = catalog.videoBreakdown;
        const reviews = audits === 1 ? 'a review' : `${audits} reviews`;
        return `One video is ${concepts} ideas, ${edits} edits and ${reviews}: about ${catalog.videoCredits} credits. `;
      })()
    : '';
  const planCredits = catalog?.rolloverMonths === 0
    ? 'Plan credits stay usable until the end of the month they are for.'
    : 'Plan credits stay usable until the end of the following month.';
  const items: Array<FaqItem | null> = [
    {
      question: 'Will this increase my views?',
      answer:
        'We can’t promise that, and anyone who does is guessing. Better thumbnails give your video a better chance. Connect YouTube to see your real click rate before and after.',
    },
    {
      question: 'Will it look AI-made?',
      answer: 'It starts from your video and your real face, in your channel’s style. You pick, and change anything in plain words.',
    },
    {
      question: 'Can I use my face?',
      answer: 'Yes. Add a photo to your channel profile once; it’s used in every idea you ask for.',
    },
    {
      question: 'What’s a video, what’s a credit?',
      answer: `${video}Plans are sold in videos; credits are how we count.`,
    },
    trial
      ? {
          question: 'How does the free trial work?',
          answer: `${trial.days} days, ${trial.videos} video${trial.videos === 1 ? '' : 's'} included. Your card is charged on day ${trial.days + 1} unless you cancel, in one click from Settings.`,
        }
      : null,
    {
      question: 'Do credits expire?',
      answer: `${planCredits}${trial ? ' Free trial credits end with the trial.' : ''} Credit packs never expire.`,
    },
    {
      question: 'Why not Canva or Photoshop?',
      answer: 'They’re great if you have the time and the eye. AI Thumbnails gives you three finished ideas per video, in your style.',
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, from Settings › Subscription. Your credits stay usable until they expire.',
    },
  ];
  return items.filter((item): item is FaqItem => item !== null);
}

/** One question: opens smoothly, its plus turns into a cross, orange while open. */
function FaqRow({ question, answer }: FaqItem) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const id = useId();
  return (
    <div className="py-1">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((value) => !value)}
          className="group flex w-full items-center justify-between gap-6 py-5 text-left text-lg font-medium text-white"
        >
          <span className={`transition-colors ${open ? "text-[#ff9a3c]" : "group-hover:text-[#ff9a3c]"}`}>{question}</span>
          <span
            aria-hidden="true"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
              open ? "rotate-45 border-[#fa7517] bg-[#fa7517] text-white" : "border-white/15 text-zinc-400 group-hover:border-[#fa7517]/60"
            }`}
          >
            <Plus className="h-4 w-4" />
          </span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            key="answer"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl pb-6 pr-12 text-base leading-relaxed text-zinc-400">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const ThumbnailFAQ: React.FC<{ catalog: SubscriptionCatalog | undefined }> = ({ catalog }) => (
  <section id="faq" aria-labelledby="landing-faq-title" className="scroll-mt-16 border-t border-white/[0.06] py-24 sm:py-32">
    <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <RevealHeading id="landing-faq-title" className="lp-heading text-4xl text-white sm:text-5xl" parts={["Questions, ", { accent: "answered." }]} />
        <p className="mt-5 text-base text-zinc-400">
          Something else? Write to{" "}
          <a href="mailto:support@base.tube" className="text-[#fb923c] hover:text-orange-300">
            support@base.tube
          </a>
          .
        </p>
      </div>
      <div className="divide-y divide-white/[0.08] border-y border-white/[0.08] lg:col-span-8">
        {landingFaq(catalog).map((item) => (
          <FaqRow key={item.question} {...item} />
        ))}
      </div>
    </div>
  </section>
);

export default ThumbnailFAQ;
