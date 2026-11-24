// Noah 23.11.2026: «Was mir gut tut» was not the same on the phone (11 entries) and on the computer (8). The list is one
// record; when both devices changed it, one of the two lists used to replace the other. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { noteKey } from '../src/lib/sync/track.js';
import { newCode } from '../src/lib/sync/code.js';
import { startSync, syncNow, lostVersions } from '../src/lib/sync/engine.js';
import { mergeRoutine, mergeBoth } from '../src/lib/sync/merge.js';
import { makeHandler } from '../api/sync.js';
import { fakeRedis } from './fakeredis.js';
import { routineOf, recordOf, removeItem, addItem, renameItem, toggleTick, seedItems } from '../src/lib/routine.js';

let n = 0;
const fresh = () => createDb(`routine-${n++}`);
function fakeServer() {
  const redis = fakeRedis();
  const handler = makeHandler({ env: () => ({ redisUrl: 'https://r.test', redisToken: 'r' }), doFetch: async (url, init) => Response.json({ result: redis.run(...((a) => [a[0], a.slice(1)])(JSON.parse(init.body))) }) });
  return { async call(step, body) { const res = await handler(new Request(`https://x.test/api/sync?step=${step}`, { method: 'POST', body: JSON.stringify(body), headers: { origin: 'http://localhost:5173' } })); const d = await res.json(); if (!res.ok) throw Object.assign(new Error(d.message), { code: d.code }); return d; } };
}
const stamp = (db, id, at) => db.meta.update(noteKey('settings', id), { at });
const save = (db, r) => db.settings.put({ key: 'routine', value: recordOf(r) });
const names = (rec) => rec.value.items.map((x) => x.name);
const rec = (r) => ({ key: 'routine', value: recordOf(r) });
const DAY = '2026-11-23';

describe('mergeRoutine (merge.js)', () => {
  it('both lists stay: an entry only one device has is not lost', () => {
    const phone = addItem(renameItem(routineOf(null), 'shower', 'Duschen und anziehen'), { id: 'r-air', name: 'Frische Luft' });
    const computer = addItem(routineOf(null), { id: 'r-sil', name: '15 min silence' });
    const m = mergeRoutine(rec(computer), rec(phone));
    expect(names(m)).toContain('Frische Luft');
    expect(names(m)).toContain('15 min silence');
    expect(names(m)).toContain('Duschen und anziehen'); // the renamed one beats the unchanged example
    expect(names(m)).not.toContain('A fresh shower');
    expect(m.value.items.filter((x) => x.id === 'shower')).toHaveLength(1);
  });
  it('ticks and answers of both devices stay', () => {
    const a = toggleTick(routineOf(null), 'wake', DAY);
    const b = toggleTick(toggleTick(routineOf(null), 'banana', DAY), 'wake', '2026-11-22');
    const m = mergeRoutine(rec(a), rec(b));
    expect(m.value.ticks.wake).toEqual(['2026-11-22', DAY]);
    expect(m.value.ticks.banana).toEqual([DAY]);
  });
  it('an unchanged example that only one device has was deleted on the other: it goes, a ticked one stays', () => {
    const phone = removeItem(removeItem(routineOf(null), 'kind'), 'walk');
    const computer = toggleTick(routineOf(null), 'walk', DAY); // ticked here: it was used
    const m = mergeRoutine(rec(computer), rec(phone));
    expect(m.value.items.map((x) => x.id)).not.toContain('kind');
    expect(m.value.items.map((x) => x.id)).toContain('walk');
  });
  it('an own entry deleted on the newer device stays deleted; one deleted on the older device comes back (nothing is lost)', () => {
    const base = addItem(routineOf(null), { id: 'r-x', name: 'Eigenes' });
    const deleted = removeItem(base, 'r-x');
    expect(mergeRoutine(rec(deleted), rec(base)).value.items.map((x) => x.id)).not.toContain('r-x');
    expect(mergeRoutine(rec(toggleTick(base, 'wake', DAY)), rec(deleted)).value.items.map((x) => x.id)).toContain('r-x');
  });
  it('the order and wording of an entry both devices changed come from the newer record', () => {
    const a = renameItem(routineOf(null), 'wake', 'Früh auf');
    const b = renameItem(routineOf(null), 'wake', 'Aufstehen');
    expect(mergeRoutine(rec(a), rec(b)).value.items.find((x) => x.id === 'wake').name).toBe('Früh auf');
  });
  it('the same whichever device computes it; merging the result again changes nothing', () => {
    const a = addItem(toggleTick(routineOf(null), 'wake', DAY), { id: 'r-a', name: 'A' });
    const b = removeItem(addItem(routineOf(null), { id: 'r-b', name: 'B' }), 'kind');
    const t1 = '2026-11-23T10:00:00Z';
    const t2 = '2026-11-23T10:01:00Z';
    const ab = mergeBoth('settings', 'routine', rec(a), rec(b), { mineAt: t1, theirsAt: t2 });
    const ba = mergeBoth('settings', 'routine', rec(b), rec(a), { mineAt: t2, theirsAt: t1 });
    expect(ab).toEqual(ba);
    expect(mergeBoth('settings', 'routine', ab, rec(a), { mineAt: '2026-11-23T10:02:00Z', theirsAt: t1 })).toBeNull();
  });
  it('the deleted-notes survive saving and reading', () => {
    const r = routineOf(recordOf(removeItem(routineOf(null), 'kind')));
    expect(r.gone).toEqual(['kind']);
    expect(routineOf(recordOf(routineOf(null))).gone).toBeUndefined();
    expect(seedItems().length).toBe(7);
  });
});

