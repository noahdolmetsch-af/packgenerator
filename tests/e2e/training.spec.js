// «Training» TR1–TR4 (Noah 13.10.2026 «1-5a», «tr1-4 ok»): the tile «Letzte Aktivität» on Today, Aktiv ›
// Training with every Strava activity and its zones, one activity, own zones. The server
// (packgen-three.vercel.app/api/strava) and the Strava login are answered by the test; everything else
// outside the preview server is blocked. Fictional activities only.
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
const shot = async (page, info, name) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
};
// calendar days in Zurich (never now + n × 24 h)
const zurichToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${zurichToday()}T12:00:00Z`));

const gear = [{ id: 'g1', name: `${P}Gravel Blau`, km: 6142, primary: true, retired: false }];
const act = (id, f) => ({ id, name: `${P}Runde ${id}`, type: 'GravelRide', start: `${f.d}T06:00:00Z`, startLocal: `${f.d}T${f.at ?? '08:00'}:00Z`, km: 42.3, hm: 680, movingS: 6120, elapsedS: 6500, gearId: 'g1', device: '', commute: false, trainer: false, hrAvg: 138, hrMax: 171, ...f });
const ACTS = [
  act('2001', { d: day(-1), at: '17:05', name: `${P}Abendrunde`, wAvg: 188, wMax: 612, wDevice: true }),
  act('2002', { d: day(-3), name: `${P}Lauf am See`, type: 'Run', km: 9.1, hm: 85, movingS: 2880, elapsedS: 2900, gearId: null, hrAvg: 149 }),
  act('2003', { d: day(-5), name: `${P}Wanderung`, type: 'Hike', km: 14.2, hm: 980, movingS: 14700, gearId: null, hrAvg: null, hrMax: null }),
  act('2004', { d: day(-20), name: `${P}Abendrunde`, movingS: 6500, hrAvg: 141 }),
];
// Z1 10 min, Z2 30, Z3 15, Z4 5, Z5 1 with Strava's zones 115 / 135 / 150 / 165
const HIST = { 100: 600, 120: 1800, 140: 900, 155: 300, 170: 60 };
const ZONES = [{ min: 0, max: 115 }, { min: 115, max: 135 }, { min: 135, max: 150 }, { min: 150, max: 165 }, { min: 165, max: -1 }];

async function start(page, context, server) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
  await context.route(/packgen-three\.vercel\.app\/api\/strava/, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const url = new URL(req.url());
    const step = url.searchParams.get('step');
    server.log.push({ step, id: url.searchParams.get('id') });
    const body = (b) => route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ ok: true, ...b }) });
    if (step === 'start') return body({ url: 'https://www.strava.com/oauth/authorize?client_id=1&state=x' });
    if (step === 'status') return body({ connected: true, athlete: { firstname: 'Beispiel' } });
    if (step === 'gear') return body({ bikes: gear });
    if (step === 'activities') return body({ page: 1, more: false, activities: ACTS });
    if (step === 'zones') return body({ hr: ZONES, custom: false });
    if (step === 'detail') return body({ id: url.searchParams.get('id'), kcal: 890, hist: HIST, curve: [[0, 110], [20, 128], [40, 141], [60, 150], [80, 166], [102, 131]], w20: 231 });
    return route.fulfill({ status: 400, headers: cors, body: '{}' });
  });
  await context.route(/www\.strava\.com\/oauth\/authorize/, (route) =>
    route.fulfill({ status: 302, headers: { location: `${server.app}#/bikes?tab=care&view=strava&strava=connected&key=${P}key` } }),
  );
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.goto('./');
  await ready(page);
  await page.evaluate((b) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const tx = r.result.transaction('bikes', 'readwrite');
      tx.objectStore('bikes').put(b);
      tx.oncomplete = () => (r.result.close(), ok());
    };
  }), { id: `${P}gb`, name: `${P}Gravel Blau`, type: 'Gravel bike', slots: [], setup: {}, fixtures: [], km: 6000 });
  await page.reload();
  await ready(page);
  await page.goto('./#/bikes?tab=care&view=strava');
  await page.getByRole('button', { name: 'Mit Strava verbinden' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Alle Fahrten geholt' })).toBeVisible();
}

test('Training: the tile «Letzte Aktivität», every activity with its zones, one activity, own zones', async ({ page, context, baseURL }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const server = { log: [], app: baseURL };
  await start(page, context, server);
  // the zones once, the heart rate of the newest activities with heart rate (the hike has none)
  expect(server.log.filter((x) => x.step === 'zones').length).toBe(1);
  expect(server.log.filter((x) => x.step === 'detail').map((x) => x.id)).toEqual(['2001', '2002', '2004']);

  // TR1: on Today the newest activity, its numbers and its zones
  await page.goto('./#/');
  const tile = page.locator('[data-section="strava"]');
  await expect(tile).toContainText('Letzte Aktivität');
  await expect(tile).toContainText(`${P}Abendrunde`);
  await expect(tile).toContainText(`Gestern 17:05 · ${P}Gravel Blau · Grundlage`);
  await expect(tile.locator('.vals')).toContainText('1:42');
  await expect(tile.locator('.vals')).toContainText('42.3');
  await expect(tile.locator('.vals')).toContainText('680');
  await expect(tile.locator('.vals')).toContainText('138');
  await expect(tile.locator('[data-zones]')).toHaveAttribute('aria-label', /Z1 10 Min, Z2 30 Min, Z3 15 Min, Z4 5 Min, Z5 1 Min/);
  await expect(tile.locator('[data-strava-page]')).toHaveAttribute('href', '#/bikes?tab=care&view=strava');
  await shot(page, info, 'TR1');
  // release analysis P2: after a fetch with new rides the km per bike stay under the activity (a fictional last fetch)
  await expect(tile.locator('[data-fetch-km]')).toHaveCount(0); // the first fetch only counts what was there
  await page.evaluate((v) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const tx = r.result.transaction('settings', 'readwrite');
      tx.objectStore('settings').put({ key: 'strava.last', value: v });
      tx.oncomplete = () => (r.result.close(), ok());
    };
  }), { at: new Date().toISOString(), n: 3, km: 118.4, perBike: { [`${P}gb`]: { km: 80.2 } }, counts: {}, assigned: 3, check: 0, changes: 0 });
  await page.reload();
  await ready(page);
  await expect(tile.locator('[data-fetch-km]')).toHaveText(`+118 km · ${P}Gravel Blau +80`);

  // TR3: a tap opens the activity
  await tile.locator('[data-last-activity]').click();
  await expect(page.getByRole('heading', { level: 1, name: `${P}Abendrunde` })).toBeVisible();
  const values = page.locator('[data-section="values"]');
  await expect(values.locator('[data-val="moving"]')).toContainText('1:42');
  await expect(values.locator('[data-val="moving"]')).toContainText('Dauer in Bewegung');
  await expect(values.locator('[data-val="elapsed"]')).toContainText('1:48');
  await expect(values).toContainText('890');
  await expect(values).toContainText('171');
  // TR5: with a power meter the power values are in their own card «Leistung»
  await expect(values.locator('[data-power]')).toHaveCount(0);
  const power = page.locator('[data-section="power"]');
  await expect(power.locator('[data-power="avg"]')).toContainText('188 W');
  await expect(power.locator('[data-power="max"]')).toContainText('612 W');
  await expect(power.locator('[data-power="w20"]')).toContainText('231 W');
  await expect(power.locator('[data-power="w20"]')).toContainText('beste 20 Min');
  const zt = page.locator('[data-section="zone-time"]');
  await expect(zt.locator('li[data-zone]')).toHaveCount(5);
  await expect(zt.locator('li[data-zone="2"]')).toContainText('Grundlage');
  await expect(zt.locator('li[data-zone="2"]')).toContainText('115–134 Schläge');
  await expect(zt.locator('li[data-zone="2"]')).toContainText('30 Min');
  await expect(zt).toContainText('Grundlage (Z1–Z2) 66 % · intensiv (Z4–Z5) 10 %');
  await expect(page.locator('[data-section="curve"] svg')).toBeVisible();
  const same = page.locator('[data-section="same-route"]');
  await expect(same.locator('li')).toHaveCount(2);
  await expect(same.locator('li').first()).toContainText('schnellste');
  await page.locator('[data-note]').fill('Beine gut, Wind am Pass');
  await page.locator('[data-note]').blur();
  await expect(page.getByRole('link', { name: 'In Strava öffnen' })).toHaveAttribute('href', 'https://www.strava.com/activities/2001');
  await shot(page, info, 'TR3');

  // TR2: Aktiv › Training, every activity (the run and the hike too); a chip filters
  await page.goto('./#/flow/training?view=list');
  await expect(page.getByRole('heading', { level: 1, name: 'Training' })).toBeVisible();
  const rows = page.locator('[data-section="activities"] a[data-activity]');
  await expect(rows).toHaveCount(4);
  await expect(rows.first()).toContainText(`${P}Abendrunde`);
  await expect(page.locator('a[data-activity="2002"]')).toContainText('Laufen');
  await expect(page.locator('a[data-activity="2003"]')).toContainText('Wandern');
  await page.getByRole('button', { name: /Laufen 1/ }).click();
  await expect(rows).toHaveCount(1);
  await page.getByRole('button', { name: /Alle 4/ }).click();
  await expect(rows).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  await shot(page, info, 'TR2');

  // 3a: the zones from Strava, changeable; the minutes follow without a new call
  const zs = page.locator('[data-section="zones"]');
  await expect(page.getByText('deine Zonen aus Strava')).toBeVisible();
  await page.getByRole('button', { name: 'ändern' }).click();
  for (const [i, v] of [125, 145, 160, 175].entries()) await zs.locator(`[data-bound="${i}"]`).fill(String(v));
  await zs.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByText('deine eigenen Zonen')).toBeVisible();
  const details = server.log.filter((x) => x.step === 'detail').length;
  await page.locator('a[data-activity="2001"]').click();
  await expect(page.locator('[data-section="zone-time"] li[data-zone="1"]')).toContainText('40 Min');
  await expect(page.locator('[data-note]')).toHaveValue('Beine gut, Wind am Pass');
  expect(server.log.filter((x) => x.step === 'detail').length).toBe(details);
  expect(errors).toEqual([]);
});

