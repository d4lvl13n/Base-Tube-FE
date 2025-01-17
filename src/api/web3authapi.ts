import api from './index';
import { LoginResponse, SignupResponse, LinkWalletResponse } from '../types/auth';
import axios from 'axios';

class Web3AuthApi {
  /**
   * Logs in with a connected wallet.
   */
  async login(walletAddress: string): Promise<LoginResponse> {
    try {
      const normalizedAddress = walletAddress.toLowerCase();
      
      const response = await api.post('/api/v1/web3auth/login', {
        walletAddress: normalizedAddress
      }, {
        withCredentials: true
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
      const normalizedAddress = walletAddress.toLowerCase();
      
      const response = await api.post('/api/v1/web3auth/link', {
        walletAddress: normalizedAddress
      }, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to link wallet:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });

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
}

export const web3AuthApi = new Web3AuthApi();