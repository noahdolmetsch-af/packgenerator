// v0.29.0 (Noah 1a–10a, 8.10.2026): the four trip tabs in one design: Plan, Pack, On the way, Debrief
// (Planen, Packen, Unterwegs, Rückblick). One dark band with the tabs on every step; Pack is a normal
// page where a full bag jumps to the next one; quick notes on the way go straight into the debrief;
// the debrief is one page (0 exceptions = 1 tap); weather changes show their reason and an Undo per row.
// Fictional fixture plus test_data_gtp_ items; nothing outside the preview server.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const tr = (lang) => (en, vars) => {
  const text = (lang === 'de' ? DE[en] : null) ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const day = (n = 0) => new Date(Date.now() + n * 864e5).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });

function fixture(path) {
  const data = structuredClone(base);
  // Leg warmers for "below 15 °C": a weather change brings them (and says why).
  data.tables.items.push({ id: 'GTP90', name: 'test_data_gtp_ Beinlinge', category: 'other', weightG: 120, qty: 1, weightStatus: 'measured', carry: 'luggage', defaultBag: 'seat', ownership: 'owned', role: null, coldBelow: 15, sets: [], kits: [], domains: ['bikepacking'] });
  writeFileSync(path, JSON.stringify(data));
}

async function start(page, context, info, lang) {
  const file = info.outputPath('tabs-fixture.json');
  fixture(file);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript((l) => localStorage.setItem('lang', l), lang);
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel(tr(lang)('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: tr(lang)('Replace all data') }).press('Enter');
  await expect(data.getByText(/importiert|Imported/)).toBeVisible();
}

/** New → Plan a trip → Standard set → Create; returns the stored trip. */
async function newTrip(page, T, title, { days = 1, date = day(0), weather = null } = {}) {
  await page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }).click();
  await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }).click();
  const dlg = page.getByRole('dialog', { name: T('New trip') });
  await dlg.getByLabel(T('Name')).fill(title);
  await dlg.getByLabel(T('Start date')).fill(date);
  if (days > 1) await dlg.getByLabel(T('Days')).fill(String(days));
  if (weather) {
    const b = dlg.getByRole('button', { name: new RegExp(`^${esc(T(weather))} `) });
    if ((await b.getAttribute('aria-pressed')) !== 'true') await b.click();
  }
  await dlg.getByRole('button', { name: T('Create trip') }).click();
  await expect(dlg).toBeHidden();
  await expect(page).toHaveURL(/#\/pack/);
  await expect.poll(async () => (await stored(page, title))?.id ?? null).not.toBe(null);
  return stored(page, title);
}

