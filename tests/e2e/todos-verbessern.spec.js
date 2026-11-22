// To-dos und Notizen verbessern (Noah 05.11.2026 «f1-f3, n1-n3 alle»): Eingabe-Zeile mit Datum in Alltagssprache (F1/N1),
// Schritte (N2), Gehört zu (N3), Sortieren und Verschieben (F2), eine Suche für To-dos und Notizen (F3).
// Handy und Computer, deutsch, keine seitliche Rollleiste, keine Seitenfehler. Erfundene Daten.
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
/** Puts rows into a store of the app's database, then reloads. */
async function seed(page, store, rows) {
  await page.evaluate(
    ({ store, rows }) =>
      new Promise((ok, fail) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = fail;
        r.onsuccess = () => {
          const tx = r.result.transaction(store, 'readwrite');
          for (const row of rows) tx.objectStore(store).put(row);
          tx.oncomplete = ok;
          tx.onerror = fail;
        };
      }),
    { store, rows },
  );
  await page.reload();
  await ready(page);
}
const NOTE = { id: 'note-t1', at: '2026-11-04T10:00:00Z', text: 'Kette ersetzen? Bei 3200 km messen.', photo: null, page: 'notes', tripId: null, bikeId: null, status: 'kept', to: null, sortedAt: null };
const D0 = '2026-11-05T09:00:00+01:00'; // a Thursday; the browser runs in Europe/Zurich

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

test('F1/N1: the quick line finds date, time and repeat in the words', async ({ page, context }) => {
  const errors = await open(page, context, '#/calendar');
  const main = page.locator('main');
  const line = main.locator('[data-quick-input]');
  await line.fill('Kette ölen morgen 18 Uhr, jeden Sonntag');
  const found = main.locator('[data-quick-found]');
  await expect(found).toContainText(T('Tomorrow'));
  await expect(found).toContainText('18:00');
  await expect(found).toContainText(T('Every week'));
  await fits(page, 'quick line');
  await line.press('Enter');
  const row = main.locator('[data-todo-id]', { hasText: 'Kette ölen' });
  await expect(row).toBeVisible();
  await expect(row).not.toContainText('jeden Sonntag'); // the words went into the date
  await expect(row.locator('.due')).toHaveText(T('Tomorrow'));
  // a plain text with a chip: «Wochenende»
  await line.fill('Zelt trocknen');
  await main.locator('.qchips').getByRole('button', { name: T('Weekend') }).click();
  await main.locator('[data-quick-save]').click();
  await expect(main.locator('[data-todo-id]', { hasText: 'Zelt trocknen' })).toBeVisible();
  // a part of the words can be left out: the words then stay in the text
  await line.fill('Brevet morgen planen');
  await main.locator('[data-quick-found] .chip').first().click();
  await main.locator('[data-quick-save]').click();
  await expect(main.locator('[data-todo-id]', { hasText: 'Brevet morgen planen' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('N2/N3: steps in a to-do, belongs to a note, shown on both sides', async ({ page, context }) => {
  const errors = await open(page, context, '#/calendar');
  const main = page.locator('main');
  await ready(page);
  await seed(page, 'notes', [NOTE]);
  await main.getByRole('button', { name: T('Add a to-do') }).click();
  const dlg = page.locator('dialog.todo');
  await dlg.getByLabel(T('What?')).fill('Alpen-Tour vorbereiten');
  const step = dlg.locator('[data-step-new]');
  await step.fill('Route festlegen');
  await step.press('Enter');
  await step.fill('Hotel buchen');
  await step.press('Enter');
  await expect(dlg.locator('.stl li')).toHaveCount(2);
  await dlg.locator('[data-link-pick]').selectOption('note|note-t1');
  await expect(dlg.locator('[data-todo-links] .chip.on')).toContainText('Kette ersetzen');
  await fits(page, 'to-do window with steps');
  await dlg.getByRole('button', { name: T('Save') }).click();
  const row = main.locator('[data-todo-id]', { hasText: 'Alpen-Tour vorbereiten' });
  await expect(row).toContainText(T('{done} of {total} done', { done: 0, total: 2 }));
  await expect(row).toContainText('Kette ersetzen');
  const steps = row.locator('[data-steps] li');
  await expect(steps).toHaveCount(2);
  await steps.first().getByRole('button').click();
  await expect(row).toContainText(T('{done} of {total} done', { done: 1, total: 2 }));
  // the note shows the to-do that belongs to it
  await page.goto('./#/notes?open=note-t1');
  const lt = page.locator('[data-linked-todos="note"]');
  await expect(lt).toContainText('Alpen-Tour vorbereiten');
  expect(errors).toEqual([]);
});

test('F2: sort with the arrows and push to tomorrow', async ({ page, context }) => {
  const errors = await open(page, context, '#/calendar');
  const main = page.locator('main');
  const line = main.locator('[data-quick-input]');
  for (const w of ['Erstes', 'Zweites', 'Drittes']) {
    await line.fill(`${w} heute`);
    await line.press('Enter');
    await expect(main.locator('[data-todo-id]', { hasText: w })).toBeVisible();
  }
  const texts = () => main.locator('[data-todo-group="today"] [data-todo-id] b').allTextContents();
  expect(await texts()).toEqual(['Erstes', 'Zweites', 'Drittes']);
  await main.locator('[data-merken-sort]').click();
  await main.getByRole('button', { name: T('Move {name} down', { name: 'Erstes' }) }).click();
  await expect.poll(texts).toEqual(['Zweites', 'Erstes', 'Drittes']);
  await fits(page, 'sorting');
  await main.locator('[data-merken-sort]').click();
  expect(errors).toEqual([]);
});

test('F3: one search finds to-dos and notes', async ({ page, context }) => {
  const errors = await open(page, context, '#/calendar');
  const main = page.locator('main');
  await main.locator('[data-quick-input]').fill('Kette ölen');
  await main.locator('[data-quick-save]').click();
  await seed(page, 'notes', [NOTE]);
  const search = main.locator('[data-merken-search]');
  await search.fill('kette');
  await expect(main.locator('[data-todo-id]', { hasText: 'Kette ölen' })).toBeVisible();
  await expect(main.locator('[data-note-hits]')).toContainText('Kette ersetzen');
  await fits(page, 'search');
  expect(errors).toEqual([]);
});
