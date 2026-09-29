import React from 'react';
import { Bot, CircleDollarSign, EyeOff } from 'lucide-react';

const PROBLEMS = [
  {
    Icon: EyeOff,
    title: 'You can’t tell why people scroll past',
    text: 'Your thumbnail looks fine to you, and your click rate says otherwise. There’s no feedback before you publish.',
  },
  {
    Icon: CircleDollarSign,
    title: 'A designer costs $10 to $100 per thumbnail',
    text: 'And testing on YouTube needs three per video.',
  },
  {
    Icon: Bot,
    title: 'AI thumbnails look like AI',
    text: 'Viewers scroll past the plastic look. Ours start from your video and your real face.',
  },
];

const ProblemSection: React.FC = () => (
  <section aria-labelledby="landing-problem-title" className="py-20 sm:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 id="landing-problem-title" className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Why thumbnails eat your week
      </h2>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {PROBLEMS.map(({ Icon, title, text }) => (
          <article key={title} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fa7517]/10">
              <Icon className="h-5 w-5 text-[#fa7517]" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{text}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default ProblemSection;
