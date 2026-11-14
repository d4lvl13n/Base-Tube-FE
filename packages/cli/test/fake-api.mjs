/**
 * A small in-process fake of the Base.tube upload API and of the storage that
 * receives the parts. It follows docs/UPLOAD_API.md closely enough for the CLI:
 * envelopes, status codes, error codes, idempotency, signed part addresses,
 * completion with ETags, and Retry-After. No real network, no real storage.
 */
import { createHash, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';

export const KEY = `bt_live_${'k3y5ecret'.repeat(6).slice(0, 48)}`;
const ALL_SCOPES = ['videos:upload', 'videos:read', 'videos:write', 'videos:delete'];

export class FakeBaseTube {
  constructor({ partSize = 8 } = {}) {
    this.partSize = partSize;
    this.keys = new Map([[KEY, { name: 'Test key', scopes: ['videos:upload', 'videos:read', 'videos:write'], channelId: null }]]);
    this.channels = [{ id: 7, name: 'Main channel', handle: 'main' }];
    this.dailyRemaining = 20;
    this.requests = [];
    this.uploads = new Map();
    this.attempts = new Map();
    this.videos = new Map();
    this.nextVideoId = 100;
    this.signatures = 0;
    /** "METHOD /path" → { status, code, retryAfter, times } answered before the real handler. */
    this.faults = new Map();
    /** Part numbers whose FIRST signed address is refused by storage (as if it had expired). */
    this.expireFirstAddress = new Set();
    /** Part numbers whose storage PUT never answers. */
    this.hangParts = new Set();
    this.pendingParts = new Set();
    this.issued = new Map(); // signature → { uploadId, partNumber, expired }
    this.videoStatusAfterCompletion = 'ready';
  }

  async start() {
    this.server = createServer((req, res) => this.handle(req, res).catch((error) => {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: { code: 'FAKE_CRASH', message: String(error) } }));
    }));
    await new Promise((resolve) => this.server.listen(0, '127.0.0.1', resolve));
    this.origin = `http://127.0.0.1:${this.server.address().port}`;
    this.base = `${this.origin}/v1`;
  }

  async stop() {
    this.server.closeAllConnections();
    await new Promise((resolve) => this.server.close(resolve));
  }

  count(method, path) {
    return this.requests.filter((r) => r.method === method && r.path === path).length;
  }

  storagePuts(partNumber) {
    return this.requests.filter((r) => r.method === 'PUT' && r.path.startsWith('/storage/') && r.partNumber === partNumber);
  }

  // -------------------------------------------------------------------------

  async handle(req, res) {
    const url = new URL(req.url, this.origin);
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks);
    const isJson = (req.headers['content-type'] ?? '').startsWith('application/json');
    const record = {
      method: req.method, path: url.pathname, query: url.search, at: Date.now(),
      authorization: req.headers.authorization, idempotencyKey: req.headers['idempotency-key'],
      body: isJson ? JSON.parse(raw.toString() || '{}') : raw,
    };
    this.requests.push(record);

    const send = (status, payload, headers = {}) => {
      res.writeHead(status, { 'content-type': 'application/json', ...headers });
      res.end(JSON.stringify(payload));
    };
    const ok = (data, status = 200) => send(status, { success: true, data });
    const fail = (status, code, message, details, headers) =>
      send(status, { success: false, error: { code, message, ...(details ? { details } : {}) } }, headers);

    if (url.pathname.startsWith('/storage/')) return this.storage(req, res, url, raw, record);

    const fault = this.faults.get(`${req.method} ${url.pathname}`);
    if (fault && fault.times > 0) {
      fault.times -= 1;
      return fail(fault.status, fault.code, 'Injected fault', undefined, fault.retryAfter ? { 'retry-after': String(fault.retryAfter) } : {});
    }

    // Authentication and permissions, as the real gate does.
    const key = /^Bearer (.+)$/.exec(req.headers.authorization ?? '')?.[1];
    const keyInfo = key ? this.keys.get(key) : undefined;
    if (!keyInfo) return fail(401, 'INVALID_API_KEY', 'API key is missing or invalid');
    if (keyInfo.revoked) return fail(401, 'KEY_REVOKED', 'API key was revoked');
    const need = (scope) => {
      if (keyInfo.scopes.includes(scope)) return false;
      fail(403, 'SCOPE_MISSING', `This key lacks the ${scope} permission`, { required: scope });
      return true;
    };
    const visibleChannels = keyInfo.channelId === null ? this.channels : this.channels.filter((c) => c.id === keyInfo.channelId);

    const p = url.pathname;
    let m;
    if (req.method === 'GET' && p === '/v1/me') {
      return ok({
        account: { id: 'acc_1', username: 'creator' },
        key: { id: 'key_1', name: keyInfo.name, prefix: key.slice(0, 12), scopes: keyInfo.scopes, channelId: keyInfo.channelId,
          status: 'active', createdAt: null, lastUsedAt: null, expiresAt: null, revokedAt: null },
        dailyUploads: { limit: 20, used: 20 - this.dailyRemaining, remaining: this.dailyRemaining, resetsAt: '2026-11-15T00:00:00.000Z' },
        limits: { maxOpenUploads: 5, requestsPerMinute: 120, maxFileBytes: 2_000_000_000, partSizeBytes: this.partSize,
          acceptedContentTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo'], thumbnailMaxBytes: 3 * 1024 * 1024,
          thumbnailContentTypes: ['image/jpeg', 'image/png', 'image/webp'] },
      });
    }
    if (req.method === 'GET' && p === '/v1/channels') {
      if (need('videos:read')) return undefined;
      return ok({ channels: visibleChannels });
    }
    if (req.method === 'POST' && p === '/v1/uploads') {
      if (need('videos:upload')) return undefined;
      const body = record.body;
      if (!visibleChannels.some((c) => c.id === body.channelId)) return fail(403, 'CHANNEL_FORBIDDEN', 'This key cannot publish to that channel');
      const attemptKey = record.idempotencyKey ?? randomUUID();
      const existing = this.attempts.get(attemptKey);
      if (existing) {
        if (!['initiated', 'uploading'].includes(existing.state)) return fail(409, 'UPLOAD_ALREADY_COMPLETED', 'Upload already completed');
        return ok(this.started(existing), 200);
      }
      if (this.dailyRemaining <= 0) return fail(429, 'UPLOAD_DAILY_QUOTA_EXCEEDED', 'Daily upload limit of 20 reached. Try again tomorrow.', { limit: 20 });
      this.dailyRemaining -= 1;
      const upload = {
        id: randomUUID(), channelId: body.channelId, title: body.title, description: body.description ?? null, tags: body.tags ?? null,
        filename: body.filename, size: body.sizeBytes, partCount: Math.ceil(body.sizeBytes / this.partSize), parts: new Map(),
        state: 'uploading', videoId: null, isPublic: body.visibility === 'public',
      };
      this.uploads.set(upload.id, upload);
      this.attempts.set(attemptKey, upload);
      return ok(this.started(upload), 201);
    }
    if ((m = /^\/v1\/uploads\/([^/]+)(\/parts|\/completion)?$/.exec(p))) {
      if (need('videos:upload')) return undefined;
      const upload = this.uploads.get(m[1]);
      if (!upload) return fail(404, 'UPLOAD_NOT_FOUND', 'Upload not found');
      if (req.method === 'GET' && !m[2]) return ok(this.state(upload));
      if (req.method === 'DELETE' && !m[2]) {
        if (!['initiated', 'uploading'].includes(upload.state)) return fail(409, 'UPLOAD_ALREADY_COMPLETED', 'Upload already completed');
        upload.state = 'aborted';
        return ok({ uploadId: upload.id, uploadState: 'aborted' });
      }
      if (req.method === 'POST' && m[2] === '/parts') {
        const numbers = record.body.partNumbers ?? [];
        if (numbers.length > 10) return fail(400, 'UPLOAD_PARTS_INVALID', 'At most 10 parts per call');
        return ok({ uploadId: upload.id, expiresAt: new Date(Date.now() + 900_000).toISOString(),
          capabilities: numbers.map((n) => this.capability(upload, n)), resumeExpiresAt: null, resumeExpiresAtEstimated: true });
      }
      if (req.method === 'PUT' && m[2] === '/completion') {
        const parts = record.body.parts ?? [];
        const valid = parts.length === upload.partCount && parts.every((part, i) =>
          part.partNumber === i + 1 && upload.parts.get(part.partNumber)?.etag === part.etag);
        if (!valid) return fail(400, 'UPLOAD_PARTS_INVALID', 'Not every part was received');
        upload.state = 'processing';
        const id = this.nextVideoId++;
        upload.videoId = id;
        this.videos.set(id, {
          id, channelId: upload.channelId, title: upload.title, description: upload.description, tags: upload.tags ?? [],
          visibility: upload.isPublic ? 'public' : 'private', status: this.videoStatusAfterCompletion, moderation: 'active',
          durationSeconds: 12, thumbnailUrl: null, watchUrl: `https://beta.base.tube/video/${id}`, createdAt: null, updatedAt: null,
        });
        return ok({ uploadId: upload.id, uploadState: 'processing', videoId: null });
      }
    }
    if (req.method === 'GET' && p === '/v1/videos') {
      if (need('videos:read')) return undefined;
      const videos = [...this.videos.values()].reverse();
      return ok({ videos, pagination: { page: 1, limit: 25, total: videos.length, totalPages: 1 } });
    }
    if ((m = /^\/v1\/videos\/(\d+)(\/thumbnail)?$/.exec(p))) {
      const video = this.videos.get(Number(m[1]));
      const scope = { GET: 'videos:read', PATCH: 'videos:write', PUT: 'videos:write', DELETE: 'videos:delete' }[req.method];
      if (need(scope)) return undefined;
      if (!video) return fail(404, 'VIDEO_NOT_FOUND', 'Video not found');
      if (req.method === 'GET' && !m[2]) return ok(video);
      if (req.method === 'PATCH' && !m[2]) {
        if (record.body.visibility === 'public' && video.status !== 'ready') return fail(400, 'VIDEO_NOT_READY', 'Video is not ready');
        Object.assign(video, record.body);
        return ok(video);
      }
      if (req.method === 'PUT' && m[2]) {
        video.thumbnailUrl = `https://cdn.example/thumb-${video.id}-${createHash('sha1').update(raw).digest('hex').slice(0, 8)}.jpg`;
        return ok(video);
      }
      if (req.method === 'DELETE' && !m[2]) {
        this.videos.delete(video.id);
        return ok({ videoId: video.id, deleted: true });
      }
    }
    return fail(404, 'NOT_FOUND', `No fake route for ${req.method} ${p}`);
  }

  started(upload) {
    return {
      uploadId: upload.id, uploadState: upload.state, partSizeBytes: this.partSize, partCount: upload.partCount,
      declaredSizeBytes: upload.size, capabilities: [], expiresAt: new Date(Date.now() + 900_000).toISOString(),
      resumeExpiresAt: null, resumeExpiresAtEstimated: true,
    };
  }

  state(upload) {
    return {
      uploadId: upload.id, uploadState: upload.state, channelId: upload.channelId, title: upload.title,
      description: upload.description, isPublic: upload.isPublic, tags: upload.tags, originalFilename: upload.filename,
      declaredSizeBytes: upload.size, partSizeBytes: this.partSize, partCount: upload.partCount,
      videoId: upload.videoId, videoStatus: null, errorCode: null, createdAt: null, updatedAt: null,
      resumeExpiresAt: null, resumeExpiresAtEstimated: true,
      completedParts: [...upload.parts.entries()].map(([partNumber, part]) => ({ partNumber, etag: part.etag, sizeBytes: part.bytes.length })),
      canRenewCapabilities: upload.state === 'uploading',
    };
  }

  capability(upload, partNumber) {
    const signature = `sig${(this.signatures += 1)}`;
    const firstForPart = ![...this.issued.values()].some((i) => i.uploadId === upload.id && i.partNumber === partNumber);
    this.issued.set(signature, { uploadId: upload.id, partNumber, expired: firstForPart && this.expireFirstAddress.has(partNumber) });
    const length = Math.min(this.partSize, upload.size - (partNumber - 1) * this.partSize);
    return {
      partNumber, method: 'PUT', url: `${this.origin}/storage/${upload.id}/${partNumber}?X-Amz-Signature=${signature}`,
      requiredHeaders: {}, uaManagedSignedHeaders: { 'content-length': String(length) },
    };
  }

  storage(req, res, url, raw, record) {
    const [, , uploadId, part] = url.pathname.split('/');
    const partNumber = Number(part);
    record.partNumber = partNumber;
    const issued = this.issued.get(url.searchParams.get('X-Amz-Signature'));
    const upload = this.uploads.get(uploadId);
    if (!issued || !upload || issued.uploadId !== uploadId || issued.partNumber !== partNumber || issued.expired) {
      res.writeHead(403, { 'content-type': 'application/xml' });
      res.end('<Error><Code>AccessDenied</Code><Message>Request has expired</Message></Error>');
      return;
    }
    if (this.hangParts.has(partNumber)) {
      this.pendingParts.add(partNumber);
      return; // never answers
    }
    const expected = Math.min(this.partSize, upload.size - (partNumber - 1) * this.partSize);
    if (raw.length !== expected) {
      res.writeHead(400);
      res.end('wrong length');
      return;
    }
    const etag = `"${createHash('md5').update(raw).digest('hex')}"`;
    upload.parts.set(partNumber, { etag, bytes: raw });
    res.writeHead(200, { etag });
    res.end();
  }

  /** The bytes storage received for an upload, joined in part order. */
  assembled(uploadId) {
    const upload = this.uploads.get(uploadId);
    return Buffer.concat([...upload.parts.entries()].sort((a, b) => a[0] - b[0]).map(([, part]) => part.bytes));
  }
}
