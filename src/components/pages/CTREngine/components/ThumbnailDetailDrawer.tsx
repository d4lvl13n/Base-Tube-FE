import { OpenThumbnailProject } from './studio/OpenThumbnailProject';
import { studioDownloadErrorMessage, studioExportChoiceLabel, studioSuggestedExport } from '../../../../api/studioErrors';
import type { StudioExportChoice } from '../../../../api/studioErrors';
import { SaveThumbnailStyle } from '../../../common/ThumbnailPackaging';
import { thumbnailMediaUrl } from '../../../../utils/thumbnailMediaUrl';
import { PreciseThumbnailEditor, ThumbnailEditVersion, ControlledThumbnailEditor } from '../../../common/PreciseThumbnailEditor';
import { ThumbnailSizePreset } from '../../../../types/thumbnail';
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  Check,
  Download,
  FileImage,
  Share2,
  X,
} from 'lucide-react';
import { useStudioAccount } from '../../../../hooks/useStudioAccount';
import { downloadGalleryThumbnail } from '../../../../hooks/useThumbnailGallery';
import Button from '../../../common/Button';
import { ViralSharePopup } from './ViralSharePopup';

export interface GeneratedThumbnail {
  editing?: ThumbnailEditVersion['editing'];
  id: string | number;
  prompt: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  shareUrl?: string;
  size?: ThumbnailSizePreset;
}

