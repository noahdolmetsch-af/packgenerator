// «Touren-Liste aufräumen» (Noah 23.11.2026 «was fällt dir hier auf», «ja»): compact rows with the values behind an arrow,
// no empty values and short times, the made-up examples out of the list, doubled trips suggested and joined (nothing
// deleted, «Wieder trennen» brings them back), the open debriefs once at the top. German UI, phone 390 and computer 1440,
// fictional data (sn4plus-fixture.js plus three copies of one trip and the two examples of the first start).
// With SHOTS=/path the test saves screenshots there (for the pull request); without it, none.
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { sn4plusData, P, D0, day } from './sn4plus-fixture.js';
import { openData, settle } from './settle.js';
import { openShort } from './kurz-open.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const SHOTS = process.env.SHOTS;
const shot = async (page, info, name, locator = null) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  const path = `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`;
  await (locator ?? page).screenshot(locator ? { path } : { path, fullPage: true });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

const TWIN = 'Feierabendrunde See 8.10.';
function data() {
  const d = sn4plusData();
  const T0 = d.tables;
  const src = T0.trips.find((x) => x.status === 'done' && x.bikeId === 'bike-road');
  const twin = (id, n, o = {}) => ({ ...src, id: `${P}${id}`, title: TWIN, startDate: day(-30), days: 1, status: 'done', noDebrief: false, createdAt: `${day(-30)}T0${n}:00:00.000Z`, entries: src.entries.slice(0, n * 3).map((e, i) => ({ ...e, packed: i % 2 === 0 })), ...o });
  T0.trips.push(twin('twin1', 5), twin('twin2', 7), twin('twin3', 6));
  // the middle one has the Rückblick: the app suggests it to stay
  T0.debriefs.push({ tripId: `${P}twin2`, status: 'done', amount: 'much', bags: 'fine', applied: [], missing: [], note: '', createdAt: `${day(-29)}T09:00:00.000Z`, updatedAt: `${day(-29)}T09:00:00.000Z` });
  // the two made-up examples of the first start
  const ex = (id, title, o) => ({ ...src, id, title, startDate: day(-60), days: 1, status: 'done', createdAt: `${day(-60)}T08:00:00.000Z`, entries: [], ...o });
  T0.trips.push(ex('ex-past', 'Seerunde (Beispiel)', {}), ex('ex-trip', 'Jura-Runde (Beispiel)', { startDate: day(-50) }));
  return d;
}
const DATA = data();
const TWINS = [`${P}twin1`, `${P}twin2`, `${P}twin3`];

async function start(page, context, info) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/touren-aufraeumen-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(DATA));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.setFixedTime(new Date(`${D0}T10:00:00+02:00`));
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('dialog', (x) => x.accept());
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel('Backup importieren').setInputFiles(file);
  await panel.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  await page.goto('./#/trips');
  await openShort(page);
  await expect(page.locator('[data-trip-list] [data-row]').first()).toBeVisible();
  return errors;
}
const rows = (page) => page.locator('[data-trip-list] li[data-row]');
const twins = (page) => page.locator('[data-trip-list] li[data-row]').filter({ has: page.getByRole('link', { name: TWIN, exact: true }) });
const finished = (page) => page.locator('section[data-finished]');

