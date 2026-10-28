// «Tour» (Noah 19.10.2026 21:05 «1a 2 beides 3b 4 beides 5a»): the page of a finished tour, German UI,
// phone 390 and desktop 1440, fictional data (sn4plus-fixture.js plus the activities of at1-acts.js, two of
// them with a made-up line and course):
// a) a row of «Abgeschlossene Touren» opens #/tour/…: key figures, map, profile linked with the map, the parts
//    as a jump bar or as tabs (2 «beides»);
// b) rename and correct values (3b): «geändert» with Strava's value, the list follows; own rating and diary;
// c) the list as tiles, map and calendar (4 «beides»); «Mehrere wählen» joins two rides into one tour (5a),
//    «Verbindung lösen» takes it apart again;
// d) hide and show again, delete with Undo; a trip of the Packmodus opens its page with Gepäck and Rückblick (1a).
import { test, expect } from '@playwright/test';
import { STEP_BAR as BAR } from '../../src/lib/stepbar.js'; // Schrittleiste (Noah 26.10.2026 «1b», changed on purpose): the bar's short names
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { sn4plusData, P, D0, day } from './sn4plus-fixture.js';
import { at1Acts } from './at1-acts.js';
import { importAndSettle } from './settle.js';
import { expectRound } from './roundaxis.js';
import { openShort } from './kurz-open.js';
import { encodePolyline } from '../../src/lib/spur/polyline.js';

const SHOTS = '/tmp/claude-0/sn-shots/tour';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const shot = async (page, info, name, fullPage = true) => {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const A = 'test_tour_';
const key = (k) => `#/tour/${encodeURIComponent(k)}`;

/** A made-up line going out from (47.30, 8.50). */
const lineOf = (dir, n = 14) => encodePolyline(Array.from({ length: n }, (_, i) => [47.3 + Math.sin(dir) * 0.008 * i, 8.5 + Math.cos(dir) * 0.01 * i]));
const course = (km) => ({ pts: Array.from({ length: 30 }, (_, i) => [i * 6, 450 + Math.round(Math.sin(i / 4) * 180 + i * 6), 130, null]), breaks: [] });

function data() {
  const d = sn4plusData();
  const acts = at1Acts(day, A);
  acts[0] = { ...acts[0], line: lineOf(0.4), prof: course(62.4) };
  acts[5] = { ...acts[5], line: lineOf(2.1), prof: course(71) };
  acts[1] = { ...acts[1], line: lineOf(4.0, 6) };
  d.tables.activities = acts;
  return d;
}

async function start(page, context, info) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/tour-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(data()));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.setFixedTime(new Date(`${D0}T10:00:00+02:00`));
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  await importAndSettle(page, file);
  await page.goto('./#/trips/rides'); // Gesamttest 20.10.2026 B3: the activities are on Touren › Fahrten
  await openShort(page);
  await expect(page.locator('[data-act-list] [data-act-row]').first()).toBeVisible();
  return errors;
}
const acts = (page) => page.locator('section[data-activities]');
const tour = (page) => page.locator('[data-tour-page]');

