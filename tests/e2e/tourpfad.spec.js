// «Tour-Pfad» (Noah 08.11.2026 «1 go A», Tour von A bis Z, Schritt 1): «Schritt n von 4» on a tour page opens the path; the
// path shows four phases, the current one open, each row a link, and one main button. Fictional data, German UI.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z ]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (page, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png` });
};
const plusDays = (n) => {
  const d = new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

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

test('Tour path: the step link opens the path, four phases, the current one open, a main button to the next open row', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  await ready(page);
  const entries = Array.from({ length: 32 }, (_, k) => ({ itemId: `${P}i${k}`, slot: 'seat', qty: 1, packed: k < 24 }));
  await put(page, 'trips', [{ id: `${P}jura`, title: `${P}Jura-Überquerung`, domain: 'bikepacking', startDate: plusDays(6), days: 3, status: 'planned', entries, ready: [], route: { km: 312 }, wx: { min: 4, max: 12 }, arrival: 'train' }]);

  // the way in: «Schritt n von 4» on the tour page
  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), `${P}jura`);
  await page.goto('./#/pack');
  await page.reload();
  await ready(page);
  const link = page.locator('[data-pfad-link]').first();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/#\/trips\/pfad\?t=/);

  // the page: title, four phases, the current one open
  await expect(page.locator('[data-tourpfad] h1')).toContainText(`${P}Jura-Überquerung`);
  await expect(page.locator('[data-pfad-phase]')).toHaveCount(4);
  const vorbereiten = page.locator('[data-pfad-phase="vorbereiten"]');
  await expect(vorbereiten).toHaveAttribute('data-state', 'now');
  await expect(vorbereiten.locator('[data-pfad-row="packen"]')).toContainText(T('{p} of {n} packed', { p: '24', n: '32' }));
  await shot(page, info, 'pfad');

  // another phase folds open on a tap
  const planen = page.locator('[data-pfad-phase="planen"]');
  await expect(planen.locator('[data-pfad-row]')).toHaveCount(0);
  await planen.locator('.ph-head').click();
  await expect(planen.locator('[data-pfad-row="route"]')).toBeVisible();

  // the main button leads to the first open row of the current phase
  const next = page.locator('[data-pfad-next]');
  await expect(next).toBeVisible();
  await next.click();
  await expect(page).not.toHaveURL(/#\/trips\/pfad/);
  expect(errors).toEqual([]);
});

test('Tour path: without a tour the page says so and offers to plan one', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/trips/pfad');
  await ready(page);
  await expect(page.locator('[data-empty]')).toContainText(T('No tour yet'));
  await expect(page.locator('[data-empty] a', { hasText: T('Plan a tour') })).toBeVisible();
});
