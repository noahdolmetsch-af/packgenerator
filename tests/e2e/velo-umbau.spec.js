// «Velopflege: Seite umbauen» (Noah 21.11.2026 «1a 2a 3a 4a 5a», Schritt B), German UI:
// - on a bike's care page: At a glance, then the inspection as three cards (with points and tools), then the wear
//   and the parts, then «More» (shut): the ride ledger, the bike sheets, the bike card and the care rules sit in it;
// - «More» opens by itself while a ride of the bike is unclear, and says so.
// Fictional fixture (the ride-ledger set); nothing leaves the preview server; service workers blocked (config).
import { test, expect } from './clock.js';
import { q1File, NEU, GRAVEL } from './q1km-fixture.js';
import { openData, settle } from './settle.js';

async function start(page, context, info) {
  const file = q1File(info);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
}

const top = (loc) => loc.evaluate((e) => e.getBoundingClientRect().top + scrollY);

test('the inspection is three cards with their points and tools, in the new order', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto(`./#/bikes?tab=care&bike=${GRAVEL}&open=1`);
  const card = page.locator('[data-inspect-card]');
  await expect(card).toBeVisible();
  for (const level of ['quick', 'monthly', 'full']) {
    const lv = card.locator(`[data-inspect-level="${level}"]`);
    await expect(lv).toBeVisible();
    await expect(lv).toContainText(/\d+ Punkte?/);
    await expect(lv).toContainText(/Minuten?/);
    await expect(lv.locator(`[data-inspect-need="${level}"]`)).toContainText(/Du brauchst|Du brauchst kein besonderes Werkzeug/);
    await expect(lv.locator(`[data-inspect-start="${level}"]`)).toHaveAttribute('href', new RegExp(`level=${level}`));
  }
  // a bigger check has at least as many points as a smaller one
  const n = async (level) => Number((await card.locator(`[data-inspect-level="${level}"] .mins`).innerText()).match(/(\d+) Punkte?/)[1]);
  expect(await n('monthly')).toBeGreaterThanOrEqual(await n('quick'));
  expect(await n('full')).toBeGreaterThanOrEqual(await n('monthly'));
  // the order: at a glance, the inspection, the wear, the parts, «More»
  const ys = [await top(page.locator('[data-glance]')), await top(card), await top(page.locator('[data-wear-card]')), await top(page.locator('.ptable')), await top(page.locator('[data-care-more]'))];
  expect(ys).toEqual([...ys].sort((a, b) => a - b));
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(wide).toBeLessThanOrEqual(0);
});

test('the fold More is shut and holds the ride ledger, the sheets, the bike card and the care rules', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto(`./#/bikes?tab=care&bike=${GRAVEL}&open=1`);
  const more = page.locator('[data-care-more]');
  await expect(more).toBeVisible();
  await expect(more).not.toHaveAttribute('open', '');
  await expect(page.locator('section.kmbook')).toHaveCount(0);
  await more.locator('summary').click();
  await expect(page.locator('section.kmbook')).toBeVisible();
  await expect(page.locator('[data-velo-card]')).toBeVisible();
  await expect(page.locator('[data-care-plan]')).toBeVisible();
  await more.locator('summary').click();
  await expect(page.locator('section.kmbook')).toHaveCount(0);
});

test('the fold More opens by itself while a ride is unclear', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto(`./#/bikes?tab=care&bike=${NEU}&open=1`);
  const more = page.locator('[data-care-more]');
  await expect(more).toHaveAttribute('open', '');
  await expect(more.locator('summary')).toContainText('1 Fahrt unklar');
  await expect(page.locator('section.kmbook')).toBeVisible();
});
