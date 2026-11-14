import React from 'react';
import { Lock } from 'lucide-react';
import { cx, form, frame, heroGlow } from '../Business/businessStyles';
import { WizardCard } from './wizardUi';

interface YouTubeGateCardProps {
  onVerify: () => void;
}

/**
 * The gate in front of the wizard: one card, the reasons, the one button.
 * The copy was written deliberately — do not rephrase it.
 */
const YouTubeGateCard: React.FC<YouTubeGateCardProps> = ({ onVerify }) => (
  <div className={frame.page}>
    <div className="mx-auto max-w-lg px-4 md:px-6">
      <WizardCard id="yt-gate" style={heroGlow} bodyClassName="space-y-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-800/70 bg-black/60 text-[#fa7517]">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 id="yt-gate-title" className="pt-1.5 text-lg font-semibold tracking-tight text-white">
            Let's quickly verify your YouTube channel
          </h2>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-gray-200">Why?</p>
          <p className="text-sm leading-relaxed text-gray-400">
            We do a quick check with YouTube so everyone knows the videos really belong to you. No surprises, no copyright headaches.
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-gray-200">What will happen next?</p>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-400 marker:text-gray-500">
            <li>We'll pop you over to Google for a sec</li>
            <li>You pick the channel you want to use</li>
            <li>Google sends you right back here</li>
            <li>That's it — start making passes!</li>
          </ol>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-gray-200">Important notes:</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-400 marker:text-gray-500">
            <li>We never (and can't) post or edit anything on your channel</li>
            <li>Only <strong className="font-medium text-gray-200">unlisted</strong> videos can be added to a pass</li>
            <li>Change your mind? Disconnect with one click later</li>
          </ul>
        </div>

        <div className="border-t border-gray-800/50 pt-5">
          <button type="button" onClick={onVerify} className={cx(form.primaryButton, 'h-10 w-full px-5 sm:w-auto')}>
            Verify YouTube channel
          </button>
        </div>
      </WizardCard>
    </div>
  </div>
);

export default YouTubeGateCard;
