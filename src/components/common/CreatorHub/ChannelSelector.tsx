import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import { useChannelSelection } from '../../../contexts/ChannelSelectionContext';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import '../../../styles/creatorHub.css';

export const ChannelSelector = () => {
  const { 
    channels, 
    selectedChannelId, 
    setSelectedChannelId, 
    selectedChannel,
    isLoading 
  } = useChannelSelection();

  // Add loading state handling
  if (isLoading) {
    return (
      <div className="w-full rounded-xl overflow-hidden border border-gray-800/30 h-[84px] animate-pulse">
        <div className="h-full bg-gray-900/50" />
      </div>
    );
  }

  // Ensure we have channels before rendering
  if (!channels.length) {
    return (
      <div className="w-full rounded-xl overflow-hidden border border-gray-800/30">
        <div className="h-[84px] relative bg-gray-900">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-400">No channels available</span>
          </div>
        </div>
      </div>
    );
  }

  const handleChannelSelect = (channelId: string) => {
    setSelectedChannelId(channelId);
    // Optionally invalidate queries when changing channels
    // queryClient.invalidateQueries(['channel', channelId]);
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-xl overflow-hidden border border-gray-800/30
                     group relative hover:border-[#fa7517]/50 transition-all duration-300"
          style={{
            boxShadow: `
              0 0 20px 5px rgba(250, 117, 23, 0.1),
              0 0 40px 10px rgba(250, 117, 23, 0.05)
            `
          }}
        >
          <div className="h-[84px] relative bg-gray-900">
            <img
              src={selectedChannel?.channel_image_url || '/assets/default-cover.jpg'}
              alt={selectedChannel?.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-white truncate text-sm">
                  {selectedChannel?.name || 'Select Channel'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-[#fa7517] transition-transform duration-300 group-data-[state=open]:rotate-180" />
            </div>
          </div>
        </motion.button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 w-[300px] data-[side=bottom]:animate-slideDownAndFade 
                   rounded-xl border border-gray-800/30 bg-black/90 backdrop-blur-sm
                   shadow-2xl select-none overflow-hidden"
          sideOffset={5}
          align="end"
          side="top"
        >
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {channels.map((channel) => (
              <DropdownMenu.Item
                key={channel.id}
                onSelect={() => handleChannelSelect(channel.id.toString())}
                className="outline-none"
              >
                <div className="relative h-[84px] cursor-default group bg-gray-900">
                  <img
                    src={channel.channel_image_url || '/assets/default-cover.jpg'}
                    alt={channel.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent 
                                group-hover:via-black/60 transition-all duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-white group-hover:text-[#fa7517] truncate">
                        {channel.name}
                      </p>
                      <p className="text-sm text-gray-400 truncate">
                        @{channel.handle}
                      </p>
                    </div>
                    {channel.id.toString() === selectedChannelId && (
                      <CheckCircle2 className="w-5 h-5 text-[#fa7517] flex-shrink-0 ml-2" />
                    )}
                  </div>
                </div>
              </DropdownMenu.Item>
            ))}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};