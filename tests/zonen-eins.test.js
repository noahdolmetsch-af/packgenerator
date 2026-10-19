// One set of heart rate zones for Rückblick › Tempo, Vergangene Touren and Training; «Kommentar laden» fetches
// the activity from Strava. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { zonesOf, zoneValues, saveZones, loadComments, ZONES_KEY } from '../src/lib/review/actdata.js';
import { zonesOf as trainingZones, ownOf, OWN_ZONES_KEY, ZONES_KEY as STRAVA_KEY } from '../src/lib/training.js';
import { standardZones } from '../src/lib/review/werte.js';

const STRAVA = { hr: [{ min: 0, max: 115 }, { min: 115, max: 135 }, { min: 135, max: 150 }, { min: 150, max: 165 }, { min: 165, max: -1 }] };

describe('one set of zones', () => {
  it('own from Training come first, one beat lower as the top of each zone', () => {
    expect(zonesOf({ own: { own: [120, 140, 155, 170] }, strava: STRAVA, legacy: { bounds: [100, 110, 120, 130] } })).toEqual({ bounds: [119, 139, 154, 169], source: 'own', max: null });
  });
  it('the older own zones of Tempo still count, for Training too', () => {
    expect(zonesOf({ legacy: { bounds: [117, 137, 153, 168] }, strava: STRAVA })).toMatchObject({ bounds: [117, 137, 153, 168], source: 'own' });
    expect(ownOf(null, { bounds: [117, 137, 153, 168] })).toEqual({ own: [118, 138, 154, 169] });
    expect(trainingZones(STRAVA, ownOf(null, { bounds: [117, 137, 153, 168] }))).toEqual({ bounds: [118, 138, 154, 169], source: 'own' });
  });
  it('then Strava’s, then the standard from the highest heart rate', () => {
    expect(zonesOf({ strava: STRAVA }, [{ hrMax: 180 }])).toEqual({ bounds: [114, 134, 149, 164], source: 'strava', max: null });
    expect(zonesOf({}, [{ hrMax: 180, state: 'counted' }])).toEqual({ bounds: standardZones(180), source: 'standard', max: 180 });
    expect(zonesOf(null, [])).toBeNull();
  });
  it('saving on Tempo writes Training’s zones; back to the standard clears both', async () => {
    const db = createDb('zonen-eins-a');
    await db.settings.put({ key: ZONES_KEY, value: { bounds: [100, 110, 120, 130] } });
    expect(await saveZones(db, [117, 137, 153, 168])).toBe(true);
    expect((await db.settings.get(OWN_ZONES_KEY)).value).toEqual({ own: [118, 138, 154, 169] });
    expect(await db.settings.get(ZONES_KEY)).toBeUndefined();
    await db.settings.put({ key: STRAVA_KEY, value: STRAVA });
    expect(zonesOf(await zoneValues(db))).toMatchObject({ bounds: [117, 137, 153, 168], source: 'own' });
    expect(await saveZones(db, [20, 30, 40, 50])).toBe(false);
    await saveZones(db, null);
    expect(await db.settings.get(OWN_ZONES_KEY)).toBeUndefined();
    expect(zonesOf(await zoneValues(db)).source).toBe('strava');
  });
});

describe('«Kommentar laden»', () => {
  it('fetches each activity and says whether one came', async () => {
    const db = createDb('zonen-eins-b');
    const seen = [];
    expect(await loadComments(db, ['test_data_gtp_1', 'test_data_gtp_2'], { load: async (_db, id) => seen.push(id) })).toBe(true);
    expect(seen).toEqual(['test_data_gtp_1', 'test_data_gtp_2']);
    expect(await loadComments(db, ['test_data_gtp_1'], { load: async () => { throw new Error('offline'); } })).toBe(false);
    expect(await loadComments(db, [], { load: async () => {} })).toBe(false);
  });
});
