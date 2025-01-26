import React, { useState } from 'react';
import { AlertCircle, Upload } from 'lucide-react';

interface VideoPreviewProps {
  selectedFile: File | null;
  onFileChange: (file: File) => void;
  onError?: (error: string) => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({ 
  selectedFile,
  onFileChange,
  onError 
}) => {
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleVideoError = () => {
    const errorMessage = "Unable to preview video. The file might be corrupted or in an unsupported format.";
    setError(errorMessage);
    onError?.(errorMessage);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      onFileChange(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileChange(file);
    }
  };

  if (!selectedFile) {
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`
          relative w-full h-64 rounded-xl border-2 border-dashed 
          transition-colors duration-300 flex flex-col items-center justify-center
          ${dragActive
            ? 'border-[#fa7517] bg-[#fa7517]/10'
            : 'border-gray-700 hover:border-gray-600 bg-black/50'
          }
        `}
      >
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Upload className={`w-12 h-12 mb-4 ${dragActive ? 'text-[#fa7517]' : 'text-gray-400'}`} />
        <p className="text-lg font-medium text-gray-300">Drag and drop your video here</p>
        <p className="text-sm text-gray-500 mt-2">or click to browse</p>
        <p className="text-xs text-gray-600 mt-4">Maximum file size: 2GB</p>
      </div>
    );
  }

  return (
    <div className="p-8 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm">
      <h2 className="text-xl font-medium text-white mb-6">Video Preview</h2>
      <div className="relative rounded-lg overflow-hidden bg-black/50">
        <video
          src={URL.createObjectURL(selectedFile)}
          controls
          className="w-full aspect-video"
          onError={handleVideoError}
        />
        
        {error && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 