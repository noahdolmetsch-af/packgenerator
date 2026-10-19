// SN2x «SN2 extra» (Noah 13.10.2026 «SN2j–SN2k freigegeben»), German UI, phone 390 and desktop 1440,
// fictional data (sn2x-fixture.js):
// a) a day trip: five groups that fold open, only «Die Tour» open, the page remembers what was open;
//    map, timeline and notes; quiet lines where data is missing (Fitbit, daily check, power);
//    «Vergleich» names its group (the bike) and the similar trip;
// b) a 3-day trip: the day switch for the whole page, the days as a table, one day's numbers, timeline
//    and daily check; «Vergleich in Bikepacking» stays a quiet line without a similar trip;
// c) «Für nächstes Mal»: a new point gets its situation, and Packen shows only the points that fit the trip.
// The numbers are read from the fixture, not copied.
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { sn2xData, P, D0, day, HERBST, SEE, SEE2, LOOP, NEXT, POINTS } from './sn2x-fixture.js';
import { openData, settle } from './settle.js';

const SHOTS = '/tmp/claude-0/sn-shots/sn2x';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const DATA = sn2xData();
const shot = async (page, info, name) => {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
/** Phone: every button and select of the saved Rückblick is at least 44 px high and wide. */
async function targets(page, info) {
  if (info.project.name !== 'phone') return;
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('.saved button, .saved select')]
      .filter((el) => el.getBoundingClientRect().width > 1)
      .map((el) => ({ el: `${el.tagName} ${el.className} ${el.textContent.trim().slice(0, 30)}`, r: el.getBoundingClientRect() }))
      .filter((x) => x.r.height < 43.5 || x.r.width < 43.5)
      .map((x) => `${x.el} ${Math.round(x.r.width)}×${Math.round(x.r.height)}`),
  );
  expect(small).toEqual([]);
}
const table = (page, name) =>
  page.evaluate((s) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(s).objectStore(s).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);

