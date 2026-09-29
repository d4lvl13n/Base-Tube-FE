import React from 'react';

const STEPS = [
  'Paste your link, script or idea',
  'Get three ideas in your channel’s style',
  'Edit in plain words, or get a review',
  'Download all three and run Test & Compare',
];

const HowItWorks: React.FC = () => (
  <section aria-labelledby="landing-how-title" className="py-20 sm:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 id="landing-how-title" className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How it works
      </h2>
      <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li key={step} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#fa7517]/40 text-sm font-semibold text-[#fa7517]">
              {index + 1}
            </span>
            <p className="mt-4 text-base font-medium text-white">{step}</p>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-center text-sm text-zinc-400">On Pro, connect YouTube to see your real click rate before and after.</p>
    </div>
  </section>
);

export default HowItWorks;