test('a) a finished tour opens its page: key figures, map, profile, jump bar or tabs', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await acts(page).locator(`[data-act-row="a:${A}1"]`).click({ position: { x: 30, y: 30 } });
  await expect(page).toHaveURL(new RegExp(`${key(`a:${A}1`).replace(/[/?]/g, '\\$&')}$`));
  await expect(tour(page).getByRole('heading', { level: 1, name: `${A} Abendrunde mit Wattmesser` })).toBeVisible();
  // Noah 20.10.2026 «vier Werte hervorheben»: Distanz, Höhenmeter, Fahrzeit, Ø HF
  await expect(tour(page).locator('[data-kpi]')).toHaveCount(4);
  await expect(tour(page).locator('[data-kpi="km"] b')).toContainText('62.4');
  // the map and the profile, linked: the finger on the profile puts a dot on the map
  await expect(tour(page).locator('.tmap')).toBeVisible();
  const prof = tour(page).locator('[data-tour-profile] svg');
  await prof.scrollIntoViewIfNeeded();
  const b = await prof.boundingBox();
  await page.mouse.move(b.x + b.width * 0.5, b.y + b.height * 0.5);
  await expect(tour(page).locator('[data-map-marker]')).toHaveCount(1);
  await expect(tour(page).locator('[data-profile-at]')).toContainText('km');
  // «Genaue Werte» (27.10.2026): the heights in round steps, the top one with «m»
  const ms = await tour(page).locator('[data-profile-tick]').allTextContents();
  expectRound(ms);
  expect(ms.at(-1)).toMatch(/ m$/);
  // all five parts on one page; the bar jumps
  for (const p of ['overview', 'values', 'pack', 'diary', 'review']) await expect(tour(page).locator(`[data-tour-part="${p}"]`)).toBeVisible();
  await shot(page, info, 'T1-tour-seite');
  // «Einzeln»: tabs, one part at a time (kept for the next tour)
  await tour(page).locator('[data-tour-bar]').getByRole('button', { name: T('One at a time') }).click();
  await expect(tour(page).locator('[data-tour-part]')).toHaveCount(1);
  await tour(page).getByRole('tab', { name: T('Values|tour') }).click();
  await expect(tour(page).locator('[data-tour-part="values"]')).toBeVisible();
  // Tour-Auswertung (20.10.2026 «3a und b»): the best 20 minutes stand in the table «Bestwerte»
  await expect(tour(page).locator('[data-tour-part="values"] [data-best="power"] td').last()).toContainText('236');
  await shot(page, info, 'T2-tour-reiter-werte', false);
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('b) rename and correct values: «geändert» with the Strava value; rating and diary', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./${key(`a:${A}6`)}`);
  await expect(tour(page).locator('h1')).toHaveText(`${A} Gravel-Runde`);
  // rename (only in the app)
  await tour(page).getByRole('button', { name: T('More for {what}', { what: `${A} Gravel-Runde` }) }).click();
  await page.getByRole('menuitem', { name: new RegExp(`^${T('Rename')}`) }).click();
  const dlg = page.locator('dialog[open]');
  await dlg.locator('input').fill('Gravel durchs Hochland');
  await dlg.locator('input').press('Enter');
  await expect(tour(page).locator('h1')).toHaveText('Gravel durchs Hochland');
  // 3b: correct the km
  await tour(page).locator('[data-correct-open]').click();
  const cs = page.locator('dialog[data-tour-sheet="correct"]');
  await cs.locator('[data-own="km"]').fill('74,5');
  await cs.locator('[data-own-save]').click();
  await expect(tour(page).locator('[data-kpi="km"] b')).toContainText('74.5');
  await expect(tour(page).locator('[data-was="km"]')).toContainText('71.0 km');
  await expect(tour(page).locator('[data-changed]')).toBeVisible();
  // rating and diary
  await tour(page).locator('[data-tour-rating] button').nth(3).click();
  await expect(tour(page).locator('.pills')).toContainText(T('Rated|state'));
  await tour(page).locator('[data-tour-diary]').fill('Viel Schotter, ein Platten am Pass.');
  await shot(page, info, 'T3-tour-geaendert');
  // the list follows: the own name, «geändert», the corrected km
  await page.goto('./#/trips/rides');
  await openShort(page);
  const row = acts(page).locator(`[data-act-row="a:${A}6"]`);
  await expect(row).toContainText('Gravel durchs Hochland');
  await expect(row).toContainText(T('changed'));
  // the diary is the note of the activity in Training too
  await page.goto(`./#/flow/training/a/${A}6`);
  await expect(page.locator('textarea').first()).toHaveValue('Viel Schotter, ein Platten am Pass.');
  expect(errors).toEqual([]);
});

