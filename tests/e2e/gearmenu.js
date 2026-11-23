// Material aufräumen (Noah 23.11.2026): on top of Material only search, «Ansicht» and «+ Teil»; the views, «Sortieren und filtern» sit in the
// menu «Ansicht», the tools in «…». These helpers open them the way a person does.
export const VIEWS = '[data-gear-views]';

/** Open the menu «Ansicht» (stays open if it is). */
export async function openViews(page) {
  const d = page.locator(VIEWS);
  if (!(await d.evaluate((el) => el.open))) await d.locator('summary').click();
  return d;
}

/** Open «Sortieren und filtern» (the sheet) through «Ansicht». */
export async function openSortSheet(page) {
  const d = await openViews(page);
  await d.locator('.vsort').click();
}

/** Open the menu «…» (More for Gear). */
export async function openTools(page) {
  const d = page.locator('details.gmore:not(.vmenu)');
  if (!(await d.evaluate((el) => el.open))) await d.locator('summary').click();
  return d;
}
