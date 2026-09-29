import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ctrApi } from '../../../api/ctr';
import { secondaryButton } from './ThumbnailHero';

// An example review on one example thumbnail (made-up channel): where each note points, and what it says.
const EXAMPLE_SRC = '/assets/ai-thumbnails/examples/phone.webp';
const SCORE = 6;
const NOTES = [
  { x: 50, y: 34, text: 'Clear face, clear emotion. Keep it.' },
  { x: 16, y: 46, text: 'The left third is empty: put three or four words of title here.' },
  { x: 73, y: 52, text: 'The phone is dark and turned away. Show its screen: it is what the video is about.' },
];

function ScoreRing({ score }: { score: number }) {
  const radius = 26;
  const length = 2 * Math.PI * radius;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/75 px-4 py-3 backdrop-blur-md">
      <svg viewBox="0 0 64 64" className="h-12 w-12 -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#fa7517" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(score / 10) * length} ${length}`} />
      </svg>
      <div className="leading-tight">
        <p className="text-lg font-bold text-white">
          {score}
          <span className="text-sm font-medium text-zinc-400">/10</span>
        </p>
        <p className="text-xs text-zinc-400">Attention score</p>
      </div>
    </div>
  );
}

/**
 * The thumbnail review: a score from 1 to 10 and what to change, shown on an example; then the
 * honest line on clicks (measured from YouTube, never predicted). Visitors get the free reviews a
 * day the server allows (GET /ctr/quota); a signed-in review uses credits, so "free" is not said.
 */
const ReviewSection: React.FC<{ signedIn: boolean; resolved: boolean }> = ({ signedIn, resolved }) => {
  const quota = useQuery({
    queryKey: ['ctr', 'visitor-quota'],
    queryFn: () => ctrApi.getQuota(),
    staleTime: 5 * 60_000,
    retry: false,
    enabled: resolved && !signedIn,
  });
  const access = quota.data;
  const freeReviews = !signedIn && access?.mode === 'quota' && access.quota.audit.limit > 0 ? access.quota.audit.limit : null;

  return (
    <section aria-labelledby="landing-review-title" className="border-t border-white/[0.06] py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-2">
        <div className="max-w-xl lg:order-2">
          <h2 id="landing-review-title" className="lp-heading text-4xl text-white sm:text-5xl">
            A second opinion before you publish.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-zinc-300">
            Upload any thumbnail and get a score from 1 to 10, with exactly what to change, in plain words.
          </p>
          <ol className="mt-8 space-y-4">
            {NOTES.map((note, index) => (
              <li key={note.text} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fa7517] text-sm font-bold text-white">{index + 1}</span>
                <span className="pt-0.5 text-base leading-relaxed text-zinc-300">{note.text}</span>
              </li>
            ))}
          </ol>
          <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
            <p className="text-lg font-semibold text-white">Measured, not predicted.</p>
            <p className="mt-2 text-base leading-relaxed text-zinc-400">
              No one can predict your click rate from one image, so we don&apos;t. Connect YouTube and see your real numbers before and
              after you change a thumbnail.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/ai-thumbnails/audit" className={secondaryButton}>
              {signedIn ? 'Review a thumbnail' : 'Review a thumbnail free'}
            </Link>
            {freeReviews !== null && (
              <span className="text-sm text-zinc-500">
                {freeReviews} free review{freeReviews === 1 ? '' : 's'} a day, no account needed
              </span>
            )}
          </div>
        </div>

        <figure className="relative lg:order-1">
          <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/10">
            <img src={EXAMPLE_SRC} alt="An example thumbnail: a surprised man holding a new phone" loading="lazy" className="aspect-video w-full object-cover" />
            {NOTES.map((note, index) => (
              <span
                key={note.text}
                aria-hidden="true"
                className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#fa7517] text-sm font-bold text-white shadow-[0_0_0_6px_rgba(250,117,23,0.25)]"
                style={{ left: `${note.x}%`, top: `${note.y}%` }}
              >
                {index + 1}
              </span>
            ))}
          </div>
          <div className="absolute -bottom-6 right-4 sm:right-6">
            <ScoreRing score={SCORE} />
          </div>
          <figcaption className="sr-only">An example review with three notes and a score of {SCORE} out of 10.</figcaption>
        </figure>
      </div>
    </section>
  );
};

export default ReviewSection;
