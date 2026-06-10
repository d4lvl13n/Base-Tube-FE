import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Clock,
  Eye,
  Flame,
  Gem,
  Image as ImageIcon,
  Play,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import ErrorBoundary from '../common/ErrorBoundary';
import { useNavigation } from '../../contexts/NavigationContext';
import { getFeaturedVideos, getRecommendedVideos } from '../../api/video';
import { getPopularChannels } from '../../api/channel';
import { useTrendingVideos } from '../../hooks/useTrendingVideos';
import { usePassDiscover } from '../../hooks/usePass';
import type { Channel } from '../../types/channel';
import type { Pass } from '../../types/pass';
import type { Video } from '../../types/video';

const PASSES_ENABLED = process.env.REACT_APP_SHOW_PASSES === 'true';
const FROST_BORDER = 'border-[rgba(214,235,253,0.16)]';
const FROST_BORDER_STRONG = 'border-[rgba(214,235,253,0.22)]';
const REVEAL_TRANSITION = { duration: 0.65, ease: 'easeOut' as const };
const SPRING_HOVER = { type: 'spring' as const, stiffness: 260, damping: 24 };

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: REVEAL_TRANSITION },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

type HomeVideo = Partial<Video> & {
  id: number;
  title: string;
  duration?: number;
  views_count?: number;
  views?: number;
  thumbnail_url?: string;
  thumbnail_path?: string;
  video_url?: string;
  channel?: (Partial<Channel> & { user?: { username?: string | null; profile_image_url?: string | null } }) | null;
};

const getThumbnailUrl = (video?: HomeVideo | null) => {
  if (!video) return '/assets/default-thumbnail.jpg';
  if (video.thumbnail_url) return video.thumbnail_url;
  if (video.thumbnail_path?.startsWith('http')) return video.thumbnail_path;
  if (video.thumbnail_path) return `${process.env.REACT_APP_API_URL}/${video.thumbnail_path}`;
  return '/assets/default-thumbnail.jpg';
};

const getChannelImageUrl = (channel?: HomeVideo['channel'] | null) => {
  if (!channel) return '/assets/default-cover.jpg';
  if (channel.channel_image_url) return channel.channel_image_url;
  if (channel.channel_image_path?.startsWith('http')) return channel.channel_image_path;
  if (channel.channel_image_path) return `${process.env.REACT_APP_API_URL}/${channel.channel_image_path}`;
  return '/assets/default-cover.jpg';
};

const getChannelAvatarUrl = (channel?: Channel | null) => {
  if (!channel) return '/assets/default-avatar.jpg';
  if (channel.ownerProfileImage?.startsWith('http')) return channel.ownerProfileImage;
  if (channel.ownerProfileImage) return `${process.env.REACT_APP_API_URL}/${channel.ownerProfileImage}`;
  return getChannelImageUrl(channel);
};

