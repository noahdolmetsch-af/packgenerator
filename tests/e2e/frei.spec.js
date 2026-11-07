// Paket T «Freie Zeit» (Noah 19.10.2026 «alle bauen», «1a und b», «2a», «4a»): Ich › Freie Zeit with its eight
// pages, the tab «Impulse» of Aktiv and the line on Heute when there is no ride idea. German, phone 390 and
// desktop 1440, a fixed clock in Europe/Zurich, fictional data only (a test recipe). SHOTS=<folder> saves shots.
import { test, expect } from '@playwright/test';
import { viaTab } from './placetab.js'; // UI-Ziele #6: the pages that were rows under Ich are tabs now
import DE from '../../src/lib/i18n/de/index.js';
import { PAGES } from '../../src/lib/frei.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const DAY = '2026-10-19';

async function open(page, context, hash = './#/me') {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(`${DAY}T12:00:00+02:00`) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(hash);
  await ready(page);
  return errors;
}
async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
}
const noScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test('Ich leads to Freie Zeit; every one of the eight pages opens in German without a wide page', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await viaTab(page, 'week', '#/me/frei'); // UI-Ziele #6: Planen › Freie Zeit
  await expect(page.getByRole('heading', { level: 1, name: T('Free time') })).toBeVisible();
  await expect(page.locator('[data-frei-page]')).toHaveCount(PAGES.length);
  await shot(page, info, 'frei-hub');
  for (const p of PAGES) {
    await page.goto(`./#/me/frei/${p.key}`);
    await expect(page.getByRole('heading', { level: 1, name: T(p.title) })).toBeVisible();
    expect(await noScroll(page), p.key).toBe(true);
    await shot(page, info, `frei-${p.key}`);
  }
  expect(errors).toEqual([]);
});

test('Aktiv › Impulse: the impulse of the day, «Gemacht» and the line on Heute', async ({ page, context }) => {
  const errors = await open(page, context, './#/flow/impulse');
  await expect(page.getByRole('heading', { level: 1, name: T('Impulses') })).toBeVisible();
  await expect(page.locator('[data-impulse]').first()).toBeVisible();
  await page.locator('[data-done]').first().click();
  await expect(page.getByText(/steht jetzt in deinem Logbuch/).first()).toBeVisible();
  await page.goto('./#/');
  await expect(page.locator('[data-impulse-today]')).toBeVisible(); // no bike, so no ride idea
  expect(errors).toEqual([]);
});

test('Impulse: «Heute nicht» lets the idea rest, and «Jetzt zurückholen» brings it back', async ({ page, context }) => {
  const errors = await open(page, context, './#/flow/impulse');
  const top = page.locator('[data-impulse]').first();
  const id = await top.getAttribute('data-impulse');
  await top.locator('[data-not-today]').click();
  await expect(page.getByText(/ruht 30 Tage/).first()).toBeVisible();
  await expect(page.locator(`[data-impulse="${id}"]`)).toHaveCount(0); // a different idea is on top now
  await page.locator(`[data-impulse-row="${id}"] .fzi-rowbtn`).click();
  await expect(page.locator(`[data-impulse-row="${id}"]`)).toContainText('ruht bis');
  await page.locator(`[data-impulse-row="${id}"] [data-back]`).click();
  await expect(page.locator(`[data-impulse-row="${id}"]`)).not.toContainText('ruht bis');
  expect(errors).toEqual([]);
});

