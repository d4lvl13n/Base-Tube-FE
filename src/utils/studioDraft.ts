import type { ThumbnailOutputFormat } from '../types/thumbnail';
import { emptyStudioBrief, type StudioBriefInputV1 } from '../types/thumbnailStudio';

export const STUDIO_DRAFT_TTL = 24 * 60 * 60 * 1000;
export const STUDIO_DRAFT_PREFIX = 'thumbnail-studio:draft:v1:';
const ACTIVE_KEY = `${STUDIO_DRAFT_PREFIX}active`;
export const SAVE_STUDIO_DRAFT_EVENT = 'thumbnail-studio:save-draft';
const validId = (id: string) => /^[a-zA-Z0-9_-]{1,80}$/.test(id);
export interface StudioDraft {
  videoTitle: string; creatorHook: string; description: string; direction: string; headline: string;
  format: ThumbnailOutputFormat; quality: 'low' | 'medium' | 'high'; count: number;
  niche: string | null; includeFace: boolean; savedStyleId?: number; savedStyleHasLogo: boolean;
  // Names only: browser File handles cannot survive an authentication redirect.
  localFiles: { name: string; purpose: 'logo' | 'subject' }[];
  /** The visitor create page's choices. Absent in older drafts: exact words when a headline is set, else a suggestion. */
  textMode?: 'exact' | 'suggest' | 'none';
  layout?: StudioBriefInputV1['layout'];
}
const draftLayouts: StudioBriefInputV1['layout'][] = ['auto', 'comparison', 'subject_closeup', 'object_hero', 'before_after', 'scene', 'minimal'];
function cleanDraft(value: any): StudioDraft | null {
  if (!value || typeof value !== 'object') return null;
  if (!['videoTitle', 'creatorHook', 'description', 'direction', 'headline'].every(key => typeof value[key] === 'string')) return null;
  if (!['landscape', 'short'].includes(value.format) || !['low', 'medium', 'high'].includes(value.quality) || ![1, 2, 3].includes(value.count)) return null;
  return {
    videoTitle: value.videoTitle.slice(0, 500), creatorHook: value.creatorHook.slice(0, 1000),
    description: value.description.slice(0, 3000), direction: value.direction.slice(0, 3000), headline: value.headline.slice(0, 90),
    format: value.format, quality: value.quality, count: value.count,
    niche: typeof value.niche === 'string' ? value.niche.slice(0, 100) : null,
    includeFace: value.includeFace === true, savedStyleHasLogo: value.savedStyleHasLogo === true,
    savedStyleId: Number.isSafeInteger(value.savedStyleId) && value.savedStyleId > 0 ? value.savedStyleId : undefined,
    localFiles: Array.isArray(value.localFiles) ? value.localFiles.filter((file: any) => file && typeof file.name === 'string' && ['logo', 'subject'].includes(file.purpose)).slice(0, 5).map((file: any) => ({ name: file.name.slice(0, 255), purpose: file.purpose })) : [],
    textMode: ['exact', 'suggest', 'none'].includes(value.textMode) ? value.textMode : undefined,
    layout: draftLayouts.includes(value.layout) ? value.layout : undefined,
  };
}
export function createStudioDraftId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
export function saveStudioDraft(id: string, value: StudioDraft, now = Date.now()): boolean {
  const draft = cleanDraft(value);
  if (!validId(id) || !draft) return false;
  try {
    sessionStorage.setItem(STUDIO_DRAFT_PREFIX + id, JSON.stringify({ expiresAt: now + STUDIO_DRAFT_TTL, draft }));
    sessionStorage.setItem(ACTIVE_KEY, id);
    return true;
  } catch { return false; }
}
export function clearStudioDraft(id: string) {
  try {
    sessionStorage.removeItem(STUDIO_DRAFT_PREFIX + id);
    if (sessionStorage.getItem(ACTIVE_KEY) === id) sessionStorage.removeItem(ACTIVE_KEY);
  } catch { /* Storage may be disabled. */ }
}
/** Signed out or another account: the visitor drafts of this tab go. */
export function clearAllStudioDrafts() {
  try {
    const keys: string[] = [];
    for (let index = 0; index < sessionStorage.length; index++) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(STUDIO_DRAFT_PREFIX)) keys.push(key);
    }
    keys.forEach(key => sessionStorage.removeItem(key));
  } catch { /* Storage may be disabled. */ }
}
export function loadStudioDraft(id?: string | null, now = Date.now()): { id: string; draft: StudioDraft } | null {
  try {
    const key = id || sessionStorage.getItem(ACTIVE_KEY);
    if (!key || !validId(key)) return null;
    const raw = sessionStorage.getItem(STUDIO_DRAFT_PREFIX + key);
    if (!raw) return null;
    const stored = JSON.parse(raw);
    const draft = cleanDraft(stored.draft);
    if (!draft || !Number.isFinite(stored.expiresAt) || stored.expiresAt <= now || stored.expiresAt > now + STUDIO_DRAFT_TTL) {
      clearStudioDraft(key); return null;
    }
    return { id: key, draft };
  } catch { if (id && validId(id)) clearStudioDraft(id); return null; }
}
/**
 * Sign-in and checkout may return only to these existing AI Thumbnails screens,
 * never an arbitrary URL, and never to the sign-in, sign-up or continue screens.
 */
