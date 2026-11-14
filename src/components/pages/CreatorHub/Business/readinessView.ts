// Pure helpers of the Selling readiness panel (unit-tested on their own).

import type { ChannelReadiness, ReadinessState } from '../../../../types/creatorBusiness';

/** Every channel shown is ready to sell: the panel shrinks to one line. */
export const allReady = (channels: ChannelReadiness[]): boolean => channels.length > 0 && channels.every((c) => c.ready);

export interface ReadinessProgress {
  /** Required steps done, all channels together. */
  done: number;
  /** Required steps, all channels together. */
  total: number;
  /** One state per required step, done first (the progress bar's segments). */
  segments: ReadinessState[];
}

const SEGMENT_ORDER: Record<ReadinessState, number> = { done: 0, waiting: 1, todo: 2, basetube: 3 };

/** How far the required steps are, for the progress bar ("3 of 5 done"). Optional steps are not counted. */
export function readinessProgress(channels: ChannelReadiness[]): ReadinessProgress {
  const segments = channels
    .flatMap((channel) => channel.items.filter((item) => item.required).map((item) => item.state))
    .sort((a, b) => SEGMENT_ORDER[a] - SEGMENT_ORDER[b]);
  return { done: segments.filter((state) => state === 'done').length, total: segments.length, segments };
}

const YT_ERRORS: Record<string, string> = {
  channel_owned: 'This YouTube channel is already linked to another BaseTube account.',
  noChannel: 'This Google account has no YouTube channel. Sign in with the account that owns your channel.',
  state: 'The YouTube sign-in expired before it finished. Please try again.',
  cleanupPending: 'Your previous YouTube channel is still being disconnected. Try again in a few minutes.',
};

export interface ReturnNotice {
  kind: 'success' | 'error' | 'silent';
  message: string;
  /** Address parameters to drop once handled. */
  consumed: string[];
}

/** What to say when the creator comes back from Google (YouTube) or Stripe to the Business overview. */
export function readinessReturnNotice(params: URLSearchParams): ReturnNotice | null {
  if (params.get('ytLinked')) {
    return { kind: 'success', message: 'YouTube connected. Your checklist is up to date.', consumed: ['ytLinked'] };
  }
  const ytError = params.get('ytError');
  if (ytError) {
    return {
      kind: 'error',
      message: YT_ERRORS[ytError] ?? 'YouTube could not be connected. Please try again.',
      consumed: ['ytError'],
    };
  }
  if (params.get('stripe')) return { kind: 'silent', message: '', consumed: ['stripe'] };
  return null;
}
