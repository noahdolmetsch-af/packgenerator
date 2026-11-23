// «Kursblick» (Noah 22.11.2026): the small app for the daily prices, German UI, phone and desktop. The price service is
// answered here with invented series (tests/e2e/kursblick-data.js); every other outside request is blocked.
// Gold card with reference day and sale value, SMI, periods (also an own one), the sale calculator keeps the deduction,
// an offline start shows the last prices, the way in from the currency tool, the small app with its own tabs.
// Märkte: the groups and titles of the person (add, change, move, delete with Undo, bring the suggestions back), the
// comparison of up to five titles on one chart, a typo in the symbol shows the check.
// KURS_SHOTS=<folder> saves the screenshots for the pull request.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { answer, FIXTURE, titelAnswer } from './kursblick-data.js';
import { goldChfKg, verkaufswert, vergleich, verglichenMit, PERIODS } from '../../src/lib/kurse/rechnen.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z0-9]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const SHOTS = process.env.KURS_SHOTS;
const GOLD = goldChfKg(FIXTURE.gold.points, FIXTURE.usdchf.points);
const lastGold = GOLD[GOLD.length - 1][1];
// de-CH writes 95’784 (a typographic apostrophe); the browser and Node may differ, so any of them matches
const num = (n) => new RegExp(String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "['’ ]?"));
const digits = (s) => s.replace(/\D/g, '');

