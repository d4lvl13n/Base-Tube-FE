import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, KeyRound, Loader2, Plus, Upload } from 'lucide-react';
import { useChannelSelection } from '../../../../contexts/ChannelSelectionContext';
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '../../../../hooks/useApiKeys';
import type { ApiKeyScope, ApiKeyView, IssuedApiKey } from '../../../../api/apiKeys';
import { plainApiError } from '../../../../utils/plainApiError';
import ConfirmDialog from '../ManagePasses/ConfirmDialog';
import { BusinessHeader, CopyButton, EmptyState, LinkField, Panel, SkeletonPanel } from '../Business/BusinessUi';
import { button, cx, field, frame, meter, note, pillClass, table, text, type PillTone } from '../Business/businessStyles';

/** Where the API answers. Same host as the site; the routes live under /v1. */
const API_BASE = `${(process.env.REACT_APP_API_URL ?? 'https://beta.base.tube').replace(/\/+$/, '')}/v1`;

/** The public documentation page, once it is published. */
const DOCS_URL = process.env.REACT_APP_UPLOAD_API_DOCS_URL;

/** What each permission lets a key do, in the creator's words. */
const SCOPE_TEXT: Record<ApiKeyScope, { label: string; detail: string }> = {
  'videos:upload': { label: 'Upload videos', detail: 'Start and finish uploads.' },
  'videos:read': { label: 'See videos', detail: 'List your channels and videos, see when a video is ready.' },
  'videos:write': { label: 'Edit videos', detail: 'Change title, description, tags, thumbnail, and make a video public.' },
  'videos:delete': { label: 'Delete videos', detail: 'Delete a video for good. Only tick this if your tool needs it.' },
  'images:generate': { label: 'Generate images', detail: 'Use the AI image API.' },
};

const SCOPE_ORDER: ApiKeyScope[] = ['videos:upload', 'videos:read', 'videos:write', 'videos:delete', 'images:generate'];

const STATUS_PILL: Record<ApiKeyView['status'], { tone: PillTone; label: string }> = {
  active: { tone: 'positive', label: 'Active' },
  revoked: { tone: 'negative', label: 'Revoked' },
  expired: { tone: 'neutral', label: 'Expired' },
};

