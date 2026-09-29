import { clearStudioCreateDraft, loadStudioCreateDraft, saveStudioCreateDraft, clearStudioDraft, creditsReturnDestination, rememberCreditsReturn, loadStudioDraft, saveStudioDraft, studioReturnDestination, STUDIO_DRAFT_PREFIX, STUDIO_DRAFT_TTL, StudioDraft } from '../studioDraft';
import { emptyStudioBrief } from '../../types/thumbnailStudio';
const draft: StudioDraft = { videoTitle: 'Un casque à choisir', creatorHook: 'Le résultat', description: 'Deux casques', direction: 'Sans logo', headline: 'LEQUEL CHOISIR ?', format: 'short', quality: 'high', count: 2, niche: 'tech', includeFace: true, savedStyleId: 7, savedStyleHasLogo: false, localFiles: [{ name: 'face.png', purpose: 'subject' }] };
beforeEach(() => sessionStorage.clear());
it('round-trips text, options, owned reference IDs and file names without persisting file contents or other fields', () => {
  saveStudioDraft('draft-1', { ...draft, token: 'secret', imageBase64: 'data:image/png', privateAnalytics: { ctr: 3 } } as StudioDraft);
  expect(loadStudioDraft('draft-1')?.draft).toEqual(draft);
  const raw = sessionStorage.getItem(STUDIO_DRAFT_PREFIX + 'draft-1')!;
  expect(raw).not.toMatch(/secret|base64|privateAnalytics/i);
  // The active draft: what /ai-thumbnails/generate restores without ?draft= (the sign-in default destination).
  expect(loadStudioDraft()?.id).toBe('draft-1');
});
it('expires after 24 hours and clears consumed/abandoned snapshots', () => {
  saveStudioDraft('draft-1', draft, 1000);
  expect(loadStudioDraft('draft-1', 1000 + STUDIO_DRAFT_TTL - 1)).not.toBeNull();
  expect(loadStudioDraft('draft-1', 1000 + STUDIO_DRAFT_TTL)).toBeNull();
  expect(sessionStorage.getItem(STUDIO_DRAFT_PREFIX + 'draft-1')).toBeNull();
  saveStudioDraft('draft-2', draft);
  clearStudioDraft('draft-2');
  expect(loadStudioDraft()).toBeNull();
});
it('rejects malformed or invalid saved data without breaking the form', () => {
  sessionStorage.setItem(STUDIO_DRAFT_PREFIX + 'broken', '{');
  expect(loadStudioDraft('broken')).toBeNull();
  expect(sessionStorage.getItem(STUDIO_DRAFT_PREFIX + 'broken')).toBeNull();
  expect(saveStudioDraft('bad', { ...draft, count: 100 })).toBe(false);
});

it.each(['https://outside.example', '//outside.example', '/creator-hub', '/sign-in', '/onboarding', '/ai-thumbnails/projects/../../admin', '/ai-thumbnails/projects/%2e%2e', '/ai-thumbnails/projects\\outside.example', 'javascript:alert(1)'])('rejects unsafe or unrelated returns: %s', destination => {
  expect(studioReturnDestination(destination)).toBeUndefined();
});
it('returns to the AI Thumbnails pages, never to its sign-in, sign-up or continue screens', () => {
  for (const page of ['/ai-thumbnails', '/ai-thumbnails/generate', '/ai-thumbnails/audit', '/ai-thumbnails/channel-audit', '/ai-thumbnails/gallery', '/ai-thumbnails/history', '/ai-thumbnails/settings', '/ai-thumbnails/settings/credits', '/ai-thumbnails/settings/style', '/ai-thumbnails/pricing', '/ai-thumbnails/settings/subscription']) expect(studioReturnDestination(page)).toBe(page);
  for (const page of ['/ai-thumbnails/', '/ai-thumbnails-outside', '/ai-thumbnails/gallery/../../admin', '/ai-thumbnails/settings/other', '/ai-thumbnails/settings/credits/../../admin', '/ai-thumbnails/sign-in', '/ai-thumbnails/sign-up/verify-email-address', '/ai-thumbnails/auth/continue']) expect(studioReturnDestination(page)).toBeUndefined();
});
it('carries only supported source and batch options through auth', () => {
  expect(studioReturnDestination('/ai-thumbnails/projects/project-1?source=image&redirect_url=https://outside.example')).toBe('/ai-thumbnails/projects/project-1?source=image');
  expect(studioReturnDestination('/ai-thumbnails/projects?source=bad')).toBe('/ai-thumbnails/projects');
  expect(studioReturnDestination('/ai-thumbnails/studio/project-1?source=image')).toBe('/ai-thumbnails/projects/project-1?source=image');
  const ids = '10000000-0000-4000-8000-000000000001,10000000-0000-4000-8000-000000000002';
  expect(studioReturnDestination(`/ai-thumbnails/projects/batch?projects=${ids}`)).toBe(`/ai-thumbnails/projects/batch?projects=${encodeURIComponent(ids)}`);
});

it('returns from checkout only to a thumbnail screen', () => {
  rememberCreditsReturn('/ai-thumbnails/projects/project-1?source=image');
  expect(creditsReturnDestination()).toBe('/ai-thumbnails/projects/project-1?source=image');
  rememberCreditsReturn('https://outside.example');
  expect(creditsReturnDestination()).toBe('/ai-thumbnails/generate');
  // The success URL's own `return` wins; an unsafe one is ignored.
  expect(creditsReturnDestination('/ai-thumbnails/pricing')).toBe('/ai-thumbnails/pricing');
  expect(creditsReturnDestination('https://outside.example', '/ai-thumbnails/projects')).toBe('/ai-thumbnails/projects');
});
describe('signed-in create draft', () => {
  const brief = { ...emptyStudioBrief(), videoTitle: 'Camera review', subjectAssetIds: ['asset-1'], overrides: { text: { mode: 'exact' as const, value: 'BEST?' } } };
  it('keeps one unsaved brief per account and tab until it expires', () => {
    expect(saveStudioCreateDraft('clerk:alice', { brief, count: 3, quality: 'standard' }, 1000)).toBe(true);
    expect(loadStudioCreateDraft('clerk:alice', 2000)).toEqual({ brief, count: 3, quality: 'standard' });
    expect(loadStudioCreateDraft('clerk:bob', 2000)).toBeNull();
    expect(loadStudioCreateDraft('clerk:alice', 1000 + STUDIO_DRAFT_TTL + 1)).toBeNull();
    expect(saveStudioCreateDraft('anonymous', { brief, count: 2, quality: 'high' })).toBe(false);
  });
  it('rejects malformed drafts and drops unknown fields', () => {
    sessionStorage.setItem('thumbnail-studio:create:v1:clerk:alice', JSON.stringify({ expiresAt: Date.now() + 1000, draft: { brief: { schemaVersion: 2 }, count: 2, quality: 'high' } }));
    expect(loadStudioCreateDraft('clerk:alice')).toBeNull();
    saveStudioCreateDraft('clerk:alice', { brief: { ...brief, secret: 'x' } as any, count: 2, quality: 'high' });
    expect(loadStudioCreateDraft('clerk:alice')?.brief).not.toHaveProperty('secret');
    clearStudioCreateDraft('clerk:alice');
    expect(loadStudioCreateDraft('clerk:alice')).toBeNull();
  });
});
