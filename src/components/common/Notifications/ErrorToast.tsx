import React from 'react';
import { toast } from 'react-toastify';
import { AlertCircle, Info } from 'lucide-react';

export const showErrorToast = (message: string) => {
  toast.error(
    <div className="flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
      <p className="text-sm text-white">{message}</p>
    </div>,
    {
      position: "bottom-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
      className: "bg-black/90 backdrop-blur-sm border border-gray-800/30",
    }
  );
};

/** The quiet sibling: news, not a problem. */
export const showInfoToast = (message: string) => {
  toast.info(
    <div className="flex items-center gap-3">
      <Info className="w-5 h-5 text-[#fa7517] flex-shrink-0" />
      <p className="text-sm text-white">{message}</p>
    </div>,
    {
      // Bottom-centre, because this one points at the bottom-right panel.
      position: "bottom-center",
      autoClose: 5000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "dark",
      className: "bg-black/90 backdrop-blur-sm border border-gray-800/30",
    }
  );
};

export const uploadErrors = {
  noFile: 'Please select a video file to upload',
  noTitle: 'Please enter a title for your video',
  noDescription: 'Please enter a description for your video',
  noChannel: 'Please select a channel',
  fileTooLarge: 'Video file size exceeds 2GB limit',
  unsupportedFormat: 'Unsupported video format. Please use MP4, MOV, or AVI.',
  networkError: 'Network error. Please check your internet connection.',
  uploadFailed: 'Failed to upload video. Please try again.',
}; 