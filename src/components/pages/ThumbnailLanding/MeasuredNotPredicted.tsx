import React from 'react';
import { LineChart } from 'lucide-react';

const MeasuredNotPredicted: React.FC = () => (
  <section aria-labelledby="landing-measured-title" className="py-16 sm:py-20">
    <div className="mx-auto max-w-3xl px-4 sm:px-6">
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#fa7517]/[0.07] to-transparent p-8 text-center sm:p-10">
        <LineChart className="mx-auto h-7 w-7 text-[#fa7517]" aria-hidden="true" />
        <h2 id="landing-measured-title" className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Measured, not predicted
        </h2>
        <p className="mt-4 text-base leading-relaxed text-zinc-300">
          We don&apos;t predict your click rate. No one can from a single image. We show you what to change, and when you connect YouTube,
          your real numbers before and after.
        </p>
      </div>
    </div>
  </section>
);

export default MeasuredNotPredicted;
