import React from 'react';
import { ExternalLink } from 'lucide-react';
import { CREATOR_QUOTES, type CreatorQuote } from './landingContent';

const PROBLEMS = [
  { title: 'No feedback before you publish.', text: 'Your thumbnail looks fine to you. Your click rate says otherwise, a week later.' },
  { title: 'A designer costs $10 to $100 a thumbnail.', text: 'And testing on YouTube takes three per video.' },
  { title: 'AI thumbnails look like AI.', text: 'Viewers scroll past the plastic look in a split second.' },
];

function QuoteCard({ quote, copy }: { quote: CreatorQuote; copy: boolean }) {
  return (
    <figure className="flex w-[330px] shrink-0 flex-col justify-between rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 sm:w-[380px]">
      <blockquote className="text-[1.05rem] leading-relaxed text-zinc-100">“{quote.text}”</blockquote>
      <figcaption className="mt-5">
        <a
          href={quote.url}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={copy ? -1 : undefined}
          aria-label={`${quote.subreddit} thread (opens in a new tab)`}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-[#fb923c]"
        >
          {quote.subreddit}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </figcaption>
    </figure>
  );
}

/** One band of quotes drifting sideways; its set is repeated for a seamless loop (the repeat is hidden from screen readers). */
function Band({ quotes, reverse, seconds }: { quotes: CreatorQuote[]; reverse?: boolean; seconds: number }) {
  return (
    <div className="lp-band overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className={`lp-drift ${reverse ? 'lp-reverse' : ''}`} style={{ ['--lp-drift' as string]: `${seconds}s` }}>
        <ul className="flex gap-4 pr-4">
          {quotes.map((quote) => (
            <li key={quote.url}>
              <QuoteCard quote={quote} copy={false} />
            </li>
          ))}
        </ul>
        <ul className="flex gap-4 pr-4" aria-hidden="true">
          {quotes.map((quote) => (
            <li key={quote.url}>
              <QuoteCard quote={quote} copy />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** The problem in three lines, then real quotes from public Reddit threads, each linking to its thread. Not reviews of the product. */
const CreatorQuotes: React.FC = () => {
  const half = Math.ceil(CREATOR_QUOTES.length / 2);
  return (
    <section aria-labelledby="landing-quotes-title" className="border-t border-white/[0.06] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <h2 id="landing-quotes-title" className="lp-heading max-w-3xl text-4xl text-white sm:text-5xl">
          Thumbnail day, in creators’ own words.
        </h2>
        <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-0 md:divide-x md:divide-white/[0.08]">
          {PROBLEMS.map(({ title, text }) => (
            <div key={title} className="md:px-8 md:first:pl-0 md:last:pr-0">
              <p className="text-xl font-semibold leading-snug text-white">{title}</p>
              <p className="mt-3 text-base leading-relaxed text-zinc-400">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 space-y-4">
        <Band quotes={CREATOR_QUOTES.slice(0, half)} seconds={70} />
        <Band quotes={CREATOR_QUOTES.slice(half)} reverse seconds={80} />
      </div>
      <p className="mx-auto mt-8 max-w-7xl px-5 text-sm text-zinc-500 sm:px-8">
        From public Reddit threads about YouTube thumbnails. These are not reviews of AI Thumbnails.
      </p>
    </section>
  );
};

export default CreatorQuotes;
