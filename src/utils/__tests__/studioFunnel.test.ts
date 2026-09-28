import {
  armStudioAuthConfirm,
  backToEmailGateOffer,
  closeEmailGate,
  EMAIL_GATE_TTL,
  isAuthRoute,
  loadEmailGate,
  observeStudioFunnelAccount,
  openEmailGate,
  reloadEmailGate,
  resetStudioFunnelForTests,
  saveEmailGate,
  startEmailGateSignIn,
} from '../studioFunnel';
import {
  CONFIRM_TIMEOUT_MS,
  forgetStudioFunnelForAccountChange,
  GATE_REFERRAL_WINDOW_MS,
  resetStudioFunnelRunnerForTests,
  retryEmailGateConfirm,
  startEmailGateConfirm,
} from '../studioFunnelRunner';
import { loadStudioDraft, saveStudioDraft } from '../studioDraft';
import { noteStudioAuthStart, openStudioWelcome, readStudioWelcome } from '../studioWelcome';

jest.mock('../../api/toolFunnel', () => ({ confirmSignup: jest.fn(), getToolFingerprint: () => 'fingerprint-1' }));

const httpError = (status: number, code = 'ERROR', reason?: string, message = code) => Object.assign(new Error(code), { response: { status, data: { error: { code, message, reason } } } });
const draft = { videoTitle: 'Idea', creatorHook: '', description: '', direction: '', headline: '', format: 'landscape' as const, quality: 'high' as const, count: 2, niche: null, includeFace: false, savedStyleHasLogo: false, localFiles: [] };
// The server's balance is an object; older servers answered a number.
const granted = { granted: true, alreadyGranted: false, signupCredits: 50, balance: { balance: 50, reserved: 0, available: 50 }, consentRecorded: true, welcomeSent: true };
/** "Create my free account" in the gate, with or without the consent box, at `at`. */
const signingUp = (marketingConsent = true, at = Date.now()) => saveEmailGate({ reason: 'generate', open: true, updatedAt: at, phase: 'awaiting_sign_in', flow: 'sign-up', marketingConsent, signUpStartedAt: at });
/** "I already have an account" in the gate. */
const signingIn = (marketingConsent = false) => saveEmailGate({ reason: 'generate', open: true, updatedAt: Date.now(), phase: 'awaiting_sign_in', flow: 'sign-in', marketingConsent, signUpStartedAt: null });

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  resetStudioFunnelForTests();
  resetStudioFunnelRunnerForTests();
});

