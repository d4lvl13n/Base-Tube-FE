import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
} from 'lucide-react';

interface EditorMenuBarProps {
  editor: Editor;
}

const EditorMenuBar: React.FC<EditorMenuBarProps> = ({ editor }) => {
  const [isLinkModalOpen, setIsLinkModalOpen] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState('');

  const setLink = () => {
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .setLink({ href: linkUrl })
        .run();
    }
    setIsLinkModalOpen(false);
    setLinkUrl('');
  };

  const MenuButton: React.FC<{
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }> = ({ onClick, isActive, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/50 ${
        isActive 
          ? 'bg-[#fa7517]/15 text-[#fa7517]' 
          : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'
      }`}
      title={title}
      aria-label={title}
      aria-pressed={isActive ? true : undefined}
    >
      {children}
    </button>
  );

  return (
    <div className="border-b border-gray-800/60 p-2 flex flex-wrap gap-1">
      <MenuButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold"
      >
        <Bold className="w-5 h-5" />
      </MenuButton>

      <MenuButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic"
      >
        <Italic className="w-5 h-5" />
      </MenuButton>

      <MenuButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List className="w-5 h-5" />
      </MenuButton>

      <MenuButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <ListOrdered className="w-5 h-5" />
      </MenuButton>

      <MenuButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Quote"
      >
        <Quote className="w-5 h-5" />
      </MenuButton>

      <div className="relative">
        <MenuButton
          onClick={() => setIsLinkModalOpen(true)}
          isActive={editor.isActive('link')}
          title="Add Link"
        >
          <LinkIcon className="w-5 h-5" />
        </MenuButton>

        {editor.isActive('link') && (
          <MenuButton
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove Link"
          >
            <Unlink className="w-5 h-5" />
          </MenuButton>
        )}

        {isLinkModalOpen && (
          <div className="absolute top-full left-0 mt-2 p-2 bg-black rounded-lg shadow-[0_16px_40px_rgba(0,0,0,0.7)] border border-gray-800 z-50">
            <input
              type="url"
              placeholder="Enter URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="h-8 rounded-md border border-gray-800 bg-black/40 px-2 text-sm text-white placeholder:text-gray-500 focus-visible:border-[#fa7517]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517]/30"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setLink();
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorMenuBar; 