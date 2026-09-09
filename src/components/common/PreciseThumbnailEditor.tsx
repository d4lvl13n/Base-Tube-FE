import { ctrApi } from '../../api/ctr';
import React, { useEffect, useRef, useState } from 'react';
import { ThumbnailConversationState, ThumbnailEditing } from '../../types/thumbnail';

export interface ThumbnailEditVersion {
  editing?: ThumbnailEditing;
  imageUrl: string;
  id?: string | number;
  shareUrl?: string;
  conversation?: ThumbnailConversationState;
}
export type ThumbnailEditTarget = 'custom' | 'background' | 'framing' | 'expression' | 'headline';
export function preciseEditInstruction(target: ThumbnailEditTarget, instruction: string): string {
  if (target === 'headline') return `Replace the headline with exactly ${JSON.stringify(instruction.trim())}. Render the replacement exactly once, with legible typography that fits the existing design. Preserve the subject identity, expression, background, composition, lighting, colors, and all other text. Change only the headline and do not add additional words.`;
  const keep = { background: 'subject identity, expression, subject position, and existing text', framing: 'subject identity, expression, background style, and existing text', expression: 'person identity, clothing, background, composition, and existing text', custom: 'everything the request does not explicitly ask to change' }[target];
  return `Requested change${target === 'custom' ? '' : ` (${target})`}: ${instruction.trim()}\nPreserve ${keep}. Make only the requested change.`;
}

