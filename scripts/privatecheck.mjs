// «Wächter gegen private Daten» (Noah 02.11.2026 «1a danach 3 und 4»): the repository is public, so no personal file
// may be committed by mistake (GPX tracks, Garmin files, Excel lists, photos, real backups). Pure: it gets the list of
// tracked files and a reader, so tests/private-data.test.js can also try it with made-up lists.

/** Files that are never allowed in the repository, whatever the folder. */
export const FORBIDDEN_EXT = /\.(gpx|fit|tcx|kml|kmz|xlsx|xlsm|xls|numbers|heic|heif|jpe?g|cr2|dng|zip|7z)$/i;

/**
 * Fictional files that are allowed on purpose (each one holds made-up data only, «test_data_gtp_» or invented fixtures).
 * The list may only get shorter or be extended by a conscious choice in a PR, with the reason in «Selbst entschieden».
 */
export const ALLOWED = [
  'tests/fixtures/gesamttest/ride-s2.gpx', // made-up track (creator test_data_gtp_)
  'qa/pack-comparison-initial.jpg', // screenshot of the app with made-up data (early design comparison)
  'qa/review-comparison-initial.jpg',
  'tests/e2e/fixture.json',
  'tests/e2e/gear-fixture.json',
  'tests/e2e/pf-fixture.json',
  'tests/e2e/preparation-fixture.json',
  'tests/e2e/templates-fixture.json',
  'tests/fixtures/gesamttest/test_data_gtp_daten.json',
];

const BIG_IMAGE = 2 * 1024 * 1024; // a picture this big is more likely a photo than a screenshot

/**
 * files: tracked paths. read(path) → { size, head } (head: the first text, for JSON content).
 * Returns a list of { file, why } (empty = fine).
 */
export function findPrivate(files, read) {
  const out = [];
  for (const f of files) {
    if (ALLOWED.includes(f)) continue;
    if (FORBIDDEN_EXT.test(f)) {
      out.push({ file: f, why: 'a track, Excel list, photo or archive file (GPX, FIT, XLSX, JPG, HEIC, ZIP …) may never be in the public repository' });
      continue;
    }
    if (/\.json$/i.test(f)) {
      const { head = '' } = read(f) ?? {};
      if (/backup/i.test(f) || (/"app"\s*:\s*"pack-generator"/.test(head) && /"tables"\s*:/.test(head))) {
        out.push({ file: f, why: 'looks like a real Pack Generator backup; only the made-up test fixtures may be in the repository' });
        continue;
      }
    }
    if (/\.(png|webp|gif)$/i.test(f) && (read(f)?.size ?? 0) > BIG_IMAGE) out.push({ file: f, why: 'a very big picture (over 2 MB) may be a private photo' });
  }
  return out;
}
