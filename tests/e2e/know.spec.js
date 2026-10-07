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

/** Good to know, opened on the phone (folded there). */
async function know(page, T) {
  const fold = page.locator('main details.know');
  if (await fold.count()) {
    await expect(async () => {
      if (!(await fold.evaluate((d) => d.open))) await fold.locator('summary').click();
      expect(await fold.evaluate((d) => d.open)).toBe(true);
    }).toPass();
    return fold;
  }
  const sec = page.locator('main section.know');
  await expect(sec.getByRole('heading', { name: T('Good to know') })).toBeVisible();
  return sec;
}

test('empty cards are hidden; the home place card is the way to set it up', async ({ page, context }, info) => {
  const T = tr('de');
  await start(page, context, info, 'de', null);
  // the start-up may still be adding its items (the section can render again): wait for the
  // set-up card and the to-dos, opening the fold again if needed
  let k;
  await expect(async () => {
    k = await know(page, T);
    await expect(k.locator('[data-card="home"]')).toBeVisible({ timeout: 2000 });
    await expect(k.locator('[data-card="todo"]')).toBeVisible({ timeout: 2000 });
  }).toPass();
  const keys = await k.locator('[data-card]').evaluateAll((els) => els.map((e) => e.dataset.card));
  // a fresh app (the start-up adds a few layer items, so a backup is already due): nothing else
  expect(keys).toEqual(expect.arrayContaining(['todo', 'home']));
  expect(keys.filter((x) => !['backup', 'todo', 'home'].includes(x))).toEqual([]);
  for (const gone of ['No learnings yet', 'Nothing to sort', 'No forecast loaded yet', 'Standard guess: 16 km/h', 'No backup yet'])
    await expect(k.getByText(T(gone))).toHaveCount(0);
  // every card has its one button
  await expect(k.locator('[data-card="todo"] .go')).toHaveCount(1);
  await expect(k.locator('[data-card="home"]').getByRole('textbox', { name: T('Your home place') })).toBeVisible();
  if (info.project.name === 'phone') await expect(page.locator('main details.know summary .fsum')).toContainText(tn2(T, keys.length));
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw).toBeLessThanOrEqual(page.viewportSize().width);
});
const tn2 = (T, n) => T(n === 1 ? '{n} hint' : '{n} hints', { n });

for (const lang of ['en', 'de']) {
  test(`a due backup leads, weekend weather from the home place, the unused list in Gear, ${lang}`, async ({ page, context }, info) => {
    const T = tr(lang);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await start(page, context, info, lang, knowFixture());
    await page.goto('./#/');
    const k = await know(page, T);
    // the backup is due (never saved): Your data comes first, with its one button
    await expect(k.locator('[data-card]').first()).toHaveAttribute('data-card', 'backup');
    await expect(k.locator('[data-card="backup"]').getByRole('button', { name: T('Download backup') })).toBeVisible();
    // weekend weather at the home place (mocked): Saturday 18 °C dry, Sunday 12 °C rain
    const wk = k.locator('[data-card="weekend"]');
    await expect(wk).toContainText('test_data_gtp_ Heimort');
    if (new Date(`${today()}T00:00:00Z`).getUTCDay() !== 0) await expect(wk.locator('b')).toContainText(`18 °C ${T('dry')}`);
    await expect(wk.locator('b')).toContainText(`12 °C ${T('rain')}`);
    await expect(wk.getByRole('button', { name: T('Plan a trip') })).toBeVisible();
    // the insight cards with their numbers
    await expect(k.locator('[data-card="upgrade"]')).toContainText(T('{name}: {g} g lighter for CHF {chf} ({x} g per 100 CHF)', { name: 'test_data_gtp_ Leichter Schlafsack', g: '200', chf: '200', x: '100' }));
    await expect(k.locator('[data-card="trend"] svg path')).toHaveCount(1);
    await expect(k.locator('[data-card="season"]')).toContainText(/Test gravel bike [\d’',.]+ km/);
    await expect(k.locator('[data-card="wear"]')).toContainText('Test gravel bike');
    // most urgent first: priorities never go up again down the list
    const keys = await k.locator('[data-card]').evaluateAll((els) => els.map((e) => e.dataset.card));
    expect(keys).toEqual(expect.arrayContaining(['backup', 'wear', 'inbox', 'weekend', 'season', 'trend', 'upgrade', 'unused']));
    expect(keys.indexOf('inbox')).toBeLessThan(keys.indexOf('season'));
    // Long not used → Look through: Gear shows exactly those items
    const un = k.locator('[data-card="unused"]');
    // the sleeping bag (last on a trip 400 days ago) is one of them; standard items are not
    await expect(un.locator('b')).toContainText(/^\d+ /);
    const n = Number((await un.locator('b').textContent()).match(/^\d+/)[0]);
    await expect(un).toContainText('Sleeping bag');
    await un.getByRole('link', { name: T('Look through') }).click();
    await expect(page).toHaveURL(/#\/gear\?unused=1/);
    await expect(page.getByText(T('Only items on no trip for 12 months'))).toBeVisible();
    const list = page.locator('.list');
    await expect(list.getByText('Sleeping bag', { exact: true })).toBeVisible();
    await expect(list.locator('.count')).toHaveText(new RegExp(`^\\s*${n}\\s`));
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
