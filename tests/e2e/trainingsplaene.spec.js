// «Trainingspläne» (Noah 19.10.2026): Aktiv › Training › Trainingspläne, a sample plan written into the week
// plan backwards from a race day, taken out again, and «How hard was it?» after a ride. Fictional data only;
// everything outside the preview server is blocked.
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';
import DE from '../../src/lib/i18n/de/index.js';
import { PLAN_TEMPLATES } from '../../src/lib/training/plans.js';

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
const put = (page, store, rec) =>
  page.evaluate(
    ([s, r]) =>
      new Promise((ok, bad) => {
        const o = indexedDB.open('pack-generator');
        o.onsuccess = () => {
          const tx = o.result.transaction(s, 'readwrite');
          tx.objectStore(s).put(r);
          tx.oncomplete = () => (o.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
      }),
    [store, rec],
  );
const planSessions = (page) =>
  page.evaluate(
    () =>
      new Promise((ok) => {
        const o = indexedDB.open('pack-generator');
        o.onsuccess = () => {
          const g = o.result.transaction('settings').objectStore('settings').get('training.plan');
          g.onsuccess = () => (o.result.close(), ok(g.result?.value?.sessions ?? []));
        };
      }),
  );

test('a sample plan goes into the week plan and out again', async ({ page, context }) => {
  await start(page, context);
  await page.goto('./#/flow/plans');
  await expect(page.getByRole('heading', { level: 1, name: DE['Training plans'] })).toBeVisible();
  for (const p of PLAN_TEMPLATES) await expect(page.locator(`[data-plan="${p.id}"]`)).toContainText(DE[p.name]);

  await page.locator('[data-plan="multi"] a').click();
  await expect(page.getByRole('heading', { level: 1, name: DE['Multi-day race'] })).toBeVisible();
  const race = day(70);
  await page.getByRole('button', { name: DE['Back from the race day'], exact: true }).click();
  await page.locator('[data-plan-date]').fill(race);
  // Klick-Rundgang A03 (changed on purpose): weeks already past are only counted; the list starts this week
  const pastLine = page.locator('[data-weeks-past]');
  const past = (await pastLine.count()) ? Number((await pastLine.textContent()).match(/\d+/)[0]) : 0;
  await expect(page.locator('[data-section="plan-weeks"] li')).toHaveCount(12 - past);
  await expect(page.locator('[data-section="plan-typical"]')).toContainText(DE['Long ride, calm']);
  await page.locator('[data-plan-try]').click();
  await expect(page).toHaveURL(/#\/flow\/training$/);

  const sessions = await planSessions(page);
  expect(sessions.length).toBeGreaterThan(20);
  expect(sessions.filter((s) => !(s.src === 'tpl:multi' && s.day >= zurichToday() && s.day < race))).toEqual([]);
  expect(sessions.some((s) => s.name === DE['Long ride, calm'])).toBe(true);

  await page.goto('./#/flow/plans');
  await expect(page.locator('[data-section="plan-active"]')).toContainText(DE['Multi-day race']);
  await page.locator('[data-plan-out]').click();
  await expect(page.locator('[data-section="plan-active"]')).toHaveCount(0);
  expect(await planSessions(page)).toEqual([]);
});

test('own plan: copy, rename, delete with undo; a sample can be deleted and shown again', async ({ page, context }) => {
  await start(page, context);
  await page.goto('./#/flow/plans/short');
  await page.locator('[data-plan-copy]').click();
  await page.locator('[data-own-name]').fill('Mein Winterplan');
  await page.locator('[data-own-weeks]').fill('10');
  await page.getByRole('button', { name: DE.Save, exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Mein Winterplan' })).toBeVisible();
  await expect(page.locator('[data-section="plan-weeks"] li')).toHaveCount(10);

  await page.goto('./#/flow/plans');
  await page.locator('[data-plan-drop="first"]').click();
  await page.getByRole('dialog').getByRole('button', { name: DE.Delete, exact: true }).click();
  await expect(page.locator('[data-plan="first"]')).toHaveCount(0);
  await page.locator('[data-plan-unhide]').click();
  await expect(page.locator('[data-plan="first"]')).toHaveCount(1);
});

test('after a ride the app asks how hard it was', async ({ page, context }) => {
  await start(page, context);
  await put(page, 'activities', { id: '9001', name: 'Beispielrunde', type: 'Ride', kind: 'bike', day: day(-1), time: '17:00', km: 40, hm: 400, movingS: 5400, hist: null });
  await page.goto('./#/flow/training');
  await page.reload(); // Dexie keeps its own cache: the row written straight into IndexedDB shows after a load
  await ready(page);
  const ask = page.locator('[data-section="feel-ask"]');
  await expect(ask).toContainText(DE['How hard was your ride?']);
  await ask.locator('[data-feel="7"]').click();
  await expect(ask).toHaveCount(0);
  await page.goto('./#/flow/training/a/9001');
  await expect(page.locator('[data-section="feel"] [data-feel="7"]')).toHaveAttribute('aria-pressed', 'true');
});

test('coupled to a race: the plan takes its day and follows when it moves', async ({ page, context }) => {
  await start(page, context);
  const trip = { id: 'trip-race', title: 'Beispiel-Rennen', startDate: day(80), days: 4, domain: 'bike', status: 'planned', event: true };
  await put(page, 'trips', trip);
  await page.goto('./#/flow/plans/multi');
  await page.reload(); // Dexie keeps its own cache
  await ready(page);
  await expect(page.locator('[data-plan-race]')).toHaveValue('trip-race');
  await expect(page.locator('[data-plan-date]')).toHaveValue(day(80));
  await page.locator('[data-plan-try]').click();
  await expect(page).toHaveURL(/#\/flow\/training$/);

  await put(page, 'trips', { ...trip, startDate: day(87) });
  await page.goto('./#/flow/plans');
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-plan-for]')).toContainText('Beispiel-Rennen');
  await page.locator('[data-plan-follow]').click();
  await expect(page.locator('[data-plan-moved]')).toHaveCount(0);
  const sessions = await planSessions(page);
  expect(sessions.some((s) => s.day > day(80) && s.day < day(87))).toBe(true);
});
