// Wächter (Impeccable 18.10.2026, timer «Abstand» instead of «Intervall»): a key translated differently in
// two German files is silently decided by the order in de/index.js (the later file wins everywhere).
// A new text with another meaning gets its own key with a context ('Interval|timer'). KNOWN lists the
// duplicates that existed on 18.10.2026 (mostly deliberate later wordings); the list may only shrink.
import { describe, it, expect } from 'vitest';

const files = import.meta.glob('../src/lib/i18n/de/*.js', { eager: true });

const KNOWN = new Set([
  'Bike service',
  'Check',
  'Daily ride',
  'Done',
  'Down tube cage',
  'Fork cage',
  'Go back',
  'Hip bag or vest, worn by the rider',
  'How it works',
  'In {n} days',
  'Not used on {trips}.',
  'Off-bike clothing',
  'On-bike clothing',
  'Open Active › Goals.',
  'Open Bikes and choose a bike.',
  'Open Bikes › Care.',
  'Open Bikes › Workshop.',
  'Open Me › Appearance.',
  'Open Me › What is new.',
  'Open Meditation › More.',
  'Open Trips.',
  'Overnight sets',
  'Pouch left',
  'Pouch right',
  'Reading…',
  'Ride day',
  'Saddle height',
  'Seat tube',
  'Setup photo',
  'Standard set',
  'Worn',
  'only the next star per milestone',
  '{n} days ago',
  '{n} left',
  '{n} pinned',
  '{n} to do',
  '{n} update',
  '{n} updates',
]);

function conflicts() {
  const seen = new Map();
  const out = new Map();
  for (const [path, mod] of Object.entries(files)) {
    if (path.endsWith('/index.js') || !mod.default || typeof mod.default !== 'object') continue;
    for (const [k, v] of Object.entries(mod.default)) {
      const first = seen.get(k);
      if (!first) seen.set(k, { path, v });
      else if (first.v !== v) out.set(k, `${first.path}: «${first.v}» · ${path}: «${v}»`);
    }
  }
  return out;
}

describe('German texts: one key, one translation', () => {
  it('no new key is translated differently in two de files', () => {
    const fresh = [...conflicts()].filter(([k]) => !KNOWN.has(k)).map(([k, where]) => `${k} → ${where}`);
    expect(fresh).toEqual([]);
  });

  it('the list of known duplicates only shrinks', () => {
    const now = conflicts();
    expect([...KNOWN].filter((k) => !now.has(k))).toEqual([]);
  });

  it('the timer kind is «Intervall», bike care keeps «Abstand»', async () => {
    const DE = (await import('../src/lib/i18n/de/index.js')).default;
    const { MODES } = await import('../src/lib/timer.js');
    expect(DE[MODES.find((m) => m.id === 'interval').label]).toBe('Intervall');
    expect(DE.Interval).toBe('Abstand');
  });
});
