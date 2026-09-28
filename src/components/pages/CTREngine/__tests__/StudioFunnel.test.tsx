import React, { StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GeneratePage from '../GeneratePage';
import StudioFunnelBridge from '../../../common/StudioFunnelBridge';
import { AIThumbnailsSignInPage, AIThumbnailsSignUpPage } from '../auth/AIThumbnailsAuthPage';
import AIThumbnailsAuthContinue from '../auth/AIThumbnailsAuthContinue';
import useCTREngine from '../../../../hooks/useCTREngine';
import { thumbnailStudioApi } from '../../../../api/thumbnailStudio';
import { confirmSignup, getWelcomeOffer } from '../../../../api/toolFunnel';
import { studioProject } from '../../../../tests/fixtures/studio';
import { loadEmailGate, resetStudioFunnelForTests, saveEmailGate } from '../../../../utils/studioFunnel';
import { resetStudioFunnelRunnerForTests } from '../../../../utils/studioFunnelRunner';
import { noteStudioAuthStart, openStudioWelcome, readStudioWelcome } from '../../../../utils/studioWelcome';
import { loadStudioDraft, SAVE_STUDIO_DRAFT_EVENT, saveStudioDraft, StudioDraft } from '../../../../utils/studioDraft';
import { startStudioAuth } from '../../../../utils/studioAuth';

let mockAccount = 'anonymous';
jest.mock('../../../../hooks/useStudioAccount', () => ({
  useStudioAccount: () => mockAccount,
  useStudioAccountState: () => ({ account: mockAccount, resolved: true, email: null }),
}));
// Clerk's sign-up and sign-in, in place in the gate or on the AI Thumbnails pages. Done, Clerk goes to `forceRedirectUrl`.
jest.mock('@clerk/clerk-react', () => {
  const { useNavigate: useRouterNavigate } = jest.requireActual('react-router-dom');
  const screen = (kind: string) => function ClerkScreen(props: any) {
    const navigate = useRouterNavigate();
    const social = props.appearance?.elements?.socialButtons?.display === 'none' ? 'hidden' : 'shown';
    return <div data-testid={`clerk-${kind}`} data-routing={props.routing} data-done={props.forceRedirectUrl} data-other-done={props.signInForceRedirectUrl || props.signUpForceRedirectUrl} data-switch={props.signInUrl || props.signUpUrl} data-social={social}>
      <button type="button" onClick={() => navigate(props.forceRedirectUrl)}>{`Finish Clerk ${kind}`}</button>
    </div>;
  };
  return { SignUp: screen('sign-up'), SignIn: screen('sign-in') };
});
jest.mock('../../../../contexts/AuthContext', () => ({ useAuth: () => ({ isAuthenticated: false, user: null, setUser: jest.fn(), isRestoring: false }) }));
jest.mock('../../../common/WalletWrapper/ConnectWalletButton', () => ({ __esModule: true, default: ({ customText }: any) => <button type="button">{customText}</button> }));
jest.mock('../../../../hooks/useCTREngine', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../../api/toolFunnel', () => ({ confirmSignup: jest.fn(), getWelcomeOffer: jest.fn(), getToolFingerprint: () => 'fingerprint-1' }));
jest.mock('../../../../api/thumbnailStudio', () => ({
  thumbnailStudioApi: { profiles: jest.fn(), createProject: jest.fn(), capabilities: jest.fn(), quote: jest.fn(), start: jest.fn() },
  studioError: (error: Error) => ({ code: 'ERROR', message: error.message }),
  downloadStudioBlob: jest.fn(),
}));
jest.mock('../AIThumbnailsLayout', () => ({ __esModule: true, default: ({ children }: any) => <main>{children}</main> }));
jest.mock('../../../common/ThumbnailPackaging', () => ({ ThumbnailStylePicker: () => null }));
jest.mock('../../../common/ThumbnailLogoPicker', () => ({ ThumbnailLogoPicker: () => null }));
jest.mock('../../../common/ThumbnailSubjectPicker', () => ({ ThumbnailSubjectPicker: () => null }));
jest.mock('../components/ThumbnailFormatSelector', () => ({ ThumbnailFormatSelector: () => null }));

const studio = thumbnailStudioApi as jest.Mocked<typeof thumbnailStudioApi>;
const draft: StudioDraft = { videoTitle: 'Draft idea', creatorHook: '', description: '', direction: '', headline: '', format: 'landscape', quality: 'high', count: 2, niche: null, includeFace: false, savedStyleHasLogo: false, localFiles: [] };
const httpError = (status: number, code: string, reason?: string, message = code) => Object.assign(new Error(code), { response: { status, data: { success: false, error: { code, message, reason } } } });
const granted = { granted: true, alreadyGranted: false, signupCredits: 50, balance: { balance: 50, reserved: 0, available: 50 }, consentRecorded: true, welcomeSent: true };
/** A gate whose sign-up (or sign-in) started in this tab. */
const pendingGate = (flow: 'sign-up' | 'sign-in' = 'sign-up', marketingConsent = false, open = false) =>
  saveEmailGate({ reason: 'generate', open, updatedAt: Date.now(), phase: 'awaiting_sign_in', flow, marketingConsent, signUpStartedAt: flow === 'sign-up' ? Date.now() : null });

function Where() {
  const location = useLocation();
  return <output data-testid="where">{location.pathname}</output>;
}
/** base.tube's onboarding, for sign-ups from outside AI Thumbnails (OnboardingModal): once done, it goes on. */
function Onboarding() {
  const navigate = useNavigate();
  return <button type="button" onClick={() => navigate('/')}>Finish onboarding</button>;
}
const CONTINUE = '/ai-thumbnails/auth/continue';
let client: QueryClient;
const routes = (path: string) => <MemoryRouter initialEntries={[path]}>
  <StudioFunnelBridge />
  <Link to="/elsewhere">Go elsewhere</Link>
  <Routes>
    <Route path="/ai-thumbnails/generate" element={<GeneratePage />} />
    <Route path="/ai-thumbnails/projects" element={<Where />} />
    <Route path="/ai-thumbnails/projects/:projectId" element={<Where />} />
    <Route path="/ai-thumbnails/sign-up/*" element={<AIThumbnailsSignUpPage />} />
    <Route path="/ai-thumbnails/sign-in/*" element={<AIThumbnailsSignInPage />} />
    <Route path={CONTINUE} element={<AIThumbnailsAuthContinue />} />
    <Route path="/onboarding" element={<Onboarding />} />
    <Route path="/" element={<Where />} />
    <Route path="/elsewhere" element={<Where />} />
  </Routes>
</MemoryRouter>;
const app = (path = '/ai-thumbnails/generate') => <QueryClientProvider client={client}><StrictMode>{routes(path)}</StrictMode></QueryClientProvider>;
/** Without StrictMode: its second effect run can hide a bug that a real page shows. */
const plainApp = (path: string) => <QueryClientProvider client={client}>{routes(path)}</QueryClientProvider>;
/** A full-page redirect keeps the tab's storage and loses everything in memory. */
function reload() {
  client.clear();
  resetStudioFunnelForTests();
  resetStudioFunnelRunnerForTests();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  resetStudioFunnelForTests();
  resetStudioFunnelRunnerForTests();
  mockAccount = 'anonymous';
  window.matchMedia = jest.fn(() => ({ matches: true, addListener: jest.fn(), removeListener: jest.fn() })) as any;
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  (useCTREngine as jest.Mock).mockImplementation(() => mockAccount === 'anonymous'
    ? { isAuthenticated: false, isAnonymous: true, usageAccess: null, isLoadingQuota: false }
    : { isAuthenticated: true, isAnonymous: false, usageAccess: null, isLoadingQuota: false });
  (confirmSignup as jest.Mock).mockResolvedValue(granted);
  (getWelcomeOffer as jest.Mock).mockResolvedValue({ credits: 50, available: true, resetsAt: '2030-01-02T00:00:00.000Z' });
  studio.profiles.mockResolvedValue({ items: [], nextCursor: null });
  studio.createProject.mockResolvedValue(studioProject());
  studio.capabilities.mockResolvedValue({
    operations: { available: true, reason: null },
    pricing: { thumbnail: { generatePerImage: 12, editPerImage: 18, variationPerImage: 8 }, ctr: { audit: 2, auditWithPersonas: 3, generatePerConcept: 15 } },
  } as any);
});
/** Nothing is saved as a project or started before the creator clicks Generate. */
const expectNothingStarted = () => {
  expect(studio.createProject).not.toHaveBeenCalled();
  expect(studio.quote).not.toHaveBeenCalled();
  expect(studio.start).not.toHaveBeenCalled();
};
afterEach(() => client.clear());

it('a visitor\'s "Create a free account to generate" → the gate → the AI Thumbnails sign-up in place → continue, no onboarding → credits confirmed once → the brief on the signed-in create page, nothing started', async () => {
  localStorage.setItem('pending_referral_code', 'FRIEND');
  const visit = render(app());
  fireEvent.change(screen.getByLabelText('Video title or idea'), { target: { value: 'Draft idea' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create a free account to generate' }));
  const gate = await screen.findByRole('dialog');
  expect(gate).toHaveTextContent('Generating needs a free account');
  // The welcome credits depend on a verified email: never promised unconditionally.
  expect(await within(gate).findByText('50 free credits')).toBeInTheDocument();
  expect(gate).toHaveTextContent('New accounts get 50 free credits once the email is verified.');
  // No email field: the account's own email decides.
  expect(within(gate).queryByRole('textbox')).not.toBeInTheDocument();
  const consent = within(gate).getByRole('checkbox', { name: /product tips/ });
  expect(consent).not.toBeChecked();
  fireEvent.click(consent);
  fireEvent.click(within(gate).getByRole('button', { name: 'Create my free account' }));
  // The AI Thumbnails sign-up, in place: the visitor stays on the page.
  const signUp = within(gate).getByTestId('clerk-sign-up');
  expect(loadStudioDraft()?.draft.videoTitle).toBe('Draft idea');
  expect(signUp).toHaveAttribute('data-routing', 'virtual');
  // Every way out ends on the constant continue address, whatever this page's URL says.
  expect(signUp).toHaveAttribute('data-done', CONTINUE);
  expect(signUp).toHaveAttribute('data-other-done', CONTINUE);
  expect(signUp).toHaveAttribute('data-switch', '/ai-thumbnails/sign-in');
  // Google and Discord hand off to the full AI Thumbnails page.
  expect(signUp).toHaveAttribute('data-social', 'hidden');
  expect(within(gate).getByRole('link', { name: 'Continue with Google or Discord' })).toHaveAttribute('href', '/ai-thumbnails/sign-up');
  expect(loadEmailGate()).toMatchObject({ phase: 'awaiting_sign_in', flow: 'sign-up', open: true, marketingConsent: true, reason: 'generate' });

  // Clerk finishes the sign-up with a full-page load of the continue address, now signed in.
  visit.unmount();
  reload();
  mockAccount = 'clerk:new-creator';
  render(app(CONTINUE));
  await waitFor(() => expect(confirmSignup).toHaveBeenCalledTimes(1));
  expect(confirmSignup).toHaveBeenCalledWith({ marketingConsent: true, referralCode: 'FRIEND', fingerprint: 'fingerprint-1' });
  const dialog = await screen.findByRole('dialog');
  expect(await within(dialog).findByText('50 credits added')).toBeInTheDocument();
  expect(dialog).toHaveTextContent('You now have 50 credits.');
  // Back on the create page it left, signed in: the brief, and the one-click Generate at its price.
  expect(await screen.findByLabelText('Video title or idea')).toHaveValue('Draft idea');
  expect(await screen.findByRole('button', { name: 'Generate 2 concepts · 30 credits' })).toBeInTheDocument();
  expect(screen.queryByTestId('where')).not.toBeInTheDocument();
  expectNothingStarted();
  expect(confirmSignup).toHaveBeenCalledTimes(1);
  fireEvent.click(within(dialog).getByRole('button', { name: 'Continue' }));
  await waitFor(() => expect(loadEmailGate()).toBeNull());
  // Its welcome card (shown by the AI Thumbnails layout) knows the sign-up and the credits.
  expect(openStudioWelcome('clerk:new-creator', Date.now())).toBe(true);
  expect(readStudioWelcome('clerk:new-creator')).toEqual({ credits: 50, arrivesOn: null });
});

it('the AI Thumbnails sign-in page (an existing account, without the gate) never asks for the welcome credits', async () => {
  startStudioAuth('sign-in', '/ai-thumbnails/projects');
  const view = render(app('/ai-thumbnails/sign-in'));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  mockAccount = 'clerk:returning';
  fireEvent.click(screen.getByRole('button', { name: 'Finish Clerk sign-in' }));
  view.rerender(app('/ai-thumbnails/sign-in'));
  await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/ai-thumbnails/projects'));
  await act(async () => undefined);
  expect(confirmSignup).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('a sign-in that did not start from AI Thumbnails confirms nothing', async () => {
  mockAccount = 'clerk:returning';
  render(app('/'));
  await act(async () => undefined);
  expect(confirmSignup).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('wallet sign-in after the gate shows why the welcome credits were not added, and stays on the page', async () => {
  pendingGate('sign-in');
  (confirmSignup as jest.Mock).mockRejectedValue(httpError(403, 'EMAIL_NOT_VERIFIED', 'web3_no_email'));
  mockAccount = 'web3:7';
  render(app('/'));
  const gate = await screen.findByRole('dialog');
  expect(await within(gate).findByText(/Welcome credits are not available for wallet accounts\./)).toBeInTheDocument();
  expect(within(gate).queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  expect(screen.getByTestId('where')).toHaveTextContent(/^\/$/);
  expect(confirmSignup).toHaveBeenCalledTimes(1);
});

it('an unverified email can try the welcome credits again', async () => {
  pendingGate('sign-up', true, true);
  (confirmSignup as jest.Mock).mockRejectedValueOnce(httpError(403, 'EMAIL_NOT_VERIFIED', 'email_not_verified'));
  mockAccount = 'clerk:unverified';
  render(app('/'));
  const gate = await screen.findByRole('dialog');
  expect(await within(gate).findByText(/not verified yet/)).toBeInTheDocument();
  fireEvent.click(within(gate).getByRole('button', { name: 'Try again' }));
  expect(await within(gate).findByText('50 credits added')).toBeInTheDocument();
  expect(confirmSignup).toHaveBeenCalledTimes(2);
});

it('sign-out then another account on the same browser: nothing of the previous visitor is confirmed or kept', async () => {
  saveStudioDraft('visitor-draft', draft);
  pendingGate('sign-up', true);
  noteStudioAuthStart();
  // The visitor signs in; their confirmation has not answered yet.
  (confirmSignup as jest.Mock).mockReturnValue(new Promise(() => undefined));
  mockAccount = 'clerk:first-visitor';
  const view = render(app('/'));
  await waitFor(() => expect(confirmSignup).toHaveBeenCalledTimes(1));
  expect(openStudioWelcome('clerk:first-visitor', Date.now())).toBe(true);
  // Sign-out: a full reload, the page is anonymous again.
  view.unmount();
  reload();
  mockAccount = 'anonymous';
  const signedOut = render(app('/'));
  await act(async () => undefined);
  expect(screen.getByTestId('where')).toHaveTextContent('/');
  expect(loadEmailGate()).toBeNull();
  expect(loadStudioDraft('visitor-draft')).toBeNull();
  expect(readStudioWelcome('clerk:first-visitor')).toBeNull();
  signedOut.unmount();
  reload();
  mockAccount = 'clerk:next-person';
  render(app('/'));
  await act(async () => undefined);
  expect(confirmSignup).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('switching straight to another account forgets the previous visitor’s gate and brief', async () => {
  saveStudioDraft('visitor-draft', draft);
  pendingGate('sign-up', true);
  (confirmSignup as jest.Mock).mockReturnValue(new Promise(() => undefined));
  mockAccount = 'clerk:first-visitor';
  const view = render(app('/'));
  await waitFor(() => expect(confirmSignup).toHaveBeenCalledTimes(1));
  mockAccount = 'clerk:switched-to';
  view.rerender(app('/'));
  await act(async () => undefined);
  expect(confirmSignup).toHaveBeenCalledTimes(1);
  expect(loadEmailGate()).toBeNull();
  expect(loadStudioDraft('visitor-draft')).toBeNull();
});

it('closing a refused gate keeps the welcome credits reachable from AI Thumbnails until they are added', async () => {
  pendingGate('sign-up', true);
  (confirmSignup as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));
  mockAccount = 'clerk:maker';
  render(app('/ai-thumbnails/projects'));
  const gate = await screen.findByRole('dialog');
  expect(await within(gate).findByText('We could not add your credits yet. Try again in a moment.')).toBeInTheDocument();
  fireEvent.click(within(gate).getAllByRole('button', { name: 'Close' })[1]);
  expect(loadEmailGate()).toMatchObject({ phase: 'refused', retryable: true, open: false });
  const prompt = await screen.findByRole('region', { name: 'Welcome credits' });
  fireEvent.click(within(prompt).getByRole('button', { name: 'Finish claiming your 50 free credits' }));
  expect(await screen.findByText('50 credits added')).toBeInTheDocument();
  expect(confirmSignup).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole('region', { name: 'Welcome credits' })).not.toBeInTheDocument();
});

it('the welcome credits reminder can be dismissed, and a wallet refusal leaves no reminder', async () => {
  saveEmailGate({ reason: 'generate', open: false, updatedAt: Date.now(), phase: 'refused', marketingConsent: false, signUpStartedAt: null, code: 'NETWORK_ERROR', cause: null, retryable: true, account: 'clerk:maker' });
  mockAccount = 'clerk:maker';
  const view = render(app('/ai-thumbnails/projects'));
  fireEvent.click(within(await screen.findByRole('region', { name: 'Welcome credits' })).getByRole('button', { name: 'Dismiss' }));
  expect(screen.queryByRole('region', { name: 'Welcome credits' })).not.toBeInTheDocument();
  expect(loadEmailGate()).toMatchObject({ phase: 'refused', retryable: true });
  view.unmount();
  reload();
  saveEmailGate({ reason: 'generate', open: false, updatedAt: Date.now(), phase: 'refused', marketingConsent: false, signUpStartedAt: null, code: 'EMAIL_NOT_VERIFIED', cause: 'web3_no_email', retryable: false, account: 'clerk:maker' });
  render(app('/ai-thumbnails/projects'));
  await act(async () => undefined);
  expect(screen.queryByRole('region', { name: 'Welcome credits' })).not.toBeInTheDocument();
});

it('an email already used by another account: the server\'s sentence, with no retry and no reminder', async () => {
  pendingGate('sign-up', true, true);
  (confirmSignup as jest.Mock).mockRejectedValue(httpError(403, 'EMAIL_IN_USE', 'email_in_use', 'This email already received its welcome credits on another account.'));
  mockAccount = 'clerk:second-account';
  render(app('/ai-thumbnails/projects'));
  const gate = await screen.findByRole('dialog');
  expect(await within(gate).findByText('This email already received its welcome credits on another account.')).toBeInTheDocument();
  expect(within(gate).queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  fireEvent.click(within(gate).getAllByRole('button', { name: 'Close' })[1]);
  await waitFor(() => expect(loadEmailGate()).toBeNull());
  expect(screen.queryByRole('region', { name: 'Welcome credits' })).not.toBeInTheDocument();
  expect(confirmSignup).toHaveBeenCalledTimes(1);
});

it.each([
  ['EMAIL_DISPOSABLE', 'Welcome credits need a permanent email address.'],
  ['WELCOME_LIMIT_NETWORK', 'Welcome credits are limited per network. You can still buy credits.'],
])('%s: its message, with no retry and no reminder', async (code, message) => {
  pendingGate('sign-up', true, true);
  (confirmSignup as jest.Mock).mockRejectedValue(httpError(403, code, undefined, 'Server wording'));
  mockAccount = 'clerk:new-creator';
  render(app('/ai-thumbnails/projects'));
  const gate = await screen.findByRole('dialog');
  expect(await within(gate).findByText(message)).toBeInTheDocument();
  expect(within(gate).queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  fireEvent.click(within(gate).getAllByRole('button', { name: 'Close' })[1]);
  await waitFor(() => expect(loadEmailGate()).toBeNull());
  expect(screen.queryByRole('region', { name: 'Welcome credits' })).not.toBeInTheDocument();
});

it('today\'s welcome credits all given: the gate and the welcome card say when they arrive, with no retry and no reminder', async () => {
  noteStudioAuthStart();
  pendingGate('sign-up', false, true);
  (confirmSignup as jest.Mock).mockResolvedValue({ ...granted, granted: false, deferred: true, grantOn: '2026-09-29', balance: { balance: 0, reserved: 0, available: 0 } });
  mockAccount = 'clerk:new-creator';
  render(app('/ai-thumbnails/projects'));
  const gate = await screen.findByRole('dialog');
  expect(await within(gate).findByText('Today’s welcome credits are all given. Your 50 credits will be added on 29 September.')).toBeInTheDocument();
  expect(within(gate).queryByText(/credits added/)).not.toBeInTheDocument();
  expect(within(gate).queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  fireEvent.click(within(gate).getByRole('button', { name: 'Continue' }));
  await waitFor(() => expect(loadEmailGate()).toBeNull());
  expect(screen.queryByRole('region', { name: 'Welcome credits' })).not.toBeInTheDocument();
  expect(openStudioWelcome('clerk:new-creator', Date.now())).toBe(true);
  expect(readStudioWelcome('clerk:new-creator')).toEqual({ credits: null, arrivesOn: '2026-09-29' });
});

it('an account that already had its welcome credits sees no message', async () => {
  pendingGate('sign-in', false, true);
  (confirmSignup as jest.Mock).mockResolvedValue({ ...granted, granted: false, alreadyGranted: true, balance: { balance: 20, reserved: 0, available: 20 }, welcomeSent: false });
  mockAccount = 'clerk:returning';
  render(app('/'));
  await waitFor(() => expect(confirmSignup).toHaveBeenCalledTimes(1));
  expect(confirmSignup).toHaveBeenCalledWith({ marketingConsent: false, fingerprint: 'fingerprint-1' });
  await waitFor(() => expect(loadEmailGate()).toBeNull());
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

it('a restored draft survives the in-place sign-up without a reload (no StrictMode double effects)', async () => {
  saveStudioDraft('restored-draft', draft);
  const view = render(plainApp('/ai-thumbnails/generate?draft=restored-draft'));
  expect(screen.getByLabelText('Video title or idea')).toHaveValue('Draft idea');
  // Not consumed on arrival: nothing was edited yet.
  expect(loadStudioDraft('restored-draft')?.draft.videoTitle).toBe('Draft idea');
  fireEvent.click(screen.getByRole('button', { name: 'Create a free account to generate' }));
  const gate = await screen.findByRole('dialog');
  const saved = jest.fn();
  window.addEventListener(SAVE_STUDIO_DRAFT_EVENT, saved);
  fireEvent.click(within(gate).getByRole('button', { name: 'Create my free account' }));
  window.removeEventListener(SAVE_STUDIO_DRAFT_EVENT, saved);
  // Saved before the sign-up can leave the page.
  expect(saved).toHaveBeenCalledTimes(1);
  expect(within(gate).getByTestId('clerk-sign-up')).toHaveAttribute('data-done', CONTINUE);
  // The sign-up signs in, then the continue screen goes back to the brief (no onboarding).
  mockAccount = 'clerk:new-creator';
  fireEvent.click(within(gate).getByRole('button', { name: 'Finish Clerk sign-up' }));
  view.rerender(plainApp('/ai-thumbnails/generate?draft=restored-draft'));
  expect(await screen.findByRole('button', { name: 'Generate 2 concepts · 30 credits' })).toBeInTheDocument();
  expect(screen.getByLabelText('Video title or idea')).toHaveValue('Draft idea');
  await waitFor(() => expect(confirmSignup).toHaveBeenCalledTimes(1));
  expect(confirmSignup).toHaveBeenCalledWith({ marketingConsent: false, fingerprint: 'fingerprint-1' });
  expectNothingStarted();
});

it('"I already have an account" shows the AI Thumbnails sign-in in place and the wallet sign-in; Back returns to the offer', async () => {
  saveStudioDraft('gate-draft', draft);
  saveEmailGate({ reason: 'generate', open: true, updatedAt: Date.now(), phase: 'form', marketingConsent: false });
  const view = render(app('/ai-thumbnails/generate?draft=gate-draft'));
  const gate = await screen.findByRole('dialog');
  expect(within(gate).queryByTestId('clerk-sign-in')).not.toBeInTheDocument();
  fireEvent.click(within(gate).getByRole('button', { name: 'I already have an account' }));
  const signIn = within(gate).getByTestId('clerk-sign-in');
  expect(signIn).toHaveAttribute('data-routing', 'virtual');
  // An existing account, and a new Google or Discord account made here, end on the continue address.
  expect(signIn).toHaveAttribute('data-done', CONTINUE);
  expect(signIn).toHaveAttribute('data-other-done', CONTINUE);
  expect(signIn).toHaveAttribute('data-switch', '/ai-thumbnails/sign-up');
  expect(signIn).toHaveAttribute('data-social', 'hidden');
  expect(within(gate).getByRole('link', { name: 'Continue with Google or Discord' })).toHaveAttribute('href', '/ai-thumbnails/sign-in');
  expect(loadEmailGate()).toMatchObject({ phase: 'awaiting_sign_in', flow: 'sign-in', signUpStartedAt: null });
  // Back to the offer, then the sign-up in place.
  fireEvent.click(within(gate).getByRole('button', { name: 'Back' }));
  fireEvent.click(within(gate).getByRole('button', { name: 'Create my free account' }));
  expect(within(gate).getByTestId('clerk-sign-up')).toHaveAttribute('data-done', CONTINUE);
  fireEvent.click(within(gate).getByRole('button', { name: 'Back' }));
  fireEvent.click(within(gate).getByRole('button', { name: 'I already have an account' }));
  expect(within(gate).getAllByRole('link').map(link => link.getAttribute('href'))).toEqual(['/ai-thumbnails/sign-in', '/ai-thumbnails/sign-in']);
  fireEvent.click(within(gate).getByRole('link', { name: 'Sign in with a wallet' }));
  // The AI Thumbnails sign-in page, on its wallet section; the gate waits there, hidden.
  expect(await screen.findByRole('heading', { name: 'Sign in with a wallet' })).toHaveFocus();
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(loadEmailGate()).toMatchObject({ phase: 'awaiting_sign_in', open: true });
  expect(loadStudioDraft('gate-draft')?.draft.videoTitle).toBe('Draft idea');
  view.unmount();
});

it('Google or Discord from the gate: the full AI Thumbnails sign-up with the gate\'s box, then back and confirmed with it', async () => {
  localStorage.setItem('pending_referral_code', 'FRIEND');
  saveStudioDraft('gate-draft', draft);
  saveEmailGate({ reason: 'generate', open: true, updatedAt: Date.now(), phase: 'form', marketingConsent: false });
  const view = render(app('/ai-thumbnails/generate?draft=gate-draft'));
  const gate = await screen.findByRole('dialog');
  fireEvent.click(within(gate).getByRole('checkbox', { name: /product tips/ }));
  fireEvent.click(within(gate).getByRole('button', { name: 'Create my free account' }));
  fireEvent.click(within(gate).getByRole('link', { name: 'Continue with Google or Discord' }));
  // The full page, where Clerk's own Google and Discord buttons are; the gate waits, hidden.
  const page = await screen.findByTestId('clerk-sign-up');
  expect(page).toHaveAttribute('data-routing', 'path');
  expect(page).toHaveAttribute('data-social', 'shown');
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByRole('checkbox', { name: /product tips/ })).toBeChecked();
  // Google comes back (Clerk's own sub-paths), the account exists: the continue screen.
  mockAccount = 'clerk:google-creator';
  fireEvent.click(screen.getByRole('button', { name: 'Finish Clerk sign-up' }));
  view.rerender(app('/ai-thumbnails/generate?draft=gate-draft'));
  expect(await screen.findByText('50 credits added')).toBeInTheDocument();
  expect(confirmSignup).toHaveBeenCalledTimes(1);
  expect(confirmSignup).toHaveBeenCalledWith({ marketingConsent: true, referralCode: 'FRIEND', fingerprint: 'fingerprint-1' });
  // Back on the brief it left, in the signed-in create form.
  expect(await screen.findByLabelText('Video title or idea')).toHaveValue('Draft idea');
  expectNothingStarted();
});

it.each([true, false])('the AI Thumbnails sign-up page without the gate (opt-in %s): the welcome credits confirmed once with its box', async consent => {
  startStudioAuth('sign-up', '/ai-thumbnails/projects');
  const view = render(app('/ai-thumbnails/sign-up'));
  const box = screen.getByRole('checkbox', { name: /product tips/ });
  expect(box).not.toBeChecked();
  if (consent) fireEvent.click(box);
  mockAccount = 'clerk:page-creator';
  fireEvent.click(screen.getByRole('button', { name: 'Finish Clerk sign-up' }));
  view.rerender(app('/ai-thumbnails/sign-up'));
  const dialog = await screen.findByRole('dialog');
  expect(await within(dialog).findByText('50 credits added')).toBeInTheDocument();
  expect(confirmSignup).toHaveBeenCalledTimes(1);
  expect(confirmSignup).toHaveBeenCalledWith({ marketingConsent: consent, fingerprint: 'fingerprint-1' });
  // Back where the sign-up started; the welcome card knows the credits.
  await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent(/^\/ai-thumbnails\/projects/));
  expect(openStudioWelcome('clerk:page-creator', Date.now())).toBe(true);
  expect(readStudioWelcome('clerk:page-creator')).toEqual({ credits: 50, arrivesOn: null });
});

describe('gate focus and keyboard', () => {
  const inRoot = (ui: React.ReactElement) => {
    const root = document.createElement('div');
    root.id = 'root';
    return render(ui, { container: document.body.appendChild(root) });
  };

  it('focuses the main action, hides the page behind, keeps Tab inside and gives focus back on close', async () => {
    inRoot(app());
    const opener = screen.getByRole('button', { name: 'Create a free account to generate' });
    opener.focus();
    fireEvent.click(opener);
    const gate = await screen.findByRole('dialog');
    const create = within(gate).getByRole('button', { name: 'Create my free account' });
    await waitFor(() => expect(create).toHaveFocus());
    const root = document.getElementById('root')!;
    expect(root).toHaveAttribute('inert');
    expect(root).toHaveAttribute('aria-hidden', 'true');
    const last = within(gate).getByRole('button', { name: 'I already have an account' });
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(within(gate).getByRole('button', { name: 'Close' })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
    // Escape outside the window does nothing; inside it closes the window.
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(loadEmailGate()).toMatchObject({ open: true });
    fireEvent.keyDown(last, { key: 'Escape' });
    await waitFor(() => expect(loadEmailGate()).toBeNull());
    expect(root).not.toHaveAttribute('inert');
    expect(root).not.toHaveAttribute('aria-hidden');
    // Opened from a button of the page: focus goes back to it.
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it('starts each step on its heading or main action, also after a redirect, and never takes the focus from another window', async () => {
    pendingGate('sign-up', false, true);
    inRoot(app('/'));
    const gate = await screen.findByRole('dialog');
    await waitFor(() => expect(within(gate).getByRole('heading', { name: 'Create your free account' })).toHaveFocus());
    // Another window opens above the gate and takes the focus.
    const other = document.createElement('div');
    other.setAttribute('role', 'dialog');
    const otherInput = document.createElement('input');
    other.appendChild(otherInput);
    document.body.appendChild(other);
    otherInput.focus();
    act(() => saveEmailGate({ reason: 'generate', open: true, updatedAt: Date.now(), phase: 'confirming', marketingConsent: false, signUpStartedAt: null, account: null }));
    expect(otherInput).toHaveFocus();
    fireEvent.keyDown(otherInput, { key: 'Escape' });
    expect(loadEmailGate()).toMatchObject({ phase: 'confirming', open: true });
    other.remove();
    act(() => saveEmailGate({ reason: 'generate', open: true, updatedAt: Date.now(), phase: 'granted', credits: 50, balance: 50, granted: true, alreadyGranted: false, deferred: false, grantOn: null, account: null }));
    await waitFor(() => expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Continue' })).toHaveFocus());
    act(() => saveEmailGate({ reason: 'generate', open: true, updatedAt: Date.now(), phase: 'refused', marketingConsent: false, signUpStartedAt: null, account: null, code: 'NETWORK_ERROR', cause: null, retryable: true }));
    await waitFor(() => expect(within(screen.getByRole('dialog')).getByRole('heading', { name: /signed in/ })).toHaveFocus());
  });
});
