import React from 'react';
import { Check } from 'lucide-react';
import type { SubscriptionCatalog } from '../../../types/subscription';
import ThumbnailArt from './ThumbnailArt';
import { DEMO } from './landingContent';

const FAN = [
  'right-0 top-0 w-[68%] rotate-[4deg]',
  'right-[10%] top-[26%] w-[62%] -rotate-[3deg]',
  'right-[2%] top-[52%] w-[58%] rotate-[2deg]',
];

/** The channel profile: set up once, followed by every idea. Profile counts per plan come from the catalog. */
const ChannelMemory: React.FC<{ catalog: SubscriptionCatalog | undefined }> = ({ catalog }) => {
  const quotas = catalog?.plans.map((plan) => `${plan.channelProfiles} on ${plan.name}`).join(', ');
  return (
    <section aria-labelledby="landing-memory-title" className="border-t border-white/[0.06] py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-2">
        <div className="relative mx-auto aspect-[5/4] w-full max-w-xl" aria-hidden="true">
          {DEMO.ideas.map((idea, index) => (
            <ThumbnailArt
              key={idea.src}
              src={idea.src}
              title={idea.title}
              place={idea.place}
              tone={idea.tone}
              lazy
              className={`absolute rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/10 ${FAN[index]}`}
            />
          ))}
          <div className="absolute bottom-0 left-0 z-10 w-[58%] rounded-2xl border border-white/10 bg-[#101015]/95 p-5 shadow-2xl shadow-black/70 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <img src={DEMO.face} alt="" loading="lazy" className="h-12 w-12 rounded-full object-cover ring-2 ring-[#f2b300]/70" />
              <div className="leading-tight">
                <p className="text-sm font-semibold text-white">{DEMO.channel}</p>
                <p className="text-xs text-zinc-500">Channel profile</p>
              </div>
            </div>
            <div className="mt-4 flex gap-1.5">
              {DEMO.swatches.map((color) => (
                <span key={color} className="h-6 flex-1 rounded-md ring-1 ring-white/10" style={{ background: color }} />
              ))}
            </div>
            <ul className="mt-4 space-y-1.5">
              {DEMO.rules.map((rule) => (
                <li key={rule} className="flex items-center gap-2 text-xs text-zinc-300">
                  <Check className="h-3.5 w-3.5 shrink-0 text-[#fa7517]" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="max-w-xl">
          <h2 id="landing-memory-title" className="lp-heading text-4xl text-white sm:text-5xl">
            It learns your channel.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-zinc-300">
            Set up your channel once: your face, your logo, your colors and your rules. Every idea follows them, so your thumbnails
            look like yours, video after video.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-zinc-400">
            Viewers skip what looks machine-made. Ideas start from your video and your real face, not from a stock look.
          </p>
          {quotas && <p className="mt-8 text-sm text-zinc-500">Channel profiles: {quotas}.</p>}
        </div>
      </div>
    </section>
  );
};

export default ChannelMemory;
