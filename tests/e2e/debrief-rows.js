// v0.92.0 «Rückblick antippen»: the debrief draft shows the «not needed» chips; the rest are rows
// (details.miss-fold, how-fold, next-fold, items-fold). openRow opens one if it is closed.
// v0.108.0 Design-Refresh P6: «Was hat gefehlt?» and «Fürs nächste Mal» are one open section now
// (section.miss-fold.next-fold), not folds; an open section needs no tap.
export async function openRow(page, cls) {
  const f = page.locator(`.${cls}`).first();
  if (!(await f.evaluate((d) => d.tagName !== 'DETAILS' || d.open))) await f.locator(':scope > summary').click();
}
