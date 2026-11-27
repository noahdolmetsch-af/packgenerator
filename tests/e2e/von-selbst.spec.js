// «Von selbst» (Noah 19.11.2026 «1-5a», Thread «Training erfassen vereinfachen», T3): a new Strava activity asks «Wie war's?» at the top of
// Aktiv in three words (leicht, gut, hart) or «Später», for every sport; the old 1–10 stays readable. Fictional data only; German UI.
// SHOTS=<folder> saves pictures (Handy 390 / Computer 1440).
import { test, expect } from './clock.js';
import { ready } from './settle.js';
import DE from '../../src/lib/i18n/de/index.js';

const SHOTS = process.env.SHOTS || '';
const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
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

// Noah 21.11.2026: the same for a workout the watch recorded (Fitbit via Google Health, healthDays.exercises)
const putTable = (page, table, rec) =>
  page.evaluate(
    ([tb, r]) =>
      new Promise((ok, bad) => {
        const o = indexedDB.open('pack-generator');
        o.onsuccess = () => {
          const tx = o.result.transaction(tb, 'readwrite');
          tx.objectStore(tb).put(r);
          tx.oncomplete = () => (o.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
        o.onerror = () => bad(o.error);
      }),
    [table, rec],
  );
const readSetting = (page, key) =>
  page.evaluate(
    (k) =>
      new Promise((ok, bad) => {
        const o = indexedDB.open('pack-generator');
        o.onsuccess = () => {
          const q = o.result.transaction('settings').objectStore('settings').get(k);
          q.onsuccess = () => (o.result.close(), ok(q.result?.value ?? null));
          q.onerror = () => bad(q.error);
        };
      }),
    key,
  );
const fitRun = { type: 'RUNNING', name: 'Beispiel-Lauf', start: '06:40', end: '07:28', min: 48, km: 8.4, hr: 150, kcal: 520, azm: 41, hm: 55 };

test('a workout of the watch asks «Wie war’s?» like Strava, with more facts; the word is kept and the card is gone', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);
  await putTable(page, 'healthDays', { date: day(0), exercises: [fitRun] });
  await openAktiv(page);
  const ask = page.locator('[data-section="feel-ask"]');
  await expect(ask).toBeVisible();
  await expect(ask).toContainText(DE['New from Fitbit|feel']);
  await expect(ask).toContainText('Beispiel-Lauf');
  await expect(ask).toContainText('8.4 km');
  await expect(ask).toContainText('48 Min');
  await expect(ask).toContainText('Tempo 5:43 min/km');
  await expect(ask).toContainText('55 m hoch');
  await expect(ask).toContainText('Ø Puls 150');
  await expect(ask).toContainText('41 Zonenminuten');
  await expect(ask).toContainText('520 kcal');
  await shot(page, info, 'von-selbst-fitbit');
  await ask.locator('[data-feel-word="hard"]').click();
  await expect(ask).toHaveCount(0);
  const kept = await readSetting(page, 'training.healthfeel');
  expect(kept).toEqual({ v: 1, map: { [`${day(0)}|06:40|RUNNING`]: { w: 'hard' } } });
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-section="feel-ask"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a workout that Strava has as well is asked once (by Strava); «Später» on a watch workout asks no more', async ({ page, context }) => {
  await start(page, context);
  await putTable(page, 'healthDays', { date: day(0), exercises: [fitRun, { ...fitRun, type: 'WEIGHTS', name: 'Beispiel-Gym', start: '18:00', end: '18:45', min: 45, km: undefined }] });
  await put(page, run({ id: '8010', name: 'Beispiel-Strava-Lauf', time: '06:45', movingS: 2850 }));
  await openAktiv(page);
  const ask = page.locator('[data-section="feel-ask"]');
  const rows = ask.locator('[data-feel-row]');
  // the open ones stand as a small list, newest first: the evening gym workout (only on the watch), then Strava's own run; the watch copy of the run is not asked
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText('Beispiel-Gym');
  await expect(rows.nth(1)).toContainText(DE['New from Strava|feel']);
  await expect(rows.nth(1)).toContainText('Beispiel-Strava-Lauf');
  await rows.nth(0).locator('[data-feel-skip]').click();
  await expect(rows).toHaveCount(1);
  await expect(rows.nth(0)).toContainText('Beispiel-Strava-Lauf');
  await rows.nth(0).locator('[data-feel-word="good"]').click();
  await expect(ask).toHaveCount(0);
  expect((await readSetting(page, 'training.healthfeel')).map[`${day(0)}|18:00|WEIGHTS`]).toEqual({ skip: true });
});

// Noah 27.11.2026 «2a 3b»: the open ones as a small list (three, then «n weitere zeigen»); every answer shows «Gespeichert» with Undo
test('four open workouts: three are shown, the rest behind a button; an answer shows Undo that takes it back', async ({ page, context }) => {
  await start(page, context);
  const rowsOf = (n) => Array.from({ length: n }, (_, i) => ({ ...fitRun, type: 'TENNIS', name: `Beispiel-Tennis ${i + 1}`, start: `${String(8 + i * 2).padStart(2, '0')}:00`, end: `${String(9 + i * 2).padStart(2, '0')}:00`, min: 50, km: undefined }));
  await putTable(page, 'healthDays', { date: day(0), exercises: rowsOf(4) });
  await openAktiv(page);
  const ask = page.locator('[data-section="feel-ask"]');
  const rows = ask.locator('[data-feel-row]');
  await expect(rows).toHaveCount(3);
  await expect(ask.locator('[data-feel-more]')).toHaveText(DE['Show {n} more'].replace('{n}', '1'));
  await ask.locator('[data-feel-more]').click();
  await expect(rows).toHaveCount(4);
  await expect(ask.locator('[data-feel-more]')).toHaveCount(0);
  await rows.nth(0).locator('[data-feel-word="good"]').click();
  await expect(rows).toHaveCount(3);
  const toast = page.locator('.rtoast');
  await expect(toast).toContainText(DE['Kept: {word}.'].replace('{word}', DE['good|feel']));
  await toast.getByRole('button', { name: T('Undo') }).click();
  await expect(rows).toHaveCount(4);
  expect(await readSetting(page, 'training.healthfeel')).toBeNull(); // taken back: nothing is kept
});
