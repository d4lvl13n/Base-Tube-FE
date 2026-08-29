import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';
import { VideoSortOption } from '../types';

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
      <button
        type="button"
        aria-label="Sort"
        className="group inline-flex items-center gap-1.5 rounded-lg border border-gray-800/60
                   bg-white/5 px-3 py-1.5 text-sm text-gray-300 transition-colors
                   hover:border-gray-700 hover:text-white focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-[#fa7517]/40"
      >
        <span className="text-gray-500">Sort</span>
        {sortLabel(value)}
        <ChevronDown
          className="h-3.5 w-3.5 text-gray-500 transition-transform duration-200
                     group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </button>
    </DropdownMenu.Trigger>

    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align="end"
        sideOffset={6}
        className="z-50 min-w-[10rem] overflow-hidden rounded-lg border border-gray-800/60
                   bg-[#0f0f0f] p-1 shadow-2xl"
      >
        {OPTIONS.map((option) => {
          const active = option.value === value;
          return (
            <DropdownMenu.Item
              key={option.value}
              onSelect={() => onChange(option.value)}
              className={`flex cursor-pointer items-center justify-between gap-6 rounded-md px-2.5
                          py-2 text-sm outline-none transition-colors
                          data-[highlighted]:bg-white/5 ${
                            active ? 'text-[#fa7517]' : 'text-gray-300 data-[highlighted]:text-white'
                          }`}
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
