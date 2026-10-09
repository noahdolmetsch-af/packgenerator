// v0.47.0 «Aufpimpen» (Noah: "a to-do list empties itself"): in the Inbox a sorted note leaves the
// list, the next one moves up and gets the focus, Undo puts the note back and removes what it wrote;
// the last one leaves a calm line with an action. In Gear → Check one answer brings the next item and
// can be taken back. (The wardrobe's «Noch einordnen» is in wardrobe042.spec.js.)
// Fictional data only (test_data_gtp_ names, tests/e2e/v038-fixture.js). Phone and desktop.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { v038Start } from './v038-fixture.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const table = (page, name) =>
  page.evaluate(
    (name) =>
      new Promise((resolve) => {
        const req = indexedDB.open('pack-generator');
        req.onsuccess = () => {
          const all = req.result.transaction(name).objectStore(name).getAll();
          all.onsuccess = () => {
            req.result.close();
            resolve(all.result);
          };
        };
      }),
    name,
  );
const count = async (page) => {
  const out = {};
  for (const name of ['maintenance', 'items', 'learnings']) out[name] = (await table(page, name)).length;
  return out;
};

test('Inbox: a sorted note leaves, the next is first and focused, Undo restores it; the last one leaves a line with an action', async ({ page, context }, info) => {
  const errors = await v038Start(page, context, info, expect);
  await page.goto('./#/inbox');
  const list = page.getByRole('list', { name: T('Notes, newest first') });
  const notes = list.locator('li.note');
  await expect(notes).toHaveCount(2);
  const ids = await notes.evaluateAll((li) => li.map((l) => l.dataset.noteId));
  const before = await count(page);

  // Sort the first note with its one light button: the row is gone, the other one is first and focused.
  await notes.first().locator('.acts > .btn').click();
  await expect(notes).toHaveCount(1);
  await expect(notes.first()).toHaveAttribute('data-note-id', ids[1]);
  await expect(notes.first().locator('.acts > .btn')).toBeFocused();
  await expect.poll(async () => (await table(page, 'notes')).find((n) => n.id === ids[0]).status).not.toBe('open');
  const toast = page.locator('.toast[role=status]');
  await expect(toast).toContainText('→');

  // Undo: the note is open again at its place, and what it wrote is gone.
  await toast.getByRole('button', { name: T('Undo') }).click();
  await expect(notes).toHaveCount(2);
  await expect(notes.first()).toHaveAttribute('data-note-id', ids[0]);
  await expect.poll(async () => (await table(page, 'notes')).find((n) => n.id === ids[0]).status).toBe('open');
  await expect.poll(() => count(page)).toEqual(before);

  // Both sorted: one calm line with an action, focused.
  await notes.first().locator('.acts > .btn').click();
  await expect(notes).toHaveCount(1);
  await notes.first().locator('.acts > .btn').click();
  const done = page.locator('#inbox-done');
  await expect(done).toContainText(T('All notes are sorted.'));
  await expect(done.getByRole('button', { name: `+ ${T('Quick note')}` })).toBeVisible();
  await expect(done).toBeFocused();
  expect(errors).toEqual([]);
});

test('Gear check: Still have it brings the next item at once, Undo puts the item back in front', async ({ page, context }, info) => {
  const errors = await v038Start(page, context, info, expect);
  await page.goto('./#/gear');
  await page.getByRole('tab', { name: new RegExp(`^${T('Check')}`) }).click();
  const name = page.locator('.review .name');
  const first = (await name.textContent()).trim();
  const still = page.getByRole('button', { name: T('Still have it') });
  await still.click();
  await expect(name).not.toHaveText(first);
  await expect(still).toBeFocused();
  const line = page.locator('.review .undo[role=status]');
  await expect(line).toContainText(T('{name}: still there', { name: first.replace(/ × \d+$/, '') }));
  await line.getByRole('button', { name: T('Undo') }).click();
  await expect(name).toHaveText(first);
  await expect(line).toHaveCount(0);

  // "Gone" too: the next comes up, Undo makes the item owned again.
  await page.getByRole('button', { name: T('Gone'), exact: true }).click();
  await expect(name).not.toHaveText(first);
  await page.locator('.review .undo').getByRole('button', { name: T('Undo') }).click();
  await expect(name).toHaveText(first);
  expect((await table(page, 'items')).filter((i) => i.ownership === 'gone' && i.reviewedAt)).toHaveLength(0);
  expect(errors).toEqual([]);
});
