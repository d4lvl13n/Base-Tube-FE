import React, { useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { baseSepolia } from 'wagmi/chains';
import { config } from '../../config/wagmi';
import { useAuth } from '../AuthContext';
import '@coinbase/onchainkit/styles.css';
import '@rainbow-me/rainbowkit/styles.css';

/** Only wallet routes/controls mount these providers. The app itself is never replaced. */
export default function WalletProviders({ children }: { children: React.ReactNode }) {
  const { enableWallet } = useAuth();
  useEffect(() => { enableWallet(); }, [enableWallet]);
  const apiKey = process.env.REACT_APP_ONCHAINKIT_API_KEY;
  if (!apiKey) throw new Error('Missing OnchainKit API Key');
  return <WagmiProvider config={config} reconnectOnMount={false}>
    <OnchainKitProvider apiKey={apiKey} chain={baseSepolia} config={{
      appearance: { name: 'Base.Tube', logo: '/assets/basetubelogo.png', mode: 'dark', theme: 'hacker' },
      wallet: { display: 'modal', termsUrl: 'https://base.tube/terms', privacyUrl: 'https://base.tube/privacy' },
    }}><RainbowKitProvider modalSize="wide">{children}</RainbowKitProvider></OnchainKitProvider>
  </WagmiProvider>;
}
