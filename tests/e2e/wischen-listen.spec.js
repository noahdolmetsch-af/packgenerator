// B13 «Wischen in Listen» (Noah 27.10.2026 «4a»): the same swipe in every list. Notizen on the phone:
// right pins a note, left puts it into the trash; each with Undo. The computer shows no swipe actions.
// Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { prep, storedNote } from './notes-helpers.js';
import { ready } from './settle.js';

const T = (en, vars = {}) => Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), DE[en] ?? en.replace(/\|[a-z]+$/, ''));
const P = 'test_data_gtp_';

async function seed(page, rows) {
  await page.evaluate(
    (rows) =>
      new Promise((ok, fail) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = fail;
        r.onsuccess = () => {
          const tx = r.result.transaction('notes', 'readwrite');
          for (const row of rows) tx.objectStore('notes').put(row);
          tx.oncomplete = ok;
          tx.onerror = fail;
        };
      }),
    rows,
  );
  await page.reload();
  await ready(page);
}

/** A finger moving sideways over the row by dx px. */
async function swipe(page, li, dx) {
  const face = li.locator('.face');
  const b = await face.boundingBox();
  await face.evaluate(
    (el, { b, dx }) => {
      const y = b.y + b.height / 2;
      const x0 = dx > 0 ? b.x + 20 : b.x + b.width - 20;
      const ev = (type, x) => new PointerEvent(type, { bubbles: true, pointerType: 'touch', pointerId: 7, clientX: x, clientY: y, isPrimary: true });
      el.dispatchEvent(ev('pointerdown', x0));
      for (let i = 1; i <= 6; i++) el.dispatchEvent(ev('pointermove', x0 + (dx * i) / 6));
      el.dispatchEvent(ev('pointerup', x0 + dx));
    },
    { b, dx },
  );
}

test('a swipe pins a note and puts one into the trash, each with Undo', async ({ page, context }, info) => {
  const errors = await prep(page, context);
  const at = new Date().toISOString();
  await seed(page, [
    { id: `${P}w1`, status: 'kept', at, createdAt: at, title: `${P} Kettenöl kaufen`, text: 'Kettenöl kaufen' },
    { id: `${P}w2`, status: 'kept', at, createdAt: at, title: `${P} Zelt flicken`, text: 'Zelt flicken' },
  ]);
  const row = (title) => page.locator('li.ncard', { hasText: title });
  await expect(row(`${P} Kettenöl kaufen`)).toBeVisible();
  if (info.project.name !== 'phone') {
    await expect(page.locator('[data-swipe-act]')).toHaveCount(0);
    return expect(errors).toEqual([]);
  }
  // right: pin, with Undo
  await swipe(page, row(`${P} Kettenöl kaufen`), 300);
  await expect.poll(async () => (await storedNote(page, 'Kettenöl'))?.pinned).toBe(true);
  await expect(page.locator('.rtoast').last()).toContainText(T('«{name}» is pinned.', { name: `${P} Kettenöl kaufen` }));
  await expect(page.getByRole('heading', { name: new RegExp(T('Pinned')) })).toBeVisible();

  // left, a short swipe: the delete button shows; a tap puts the note into the trash
  await swipe(page, row(`${P} Zelt flicken`), -70);
  const del = row(`${P} Zelt flicken`).locator('[data-swipe-act="trash"]');
  await expect(del).toBeVisible();
  await del.click();
  await expect(row(`${P} Zelt flicken`)).toHaveCount(0);
  await expect.poll(async () => await storedNote(page, 'Zelt')).toBe(null);
  // Undo brings it back
  await page.locator('.rtoast').last().getByRole('button', { name: T('Undo') }).click();
  await expect(row(`${P} Zelt flicken`)).toBeVisible();
  expect(errors).toEqual([]);
});
