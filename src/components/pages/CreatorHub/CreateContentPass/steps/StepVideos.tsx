import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { UseFormRegister, FieldErrors, Control, useFieldArray, UseFormWatch, useWatch } from 'react-hook-form';
import { Plus, Trash, Lock, Loader, RefreshCw, ExternalLink, ChevronDown, Check, AlertTriangle, Youtube } from 'lucide-react';
import { cx, form, list, page, selectable, skeleton } from '../../shared/hubStyles';
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

/** A quiet note: hairline border, faint fill. For anything that is not an error. */
const neutralNote = 'flex items-start gap-2 rounded-md border border-gray-800/60 bg-white/5 p-2.5 text-xs text-gray-300';

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

  const selectedPreviews = (srcUrls ?? [])
    .map((urlObj, idx) => ({ urlObj, idx }))
    .filter(({ urlObj }) => urlObj?.value && /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(urlObj.value));

  return (
    <div className="space-y-4">
      {/* ── Not linked ─────────────────────────────────────────────────── */}
      {youtubeAuth.status === 'unlinked' && (
        <div className={neutralNote} role="status">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-500" aria-hidden="true" />
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-gray-200">Connect your YouTube channel</p>
              <p className="mt-0.5 text-gray-400">Verify a channel before adding videos.</p>
            </div>
            <button type="button" onClick={() => youtubeAuth.startOAuth()} className={form.primaryButton}>
              Connect YouTube
            </button>
          </div>
        </div>
      )}

      {/* ============= VIDEO PICKER (primary UX) ============= */}
      {isLinked && (
        <section className={cx(form.panel, 'space-y-3')} aria-labelledby="picker-label">
          <div className="flex items-center justify-between gap-3">
            <p id="picker-label" className={cx(form.fieldLabel, 'flex items-center gap-2')}>
              {channelTitle ? (
                <>
                  <Youtube className="h-3.5 w-3.5 text-gray-500" aria-hidden="true" />
                  Your unlisted videos on {channelTitle}
                </>
              ) : (
                'Your unlisted videos'
              )}
            </p>
            {validCount > 0 && (
              <span className={cx(form.counter, 'text-[#fa7517]')}>
                {validCount} selected
              </span>
            )}
          </div>

          {/* Loading */}
          {videosQuery.isLoading && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3" aria-busy="true" aria-label="Loading videos">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className={skeleton.thumb} />
                  <div className={cx(skeleton.line, 'w-3/4')} />
                  <div className={cx(skeleton.line, 'h-3 w-1/3 bg-white/[0.03]')} />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {pickerError && !videosQuery.isLoading && (
            <div className={form.errorNote} role="alert">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  {pickerError.code === 'YOUTUBE_NOT_LINKED'
                    ? 'YouTube not connected.'
                    : pickerError.code === 'YOUTUBE_API_RATE_LIMITED'
                    ? 'YouTube is temporarily rate-limited. Try again in a minute.'
                    : pickerError.message}
                </p>
                {pickerError.code === 'YOUTUBE_NOT_LINKED' ? (
                  <button type="button" onClick={() => youtubeAuth.startOAuth()} className={form.secondaryButton}>
                    Connect YouTube
                  </button>
                ) : (
                  <button type="button" onClick={() => videosQuery.refetch()} className={form.secondaryButton}>
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    Retry
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Empty */}
          {!videosQuery.isLoading && !pickerError && allPickerVideos.length === 0 && (
            <div className={list.emptyState.wrapper}>
              <Youtube className="h-8 w-8 text-gray-600" aria-hidden="true" />
              <p className={cx('mt-4', list.emptyState.title)}>No unlisted videos found</p>
              <p className={list.emptyState.subtitle}>
                Upload unlisted videos to YouTube, then come back and they'll appear here.
              </p>
            </div>
          )}

          {/* Picker grid */}
          {!videosQuery.isLoading && allPickerVideos.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3" role="group" aria-label="Your unlisted videos">
                {allPickerVideos.map((video) => {
                  const isSelected = selectedVideoIds.has(video.videoId);
                  return (
                    <button
                      key={video.videoId}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleVideo(video)}
                      className={cx(selectable.base, isSelected ? selectable.active : selectable.idle)}
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video overflow-hidden bg-black">
                        <img
                          src={video.thumbnailUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        {video.durationSeconds > 0 && (
                          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-white/80">
                            {formatDuration(video.durationSeconds)}
                          </span>
                        )}
                        {isSelected && (
                          <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#fa7517]" aria-hidden="true">
                            <Check className="h-3 w-3 text-black" />
                          </span>
                        )}
                      </div>
                      {/* Meta */}
                      <div className="p-3">
                        <p className="line-clamp-2 text-sm leading-snug text-gray-100">
                          {video.title}
                        </p>
                        {video.publishedAt && (
                          <p className="mt-1.5 text-[11px] text-gray-500">
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
                <div className="flex justify-center border-t border-gray-800/60 pt-3">
                  <button
                    type="button"
                    disabled={videosQuery.isFetchingNextPage}
                    onClick={() => videosQuery.fetchNextPage()}
                    className={list.loadMore.button}
                  >
                    {videosQuery.isFetchingNextPage ? (
                      <Loader className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    Load more videos
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ============= MANUAL FALLBACK (collapsed) ============= */}
      {isLinked && (
        <div>
          <button
            type="button"
            onClick={() => setManualOpen((v) => !v)}
            aria-expanded={manualOpen}
            aria-controls="manual-url-fallback"
            className={form.ghostButton}
          >
            <ChevronDown
              className={cx('h-4 w-4 transition-transform', manualOpen && 'rotate-180')}
              aria-hidden="true"
            />
            Or paste a YouTube URL manually
          </button>

          {manualOpen && (
            <section id="manual-url-fallback" className={cx(form.panel, 'mt-3 space-y-3')} aria-label="Video URLs">
              <p className={form.fieldLabel}>Video URLs</p>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        id={`src_urls.${index}.value`}
                        type="text"
                        placeholder="https://youtube.com/watch?v=..."
                        aria-label={`Video URL ${index + 1}`}
                        className={form.input}
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
                        <Loader className="h-4 w-4 shrink-0 animate-spin text-gray-500" aria-label="Fetching video details" />
                      )}
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          title="Remove"
                          aria-label="Remove video URL"
                          className={list.actionButton}
                        >
                          <Trash className={list.actionIcon} aria-hidden="true" />
                        </button>
                      )}
                    </div>

                    {metadataStatuses[index]?.state === 'unresolved' && (
                      <div className={cx(neutralNote, 'flex-col gap-2 sm:flex-row sm:items-center sm:justify-between')}>
                        <p className="text-amber-300">{metadataStatuses[index]?.message}</p>
                        <button type="button" onClick={() => handleRetryMetadata(index)} className={form.secondaryButton}>
                          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Retry
                        </button>
                      </div>
                    )}
                    {metadataStatuses[index]?.state === 'rate_limited' && (
                      <div className={cx(neutralNote, 'flex-col gap-2 sm:flex-row sm:items-center sm:justify-between')}>
                        <p className="text-amber-300">{metadataStatuses[index]?.message}</p>
                        <button type="button" onClick={() => handleRetryMetadata(index)} className={form.secondaryButton}>
                          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Retry
                        </button>
                      </div>
                    )}

                    {srcUrls?.[index]?.title && (
                      <div className="space-y-1.5 border-l border-gray-800/60 pl-3">
                        <div className="flex items-center justify-between gap-3">
                          <label htmlFor={`src_urls.${index}.title`} className={form.fieldLabel}>Title (editable)</label>
                          {srcUrls[index]?.duration && (
                            <span className={form.counter}>{formatDuration(srcUrls[index].duration)}</span>
                          )}
                        </div>
                        <input
                          id={`src_urls.${index}.title`}
                          type="text"
                          placeholder="Video title"
                          className={form.input}
                          {...register(`src_urls.${index}.title`)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {errors.src_urls && (errors.src_urls as any)[0]?.value?.message && (
                <p className={form.errorText}>{(errors.src_urls as any)[0].value.message}</p>
              )}
              {errors.src_urls?.root && <p className={form.errorText}>{errors.src_urls.root.message}</p>}

              <button type="button" onClick={() => append({ value: '' })} className={form.secondaryButton}>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add another video
              </button>
            </section>
          )}
        </div>
      )}

      {/* ============= SELECTED (from form data) ============= */}
      {selectedPreviews.length > 0 && (
        <section className={list.panel} aria-label="Selected videos">
          <div className="flex items-center justify-between gap-3 border-b border-gray-800/60 px-4 py-2.5">
            <p className={form.fieldLabel}>Selected</p>
            <span className={form.counter}>{selectedPreviews.length}</span>
          </div>
          <ul className={list.divider}>
            {selectedPreviews.map(({ urlObj, idx }) => {
              const thumb = getPreviewThumbnail(urlObj.value, urlObj.thumbnail_url);
              const label = urlObj.title || `Video ${idx + 1}`;
              return (
                <li key={`preview-${idx}`} className={cx(list.table.row, 'flex items-center gap-3 px-4 py-3')}>
                  <div className="aspect-video w-24 shrink-0 overflow-hidden rounded-md border border-gray-800/60 bg-black">
                    {thumb ? (
                      <img src={thumb} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-gray-600">No preview</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-gray-100">{label}</p>
                    <p className={cx(list.preview, 'mt-0.5 tabular-nums')}>
                      {getSourceLabel(urlObj.value)}
                      {urlObj.duration ? ` · ${formatDuration(urlObj.duration)}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <a
                      href={urlObj.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open source"
                      aria-label={`Open ${label} on YouTube`}
                      className={list.actionButton}
                    >
                      <ExternalLink className={list.actionIcon} aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      title="Remove video"
                      aria-label={`Remove ${label}`}
                      className={list.actionButton}
                    >
                      <Trash className={list.actionIcon} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ============= NOTES ============= */}
      <div className="space-y-1.5 px-1">
        <p className={page.eyebrow}>Important notes</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-400">
          <li>Only <strong className="font-medium text-gray-200">unlisted</strong> YouTube videos can be added</li>
          <li>Make sure your content follows YouTube's terms of service</li>
          <li>Don't share the direct YouTube link publicly</li>
          <li>Once purchased, your pass gates this content behind a paywall</li>
        </ul>
      </div>
    </div>
  );
};

export default StepVideos;
