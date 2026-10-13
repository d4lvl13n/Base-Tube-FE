/**
 * Creator drafts (UP-BE / UP-UX): the durable, private editorial identity of a
 * video in preparation. Platform-agnostic, like `upload/`.
 */
export * from './contracts';
export {
  createCreatorDraftsApi,
  parseCreatorDraftView,
  type CreatorDraftsApi,
} from './endpoints';
export * from './edits';
export * from './readiness';
