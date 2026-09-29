import React from 'react';
import { ExternalLink } from 'lucide-react';
import { CREATOR_QUOTES } from './landingContent';

/** Real quotes from public Reddit threads, each linking to its thread. Not reviews of the product. */
const CreatorQuotes: React.FC = () => (
  <section aria-labelledby="landing-quotes-title" className="bg-white/[0.015] py-20 sm:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 id="landing-quotes-title" className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        In creators’ own words
      </h2>
      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {CREATOR_QUOTES.map((quote) => (
          <li key={quote.url}>
            <figure className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-[#111113] p-6">
              <span aria-hidden="true" className="font-serif text-5xl leading-none text-[#fa7517]/60">
                “
              </span>
              <blockquote className="mt-2 flex-1 text-base leading-relaxed text-zinc-100">{quote.text}</blockquote>
              <figcaption className="mt-5">
                <a
                  href={quote.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${quote.subreddit} thread (opens in a new tab)`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-[#fb923c]"
                >
                  {quote.subreddit}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-center text-xs text-zinc-500">
        Quotes from public Reddit threads about YouTube thumbnails. They are not reviews of AI Thumbnails.
      </p>
    </div>
  </section>
);

export default CreatorQuotes;
