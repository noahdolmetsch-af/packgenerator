/**
 * German and English (v0.20.0). The app is written in English; `t('English text')` gives the
 * German text when the language is German. Texts with numbers or names use placeholders:
 * t('{n} items', { n: 3 }) → "3 Teile". A text without a German entry stays English, so nothing
 * ever goes missing. The German texts live in i18n/de/*.js, one file per part of the app.
 *
 * The language is remembered per device (localStorage "lang"). Without a choice yet (a first start)
 * the browser's language decides: German when it starts with "de", else English (v0.30.2, L9).
 * Learnings, notes and names you typed stay as you wrote them. Gear items show their German
 * name (item.nameDe) when there is one: use nameOf(item).
 */
import DE from './i18n/de/index.js';

const KEY = 'lang';
/** The browser's own language: German for de, de-CH, de-DE …, else English. */
export const browserLang = (nav = typeof navigator === 'undefined' ? null : navigator) => (/^de\b/i.test(nav?.language ?? '') ? 'de' : 'en');
/** The saved choice wins; without one the browser's language. */
export const pickLang = (saved, nav) => (saved === 'de' || saved === 'en' ? saved : browserLang(nav));
const read = () => {
  let saved = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch {
    /* private mode: no saved choice */
  }
  return pickLang(saved);
};

export const lang = $state({ v: typeof window === 'undefined' ? 'en' : read() });

export function setLang(v) {
  lang.v = v === 'de' ? 'de' : 'en';
  try {
    localStorage.setItem(KEY, lang.v);
  } catch {
    /* private mode: only this visit */
  }
  document.documentElement.lang = lang.v;
}

const fill = (text, vars) => (vars ? text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m)) : text);

/**
 * The text in the current language. vars fill {placeholders}. 'Done|task' is "Done" in English
 * with its own German word, for the few English words that need two German ones.
 */
export function t(en, vars) {
  if (typeof en !== 'string') return en ?? '';
  const de = lang.v === 'de' ? DE[en] : null;
  return fill(de ?? en.replace(/\|[a-z]+$/, ''), vars);
}

/** One or many: tn(n, '{n} item', '{n} items'). Both forms need a German entry. */
export const tn = (n, one, many, vars = {}) => t(n === 1 ? one : many, { n, ...vars });

/** Is German on? For the few places that build a sentence differently. */
export const isDe = () => lang.v === 'de';

/** Locale for dates and numbers: Swiss German or British English. */
export const locale = () => (lang.v === 'de' ? 'de-CH' : 'en-GB');

/** A number with thousands separators in the current language (1’460 or 1,460). */
export const num = (n) => (n == null ? '' : Number(n).toLocaleString(lang.v === 'de' ? 'de-CH' : 'en'));

/**
 * v0.30.2 (test P4.1/PL3.12): a bag's own name (stored as typed, often English like "Seat pack 14 L")
 * with its common words in German when German is on: "Satteltasche 14 L".
 */
const BAG_WORDS = [['Seat pack', 'Satteltasche'], ['Saddle bag', 'Satteltasche'], ['Frame bag', 'Rahmentasche'], ['Top tube bag', 'Oberrohrtasche'], ['Handlebar roll', 'Lenkerrolle'], ['Handlebar bag', 'Lenkertasche'], ['Stem bag', 'Vorbautasche'], ['Feed bag', 'Vorbautasche'], ['Fork cage', 'Gabelhalter'], ['Fork bag', 'Gabeltasche'], ['Downtube bag', 'Unterrohrtasche'], ['Backpack', 'Rucksack'], ['large', 'gross'], ['small', 'klein'], ['medium', 'mittel']];
export function bagName(name) {
  const s = String(name ?? '');
  if (lang.v !== 'de') return s;
  return BAG_WORDS.reduce((out, [en, de]) => out.replace(new RegExp(`\\b${en}\\b`, 'gi'), de), s);
}

/** v0.30.2 (test V9.8/V9.12): a stored day ("2026-10-08") as people read it: "8. Okt. 2026" / "8 Oct 2026". */
export const dateOf = (iso) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso ?? '';
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
};

/** A gear item's name: the German one when German is on and there is one. */
export const nameOf = (item) => (item ? (lang.v === 'de' && item.nameDe ? item.nameDe : item.name) : '');