describe('account gate record', () => {
  it('opens on the offer with the consent box unchecked, then keeps a started sign-up pending and reopens it where it stopped', () => {
    openEmailGate('edit');
    expect(loadEmailGate()).toMatchObject({ phase: 'form', reason: 'edit', open: true, marketingConsent: false });
    closeEmailGate();
    expect(loadEmailGate()).toBeNull();
    openEmailGate('generate');
    startEmailGateSignIn('sign-up', true, 1_000);
    expect(loadEmailGate()).toMatchObject({ phase: 'awaiting_sign_in', flow: 'sign-up', marketingConsent: true, signUpStartedAt: 1_000, open: true });
    backToEmailGateOffer();
    expect(loadEmailGate()).toMatchObject({ phase: 'form', marketingConsent: true });
    startEmailGateSignIn('sign-in', true);
    expect(loadEmailGate()).toMatchObject({ phase: 'awaiting_sign_in', flow: 'sign-in', signUpStartedAt: null });
    closeEmailGate();
    expect(loadEmailGate()).toMatchObject({ phase: 'awaiting_sign_in', open: false });
    openEmailGate('edit');
    expect(loadEmailGate()).toMatchObject({ phase: 'awaiting_sign_in', flow: 'sign-in', open: true, reason: 'edit' });
  });
  it('keeps a refusal that can be retried when the window is closed, and forgets one that cannot', () => {
    const refused = (retryable: boolean, code = retryable ? 'NETWORK_ERROR' : 'EMAIL_IN_USE') =>
      saveEmailGate({ reason: 'generate', open: true, updatedAt: Date.now(), phase: 'refused', marketingConsent: true, signUpStartedAt: null, code, cause: null, retryable, account: 'clerk:owner' });
    refused(true);
    closeEmailGate();
    expect(loadEmailGate()).toMatchObject({ phase: 'refused', retryable: true, open: false });
    refused(false);
    closeEmailGate();
    expect(loadEmailGate()).toBeNull();
    saveEmailGate({ reason: 'generate', open: true, updatedAt: Date.now(), phase: 'granted', credits: 8, balance: 8, granted: true, alreadyGranted: false, deferred: false, grantOn: null, account: 'clerk:owner' });
    closeEmailGate();
    expect(loadEmailGate()).toBeNull();
  });
  it('survives a full page reload (Google, Discord) through sessionStorage and expires after a day', () => {
    signingUp();
    const stored = sessionStorage.getItem('thumbnail-studio:email-gate:v1');
    resetStudioFunnelForTests(); // a reload forgets memory, not the tab's storage
    expect(reloadEmailGate()).toMatchObject({ phase: 'awaiting_sign_in', flow: 'sign-up', marketingConsent: true });
    sessionStorage.setItem('thumbnail-studio:email-gate:v1', JSON.stringify({ ...JSON.parse(stored!), updatedAt: Date.now() - EMAIL_GATE_TTL - 1 }));
    expect(reloadEmailGate()).toBeNull();
  });
  it('reads a gate saved before the in-place sign-up without keeping its email', () => {
    sessionStorage.setItem('thumbnail-studio:email-gate:v1', JSON.stringify({ reason: 'generate', open: false, updatedAt: Date.now(), phase: 'awaiting_sign_in', email: 'maker@example.com', marketingConsent: true }));
    const record = reloadEmailGate();
    expect(record).toMatchObject({ phase: 'awaiting_sign_in', flow: 'sign-up', marketingConsent: true, signUpStartedAt: null });
    expect(record).not.toHaveProperty('email');
  });
  it('reads a pending gate saved while visitors could still generate for free', () => {
    for (const [legacy, reason] of [['quota', 'generate'], ['network', 'generate'], ['capacity', 'generate'], ['busy', 'generate'], ['share', 'save']]) {
      sessionStorage.setItem('thumbnail-studio:email-gate:v1', JSON.stringify({ reason: legacy, open: false, updatedAt: Date.now(), phase: 'awaiting_sign_in', flow: 'sign-up', marketingConsent: true, signUpStartedAt: Date.now() }));
      expect(reloadEmailGate()).toMatchObject({ phase: 'awaiting_sign_in', reason, marketingConsent: true });
    }
  });
  it('rejects malformed stored gates', () => {
    sessionStorage.setItem('thumbnail-studio:email-gate:v1', '{"phase":"granted","reason":"hack"}');
    expect(reloadEmailGate()).toBeNull();
    sessionStorage.setItem('thumbnail-studio:email-gate:v1', '{');
    expect(reloadEmailGate()).toBeNull();
  });
});

