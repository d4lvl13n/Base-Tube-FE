import React, { StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AIThumbnailsSignInPage, AIThumbnailsSignUpPage } from '../auth/AIThumbnailsAuthPage';
import AIThumbnailsAuthContinue from '../auth/AIThumbnailsAuthContinue';
import SignInPage from '../../SignInPage';
import SignUpPage from '../../SignUpPage';
import OnboardingModal from '../../OnboardingModal';
import SignInWeb3 from '../../SignInWeb3';
import { onboardingApi } from '../../../../api/onboarding';
import { subscriptionsApi } from '../../../../api/subscriptions';
import { getWelcomeOffer } from '../../../../api/toolFunnel';
import { useAuth } from '../../../../contexts/AuthContext';
import { readStudioAuthOrigin, startStudioAuth, STUDIO_AUTH_ORIGIN_KEY, STUDIO_AUTH_ORIGIN_TTL_MS } from '../../../../utils/studioAuth';
import { PLAN_INTENT_TTL, readPlanIntent, rememberPlanIntent } from '../../../../utils/studioDraft';
import { loadEmailGate, resetStudioFunnelForTests } from '../../../../utils/studioFunnel';
import { resetStudioOnboardingForTests } from '../../../../utils/studioOnboarding';
import { startPlanSignUp } from '../components/billing/billingActions';

let mockClerk: { isLoaded: boolean; isSignedIn: boolean; user: any };
// Clerk's components show the props they were given: where they go once done, and their links.
jest.mock('@clerk/clerk-react', () => ({
  useUser: () => mockClerk,
  SignIn: (props: any) => <section aria-label="Clerk sign-in" data-routing={props.routing} data-path={props.path ?? ''} data-done={props.forceRedirectUrl ?? ''} data-new-account={props.signUpForceRedirectUrl ?? ''} data-switch={props.signUpUrl ?? ''} />,
  SignUp: (props: any) => <section aria-label="Clerk sign-up" data-routing={props.routing} data-path={props.path ?? ''} data-done={props.forceRedirectUrl ?? ''} data-existing-account={props.signInForceRedirectUrl ?? ''} data-switch={props.signInUrl ?? ''} data-after-sign-up={props.afterSignUpUrl ?? ''} data-redirect={props.redirectUrl ?? ''} />,
}));
jest.mock('../../../../contexts/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../../common/WalletWrapper/ConnectWalletButton', () => ({ __esModule: true, default: ({ customText }: any) => <button type="button">{customText}</button> }));
jest.mock('../../../../api/onboarding', () => ({ onboardingApi: { updateUsername: jest.fn(), completeOnboarding: jest.fn() } }));
jest.mock('../../../../api/toolFunnel', () => ({ ...jest.requireActual('../../../../api/toolFunnel'), getWelcomeOffer: jest.fn() }));
jest.mock('../../../../api/subscriptions', () => ({
  ...jest.requireActual('../../../../api/subscriptions'),
  subscriptionsApi: { getPlans: jest.fn(), getMe: jest.fn(), createCheckout: jest.fn() },
}));
jest.mock('../../../../hooks/useProfileData', () => ({ useApplyReferralCode: () => ({ isPending: false, mutate: jest.fn() }) }));
jest.mock('../../OnboardingModal/OnboardingModalUI', () => ({ OnboardingModalUI: () => <p>base.tube onboarding screens</p> }));
jest.mock('../../SignInWeb3/Styles', () => ({ SignInWeb3UI: () => <p>base.tube wallet sign-in</p> }));

const CONTINUE = '/ai-thumbnails/auth/continue';
const DAY = 24 * 60 * 60 * 1000;
const billing = subscriptionsApi as jest.Mocked<typeof subscriptionsApi>;
const creatorPlan = {
  id: 'creator', name: 'Creator', rank: 1, videosPerMonth: 6, creditsPerMonth: 540, channelProfiles: 1, highlights: [],
  prices: { month: { amountCents: 2400, currency: 'usd' }, year: { amountCents: 19900, currency: 'usd', monthlyEquivalentCents: 1658, savingsPercent: 31 } },
};
const catalog = {
  videoCredits: 90,
  videoBreakdown: { concepts: 3, conceptCredits: 15, edits: 2, editCredits: 18, audits: 1, auditCredits: 2 },
  rolloverMonths: 1,
  free: { channelProfiles: 1 },
  trial: { days: 7, videos: 2, credits: 180 },
  plans: [creatorPlan],
};
const Where = () => {
  const { pathname, search, hash } = useLocation();
  return <output data-testid="where">{pathname + search + hash}</output>;
};
const where = () => screen.getByTestId('where');
let client: QueryClient;
const app = (url: string) => <QueryClientProvider client={client}><MemoryRouter initialEntries={[url]}>
  <Routes>
    <Route path="/ai-thumbnails/sign-in/*" element={<><AIThumbnailsSignInPage /><Where /></>} />
    <Route path="/ai-thumbnails/sign-up/*" element={<><AIThumbnailsSignUpPage /><Where /></>} />
    <Route path={CONTINUE} element={<AIThumbnailsAuthContinue />} />
    <Route path="*" element={<Where />} />
  </Routes>
