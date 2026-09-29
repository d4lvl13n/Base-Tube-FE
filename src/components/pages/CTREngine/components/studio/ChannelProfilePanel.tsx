import { StudioSelect } from "./StudioSelect";
import { ThumbnailStylePicker } from "../../../../common/ThumbnailPackaging";
import { useStudioAccount } from "../../../../../hooks/useStudioAccount";
import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  thumbnailStudioApi,
  studioError,
} from "../../../../../api/thumbnailStudio";
import {
  defaultStudioSettings,
  StudioProfile,
  StudioProfileSettings,
  StudioProfileRef,
} from "../../../../../types/thumbnailStudio";
import {
  AssetInput,
  studioButton,
  studioSecondary,
  studioField,
} from "./StudioControls";
import { StyleFields, RuleListInput, LanguageSelect } from "./BriefReview";
import { studioLanguages } from "../../../../../utils/studioLabels";
import { subscriptionKey, useMySubscription, useSubscriptionPlans } from "../../../../../hooks/useSubscription";
import {
  profileLimitReached,
  profileQuotaProblem,
  ProfileQuotaNotice,
  ReadOnlyBadge,
  type ProfileQuotaProblem,
} from "../billing/ProfileQuotaNotice";

/** "English · DejaVu Sans · Suggested text": a profile at a glance. */
export function studioProfileSummary(settings: StudioProfileSettings): string {
  const language =
    studioLanguages.find(([code]) => code === settings.language)?.[1] ||
    settings.language;
  return [
    language,
    settings.style.font,
    settings.textMode === "none" ? "No added text" : "Suggested text",
  ].join(" · ");
}

