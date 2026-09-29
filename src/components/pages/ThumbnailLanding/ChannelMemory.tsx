import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Check } from 'lucide-react';
import type { SubscriptionCatalog } from '../../../types/subscription';
import ThumbnailArt from './ThumbnailArt';
import { DEMO } from './landingContent';
import { FadeIn, RevealHeading } from './motionKit';

const FAN = [
  { place: 'right-0 top-0 w-[68%]', tilt: 4, speed: -40, float: '0s' },
  { place: 'right-[10%] top-[26%] w-[62%]', tilt: -3, speed: -80, float: '1.2s' },
  { place: 'right-[2%] top-[52%] w-[58%]', tilt: 2, speed: -120, float: '2.4s' },
];

/** The channel profile: set up once, followed by every idea. The thumbnails float and drift apart as the page scrolls. */
const ChannelMemory: React.FC<{ catalog: SubscriptionCatalog | undefined }> = ({ catalog }) => {
  const reduceMotion = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: stage, offset: ['start end', 'end start'] });
  const shifts = [
    useTransform(scrollYProgress, [0, 1], [60, FAN[0].speed]),
    useTransform(scrollYProgress, [0, 1], [90, FAN[1].speed]),
    useTransform(scrollYProgress, [0, 1], [120, FAN[2].speed]),
  ];
  const quotas = catalog?.plans.map((plan) => `${plan.channelProfiles} on ${plan.name}`).join(', ');

  return (
    <section aria-labelledby="landing-memory-title" className="relative overflow-hidden border-t border-white/[0.06] py-24 sm:py-32">
      <div aria-hidden="true" className="absolute -left-40 top-1/4 -z-10 h-[420px] w-[520px] rounded-full bg-[#f2b300]/[0.06] blur-[130px]" />
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-2">
        <div ref={stage} className="relative mx-auto aspect-[5/4] w-full max-w-xl" aria-hidden="true">
          {DEMO.ideas.map((idea, index) => (
            <motion.div
              key={idea.src}
              className={`absolute ${FAN[index].place}`}
              style={reduceMotion ? { rotate: FAN[index].tilt } : { rotate: FAN[index].tilt, y: shifts[index] }}
            >
              <div className="lp-float" style={{ animationDelay: FAN[index].float }}>
                <ThumbnailArt
                  src={idea.src}
                  title={idea.title}
                  place={idea.place}
                  tone={idea.tone}
                  lazy
                  className="rounded-xl shadow-2xl shadow-black/70 ring-1 ring-white/10"
                />
              </div>
            </motion.div>
          ))}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: -30, rotate: -4 }}
            whileInView={{ opacity: 1, x: 0, rotate: -2 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
            className="absolute bottom-0 left-0 z-10 w-[58%] rounded-2xl border border-white/10 bg-[#101015]/95 p-5 shadow-2xl shadow-black/80 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <img src={DEMO.face} alt="" loading="lazy" className="h-12 w-12 rounded-full object-cover ring-2 ring-[#f2b300]/70" />
              <div className="leading-tight">
                <p className="text-sm font-semibold text-white">{DEMO.channel}</p>
                <p className="text-xs text-[#fa7517]">Channel profile</p>
              </div>
            </div>
            <div className="mt-4 flex gap-1.5">
              {DEMO.swatches.map((color, index) => (
                <motion.span
                  key={color}
                  initial={reduceMotion ? false : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.12 }}
                  className="h-6 flex-1 origin-left rounded-md ring-1 ring-white/10"
                  style={{ background: color }}
                />
              ))}
            </div>
            <ul className="mt-4 space-y-1.5">
              {DEMO.rules.map((rule, index) => (
                <motion.li
                  key={rule}
                  initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.9 + index * 0.25 }}
                  className="flex items-center gap-2 text-xs text-zinc-300"
                >
                  <Check className="h-3.5 w-3.5 shrink-0 text-[#fa7517]" />
                  {rule}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div className="max-w-xl">
          <RevealHeading
            id="landing-memory-title"
            className="lp-heading text-4xl text-white sm:text-6xl"
            parts={['It learns ', { accent: 'your channel.' }]}
          />
          <FadeIn delay={0.2}>
            <p className="mt-6 text-lg leading-relaxed text-zinc-300">
              Set up your channel once: <span className="font-semibold text-white">your face, your logo, your colors and your rules.</span>{' '}
              Every idea follows them, so your thumbnails look like <span className="font-semibold text-[#ff9a3c]">yours</span>, video after
              video.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-zinc-400">
              Viewers skip what looks machine-made. Ideas start from your video and your real face, not from a stock look.
            </p>
            {quotas && <p className="mt-8 text-sm text-zinc-500">Channel profiles: {quotas}.</p>}
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default ChannelMemory;
