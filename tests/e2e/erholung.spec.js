// «Erholung» (mockup AK2, Noah 13.10.2026 «1-5a», «ich gebe hiermit alle mockups frei»): the card
// «Erholung» under «Mehr in Aktiv», the recovery ring, the hint after 3 active days («Nicht heute» hides
// it), ticking a recovery activity and taking it back, adding an idea, the last 14 days, on a phone and a
// computer, in German. No sideways scroll, no page errors. Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const TODAY = '2026-10-13'; // a Tuesday; the browser runs in Europe/Zurich
const D0 = `${TODAY}T09:00:00+02:00`;
/** Calendar-day arithmetic on YYYY-MM-DD (never «now + n × 24 h»). */
const addDays = (day, n) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`./${hash}`);
  return errors;
}
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
async function fits(page, where) {
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: no sideways scroll`).toBeLessThanOrEqual(w);
}

test('Erholung: the ring, the pause hint, tick and untick, add an idea', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow');
  const main = page.locator('main');
  await expect(main.locator('[data-more="rest"]')).toBeVisible();
  // three active days in a row up to today, fictional
  const log = [2, 1, 0].map((k) => {
    const day = addDays(TODAY, -k);
    return { id: `test_rest_${k}`, actId: k === 1 ? 'tennis' : 'bike', day, at: `${day}T07:00:00.000Z`, n: 1 };
  });
  await put(page, { flowLog: log });
  await page.reload();

  await main.locator('[data-more="rest"]').click();
  await expect(page).toHaveURL(/#\/flow\/rest$/);
  await expect(page.locator('.ptabs').getByRole('link', { name: T('Today|active'), exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(main.getByRole('heading', { level: 1, name: T('Recovery|page') })).toBeVisible();
  await expect(main.locator('[data-rest-ring]')).toContainText('0/');

  // the hint after 3 active days; «Nicht heute» hides it for today
  const hint = main.locator('[data-rest-hint]');
  await expect(hint).toContainText(T('{n} active days in a row', { n: 3 }));
  await hint.locator('[data-hint-no]').click();
  await expect(hint).toHaveCount(0);

  // tick the sauna, take it back
  const sauna = main.locator('[data-rest="sauna"] [role="checkbox"]');
  await sauna.click();
  await expect(sauna).toHaveAttribute('aria-checked', 'true');
  await expect(main.locator('[data-rest-ring]')).toContainText('1/');
  await expect(main.locator('[data-rest-strip] .today i.rest')).toHaveCount(1);
  await sauna.click();
  await expect(sauna).toHaveAttribute('aria-checked', 'false');

  // an idea becomes a recovery activity
  await main.locator('[data-rest-idea="early"]').click();
  await expect(main.locator('[data-rest="early"]')).toContainText(T('not yet'));
  await expect(main.locator('[data-rest-strip] .dd')).toHaveCount(14);

  await fits(page, 'Erholung');
  await page.screenshot({ path: `qa/erholung-${test.info().project.name}.png`, fullPage: true });
  expect(errors).toEqual([]);
});
