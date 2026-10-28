// Mini-Tools «Spontan-Einladung» (Noah 28.10.2026, idea 5): «Are you riding with me tomorrow?» with meeting point and
// the weather of the home place; a friend taps «I am in», then changes to «Maybe»; the maker sees the columns.
// The server (/api/sync?action=mini) is the real handler over a small fake Redis. Fictional data only.
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

test('Quick invite: tomorrow with meeting point and weather, a friend is in, then maybe', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  const redis = await miniServer(context);

  await page.goto('./#/me/mini');
  await tap(page.locator('[data-mt-tool="invite"]'), info);
  await expect(page.locator('[data-in]')).toBeVisible();
  await expect(page.locator('[data-in-day="tomorrow"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-in-title]')).toHaveValue(T('Are you riding with me?'));
  // the weather of the home place for tomorrow (mocked: 7–16 °C)
  await expect(page.locator('[data-in-wx]')).toBeChecked();
  await expect(page.locator('label:has([data-in-wx])')).toContainText('7–16 °C');
  await page.locator('[data-in-time]').fill('17:30');
  await page.locator('[data-in-where]').fill('test_data_gtp_ Brunnen');
  await page.locator('[data-in-route]').fill('test_data_gtp_ Seerunde');
  await page.locator('[data-in-url]').fill('https://example.test/route/1');
  await noSideways(page, 'new invite');
  await tap(page.locator('[data-in-make]'), info);

  const url = await page.locator('[data-mt-link]').inputValue();
  expect(url).toMatch(/#\/mitmachen\/[A-Za-z0-9_-]{22}\/[A-Za-z0-9_-]{43}$/);
  await expect(page.locator('[data-ir-empty]')).toBeVisible();
  const kept = () => JSON.stringify([...redis.kv].map(([k, v]) => [k, v instanceof Map ? [...v] : v]));
  expect(kept()).not.toMatch(/test_data_gtp_ (Brunnen|Seerunde)/);

  const friend = await context.newPage();
  await friend.clock.setFixedTime(new Date('2026-10-09T10:00:00+02:00'));
  await friend.goto(url);
  await expect(friend.getByRole('heading', { level: 1 })).toHaveText(T('Are you riding with me?'));
  await expect(friend.locator('[data-if]')).toContainText('17:30');
  await expect(friend.locator('[data-if]')).toContainText('test_data_gtp_ Brunnen');
  await expect(friend.locator('[data-if-wx]')).toContainText('7–16 °C');
  await expect(friend.getByRole('link', { name: /test_data_gtp_ Seerunde/ })).toHaveAttribute('href', 'https://example.test/route/1');
  await tap(friend.locator('[data-ia-reply="y"]'), info);
  await expect(friend.locator('[data-ia-err]')).toHaveText(T('Write your name first, so they know who answered.'));
  await friend.locator('[data-ia-name]').fill('test_data_gtp_ Mia');
  await tap(friend.locator('[data-ia-reply="y"]'), info);
  await expect(friend.locator('[data-ia-sent]')).toHaveText(T('Great, you are in. You can change it until the ride.'));
  await noSideways(friend, 'friend page');
  expect(kept()).not.toMatch(/test_data_gtp_ Mia/);

  await tap(page.locator('[data-mt-refresh]'), info);
  await expect(page.locator('[data-ir-col="y"]')).toContainText('test_data_gtp_ Mia');
  await expect(page.locator('[data-ir-wa]')).toBeVisible();

  // she changes to maybe: still one answer
  await friend.reload();
  await expect(friend.locator('[data-ia-reply="y"]')).toHaveAttribute('aria-checked', 'true');
  await tap(friend.locator('[data-ia-reply="m"]'), info);
  await expect(friend.locator('[data-ia-reply="m"]')).toHaveAttribute('aria-checked', 'true');
  await tap(page.locator('[data-mt-refresh]'), info);
  await expect(page.locator('[data-ir-col="m"]')).toContainText('test_data_gtp_ Mia');
  await expect(page.locator('[data-ir-col="y"] li')).toHaveCount(0);
  await noSideways(page, 'result');
});
