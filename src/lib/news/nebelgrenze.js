// «Nebelgrenze» (Noah 05.11.2026 «1a 2b 3a 4b»): the top of the fog deck in m above sea level, on the weather page and on Today
export default {
  title: 'Fog line every day',
  lead: 'The fog line shows next to the weather: how high the fog reaches, and what is above it.',
  points: [
    { text: 'The weather page shows the fog line, «sun above», your place, when the fog clears and six times from 6 to 21 h', go: { href: '#/wetter', where: 'Weather › the card «Today», under the snow line (needs a home place).' } },
    { text: 'It also shows how much warmer or colder it is higher up, and the sight', go: { href: '#/wetter', where: 'Weather › the card «Today», under the fog line.' } },
    { text: 'Today has one calm line for your home place', go: { href: '#/', where: 'Today, under the snow line (needs a home place and the internet once).' } },
  ],
  small: [{ box: 'new', text: 'The line on Today can be switched off under «Set fog line»' }],
  test: [
    'Open the weather page: in the card «Today» you see the fog line (or «No fog line») under the snow line.',
    'Under «Set fog line» switch the line on Today off: it is gone on Today.',
  ],
  since: [],
  de: {
    'Fog line every day': 'Nebelgrenze jeden Tag',
    'The fog line shows next to the weather: how high the fog reaches, and what is above it.': 'Die Nebelgrenze steht neben dem Wetter: wie hoch der Nebel reicht und was darüber ist.',
    'The weather page shows the fog line, «sun above», your place, when the fog clears and six times from 6 to 21 h': 'Die Wetterseite zeigt die Nebelgrenze, «darüber Sonne», deinen Ort, wann sich der Nebel auflöst und sechs Zeitpunkte von 6 bis 21 Uhr',
    'Weather › the card «Today», under the snow line (needs a home place).': 'Wetter › Karte «Heute», unter der Schneefallgrenze (braucht einen Wohnort).',
    'It also shows how much warmer or colder it is higher up, and the sight': 'Dazu steht, wie viel wärmer oder kälter es weiter oben ist, und die Sichtweite',
    'Weather › the card «Today», under the fog line.': 'Wetter › Karte «Heute», unter der Nebelgrenze.',
    'Today has one calm line for your home place': 'Heute hat eine ruhige Zeile für deinen Wohnort',
    'Today, under the snow line (needs a home place and the internet once).': 'Heute, unter der Schneefallgrenze (braucht einen Wohnort und einmal Internet).',
    'The line on Today can be switched off under «Set fog line»': 'Die Zeile auf Heute lässt sich unter «Nebelgrenze einstellen» ausschalten',
    'Open the weather page: in the card «Today» you see the fog line (or «No fog line») under the snow line.': 'Öffne die Wetterseite: In der Karte «Heute» siehst du unter der Schneefallgrenze die Nebelgrenze (oder «Keine Nebelgrenze»).',
    'Under «Set fog line» switch the line on Today off: it is gone on Today.': 'Schalte unter «Nebelgrenze einstellen» die Zeile auf Heute aus: Auf Heute ist sie weg.',
  },
};
