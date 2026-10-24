// Klick-Rundgang 22.10.2026, Durchspiel-Test «Nach der Tour, Start» (Noah «5a»: a robot plays every finished
// flow before each release). 1) A day ride is finished: «Tour beendet» says why there are no km yet and offers
// the upload (H10), On the way of an ended trip says it is over and leads to the debrief (H28).
// 2) A first start: the first bike is added, the bike page says step 1 is done and leads on to step 2 (H31).
// Fictional fixture plus test_data_gtp_ items; nothing leaves the preview server.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));

/** Today in Zurich, calendar-day arithmetic (never Date.now() + n days). */
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
}

test('Ablauf Nach der Tour: finish a day ride, no km yet says so, On the way of an ended trip leads to the debrief', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context);
  const file = info.outputPath('ablauf-nachdertour.json');
  writeFileSync(file, JSON.stringify(base));
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);

  // a day ride for today, packed in one tap, set off, finished
  await page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }).click();
  await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }).click();
  const dlg = page.getByRole('dialog', { name: T('Conditions|newtrip') });
  await dlg.getByLabel(T('Start date')).fill(today());
  await dlg.getByRole('button', { name: T('Day ride'), exact: true }).click();
  await dlg.getByRole('button', { name: T('Create trip') }).click();
  await expect(dlg).toBeHidden();
  const go = page.locator('main .mainbar .btn.hi').first();
  await go.click();
  await expect(page).toHaveURL(/#\/ride/);
  await expect(go).toHaveText(new RegExp(esc(T('Start riding'))));
  await go.click();
  await expect(go).toHaveText(new RegExp(esc(T('Finish the trip'))));
  await go.click();
  const sheet = page.locator('dialog.endsheet');
  const ended = page.getByRole('heading', { level: 1, name: T('Trip ended') });
  await expect(sheet.or(ended)).toBeVisible();
  if (await sheet.isVisible()) await sheet.getByRole('button', { name: T('End the trip'), exact: true }).click();
  await expect(ended).toBeVisible();

  // H10: no ride uploaded and no route: the page says why there are no km and offers the upload
  const upload = page.locator('[data-upload-ride]');
  await expect(upload).toBeVisible();
  await expect(upload).toHaveAttribute('href', '#/debrief/ride');
  await expect(page.locator('main')).not.toContainText(T('Numbers from your route. With an uploaded ride they get exact.'));

  // H28: On the way of an ended trip says so and leads to the debrief, no «Jetzt» card
  await page.goto('./#/ride');
  const over = page.locator('[data-ride-over]');
  await expect(over).toBeVisible();
  await over.getByRole('link').first().click();
  await expect(page).toHaveURL(/#\/debrief\/./);
  expect(errors).toEqual([]);
});

test('Ablauf Erster Start: the first bike, then the bike page leads on to step 2', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context);
  const first = page.getByRole('region', { name: T('First steps') });
  await expect(first).toBeVisible();
  await first.getByRole('link', { name: T('Add your bike') }).click();
  await expect(page).toHaveURL(/#\/bikes/);
  // the link may open the bike window right away; otherwise the empty page offers «Velo hinzufügen»
  const bike = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: T('Add|bike') }) });
  const add = page.getByRole('button', { name: T('Add bike') }).first();
  await expect(bike.or(add).first()).toBeVisible();
  if (!(await bike.isVisible())) await add.click();
  await bike.getByLabel(T('Name')).fill('test_data_gtp_ Erstes Velo');
  await bike.getByRole('button', { name: T('Add|bike') }).click();
  await expect(bike).toBeHidden();

  // H31: step 1 is done, the card leads on to step 2 on Today
  const next = page.locator('[data-first-next]');
  await expect(next).toBeVisible();
  await expect(next).toContainText(T('Step 1 done: your bike is here.'));
  await next.getByRole('link', { name: T('Continue to step 2') }).click();
  await expect(page).toHaveURL(/#\/$/);
  await expect(first).toBeVisible();
  expect(errors).toEqual([]);
});
