import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { descriptionToPlainText } from '../../../utils/descriptionText';

/**
 * A video description, rendered the way it was written.
 *
 * The editor stores one `<p>` per line, an empty `<p></p>` per blank line and
 * bullet lines as literal `•` text. Handing that to `dangerouslySetInnerHTML`
 * produced a wall of text — the app has no typography plugin, so Tailwind's
 * preflight zeroes every `p` margin and the paragraphs ran together
 * ("…filmées en 4KAbonnez-vous…"). Stripping the tags instead glued the words.
 *
 * So neither: the description is parsed back to lines and rendered as React
 * nodes. Nothing from the description is ever interpreted as markup, which is
 * also why there is no sanitiser here — there is nothing to sanitise.
 */

/** A bullet line, whichever glyph the creator (or the generator) used. */
const BULLET_PATTERN = /^\s*[•·▪‣-]\s+/;

/** A line that is nothing but hashtags — YouTube's trailing tag line. */
const HASHTAG_LINE_PATTERN = /^#[\wÀ-ɏЀ-ӿ-]+(\s+#[\wÀ-ɏЀ-ӿ-]+)*$/;

/**
 * Only an explicit scheme is autolinked.
 *
 * A bare `www.` had to be given a scheme to be usable, which means guessing
 * `https://` on the creator's behalf — and it also caught things that were
 * never links, like `www.something` written mid-sentence. If a creator wants
 * a link, they write the scheme.
 */
const URL_PATTERN = /https?:\/\/[^\s<>]+/gi;

/** Punctuation a sentence puts after a URL that is not part of it. */
const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"»]+$/;

type Block =
  | { kind: 'paragraph'; lines: string[] }
  | { kind: 'list'; items: string[] }
  | { kind: 'hashtags'; tags: string[] };

/** How much of a long description the collapsed dock shows. */
const MAX_COLLAPSED_LINES = 4;

/**
 * The other half of "long".
 *
 * Line count alone misses the description written as one unbroken paragraph:
 * it is one line, so it never offered a "Show more" and filled the dock.
 */
const MAX_COLLAPSED_CHARS = 600;

/** Lines -> blocks. Blank lines end a block; bullet runs become one list. */
export function parseDescriptionBlocks(plain: string): Block[] {
  const lines = plain.split('\n');
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: 'paragraph', lines: paragraph });
      paragraph = [];
    }
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.replace(/\s+$/, '');
    if (!line.trim()) {
      flushParagraph();
      return;
    }

    if (BULLET_PATTERN.test(line)) {
      flushParagraph();
      const item = line.replace(BULLET_PATTERN, '');
      const previous = blocks[blocks.length - 1];
      if (previous && previous.kind === 'list') previous.items.push(item);
      else blocks.push({ kind: 'list', items: [item] });
      return;
    }

    // Only the *last* line of the description is treated as a tag line; a
    // hashtag mid-sentence is just a word the creator wrote.
    const isLastContentLine = lines.slice(index + 1).every((rest) => !rest.trim());
    if (isLastContentLine && HASHTAG_LINE_PATTERN.test(line.trim())) {
      flushParagraph();
      blocks.push({
        kind: 'hashtags',
        tags: line.trim().split(/\s+/).map((tag) => tag.replace(/^#/, '')),
      });
      return;
    }

    paragraph.push(line);
  });

  flushParagraph();
  return blocks;
}

/** How many rendered lines a block takes, for the "is this long?" question. */
function blockLineCount(block: Block): number {
  if (block.kind === 'paragraph') return block.lines.length;
  if (block.kind === 'list') return block.items.length;
  return 1;
}

/** Text with its URLs turned into links, as React nodes — never as HTML. */
function linkify(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const pattern = new RegExp(URL_PATTERN.source, 'gi');

  // eslint-disable-next-line no-cond-assign
  while ((match = pattern.exec(text)) !== null) {
    const raw = match[0];
    const trimmed = raw.replace(TRAILING_PUNCTUATION, '');
    const start = match.index;

    if (start > lastIndex) nodes.push(text.slice(lastIndex, start));
    nodes.push(
      <a
        key={`${keyPrefix}-link-${start}`}
        href={trimmed}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#fa7517] underline decoration-[#fa7517]/40 underline-offset-2 hover:decoration-[#fa7517] break-all"
      >
        {trimmed}
      </a>,
    );
    lastIndex = start + trimmed.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

interface DescriptionTextProps {
  /** Editor HTML or legacy plain text — both are accepted. */
  content?: string;
  /** Collapse to the opening block behind a "Show more" when the text is long. */
  collapsible?: boolean;
  /**
   * Show only the opening block, with no toggle.
   *
   * For places that already have their own way in (the player overlay's "View
   * more"). A CSS `line-clamp` cannot do this job any more: the description is
   * a stack of block elements, and `-webkit-line-clamp` only clamps inline
   * content inside a single box.
   */
  previewOnly?: boolean;
  /** What to say when there is no description at all. */
  emptyText?: string;
  className?: string;
}

const DescriptionText: React.FC<DescriptionTextProps> = ({
  content,
  collapsible = false,
  previewOnly = false,
  emptyText = 'No description yet.',
  className = '',
}) => {
  const [expanded, setExpanded] = useState(false);
  const plain = useMemo(() => descriptionToPlainText(content), [content]);
  const blocks = useMemo(() => parseDescriptionBlocks(plain), [plain]);

  if (blocks.length === 0) {
    return <p className={`text-gray-500 italic ${className}`.trim()}>{emptyText}</p>;
  }

  const totalLines = blocks.reduce((sum, block) => sum + blockLineCount(block), 0);
  const isLong = totalLines > MAX_COLLAPSED_LINES || plain.trim().length > MAX_COLLAPSED_CHARS;
  const truncatable = collapsible && !previewOnly && isLong;
  const collapsed = previewOnly || (truncatable && !expanded);
  const visible = collapsed ? blocks.slice(0, 1) : blocks;

  return (
    <div className={className || undefined}>
      {/* Slicing to the opening block is enough when there are several. When
          the whole description is one long block, the slice shows all of it,
          so the clamp is what makes "Show more" mean something. */}
      <div className={collapsed ? 'line-clamp-4' : undefined}>
      {visible.map((block, index) => {
        if (block.kind === 'list') {
          return (
            <ul key={`block-${index}`} className="mb-3 list-none space-y-1 pl-0 last:mb-0">
              {block.items.map((item, itemIndex) => (
                <li key={`block-${index}-item-${itemIndex}`} className="flex gap-2">
                  <span aria-hidden="true" className="select-none text-gray-500">
                    •
                  </span>
                  <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">
                    {linkify(item, `b${index}-i${itemIndex}`)}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.kind === 'hashtags') {
          return (
            <p key={`block-${index}`} className="mb-3 flex flex-wrap gap-x-2 gap-y-1 last:mb-0">
              {block.tags.map((tag) => (
                <Link
                  key={`${tag}`}
                  to={`/search?query=${encodeURIComponent(`#${tag}`)}`}
                  className="text-gray-500 transition-colors hover:text-[#fa7517]"
                >
                  #{tag}
                </Link>
              ))}
            </p>
          );
        }

        return (
          <p key={`block-${index}`} className="mb-3 whitespace-pre-wrap break-words last:mb-0">
            {linkify(block.lines.join('\n'), `b${index}`)}
          </p>
        );
      })}
      </div>

      {truncatable && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1 text-sm font-medium text-gray-400 transition-colors hover:text-[#fa7517]"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
};

export default DescriptionText;
