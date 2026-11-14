/**
 * "basetube upload": the whole flow, ported from the API's reference client.
 *
 *   1. Start an upload, or resume the one saved in this file's checkpoint.
 *      The checkpoint lives in <config dir>/uploads/, is bound to the API
 *      server, account, channel and file identity, and holds an upload ID and
 *      an idempotency key: never the API key, never a signed address.
 *   2. Ask which parts the server already has (GET /uploads/{id}); ask for
 *      fresh signed addresses 10 at a time and PUT only the missing parts,
 *      straight to storage, 3 at a time. A part that fails (for example an
 *      address that expired) is retried in the next round with a new address.
 *   3. PUT /uploads/{id}/completion with every part's ETag.
 *   4. Wait: GET /uploads/{id} until the video exists, then GET /videos/{id}
 *      until it is ready (or failed).
 *   5. Optional: replace the thumbnail, then make the video public.
 *   6. Delete the checkpoint: there is nothing left to resume.
 */
import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { open, readdir, readFile, realpath, stat, unlink } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { sleep } from './api.mjs';
import { CliError, EXIT, usageError } from './errors.mjs';
import { ensurePrivateDir, writePrivateFile } from './config.mjs';

const PARTS_IN_FLIGHT = 3;
const PART_ADDRESSES_PER_CALL = 10;
const SEND_ROUNDS = 5;
const POLL_SECONDS = 5;
const PROCESSING_TIMEOUT_MINUTES = 60;
const VIDEO_ID_TIMEOUT_MINUTES = 5;
const CHECKPOINT_MAX_AGE_DAYS = 7;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const VIDEO_TYPES = { '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo' };
export const IMAGE_TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const THUMBNAIL_MAX_BYTES = 3 * 1024 * 1024;

const mb = (bytes) => `${(bytes / 1_000_000).toFixed(1)} MB`;

// ---------------------------------------------------------------------------
// Channel
// ---------------------------------------------------------------------------

/** --channel accepts a channel ID or a handle (with or without "@"). Without it, the key's only channel. */
export function pickChannel(channels, requested) {
  const list = channels.map((c) => `${c.id}${c.handle ? ` (@${c.handle})` : ''} ${c.name}`).join(', ');
  if (requested === undefined) {
    if (channels.length === 1) return channels[0];
    if (channels.length === 0) {
      throw new CliError('This key cannot publish to any channel.', {
        exitCode: EXIT.FORBIDDEN, code: 'NO_CHANNEL', hint: 'Create a channel on base.tube, or use a key that covers one.',
      });
    }
    throw usageError(`This key can publish to ${channels.length} channels: ${list}.`, 'Choose one with --channel <id or handle>.');
  }
  const wanted = String(requested).trim().replace(/^@/, '').toLowerCase();
  const found = /^\d+$/.test(wanted)
    ? channels.find((c) => c.id === Number(wanted))
    : channels.find((c) => c.handle && c.handle.toLowerCase() === wanted);
  if (!found) {
    throw new CliError(`This key cannot publish to channel "${requested}".`, {
      exitCode: EXIT.FORBIDDEN, code: 'CHANNEL_FORBIDDEN', hint: `Channels this key can use: ${list || 'none'}.`,
    });
  }
  return found;
}

// ---------------------------------------------------------------------------
// Checkpoint (one per file + channel + account + server, outside the video's folder)
// ---------------------------------------------------------------------------

async function resumeContext({ api, accountId, channelId, file, dir }) {
  const path = await realpath(file);
  const info = await stat(path);
  if (!info.isFile()) throw usageError(`${file} is not a regular file.`);
  const binding = createHash('sha256')
    .update(JSON.stringify([api, String(accountId), channelId, path, info.size, info.mtimeMs]))
    .digest('hex');
  return { file: path, fileSize: info.size, binding, path: join(dir, `${binding}.json`) };
}

async function readCheckpoint(context) {
  let handle;
  try {
    handle = await open(context.path, constants.O_RDONLY | constants.O_NOFOLLOW);
    if (!(await handle.stat()).isFile()) throw new Error('not a regular file');
    const saved = JSON.parse(await handle.readFile('utf8'));
    if (saved.version !== 1 || saved.binding !== context.binding || typeof saved.idempotencyKey !== 'string' ||
        (saved.uploadId !== null && !UUID.test(saved.uploadId))) {
      throw new Error('invalid checkpoint');
    }
    return saved;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw new CliError(`The saved progress for this file is unreadable (${context.path}).`, {
      hint: 'Run the same command again with --restart to start a new upload.',
    });
  } finally {
    await handle?.close();
  }
}

