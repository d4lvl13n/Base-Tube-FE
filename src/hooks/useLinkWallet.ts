import { useState, useCallback } from 'react';
import { useAccount, useConnect, useSignMessage } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import web3AuthApi from '../api/web3authapi';
import { useAuth } from '../contexts/AuthContext';
import {
  createWalletAuthPayload,
  isWalletAlreadyLinked,
  setLinkedWalletHint,
  normalizeWalletAddress,
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
  const { connect, connectors } = useConnect();
  const { signMessageAsync } = useSignMessage();
  const { setUser } = useAuth();

  const clearModal = useCallback(() => {
    setModalState({ type: null, message: null });
  }, []);

  const performLink = useCallback(async (targetAddress?: string | null) => {
    const connectedAddress = normalizeWalletAddress(targetAddress || address);

    if (!connectedAddress) {
      setModalState({
        type: 'error',
        message: 'No wallet connected',
        details: 'Please connect your wallet first.'
      });
      return;
    }

    if (isWalletAlreadyLinked(connectedAddress)) {
      setModalState({
        type: 'success',
        message: 'Wallet Already Connected',
        details: 'This wallet is already linked to your account. You can proceed.'
      });
      return { alreadyLinked: true };
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

      return response;
    } catch (err) {
      console.error('Link wallet error:', err);

      if (err instanceof Error) {
        const errMsg = err.message.toLowerCase();
        console.log('Error message:', err.message);

        // Check if wallet is already linked to THIS account (success case)
        // Backend may return "already linked to your account" or similar
        if (errMsg.includes('already linked') && errMsg.includes('your account')) {
          // Wallet is already linked to the current user - treat as success
          setLinkedWalletHint(connectedAddress);
          setModalState({
            type: 'success',
            message: 'Wallet Already Connected',
            details: 'This wallet is already linked to your account. You can proceed.'
          });
          // Invalidate queries to ensure UI is up to date
          await queryClient.invalidateQueries({ queryKey: ['wallet'] });
          await queryClient.invalidateQueries({ queryKey: ['profile'] });
          return { alreadyLinked: true };
        } else if (errMsg.includes('already linked')) {
          // Wallet is linked to a DIFFERENT account - this is an actual error
          setModalState({
            type: 'error',
            message: 'Wallet Already In Use',
            details: 'This wallet is linked to another account. Please disconnect and try a different wallet.'
          });
          // Don't auto-disconnect - let user decide what to do
          // await disconnect();
        } else {
          setModalState({
            type: 'error',
            message: 'Failed to Link Wallet',
            details: err.message
          });
        }
      } else {
        setModalState({
          type: 'error',
          message: 'Failed to Link Wallet',
          details: 'An unexpected error occurred. Please try again.'
        });
      }
      return null;
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

      const connectResult = await connect({ connector: primaryConnector });
      const nextAddress = normalizeWalletAddress(connectResult.accounts?.[0] || null);

      if (!nextAddress) {
        setModalState({
          type: 'error',
          message: 'Connection Pending',
          details: 'Your wallet is connecting. Please click link again once the wallet address is ready.'
        });
        return null;
      }

      return await performLink(nextAddress);
    } catch (err) {
      console.error('Handle link wallet error:', err);
      setModalState({
        type: 'error',
        message: 'Connection Failed',
        details: err instanceof Error ? err.message : 'Failed to connect wallet'
      });
      return null;
    }
  }, [address, connect, connectors, performLink]);

  return {
    isLinking,
    modalState,
    linkWallet: handleLinkWallet,
    clearModal
  };
} 
