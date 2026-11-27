// Notizen: a note asked for with «?open=» stays open when the page is drawn again (the night run and two PRs of 27.11.2026
// lost the window of «f.richtext» in heimat.spec.js: the page is drawn again when the changed lists arrive, and the new
// drawing no longer found «?open=»). The redraw is made by hand here, with the event App.svelte listens to.
import { test, expect } from './clock.js';
import { ready } from './settle.js';

test('a note asked for with open= stays open when the page is drawn again', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/]|127\.0\.0\.1)/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/');
  await ready(page);
  const id = 'test_data_gtp_note_open';
  await page.evaluate((nid) => new Promise((ok, no) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const now = new Date().toISOString();
      const tx = r.result.transaction('notes', 'readwrite');
      tx.objectStore('notes').put({ id: nid, kind: 'note', status: 'kept', at: now, editedAt: now, title: 'test_data_gtp_ Notiz', text: 'test_data_gtp_ Text', topic: null, pinned: false, photo: null });
      tx.oncomplete = () => (r.result.close(), ok());
      tx.onerror = no;
    };
  }), id);
  await page.goto(`./#/notes?open=${id}`);
  await page.reload();
  const win = page.locator('dialog[open]');
  await expect(win).toHaveCount(1, { timeout: 15_000 });
  await page.evaluate(() => {
    window.__first = document.querySelector('dialog[open]');
    window.dispatchEvent(new Event('pg:switchtrip'));
  });
  // state, not time: the window that stands there is a new one (the page was drawn again) and it is open
  await expect.poll(() => page.evaluate(() => { const d = document.querySelector('dialog[open]'); return !!d && d !== window.__first; }), { timeout: 15_000 }).toBe(true);
  await expect(page.locator('dialog[open] [data-rt-bar]')).toHaveCount(1);
  // closed by the person, it stays closed when the page is drawn again
  await page.locator('dialog[open] .vd-x').click();
  await expect(win).toHaveCount(0, { timeout: 15_000 });
  await page.evaluate(() => window.dispatchEvent(new Event('pg:switchtrip')));
  await expect(page.locator('main h1').first()).toBeVisible();
  await expect(win).toHaveCount(0);
});
