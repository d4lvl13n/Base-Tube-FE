// LEGAL DRAFT — NOT REVIEWED BY COUNSEL — must be validated by the owner before pass sales are switched on
//
// src/pages/legal/PassLegalPages.tsx
// "Terms of Sale for Content Passes" (/terms/content-passes) and "Creator Pass Terms"
// (/terms/creator-passes). The checkout box "I accept the Terms of Sale and the Creator Pass
// Terms." links here. These drafts describe the product as it will be when passes go on sale:
// a limited number of passes, owned by their holders on Base, resellable on the BaseTube
// marketplace, with a royalty to the creator on each resale.
// Placeholders still to fill: [COMPANY LEGAL NAME], [REGISTERED ADDRESS], [COMPANY REGISTRATION
// NUMBER], [VAT NUMBER], [VAT TREATMENT], [GOVERNING LAW AND COURTS],
// [MARKETPLACE RULES], [WITHDRAWAL AND RESALE]. The resale split is the owner's decision of
// 2026-11-13 (5% creator royalty, 2% BaseTube resale fee, 93% to the seller), read from utils/passTerms.
// Statements a lawyer must confirm (in addition to the list in the hand-over report):
// - that a holder may resell a pass on the BaseTube marketplace, and that access moves with it;
// - the creator royalty on each resale (rate, who pays it, how it is collected and paid out);
// - the neutral sentence that BaseTube makes no promise about resale value and does not present
//   passes as investments;
// - how the 14-day withdrawal waiver applies to a pass bought from another holder, and how
//   refunds and chargebacks of the first sale work once the pass has been resold.

import React from 'react';
import { Link } from 'react-router-dom';
import { CONTACT, Section, Shell } from './LegalStubs';
import { DECIDED_RESALE_TERMS, pctText } from '../../utils/passTerms';

const ROYALTY = pctText(DECIDED_RESALE_TERMS.creatorPct);
const RESALE_FEE = pctText(DECIDED_RESALE_TERMS.platformPct);
const SELLER_KEEPS = pctText(DECIDED_RESALE_TERMS.sellerPct);

const UPDATED = '13 November 2026';

const L: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <Link className="text-[#fa7517] hover:underline" to={to}>
    {children}
  </Link>
);

const Mail: React.FC = () => (
  <a className="text-[#fa7517] hover:underline" href={`mailto:${CONTACT}`}>
    {CONTACT}
  </a>
);

