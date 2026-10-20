// 0.155.0 «Heute neu geordnet» (HN4, Noah 14.10.2026 21:51 «1a 2a 3a 4b HN4 freigegeben»; HN4b 22:13 «HN4b
// freigegeben»): the new order of Heute in the real app. Meditation card, day card (morning, day, the clock),
// «Important today» in one line, Im Flow with the compact balance, the trip card moving up the day before a
// trip (4b), Aktiv over the whole row, «Connect Strava» at the bottom. And the four points of the release
// analysis: the round only once, no empty ring, Quick start high, «Try it» not cut off at 390 px.
// Fictional data only (test_data_gtp_), Friday 9 October 2026 (Europe/Zurich), Open-Meteo mocked.
// SHOTS=<folder> saves full-page screenshots (light) of the morning, the day and the day before a trip.
import { test, expect } from '@playwright/test';
import { homeFixture, openHome, D0, atHour } from './home0460-fixture.js';
import { READY, REMOVED_0155, HEAD_0155, HELPER_TILES, tripUp } from '../../src/lib/home/tiles.js';
import { HN4, withWall } from './wall-fixture.js';

// «Heute neu» A «Ein Blick» (0.165.0, Noah 20.10.2026 «1A … 3a») replaced HN4 as the ready wall. The HN4 tiles
// (meditation card, day card, Im Flow + balance, Aktiv …) stay in the catalog: these tests run on a device
// that keeps the HN4 wall, the last one checks that an old stored wall becomes the new ready wall once.

/** The fixture without the trip of tomorrow: the ordinary order (the next trip is in 5 days). */
function noTripTomorrow() {
  const data = withWall(homeFixture());
  data.tables.trips = data.tables.trips.filter((x) => !x.id.endsWith('Herbstrunde'));
  return data;
}
const order = (page) => page.locator('.wall [data-tile]').evaluateAll((els) => els.map((e) => e.dataset.tile));

async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
}

/** Where an element starts, as a share of the page height (0 … 1). */
const share = (loc) => loc.evaluate((el) => (el.getBoundingClientRect().top + window.scrollY) / document.documentElement.scrollHeight);

test('morning: meditation, day card Morgen, Important today in one line, the HN4 order; the round once; Quick start high', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { data: noTripTomorrow(), hour: 8 });
  await expect(page.locator('[data-daycard]')).toHaveAttribute('data-part', 'morning');

  // the wall in the order of HN4 (the helper is hidden while the AI helper is off)
  // Paket Q #74: at 08:00 the morning tiles move up right under the head (byTime, changed on purpose)
  await expect.poll(() => order(page)).toEqual(atHour(HN4().filter((x) => x.id !== 'helper'), 8).map((x) => x.id));
  expect((await order(page)).slice(0, 3)).toEqual(HEAD_0155);
  for (const id of REMOVED_0155) await expect(page.locator(`.wall [data-tile="${id}"]`), id).toHaveCount(0);

  // 1a: the small meditation card; 2a: «Important today» one line right under the day card
  await expect(page.locator('[data-med-card]')).toBeVisible();
  const imp = page.locator('[data-tile="important"] .imp.ln');
  await expect(imp).toBeVisible();
  const n = await imp.locator('li.row').count();
  expect(n).toBeLessThanOrEqual(2);
  const more = imp.locator('button.more');
  if (await more.count()) {
    await more.click();
    await expect(imp).toHaveClass(/open/);
    expect(await imp.locator('li.row').count()).toBeGreaterThan(2);
    await more.click();
  }

  // release analysis D3: «Morgen-Runde» / «Wi gaht's?» only once on Heute (in the day card); its start goes to the
  // morning page (Noah 18.10.2026 «1 a und b», changed on purpose)
  await expect(page.locator('[data-section="morningcheck"]')).toHaveCount(1);
  await expect(page.locator('[data-daycard] [data-section="morningcheck"]')).toHaveCount(1);
  await expect(page.locator('[data-check-entry]')).toHaveCount(0);
  await expect(page.locator('[data-daycard] [data-section="morningcheck"]')).toHaveAttribute('href', '#/check/morning');
  await expect(page.locator('main').getByText(/Morgen-Runde|Morning round/)).toHaveCount(1);

  // release analysis D8: no answers yet: no ring with «–», one quiet line
  const bal = page.locator('[data-section="balance"]');
  await expect(bal.locator('[data-balance-empty]')).toBeVisible();
  await expect(bal.locator('svg.ring')).toHaveCount(0);
  // «Im Flow + Balance» 2a (Noah 15.10.2026 «1-5a», changed on purpose): a piece without content stays away;
  // the milestone of the fixture's bikes is there
  await expect(bal.locator('[data-pc="milestone"]')).toBeVisible();
  for (const pc of ['challenge', 'inspiration', 'body']) await expect(bal.locator(`[data-pc="${pc}"]`), pc).toHaveCount(0);
  await expect(bal.getByText(/Mehr Ideen/)).toHaveCount(0); // waits for 0.158.0

  // 4a: Im Flow and the balance one card with one head, over the whole row; on a computer side by side
  const fb = page.locator('.wall > [data-tile="flow"]');
  await expect(fb).toHaveAttribute('data-size', 'long');
  await expect(fb.getByRole('heading', { name: T('In the flow + balance') })).toBeVisible();
  await expect(fb.locator('[data-tile="balance"] [data-section="balance"]')).toBeVisible();
  await expect(page.locator('.wall > [data-tile="balance"]')).toHaveCount(0);
  if (info.project.name === 'desktop') {
    const f = await fb.locator('.main').boundingBox();
    const b = await fb.locator('.aside').boundingBox();
    expect(Math.abs(f.y - b.y)).toBeLessThan(2);
    // Noah 18.10.2026 «2b» (T3b, changed on purpose): the big ring comes first, Im Flow beside it
    expect(f.x).toBeGreaterThan(b.x + b.width - 2);
  }

  // Aktiv over the whole row, without resting pulse and zone minutes (HN4b 3a); the shortcuts lead into Aktiv
  const ak = page.locator('[data-tile="aktiv"] [data-section="aktiv"]');
  await expect(ak).toBeVisible();
  await expect(ak.getByText(/Ruhepuls|Resting pulse|Aktivzonen|zone min/)).toHaveCount(0);
  await expect(ak.locator('a[href="#/flow/week"]')).toBeVisible();

  // release analysis F2 «Quick start high on the page»: since «Heute neu» A on the ready wall (heute-a.spec.js HA1)
  await expect(page.locator('[data-section="today"] li[data-row="idea"]')).toHaveCount(1);

  // «Connect Strava» under the wall, at the bottom
  const sc = page.locator('[data-section="strava-connect"]');
  if (await sc.count()) {
    const wallBottom = await page.locator('.wall').evaluate((el) => el.getBoundingClientRect().bottom + window.scrollY);
    const top = await sc.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    expect(top).toBeGreaterThan(wallBottom - 1);
  }
  await shot(page, info, 'heute-morgen');
  expect(errors).toEqual([]);
});

