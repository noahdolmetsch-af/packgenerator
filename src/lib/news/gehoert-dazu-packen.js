// «Heute als Begleiter» PR 7 (Noah 28.10.2026 «1a 2a 3a»): «Gehört dazu» on Pack
export default {
  title: 'Belongs to: links on Pack',
  lead: 'On top of Pack a row shows the functions that belong to packing.',
  points: [{ text: 'On Pack a row «Belongs to Packing» links to functions that are easy to miss, with «all n ›» for the rest', href: '#/pack', go: { href: '#/pack', steps: [{ sel: '[data-gehoert]' }], where: 'Shows on top of Pack.' } }],
  small: [],
  test: ['Open Pack: on top stands «Belongs to …» with up to five small links.', 'Tap «all …›»: «What the app can do» opens by moment.'],
  since: [],
  de: {
    'Belongs to: links on Pack': 'Gehört dazu: Sprunglinks auf Packen',
    'On top of Pack a row shows the functions that belong to packing.': 'Oben auf Packen zeigt eine Zeile die Funktionen, die zum Packen gehören.',
    'On Pack a row «Belongs to Packing» links to functions that are easy to miss, with «all n ›» for the rest': 'Auf Packen verlinkt eine Zeile «Gehört zu: Packen» Funktionen, die man leicht übersieht, mit «alle n ›» für den Rest',
    'Shows on top of Pack.': 'Zeigt sich oben auf Packen.',
    'Open Pack: on top stands «Belongs to …» with up to five small links.': 'Öffne Packen: Oben steht «Gehört zu: …» mit bis zu fünf kleinen Links.',
    'Tap «all …›»: «What the app can do» opens by moment.': 'Tippe auf «alle …›»: «Was die App kann» öffnet sich nach Moment.',
  },
};
