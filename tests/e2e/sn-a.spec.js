// SN1 Unterwegs and SN6 Funktionen (mockup round «Seiten neu», Noah 13.10.2026 «ich gebe alle bild mockups
// frei», questions per ★): Unterwegs with the pill «Geplant · unterwegs, Tag 2 von 3», the «Jetzt» card with
// four tiles, «Notiz» as the main button and «Tour beenden …» in «…» (the main button on the last day);
// «Was die App alles kann» with «Neu für dich», 3 quiet rows per card, the row takes you there, the rest in «…».
// Fictional fixture (test_data_gtp_), German, phone + desktop, no horizontal scroll.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
// the fixture: a 3-day trip running from 8 October
const RUNNING = 'test_data_gtp_trip24';
const SHOTS = '/tmp/claude-0/sn-shots/sn-a';

async function start(page, context, clock, trip = null) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  // a fixed time in Europe/Zurich, so the day of the trip does not drift
  await page.clock.setFixedTime(new Date(clock));
  await page.goto('./');
  await importAndSettle(page, FIX);
  if (trip) await page.evaluate((x) => localStorage.setItem('pack.currentTrip', x), trip);
}

async function fits(page, info) {
  expect(await wide(page)).toBeLessThanOrEqual(0);
  if (info.project.name === 'phone') {
    await page.setViewportSize({ width: 320, height: 760 });
    await expect.poll(() => page.evaluate(() => innerWidth)).toBe(320);
    expect(await wide(page)).toBeLessThanOrEqual(0);
    await page.setViewportSize({ width: 390, height: 844 });
  }
}

async function shot(page, info, name) {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
}

test('SN1 Unterwegs: pill with the day, «Jetzt» card, «Notiz» main button, «Tour beenden» in «…»', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // day 2 of 3, early afternoon
  await start(page, context, '2026-10-09T13:00:00+02:00', RUNNING);
  await page.goto('./#/ride');
  await page.reload();
  const band = page.locator('.trip-band');
  // the day is in the state pill, no kicker line of its own
  await expect(band.locator('.kline')).toContainText(T('Planned|state'));
  await expect(band.locator('.kline')).toContainText(T('Day {n} of {total}', { n: 2, total: 3 }));
  await expect(band.locator('.kick')).toHaveCount(0);
  // the days as a quiet switch, today pressed
  const days = page.getByRole('group', { name: T('Days') });
  await expect(days.getByRole('button')).toHaveCount(3);
  await expect(days.getByRole('button').nth(1)).toHaveAttribute('aria-pressed', 'true');
  // the «Jetzt» card: time and stage on top, four tiles
  const now = page.locator('section.now');
  await expect(now.locator('h2')).toContainText(T('Now'));
  await expect(now.locator('h2')).toContainText(T('Stage {n}, start {time}', { n: 2, time: '' }).trim());
  await expect(now.locator('.tiles li')).toHaveCount(4);
  for (const lab of ['Wear', 'Eat', 'Drink', 'Light']) await expect(now.locator('.tiles').getByText(T(lab), { exact: true })).toBeVisible();
  await expect(now.locator('details.allb > summary')).toContainText(T('All blocks of the day'));
  await now.getByRole('button', { name: T('How this is worked out') }).click();
  await expect(now.locator('.howp')).toBeVisible();
  await expect(page.getByRole('heading', { name: T('Weather on the way') })).toBeVisible();
  // right: the note, tonight's charging with «Alle geladen», «Mehr» as one card
  await expect(page.getByRole('region', { name: T('Note for the debrief') })).toContainText(T('lands in the debrief, nothing to fill in'));
  const charge = page.getByRole('region', { name: T('Charge tonight') });
  await expect(charge.getByRole('button', { name: T('All charged') })).toBeVisible();
  const more = page.getByRole('region', { name: T('More') });
  // Paket K added «Wasser und Essen», «Sonne, Mond und Orte», «Strecke für andere Geräte» after the evening
  await expect(more.locator('.mlist > details')).toHaveCount(6);
  await expect(more.locator('.mlist > details').nth(0)).toContainText(T('every item and its bag'));
  await expect(more.locator('.mlist > details').nth(2)).toContainText(T('Evening'));
  // one main button: «Notiz», no «Weiter …»; on the phone the day sits next to it
  await expect(band.locator('.btn.hi')).toHaveCount(1);
  await expect(band.locator('.btn.hi.go')).toHaveCount(0);
  const note = band.locator('.notego');
  await expect(note).toHaveText(T('Note|ride'));
  await expect(band.locator('.mainbar')).toContainText(T('Day {n} of {total}', { n: 2, total: 3 }));
  await expect(band.locator('.mainbar')).toContainText(T('Tomorrow: stage {n}', { n: 3 }));
  await shot(page, info, 'SN1-unterwegs');
  await fits(page, info);
  await note.click();
  const box = page.locator('.notesec textarea');
  await expect(box).toBeFocused();
  await box.fill('test_data_gtp_ Kette quietscht');
  await page.locator('.notesec').getByRole('button', { name: T('Save note') }).click();
  await expect(page.locator('.notesec .notes')).toContainText('test_data_gtp_ Kette quietscht');
  // «Tour beenden …» is in «…» and asks first
  await band.getByRole('button', { name: T('More for this trip') }).click();
  await page.getByRole('menuitem', { name: new RegExp(esc(T('End the trip …'))) }).click();
  const sheet = page.locator('dialog.endsheet');
  await expect(sheet.getByRole('heading', { name: T('End the trip now?') })).toBeVisible();
  await sheet.getByRole('button', { name: T('Ride on') }).click();
  await expect(sheet).toBeHidden();
  expect(errors).toEqual([]);
});

