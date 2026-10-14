/**
 * «Inhalte Flow» IF1–IF3: the one setting behind the tip line, the fold and the tiles, live for every
 * component on the page. info() is the stored value made whole, save(next) writes it back.
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';
import { putSetting } from '../flowdb.js';
import { PAGEINFO_KEY, infoOf } from '../pageinfo.js';

export function pageInfo() {
  const q = liveQuery(() => db.settings.get(PAGEINFO_KEY));
  let v = $state(undefined);
  let loaded = $state(false);
  $effect(() => {
    const sub = q.subscribe({ next: (x) => ((v = x?.value), (loaded = true)) });
    return () => sub.unsubscribe();
  });
  return {
    get info() {
      return infoOf(v);
    },
    get loaded() {
      return loaded;
    },
    save: (next) => next && putSetting(db, PAGEINFO_KEY, next),
  };
}
