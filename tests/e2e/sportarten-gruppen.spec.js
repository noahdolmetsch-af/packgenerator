// «Meine Sportarten» Gruppen, Suche, Filter (Noah 02.11.2026 «4a»). Fictional fixture.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const FIXTURE = fileURLToPath(new URL('./fixture.json', import.meta.url));

async function start(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(FIXTURE);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert|Imported/)).toBeVisible();
}

test('Meine Sportarten: a group takes a sport, collapses, renames and deletes with the sports staying', async ({ page, context }) => {
  await start(page, context);
  await page.goto('./#/flow/sports');
  const rows = page.locator('[data-my-sports] > li[data-id]');
  await expect(rows.first()).toBeVisible();
  const total = await rows.count();

  // new group through the sport's menu, the sport goes in
  await page.locator('[data-new-group]').click();
  const input = page.getByRole('dialog').locator('input').first();
  await input.fill('Kraft');
  await input.press('Enter');
  const head = page.locator('[data-group]:not([data-group="none"])');
  await expect(head).toHaveCount(1);
  await expect(head).toContainText('Kraft');

  await rows.first().locator('[data-row-menu]').click();
  await page.locator('[data-menu^="group-"]:not([data-menu="group-new"])').first().click();
  await expect(head.locator('.gt small')).toHaveText('1');

  // collapse hides the group's sport, expand brings it back
  await head.locator('[data-group-toggle]').click();
  await expect(rows).toHaveCount(total - 1);
  await head.locator('[data-group-toggle]').click();
  await expect(rows).toHaveCount(total);

  // rename
  await head.locator('[data-row-menu]').click();
  await page.locator('[data-menu="rename"]').click();
  const input2 = page.getByRole('dialog').locator('input').first();
  await input2.fill('Erholung');
  await input2.press('Enter');
  await expect(head).toContainText('Erholung');

  // delete: the sports stay
  await head.locator('[data-row-menu]').click();
  await page.locator('[data-menu="delete"]').click();
  await page.getByRole('dialog').getByRole('button', { name: /löschen|Löschen/ }).last().click();
  await expect(page.locator('[data-group]:not([data-group="none"])')).toHaveCount(0);
  await expect(rows).toHaveCount(total);
});

test('Meine Sportarten: search and the filter «Heute offen» narrow the list', async ({ page, context }) => {
  await start(page, context);
  await page.goto('./#/flow/sports');
  const rows = page.locator('[data-my-sports] > li[data-id]');
  await expect(rows.first()).toBeVisible();
  const total = await rows.count();
  const firstName = (await rows.first().locator('a.ar').innerText()).trim().split('\n')[0].slice(0, 4);

  await page.locator('[data-find-sport]').fill(firstName);
  expect(await rows.count()).toBeGreaterThan(0);
  expect(await rows.count()).toBeLessThanOrEqual(total);
  await page.locator('[data-find-sport]').fill('zzzqqq');
  await expect(rows).toHaveCount(0);
  await page.locator('[data-find-sport]').fill('');
  await expect(rows).toHaveCount(total);

  await page.locator('[data-filter-open]').click();
  await expect(page.locator('[data-filter-open]')).toHaveAttribute('aria-pressed', 'true');
  expect(await rows.count()).toBeLessThanOrEqual(total);
});

async function newGroup(page, name) {
  await page.locator('[data-new-group]').click();
  const input = page.getByRole('dialog').locator('input').first();
  await input.fill(name);
  await input.press('Enter');
}

test('Meine Sportarten: a sport dragged onto a group title goes into that group', async ({ page, context }) => {
  await start(page, context);
  await page.goto('./#/flow/sports');
  const rows = page.locator('[data-my-sports] > li[data-id]');
  await expect(rows.first()).toBeVisible();
  await newGroup(page, 'Kraft');
  const head = page.locator('[data-group]:not([data-group="none"])');
  await expect(head).toContainText('Kraft');
  await expect(head.locator('.gt small')).toHaveText('0');
  await expect(page.locator('[data-group-add]')).toBeVisible(); // the empty group offers «Neue Sportart hier»
  await head.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 220)); // away from the edge that scrolls while dragging
  const grip = page.locator('[data-my-sports]').last().locator('> li[data-id]').first().locator('[data-sort-grip]');
  const g = await grip.boundingBox();
  const h = await head.boundingBox();
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
  await page.mouse.down();
  await page.mouse.move(h.x + 40, h.y + h.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(head.locator('.gt small')).toHaveText('1');
});

test('Neue Sportart: the group is chosen in the form, and «Neue Sportart hier» comes with the group', async ({ page, context }) => {
  await start(page, context);
  await page.goto('./#/flow/sports');
  await expect(page.locator('[data-new-group]')).toBeVisible();
  await newGroup(page, 'Erholung');
  await page.locator('[data-group-add]').click();
  await expect(page).toHaveURL(/#\/flow\/new\?group=/);
  await page.locator('#ed-name').fill('Testdehnen');
  await expect(page.locator('[aria-labelledby="ed-group"] [aria-pressed="true"]')).toContainText('Erholung');
  await page.getByRole('button', { name: T('Save') }).click();
  const head = page.locator('[data-group]:not([data-group="none"])');
  await expect(head.locator('.gt small')).toHaveText('1');
});
