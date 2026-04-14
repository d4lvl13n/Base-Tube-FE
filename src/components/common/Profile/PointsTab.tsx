import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  ChevronRight,
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
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import Loader from '../Loader';
import Error from '../Error';
import { LineChart } from '../../../components/pages/CreatorHub/Analytics/charts/LineChart';
import {
  useApplyReferralCode,
  useGrowthHistory,
  useGrowthMe,
  useGrowthMissions,
  useGrowthQuests,
  useGrowthRedemptions,
  useGrowthRewards,
  useRedeemGrowthReward,
} from '../../../hooks/useGrowth';
import { getGrowthModeLabel, getLayerLabel, getRedemptionStatusLabel } from '../../../utils/growth';

const PointsTab: React.FC = () => {
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  const growthMe = useGrowthMe();
  const missions = useGrowthMissions();
  const quests = useGrowthQuests();
  const history = useGrowthHistory({ limit: 100 });
  const rewards = useGrowthRewards();
  const redemptions = useGrowthRedemptions({ limit: 20, offset: 0 });
  const redeemReward = useRedeemGrowthReward();
  const applyReferral = useApplyReferralCode();
  const [referralCode, setReferralCode] = useState('');
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

  const visibleBalanceCards = [
    visibility.xpVisible
      ? {
          key: 'xp',
          label: 'XP',
          value: growthMe.data.balances.xp ?? 0,
          helper: 'Your visible growth score across the platform.',
          icon: <Star className="w-5 h-5 text-[#fa7517]" />,
        }
      : null,
    visibility.reputationVisible
      ? {
          key: 'reputation',
          label: 'Reputation',
          value: growthMe.data.balances.reputation ?? 0,
          helper: 'Phase-enabled trust and contribution score.',
          icon: <Award className="w-5 h-5 text-sky-300" />,
        }
      : null,
    visibility.creditsVisible
      ? {
          key: 'credits',
          label: 'Credits',
          value: growthMe.data.balances.credits ?? 0,
          helper: 'Rewards and redeemable growth balance.',
          icon: <Gift className="w-5 h-5 text-emerald-300" />,
        }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; value: number; helper: string; icon: React.ReactNode }>;

  const leaderboardModeLabel = getGrowthModeLabel(visibility.leaderboardMode);
  const canShowRewards = visibility.creditsVisible && rewards.data?.items.length;
  const canShowRedemptions = visibility.creditsVisible && redemptions.data?.items.length;

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

  const handleApplyReferral = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedCode = referralCode.trim();
    if (!normalizedCode) {
      toast.error('Enter a referral code first');
      return;
    }

    try {
      const result = await applyReferral.mutateAsync(normalizedCode);
      setReferralCode('');
      toast.success(result.status === 'activated' ? 'Referral applied. Your referral was activated.' : 'Referral applied. Referral recorded.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to apply referral code');
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visibleBalanceCards.map((card) => (
          <motion.div
            key={card.key}
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {card.icon}
                <h2 className="text-lg font-semibold text-white">{card.label}</h2>
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">{card.value.toLocaleString()}</div>
            <p className="text-sm text-gray-400">{card.helper}</p>
          </motion.div>
        ))}

        {!visibility.reputationVisible && growthMe.data.hiddenState.reputationTracked && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-sky-300" />
              <h2 className="text-lg font-semibold text-white">Reputation</h2>
            </div>
            <p className="text-sm text-gray-300">Tracked in the background</p>
            <p className="text-sm text-gray-500 mt-2">
              Reputation is being measured, but it is not visible in the current growth phase yet.
            </p>
          </motion.div>
        )}

        {!visibility.creditsVisible && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-emerald-300" />
              <h2 className="text-lg font-semibold text-white">Rewards</h2>
            </div>
            <p className="text-sm text-gray-300">Phase-gated</p>
            <p className="text-sm text-gray-500 mt-2">
              Rewards and spendable credits will appear here once the active growth phase enables them.
            </p>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr,1.05fr] gap-6">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#fa7517]" />
            <h2 className="text-xl font-bold text-white">Apply referral code</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Add a referral code to attribute your account to the person who invited you. This is not a coupon or discount flow.
          </p>
          <form onSubmit={handleApplyReferral} className="space-y-4">
            <div className="flex gap-3 flex-col sm:flex-row">
              <input
                value={referralCode}
                onChange={(event) => setReferralCode(event.target.value)}
                placeholder="Enter referral code"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#fa7517]/50"
              />
              <button
                type="submit"
                disabled={applyReferral.isPending}
                className="px-5 py-3 rounded-xl bg-[#fa7517] text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {applyReferral.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                Apply
              </button>
            </div>
            <div className="text-xs text-gray-500">
              Successful outcomes can be recorded as either <span className="text-gray-300">registered</span> or <span className="text-gray-300">activated</span>.
            </div>
          </form>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-emerald-300" />
            <h2 className="text-xl font-bold text-white">Rewards</h2>
          </div>

          {canShowRewards ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rewards.data.items.map((reward) => {
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
                  <div key={reward.id} className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-4">
                    <div>
                      <div className="font-semibold text-white">{reward.title}</div>
                      {reward.description && <p className="text-sm text-gray-400 mt-1">{reward.description}</p>}
                    </div>
                    <div className="text-sm text-emerald-300">
                      Cost: {costAmount.toLocaleString()} {getLayerLabel(costLayer)}
                    </div>
                    {inventoryRemaining != null && (
                      <div className="text-xs text-gray-500">
                        {inventoryRemaining.toLocaleString()} remaining
                      </div>
                    )}
                    <button
                      onClick={() => handleRedeemReward(reward.id)}
                      disabled={!isRedeemable}
                      className="mt-auto px-4 py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              Rewards are not visible in the current growth phase yet.
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {missions.data?.enabled && missions.data.items.length > 0 && (
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm space-y-4"
          >
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#fa7517]" />
              <h2 className="text-xl font-bold text-white">Missions</h2>
            </div>
            {missions.data.items.map((mission) => (
              <div key={mission.id} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white">{mission.title}</h3>
                    <p className="text-sm text-gray-400">{mission.description}</p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-[#fa7517] font-semibold">
                      +{mission.reward.amount} {getLayerLabel(mission.reward.layer)}
                    </div>
                    <div className="text-gray-500 capitalize">{mission.progress.status.replace('_', ' ')}</div>
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
          </motion.div>
        )}

        {quests.data?.enabled && quests.data.items.length > 0 && (
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm space-y-4"
          >
            <div className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-sky-300" />
              <h2 className="text-xl font-bold text-white">Quests</h2>
            </div>
            {quests.data.items.map((quest) => (
              <div key={quest.id} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white">{quest.questKey.replace(/_/g, ' ')}</h3>
                    <p className="text-sm text-gray-400">{quest.templateKey.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-sky-300 font-semibold">
                      +{quest.reward.amount} {getLayerLabel(quest.reward.layer)}
                    </div>
                    <div className="text-gray-500 capitalize">{quest.progress.status.replace('_', ' ')}</div>
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
          </motion.div>
        )}
      </div>

      {!missions.data?.enabled && !quests.data?.enabled && (
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

      <motion.div
        whileHover={{ scale: 1.01 }}
        className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-[#fa7517]" />
          <h2 className="text-xl font-bold text-white">My redemptions</h2>
        </div>
        {canShowRedemptions ? (
          <div className="space-y-3">
            {redemptions.data.items.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-white">{item.reward?.title || `Reward #${item.rewardId}`}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {format(new Date(item.createdAt), 'MMM d, yyyy • HH:mm')}
                    </div>
                  </div>
                  <div className="text-right">
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
            {visibility.creditsVisible
              ? 'No redemptions yet.'
              : 'Redemption history is hidden in the current growth phase.'}
          </div>
        )}
      </motion.div>

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
