import api from './index';
import { LoginResponse, SignupResponse, LinkWalletResponse } from '../types/auth';
import axios from 'axios';

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
    try {
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
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to login:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });

        if (error.response?.status === 404) {
          throw new Error('User not found. Please sign up first.');
        }
        
        if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        }
      }
      throw error;
    }
  }

  /**
   * Signs up a new user with connected wallet.
   */
  async signup(walletAddress: string): Promise<SignupResponse> {
    try {
      const normalizedAddress = walletAddress.toLowerCase();
      
      const response = await api.post('/api/v1/web3auth/signup', {
        walletAddress: normalizedAddress
      }, {
        withCredentials: true
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to signup:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });

        if (error.response?.status === 409) {
          throw new Error('Wallet already registered. Please login instead.');
        }
        
        if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        }
      }
      throw error;
    }
  }

  /**
   * Links a wallet to an existing user account.
   */
  async linkWallet(walletAddress: string): Promise<LinkWalletResponse> {
    try {
      const response = await api.post('/api/v1/web3auth/link', {
        walletAddress: walletAddress.toLowerCase()
      }, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to link wallet:', error);
        if (error.response?.status === 409) {
          throw new Error('Wallet already linked to another account.');
        }
        if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        }
      }
      throw error;
    }
  }

  /**
   * Fetches AI-generated username suggestions
   */
  async getUsernameSuggestions(): Promise<UsernameOptions> {
    try {
      const response = await api.get('/api/v1/web3auth/username/options', {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to fetch username suggestions:', {
          status: error.response?.status,
          data: error.response?.data
        });
        
        if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        }
      }
      throw new Error('Failed to fetch username suggestions');
    }
  }

  /**
   * Updates the user's username
   */
  async updateUsername(username: string): Promise<UpdateUsernameResponse> {
    try {
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
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to update username:', {
          status: error.response?.status,
          data: error.response?.data
        });

        if (error.response?.status === 409) {
          throw new Error('Username already taken');
        }
        
        if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        }
      }
      throw error;
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
    return 'Username is too short (minimum 5 characters)';
  }
  if (username.length > 20) {
    return 'Username is too long (maximum 20 characters)';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username.slice(3))) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return null;
  }

  // New dedicated logout method for web3 users
  async logout(): Promise<void> {
    try {
      await api.post('/api/v1/web3auth/logout', {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Failed to logout via Web3Auth API:', error);
      // Optionally, you can re-throw or handle the error as needed.
    }
  }
}

export const web3AuthApi = new Web3AuthApi();