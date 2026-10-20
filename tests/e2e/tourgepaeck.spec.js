// Tour-Seite, Gepäck nachtragen (Noah 20.10.2026 «1a 2b und a möglich 3a und b optional 4a 5a») and the design
// wishes of the same day (key figures large, two columns on a computer, a personal diary, quieter bar) plus
// «1a 2a 3a 4a 5a» (landscape, personal sentence, same route as a chart, gear weight, clothes by weather).
// German UI, phone 390 and desktop 1440, fictional data (sn4plus-fixture.js, the activities of at1-acts.js,
// two more rides of the same route, a made-up weather answer instead of Open-Meteo):
// e) a ride without gear: weather, landscape, sentence, chart; «Gepäck eintragen» makes it a trip with the
//    chosen things, food and a new thing; marks, a note, «Was hat gefehlt?»; the weight; it stays after a reload;
// f) a planned trip's Pack page still opens (clothes by weather is one quiet line there).
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { sn4plusData, P, D0, day } from './sn4plus-fixture.js';
import { at1Acts } from './at1-acts.js';
import { importAndSettle } from './settle.js';
import { encodePolyline } from '../../src/lib/spur/polyline.js';

const SHOTS = '/tmp/claude-0/sn-shots/gepaeck';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const shot = async (page, info, name, fullPage = true) => {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const A = 'test_gp_';
const key = (k) => `#/tour/${encodeURIComponent(k)}`;
const lineOf = (dir, n = 14) => encodePolyline(Array.from({ length: n }, (_, i) => [47.3 + Math.sin(dir) * 0.008 * i, 8.5 + Math.cos(dir) * 0.01 * i]));
const course = () => ({ pts: Array.from({ length: 30 }, (_, i) => [i * 6, 450 + Math.round(Math.sin(i / 4) * 180 + i * 6), 130, null]), breaks: [] });

function data() {
  const d = sn4plusData();
  const acts = at1Acts(day, A);
  acts[0] = { ...acts[0], line: lineOf(0.4), prof: course() };
  // the same route twice before (same name, about the same km)
  acts.push({ ...acts[0], id: `${A}r1`, day: day(-60), movingS: 9600, prof: null }, { ...acts[0], id: `${A}r2`, day: day(-30), movingS: 9300, prof: null });
  d.tables.activities = acts;
  d.tables.items.push({ id: 'FD01', name: 'test_ Müesliriegel', category: 'food', ownership: 'owned', qty: 1, defaultBag: 'top', weightG: 45, domains: ['bikepacking'], sets: [] });
  return d;
}

/** A made-up answer of the weather service: 9 °C at 18:00, rain in one hour. */
function weather(url) {
  const u = new URL(url);
  const date = u.searchParams.get('start_date');
  const hours = Array.from({ length: 24 }, (_, h) => h);
  return {
    daily: { time: [date], temperature_2m_min: [6], temperature_2m_max: [15], precipitation_sum: [1.4], wind_speed_10m_max: [18], wind_gusts_10m_max: [32] },
    hourly: { time: hours.map((h) => `${date}T${String(h).padStart(2, '0')}:00`), temperature_2m: hours.map((h) => 6 + Math.round(Math.sin((h / 24) * Math.PI) * 9)), precipitation: hours.map((h) => (h === 19 ? 0.6 : 0)) },
  };
}

async function start(page, context, info) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/gp-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(data()));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.route(/open-meteo\.com/, (route) => route.fulfill({ json: weather(route.request().url()) }));
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

