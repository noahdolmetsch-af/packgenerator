// «Seiten laden: Name und Ladeanzeige sofort» (Durchklick Etappe 2, Frage 5a, Noah 05.11.2026)
export default {
  title: 'Pages that load show their name at once',
  lead: 'While the code of a page loads for the first time, you see its name and the loading bike after 0.1 s, not a blank page.',
  points: [{ text: 'A page that loads slowly shows its name above the loading bike (after 0.1 s instead of 0.3 s)', go: { href: '#/gear/supplies', steps: [{ sel: 'main' }] } }],
  small: [],
  test: ['Open a page for the first time after starting the app (for example Material › Vorrat): the name of the page and the small bike on the road come at once instead of an empty screen.', 'A page you opened before still comes up at once, without the placeholder.'],
  since: [],
  de: {
    'Pages that load show their name at once': 'Seiten, die laden, zeigen gleich ihren Namen',
    'While the code of a page loads for the first time, you see its name and the loading bike after 0.1 s, not a blank page.': 'Während eine Seite zum ersten Mal lädt, siehst du nach 0,1 Sekunden ihren Namen und das Lade-Velo statt einer leeren Seite.',
    'A page that loads slowly shows its name above the loading bike (after 0.1 s instead of 0.3 s)': 'Eine Seite, die langsam lädt, zeigt ihren Namen über dem Lade-Velo (nach 0,1 statt 0,3 Sekunden)',
    'Open a page for the first time after starting the app (for example Material › Vorrat): the name of the page and the small bike on the road come at once instead of an empty screen.': 'Öffne eine Seite zum ersten Mal nach dem Start der App (zum Beispiel Material › Vorrat): Der Name der Seite und das kleine Velo auf der Strasse kommen gleich, statt eines leeren Bildschirms.',
    'A page you opened before still comes up at once, without the placeholder.': 'Eine Seite, die du schon geöffnet hast, kommt weiter sofort, ohne Platzhalter.',
  },
};
