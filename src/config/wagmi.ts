import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  coinbaseWallet,
  metaMaskWallet,
  rainbowWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID;
if (!projectId) throw new Error('Missing REACT_APP_WALLETCONNECT_PROJECT_ID');

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [coinbaseWallet],
    },
    {
      groupName: 'Other Wallets',
      wallets: [metaMaskWallet, rainbowWallet],
    },
  ],
  {
    appName: 'Base.Tube',
    projectId,
  },
);

export const config = createConfig({
  chains: [baseSepolia],
  multiInjectedProviderDiscovery: false,
  connectors,
  transports: {
    // Prefer custom RPC if provided, otherwise use default wagmi endpoint.
    [baseSepolia.id]: http(
      process.env.REACT_APP_BASE_SEPOLIA_RPC_URL || undefined,
    ),
  },
});

// Register the config type
declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}