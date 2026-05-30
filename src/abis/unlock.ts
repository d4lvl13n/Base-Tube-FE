import { parseAbi } from 'viem';

/**
 * Minimal Unlock PublicLock (v14) + ERC-20 ABIs for the crypto purchase flow.
 * The buy is: USDC.approve(lock, keyPrice) → Lock.purchase(...) (legacy v14 sig,
 * paid in USDC so msg.value = 0).
 */
export const PUBLIC_LOCK_ABI = parseAbi([
  'function purchase(uint256[] _values, address[] _recipients, address[] _referrers, address[] _keyManagers, bytes[] _data) payable returns (uint256[])',
  'function getHasValidKey(address _user) view returns (bool)',
  'function keyPrice() view returns (uint256)',
]);

export const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
]);

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
