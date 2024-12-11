import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import { useChannelSelection } from '../../../contexts/ChannelSelectionContext';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import '../../../styles/creatorHub.css';

export const ChannelSelector = () => {
  const { channels, selectedChannelId, setSelectedChannelId, selectedChannel } = useChannelSelection();

  const getImageUrl = (imagePath: string | null | undefined) => {
    if (!imagePath) return '/assets/default-cover.jpg';
    return imagePath.startsWith('http')
      ? imagePath
      : `${process.env.REACT_APP_API_URL}/${imagePath}`;
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
              src={getImageUrl(selectedChannel?.channel_image_path)}
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
                onSelect={() => setSelectedChannelId(channel.id.toString())}
                className="outline-none"
              >
                <div className="relative h-[84px] cursor-default group bg-gray-900">
                  <img
                    src={getImageUrl(channel.channel_image_path)}
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