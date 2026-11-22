/** S5 (Noah 21.11.2026 «4a»): the one database step of leiser.js: «Not today» on a day is noted for the kind. */
import { putSetting } from '../flowdb.js';
import { SKIPS_KEY, noteSkip } from './leiser.js';

export async function recordSkip(db, kind, day) {
  const rec = await db.settings.get(SKIPS_KEY);
  await putSetting(db, SKIPS_KEY, noteSkip(rec?.value, kind, day));
}
