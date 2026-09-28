import React from 'react';
import { LogIn, Wallet } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { startStudioAuth, STUDIO_SIGN_IN_PATH } from '../../../../utils/studioAuth';

/**
 * The AI Thumbnails sign-in choices (header, landing page and the pages that
 * need an account): AI Thumbnails' own sign-in page, by email (Google, Discord)
 * or with a wallet. Each remembers this page to come back to (utils/studioAuth).
 */
export default function AIThumbnailsSignInOptions() {
  const location = useLocation();
  const from = location.pathname + location.search;
  return (
    <div className="p-2 space-y-1 max-w-sm">
      {([
        { key: 'email', label: 'Sign In with Email', description: 'Email, Google or Discord', Icon: LogIn, wallet: false },
        { key: 'wallet', label: 'Sign In with Wallet', description: 'Connect your Web3 wallet', Icon: Wallet, wallet: true },
      ] as const).map(({ key, label, description, Icon, wallet }) => (
        <Link
          key={key}
          to={STUDIO_SIGN_IN_PATH}
          state={wallet ? { wallet: true } : undefined}
          onClick={() => startStudioAuth('sign-in', from)}
          className="block w-full group relative rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-[#fa7517] to-orange-400 rounded-lg opacity-0 group-hover:opacity-100 blur transition-all duration-300" />
          <div className="relative flex items-center gap-3 p-3 rounded-lg bg-black hover:bg-black/90 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fa7517] to-orange-400 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-[#fa7517]/20 transition-shadow duration-300">
              <Icon aria-hidden="true" className="w-4 h-4 text-white transform group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="text-left transition-transform duration-300 group-hover:translate-x-1">
              <p className="text-white font-medium">{label}</p>
              <p className="text-white/50 text-xs group-hover:text-white/70 transition-colors duration-300">{description}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
