/**
 * basetube: send videos to a Base.tube channel from a terminal or an AI agent.
 *
 * Output rules (so scripts and agents can rely on them):
 *   - the result goes to stdout; progress, warnings and errors go to stderr;
 *   - with --json, stdout holds exactly one JSON document:
 *       { "ok": true, "data": ... } or { "ok": false, "error": { code, message, hint, exitCode, ... } };
 *   - nothing ever prompts when stdin is not a terminal;
 *   - the exit code says what happened (see EXIT in errors.mjs).
 */
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { createClient } from './api.mjs';
import { parseArgs, parseId, parsePositiveInt, parseTags } from './args.mjs';
import { CliError, EXIT, asCliError, notSignedIn, redactSecrets, usageError } from './errors.mjs';
import {
  DEFAULT_API, configPath, deleteConfig, normalizeApiBase, readConfig, resolveSettings, saveConfig, uploadsDir, validateApiKey,
} from './config.mjs';
import { checkVideoFile, pickChannel, readThumbnail, upload } from './upload.mjs';

const VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

const GLOBAL_HELP = `Options for every command:
  --json         Print one JSON document on stdout (progress goes to stderr)
  --api <url>    API address (default ${DEFAULT_API}, or BASETUBE_API_URL)
  -h, --help     Show help for the command`;

const HELP = {
  main: `basetube ${VERSION}: send videos to your Base.tube channel.

Usage: basetube <command> [options]

Commands:
  login                      Save your API key (create one on base.tube → Creator Hub → API)
  logout                     Remove the saved key
  whoami                     Show the account, the key's permissions and uploads left today
  channels                   List the channels this key can publish to
  upload <file>              Send a video (private unless you add --public)
  videos list                List your videos
  videos get <id>            Show one video and whether it is ready
  videos update <id>         Change title, description, tags or visibility
  videos thumbnail <id> <image>
                             Replace a video's thumbnail
  videos delete <id>         Delete a video (asks for confirmation)

Example:
  basetube login
  basetube upload episode-12.mp4 --title "Episode 12"

${GLOBAL_HELP}

Environment: BASETUBE_API_KEY (overrides the saved key), BASETUBE_API_URL.
Exit codes: 0 ok, 1 error, 2 wrong command or input, 3 not signed in or key refused,
            4 not allowed, 5 limit reached.`,

  login: `Usage: basetube login [--key-stdin]

Asks for your API key without showing it, checks it with Base.tube, and saves it
in ~/.config/basetube/config.json (readable only by you).
Create a key on base.tube → Creator Hub → API.

Options:
  --key-stdin    Read the key from stdin instead of asking (for scripts and agents)

Examples:
  basetube login
  printf '%s' "$MY_KEY" | basetube login --key-stdin --json

${GLOBAL_HELP}`,

  logout: `Usage: basetube logout

Removes the saved key from this computer. The key itself keeps working until you
revoke it on base.tube → Creator Hub → API.

Example:
  basetube logout

${GLOBAL_HELP}`,

  whoami: `Usage: basetube whoami

Shows the account, the key's name and permissions, and how many uploads are left today.

Example:
  basetube whoami --json

${GLOBAL_HELP}`,

  channels: `Usage: basetube channels

Lists the channels this key can publish to, with their ID and handle.
Use either with "basetube upload --channel".

Example:
  basetube channels

${GLOBAL_HELP}`,

  upload: `Usage: basetube upload <file> [options]

Sends a video (.mp4, .mov or .avi, up to 2 GB) and waits until it is ready.
The video is PRIVATE unless you add --public. If the upload is interrupted, run
the same command again: it resumes where it stopped.

Options:
  --title <text>          Title (default: the file name)
  --description <text>    Description
  --tags <a,b,c>          Tags, separated by commas
  --channel <id|handle>   Channel to publish to (needed when the key covers several)
  --thumbnail <image>     Replace the thumbnail once the video is ready (.jpg, .png, .webp, 3 MB max)
  --public                Make the video public once it is ready
  --no-wait               Return as soon as the file is received, without waiting for processing
  --restart               Ignore saved progress for this file and start a new upload

Examples:
  basetube upload episode-12.mp4 --title "Episode 12"
  basetube upload episode-12.mp4 --title "Episode 12" --tags travel,vlog --channel @mychannel --thumbnail cover.jpg --public
  basetube upload episode-12.mp4 --title "Episode 12" --json

${GLOBAL_HELP}`,

  videos: `Usage: basetube videos <list|get|update|thumbnail|delete> ...

  videos list [--channel <id|handle>] [--page <n>] [--limit <n>]
  videos get <id>
  videos update <id> [--title <text>] [--description <text>] [--tags <a,b>] [--public | --private]
  videos thumbnail <id> <image>
  videos delete <id> [--yes]

Run "basetube videos <command> --help" for details.

Example:
  basetube videos list --json

${GLOBAL_HELP}`,

  'videos list': `Usage: basetube videos list [--channel <id|handle>] [--page <n>] [--limit <n>]

Lists your videos, newest first (25 per page by default, up to 100).

Example:
  basetube videos list --limit 10 --json

${GLOBAL_HELP}`,

  'videos get': `Usage: basetube videos get <id>

Shows one video: status (processing, ready, failed), visibility and watch address.

Example:
  basetube videos get 4821 --json

${GLOBAL_HELP}`,

  'videos update': `Usage: basetube videos update <id> [options]

Options:
  --title <text>
  --description <text>
  --tags <a,b,c>      Replaces all tags ("" removes them)
  --public            Make the video public (only once it is ready)
  --private           Make the video private

Example:
  basetube videos update 4821 --title "Episode 12 (director's cut)" --public

${GLOBAL_HELP}`,

  'videos thumbnail': `Usage: basetube videos thumbnail <id> <image>

Replaces the thumbnail with a .jpg, .png or .webp image of 3 MB or less.

Example:
  basetube videos thumbnail 4821 cover.jpg

${GLOBAL_HELP}`,

  'videos delete': `Usage: basetube videos delete <id> [--yes]

Deletes a video for good. Asks you to type the video ID to confirm. Without a
terminal (scripts, agents) it refuses unless you add --yes.
Needs a key with the 'videos:delete' permission.

Example:
  basetube videos delete 4821

${GLOBAL_HELP}`,
};

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

