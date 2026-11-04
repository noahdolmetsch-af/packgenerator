// «Das Velo zeigt seine Pflege» (Paket C idea 22, Noah 03.11.2026 «b»): the drawn bike on the card of Bikes gleams after
// care and gets dusty when no care is recorded for long. Runs on phone and computer, no sideways scroll. Fictional data only.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import { importAndSettle, ready } from './settle.js';

const fixture = fileURLToPath(new URL('./fixture.json', import.meta.url));
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich' }).format(new Date());
// calendar-day arithmetic (never Date.now() + n * 864e5)
const ago = (n) => new Date(Date.parse(`${today()}T00:00:00Z`) - n * 864e5).toISOString().slice(0, 10);

/** Sets the washes of every bike, then reloads. */
async function washes(page, list) {
  await page.evaluate(
    (list) =>
      new Promise((ok, fail) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = fail;
        r.onsuccess = () => {
          const tx = r.result.transaction('bikes', 'readwrite');
          const st = tx.objectStore('bikes');
          const all = st.getAll();
          all.onsuccess = () => all.result.forEach((b) => st.put({ ...b, washes: list, parts: (b.parts ?? []).map((p) => ({ ...p, history: [] })), service: undefined }));
          tx.oncomplete = ok;
          tx.onerror = fail;
        };
      }),
    list,
  );
  await page.reload();
  await ready(page);
}

{
  test('Bikes: the card shows a gleaming bike after care and a dusty one after a long pause', async ({ page, context }) => {
    await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('./');
    await importAndSettle(page, fixture);
    await page.goto('./#/bikes');
    await expect(page.locator('[data-velo-card]').first()).toBeVisible();

    // no record at all: the bike looks normal, no line about dust (nothing to judge by)
    await washes(page, []);
    await expect(page.locator('[data-velo-card] svg.velo').first()).toHaveAttribute('data-look', 'normal');
    await expect(page.locator('[data-velo-look]')).toHaveCount(0);

    // washed today: it gleams
    await washes(page, [{ date: ago(0), km: 100, by: 'self' }]);
    await expect(page.locator('[data-velo-card] svg.velo').first()).toHaveAttribute('data-look', 'clean');
    await expect(page.locator('[data-velo-look="clean"]').first()).toBeVisible();

    // 74 days ago: it is dusty and the line says how long
    await washes(page, [{ date: ago(74), km: 100, by: 'self' }]);
    await expect(page.locator('[data-velo-card] svg.velo').first()).toHaveAttribute('data-look', 'dusty');
    await expect(page.locator('[data-velo-look="dusty"]').first()).toContainText('74');

    // 120 days ago: a cobweb hangs on it
    await washes(page, [{ date: ago(120), km: 100, by: 'self' }]);
    await expect(page.locator('[data-velo-card] svg.velo').first()).toHaveAttribute('data-look', 'web');

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
