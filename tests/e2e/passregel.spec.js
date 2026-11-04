// «Eine Regel für Pässe» (Entdecken und Sammeln, Noah 04.11.2026 «1a»): a line within 600 m of the top is a sure hit;
// between 600 m and 1.2 km the app asks («please confirm»), in «Pässe sammeln» and in Neuland. Fictional data only.
import { test, expect } from './clock.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { sn4plusData, D0, day } from './sn4plus-fixture.js';
import { at1Acts } from './at1-acts.js';
import { importAndSettle, ready } from './settle.js';
import { encodePolyline } from '../../src/lib/spur/polyline.js';

const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (page, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png` });
};
const T = (en, vars) => {
  const text = DE[en] ?? en;
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

const A = 'test_pass_';
// over the top of the Furka (46.5726, 8.4153): sure; about 900 m north of the Susten (46.7297, 8.4478): please confirm
const OVER_FURKA = encodePolyline([[46.55, 8.36], [46.5726, 8.415], [46.59, 8.47]]);
const NEAR_SUSTEN = encodePolyline([[46.7378, 8.39], [46.7378, 8.4478], [46.7378, 8.5]]);

test('Pässe sammeln: a sure pass is collected, a close one asks first', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const d = sn4plusData();
  const acts = at1Acts(day, A);
  acts[0] = { ...acts[0], line: OVER_FURKA };
  acts[1] = { ...acts[1], line: NEAR_SUSTEN };
  d.tables.activities = acts;
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/passregel-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(d));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.setFixedTime(new Date(`${D0}T10:00:00+02:00`));
  await page.goto('./');
  await importAndSettle(page, file);
  await page.goto('./#/debrief/paesse');
  const root = page.locator('[data-paesse]');
  await expect(root.locator('[data-suggest]')).toHaveCount(2);
  // the Furka is sure: no question; the Susten is close: the distance and «Yes, rode it»
  await expect(root.locator('[data-suggest="furka"] [data-pass-maybe]')).toHaveCount(0);
  await expect(root.locator('[data-suggest="susten"] [data-pass-maybe]')).toContainText(/[89]\d\d m/);
  await expect(root.locator('[data-suggest="susten"] [data-pass-take]')).toHaveText(T('Yes, rode it'));
  await expect(root.locator('[data-pass-all]')).toHaveCount(0); // only one sure pass: no «Collect all»
  await noSideways(page);
  await shot(page, info, 'PR1-paesse-sammeln');
  await root.locator('[data-suggest="furka"] [data-pass-take]').click();
  await root.locator('[data-suggest="susten"] [data-pass-take]').click();
  await expect(root.locator('[data-suggest]')).toHaveCount(0);
  await expect(root.locator('[data-pass="p-susten"] [data-pass-sign]')).toContainText('Susten');
  expect(errors).toEqual([]);
});

// a day trip with a line 900 m north of the Klausenpass top (46.8686, 8.8546)
const LINE = [[46.9, 8.7], [46.885, 8.78], [46.8767, 8.83], [46.8767, 8.8546], [46.8767, 8.885], [46.88, 8.93], [46.921, 8.997]];
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const dayBefore = (n) => ((d) => (d.setUTCDate(d.getUTCDate() - n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));

test('Neuland: a pass 900 m from the line is listed as maybe ridden; yes ticks it, not there sends it away', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/neuland');
  await ready(page);
  await page.evaluate(
    (rows) =>
      new Promise((ok, bad) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => bad(r.error);
        r.onsuccess = () => {
          const tx = r.result.transaction('trips', 'readwrite');
          for (const row of rows) tx.objectStore('trips').put(row);
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
      }),
    [{ id: `${A}klausen`, title: `${SHOTS ? '' : A}Klausen-Runde`, domain: 'bikepacking', startDate: dayBefore(20), days: 1, status: 'done', entries: [], route: { name: `${A}Klausen`, km: 80, line: LINE } }],
  );
  await page.reload();
  await ready(page);
  const main = page.locator('main');
  await main.getByRole('group', { name: T('Collections') }).getByRole('button', { name: new RegExp(`^${T('Alpine passes')}`) }).click();
  const maybe = main.locator('[data-nl-maybe]');
  await expect(maybe).toBeVisible();
  await noSideways(page);
  await shot(page, info, 'PR2-neuland-vielleicht');
  await main.getByPlaceholder(T('Search in {name}', { name: T('Alpine passes') })).fill('Klausen'); // the list shows only its first rows
  await expect(maybe.locator('[data-maybe="p-klausenpass"]')).toContainText('Klausenpass');
  await expect(maybe.locator('[data-maybe="p-klausenpass"]')).toContainText(/[89]\d\d m/);
  await expect(main.getByRole('list', { name: T('Alpine passes') }).locator('li', { hasText: 'Klausenpass' }).locator('button.tk[aria-pressed=false]')).toBeVisible();
  // yes: it counts, the box goes
  await maybe.locator('[data-maybe-yes]').click();
  await expect(main.locator('[data-nl-maybe]')).toHaveCount(0);
  await expect(main.getByRole('list', { name: T('Alpine passes') }).locator('li', { hasText: 'Klausenpass' }).locator('button.tk[aria-pressed=true]')).toBeVisible();
  // untick it again by hand, then «not there» on a second reload does not bring it back as a maybe
  await main.getByRole('list', { name: T('Alpine passes') }).locator('li', { hasText: 'Klausenpass' }).locator('button.tk').click();
  await expect(main.locator('[data-nl-maybe]')).toHaveCount(1);
  await main.locator('[data-maybe-no]').click();
  await expect(main.locator('[data-nl-maybe]')).toHaveCount(0);
  await page.reload();
  await ready(page);
  await main.getByRole('group', { name: T('Collections') }).getByRole('button', { name: new RegExp(`^${T('Alpine passes')}`) }).click();
  await expect(main.locator('[data-nl-maybe]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
