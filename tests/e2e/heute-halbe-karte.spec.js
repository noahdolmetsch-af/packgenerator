// Frontend-Durchklick Etappe 1 (Noah 05.11.2026): on the phone a half-width card of Heute («Heute-Check», «VO₂max»)
// that had no partner in its row sat alone with an empty right half. The row-filling rule (sections.js fillers) only
// worked on a computer (8 columns); now the phone (4 columns) has it too. Fictional data only.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test('phone: no half-width card of Heute sits alone in its row', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'the 4-column wall is the phone');
  await openHome(page, context, info);
  await page.goto('./#/');
  await page.locator('.wall').waitFor();
  const alone = await page.locator('.wall').evaluate((wall) => {
    const w = wall.getBoundingClientRect().width;
    const tiles = [...wall.querySelectorAll('[data-tile]')].map((e) => ({ id: e.dataset.tile, size: e.dataset.size, b: e.getBoundingClientRect() })).filter((x) => x.b.width > 0);
    return tiles.filter((x) => x.size === 'w' && x.b.width < w * 0.6 && !tiles.some((y) => y.id !== x.id && Math.abs(y.b.top - x.b.top) < 3)).map((x) => x.id);
  });
  expect(alone, 'a half-width card alone in its row').toEqual([]);
});