test('day: the day card Tag with Quick start, Plan a trip and the bikes; the clock shows another part on a tap', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: noTripTomorrow(), hour: 13 });
  const dk = page.locator('[data-daycard]');
  await expect(dk).toHaveAttribute('data-part', 'day');
  await expect(dk.locator('[data-daycard-quick]')).toBeVisible();
  await expect(dk.locator('[data-cell="bikes"] li')).toHaveCount(4);
  // the round is not in the card by day, and not anywhere else either
  await expect(page.locator('[data-section="morningcheck"]')).toHaveCount(0);
  await expect(page.locator('[data-check-entry]')).toHaveCount(0);
  // the trip card in its place after the milestones (the next trip is in 5 days)
  await expect.poll(async () => { const ids = await order(page); return ids.indexOf('trip') - ids.indexOf('milestones'); }).toBe(1);
  await shot(page, info, 'heute-tag');
  // a tap on «Abend» shows the evening, «Tag» again is now
  await dk.locator('[data-clock="evening"]').click();
  await expect(dk).toHaveAttribute('data-part', 'evening');
  await expect(dk.locator('[data-cell="km"]')).toBeVisible();
  await dk.locator('[data-clock="day"]').click();
  await expect(dk).toHaveAttribute('data-part', 'day');
  expect(errors).toEqual([]);
});

test('4b: the day before a trip its card stands right under the day card; base weight big, all in a small line', async ({ page, context }, info) => {
  await openHome(page, context, info, { hour: 13, data: withWall(homeFixture()) }); // the fixture: «Herbstrunde» tomorrow
  // the wall fills in after the first paint: compare with expect.poll
  await expect.poll(async () => (await order(page)).slice(0, 4)).toEqual(['meditation', 'daycard', 'trip', 'important']);
  const card = page.locator('[data-tile="trip"] section.trip');
  await expect(card.locator('#next-h')).toHaveText('test_data_gtp_ Herbstrunde');
  // HN0 check H1: the base weight in a box, «mit Essen, Wasser, Getragenem» in a small line
  const w = card.locator('[data-weight]');
  await expect(w).toBeVisible();
  await expect(w.locator('.ws')).toContainText(/mit Essen, Wasser, Getragenem/);
  // HN0 check H2: «… 3 fällig» style in Important today (no «Punkte»)
  await expect(page.locator('[data-section="today"]')).not.toContainText(/Punkte? fällig/);
  await shot(page, info, 'heute-vor-tour');
});

