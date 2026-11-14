import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import {
  listCreatorContactConsents,
  withdrawCreatorContactConsent,
} from '../../api/creatorContactConsents';
import { PASSES_PRIVACY_ANCHOR } from '../../constants/passConsent';

const QUERY_KEY = ['creator-contact-consents'];

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
};

/**
 * "Creators who can email you": the creators this buyer allowed, at checkout,
 * to email them about new releases — with a way to withdraw each one.
 * Hidden entirely when the server does not offer the endpoint or it fails.
 */
const CreatorContactConsents: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: listCreatorContactConsents,
    retry: false,
    staleTime: 60_000,
  });
  const withdraw = useMutation({
    mutationFn: withdrawCreatorContactConsent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  if (isLoading || isError || data == null) return null;

  return (
    <section className="mt-12 p-6 border border-gray-800 rounded-xl bg-black">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="w-5 h-5 text-[#fa7517]" />
        <h2 className="text-xl font-bold text-white">Creators who can email you</h2>
      </div>
      <p className="text-gray-400 text-sm mb-4 max-w-2xl">
        When you bought a pass, you could let its creator email you about new releases. Withdraw it here at any
        time; the creator then stops seeing you as someone they can contact.{' '}
        <a href={PASSES_PRIVACY_ANCHOR} className="text-[#fa7517] hover:underline">
          What creators see
        </a>
      </p>

      {data.length === 0 ? (
        <p className="text-gray-500 text-sm">You have not allowed any creator to email you.</p>
      ) : (
        <ul className="divide-y divide-gray-800 border-t border-gray-800">
          {data.map((item) => {
            const name = item.channelName || item.creatorName || 'A creator';
            const since = formatDate(item.grantedAt);
            const pending = withdraw.isPending && withdraw.variables === item.creatorUserId;
            return (
              <li key={item.creatorUserId} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-white text-sm truncate">{name}</p>
                  {since ? <p className="text-gray-500 text-xs">Allowed on {since}</p> : null}
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => withdraw.mutate(item.creatorUserId)}
                  className="px-4 py-2 bg-black border border-gray-800 rounded-lg text-sm text-white hover:bg-gray-900 disabled:opacity-50"
                >
                  {pending ? 'Withdrawing…' : 'Withdraw'}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {withdraw.isError ? (
        <p className="text-red-400 text-sm mt-3">That did not work. Try again in a moment.</p>
      ) : null}
    </section>
  );
};

export default CreatorContactConsents;
