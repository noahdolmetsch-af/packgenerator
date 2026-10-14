// v0.106.0 Design-Refresh P5 «Packen und Unterwegs» (T6–T13, approved 12.10.2026): Packen with «Taschen»,
// the open bag and «Gewicht nach Taschen»; «Am Vorabend laden»; «Gepackt» with «Bis zum Start»;
// Unterwegs with the base check, «Der Tag in Blöcken», «Heute Abend laden» and «Mehr»; «Tour jetzt
// beenden?». Fictional fixture (test_data_gtp_), German, phone + desktop, no horizontal scroll.
import { test, expect } from '@playwright/test';
import { endMenu } from './ending.js';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** «{n} von {total} gepackt» with any numbers */
const counted = (en) => new RegExp(esc(T(en)).replace(/\\\{\w+\\\}/g, '\\d+'));
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
// the fixture: a 3-day trip from 14 October (packing), and one running from 8 October
const PACKING = 'test_data_gtp_trip27';
const RUNNING = 'test_data_gtp_trip24';

async function start(page, context, clock, trip) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  // a fixed time in Europe/Zurich, so the day of the trip does not drift
  await page.clock.setFixedTime(new Date(clock));
  await page.goto('./');
  await importAndSettle(page, FIX);
  await page.evaluate((x) => localStorage.setItem('pack.currentTrip', x), trip);
}

/** No horizontal scroll, also on a small phone (320 px). */
async function fits(page, info) {
  expect(await wide(page)).toBeLessThanOrEqual(0);
  if (info.project.name === 'phone') {
    await page.setViewportSize({ width: 320, height: 760 });
    await expect.poll(() => page.evaluate(() => innerWidth)).toBe(320);
    expect(await wide(page)).toBeLessThanOrEqual(0);
  }
}

test('Packen (T6): «Taschen» as one list with the count, the open bag below, «Gewicht nach Taschen»', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, '2026-10-12T10:00:00+02:00', PACKING);
  await page.goto('./#/pack?day');
  await page.reload();
  const bags = page.getByRole('region', { name: T('Bags'), exact: true });
  await expect(bags).toBeVisible();
  await expect(bags.locator('.packed-count')).toHaveText(counted('{n} of {total} packed'));
  await expect(bags).toContainText(T('tap a bag'));
  // the open bag: its items as tap buttons; one tap packs it and the count in the heading goes up
  const open = page.locator('section.pbag.cur');
  await expect(open).toBeVisible();
  const before = Number((await bags.locator('.packed-count').textContent()).match(/\d+/)[0]);
  const item = open.locator('ul.items button[aria-pressed="false"]').first();
  const label = (await item.textContent()).trim();
  await item.click();
  await expect(open.locator('ul.items button').filter({ hasText: label }).first()).toHaveAttribute('aria-pressed', 'true');
  await expect(bags.locator('.packed-count')).toContainText(String(before + 1));
  // another bag opens from the list
  const other = bags.locator('li.brow.pbag button.bagh').first();
  const name = (await other.locator('b').first().textContent()).trim();
  await other.click();
  await expect(page.locator('section.pbag.cur h2')).toContainText(name);
  await expect(page.getByRole('heading', { name: T('Weight by bag') })).toBeVisible();
  await fits(page, info);
  expect(errors).toEqual([]);
});

test('Am Vorabend laden (T8): «0 von n geladen» on top, «Alles geladen» ticks every device', async ({ page, context }, info) => {
  await start(page, context, '2026-10-12T10:00:00+02:00', PACKING);
  await page.goto('./#/pack?charge');
  const sheet = page.locator('dialog.chs');
  await expect(sheet.getByRole('heading', { name: T('Charge the evening before') })).toBeVisible();
  await expect(sheet.locator('.prog')).toHaveText(counted('{done} of {n} charged'));
  const n = await sheet.locator('.rows li').count();
  expect(n).toBeGreaterThan(0);
  await sheet.getByRole('button', { name: T('All charged') }).click();
  await expect(sheet.locator('.prog')).toHaveText(T('{done} of {n} charged', { done: n, n }));
  await expect(sheet.getByRole('button', { name: T('All charged') })).toHaveCount(0);
  await fits(page, info);
  await sheet.getByRole('button', { name: T('Close the window') }).click();
  await expect(sheet).toBeHidden();
});

