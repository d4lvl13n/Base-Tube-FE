import React, { useEffect } from "react";
import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  StudioValidationCheckCode,
  StudioValidationFeedback,
  StudioValidationFeedbackInput,
} from "@basetube/api";
import {
  thumbnailStudioApi,
  studioError,
} from "../../../../../api/thumbnailStudio";
import { useStudioAccount } from "../../../../../hooks/useStudioAccount";
import { studioProjectKey } from "../../../../../hooks/useStudioProject";
import type { StudioVersion } from "../../../../../types/thumbnailStudio";
import { StudioErrorText } from "./StudioErrorDetail";

/** Preserve newer saves when a project read started before the feedback request. */
export function mergeStudioValidationFeedback(
  current: StudioValidationFeedback[] = [],
  incoming: StudioValidationFeedback[] = [],
) {
  const merged = new Map(current.map((value) => [value.checkCode, value]));
  for (const value of incoming) {
    const previous = merged.get(value.checkCode);
    if (
      !previous ||
      Date.parse(value.updatedAt) >= Date.parse(previous.updatedAt)
    )
      merged.set(value.checkCode, value);
  }
  const result = Array.from(merged.values());
  return JSON.stringify(current) === JSON.stringify(result) ? current : result;
}

export function StudioValidationFeedbackControls({
  version,
  checkCode,
  descriptionId,
}: {
  version: StudioVersion;
  checkCode: StudioValidationCheckCode;
  descriptionId: string;
}) {
  const account = useStudioAccount();
  const client = useQueryClient();
  const key = [
    "thumbnail-studio",
    account,
    "validation-feedback",
    version.id,
  ] as const;
  // The existing project/history endpoints hydrate feedback. This shared cache
  // keeps repeated previews in sync without inventing a separate read endpoint.
  const { data = [] } = useQuery({
    queryKey: key,
    queryFn: () => version.validationFeedback || [],
    initialData: version.validationFeedback || [],
    enabled: false,
  });
  useEffect(() => {
    client.setQueryData<StudioValidationFeedback[]>(
      ["thumbnail-studio", account, "validation-feedback", version.id],
      (previous) =>
        mergeStudioValidationFeedback(previous, version.validationFeedback),
    );
  }, [client, account, version.id, version.validationFeedback]);
  const mutation = useMutation({
    mutationKey: key,
    mutationFn: (input: StudioValidationFeedbackInput) =>
      thumbnailStudioApi.saveValidationFeedback(version.id, input),
    onSuccess: (result) => {
      client.setQueryData<StudioValidationFeedback[]>(key, (previous) =>
        mergeStudioValidationFeedback(previous, result.validationFeedback),
      );
      void client.invalidateQueries({
        queryKey: studioProjectKey(version.projectId, account),
      });
    },
    retry: false,
  });
  const busy = useIsMutating({ mutationKey: key }) > 0;
  const saved = data.find((value) => value.checkCode === checkCode);
  const selectedClass = "border-orange-400 bg-orange-500/15 text-orange-100";
  const buttonClass =
    "rounded-lg border px-2.5 py-1.5 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 disabled:cursor-wait disabled:opacity-50";
  return (
    <fieldset
      aria-describedby={descriptionId}
      className="mt-2 space-y-2 text-zinc-300"
    >
      <legend className="text-xs">Is this issue present?</legend>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={saved?.response === "confirmed"}
          disabled={busy}
          className={`${buttonClass} ${saved?.response === "confirmed" ? selectedClass : "border-white/20"}`}
          onClick={() => mutation.mutate({ checkCode, response: "confirmed" })}
        >
          Issue is real
        </button>
        <button
          type="button"
          aria-pressed={saved?.response === "disputed"}
          disabled={busy}
          className={`${buttonClass} ${saved?.response === "disputed" ? selectedClass : "border-white/20"}`}
          onClick={() => mutation.mutate({ checkCode, response: "disputed" })}
        >
          Not an issue
        </button>
      </div>
      {mutation.isPending ? (
        <p role="status">Saving your feedback…</p>
      ) : (
        saved && (
          <p role="status" className="text-zinc-400">
            Saved:{" "}
            {saved.response === "confirmed" ? "issue is real" : "not an issue"}.
          </p>
        )
      )}
      {mutation.isError && (
        <div role="alert" className="space-y-1 text-red-300">
          <p>
            Your feedback could not be saved.{" "}
            <StudioErrorText error={studioError(mutation.error)} />
          </p>
          <button
            type="button"
            className="underline focus-visible:outline focus-visible:outline-2"
            disabled={busy}
            onClick={() =>
              mutation.variables && mutation.mutate(mutation.variables)
            }
          >
            Try again
          </button>
        </div>
      )}
    </fieldset>
  );
}