function dateText(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function firstVideoExample(): string {
  return [
    'export BASETUBE_API_KEY=bt_live_...   # your key',
    `curl -s ${API_BASE}/me -H "Authorization: Bearer $BASETUBE_API_KEY"`,
    '',
    '# Send a video with the reference script (Node 18+):',
    'node basetube-upload.mjs episode-12.mp4 --title "Episode 12"',
  ].join('\n');
}

// --- Create a key -------------------------------------------------------------------------

interface CreateKeyFormProps {
  defaultScopes: ApiKeyScope[];
  disabled: boolean;
  onCreated: (issued: IssuedApiKey) => void;
}

const CreateKeyForm: React.FC<CreateKeyFormProps> = ({ defaultScopes, disabled, onCreated }) => {
  const { channels } = useChannelSelection();
  const create = useCreateApiKey();
  const [name, setName] = useState('');
  const [channelId, setChannelId] = useState<string>('all');
  const [scopes, setScopes] = useState<Set<ApiKeyScope>>(new Set(defaultScopes));

  useEffect(() => setScopes(new Set(defaultScopes)), [defaultScopes]);

  const toggle = (scope: ApiKeyScope) =>
    setScopes((current) => {
      const next = new Set(current);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      return next;
    });

  const canSubmit = !disabled && name.trim().length > 0 && scopes.size > 0 && !create.isPending;
  const error = create.isError ? plainApiError(create.error, 'The key could not be created. Please try again.') : null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    create.mutate(
      {
        name: name.trim(),
        scopes: SCOPE_ORDER.filter((scope) => scopes.has(scope)),
        channelId: channelId === 'all' ? null : Number(channelId),
      },
      {
        onSuccess: (issued) => {
          onCreated(issued);
          // The answer carries the key: do not keep it in the mutation cache.
          create.reset();
          setName('');
          setChannelId('all');
          setScopes(new Set(defaultScopes));
        },
      }
    );
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className={field.label}>Name</span>
          <input
            className={field.input}
            value={name}
            maxLength={100}
            placeholder="For example: Nightly export"
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="block space-y-1.5">
          <span className={field.label}>Channel</span>
          <select className={field.input} value={channelId} onChange={(event) => setChannelId(event.target.value)}>
            <option value="all">All my channels</option>
            {channels.map((channel) => (
              <option key={channel.id} value={String(channel.id)}>
                Only {channel.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset>
        <legend className={field.label}>Permissions</legend>
        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
          {SCOPE_ORDER.map((scope) => (
            <label
              key={scope}
              className={cx(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                scopes.has(scope) ? 'border-[#fa7517]/50 bg-[#fa7517]/[0.05]' : 'border-gray-800/70 bg-black/40 hover:border-gray-700'
              )}
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-[#fa7517]"
                checked={scopes.has(scope)}
                onChange={() => toggle(scope)}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-white">{SCOPE_TEXT[scope].label}</span>
                <span className="block text-xs leading-relaxed text-gray-400">{SCOPE_TEXT[scope].detail}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p className={field.error} role="alert">
          {error.message}
        </p>
      )}

      <button type="submit" className={button.primary} disabled={!canSubmit}>
        {create.isPending ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
        Create key
      </button>
    </form>
  );
};

// --- The key, shown once ----------------------------------------------------------------------

const NewKeyNotice: React.FC<{ issued: IssuedApiKey; onDone: () => void }> = ({ issued, onDone }) => (
  <div className="space-y-3 rounded-lg border border-[#fa7517]/40 bg-[#fa7517]/[0.06] p-4" role="status">
    <p className="flex items-center gap-2 text-sm font-semibold text-white">
      <Check className="h-4 w-4 text-[#fa7517]" aria-hidden="true" />
      Key “{issued.apiKey.name}” created
    </p>
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <LinkField url={issued.key} />
      <CopyButton text={issued.key} label="Copy key" what="Key" primary />
    </div>
    <p className="text-sm text-amber-200">You will not see this key again. Copy it now and keep it somewhere safe.</p>
    <button type="button" className={button.secondary} onClick={onDone}>
      I have copied it
    </button>
  </div>
);

// --- The page ------------------------------------------------------------------------------------

const ApiKeysPage: React.FC = () => {
  const keys = useApiKeys();
  const revoke = useRevokeApiKey();
  const { channels } = useChannelSelection();
  const [issued, setIssued] = useState<IssuedApiKey | null>(null);
  const [revoking, setRevoking] = useState<ApiKeyView | null>(null);

  const channelName = useMemo(() => {
    const names = new Map(channels.map((channel) => [Number(channel.id), channel.name]));
    return (id: number | null) => (id === null ? 'All channels' : names.get(id) ?? `Channel #${id}`);
  }, [channels]);

  const data = keys.data;
  const atLimit = data ? data.activeKeys >= data.maxActiveKeys : false;
  const used = data?.dailyUploads.used ?? 0;
  const limit = data?.dailyUploads.limit ?? 0;
  const revokeError = revoke.isError ? plainApiError(revoke.error, 'The key could not be revoked. Please try again.') : null;

  return (
    <div className={frame.page}>
      <div className={frame.business}>
        <BusinessHeader
          title="API"
          subtitle="Send videos to your channel from a script or a tool, with a key. Same result as uploading here."
        />

        {keys.isLoading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2" aria-busy="true">
            <SkeletonPanel lines={3} />
            <SkeletonPanel lines={5} />
          </div>
        ) : keys.isError || !data ? (
          <EmptyState
            icon={AlertTriangle}
            tone="error"
            role="alert"
            title="Your keys could not be loaded"
            body={plainApiError(keys.error).message}
            action={
              <button type="button" className={button.secondary} onClick={() => keys.refetch()}>
                Try again
              </button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Panel title="Today's use" icon={Upload} subtitle="Videos you can still send today, from this site and the API together.">
                <p className={text.value}>
                  {used} <span className="text-base font-normal text-gray-400">of {limit} videos</span>
                </p>
                <div className={cx(meter.track, 'mt-3')} aria-hidden="true">
                  <div className={meter.fill} style={{ width: `${limit > 0 ? Math.min(100, (used / limit) * 100) : 0}%` }} />
                </div>
                <p className={cx(text.note, 'mt-3')}>
                  Starts again on {dateText(data.dailyUploads.resetsAt)}. Up to 2 GB per video, 5 uploads in progress at once.
                </p>
              </Panel>

              <Panel title="Send your first video" icon={KeyRound}>
                <pre className="overflow-x-auto rounded-lg border border-gray-800 bg-black/60 p-3 font-mono text-xs leading-relaxed text-gray-300">
                  {firstVideoExample()}
                </pre>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <CopyButton text={firstVideoExample()} label="Copy example" what="Example" />
                  {DOCS_URL && (
                    <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" className={text.link}>
                      Read the documentation
                    </a>
                  )}
                </div>
                <p className={cx(text.note, 'mt-3')}>
                  Videos sent with a key stay private until you make them public. API address: <code className="text-gray-300">{API_BASE}</code>
                </p>
              </Panel>
            </div>

            <Panel
              title="Create a key"
              subtitle={`${data.activeKeys} of ${data.maxActiveKeys} active keys used.`}
              icon={Plus}
            >
              {issued ? (
                <NewKeyNotice issued={issued} onDone={() => setIssued(null)} />
              ) : atLimit ? (
                <p className={note.attention}>You have {data.maxActiveKeys} active keys. Revoke one to create another.</p>
              ) : (
                <CreateKeyForm defaultScopes={data.defaultScopes} disabled={atLimit} onCreated={setIssued} />
              )}
            </Panel>

            <Panel title="Your keys" icon={KeyRound}>
              {revokeError && (
                <p className={cx(field.error, 'mb-3')} role="alert">
                  {revokeError.message}
                </p>
              )}
              {data.keys.length === 0 ? (
                <p className="text-sm text-gray-400">No key yet. Create one above.</p>
              ) : (
                <div className="-mx-4 overflow-x-auto md:-mx-6">
                  <table className="w-full min-w-[820px]">
                    <thead className={table.head}>
                      <tr>
                        <th className={table.th}>Name</th>
                        <th className={table.th}>Permissions</th>
                        <th className={table.th}>Channel</th>
                        <th className={table.th}>Created</th>
                        <th className={table.th}>Last used</th>
                        <th className={table.th}>Status</th>
                        <th className={table.th}>
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className={table.body}>
                      {data.keys.map((key) => (
                        <tr key={key.id} className={table.row}>
                          <td className={table.td}>
                            <span className="block text-sm font-medium text-white">{key.name}</span>
                            <code className="block font-mono text-xs text-gray-400">{key.prefix}…</code>
                          </td>
                          <td className={table.td}>
                            <div className="flex flex-wrap gap-1">
                              {key.scopes.map((scope) => (
                                <span key={scope} className={pillClass(scope === 'videos:delete' ? 'attention' : 'neutral')}>
                                  {SCOPE_TEXT[scope]?.label ?? scope}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className={cx(table.td, 'text-sm text-gray-300')}>{channelName(key.channelId)}</td>
                          <td className={cx(table.td, 'whitespace-nowrap text-sm text-gray-300')}>{dateText(key.createdAt)}</td>
                          <td className={cx(table.td, 'whitespace-nowrap text-sm text-gray-300')}>{dateText(key.lastUsedAt)}</td>
                          <td className={table.td}>
                            <span className={pillClass(STATUS_PILL[key.status].tone)}>{STATUS_PILL[key.status].label}</span>
                          </td>
                          <td className={cx(table.td, 'text-right')}>
                            {key.status === 'active' && (
                              <button type="button" className={cx(button.small, 'text-red-300 hover:bg-red-500/10')} onClick={() => setRevoking(key)}>
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </>
        )}

        <ConfirmDialog
          open={revoking !== null}
          onOpenChange={(open) => !open && setRevoking(null)}
          title={`Revoke “${revoking?.name ?? ''}”?`}
          lines={[
            'Any script using this key stops working at once.',
            'This cannot be undone. You can create a new key afterwards.',
          ]}
          confirmLabel="Revoke key"
          danger
          pending={revoke.isPending}
          onConfirm={() =>
            revoking &&
            revoke.mutate(revoking.id, {
              onSettled: () => setRevoking(null),
            })
          }
        />
      </div>
    </div>
  );
};

export default ApiKeysPage;
