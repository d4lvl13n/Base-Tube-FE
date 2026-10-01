import type { ThumbnailOutputFormat } from '../types/thumbnail';
import type { BillingInterval, SubscriptionPlanId } from '../types/subscription';
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
  if (!/^\/ai-thumbnails(?:\/(?:generate|audit|channel-audit|gallery|history|pricing|settings(?:\/(?:style|logos|face|preferences|credits|subscription|account))?|(?:studio|projects)(?:\/[a-zA-Z0-9_-]{1,80})?))?$/.test(requested)) return undefined;
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
/**
 * Where a checkout success page sends the creator back: the `return` page
 * the checkout was opened with (only an allowed AI Thumbnails screen), else
 * the one remembered in this tab, else `fallback`.
 */
export function creditsReturnDestination(returnParam?: string | null, fallback = '/ai-thumbnails/generate'): string {
  const fromUrl = studioReturnDestination(returnParam ?? null);
  if (fromUrl) return fromUrl;
  try {
    return studioReturnDestination(sessionStorage.getItem(CREDITS_RETURN_KEY)) || fallback;
  } catch { return fallback; }
}

/**
 * A plan a visitor chose before having an account ("Start 7-day free trial" on
 * the landing or pricing page). The click is the intent: once the sign-up (or
 * sign-in) is done, the continue screen opens Stripe Checkout for that plan,
 * which is itself the confirmation page. Kept in this tab for 30 minutes at
 * most (like the sign-in origin), and dropped by any other sign-in start.
 */
