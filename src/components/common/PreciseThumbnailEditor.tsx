import { ctrApi } from '../../api/ctr';
import React, { useEffect, useRef, useState } from 'react';
import { ThumbnailConversationState, ThumbnailEditing } from '../../types/thumbnail';
import { studioCreditsLabel } from '../../utils/studioPricing';
import { studioTransportMessage } from '../../api/studioErrors';
import { StudioSelect } from './ThumbnailSelect';

export interface ThumbnailEditVersion {
  editing?: ThumbnailEditing;
  imageUrl: string;
  id?: string | number;
  shareUrl?: string;
  conversation?: ThumbnailConversationState;
  parentVersionId?: string | number | null;
  label?: string;
}
export type ThumbnailEditTarget = 'custom' | 'background' | 'framing' | 'expression' | 'headline';
export function preciseEditInstruction(target: ThumbnailEditTarget, instruction: string): string {
  if (target === 'headline') return `Replace the headline with exactly ${JSON.stringify(instruction.trim())}. Render the replacement exactly once, with legible typography that fits the existing design. Preserve the subject identity, expression, background, composition, lighting, colors, and all other text. Change only the headline and do not add additional words.`;
  const keep = { background: 'subject identity, expression, subject position, and existing text', framing: 'subject identity, expression, background style, and existing text', expression: 'person identity, clothing, background, composition, and existing text', custom: 'everything the request does not explicitly ask to change' }[target];
  return `Requested change${target === 'custom' ? '' : ` (${target})`}: ${instruction.trim()}\nPreserve ${keep}. Make only the requested change.`;
}
const REMOVE_TEXT_INSTRUCTION = 'Remove the added headline, captions and text graphics. Reconstruct only the areas they covered to match the surrounding image. Preserve the subject identity, expression, framing, background, lighting, colors and authentic product markings. Do not add any replacement text.';
const editTargets: Array<[ThumbnailEditTarget, string]> = [
  ['custom', 'Custom change'], ['background', 'Background'], ['framing', 'Subject size / framing'], ['expression', 'Expression'],
];

/** An AI edit or a text change that the controlled editor can send in one click. */
export interface ThumbnailEditAction {
  kind: 'edit' | 'overlay';
  /** The AI edit target ('headline' for the text edits and text changes). */
  target: ThumbnailEditTarget;
  /** The creator's own words: the requested change or the exact headline ('' removes the text). */
  text: string;
  /** 'Apply edit', 'Update text', 'Remove text' or 'Apply text'. */
  label: string;
  /** Nothing to send yet, or the editor is busy. */
  disabled: boolean;
  secondary: boolean;
  /** Sends it through onRequestEdit or onRequestOverlay. */
  run: () => void;
}
/** Starts saved-version work; only server-hydrated props can introduce a new version. */
export interface ControlledThumbnailEditor {
  version: ThumbnailEditVersion;
  versions?: readonly ThumbnailEditVersion[];
  onSelectVersion?: (version: ThumbnailEditVersion) => void;
  /**
   * `rawText` is the creator's own words: the exact headline ('' removes it) or
   * the requested change. A promise resolving truthy means the edit started:
   * the field it came from is cleared.
   */
  onRequestEdit: (source: ThumbnailEditVersion, instruction: string, target: ThumbnailEditTarget, rawText?: string) => void | Promise<unknown>;
  onRequestOverlay?: (source: ThumbnailEditVersion, text: string) => void | Promise<unknown>;
  pending?: boolean;
  /** The price of one AI edit, on the plain buttons ('Apply edit · 18 credits'). */
  editCredits?: number | null;
  /**
   * Renders each action as a one-click button showing its price, with what it
   * changes and keeps above it (Studio, spec §8). Without it, plain buttons.
   */
  renderAction?: (action: ThumbnailEditAction) => React.ReactNode;
  /**
   * One part only, for the Studio's Refine tabs: `text` (update or remove the
   * headline, or the free text layer) or `change` (what to change, and how).
   * Without it, both, one above the other.
   */
  panel?: 'text' | 'change';
}
type RefineThumbnail = (version: ThumbnailEditVersion, instruction: string) => Promise<ThumbnailEditVersion>;
type ChangeThumbnail = (version: ThumbnailEditVersion) => void;
type PreciseThumbnailEditorProps = { editCreditCost?: number; disabled?: boolean } & (
  | { controlled: ControlledThumbnailEditor; initial?: ThumbnailEditVersion; onRefine?: RefineThumbnail; onChange?: ChangeThumbnail }
  | { controlled?: undefined; initial: ThumbnailEditVersion; onRefine: RefineThumbnail; onChange: ChangeThumbnail }
);