test('Mein Abend: the timer without the phone runs out, then «Hat gut getan» is counted', async ({ page, context }) => {
  const errors = await open(page, context, './#/me/frei/abend');
  await page.locator('[data-eve-min="10"]').click();
  await page.locator('[data-eve-start]').click();
  await expect(page.locator('[data-eve-left]')).toContainText('10:');
  await page.clock.fastForward('05:00');
  await expect(page.locator('[data-eve-left]')).toContainText(/[45]:/);
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-eve-left]')).toBeVisible(); // the end time is remembered
  await page.clock.fastForward('06:00');
  await expect(page.locator('[data-eve-done]')).toContainText('10 Minuten ohne Handy');
  await page.locator('[data-eve-good]').click();
  await expect(page.locator('[data-eve-today]')).toContainText('gut getan');
  await expect(page.locator('[data-eve-count]')).toContainText('1 Abend');
  await page.locator('[data-eve-undo]').click();
  await expect(page.locator('[data-eve-good-now]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Worauf hab ich Lust: your week brings the weather and the free time, «Noch eine» adds an idea', async ({ page, context }, info) => {
  const errors = await open(page, context, './#/me/frei/lust');
  const now = new Date(`${DAY}T12:00:00+02:00`).getTime();
  await page.evaluate(
    ({ now }) =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const tx = r.result.transaction(['settings', 'meta', 'gEvents'], 'readwrite');
          tx.objectStore('settings').put({ key: 'homePlace', value: { lat: 46.95, lon: 7.45, name: 'Testort' } });
          tx.objectStore('settings').put({ key: 'agenda', value: { calendar: true } });
          tx.objectStore('meta').put({ key: 'wx-core:46.95,7.45', at: now, place: { lat: 46.95, lon: 7.45, name: 'Testort' }, days: [], offset: 7200, hours: [0, 1, 2, 3, 4, 5].map((n) => ({ ms: now + n * 36e5, rainP: 80, rainMm: 1, code: 61, cape: 0 })) });
          tx.objectStore('gEvents').put({ id: 'primary|frei-1', gid: 'frei-1', cal: 'primary', title: 'test_data_frei_ Termin', day: '2026-10-19', allDay: false, start: new Date(now + 40 * 6e4).toISOString(), end: new Date(now + 100 * 6e4).toISOString(), busy: true });
          tx.oncomplete = () => (r.result.close(), ok());
        };
      }),
    { now },
  );
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-week-note]')).toContainText('Regen oder Gewitter');
  await expect(page.locator('[data-week-free]')).toContainText(/Etwa (39|40) Min. frei/);
  const first = await page.locator('[data-pick]').first().getAttribute('data-pick');
  expect(['yoga', 'games', 'stretch', 'dance']).toContain(first); // rain: ideas for inside first
  const before = await page.locator('[data-pick]').count();
  await page.locator('[data-more]').click();
  await expect(page.locator('[data-rolled]')).toHaveCount(1);
  expect(await page.locator('[data-pick]').count()).toBe(before + 1);
  await page.locator('[data-week-toggle]').uncheck();
  await expect(page.locator('[data-week-note]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a collection as a page: the link opens a read-only page, and a collection links with a tour', async ({ page, context }, info) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const errors = await open(page, context, './#/me/frei/sammlung/recipes');
  await page.locator('[data-new-entry]').click();
  await page.locator('[data-field="title"]').fill('test_data_frei_Pasta');
  await page.locator('[data-field="ingredients"]').fill('Pasta\nTomaten');
  await page.locator('[data-sheet-save]').click();
  await expect(page.locator('[data-entry]')).toContainText('test_data_frei_Pasta');
  // a fictional tour straight into the database, then reload
  await page.evaluate(
    () =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const tx = r.result.transaction('trips', 'readwrite');
          tx.objectStore('trips').put({ id: 'frei-trip', domain: 'bikepacking', title: 'test_data_frei_ Tour', startDate: '2026-11-01', days: 1, entries: [], ready: [], status: 'planned', createdAt: '2026-10-01T08:00:00.000Z' });
          tx.oncomplete = () => (r.result.close(), ok());
        };
      }),
  );
  await page.reload();
  await ready(page);
  await page.locator('[data-tour-select]').selectOption('frei-trip');
  await expect(page.locator('[data-tour-open]')).toHaveAttribute('href', /#\/tour\/t%3Afrei-trip/);
  await shot(page, info, 'frei-sammlung-geteilt');
  await page.locator('[data-share-page]').click();
  // the link is packed first (an async step), so it reaches the clipboard a moment after the tap
  await expect(page.locator('[role="status"]').filter({ hasText: T('Link copied. Paste it into a message.') })).toBeVisible();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toContain('#/share/sammlung/');
  await page.goto(link);
  await expect(page.locator('[data-shared-coll]')).toContainText('test_data_frei_Pasta');
  await expect(page.locator('[data-shared-coll]')).toContainText('Tomaten');
  await expect(page.locator('[data-print]')).toBeVisible();
  expect(await noScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('Worauf hab ich Lust: a choice gives up to three ideas', async ({ page, context }) => {
  const errors = await open(page, context, './#/me/frei/lust');
  await page.locator('[data-choice="play"]').first().click();
  const picks = page.locator('[data-pick]');
  await expect(picks.first()).toBeVisible();
  expect(await picks.count()).toBeLessThanOrEqual(3);
  expect(errors).toEqual([]);
});

test('a recipe: its ingredients go to the shopping list', async ({ page, context }) => {
  const errors = await open(page, context, './#/me/frei/sammlung/recipes');
  await page.locator('[data-new-entry]').click();
  await page.locator('[data-field="title"]').fill('test_data_frei_Pasta');
  await page.locator('[data-field="ingredients"]').fill('Pasta\nTomaten\nBasilikum');
  await page.locator('[data-sheet-save]').click();
  await expect(page.locator('[data-entry]')).toContainText('test_data_frei_Pasta');
  await page.locator('[data-to-shopping]').click();
  await expect(page.getByText(T('{n} ingredients are on your shopping list.', { n: 3 })).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('Was mir wesentlich ist and Erste Nacht keep what you write', async ({ page, context }) => {
  const errors = await open(page, context, './#/me/frei/wesentlich');
  await page.locator('[data-ess-draft]').fill('test_data_frei_mehr Zeit draussen');
  await page.locator('[data-ess-save]').click();
  await expect(page.locator('[data-ess-list]')).toContainText('test_data_frei_mehr Zeit draussen');
  await page.goto('./#/me/frei/nacht');
  await page.locator('[data-night-question]').fill('test_data_frei_Frage');
  await page.locator('[data-night-question]').blur();
  await page.locator('[data-night-next]').click();
  await expect(page.locator('[data-night-part="plan"]')).toBeVisible();
  await page.reload();
  await ready(page);
  await page.locator('[data-night-step="question"]').click();
  await expect(page.locator('[data-night-question]')).toHaveValue('test_data_frei_Frage');
  expect(errors).toEqual([]);
});
