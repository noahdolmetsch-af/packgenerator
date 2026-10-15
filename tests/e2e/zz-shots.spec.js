// temporary: screenshots of Paket 3 for Noah (fictional Gesamttest data), not committed
import { test } from '@playwright/test';
import { start, view, tr } from './gesamttest/lib.js';
const T = tr('de');
const OUT = '/mnt/project-files/notes/paket-3/bilder';
test.use({ timezoneId: 'Europe/Zurich', serviceWorkers: 'block', colorScheme: 'light' });
test('shots', async ({ page, context }, info) => {
  test.setTimeout(600_000);
  const w = info.project.name === 'phone' ? 390 : 1440;
  await start(page, context, info);
  const done = [];
  const shot = async (name, fn, full = false) => {
    try {
      await fn();
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${OUT}/${name}-${w}.png`, fullPage: full });
      done.push(name);
    } catch (e) {
      console.log('SKIP', name, e.message.split('\n')[0]);
    }
  };
  await shot('ht1-velopflege-hinweis', async () => { await view(page, '#/bikes?tab=care'); await page.locator('[data-hint="care"]').scrollIntoViewIfNeeded(); });
  await shot('ht1-velopflege-das-kann-die-app', async () => { await page.locator('[data-hint-can]').click(); await page.locator('[data-hint-can]').scrollIntoViewIfNeeded(); });
  await shot('ht2-material-hinweis', async () => { await view(page, '#/gear'); });
  await shot('ht2-material-nach-x', async () => { await page.locator('[data-hint-hide]').click(); await page.locator('[data-hint-show="gear"]').waitFor(); });
  await page.locator('[data-hint-show="gear"]').click().catch(() => {});
  await shot('sl-material-liste', async () => { await view(page, '#/gear'); await page.locator('.jump-ph, .jump-dt').first().scrollIntoViewIfNeeded(); });
  await shot('ws3-touren-schnell-starten', async () => { await view(page, '#/trips'); await page.locator('[data-quick]').scrollIntoViewIfNeeded(); });
  await shot('ws3-neue-tour-wie-letzte-tour', async () => {
    await page.locator('[data-quick]').getByRole('button', { name: T('Like the last trip') }).click();
    const dlg = page.locator('dialog.trip-dlg[open]');
    await dlg.waitFor();
    await dlg.locator('.tplhead').click();
    await dlg.locator('[data-start="last"]').scrollIntoViewIfNeeded();
  });
  await shot('vs-ws5-velo-kopf', async () => { await view(page, '#/bikes?tab=setup'); });
  await shot('vs-standard-velo-reihenfolge', async () => { await page.locator('.sv-line').getByRole('button', { name: T('Change') }).click(); await page.locator('dialog.bo-dlg').waitFor(); });
  await shot('ws6-erholung', async () => { await view(page, '#/flow'); const f = page.locator('.ringc details[data-rest]'); await f.locator('summary').click(); await f.scrollIntoViewIfNeeded(); });
  await shot('fix-kachel-fahrten-buch', async () => { await view(page, '#/flow'); const k = page.locator('[data-sk-tile="kmbook"], a:has-text("Fahrten-Buch")').first(); await k.scrollIntoViewIfNeeded(); });
  await shot('fix-kachelblatt', async () => {
    await view(page, '#/flow');
    const b = page.getByRole('button', { name: /Kacheln anpassen/ }).first();
    await b.scrollIntoViewIfNeeded(); await b.click();
    await page.locator('dialog[data-sk-sheet][open]').waitFor();
  });
  await shot('heute-tourkarte', async () => { await view(page, '#/'); await page.locator('[data-countdown]').first().scrollIntoViewIfNeeded(); });
  await shot('re-regen-grenze', async () => { await view(page, '#/blocks'); const r = page.getByText(/Regen/).first(); await r.click(); await page.locator('[data-rain-everywhere]').scrollIntoViewIfNeeded(); });
  await shot('ws2-neu-schnellstart', async () => { await view(page, '#/'); await page.getByRole('button', { name: 'Neu' }).first().click(); await page.locator('dialog.new[open]').waitFor(); });
  console.log('DONE', w, done.join(','));
});
