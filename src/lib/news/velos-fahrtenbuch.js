// «Velos: Fahrten-Buch und Inspektion vorn» (Noah 24.11.2026, Sitemap K1): two rows under the bike cards
export default {
  title: 'Bikes: ride ledger, inspection and care up front',
  lead: 'Under your bike cards two rows lead straight to the ride ledger «Every km counts» and to the quick check, for the bike you chose. The ledger has its own page now, so you do not open «More» any more.',
  points: [{ text: 'On Bikes, under the cards: «Ride ledger» and «Start inspection» (with the day of the last check)', go: { href: '#/bikes', steps: [{ sel: '[data-bike-quick-rows]' }], where: 'Bikes: the two rows right under the bike cards.' } }, { text: 'On Bikes, «Care and parts» comes before «Bags»; the Garmin pages are one row in «More»', go: { href: '#/bikes', steps: [{ sel: '[data-garmin-row]' }], where: 'Bikes › Setup, on a phone: «More» at the bottom, the row «Garmin pages».' } }],
  small: [{ box: 'new', text: 'The ride ledger as its own page: Bikes › Care › Ride ledger' }, { box: 'new', text: 'On a phone «Care and parts» comes before the bags; the Garmin pages are one row in «More»' }],
  test: ['Open Bikes: right under the bike cards stand «Ride ledger» and «Start inspection».', 'Tap «Ride ledger»: the ledger «Every km counts» of the chosen bike opens, without «More».', 'Tap «Start inspection»: the quick check of the chosen bike opens. Under the row it says when the last check was.', 'On a phone, scroll to the bike below the cards: under the drawing stands «Care and parts», then «Bags». The Garmin pages are one row in «More».'],
  since: [],
  de: {
    'Bikes: ride ledger, inspection and care up front': 'Velos: Fahrten-Buch, Inspektion und Pflege vorn',
    'Under your bike cards two rows lead straight to the ride ledger «Every km counts» and to the quick check, for the bike you chose. The ledger has its own page now, so you do not open «More» any more.': 'Unter den Velo-Karten führen zwei Zeilen direkt zum Fahrten-Buch «Jeder km zählt» und zum Kurzcheck, für das gewählte Velo. Das Fahrten-Buch hat jetzt eine eigene Seite, du öffnest «Mehr» nicht mehr.',
    'On Bikes, under the cards: «Ride ledger» and «Start inspection» (with the day of the last check)': 'Bei Velos, unter den Karten: «Fahrten-Buch» und «Inspektion starten» (mit dem Tag des letzten Checks)',
    'Bikes: the two rows right under the bike cards.': 'Velos: die zwei Zeilen direkt unter den Velo-Karten.',
    'The ride ledger as its own page: Bikes › Care › Ride ledger': 'Das Fahrten-Buch als eigene Seite: Velos › Pflege › Fahrten-Buch',
    'Open Bikes: right under the bike cards stand «Ride ledger» and «Start inspection».': 'Öffne Velos: direkt unter den Velo-Karten stehen «Fahrten-Buch» und «Inspektion starten».',
    'Tap «Ride ledger»: the ledger «Every km counts» of the chosen bike opens, without «More».': 'Tippe «Fahrten-Buch»: das Fahrten-Buch «Jeder km zählt» des gewählten Velos öffnet sich, ohne «Mehr».',
    'Tap «Start inspection»: the quick check of the chosen bike opens. Under the row it says when the last check was.': 'Tippe «Inspektion starten»: der Kurzcheck des gewählten Velos öffnet sich. Unter der Zeile steht, wann der letzte Check war.',
    'Bikes › Setup, on a phone: «More» at the bottom, the row «Garmin pages».': 'Velos › Setup, am Handy: «Mehr» ganz unten, die Zeile «Garmin-Seiten».',
    'On Bikes, «Care and parts» comes before «Bags»; the Garmin pages are one row in «More»': 'Bei Velos steht «Pflege und Teile» vor den «Taschen»; die Garmin-Seiten sind eine Zeile in «Mehr»',
    'On a phone «Care and parts» comes before the bags; the Garmin pages are one row in «More»': 'Am Handy steht «Pflege und Teile» vor den Taschen; die Garmin-Seiten sind eine Zeile in «Mehr»',
    'On a phone, scroll to the bike below the cards: under the drawing stands «Care and parts», then «Bags». The Garmin pages are one row in «More».': 'Scrolle am Handy zum Velo unter den Karten: unter der Zeichnung steht «Pflege und Teile», dann «Taschen». Die Garmin-Seiten sind eine Zeile in «Mehr».',
  },
};
