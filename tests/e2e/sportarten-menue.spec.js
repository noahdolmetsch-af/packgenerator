// «Meine Sportarten» Menü ⋯ (Noah 02.11.2026 «2a»): rename, pause and move in the list itself. Fictional fixture.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';
import { newButton } from './newbutton.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
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

test('Meine Sportarten: the menu ⋯ renames, pauses and moves a sport', async ({ page, context }) => {
  await start(page, context);
  await page.goto('./#/flow/sports');
  const rows = page.locator('[data-my-sports] > li[data-id]');
  await expect(rows.first()).toBeVisible();
  const ids = () => rows.evaluateAll((els) => els.map((e) => e.dataset.id));
  const before = await ids();
  expect(before.length).toBeGreaterThan(2);

  // move the second sport to the top
  const second = rows.nth(1);
  await second.locator('[data-row-menu]').click();
  await page.locator('[data-menu="top"]').click();
  await expect.poll(ids).toEqual([before[1], before[0], ...before.slice(2)]);

  // rename the first one; the sheet saves with Enter
  const first = rows.first();
  await first.locator('[data-row-menu]').click();
  await page.locator('[data-menu="rename"]').click();
  const input = page.getByRole('dialog').locator('input').first();
  await input.fill('Testsport');
  await input.press('Enter');
  await expect(rows.first()).toContainText('Testsport');

  // pause it: it leaves the list and waits in the folded block «Pausiert und ruhend», where it can be resumed
  const count = await rows.count();
  await rows.first().locator('[data-row-menu]').click();
  await page.locator('[data-menu="pause"]').click();
  await expect(rows).toHaveCount(count - 1);
  const block = page.locator('[data-paused-block]');
  await block.locator('summary').click();
  const paused = block.locator('li', { hasText: 'Testsport' });
  await expect(paused).toBeVisible();
  await paused.locator('[data-row-menu]').click();
  await page.locator('[data-menu="pause"]').click(); // «Fortsetzen»
  await expect(rows).toHaveCount(count);
});

test('Meine Sportarten: two sports with one name get a hint that can be left', async ({ page, context }) => {
  await start(page, context);
  await page.goto('./#/flow/sports');
  const rows = page.locator('[data-my-sports] > li[data-id]');
  await expect(rows.first()).toBeVisible();
  for (const k of [0, 1]) {
    await rows.nth(k).locator('[data-row-menu]').click();
    await page.locator('[data-menu="rename"]').click();
    const input = page.getByRole('dialog').locator('input').first();
    await input.fill('Doppelsport');
    await input.press('Enter');
    await expect(rows.nth(k)).toContainText('Doppelsport');
  }
  const hint = page.locator('[data-similar="doppelsport"]');
  await expect(hint).toBeVisible();
  await hint.getByRole('button', { name: T('Keep as is|sport') }).click();
  await expect(hint).toHaveCount(0);
});

test('Meine Sportarten: sports of trips can be added, renamed and hidden in the list', async ({ page, context }) => {
  await start(page, context);
  await page.goto('./#/flow/sports');
  const rows = page.locator('[data-trip-sports] > li');
  await expect(rows.first()).toBeVisible();
  const n = await rows.count();

  // add an own sport
  await page.locator('[data-add-trip-sport]').click();
  const input = page.getByRole('dialog').locator('input').first();
  await input.fill('Testsegeln');
  await input.press('Enter');
  await expect(rows).toHaveCount(n + 1);
  await expect(page.locator('[data-trip-sports]')).toContainText('Testsegeln');

  // rename it
  const own = rows.filter({ hasText: 'Testsegeln' });
  await own.locator('[data-row-menu]').click();
  await page.locator('[data-menu="rename"]').click();
  const input2 = page.getByRole('dialog').locator('input').first();
  await input2.fill('Testrudern');
  await input2.press('Enter');
  await expect(page.locator('[data-trip-sports]')).toContainText('Testrudern');

  // hide it
  await rows.filter({ hasText: 'Testrudern' }).locator('[data-row-menu]').click();
  await page.locator('[data-menu="hide"]').click();
  await expect(rows).toHaveCount(n);
});

// Noah 05.11.2026 «sportarten umbenennen funktioniert nicht»: the built-in bike sports (Gravel, Fahrrad …) had no list entry
test('Meine Sportarten: a built-in sport of trips can be renamed, the name stays after a reload and shows in «New trip»', async ({ page, context }) => {
  await start(page, context);
  await page.goto('./#/flow/sports');
  const rows = page.locator('[data-trip-sports] > li');
  await expect(rows.first()).toBeVisible();
  const row = rows.filter({ has: page.locator('[data-sport="trip:gravel"]') }).or(page.locator('[data-trip-sports] > li[data-sport="trip:gravel"]')).first();
  await row.locator('[data-row-menu]').click();
  await page.locator('[data-menu="rename"]').click();
  const input = page.getByRole('dialog').locator('input').first();
  await input.fill('Schotterpiste');
  await input.press('Enter');
  await expect(page.locator('[data-trip-sports]')).toContainText('Schotterpiste');
  await expect(page.locator('[data-trip-sports]')).not.toContainText('Gravel');

  await page.reload();
  await expect(page.locator('[data-trip-sports]')).toContainText('Schotterpiste');

  // the same name in the list of Ich › Listen und Typen
  await page.goto('./#/me/lists?tripSports');
  await expect(page.locator('.lists')).toContainText('Schotterpiste');

  // «New trip» offers the new name too
  await page.goto('./#/');
  await (await newButton(page, T('New'))).click();
  await page.locator('dialog.new').getByRole('button', { name: new RegExp(`^${T('Plan a trip')}`) }).click();
  await expect(page.locator('dialog.trip-dlg fieldset.area .tp-chip').filter({ hasText: 'Schotterpiste' })).toHaveCount(1);
  await page.keyboard.press('Escape');

  // hide it from the list; it comes back with the eye in Listen und Typen
  await page.goto('./#/flow/sports');
  await rows.filter({ hasText: 'Schotterpiste' }).locator('[data-row-menu]').click();
  await page.locator('[data-menu="hide"]').click();
  await expect(page.locator('[data-trip-sports]')).not.toContainText('Schotterpiste');
});