test('a) one compact line per trip: the values open behind the arrow, no empty values, short times', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const row = rows(page).filter({ has: page.getByRole('link', { name: 'Herbsttour Hochland', exact: true }) });
  await expect(row.locator('[data-row-stats]')).toContainText('km');
  await expect(row.locator('[data-values]')).toHaveCount(0);
  await expect(row.locator('[data-rate]')).toHaveCount(0);
  // never «0 km», never a lone dash on a closed row
  for (const t of await finished(page).locator('[data-row-stats]').allTextContents()) {
    expect(t).not.toMatch(/(^|·\s)0 km/);
    expect(t).not.toMatch(/(^|·\s)–/);
  }
  await shot(page, info, 'liste-kompakt', finished(page));
  await row.locator('[data-row-toggle]').click();
  await expect(row.locator('[data-row-toggle]')).toHaveAttribute('aria-expanded', 'true');
  await expect(row.locator('[data-values]')).toBeVisible();
  // a value without data is left out; times never read dd:hh:mm:ss
  await expect(row.locator('[data-values] dd').filter({ hasText: /^–$/ })).toHaveCount(0);
  for (const t of await row.locator('[data-values] dd').allTextContents()) expect(t).not.toMatch(/^\d\d:\d\d:\d\d:\d\d$/);
  await expect(row.locator('[data-values] dd').first()).toHaveText(/^(\d+ d( \d+ h)?|\d+ h( \d+ min)?|\d+ min|\d+ s)$/);
  await shot(page, info, 'zeile-offen', row);
  await row.locator('[data-row-toggle]').click();
  await expect(row.locator('[data-values]')).toHaveCount(0);
  // the name still opens the trip
  await row.getByRole('link', { name: 'Herbsttour Hochland', exact: true }).click();
  await expect(page).toHaveURL(/#\/tour\//);
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('b) the made-up examples stay out of the list, a quiet line shows them again', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await expect(finished(page).locator('[data-examples-line]')).toContainText(T('{n} made-up examples hidden', { n: 2 }));
  await expect(rows(page).filter({ hasText: '(Beispiel)' })).toHaveCount(0);
  await finished(page).locator('[data-examples-toggle]').click();
  await expect(rows(page).filter({ hasText: '(Beispiel)' })).toHaveCount(2);
  await expect(finished(page).locator('[data-examples-line]')).toContainText(T('The made-up examples are shown.'));
  await finished(page).locator('[data-examples-toggle]').click();
  await expect(rows(page).filter({ hasText: '(Beispiel)' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('c) doubled trips are suggested, joined by choice, nothing deleted, and taken apart again', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await expect(twins(page)).toHaveCount(3);
  const all = await rows(page).count();
  const line = finished(page).locator('[data-doubles-line]');
  await expect(line).toContainText(T('{n} trips look doubled', { n: 2 }));
  await shot(page, info, 'doppelte-zeile', finished(page).locator('.sh').first());
  await line.locator('[data-doubles-open]').click();
  const sheet = page.locator('[data-doubles-sheet]');
  await expect(sheet).toBeVisible();
  const group = sheet.locator('[data-doubles] li.grp');
  await expect(group).toHaveCount(1);
  await expect(group).toContainText(TWIN);
  // the trip with the Rückblick is suggested to stay
  const radios = group.locator('input[type="radio"]');
  await expect(radios).toHaveCount(3);
  const withDebrief = group.locator('.mem li').filter({ hasText: T('Debrief written') });
  await expect(withDebrief).toHaveCount(1);
  await expect(withDebrief.locator('input')).toBeChecked();
  await expect(group.locator('.mem li input:checked')).toHaveCount(1);
  await shot(page, info, 'doppelte-fenster', sheet);
  // the choice is free: keep the first one instead
  await radios.nth(0).check();
  await expect(sheet.locator('[data-join-doubles]')).toHaveText(T('Join: hide {n} trips', { n: 2 }));
  await withDebrief.locator('input').check();
  await sheet.locator('[data-join-doubles]').click();
  await expect(sheet.locator('[data-no-doubles]')).toBeVisible();
  await expect(sheet.locator('[data-joined]')).toContainText(TWIN);
  await sheet.getByRole('button', { name: T('Close'), exact: true }).click();
  // the list is clean: one of them is left, the line says what is hidden
  await expect(twins(page)).toHaveCount(1);
  await expect(rows(page)).toHaveCount(all - 2);
  await expect(finished(page).locator('[data-doubles-line]')).toContainText(T('{n} doubled trips hidden', { n: 2 }));
  // nothing was deleted
  const kept = await page.evaluate(async (ids) => {
    const db = await new Promise((ok) => (indexedDB.open('pack-generator').onsuccess = (e) => ok(e.target.result)));
    const get = (store, key) => new Promise((ok) => (db.transaction(store).objectStore(store).get(key).onsuccess = (e) => ok(e.target.result)));
    const out = [];
    for (const id of ids) out.push({ trip: await get('trips', id), debrief: await get('debriefs', id) });
    db.close();
    return out.map((x) => ({ has: !!x.trip, archived: !!x.trip?.archivedAt, debrief: x.debrief?.status ?? null }));
  }, TWINS);
  expect(kept.every((x) => x.has)).toBe(true);
  expect(kept.filter((x) => x.archived)).toHaveLength(2);
  // «Wieder trennen» brings them back
  await finished(page).locator('[data-doubles-open]').click();
  await page.locator('[data-doubles-sheet] [data-joined]').getByRole('button', { name: new RegExp(T('Take doubles apart')) }).click();
  await page.locator('[data-doubles-sheet]').getByRole('button', { name: T('Close'), exact: true }).click();
  await expect(twins(page)).toHaveCount(3);
  await expect(rows(page)).toHaveCount(all);
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('d) the open debriefs stand once: the tile on a computer, the line on a phone', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const go = page.locator('[data-counts] [data-waiting-go]');
  if (info.project.name === 'phone') {
    await expect(go).toBeVisible();
  } else {
    await expect(go).toHaveCount(0);
    await expect(page.locator('[data-tile="o2"]')).toBeVisible();
    // the tile hidden: the line comes back, so the way stays
    await page.locator('[data-tile="o2"]').getByRole('button', { name: /Mehr/ }).click();
    await page.getByRole('menuitem', { name: new RegExp(`^${T('Hide')}`) }).click();
    await expect(go).toBeVisible();
  }
  await expect(page.locator('[data-trip-list] [data-rate]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
