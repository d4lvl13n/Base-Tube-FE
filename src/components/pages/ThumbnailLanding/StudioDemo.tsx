import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { Check, Download, Link2, ScanSearch, Wand2 } from 'lucide-react';
import ThumbnailArt from './ThumbnailArt';
import { DEMO } from './landingContent';

/**
 * The page's one orchestrated moment: the Studio at work, played when it scrolls into view.
 * Phases: 0 the link is typed, 1 three ideas appear, 2 an edit is typed, 3 the edit lands on
 * idea 1, 4 a review note appears on idea 2, 5 the three are ready to download. Then it starts over.
 * The steps on the left follow the phase. With reduced motion it shows the finished state.
 */
const STEPS = [
  'Paste your video link, script or idea',
  'Get three ideas with your face, in your channel’s style',
  'Change anything in plain words',
  'Get a review, then download all three for Test & Compare',
];
const PHASE_STEP = [0, 1, 2, 2, 3, 3];
const TIMELINE = [0, 2300, 4700, 6200, 7800, 9500];
const LOOP_AFTER = 13500;

function useTyped(text: string, active: boolean, speed: number): string {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    setCount(0);
    const timer = window.setInterval(() => setCount((value) => (value >= text.length ? value : value + 1)), speed);
    return () => window.clearInterval(timer);
  }, [active, text, speed]);
  return text.slice(0, count);
}

const StudioDemo: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const inView = useInView(stage, { amount: 0.35 });
  const [phase, setPhase] = useState(reduceMotion ? 5 : -1);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setPhase(5);
      return undefined;
    }
    if (!inView) return undefined;
    const timers = TIMELINE.map((at, next) => window.setTimeout(() => setPhase(next), at));
    timers.push(window.setTimeout(() => setRun((value) => value + 1), LOOP_AFTER));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [inView, reduceMotion, run]);

  const link = useTyped(DEMO.link, !reduceMotion && phase === 0, 26);
  const edit = useTyped(DEMO.edit, !reduceMotion && phase === 2, 45);
  const linkText = reduceMotion || phase > 0 ? DEMO.link : link;
  const editText = reduceMotion || phase > 2 ? DEMO.edit : phase === 2 ? edit : '';
  const step = phase < 0 ? -1 : PHASE_STEP[phase];

  return (
    <section id="demo" aria-labelledby="landing-demo-title" className="relative scroll-mt-16 overflow-hidden py-24 sm:py-32">
      <div aria-hidden="true" className="absolute left-1/2 top-1/3 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[#fa7517]/[0.07] blur-[140px]" />
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 id="landing-demo-title" className="lp-heading text-4xl text-white sm:text-5xl">
            From your video to three thumbnails you can test.
          </h2>
          <ol className="mt-10 space-y-1">
            {STEPS.map((text, index) => {
              const active = index === step;
              const done = step > index;
              return (
                <li
                  key={text}
                  className={`flex gap-4 rounded-xl border-l-2 py-3 pl-4 pr-3 transition-colors duration-500 ${
                    active ? 'border-[#fa7517] bg-white/[0.04]' : 'border-white/10'
                  }`}
                >
                  <span className={`mt-0.5 text-sm tabular-nums transition-colors duration-500 ${active || done ? 'text-[#fa7517]' : 'text-zinc-600'}`}>
                    {index + 1}
                  </span>
                  <span className={`text-base leading-snug transition-colors duration-500 ${active ? 'text-white' : done ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    {text}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-8 text-sm leading-relaxed text-zinc-500">
            Example with a made-up channel. On Pro, connect YouTube to see your real click rate before and after.
          </p>
        </div>

        <div ref={stage} className="lg:col-span-8">
          <div className="relative rounded-[22px] border border-white/10 bg-[#0d0d11]/90 shadow-[0_50px_140px_-50px_rgba(250,117,23,0.45)] backdrop-blur">
            <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="ml-3 text-xs text-zinc-500">AI Thumbnails Studio</span>
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src={DEMO.face} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-[#f2b300]/70" />
                  <div className="leading-tight">
                    <p className="text-sm font-semibold text-white">{DEMO.channel}</p>
                    <p className="text-xs text-zinc-500">Channel profile: face, colors, rules</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  {DEMO.swatches.map((color) => (
                    <span key={color} className="h-5 w-5 rounded-full ring-1 ring-white/15" style={{ background: color }} />
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm">
                <Link2 className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
                <span className={`truncate text-zinc-200 ${phase === 0 ? 'lp-caret' : ''}`}>{linkText || ' '}</span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-3">
                {DEMO.ideas.map((idea, index) => {
                  const shown = phase >= 1;
                  const edited = index === 0 && phase >= 3 && 'edited' in idea;
                  return (
                    <div key={idea.src}>
                      <div className="relative aspect-video overflow-hidden rounded-lg bg-white/[0.04] ring-1 ring-white/10">
                        {!shown && <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/[0.06] to-transparent" />}
                        {shown && (
                          <motion.div
                            className="absolute inset-0"
                            initial={reduceMotion ? false : { opacity: 0, scale: 1.06, filter: 'blur(14px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            transition={{ duration: 0.9, delay: index * 0.35, ease: [0.2, 0.7, 0.2, 1] }}
                          >
                            <AnimatePresence initial={false}>
                              <motion.div
                                key={edited ? 'edited' : 'first'}
                                className="absolute inset-0"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.8 }}
                              >
                                <ThumbnailArt
                                  src={edited && 'edited' in idea ? idea.edited : idea.src}
                                  title={idea.title}
                                  place={idea.place}
                                  tone={idea.tone}
                                  alt={idea.alt}
                                  lazy
                                  className="h-full w-full"
                                />
                              </motion.div>
                            </AnimatePresence>
                          </motion.div>
                        )}
                        <AnimatePresence>
                          {edited && (
                            <motion.span
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-[#fa7517] px-2 py-0.5 text-[10px] font-semibold text-white sm:text-[11px]"
                            >
                              <Wand2 className="h-3 w-3" aria-hidden="true" /> Edited
                            </motion.span>
                          )}
                          {index === 1 && phase >= 4 && (
                            <motion.span
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-x-1.5 bottom-1.5 flex items-center gap-1.5 rounded-md bg-black/80 px-2 py-1 text-[10px] text-white backdrop-blur sm:text-[11px]"
                            >
                              <ScanSearch className="h-3 w-3 shrink-0 text-[#fa7517]" aria-hidden="true" />
                              <span className="truncate">
                                <strong className="font-semibold">8/10</strong> · Title reads well at phone size
                              </span>
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                      <p className="mt-2 text-xs text-zinc-500">Idea {index + 1}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div
                  className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors duration-500 ${
                    phase === 2 ? 'border-[#fa7517]/60 bg-[#fa7517]/[0.06]' : 'border-white/10 bg-black/40'
                  }`}
                >
                  <Wand2 className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
                  <span className="shrink-0 text-zinc-500">Idea 1:</span>
                  <span className={`truncate text-zinc-200 ${phase === 2 ? 'lp-caret' : ''}`}>
                    {editText || <span className="text-zinc-600">Change anything in plain words</span>}
                  </span>
                  {phase >= 3 && <Check className="ml-auto h-4 w-4 shrink-0 text-emerald-400" aria-label="Done" />}
                </div>
                <span
                  className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-500 ${
                    phase >= 5 ? 'lp-glow bg-[#fa7517] text-white' : 'bg-white/[0.06] text-zinc-400'
                  }`}
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download 3 for Test &amp; Compare
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudioDemo;
