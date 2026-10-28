// «Ausprobieren» bei Neuigkeiten (Noah 27.10.2026 «1a 2a 3a 4a 5a»): every line of «What is new» goes to the exact
// place (page, window, fold), the spot glows 3 s and a line says «New here: …»; the same jump as the catalogue
export default {
  title: 'Straight to the new thing',
  lead: '«Try it» and every line of «What is new» now go to the exact place and light it up.',
  points: [{ text: 'One tap opens the page, the window or fold, and the new thing glows for 3 seconds', go: { href: '#/me/news', steps: [{ sel: '[data-news-try]' }] } }],
  small: [{ box: 'new', text: 'Where a thing only shows up at times, a line says when', go: { href: '#/live', where: 'Shows on the live map during a ride: tap «Nearby».' } }],
  test: [
    'Open Me › What is new and tap «Try it» on the newest update: the place opens and glows, a line at the bottom says «New here: …».',
    'Open an older update with «Find an update» (e.g. «areas»), tap a line: it goes to the place, not just the top of the page.',
  ],
  since: [],
  de: {
    'Straight to the new thing': 'Direkt zum Neuen',
    '«Try it» and every line of «What is new» now go to the exact place and light it up.': '«Ausprobieren» und jede Zeile in «Was ist neu» springen jetzt genau an die Stelle und lassen sie aufleuchten.',
    'One tap opens the page, the window or fold, and the new thing glows for 3 seconds': 'Ein Tipp öffnet die Seite, das Fenster oder den Aufklapper, und das Neue leuchtet 3 Sekunden',
    'Where a thing only shows up at times, a line says when': 'Wo etwas nur manchmal erscheint, sagt eine Zeile, wann',
    'Open Me › What is new and tap «Try it» on the newest update: the place opens and glows, a line at the bottom says «New here: …».':
      'Öffne Ich › Was ist neu und tippe beim neuesten Update auf «Ausprobieren»: Die Stelle öffnet sich und leuchtet, unten steht «Neu hier: …».',
    'Open an older update with «Find an update» (e.g. «areas»), tap a line: it goes to the place, not just the top of the page.':
      'Öffne ein älteres Update mit «Update oder Funktion suchen» (z. B. «Bereiche») und tippe auf eine Zeile: Sie springt an die Stelle, nicht nur oben auf die Seite.',
  },
};
