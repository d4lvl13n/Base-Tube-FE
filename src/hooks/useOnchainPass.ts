import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { onchainPassApi } from '../api/onchainPass';
import { queryKeys } from '../utils/queryKeys';
import type {
  OnchainPurchaseStatusResponse,
  OnchainAccessResponse,
  OnchainAccessListResponse,
  OnchainClaimRequest,
  OnchainClaimResponse,
  OnchainPurchaseStatus,
  CryptoPurchasePhase,
  PendingPurchasesResponse,
  MintPendingResponse,
  MintPendingRequest,
} from '../types/onchainPass';
import type { CryptoQuote } from '../types/onchainPass';
import {
  confirmWithRetry,
  CryptoConfirmHardConflictError,
} from '../utils/cryptoConfirmRetry';
import {
  clearCryptoCheckoutContext,
  persistCryptoCheckoutContext,
  readCryptoCheckoutContext,
  updateCryptoCheckoutPhase,
} from '../utils/checkoutStorage';
import { getPassErrorMessage } from '../utils/passErrorMessages';
import { trackOnchainEvent } from '../utils/metrics';
import { useAccount, useChainId, useConfig, useSwitchChain, useWalletClient } from 'wagmi';
import { encodeFunctionData } from 'viem';
import { PUBLIC_LOCK_ABI, ERC20_ABI, ZERO_ADDRESS } from '../abis/unlock';
import type { Chain } from 'wagmi/chains';
import { base, baseSepolia } from 'wagmi/chains';
import { getPublicClient, getWalletClient } from 'wagmi/actions';
import web3AuthApi from '../api/web3authapi';
import {
  createWalletAuthPayload,
  isWalletAlreadyLinked,
  setLinkedWalletHint,
} from '../utils/walletAuth';
import {
  getExplorerTxUrl,
  hasPurchaseEntitlement,
  isPurchaseTerminal,
} from '../utils/purchaseStatus';

export const usePurchaseStatus = (
  purchaseId?: string | null,
  options: { enabled?: boolean; intervalMs?: number } = {}
) => {
  const { enabled = true, intervalMs = 5000 } = options;

  return useQuery<OnchainPurchaseStatusResponse>({
    queryKey: queryKeys.onchainPass.purchaseStatus(purchaseId || ''),
    queryFn: () => {
      if (!purchaseId) throw new Error('purchaseId is required');
      trackOnchainEvent('onchain.purchase.poll.start', { purchaseId });
      return onchainPassApi.getPurchaseStatus(purchaseId);
    },
    enabled: enabled && Boolean(purchaseId),
    refetchInterval: (query) => {
      const data = query.state.data?.data as any;
      const current = data?.status as OnchainPurchaseStatus | undefined;
      if (!current) return intervalMs;
      if (isPurchaseTerminal(current)) {
        trackOnchainEvent('onchain.purchase.poll.stop', { purchaseId, status: current, passId: data?.passId || data?.pass_id });
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
      trackOnchainEvent('onchain.claim.submit', { purchaseId: payload.purchaseId, walletAddress: payload.walletAddress });
      return onchainPassApi.claim(payload);
    },
    onSuccess: (data, variables) => {
      trackOnchainEvent('onchain.claim.success', {
        purchaseId: variables.purchaseId,
        status: data?.data?.status,
        txHash: data?.data?.txHash,
      });
      // Invalidate purchase status to reflect claiming
      queryClient.invalidateQueries({ queryKey: queryKeys.onchainPass.purchaseStatus(variables.purchaseId) });
      // Access list may change after claim
      queryClient.invalidateQueries({ queryKey: queryKeys.onchainPass.accessList() });
      if (data?.data?.passId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.onchainPass.access(data.data.passId) });
        queryClient.invalidateQueries({ queryKey: ['pass', data.data.passId] });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.onchainPass.pendingPurchases() });
      queryClient.invalidateQueries({ queryKey: ['purchased-passes'] });
    }
  });
};


/**
 * Optional crypto quote retrieval. Some backends expose a quote step for signing.
 */
