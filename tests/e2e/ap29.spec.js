// v0.35.0 (AP29, Noah), German UI, phone and desktop:
// - the band's pill "{n} weitere": phone a bottom sheet, desktop a popover; rows with a neutral badge,
//   the current trip highlighted, ••• with "Nicht fahren" / "Ohne Rückblick abschliessen" / "Verwerfen"
//   (one more question) and Undo; a row opens that trip; skipped trips are not listed.
// - "Gespeichert ✓" in the band after a change, gone again after about 2 s.
// - nothing typed is lost: a new trip, a new item and a quick note stay after closing; "Verwerfen" removes.
// - "Neu in den letzten Updates" on #/features and the one-time line on Today.
// Fictional fixture plus test_data_gtp_ trips; nothing leaves the preview server.
// V035_SHOTS=<folder> saves screenshots there.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { WHATS_NEW } from '../../src/lib/whatsnew.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const day = (n) => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zurich' }));
  d.setDate(d.getDate() + n);
  return iso(d);
};
const MARK = { key: 'test_data_gtp_marker', value: 1 };
const entry = (itemId, packed = false, slot = 'seat') => ({ itemId, slot, qty: 1, packed });
const trip = (id, title, startDate, entries, extra = {}) => ({
  id, domain: 'bikepacking', title, days: 1, startDate, bikeId: 'bike-test', bike: 'Test gravel bike',
  setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' }, entries, ready: [], status: 'planned', hours: 3, overnight: 'none',
  createdAt: '2026-10-01T08:00:00.000Z', ...extra,
});
const A = 'test_data_gtp_trip-a';
const B = 'test_data_gtp_trip-b';
const C = 'test_data_gtp_trip-c';
const D = 'test_data_gtp_trip-d';

function fixture(path) {
  const data = structuredClone(base);
  data.tables.trips.push(
    trip(A, 'test_data_gtp_ Jura-Wochenende', day(2), [entry('RA01', true), entry('RA02')]),
    trip(B, 'test_data_gtp_ Herbsttour', day(12), [entry('RA01'), entry('RA02')]),
    trip(C, 'test_data_gtp_ Feierabendrunde', day(-3), [entry('RA01', true)]),
    trip(D, 'test_data_gtp_ Abgesagt', day(5), [entry('RA01')], { skipped: true }),
  );
  data.tables.settings.push(MARK);
  writeFileSync(path, JSON.stringify(data));
}

async function start(page, context, info, current = A) {
  const file = info.outputPath('ap29.json');
  fixture(file);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript((id) => {
    localStorage.setItem('lang', 'de');
    if (!sessionStorage.getItem('gtp.started')) {
      sessionStorage.setItem('gtp.started', '1');
      localStorage.setItem('pack.currentTrip', id);
    }
  }, current);
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect.poll(async () => (await table(page, 'settings')).some((s) => s.key === MARK.key)).toBe(true);
}

