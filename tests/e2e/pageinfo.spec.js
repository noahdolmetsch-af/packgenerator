// «Inhalte Flow» IF1 + IF3 (Noah 14.10.2026 «1b 2a 3a», mockups approved 04:32 «IF1–IF3 freigegeben»):
// on Aktiv › Heute the tip line «Gut zu wissen» (× hides it for today), «Alle Tipps» with switches and an
// own tip, the fold «Das kann die App hier», the tiles «Weiter» with links outside and an own link. On a
// phone and a computer, in German. No sideways scroll, no page errors. Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { PAGES, tipOfDay } from '../../src/lib/pageinfo.js';

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
  return errors;
}
async function fits(page, where) {
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: no sideways scroll`).toBeLessThanOrEqual(w);
}

test('Aktiv › Heute: tip of the day, all tips, the fold and the tiles', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow');
  const main = page.locator('main');
  const tip = tipOfDay(undefined, 'aktiv', TODAY);

  // the tip of the day, in German
  const line = main.locator('[data-tip]');
  await expect(line).toHaveAttribute('data-tip', tip.id);
  await expect(line).toContainText(T('Good to know:'));
  await expect(line).toContainText(T(tip.text));
  await expect(line).toContainText(T('Tip {n} of {of} for {page}', { n: 1 + PAGES.aktiv.tips.findIndex((x) => x.id === tip.id), of: PAGES.aktiv.tips.length, page: T('Active|place') }));

  // the fold is closed; open, one row per thing the app can do, each a place in the app
  const can = main.locator('[data-section="can"]');
  await expect(can).toContainText(T('{n} things|can', { n: PAGES.aktiv.can.length }));
  await expect(can.locator('[data-can]').first()).toBeHidden();
  await can.locator('summary').click();
  await expect(can.locator('[data-can]')).toHaveCount(PAGES.aktiv.can.length);
  await expect(can.locator('[data-can="strava"]')).toHaveAttribute('href', '#/debrief/ride');

  // the tiles: outside links open in a new tab and carry the site name
  const next = main.locator('[data-section="next"]');
  await expect(next.getByRole('heading', { name: T('Next|more') })).toBeVisible();
  const hepa = next.locator('[data-tile="hepa"]');
  await expect(hepa).toHaveAttribute('target', '_blank');
  await expect(hepa).toContainText('hepa.ch');
  await expect(next.locator('[data-tile="goals"]')).toHaveAttribute('href', '#/flow/goals');

  await fits(page, 'Aktiv mit Tipps');
  await page.screenshot({ path: `qa/pageinfo-${test.info().project.name}.png`, fullPage: true });

  // an own link: a wrong address is refused, a right one becomes a tile
  await next.locator('[data-tile="add"]').click();
  const add = page.locator('[data-sheet="own-link"]');
  await add.getByLabel(T('Name')).fill('Testseite');
  await add.getByLabel(T('Address')).fill('javascript:alert(1)');
  await add.getByRole('button', { name: T('Save') }).click();
  await expect(add.getByRole('alert')).toHaveText(T('Enter a web address, for example strava.com'));
  await add.getByLabel(T('Address')).fill('example.org/test');
  await add.getByRole('button', { name: T('Save') }).click();
  await expect(add).toHaveCount(0);
  const mine = next.locator('a[href="https://example.org/test"]');
  await expect(mine).toContainText('Testseite');
  await next.getByRole('button', { name: T('Remove the link {name}', { name: 'Testseite' }) }).click();
  await expect(mine).toHaveCount(0);

  // «Alle Tipps»: switch the tip of today off, add an own tip, hide the fold
  await line.getByRole('button', { name: T('All tips ›') }).click();
  const sheet = page.locator('[data-sheet="tips"]');
  await expect(sheet.getByRole('heading', { name: T('Tips for {page}', { page: T('Active|place') }) })).toBeVisible();
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
  await next.getByRole('button', { name: T('Tips for this page ›') }).click();
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
