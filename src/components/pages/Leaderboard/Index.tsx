import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Video, Heart, Clock, Crown, Medal, Star, Sparkles, TrendingUp, Flame, MessageCircle } from 'lucide-react';
import { useLeaderboard } from '../../../hooks/useLeaderboard';
import LeaderboardHeader from './LeaderboardHeader';
import {
  LeaderboardContainer,
  HeroSection,
  GlowingBackground,
  HeroTitle,
  HeroSubtitle,
  PodiumSection,
  PodiumStep,
  CreatorSpotlight,
  LeaderboardGrid,
  CreatorCard,
  StatBox,
  LoadingContainer,
  ErrorContainer,
  Username,
  ScoreHighlight,
  StatsContainer,
  RankBadgeContainer,
  RankBadge,
  CategoryTabs,
  TabButton,
  SpotlightStats,
  LeaderLine,
  RankProgress,
  GlowingOrb,
} from './styles';
import { formatNumber, formatDuration } from '../../../utils/format';
import PointsExplainer from './PointsExplainer';

type Category = 'overall' | 'videos' | 'engagement' | 'watch-time';

const Leaderboard: React.FC = () => {
  const { data: leaderboard, isLoading, error } = useLeaderboard();
  const [selectedCategory, setSelectedCategory] = useState<Category>('overall');
  const [spotlightUser, setSpotlightUser] = useState<number | null>(null);

  const sortedUsers = useMemo(() => {
    if (!leaderboard) return [];
    return [...leaderboard].sort((a, b) => {
      switch (selectedCategory) {
        case 'videos':
          return b.videoCount - a.videoCount;
        case 'engagement':
          return (b.commentCount + b.likeCount) - (a.commentCount + a.likeCount);
        case 'watch-time':
          return b.totalWatchTime - a.totalWatchTime;
        default:
          return Number(b.activityScore) - Number(a.activityScore);
      }
    });
  }, [leaderboard, selectedCategory]);

  const topThree = useMemo(() => sortedUsers.slice(0, 3), [sortedUsers]);
  const remainingUsers = useMemo(() => sortedUsers.slice(3), [sortedUsers]);

  if (isLoading) {
    return (
      <>
        <LeaderboardHeader />
        <LoadingContainer>
          <GlowingOrb />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Discovering Champions...
          </motion.p>
        </LoadingContainer>
      </>
    );
  }

  if (error) {
    return (
      <>
        <LeaderboardHeader />
        <ErrorContainer>
          <Trophy size={48} />
          <h3>Oops! Something went wrong</h3>
          <p>We couldn't load the leaderboard. Please try again later.</p>
        </ErrorContainer>
      </>
    );
  }

  const getCategoryIcon = (category: Category) => {
    switch (category) {
      case 'videos':
        return <Video size={20} />;
      case 'engagement':
        return <Heart size={20} />;
      case 'watch-time':
        return <Clock size={20} />;
      default:
        return <Star size={20} />;
    }
  };

  const ProfileImage: React.FC<{ url?: string | null; size: 'small' | 'medium' | 'large' }> = ({ url, size }) => {
    const [imgUrl, setImgUrl] = React.useState(url || '/images/default-avatar.png');
    
    const handleError = () => {
      setImgUrl('/images/default-avatar.png');
    };

    const dimensions =
      size === 'large'
        ? { width: '80px', height: '80px' }
        : size === 'medium'
        ? { width: '50px', height: '50px' }
        : { width: '40px', height: '40px' };

    return (
      <img
        src={imgUrl}
        onError={handleError}
        alt="User Avatar"
        style={{
          ...dimensions,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.2)',
        }}
      />
    );
  };

  return (
    <>
      <LeaderboardHeader />
      <LeaderboardContainer>
        <HeroSection>
          <GlowingBackground />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 text-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ 
                duration: 1.2,
                ease: [0.19, 1, 0.22, 1]
              }}
              className="flex items-center justify-center gap-4 mb-6"
            >
              <Flame className="w-12 h-12 text-[#fa7517]" />
              <Crown className="w-16 h-16 text-[#fa7517]" />
              <Flame className="w-12 h-12 text-[#fa7517]" />
            </motion.div>

            <HeroTitle>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="block"
              >
                Base.Tube Champions
              </motion.span>
            </HeroTitle>

            <HeroSubtitle>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-3"
              >
                <Sparkles className="w-5 h-5 text-[#fa7517]" />
                <span>Where Legends Rise and History is Made</span>
                <Sparkles className="w-5 h-5 text-[#fa7517]" />
              </motion.div>
            </HeroSubtitle>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-4 text-white/60 max-w-2xl mx-auto text-sm"
            >
              Celebrating the pioneers and visionaries who shape the future of content creation
            </motion.p>
          </motion.div>
        </HeroSection>

        <CategoryTabs>
          {(['overall', 'videos', 'engagement', 'watch-time'] as Category[]).map((category) => (
            <TabButton
              key={category}
              active={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
            >
              {getCategoryIcon(category)}
              <span>{category.replace('-', ' ').toUpperCase()}</span>
            </TabButton>
          ))}
        </CategoryTabs>

        <PodiumSection>
          {topThree.map((user, index) => (
            <PodiumStep
              key={user.username}
              position={index + 1}
              onClick={() => setSpotlightUser(index)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.2 }}
              >
                <RankBadgeContainer isTopThree>
                  <RankBadge rank={index + 1}>
                    {index === 0 ? <Crown /> : <Medal />}
                  </RankBadge>
                </RankBadgeContainer>
                <ProfileImage url={user.profile_image_url} size="large" />
                <Username>{user.username}</Username>
                <ScoreHighlight>
                  <TrendingUp size={16} />
                  {Number(user.activityScore).toFixed(1)}
                </ScoreHighlight>
              </motion.div>
            </PodiumStep>
          ))}
        </PodiumSection>

        <AnimatePresence>
          {spotlightUser !== null && (
            <CreatorSpotlight
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <SpotlightStats user={topThree[spotlightUser]} />
              <button onClick={() => setSpotlightUser(null)}>Close</button>
            </CreatorSpotlight>
          )}
        </AnimatePresence>

        <LeaderboardGrid>
          {remainingUsers.map((user, index) => (
            <motion.div
              key={user.username}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <CreatorCard>
                <LeaderLine />
                <RankBadgeContainer>
                  <RankBadge rank={index + 4}>
                    {index + 4}
                  </RankBadge>
                </RankBadgeContainer>
                <ProfileImage url={user.profile_image_url} size="medium" />
                <div className="info">
                  <Username>{user.username}</Username>
                  <StatsContainer>
                    <StatBox>
                      <Video size={14} />
                      <span>{formatNumber(user.videoCount)}</span>
                    </StatBox>
                    <StatBox>
                      <Heart size={14} />
                      <span>{formatNumber(user.likeCount)}</span>
                    </StatBox>
                    <StatBox>
                      <MessageCircle size={14} />
                      <span>{formatNumber(user.commentCount)}</span>
                    </StatBox>
                    <StatBox>
                      <Clock size={14} />
                      <span>{formatDuration(user.totalWatchTime)}</span>
                    </StatBox>
                  </StatsContainer>
                </div>
                <RankProgress score={Number(user.activityScore)} />
              </CreatorCard>
            </motion.div>
          ))}
        </LeaderboardGrid>
        <PointsExplainer />
      </LeaderboardContainer>
    </>
  );
};

export default Leaderboard; 