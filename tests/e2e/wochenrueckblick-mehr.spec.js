// «Wochenrückblick verbessern» (Noah 01.11.2026 «1a 2a 3c 4a 5c»): on a Sunday with no Strava ride yet, the week in
// review counts the minutes of Aktiv, shows the observations live, opens «Alle Zahlen dahinter», shows the new
// tiles (body, weather and appointments) and keeps a note and a goal with Undo. Fictional data written straight into
// IndexedDB; the browser runs in Europe/Zurich with a fixed clock. SHOTS=<dir> saves pictures (SCENARIO=full adds a ride).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const P = 'test_data_gtp_';
const TODAY = '2026-11-01'; // a Sunday
const MON = '2026-10-26';
const NOW = `${TODAY}T20:00:00+01:00`;
const addDays = (day, n) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const HIST = { 105: 2400, 125: 2400, 145: 600, 160: 120 };
const ride = (id, day, f = {}) => ({ id: `${P}${id}`, day, time: '08:00', start: `${day}T06:00:00Z`, name: `${P}Runde ${id}`, type: 'GravelRide', kind: 'bike', km: 42.3, hm: 610, movingS: 5400, elapsedS: 5700, gearId: 'g1', hrAvg: 132, hrMax: 165, commute: false, trainer: false, wAvg: null, wMax: null, wDevice: false, effort: 60, hist: HIST, ...f });