test('SN1 Unterwegs on the last day: «Letzten Tag abschliessen» is the main button, «Notiz» moves into «…»', async ({ page, context }, info) => {
  await start(page, context, '2026-10-10T10:00:00+02:00', RUNNING);
  await page.goto('./#/ride');
  await page.reload();
  const band = page.locator('.trip-band');
  await expect(band.locator('.btn.hi.go')).toBeVisible();
  await expect(band.locator('.notego')).toHaveCount(0);
  await band.getByRole('button', { name: T('More for this trip') }).click();
  await expect(page.getByRole('menuitem', { name: new RegExp(esc(T('End the trip …'))) })).toHaveCount(0);
  await page.getByRole('menuitem', { name: new RegExp(`^${esc(T('Note|ride'))}`) }).click();
  await expect(page.locator('.notesec textarea')).toBeFocused();
  await fits(page, info);
});

test('SN6 Funktionen: «Neu für dich», 3 quiet rows per card, the row takes you there, «…» with Hinbringen and Ausprobieren', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, '2026-10-09T10:00:00+02:00');
  await page.goto('./#/features');
  await expect(page.getByRole('heading', { name: T('Help and functions'), level: 1 })).toBeVisible();
  await expect(page.locator('.vhead [aria-current="page"]')).toHaveText(T('What the app can do|crumb')); // Impeccable Runde 2: the path like the title
  await expect(page.locator('.vhead .vsub')).toContainText(T('tap to go there'));
  // SN6+ (answer 1b, intended change): «Neu für dich» is replaced by «Neu seit deinem letzten Besuch»;
  // its debrief and playground tips stand in «Passt gerade» (at most three tips)
  await expect(page.getByRole('region', { name: T('New for you') })).toHaveCount(0);
  const tips = page.getByRole('region', { name: T('New since your last visit') });
  // Impeccable Runde 2 (on purpose): with nothing new since the last visit the block stays away
  await expect(tips).toHaveCount(0);
  const n = await page.getByRole('region', { name: T('Fits right now') }).locator('[data-fit]').count();
  expect(n).toBeGreaterThan(0);
  expect(n).toBeLessThanOrEqual(3);
  // six cards, three rows each at most, no orange «Noch nie benutzt» pill and no row buttons
  const groups = page.locator('section[data-group]');
  await expect(groups).toHaveCount(6);
  for (const g of await groups.all()) expect(await g.locator('[data-feature]').count()).toBeLessThanOrEqual(3);
  await expect(page.locator('.fnever')).toHaveCount(0);
  await expect(page.locator('.fgo')).toHaveCount(0);
  // Impeccable Runde 2: the state in words in every row, no circle to guess
  await expect(page.locator('.legend')).toContainText(T('Used ones move down. Under «…»: how it works, and try it in the playground.'));
  for (const r of await page.locator('[data-feature]').all()) await expect(r.locator('.fstate')).toHaveText(new RegExp(`^(${T('used|features')}|${T('new for you')})$`));
  // the situation and page switch stays
  await page.getByRole('button', { name: T('By page'), exact: true }).click();
  await expect(groups).toHaveCount(5);
  await page.getByRole('button', { name: T('By situation'), exact: true }).click();
  await expect(groups).toHaveCount(6);
  if (info.project.name === 'phone') {
    for (const b of await page.locator('main .fmain, main .ma .dots, main .fall, main [data-fit] .btn').all()) expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);
  }
  await shot(page, info, 'SN6-funktionen');
  await fits(page, info);
  // «…» of a row: «Hinbringen» and «Ausprobieren»
  await page.getByLabel(T('Find a function')).fill('basischeck');
  await expect(tips).toHaveCount(0);
  const base = page.locator('[data-feature="f.basecheck"]');
  await base.getByRole('button', { name: T('More for {title}', { title: T('Basic check before every ride') }) }).click();
  await expect(page.getByRole('menuitem', { name: new RegExp(esc(T('Take me there'))) })).toBeVisible();
  await page.getByRole('menuitem', { name: new RegExp(esc(T('Try it'))) }).click();
  const sheet = page.locator('dialog.playsheet');
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: T('Close') }).click();
  await expect(sheet).toBeHidden();
  // a tap on the row takes you there
  await page.getByLabel(T('Find a function')).fill('garantie');
  await page.locator('[data-feature="f.warranty"] .fmain').click();
  await expect(page).toHaveURL(/#\/bikes\?bike=test_data_gtp_[^&]+&sheet=warranty/);
  expect(errors).toEqual([]);
});
