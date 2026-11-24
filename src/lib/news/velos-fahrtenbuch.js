// «Velos: Fahrten-Buch und Inspektion vorn» (Noah 24.11.2026, Sitemap K1): two rows under the bike cards
export default {
  title: 'Bikes: ride ledger and inspection up front',
  lead: 'Under your bike cards two rows lead straight to the ride ledger «Every km counts» and to the quick check, for the bike you chose. The ledger has its own page now, so you do not open «More» any more.',
  points: [{ text: 'On Bikes, under the cards: «Ride ledger» and «Start inspection» (with the day of the last check)', go: { href: '#/bikes', steps: [{ sel: '[data-bike-quick-rows]' }], where: 'Bikes: the two rows right under the bike cards.' } }],
  small: [{ box: 'new', text: 'The ride ledger as its own page: Bikes › Care › Ride ledger' }],
  test: ['Open Bikes: right under the bike cards stand «Ride ledger» and «Start inspection».', 'Tap «Ride ledger»: the ledger «Every km counts» of the chosen bike opens, without «More».', 'Tap «Start inspection»: the quick check of the chosen bike opens. Under the row it says when the last check was.'],
  since: [],
  de: {
    'Bikes: ride ledger and inspection up front': 'Velos: Fahrten-Buch und Inspektion vorn',
    'Under your bike cards two rows lead straight to the ride ledger «Every km counts» and to the quick check, for the bike you chose. The ledger has its own page now, so you do not open «More» any more.': 'Unter den Velo-Karten führen zwei Zeilen direkt zum Fahrten-Buch «Jeder km zählt» und zum Kurzcheck, für das gewählte Velo. Das Fahrten-Buch hat jetzt eine eigene Seite, du öffnest «Mehr» nicht mehr.',
    'On Bikes, under the cards: «Ride ledger» and «Start inspection» (with the day of the last check)': 'Bei Velos, unter den Karten: «Fahrten-Buch» und «Inspektion starten» (mit dem Tag des letzten Checks)',
    'Bikes: the two rows right under the bike cards.': 'Velos: die zwei Zeilen direkt unter den Velo-Karten.',
    'The ride ledger as its own page: Bikes › Care › Ride ledger': 'Das Fahrten-Buch als eigene Seite: Velos › Pflege › Fahrten-Buch',
    'Open Bikes: right under the bike cards stand «Ride ledger» and «Start inspection».': 'Öffne Velos: direkt unter den Velo-Karten stehen «Fahrten-Buch» und «Inspektion starten».',
    'Tap «Ride ledger»: the ledger «Every km counts» of the chosen bike opens, without «More».': 'Tippe «Fahrten-Buch»: das Fahrten-Buch «Jeder km zählt» des gewählten Velos öffnet sich, ohne «Mehr».',
    'Tap «Start inspection»: the quick check of the chosen bike opens. Under the row it says when the last check was.': 'Tippe «Inspektion starten»: der Kurzcheck des gewählten Velos öffnet sich. Unter der Zeile steht, wann der letzte Check war.',
  },
};
