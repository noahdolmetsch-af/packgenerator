// «Verbesserungs-Logbuch» Schritt 4 (Noah 21.11.2026 «freigabe»): «Auftrag kopieren». Fictional entries only; phone + desktop.
// SHOTS=<folder> saves pictures (Handy 390 / Computer 1440).
import { test, expect } from './clock.js';
import { ready } from './settle.js';

const SHOTS = process.env.SHOTS || '';
const press = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());

async function write(page, info, { art, text, urgent = '', pageText = '', block = '' }) {
  await press(page.locator('[data-lb-new]'), info);
  const sheet = page.locator('[data-logbuch-sheet]');
  await expect(sheet).toBeVisible();
  await press(sheet.locator(`[data-art="${art}"]`), info);
  await sheet.locator('[data-lb-text]').fill(text);
  if (urgent) await press(sheet.locator(`[data-urgent="${urgent}"]`), info);
  if (pageText) await sheet.locator('[data-lb-page]').fill(pageText);
  if (block) await sheet.locator('[data-lb-block]').fill(block);
  await press(sheet.locator('[data-lb-save]'), info);
  await expect(sheet).toBeHidden();
}

test('Auftrag kopieren: the open entries as one text by page, «Stört jetzt» first, notes at the end', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/me/logbuch');
  await ready(page);

  await write(page, info, { art: 'text', text: 'Fiktiv A: Text auf der Woche-Seite.', pageText: '#/flow/training', block: 'Woche 47' });
  await write(page, info, { art: 'fehler', text: 'Fiktiv C: springt nach oben.', urgent: 'now', pageText: '#/me', block: 'Hilfe' });
  await write(page, info, { art: 'gutso', text: 'Fiktiv D: Abhaken ist gut.', pageText: '#/flow/training' });
  await expect(page.locator('[data-lb-entry]')).toHaveCount(3);
  await expect(page.locator('[data-lb-images]')).toHaveCount(0); // no photo yet
  if (SHOTS) {
    await page.locator('[data-lb-copy]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${SHOTS}/auftrag-knopf-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }

  await press(page.locator('[data-lb-copy]'), info);
  await expect(page.getByText('Auftrag kopiert: 3 Einträge.')).toBeVisible();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain('Verbesserungs-Auftrag');
  expect(text.indexOf('Fiktiv C')).toBeLessThan(text.indexOf('Fiktiv A')); // the page with «Stört jetzt» first
  expect(text.indexOf('Fiktiv A')).toBeLessThan(text.indexOf('Nur zur Notiz'));
  expect(text.indexOf('Nur zur Notiz')).toBeLessThan(text.indexOf('Fiktiv D'));
  expect(text).toContain('#/me');
  expect(text).toContain('#/flow/training');
  expect(text).toContain('Block «Hilfe»');
  expect(text).toContain('Stört jetzt');
  expect(errors).toEqual([]);
});
