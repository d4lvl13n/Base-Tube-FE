import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { onchainPassApi } from '../api/onchainPass';
import { queryKeys } from '../utils/queryKeys';
import type {
  OnchainPurchaseStatusResponse,
  OnchainAccessResponse,
  OnchainAccessListResponse,
  OnchainClaimRequest,
  OnchainClaimResponse,
  OnchainPurchaseStatus,
  CryptoPurchaseResponse,
  CryptoPurchaseRequest,
  PendingPurchasesResponse,
  MintPendingResponse,
  MintPendingRequest,
} from '../types/onchainPass';
import type { CryptoQuote } from '../types/onchainPass';
import { trackOnchainEvent } from '../utils/metrics';
import { useAccount, useChainId, useConfig, useSwitchChain, useWalletClient } from 'wagmi';
import { encodeFunctionData } from 'viem';
import { contractsApi } from '../api/contracts';
import type { ContractAbiResponse } from '../types/contracts';
import type { Chain } from 'wagmi/chains';
import { base, baseSepolia } from 'wagmi/chains';
import { getWalletClient } from 'wagmi/actions';

export const usePurchaseStatus = (
  sessionId?: string | null,
  options: { enabled?: boolean; intervalMs?: number } = {}
) => {
  const { enabled = true, intervalMs = 5000 } = options;

  return useQuery<OnchainPurchaseStatusResponse>({
    queryKey: queryKeys.onchainPass.purchaseStatus(sessionId || ''),
    queryFn: () => {
      if (!sessionId) throw new Error('sessionId is required');
      trackOnchainEvent('onchain.purchase.poll.start', { sessionId });
      return onchainPassApi.getPurchaseStatusBySession(sessionId);
    },
    enabled: enabled && Boolean(sessionId),
    refetchInterval: (query) => {
      const data = query.state.data?.data as any;
      const current = data?.status as OnchainPurchaseStatus | undefined;
      if (!current) return intervalMs;
      // Stop polling on terminal states or when pass id is resolved
      if (
        ['minted', 'claimed', 'completed', 'failed', 'refunded', 'disputed'].includes(current) ||
        Boolean(data?.passId || data?.pass_id)
      ) {
        trackOnchainEvent('onchain.purchase.poll.stop', { sessionId, status: current, passId: data?.passId || data?.pass_id });
        return false;
      }
      return intervalMs;
    },
    refetchIntervalInBackground: true,
    staleTime: 0,
  });
};

export const useAccess = (
  passId?: string | null,
  options: { enabled?: boolean; staleTimeMs?: number } = {}
) => {
  const { enabled = true, staleTimeMs = 60_000 } = options;

  return useQuery<OnchainAccessResponse>({
    queryKey: queryKeys.onchainPass.access(passId || ''),
    queryFn: () => {
      if (!passId) throw new Error('passId is required');
      trackOnchainEvent('onchain.access.check', { passId });
      return onchainPassApi.getAccess(passId);
    },
    enabled: enabled && Boolean(passId),
    staleTime: staleTimeMs,
  });
};

export const useAccessList = (options: { enabled?: boolean; staleTimeMs?: number } = {}) => {
  const { enabled = true, staleTimeMs = 60_000 } = options;

  return useQuery<OnchainAccessListResponse>({
    queryKey: queryKeys.onchainPass.accessList(),
    queryFn: () => {
      trackOnchainEvent('onchain.access.list');
      return onchainPassApi.getAccessList();
    },
    enabled,
    staleTime: staleTimeMs,
  });
};

export const useClaim = () => {
  const queryClient = useQueryClient();

  return useMutation<OnchainClaimResponse, Error, OnchainClaimRequest>({
    mutationFn: (payload) => {
      trackOnchainEvent('onchain.claim.submit', { purchaseId: payload.purchaseId });
      return onchainPassApi.claim(payload);
    },
    onSuccess: (_data, variables) => {
      trackOnchainEvent('onchain.claim.success', { purchaseId: variables.purchaseId });
      // Invalidate purchase status to reflect claiming
      queryClient.invalidateQueries({ queryKey: queryKeys.onchainPass.purchaseStatus(variables.purchaseId) });
      // Access list may change after claim
      queryClient.invalidateQueries({ queryKey: queryKeys.onchainPass.accessList() });
    }
  });
};


/**
 * Optional crypto quote retrieval. Some backends expose a quote step for signing.
 */
