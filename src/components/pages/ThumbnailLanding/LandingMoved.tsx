import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStudioAccountState } from '../../../hooks/useStudioAccount';
import { STUDIO_HOME_PATH } from '../CTREngine/components/billing/StartOffer';

/** The AI Thumbnails landing page, on base.tube since 30 September 2026. */
export const AI_THUMBNAILS_LANDING_URL = 'https://base.tube/ai-thumbnails';

/**
 * `/ai-thumbnails` on this site. A full page load never reaches it: the server answers with a
 * permanent redirect to the landing page (docker/nginx-ai-thumbnails-landing.conf). A link inside the
 * app still can: a signed-in creator goes to the Studio, a visitor to the landing page.
 */
const LandingMoved: React.FC = () => {
  const { account, resolved } = useStudioAccountState();
  const { search } = useLocation();
  const visitor = resolved && account === 'anonymous';
  useEffect(() => {
    if (visitor) window.location.replace(AI_THUMBNAILS_LANDING_URL + search);
  }, [visitor, search]);
  if (resolved && !visitor) return <Navigate to={STUDIO_HOME_PATH} replace />;
  return null;
};

export default LandingMoved;
