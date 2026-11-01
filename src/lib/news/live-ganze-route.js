// Live-Navigation «Ganze Route» (Noah 31.10.2026 «1-5 a», Schritt 3): the whole way on one screen and step by step
export default {
  title: 'The whole way at a glance',
  lead: 'On the way to a goal you see the whole line on one screen and the way step by step.',
  points: [
    { text: 'New button «Whole route» shows the whole way on one screen', href: '#/live', go: 'f.live' },
    { text: 'The way step by step: a list of the turns, done ones crossed out', href: '#/live', go: 'f.turns' },
  ],
  small: [{ box: 'new', text: 'The list sits in the box of the way to your goal', go: 'f.live' }],
  test: ['On the live map choose a goal and tap «Go there»: tap the button «Whole route», the whole way is in view.', 'Open «Step by step» in the box on top: the turns are listed; ride on and the passed ones are crossed out.'],
  since: [],
  de: {
    'The whole way at a glance': 'Der ganze Weg auf einen Blick',
    'On the way to a goal you see the whole line on one screen and the way step by step.': 'Auf dem Weg zu einem Ziel siehst du die ganze Linie auf einem Bild und den Weg Schritt für Schritt.',
    'New button «Whole route» shows the whole way on one screen': 'Neuer Knopf «Ganze Strecke» zeigt den ganzen Weg auf einem Bild',
    'The way step by step: a list of the turns, done ones crossed out': 'Der Weg Schritt für Schritt: eine Liste der Abzweigungen, erledigte durchgestrichen',
    'The list sits in the box of the way to your goal': 'Die Liste steht im Kasten des Wegs zum Ziel',
    'On the live map choose a goal and tap «Go there»: tap the button «Whole route», the whole way is in view.': 'Auf der Live-Karte ein Ziel wählen und «Hinfahren» tippen: den Knopf «Ganze Strecke» antippen, der ganze Weg ist im Bild.',
    'Open «Step by step» in the box on top: the turns are listed; ride on and the passed ones are crossed out.': 'Oben im Kasten «Schritt für Schritt» öffnen: Die Abzweigungen stehen in einer Liste; fährst du weiter, werden die gefahrenen durchgestrichen.',
  },
};
