/**
 * Kleine Apps (Noah 14.10.2026 «eigene kleinere Apps, zum Beispiel Meditation, Packliste oder
 * Velo-Pflege», approved «verstehe. bitte freigegeben. bitte umsetzen»): the same app opens as a small
 * app with its own icon on the home screen. Each small app lives at its own address
 * (…/apps/<key>/, own manifest in public/apps/<key>/), starts right on its area and shows only its
 * own tabs at the bottom, plus «Whole app». The data stays one: same address, same database, the
 * big app sees every entry and stays as it is.
 *
 * tabs: label (English key for t()), href and match (the address belongs to that tab), first = start.
 * Pure (no database, no screen), tested in tests/miniapps.test.js.
 */

const q = (h, k) => new URLSearchParams(h.split('?')[1] ?? '').get(k);
const path = (h) => h.split('?')[0];

export const MINI_APPS = [
  {
    key: 'meditation',
    name: 'Meditation',
    icon: 'leaf',
    tabs: [
      { key: 'start', label: 'Meditation', href: '#/flow/act/meditation', match: (h) => /^#\/flow\/act\/meditation\/?$/.test(path(h)) || /^#\/flow\/act\/meditation\/(done|s)\//.test(path(h)) },
      { key: 'timer', label: 'Timer', href: '#/flow/act/meditation/timer', match: (h) => path(h).startsWith('#/flow/act/meditation/timer') },
      { key: 'log', label: 'Logbook', href: '#/flow/act/meditation/log', match: (h) => path(h).startsWith('#/flow/act/meditation/log') || path(h).startsWith('#/flow/act/meditation/rueckblick') }, // «Meditation» ME3: the Rückblick sits with the log
      { key: 'more', label: 'More', href: '#/flow/act/meditation/mehr', match: (h) => /^#\/flow\/act\/meditation\/(mehr|muster)/.test(path(h)) },
    ],
  },
  {
    key: 'packliste',
    name: 'Packing list',
    icon: 'backpack',
    tabs: [
      { key: 'pack', label: 'Pack|mini', href: '#/pack', match: (h) => (path(h).startsWith('#/pack') && !/^#\/pack\/(templates|past)/.test(path(h))) || path(h).startsWith('#/ride') || path(h).startsWith('#/trip/') },
      { key: 'trips', label: 'Trips|place', href: '#/trips', match: (h) => path(h).startsWith('#/trips') },
      { key: 'templates', label: 'Templates', href: '#/pack/templates', match: (h) => path(h).startsWith('#/pack/templates') },
      { key: 'lookback', label: 'Look back|page', href: '#/debrief', match: (h) => path(h).startsWith('#/debrief') || path(h).startsWith('#/pack/past') },
    ],
  },
  {
    key: 'velopflege',
    name: 'Bike care',
    icon: 'wrench',
    tabs: [
      { key: 'care', label: 'Care|tab', href: '#/bikes?tab=care', match: (h) => path(h).startsWith('#/care') || (path(h).startsWith('#/bikes') && q(h, 'tab') === 'care') },
      { key: 'shop', label: 'Workshop|tab', href: '#/bikes?tab=shop', match: (h) => path(h).startsWith('#/bikes') && q(h, 'tab') === 'shop' },
      { key: 'bikes', label: 'Bikes|place', href: '#/bikes', match: (h) => path(h).startsWith('#/bikes') && !['care', 'shop'].includes(q(h, 'tab')) },
    ],
  },
  {
    // Paket L «Werkzeugkasten» (Noah 19.10.2026 «1 … b auch möglich»): the toolbox as its own small app
    key: 'werkzeug',
    name: 'Toolbox',
    icon: 'wrench',
    tabs: [
      { key: 'tools', label: 'Toolbox', href: '#/me/tools', match: (h) => path(h) === '#/me/tools' || (path(h).startsWith('#/me/tools/') && !/^#\/me\/tools\/(calc|pdf|photo)/.test(path(h))) },
      { key: 'calc', label: 'Calculator', href: '#/me/tools/calc', match: (h) => path(h).startsWith('#/me/tools/calc') },
      { key: 'pdf', label: 'PDF', href: '#/me/tools/pdf', match: (h) => path(h).startsWith('#/me/tools/pdf') },
      { key: 'photo', label: 'Photos', href: '#/me/tools/photo', match: (h) => path(h).startsWith('#/me/tools/photo') },
    ],
  },
];

export const MINI_APP = Object.fromEntries(MINI_APPS.map((a) => [a.key, a]));

const RE = /\/apps\/([a-z]+)\/(index\.html)?$/;

/** The small app an address belongs to (location.pathname, e.g. /packgenerator/apps/meditation/), else null. */
export function miniAppOf(pathname = '') {
  const m = RE.exec(pathname);
  return m ? (MINI_APP[m[1]] ?? null) : null;
}

/** The address of the whole app from a small app's pathname (/packgenerator/apps/meditation/ → /packgenerator/). */
export function wholeAppPath(pathname = '') {
  return pathname.replace(RE, '/');
}

/** Where a small app starts: its first tab when the address shows nothing yet (#/ or empty), else the address itself. */
export function miniStart(app, hash = '') {
  if (!app) return hash;
  return !hash || hash === '#' || hash === '#/' ? app.tabs[0].href : hash;
}

/** The key of the tab an address belongs to, else null (a page of another area, opened from the small app). */
export function miniTabOf(app, hash = '') {
  return app?.tabs.find((tb) => tb.match(hash))?.key ?? null;
}

/** The address of a small app, from the whole app's pathname (/packgenerator/ → /packgenerator/apps/meditation/). */
export function miniAppPath(key, pathname = '/') {
  const base = pathname.replace(/[^/]*$/, '');
  return `${base}apps/${key}/`;
}
