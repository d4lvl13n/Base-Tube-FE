import React, { useEffect, useState } from 'react';

function ImagePreview({ file, alt }: { file: File; alt: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => { const value = URL.createObjectURL(file); setUrl(value); return () => URL.revokeObjectURL(value); }, [file]);
  return <img src={url || undefined} alt={alt} className="h-24 w-full rounded-lg object-contain bg-black" />;
}

export function ThumbnailSubjectPicker({ value, onChange, disabled = false }: {
  value: File | null; onChange: (file: File | null) => void; disabled?: boolean;
}) {
  const [error, setError] = useState('');
  const choosePhoto = (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024 || file.size === 0) { setError('Choose a JPEG, PNG or WebP image up to 5 MB.'); return; }
    setError(''); onChange(file);
  };
  return <fieldset disabled={disabled} className="my-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white">
    <legend className="px-1 font-semibold">Use your real subject</legend>
    <p className="mb-3 text-xs text-gray-400">Choose the person, product or scene to keep recognizable across your concepts.</p>
    <div className="flex flex-wrap gap-3">
      <label className="cursor-pointer rounded-lg border border-white/20 px-3 py-2">Choose photo<input aria-label="Subject photo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e => { choosePhoto(e.target.files?.[0]); e.target.value = ''; }} /></label>
      {value && <button type="button" onClick={() => onChange(null)}>Remove reference</button>}
    </div>
    {value && <div className="mt-3"><ImagePreview file={value} alt="Selected subject reference" /><p className="mt-1 text-xs text-orange-300">Selected subject · {value.name}</p></div>}
    {error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}
    <p className="mt-2 text-xs text-gray-500">Only your chosen photo is sent to image generation.</p>
  </fieldset>;
}
