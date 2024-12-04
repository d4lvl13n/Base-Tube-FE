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
import { motion } from 'framer-motion';

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
    <motion.button
      type="button"
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors ${
        isActive 
          ? 'bg-[#fa7517]/20 text-[#fa7517]' 
          : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={title}
    >
      {children}
    </motion.button>
  );

  return (
    <div className="border-b border-gray-800/30 p-2 flex flex-wrap gap-1">
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
          <div className="absolute top-full left-0 mt-2 p-2 bg-gray-900 rounded-lg shadow-lg border border-gray-800 z-50">
            <input
              type="url"
              placeholder="Enter URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-white text-sm"
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