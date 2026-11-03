// Mini-Tools «Termin finden» (Noah 28.10.2026 «1b 2a 3a»): Ich › Mini-Tools › Termin finden makes a link; a friend
// opens it in a second tab (no app data), answers per day; the maker reads the answers, sees the best day and
// his own row; rename, end, delete with Undo. The server (/api/sync?action=mini) is the real handler over a small
// fake Redis; it keeps only sealed text. Fictional data only.
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

test('Find a date: make a link, a friend answers in the browser, the best day is on top', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  const redis = await miniServer(context);

  // Ich › Mini-Tools
  await page.goto('./#/me');
  await tap(page.locator('[data-row="minitools"]'), info);
  await expect(page.locator('[data-minitools]')).toBeVisible();
  await expect(page.locator('[data-mt-empty]')).toBeVisible();
  await noSideways(page, 'mini tools');
  await tap(page.locator('[data-mt-tool="date"]'), info);

  // a title and three days; without them it says what is missing
  await tap(page.locator('[data-mt-make]'), info);
  await expect(page.locator('[data-mt-err]')).toHaveText(T('Write a title first, so people know what it is about.'));
  await page.locator('[data-mt-title]').fill('test_data_gtp_ Wochenende');
  await tap(page.locator('[data-mt-make]'), info);
  await expect(page.locator('[data-mt-err]')).toHaveText(T('Pick at least {n} days.', { n: 2 }));
  for (const d of ['2026-10-17', '2026-10-18', '2026-10-24']) await tap(page.locator(`[data-mt-day="${d}"]`), info);
  await expect(page.locator('[data-mt-day="2026-10-17"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-mt-time="2026-10-24"]').fill('09:00');
  await noSideways(page, 'new date question');
  await page.screenshot({ path: info.outputPath('termin-neu.png'), fullPage: true });
  await tap(page.locator('[data-mt-make]'), info);

  // the question with its link
  const linkBox = page.locator('[data-mt-link]');
  await expect(linkBox).toHaveValue(/#\/mitmachen\/[A-Za-z0-9_-]{22}\/[A-Za-z0-9_-]{43}$/);
  const url = await linkBox.inputValue();
  await expect(page.locator('[data-mt-best] h2')).toHaveText(T('No answers yet'));
  // the server keeps only sealed text
  const kept = () => JSON.stringify([...redis.kv].map(([k, v]) => [k, v instanceof Map ? [...v] : v]));
  expect(kept()).not.toMatch(/Wochenende|2026-10-17/);

  // a friend: the link in a new tab, without the app's pages around it
  const friend = await context.newPage();
  await friend.clock.setFixedTime(new Date('2026-10-09T10:00:00+02:00'));
  await friend.goto(url);
  await expect(friend.locator('[data-mitmachen]')).toBeVisible();
  await expect(friend.locator('nav.tabbar, [data-nav]')).toHaveCount(0);
  await expect(friend.getByRole('heading', { level: 1 })).toHaveText('test_data_gtp_ Wochenende');
  await tap(friend.locator('[data-mm-send]'), info);
  await expect(friend.locator('[data-mm-err]')).toHaveText(T('Write your name first, so they know who answered.'));
  await friend.locator('[data-mm-name]').fill('test_data_gtp_ Freundin');
  await tap(friend.locator('[data-mm-opt="2026-10-17"] [data-mm-pick="y"]'), info);
  await tap(friend.locator('[data-mm-opt="2026-10-18"] [data-mm-pick="m"]'), info);
  await tap(friend.locator('[data-mm-opt="2026-10-24T09:00"] [data-mm-pick="n"]'), info);
  await expect(friend.locator('[data-mm-opt="2026-10-17"] [data-mm-pick="y"]')).toHaveAttribute('aria-checked', 'true');
  await noSideways(friend, 'friend page');
  await friend.screenshot({ path: info.outputPath('termin-freund.png'), fullPage: true });
  await tap(friend.locator('[data-mm-send]'), info);
  await expect(friend.locator('[data-mm-sent]')).toBeVisible();
  expect(kept()).not.toMatch(/Freundin/);

  // the maker reads the answer
  await tap(page.locator('[data-mt-refresh]'), info);
  await expect(page.locator('[data-mt-row]')).toHaveCount(1);
  await expect(page.locator('[data-mt-row]')).toContainText('test_data_gtp_ Freundin');
  await expect(page.locator('[data-mt-best] h2')).toContainText(T('Best day: {day}', { day: '' }).trim());
  await expect(page.locator('[data-mt-best] h2')).toContainText('17.10');
  // my own row: «works» on the 18th makes it the best day (1 + ½ against 1)
  await tap(page.locator('[data-mt-mine="2026-10-18"]'), info);
  await expect(page.locator('[data-mt-best] h2')).toContainText('18.10');
  await expect(page.locator('[data-mt-trip]')).toBeVisible();
  await noSideways(page, 'result');
  await page.screenshot({ path: info.outputPath('termin-ergebnis.png'), fullPage: true });

  // the friend changes the answer: still one answer
  await friend.reload();
  await expect(friend.locator('[data-mm-sent]')).toHaveText(T('You already answered. You can change your answer and send it again.'));
  await tap(friend.locator('[data-mm-opt="2026-10-18"] [data-mm-pick="y"]'), info);
  await tap(friend.locator('[data-mm-send]'), info);
  await expect(friend.locator('[data-mm-sent]')).not.toHaveText(T('You already answered. You can change your answer and send it again.'));
  await tap(page.locator('[data-mt-refresh]'), info);
  await expect(page.locator('[data-mt-row]')).toHaveCount(1);
  await expect(page.locator('[data-mt-row] td.p-y')).toHaveCount(2);

  // rename
  await tap(page.locator('[data-mt-rename]'), info);
  const field = page.getByRole('dialog').getByRole('textbox');
  await field.fill('test_data_gtp_ Jura');
  await field.press('Enter');
  await expect(page.locator('[data-page-title], h1').first()).toContainText('test_data_gtp_ Jura');

  // end: the link says it has ended, the result stays
  await tap(page.locator('[data-mt-stop]'), info);
  await tap(page.getByRole('dialog').getByRole('button', { name: T('End now') }), info);
  await expect(page.locator('[data-mt-share]')).toHaveCount(0);
  await expect(page.locator('[data-mt-row]')).toHaveCount(1);
  await friend.reload();
  await expect(friend.getByText(T('This question has ended. The answers are deleted.'))).toBeVisible();

  // delete with Undo
  await tap(page.locator('[data-mt-delete]'), info);
  await tap(page.getByRole('dialog').getByRole('button', { name: T('Delete') }), info);
  await expect(page.locator('[data-mt-empty]')).toBeVisible();
  await tap(page.getByRole('button', { name: T('Undo') }), info);
  await expect(page.locator('[data-mt-item]')).toHaveCount(1);
});
