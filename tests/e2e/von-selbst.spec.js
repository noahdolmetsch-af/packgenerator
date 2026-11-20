// «Von selbst» (Noah 19.11.2026 «1-5a», Thread «Training erfassen vereinfachen», T3): a new Strava activity asks «Wie war's?» at the top of
// Aktiv in three words (leicht, gut, hart) or «Später», for every sport; the old 1–10 stays readable. Fictional data only; German UI.
// SHOTS=<folder> saves pictures (Handy 390 / Computer 1440).
import { test, expect } from './clock.js';
import { ready } from './settle.js';
import DE from '../../src/lib/i18n/de/index.js';

const SHOTS = process.env.SHOTS || '';
const zurichToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${zurichToday()}T12:00:00Z`));

async function start(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.goto('./');
  await ready(page);
}
const put = (page, rec) =>
  page.evaluate(
    (r) =>
      new Promise((ok, bad) => {
        const o = indexedDB.open('pack-generator');
        o.onsuccess = () => {
          const tx = o.result.transaction('activities', 'readwrite');
          tx.objectStore('activities').put(r);
          tx.oncomplete = () => (o.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
        o.onerror = () => bad(o.error);
      }),
    rec,
  );
const read = (page, id) =>
  page.evaluate(
    (i) =>
      new Promise((ok, bad) => {
        const o = indexedDB.open('pack-generator');
        o.onsuccess = () => {
          const q = o.result.transaction('activities').objectStore('activities').get(i);
          q.onsuccess = () => (o.result.close(), ok(q.result));
          q.onerror = () => bad(q.error);
        };
      }),
    id,
  );
const run = (over = {}) => ({ id: '8001', name: 'Beispiel-Morgenrunde', type: 'Run', kind: 'run', day: day(0), time: '07:10', km: 8.2, hm: 60, movingS: 2760, hrAvg: 148, hist: null, ...over });
async function openAktiv(page) {
  await page.goto('./#/flow');
  await page.reload(); // Dexie keeps its own cache: the row written straight into IndexedDB shows after a load
  await ready(page);
}
async function shot(page, info, name) {
  if (!SHOTS) return;
  const w = info.project.name === 'phone' ? 390 : 1440;
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${SHOTS}/${name}-${w}.png` });
}

test('a new run asks «Wie war’s?» at the top of Aktiv; a word is kept and the card is gone', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);
  await put(page, run());
  await openAktiv(page);
  const ask = page.locator('[data-section="feel-ask"]');
  await expect(ask).toBeVisible();
  await expect(ask).toContainText(DE['New from Strava|feel']);
  await expect(ask).toContainText('Beispiel-Morgenrunde');
  await expect(ask).toContainText('8.2 km');
  await expect(ask).toContainText('46 Min');
  await expect(ask).toContainText('Ø Puls 148');
  await expect(ask.locator('[data-feel-word]')).toHaveText([DE['light|feel'], DE['good|feel'], DE['hard|feel']]);
  await expect(ask.locator('[data-feel-skip]')).toHaveText(DE['Later|feel']);
  await shot(page, info, 'von-selbst-karte');
  await ask.locator('[data-feel-word="good"]').click();
  await expect(ask).toHaveCount(0);
  const saved = await read(page, '8001');
  expect(saved.feelWord).toBe('good');
  expect(saved.feel ?? null).toBeNull();
  expect(errors).toEqual([]);
});

test('every sport is asked, not only rides; «Später» asks no more for that activity', async ({ page, context }) => {
  await start(page, context);
  await put(page, run({ id: '8002', name: 'Beispiel-Yoga', type: 'Yoga', kind: 'other', km: 0, hm: 0, hrAvg: null, movingS: 3000 }));
  await openAktiv(page);
  const ask = page.locator('[data-section="feel-ask"]');
  await expect(ask).toContainText('Beispiel-Yoga');
  await ask.locator('[data-feel-skip]').click();
  await expect(ask).toHaveCount(0);
  expect((await read(page, '8002')).feelSkip).toBe(true);
  expect((await read(page, '8002')).feelWord ?? null).toBeNull();
});

test('old answers stay: an activity with 1–10 or Strava’s own answer is not asked; the page of the ride shows both ways', async ({ page, context }) => {
  await start(page, context);
  await put(page, run({ id: '8003', name: 'Alt mit Zahl', feel: 7 }));
  await put(page, run({ id: '8004', name: 'Alt von Strava', rpe: 4, day: day(-1) }));
  await openAktiv(page);
  await expect(page.locator('[data-section="feel-ask"]')).toHaveCount(0);
  await page.goto('./#/flow/training/a/8003');
  const box = page.locator('[data-section="feel"]');
  await expect(box.locator('[data-feel="7"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(box.locator('[data-feel-word]')).toHaveCount(3);
  // a word on the page of the ride replaces the number (never both)
  await box.locator('[data-feel-word="light"]').click();
  await expect(box.locator('[data-feel-word="light"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(box.locator('[data-feel="7"]')).toHaveAttribute('aria-pressed', 'false');
  const row = await read(page, '8003');
  expect(row).toMatchObject({ feelWord: 'light', feel: null });
  // the same word again takes the answer back, the activity may be asked again
  await box.locator('[data-feel-word="light"]').click();
  expect((await read(page, '8003')).feelWord ?? null).toBeNull();
});
