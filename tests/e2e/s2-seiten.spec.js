// «Neuer Schwung» Stil S2 «Kacheln mit Tiefe» page by page (Noah 26.10.2026 «1a»): on Velos and Packen the cards have
// no frame, a soft shadow and 18 px corners; a page without the style (Planen) keeps the palette's cards. Fictional data.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const look = (loc) => loc.evaluate((el) => { const c = getComputedStyle(el); return { r: c.borderTopLeftRadius, b: c.borderTopColor, s: c.boxShadow }; });

test('S2 pages: Velos and Packen cards with depth, Planen as before', async ({ page, context }, info) => {
  await openHome(page, context, info);
  for (const h of ['./#/bikes', './#/pack?day']) {
    await page.goto(h);
    const card = page.locator('main .card').first();
    await expect(card).toBeVisible();
    const st = await look(card);
    expect(st.r, h).toBe('18px');
    expect(st.b, h).toBe('rgba(0, 0, 0, 0)');
    expect(st.s, h).not.toBe('none');
  }
  await page.goto('./#/plan');
  await expect(page.locator('main[data-s2-page]')).not.toHaveAttribute('data-s2-page', /^(pack|bikes)$/);
});
