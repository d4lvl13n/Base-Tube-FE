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

export const WALLET_LINKED_TO_OTHER_ACCOUNT =
  'This wallet is already linked to another BaseTube account. Switch to a different wallet in MetaMask, then try again. Your payment and watch access are already unlocked.';

export const WALLET_ALREADY_HAS_THIS_PASS_NFT =
  'This wallet already holds the NFT for this pass (one NFT per wallet). Switch to a different wallet to claim, or skip claiming — you can watch now.';

export function messageFromUnknown(err: unknown): string {
  if (!err) return '';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return '';
}

export function isWalletLinkedToOtherAccount(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('already linked') && !lower.includes('your account');
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
