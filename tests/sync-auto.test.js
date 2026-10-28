// runSync (src/lib/sync/auto.svelte.js): a round asked for while one runs starts right after it, and the
// caller waits for that new round, not for the older one (pairing on a slow line said «Gekoppelt» too early).
import { describe, it, expect, vi } from 'vitest';

const rounds = [];
vi.mock('../src/lib/sync/engine.js', () => ({
  syncNow: vi.fn(
    () =>
      new Promise((done) => {
        rounds.push(done);
      }),
  ),
  readCfg: vi.fn(async () => null),
  settleAsks: vi.fn(async () => {}),
}));
vi.mock('../src/lib/push/client.js', () => ({ afterSync: () => {} }));

const { runSync } = await import('../src/lib/sync/auto.svelte.js');
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('runSync', () => {
  it('waits for a round that starts after the call', async () => {
    const db = {};
    const first = runSync(db);
    await tick();
    expect(rounds).toHaveLength(1);

    // asked twice while the first runs: one more round, shared by both
    const second = runSync(db);
    const third = runSync(db);
    expect(third).toBe(second);
    let secondDone = false;
    second.then(() => (secondDone = true));

    rounds[0]('old');
    expect(await first).toBe('old');
    await tick();
    expect(rounds).toHaveLength(2);
    expect(secondDone).toBe(false);

    rounds[1]('new');
    expect(await second).toBe('new');
    await tick();
    expect(rounds).toHaveLength(2);
  });

  it('a round asked for when nothing runs starts at once', async () => {
    const before = rounds.length;
    const p = runSync({});
    await tick();
    expect(rounds).toHaveLength(before + 1);
    rounds.at(-1)('alone');
    expect(await p).toBe('alone');
  });
});
