import { useCallback, useEffect, useState } from 'react';
import api from '../api/index';
import type { ThumbnailEditing } from '../types/thumbnail';
import { useStudioAccount } from './useStudioAccount';

export interface GalleryThumbnail {
  editing?: ThumbnailEditing;
  id: number;
  thumbnailUrl: string;
  prompt: string;
  size: string;
  quality: string;
  style: string;
  downloadCount: number;
  createdAt: string;
  /** Null for a Studio image: those are private. */
  shareUrl: string | null;
  /** A Studio output: it belongs to a project, so it cannot be shared or deleted from the gallery. */
  studio?: boolean;
}

/** Downloads one of the account's own images, Studio outputs included (`/api/v1/users/me/thumbnails/:id/download`). */
export async function downloadGalleryThumbnail(thumbnailId: string | number): Promise<void> {
  const response = await api.get<Blob>(`/api/v1/users/me/thumbnails/${encodeURIComponent(String(thumbnailId))}/download`, { responseType: 'blob' });
  const type = response.data.type || '';
  const extension = type.includes('webp') ? 'webp' : type.includes('jpeg') ? 'jpg' : 'png';
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ai-thumbnail-${thumbnailId}.${extension}`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * The signed-in gallery of saved thumbnails. Uses the account's own session
 * (Clerk token or wallet cookie) through the shared API client; no public key.
 */
export function useThumbnailGallery() {
  const signedIn = useStudioAccount() !== 'anonymous';
  const [gallery, setGallery] = useState<GalleryThumbnail[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGallery = useCallback(async (page = 0): Promise<void> => {
    if (!signedIn) return;
    setGalleryLoading(true);
    try {
      const limit = 20;
      const response = await api.get(`/api/v1/users/me/thumbnails?limit=${limit}&offset=${page * limit}`);
      const thumbnails: GalleryThumbnail[] = response.data?.success ? response.data.data?.thumbnails || [] : [];
      setGallery(previous => (page === 0 ? thumbnails : [...previous, ...thumbnails]));
    } catch (failure: any) {
      // A 401 means the session is still settling; the next load retries.
      if (failure?.response?.status !== 401) setError('Failed to load your thumbnail gallery.');
    } finally {
      setGalleryLoading(false);
    }
  }, [signedIn]);

  const deleteFromGallery = useCallback(async (thumbnailId: number): Promise<void> => {
    if (!signedIn) return;
    try {
      await api.delete(`/api/v1/users/me/thumbnails/${thumbnailId}`);
      setGallery(previous => previous.filter(thumbnail => thumbnail.id !== thumbnailId));
    } catch (failure: any) {
      setError(failure?.response?.data?.error?.message || 'Failed to delete thumbnail.');
    }
  }, [signedIn]);

  const downloadThumbnail = useCallback(async (thumbnailId: string | number): Promise<void> => {
    setError(null);
    try {
      await downloadGalleryThumbnail(thumbnailId);
    } catch {
      setError('Failed to download thumbnail. Please try again.');
    }
  }, []);

  useEffect(() => {
    if (!signedIn) setGallery([]);
  }, [signedIn]);

  return { gallery, galleryLoading, loadGallery, deleteFromGallery, downloadThumbnail, error, isAuthenticated: signedIn };
}