export const useCryptoQuote = (
  params?: { passId?: string | null; buyer?: string; quantity?: number; validSeconds?: number },
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;
  const { passId, buyer, quantity, validSeconds } = params || {};
  return useQuery<CryptoQuote>({
    queryKey: queryKeys.onchainPass.cryptoQuote(passId || ''),
    queryFn: () => {
      if (!passId || !buyer || !quantity) throw new Error('quote params missing');
      return onchainPassApi.getCryptoQuote(passId, { buyer, quantity, validSeconds });
    },
    enabled: enabled && Boolean(passId && buyer && quantity),
    staleTime: 30_000,
  });
};

/**
 * Buy with crypto via backend relayer. Mirrors Stripe flow: on success, begin polling purchase status.
 */
export const useCryptoCheckout = (passId?: string | null) => {
  const { address } = useAccount();
  const chainId = useChainId();
  const client = useQueryClient();
  // Preload ABI so consumers can switch to direct-contract path as needed
  useQuery<ContractAbiResponse>({
    queryKey: ['contracts', 'content-ledger', 'abi'],
    queryFn: () => contractsApi.getContentLedgerAbi(),
    staleTime: 5 * 60_000,
  });

  return useMutation<CryptoPurchaseResponse, Error, Partial<CryptoPurchaseRequest>>({
    mutationFn: async (overrides = {}) => {
      if (!passId) throw new Error('passId is required');
      if (!address) throw new Error('Wallet not connected');
      const payload: CryptoPurchaseRequest = {
        address,
        ...overrides,
      };
      trackOnchainEvent('onchain.crypto.purchase.start', { passId, address, chainId });
      const resp = await onchainPassApi.buyWithCrypto(passId, payload);
      trackOnchainEvent('onchain.crypto.purchase.accepted', { passId, address, chainId, purchaseId: resp?.data?.purchaseId || (resp?.data as any)?.purchase_id });
      return resp;
    },
    onSuccess: () => {
      client.invalidateQueries();
    },
  });
};

/**
 * Direct on-chain purchase using fetched ABI + wallet signer.
 */
export const useCryptoDirectBuy = (passId?: string | null) => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const wagmiConfig = useConfig();
  const client = useQueryClient();
  // Using walletClient.sendTransaction to align with SignInWeb3 working path
  const { data: walletClient } = useWalletClient();

  const abiQuery = useQuery<ContractAbiResponse>({
    queryKey: ['contracts', 'content-ledger', 'abi'],
    queryFn: () => contractsApi.getContentLedgerAbi(),
    staleTime: 5 * 60_000,
  });

  return useMutation<
    { hash: `0x${string}`; explorerUrl?: string },
    Error,
    { quantity: number; validSeconds?: number }
  >({
    mutationFn: async ({ quantity, validSeconds }) => {
      if (!passId) throw new Error('passId is required');
      if (!address) throw new Error('Wallet not connected');
      const abiResp = abiQuery.data || (await contractsApi.getContentLedgerAbi());
      try { console.log('[CryptoPay] ABI loaded', { address: abiResp.address, chainIdServer: abiResp.chainId, chainIdClient: chainId, hasFn: Array.isArray((abiResp as any).abi) && (abiResp as any).abi.some((f: any) => f?.name === 'buyPassWithQuote') }); } catch {}
      const desiredChainId = Number(abiResp.chainId ?? chainId);
      if (!Number.isInteger(desiredChainId)) {
        throw new Error('Unsupported contract chain');
      }
      const targetChain = CHAIN_BY_ID[desiredChainId];
      if (!targetChain) {
        throw new Error(`Unsupported chain id ${desiredChainId}`);
      }
      if (abiResp.chainId && chainId !== desiredChainId) {
        try { console.log('[CryptoPay] switching chain', { from: chainId, to: abiResp.chainId }); } catch {}
        await switchChainAsync({ chainId: desiredChainId as any });
      }
      // Request signed quote from backend
      try { console.log('[CryptoPay] requesting quote (direct)', { passId, buyer: address, quantity }); } catch {}
      const quote = await onchainPassApi.getCryptoQuote(passId, { buyer: address, quantity, validSeconds });
      const refreshedWalletClient = await getWalletClient(wagmiConfig, { chainId: desiredChainId }).catch(() => undefined);
      const activeWalletClient = refreshedWalletClient ?? walletClient;
      if (!activeWalletClient) throw new Error('Wallet client unavailable');
      if ((activeWalletClient as any)?.chain?.id !== desiredChainId) {
        throw new Error(`Wallet client on unexpected chain ${(activeWalletClient as any)?.chain?.id}; expected ${desiredChainId}`);
      }
      try { console.log('[CryptoPay] quote ok (direct)', { minPriceWei: quote.minPriceWei, passId: quote.passId, validUntil: quote.validUntil }); } catch {}
      // Validate and normalize args
      const isHex = (v: string) => /^0x[0-9a-fA-F]*$/.test(v);
      const normalizeBytes32 = (v: string): `0x${string}` => {
        const hex = (v || '').toLowerCase();
        const raw = hex.startsWith('0x') ? hex.slice(2) : hex;
        const padded = raw.padStart(64, '0');
        return (`0x${padded}`) as `0x${string}`;
      };
      const normalizedNonce = normalizeBytes32(quote.nonce);
      if (!isHex(normalizedNonce) || normalizedNonce.length !== 66) {
        throw new Error('Invalid nonce (bytes32)');
      }
      if (!isHex(quote.signature) || quote.signature.length !== 132) {
        throw new Error('Invalid signature (65-byte)');
      }
      const passIdBN = BigInt(quote.passId);
      const quantityBN = BigInt(quote.quantity);
      const minPriceBN = BigInt(quote.minPriceWei);
      const validUntilBN = BigInt(quote.validUntil);
      try { console.log('[CryptoPay] normalized args', { passIdBN: passIdBN.toString(), quantityBN: quantityBN.toString(), minPriceBN: minPriceBN.toString(), validUntilBN: validUntilBN.toString(), nonceLen: normalizedNonce.length, sigLen: quote.signature.length }); } catch {}
      // Use the same approach as SignInWeb3 stack: encode data and sendTransaction via wallet client
      const data = encodeFunctionData({
        abi: abiResp.abi as any,
        functionName: 'buyPassWithQuote',
        args: [
          quote.buyer as `0x${string}`,
          passIdBN,
          quantityBN,
          minPriceBN,
          validUntilBN,
          normalizedNonce,
          quote.signature as `0x${string}`,
        ],
      });
      try { console.log('[CryptoPay] sendTransaction', { to: abiResp.address, value: minPriceBN.toString(), dataLen: data.length, chainId: desiredChainId }); } catch {}
      const hash = await activeWalletClient.sendTransaction({
        account: address as `0x${string}`,
        to: abiResp.address as `0x${string}`,
        value: minPriceBN,
        data,
        chain: targetChain,
      });
      try { console.log('[CryptoPay] tx submitted', { hash }); } catch {}
      const explorerUrl = getExplorerTxUrl(desiredChainId, hash as string);
      return { hash: hash as `0x${string}`, explorerUrl };
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.onchainPass.accessList() });
    },
  });
};