export function PreciseThumbnailEditor({ initial, onRefine, onChange, disabled = false, editCreditCost, controlled }: PreciseThumbnailEditorProps) {
  const initialVersion = (controlled?.version || initial)!;
  const [versions, setVersions] = useState<Array<ThumbnailEditVersion & { parent?: number }>>([initialVersion]);
  const [index, setIndex] = useState(0);
  const [target, setTarget] = useState<ThumbnailEditTarget>('custom');
  const [adjustments, setAdjustments] = useState(initialVersion.editing);
  const [instruction, setInstruction] = useState('');
  const [headline, setHeadline] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const selectVersion = (next: number) => { setIndex(next); onChange?.(versions[next]); setError(''); setAdjustments(versions[next].editing); setHeadline(''); };
  useEffect(() => {
    if (controlled) { setAdjustments(controlled.version.editing); setInstruction(''); setHeadline(''); setError(''); }
    // A refreshed signed URL must not clear an in-progress text draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlled?.version.id]);
  const editingBusy = busy || Boolean(controlled?.pending);
  const requestControlled = (request: () => void | Promise<unknown>, onStarted?: () => void) => {
    if (disabled || editingBusy) return;
    setError('');
    // Never the transport's wording ("Network Error"): a sentence that says what to do.
    const failed = (err: unknown) => setError(studioTransportMessage(err, 'Could not start this change. Please try again.'));
    try {
      const result = request();
      if (result && typeof (result as Promise<unknown>).then === 'function')
        (result as Promise<unknown>).then(started => { if (started && mounted.current) onStarted?.(); }, err => { if (mounted.current) failed(err); });
    } catch (err: unknown) { failed(err); }
  };
  const savedVersions = controlled?.versions || (controlled ? [controlled.version] : []);
  const parentVersion = controlled && savedVersions.find(version => version.id === controlled.version.parentVersionId);
  const submit = async (text = instruction, editTarget = target, removeText = false) => {
    if (inFlight.current || disabled || editingBusy || (!removeText && !text.trim())) return;
    const request = removeText ? REMOVE_TEXT_INSTRUCTION : preciseEditInstruction(editTarget, text);
    if (controlled) {
      requestControlled(
        () => controlled.onRequestEdit(controlled.version, request, editTarget, removeText ? '' : text.trim()),
        () => { if (editTarget === 'headline') setHeadline(''); else setInstruction(''); },
      );
      return;
    }
    inFlight.current = true; setBusy(true); setError('');
    const parent = index;
    try {
      const source = versions[index];
      const cleanSource = source.editing ? { ...source, imageUrl: source.editing.baseImageUrl, id: source.editing.baseThumbnailId, conversation: undefined } : source;
      let pendingAdjustments: ThumbnailEditing | undefined;
      if (!onRefine) throw new Error('Editing is not available.');
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
      setVersions(prev => [...prev, { ...result, parent }]); setIndex(versions.length); setInstruction(''); setHeadline(''); setAdjustments(pendingAdjustments || result.editing); onChange?.(result);
    } catch (err: any) {
      if (mounted.current) setError(err.response?.data?.error?.message || err.message || 'Editing failed. Your original is unchanged.');
    } finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  };
  const applyAdjustments = async (removeText = false) => {
    if (!adjustments || inFlight.current || disabled || editingBusy) return;
    if (controlled) {
      if (controlled.onRequestOverlay) requestControlled(() => controlled.onRequestOverlay!(controlled.version, removeText ? '' : adjustments.textPlan.headline));
      return;
    }
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
      setVersions(prev => [...prev, { ...next, parent: index }]); setIndex(versions.length); setAdjustments(next.editing); onChange?.(next);
    } catch (err: any) {
      if (mounted.current) setError(err.response?.data?.error?.message || err.message || 'Could not apply adjustments.');
    } finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  };

  if (controlled) {
    // Studio: every AI edit and text change is one click on a button showing its price.
    const aiLabel = (label: string) => controlled.editCredits != null ? `${label} · ${studioCreditsLabel(controlled.editCredits)}` : label;
    const action = (value: ThumbnailEditAction) => controlled.renderAction
      ? <React.Fragment key={`${value.kind}:${value.label}`}>{controlled.renderAction(value)}</React.Fragment>
      : <button key={`${value.kind}:${value.label}`} type="button" disabled={value.disabled} onClick={value.run} className={value.secondary ? 'rounded-lg border border-white/20 px-3 py-2 disabled:opacity-40' : 'rounded-lg bg-white px-3 py-2 text-black disabled:opacity-40'}>{value.kind === 'overlay' ? `${value.label} · free` : aiLabel(value.label)}</button>;
    const controlledBusy = editingBusy || disabled;
    const showText = controlled.panel !== 'change';
    const showChange = controlled.panel !== 'text';
    const field = 'w-full rounded-xl border border-white/15 bg-[#18181b] px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40';
    const row = 'flex flex-wrap items-end gap-2';
    const heading = (text: string) => !controlled.panel && <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{text}</p>;
    const textSection = adjustments
      // The separate headline layer: changing or removing it is free.
      ? <fieldset disabled={controlledBusy || !controlled.onRequestOverlay} className="min-w-0 space-y-2 border-0 p-0">
        <legend className="sr-only">Text layer</legend>
        {heading('Text')}
        <label className="block text-xs text-zinc-400">Headline<input aria-label="Headline" value={adjustments.textPlan.headline} maxLength={90} onChange={e => setAdjustments({ ...adjustments, textPlan: { ...adjustments.textPlan, headline: e.target.value } })} className={`mt-1 ${field}`} /></label>
        <div className={row}>
          {action({ kind: 'overlay', target: 'headline', text: adjustments.textPlan.headline, label: 'Apply text', disabled: controlledBusy, secondary: false, run: () => void applyAdjustments() })}
          {action({ kind: 'overlay', target: 'headline', text: '', label: 'Remove text', disabled: controlledBusy, secondary: true, run: () => void applyAdjustments(true) })}
        </div>
      </fieldset>
      // Text drawn into the image: an AI edit replaces or removes it.
      : <fieldset disabled={controlledBusy} className="min-w-0 space-y-2 border-0 p-0">
        <legend className="sr-only">Headline</legend>
        {heading('Text')}
        <label className="block text-xs text-zinc-400">New headline<input aria-label="Headline" value={headline} maxLength={90} onChange={e => setHeadline(e.target.value)} placeholder="The exact words to show" className={`mt-1 ${field}`} /></label>
        <div className={row}>
          {action({ kind: 'edit', target: 'headline', text: headline.trim(), label: 'Update text', disabled: controlledBusy || !headline.trim(), secondary: false, run: () => void submit(headline, 'headline') })}
          {action({ kind: 'edit', target: 'headline', text: '', label: 'Remove text', disabled: controlledBusy, secondary: true, run: () => void submit('', 'headline', true) })}
        </div>
      </fieldset>;
    const changeSection = <div className="min-w-0 space-y-2">
      {heading('Change something')}
      <div className="grid gap-2 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
        <label className="block text-xs text-zinc-400">What to change
          <div className="mt-1"><StudioSelect aria-label="Edit target" value={target} disabled={controlledBusy} onChange={e => setTarget(e.target.value as ThumbnailEditTarget)}>
            {editTargets.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </StudioSelect></div>
        </label>
        <label className="block text-xs text-zinc-400">How
          <textarea aria-label="Edit instruction" value={instruction} onChange={e => setInstruction(e.target.value)} maxLength={1200} rows={2} disabled={controlledBusy} placeholder="Describe the change. Everything else stays the same." className={`mt-1 ${field}`} />
        </label>
      </div>
      {action({ kind: 'edit', target, text: instruction.trim(), label: 'Apply edit', disabled: controlledBusy || !instruction.trim(), secondary: false, run: () => void submit() })}
    </div>;
    return <div className={controlled.panel ? 'space-y-3 text-sm text-white' : 'mt-3 space-y-4 rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white'}>
      {showText && textSection}
      {showChange && changeSection}
      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
      {controlled.onSelectVersion && <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={!parentVersion} onClick={() => parentVersion && controlled.onSelectVersion?.(parentVersion)} className="rounded-lg border border-white/20 px-3 py-2 disabled:opacity-40">Undo</button>
        <button type="button" disabled={!savedVersions.length || savedVersions[0].id === controlled.version.id} onClick={() => controlled.onSelectVersion?.(savedVersions[0])} className="rounded-lg border border-white/20 px-3 py-2 disabled:opacity-40">Reset</button>
        {savedVersions.length > 1 && <div className="min-w-[10rem]"><StudioSelect aria-label="Thumbnail version" value={String(controlled.version.id)} onChange={event => { const selected = savedVersions.find(version => String(version.id) === event.target.value); if (selected) controlled.onSelectVersion?.(selected); }}>{savedVersions.map((version, i) => <option key={String(version.id)} value={String(version.id)}>{version.label || (i === 0 ? 'Original' : `Version ${i + 1}`)}</option>)}</StudioSelect></div>}
      </div>}
    </div>;
  }

  // The Creator Hub editor (not the Studio): local versions and plain buttons.
  return <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white">
    {editCreditCost !== undefined && <p className="mb-3 text-xs text-orange-300">Each AI edit costs {editCreditCost} credits. Undo and switching versions are free.</p>}
    {adjustments && <fieldset disabled={editingBusy || disabled} className="mb-4 space-y-2">
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
    {!adjustments && <fieldset disabled={editingBusy || disabled} className="mb-4 space-y-2">
      <legend className="mb-2 font-semibold">Headline</legend>
      <input aria-label="Headline" value={headline} maxLength={90} onChange={e => setHeadline(e.target.value)} placeholder="Enter the exact replacement headline" className="w-full rounded-lg bg-gray-900 p-2" />
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!headline.trim()} onClick={() => submit(headline, 'headline')} className="rounded-lg bg-white px-3 py-2 text-black disabled:opacity-40">Update text</button>
        <button type="button" onClick={() => submit('', 'headline', true)} className="rounded-lg border border-white/20 px-3 py-2">Remove text</button>
      </div>
      <p className="text-xs text-gray-400">Uses AI image editing; thumbnail limits apply. Review spelling and layout before using the result.</p>
    </fieldset>}
    <p className="mb-2 font-semibold">Change only what you choose</p>
    <label className="block text-xs text-gray-400">Edit target<select aria-label="Edit target" value={target} disabled={editingBusy || disabled} onChange={e => setTarget(e.target.value as ThumbnailEditTarget)} className="my-1 w-full rounded-lg bg-gray-900 p-2 text-white">
      {editTargets.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select></label>
    <textarea aria-label="Edit instruction" value={instruction} onChange={e => setInstruction(e.target.value)} maxLength={1200} rows={2} disabled={editingBusy || disabled} placeholder="Describe the change. Everything else stays the same." className="w-full rounded-lg bg-gray-900 p-2 text-sm" />
    {error && <p role="alert" className="my-2 text-xs text-red-300">{error}</p>}
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button type="button" disabled={editingBusy || disabled || !instruction.trim()} onClick={() => submit()} className="rounded-lg bg-white px-3 py-2 text-black disabled:opacity-40">{busy ? 'Editing…' : 'Apply edit'}</button>
      <button type="button" disabled={busy || disabled || versions[index].parent === undefined} onClick={() => selectVersion(versions[index].parent!)} className="rounded-lg border border-white/20 px-3 py-2 disabled:opacity-40">Undo</button>
      <button type="button" disabled={busy || disabled || index === 0} onClick={() => selectVersion(0)} className="rounded-lg border border-white/20 px-3 py-2 disabled:opacity-40">Reset</button>
      {versions.length > 1 && <select aria-label="Thumbnail version" disabled={editingBusy || disabled} value={index} onChange={e => selectVersion(Number(e.target.value))} className="rounded-lg bg-gray-900 p-2">{versions.map((_, i) => <option key={i} value={i}>{i === 0 ? 'Original' : `Edit ${i}`}</option>)}</select>}
    </div>
    <p className="mt-2 text-xs text-gray-500">Review the result before using it. Previous versions remain available.</p>
  </div>;
}
