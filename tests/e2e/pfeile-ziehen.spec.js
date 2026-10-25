// v0.163.x «Pfeile und Ziehen» (Noah 15.10.2026 «2a und b möglich - gilt überall für alles»): a sortable
// list has the arrows ↑↓ and a handle to drag the row. Checked on the categories (Ich › Listen und Typen
// › Kategorien: drag added) and the goals list of Aktiv (#/flow/goals: arrows added). Fictional fixture.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

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
const ids = (loc) => loc.evaluateAll((els) => els.map((e) => e.dataset.sortId ?? e.dataset.id));

/** Drag the handle of row `from` onto the middle of row `to` (mouse, finger and pen share the pointer events). */
async function drag(page, rows, from, to) {
  const grip = rows.nth(from).locator('[data-sort-grip]');
  const a = await grip.boundingBox();
  const b = await rows.nth(to).boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  const y = b.y + b.height * (to > from ? 0.75 : 0.25);
  for (let k = 1; k <= 6; k++) await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2 + ((y - a.y - a.height / 2) * k) / 6);
  await page.mouse.up();
}

test('Kategorien: drag a row with the handle, the arrows still work', async ({ page, context }) => {
  await start(page, context);
  await page.goto('./#/me/lists?categories');
  await expect(page.getByRole('heading', { level: 1, name: T('Categories') })).toBeVisible();
  await expect(page.locator('main')).toContainText(T('Applies to gear, the packing list and the search. Drag or use the arrows to change the order.'));
  const rows = page.locator('main li[data-sort-id]');
  const before = await ids(rows);
  expect(before.length).toBeGreaterThan(3);
  await expect(rows.first().locator('[data-sort-grip]')).toBeVisible();

  await drag(page, rows, 0, 2);
  const want = [...before];
  want.splice(2, 0, ...want.splice(0, 1));
  await expect.poll(() => ids(rows)).toEqual(want);
  // the order is saved and stays after a reload
  await page.reload();
  await expect.poll(() => ids(page.locator('main li[data-sort-id]'))).toEqual(want);

  // the arrow keys on the handle move one place
  const grip = page.locator(`main li[data-sort-id="${want[1]}"] [data-sort-grip]`);
  await grip.focus();
  await grip.press('ArrowUp');
  const after = [want[1], want[0], ...want.slice(2)];
  await expect.poll(() => ids(page.locator('main li[data-sort-id]'))).toEqual(after);
  await expect(page.locator(`main li[data-sort-id="${want[1]}"] [data-sort-grip]`)).toBeFocused();
});

test('Aktiv › Ziele: arrows next to the handle', async ({ page, context }) => {
  await start(page, context);
  await page.goto('./#/flow/goals');
  const rows = page.locator('main ul.acts > li[data-id]');
  await expect(rows.first()).toBeVisible();
  const before = await ids(rows);
  expect(before.length).toBeGreaterThan(1);
  // Impeccable runde 2: on a phone grip and arrows come after «Reihenfolge ändern» (a computer shows them always)
  const order = page.locator('main').getByRole('button', { name: T('Change the order') });
  if (page.viewportSize().width < 720) {
    await expect(rows.first().locator('[data-grip]')).toHaveCount(0);
    await order.click();
    await expect(page.locator('main').getByRole('button', { name: T('Done|order') })).toHaveAttribute('aria-expanded', 'true');
  } else await expect(order).toHaveCount(0);
  await expect(page.locator('main')).toContainText(T('Drag the grip or use the arrows to move.')); // «Aktiv neu»: a tap opens the sport's page
  const first = rows.first();
  await expect(first.getByRole('button', { name: new RegExp(`${T('Move {name} up', { name: '' }).trim()}$`) })).toBeDisabled();
  await first.getByRole('button', { name: new RegExp(`${T('Move {name} down', { name: '' }).trim()}$`) }).click();
  await expect.poll(() => ids(rows)).toEqual([before[1], before[0], ...before.slice(2)]);
});
