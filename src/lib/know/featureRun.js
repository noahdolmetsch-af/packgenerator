/**
 * v0.96.0 «F1 Alles finden»: what «Take me there» does for a function of the catalogue (features.js),
 * on «What the app can do» and in the search. A page opens; an action starts (a trip, a note, the
 * km, the playground …). Every tap counts the function as used (the settings record "tips").
 * Tips with a form of their own (home place, install) open «What the app can do» at that tip.
 */
import { db } from '../db.js';
import { downloadBackup } from '../backup.js';
import { TIP, tapTip, updateTips } from '../tips.js';
import { featureHref } from '../features.js';
import { PLAY_WISH } from '../play.js';
import { dayRide, openNew, openNote, openData, openWear } from '../nav.js';
import { localDay } from '../localday.js';
import { t, lang, setLang } from '../i18n.svelte.js';

/** Count the function as used. */
export const tapFeature = (id) => updateTips(db, (s) => tapTip(s, id, localDay()));

/** The run of an entry (its own, or its tip's), or null for a page. */
export const runOf = (f) => (f.tip ? (TIP[f.tip].go.run ?? null) : (f.run ?? null));

/** Open the search with a text (Search.svelte listens). */
export const openSearch = (text = '') => window.dispatchEvent(new CustomEvent('pg:search', { detail: text }));

const RUN = {
  trip: () => openNew('list'),
  newTrip: () => openNew('list'),
  dayRide: () => dayRide(),
  wear: () => openWear(),
  note: () => openNote(''),
  receipt: () => openNote(t('Workshop receipt: ')),
  km: () => openNew('km'),
  problem: () => openNew('problem'),
  data: () => openData(),
  lang: () => setLang(lang.v === 'de' ? 'en' : 'de'),
  backup: () => downloadBackup(db),
  search: () => openSearch(t('note saddle creaks')),
  play: () => {
    try {
      localStorage.setItem(PLAY_WISH, '1');
    } catch {
      /* no storage: Ich opens without the sheet */
    }
    location.hash = '#/me';
  },
};

/** Go: the page (or the action) of a function. bikeId: the first bike, for the bike's sheets. */
export async function goFeature(f, { bikeId = null } = {}) {
  tapFeature(f.id);
  const run = runOf(f);
  if (run && RUN[run]) return RUN[run]();
  const href = run ? `#/features?f=${encodeURIComponent(f.id)}` : featureHref(f, { bikeId });
  if (!href) return;
  if (location.hash === href) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = href;
}
