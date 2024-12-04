import React from 'react';
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
      onChange(editor.getHTML());
    },
    parseOptions: {
      preserveWhitespace: 'full',
    },
  });

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