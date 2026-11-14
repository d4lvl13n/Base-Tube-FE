import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useAuth } from '../contexts/AuthContext';
import { passApi } from '../api/pass';
import { attributionAllowed, getStoredAttribution, getVisitorKey } from '../utils/attribution';

/**
 * Counts one view of a published pass's public sales page.
 * Not sent: for the pass's own creator, when the browser sends Do-Not-Track /
 * Global Privacy Control, for bots, or while the page is only prerendered.
 */
export function usePassVisitBeacon(pass: {
  id?: string;
  publish_status?: string;
  channel?: { user_id?: string | null } | null;
} | null | undefined): void {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { user: web3User } = useAuth();
  const sentFor = useRef<string | null>(null);

  const passId = pass?.id;
  const published = pass?.publish_status === 'published';
  const creatorUserId = pass?.channel?.user_id ?? null;
  const viewerId = clerkUser?.id ?? web3User?.id ?? null;

  useEffect(() => {
    // Wait for Clerk so the creator's own views are recognised.
    if (!passId || !published || !clerkLoaded) return;
    if (sentFor.current === passId) return;
    sentFor.current = passId;

    if (creatorUserId && viewerId && creatorUserId === viewerId) return;
    if (!attributionAllowed()) return;

    const send = () => {
      const visitorKey = getVisitorKey();
      if (!visitorKey) return;
      const attribution = getStoredAttribution();
      passApi.recordPassVisit(passId, { visitorKey, ...(attribution ? { attribution } : {}) });
    };

    const doc = document as Document & { prerendering?: boolean };
    if (doc.prerendering) {
      doc.addEventListener('prerenderingchange', send, { once: true });
      return;
    }
    send();
  }, [passId, published, clerkLoaded, creatorUserId, viewerId]);
}
