import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuditPage from '../AuditPage';
import StudioFunnelBridge from '../../../common/StudioFunnelBridge';
import useCTREngine from '../../../../hooks/useCTREngine';
import { getWelcomeOffer } from '../../../../api/toolFunnel';
import { loadEmailGate, resetStudioFunnelForTests } from '../../../../utils/studioFunnel';

jest.mock('../../../../hooks/useCTREngine', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../../hooks/useStudioAccount', () => ({ useStudioAccount: () => 'anonymous', useStudioAccountState: () => ({ account: 'anonymous', resolved: true, email: null }) }));
jest.mock('@clerk/clerk-react', () => ({}));
jest.mock('../../../../api/toolFunnel', () => ({ getWelcomeOffer: jest.fn(), confirmSignup: jest.fn(), getToolFingerprint: () => 'fingerprint-1' }));
jest.mock('../AIThumbnailsLayout', () => ({ __esModule: true, default: ({ children }: any) => <main>{children}</main> }));
jest.mock('../components/ThumbnailAuditForm', () => ({ ThumbnailAuditForm: () => <p>Audit form</p> }));
jest.mock('../components/ThumbnailAuditResult', () => ({ ThumbnailAuditResult: () => null }));
jest.mock('../components/BuyCreditsModal', () => ({ BuyCreditsModal: () => null }));

let client: QueryClient;
const visitor = (errorCode: string | null, error: string | null) => (useCTREngine as jest.Mock).mockReturnValue({
  auditProgress: { status: 'error', includesPersonas: false }, auditResult: null, auditThumbnailUrl: null, youtubeMetadata: null,
  usageAccess: null, isLoadingQuota: false, error, errorDetail: null, errorCode, isAnonymous: true,
  auditByUrl: jest.fn(), auditByFile: jest.fn(), auditByYouTube: jest.fn(), clearAuditResult: jest.fn(), loadAuditById: jest.fn(), clearError: jest.fn(),
});
const page = () => render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/ai-thumbnails/audit']}><StudioFunnelBridge /><AuditPage /></MemoryRouter></QueryClientProvider>);
beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  localStorage.clear();
  resetStudioFunnelForTests();
  window.matchMedia = jest.fn(() => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() })) as any;
  (getWelcomeOffer as jest.Mock).mockResolvedValue({ credits: 50, available: true, resetsAt: '2030-01-02T00:00:00.000Z' });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => client.clear());

it('free audits used up on the platform: says so with the welcome credits and opens the account gate', async () => {
  visitor('ANONYMOUS_AUDIT_CAPACITY', 'Free audits are used up for today. Create a free account to get 50 credits.');
  page();
  expect(await screen.findByText('Free audits are used up for today. Create a free account to get 50 credits.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Create a free account' }));
  const gate = await screen.findByRole('dialog');
  expect(gate).toHaveTextContent('Free audits are used up for today');
  expect(within(gate).getByRole('button', { name: 'Create my free account' })).toBeInTheDocument();
  expect(loadEmailGate()).toMatchObject({ phase: 'form', reason: 'audit_capacity', open: true });
});

it('the per-network free audit limit keeps its own message and offers no account button', () => {
  visitor('ANONYMOUS_AUDIT_QUOTA_EXCEEDED', 'Free audit limit reached. Sign in for more audits.');
  page();
  expect(screen.getByRole('alert')).toHaveTextContent('Free audit limit reached. Sign in for more audits.');
  expect(screen.queryByRole('button', { name: 'Create a free account' })).not.toBeInTheDocument();
});
