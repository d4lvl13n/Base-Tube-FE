import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ConnectWalletButton from '../ConnectWalletButtonRuntime';

const mockConnect = jest.fn();
const mockOpenChooser = jest.fn();
let mockStatus = 'disconnected';
let mockDisplay: string | undefined = 'modal';
let mockMountWallet: () => void;
let mockEnableButton: () => void;
jest.mock('../../../../contexts/AuthContext', () => ({ useAuth: () => ({ connect: mockConnect, isAuthenticated: false, step: 'IDLE' }) }));
jest.mock('wagmi', () => ({ useAccount: () => ({ status: mockStatus }) }));
jest.mock('@coinbase/onchainkit', () => ({ useOnchainKit: () => ({ config: { wallet: { display: mockDisplay } } }) }));
jest.mock('../WalletWrapper', () => ({
  __esModule: true,
  default: function WalletWrapper() {
    const React = jest.requireActual<typeof import('react')>('react');
    const [mounted, setMounted] = React.useState(false);
    const [enabled, setEnabled] = React.useState(false);
    const [open, setOpen] = React.useState(false);
    // OnchainKit Wallet does not expose its controls on the parent's first effect.
    mockMountWallet = () => setMounted(true);
    mockEnableButton = () => setEnabled(true);
    return mounted ? <>
      <button disabled={!enabled} onClick={() => { mockOpenChooser(); setOpen(true); }}>Connect Wallet</button>
      {open && <div role="dialog" aria-label="Choose wallet"><button onClick={() => setOpen(false)}>Close chooser</button></div>}
    </> : null;
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockStatus = 'disconnected';
  mockDisplay = 'modal';
  (window.matchMedia as jest.Mock).mockImplementation(query => ({
    matches: false, media: query, addListener: jest.fn(), removeListener: jest.fn(),
    addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn(),
  }));
});

it('retains the first-click intent until the wallet control mounts and becomes enabled, then opens once', async () => {
  const view = render(<ConnectWalletButton openOnMount />);
  expect(mockOpenChooser).not.toHaveBeenCalled();
  act(() => mockMountWallet());
  expect(screen.getByRole('button', { name: 'Connect Wallet' })).toBeDisabled();
  expect(mockOpenChooser).not.toHaveBeenCalled();
  act(() => mockEnableButton());
  await screen.findByRole('dialog', { name: 'Choose wallet' });
  expect(mockOpenChooser).toHaveBeenCalledTimes(1);
  expect(mockConnect).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Close chooser' }));
  view.rerender(<ConnectWalletButton openOnMount customText="Connect again" />);
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(mockOpenChooser).toHaveBeenCalledTimes(1);
});

it('waits for reconnection and modal configuration before replaying the chooser intent', async () => {
  mockStatus = 'reconnecting';
  mockDisplay = undefined;
  const view = render(<ConnectWalletButton openOnMount />);
  act(() => { mockMountWallet(); mockEnableButton(); });
  expect(mockOpenChooser).not.toHaveBeenCalled();
  mockStatus = 'disconnected';
  view.rerender(<ConnectWalletButton openOnMount />);
  expect(mockOpenChooser).not.toHaveBeenCalled();
  mockDisplay = 'modal';
  view.rerender(<ConnectWalletButton openOnMount />);
  await screen.findByRole('dialog', { name: 'Choose wallet' });
  expect(mockOpenChooser).toHaveBeenCalledTimes(1);
  expect(mockConnect).not.toHaveBeenCalled();
});

it('never opens the chooser without an explicit first-click intent', () => {
  render(<ConnectWalletButton />);
  act(() => { mockMountWallet(); mockEnableButton(); });
  expect(mockOpenChooser).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(mockConnect).not.toHaveBeenCalled();
});
