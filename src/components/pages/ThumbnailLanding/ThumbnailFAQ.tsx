import React from 'react';
import { ChevronDown } from 'lucide-react';
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

const ThumbnailFAQ: React.FC<{ catalog: SubscriptionCatalog | undefined }> = ({ catalog }) => (
  <section id="faq" aria-labelledby="landing-faq-title" className="scroll-mt-20 bg-white/[0.015] py-20 sm:py-24">
    <div className="mx-auto max-w-3xl px-4 sm:px-6">
      <h2 id="landing-faq-title" className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Questions
      </h2>
      <div className="mt-10 space-y-3">
        {landingFaq(catalog).map(({ question, answer }) => (
          <details key={question} className="group rounded-2xl border border-white/[0.08] bg-[#111113] px-5 py-4 open:border-white/15">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-white [&::-webkit-details-marker]:hidden">
              {question}
              <ChevronDown className="h-5 w-5 shrink-0 text-zinc-400 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{answer}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
);

export default ThumbnailFAQ;
