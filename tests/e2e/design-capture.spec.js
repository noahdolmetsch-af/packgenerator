import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
const fixture = fileURLToPath(new URL('./preparation-fixture.json', import.meta.url));
// Visual evidence for the accepted designs; desktop matches the source dimensions exactly.
test('capture preparation designs', async ({ page, context }, info) => {
  await page.clock.setFixedTime(new Date('2026-10-07T12:00:00Z'));
  await context.addInitScript(() => localStorage.setItem('lang','de'));
  if (info.project.name === 'desktop') await page.setViewportSize({ width:1487, height:1058 });
  await page.goto('./');
  await page.getByLabel('Backup importieren').setInputFiles(fixture);
  await page.getByRole('button', {name:'Alle Daten ersetzen'}).press('Enter');
  await expect(page.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  await page.goto('./#/pack');
  await expect(page.getByRole('heading', {name:'Deine Packliste'})).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  if (info.project.name === 'desktop') {
    const button = await page.getByRole('button',{name:'Packkontrolle starten'}).boundingBox();
    expect(button.y + button.height).toBeLessThanOrEqual(1058);
  }
  await page.screenshot({path:`qa/pack-${info.project.name}.png`,fullPage:true});
  // Remove the jacket and reduce the food amount through the real controls to reopen decisions.
  await page.getByRole('button',{name:'Aktionen für Regenjacke Haglöfs'}).click();
  await page.getByRole('button',{name:'Rausnehmen',exact:true}).click();
  await page.getByRole('button',{name:'Carb-Pulver: eins weniger'}).click();
  await page.getByRole('button',{name:/Wettervorschläge prüfen/}).click();
  await expect(page.getByRole('heading',{name:'Noch zu entscheiden'})).toBeVisible();
  await page.screenshot({path:`qa/review-${info.project.name}.png`,fullPage:true});
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
});
