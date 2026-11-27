// «Testrunde» (Noah 27.11.2026 «1b 2a 3b 4b 5a»): after an update the card on Today shows the two newest news with their PR, the first
// test step and the answers «Klappt» / «Klappt nicht»; the answer is kept on the device and as an entry of the log; Me › What is new
// lists every update with PR and test steps and filters by answer, and the releases nobody sees say «Nichts zu testen».
// Fictional data only (gesamttest fixture).
import { test, expect } from './clock.js';
import { start, tr } from './gesamttest/lib.js';
import { settle } from './settle.js';
import { NEWS } from '../../src/lib/news/index.gen.js';
import { WHATS_NEW, RELEASES_OHNE } from '../../src/lib/whatsnew-full.js';

const T = tr('de');
const FROM = NEWS[Math.min(4, NEWS.length - 1)].version; // the 4 newest updates are «new»
const CURRENT = NEWS[0].version;

async function seed(page, { improve = false } = {}) {
  await page.goto('./#/');
  await page.evaluate(
    ([from, current, imp]) => {
      localStorage.setItem('wasneu.update', JSON.stringify({ v: current, from, at: '2026-11-23' }));
      localStorage.setItem('whatsnew.seen', current);
      localStorage.removeItem('wasneu.results');
      if (imp) localStorage.setItem('ops.improve', '1');
    },
    [FROM, CURRENT, improve],
  );
  await page.reload();
  await page.locator('main').first().waitFor({ timeout: 10_000 });
  await settle(page);
  const skip = page.getByRole('button', { name: T('Skip|intro') });
  const shown = await skip.first().waitFor({ state: 'visible', timeout: 4000 }).then(() => true, () => false);
  if (shown) await skip.first().click();
}
const results = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('wasneu.results') ?? 'null'));

test('the card on Today shows PR and first step, Klappt keeps the answer and the log, Undo takes it back', async ({ page, context }, info) => {
  await start(page, context, info);
  await seed(page);
  const banner = page.locator('[data-news-banner]');
  await expect(banner).toBeVisible({ timeout: 10_000 });
  await expect(banner.getByRole('heading', { name: T('New since your last visit') })).toBeVisible();
  await expect(banner.locator('[data-news-item]')).toHaveCount(2);
  const first = banner.locator('[data-news-item]').first();
  await expect(first.locator('[data-test-row]')).toContainText(T('How to test it'));
  await expect(first.locator('[data-news-pr]')).toContainText(T('Version {v}', { v: CURRENT.replace(/\.0$/, '') }));
  await first.locator('[data-test-works]').click();
  await expect.poll(() => results(page)).toMatchObject({ [CURRENT]: { r: 'ok' } });
  await expect(first.locator('[data-test-works]')).toHaveAttribute('aria-pressed', 'true');
  // the log keeps it, with the kind «Gut so»
  await page.goto('./#/me/logbuch');
  const entry = page.locator('[data-lb-entry][data-art="gutso"]').first();
  await expect(entry).toContainText(T('Tested, works: {title}', { title: T(NEWS[0].title) }).slice(0, 14));
  // Undo takes the answer back
  await page.goBack();
  await settle(page);
  await expect(banner).toBeVisible({ timeout: 10_000 });
  await first.locator('[data-test-works]').click();
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect.poll(() => results(page)).toBeNull();
});

test('Klappt nicht opens the window of Verbessern with the kind Fehler and the release, and saves the answer', async ({ page, context }, info) => {
  await start(page, context, info);
  await seed(page, { improve: true });
  const banner = page.locator('[data-news-banner]');
  await expect(banner).toBeVisible({ timeout: 10_000 });
  await banner.locator('[data-test-fails]').first().click();
  const sheet = page.locator('[data-logbuch-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('[data-art="fehler"]')).toHaveAttribute('aria-checked', 'true');
  await expect(sheet).toContainText(`Release ${CURRENT}`);
  await sheet.locator('[data-lb-text]').fill('Der Stern bleibt grau.');
  await sheet.locator('[data-lb-save]').click();
  await expect(sheet).toBeHidden();
  await expect.poll(() => results(page)).toMatchObject({ [CURRENT]: { r: 'fail' } });
  await expect(banner.locator('[data-test-fails]').first()).toHaveAttribute('aria-pressed', 'true');
  await page.goto('./#/me/logbuch');
  await expect(page.locator('[data-lb-entry][data-art="fehler"]').first()).toContainText('Der Stern bleibt grau.');
  await expect(page.locator('[data-lb-entry][data-art="fehler"]').first()).toContainText(CURRENT);
});

test('plus N more opens the window by update with every step, closing it closes the card', async ({ page, context }, info) => {
  await start(page, context, info);
  await seed(page);
  const banner = page.locator('[data-news-banner]');
  await expect(banner).toBeVisible({ timeout: 10_000 });
  await banner.locator('[data-news-more]').click();
  const sheet = page.locator('[data-neu-seit-sheet]');
  await expect(sheet.locator('[data-nss-release]')).toHaveCount(4, { timeout: 10_000 }); // every news since the last visit
  await expect(sheet.locator('[data-nss-release]').first().locator('[data-test-works]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(banner).toHaveCount(0);
});

test('Me, Was ist neu: PR in every row, the chips by answer, the search by PR number, the hidden releases say nothing to test', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto('./#/me/news');
  await page.locator('.wn-vers').waitFor({ timeout: 15_000 });
  const withPr = WHATS_NEW.slice(1).find((e) => e.pr || false);
  if (withPr) {
    await page.locator('.wn-vers input[type="search"]').fill(String(withPr.pr));
    const row = page.locator(`[data-row="${withPr.version}"]`);
    await expect(row).toBeVisible();
    await expect(row.locator('[data-pr]')).toContainText(String(withPr.pr));
    await row.click();
    await expect(page.locator('.wn-vopen [data-test-row]').first()).toBeVisible();
    await page.locator('.wn-vers input[type="search"]').fill('');
  }
  // «Not tested yet» holds the updates with steps; with no answer yet «Works» and «Does not work» chips are not there
  await page.locator('[data-only="open"]').click();
  await expect(page.locator('[data-only="open"] .num')).not.toHaveText('0');
  await expect(page.locator('[data-only="ok"]')).toHaveCount(0);
  // the releases nobody sees
  if (RELEASES_OHNE.length) {
    await page.locator('[data-only="hidden"]').click();
    const row = page.locator('.wn-vr').first();
    await expect(row).toBeVisible();
    await row.click();
    await expect(page.locator('.wn-vopen [data-test-none]').first()).toContainText(T('Nothing to test'));
  }
});
