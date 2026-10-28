// Einzelideen Planen (996 Ideen 12, 13, 14; Noah 25.10.2026): a link between notes gets a meaning and the
// other note reads it back; a note comes back after the next workshop visit; the trash says what comes back
// with a note and brings a linked note back together. In German, phone and computer; no sideways scroll,
// no page errors. Fictional data only.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { prep, newNote, storedNote, noSideScroll } from './notes-helpers.js';
import { ready } from './settle.js';

const T = (en, vars = {}) => Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), DE[en] ?? en.replace(/\|[a-z]+$/, ''));
const done = (sheet) => sheet.getByRole('button', { name: T('Done'), exact: true }).click();

async function linkFirstTo(page, sheet, name) {
  await sheet.getByRole('button', { name: T('Link a note') }).click();
  await sheet.getByPlaceholder(T('Search a note to link')).fill(name);
  await sheet.locator('[data-note-links] button.lchip', { hasText: name }).first().click();
}

test('a link with a meaning: the other note reads it the other way round', async ({ page, context }) => {
  const errors = await prep(page, context);
  let sheet = await newNote(page, 'test_data_gtp_ Quelle Artikel\nüber Reifendruck');
  await done(sheet);
  sheet = await newNote(page, 'test_data_gtp_ Reifen Entscheid\nwelcher Druck');
  await linkFirstTo(page, sheet, 'Quelle Artikel');
  await sheet.locator('[data-link-rel]').selectOption('source');
  await expect(sheet.locator('[data-note-links]')).toContainText(`${T('Source')}:`);
  await noSideScroll(page);
  await done(sheet);
  await expect.poll(async () => (await storedNote(page, 'Reifen Entscheid'))?.links?.[0]?.rel).toBe('source');

  await page.locator('li.ncard', { hasText: 'Quelle Artikel' }).locator('button').first().click();
  sheet = page.locator('dialog.nsheet');
  await expect(sheet.locator('[data-note-links]')).toContainText(T('Is the source of'));
  await expect(sheet.locator('[data-link-rel]')).toHaveCount(0); // the meaning is changed where the link is kept
  await done(sheet);
  expect(errors).toEqual([]);
});

test('a note comes back after the next workshop visit', async ({ page, context }) => {
  const errors = await prep(page, context);
  const sheet = await newNote(page, 'test_data_gtp_ Bremse fragen\nbeim nächsten Service');
  await sheet.locator('[data-note-remind-open]').click();
  await sheet.locator('[data-after="visit"]').click();
  await expect(sheet.locator('[data-note-after]')).toContainText(T('The note comes back on top of Notes once a workshop visit is saved.'));
  await noSideScroll(page);
  await done(sheet);
  await expect.poll(async () => (await storedNote(page, 'Bremse fragen'))?.after?.kind).toBe('visit');
  await expect(page.locator('[data-after-due]')).toHaveCount(0);

  // a workshop visit is saved (today, by the device's own day)
  await page.evaluate(
    () =>
      new Promise((ok, fail) => {
        const d = new Date();
        const p = (n) => String(n).padStart(2, '0');
        const day = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
        const r = indexedDB.open('pack-generator');
        r.onerror = fail;
        r.onsuccess = () => {
          const tx = r.result.transaction('visits', 'readwrite');
          tx.objectStore('visits').put({ id: 'test_data_gtp_visit', bikeId: null, date: day, shop: 'test_data_gtp_ Werkstatt', parts: [], photos: [] });
          tx.oncomplete = ok;
          tx.onerror = fail;
        };
      }),
  );
  await page.reload();
  await ready(page);
  const due = page.locator('[data-after-due]');
  await expect(due).toHaveCount(1);
  await expect(due).toContainText(T('after the workshop visit'));
  await due.locator('[data-after-done]').click();
  await expect(due).toHaveCount(0);
  expect((await storedNote(page, 'Bremse fragen')).after.done).toBe(true);
  expect(errors).toEqual([]);
});

test('the trash says what comes back and brings a linked note back together', async ({ page, context }) => {
  const errors = await prep(page, context);
  let sheet = await newNote(page, 'test_data_gtp_ Zelt Liste\nHeringe');
  await done(sheet);
  sheet = await newNote(page, 'test_data_gtp_ Zelt Kauf\nwelches Modell');
  await linkFirstTo(page, sheet, 'Zelt Liste');
  await done(sheet);
  await expect.poll(async () => (await storedNote(page, 'Zelt Kauf'))?.links?.length).toBe(1);

  for (const name of ['Zelt Liste', 'Zelt Kauf']) {
    await page.locator('li.ncard', { hasText: name }).locator('button').first().click();
    await page.locator('dialog.nsheet').getByRole('button', { name: T('Delete'), exact: true }).click();
    await page.getByTestId('ask-delete').getByRole('button', { name: T('Delete'), exact: true }).click();
    await expect.poll(() => storedNote(page, name)).toBe(null);
  }
  await page.goto('./#/notes?trash=1');
  await ready(page);
  const trash = page.locator('dialog[data-note-trash]');
  await expect(trash).toBeVisible();
  await expect(trash.locator('[data-trash-with]')).toContainText(T('Restore with attachments'));
  const row = trash.locator('[data-trash-row]').filter({ has: page.locator('.m b', { hasText: 'Zelt Kauf' }) });
  await expect(row.locator('[data-trash-info]')).toContainText(T('Comes back with: {list}', { list: T('{n} link|note', { n: 1 }) }));
  await expect(row.locator('[data-trash-linked]')).toContainText('Zelt Liste');
  await noSideScroll(page);
  await row.locator('[data-trash-putall]').click();
  await expect(trash.locator('[data-trash-row]')).toHaveCount(0);
  await trash.getByRole('button', { name: T('Done'), exact: true }).click();
  await expect.poll(async () => !!(await storedNote(page, 'Zelt Liste')) && !!(await storedNote(page, 'Zelt Kauf'))).toBe(true);
  expect(errors).toEqual([]);
});
