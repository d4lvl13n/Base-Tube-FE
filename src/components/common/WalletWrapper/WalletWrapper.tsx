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
  withWalletAggregator?: boolean; // if true, show aggregator
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
        /*
          2) AUTHENTICATED:
             Renders a simple "button" (or DIV) that includes
             an avatar + name and still triggers the dropdown.
        */
        <button
          type="button"
          className={`flex items-center space-x-2 ${className}`}
          onClick={() => {
            // no-op click. OnchainKit handles toggling the dropdown automatically.
          }}
        >
          {/* If you have a custom icon, show that.
              Or you can show OnchainKit's Avatar + Name (or both) */}
          {icon ? (
            <>{icon}</>
          ) : (
            <Avatar className="h-6 w-6 rounded-full" />
          )}
          <span>{username || text || 'My Wallet'}</span>
        </button>
      )}

      {/* The WalletDropdown remains in the DOM, letting OnchainKit attach 
          click handlers that open/close the dropdown. */}
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
          <WalletDropdownLink icon="wallet" href="/profile">
            My Profile
          </WalletDropdownLink>
          <WalletDropdownDisconnect />
        </div>
      </WalletDropdown>
    </Wallet>
  );
}