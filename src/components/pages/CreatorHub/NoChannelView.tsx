import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Plus, Rocket, Shield, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { button, cx, heroGlow, sheen, surface } from './Business/businessStyles';

const FeatureCard = ({ icon: Icon, title, description }: {
  icon: any,
  title: string,
  description: string
}) => (
  <div className={cx(surface.inset, 'p-4')}>
    <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
    <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
    <p className="mt-1 text-sm text-gray-400">{description}</p>
  </div>
);

type NoChannelViewProps = {
  title?: string;
  description?: string;
  buttonText?: string;
  className?: string;
  /** Where the one button goes. */
  createPath?: string;
};

/**
 * The hub before a channel exists: one card (the screen's one glow), what a
 * channel gives you in three quiet tiles, and the one action.
 */
const NoChannelView: React.FC<NoChannelViewProps> = ({
  title = "Start Your Creator Journey",
  description = "Create your first channel to begin sharing your content and building your community in the Web3 space.",
  buttonText = "Create Your First Channel",
  className = "",
  createPath = '/creator-hub/channels/new',
}) => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const features = [
    {
      icon: Rocket,
      title: "Launch Your Channel",
      description: "Start your journey in the decentralized content space"
    },
    {
      icon: Shield,
      title: "Own Your Content",
      description: "True ownership with blockchain-backed content security"
    },
    {
      icon: Coins,
      title: "Earn Rewards",
      description: "Get rewarded for quality content and engagement"
    }
  ];

  return (
    <div className={cx('mx-auto max-w-5xl px-4 pb-16 pt-24 md:px-6', className)}>
      <motion.section
        className={cx(surface.card, 'p-6 sm:p-10')}
        style={heroGlow}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={sheen} aria-hidden="true" />
        <div className="relative">
          {/* Header Section */}
          <div className="mb-8 text-center sm:mb-10">
            <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-gray-800/70 bg-black/60 text-[#fa7517]">
              <Plus className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {title}
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-base text-gray-400">
              {description}
            </p>
          </div>

          {/* Features Grid */}
          <div className="mb-8 grid grid-cols-1 gap-3 sm:mb-10 sm:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate(createPath)}
              className={cx(button.primary, 'h-11 w-full px-6 text-base sm:w-auto')}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {buttonText}
            </button>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default NoChannelView;
