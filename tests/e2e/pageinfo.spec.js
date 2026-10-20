// «Inhalte Flow» IF1 + IF3 (Noah 14.10.2026 «1b 2a 3a», mockups approved 04:32 «IF1–IF3 freigegeben»):
// on Aktiv › Heute the tip line «Gut zu wissen» (× hides it for today), «Alle Tipps» with switches and an
// own tip, the fold «Das kann die App hier», and right after it the SK tile row (the tiles «Weiter»). On a
// phone and a computer, in German. No sideways scroll, no page errors. Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { PAGES, tipOfDay, tipPlace, farOf, contextOf } from '../../src/lib/pageinfo.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const TODAY = '2026-10-14'; // the browser runs in Europe/Zurich
const D0 = `${TODAY}T09:00:00+02:00`;

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`./${hash}`);
  // Noah 19.10 «2a»: the Einstieg of Aktiv lives in the card «Was hier steht»; the tip line is always there
  return errors;
}
async function fits(page, where) {
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: no sideways scroll`).toBeLessThanOrEqual(w);
}

test('Aktiv › Heute: tip of the day, all tips, the fold, then the tiles', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow');
  const main = page.locator('main');
  const ctx = contextOf({}, TODAY); // October: the month tip of the ski season fits (Einstieg 2a)
  const tip = tipOfDay(undefined, 'aktiv', TODAY, ctx);

  // the tip of the day, in German
  const line = main.locator('[data-tip]');
  await expect(line).toHaveAttribute('data-tip', tip.id);
  await expect(line).toContainText({ know: T('Did you know|tag'), today: T('Fits today|tag') }[tip.kind] ?? T('Good to know:'));
  await expect(line).toContainText(T(tip.text));
  await expect(line).toContainText(tip.kind === 'today' ? T(tip.note) : T('Tip {n} of {of} for {page}', { ...tipPlace(undefined, 'aktiv', TODAY, ctx), page: T('Analysis|place') }));

  // the fold is closed; open, one row per thing the app can do, each a place in the app
  const can = main.locator('[data-section="can"]');
  await expect(can).toContainText(T('{n} things|can', { n: PAGES.aktiv.can.length }));
  await expect(can.locator('[data-can]').first()).toBeHidden();
  await can.locator('summary').click();
  await expect(can.locator('[data-can]')).toHaveCount(PAGES.aktiv.can.length);
  await expect(can.locator('[data-can="strava"]')).toHaveAttribute('href', '#/debrief/ride');

  // the tiles «Weiter» are the one SK tile row right after the fold (not a second row)
  await expect(main.locator('[data-section="next"]')).toHaveCount(0);
  const sk = main.locator('[data-sk="flow"]');
  await expect(sk).toHaveCount(1);
  const after = await can.evaluate((c, s) => !!(c.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING), await sk.elementHandle());
  expect(after, 'the tile row comes after the fold').toBe(true);

  await fits(page, 'Aktiv mit Tipps');
  await page.screenshot({ path: `qa/pageinfo-${test.info().project.name}.png`, fullPage: true });

  // «Alle Tipps»: switch the tip of today off, add an own tip, hide the fold
  await line.getByRole('button', { name: T('All tips ›') }).click();
  const sheet = page.locator('[data-sheet="tips"]');
  await expect(sheet.getByRole('heading', { name: T('Tips for {page}', { page: T('Analysis|place') }) })).toBeVisible(); // N1
  await expect(sheet.locator('[data-tip-row]')).toHaveCount(PAGES.aktiv.tips.length);
  await sheet.locator(`[data-tip-row="${tip.id}"] input`).uncheck();
  await expect(line).not.toHaveAttribute('data-tip', tip.id);
  await sheet.getByLabel(T('Own tip')).fill('Erfundener Tipp zum Testen');
  await sheet.getByRole('button', { name: T('Add|tip') }).click();
  await expect(sheet.locator('[data-tip-row]')).toHaveCount(PAGES.aktiv.tips.length + 1);
  await sheet.locator('[data-can-show]').uncheck();
  await expect(can).toHaveCount(0);
  await fits(page, 'Alle Tipps');
  await page.screenshot({ path: `qa/pageinfo-tips-${test.info().project.name}.png` });

  // tips off everywhere: no tip line, «Tipps für diese Seite» brings the list back
  await sheet.locator('[data-tips-all]').uncheck();
  await sheet.getByRole('button', { name: T('Close') }).click();
  await expect(line).toHaveCount(0);
  await main.getByRole('button', { name: T('Tips for this page ›') }).click();
  await sheet.locator('[data-tips-all]').check();
  await sheet.locator('[data-can-show]').check();
  await sheet.getByRole('button', { name: T('Close') }).click();
  await expect(line).toBeVisible();

  // × hides the tip for today, also after a reload
  await line.getByRole('button', { name: T('Hide the tip for today') }).click();
  await expect(line).toHaveCount(0);
  await page.reload();
  await expect(main.locator('[data-section="can"]')).toBeVisible();
  await expect(line).toHaveCount(0);

  expect(errors).toEqual([]);
});

/** Write rows straight into the app's IndexedDB (then reload, so the app reads them). */
const put = (page, rows) =>
  page.evaluate(async (rows) => {
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('pack-generator');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    await new Promise((res, rej) => {
      const tx = db.transaction(Object.keys(rows), 'readwrite');
      for (const [t, list] of Object.entries(rows)) for (const x of list) tx.objectStore(t).put(x);
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  }, rows);

// «Wusstest du» WD1–WD3 (mockups approved 18:34 «wd1-wd3 freigegeben», answers «1a 2a»)
test('Wusstest du: «Passt zu heute» on a hot day, the switch for knowledge, Earth and Everest', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow');
  const main = page.locator('main');
  await expect(main.locator('[data-tip]')).toBeVisible();

  // a hot day at a fictional home place: the heat sentence comes first, with the temperature
  const place = { name: 'Testdorf', lat: 47.1, lon: 7.1 };
  await put(page, {
    settings: [{ key: 'homePlace', value: place }],
    meta: [{ key: 'homeForecast', fetchedAt: '2026-10-14T06:30:00.000Z', place, days: [{ date: TODAY, min: 19, max: 31, rainMm: 0, rainPct: 0 }] }],
  });
  await page.reload();
  const line = main.locator('[data-tip]');
  await expect(line).toHaveAttribute('data-tip', 'today-heat');
  await expect(line.locator('[data-kind="today"]')).toHaveText(`${T('Fits today|tag')} · 31 °C`);
  await expect(line).toContainText(T('only from 28 °C'));
  // 5a: the tip links to a free site, opened in a new tab
  const link = line.locator('[data-tip-link="today-heat"]');
  await expect(link).toHaveAttribute('href', 'https://www.meteoschweiz.admin.ch/');
  await expect(link).toHaveAttribute('target', '_blank');

  // «Alle Tipps»: knowledge is on at first; «Nur nützliche Tipps» keeps the «Wusstest du» ones away
  await line.getByRole('button', { name: T('All tips ›') }).click();
  const sheet = page.locator('[data-sheet="tips"]');
  const seg = sheet.locator('[data-know]');
  await expect(seg.getByRole('button', { name: T('Also knowledge and fun') })).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet.locator('[data-tip-row="know-strava"] [data-kind="know"]')).toHaveText(T('Did you know|tag'));
  await expect(sheet.locator('[data-tip-row="today-cold"]')).toContainText(T('only below 5 °C'));
  await expect(sheet.locator('[data-tip-row="know-baspo"] [data-tip-link]')).toHaveAttribute('href', 'https://www.hepa.ch/');
  await seg.getByRole('button', { name: T('Only useful tips') }).click();
  await expect(seg.getByRole('button', { name: T('Only useful tips') })).toHaveAttribute('aria-pressed', 'true');
  await fits(page, 'Alle Tipps mit Wissen');
  await page.screenshot({ path: `qa/pageinfo-wd-${test.info().project.name}.png` });
  await sheet.getByRole('button', { name: T('Close') }).click();

  // Earth and Everest are knowledge too: hidden now, back with «Auch Wissen und Witziges»
  const rides = [
    { id: 'test_wd_1', date: '2026-08-02', name: 'Erfundene Runde', km: 4200, gainM: 52000, movingH: 160 },
    { id: 'test_wd_2', date: '2026-09-06', name: 'Erfundene Pässe', km: 4212, gainM: 44310, movingH: 150 },
  ];
  await put(page, { rides });
  await page.goto('./#/pack/past');
  await page.reload();
  await expect(main.getByRole('heading', { level: 1, name: T('Past trips') })).toBeVisible();
  await expect(main.locator('[data-section="far"]')).toHaveCount(0);
  await page.goto('./#/flow');
  await main.locator('[data-tip]').getByRole('button', { name: T('All tips ›') }).click();
  await page.locator('[data-sheet="tips"] [data-know]').getByRole('button', { name: T('Also knowledge and fun') }).click();
  await page.locator('[data-sheet="tips"]').getByRole('button', { name: T('Close') }).click();
  await page.goto('./#/pack/past');
  const per = main.getByRole('group', { name: T('Period') });
  if (await per.count()) {
    const all = per.getByRole('button').last();
    await all.click();
  }
  const far = farOf(8412, 96310);
  const earth = main.locator('[data-far="earth"]');
  await expect(earth).toContainText(T('{n} % around the Earth', { n: far.earth.pct }));
  await expect(main.locator('[data-far="everest"]')).toContainText(T('{x}× Everest', { x: '10.8' }));
  await fits(page, 'Vergangene Touren');
  await page.screenshot({ path: `qa/pageinfo-far-${test.info().project.name}.png`, fullPage: true });
  expect(errors).toEqual([]);
});
