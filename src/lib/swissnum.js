// Swiss numbers stay «1’250» (Noah 20.10.2026, «Bibliotheken-Update reparieren»).
// Newer Chrome versions write Swiss German thousands with a straight apostrophe («1'250») instead of
// the typographic one («1’250») the app has always shown. Without this, the same app would show
// different numbers on Noah's computer and phone, depending on the Chrome version. This file brings
// the typographic apostrophe back for every Swiss German number the browser formats: num(),
// toLocaleString('de-CH') and Intl.NumberFormat alike, also in code written later.
// It changes nothing in a browser that already writes «’», and nothing for other languages.
// Dates are not touched (Date.prototype.toLocaleString is a separate function).

const RIGHT = '’';
const STRAIGHT = /'/g;

/** «1'250» → «1’250». */
export const fixGroup = (s) => (typeof s === 'string' ? s.replace(STRAIGHT, RIGHT) : s);

const isSwiss = (locale) => /^de-(CH|LI)\b/i.test(locale || '');

/**
 * Installs the fix on the given global object (the browser's window by default).
 * Returns true when the browser needed it.
 */
export function installSwissNumbers(g = globalThis) {
  const NF = g.Intl?.NumberFormat;
  if (!NF || NF.__swissFixed) return false;
  let needed;
  try {
    needed = new NF('de-CH').format(1000).includes("'");
  } catch {
    return false;
  }
  if (!needed) return false;

  const proto = NF.prototype;
  const swiss = new WeakMap(); // NumberFormat → is it Swiss German?
  const swissOf = (nf) => {
    if (!swiss.has(nf)) swiss.set(nf, isSwiss(nf.resolvedOptions().locale));
    return swiss.get(nf);
  };

  // `format` is a getter that returns a bound function.
  const fmt = Object.getOwnPropertyDescriptor(proto, 'format');
  const bound = new WeakMap();
  Object.defineProperty(proto, 'format', {
    configurable: true,
    get() {
      const f = fmt.get.call(this);
      if (!swissOf(this)) return f;
      if (!bound.has(this)) bound.set(this, (n) => fixGroup(f(n)));
      return bound.get(this);
    },
  });

  const parts = proto.formatToParts;
  if (parts) {
    proto.formatToParts = function (n) {
      const out = parts.call(this, n);
      return swissOf(this) ? out.map((p) => (p.type === 'group' ? { ...p, value: fixGroup(p.value) } : p)) : out;
    };
  }

  // Number#toLocaleString: the same as a NumberFormat with these locales (ECMA-402).
  const numLocale = g.Number.prototype.toLocaleString;
  const swissLocales = new Map();
  g.Number.prototype.toLocaleString = function (locales, options) {
    const s = numLocale.call(this, locales, options);
    if (!s.includes("'")) return s;
    const key = Array.isArray(locales) ? locales.join(',') : String(locales ?? '');
    if (!swissLocales.has(key)) {
      let loc = '';
      try {
        loc = new NF(locales).resolvedOptions().locale;
      } catch {
        /* a wrong locale throws in numLocale already */
      }
      swissLocales.set(key, isSwiss(loc));
    }
    return swissLocales.get(key) ? fixGroup(s) : s;
  };

  NF.__swissFixed = true;
  return true;
}

installSwissNumbers();
