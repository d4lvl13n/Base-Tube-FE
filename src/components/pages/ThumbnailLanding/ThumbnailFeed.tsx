import React, { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { EXAMPLE_THUMBNAILS, type ExampleThumbnail } from './landingContent';

/** 30 cards per screen of feed: full rows at 3, 5 and 6 columns, the only layouts used. */
const SLOTS = 30;
const CARDS: ExampleThumbnail[] = Array.from({ length: SLOTS }, (_, index) => EXAMPLE_THUMBNAILS[(index * 7) % EXAMPLE_THUMBNAILS.length]);

function FeedCard({ thumb, hot, lazy }: { thumb: ExampleThumbnail; hot: boolean; lazy: boolean }) {
  return (
    <div className={`lp-feed-card ${hot ? 'lp-feed-hot' : ''}`}>
      <div className="lp-feed-thumb relative aspect-video overflow-hidden rounded-xl bg-zinc-900">
        <img src={thumb.src} alt="" loading={lazy ? 'lazy' : 'eager'} decoding="async" className="absolute inset-0 h-full w-full object-cover" />
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1 py-px text-[11px] font-semibold text-white">{thumb.duration}</span>
      </div>
      <div className="mt-3 flex gap-3">
        {thumb.avatar ? (
          <img src={thumb.avatar} alt="" loading={lazy ? 'lazy' : 'eager'} decoding="async" className="h-9 w-9 shrink-0 rounded-full bg-white object-cover" />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold text-white">{thumb.channel[0]}</span>
        )}
        <div className="min-w-0">
          <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-zinc-100">{thumb.title}</p>
          <p className="mt-1 truncate text-[13px] text-zinc-400">{thumb.channel}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * The hero's background: a YouTube home feed made only of AI Thumbnails examples, scrolling up
 * slowly (the set twice, so the loop is seamless). Every few seconds one card lights up, the way
 * one thumbnail catches the eye in a feed. Decorative: hidden from screen readers; still under
 * reduced motion.
 */
const ThumbnailFeed: React.FC<{ className?: string }> = ({ className = '' }) => {
  const reduceMotion = useReducedMotion();
  const [hot, setHot] = useState(-1);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const timer = window.setInterval(() => {
      setHot((previous) => {
        const next = Math.floor(Math.random() * (SLOTS - 1));
        return next >= previous ? next + 1 : next;
      });
    }, 2400);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* The feed lies on a tilted plane: it recedes behind the headline instead of facing it. */}
      <div className="lp-feed-plane absolute inset-x-[-22%] top-[-18%]">
        <div className="lp-feed px-5">
          {[0, 1].map((copy) => (
            <div key={copy} className="grid grid-cols-3 gap-x-4 gap-y-9 pb-9 md:grid-cols-5 xl:grid-cols-6">
              {CARDS.map((thumb, index) => (
                <FeedCard key={`${copy}-${index}`} thumb={thumb} hot={index === hot} lazy={copy === 1} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThumbnailFeed;