const formatDuration = (seconds?: number) => {
  if (!seconds || seconds < 0) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatCompact = (value?: number | null) => {
  const safeValue = value || 0;
  if (safeValue >= 1_000_000) return `${(safeValue / 1_000_000).toFixed(1)}M`;
  if (safeValue >= 1_000) return `${(safeValue / 1_000).toFixed(1)}K`;
  return safeValue.toLocaleString();
};

const formatPrice = (pass?: Pass | null) => {
  if (!pass) return 'Soon';
  if (pass.formatted_price) return pass.formatted_price;
  const amount = (pass.price_cents || 0) / 100;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: pass.currency || 'EUR',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
};

const getPassUrl = (pass: Pass) => `/p/${pass.slug || pass.id}`;

const V2HomePage: React.FC = () => {
  const { navStyle } = useNavigation();
  const isFloatingNav = navStyle === 'floating';
  const [featuredVideos, setFeaturedVideos] = useState<HomeVideo[]>([]);
  const [recommendedVideos, setRecommendedVideos] = useState<HomeVideo[]>([]);
  const [popularChannels, setPopularChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    data: passesData,
    isLoading: passesLoading,
  } = usePassDiscover({ limit: 8 }, { enabled: PASSES_ENABLED });

  const contentPasses = useMemo(
    () => (PASSES_ENABLED ? (passesData?.pages?.flatMap((page) => page.data) || []) : []),
    [passesData]
  );

  const {
    videos: trendingVideos,
    loading: trendingLoading,
  } = useTrendingVideos({
    limit: 8,
    timeFrame: 'week',
    sort: 'trending',
  });

  useEffect(() => {
    let mounted = true;

    const fetchHomeData = async () => {
      setLoading(true);
      const [featuredResult, recommendedResult, channelsResult] = await Promise.allSettled([
        getFeaturedVideos(3),
        getRecommendedVideos(1, 8),
        getPopularChannels(1, 12),
      ]);

      if (!mounted) return;

      setFeaturedVideos(featuredResult.status === 'fulfilled' ? featuredResult.value as HomeVideo[] : []);
      setRecommendedVideos(recommendedResult.status === 'fulfilled' ? recommendedResult.value.videos as HomeVideo[] : []);
      setPopularChannels(channelsResult.status === 'fulfilled' ? channelsResult.value : []);
      setLoading(false);
    };

    fetchHomeData();
    return () => {
      mounted = false;
    };
  }, []);

  const videos = useMemo(() => {
    const seen = new Set<number>();
    return [...featuredVideos, ...(trendingVideos || []), ...recommendedVideos]
      .filter((video): video is HomeVideo => Boolean(video?.id && video?.title))
      .filter((video) => {
        if (seen.has(video.id)) return false;
        seen.add(video.id);
        return true;
      });
  }, [featuredVideos, recommendedVideos, trendingVideos]);

  const heroVideo = videos[0];
  const bentoVideo = videos[1] || videos[0];
  const railVideos = videos.slice(2, 8);
  const topPass = contentPasses[0];
  const topChannel = popularChannels[0];
  const isPageLoading = loading || trendingLoading || (PASSES_ENABLED && passesLoading);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="flex pt-16">
          <Sidebar className={`${isFloatingNav ? 'hidden' : 'fixed left-0 top-16 bottom-0 z-40'}`} />
          <main className={`relative flex-1 overflow-hidden ${isFloatingNav ? '' : 'pl-16'}`}>
            <motion.div
              className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(250,117,23,0.16),rgba(0,0,0,0)_42%)]"
              animate={{ opacity: [0.72, 1, 0.72] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative mx-auto w-full max-w-[1760px] px-4 py-5 md:px-6 lg:px-8">
              {isPageLoading && !heroVideo ? (
                <V2HomeSkeleton />
              ) : (
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="visible"
                >
                  <StageHero video={heroVideo} />
                  <PassPulse passes={contentPasses} />
                  <BentoDiscovery video={bentoVideo} pass={topPass} channel={topChannel} />
                  <VideoRail title="Trending on Base.Tube" linkTo="/discover?tab=trending" videos={railVideos} />
                  <DropsRail passes={contentPasses} />
                  <CreatorRail channels={popularChannels} />
                </motion.div>
              )}
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

const StageHero: React.FC<{ video?: HomeVideo }> = ({ video }) => {
  if (!video) {
    return (
      <motion.section variants={fadeUp} className={`relative mb-5 overflow-hidden rounded-[28px] border ${FROST_BORDER_STRONG} bg-[#050505] p-8 md:min-h-[560px]`}>
        <div className="flex min-h-[420px] items-center justify-center text-white/50">No featured video available</div>
      </motion.section>
    );
  }

  const thumbnail = getThumbnailUrl(video);
  const hasPlayableSource = Boolean(video.video_url);

  return (
    <motion.section
      variants={fadeUp}
      className={`relative mb-5 overflow-hidden rounded-[28px] border ${FROST_BORDER_STRONG} bg-[#050505] shadow-[0_0_0_1px_rgba(176,199,217,0.08),0_30px_90px_rgba(0,0,0,0.45)]`}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-[linear-gradient(90deg,transparent,rgba(250,117,23,0.88),rgba(255,255,255,0.48),transparent)]"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2.2 }}
      />
      <div className="relative min-h-[520px] md:min-h-[640px]">
        {hasPlayableSource ? (
          <video
            src={video.video_url}
            poster={thumbnail}
            muted
            loop
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-80"
          />
        ) : (
          <motion.img
            src={thumbnail}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-[0.82]"
            animate={{ scale: [1, 1.035, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.96),rgba(0,0,0,0.44)_46%,rgba(0,0,0,0.18)),linear-gradient(0deg,rgba(0,0,0,0.88),rgba(0,0,0,0)_48%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_78%,rgba(250,117,23,0.16),transparent_34%)]" />

        <motion.div
          className="relative flex min-h-[520px] flex-col justify-between p-5 md:min-h-[640px] md:p-8 lg:p-10"
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex h-9 items-center gap-2 rounded-full border ${FROST_BORDER} bg-black/40 px-3 text-sm text-white/70 backdrop-blur`}>
              <Eye className="h-4 w-4 text-[#fa7517]" />
              {formatCompact(video.views_count ?? video.views)} views
            </span>
            <span className={`inline-flex h-9 items-center gap-2 rounded-full border ${FROST_BORDER} bg-black/40 px-3 text-sm text-white/70 backdrop-blur`}>
              <Clock className="h-4 w-4 text-white/60" />
              {formatDuration(video.duration)}
            </span>
          </motion.div>

          <motion.div variants={fadeUp} className="max-w-[850px]">
            {video.channel?.name && (
              <div className="mb-5 flex items-center gap-3">
                <img
                  src={getChannelImageUrl(video.channel)}
                  alt=""
                  className={`h-11 w-11 rounded-full border ${FROST_BORDER} object-cover`}
                />
                <div>
                  <p className="text-sm font-semibold text-white">{video.channel.name}</p>
                  {video.channel.handle && <p className="text-xs text-white/50">@{video.channel.handle}</p>}
                </div>
              </div>
            )}
            <h1 className="max-w-[920px] text-[42px] font-black leading-[0.98] tracking-normal text-white md:text-[72px] lg:text-[86px]">
              {video.title}
            </h1>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to={`/video/${video.id}`}
                className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-5 text-sm font-black text-black transition-transform hover:-translate-y-0.5"
              >
                <span className="absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,rgba(250,117,23,0.24),transparent)] transition-transform duration-700 group-hover:translate-x-full" />
                <Play className="h-4 w-4 fill-current" />
                Watch now
              </Link>
              <Link
                to="/discover?tab=trending"
                className={`inline-flex h-12 items-center justify-center gap-2 rounded-full border ${FROST_BORDER} bg-black/40 px-5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10`}
              >
                Browse discovery
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
};

const PassPulse: React.FC<{ passes: Pass[] }> = ({ passes }) => {
  const mintedTotal = passes.reduce((total, pass) => total + (pass.sold_count ?? (pass.minted_count || 0)), 0);
  const minPricePass = passes
    .filter((pass) => typeof pass.price_cents === 'number')
    .sort((a, b) => a.price_cents - b.price_cents)[0];
  const topPass = passes[0];

  const pulseItems = [
    { label: 'Drops preview', value: passes.length ? passes.length.toString() : 'Soon', Icon: Ticket },
    { label: 'Minted / reserved', value: mintedTotal ? formatCompact(mintedTotal) : '0', Icon: Gem },
    { label: 'Top drop', value: topPass?.title || 'Content passes warming up', Icon: Flame },
    { label: 'Starting at', value: formatPrice(minPricePass), Icon: TrendingUp },
  ];

  return (
    <motion.section variants={fadeUp} className={`mb-5 overflow-hidden rounded-[22px] border ${FROST_BORDER} bg-[#050505]/92`}>
      <div className="pointer-events-none h-px bg-[linear-gradient(90deg,transparent,rgba(250,117,23,0.54),transparent)]" />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(214,235,253,0.12)] px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-white/45">Content passes</span>
          <span className="inline-flex items-center rounded-full border border-[#fa7517]/35 bg-[#fa7517]/12 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#ff9a4d]">
            Beta · coming soon
          </span>
        </div>
        <span className="text-xs font-semibold text-white/40">Preview data while minting opens.</span>
      </div>
      <div className="grid grid-cols-1 divide-y divide-[rgba(214,235,253,0.12)] md:grid-cols-4 md:divide-x md:divide-y-0">
        {pulseItems.map(({ label, value, Icon }, index) => (
          <motion.div
            key={label}
            className="flex min-h-[90px] items-center gap-4 px-5 py-4"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.45, delay: index * 0.06, ease: 'easeOut' }}
          >
            <motion.div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#fa7517]/30 bg-[#fa7517]/10 text-[#fa7517]"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.18 }}
            >
              <Icon className="h-5 w-5" />
            </motion.div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-white/40">{label}</p>
              <p className="mt-1 truncate text-lg font-black text-white">{value}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

const BentoDiscovery: React.FC<{ video?: HomeVideo; pass?: Pass; channel?: Channel }> = ({ video, pass, channel }) => (
  <motion.section
    variants={fadeUp}
    className="mb-10"
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-120px' }}
  >
    <SectionHeader title="Drops this week" linkTo="/discover?tab=passes" linkLabel="View all" />
    <motion.div variants={stagger} className="grid auto-rows-[178px] grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-6">
      <BentoVideoTile video={video} className="md:col-span-4 md:row-span-2 lg:col-span-3" />
      <BentoPassTile pass={pass} className="md:col-span-2 md:row-span-2 lg:col-span-2" />
      <BentoChannelTile channel={channel} className="md:col-span-2 lg:col-span-1" />
      <BentoToolTile className="md:col-span-2 lg:col-span-1" />
    </motion.div>
  </motion.section>
);

const BentoVideoTile: React.FC<{ video?: HomeVideo; className?: string }> = ({ video, className = '' }) => (
  <motion.div variants={fadeUp} whileHover={{ y: -6 }} transition={SPRING_HOVER} className={className}>
    <Link
      to={video ? `/video/${video.id}` : '/discover'}
      className={`group relative block h-full overflow-hidden rounded-[24px] border ${FROST_BORDER} bg-[#070707]`}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-[linear-gradient(90deg,transparent,rgba(250,117,23,0.78),transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      {video && <img src={getThumbnailUrl(video)} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.88))]" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="mb-3 inline-flex rounded-full border border-white/[0.15] bg-black/60 px-3 py-1 text-xs font-semibold uppercase text-white/70 backdrop-blur">
          Now playing
        </p>
        <h3 className="max-w-[720px] text-2xl font-black leading-tight text-white md:text-4xl">
          {video?.title || 'Discover what is moving on Base.Tube'}
        </h3>
        <div className="mt-4 flex items-center gap-3 text-sm text-white/70">
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-4 w-4 text-[#fa7517]" />
            {formatCompact(video?.views_count ?? video?.views)}
          </span>
          <span>{formatDuration(video?.duration)}</span>
        </div>
      </div>
    </Link>
  </motion.div>
);

const BentoPassTile: React.FC<{ pass?: Pass; className?: string }> = ({ pass, className = '' }) => (
  <motion.div variants={fadeUp} whileHover={{ y: -6 }} transition={SPRING_HOVER} className={className}>
    <Link
      to={pass ? getPassUrl(pass) : '/content-passes'}
      className={`group relative block h-full overflow-hidden rounded-[24px] border ${FROST_BORDER} bg-[#070707]`}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-[linear-gradient(90deg,transparent,rgba(242,201,76,0.78),transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <img
        src={pass?.videos?.[0]?.thumbnail_url || '/assets/Content-pass.webp'}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.92))]" />
      <div className="absolute left-4 top-4 rounded-full border border-[#fa7517]/35 bg-black/55 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#ff9a4d] backdrop-blur">
        Beta soon
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3 className="text-2xl font-black leading-tight text-white">{pass?.title || 'First drops are coming'}</h3>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-lg font-black text-[#fa7517]">{formatPrice(pass)}</span>
        </div>
      </div>
    </Link>
  </motion.div>
);

const BentoChannelTile: React.FC<{ channel?: Channel; className?: string }> = ({ channel, className = '' }) => (
  <motion.div variants={fadeUp} whileHover={{ y: -6 }} transition={SPRING_HOVER} className={className}>
    <Link
      to={channel ? `/channel/${channel.handle}` : '/channel'}
      className={`group relative block h-full overflow-hidden rounded-[24px] border ${FROST_BORDER} bg-[#070707] p-4`}
    >
      <div className="absolute inset-0 opacity-60">
        <img src={getChannelImageUrl(channel)} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-black/76" />
      </div>
      <div className="relative flex h-full flex-col justify-between">
        <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}>
          <Users className="h-6 w-6 text-[#8bd3ff]" />
        </motion.div>
        <div>
          <img src={getChannelAvatarUrl(channel)} alt="" className={`mb-3 h-12 w-12 rounded-full border ${FROST_BORDER} object-cover`} />
          <p className="text-xs font-semibold uppercase text-white/40">Creator to watch</p>
          <h3 className="mt-1 line-clamp-1 text-xl font-black text-white">{channel?.name || 'New creators'}</h3>
          <p className="mt-1 text-sm text-white/60">{formatCompact(channel?.subscribers_count)} subscribers</p>
        </div>
      </div>
    </Link>
  </motion.div>
);

const BentoToolTile: React.FC<{ className?: string }> = ({ className = '' }) => (
  <motion.div variants={fadeUp} whileHover={{ y: -6 }} transition={SPRING_HOVER} className={className}>
    <Link
      to="/ai-thumbnails/audit"
      className={`group relative block h-full overflow-hidden rounded-[24px] border ${FROST_BORDER} bg-[#070707] p-4`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(250,117,23,0.18),rgba(0,0,0,0)_52%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(250,117,23,0.78),transparent)]" />
      <div className="relative flex h-full flex-col justify-between">
        <motion.div
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fa7517] text-black"
          animate={{ rotate: [0, -6, 6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ImageIcon className="h-5 w-5" />
        </motion.div>
        <div>
          <p className="text-xs font-semibold uppercase text-white/40">Creator tool</p>
          <h3 className="mt-1 text-xl font-black text-white">Thumbnail Lab for the next upload.</h3>
        </div>
      </div>
    </Link>
  </motion.div>
);

const VideoRail: React.FC<{ title: string; linkTo: string; videos: HomeVideo[] }> = ({ title, linkTo, videos }) => (
  <motion.section
    className="mb-10"
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-120px' }}
    variants={stagger}
  >
    <SectionHeader title={title} linkTo={linkTo} linkLabel="More" />
    <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {videos.slice(0, 4).map((video) => (
        <CompactVideoCard key={video.id} video={video} />
      ))}
    </div>
  </motion.section>
);

const DropsRail: React.FC<{ passes: Pass[] }> = ({ passes }) => (
  <motion.section
    className="mb-10"
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-120px' }}
    variants={stagger}
  >
    <SectionHeader title="Creator drops" linkTo="/discover?tab=passes" linkLabel="All passes" />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {(passes.length ? passes.slice(0, 4) : [undefined, undefined, undefined, undefined]).map((pass, index) => (
        <MiniPassCard key={pass?.id || index} pass={pass} />
      ))}
    </div>
  </motion.section>
);

const CreatorRail: React.FC<{ channels: Channel[] }> = ({ channels }) => (
  <motion.section
    className="mb-8"
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-120px' }}
    variants={fadeUp}
  >
    <SectionHeader title="Creators to watch" linkTo="/channel" linkLabel="Browse" />
    <div className="flex gap-4 overflow-x-auto pb-2">
      {channels.slice(0, 8).map((channel) => (
        <motion.div
          key={channel.id}
          whileHover={{ y: -5 }}
          transition={SPRING_HOVER}
          className="w-[300px] shrink-0"
        >
          <Link
            to={`/channel/${channel.handle}`}
            className={`group relative block h-[210px] overflow-hidden rounded-[24px] border ${FROST_BORDER} bg-[#070707]`}
          >
            <img src={getChannelImageUrl(channel)} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.86))]" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="flex items-end gap-3">
                <img src={getChannelAvatarUrl(channel)} alt="" className={`h-14 w-14 rounded-full border-2 border-white object-cover`} />
                <div className="min-w-0">
                  <h3 className="line-clamp-1 text-lg font-black text-white">{channel.name}</h3>
                  <p className="text-sm text-white/60">@{channel.handle}</p>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  </motion.section>
);

const CompactVideoCard: React.FC<{ video: HomeVideo }> = ({ video }) => (
  <motion.div variants={fadeUp} whileHover={{ y: -5 }} transition={SPRING_HOVER} className="h-full">
    <Link to={`/video/${video.id}`} className={`group flex h-full flex-col overflow-hidden rounded-[22px] border ${FROST_BORDER} bg-[#070707]`}>
      <div className="relative aspect-video overflow-hidden">
        <span className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-[linear-gradient(90deg,transparent,rgba(250,117,23,0.72),transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <img src={getThumbnailUrl(video)} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.78))]" />
        <span className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold text-white">
          {formatDuration(video.duration)}
        </span>
      </div>
      <div className="flex min-h-[132px] flex-1 flex-col justify-between p-4">
        <h3 className="line-clamp-2 min-h-[48px] text-base font-black leading-6 text-white">{video.title}</h3>
        <div className="mt-3 flex items-center justify-between text-sm text-white/50">
          <span className="line-clamp-1">{video.channel?.name || 'Base.Tube'}</span>
          <span className="inline-flex items-center gap-1 text-[#fa7517]">
            <Eye className="h-4 w-4" />
            {formatCompact(video.views_count ?? video.views)}
          </span>
        </div>
      </div>
    </Link>
  </motion.div>
);

const MiniPassCard: React.FC<{ pass?: Pass }> = ({ pass }) => (
  <motion.div variants={fadeUp} whileHover={{ y: -5 }} transition={SPRING_HOVER}>
    <Link to={pass ? getPassUrl(pass) : '/content-passes'} className={`group relative block aspect-[4/5] overflow-hidden rounded-[22px] border ${FROST_BORDER} bg-[#070707]`}>
      <span className="pointer-events-none absolute -left-1/2 top-0 z-20 h-full w-1/2 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)] opacity-0 transition-all duration-700 group-hover:left-full group-hover:opacity-100" />
      <img
        src={pass?.videos?.[0]?.thumbnail_url || '/assets/Content-pass.webp'}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.88))]" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="line-clamp-2 text-lg font-black text-white">{pass?.title || 'Content pass coming soon'}</h3>
        <p className="mt-2 text-sm font-black text-[#fa7517]">{formatPrice(pass)}</p>
      </div>
    </Link>
  </motion.div>
);

const SectionHeader: React.FC<{ title: string; linkTo: string; linkLabel: string }> = ({ title, linkTo, linkLabel }) => (
  <div className="mb-4 flex items-end justify-between gap-4">
    <h2 className="text-2xl font-black tracking-normal text-white md:text-3xl">{title}</h2>
    <Link to={linkTo} className="inline-flex items-center gap-2 text-sm font-semibold text-[#fa7517] transition-colors hover:text-[#ff9a4d]">
      {linkLabel}
      <ArrowRight className="h-4 w-4" />
    </Link>
  </div>
);

const V2HomeSkeleton = () => (
  <div className="space-y-5">
    <div className={`h-[620px] animate-pulse rounded-[28px] border ${FROST_BORDER} bg-white/[0.04]`} />
    <div className={`h-[90px] animate-pulse rounded-[22px] border ${FROST_BORDER} bg-white/[0.035]`} />
    <div className="grid auto-rows-[178px] grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-6">
      <div className={`animate-pulse rounded-[24px] border ${FROST_BORDER} bg-white/[0.035] md:col-span-4 md:row-span-2 lg:col-span-3`} />
      <div className={`animate-pulse rounded-[24px] border ${FROST_BORDER} bg-white/[0.035] md:col-span-2 md:row-span-2 lg:col-span-2`} />
      <div className={`animate-pulse rounded-[24px] border ${FROST_BORDER} bg-white/[0.035] md:col-span-2 lg:col-span-1`} />
      <div className={`animate-pulse rounded-[24px] border ${FROST_BORDER} bg-white/[0.035] md:col-span-2 lg:col-span-1`} />
    </div>
  </div>
);

export default V2HomePage;
