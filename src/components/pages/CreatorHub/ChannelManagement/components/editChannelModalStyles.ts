/**
 * The Edit channel dialog, on the creator hub's black system (Business /
 * Analytics, `Business/businessStyles.ts`): a black sheet with a hairline
 * border, sentence-case grey labels, inputs that are black with a hairline,
 * and orange only on Save.
 */
import { button, cx, field } from '../../Business/businessStyles';

export const styles = {
  // Outer layout
  modal: 'fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6 md:p-12',
  overlay: 'fixed inset-0 bg-black/80',

  container: 'relative my-auto w-full max-w-3xl',

  /** The sheet. */
  content: 'relative overflow-hidden rounded-2xl border border-gray-800/70 bg-black shadow-[0_32px_80px_rgba(0,0,0,0.8)]',

  header: 'relative flex items-center justify-between gap-4 border-b border-gray-800/50 px-5 py-4 sm:px-6',
  title: 'text-lg font-semibold tracking-tight text-white',

  closeButton: button.icon,

  form: 'space-y-6 p-5 sm:p-6',

  inputGroup: 'space-y-1.5',
  label: field.label,
  /** Taller than the Business filters: a form you write in. */
  input: cx(field.input, 'h-10'),
  inputError: 'border-red-500/60 focus-visible:border-red-400/60 focus-visible:ring-red-400/30',

  errorText: field.error,

  imageWrapper: `
    relative h-40 w-full overflow-hidden rounded-xl border border-dashed border-gray-800
    bg-black/40 transition-colors hover:border-gray-700 sm:h-48
  `,
  fileInput: 'hidden',
  fileButton: cx(button.secondary, 'cursor-pointer focus-within:ring-2 focus-within:ring-[#fa7517]/50'),

  actionsContainer: 'flex flex-col-reverse gap-2 border-t border-gray-800/50 pt-5 sm:flex-row sm:justify-end',
  cancelButton: button.ghost,
  saveButton: button.primary,
} as const;