test('Training › Woche: an optional goal, plan the week, «Wie letzte Woche», the look back', async ({ page, context, baseURL }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const server = { log: [], app: baseURL };
  await start(page, context, server);
  await page.goto('./#/flow/training');
  await expect(page.getByRole('button', { name: 'Woche', exact: true })).toHaveAttribute('aria-pressed', 'true');

  // the goal: all optional
  const goal = page.locator('[data-section="goal"]');
  // Impeccable runde 2: an hour goal, said apart from «Ziele»; «Woche planen» explains the + above the days
  await expect(goal).toContainText('Ein Stundenziel für dein Training?');
  await expect(goal).toContainText('Anders als unter «Ziele» zählt hier die Zeit');
  await expect(page.locator('#plan-h').locator('..')).toContainText('Tippe + bei einem Tag, um eine Einheit zu planen.');
  await goal.getByRole('button', { name: 'Ziel setzen' }).click();
  await goal.locator('[data-goal-name]').fill(`${P}Jura im Juni`);
  await goal.locator('[data-goal-hours]').fill('8');
  await goal.getByRole('button', { name: 'Speichern' }).click();
  await expect(goal).toContainText(`Ziel: ${P}Jura im Juni`);
  await expect(goal).toContainText('8 Std. pro Woche · 80 % in Z1–Z2');

  // plan a session today: dashed, with duration and zone
  const plan = page.locator('[data-section="week-plan"]');
  await plan.locator(`[data-add="${day(0)}"]`).click();
  const form = plan.locator('[data-session-form]');
  await form.locator('[data-session-name]').fill(`${P}Intervalle`);
  await form.locator('[data-session-mins]').fill('75');
  await form.locator('[data-session-zone]').selectOption('4');
  await form.getByRole('button', { name: 'Speichern' }).click();
  const chip = plan.locator('[data-planned]').filter({ hasText: `${P}Intervalle` });
  await expect(chip).toContainText('1:15');
  await expect(chip).toContainText('Z4');
  await expect(plan.locator('[data-week-range]')).toContainText('geplant 1:15 von 8:00 Std.');
  await shot(page, info, 'TR4');

  // the look back: six weeks, this week with the goal
  const back = page.locator('[data-section="look-back"]');
  await expect(back.locator('li[data-week]')).toHaveCount(6);
  await expect(back.locator('[data-this-week]')).toContainText('von 8:00 Std.');
  await expect(back).toContainText('mit Fitbit');

  // next week: «Wie letzte Woche» takes the plan over, a tap changes or removes a session
  await plan.getByRole('button', { name: 'Woche danach' }).click();
  await expect(plan.locator('[data-planned]')).toHaveCount(0);
  await plan.getByRole('button', { name: 'Wie letzte Woche (1 Einheit)' }).click();
  await expect(plan.locator('[data-planned]')).toHaveCount(1);
  await plan.locator('[data-planned]').click();
  await plan.locator('[data-session-form]').getByRole('button', { name: 'Entfernen' }).click();
  await expect(plan.locator('[data-planned]')).toHaveCount(0);
  await plan.getByRole('button', { name: 'Diese Woche' }).click();
  await expect(plan.locator('[data-planned]')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});
