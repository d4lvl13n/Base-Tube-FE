import React from 'react';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownBasename,
  WalletDropdownDisconnect,
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
  icon?: React.ReactNode;
  children?: React.ReactNode;
};

export default function WalletWrapper({
  text,
  className,
  withWalletAggregator = false,
  onConnect,
  icon
}: WalletWrapperParams) {
  return (
    <Wallet>
      <ConnectWallet
        text={text}
        className={className}
        onConnect={onConnect}
      >
        {icon}
        <Name />
      </ConnectWallet>
      
      <WalletDropdown className="bg-black/95 backdrop-blur-xl">
        <Identity hasCopyAddressOnClick>
          <Avatar className="!h-16 !w-16" />
          <div>
            <Name className="!text-xl !font-bold" />
            <Address className="!text-sm !text-gray-400" />
            <EthBalance className="!text-sm !font-medium !text-[#fa7517]" />
          </div>
        </Identity>
        <div className="space-y-1 p-2">
          <WalletDropdownBasename />
          <WalletDropdownLink 
            icon="wallet" 
            href="/profile"
          >
            My Profile
          </WalletDropdownLink>
          <WalletDropdownDisconnect />
        </div>
      </WalletDropdown>
    </Wallet>
  );
}