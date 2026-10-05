/**
 * German and English (v0.20.0). The app is written in English; `t('English text')` gives the
 * German text when the language is German. Texts with numbers or names use placeholders:
 * t('{n} items', { n: 3 }) → "3 Teile". A text without a German entry stays English, so nothing
 * ever goes missing. The German texts live in i18n/de/*.js, one file per part of the app.
 *
 * The language is remembered per device (localStorage "lang"); English is the default.
 * Learnings, notes and names you typed stay as you wrote them. Gear items show their German
 * name (item.nameDe) when there is one: use nameOf(item).
 */
import DE from './i18n/de/index.js';

const KEY = 'lang';
const read = () => {
  try {
    return localStorage.getItem(KEY) === 'de' ? 'de' : 'en';
  } catch {
    return 'en';
  }
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

/** A gear item's name: the German one when German is on and there is one. */
export const nameOf = (item) => (item ? (lang.v === 'de' && item.nameDe ? item.nameDe : item.name) : '');
