import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BarChart3, MessageSquareText, ScanSearch, UserSquare, Wand2, Youtube } from 'lucide-react';
import { RevealHeading } from './motionKit';

// One line per feature for now; each gets its own page later.
const FEATURES = [
  { Icon: Wand2, title: 'Studio', text: 'Three ideas per video from your link, script or brief.' },
  { Icon: UserSquare, title: 'Channel profiles', text: 'Remembers your face, logo, colors and rules.' },
  { Icon: MessageSquareText, title: 'Edits in plain words', text: '“Brighter sky, bigger title.” Done.' },
  { Icon: ScanSearch, title: 'Thumbnail review', text: 'A score from 1 to 10 and exactly what to change.' },
  { Icon: BarChart3, title: 'Channel review', text: 'Your channel’s thumbnails next to channels your size.' },
  { Icon: Youtube, title: 'YouTube connection', text: 'Your real clicks and impressions, before and after.' },
];

const ThumbnailFeatures: React.FC = () => {
  const reduceMotion = useReducedMotion();
  return (
    <section id="features" aria-labelledby="landing-features-title" className="scroll-mt-16 border-t border-white/[0.06] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <RevealHeading
          id="landing-features-title"
          className="lp-heading text-4xl text-white sm:text-6xl"
          parts={['Everything in ', { accent: 'one place.' }]}
        />
        <ul className="mt-14 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ Icon, title, text }, index) => (
            <motion.li
              key={title}
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, delay: (index % 3) * 0.12, ease: [0.2, 0.7, 0.2, 1] }}
              className="group relative flex gap-5 border-t border-white/[0.08] py-8"
            >
              <span aria-hidden="true" className="absolute left-0 top-[-1px] h-px w-0 bg-[#fa7517] transition-all duration-700 group-hover:w-full" />
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fa7517]/10 text-[#fa7517] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#fa7517] group-hover:text-white">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-lg font-semibold text-white">{title}</span>
                <span className="mt-1.5 block text-base leading-relaxed text-zinc-400">{text}</span>
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default ThumbnailFeatures;