describe('two devices: the list «Das tut mir gut»', () => {
  const pair = async () => {
    const api = fakeServer();
    const phone = fresh();
    const computer = fresh();
    const code = newCode();
    await startSync(computer, code);
    await syncNow(computer, { api, dev: 'computer' });
    await startSync(phone, code);
    await syncNow(phone, { api, dev: 'phone' });
    return { api, phone, computer };
  };
  const rounds = async ({ api, phone, computer }) => {
    for (let i = 0; i < 3; i++) {
      await syncNow(phone, { api, dev: 'phone' });
      await syncNow(computer, { api, dev: 'computer' });
    }
  };

  it('each device edits the list, both entries end on both', async () => {
    const p = await pair();
    await save(p.phone, addItem(renameItem(routineOf(null), 'shower', 'Duschen und anziehen'), { id: 'r-air', name: 'Frische Luft' }));
    await stamp(p.phone, 'routine', '2026-11-23T20:00:00.000Z');
    await save(p.computer, addItem(routineOf(null), { id: 'r-sil', name: '15 min silence' }));
    await stamp(p.computer, 'routine', '2026-11-23T20:01:00.000Z');
    await rounds(p);
    const a = (await p.phone.settings.get('routine')).value;
    const b = (await p.computer.settings.get('routine')).value;
    expect(a).toEqual(b);
    expect(a.items.map((x) => x.name)).toEqual(expect.arrayContaining(['Frische Luft', '15 min silence', 'Duschen und anziehen']));
    expect(await lostVersions(p.phone)).toHaveLength(0);
    expect(await syncNow(p.phone, { api: p.api, dev: 'phone' })).toMatchObject({ sent: 0, taken: 0 });
  });

  it('a device that never saved its list ticks one entry: the real list of the other device stays', async () => {
    const p = await pair();
    await save(p.phone, addItem(renameItem(routineOf(null), 'banana', 'Zmorgä'), { id: 'r-air', name: 'Frische Luft' }));
    await stamp(p.phone, 'routine', '2026-11-23T20:00:00.000Z');
    // the computer did not pull yet (offline) and ticks on its examples
    await save(p.computer, toggleTick(routineOf(null), 'wake', DAY));
    await stamp(p.computer, 'routine', '2026-11-23T20:05:00.000Z');
    await rounds(p);
    for (const db of [p.phone, p.computer]) {
      const v = (await db.settings.get('routine')).value;
      expect(v.items.map((x) => x.name)).toEqual(expect.arrayContaining(['Zmorgä', 'Frische Luft']));
      expect(v.items.map((x) => x.name)).not.toContain('A banana for breakfast');
      expect(v.ticks.wake).toEqual([DAY]);
    }
  });

  it('the same tick on one list from both devices, different days: both stay', async () => {
    const p = await pair();
    await save(p.phone, toggleTick(routineOf(null), 'wake', '2026-11-22'));
    await stamp(p.phone, 'routine', '2026-11-23T20:00:00.000Z');
    await save(p.computer, toggleTick(routineOf(null), 'wake', DAY));
    await stamp(p.computer, 'routine', '2026-11-23T20:01:00.000Z');
    await rounds(p);
    for (const db of [p.phone, p.computer]) expect((await db.settings.get('routine')).value.ticks.wake).toEqual(['2026-11-22', DAY]);
  });
});

describe('the pieces «stay for cycling» (setting wardrobe.everydayKeep)', () => {
  it('the ids of both devices stay', () => {
    const m = mergeBoth('settings', 'wardrobe.everydayKeep', { key: 'wardrobe.everydayKeep', value: ['A', 'B'] }, { key: 'wardrobe.everydayKeep', value: ['C', 'A'] }, { mineAt: '2026-11-23T10:01:00Z', theirsAt: '2026-11-23T10:00:00Z' });
    expect(m.value).toEqual(['A', 'B', 'C']);
  });
});
