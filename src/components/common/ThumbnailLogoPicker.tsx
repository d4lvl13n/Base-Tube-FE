import React, { useEffect, useRef, useState } from 'react';
import { Check, ImagePlus, RefreshCw, Trash2 } from 'lucide-react';

export function ThumbnailLogoPicker({ value, onChange, savedLogo = false, disabled = false, onCheckingChange }: {
  value: File | null; onChange: (file: File | null) => void; savedLogo?: boolean; disabled?: boolean;
  onCheckingChange: (checking: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!value) { setPreview(''); return; }
    const url = URL.createObjectURL(value); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const choose = async (file?: File) => {
    if (!file || disabled || checking) return;
    setError('');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || !file.size || file.size > 5 * 1024 * 1024) {
      setError('Choose a PNG, JPEG or WebP logo up to 5 MB. Your current logo has not changed.'); return;
    }
    setChecking(true); onCheckingChange(true);
    const url = URL.createObjectURL(file);
    try {
      await new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => image.naturalWidth > 0 && image.naturalHeight > 0 && image.naturalWidth * image.naturalHeight <= 40000000 ? resolve() : reject(new Error());
        image.onerror = () => reject(new Error());
        image.src = url;
      });
      if (mounted.current) onChange(file);
    } catch {
      if (mounted.current) setError('This image could not be read or is too large to process. Choose another logo. Your current logo has not changed.');
    } finally {
      URL.revokeObjectURL(url);
      if (mounted.current) { setChecking(false); onCheckingChange(false); }
    }
  };
  const button = 'inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa7517] disabled:cursor-not-allowed disabled:opacity-40';
  return <fieldset disabled={disabled || checking} className="my-4 rounded-xl border border-white/10 bg-black/20 p-4 text-white" aria-busy={checking}>
    <legend className="px-1 text-sm font-semibold">Channel logo</legend>
    <p className="mb-4 text-sm text-gray-400">Add your logo once, then save the thumbnail as a channel style to reuse it.</p>
    <input ref={input} aria-label="Channel logo file" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={event => { void choose(event.target.files?.[0]); event.target.value = ''; }} />
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#29292d] p-2">
        {value && preview ? <img src={preview} alt="Selected channel logo" className="h-full w-full object-contain" /> : <ImagePlus className="h-7 w-7 text-gray-500" aria-hidden="true" />}
      </div>
      <div className="min-w-0 flex-1 basis-40">
        <p className="break-all text-sm font-medium">{value ? value.name : savedLogo ? 'Logo from your saved style' : 'No logo selected'}</p>
        <p role="status" className={`mt-1 flex items-center gap-1.5 text-xs ${value || savedLogo ? 'text-emerald-300' : 'text-gray-400'}`}>
          {(value || savedLogo) && !checking && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
          {checking ? 'Checking image…' : value ? 'Ready for your next generation' : savedLogo ? 'Included automatically — no upload needed' : 'Optional · PNG, JPEG or WebP · Up to 5 MB'}
        </p>
        {value && <p className="mt-1 text-xs text-gray-400">{(value.size / 1024).toFixed(0)} KB{savedLogo ? ' · Replaces the saved logo for this generation' : ' · Saved with your style after generation'}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`${button} border-[#fa7517]/30 bg-[#fa7517]/10 text-[#fa7517] hover:bg-[#fa7517]/20`} onClick={() => input.current?.click()}>
          {value || savedLogo ? <RefreshCw className="h-4 w-4" aria-hidden="true" /> : <ImagePlus className="h-4 w-4" aria-hidden="true" />}{value || savedLogo ? 'Replace logo' : 'Choose logo'}
        </button>
        {value && <button type="button" aria-label={savedLogo ? 'Use saved logo instead' : 'Remove logo'} className={`${button} border-white/15 text-gray-300 hover:bg-white/10`} onClick={() => { onChange(null); setError(''); }}><Trash2 className="h-4 w-4" aria-hidden="true" />{savedLogo ? 'Use saved logo' : 'Remove'}</button>}
      </div>
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
  </fieldset>;
}
