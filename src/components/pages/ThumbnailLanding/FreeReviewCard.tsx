import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ScanSearch } from 'lucide-react';
import { ctrApi } from '../../../api/ctr';

/**
 * "Try it now" for visitors: a free thumbnail review without an account. The
 * number of free reviews a day is the server's (GET /ctr/quota for a visitor).
 * Not shown to a signed-in account: its reviews use credits.
 */
const FreeReviewCard: React.FC = () => {
  const quota = useQuery({
    queryKey: ['ctr', 'visitor-quota'],
    queryFn: () => ctrApi.getQuota(),
    staleTime: 5 * 60_000,
    retry: false,
  });
  const access = quota.data;
  const limit = access?.mode === 'quota' && access.quota.audit.limit > 0 ? access.quota.audit.limit : null;

  return (
    <section aria-labelledby="landing-try-title" className="py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-white/[0.1] bg-[#111113] p-8 text-center sm:flex-row sm:text-left">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#fa7517]/10">
            <ScanSearch className="h-6 w-6 text-[#fa7517]" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <h2 id="landing-try-title" className="text-lg font-semibold text-white">
              Review a thumbnail free — no account needed
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {limit !== null ? `${limit} free review${limit === 1 ? '' : 's'} a day. ` : ''}A score from 1 to 10 and exactly what to change.
            </p>
          </div>
          <Link
            to="/ai-thumbnails/audit"
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/5"
          >
            Try it now
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FreeReviewCard;
