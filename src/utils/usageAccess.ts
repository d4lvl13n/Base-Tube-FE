import {
  CreditInfo,
  CreditPricingCatalog,
  CTRQuotaStatus,
  CTRUsageAccess,
  GeneratorQuotaInfo,
  GeneratorUsageAccess,
  QuotaInfo,
  UsageTier,
} from '../types/ctr';

const isObject = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null;

const getPayload = (raw: unknown): Record<string, any> | null => {
  if (!isObject(raw)) return null;
  if (isObject(raw.data)) return raw.data;
  return raw;
};

const normalizeTier = (value: unknown, fallback: UsageTier = 'anonymous'): UsageTier => {
  if (value === 'free' || value === 'pro' || value === 'enterprise' || value === 'anonymous') {
    return value;
  }
  return fallback;
};

export const normalizeQuotaInfo = (raw: unknown): QuotaInfo | null => {
  if (!isObject(raw)) return null;

  const used = Number(raw.used);
  const limit = Number(raw.limit);
  const remaining = Number(raw.remaining);
  const resetsAt = typeof raw.resetsAt === 'string' ? raw.resetsAt : '';

  if ([used, limit, remaining].some(Number.isNaN)) {
    return null;
  }

  return {
    used,
    limit,
    remaining,
    resetsAt,
  };
};

export const normalizeGeneratorQuotaInfo = (raw: unknown): GeneratorQuotaInfo | null => {
  const quotaInfo = normalizeQuotaInfo(raw);
  if (!quotaInfo || !isObject(raw)) return null;

  return {
    ...quotaInfo,
    isAnonymous: Boolean(raw.isAnonymous),
    tier: normalizeTier(raw.tier, Boolean(raw.isAnonymous) ? 'anonymous' : 'free'),
    upgradeUrl: typeof raw.upgradeUrl === 'string' ? raw.upgradeUrl : undefined,
    message: typeof raw.message === 'string' ? raw.message : undefined,
  };
};

export const normalizeCreditInfo = (raw: unknown): CreditInfo | null => {
  if (!isObject(raw)) return null;

  const balance = Number(raw.balance);
  const reserved = Number(raw.reserved);
  const available = Number(raw.available);

  if ([balance, reserved, available].some(Number.isNaN)) {
    return null;
  }

  return {
    balance,
    reserved,
    available,
  };
};

export const normalizeCreditPricingCatalog = (raw: unknown): CreditPricingCatalog | null => {
  if (!isObject(raw) || !isObject(raw.thumbnail) || !isObject(raw.ctr)) {
    return null;
  }

  const pricing: CreditPricingCatalog = {
    thumbnail: {
      generatePerImage: Number(raw.thumbnail.generatePerImage),
      editPerImage: Number(raw.thumbnail.editPerImage),
      variationPerImage: Number(raw.thumbnail.variationPerImage),
    },
    ctr: {
      audit: Number(raw.ctr.audit),
      auditWithPersonas: Number(raw.ctr.auditWithPersonas),
      generatePerConcept: Number(raw.ctr.generatePerConcept),
    },
  };

  const allValues = [
    pricing.thumbnail.generatePerImage,
    pricing.thumbnail.editPerImage,
    pricing.thumbnail.variationPerImage,
    pricing.ctr.audit,
    pricing.ctr.auditWithPersonas,
    pricing.ctr.generatePerConcept,
  ];

  if (allValues.some(Number.isNaN)) {
    return null;
  }

  return pricing;
};

export const normalizeUsageAccessResponse = (
  raw: unknown
): GeneratorUsageAccess | CTRUsageAccess | null => {
  const payload = getPayload(raw);
  if (!payload) return null;

  if (payload.mode === 'credits' || payload.creditInfo) {
    const creditInfo = normalizeCreditInfo(payload.creditInfo);
    if (!creditInfo) return null;

    return {
      mode: 'credits',
      creditInfo,
      pricing: normalizeCreditPricingCatalog(payload.pricing),
    };
  }

  if (payload.audit && payload.generate) {
    const audit = normalizeQuotaInfo(payload.audit);
    const generate = normalizeQuotaInfo(payload.generate);

    if (!audit || !generate) return null;

    return {
      mode: 'quota',
      quota: {
        audit,
        generate,
        tier: normalizeTier(payload.tier, payload.isAnonymous ? 'anonymous' : 'free'),
        isAnonymous: Boolean(payload.isAnonymous),
        limits: payload.limits ?? {
          audit: { anonymous: 0, free: 0, pro: 0, enterprise: 0 },
          generate: { anonymous: 0, free: 0, pro: 0, enterprise: 0 },
        },
      } as CTRQuotaStatus,
    };
  }

  const generatorQuota = normalizeGeneratorQuotaInfo(payload);
  if (!generatorQuota) return null;

  return {
    mode: 'quota',
    quotaInfo: generatorQuota,
  };
};

type OperationAccessUpdate =
  | {
      mode: 'credits';
      creditInfo: CreditInfo;
      pricing: CreditPricingCatalog | null;
    }
  | {
      mode: 'quota';
      quotaInfo: QuotaInfo;
    };

export const getOperationAccessUpdate = (
  payload: unknown
): OperationAccessUpdate | null => {
  const data = getPayload(payload);
  if (!data) return null;

  if (data.creditInfo) {
    const creditInfo = normalizeCreditInfo(data.creditInfo);
    if (!creditInfo) return null;

    return {
      mode: 'credits',
      creditInfo,
      pricing: normalizeCreditPricingCatalog(data.pricing),
    };
  }

  if (data.quotaInfo) {
    const quotaInfo = normalizeQuotaInfo(data.quotaInfo);
    if (!quotaInfo) return null;
    return {
      mode: 'quota',
      quotaInfo,
    };
  }

  return null;
};

export const updateCTRUsageFromOperation = (
  current: CTRUsageAccess | null,
  payload: unknown,
  operation: 'audit' | 'generate'
): CTRUsageAccess | null => {
  const update = getOperationAccessUpdate(payload);
  if (!update) return current;

  if (update.mode === 'credits') {
    return {
      mode: 'credits',
      creditInfo: update.creditInfo,
      pricing: update.pricing ?? (current?.mode === 'credits' ? current.pricing : null),
    };
  }

  if (!current || current.mode !== 'quota') {
    return current;
  }

  return {
    mode: 'quota',
    quota: {
      ...current.quota,
      [operation]: update.quotaInfo,
    },
  };
};

export const formatCreditCost = (cost: number, noun: string = 'credit'): string =>
  `${cost} ${noun}${cost === 1 ? '' : 's'}`;