</MemoryRouter></QueryClientProvider>;
const clerkAccount = (createdAt: number) => {
  mockClerk = { isLoaded: true, isSignedIn: true, user: { id: 'user_1', createdAt: new Date(createdAt), primaryEmailAddress: { emailAddress: 'creator@example.com' } } };
};
const walletAccount = (onboarding_status: 'PENDING' | 'COMPLETED', setUser = jest.fn()) => {
  localStorage.setItem('auth_method', 'web3');
  (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, user: { id: 7, username: '0x_1234', onboarding_status }, setUser, isRestoring: false });
  return setUser;
};

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  localStorage.clear();
  resetStudioFunnelForTests();
  resetStudioOnboardingForTests();
  window.matchMedia = jest.fn(() => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() })) as any;
  mockClerk = { isLoaded: true, isSignedIn: false, user: null };
  (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, user: null, setUser: jest.fn(), isRestoring: false });
  (onboardingApi.completeOnboarding as jest.Mock).mockResolvedValue({ user: { onboarding_status: 'COMPLETED' } });
  (getWelcomeOffer as jest.Mock).mockResolvedValue({ credits: 50, available: true, resetsAt: '2030-01-02T00:00:00.000Z' });
  billing.getPlans.mockResolvedValue(catalog as any);
  billing.getMe.mockReset();
  billing.createCheckout.mockReset();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  client.clear();
  // setupTests makes window.location writable; checkout sets its href.
  Object.assign(window.location, { href: 'http://localhost:3000' });
});