export function studioReturnDestination(value: string | null): string | undefined {
  if (!value) return undefined;
  const [requested, search = ''] = value.split('?');
  if (!/^\/ai-thumbnails(?:\/(?:generate|audit|channel-audit|gallery|history|settings(?:\/(?:style|logos|face|preferences|credits|account))?|(?:studio|projects)(?:\/[a-zA-Z0-9_-]{1,80})?))?$/.test(requested)) return undefined;
  // Old `/ai-thumbnails/studio` links are redirected by the router; return to the current name.
  const pathname = requested.replace(/^\/ai-thumbnails\/studio/, '/ai-thumbnails/projects');
  const input = new URLSearchParams(search);
  const params = new URLSearchParams();
  if (pathname.endsWith('/batch')) {
    const projects = input.get('projects');
    if (projects && projects.split(',').length <= 3 && projects.split(',').every(id => /^[0-9a-f-]{36}$/i.test(id))) params.set('projects', projects);
  } else {
    const source = input.get('source');
    if (source && ['idea', 'youtube', 'image', 'script'].includes(source)) params.set('source', source);
  }
  return pathname + (params.toString() ? `?${params}` : '');
}

const CREDITS_RETURN_KEY = 'thumbnail-studio:credits-return:v1';
/** Before leaving for checkout, remember which thumbnail screen to come back to. */
export function rememberCreditsReturn(path: string) {
  try {
    const destination = studioReturnDestination(path);
    if (destination) sessionStorage.setItem(CREDITS_RETURN_KEY, destination);
    else sessionStorage.removeItem(CREDITS_RETURN_KEY);
  } catch { /* The default destination still works. */ }
}
export function creditsReturnDestination(): string {
  try {
    return studioReturnDestination(sessionStorage.getItem(CREDITS_RETURN_KEY)) || '/ai-thumbnails/generate';
  } catch { return '/ai-thumbnails/generate'; }
}

/**
 * The signed-in create form's draft (a Studio brief not yet saved as a project).
 * Kept per account in this tab so a reload does not lose it; cleared once the
 * project is created. Asset IDs are the account's own uploaded references.
 */
