import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import SidebarTooltip from './SidebarTooltip';
import { useSidebarView } from './SidebarViewContext';

export interface SwitcherOption {
  id: string;
  name: string;
  handle?: string | null;
  imageUrl?: string | null;
}

export interface SidebarSwitcherProps {
  options: SwitcherOption[];
  activeId?: string;
  onSelect: (id: string) => void;
  /** The row at the bottom of the menu — "Create channel". */
  action?: { label: string; to: string };
  /** Shown when nothing is selected yet. */
  placeholder?: string;
  loading?: boolean;
}

const TRIGGER_BASE =
  'group flex items-center rounded-md text-[14px] transition-colors duration-150 ' +
  'hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-[#fa7517]/40 motion-reduce:transition-none';

/**
 * The workspace row at the top of the sidebar.
 *
 * It replaces the old channel card at the bottom: a 84px cover image with the
 * name burned into a gradient told you which channel you were in only after
 * you scrolled past everything you might want to click.
 */
const SidebarSwitcher: React.FC<SidebarSwitcherProps> = ({
  options,
  activeId,
  onSelect,
  action,
  placeholder = 'Select',
  loading = false,
}) => {
  const { collapsed } = useSidebarView();
  const navigate = useNavigate();
  const active = options.find((option) => option.id === activeId);
  const label = active?.name ?? placeholder;

  if (loading) {
    return (
      <div
        data-testid="sidebar-switcher-loading"
        className={`h-9 rounded-md bg-white/[0.04] ${collapsed ? 'w-9' : 'w-full'}`}
      />
    );
  }

  // `DropdownMenu.Trigger asChild` has to clone the button itself. Wrapping the
  // tooltip in it instead cloned a component that forwards neither ref nor
  // handlers, so the collapsed switcher rendered a menu that could not open.
  const trigger = (
    <DropdownMenu.Trigger asChild>
      {collapsed ? (
        <button
          type="button"
          aria-label={label}
          data-testid="sidebar-switcher"
          className={`${TRIGGER_BASE} h-9 w-9 justify-center`}
        >
          <Avatar src={active?.imageUrl} name={label} size={24} showInitial={false} />
        </button>
      ) : (
        <button
          type="button"
          aria-label={`Switch channel, current: ${label}`}
          data-testid="sidebar-switcher"
          className={`${TRIGGER_BASE} h-9 w-full gap-2.5 px-2`}
        >
          <Avatar src={active?.imageUrl} name={label} size={24} />
          <span className="min-w-0 flex-1 truncate text-left text-gray-200">{label}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
        </button>
      )}
    </DropdownMenu.Trigger>
  );

  return (
    <DropdownMenu.Root>
      {collapsed ? <SidebarTooltip label={label}>{trigger}</SidebarTooltip> : trigger}

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-[80] min-w-[13rem] max-w-[16rem] overflow-hidden rounded-lg
                     border border-gray-800/60 bg-[#0f0f0f] p-1 shadow-2xl"
        >
          <div className="max-h-[18rem] overflow-y-auto custom-scrollbar">
            {options.length === 0 && (
              <div className="px-2.5 py-2 text-[13px] text-gray-400">No channels yet</div>
            )}
            <DropdownMenu.RadioGroup value={activeId ?? ''} onValueChange={onSelect}>
              {options.map((option) => {
                const isActive = option.id === activeId;
                return (
                  <DropdownMenu.RadioItem
                    key={option.id}
                    value={option.id}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5
                                text-[14px] outline-none transition-colors
                                data-[highlighted]:bg-white/5 ${
                                  isActive ? 'text-white' : 'text-gray-300'
                                }`}
                  >
                    <Avatar src={option.imageUrl} name={option.name} size={24} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{option.name}</span>
                      {option.handle && (
                        <span className="block truncate text-[11px] text-gray-400">
                          @{option.handle}
                        </span>
                      )}
                    </span>
                    <DropdownMenu.ItemIndicator>
                      <Check className="h-3.5 w-3.5 shrink-0 text-[#fa7517]" aria-hidden="true" />
                    </DropdownMenu.ItemIndicator>
                  </DropdownMenu.RadioItem>
                );
              })}
            </DropdownMenu.RadioGroup>
          </div>

          {action && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-gray-800/60" />
              <DropdownMenu.Item
                onSelect={() => navigate(action.to)}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5
                           text-[14px] text-gray-300 outline-none transition-colors
                           data-[highlighted]:bg-white/5 data-[highlighted]:text-white"
              >
                <Plus className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                {action.label}
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default SidebarSwitcher;
