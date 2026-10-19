// Paket P «Was mir gut tut» (Noah 19.10.2026): Ich › Was mir gut tut. With 30 fictional days of answers
// the results show with «Wie kommt die App darauf?»; start an experiment, add Neuland, tick the season
// switch, set a wished mix, rename a life phase. Fictional data only; nothing leaves the device.
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';
import { day } from './leistung-data.js';

const shot = async (page, info, name) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
};
const AREA = (qid) => qid.split('.')[0];
const KIND = { 'erholung.akku': 'scale', 'achtsamkeit.dank': 'scale', 'erreicht.zufrieden': 'scale', 'natur.draussen': 'chips', 'freunde.zeit': 'chips', 'achtsamkeit.moment': 'yesno' };
/** 30 days: every second day outside and with friends (day score 8), the others not (5); a mindful moment every third day. */
function answers() {
  const out = [];
  for (let i = 1; i <= 30; i++) {
    const d = day(-i);
    const on = i % 2 === 0;
    const add = (qid, value) => out.push({ id: `wohl-${qid}-${d}`, qid, area: AREA(qid), day: d, at: `${d}T20:00`, slot: null, kind: KIND[qid], value, note: null, unit: null, src: 'hand' });
    add('erreicht.zufrieden', on && i % 3 === 0 ? 9 : on ? 8 : 5);
    add('natur.draussen', on ? 'm90' : 'm0');
    add('freunde.zeit', on ? 'much' : 'no');
    add('achtsamkeit.moment', i % 3 === 0 ? 'yes' : 'no');
    if (i <= 4) out.push({ id: `wohl-dank-${d}`, qid: 'achtsamkeit.dank', area: 'achtsamkeit', day: d, at: `${d}T20:00`, slot: null, kind: 'scale', value: 7, note: `Kaffee am See ${i}`, unit: null, src: 'hand' });
  }
  const t0 = day(0);
  out.push({ id: `wohl-akku-${t0}`, qid: 'erholung.akku', area: 'erholung', day: t0, at: `${t0}T08:00`, slot: null, kind: 'scale', value: 3, note: null, unit: null, src: 'hand' });
  return out;
}
async function seed(page, rows) {
  await page.evaluate(
    (rows) =>
      new Promise((ok, bad) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const tx = r.result.transaction(['abAnswers'], 'readwrite');
          for (const x of rows) tx.objectStore('abAnswers').put(x);
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
      }),
    rows,
  );
}

test('Was mir gut tut: results with their source, experiment, Neuland, season, wish, phase', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.goto('./');
  await ready(page);

  // the way in: Ich › Was mir gut tut; empty first, it says how many days are still missing
  await page.goto('./#/me');
  await page.locator('[data-row="wohl"]').click();
  await expect(page.getByRole('heading', { level: 1, name: 'Was mir gut tut' })).toBeVisible();
  await expect(page.locator('[data-wohl-wait]')).toContainText('Noch 10 Tage mit Tagesbewertung');

  await seed(page, answers());
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-wohl-wait]')).toHaveCount(0);
  const helps = page.locator('[data-wohl-helps]');
  await expect(helps).toContainText('Tage mit «mind. 30 Min draussen»');
  await helps.locator('summary').first().click();
  await expect(helps).toContainText('Aus 30 Tagen mit Tagesbewertung');
  await expect(page.locator('[data-wohl-comfort]')).toContainText('Zeit draussen: 30–90 Min');
  await expect(page.locator('[data-wohl-recipe]')).toContainText('Deine guten Tage (15) hatten am häufigsten');
  // the jar of good moments and the morning suggestion (battery 3 today)
  await expect(page.locator('[data-wohl-jar]')).toContainText('Kaffee am See');
  await expect(page.locator('[data-wohl-jar]')).toContainText('4 Momente im Glas');
  await expect(page.locator('[data-wohl-morning]')).toContainText('Weil deine guten Tage oft');
  await shot(page, info, 'P-wohl');

  // a small experiment: the suggestion for 7 days
  await page.locator('[data-exp-suggest]').click();
  const exp = page.locator('[data-exp-sheet]');
  await expect(exp).toBeVisible();
  await exp.getByRole('button', { name: 'Start' }).click();
  await expect(page.locator('[data-wohl-exp]')).toContainText('Tag 1 von 7');

  // Neuland: add one and remove it again
  await page.locator('[data-neuland-add]').click();
  await page.getByRole('dialog').locator('input').fill('Seeweg zur alten Mühle');
  await page.getByRole('dialog').getByRole('button', { name: 'Speichern' }).click();
  const nl = page.locator('[data-wohl-neuland]');
  await expect(nl).toContainText('Seeweg zur alten Mühle');
  await nl.getByRole('button', { name: '«Seeweg zur alten Mühle» löschen' }).click();
  await expect(nl).not.toContainText('Seeweg zur alten Mühle');

  // season switch: tick the first point
  const season = page.locator('[data-wohl-season]');
  await season.locator('input[type="checkbox"]').first().check();
  await expect(season).toContainText(/1 von \d+ erledigt/);

  // wished mix
  await page.locator('[data-wish-edit]').click();
  const wish = page.locator('[data-wish-sheet]');
  await wish.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.locator('[data-wohl-wish] path.wish')).toHaveCount(9);

  // a life phase suggested by the app can be renamed
  const ph = page.locator('[data-wohl-phases] li').first();
  await ph.getByRole('button', { name: /umbenennen/ }).click();
  const sheet = page.locator('[data-phase-sheet]');
  await sheet.locator('input[type="text"]').fill('Herbst der langen Touren');
  await sheet.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.locator('[data-wohl-phases]')).toContainText('Herbst der langen Touren');

  // no sideways scrolling on a phone
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

// Paket P after C (Noah «2 beides», «3a», #221): on Heute the tile «Deine Werte heute»; the Abend-Check window
// shows today's ride in km, Hm and pulse. Fictional data (home0460-fixture.js: Friday 9 October 2026).
test('Was mir gut tut on Heute: the values tile and the ride in the evening check', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const { openHome, D0 } = await import('./home0460-fixture.js');
  await openHome(page, context, info, { hour: 9 });
  await expect(page.locator('[data-tile="values"] [data-data-widget]')).toBeVisible();
  await expect(page.locator('[data-tile="values"]')).toContainText('Deine Werte heute');
  await page.evaluate(
    (d) =>
      new Promise((ok, bad) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const tx = r.result.transaction(['kmBook'], 'readwrite');
          tx.objectStore('kmBook').put({ id: 'wohl-ride-1', bikeId: 'bike-test', date: d, kind: 'ride', km: 42.5, hm: 610, hrAvg: 131, state: 'ok' });
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
      }),
    D0,
  );
  await page.clock.setFixedTime(new Date(`${D0}T20:45:00+02:00`));
  await page.reload();
  const win = page.locator('dialog[data-section="abfragen"][data-round="evening"]');
  await expect(win).toHaveJSProperty('open', true);
  await expect(win.locator('[data-check-ride]')).toContainText('Heute auf dem Velo: 42.5 km · 610 Hm · Puls 131');
  await expect(win.locator('[data-check-ride]')).toContainText('610 Hm');
  await expect(win.locator('[data-check-ride]')).toContainText('Puls 131');
  await shot(page, info, 'P-abend-check');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  expect(errors).toEqual([]);
});
