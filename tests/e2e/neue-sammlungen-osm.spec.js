// «Neue Sammlungen» (Träume und Neuland N18, Noah 07.11.2026 «ok N18»): Lookout towers, Suspension bridges and Waterfalls from
// OpenStreetMap. The Overpass answer is made up here (fictional places, no network): New ground loads it by itself, a fictional
// ride past a tower and a waterfall ticks both, «Load again» works and a failed ask says so. Fictional data only.
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
const ANSWER = {
  elements: [
    { type: 'node', id: 101, lat: 47.3502, lon: 8.5601, tags: { man_made: 'tower', 'tower:type': 'observation', name: `${P}Turm am See`, ele: '640' } },
    { type: 'node', id: 102, lat: 47.12, lon: 8.3, tags: { man_made: 'tower', 'tower:type': 'observation', name: `${P}Turm weit weg` } },
    { type: 'node', id: 103, lat: 47.2903, lon: 8.6002, tags: { waterway: 'waterfall', name: `${P}Wasserfall am Weg` } },
    { type: 'way', id: 104, center: { lat: 46.9, lon: 8.1 }, tags: { highway: 'path', 'bridge:structure': 'suspension', name: `${P}Hängebrücke im Tal` } },
  ],
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

test('Towers, bridges, waterfalls: loaded by itself, found on a ride, load again, failure says so', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let asked = 0;
  let fail = false;
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => {
    if (!/overpass/.test(r.request().url())) return r.abort();
    asked++;
    return fail ? r.fulfill({ status: 500, body: 'no' }) : r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ANSWER) });
  });
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  await ready(page);
  await put(page, 'trips', [{ id: `${P}see`, title: `${P}Seerunde`, domain: 'bikepacking', startDate: today(), days: 1, status: 'done', entries: [], route: { name: `${P}See`, km: 30, line: LINE } }]);

  await page.reload();
  await ready(page);

  // 1. New ground opens: the places load by themselves (once)
  await page.goto('./#/neuland?c=towers');
  await ready(page);
  const box = page.locator('[data-osm-box="towers"]');
  await expect(box.locator('[data-osm-status]')).toContainText(`${T('Loaded from OpenStreetMap on {day}: {n}.').split('{')[0].trim()}`, { timeout: 20000 });
  await expect(box.locator('[data-osm-status]')).toContainText(T('{n} places', { n: 2 }));
  expect(asked).toBe(1);
  await expect(box.locator('[data-osm-credit]')).toBeVisible();

  // 2. the ride past the tower ticks it; the far one stays open
  const list = page.locator('.nl-list');
  await expect(list.locator('li.row')).toHaveCount(2);
  await expect(list.locator('li.row', { hasText: `${P}Turm am See` }).locator('button.tk')).toHaveAttribute('aria-pressed', 'true', { timeout: 20000 });
  await expect(list.locator('li.row', { hasText: `${P}Turm weit weg` }).locator('button.tk')).toHaveAttribute('aria-pressed', 'false');
  await shot(page, info, 'OS1-tuerme');

  // 3. the waterfall too, in its own collection; a second visit the same week asks nothing
  await page.getByRole('button', { name: T('Waterfalls') }).first().click();
  await expect(page.locator('.nl-list li.row', { hasText: `${P}Wasserfall am Weg` }).locator('button.tk')).toHaveAttribute('aria-pressed', 'true', { timeout: 20000 });
  await shot(page, info, 'OS2-wasserfaelle');
  await page.goto('./#/neuland');
  await ready(page);
  await expect(page.locator('[data-osm-box]').first()).toBeVisible();
  expect(asked).toBe(1);

  // 4. «Load again» asks once more; a failure says so and keeps the places
  await page.locator('[data-osm-box] [data-osm-load]').first().click();
  await expect.poll(() => asked).toBe(2);
  fail = true;
  await page.locator('[data-osm-box] [data-osm-load]').first().click();
  await expect(page.locator('[data-osm-error]')).toBeVisible();
  await expect(page.locator('.nl-list li.row').first()).toBeVisible();
  await shot(page, info, 'OS3-fehler');
  expect(errors).toEqual([]);
});
