import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * The buy mutation's WALLET_NOT_LINKED retry (src/hooks/useOnchainPass.ts).
 *
 * The backend binds a crypto quote to a wallet LINKED to the account, so an
 * unlinked wallet answers 403 WALLET_NOT_LINKED. The hook must then perform a
 * BLOCKING link — sign an ownership proof with the wallet client, POST it to
 * /web3auth/link — and retry the quote exactly once. Any other quote error
 * rethrows without ever touching the link endpoint.
 *
 * Tested at the module boundary: wagmi, viem, the ABI constants and the api
 * modules are mocked; the mutation is driven through renderHook under a
 * QueryClientProvider.
 */

const BUYER = '0xAbCdEF0123456789abcdef0123456789ABCDEF01';

// Holder objects so the jest.mock factories (hoisted above imports) can reach
// per-test fakes. Names must start with "mock" for jest's hoisting whitelist.
// CRA jest runs with `resetMocks: true`, which strips implementations given to
// `jest.fn(impl)` before every test — so every implementation is (re)assigned
// in `beforeEach` below, and the factories only hold plain delegating fns.
const mockWalletClient = {
  chain: { id: 8453 },
  signMessage: jest.fn(),
  sendTransaction: jest.fn(),
};
const mockPublicClient = {
  readContract: jest.fn(),
  waitForTransactionReceipt: jest.fn(),
};
const mockSwitchChainAsync = jest.fn();
const mockGetWalletClientAction = jest.fn();
const mockConfirmWithRetry = jest.fn();

jest.mock('wagmi', () => ({
  useAccount: () => ({ address: BUYER }),
  useChainId: () => 8453,
  useConfig: () => ({}),
  useSwitchChain: () => ({ switchChainAsync: mockSwitchChainAsync }),
  useWalletClient: () => ({ data: mockWalletClient }),
}));
jest.mock('wagmi/actions', () => ({
  getWalletClient: (...args: any[]) => (mockGetWalletClientAction as any)(...args),
  getPublicClient: () => mockPublicClient,
}));
jest.mock('wagmi/chains', () => ({
  base: { id: 8453, name: 'Base' },
  baseSepolia: { id: 84532, name: 'Base Sepolia' },
}));
jest.mock('viem', () => ({ encodeFunctionData: jest.fn(() => '0xcalldata') }));
jest.mock('../../abis/unlock', () => ({
  PUBLIC_LOCK_ABI: [],
  ERC20_ABI: [],
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
}));

const mockGetCryptoQuote = jest.fn();
const mockConfirmCryptoPurchase = jest.fn();
jest.mock('../../api/onchainPass', () => ({
  onchainPassApi: {
    getCryptoQuote: (...args: unknown[]) => mockGetCryptoQuote(...args),
    confirmCryptoPurchase: (...args: unknown[]) => mockConfirmCryptoPurchase(...args),
    getPurchaseStatus: jest.fn(),
    getAccess: jest.fn(),
    getAccessList: jest.fn(),
  },
}));

const mockLinkWallet = jest.fn();
jest.mock('../../api/web3authapi', () => ({
  __esModule: true,
  default: { linkWallet: (...args: unknown[]) => mockLinkWallet(...(args as [])) },
}));

const mockCreateWalletAuthPayload = jest.fn();
const mockSetLinkedWalletHint = jest.fn();
jest.mock('../../utils/walletAuth', () => ({
  createWalletAuthPayload: (...args: any[]) => (mockCreateWalletAuthPayload as any)(...args),
  isWalletAlreadyLinked: () => false,
  setLinkedWalletHint: (...args: any[]) => (mockSetLinkedWalletHint as any)(...args),
}));

jest.mock('../../utils/metrics', () => ({ trackOnchainEvent: () => undefined }));
jest.mock('../../utils/cryptoConfirmRetry', () => ({
  confirmWithRetry: (...args: any[]) => (mockConfirmWithRetry as any)(...args),
  CryptoConfirmHardConflictError: class CryptoConfirmHardConflictError extends Error {},
}));

// eslint-disable-next-line import/first
import { useCryptoDirectBuy } from '../useOnchainPass';

const PASS_ID = 'pass-1';

function quote(overrides: Record<string, unknown> = {}) {
  return {
    purchase_id: 'purchase-1',
    reservation_id: 'reservation-1',
    expires_at: '2026-09-02T12:00:00.000Z',
    buyer: BUYER,
    lock_address: '0x1111111111111111111111111111111111111111',
    payment_token: '0x2222222222222222222222222222222222222222',
    key_price: '1000000',
    quantity: 1,
    chain_id: 8453,
    ...overrides,
  };
}

function walletNotLinkedError() {
  const error = new Error('Wallet not linked') as Error & { response: unknown };
  error.response = { data: { error: { code: 'WALLET_NOT_LINKED' } } };
  return error;
}