describe('welcome credits confirmation', () => {
  it('confirms once per sign-in, even when asked twice, and records the +8 result with the available balance', async () => {
    const confirm = jest.fn().mockResolvedValue(granted);
    const onGranted = jest.fn();
    localStorage.setItem('pending_referral_code', 'FRIEND');
    signingUp();
    const first = startEmailGateConfirm('clerk:owner', { confirm, onGranted });
    const second = startEmailGateConfirm('clerk:owner', { confirm, onGranted });
    expect(loadEmailGate()).toMatchObject({ phase: 'confirming', account: 'clerk:owner' });
    await Promise.all([first, second]);
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveBeenCalledWith({ marketingConsent: true, referralCode: 'FRIEND', fingerprint: 'fingerprint-1' });
    expect(loadEmailGate()).toMatchObject({ phase: 'granted', credits: 50, balance: 50, open: true });
    expect(localStorage.getItem('pending_referral_code')).toBeNull();
    expect(onGranted).toHaveBeenCalledTimes(1);
    expect(startEmailGateConfirm('clerk:owner', { confirm })).toBeNull();
    expect(confirm).toHaveBeenCalledTimes(1);
  });
  it('always sends the consent as a real boolean, whatever the account (no email match)', async () => {
    const confirm = jest.fn().mockResolvedValue({ ...granted, balance: 20 });
    signingIn(false);
    await startEmailGateConfirm('clerk:returning', { confirm });
    expect(confirm).toHaveBeenCalledWith({ marketingConsent: false, fingerprint: 'fingerprint-1' });
    expect(loadEmailGate()).toMatchObject({ phase: 'granted', balance: 20 });
  });
  it('sends the pending referral code only for a sign-up started from this gate within 30 minutes', async () => {
    localStorage.setItem('pending_referral_code', 'FRIEND');
    const confirm = jest.fn().mockResolvedValue(granted);
    // "I already have an account": no referral.
    signingIn(true);
    await startEmailGateConfirm('clerk:returning', { confirm });
    expect(confirm.mock.calls[0][0]).toEqual({ marketingConsent: true, fingerprint: 'fingerprint-1' });
    expect(localStorage.getItem('pending_referral_code')).toBe('FRIEND');
    // A sign-up started here more than 30 minutes ago: no referral.
    resetStudioFunnelForTests();
    resetStudioFunnelRunnerForTests();
    const started = Date.now();
    signingUp(true, started);
    await startEmailGateConfirm('clerk:late', { confirm, now: () => started + GATE_REFERRAL_WINDOW_MS + 1 });
    expect(confirm.mock.calls[1][0]).not.toHaveProperty('referralCode');
    expect(localStorage.getItem('pending_referral_code')).toBe('FRIEND');
    // Within the window: sent, and consumed.
    resetStudioFunnelForTests();
    resetStudioFunnelRunnerForTests();
    signingUp(false, started);
    await startEmailGateConfirm('clerk:new', { confirm, now: () => started + GATE_REFERRAL_WINDOW_MS });
    expect(confirm.mock.calls[2][0]).toEqual({ marketingConsent: false, referralCode: 'FRIEND', fingerprint: 'fingerprint-1' });
    expect(localStorage.getItem('pending_referral_code')).toBeNull();
  });
  it('a repeat answer (already granted) closes the gate without a message', async () => {
    const confirm = jest.fn().mockResolvedValue({ ...granted, granted: false, alreadyGranted: true });
    const onGranted = jest.fn();
    signingIn();
    await startEmailGateConfirm('clerk:returning', { confirm, onGranted });
    expect(loadEmailGate()).toBeNull();
    expect(onGranted).toHaveBeenCalledTimes(1);
  });
  it('today’s welcome credits all given: the confirmation says when they are added, with no retry, and tells the welcome card', async () => {
    noteStudioAuthStart();
    openStudioWelcome('clerk:new', Date.now());
    signingUp();
    const deferred = { ...granted, granted: false, deferred: true, grantOn: '2026-09-29', balance: { balance: 0, reserved: 0, available: 0 } };
    await startEmailGateConfirm('clerk:new', { confirm: jest.fn().mockResolvedValue(deferred) });
    expect(loadEmailGate()).toMatchObject({ phase: 'granted', granted: false, deferred: true, grantOn: '2026-09-29', credits: 50 });
    expect(readStudioWelcome('clerk:new')).toEqual({ credits: null, arrivesOn: '2026-09-29' });
    expect(retryEmailGateConfirm('clerk:new', { confirm: jest.fn() })).toBeNull();
    closeEmailGate();
    expect(loadEmailGate()).toBeNull();
  });
  it('an email already used by another account is final and keeps the server’s sentence; a server error’s text is never kept', async () => {
    signingUp();
    await startEmailGateConfirm('clerk:second', { confirm: jest.fn().mockRejectedValue(httpError(403, 'EMAIL_IN_USE', 'email_in_use', 'This email already has a base.tube account.')) });
    expect(loadEmailGate()).toMatchObject({ phase: 'refused', code: 'EMAIL_IN_USE', retryable: false, status: 403, message: 'This email already has a base.tube account.' });
    expect(retryEmailGateConfirm('clerk:second', { confirm: jest.fn() })).toBeNull();
    closeEmailGate();
    expect(loadEmailGate()).toBeNull();
  });
  it('a disposable email, the network limit, a banned account and a wallet are final; an unverified email, a check that failed and a server error can try again', async () => {
    for (const [code, reason, retryable] of [
      ['EMAIL_DISPOSABLE', undefined, false],
      ['WELCOME_LIMIT_NETWORK', undefined, false],
      ['ACCOUNT_BANNED', undefined, false],
      ['EMAIL_NOT_VERIFIED', 'web3_no_email', false],
      ['EMAIL_NOT_VERIFIED', 'email_not_verified', true],
      ['EMAIL_NOT_VERIFIED', 'verification_check_failed', true],
      ['EMAIL_NOT_VERIFIED', 'user_not_found', true],
      ['INTERNAL_ERROR', undefined, true],
    ] as const) {
      saveEmailGate(null);
      resetStudioFunnelRunnerForTests();
      signingUp();
      await startEmailGateConfirm('clerk:owner', { confirm: jest.fn().mockRejectedValue(httpError(code === 'INTERNAL_ERROR' ? 500 : 403, code, reason)) });
      expect(loadEmailGate()).toMatchObject({ phase: 'refused', code, retryable });
      if (code === 'INTERNAL_ERROR') expect(loadEmailGate()).not.toHaveProperty('message');
    }
    const confirm = jest.fn().mockResolvedValue(granted);
    await retryEmailGateConfirm('clerk:owner', { confirm });
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ marketingConsent: true }));
    expect(loadEmailGate()).toMatchObject({ phase: 'granted' });
  });
  it('drops a confirmation started for another account, and another account cannot retry one', () => {
    const confirm = jest.fn();
    saveEmailGate({ reason: 'generate', open: false, updatedAt: Date.now(), phase: 'confirming', marketingConsent: true, signUpStartedAt: null, account: 'clerk:a' });
    expect(startEmailGateConfirm('clerk:b', { confirm })).toBeNull();
    expect(confirm).not.toHaveBeenCalled();
    expect(loadEmailGate()).toBeNull();
    saveEmailGate({ reason: 'generate', open: false, updatedAt: Date.now(), phase: 'refused', marketingConsent: true, signUpStartedAt: null, account: 'clerk:a', code: 'NETWORK_ERROR', cause: null, retryable: true });
    expect(retryEmailGateConfirm('clerk:b', { confirm })).toBeNull();
  });
  it('gives up on a confirmation that does not answer within 20 seconds, as a retryable failure', async () => {
    jest.useFakeTimers();
    try {
      signingUp();
      const pending = startEmailGateConfirm('clerk:owner', { confirm: () => new Promise(() => undefined) });
      expect(loadEmailGate()).toMatchObject({ phase: 'confirming' });
      jest.advanceTimersByTime(CONFIRM_TIMEOUT_MS - 1);
      await Promise.resolve();
      expect(loadEmailGate()).toMatchObject({ phase: 'confirming' });
      jest.advanceTimersByTime(1);
      await pending;
      expect(CONFIRM_TIMEOUT_MS).toBe(20_000);
      expect(loadEmailGate()).toMatchObject({ phase: 'refused', code: 'TIMEOUT', retryable: true });
      // Nothing holds the next confirmation.
      const confirm = jest.fn().mockResolvedValue(granted);
      await retryEmailGateConfirm('clerk:owner', { confirm });
      expect(loadEmailGate()).toMatchObject({ phase: 'granted' });
    } finally {
      jest.useRealTimers();
    }
  });
  it('a sign-up on the AI Thumbnails sign-up page confirms like the gate, without taking over a gate that started its own', async () => {
    const confirm = jest.fn().mockResolvedValue(granted);
    // The gate's own sign-in: its record (consent, no sign-up start) is kept.
    signingIn(true);
    armStudioAuthConfirm({ marketingConsent: false, signUpStartedAt: Date.now() });
    expect(loadEmailGate()).toMatchObject({ phase: 'awaiting_sign_in', flow: 'sign-in', marketingConsent: true, reason: 'generate' });
    // No gate: the page's box, shown only as the result (the window stays closed until then).
    resetStudioFunnelForTests();
    sessionStorage.clear();
    localStorage.setItem('pending_referral_code', 'FRIEND');
    armStudioAuthConfirm({ marketingConsent: true, signUpStartedAt: Date.now() });
    expect(loadEmailGate()).toMatchObject({ phase: 'awaiting_sign_in', flow: 'sign-up', reason: 'account', open: false });
    await startEmailGateConfirm('clerk:new', { confirm });
    expect(confirm).toHaveBeenCalledWith({ marketingConsent: true, referralCode: 'FRIEND', fingerprint: 'fingerprint-1' });
    expect(loadEmailGate()).toMatchObject({ phase: 'granted', open: true, credits: 50 });
  });
  it('never confirms a sign-in that did not start from the gate', () => {
    const confirm = jest.fn();
    expect(startEmailGateConfirm('clerk:owner', { confirm })).toBeNull();
    openEmailGate('generate');
    expect(startEmailGateConfirm('clerk:owner', { confirm })).toBeNull();
    expect(confirm).not.toHaveBeenCalled();
  });
  it('confirms again after a reload that interrupted the request', async () => {
    const confirm = jest.fn().mockResolvedValue(granted);
    saveEmailGate({ reason: 'generate', open: false, updatedAt: Date.now(), phase: 'confirming', marketingConsent: false, signUpStartedAt: null, account: 'clerk:owner' });
    await startEmailGateConfirm('clerk:owner', { confirm });
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ marketingConsent: false }));
  });
});

