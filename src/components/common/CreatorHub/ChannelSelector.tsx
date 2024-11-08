import React from 'react';
import { Channel } from '../../../types/channel';
import { Select } from '../../ui/Select';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

interface ChannelSelectorProps {
  channels: Channel[];
  onChannelChange: (channelId: string) => void;
}

export const ChannelSelector = ({ channels, onChannelChange }: ChannelSelectorProps) => {
  const [selectedChannelId, setSelectedChannelId] = useLocalStorage<string>(
    'selectedChannelId',
    channels[0]?.id.toString() // Default to first channel
  );

  const handleChannelChange = (channelId: string) => {
    setSelectedChannelId(channelId);
    onChannelChange(channelId);
  };

  return (
    <div className="flex items-center space-x-4 mb-6">
      <span className="text-gray-400">Viewing analytics for:</span>
      <Select
        value={selectedChannelId}
        onValueChange={handleChannelChange}
        options={channels.map(channel => ({
          value: channel.id.toString(),
          label: channel.name
        }))}
      />
    </div>
  );
};