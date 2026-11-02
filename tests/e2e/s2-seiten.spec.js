// «Neuer Schwung» Stil S2 «Kacheln mit Tiefe» page by page (Noah 26.10.2026 «1a»): on Velos and Packen the cards have
// no frame, a soft shadow and 18 px corners; a page without the style (Planen) keeps the palette's cards. Fictional data.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const look = (loc) => loc.evaluate((el) => { const c = getComputedStyle(el); return { r: c.borderTopLeftRadius, b: c.borderTopColor, s: c.boxShadow }; });

test('S2 pages: Velos, Packen, Planen, Touren, Auswerten and Aktiv cards with depth', async ({ page, context }, info) => {
  await openHome(page, context, info);
  // the style is the card tokens on <main>, so every card of the page takes it (some pages have no card to look at)
  for (const h of ['./#/bikes', './#/pack?day', './#/week', './#/notes', './#/trips', './#/auswerten', './#/flow/sports']) {
    await page.goto(h);
    const main = page.locator('main');
    await expect(main, h).toBeVisible();
    const tok = await main.evaluate((el) => { const c = getComputedStyle(el); return { r: c.getPropertyValue('--radius-card').trim(), l: c.getPropertyValue('--card-line').trim() }; });
    expect(tok, h).toEqual({ r: '18px', l: 'transparent' });
  }
  const card = page.locator('main .card').first();
  await page.goto('./#/week');
  await expect(card).toBeVisible();
  const st = await look(card);
  expect(st.r).toBe('18px');
  expect(st.b).toBe('rgba(0, 0, 0, 0)');
  expect(st.s).not.toBe('none');
});
