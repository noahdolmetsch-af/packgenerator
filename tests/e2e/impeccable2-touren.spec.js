// Impeccable 18.10.2026, Runde 2, Gruppe 1 «Heute und Touren» (Noah 21:46 «alle Vorschläge angenommen»), with the
// fictional Gesamttest data:
// - Touren 1: a trip on the way leads the band («Unterwegs · Tag n von m», «Unterwegs öffnen»); the pack draft
//   moves to its row in «Geplant».
// - Touren 2: «Keine Fahrt verknüpft» is said once above the list, not in every card.
// German UI, Europe/Zurich, service workers blocked.
import { test, expect } from './clock.js';
import { STEP_BAR as BAR } from '../../src/lib/stepbar.js'; // Schrittleiste (Noah 26.10.2026 «1b», changed on purpose): the bar's short names
import { settle } from './settle.js';
import { openShort } from './kurz-open.js';
import { fixture, prepare, importBackup, view, tr, sideways } from './gesamttest/lib.js';

const T = tr('de');
const { summary } = fixture();
const TRIP = summary.tripIds;
const phone = (info) => info.project.name === 'phone';
const tap = async (loc, info) => {
  await loc.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  return phone(info) ? loc.tap() : loc.click();
};

let state = null;
test.beforeAll(async ({ browser }, info) => {
  const ctx = await browser.newContext({ baseURL: info.project.use.baseURL, viewport: info.project.use.viewport, timezoneId: 'Europe/Zurich', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await prepare(page, ctx, 'de');
  await page.goto('./');
  await importBackup(page, info, fixture().data, { lang: 'de' });
  await page.waitForTimeout(1500);
  state = info.outputPath('state.json');
  await ctx.storageState({ path: state, indexedDB: true });
  await ctx.close();
});

async function open(browser, info, trip, hash) {
  const ctx = await browser.newContext({ baseURL: info.project.use.baseURL, storageState: state, viewport: info.project.use.viewport, isMobile: phone(info), hasTouch: phone(info), timezoneId: 'Europe/Zurich', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errors = await prepare(page, ctx, 'de');
  await page.goto('./');
  await settle(page);
  if (trip) await page.evaluate((t) => localStorage.setItem('pack.currentTrip', t), trip);
  await view(page, hash);
  return { ctx, page, errors };
}

test('Touren 1 + 2: the trip on the way leads the band; «no ride linked» is said once above the list', async ({ browser }, info) => {
  const { ctx, page, errors } = await open(browser, info, TRIP.tent, '#/trips');
  const band = page.locator('[data-pack-band]');
  await expect(band).toHaveAttribute('data-pack-band', 'ride');
  await expect(band.locator('#pm-h')).toContainText(T('On the way'));
  await expect(band.locator('#pm-h')).toContainText(/Tag \d+ von \d+/);
  const go = band.getByRole('link', { name: new RegExp(T('Open On the way')) });
  await expect(go).toHaveAttribute('href', '#/ride');
  // the pack draft sits at its row in «Geplant», as the way into Packmodus
  const pm = page.locator('section[data-planned] [data-in-pack-mode]');
  if (await pm.count()) await expect(pm.first()).toHaveAttribute('href', '#/pack?day');
  // Touren 2: one line above the list, no card repeats it (on a phone «Handy kurz» folds the Packmodus first)
  await openShort(page);
  await expect(page.locator('[data-no-ride]')).toContainText(/Bei \d+ von \d+ Touren fehlen Zeiten, Tempo und Puls/);
  await expect(page.locator('[data-trip-list]')).not.toContainText('Keine Fahrt verknüpft');
  const help = page.locator('[data-values-help]');
  await expect(help.getByRole('button')).not.toHaveCount(0);
  await expect(page.locator('[data-trip-list] [data-values] button.q')).toHaveCount(0);
  // no sideways scroll of the page (the jump bar of «In Zahlen» is a swipe row on purpose)
  const sw = await sideways(page);
  expect(sw.sw).toBeLessThanOrEqual(sw.w);
  // a tap opens Unterwegs of that trip
  await tap(go, info);
  await expect(page).toHaveURL(/#\/ride/);
  expect(errors).toEqual([]);
  await ctx.close();
});

test('Planen 3: the plan note is one line with the quiet link; the pill says «n weitere Touren offen»', async ({ browser }, info) => {
  const { ctx, page, errors } = await open(browser, info, TRIP.event, '#/pack');
  const note = page.locator('.trip-band .stn');
  await expect(note).toHaveAttribute('data-state', 'plan');
  await expect(note.locator('h2')).toHaveText(T('Everything stays changeable until you set off.'));
  await expect(note.locator('p')).toHaveCount(0);
  const tpl = note.getByRole('button', { name: T('Save as template') });
  await expect(tpl).toHaveClass(/btn-link/);
  // one calm line (on a phone the link may go under it): about half the old box (150 px on a phone)
  expect((await note.boundingBox()).height).toBeLessThan(phone(info) ? 90 : 70);
  await expect(page.locator('.trip-band .pill')).toHaveText(/^\d+ weitere Touren? offen$/);
  const sw = await sideways(page);
  expect(sw.sw).toBeLessThanOrEqual(sw.w);
  expect(errors).toEqual([]);
  await ctx.close();
});

test('Packen 2 + 3: the main button packs the next bag; one count and one name per bag', async ({ browser }, info) => {
  const { ctx, page, errors } = await open(browser, info, TRIP.tent, '#/pack?day');
  const go = page.locator('main .mainbar .btn.hi');
  await expect(go).toHaveAttribute('data-pack-next', '');
  await expect(go).toHaveAccessibleName(/ packen \(\d+ von \d+\)$/);
  // Klick-Rundgang H05: on a phone «Weiter packen» with the bag on a second line, nothing cut with «…»
  if (phone(info)) await expect(go.locator('.gophone')).toContainText(T('Continue packing'));
  // «Packen abschliessen» stays reachable, quietly at the end of the bags
  await expect(page.locator('[data-finish-quiet]')).toHaveText(T('Finish packing'));
  // the bar names both counts (a computer shows the line beside the step)
  if (!phone(info)) await expect(page.locator('main .mainbar .hint')).toHaveText(/^\d+ Teile? (und \d+ Checks? )?fehl(t|en) noch$/);
  // «Gewicht nach Taschen» uses the names of «Taschen», the model small after it
  const bags = (await page.locator('.blist .bt b').allTextContents()).map((s) => s.trim());
  const rows = await page.locator('.wc .rows .nm').evaluateAll((els) => els.map((el) => el.childNodes[0]?.textContent?.trim() ?? ''));
  const own = rows.filter((n) => n !== T('Food and water') && n !== T('On me'));
  expect(own.length).toBeGreaterThan(0);
  for (const n of own) expect(bags).toContain(n);
  // a tap on the main button opens the next bag and brings it into view
  await tap(go, info);
  await expect(page.locator('section.pbag.cur')).toBeInViewport();
  const sw = await sideways(page);
  expect(sw.sw).toBeLessThanOrEqual(sw.w);
  expect(errors).toEqual([]);
  await ctx.close();
});

test('Tour beendet (Heute 2 + 3): the bar as on every trip page; the way behind is ticked', async ({ browser }, info) => {
  const { ctx, page, errors } = await open(browser, info, null, `#/trip/${encodeURIComponent(TRIP.runningDay)}/ended`);
  await expect(page.getByRole('heading', { level: 1, name: T('Trip ended') })).toBeVisible();
  // Heute 3: Unterwegs with ✓, Rückblick the open step; tour critique 5a (Noah 21.10.2026): Packen not ticked
  // to the end is grey «n of m ticked» without the tick
  const steps = page.locator('.stepbar a');
  await expect(steps.filter({ hasText: T(BAR.pack) })).toHaveClass(/past/);
  await expect(steps.filter({ hasText: T(BAR.pack) })).not.toHaveClass(/done/);
  await expect(steps.filter({ hasText: T(BAR.ride) })).toHaveClass(/done/);
  await expect(steps.filter({ hasText: T(BAR.debrief) })).toHaveAttribute('aria-current', 'page');
  // Heute 2: on a computer the step on the left, the quiet link, then the main button on one line
  const bar = page.locator('main .mainbar');
  const go = bar.locator('.btn.hi');
  if (!phone(info)) {
    await expect(bar.locator('.lead')).toContainText(T('Trip ended'));
    const lead = await bar.locator('.lead').boundingBox();
    const g = await go.boundingBox();
    expect(lead.x).toBeLessThan(g.x);
    const second = bar.locator('.second');
    if (await second.count()) expect((await second.boundingBox()).x).toBeLessThan(g.x);
    expect(g.height).toBeLessThan(60);
  }
  expect(errors).toEqual([]);
  await ctx.close();
});

test('Vorlagen 1–3: «einzelne Teile» instead of «Extra»; «Neue Tour» small beside the name; ridden trips first', async ({ browser }, info) => {
  const { ctx, page, errors } = await open(browser, info, null, '#/pack/templates');
  const rows = page.locator('li.row[data-tpl]:not(.arch)');
  await expect(rows.first()).toBeVisible();
  for (const line of await rows.locator('.sm small').allTextContents()) expect(line).not.toMatch(/\bExtra\b/);
  // Vorlagen 2: on a phone too, the button sits beside the name, the row stays low
  const first = rows.first();
  const name = await first.locator('.sm b').boundingBox();
  const btn = await first.getByRole('button', { name: T('New trip') }).boundingBox();
  expect(btn.x).toBeGreaterThan(name.x + 40);
  expect(btn.y).toBeLessThan(name.y + name.height + 20);
  // Vorlagen 3: the ridden trips first, the planned ones under «Noch geplant»
  const src = page.getByRole('region', { name: T('From your trips') });
  await expect(src).toContainText(T('Ridden trips first: they know what you really needed.'));
  const states = await src.locator('li[data-src] .tst').evaluateAll((els) => els.map((el) => el.dataset.state ?? ''));
  const firstPlan = states.indexOf('plan');
  if (firstPlan > 0) {
    expect(states.slice(firstPlan).every((s) => s === 'plan')).toBe(true);
    await expect(src.locator('[data-src-planned]')).toHaveText(T('Still planned'));
  }
  const sw = await sideways(page);
  expect(sw.sw).toBeLessThanOrEqual(sw.w);
  expect(errors).toEqual([]);
  await ctx.close();
});