async function start(page, context, { down = false } = {}) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.route('https://packgen-three.vercel.app/api/lake?action=kurse*', (route) => {
    if (down) return route.fulfill({ status: 503, body: '{}' });
    const id = new URL(route.request().url()).searchParams.get('id');
    const body = FIXTURE[id] ? answer(id) : id?.startsWith('y:') ? titelAnswer(id) : null;
    return body ? route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) }) : route.fulfill({ status: 404, body: '{}' });
  });
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}
async function shot(page, info, name) {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'desktop' ? '1440' : '390'}.png`, fullPage: true });
}

test('Kursblick: gold with reference and sale value, the SMI, periods, the calculator, offline, the way in', async ({ page, context }, info) => {
  const errors = await start(page, context);

  // the way in: a link at the end of the currency tool (no block above the content)
  await page.goto('./#/me/tools/money');
  await page.locator('[data-kursblick-link] a').click();
  await expect(page).toHaveURL(/#\/kurse$/);

  await expect(page.getByRole('heading', { level: 1, name: 'Kursblick' })).toBeVisible();
  const gold = page.locator('[data-gold]');
  await expect(gold.locator('[data-gold-preis]')).toBeVisible();
  expect(digits(await gold.locator('[data-gold-preis]').innerText())).toContain(String(Math.round(lastGold)));
  await expect(gold).toContainText(T('Close of {day}', { day: '' }).trim());
  const ref = vergleich(GOLD, '2026-11-01');
  expect(ref.from[0]).toBe('2026-10-30'); // the Sunday reference counts as the Friday before
  await expect(gold.locator('[data-gold-ref]')).toContainText(`${ref.pct > 0 ? '+' : '−'}${Math.abs(ref.pct).toLocaleString('de-CH', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`);
  await expect(gold).toContainText(T('The reference day had no trading, so the close of {day} counts.', { day: '' }).split('{')[0].trim().slice(0, 20));
  // the sale value: price minus 2 %
  await expect(gold.locator('[data-verkauf]')).toContainText(num(verkaufswert(lastGold, 2)));
  await expect(page.locator('[data-smi]')).toBeVisible();
  await expect(page.locator('[data-stand-zeit]')).toBeVisible();
  await shot(page, info, 'kursblick-heute');

  // the chart shows the period that is chosen (a week is a week), with an axis, and says the day and the price where you point
  const plot = page.locator('[data-chart="kurs"] [data-plot]');
  await page.locator('[data-zeitraum]').getByRole('button', { name: T('Week'), exact: true }).click();
  await expect.poll(async () => Number(await plot.getAttribute('data-n'))).toBeLessThanOrEqual(8);
  await page.locator('[data-zeitraum]').getByRole('button', { name: T('3 months'), exact: true }).click();
  await expect(page.locator('[data-chart="kurs"] [data-yticks] span').nth(2)).toBeVisible();
  await plot.click({ position: { x: 40, y: 40 } });
  await expect(page.locator('[data-chart="kurs"] [data-readout]')).toContainText('2026');
  await expect(page.locator('[data-chart="kurs"] [data-readout]')).toContainText(/\d/);
  const first = await page.locator('[data-chart="kurs"] [data-readout]').innerText();
  await plot.click({ position: { x: 200, y: 40 } });
  await expect(page.locator('[data-chart="kurs"] [data-readout]')).not.toHaveText(first);

  // a period: the year, then an own one of 45 days
  const year = verglichenMit(GOLD, PERIODS.find((p) => p.key === 'year'));
  await page.locator('[data-zeitraum]').getByRole('button', { name: T('Year'), exact: true }).click();
  await expect(gold).toContainText(`${year.pct > 0 ? '+' : '−'}${Math.abs(year.pct).toLocaleString('de-CH', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`);
  await page.locator('[data-zeitraum]').getByRole('button', { name: T('Own period') }).click();
  await page.locator('[data-eigen] input').fill('45');
  await page.locator('[data-eigen] select').selectOption('d');
  await page.locator('[data-eigen] button').click();
  await expect(gold).toContainText(`45 ${T('days')}`);
  await expect(page.locator('[data-verlauf]')).toBeVisible();
  await shot(page, info, 'kursblick-zeitraum');

  // Gold: the calculator keeps the deduction after a reload
  await page.goto('./#/kurse/gold');
  await expect(page.locator('[data-rechner]')).toBeVisible();
  await page.locator('[data-abschlag]').fill('5');
  await page.locator('[data-abschlag]').press('Tab');
  await expect(page.locator('[data-netto]')).toContainText(num(verkaufswert(lastGold, 5)));
  await page.getByRole('button', { name: T('Coins') }).click(); // the form suggests 4 %
  await expect(page.locator('[data-netto]')).toContainText(num(verkaufswert(lastGold, 4)));
  await page.reload();
  await expect(page.locator('[data-abschlag]')).toHaveValue('4');
  await expect(page.locator('[data-alle] tbody tr')).toHaveCount(PERIODS.length);
  await expect(page.locator('[data-ref-text]')).toBeVisible();
  await shot(page, info, 'kursblick-gold');

  // Sources: every price says its day; with the service down the last answer stays, marked as older
  await page.goto('./#/kurse/quellen');
  await expect(page.locator('[data-stand="gold"]')).toContainText('Stooq');
  await expect(page.locator('[data-stand="smi"]')).toContainText('Yahoo');
  await context.unroute('https://packgen-three.vercel.app/api/lake?action=kurse*');
  await context.route('https://packgen-three.vercel.app/api/lake?action=kurse*', (route) => route.fulfill({ status: 503, body: '{}' }));
  await page.getByRole('button', { name: T('Fetch prices again') }).click();
  await expect(page.locator('[data-stand="gold"]')).toContainText(T('older, the server did not answer'));
  await shot(page, info, 'kursblick-quellen');

  // nothing runs off the side on a small phone
  const size = page.viewportSize();
  for (const w of [320, 390]) {
    await page.setViewportSize({ width: w, height: size.height });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  }
  expect(errors).toEqual([]);
});

test('Kursblick: without a service and without saved prices the page says so and offers to try again', async ({ page, context }, info) => {
  await start(page, context, { down: true });
  await page.goto('./#/kurse');
  await expect(page.getByText(T('No prices right now'))).toBeVisible();
  await expect(page.getByRole('button', { name: T('Try again') })).toBeVisible();
  await shot(page, info, 'kursblick-leer');
});

test('Kursblick: the small app opens on its own page with its own tabs', async ({ page, context }) => {
  await start(page, context);
  await page.goto('./apps/kursblick/');
  await expect(page.locator('[data-gold]')).toBeVisible();
  const tabs = page.getByRole('navigation').getByRole('link', { name: T('Gold'), exact: true });
  await expect(tabs.first()).toBeVisible();
  await tabs.first().click();
  await expect(page.locator('[data-rechner]')).toBeVisible();
});

test('Kursblick Märkte: groups and titles of your own, the comparison of up to five, Undo, suggestions back', async ({ page, context }, info) => {
  const errors = await start(page, context);
  await page.goto('./#/kurse/maerkte');
  const maerkte = page.locator('[data-maerkte]');
  await expect(maerkte.locator('[data-gruppe="aktien"] [data-titel]')).toHaveCount(7);
  await expect(maerkte.locator('[data-titel="NESN.SW"] [data-titel-preis]')).toBeVisible();
  await expect(maerkte.locator('[data-titel="NESN.SW"] [data-titel-aend]')).toContainText('%');
  await shot(page, info, 'kursblick-maerkte');

  // the comparison: two titles, then the sixth is not taken
  const wahl = (sym) => maerkte.locator(`[data-titel="${sym}"] [data-vergleich-wahl]`);
  await wahl('NESN.SW').check();
  await expect(maerkte.locator('[data-vergleich-hinweis]')).toBeVisible();
  await wahl('NOVN.SW').check();
  await expect(maerkte.locator('[data-vergleich]')).toBeVisible();
  await expect(maerkte.locator('[data-legende]')).toHaveCount(2);
  for (const sym of ['RO.SW', 'ABBN.SW', 'HOLN.SW']) await wahl(sym).check();
  await expect(maerkte.locator('[data-legende]')).toHaveCount(5);
  await expect(wahl('SCHN.SW')).toBeDisabled();
  await maerkte.locator('[data-chart="vergleich"] [data-plot]').click({ position: { x: 60, y: 40 } });
  await expect(maerkte.locator('[data-chart="vergleich"] [data-readout] .v')).toHaveCount(5);
  await shot(page, info, 'kursblick-vergleich');
  await maerkte.locator('[data-legende="std-holn"] .weg').click();
  await expect(maerkte.locator('[data-legende]')).toHaveCount(4);

  // a typo in the symbol shows the check, «Save anyway» keeps it
  await maerkte.locator('[data-titel-neu]').click();
  const sheet = page.locator('[data-titel-sheet]');
  await sheet.locator('[data-titel-symbol]').fill('nopexyz');
  await sheet.locator('[data-titel-save]').click();
  await expect(sheet.locator('[data-titel-fehler]')).toContainText(T('No prices found for this symbol. Check how it is written, or save it anyway.'));
  await sheet.locator('[data-titel-symbol]').fill('xrp-usd');
  await sheet.locator('[data-titel-name]').fill('Ripple');
  await sheet.locator('[data-titel-art]').selectOption('crypto');
  await sheet.locator('[data-titel-gruppe]').selectOption('krypto');
  await sheet.locator('[data-titel-save]').click();
  await expect(maerkte.locator('[data-gruppe="krypto"] [data-titel="XRP-USD"] [data-titel-preis]')).toBeVisible();
  // the same symbol twice is not taken
  await maerkte.locator('[data-titel-neu]').click();
  await sheet.locator('[data-titel-symbol]').fill('XRP-USD');
  await sheet.locator('[data-titel-save]').click();
  await expect(sheet.locator('[data-titel-fehler]')).toContainText(T('This symbol is already in your list.'));
  await sheet.getByRole('button', { name: T('Cancel') }).click();

  // it is still there after a reload (the window's own step back in the history has to be over first)
  await sheet.waitFor({ state: 'detached' }).catch(() => {});
  await page.waitForTimeout(600);
  await page.reload();
  await expect(maerkte.locator('[data-titel="XRP-USD"]')).toBeVisible();

  // delete a title with Undo
  const more = (row) => row.getByRole('button', { name: new RegExp(T('More for {what}', { what: '' }).trim()) });
  const ripple = maerkte.locator('[data-titel="XRP-USD"]');
  await more(ripple).click();
  await page.getByRole('menuitem', { name: new RegExp(`^${T('Delete')}`) }).click();
  await page.getByTestId('ask-delete').locator('.btn.del').click();
  await expect(ripple).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).last().click();
  await expect(ripple).toBeVisible();

  // a group: add, rename, delete (the titles go on to «No group»)
  await maerkte.locator('[data-gruppe-neu]').click();
  await maerkte.locator('[data-gruppe-form] input').fill('Meine Ideen');
  await maerkte.locator('[data-gruppe-form] button[type="submit"]').click();
  const idee = maerkte.locator('section.m-gruppe', { hasText: 'Meine Ideen' });
  await expect(idee).toBeVisible();
  await more(idee).first().click();
  await page.getByRole('menuitem', { name: new RegExp(`^${T('Rename')}`) }).click();
  await idee.locator('[data-group-rename] input').fill('Beobachten');
  await idee.locator('[data-group-rename] button[type="submit"]').click();
  await expect(maerkte.locator('section.m-gruppe', { hasText: 'Beobachten' })).toBeVisible();
  const krypto = maerkte.locator('[data-gruppe="krypto"]');
  await more(krypto).first().click();
  await page.getByRole('menuitem', { name: new RegExp(`^${T('Delete')}`) }).click();
  await page.locator('dialog[open] .btn.del').click();
  await expect(maerkte.locator('[data-gruppe="krypto"]')).toHaveCount(0);
  await expect(maerkte.locator('[data-gruppe="none"] [data-titel="BTC-USD"]')).toBeVisible();
  await page.getByRole('button', { name: T('Undo') }).last().click();
  await expect(maerkte.locator('[data-gruppe="krypto"] [data-titel="BTC-USD"]')).toBeVisible();

  // a suggestion that was deleted comes back
  const nesn = maerkte.locator('[data-titel="NESN.SW"]');
  await more(nesn).click();
  await page.getByRole('menuitem', { name: new RegExp(`^${T('Delete')}`) }).click();
  await page.getByTestId('ask-delete').locator('.btn.del').click();
  await expect(nesn).toHaveCount(0);
  await maerkte.locator('[data-vorschlaege]').click();
  await expect(nesn).toBeVisible();

  // nothing runs off the side on a small phone
  const size = page.viewportSize();
  for (const w of [320, 390]) {
    await page.setViewportSize({ width: w, height: size.height });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  }
  expect(errors).toEqual([]);
});
