/**
 * TR7c/TR7g: the analyses shown, live for every page; hide (with Rückgängig), move, switch, reset.
 * The rules are analyses.js.
 */
import './charts.css';
import { liveQuery } from 'dexie';
import { db as appDb } from '../db.js';
import { offerDone } from '../ui/rename.svelte.js';
import { t } from '../i18n.svelte.js';
import { ANA_KEY, anaState, setShown, move, reset, anaOf } from './analyses.js';

export const ana = $state({ loaded: false, ...anaState(null), sheet: null });

if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
  liveQuery(async () => (await appDb.settings.get(ANA_KEY))?.value ?? null).subscribe({
    next: (v) => Object.assign(ana, anaState(v), { loaded: true }),
    error: () => (ana.loaded = true),
  });
}

const save = (state, db = appDb) => db.settings.put({ key: ANA_KEY, value: { hidden: state.hidden, order: state.order } });

/** «…» › Ausblenden: hidden, with «Rückgängig» in the toast. */
export async function hideAna(key, db = appDb) {
  const before = { hidden: ana.hidden, order: ana.order };
  await save(setShown(ana, key, false), db);
  offerDone(t('«{name}» hidden', { name: t(anaOf(key)?.title ?? key) }), () => save(before, db));
}
export const showAna = (key, on, db = appDb) => save(setShown(ana, key, on), db);
export const moveAna = (key, dir, db = appDb) => save(move(ana, key, dir), db);
export const resetAna = (groups, db = appDb) => save(reset(ana, groups), db);
/** Opens «Analysen anpassen» with these groups (AnaSheet, mounted once per page). */
export const openAnaSheet = (groups) => (ana.sheet = groups);
