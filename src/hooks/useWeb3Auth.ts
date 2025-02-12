import { useReducer, useEffect, useCallback } from 'react';
import { useAccount, useChainId, useSwitchChain, useDisconnect } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { AuthenticationStep, User, AuthMethod } from '../types/auth';
import { web3AuthApi } from '../api/web3authapi';
import { useNavigate } from 'react-router-dom';

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
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const navigate = useNavigate();

  /**
   * On mount, restore any user data + auth_method === "web3".
   * 
   * NOTE: If your server sets JWT cookies, you don't *have* to store a token locally;
   * you just need to know the user is "authenticated" so your UI can reflect that.
   */
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

  /**
   * Helper function after a successful login or signup.
   * This sets localStorage, updates React state, and marks user as authenticated.
   * If the backend returns a token, you can store it here too (optional).
   */
  const handleAuthSuccess = useCallback(
    (auth: { user: User; token?: string }) => {
      try {
        console.log('Handling auth success:', auth);
        
        localStorage.setItem('auth_user', JSON.stringify(auth.user));
        localStorage.setItem('auth_method', AuthMethod.WEB3);

        // If the user already has a username, sync it to wallet_username
        if (auth.user.username) {
          console.log('Syncing existing username:', auth.user.username);
          localStorage.setItem('wallet_username', auth.user.username);
        }

        dispatch({ 
          type: 'SET_AUTHENTICATED', 
          payload: { user: auth.user } 
        });
      } catch (error) {
        console.warn('Failed to store user data:', error);
        dispatch({ 
          type: 'SET_AUTHENTICATED', 
          payload: { user: auth.user } 
        });
      }
    },
    []
  );

  /**
   * connect() is called when the user chooses to log in with their wallet.
   * It checks if the user is on the right network, then attempts to log in or sign up.
   */
  const connect = useCallback(async () => {
    try {
      dispatch({ type: 'SET_STEP', payload: AuthenticationStep.CONNECTING_WALLET });
      
      if (!isConnected || !address) return;

      if (chainId !== baseSepolia.id) {
        await switchChain({ chainId: baseSepolia.id });
      }

      try {
        // Attempt login
        const auth = await web3AuthApi.login(address);
        handleAuthSuccess(auth);
        
        navigate(
          auth.user.onboarding_status === 'PENDING' ? '/onboarding/web3' : '/',
          { replace: true }
        );
        return auth;
      } catch (error: any) {
        // If user not found, handle signup flow
        if (error.message?.includes('User not found') || error?.response?.status === 404) {
          dispatch({ type: 'SET_STEP', payload: AuthenticationStep.CREATING_ACCOUNT });
          
          await web3AuthApi.signup(address);
          const authData = await web3AuthApi.login(address);
          handleAuthSuccess(authData);
          
          navigate('/onboarding/web3', { replace: true });
          return authData;
        }
        
        throw error; // Re-throw non-404 errors
      }
    } catch (error) {
      console.error('Authentication error:', error);
      dispatch({ type: 'SET_ERROR', payload: error as Error });
      throw error;
    }
  }, [address, isConnected, chainId, switchChain, handleAuthSuccess, navigate]);

  /**
   * disconnect() logs the user out in the backend
   * and clears localStorage / React state in the frontend.
   */
  const disconnect = useCallback(async () => {
    try {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_method');
      // If you stored a token, remove it:
      // localStorage.removeItem('web3_token');

      await web3AuthApi.logout();
      if (typeof wagmiDisconnect === 'function') {
        await wagmiDisconnect();
      }
    } catch (error) {
      console.warn('Failed to cleanup auth state', error);
    }
    dispatch({ type: 'RESET' });
  }, [wagmiDisconnect]);

  // Optional debug
  useEffect(() => {
    console.log('Connection status:', {
      address,
      isConnected,
      isAuthenticated: state.isAuthenticated,
      step: state.step
    });
  }, [isConnected, address, state.isAuthenticated, state.step]);

  // Add this effect to handle unauthorized events
  useEffect(() => {
    const handleUnauthorized = () => {
      console.log('Unauthorized event received, resetting auth state');
      dispatch({ type: 'RESET' });
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_method');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // Add this function
  const setUser = useCallback((user: User | null) => {
    if (user) {
      dispatch({ 
        type: 'SET_AUTHENTICATED', 
        payload: { user } 
      });
      // Update localStorage
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      dispatch({ type: 'RESET' });
      // Clear localStorage
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_method');
    }
  }, []);

  return {
    ...state,
    setUser,  // Add this
    connect,
    disconnect,
    isConnected,
    address
  };
}