/**
 * «Wegweiser statt Katalog» PR 1 (Noah 01.11.2026 «1a 2a 3a 4a 5a»): every function of the catalogue needs at least one
 * jump («Absprung») from a page of the app, not only from the places where you search: the catalogue, the search,
 * Quick Links, the handbook, tips, news and the like. A tool that lies only in its collection page (Toolbox, «Calmer»,
 * Free time) has no jump yet; packages 2–10 give it one where you need it (a «Fits here» row, «Next» after an action,
 * an empty state, «Belongs to»).
 *
 * A jump is a written link to the function's page ('#/me/tools/gears', also with '?…') in any file of src/ that is not
 * a finding place (FINDER). Links built at run time (`#/me/frei/${key}`) do not count: those are the collection pages.
 * Functions with an action instead of a page, with the start page '#/' or with a placeholder ('{bike}') are not checked.
 *
 * NO_JUMP: the functions without a jump yet, with their moment, measured 01.11.2026 on main. tests/absprung.test.js fails
 * when a function has no jump and is not listed (a new function comes with its jump), when a listed one got a jump
 * (take it out), and when the list grows. Pure: the test reads the files and passes them in.
 */

/** Files that are finding places, not pages where a need comes up (paths relative to src/). */
export const FINDER = [
  /^lib\/features\.js$/, /^lib\/featreg\//, /^lib\/know\//, /^lib\/news\//, /^lib\/whatsnew/, /^lib\/i18n/,
  /^lib\/handbook\.js$/, /^lib\/tips\.js$/, /^lib\/moment\.js$/, /^lib\/appmap/, /^lib\/home\/discover\.js$/,
  /^lib\/home\/functions\.js$/, /^lib\/home\/fnlist\.js$/, /^lib\/home\/quick\.js$/, /^lib\/quick/i,
  /^lib\/nav\/(menu|tabinfo|spotinfo|Search|Explorer)/, /^pages\/(Features|Quick|AppMap|Handbook|WasNeu)\.svelte$/,
  /^lib\/seiteninhalt\.js$/, // the pages that show «What you can do here», not a jump
];

/** The page path of a function to check, or null (action, start page, placeholder). */
export function jumpPath(f) {
  const p = (f?.href ?? '').split('?')[0];
  if (!p.startsWith('#/') || p === '#/' || p.includes('{')) return null;
  return p;
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The ids of the functions without a jump. features: the catalogue; sources: [[path relative to src/, text]];
 * linked: ids that have a jump in another way (the «Fits here» rows, src/lib/passthier.js).
 */
export function withoutJump(features, sources, linked = new Set()) {
  const own = sources.filter(([p]) => !FINDER.some((re) => re.test(p))).map(([, s]) => s);
  const has = new Map();
  return features.filter((f) => {
    const p = jumpPath(f);
    if (!p || linked.has(f.id)) return false;
    if (!has.has(p)) {
      const re = new RegExp(`['"\`]${esc(p)}(?=['"\`?])`);
      has.set(p, own.some((s) => re.test(s)));
    }
    return !has.get(p);
  }).map((f) => f.id);
}

/** Functions without a jump yet (shrink only), by moment and the package that gives them one. */
export const NO_JUMP = [
  // PR 4 Rückblick
  'f.tripcosts', 'f.meaning', 'f.gooddecisions', 'f.knowhow', 'f.freinaechstes', 'f.skillmap',
  // PR 6 Träume
  'f.freinacht', 'f.ownbingo', 'f.freiwesentlich', 'f.freireise', 'f.freilust',
  // PR 7 Körper
  'f.tennistop', 'f.experiment', 'f.specialdays', 'f.counterdays', 'f.freerewards', 'f.tworoles', 'f.scalemeaning', 'f.bodytalk',
  // PR 8 Alltag und Ruhiger
  'f.freiabend', 'f.people', 'f.markup', 'f.ablage', 'f.chains', 'f.convert', 'f.video', 'f.qr',
  'f.workspace', 'f.calmview', 'f.pushbudget', 'f.notforme',
];
