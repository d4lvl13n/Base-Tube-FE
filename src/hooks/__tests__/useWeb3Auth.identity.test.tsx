import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useWeb3Auth } from '../useWeb3Auth';
import web3AuthApi from '../../api/web3authapi';
import { createWalletAuthPayload } from '../../utils/walletAuth';

const mockSwitch = jest.fn();
const mockDisconnect = jest.fn();
const mockSign = jest.fn();
jest.mock('wagmi', () => ({
  useAccount: () => ({ address: '0x1111111111111111111111111111111111111111', isConnected: true }),
  useChainId: () => 84532,
  useSwitchChain: () => ({ switchChain: mockSwitch }),
  useDisconnect: () => ({ disconnect: mockDisconnect }),
  useSignMessage: () => ({ signMessageAsync: mockSign }),
}));
jest.mock('wagmi/chains', () => ({ baseSepolia: { id: 84532 } }));
jest.mock('../../api/web3authapi', () => ({ __esModule: true, default: { login: jest.fn(), signup: jest.fn(), logout: jest.fn() } }));
jest.mock('../../utils/walletAuth', () => ({ createWalletAuthPayload: jest.fn() }));

function Probe({ pending = false, signedIn = false }: { pending?: boolean; signedIn?: boolean }) {
  const auth = useWeb3Auth({ isClerkPending: pending, isClerkAuthenticated: signedIn });
  return <output>{auth.isRestoring ? 'restoring' : auth.isAuthenticated ? 'wallet restored' : 'no wallet session'}</output>;
}
const app = (props: { pending?: boolean; signedIn?: boolean } = {}) => <MemoryRouter><Probe {...props} /></MemoryRouter>;

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  (window as any).__web3AttemptRef = { current: false };
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  (createWalletAuthPayload as jest.Mock).mockResolvedValue({ walletAddress: '0x1111111111111111111111111111111111111111', signature: '0xsig' });
  (web3AuthApi.login as jest.Mock).mockResolvedValue({ user: { id: 'wallet-A', onboarding_status: 'COMPLETED' } });
});
afterEach(() => jest.restoreAllMocks());

it('never starts wallet login before pending Clerk resolves to an existing Clerk account', async () => {
  const view = render(app({ pending: true }));
  expect(createWalletAuthPayload).not.toHaveBeenCalled();
  view.rerender(app({ signedIn: true }));
  expect(createWalletAuthPayload).not.toHaveBeenCalled();
  expect(web3AuthApi.login).not.toHaveBeenCalled();
});

it('restores the stored wallet while Clerk is pending without signing it in again', async () => {
  localStorage.setItem('auth_method', 'web3');
  localStorage.setItem('auth_user', JSON.stringify({ id: 'wallet-A' }));
  const view = render(app({ pending: true }));
  await screen.findByText('wallet restored');
  expect(createWalletAuthPayload).not.toHaveBeenCalled();
  view.rerender(app());
  expect(web3AuthApi.login).not.toHaveBeenCalled();
});

it.each(['link', 'transaction'])('preserves %s intent during pending Clerk and skips automatic login afterwards', intent => {
  sessionStorage.setItem('wallet_connect_intent', intent);
  const view = render(app({ pending: true }));
  expect(sessionStorage.getItem('wallet_connect_intent')).toBe(intent);
  expect(createWalletAuthPayload).not.toHaveBeenCalled();
  view.rerender(app());
  expect(web3AuthApi.login).not.toHaveBeenCalled();
});

it('still automatically signs in a connected wallet once Clerk resolves signed out', async () => {
  const view = render(app({ pending: true }));
  expect(createWalletAuthPayload).not.toHaveBeenCalled();
  view.rerender(app());
  await waitFor(() => expect(web3AuthApi.login).toHaveBeenCalledTimes(1));
  await screen.findByText('wallet restored');
});
