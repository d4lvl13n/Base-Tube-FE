// src/pages/legal/LegalStubs.tsx
//
// Real, accurate legal pages for BaseTube (privacy / terms / refund). These are
// operative policies describing what the product actually does, and include the
// YouTube API Services disclosures required for Google OAuth verification.
// NOTE (for the team, not the public page): have counsel review before scaling.

import React from 'react';
import { Link } from 'react-router-dom';

const UPDATED = '6 August 2026';
const CONTACT = 'support@base.tube';

const Shell: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="min-h-screen bg-[#09090B] text-gray-300">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link to="/" className="text-sm text-gray-500 hover:text-white transition-colors">
        ← Back to BaseTube
      </Link>
      <h1 className="text-3xl font-bold text-white mt-6 mb-2">{title}</h1>
      <p className="text-xs text-gray-500 mb-8">Last updated: {UPDATED}</p>
      <div className="space-y-6 leading-relaxed">{children}</div>
      <div className="mt-12 pt-6 border-t border-gray-800 text-xs text-gray-600 flex gap-4">
        <Link to="/privacy" className="hover:text-white">Privacy</Link>
        <Link to="/terms" className="hover:text-white">Terms</Link>
        <Link to="/refund" className="hover:text-white">Refunds</Link>
      </div>
    </div>
  </div>
);

const Section: React.FC<{ heading: string; children: React.ReactNode }> = ({ heading, children }) => (
  <section>
    <h2 className="text-lg font-semibold text-white mb-2">{heading}</h2>
    <div className="text-sm text-gray-400 space-y-2">{children}</div>
  </section>
);

const A: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#fa7517] hover:underline">
    {children}
  </a>
);