test('c) tiles, map, calendar; «Mehrere wählen» joins two rides into one tour and takes it apart', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  // on a phone the views wait behind «Ansichten» under the five rows («Handy kurz»)
  await acts(page).locator('[data-act-row]').first().waitFor();
  if (await acts(page).locator('[data-act-views-open]').count()) await acts(page).locator('[data-act-views-open]').click();
  const views = acts(page).locator('[data-act-views]');
  await views.getByRole('button', { name: T('Tiles|view') }).click();
  await expect(acts(page).locator('[data-act-tile]').first()).toBeVisible();
  await expect(acts(page).locator(`[data-act-tile="a:${A}1"] svg.mini path`)).toHaveCount(1);
  await shot(page, info, 'T4-liste-kacheln');
  await views.getByRole('button', { name: T('Map|view') }).click();
  await expect(acts(page).locator('[data-act-map] .tmap')).toBeVisible();
  await shot(page, info, 'T5-liste-karte', false);
  await views.getByRole('button', { name: T('Calendar|view') }).click();
  await expect(acts(page).locator(`[data-cal-tour="a:${A}1"]`)).toBeVisible();
  await shot(page, info, 'T6-liste-kalender');
  // the choice stays after a reload
  await page.reload();
  await openShort(page);
  await expect(acts(page).locator('[data-act-cal]')).toBeVisible();
  // 5a: back to rows, choose two, join
  await acts(page).locator('[data-act-views]').getByRole('button', { name: T('Rows|view') }).click();
  // the view is stored first; wait for the rows before asking for «Show n more» (the phone shows five rows)
  await expect(acts(page).locator('[data-act-list] [data-act-row]').first()).toBeVisible();
  if (await acts(page).locator('[data-act-phone-more]').count()) await acts(page).locator('[data-act-phone-more]').click();
  await acts(page).locator('[data-act-pick]').click();
  await acts(page).locator(`[data-pick="a:${A}1"]`).click();
  await acts(page).locator(`[data-pick="a:${A}6"]`).click();
  await expect(acts(page).locator('[data-pick-bar]')).toContainText(T('{n} chosen', { n: 2 }));
  await shot(page, info, 'T7-mehrere-waehlen', false);
  await acts(page).locator('[data-pick-join]').click();
  const dlg = page.locator('dialog[open]');
  await dlg.locator('input').fill('Zwei Runden');
  await dlg.locator('input').press('Enter');
  const grp = acts(page).locator('[data-act-row^="g:"]');
  await expect(grp).toHaveCount(1);
  await expect(grp).toContainText('Zwei Runden');
  await expect(acts(page).locator(`[data-act-row="a:${A}1"]`)).toHaveCount(0);
  // the joined tour's page: both activities, summed km
  await grp.locator('a.an').click();
  await expect(tour(page).locator('h1')).toHaveText('Zwei Runden');
  await expect(tour(page).locator('[data-tour-acts] li')).toHaveCount(2);
  await expect(tour(page).locator('[data-kpi="km"] b')).toContainText('133.4');
  await shot(page, info, 'T8-verbundene-tour');
  // take it apart: the two rides are tours of their own again
  await tour(page).getByRole('button', { name: T('More for {what}', { what: 'Zwei Runden' }) }).click();
  await page.getByRole('menuitem', { name: new RegExp(`^${T('Take apart')}`) }).click();
  await page.locator('dialog[open]').getByRole('button', { name: T('Take apart') }).click();
  await expect(page).toHaveURL(/#\/trips\/rides$/); // Gesamttest 20.10.2026 B3: back to Touren › Fahrten
  await openShort(page);
  await expect(acts(page).locator(`[data-act-row="a:${A}1"]`)).toHaveCount(1);
  await expect(acts(page).locator('[data-act-row^="g:"]')).toHaveCount(0);
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('d) hide and show again, delete with Undo; a Packmodus trip opens its page with Gepäck and Rückblick', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  // hide the run from its page
  await page.goto(`./${key(`a:${A}3`)}`);
  await tour(page).getByRole('button', { name: T('More for {what}', { what: `${A} Lauf am See` }) }).click();
  await page.getByRole('menuitem', { name: new RegExp(`^${T('Hide')}`) }).click();
  await expect(tour(page).locator('[data-hidden]')).toBeVisible();
  await page.goto('./#/trips/rides');
  await openShort(page);
  await expect(acts(page).locator(`[data-act-row="a:${A}3"]`)).toHaveCount(0);
  await acts(page).locator('[data-show-hidden]').click();
  await expect(acts(page).locator(`[data-act-row="a:${A}3"]`)).toHaveCount(1);
  // delete the yoga: asked in the app's window, then gone
  await page.goto(`./${key(`a:${A}5`)}`);
  await tour(page).getByRole('button', { name: T('More for {what}', { what: `${A} Yoga` }) }).click();
  await page.getByRole('menuitem', { name: new RegExp(`^${T('Delete')}`) }).click();
  await page.locator('dialog[open]').getByRole('button', { name: T('Delete') }).click();
  await expect(page).toHaveURL(/#\/trips\/rides$/); // back to Touren › Fahrten, where it came from
  await openShort(page);
  await expect(acts(page).locator(`[data-act-row="a:${A}5"]`)).toHaveCount(0);
  // 1a: a trip of the Packmodus opens the page «Tour»; Gepäck and Rückblick are parts of it
  await page.goto(`./${key(`t:${P}herbst`)}`);
  await expect(tour(page).locator('h1')).toHaveText('Herbsttour Hochland');
  await expect(tour(page).locator('[data-tour-gear]')).toBeVisible();
  await expect(tour(page).locator('[data-open-review]')).toHaveAttribute('href', `#/debrief/${encodeURIComponent(`${P}herbst`)}`);
  // Versteckte Funktionen (Noah 22.10.2026 «1a»): a written Rückblick shows «Als Vorlage speichern» as a visible button
  const written = (await tour(page).locator('[data-tour-part="review"]').textContent()).includes(T('The Rückblick is written.'));
  await expect(tour(page).locator('[data-review-template]')).toHaveCount(written ? 1 : 0);
  // 0.174 «Eine Tour, eine Seite» (UI-Ziele #5): the trip's head with its step tabs; «Rückblick» leads there,
  // and the Rückblick leads back with «Tour-Seite ansehen ›»
  const toReview = tour(page).locator('[data-tour-steps] .stepbar a').filter({ hasText: T(BAR.debrief) });
  await expect(toReview).toHaveAttribute('href', `#/debrief/${encodeURIComponent(`${P}herbst`)}`);
  await expect(tour(page).locator('[data-tour-steps] .stepbar a[aria-current="page"]')).toContainText(T(BAR.analysis));
  await shot(page, info, 'T9-packmodus-tour');
  await noSideways(page);
  await toReview.click();
  await expect(page).toHaveURL(new RegExp(`#/debrief/${encodeURIComponent(`${P}herbst`)}$`));
  await expect(page.locator('main a[data-to-tour-page]')).toHaveAttribute('href', key(`t:${P}herbst`));
  await expect(page.locator('main a[data-to-tour-page]')).toContainText(T('See the tour page'));
  expect(errors).toEqual([]);
});

test('e) the elapsed time reads in words; on a computer the jump bar marks the part on screen', async ({ page, context }, info) => {
  // Noah 27.10.2026 «1a»: «2 h 45 min 00 s» instead of «00:02:45:00»; at the top «Übersicht» lights up, not «Gepäck»
  const errors = await start(page, context, info);
  await acts(page).locator(`[data-act-row="a:${A}1"]`).click({ position: { x: 30, y: 30 } });
  await expect(tour(page).locator('[data-tour-part="values"]')).toBeVisible();
  await expect(tour(page).locator('[data-field="verstr"] dd')).toHaveText(/^\d+ h \d\d min \d\d s$/);
  if (info.project.name !== 'phone') {
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(tour(page).locator('[data-tour-bar] [data-part="overview"]')).toHaveClass(/\bon\b/);
    await expect(tour(page).locator('[data-tour-bar] [data-part="pack"]')).not.toHaveClass(/\bon\b/);
    await tour(page).locator('[data-tour-bar] [data-part="analysis"]').click();
    await expect(tour(page).locator('[data-tour-bar] [data-part="analysis"]')).toHaveClass(/\bon\b/);
  }
  expect(errors).toEqual([]);
});
