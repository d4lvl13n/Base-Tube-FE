// src/utils/descriptionText.ts

/**
 * Moving a description between the AI generator and the rich-text editor.
 *
 * The generator speaks plain text with `\n` line breaks — a hook, blank-line
 * separated paragraphs, `•` bullet lines, a CTA and a hashtag line. The editor
 * (TipTap) speaks HTML. Neither of them may lose a blank line or a bullet on
 * the way through, so the two conversions here are exact inverses for the
 * shapes the generator produces:
 *
 *   "a\n\n• b"  <->  "<p>a</p><p></p><p>• b</p>"
 *
 * A blank line is its own empty paragraph rather than a `<br>`, because that is
 * what TipTap round-trips through `getHTML()` without rewriting it.
 */

import { decodeHtmlEntities } from './html';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/**
 * Plain text with `\n` breaks -> editor HTML.
 *
 * One paragraph per line, empty paragraphs for blank lines. Bullet lines keep
 * their literal `•` — they are deliberately NOT turned into `<ul>`, so that the
 * text the creator approved in the panel is the text that gets saved.
 */
export const plainTextToEditorHtml = (value?: string): string => {
  if (!value) return '';

  return value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => {
      const trimmedEnd = line.replace(/\s+$/, '');
      return trimmedEnd ? `<p>${escapeHtml(trimmedEnd)}</p>` : '<p></p>';
    })
    .join('');
};

/**
 * Editor HTML -> plain text with `\n` breaks.
 *
 * The inverse of {@link plainTextToEditorHtml}: block ends become newlines,
 * `<br>` becomes a newline, list items regain a `•`, and nothing is collapsed —
 * a blank line the creator wrote is a blank line the generator is told about.
 */
export const editorHtmlToPlainText = (value?: string): string => {
  if (!value) return '';
  // Already plain text (the AI draft before it reaches the editor, or a legacy
  // description that was never HTML) — hand it back untouched.
  if (!/[<&]/.test(value)) return value;

  const withBreaks = value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  return decodeHtmlEntities(withBreaks).replace(/\n+$/, '');
};

/** Does this editor value hold anything a creator would mind losing? */
export const hasEditorContent = (value?: string): boolean =>
  editorHtmlToPlainText(value).trim().length > 0;
