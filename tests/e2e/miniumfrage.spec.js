// Mini-Tools «Mini-Umfrage» (Noah 28.10.2026, idea 2): Ich › Mini-Tools › Mini-Umfrage from a template, change it,
// make a link; a friend answers one question at a time in a second tab; the maker reads the summary and bars;
// an anonymous survey asks no name. The server (/api/sync?action=mini) is the real handler over a small fake
// Redis; it keeps only sealed text. Fictional data only.
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

test('Mini survey: from a template, a friend answers step by step, the summary is on top', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  const redis = await miniServer(context);

  await page.goto('./#/me/mini');
  await tap(page.locator('[data-mt-tool="poll"]'), info);
  await expect(page.locator('[data-pn]')).toBeVisible();

  // without a title or questions it says what is missing
  await tap(page.locator('[data-pn-make]'), info);
  await expect(page.locator('[data-pn-err]')).toHaveText(T('Write a title first, so people know what it is about.'));

  // the template fills title and three questions; everything stays changeable
  await tap(page.locator('[data-pn-tpl="where"]'), info);
  await expect(page.locator('[data-pn-title]')).toHaveValue(T('Where does the trip go?'));
  await expect(page.locator('[data-pn-q]')).toHaveCount(3);
  await page.locator('[data-pn-title]').fill('test_data_gtp_ Herbsttour');
  const q1 = page.locator('[data-pn-q="0"]');
  await q1.locator('[data-pn-opt="0"]').fill('test_data_gtp_ Jura');
  await q1.locator('[data-pn-opt="1"]').fill('test_data_gtp_ Tessin');
  await q1.locator('[data-pn-opt="2"]').fill('test_data_gtp_ Emmental');
  // a fourth question, yes or no, moved up one place with the arrow
  await tap(page.locator('[data-pn-add]'), info);
  const q4 = page.locator('[data-pn-q="3"]');
  await q4.locator('[data-pn-type]').selectOption('yesno');
  await q4.locator('[data-pn-text]').fill('test_data_gtp_ Mit dem Zug?');
  await tap(q4.getByRole('button', { name: T('Move {name} up', { name: 'test_data_gtp_ Mit dem Zug?' }) }), info);
  await expect(page.locator('[data-pn-q="2"] [data-pn-text]')).toHaveValue('test_data_gtp_ Mit dem Zug?');
  await noSideways(page, 'new survey');
  await page.screenshot({ path: info.outputPath('umfrage-neu.png'), fullPage: true });
  await tap(page.locator('[data-pn-make]'), info);

  // the survey with its link; the server keeps only sealed text
  const linkBox = page.locator('[data-mt-link]');
  await expect(linkBox).toHaveValue(/#\/mitmachen\/[A-Za-z0-9_-]{22}\/[A-Za-z0-9_-]{43}$/);
  const url = await linkBox.inputValue();
  await expect(page.locator('[data-pr-summary]')).toContainText(T('No answers yet. Share the link, then look for new answers.'));
  const kept = () => JSON.stringify([...redis.kv].map(([k, v]) => [k, v instanceof Map ? [...v] : v]));
  expect(kept()).not.toMatch(/test_data_gtp_ (Herbsttour|Jura)/);

  // a friend answers one question at a time
  const friend = await context.newPage();
  await friend.clock.setFixedTime(new Date('2026-10-09T10:00:00+02:00'));
  await friend.goto(url);
  await expect(friend.getByRole('heading', { level: 1 })).toHaveText('test_data_gtp_ Herbsttour');
  await tap(friend.locator('[data-pa-next]'), info);
  await expect(friend.locator('[data-pa-err]')).toHaveText(T('Write your name first, so they know who answered.'));
  await friend.locator('[data-pa-name]').fill('test_data_gtp_ Freundin');
  await tap(friend.locator('[data-pa-next]'), info);
  await tap(friend.locator('[data-pa-q="q1"] [data-pa-opt="1"]'), info);
  await expect(friend.locator('[data-pa-q="q1"] [data-pa-opt="1"]')).toHaveAttribute('aria-checked', 'true');
  await noSideways(friend, 'friend page');
  await friend.screenshot({ path: info.outputPath('umfrage-freund.png'), fullPage: true });
  await tap(friend.locator('[data-pa-next]'), info);
  await tap(friend.locator('[data-pa-q="q2"] [data-pa-opt="4"]'), info);
  await tap(friend.locator('[data-pa-next]'), info);
  await tap(friend.locator('[data-pa-q="q3"] [data-pa-opt="1"]'), info);
  await tap(friend.locator('[data-pa-next]'), info);
  await friend.locator('[data-pa-text]').fill('test_data_gtp_ gutes Essen');
  await tap(friend.locator('[data-pa-next]'), info);
  await expect(friend.locator('[data-pa-done]')).toHaveText(T('{done} of {n} questions answered.', { done: 4, n: 4 }));
  await tap(friend.locator('[data-pa-send]'), info);
  await expect(friend.locator('[data-pa-sent]')).toBeVisible();
  expect(kept()).not.toMatch(/test_data_gtp_ (Freundin|gutes)/);

  // the maker reads the summary
  await tap(page.locator('[data-mt-refresh]'), info);
  await expect(page.locator('[data-pr-people]')).toContainText(T('1 answer'));
  await expect(page.locator('[data-pr-summary] li').first()).toContainText('test_data_gtp_ Tessin');
  await expect(page.locator('[data-pr-q="q2"] [data-pr-avg]')).toContainText('4');
  await expect(page.locator('[data-pr-q="q4"] [data-pr-texts]')).toContainText('test_data_gtp_ gutes Essen');
  await expect(page.locator('[data-pr-wa]')).toBeVisible();
  await noSideways(page, 'result');
  await page.screenshot({ path: info.outputPath('umfrage-ergebnis.png'), fullPage: true });

  // the hub lists it with its own icon
  await page.goto('./#/me/mini');
  await expect(page.locator('[data-mt-item]')).toHaveCount(1);
  await expect(page.locator('[data-mt-item]')).toContainText('test_data_gtp_ Herbsttour');
});

test('Mini survey: anonymous asks no name and keeps none', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await miniServer(context);
  await page.goto('./#/me/mini/umfrage');
  await tap(page.locator('[data-pn-tpl="after"]'), info);
  await page.locator('[data-pn-anon]').check();
  await tap(page.locator('[data-pn-make]'), info);
  const url = await page.locator('[data-mt-link]').inputValue();

  const friend = await context.newPage();
  await friend.goto(url);
  await expect(friend.locator('[data-pa-name]')).toHaveCount(0);
  await expect(friend.locator('[data-pa-step]')).toHaveAttribute('data-pa-step', '0');
  await tap(friend.locator('[data-pa-q="q2"], [data-pa-q="q1"]').first().locator('[data-pa-opt="5"]'), info);
  for (let i = 0; i < 3; i++) await tap(friend.locator('[data-pa-next]'), info);
  await tap(friend.locator('[data-pa-send]'), info);
  await expect(friend.locator('[data-pa-sent]')).toBeVisible();

  await tap(page.locator('[data-mt-refresh]'), info);
  await expect(page.locator('[data-pr-people]')).toContainText(T('anonymous'));
  await expect(page.locator('[data-pr-q="q1"] [data-pr-avg]')).toContainText('5');
});
