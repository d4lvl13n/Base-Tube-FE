import { WriteTimeoutError, createWriteQueue } from '../writeQueue';

/** A promise the test settles when it wants the request to land. */
function deferred<T>() {
  let settle!: (value: T) => void;
  let fail!: (reason: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    settle = resolve;
    fail = reject;
  });
  return { promise, settle, fail };
}

/** Let every already-resolved microtask run. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('createWriteQueue ordering', () => {
  // The whole reason the queue exists: two writes for one video must reach the
  // server in the order the creator asked for them, or the older one landing
  // last leaves the database holding the value they changed their mind about.
  it('does not start the second write for a video until the first has settled', async () => {
    const queue = createWriteQueue(1_000);
    const first = deferred<string>();
    const started: string[] = [];

    const a = queue.enqueue(1, () => {
      started.push('a');
      return first.promise;
    });
    const b = queue.enqueue(1, async () => {
      started.push('b');
      return 'b';
    });

    await flush();
    expect(started).toEqual(['a']);

    first.settle('a');
    await expect(a).resolves.toBe('a');
    await expect(b).resolves.toBe('b');
    expect(started).toEqual(['a', 'b']);
  });

  it('runs writes for different videos side by side', async () => {
    const queue = createWriteQueue(1_000);
    const held = deferred<string>();
    const started: number[] = [];

    queue.enqueue(1, () => {
      started.push(1);
      return held.promise;
    });
    const other = queue.enqueue(2, async () => {
      started.push(2);
      return 'done';
    });

    await expect(other).resolves.toBe('done');
    expect(started).toEqual([1, 2]);
    held.settle('x');
  });

  // A failure ahead of us is not a reason to abandon the creator's next click.
  it('runs the next write even when the one before it failed', async () => {
    const queue = createWriteQueue(1_000);
    const failing = queue.enqueue(1, async () => {
      throw new Error('nope');
    });
    const after = queue.enqueue(1, async () => 'ok');

    await expect(failing).rejects.toThrow('nope');
    await expect(after).resolves.toBe('ok');
  });
});

describe('createWriteQueue timeout', () => {
  /**
   * Serializing writes means one request that never answers is one request
   * that blocks every later write for that row. Bounded only by axios's own
   * timeout times its retries, that is about half an hour of a switch that
   * does nothing.
   */
  it('gives up on a write that never answers', async () => {
    const queue = createWriteQueue(20);
    const result = queue.enqueue(1, () => new Promise<string>(() => undefined));

    await expect(result).rejects.toBeInstanceOf(WriteTimeoutError);
  });

  it('cancels the abandoned work rather than leaving it running', async () => {
    const queue = createWriteQueue(20);
    let seen: AbortSignal | undefined;

    await expect(
      queue.enqueue(1, (signal) => {
        seen = signal;
        return new Promise<string>(() => undefined);
      }),
    ).rejects.toBeInstanceOf(WriteTimeoutError);

    expect(seen?.aborted).toBe(true);
  });

  // The point of the ceiling: the queue moves on.
  it('lets the next write through once it has given up on the one before', async () => {
    const queue = createWriteQueue(20);
    const stuck = queue.enqueue(1, () => new Promise<string>(() => undefined));
    const after = queue.enqueue(1, async () => 'ok');

    await expect(stuck).rejects.toBeInstanceOf(WriteTimeoutError);
    await expect(after).resolves.toBe('ok');
  });

  it('does not fire the ceiling on a write that answers in time', async () => {
    const queue = createWriteQueue(1_000);

    await expect(queue.enqueue(1, async () => 'ok')).resolves.toBe('ok');
  });
});

describe('createWriteQueue bookkeeping', () => {
  // A queue that never forgets its finished work is a map that grows for the
  // life of the tab, one entry per video the creator ever touched.
  it('forgets a video once its last write has settled', async () => {
    const queue = createWriteQueue(1_000);

    await queue.enqueue(1, async () => 'ok');
    await queue.enqueue(2, async () => 'ok');
    await flush();

    expect(queue.pending()).toBe(0);
  });

  it('forgets a video whose write failed, and one it gave up on', async () => {
    const queue = createWriteQueue(20);

    await expect(
      queue.enqueue(1, async () => {
        throw new Error('nope');
      }),
    ).rejects.toThrow('nope');
    await expect(queue.enqueue(2, () => new Promise<string>(() => undefined))).rejects.toBeInstanceOf(
      WriteTimeoutError,
    );
    await flush();

    expect(queue.pending()).toBe(0);
  });

  // Only the write that IS the tail may clear the entry: an earlier one
  // finishing must not drop the queue out from under a later one.
  it('keeps the entry while a later write is still outstanding', async () => {
    const queue = createWriteQueue(1_000);
    const first = deferred<string>();
    const second = deferred<string>();

    const a = queue.enqueue(1, () => first.promise);
    const b = queue.enqueue(1, () => second.promise);

    first.settle('a');
    await a;
    await flush();
    expect(queue.pending()).toBe(1);

    second.settle('b');
    await b;
    await flush();
    expect(queue.pending()).toBe(0);
  });
});
