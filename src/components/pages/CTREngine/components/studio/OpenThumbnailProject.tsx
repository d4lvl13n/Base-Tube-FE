import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useStudioAccount } from "../../../../../hooks/useStudioAccount";
import { invalidateStudioProjectLists } from "../../../../../hooks/useStudioProject";
import {
  thumbnailStudioApi,
  studioError,
} from "../../../../../api/thumbnailStudio";
import type { StudioErrorInfo } from "../../../../../api/studioErrors";
import { emptyStudioBrief } from "../../../../../types/thumbnailStudio";
import { studioSecondary } from "./StudioControls";
import { StudioErrorText } from "./StudioErrorDetail";
export function OpenThumbnailProject({
  thumbnailId,
  prompt,
}: {
  thumbnailId: string | number;
  prompt: string;
}) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const account = useStudioAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<StudioErrorInfo | null>(null);
  if (!/^\d+$/.test(String(thumbnailId))) return null;
  return (
    <div className="space-y-2">
      <button
        className={studioSecondary}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const asset = await thumbnailStudioApi.assetFromThumbnail(
              Number(thumbnailId),
            );
            const brief = emptyStudioBrief();
            brief.visualDirection = prompt.slice(0, 3000);
            const project = await thumbnailStudioApi.createProject({
              name: "Imported thumbnail",
              briefInput: brief,
              importedAssetId: asset.id,
              sourceContext: { imageAssetId: asset.id },
            });
            invalidateStudioProjectLists(client, account);
            navigate(`/ai-thumbnails/projects/${project.id}`);
          } catch (failure) {
            setError(studioError(failure));
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Opening project…" : "Open in a project · free"}
      </button>
      <p className="text-xs text-zinc-400">
        To edit this image, open it in a project. Previous edits are not imported as separate versions.
      </p>
      {error && (
        <p role="alert" className="text-xs text-red-300">
          <StudioErrorText error={error} />
        </p>
      )}
    </div>
  );
}
