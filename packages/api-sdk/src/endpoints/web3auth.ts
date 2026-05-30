import type { AxiosInstance } from 'axios';
import type {
  AuthProfileResponse,
  LinkWalletResponse,
  LoginResponse,
  NonceResponse,
  SignupResponse,
} from '../types/auth';
import type { User } from '../types/user';

/**
 * Web3 wallet auth flows. On web these set an httpOnly cookie; on mobile the
 * backend must additionally accept the returned JWT as a bearer token
 * (Mobile Readiness Brief, G.1). The SDK transport is bearer-ready today.
 */
export function createWeb3AuthApi(http: AxiosInstance) {
  return {
    /** `POST /api/v1/web3auth/nonce` */
    async requestNonce(walletAddress: string): Promise<NonceResponse> {
      const res = await http.post<NonceResponse>('/api/v1/web3auth/nonce', {
        walletAddress: walletAddress.toLowerCase(),
      });
      return res.data;
    },

    /** `POST /api/v1/web3auth/login` */
    async login(walletAddress: string, signature: string): Promise<LoginResponse> {
      const res = await http.post<LoginResponse>('/api/v1/web3auth/login', {
        walletAddress: walletAddress.toLowerCase(),
        signature,
      });
      return res.data;
    },

    /** `POST /api/v1/web3auth/signup` */
    async signup(walletAddress: string, signature: string): Promise<SignupResponse> {
      const res = await http.post<SignupResponse>('/api/v1/web3auth/signup', {
        walletAddress: walletAddress.toLowerCase(),
        signature,
      });
      return res.data;
    },

    /** `POST /api/v1/web3auth/link` (auth) */
    async link(walletAddress: string, signature: string): Promise<LinkWalletResponse> {
      const res = await http.post<LinkWalletResponse>('/api/v1/web3auth/link', {
        walletAddress: walletAddress.toLowerCase(),
        signature,
      });
      return res.data;
    },

    /** `POST /api/v1/web3auth/logout` */
    async logout(): Promise<void> {
      await http.post('/api/v1/web3auth/logout', {});
    },
  };
}

export function createAuthApi(http: AxiosInstance) {
  return {
    /** `GET /api/v1/auth/profile` (auth) — unwraps `{ data: { user } }`. */
    async getProfile(): Promise<User> {
      const res = await http.get<AuthProfileResponse>('/api/v1/auth/profile');
      return res.data.data.user;
    },
  };
}

export type Web3AuthApi = ReturnType<typeof createWeb3AuthApi>;
export type AuthApi = ReturnType<typeof createAuthApi>;