function getExplorerTxUrl(chainId: number | string, hash: string): string | undefined {
  const id = Number(chainId);
  if (id === 8453) return `https://basescan.org/tx/${hash}`;
  if (id === 84532) return `https://sepolia.basescan.org/tx/${hash}`;
  return undefined;
}

const CHAIN_BY_ID: Record<number, Chain> = {
  [base.id]: base,
  [baseSepolia.id]: baseSepolia,
};

// ============================================================================
// PENDING PURCHASES HOOKS
// ============================================================================

/**
 * Fetch pending purchases awaiting wallet connection for minting
 * These are Stripe purchases that have been paid but not yet minted to a wallet
 */
export const usePendingPurchases = (options: { enabled?: boolean } = {}) => {
  const { enabled = true } = options;

  return useQuery<PendingPurchasesResponse>({
    queryKey: queryKeys.onchainPass.pendingPurchases(),
    queryFn: () => {
      trackOnchainEvent('onchain.pending.fetch');
      return onchainPassApi.getPendingPurchases();
    },
    enabled,
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
};

/**
 * Mint all pending purchases to the connected wallet
 * Invalidates related queries on success
 */
export const useMintPending = () => {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation<MintPendingResponse, Error, MintPendingRequest | void>({
    mutationFn: (payload) => {
      const walletAddress = (payload as MintPendingRequest)?.walletAddress || address;
      if (!walletAddress) throw new Error('Wallet not connected');

      trackOnchainEvent('onchain.mint.pending.start', { walletAddress });
      return onchainPassApi.mintPendingPurchases({ walletAddress });
    },
    onSuccess: (data) => {
      const summary = data?.data?.summary;
      trackOnchainEvent('onchain.mint.pending.complete', {
        total: summary?.total,
        successful: summary?.successful,
        failed: summary?.failed
      });

      // Invalidate pending purchases query
      queryClient.invalidateQueries({ queryKey: queryKeys.onchainPass.pendingPurchases() });
      // Invalidate access list as user now has new passes
      queryClient.invalidateQueries({ queryKey: queryKeys.onchainPass.accessList() });
      // Invalidate purchased passes
      queryClient.invalidateQueries({ queryKey: ['purchased-passes'] });
    },
    onError: (error) => {
      trackOnchainEvent('onchain.mint.pending.error', { error: error.message });
    }
  });
};

