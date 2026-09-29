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
  <section id="features" aria-labelledby="landing-features-title" className="scroll-mt-16 border-t border-white/[0.06] py-24 sm:py-32">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <h2 id="landing-features-title" className="lp-heading text-4xl text-white sm:text-5xl">
        Everything in one place.
      </h2>
      <ul className="mt-14 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ Icon, title, text }) => (
          <li key={title} className="flex gap-4 border-t border-white/[0.08] py-7">
            <Icon className="mt-1 h-5 w-5 shrink-0 text-[#fa7517]" aria-hidden="true" />
            <span>
              <span className="block text-lg font-semibold text-white">{title}</span>
              <span className="mt-1.5 block text-base leading-relaxed text-zinc-400">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default ThumbnailFeatures;
