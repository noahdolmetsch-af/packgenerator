// «Rundgang der Stärken» station 3 (Noah 23.11.2026 «1-5a»): example bag photos for the sample race, drawn, removable
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { SAMPLE_BAGS, sampleBagShots, bagDrawing, sampleShotId, putSampleBags, dropSampleBags } from '../src/lib/race/samplebags.js';
import { bagShotsOf, bagShotList } from '../src/lib/pack/bagshot.js';
import { SAMPLE_ID } from '../src/lib/race/sample.js';
import DE from '../src/lib/i18n/de/index.js';

describe('example bag photos of the sample race', () => {
  const rows = sampleBagShots('2026-11-23');
  it('one drawn photo per example bag, for the sample race only', () => {
    expect(rows.map((r) => r.slot)).toEqual(SAMPLE_BAGS.map((b) => b.slot));
    for (const r of rows) {
      expect(r).toMatchObject({ bagShot: true, sample: true, tripId: SAMPLE_ID, bikeId: null });
      expect(r.id).toBe(sampleShotId(r.slot));
      expect(r.data.startsWith('data:image/svg+xml')).toBe(true);
      expect(r.data.length).toBeLessThan(6000);
    }
  });
  it('the race mode box finds them (bagShotList), and no other trip does', () => {
    expect(bagShotList(rows, SAMPLE_ID, SAMPLE_BAGS.map((b) => b.slot)).map((x) => x.slot)).toEqual(['seat', 'frame', 'bar']);
    expect(Object.keys(bagShotsOf(rows, 'ex-trip'))).toEqual([]);
  });
  it('the drawing carries the name, the label «Example», the contents and the weight', () => {
    const svg = decodeURIComponent(bagDrawing({ name: 'Frame bag', things: ['Tool kit'], weight: '0.8 kg', tag: 'Example' }).split(',')[1]);
    for (const x of ['Frame bag', 'Tool kit', '0.8 kg', 'Example']) expect(svg).toContain(x);
    expect(bagDrawing({ name: '<b>&', things: [], weight: '', tag: '' })).not.toContain('<b>');
  });
  it('every text has its German version', () => {
    for (const b of SAMPLE_BAGS) for (const k of [b.name, ...b.things]) expect(DE[k], k).toBeTruthy();
    expect(DE.Example).toBeTruthy();
  });
});

describe('putting them in and taking them out', () => {
  it('adds only the missing ones, «force» puts them back as new, deleting leaves your own photos', async () => {
    const db = createDb(`samplebags-${Math.random()}`);
    const own = { id: 'bagshot-own', tripId: SAMPLE_ID, slot: 'seat', bagShot: true, name: 'Mine', data: 'data:image/jpeg;base64,xx', addedAt: '2026-11-25T08:00:00.000Z' };
    const other = { id: 'bagshot-other', tripId: 'ex-trip', slot: 'seat', bagShot: true, name: 'Other', data: 'data:image/jpeg;base64,yy', addedAt: '2026-11-25T08:00:00.000Z' };
    await db.photos.bulkPut([own, other]);
    expect(await putSampleBags({ db, today: '2026-11-23' })).toBe(3);
    expect(await putSampleBags({ db, today: '2026-11-23' })).toBe(0);
    expect(await putSampleBags({ db, today: '2026-11-23', force: true })).toBe(3);
    // your own newer photo of a bag wins over the drawn one
    expect(bagShotsOf(await db.photos.toArray(), SAMPLE_ID).seat.name).toBe('Mine');
    expect(await dropSampleBags(db)).toBe(3);
    expect((await db.photos.toArray()).map((p) => p.id).sort()).toEqual(['bagshot-other', 'bagshot-own']);
  });
});
