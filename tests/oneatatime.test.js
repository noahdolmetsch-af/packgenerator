// One Overpass request at a time (src/lib/route/oneatatime.js), and a request that never answers holds
// nothing up (Noah 21.10.2026: «Lädt…» stayed and the place search did nothing).
import { describe, it, expect, vi, afterEach } from 'vitest';
import { queued, postTimed, MAX_WAIT_MS } from '../src/lib/route/oneatatime.js';

afterEach(() => vi.useRealTimers());

describe('one request at a time', () => {
  it('the second waits for the first', async () => {
    const order = [];
    let done;
    const a = queued(() => new Promise((ok) => (done = () => (order.push('a'), ok('a')))));
    const b = queued(async () => (order.push('b'), 'b'));
    await Promise.resolve();
    expect(order).toEqual([]);
    await vi.waitFor(() => expect(done).toBeTypeOf('function'));
    done();
    expect(await a).toBe('a');
    expect(await b).toBe('b');
    expect(order).toEqual(['a', 'b']);
  });
  it('a request that never answers holds up the next one at most MAX_WAIT_MS', async () => {
    vi.useFakeTimers();
    queued(() => new Promise(() => {}));
    let ran = false;
    const next = queued(async () => (ran = true));
    await vi.advanceTimersByTimeAsync(MAX_WAIT_MS - 1000);
    expect(ran).toBe(false);
    await vi.advanceTimersByTimeAsync(2000);
    await next;
    expect(ran).toBe(true);
  });
  it('postTimed gives up with «timeout» and aborts the request', async () => {
    vi.useFakeTimers();
    let signal = null;
    const p = postTimed((url, init) => ((signal = init.signal), new Promise(() => {})), 'https://example.org', {}, 5000);
    const caught = p.catch((e) => e.message);
    await vi.advanceTimersByTimeAsync(5001);
    expect(await caught).toBe('timeout');
    expect(signal?.aborted).toBe(true);
    const ok = await postTimed(async () => ({ ok: true }), 'https://example.org', {}, 5000);
    expect(ok).toEqual({ ok: true });
  });
});
