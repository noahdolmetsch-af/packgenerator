// «Hängt zusammen mit» on Weather, Neuland and Debrief (idea D4, Noah 02.11.2026 «3b»): the row «Belongs to …» shows there too.
import { test, expect } from './clock.js';
import { ready } from './settle.js';

for (const [hash, moment] of [['wetter', 'planen'], ['neuland', 'lust'], ['debrief', 'zurueck']]) {
  test(`#/${hash} shows the «Belongs to» row`, async ({ page, context }) => {
    await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
    await page.goto(`/#/${hash}`);
    await ready(page);
    await expect(page.locator(`[data-gehoert="${moment}"]`).first()).toBeVisible();
  });
}
