// src/components/pages/CreatorHub/Business/SellingReadinessPanel.tsx
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Check, CheckCircle2, Circle, Clock, ListChecks, Loader2, ShieldAlert } from 'lucide-react';
import { useRequestPassSalesReview, useSellingReadiness } from '../../../../hooks/useCreatorBusiness';
import { youtubeAuthApi } from '../../../../api/youtubeAuth';
import { passApi } from '../../../../api/pass';
import type { ChannelReadiness, ReadinessItem, ReadinessState } from '../../../../types/creatorBusiness';
import { plainApiError } from '../../../../utils/plainApiError';
import { queryKeys } from '../../../../utils/queryKeys';
import StripeConnectStrip from '../ManagePasses/StripeConnectStrip';
import ConfirmDialog from '../ManagePasses/ConfirmDialog';
import { BASETUBE_CONTACT_EMAIL, formatMomentDate } from './businessFormat';
import { allReady, readinessProgress, readinessReturnNotice } from './readinessView';
import { button, cx, field, sheen, surface, text } from './businessStyles';

const STATE_ICON: Record<ReadinessState, React.ReactNode> = {
  done: <CheckCircle2 className="h-[18px] w-[18px] text-emerald-400" aria-hidden="true" />,
  todo: <Circle className="h-[18px] w-[18px] text-[#fa7517]" aria-hidden="true" />,
  waiting: <Clock className="h-[18px] w-[18px] text-gray-300" aria-hidden="true" />,
  basetube: <ShieldAlert className="h-[18px] w-[18px] text-amber-300" aria-hidden="true" />,
};

const STATE_WORD: Record<ReadinessState, string> = {
  done: 'Done',
  todo: 'To do',
  waiting: 'Waiting',
  basetube: 'Only BaseTube can change this',
};

const SEGMENT: Record<ReadinessState, string> = {
  done: 'bg-[#fa7517]',
  waiting: 'bg-[#fa7517]/40',
  todo: 'bg-white/[0.08]',
  basetube: 'bg-amber-400/50',
};

const ConnectYouTubeButton: React.FC<{ label: string }> = ({ label }) => {
  const start = useMutation({
    mutationFn: () => youtubeAuthApi.startOAuth('business'),
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (error) => toast.error(plainApiError(error, 'YouTube could not be opened. Please try again.').message),
  });
  return (
    <button type="button" onClick={() => start.mutate()} disabled={start.isPending} className={button.primary}>
      {start.isPending && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
      {label}
    </button>
  );
};

/** Older published passes with no payout choice: choose once per pass (final). */
const ChoosePayout: React.FC<{ item: ReadinessItem }> = ({ item }) => {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<null | { passId: string; title: string; choice: 'fiat' | 'crypto' }>(null);
  const save = useMutation({
    mutationFn: (p: { passId: string; choice: 'fiat' | 'crypto' }) => passApi.updateDraftPass(p.passId, { creator_settlement_preference: p.choice }),
    onSuccess: () => {
      setPending(null);
      toast.success('Saved. Card buyers can pay for this pass now.');
    },
    onError: (error) => toast.error(plainApiError(error, 'Your choice could not be saved. Please try again.').message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.creatorBusiness.all }),
  });
  return (
    <ul className="mt-1 space-y-2">
      {item.passes.map((p) => (
        <li key={p.passId} className="flex flex-wrap items-center gap-2 text-sm">
          <span className="min-w-0 flex-1 truncate text-gray-200" title={p.title}>
            {p.title}
          </span>
          <button type="button" className={button.secondary} onClick={() => setPending({ ...p, choice: 'fiat' })}>
            In euros (card)
          </button>
          <button type="button" className={button.secondary} onClick={() => setPending({ ...p, choice: 'crypto' })}>
            In USDC (crypto)
          </button>
        </li>
      ))}
      {pending && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setPending(null)}
          title={`Be paid ${pending.choice === 'fiat' ? 'in euros' : 'in USDC'} for “${pending.title}”?`}
          lines={[
            pending.choice === 'fiat' ? 'Card sales of this pass pay you in euros through your Stripe account.' : 'Sales of this pass pay you in USDC on Base.',
            'This choice is final for this pass.',
          ]}
          confirmLabel="Confirm"
          onConfirm={() => save.mutate({ passId: pending.passId, choice: pending.choice })}
          pending={save.isPending}
        />
      )}
    </ul>
  );
};

