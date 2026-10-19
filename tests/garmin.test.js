import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { buildBackup, restoreBackup } from '../src/lib/backup.js';
import { cleanupData } from '../src/lib/cleanup.js';
import { parseBikesHash, bikesHash } from '../src/lib/bikes.js';
import DE from '../src/lib/i18n/de/index.js';
import { DEVICES, PAGES, PAGE, MAX_FIELDS, KIND_LABEL, SENSOR_LABEL, BIKEPACKING_PAGES, garminOf, toStore, suggestPages, fieldsOf, fieldRows, toggleField, layout, togglePage, addPage, removePage, addProfile, removeProfile, setSensor, toggleDone, copyFrom, onPages, profileName } from '../src/lib/garmin.js';
import { GARMIN } from '../src/lib/kmbook.js';

// «Garmin-Seiten» GA-1–GA-10 + GA-A1–A3 (Noah 14.10.2026 «1a 2b 3b 4a», «GA-A1–A3 freigegeben»). Fictional bikes only.
const gravel = { id: 'b1', name: 'Gravel Grinder', type: 'Gravel' };
const mtb = { id: 'b2', name: 'Trailbike', type: 'Fully' };
const power = { power: true, cadence: false, speed: false, hr: true };

describe('the ten pages', () => {
  it('GA-1 to GA-10, 2 to 8 fields each, a reason for every page and field', () => {
    expect(PAGES.map((p) => p.id)).toEqual(Array.from({ length: 10 }, (_, i) => `GA-${i + 1}`));
    for (const p of PAGES) {
      expect(p.fields.length).toBeGreaterThanOrEqual(2);
      expect(p.fields.length).toBeLessThanOrEqual(8);
      expect(p.why).toBeTruthy();
      for (const f of p.fields) expect(f.why, `${p.id} ${f.k}`).toBeTruthy();
    }
    // some simple, some detailed pages
    expect(PAGES.filter((p) => p.kind === 'easy').length).toBeGreaterThanOrEqual(3);
    expect(PAGES.filter((p) => p.kind === 'deep').length).toBeGreaterThanOrEqual(3);
  });

  it('the Edge 850 (it replaced the 540) shows the whole page like the 1040, at most 8 fields', () => {
    const all = { power: true, cadence: true, speed: true, hr: true };
    expect(DEVICES).toEqual(['1040', '850']);
    for (const p of PAGES) {
      expect(fieldsOf(p.id, '850', all).length, p.id).toBeLessThanOrEqual(MAX_FIELDS[850]);
      expect(fieldsOf(p.id, '850', all), p.id).toEqual(fieldsOf(p.id, '1040', all));
    }
    expect(fieldsOf('GA-6', '850', all).map((x) => x.k)).toContain('if');
  });

  it('a FIT file of the Edge 850 names its device (product 4634, Garmin FIT SDK)', () => {
    expect(GARMIN[4634]).toBe('Edge 850');
  });

  it('3b: «Time in zones» is a Connect IQ field on GA-6', () => {
    expect(PAGE['GA-6'].fields.find((x) => x.k === 'zones')).toMatchObject({ ciq: true, gfx: 'zones' });
  });

  it('without power pedals a power field gives way to a replacement or goes', () => {
    const none = { power: false, cadence: false, speed: false, hr: true };
    const ga2 = fieldsOf('GA-2', '1040', none).map((x) => x.k);
    expect(ga2).not.toContain('pzone');
    expect(ga2).toContain('speed');
    expect(fieldsOf('GA-6', '1040', none)).toEqual([]);
    // power pedals measure the cadence too
    expect(fieldsOf('GA-2', '1040', power).map((x) => x.k)).toEqual(['pzone', 'hrline', 'hr', 'cad']);
  });

  it('every text has a German entry', () => {
    const texts = [...PAGES.flatMap((p) => [p.name, p.why, ...p.fields.flatMap((f) => [f.label, f.why])]), ...Object.values(KIND_LABEL), ...Object.values(SENSOR_LABEL)];
    const alt = fieldsOf('GA-9', '1040', { hr: true }).filter((x) => x.instead);
    expect(texts.concat(alt.flatMap((x) => [x.label, x.why])).filter((x) => !DE[x])).toEqual([]);
  });
});

describe('the suggestion', () => {
  it('a gravel bike gets its own profile and «Bikepacking» (1a)', () => {
    const g = garminOf(gravel);
    expect(g.stored).toBe(false);
    expect(g.profiles.map((p) => p.id)).toEqual(['own', 'bp']);
    expect(g.profiles[1].pages).toEqual(BIKEPACKING_PAGES);
    expect(profileName(g.profiles[0], gravel)).toBe('Gravel Grinder');
  });

  it('power pedals bring the power pages, a mountain bike the trail page', () => {
    expect(suggestPages(gravel, power)).toEqual(['GA-1', 'GA-2', 'GA-3', 'GA-6', 'GA-7', 'GA-9', 'GA-10']);
    expect(suggestPages(mtb)).toContain('GA-8');
    expect(suggestPages(mtb)).not.toContain('GA-6');
    expect(garminOf(mtb).profiles.map((p) => p.id)).toEqual(['own']);
  });

  it('a sensor ticked changes the suggestion only while nobody changed the pages', () => {
    let g = setSensor(garminOf(gravel), gravel, 'power', true);
    expect(g.profiles[0].pages).toContain('GA-6');
    g = togglePage(g, 'own', 'GA-7');
    g = setSensor(g, gravel, 'power', false);
    expect(g.profiles[0].pages).toContain('GA-6');
  });
});