const table = (page, name) =>
  page.evaluate((s) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(s).objectStore(s).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
const tripOf = async (page, id) => (await table(page, 'trips')).find((t) => t.id === id);

const sideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
async function fits(page, info) {
  expect(await sideways(page)).toBe(0);
  if (info.project.name !== 'phone') return;
  const size = page.viewportSize();
  await page.setViewportSize({ width: 320, height: size.height });
  await expect.poll(() => sideways(page)).toBe(0);
  await page.setViewportSize(size);
}
const shot = async (page, info, name) => {
  if (!process.env.V035_SHOTS) return;
  mkdirSync(process.env.V035_SHOTS, { recursive: true });
  await page.screenshot({ path: `${process.env.V035_SHOTS}/${name}-${info.project.name}.png` });
};

const band = (page) => page.locator('.trip-band');
const pill = (page) => band(page).locator('.pill');
/** The list: the sheet on a phone, the popover on a computer. */
const list = (page) => page.getByRole('dialog', { name: T('In progress') });
const rowOf = (page, title) => list(page).locator('li').filter({ hasText: title });

test('In Bearbeitung: pill, sheet / popover, rows, ••• with Undo, a row opens the trip', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info);
  await page.goto('./#/pack');
  await expect(band(page).locator('h1')).toContainText('test_data_gtp_ Jura-Wochenende');
  // B (planning) and C (debrief open) are the others; D is skipped and not counted.
  await expect(pill(page)).toHaveText(T('{n} more|progress', { n: 2 }));
  const box = await pill(page).boundingBox();
  expect(box.height).toBeLessThan(40); // small to the eye (the tap area is 44 px through ::after)
  await fits(page, info);
  await shot(page, info, 'band');

  await pill(page).click();
  await expect(list(page)).toBeVisible();
  await expect(list(page).getByRole('heading')).toHaveText(`${T('In progress')} 3`);
  if (info.project.name === 'phone') expect(await list(page).evaluate((d) => d.tagName)).toBe('DIALOG');
  else expect(await list(page).evaluate((d) => d.tagName)).toBe('DIV');
  await expect(list(page).locator('li')).toHaveCount(3);
  await expect(rowOf(page, 'Jura-Wochenende').locator('a')).toHaveAttribute('aria-current', 'true');
  // (the trip's context may add an item on import: the total is the trip's own)
  await expect(rowOf(page, 'Jura-Wochenende')).toContainText(new RegExp(T('Packing {done}/{total}', { done: 1, total: '\\d+' })));
  await expect(rowOf(page, 'Herbsttour')).toContainText(T('Planning'));
  await expect(rowOf(page, 'Feierabendrunde')).toContainText(T('Debrief open'));
  await expect(list(page)).not.toContainText('Abgesagt');
  await shot(page, info, 'sheet');

  // The debrief: only "Finish without debrief" (a past trip is never deleted from here).
  await rowOf(page, 'Feierabendrunde').getByRole('button', { name: T('More for {title}', { title: 'test_data_gtp_ Feierabendrunde' }) }).click();
  await expect(rowOf(page, 'Feierabendrunde').getByRole('menuitem')).toHaveText([T('Finish without debrief')]);
  await rowOf(page, 'Feierabendrunde').getByRole('menuitem').click();
  await expect(list(page).locator('li')).toHaveCount(2);
  await expect.poll(async () => (await tripOf(page, C)).noDebrief).toBe(true);
  await list(page).getByRole('button', { name: T('Undo') }).click();
  await expect(list(page).locator('li')).toHaveCount(3);
  expect((await tripOf(page, C)).noDebrief).toBeFalsy();

  // An upcoming trip: "Nicht fahren" (skipped) and "Verwerfen" (asks once more), each with Undo.
  const more = () => rowOf(page, 'Herbsttour').getByRole('button', { name: T('More for {title}', { title: 'test_data_gtp_ Herbsttour' }) });
  await more().click();
  await expect(rowOf(page, 'Herbsttour').getByRole('menuitem')).toHaveText([T('Not riding|menu'), T('Discard')]);
  await rowOf(page, 'Herbsttour').getByRole('menuitem', { name: T('Not riding|menu') }).click();
  await expect.poll(async () => (await tripOf(page, B)).skipped).toBe(true);
  await expect(list(page).locator('li')).toHaveCount(2);
  await list(page).getByRole('button', { name: T('Undo') }).click();
  await expect(list(page).locator('li')).toHaveCount(3);
  await more().click();
  await rowOf(page, 'Herbsttour').getByRole('menuitem', { name: T('Discard') }).click();
  await expect(rowOf(page, 'Herbsttour')).toContainText(T('Delete the trip "{title}"? A backup file can bring it back.', { title: 'test_data_gtp_ Herbsttour' }));
  expect(await tripOf(page, B)).toBeTruthy(); // nothing gone before the second tap
  await rowOf(page, 'Herbsttour').getByRole('button', { name: T('Keep') }).click();
  expect(await tripOf(page, B)).toBeTruthy();

  // A row opens that trip at its next step (B: Plan, #/pack).
  await rowOf(page, 'Herbsttour').locator('a').click();
  await expect(list(page)).toBeHidden();
  await expect(band(page).locator('h1')).toContainText('test_data_gtp_ Herbsttour');
  expect(await page.evaluate(() => [location.hash, localStorage.getItem('pack.currentTrip')])).toEqual(['#/pack', B]);
  await expect(pill(page)).toHaveText(T('{n} more|progress', { n: 2 }));
  await fits(page, info);
  expect(errors).toEqual([]);
});

test('Gespeichert (saved) after a change on Pack, gone again after about 2 s', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto('./#/pack?day');
  await expect(page.locator('.pd')).toBeVisible();
  const saved = band(page).locator('.saved');
  await expect(saved).toHaveText('');
  await page.locator('.pd .pbag.cur button.it').first().click();
  await expect(saved).toHaveText(T('Saved'));
  await shot(page, info, 'saved');
  await expect.poll(async () => (await tripOf(page, A)).updatedAt).toBeTruthy();
  await expect(saved).toHaveText('', { timeout: 4000 });
});

test('nothing typed is lost: new trip, new item and quick note stay after closing; Verwerfen removes', async ({ page, context }, info) => {
  await start(page, context, info);
  const newTrip = () => page.evaluate(() => { localStorage.setItem('pack.startFrom', 'standard'); location.hash = '#/pack'; window.dispatchEvent(new Event('pg:newtrip')); });
  const dlg = page.getByRole('dialog', { name: T('New trip') });

  // Typed a name, then Escape: the trip is there and Pack opens it.
  await newTrip();
  await dlg.getByRole('textbox', { name: T('Name') }).fill('test_data_gtp_ Kept trip');
  await expect(dlg.getByText(T('Saved'))).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dlg).toBeHidden();
  await expect.poll(async () => (await table(page, 'trips')).filter((t) => t.title === 'test_data_gtp_ Kept trip').length).toBe(1);
  await expect(band(page).locator('h1')).toContainText('test_data_gtp_ Kept trip');

  // Typed, then "Verwerfen": gone again.
  await newTrip();
  await dlg.getByRole('textbox', { name: T('Name') }).fill('test_data_gtp_ Discarded trip');
  await expect(dlg.getByRole('button', { name: T('Discard') })).toBeVisible();
  await dlg.getByRole('button', { name: T('Discard') }).click();
  await expect(dlg).toBeHidden();
  await expect.poll(async () => (await table(page, 'trips')).filter((t) => t.title === 'test_data_gtp_ Discarded trip').length).toBe(0);

  // A new item: typed a name, closed: it is in Gear.
  await page.goto('./#/gear');
  await page.evaluate(() => { localStorage.setItem('gear.add', '1'); window.dispatchEvent(new Event('pg:additem')); });
  const item = page.getByRole('dialog', { name: T('Add item') });
  await item.getByRole('textbox', { name: T('Name') }).fill('test_data_gtp_ Kept item');
  await expect(item.getByText(T('Saved'))).toBeVisible();
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await table(page, 'items')).filter((i) => i.name === 'test_data_gtp_ Kept item').length).toBe(1);

  // A quick note: typed, closed: it is in the Inbox.
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('pg:note', { detail: '' })));
  const note = page.getByRole('dialog', { name: T('Note + photo') });
  await note.getByRole('textbox', { name: T('Note') }).fill('test_data_gtp_ kept note');
  await expect(note.getByRole('button', { name: T('Discard') })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await table(page, 'notes')).filter((n) => n.text === 'test_data_gtp_ kept note').length).toBe(1);
});

