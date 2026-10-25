// Noah 21.10.2026 (screenshot): the phone asked «Auf beiden Geräten geändert» about «strava.last», with
// «Wert: geändert» on both sides. The app's own settings (fetch summaries, caches, counters, view states)
// now settle by themselves, the newer one wins; a real setting is asked with its name and its values.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createDb } from '../src/lib/db.js';
import { newCode } from '../src/lib/sync/code.js';
import { startSync, syncNow, autoPick, INTERNAL_SETTINGS, isInternal, askKey, ASK, lostVersions } from '../src/lib/sync/engine.js';
import { titleOf, differences } from '../src/lib/sync/show.js';
import { noteKey } from '../src/lib/sync/track.js';
import { makeHandler } from '../api/sync.js';
import { fakeRedis } from './fakeredis.js';

let n = 0;
const fresh = () => createDb(`sync-intern-${n++}`);
function fakeApi() {
  const r = fakeRedis();
  const handler = makeHandler({ env: () => ({ redisUrl: 'https://redis.example.test', redisToken: 'r' }), doFetch: async (url, init) => Response.json({ result: r.run(...((a) => [a[0], a.slice(1)])(JSON.parse(init.body))) }) });
  return {
    async call(step, body) {
      const res = await handler(new Request(`https://packgen.example.test/api/sync?step=${step}`, { method: 'POST', body: JSON.stringify(body), headers: { origin: 'http://localhost:5173' } }));
      const data = await res.json();
      if (!res.ok) throw Object.assign(new Error(data.message), { code: data.code });
      return data;
    },
  };
}
const openAsks = (db) => db.meta.where('key').startsWith(ASK).count();
const last = (at, n) => ({ key: 'strava.last', value: { at, first: false, counts: { assigned: n }, n } });

