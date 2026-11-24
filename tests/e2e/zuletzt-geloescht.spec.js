// «Zuletzt gelöscht» (Noah 23.11.2026 «1a»): what is deleted waits 30 days on Me › Data and comes back with «Back»;
// the empty page says why; ⌘Z takes the last delete back on a computer. Fictional data only.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle, replaceAll } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const A = 'test_data_gtp_ Zweite Handschuhe';
const B = 'test_data_gtp_ Mehr Riegel';
const learning = (id, rule) => ({ id, rule, action: '', topic: '', priority: 'medium', itemIds: [], source: 'test', appliesTo: ['all'], confirmed: 0, createdAt: '2026-10-01T08:00:00.000Z' });
const table = (page, name) =>
  page.evaluate((n) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(n).objectStore(n).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);

async function start(page, context, info) {
  const data = structuredClone(base);
  data.tables.learnings = [learning(1, A), learning(2, B)];
  const file = info.outputPath('trash.json');
  writeFileSync(file, JSON.stringify(data));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await replaceAll(panel);
  await settle(page);
  await page.goto('./#/debrief/learnings');
}
async function remove(page, name) {
  await page.getByRole('button', { name: T('Edit learning: {name}', { name }) }).click();
  await page.getByTestId('learning-sheet').getByRole('button', { name: T('Delete'), exact: true }).click();
  await page.getByTestId('ask-delete').getByRole('button', { name: T('Delete'), exact: true }).click();
}

test('deleted things wait in the trash page and come back with Back', async ({ page, context }, info) => {
  await start(page, context, info);
  await remove(page, A);
  await expect.poll(async () => (await table(page, 'learnings')).length).toBe(1);
  await page.goto('./#/me/trash');
  const rows = page.locator('[data-trash-row]');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(A);
  await rows.first().locator('[data-trash-back]').click();
  await expect(page.locator('[data-trash-info]')).toContainText(A);
  await expect.poll(async () => (await table(page, 'learnings')).map((l) => l.rule).sort()).toEqual([A, B].sort());
  await expect(page.getByText(T('Nothing deleted in the last 30 days'))).toBeVisible();
});

test('the empty page says why it is empty', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto('./#/me/trash');
  await expect(page.getByText(T('Nothing deleted in the last 30 days'))).toBeVisible();
  await expect(page.locator('[data-trash-row]')).toHaveCount(0);
});

test('Ctrl Z takes the last delete back on a computer', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'desktop', 'a shortcut for a computer');
  await start(page, context, info);
  await remove(page, B);
  await expect.poll(async () => (await table(page, 'learnings')).length).toBe(1);
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Control+z');
  await expect.poll(async () => (await table(page, 'learnings')).length).toBe(2);
});

test('a deleted to-do waits as a to-do and comes back at the end of the list', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto('./#/day/todos');
  await page.locator('[data-todo-new]').fill('test_data_gtp_ Kette ölen');
  await page.locator('[data-todo-new]').press('Enter');
  const row = page.locator('[data-todo^="m:"]', { hasText: 'test_data_gtp_ Kette ölen' });
  await expect(row).toHaveCount(1);
  await row.click();
  await page.locator('[data-todo-sheet]').getByRole('button', { name: T('Delete'), exact: true }).click();
  await expect(row).toHaveCount(0);
  await page.goto('./#/me/trash');
  const rows = page.locator('[data-trash-row]');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('test_data_gtp_ Kette ölen');
  await rows.first().locator('[data-trash-back]').click();
  await expect(page.locator('[data-trash-info]')).toContainText('test_data_gtp_ Kette ölen');
  await page.goto('./#/day/todos');
  await expect(page.locator('[data-todo^="m:"]', { hasText: 'test_data_gtp_ Kette ölen' })).toHaveCount(1);
});