export const useCryptoQuote = (
  params?: { passId?: string | null; buyer?: string },
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;
  const { passId, buyer } = params || {};
  return useQuery<CryptoQuote>({
    queryKey: queryKeys.onchainPass.cryptoQuote(passId || ''),
    queryFn: () => {
      if (!passId || !buyer) throw new Error('quote params missing');
      return onchainPassApi.getCryptoQuote(passId, { buyer });
    },
    enabled: enabled && Boolean(passId && buyer),
    staleTime: 30_000,
  });
};

/**
 * Direct on-chain purchase using fetched ABI + wallet signer.
 *
 * Flow: reserve quote → await signature → broadcast → wait receipt →
 * POST /crypto/confirm (with transient-409 retries) → fall back to /status
 * polling if confirm can't finalize. Persists in-flight state to localStorage
 * so {@link useCryptoResumeConfirm} can finish the job on refresh/reopen.
 */
export type CryptoDirectBuyResult = UseMutationResult<
  {
    hash: `0x${string}`;
    explorerUrl?: string;
    purchaseId?: string;
    reservationId?: string;
    expiresAt?: string;
    status?: OnchainPurchaseStatus;
  },
  Error,
  {
    quantity: number;
    validSeconds?: number;
    confirmations?: number;
    accessPollTimeoutMs?: number;
    accessPollIntervalMs?: number;
  }
> & {
  phase: CryptoPurchasePhase;
  errorMessage: string | null;
  lastTxHash: `0x${string}` | null;
  lastExplorerUrl: string | null;
  hardConflict: boolean;
  resetPhase: () => void;
  retryPendingConfirmation: () => Promise<boolean>;
  markCompletedFromResume: (detail?: { txHash?: string | null; explorerUrl?: string | null }) => void;
  markConflictFromResume: (message: string, detail?: { txHash?: string | null; explorerUrl?: string | null }) => void;
};

