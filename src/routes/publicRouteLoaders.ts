// Shared with intent prefetching; each function retains its own lazy chunk.
export const loadVideoPage = () => import('../components/pages/SingleVideo');
export const loadChannelPage = () => import('../components/pages/ChannelDetailPage');
