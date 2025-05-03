import React from 'react';
import { useTokenGate } from '../../hooks/useTokenGate';

interface ProtectedContentProps {
  /**
   * Video (or generic content) identifier to request a signed URL for
   */
  videoId?: string | null;
  /**
   * Render prop that receives the signed URL when access is granted
   */
  children: (signedUrl: string) => React.ReactNode;
  /**
   * Optional element to render while loading / verifying access
   */
  fallback?: React.ReactNode;
  /**
   * Optional element to render when the user does not have access (403)
   */
  unauthorized?: React.ReactNode;
  /**
   * Automatically prompt authentication if 401 / no session (default true)
   */
  autoAuth?: boolean;
}

/**
 * Reusable wrapper that abstracts token-gating logic for any pass video.
 * It delegates the heavy-lifting to `useTokenGate` and decides what to
 * render for each state (loading, unauthorized, success).
 */
const ProtectedContent: React.FC<ProtectedContentProps> = ({
  videoId,
  children,
  fallback = <div className="w-full aspect-video bg-gray-800 flex items-center justify-center text-gray-400">Loading…</div>,
  unauthorized = <div className="w-full aspect-video bg-gray-800 flex items-center justify-center text-gray-400">You do not have access to this content.</div>,
  autoAuth = true,
}) => {
  const { signedUrl, isLoading, is401 } = useTokenGate(videoId, {
    autoAuth,
  });

  if (isLoading) return <>{fallback}</>;

  if (!signedUrl) {
    // Determine which unauthorized message to display
    return (
      <>
        {is401 ? (
          <div className="w-full aspect-video bg-gray-800 flex items-center justify-center text-gray-400">
            Please sign in to access this content.
          </div>
        ) : (
          unauthorized
        )}
      </>
    );
  }

  // Access granted
  return <>{children(signedUrl)}</>;
};

export default ProtectedContent;

export function withProtectedContent<P>(
  Wrapped: React.ComponentType<P & { signedUrl: string }>,
  selectId: (props: P) => string | null
) {
  return (props: P) => (
    <ProtectedContent videoId={selectId(props)}>
      {signed => <Wrapped {...props} signedUrl={signed} />}
    </ProtectedContent>
  );
} 