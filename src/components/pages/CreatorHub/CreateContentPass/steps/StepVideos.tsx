import React, { useState, useEffect, useRef } from 'react';
import { UseFormRegister, FieldErrors, Control, useFieldArray, UseFormWatch, useWatch } from 'react-hook-form';
import { Plus, Trash, Lock, Loader, FileText, Tag, Clock } from 'lucide-react';
import * as S from '../styles';
import { FormData } from '../types';
import { youtubeApi, getYouTubeID } from '../../../../../api/youtube';
import { UseYouTubeAuthReturn } from '../../../../../hooks/useYouTubeAuth';

interface StepVideosProps {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  control: Control<FormData>;
  watch: UseFormWatch<FormData>;
  youtubeAuth: UseYouTubeAuthReturn;
}

// Track loading state for fetching video titles
interface LoadingStates {
  [index: number]: boolean;
}

// Format seconds to HH:MM:SS
const formatDuration = (seconds?: number): string => {
  if (!seconds) return ''; 
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const StepVideos: React.FC<StepVideosProps> = ({ register, errors, control, watch, youtubeAuth }) => {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'src_urls'
  });

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({});
  // Keep track of processed URLs to prevent infinite loops
  const processedUrls = useRef<Set<string>>(new Set());
  
  // Use useWatch to react to URL changes and fetch titles
  const srcUrls = useWatch({
    control,
    name: 'src_urls'
  });
  
  // Fetch video title when URL changes
  useEffect(() => {
    const fetchVideoTitles = async () => {
      if (!srcUrls) return;
      
      let hasUpdates = false;
      
      for (let index = 0; index < srcUrls.length; index++) {
        const item = srcUrls[index];
        const url = item.value;
        
        // Skip empty URLs or ones we've already processed
        if (!url || item.title || loadingStates[index]) continue;
        
        // Check if we've already processed this URL to prevent infinite loops
        if (processedUrls.current.has(url)) continue;
        
        // Check if it's a valid YouTube URL
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        if (!youtubeRegex.test(url)) continue;
        
        // Mark this URL as being processed
        processedUrls.current.add(url);
        hasUpdates = true;
        
        // Set loading state for this index
        setLoadingStates(prev => ({ ...prev, [index]: true }));
        
        try {
          // Fetch metadata from our API
          const metadata = await youtubeApi.getVideoMetadata(url);
          
          // Update the form with the title
          update(index, { 
            ...item, 
            title: metadata.title,
            duration: metadata.duration 
          });
        } catch (err) {
          console.error('Error fetching video title', err);
        } finally {
          // Clear loading state
          setLoadingStates(prev => ({ ...prev, [index]: false }));
        }
      }
      
      // If no updates were needed, no need to trigger any state changes
      return hasUpdates;
    };
    
    fetchVideoTitles();
  }, [srcUrls, update]);

  return (
    <>
      {/* Alert banner when YouTube is unlinked */}
      {youtubeAuth.status === 'unlinked' && (
        <S.InfoBox style={{ borderColor: '#fa7517' }}>
          <Lock size={24} className="text-[#fa7517]" />
          <div>
            <h4 className="font-medium mb-2">Connect your YouTube channel</h4>
            <S.InfoText className="mb-2">You need to verify a channel before adding YouTube videos.</S.InfoText>
            <S.Button type="button" variant="primary" onClick={youtubeAuth.startOAuth}>
              Connect YouTube
            </S.Button>
          </div>
        </S.InfoBox>
      )}
      <S.FormGroup>
        <S.Label>Video URLs (At least one required) *</S.Label>
        <S.VideoUrlContainer>
          {fields.map((field, index) => (
            <div key={field.id}>
              <S.VideoUrlRow>
                <S.Input
                  id={`src_urls.${index}.value`}
                  placeholder="https://youtube.com/watch?v=..." 
                  {...register(`src_urls.${index}.value`, {
                    required: index === 0 ? 'At least one video URL is required' : false,
                    validate: (value) => {
                      if (!value && index !== 0) return true; // Allow empty optional fields
                      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
                      return youtubeRegex.test(value || '') || 'Please enter a valid YouTube URL';
                    }
                  })}
                  disabled={youtubeAuth.status !== 'linked'}
                />
                {loadingStates[index] && (
                  <div className="flex items-center px-2">
                    <Loader size={16} className="animate-spin text-[#fa7517]" />
                  </div>
                )}
                {fields.length > 1 && (
                  <S.RemoveButton
                    type="button"
                    onClick={() => remove(index)}
                    title="Remove video URL"
                  >
                    <Trash size={18} />
                  </S.RemoveButton>
                )}
              </S.VideoUrlRow>
              
              {/* Title field - becomes visible once video URL is fetched */}
              {srcUrls?.[index]?.title && (
                <S.VideoTitleRow>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center">
                        <Tag size={14} className="text-[#fa7517] mr-1.5" />
                        <span className="text-xs font-medium text-[#fa7517]">Video Title (editable)</span>
                      </div>
                      
                      {srcUrls[index]?.duration && (
                        <div className="flex items-center">
                          <Clock size={14} className="text-gray-400 mr-1" />
                          <span className="text-xs text-gray-400">{formatDuration(srcUrls[index].duration)}</span>
                        </div>
                      )}
                    </div>
                    <S.Input
                      id={`src_urls.${index}.title`}
                      placeholder="Video title" 
                      {...register(`src_urls.${index}.title`)}
                    />
                  </div>
                </S.VideoTitleRow>
              )}
            </div>
          ))}
        </S.VideoUrlContainer>
        {/* Display the first field's error message if applicable */}
         {errors.src_urls && (errors.src_urls as any)[0]?.value?.message && (
           <S.ErrorText>{(errors.src_urls as any)[0].value.message}</S.ErrorText>
         )}
        {/* Simplified error display: Check if the array itself has an error (e.g., from top-level validation) */} 
        {errors.src_urls?.root && (
           <S.ErrorText>{errors.src_urls.root.message}</S.ErrorText>
        )}
      </S.FormGroup>
      
      <S.AddVideoButton 
        type="button" 
        variant="secondary" 
        onClick={() => append({ value: '' })}
        disabled={youtubeAuth.status !== 'linked'}
      >
        <Plus size={18} />
        Add another video
      </S.AddVideoButton>
      
      {/* Show preview for each non-empty, valid URL */}
      {srcUrls?.map((urlObj, idx) => 
         urlObj?.value && /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(urlObj.value) ? (
          <S.PreviewContainer key={`preview-${idx}`}>
            <S.CardTitle>
              {urlObj.title ? urlObj.title : `Video Preview ${idx + 1}`}
            </S.CardTitle>
            <S.VideoPreview>
              <iframe 
                src={`https://www.youtube.com/embed/${getYouTubeID(urlObj.value) || ''}`}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={urlObj.title || `Video Preview ${idx + 1}`}
              ></iframe>
            </S.VideoPreview>
          </S.PreviewContainer>
        ) : null
      )}
      
      <S.InfoBox>
        <Lock size={24} className="text-[#fa7517]" />
        <div>
          <h4 className="font-medium mb-2">Important Notes About Content Passes</h4>
          <S.InfoText>
            <ul className="list-disc list-inside space-y-2">
              <li>You should use <strong>unlisted</strong> YouTube videos (not private)</li>
              <li>Make sure your content follows YouTube's terms of service</li>
              <li>Be careful not to share the direct YouTube link publicly</li>
              <li>Once purchased, your pass will gate this content behind a paywall</li>
              <li>The title fetched from YouTube can be edited before submission</li>
            </ul>
          </S.InfoText>
        </div>
      </S.InfoBox>
    </>
  );
};

export default StepVideos;
