import React, { useEffect, useRef, useState } from 'react';
import { ctrApi } from '../../api/ctr';
import { AuditContext, CTRUsageAccess, ThumbnailAudit } from '../../types/ctr';
import { updateCTRUsageFromOperation } from '../../utils/usageAccess';

export interface ComparisonConcept {
  id: string;
  imageUrl: string;
  name: string;
}

export function ThumbnailConceptComparison({ concepts, context, onComplete }: {
  concepts: ComparisonConcept[];
  context?: AuditContext;
  onComplete?: () => void | Promise<void>;
}) {
  const [access, setAccess] = useState<CTRUsageAccess | null>(null);
  const [results, setResults] = useState<Record<string, ThumbnailAudit>>({});
  const [failures, setFailures] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const running = useRef(false);
  const mounted = useRef(true);
  const contextKey = JSON.stringify([context?.title || '', context?.description || '', context?.niche || '', context?.tags || []]);
  const candidates = concepts.slice(0, 5);
  const keyFor = (concept: ComparisonConcept) => JSON.stringify([concept.imageUrl, contextKey]);
  const signature = JSON.stringify(candidates.map(keyFor));
  const latestSignature = useRef(signature);
  latestSignature.current = signature;
  const complete = useRef(onComplete);
  complete.current = onComplete;
  const pending = candidates.filter((concept, index) => !results[keyFor(concept)] && candidates.findIndex(candidate => keyFor(candidate) === keyFor(concept)) === index);
  const rate = access?.mode === 'credits' ? access.pricing?.ctr.auditWithPersonas : undefined;
  const total = rate === undefined ? undefined : rate * pending.length;
  const remaining = access?.mode === 'quota' ? access.quota.audit.remaining : undefined;
  const allowed = access?.mode === 'credits'
    ? total !== undefined && access.creditInfo.available >= total
    : remaining !== undefined && (remaining === -1 || remaining >= pending.length);

  useEffect(() => {
    mounted.current = true;
    ctrApi.getQuota().then(value => { if (mounted.current) setAccess(value); }).catch(() => {
      if (mounted.current) setError('Could not load audit access. Retry below.');
    });
    return () => { mounted.current = false; };
  }, []);

  const compare = async () => {
    if (running.current || !pending.length) return;
    if (!access) {
      try { setAccess(await ctrApi.getQuota()); setError(''); }
      catch { setError('Could not load audit access. Please try again.'); }
      return;
    }
    if (!allowed) return;
    running.current = true;
    setBusy(true);
    setError('');
    try {
      for (const concept of pending) {
        if (!mounted.current || latestSignature.current !== signature) break;
        const key = keyFor(concept);
        try {
          const result = await ctrApi.auditThumbnail({ imageUrl: concept.imageUrl, includePersonas: true, context });
          if (!mounted.current) break;
          if (!result.audit || !Number.isFinite(result.audit.overallScore)) throw new Error('The audit returned no usable assessment.');
          setResults(previous => ({ ...previous, [key]: result.audit }));
          setFailures(previous => ({ ...previous, [key]: '' }));
          setAccess(previous => previous ? updateCTRUsageFromOperation(previous, result, 'audit') || previous : previous);
        } catch (failure: any) {
          if (!mounted.current) break;
          const message = failure.response?.data?.error?.message || failure.message || 'Assessment failed. Retry this concept.';
          setFailures(previous => ({ ...previous, [key]: message }));
          if ([401, 402, 429].includes(failure.response?.status)) {
            setError(message);
            break;
          }
        }
      }
    } finally {
      running.current = false;
      if (mounted.current) {
        setBusy(false);
        try {
          const nextAccess = await ctrApi.getQuota();
          if (mounted.current) setAccess(nextAccess);
        } catch { /* Keep the last server-provided access state. */ }
        try { if (mounted.current) await complete.current?.(); } catch { /* Assessments remain usable if the surrounding balance refresh fails. */ }
      }
    }
  };

  return <section className="my-5 rounded-xl border border-white/10 bg-black/25 p-4 text-white" aria-label="Concept comparison">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="font-semibold">Compare concepts with audience personas</h3>
        <p className="mt-1 text-xs text-gray-400">AI assessments of these images, not measured CTR or real audience votes. Editing an image requires a new assessment.</p>
      </div>
      <button type="button" onClick={compare} disabled={busy || !pending.length || (!!access && !allowed)} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-40">
        {busy ? 'Comparing…' : !access ? 'Load audit access' : pending.length ? `Compare ${pending.length} concept${pending.length === 1 ? '' : 's'}` : 'Comparison complete'}
      </button>
    </div>
    {access?.mode === 'credits' && <p className="mt-2 text-xs text-gray-400">{total === undefined ? 'Audit pricing unavailable.' : `Up to ${total} credits for the remaining assessments. ${access.creditInfo.available} available.`}</p>}
    {access?.mode === 'quota' && <p className="mt-2 text-xs text-gray-400">Uses {pending.length} audits from your allowance. {remaining === -1 ? 'Unlimited' : remaining} remaining.</p>}
    {access && !allowed && pending.length > 0 && <p className="mt-2 text-xs text-orange-300">Not enough audit allowance or credits for this comparison.</p>}
    {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
    <div className="mt-4 grid gap-3 md:grid-cols-3">
      {candidates.map(concept => {
        const key = keyFor(concept);
        const audit = results[key];
        return <article key={concept.id} className="rounded-lg border border-white/10 p-3">
          <img src={concept.imageUrl} alt={concept.name} className="aspect-video w-full rounded object-contain bg-black" />
          <h4 className="mt-2 text-sm font-semibold">{concept.name}</h4>
          {audit ? <>
            <p className="mt-2 text-sm">AI assessment: {audit.overallScore.toFixed(1)}/10 <span className="text-xs text-gray-400">({audit.confidence} confidence)</span></p>
            {audit.strengths?.[0] && <p className="mt-2 text-xs text-emerald-300">Strength: {audit.strengths[0]}</p>}
            {audit.weaknesses?.[0] && <p className="mt-2 text-xs text-orange-300">Weakness: {audit.weaknesses[0]}</p>}
            {audit.suggestions?.[0] && <p className="mt-2 text-xs text-gray-300">Suggested change: {audit.suggestions[0]}</p>}
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-gray-300">Persona feedback</summary>
              {audit.personaVotes?.votes?.length ? audit.personaVotes.votes.map((vote, index) => <p key={index} className="mt-2 text-gray-400"><strong className="text-white">{vote.personaName}: {vote.wouldClick ? 'would click' : 'would skip'}</strong><br />{vote.reasoning}</p>) : <p className="mt-2 text-gray-400">Persona feedback unavailable for this assessment.</p>}
            </details>
          </> : <p className="mt-2 text-xs text-gray-400">{failures[key] || 'Not assessed yet.'}</p>}
        </article>;
      })}
    </div>
  </section>;
}
