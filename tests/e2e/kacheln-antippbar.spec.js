// KT «Kacheln antippbar» (Noah 14.10.2026, 1a + 1b, 2a, 3a, 4a; mockups KT3, KT4): the small tiles on
// Today say «Öffnen ›», the head of «Im Flow» has a round › to #/flow, each activity has «•••» (the
// same as the long press) and one quiet help line, and after an update a short intro of three steps
// shows once (again from Me). The app seeds its own fictional activities; no personal data.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { STEPS, INTRO_KEY } from '../../src/lib/home/introkt.js';
import { settle } from './settle.js';
import { flowSeeded, putWall } from './wall-fixture.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const D0 = '2026-10-09T07:52:00+02:00';

/** Today in German on Friday morning; `update`: this device saw an update (the intro is due). */
async function open(page, context, { update = false } = {}) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript((u) => {
    localStorage.setItem('lang', 'de');
    if (u && !localStorage.getItem('wasneu.update')) localStorage.setItem('wasneu.update', JSON.stringify({ v: '9.9.8', from: '9.9.7', at: '2026-10-09' }));
  }, update);
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/');
  await settle(page, { sameTrips: false });
  // «Heute neu» A (0.165.0): Im Flow left the ready wall (it stays in the catalog); a wall with it
  await flowSeeded(page);
  await putWall(page);
  await settle(page, { sameTrips: false });
  await expect(page.locator('[data-section="flow"] [data-act="pushups"]')).toBeVisible();
  return errors;
}
const setting = (page, key) =>
  page.evaluate(
    (k) =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const q = r.result.transaction('settings').objectStore('settings').get(k);
          q.onsuccess = () => ok(q.result?.value ?? null);
        };
      }),
    key,
  );
const press = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());

test('the small tiles say «Öffnen ›», the head of «Im Flow» leads to #/flow', async ({ page, context }, info) => {
  const errors = await open(page, context);
  // no intro without an update
  await page.waitForTimeout(1200);
  await expect(page.locator('[data-intro-step]')).toHaveCount(0);
  const tiles = page.locator('.wall [data-opens]');
  expect(await tiles.count()).toBeGreaterThan(0);
  const first = tiles.first();
  await expect(first.locator('.op')).toHaveText(T('Open|tile'));
  await expect(first.locator('.op .go svg')).toBeVisible();
  // the tile's name stays its label (the line is only a sign)
  expect(await first.getAttribute('aria-label')).not.toContain(T('Open|tile'));
  // the line stays one row
  const h = await first.locator('.op').evaluate((el) => el.getBoundingClientRect().height);
  expect(h).toBeLessThan(24);
  await press(page.locator('[data-section="flow"] [data-head-go]'), info);
  await expect(page).toHaveURL(/#\/flow$/);
  expect(errors).toEqual([]);
});

test('«•••» opens the tick sheet, a tap on the tile still ticks, the help line under the grid', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const flow = page.locator('[data-section="flow"]');
  const push = flow.locator('[data-act="pushups"]');
  const more = flow.locator('[data-more="pushups"]');
  await expect(more).toHaveAccessibleName(T('More for {name}: duration, place or stopwatch', { name: 'Liegestütze' }));
  // the name keeps clear of the button
  const [name, dots] = await Promise.all([push.locator('.tx b').boundingBox(), more.boundingBox()]);
  expect(name.x + name.width).toBeLessThanOrEqual(dots.x + 1);
  await expect(flow.locator('[data-tick-help]')).toHaveText(`${T('Tap|tick help')} ${T('ticks|tick help')} · ${T('long press|tick help')} ${T('or •••: duration, place, stopwatch')}`);
  await press(more, info);
  const sheet = page.locator('dialog[open]');
  await expect(sheet.getByRole('heading', { name: T('Tick {name}', { name: 'Liegestütze' }) })).toBeVisible();
  await sheet.getByRole('button', { name: T('Close') }).first().click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(push).toHaveAttribute('aria-pressed', 'false');
  await press(push, info);
  await expect(push).toHaveAttribute('aria-pressed', 'true');
  // on Aktiv the «•••» is there too, the help line only on Today
  await page.goto('./#/flow');
  await expect(page.locator('[data-more="pushups"]').first()).toBeVisible();
  await expect(page.locator('[data-tick-help]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('after an update the intro shows once: three steps, «Überspringen» ends it, then Me brings it back', async ({ page, context }, info) => {
  const errors = await open(page, context, { update: true });
  const bub = page.getByRole('dialog', { name: T('Start page intro') });
  await expect(bub).toBeVisible();
  await expect(bub).toHaveAttribute('data-intro-step', 'tile');
  await expect(bub.getByRole('heading')).toHaveText(T(STEPS[0].title));
  const next = bub.getByRole('button', { name: T('Next {i}/{n}|intro', { i: 1, n: 3 }) });
  await expect(next).toBeFocused();
  await next.click();
  await expect(bub).toHaveAttribute('data-intro-step', 'tick');
  await expect(bub.getByRole('heading')).toHaveText(T(STEPS[1].title));
  await bub.getByRole('button', { name: T('Next {i}/{n}|intro', { i: 2, n: 3 }) }).click();
  await expect(bub).toHaveAttribute('data-intro-step', 'custom');
  await expect(bub.getByRole('heading')).toHaveText(T(STEPS[2].title));
  // the element of the step is the visible «Customise the start page» (on a phone the one below the wall)
  const custom = page.locator('[data-intro="custom"]');
  await expect(custom).toBeVisible();
  // the page under it does not take taps
  await expect(page.locator('[data-intro-dim]')).toBeVisible();
  await bub.getByRole('button', { name: T('Skip|intro') }).click();
  await expect(bub).toHaveCount(0);
  await expect.poll(() => setting(page, INTRO_KEY)).toBe(true);
  expect(await setting(page, 'homeHintLongPress')).toBe(true);
  await page.reload();
  await settle(page, { sameTrips: false });
  await page.waitForTimeout(1200);
  await expect(page.getByRole('dialog', { name: T('Start page intro') })).toHaveCount(0);

  // «Show the start page intro again»: back on Today it comes once more; «Fertig» on the last step, Esc ends it too
  // «Alles finden 2» (Noah 22.10.2026 «3a», changed on purpose): it is on «Hilfe und Funktionen» now (Ich › Hilfe)
  await page.goto('./#/features');
  await press(page.getByRole('button', { name: T('Show the start page intro again') }), info);
  await expect(page).toHaveURL(/#\/$/);
  await expect(bub).toBeVisible();
  await expect(bub.getByRole('button', { name: T('Next {i}/{n}|intro', { i: 1, n: 3 }) })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(bub).toHaveCount(0);
  await expect.poll(() => setting(page, INTRO_KEY)).toBe(true);
  expect(errors).toEqual([]);
});

test('the last step says «Fertig» and ends the intro', async ({ page, context }) => {
  await open(page, context, { update: true });
  const bub = page.getByRole('dialog', { name: T('Start page intro') });
  await expect(bub).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(bub).toHaveAttribute('data-intro-step', 'tick');
  await page.keyboard.press('Enter');
  const done = bub.getByRole('button', { name: T('Done|intro'), exact: true });
  await expect(done).toBeFocused();
  await expect(bub.locator('.kt-dots .on')).toHaveCount(1);
  await done.click();
  await expect(bub).toHaveCount(0);
  await expect.poll(() => setting(page, INTRO_KEY)).toBe(true);
});
