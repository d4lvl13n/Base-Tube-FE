// src/components/pages/CreatorHub/ManagePasses/SaleControls.tsx
import React, { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import { Loader2, Pause, Play } from 'lucide-react';
import { businessErrorBody } from '../../../../api/creatorBusiness';
import { useSaleAction } from '../../../../hooks/useCreatorBusiness';
import { plainApiError } from '../../../../utils/plainApiError';
import { cx, form } from '../Business/businessStyles';
import { PAUSE_CONFIRM_LINES, resumeRefusalLines, saleControl, type SaleSubject } from '../Business/passActions';
import ConfirmDialog from './ConfirmDialog';

/** A refused resume, in the server's words: the first line, then what to fix. */
function showResumeError(error: unknown): void {
  const body = businessErrorBody(error);
  const lines = resumeRefusalLines(body);
  if (body?.code === 'SALE_CANNOT_RESUME' && lines.length) {
    toast.error(
      <div>
        <p className="font-medium">Sales stay paused until this is fixed:</p>
        <ul className="mt-1 list-disc pl-4 text-sm">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>,
      { autoClose: 12_000 },
    );
    return;
  }
  toast.error(plainApiError(error, 'Sales could not be resumed. Please try again.').message);
}

/**
 * Pause / resume for one pass: "Pause sales" asks first (with exactly what
 * happens), "Resume sales" runs at once and says why when the server refuses.
 * Returns the two actions, the dialog to render, and whether one is running.
 */
export function useSaleActionFlow(pass: SaleSubject | null | undefined) {
  const mutation = useSaleAction();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const control = pass ? saleControl(pass) : { kind: 'none' as const };
  const pending = mutation.isPending;

  const resume = useCallback(() => {
    if (!pass) return;
    mutation.mutate(
      { passId: pass.passId, action: 'resume' },
      { onSuccess: (data) => toast.success(data.message), onError: showResumeError },
    );
  }, [mutation, pass]);

  const confirmPause = useCallback(() => {
    if (!pass) return;
    mutation.mutate(
      { passId: pass.passId, action: 'pause' },
      {
        onSuccess: (data) => {
          setConfirmOpen(false);
          toast.success(data.message);
        },
        onError: (error) => {
          setConfirmOpen(false);
          toast.error(plainApiError(error, 'Sales could not be paused. Please try again.').message);
        },
      },
    );
  }, [mutation, pass]);

  const dialog = pass ? (
    <ConfirmDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      title={`Pause sales of “${pass.title}”?`}
      lines={PAUSE_CONFIRM_LINES}
      confirmLabel="Pause sales"
      cancelLabel="Keep selling"
      onConfirm={confirmPause}
      pending={pending}
    />
  ) : null;

  return { control, pending, requestPause: () => setConfirmOpen(true), resume, dialog };
}

/** The pause / resume button of the pass page (nothing for a draft or a pause made by BaseTube). */
export const SaleControlButton: React.FC<{ pass: SaleSubject | null | undefined; className?: string }> = ({ pass, className }) => {
  const flow = useSaleActionFlow(pass);
  if (flow.control.kind === 'pause') {
    return (
      <>
        <button type="button" onClick={flow.requestPause} disabled={flow.pending} className={cx(form.secondaryButton, className)}>
          <Pause className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Pause sales</span>
        </button>
        {flow.dialog}
      </>
    );
  }
  if (flow.control.kind === 'resume') {
    return (
      <button type="button" onClick={flow.resume} disabled={flow.pending} className={cx(form.secondaryButton, className)}>
        {flow.pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
        <span className="hidden sm:inline">{flow.pending ? 'Resuming…' : 'Resume sales'}</span>
      </button>
    );
  }
  return null;
};

/** "Resume sales" as the fix of a pass the creator paused (lists and notices). */
export const ResumeSaleButton: React.FC<{ pass: SaleSubject; label: string; className?: string }> = ({ pass, label, className }) => {
  const flow = useSaleActionFlow(pass);
  return (
    <button type="button" onClick={flow.resume} disabled={flow.pending} className={className}>
      {flow.pending ? 'Resuming…' : label}
    </button>
  );
};
