import React from 'react';
import AIThumbnailsLayout from './AIThumbnailsLayout';
import useCTREngine from '../../../hooks/useCTREngine';
import { useStudioAccount } from '../../../hooks/useStudioAccount';
import StudioCreatePage from './StudioCreatePage';
import VisitorCreatePage from './VisitorCreatePage';

/**
 * /ai-thumbnails/generate. Signed-in creators always get the Studio; the choice
 * never depends on /capabilities (spec §17.1). A visitor writes the brief and
 * creates a free account to generate (VisitorCreatePage).
 */
const GeneratePage: React.FC = () => {
  const ctr = useCTREngine();
  const account = useStudioAccount();
  if (ctr.isAuthenticated) return <StudioCreatePage key={account} access={ctr} />;
  if (ctr.isAnonymous) return <VisitorCreatePage usageAccess={ctr.usageAccess} isLoadingQuota={ctr.isLoadingQuota} />;
  return <AIThumbnailsLayout usageAccess={ctr.usageAccess} isLoadingQuota={ctr.isLoadingQuota}>
    <p role="status" className="text-zinc-300">Loading your account…</p>
  </AIThumbnailsLayout>;
};
export default GeneratePage;
