import axios from 'axios';
import api from './index';

/**
 * Creators the signed-in buyer allowed to email them about new releases.
 * Every call to these endpoints lives here, so a response-shape change is a
 * one-line fix.
 */
export interface CreatorContactConsent {
  creatorUserId: string;
  creatorName: string | null;
  channelName: string | null;
  grantedAt: string;
}

const BASE = '/api/v1/me/creator-contact-consents';

/** The list, or null when the server does not offer this endpoint yet (404). */
export async function listCreatorContactConsents(): Promise<CreatorContactConsent[] | null> {
  try {
    const response = await api.get(BASE);
    const body = response.data as { items?: unknown; data?: { items?: unknown } };
    const items = Array.isArray(body?.items) ? body.items : Array.isArray(body?.data?.items) ? body.data!.items : [];
    return (items as Array<Record<string, unknown>>)
      .filter((item) => typeof item?.creatorUserId === 'string')
      .map((item) => ({
        creatorUserId: item.creatorUserId as string,
        creatorName: typeof item.creatorName === 'string' ? item.creatorName : null,
        channelName: typeof item.channelName === 'string' ? item.channelName : null,
        grantedAt: typeof item.grantedAt === 'string' ? item.grantedAt : '',
      }));
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

/** Withdraw permission for one creator (204). */
export async function withdrawCreatorContactConsent(creatorUserId: string): Promise<void> {
  await api.delete(`${BASE}/${encodeURIComponent(creatorUserId)}`);
}