export function PreciseThumbnailEditor({ initial, onRefine, onChange, disabled = false, editCreditCost }: {
  editCreditCost?: number;
  initial: ThumbnailEditVersion;
  onRefine: (version: ThumbnailEditVersion, instruction: string) => Promise<ThumbnailEditVersion>;
  onChange: (version: ThumbnailEditVersion) => void;
  disabled?: boolean;
}) {
  const [versions, setVersions] = useState<Array<ThumbnailEditVersion & { parent?: number }>>([initial]);
  const [index, setIndex] = useState(0);
  const [target, setTarget] = useState<ThumbnailEditTarget>('custom');
  const [adjustments, setAdjustments] = useState(initial.editing);
  const [instruction, setInstruction] = useState('');
  const [headline, setHeadline] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const selectVersion = (next: number) => { setIndex(next); onChange(versions[next]); setError(''); setAdjustments(versions[next].editing); setHeadline(''); };
  const submit = async (text = instruction, editTarget = target, removeText = false) => {
    if (inFlight.current || disabled || (!removeText && !text.trim())) return;
    inFlight.current = true; setBusy(true); setError('');
    const parent = index;
    try {
      const source = versions[index];
      const cleanSource = source.editing ? { ...source, imageUrl: source.editing.baseImageUrl, id: source.editing.baseThumbnailId, conversation: undefined } : source;
      let pendingAdjustments: ThumbnailEditing | undefined;
      const request = removeText
        ? 'Remove the added headline, captions and text graphics. Reconstruct only the areas they covered to match the surrounding image. Preserve the subject identity, expression, framing, background, lighting, colors and authentic product markings. Do not add any replacement text.'
        : preciseEditInstruction(editTarget, text);
      let result = await onRefine(cleanSource, request + (source.editing ? '\nKeep this as a clean base image. Do not add a headline, caption or typography.' : ''));
      if (source.editing && result.id) {
        const nextEditing = { ...source.editing, baseThumbnailId: Number(result.id), baseImageUrl: result.imageUrl };
        try {
          const composed = await ctrApi.applyFinalAdjustments(nextEditing);
          result = { ...result, imageUrl: composed.thumbnailUrl, id: composed.id, shareUrl: composed.shareUrl, editing: composed.editing };
        } catch {
          pendingAdjustments = nextEditing;
          result = { ...result, editing: { ...nextEditing, textPlan: { ...nextEditing.textPlan, headline: '', subhead: '' } } };
          if (mounted.current) setError('Image edited, but text could not be reapplied. Your new base is saved; apply the text again without another AI edit.');
        }
      }
      if (!result.imageUrl) throw new Error('The edit returned no image. Your original is unchanged.');
      if (!mounted.current) return;
      setVersions(prev => [...prev, { ...result, parent }]); setIndex(versions.length); setInstruction(''); setHeadline(''); setAdjustments(pendingAdjustments || result.editing); onChange(result);
    } catch (err: any) {
      if (mounted.current) setError(err.response?.data?.error?.message || err.message || 'Editing failed. Your original is unchanged.');
    } finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  };
  const applyAdjustments = async (removeText = false) => {
    if (!adjustments || inFlight.current || disabled) return;
    const source = versions[index];
    if (!source.editing) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      const editing = { ...adjustments, baseThumbnailId: source.editing.baseThumbnailId, baseImageUrl: source.editing.baseImageUrl,
        textPlan: removeText ? { ...adjustments.textPlan, headline: '', subhead: '' } : adjustments.textPlan };
      const result = await ctrApi.applyFinalAdjustments(editing);
      if (!result.thumbnailUrl || !result.editing) throw new Error('The adjustment returned no saved image.');
      if (!mounted.current) return;
      const next = { imageUrl: result.thumbnailUrl, id: result.id, shareUrl: result.shareUrl, editing: result.editing };
      setVersions(prev => [...prev, { ...next, parent: index }]); setIndex(versions.length); setAdjustments(next.editing); onChange(next);
    } catch (err: any) {
      if (mounted.current) setError(err.response?.data?.error?.message || err.message || 'Could not apply adjustments.');
    } finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  };
  return <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white">
    {editCreditCost !== undefined && <p className="mb-3 text-xs text-orange-300">Each AI edit costs {editCreditCost} credits. Undo and switching versions are free.</p>}
    {adjustments && <fieldset disabled={busy || disabled} className="mb-4 space-y-2">
      <legend className="mb-2 font-semibold">Final adjustments</legend>
      <label className="block">Headline<input aria-label="Headline" value={adjustments.textPlan.headline} maxLength={90} onChange={e => setAdjustments({ ...adjustments, textPlan: { ...adjustments.textPlan, headline: e.target.value } })} className="mt-1 w-full rounded-lg bg-gray-900 p-2" /></label>
      <label className="block">Subheading<input aria-label="Subheading" value={adjustments.textPlan.subhead || ''} maxLength={120} onChange={e => setAdjustments({ ...adjustments, textPlan: { ...adjustments.textPlan, subhead: e.target.value } })} className="mt-1 w-full rounded-lg bg-gray-900 p-2" /></label>
      <div className="flex flex-wrap gap-2">
        <label>Position<select aria-label="Text position" value={adjustments.textPlan.zone} onChange={e => setAdjustments({ ...adjustments, textPlan: { ...adjustments.textPlan, zone: e.target.value as ThumbnailEditing['textPlan']['zone'] } })} className="block rounded-lg bg-gray-900 p-2">{['bottom', 'top', 'left', 'right', 'center'].map(zone => <option key={zone} value={zone}>{zone}</option>)}</select></label>
        <label>Font<select aria-label="Text font" value={adjustments.textStyle.font} onChange={e => setAdjustments({ ...adjustments, textStyle: { ...adjustments.textStyle, font: e.target.value as ThumbnailEditing['textStyle']['font'] } })} className="block rounded-lg bg-gray-900 p-2">{['DejaVu Sans', 'DejaVu Serif', 'DejaVu Sans Mono'].map(font => <option key={font}>{font}</option>)}</select></label>
        <label>Colour<input aria-label="Text colour" type="color" value={adjustments.textStyle.color} onChange={e => setAdjustments({ ...adjustments, textStyle: { ...adjustments.textStyle, color: e.target.value } })} className="block" /></label>
      </div>
      <label className="block">Text size<input aria-label="Text size" type="range" min="0.4" max="1" step="0.05" value={adjustments.textStyle.fontScale} onChange={e => setAdjustments({ ...adjustments, textStyle: { ...adjustments.textStyle, fontScale: Number(e.target.value) } })} className="ml-2" /></label>
      <label className="block"><input aria-label="Text outline" type="checkbox" checked={adjustments.textStyle.stroke} onChange={e => setAdjustments({ ...adjustments, textStyle: { ...adjustments.textStyle, stroke: e.target.checked } })} /> Text outline</label>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={() => applyAdjustments()} className="rounded-lg bg-white px-3 py-2 text-black">Apply adjustments</button><button type="button" onClick={() => applyAdjustments(true)} className="rounded-lg border border-white/20 px-3 py-2">Remove text</button></div>
      <p className="text-xs text-gray-400">Apply to update the saved preview and download. No AI credits used.</p>
    </fieldset>}
    {!adjustments && <fieldset disabled={busy || disabled} className="mb-4 space-y-2">
      <legend className="mb-2 font-semibold">Headline</legend>
      <input aria-label="Headline" value={headline} maxLength={90} onChange={e => setHeadline(e.target.value)} placeholder="Enter the exact replacement headline" className="w-full rounded-lg bg-gray-900 p-2" />
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!headline.trim()} onClick={() => submit(headline, 'headline')} className="rounded-lg bg-white px-3 py-2 text-black disabled:opacity-40">Update text</button>
        <button type="button" onClick={() => submit('', 'headline', true)} className="rounded-lg border border-white/20 px-3 py-2">Remove text</button>
      </div>
      <p className="text-xs text-gray-400">Uses AI image editing; thumbnail limits apply. Review spelling and layout before using the result.</p>
    </fieldset>}
    <p className="mb-2 font-semibold">Change only what you choose</p>
    <label className="block text-xs text-gray-400">Edit target<select aria-label="Edit target" value={target} disabled={busy || disabled} onChange={e => setTarget(e.target.value as ThumbnailEditTarget)} className="my-1 w-full rounded-lg bg-gray-900 p-2 text-white">
      <option value="custom">Custom change</option><option value="background">Background</option><option value="framing">Subject size / framing</option><option value="expression">Expression</option>
    </select></label>
    <textarea aria-label="Edit instruction" value={instruction} onChange={e => setInstruction(e.target.value)} maxLength={1200} rows={2} disabled={busy || disabled} placeholder={target === 'headline' ? 'Type the exact replacement headline' : 'Describe the change. Everything else stays the same.'} className="w-full rounded-lg bg-gray-900 p-2 text-sm" />
    {error && <p role="alert" className="my-2 text-xs text-red-300">{error}</p>}
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button type="button" disabled={busy || disabled || !instruction.trim()} onClick={() => submit()} className="rounded-lg bg-white px-3 py-2 text-black disabled:opacity-40">{busy ? 'Editing…' : 'Apply edit'}</button>
      <button type="button" disabled={busy || disabled || versions[index].parent === undefined} onClick={() => selectVersion(versions[index].parent!)} className="rounded-lg border border-white/20 px-3 py-2 disabled:opacity-40">Undo</button>
      <button type="button" disabled={busy || disabled || index === 0} onClick={() => selectVersion(0)} className="rounded-lg border border-white/20 px-3 py-2 disabled:opacity-40">Reset</button>
      {versions.length > 1 && <select aria-label="Thumbnail version" disabled={busy || disabled} value={index} onChange={e => selectVersion(Number(e.target.value))} className="rounded-lg bg-gray-900 p-2">{versions.map((_, i) => <option key={i} value={i}>{i === 0 ? 'Original' : `Edit ${i}`}</option>)}</select>}
    </div>
    <p className="mt-2 text-xs text-gray-500">Review the result before using it. Previous versions remain available.</p>
  </div>;
}
