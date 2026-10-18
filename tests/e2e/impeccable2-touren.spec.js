// Impeccable 18.10.2026, Runde 2, Gruppe 1 «Heute und Touren» (Noah 21:46 «alle Vorschläge angenommen»), with the
// fictional Gesamttest data:
// - Touren 1: a trip on the way leads the band («Unterwegs · Tag n von m», «Unterwegs öffnen»); the pack draft
//   moves to its row in «Geplant».
// - Touren 2: «Keine Fahrt verknüpft» is said once above the list, not in every card.
// German UI, Europe/Zurich, service workers blocked.
import { test, expect } from '@playwright/test';
import { settle } from './settle.js';
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
  // Touren 2: one line above the list, no card repeats it
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
