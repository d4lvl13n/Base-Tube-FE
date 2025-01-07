import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';
import { Edit3, Trash2, Users, Video, Link2, Share2, BarChart2 } from 'lucide-react';
import { getChannelById, deleteChannel } from '../../../../api/channel';
import { useChannelSelection } from '../../../../contexts/ChannelSelectionContext';
import EditChannelModal from './components/EditChannelModal';
import DeleteConfirmationDialog from '../../../common/DeleteConfirmationDialog';
import { Channel } from '../../../../types/channel';
import { styles } from './styles';

const ChannelManagement: React.FC = () => {
  // State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { selectedChannelId, setSelectedChannelId } = useChannelSelection();

  // Fetch channel data
  const { 
    data: channel,
    isLoading,
    error,
    refetch 
  } = useQuery<Channel>({
    queryKey: ['channel', selectedChannelId],
    queryFn: () => getChannelById(selectedChannelId).then(res => res.channel),
    enabled: !!selectedChannelId,
  });

  // Handlers
  const handleDeleteChannel = async () => {
    if (!selectedChannelId) return;

    try {
      await deleteChannel(selectedChannelId);
      toast.success('Channel deleted successfully');
      setSelectedChannelId('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete channel';
      toast.error(message);
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // Stats cards data
  const statsCards = [
    {
      icon: Users,
      label: 'Subscribers',
      value: channel?.subscribers_count || 0,
      change: '+12%',
      isPositive: true,
    },
    {
      icon: Video,
      label: 'Videos',
      value: channel?.videos_count || 0,
      change: '+3',
      isPositive: true,
    },
    {
      icon: BarChart2,
      label: 'Total Views',
      value: '23.4K',
      change: '+18%',
      isPositive: true,
    },
  ];

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingPulse}>
          <div className={`${styles.loadingBlock} h-32 mb-6`} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`${styles.loadingBlock} h-24`} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${styles.loadingBlock} h-64`} />
            <div className={`${styles.loadingBlock} h-64`} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h3 className="font-medium mb-2">Error Loading Channel</h3>
          <p>{error instanceof Error ? error.message : 'Failed to load channel'}</p>
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyContainer}>
          <Share2 className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No Channel Selected</h3>
          <p className={styles.emptyText}>
            Please select a channel from the dropdown to manage its details and settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Channel Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <img
            src={channel.channel_image_url || '/assets/default-channel-image.png'}
            alt={channel.name}
            className={styles.channelImage}
          />
          <div>
            <h1 className={styles.title}>{channel.name}</h1>
            <p className={styles.handle}>@{channel.handle}</p>
          </div>
        </div>
        <div className={styles.actionButtons}>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className={styles.editButton}
          >
            <Edit3 className="w-4 h-4" />
            Edit Channel
          </button>
          <button
            onClick={() => setIsDeleteDialogOpen(true)}
            className={styles.deleteButton}
          >
            <Trash2 className="w-4 h-4" />
            Delete Channel
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <div key={index} className={styles.card}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <stat.icon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-400">{stat.label}</span>
              </div>
              <span className={`text-sm ${stat.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-semibold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className={styles.cardGrid}>
        {/* Channel Information */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Channel Information</h2>
          <div className="space-y-6">
            <div>
              <label className={styles.label}>Description</label>
              <p className="mt-2 text-gray-300 whitespace-pre-wrap">
                {channel.description || 'No description provided'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={styles.label}>Created</label>
                <p className="mt-1 text-gray-300">
                  {new Date(channel.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className={styles.label}>Last Updated</label>
                <p className="mt-1 text-gray-300">
                  {new Date(channel.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Social Links</h2>
          <div className={styles.socialLinksContainer}>
            {(!channel.facebook_link && !channel.instagram_link && !channel.twitter_link) ? (
              <p className="text-gray-400 text-sm">No social links have been added yet.</p>
            ) : (
              <>
                {channel.facebook_link && (
                  <a
                    href={channel.facebook_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.socialLink.base} ${styles.socialLink.facebook}`}
                  >
                    <Link2 className="w-4 h-4" />
                    Facebook
                  </a>
                )}
                {channel.instagram_link && (
                  <a
                    href={channel.instagram_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.socialLink.base} ${styles.socialLink.instagram}`}
                  >
                    <Link2 className="w-4 h-4" />
                    Instagram
                  </a>
                )}
                {channel.twitter_link && (
                  <a
                    href={channel.twitter_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.socialLink.base} ${styles.socialLink.twitter}`}
                  >
                    <Link2 className="w-4 h-4" />
                    Twitter
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditChannelModal
        channel={channel}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={() => {
          refetch();
          setIsEditModalOpen(false);
          toast.success('Channel updated successfully');
        }}
      />

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteChannel}
        title="Delete Channel"
        message={`Are you sure you want to delete "${channel.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default ChannelManagement; 