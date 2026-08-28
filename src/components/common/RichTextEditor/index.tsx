import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import EditorMenuBar from './EditorMenuBar';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start writing...',
  className = '',
  minHeight = '200px'
}) => {
  /**
   * The last HTML this editor itself produced.
   *
   * TipTap only reads `content` when it mounts, so a parent that sets the
   * description from somewhere else (the AI assistant applying a draft) would
   * otherwise be ignored. Comparing against what the editor last emitted keeps
   * the sync one-way: typing never re-enters the document (which would move the
   * caret), only a genuinely external value does.
   */
  const lastEmittedRef = useRef<string>(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#fa7517] underline cursor-pointer',
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: `prose prose-invert max-w-none focus:outline-none ${className}`,
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastEmittedRef.current = html;
      onChange(html);
    },
    parseOptions: {
      preserveWhitespace: 'full',
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (content === lastEmittedRef.current) return;
    lastEmittedRef.current = content;
    // `emitUpdate: false` \u2014 the parent already holds this value, so echoing it
    // back through `onChange` would be a pointless render. `preserveWhitespace`
    // matches the parse options so blank paragraphs survive the round trip.
    editor.commands.setContent(content ?? '', false, { preserveWhitespace: 'full' });
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full rounded-lg border border-gray-800/30 bg-gray-900/50 overflow-hidden">
      <EditorMenuBar editor={editor} />
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichTextEditor; 