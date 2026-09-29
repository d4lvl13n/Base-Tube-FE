import api from './index';
import type {
  BillingInterval,
  MySubscription,
  SubscriptionCatalog,
  SubscriptionCheckoutSession,
  SubscriptionPlanId,
  UpgradePreview,
} from '../types/subscription';

const BASE = '/api/v1/subscriptions';

interface Envelope<T> {
  success: true;
  data: T;
}

export const subscriptionsApi = {
  // PUBLIC — the plan catalog (prices, videos, credits, channel profiles).
  getPlans: async (): Promise<SubscriptionCatalog> =>
    (await api.get<Envelope<SubscriptionCatalog>>(`${BASE}/plans`)).data.data,

  // AUTH — the account's plan, credits by origin and what it can do next.
  getMe: async (): Promise<MySubscription> => (await api.get<Envelope<MySubscription>>(`${BASE}/me`)).data.data,

  // AUTH — Stripe Checkout for a plan; the caller sends the browser to `url`.
  // `returnPath` (an /ai-thumbnails page) is where the creator lands after paying or cancelling.
  createCheckout: async (body: {
    planId: SubscriptionPlanId;
    interval: BillingInterval;
    returnPath?: string;
  }): Promise<SubscriptionCheckoutSession> =>
    (await api.post<Envelope<SubscriptionCheckoutSession>>(`${BASE}/checkout`, body)).data.data,

  // AUTH — Stripe's customer portal (card, invoices, change or cancel the plan).
  createPortal: async (returnPath?: string): Promise<{ url: string }> =>
    (await api.post<Envelope<{ url: string }>>(`${BASE}/portal`, returnPath ? { returnPath } : {})).data.data,

  // AUTH — what an upgrade charges now; read as soon as an upgrade is offered.
  getUpgradePreview: async (planId: SubscriptionPlanId): Promise<UpgradePreview> =>
    (await api.get<Envelope<UpgradePreview>>(`${BASE}/upgrade-preview`, { params: { planId } })).data.data,

  // AUTH — upgrade now at the previewed charge; answers with the new GET /me.
  upgrade: async (body: { planId: SubscriptionPlanId; prorationDate: number }): Promise<MySubscription> =>
    (await api.post<Envelope<MySubscription>>(`${BASE}/upgrade`, body)).data.data,
};

/** The server's error code and details (`{ success: false, error: { code, message, details } }`). */
export function billingErrorDetails(failure: unknown): { status: number | null; code: string | null; details: Record<string, unknown> | null } {
  const response = (failure as { response?: { status?: unknown; data?: unknown } } | null)?.response;
  const status = typeof response?.status === 'number' ? response.status : null;
  const error = (response?.data as { error?: { code?: unknown; details?: unknown } } | undefined)?.error;
  const code = typeof error?.code === 'string' ? error.code : null;
  const details = error?.details && typeof error.details === 'object' ? (error.details as Record<string, unknown>) : null;
  return { status, code, details };
}

export default subscriptionsApi;
