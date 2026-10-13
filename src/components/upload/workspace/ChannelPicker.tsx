import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useChannelSelection } from '../../../contexts/ChannelSelectionContext';

/**
 * Where the next videos go, in one line: avatar, name, and a native select
 * over it (keyboard, screen readers and touch for free). It only changes the
 * destination of NEW videos; a draft keeps its channel (UP-UX §6).
 *
 * A channel without an image — or whose image fails to load — shows its
 * initial, never a broken image.
 */
const ChannelPicker: React.FC<{ label: string }> = ({ label }) => {
  const { channels, selectedChannelId, setSelectedChannelId, selectedChannel, isLoading } = useChannelSelection();
  const [failedImage, setFailedImage] = useState<string | null>(null);

  if (isLoading || channels.length === 0) return null;
  const image = selectedChannel?.channel_image_url ?? null;
  const showImage = !!image && failedImage !== image;
  const name = selectedChannel?.name ?? 'Choose a channel';

  return (
    <label className="inline-flex items-center gap-2 text-sm text-gray-400">
      <span>{label}</span>
      <span className="relative inline-flex min-h-[40px] items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] py-1 pl-1.5 pr-3 text-gray-100 transition-colors focus-within:border-[#fa7517]/60 hover:border-white/30">
        {showImage ? (
          <img
            src={image!}
            alt=""
            className="h-7 w-7 rounded-full object-cover"
            onError={() => setFailedImage(image)}
          />
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#fa7517]/20 text-xs font-semibold text-[#fa7517]" aria-hidden="true">
            {name.trim().charAt(0).toUpperCase() || '?'}
          </span>
        )}
        <span className="max-w-[16rem] truncate font-medium">{name}</span>
        <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden="true" />
        <select
          value={selectedChannelId}
          onChange={(event) => setSelectedChannelId(event.target.value)}
          aria-label={label}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {!selectedChannelId && <option value="">Choose a channel</option>}
          {channels.map((channel) => (
            <option key={channel.id} value={String(channel.id)}>
              {channel.name}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
};

export default ChannelPicker;
