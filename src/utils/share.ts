import { toast } from 'react-toastify';
import { ShareToast } from '../components/common/Toast/ShareToast';

interface ShareVideoProps {
  videoId: string;
  title: string;
  onOpenSharePopup: (url: string, title: string) => void;
}

export const shareVideo = async ({ videoId, title, onOpenSharePopup }: ShareVideoProps) => {
  if (!videoId) {
    console.error('Video ID is undefined');
    toast.error(ShareToast({ type: 'error' }));
    return;
  }

  // Construct URL with explicit video path and validation
  try {
    const baseUrl = window.location.origin;
    const videoUrl = new URL(`/video/${videoId}`, baseUrl).toString();
    const shareText = `Check out this video on Base.Tube: ${title || 'Video'}`;

    console.log('Sharing URL:', videoUrl); // Debug log

    // Check if it's mobile by checking window width
    const isMobile = window.innerWidth <= 768;

    // Only use Web Share API on mobile devices
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: videoUrl,
        });
      } catch (error) {
        console.error('Share error:', error); // Debug log
        if ((error as Error).name !== 'AbortError') {
          // Open desktop share popup instead of toast
          onOpenSharePopup(videoUrl, title);
        }
      }
    } else {
      // Desktop or mobile without share API: Open share popup
      onOpenSharePopup(videoUrl, title);
    }
  } catch (error) {
    console.error('Error constructing share URL:', error);
    toast.error(ShareToast({ type: 'error' }));
  }
};