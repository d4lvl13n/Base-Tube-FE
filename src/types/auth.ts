// Authentication Methods
export enum AuthMethod {
  CLERK = 'clerk',
  WEB3 = 'web3'
}

// User Profile
export interface User {
  id: string;
  username: string;
  email: string;
  name: string | null;
  profile_image_url: string;
  createdAt: string;
  updatedAt: string;
  web3auth?: Web3Auth & {
    avatar?: string;  // From onchainkit Avatar
  };
  onboarding_status: 'PENDING' | 'COMPLETED';
}

// Wallet Information
export interface Web3Auth {
  id: number;
  user_id: string;
  wallet_address: string;
  last_login: string | null;
  createdAt: string;
  updatedAt: string;
}

// Authentication State
export interface AuthState {
  step: AuthenticationStep;
  error: Error | null;
  isAuthenticated: boolean;
  user: User | null;
  token?: string | null; // Make token optional
}

// API Responses
export interface LoginResponse {
  user: User;  // This should only include basic user info, no suggestions
  token?: string;
}

export interface SignupResponse {
  user: User;
  token?: string;
}

export interface OnboardingResponse {
  user: User;
  suggestedUsernames?: string[];  // Move this here for onboarding
}

export interface LinkWalletResponse {
  web3auth: Web3Auth;
}

// Error Handling
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, any>;
}

export enum AuthErrorCode {
  WALLET_CONNECTION_FAILED = 'WALLET_CONNECTION_FAILED',
  WALLET_ALREADY_LINKED = 'WALLET_ALREADY_LINKED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  UNKNOWN = 'UNKNOWN',
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  CHECKING_NETWORK = 'CHECKING_NETWORK',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

// Request Payloads
export interface LoginPayload {
  walletAddress: string;
}

export interface SignupPayload {
  walletAddress: string;
}

export interface LinkWalletPayload {
  walletAddress: string;
}

// Context Types
export interface AuthContextType extends AuthState {
  login: (method: AuthMethod) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Storage Keys
export const AUTH_STORAGE_KEYS = {
  TOKEN: 'auth_token',
  METHOD: 'auth_method'
} as const;

// Configuration Types
export interface AuthConfig {
  baseUrl: string;
  tokenExpiryDays: number;
  supportedChains: number[];
}

// Wallet Connection Status
export enum WalletConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

// Authentication Steps
export enum AuthenticationStep {
  IDLE = 'IDLE',
  CONNECTING_WALLET = 'CONNECTING_WALLET',
  CHECKING_NETWORK = 'CHECKING_NETWORK',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
  CREATING_ACCOUNT = 'CREATING_ACCOUNT'
}

// Event Types
export interface AuthEventMap {
  'auth:login': { method: AuthMethod; user: User };
  'auth:logout': { method: AuthMethod };
  'auth:error': { error: AuthError };
  'wallet:connected': { address: string };
  'wallet:disconnected': void;
}

// Utility Types
export type AuthEventHandler<T extends keyof AuthEventMap> = (
  event: AuthEventMap[T]
) => void;

export type AuthStorageData = {
  token: string;
  method: AuthMethod;
  expiry: number;
};