// ─────────────────────────────────────────────────────────────────────────────
// PRIVACY
// ─────────────────────────────────────────────────────────────────────────────
export const PrivacyPage: React.FC = () => (
  <Shell title="Privacy Policy">
    <p className="text-sm text-gray-400">
      This Privacy Policy explains how BaseTube (“BaseTube”, “we”, “us”) collects, uses, and
      protects your information when you use our website and tools at beta.base.tube, including the
      Channel Packaging Audit and AI thumbnail tools (the “Service”). If you do not agree with this
      policy, please do not use the Service.
    </p>

    <Section heading="1. Information we collect">
      <p><strong>Account data.</strong> When you sign in, we receive basic account information (such as your email and a user identifier) from our authentication provider, Clerk, or from a connected Web3 wallet.</p>
      <p><strong>Content you submit.</strong> Channel URLs/handles, video titles, thumbnails, and prompts you provide or that we retrieve to produce your audit or generated images.</p>
      <p><strong>Google / YouTube data (only if you connect your channel).</strong> See Section 2.</p>
      <p><strong>Usage &amp; device data.</strong> Log data, feature usage, and basic device/browser information used to operate and secure the Service.</p>
      <p><strong>Payment metadata.</strong> If you purchase credits, our payment processor (Stripe) handles your card details; we receive only transaction metadata (e.g., status, amount, last-4). We never store full card numbers.</p>
    </Section>

    <Section heading="2. YouTube API Services (Google data)">
      <p>
        Parts of the Service use <strong>YouTube API Services</strong>. By connecting your YouTube
        channel, you authorize BaseTube to access certain Google/YouTube data on your behalf. By
        using those features you also agree to the{' '}
        <A href="https://www.youtube.com/t/terms">YouTube Terms of Service</A>, and Google’s use of
        data is governed by the <A href="https://policies.google.com/privacy">Google Privacy Policy</A>.
      </p>
      <p><strong>What we access (read-only):</strong></p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Your channel’s public details and video list (via the <code>youtube.readonly</code> scope) — used to identify your channel and the videos to audit.</li>
        <li>Your YouTube Analytics for your own channel (via the <code>yt-analytics.readonly</code> scope) — metrics such as impressions, click-through rate, watch time, and traffic sources — used solely to produce your personalized packaging audit.</li>
      </ul>
      <p><strong>How we use it.</strong> This data is used only to generate the audit, insights, and fixes we show you. We do <strong>not</strong> sell it, use it for advertising, or share it with third parties except the sub-processors in Section 4 strictly to provide the Service.</p>
      <p><strong>Retention &amp; deletion.</strong> We retain your connected-channel data only as long as needed to provide the Service and your audit history. You can request deletion at any time (Section 7).</p>
      <p>
        <strong>Revoking access.</strong> You can revoke BaseTube’s access to your Google data at any
        time via your{' '}
        <A href="https://myaccount.google.com/permissions">Google Account permissions</A> page
        (Security → Third-party apps &amp; services). Revoking access stops future data access; to
        also delete data already stored, contact us at {CONTACT}.
      </p>
    </Section>

    <Section heading="3. How we use your information">
      <ul className="list-disc pl-5 space-y-1">
        <li>To provide, operate, and improve the audit and thumbnail tools.</li>
        <li>To process payments and manage your credits.</li>
        <li>To secure the Service and prevent abuse.</li>
        <li>To communicate service and (opt-in only) marketing messages.</li>
      </ul>
    </Section>

    <Section heading="4. Sub-processors we share data with">
      <p>We use trusted providers strictly to run the Service:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Clerk</strong> — authentication.</li>
        <li><strong>Stripe</strong> — payments.</li>
        <li><strong>OpenAI, xAI (Grok), and Google (Gemini)</strong> — AI analysis and image generation (we send thumbnails, titles, and prompts; we never send your Google credentials).</li>
        <li><strong>Third-party YouTube data providers</strong> — to fetch public channel/video information for niche examples.</li>
      </ul>
      <p>These providers act on our behalf and are bound to protect your data.</p>
    </Section>

    <Section heading="5. Marketing communications & consent">
      <p>Marketing email is opt-in only. Every marketing message includes an unsubscribe link, and you can opt out at any time. Service and transactional messages (e.g., receipts) are not marketing.</p>
    </Section>

    <Section heading="6. Data retention">
      <p>We keep personal data for as long as your account is active or as needed to provide the Service, comply with legal obligations, resolve disputes, and enforce our agreements. You can delete your account and associated data as described below.</p>
    </Section>

    <Section heading="7. Your rights (access, deletion, revocation, portability)">
      <p>You may request access to, correction of, or deletion of your personal data, and you may withdraw consent or disconnect your YouTube channel at any time. To exercise these rights, email {CONTACT}. To revoke Google access directly, use your{' '}
        <A href="https://myaccount.google.com/permissions">Google Account permissions</A> page.</p>
    </Section>

    <Section heading="8. Cookies & analytics">
      <p>We use essential cookies to keep you signed in and to operate the Service, and limited analytics to understand usage and improve the product.</p>
    </Section>

    <Section heading="9. Children">
      <p>The Service is not directed to children under 13 (or the minimum age required in your country), and we do not knowingly collect their data.</p>
    </Section>

    <Section heading="10. Changes to this policy">
      <p>We may update this policy from time to time. Material changes will be reflected by the “Last updated” date above and, where appropriate, additional notice.</p>
    </Section>

    <Section heading="11. Contact">
      <p>Questions or requests: <a className="text-[#fa7517] hover:underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
    </Section>
  </Shell>
);