describe('changing pages and fields', () => {
  const start = () => setSensor(garminOf(gravel), gravel, 'power', true);

  it('pages switch off and on, go and come back in GA order', () => {
    let g = togglePage(start(), 'own', 'GA-3');
    expect(onPages(g.profiles[0])).not.toContain('GA-3');
    g = togglePage(g, 'own', 'GA-3');
    expect(onPages(g.profiles[0])).toContain('GA-3');
    g = removePage(g, 'own', 'GA-2');
    expect(g.profiles[0].pages).not.toContain('GA-2');
    g = addPage(g, 'own', 'GA-2');
    expect(g.profiles[0].pages.slice(0, 3)).toEqual(['GA-1', 'GA-2', 'GA-3']);
  });

  it('a field hides on one Edge only; a page keeps one field', () => {
    let g = toggleField(start(), 'GA-6', '850', 'tss');
    expect(fieldsOf('GA-6', '850', g.sensors, g.fields['GA-6']['850']).map((x) => x.k)).not.toContain('tss');
    const rows = fieldRows(g, 'GA-6');
    expect(rows.find((r) => r.k === 'tss').on).toEqual({ 1040: true, 850: false });
    g = toggleField(g, 'GA-6', '850', 'tss');
    expect(fieldRows(g, 'GA-6').find((r) => r.k === 'tss').on).toEqual({ 1040: true, 850: true });
    const one = toggleField(start(), 'GA-1', '1040', 'speed');
    expect(toggleField(one, 'GA-1', '1040', 'dist')).toBeNull();
  });

  it('the drawing: a graphic has a row of its own, the numbers in twos', () => {
    const rows = layout(fieldsOf('GA-6', '1040', power));
    expect(rows.map((r) => r.map((x) => x.k))).toEqual([['pline'], ['np', 'pavg'], ['if', 'tss', 'ftp'], ['zones']]);
    expect(layout(fieldsOf('GA-1', '1040', power)).map((r) => r.length)).toEqual([1, 1]);
  });

  it('profiles: add «Bikepacking» or an own one, the bike\'s own stays', () => {
    let g = addProfile(garminOf(mtb), mtb, 'Bikepacking', 'p1');
    expect(g.profiles[1].pages).toEqual(BIKEPACKING_PAGES);
    g = removeProfile(g, 'p1');
    g = removeProfile(g, 'own');
    expect(g.profiles.map((p) => p.id)).toEqual(['own']);
  });

  it('a setup stored with the Edge 540: its hidden fields go, its ticks move to the 850', () => {
    const bike = { ...gravel, garmin: { ...toStore(start()), fields: { 'GA-6': { 540: ['tss'], 1040: ['ftp'] } }, done: { 'own:GA-6': { 540: '2026-10-14', ciq: '2026-10-14' } } } };
    const g = garminOf(bike);
    expect(g.fields['GA-6']).toEqual({ 1040: ['ftp'] });
    expect(g.done['own:GA-6']).toEqual({ 850: '2026-10-14', ciq: '2026-10-14' });
  });

  it('ticks «set up on the device», copy from another bike without its ticks', () => {
    let g = toggleDone(start(), 'own', 'GA-6', '1040', '2026-10-14');
    expect(g.done['own:GA-6']).toEqual({ 1040: '2026-10-14' });
    const other = { ...gravel, id: 'b3', garmin: toStore(g) };
    const copied = copyFrom(other, mtb);
    expect(copied.done).toEqual({});
    expect(copied.profiles[0].pages).toEqual(g.profiles[0].pages);
    expect(toggleDone(g, 'own', 'GA-6', '1040', '2026-10-15').done['own:GA-6']).toEqual({});
  });
});

describe('the address', () => {
  it('tab=garmin with a profile and a page goes there and back', () => {
    const h = bikesHash({ tab: 'garmin', bike: 'b1', view: 'bp', page: 'GA-4' });
    expect(h).toBe('#/bikes?tab=garmin&bike=b1&view=bp&page=GA-4');
    expect(parseBikesHash(h)).toMatchObject({ tab: 'garmin', bike: 'b1', view: 'bp', page: 'GA-4' });
    expect(parseBikesHash('#/bikes?tab=garmin&bike=b1&page=nope').page).toBeUndefined();
  });
});

describe('bike.garmin in backup and cleanup', () => {
  it('comes back from a backup and stays through «Daten bereinigen»', async () => {
    const db = createDb('garmin-1');
    const g = toggleDone(setSensor(garminOf(gravel), gravel, 'power', true), 'own', 'GA-6', '850', '2026-10-14');
    await db.bikes.put({ ...gravel, garmin: toStore(g) });
    const file = JSON.parse(JSON.stringify(await buildBackup(db)));
    const other = createDb('garmin-2');
    await restoreBackup(other, file, 'replace');
    expect((await other.bikes.get('b1')).garmin).toEqual(toStore(g));
    await restoreBackup(other, file, 'merge');
    expect((await other.bikes.get('b1')).garmin).toEqual(toStore(g));
    await cleanupData(other);
    expect((await other.bikes.get('b1')).garmin).toEqual(toStore(g));
  });
});
