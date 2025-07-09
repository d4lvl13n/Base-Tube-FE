import { motion } from 'framer-motion';
import { Shield, Coins, Sparkles } from 'lucide-react';
import ConnectWalletButton from '../../../common/WalletWrapper/ConnectWalletButton';
import { WalletSectionProps } from '../types';

export const WalletSection: React.FC<WalletSectionProps> = ({ className = "" }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20, x: 0 }}
    animate={{ opacity: 1, y: 0, x: 0 }}
    transition={{ duration: 0.6 }}
    className={`w-full flex items-center justify-center p-4 lg:p-8 relative mt-4 lg:mt-0 ${className}`}
  >
    <div className="relative w-full max-w-md">
      <div className="absolute -inset-1 bg-gradient-to-r from-[#fa751730] via-[#fa751710] to-[#fa751730] rounded-3xl blur-2xl" />
      
      <div className="bg-[#111114]/90 border border-gray-800/20 shadow-xl backdrop-blur-sm rounded-2xl p-4 lg:p-8 relative z-10">
        <div className="text-center mb-4 lg:mb-8">
          <h2 className="text-xl lg:text-2xl font-bold text-white mb-2">The Wallet That Pays You Back</h2>
          <p className="text-gray-400 text-sm lg:text-base">Connect to start earning</p>
        </div>

        <div className="flex justify-center mb-6 lg:mb-8">
          <ConnectWalletButton 
            className="w-full"
            customText="Connect Wallet"
          />
        </div>

        <div className="space-y-3 lg:space-y-4 text-xs lg:text-sm text-gray-400">
          <p className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#fa7517] flex-shrink-0" />
            <span>Gas fees under $0.01</span>
          </p>
          <p className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#fa7517] flex-shrink-0" />
            <span>Withdraw earnings instantly</span>
          </p>
          <p className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#fa7517] flex-shrink-0" />
            <span>Your content lives forever on-chain</span>
          </p>
        </div>
      </div>
    </div>
  </motion.div>
);