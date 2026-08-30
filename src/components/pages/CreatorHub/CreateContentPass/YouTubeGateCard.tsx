import React from 'react';
import { Lock } from 'lucide-react';
import { cx, form, page } from '../shared/hubStyles';

interface YouTubeGateCardProps {
  onVerify: () => void;
}

/**
 * The gate in front of the wizard: one panel, the reasons, the one button.
 * The copy was written deliberately — do not rephrase it.
 */
const YouTubeGateCard: React.FC<YouTubeGateCardProps> = ({ onVerify }) => (
  <div className={page.frame}>
    <div className={page.narrow}>
      <section className={cx(form.panel, 'mx-auto max-w-lg space-y-5')} aria-labelledby="yt-gate-title">
        <div className="flex items-center gap-2.5">
          <Lock className="h-5 w-5 text-[#fa7517]" aria-hidden="true" />
          <h2 id="yt-gate-title" className="text-lg font-medium text-white">
            Let's quickly verify your YouTube channel
          </h2>
        </div>

        <div className="space-y-1.5">
          <p className={page.eyebrow}>Why?</p>
          <p className="text-sm text-gray-400">
            We do a quick check with YouTube so everyone knows the videos really belong to you. No surprises, no copyright headaches.
          </p>
        </div>

        <div className="space-y-1.5">
          <p className={page.eyebrow}>What will happen next?</p>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-400">
            <li>We'll pop you over to Google for a sec</li>
            <li>You pick the channel you want to use</li>
            <li>Google sends you right back here</li>
            <li>That's it — start making passes!</li>
          </ol>
        </div>

        <div className="space-y-1.5">
          <p className={page.eyebrow}>Important notes:</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-400">
            <li>We never (and can't) post or edit anything on your channel</li>
            <li>Only <strong className="font-medium text-gray-200">unlisted</strong> videos can be added to a pass</li>
            <li>Change your mind? Disconnect with one click later</li>
          </ul>
        </div>

        <div className="border-t border-gray-800/60 pt-4">
          <button type="button" onClick={onVerify} className={form.primaryButton}>
            Verify YouTube channel
          </button>
        </div>
      </section>
    </div>
  </div>
);

export default YouTubeGateCard;
