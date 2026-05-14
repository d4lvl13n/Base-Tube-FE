import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { UseFormRegister, FieldErrors, Control, useFieldArray, UseFormWatch, useWatch } from 'react-hook-form';
import { Plus, Trash, Lock, Loader, Tag, Clock, RefreshCw, ExternalLink, ChevronDown, Check, AlertTriangle, Youtube } from 'lucide-react';
import * as S from '../styles';
import { FormData } from '../types';
import { youtubeApi, getYouTubeID } from '../../../../../api/youtube';
import { UseYouTubeAuthReturn } from '../../../../../hooks/useYouTubeAuth';
import { useYouTubeVideos } from '../../../../../hooks/useYouTubeVideos';
import type { YouTubeVideoItem } from '../../../../../api/youtubeVideos';
import axios from 'axios';

interface StepVideosProps {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  control: Control<FormData>;
  watch: UseFormWatch<FormData>;
  youtubeAuth: UseYouTubeAuthReturn;
}

interface LoadingStates {
  [index: number]: boolean;
}

type MetadataState = 'idle' | 'loading' | 'resolved' | 'unresolved' | 'rate_limited';

interface MetadataStatusEntry {
  state: MetadataState;
  message?: string;
}

const formatDuration = (seconds?: number): string => {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const getPreviewThumbnail = (url?: string, thumbnailUrl?: string): string => {
  if (thumbnailUrl) return thumbnailUrl;
  const videoId = getYouTubeID(url || '');
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
};

const getSourceLabel = (url?: string): string => {
  if (!url) return 'youtube.com';
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'youtube.com'; }
};

function getPickerErrorMessage(error: unknown): { code: string | null; message: string } {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, any> | undefined;
    const code =
      (typeof data?.error === 'object' ? data?.error?.code : null) ??
      data?.code ??
      null;
    const message =
      (typeof data?.error === 'object' ? data?.error?.message : null) ??
      (typeof data?.error === 'string' ? data.error : null) ??
      data?.message ??
      'Could not load your videos.';
    return { code, message };
  }
  return { code: null, message: error instanceof Error ? error.message : 'Could not load your videos.' };
}