// ─────────────────────────────────────────────────────────────────────────────
// TERMS
// ─────────────────────────────────────────────────────────────────────────────
export const TermsPage: React.FC = () => (
  <Shell title="Terms of Service">
    <p className="text-sm text-gray-400">
      These Terms govern your use of BaseTube’s website and tools at beta.base.tube (the “Service”).
      By using the Service, you agree to these Terms.
    </p>

    <Section heading="1. Eligibility & accounts">
      <p>You must be able to form a binding contract and comply with all applicable laws. You are responsible for activity under your account and for keeping your credentials secure.</p>
    </Section>

    <Section heading="2. The Service">
      <p>BaseTube provides a Channel Packaging Audit (analysis of your recent thumbnails and titles, with feedback and suggested fixes) and AI-assisted thumbnail tools. The audit produces <strong>observations, hypotheses, and suggested tests</strong> — it does <strong>not</strong> predict click-through rate and makes <strong>no guarantee of views, CTR, or growth</strong>. Outcomes depend on many factors outside our control.</p>
    </Section>

    <Section heading="3. Connecting your YouTube channel">
      <p>If you connect your channel, you authorize us to access read-only YouTube data and Analytics as described in our <Link className="text-[#fa7517] hover:underline" to="/privacy">Privacy Policy</Link>, and you agree to the <A href="https://www.youtube.com/t/terms">YouTube Terms of Service</A>. You may disconnect at any time via your Google Account permissions.</p>
    </Section>

    <Section heading="4. Credits & payments">
      <p>Certain features consume credits, purchased in packs via Stripe. Prices are shown at checkout. Credits are consumed per action; see our <Link className="text-[#fa7517] hover:underline" to="/refund">Refund Policy</Link>.</p>
    </Section>

    <Section heading="5. Acceptable use">
      <p>Do not use the Service to violate the law or others’ rights, to infringe intellectual property, to generate deceptive or harmful content, to impersonate others, or to interfere with or abuse the Service or its providers (including YouTube).</p>
    </Section>

    <Section heading="6. Intellectual property & generated content">
      <p>You retain rights to the inputs you provide. Subject to these Terms and your payment, you may use the images the Service generates for you. You are responsible for ensuring your inputs and use of outputs comply with applicable rights and platform policies.</p>
    </Section>

    <Section heading="7. Disclaimers & limitation of liability">
      <p>The Service is provided “as is”, without warranties of any kind, and without any guarantee of results. To the maximum extent permitted by law, BaseTube is not liable for indirect, incidental, or consequential damages, and our total liability is limited to the amounts you paid us in the 3 months before the claim.</p>
    </Section>

    <Section heading="8. Termination">
      <p>You may stop using the Service at any time. We may suspend or terminate access for violations of these Terms or to protect the Service.</p>
    </Section>

    <Section heading="9. Changes to these Terms">
      <p>We may update these Terms; material changes are indicated by the “Last updated” date. Continued use after changes constitutes acceptance.</p>
    </Section>

    <Section heading="10. Contact">
      <p><a className="text-[#fa7517] hover:underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
    </Section>
  </Shell>
);

// ─────────────────────────────────────────────────────────────────────────────
// REFUND
// ─────────────────────────────────────────────────────────────────────────────
export const RefundPage: React.FC = () => (
  <Shell title="Refund Policy">
    <Section heading="1. Credit purchases">
      <p>Credits are a prepaid, digital product purchased in packs. Once purchased, credits are added to your balance and consumed as you use paid features.</p>
    </Section>
    <Section heading="2. Consumed vs. unused credits">
      <p><strong>Consumed credits</strong> (an audit or generation that ran) are non-refundable, because the underlying processing and provider costs were incurred. <strong>Unused credits</strong> may be eligible for a refund within 14 days of purchase if the feature failed to deliver due to a fault on our side.</p>
    </Section>
    <Section heading="3. How to request a refund">
      <p>Email {CONTACT} with your account and the transaction reference. We review requests promptly and, where granted, refund to your original payment method via Stripe.</p>
    </Section>
    <Section heading="4. Chargebacks & disputes">
      <p>If you believe a charge is incorrect, please contact us first — we’ll usually resolve it faster than a bank dispute. Fraudulent chargebacks may result in suspension.</p>
    </Section>
    <Section heading="5. Contact">
      <p><a className="text-[#fa7517] hover:underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
    </Section>
  </Shell>
);

export default { TermsPage, PrivacyPage, RefundPage };
