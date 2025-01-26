import React, { useRef } from 'react';
import { Image, AlertCircle } from 'lucide-react';

interface ThumbnailUploadProps {
  thumbnailPreview: string | null;
  onThumbnailChange: (file: File | null, previewUrl: string | null) => void;
  error?: string;
}

export const ThumbnailUpload: React.FC<ThumbnailUploadProps> = ({ 
  thumbnailPreview, 
  onThumbnailChange,
  error 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (3MB limit)
    const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      onThumbnailChange(null, null);
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      onThumbnailChange(null, null);
      return;
    }

    // Create preview URL and pass both file and preview
    const previewUrl = URL.createObjectURL(file);
    onThumbnailChange(file, previewUrl);
  };

  return (
    <div className="p-8 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-medium text-white">Thumbnail</h2>
          <p className="text-sm text-gray-400 mt-1">
            Select or upload a picture that shows what's in your video
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-2.5 bg-[#fa7517] hover:bg-[#ff8c3a] text-black 
                   rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Image className="w-4 h-4" />
          Upload Thumbnail
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      
      <div className="relative aspect-video rounded-lg overflow-hidden bg-black/50">
        {thumbnailPreview ? (
          <img
            src={thumbnailPreview}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 space-y-3">
            <Image className="w-16 h-16 opacity-50" />
            <p className="text-sm">Upload a thumbnail image</p>
          </div>
        )}

        {error && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-500/10 backdrop-blur-sm 
                        border-t border-red-500/20 p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}; 