function renderBuy() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useCryptoDirectBuy(PASS_ID), { wrapper });
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockWalletClient.signMessage.mockResolvedValue('0xsignature');
  mockWalletClient.sendTransaction.mockResolvedValue('0xtxhash');
  // Allowance already covers the price: the approve branch stays cold.
  // (BigInt() call, not a literal — the app tsconfig targets pre-ES2020.)
  mockPublicClient.readContract.mockResolvedValue(BigInt('1000000000000000000000000'));
  mockPublicClient.waitForTransactionReceipt.mockResolvedValue({});
  mockSwitchChainAsync.mockResolvedValue(undefined);
  mockGetWalletClientAction.mockResolvedValue(mockWalletClient);
  mockConfirmWithRetry.mockImplementation((fn: () => Promise<unknown>) => fn());
  mockLinkWallet.mockResolvedValue({ success: true });
  // The real createWalletAuthPayload fetches a nonce over the network; the mock
  // keeps its shape — it SIGNS via the provided callback (the wallet client)
  // and returns the normalized payload.
  mockCreateWalletAuthPayload.mockImplementation(
    async (walletAddress: string, signMessage: (message: string) => Promise<string>) => ({
      walletAddress: walletAddress.toLowerCase(),
      signature: await signMessage('link-proof-message'),
    }),
  );
  mockConfirmCryptoPurchase.mockResolvedValue({
    success: true,
    data: { status: 'completed' },
  });
});

describe('useCryptoDirectBuy wallet-link retry', () => {
  it('links the wallet with a signature and retries the quote once on WALLET_NOT_LINKED', async () => {
    mockGetCryptoQuote
      .mockRejectedValueOnce(walletNotLinkedError())
      .mockResolvedValueOnce(quote());

    const { result } = renderBuy();

    let outcome: { hash: string; purchaseId?: string } | undefined;
    await act(async () => {
      outcome = await result.current.mutateAsync({ quantity: 1 });
    });

    // The link is BLOCKING and signature-backed: proof built from the wallet
    // client's signMessage, then POSTed, then — and only then — the retry.
    expect(mockCreateWalletAuthPayload).toHaveBeenCalledTimes(1);
    expect(mockCreateWalletAuthPayload).toHaveBeenCalledWith(BUYER, expect.any(Function));
    expect(mockWalletClient.signMessage).toHaveBeenCalledWith({
      account: BUYER,
      message: 'link-proof-message',
    });
    expect(mockLinkWallet).toHaveBeenCalledTimes(1);
    expect(mockLinkWallet).toHaveBeenCalledWith(BUYER.toLowerCase(), '0xsignature');
    expect(mockSetLinkedWalletHint).toHaveBeenCalledWith(BUYER.toLowerCase());

    // Quote asked twice: the refused attempt and the single retry.
    expect(mockGetCryptoQuote).toHaveBeenCalledTimes(2);
    // The invocation order is link-then-retry, not retry-then-link.
    expect(mockLinkWallet.mock.invocationCallOrder[0]).toBeLessThan(
      mockGetCryptoQuote.mock.invocationCallOrder[1],
    );

    // With the link in place the buy went through to completion.
    expect(outcome).toMatchObject({ hash: '0xtxhash', purchaseId: 'purchase-1' });
    await waitFor(() => expect(result.current.phase).toBe('completed'));
  });

  it('retries exactly once: a second WALLET_NOT_LINKED surfaces instead of looping', async () => {
    mockGetCryptoQuote.mockRejectedValue(walletNotLinkedError());

    const { result } = renderBuy();

    await act(async () => {
      await expect(result.current.mutateAsync({ quantity: 1 })).rejects.toBeTruthy();
    });

    // One link attempt, two quote attempts, no third round.
    expect(mockLinkWallet).toHaveBeenCalledTimes(1);
    expect(mockGetCryptoQuote).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(result.current.phase).toBe('failed'));
  });

  it('rethrows any other quote error without linking', async () => {
    const error = new Error('Pass not found') as Error & { response: unknown };
    error.response = { data: { error: { code: 'PASS_NOT_FOUND' } } };
    mockGetCryptoQuote.mockRejectedValue(error);

    const { result } = renderBuy();

    await act(async () => {
      await expect(result.current.mutateAsync({ quantity: 1 })).rejects.toBeTruthy();
    });

    expect(mockGetCryptoQuote).toHaveBeenCalledTimes(1);
    expect(mockCreateWalletAuthPayload).not.toHaveBeenCalled();
    expect(mockLinkWallet).not.toHaveBeenCalled();
    expect(mockWalletClient.signMessage).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.phase).toBe('failed'));
  });

  it('rethrows a code-less error (plain network failure) without linking', async () => {
    mockGetCryptoQuote.mockRejectedValue(new Error('Network Error'));

    const { result } = renderBuy();

    await act(async () => {
      await expect(result.current.mutateAsync({ quantity: 1 })).rejects.toBeTruthy();
    });

    expect(mockGetCryptoQuote).toHaveBeenCalledTimes(1);
    expect(mockLinkWallet).not.toHaveBeenCalled();
  });
});
