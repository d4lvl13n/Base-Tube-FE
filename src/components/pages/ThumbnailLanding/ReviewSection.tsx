import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { ctrApi } from '../../../api/ctr';
import { ReviewButton } from './LandingButtons';
import { FadeIn, RevealHeading, useSeen } from './motionKit';

// A real review by AI Thumbnails (the free review, 29 September 2026) of one of its own thumbnails:
// its score and its three suggestions, lightly shortened; the pins mark where each one applies.
const EXAMPLE_SRC = '/assets/ai-thumbnails/examples/deadlift-day-90.webp';
const SCORE = 8;
const NOTES = [
  { x: 24, y: 60, text: 'Brighten the left side to match the energy of the right.' },
  { x: 91, y: 50, text: 'Simplify the background so the eye stays on the faces and the title.' },
  { x: 40, y: 13, text: 'Add a subtle outline or glow to the title so it reads on small screens.' },
];

function ScoreRing({ score, play }: { score: number; play: boolean }) {
  const radius = 26;
  const length = 2 * Math.PI * radius;
  const reduceMotion = useReducedMotion();
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/80 px-4 py-3 shadow-2xl shadow-black/60 backdrop-blur-md">
      <svg viewBox="0 0 64 64" className="h-14 w-14 -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
        <motion.circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#fa7517"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={length}
          initial={reduceMotion ? false : { strokeDashoffset: length }}
          animate={{ strokeDashoffset: play || reduceMotion ? length - (score / 10) * length : length }}
          transition={{ duration: 1.6, ease: [0.2, 0.7, 0.2, 1], delay: 0.3 }}
        />
      </svg>
      <div className="leading-tight">
        <p className="text-2xl font-bold text-white">
          {score}
          <span className="text-sm font-medium text-zinc-400">/10</span>
        </p>
        <p className="text-xs text-[#fa7517]">Attention score</p>
      </div>
    </div>
  );
}

/**
 * The thumbnail review: a score from 1 to 10 and what to change, on an example. Once in view the
 * score fills, the notes pin themselves one by one, then the notes take turns being highlighted.
 * Then the honest line on clicks (measured from YouTube, never predicted). Visitors get the free
 * reviews a day the server allows (GET /ctr/quota).
 */
const ReviewSection: React.FC<{ signedIn: boolean; resolved: boolean }> = ({ signedIn, resolved }) => {
  const reduceMotion = useReducedMotion();
  const [figure, seen] = useSeen<HTMLDivElement>(0.45);
  const [active, setActive] = useState(0);
  const quota = useQuery({
    queryKey: ['ctr', 'visitor-quota'],
    queryFn: () => ctrApi.getQuota(),
    staleTime: 5 * 60_000,
    retry: false,
    enabled: resolved && !signedIn,
  });
  const access = quota.data;
  const freeReviews = !signedIn && access?.mode === 'quota' && access.quota.audit.limit > 0 ? access.quota.audit.limit : null;

  useEffect(() => {
    if (!seen || reduceMotion) return undefined;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % NOTES.length), 2600);
    return () => window.clearInterval(timer);
  }, [seen, reduceMotion]);

  return (
    <section aria-labelledby="landing-review-title" className="border-t border-white/[0.06] py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-2">
        <div className="max-w-xl lg:order-2">
          <RevealHeading
            id="landing-review-title"
            className="lp-heading text-4xl text-white sm:text-6xl"
            parts={['A second opinion ', { accent: 'before you publish.' }]}
          />
          <FadeIn delay={0.15}>
            <p className="mt-6 text-lg leading-relaxed text-zinc-300">
              Upload any thumbnail and get a <span className="font-semibold text-[#ff9a3c]">score from 1 to 10</span>, with{' '}
              <span className="font-semibold text-white">exactly what to change</span>, in plain words.
            </p>
          </FadeIn>
          <ol className="mt-8 space-y-2">
            {NOTES.map((note, index) => (
              <li
                key={note.text}
                className={`flex gap-4 rounded-xl px-3 py-2.5 transition-colors duration-500 ${active === index && seen ? 'bg-[#fa7517]/[0.1]' : ''}`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors duration-500 ${
                    active === index && seen ? 'bg-[#fa7517] text-white' : 'bg-white/10 text-zinc-300'
                  }`}
                >
                  {index + 1}
                </span>
                <span className={`pt-0.5 text-base leading-relaxed transition-colors duration-500 ${active === index && seen ? 'text-white' : 'text-zinc-400'}`}>
                  {note.text}
                </span>
              </li>
            ))}
          </ol>
          <FadeIn delay={0.1}>
            <div className="mt-10 rounded-2xl border border-[#fa7517]/25 bg-gradient-to-br from-[#fa7517]/[0.08] to-transparent p-6">
              <p className="text-lg font-semibold text-white">
                Measured, <span className="text-[#ff9a3c]">not predicted.</span>
              </p>
              <p className="mt-2 text-base leading-relaxed text-zinc-400">
                No one can predict your click rate from one image, so we don&apos;t. Connect YouTube and see your real numbers before and
                after you change a thumbnail.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ReviewButton signedIn={signedIn} />
              {freeReviews !== null && (
                <span className="text-sm text-zinc-500">
                  {freeReviews} free review{freeReviews === 1 ? '' : 's'} a day, no account needed
                </span>
              )}
            </div>
          </FadeIn>
        </div>

        <figure className="relative lg:order-1">
          <motion.div
            ref={figure}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, rotate: -1.5 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
            className="relative overflow-hidden rounded-2xl shadow-[0_40px_120px_-40px_rgba(250,117,23,0.35)] ring-1 ring-white/10"
          >
            <img src={EXAMPLE_SRC} alt="An example thumbnail: the same athlete tired on day 1 and strong on day 90, “Day 1 vs day 90”" loading="lazy" className="aspect-video w-full object-cover" />
            {NOTES.map((note, index) => (
              <motion.span
                key={note.text}
                aria-hidden="true"
                initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                animate={seen || reduceMotion ? { scale: 1, opacity: 1 } : undefined}
                transition={{ type: 'spring', stiffness: 380, damping: 18, delay: 0.6 + index * 0.35 }}
                className="absolute -ml-4 -mt-4 flex h-8 w-8 items-center justify-center"
                style={{ left: `${note.x}%`, top: `${note.y}%` }}
              >
                {active === index && seen && !reduceMotion && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#fa7517] opacity-60" />
                )}
                <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#fa7517] text-sm font-bold text-white shadow-[0_0_0_6px_rgba(250,117,23,0.25)]">
                  {index + 1}
                </span>
              </motion.span>
            ))}
          </motion.div>
          <div className="absolute -bottom-7 right-4 sm:right-6">
            <ScoreRing score={SCORE} play={seen} />
          </div>
          <figcaption className="sr-only">An example review with three notes and a score of {SCORE} out of 10.</figcaption>
        </figure>
      </div>
    </section>
  );
};

export default ReviewSection;
