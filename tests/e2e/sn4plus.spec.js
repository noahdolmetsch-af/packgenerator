// SN4+ «SN4 plus» (mockups SN4e and SN4f-a approved 13.10.2026: 1a, 2 «Wetter und Temperatur immer an, plus
// Max. Puls», 3b, 4a, 5a), German UI, phone 390 and desktop 1440, fictional data (sn4plus-fixture.js):
// a) the table: the new columns (Hm, Fahrzeit, Verstrichen, Ø km/h, Ø Puls, Max. Puls, Velo as its type,
//    Wetter, Temp., Strava-Kommentar), Tour and Zustand stay while the table scrolls sideways; «Spalten»
//    (dialog / sheet), remembered after a reload, «Wie am Anfang (alle an)»; on a phone each trip a card;
// b) «In Zahlen»: 4 groups, the first open, closed ones with one line, remembered; the blocks follow a
//    filter, «Zum Vorjahr» does not; «Blöcke» switches a block off; a block without data says so quietly.
// The numbers are read from the fixture and the app source, not copied.
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { COLS, GROUPS } from '../../src/lib/review/pastcols.js';
import { sn4plusData, P, D0, day } from './sn4plus-fixture.js';
import { openData, settle } from './settle.js';

const SHOTS = '/tmp/claude-0/sn-shots/sn4plus';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const DATA = sn4plusData();
const shot = async (page, info, name, fullPage = true) => {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const int = (s) => Number(String(s ?? '').replace(/[^\d]/g, '') || 0);
/** h:mm of hours. */
const hm = (h) => {
  const m = Math.round(h * 60);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
};

async function start(page, context, info) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/sn4plus-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(DATA));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  // in the morning: no trip of the fixture opens «Tour beendet» by itself
  await page.clock.setFixedTime(new Date(`${D0}T10:00:00+02:00`));
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel('Backup importieren').setInputFiles(file);
  await panel.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  await page.goto('./#/pack/past');
  await expect(page.getByRole('heading', { level: 1, name: T('Past trips') })).toBeVisible();
  return errors;
}

const HERBST = DATA.tables.trips.find((x) => x.id === `${P}herbst`);
const herbstRides = DATA.tables.rides.filter((r) => r.tripId === HERBST.id);
// the heart rate of the trip's Strava rides in the ledger: the average weighted by km, the highest max
const herbstEntries = DATA.tables.kmBook.filter((e) => e.source === 'strava' && e.date >= HERBST.startDate && e.date <= day(-13 + HERBST.days - 1) && e.bikeId === HERBST.bikeId && e.hrAvg > 0);
const herbstHeart = herbstEntries.length
  ? { avg: Math.round(herbstEntries.reduce((s, e) => s + e.hrAvg * e.km, 0) / herbstEntries.reduce((s, e) => s + e.km, 0)), max: Math.max(...herbstEntries.map((e) => e.hrMax)) }
  : null;

