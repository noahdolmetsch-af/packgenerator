/**
 * «Art der Sportart» (Noah 27.11.2026 «3b a», Thread «Abhaken auf einen Blick verbessern», Frage 10): the kind of a sport (Strength, Endurance,
 * Mobility, Recovery) that the person chooses for each sport by hand, in the sport itself or in one window for all. The kinds are a list of
 * «Listen und Typen» like the other lists: rename, add your own (e.g. «Balance»), delete. The kind is saved on the sport (`art`: the id of
 * the kind); a sport without a kind does not count in the mix of «Dein Tag und deine Woche». The word «Art» is Noah's.
 */
import { t } from '../i18n.svelte.js';
import { offered, nameOf, hasId } from '../applists.js';

export const ARTEN_KEY = 'sportArts';
/** The Standard of the list (the German names are in i18n/de/arten.js; «|art» keeps them apart from other words). */
export const ARTEN_STD = [
  { id: 'strength', name: 'Strength|art' },
  { id: 'endurance', name: 'Endurance|art' },
  { id: 'mobility', name: 'Mobility|art' },
  { id: 'recovery', name: 'Recovery|art' },
];

/** The kinds to choose from (no hidden ones; keep: the kind a sport has now stays offered). → [{ key, name }] */
export const artOptions = (keep = null) => offered(ARTEN_KEY, ARTEN_STD, keep).map((e) => ({ key: e.id, name: e.own || e.renamed ? e.name : t(e.name) }));
/** The name of a kind: a typed one as it is, a Standard one in the language of the app; '' for none or an unknown one. */
export const artName = (id) => (id ? nameOf(ARTEN_KEY, ARTEN_STD, id, t, '') : '');
/** Does the kind still exist (it may have been deleted in «Listen und Typen»)? */
export const artKnown = (id) => !!id && hasId(ARTEN_KEY, ARTEN_STD, id);
/** The kind of an activity if it still exists, else null. */
export const artOf = (act) => (act?.art && artKnown(act.art) ? act.art : null);
