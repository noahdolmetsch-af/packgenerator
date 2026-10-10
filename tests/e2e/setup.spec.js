// v0.31.0 (Noah 9a, variant A "Ruhig und klar"): Bikes → Setup in German.
// - the dark band: name, km, weight, bags, "n Pflege fällig"; the bikes as tabs; edit and add stay reachable;
// - the drawing with labels that are never cut off, and the bag chosen from a list from below (no select box);
// - mounts on and off;
// - the card "Wer schraubt": ich / Velomech this year, the last jobs, "Als Nächstes für den Velomech" → Auftrag.
// Fictional data only (test_data_gtp_ names), built from tests/e2e/pf-fixture.json.
// SETUP_SHOTS=<folder> saves phone and desktop screenshots (never into the repo).
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const P = 'test_data_gtp_';
const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const SPARK = `${P}spark`;
const GRAVEL = `${P}gravel`;
const SHOTS = process.env.SETUP_SHOTS || null;

/**
 * The PF fixture plus, on the Spark: a workshop visit today (3 jobs, CHF 185.50), the chain waxed
 * by me today, and a fork service by the shop more than a year ago (CHF 90): the fork is due now
 * and goes to the bike shop.
 */
function fixtureFile(info) {
  const fix = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  const spark = fix.tables.bikes.find((b) => b.id === SPARK);
  spark.parts.find((p) => p.key === 'chain').history.push({ date: day(0), km: 5000, value: null, action: 'service', result: 'done', by: 'self', note: '' });
  fix.tables.visits = [
    { id: `visit-${P}1`, bikeId: SPARK, date: day(0), km: 5000, shop: `${P} Velo shop`, totalChf: 185.5, parts: [{ part: 'padsR', action: 'replace', chf: 60 }, { part: 'shifting', action: 'service', chf: 40 }, { part: 'wheels', action: 'service', chf: 85.5 }] },
    { id: `visit-${P}0`, bikeId: SPARK, date: day(-400), km: 1000, shop: `${P} Velo shop`, totalChf: 90, parts: [{ part: 'fork', action: 'service', chf: 90 }] },
  ];
  const path = info.outputPath('setup-fixture.json');
  writeFileSync(path, JSON.stringify(fix));
  return path;
}

async function start(page, context, info) {
  const file = fixtureFile(info);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  return errors;
}

const stored = (page, id) =>
  page.evaluate(
    (id) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const get = req.result.transaction('bikes').objectStore('bikes').get(id);
          get.onsuccess = () => resolve(get.result);
          get.onerror = () => reject(get.error);
        };
      }),
    id,
  );

/** No sideways scrolling of the page. */
const noSideScroll = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

async function shot(page, name, full = false) {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: full });
}

