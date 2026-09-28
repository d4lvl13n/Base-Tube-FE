import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GeneratePage from '../GeneratePage';
import StudioFunnelBridge from '../../../common/StudioFunnelBridge';
import useCTREngine from '../../../../hooks/useCTREngine';
import { thumbnailStudioApi } from '../../../../api/thumbnailStudio';
import { getWelcomeOffer } from '../../../../api/toolFunnel';
import { loadEmailGate, resetStudioFunnelForTests } from '../../../../utils/studioFunnel';
import { loadStudioDraft } from '../../../../utils/studioDraft';

jest.mock('../../../../hooks/useCTREngine', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../../hooks/useStudioAccount', () => ({ useStudioAccount: () => 'anonymous', useStudioAccountState: () => ({ account: 'anonymous', resolved: true, email: null }) }));
jest.mock('@clerk/clerk-react', () => ({}));
jest.mock('../../../../api/toolFunnel', () => ({ getWelcomeOffer: jest.fn(), confirmSignup: jest.fn(), getToolFingerprint: () => 'fingerprint-1' }));
jest.mock('../../../../api/thumbnailStudio', () => ({ thumbnailStudioApi: { createProject: jest.fn(), quote: jest.fn(), start: jest.fn() }, studioError: jest.fn() }));
jest.mock('../AIThumbnailsLayout', () => ({ __esModule: true, default: ({ children }: any) => <>{children}</> }));
jest.mock('../StudioCreatePage', () => ({ __esModule: true, default: () => <p>Studio create screen</p> }));
jest.mock('../components/ThumbnailFormatSelector', () => ({ ThumbnailFormatSelector: ({ onFormatChange }: any) => <button type="button" onClick={() => onFormatChange('short')}>Portrait</button> }));

const offer = getWelcomeOffer as jest.Mock;
const studio = thumbnailStudioApi as jest.Mocked<typeof thumbnailStudioApi>;
let ctr: any;
let client: QueryClient;
beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  localStorage.clear();
  resetStudioFunnelForTests();
  window.matchMedia = jest.fn(() => ({ matches: true, addListener: jest.fn(), removeListener: jest.fn() })) as any;
  ctr = { isAuthenticated: false, isAnonymous: true, usageAccess: null, isLoadingQuota: false };
  (useCTREngine as jest.Mock).mockImplementation(() => ctr);
  offer.mockResolvedValue({ credits: 50, available: true, resetsAt: '2030-01-02T00:00:00.000Z' });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => client.clear());
const page = (path = '/ai-thumbnails/generate') => <QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><StudioFunnelBridge /><GeneratePage /></MemoryRouter></QueryClientProvider>;
const choose = (label: string, option: string) => {
  fireEvent.click(screen.getByLabelText(label));
  fireEvent.click(screen.getByRole('option', { name: option }));
};
const createAccount = () => screen.getByRole('button', { name: 'Create a free account to generate' });

it('sends signed-in creators to the Studio', () => {
  ctr = { isAuthenticated: true, isAnonymous: false, usageAccess: null, isLoadingQuota: false };
  render(page());
  expect(screen.getByText('Studio create screen')).toBeInTheDocument();
});
it('waits for the account before choosing a screen', () => {
  ctr = { isAuthenticated: false, isAnonymous: false, usageAccess: null, isLoadingQuota: false };
  render(page());
  expect(screen.getByRole('status')).toHaveTextContent('Loading your account');
  expect(screen.queryByRole('button', { name: 'Create a free account to generate' })).not.toBeInTheDocument();
});

it('a visitor writes the brief on the same form, and the one button creates an account with the welcome credits it gets', async () => {
  render(page());
  expect(screen.getByRole('heading', { name: 'What’s your video about?' })).toBeInTheDocument();
  expect(createAccount()).toBeEnabled();
  expect(await screen.findByText('New accounts get 50 free credits — enough for one generation, one edit and an audit.')).toBeInTheDocument();
  // No free generation, no price, no account-only pickers, and nothing that bypasses the gate.
  expect(screen.queryByRole('button', { name: /^Generate/ })).not.toBeInTheDocument();
  expect(screen.queryByText(/free generation/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/Channel profile/)).not.toBeInTheDocument();
  expect(screen.queryByText('Your look')).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Sign in/ })).not.toBeInTheDocument();
});

it('says when today’s welcome credits are all given, and shows no number while the offer is unknown', async () => {
  offer.mockResolvedValue({ credits: 50, available: false, resetsAt: '2030-01-02T00:00:00.000Z' });
  const view = render(page());
  expect(await screen.findByText('Today’s welcome credits are all given — create your account now and get them tomorrow.')).toBeInTheDocument();
  view.unmount();
  client.clear();
  offer.mockRejectedValue(new Error('Network Error'));
  render(page());
  await waitFor(() => expect(offer).toHaveBeenCalledTimes(2));
  expect(await screen.findByText('New accounts get free credits.')).toBeInTheDocument();
  expect(screen.queryByText(/\d+ free credits/)).not.toBeInTheDocument();
});

it('opens the account gate for "generate", keeps the brief and starts nothing', async () => {
  render(page());
  fireEvent.change(screen.getByLabelText('Video title or idea'), { target: { value: 'Ocean music' } });
  fireEvent.click(screen.getByText('Portrait'));
  choose('Text on the thumbnail', 'Use my exact words');
  fireEvent.change(screen.getByLabelText('Initial headline'), { target: { value: 'CALM WAVES' } });
  fireEvent.click(screen.getByRole('button', { name: /Before and after/ }));
  choose('Number of concepts', '3');
  fireEvent.click(createAccount());
  const gate = await screen.findByRole('dialog');
  expect(gate).toHaveTextContent('Generating needs a free account');
  expect(await within(gate).findByText('50 free credits')).toBeInTheDocument();
  expect(gate).toHaveTextContent('New accounts get 50 free credits once the email is verified.');
  expect(loadEmailGate()).toMatchObject({ phase: 'form', reason: 'generate', open: true });
  expect(loadStudioDraft()?.draft).toMatchObject({ videoTitle: 'Ocean music', format: 'short', headline: 'CALM WAVES', textMode: 'exact', layout: 'before_after', count: 3 });
  expect(studio.createProject).not.toHaveBeenCalled();
  expect(studio.quote).not.toHaveBeenCalled();
  expect(studio.start).not.toHaveBeenCalled();
  // Closed, the brief is still on the form and the button opens the gate again.
  fireEvent.click(within(gate).getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByLabelText('Video title or idea')).toHaveValue('Ocean music');
  fireEvent.click(createAccount());
  expect(await screen.findByRole('dialog')).toHaveTextContent('Generating needs a free account');
});

it('restores the visitor’s brief after a full remount and discards it on request', () => {
  const view = render(page());
  fireEvent.change(screen.getByLabelText('Video title or idea'), { target: { value: 'Keep my idea' } });
  choose('Text on the thumbnail', 'Use my exact words');
  fireEvent.change(screen.getByLabelText('Initial headline'), { target: { value: 'EXACT WORDS' } });
  expect(loadStudioDraft()?.draft).toMatchObject({ videoTitle: 'Keep my idea', headline: 'EXACT WORDS', textMode: 'exact' });
  view.unmount();
  render(page());
  expect(screen.getByLabelText('Video title or idea')).toHaveValue('Keep my idea');
  expect(screen.getByLabelText('Initial headline')).toHaveValue('EXACT WORDS');
  fireEvent.click(screen.getByRole('button', { name: 'Discard draft' }));
  expect(screen.getByLabelText('Video title or idea')).toHaveValue('');
  expect(loadStudioDraft()).toBeNull();
});
