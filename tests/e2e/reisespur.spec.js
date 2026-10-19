// Paket S «Reise-Spur» (Noah 19.10.2026 «1a und b möglich 2a 3a 4a 5a»):
// - Unterwegs: the card «Reise-Spur» with «Hier bin ich» (the place now, a sentence) and «Aufzeichnen»
//   (first the battery hint, then the dark big view; «Stopp» keeps it);
// - #/spur/<trip>: the zoomable map (drag, zoom buttons), a dot opens its place, the days with the gap
//   of a recording and «aus Strava gefüllt», rename and delete a place (Undo);
// - the link for the family: made, opened on a fresh page without the app's data (no photo in it),
//   deleted (the reader then sees «gelöscht»); the travel book downloads as PDF.
// Fictional data only (test_data_gtp_), a made-up line, the clock on Friday 9 October 2026 09:00, every
// outside address blocked; the share server is answered by the test. Test names stay ASCII (their
// output folder holds the imported file).
import { test, expect } from '@playwright/test';
import { openHome, homeFixture, tr, trip, day } from './home0460-fixture.js';
import { encodePolyline } from '../../src/lib/spur/polyline.js';

const T = tr('de');
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const NAPF = 'test_data_gtp_Napf';
const RUNDE = 'test_data_gtp_TEST-Runde';
const LINE = Array.from({ length: 40 }, (_, i) => [47.0 + Math.sin(i / 5) * 0.01, 7.9 + i * 0.004]);

function data() {
  const d = homeFixture();
  const at = (h, m = 0) => `${day(-3)}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+02:00`;
  const start = Date.parse(at(9));
  d.tables.activities = [{ id: '9001', day: day(-3), time: '09:00', start: new Date(start).toISOString(), name: 'test_data_gtp_ Napfrunde', type: 'GravelRide', kind: 'bike', km: 62, movingS: 3 * 3600, elapsedS: 4 * 3600, line: encodePolyline(LINE) }];
  d.tables.tracks = [
    { id: 'test_data_gtp_place1', kind: 'place', tripId: NAPF, day: day(-3), at: new Date(Date.parse(at(11))).toISOString(), lat: LINE[20][0], lon: LINE[20][1], text: 'test_data_gtp_ Zmittag am Brunnen', photo: null },
    { id: 'test_data_gtp_rec1', kind: 'rec', tripId: NAPF, day: day(-3), startAt: start + 600_000, endAt: start + 600_000 + 1500_000, pts: [[47.0, 7.9, 0], [47.001, 7.904, 30], [47.002, 7.908, 60], [47.004, 7.92, 1200], [47.005, 7.924, 1230]], km: 2, open: false },
  ];
  return d;
}

async function open(page, context, info) {
  await context.addInitScript((id) => localStorage.setItem('pack.currentTrip', id), RUNDE);
  await openHome(page, context, info, { data: data() });
  // the share server (api/spur.js) answered by the test: it keeps the sealed envelope only
  const kept = new Map();
  await context.route(/packgen-three\.vercel\.app\/api\/spur/, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (req.method() === 'GET') {
      const rec = kept.get(url.searchParams.get('id'));
      return route.fulfill(rec ? { json: { ok: true, e: rec.e, at: rec.at } } : { status: 404, json: { ok: false, code: 'not_found' } });
    }
    const body = req.postDataJSON();
    if (url.searchParams.get('step') === 'put') {
      const id = body.id ?? 'test_data_gtp_link0001'.padEnd(22, 'x').slice(0, 22);
      kept.set(id, { e: body.e, at: '2026-10-09T07:00:00.000Z' });
      return route.fulfill({ json: { ok: true, id, del: body.del ?? 'd'.repeat(32), at: '2026-10-09T07:00:00.000Z' } });
    }
    kept.delete(body.id);
    return route.fulfill({ json: { ok: true } });
  });
  return kept;
}

test('On the way: I am here saves the place now; Record asks first, then records big and dark', async ({ page, context }, info) => {
  await open(page, context, info);
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 47.01, longitude: 7.95, accuracy: 8 });
  await page.goto('./#/ride');
  const card = page.locator('section.spurc');
  await expect(card.getByRole('heading', { name: T('Travel track') })).toBeVisible();
  await tap(card.getByRole('button', { name: T('I am here') }), info);
  const sheet = page.getByRole('dialog', { name: T('I am here') });
  await expect(sheet.getByText(T('Found, ± {n} m.', { n: 8 }))).toBeVisible();
  await sheet.getByLabel(T('A sentence to it (optional)')).fill('test_data_gtp_ Aussicht');
  await tap(sheet.getByRole('button', { name: T('Save place') }), info);
  await expect(sheet.getByText(T('Place saved. It is on the tour map.'))).toBeVisible();
  await expect(card.getByText(T('{n} place today', { n: 1 }))).toBeVisible();

  await tap(card.getByRole('button', { name: T('Record|spur') }), info);
  const ask = page.getByRole('dialog', { name: T('Record the route') });
  await expect(ask.getByText(/Akku/)).toBeVisible();
  await tap(ask.getByRole('button', { name: T('Start recording') }), info);
  const view = page.locator('dialog.recview');
  await expect(view.getByRole('heading', { name: T('Recording') })).toBeVisible();
  await expect(view.getByText(/GPS ± 8 m|0 km/).first()).toBeVisible();
  await tap(view.getByRole('button', { name: T('Stop') }), info);
  // one point only (the clock stands still): nothing is kept, the view closes
  await expect(view).toBeHidden();
  await expect(card.getByRole('button', { name: T('Record|spur') })).toBeVisible();
});

