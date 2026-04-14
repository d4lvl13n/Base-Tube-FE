import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Medal, Sparkles, Trophy } from 'lucide-react';
import LeaderboardHeader from './LeaderboardHeader';
import PointsExplainer from './PointsExplainer';
import { useLeaderboard } from '../../../hooks/useLeaderboard';
import { getGrowthModeLabel } from '../../../utils/growth';

const Leaderboard: React.FC = () => {
  const { data, isLoading, error } = useLeaderboard({ limit: 50 });

  if (isLoading) {
    return (
      <>
        <LeaderboardHeader />
        <div className="min-h-[70vh] flex items-center justify-center text-white">
          Loading leaderboard…
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <LeaderboardHeader />
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center text-white max-w-lg">
            <Trophy className="w-10 h-10 text-red-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Leaderboard unavailable</h2>
            <p className="text-white/70">We couldn’t load the latest growth standings right now.</p>
          </div>
        </div>
      </>
    );
  }

  const topThree = data.entries.slice(0, 3);
  const remainingEntries = data.entries.slice(3);
  const modeLabel = getGrowthModeLabel(data.mode);

  return (
    <>
      <LeaderboardHeader />
      <div className="min-h-screen bg-[#050505] text-white">
        <section className="px-4 sm:px-8 pt-16 pb-10 text-center">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6 text-[#fa7517]">
              <Sparkles className="w-6 h-6" />
              <span className="uppercase tracking-[0.25em] text-sm">Growth Leaderboard</span>
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-4xl sm:text-6xl font-black mb-4">Top creators and supporters</h1>
            <p className="text-white/65 max-w-2xl mx-auto text-lg">
              Ranked by visible {modeLabel}. The active growth phase controls what is shown publicly.
            </p>
          </div>
        </section>

        {!data.visible && (
          <div className="max-w-5xl mx-auto px-4 sm:px-8 pb-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
              The leaderboard is currently hidden for this growth phase.
            </div>
          </div>
        )}

        {data.visible && (
          <>
            <section className="max-w-6xl mx-auto px-4 sm:px-8 pb-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {topThree.map((entry, index) => (
                <motion.div
                  key={entry.userId || entry.username}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`rounded-3xl border p-6 text-center ${
                    index === 0
                      ? 'bg-gradient-to-b from-[#fa7517]/20 to-black border-[#fa7517]/40'
                      : 'bg-white/[0.03] border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-center mb-4 text-[#fa7517]">
                    {index === 0 ? <Crown className="w-8 h-8" /> : <Medal className="w-7 h-7" />}
                  </div>
                  <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border border-white/10 bg-white/5">
                    <img
                      src={entry.profileImageUrl || '/images/default-avatar.png'}
                      alt={entry.displayName || entry.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-sm uppercase tracking-[0.2em] text-white/45 mb-2">Rank #{entry.rank}</div>
                  <div className="text-2xl font-bold">{entry.displayName || entry.username}</div>
                  <div className="text-white/50 mt-1">@{entry.username}</div>
                  <div className="mt-5 text-4xl font-black text-[#fa7517]">{entry.score.toLocaleString()}</div>
                  <div className="text-white/55 mt-2">{modeLabel}</div>
                </motion.div>
              ))}
            </section>

            <section className="max-w-6xl mx-auto px-4 sm:px-8 pb-20">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
                <div className="grid grid-cols-[80px,1fr,140px] px-6 py-4 text-xs uppercase tracking-[0.18em] text-white/40 border-b border-white/10">
                  <div>Rank</div>
                  <div>User</div>
                  <div className="text-right">{modeLabel}</div>
                </div>
                {remainingEntries.map((entry) => (
                  <div
                    key={entry.userId || entry.username}
                    className="grid grid-cols-[80px,1fr,140px] items-center gap-4 px-6 py-4 border-b border-white/5 last:border-b-0"
                  >
                    <div className="text-white/55 font-semibold">#{entry.rank}</div>
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-white/5 flex-shrink-0">
                        <img
                          src={entry.profileImageUrl || '/images/default-avatar.png'}
                          alt={entry.displayName || entry.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{entry.displayName || entry.username}</div>
                        <div className="text-sm text-white/45 truncate">@{entry.username}</div>
                      </div>
                    </div>
                    <div className="text-right font-bold text-[#fa7517]">{entry.score.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <PointsExplainer />
      </div>
    </>
  );
};

export default Leaderboard;
