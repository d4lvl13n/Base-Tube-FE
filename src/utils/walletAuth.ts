import web3AuthApi from '../api/web3authapi';

export interface SignedWalletAuthPayload {
  walletAddress: string;
  signature: string;
}

const LINKED_WALLET_HINT_KEY = 'linked_wallet_address';

export function normalizeWalletAddress(walletAddress?: string | null): string | null {
  if (!walletAddress) return null;
  return walletAddress.toLowerCase();
}

export function getLinkedWalletHint(): string | null {
  try {
    return normalizeWalletAddress(sessionStorage.getItem(LINKED_WALLET_HINT_KEY));
  } catch {
    return null;
  }
}

export function setLinkedWalletHint(walletAddress: string): void {
  const normalizedAddress = normalizeWalletAddress(walletAddress);
  if (!normalizedAddress) return;
  try {
    sessionStorage.setItem(LINKED_WALLET_HINT_KEY, normalizedAddress);
  } catch {
    // Ignore sessionStorage failures (private mode / disabled storage)
  }
}

export function clearLinkedWalletHint(walletAddress?: string | null): void {
  try {
    if (!walletAddress) {
      sessionStorage.removeItem(LINKED_WALLET_HINT_KEY);
      return;
    }

    const normalizedAddress = normalizeWalletAddress(walletAddress);
    if (normalizedAddress && getLinkedWalletHint() === normalizedAddress) {
      sessionStorage.removeItem(LINKED_WALLET_HINT_KEY);
    }
  } catch {
    // Ignore sessionStorage failures
  }
}

export function isWalletAlreadyLinked(walletAddress?: string | null): boolean {
  const normalizedAddress = normalizeWalletAddress(walletAddress);
  return Boolean(normalizedAddress && getLinkedWalletHint() === normalizedAddress);
}

export async function createWalletAuthPayload(
  walletAddress: string,
  signMessage: (message: string) => Promise<string>
): Promise<SignedWalletAuthPayload> {
  const normalizedAddress = normalizeWalletAddress(walletAddress);
  if (!normalizedAddress) {
    throw new Error('Wallet address is required');
  }
  const { message } = await web3AuthApi.requestNonce(normalizedAddress);
  const signature = await signMessage(message);

  return {
    walletAddress: normalizedAddress,
    signature,
  };
}
