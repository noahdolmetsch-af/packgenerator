// «Wenn ein Dienst ausfällt» (Noah 02.11.2026): the weather service does not answer; the app says one calm sentence
// and goes on. The service is cut off with a route. Fictional data only. SHOTS=<folder> saves pictures.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en;

test('the weather service is down: one calm sentence', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/');
  await ready(page);
  // Today asks for the home place with an inline search; the service does not answer
  await page.getByText(T('Set your home place for the weather')).first().click();
  await page.getByLabel(T('Your home place')).first().fill('Bern');
  await page.locator('form.find').getByRole('button', { name: T('Find') }).click();
  const msg = page.getByRole('alert').filter({ hasText: T('Weather') });
  await expect(msg).toContainText(T('«{service}» cannot be reached right now. You can keep working.').replace('{service}', T('Weather')));
  if (process.env.SHOTS) {
    const f = await page.locator('form.find').boundingBox();
    const m = await msg.first().boundingBox();
    const y = Math.max(0, f.y - 70);
    await page.screenshot({ path: `${process.env.SHOTS}/ausfall-wetter-${info.project.name === 'phone' ? 390 : 1440}.png`, clip: { x: 0, y, width: page.viewportSize().width, height: m.y + m.height + 40 - y } });
  }
  // the rest of the app goes on
  await expect(page.locator('div.home')).toBeVisible();
  expect(errors).toEqual([]);
});
