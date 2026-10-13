import React from 'react';
import { useDraftWorkspaceContext } from '../../../contexts/DraftWorkspaceContext';
import UploadWorkspace from '../../upload/workspace/UploadWorkspace';

/**
 * Every upload entry point (UP-UX §4): `/creator-hub/upload`,
 * `/creator-hub/content-studio` and `/creator-hub/uploads(/:draftId)` open the
 * same workspace, so existing links and bookmarks keep working.
 *
 * The workspace exists as soon as the account is known; these routes are
 * protected, so the empty render below lasts for the first mount only.
 */
const UploadEntry: React.FC = () => {
  const workspace = useDraftWorkspaceContext();
  return workspace ? <UploadWorkspace /> : null;
};

export default UploadEntry;
