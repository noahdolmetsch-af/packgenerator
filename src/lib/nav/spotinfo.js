/**
 * «Pfad auf jeder Seite» Schritt 2 (Noah 28.10.2026 «1a 2a», 29.10.2026 «Freigeben»): the small «i» on a tile or
 * page and the sheet «Woher kommt das?». Each entry says where the thing lives (its path), what it is, where its
 * data comes from, where it leads and what belongs to it. Only what was checked in the code stands here; a
 * function of the catalogue (fid) takes its name and text from features.js, so they never differ from
 * «What the app can do». All texts are English keys for t(); the German ones are in i18n/de/pfadinfo.js.
 *
 * key: 'tile.x' (a tile on Heute) or 'tab.<place>.<tab>' (a tab of a place, shown at the right of the path line).
 * place/tab: the path (keys of PLACES / PLACE_TABS); name: the tile's name (tab: the tab's own name is used).
 * from: where the data comes from; href: where a tap leads; related: ids of the catalogue that belong to it.
 */
export const INFO = {
  'tile.week': {
    place: 'today',
    name: 'This week',
    text: 'Monday to Sunday: a dot for each activity you ticked and for each ride, today framed.',
    from: ['What you tick in Active', 'Your rides, also those counted from Strava'],
    href: '#/week',
    go: 'To the week',
  },
  'tile.acts': {
    place: 'today',
    name: 'Active today',
    text: 'The activities of Active, one tap ticks one.',
    from: ['What you tick here or in Active'],
    href: '#/auswerten/analyse',
    go: 'All values and activities',
  },
  'tile.vitals': {
    place: 'today',
    name: 'Body values',
    text: 'The most important body values of today in one row, only to look at.',
    from: ['Fitbit'],
    href: '#/flow/stats/hr',
    go: 'All body values',
  },
  'tile.weigh': {
    place: 'today',
    name: 'Weight this week?',
    fid: 'f.weighin',
    from: ['What you type; it is kept under Me › Weight'],
    href: '#/me/weight',
    go: 'History under Me › Weight',
  },
  'tab.week.week': { place: 'week', tab: 'week', fid: 'f.weekplan', related: ['f.remember', 'f.agenda'] },
  'tab.week.remember': { place: 'week', tab: 'remember', fid: 'f.remember', related: ['f.weekplan', 'f.notes'] },
  'tab.week.agenda': { place: 'week', tab: 'agenda', fid: 'f.agenda', related: ['f.weekplan', 'f.remember'] },
  'tab.week.notes': { place: 'week', tab: 'notes', fid: 'f.notes', related: ['f.noteremind', 'f.remember'] },
};

/** The entry of the tab a place shows now (keys as in PLACE_TABS), or null. */
export const infoOfTab = (place, tab) => (tab ? INFO[`tab.${place}.${tab}`] ?? null : null);
