import React, { useState, useEffect } from 'react';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownBasename,
  WalletDropdownDisconnect,
  WalletDropdownLink,
  type ConnectWalletReact,
} from '@coinbase/onchainkit/wallet';
import {
  Avatar,
  Name,
  Address,
  Identity,
  EthBalance,
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
  icon,
}: WalletWrapperParams) {
  // Tracks the local "wallet_username" stored in OnboardingWeb3 (if available)
  const [username, setUsername] = useState<string | null>(
    localStorage.getItem('wallet_username')
  );

  useEffect(() => {
    const handleWalletUpdate = () => {
      setUsername(localStorage.getItem('wallet_username'));
    };
    window.addEventListener('wallet:update', handleWalletUpdate);
    return () =>
      window.removeEventListener('wallet:update', handleWalletUpdate);
  }, []);

  return (
    <Wallet>
      {withWalletAggregator ? (
        /*
          1) NOT AUTHENTICATED:
             Renders the Coinbase ConnectWallet aggregator
             so a user can sign in with a wallet.
        */
        <ConnectWallet
          text={username || text}
          className={className}
          onConnect={onConnect}
        >
          {icon && <div className="mr-2">{icon}</div>}
          <Name />
        </ConnectWallet>
      ) : (
        <div className="relative flex items-center">
          <button
            type="button"
            className={`
              flex items-center space-x-2 
              relative z-10 
              min-w-[40px] 
              ${className}
            `}
          >
            {icon ? (
              <>{icon}</>
            ) : (
              <Avatar className="h-6 w-6 rounded-full" />
            )}
            <span className="text-white">{username || text || 'My Wallet'}</span>
          </button>
        </div>
      )}

      {/* The WalletDropdown remains in the DOM, letting OnchainKit attach 
          click handlers that open/close the dropdown. */}
      <WalletDropdown className="bg-black/95 backdrop-blur-xl z-50">
        <Identity hasCopyAddressOnClick>
          <Avatar className="!h-16 !w-16" />
          <div>
            <Name className="!text-xl !font-bold text-white" />
            <Address className="!text-sm !text-gray-400" />
            <EthBalance className="!text-sm !font-medium !text-[#fa7517]" />
          </div>
        </Identity>
        <div className="space-y-1 p-2">
          <WalletDropdownBasename />
          <WalletDropdownLink icon="wallet" href="/profile">
            My Profile
          </WalletDropdownLink>
          <WalletDropdownDisconnect />
        </div>
      </WalletDropdown>
    </Wallet>
  );
}