function rows() {
  const activities = [];
  for (let w = 1; w <= 5; w++) {
    activities.push(ride(`p${w}a`, addDays(MON, -7 * w + 1)), ride(`p${w}b`, addDays(MON, -7 * w + 5), { km: 61.5, movingS: 8100 }));
  }
  if (process.env.SCENARIO === 'full') activities.push(ride('w1', addDays(MON, 0), { km: 38.4, hm: 420, movingS: 4800 }), ride('w2', addDays(MON, 2), { km: 55, movingS: 7000 }));
  const log = (id, actId, day, f = {}) => ({ id: `${P}${id}`, actId, day, at: `${day}T10:00:00.000Z`, n: 1, ...f });
  const flowLog = [log('m1', 'meditation', addDays(MON, 1), { min: 10 }), log('m2', 'meditation', addDays(MON, 3), { min: 15 }), log('m0', 'meditation', addDays(MON, -5), { min: 20 }), log('l1', 'yoga', addDays(MON, 2), { min: 45 }), log('l2', 'stretch', addDays(MON, 5), { min: 20 }), log('l3', 'sauna', addDays(MON, 4)), log('l4', 'sauna', addDays(MON, 5))];
  const healthDays = [];
  for (let i = -35; i <= 6; i++) {
    const date = addDays(MON, i);
    healthDays.push({ date, restingHr: i >= 0 ? 55 : 51, hrvMs: 62, sleep: { asleepMin: 410 + (i % 3) * 10, deepMin: i >= 0 ? 70 : 60, remMin: 95, lightMin: 245, awakeMin: 30 }, weightKg: i >= 0 ? 79.6 : 80.4, steps: 7000 + i * 20, azm: i >= 0 ? 8 : 14, src: 'test', at: NOW });
  }
  const days = {};
  for (let i = -30; i <= 5; i++) days[addDays(MON, i)] = { tmax: 12 + (i % 5), rainMm: i % 3 === 0 ? 4.2 : 0, sunH: i % 3 === 0 ? 1.5 : 5.5, lightH: 9.5 };
  const events = {};
  for (let i = 0; i <= 5; i++) events[addDays(MON, i)] = i % 2 ? 1 : 3;
  return {
    activities,
    flowLog,
    trips: [{ id: `${P}tour1`, title: 'Seenrunde (Beispiel)', startDate: addDays(MON, 5), days: 2, status: 'planned' }],
    healthDays,
    settings: [{ key: 'strava', value: { gear: [{ id: 'g1', name: 'Gravel (Beispiel)', km: 100, primary: true, retired: false }] } }],
    meta: [{ key: 'dayWeather', fetchedDay: TODAY, place: { lat: 47, lon: 8 }, days }, { key: 'dayEvents', days: events }],
  };
}

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.install({ time: new Date(NOW) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await expect(page.locator('main [data-week-glance]')).toBeVisible();
  return errors;
}
const put = (page, data) =>
  page.evaluate(async (data) => {
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('pack-generator');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    await new Promise((res, rej) => {
      const tx = db.transaction(Object.keys(data), 'readwrite');
      for (const [t, list] of Object.entries(data)) for (const x of list) tx.objectStore(t).put(x);
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  }, data);

test('Wochenrückblick: Aktiv minutes count, observations live on Sunday, the numbers behind them, new tiles, note and goal', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await put(page, rows());
  await page.goto('./#/flow/review');
  await page.reload();
  const main = page.locator('main');
  await expect(main.locator('[data-week]')).toHaveAttribute('data-week', MON);

  // the hours are the Aktiv minutes (45 + 20 min), not 0:00; the change names the same days
  const five = main.locator('[data-wr="five"]');
  await expect(five.locator('[data-five="hours"]')).toContainText('1:05');
  await expect(five.locator('[data-five="n"]')).toContainText('2');
  await expect(five).toContainText(T('Change against the same days of the week before. Hours: Strava plus the minutes you noted in Aktiv; km and Hm from Strava.'));

  // Sunday: shown from today's data, not frozen yet; each bar has its value
  await expect(main.locator('[data-obs-live]')).toBeVisible();
  const cards = main.locator('[data-obs]');
  expect(await cards.count()).toBeGreaterThan(0);
  await expect(main.locator('[data-wr="obs"]')).not.toContainText('100 % weniger');

  // looking ahead: the week is running, no «quiet week»
  await expect(main.locator('[data-wr="ahead"]')).toContainText(T('This week is still running. Your usual week has about {h} h.', { h: '' }).slice(0, 25));

  // the new tiles
  const body = main.locator('[data-wr="body"]');
  await expect(body.locator('[data-body="restingHr"]')).toContainText('55');
  await expect(body.locator('[data-body="restingHr"]')).toContainText('+4');
  await expect(body.locator('[data-body="steps"]')).toBeVisible();
  await expect(main.locator('[data-wr="outdoor"] [data-out-day]')).toHaveCount(7);
  if (process.env.SCENARIO === 'full') {
    await expect(main.locator('[data-wr="zones"] [data-zone]')).toHaveCount(5);
    await expect(main.locator('[data-wr="bikes"]')).toContainText('Gravel (Beispiel)');
  }

  // weight, meditation, tours and sleep phases
  const mine = main.locator('[data-wr="mine"]');
  await expect(mine.locator('[data-mine="weight"]')).toContainText('79.6');
  await expect(mine.locator('[data-mine="weight"]')).toContainText('0.8');
  await expect(mine.locator('[data-mine="meditation"]')).toContainText('25 min');
  await expect(mine.locator('[data-mine="tours"]')).toContainText('Seenrunde');
  const phases = main.locator('[data-wr="phases"]');
  await expect(phases.locator('[data-phase="deep"]')).toContainText('1:10');
  await expect(phases.locator('[data-phase="rem"]')).toBeVisible();
  await mine.locator('[data-tile-detail="weight"]').click();
  await expect(page.locator('[data-wd-week]')).toHaveCount(8);
  await expect(page.locator('[data-wd-head]')).toContainText('79.6 kg');
  await page.locator('[data-wd-how] a', { hasText: T('Back to the week in review') }).click();

  // the course behind a tile: eight weeks, every value written out, each week opens that week
  await body.locator('[data-tile-detail="restingHr"]').click();
  await expect(page).toHaveURL(/#\/flow\/review\/tile\?k=restingHr&w=2026-10-26$/);
  await expect(page.locator('[data-wd-week]')).toHaveCount(8);
  await expect(page.locator(`[data-wd-week="${MON}"]`)).toContainText('55 bpm');
  await expect(page.locator('[data-wd-head]')).toContainText('55 bpm');
  await expect(page.locator('[data-wd-table] tbody tr')).toHaveCount(8);
  await page.locator('[data-wd-how] a', { hasText: T('Back to the week in review') }).click();
  await expect(page).toHaveURL(/#\/flow\/review\?w=2026-10-26$/);

  // the numbers behind an observation
  await main.locator('[data-obs-detail]').first().click();
  await expect(page).toHaveURL(/#\/flow\/review\/obs\?kind=\w+&w=2026-10-26$/);
  await expect(page.locator('[data-od-table] tbody tr').first()).toBeVisible();
  await expect(page.locator('[data-od-how]')).toContainText(T('How it was worked out'));
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/wochenrueckblick-detail-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
  await page.locator('[data-od-how] a', { hasText: T('Back to the week in review') }).click();
  await expect(page).toHaveURL(/#\/flow\/review\?w=2026-10-26$/);

  // note and goal: kept after a reload, removable with Undo
  const note = main.locator('[data-wn-note]');
  await note.fill('Gute Woche, Beine müde.');
  await note.blur();
  await main.locator('[data-wn-next]').fill('Zwei Fahrten, eine lang');
  await main.locator('[data-wn-next]').blur();
  await page.reload();
  await expect(main.locator('[data-wn-note]')).toHaveValue('Gute Woche, Beine müde.');
  await expect(main.locator('[data-wn-next]')).toHaveValue('Zwei Fahrten, eine lang');
  await main.locator('[data-wn-note-del]').click();
  await expect(main.locator('[data-wn-note]')).toHaveValue('');
  await page.getByRole('button', { name: T('Undo') }).click();
  await expect(main.locator('[data-wn-note]')).toHaveValue('Gute Woche, Beine müde.');

  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/wochenrueckblick-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, 'no sideways scroll').toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});
