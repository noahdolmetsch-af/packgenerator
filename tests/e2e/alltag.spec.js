// Paket V «Alltag» (Noah 19.10.2026 «3a oder b 4a 5a»): Ich › Alltag with the shopping list (groups, tick,
// the switch «together with the trip shopping»), contracts and subscriptions (deadline, sum, reminder in
// Ich › Erinnerungen) and «Not seen for a while». German, phone 390 and desktop 1440, a fixed clock in
// Europe/Zurich, fictional data only. SHOTS=<folder> saves shots.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { PARTS } from '../../src/lib/alltag.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ready, openData, settle } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const DAY = '2026-10-19';

async function open(page, context, hash = './#/me') {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(`${DAY}T12:00:00+02:00`) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(hash);
  await ready(page);
  return errors;
}
async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
}
const noScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test('Ich leads to Alltag; its three pages open in German without a wide page', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await page.locator('[data-me-alltag] a').click();
  await expect(page.getByRole('heading', { level: 1, name: T('Everyday life') })).toBeVisible();
  await expect(page.locator('[data-alltag-page]')).toHaveCount(PARTS.length);
  await shot(page, info, 'alltag-hub');
  for (const p of PARTS) {
    await page.goto(`./#/me/alltag/${p.key}`);
    await expect(page.getByRole('heading', { level: 1, name: T(p.title) })).toBeVisible();
    expect(await noScroll(page), p.key).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('Shopping list: a group from the ideas, a point in it, tick and untick, rename the group', async ({ page, context }, info) => {
  const errors = await open(page, context, './#/me/alltag/einkauf');
  await expect(page.getByRole('heading', { level: 1, name: T('Shopping list') })).toBeVisible();
  await page.locator('[data-shop-groups] summary').click();
  await page.locator('[data-grp-idea="Household"]').click();
  await expect(page.locator('[data-shop-grp]')).toHaveCount(1);
  await page.locator('[data-shop-new]').fill('Test soap');
  await page.locator('[data-shop-group]').selectOption({ label: T('Household') });
  await page.getByRole('button', { name: T('Add'), exact: true }).first().click();
  const row = page.locator('[data-shop-item="Test soap"]');
  await expect(row).toBeVisible();
  await expect(page.locator('[data-shop-sec] h2').first()).toContainText(T('Household'));
  await row.locator('[data-shop-tick]').click();
  await expect(page.locator('[data-shop-item="Test soap"][data-done]')).toBeVisible();
  await expect(page.locator('[data-shop-clear]')).toBeVisible();
  await page.locator('[data-shop-item="Test soap"] [data-shop-tick]').click();
  await expect(page.locator('[data-shop-item="Test soap"]:not([data-done])')).toBeVisible();
  await page.locator('[data-grp-rename]').click();
  const dlg = page.getByRole('dialog');
  await dlg.locator('input').fill('Test shop');
  await dlg.locator('input').press('Enter');
  await expect(page.locator('[data-shop-grp="Test shop"]')).toBeVisible();
  await expect(page.locator('[data-shop-together-switch]')).toBeChecked();
  expect(await noScroll(page)).toBe(true);
  await shot(page, info, 'alltag-einkauf');
  expect(errors).toEqual([]);
});

test('Contracts: a new one shows its last day to cancel, the sum, and its reminder in Ich › Erinnerungen', async ({ page, context }, info) => {
  const errors = await open(page, context, './#/me/alltag/abos');
  await page.locator('[data-abo-new]').click();
  const dlg = page.getByRole('dialog');
  await dlg.locator('[data-field="name"]').fill('Test phone');
  await dlg.locator('[data-field="cost"]').fill('30');
  await dlg.locator('[data-field="end"]').fill('2027-03-31');
  await dlg.locator('[data-field="notice"]').selectOption('2');
  await dlg.getByRole('button', { name: T('Save') }).click();
  const row = page.locator('[data-abo="Test phone"]');
  await expect(row).toBeVisible();
  await expect(row).toContainText('31. Januar 2027');
  await expect(page.locator('[data-abo-sum]')).toContainText('30.00');
  expect(await noScroll(page)).toBe(true);
  await shot(page, info, 'alltag-abos');
  await page.goto('./#/me/reminders');
  await expect(page.getByRole('heading', { name: T('Contracts|reminders') })).toBeVisible();
  await expect(page.getByText(T('Cancel or keep «{name}»? Last day: {day}', { name: 'Test phone', day: '31. Januar 2027' }))).toBeVisible();
  expect(errors).toEqual([]);
});

test('Not seen for a while: add a person, it is due, «Seen today» starts again', async ({ page, context }, info) => {
  const errors = await open(page, context, './#/me/alltag/menschen');
  await page.locator('[data-people-new]').click();
  const dlg = page.getByRole('dialog');
  await dlg.locator('[data-field="name"]').fill('Test friend');
  await dlg.locator('[data-field="seen"]').fill('2026-07-01');
  await dlg.getByRole('button', { name: T('Save') }).click();
  const row = page.locator('[data-person="Test friend"]');
  await expect(row).toHaveAttribute('data-due', '1');
  await row.locator('[data-person-seen]').click();
  await expect(row).not.toHaveAttribute('data-due', '1');
  await expect(row).toContainText('19. Oktober 2026');
  expect(await noScroll(page)).toBe(true);
  await shot(page, info, 'alltag-menschen');
  expect(errors).toEqual([]);
});

// Ideen 275/276: a trip in France shows the emergency numbers, the travel insurance and the currency
const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const zurichToday = () => new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`);
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(zurichToday());

test('Abroad: a trip in France shows 112 and 15, the travel insurance and «EUR umrechnen»; own numbers can be set', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/alltag-abroad-${info.testId}.json`;
  const data = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  data.tables.trips[0].country = 'FR';
  data.tables.settings.push({ key: 'alltag.contracts', value: [{ id: 'ct-test', name: 'Test travel cover', cost: 90, period: 'year', end: null, renew: 12, notice: 1, remind: 14, phone: '+41 00 000 00 00', number: 'T-123', travel: true, stopped: false, note: '' }] });
  writeFileSync(file, JSON.stringify(data));
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await page.goto('./#/pack?weather');
  const card = page.locator('dialog[open] [data-abroad="FR"]');
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('[data-sos="112"]')).toBeVisible();
  await expect(card.locator('[data-sos="15"]')).toBeVisible();
  await expect(card).toContainText('Test travel cover');
  await expect(card.locator('[data-abroad-money]')).toHaveText(T('Convert {cur}', { cur: 'EUR' }));
  await card.locator('[data-sos-edit]').click();
  await card.getByRole('button', { name: T('Add a number') }).click();
  await card.locator('input').nth(-2).fill('Test hotel');
  await card.locator('input').last().fill('0000');
  await card.locator('[data-sos-save]').click();
  await expect(card.locator('[data-sos="0000"]')).toBeVisible();
  if (process.env.SHOTS) await card.screenshot({ path: `${process.env.SHOTS}/alltag-abroad-${info.project.name === 'phone' ? 390 : 1440}.png` });
  expect(errors).toEqual([]);
});
