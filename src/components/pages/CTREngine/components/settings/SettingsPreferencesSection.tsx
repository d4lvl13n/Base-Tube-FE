// Settings › Preferences: the defaults each channel profile gives a new project.
// They are profile-level (no account-wide setting exists), so each row links to
// that profile's editor in Channel style.
import React from 'react';
import { Link } from 'react-router-dom';
import { studioError } from '../../../../../api/thumbnailStudio';
import type { StudioProfile, StudioRule } from '../../../../../types/thumbnailStudio';
import { studioLanguages } from '../../../../../utils/studioLabels';
import { settingsPath, useChannelProfiles } from './settingsSections';

const rule = (value: StudioRule) => (value === 'forbid' ? 'Not included' : 'Allowed');
const languageName = (code: string) => studioLanguages.find(([id]) => id === code)?.[1] || code;

function PreferenceRow({ profile }: { profile: StudioProfile }) {
  const { settings } = profile;
  const extra = settings.rules.additional.length;
  const facts: Array<[string, string]> = [
    ['Language', languageName(settings.language)],
    ['Headline', settings.textMode === 'none' ? 'No added text' : 'Suggested text'],
    ['Faces', rule(settings.rules.faces)],
    ['Logos', rule(settings.rules.logos)],
    ['Prices', rule(settings.rules.prices)],
    ['Other rules', extra ? String(extra) : 'None'],
  ];
  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="truncate text-sm font-medium text-white">{profile.name}</span>
        {profile.isDefault && (
          <span className="shrink-0 rounded-full bg-[#fa7517]/15 px-2 py-0.5 text-[10px] font-semibold text-[#fb923c]">
            Default
          </span>
        )}
        <Link
          to={settingsPath('style', `?profile=${encodeURIComponent(profile.id)}`)}
          aria-label={`Edit ${profile.name} preferences`}
          className="ml-auto shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-200 hover:border-white/30 hover:text-white"
        >
          Edit
        </Link>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
        {facts.map(([term, value]) => (
          <div key={term} className="min-w-0">
            <dt className="text-[11px] text-zinc-500">{term}</dt>
            <dd className="truncate text-xs text-zinc-200">{value}</dd>
          </div>
        ))}
      </dl>
    </li>
  );
}

export default function SettingsPreferencesSection() {
  const profiles = useChannelProfiles();
  const items = [...(profiles.data?.items ?? [])].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

  if (profiles.isPending) {
    return (
      <p role="status" className="text-sm text-zinc-400">
        Loading your preferences…
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
        <p className="text-sm text-zinc-400">No channel profile yet. Create one to set your language, headline and rules.</p>
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
        {items.map((profile) => (
          <PreferenceRow key={profile.id} profile={profile} />
        ))}
      </ul>
      <p className="text-xs text-zinc-500">
        You can still change any of these for a single thumbnail while you create it.
      </p>
    </div>
  );
}
