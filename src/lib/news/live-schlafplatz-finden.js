// Schlafplatz finden, Schritt 1 (Noah 28.10.2026 «1b 2a 3a und b 4a», Wildcampen): Dächer in der Nähe.
export default {
  title: 'Find a place to sleep',
  lead: 'On the live map: shelters, huts, bivouac boxes and bus stops with a roof around you, and your own places. Only tips.',
  points: [
    { text: '«⋯» › «Find a place to sleep»: the roofs around you, nearest first, with «Go there»', go: 'f.findsleep' },
    { text: 'Save where you stand as your own place to sleep; rename and delete it, with Undo', go: 'f.findsleep' },
  ],
  small: [{ box: 'new', text: 'Find a place to sleep on the live map', go: 'f.findsleep' }],
  test: ['Start a ride, tap «⋯» › «Schlafplatz finden» › «In meiner Nähe suchen»: the roofs around you show, nearest first, with the distance.', 'Type a name, tap «Als Schlafplatz speichern»: it is in the list; «Hingehen» plans the way to a place.'],
  since: ['f.findsleep'],
  de: {
    'Find a place to sleep': 'Schlafplatz finden',
    'On the live map: shelters, huts, bivouac boxes and bus stops with a roof around you, and your own places. Only tips.': 'Auf der Live-Karte: Unterstände, Hütten, Biwakschachteln und überdachte Haltestellen um dich und deine eigenen Plätze. Nur Tipps.',
    '«⋯» › «Find a place to sleep»: the roofs around you, nearest first, with «Go there»': '«⋯» › «Schlafplatz finden»: die Dächer um dich, das nächste zuerst, mit «Hingehen»',
    'Save where you stand as your own place to sleep; rename and delete it, with Undo': 'Speichere, wo du stehst, als eigenen Schlafplatz; umbenennen und löschen, mit Rückgängig',
    'Find a place to sleep on the live map': 'Schlafplatz finden auf der Live-Karte',
    'Start a ride, tap «⋯» › «Schlafplatz finden» › «In meiner Nähe suchen»: the roofs around you show, nearest first, with the distance.': 'Eine Fahrt starten, «⋯» › «Schlafplatz finden» › «In meiner Nähe suchen» tippen: die Dächer um dich erscheinen, das nächste zuerst, mit der Distanz.',
    'Type a name, tap «Als Schlafplatz speichern»: it is in the list; «Hingehen» plans the way to a place.': 'Einen Namen eingeben, «Als Schlafplatz speichern» tippen: er steht in der Liste; «Hingehen» plant den Weg zu einem Ort.',
  },
};
