import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth, type AuthContextType } from '../AuthContext';
import { AuthCacheBoundary, AuthQueryProvider } from '../AuthQueryContext';
import ProtectedRoute from '../../components/pages/ProtectedRoute';
import { AuthenticationStep } from '../../types/auth';

let mockClerk = { isLoaded: false, isSignedIn: false, userId: null, sessionId: null };
let mockWalletRenders = 0;
let mockPublish: ((value: AuthContextType) => void) | null = null;
let mounts = 0;
jest.mock('@clerk/clerk-react', () => ({
  useAuth: () => mockClerk,
  useUser: () => mockClerk,
}));
jest.mock('../wallet/WalletAuthRuntime', () => ({
  __esModule: true,
  default: ({ onChange }: { onChange: (value: AuthContextType) => void }) => {
    mockWalletRenders += 1;
    mockPublish = onChange;
    return null;
  },
}));

function Page() {
  const auth = useAuth();
  React.useEffect(() => { mounts += 1; }, []);
  return <><input aria-label="Draft" defaultValue="My draft" /><button onClick={auth.enableWallet}>Wallet</button></>;
}
function App({ privatePage = false }: { privatePage?: boolean }) {
  return <MemoryRouter initialEntries={['/']}><AuthQueryProvider><AuthProvider><AuthCacheBoundary>
    <Routes><Route path="/" element={privatePage ? <ProtectedRoute><Page /></ProtectedRoute> : <Page />} />
      <Route path="/sign-in-web3" element={<p>Wallet sign-in</p>} /><Route path="/sign-in" element={<p>Email sign-in</p>} /></Routes>
  </AuthCacheBoundary></AuthProvider></AuthQueryProvider></MemoryRouter>;
}
function walletState(): AuthContextType {
  return { step: AuthenticationStep.IDLE, error: null, user: null, isAuthenticated: false,
    isRestoring: false, isConnected: false, address: undefined, setUser: jest.fn(),
    connect: jest.fn(), disconnect: jest.fn(), enableWallet: jest.fn() };
}
beforeEach(() => {
  localStorage.clear();
  mockClerk = { isLoaded: false, isSignedIn: false, userId: null, sessionId: null };
  mockWalletRenders = 0;
  mockPublish = null;
  mounts = 0;
});

it('renders public content while Clerk is pending without starting wallets', () => {
  render(<App />);
  expect(screen.getByLabelText('Draft')).toHaveValue('My draft');
  expect(mockWalletRenders).toBe(0);
});

it('keeps private pages pending instead of redirecting before Clerk resolves', () => {
  render(<App privatePage />);
  expect(screen.queryByLabelText('Draft')).toBeNull();
  expect(screen.queryByText('Email sign-in')).toBeNull();
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});

it('activating wallet support preserves the mounted page and its local state', async () => {
  mockClerk.isLoaded = true;
  render(<App />);
  const original = screen.getByLabelText('Draft');
  fireEvent.change(original, { target: { value: 'Keep this draft' } });
  fireEvent.click(screen.getByRole('button', { name: 'Wallet' }));
  await waitFor(() => expect(mockPublish).not.toBeNull());
  act(() => { mockPublish!(walletState()); });
  expect(screen.getByLabelText('Draft')).toBe(original);
  expect(original).toHaveValue('Keep this draft');
  expect(mounts).toBe(1);
});

it('waits for a stored wallet session and does not redirect during lazy restoration', async () => {
  localStorage.setItem('auth_method', 'web3');
  localStorage.setItem('auth_user', JSON.stringify({ id: 'wallet-A' }));
  render(<App privatePage />);
  expect(screen.queryByText('Wallet sign-in')).toBeNull();
  expect(screen.queryByLabelText('Draft')).toBeNull();
  await waitFor(() => expect(mockPublish).not.toBeNull());
  act(() => { mockPublish!({ ...walletState(), isAuthenticated: true, user: { id: 'wallet-A' } as any }); });
  expect(await screen.findByLabelText('Draft')).toBeInTheDocument();
});

it('keeps the public page and its draft when pending Clerk resolves signed out', () => {
  const view = render(<App />);
  const original = screen.getByLabelText('Draft');
  fireEvent.change(original, { target: { value: 'Keep pending draft' } });
  mockClerk.isLoaded = true;
  view.rerender(<App />);
  expect(screen.getByLabelText('Draft')).toBe(original);
  expect(original).toHaveValue('Keep pending draft');
  expect(mounts).toBe(1);
});