export interface PlanIntent {
  planId: SubscriptionPlanId;
  interval: BillingInterval;
  /** The button promised a free trial: checkout opens only while the account can still have one. */
  trial: boolean;
  /** Where Stripe brings the creator back (an allowed AI Thumbnails page); none lets the server choose. */
  returnPath?: string;
}
const PLAN_INTENT_KEY = 'thumbnail-studio:plan-intent:v1';
export const PLAN_INTENT_TTL = 30 * 60 * 1000;
const PLAN_IDS: SubscriptionPlanId[] = ['creator', 'pro', 'agency'];
export function rememberPlanIntent(intent: PlanIntent, now = Date.now()) {
  try {
    const returnPath = studioReturnDestination(intent.returnPath ?? null);
    sessionStorage.setItem(PLAN_INTENT_KEY, JSON.stringify({
      planId: intent.planId,
      interval: intent.interval,
      trial: intent.trial === true,
      ...(returnPath ? { returnPath } : {}),
      at: now,
    }));
  } catch { /* Without storage the visitor signs up and picks the plan again. */ }
}
/** The recent plan intent of this tab, or null (an invalid or expired one is removed). */
export function readPlanIntent(now = Date.now()): PlanIntent | null {
  try {
    const raw = sessionStorage.getItem(PLAN_INTENT_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    const valid = value && PLAN_IDS.includes(value.planId) && (value.interval === 'month' || value.interval === 'year')
      && Number.isFinite(value.at) && value.at <= now + 60_000 && now - value.at <= PLAN_INTENT_TTL;
    if (!valid) {
      sessionStorage.removeItem(PLAN_INTENT_KEY);
      return null;
    }
    const returnPath = studioReturnDestination(typeof value.returnPath === 'string' ? value.returnPath : null);
    return { planId: value.planId, interval: value.interval, trial: value.trial === true, ...(returnPath ? { returnPath } : {}) };
  } catch { return null; }
}
/**
 * base.tube/ai-thumbnails (another site: it cannot write this tab's storage) passes the plan in the
 * sign-up address: `/ai-thumbnails/sign-up?plan=creator&interval=month&trial=1`. Its plan intent, or
 * null when there is none or the plan or interval is unknown (the visitor then picks a plan later).
 */
const PLAN_LINK_PARAMS = ['plan', 'interval', 'trial'];
export function planIntentFromLink(search: string): PlanIntent | null {
  const params = new URLSearchParams(search);
  const planId = params.get('plan') as SubscriptionPlanId | null;
  const interval = params.get('interval') ?? 'month';
  if (!planId || !PLAN_IDS.includes(planId) || (interval !== 'month' && interval !== 'year')) return null;
  return { planId, interval, trial: params.get('trial') === '1' };
}
/** The address without a plan link's parameters, or null when it has none. */
export function withoutPlanLink(search: string): string | null {
  const params = new URLSearchParams(search);
  if (!PLAN_LINK_PARAMS.some(name => params.has(name))) return null;
  PLAN_LINK_PARAMS.forEach(name => params.delete(name));
  const rest = params.toString();
  return rest ? `?${rest}` : '';
}
export function clearPlanIntent() {
  try { sessionStorage.removeItem(PLAN_INTENT_KEY); } catch { /* Storage may be disabled. */ }
}

/**
 * The priced action a creator could not pay for when they went to get
 * credits (a pack, a plan or an upgrade). Back on that screen with more
 * credits, the action is offered again as its one priced button. It is never
 * started without a click.
 */
export interface PendingPaidAction {
  /** The action's key on its page (or its label when it has none). */
  id: string;
  /** "Generate 3 concepts". */
  label: string;
  /** The price on its button. */
  credits: number | null;
}
interface StoredPendingPaidAction extends PendingPaidAction {
  /** The screen it is on (pathname only). */
  path: string;
  /** Available credits when the creator left; "your credits arrived" only once the balance is higher. */
  availableBefore: number | null;
  at: number;
}
const PENDING_ACTION_KEY = 'thumbnail-studio:pending-action:v1';
export const PENDING_ACTION_TTL = 60 * 60 * 1000;
/** Fired in this tab when the pending action is written (an upgrade in place, no page load). */
export const PENDING_ACTION_EVENT = 'thumbnail-studio:pending-action';
const pathnameOf = (path: string) => path.split(/[?#]/)[0];
export function rememberPendingPaidAction(
  action: PendingPaidAction | null | undefined,
  path: string,
  availableBefore: number | null | undefined,
  now = Date.now(),
) {
  try {
    if (!action || !studioReturnDestination(path)) sessionStorage.removeItem(PENDING_ACTION_KEY);
    else {
      const stored: StoredPendingPaidAction = {
        id: action.id.slice(0, 300),
        label: action.label.slice(0, 200),
        credits: typeof action.credits === 'number' && Number.isFinite(action.credits) ? action.credits : null,
        path: pathnameOf(path),
        availableBefore: typeof availableBefore === 'number' && Number.isFinite(availableBefore) ? availableBefore : null,
        at: now,
      };
      sessionStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(stored));
    }
  } catch { /* Without storage the page simply does not offer the action again. */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PENDING_ACTION_EVENT));
}
/** The pending action of this screen, if it is recent. */
export function readPendingPaidAction(path: string, now = Date.now()): (PendingPaidAction & { availableBefore: number | null }) | null {
  try {
    const raw = sessionStorage.getItem(PENDING_ACTION_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as StoredPendingPaidAction;
    const valid = value && typeof value.id === 'string' && typeof value.label === 'string' && typeof value.path === 'string'
      && Number.isFinite(value.at) && value.at <= now + 60_000 && now - value.at <= PENDING_ACTION_TTL;
    if (!valid) {
      sessionStorage.removeItem(PENDING_ACTION_KEY);
      return null;
    }
    if (value.path !== pathnameOf(path)) return null;
    return {
      id: value.id,
      label: value.label,
      credits: typeof value.credits === 'number' ? value.credits : null,
      availableBefore: typeof value.availableBefore === 'number' ? value.availableBefore : null,
    };
  } catch { return null; }
}
export function clearPendingPaidAction() {
  try { sessionStorage.removeItem(PENDING_ACTION_KEY); } catch { /* Storage may be disabled. */ }
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
 * A signed-in creator also gets the video itself (?video=id), offered there as
 * the source to read.
 */
export function studioCreateUrlForTitle(videoTitle: string, account: string, videoId?: string | null): string {
  const title = videoTitle.trim().slice(0, 500);
  if (account !== 'anonymous') {
    if (title) saveStudioCreateDraft(account, { brief: { ...emptyStudioBrief(), videoTitle: title }, count: 2, quality: 'high' });
    return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId) ? `/ai-thumbnails/generate?video=${videoId}` : '/ai-thumbnails/generate';
  }
  if (!title) return '/ai-thumbnails/generate';
  const id = createStudioDraftId();
  saveStudioDraft(id, { videoTitle: title, creatorHook: '', description: '', direction: '', headline: '', format: 'landscape', quality: 'high', count: 2, niche: null, includeFace: false, savedStyleHasLogo: false, localFiles: [] });
  return `/ai-thumbnails/generate?draft=${encodeURIComponent(id)}`;
}
