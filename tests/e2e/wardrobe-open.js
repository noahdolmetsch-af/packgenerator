// Impeccable runde 2 (18.10.2026, Kleider 1): on a phone every layer of the wardrobe starts as one closed line.
// Tests that look into the layers open them all first (a computer shows them open, then this does nothing).
export async function openLayers(page) {
  // wait until the layers are drawn, else nothing is found yet and the layers stay shut (race seen 27.10.2026)
  await page.locator('section.layer').first().waitFor();
  const shut = page.locator('section.layer .ltog[aria-expanded="false"]');
  for (let n = await shut.count(); n > 0; n = await shut.count()) await shut.first().click();
}