export interface ControlledThumbnailDrawer {
  editor: ControlledThumbnailEditor;
  /** `choice`: the export the server suggested after EXPORT_TOO_LARGE, instead of the page's settings. */
  onDownload: (thumbnail: GeneratedThumbnail, choice?: StudioExportChoice) => void | Promise<void>;
  onSelect?: (thumbnail: GeneratedThumbnail) => void;
  selected?: boolean;
  versionInfo?: React.ReactNode;
  actions?: React.ReactNode;
  downloadDisabled?: boolean;
  editingDisabled?: boolean;
}
interface ThumbnailDetailDrawerProps {
  controlled?: ControlledThumbnailDrawer;
  thumbnail: GeneratedThumbnail | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Without `controlled`, the drawer shows one of the signed-in account's saved
 * gallery thumbnails: download, share, style saving and "Open in a project".
 */
export const ThumbnailDetailDrawer: React.FC<ThumbnailDetailDrawerProps> = props => props.controlled
  ? <ThumbnailDetailDrawerBody {...props} />
  : <GalleryThumbnailDetailDrawer {...props} />;

const GalleryThumbnailDetailDrawer: React.FC<ThumbnailDetailDrawerProps> = props => {
  const isAuthenticated = useStudioAccount() !== 'anonymous';
  return <ThumbnailDetailDrawerBody {...props} gallery={{ isAuthenticated, download: downloadGalleryThumbnail }} />;
};
type GalleryDrawer = { isAuthenticated: boolean; download: (thumbnailId: string | number) => Promise<void> };
const ThumbnailDetailDrawerBody: React.FC<ThumbnailDetailDrawerProps & { gallery?: GalleryDrawer }> = ({ thumbnail, isOpen, onClose, controlled, gallery }) => {
  const isAuthenticated = Boolean(gallery?.isAuthenticated);
  const [controlledError, setControlledError] = useState('');
  const [suggestedExport, setSuggestedExport] = useState<StudioExportChoice | null>(null);
  const [version, setVersion] = useState<ThumbnailEditVersion | null>(null);
  const legacySourceId = useRef<string | number>();
  useEffect(() => {
    // Reopening the same legacy thumbnail must preserve its local edit history.
    if (controlled || legacySourceId.current === thumbnail?.id) return;
    legacySourceId.current = thumbnail?.id;
    setVersion(thumbnail ? { imageUrl: thumbnail.imageUrl || thumbnail.thumbnailUrl || '', id: thumbnail.id, shareUrl: thumbnail.shareUrl, editing: thumbnail.editing } : null);
  }, [controlled, thumbnail]);
  const displayedVersion = controlled?.editor.version || version;
  const current = thumbnail && displayedVersion ? { ...thumbnail, ...displayedVersion, id: displayedVersion.id ?? (controlled ? thumbnail.id : 'edited'), thumbnailUrl: displayedVersion.imageUrl } : thumbnail;
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'downloaded'>('idle');
  const [isViralShareOpen, setIsViralShareOpen] = useState(false);
  useEffect(() => { setControlledError(''); setDownloadStatus('idle'); }, [controlled?.editor.version.id]);
  // Move focus into the drawer when it opens and back to what opened it when it closes.
  const closeButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (isOpen) {
      if (document.activeElement instanceof HTMLElement) opener.current = document.activeElement;
      const timer = window.setTimeout(() => closeButton.current?.focus(), 0);
      return () => window.clearTimeout(timer);
    }
    const target = opener.current;
    opener.current = null;
    if (target?.isConnected) target.focus();
  }, [isOpen]);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setDownloadStatus('idle');
      setControlledError('');
      setSuggestedExport(null);
    }
  }, [isOpen]);

  const handleDownload = async (choice?: StudioExportChoice) => {
    if (!thumbnail) return;

    setDownloadStatus('downloading');
    setControlledError('');
    setSuggestedExport(null);

    try {
      if (controlled && current) await (choice ? controlled.onDownload(current, choice) : controlled.onDownload(current));
      else await gallery?.download(current?.id ?? thumbnail.id);
      setDownloadStatus('downloaded');
      window.setTimeout(() => setDownloadStatus('idle'), 1800);
    } catch (err) {
      setControlledError(controlled ? studioDownloadErrorMessage(err) : 'Could not download this image. Please try again.');
      if (controlled) setSuggestedExport(studioSuggestedExport(err));
      setDownloadStatus('idle');
    }
  };

  const handleShare = () => {
    if (!thumbnail) return;
    setIsViralShareOpen(true);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  const imageSrc = current?.imageUrl || current?.thumbnailUrl || '';
  const isPersistedThumbnail = /^\d+$/.test(String(thumbnail?.id ?? ''));
  const sourceLabel = controlled ? 'Saved project version' : isPersistedThumbnail ? 'Saved thumbnail' : 'Fresh generation';
  const hasShareUrl = !controlled && Boolean(current?.shareUrl);
  const statusLabel = hasShareUrl ? 'Public link ready' : 'Ready to export';

  return (
    <div hidden={!isOpen}><AnimatePresence mode="wait">
      {thumbnail && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Thumbnail details"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 z-50 h-full w-full overflow-hidden sm:w-[680px] xl:w-[720px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-full flex-col bg-[#09090a] text-white shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
              <header className="border-b border-white/10 px-4 py-4 sm:px-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] sm:flex">
                      <FileImage className="h-5 w-5 text-[#fa7517]" />
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
                        Thumbnail
                      </h2>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1.5 text-emerald-300">
                          <Check className="h-3.5 w-3.5" />
                          {statusLabel}
                        </span>
                        <span>{sourceLabel}</span>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[#fa7517]" />
                          {formatDate(thumbnail.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    ref={closeButton}
                    type="button"
                    onClick={onClose}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-gray-400 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                    aria-label="Close thumbnail details"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

              </header>

              <main className="min-h-0 flex-1 overflow-y-auto bg-[#060607] p-3 sm:p-5">
                <div className="flex min-h-full flex-col">
                  <section className="flex min-h-[180px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black">
                    {imageSrc ? (
                      <img
                        src={thumbnailMediaUrl(imageSrc)}
                        alt="AI generated thumbnail"
                        className="max-h-full w-full object-contain"
                        onContextMenu={handleContextMenu}
                        draggable="false"
                        onLoad={controlled ? event => { event.currentTarget.style.display = ''; } : undefined}
                        onError={(event) => {
                          console.error('Failed to load thumbnail image:', imageSrc);
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex min-h-[320px] w-full flex-col items-center justify-center gap-3 text-gray-500">
                        <FileImage className="h-8 w-8" />
                        <p className="text-sm">Preview unavailable</p>
                      </div>
                    )}
                  </section>

                  {controlled ? <>
                    {controlled.versionInfo}
                    <PreciseThumbnailEditor controlled={controlled.editor} disabled={controlled.editingDisabled} />
                    {controlled.actions}
                  </> : <>
                  {isAuthenticated && <SaveThumbnailStyle key={`style:${imageSrc}`} imageUrl={imageSrc} />}
                  {/* AI edits in the AI Thumbnails area go through a Studio project (spec §17.4). */}
                  {isAuthenticated && current && <OpenThumbnailProject thumbnailId={current.id} prompt={thumbnail.prompt} />}
                  </>}
                  {controlledError && <p role="alert" className="mt-4 rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{controlledError}</p>}
                  {suggestedExport && <button type="button" disabled={downloadStatus === 'downloading'} onClick={() => void handleDownload(suggestedExport)} className="mt-3 w-full rounded-lg border border-orange-500/40 px-4 py-2.5 text-sm text-white hover:bg-orange-500/10">Download as {studioExportChoiceLabel(suggestedExport)} instead</button>}

                </div>
              </main>

              <footer className="border-t border-white/10 bg-[#09090a]/95 px-4 py-4 backdrop-blur-xl sm:px-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                  <Button
                    onClick={() => void handleDownload()}
                    disabled={downloadStatus === 'downloading' || controlled?.downloadDisabled}
                    className="min-h-[52px] w-full rounded-lg bg-[#fa7517] px-5 py-3 font-semibold text-white shadow-[0_14px_34px_rgba(250,117,23,0.24)] transition-colors hover:bg-orange-500 disabled:opacity-50"
                  >
                    {downloadStatus === 'downloading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Preparing
                      </span>
                    ) : downloadStatus === 'downloaded' ? (
                      <span className="flex items-center justify-center gap-2">
                        <Check className="h-5 w-5" />
                        Downloaded
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Download className="h-5 w-5" />
                        {controlled ? 'Download · free' : 'Download image'}
                      </span>
                    )}
                  </Button>

                  {controlled ? controlled.onSelect && <button type="button" disabled={controlled.selected} onClick={() => current && controlled.onSelect?.(current)} className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-5 py-3 font-semibold text-white disabled:opacity-60">{controlled.selected ? 'Selected version' : 'Keep this version'}</button> : hasShareUrl && (
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-5 py-3 font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/[0.08]"
                  >
                    <Share2 className="h-4.5 w-4.5 text-[#fa7517]" />
                    Share
                  </button>                  )}

                </div>
              </footer>
            </div>
          </motion.aside>
        </>
      )}

      {!controlled && <ViralSharePopup
        thumbnail={current}
        isOpen={isViralShareOpen}
        onClose={() => setIsViralShareOpen(false)}
      />}
    </AnimatePresence></div>
  );
};
