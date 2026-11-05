// «Kuhglocken» (Geheimmenü H1, Noah 03.11.2026): five quick taps on PG can swing two cow bells at the logo.
// The sound only comes with the switch «Cow bells» (off by default). Fictional data (home0460-fixture), nothing leaves the preview.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { fixChance } from './logo-helpers.js';

const mark = (page, info) => (info.project.name === 'phone' ? page.locator('header.top .brand .mark') : page.locator('.logo .mark'));
const five = async (m) => {
  for (let i = 0; i < 5; i++) await m.click();
};
// counts the sounds the page starts (a stand-in for the browser's AudioContext)
const countSounds = (context) =>
  context.addInitScript(() => {
    window.__bells = 0;
    window.AudioContext = class {
      constructor() {
        window.__bells++;
        this.currentTime = 0;
        this.destination = {};
      }
      createOscillator() {
        return { type: '', frequency: {}, connect: (n) => n, start() {}, stop() {} };
      }
      createGain() {
        return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: (n) => n };
      }
      close() {}
    };
  });

test('without the switch the bells swing in silence and say where to switch the sound on', async ({ page, context }, info) => {
  await countSounds(context);
  await openHome(page, context, info);
  await fixChance(page, 'bells');
  await five(mark(page, info));
  const b = page.locator('[data-logo-bells]');
  await expect(b).toBeVisible();
  await expect(b).toHaveAttribute('data-logo-bells', 'quiet');
  await expect(b).toContainText('Kuhglocken');
  expect(await page.evaluate(() => window.__bells)).toBe(0);
  await expect(b).toHaveCount(0, { timeout: 8000 }); // gone by itself
});

test('with the switch on the bells ring once', async ({ page, context }, info) => {
  await countSounds(context);
  await context.addInitScript(() => localStorage.setItem('ops.kuhglocke', '1'));
  await context.addInitScript(() => localStorage.setItem('ops.quiet', '0')); // the night quiet would keep the sound away at night
  await openHome(page, context, info);
  await fixChance(page, 'bells');
  await five(mark(page, info));
  const b = page.locator('[data-logo-bells]');
  await expect(b).toBeVisible();
  await expect(b).toHaveAttribute('data-logo-bells', 'sound');
  await expect(b).not.toContainText('Kuhglocken');
  expect(await page.evaluate(() => window.__bells)).toBe(1);
});

test('with reduce motion the bells hang still inside the screen', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await fixChance(page, 'bells');
  await five(mark(page, info));
  const b = page.locator('[data-logo-bells]');
  await expect(b).toBeVisible();
  const box = await b.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width);
  expect(await b.locator('.bell').first().evaluate((el) => el.getAnimations().length)).toBe(0);
});
