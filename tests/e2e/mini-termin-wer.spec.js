// Mini-Tools «Termin finden», who answered (Noah 1.11.2026 «1a»): the maker types the names of the people asked;
// a friend answers; the card shows who answered and who is missing; remove with Undo. Fictional data only.
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

test('Find a date: who answered and who is missing', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await miniServer(context);
  await page.goto('./#/me/mini/neu');
  await page.locator('[data-mt-title]').fill('test_data_gtp_ Wochenende');
  for (const d of ['2026-10-17', '2026-10-18']) await tap(page.locator(`[data-mt-day="${d}"]`), info);
  await tap(page.locator('[data-mt-make]'), info);
  const url = await page.locator('[data-mt-link]').inputValue();

  // nobody listed yet: the card asks for names
  await expect(page.locator('[data-dw] h2')).toHaveText(T('Who did you ask?'));
  await page.locator('[data-dw-input]').fill('test_data_gtp_ Freundin, test_data_gtp_ Anna');
  await tap(page.locator('[data-dw-add]'), info);
  await expect(page.locator('[data-dw] h2')).toHaveText(T('{n} of {m} have answered', { n: 0, m: 2 }));
  await expect(page.locator('[data-dw-state="missing"]')).toHaveCount(2);
  await expect(page.locator('[data-dw-remind]')).toBeVisible();
  await noSideways(page, 'who card');

  // a friend answers
  const friend = await context.newPage();
  await friend.clock.setFixedTime(new Date('2026-10-09T10:00:00+02:00'));
  await friend.goto(url);
  await friend.locator('[data-mm-name]').fill('test_data_gtp_ freundin');
  await tap(friend.locator('[data-mm-opt="2026-10-17"] [data-mm-pick="y"]'), info);
  await tap(friend.locator('[data-mm-send]'), info);
  await expect(friend.locator('[data-mm-sent]')).toBeVisible();

  await tap(page.locator('[data-mt-refresh]'), info);
  await expect(page.locator('[data-dw] h2')).toHaveText(T('{n} of {m} have answered', { n: 1, m: 2 }));
  await expect(page.locator('[data-dw-state="yes"]')).toHaveCount(1);
  await expect(page.locator('[data-dw-state="missing"]')).toHaveCount(1);
  await page.screenshot({ path: info.outputPath('termin-wer.png'), fullPage: true });

  // remove a name, with Undo
  await tap(page.getByRole('button', { name: T('Remove {name}', { name: 'test_data_gtp_ Anna' }) }), info);
  await expect(page.locator('[data-dw-state="missing"]')).toHaveCount(0);
  await tap(page.getByRole('button', { name: T('Undo') }), info);
  await expect(page.locator('[data-dw-state="missing"]')).toHaveCount(1);
});

test('Find a date: type in, change and delete an answer by hand', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await miniServer(context);
  await page.goto('./#/me/mini/neu');
  await page.locator('[data-mt-title]').fill('test_data_gtp_ Ausflug');
  for (const d of ['2026-10-17', '2026-10-18']) await tap(page.locator(`[data-mt-day="${d}"]`), info);
  await tap(page.locator('[data-mt-make]'), info);
  await page.locator('[data-dw-input]').fill('test_data_gtp_ Berta');
  await tap(page.locator('[data-dw-add]'), info);

  // type in an answer: needs a name and one pick
  await tap(page.locator('[data-mt-typein]'), info);
  await tap(page.locator('[data-de-save]'), info);
  await expect(page.locator('[data-de-err]')).toHaveText(T('Write a name first.'));
  await tap(page.locator('[data-de-pickname="test_data_gtp_ Berta"]'), info);
  await tap(page.locator('[data-de-save]'), info);
  await expect(page.locator('[data-de-err]')).toHaveText(T('Pick at least one answer.'));
  await tap(page.locator('[data-de-pick="2026-10-18:y"]'), info);
  await noSideways(page, 'editor');
  await page.screenshot({ path: info.outputPath('termin-eintragen.png'), fullPage: true });
  await tap(page.locator('[data-de-save]'), info);
  await expect(page.locator('[data-mt-row]')).toHaveCount(1);
  await expect(page.locator('[data-dw] h2')).toHaveText(T('{n} of {m} have answered', { n: 1, m: 1 }));
  await expect(page.locator('[data-mt-best] h2')).toContainText('18.10');

  // change it
  await tap(page.locator('[data-mt-edit]'), info);
  await tap(page.locator('[data-de-pick="2026-10-17:y"]'), info);
  await tap(page.locator('[data-de-pick="2026-10-18:n"]'), info);
  await tap(page.locator('[data-de-save]'), info);
  await expect(page.locator('[data-mt-best] h2')).toContainText('17.10');

  // delete with Undo
  await tap(page.locator('[data-mt-edit]'), info);
  await tap(page.locator('[data-de-delete]'), info);
  await tap(page.getByRole('dialog').getByRole('button', { name: T('Delete') }), info);
  await expect(page.locator('[data-mt-row]')).toHaveCount(0);
  await tap(page.getByRole('button', { name: T('Undo') }), info);
  await expect(page.locator('[data-mt-row]')).toHaveCount(1);
});

test('Find a date: fix the date, send it to the group, take it back', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await miniServer(context);
  await page.goto('./#/me/mini/neu');
  await page.locator('[data-mt-title]').fill('test_data_gtp_ Festlegen');
  for (const d of ['2026-10-17', '2026-10-18']) await tap(page.locator(`[data-mt-day="${d}"]`), info);
  await tap(page.locator('[data-mt-make]'), info);
  await expect(page.locator('[data-mt-fix]')).toHaveCount(0);
  await tap(page.locator('[data-mt-mine="2026-10-18"]'), info);
  await tap(page.locator('[data-mt-fix]'), info);
  await tap(page.getByRole('dialog').getByRole('button', { name: T('Fix this date') }), info);
  await expect(page.locator('[data-mt-fixed]')).toBeVisible();
  await expect(page.locator('[data-mt-fixed] h2')).toContainText('18.10');
  await expect(page.locator('[data-mt-share]')).toHaveCount(0);
  await expect(page.locator('[data-mt-fixed-wa]')).toHaveAttribute('href', /wa\.me\/\?text=.*Festlegen/);
  await expect(page.locator('[data-mt-fix]')).toHaveCount(0);
  await noSideways(page, 'fixed');
  await page.screenshot({ path: info.outputPath('termin-festlegen.png'), fullPage: true });
  await tap(page.locator('[data-mt-unfix]'), info);
  await expect(page.locator('[data-mt-fixed]')).toHaveCount(0);
});
