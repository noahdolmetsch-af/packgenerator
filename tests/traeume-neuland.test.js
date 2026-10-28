// «Träume und Neuland» PR 1 (Noah 27.10.2026 «1-5 a»): Träume second under Touren, «a dream that fits now»
// on the overview, and «Neuland des Jahres» with its own setting (it shared 'neuland' with the Neuland page).
// Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { splitNeuland, OLD_KEY, YEAR_KEY } from '../src/lib/neuland/split.js';
import { NEULAND_KEY as WOHL_NEULAND_KEY } from '../src/lib/wohl.js';
import { NEULAND_KEY as PAGE_KEY } from '../src/lib/neuland/neuland.js';
import { readState, saveState } from '../src/lib/neuland/store.js';
import { UPDATES } from '../src/lib/updates.js';
import { dreamsNow } from '../src/lib/dreams.js';
import { PLACE_TABS } from '../src/lib/nav.js';

let n = 0;
const fresh = () => createDb(`traeume-neuland-${++n}`);

describe('Neuland des Jahres has its own setting', () => {
  it('the two keys differ, and the page keeps «neuland»', () => {
    expect(WOHL_NEULAND_KEY).toBe(YEAR_KEY);
    expect(PAGE_KEY).toBe(OLD_KEY);
    expect(WOHL_NEULAND_KEY).not.toBe(PAGE_KEY);
    expect(UPDATES).toContain(splitNeuland);
  });

  it('moves an old list over once and leaves the Neuland page empty, not broken', async () => {
    const db = fresh();
    const list = [{ id: 'nl-a', name: 'test_data_gtp_ Erster Sprung', day: '2026-09-01' }];
    await db.settings.put({ key: OLD_KEY, value: list });
    expect(await splitNeuland(db)).toBe(true);
    expect((await db.settings.get(YEAR_KEY)).value).toEqual(list);
    expect(await db.settings.get(OLD_KEY)).toBeUndefined();
    expect(await splitNeuland(db)).toBe(false); // nothing left to move
    expect((await readState(db)).ticks).toEqual({});
  });

  it('keeps what is already under the new setting and adds no id twice', async () => {
    const db = fresh();
    await db.settings.put({ key: YEAR_KEY, value: [{ id: 'nl-a', name: 'test_data_gtp_ A', day: '2026-09-01' }] });
    await db.settings.put({ key: OLD_KEY, value: [{ id: 'nl-a', name: 'test_data_gtp_ A', day: '2026-09-01' }, { id: 'nl-b', name: 'test_data_gtp_ B', day: '2026-09-02' }] });
    await splitNeuland(db);
    expect((await db.settings.get(YEAR_KEY)).value.map((x) => x.id)).toEqual(['nl-a', 'nl-b']);
  });

  it('never touches the Neuland page state (an object)', async () => {
    const db = fresh();
    await db.settings.put({ key: OLD_KEY, value: { ticks: { cantons: { ZH: { day: '2026-09-01', by: 'hand' } } } } });
    expect(await splitNeuland(db)).toBe(false);
    expect((await readState(db)).ticks.cantons.ZH.by).toBe('hand');
  });

  it('saving the Neuland page first moves an old list out, so it is not overwritten', async () => {
    const db = fresh();
    await db.settings.put({ key: OLD_KEY, value: [{ id: 'nl-c', name: 'test_data_gtp_ C', day: '2026-10-01' }] });
    const s = await readState(db);
    await saveState(db, { ...s, home: 'ZH' });
    expect((await db.settings.get(YEAR_KEY)).value.map((x) => x.id)).toEqual(['nl-c']);
    expect((await readState(db)).home).toBe('ZH');
  });
});

describe('Träume moves forward', () => {
  it('Träume is the second tab under Touren', () => {
    expect(PLACE_TABS.trips.map((x) => x.key).slice(0, 2)).toEqual(['overview', 'dreams']);
  });

  it('a dream that fits now: this month, no trip yet, in your order', () => {
    const value = {
      dreams: [
        { id: 'a', title: 'test_data_gtp_ Winterrunde', months: [10, 11] },
        { id: 'b', title: 'test_data_gtp_ Sommerpass', months: [7, 8] },
        { id: 'c', title: 'test_data_gtp_ Schon geplant', months: [10], tripId: 't1' },
        { id: 'd', title: 'test_data_gtp_ Herbst', months: [10] },
      ],
    };
    expect(dreamsNow(value, '2026-10-27').map((d) => d.id)).toEqual(['a', 'd']);
    expect(dreamsNow(value, '2026-08-01').map((d) => d.id)).toEqual(['b']);
    expect(dreamsNow(null, '2026-10-27')).toEqual([]);
  });
});