test('Neu in den letzten Updates on #/features; Today says it once after an update', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto('./#/features');
  const news = page.locator('section.news');
  // v0.40.0 (Noah 9a): one folded row "New in 0.40 · 0.39 · 0.38  n ›"; open, the points as before.
  const short = (v) => v.replace(/\.0$/, '');
  await expect(news.getByRole('heading', { name: T('New in {versions}', { versions: WHATS_NEW.slice(0, 3).map((e) => short(e.version)).join(' · ') }) })).toBeVisible();
  await expect(news.locator('details.newsfold')).not.toHaveAttribute('open', '');
  await news.locator('details.newsfold > summary').click();
  await expect(news.locator('.vers').first().locator('.ver')).toHaveCount(3);
  await expect(news.locator('.ver').first()).toContainText(T('Version {v}', { v: short(WHATS_NEW[0].version) }));
  // the whole point is the link (no "Try it" on every row)
  await expect(news.locator('.vers').first().locator('a.try').first()).toBeVisible();
  await expect(news.getByRole('link', { name: T('Try it') })).toHaveCount(0);
  await expect(news.locator('details.older')).not.toHaveAttribute('open', '');
  await fits(page, info);
  await shot(page, info, 'whatsnew');
  // The history back to 0.1: "Ältere Updates" holds calm version ranges, each folded again.
  const older = news.locator('details.older');
  await older.locator('> summary').click();
  const ranges = older.locator('details.range');
  await expect(ranges.first()).toBeVisible();
  await expect(ranges.locator('details[open]')).toHaveCount(0);
  const first = ranges.last();
  await expect(first.locator('> summary')).toContainText(T('{from} to {to}|versions', { from: '0.1', to: '0.9' }));
  expect((await first.locator('> summary').boundingBox()).height).toBeGreaterThanOrEqual(44);
  await first.locator('> summary').click();
  await expect(first.locator('.ver[data-version="0.1.0"]')).toBeVisible();
  await expect(first.locator('.ver[data-version="0.1.0"] a')).toHaveCount(0); // no place left to try
  await ranges.first().locator('> summary').click();
  await fits(page, info);
  await shot(page, info, 'whatsnew-older');
  await older.locator('> summary').click();
  // A point goes to the exact place.
  await news.locator('.ver').first().locator('a.try').first().click();
  // v0.36.0: the first point of the newest version (was #/pack in 0.35.0).
  await expect(page).toHaveURL(new RegExp(`${WHATS_NEW[0].points[0].href.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}$`));

  // Today: an update from 0.34 says it once.
  await page.evaluate(() => localStorage.setItem('whatsnew.seen', '0.34.0'));
  // v0.38.0: "Try it" of the newest point is Today itself; open Today afresh from another page.
  await page.goto('./#/features');
  await page.goto('./#/');
  // v0.78.0 (Übergänge 2, Noah Ü9a): after a real update a calm sheet «New in …» with the points,
  // «Show» to the exact place, «Fine, go on» and «All news» (the quiet row stays for a first visit).
  const sheet = page.locator('dialog.news[open]');
  await expect(sheet.getByRole('heading', { name: T('New in {version}', { version: short(WHATS_NEW[0].version) }) })).toBeVisible();
  await expect(sheet.getByRole('button', { name: T('Show') }).first()).toBeVisible();
  await expect(sheet.getByRole('link', { name: T('All news') })).toHaveAttribute('href', '#/features?news');
  await shot(page, info, 'today-hint');
  expect(await page.evaluate(() => localStorage.getItem('whatsnew.seen'))).toBe(WHATS_NEW[0].version);
  await sheet.getByRole('button', { name: T('Fine, go on') }).click();
  await expect(page.locator('dialog.news[open]')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.home')).toBeVisible();
  await expect(page.locator('dialog.news[open]')).toHaveCount(0);
  await expect(page.locator('[data-row=news]')).toHaveCount(0);
});
