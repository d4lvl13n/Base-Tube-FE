/**
 * Every sentence the upload workspace shows (UP-UX §9 gives their meaning in
 * French; the app speaks English, so these are the English wording).
 *
 * Same rules as `uploadCopy.ts`: a sentence says what happened, what is kept,
 * and what to do next; a code never reaches the screen except as an optional
 * support reference.
 */
import type { DraftFieldProblem, LocalPublishBlocker } from '@basetube/api';

export const workspaceCopy = {
  pageTitle: 'Add videos',
  addVideos: 'Add videos',
  dropTitle: 'Drop your videos here',
  chooseFiles: 'Choose files',
  formatNote: 'MP4, MOV or AVI · up to 2 GB per video',
  destination: 'Channel',
  destinationNext: 'New videos go to',
  destinationFixed: 'This video belongs to',
  noChannelTitle: 'Create a channel first',
  noChannelBody: 'Every video belongs to a channel. Create one, then come back to add your videos.',
  selectChannelBody: 'Choose the channel your next videos go to.',

  // ── technical state (transfer, checks, playback) ─────────────────────────
  waiting: 'Waiting to send',
  sending: (percent: number) => `Sending video · ${percent}%`,
  offline: 'Connection lost. Sending resumes automatically when it is back.',
  retrying: 'Connection hiccup — sending again in a moment.',
  sessionExpired: 'Sign in again to continue. Your progress is kept.',
  reselect: 'Waiting for its file',
  reselectDetail: 'Choose the same file again. Only the parts not yet received are sent.',
  reselectDetailFor: (filename: string, size: string) =>
    `Choose “${filename}” (${size}) again. Only the parts not yet received are sent.`,
  resumeTitle: (count: number) =>
    count === 1 ? '1 video is waiting for its file' : `${count} videos are waiting for their files`,
  resumeBody: 'The page reload dropped them; the parts already sent are kept.',
  resumeAction: 'Choose the files',
  resumeActionCount: (count: number) => `Choose the ${count} files`,
  resumeDrop: 'or drop them here',
  resumeDone: (count: number) => `${count} video${count === 1 ? '' : 's'} resumed.`,
  resumeUnmatched: (names: string) => `Not one of the waiting files: ${names}. Use “Add videos” to add new ones.`,
  otherTab: 'Sending in another BaseTube tab.',
  confirming: 'Checking the file was received…',
  received: 'Video received. Preparing playback.',
  playbackReady: 'Playback available',
  processingFailed: 'Preparation failed. Your file is kept.',
  expired: 'This upload expired. Your details are kept.',
  noFile: 'No video file attached yet.',
  cancelling: 'Cancelling…',
  cancelUncertain: "We couldn't confirm the cancellation. The file may still be sending.",
  cancelled: 'Sending cancelled. Your details are kept.',
  unconfirmedStart: "We couldn't confirm this upload started. Your details are kept — check back shortly.",
  serverWorking: 'BaseTube is working on this video.',
  needsSupport: 'This video needs our help. Your details are kept.',
  creating: 'Setting up your draft…',
  createRetrying: 'Setting up your draft — retrying when the connection allows.',
  transferFailed: 'Sending stopped. Your details are kept.',

  // ── editorial state ──────────────────────────────────────────────────────
  privateDraft: 'Private draft',
  published: 'Published',
  readyToPublish: 'Ready to publish',

  // ── save state ───────────────────────────────────────────────────────────
  saving: 'Saving…',
  saved: 'Draft saved',
  notSaved: 'Changes not saved',
  retry: 'Try again',
  offlineKept: 'Changes kept on this device. They are saved when you are back online.',
  offlineAtRisk: 'You are offline and this browser cannot keep these changes. Leaving now would lose them.',
  saveSignIn: 'Sign in again to save your changes. They are kept on this device.',
  invalid: 'Changes not saved: check the fields marked below.',
  publishedEditing: 'Video published — saved changes are visible to viewers.',

  // ── conflict ─────────────────────────────────────────────────────────────
  conflictTitle: 'This draft was changed somewhere else',
  conflictBody: 'Your version is kept below. Compare it with the saved version, then choose one.',
  conflictYours: 'Your version',
  conflictSaved: 'Saved version',
  conflictReload: 'Load the saved version',
  conflictKeep: 'Keep my changes',
  conflictUnknown: 'The saved version could not be loaded. Load it to compare.',

  // ── leaving ──────────────────────────────────────────────────────────────
  keepTabOpen: 'Keep this tab open. You can move around BaseTube.',
  canCloseTab: 'Your video is received and your draft is saved. You can close this tab.',

  // ── thumbnail ────────────────────────────────────────────────────────────
  thumbnail: 'Thumbnail',
  thumbnailAutomatic: 'Automatic',
  thumbnailImport: 'Upload',
  thumbnailAi: 'Create with AI',
  thumbnailNote: 'JPG or PNG, up to 5 MB. The automatic thumbnail is used if you choose nothing.',
  thumbnailUploading: 'Saving thumbnail…',
  thumbnailSelected: 'Thumbnail saved',
  thumbnailFailed: 'The thumbnail is not saved.',
  thumbnailUseAutomatic: 'Use automatic thumbnail',
  thumbnailAutomaticPending: 'Switching to the automatic thumbnail…',
  thumbnailAutomaticActive: 'The automatic thumbnail is used.',
  thumbnailCustomSaved: 'Your custom thumbnail is saved.',
  thumbnailNotKept: 'This browser will not keep the image if the page reloads before it is saved.',
  thumbnailAiNeedsPlayback: 'Generating from the video itself is available once playback is ready.',

  // ── publication ──────────────────────────────────────────────────────────
  publish: 'Publish',
  publishing: 'Publishing…',
  verifyingPublication: 'Checking the publication…',
  checkAgain: 'Check again',
  publishedTitle: 'Video published',
  viewVideo: 'View video',
  copyLink: 'Copy link',
  linkCopied: 'Link copied',
  unpublish: 'Move back to private draft',
  unpublishConfirm: 'Viewers will no longer see this video. Copies others already shared may stay cached.',
  unpublishAction: 'Make private',
  blockedTitle: 'Not ready to publish yet',
  serverBlocker: 'BaseTube cannot publish this video yet.',

  // ── other actions ────────────────────────────────────────────────────────
  close: 'Close',
  back: 'Back to videos',
  preview: 'Preview',
  presentation: 'Presentation',
  video: 'Video',
  moreOptions: 'More options',
  tags: 'Tags',
  tagsHint: 'Separate tags with commas · up to 20',
  title: 'Title',
  description: 'Description',
  writeWithAi: 'Write with AI',
  cancel: 'Cancel',
  signInAgain: 'Sign in again',
  chooseFile: 'Choose file',
  sendAgain: 'Send the file again',
  retryNow: 'Retry now',
  retryPreparation: 'Retry preparation',
  verifyCancel: 'Check again',
  deleteDraft: 'Delete draft',
  deleteConfirm: 'Delete this draft and its file? This cannot be undone.',
  deleteAction: 'Delete draft',
  keep: 'Keep',
  dismiss: 'Remove from this list',
  loadMore: 'Load more drafts',
  earlierUploads: 'Earlier uploads',
  earlierUploadsNote: 'Uploads started before this workspace keep their usual steps.',
  holdNext: 'Hold next uploads',
  resumeNext: 'Resume next uploads',
  holdNextNote: 'Uploads already sending continue.',
  videosList: 'Videos',
  skipped: (count: number) => `${count} file${count === 1 ? '' : 's'} skipped`,
  added: (count: number) => `${count} video${count === 1 ? '' : 's'} added`,
  limits: 'Up to 4 videos send at the same time; up to 50 can wait in the queue.',
  aiOtherVideo: 'This suggestion was made for another video and was not applied.',
  aiOverwrite: 'You changed this text after asking for the suggestion. Replace your version?',
  aiReplace: 'Replace',
  aiKeepMine: 'Keep mine',
  previewLocal: 'Preview from this device. Viewers will see the processed version.',
  previewNoMedia: 'No preview yet — it appears as soon as the file is on this device or playback is ready.',
  previewServerPending: 'Playback is ready. Loading the private preview…',
  presentationNote: 'How the title and thumbnail look together. No numbers are shown before publishing.',
  automaticThumbnailPlaceholder: 'Automatic thumbnail',
  customThumbnailPlaceholder: 'Custom thumbnail',
  supportReference: (code: string) => `Support reference: ${code}`,
  persistenceWarning: 'This browser keeps nothing after a reload. Finish saving before you leave.',
  notYet: 'Not ready to publish:',
  andMore: (count: number) => `and ${count} more`,
  backToEditing: 'Back to the video',
  previewLocalShort: 'playing from this device',
  closeInspector: 'Close this video',
  removeVideo: 'Remove this video',
  removeConfirm: 'Remove this video? Its draft and any unfinished upload are deleted.',
  removeAction: 'Remove',
  removing: 'Removing…',
  removeDone: 'Video removed.',
  removeWaiting: (count: number) => `Remove the ${count} waiting video${count === 1 ? '' : 's'}`,
  removeWaitingConfirm: (count: number) =>
    `Remove ${count === 1 ? 'this video' : `these ${count} videos`}? Their drafts and unfinished uploads are deleted.`,
  removeFailed: 'This video could not be removed. Check your connection and try again.',
  inspector: 'Video details',
  dropBody: 'They start uploading at once; you add the title, description and thumbnail meanwhile.',
  dropToAdd: 'Drop to add these videos.',
  missingDraft: 'This draft is not available on this account.',
  seeVideos: 'See your videos',
  commands: 'Workspace actions',
  commandsHint: 'Select a video to add its details and publish it.',
  summaryCount: (count: number) => `${count} video${count === 1 ? '' : 's'}`,
  summarySending: (count: number) => `${count} uploading`,
  summaryWaiting: (count: number) => `${count} need${count === 1 ? 's its' : ' their'} file${count === 1 ? '' : 's'}`,
  summaryReady: (count: number) => `${count} ready to publish`,
  summaryPublished: (count: number) => `${count} published`,
  resumeActionOne: 'Choose the file',
  previousVideo: 'Previous video',
  nextVideo: 'Next video',
} as const;