it('recognises the sign-in, sign-up, continue and onboarding screens, base.tube\'s and AI Thumbnails\'', () => {
  for (const path of [
    '/sign-in', '/sign-in/factor-one', '/sign-up', '/signin', '/sign-in-web3', '/onboarding', '/onboarding/web3',
    '/ai-thumbnails/sign-in', '/ai-thumbnails/sign-in/factor-one', '/ai-thumbnails/sign-up', '/ai-thumbnails/sign-up/verify-email-address',
    '/ai-thumbnails/sign-up/sso-callback', '/ai-thumbnails/auth/continue',
  ]) expect(isAuthRoute(path)).toBe(true);
  for (const path of ['/', '/ai-thumbnails', '/ai-thumbnails/generate', '/ai-thumbnails/sign-inx', '/ai-thumbnails/auth', '/sign-inx', '/creator-hub']) expect(isAuthRoute(path)).toBe(false);
});

describe('account changes (sign-out, another account)', () => {
  it('tells a first sign-in, the same account, a switch and a sign-out apart, across reloads', () => {
    expect(observeStudioFunnelAccount('anonymous')).toBe('anonymous');
    expect(observeStudioFunnelAccount('clerk:a')).toBe('first');
    expect(observeStudioFunnelAccount('clerk:a')).toBe('same');
    resetStudioFunnelForTests(); // a reload keeps localStorage
    expect(observeStudioFunnelAccount('clerk:a')).toBe('same');
    expect(observeStudioFunnelAccount('clerk:b')).toBe('switched');
    expect(observeStudioFunnelAccount('anonymous')).toBe('signed-out');
    expect(observeStudioFunnelAccount('anonymous')).toBe('anonymous');
  });
  it('forgets the gate and the drafts of the previous visitor, and ignores a confirmation still in flight', async () => {
    signingUp();
    saveStudioDraft('draft-a', draft);
    let finish: (value: unknown) => void = () => undefined;
    const confirm = jest.fn(() => new Promise<any>(resolve => { finish = resolve; }));
    const pending = startEmailGateConfirm('clerk:owner', { confirm });
    forgetStudioFunnelForAccountChange();
    expect(loadEmailGate()).toBeNull();
    expect(loadStudioDraft('draft-a')).toBeNull();
    // The confirmation that was in flight answers late: it is ignored.
    finish(granted);
    await pending;
    expect(loadEmailGate()).toBeNull();
  });
});