// ─────────────────────────────────────────────────────────────────────────────
// TERMS OF SALE FOR CONTENT PASSES (buyers)
// ─────────────────────────────────────────────────────────────────────────────
export const PassTermsOfSalePage: React.FC = () => (
  <Shell title="Terms of Sale for Content Passes" updated={UPDATED}>
    <p className="text-sm text-gray-400">
      These terms apply when you buy or hold a Content Pass on BaseTube. A Content Pass is one of a limited number
      of passes, created by a creator, that gives its holder access to a set of videos chosen by that creator.
      Please read them with the <L to="/terms/creator-passes">Creator Pass Terms</L>{' '}
      and the <L to="/privacy#passes-and-creators">Passes and creators section of our Privacy Policy</L>.
    </p>

    <Section heading="1. Who sells the pass">
      <p>
        The creator who publishes a pass is the seller of that pass when it is first sold. When a holder resells a
        pass on the BaseTube marketplace, that holder is the seller (see section 6). BaseTube is operated by
        [COMPANY LEGAL NAME], [REGISTERED ADDRESS] (“BaseTube”). BaseTube runs the platform, the checkout, the
        marketplace and the video player, and keeps a platform fee of 10% of each first sale. The creator’s channel
        name is shown on the pass page.
      </p>
      <p>
        Card payments are processed by Stripe. Crypto payments are made from your own wallet to a smart contract
        on the Base network.
      </p>
    </Section>

    <Section heading="2. What you get">
      <ul className="list-disc pl-5 space-y-1">
        <li>The pass itself, owned by you on the Base network (see section 5).</li>
        <li>For as long as you hold the pass, access to stream every video listed in it inside BaseTube, as many times as you want.</li>
        <li>The videos are hosted on YouTube as unlisted videos and play inside BaseTube. BaseTube does not host them.</li>
        <li>The creator may add videos to a pass after you buy it. The price, title and number of passes cannot be changed once a pass is published, and no more passes than that number are ever created.</li>
        <li>You get access to watch, not ownership of the videos and no right to download, copy, share or show them publicly.</li>
        <li>BaseTube does not promise that the videos are not available anywhere else.</li>
      </ul>
    </Section>

    <Section heading="3. Price and payment">
      <ul className="list-disc pl-5 space-y-1">
        <li>Prices are shown in euros. [VAT TREATMENT: state whether prices include VAT and who charges it.]</li>
        <li>You pay once. A pass is not a subscription.</li>
        <li><strong>Card:</strong> paid in euros through Stripe. BaseTube never receives your full card number.</li>
        <li><strong>Crypto:</strong> paid in USDC on the Base network from a wallet linked to your BaseTube account, at 1 USDC for each euro of the price. You pay the network fee for the transaction. While BaseTube is in test mode, crypto payments run on the Base Sepolia test network, which uses test tokens with no value.</li>
        <li>You can buy up to 20 passes in one checkout.</li>
      </ul>
    </Section>

    <Section heading="4. When access starts and how long it lasts">
      <p>
        Access starts as soon as your payment is confirmed: for a card, when Stripe confirms it; for crypto, when
        your transaction is confirmed on the network and checked by BaseTube.
      </p>
      <p>
        Access has no fixed end date: it belongs to the holder of the pass, for as long as they hold it. The videos
        are hosted by the creator on YouTube: if a creator deletes a video or makes it private on YouTube, or if
        BaseTube stops offering passes, videos may stop playing. Your access ends when you resell the
        pass, or if your payment is refunded or disputed (see sections 8 and 9).
      </p>
    </Section>

    <Section heading="5. Your pass on the Base network">
      <p>
        Each pass is a digital token on the Base network (an NFT, created with Unlock Protocol). If you pay in USDC,
        your pass is created in your wallet. If you pay by card, BaseTube holds your pass for you until you ask, from
        your profile, for it to be created in a wallet you choose.
      </p>
      <p>Access to the pass’s videos belongs to whoever currently holds the pass.</p>
    </Section>

    <Section heading="6. Reselling your pass" id="resale">
      <p>
        You may resell your pass on the BaseTube marketplace, at the price you choose, under the marketplace’s rules
        [MARKETPLACE RULES: link to be added]. When the sale completes, the pass and the access it gives move to the
        buyer, and your access ends.
      </p>
      <p>
        Each resale pays a royalty of {ROYALTY} of the sale price to the creator of the pass, and a resale fee of{' '}
        {RESALE_FEE} of the sale price to BaseTube. Both are taken from the sale price; the seller receives the other{' '}
        {SELLER_KEEPS}. The royalty and the fee are shown before you list or buy a pass on the marketplace.
      </p>
      <p>
        BaseTube makes no promise about the price at which a pass can be resold, and does not present passes as
        investments.
      </p>
    </Section>

    <Section heading="7. Your 14-day right of withdrawal" id="withdrawal">
      <p>
        If you are a consumer in the European Union, you normally have 14 days to withdraw from an online purchase
        without giving a reason. For digital content that is supplied straight away, this right ends once supply
        has begun, if you asked for immediate supply and acknowledged that you would lose the right.
      </p>
      <p>
        Before you can pay, BaseTube asks you to tick a box saying: “I expressly request immediate access to this
        digital content and acknowledge that, once delivery or streaming begins, I lose my 14-day right of
        withdrawal.” BaseTube records that you ticked it, the version of the sentence and the time, with your
        purchase. Access is supplied as soon as payment is confirmed.
      </p>
      <p>[WITHDRAWAL AND RESALE: how this applies to a pass bought from another holder on the marketplace, to be confirmed.]</p>
    </Section>

    <Section heading="8. Refunds">
      <ul className="list-disc pl-5 space-y-1">
        <li>There is no refund for a change of mind once access has been supplied (see section 7).</li>
        <li>If the pass does not work as described, for example a video never plays, write to <Mail /> with your account and the pass. Your rights under consumer law for faulty or missing digital content still apply.</li>
        <li>There is no self-service refund button. BaseTube reviews each request and, where a refund is due, refunds a card payment to the same card through Stripe. A full refund also returns BaseTube’s platform fee.</li>
        <li>A refund ends your access to the pass. A partial refund for less than the price of one pass does not end access by itself; it is reviewed by hand.</li>
        <li>USDC payments cannot be reversed on the blockchain. If you paid in USDC and believe a remedy is due, write to <Mail /> and we will review it.</li>
      </ul>
    </Section>

    <Section heading="9. Card disputes (chargebacks)">
      <p>
        Please contact us before opening a dispute with your bank; it is usually faster. When a dispute is opened
        on a card payment, access to that pass ends and the account can no longer buy passes on BaseTube.
      </p>
    </Section>

    <Section heading="10. What the creator sees about you">
      <p>
        The creator sees that you bought the pass, your display name, your email address, whether your access is
        active, and whether you have opened each video, so they can provide access and support. The creator can
        email you about new releases only if you tick the optional box at checkout, and you can withdraw that at any
        time in <L to="/my-passes">My Passes</L>. Details are in the{' '}
        <L to="/privacy#passes-and-creators">Passes and creators section of our Privacy Policy</L>.
      </p>
    </Section>

    <Section heading="11. Changes, law and contact">
      <p>
        We may update these terms. The version you accepted is recorded with your purchase and keeps applying to
        it. [GOVERNING LAW AND COURTS: to be confirmed.] Mandatory consumer protections of the country where you
        live are not affected.
      </p>
      <p>
        Contact: <Mail />. [COMPANY LEGAL NAME], [REGISTERED ADDRESS], [COMPANY REGISTRATION NUMBER], [VAT NUMBER].
      </p>
    </Section>
  </Shell>
);

