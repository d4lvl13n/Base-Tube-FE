import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';

export interface HubSelectOption {
  value: string;
  label: string;
  /** Shown before the label (a flag, an avatar). */
  leading?: React.ReactNode;
}

interface HubSelectProps {
  value: string;
  options: readonly HubSelectOption[];
  onChange: (value: string) => void;
  /** Accessible name: what is being chosen. */
  ariaLabel: string;
  placeholder?: string;
  className?: string;
}

/**
 * The Creator Hub's own dropdown, in place of a native `<select>`: the
 * browser's list opens in the operating system's light theme over the dark
 * hub. Radix gives keyboard navigation (arrows, Enter, Escape) and typeahead
 * (type "Sw" to reach Sweden) like the native control.
 */
const HubSelect: React.FC<HubSelectProps> = ({ value, options, onChange, ariaLabel, placeholder = 'Choose…', className }) => {
  const current = options.find((option) => option.value === value) ?? null;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`${ariaLabel}: ${current?.label ?? placeholder}`}
        className={`group inline-flex h-9 min-w-[11rem] items-center gap-2 rounded-md border border-gray-800/60 bg-white/5 px-3 text-sm
                    text-gray-100 outline-none transition-colors hover:border-gray-700 data-[state=open]:border-[#fa7517]/50
                    focus-visible:border-[#fa7517]/40 focus-visible:ring-2 focus-visible:ring-[#fa7517]/20 ${className ?? ''}`}
      >
        {current?.leading}
        <span className={`min-w-0 flex-1 truncate text-left ${current ? '' : 'text-gray-500'}`}>
          {current?.label ?? placeholder}
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-gray-500 transition-transform duration-150 group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={6}
          align="start"
          collisionPadding={16}
          className="z-[70] min-w-[var(--radix-dropdown-menu-trigger-width)] max-w-[20rem] overflow-hidden rounded-xl border border-white/10
                     bg-[#111113] p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
        >
          <div className="max-h-[min(340px,60vh)] overflow-y-auto">
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <DropdownMenu.Item
                  key={option.value}
                  textValue={option.label}
                  onSelect={() => onChange(option.value)}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors
                             data-[highlighted]:bg-white/[0.06]"
                >
                  {option.leading}
                  <span className={`min-w-0 flex-1 truncate ${selected ? 'font-medium text-white' : 'text-gray-200'}`}>
                    {option.label}
                  </span>
                  {selected && <Check className="h-4 w-4 shrink-0 text-[#fa7517]" aria-label="Selected" />}
                </DropdownMenu.Item>
              );
            })}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default HubSelect;