/** A stored record straight from IndexedDB (trips by title, else the whole table). */
const table = (page, name) =>
  page.evaluate((n) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(n).objectStore(n).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
const stored = async (page, title) => (await table(page, 'trips')).find((x) => x.title === title) ?? null;

const steps = (page, T) => page.getByRole('navigation', { name: T('Steps of this trip') });
const tab = (page, T, key) => steps(page, T).getByRole('link', { name: new RegExp(`^${esc(T(key))}`) });
const go = (page) => page.locator('.trip-band .go');
const noSideScroll = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

for (const lang of ['de', 'en']) {
  test(`one name per step: the same four tabs on Plan, Pack, On the way, Debrief and on Today, ${lang}`, async ({ page, context }, info) => {
    const T = tr(lang);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await start(page, context, info, lang);
    const title = `test_data_gtp_ Tabs ${lang}`;
    const trip = await newTrip(page, T, title, { date: day(1) }); // tomorrow: Today leads with "Pack"
    const NAMES = ['Plan|stage', 'Pack|stage', 'On the way', 'Debrief'];
    if (lang === 'de') expect(NAMES.map((k) => T(k))).toEqual(['Planen', 'Packen', 'Unterwegs', 'Rückblick']);
    // The old addresses stay: #/pack, #/pack?day, #/ride, #/debrief/<id>.
    const pages = [['#/pack', 0], ['#/pack?day', 1], ['#/ride', 2], [`#/debrief/${trip.id}`, 3]];
    for (const [hash, n] of pages) {
      await page.goto(`./${hash}`);
      await expect(page.locator('.trip-band h1'), hash).toHaveText(title);
      const links = steps(page, T).getByRole('link');
      await expect(links, hash).toHaveCount(4);
      for (let i = 0; i < 4; i++) await expect(links.nth(i), hash).toContainText(T(NAMES[i]));
      await expect(steps(page, T).locator('a[aria-current="page"]'), hash).toContainText(T(NAMES[n]));
      // exactly one orange button on the page
      await expect(page.locator('main .btn.hi').filter({ visible: true }), hash).toHaveCount(1);
      await noSideScroll(page);
    }
    // A tab is a link to its address.
    await page.goto('./#/pack');
    await tab(page, T, 'On the way').click();
    await expect(page).toHaveURL(/#\/ride$/);
    await tab(page, T, 'Pack|stage').click();
    await expect(page).toHaveURL(/#\/pack\?day$/);
    // The old full-screen address #/pack/day still opens Pack.
    await page.goto('./#/pack/day');
    await expect(steps(page, T).locator('a[aria-current="page"]')).toContainText(T('Pack|stage'));
    // Today's button for this trip (it starts tomorrow) says "Pack", like the tab, and opens the same address.
    await page.goto('./#/');
    const band = page.getByRole('region', { name: title });
    await expect(band.getByRole('link', { name: T('Pack|stage'), exact: true })).toHaveAttribute('href', '#/pack?day');
    expect(errors).toEqual([]);
  });
}

test('Pack: a full bag jumps to the next one by itself', async ({ page, context }, info) => {
  const T = tr('de');
  await start(page, context, info, 'de');
  const title = 'test_data_gtp_ Weiter';
  await newTrip(page, T, title, { days: 2, date: day(1) });
  await go(page).click();
  await expect(page).toHaveURL(/#\/pack\?day/);
  const cur = page.locator('.pd .pbag.cur');
  const first = await cur.locator('.bagh b').textContent();
  const n = await cur.locator('ul.items button').count();
  for (let i = 0; i < n; i++) {
    // wait for each tick before the next tap
    await cur.locator('ul.items button[aria-pressed="false"]').first().click();
    if (i < n - 1) await expect(cur.locator('ul.items button[aria-pressed="true"]')).toHaveCount(i + 1);
    // v0.30.1 (B4): the next open row is now on the same spot; a tap there within 400 ms is a double tap
    if (i < n - 1) await page.waitForTimeout(450);
  }
  // "{bag} is packed. Next: {next}" and the next bag opens without a tap.
  await expect(page.getByRole('status').filter({ hasText: T('{bag} is packed. Next: {next}', { bag: first, next: '' }).trim() })).toBeVisible();
  await expect(cur.locator('.bagh b')).not.toHaveText(first);
  const next = await cur.locator('.bagh b').textContent();
  await expect(page.getByRole('status').filter({ hasText: T('{bag} is packed. Next: {next}', { bag: first, next }) })).toBeVisible();
  // The full bag is closed with a ✓ and its count.
  const done = page.locator('.pd .pbag.done').filter({ hasText: first });
  await expect(done).toContainText(`${n}/${n}`);
  await expect(done.locator('.bagh')).toHaveAttribute('aria-expanded', 'false');
  // The current bag's rows are a thumb high.
  expect((await cur.locator('ul.items button').first().boundingBox()).height).toBeGreaterThanOrEqual(44);
  await noSideScroll(page);
});

test('Pack: "Whole bag packed" in one tap, and Undo takes it back', async ({ page, context }, info) => {
  const T = tr('de');
  await start(page, context, info, 'de');
  const title = 'test_data_gtp_ Ganz';
  await newTrip(page, T, title, { days: 2, date: day(1) });
  await tab(page, T, 'Pack|stage').click();
  const cur = page.locator('.pd .pbag.cur');
  const first = await cur.locator('.bagh b').textContent();
  const n = await cur.locator('ul.items button').count();
  expect(n).toBeGreaterThan(1);
  await cur.getByRole('button', { name: T('Whole bag packed') }).click();
  await expect(cur.locator('.bagh b')).not.toHaveText(first);
  await expect.poll(async () => (await stored(page, title)).entries.filter((e) => e.packed).length).toBe(n);
  await expect(page.getByRole('img', { name: T('{n} of {total} items packed', { n, total: (await stored(page, title)).entries.length }) }).filter({ visible: true }).first()).toBeVisible();
  // Undo (in the bag's card) unpacks the whole bag again.
  await cur.getByRole('button', { name: T('Undo'), exact: true }).click();
  await expect.poll(async () => (await stored(page, title)).entries.filter((e) => e.packed).length).toBe(0);
  await expect(page.locator('.pd .pbag.done')).toHaveCount(0);
});

for (const lang of ['de', 'en']) {
  test(`quick notes on the way go straight into the debrief and stay in the Inbox, ${lang}`, async ({ page, context }, info) => {
    const T = tr(lang);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await start(page, context, info, lang);
    const title = `test_data_gtp_ Notiz ${lang}`;
    const trip = await newTrip(page, T, title);
    await page.goto('./#/ride');
    const box = page.getByRole('region', { name: T('Note for the debrief') });
    // "Not needed" → which item → one tap.
    await box.getByRole('button', { name: T('Not needed'), exact: true }).click();
    await box.getByRole('group', { name: T('What did you not need?') }).getByRole('button', { name: 'Multi tool', exact: true }).click();
    await expect(box.getByRole('status')).toContainText(T('Saved: {text}. It is in the debrief and in the Inbox.', { text: T('{name} not needed', { name: 'Multi tool' }) }));
    // "Broken" → which item.
    await box.getByRole('button', { name: T('Broken'), exact: true }).click();
    await box.getByRole('group', { name: T('What broke?') }).getByRole('button', { name: 'Spare tube', exact: true }).click();
    // "Was missing" → a name.
    await box.getByRole('button', { name: T('Was missing'), exact: true }).click();
    await box.getByLabel(T('What was missing')).fill('test_data_gtp_ Sitzcreme');
    await box.getByRole('button', { name: T('Save note') }).click();
    await expect(box.getByRole('status')).toContainText('test_data_gtp_ Sitzcreme');
    await noSideScroll(page);
    // Stored at once: the notes (Inbox) and the debrief draft.
    const notes = (await table(page, 'notes')).filter((x) => x.tripId === trip.id);
    expect(notes.map((x) => x.debrief?.kind).sort()).toEqual(['broken', 'missing', 'unused']);
    const draft = (await table(page, 'debriefs')).find((d) => d.tripId === trip.id);
    expect(draft.items).toEqual({ TO01: 'unused', TO02: 'broken' });
    expect(draft.missing).toEqual([expect.objectContaining({ name: 'test_data_gtp_ Sitzcreme' })]);
    await page.goto('./#/inbox');
    await expect(page.getByText(T('{name} not needed', { name: 'Multi tool' }))).toBeVisible();
    // The debrief starts with them as the exceptions, each "from your note on the way".
    await page.goto('./#/ride');
    await go(page).click();
    await expect(page).toHaveURL(new RegExp(`#/debrief/${trip.id}`));
    const diff = page.getByRole('region', { name: T('What was different?') });
    await expect(diff.getByRole('button', { name: T('{name}: {state}. Tap to change.', { name: 'Multi tool', state: T('Not used') }) })).toBeVisible();
    await expect(diff.getByRole('button', { name: T('{name}: {state}. Tap to change.', { name: 'Spare tube', state: T('Broken') }) })).toBeVisible();
    await expect(diff.locator('li').filter({ hasText: 'test_data_gtp_ Sitzcreme' })).toContainText(T('Was missing'));
    await expect(diff.locator('li').filter({ hasText: 'Multi tool' })).toContainText(T('from your note on the way, {time}', { time: '' }).replace(/[,\s]+$/, ''));
    // One tap changes an exception: not used → broken.
    await diff.getByRole('button', { name: T('{name}: {state}. Tap to change.', { name: 'Multi tool', state: T('Not used') }) }).click();
    await expect(diff.getByRole('button', { name: T('{name}: {state}. Tap to change.', { name: 'Multi tool', state: T('Broken') }) })).toBeVisible();
    await go(page).click();
    await expect(page.getByRole('heading', { name: T('Saved'), exact: true })).toBeVisible();
    const saved = (await table(page, 'debriefs')).find((d) => d.tripId === trip.id);
    expect(saved).toMatchObject({ status: 'done', items: { TO01: 'broken', TO02: 'broken' } });
    expect(saved.missing.map((m) => m.name)).toEqual(['test_data_gtp_ Sitzcreme']);
    // The notes stay in the Inbox.
    expect((await table(page, 'notes')).filter((x) => x.tripId === trip.id)).toHaveLength(3);
    expect(errors).toEqual([]);
  });
}

test('the debrief is one page: nothing different = one tap', async ({ page, context }, info) => {
  const T = tr('de');
  await start(page, context, info, 'de');
  const title = 'test_data_gtp_ Rueckblick';
  const trip = await newTrip(page, T, title, { date: day(-2) });
  await page.goto(`./#/debrief/${trip.id}`);
  await expect(page.getByRole('heading', { name: T('What was different?') })).toBeVisible();
  // Filled in: weather as planned, amount right, bags fine; every item counts as used.
  await expect(page.locator('.qa select')).toHaveCount(3);
  await expect(page.locator('.qa select').nth(0)).toHaveValue('planned');
  await expect(page.locator('.qa select').nth(1)).toHaveValue('right');
  await expect(page.locator('.qa select').nth(2)).toHaveValue('fine');
  await expect(page.locator('details.items-fold summary')).toContainText(T('{n} items used', { n: trip.entries.length }));
  await noSideScroll(page);
  let clicks = 0;
  await go(page).click();
  clicks++;
  await expect(page.getByRole('heading', { name: T('Saved'), exact: true })).toBeVisible();
  expect(clicks).toBe(1);
  const d = (await table(page, 'debriefs')).find((x) => x.tripId === trip.id);
  expect(d).toMatchObject({ status: 'done', weather: 'planned', amount: 'right', bags: 'fine', items: {}, missing: [] });
  // The tab now says "saved".
  await expect(tab(page, T, 'Debrief')).toContainText(T('saved'));
  await expect(go(page)).toHaveText(T('Done'));
});

test('weather: applied by itself, each changed row says why and has its own Undo, plus one for the whole change', async ({ page, context }, info) => {
  const T = tr('de');
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info, 'de');
  const title = 'test_data_gtp_ Wetter';
  const before = await newTrip(page, T, title, { weather: 'Warm' });
  expect(before.entries.map((e) => e.itemId)).not.toContain('GTP90');
  const card = page.getByRole('region', { name: T('Fitted to the weather') });

  /** Weather → a preset in the trip conditions (the "Weather" field of the conditions card). */
  const weather = async (preset) => {
    await page.locator('.cond').getByRole('button', { name: new RegExp(T('Weather')) }).click();
    const sheet = page.getByRole('dialog', { name: T('Edit trip conditions') });
    const wx = sheet.locator('details.wxbox');
    if (!(await wx.evaluate((d) => d.open))) await wx.locator('summary').click();
    await sheet.getByRole('group', { name: T('Weather presets') }).getByRole('button', { name: new RegExp(`^${esc(T(preset))}`) }).click();
    await sheet.getByRole('button', { name: T('Done') }).click();
    await expect(sheet).toBeHidden();
  };
  await weather('Chilly');
  // Applied without a question: the leg warmers are on the list, with the reason in their row.
  await expect.poll(async () => (await stored(page, title)).entries.map((e) => e.itemId)).toContain('GTP90');
  const row = card.locator('li').filter({ hasText: 'test_data_gtp_ Beinlinge' });
  await expect(row).toContainText(T('Below {n} °C', { n: 15 }));
  await expect(card.getByRole('status')).toContainText('test_data_gtp_ Beinlinge');
  await noSideScroll(page);
  // Undo in the row takes out only that one item; the weather stays.
  await row.getByRole('button', { name: T('Undo for {name}', { name: 'test_data_gtp_ Beinlinge' }) }).click();
  await expect.poll(async () => (await stored(page, title)).entries.map((e) => e.itemId)).not.toContain('GTP90');
  expect((await stored(page, title)).wx).toMatchObject({ min: 6, max: 12 });

  // Colder again, and "Undo the whole change" puts the trip back as it was (list and weather).
  await weather('Cold');
  await expect.poll(async () => (await stored(page, title)).entries.map((e) => e.itemId)).toContain('GTP90');
  await card.getByRole('button', { name: T('Undo the whole change') }).click();
  await expect.poll(async () => (await stored(page, title)).entries.map((e) => e.itemId)).not.toContain('GTP90');
  expect((await stored(page, title)).wx).toMatchObject({ min: 6, max: 12 });
  expect(errors).toEqual([]);
});
