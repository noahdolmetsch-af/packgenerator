// «Schrittbalken bei grosser Schrift» (Noah 21.11.2026 «a»): at 200 % zoom the steps of a trip no longer break their names
export default {
  title: 'Trip steps stay readable at large zoom',
  lead: 'With a big zoom the names of the five trip steps are no longer cut in the middle of the word.',
  points: [{ text: '«Vorbereiten», «Unterwegs» and «Auswertung» stay in one piece when the window is narrow', go: null }],
  small: [],
  test: ['Open a trip and zoom the page to 200 % (Ctrl and +, or the window narrower than 1000 px).', 'The five steps stand in one row; every name is whole, the number circles are gone while it is narrow.'],
  since: [],
  de: {
    'Trip steps stay readable at large zoom': 'Die Schritte der Tour bleiben bei grosser Schrift lesbar',
    'With a big zoom the names of the five trip steps are no longer cut in the middle of the word.': 'Bei grossem Zoom werden die Namen der fünf Tour-Schritte nicht mehr mitten im Wort abgeschnitten.',
    '«Vorbereiten», «Unterwegs» and «Auswertung» stay in one piece when the window is narrow': '«Vorbereiten», «Unterwegs» und «Auswertung» bleiben ganz, wenn das Fenster schmal ist',
    'Open a trip and zoom the page to 200 % (Ctrl and +, or the window narrower than 1000 px).': 'Öffne eine Tour und zoome die Seite auf 200 % (Strg und +, oder das Fenster schmaler als 1000 px).',
    'The five steps stand in one row; every name is whole, the number circles are gone while it is narrow.': 'Die fünf Schritte stehen in einer Reihe; jeder Name ist ganz, die Zahlenkreise fehlen, solange es schmal ist.',
  },
};
