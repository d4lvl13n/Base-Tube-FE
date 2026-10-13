/**
 * "Ready to publish" is computed, never stored (UP-UX §9): the server's own
 * verdict (`canPublish`, `publishBlockers`) AND the absence of anything the
 * client still holds locally. A draft with an unsaved title is not ready even
 * if the server says it could publish the previous one.
 */
import type { CreatorDraftView } from './contracts';

export type LocalPublishBlocker =
  | 'NOT_CREATED'
  | 'SAVE_PENDING'
  | 'SAVE_FAILED'
  | 'REVISION_CONFLICT'
  | 'TITLE_INVALID'
  | 'THUMBNAIL_UNSAVED'
  | 'PUBLISH_IN_PROGRESS'
  | 'PLAYBACK_UNAVAILABLE'
  | 'AUTH_REQUIRED';

export type PublishBlocker =
  | { source: 'local'; code: LocalPublishBlocker }
  | { source: 'server'; code: string };

export interface LocalPublishState {
  unsavedEdits: boolean;
  saveFailed: boolean;
  conflict: boolean;
  titleInvalid: boolean;
  thumbnailUnsaved: boolean;
  publishing: boolean;
  authRequired: boolean;
}

export function publishReadiness(
  server: CreatorDraftView | null,
  local: LocalPublishState,
): { ready: boolean; blockers: PublishBlocker[] } {
  const blockers: PublishBlocker[] = [];
  const add = (code: LocalPublishBlocker) => blockers.push({ source: 'local', code });

  if (!server) add('NOT_CREATED');
  if (local.authRequired) add('AUTH_REQUIRED');
  if (local.conflict) add('REVISION_CONFLICT');
  else if (local.saveFailed) add('SAVE_FAILED');
  else if (local.unsavedEdits) add('SAVE_PENDING');
  if (local.titleInvalid) add('TITLE_INVALID');
  if (local.thumbnailUnsaved) add('THUMBNAIL_UNSAVED');
  if (local.publishing) add('PUBLISH_IN_PROGRESS');
  // The server names playback blockers itself; this local one only covers an
  // older projection that has none listed.
  const serverSaysPlayback = server?.publishBlockers.some(
    (code) => code === 'PLAYBACK_NOT_READY' || code === 'VIDEO_NOT_READY',
  );
  if (server && !server.playbackReady && !serverSaysPlayback) add('PLAYBACK_UNAVAILABLE');

  if (server) {
    for (const code of server.publishBlockers) blockers.push({ source: 'server', code });
  }

  const ready =
    !!server &&
    server.publicationState === 'draft' &&
    server.canPublish &&
    blockers.length === 0;
  return { ready, blockers };
}
