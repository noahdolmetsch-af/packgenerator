// v0.92.0 «Rückblick antippen»: the debrief draft shows the «not needed» chips; the rest are rows
// (details.miss-fold, how-fold, next-fold, items-fold). openRow opens one if it is closed.
export async function openRow(page, cls) {
  const f = page.locator(`details.${cls}`);
  if (!(await f.evaluate((d) => d.open))) await f.locator(':scope > summary').click();
}
