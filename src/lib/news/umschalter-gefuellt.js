// «Umschalter gefüllt» (Noah 23.11.2026 «1-5 a», Thread «App an Mein-Tag-Design angleichen»): chosen = filled in the main colour
export default {
  title: 'The chosen button is filled',
  lead: 'In every switch (like «12 months · 2026 · All») the chosen button is now filled in the main colour, so you see at once what is chosen.',
  points: [{ text: 'The chosen button of a switch or a filter chip is filled in the main colour', go: { href: '#/review', steps: [{ sel: '.seg button[aria-pressed="true"]' }], where: 'Tours › Look back, the switch «12 months · year · All» under the title.' } }],
  small: [],
  test: ['Open Tours › Look back: in the switch «12 months · year · All» the chosen button is filled in the main colour.', 'Tap another button: the colour glides to it and the text stays readable.'],
  since: [],
  de: {
    'The chosen button is filled': 'Das gewählte Feld ist gefüllt',
    'In every switch (like «12 months · 2026 · All») the chosen button is now filled in the main colour, so you see at once what is chosen.': 'In jedem Umschalter (zum Beispiel «12 Monate · 2026 · Alle») ist das gewählte Feld jetzt in der Hauptfarbe gefüllt. So siehst du sofort, was gewählt ist.',
    'The chosen button of a switch or a filter chip is filled in the main colour': 'Das gewählte Feld eines Umschalters und der gewählte Filter-Chip sind in der Hauptfarbe gefüllt',
    'Tours › Look back, the switch «12 months · year · All» under the title.': 'Touren › Rückblick, der Umschalter «12 Monate · Jahr · Alle» unter dem Titel.',
    'Open Tours › Look back: in the switch «12 months · year · All» the chosen button is filled in the main colour.': 'Öffne Touren › Rückblick: im Umschalter «12 Monate · Jahr · Alle» ist das gewählte Feld in der Hauptfarbe gefüllt.',
    'Tap another button: the colour glides to it and the text stays readable.': 'Tippe ein anderes Feld an: die Farbe gleitet dorthin und die Schrift bleibt gut lesbar.',
  },
};