const RequestReview: React.FC<{ channel: ChannelReadiness }> = ({ channel }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const request = useRequestPassSalesReview();
  if (channel.review.requestedAt) {
    return <p className="text-xs text-gray-300">Review requested on {formatMomentDate(channel.review.requestedAt)}. BaseTube will answer by email.</p>;
  }
  if (!open) {
    return (
      <button type="button" className={button.secondary} onClick={() => setOpen(true)}>
        Request review
      </button>
    );
  }
  return (
    <form
      className="w-full space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        request.mutate(
          { channelId: channel.channelId, message: message.trim() || undefined },
          {
            onSuccess: (answer) => {
              toast.success(answer.message);
              setOpen(false);
            },
            onError: (error) => toast.error(plainApiError(error, 'Your request could not be sent. Please try again.').message),
          },
        );
      }}
    >
      <label className="block">
        <span className={field.label}>What changed since BaseTube stopped your sales? (optional)</span>
        <textarea className={cx(field.input, 'mt-1 h-24 w-full py-2')} maxLength={1000} value={message} onChange={(event) => setMessage(event.target.value)} />
      </label>
      <div className="flex gap-2">
        <button type="submit" className={button.primary} disabled={request.isPending}>
          {request.isPending && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          Send request
        </button>
        <button type="button" className={button.ghost} onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      <p className="text-xs text-gray-400">BaseTube is told at once. One request per week.</p>
    </form>
  );
};

const ItemAction: React.FC<{ item: ReadinessItem; channel: ChannelReadiness }> = ({ item, channel }) => {
  const action = item.action;
  if (!action) return null;
  switch (action.kind) {
    case 'connect_youtube':
      return <ConnectYouTubeButton label={action.label} />;
    case 'start_stripe':
    case 'resume_stripe':
      return <StripeConnectStrip channelId={channel.channelId} returnTo="business" />;
    case 'choose_payout':
      return <ChoosePayout item={item} />;
    case 'request_review':
      return <RequestReview channel={channel} />;
    case 'publish_pass':
    case 'create_pass':
      return action.href ? (
        <Link to={action.href} className={button.primary}>
          {action.label}
        </Link>
      ) : null;
    case 'contact_basetube':
      return action.href ? (
        <a href={action.href} className={button.secondary}>
          {action.label}
        </a>
      ) : null;
    default:
      return null;
  }
};