export function ChannelProfilePanel({
  onApply,
  describeAction,
  acceptedStyle,
  editProfileId,
}: {
  acceptedStyle?: Partial<StudioProfileSettings> | null;
  onApply?: (profile: StudioProfileRef | null) => Promise<void>;
  /** The free one-click "Ask for style suggestions" for a style image (Studio projects). */
  describeAction?: (assetId: string) => React.ReactNode;
  /** Settings: open this profile's editor once the list has loaded. */
  editProfileId?: string | null;
}) {
  /** Settings (no project to apply to): the section supplies the heading, profiles show as cards. */
  const standalone = !onApply;
  const formRef = useRef<HTMLFormElement>(null);
  const openedFor = useRef<string | null>(null);
  const account = useStudioAccount();
  const client = useQueryClient();
  const profiles = useQuery({
    queryKey: ["thumbnail-studio", account, "profiles"],
    queryFn: () => thumbnailStudioApi.profiles(),
    retry: false,
  });
  const [editing, setEditing] = useState<StudioProfile | null>(null);
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("");
  const [settings, setSettings] = useState(defaultStudioSettings);
  const [isDefault, setDefault] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [legacyStyleId, setLegacyStyleId] = useState<number | undefined>();
  const [warnings, setWarnings] = useState<string[]>([]);
  // The plan's channel profile limit: a refused new profile, or a read-only one.
  const [quota, setQuota] = useState<ProfileQuotaProblem | null>(null);
  const plan = useMySubscription();
  const plans = useSubscriptionPlans();
  useEffect(() => {
    if (acceptedStyle) {
      setSettings((previous) => ({
        ...previous,
        style: { ...previous.style, ...acceptedStyle.style },
        ...("styleAssetId" in acceptedStyle
          ? { styleAssetId: acceptedStyle.styleAssetId || null }
          : {}),
      }));
      setOpen(true);
      setWarnings([
        "Review these style suggestions before saving your profile.",
      ]);
    }
  }, [acceptedStyle]);
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    setQuota(null);
    try {
      await action();
      await client.invalidateQueries({
        queryKey: ["thumbnail-studio", account, "profiles"],
      });
      // Profiles used against the plan's limit.
      void client.invalidateQueries({ queryKey: subscriptionKey(account) });
    } catch (failure) {
      const refused = profileQuotaProblem(failure);
      if (refused) {
        // Said once, with the plans; the form keeps what was typed.
        setQuota(refused);
        if (refused.kind === "readOnly") void profiles.refetch();
        return;
      }
      setError(studioError(failure).message);
      if (studioError(failure).code === "PROFILE_CHANGED") {
        setConflict(true);
        await profiles.refetch();
      }
    } finally {
      setBusy(false);
    }
  };
  const edit = (profile?: StudioProfile) => {
    setQuota(null);
    if (profile?.readOnly) {
      setQuota({ kind: "readOnly" });
      return;
    }
    // At the plan's limit already: say so before a form is filled in.
    const limit = profile ? null : profileLimitReached(plan.data, plans.data);
    if (limit) {
      setOpen(false);
      setQuota({ kind: "limit", details: limit });
      return;
    }
    setEditing(profile || null);
    setName(profile?.name || "");
    setChannel(profile?.youtubeChannelId || "");
    setSettings(profile?.settings || defaultStudioSettings());
    setDefault(profile?.isDefault || false);
    setOpen(true);
    setWarnings([]);
    setError("");
    setConflict(false);
  };
  useEffect(() => {
    if (!editProfileId || openedFor.current === editProfileId) return;
    const match = profiles.data?.items.find(
      (profile) => profile.id === editProfileId,
    );
    if (match && !match.readOnly) {
      openedFor.current = editProfileId;
      edit(match);
    }
    // `edit` only sets state; the list is what this waits for.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editProfileId, profiles.data]);
  useEffect(() => {
    // Settings lists the profiles above the editor: bring the editor into view.
    if (open && standalone) formRef.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, [open, editing, standalone]);
  return (
    <section className={standalone ? "" : "rounded-2xl border border-white/10 p-4"}>
      {!standalone && (
        <>
          <h2 className="mb-2 font-semibold text-white">Channel preferences</h2>
          <p className="mb-3 text-xs text-zinc-400">
            Applying a profile copies its current settings into this project.
            Existing projects keep their saved version.
          </p>
        </>
      )}
        <>
          {standalone ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {profiles.isPending && (
                <p role="status" className="text-sm text-zinc-400">
                  Loading your profiles…
                </p>
              )}
              {profiles.data?.items.map((profile) => (
                <div
                  key={profile.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    editing?.id === profile.id && open
                      ? "border-[#fa7517]/60 bg-[#fa7517]/[0.06]"
                      : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  <span className="flex shrink-0 -space-x-1.5" aria-hidden="true">
                    {[
                      profile.settings.style.primaryColor,
                      profile.settings.style.secondaryColor,
                      profile.settings.style.accentColor,
                    ].map((color, index) => (
                      <span
                        key={index}
                        className="h-5 w-5 rounded-full border-2 border-[#0d0d0f]"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-white">
                        {profile.name}
                      </span>
                      {profile.isDefault && (
                        <span className="shrink-0 rounded-full bg-[#fa7517]/15 px-2 py-0.5 text-[10px] font-semibold text-[#fb923c]">
                          Default
                        </span>
                      )}
                      {profile.readOnly && <ReadOnlyBadge />}
                    </span>
                    <span className="block truncate text-xs text-zinc-500">
                      {studioProfileSummary(profile.settings)}
                    </span>
                  </span>
                  {!profile.readOnly && (
                    <button
                      type="button"
                      disabled={busy}
                      aria-label={`Edit ${profile.name}`}
                      className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-200 hover:border-white/30 hover:text-white disabled:opacity-40"
                      onClick={() => edit(profile)}
                    >
                      Edit
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                disabled={busy}
                className="flex min-h-[62px] items-center justify-center rounded-xl border border-dashed border-white/20 px-3 text-sm text-zinc-300 hover:border-[#fa7517]/60 hover:text-white disabled:opacity-40"
                onClick={() => edit()}
              >
                New profile
              </button>
            </div>
          ) : (
          <div className="flex flex-wrap gap-2">
            {profiles.data?.items.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center gap-1 rounded-xl border border-white/10 p-1"
              >
                {profile.readOnly ? (
                  <span className="flex items-center gap-2 px-3 text-sm text-zinc-400">
                    {profile.name}
                    <ReadOnlyBadge />
                  </span>
                ) : onApply ? (
                  <button
                    type="button"
                    disabled={busy}
                    className={studioSecondary}
                    onClick={() =>
                      run(() =>
                        onApply!({ id: profile.id, version: profile.version }),
                      )
                    }
                  >
                    Apply {profile.name}
                    {profile.isDefault ? " · default" : ""}
                  </button>
                ) : (
                  <span className="px-3 text-sm text-white">
                    {profile.name}
                    {profile.isDefault ? " · default" : ""}
                  </span>
                )}
                {!profile.readOnly && (
                  <button
                    type="button"
                    disabled={busy}
                    className="px-2 text-xs text-zinc-400 underline"
                    onClick={() => edit(profile)}
                  >
                    Edit
                  </button>
                )}
              </div>
            ))}
            <button
              className={studioSecondary}
              disabled={busy}
              onClick={() => edit()}
            >
              New profile
            </button>
            {onApply && (
              <button
                className={studioSecondary}
                disabled={busy}
                onClick={() => run(() => onApply!(null))}
              >
                Remove profile
              </button>
            )}
          </div>
          )}
          {profiles.data?.nextCursor && (
            <button
              className="mt-2 text-xs text-white underline"
              onClick={() => {
                void (async () => {
                  const next = await thumbnailStudioApi.profiles({
                    cursor: profiles.data!.nextCursor!,
                  });
                  client.setQueryData(
                    ["thumbnail-studio", account, "profiles"],
                    {
                      items: [...profiles.data!.items, ...next.items],
                      nextCursor: next.nextCursor,
                    },
                  );
                })().catch((failure) => setError(studioError(failure).message));
              }}
            >
              Load more profiles
            </button>
          )}
          {open && (
            <form
              ref={formRef}
              aria-label={editing ? `Edit ${editing.name}` : "New profile"}
              className="mt-4 scroll-mt-6 space-y-4 border-t border-white/10 pt-4"
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  if (editing)
                    await thumbnailStudioApi.patchProfile(
                      editing.id,
                      editing.version,
                      {
                        name,
                        settings,
                        youtubeChannelId: channel || null,
                        isDefault,
                      },
                    );
                  else
                    await thumbnailStudioApi.createProfile({
                      name,
                      settings,
                      youtubeChannelId: channel || null,
                      isDefault,
                    });
                  setOpen(false);
                });
              }}
            >
              <fieldset disabled={busy} className="space-y-4">
                <div className={standalone ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>
                <label className="block text-sm text-zinc-200">
                  Profile name
                  <input
                    required
                    maxLength={80}
                    className={studioField}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
                <label className="block text-sm text-zinc-200">
                  YouTube channel ID (optional)
                  <input
                    maxLength={64}
                    className={studioField}
                    value={channel}
                    onChange={(event) => setChannel(event.target.value)}
                  />
                </label>
                </div>
                <div className={standalone ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>
                <label className="block text-sm text-zinc-200">
                  Language
                  <LanguageSelect
                    value={settings.language}
                    onChange={(language) =>
                      setSettings({ ...settings, language })
                    }
                  />
                </label>
                <label className="block text-sm text-zinc-200">
                  Default headline
                  <StudioSelect
                    className={studioField}
                    value={settings.textMode}
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        textMode: event.target.value as "suggest" | "none",
                      })
                    }
                  >
                    <option value="suggest">Suggest text</option>
                    <option value="none">No added text</option>
                  </StudioSelect>
                </label>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(["faces", "logos", "prices"] as const).map((key) => (
                    <label
                      key={key}
                      className="text-sm capitalize text-zinc-200"
                    >
                      {key}
                      <StudioSelect
                        className={studioField}
                        value={settings.rules[key]}
                        onChange={(event) =>
                          setSettings({
                            ...settings,
                            rules: {
                              ...settings.rules,
                              [key]: event.target.value as "allow" | "forbid",
                            },
                          })
                        }
                      >
                        <option value="allow">Allow</option>
                        <option value="forbid">Do not include</option>
                      </StudioSelect>
                    </label>
                  ))}
                </div>
                <label className="block text-sm text-zinc-200">
                  Other rules, one per line
                  <RuleListInput
                    value={settings.rules.additional}
                    onChange={(additional) =>
                      setSettings({
                        ...settings,
                        rules: { ...settings.rules, additional },
                      })
                    }
                  />
                </label>
                <StyleFields
                  value={settings.style}
                  onChange={(style) => setSettings({ ...settings, style })}
                />
                <div className={standalone ? "grid gap-4 lg:grid-cols-3" : "space-y-4"}>
                {(["face", "logo", "style"] as const).map((purpose) => {
                  const key = `${purpose}AssetId` as
                    | "faceAssetId"
                    | "logoAssetId"
                    | "styleAssetId";
                  return (
                    <AssetInput
                      key={purpose}
                      label={`${purpose} reference`}
                      purpose={purpose}
                      value={settings[key]}
                      onChange={(asset) =>
                        setSettings({ ...settings, [key]: asset?.id || null })
                      }
                    />
                  );
                })}
                </div>
                <label className="block text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(event) => setDefault(event.target.checked)}
                  />{" "}
                  Make this my default profile
                </label>
                <ThumbnailStylePicker
                  value={legacyStyleId}
                  onChange={setLegacyStyleId}
                  disabled={busy}
                />
                <button
                  type="button"
                  className={studioSecondary}
                  onClick={() =>
                    run(async () => {
                      const proposal =
                        await thumbnailStudioApi.importLegacyProfile({
                          language: settings.language,
                          includeFace: true,
                          includeLogo: true,
                          styleThumbnailId: legacyStyleId,
                        });
                      setSettings(proposal.settings);
                      setWarnings(proposal.warnings);
                    })
                  }
                >
                  Review my existing logo, face and brand settings
                </button>
                {settings.styleAssetId && describeAction && (
                  <div className="mt-2">{describeAction(settings.styleAssetId)}</div>
                )}
                {warnings.map((warning, index) => (
                  <p key={index} className="text-xs text-amber-200">
                    {warning}
                  </p>
                ))}
                <p className="text-xs text-zinc-400">
                  Review these settings before saving. Imported image words,
                  faces and logos are not automatically copied into your
                  profile.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className={studioButton}>
                    Save profile
                  </button>
                  <button
                    type="button"
                    className={studioSecondary}
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </button>
                  {editing && (
                    <button
                      type="button"
                      className={studioSecondary}
                      onClick={() =>
                        run(async () => {
                          await thumbnailStudioApi.patchProfile(
                            editing.id,
                            editing.version,
                            { archived: true },
                          );
                          setOpen(false);
                        })
                      }
                    >
                      Archive profile
                    </button>
                  )}
                </div>
              </fieldset>
            </form>
          )}
        </>
      {quota && <ProfileQuotaNotice problem={quota} className="mt-3" />}
      {(error || profiles.error) && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error || studioError(profiles.error).message}
          {error.includes("changed")
            ? " Reopen the profile to review the current version before saving again."
            : ""}
        </p>
      )}
      {conflict && editing && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className={studioSecondary}
            onClick={() => {
              const current = profiles.data?.items.find(
                (profile) => profile.id === editing.id,
              );
              if (current) edit(current);
            }}
          >
            Reload the current profile and discard my changes
          </button>
          <button
            className={studioSecondary}
            onClick={() => {
              setEditing(null);
              setName(`${name.slice(0, 70)} (copy)`);
              setConflict(false);
              setError("");
            }}
          >
            Keep my changes as a new profile
          </button>
        </div>
      )}
    </section>
  );
}
