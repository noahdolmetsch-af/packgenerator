// Einzelideen Planen, grosse Teile (996 Ideen 10, 11, 15, 16; Noah 26.10.2026 «1a 2a 3a 4a 5a»):
// Pflanzenpass, Vorgänge (doppelter Eingang, Mail als Vorgang), Erinnerungskarte and «Notizen im Zusammenhang».
// In German, phone and computer; no sideways scroll, no page errors. Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { prep, newNote, storedNote, noSideScroll, png } from './notes-helpers.js';
import { ready } from './settle.js';

const T = (en, vars = {}) => Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), DE[en] ?? en.replace(/\|[a-z]+$/, ''));
const P = 'test_data_gtp_';

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
const readAll = (page, store) =>
  page.evaluate(
    (store) =>
      new Promise((ok, fail) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = fail;
        r.onsuccess = () => {
          const g = r.result.transaction(store).objectStore(store).getAll();
          g.onsuccess = () => ok(g.result);
          g.onerror = fail;
        };
      }),
    store,
  );
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich' }).format(new Date());

test('Pflanzenpass: an observation and a move stay in the plant history', async ({ page, context }) => {
  const errors = await prep(page, context);
  const plant = { id: `${P}olive`, kind: 'plant', text: `${P}Olivenbaum`, created: '2026-05-29T08:00:00.000Z', plant: { every: 4, place: 'Balkon', last: today() } };
  await seed(page, 'settings', [{ key: 'merken', value: [plant] }]);
  await page.goto('./#/calendar/pflanzen');
  await ready(page);
  const pass = page.locator('[data-plant-pass]');
  await expect(pass.getByRole('heading', { name: T('Plant passport'), level: 1 })).toBeVisible();

  await pass.locator('[data-pass-obs]').first().click();
  let sheet = page.locator('dialog[data-pass-sheet]');
  await sheet.locator('[data-pass-sun="full"]').click();
  await sheet.locator('[data-pass-save]').click();
  await expect(sheet).toHaveCount(0);

  await pass.locator('[data-pass-move]').first().click();
  sheet = page.locator('dialog[data-pass-sheet]');
  await sheet.locator('[data-pass-place]').fill('Terrasse, Ostecke');
  await sheet.locator('[data-pass-save]').click();
  await expect(pass).toContainText(T('Moved to «{place}»', { place: 'Terrasse, Ostecke' }));
  await noSideScroll(page);

  await expect
    .poll(async () => {
      const m = (await readAll(page, 'settings')).find((s) => s.key === 'merken')?.value?.[0];
      return [m?.plant?.place, m?.plant?.pass?.length];
    })
    .toEqual(['Terrasse, Ostecke', 3]); // observation, move, and the old spot from the day the plant came
  expect(errors).toEqual([]);
});

test('Vorgänge: a double entry is merged into one matter, renamed and deleted without losing entries', async ({ page, context }) => {
  const errors = await prep(page, context);
  const at = new Date(Date.now() - 2 * 3600e3).toISOString();
  await seed(page, 'notes', [
    { id: `${P}mail`, status: 'open', page: 'mail', at, title: `${P} Buchung Hotel Beispiel 482913`, text: 'Ihre Buchung 482913', mail: { subject: `${P} Buchung Hotel Beispiel 482913`, from: 'info@hotel-beispiel.ch', fromName: 'Hotel Beispiel', date: at } },
    { id: `${P}photo`, status: 'open', at, title: `${P} Quittung Hotel`, text: 'Quittung Hotel Beispiel 482913', photo: `data:image/png;base64,${png(4, 4).toString('base64')}` },
  ]);
  await page.goto('./#/inbox');
  await ready(page);
  await page.locator('[data-vorgaenge-open]').click();
  const vg = page.locator('[data-vorgaenge]');
  await expect(vg.getByRole('heading', { name: T('Matters'), level: 1 })).toBeVisible();
  const pair = vg.locator('[data-double]');
  await expect(pair).toHaveCount(1);
  await pair.locator('[data-double-yes]').click();
  await expect(pair).toHaveCount(0);
  const card = vg.locator('[data-case]');
  await expect(card).toHaveCount(1);
  await expect(card.locator('li')).toHaveCount(2);
  await noSideScroll(page);

  await card.getByRole('button', { name: T('Rename «{name}»', { name: `${P} Buchung Hotel Beispiel 482913` }) }).click();
  const ren = page.locator('dialog[open]').last();
  await ren.locator('input').fill(`${P} Hotel Herbst`);
  await ren.getByRole('button', { name: T('Save'), exact: true }).click();
  await expect(card).toContainText(`${P} Hotel Herbst`);

  await card.getByRole('button', { name: T('Delete «{name}»', { name: `${P} Hotel Herbst` }) }).click();
  await page.locator('dialog[open]').last().getByRole('button', { name: T('Delete'), exact: true }).click();
  await expect(card).toHaveCount(0);
  const notes = await readAll(page, 'notes');
  expect(notes.filter((n) => n.id.startsWith(P)).map((n) => n.caseId ?? null)).toEqual([null, null]);
  expect(errors).toEqual([]);
});

test('Erinnerungskarte: a note becomes a card and shows on «Notizen im Zusammenhang»', async ({ page, context }) => {
  const errors = await prep(page, context);
  const sheet = await newNote(page, `${P} Abend am See\nWellen und Wind`);
  await sheet.locator('[data-note-card-open]').click();
  const mc = page.locator('dialog[data-memory-card]');
  await expect(mc).toBeVisible();
  await mc.locator('[data-card-keep]').click();
  await expect(mc).toHaveCount(0);
  await sheet.getByRole('button', { name: T('Done'), exact: true }).click();
  await expect.poll(async () => !!(await storedNote(page, 'Abend am See'))?.card).toBe(true);

  await page.locator('[data-notes-context]').click();
  const nc = page.locator('[data-note-context]');
  await expect(nc.getByRole('heading', { name: T('Notes in context'), level: 1 })).toBeVisible();
  await nc.getByRole('button', { name: new RegExp(T('Memory cards')) }).first().click();
  await expect(nc.locator('[data-card]')).toHaveCount(1);
  await nc.locator('[data-card]').click();
  await expect(page.locator('dialog[data-memory-card]')).toContainText('Abend am See');
  await noSideScroll(page);
  expect(errors).toEqual([]);
});
