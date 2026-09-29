import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import StudioProjectsPage from '../StudioProjectsPage';
import StudioProjectPage from '../StudioProjectPage';
import StudioProfilesPage from '../StudioProfilesPage';
import StudioBatchReview from '../StudioBatchReview';
import AIThumbnailsHeader from '../components/AIThumbnailsHeader';
import GalleryPage from '../GalleryPage';
import AuditHistoryPage from '../AuditHistoryPage';
import SettingsPage from '../SettingsPage';
import ThumbnailLandingHeader from '../../ThumbnailLanding/ThumbnailLandingHeader';
import { loadStudioDraft, readPlanIntent, saveStudioDraft, SAVE_STUDIO_DRAFT_EVENT } from '../../../../utils/studioDraft';
import { readStudioAuthOrigin } from '../../../../utils/studioAuth';

// Any direct Clerk auth rendering from these Studio gates is a regression.
jest.mock('@clerk/clerk-react', () => ({ useUser: () => ({ isSignedIn: false, isLoaded: true }) }));
jest.mock('../../../../contexts/AuthContext', () => ({ useAuth: () => ({ isAuthenticated: false }) }));
jest.mock('../../../../hooks/useCTREngine', () => ({ __esModule: true, default: () => ({ isAuthenticated: false, isAnonymous: mockAnonymous, auditHistory: [] }) }));
jest.mock('../../../../hooks/useThumbnailGallery', () => ({ useThumbnailGallery: () => ({ gallery: [], loadGallery: () => undefined }) }));
let mockAnonymous = true;
jest.mock('../../../../hooks/useStudioAccount', () => ({ useStudioAccount: () => 'anonymous' }));
jest.mock('../../../../hooks/useStudioCapabilities', () => ({ useStudioStartAvailability: () => ({ available: true, message: null }) }));
jest.mock('../AIThumbnailsLayout', () => ({ __esModule: true, default: ({ children }: any) => <main>{children}</main> }));
jest.mock('../../../../api/thumbnailStudio', () => ({ thumbnailStudioApi: {} }));
jest.mock('../../../common/ThumbnailPackaging', () => ({ ThumbnailStylePicker: () => null }));