const StepVideos: React.FC<StepVideosProps> = ({ register, errors, control, watch, youtubeAuth }) => {
  const { fields, append, remove, update } = useFieldArray({ control, name: 'src_urls' });

  // --- Manual fallback state (existing metadata fetch logic) ---
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({});
  const [metadataStatuses, setMetadataStatuses] = useState<Record<number, MetadataStatusEntry>>({});
  const attemptedUrlByIndex = useRef<Record<number, string>>({});
  const [manualOpen, setManualOpen] = useState(false);

  const srcUrls = useWatch({ control, name: 'src_urls' });

  // --- Picker ---
  const isLinked = youtubeAuth.status === 'linked';
  const videosQuery = useYouTubeVideos({ enabled: isLinked, maxResults: 20 });

  const allPickerVideos = useMemo(() => {
    const raw = videosQuery.data?.pages.flatMap((p) => p.videos) ?? [];
    const seen = new Set<string>();
    return raw.filter((v) => {
      if (seen.has(v.videoId)) return false;
      seen.add(v.videoId);
      return true;
    });
  }, [videosQuery.data]);

  const channelTitle = videosQuery.data?.pages[0]?.channel?.title;

  const selectedVideoIds = useMemo(
    () => new Set(fields.map((f) => getYouTubeID((f as any).value)).filter(Boolean)),
    [fields],
  );

  const pickerError = videosQuery.error
    ? getPickerErrorMessage(videosQuery.error)
    : null;

  // Auto-open manual fallback on picker error
  useEffect(() => {
    if (pickerError) setManualOpen(true);
  }, [pickerError]);

  const toggleVideo = useCallback(
    (video: YouTubeVideoItem) => {
      const id = video.videoId;
      if (selectedVideoIds.has(id)) {
        const idx = fields.findIndex((f) => getYouTubeID((f as any).value) === id);
        if (idx >= 0) remove(idx);
      } else {
        append({
          value: video.url,
          title: video.title,
          duration: video.durationSeconds,
          thumbnail_url: video.thumbnailUrl,
        });
      }
    },
    [selectedVideoIds, fields, remove, append],
  );

  // --- Manual metadata fetch (unchanged logic, scoped to manual entries) ---
  const getMetadataStatus = useCallback(async (url: string, index: number) => {
    setLoadingStates((prev) => ({ ...prev, [index]: true }));
    setMetadataStatuses((prev) => ({ ...prev, [index]: { state: 'loading' } }));
    try {
      const metadata = await youtubeApi.getVideoMetadata(url);
      if (metadata.title?.trim()) {
        update(index, { ...srcUrls?.[index], value: url, title: metadata.title, duration: metadata.duration, thumbnail_url: metadata.thumbnail_url });
        setMetadataStatuses((prev) => ({ ...prev, [index]: { state: 'resolved' } }));
        return;
      }
      setMetadataStatuses((prev) => ({ ...prev, [index]: { state: 'unresolved', message: 'Could not enrich this video. You can still submit or retry.' } }));
    } catch (err: any) {
      const isRateLimited = err?.response?.status === 429;
      setMetadataStatuses((prev) => ({
        ...prev,
        [index]: {
          state: isRateLimited ? 'rate_limited' : 'unresolved',
          message: isRateLimited
            ? 'YouTube metadata rate-limited. Wait a moment and retry.'
            : 'Metadata lookup failed. Retry if temporary.',
        },
      }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, [index]: false }));
    }
  }, [srcUrls, update]);

  const handleRetryMetadata = useCallback(async (index: number) => {
    const url = srcUrls?.[index]?.value;
    if (!url) return;
    attemptedUrlByIndex.current[index] = '';
    await getMetadataStatus(url, index);
    attemptedUrlByIndex.current[index] = url;
  }, [getMetadataStatus, srcUrls]);

  useEffect(() => {
    if (!srcUrls || !manualOpen) return;
    for (let index = 0; index < srcUrls.length; index++) {
      const item = srcUrls[index];
      const url = item?.value?.trim();
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
      if (!url || !youtubeRegex.test(url)) {
        attemptedUrlByIndex.current[index] = '';
        setMetadataStatuses((prev) => { if (!prev[index]) return prev; const next = { ...prev }; delete next[index]; return next; });
        continue;
      }
      const prev = attemptedUrlByIndex.current[index];
      if (prev && prev !== url && (item.title || item.duration)) {
        update(index, { ...item, value: url, title: undefined, duration: undefined, thumbnail_url: undefined });
        attemptedUrlByIndex.current[index] = '';
        continue;
      }
      if (prev === url || item.title || loadingStates[index]) continue;
      attemptedUrlByIndex.current[index] = url;
      getMetadataStatus(url, index);
    }
  }, [getMetadataStatus, loadingStates, srcUrls, manualOpen, update]);

  const validCount = fields.filter((f) => {
    const v = (f as any).value;
    return v && /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(v);
  }).length;

  return (
    <>
      {/* Unlinked banner */}
      {youtubeAuth.status === 'unlinked' && (
        <S.InfoBox style={{ borderColor: '#fa7517' }}>
          <Lock size={24} className="text-[#fa7517]" />
          <div>
            <h4 className="font-medium mb-2">Connect your YouTube channel</h4>
            <S.InfoText className="mb-2">Verify a channel before adding videos.</S.InfoText>
            <S.Button type="button" variant="primary" onClick={youtubeAuth.startOAuth}>
              Connect YouTube
            </S.Button>
          </div>
        </S.InfoBox>
      )}

      {/* ============= VIDEO PICKER (primary UX) ============= */}
      {isLinked && (
        <S.FormGroup>
          <div className="flex items-center justify-between mb-1">
            <S.Label className="mb-0">
              {channelTitle ? (
                <span className="flex items-center gap-2">
                  <Youtube size={16} className="text-red-500" />
                  Your unlisted videos on {channelTitle}
                </span>
              ) : (
                'Your unlisted videos'
              )}
            </S.Label>
            {validCount > 0 && (
              <span className="text-sm text-[#fa7517] font-medium">
                {validCount} selected
              </span>
            )}
          </div>

          {/* Loading */}
          {videosQuery.isLoading && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden animate-pulse">
                  <div className="aspect-video bg-white/[0.04]" />
                  <div className="p-3 space-y-2">
                    <div className="h-3.5 w-3/4 bg-white/[0.06] rounded" />
                    <div className="h-3 w-1/3 bg-white/[0.04] rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {pickerError && !videosQuery.isLoading && (
            <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-red-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-200">
                    {pickerError.code === 'YOUTUBE_NOT_LINKED'
                      ? 'YouTube not connected.'
                      : pickerError.code === 'YOUTUBE_API_RATE_LIMITED'
                      ? 'YouTube is temporarily rate-limited. Try again in a minute.'
                      : pickerError.message}
                  </p>
                  <div className="flex gap-2 mt-3">
                    {pickerError.code === 'YOUTUBE_NOT_LINKED' ? (
                      <button
                        type="button"
                        onClick={youtubeAuth.startOAuth}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#fa7517]/30 bg-[#fa7517]/10 px-3 py-1.5 text-xs font-medium text-[#fa7517] hover:bg-[#fa7517]/20"
                      >
                        Connect YouTube
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => videosQuery.refetch()}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/5"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty */}
          {!videosQuery.isLoading && !pickerError && allPickerVideos.length === 0 && (
            <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
              <Youtube className="w-8 h-8 mx-auto mb-3 text-gray-500" />
              <p className="text-sm text-gray-400 mb-1">No unlisted videos found</p>
              <p className="text-xs text-gray-500">
                Upload unlisted videos to YouTube, then come back and they'll appear here.
              </p>
            </div>
          )}

          {/* Picker grid */}
          {!videosQuery.isLoading && allPickerVideos.length > 0 && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                {allPickerVideos.map((video) => {
                  const isSelected = selectedVideoIds.has(video.videoId);
                  return (
                    <button
                      key={video.videoId}
                      type="button"
                      onClick={() => toggleVideo(video)}
                      className={`group relative rounded-xl overflow-hidden border text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-[#fa7517]/60 bg-[#fa7517]/5 ring-1 ring-[#fa7517]/30'
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        {video.durationSeconds > 0 && (
                          <span className="absolute bottom-2 right-2 text-[10px] px-1.5 py-0.5 bg-black/70 rounded text-white/80 font-mono">
                            {formatDuration(video.durationSeconds)}
                          </span>
                        )}
                        {/* Checkmark overlay */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#fa7517] flex items-center justify-center shadow-lg">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </div>
                      {/* Meta */}
                      <div className="p-3">
                        <p className="text-sm font-medium text-white line-clamp-2 leading-snug">
                          {video.title}
                        </p>
                        {video.publishedAt && (
                          <p className="text-[11px] text-gray-500 mt-1.5">
                            {new Date(video.publishedAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Load more */}
              {videosQuery.hasNextPage && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    disabled={videosQuery.isFetchingNextPage}
                    onClick={() => videosQuery.fetchNextPage()}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5 disabled:opacity-50"
                  >
                    {videosQuery.isFetchingNextPage ? (
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    Load more videos
                  </button>
                </div>
              )}
            </>
          )}
        </S.FormGroup>
      )}

      {/* ============= MANUAL FALLBACK (collapsed) ============= */}
      {isLinked && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setManualOpen((v) => !v)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${manualOpen ? 'rotate-180' : ''}`}
            />
            Or paste a YouTube URL manually
          </button>

          {manualOpen && (
            <div className="mt-3">
              <S.FormGroup>
                <S.Label>Video URLs</S.Label>
                <S.VideoUrlContainer>
                  {fields.map((field, index) => (
                    <div key={field.id}>
                      <S.VideoUrlRow>
                        <S.Input
                          id={`src_urls.${index}.value`}
                          placeholder="https://youtube.com/watch?v=..."
                          {...register(`src_urls.${index}.value`, {
                            required: index === 0 && validCount === 0 ? 'At least one video is required' : false,
                            validate: (value) => {
                              if (!value && index !== 0) return true;
                              const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
                              return youtubeRegex.test(value || '') || 'Please enter a valid YouTube URL';
                            },
                          })}
                        />
                        {loadingStates[index] && (
                          <div className="flex items-center px-2">
                            <Loader size={16} className="animate-spin text-[#fa7517]" />
                          </div>
                        )}
                        {fields.length > 1 && (
                          <S.RemoveButton type="button" onClick={() => remove(index)} title="Remove">
                            <Trash size={18} />
                          </S.RemoveButton>
                        )}
                      </S.VideoUrlRow>

                      {metadataStatuses[index]?.state === 'unresolved' && (
                        <div className="mt-2 flex flex-col gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-amber-300">{metadataStatuses[index]?.message}</p>
                          <button type="button" onClick={() => handleRetryMetadata(index)} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/5">
                            <RefreshCw className="h-3.5 w-3.5 text-[#fa7517]" /> Retry
                          </button>
                        </div>
                      )}
                      {metadataStatuses[index]?.state === 'rate_limited' && (
                        <div className="mt-2 flex flex-col gap-2 rounded-lg border border-[#fa7517]/20 bg-[#fa7517]/[0.06] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-orange-200">{metadataStatuses[index]?.message}</p>
                          <button type="button" onClick={() => handleRetryMetadata(index)} className="inline-flex items-center gap-2 rounded-full border border-[#fa7517]/30 px-3 py-1.5 text-xs font-medium text-white hover:bg-[#fa7517]/10">
                            <RefreshCw className="h-3.5 w-3.5 text-[#fa7517]" /> Retry
                          </button>
                        </div>
                      )}

                      {srcUrls?.[index]?.title && (
                        <S.VideoTitleRow>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center">
                                <Tag size={14} className="text-[#fa7517] mr-1.5" />
                                <span className="text-xs font-medium text-[#fa7517]">Title (editable)</span>
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
                {errors.src_urls && (errors.src_urls as any)[0]?.value?.message && (
                  <S.ErrorText>{(errors.src_urls as any)[0].value.message}</S.ErrorText>
                )}
                {errors.src_urls?.root && <S.ErrorText>{errors.src_urls.root.message}</S.ErrorText>}
              </S.FormGroup>

              <S.AddVideoButton type="button" variant="secondary" onClick={() => append({ value: '' })}>
                <Plus size={18} /> Add another video
              </S.AddVideoButton>
            </div>
          )}
        </div>
      )}

      {/* ============= PREVIEW CARDS (from form data) ============= */}
      {srcUrls?.map((urlObj, idx) =>
        urlObj?.value && /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(urlObj.value) ? (
          <S.PreviewContainer key={`preview-${idx}`}>
            <div className="flex items-center justify-between">
              <S.CardTitle>{urlObj.title || `Video ${idx + 1}`}</S.CardTitle>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="text-gray-500 hover:text-red-400 transition-colors p-1"
                title="Remove video"
              >
                <Trash size={14} />
              </button>
            </div>
            <S.VideoPreview>
              {getPreviewThumbnail(urlObj.value, urlObj.thumbnail_url) ? (
                <img src={getPreviewThumbnail(urlObj.value, urlObj.thumbnail_url)} alt={urlObj.title || `Video ${idx + 1}`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center bg-black/30 px-6 text-center text-sm text-gray-300">
                  Preview unavailable
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{urlObj.title || `Video ${idx + 1}`}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-300">
                    <span>{getSourceLabel(urlObj.value)}</span>
                    {urlObj.duration ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-[#fa7517]" />
                        {formatDuration(urlObj.duration)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <a href={urlObj.value} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-medium text-white hover:bg-black/55">
                  <ExternalLink className="h-3.5 w-3.5 text-[#fa7517]" /> Source
                </a>
              </div>
            </S.VideoPreview>
          </S.PreviewContainer>
        ) : null,
      )}

      {/* ============= INFO BOX ============= */}
      <S.InfoBox>
        <Lock size={24} className="text-[#fa7517]" />
        <div>
          <h4 className="font-medium mb-2">Important Notes</h4>
          <S.InfoText>
            <ul className="list-disc list-inside space-y-2">
              <li>Only <strong>unlisted</strong> YouTube videos can be added</li>
              <li>Make sure your content follows YouTube's terms of service</li>
              <li>Don't share the direct YouTube link publicly</li>
              <li>Once purchased, your pass gates this content behind a paywall</li>
            </ul>
          </S.InfoText>
        </div>
      </S.InfoBox>
    </>
  );
};

export default StepVideos;
