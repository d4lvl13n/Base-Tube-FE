/**
 * Two states, kept apart everywhere (UP-UX §9):
 *
 *   technical  — the file: waiting, sending, checks, preparation, playback,
 *                or something the creator has to do;
 *   editorial  — the draft: private or published.
 *
 * A percentage exists only while bytes are moving. Nothing here invents a
 * percentage or a remaining time for processing.
 */
import type { WorkspaceDraft } from '../../../hooks/useDraftWorkspace';
import { describeUploadError } from '../uploadCopy';
import { formatBytes } from '../uploadPhase';
import { workspaceCopy } from './workspaceCopy';

export type TechnicalTone = 'waiting' | 'active' | 'ready' | 'attention';

export type TechnicalAction =
  | 'none'
  | 'cancel'
  | 'sign_in'
  | 'choose_file'
  | 'retry_now'
  | 'send_again'
  | 'verify_cancel'
  | 'retry_processing'
  | 'retry_create';

export interface TechnicalState {
  /** Stable identity of the state, for announcements (never includes the %). */
  key: string;
  label: string;
  detail: string | null;
  tone: TechnicalTone;
  action: TechnicalAction;
  /** Bytes sent, only while sending. */
  percent: number | null;
  /** True while this device still owes the server bytes. */
  transferring: boolean;
}

export interface StatusContext {
  cancelling: boolean;
  heldElsewhere: boolean;
  online: boolean;
}

const NETWORKISH_CODES = ['NETWORK_ERROR', 'UPLOAD_INTERRUPTED', 'UPLOAD_INITIALIZATION_TIMEOUT'];

function state(
  key: string,
  label: string,
  tone: TechnicalTone,
  action: TechnicalAction,
  extra: Partial<TechnicalState> = {},
): TechnicalState {
  return { key, label, detail: null, tone, action, percent: null, transferring: false, ...extra };
}

export function technicalState(draft: WorkspaceDraft, context: StatusContext): TechnicalState {
  const { record, runtime, entry } = draft;
  const server = record.server;

  // The draft itself is not on the server yet.
  if (!record.draftId) {
    if (runtime.create === 'auth_required') return state('create-auth', workspaceCopy.sessionExpired, 'attention', 'sign_in');
    if (runtime.create === 'failed') {
      return state('create-failed', runtime.createError ?? workspaceCopy.transferFailed, 'attention', 'retry_create');
    }
    if (runtime.create === 'retry_wait') return state('create-retry', workspaceCopy.createRetrying, 'waiting', 'none');
    return state('creating', workspaceCopy.creating, 'waiting', entry ? 'cancel' : 'none', { transferring: !!entry });
  }

  // The server retired the attempt (cleanup or deletion): resuming it is
  // refused, so even a local row waiting for its file reads as "expired".
  // A new attempt started on this device (different or no upload id yet) is
  // shown by the transfer branch below instead.
  const retiredAttempt = !entry || entry.uploadId === server?.uploadId;
  if (server?.recovery.action === 'replace_file' && retiredAttempt && !context.cancelling) {
    return state('expired', workspaceCopy.expired, 'attention', 'send_again', {
      detail: server.recovery.code === 'UPLOAD_EXPIRED' ? null : server.recovery.code ? workspaceCopy.supportReference(server.recovery.code) : null,
    });
  }

  // This device has an attempt whose bytes are not confirmed yet.
  if (entry && !server?.transferConfirmed && entry.videoId === null) {
    if (context.cancelling) return state('cancelling', workspaceCopy.cancelling, 'waiting', 'none');
    if (entry.status === 'aborted') {
      return entry.errorCode === 'UPLOAD_ABORT_FAILED'
        ? state('cancel-uncertain', workspaceCopy.cancelUncertain, 'attention', 'verify_cancel')
        : state('cancelled', workspaceCopy.cancelled, 'attention', 'send_again');
    }
    if (context.heldElsewhere) return state('other-tab', workspaceCopy.otherTab, 'waiting', 'none', { transferring: true });
    switch (entry.status) {
      case 'auth_required':
        return state('auth', workspaceCopy.sessionExpired, 'attention', 'sign_in', { transferring: false });
      case 'reselect_required':
        // Nothing moves until the file is given back: not "sending", and closing
        // the tab loses nothing (the parts already received stay on the server).
        return state('reselect', workspaceCopy.reselect, 'attention', 'choose_file', {
          detail: workspaceCopy.reselectDetailFor(entry.filename, formatBytes(entry.sizeBytes)),
        });
      case 'queued':
      case 'reserving':
        return state('waiting', workspaceCopy.waiting, 'waiting', 'cancel', { transferring: true });
      case 'uploading':
        return state('sending', workspaceCopy.sending(entry.progress), 'active', 'cancel', {
          percent: entry.progress,
          transferring: true,
        });
      case 'retry_wait': {
        const offline = !context.online || NETWORKISH_CODES.includes(entry.errorCode ?? '');
        return offline
          ? state('offline', workspaceCopy.offline, 'waiting', 'none', { transferring: true })
          : state('retrying', describeUploadError(entry.errorCode, entry.errorMessage), 'waiting', 'retry_now', {
              transferring: true,
            });
      }
      case 'uploaded':
        return state('confirming', workspaceCopy.confirming, 'waiting', 'none');
      case 'held':
        return state('held', workspaceCopy.unconfirmedStart, 'attention', 'none');
      case 'failed':
        if (entry.errorCode === 'UPLOAD_EXPIRED') return state('expired', workspaceCopy.expired, 'attention', 'send_again');
        return state('transfer-failed', describeUploadError(entry.errorCode, entry.errorMessage), 'attention', 'send_again', {
          detail: workspaceCopy.transferFailed,
        });
      default:
        break;
    }
  }

  if (!server) return state('creating', workspaceCopy.creating, 'waiting', 'none');

  switch (server.recovery.action) {
    case 'retry_processing':
      return state('processing-failed', workspaceCopy.processingFailed, 'attention', 'retry_processing');
    case 'replace_file':
      return state('expired', workspaceCopy.expired, 'attention', 'send_again');
    case 'reselect_file':
      return state('reselect', workspaceCopy.reselect, 'attention', 'choose_file', {
        detail: workspaceCopy.reselectDetail,
      });
    case 'contact_support':
      return state('support', workspaceCopy.needsSupport, 'attention', 'none', {
        detail: server.recovery.code ? workspaceCopy.supportReference(server.recovery.code) : null,
      });
    default:
      break;
  }

  if (server.playbackReady) return state('playback', workspaceCopy.playbackReady, 'ready', 'none');
  if (server.transferConfirmed) return state('received', workspaceCopy.received, 'waiting', 'none');
  if (server.recovery.action === 'wait') return state('server-working', workspaceCopy.serverWorking, 'waiting', 'none');
  if (server.uploadId === null) return state('no-file', workspaceCopy.noFile, 'attention', 'choose_file');
  // A server attempt this device has no row for: its bytes need the original file here.
  return state('reselect', workspaceCopy.reselect, 'attention', 'choose_file', { detail: workspaceCopy.reselectDetail });
}

export function isPublished(draft: WorkspaceDraft): boolean {
  return draft.record.server?.publicationState === 'published';
}

export function editorialLabel(draft: WorkspaceDraft): string {
  return isPublished(draft) ? workspaceCopy.published : workspaceCopy.privateDraft;
}

/** The title to show for a draft in a list, never empty. */
export function displayTitle(draft: WorkspaceDraft): string {
  return draft.record.desired.title.trim() || draft.record.filename || 'Untitled video';
}
