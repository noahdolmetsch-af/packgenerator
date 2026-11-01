// «Velos ausmustern» (Noah 1.11.2026 «1-5 a»): retire a bike (sold, given away, broken) without losing anything
export default {
  title: 'Retire a bike',
  lead: 'A bike you no longer ride can be retired. Nothing is lost, and you can bring it back.',
  points: [{ text: 'In the bike’s «…» menu: «Retire bike», with a reason, a day and a note', go: { href: '#/bikes', steps: [{ sel: '.bmenu button' }] } }],
  small: [
    { box: 'new', text: 'Retired bikes wait folded at the bottom of Bikes, with «Bring back»', go: null },
    { box: 'new', text: 'Their trips, km and services stay and still count in your reviews', go: null },
  ],
  test: [
    'Open Bikes, tap the «…» menu of a bike and choose «Retire bike», then «Retire bike» again.',
    'The bike is gone from the row; at the bottom open «1 retired bike» and tap «Bring back».',
  ],
  since: [],
  de: {
    'Retire a bike': 'Ein Velo ausmustern',
    'A bike you no longer ride can be retired. Nothing is lost, and you can bring it back.': 'Ein Velo, das du nicht mehr fährst, kannst du ausmustern. Nichts geht verloren, und du kannst es zurückholen.',
    'In the bike’s «…» menu: «Retire bike», with a reason, a day and a note': 'Im «…»-Menü des Velos: «Velo ausmustern», mit Grund, Tag und Notiz',
    'Retired bikes wait folded at the bottom of Bikes, with «Bring back»': 'Ausgemusterte Velos warten eingeklappt unten bei Velos, mit «Zurückholen»',
    'Their trips, km and services stay and still count in your reviews': 'Ihre Touren, km und Services bleiben und zählen weiter in deinen Auswertungen',
    'Open Bikes, tap the «…» menu of a bike and choose «Retire bike», then «Retire bike» again.': 'Öffne Velos, tippe auf das «…»-Menü eines Velos, wähle «Velo ausmustern» und bestätige mit «Velo ausmustern».',
    'The bike is gone from the row; at the bottom open «1 retired bike» and tap «Bring back».': 'Das Velo ist aus der Reihe verschwunden; öffne unten «1 ausgemustertes Velo» und tippe auf «Zurückholen».',
  },
};