const Destination = () => {
  const location = useLocation();
  return <output data-testid="destination">{location.pathname + location.search + ((location.state as any)?.wallet ? ' (wallet)' : '')}</output>;
};
const SIGN_IN = '/ai-thumbnails/sign-in';
/** No AI Thumbnails entry leads to base.tube's general sign-in or sign-up pages. */
const expectNoGeneralAuthLinks = () => {
  const general = screen.queryAllByRole('link').map(link => link.getAttribute('href') ?? '').filter(href => /^\/(?:sign-in|sign-up|sign-in-web3|signin|signup)(?:[/?#]|$)/.test(href));
  expect(general).toEqual([]);
};
beforeEach(() => {
  mockAnonymous = true;
  sessionStorage.clear();
  window.matchMedia = jest.fn(() => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() })) as any;
});

it.each([
  ['/ai-thumbnails/projects', <StudioProjectsPage />, '/ai-thumbnails/projects'],
  ['/ai-thumbnails/projects/project-1?source=image', <StudioProjectPage />, '/ai-thumbnails/projects/:projectId'],
  ['/ai-thumbnails/projects/batch?projects=10000000-0000-4000-8000-000000000001', <StudioBatchReview />, '/ai-thumbnails/projects/batch'],
] as const)('offers the AI Thumbnails sign-in (email or wallet) from %s and comes back to it', (url, element, route) => {
  render(<MemoryRouter initialEntries={[url]}><Routes><Route path={route} element={element} /><Route path={SIGN_IN} element={<Destination />} /></Routes></MemoryRouter>);
  const email = screen.getByRole('link', { name: /Sign In with Email/ });
  expect(email).toHaveAttribute('href', SIGN_IN);
  expect(screen.getByRole('link', { name: /Sign In with Wallet/ })).toHaveAttribute('href', SIGN_IN);
  expectNoGeneralAuthLinks();
  fireEvent.click(email);
  expect(screen.getByTestId('destination').textContent).toBe(SIGN_IN);
  expect(readStudioAuthOrigin()).toMatchObject({ destination: url, intent: 'sign-in' });
});

it('sends the old channel profiles page to Settings › Channel style', () => {
  render(<MemoryRouter initialEntries={['/ai-thumbnails/projects/profiles?profile=p-1']}><Routes><Route path="/ai-thumbnails/projects/profiles" element={<StudioProfilesPage />} /><Route path="/ai-thumbnails/settings/:section" element={<Destination />} /></Routes></MemoryRouter>);
  expect(screen.getByTestId('destination')).toHaveTextContent('/ai-thumbnails/settings/style?profile=p-1');
});

it('the header wallet choice opens the AI Thumbnails sign-in on its wallet section and remembers the project', () => {
  const url = '/ai-thumbnails/projects/project-1';
  render(<MemoryRouter initialEntries={[url]}><Routes><Route path="/ai-thumbnails/projects/:id" element={<AIThumbnailsHeader />} /><Route path={SIGN_IN} element={<Destination />} /></Routes></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  expectNoGeneralAuthLinks();
  fireEvent.click(screen.getByRole('link', { name: /Sign In with Wallet/ }));
  expect(screen.getByTestId('destination').textContent).toBe(`${SIGN_IN} (wallet)`);
  expect(readStudioAuthOrigin()).toMatchObject({ destination: url, intent: 'sign-in' });
});

it('saves the generator draft before opening the AI Thumbnails sign-in', () => {
  const persist = () => saveStudioDraft('draft-header', { videoTitle: 'My idea', creatorHook: '', description: '', direction: '', headline: '', format: 'landscape', count: 1, quality: 'high', includeFace: false, niche: null, savedStyleHasLogo: false, localFiles: [] });
  window.addEventListener(SAVE_STUDIO_DRAFT_EVENT, persist);
  render(<MemoryRouter initialEntries={['/ai-thumbnails/generate']}><Routes><Route path="/ai-thumbnails/generate" element={<AIThumbnailsHeader />} /><Route path={SIGN_IN} element={<Destination />} /></Routes></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  fireEvent.click(screen.getByRole('link', { name: /Sign In with Email/ }));
  expect(screen.getByTestId('destination').textContent).toBe(SIGN_IN);
  // Back on the create page afterwards, which restores this tab's saved brief.
  expect(readStudioAuthOrigin()).toMatchObject({ destination: '/ai-thumbnails/generate' });
  expect(loadStudioDraft()?.draft.videoTitle).toBe('My idea');
  window.removeEventListener(SAVE_STUDIO_DRAFT_EVENT, persist);
});

it('the thumbnail audit page comes back to itself', () => {
  render(<MemoryRouter initialEntries={['/ai-thumbnails/audit']}><AIThumbnailsHeader /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  fireEvent.click(screen.getByRole('link', { name: /Sign In with Email/ }));
  expect(readStudioAuthOrigin()).toMatchObject({ destination: '/ai-thumbnails/audit' });
});

it.each([
  ['/ai-thumbnails/projects', <StudioProjectsPage />, '/ai-thumbnails/projects'],
  ['/ai-thumbnails/projects/project-1', <StudioProjectPage />, '/ai-thumbnails/projects/:projectId'],
  ['/ai-thumbnails/settings/style', <SettingsPage />, '/ai-thumbnails/settings/:section'],
  ['/ai-thumbnails/projects/batch', <StudioBatchReview />, '/ai-thumbnails/projects/batch'],
] as const)('waits for the account instead of flashing a sign-in prompt on %s', (url, element, route) => {
  mockAnonymous = false;
  render(<MemoryRouter initialEntries={[url]}><Routes><Route path={route} element={element} /></Routes></MemoryRouter>);
  expect(screen.getByRole('status')).toHaveTextContent('Loading your account');
  expect(screen.queryByRole('link', { name: /Sign In with Email/ })).not.toBeInTheDocument();
});

it.each([
  ['/ai-thumbnails/gallery', <GalleryPage />],
  ['/ai-thumbnails/history', <AuditHistoryPage />],
  ['/ai-thumbnails/settings', <SettingsPage />],
  ['/ai-thumbnails/settings/credits', <SettingsPage />],
] as const)('offers the AI Thumbnails sign-in on %s and comes back to it', (url, element) => {
  render(<MemoryRouter initialEntries={[url]}><Routes><Route path={url} element={element} /><Route path={SIGN_IN} element={<Destination />} /></Routes></MemoryRouter>);
  expect(screen.getByRole('link', { name: /Sign In with Email/ })).toHaveAttribute('href', SIGN_IN);
  expectNoGeneralAuthLinks();
  fireEvent.click(screen.getByRole('link', { name: /Sign In with Wallet/ }));
  expect(screen.getByTestId('destination').textContent).toBe(`${SIGN_IN} (wallet)`);
  expect(readStudioAuthOrigin()).toMatchObject({ destination: url, intent: 'sign-in' });
});

it('the AI Thumbnails landing page logs in and starts the trial on the AI Thumbnails pages, then comes back to it', () => {
  const landing = '/ai-thumbnails';
  const plan = { id: 'creator', name: 'Creator', rank: 1, videosPerMonth: 6, creditsPerMonth: 540, channelProfiles: 1, highlights: [], prices: { month: { amountCents: 2400, currency: 'usd' }, year: { amountCents: 19900, currency: 'usd', monthlyEquivalentCents: 1658, savingsPercent: 31 } } } as const;
  const offer = { kind: 'trial', plan, trial: { days: 7, videos: 2, credits: 180 }, signedIn: false } as const;
  render(<MemoryRouter initialEntries={[landing]}><Routes><Route path={landing} element={<ThumbnailLandingHeader offer={offer as any} signedIn={false} />} /><Route path="/ai-thumbnails/sign-in" element={<Destination />} /><Route path="/ai-thumbnails/sign-up" element={<Destination />} /></Routes></MemoryRouter>);
  expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', SIGN_IN);
  expectNoGeneralAuthLinks();
  fireEvent.click(screen.getByRole('link', { name: 'Log in' }));
  expect(screen.getByTestId('destination').textContent).toBe(SIGN_IN);
  expect(readStudioAuthOrigin()).toMatchObject({ destination: landing, intent: 'sign-in' });
});

it('the landing page\'s "Start free trial" opens the AI Thumbnails sign-up and remembers the plan for checkout', () => {
  const landing = '/ai-thumbnails';
  const plan = { id: 'creator', name: 'Creator', rank: 1, videosPerMonth: 6, creditsPerMonth: 540, channelProfiles: 1, highlights: [], prices: { month: { amountCents: 2400, currency: 'usd' }, year: { amountCents: 19900, currency: 'usd', monthlyEquivalentCents: 1658, savingsPercent: 31 } } } as const;
  const offer = { kind: 'trial', plan, trial: { days: 7, videos: 2, credits: 180 }, signedIn: false } as const;
  render(<MemoryRouter initialEntries={[landing]}><Routes><Route path={landing} element={<ThumbnailLandingHeader offer={offer as any} signedIn={false} />} /><Route path="/ai-thumbnails/sign-up" element={<Destination />} /></Routes></MemoryRouter>);
  fireEvent.click(screen.getByRole('link', { name: 'Start free trial' }));
  expect(screen.getByTestId('destination').textContent).toBe('/ai-thumbnails/sign-up');
  expect(readStudioAuthOrigin()).toMatchObject({ destination: landing, intent: 'sign-up' });
  expect(readPlanIntent()).toEqual({ planId: 'creator', interval: 'month', trial: true });
});