async function start(page, context, info) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/sn2x-${info.testId}.json`;
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
  return errors;
}

const group = (page, key) => page.locator(`section[data-group="${key}"]`);
const head = (page, key) => group(page, key).locator('button.gb');
async function openGroup(page, key) {
  if ((await head(page, key).getAttribute('aria-expanded')) !== 'true') await head(page, key).click();
  await expect(head(page, key)).toHaveAttribute('aria-expanded', 'true');
}

test('a) a day trip: five groups that fold, map, timeline, notes, quiet lines and «Vergleich» in its bike', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/debrief/${encodeURIComponent(SEE)}`);
  const trip = DATA.tables.trips.find((x) => x.id === SEE);
  const bike = DATA.tables.bikes.find((b) => b.id === trip.bikeId);
  // five groups, «Die Tour» and «Weiter» open (Impeccable Runde 2); a day trip has no day switch
  await expect(page.locator('section[data-group]')).toHaveCount(5);
  for (const [key, name] of [['tour', 'The trip|review'], ['body', 'Body and performance'], ['way', 'On the way|review'], ['pack', 'Luggage and bike'], ['next', 'Next|review']]) {
    await expect(head(page, key)).toContainText(T(name));
    await expect(head(page, key)).toHaveAttribute('aria-expanded', key === 'tour' || key === 'next' ? 'true' : 'false');
  }
  await expect(page.locator('[data-days]')).toHaveCount(0);
  // a closed group shows one line with the most important
  await expect(head(page, 'tour')).toContainText(`${Math.round(DATA.tables.debriefs.find((d) => d.tripId === SEE).km)} km`);
  // the notes on the way and after the trip, and the sentence for next time
  const nNotes = DATA.tables.notes.filter((n) => n.tripId === SEE).length + (DATA.tables.debriefs.find((d) => d.tripId === SEE).note ? 1 : 0);
  await expect(head(page, 'tour')).toContainText(T('{n} notes', { n: nNotes }));
  // «Die Tour»: the numbers, the map with its numbers, the timeline and the notes
  const tour = group(page, 'tour');
  await expect(tour.getByRole('heading', { level: 2, name: T('Done. Good trip!') })).toBeVisible();
  await expect(tour.locator('[data-tour-map] svg')).toBeVisible();
  await expect(tour.locator('[data-tour-map] .mk').first()).toBeVisible();
  const tl = tour.locator('[data-timeline]');
  await expect(tl.locator('li.tle.start')).toHaveCount(1);
  await expect(tl.locator('li.tle.note')).toHaveCount(2);
  await expect(tl.locator('li.tle.pause')).toHaveCount(DATA.tables.rides.find((r) => r.tripId === SEE).pauses.length);
  const mine = DATA.tables.notes.filter((n) => n.tripId === SEE);
  const notes = tour.locator('[data-notes]');
  for (const n of mine) await expect(notes).toContainText(n.text);
  await expect(notes).toContainText(T('after the trip'));
  // SK merged in: «Woanders» under the number tiles inside «Die Tour»; the tile row at the very end, outside the groups
  await expect(tour.locator('section.ride [data-sk-woanders] [data-sk-link="x2s"]')).toBeVisible();
  await expect(page.locator('[data-sk="debrief"]')).toHaveCount(1);
  await expect(page.locator('.groups [data-sk="debrief"]')).toHaveCount(0);
  expect(await page.evaluate(() => !!(document.querySelector('.saved .groups').compareDocumentPosition(document.querySelector('[data-sk="debrief"]')) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  await noSideways(page);
  await shot(page, info, 'SN2j-tagestour-oben');

  // «Körper und Leistung» opens and closes; quiet lines where nothing is known
  await head(page, 'body').click();
  const body = group(page, 'body');
  await expect(head(page, 'body')).toHaveAttribute('aria-expanded', 'true');
  await expect(body.locator('section[data-heart-power]')).toBeVisible();
  // heart rate from the ride ledger, no power without activities: no power part, no W/kg
  await expect(body.locator('[data-hr]')).toBeVisible();
  await expect(body.locator('[data-power]')).toHaveCount(0);
  await expect(body.locator('[data-quiet="fitbit"]')).toContainText(T('Sleep and resting heart rate the night before · with Fitbit'));
  await expect(body.locator('[data-quiet="mood"]')).toContainText(T('No daily check on the days of this trip.'));
  // the page remembers what was open
  await page.reload();
  await expect(head(page, 'body')).toHaveAttribute('aria-expanded', 'true');
  await head(page, 'body').click();
  await expect(head(page, 'body')).toHaveAttribute('aria-expanded', 'false');
  await expect(group(page, 'body').locator('section[data-heart-power]')).toHaveCount(0);

  // «Gepäck und Velo»: the packing list as packed, the wear of the bike
  await openGroup(page, 'pack');
  await expect(group(page, 'pack').locator('[data-packed]')).toBeVisible();
  await expect(group(page, 'pack').locator('[data-wear-part="chain"]')).toContainText(`+${Math.round(DATA.tables.debriefs.find((d) => d.tripId === SEE).km)} km`);

  // «Weiter»: the comparison names its group and the similar trip
  await openGroup(page, 'next');
  const cmp = group(page, 'next').locator('[data-compare]');
  await expect(cmp.locator('[data-compare-group]')).toContainText(`${T('compared in:')} ${bike.name}`);
  await expect(cmp.locator('table.cmp')).toContainText(DATA.tables.trips.find((x) => x.id === SEE2).title);
  await expect(cmp.locator('table.cmp tbody tr').first()).toBeVisible();
  await targets(page, info);
  await noSideways(page);
  await shot(page, info, 'SN2j-tagestour-unten');
  expect(errors).toEqual([]);
});

test('b) a 3-day trip: the day switch for the whole page, one day, and «Vergleich» in Bikepacking', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/debrief/${encodeURIComponent(LOOP)}`);
  const trip = DATA.tables.trips.find((x) => x.id === LOOP);
  const switcher = page.locator('[data-days]');
  await expect(switcher.getByRole('button')).toHaveCount(trip.days + 1);
  await expect(switcher.getByRole('button', { name: T('Whole trip') })).toHaveAttribute('aria-pressed', 'true');
  // the days as a table; timeline and notes folded
  const tour = group(page, 'tour');
  await expect(tour.locator('[data-day-table] tbody tr')).toHaveCount(trip.days);
  await expect(tour.locator('[data-fold="timeline"]')).toBeVisible();
  await expect(tour.locator('[data-fold="timeline"]')).not.toHaveAttribute('open', '');
  await expect(head(page, 'next')).toContainText(T('Comparison in {group}', { group: 'Bikepacking' }));
  await noSideways(page);
  await shot(page, info, 'SN2k-mehrtaegig-oben');

  // Tag 2: the day's numbers, stage names, timeline and daily check
  await switcher.getByRole('button', { name: new RegExp(`^${esc(T('Day {n}', { n: 2 }))}`) }).click();
  await expect(switcher.getByRole('button', { name: new RegExp(`^${esc(T('Day {n}', { n: 2 }))}`) })).toHaveAttribute('aria-pressed', 'true');
  await expect(head(page, 'tour')).toContainText(`${T('The trip|review')} · ${T('Day {n}', { n: 2 })}`);
  const ride = tour.locator('section.ride');
  await expect(ride).toContainText(T('Day {n} of {all}', { n: 2, all: trip.days }));
  await expect(ride).toContainText('Bergdorf – Seeweiler');
  await expect(ride.locator('[data-sk-woanders] [data-sk-link="x2k"]')).toBeVisible();
  const r2 = DATA.tables.rides.find((r) => r.tripId === LOOP && r.date === day(-42 + 1));
  await expect(ride.locator('.rv-tile').first()).toContainText(`${Math.round(r2.km)} km`);
  await expect(tour.locator('[data-day-table]')).toHaveCount(0);
  const tl = tour.locator('[data-timeline]');
  await expect(tl.locator('li.tle.start')).toHaveCount(1);
  await expect(tl.locator('li.tle').first()).toContainText('km 0');
  // the groups that are for the whole trip say so
  await expect(head(page, 'pack')).toContainText(T('for the whole trip · «Whole trip» on top shows it'));
  // the daily check of that day only
  await openGroup(page, 'body');
  const check = DATA.tables.flowChecks[1];
  await expect(group(page, 'body').locator('[data-mood] li')).toHaveCount(1);
  await expect(group(page, 'body').locator('[data-mood]')).toContainText(T('Day {n}', { n: 2 }));
  await expect(group(page, 'body').locator('[data-mood] .dots').first()).toHaveAttribute('aria-label', T('{what} {n} of 10', { what: T('Mood'), n: check.mood }));
  await targets(page, info);
  await noSideways(page);
  await shot(page, info, 'SN2k-mehrtaegig-tag2');

  // back to the whole trip; «Vergleich» names Bikepacking and stays a quiet line
  await switcher.getByRole('button', { name: T('Whole trip') }).click();
  await openGroup(page, 'next');
  const cmp = group(page, 'next').locator('[data-compare]');
  await expect(cmp.locator('[data-compare-group]')).toContainText(`${T('compared in:')} Bikepacking`);
  await expect(cmp.locator('[data-quiet="compare"]')).toContainText(T('No similar trip in {group} yet (km and climbing each within 20 %).', { group: 'Bikepacking' }));
  await expect(cmp.locator('table')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('c) «Für nächstes Mal»: each point with its situation; Packen shows only the ones that fit', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/debrief/${encodeURIComponent(HERBST)}`);
  await openGroup(page, 'next');
  const nt = group(page, 'next').locator('[data-next-time]');
  await expect(nt.locator('ol.pts > li')).toHaveCount(POINTS.length);
  for (const p of POINTS) await expect(nt.locator(`li[data-point="${p.when}"]`)).toContainText(p.text);
  // a new point: its situation is guessed from the words and can be changed
  await nt.getByLabel(T('New point for next time')).fill('Stirnlampe vergessen');
  await expect(nt.locator('form.add select')).toHaveValue('dark');
  await nt.getByRole('button', { name: T('Add') }).click();
  await expect(nt.locator('ol.pts > li')).toHaveCount(POINTS.length + 1);
  await expect.poll(async () => (await table(page, 'debriefs')).find((d) => d.tripId === HERBST).nextTime.map((p) => [p.text, p.when]).at(-1)).toEqual(['Stirnlampe vergessen', 'dark']);
  // tap a point: change its situation
  await nt.getByRole('button', { name: T('Change or delete: {text}', { text: 'Hütte vorher anrufen' }) }).click();
  await nt.locator('form.ed select').selectOption('any');
  await nt.locator('form.ed').getByRole('button', { name: T('Save') }).click();
  await expect(nt.locator('form.ed')).toHaveCount(0);
  await targets(page, info);
  await shot(page, info, 'SN2j-fuer-naechstes-mal');

  // Packen of the next trip (cold, dry, in daylight): only «cold» and «every trip»
  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), NEXT);
  await page.goto('./#/pack');
  const rem = page.locator('[data-reminders]').first();
  await expect(rem).toBeVisible();
  await expect(rem.locator('li')).toHaveCount(2);
  await expect(rem.locator('li[data-reminder="cold"]')).toContainText('Handschuhe zu dünn');
  await expect(rem).toContainText('Hütte vorher anrufen');
  await expect(rem).not.toContainText('Licht vergessen');
  await expect(rem).not.toContainText('Regenjacke dicker');
  await expect(rem).not.toContainText('Stirnlampe vergessen');
  await expect(rem).toContainText(T('from «{trip}»', { trip: DATA.tables.trips.find((x) => x.id === HERBST).title }));
  await noSideways(page);
  await shot(page, info, 'SN2j-erinnerung-packen');
  // the next trip turns into a ride into the dark: «Licht vergessen» and the new point come along
  await page.evaluate((id) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const tx = r.result.transaction('trips', 'readwrite');
      const st = tx.objectStore('trips');
      const q = st.get(id);
      q.onsuccess = () => st.put({ ...q.result, dark: true });
      tx.oncomplete = () => { r.result.close(); ok(); };
    };
  }), NEXT);
  await page.reload();
  await expect(page.locator('[data-reminders]').first().locator('li')).toHaveCount(4);
  await expect(page.locator('[data-reminders]').first().locator('li[data-reminder="dark"]')).toHaveCount(2);
  expect(errors).toEqual([]);
});
