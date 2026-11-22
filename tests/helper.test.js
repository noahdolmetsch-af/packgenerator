// v0.77.0 «KI-Helfer»: the app side. The Helfer-Code never in a backup, the question rule of the search,
// the monthly limit and the empty credit. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { buildBackup, restoreBackup, DEVICE_SETTINGS } from '../src/lib/backup.js';
import { looksLikeQuestion } from '../src/lib/helper/logic.js';
import { settingsOf, pausedBy, nextMonthStart, MODELS, ask, helper, isOn, isShown, noCredit, creditTold, errorText, CREDIT_KEY, HELPER_KEY } from '../src/lib/helper/client.svelte.js';
import { db as appDb } from '../src/lib/db.js';
import { MODEL_CHOICES } from '../api/_lib/helper.js';

const SECRET = 'test-helfer-code-0000000000000000';

describe('the Helfer-Code stays on this device (answer 8a)', () => {
  let db;
  let n = 0;
  beforeEach(() => (db = createDb(`helper-${++n}`)));
  it('is never in a backup or an export, and a restore keeps the device its own', async () => {
    expect(DEVICE_SETTINGS).toContain('helper');
    await db.settings.bulkPut([{ key: 'helper', value: { code: SECRET, on: true, capChf: 5 } }, { key: 'riderWeightG', value: 64000 }]);
    const file = await buildBackup(db);
    expect(JSON.stringify(file)).not.toContain(SECRET);
    expect(file.tables.settings.map((s) => s.key)).toEqual(['riderWeightG']);
    await restoreBackup(db, { app: 'pack-generator', schemaVersion: 1, tables: { settings: [{ key: 'helper', value: { code: 'other' } }] } }, 'replace');
    expect((await db.settings.get('helper')).value.code).toBe(SECRET);
  });
});

describe('settings and the monthly limit (answer 7a)', () => {
  // v0.118.0 «KI-Helfer ausblenden» (changed on purpose, Noah answer a ★): off by default, one switch `show`
  // 15.10.2026 (changed on purpose, Noah «1b 2a»): CHF 2 by default, Sonnet 5.5 unless Haiku 5.5 is picked
  it('defaults: no code, not shown, CHF 2, Sonnet; only show: true shows it (the old `on` no longer counts)', () => {
    expect(settingsOf(undefined)).toEqual({ code: '', show: false, capChf: 2, model: 'claude-sonnet-5-5' });
    expect(settingsOf({ code: 'x', on: true, capChf: '3.5' })).toEqual({ code: 'x', show: false, capChf: 3.5, model: 'claude-sonnet-5-5' });
    expect(settingsOf({ code: 'x', show: true })).toEqual({ code: 'x', show: true, capChf: 2, model: 'claude-sonnet-5-5' });
    expect(settingsOf({ code: 'x', show: 'yes' }).show).toBe(false);
  });
  it('an old saved limit of CHF 5 (the old default) counts as CHF 2; a 5 saved from now on stays', () => {
    expect(settingsOf({ code: 'x', capChf: 5 }).capChf).toBe(2);
    expect(settingsOf({ code: 'x', capChf: 5, capV: 2 }).capChf).toBe(5);
    expect(settingsOf({ code: 'x', capChf: 7 }).capChf).toBe(7);
  });
  it('keeps Haiku 5.5 when picked, anything unknown is Sonnet 5.5', () => {
    expect(settingsOf({ model: 'claude-haiku-5-5' }).model).toBe('claude-haiku-5-5');
    expect(settingsOf({ model: 'claude-opus-5-5' }).model).toBe('claude-sonnet-5-5');
    expect(MODELS.map((m) => m.id)).toEqual(MODEL_CHOICES);
  });
  it('pauses from the lower of the two limits, this month only', () => {
    const s = settingsOf({ code: 'x', capChf: 2 });
    expect(pausedBy(s, { month: '2026-10', chf: 1.99, cap: 5 }, '2026-10')).toBe(false);
    expect(pausedBy(s, { month: '2026-10', chf: 2, cap: 5 }, '2026-10')).toBe(true);
    expect(pausedBy(settingsOf({ code: 'x', capChf: 9 }), { month: '2026-10', chf: 5.01, cap: 5 }, '2026-10')).toBe(true);
    expect(pausedBy(s, { month: '2026-09', chf: 9, cap: 5 }, '2026-10')).toBe(false);
    expect(pausedBy(s, { month: '2026-10', chf: 0.1, cap: 5, capped: true }, '2026-10')).toBe(true);
  });
  it('says when it starts again (calendar months, December → January)', () => {
    expect(nextMonthStart('2026-10-10', 'de-CH')).toMatch(/^1\. Nov/);
    expect(nextMonthStart('2026-12-31', 'de-CH')).toMatch(/^1\. Jan/);
  });
});

