import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  Flag,
  Gift,
  HelpCircle,
  Lock,
  Loader2,
  Search,
  ScrollText,
  Star,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import Loader from '../Loader';
import Error from '../Error';
import { LineChart } from '../../../components/pages/CreatorHub/Analytics/charts/LineChart';
import {
  useGrowthHistory,
  useGrowthMe,
  useGrowthMissions,
  useGrowthQuests,
  useGrowthRedemptions,
  useGrowthRewards,
  useRedeemGrowthReward,
} from '../../../hooks/useGrowth';
import { getGrowthModeLabel, getLayerLabel, getProgressStatusLabel, getRedemptionStatusLabel } from '../../../utils/growth';

const PointsTab: React.FC = () => {
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  const growthMe = useGrowthMe();
  const missions = useGrowthMissions();
  const quests = useGrowthQuests();
  const history = useGrowthHistory({ limit: 100 });
  const rewards = useGrowthRewards();
  const redemptions = useGrowthRedemptions({ limit: 20, offset: 0 });
  const redeemReward = useRedeemGrowthReward();
  const [recentRedeemedRewardId, setRecentRedeemedRewardId] = useState<number | null>(null);

  const visibility = growthMe.data?.visibility;
  const now = Date.now();
  const cutoff = period === '24h'
    ? now - 24 * 60 * 60 * 1000
    : period === '7d'
    ? now - 7 * 24 * 60 * 60 * 1000
    : now - 30 * 24 * 60 * 60 * 1000;

  const filteredEntries = (history.data?.entries || []).filter((entry) => {
    return new Date(entry.createdAt).getTime() >= cutoff;
  });

  const chartData = useMemo(() => {
    const daily = new Map<string, number>();
    filteredEntries
      .filter((entry) => entry.layer === 'xp')
      .forEach((entry) => {
        const key = format(new Date(entry.createdAt), 'MMM d');
        const signedAmount = ['burn', 'revoke', 'expire'].includes(entry.direction) ? -entry.amount : entry.amount;
        daily.set(key, (daily.get(key) || 0) + signedAmount);
      });

    return Array.from(daily.entries()).map(([date, xp]) => ({ date, xp }));
  }, [filteredEntries]);

  if (growthMe.isLoading || missions.isLoading || quests.isLoading || history.isLoading || rewards.isLoading || redemptions.isLoading) {
    return <Loader />;
  }

  if (growthMe.error || missions.error || quests.error || history.error || rewards.error || redemptions.error || !growthMe.data) {
    return <Error message="Failed to load your growth data" />;
  }

  const leaderboardModeLabel = getGrowthModeLabel(visibility.leaderboardMode);
  const hasRewards = !!rewards.data?.items.length;
  const hasRedemptions = !!redemptions.data?.items.length;
  const hasMissions = !!(missions.data?.enabled && missions.data.items.length > 0);
  const hasQuests = !!(quests.data?.enabled && quests.data.items.length > 0);
  const bothProgressEnabled = hasMissions && hasQuests;

  const handleRedeemReward = async (rewardId: number) => {
    try {
      const redemption = await redeemReward.mutateAsync(rewardId);
      setRecentRedeemedRewardId(redemption.rewardId);
      toast.success(
        redemption.status === 'fulfilled'
          ? 'Reward fulfilled'
          : 'Reward redeemed. Your reward is awaiting fulfillment.'
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to redeem reward');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="p-4 rounded-xl bg-[#fa7517]/10 border border-[#fa7517]/20 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between gap-4 flex-col md:flex-row">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#fa7517]/10 rounded-lg">
              <HelpCircle className="w-5 h-5 text-[#fa7517]" />
            </div>
            <div>
              <p className="text-gray-200 font-medium">Growth engine overview</p>
              <p className="text-sm text-gray-400">
                XP is the visible score right now. Other layers unlock as the active growth phases expand.
              </p>
            </div>
          </div>
          <Link
            to="/leaderboard"
            className="px-4 py-2 rounded-lg bg-[#fa7517]/20 hover:bg-[#fa7517]/30 text-[#fa7517] font-semibold transition-colors duration-200"
          >
            Open {leaderboardModeLabel} leaderboard
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {visibility.xpVisible && (
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="lg:col-span-2 relative overflow-hidden p-8 rounded-xl bg-gradient-to-br from-[#fa7517]/15 via-black/60 to-black/80 border border-[#fa7517]/20 backdrop-blur-sm"
          >
            <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#fa7517]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-[#fa7517]/15 rounded-xl border border-[#fa7517]/20">
                  <Star className="w-5 h-5 text-[#fa7517]" />
                </div>
                <div>
                  <h2 className="text-xs text-gray-400 uppercase tracking-[0.15em] font-semibold">XP</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Your visible growth score across the platform</p>
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <div className="text-6xl font-bold text-white tracking-tight">
                  {(growthMe.data.balances.xp ?? 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 mb-2">pts</div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="space-y-6">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="p-5 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              {visibility.reputationVisible ? (
                <Award className="w-4 h-4 text-sky-300" />
              ) : (
                <Lock className="w-4 h-4 text-sky-300/60" />
              )}
              <h3 className="text-sm font-semibold text-white">Reputation</h3>
            </div>
            {visibility.reputationVisible ? (
              <div className="text-2xl font-bold text-white">
                {(growthMe.data.balances.reputation ?? 0).toLocaleString()}
              </div>
            ) : (
              <p className="text-xs text-gray-500 leading-relaxed">
                {growthMe.data.hiddenState.reputationTracked
                  ? 'Tracked in the background — visible in a future phase.'
                  : 'Unlocks in a later growth phase.'}
              </p>
            )}
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            className="p-5 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              {visibility.creditsVisible ? (
                <Gift className="w-4 h-4 text-emerald-300" />
              ) : (
                <Lock className="w-4 h-4 text-emerald-300/60" />
              )}
              <h3 className="text-sm font-semibold text-white">Rewards</h3>
            </div>
            {visibility.creditsVisible ? (
              <div className="text-2xl font-bold text-white">
                {(growthMe.data.balances.credits ?? 0).toLocaleString()}
              </div>
            ) : (
              <p className="text-xs text-gray-500 leading-relaxed">
                Spendable credits unlock when the active phase enables them.
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {(hasMissions || hasQuests) ? (
        <div className={`grid gap-6 ${bothProgressEnabled ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
          {hasMissions && (
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm space-y-4"
            >
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#fa7517]" />
                <h2 className="text-xl font-bold text-white">Missions</h2>
              </div>
              <div className={`grid gap-4 ${!bothProgressEnabled ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                {missions.data!.items.map((mission) => (
                  <div key={mission.id} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-white">{mission.title}</h3>
                        <p className="text-sm text-gray-400">{mission.description}</p>
                      </div>
                      <div className="text-right text-sm shrink-0">
                        <div className="text-[#fa7517] font-semibold">
                          +{mission.reward.amount} {getLayerLabel(mission.reward.layer)}
                        </div>
                        <div className="text-gray-500">{getProgressStatusLabel(mission.progress.status)}</div>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-900/60 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[#fa7517]"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(0, Math.min(100, mission.progress.current * 100))}%` }}
                      />
                    </div>
                    <div className="space-y-2">
                      {mission.steps.map((step) => (
                        <div key={step.stepKey} className="flex items-center justify-between text-sm text-gray-300">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className={`w-4 h-4 ${step.completed ? 'text-emerald-400' : 'text-gray-600'}`} />
                            <span>{step.stepKey.replace(/_/g, ' ')}</span>
                          </div>
                          <span className="text-gray-500">
                            {step.currentCount} / {step.targetCount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {hasQuests && (
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm space-y-4"
            >
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-sky-300" />
                <h2 className="text-xl font-bold text-white">Quests</h2>
              </div>
              <div className={`grid gap-4 ${!bothProgressEnabled ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                {quests.data!.items.map((quest) => (
                  <div key={quest.id} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-white">{quest.questKey.replace(/_/g, ' ')}</h3>
                        <p className="text-sm text-gray-400">{quest.templateKey.replace(/_/g, ' ')}</p>
                      </div>
                      <div className="text-right text-sm shrink-0">
                        <div className="text-sky-300 font-semibold">
                          +{quest.reward.amount} {getLayerLabel(quest.reward.layer)}
                        </div>
                        <div className="text-gray-500">{getProgressStatusLabel(quest.progress.status)}</div>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-900/60 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-sky-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(0, Math.min(100, quest.progress.current * 100))}%` }}
                      />
                    </div>
                    <div className="space-y-2">
                      {quest.criteria.map((criterion) => (
                        <div key={criterion.key} className="flex items-center justify-between text-sm text-gray-300">
                          <span>{criterion.key.replace(/_/g, ' ')}</span>
                          <span className="text-gray-500">
                            {criterion.currentCount} / {criterion.targetCount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-[#fa7517]" />
            <h2 className="text-xl font-bold text-white">Missions & Quests</h2>
          </div>
          <p className="text-gray-400">
            Goal-based progression is not active for your current growth phase yet. You’ll see missions and quests here as soon as they go live.
          </p>
        </motion.div>
      )}

      {visibility.creditsVisible && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-emerald-300" />
              <h2 className="text-xl font-bold text-white">Rewards</h2>
            </div>

            {hasRewards ? (
              <div className="space-y-4">
                {rewards.data!.items.map((reward) => {
                  const costLayer = reward.costLayer ?? 'xp';
                  const costAmount = reward.costAmount ?? 0;
                  const visibleBalance = costLayer === 'xp'
                    ? growthMe.data.balances.xp
                    : costLayer === 'reputation'
                    ? growthMe.data.balances.reputation
                    : growthMe.data.balances.credits;
                  const hasEnoughBalance = visibleBalance != null && visibleBalance >= costAmount;
                  const inventoryRemaining = reward.inventoryCap == null || reward.inventoryUsed == null
                    ? null
                    : Math.max(0, reward.inventoryCap - reward.inventoryUsed);
                  const isInventoryAvailable = inventoryRemaining == null || inventoryRemaining > 0;
                  const isActive = reward.status == null || reward.status === 'active';
                  const isRedeemingThisReward = redeemReward.isPending && redeemReward.variables === reward.id;
                  const isRedeemable = hasEnoughBalance && isInventoryAvailable && isActive && !isRedeemingThisReward;

                  return (
                    <div key={reward.id} className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
                      <div>
                        <div className="font-semibold text-white">{reward.title}</div>
                        {reward.description && <p className="text-sm text-gray-400 mt-1">{reward.description}</p>}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-emerald-300">
                          {costAmount.toLocaleString()} {getLayerLabel(costLayer)}
                        </span>
                        {inventoryRemaining != null && (
                          <span className="text-xs text-gray-500">
                            {inventoryRemaining.toLocaleString()} remaining
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRedeemReward(reward.id)}
                        disabled={!isRedeemable}
                        className="mt-auto px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                      >
                        {isRedeemingThisReward ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Redeem
                      </button>
                      {!hasEnoughBalance && (
                        <div className="text-xs text-red-300">Not enough {getLayerLabel(costLayer).toLowerCase()} to redeem this reward.</div>
                      )}
                      {!isInventoryAvailable && <div className="text-xs text-red-300">This reward is currently exhausted.</div>}
                      {recentRedeemedRewardId === reward.id && (
                        <div className="text-xs text-emerald-300">
                          Reward redeemed. Your reward is awaiting fulfillment.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
                No rewards available yet.
              </div>
            )}
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-[#fa7517]" />
              <h2 className="text-xl font-bold text-white">My redemptions</h2>
            </div>
            {hasRedemptions ? (
              <div className="space-y-3">
                {redemptions.data!.items.map((item) => (
                  <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-white">{item.reward?.title || `Reward #${item.rewardId}`}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {format(new Date(item.createdAt), 'MMM d, yyyy • HH:mm')}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`font-semibold ${
                          item.status === 'fulfilled'
                            ? 'text-emerald-300'
                            : item.status === 'rejected'
                            ? 'text-red-300'
                            : item.status === 'cancelled'
                            ? 'text-gray-400'
                            : 'text-[#fa7517]'
                        }`}>
                          {getRedemptionStatusLabel(item.status)}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {item.costAmount.toLocaleString()} {getLayerLabel(item.costLayer)}
                        </div>
                      </div>
                    </div>
                    {item.statusReason && (
                      <div className="text-sm text-gray-400 mt-3">{item.statusReason}</div>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-3">
                      {item.fulfilledAt && <span>Fulfilled {format(new Date(item.fulfilledAt), 'MMM d, yyyy')}</span>}
                      {item.rejectedAt && <span>Rejected {format(new Date(item.rejectedAt), 'MMM d, yyyy')}</span>}
                      {item.cancelledAt && <span>Cancelled {format(new Date(item.cancelledAt), 'MMM d, yyyy')}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
                No redemptions yet.
              </div>
            )}
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr,0.85fr] gap-6">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#fa7517]" />
              <h2 className="text-xl font-bold text-white">XP Activity</h2>
            </div>
            <div className="flex gap-2">
              {(['24h', '7d', '30d'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setPeriod(option)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    period === option ? 'bg-[#fa7517] text-white' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {chartData.length > 0 ? (
            <LineChart data={chartData} xKey="date" yKey="xp" color="#fa7517" />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No XP activity in this period yet
            </div>
          )}
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <ScrollText className="w-5 h-5 text-[#fa7517]" />
            <h2 className="text-xl font-bold text-white">Recent Growth History</h2>
          </div>
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {filteredEntries.length > 0 ? (
              filteredEntries.slice(0, 12).map((entry) => {
                const isNegative = ['burn', 'revoke', 'expire'].includes(entry.direction);
                const title = entry.scoreCode || entry.eventType || entry.sourceType || 'growth update';
                return (
                  <div key={entry.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-white capitalize">{title.replace(/_/g, ' ')}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {getLayerLabel(entry.layer)} • {format(new Date(entry.createdAt), 'MMM d, HH:mm')}
                        </div>
                      </div>
                      <div className={`font-semibold ${isNegative ? 'text-red-300' : 'text-emerald-300'}`}>
                        {isNegative ? '-' : '+'}
                        {entry.amount} {getLayerLabel(entry.layer)}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
                No growth history for this period yet.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PointsTab;