test('band: name, km, weight, bags, care due; the bikes as tabs; edit and add', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=setup&bike=${SPARK}`);
  const band = page.locator('section.setup-band');
  await expect(band.getByRole('heading', { name: `${P} Scott Spark 960` })).toBeVisible();
  await expect(band).toContainText('5’000 km');
  await expect(band).toContainText('12.4 kg');
  await expect(band).toContainText(T('measured'));
  await expect(band).toContainText(T('{n} bags', { n: 3 }));
  const due = band.getByRole('link', { name: T('{n} care due', { n: 2 }) });
  await expect(due).toHaveAttribute('href', new RegExp(`tab=care&bike=${SPARK}`));

  // The bikes as tabs: a tap switches the bike and the address.
  const tabs = band.getByRole('tab');
  await expect(tabs).toHaveCount(3);
  await expect(band.getByRole('tab', { name: `${P} Scott Spark 960` })).toHaveAttribute('aria-selected', 'true');
  await band.getByRole('tab', { name: `${P} Gravel Grinder` }).click();
  await expect(page).toHaveURL(new RegExp(`bike=${GRAVEL}`));
  await expect(band.getByRole('heading', { name: `${P} Gravel Grinder` })).toBeVisible();
  await expect(band).toContainText('8’000 km');
  await expect(band.getByRole('tab', { name: `${P} Gravel Grinder` })).toHaveAttribute('aria-selected', 'true');

  // Edit and add are one tap away.
  await band.getByRole('button', { name: T('Rename {name}', { name: `${P} Gravel Grinder` }) }).click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await band.getByRole('button', { name: T('Add bike') }).click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.keyboard.press('Escape');
  await noSideScroll(page);
  expect(errors).toEqual([]);
});

test('drawing and bag sheet: long names are never cut off, a bag is chosen from a list from below, mounts on and off', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=setup&bike=${GRAVEL}`);
  const draw = page.locator('section.draw');
  // The long name stands in full and fits its label.
  const label = draw.locator('.lab', { hasText: `${P} Satteltasche 14 L` });
  await expect(label).toBeVisible();
  await expect(label.locator('b')).toHaveText(`${P} Satteltasche 14 L`);
  const cut = await draw.locator('.lab').evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1).map((e) => e.textContent));
  expect(cut).toEqual([]);
  // No select box for the bags any more.
  await expect(page.locator('section.std select')).toHaveCount(0);

  // A row opens the list from below; a tap saves and closes.
  await page.locator('#slot-seat').click();
  const sheet = page.locator('dialog.bagsheet[open]');
  await expect(sheet.getByRole('heading', { name: T('Seat pack') })).toBeVisible();
  await expect(sheet.getByRole('button', { name: new RegExp(`${P} Satteltasche 14 L`) })).toHaveAttribute('aria-pressed', 'true');
  await shot(page, `setup-sheet-${info.project.name}`);
  await sheet.getByRole('button', { name: new RegExp(`${P} Satteltasche 6 L`) }).click();
  await expect(sheet).toHaveCount(0);
  await expect.poll(async () => (await stored(page, GRAVEL)).setup.seat).toBe('bag-gtp-seat6');
  await expect(page.locator('#slot-seat')).toContainText(`${P} Satteltasche 6 L`);

  // The drawing opens the same list: an empty place, "No bag" is ticked.
  await draw.getByRole('button', { name: T('{place}: empty, choose a bag', { place: T('Bottle cage 1') }) }).click();
  await expect(sheet.getByRole('button', { name: new RegExp(T('No bag')) })).toHaveAttribute('aria-pressed', 'true');
  await sheet.getByRole('button', { name: T('Close') }).click();
  await expect(sheet).toHaveCount(0);

  // Choosing "No bag" empties the place.
  await page.locator('#slot-fork').click();
  await sheet.getByRole('button', { name: new RegExp(T('No bag')) }).click();
  await expect.poll(async () => (await stored(page, GRAVEL)).setup.fork).toBe(null);

  // Mounts: switch the front roll off and on again.
  await draw.getByRole('button', { name: T('Edit mounts') }).click();
  const bar = page.getByRole('switch', { name: T('Mount: {place}', { place: T('Front roll') }) });
  await expect(bar).toHaveAttribute('aria-checked', 'true');
  await bar.click();
  await expect.poll(async () => (await stored(page, GRAVEL)).slots.includes('bar')).toBe(false);
  await expect(bar).toHaveAttribute('aria-checked', 'false');
  await bar.click();
  await expect.poll(async () => (await stored(page, GRAVEL)).slots.includes('bar')).toBe(true);
  await page.getByRole('button', { name: T('Done with mounts') }).click();
  // v0.40.0: an empty place waits in the one row "n places empty".
  await expect(page.locator('#slot-bar')).toBeAttached();
  await noSideScroll(page);
  expect(errors).toEqual([]);
});

test('Wer schraubt: ich and Velomech this year, the last jobs, next for the Velomech with the order', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=setup&bike=${SPARK}`);
  const card = page.locator('section.who');
  await expect(card.getByRole('heading', { name: T('Who works on it') })).toBeVisible();
  // v0.31.0: an entry without "who" is not counted as mine (the same rule as Bike care).
  await expect(card).toContainText(T('me: {n} job', { n: 1 }));
  await expect(card).toContainText(`${T('bike shop: {n} visit', { n: 1 })} · CHF 185.50`);
  // The last jobs with their badge.
  const rows = card.locator('li');
  await expect(rows.filter({ hasText: T('Chain waxed') }).locator('.badge')).toHaveText(T('me|who'));
  await expect(rows.filter({ hasText: `${P} Velo shop` }).locator('.badge')).toHaveText(T('bike shop|who'));
  // Next for the bike shop: the fork (the shop did it last time), with the price from the receipt; not the chain.
  const next = rows.filter({ hasText: T('Next for the bike shop') });
  await expect(next).toContainText(T('Fork service'));
  await expect(next).toContainText(T('about CHF {chf}', { chf: 90 }));
  await expect(next).not.toContainText(T('Waxed chain'));
  await shot(page, `setup-${info.project.name}`);
  await shot(page, `setup-${info.project.name}-ganz`, true);
  await next.getByRole('button', { name: T('Order|workshop') }).click();
  const order = page.locator('dialog[open]');
  await expect(order).toContainText(T('Workshop order'));
  await expect(order).toContainText(T('Fork service'));
  await page.keyboard.press('Escape');

  // The folded rows are all there.
  for (const name of ['Bike details', 'Profile', 'Photos', 'Ideas|bike', 'Settings', 'Your bags']) {
    await expect(page.locator('details.fold summary .lbl', { hasText: new RegExp(`^${T(name)}$`) })).toBeVisible();
  }
  await noSideScroll(page);
  expect(errors).toEqual([]);
});

test('320 px: no sideways scroll, the long bag names wrap', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'phone only');
  const errors = await start(page, context, info);
  await page.setViewportSize({ width: 320, height: 720 });
  for (const id of [SPARK, GRAVEL]) {
    await page.goto(`./#/bikes?tab=setup&bike=${id}`);
    await expect(page.locator('section.setup-band')).toBeVisible();
    await noSideScroll(page);
    const cut = await page.locator('section.draw .lab').evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1).length);
    expect(cut).toBe(0);
  }
  await shot(page, 'setup-phone-320', true);
  expect(errors).toEqual([]);
});
