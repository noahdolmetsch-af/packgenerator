// Mini-Tools «Essen und Unverträglichkeiten» (Noah 28.10.2026, idea 7): who eats what; a friend answers for two,
// gluten-free with an allergy; the maker sees the counts, the allergy on top and a shopping list with swaps.
// The server (/api/sync?action=mini) is the real handler over a small fake Redis. Fictional data only.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { makeMiniHandler } from '../../api/_lib/mini.js';
import { fakeRedis } from '../fakeredis.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = async (page, where = '') => {
  const d = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(d, where).toBeLessThanOrEqual(1);
};

async function miniServer(context) {
  const r = fakeRedis();
  const env = () => ({ redisUrl: 'https://redis.example.test', redisToken: 'r' });
  const doFetch = async (url, init) => Response.json({ result: r.run(...((a) => [a[0], a.slice(1)])(JSON.parse(init.body))) });
  const handler = makeMiniHandler({ env, doFetch, now: () => new Date('2026-10-09T07:00:00Z') });
  await context.route(/packgen-three\.vercel\.app\/api\/sync\?action=mini/, async (route) => {
    const req = route.request();
    const res = await handler(new Request(req.url(), { method: req.method(), headers: { origin: 'http://localhost:5173', 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.5' }, body: req.method() === 'POST' ? req.postData() : undefined }));
    await route.fulfill({ status: res.status, json: await res.json() });
  });
  return r;
}

test('Who eats what: a friend answers for two, gluten-free with an allergy; the shopping list swaps', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  const redis = await miniServer(context);

  await page.goto('./#/me/mini');
  await tap(page.locator('[data-mt-tool="food"]'), info);
  await expect(page.locator('[data-fn]')).toBeVisible();
  await page.locator('[data-fn-title]').fill('test_data_gtp_ Hüttenabend');
  await tap(page.locator('[data-fn-diet="veg"]'), info);
  await noSideways(page, 'new food question');
  await tap(page.locator('[data-fn-make]'), info);

  const url = await page.locator('[data-mt-link]').inputValue();
  expect(url).toMatch(/#\/mitmachen\/[A-Za-z0-9_-]{22}\/[A-Za-z0-9_-]{43}$/);
  // only me so far
  await expect(page.locator('[data-fr] h2')).toHaveText(T('{n} eat along', { n: 1 }));
  const kept = () => JSON.stringify([...redis.kv].map(([k, v]) => [k, v instanceof Map ? [...v] : v]));
  expect(kept()).not.toMatch(/test_data_gtp_ Hüttenabend/);

  const friend = await context.newPage();
  await friend.clock.setFixedTime(new Date('2026-10-09T10:00:00+02:00'));
  await friend.goto(url);
  await expect(friend.getByRole('heading', { level: 1 })).toHaveText('test_data_gtp_ Hüttenabend');
  await friend.locator('[data-fa-name]').fill('test_data_gtp_ Mia');
  await tap(friend.locator('[data-fa-more]'), info);
  await expect(friend.locator('[data-fa-count]')).toHaveText('2');
  await tap(friend.locator('[data-fa-diet="gf"]'), info);
  await friend.locator('[data-fa-other]').fill('test_data_gtp_ Sellerie');
  await tap(friend.locator('[data-fa-size="l"]'), info);
  await noSideways(friend, 'friend page');
  await tap(friend.locator('[data-fa-send]'), info);
  await expect(friend.locator('[data-fa-sent]')).toBeVisible();
  expect(kept()).not.toMatch(/test_data_gtp_ (Mia|Sellerie)/);

  await tap(page.locator('[data-mt-refresh]'), info);
  await expect(page.locator('[data-fr] h2')).toHaveText(T('{n} eat along', { n: 3 }));
  await expect(page.locator('[data-fr-diets]')).toContainText(T('Gluten-free'));
  await expect(page.locator('[data-fr-notes]')).toContainText('test_data_gtp_ Sellerie');
  // pasta evening: me 125 g pasta (vegetarian), Mia two big portions of gluten-free pasta (2 × 125 × 1.35 = 337.5 → 350 g)
  await expect(page.locator('[data-fr-list]')).toContainText(T('Gluten-free pasta'));
  await expect(page.locator('[data-fr-list] li', { hasText: T('Gluten-free pasta') })).toContainText('350');
  // breakfast
  await tap(page.locator('[data-fr-menu="breakfast"]'), info);
  await expect(page.locator('[data-fr-list]')).toContainText(T('Gluten-free muesli'));
  await expect(page.locator('[data-fr-wa]')).toBeVisible();
  await noSideways(page, 'result');
});
