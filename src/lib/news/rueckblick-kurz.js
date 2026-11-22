// «Rückblick in 30 Sekunden» (Noah 05.11.2026, Touren 3b): three questions with faces on the open debrief
export default {
  title: 'Debrief in 30 seconds',
  lead: 'A short version of the debrief for tired evenings: three questions with faces.',
  points: [{ text: 'On the open debrief: how was the ride, was the luggage right, did you miss something, then «Save the short version»', go: { href: '#/debrief', where: 'Shows at the top of the open debrief of a trip you rode.', steps: [{ sel: '[data-debrief-kurz]' }] } }],
  small: [{ box: 'new', text: 'The long debrief stays below and shows the same answers' }],
  test: [
    'Open the debrief of a tour you rode: «Debrief in 30 seconds» is at the top.',
    'Tap a face, say what was missing, tap «Save the short version»: the debrief is saved; below it you would have seen the same answers.',
  ],
  since: [],
  de: {
    'Debrief in 30 seconds': 'Rückblick in 30 Sekunden',
    'A short version of the debrief for tired evenings: three questions with faces.': 'Eine Kurzversion des Rückblicks für müde Abende: drei Fragen mit Gesichtern.',
    'On the open debrief: how was the ride, was the luggage right, did you miss something, then «Save the short version»': 'Im offenen Rückblick: wie war die Fahrt, war das Gepäck richtig, hat etwas gefehlt, dann «Kurzfassung speichern»',
    'Shows at the top of the open debrief of a trip you rode.': 'Steht oben im offenen Rückblick einer Tour, die du gefahren bist.',
    'The long debrief stays below and shows the same answers': 'Der lange Rückblick bleibt darunter und zeigt dieselben Antworten',
    'Open the debrief of a tour you rode: «Debrief in 30 seconds» is at the top.': 'Öffne den Rückblick einer gefahrenen Tour: oben steht «Rückblick in 30 Sekunden».',
    'Tap a face, say what was missing, tap «Save the short version»: the debrief is saved; below it you would have seen the same answers.': 'Tippe auf ein Gesicht, sag, was gefehlt hat, tippe «Kurzfassung speichern»: der Rückblick ist gespeichert; darunter hättest du dieselben Antworten gesehen.',
  },
};
