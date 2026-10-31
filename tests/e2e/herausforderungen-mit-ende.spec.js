// «Herausforderungen mit Ende» (Träume und Neuland N5, Noah 27.10.2026 «1-5 a»): on Touren › Träume, a fictional
// ride reaches a stored goal by itself, a ready one starts with «0 of 5», the pencil changes and deletes it
// (with Undo). Fictional data only.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z ]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const shift = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));
const SHOTS = process.env.SHOTS_DIR ?? null;
// a picture of one part (or of the screen with the window open)
const shot = async (page, info, name, part = null) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  const path = `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png`;
  await (part ? part.screenshot({ path }) : page.screenshot({ path }));
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
// a fictional ride from the middle of Zürich south along the lake
const LINE = [[47.3769, 8.5417], [47.35, 8.56], [47.32, 8.58], [47.29, 8.6], [47.26, 8.63]];

async function put(page, store, rows) {
  await page.evaluate(
    ([name, list]) =>
      new Promise((ok, bad) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => bad(r.error);
        r.onsuccess = () => {
          const tx = r.result.transaction(name, 'readwrite');
          for (const row of list) tx.objectStore(name).put(row);
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
      }),
    [store, rows],
  );
}

test('Challenges with an end: reached by itself, start one, change, delete with Undo', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/trips/dreams');
  await ready(page);
  const sec = page.locator('[data-neuland-goals]');
  await expect(sec).toContainText(T('Challenges with an end'));

  // 1. one fictional ride and a stored goal it reaches: the app marks it by itself
  await put(page, 'settings', [
    { key: 'homePlace', value: { name: `${P}Zürich`, lat: 47.3769, lon: 8.5417 } },
    { key: 'neuland.goals', value: [{ id: `${P}g1`, cid: 'municipalities', mode: 'count', times: 2, from: shift(-30), until: shift(5), name: `${P}Seerunde-Ziel`, doneOn: null }] },
  ]);
  await put(page, 'trips', [{ id: `${P}see`, title: `${P}Seerunde`, domain: 'bikepacking', startDate: shift(-10), days: 1, status: 'done', entries: [], route: { name: `${P}See`, km: 30, line: LINE } }]);
  await page.reload();
  await ready(page);
  const g1 = sec.locator(`[data-goal="${P}g1"]`);
  await expect(g1).toHaveAttribute('data-goal-state', 'done', { timeout: 15000 });
  await expect(g1).toContainText(T('Reached on {day}', { day: '' }).trim());
  await expect.poll(() => page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('settings').objectStore('settings').get('neuland.goals');
      q.onsuccess = () => (r.result.close(), ok(q.result?.value?.[0]?.doneOn ?? null));
    };
  }))).toBe(today());

  // 2. a ready one: «5 new municipalities this month» starts with 0 of 5
  await sec.locator('[data-goal-preset="muni"]').click();
  const dlg = page.locator('dialog[data-goal-sheet][open]');
  await expect(dlg).toBeVisible();
  await expect(dlg.locator('[data-goal-times]')).toHaveValue('5');
  await dlg.locator('[data-goal-save]').click();
  const row = sec.locator('[data-goal]').filter({ hasText: T('{n} new municipalities', { n: 5 }) });
  await expect(row).toHaveAttribute('data-goal-state', 'running');
  await expect(row.locator('[data-goal-sub]')).toContainText(T('{n} of {m}', { n: 0, m: 5 }));
  await noSideways(page);
  await shot(page, info, 'HM1-liste', sec);

  // 3. the pencil: change the number to 3
  await row.locator('[data-goal-edit]').click();
  await expect(dlg).toBeVisible();
  await dlg.locator('[data-goal-times]').fill('3');
  await shot(page, info, 'HM2-fenster');
  await dlg.locator('[data-goal-save]').click();
  const row3 = sec.locator('[data-goal]').filter({ hasText: T('{n} new municipalities', { n: 3 }) });
  await expect(row3.locator('[data-goal-sub]')).toContainText(T('{n} of {m}', { n: 0, m: 3 }));

  // 4. delete asks first, then Undo brings it back
  await row3.locator('[data-goal-edit]').click();
  await dlg.locator('[data-goal-delete]').click();
  await page.locator('dialog[open]').getByRole('button', { name: T('Delete'), exact: true }).click();
  await expect(row3).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).click();
  await expect(row3).toHaveCount(1);
  expect(errors).toEqual([]);
});
