import api from './index';

/**
 * The creator's API keys: /api/keys (backend `src/routes/apiKeyRoutes.ts`).
 * A key is addressed by its PUBLIC id (`key_…`); the key itself is returned
 * once, by `createApiKey`, and never again.
 *
 * Envelope: { success: true, data } | { success: false, error: { code, message, details? } }.
 * A failure keeps the axios error, so `plainApiError` reads the server's sentence.
 */
const BASE = '/api/keys';

export type ApiKeyScope = 'videos:upload' | 'videos:read' | 'videos:write' | 'videos:delete' | 'images:generate';
export type ApiKeyStatus = 'active' | 'revoked' | 'expired';

export interface ApiKeyView {
  /** Public id (`key_…`): what every route takes. Not the key. */
  id: string;
  name: string;
  /** The key's first 12 characters, for recognising it. */
  prefix: string;
  scopes: ApiKeyScope[];
  /** null = all the creator's channels. */
  channelId: number | null;
  status: ApiKeyStatus;
  createdAt: string | null;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
}

export interface DailyUploads {
  limit: number;
  /** Uploads started today, website and API together. */
  used: number;
  remaining: number;
  resetsAt: string;
}

export interface ApiKeysResponse {
  keys: ApiKeyView[];
  activeKeys: number;
  maxActiveKeys: number;
  scopes: ApiKeyScope[];
  defaultScopes: ApiKeyScope[];
  dailyUploads: DailyUploads;
}

export interface CreateApiKeyInput {
  name: string;
  scopes: ApiKeyScope[];
  channelId: number | null;
}

export interface IssuedApiKey {
  /** Shown once. Never stored by the app, never logged. */
  key: string;
  apiKey: ApiKeyView;
}

export async function listApiKeys(): Promise<ApiKeysResponse> {
  const response = await api.get(BASE);
  return response.data.data as ApiKeysResponse;
}

export async function createApiKey(input: CreateApiKeyInput): Promise<IssuedApiKey> {
  const response = await api.post(BASE, input);
  return response.data.data as IssuedApiKey;
}

export async function revokeApiKey(publicId: string): Promise<ApiKeyView> {
  const response = await api.delete(`${BASE}/${encodeURIComponent(publicId)}`);
  return response.data.data as ApiKeyView;
}
