// src/components/pages/CTREngine/SettingsPage.tsx
// AI Thumbnails settings hub, /ai-thumbnails/settings/:section — channel style
// (profiles), logos, face reference, preferences, credits, subscription and account in one place.

import React from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { AlertCircle, ArrowUpRight, Lock, X } from 'lucide-react';
import AIThumbnailsLayout from './AIThumbnailsLayout';
import AIThumbnailsSignInOptions from './components/AIThumbnailsSignInOptions';
import { FaceReferenceUploader } from './components/FaceReferenceUploader';
import { ChannelProfilePanel } from './components/studio/ChannelProfilePanel';
import useCTREngine from '../../../hooks/useCTREngine';
import { useStudioAccount } from '../../../hooks/useStudioAccount';
import { AuthMethod } from '../../../types/auth';
import { TechnicalErrorDetail } from '../../common/TechnicalErrorDetail';
import {
  DEFAULT_SETTINGS_SECTION,
  SETTINGS_SECTIONS,
  findSettingsSection,
  settingsPath,
} from './components/settings/settingsSections';
import SettingsLogosSection from './components/settings/SettingsLogosSection';
import SettingsPreferencesSection from './components/settings/SettingsPreferencesSection';
import SettingsCreditsSection from './components/settings/SettingsCreditsSection';
import SettingsSubscriptionSection from './components/settings/SettingsSubscriptionSection';
import SettingsSavedStyles from './components/settings/SettingsSavedStyles';

const secondaryLink =
  'inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-sm text-white transition-colors hover:border-white/30 hover:bg-white/5';

function AccountSection() {
  const { user } = useUser();
  // Wallet sessions have no email; a Clerk session shows its primary address.
  const email =
    localStorage.getItem('auth_method') === AuthMethod.WEB3 ? null : user?.primaryEmailAddress?.emailAddress ?? null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">{email ?? 'Signed in with a wallet'}</p>
        <p className="text-xs text-zinc-500">Name, photo, email and wallet are managed in your base.tube account.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to="/profile" className={secondaryLink}>
          Open your profile
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        {email && (
          <Link to="/profile/settings" className={secondaryLink}>
            Email and security
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}

const SettingsPage: React.FC = () => {
  const { section: sectionParam } = useParams<{ section?: string }>();
  const [searchParams] = useSearchParams();
  // Auth is resolved inside useCTREngine (Clerk or wallet).
  const {
    usageAccess,
    isLoadingQuota,
    faceReference,
    isLoadingFaceReference,
    isUploadingFaceReference,
    uploadFaceReference,
    deleteFaceReference,
    error,
    errorDetail,
    clearError,
    isAuthenticated,
    isAnonymous,
  } = useCTREngine();
  const account = useStudioAccount();

  if (sectionParam && !findSettingsSection(sectionParam)) return <Navigate to="/ai-thumbnails/settings" replace />;
  const current = findSettingsSection(sectionParam ?? DEFAULT_SETTINGS_SECTION) ?? SETTINGS_SECTIONS[0];

  if (!isAuthenticated) {
    return (
      <AIThumbnailsLayout usageAccess={usageAccess} isLoadingQuota={isLoadingQuota}>
        {isAnonymous ? (
          <div className="mx-auto max-w-sm py-16 text-center">
            <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-[#fa7517]/25 bg-[#fa7517]/10">
              <Lock className="h-5 w-5 text-[#fa7517]" aria-hidden="true" />
            </div>
            <h1 className="mb-2 text-2xl font-semibold text-white">Settings</h1>
            <p className="mb-6 text-sm text-zinc-400">Sign in to manage your channel style, logos, face reference and credits.</p>
            <AIThumbnailsSignInOptions />
          </div>
        ) : (
          <p role="status" className="py-16 text-center text-zinc-300">
            Loading your account…
          </p>
        )}
      </AIThumbnailsLayout>
    );
  }

  const available = usageAccess?.mode === 'credits' ? usageAccess.creditInfo.available : null;

  return (
    <AIThumbnailsLayout usageAccess={usageAccess} isLoadingQuota={isLoadingQuota}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Settings</h1>

        <div className="grid gap-5 md:grid-cols-[188px_minmax(0,1fr)] md:gap-10">
          <nav aria-label="Settings sections" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
            <ul className="flex gap-1 md:sticky md:top-6 md:flex-col">
              {SETTINGS_SECTIONS.map((section) => {
                const active = section.id === current.id;
                const Icon = section.icon;
                return (
                  <li key={section.id} className="shrink-0">
                    <Link
                      to={settingsPath(section.id)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${
                        active
                          ? 'bg-[#fa7517]/10 font-medium text-[#fb923c]'
                          : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {section.label}
                      {section.id === 'credits' && available !== null && (
                        <span className="ml-auto pl-2 text-xs tabular-nums text-zinc-500">{available.toLocaleString()}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <section aria-labelledby="settings-section-title" className="min-w-0">
            <div className="mb-5 border-b border-white/[0.08] pb-4">
              <h2 id="settings-section-title" className="text-lg font-semibold text-white">
                {current.label}
              </h2>
              <p className="mt-1 text-sm text-zinc-400">{current.intro}</p>
            </div>

            {current.id === 'style' && (
              <>
                <ChannelProfilePanel key={account} editProfileId={searchParams.get('profile')} />
                <SettingsSavedStyles />
              </>
            )}
            {current.id === 'logos' && <SettingsLogosSection />}
            {current.id === 'face' && (
              <div className="space-y-4">
                {error && (
                  <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
                    <p className="flex-1 text-sm text-red-200">
                      {error}
                      <TechnicalErrorDetail detail={errorDetail} />
                    </p>
                    <button
                      type="button"
                      onClick={clearError}
                      aria-label="Dismiss"
                      className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <FaceReferenceUploader
                  faceReference={faceReference}
                  isLoading={isLoadingFaceReference}
                  isUploading={isUploadingFaceReference}
                  onUpload={uploadFaceReference}
                  onDelete={deleteFaceReference}
                />
              </div>
            )}
            {current.id === 'preferences' && <SettingsPreferencesSection />}
            {current.id === 'credits' && (
              <SettingsCreditsSection usageAccess={usageAccess} isLoadingQuota={isLoadingQuota} />
            )}
            {current.id === 'subscription' && <SettingsSubscriptionSection />}
            {current.id === 'account' && <AccountSection />}
          </section>
        </div>
      </div>
    </AIThumbnailsLayout>
  );
};

export default SettingsPage;
