// Settings › Channel style: thumbnail styles saved from results ("Save style"),
// which Create offers under "Channel style". Hidden when there are none.
import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { SavedThumbnailStyle, thumbnailPackagingApi } from '../../../../../api/thumbnailPackaging';
import { thumbnailMediaUrl } from '../../../../../utils/thumbnailMediaUrl';
import { plainApiError, type PlainApiError } from '../../../../../utils/plainApiError';
import { TechnicalErrorDetail } from '../../../../common/TechnicalErrorDetail';

/** Fired by the style picker and "Save style" when the saved styles change. */
const STYLES_CHANGED_EVENT = 'thumbnail-styles-changed';

export default function SettingsSavedStyles() {
  const [styles, setStyles] = useState<SavedThumbnailStyle[]>([]);
  const [removing, setRemoving] = useState<number | null>(null);
  const [error, setError] = useState<PlainApiError | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    // Best effort: without saved styles (or if they fail to load) the section is simply absent.
    Promise.resolve()
      .then(() => thumbnailPackagingApi.list())
      .then((result) => {
        if (active) setStyles(Array.isArray(result) ? result : []);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [revision]);

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener(STYLES_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(STYLES_CHANGED_EVENT, refresh);
  }, []);

  const remove = async (style: SavedThumbnailStyle) => {
    setRemoving(style.id);
    setError(null);
    try {
      await thumbnailPackagingApi.remove(style.id);
      setStyles((previous) => previous.filter((item) => item.id !== style.id));
      window.dispatchEvent(new Event(STYLES_CHANGED_EVENT));
    } catch (failure) {
      setError(plainApiError(failure, `“${style.name}” was not removed. Please try again.`));
    } finally {
      setRemoving(null);
    }
  };

  if (styles.length === 0) return null;
  return (
    <div className="mt-8 border-t border-white/[0.08] pt-6">
      <h3 className="text-sm font-semibold text-white">Saved thumbnail styles</h3>
      <p className="mb-3 mt-1 text-xs text-zinc-500">Saved from your results. Create offers them under Channel style.</p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {styles.map((style) => (
          <li key={style.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
            <img src={thumbnailMediaUrl(style.imageUrl)} alt="" className="aspect-video w-full bg-black object-contain" />
            <div className="flex items-center gap-2 px-2.5 py-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-white">{style.name}</span>
                {style.hasLogo && <span className="block text-[11px] text-emerald-300">Logo included</span>}
              </span>
              <button
                type="button"
                disabled={removing !== null}
                onClick={() => void remove(style)}
                aria-label={`Remove saved style ${style.name}`}
                title="Remove"
                className="shrink-0 rounded-lg p-1.5 text-zinc-500 hover:bg-white/10 hover:text-red-300 disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {error.message}
          <TechnicalErrorDetail detail={error.technical} />
        </p>
      )}
    </div>
  );
}
