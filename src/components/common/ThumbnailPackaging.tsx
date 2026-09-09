import React, { useEffect, useState } from 'react';
import { SavedThumbnailStyle, thumbnailPackagingApi } from '../../api/thumbnailPackaging';
import { thumbnailMediaUrl } from '../../utils/thumbnailMediaUrl';

const message = (error: any) => error?.response?.data?.error?.message || error?.message || 'Could not save your style. Please try again.';
const stylesChangedEvent = 'thumbnail-styles-changed';
const buttonClass = 'rounded-lg border border-white/20 px-3 py-2 text-sm text-white disabled:opacity-40';

export function SaveThumbnailStyle({ imageUrl }: { imageUrl: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const save = async () => {
    if (busy || !name.trim()) return;
    setBusy(true); setError('');
    try { const result = await thumbnailPackagingApi.save(imageUrl, name.trim()); setSaved(result.name); setOpen(false); window.dispatchEvent(new Event(stylesChangedEvent)); }
    catch (error) { setError(message(error)); }
    finally { setBusy(false); }
  };
  return <div className="mt-3 space-y-2" onClick={event => event.stopPropagation()}>
    <button type="button" className={buttonClass} disabled={busy} onClick={() => { setOpen(!open); setError(''); }}>Save style</button>
    {saved && <p role="status" className="text-sm text-emerald-300">Saved as “{saved}”. Choose it under Channel style next time.</p>}
    {open && <div className="space-y-2 rounded-xl border border-white/10 p-3">
      <label className="block text-sm text-white">Channel or style name
        <input aria-label="Channel or style name" value={name} maxLength={80} disabled={busy} onChange={event => setName(event.target.value)} placeholder="e.g. My music channel" className="mt-2 block w-full rounded-lg bg-white/5 p-2" />
      </label>
      <p className="text-xs text-gray-400">Reuse this image’s typography, colors and layout with a new subject and headline.</p>
      <button type="button" className={buttonClass} disabled={busy || !name.trim()} onClick={save}>{busy ? 'Saving…' : 'Save channel style'}</button>
    </div>}
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
  </div>;
}

export function ThumbnailStylePicker({ value, onChange, disabled }: { value?: number; onChange: (id?: number, hasLogo?: boolean) => void; disabled?: boolean }) {
  const [styles, setStyles] = useState<SavedThumbnailStyle[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    thumbnailPackagingApi.list().then(result => { if (active) setStyles(result); })
      .catch(() => { if (active) setError('Could not load saved styles. Retry to use your channel style.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);
  useEffect(() => {
    const refresh = () => setRevision(n => n + 1);
    window.addEventListener(stylesChangedEvent, refresh);
    return () => window.removeEventListener(stylesChangedEvent, refresh);
  }, []);
  const selected = styles.find(style => style.id === value);
  const remove = async () => {
    if (!selected || loading) return;
    setLoading(true); setError('');
    try { await thumbnailPackagingApi.remove(selected.id); setStyles(previous => previous.filter(style => style.id !== selected.id)); onChange(undefined); }
    catch (error) { setError(message(error)); }
    finally { setLoading(false); }
  };
  return <fieldset className="my-5 rounded-xl border border-white/10 p-4" disabled={disabled}>
    <legend className="px-1 text-sm font-semibold text-white">Channel style</legend>
    <select aria-label="Channel style" value={value ?? ''} disabled={loading} onChange={event => onChange(event.target.value ? Number(event.target.value) : undefined, styles.find(style => style.id === Number(event.target.value))?.hasLogo)} className="w-full rounded-lg bg-[#171719] p-3 text-white">
      <option value="">{loading ? 'Loading styles…' : 'Start without a saved style'}</option>
      {value && !selected && <option value={value}>Selected style unavailable</option>}
      {styles.map(style => <option key={style.id} value={style.id}>{style.name}</option>)}
    </select>
    {selected ? <div className="mt-3 flex items-center gap-3">
      <img src={thumbnailMediaUrl(selected.imageUrl)} alt={selected.name} className="w-32 rounded-lg aspect-video object-contain" />
      <div className="space-y-2"><p className="text-xs text-gray-400">Match this style. Use your new brief for the subject and words.{selected.hasLogo && ' Your saved original logo will be included automatically.'}</p>
        <button type="button" className={buttonClass} disabled={loading} onClick={remove}>Remove saved style</button>
      </div>
    </div> : null}
    <p className="mt-2 text-xs text-gray-400">To add another style, generate a thumbnail or open one in your gallery, then choose “Save style”. Your other saved styles stay available.</p>
    {error && <p role="alert" className="mt-2 text-sm text-red-300">{error} <button type="button" onClick={() => setRevision(n => n + 1)}>Retry</button></p>}
  </fieldset>;
}