export interface StudioCreateDraft {
  brief: StudioBriefInputV1;
  count: number;
  quality: 'standard' | 'high';
}
const CREATE_PREFIX = 'thumbnail-studio:create:v1:';
const layouts: StudioBriefInputV1['layout'][] = ['auto', 'comparison', 'subject_closeup', 'object_hero', 'before_after', 'scene', 'minimal'];
const text = (value: unknown, limit: number) => (typeof value === 'string' ? value.slice(0, limit) : '');
function cleanCreateDraft(value: any): StudioCreateDraft | null {
  const brief = value?.brief;
  if (!brief || typeof brief !== 'object' || brief.schemaVersion !== 1) return null;
  if (![1, 2, 3].includes(value.count) || !['standard', 'high'].includes(value.quality)) return null;
  const clean = emptyStudioBrief();
  clean.videoTitle = text(brief.videoTitle, 500);
  clean.summary = text(brief.summary, 3000);
  clean.creatorHook = text(brief.creatorHook, 1000);
  clean.visualDirection = text(brief.visualDirection, 3000);
  clean.outputFormat = brief.outputFormat === 'portrait' ? 'portrait' : 'landscape';
  clean.layout = layouts.includes(brief.layout) ? brief.layout : 'auto';
  clean.subjectAssetIds = Array.isArray(brief.subjectAssetIds) ? brief.subjectAssetIds.filter((id: unknown) => typeof id === 'string').slice(0, 4) : [];
  clean.profile = brief.profile && typeof brief.profile.id === 'string' && Number.isSafeInteger(brief.profile.version) ? { id: brief.profile.id, version: brief.profile.version } : null;
  clean.overrides = brief.overrides && typeof brief.overrides === 'object' ? brief.overrides : {};
  clean.styleOverrides = brief.styleOverrides && typeof brief.styleOverrides === 'object' ? brief.styleOverrides : {};
  return { brief: clean, count: value.count, quality: value.quality };
}
export function loadStudioCreateDraft(account: string, now = Date.now()): StudioCreateDraft | null {
  try {
    const raw = sessionStorage.getItem(CREATE_PREFIX + account);
    if (!raw) return null;
    const stored = JSON.parse(raw);
    const draft = cleanCreateDraft(stored.draft);
    if (!draft || !Number.isFinite(stored.expiresAt) || stored.expiresAt <= now) {
      clearStudioCreateDraft(account); return null;
    }
    return draft;
  } catch { clearStudioCreateDraft(account); return null; }
}
export function saveStudioCreateDraft(account: string, value: StudioCreateDraft, now = Date.now()): boolean {
  const draft = cleanCreateDraft(value);
  if (!draft || account === 'anonymous') return false;
  try {
    sessionStorage.setItem(CREATE_PREFIX + account, JSON.stringify({ expiresAt: now + STUDIO_DRAFT_TTL, draft }));
    return true;
  } catch { return false; }
}
export function clearStudioCreateDraft(account: string) {
  try { sessionStorage.removeItem(CREATE_PREFIX + account); } catch { /* Storage may be disabled. */ }
}
export function isEmptyStudioCreateDraft(value: StudioCreateDraft): boolean {
  return value.count === 2 && value.quality === 'high' && JSON.stringify(value.brief) === JSON.stringify(emptyStudioBrief());
}

/**
 * 'Create a new thumbnail for this video': open the create screen with the
 * video title filled in, through the same drafts the create screens restore.
 */
export function studioCreateUrlForTitle(videoTitle: string, account: string): string {
  const title = videoTitle.trim().slice(0, 500);
  if (account !== 'anonymous') {
    if (title) saveStudioCreateDraft(account, { brief: { ...emptyStudioBrief(), videoTitle: title }, count: 2, quality: 'high' });
    return '/ai-thumbnails/generate';
  }
  if (!title) return '/ai-thumbnails/generate';
  const id = createStudioDraftId();
  saveStudioDraft(id, { videoTitle: title, creatorHook: '', description: '', direction: '', headline: '', format: 'landscape', quality: 'high', count: 2, niche: null, includeFace: false, savedStyleHasLogo: false, localFiles: [] });
  return `/ai-thumbnails/generate?draft=${encodeURIComponent(id)}`;
}
