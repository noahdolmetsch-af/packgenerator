// «Bereit für unterwegs?» (Noah 02.11.2026, Schritt 6 «Offline»): the map and the voice before the start
export default {
  title: 'Ready for the ride?',
  lead: 'Before the start the live page checks that the map along the route is on your phone and that the voice is on.',
  points: [{ text: 'New card «Ready for the ride?» before the start: the map along the route (with a button to keep it) and the voice (with a switch), so a ride without signal does not catch you out', href: '#/live', go: 'f.live' }],
  small: [{ box: 'new', text: 'Nothing is forced: you can start the ride either way' }],
  test: ['Open the live page of a tour with a route, before the start: the card «Ready for the ride?» shows two rows, the map and the voice.', 'Tap «Switch the voice on»: the row turns to «The voice is on.» Tap «Keep the map»: the offline strips open right there.'],
  since: [],
  de: {
    'Ready for the ride?': 'Bereit für unterwegs?',
    'Before the start the live page checks that the map along the route is on your phone and that the voice is on.': 'Vor dem Start prüft die Live-Seite, ob die Karte entlang der Strecke auf deinem Handy ist und ob die Sprache an ist.',
    'New card «Ready for the ride?» before the start: the map along the route (with a button to keep it) and the voice (with a switch), so a ride without signal does not catch you out': 'Neue Karte «Bereit für unterwegs?» vor dem Start: die Karte entlang der Strecke (mit Knopf zum Speichern) und die Sprache (mit Schalter), damit dich eine Fahrt ohne Empfang nicht überrascht',
    'Nothing is forced: you can start the ride either way': 'Nichts ist Pflicht: Du kannst die Fahrt in jedem Fall starten',
    'Open the live page of a tour with a route, before the start: the card «Ready for the ride?» shows two rows, the map and the voice.': 'Die Live-Seite einer Tour mit Strecke vor dem Start öffnen: Die Karte «Bereit für unterwegs?» zeigt zwei Zeilen, die Karte und die Sprache.',
    'Tap «Switch the voice on»: the row turns to «The voice is on.» Tap «Keep the map»: the offline strips open right there.': '«Sprache einschalten» antippen: Die Zeile wird zu «Die Sprache ist an.» «Karte speichern» antippen: Die Offline-Streifen öffnen sich gleich dort.',
  },
};
