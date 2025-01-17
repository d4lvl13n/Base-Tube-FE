import React from 'react';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownBasename,
  WalletDropdownDisconnect,
  WalletDropdownFundLink,
  WalletDropdownLink,
  type ConnectWalletReact
} from '@coinbase/onchainkit/wallet';
import { 
  Avatar, 
  Name, 
  Address, 
  Identity,
  EthBalance 
} from '@coinbase/onchainkit/identity';

type WalletWrapperParams = Omit<ConnectWalletReact, 'children'> & {
  text?: string;
  className?: string;
  withWalletAggregator?: boolean;
  onConnect?: () => void;
};

export default function WalletWrapper({
  text,
  className,
  withWalletAggregator = false,
  onConnect
}: WalletWrapperParams) {
  return (
    <Wallet>
      <ConnectWallet
        text={text}
        className={`${className} !bg-[#fa7517] hover:!bg-[#fa7517]/90 !text-white`}
        onConnect={onConnect}
      >
        <Avatar className="h-6 w-6" />
        <Name />
      </ConnectWallet>
      
      <WalletDropdown className="bg-black/95 backdrop-blur-xl border border-gray-800/30 rounded-xl shadow-2xl">
        <Identity 
          className="!px-6 !py-6 !border-b !border-gray-800/30" 
          hasCopyAddressOnClick
        >
          <Avatar className="!h-16 !w-16" />
          <div className="!space-y-2">
            <Name className="!text-xl !font-bold !text-white" />
            <Address className="!text-sm !text-gray-400" />
            <EthBalance className="!text-sm !font-medium !text-[#fa7517]" />
          </div>
        </Identity>
        <div className="!p-4 !space-y-2">
          <WalletDropdownBasename className="!p-3 !hover:bg-[#fa7517]/10 !rounded-xl !transition-colors !text-white !w-full !text-left" />
          <WalletDropdownLink 
            icon="wallet" 
            href="/profile"
            className="!p-3 !hover:bg-[#fa7517]/10 !rounded-xl !transition-colors !text-white !w-full !text-left"
          >
            My Profile
          </WalletDropdownLink>
          <WalletDropdownFundLink className="!p-3 !hover:bg-[#fa7517]/10 !rounded-xl !transition-colors !text-white !w-full !text-left" />
          <WalletDropdownDisconnect className="!p-3 !hover:bg-red-500/10 !text-red-400 !rounded-xl !transition-colors !w-full !text-left" />
        </div>
      </WalletDropdown>
    </Wallet>
  );
}