async function saveCheckpoint(context, checkpoint) {
  await writePrivateFile(context.path, JSON.stringify({ version: 1, binding: context.binding, ...checkpoint }) + '\n');
}

async function deleteCheckpoint(context) {
  await unlink(context.path).catch((error) => { if (error.code !== 'ENOENT') throw error; });
}

/** Checkpoints of uploads abandoned long ago (the server forgets them after about a day). */
async function pruneCheckpoints(dir) {
  const cutoff = Date.now() - CHECKPOINT_MAX_AGE_DAYS * 86_400_000;
  for (const name of await readdir(dir).catch(() => [])) {
    if (!/^[0-9a-f]{64}\.json$/.test(name)) continue;
    const path = join(dir, name);
    const info = await stat(path).catch(() => null);
    if (info && info.mtimeMs < cutoff) await unlink(path).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Sending the parts
// ---------------------------------------------------------------------------

/** PUT one part straight to storage. A Buffer body gives the exact Content-Length the address was signed for. */
async function putPart(handle, capability, partSize, fileSize) {
  const offset = (capability.partNumber - 1) * partSize;
  const length = Math.min(partSize, fileSize - offset);
  const buffer = Buffer.alloc(length);
  await handle.read(buffer, 0, length, offset);
  // Only the headers storage asked for: never the API key.
  const response = await fetch(capability.url, { method: 'PUT', body: buffer, headers: capability.requiredHeaders ?? {} });
  if (!response.ok) throw new Error(`storage answered HTTP ${response.status}`);
  const etag = response.headers.get('etag');
  if (!etag) throw new Error('storage gave no ETag');
  return length;
}

function uploadStopped(state, uploadId) {
  const reason = state.errorCode ? ` (${state.errorCode})` : '';
  return new CliError(`Upload ${uploadId} is ${state.uploadState}${reason}.`, {
    code: 'UPLOAD_STOPPED',
    hint: state.uploadState === 'held'
      ? 'Base.tube held this upload. Contact support with the upload ID.'
      : 'Run the same command again with --restart to start a new upload.',
  });
}

async function sendParts({ call, uploadId, file, fileSize, log }) {
  const handle = await open(file, 'r');
  try {
    for (let round = 1; round <= SEND_ROUNDS; round += 1) {
      const state = (await call('GET', `/uploads/${uploadId}`)).data;
      // A rerun after the completion already went through: nothing left to send.
      if (['completing', 'processing', 'ready'].includes(state.uploadState)) return null;
      if (!state.canRenewCapabilities) throw uploadStopped(state, uploadId);
      const done = new Set(state.completedParts.map((part) => part.partNumber));
      const missing = [];
      for (let n = 1; n <= state.partCount; n += 1) if (!done.has(n)) missing.push(n);
      if (missing.length === 0) {
        return state.completedParts
          .sort((a, b) => a.partNumber - b.partNumber)
          .map((part) => ({ partNumber: part.partNumber, etag: part.etag }));
      }
      let sentBytes = state.completedParts.reduce((sum, part) => sum + (part.sizeBytes ?? 0), 0);
      let sentParts = done.size;
      log(`Sending ${missing.length} of ${state.partCount} parts (${mb(fileSize)} in total)`);
      for (let i = 0; i < missing.length; i += PART_ADDRESSES_PER_CALL) {
        // Fresh addresses for each batch: they are valid for 15 minutes.
        const batch = missing.slice(i, i + PART_ADDRESSES_PER_CALL);
        const { capabilities } = (await call('POST', `/uploads/${uploadId}/parts`, { json: { partNumbers: batch } })).data;
        const queue = [...capabilities];
        const workers = Array.from({ length: PARTS_IN_FLIGHT }, async () => {
          for (let capability = queue.shift(); capability; capability = queue.shift()) {
            try {
              sentBytes += await putPart(handle, capability, state.partSizeBytes, fileSize);
              sentParts += 1;
              const percent = Math.floor((sentBytes / fileSize) * 100);
              log(`  part ${capability.partNumber}/${state.partCount} sent · ${mb(sentBytes)} of ${mb(fileSize)} (${percent}%)`);
            } catch (error) {
              // Left for the next round, which asks the server what it really has.
              log(`  part ${capability.partNumber}/${state.partCount}: ${error.message}, will retry with a new address`);
            }
          }
        });
        await Promise.all(workers);
      }
      if (sentParts < state.partCount && round < SEND_ROUNDS) log('Retrying the parts that did not go through');
    }
    throw new CliError(`Some parts could not be sent after ${SEND_ROUNDS} rounds.`, {
      code: 'PARTS_NOT_SENT', hint: 'Run the same command again: it resumes where it stopped.',
    });
  } finally {
    await handle.close();
  }
}

// ---------------------------------------------------------------------------
// Waiting
// ---------------------------------------------------------------------------

async function waitForVideoId({ call, uploadId, log, minutes }) {
  const deadline = Date.now() + minutes * 60_000;
  while (Date.now() < deadline) {
    const upload = (await call('GET', `/uploads/${uploadId}`)).data;
    if (['failed', 'held', 'aborted'].includes(upload.uploadState)) throw uploadStopped(upload, uploadId);
    if (upload.videoId !== null && upload.videoId !== undefined) return upload.videoId;
    log('  checking the file...');
    await sleep(POLL_SECONDS);
  }
  return null;
}

async function waitUntilReady({ call, videoId, log }) {
  const deadline = Date.now() + PROCESSING_TIMEOUT_MINUTES * 60_000;
  while (Date.now() < deadline) {
    const video = (await call('GET', `/videos/${videoId}`)).data;
    if (video.status === 'ready') return video;
    if (video.status === 'failed') {
      throw new CliError(`Processing failed for video ${videoId}.`, {
        code: 'PROCESSING_FAILED', hint: 'Check the file plays on your computer, then send it again with --restart.',
      });
    }
    log(`  video ${videoId}: ${video.status}`);
    await sleep(POLL_SECONDS);
  }
  throw new CliError(`Video ${videoId} is not ready after ${PROCESSING_TIMEOUT_MINUTES} minutes.`, {
    code: 'PROCESSING_TIMEOUT', hint: `Check later with "basetube videos get ${videoId}".`,
  });
}

// ---------------------------------------------------------------------------
// The command
// ---------------------------------------------------------------------------

export async function readThumbnail(path) {
  const type = IMAGE_TYPES[extname(path).toLowerCase()];
  if (!type) throw usageError('The thumbnail must be a .jpg, .png or .webp image.');
  const bytes = await readFile(path);
  if (bytes.length > THUMBNAIL_MAX_BYTES) {
    throw new CliError('The thumbnail is larger than 3 MB.', { exitCode: EXIT.LIMIT, code: 'THUMBNAIL_TOO_LARGE', hint: 'Send a smaller image.' });
  }
  return { bytes, type };
}

/**
 * options: { file, title, description, tags, channel, thumbnail, public, wait, restart }
 * context: { call, api, log, dir }
 */
/** The checks that need no network: run them before anything else. */
export async function checkVideoFile(file) {
  const contentType = VIDEO_TYPES[extname(file).toLowerCase()];
  if (!contentType) throw usageError(`Unsupported video type "${extname(file) || file}".`, 'Send an .mp4, .mov or .avi file.');
  if (!(await stat(file)).isFile()) throw usageError(`${file} is not a regular file.`);
  return contentType;
}

export async function upload(options, { call, api, log, dir }) {
  const contentType = await checkVideoFile(options.file);
  // Check the optional pieces before sending gigabytes.
  const thumbnail = options.thumbnail ? await readThumbnail(options.thumbnail) : null;

  const me = (await call('GET', '/me')).data;
  const { channels } = (await call('GET', '/channels')).data;
  const channel = pickChannel(channels, options.channel);

  await ensurePrivateDir(dir);
  await pruneCheckpoints(dir);
  const context = await resumeContext({ api, accountId: me.account.id, channelId: channel.id, file: options.file, dir });
  const { fileSize } = context;
  const maxBytes = me.limits?.maxFileBytes;
  if (maxBytes && fileSize > maxBytes) {
    throw new CliError(`The file is ${mb(fileSize)}; the limit is ${mb(maxBytes)}.`, {
      exitCode: EXIT.LIMIT, code: 'UPLOAD_FILE_TOO_LARGE', hint: 'Send a smaller file.',
    });
  }

  let checkpoint = options.restart ? null : await readCheckpoint(context);
  if (options.restart) {
    // Abandon the unfinished upload being replaced, so it does not hold one of the open-upload slots.
    const previous = await readCheckpoint(context).catch(() => null);
    if (previous?.uploadId) await call('DELETE', `/uploads/${previous.uploadId}`).catch(() => {});
  }
  if (!checkpoint) {
    // The first attempt for this file uses a key derived from its identity, so a crash
    // before the checkpoint is written still finds the same upload. --restart uses a new one.
    const idempotencyKey = options.restart ? `${context.binding.slice(0, 32)}-${randomUUID()}` : context.binding;
    checkpoint = { idempotencyKey, uploadId: null };
    await saveCheckpoint(context, checkpoint);
  }

  let uploadId = checkpoint.uploadId;
  let state = null;
  if (uploadId) {
    try {
      state = (await call('GET', `/uploads/${uploadId}`)).data;
    } catch (error) {
      if (error.code === 'UPLOAD_NOT_FOUND') {
        throw new CliError(`The saved upload ${uploadId} no longer exists (it expired or was abandoned).`, {
          code: 'UPLOAD_NOT_FOUND', hint: 'Run the same command again with --restart to start a new upload.',
        });
      }
      throw error;
    }
    if (state.channelId !== channel.id || state.declaredSizeBytes !== fileSize) {
      throw new CliError('The saved upload does not match this channel or file.', {
        code: 'CHECKPOINT_MISMATCH', hint: 'Run the same command again with --restart to start a new upload.',
      });
    }
    if (['failed', 'aborted', 'held'].includes(state.uploadState)) throw uploadStopped(state, uploadId);
    log(`Resuming upload ${uploadId}`);
  } else {
    log(`Account ${me.account.username ?? me.account.id} · ${me.dailyUploads.remaining} of ${me.dailyUploads.limit} uploads left today`);
  }

  while (!uploadId || state?.uploadState === 'initiated') {
    const created = await call('POST', '/uploads', {
      headers: { 'idempotency-key': checkpoint.idempotencyKey },
      json: {
        channelId: channel.id,
        title: options.title,
        ...(options.description === undefined ? {} : { description: options.description }),
        ...(options.tags === undefined ? {} : { tags: options.tags }),
        filename: basename(options.file),
        contentType,
        sizeBytes: fileSize,
      },
    });
    uploadId = created.data.uploadId;
    checkpoint = { ...checkpoint, uploadId };
    // Saved before any byte is sent: even a lost completion answer can resume.
    await saveCheckpoint(context, checkpoint);
    if (created.status !== 202) break;
    state = { uploadState: 'initiated' };
    await sleep(created.data.retryAfterSeconds ?? 2); // another request is still preparing it
  }
  if (!state) log(`Started upload ${uploadId} to ${channel.name}`);

  const parts = await sendParts({ call, uploadId, file: context.file, fileSize, log });
  if (parts) await call('PUT', `/uploads/${uploadId}/completion`, { json: { parts } });
  log('Upload complete. Base.tube is processing the video...');

  const videoId = await waitForVideoId({
    call, uploadId, log, minutes: options.wait ? PROCESSING_TIMEOUT_MINUTES : VIDEO_ID_TIMEOUT_MINUTES,
  });
  if (videoId === null) {
    throw new CliError(`Upload ${uploadId} has no video yet.`, {
      code: 'PROCESSING_TIMEOUT', hint: 'Run the same command again later: it picks up where it stopped.',
    });
  }

  if (!options.wait) {
    await deleteCheckpoint(context);
    const video = (await call('GET', `/videos/${videoId}`)).data;
    return { uploadId, video };
  }

  let video = await waitUntilReady({ call, videoId, log });
  if (thumbnail) {
    video = (await call('PUT', `/videos/${video.id}/thumbnail`, { body: thumbnail.bytes, headers: { 'content-type': thumbnail.type } })).data;
    log('Thumbnail replaced');
  }
  if (options.public) {
    video = (await call('PATCH', `/videos/${video.id}`, { json: { visibility: 'public' } })).data;
  }
  await deleteCheckpoint(context);
  return { uploadId, video };
}
