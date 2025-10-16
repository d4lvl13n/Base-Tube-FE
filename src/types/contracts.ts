export interface ContractAbiResponse {
  name: string;
  version: string;
  chainId: number;
  address: string; // 0x...
  abi: any[]; // Contract ABI JSON
}


