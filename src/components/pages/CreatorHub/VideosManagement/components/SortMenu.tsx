import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';
import { VideoSortOption } from '../types';
import { button, cx, popover } from '../../Business/businessStyles';

const OPTIONS: { value: VideoSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most_viewed', label: 'Most viewed' },
  { value: 'most_liked', label: 'Most liked' },
];

export function sortLabel(value: VideoSortOption): string {
  return OPTIONS.find((option) => option.value === value)?.label ?? 'Newest';
}

interface SortMenuProps {
  value: VideoSortOption;
  onChange: (value: VideoSortOption) => void;
}

/**
 * The sort control.
 *
 * A native `<select>` drops the operating system's own list over a dark panel
 * — grey on grey on a Mac, a full-screen wheel on iOS — and no amount of
 * styling reaches inside it. This is the same Radix menu the channel selector
 * and the row's overflow use, so the page has one menu, not two.
 */
export const SortMenu: React.FC<SortMenuProps> = ({ value, onChange }) => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>
      <button type="button" aria-label="Sort" className={cx(button.secondary, 'group')}>
        <span className="text-gray-400">Sort</span>
        {sortLabel(value)}
        <ChevronDown
          className="h-3.5 w-3.5 text-gray-400 transition-transform duration-200 motion-reduce:transition-none
                     group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </button>
    </DropdownMenu.Trigger>

    <DropdownMenu.Portal>
      <DropdownMenu.Content align="end" sideOffset={6} className={cx(popover.menu, 'min-w-[10rem]')}>
        {OPTIONS.map((option) => {
          const active = option.value === value;
          return (
            <DropdownMenu.Item
              key={option.value}
              onSelect={() => onChange(option.value)}
              className={cx(
                popover.item,
                'justify-between gap-6',
                active && 'text-[#fa7517] data-[highlighted]:text-[#fa7517]',
              )}
            >
              {option.label}
              {active && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
            </DropdownMenu.Item>
          );
        })}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
);

export default SortMenu;
