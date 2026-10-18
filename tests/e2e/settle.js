// v0.80.0 «Tests stabil»: wait until the app has settled, instead of guessing a time.
// - <html data-ready="1">: the data tidy-up (at start-up, after an import or a demo start) has finished
//   (src/lib/settled.js). Before that, a reload or a next address can cut the tidy-up off, or the
//   tidy-up can still change what the test just did.
// - <html data-today="n">: Today has decided about its once-a-day auto-open (On the way on a ride day,
//   «Tour beendet» on the last evening) with n trips loaded (src/pages/Home.svelte). When n is the
//   number of stored trips, Today saw the data the test imported: it stays, or it has moved on.
// All labels come from the app's own texts, so the helpers work in English and in German.
import { expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';

/** A label in both languages: «Import backup» or «Backup importieren». */
const either = (en) => {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^(${esc(en)}${DE[en] ? `|${esc(DE[en])}` : ''})$`);
};

/** The data tidy-up has finished. */
export async function ready(page) {
  await expect(page.locator('html')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
}

/**
 * The tidy-up has finished, and (on Today) Today has decided about its auto-open with the stored data.
 * `sameTrips: false` only asks that Today has decided: for a page whose test wrote trips straight into
 * IndexedDB, which Today does not see until the next load.
 */
export async function settle(page, { sameTrips = true } = {}) {
  await ready(page);
  await expect
    .poll(
      () =>
        page.evaluate(
          (same) =>
            new Promise((ok) => {
              const onToday = () => /^#?\/?(\?.*)?$/.test(location.hash);
              if (!onToday()) return ok(true); // not on Today, or Today moved on
              const seen = document.documentElement.dataset.today;
              if (seen == null) return ok(false);
              if (!same) return ok(true);
              const r = indexedDB.open('pack-generator');
              r.onerror = () => ok(false);
              r.onsuccess = () => {
                const db = r.result;
                if (!db.objectStoreNames.contains('trips')) return (db.close(), ok(seen === '0'));
                const q = db.transaction('trips').objectStore('trips').count();
                q.onsuccess = () => {
                  db.close();
                  ok(!onToday() || document.documentElement.dataset.today === String(q.result));
                };
                q.onerror = () => (db.close(), ok(false));
              };
            }),
          sameTrips,
        ),
      { timeout: 30_000 },
    )
    .toBe(true);
}

/**
 * «Data and backup» open. v0.94.0 «Kachel-Wand» (Noah 5a): it lives under Me, no longer at the bottom
 * of Today. Design-Refresh P9 (I2): its own page #/me/data instead of a fold on Ich; the panel is the
 * page's .datapanel. The page is settled first (the tidy-up done, Today's auto-open decided).
 */
export async function openData(page) {
  if (/^#\/me\/data(\?|$)/.test(new URL(page.url()).hash)) await settle(page, { sameTrips: false });
  else {
    // a page that is still settling (an import, a demo start) finishes first; a fresh page needs no wait
    if (page.url().startsWith('http')) await settle(page, { sameTrips: false });
    await page.goto('./#/me/data');
    await settle(page, { sameTrips: false });
  }
  const panel = page.locator('.datapanel');
  await expect(panel).toBeVisible();
  await expect(panel.locator('input[type="file"]').first()).toBeAttached();
  return panel;
}

/**
 * «Replace all data». P3b rule 5a (Noah 15.10.2026 «5a»): on a device that has data the app asks a
 * second time («Wirklich alle Daten ersetzen?»); this answers «Ja, alles ersetzen». An empty device
 * imports at once.
 */
export async function replaceAll(panel) {
  await panel.getByRole('button', { name: either('Replace all data'), exact: true }).press('Enter');
  const sure = panel.getByRole('group', { name: either('Really replace all data?') });
  const done = panel.getByText(/importiert|Imported|nicht gelesen|could not/i).first();
  await expect(sure.or(done).first()).toBeVisible();
  if (await sure.isVisible()) await sure.getByRole('button', { name: either('Yes, replace all') }).click();
}

/**
 * Imports a backup (a file path or { name, mimeType, buffer }) through «Your data», «Replace all data»
 * or «Merge», then waits until the app has settled (the tidy-up done, Today's auto-open decided).
 */
export async function importAndSettle(page, file, { mode = 'replace' } = {}) {
  const panel = await openData(page);
  await panel.getByLabel(either('Import backup')).setInputFiles(file);
  if (mode === 'replace') await replaceAll(panel);
  else await panel.getByRole('button', { name: either('Merge') }).press('Enter');
  await settle(page);
  return panel;
}

/**
 * Closes the open dialog with Escape and waits until it has taken its history entry away
 * (backclose.js steps back a moment after): a next address before that would be undone.
 */
export async function closeDialog(page) {
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => history.state?.pgDialog ?? null)).toBeNull();
}

/**
 * Paket A (HT1–HT2 «1a», «Mehr Inhalt»): the card «Was hier steht» and the tip line sit on top of a page;
 * a person who has read them folds the card (×, it becomes one line) and hides today's tip (×).
 * For specs that check what comes first on a page after that; only for pages that have the card.
 */
export async function foldPageInfo(page) {
  // the card comes once the page's settings are read: wait for it (open, or folded to its line)
  await expect(page.locator('main section.hint, main [data-hint-line]').first()).toBeVisible();
  const fold = page.locator('main').getByRole('button', { name: either('Fold the explanation') });
  if (await fold.count()) {
    await fold.first().click();
    await expect(page.locator('main [data-hint-line]')).toBeVisible();
  }
  const hide = page.locator('main').getByRole('button', { name: either('Hide the tip for today') });
  if (await hide.count()) {
    await hide.first().click();
    await expect(hide).toHaveCount(0);
  }
}
