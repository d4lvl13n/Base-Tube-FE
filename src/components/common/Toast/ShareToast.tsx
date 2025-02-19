import React from 'react';
import { Check, Share, Code } from 'lucide-react';

interface ShareToastProps {
  type: 'success' | 'error' | 'embed-success' | 'embed-error';
}

export const ShareToast: React.FC<ShareToastProps> = ({ type }) => {
  if (type === 'success') {
    return (
      <div className="flex items-center gap-3">
        <Check className="w-5 h-5 text-[#fa7517]" />
        <div>
          <p className="font-medium text-white">Link Copied!</p>
          <p className="text-sm text-gray-300">Video link copied to clipboard</p>
        </div>
      </div>
    );
  }

  if (type === 'embed-success') {
    return (
      <div className="flex items-center gap-3">
        <Code className="w-5 h-5 text-[#10B981]" />
        <div>
          <p className="font-medium text-white">Embed Code Copied!</p>
          <p className="text-sm text-gray-300">Ready to embed on your website</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Share className="w-5 h-5 text-red-500" />
      <div>
        <p className="font-medium text-white">Failed to Copy</p>
        <p className="text-sm text-gray-300">Please try again</p>
      </div>
    </div>
  );
}; 