test('a stored wall of before (v 4) gets the new order once; Try it of a wide New tile is not cut off', async ({ page, context }, info) => {
  const data = homeFixture();
  data.tables.trips = data.tables.trips.filter((x) => !x.id.endsWith('Herbstrunde'));
  const old = ['trip', 'important', 'flow', 'balance', 'morningcheck', 'suggest', 'week', 'news', 'try', 'meditation', 'fn:dayride', 'fn:weigh', 'year'];
  data.tables.settings.push({ key: 'homeWall', value: { v: 4, tiles: old.map((id) => ({ id, size: id === 'news' ? 'w' : id === 'trip' || id === 'year' || id === 'important' ? (id === 'important' ? 'l' : 'long') : id === 'meditation' || id.startsWith('fn:') ? 's' : 'l' })) } });
  await openHome(page, context, info, { data, hour: 13 });
  // Tages-Check back: «Deine 15 Fragen» after the balance; Routine «Das tut mir gut»: the routine once, under the tiles on top
  // «Heute neu» A (homeWall v 9, changed on purpose): every wall stored before becomes the new ready wall once
  await expect.poll(() => order(page)).toEqual(atHour(tripUp(READY.filter((x) => !HELPER_TILES.includes(x.id)), false), 13).map((x) => x.id));
  // put «New» wide on a wall of the user (as it was) and check its button stays inside the tile at 390 px too
  const v5 = { v: 10, tiles: HN4().map((x) => (x.id === 'news' ? { ...x, size: 'w' } : x)) };
  await page.evaluate(async (value) => {
    const req = indexedDB.open('pack-generator');
    const db = await new Promise((r) => (req.onsuccess = () => r(req.result)));
    const tx = db.transaction('settings', 'readwrite');
    tx.objectStore('settings').put({ key: 'homeWall', value });
    await new Promise((r) => (tx.oncomplete = r));
    db.close();
  }, v5);
  await page.reload();
  const tile = page.locator('[data-tile="news"] section.news');
  await expect(tile).toBeVisible();
  const btn = tile.locator('.acts a.btn.hi');
  await expect(btn).toBeVisible();
  const tb = await tile.boundingBox();
  const bb = await btn.boundingBox();
  expect(bb.x).toBeGreaterThanOrEqual(tb.x - 0.5);
  expect(bb.x + bb.width).toBeLessThanOrEqual(tb.x + tb.width + 0.5);
  expect(await btn.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  expect(D0).toBe('2026-10-09');
});

test('Im Flow + Balance (1-5a): full names, the tip as today\'s goal and back, the tap help 5 times', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const data = noTripTomorrow();
  const vals = { erholung: 7, spass: 6, sport: 8, achtsamkeit: 3, freunde: 5, natur: 7, visionen: 4, ziele: 6, erreicht: 7 };
  data.tables.abAnswers = Object.entries(vals).map(([area, value]) => ({ id: `test_data_gtp_ab_${area}`, qid: `${area}.demo`, area, day: D0, at: `${D0}T08:00`, slot: null, kind: 'scale', value, note: null, unit: null, src: 'hand' }));
  const T = await openHome(page, context, info, { data, hour: 13 });
  const bal = page.locator('[data-section="balance"]');
  await expect(bal.locator('svg.ring')).toBeVisible();

  // 1a: every name of the 9 areas in full (also on a phone); Noah 18.10.2026 «2b» (T3b, changed on purpose): around
  // the big ring, each name inside the picture; the three small Im-Flow rings make room for it
  await expect(bal.locator('[data-balance-big]')).toBeVisible();
  await expect(page.locator('[data-section="flow"] .rg')).toHaveCount(0);
  const names = bal.locator('[data-cat] .lb');
  await expect(names).toHaveCount(9);
  const box = await bal.locator('svg.ring').boundingBox();
  for (const el of await names.all()) {
    const b = await el.boundingBox();
    expect(b.x).toBeGreaterThanOrEqual(box.x - 0.5);
    expect(b.x + b.width).toBeLessThanOrEqual(box.x + box.width + 0.5);
  }
  await shot(page, info, 'heute-ring-gross');

  // 5a: a tap on the tip takes it as today's goal («Wi gaht's?»), a second tap takes it back
  const tip = bal.locator('[data-tip-goal]');
  await expect(tip).toContainText(T('Ten minutes of meditation?'));
  await expect(tip).toHaveAttribute('aria-pressed', 'false');
  await tip.click();
  await expect(tip).toHaveAttribute('aria-pressed', 'true');
  await expect(tip).toContainText(T('Your goal for today · tap to take it back'));
  const goals = () =>
    page.evaluate(async () => {
      const req = indexedDB.open('pack-generator');
      const db = await new Promise((r) => (req.onsuccess = () => r(req.result)));
      const rows = await new Promise((r) => {
        const q = db.transaction('abAnswers').objectStore('abAnswers').getAll();
        q.onsuccess = () => r(q.result);
      });
      db.close();
      return rows.filter((x) => x.qid === 'ziele.ziel').map((x) => x.value);
    });
  await expect.poll(goals).toEqual([T('Ten minutes of meditation?')]);
  await tip.click();
  await expect(tip).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(goals).toEqual([]);

  // 3a: the help line under «Heute noch» the first 5 times, then not any more
  const help = page.locator('[data-section="flow"] [data-tick-help]');
  await expect(help).toBeVisible();
  await page.evaluate(() => localStorage.setItem('flowTickHelpSeen', '4'));
  await page.reload();
  await expect(page.locator('[data-section="flow"]')).toBeVisible();
  await expect(help).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-section="flow"]')).toBeVisible();
  await expect(help).toHaveCount(0);
  expect(errors).toEqual([]);
});
