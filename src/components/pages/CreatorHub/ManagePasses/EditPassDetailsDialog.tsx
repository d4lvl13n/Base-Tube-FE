// src/components/pages/CreatorHub/ManagePasses/EditPassDetailsDialog.tsx
import React, { useEffect, useState } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import { passApi } from '../../../../api/pass';
import RichTextEditor from '../../../common/RichTextEditor';
import { plainApiError } from '../../../../utils/plainApiError';
import { cx, form, sheet } from '../Business/businessStyles';

const TITLE_MAX = 120;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passId: string;
  title: string;
  description: string;
}

/**
 * Fix the title and description of a published pass (typos). They change no
 * promise made to buyers: the link, the price, the supply and the videos stay
 * as they are. The server refuses any other change on a published pass.
 */
const EditPassDetailsDialog: React.FC<Props> = ({ open, onOpenChange, passId, title, description }) => {
  const queryClient = useQueryClient();
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftDescription, setDraftDescription] = useState(description);

  useEffect(() => {
    if (open) {
      setDraftTitle(title);
      setDraftDescription(description);
    }
  }, [open, title, description]);

  const save = useMutation({
    mutationFn: () => passApi.updateDraftPass(passId, { title: draftTitle.trim(), description: draftDescription }),
    onSuccess: () => {
      toast.success('Details saved. The link of the pass did not change.');
      onOpenChange(false);
    },
    onError: (error) => toast.error(plainApiError(error, 'The details could not be saved. Please try again.').message),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pass', passId] }),
        queryClient.invalidateQueries({ queryKey: ['creator-passes'] }),
        queryClient.invalidateQueries({ queryKey: ['creatorBusiness'] }),
      ]),
  });

  const trimmed = draftTitle.trim();
  const titleError = !trimmed ? 'A pass needs a title.' : trimmed.length > TITLE_MAX ? `${TITLE_MAX} characters at most.` : null;
  const unchanged = trimmed === title.trim() && draftDescription === description;

  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !save.isPending && onOpenChange(next)}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={sheet.overlay} />
        <AlertDialog.Content className={cx(sheet.dialog, 'max-h-[90vh] w-[min(94vw,40rem)] overflow-y-auto')}>
          <AlertDialog.Title className={sheet.title}>Edit title and description</AlertDialog.Title>
          <AlertDialog.Description className="mt-1 text-sm text-gray-400">
            For fixing typos. The link, price, number of passes, per-person limit and videos stay the same.
          </AlertDialog.Description>
          <form
            className="mt-5 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (!titleError && !unchanged) save.mutate();
            }}
          >
            <label className="block">
              <span className={form.fieldLabel}>Title</span>
              <input
                className={cx(form.input, 'mt-1 w-full')}
                value={draftTitle}
                maxLength={TITLE_MAX + 20}
                onChange={(event) => setDraftTitle(event.target.value)}
              />
              {titleError && <span className={cx(form.errorText, 'mt-1 block')}>{titleError}</span>}
            </label>
            <div>
              <span className={form.fieldLabel}>Description</span>
              <div className="mt-1">
                <RichTextEditor content={draftDescription} onChange={setDraftDescription} minHeight="180px" placeholder="What buyers get with this pass" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <button type="button" className={form.ghostButton} disabled={save.isPending}>
                  Cancel
                </button>
              </AlertDialog.Cancel>
              <button type="submit" className={cx(form.primaryButton, 'disabled:opacity-50')} disabled={Boolean(titleError) || unchanged || save.isPending}>
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Save
              </button>
            </div>
          </form>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

export default EditPassDetailsDialog;
