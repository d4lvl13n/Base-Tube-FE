import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { WalletFeature } from '../wallet/WalletFeature';
import ConnectWalletButton from '../../components/common/WalletWrapper/ConnectWalletButton';

let mockRejectButton = true;
let mockRejectRuntime = true;
let mockRejectProviders = true;
jest.mock('@clerk/clerk-react', () => ({ useAuth: () => ({ isLoaded: true, isSignedIn: false }) }));
jest.mock('../wallet/WalletAuthRuntime', () => {
  if (mockRejectRuntime) throw new Error('Loading chunk wallet-session failed');
  return { __esModule: true, default: () => <output>Session ready</output> };
});
jest.mock('../wallet/WalletProviders', () => {
  if (mockRejectProviders) throw new Error('Loading chunk wallet-ui failed');
  return { __esModule: true, default: ({ children }: { children: React.ReactNode }) => <div data-testid="wallet-providers">{children}</div> };
});

jest.mock('../../components/common/WalletWrapper/ConnectWalletButtonRuntime', () => {
  if (mockRejectButton) throw new Error('Loading chunk wallet-control failed');
  return { __esModule: true, default: () => <button>Wallet ready</button> };
});

beforeEach(() => {
  (window.matchMedia as jest.Mock).mockImplementation(query => ({
    matches: false, media: query, addListener: jest.fn(), removeListener: jest.fn(),
    addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn(),
  }));
  localStorage.clear();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  jest.spyOn(console, 'group').mockImplementation(() => undefined);
  jest.spyOn(console, 'groupEnd').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

it('retries a rejected session chunk without replacing public content or its draft', async () => {
  function PublicPage() {
    const { enableWallet } = useAuth();
    return <><input aria-label="Draft" defaultValue="Keep me" /><button onClick={enableWallet}>Connect wallet</button></>;
  }
  render(<AuthProvider><PublicPage /></AuthProvider>);
  const draft = screen.getByLabelText('Draft');
  fireEvent.change(draft, { target: { value: 'Still here' } });
  fireEvent.click(screen.getByRole('button', { name: 'Connect wallet' }));
  await screen.findByRole('alert');
  expect(screen.getByLabelText('Draft')).toBe(draft);
  mockRejectRuntime = false;
  fireEvent.click(screen.getByRole('button', { name: 'Retry wallet' }));
  await screen.findByText('Session ready');
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByLabelText('Draft')).toBe(draft);
  expect(draft).toHaveValue('Still here');
});

it('does not render wallet children before providers load and recovers their failed chunk', async () => {
  render(<><input aria-label="Upload title" defaultValue="Keep upload" /><WalletFeature><button>Wallet action</button></WalletFeature></>);
  const draft = screen.getByLabelText('Upload title');
  expect(screen.queryByRole('button', { name: 'Wallet action' })).toBeNull();
  await screen.findByRole('alert');
  mockRejectProviders = false;
  fireEvent.click(screen.getByRole('button', { name: 'Retry wallet' }));
  const wallet = await screen.findByRole('button', { name: 'Wallet action' });
  expect(screen.getByTestId('wallet-providers')).toContainElement(wallet);
  expect(screen.getByLabelText('Upload title')).toBe(draft);
  expect(screen.queryByRole('alert')).toBeNull();
});

it('retries the wallet control chunk inside an already loaded wallet route', async () => {
  mockRejectRuntime = false;
  mockRejectProviders = false;
  render(<AuthProvider><input aria-label="Public search" defaultValue="Keep search" /><WalletFeature><ConnectWalletButton /></WalletFeature></AuthProvider>);
  const search = screen.getByLabelText('Public search');
  fireEvent.click(await screen.findByRole('button', { name: 'Connect Wallet' }));
  await screen.findByRole('alert');
  mockRejectButton = false;
  fireEvent.click(screen.getByRole('button', { name: 'Retry wallet' }));
  await screen.findByRole('button', { name: 'Wallet ready' });
  expect(screen.getByLabelText('Public search')).toBe(search);
  expect(search).toHaveValue('Keep search');
});
