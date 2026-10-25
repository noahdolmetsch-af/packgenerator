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
  await quietWindows(page);
}

/** Today in Zurich, by the real clock of the test run (YYYY-MM-DD). */
const zurichDay = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });

/**
 * The windows of Heute (src/lib/home/windows.js: the evening before a trip or a flight from 17:00, Sunday's
 * Wochenrückblick from 18:00) open as a modal over the page. A spec run in the evening would find its buttons covered,
 * so from 17:00 on the real day they count as done (and an open one closes). Specs that test the windows set the page
 * clock to their own day (fenster, wochenrueckblick, lernen), so they are left alone.
 */
async function quietWindows(page) {
  await page.evaluate(
    (real) =>
      new Promise((ok) => {
        const now = new Date();
        const day = now.toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
        const hour = Number(now.toLocaleString('en-GB', { timeZone: 'Europe/Zurich', hour: '2-digit', hour12: false }));
        if (day !== real || hour < 17) return ok(false);
        let r;
        try {
          r = indexedDB.open('pack-generator');
        } catch {
          return ok(false);
        }
        r.onerror = () => ok(false);
        r.onsuccess = () => {
          const db = r.result;
          if (!db.objectStoreNames.contains('settings')) return (db.close(), ok(false));
          const tx = db.transaction('settings', 'readwrite');
          const store = tx.objectStore('settings');
          const get = store.get('homeWindows');
          get.onsuccess = () => {
            const value = { ...(get.result?.value ?? {}) };
            for (const id of ['eve', 'week', 'flight']) value[id] = { ...(value[id] ?? {}), done: day };
            store.put({ key: 'homeWindows', value });
          };
          tx.oncomplete = () => {
            db.close();
            document.querySelector('dialog[data-window][open]')?.close();
            ok(true);
          };
          tx.onerror = () => (db.close(), ok(false));
        };
      }),
    zurichDay(),
  );
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
  // «Alles finden 2» (Noah 22.10.2026 «3a»): the card «Was hier steht» is behind the «?» at the top now; on the page
  // only the tip line can still stand before the content. It comes once the page's settings are read.
  await ready(page);
  const hide = page.locator('main').getByRole('button', { name: either('Hide the tip for today') });
  await hide.first().waitFor({ timeout: 1500 }).catch(() => {});
  if (await hide.count()) {
    await hide.first().click();
    await expect(hide).toHaveCount(0);
  }
}

/**
 * «Alles finden 2» (Noah 22.10.2026 «3a»): the help of a page sits behind the «?» at the top (phone bar or
 * sidebar). Opens it and returns the window; the page's card, «Typical here» and «What the app can do here» are in it.
 */
export async function openHelp(page) {
  await page.locator('[data-help-open]').filter({ visible: true }).first().click();
  const sheet = page.locator('dialog[data-help]');
  await expect(sheet).toBeVisible();
  return sheet;
}
