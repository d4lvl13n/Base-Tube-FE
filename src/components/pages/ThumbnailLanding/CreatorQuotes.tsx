import React from 'react';
import { Check, ExternalLink } from 'lucide-react';
import { CREATOR_QUOTES, type CreatorQuote } from './landingContent';
import { FadeIn, RevealHeading, useSeen } from './motionKit';

// What changes for the creator: outcomes, not features.
const OUTCOMES = [
  { title: 'Publish with confidence.', text: 'A review tells you what is weak and what to change, before the video goes live.' },
  { title: 'Three strong options, every video.', text: 'Finished thumbnails for YouTube’s Test & Compare, so the data picks the winner, not your gut.' },
  { title: 'Look like you, not like AI.', text: 'Your face, your colors and your style on every idea, so viewers know it is your channel.' },
];

// Three kinds of note, taking turns, each a little tilted: white paper, solid orange, dark with an orange edge.
const LOOKS = [
  { card: 'bg-[#fafafa] text-zinc-950', mark: 'rgba(250,117,23,0.55)', glyph: 'text-[#fa7517]', badge: 'text-zinc-600', dot: 'bg-[#fa7517] text-white' },
  { card: 'bg-[#fa7517] text-black', mark: 'rgba(255,255,255,0.6)', glyph: 'text-black/25', badge: 'text-black/70', dot: 'bg-black text-[#fa7517]' },
  { card: 'bg-[#121217] text-white ring-1 ring-white/10 border-l-4 border-[#fa7517]', mark: 'rgba(250,117,23,0.5)', glyph: 'text-[#fa7517]/60', badge: 'text-zinc-400', dot: 'bg-[#fa7517] text-black' },
];
const TILTS = ['-rotate-[1.6deg]', 'rotate-[1.2deg]', '-rotate-[0.6deg]', 'rotate-[1.8deg]', '-rotate-[1.2deg]', 'rotate-[0.8deg]'];

function Marked({ quote, on, color }: { quote: CreatorQuote; on: boolean; color: string }) {
  const at = quote.text.indexOf(quote.mark);
  if (at < 0) return <>{quote.text}</>;
  return (
    <>
      {quote.text.slice(0, at)}
      <span className={`lp-mark ${on ? 'lp-on' : ''}`} style={{ backgroundImage: `linear-gradient(${color}, ${color})` }}>
        {quote.mark}
      </span>
      {quote.text.slice(at + quote.mark.length)}
    </>
  );
}

function QuoteNote({ quote, index, copy, on }: { quote: CreatorQuote; index: number; copy: boolean; on: boolean }) {
  const look = LOOKS[index % LOOKS.length];
  return (
    <figure
      className={`relative flex w-[320px] shrink-0 flex-col justify-between overflow-hidden rounded-[18px] p-7 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)] transition-transform duration-500 hover:rotate-0 hover:scale-[1.03] sm:w-[370px] ${look.card} ${TILTS[index % TILTS.length]}`}
    >
      <span aria-hidden="true" className={`pointer-events-none absolute -right-2 -top-8 font-['Anton'] text-[9rem] leading-none ${look.glyph}`}>
        ”
      </span>
      <blockquote className="relative text-xl font-semibold leading-snug">
        <Marked quote={quote} on={on} color={look.mark} />
      </blockquote>
      <figcaption className="relative mt-6 flex items-center gap-2.5">
        <span aria-hidden="true" className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black ${look.dot}`}>
          r/
        </span>
        <a
          href={quote.url}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={copy ? -1 : undefined}
          aria-label={`${quote.subreddit} thread (opens in a new tab)`}
          className={`inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline ${look.badge}`}
        >
          {quote.subreddit.replace(/^r\//, '')}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </figcaption>
    </figure>
  );
}

/** One band of notes drifting sideways; its set is repeated for a seamless loop (the repeat is hidden from screen readers). */
function Band({ quotes, offset, reverse, seconds, on }: { quotes: CreatorQuote[]; offset: number; reverse?: boolean; seconds: number; on: boolean }) {
  return (
    <div className="lp-band overflow-hidden py-6 [mask-image:linear-gradient(to_right,transparent,black_7%,black_93%,transparent)]">
      <div className={`lp-drift ${reverse ? 'lp-reverse' : ''}`} style={{ ['--lp-drift' as string]: `${seconds}s` }}>
        {[false, true].map((copy) => (
          <ul key={String(copy)} className="flex items-center gap-7 pr-7" aria-hidden={copy || undefined}>
            {quotes.map((quote, index) => (
              <li key={quote.url}>
                <QuoteNote quote={quote} index={offset + index} copy={copy} on={on} />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/** The outcome in three lines, then what creators say about thumbnail day: real quotes from public Reddit threads, each linking to its thread. */
const CreatorQuotes: React.FC = () => {
  const [bands, seen] = useSeen<HTMLDivElement>(0.3);
  const half = Math.ceil(CREATOR_QUOTES.length / 2);
  return (
    <section aria-labelledby="landing-quotes-title" className="border-t border-white/[0.06] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <RevealHeading
          id="landing-quotes-title"
          className="lp-heading max-w-3xl text-4xl text-white sm:text-6xl"
          parts={['Thumbnail day, ', { accent: 'done in minutes.' }]}
        />
        <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-0 md:divide-x md:divide-white/[0.08]">
          {OUTCOMES.map(({ title, text }, index) => (
            <FadeIn key={title} delay={index * 0.12} className="md:px-8 md:first:pl-0 md:last:pr-0">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fa7517] text-white shadow-[0_8px_30px_-8px_rgba(250,117,23,0.8)]">
                <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
              </span>
              <p className="mt-5 text-xl font-semibold leading-snug text-white">{title}</p>
              <p className="mt-3 text-base leading-relaxed text-zinc-400">{text}</p>
            </FadeIn>
          ))}
        </div>
      </div>

      <p className="mx-auto mt-20 max-w-7xl px-5 text-lg font-medium text-zinc-400 sm:px-8">
        What creators say about <span className="text-white">thumbnail day</span>:
      </p>
      <div ref={bands} className="mt-4">
        <Band quotes={CREATOR_QUOTES.slice(0, half)} offset={0} seconds={75} on={seen} />
        <Band quotes={CREATOR_QUOTES.slice(half)} offset={half + 1} reverse seconds={85} on={seen} />
      </div>
    </section>
  );
};

export default CreatorQuotes;
