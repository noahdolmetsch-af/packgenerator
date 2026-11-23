// «Form und Erholung klüger» (Noah 23.11.2026 «ja»): one answer for today from all values, «Was auffällt» right under it
// (HRV and sleep too), the tour readiness only when a tour is near (never the made-up examples), years without rides in a fold.
// Fictional days only; the clock stands on Friday 9 October 2026; German UI, phone + desktop. SHOTS=<folder> saves pictures.
import { test, expect } from '@playwright/test';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const SHOTS = process.env.SHOTS || '';
const P = 'test_data_fk_';

/** 40 normal days (HRV 46–49, sleep 7 h 30, resting pulse 50), today HRV 26 and 3 h 55 sleep; rides 10+ days ago, so the form is fresh. */
function rows(extra = {}) {
  const healthDays = [];
  for (let i = 0; i < 40; i++) {
    const date = addDays(TODAY, -i);
    const bad = i === 0;
    healthDays.push({ date, restingHr: 50 + (i % 2), hrvMs: bad ? 26 : 46 + (i % 4), steps: 8000, sleep: { asleepMin: bad ? 235 : 450 + (i % 3) * 5, deepMin: 70, remMin: 90, lightMin: 230, awakeMin: 25, start: '23:05', end: '06:55', efficiency: 90 }, src: 'google', at: `${date}T08:00:00Z` });
  }
  const act = (id, day) => ({
    id: `${P}${id}`, day, time: '07:10', start: `${day}T05:10:00Z`, name: `${P}${id}`, type: 'Ride', kind: 'bike', km: 40, hm: 400, movingS: 5400, elapsedS: 5700, gearId: null,
    hrAvg: 135, hrMax: 160, commute: false, trainer: false, wAvg: null, wMax: null, wDevice: false, spdAvg: null, spdMax: null, cad: 84, hist: { 120: 2700, 150: 2700 },
    tempAvg: 8, wNorm: null, kj: null, effort: 80, line: null, workout: null, prs: 0, achv: 0, elevHigh: null, elevLow: null, kcal: 900,
  });
  const activities = [];
  for (let i = 12; i < 70; i += 3) activities.push(act(`r${i}`, addDays(TODAY, -i)));
  return { healthDays, activities, ...extra };
}

async function open(page, context, data) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/flow');
  await ready(page);
  await put(page, data);
  await page.goto('./#/flow/form');
  await page.reload();
  await ready(page);
  return errors;
}
const shot = async (page, info, name) => {
  if (!SHOTS) return;
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
};

test('Form klüger: good form but low HRV and a short night → rest, with the reasons; «Was auffällt» right under it', async ({ page, context }, info) => {
  const errors = await open(page, context, rows());
  const answer = page.locator('[data-form-now]');
  await expect(answer.locator('[data-form-answer]')).toHaveAttribute('data-form-answer', 'rest');
  await expect(answer.locator('[data-form-answer-line]')).toContainText('Heute Ruhe oder eine lockere halbe Stunde');
  const why = answer.locator('[data-form-why]');
  await expect(why).toHaveCount(3);
  await expect(answer).toContainText('HRV');
  await expect(answer).toContainText('3 h 55');
  await expect(answer).toContainText('Deine Form ist gut, aber diese Werte wiegen heute mehr');
  // «Was auffällt» looks at HRV and sleep and stands right under the answer, before «Was heute zählt»
  const card = page.locator('[data-auffaellt]');
  await expect(card).toHaveAttribute('data-auffaellt-state', 'up');
  await expect(card.locator('[data-auffaellt-hit="hrv"]')).toContainText('unter deinem Normal');
  await expect(card.locator('[data-auffaellt-hit="sleep"]')).toContainText('3 h 55');
  await expect(card.locator('[data-auffaellt-hit="rhr"]')).toHaveCount(0);
  await expect(card).not.toContainText('Nichts fällt auf');
  const yAnswer = (await answer.boundingBox()).y;
  const yCard = (await card.boundingBox()).y;
  const yParts = (await page.locator('[data-form-parts]').boundingBox()).y;
  expect(yAnswer).toBeLessThan(yCard);
  expect(yCard).toBeLessThan(yParts);
  await shot(page, info, 'antwort-ruhe');
  await page.locator('[data-ww-more] summary').click();
  await expect(page.locator('[data-ww-table]')).toBeVisible();
  await shot(page, info, 'wenn-offen');
  // the marker window gets today
  await (info.project.name === 'phone' ? card.locator('[data-auffaellt-mark]').tap() : card.locator('[data-auffaellt-mark]').click());
  await expect(page.locator('dialog[open] [data-marker-from]')).toHaveValue(TODAY);
  expect(errors).toEqual([]);
});

