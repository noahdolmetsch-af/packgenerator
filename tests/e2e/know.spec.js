// v0.25.1 (Noah 1a, 7.10.2026): Good to know shows only cards with content, the most urgent first,
// each with one button. Fictional fixture plus test_data_gtp_ records; Open-Meteo is mocked.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const tr = (lang) => (en, vars) => {
  const text = (lang === 'de' ? DE[en] : null) ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const addDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

/** The fictional data: three finished trips on the bike, one older than a year, a wish with a price. */
function knowFixture() {
  const data = structuredClone(base);
  const d0 = today();
  const T = data.tables;
  T.bikes[0] = { ...T.bikes[0], type: 'Gravel', km: 2000, parts: [
    { key: 'chain', model: '', history: [{ date: addDays(d0, -30), km: 1900, action: 'service', result: 'done' }] },
    { key: 'padsF', model: '', history: [{ date: addDays(d0, -120), km: 1200, action: 'check', result: 'ok' }] },
  ] };
  const trip = (id, ago, ids, extra = {}) => ({
    id, title: `test_data_gtp_ ${id}`, domain: 'bikepacking', startDate: addDays(d0, -ago), days: 1, bikeId: 'bike-test', bike: 'Test gravel bike',
    setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' }, entries: ids.map((itemId) => ({ itemId, slot: 'seat', qty: 1, packed: true })), ready: [], status: 'done', ...extra,
  });
  T.trips.push(
    trip('Altjahr', 400, ['SL01', 'TO01']),
    trip('Jura', 120, ['TO01', 'TO02', 'TO03', 'RA01']),
    trip('Emmental', 60, ['TO01', 'TO02', 'RA01']),
    trip('Napf', 20, ['TO01', 'LX01']),
  );
  const done = (id, km) => ({ tripId: id, status: 'done', weather: 'planned', amount: 'right', bags: 'fine', note: '', items: {}, missing: [], applied: [], km, kmApplied: 0, doneAt: `${addDays(d0, -1)}T10:00:00.000Z` });
  T.debriefs.push(done('Jura', 80), done('Emmental', 60), done('Napf', 90));
  T.items.push({ id: 'SL90', name: 'test_data_gtp_ Leichter Schlafsack', category: 'sleep', weightG: 450, qty: 1, weightStatus: 'online', defaultBag: 'seat', ownership: 'wishlist', role: null, sets: [], kits: [], domains: ['bikepacking'], priceChf: 200, replaces: 'SL01' });
  T.visits.push({ id: 'test_data_gtp_visit', bikeId: 'bike-test', date: `${d0.slice(0, 4)}-01-15`, shop: 'test_data_gtp_ Werkstatt', totalChf: 85, km: 1500, parts: [] });
  T.notes.push({ id: 'test_data_gtp_note', text: 'test_data_gtp_ Notiz', status: 'open', at: `${d0}T07:00:00.000Z` });
  T.settings.push({ key: 'homePlace', value: { name: 'test_data_gtp_ Heimort, Aargau, Switzerland', lat: 47.392, lon: 8.044 } });
  return data;
}

/** The mocked forecast: 16 days from today; Saturday 18 °C dry, Sunday 12 °C with 7 mm of rain. */
async function mockWeather(context) {
  await context.route(/open-meteo\.com/, (route) => {
    const days = [...Array(16).keys()].map((n) => addDays(today(), n));
    const wd = (d) => new Date(`${d}T00:00:00Z`).getUTCDay();
    const v = (d, sat, sun, other) => (wd(d) === 6 ? sat : wd(d) === 0 ? sun : other);
    return route.fulfill({ json: { daily: {
      time: days,
      temperature_2m_min: days.map((d) => v(d, 8, 6, 7)),
      temperature_2m_max: days.map((d) => v(d, 18, 12, 15)),
      precipitation_sum: days.map((d) => v(d, 0, 7, 0)),
      precipitation_probability_max: days.map((d) => v(d, 10, 90, 10)),
    } } });
  });
}

