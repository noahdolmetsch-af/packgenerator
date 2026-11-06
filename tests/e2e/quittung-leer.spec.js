// «Werkstatt-Quittung:» (Noah 05.11.2026): opening «Notiz + Foto» for a receipt fills in «Werkstatt-Quittung: ».
// Without more words and without a photo nothing is saved (not by itself, not with «Speichern»); with words it is saved.
// German UI, phone and desktop, fictional data.
import { test, expect } from './clock.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';
import { mkdirSync } from 'node:fs';
import { openHome, homeFixture } from './home0460-fixture.js';

const T = (en) => DE[en] ?? en;
const fixture = fileURLToPath(new URL('./fixture.json', import.meta.url));
const notes = (page) =>
  page.evaluate(
    () =>
      new Promise((ok, no) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => no(r.error);
        r.onsuccess = () => {
          const q = r.result.transaction('notes').objectStore('notes').getAll();
          q.onsuccess = () => (r.result.close(), ok(q.result.map((n) => n.text)));
        };
      }),
  );

test('QN1: a bare receipt start is no note; with words it is one', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  await importAndSettle(page, fixture);
  await page.goto('./#/');
  const before = (await notes(page)).length;
  await page.keyboard.press('n');
  await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Note + photo') }).click();
  const dlg = page.getByRole('dialog', { name: T('Note + photo') });
  await expect(dlg).toBeVisible();
  const box = dlg.getByRole('textbox', { name: T('Note') });
  await box.fill(T('Workshop receipt: '));
  await page.waitForTimeout(1200); // the note saves itself after 0.4 s when it has text
  expect((await notes(page)).length).toBe(before);
  await dlg.getByRole('button', { name: T('Save'), exact: true }).click();
  await expect(dlg.getByText(T('Write a few words or add a photo.'))).toBeVisible();
  expect((await notes(page)).length).toBe(before);
  // with words after the label the note is saved
  await box.fill(`${T('Workshop receipt: ')}test_data_gtp_ Service`);
  await dlg.getByRole('button', { name: T('Save'), exact: true }).click();
  await expect(dlg).toBeHidden();
  expect(await notes(page)).toContain(`${T('Workshop receipt: ')}test_data_gtp_ Service`);
});

// the learning that was filed from such a note long ago stays in the list of learnings, but Heute does not show it
test('QN2: Jetzt dran shows no learning without content', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: homeFixture() });
  // the learning is written into the database after the import, then Heute reloads
  await page.evaluate(
    () =>
      new Promise((ok, no) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => no(r.error);
        r.onsuccess = () => {
          const tx = r.result.transaction('learnings', 'readwrite');
          tx.objectStore('learnings').put({ id: 9001, topic: 'Quick note', rule: 'Werkstatt-Quittung:', action: '', itemIds: [], source: 'Quick note 2026-11-04', appliesTo: ['all'], priority: 'high', confirmed: 0, createdAt: '2026-11-04T08:00:00.000Z' });
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => no(tx.error);
        };
      }),
  );
  await page.reload();
  const today = page.locator('[data-section="today"]');
  await expect(today).toBeVisible();
  const more = today.getByRole('button', { name: /^Alle \d+ zeigen$/ });
  if (await more.isVisible()) await more.click();
  if (process.env.SHOTS) {
    mkdirSync(process.env.SHOTS, { recursive: true });
    await today.screenshot({ path: `${process.env.SHOTS}/QN2-jetzt-dran-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await expect(today).not.toContainText('Werkstatt-Quittung');
});
