import { useState, useCallback } from 'react';
import { useAccount, useConnect, useSignMessage } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import web3AuthApi from '../api/web3authapi';
import { useAuth } from '../contexts/AuthContext';
import {
  createWalletAuthPayload,
  isWalletAlreadyLinked,
  isWalletLinkedToOtherAccount,
  messageFromUnknown,
  setLinkedWalletHint,
  normalizeWalletAddress,
  WALLET_LINKED_TO_OTHER_ACCOUNT,
} from '../utils/walletAuth';

type ModalState = {
  type: 'success' | 'error' | null;
  message: string | null;
  details?: string | null;
};

export function useLinkWallet() {
  const [isLinking, setIsLinking] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({
    type: null,
    message: null,
    details: null
  });
  
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { signMessageAsync } = useSignMessage();
  const { setUser } = useAuth();

  const clearModal = useCallback(() => {
    setModalState({ type: null, message: null });
  }, []);

  const performLink = useCallback(async (targetAddress?: string | null) => {
    const connectedAddress = normalizeWalletAddress(targetAddress || address);

    if (!connectedAddress) {
      const details = 'Please connect your wallet first.';
      setModalState({
        type: 'error',
        message: 'No wallet connected',
        details,
      });
      return { ok: false as const, details };
    }

    if (isWalletAlreadyLinked(connectedAddress)) {
      setModalState({
        type: 'success',
        message: 'Wallet already connected',
        details: 'This wallet is already linked to your account. You can proceed.',
      });
      return { ok: true as const, alreadyLinked: true };
    }

    setIsLinking(true);
    setModalState({ type: null, message: null });

    try {
      const { walletAddress, signature } = await createWalletAuthPayload(
        connectedAddress,
        (message) => signMessageAsync({
          account: connectedAddress as `0x${string}`,
          message,
        })
      );
      const response = await web3AuthApi.linkWallet(walletAddress, signature);
      
      if (response.user) {
        setUser(response.user);
      }

      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      setLinkedWalletHint(walletAddress);

      setModalState({
        type: 'success',
        message: 'Wallet linked successfully!',
        details: 'Your wallet has been connected to your account.'
      });

      return { ok: true as const };
    } catch (err) {
      console.error('Link wallet error:', err);
      const errMsg = messageFromUnknown(err);

      if (errMsg.toLowerCase().includes('already linked') && errMsg.toLowerCase().includes('your account')) {
        setLinkedWalletHint(connectedAddress);
        setModalState({
          type: 'success',
          message: 'Wallet already connected',
          details: 'This wallet is already linked to your account. You can proceed.'
        });
        await queryClient.invalidateQueries({ queryKey: ['wallet'] });
        await queryClient.invalidateQueries({ queryKey: ['profile'] });
        return { ok: true as const, alreadyLinked: true };
      }

      if (isWalletLinkedToOtherAccount(errMsg)) {
        setModalState({
          type: 'error',
          message: 'This wallet belongs to another account',
          details: WALLET_LINKED_TO_OTHER_ACCOUNT,
        });
        return { ok: false as const, details: WALLET_LINKED_TO_OTHER_ACCOUNT };
      }

      const details = errMsg || 'An unexpected error occurred. Please try again.';
      setModalState({
        type: 'error',
        message: 'Could not link wallet',
        details,
      });
      return { ok: false as const, details };
    } finally {
      setIsLinking(false);
    }
  }, [address, signMessageAsync, setUser, queryClient]);

  const handleLinkWallet = useCallback(async () => {
    try {
      if (address) {
        return await performLink(address);
      }

      const primaryConnector = connectors[0];
      if (!primaryConnector) {
        throw new Error('No wallet connector available');
      }

      const connectResult = await connectAsync({ connector: primaryConnector });
      const nextAddress = normalizeWalletAddress(connectResult.accounts?.[0] || null);

      if (!nextAddress) {
        const details = 'Your wallet is connecting. Please click link again once the wallet address is ready.';
        setModalState({
          type: 'error',
          message: 'Connection pending',
          details,
        });
        return { ok: false as const, details };
      }

      return await performLink(nextAddress);
    } catch (err) {
      console.error('Handle link wallet error:', err);
      const details = err instanceof Error ? err.message : 'Failed to connect wallet';
      setModalState({
        type: 'error',
        message: 'Connection failed',
        details,
      });
      return { ok: false as const, details };
    }
  }, [address, connectAsync, connectors, performLink]);

  return {
    isLinking,
    modalState,
    linkWallet: handleLinkWallet,
    clearModal
  };
} 