const BLOCKER_COPY: Record<LocalPublishBlocker, string> = {
  NOT_CREATED: 'The draft is still being set up.',
  SAVE_PENDING: 'Your latest changes are being saved.',
  SAVE_FAILED: 'Your latest changes are not saved yet.',
  REVISION_CONFLICT: 'Choose which version of the draft to keep.',
  TITLE_INVALID: 'Add a title of up to 255 characters.',
  THUMBNAIL_UNSAVED: 'The selected thumbnail is not saved yet.',
  PUBLISH_IN_PROGRESS: 'Publishing is in progress.',
  PLAYBACK_UNAVAILABLE: 'Playback is not available yet.',
  AUTH_REQUIRED: 'Sign in again first.',
};

export function localBlockerCopy(code: LocalPublishBlocker): string {
  return BLOCKER_COPY[code];
}

/** The server's documented publish blockers. A code added later falls back to a generic sentence. */
const SERVER_BLOCKER_COPY: Record<string, string> = {
  VIDEO_NOT_READY: 'The video is still being prepared.',
  PLAYBACK_NOT_READY: 'Playback is not available yet.',
  MODERATION_RESTRICTED: 'This video cannot be published under our content rules.',
  THUMBNAIL_NOT_READY: 'The thumbnail is still being prepared.',
  DRAFT_DELETED: 'This draft was deleted.',
};

export function serverBlockerCopy(code: string): { text: string; known: boolean } {
  const text = SERVER_BLOCKER_COPY[code];
  return text ? { text, known: true } : { text: workspaceCopy.serverBlocker, known: false };
}

const FIELD_PROBLEM_COPY: Record<DraftFieldProblem, string> = {
  TITLE_REQUIRED: 'Add a title.',
  TITLE_TOO_LONG: 'Keep the title to 255 characters.',
  DESCRIPTION_TOO_LONG: 'The description is over the 5,000-character limit.',
  TOO_MANY_TAGS: 'Use 20 tags at most.',
  TAG_TOO_LONG: 'Each tag can be 64 characters at most.',
};

export function fieldProblemCopy(problem: DraftFieldProblem): string {
  return FIELD_PROBLEM_COPY[problem];
}
