// «Touren-Seite klarer» (Noah 25.11.2026 «1-5a»): the sentence of the best days, trips named like a test offered for the
// «Test trip» switch (never by itself, with Undo), the words of a list row. Fictional data only.
import './setup/de.js'; // this test needs the German texts
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import Dexie from 'dexie';
import { listAnd } from '../src/lib/touren.js';
import { testLooking, markTestChanges, unmarkTestChanges } from '../src/lib/touren/aufraeumen.js';
import { markTests, unmarkTests } from '../src/lib/touren/aufraeumendb.js';
import { stateExtraText } from '../src/lib/tripstatetext.js';
import { lang } from '../src/lib/i18n.svelte.js';

const trip = (id, title, o = {}) => ({ id, title, startDate: '2026-10-08', days: 1, status: 'done', entries: [], ...o });

describe('listAnd', () => {
  it('commas, then «and» before the last word', () => {
    expect(listAnd(['Do', 'Fr', 'So'], 'und')).toBe('Do, Fr und So');
    expect(listAnd(['Sa', 'So'], 'und')).toBe('Sa und So');
    expect(listAnd(['Sa'], 'und')).toBe('Sa');
    expect(listAnd([], 'und')).toBe('');
  });
});

describe('testLooking', () => {
  it('finds a trip named like a test that has no switch yet', () => {
    const rows = testLooking([trip('a', 'testnavigation 2611231655'), trip('b', 'Gravel-Fahrt am Morgen'), trip('c', 'Contest Tour')]);
    expect(rows.map((x) => x.id)).toEqual(['a']);
  });
  it('leaves out the marked, the archived, the unmarked by choice and the made-up examples', () => {
    const rows = testLooking([
      trip('a', 'test eins', { testTrip: true }),
      trip('b', 'test zwei', { archivedAt: 'x' }),
      trip('c', 'test drei', { testTrip: false }),
      trip('ex-trip', 'Test Beispiel'),
      trip('d', 'test vier'),
    ]);
    expect(rows.map((x) => x.id)).toEqual(['d']);
  });
});

describe('mark as test and Undo', () => {
  let db;
  beforeEach(async () => {
    db = new Dexie(`klarer-${Math.random()}`);
    db.version(1).stores({ trips: 'id' });
    await db.trips.bulkPut([trip('a', 'testnavigation 1'), trip('b', 'Echte Tour')]);
  });
  it('sets only the switch; nothing is deleted; Undo sets it off explicitly', async () => {
    expect(markTestChanges('t')).toEqual({ testTrip: true, testMarkedAt: 't' });
    expect(await markTests(db, ['a'], 't')).toBe(1);
    expect((await db.trips.get('a')).testTrip).toBe(true);
    expect((await db.trips.get('a')).title).toBe('testnavigation 1');
    expect((await db.trips.get('b')).testTrip).toBeUndefined();
    expect(await unmarkTests(db, ['a'])).toBe(1);
    expect((await db.trips.get('a')).testTrip).toBe(false);
    expect(unmarkTestChanges().testTrip).toBe(false);
    // not offered again after Undo
    expect(testLooking(await db.trips.toArray())).toHaveLength(0);
  });
});

describe('the words of a list row', () => {
  it('«date passed» says what is open in a list, the header keeps its own', () => {
    lang.v = 'de';
    expect(stateExtraText({ key: 'ask' })).toBe('Datum vorbei');
    expect(stateExtraText({ key: 'ask' }, { list: true })).toBe('Datum vorbei, gefahren?');
    expect(stateExtraText({ key: 'missing' }, { list: true })).toBe('Rückblick fehlt');
    lang.v = 'en';
  });
});
