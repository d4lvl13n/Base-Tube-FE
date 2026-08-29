/**
 * How long a single write may take before the queue stops waiting for it.
 *
 * This is not a substitute for the request's own timeout — it is a ceiling on
 * what the QUEUE will tolerate. Writes for one video are serialized so they
 * cannot land out of order, which means one request that never answers is one
 * request that blocks every later write for that row. Bounded only by axios's
 * timeout times its retries, that is roughly half an hour of a switch that
 * does nothing and a row that says it is busy.
 */
export const WRITE_TIMEOUT_MS = 20_000;

/** Thrown when the queue gives up waiting, so the caller can say so plainly. */
export class WriteTimeoutError extends Error {
  constructor() {
    super('The server did not answer in time');
    this.name = 'WriteTimeoutError';
  }
}

export type WriteTask<T> = (signal: AbortSignal) => Promise<T>;

export interface WriteQueue {
  /** Run `task` after every write already queued for this video. */
  enqueue<T>(videoId: number, task: WriteTask<T>): Promise<T>;
  /** How many videos currently have work outstanding. For tests. */
  pending(): number;
}

/**
 * One request at a time per video, in the order they were asked for.
 *
 * Optimistic updates decide who owns the value on screen; the server has its
 * own opinion about order. Two overlapping writes can land in either sequence,
 * and if the older one lands last the database keeps the value the creator
 * changed their mind about while the screen shows the newer one. Queuing per
 * video makes "last asked" and "last written" the same thing.
 *
 * Everything else here exists so that guarantee cannot turn into a trap: a
 * write that never answers is abandoned rather than left holding the queue, a
 * failure does not strand the writes behind it, and a finished video is
 * forgotten instead of accumulating an entry for the life of the tab.
 */
export function createWriteQueue(timeoutMs: number = WRITE_TIMEOUT_MS): WriteQueue {
  const tails = new Map<number, Promise<void>>();

  async function bounded<T>(task: WriteTask<T>): Promise<T> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const expiry = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        // Abort, so giving up actually cancels the work rather than leaving it
        // to finish unobserved and land on top of something newer.
        controller.abort();
        reject(new WriteTimeoutError());
      }, timeoutMs);
    });

    try {
      return await Promise.race([task(controller.signal), expiry]);
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  }

  function enqueue<T>(videoId: number, task: WriteTask<T>): Promise<T> {
    const previous = tails.get(videoId) ?? Promise.resolve();
    // Run whether the one before succeeded or failed — a failure ahead of us
    // must not strand every later write for this video.
    const run = () => bounded(task);
    const next = previous.then(run, run);

    // The tail is only cleared by the write that IS the tail; a later write
    // that has already taken its place must not have its entry removed.
    const tail: Promise<void> = next
      .then(
        () => undefined,
        () => undefined,
      )
      .then(() => {
        if (tails.get(videoId) === tail) tails.delete(videoId);
      });
    tails.set(videoId, tail);
    return next;
  }

  return { enqueue, pending: () => tails.size };
}
