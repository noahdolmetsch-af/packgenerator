// Hobby pages, package 1 (mockups A, A2): Aktiv › Aktivität and Meilensteine on a phone and a computer,
// in German. The link from the Aktiv page, the six tiles with their playful names (renamed in the one
// sheet), the tile editor, a suggestion ticked and hidden, an idea added, the milestones counting a
// fictional meditation history (stars kept in flowStars), the filter and own numbers on A2, a reward
// from a fictional wishlist item. No sideways scroll, no page errors. Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { FAV_SEED } from '../../src/lib/flowtiles.js';
import { FUN_IDEAS } from '../../src/lib/flowsugg.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const TODAY = '2026-10-09'; // a Friday; the browser runs in Europe/Zurich
const D0 = `${TODAY}T09:00:00+02:00`;
/** Calendar-day arithmetic on YYYY-MM-DD (never «now + n × 24 h»). */
const addDays = (day, n) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`./${hash}`);
  return errors;
}
/** Write rows straight into the app's IndexedDB (then reload, so the app reads them). */
const put = (page, rows) =>
  page.evaluate(async (rows) => {
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('pack-generator');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    await new Promise((res, rej) => {
      const tx = db.transaction(Object.keys(rows), 'readwrite');
      for (const [t, list] of Object.entries(rows)) for (const x of list) tx.objectStore(t).put(x);
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  }, rows);
const count = (page, table) =>
  page.evaluate(async (table) => {
    const db = await new Promise((res) => {
      const r = indexedDB.open('pack-generator');
      r.onsuccess = () => res(r.result);
    });
    const n = await new Promise((res) => {
      const q = db.transaction(table).objectStore(table).count();
      q.onsuccess = () => res(q.result);
    });
    db.close();
    return n;
  }, table);
async function fits(page, where) {
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: no sideways scroll`).toBeLessThanOrEqual(w);
}

test('Aktivität: the link, six tiles, rename, the editor, a suggestion, an idea', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow');
  const main = page.locator('main');
  await main.locator('a[data-to="activity"]').first().click();
  await expect(page).toHaveURL(/#\/flow\/activity$/);
  await expect(main.getByRole('heading', { level: 1, name: T('Activity|tab') })).toBeVisible();

  // the six favourites with their playful names, in the seed order
  const tiles = main.locator('[data-tile]');
  await expect(tiles).toHaveCount(6);
  await expect(tiles.locator('.tn b')).toHaveText(FAV_SEED.map((f) => f.nickDe));
  await expect(main.getByText(T('Suggestion|tag')).first()).toBeVisible();
  await expect(main.locator('[data-tile="pushups"] .kind')).toHaveText(new RegExp(esc(T('Personal best')), 'i'));
  await fits(page, 'Aktivität');

  // rename a tile in the one rename sheet; the activity keeps its own name
  await main.locator('[data-tile="tennis"]').getByRole('button', { name: T('Rename {name}', { name: 'Filzball' }) }).click();
  const sheet = page.locator('dialog.rename[open]');
  await sheet.locator('input').fill('Gelbe Kugel');
  await sheet.getByRole('button', { name: T('Save'), exact: true }).click();
  await expect(main.locator('[data-tile="tennis"] .tn b')).toHaveText('Gelbe Kugel');
  await expect(main.locator('[data-tile="tennis"] .own')).toContainText('Tennis spielen');

  // change the tiles: Pedal-Glück one up, then done
  await main.getByRole('button', { name: T('Change tiles') }).click();
  await main.getByRole('button', { name: T('Move {name} up', { name: 'Pedal-Glück' }) }).click();
  await expect(tiles.first()).toHaveAttribute('data-tile', 'bike');
  await main.getByRole('button', { name: T('Done'), exact: true }).click();

  // a tile without its own page opens the editor (H29a), and its back link leads here again
  await main.locator('[data-tile="yoga"] a.tl').click();
  await expect(page).toHaveURL(/#\/flow\/edit\/yoga\?from=activity$/);
  await main.getByRole('link', { name: T('Activity|tab') }).click();
  await expect(page).toHaveURL(/#\/flow\/activity$/);

  // a suggestion that is not an activity yet: one tap makes it one and ticks it
  const breath = main.locator('[data-sugg="breath"]');
  await expect(breath).toBeVisible();
  await breath.getByRole('button', { name: T('Tick {name}', { name: 'Atemübung' }) }).click();
  await expect(page.locator('.ftoast')).toContainText(T('{name} ticked', { name: 'Atemübung' }));
  // hide one, then show the hidden ones again
  const first = main.locator('[data-sugg]').first();
  const id = await first.getAttribute('data-sugg');
  await first.getByRole('button', { name: new RegExp(esc(T('Hide {name}', { name: 'XX' })).replace('XX', '.+')) }).click();
  await expect(main.locator(`[data-sugg="${id}"]`)).toHaveCount(0);
  await main.getByRole('button', { name: T('show {n} hidden again', { n: 1 }) }).click();
  await expect(main.locator(`[data-sugg="${id}"]`)).toHaveCount(1);

  // recovery and fun: Sauna and Spaziergang always there, an idea is added and moves up
  await expect(main.locator('[data-always="sauna"]')).toBeVisible();
  await expect(main.locator('[data-always="walk"]')).toBeVisible();
  const nap = FUN_IDEAS.find((i) => i.id === 'nap');
  await main.locator('[data-idea="nap"]').click();
  await expect(page.locator('.ftoast')).toContainText(T('{name} added', { name: nap.nameDe }));
  await expect(main.locator('[data-always="nap"]')).toBeVisible();
  await expect(main.locator('[data-idea="nap"]')).toHaveCount(0);

  // connections: weather and the planned ones
  await expect(main.locator('[data-conn="strava"]')).toContainText(T('planned'));
  await expect(main.getByRole('heading', { name: T('This page can') })).toBeVisible();
  await fits(page, 'Aktivität after the changes');
  expect(errors).toEqual([]);
});

test('Meilensteine: a fictional history counts, stars stay, filter, own numbers, a reward', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow/activity');
  await expect(page.locator('main [data-tile]')).toHaveCount(6); // seeded
  // twelve days of meditation (20 min each) up to today, and one fictional wishlist item
  const log = Array.from({ length: 12 }, (_, i) => {
    const day = addDays(TODAY, -i);
    return { id: `test_fl_${i}`, actId: 'meditation', day, at: `${day}T06:30:00.000Z`, n: 1, min: 20 };
  });
  await put(page, { flowLog: log, items: [{ id: 'test_wish_1', name: 'Fictional trail shoes', nameDe: 'Erfundene Trailschuhe', category: 'clothing', ownership: 'wishlist', qty: 1, weightG: null, domains: [], sets: [], kits: [] }] });
  await page.reload();
  const main = page.locator('main');
  // over all: «Neues ausprobiert» star 1 reached today
  await expect(main.getByText(T('Recently reached'))).toBeVisible();
  await expect(main.locator('.recent')).toContainText(T('Tried something new'));
  await expect.poll(() => count(page, 'flowStars')).toBeGreaterThan(2);

  // A2, filtered to Kissenzeit: Täglich 12 days in a row, next star 3 at 14 (86 %) is «soon»
  await main.getByRole('link', { name: new RegExp(esc(T('all {n} and those per activity ›', { n: 9 }).replace(' ›', ''))) }).click();
  await expect(page).toHaveURL(/#\/flow\/milestones$/);
  await expect(main.getByRole('heading', { level: 1, name: T('Milestones') })).toBeVisible();
  await expect(main.locator('.chips a[aria-current="page"]')).toHaveText(T('All'));
  await main.locator('.chips').getByRole('link', { name: 'Kissenzeit' }).click();
  await expect(page).toHaveURL(/act=meditation/);
  const daily = main.locator('.grid [data-ms="meditation.daily"]').first();
  await expect(daily).toContainText(T('Star {k} · {stage}', { k: 3, stage: T('Devotion|stage') }));
  await expect(main.locator('.mscard.soon[data-ms="meditation.daily"]')).toBeVisible();
  await fits(page, 'Meilensteine');

  // own numbers: 3, 7, 12 → all stars, «Weg»; back to the suggestion
  await main.getByText(T('Change numbers and stages')).click();
  const row = main.locator('[data-tune="meditation.daily"]');
  await row.locator('input.inp').fill('3, 7, 12');
  await row.locator('input.inp').press('Enter');
  await row.locator('input.inp').blur();
  await expect(daily).toContainText(T('All stars · {stage}', { stage: T('Path|stage') }));
  await row.getByRole('button', { name: new RegExp(`^${esc(T('Suggestion: {list}', { list: '' }))}`) }).click();
  // star 3 was reached with the own numbers and stays (stars never get lost): next is star 4 at 30
  await expect(daily).toContainText(T('Star {k} · {stage}', { k: 4, stage: T('Depth|stage') }));

  // a reward from the wishlist on a star
  await main.getByRole('button', { name: T('Choose') }).click();
  await main.getByRole('button', { name: T('Save'), exact: true }).click();
  await expect(main.locator('.rw')).toContainText('Erfundene Trailschuhe');

  // stars stay after a reload, even when the history is gone
  const before = await count(page, 'flowStars');
  await page.evaluate(async () => {
    const db = await new Promise((res) => {
      const r = indexedDB.open('pack-generator');
      r.onsuccess = () => res(r.result);
    });
    await new Promise((res) => {
      const tx = db.transaction('flowLog', 'readwrite');
      tx.objectStore('flowLog').clear();
      tx.oncomplete = res;
    });
    db.close();
  });
  await page.reload();
  await expect(page.locator('main .recent')).toBeVisible();
  expect(await count(page, 'flowStars')).toBe(before);
  expect(errors).toEqual([]);
});
