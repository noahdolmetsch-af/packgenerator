// 27.10.2026 (thread «Weg von gebaut zu online»): browser tests never reach the real server packgen
// (NO_REAL_SERVER in playwright.config.js). Its free daily cap belongs to the real app, not to the tests.
import { test, expect } from './clock.js';

const ask = (page, url) =>
  page.evaluate(async (u) => {
    try {
      const r = await fetch(u);
      return `answer ${r.status}`;
    } catch {
      return 'no network';
    }
  }, url);

test('a request to the real server gets «no network»; a test route still answers', async ({ page }) => {
  await page.goto('./');
  expect(await ask(page, 'https://packgen-three.vercel.app/api/health')).toBe('no network');
  await page.route(/packgen-three\.vercel\.app\/api\/health/, (route) => route.fulfill({ status: 200, json: { ok: true } }));
  expect(await ask(page, 'https://packgen-three.vercel.app/api/health')).toBe('answer 200');
});
