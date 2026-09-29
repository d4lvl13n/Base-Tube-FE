import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

/** A headline part: white, or the orange accent (its gradient drifts slowly). */
export type HeadingPart = string | { accent: string };

const EASE = [0.2, 0.7, 0.2, 1] as const;

/**
 * A headline whose words rise into place the first time it scrolls into view, white words and
 * orange accent phrases alternating. Plain text for screen readers; still with reduced motion.
 */
export function RevealHeading({
  parts,
  as: Tag = 'h2',
  id,
  className = '',
  delay = 0,
  immediate = false,
}: {
  parts: HeadingPart[];
  as?: 'h1' | 'h2';
  id?: string;
  className?: string;
  delay?: number;
  /** Animate on mount (the hero) instead of on scroll. */
  immediate?: boolean;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduceMotion = useReducedMotion();
  const play = immediate || inView;
  const label = parts.map((part) => (typeof part === 'string' ? part : part.accent)).join('');

  let index = 0;
  const words = parts.flatMap((part, partIndex) => {
    const accent = typeof part !== 'string';
    const text = typeof part === 'string' ? part : part.accent;
    return text.split(/(\s+)/).filter(Boolean).map((chunk, chunkIndex) => {
      if (/^\s+$/.test(chunk)) return <React.Fragment key={`${partIndex}-${chunkIndex}`}>{chunk}</React.Fragment>;
      const order = index++;
      return (
        <motion.span
          key={`${partIndex}-${chunkIndex}`}
          className={`inline-block ${accent ? 'lp-accent lp-accent-live' : ''}`}
          initial={reduceMotion ? false : { opacity: 0, y: '0.5em', filter: 'blur(10px)' }}
          animate={play || reduceMotion ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined}
          transition={{ duration: 0.75, delay: delay + order * 0.06, ease: EASE }}
        >
          {chunk}
        </motion.span>
      );
    });
  });

  return (
    <Tag ref={ref} id={id} className={className} aria-label={label}>
      <span aria-hidden="true">{words}</span>
    </Tag>
  );
}

/** Fades and rises into place once, when scrolled into view. */
export function FadeIn({ children, delay = 0, className = '', y = 24 }: { children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Counts from zero up to the number inside `value` ("$24", "7") when it scrolls into view. */
export function CountUp({ value, className = '' }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.8 });
  const reduceMotion = useReducedMotion();
  const match = /^(\D*)(\d+)(.*)$/.exec(value);
  const target = match ? Number(match[2]) : 0;
  const [shown, setShown] = useState(reduceMotion || !match ? target : 0);

  useEffect(() => {
    if (!match || reduceMotion || !inView) return undefined;
    const start = performance.now();
    const duration = 1400;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setShown(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduceMotion, target]);

  if (!match) return <span className={className}>{value}</span>;
  return (
    <span ref={ref} className={className} aria-label={value}>
      <span aria-hidden="true">
        {match[1]}
        {shown}
        {match[3]}
      </span>
    </span>
  );
}

/** True once the element has scrolled into view (for CSS-driven effects such as the highlighter). */
export function useSeen<T extends Element>(amount = 0.5): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const seen = useInView(ref, { once: true, amount });
  return [ref, seen];
}
