import React, { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Clock3, Eye, Heart, MessageCircle, PlayCircle, X } from 'lucide-react';
import { useDescriptionDock } from '../../../../contexts/DescriptionDockContext';
import { formatDuration, formatNumber } from '../../../../utils/format';
import RichTextDisplay from '../../RichTextDisplay';

const formatPublishedDate = (dateString?: string) => {
  if (!dateString) return 'Unknown';

  try {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateString));
  } catch {
    return 'Unknown';
  }
};

const splitTags = (tags?: string) => {
  if (!tags) return [];

  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
};

const DescriptionDock: React.FC = () => {
  const { isOpen, video, close } = useDescriptionDock();

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [close, isOpen]);

  const channel = video?.channel;
  const channelName = channel?.name || video?.user?.username || 'Base creator';
  const channelHandle = channel?.handle ? `@${channel.handle}` : video?.user?.username ? `@${video.user.username}` : '';
  const tags = useMemo(() => splitTags(video?.tags), [video?.tags]);

  const stats = [
    {
      label: 'Views',
      value: formatNumber(video?.views_count ?? video?.views ?? 0),
      Icon: Eye,
    },
    {
      label: 'Likes',
      value: formatNumber(video?.likes_count ?? video?.likes ?? 0),
      Icon: Heart,
    },
    {
      label: 'Comments',
      value: formatNumber(video?.comment_count ?? 0),
      Icon: MessageCircle,
    },
    {
      label: 'Runtime',
      value: formatDuration(video?.duration),
      Icon: Clock3,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && video && (
        <motion.div
          className="fixed inset-0 z-[95] flex justify-end bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={close}
        >
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="bt-description-drawer-title"
            className="relative flex h-full w-full flex-col overflow-hidden bg-black/95 text-white shadow-2xl sm:w-[500px] sm:max-w-[500px]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 29, stiffness: 260 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute left-0 inset-y-0 w-[2px]">
              <div className="absolute inset-0 bg-gradient-to-b from-[#fa7517]/30 via-[#fa7517]/10 to-[#fa7517]/30" />
            </div>

            <div className="flex items-center justify-between border-b border-gray-800/30 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#fa7517]/40 bg-[#fa7517]/15">
                  <PlayCircle className="h-[18px] w-[18px] text-[#fa7517]" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Details</div>
                  <div className="text-sm font-medium text-gray-300">{formatPublishedDate(video.createdAt)}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-800/50 hover:text-white"
                aria-label="Close details"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
              <div className="mb-6">
                <h2 id="bt-description-drawer-title" className="text-2xl font-semibold leading-tight tracking-normal text-white">
                  {video.title}
                </h2>

                <div className="mt-5 flex items-center gap-3">
                  {channel?.channel_image_url ? (
                    <img
                      src={channel.channel_image_url}
                      alt=""
                      className="h-11 w-11 rounded-full border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sm font-semibold text-white">
                      {channelName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{channelName}</div>
                    {channelHandle && <div className="truncate text-xs text-gray-500">{channelHandle}</div>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {stats.map(({ label, value, Icon }) => (
                  <div key={label} className="rounded-lg border border-gray-800/60 bg-[#0b0b0d] px-3 py-3">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </div>
                    <div className="text-sm font-semibold text-white">{value}</div>
                  </div>
                ))}
              </div>

              <div className="my-6 h-px bg-gray-800/60" />

              <div className="rounded-lg border border-gray-800/60 bg-[#0b0b0d] p-4">
                <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  <CalendarDays className="h-3.5 w-3.5 text-[#fa7517]" />
                  Description
                </div>
                <div className="prose prose-invert max-w-none prose-p:my-2 prose-a:text-[#fa7517] prose-strong:text-white text-sm leading-6 text-gray-200">
                  <RichTextDisplay content={video.description || 'No description yet.'} />
                </div>
              </div>

              {tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#fa7517]/20 bg-[#fa7517]/10 px-3 py-1 text-xs font-medium text-[#ffb37b]"
                    >
                      #{tag.replace(/^#/, '')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DescriptionDock;