// ─────────────────────────────────────────────────────────────────────────────
// CREATOR PASS TERMS (creators who sell, and what buyers can expect from them)
// ─────────────────────────────────────────────────────────────────────────────
export const CreatorPassTermsPage: React.FC = () => (
  <Shell title="Creator Pass Terms" updated={UPDATED}>
    <p className="text-sm text-gray-400">
      These terms apply between BaseTube ([COMPANY LEGAL NAME], [REGISTERED ADDRESS]) and every creator who sells a
      Content Pass, and tell buyers what they can expect from the creator. Buyers accept them at checkout together
      with the <L to="/terms/content-passes">Terms of Sale for Content Passes</L>.
    </p>

    <Section heading="1. Who can sell">
      <ul className="list-disc pl-5 space-y-1">
        <li>You need a YouTube channel that is verified on BaseTube and approved for pass sales.</li>
        <li>You choose how you want to be paid. To be paid for card sales through Stripe, you need a Stripe account connected to BaseTube that can accept payments; card checkout does not work until it can. To be paid in USDC, you need a wallet address.</li>
        <li>BaseTube can approve, pause or stop pass sales for a channel. Stopping sales does not remove access from people who hold a pass.</li>
      </ul>
    </Section>

    <Section heading="2. What you sell">
      <ul className="list-disc pl-5 space-y-1">
        <li>A pass gives its holder access to watch your own YouTube videos inside BaseTube. Each video must be unlisted on YouTube when you add it, and you must own it or have the rights to sell access to it.</li>
        <li>You are the seller of the pass to its first buyer. You are responsible for the content and for describing it honestly on the pass page.</li>
        <li>The price is set in euros (at least €1.00). You set the number of passes. Once a pass is published, its price, title and number of passes cannot be changed, and no more passes than that number are ever created. You can still add videos.</li>
        <li>Each pass is owned by its holder on the Base network and may be resold on the BaseTube marketplace. Access to your videos moves with the pass to each new holder.</li>
        <li>Keep the videos in a pass available on YouTube. If a video is deleted or made private, holders lose access to it and buyers may be entitled to a refund under consumer law.</li>
        <li>Do not present a pass as an investment or promise buyers that it will gain value.</li>
      </ul>
    </Section>

    <Section heading="3. Platform fee, royalties and payouts">
      <ul className="list-disc pl-5 space-y-1">
        <li>BaseTube keeps 10% of each first sale of a pass, rounded down to the smallest currency unit. You receive the other 90%.</li>
        <li><strong>Card sales</strong> are charged on your connected Stripe account, with BaseTube’s fee taken as a Stripe application fee. Stripe’s card processing fees come out of your share. Stripe pays your balance out on its own payout schedule.</li>
        <li><strong>USDC sales</strong> go to a payment-split contract on Base that sends 90% to your payout wallet and 10% to BaseTube. BaseTube runs this distribution once a day, at 02:00 UTC, when at least 0.5 USDC is waiting.</li>
        <li>Payouts are not instant on either rail.</li>
        <li>Each time one of your passes is resold on the BaseTube marketplace, you receive a royalty of {ROYALTY} of the resale price, and BaseTube keeps a resale fee of {RESALE_FEE}; the seller receives the other {SELLER_KEEPS}. This applies under the marketplace’s rules [MARKETPLACE RULES: link to be added].</li>
      </ul>
    </Section>

    <Section heading="4. Refunds and disputes">
      <ul className="list-disc pl-5 space-y-1">
        <li>Buyers waive their 14-day withdrawal right when they ask for immediate access at checkout. They keep their consumer-law rights if the content is faulty or missing.</li>
        <li>Refund requests go to BaseTube support; there is no self-service refund. When BaseTube refunds a card sale, the refund is taken from your Stripe account and BaseTube returns its platform fee. A refund ends the buyer’s access.</li>
        <li>Card disputes are handled under Stripe’s rules on your Stripe account. A dispute ends the buyer’s access while the purchase is marked disputed.</li>
        <li>USDC sales cannot be reversed on the blockchain.</li>
      </ul>
    </Section>

    <Section heading="5. Buyer information and contacting buyers">
      <ul className="list-disc pl-5 space-y-1">
        <li>You see the commercial relationship with people who paid you: who bought which pass, when, how much you received, access status, refunds, new or returning buyer, whether they have opened each video, and a general label for where they came from. You see a buyer’s email address only when they were told about it at checkout and the address is real.</li>
        <li>You never see card details, IP addresses, device details, exact viewing times, or anything about people who did not buy (visits and abandoned checkouts are shown as totals only).</li>
        <li>Use buyer information only to provide access and support for what they bought.</li>
        <li>Email a buyer about new releases only if that buyer allowed it at checkout, and stop as soon as they withdraw it. Buyers can withdraw at any time in their account; you then no longer see them as contactable.</li>
        <li>Do not sell, rent or pass buyer information to anyone else.</li>
      </ul>
    </Section>

    <Section heading="6. Changes, law and contact">
      <p>
        BaseTube may update these terms and will show the date of the change above. [GOVERNING LAW AND COURTS: to be
        confirmed.] Contact: <Mail />.
      </p>
    </Section>
  </Shell>
);
