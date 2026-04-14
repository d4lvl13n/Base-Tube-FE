import web3AuthApi from '../api/web3authapi';

export interface SignedWalletAuthPayload {
  walletAddress: string;
  signature: string;
}

export async function createWalletAuthPayload(
  walletAddress: string,
  signMessage: (message: string) => Promise<string>
): Promise<SignedWalletAuthPayload> {
  const normalizedAddress = walletAddress.toLowerCase();
  const { message } = await web3AuthApi.requestNonce(normalizedAddress);
  const signature = await signMessage(message);

  return {
    walletAddress: normalizedAddress,
    signature,
  };
}