describe('the app\'s own settings never become a question', () => {
  it('autoPick: the newer one wins, by the time inside or by the time of the change', () => {
    expect(isInternal('settings', 'strava.last')).toBe(true);
    expect(isInternal('settings', 'riderWeightG')).toBe(false);
    expect(isInternal('items', 'strava.last')).toBe(false);
    expect(autoPick('settings', 'strava.last', last('2026-10-20T22:18:00Z', 1), last('2026-10-20T23:58:00Z', 2))).toBe('theirs');
    expect(autoPick('settings', 'strava.last', last('2026-10-21T00:10:00Z', 1), last('2026-10-20T23:58:00Z', 2))).toBe('mine');
    expect(autoPick('settings', 'strava.last', last('a', 1), last('a', 1))).toBe('same');
    // no time inside: the time of the change counts; a delete on one side too
    const use = (v) => ({ key: 'homeUsage', value: v });
    expect(autoPick('settings', 'homeUsage', use({ a: 1 }), use({ a: 2 }), { mineAt: '2026-10-21T01:00:00Z', theirsAt: '2026-10-21T02:00:00Z' })).toBe('theirs');
    expect(autoPick('settings', 'homeUsage', use({ a: 1 }), null, { mineAt: '2026-10-21T03:00:00Z', theirsAt: '2026-10-21T02:00:00Z' })).toBe('mine');
    // the Strava connection: only the fetch marks differ → no question; a setting of the person differs → ask
    const prefs = (lastSync, fetch = 'auto') => ({ key: 'strava', value: { fetch, noBike: 'check', ignore: [], gear: [{ id: 'b1', km: lastSync.length }], lastSync, athlete: 'x' } });
    expect(autoPick('settings', 'strava', prefs('2026-10-20T22:18:00Z'), prefs('2026-10-20T23:58:00Z'))).toBe('same');
    expect(autoPick('settings', 'strava', prefs('2026-10-20T22:18:00Z'), prefs('2026-10-20T23:58:00Z', 'ask'))).toBe('theirs');
    // a setting the person made stays a question
    expect(autoPick('settings', 'riderWeightG', { key: 'riderWeightG', value: 72000 }, { key: 'riderWeightG', value: 70000 })).toBe(null);
  });

  it('every listed key is a key the app really writes (a renamed key would ask again)', () => {
    const files = [];
    const walk = (d) => readdirSync(d).forEach((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : /\.(js|svelte)$/.test(f) && files.push(join(d, f))));
    walk('src');
    const src = files.filter((f) => !f.endsWith('sync/engine.js')).map((f) => readFileSync(f, 'utf8')).join('\n');
    for (const key of Object.keys(INTERNAL_SETTINGS)) expect(src, key).toContain(`'${key}'`);
  });

  it('two devices fetch Strava: no question; an open question from before goes by itself', async () => {
    const api = fakeApi();
    const phone = fresh();
    const computer = fresh();
    const code = newCode();
    const run = (db, dev) => syncNow(db, { api, dev });
    await startSync(computer, code);
    await run(computer, 'computer');
    await startSync(phone, code);
    await run(phone, 'phone');
    await phone.settings.put(last('2026-10-20T22:18:00Z', 3));
    await computer.settings.put(last('2026-10-20T23:58:00Z', 5));
    await run(phone, 'phone');
    expect(await run(computer, 'computer')).toMatchObject({ asks: 0 });
    expect(await run(phone, 'phone')).toMatchObject({ asks: 0 });
    expect((await phone.settings.get('strava.last')).value.n).toBe(5);
    expect((await computer.settings.get('strava.last')).value.n).toBe(5);
    // the question Noah saw on 21.10.2026 (asked before this rule): the next round answers it
    const { base } = await phone.meta.get(noteKey('settings', 'strava.last'));
    await phone.meta.put({ key: askKey('settings', 'strava.last'), t: 'settings', id: 'strava.last', s: base, v: last('2026-10-21T01:00:00Z', 7), del: false, at: '2026-10-21T01:00:00Z', dev: 'computer' });
    expect(await openAsks(phone)).toBe(1);
    expect(await run(phone, 'phone')).toMatchObject({ asks: 0, settled: 1 });
    expect((await phone.settings.get('strava.last')).value.n).toBe(7);
    // a setting of the person (Noah 24.10.2026): no question either, the newer change wins, the other is kept
    await phone.settings.put({ key: 'riderWeightG', value: 70000 });
    await run(phone, 'phone');
    await run(computer, 'computer');
    await phone.settings.put({ key: 'riderWeightG', value: 71000 });
    await phone.meta.update(noteKey('settings', 'riderWeightG'), { at: '2026-10-24T08:00:00.000Z' });
    await computer.settings.put({ key: 'riderWeightG', value: 72000 });
    await computer.meta.update(noteKey('settings', 'riderWeightG'), { at: '2026-10-24T09:00:00.000Z' });
    await run(phone, 'phone');
    expect(await run(computer, 'computer')).toMatchObject({ asks: 0 });
    await run(phone, 'phone');
    expect((await phone.settings.get('riderWeightG')).value).toBe(72000);
    expect((await computer.settings.get('riderWeightG')).value).toBe(72000);
    expect((await lostVersions(computer)).map((l) => l.v?.value)).toEqual([71000]);
  });
});

describe('a setting in the question: its name and its values, never the raw key', () => {
  it('names a known setting, any other one as «Other app setting»', () => {
    expect(titleOf({ key: 'riderWeightG', value: 1 }, 'riderWeightG', 'settings')).toBe('Your weight');
    expect(titleOf({ key: 'strava', value: {} }, 'strava', 'settings')).toBe('Strava connection');
    expect(titleOf({ key: 'some.inner', value: 1 }, 'some.inner', 'settings')).toBe('Other app setting');
    expect(titleOf({ id: 'A', name: 'test_data_gtp_ Lampe' }, 'A', 'items')).toBe('test_data_gtp_ Lampe');
  });
  it('shows the value itself, or the fields inside it, not «changed»', () => {
    expect(differences({ key: 'riderWeightG', value: 72000 }, { key: 'riderWeightG', value: 70000 }, 4, 'settings')).toEqual([{ key: 'value', label: 'Value', mine: '72,000 g', theirs: '70,000 g' }]);
    expect(differences({ key: 'homePlace', value: { name: 'test_data_gtp_ A' } }, { key: 'homePlace', value: { name: 'test_data_gtp_ B' } }, 4, 'settings')).toEqual([{ key: 'name', label: 'Name', mine: 'test_data_gtp_ A', theirs: 'test_data_gtp_ B' }]);
  });
});
