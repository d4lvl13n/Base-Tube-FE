// src/components/pages/CreatorHub/ManagePasses/PassRowActions.tsx
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tooltip from '@radix-ui/react-tooltip';
import { ArrowUpRight, ExternalLink, Link2, MoreHorizontal, Send } from 'lucide-react';
import type { Pass } from '../../../../types/pass';
import { list } from '../shared/hubStyles';
import { copyPassLink, draftHref, isPublished, passHref, publicPassPath } from './passHelpers';

/** An icon button with the tooltip that says what it is. */
const IconAction: React.FC<{
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, onClick, children }) => (
  <Tooltip.Root>
    <Tooltip.Trigger asChild>
      <button type="button" aria-label={label} onClick={onClick} className={list.actionButton}>
        {children}
      </button>
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content className={list.tooltip} sideOffset={6}>
        {label}
        <Tooltip.Arrow className="fill-[#0f0f0f]" />
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
);

/**
 * The controls at the end of a pass row — the same shape as the video list's
 * RowActions: always in the DOM, faded back until the row is hovered or
 * something inside it has focus (`list.revealed` on the caller's `group`).
 */
export const PassRowActions: React.FC<{ pass: Pass }> = ({ pass }) => {
  const navigate = useNavigate();
  const stop = useCallback((event: React.MouseEvent) => event.stopPropagation(), []);
  const published = isPublished(pass);
  const publicPath = publicPassPath(pass);

  return (
    <div className="flex items-center justify-end gap-0.5" onClick={stop}>
      <IconAction label="Copy link" onClick={() => void copyPassLink(pass)}>
        <Link2 className={list.actionIcon} aria-hidden="true" />
      </IconAction>

      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <a
            href={publicPath}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View public page for ${pass.title || 'pass'}`}
            className={list.actionButton}
          >
            <ExternalLink className={list.actionIcon} aria-hidden="true" />
          </a>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className={list.tooltip} sideOffset={6}>
            {published ? 'View public page' : 'Preview public page'}
            <Tooltip.Arrow className="fill-[#0f0f0f]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button" aria-label="More actions" className={list.actionButton}>
            <MoreHorizontal className={list.actionIcon} aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className={list.dropdownMenu.content} align="end" sideOffset={6}>
            <DropdownMenu.Item className={list.dropdownMenu.item} onSelect={() => navigate(passHref(pass))}>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              Open
            </DropdownMenu.Item>
            {!published && (
              <DropdownMenu.Item className={list.dropdownMenu.item} onSelect={() => navigate(draftHref(pass))}>
                <Send className="h-4 w-4" aria-hidden="true" />
                Finish publishing
              </DropdownMenu.Item>
            )}
            <DropdownMenu.Item className={list.dropdownMenu.item} onSelect={() => void copyPassLink(pass)}>
              <Link2 className="h-4 w-4" aria-hidden="true" />
              Copy link
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className={list.dropdownMenu.item}
              onSelect={() => window.open(publicPath, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              {published ? 'View public page' : 'Preview public page'}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
};

export default PassRowActions;