export const useCryptoDirectBuy = (passId?: string | null): CryptoDirectBuyResult => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const wagmiConfig = useConfig();
  const client = useQueryClient();
  // Using walletClient.sendTransaction to align with SignInWeb3 working path
  const { data: walletClient } = useWalletClient();

  // Phase state is exposed alongside the react-query mutation so the UI can
  // render precise copy at every step (wallet prompt → tx pending → confirming).
  const [phase, setPhase] = useState<CryptoPurchasePhase>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hardConflict, setHardConflict] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<`0x${string}` | null>(null);
  const [lastExplorerUrl, setLastExplorerUrl] = useState<string | null>(null);

  const resetPhase = useCallback(() => {
    setPhase('idle');
    setErrorMessage(null);
    setHardConflict(false);
    setLastTxHash(null);
    setLastExplorerUrl(null);
  }, []);

  const markCompletedFromResume = useCallback((detail?: { txHash?: string | null; explorerUrl?: string | null }) => {
    setErrorMessage(null);
    setHardConflict(false);
    setPhase('completed');
    if (detail?.txHash) setLastTxHash(detail.txHash as `0x${string}`);
    if (detail?.explorerUrl) setLastExplorerUrl(detail.explorerUrl);
  }, []);

  const markConflictFromResume = useCallback(
    (message: string, detail?: { txHash?: string | null; explorerUrl?: string | null }) => {
      setErrorMessage(message || 'Purchase already confirmed with a different transaction hash.');
      setHardConflict(true);
      setPhase('failed');
      if (detail?.txHash) setLastTxHash(detail.txHash as `0x${string}`);
      if (detail?.explorerUrl) setLastExplorerUrl(detail.explorerUrl);
    },
    [],
  );

  const retryPendingConfirmation = useCallback(async (): Promise<boolean> => {
    const ctx = readCryptoCheckoutContext();
    if (!ctx || ctx.passId !== passId || !ctx.purchaseId || !ctx.txHash) {
      return false;
    }

    try {
      setErrorMessage(null);
      setHardConflict(false);
      setLastTxHash(ctx.txHash as `0x${string}`);
      setLastExplorerUrl(ctx.explorerUrl || null);
      setPhase('confirming');
      updateCryptoCheckoutPhase('confirming');

      const resp = await confirmWithRetry(
        () => onchainPassApi.confirmCryptoPurchase(ctx.purchaseId, ctx.txHash),
        {
          onAttempt: (n) => {
            trackOnchainEvent('onchain.crypto.confirm.retry.attempt', {
              purchaseId: ctx.purchaseId,
              attempt: n,
              source: 'ui-retry',
            });
          },
        },
      );

      setPhase('completed');
      clearCryptoCheckoutContext();
      client.invalidateQueries({ queryKey: queryKeys.onchainPass.accessList() });
      if (passId) {
        client.invalidateQueries({ queryKey: queryKeys.onchainPass.access(passId) });
        client.invalidateQueries({ queryKey: ['pass', passId] });
      }
      client.invalidateQueries({ queryKey: queryKeys.onchainPass.purchaseStatus(ctx.purchaseId) });
      client.invalidateQueries({ queryKey: ['purchased-passes'] });
      trackOnchainEvent('onchain.crypto.confirm.retry.success', {
        purchaseId: ctx.purchaseId,
        status: resp?.data?.status,
      });
      return true;
    } catch (err) {
      if (err instanceof CryptoConfirmHardConflictError) {
        clearCryptoCheckoutContext();
        setErrorMessage(err.message);
        setHardConflict(true);
        setPhase('failed');
        trackOnchainEvent('onchain.crypto.confirm.retry.hard_conflict', { purchaseId: ctx.purchaseId });
        return false;
      }

      setErrorMessage(err instanceof Error ? err.message : 'Confirm failed. Please try again.');
      setHardConflict(false);
      setPhase('failed');
      trackOnchainEvent('onchain.crypto.confirm.retry.failed', { purchaseId: ctx.purchaseId });
      return false;
    }
  }, [client, passId]);

  const mutation = useMutation<
    {
      hash: `0x${string}`;
      explorerUrl?: string;
      purchaseId?: string;
      reservationId?: string;
      expiresAt?: string;
      status?: OnchainPurchaseStatus;
    },
    Error,
    { quantity: number; validSeconds?: number; confirmations?: number; accessPollTimeoutMs?: number; accessPollIntervalMs?: number }
  >({
    mutationFn: async ({
      // `quantity`/`validSeconds` retained in the type for API compatibility;
      // the Unlock flow buys exactly one key at the Lock's on-chain price.
      confirmations = 1,
      accessPollTimeoutMs = 60_000,
      accessPollIntervalMs = 2500,
    }) => {
      setErrorMessage(null);
      setHardConflict(false);
      setPhase('reserving');
      if (!passId) throw new Error('passId is required');
      if (!address) throw new Error('Wallet not connected');

      // Start the purchase: backend reserves supply + creates a pending purchase
      // and returns the Lock address, USDC token, and per-key price. No signed
      // price quote — the Unlock Lock enforces the price on-chain.
      const quote = await onchainPassApi.getCryptoQuote(passId, { buyer: address });
      if ((quote?.buyer || '').toLowerCase() !== address.toLowerCase()) {
        throw new Error('Checkout buyer does not match connected wallet');
      }
      if (!quote.lock_address) {
        throw new Error('This pass is not available for crypto purchase yet.');
      }

      const desiredChainId = Number(quote.chain_id ?? chainId);
      if (!Number.isInteger(desiredChainId)) {
        throw new Error('Unsupported contract chain');
      }
      const targetChain = CHAIN_BY_ID[desiredChainId];
      if (!targetChain) {
        throw new Error(`Unsupported chain id ${desiredChainId}`);
      }
      if (chainId !== desiredChainId) {
        await switchChainAsync({ chainId: desiredChainId as any });
      }

      const refreshedWalletClient = await getWalletClient(wagmiConfig, { chainId: desiredChainId }).catch(() => undefined);
      const activeWalletClient = refreshedWalletClient ?? walletClient;
      if (!activeWalletClient) throw new Error('Wallet client unavailable');
      if ((activeWalletClient as any)?.chain?.id !== desiredChainId) {
        throw new Error(`Wallet client on unexpected chain ${(activeWalletClient as any)?.chain?.id}; expected ${desiredChainId}`);
      }
      const pubClient = getPublicClient(wagmiConfig, { chainId: targetChain.id });

      const lockAddress = quote.lock_address as `0x${string}`;
      const usdc = quote.payment_token as `0x${string}`;
      const keyPrice = BigInt(quote.key_price);

      // Opportunistic wallet link for Clerk users (access checks key off the linked wallet).
      // Non-blocking: the buy still proceeds even if linking fails.
      try {
        const authMethod = (() => { try { return localStorage.getItem('auth_method'); } catch { return null; } })();
        const hasClerkSession = (() => { try { return Object.keys(localStorage).some((k) => k.startsWith('__clerk')); } catch { return false; } })();
        const isClerkUser = authMethod === 'clerk' || hasClerkSession;
        if (isClerkUser && address && !isWalletAlreadyLinked(address)) {
          const { walletAddress, signature } = await createWalletAuthPayload(
            address,
            (message) => activeWalletClient.signMessage({ account: address as `0x${string}`, message }),
          );
          await web3AuthApi.linkWallet(walletAddress, signature);
          setLinkedWalletHint(walletAddress);
        }
      } catch (e) {
        try { console.warn('[CryptoPay] wallet link attempt failed (non-blocking)', e); } catch {}
      }

      setPhase('awaiting-signature');

      // 1. Ensure the Lock can pull the USDC key price.
      const allowance = (await pubClient.readContract({
        address: usdc,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address as `0x${string}`, lockAddress],
      })) as bigint;
      if (allowance < keyPrice) {
        try { console.log('[CryptoPay] approving USDC', { usdc, lock: lockAddress, keyPrice: keyPrice.toString() }); } catch {}
        const approveData = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [lockAddress, keyPrice],
        });
        const approveHash = await activeWalletClient.sendTransaction({
          account: address as `0x${string}`,
          to: usdc,
          data: approveData,
          chain: targetChain,
        });
        try { await pubClient.waitForTransactionReceipt({ hash: approveHash }); } catch {}
      }

      // 2. Purchase the key (USDC payment → msg.value = 0). Legacy v14 purchase sig.
      try { console.log('[CryptoPay] purchasing key', { lock: lockAddress, keyPrice: keyPrice.toString(), chainId: desiredChainId }); } catch {}
      const data = encodeFunctionData({
        abi: PUBLIC_LOCK_ABI,
        functionName: 'purchase',
        args: [[keyPrice], [address as `0x${string}`], [ZERO_ADDRESS], [ZERO_ADDRESS], ['0x']],
      });
      const hash = await activeWalletClient.sendTransaction({
        account: address as `0x${string}`,
        to: lockAddress,
        data,
        chain: targetChain,
      });
      try { console.log('[CryptoPay] tx submitted', { hash }); } catch {}
      setPhase('tx-pending');
      const explorerUrl = getExplorerTxUrl(hash as string, desiredChainId);
      setLastTxHash(hash as `0x${string}`);
      setLastExplorerUrl(explorerUrl || null);

      // Persist in-flight context so a refresh/reopen can finish via
      // useCryptoResumeConfirm even if this tab/session dies.
      if (quote.purchase_id) {
        persistCryptoCheckoutContext({
          purchaseId: quote.purchase_id,
          passId,
          txHash: hash as string,
          phase: 'tx-pending',
          explorerUrl,
        });
      }

      // UX: wait for confirmations, then POST /crypto/confirm. Fall back to
      // /status polling only if confirm is exhausted/unavailable.
      try {
        const publicClient = getPublicClient(wagmiConfig, { chainId: targetChain.id });
        await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}`, confirmations });
        try { console.log('[CryptoPay] tx confirmed', { hash, confirmations }); } catch {}
      } catch (e) {
        try { console.warn('[CryptoPay] waitForTransactionReceipt failed (continuing to confirm/poll)', e); } catch {}
      }

      let finalStatus: OnchainPurchaseStatus | undefined;

      // Primary path: ask the backend to finalize immediately.
      if (quote.purchase_id) {
        setPhase('confirming');
        updateCryptoCheckoutPhase('confirming');
        try {
          const confirmResp = await confirmWithRetry(
            () => onchainPassApi.confirmCryptoPurchase(quote.purchase_id!, hash as string),
            {
              onAttempt: (n) => {
                try { console.log('[CryptoPay] confirm attempt', { attempt: n, purchaseId: quote.purchase_id }); } catch {}
                trackOnchainEvent('onchain.crypto.confirm.attempt', {
                  purchaseId: quote.purchase_id,
                  attempt: n,
                });
              },
              onGiveUp: (kind, n) => {
                trackOnchainEvent('onchain.crypto.confirm.give_up', {
                  purchaseId: quote.purchase_id,
                  kind,
                  attempt: n,
                });
              },
            },
          );
          finalStatus = confirmResp?.data?.status;
          trackOnchainEvent('onchain.crypto.confirm.success', {
            purchaseId: quote.purchase_id,
            status: finalStatus,
            alreadyConfirmed: confirmResp?.data?.alreadyConfirmed,
          });
          setPhase('completed');
          clearCryptoCheckoutContext();
          return {
            hash: hash as `0x${string}`,
            explorerUrl,
            purchaseId: quote.purchase_id,
            reservationId: quote.reservation_id,
            expiresAt: quote.expires_at,
            status: finalStatus,
          };
        } catch (err) {
          if (err instanceof CryptoConfirmHardConflictError) {
            setErrorMessage(err.message);
            setHardConflict(true);
            setPhase('failed');
            clearCryptoCheckoutContext();
            trackOnchainEvent('onchain.crypto.confirm.hard_conflict', {
              purchaseId: quote.purchase_id,
            });
            throw err;
          }
          // Transient/5xx/network exhausted — fall through to status polling.
          try { console.warn('[CryptoPay] confirm exhausted, falling back to /status polling', err); } catch {}
          setPhase('polling');
          updateCryptoCheckoutPhase('polling');
        }
      }

      // Fallback path: existing reconcile-friendly polling loop.
      const startedAt = Date.now();
      while (Date.now() - startedAt < accessPollTimeoutMs) {
        try {
          if (quote.purchase_id) {
            const statusResp = await onchainPassApi.getPurchaseStatus(quote.purchase_id);
            finalStatus = statusResp?.data?.status;
            if (isPurchaseTerminal(finalStatus) || hasPurchaseEntitlement(finalStatus)) {
              break;
            }
          } else {
            const accessResp = await onchainPassApi.getAccess(passId);
            const hasAccess = Boolean((accessResp as any)?.data?.hasAccess);
            if (hasAccess) {
              break;
            }
          }
        } catch (e) {
          try { console.warn('[CryptoPay] access poll error (will retry)', e); } catch {}
        }
        await new Promise((r) => setTimeout(r, accessPollIntervalMs));
      }

      // If polling observed a terminal/entitled state we can call it done.
      if (isPurchaseTerminal(finalStatus) || hasPurchaseEntitlement(finalStatus)) {
        setPhase('completed');
        clearCryptoCheckoutContext();
      } else {
        setPhase('failed');
        setErrorMessage('We could not confirm your purchase yet. Use Try again to resume confirmation.');
        trackOnchainEvent('onchain.crypto.polling.timeout', {
          purchaseId: quote.purchase_id,
          passId,
        });
        throw new Error('Purchase confirmation timed out');
      }

      return {
        hash: hash as `0x${string}`,
        explorerUrl,
        purchaseId: quote.purchase_id,
        reservationId: quote.reservation_id,
        expiresAt: quote.expires_at,
        status: finalStatus,
      };
    },
    onError: (err) => {
      if (!(err instanceof CryptoConfirmHardConflictError)) {
        const parsed = getPassErrorMessage(err);
        setErrorMessage(parsed.message);
        setPhase('failed');
      }
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.onchainPass.accessList() });
      if (passId) {
        client.invalidateQueries({ queryKey: queryKeys.onchainPass.access(passId) });
        client.invalidateQueries({ queryKey: ['pass', passId] });
      }
    },
  });

  return Object.assign(mutation, {
    phase,
    errorMessage,
    lastTxHash,
    lastExplorerUrl,
    hardConflict,
    resetPhase,
    retryPendingConfirmation,
    markCompletedFromResume,
    markConflictFromResume,
  }) as CryptoDirectBuyResult;
};

/**
 * Resume an in-flight crypto purchase on app mount.
 *
 * Reads localStorage for a {@link persistCryptoCheckoutContext} blob and, if the
 * receipt-bearing txHash is still pending finalization, re-attempts confirm
 * silently in the background. Mount once at the app root.
 */
export const useCryptoResumeConfirm = () => {
  const queryClient = useQueryClient();
  // Guards against React Strict Mode double-invoke in development.
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const ctx = readCryptoCheckoutContext();
    if (!ctx || !ctx.purchaseId || !ctx.txHash) return;
    if (ctx.phase === 'completed' || ctx.phase === 'failed') {
      clearCryptoCheckoutContext();
      return;
    }

    let cancelled = false;
    (async () => {
      trackOnchainEvent('onchain.crypto.resume.start', {
        purchaseId: ctx.purchaseId,
        phase: ctx.phase,
      });
      updateCryptoCheckoutPhase('confirming');
      try {
        const resp = await confirmWithRetry(
          () => onchainPassApi.confirmCryptoPurchase(ctx.purchaseId, ctx.txHash),
        );
        if (cancelled) return;
        trackOnchainEvent('onchain.crypto.resume.success', {
          purchaseId: ctx.purchaseId,
          status: resp?.data?.status,
        });
        clearCryptoCheckoutContext();
        queryClient.invalidateQueries({ queryKey: queryKeys.onchainPass.accessList() });
        queryClient.invalidateQueries({ queryKey: queryKeys.onchainPass.access(ctx.passId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.onchainPass.purchaseStatus(ctx.purchaseId) });
        queryClient.invalidateQueries({ queryKey: ['pass', ctx.passId] });
        queryClient.invalidateQueries({ queryKey: ['purchased-passes'] });
        try {
          window.dispatchEvent(
            new CustomEvent('crypto-purchase:resumed', {
              detail: {
                purchaseId: ctx.purchaseId,
                passId: ctx.passId,
                status: resp?.data?.status,
                txHash: ctx.txHash,
                explorerUrl: ctx.explorerUrl || null,
              },
            }),
          );
        } catch {}
      } catch (err) {
        if (cancelled) return;
        if (err instanceof CryptoConfirmHardConflictError) {
          clearCryptoCheckoutContext();
          trackOnchainEvent('onchain.crypto.resume.hard_conflict', {
            purchaseId: ctx.purchaseId,
          });
          try {
            window.dispatchEvent(
              new CustomEvent('crypto-purchase:conflict', {
                detail: {
                  purchaseId: ctx.purchaseId,
                  passId: ctx.passId,
                  message: err.message,
                  txHash: ctx.txHash,
                  explorerUrl: ctx.explorerUrl || null,
                },
              }),
            );
          } catch {}
          return;
        }
        // Transient/5xx exhausted — leave context in place; reconcile will
        // pick it up server-side and the next resume attempt can retry.
        try { console.warn('[CryptoPay] resume confirm exhausted, leaving context for next attempt', err); } catch {}
        trackOnchainEvent('onchain.crypto.resume.give_up', { purchaseId: ctx.purchaseId });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

const CHAIN_BY_ID: Record<number, (Chain & { id: typeof base.id | typeof baseSepolia.id }) | undefined> = {
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

export const useClaimPendingPurchases = () => {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation<
    MintPendingResponse,
    Error,
    { purchaseIds: string[]; walletAddress?: string }
  >({
    mutationFn: async ({ purchaseIds, walletAddress }) => {
      const resolvedWallet = walletAddress || address;
      if (!resolvedWallet) throw new Error('Wallet not connected');

      const minted = await Promise.all(
        purchaseIds.map(async (purchaseId) => {
          const response = await onchainPassApi.claim({ purchaseId, walletAddress: resolvedWallet });
          return {
            purchaseId,
            passId: response?.data?.passId || '',
            status: response?.data?.status || 'failed',
            txHash: response?.data?.txHash || undefined,
          };
        })
      );

      return {
        success: true,
        data: {
          minted,
          summary: {
            total: minted.length,
            successful: minted.filter((item) => item.status === 'success').length,
            failed: minted.filter((item) => item.status === 'failed').length,
            alreadyMinted: minted.filter((item) => item.status === 'already_minted').length,
          },
        },
      };
    },
    onSuccess: (_data, variables) => {
      variables.purchaseIds.forEach((purchaseId) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.onchainPass.purchaseStatus(purchaseId) });
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.onchainPass.pendingPurchases() });
      queryClient.invalidateQueries({ queryKey: queryKeys.onchainPass.accessList() });
      queryClient.invalidateQueries({ queryKey: ['purchased-passes'] });
    },
  });
};
