import React from 'react';
import { useCryptoResumeConfirm } from '../../hooks/useOnchainPass';

/**
 * Mount once near the app root (inside QueryClientProvider) to automatically
 * finalize any crypto purchase that was interrupted by a refresh, tab close,
 * or navigation. Zero render output — side-effect-only component.
 */
const CryptoResumeBridge: React.FC = () => {
  useCryptoResumeConfirm();
  return null;
};

export default CryptoResumeBridge;
