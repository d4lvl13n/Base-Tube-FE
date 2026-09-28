import React, { useEffect, useState } from 'react';
import { Check, ImagePlus, X } from 'lucide-react';

function ImagePreview({ file, alt }: { file: File; alt: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => { const value = URL.createObjectURL(file); setUrl(value); return () => URL.revokeObjectURL(value); }, [file]);
  return <img src={url || undefined} alt={alt} className="h-full w-full object-contain" />;
}

function SavedReferencePreview({ url, alt }: { url: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  return url && !failed ? <img src={url} alt={alt} className="h-full w-full object-contain" onError={() => setFailed(true)} /> : <ImagePlus className="h-6 w-6 text-zinc-500" aria-hidden="true" />;
}

type SubjectPickerProps = { disabled?: boolean; savedReferences?: Array<{ id: string; url: string; name: string }>; onRemoveSaved?: (id: string) => void } & (
  | { multiple: true; value: File[]; onChange: (files: File[]) => void }
  | { multiple?: false; value: File | null; onChange: (file: File | null) => void }
);
export function ThumbnailSubjectPicker(props: SubjectPickerProps) {
  const { value, disabled = false, multiple = false, savedReferences = [] } = props;
  const [error, setError] = useState('');
  const files = Array.isArray(value) ? value : value ? [value] : [];
  const choosePhotos = (selected: File[]) => {
    if (!selected.length) return;
    if (selected.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024 || file.size === 0)) { setError('Choose JPEG, PNG or WebP images up to 5 MB each.'); return; }
    if (multiple && files.length + savedReferences.length + selected.length > 4) { setError('Choose up to four subject photos.'); return; }
    setError('');
    if (props.multiple) props.onChange([...files, ...selected]); else props.onChange(selected[0]);
  };
  return <fieldset disabled={disabled} className="my-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white">
    <legend className="px-1 font-semibold">Use your real subject</legend>
    <p className="mb-3 text-xs text-gray-400">Choose the person, product or scene to keep recognizable across your concepts.</p>
    <div className="flex flex-wrap gap-3">
      <label className="cursor-pointer rounded-lg border border-white/20 px-3 py-2">{multiple ? 'Add photos' : 'Choose photo'}<input multiple={multiple} aria-label="Subject photo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e => { choosePhotos(Array.from(e.target.files || [])); e.target.value = ''; }} /></label>
    </div>
    {files.map((file, index) => <div key={`${file.name}:${index}`} className="mt-3 flex items-center gap-3 rounded-xl border border-orange-500/25 bg-orange-500/[.055] p-2"><div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/40"><ImagePreview file={file} alt={multiple ? `Selected subject reference ${index + 1}` : 'Selected subject reference'} /></div><div className="min-w-0 flex-1"><p className="flex items-center gap-1.5 text-xs font-medium text-orange-300"><Check size={14} aria-hidden="true" />Added to this thumbnail</p><p className="mt-1 truncate text-xs text-zinc-200">{file.name}</p></div><button type="button" aria-label={multiple ? `Remove reference ${index + 1}` : 'Remove reference'} className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white" onClick={() => { if (props.multiple) props.onChange(files.filter((_, i) => i !== index)); else props.onChange(null); }}><X size={16} aria-hidden="true" /></button></div>)}
    {savedReferences.map((reference, index) => <div key={reference.id} className="mt-3 flex items-center gap-3 rounded-xl border border-orange-500/25 bg-orange-500/[.055] p-2"><div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/40"><SavedReferencePreview url={reference.url} alt={`Saved subject reference ${index + 1}`} /></div><div className="min-w-0 flex-1"><p className="flex items-center gap-1.5 text-xs font-medium text-orange-300"><Check size={14} aria-hidden="true" />Added to this thumbnail</p><p className="mt-1 truncate text-xs text-zinc-200">{reference.name}</p>{!reference.url && <p className="mt-1 text-[11px] text-zinc-400">Loading preview…</p>}</div>{props.onRemoveSaved && <button type="button" aria-label={`Remove reference ${index + 1}`} className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white" onClick={() => props.onRemoveSaved?.(reference.id)}><X size={16} aria-hidden="true" /></button>}</div>)}

    {error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}
    <p className="mt-2 text-xs text-gray-500">Only your chosen photos are used as subject references.</p>
  </fieldset>;
}
