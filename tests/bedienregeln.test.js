// P3b Teil 2 «Bedienregeln» (Noah 15.10.2026): the same rules everywhere. Fictional data only.
import { describe, it, expect, beforeEach } from 'vitest';
import { UNDO_MS } from '../src/lib/ui/undo.js';
import { UNDO_MS as RENAME_UNDO } from '../src/lib/ui/rename.svelte.js';
import { chosenBike, chooseBike, lastBikeChoice } from '../src/lib/lastchoice.js';
import { lastBikeId } from '../src/lib/dayride.js';
import { hubBike } from '../src/lib/hubs.js';
import { undoSteps, keepUndoSteps } from '../src/lib/pack/undostack.js';
import { shortcutOf } from '../src/lib/nav/keys.js';
import { PLACES, PLACE_TABS, keepTab } from '../src/lib/nav.js';
import { openTodos } from '../src/lib/todos.js';

const store = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear() };
};
beforeEach(() => {
  globalThis.localStorage = store();
});

const bikes = [{ id: 'b-test-1', name: 'Test Gravel' }, { id: 'b-test-2', name: 'Test Rennvelo' }];

describe('Ü4a: Undo 4 s everywhere', () => {
  it('one time for all', () => {
    expect(UNDO_MS).toBe(4000);
    expect(RENAME_UNDO).toBe(UNDO_MS);
  });
});

describe('4a: the bike chosen last stays chosen', () => {
  it('is kept and only counts while the bike exists', () => {
    expect(chosenBike(bikes)).toBe(null);
    chooseBike('b-test-2');
    expect(lastBikeChoice()).toBe('b-test-2');
    expect(chosenBike(bikes)).toBe('b-test-2');
    expect(chosenBike([bikes[0]])).toBe(null);
  });
  it('reads the old key of «Report a problem»', () => {
    localStorage.setItem('problem.lastBike', 'b-test-2');
    expect(chosenBike(bikes)).toBe('b-test-2');
  });
  it('comes first for a quick job, but never for a new trip (Noah 18.10.2026 «1b»: a new trip takes the standard bike)', () => {
    const trips = [{ id: 't-test-1', bikeId: 'b-test-1', startDate: '2026-10-01', days: 1, createdAt: '2026-10-01' }];
    expect(lastBikeId(trips, bikes, '2026-10-15')).toBe('b-test-1');
    chooseBike('b-test-2');
    expect(lastBikeId(trips, bikes, '2026-10-15')).toBe('b-test-1');
    expect(hubBike(null, bikes)).toBe('b-test-2');
    expect(hubBike({ bikeId: 'b-test-1' }, bikes)).toBe('b-test-1'); // the next trip's bike still wins
  });
});

describe('T2a: Undo while packing stays until another trip is chosen', () => {
  it('keeps the steps of the open trip only', () => {
    keepUndoSteps([{ id: 't-a' }, { id: 't-b' }, { id: 't-a' }], 't-a');
    expect(undoSteps()).toEqual([{ id: 't-a' }, { id: 't-a' }]);
    keepUndoSteps(undoSteps(), null); // still loading: nothing is dropped
    expect(undoSteps()).toHaveLength(2);
    keepUndoSteps(undoSteps(), 't-b');
    expect(undoSteps()).toEqual([]);
  });
});

describe('Ü1a: «g + letter» opens the tab opened last there', () => {
  it('like the bar', () => {
    const place = PLACES.find((p) => (PLACE_TABS[p.key] ?? []).length > 1);
    const [first, second] = PLACE_TABS[place.key];
    keepTab(place.key, second.key);
    expect(shortcutOf(place.letter, true)).toEqual({ go: second.href });
    // on the place you are on: its first tab
    expect(shortcutOf(place.letter, true, place.key)).toEqual({ go: first.href });
  });
});

describe('H2b: demo trips count like real ones', () => {
  it('a saved debrief of a demo trip ends the to-do', () => {
    const rows = openTodos({ trips: [{ id: 'demo-test-1' }], debriefs: [{ tripId: 'demo-test-1', status: 'done' }], pace: { mine: true } });
    expect(rows.map((r) => r.key)).not.toContain('trip');
  });
});
