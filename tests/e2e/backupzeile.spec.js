// «Jetzt dran» (Noah 05.11.2026 «2a»): the row «Backup-Ordner wartet auf dein OK» is one short line with its button;
// the long explanation (one tap, the Chrome tip) waits behind «Mehr». German UI, phone and desktop, fictional data.
// The folder is faked: a plain record in the database and a browser that says «prompt» (no real folder is touched).
// SHOTS=<folder> saves the screenshots.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import { openHome, homeFixture } from './home0460-fixture.js';

test('BZ1: the backup folder row is short, the tip is behind More', async ({ page, context }, info) => {
  await context.addInitScript(() => {
    window.showDirectoryPicker = async () => {};
    Object.defineProperty(Object.prototype, 'queryPermission', { value: async () => 'prompt', enumerable: false, configurable: true });
  });
  const T = await openHome(page, context, info, { data: homeFixture() });
  await page.evaluate(
    () =>
      new Promise((ok, no) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => no(r.error);
        r.onsuccess = () => {
          const tx = r.result.transaction('meta', 'readwrite');
          tx.objectStore('meta').put({ key: 'backupFolder', handle: { name: 'packgen' }, lastWrite: null });
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => no(tx.error);
        };
      }),
  );
  await page.reload();
  const today = page.locator('[data-section="today"]');
  await expect(today).toBeVisible();
  const more = today.getByRole('button', { name: /^Alle \d+ zeigen$/ });
  if (await more.isVisible()) await more.click();
  const row = today.locator('li[data-row="folderok"]');
  await expect(row).toBeVisible();
  const shot = async (name) => {
    if (!process.env.SHOTS) return;
    mkdirSync(process.env.SHOTS, { recursive: true });
    await today.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
  };
  await shot('BZ1-zu');
  // the short line and the button; the tip is not there yet
  await expect(row).toContainText('Der Backup-Ordner «packgen» wartet auf dein OK.');
  await expect(row).not.toContainText('Bei jedem Besuch erlauben');
  await expect(row.getByRole('button', { name: T('Allow backup') })).toBeVisible();
  // «Mehr» opens the explanation, a second tap closes it
  const btn = row.getByRole('button', { name: T('More'), exact: true });
  await btn.click();
  await expect(row.locator('[data-row-hint]')).toContainText('Bei jedem Besuch erlauben');
  await expect(row.locator('[data-row-hint]')).toContainText('Ein Tipp, der Ordner bleibt.');
  await shot('BZ1-offen');
  await btn.click();
  await expect(row.locator('[data-row-hint]')).toHaveCount(0);
});
