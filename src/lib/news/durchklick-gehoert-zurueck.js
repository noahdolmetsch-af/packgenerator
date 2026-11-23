// Durchklick 2 und 3 (Noah 22.11.2026 «2a», «3a»): «Gehört dazu» als geschlossene Zeile unter dem Titel; «Zurück» nennt die Herkunft
export default {
  title: 'Pages start with the title; «Back» says where you came from',
  lead: 'The row «Belongs to …» is a closed line behind the title now, and the path of a page names the place you came from.',
  points: [
    { text: 'On Packing, Trips, Me, Velos, Material, the debrief, New ground and Weather the row «Belongs to …» is one closed line behind the title; a tap opens the links', go: { href: '#/trips', steps: [{ sel: '[data-card-line="gd:trips"]' }] } },
  ],
  small: [{ box: 'new', text: 'A page with a short path says «‹ Today» when you came from Today; opened by a link it names its own place', go: null }],
  test: [
    'Open Trips. Behind the title stands the line «Belongs to …»; tap it: the links open.',
    'On Today open the weather: the path above the title says «Today»; tap it and you are back on Today.',
  ],
  since: [],
  de: {
    'Pages start with the title; «Back» says where you came from': 'Seiten beginnen mit dem Titel; «Zurück» nennt die Herkunft',
    'The row «Belongs to …» is a closed line behind the title now, and the path of a page names the place you came from.': 'Die Zeile «Gehört zu …» ist jetzt eine geschlossene Zeile hinter dem Titel, und der Pfad einer Seite nennt den Ort, von dem du kamst.',
    'On Packing, Trips, Me, Velos, Material, the debrief, New ground and Weather the row «Belongs to …» is one closed line behind the title; a tap opens the links': 'Auf Packen, Touren, Ich, Velos, Material, Rückblick, Neuland und Wetter ist die Zeile «Gehört zu …» eine geschlossene Zeile hinter dem Titel; ein Tipp öffnet die Links',
    'A page with a short path says «‹ Today» when you came from Today; opened by a link it names its own place': 'Eine Seite mit kurzem Pfad sagt «‹ Heute», wenn du von Heute kamst; über einen Link geöffnet nennt sie ihren eigenen Ort',
    'Open Trips. Behind the title stands the line «Belongs to …»; tap it: the links open.': 'Touren öffnen. Hinter dem Titel steht die Zeile «Gehört zu …»; antippen: die Links öffnen sich.',
    'On Today open the weather: the path above the title says «Today»; tap it and you are back on Today.': 'Auf Heute das Wetter öffnen: der Pfad über dem Titel sagt «Heute»; antippen führt zurück zu Heute.',
  },
};
