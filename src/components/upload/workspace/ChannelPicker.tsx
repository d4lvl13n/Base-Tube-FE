import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { useChannelSelection } from '../../../contexts/ChannelSelectionContext';

/** A channel's image, or its initial when there is none or it fails to load — never a broken image. */
function ChannelAvatar({ name, image, size }: { name: string; image: string | null | undefined; size: number }) {
  const [failed, setFailed] = useState(false);
  if (image && !failed) {
    return (
      <img
        src={image}
        alt=""
        onError={() => setFailed(true)}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
        draggable={false}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full bg-[#fa7517]/15 font-semibold text-[#fa7517]"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

/**
 * Where the next videos go: a pill that opens the app's own menu (Radix, as
 * the Creator Hub channel selector), never the browser's native list. It only
 * changes the destination of NEW videos; a draft keeps its channel (UP-UX §6).
 */
const ChannelPicker: React.FC<{ label: string }> = ({ label }) => {
  const { channels, selectedChannelId, setSelectedChannelId, selectedChannel, isLoading } = useChannelSelection();
  if (isLoading || channels.length === 0) return null;
  const name = selectedChannel?.name ?? 'Choose a channel';

  return (
    <div className="inline-flex items-center gap-2.5 text-sm text-gray-400">
      <span>{label}</span>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          className="group inline-flex min-h-[40px] items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] py-1 pl-1.5 pr-3
                     text-gray-100 outline-none transition-colors hover:border-white/30 data-[state=open]:border-[#fa7517]/60
                     focus-visible:border-[#fa7517]/60 focus-visible:ring-1 focus-visible:ring-[#fa7517]/50"
          aria-label={`${label}: ${name}`}
        >
          <ChannelAvatar name={name} image={selectedChannel?.channel_image_url} size={28} />
          <span className="max-w-[16rem] truncate font-medium">{name}</span>
          <ChevronDown
            className="h-4 w-4 text-gray-500 transition-transform duration-150 group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={8}
            align="center"
            collisionPadding={16}
            className="z-[70] w-[280px] overflow-hidden rounded-xl border border-white/10 bg-[#111113] p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
          >
            <div className="max-h-[320px] overflow-y-auto">
              {channels.map((channel) => {
                const selected = String(channel.id) === selectedChannelId;
                return (
                  <DropdownMenu.Item
                    key={channel.id}
                    onSelect={() => setSelectedChannelId(String(channel.id))}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-left outline-none transition-colors
                               data-[highlighted]:bg-white/[0.06]"
                  >
                    <ChannelAvatar name={channel.name} image={channel.channel_image_url} size={32} />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-sm ${selected ? 'font-medium text-white' : 'text-gray-200'}`}>
                        {channel.name}
                      </span>
                      {channel.handle && <span className="block truncate text-xs text-gray-500">@{channel.handle}</span>}
                    </span>
                    {selected && <Check className="h-4 w-4 shrink-0 text-[#fa7517]" aria-label="Selected" />}
                  </DropdownMenu.Item>
                );
              })}
            </div>
            <DropdownMenu.Separator className="my-1.5 h-px bg-white/10" />
            <DropdownMenu.Item asChild>
              <Link
                to="/create-channel"
                className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-gray-300 outline-none transition-colors
                           data-[highlighted]:bg-white/[0.06] data-[highlighted]:text-white"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full border border-dashed border-white/20" aria-hidden="true">
                  <Plus className="h-4 w-4" />
                </span>
                Create a channel
              </Link>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
};

export default ChannelPicker;
