// «Eine Tour, eine Seite» (0.174, UI-Ziele #5, #8, #10, #18; Noah 20.10.2026 «alle freigegeben»), German UI,
// phone 390 and desktop 1440, fictional data (sn4plus-fixture.js, clock Friday 9 October 2026) plus two
// made-up trips: one planned in 5 days without weather and route, one back for 2 days without a ride.
// a) Planen starts with «Fehlt noch: Wetter und Strecke. Beides geht auch später.»; the step bar has the
//    fifth tab «Auswertung», which opens the tour page with the same head and the countdown «In 5 Tagen»;
// b) back for 2 days without a ride: «Zurück seit 2 Tagen», the card «Fahrt verbinden», no empty values, and
//    «12 Teile warten auf dein Urteil · Durchgehen»;
// c) Lernschleife: after a tour with a ride one question, the heaviest thing first; «Nein» marks it «nicht
//    gebraucht», «Heute nicht» ends the questions of the day, and no other tour asks that day.
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { sn4plusData, P, D0, day } from './sn4plus-fixture.js';
import { importAndSettle } from './settle.js';

const SHOTS = '/tmp/claude-0/sn-shots/einetour';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const shot = async (page, info, name, fullPage = false) => {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const key = (k) => `#/tour/${encodeURIComponent(k)}`;
const PLAN = `${P}eine-plan`;
const BACK = `${P}eine-back`;
const HERBST = `${P}herbst`;

function data() {
  const d = sn4plusData();
  const T0 = d.tables;
  const herbst = T0.trips.find((x) => x.id === HERBST);
  const base = { domain: 'bikepacking', bikeId: herbst.bikeId, bike: herbst.bike, setup: herbst.setup, ready: [], createdAt: `${day(-20)}T08:00:00.000Z` };
  // the gear of the autumn trip, twice as long a list for the trip that is back (more than 8 things)
  const gear = herbst.entries.map((e) => ({ ...e, packed: false }));
  T0.trips.push({ ...base, id: PLAN, title: 'Planung Seeland', startDate: day(5), days: 2, entries: gear.slice(0, 6) });
  T0.trips.push({ ...base, id: BACK, title: 'Rückkehr Jura', startDate: day(-3), days: 2, entries: gear, wx: { min: 6, max: 14, rain: 'none' }, route: { km: 96 }, status: 'done' });
  return d;
}

async function start(page, context, info) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/einetour-${info.testId}.json`;
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
  return errors;
}
const tour = (page) => page.locator('[data-tour-page]');

test('a) Planen says what is missing; «Auswertung» is the fifth tab with the same head', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./${key(`t:${PLAN}`)}`);
  // the trip's head and its step bar: five tabs, «Auswertung» is this page
  const steps = tour(page).locator('[data-tour-steps] .stepbar a');
  await expect(steps).toHaveCount(5);
  await expect(steps.last()).toHaveText(new RegExp(`^${T('Analysis|stage')}`));
  await expect(steps.last()).toHaveAttribute('aria-current', 'page');
  await expect(tour(page).locator('h1')).toHaveText('Planung Seeland');
  // #10: the warm countdown chip; #8: before the tour no empty values, one calm card
  await expect(tour(page).locator('[data-tour-countdown]')).toHaveText(T('In {n} days|tour', { n: 5 }));
  await expect(tour(page).locator('[data-ride-connect]')).toContainText(T('The analysis comes after the tour'));
  await expect(tour(page).locator('[data-tour-weather]')).toHaveCount(0);
  await expect(tour(page).locator('[data-tour-ask]')).toHaveCount(0);
  await shot(page, info, 'E1-auswertung-geplant');
  await noSideways(page);
  // the tab «Planen» opens this trip's Planen, with the same five tabs
  await steps.first().click();
  await expect(page).toHaveURL(/#\/pack$/);
  const band = page.locator('main .trip-band');
  await expect(band.locator('h1')).toHaveText('Planung Seeland');
  await expect(band.locator('.stepbar a')).toHaveCount(5);
  await expect(band.locator('.stepbar a').first()).toHaveAttribute('aria-current', 'page');
  // #5: «Fehlt noch» first, calmly
  const parts = [T('Weather|missing'), T('Route|missing')];
  await expect(page.locator('[data-plan-missing]')).toContainText(`${T('Still missing:')} ${parts[0]}`);
  await expect(page.locator('[data-plan-missing]')).toContainText(T('Both can also come later.'));
  await shot(page, info, 'E2-planen-fehlt-noch');
  // and back: «Auswertung» leads to the tour page
  await band.locator('.stepbar a').last().click();
  await expect(page).toHaveURL(new RegExp(`${key(`t:${PLAN}`).replace(/[/?]/g, '\\$&')}$`));
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('b) back for 2 days without a ride: «Fahrt verbinden», no empty values, the gear waits for a verdict', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./${key(`t:${BACK}`)}`);
  await expect(tour(page).locator('[data-tour-countdown]')).toHaveText(T('Back for {n} days', { n: 2 }));
  await expect(tour(page).locator('[data-tour-say]')).toHaveText(T('{km} km behind you.', { km: 96 }));
  const card = tour(page).locator('[data-ride-connect]');
  await expect(card).toContainText(T('Connect a ride'));
  await expect(card.locator('[data-connect-gpx]')).toHaveAttribute('href', '#/debrief/ride');
  // only the key figures there are: the planned km, no «–»
  await expect(tour(page).locator('[data-kpi]')).toHaveCount(1);
  await expect(tour(page).locator('[data-kpis]')).not.toContainText('–');
  await expect(tour(page).locator('[data-tour-values]')).not.toContainText('–');
  // no ride, so no question yet
  await expect(tour(page).locator('[data-tour-ask]')).toHaveCount(0);
  const n = data().tables.trips.find((x) => x.id === BACK).entries.filter((e) => data().tables.items.find((i) => i.id === e.itemId)?.category !== 'food').length;
  const gear = tour(page).locator('[data-tour-gear]');
  await expect(gear.locator('[data-gear-wait]')).toContainText(T('{n} things wait for your verdict', { n }));
  await expect(gear.locator('.glist2:not([data-food])')).toHaveCount(0);
  await shot(page, info, 'E3-zurueck-ohne-fahrt', true);
  await gear.locator('[data-gear-go]').click();
  await expect(gear.locator('.glist2:not([data-food]) [data-gear-row]')).toHaveCount(n);
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('c) Lernschleife: one question, the heaviest thing first; «Nein», «Heute nicht», one card a day', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const d = data();
  const herbst = d.tables.trips.find((x) => x.id === HERBST);
  const deb = d.tables.debriefs.find((x) => x.tripId === HERBST);
  const byId = Object.fromEntries(d.tables.items.map((i) => [i.id, i]));
  const open = herbst.entries.map((e) => ({ e, it: byId[e.itemId] })).filter(({ e, it }) => it && it.category !== 'food' && !deb?.items?.[e.itemId]);
  open.sort((a, b) => (b.it.weightG ?? 0) * (b.e.qty || 1) - (a.it.weightG ?? 0) * (a.e.qty || 1) || String(a.it.name).localeCompare(String(b.it.name)));
  const [first, second] = open.map((x) => x.it);
  await page.goto(`./${key(`t:${HERBST}`)}?step=analysis`);
  const ask = tour(page).locator('[data-tour-ask]');
  await expect(ask).toHaveAttribute('data-ask-item', first.id);
  await expect(ask.getByRole('heading', { level: 2 })).toContainText(T('Did you use «{name}»?').split('«')[0]);
  await expect(ask).toContainText(T('Question {n} of {m}', { n: 1, m: Math.min(5, open.length) }));
  await expect(ask.locator('[data-ask-later]')).toHaveText(T('Not today'));
  await shot(page, info, 'E4-lernfrage');
  await noSideways(page);
  // «Nein»: the thing is marked «nicht gebraucht» in the gear, the next question comes
  await ask.locator('[data-ask="no"]').click();
  await expect(tour(page).locator(`[data-gear-row="${first.id}"]`)).toHaveAttribute('data-mark', 'unused');
  await expect(ask).toContainText(T('Question {n} of {m}', { n: 2, m: Math.min(5, open.length) }));
  await expect(ask).toHaveAttribute('data-ask-item', second.id);
  // «Heute nicht»: no more today, also not on another tour with a ride
  await ask.locator('[data-ask-later]').click();
  await expect(tour(page).locator('[data-tour-ask]')).toHaveCount(0);
  await page.reload();
  await expect(tour(page).locator('[data-tour-gear]')).toBeVisible();
  await expect(tour(page).locator('[data-tour-ask]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