test('a) the columns, Tour and Zustand stay, «Spalten» with its reset, a card per trip on a phone', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const phone = info.project.name === 'phone';
  const table = page.locator('main table.tt');
  const row = table.locator('tbody tr[data-state]').filter({ has: page.getByRole('rowheader', { name: /Herbsttour Hochland/ }) });
  const moving = hm(herbstRides.reduce((s, r) => s + r.movingH, 0));
  expect(herbstHeart?.avg).toBeGreaterThan(0);

  if (!phone) {
    // all columns at first (answer 2: Wetter, Temp. and Max. Puls too), Velo as its type only (3b)
    await expect(table.getByRole('columnheader')).toHaveText([T('Trip'), T('State|trip'), ...COLS.map((c) => T(c.head)), T('Open')]);
    const cells = row.locator('td.col');
    await expect(cells).toHaveText(['148', '2’210', moving, hm(herbstRides.reduce((s, r) => s + r.totalH, 0)), /^\d+\.\d$/, String(herbstHeart.avg), String(herbstHeart.max), T('Gravel bike'), T('Rain day {n}', { n: 2 }), '4–15°', '–']);
    // the table scrolls sideways inside its card; Tour and Zustand stay where they are
    const box = page.locator('main .tbox');
    expect(await box.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    const before = { first: await row.locator('th.first').boundingBox(), state: await row.locator('td.stc').boundingBox(), km: await row.locator('td.km').boundingBox() };
    await box.evaluate((el) => (el.scrollLeft = 300));
    await expect.poll(async () => (await row.locator('td.km').boundingBox()).x).toBeLessThan(before.km.x - 100);
    expect((await row.locator('th.first').boundingBox()).x).toBeCloseTo(before.first.x, 0);
    expect((await row.locator('td.stc').boundingBox()).x).toBeCloseTo(before.state.x, 0);
    await box.evaluate((el) => (el.scrollLeft = 0));
  } else {
    // a card: name, the pill, «Datum · Wetter · Temp.», km · Hm · Fahrzeit · Ø Puls · max ♥, the type, the comment
    await expect(table.locator('thead')).toBeHidden();
    await expect(row.locator('th.first small')).toContainText(`${T('Rain day {n}', { n: 2 })} · 4–15°`);
    const card = row.locator('td.pc');
    await expect(card).toBeVisible();
    for (const v of ['148', '2’210', `${moving}`, String(herbstHeart.avg), String(herbstHeart.max), T('max ♥'), T('Gravel bike')]) await expect(card).toContainText(v);
    await expect(row.locator('td.col').first()).toBeHidden();
  }
  await shot(page, info, 'SN4e-touren-spalten');

  // «Spalten»: a dialog (computer) or a sheet from below (phone); Tour and Zustand are not in it
  await page.getByRole('button', { name: T('Columns') }).click();
  const dlg = page.getByRole('dialog', { name: T('Columns') });
  await expect(dlg).toBeVisible();
  await expect(dlg.getByRole('checkbox')).toHaveCount(COLS.length);
  for (const c of await dlg.getByRole('checkbox').all()) await expect(c).toBeChecked();
  await expect(dlg.getByRole('checkbox', { name: T('Trip'), exact: true })).toHaveCount(0);
  if (phone) {
    const b = await dlg.boundingBox();
    expect(Math.round(b.y + b.height)).toBeGreaterThanOrEqual(page.viewportSize().height - 1);
  }
  await shot(page, info, 'SN4e-touren-spalten-waehlen', false); // the dialog where it opens
  await dlg.getByRole('checkbox', { name: T('Weather'), exact: true }).uncheck();
  await dlg.getByRole('checkbox', { name: T('Ø heart rate'), exact: true }).uncheck();
  await dlg.getByRole('button', { name: T('Done') }).click();
  await expect(dlg).toBeHidden();
  const heads = () => table.locator('thead th').allTextContents();
  if (!phone) {
    expect(await heads()).not.toContain(T('Weather'));
    expect(await heads()).not.toContain(T('Ø heart rate'));
  } else {
    await expect(row.locator('td.pc')).not.toContainText(T('Ø heart rate'));
    await expect(row.locator('th.first small')).not.toContainText(T('Rain day {n}', { n: 2 }));
  }
  // two of the choosable columns off: Tour and Zustand plus the rest
  await expect(page.locator('.ttop .tsub')).toContainText(`${COLS.length} ${T('Columns')}`);

  // remembered after a reload
  await page.reload();
  await expect(table.locator('tbody tr[data-state]').first()).toBeAttached();
  if (!phone) expect(await heads()).not.toContain(T('Weather'));
  else await expect(row.locator('td.pc')).not.toContainText(T('Ø heart rate'));

  // «Wie am Anfang (alle an)»
  await page.getByRole('button', { name: T('Columns') }).click();
  await expect(dlg.getByRole('checkbox', { name: T('Weather'), exact: true })).not.toBeChecked();
  await dlg.getByRole('button', { name: T('As at first (all on)') }).click();
  await expect(dlg.getByRole('checkbox', { name: T('Weather'), exact: true })).toBeChecked();
  await expect(dlg.getByRole('checkbox', { name: T('Ø heart rate'), exact: true })).toBeChecked();
  await dlg.getByRole('button', { name: T('Done') }).click();
  if (!phone) await expect(table.getByRole('columnheader')).toHaveCount(COLS.length + 3);
  else await expect(row.locator('td.pc')).toContainText(T('Ø heart rate'));
  // without Strava details the comment is «–» (the Training PR brings them)
  await expect(page.getByRole('button', { name: T('Load comment') })).toHaveCount(0);
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('b) «In Zahlen»: 4 groups, closed ones with a line, the blocks follow a filter but «Zum Vorjahr» does not', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const iz = page.locator('section[data-in-numbers]');
  await expect(iz.getByRole('heading', { level: 2, name: T('In numbers') })).toBeVisible();
  const group = (key) => iz.locator(`[data-group="${key}"]`);
  const toggle = (key) => group(key).getByRole('button', { name: new RegExp(`^${T(GROUPS.find((g) => g.key === key).name)}`) });
  await expect(iz.locator('[data-group]')).toHaveCount(4);
  // only the first group is open; a closed group shows one line with its numbers
  await expect(toggle('dist')).toHaveAttribute('aria-expanded', 'true');
  for (const g of ['bikes', 'body', 'records']) {
    await expect(toggle(g)).toHaveAttribute('aria-expanded', 'false');
    await expect(group(g).locator('[data-summary]')).toHaveText(/\S/);
    await expect(group(g).locator('[data-block]')).toHaveCount(0);
  }
  await expect(group('bikes').locator('[data-summary]')).toContainText('Gravel Grau');
  await expect(group('dist').locator('[data-block]')).toHaveCount(3);
  // V1 bars, V7 the map from the saved routes, V10 weekdays and times of day
  await expect(group('dist').locator('[data-block="V1"] .bars li[data-month]')).toHaveCount(12);
  await expect(group('dist').locator('[data-block="V7"] svg line').first()).toBeAttached();
  await expect(group('dist').locator('[data-block="V7"] svg line.lv3').first()).toBeAttached(); // a stretch ridden 4× and more
  await expect(group('dist').locator('[data-block="V10"] [data-part="evening"] b')).not.toHaveText('0');
  await expect(group('dist').locator('[data-block="V10"] [data-part="afternoon"] b')).not.toHaveText('0');
  await shot(page, info, 'SN4f-a-touren-gruppen');

  // open «Rekorde und Vergleich» and «Körper»
  await toggle('records').click();
  await toggle('body').click();
  await expect(group('records').locator('[data-block]')).toHaveCount(4);
  await shot(page, info, 'SN4f-a-touren-gruppen-offen');
  // V8 has no zones without the Strava details: a quiet line, never an empty chart
  await expect(group('body').locator('[data-block="V8"] .quiet')).toHaveText(T('No time in zones yet. It comes with the heart rate details from Strava.'));
  await expect(group('body').locator('[data-block="V8"] .zcol')).toHaveCount(0);
  const v6 = async () => group('records').locator('[data-block="V6"] tbody').innerText();
  const v6Before = await v6();
  const co2Before = int(await group('records').locator('[data-co2]').innerText());
  const v1km = () => group('dist').locator('[data-block="V1"] .bars').first().evaluate((el) => [...el.querySelectorAll('li[data-km]')].reduce((s, li) => s + Number(li.dataset.km), 0));
  const kmBefore = await v1km();
  expect(co2Before).toBeGreaterThan(0);
  // V6 (4a): this year against last year up to the same date, the trip count read from the fixture
  const thisYear = DATA.tables.trips.filter((x) => x.status === 'done' && x.startDate >= `${D0.slice(0, 4)}-01-01` && x.startDate <= D0).length;
  await expect(group('records').locator('[data-ly="trips"] td').first()).toHaveText(String(thisYear));
  // V2: the longest trip opens its trip
  await expect(group('records').locator('[data-best="trip"] a')).toContainText('Frühlingstour');

  // a filter (Art: Mehrtägig) changes the blocks but not «Zum Vorjahr» (5a)
  await page.getByRole('button', { name: new RegExp(`^${T('Kind')}: `) }).click();
  await page.getByRole('button', { name: T('Multi-day|art') }).click();
  await expect.poll(async () => int(await group('records').locator('[data-co2]').innerText())).toBeLessThan(co2Before);
  expect(await v1km()).toBeLessThan(kmBefore);
  expect(await v6()).toBe(v6Before);
  await expect(iz.locator('.izh .rv-sub')).toContainText(T('filtered'));

  // the open groups are remembered
  await page.reload();
  await expect(toggle('records')).toHaveAttribute('aria-expanded', 'true');
  await expect(toggle('dist')).toHaveAttribute('aria-expanded', 'true');
  await toggle('dist').click();
  await expect(toggle('dist')).toHaveAttribute('aria-expanded', 'false');
  await expect(group('dist').locator('[data-summary]')).toContainText('km');

  // «Blöcke»: switch «Wetter» (V9) off and on again
  await iz.getByRole('button', { name: T('Blocks'), exact: true }).click();
  const dlg = page.getByRole('dialog', { name: T('Blocks') });
  await dlg.getByRole('checkbox', { name: T('Weather'), exact: true }).uncheck();
  await dlg.getByRole('button', { name: T('Done') }).click();
  await expect(group('records').locator('[data-block="V9"]')).toHaveCount(0);
  await expect(group('records').locator('[data-block]')).toHaveCount(3);
  await iz.getByRole('button', { name: T('Blocks'), exact: true }).click();
  await dlg.getByRole('button', { name: T('As at first (all on)') }).click();
  await dlg.getByRole('button', { name: T('Done') }).click();
  await expect(group('records').locator('[data-block="V9"]')).toBeVisible();
  await noSideways(page);
  expect(errors).toEqual([]);
});