test('e) a ride without gear: weather, landscape, sentence, chart; «Gepäck eintragen» makes it a trip with marks, notes and food', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./${key(`a:${A}1`)}`);
  await expect(tour(page).locator('h1')).toHaveText(`${A} Abendrunde mit Wattmesser`);
  // Noah «vier Werte hervorheben»: Distanz, Höhenmeter, Fahrzeit, Ø Herzfrequenz, large
  await expect(tour(page).locator('[data-kpi]')).toHaveCount(4);
  await expect(tour(page).locator('[data-kpi="hf"] b')).toContainText('138');
  // 4a: the weather of that day, fetched once and kept
  await expect(tour(page).locator('[data-tour-weather]')).toContainText(T('while riding {t}', { t: '' }).trim());
  await expect(tour(page).locator('[data-tour-weather]')).toContainText(T('{mm} mm rain', { mm: '1.4' }));
  // 1a 2a 3a: the landscape, the sentence of the third time, the chart of the three times
  await expect(tour(page).locator('[data-tour-landscape]')).toBeVisible();
  await expect(tour(page).locator('[data-tour-say]')).toContainText(T('Your {n}th time on this route, {m} min faster than on {day}.', { n: 3, m: '', day: '' }).split(',')[0]);
  await expect(tour(page).locator('[data-route-chart] li')).toHaveCount(3);
  await expect(tour(page).locator('[data-route-chart] [aria-current="page"]')).toHaveCount(1);
  // the zones in one sentence
  await expect(tour(page).locator('[data-zone-sum]')).toBeVisible();
  await expect(tour(page).locator('#th-diary')).toHaveText(T('What stays of this tour'));
  await shot(page, info, 'G1-fahrt-ohne-gepaeck');
  await noSideways(page);

  // 1a 2b: «Gepäck eintragen»
  await tour(page).locator('[data-no-gear]').scrollIntoViewIfNeeded();
  await tour(page).locator('[data-gear-enter]').click();
  const dlg = page.locator('dialog[data-tour-sheet="gear"]');
  await expect(dlg).toBeVisible();
  // 2 «a möglich»: take over from an earlier trip, then take one out
  await dlg.locator('[data-gear-from]').selectOption({ index: 1 });
  await dlg.locator('[data-gear-take]').click();
  await expect(dlg.locator('[role="status"]')).toBeVisible();
  const n0 = Number((await dlg.locator('[data-gear-count]').innerText()).match(/\d+/)[0]);
  expect(n0).toBeGreaterThan(2);
  await dlg.locator('[data-gear-search]').fill('Rain jacket');
  if (await dlg.locator('[data-gear-item="RA01"]').isChecked()) await dlg.locator('[data-gear-item="RA01"]').uncheck();
  else await dlg.locator('[data-gear-item="RA01"]').check();
  await dlg.locator('[data-gear-search]').fill('');
  // 5a: food from the Material, and a new thing right here
  await dlg.locator('[data-gear-item="FD01"]').check();
  await dlg.locator('[data-gear-search]').fill('test_ Gummibärchen');
  await dlg.locator('[data-gear-new] select').selectOption('food');
  await dlg.locator('[data-gear-add]').click();
  await expect(dlg.locator('[role="status"]')).toContainText('test_ Gummibärchen');
  await shot(page, info, 'G2-gepaeck-waehlen', false);
  await dlg.locator('[data-gear-save]').click();

  // the ride is a trip now: its page with the gear
  await expect(page).toHaveURL(/#\/tour\/t%3Atrip-/);
  await expect(tour(page)).toHaveAttribute('data-tour-page', 't');
  const gear = tour(page).locator('[data-tour-gear]');
  await expect(gear).toBeVisible();
  await expect(gear.locator('[data-food] [data-gear-row]')).toHaveCount(2);
  await expect(gear.locator('[data-gear-weight]')).toContainText('890 g');
  // the name, the weather and the rating stayed
  await expect(tour(page).locator('h1')).toHaveText(`${A} Abendrunde mit Wattmesser`);
  await expect(tour(page).locator('[data-tour-weather]')).toContainText(T('{mm} mm rain', { mm: '1.4' }));
  // 3a: marks; 3b optional: a note
  const first = gear.locator('.glist2:not([data-food]) [data-gear-row]').first();
  const id = await first.getAttribute('data-gear-row');
  await first.locator('[data-set-mark="unused"]').click();
  await expect(gear.locator(`[data-gear-row="${id}"]`)).toHaveAttribute('data-mark', 'unused');
  const second = gear.locator('.glist2:not([data-food]) [data-gear-row]').nth(1);
  const id2 = await second.getAttribute('data-gear-row');
  await second.locator('[data-set-mark="broken"]').click();
  await gear.locator(`[data-note-open="${id2}"]`).click();
  await gear.locator(`[data-note-input="${id2}"]`).fill('test_ Reissverschluss klemmt');
  await gear.locator(`[data-note-input="${id2}"]`).press('Enter');
  await expect(gear.locator(`[data-note-text="${id2}"]`)).toHaveText('test_ Reissverschluss klemmt');
  // «Was hat gefehlt?», for the gear and for food apart
  await gear.locator('[data-missing-input="gear"]').fill('test_ Handschuhe');
  await gear.locator('[data-missing-add="gear"]').click();
  await gear.locator('[data-missing-input="food"]').fill('test_ mehr Wasser');
  await gear.locator('[data-missing-add="food"]').click();
  await expect(gear.locator('[data-missing="gear"]')).toContainText('test_ Handschuhe');
  await expect(gear.locator('[data-missing="food"]')).toContainText('test_ mehr Wasser');
  await shot(page, info, 'G3-gepaeck-eingetragen');
  // it stays after a reload; the note is a learning of that thing (shown when packing it next time)
  await page.reload();
  await expect(tour(page).locator(`[data-gear-row="${id}"]`)).toHaveAttribute('data-mark', 'unused');
  await expect(tour(page).locator(`[data-gear-row="${id2}"]`)).toHaveAttribute('data-mark', 'broken');
  await expect(tour(page).locator(`[data-note-text="${id2}"]`)).toHaveText('test_ Reissverschluss klemmt');
  const learned = () => page.evaluate(
    (iid) =>
      new Promise((res) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const q = r.result.transaction('learnings').objectStore('learnings').getAll();
          q.onsuccess = () => res(q.result.filter((l) => (l.itemIds ?? []).includes(iid)).map((l) => l.rule));
        };
      }),
    id2,
  );
  await expect.poll(learned).toContain('test_ Reissverschluss klemmt');
  // the list shows it as a trip of the Packmodus now
  await page.goto('./#/trips/rides');
  await expect(page.locator(`[data-act-row="a:${A}1"]`)).toHaveCount(0);
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('f) a planned trip still packs; a computer shows the tour in two columns', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/pack/${P}next`);
  await expect(page.locator('main h1').first()).toBeVisible();
  await page.goto(`./${key(`t:${P}herbst`)}`);
  await expect(tour(page)).toHaveAttribute('data-tour-page', 't');
  if (info.project.name === 'desktop') {
    const main = await tour(page).locator('.cm').boundingBox();
    const side = await tour(page).locator('.cs').boundingBox();
    expect(side.x).toBeGreaterThan(main.x + main.width - 1);
  }
  await shot(page, info, 'G4-packmodus-tour');
  await noSideways(page);
  expect(errors).toEqual([]);
});
