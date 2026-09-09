import React, { useEffect, useState } from 'react';

function ImagePreview({ file, alt }: { file: File; alt: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => { const value = URL.createObjectURL(file); setUrl(value); return () => URL.revokeObjectURL(value); }, [file]);
  return <img src={url || undefined} alt={alt} className="h-24 w-full rounded-lg object-contain bg-black" />;
}

type SubjectPickerProps = { disabled?: boolean } & (
  | { multiple: true; value: File[]; onChange: (files: File[]) => void }
  | { multiple?: false; value: File | null; onChange: (file: File | null) => void }
);
export function ThumbnailSubjectPicker(props: SubjectPickerProps) {
  const { value, disabled = false, multiple = false } = props;
  const [error, setError] = useState('');
  const files = Array.isArray(value) ? value : value ? [value] : [];
  const choosePhotos = (selected: File[]) => {
    if (!selected.length) return;
    if (selected.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024 || file.size === 0)) { setError('Choose JPEG, PNG or WebP images up to 5 MB each.'); return; }
    if (multiple && files.length + selected.length > 4) { setError('Choose up to four subject photos.'); return; }
    setError('');
    if (props.multiple) props.onChange([...files, ...selected]); else props.onChange(selected[0]);
  };
  return <fieldset disabled={disabled} className="my-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white">
    <legend className="px-1 font-semibold">Use your real subject</legend>
    <p className="mb-3 text-xs text-gray-400">Choose the person, product or scene to keep recognizable across your concepts.</p>
    <div className="flex flex-wrap gap-3">
      <label className="cursor-pointer rounded-lg border border-white/20 px-3 py-2">{multiple ? 'Add photos' : 'Choose photo'}<input multiple={multiple} aria-label="Subject photo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e => { choosePhotos(Array.from(e.target.files || [])); e.target.value = ''; }} /></label>
    </div>
    {files.map((file, index) => <div key={`${file.name}:${index}`} className="mt-3"><ImagePreview file={file} alt={multiple ? `Selected subject reference ${index + 1}` : 'Selected subject reference'} /><p className="mt-1 text-xs text-orange-300">Selected subject · {file.name}</p><button type="button" onClick={() => { if (props.multiple) props.onChange(files.filter((_, i) => i !== index)); else props.onChange(null); }}>Remove reference{multiple ? ` ${index + 1}` : ''}</button></div>)}

    {error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}
    <p className="mt-2 text-xs text-gray-500">Only your chosen photos are used as subject references.</p>
  </fieldset>;
}
