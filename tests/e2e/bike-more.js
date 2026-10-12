// v0.95.0 «Velo kurz»: Bikes › Overview keeps everything else behind folds. Design-Refresh P7 (V1): «Mehr» is
// a list of rows; openMore opens the two folds the older checks need when they are closed: «Mappe» (the
// folder) and «Profil und Einstellungen» (profile, who works on it, measures, settings).
export async function openMore(page) {
  for (const cls of ['vm-folder', 'vm-profile']) {
    const fold = page.locator(`details.${cls}`);
    await fold.waitFor();
    if ((await fold.getAttribute('open')) === null) await fold.locator(':scope > summary').click();
  }
}