function makeOutput(json) {
  const secrets = new Set();
  const redact = (value) => redactSecrets(value, secrets);
  return {
    json,
    hideSecret: (key) => { if (key) secrets.add(key); },
    log: (line) => process.stderr.write(`${redact(String(line))}\n`),
    result(data, human) {
      if (json) process.stdout.write(`${JSON.stringify({ ok: true, data: redact(data) }, null, 2)}\n`);
      else if (human) process.stdout.write(`${redact(human)}\n`);
    },
    error(error) {
      error = redact({ ...error, message: error.message });
      const lines = [`Error: ${error.message}${error.code && error.code !== 'USAGE' ? ` [${error.code}]` : ''}`];
      const issues = Array.isArray(error.details?.issues) ? error.details.issues : [];
      for (const issue of issues) lines.push(`  - ${issue.path || 'request'}: ${issue.message}`);
      if (error.hint) lines.push(error.hint);
      process.stderr.write(`${lines.join('\n')}\n`);
      if (json) {
        const body = { code: error.code ?? 'ERROR', message: error.message, exitCode: error.exitCode };
        if (error.hint) body.hint = error.hint;
        if (error.status) body.status = error.status;
        if (error.details) body.details = error.details;
        process.stdout.write(`${JSON.stringify({ ok: false, error: body }, null, 2)}\n`);
      }
    },
  };
}

function showHelp(out, text) {
  out.result({ help: text }, text);
}

function videoLine(video) {
  return `${video.id}\t${video.status}\t${video.visibility}\t${video.title}\t${video.watchUrl}`;
}

