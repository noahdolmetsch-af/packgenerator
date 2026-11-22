// «Eine Fundliste» (Träume und Neuland N10, Noah 07.11.2026 «ok N10»): on New ground the card «List of finds» lists what was
// reached for the first time: Neuland places (a fictional ride), a place of the summit book and an own «Neuland of the year»
// entry; Ich › Was mir gut tut shows the same list. Fictional data only.
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
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (page, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png` });
};
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

test('List of finds: Neuland places, the summit book and own entries in one list; the same list in Was mir gut tut', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  await ready(page);
  const day = today();
  await put(page, 'trips', [{ id: `${P}see`, title: `${P}Seerunde`, domain: 'bikepacking', startDate: day, days: 1, status: 'done', entries: [], route: { name: `${P}See`, km: 30, line: LINE } }]);
  await put(page, 'settings', [
    { key: 'gipfelbuch', value: { places: [{ id: 'gbp1', name: `${P}Hügel`, sport: 'hike', ele: 900, lat: 46.8, lon: 8.9, label: '', note: '', createdAt: `${day}T08:00:00Z` }], visits: [{ id: 'gbv1', placeId: 'gbp1', day, ref: 'hand', hm: null }], dismissed: [] } },
    { key: 'neulandYear', value: [{ id: 'nl-1', name: `${P}Eigener Fund`, day }] },
  ]);
  await page.reload();
  await ready(page);

  // 1. New ground: the card is at the top with all three kinds
  await page.goto('./#/neuland');
  await ready(page);
  const card = page.locator('[data-fundliste]');
  await expect(card).toBeVisible({ timeout: 20000 });
  await expect(card.getByRole('heading', { name: T('List of finds') })).toBeVisible();
  await expect(card.locator('[data-fund]').first()).toBeVisible({ timeout: 20000 });
  await expect(card.locator('[data-fund]')).toHaveCount(4);
  await card.locator('[data-fund-more]').click(); // only four lines at first, «Show more» opens the rest
  await expect(card.locator('[data-fund="own"]', { hasText: `${P}Eigener Fund` })).toBeVisible();
  await expect(card.locator('[data-fund="gipfelbuch"]', { hasText: `${P}Hügel` }).or(card.locator('[data-fund="neuland"]').first()).first()).toBeVisible();
  await expect(card.locator('[data-fund="neuland"]').first()).toBeVisible();
  await shot(page, info, 'FL1-neuland');

  // 2. «All years» keeps the list; the own entry stays once
  await card.getByRole('button', { name: T('All years') }).click();
  await card.locator('[data-fund-more]').click();
  await expect(card.locator('[data-fund="own"]', { hasText: `${P}Eigener Fund` })).toHaveCount(1);
  await expect(card.locator('[data-fund-wohl]')).toHaveAttribute('href', '#/me/wohl');

  // 3. Ich › Was mir gut tut shows the same list (own, the summit-book place, the Neuland places)
  await page.goto('./#/me/wohl');
  await ready(page);
  const wl = page.locator('[data-wohl-neuland]');
  await expect(wl).toContainText(`${P}Eigener Fund`, { timeout: 20000 });
  await page.locator('[data-neuland-more]').click().catch(() => {});
  await expect(wl).toContainText(`${P}Hügel`, { timeout: 20000 });
  await expect(wl).toContainText(T('From the summit book'));
  await shot(page, info, 'FL2-wohl');
  expect(errors).toEqual([]);
});
