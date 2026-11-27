// «Abhaken auf einen Blick» (Noah 27.11.2026 «1a 2a 3a 4a 5a», Thread «Abhaken auf einen Blick verbessern», Schritt 1: das Raster auf Heute)
export default {
  title: 'Every activity on Today, at a glance',
  lead: 'Tick off today now shows all your activities as small fields, three per row on a phone.',
  points: [
    { text: 'All activities of «Tick off today» are visible at once, no more «All» to see the rest', go: { href: '#/', steps: [{ sel: '[data-section="haken"]' }] } },
    { text: 'The header counts «x of y» for today, and the chip «Tick off» is gone while the block is there', go: { href: '#/', steps: [{ sel: '[data-section="haken"]' }] } },
  ],
  small: [{ box: 'new', text: 'Long press on a field opens duration, place or stopwatch' }],
  test: [
    'Open Today: under the greeting «Tick off today» shows every activity you have, three per row on a phone.',
    'Tap a field: it is ticked and the header counts one more; tap «Undo» in the message or the field again to take it back.',
    'Press a field for half a second: the sheet for duration, place or stopwatch opens.',
  ],
  since: [],
  de: {
    'Every activity on Today, at a glance': 'Jede Aktivität auf Heute, auf einen Blick',
    'Tick off today now shows all your activities as small fields, three per row on a phone.': 'Heute abhaken zeigt jetzt alle deine Aktivitäten als kleine Felder, am Handy drei pro Reihe.',
    'All activities of «Tick off today» are visible at once, no more «All» to see the rest': 'Alle Aktivitäten von «Heute abhaken» sind auf einmal sichtbar, für den Rest brauchst du kein «Alle» mehr',
    'The header counts «x of y» for today, and the chip «Tick off» is gone while the block is there': 'Die Kopfzeile zählt «x von y» für heute, und der Chip «Abhaken» entfällt, solange der Block da ist',
    'Long press on a field opens duration, place or stopwatch': 'Langes Drücken auf ein Feld öffnet Dauer, Ort oder Stoppuhr',
    'Open Today: under the greeting «Tick off today» shows every activity you have, three per row on a phone.': 'Öffne Heute: unter dem Gruss zeigt «Heute abhaken» jede Aktivität, die du hast, am Handy drei pro Reihe.',
    'Tap a field: it is ticked and the header counts one more; tap «Undo» in the message or the field again to take it back.': 'Tippe ein Feld: es ist abgehakt und die Kopfzeile zählt eins mehr; tippe «Rückgängig» in der Meldung oder nochmals das Feld, um es zurückzunehmen.',
    'Press a field for half a second: the sheet for duration, place or stopwatch opens.': 'Drücke ein Feld eine halbe Sekunde: das Fenster für Dauer, Ort oder Stoppuhr öffnet sich.',
  },
};