test('Tour map: the line, a dot opens its place; the days show the gap filled from Strava; rename and delete a place', async ({ page, context }, info) => {
  await open(page, context, info);
  await page.goto(`./#/spur/${NAPF}`);
  await expect(page.getByRole('heading', { level: 1, name: 'test_data_gtp_ Napf' })).toBeVisible();
  const map = page.getByRole('application');
  await expect(map).toBeVisible();
  await expect(map.locator('path.line')).toHaveCount(1); // the Strava line wins over the recording
  await tap(map.getByRole('button', { name: T('Zoom in') }), info);
  await tap(map.getByRole('button', { name: T('Whole tour') }), info);
  await tap(map.getByRole('button', { name: new RegExp('Zmittag am Brunnen') }), info);
  await expect(page.getByRole('region', { name: T('Chosen on the map') }).getByText('test_data_gtp_ Zmittag am Brunnen')).toBeVisible();
  const days = page.locator('ol.daylist');
  await expect(days.getByText(new RegExp(T('filled from Strava')))).toBeVisible();
  await expect(days.getByText(/62 km/)).toBeVisible();
  await expect(days.getByText(new RegExp(T('the Strava line counts')))).toBeVisible();
  await tap(days.getByRole('button', { name: T('Change text') }), info);
  const rn = page.getByRole('dialog');
  await rn.getByRole('textbox').fill('test_data_gtp_ Brunnen im Dorf');
  await rn.getByRole('textbox').press('Enter');
  await expect(days.getByText('test_data_gtp_ Brunnen im Dorf')).toBeVisible();
  await tap(days.getByRole('button', { name: T('Delete place') }), info);
  await tap(page.getByRole('dialog').getByRole('button', { name: T('Delete') }), info);
  await expect(days.getByText('test_data_gtp_ Brunnen im Dorf')).toHaveCount(0);
});

test('Link for the family: made, read on a fresh page without the app data, deleted; travel book as PDF', async ({ page, context }, info) => {
  const kept = await open(page, context, info);
  await page.goto(`./#/spur/${NAPF}`);
  const share = page.locator('section', { has: page.getByRole('heading', { name: T('Link for your family') }) });
  await expect(share.getByText(T('Photos never go in: they stay on this device.'))).toBeVisible();
  await tap(share.getByRole('button', { name: T('Make a link') }), info);
  const input = share.getByLabel(T('The link'));
  await expect(input).toHaveValue(/#\/spur-link\/[A-Za-z0-9_-]{22}\/[A-Za-z0-9_-]{43}$/);
  const url = await input.inputValue();
  const [rec] = [...kept.values()];
  expect(rec.e).not.toMatch(/Napf|Brunnen/); // sealed: the server sees no name

  const reader = await context.newPage();
  await reader.goto(url);
  await expect(reader.getByRole('heading', { level: 1, name: 'test_data_gtp_ Napf' })).toBeVisible();
  await expect(reader.getByText('test_data_gtp_ Zmittag am Brunnen')).toBeVisible();
  await expect(reader.getByRole('application')).toBeVisible();

  const [dl] = await Promise.all([page.waitForEvent('download'), tap(page.getByRole('button', { name: T('Travel book as PDF') }), info)]);
  expect(dl.suggestedFilename()).toMatch(/\.pdf$/);

  await tap(share.getByRole('button', { name: T('Delete link') }), info);
  await tap(page.getByRole('dialog').getByRole('button', { name: T('Delete link') }), info);
  await expect(share.getByRole('button', { name: T('Make a link') })).toBeVisible();
  await reader.reload();
  await expect(reader.getByText(T('This link was deleted or has expired.'))).toBeVisible();
});

test('The look back of a trip leads to its travel track', async ({ page, context }, info) => {
  await open(page, context, info);
  await page.goto(`./#/debrief/${NAPF}`);
  await tap(page.getByRole('link', { name: new RegExp(T('Travel track')) }), info);
  await expect(page).toHaveURL(new RegExp(`#/spur/${NAPF}$`));
});