async function start(page, context, info, lang, data) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await mockWeather(context);
  await context.addInitScript((l) => localStorage.setItem('lang', l), lang);
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  if (!data) return;
  const file = info.outputPath('know-fixture.json');
  writeFileSync(file, JSON.stringify(data));
  const panel = page.locator('details.data');
  await expect(async () => {
    if (!(await panel.evaluate((d) => d.open))) await panel.locator('summary').click();
    expect(await panel.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await panel.getByLabel(tr(lang)('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: tr(lang)('Replace all data') }).press('Enter');
  await expect(panel.getByText(/importiert|Imported/)).toBeVisible();
}

/**
 * Good to know. v0.30.0 (Noah 1a): no longer folded on the phone; there the further card and some
 * tips wait behind "Show {n} more", opened here so every tile can be looked at.
 */
async function know(page, T) {
  const sec = page.locator('main section.know');
  await expect(sec.getByRole('heading', { name: T('Good to know') })).toBeVisible();
  await expect(sec.locator('.cards > *')).not.toHaveCount(0);
  const more = sec.locator('.morebtn');
  if ((await more.count()) && (await more.getAttribute('aria-expanded')) === 'false') await more.click();
  return sec;
}
const tileKeys = (k) => k.locator('[data-card], [data-tip]').evaluateAll((els) => els.map((e) => e.dataset.card ?? `tip:${e.dataset.tip}`));

test('empty cards are hidden; 6 tiles, the rest are tips', async ({ page, context }, info) => {
  const T = tr('de');
  await start(page, context, info, 'de', null);
  // the start-up may still be adding its items (the section can render again): wait for the to-dos
  let k;
  await expect(async () => {
    k = await know(page, T);
    await expect(k.locator('[data-card="todo"]')).toBeVisible({ timeout: 2000 });
  }).toPass();
  const keys = await tileKeys(k);
  // v0.30.0 (Noah 1a): a fresh app: perhaps the backup (once the start-up added items), "Still open"
  // as the one further card, the rest tips; the home place set-up is a tip now
  expect(keys).toHaveLength(6);
  const cards = keys.filter((x) => !x.startsWith('tip:'));
  expect(cards.filter((x) => x !== 'backup')).toEqual(['todo']);
  expect(keys.slice(cards.length).every((x) => x.startsWith('tip:'))).toBe(true);
  for (const gone of ['No learnings yet', 'Nothing to sort', 'No forecast loaded yet', 'Standard guess: 16 km/h', 'No backup yet'])
    await expect(k.getByText(T(gone))).toHaveCount(0);
  // every card has its one button, every tip its one button and "I know it"
  await expect(k.locator('[data-card="todo"] .go')).toHaveCount(1);
  for (const tip of await k.locator('[data-tip]').all()) {
    await expect(tip.locator('.go')).toHaveCount(1);
    await expect(tip.getByRole('button', { name: new RegExp(`^${T('I know it')}`) })).toBeVisible();
  }
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw).toBeLessThanOrEqual(page.viewportSize().width);
});

for (const lang of ['en', 'de']) {
  test(`a due backup leads, at most 3 data cards, the unused list from the overview, ${lang}`, async ({ page, context }, info) => {
    const T = tr(lang);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await start(page, context, info, lang, knowFixture());
    await page.goto('./#/');
    const k = await know(page, T);
    // the backup is due (never saved): v0.30.2 (L5) one line in Also to do with its button, no card here
    await expect(k.locator('[data-card="backup"]')).toHaveCount(0);
    await expect(page.getByRole('region', { name: T('Also to do') }).getByRole('button', { name: T('Download backup') })).toBeVisible();
    // v0.30.0 (Noah 1a): at most 3 important cards, then at most 1 further card, the rest tips:
    // the insights (weight trend, best upgrade, season, long not used) no longer all fill Today
    const keys = await tileKeys(k);
    expect(keys).toHaveLength(6);
    const cards = keys.filter((x) => !x.startsWith('tip:'));
    expect(cards.length).toBeLessThanOrEqual(3);
    expect(keys.length - cards.length).toBeGreaterThanOrEqual(3);
    expect(keys.findIndex((x) => x.startsWith('tip:'))).toBe(cards.length); // the tips come last
    // the important cards come first (the backup and the Inbox are lines in Also to do, v0.30.2)
    expect(cards.filter((x) => ['upgrade', 'trend', 'season', 'unused', 'weekend'].includes(x)).length).toBeLessThanOrEqual(1);
    // the overview lists everything; "Long not used" from there (Noah 3a)
    await k.getByRole('link', { name: new RegExp(T('What the app can do')) }).click();
    await expect(page).toHaveURL(/#\/features$/);
    // Long not used → Look through: Gear shows exactly those items
    // v0.40.0 (Noah 9a): the whole row starts it; it may wait behind "+ n more" or in its folded area.
    const unusedRow = page.locator('[data-feature="unused"]');
    if (!(await unusedRow.isVisible()) && (await page.locator('.morerow').count())) await page.locator('.morerow').click();
    if (!(await unusedRow.isVisible())) await page.locator('details.area').filter({ has: unusedRow }).locator('> summary').click();
    await unusedRow.getByRole('link').click();
    await expect(page).toHaveURL(/#\/gear\?unused=1/);
    await expect(page.getByText(T('Only items on no trip for 12 months'))).toBeVisible();
    // the sleeping bag (last on a trip 400 days ago) is one of them; standard items are not
    const list = page.locator('.list');
    await expect(list.getByText('Sleeping bag', { exact: true })).toBeVisible();
    await expect(list.locator('.count')).toHaveText(/^\s*\d+\s/);
    const n = Number((await list.locator('.count').textContent()).match(/\d+/)[0]);
    await expect(list.getByText('Multi tool', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: T('Show all items') }).first().click();
    // all items again (on the phone the categories fold shut again, so count instead of looking)
    await expect(page.getByText(T('Only items on no trip for 12 months'))).toHaveCount(0);
    await expect(list.locator('.count')).not.toHaveText(new RegExp(`^\\s*${n}\\s`));
    await expect(page).not.toHaveURL(/unused=1/);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(sw).toBeLessThanOrEqual(page.viewportSize().width);
    expect(errors).toEqual([]);
  });
}