test('Gepackt (T11): the count tile and the celebration in one card, «Bis zum Start» as one list', async ({ page, context }, info) => {
  await start(page, context, '2026-10-12T10:00:00+02:00', PACKING);
  await page.goto(`./#/trip/${PACKING}/packed`);
  await page.reload();
  await expect(page.locator('.stepbar.light')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(new RegExp(`^(${esc(T('Packed'))}|${esc(T('Almost packed'))})$`));
  await expect(page.locator('.hero .tally b')).toHaveText(counted('{n} of {total}'));
  const until = page.getByRole('region', { name: T('Until the start') });
  await expect(until.getByRole('link', { name: new RegExp(esc(T('See the packing list'))) })).toBeVisible();
  // the reminder the evening before: a switch, on by default, and it can be turned off
  const sw = until.getByRole('switch');
  await expect(sw).toBeChecked();
  await sw.click();
  await expect(sw).not.toBeChecked();
  await fits(page, info);
});

test('Unterwegs (T12, T13): base check, «Der Tag in Blöcken», «Heute Abend laden», «Mehr», «Tour jetzt beenden?»', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // day 2 of 3, early afternoon
  await start(page, context, '2026-10-09T13:00:00+02:00', RUNNING);
  await page.goto('./#/ride');
  await page.reload();
  const check = page.getByRole('region', { name: T('Base check') });
  await expect(check).toBeVisible();
  await expect(check).toContainText(counted('{n} of {total}'));
  const chip = check.locator('button.chip').first();
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  // the block of now, the other blocks folded
  // SN1 (changed on purpose): one «Jetzt» card, its heading the time and the stage, four tiles
  const now = page.locator('section.now');
  await expect(now.locator('h2')).toContainText(T('Now'));
  for (const lab of ['Wear', 'Eat', 'Drink', 'Light']) await expect(now.getByText(T(lab), { exact: true })).toBeVisible();
  await page.getByRole('button', { name: T('How this is worked out') }).click();
  await expect(now.locator('.howp')).toBeVisible();
  await expect(page.locator('details.allb > summary')).toContainText(T('All blocks of the day'));
  await expect(page.getByRole('heading', { name: T('Weather on the way') })).toBeVisible(); // SN1: was «Wetter Stunde für Stunde»
  // right: the note, tonight's charging as its own list, «Mehr» with the evening
  await expect(page.getByRole('region', { name: T('Note for the debrief') })).toContainText(T('lands in the debrief, nothing to fill in')); // SN1
  const charge = page.getByRole('region', { name: T('Charge tonight') });
  await expect(charge.locator('.prog')).toHaveText(counted('{done} of {n} charged'));
  const more = page.getByRole('region', { name: T('More') });
  await expect(more.locator('details.eve summary')).toContainText(T('Evening'));
  await expect(more.locator('summary').filter({ hasText: T('What is where') })).toBeVisible();
  await fits(page, info);
  // «Tour beenden …» asks first: «Weiterfahren» before «Tour beenden», «×» closes
  await page.setViewportSize(info.project.name === 'phone' ? { width: 390, height: 844 } : { width: 1440, height: 900 });
  await endMenu(page, T); // SN1 (changed on purpose): «Tour beenden …» is in the band's «…»
  const sheet = page.locator('dialog.endsheet');
  await expect(sheet.getByRole('heading', { name: T('End the trip now?') })).toBeVisible();
  const btns = sheet.locator('.acts .btn');
  await expect(btns.nth(0)).toHaveText(T('Ride on'));
  await expect(btns.nth(1)).toHaveText(T('End the trip'));
  await expect(sheet.locator('.btn.hi')).toHaveCount(1);
  await sheet.getByRole('button', { name: T('Close') }).click();
  await expect(sheet).toHaveCount(0);
  await expect(page).toHaveURL(/#\/ride$/);
  expect(errors).toEqual([]);
});