describe('the AI Thumbnails sign-in and sign-up pages', () => {
  it.each([
    ['/ai-thumbnails/sign-in', 'Clerk sign-in', '/ai-thumbnails/sign-in', '/ai-thumbnails/sign-up', 'data-new-account'],
    ['/ai-thumbnails/sign-in/factor-one', 'Clerk sign-in', '/ai-thumbnails/sign-in', '/ai-thumbnails/sign-up', 'data-new-account'],
    ['/ai-thumbnails/sign-up', 'Clerk sign-up', '/ai-thumbnails/sign-up', '/ai-thumbnails/sign-in', 'data-existing-account'],
    ['/ai-thumbnails/sign-up/verify-email-address', 'Clerk sign-up', '/ai-thumbnails/sign-up', '/ai-thumbnails/sign-in', 'data-existing-account'],
    ['/ai-thumbnails/sign-up/sso-callback', 'Clerk sign-up', '/ai-thumbnails/sign-up', '/ai-thumbnails/sign-in', 'data-existing-account'],
  ])('%s shows Clerk on its own path; every way out ends on the continue address', (url, name, path, other, crossed) => {
    render(app(url));
    const clerk = screen.getByRole('region', { name });
    expect(clerk).toHaveAttribute('data-routing', 'path');
    expect(clerk).toHaveAttribute('data-path', path);
    expect(clerk).toHaveAttribute('data-done', CONTINUE);
    expect(clerk).toHaveAttribute(crossed, CONTINUE);
    expect(clerk).toHaveAttribute('data-switch', other);
  });

  it('drops a foreign Clerk redirect from the URL before Clerk renders: the target never comes from the query', () => {
    render(app('/ai-thumbnails/sign-up/sso-callback?__clerk_status=verified&sign_up_force_redirect_url=%2Fonboarding&redirect_url=%2Fonboarding#/?sign_in_force_redirect_url=%2F'));
    expect(where()).toHaveTextContent(/^\/ai-thumbnails\/sign-up\/sso-callback\?__clerk_status=verified#\/$/);
    expect(screen.getByRole('region', { name: 'Clerk sign-up' })).toHaveAttribute('data-done', CONTINUE);
  });

  it('the sign-up page says what AI Thumbnails does, promises the credits only on a verified email, and keeps an unticked opt-in', async () => {
    startStudioAuth('sign-up', '/ai-thumbnails/gallery');
    render(app('/ai-thumbnails/sign-up'));
    expect(screen.getByRole('heading', { name: 'Create your free AI Thumbnails account' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map(item => item.textContent)).toEqual([expect.stringMatching(/^Create\./), expect.stringMatching(/^Fix\./), expect.stringMatching(/^Audit\./)]);
    // The gift comes from the welcome offer: nothing is promised until the server says so.
    expect(screen.queryByText(/free credits/i)).not.toBeInTheDocument();
    expect(await screen.findByText('50 free credits once your email is verified.')).toBeInTheDocument();
    const box = screen.getByRole('checkbox', { name: /product tips and updates/ });
    expect(box).not.toBeChecked();
    fireEvent.click(box);
    expect(readStudioAuthOrigin()).toMatchObject({ destination: '/ai-thumbnails/gallery', intent: 'sign-up', consent: true });
    fireEvent.click(box);
    expect(readStudioAuthOrigin()).toMatchObject({ consent: false });
  });

  it('the sign-up page says when today’s welcome credits are all given', async () => {
    (getWelcomeOffer as jest.Mock).mockResolvedValue({ credits: 50, available: false, resetsAt: '2030-01-02T00:00:00.000Z' });
    render(app('/ai-thumbnails/sign-up'));
    expect(await screen.findByText('Today’s welcome credits are all given — create your account now and get them tomorrow.')).toBeInTheDocument();
  });

  it('without the welcome gift (the default), neither page promises credits', async () => {
    (getWelcomeOffer as jest.Mock).mockResolvedValue({ credits: 0, available: false, resetsAt: '2030-01-02T00:00:00.000Z' });
    const view = render(app('/ai-thumbnails/sign-up'));
    await waitFor(() => expect(getWelcomeOffer).toHaveBeenCalled());
    await act(async () => undefined);
    expect(screen.queryByText(/credits/i)).not.toBeInTheDocument();
    view.unmount();
    render(app('/ai-thumbnails/sign-in'));
    await act(async () => undefined);
    expect(screen.queryByText(/credits/i)).not.toBeInTheDocument();
  });

  it('after "Start 7-day free trial", the sign-up page says the trial checkout comes next', async () => {
    (getWelcomeOffer as jest.Mock).mockResolvedValue({ credits: 0, available: false, resetsAt: '2030-01-02T00:00:00.000Z' });
    startPlanSignUp({ planId: 'creator', interval: 'month', trial: true }, '/ai-thumbnails');
    render(app('/ai-thumbnails/sign-up'));
    expect(screen.getByRole('heading', { name: 'Create your account to start your free trial' })).toBeInTheDocument();
    expect(
      await screen.findByText('Next: secure checkout for your 7-day free trial of Creator, 2 videos included. Your card is charged on day 8 unless you cancel.'),
    ).toBeInTheDocument();
  });

  it('the sign-in page offers the wallet; a wallet sign-in there ends on the continue screen, back where it started', async () => {
    startStudioAuth('sign-in', '/ai-thumbnails/history');
    const view = render(app('/ai-thumbnails/sign-in'));
    expect(screen.getByRole('heading', { name: 'Sign in to AI Thumbnails' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in with a wallet' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    walletAccount('COMPLETED');
    view.rerender(app('/ai-thumbnails/sign-in'));
    await waitFor(() => expect(where()).toHaveTextContent(/^\/ai-thumbnails\/history$/));
    expect(onboardingApi.completeOnboarding).not.toHaveBeenCalled();
  });

  it('a visitor already signed in goes straight through the continue screen, and an existing account arms no credits', () => {
    clerkAccount(Date.now() - 30 * DAY);
    render(app('/ai-thumbnails/sign-up'));
    expect(where()).toHaveTextContent(/^\/ai-thumbnails\/generate$/);
    expect(screen.queryByRole('region', { name: 'Clerk sign-up' })).not.toBeInTheDocument();
    expect(loadEmailGate()).toBeNull();
  });
});

describe('/ai-thumbnails/auth/continue', () => {
  it.each([
    ['the page the sign-in started from', () => startStudioAuth('sign-in', '/ai-thumbnails/projects/project-1?source=image'), '/ai-thumbnails/projects/project-1?source=image'],
    ['the create page without a marker (it restores the tab\'s brief)', () => undefined, '/ai-thumbnails/generate'],
    ['the create page for an expired marker', () => startStudioAuth('sign-in', '/ai-thumbnails/gallery', undefined, Date.now() - STUDIO_AUTH_ORIGIN_TTL_MS - 1), '/ai-thumbnails/generate'],
  ])('goes to %s and forgets the marker', (_case, setUp, destination) => {
    setUp();
    clerkAccount(Date.now() - 30 * DAY);
    render(app(CONTINUE));
    expect(where().textContent).toBe(destination);
    expect(sessionStorage.getItem(STUDIO_AUTH_ORIGIN_KEY)).toBeNull();
    // An existing account signing in: no welcome credits to confirm.
    expect(loadEmailGate()).toBeNull();
  });

  it.each([true, false])('a sign-up (opt-in %s) arms the welcome credits confirmation with the page\'s box', consent => {
    startStudioAuth('sign-up', '/ai-thumbnails/gallery', consent);
    clerkAccount(Date.now());
    render(app(CONTINUE));
    expect(where().textContent).toBe('/ai-thumbnails/gallery');
    expect(loadEmailGate()).toMatchObject({ phase: 'awaiting_sign_in', flow: 'sign-up', reason: 'account', open: false, marketingConsent: consent });
  });

  it('a new Google or Discord account made on the sign-in page is a sign-up too', () => {
    startStudioAuth('sign-in', '/ai-thumbnails/gallery');
    clerkAccount(Date.now() - 60_000);
    render(app(CONTINUE));
    expect(loadEmailGate()).toMatchObject({ phase: 'awaiting_sign_in', flow: 'sign-up', marketingConsent: false });
  });

  it('a new (PENDING) wallet account completes its onboarding quietly, once, then goes back', async () => {
    startStudioAuth('sign-in', '/ai-thumbnails/gallery');
    const setUser = walletAccount('PENDING');
    render(<StrictMode>{app(CONTINUE)}</StrictMode>);
    await waitFor(() => expect(where().textContent).toBe('/ai-thumbnails/gallery'));
    expect(onboardingApi.completeOnboarding).toHaveBeenCalledTimes(1);
    expect(setUser).toHaveBeenCalledWith(expect.objectContaining({ id: 7, onboarding_status: 'COMPLETED' }));
    expect(loadEmailGate()).toBeNull();
  });

  describe('a plan chosen before the sign-up ("Start 7-day free trial")', () => {
    const noPlan = { subscription: null, canSubscribe: true, trialEligible: true };
    const signUpFromLanding = () => startPlanSignUp({ planId: 'creator', interval: 'month', trial: true }, '/ai-thumbnails');

    it('opens Stripe Checkout for that plan right after the sign-up, once, and forgets the plan', async () => {
      signUpFromLanding();
      clerkAccount(Date.now());
      billing.getMe.mockResolvedValue(noPlan as any);
      billing.createCheckout.mockResolvedValue({ url: 'https://checkout.stripe.test/cs_1', sessionId: 'cs_1', trialDays: 7 });
      render(<StrictMode>{app(CONTINUE)}</StrictMode>);
      await waitFor(() => expect(window.location.href).toBe('https://checkout.stripe.test/cs_1'));
      expect(billing.createCheckout).toHaveBeenCalledTimes(1);
      expect(billing.createCheckout).toHaveBeenCalledWith({ planId: 'creator', interval: 'month' });
      expect(screen.getByRole('status')).toHaveTextContent('Opening secure checkout…');
      expect(readPlanIntent()).toBeNull();
      // The sign-up is still a sign-up: its confirmation is armed as before.
      expect(loadEmailGate()).toMatchObject({ phase: 'awaiting_sign_in', flow: 'sign-up' });
    });

    it('never opens a paid checkout for a trial button: an account that had a plan goes to the pricing page', async () => {
      signUpFromLanding();
      clerkAccount(Date.now() - 30 * DAY);
      billing.getMe.mockResolvedValue({ ...noPlan, trialEligible: false } as any);
      render(app(CONTINUE));
      await waitFor(() => expect(where().textContent).toBe('/ai-thumbnails/pricing'));
      expect(billing.createCheckout).not.toHaveBeenCalled();
    });

    it('an account that already has a plan goes on to the page it came from', async () => {
      signUpFromLanding();
      clerkAccount(Date.now() - 30 * DAY);
      billing.getMe.mockResolvedValue({ subscription: { status: 'active' }, canSubscribe: false, trialEligible: false } as any);
      render(app(CONTINUE));
      await waitFor(() => expect(where().textContent).toBe('/ai-thumbnails'));
      expect(billing.createCheckout).not.toHaveBeenCalled();
    });

    it('a checkout that does not open sends the creator to the pricing page to try again', async () => {
      signUpFromLanding();
      clerkAccount(Date.now());
      billing.getMe.mockResolvedValue(noPlan as any);
      billing.createCheckout.mockRejectedValue(new Error('offline'));
      render(app(CONTINUE));
      await waitFor(() => expect(where().textContent).toBe('/ai-thumbnails/pricing'));
    });

    it('a plan remembered more than 30 minutes ago, or dropped by another sign-in start, is not used', () => {
      startStudioAuth('sign-in', '/ai-thumbnails/gallery');
      rememberPlanIntent({ planId: 'creator', interval: 'month', trial: true }, Date.now() - PLAN_INTENT_TTL - 1);
      clerkAccount(Date.now() - 30 * DAY);
      render(app(CONTINUE));
      expect(where().textContent).toBe('/ai-thumbnails/gallery');
      signUpFromLanding();
      startStudioAuth('sign-in', '/ai-thumbnails/gallery');
      expect(readPlanIntent()).toBeNull();
      expect(billing.getMe).not.toHaveBeenCalled();
    });
  });

  it('still goes back when that completion fails (the account can complete it later)', async () => {
    const logged = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (onboardingApi.completeOnboarding as jest.Mock).mockRejectedValue(new Error('offline'));
    const setUser = walletAccount('PENDING');
    render(app(CONTINUE));
    await waitFor(() => expect(where().textContent).toBe('/ai-thumbnails/generate'));
    expect(setUser).not.toHaveBeenCalled();
    expect(logged).toHaveBeenCalledWith(expect.stringContaining('could not be completed'), expect.any(Error));
    logged.mockRestore();
  });
});

describe('base.tube\'s general pages are unchanged (as on main)', () => {
  const oldReturn = `?studioReturn=${encodeURIComponent('/ai-thumbnails/generate')}`;
  it('/sign-up still ends on base.tube onboarding, even with an old AI Thumbnails return', () => {
    render(<MemoryRouter initialEntries={[`/sign-up${oldReturn}`]}><SignUpPage /></MemoryRouter>);
    const clerk = screen.getByRole('region', { name: 'Clerk sign-up' });
    expect(clerk).toHaveAttribute('data-path', '/sign-up');
    expect(clerk).toHaveAttribute('data-after-sign-up', '/onboarding');
    expect(clerk).toHaveAttribute('data-redirect', '/onboarding');
    expect(clerk).toHaveAttribute('data-done', '');
    expect(clerk).toHaveAttribute('data-switch', '/sign-in');
  });
  it('/sign-in keeps Clerk\'s own targets and links to /sign-up', () => {
    render(<MemoryRouter initialEntries={[`/sign-in${oldReturn}`]}><SignInPage /></MemoryRouter>);
    const clerk = screen.getByRole('region', { name: 'Clerk sign-in' });
    expect(clerk).toHaveAttribute('data-path', '/sign-in');
    expect(clerk).toHaveAttribute('data-done', '');
    expect(clerk).toHaveAttribute('data-new-account', '');
    expect(clerk).toHaveAttribute('data-switch', '/sign-up');
  });
  it('/onboarding shows its screens', () => {
    clerkAccount(Date.now());
    render(<MemoryRouter initialEntries={[`/onboarding${oldReturn}`]}><Routes><Route path="/onboarding" element={<OnboardingModal />} /><Route path="*" element={<Where />} /></Routes></MemoryRouter>);
    expect(screen.getByText('base.tube onboarding screens')).toBeInTheDocument();
  });
  it('/sign-in-web3 still sends a PENDING wallet account to /onboarding/web3', () => {
    walletAccount('PENDING');
    render(<MemoryRouter initialEntries={[`/sign-in-web3${oldReturn}`]}><Routes><Route path="/sign-in-web3" element={<SignInWeb3 />} /><Route path="*" element={<Where />} /></Routes></MemoryRouter>);
    expect(where().textContent).toBe('/onboarding/web3');
    expect(onboardingApi.completeOnboarding).not.toHaveBeenCalled();
  });
});
