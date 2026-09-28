import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StudioWelcomeCard from '../StudioWelcomeCard';
import { resetStudioFunnelForTests, saveEmailGate } from '../../../../../utils/studioFunnel';
import { resetStudioFunnelRunnerForTests, startEmailGateConfirm } from '../../../../../utils/studioFunnelRunner';
import { forgetStudioWelcome, noteStudioAuthStart, noteStudioWelcome } from '../../../../../utils/studioWelcome';

let mockState: { account: string; resolved: boolean; email: string | null; createdAt: number | null };
jest.mock('../../../../../hooks/useStudioAccount', () => ({ useStudioAccountState: () => mockState }));
jest.mock('../../../../../api/toolFunnel', () => ({ confirmSignup: jest.fn(), getToolFingerprint: () => 'fingerprint-1' }));

const DAY = 24 * 60 * 60 * 1000;
const signedIn = (account: string, createdAt: number | null = Date.now()) => {
  mockState = { account, resolved: true, email: null, createdAt };
};
const card = (path = '/ai-thumbnails/generate') => render(<MemoryRouter initialEntries={[path]}><StudioWelcomeCard /></MemoryRouter>);
const welcome = () => screen.queryByRole('region', { name: 'Welcome to base.tube AI Thumbnails' });

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  resetStudioFunnelForTests();
  resetStudioFunnelRunnerForTests();
  mockState = { account: 'anonymous', resolved: true, email: null, createdAt: null };
});

it('a new account that signed up from AI Thumbnails sees it once, with the channel style link and no other promise', async () => {
  noteStudioAuthStart();
  signedIn('clerk:new');
  const first = card();
  expect(await screen.findByRole('region', { name: 'Welcome to base.tube AI Thumbnails' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Set up your channel style' })).toHaveAttribute('href', '/ai-thumbnails/settings/style');
  expect(screen.queryByText(/credits added/)).not.toBeInTheDocument();
  first.unmount();
  // The next page, or the page Clerk reloads right after the sign-up: still there.
  const next = card('/ai-thumbnails/projects');
  expect(welcome()).toBeInTheDocument();
  next.unmount();
  // A later visit (a new tab: nothing of this tab's card), even through the AI Thumbnails sign-in again: never shown twice.
  forgetStudioWelcome();
  noteStudioAuthStart();
  card('/ai-thumbnails/generate').unmount();
  card('/ai-thumbnails/generate');
  await act(async () => undefined);
  expect(screen.queryAllByRole('region')).toHaveLength(0);
});

it('Close hides it for good', async () => {
  noteStudioAuthStart();
  signedIn('clerk:new');
  const view = card();
  fireEvent.click(await screen.findByRole('button', { name: 'Close welcome' }));
  expect(welcome()).not.toBeInTheDocument();
  view.unmount();
  card('/ai-thumbnails/gallery');
  await act(async () => undefined);
  expect(welcome()).not.toBeInTheDocument();
});

it.each([
  ['granted them', { granted: true, alreadyGranted: false }, true],
  ['answered they were already received', { granted: false, alreadyGranted: true }, false],
  ['deferred them to another day', { granted: false, alreadyGranted: false, deferred: true, grantOn: '2026-09-29' }, false],
])('says "50 credits added" only when the gate confirm %s in this session', async (_case, answer, shown) => {
  noteStudioAuthStart();
  saveEmailGate({ reason: 'generate', open: false, updatedAt: Date.now(), phase: 'awaiting_sign_in', flow: 'sign-up', marketingConsent: false, signUpStartedAt: Date.now() });
  signedIn('clerk:new');
  card();
  expect(await screen.findByRole('region', { name: 'Welcome to base.tube AI Thumbnails' })).toBeInTheDocument();
  const confirm = jest.fn().mockResolvedValue({ ...answer, signupCredits: 50, balance: { balance: 50, reserved: 0, available: 50 }, consentRecorded: false, welcomeSent: false });
  await act(async () => { await startEmailGateConfirm('clerk:new', { confirm }); });
  expect(confirm).toHaveBeenCalledTimes(1);
  expect(Boolean(screen.queryByText('50 credits added.'))).toBe(shown);
  // Deferred: when they arrive instead.
  expect(Boolean(screen.queryByText('Your welcome credits arrive on 29 September.'))).toBe('deferred' in answer);
});

it('an existing account signing in from AI Thumbnails never sees it, and neither does a sign-up from the rest of base.tube', async () => {
  noteStudioAuthStart();
  signedIn('clerk:returning', Date.now() - 30 * DAY);
  const returning = card();
  await act(async () => undefined);
  expect(welcome()).not.toBeInTheDocument();
  returning.unmount();
  // No AI Thumbnails sign-up noted in this tab (general base.tube sign-up, then onboarding).
  signedIn('clerk:elsewhere');
  card();
  await act(async () => undefined);
  expect(welcome()).not.toBeInTheDocument();
});

it('a new wallet account from AI Thumbnails (completed quietly) sees it; another wallet account does not', async () => {
  noteStudioWelcome('web3:7');
  signedIn('web3:7', null);
  const wallet = card();
  expect(await screen.findByRole('region', { name: 'Welcome to base.tube AI Thumbnails' })).toBeInTheDocument();
  wallet.unmount();
  // An existing wallet account signing in from AI Thumbnails: only the sign-in screen was noted.
  noteStudioAuthStart();
  signedIn('web3:8', null);
  card();
  await act(async () => undefined);
  expect(welcome()).not.toBeInTheDocument();
});
