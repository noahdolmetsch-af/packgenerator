// B22 «Rückgängig gleitet» (Noah 27.10.2026 «1a 2a 3a 4a 5a»): two deletes in a row, both notes stay with
// their own Undo (before, the second note replaced the first and the first learning could not come back).
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

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

test('two deletes in a row: both notes keep their Undo', async ({ page, context }, info) => {
  const data = structuredClone(base);
  data.tables.learnings = [learning(1, A), learning(2, B)];
  const file = info.outputPath('stapel.json');
  writeFileSync(file, JSON.stringify(data));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await page.goto('./#/debrief/learnings');

  for (const name of [A, B]) {
    await page.getByRole('button', { name: T('Edit learning: {name}', { name }) }).click();
    await page.getByTestId('learning-sheet').getByRole('button', { name: T('Delete'), exact: true }).click();
    await page.getByTestId('ask-delete').getByRole('button', { name: T('Delete'), exact: true }).click();
  }
  await expect.poll(async () => (await table(page, 'learnings')).length).toBe(0);
  await expect(page.locator('.rtoast')).toContainText(T('"{name}" deleted.', { name: B }));
  const older = page.locator('.rtoast-old');
  await expect(older).toContainText(T('"{name}" deleted.', { name: A }));

  // the first delete can still come back
  await older.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await table(page, 'learnings')).map((l) => l.rule)).toEqual([A]);
  await expect(page.locator('.rtoast')).toContainText(T('"{name}" is back.', { name: A }));

  // × closes a note
  await page.locator('.rtoast').getByRole('button', { name: T('Dismiss message') }).click();
  await expect(page.getByText(T('"{name}" is back.', { name: A }))).toHaveCount(0);
});
