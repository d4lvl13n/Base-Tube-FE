import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UseFormRegister, FieldErrors, Control, useFieldArray, UseFormWatch, useWatch } from 'react-hook-form';
import { Plus, Trash, Lock, Loader, Tag, Clock, RefreshCw } from 'lucide-react';
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

type MetadataState = 'idle' | 'loading' | 'resolved' | 'unresolved' | 'rate_limited';

interface MetadataStatusEntry {
  state: MetadataState;
  message?: string;
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
  const [metadataStatuses, setMetadataStatuses] = useState<Record<number, MetadataStatusEntry>>({});
  // Track the last URL attempt per row so we only auto-fetch once per distinct URL.
  const attemptedUrlByIndex = useRef<Record<number, string>>({});
  
  // Use useWatch to react to URL changes and fetch titles
  const srcUrls = useWatch({
    control,
    name: 'src_urls'
  });

  const getMetadataStatus = useCallback(async (url: string, index: number) => {
    setLoadingStates(prev => ({ ...prev, [index]: true }));
    setMetadataStatuses(prev => ({
      ...prev,
      [index]: { state: 'loading' }
    }));

    try {
      const metadata = await youtubeApi.getVideoMetadata(url);

      if (metadata.title?.trim()) {
        update(index, {
          ...srcUrls?.[index],
          value: url,
          title: metadata.title,
          duration: metadata.duration,
          thumbnail_url: metadata.thumbnail_url
        });
        setMetadataStatuses(prev => ({
          ...prev,
          [index]: { state: 'resolved' }
        }));
        return;
      }

      setMetadataStatuses(prev => ({
        ...prev,
        [index]: {
          state: 'unresolved',
          message: 'We could not enrich this video right now. You can still submit, or retry metadata lookup.'
        }
      }));
    } catch (err: any) {
      const isRateLimited = err?.response?.status === 429;
      setMetadataStatuses(prev => ({
        ...prev,
        [index]: {
          state: isRateLimited ? 'rate_limited' : 'unresolved',
          message: isRateLimited
            ? 'YouTube metadata is temporarily rate-limited. Please wait a moment before retrying.'
            : 'Metadata lookup failed. Retry if this was a temporary issue.'
        }
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [index]: false }));
    }
  }, [srcUrls, update]);

  const handleRetryMetadata = useCallback(async (index: number) => {
    const url = srcUrls?.[index]?.value;
    if (!url) return;

    attemptedUrlByIndex.current[index] = '';
    await getMetadataStatus(url, index);
    attemptedUrlByIndex.current[index] = url;
  }, [getMetadataStatus, srcUrls]);
  
  // Fetch video title when URL changes
  useEffect(() => {
    const fetchVideoTitles = async () => {
      if (!srcUrls) return;

      for (let index = 0; index < srcUrls.length; index++) {
        const item = srcUrls[index];
        const url = item?.value?.trim();
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;

        if (!url || !youtubeRegex.test(url)) {
          attemptedUrlByIndex.current[index] = '';
          setMetadataStatuses(prev => {
            if (!prev[index]) return prev;
            const next = { ...prev };
            delete next[index];
            return next;
          });
          continue;
        }

        const previousAttemptUrl = attemptedUrlByIndex.current[index];
        if (previousAttemptUrl && previousAttemptUrl !== url && (item.title || item.duration)) {
          update(index, {
            ...item,
            value: url,
            title: undefined,
            duration: undefined,
            thumbnail_url: undefined
          });
          attemptedUrlByIndex.current[index] = '';
          setMetadataStatuses(prev => {
            if (!prev[index]) return prev;
            const next = { ...prev };
            delete next[index];
            return next;
          });
          continue;
        }

        if (previousAttemptUrl === url || item.title || loadingStates[index]) {
          continue;
        }

        attemptedUrlByIndex.current[index] = url;
        await getMetadataStatus(url, index);
      }
    };
    
    fetchVideoTitles();
  }, [getMetadataStatus, loadingStates, srcUrls]);

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

              {metadataStatuses[index]?.state === 'unresolved' && (
                <div className="mt-2 flex flex-col gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-amber-300">
                    {metadataStatuses[index]?.message}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRetryMetadata(index)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:border-white/20 hover:bg-white/5"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-[#fa7517]" />
                    Retry metadata
                  </button>
                </div>
              )}

              {metadataStatuses[index]?.state === 'rate_limited' && (
                <div className="mt-2 flex flex-col gap-2 rounded-lg border border-[#fa7517]/20 bg-[#fa7517]/8 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-orange-200">
                    {metadataStatuses[index]?.message}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRetryMetadata(index)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#fa7517]/30 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#fa7517]/10"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-[#fa7517]" />
                    Retry later
                  </button>
                </div>
              )}
              
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
