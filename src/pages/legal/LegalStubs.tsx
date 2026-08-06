// src/pages/legal/LegalStubs.tsx
//
// PLACEHOLDER legal pages for the AI Thumbnail Studio launch (Phase C scaffold).
// These are NOT binding legal text — they lay out the required section structure
// so counsel-reviewed content can drop in. Do NOT ship as-is.

import React from 'react';

const Banner: React.FC = () => (
  <div className="mb-8 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
    ⚠️ <strong>Placeholder</strong> — replace with counsel-reviewed content before launch.
    This scaffold shows the required sections only; it is not legal advice or a binding agreement.
  </div>
);

const Shell: React.FC<{ title: string; updated?: string; children: React.ReactNode }> = ({
  title,
  updated = 'TBD',
  children,
}) => (
  <div className="min-h-screen bg-[#09090B] text-gray-300">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
      <p className="text-xs text-gray-500 mb-8">Last updated: {updated}</p>
      <Banner />
      <div className="space-y-6 leading-relaxed">{children}</div>
    </div>
  </div>
);

const Section: React.FC<{ heading: string; children?: React.ReactNode }> = ({ heading, children }) => (
  <section>
    <h2 className="text-lg font-semibold text-white mb-2">{heading}</h2>
    <div className="text-sm text-gray-400">{children || '[ To be written by counsel. ]'}</div>
  </section>
);

export const TermsPage: React.FC = () => (
  <Shell title="Terms of Service">
    <Section heading="1. Acceptance of terms" />
    <Section heading="2. The service" >
      AI Thumbnail Studio provides thumbnail review (an Attention Score plus feedback) and AI
      thumbnail generation. It does not predict click-through rate and makes no performance guarantee.
    </Section>
    <Section heading="3. Accounts & eligibility" />
    <Section heading="4. Credits & payments" >
      Credits are purchased in packs and consumed per action. Pricing is shown at checkout.
    </Section>
    <Section heading="5. Acceptable use" />
    <Section heading="6. Intellectual property & generated content" />
    <Section heading="7. Disclaimers & limitation of liability" />
    <Section heading="8. Termination" />
    <Section heading="9. Changes to these terms" />
    <Section heading="10. Contact" />
  </Shell>
);

export const PrivacyPage: React.FC = () => (
  <Shell title="Privacy Policy">
    <Section heading="1. Data we collect" >
      Account data (via Clerk), uploaded thumbnails / YouTube URLs you submit, usage, and payment
      metadata (via Stripe — we do not store card details).
    </Section>
    <Section heading="2. Processors" >
      Clerk (authentication), Stripe (payments), and our AI providers for analysis/generation.
    </Section>
    <Section heading="3. Marketing communications & consent" >
      Marketing email is opt-in only; every marketing message includes an unsubscribe link and you
      can opt out at any time.
    </Section>
    <Section heading="4. Data retention" />
    <Section heading="5. Your rights (access, deletion, portability)" />
    <Section heading="6. Cookies & analytics" />
    <Section heading="7. Contact" />
  </Shell>
);

export const RefundPage: React.FC = () => (
  <Shell title="Refund Policy">
    <Section heading="1. Credit purchases" />
    <Section heading="2. Consumed vs. unused credits" />
    <Section heading="3. How to request a refund" />
    <Section heading="4. Chargebacks & disputes" />
    <Section heading="5. Contact" />
  </Shell>
);

export default { TermsPage, PrivacyPage, RefundPage };
