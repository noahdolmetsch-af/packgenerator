// «Handy: Hinweiskästen als eine Zeile» (Durchklick Etappe 2, Frage 1a, Noah 05.11.2026)
export default {
  title: 'Phone: the hint cards start as one line',
  lead: 'On Packing, Trips, Material and Bikes the cards «Belongs to …» and «All here» start as one line, so the page comes first.',
  points: [{ text: 'Phone: «Belongs to …» and «All here» are one line on Packing, Trips, Material and Bikes; a tap opens the card', go: { href: '#/trips', steps: [{ sel: '[data-card-line]' }], where: 'Trips, on a phone: under the title, one line each.' } }],
  small: [],
  test: ['Open Trips on a phone: under the title the two cards «Belongs to …» and «All here» are one line each, the list of trips comes first.', 'Tap a line: the card opens. «Fold the card» closes it again, and it stays like that after a reload. On a computer both cards stay open.'],
  since: [],
  de: {
    'Phone: the hint cards start as one line': 'Handy: Die Hinweiskästen starten als eine Zeile',
    'On Packing, Trips, Material and Bikes the cards «Belongs to …» and «All here» start as one line, so the page comes first.': 'Bei Packen, Touren, Material und Velos starten die Kästen «Gehört zu» und «Alles hier» als eine Zeile, damit zuerst die Seite kommt.',
    'Phone: «Belongs to …» and «All here» are one line on Packing, Trips, Material and Bikes; a tap opens the card': 'Handy: «Gehört zu» und «Alles hier» sind bei Packen, Touren, Material und Velos eine Zeile; ein Tipp öffnet den Kasten',
    'Trips, on a phone: under the title, one line each.': 'Touren, auf dem Handy: unter dem Titel, je eine Zeile.',
    'Open Trips on a phone: under the title the two cards «Belongs to …» and «All here» are one line each, the list of trips comes first.': 'Öffne Touren auf dem Handy: Unter dem Titel sind die Kästen «Gehört zu» und «Alles hier» je eine Zeile, die Liste der Touren kommt zuerst.',
    'Tap a line: the card opens. «Fold the card» closes it again, and it stays like that after a reload. On a computer both cards stay open.': 'Tippe auf eine Zeile: Der Kasten öffnet sich. «Einklappen» schliesst ihn wieder, und das bleibt nach dem Neuladen so. Auf dem Computer bleiben beide Kästen offen.',
  },
};
