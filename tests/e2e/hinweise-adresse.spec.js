// Durchklick Etappe 3 (E3-003): «Hinweise und News › Quelle hinzufügen» takes only real web addresses.
import { test, expect } from './clock.js';
import { start } from './gesamttest/lib.js';

test('Hinweise: ein Wort oder eine Adresse mit Leerzeichen ist keine Quelle', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto('./#/me/hinweise');
  await page.locator('[data-feed-add]').click();
  const before = await page.locator('[data-feed]').count();
  await page.locator('[data-feed-name]').fill('Meine Quelle');
  for (const bad of ['hallo', 'kein url']) {
    await page.locator('[data-feed-url]').fill(bad);
    await page.locator('[data-feed-save]').click();
    await expect(page.locator('[data-feed-form] [role=alert]')).toHaveText('Das ist keine Webadresse.');
    await expect(page.locator('[data-feed]')).toHaveCount(before);
  }
  await page.locator('[data-feed-url]').fill('https://news.example.org/feed.xml');
  await page.locator('[data-feed-save]').click();
  await expect(page.locator('[data-feed]')).toHaveCount(before + 1);
});
