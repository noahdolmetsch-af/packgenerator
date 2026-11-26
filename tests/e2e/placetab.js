// UI-Ziele #6 (Noah 20.10.2026 «freigabe», 4a): pages that were rows under «Ich» are tabs of Planen and Auswerten now.
// viaTab opens such a page the way a person does: the place in the bar (sidebar on a computer), then its tab.
// Impeccable P1 (20.10.2026): a phone shows at most four tabs, the rest sit under «Mehr»; a computer lists the
// tabs only in the sidebar under the place.
import { expect } from '@playwright/test';
import { ALL_PLACES, PLACE_TABS } from '../../src/lib/nav.js';

/** The visible tabs of the open place: the bar on top (phone) or the list in the sidebar (computer). */
export const TABS = 'nav.ptabs:visible, .side .tabs:visible';
/**
 * The lit tab inside TABS. Since «Navigation schlanker» (PR 1759) the sidebar of a computer names the page under the lit tab as an
 * extra row (data-side-sub, e.g. «Mein Setup» under «Velos»): the tab itself then carries aria-current="true", the row "page".
 * TAB_LINK / TAB_LIT leave that extra row out, so tests count and read the tabs only.
 */
export const TAB_LINK = 'a:not([data-side-sub])';
export const TAB_LIT = 'a[aria-current]:not([data-side-sub])';

export async function viaTab(page, place, href) {
  // the place itself by its address (a window over the page, e.g. the morning check, could cover the bar)
  await page.goto(`./${ALL_PLACES.find((p) => p.key === place).href}`); // «Aktiv neu» (22.10.2026): also Auswerten, which shares Aktiv's place
  // «Ganze App neu denken» Schritt 11: a page that is a chip under a tab (Planen: Woche, Notizen, Alltag) is reached by that tab first
  const owner = (PLACE_TABS[place] ?? []).find((x) => x.subs?.some((s) => s.href === href));
  // Velos aufräumen (23.11.2026): the tab «Velos» has no chips; Teile and Mein Setup are rows of the page, the test opens them by their address
  if (owner?.chips === false && owner.href !== href) {
    await page.goto(`./${href}`);
    return;
  }
  if (owner && owner.href !== href) {
    const own = page.locator(`nav.ptabs a[href="${owner.href}"], .side .tabs a[href="${owner.href}"]`).filter({ visible: true }).first();
    await expect(own).toBeVisible();
    await own.click();
    await expect(page.locator('nav.psubs')).toBeVisible();
  }
  let tab = page.locator(`nav.ptabs a[href="${href}"], .side .tabs a[href="${href}"], nav.psubs a[href="${href}"]`).filter({ visible: true }).first();
  // on a phone a tab may sit under «Mehr»
  if (!(await tab.isVisible()) && (await page.locator('nav.ptabs .pmore').isVisible())) {
    await page.locator('nav.ptabs .pmore').click();
    tab = page.locator(`dialog.ptsheet a[href="${href}"]`);
  }
  await expect(tab).toBeVisible();
  await tab.click();
  await expect(page).toHaveURL(new RegExp(`${href.replace(/[?#/]/g, (c) => `\\${c}`)}$`));
}

/** Tap a tab by its name; on a phone it may sit under «Mehr». */
export async function tapTab(page, name) {
  // the German texts load before the first screen (i18n.svelte.js loadDe), so the app may appear a moment after the load event
  await page.locator('nav.ptabs, .side .tabs').first().waitFor({ state: 'attached' });
  // since V4a (21.11.2026) the pages of Aktiv are chips (nav.psubs) under the tab «Training»
  const tab = page.locator(`${TABS}, nav.psubs:visible`).getByRole('link', { name, exact: true });
  // a chip row changes after a tab was tapped: give it a moment before looking under «Mehr» (the check was timing-dependent)
  if (await tab.first().waitFor({ state: 'visible', timeout: 2500 }).then(() => true, () => false)) return tab.first().click();
  await page.locator('nav.ptabs .pmore').click();
  await page.locator('dialog.ptsheet').getByRole('link', { name, exact: true }).click();
}

/** «Aktiv neu» (Noah 22.10.2026): from Aktiv to Auswerten, the way a person does (the switch on a phone, the sidebar row on a computer). */
export async function toAnalysis(page) {
  await page.locator('nav.bottom a[data-place="analysis"], .side li[data-place="analysis"] > a.pa').filter({ visible: true }).first().click();
  await expect(page).toHaveURL(/#\/auswerten$/);
}
