// «Heute als Begleiter» PR 8 (Noah 28.10.2026 «1a 2a 3a»): «Gehört dazu» on Trips (planning)
export default {
  title: 'Belongs to: links on Trips',
  lead: 'On top of Trips a row shows the functions that belong to planning a trip.',
  points: [{ text: 'On Trips a row «Belongs to Planning a trip» links to functions that are easy to miss, with «all n ›» for the rest', href: '#/trips', go: { href: '#/trips', steps: [{ sel: '[data-gehoert]' }], where: 'Shows on top of Trips.' } }],
  small: [],
  test: ['Open Trips: on top stands «Belongs to Planning a trip» with up to five small links.', 'Tap «all …›»: «What the app can do» opens by moment.'],
  since: [],
  de: {
    'Belongs to: links on Trips': 'Gehört dazu: Sprunglinks auf Touren',
    'On top of Trips a row shows the functions that belong to planning a trip.': 'Oben auf Touren zeigt eine Zeile die Funktionen, die zum Planen einer Tour gehören.',
    'On Trips a row «Belongs to Planning a trip» links to functions that are easy to miss, with «all n ›» for the rest': 'Auf Touren verlinkt eine Zeile «Gehört zu: Tour planen» Funktionen, die man leicht übersieht, mit «alle n ›» für den Rest',
    'Shows on top of Trips.': 'Zeigt sich oben auf Touren.',
    'Open Trips: on top stands «Belongs to Planning a trip» with up to five small links.': 'Öffne Touren: Oben steht «Gehört zu: Tour planen» mit bis zu fünf kleinen Links.',
    'Tap «all …›»: «What the app can do» opens by moment.': 'Tippe auf «alle …›»: «Was die App kann» öffnet sich nach Moment.',
  },
};