function videoDetails(video) {
  return [
    `Video       ${video.id}`,
    `Title       ${video.title}`,
    `Status      ${video.status}${video.moderation && video.moderation !== 'active' ? ` (moderation: ${video.moderation})` : ''}`,
    `Visibility  ${video.visibility}`,
    `Channel     ${video.channelId}`,
    `Tags        ${video.tags?.length ? video.tags.join(', ') : '-'}`,
    `Watch       ${video.watchUrl}`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Terminal input
// ---------------------------------------------------------------------------

function requireTerminal(what, hint) {
  if (!process.stdin.isTTY) throw usageError(`No terminal to ${what}.`, hint);
}

/** Reads a line without echoing it (the key must not appear on screen or in the scrollback). */
function promptHidden(question) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    process.stderr.write(question);
    let value = '';
    const finish = (error) => {
      stdin.off('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      process.stderr.write('\n');
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n' || char === '\u0004') return finish();
        if (char === '\u0003') return finish(new CliError('Cancelled.', { code: 'CANCELLED' }));
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
        else value += char;
      }
      return undefined;
    };
    stdin.setEncoding('utf8');
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}

async function promptLine(question) {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  try {
    return await rl.question(question);
  } finally {
    rl.close();
  }
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function signedIn(options, out) {
  const settings = await resolveSettings(process.env, options.api);
  if (!settings.key) throw notSignedIn();
  out.hideSecret(settings.key);
  return { ...settings, call: createClient({ base: settings.api, key: settings.key, log: out.log }) };
}

async function login(argv, out) {
  const { options, positionals } = parseArgs(argv, { 'key-stdin': 'boolean' }, 'login');
  if (options.help) return showHelp(out, HELP.login);
  if (positionals.length) throw usageError('login does not take the key as an argument (it would stay in your shell history).', 'Run "basetube login" and paste it, or pipe it with --key-stdin.');
  let key;
  if (options['key-stdin']) {
    key = (await readStdin()).trim();
  } else {
    requireTerminal('type the key in', 'Pipe the key with "basetube login --key-stdin", or set BASETUBE_API_KEY.');
    key = (await promptHidden('Paste your API key (from base.tube → Creator Hub → API): ')).trim();
  }
  if (!key) throw usageError('No key given.', 'Create a key on base.tube → Creator Hub → API, then paste it.');
  validateApiKey(key);
  out.hideSecret(key);

  const config = await readConfig(process.env);
  const api = normalizeApiBase(options.api ?? process.env.BASETUBE_API_URL ?? config.apiUrl ?? DEFAULT_API);
  const me = (await createClient({ base: api, key, log: out.log })('GET', '/me')).data;
  const next = { ...config, apiKey: key, savedAt: new Date().toISOString() };
  if (api === DEFAULT_API) delete next.apiUrl;
  else next.apiUrl = api;
  await saveConfig(process.env, next);
  if (process.env.BASETUBE_API_KEY) out.log('Note: BASETUBE_API_KEY is set; it is used instead of the saved key while it is set.');

  const who = me.account.username ?? `account ${me.account.id}`;
  out.result(
    { account: me.account, key: me.key, apiUrl: api, configPath: configPath(process.env) },
    `Signed in as ${who} with key "${me.key.name}" (${me.key.scopes.join(', ')}). Key saved in ${configPath(process.env)}.`
  );
}

async function logout(argv, out) {
  const { options } = parseArgs(argv, {}, 'logout');
  if (options.help) return showHelp(out, HELP.logout);
  const config = await readConfig(process.env);
  let removed = false;
  if (config.apiKey) {
    const { apiKey, savedAt, ...rest } = config;
    if (Object.keys(rest).length) await saveConfig(process.env, rest);
    else await deleteConfig(process.env);
    removed = true;
  }
  if (process.env.BASETUBE_API_KEY) out.log('Note: BASETUBE_API_KEY is still set in your environment.');
  out.result({ removed }, removed ? 'Signed out: the saved key was removed from this computer.' : 'No saved key.');
}

async function whoami(argv, out) {
  const { options } = parseArgs(argv, {}, 'whoami');
  if (options.help) return showHelp(out, HELP.whoami);
  const { call, api, keySource } = await signedIn(options, out);
  const me = (await call('GET', '/me')).data;
  const source = keySource === 'BASETUBE_API_KEY' ? 'BASETUBE_API_KEY' : 'saved';
  const d = me.dailyUploads;
  out.result(
    { account: me.account, key: me.key, dailyUploads: d, limits: me.limits, apiUrl: api, keySource: source },
    [
      `Account      ${me.account.username ?? '-'} (id ${me.account.id})`,
      `Key          ${me.key.name} (${me.key.prefix}…, ${source === 'saved' ? `saved in ${keySource}` : 'from BASETUBE_API_KEY'})`,
      `Permissions  ${me.key.scopes.join(', ')}`,
      `Channels     ${me.key.channelId === null ? 'all your channels' : `only channel ${me.key.channelId}`}`,
      `Uploads      ${d.remaining} of ${d.limit} left today (starts again ${d.resetsAt})`,
      `API          ${api}`,
    ].join('\n')
  );
}

async function channels(argv, out) {
  const { options } = parseArgs(argv, {}, 'channels');
  if (options.help) return showHelp(out, HELP.channels);
  const { call } = await signedIn(options, out);
  const list = (await call('GET', '/channels')).data.channels;
  out.result(
    { channels: list },
    list.length ? list.map((c) => `${c.id}\t${c.handle ? `@${c.handle}` : '-'}\t${c.name}`).join('\n') : 'This key cannot publish to any channel.'
  );
}

async function uploadCommand(argv, out) {
  const { options, positionals } = parseArgs(argv, {
    title: 'string', description: 'string', tags: 'string', channel: 'string', thumbnail: 'string',
    public: 'boolean', 'no-wait': 'boolean', restart: 'boolean',
  }, 'upload');
  if (options.help) return showHelp(out, HELP.upload);
  if (positionals.length !== 1) throw usageError('Give exactly one video file.', 'Example: basetube upload episode-12.mp4 --title "Episode 12"');
  const wait = !options['no-wait'];
  if (!wait && (options.public || options.thumbnail)) {
    throw usageError('--public and --thumbnail need the video to be ready, so they cannot be used with --no-wait.',
      'Drop --no-wait, or later run "basetube videos update <id> --public" and "basetube videos thumbnail <id> <image>".');
  }
  const file = positionals[0];
  const title = options.title ?? file.replace(/^.*[\\/]/, '').replace(/\.[^.]*$/, '');
  await checkVideoFile(file);
  if (options.thumbnail) await readThumbnail(options.thumbnail);
  const { call, api } = await signedIn(options, out);

  const onInterrupt = () => {
    process.stderr.write('\nStopped. Run the same command again to resume where it stopped.\n');
    process.exit(130);
  };
  process.once('SIGINT', onInterrupt);
  try {
    const { uploadId, video } = await upload(
      {
        file, title, description: options.description, tags: options.tags === undefined ? undefined : parseTags(options.tags),
        channel: options.channel, thumbnail: options.thumbnail, public: Boolean(options.public), wait, restart: Boolean(options.restart),
      },
      { call, api, log: out.log, dir: uploadsDir(process.env) }
    );
    const human = video.status === 'ready'
      ? `Ready (${video.visibility}): ${video.watchUrl}`
      : `Received. Video ${video.id} is ${video.status} (${video.visibility}); check with "basetube videos get ${video.id}": ${video.watchUrl}`;
    out.result({ uploadId, video }, human);
  } finally {
    process.off('SIGINT', onInterrupt);
  }
}

async function videos(argv, out) {
  const [sub, ...rest] = argv;
  if (!sub || sub === '--help' || sub === '-h' || sub === 'help') return showHelp(out, HELP.videos);
  if (sub.startsWith('-')) throw usageError('Put the videos command first.', 'Example: basetube videos list --json');
  const command = `videos ${sub}`;

  if (sub === 'list') {
    const { options, positionals } = parseArgs(rest, { channel: 'string', page: 'string', limit: 'string' }, command);
    if (options.help) return showHelp(out, HELP[command]);
    if (positionals.length) throw usageError(`Unexpected argument ${positionals[0]}.`);
    const { call } = await signedIn(options, out);
    const query = new URLSearchParams();
    if (options.channel !== undefined) {
      query.set('channelId', String(pickChannel((await call('GET', '/channels')).data.channels, options.channel).id));
    }
    const page = parsePositiveInt(options.page, 'page');
    const limit = parsePositiveInt(options.limit, 'limit');
    if (page) query.set('page', String(page));
    if (limit) query.set('limit', String(limit));
    const data = (await call('GET', `/videos${query.toString() ? `?${query}` : ''}`)).data;
    const p = data.pagination;
    const human = data.videos.length
      ? `${data.videos.map(videoLine).join('\n')}\nPage ${p.page} of ${p.totalPages} (${p.total} videos)`
      : 'No videos yet.';
    return out.result(data, human);
  }

  if (sub === 'get') {
    const { options, positionals } = parseArgs(rest, {}, command);
    if (options.help) return showHelp(out, HELP[command]);
    const id = parseId(positionals[0]);
    const { call } = await signedIn(options, out);
    const video = (await call('GET', `/videos/${id}`)).data;
    return out.result(video, videoDetails(video));
  }

  if (sub === 'update') {
    const { options, positionals } = parseArgs(rest, {
      title: 'string', description: 'string', tags: 'string', public: 'boolean', private: 'boolean',
    }, command);
    if (options.help) return showHelp(out, HELP[command]);
    const id = parseId(positionals[0]);
    if (options.public && options.private) throw usageError('Choose --public or --private, not both.');
    const patch = {};
    if (options.title !== undefined) patch.title = options.title;
    if (options.description !== undefined) patch.description = options.description;
    if (options.tags !== undefined) patch.tags = parseTags(options.tags);
    if (options.public) patch.visibility = 'public';
    if (options.private) patch.visibility = 'private';
    if (!Object.keys(patch).length) throw usageError('Nothing to change.', 'Add --title, --description, --tags, --public or --private.');
    const { call } = await signedIn(options, out);
    const video = (await call('PATCH', `/videos/${id}`, { json: patch })).data;
    return out.result(video, `Updated video ${video.id} (${video.visibility}): ${video.watchUrl}`);
  }

  if (sub === 'thumbnail') {
    const { options, positionals } = parseArgs(rest, {}, command);
    if (options.help) return showHelp(out, HELP[command]);
    const id = parseId(positionals[0]);
    if (!positionals[1]) throw usageError('Give the image file.', 'Example: basetube videos thumbnail 4821 cover.jpg');
    const thumbnail = await readThumbnail(positionals[1]);
    const { call } = await signedIn(options, out);
    const video = (await call('PUT', `/videos/${id}/thumbnail`, { body: thumbnail.bytes, headers: { 'content-type': thumbnail.type } })).data;
    return out.result(video, `Thumbnail replaced for video ${video.id}.`);
  }

  if (sub === 'delete') {
    const { options, positionals } = parseArgs(rest, { yes: 'boolean' }, command);
    if (options.help) return showHelp(out, HELP[command]);
    const id = parseId(positionals[0]);
    const { call } = await signedIn(options, out);
    if (!options.yes) {
      requireTerminal('confirm the deletion in', 'Add --yes to delete without a prompt, only once the channel owner has confirmed.');
      const video = (await call('GET', `/videos/${id}`)).data;
      const answer = await promptLine(`Delete video ${id} "${video.title}" for good? This cannot be undone. Type ${id} to confirm: `);
      if (answer.trim() !== String(id)) throw new CliError('Not deleted.', { code: 'CANCELLED' });
    }
    const data = (await call('DELETE', `/videos/${id}`)).data;
    return out.result(data, `Deleted video ${id}.`);
  }

  throw usageError(`Unknown command "videos ${sub}".`, 'Run "basetube videos --help".');
}

const COMMANDS = { login, logout, whoami, channels, upload: uploadCommand, videos };

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function main(argv) {
  const out = makeOutput(argv.includes('--json'));
  out.hideSecret(process.env.BASETUBE_API_KEY?.trim());
  const [command, ...rest] = argv;
  try {
    if (!command || command === 'help' || command === '--help' || command === '-h') {
      showHelp(out, HELP.main);
      return EXIT.OK;
    }
    if (command === '--version' || command === '-v') {
      out.result({ version: VERSION }, VERSION);
      return EXIT.OK;
    }
    const run = COMMANDS[command];
    if (!run) throw usageError(`Unknown command "${command}".`, 'Run "basetube --help" to see the commands.');
    await run(rest, out);
    return EXIT.OK;
  } catch (error) {
    const cliError = asCliError(error);
    out.error(cliError);
    return cliError.exitCode;
  }
}
