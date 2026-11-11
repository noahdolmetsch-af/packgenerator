// Tempo (Noah 11.11.2026 «1-4 umsetzen»): the reminders (push/client.js afterSync) are only looked at after a round that took or sent
// something; a quiet round asks the server nothing.
import { describe, it, expect, vi } from 'vitest';

const answers = [];
let asked = 0;
const afterSync = async () => {
  asked++;
};
vi.mock('../src/lib/sync/engine.js', () => ({
  syncNow: vi.fn(async () => answers.shift()),
  readCfg: vi.fn(async () => null),
  settleAsks: vi.fn(async () => {}),
}));
vi.mock('../src/lib/push/client.js', () => ({ afterSync }));

const { runSync } = await import('../src/lib/sync/auto.svelte.js');
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('runSync and the reminders', () => {
  it('asks after a round that took something, and after one that sent something', async () => {
    answers.push({ taken: 2, sent: 0 });
    await runSync({});
    await tick();
    expect(asked).toBe(1);
    answers.push({ taken: 0, sent: 1 });
    await runSync({});
    await tick();
    expect(asked).toBe(2);
  });

  it('asks nothing after a quiet round', async () => {
    answers.push({ taken: 0, sent: 0, asks: 0 });
    await runSync({});
    await tick();
    expect(asked).toBe(2);
  });
});
