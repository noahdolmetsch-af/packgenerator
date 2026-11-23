// «Frag die App» answers «Nächte draussen» and «letzter Werkstattbesuch» (S6 Schritt 2); both are answers, so neither is kept
// in the list of open questions. Fictional data only.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import { openHome, homeFixture, tr, trip, day } from './home0460-fixture.js';

const T = tr('de');
const SHOTS = process.env.SHOTS_DIR ?? null;
// two nights outdoors on a trip of three days, one more on a bivouac trip; a visit for two bikes
function seeded() {
  const data = homeFixture();
  data.tables.trips.push(trip('Alpen', day(-30), { days: 3, overnight: 'outdoor', status: 'done' }), trip('Biwak', day(-20), { days: 2, overnight: 'outdoor', status: 'done' }));
  data.tables.visits = [
    { id: 'test_data_gtp_v1', bikeId: 'bike-test', date: day(-12), shop: 'test_data_gtp_ Werkstatt Nord', totalChf: 140, parts: [{ part: 'chain', action: 'replace' }, { part: 'brake', action: 'service' }] },
    { id: 'test_data_gtp_v2', bikeId: 'test_data_gtp_spark', date: day(-70), shop: 'test_data_gtp_ Velo Sued', totalChf: 60, parts: [{ part: 'tyres', action: 'replace' }] },
  ];
  return data;
}
const tap = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());

async function ask(page, info, text) {
  await page.getByLabel(T('Your question')).fill(text);
  await tap(page.getByRole('button', { name: T('Ask'), exact: true }), info);
}

test('The app answers nights outdoors and the last workshop visit and keeps neither as open', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: seeded(), hour: 9 });
  await page.goto('./#/assistent');

  await ask(page, info, 'Wann war ich zuletzt in der Werkstatt?');
  const card = page.locator('[data-aa]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Letzter Werkstattbesuch: 27.9.2026 (vor 12 Tagen)');
  await expect(card).toContainText('Werkstatt Nord');
  await expect(card).toContainText('140 CHF');
  await expect(card).toContainText('Spark');
  const w = info.project.name === 'phone' ? '390' : '1440';
  if (SHOTS) (mkdirSync(SHOTS, { recursive: true }), await card.screenshot({ path: `${SHOTS}/S6-werkstatt-${w}.png` }));

  await ask(page, info, 'Wie viele Nächte habe ich dieses Jahr draussen geschlafen?');
  await expect(card).toContainText('dieses Jahr: 3 Nächte draussen auf 2 Touren');
  if (SHOTS) await card.screenshot({ path: `${SHOTS}/S6-naechte-${w}.png` });

  // answers are not open questions
  await expect(page.locator('[data-as="open"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
