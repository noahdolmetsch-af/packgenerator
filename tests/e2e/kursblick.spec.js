// «Kursblick» (Noah 22.11.2026): the small app for the daily prices, German UI, phone and desktop. The price service is
// answered here with invented series (tests/e2e/kursblick-data.js); every other outside request is blocked.
// Gold card with reference day and sale value, SMI, periods (also an own one), the sale calculator keeps the deduction,
// an offline start shows the last prices, the way in from the currency tool, the small app with its own tabs.
// Märkte: the groups and titles of the person (add, change, move, delete with Undo, bring the suggestions back), the
// comparison of up to five titles on one chart, a typo in the symbol shows the check.
// Meine Zahlen (K-C): holdings with profit and loss, dividends and splits, goals on Today, gold after inflation; private, on the device.
// KURS_SHOTS=<folder> saves the screenshots for the pull request.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { answer, FIXTURE, titelAnswer } from './kursblick-data.js';
import { realReihe } from '../../src/lib/kurse/teuerung.js';
import { ampel, lage, regelVorschlag, rueckblick } from '../../src/lib/kurse/signale.js';
import { rechne, bewerteRechnung } from '../../src/lib/kurse/journal.js';
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

test('Kursblick Meine Zahlen: Bestand mit Gewinn, Dividende und Split, Ziele auf Heute, Gold nach Teuerung', async ({ page, context }, info) => {
  const errors = await start(page, context);
  const abc = titelAnswer('y:ABC.SW').last.close;
  await page.goto('./#/kurse/bestand');
  const bestand = page.locator('[data-bestand]');
  await expect(bestand.getByText(T('Nothing in your holdings yet'))).toBeVisible();
  await expect(page.locator('[data-ziele]').getByText(T('No goals yet'))).toBeVisible();

  // a title: the check asks the service, then the value is pieces × price
  await bestand.getByRole('button', { name: T('Add to my holdings') }).click();
  const sheet = page.locator('[data-posten-sheet]');
  await sheet.locator('[data-posten-symbol]').fill('abc.sw');
  await sheet.locator('[data-posten-menge]').fill('10');
  await sheet.locator('[data-posten-einstand]').fill("1'000");
  await sheet.locator('[data-posten-save]').click();
  await expect(sheet).toHaveCount(0);
  const zeile = bestand.locator('[data-posten]').first();
  await expect(zeile).toContainText('ABC.SW');
  expect(digits(await bestand.locator('[data-bestand-wert]').innerText())).toBe(String(Math.round(10 * abc)));
  await expect(bestand.locator('[data-bestand-gewinn]')).toContainText('%');

  // gold in grams and a value by hand
  await bestand.locator('[data-posten-neu]').click();
  await sheet.getByRole('button', { name: T('Gold'), exact: true }).click();
  await sheet.locator('[data-posten-menge]').fill('100');
  await sheet.locator('[data-posten-save]').click();
  await expect(sheet).toHaveCount(0);
  await bestand.locator('[data-posten-neu]').click();
  await sheet.getByRole('button', { name: T('Value by hand') }).click();
  await sheet.locator('[data-posten-save]').click();
  await expect(sheet.locator('[data-posten-fehler]')).toContainText(T('Give it a name, for example «My savings account».'));
  await sheet.locator('[data-posten-name]').fill('Mein Sparkonto');
  await sheet.locator('[data-posten-wert]').fill('5000');
  await sheet.locator('[data-posten-save]').click();
  await expect(sheet).toHaveCount(0);
  await expect(bestand.locator('[data-posten]')).toHaveCount(3);
  const total = 10 * abc + (100 / 1000) * lastGold + 5000;
  expect(digits(await bestand.locator('[data-bestand-wert]').innerText())).toBe(String(Math.round(total)));

  // a dividend and a split on the title: the split doubles its pieces and its value
  const more = (row) => row.getByRole('button', { name: new RegExp(T('More for {what}', { what: '' }).trim()) });
  await more(zeile).click();
  await page.getByRole('menuitem', { name: new RegExp(`^${T('Change')}`) }).click();
  const ev = sheet.locator('[data-ereignisse]');
  await ev.locator('input[type="date"]').fill('2026-05-01');
  await ev.locator('[data-ereignis-wert]').fill('30');
  await ev.locator('[data-ereignis-neu]').click();
  await expect(ev.locator('[data-ereignis]')).toHaveCount(1);
  await ev.getByRole('button', { name: T('Split'), exact: true }).click();
  await ev.locator('[data-ereignis-neu]').click();
  await expect(ev.locator('[data-ereignis-fehler]')).toBeVisible(); // no day, no factor
  await ev.locator('input[type="date"]').fill('2026-06-01');
  await ev.locator('[data-ereignis-wert]').fill('2');
  await ev.locator('[data-ereignis-neu]').click();
  await expect(ev.locator('[data-ereignis]')).toHaveCount(2);
  await sheet.getByRole('button', { name: T('Cancel') }).click();
  await expect(sheet).toHaveCount(0);
  const total2 = 20 * abc + (100 / 1000) * lastGold + 5000;
  expect(digits(await bestand.locator('[data-bestand-wert]').innerText())).toBe(String(Math.round(total2)));
  await expect(bestand.locator('[data-mit-dividenden]')).toBeVisible();
  await bestand.locator('[data-mit-dividenden]').check();
  await shot(page, info, 'kursblick-bestand');

  // goals: one reached (gold at or above 1), one not (the title at or below 1)
  const ziele = page.locator('[data-ziele]');
  await ziele.getByRole('button', { name: T('Add a goal') }).click();
  const zs = page.locator('[data-ziel-sheet]');
  await zs.locator('[data-ziel-wert]').fill('');
  await zs.locator('[data-ziel-save]').click();
  await expect(zs.locator('[data-ziel-fehler]')).toBeVisible();
  await zs.locator('[data-ziel-wert]').fill('1');
  await zs.locator('[data-ziel-save]').click();
  await expect(zs).toHaveCount(0);
  await ziele.locator('[data-ziel-neu]').click();
  await zs.locator('[data-ziel-art]').selectOption('titel');
  await zs.locator('[data-ziel-symbol]').fill('abc.sw');
  await zs.getByRole('button', { name: T('at or below') }).click();
  await zs.locator('[data-ziel-wert]').fill('1');
  await zs.locator('[data-ziel-save]').click();
  await expect(zs).toHaveCount(0);
  await expect(ziele.locator('[data-ziel]')).toHaveCount(2);
  await expect(ziele.locator('[data-ziel-erreicht]')).toHaveCount(1);
  await shot(page, info, 'kursblick-ziele');

  // it is all still there after a reload, and the goal shows on Today with the holdings
  await page.waitForTimeout(600);
  await page.reload();
  await expect(page.locator('[data-bestand] [data-posten]')).toHaveCount(3);
  await page.goto('./#/kurse');
  await expect(page.locator('[data-ziele-heute] [data-ziel-erreicht]')).toBeVisible();
  await expect(page.locator('[data-bestand-heute]')).toContainText('CHF');
  await shot(page, info, 'kursblick-heute-ziele');

  // delete a position with Undo
  await page.goto('./#/kurse/bestand');
  const sparkonto = page.locator('[data-bestand] [data-posten]', { hasText: 'Mein Sparkonto' });
  await more(sparkonto).click();
  await page.getByRole('menuitem', { name: new RegExp(`^${T('Delete')}`) }).click();
  await page.getByTestId('ask-delete').locator('.btn.del').click();
  await expect(sparkonto).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).last().click();
  await expect(sparkonto).toBeVisible();

  // gold after inflation: the year can be chosen, the numbers follow the calculation
  await page.goto('./#/kurse/gold');
  const real = page.locator('[data-gold-real]');
  await expect(real.locator('[data-real-jahr]')).toBeVisible();
  await real.locator('[data-real-jahr]').selectOption('2010');
  const r = realReihe(GOLD, FIXTURE.lik.points, 2010);
  const pct = (v) => `${v > 0 ? '+' : '−'}${Math.abs(v).toLocaleString('de-CH', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
  await expect(real.locator('[data-real-nominal]')).toContainText(pct(r.nominal));
  await expect(real.locator('[data-real-real]')).toContainText(pct(r.real));
  await expect(real.locator('[data-chart]')).toBeVisible();
  await shot(page, info, 'kursblick-gold-real');

  // the small app has its own tab for it
  await page.goto('./apps/kursblick/');
  await page.getByRole('navigation').getByRole('link', { name: T('My numbers|kurs'), exact: true }).first().click();
  await expect(page.locator('[data-meins]')).toBeVisible();

  // nothing runs off the side on a small phone
  const size = page.viewportSize();
  for (const w of [320, 390]) {
    await page.setViewportSize({ width: w, height: size.height });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  }
  expect(errors).toEqual([]);
});

test('Kursblick Entscheidung: Trend, Lage und die eigene Kaufregel mit Rückblick, privat auf dem Gerät', async ({ page, context }, info) => {
  const errors = await start(page, context);
  const A = ampel(GOLD);
  const L = lage(GOLD);
  await page.goto('./#/kurse');
  await page.getByRole('group', { name: T('View') }).getByRole('button', { name: T('Decision|kurs'), exact: true }).click();
  await expect(page).toHaveURL(/#\/kurse\/entscheidung$/);

  // the trend and the position are worked out from the series: the same answer as the calculation
  await expect(page.locator('[data-trend] [data-ampel]')).toHaveAttribute('data-ampel', A.farbe);
  await expect(page.locator('[data-trend]')).toContainText(T({ gruen: 'Green', gelb: 'Yellow', rot: 'Red' }[A.farbe]));
  await expect(page.locator('[data-lage] [data-stufe]')).toHaveAttribute('data-stufe', L.stufe);
  // no amount yet: the rule says what to do, no suggestion, no look back
  await expect(page.locator('[data-regel-leer]')).toBeVisible();
  await expect(page.locator('[data-vorschlag]')).toHaveCount(0);
  await expect(page.locator('[data-rueckblick]')).toHaveCount(0);
  await expect(page.locator('[data-hinweis]')).toContainText(T('These are observations from past prices and the result of your own rule. Nothing here predicts a price and nothing is investment advice. Everything stays on your devices.').slice(0, 30));
  await shot(page, info, 'kursblick-entscheidung-leer');

  // an amount and two factors: the suggestion is the amount times the factors that apply
  const regel = { grundbetrag: 500, rot: 2, teuer: 0.5 };
  await page.locator("[data-betrag]").fill("500");
  await page.locator('[data-faktor-rot]').selectOption('2');
  await page.locator('[data-faktor-teuer]').selectOption('0.5');
  const v = regelVorschlag(GOLD, GOLD.length - 1, regel);
  await expect(page.locator('[data-vorschlag] b')).toContainText(num(v.betrag));
  await expect(page.locator('[data-regel-leer]')).toHaveCount(0);
  // the look back over the last months against «always the same»
  const r = rueckblick(GOLD, regel);
  expect(r.monate.length).toBe(60);
  await expect(page.locator('[data-rueckblick]')).toContainText(num(r.gleich.einbezahlt));
  await expect(page.locator('[data-rueckblick]')).toContainText(num(r.regel.einbezahlt));
  await expect(page.locator('[data-unterschied]')).toBeVisible();
  await page.locator('[data-rueckblick] summary').click();
  await expect(page.locator('[data-rueckblick] details tbody tr')).toHaveCount(60);
  await shot(page, info, 'kursblick-entscheidung');

  // the rule stays on the device and nothing of it goes to the price service
  await page.waitForTimeout(600);
  await page.reload();
  await expect(page.locator('[data-betrag]')).toHaveValue('500');
  await expect(page.locator('[data-faktor-rot]')).toHaveValue('2');
  await expect(page.locator('[data-faktor-teuer]')).toHaveValue('0.5');
  const saved = await page.evaluate(() => new Promise((res) => {
    const open = indexedDB.databases ? indexedDB.databases() : Promise.resolve([]);
    open.then((dbs) => {
      const name = dbs[0]?.name;
      const rq = indexedDB.open(name);
      rq.onsuccess = () => {
        const get = rq.result.transaction('settings').objectStore('settings').get('kurse.regeln');
        get.onsuccess = () => res(get.result?.value ?? null);
      };
    });
  }));
  expect(saved).toEqual({ gold: regel });

  // the small app has its own tab for it, and nothing runs off the side on a small phone
  await page.goto('./apps/kursblick/');
  await page.getByRole('navigation').getByRole('link', { name: T('Decision|kurs'), exact: true }).first().click();
  await expect(page.locator('[data-regel]')).toBeVisible();
  const size = page.viewportSize();
  for (const w of [320, 390]) {
    await page.setViewportSize({ width: w, height: size.height });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  }
  expect(errors).toEqual([]);
});

test('Kursblick Depot: Depots, Käufe und Verkäufe eintragen, Übungsdepot, Übernahme aus Meine Zahlen; privat auf dem Gerät', async ({ page, context }, info) => {
  const errors = await start(page, context);
  const pro_g = lastGold / 1000;
  const more = (row) => row.getByRole('button', { name: new RegExp(T('More for {what}', { what: '' }).trim()) });
  const sheet = page.locator('[data-eintrag-sheet]');
  const eintrag = async (art, f) => {
    await page.locator('[data-eintrag-neu]').click();
    await expect(sheet).toBeVisible();
    await sheet.getByRole('button', { name: T({ kauf: 'Buy', verkauf: 'Sale' }[art]), exact: true }).click();
    await sheet.locator('input[type="date"]').fill(f.tag);
    await sheet.locator('[data-eintrag-menge]').fill(String(f.menge));
    await sheet.locator('[data-eintrag-preis]').fill(String(f.preis));
    if (f.gebuehr) await sheet.locator('[data-eintrag-gebuehr]').fill(String(f.gebuehr));
    await sheet.locator('[data-eintrag-save]').click();
  };

  // nothing yet: the page says why and offers the first step
  await page.goto('./#/kurse');
  await page.getByRole('group', { name: T('View') }).getByRole('button', { name: T('Portfolio|kurs'), exact: true }).click();
  await expect(page).toHaveURL(/#\/kurse\/portfolio$/);
  await expect(page.getByText(T('No portfolio yet'))).toBeVisible();
  await shot(page, info, 'kursblick-depot-leer');

  // a portfolio needs a name
  await page.getByRole('button', { name: T('Add a portfolio') }).click();
  const ds = page.locator('[data-depot-sheet]');
  await ds.locator('[data-depot-save]').click();
  await expect(ds.locator('[data-depot-fehler]')).toBeVisible();
  await ds.locator('[data-depot-name]').fill('Meine Bank');
  await ds.locator('[data-depot-save]').click();
  await expect(ds).toHaveCount(0);
  await expect(page.locator('[data-depot-leer]')).toBeVisible();

  // two buys and a sale: the average price, the value and the profit follow the calculation
  await eintrag('kauf', { tag: '2026-01-05', menge: 10, preis: 50, gebuehr: 5 });
  await expect(sheet).toHaveCount(0);
  await eintrag('kauf', { tag: '2026-02-05', menge: 10, preis: 60 });
  await eintrag('verkauf', { tag: '2026-03-05', menge: 5, preis: 70, gebuehr: 2 });
  await expect(page.locator('[data-eintrag]')).toHaveCount(3);
  const E = [
    { id: 'a', art: 'kauf', titel: 'gold', tag: '2026-01-05', menge: 10, preis: 50, gebuehr: 5 },
    { id: 'b', art: 'kauf', titel: 'gold', tag: '2026-02-05', menge: 10, preis: 60, gebuehr: 0 },
    { id: 'c', art: 'verkauf', titel: 'gold', tag: '2026-03-05', menge: 5, preis: 70, gebuehr: 2 },
  ];
  const w = bewerteRechnung(rechne(E), { gold: pro_g });
  expect(w.positionen[0].menge).toBe(15);
  expect(digits(await page.locator('[data-wert]').innerText())).toBe(String(Math.round(w.wert)));
  const pos = page.locator('[data-position="gold"]');
  await expect(pos).toContainText('15');
  await expect(pos).toContainText('55.25'); // the average price: 1105 francs for 20 grams
  await expect(page.locator('[data-gesamt]')).toContainText(num(Math.abs(w.gesamt)));
  await shot(page, info, 'kursblick-depot');

  // a sale of more than is held is refused with a sentence, and a change of an entry works
  await page.locator('[data-eintrag-neu]').click();
  await sheet.getByRole('button', { name: T('Sale'), exact: true }).click();
  await sheet.locator('input[type="date"]').fill('2026-04-01');
  await sheet.locator('[data-eintrag-menge]').fill('100');
  await sheet.locator('[data-eintrag-preis]').fill('70');
  await sheet.locator('[data-eintrag-save]').click();
  await expect(sheet.locator('[data-eintrag-fehler]')).toBeVisible();
  await sheet.getByRole('button', { name: T('Cancel') }).click();
  await expect(page.locator('[data-eintrag]')).toHaveCount(3);
  const letzter = page.locator('[data-eintrag]').first(); // the newest first: the sale
  await more(letzter).click();
  await page.getByRole('menuitem', { name: new RegExp(`^${T('Change')}`) }).click();
  await sheet.locator('[data-eintrag-menge]').fill('6');
  await sheet.locator('[data-eintrag-save]').click();
  await expect(page.locator('[data-position="gold"]')).toContainText('14');

  // delete with Undo
  await more(page.locator('[data-eintrag]').first()).click();
  await page.getByRole('menuitem', { name: new RegExp(`^${T('Delete')}`) }).click();
  await page.getByTestId('ask-delete').locator('.btn.del').click();
  await expect(page.locator('[data-eintrag]')).toHaveCount(2);
  await page.getByRole('button', { name: T('Undo') }).last().click();
  await expect(page.locator('[data-eintrag]')).toHaveCount(3);

  // a practice portfolio is its own, marked, and never counts
  await page.locator('[data-depot-neu]').click();
  await ds.locator('[data-depot-name]').fill('Gold-Test');
  await ds.getByRole('button', { name: T('Practice (made up)'), exact: true }).click();
  await ds.locator('[data-depot-save]').click();
  await expect(page.locator('[data-uebung]')).toBeVisible();
  await expect(page.locator('[data-depot-leer]')).toBeVisible();
  await eintrag('kauf', { tag: '2026-01-05', menge: 3, preis: 55 });
  await expect(page.locator('[data-eintrag]')).toHaveCount(1);

  // it all stays after a reload
  await page.waitForTimeout(600);
  await page.reload();
  await expect(page.locator('[data-depots]')).toContainText('Meine Bank');
  await expect(page.locator('[data-depots]')).toContainText('Gold-Test');
  const saved = await page.evaluate(() => new Promise((res) => {
    indexedDB.databases().then((dbs) => {
      const rq = indexedDB.open(dbs[0].name);
      rq.onsuccess = () => {
        const get = rq.result.transaction('settings').objectStore('settings').get('kurse.journal');
        get.onsuccess = () => res(get.result?.value ?? null);
      };
    });
  }));
  expect(saved.depots.map((d) => [d.name, d.art, d.eintraege.length])).toEqual([['Meine Bank', 'echt', 3], ['Gold-Test', 'uebung', 1]]);

  // delete a portfolio: the entries can go to the other one, and Undo brings it all back
  await page.locator('[data-depots]').getByRole('button', { name: /Gold-Test/ }).click();
  await more(page.locator('[data-depot]')).click();
  await page.getByRole('menuitem', { name: new RegExp(`^${T('Delete')}`) }).click();
  await page.getByRole('radio', { name: 'Meine Bank' }).check();
  await page.locator('dialog.gds').getByRole('button', { name: new RegExp(`^${T('Delete')}`) }).click();
  await expect(page.locator('[data-eintrag]')).toHaveCount(4);
  await page.getByRole('button', { name: T('Undo') }).last().click();
  await expect(page.locator('[data-depots]')).toContainText('Gold-Test');

  // nothing runs off the side on a small phone
  const size = page.viewportSize();
  for (const wd of [320, 390]) {
    await page.setViewportSize({ width: wd, height: size.height });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(wd);
  }
  expect(errors).toEqual([]);
});

test('Kursblick Depot: der Bestand aus Meine Zahlen wird als Eröffnung übernommen, Meine Zahlen bleibt', async ({ page, context }, info) => {
  const errors = await start(page, context);
  // what «My numbers» holds: 100 grams of gold for 5000 francs, bought on 1 March 2024
  await page.goto('./#/kurse/bestand');
  await page.getByRole('button', { name: T('Add to my holdings') }).first().click();
  const ps = page.locator('[data-posten-sheet]');
  await ps.getByRole('button', { name: T('Gold'), exact: true }).click();
  await ps.locator('[data-posten-menge]').fill('100');
  await ps.locator('[data-posten-einstand]').fill('5000');
  await ps.locator('input[type="date"]').fill('2024-03-01');
  await ps.locator('[data-posten-save]').click();
  await expect(page.locator('[data-bestand] [data-posten]')).toHaveCount(1);
  await page.waitForTimeout(600);
  await page.goto('./#/kurse/portfolio');
  await page.reload();
  await expect(page.locator('[data-uebernahme]')).toBeVisible();
  await shot(page, info, 'kursblick-depot-uebernahme');
  // Undo takes the takeover back, then it is done again for good
  await page.locator('[data-uebernehmen]').click();
  await expect(page.locator('[data-eintrag]')).toHaveCount(1);
  await page.getByRole('button', { name: T('Undo') }).last().click();
  await expect(page.locator('[data-eintrag]')).toHaveCount(0);
  await expect(page.locator('[data-uebernahme]')).toBeVisible();
  await page.locator('[data-uebernehmen]').click();
  await expect(page.locator('[data-eintrag]')).toHaveCount(1);
  await expect(page.locator('[data-eintrag]')).toContainText(T('Opening'));
  await expect(page.locator('[data-position="gold"]')).toContainText('100');
  await expect(page.locator('[data-uebernahme]')).toHaveCount(0); // taken over once, nothing doubles
  // «My numbers» is as it was
  await page.goto('./#/kurse/bestand');
  await expect(page.locator('[data-bestand] [data-posten]')).toHaveCount(1);
  await page.goto('./#/kurse/portfolio');
  await expect(page.locator('[data-eintrag]')).toHaveCount(1);
  expect(errors).toEqual([]);
});
