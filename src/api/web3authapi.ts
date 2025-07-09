import api from './index';
import { LoginResponse, SignupResponse, LinkWalletResponse } from '../types/auth';
import { handleApiError, retryWithBackoff } from '../utils/errorHandler';
import { ErrorCode } from '../types/error';

interface UsernameOptions {
  suggestions: string[];
}

interface UpdateUsernameResponse {
  message: string;
  username: string;
}

class Web3AuthApi {
  /**
   * Logs in with a connected wallet.
   */
  async login(walletAddress: string): Promise<LoginResponse> {
    const executeLogin = async () => {
      const normalizedAddress = walletAddress.toLowerCase();
      
      console.log('Attempting login with address:', normalizedAddress);
      
      const response = await api.post('/api/v1/web3auth/login', {
        walletAddress: normalizedAddress
      }, {
        withCredentials: true
      });

      // Debug response
      console.log('Login Response:', {
        status: response.status,
        headers: response.headers,
        cookies: document.cookie,
        data: response.data
      });
      
      return response.data;
    };

    try {
      return await retryWithBackoff(executeLogin, 2, 1000);
    } catch (error) {
      const userError = handleApiError(error, {
        action: 'Web3 login',
        component: 'web3authAPI',
        additionalData: { walletAddress: walletAddress.slice(0, 6) + '...' }
      });

      // Handle specific Web3 auth errors
      if (userError.code === ErrorCode.NOT_FOUND) {
        userError.message = 'Wallet not found. Please sign up first.';
      } else if (userError.code === ErrorCode.UNAUTHORIZED) {
        userError.message = 'Login failed. Please check your wallet connection.';
        }

      throw userError;
    }
  }

  /**
   * Signs up a new user with connected wallet.
   */
  async signup(walletAddress: string): Promise<SignupResponse> {
    const executeSignup = async () => {
      const normalizedAddress = walletAddress.toLowerCase();
      
      const response = await api.post('/api/v1/web3auth/signup', {
        walletAddress: normalizedAddress
      }, {
        withCredentials: true
      });

      return response.data;
    };

    try {
      return await retryWithBackoff(executeSignup, 2, 1000);
    } catch (error) {
      const userError = handleApiError(error, {
        action: 'Web3 signup',
        component: 'web3authAPI',
        additionalData: { walletAddress: walletAddress.slice(0, 6) + '...' }
      });

      // Handle specific signup errors
      if (userError.code === ErrorCode.VALIDATION_ERROR && 
          error instanceof Error && error.message.includes('409')) {
        userError.message = 'Wallet already registered. Please login instead.';
        }
        
      throw userError;
    }
  }

  /**
   * Links a wallet to an existing user account.
   */
  async linkWallet(walletAddress: string): Promise<LinkWalletResponse> {
    const executeLinkWallet = async () => {
      const response = await api.post('/api/v1/web3auth/link', {
        walletAddress: walletAddress.toLowerCase()
      }, {
        withCredentials: true
      });
      return response.data;
    };

    try {
      return await retryWithBackoff(executeLinkWallet, 2, 1000);
    } catch (error) {
      const userError = handleApiError(error, {
        action: 'link wallet',
        component: 'web3authAPI',
        additionalData: { walletAddress: walletAddress.slice(0, 6) + '...' }
      });

      // Handle specific link wallet errors
      if (userError.code === ErrorCode.VALIDATION_ERROR &&
          error instanceof Error && error.message.includes('409')) {
        userError.message = 'Wallet already linked to another account.';
        }

      throw userError;
    }
  }

  /**
   * Fetches AI-generated username suggestions
   */
  async getUsernameSuggestions(): Promise<UsernameOptions> {
    const fetchSuggestions = async () => {
      const response = await api.get('/api/v1/web3auth/username/options', {
        withCredentials: true
      });
      return response.data;
    };

    try {
      return await retryWithBackoff(fetchSuggestions, 2, 1000);
    } catch (error) {
      const userError = handleApiError(error, {
        action: 'fetch username suggestions',
        component: 'web3authAPI'
      });

      throw userError;
    }
  }

  /**
   * Updates the user's username
   */
  async updateUsername(username: string): Promise<UpdateUsernameResponse> {
    const executeUpdate = async () => {
      // Validate username format
      if (!this.isValidUsername(username)) {
        throw new Error('Invalid username format. Must start with "0x_" and be 5-20 characters long.');
      }

      const response = await api.put('/api/v1/web3auth/username', {
        username
      }, {
        withCredentials: true
      });
      return response.data;
    };

    try {
      return await retryWithBackoff(executeUpdate, 2, 1000);
    } catch (error) {
      const userError = handleApiError(error, {
        action: 'update username',
        component: 'web3authAPI',
        additionalData: { username }
      });

      // Handle specific username errors
      if (userError.code === ErrorCode.VALIDATION_ERROR) {
        if (error instanceof Error && error.message.includes('409')) {
          userError.message = 'Username already taken. Please choose a different one.';
        } else if (error instanceof Error && error.message.includes('Invalid username format')) {
          userError.message = 'Invalid username format. Must start with "0x_" and be 5-20 characters long.';
        }
      }

      throw userError;
    }
  }

  /**
   * Validates username format
   */
 private isValidUsername(username: string): boolean {
  // Must start with 0x_
  // Can contain letters, numbers, and underscores
  // Total length: 5-20 characters (including 0x_)
  const usernameRegex = /^0x_[a-zA-Z0-9_]{2,17}$/;
  
  if (!usernameRegex.test(username)) {
    return false;
  }

  // Additional validation rules could go here
  // e.g., no consecutive underscores, no reserved words, etc.

  return true;
}

private getValidationError(username: string): string | null {
  if (!username.startsWith('0x_')) {
    return 'Username must start with 0x_';
  }
  if (username.length < 5) {
      return 'Username too short (minimum 5 characters including 0x_)';
  }
  if (username.length > 20) {
      return 'Username too long (maximum 20 characters including 0x_)';
  }
    
    // Check if it contains only valid characters after 0x_
    const afterPrefix = username.slice(3);
    if (!/^[a-zA-Z0-9_]+$/.test(afterPrefix)) {
      return 'Username can only contain letters, numbers, and underscores after 0x_';
    }
    
    return null;
  }

  /**
   * Logout user and clear session
   */
  async logout(): Promise<void> {
    const executeLogout = async () => {
      const response = await api.post('/api/v1/web3auth/logout', {}, {
        withCredentials: true
      });
      return response.data;
    };

    try {
      await retryWithBackoff(executeLogout, 2, 1000);
    } catch (error) {
      const userError = handleApiError(error, {
        action: 'logout',
        component: 'web3authAPI'
      });

      // Don't throw errors for logout - just log them
      console.warn('Logout error (non-critical):', userError.message);
    }
  }
}

export default new Web3AuthApi();