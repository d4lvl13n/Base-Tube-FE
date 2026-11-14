/**
 * The edit page, in the Business / Analytics register
 * (`Business/businessStyles.ts`), the same one the pass pages use.
 *
 * One translucent-black card per idea on the hub's #09090B, hairline cool
 * borders, sentence-case grey-400 labels, black fields, and orange reserved
 * for the one action that commits. Nothing here is a hero: the page opens on
 * the fields, not on a title card.
 *
 * The exported names and shape are unchanged so every consumer keeps working.
 */
import { form, pill } from '../../Business/businessStyles';

export const styles = {
  page: form.page,

  /** A 56 px bar on the page colour, not a block: everything in it sits on one line. */
  header: form.header,
  ghostButton: form.ghostButton,
  primaryButton: `${form.primaryButton} min-w-[80px]`,
  dangerGhost: form.dangerGhost,

  /** Details carries the work; Preview is the reference beside it. */
  grid: form.grid,
  panel: form.panel,
  panelTitle: form.panelTitle,

  fieldLabel: form.fieldLabel,
  input: form.input,
  inlineAction: form.inlineAction,
  /** The editor is a window onto the description, not the whole viewport. */
  editorFrame: form.editorFrame,
  counter: form.counter,

  frame: form.frame,
  metaRow: form.metaRow,

  thumbnailFrame: form.thumbnailFrame,
  secondaryButton: form.secondaryButton,

  errorText: form.errorText,
  errorNote: form.errorNote,
};

/** The status pill's colour, by what the status actually means. */
export const statusPill = {
  base: pill.base,
  processed: pill.positive,
  processing: pill.accent,
  failed: pill.negative,
};
