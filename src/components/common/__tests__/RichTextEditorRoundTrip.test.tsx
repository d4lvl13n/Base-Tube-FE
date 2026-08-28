/**
 * The AI description has to survive the editor.
 *
 * The generator returns plain text with `\n` breaks; the description field is
 * TipTap, which stores HTML; the draft PATCH (`PATCH /videos/uploads/:id`) and
 * the video update (`PUT /videos/:id`) send whatever the editor holds. If a
 * blank line or a `•` is lost anywhere along that chain, the creator's
 * description is quietly rewritten. These tests walk the whole chain.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import RichTextEditor from '../RichTextEditor';
import {
  editorHtmlToPlainText,
  hasEditorContent,
  plainTextToEditorHtml,
} from '../../../utils/descriptionText';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });
});

const AI_DESCRIPTION = [
  'Ten minutes that change how you think about on-chain video.',
  '',
  'We walk through the whole pipeline, end to end.',
  '',
  '• Direct-to-storage uploads',
  '• Token-gated playback',
  '',
  'Subscribe for a build log every week.',
  '',
  '#basetube #web3 #creators',
].join('\n');

describe('plain text <-> editor HTML', () => {
  it('round-trips a YouTube-style description exactly', () => {
    const html = plainTextToEditorHtml(AI_DESCRIPTION);

    expect(html).toContain('<p></p>'); // blank lines are real, empty paragraphs
    expect(html).toContain('<p>• Direct-to-storage uploads</p>');
    expect(editorHtmlToPlainText(html)).toBe(AI_DESCRIPTION);
  });

  it('escapes text that would otherwise be read as markup', () => {
    const text = 'Tips & tricks\n\n<not a tag>';
    const html = plainTextToEditorHtml(text);

    expect(html).toBe('<p>Tips &amp; tricks</p><p></p><p>&lt;not a tag&gt;</p>');
    expect(editorHtmlToPlainText(html)).toBe(text);
  });

  it('leaves plain text that never went through the editor alone', () => {
    expect(editorHtmlToPlainText('just words\n\nand more')).toBe('just words\n\nand more');
  });

  it('knows an empty editor from one with words in it', () => {
    expect(hasEditorContent('')).toBe(false);
    expect(hasEditorContent('<p></p>')).toBe(false);
    expect(hasEditorContent('<p><br></p>')).toBe(false);
    expect(hasEditorContent('<p>a draft</p>')).toBe(true);
  });
});

describe('TipTap serialisation', () => {
  /**
   * This is the exact chain that reaches the API: the component hands
   * `plainTextToEditorHtml` output to TipTap, and whatever `getHTML()` then
   * returns is what `PATCH /videos/uploads/:id` and `PUT /videos/:id` send.
   */
  it('keeps the blank lines and the bullets through getHTML()', () => {
    const editor = new Editor({
      extensions: [StarterKit.configure({ heading: { levels: [1, 2] } })],
      content: plainTextToEditorHtml(AI_DESCRIPTION),
      parseOptions: { preserveWhitespace: 'full' },
    });

    const saved = editor.getHTML();

    // The bullets stay literal text, not a <ul> the generator never asked for.
    expect(saved).not.toContain('<ul>');
    expect(saved).toContain('• Direct-to-storage uploads');
    expect(saved).toContain('#basetube #web3 #creators');
    // And the text that comes back out is byte-for-byte what the AI produced.
    expect(editorHtmlToPlainText(saved)).toBe(AI_DESCRIPTION);

    editor.destroy();
  });
});

describe('RichTextEditor', () => {
  it('takes a description applied from outside (the "Use description" path)', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <RichTextEditor content="" onChange={onChange} placeholder="What is this video about?" />,
    );

    rerender(
      <RichTextEditor
        content={plainTextToEditorHtml(AI_DESCRIPTION)}
        onChange={onChange}
        placeholder="What is this video about?"
      />,
    );

    // The document really changed — the old editor ignored the prop entirely.
    expect(screen.getByText('• Direct-to-storage uploads')).toBeInTheDocument();
    expect(screen.getByText('#basetube #web3 #creators')).toBeInTheDocument();
    // The parent already holds this value, so it is not echoed back at it.
    expect(onChange).not.toHaveBeenCalled();
  });
});