test('Form klüger: a calm day says so for all three values; Verlauf starts with the form alone', async ({ page, context }, info) => {
  const calm = rows();
  calm.healthDays = calm.healthDays.map((d, i) => (i === 0 ? { ...d, hrvMs: 48, sleep: { ...d.sleep, asleepMin: 450 } } : d));
  const errors = await open(page, context, calm);
  await expect(page.locator('[data-form-answer]')).not.toHaveAttribute('data-form-answer', 'rest');
  const card = page.locator('[data-auffaellt]');
  await expect(card).toHaveAttribute('data-auffaellt-state', 'none');
  await expect(card.locator('[data-auffaellt-text]')).toContainText('Nichts fällt auf: Ruhepuls, HRV und Schlaf');
  const ch = page.locator('[data-chart="formweeks"]');
  await expect(ch.locator('[data-layer="form"]')).toHaveAttribute('aria-pressed', 'true');
  for (const k of ['fit', 'fat', 'rhr']) await expect(ch.locator(`[data-layer="${k}"]`)).toHaveAttribute('aria-pressed', 'false');
  await expect(ch.locator('svg.bars')).toBeVisible();
  await ch.locator('[data-layer="fit"]').click();
  await expect(ch.locator('svg.lines path')).toHaveCount(1);
  await shot(page, info, 'antwort-ruhig');
  expect(errors).toEqual([]);
});

test('Form klüger: the tour readiness only with a real tour within 7 days, never for the made-up examples', async ({ page, context }, info) => {
  const example = { id: 'ex-trip', title: 'Jura-Runde (Beispiel)', startDate: addDays(TODAY, 2), days: 2, status: 'planned', entries: [], createdAt: `${TODAY}T07:00:00Z` };
  const errors = await open(page, context, rows({ trips: [example] }));
  await expect(page.locator('[data-form-curve]')).toBeVisible();
  await expect(page.locator('[data-form-tours]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Tour-Bereitschaft' })).toHaveCount(0);
  // a real tour in 3 days: the section is there, without the example
  await put(page, { trips: [{ id: `${P}tour`, title: `${P}Tour`, startDate: addDays(TODAY, 3), days: 3, status: 'planned', entries: [], createdAt: `${TODAY}T07:00:00Z` }] });
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-form-tours]')).toBeVisible();
  await expect(page.locator('[data-tour-now]')).toContainText(`${P}Tour`);
  await expect(page.locator('[data-form-tours]')).not.toContainText('Beispiel');
  await shot(page, info, 'tour-bereitschaft');
  expect(errors).toEqual([]);
});

test('Form klüger: years without rides stand in one closed line, with their values', async ({ page, context }) => {
  const old = [];
  for (let i = 0; i < 25; i++) old.push({ date: `2022-06-${String(i + 1).padStart(2, '0')}`, restingHr: 53, src: 'google', at: `2022-06-${String(i + 1).padStart(2, '0')}T08:00:00Z` });
  const data = rows();
  data.healthDays = [...data.healthDays, ...old];
  const errors = await open(page, context, data);
  const card = page.locator('[data-vergleich]');
  await expect(card.locator('[data-vergleich-year="2022"]')).toHaveCount(0);
  const fold = card.locator('[data-vergleich-empty-years]');
  await expect(fold).toBeVisible();
  await expect(fold.locator('summary')).toContainText('Jahre ohne Fahrten');
  await expect(fold.locator('summary')).toContainText('2022');
  await fold.locator('summary').click();
  await expect(fold.locator('[data-vergleich-empty-year="2022"]')).toContainText('Ruhepuls 53');
  expect(errors).toEqual([]);
});
