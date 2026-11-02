/** Shared credits buy either new Studio thumbnails, AI edits or audits. */
export function thumbnailAllowanceText(credits: number, generationCredits: number, period = ' per month'): string {
  if (!Number.isFinite(credits) || credits < 0 || !Number.isFinite(generationCredits) || generationCredits <= 0) {
    return `${credits.toLocaleString('en-US')} shared credits${period}`;
  }
  const count = Math.floor(credits / generationCredits);
  return `Up to ${count.toLocaleString('en-US')} AI thumbnail${count === 1 ? '' : 's'}${period}`;
}

export const SHARED_CREDIT_EXPLANATION = 'Maximum when all credits are used for new thumbnails. AI edits, thumbnail reviews and channel audits use the same balance and reduce the number you can generate.';

export function creditUsageText(breakdown: { conceptCredits: number; editCredits: number; auditCredits: number }): string {
  return `Generation: ${breakdown.conceptCredits} credits · AI edit: ${breakdown.editCredits} credits · Thumbnail review: from ${breakdown.auditCredits} credits.`;
}
