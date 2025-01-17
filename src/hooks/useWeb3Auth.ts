import { useReducer, useEffect, useCallback } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { AuthenticationStep, User, AuthMethod } from '../types/auth';
import { web3AuthApi } from '../api/web3authapi';
import api from '../api/index';

interface AuthState {
  step: AuthenticationStep;
  error: Error | null;
  isAuthenticated: boolean;
  user: User | null;
}

type AuthAction =
  | { type: 'SET_STEP'; payload: AuthenticationStep }
  | { type: 'SET_ERROR'; payload: Error }
  | { type: 'SET_AUTHENTICATED'; payload: { user: User } }
  | { type: 'RESET' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, step: AuthenticationStep.ERROR };
    case 'SET_AUTHENTICATED':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        step: AuthenticationStep.COMPLETED,
      };
    case 'RESET':
      return {
        step: AuthenticationStep.IDLE,
        error: null,
        isAuthenticated: false,
        user: null,
      };
    default:
      return state;
  }
}

export function useWeb3Auth() {
  const [state, dispatch] = useReducer(authReducer, {
    step: AuthenticationStep.IDLE,
    error: null,
    isAuthenticated: false,
    user: null,
  });

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Restore from localStorage (only user data, not token)
  useEffect(() => {
    const userStr = localStorage.getItem('auth_user');
    const method = localStorage.getItem('auth_method');
    
    if (userStr && method === AuthMethod.WEB3) {
      try {
        const user = JSON.parse(userStr) as User;
        dispatch({
          type: 'SET_AUTHENTICATED',
          payload: { user }
        });
      } catch (error) {
        console.error('Failed to restore auth state:', error);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_method');
      }
    }
  }, []);

  const handleAuthSuccess = useCallback((auth: { user: User }) => {
    try {
      localStorage.setItem('auth_user', JSON.stringify(auth.user));
      localStorage.setItem('auth_method', AuthMethod.WEB3);

      dispatch({ 
        type: 'SET_AUTHENTICATED', 
        payload: { user: auth.user }
      });
    } catch (error) {
      console.warn('Failed to store user data in localStorage', error);
      dispatch({ 
        type: 'SET_AUTHENTICATED', 
        payload: { user: auth.user }
      });
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      dispatch({ type: 'SET_STEP', payload: AuthenticationStep.CONNECTING_WALLET });
      
      if (!isConnected || !address) {
        return;
      }

      dispatch({ type: 'SET_STEP', payload: AuthenticationStep.CHECKING_NETWORK });
      if (chainId !== baseSepolia.id) {
        await switchChain({ chainId: baseSepolia.id });
      }

      try {
        const auth = await web3AuthApi.login(address);
        handleAuthSuccess(auth);
        return auth;
      } catch (error: any) {
        if (error?.response?.status === 404 || 
            error.message?.toLowerCase().includes('not found')) {
          dispatch({
            type: 'SET_STEP',
            payload: AuthenticationStep.CREATING_ACCOUNT
          });
          await web3AuthApi.signup(address);
          const authAgain = await web3AuthApi.login(address);
          handleAuthSuccess(authAgain);
          return authAgain;
        }
        throw error;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      dispatch({ type: 'SET_ERROR', payload: new Error(errorMessage) });
      throw error;
    }
  }, [address, isConnected, chainId, switchChain, handleAuthSuccess]);

  const disconnect = useCallback(async () => {
    try {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_method');
      await api.post('/api/v1/web3auth/logout', {}, { withCredentials: true });
    } catch (error) {
      console.warn('Failed to cleanup auth state', error);
    }
    dispatch({ type: 'RESET' });
  }, []);

  // Debug effect
  useEffect(() => {
    console.log('Connection status:', {
      isConnected,
      address,
      isAuthenticated: state.isAuthenticated,
      step: state.step
    });
  }, [isConnected, address, state.isAuthenticated, state.step]);

  return {
    ...state,
    connect,
    disconnect,
    isConnected,
    address
  };
}