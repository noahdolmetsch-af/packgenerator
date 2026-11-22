// «Frag die App merkt sich Fragen» (S6, Noah 21.11.2026 «5a»): a question the app cannot answer is kept on this device only,
// can be asked again and removed (with Undo); a question it can answer is not kept. Fictional data only.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import { openHome, homeFixture, tr } from './home0460-fixture.js';

const T = tr('de');
const SHOTS = process.env.SHOTS_DIR ?? null;
const tap = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
const KEY = 'pg.openq';

async function ask(page, info, text) {
  await page.getByLabel(T('Your question')).fill(text);
  await tap(page.getByRole('button', { name: T('Ask'), exact: true }), info);
}

test('A question without an answer stays on this device, comes back after a reload and can be removed with undo', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: homeFixture(), hour: 9 });
  await page.goto('./#/assistent');
  const fold = page.locator('[data-as="open"]');
  await expect(fold).toHaveCount(0);

  // a question the app can answer is not kept
  await ask(page, info, 'Wie viele km diesen Monat?');
  await expect(page.locator('[data-aa]')).toBeVisible();
  await expect(fold).toHaveCount(0);

  // a question it cannot answer is kept, once, however often it is asked
  await ask(page, info, 'Wann ist Vollmond auf dem Mars?');
  await expect(fold).toBeVisible();
  await expect(fold.locator('summary')).toContainText(T('One question without an answer'));
  await ask(page, info, 'Wann ist Vollmond auf dem Mars?');
  await expect(fold.locator('summary')).toContainText(T('One question without an answer'));

  // only on this device: in the local storage, not in the database
  const raw = await page.evaluate((k) => localStorage.getItem(k), KEY);
  expect(JSON.parse(raw)).toHaveLength(1);
  const inDb = await page.evaluate(
    () =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const tx = r.result.transaction('settings').objectStore('settings').getAll();
          tx.onsuccess = () => (r.result.close(), ok(JSON.stringify(tx.result).includes('Vollmond')));
        };
      }),
  );
  expect(inDb).toBe(false);

  // it comes back after a reload; the list shows the question, asking again fills the field
  await page.reload();
  await expect(fold).toBeVisible();
  await fold.locator('summary').click();
  await expect(fold.locator('[data-open-ask]')).toContainText('Vollmond auf dem Mars');
  if (SHOTS) {
    mkdirSync(SHOTS, { recursive: true });
    await fold.screenshot({ path: `${SHOTS}/S6-offene-fragen-${info.project.name === 'phone' ? '390' : '1440'}.png` });
  }

  // remove, then undo
  await tap(fold.locator('[data-open-del]'), info);
  await expect(fold).toHaveCount(0);
  await expect(page.getByText(T('Question removed'))).toBeVisible();
  await tap(page.getByRole('button', { name: T('Undo') }), info);
  await expect(fold).toBeVisible();
  expect(JSON.parse(await page.evaluate((k) => localStorage.getItem(k), KEY))).toHaveLength(1);
  expect(errors).toEqual([]);
});
