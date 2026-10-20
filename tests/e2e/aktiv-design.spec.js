// v0.105.0 Design-Refresh P8 «Aktiv» (A1–A14c, mockups runde14–18): the redrawn Aktiv pages on a phone
// and a computer, in German, with a fixed clock and 13 weeks of fictional data (aktiv-fixture.js).
// 1. Every page: one h1, the crumb, no sideways scroll, no page error.
// 2. A1 Aktiv heute: «Heute abhaken» with «x von y im Soll», «Mehr» without the tabs, the tab «Ziele»; A5 Ziele: rows with 7 dots, the goal path.
// 3. A7 Aktivität: «Vorschlag für heute» is a suggestion tile; a choice becomes a challenge that counts.
// 4. A8 Meilensteine: «Bald erreichbar» as rows, the trophy shelf.
// 5. A13 Mehr zur Meditation: 7 folds, Vorlagen first; «Heute vielleicht» as a suggestion tile, «Heute nicht».
// 6. A14 Logbuch: Übersicht (the month, 7 days, a day in the calendar opens its sessions) and Liste;
//    old links (view=cal) open the overview. A14c Muster: records, time of day, what helped.
// Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { HELPED } from '../../src/lib/flowmed.js';
import { SEED2_KEY } from '../../src/lib/flowtiles.js';
import { D0, TODAY, aktivRows, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  await put(page, aktivRows());
  return errors;
}
async function go(page, hash) {
  await page.goto(`./${hash}`);
  await page.reload();
  await ready(page);
  await expect(page.locator('main h1')).toHaveCount(1);
}
async function fits(page, where) {
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: no sideways scroll`).toBeLessThanOrEqual(w);
}

test('Aktiv pages: one look, no sideways scroll, no page error', async ({ page, context }) => {
  test.setTimeout(120_000);
  const errors = await open(page, context);
  const main = page.locator('main');
  const pages = [
    ['#/flow', T('Analysis|place')], // N1 «Neue Leiste»: the page is titled «Auswerten»
    ['#/flow/goals', T('Activities|flow')],
    ['#/flow/activity', null],
    ['#/flow/milestones', T('Milestones')],
    ['#/flow/act/meditation/mehr', T('More about meditation')],
    ['#/flow/act/meditation/log', T('Logbook')],
    ['#/flow/act/meditation/muster', T('Patterns')],
  ];
  for (const [hash, h1] of pages) {
    await go(page, hash);
    if (h1) await expect(main.locator('h1')).toHaveText(h1);
    await fits(page, hash);
  }
  expect(errors).toEqual([]);
});

test('A1 and A5: tick tiles, rings, the tab «Ziele» opens the goals with dots and the goal path', async ({ page, context }) => {
  const errors = await open(page, context);
  const main = page.locator('main');
  await go(page, '#/flow');
  await expect(main.getByRole('heading', { level: 2, name: T('Tick off today') })).toBeVisible();
  // Impeccable (18.10.2026, distill): «Mehr» no longer repeats the tabs; «Noch offen heute» is one count under «Heute abhaken»
  const more = main.locator('section[aria-labelledby="more-h"]');
  await expect(more.locator('[data-row="timer"]')).toBeVisible();
  await expect(more.locator('[data-row="goals"], [data-row="med"], [data-row="activity"]')).toHaveCount(0);
  await expect(main.locator('#open-h')).toHaveCount(0);
  // Impeccable runde 2 (clarify): the head line says how the move goals stand (the ring's count), not «Heute, …»
  await expect(main.locator('[data-today-line]')).toContainText(new RegExp(T('this week {k} of {n} move goals on track', { k: '\\d+', n: '\\d+' })));
  await expect(main.locator('[data-today-line]')).not.toContainText(T('Today, {date}', { date: '' }).trim());
  await expect(main.locator('section[aria-labelledby="tick-h"] .sh p')).toHaveText(new RegExp(`^${T('{n} of {m} activities on track', { n: '\\d+', m: '\\d+' })} · `));
  await page.locator('.ptabs').getByRole('link', { name: T('Activities|tab'), exact: true }).click();
  await expect(page).toHaveURL(/#\/flow\/goals$/);
  const row = main.locator('li[data-row="meditation"]');
  await expect(row.locator('.d7 i')).toHaveCount(7);
  await expect(main.locator('svg').filter({ has: page.locator('clipPath') }).first()).toBeVisible();
  await fits(page, 'A5');
  // Impeccable (layout): on a phone «Stoppuhr ›» sits in the head of «Heute abhaken»; nothing floats over the tiles
  await page.setViewportSize({ width: 390, height: 844 });
  await go(page, '#/flow');
  await main.locator('section[aria-labelledby="tick-h"]').getByRole('button', { name: T('Stopwatch'), exact: true }).click();
  await expect(page.locator('dialog.tsheet[open]')).toBeVisible();
  await expect(page.locator('.fmini')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('A7: «Vorschlag für heute» is a suggestion tile and any choice can become a challenge', async ({ page, context }) => {
  const errors = await open(page, context);
  const main = page.locator('main');
  await go(page, '#/flow/activity');
  // seed 2 (the playful names, flowdb ensureSeed2) runs once after the first open and renames «Sauna» to
  // «Schwitz-Pause» a moment later; wait for it, then open again, so the chip read below keeps its name
  await expect.poll(() => page.evaluate((key) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => { const q = r.result.transaction('settings').objectStore('settings').get(key); q.onsuccess = () => { r.result.close(); ok(!!q.result?.value); }; };
  }), SEED2_KEY)).toBe(true);
  await go(page, '#/flow/activity');
  const tile = main.locator('[data-suggest]');
  await expect(tile).toBeVisible();
  // Impeccable runde 2 (distill): first the one suggestion; «Anderer Vorschlag ›» opens the alternatives
  await expect(tile.getByRole('group', { name: T('Alternatives') })).toHaveCount(0);
  await tile.getByRole('button', { name: T('Another suggestion') }).click();
  const chips = tile.getByRole('group', { name: T('Alternatives') }).locator('button[aria-pressed]');
  expect(await chips.count()).toBeGreaterThan(0);
  const pick = (await chips.first().textContent()).trim();
  await expect(chips.first()).toHaveAttribute('aria-pressed', 'true');
  await tile.getByRole('button', { name: T('Set «{what}» as a challenge', { what: pick }) }).click();
  const sheet = page.getByRole('dialog', { name: T('Set as a challenge') });
  await sheet.getByLabel(T('How often')).fill('3');
  await sheet.getByRole('button', { name: T('Start challenge') }).click();
  await expect(sheet).toBeHidden();
  await expect(tile.locator('[data-challenge]')).toContainText(T('{n} of {m}', { n: 0, m: 3 }));
  await tile.getByRole('button', { name: T('{what} today: tick off', { what: pick }) }).click();
  await expect(tile.locator('[data-challenge]')).toContainText(T('{n} of {m}', { n: 1, m: 3 }));
  await fits(page, 'A7');
  expect(errors).toEqual([]);
});

test('A8: soon within reach as rows and the trophy shelf', async ({ page, context }) => {
  const errors = await open(page, context);
  const main = page.locator('main');
  await go(page, '#/flow/milestones');
  await expect(main.getByRole('heading', { level: 2, name: T('Soon within reach') })).toBeVisible();
  await expect(main.getByRole('heading', { level: 2, name: T('Trophy shelf') })).toBeVisible();
  await expect(main.getByText(T('Next: {name}', { name: '' }).trim(), { exact: false }).first()).toBeVisible();
  await fits(page, 'A8');
  expect(errors).toEqual([]);
});

test('A13: the folds with Vorlagen first and «Heute vielleicht» as a suggestion tile', async ({ page, context }) => {
  const errors = await open(page, context);
  const main = page.locator('main');
  await go(page, '#/flow/act/meditation/mehr');
  const folds = main.locator('details[data-fold]');
  await expect(folds).toHaveCount(7);
  await expect(folds.first()).toHaveAttribute('data-fold', 'templates');
  await expect(main.locator('details[data-fold][open]')).toHaveCount(0);
  const side = main.getByRole('region', { name: T('Maybe today') });
  const tile = side.locator('[data-suggest]');
  await expect(tile).toBeVisible();
  // the fixture's longest session is 45 min: the minutes challenge asks for 50
  await expect(tile).toContainText(T('Can you do {n} minutes today? Your longest so far: {best}.', { n: 50, best: 45 }));
  await expect(side.locator('a[data-challenge="50"]')).toHaveAttribute('href', /timer\?min=50$/);
  await tile.getByRole('button', { name: T('Set «{what}» as a challenge', { what: T('{n} min', { n: 50 }) }) }).click();
  const sheet = page.getByRole('dialog', { name: T('Set as a challenge') });
  await sheet.getByRole('button', { name: T('Start challenge') }).click();
  await expect(tile.locator('[data-challenge]')).toBeVisible();
  // «Heute nicht» takes the minutes question away for today; the kinds stay
  await side.getByRole('button', { name: T('Not today') }).click();
  await expect(side.locator('a[data-challenge]')).toHaveCount(0);
  await fits(page, 'A13');
  expect(errors).toEqual([]);
});

test('A14 and A14c: the log overview, a day in the calendar, the list and the patterns', async ({ page, context }) => {
  const errors = await open(page, context);
  const main = page.locator('main');
  await go(page, '#/flow/act/meditation/log');
  await expect(main.locator('[data-view="over"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(main.locator('[data-num="min"]')).toBeVisible();
  await expect(main.locator('[data-story]')).toContainText('Fictional: calm after the second gong');
  // a day in the calendar opens its sessions (44 px on a phone)
  const day = main.locator(`button[data-day="${TODAY}"]`);
  if (page.viewportSize().width < 600) expect((await day.boundingBox()).width, 'a day is a 44 px target').toBeGreaterThanOrEqual(43.5);
  await day.click();
  await expect(main.locator('.dh + .rows [data-session]')).toHaveCount(1);
  await fits(page, 'A14 Übersicht');
  // «Ganze Liste» switches to the list, with its filters
  await main.getByRole('button', { name: T('Whole list') }).click();
  await expect(main.locator('[data-view="list"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/log\?view=list$/);
  expect(await main.locator('[data-session]').count()).toBeGreaterThan(5);
  await fits(page, 'A14 Liste');
  // an old link to the calendar opens the overview
  await go(page, '#/flow/act/meditation/log?view=cal');
  await expect(main.locator('[data-view="over"]')).toHaveAttribute('aria-pressed', 'true');
  // A14c from «Muster finden»
  await main.locator('[data-row="muster"] a').click();
  await expect(page).toHaveURL(/#\/flow\/act\/meditation\/muster$/);
  await expect(main.locator('h1')).toHaveText(T('Patterns'));
  await expect(main.locator('[data-rec="longest"]')).toContainText(T('{n} min', { n: 45 }));
  await expect(main.locator('[data-helped="early"]')).toContainText(T(HELPED.find((h) => h.id === 'early').name));
  await fits(page, 'A14c');
  expect(errors).toEqual([]);
});
