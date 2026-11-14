// src/components/pages/CreatorHub/ManagePasses/ConfirmDialog.tsx
import React from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Loader2 } from 'lucide-react';
import { button, cx, form, sheet } from '../Business/businessStyles';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** What will happen, one plain sentence per line. */
  lines: readonly string[];
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  pending?: boolean;
  /** Red confirm button for what takes something away. */
  danger?: boolean;
  confirmDisabled?: boolean;
  /** Extra content under the lines (a checkbox, an error). */
  children?: React.ReactNode;
}

/**
 * A confirmation that says exactly what happens before it happens. The
 * dialog stays open while the action runs; the caller closes it on success.
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  lines,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  pending = false,
  danger = false,
  confirmDisabled = false,
  children,
}) => (
  <AlertDialog.Root open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
    <AlertDialog.Portal>
      <AlertDialog.Overlay className={sheet.overlay} />
      <AlertDialog.Content className={cx(sheet.dialog, 'w-[min(92vw,30rem)]')}>
        <AlertDialog.Title className={cx(sheet.title, 'pr-2')}>{title}</AlertDialog.Title>
        <AlertDialog.Description asChild>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-gray-300">
            {lines.map((line) => (
              <li key={line} className="flex gap-2.5">
                <span aria-hidden="true" className={cx('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', danger ? 'bg-red-400/80' : 'bg-[#fa7517]/80')} />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </AlertDialog.Description>
        {children && <div className="mt-5">{children}</div>}
        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-gray-800/50 pt-5">
          <AlertDialog.Cancel asChild>
            <button type="button" className={form.ghostButton} disabled={pending}>
              {cancelLabel}
            </button>
          </AlertDialog.Cancel>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending || confirmDisabled}
            className={cx(danger ? button.danger : form.primaryButton, 'disabled:cursor-not-allowed disabled:opacity-50')}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </AlertDialog.Content>
    </AlertDialog.Portal>
  </AlertDialog.Root>
);

export default ConfirmDialog;
