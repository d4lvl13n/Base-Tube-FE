import React from 'react';

/** One run of text, either inside a `<mark>` or outside it. */
export interface HighlightSegment {
  text: string;
  marked: boolean;
}

const MARK_TOKEN = /<\/?mark>/g;

/**
 * Splits server-marked text into plain runs.
 *
 * The search API returns titles and descriptions with `<mark>` around the
 * matched terms. That is a string, not markup we trust: everything else in it
 * is user-supplied video metadata. So we tokenise on the mark tags only and
 * hand the runs back as text — the caller renders them as React children,
 * which escapes anything else the string happens to contain.
 *
 * Unbalanced tags degrade quietly: a stray `</mark>` closes nothing and a
 * dangling `<mark>` marks the rest of the string.
 */
export function splitHighlight(text: string): HighlightSegment[] {
  const segments: HighlightSegment[] = [];
  let depth = 0;
  let cursor = 0;

  MARK_TOKEN.lastIndex = 0;
  let match = MARK_TOKEN.exec(text);
  while (match !== null) {
    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index), marked: depth > 0 });
    }
    depth = match[0] === '<mark>' ? depth + 1 : Math.max(0, depth - 1);
    cursor = match.index + match[0].length;
    match = MARK_TOKEN.exec(text);
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), marked: depth > 0 });
  }
  return segments;
}

interface HighlightProps {
  /** Text that may contain `<mark>` tags. */
  text: string;
  className?: string;
}

/**
 * Renders search-highlighted text.
 *
 * Deliberately not `dangerouslySetInnerHTML`: the marks are drawn here, from
 * parsed runs, so no server string ever reaches the DOM as markup.
 */
const Highlight: React.FC<HighlightProps> = ({ text, className }) => (
  <span className={className}>
    {splitHighlight(text).map((segment, index) =>
      segment.marked ? (
        <mark key={index} className="bg-transparent font-semibold text-[#fa7517]">
          {segment.text}
        </mark>
      ) : (
        <React.Fragment key={index}>{segment.text}</React.Fragment>
      )
    )}
  </span>
);

export default Highlight;
