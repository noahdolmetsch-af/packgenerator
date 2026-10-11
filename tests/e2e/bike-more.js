// v0.94.0 «Velo kurz»: Bikes › Overview keeps the bags and everything else behind two rows; openMore
// opens «Mehr» (folder, measures, drawing, bags, side rows) when it is closed.
export async function openMore(page) {
  const more = page.locator('.vk-more');
  await more.waitFor();
  if ((await more.getAttribute('aria-expanded')) !== 'true') await more.click();
}
