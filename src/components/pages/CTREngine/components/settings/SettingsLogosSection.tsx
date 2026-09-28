// Settings › Logos: the logo saved in each channel profile, replaced or removed in place.
// Same endpoints as the profile editor: upload (purpose "logo") then PATCH the profile.
import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react';
import { thumbnailStudioApi, studioError } from '../../../../../api/thumbnailStudio';
import type { StudioProfile } from '../../../../../types/thumbnailStudio';
import { useStudioAccount } from '../../../../../hooks/useStudioAccount';
import { useStudioAssets } from '../../../../../hooks/useStudioAssets';
import { thumbnailMediaUrl } from '../../../../../utils/thumbnailMediaUrl';
import { settingsPath, useChannelProfiles } from './settingsSections';

const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const LOGO_MAX_BYTES = 10 * 1024 * 1024;
const action =
  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40';

function LogoCard({
  profile,
  preview,
  previewLoading,
  onSaved,
}: {
  profile: StudioProfile;
  preview?: { url: string; name: string | null };
  previewLoading: boolean;
  onSaved: () => Promise<void>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'upload' | 'remove' | null>(null);
  const [error, setError] = useState('');
  const [previewFailed, setPreviewFailed] = useState(false);
  const logoId = profile.settings.logoAssetId;

  const save = async (kind: 'upload' | 'remove', logoAssetId: () => Promise<string | null>) => {
    setBusy(kind);
    setError('');
    try {
      const next = await logoAssetId();
      await thumbnailStudioApi.patchProfile(profile.id, profile.version, {
        settings: { ...profile.settings, logoAssetId: next },
      });
      setPreviewFailed(false);
      await onSaved();
    } catch (failure) {
      const problem = studioError(failure);
      setError(
        problem.code === 'PROFILE_CHANGED'
          ? 'This profile changed in another tab. The latest version is shown; try again.'
          : problem.message,
      );
      if (problem.code === 'PROFILE_CHANGED') await onSaved();
    } finally {
      setBusy(null);
    }
  };

  const choose = (file?: File) => {
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type) || file.size > LOGO_MAX_BYTES) {
      setError('Choose a PNG, JPEG or WebP logo up to 10 MB.');
      return;
    }
    void save('upload', async () => (await thumbnailStudioApi.upload(file, 'logo')).id);
  };

  return (
    <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#1c1c20] p-1.5">
        {logoId && preview && !previewFailed ? (
          <img
            src={thumbnailMediaUrl(preview.url)}
            alt={`${profile.name} logo`}
            className="h-full w-full object-contain"
            onError={() => setPreviewFailed(true)}
          />
        ) : (
          <ImagePlus className="h-6 w-6 text-zinc-600" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-white">{profile.name}</span>
          {profile.isDefault && (
            <span className="shrink-0 rounded-full bg-[#fa7517]/15 px-2 py-0.5 text-[10px] font-semibold text-[#fb923c]">
              Default
            </span>
          )}
        </p>
        <p role="status" className="truncate text-xs text-zinc-500">
          {busy === 'upload'
            ? 'Uploading logo…'
            : busy === 'remove'
              ? 'Removing logo…'
              : !logoId
                ? 'No logo'
                : previewFailed
                  ? 'Logo saved · preview unavailable'
                  : preview?.name || (previewLoading ? 'Loading preview…' : 'Logo saved')}
        </p>
        {error && (
          <p role="alert" className="mt-1 text-xs text-red-300">
            {error}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
        <input
          ref={input}
          type="file"
          className="hidden"
          accept={LOGO_TYPES.join(',')}
          aria-label={`${profile.name} logo file`}
          onChange={(event) => {
            choose(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => input.current?.click()}
          className={`${action} border-[#fa7517]/30 bg-[#fa7517]/10 text-[#fb923c] hover:bg-[#fa7517]/20`}
        >
          {logoId ? <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> : <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />}
          {logoId ? 'Replace' : 'Add logo'}
        </button>
        {logoId && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void save('remove', async () => null)}
            aria-label={`Remove the ${profile.name} logo`}
            className={`${action} border-white/15 text-zinc-300 hover:bg-white/10`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Remove
          </button>
        )}
      </div>
    </li>
  );
}

export default function SettingsLogosSection() {
  const account = useStudioAccount();
  const client = useQueryClient();
  const profiles = useChannelProfiles();
  const items = profiles.data?.items ?? [];
  const logoIds = items.map((profile) => profile.settings.logoAssetId).filter((id): id is string => Boolean(id));
  const { queries } = useStudioAssets(logoIds);
  const assets = new Map(logoIds.map((id, index) => [id, queries[index]]));
  const refresh = () => client.invalidateQueries({ queryKey: ['thumbnail-studio', account, 'profiles'] });

  if (profiles.isPending) {
    return (
      <p role="status" className="text-sm text-zinc-400">
        Loading your logos…
      </p>
    );
  }
  if (profiles.error) {
    return (
      <p role="alert" className="text-sm text-red-300">
        {studioError(profiles.error).message}{' '}
        <button type="button" className="underline" onClick={() => void profiles.refetch()}>
          Try again
        </button>
      </p>
    );
  }
  if (items.length === 0) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-white/15 p-4">
        <p className="text-sm text-zinc-400">Logos live in a channel profile. Create one to save your logo.</p>
        <Link
          to={settingsPath('style')}
          className="rounded-lg bg-[#fa7517] px-3 py-2 text-sm font-semibold text-white hover:bg-[#fb8a3c]"
        >
          Create a profile
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {items.map((profile) => {
          const id = profile.settings.logoAssetId;
          const asset = id ? assets.get(id) : undefined;
          return (
            <LogoCard
              key={profile.id}
              profile={profile}
              preview={asset?.data ? { url: asset.data.url, name: asset.data.originalName } : undefined}
              previewLoading={Boolean(asset?.isPending)}
              onSaved={refresh}
            />
          );
        })}
      </ul>
      <p className="text-xs text-zinc-500">Changes apply to new projects. Existing projects keep the logo they were made with.</p>
    </div>
  );
}
