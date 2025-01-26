import React from 'react';
import { Globe2, Lock, Info } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface VisibilityOption {
  id: 'public' | 'private';
  icon: React.ElementType;
  label: string;
  description: string;
}

interface VisibilitySelectorProps {
  visibility: 'public' | 'private';
  setVisibility: (visibility: 'public' | 'private') => void;
}

export const VisibilitySelector: React.FC<VisibilitySelectorProps> = ({
  visibility,
  setVisibility
}) => {
  const visibilityOptions: VisibilityOption[] = [
    { 
      id: 'public', 
      icon: Globe2, 
      label: 'Public', 
      description: 'Everyone can watch this video' 
    },
    { 
      id: 'private', 
      icon: Lock, 
      label: 'Private', 
      description: 'Only you can watch this video' 
    }
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-white">
        Video Visibility
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {visibilityOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = visibility === option.id;
          
          return (
            <button
              key={option.id}
              onClick={() => setVisibility(option.id)}
              className={`
                p-4 rounded-xl border transition-all duration-300
                flex items-start gap-3 text-left
                ${
                  isSelected 
                    ? 'border-[#fa7517] bg-[#fa7517]/10' 
                    : 'border-gray-800/30 hover:border-gray-700/50 bg-black/20'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-[#fa7517]' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium ${isSelected ? 'text-[#fa7517]' : 'text-white'}`}>
                      {option.label}
                    </p>
                    <Tooltip.Provider delayDuration={300}>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <button className="text-gray-400 hover:text-[#fa7517] transition-colors">
                            <Info className="w-4 h-4" />
                          </button>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            className="max-w-xs bg-black/90 backdrop-blur-sm border border-gray-800/30 
                                     rounded-lg px-4 py-3 text-sm text-gray-200 shadow-xl"
                            sideOffset={5}
                          >
                            <p>{option.description}</p>
                            <Tooltip.Arrow className="fill-black/90" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}; 