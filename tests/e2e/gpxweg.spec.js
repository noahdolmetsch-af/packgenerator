// GPX-Weg (Noah 15.10.2026 «1-5 a»): the way after the first GPX upload. Every «Fahrt hochladen» is the one
// upload; before saving it says what happens, after saving you land on the ride with the card «Fahrt
// gespeichert»; «Dein Tempo» explains itself, says the standard plainly and marks the new rides; the same
// ride twice counts once; a planned route offers the trip. Fictional rides only (tests/test_data_gtp_gpx.js).
import { test, expect } from './clock.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { makeGpx } from '../test_data_gtp_gpx.js';
import { ready, importAndSettle } from './settle.js';
import { v038Data, P } from './v038-fixture.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
// SHOTS_DIR: the pictures of the finished app for Noah (light, 390 and 1440); none on CI
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (page, info, name, fullPage = true) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png`, fullPage });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

test('first GPX upload: one way, what happens, saved card, counted once, route offers a trip', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const file = (name, gpx) => {
    const p = info.outputPath(name);
    writeFileSync(p, gpx);
    return p;
  };
  const evening = file('test_data_gtp_abend.gpx', makeGpx({ name: 'test_data_gtp_ Abendrunde', start: `${day(-1)}T15:00:00Z`, legs: [{ km: 18, kmh: 24 }, { stopMin: 25 }, { km: 16, kmh: 20, gainM: 380 }] }));
  const morning = file('test_data_gtp_morgen.gpx', makeGpx({ name: 'test_data_gtp_ Morgenrunde', start: `${day(-3)}T06:00:00Z`, legs: [{ km: 30, kmh: 22, gainM: 300 }] }));
  const lunch = file('test_data_gtp_mittag.gpx', makeGpx({ name: 'test_data_gtp_ Mittagsrunde', start: `${day(-5)}T11:00:00Z`, legs: [{ km: 25, kmh: 21, gainM: 200 }] }));
  const route = file('test_data_gtp_route.gpx', `<?xml version="1.0"?><gpx version="1.1" creator="test"><trk><name>test_data_gtp_ Route</name><trkseg><trkpt lat="47.1" lon="7.2"><ele>430</ele></trkpt><trkpt lat="47.15" lon="7.3"><ele>500</ele></trkpt><trkpt lat="47.2" lon="7.4"><ele>450</ele></trkpt></trkseg></trk></gpx>`);

  // 1. «Dein Tempo» before any ride: the Einstieg, the standard said plainly, «Fahrt hochladen» is the one upload
  await page.goto('./#/debrief/pace');
  await ready(page);
  const main = page.locator('main');
  const intro = main.locator('[data-intro="pace"]');
  await expect(intro).toContainText(T('How «Your pace» works'));
  await expect(intro.locator('ol li')).toHaveCount(3);
  const rule = main.locator('section.rule');
  await expect(rule).toContainText(T('Standard rule · no ride of your own yet'));
  await expect(rule.getByRole('heading', { level: 2 })).toHaveText(T('{kmh} km/h and 1 h per {m} Hm', { kmh: '16', m: '600' }));
  await noSideways(page);
  await shot(page, info, 'G1-tempo-erster-besuch');
  await rule.getByRole('link', { name: T('Upload ride') }).click();
  await expect(page).toHaveURL(/#\/debrief\/ride$/);

  // 2. the upload says how it works; after choosing the file, what saving does
  await expect(main.getByRole('list', { name: T('How it works') })).toBeVisible();
  await main.locator('.pickbtn input[type=file]').setInputFiles(evening);
  const what = main.locator('[data-what-happens]');
  await expect(what).toContainText(T('What happens when you save'));
  await expect(what).toContainText(T('ride {n} of {min}. From {min} rides every trip guesses with your pace.', { n: 1, min: 5 }));
  await noSideways(page);
  await shot(page, info, 'G2-vorschau');

  // 3. saved: the ride page with the card, what happened, one next step
  await main.getByRole('button', { name: T('Save ride') }).click();
  await expect(page).toHaveURL(/#\/debrief\/ride\/ride-/);
  const card = main.locator('[data-saved-card]');
  await expect(card).toContainText(T('Your first ride is here.'));
  await expect(card).toContainText(T('Your pace: {n} of {min}', { n: 1, min: 5 }));
  await expect(card).toContainText(T('Trips › Look back shows it now.'));
  await noSideways(page);
  await shot(page, info, 'G3-gespeichert', false);
  await card.getByRole('button', { name: T('See learnings') }).click();
  await card.getByRole('button', { name: T('Close') }).click();
  await expect(card).toHaveCount(0);

  // 4. the same file again: named, counts once
  await page.goto('./#/debrief/ride');
  await main.locator('.pickbtn input[type=file]').setInputFiles(evening);
  await expect(main.locator('.dupmsg')).toContainText(/zählt nur einmal/);

  // 5. a planned route: what it is, and the way to a trip
  await main.locator('.pickbtn input[type=file]').setInputFiles(route);
  const rc = main.locator('[data-route-card]');
  await expect(rc).toContainText(T('Planned route, not a ride'));
  await shot(page, info, 'G5-route-statt-fahrt', false);
  await rc.getByRole('button', { name: T('Use as route for a trip') }).click();
  await expect(page).toHaveURL(/#\/trips$/);
  await expect(page.locator('[data-komoot-sheet]')).toBeVisible();
  await page.locator('[data-komoot-sheet]').getByRole('button', { name: T('Close') }).click();
  await expect(page.locator('[data-komoot-sheet]')).toHaveCount(0);

  // 6. several files at once: one card, every ride saved and counted
  await page.goto('./#/debrief/ride');
  await main.locator('.pickbtn input[type=file]').setInputFiles([morning, lunch]);
  const many = main.locator('[data-saved-card]');
  await expect(many).toContainText(T('{n} rides saved', { n: 2 }));
  await expect(many).toContainText(T('Your pace: {n} of {min}', { n: 3, min: 5 }));
  await shot(page, info, 'G6-mehrere-dateien', false);

  // 7. «Dein Tempo» afterwards: the standard plainly, your rides so far, the new rides marked
  await page.goto('./#/debrief/pace');
  await expect(rule).toContainText(T('Standard rule · your rides so far: {n}', { n: 3 }));
  await expect(rule.getByRole('heading', { level: 2 })).toHaveText(T('{kmh} km/h and 1 h per {m} Hm', { kmh: '16', m: '600' }));
  await expect(main.locator('.rides li')).toHaveCount(3);
  await expect(main.locator('.rides li.fresh')).toHaveCount(3);
  await noSideways(page);
  await shot(page, info, 'G7-tempo-danach');

  // 8. Look back shows the rides at once
  await page.goto('./#/debrief');
  await expect(main.getByText(T('Nothing to look back on yet.'))).toHaveCount(0);
  await shot(page, info, 'G8-rueckblick', false);
  expect(errors).toEqual([]);
});

// R3 (Noah 15.10.2026 «5a»): one way «Fahrt hochladen» for GPX, TCX and CSV. The trip's look back has no own
// import any more; a CSV list puts the km into the trip's look back and goes on to the km per bike.
test('one way for GPX, TCX and CSV: the list fills the trip km and goes on to the bikes', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.accept());
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  // the summer trip's look back is still open (a draft without km); the autumn one is finished
  const data = v038Data();
  const open = data.tables.debriefs.find((x) => x.tripId === `${P}sommer`);
  Object.assign(open, { status: 'draft', km: null });
  const fixture = info.outputPath('gpxweg-csv.json');
  writeFileSync(fixture, JSON.stringify(data));
  await page.goto('./');
  await importAndSettle(page, fixture);
  const main = page.locator('main');
  const sommer = `${P}sommer`;
  const csv = info.outputPath('test_data_gtp_activities.csv');
  writeFileSync(
    csv,
    [
      'Activity ID,Activity Date,Activity Name,Activity Type,Distance',
      `1,${day(-90)} 07:00:00,test_data_gtp_ Tag eins,Ride,50.4`,
      `2,${day(-89)} 07:30:00,test_data_gtp_ Tag zwei,Gravel Ride,44.6`,
      `3,${day(-89)} 18:00:00,test_data_gtp_ Lauf,Run,6.0`,
      `4,${day(-10)} 08:00:00,test_data_gtp_ Feierabend,Ride,30.0`,
      `5,${day(-365)} 09:00:00,test_data_gtp_ Herbst,Ride,70.0`,
    ].join('\n'),
  );

  // the trip's look back: one row «Fahrt hochladen», no file input of its own
  await page.goto(`./#/debrief/${encodeURIComponent(sommer)}`);
  await ready(page);
  const row = main.locator('[data-upload-row]');
  await expect(row).toContainText(T('Upload ride'));
  await expect(row).toContainText(T('GPX, TCX or CSV from Strava or Garmin: the km of this trip, pauses, planned vs real'));
  await expect(main.locator('#upload-h').locator('xpath=../../..').locator('input[type=file]')).toHaveCount(0);
  await noSideways(page);
  await shot(page, info, 'G9-rueckblick-tour-ein-weg');
  await row.click();
  await expect(page).toHaveURL(/#\/debrief\/ride$/);

  // the upload takes the CSV: one card, the km of the trip, why it does not count for the pace
  await expect(main.locator('.pickbtn input[type=file]')).toHaveAttribute('accept', /\.csv/);
  await main.locator('[data-where-from] summary').click();
  await expect(main.locator('[data-where-from]')).toContainText('activities.csv');
  await main.locator('.pickbtn input[type=file]').setInputFiles(csv);
  const card = main.locator('[data-list-card]');
  await expect(card).toContainText(T('List read: {n} rides', { n: 4 }));
  await expect(card).toContainText(T('{n} ride, {km} km. Its look back is finished, so its km stay as they are.', { n: 1, km: 70 }));
  await expect(card).toContainText(`${P} Sommertour`);
  await expect(card).toContainText(T('{n} rides, {km} km: in the look back of this trip.', { n: 2, km: 95 }));
  await expect(card).toContainText(T('{n} ride on a day without a trip: not counted here.', { n: 1 }));
  await expect(card).toContainText(T('a list has no track and no times, so it does not count. For your pace upload the ride as GPX.'));
  await noSideways(page);
  await shot(page, info, 'G10-liste-gelesen');

  // the trip's look back has the km now
  await card.getByRole('link', { name: T('To Look back') }).click();
  await page.goto(`./#/debrief/${encodeURIComponent(sommer)}`);
  await expect(page).toHaveURL(new RegExp(`#/debrief/${sommer}$`));
  await expect(main.getByLabel(T('km of this trip'))).toHaveValue('95');
  await expect(main.locator('[data-upload-row]')).toContainText(T('{n} rides', { n: 2 }));

  // and on to the km per bike, without choosing the file again
  await page.goto('./#/debrief/ride');
  await main.locator('.pickbtn input[type=file]').setInputFiles(csv);
  await main.locator('[data-list-card]').getByRole('button', { name: T('Also for the km of my bikes') }).click();
  await expect(page).toHaveURL(/#\/bikes\?tab=care&view=import/);
  await expect(main).toContainText('test_data_gtp_activities.csv');
  await shot(page, info, 'G11-weiter-zu-velo-km');
  expect(errors).toEqual([]);
});
