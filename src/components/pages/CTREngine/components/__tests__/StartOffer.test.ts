import { startOffer, startOfferTerms } from "../billing/StartOffer";

const plan = (id: string, name: string, rank: number, videos: number, month: number) => ({
  id, name, rank, videosPerMonth: videos, creditsPerMonth: videos * 90, channelProfiles: 1, highlights: [],
  prices: { month: { amountCents: month, currency: "usd" }, year: { amountCents: month * 10, currency: "usd", monthlyEquivalentCents: month, savingsPercent: 17 } },
});
const base = {
  videoCredits: 90,
  videoBreakdown: { concepts: 3, conceptCredits: 15, edits: 2, editCredits: 18, audits: 1, auditCredits: 2 },
  rolloverMonths: 1,
  free: { channelProfiles: 1 },
  // Out of rank order on purpose: the trial opens the smallest plan.
  plans: [plan("pro", "Pro", 2, 20, 4900), plan("creator", "Creator", 1, 6, 2400)],
};
const withTrial = { ...base, trial: { days: 7, videos: 2, credits: 180 } } as any;
const noTrial = { ...base, trial: null } as any;
const me = (fields: Record<string, unknown>) => ({ subscription: null, canSubscribe: true, trialEligible: false, ...fields }) as any;

describe("the landing page's start button", () => {
  it("offers a visitor the free trial of the smallest plan, with its terms from the catalog", () => {
    const offer = startOffer({ catalog: withTrial, signedIn: false });
    expect(offer).toMatchObject({ kind: "trial", plan: { id: "creator" }, signedIn: false });
    expect(startOfferTerms(offer)).toBe("2 videos free for 7 days · Cancel before day 8 and pay nothing");
  });

  it("shows the plan with its price when trials are off", () => {
    const offer = startOffer({ catalog: noTrial, signedIn: false });
    expect(offer).toMatchObject({ kind: "plan", plan: { id: "creator" } });
    expect(startOfferTerms(offer)).toBe("Creator: 6 videos a month for $24/month · Cancel any time");
  });

  it("offers an account the trial only when the server says it can have one", () => {
    expect(startOffer({ catalog: withTrial, signedIn: true })).toEqual({ kind: "loading" });
    expect(startOffer({ catalog: withTrial, signedIn: true, me: me({ trialEligible: true }) })).toMatchObject({ kind: "trial", signedIn: true });
    expect(startOffer({ catalog: withTrial, signedIn: true, me: me({ trialEligible: false }) })).toMatchObject({ kind: "plan", signedIn: true });
    expect(startOffer({ catalog: withTrial, signedIn: true, me: me({ canSubscribe: false, subscription: { status: "active" } }) })).toEqual({ kind: "studio" });
  });

  it("sends to the pricing page when the plans cannot be read", () => {
    expect(startOffer({ catalog: undefined, signedIn: false })).toEqual({ kind: "loading" });
    expect(startOffer({ catalog: undefined, catalogFailed: true, signedIn: false })).toEqual({ kind: "unavailable" });
    expect(startOffer({ catalog: withTrial, signedIn: true, meFailed: true })).toEqual({ kind: "unavailable" });
  });
});
