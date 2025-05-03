import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useYouTubeAuth } from '../../../hooks/useYouTubeAuth';

const YouTubeAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const ytAuth = useYouTubeAuth();

  // On mount or status change, decide where to go next
  useEffect(() => {
    if (ytAuth.status === 'linked') {
      navigate('/creator-hub/create-content-pass', { replace: true });
    } else if (ytAuth.status === 'unlinked') {
      // Show the gating UI by navigating to create-content-pass (it will display connect prompt)
      navigate('/creator-hub/create-content-pass', { replace: true });
    }
  }, [ytAuth.status, navigate]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center pt-16">
      <div className="text-xl animate-pulse">Finishing YouTube connection…</div>
    </div>
  );
};

export default YouTubeAuthCallback; 