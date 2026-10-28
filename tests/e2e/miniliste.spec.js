// Mini-Tools «Anmeldeliste mit Warteliste» (Noah 28.10.2026, idea 4): Ich › Mini-Tools › Anmeldeliste with 2 places;
// three people sign up in their own browsers, the third waits; one signs off and the third moves up; the maker
// sees who is in and who waits and takes someone off with Undo. The server (/api/sync?action=mini) is the real
// handler over a small fake Redis; it keeps only sealed text. Fictional data only.
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';
import { makeMiniHandler } from '../../api/_lib/mini.js';
import { fakeRedis } from '../fakeredis.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = async (page, where = '') => {
  const d = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(d, where).toBeLessThanOrEqual(1);
};

// one clock for all browsers: each request a second later, so the order of sign-ups is clear
let tick = 0;
async function miniServer(context, r = fakeRedis()) {
  const env = () => ({ redisUrl: 'https://redis.example.test', redisToken: 'r' });
  const doFetch = async (url, init) => Response.json({ result: r.run(...((a) => [a[0], a.slice(1)])(JSON.parse(init.body))) });
  const handler = makeMiniHandler({ env, doFetch, now: () => new Date(Date.parse('2026-10-09T07:00:00Z') + 1000 * tick++) });
  await context.route(/packgen-three\.vercel\.app\/api\/sync\?action=mini/, async (route) => {
    const req = route.request();
    const res = await handler(new Request(req.url(), { method: req.method(), headers: { origin: 'http://localhost:5173', 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.5' }, body: req.method() === 'POST' ? req.postData() : undefined }));
    await route.fulfill({ status: res.status, json: await res.json() });
  });
  return r;
}

test('Sign-up list: two places, the third waits and moves up; the maker takes someone off with Undo', async ({ page, context, browser }, info) => {
  const T = await openHome(page, context, info);
  const redis = await miniServer(context);

  await page.goto('./#/me/mini');
  await tap(page.locator('[data-mt-tool="list"]'), info);
  await expect(page.locator('[data-ln]')).toBeVisible();
  await tap(page.locator('[data-ln-make]'), info);
  await expect(page.locator('[data-ln-err]')).toHaveText(T('Write a title first, so people know what it is about.'));
  await page.locator('[data-ln-title]').fill('test_data_gtp_ Werkstatt-Abend');
  await page.locator('[data-ln-where]').fill('test_data_gtp_ Garage');
  await page.locator('[data-ln-places]').fill('3');
  await tap(page.getByRole('button', { name: T('One place less') }), info);
  await expect(page.locator('[data-ln-places]')).toHaveValue('2');
  await noSideways(page, 'new list');
  await tap(page.locator('[data-ln-make]'), info);

  const url = await page.locator('[data-mt-link]').inputValue();
  expect(url).toMatch(/#\/mitmachen\/[A-Za-z0-9_-]{22}\/[A-Za-z0-9_-]{43}$/);
  await expect(page.locator('[data-lr-empty]')).toBeVisible();
  const kept = () => JSON.stringify([...redis.kv].map(([k, v]) => [k, v instanceof Map ? [...v] : v]));
  expect(kept()).not.toMatch(/Werkstatt|Garage/);

  // three people, each in their own browser
  const people = [];
  for (const n of ['Mia', 'Luca', 'Sara']) {
    const fc = await browser.newContext({ ...(phone(info) ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } : {}), locale: 'de-CH', timezoneId: 'Europe/Zurich' });
    await fc.addInitScript(() => localStorage.setItem('lang', 'de'));
    await miniServer(fc, redis);
    const f = await fc.newPage();
    await f.goto(url);
    await expect(f.getByRole('heading', { level: 1 })).toHaveText('test_data_gtp_ Werkstatt-Abend');
    await f.locator('[data-la-name]').fill(`test_data_gtp_ ${n}`);
    await tap(f.locator('[data-la-join]'), info);
    await expect(f.locator('[data-la-place]')).toBeVisible();
    people.push({ fc, f });
  }
  const [mia, , sara] = people;
  await expect(mia.f.locator('[data-la-place]')).toHaveAttribute('data-la-place', 'yes');
  await expect(sara.f.locator('[data-la-place]')).toHaveAttribute('data-la-place', 'wait');
  await expect(sara.f.locator('[data-la-place]')).toContainText(T('You are on the waiting list, place {n}. If someone signs off, you move up by yourself.', { n: 1 }));
  await noSideways(sara.f, 'friend page');
  expect(kept()).not.toMatch(/Mia|Luca|Sara/);

  // the maker sees two in, one waiting
  await tap(page.locator('[data-mt-refresh]'), info);
  await expect(page.locator('[data-lr-in] li')).toHaveCount(2);
  await expect(page.locator('[data-lr-wait] li')).toHaveCount(1);
  await expect(page.locator('[data-lr-wait]')).toContainText('test_data_gtp_ Sara');
  await noSideways(page, 'result');

  // Mia signs off; Sara moves up
  await tap(mia.f.locator('[data-la-leave]'), info);
  await tap(mia.f.getByRole('dialog').getByRole('button', { name: T('Sign off') }), info);
  await expect(mia.f.locator('[data-la-said]')).toHaveText(T('You are signed off.'));
  await expect(mia.f.locator('[data-la-join]')).toBeVisible();
  await sara.f.reload();
  await expect(sara.f.locator('[data-la-place]')).toHaveAttribute('data-la-place', 'yes');
  await tap(page.locator('[data-mt-refresh]'), info);
  await expect(page.locator('[data-lr-in] li')).toHaveCount(2);
  await expect(page.locator('[data-lr-wait]')).toHaveCount(0);

  // the maker takes Luca off, then Undo
  await tap(page.locator('[data-lr-in] li').first().locator('[data-lr-drop]'), info);
  await tap(page.getByRole('dialog').getByRole('button', { name: T('Take off') }), info);
  await expect(page.locator('[data-lr-in] li')).toHaveCount(1);
  await tap(page.getByRole('button', { name: T('Undo') }), info);
  await expect(page.locator('[data-lr-in] li')).toHaveCount(2);
  await tap(page.locator('[data-mt-refresh]'), info);
  await expect(page.locator('[data-lr-in] li')).toHaveCount(2);
  for (const p of people) await p.fc.close();
});
