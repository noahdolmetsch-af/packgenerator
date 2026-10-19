// Eigene Listen (Noah 14.10.2026 «1a und b 2 b 3a», «4 ok 5 ok», «2a 3a 5a 6a 7a 8a»): the quick field in «Neu»
// suggests a list, the list gets its points, can be ticked and pinned to Material; «Meine Ideen» is a list
// too (4th card in Aktiv), an idea with a date gets a reminder in Kalender › Merken. Fictional data only.
// On a phone and a computer, in German, no sideways scroll, no page errors.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const D0 = '2026-10-14T09:00:00+02:00';

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
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

test('a list from the quick field: points, tick, pinned to Material, in Merken', async ({ page, context }) => {
  const errors = await open(page, context, '#/calendar');
  const main = page.locator('main');
  await expect(main.getByRole('heading', { name: T('Remember'), level: 1 })).toBeVisible();
  await page.getByRole('button', { name: T('New'), exact: true }).first().click();
  const sheet = page.locator('dialog.new');
  await expect(sheet.locator('h3').first()).toHaveText(T('Remember'));
  await sheet.getByLabel(T('Quick field')).fill('Liste Einkauf: Brot, Käse');
  await expect(sheet.locator('.qchip', { hasText: T('List') })).toHaveAttribute('aria-pressed', 'true');
  await sheet.getByLabel(T('Quick field')).press('Enter');

  const ls = page.locator('dialog.lsheet');
  await expect(ls.getByLabel(T('Name'))).toHaveValue('Einkauf');
  await ls.getByRole('button', { name: T('Gear|place') }).click();
  await ls.getByRole('button', { name: T('Create list') }).click();

  await expect(page).toHaveURL(/#\/calendar\/list\//);
  await expect(main.getByRole('heading', { name: 'Einkauf', level: 1 })).toBeVisible();
  await expect(main.locator('.pt')).toHaveCount(2);
  await main.getByLabel(T('New point')).fill('Äpfel');
  await main.getByLabel(T('New point')).press('Enter');
  await expect(main.locator('.pt')).toHaveCount(3);
  await main.getByRole('checkbox', { name: 'Brot' }).click();
  await expect(main.getByRole('checkbox', { name: 'Brot' })).toHaveAttribute('aria-checked', 'true');
  await expect(main.getByText(T('{n} open', { n: 2 })).first()).toBeVisible();
  await fits(page, 'list page');

  // pinned to Material: the open points there, to tick
  await page.evaluate(() => (location.hash = '#/gear'));
  const pin = main.locator('[data-pinned="gear"]');
  await expect(pin).toContainText('Einkauf');
  await expect(pin.getByRole('checkbox', { name: 'Käse' })).toBeVisible();

  // and under «Listen» in Merken
  await page.evaluate(() => (location.hash = '#/calendar'));
  await expect(main.locator('.lrows')).toContainText('Einkauf');
  expect(errors).toEqual([]);
});

test('Meine Ideen: 4th card in Aktiv, an idea with a date gets a reminder in Merken', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow');
  const main = page.locator('main');
  await main.locator('[data-more="ideas"]').first().click();
  await expect(page).toHaveURL(/#\/flow\/ideen$/);
  await expect(main.getByRole('heading', { name: T('Ideas'), level: 1 })).toBeVisible();
  await main.getByLabel(T('New idea'), { exact: true }).fill('Sonnenaufgang auf dem Chasseral');
  await main.getByRole('button', { name: T('Add') }).click();
  const idea = main.locator('[data-idea]', { hasText: 'Chasseral' });
  await expect(idea).toBeVisible();
  // no date: no bell
  await expect(idea.getByRole('button', { name: T('Remind me: {name}', { name: 'Sonnenaufgang auf dem Chasseral' }) })).toHaveCount(0);

  // a second idea with a date: «Erinnern …» makes a reminder in Kalender › Merken (7a)
  await main.getByLabel(T('New idea'), { exact: true }).fill('Sauna mit Freunden');
  await main.getByLabel(T('When?')).fill('2026-10-17');
  await main.getByRole('button', { name: T('Add') }).click();
  const bell = main.getByRole('button', { name: T('Remind me: {name}', { name: 'Sauna mit Freunden' }) });
  await bell.click();
  await expect(main.getByRole('button', { name: T('Reminder on: {name}', { name: 'Sauna mit Freunden' }) })).toHaveAttribute('aria-pressed', 'true');

  // «Bereiche wählen»: Visionen off
  await main.getByRole('button', { name: T('Choose areas') }).click();
  const vis = main.getByRole('button', { name: T('Visions|cat'), exact: true });
  await vis.click();
  await expect(vis).toHaveAttribute('aria-pressed', 'false');
  await fits(page, 'ideas page');

  // it is a list in Merken
  await page.evaluate(() => (location.hash = '#/calendar'));
  await expect(main.locator('.lrows')).toContainText(T('My ideas'));
  await expect(main.locator('.td', { hasText: 'Sauna mit Freunden' })).toBeVisible();
  expect(errors).toEqual([]);
});
