import React from 'react';
import { FileVideo, Image, AlertCircle, Info } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

export const UploadRequirements: React.FC = () => {
  return (
    <div className="p-8 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm">
      <h2 className="text-xl font-medium text-white mb-6">Upload Requirements</h2>
      
      {/* Video Requirements */}
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#fa7517]">
            <FileVideo className="w-5 h-5" />
            <h3 className="font-medium">Video File</h3>
          </div>
          <ul className="space-y-2 text-gray-300 text-sm pl-7">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
              Formats: MP4 or QuickTime (.mp4, .mov)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
              Maximum size: 2GB
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
              Recommended resolution: 1080p or 720p
            </li>
          </ul>
        </div>

        {/* Thumbnail Requirements */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#fa7517]">
            <Image className="w-5 h-5" />
            <h3 className="font-medium">Thumbnail</h3>
          </div>
          <ul className="space-y-2 text-gray-300 text-sm pl-7">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
              Formats: JPG, PNG, or JPEG
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
              Maximum size: 3MB
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
              Recommended dimensions: 1280x720 pixels
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
              Aspect ratio: 16:9 (recommended)
            </li>
          </ul>
        </div>

        {/* Important Notes */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#fa7517]">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-medium">Important Notes</h3>
          </div>
          <ul className="space-y-2 text-gray-300 text-sm pl-7">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
              <span>Video processing may take several minutes</span>
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
                      <p className="mb-2">
                        Our system is designed to process videos in multiple qualities:
                      </p>
                      <ul className="space-y-1 text-gray-300">
                        <li>• 1080p (Full HD)</li>
                        <li>• 720p (HD)</li>
                        <li>• 480p (SD)</li>
                      </ul>
                      <p className="mt-2 text-gray-400">
                        Currently, videos will be displayed in their original uploaded quality. 
                        Multi-quality support is under development.
                      </p>
                      <Tooltip.Arrow className="fill-black/90" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
              Keep the upload page open until processing is complete
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
              Upload progress can be monitored in real-time
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 