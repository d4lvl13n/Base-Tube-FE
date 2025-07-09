import { useState, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import web3AuthApi from '../api/web3authapi';
import { useAuth } from '../contexts/AuthContext';

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
  const { disconnect } = useDisconnect();
  const { setUser } = useAuth();

  const clearModal = useCallback(() => {
    setModalState({ type: null, message: null });
  }, []);

  const linkWallet = useCallback(async () => {
    if (!address) {
      setModalState({
        type: 'error',
        message: 'No wallet connected',
        details: 'Please connect your wallet first.'
      });
      return;
    }

    setIsLinking(true);
    setModalState({ type: null, message: null });

    try {
      const response = await web3AuthApi.linkWallet(address);
      
      if (response.user) {
        setUser(response.user);
        await queryClient.invalidateQueries({ queryKey: ['wallet'] });
        await queryClient.invalidateQueries({ queryKey: ['profile'] });
        
        setModalState({
          type: 'success',
          message: 'Wallet linked successfully!',
          details: 'Your wallet has been connected to your account.'
        });
      }

      return response;
    } catch (err) {
      console.error('Link wallet error:', err);
      
      if (err instanceof Error) {
        console.log('Error message:', err.message);
        if (err.message.toLowerCase().includes('already linked')) {
          setModalState({
            type: 'error',
            message: 'Wallet Already Linked',
            details: 'This wallet is already linked to another account. Please disconnect and try a different wallet.'
          });
          await disconnect();
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
  }, [address, setUser, disconnect, queryClient]);

  const handleLinkWallet = useCallback(async () => {
    try {
      if (!address) {
        await connect({ connector: connectors[0] });
      }
      return await linkWallet();
    } catch (err) {
      console.error('Handle link wallet error:', err);
      setModalState({
        type: 'error',
        message: 'Connection Failed',
        details: err instanceof Error ? err.message : 'Failed to connect wallet'
      });
      return null;
    }
  }, [address, connect, connectors, linkWallet]);

  return {
    isLinking,
    modalState,
    linkWallet: handleLinkWallet,
    clearModal
  };
} 