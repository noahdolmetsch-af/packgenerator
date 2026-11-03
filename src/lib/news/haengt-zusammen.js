// «Hängt zusammen mit» auf mehr Seiten (Idee D4 «App denkt mit», Noah 02.11.2026 «3b»)
export default {
  title: 'Belongs to: more pages',
  lead: 'The row «Belongs to …» with links to related functions now also shows on Debrief, Neuland and Weather.',
  points: [{ text: 'On Debrief, Neuland and Weather a row «Belongs to …» links to functions that go with the page', go: { href: '#/wetter', steps: [{ sel: '[data-gehoert]' }], where: 'Shows on top of the page.' } }],
  small: [],
  test: ['Open Weather: on top stands «Belongs to …» with up to five small links.', 'Open Debrief and Neuland: the same row, with other links.'],
  since: [],
  de: {
    'Belongs to: more pages': 'Gehört dazu: auf mehr Seiten',
    'The row «Belongs to …» with links to related functions now also shows on Debrief, Neuland and Weather.': 'Die Zeile «Gehört zu …» mit Links zu verwandten Funktionen steht jetzt auch auf Rückblick, Neuland und Wetter.',
    'On Debrief, Neuland and Weather a row «Belongs to …» links to functions that go with the page': 'Auf Rückblick, Neuland und Wetter verlinkt eine Zeile «Gehört zu …» Funktionen, die zur Seite passen',
    'Shows on top of the page.': 'Steht oben auf der Seite.',
    'Open Weather: on top stands «Belongs to …» with up to five small links.': 'Öffne Wetter: oben steht «Gehört zu …» mit bis zu fünf kleinen Links.',
    'Open Debrief and Neuland: the same row, with other links.': 'Öffne Rückblick und Neuland: dieselbe Zeile, mit anderen Links.',
  },
};
