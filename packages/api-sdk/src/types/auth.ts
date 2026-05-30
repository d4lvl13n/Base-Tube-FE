import type { User } from './user';

export interface NonceResponse {
  nonce: string;
  message: string;
}

export interface LoginResponse {
  user: User;
  created?: boolean;
}

export interface SignupResponse {
  user: User;
}

export interface LinkWalletResponse {
  web3auth: {
    id: number | string;
    user_id: string;
    wallet_address: string;
  };
}

/** `GET /api/v1/auth/profile` wraps the user under `data`. */
export interface AuthProfileResponse {
  data: { user: User };
}