describe('Search: when a text counts as a question', () => {
  it('on Enter: a text that starts like a question', () => {
    expect(looksLikeQuestion('Was nehme ich für Regen mit')).toBe(true);
    expect(looksLikeQuestion('what should I take for rain')).toBe(true);
    expect(looksLikeQuestion('Regenjacke gelb')).toBe(false);
    expect(looksLikeQuestion('wiegen')).toBe(false);
  });
});

describe('empty credit (Noah 18.10.2026 «1a und … erlischt das feld in der app überall»)', () => {
  const reply = (status, body) => async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  beforeEach(async () => {
    await appDb.meta.delete(CREDIT_KEY);
    await appDb.settings.put({ key: HELPER_KEY, value: { code: 'test-code-not-real', show: true, capChf: 2, capV: 2 } });
    Object.assign(helper, { code: 'test-code-not-real', show: true, credit: null });
  });
  it('a 402 no_credit hides the helper everywhere, says the sentence once, and asks nothing more', async () => {
    expect(isOn()).toBe(true);
    const r = await ask('trip', {}, { fetchFn: reply(402, { code: 'no_credit', credit: 'empty' }) });
    expect(r).toEqual({ ok: false, error: 'no_credit' });
    expect(noCredit()).toBe(true);
    expect(isOn()).toBe(false);
    expect(isShown()).toBe(false);
    expect((await appDb.meta.get(CREDIT_KEY)).value).toMatchObject({ empty: true });
    expect(errorText('no_credit')).toBe('The AI credit is used up. Everything else works as usual.');
    await creditTold();
    await ask('trip', {}, { fetchFn: reply(402, { code: 'no_credit', credit: 'empty' }) });
    expect(helper.credit).toMatchObject({ empty: true, told: true });
    let asked = false;
    expect(await ask('search', {}, { fetchFn: async () => ((asked = true), new Response('{}')) })).toEqual({ ok: false, error: 'no_credit' });
    expect(asked).toBe(false);
  });
  it('comes back by itself once a status with probe says the credit is back', async () => {
    await ask('trip', {}, { fetchFn: reply(402, { code: 'no_credit', credit: 'empty' }) });
    await creditTold();
    let sent;
    const still = await ask('status', {}, { probe: true, fetchFn: async (u, init) => ((sent = JSON.parse(init.body)), new Response(JSON.stringify({ ok: true, credit: 'empty', spend: null }))) });
    expect(sent).toMatchObject({ task: 'status', probe: true });
    expect(still.ok).toBe(true);
    expect(noCredit()).toBe(true);
    await ask('status', {}, { probe: true, fetchFn: reply(200, { ok: true, credit: 'ok', spend: null }) });
    expect(noCredit()).toBe(false);
    expect(isOn()).toBe(true);
    // a next empty time says the sentence again
    await ask('trip', {}, { fetchFn: reply(402, { code: 'no_credit', credit: 'empty' }) });
    expect(helper.credit.told).toBeUndefined();
  });
});

