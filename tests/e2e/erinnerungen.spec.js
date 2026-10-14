// Erinnerungen überall (mockups ER1–ER3, Noah 14.10.2026 «1a 2a 3a 4a 5b er1-er3 freigabe») and
// Kalender › Merken (PL2/PL3, «PL1-PL3 freigeben», «1a»): after ticking Yoga the app asks once
// «Soll ich dich in Zukunft erinnern?» (1a card), «Ja, erinnern» saves it, it shows on Ich › Erinnerungen
// (4a) and in Kalender › Merken (5b), not on Heute; the card waits for the next page, so it never covers
// the next step where the entry was made; «Nein danke» does not ask again; a to-do is added,
// ticked off and taken back. On a phone and a computer, in German, no sideways scroll, no page errors.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const go = (page, hash) => page.evaluate((h) => (location.hash = h), hash);
const D0 = '2026-10-14T09:00:00+02:00'; // a Wednesday; the browser runs in Europe/Zurich

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
  });
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`./${hash}`);
  return errors;
}
async function fits(page, where) {
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: no sideways scroll`).toBeLessThanOrEqual(w);
}

test('ER1: after Yoga the app asks once; yes saves a reminder on Ich › Erinnerungen and in Merken', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow');
  const main = page.locator('main');
  const yoga = main.locator('[data-act="yoga"]').first();
  await expect(yoga).toBeVisible();
  await yoga.click();
  const card = page.locator('.rmc');
  await page.waitForTimeout(400);
  await expect(card, 'not over the Aktiv page where Yoga was ticked').toHaveCount(0);
  await go(page, '#/me');
  await expect(card).toBeVisible();
  await expect(card).toContainText(T('Shall I remind you in future?'));
  await fits(page, 'ask card');
  await card.getByRole('button', { name: T('Yes, remind me') }).click();
  await expect(page.locator('.rmc.solo')).toContainText(T('Reminder saved.'));

  // taking the tick back and ticking again: no second question (a reminder exists)
  await go(page, '#/flow');
  await yoga.click();
  await yoga.click();
  await page.waitForTimeout(400);
  await go(page, '#/me');
  await page.waitForTimeout(400);
  await expect(page.locator('.rmc:not(.solo)')).toHaveCount(0);

  await page.goto('./#/me/reminders');
  await expect(main.getByRole('heading', { name: T('Reminders'), level: 1 })).toBeVisible();
  const row = main.locator('.row', { hasText: 'Yoga' });
  await expect(row).toBeVisible();
  const sw = row.getByRole('switch');
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await fits(page, 'Ich › Erinnerungen');

  await page.goto('./#/calendar');
  await expect(main.getByRole('heading', { name: T('Remember'), level: 1 })).toBeVisible();
  await expect(main.locator('.td', { hasText: 'Yoga' })).toBeVisible();

  // switched off on Ich › Erinnerungen: gone from Merken
  await page.goto('./#/me/reminders');
  await main.locator('.row', { hasText: 'Yoga' }).getByRole('switch').click();
  await expect(main.locator('.row', { hasText: 'Yoga' }).getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  await page.goto('./#/calendar');
  await expect(main.locator('.td', { hasText: 'Yoga' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('ER1 2a: «Nein danke» does not ask again for that activity', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow');
  const main = page.locator('main');
  const run = main.locator('[data-act="stretch"]').first();
  await run.click();
  const card = page.locator('.rmc');
  await page.waitForTimeout(400);
  await go(page, '#/me');
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: T('No thanks') }).click();
  await expect(card).toHaveCount(0);
  await go(page, '#/flow');
  await run.click(); // taken back
  await run.click(); // ticked again
  await page.waitForTimeout(400);
  await go(page, '#/me');
  await page.waitForTimeout(400);
  await expect(page.locator('.rmc')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('PL2/PL3: add a to-do in Merken, tick it off, take it back', async ({ page, context }) => {
  const errors = await open(page, context, '#/calendar');
  const main = page.locator('main');
  await main.getByRole('button', { name: T('Add a to-do') }).click();
  const dlg = page.locator('dialog.todo');
  await expect(dlg).toBeVisible();
  await dlg.getByRole('button', { name: T('Save') }).click();
  await expect(dlg.getByRole('alert')).toHaveText(T('Write what you want to remember.'));
  await dlg.getByLabel(T('What?')).fill('Ersatz-Schaltauge bestellen');
  await dlg.getByRole('button', { name: T('Tomorrow') }).click();
  await dlg.getByRole('button', { name: T('On the day, 08:00') }).click();
  await fits(page, 'to-do window');
  await dlg.getByRole('button', { name: T('Save') }).click();
  const row = main.locator('.td', { hasText: 'Ersatz-Schaltauge bestellen' });
  await expect(row).toBeVisible();
  await expect(row.locator('.due')).toHaveText(T('Tomorrow'));
  await row.getByRole('button', { name: T('Done: {name}', { name: 'Ersatz-Schaltauge bestellen' }) }).click();
  await expect(row).toHaveCount(0);
  await page.locator('.mk-toast').getByRole('button', { name: T('Undo') }).click();
  await expect(main.locator('.td', { hasText: 'Ersatz-Schaltauge bestellen' })).toBeVisible();
  await fits(page, 'Merken');
  expect(errors).toEqual([]);
});
