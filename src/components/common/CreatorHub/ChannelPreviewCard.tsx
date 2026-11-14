import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Users, Video, Edit3, Trash2 } from 'lucide-react';
import { Channel } from '../../../types/channel';
import EditChannelModal from '../../pages/CreatorHub/ChannelManagement/components/EditChannelModal';
import DeleteChannel from '../../pages/CreatorHub/ChannelManagement/components/DeleteChannel';
import DOMPurify from 'dompurify';
import { observeLayoutChanges } from '../../../utils/observeLayoutChanges';
import { button, cx, surface } from '../../pages/CreatorHub/Business/businessStyles';

interface ChannelPreviewCardProps {
  channel: Channel;
  onUpdate?: () => void;
  onDeleted?: () => void;
}

/** Icon actions over the cover: readable on any image, orange focus ring, no grey slab. */
const coverAction = cx(
  button.icon,
  'h-9 w-9 border border-white/10 bg-black/60 text-gray-200 backdrop-blur-sm hover:bg-black/80 hover:text-white',
);

const ChannelPreviewCard: React.FC<ChannelPreviewCardProps> = ({ channel, onUpdate, onDeleted }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [descriptionOverflows, setDescriptionOverflows] = useState(false);
  const descriptionRef = useRef<HTMLDivElement | null>(null);

  const coverImageUrl = channel.channel_image_url ||
    (channel.channel_image_path
      ? channel.channel_image_path.startsWith('http')
        ? channel.channel_image_path
        : `${process.env.REACT_APP_API_URL}/${channel.channel_image_path}`
      : '/assets/default-cover.jpg');

  useEffect(() => setCoverFailed(false), [coverImageUrl]);

  // Whether the clamp is actually hiding anything. A one-line description with
  // a "more" link under it is a lie, and this card is shown to a creator who
  // pasted a wall of text into the field at least once.
  //
  // Measured again on resize: collapsing the sidebar widens this card, and text
  // that needed three lines at 240px may well fit in two at 60px.
  useLayoutEffect(() => {
    const node = descriptionRef.current;
    if (!node) {
      setDescriptionOverflows(false);
      return undefined;
    }

    const measure = () => {
      if (descriptionExpanded) return;
      setDescriptionOverflows(node.scrollHeight - node.clientHeight > 1);
    };

    measure();

    return observeLayoutChanges([node], measure);
  }, [channel.description, descriptionExpanded]);

  // Sanitize the description HTML to prevent XSS attacks
  const sanitizeHTML = (html: string) => {
    return {
      __html: DOMPurify.sanitize(html)
    };
  };

  // Function to create a plain text version of the HTML for accessibility
  const createPlainText = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  return (
    <>
      <article className={cx(surface.card, 'w-full')}>
        {/* Cover, with the channel's name and actions over it */}
        <div className="relative h-44 bg-black sm:h-48">
          {/* A cover that fails to load must leave a surface behind, not the
              words "<name> cover" sitting on top of the channel title. */}
          {coverFailed ? (
            <div
              data-testid="channel-cover-placeholder"
              aria-hidden="true"
              className="h-full w-full bg-gradient-to-br from-[#fa751710] via-black to-black"
            />
          ) : (
            <img
              src={coverImageUrl}
              alt=""
              aria-hidden="true"
              onError={() => setCoverFailed(true)}
              className="h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent">
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl">{channel.name}</h3>
                  <p className="text-sm text-gray-300">@{channel.handle}</p>

                  {/* Channel description - render HTML safely */}
                  {channel.description && (
                    <div className="mt-1 max-w-2xl">
                      <div
                        ref={descriptionRef}
                        data-testid="channel-description"
                        className={`overflow-hidden text-xs text-gray-300 sm:text-sm ${
                          descriptionExpanded ? 'max-h-40 overflow-y-auto' : 'line-clamp-2'
                        }`}
                        dangerouslySetInnerHTML={sanitizeHTML(channel.description)}
                        aria-label={createPlainText(channel.description)}
                      />
                      {(descriptionOverflows || descriptionExpanded) && (
                        <button
                          type="button"
                          onClick={() => setDescriptionExpanded((open) => !open)}
                          aria-expanded={descriptionExpanded}
                          className="mt-0.5 rounded-sm text-xs text-[#fa7517] hover:text-[#ff8c3a]
                                     focus-visible:outline-none focus-visible:ring-2
                                     focus-visible:ring-[#fa7517]/50"
                        >
                          {descriptionExpanded ? 'Less' : 'More'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <Link to={`/channel/${channel.handle}`} className={coverAction} title="View Channel">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                  <button onClick={() => setIsEditModalOpen(true)} className={coverAction} title="Edit Channel">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className={cx(coverAction, 'hover:border-red-500/40 hover:text-red-300')}
                    title="Delete Channel"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-gray-800/50 px-4 py-3 text-sm text-gray-300 sm:px-5">
          <span className="flex items-center gap-1.5 tabular-nums">
            <Users size={14} className="text-[#fa7517]" aria-hidden="true" />
            {(channel.subscribers_count ?? 0).toLocaleString()} subscribers
          </span>
          <span className="flex items-center gap-1.5 tabular-nums">
            <Video size={14} className="text-gray-500" aria-hidden="true" />
            {/* `videos_count` is the PUBLIC count; the analytics
                tables also list private and unlisted videos. */}
            {(channel.videos_count ?? 0).toLocaleString()} public videos
          </span>
        </div>
      </article>

      {/* Edit Modal */}
      <EditChannelModal
        channel={channel}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={() => {
          setIsEditModalOpen(false);
          onUpdate?.();
        }}
      />

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-800/70 bg-black p-5 shadow-[0_32px_80px_rgba(0,0,0,0.8)] sm:p-6">
            <DeleteChannel
              channelId={channel.id.toString()}
              channelName={channel.name}
              onDeleted={() => {
                setShowDeleteDialog(false);
                if (onDeleted) onDeleted();
              }}
              className="!mt-0 !pt-0 !border-0"
            />
            <button
              onClick={() => setShowDeleteDialog(false)}
              className={cx(button.secondary, 'mt-4 w-full')}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChannelPreviewCard;