const ChannelChecklist: React.FC<{ channel: ChannelReadiness; showName: boolean }> = ({ channel, showName }) => (
  <div className="space-y-2">
    {showName && (
      <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className="font-medium text-white">{channel.channelName}</span>
        <span className={channel.ready ? 'text-emerald-300' : 'text-gray-400'}>· {channel.summary}</span>
      </p>
    )}
    <ul className={surface.divider}>
      {channel.items.map((item) => {
        const done = item.state === 'done';
        return (
          <li key={item.key} className={cx('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between', done ? 'py-2.5' : 'py-4')}>
            <div className="flex min-w-0 gap-3">
              <span className="mt-px shrink-0" title={STATE_WORD[item.state]}>
                {STATE_ICON[item.state]}
              </span>
              <div className="min-w-0">
                <p className={cx('text-sm', done ? 'text-gray-400' : 'font-medium text-white')}>
                  {item.title}
                  <span className="sr-only"> — {STATE_WORD[item.state]}</span>
                  {!item.required && <span className="ml-1.5 text-xs font-normal text-gray-400">(optional)</span>}
                </p>
                {!done && <p className="mt-1 text-xs leading-relaxed text-gray-300">{item.detail}</p>}
                {item.basetubeReason && (
                  <p className="mt-1 text-xs leading-relaxed text-gray-300">
                    BaseTube&apos;s reason: <span className="text-gray-100">“{item.basetubeReason}”</span>
                  </p>
                )}
                {item.state === 'basetube' && item.action?.kind === 'request_review' && (
                  <p className="mt-1 text-xs text-gray-400">
                    If it no longer applies, ask BaseTube to look again, or{' '}
                    <a href={`mailto:${BASETUBE_CONTACT_EMAIL}?subject=${encodeURIComponent(`Pass sales: ${channel.channelName}`)}`} className={text.link}>
                      write to us
                    </a>
                    .
                  </p>
                )}
              </div>
            </div>
            {!done && (
              <div className="shrink-0 pl-[30px] sm:max-w-[60%] sm:pl-0">
                <ItemAction item={item} channel={channel} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  </div>
);

/**
 * "Selling readiness" on the Business overview: a progress bar of the
 * required steps, then per channel what is left, each with the action the
 * creator can take now, or BaseTube's reason and a way to reach BaseTube.
 * One calm line when everything is ready. Handles the return from YouTube and Stripe.
 */
const SellingReadinessPanel: React.FC<{ channelId: number | null }> = ({ channelId }) => {
  const readiness = useSellingReadiness(channelId);
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [expanded, setExpanded] = useState(false);

  // Back from Google (?ytLinked=1 / ?ytError=…) or Stripe (?stripe=return|refresh): read the state again.
  useEffect(() => {
    const notice = readinessReturnNotice(params);
    if (!notice) return;
    if (notice.kind === 'success') toast.success(notice.message);
    else if (notice.kind === 'error') toast.error(notice.message);
    void queryClient.invalidateQueries({ queryKey: queryKeys.creatorBusiness.all });
    const next = new URLSearchParams(params);
    notice.consumed.forEach((key) => next.delete(key));
    setParams(next, { replace: true });
  }, [params, setParams, queryClient]);

  const data = readiness.data;
  if (!data) {
    if (readiness.isError) {
      return (
        <section id="selling-readiness" className={cx(surface.card, 'scroll-mt-24 px-5 py-4')}>
          <p className="text-sm text-gray-300">
            Selling readiness could not be loaded.{' '}
            <button type="button" className={text.link} onClick={() => void readiness.refetch()}>
              Try again
            </button>
          </p>
        </section>
      );
    }
    return null;
  }
  if (!data.channels.length) return null;

  const ready = allReady(data.channels);
  const progress = readinessProgress(data.channels);

  if (ready) {
    return (
      <section id="selling-readiness" className={cx(surface.card, 'scroll-mt-24')} aria-labelledby="selling-readiness-title">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5">
          <h2 id="selling-readiness-title" className="flex items-center gap-2.5 text-sm">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10">
              <Check className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
            </span>
            <span className="font-medium text-white">Ready to sell</span>
            <span className="hidden text-gray-400 sm:inline">· every step is done</span>
          </h2>
          <button
            type="button"
            className={cx(button.ghost, 'h-8 text-xs')}
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls="selling-readiness-list"
          >
            {expanded ? 'Hide checklist' : 'Show checklist'}
          </button>
        </div>
        {expanded && (
          <div id="selling-readiness-list" className="space-y-5 border-t border-gray-800/50 px-5 py-4">
            {data.channels.map((channel) => (
              <ChannelChecklist key={channel.channelId} channel={channel} showName={data.channels.length > 1} />
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section id="selling-readiness" className={cx(surface.card, 'scroll-mt-24 p-5 md:p-6')} aria-labelledby="selling-readiness-title">
      <div className={sheen} aria-hidden="true" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="selling-readiness-title" className={cx(text.cardTitle, 'flex items-center gap-2')}>
            <ListChecks className="h-4 w-4 text-[#fa7517]" aria-hidden="true" />
            Before you can sell
          </h2>
          <p className="text-sm tabular-nums text-gray-300">
            {progress.done} of {progress.total} done
          </p>
        </div>
        {progress.total > 0 && (
          <div
            className="mt-4 flex gap-1"
            role="progressbar"
            aria-label="Steps done before you can sell"
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-valuenow={progress.done}
          >
            {progress.segments.map((state, index) => (
              <span key={index} className={cx('h-1.5 flex-1 rounded-full', SEGMENT[state])} />
            ))}
          </div>
        )}
        <div className="mt-5 space-y-6">
          {data.channels.map((channel) => (
            <ChannelChecklist key={channel.channelId} channel={channel} showName={data.channels.length > 1} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SellingReadinessPanel;
