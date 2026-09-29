import React from 'react';
import { BarChart3, MessageSquareText, ScanSearch, UserSquare, Wand2, Youtube } from 'lucide-react';

// One line per feature for now; each gets its own page later.
const FEATURES = [
  { Icon: Wand2, title: 'Studio', text: 'Three ideas per video from your link, script or brief.' },
  { Icon: UserSquare, title: 'Channel profiles', text: 'Remembers your face, logo, colors and rules.' },
  { Icon: MessageSquareText, title: 'Edits in plain words', text: '“Brighter sky, bigger title.” Done.' },
  { Icon: ScanSearch, title: 'Thumbnail review', text: 'A score from 1 to 10 and exactly what to change.' },
  { Icon: BarChart3, title: 'Channel review', text: 'Your channel’s thumbnails next to channels your size.' },
  { Icon: Youtube, title: 'YouTube connection', text: 'Your real clicks and impressions, before and after.' },
];

const ThumbnailFeatures: React.FC = () => (
  <section id="features" aria-labelledby="landing-features-title" className="scroll-mt-20 bg-white/[0.015] py-20 sm:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 id="landing-features-title" className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Features
      </h2>
      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ Icon, title, text }) => (
          <li key={title} className="flex items-start gap-4 rounded-2xl border border-white/[0.08] bg-[#111113] p-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fa7517]/10">
              <Icon className="h-5 w-5 text-[#fa7517]" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-base font-semibold text-white">{title}</span>
              <span className="mt-1 block text-sm text-zinc-400">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default ThumbnailFeatures;
